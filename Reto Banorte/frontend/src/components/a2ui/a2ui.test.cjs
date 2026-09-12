// Run from frontend: npm test
// In-memory React regression checks. No backend calls or fixture writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(
    fs.readFileSync(filename, 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }
  ).outputText, filename);
}
const { act, create } = require('react-test-renderer');
const { A2UIRenderer } = require('./A2UIRenderer.tsx');
const { ConfirmationCard } = require('./ConfirmationCard.tsx');
const { MetricComparison } = require('./MetricComparison.tsx');
const { transferErrors } = require('./TransferCard.tsx');
const text = node => typeof node === 'string' ? node : (node.children || []).map(text).join('');
const component = (type, props, id = type) => ({ id, type, props });
const screen = (components, screenId = 'test') => ({ type: 'a2ui_screen', screenId, assistantMessage: '', components });
const events = [];
const onAction = (type, payload) => events.push({ type, payload });
let tree;
const show = value => act(() => {
  if (tree) tree.update(React.createElement(A2UIRenderer, { screen: value, onAction }));
  else tree = create(React.createElement(A2UIRenderer, { screen: value, onAction }));
});
const button = label => tree.root.findAllByType('button').find(node => text(node).includes(label));
const change = (node, value) => act(() => node.props.onChange({ target: { value } }));
const click = node => act(() => node.props.onClick());

const plans = screen([
  component('PlanOptionList', { selectedPlanId: 'plan_18m', options: [{ planId: 'plan_12m', months: 12, monthlyPayment: 100, cat: 20 }, { planId: 'plan_18m', months: 18, monthlyPayment: 80, cat: 22, recommended: true }] }),
  component('ActionButton', { label: 'Aplicar plan', actionType: 'APPLY_RESTRUCTURE', planId: 'plan_18m', defaultPlanId: 'plan_18m' })
]);
show(plans);
assert.ok(tree.root.findAllByType('input').every(node => !node.props.checked));
assert.equal(button('Aplicar plan').props.disabled, true);
click(button('Aplicar plan'));
assert.equal(events.length, 0);
change(tree.root.findAllByType('input')[0], 'plan_12m');
click(button('Aplicar plan'));
assert.equal(events.pop().payload.planId, 'plan_12m', 'Explicit selection overrides server defaults.');
act(() => tree.update(React.createElement(A2UIRenderer, { screen: plans, onAction, loading: true })));
assert.equal(button('Procesando').props.disabled, true);
show(plans);
assert.equal(tree.root.findAllByType('input')[0].props.checked, true, 'Loading renders preserve selection.');
show(JSON.parse(JSON.stringify(plans)));
assert.ok(tree.root.findAllByType('input').every(node => !node.props.checked), 'New response with identical IDs resets selection.');

const transferFixture = screen([
  component('TransferCard', { recipient: 'Mamá (Rosa Mendoza)', amount: 1000.50, concept: 'Apoyo familiar', sourceAccount: 'Cuenta 9921', isNewContact: false, clabe: '072580012345678901' }),
  component('ActionButton', { label: 'Enviar $500', actionType: 'CONFIRM_TRANSFER', amount: 500, recipient: 'Otro' })
], 'transfer_form');
const originalFixture = JSON.stringify(transferFixture);
show(transferFixture);
assert.equal(button('Confirmar envío').props.disabled, false, 'Known unchanged mock CLABE is trusted.');
click(button('Confirmar envío'));
assert.deepEqual(events.pop(), { type: 'CONFIRM_TRANSFER', payload: { label: 'Enviar $500', actionType: 'CONFIRM_TRANSFER', amount: 1000.5, recipient: 'Mamá (Rosa Mendoza)', concept: 'Apoyo familiar', clabe: '072580012345678901' } });
const amountInput = () => tree.root.findAllByType('input').find(node => node.props.inputMode === 'decimal');
const accountInput = () => tree.root.findAllByType('input').find(node => node.props.inputMode === 'numeric');
change(accountInput(), '072580012345678902');
assert.equal(button('Confirmar transferencia').props.disabled, true, 'Edited mock destination must pass validation.');
change(accountInput(), '');
assert.equal(button('Confirmar transferencia').props.disabled, true, 'Deleting a supplied destination is an edit.');
change(accountInput(), '072580012345678901');
assert.equal(button('Confirmar envío').props.disabled, false);
for (const invalid of ['0', '-1', '', '1.001', 'Infinity', '1e3']) {
  change(amountInput(), invalid);
  assert.equal(button('Confirmar transferencia').props.disabled, true, 'Reject amount: ' + invalid);
  click(button('Confirmar transferencia'));
  assert.equal(events.length, 0);
}
change(amountInput(), '1500.75');
click(button('Confirmar envío'));
assert.equal(events.pop().payload.amount, 1500.75);
show({ ...transferFixture });
assert.equal(amountInput().props.value, '1000.5', 'Transfer values reset per response.');
change(tree.root.findAllByType('input').find(node => node.props.value === 'Mamá (Rosa Mendoza)'), 'Ana');
assert.equal(button('Confirmar transferencia').props.disabled, true, 'A changed recipient cannot inherit contact trust.');
assert.equal(JSON.stringify(transferFixture), originalFixture);
const validNew = { recipient: 'Ana', amount: 12.50, concept: 'Prueba', clabe: '032180000118359719' };
assert.ok(Object.values(transferErrors(validNew, false, 'Cuenta')).every(error => !error));
assert.ok(transferErrors({ ...validNew, clabe: '000000000000000000' }, false, 'Cuenta').clabe);

