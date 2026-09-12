import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeA2UIScreen, processUserMessage, type A2UIScreen } from './src/agent/gemini.js';
import { simulateDebtRestructure, simulateInvestmentPortfolio, type BankData } from './src/mcp/tools.js';
import { SYSTEM_PROMPT } from './src/agent/prompts.js';

const fixturePath = path.resolve(__dirname, 'src/data/mock_bank.json');
const component = (screen: A2UIScreen, type: string) => {
  const result = screen.components.find((item) => item.type === type);
  assert.ok(result, `Falta el componente ${type}`);
  return result.props;
};

test('regresiones del agente con almacenamiento aislado en memoria', async (t) => {
  const originalRead = fs.readFileSync.bind(fs);
  const fixtureBefore = originalRead(fixturePath, 'utf8');
  const originalKey = process.env.GEMINI_API_KEY;
  let data: BankData;
  let writes = 0;
  const resetMemory = () => {
    data = JSON.parse(fixtureBefore);
    data.users.find((user) => user.id === 'usr_carlos_01')!.checkingBalance = 14500;
    data.creditCards.find((card) => card.id === 'crd_carlos_oro')!.currentBalance = 9200;
    writes = 0;
    process.env.GEMINI_API_KEY = '';
  };
  resetMemory();
  t.mock.method(fs, 'readFileSync', ((file: any, ...args: any[]) => {
    if (String(file) === fixturePath) return JSON.stringify(data);
    return (originalRead as any)(file, ...args);
  }) as typeof fs.readFileSync);
  t.mock.method(fs, 'writeFileSync', ((file: any, content: any) => {
    assert.equal(String(file), fixturePath, 'No se permiten escrituras a disco en estas pruebas');
    data = JSON.parse(String(content));
    writes++;
  }) as typeof fs.writeFileSync);

  try {
    await t.test('reconoce inversión con y sin tilde; distingue monto y días', async () => {
      for (const message of ['inversión', 'inversion', 'Quiero una INVERSIÓN', 'Simular inversión a 28 días de $1,000.50']) {
        const screen = await processUserMessage(message);
        assert.equal(screen.screenId, 'investment_simulator');
        const props = component(screen, 'InvestmentSimulator');
        assert.equal(props.amount, message.includes('28') ? 1000.5 : 25000);
        assert.equal(props.initialDays, message.includes('28') ? 28 : 91);
        assert.match(component(screen, 'HeaderBadge').tag, /demo/i);
        assert.deepEqual(screen.components.map((item) => item.type), ['HeaderBadge', 'InvestmentSimulator']);
        assert.doesNotMatch(JSON.stringify(screen), /garantizado|IPAB|riesgo m[ií]nimo|capital asegurado/i);
      }
      assert.equal(writes, 0);
    });

    await t.test('SIMULATE_INVESTMENT recalcula monto, plazo y opciones sin contratar', async () => {
      for (const [amount, days] of [[1000.5, 28], [50000, 180], [75000, 360]]) {
        const screen = await processUserMessage('', { action: 'SIMULATE_INVESTMENT', amount, days });
        const props = component(screen, 'InvestmentSimulator');
        assert.equal(screen.screenId, 'investment_simulator');
        assert.equal(props.amount, amount);
        assert.deepEqual(screen.components.map((item) => item.type), ['HeaderBadge', 'InvestmentSimulator']);
        assert.equal(props.initialDays, days);
        const expected = simulateInvestmentPortfolio(amount, days).options;
        assert.deepEqual(props.options, expected.map((option) => ({ ...option, tag: 'Estimación de demo' })));
        assert.equal(screen.components.some((item) => item.type === 'ConfirmationCard'), false);
      }
      assert.equal(writes, 0);
    });

    await t.test('rechaza feedback inválido y CONFIRM_INVESTMENT nunca genera éxito ni folio', async () => {
      for (const payload of [{}, { amount: 0, days: 28 }, { amount: -1, days: 28 }, { amount: Infinity, days: 28 }, { amount: 1000, days: 0 }, { amount: 1000, days: 1.5 }, { amount: 'abc', days: 28 }]) {
        const screen = await processUserMessage('', { action: 'SIMULATE_INVESTMENT', ...payload });
        assert.equal(screen.screenId, 'investment_invalid');
      }
      for (const payload of [{}, { amount: 30000, days: 180 }]) {
        const screen = await processUserMessage('', { action: 'CONFIRM_INVESTMENT', ...payload });
        assert.equal(screen.screenId, 'investment_simulator');
        assert.match(screen.assistantMessage, /No se realizó ninguna inversión/);
        assert.deepEqual(screen.components.map((item) => item.type), ['HeaderBadge', 'InvestmentSimulator']);
        assert.doesNotMatch(JSON.stringify(screen), /investment_success|operationId|INV-BNTE|ConfirmationCard/);
      }
      assert.equal(writes, 0);
    });

    await t.test('transferencias interpretan miles y centavos, incluso al mencionar dinero', async () => {
      for (const [message, amount] of [
        ['Transferir 1,000 a mi mamá', 1000],
        ['Enviar dinero $1,000.50 a mi mamá', 1000.5],
        ['Transferir $3,500.50 a Juan', 3500.5],
        ['Transferir 450 a mi mamá', 450]
      ] as const) {
        const screen = await processUserMessage(message);
        assert.equal(screen.screenId, 'transfer_form');
        assert.equal(component(screen, 'TransferCard').amount, amount);
        assert.equal(component(screen, 'ActionButton').amount, amount);
        assert.doesNotMatch(screen.assistantMessage, /NLP|A2UI|core bancario/i);
      }
      assert.equal(writes, 0);
    });

    await t.test('Quiero transferir dinero abre el formulario sin monto ni destinatario, con o sin Gemini', async () => {
      resetMemory();
      for (const key of ['', 'test-key-never-used']) {
        process.env.GEMINI_API_KEY = key;
        const screen = await processUserMessage('Quiero transferir dinero');
        assert.equal(screen.screenId, 'transfer_form');
        const props = component(screen, 'TransferCard');
        assert.equal(props.amount, null);
        assert.equal(props.recipient, '');
        assert.equal(props.concept, '');
        assert.equal(props.clabe, '');
        assert.equal(props.isNewContact, true);
        const button = component(screen, 'ActionButton');
        assert.equal(button.actionType, 'CONFIRM_TRANSFER');
        assert.equal(button.amount, null);
        assert.equal(button.recipient, '');
        assert.doesNotMatch(JSON.stringify(screen), /500|Mamá|Rosa|Nuevo Destinatario|TransactionTable/);
      }
      process.env.GEMINI_API_KEY = '';
      const normalized = normalizeA2UIScreen({ components: [{ type: 'TransferCard', props: {} }] });
      assert.equal(component(normalized, 'TransferCard').amount, null);
      assert.equal(component(normalized, 'TransferCard').recipient, '');
      for (const payload of [{ amount: 1000 }, { amount: 1000, recipient: '  ', concept: 'Prueba' }, { recipient: 'Mamá', concept: 'Prueba' }]) {
        const result = await processUserMessage('', { action: 'CONFIRM_TRANSFER', ...payload });
        assert.equal(result.screenId, 'transfer_invalid');
      }
      assert.equal(writes, 0);
    });

    await t.test('Quiero simular una inversión de $10,000 conserva el monto original', async () => {
      resetMemory();
      const screen = await processUserMessage('Quiero simular una inversión de $10,000');
      assert.equal(screen.screenId, 'investment_simulator');
      assert.equal(component(screen, 'InvestmentSimulator').amount, 10000);
      assert.equal(component(screen, 'InvestmentSimulator').initialDays, 91);
      assert.equal(writes, 0);
    });

    await t.test('confirmación de transferencia registra solo en memoria y explica la demo', async () => {
      resetMemory();
      const screen = await processUserMessage('', { action: 'CONFIRM_TRANSFER', recipient: 'Mamá', amount: '1,000.50', concept: 'Prueba' });
      assert.equal(screen.screenId, 'transfer_success');
      assert.equal(writes, 1);
      assert.equal(data.users.find((user) => user.id === 'usr_carlos_01')!.checkingBalance, 13499.5);
      assert.match(component(screen, 'AlertBanner').message, /13,499.5/);
      assert.doesNotMatch(JSON.stringify(screen), /oficial|ConfirmationCard|SPEI exitosa/i);
      for (const amount of [-1, 0, NaN, 'incorrecto', 999999]) {
        const result = await processUserMessage('', { action: 'CONFIRM_TRANSFER', amount, recipient: 'Mamá', concept: 'Prueba' });
        assert.notEqual(result.screenId, 'transfer_success');
      }
      assert.equal(writes, 1);
    });

    await t.test('reestructura usa la simulación del saldo de la tarjeta, incluso con otras tarjetas', async () => {
      for (const planId of ['plan_12m', 'plan_18m', 'plan_24m']) {
        resetMemory();
        data.creditCards.push({ ...data.creditCards[0], id: 'otra_tarjeta', currentBalance: 99999 });
        const expected = simulateDebtRestructure(9200).options.find((plan) => plan.planId === planId)!;
        const preview = await processUserMessage('Quiero reestructurar el saldo de mi deuda');
        assert.equal(component(preview, 'MetricComparison').balance, 9200);
        assert.equal(component(preview, 'PlanOptionList').options.find((plan: any) => plan.planId === planId).monthlyPayment, expected.monthlyPayment);
        const normalized = normalizeA2UIScreen({ components: [{ type: 'PlanOptionList', props: {
          cardId: 'crd_carlos_oro', selectedPlanId: planId, options: [{ planId, monthlyPayment: 99999 }]
        } }] });
        assert.equal(component(normalized, 'PlanOptionList').options.find((plan: any) => plan.planId === planId).monthlyPayment, expected.monthlyPayment);
        assert.equal(component(normalized, 'PlanOptionList').selectedPlanId, planId);
        const screen = await processUserMessage('', { action: 'APPLY_RESTRUCTURE', planId });
        const operation = data.operations.at(-1);
        assert.equal(operation.monthlyQuota, expected.monthlyPayment);
        assert.equal(operation.months, expected.months);
        assert.equal(writes, 1);
        assert.match(screen.assistantMessage, /datos de prueba/);
        assert.doesNotMatch(JSON.stringify(screen), /core bancario|oficial|congelad|8 de Octubre|ConfirmationCard/i);
      }
      resetMemory();
      for (const context of [{ planId: 'plan_inventado' }, { cardId: 'inexistente' }]) {
        assert.equal((await processUserMessage('', { action: 'APPLY_RESTRUCTURE', ...context })).screenId, 'restructure_unavailable');
      }
      assert.equal(writes, 0);
    });

    await t.test('CAT actual 32.4 elimina ahorro y recomendación si la propuesta no lo reduce', async () => {
      resetMemory();
      const card = data.creditCards.find((item) => item.id === 'crd_carlos_oro')!;
      card.catAnnual = 32.4;
      card.currentBalance = 18400;
      const coreBefore = simulateDebtRestructure(card.currentBalance);
      const fallback = await processUserMessage('Quiero pagar menos intereses de mi tarjeta');
      const generated = normalizeA2UIScreen({ assistantMessage: 'Ahorrarás $4,900 con una tasa preferencial.', components: [
        { type: 'MetricComparison', props: { currentCat: 54.2, preferentialCat: 34.1, estimatedSavings: 4900 } },
        { type: 'PlanOptionList', props: { cardId: card.id, selectedPlanId: 'plan_18m' } }
      ] });
      for (const screen of [fallback, generated]) {
        const metrics = component(screen, 'MetricComparison');
        assert.equal(metrics.currentCat, 32.4);
        assert.equal(metrics.preferentialCat, 34.1);
        assert.equal(metrics.estimatedSavings, undefined);
        for (const option of component(screen, 'PlanOptionList').options) {
          assert.equal(option.estimatedSavings, undefined);
          assert.equal(option.recommended, undefined);
        }
        assert.match(component(screen, 'AlertBanner').message, /no reducen el CAT actual de 32.4%/);
        assert.doesNotMatch(JSON.stringify(screen), /4900|4,900|Ahorrarás|"estimatedSavings"|"recommended"/);
      }
      // Una opción que sí baja el CAT conserva su estimación; igualdad tampoco es mejora.
      card.catAnnual = 34.1;
      const mixed = await processUserMessage('Reestructurar mi deuda');
      const options = component(mixed, 'PlanOptionList').options;
      assert.equal(options[0].estimatedSavings, coreBefore.options[0].estimatedSavings);
      assert.equal(options[1].estimatedSavings, undefined);
      card.catAnnual = 54.2;
      const lowerCat = await processUserMessage('Reestructurar mi deuda');
      assert.equal(component(lowerCat, 'MetricComparison').estimatedSavings, 4900);
      assert.equal(component(lowerCat, 'PlanOptionList').options[1].recommended, true);
      assert.deepEqual(simulateDebtRestructure(card.currentBalance), coreBefore);
      assert.equal(writes, 0);
    });

    await t.test('saldo muestra el valor almacenado, incluidos cero y centavos, antes de Gemini', async () => {
      resetMemory();
      process.env.GEMINI_API_KEY = 'test-key-never-used';
      for (const balance of [0, 2345.67]) {
        data.users.find((user) => user.id === 'usr_carlos_01')!.checkingBalance = balance;
        for (const message of ['¿Cuál es mi saldo?', '¿Cuánto dinero tengo?', '¿Cuánto me queda?']) {
          const screen = await processUserMessage(message);
          assert.equal(screen.screenId, 'balance_summary');
          component(screen, 'HeaderBadge');
          component(screen, 'QuickSuggestions');
          assert.ok(component(screen, 'AlertBanner').message.includes(`$${balance.toLocaleString('es-MX')} MXN`));
          assert.ok(component(screen, 'AlertBanner').message.includes('$9,200 MXN'));
        }
      }
      assert.equal(writes, 0);
    });

    await t.test('normalización recalcula inversión sin renombrar productos ni exponer garantías', () => {
      const screen = normalizeA2UIScreen({ components: [{ type: 'InvestmentSimulator', props: {
        amount: 30000, initialDays: 28, options: [{ name: 'Inventado', profitNet: 999999, tag: 'Garantizado' }]
      } }] });
      const props = component(screen, 'InvestmentSimulator');
      assert.equal(props.options[0].name, 'Pagaré Banorte Tradicional');
      assert.equal(props.options[0].profitNet, simulateInvestmentPortfolio(30000, 28).options[0].profitNet);
      assert.doesNotMatch(JSON.stringify(screen), /Garantizado/);
      assert.match(component(screen, 'AlertBanner').message, /Demo/);
    });

    await t.test('conserva la ruta generativa y sus contratos sin llamadas externas', async (subtest) => {
      resetMemory();
      process.env.GEMINI_API_KEY = 'test-key';
      let calls = 0;
      subtest.mock.method(GoogleGenerativeAI.prototype, 'getGenerativeModel', ((config: any) => {
        assert.equal(config.systemInstruction, SYSTEM_PROMPT);
        return { generateContent: async (prompt: string) => {
          calls++;
          assert.match(prompt, /DATOS ACTUALES DE LA DEMO/);
          return { response: { text: () => JSON.stringify({
            screenId: 'generated_investment', assistantMessage: 'Simulación de demo.',
            components: [{ type: 'InvestmentSimulator', props: { amount: 30000, initialDays: 180 } }]
          }) } };
        } };
      }) as any);
      const screen = await processUserMessage('Simular inversión de $30,000 a 180 días');
      assert.equal(calls, 1);
      assert.equal(screen.screenId, 'generated_investment');
      assert.equal(component(screen, 'InvestmentSimulator').initialDays, 180);
      assert.equal(writes, 0);
    });
  } finally {
    t.mock.restoreAll();
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    assert.equal(originalRead(fixturePath, 'utf8'), fixtureBefore, 'El fixture debe quedar idéntico');
  }
});