const simulation = screen([
  component('InvestmentSimulator', { amount: 25000, initialDays: 180, options: [{ id: 'pag', name: 'Pagaré', tag: 'Simulación', annualRate: 7, termDays: 180, profitNet: 100, totalFinal: 25100, recommended: true }] }),
  component('ActionButton', { label: 'Invertir', actionType: 'CONFIRM_INVESTMENT' })
], 'investment_simulator');
show(simulation);
assert.equal(tree.root.findAllByType('button').filter(node => text(node) === 'Calcular rendimiento').length, 1);
assert.equal(button('180 días').props['aria-pressed'], true);
change(tree.root.findAllByType('input').find(node => node.props.type === 'range'), '30000');
click(button('91 días'));
assert.equal(events.length, 0, 'Sliders and term buttons do not request calculations.');
assert.equal(tree.root.findAllByType('article').length, 0, 'Old yields are hidden after editing parameters.');
click(button('Calcular rendimiento'));
assert.deepEqual(events.pop(), { type: 'SIMULATE_INVESTMENT', payload: { amount: 30000, days: 91 } });
show({ ...simulation });
assert.equal(amountInput().props.value, '25000');
assert.equal(button('180 días').props['aria-pressed'], true);

const receipt = { operationId: 'SPEI-BNTE-123', cardName: 'Cuenta', last4: '9921', months: 18, monthlyQuota: 1000.5, appliedAt: 'Hoy', nextPaymentDate: 'Saldo restante: 500 MXN' };
const receiptHtml = renderToStaticMarkup(React.createElement(ConfirmationCard, receipt));
assert.match(receiptHtml, /Monto transferido/);
assert.match(receiptHtml, /1,000\.50 MXN/);
assert.doesNotMatch(receiptHtml, /Mensualidad|meses|reestructuraci[oó]n|Próximo pago/i);
assert.match(receiptHtml, /Saldo restante: 500 MXN/);
const metricsHtml = renderToStaticMarkup(React.createElement(MetricComparison, { balance: 18400, currentCat: 32.4, preferentialCat: 34.1 }));
assert.match(metricsHtml, /Propuesto/);
assert.match(metricsHtml, /No calculado/);
assert.doesNotMatch(metricsHtml, /Preferencial|NaN|undefined|4,900/);
const absentMetrics = renderToStaticMarkup(React.createElement(MetricComparison, { balance: NaN, currentCat: NaN, preferentialCat: NaN, estimatedSavings: NaN }));
assert.doesNotMatch(absentMetrics, /NaN|undefined/);
show(screen([component('QuickSuggestions', { suggestions: ['Ver saldos'] }), component('ActionList', { actions: [{ label: 'Movimientos', actionType: 'VIEW_TRANSACTIONS' }] })]));
click(button('Ver saldos'));
assert.deepEqual(events.pop(), { type: 'USER_PROMPT', payload: { text: 'Ver saldos' } });
click(button('Movimientos'));
assert.deepEqual(events.pop(), { type: 'VIEW_TRANSACTIONS', payload: { text: 'Movimientos' } });
act(() => tree.unmount());
console.log('PASS: selección explícita, reinicio por respuesta, transferencia Mamá $1,000.50, ediciones y validación, simulación por botón, recibo SPEI y eventos existentes. Sin solicitudes al backend.');
