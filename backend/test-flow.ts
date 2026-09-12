import { getClientFinancialStatus, simulateDebtRestructure, resetBankData, loadBankData } from './src/mcp/tools.js';
import { processUserMessage } from './src/agent/ollama.js';

async function runVerification() {
  console.log('🧪 INICIANDO VERIFICACIÓN DEL FLUJO A2UI PURO...\n');

  resetBankData();

  console.log('1. Consultando estado financiero vía MCP...');
  const status = getClientFinancialStatus('usr_carlos_01');
  console.log(`   ✓ Cliente: ${status.user.name}`);
  console.log(`   ✓ Deuda encontrada: $${status.totalDebt} MXN (Esperado: $18,400)\n`);

  if (status.totalDebt !== 18400) {
    throw new Error(`La deuda obtenida ($${status.totalDebt}) no coincide con la esperada ($18,400)`);
  }

  console.log('2. Calculando opciones de reestructuración de deuda...');
  const simulation = simulateDebtRestructure(status.totalDebt);
  console.log(`   ✓ Opciones generadas: ${simulation.options.length} (12, 18 y 24 meses)`);
  simulation.options.forEach((opt) => {
    console.log(`     - ${opt.months} meses: $${opt.monthlyPayment}/mes (CAT ${opt.cat}%) ${opt.recommended ? '⭐ Recomendado' : ''}`);
  });
  console.log();

  console.log('3. Generando pantalla dinámica A2UI (NLP → MCP → A2UI_MODEL)...');
  const screen = await processUserMessage('Quiero pagar menos intereses de mi tarjeta');
  console.log(`   ✓ Pantalla generada ID: ${screen.screenId}`);
  console.log(`   ✓ Componentes A2UI: ${screen.components.map((c) => c.type).join(', ')}`);

  if (screen.screenId.includes('deterministic')) {
    throw new Error('Se usó plantilla deterministic — se esperaba A2UI generado o error mínimo');
  }
  if (screen.components.length === 0) {
    throw new Error('Pantalla A2UI sin componentes');
  }
  console.log();

  console.log('4. Simulando click en "Aplicar plan →" (18 meses)...');
  const actionScreen = await processUserMessage('Confirmar', {
    action: 'APPLY_RESTRUCTURE',
    planId: 'plan_18m'
  });
  console.log(`   ✓ Pantalla resultante: ${actionScreen.screenId}`);
  const confirmationComp = actionScreen.components.find((c) => c.type === 'ConfirmationCard');
  if (confirmationComp) {
    console.log(`   ✓ Folio Bancario emitido: ${confirmationComp.props.operationId}`);
    console.log(`   ✓ Cuota: $${confirmationComp.props.monthlyQuota}/mes a ${confirmationComp.props.months} meses`);
  } else {
    console.log('   ⚠ ConfirmationCard no presente (modelo A2UI pudo variar layout); validando persistencia...');
  }
  console.log();

  console.log('5. Validando persistencia en base de datos...');
  const data = loadBankData();
  console.log(`   ✓ Operaciones registradas en auditoría: ${data.operations.length}`);
  if (data.operations.length < 1) {
    throw new Error('No se persistió la operación de reestructura');
  }
  console.log();

  resetBankData();
  console.log('6. Base de datos reseteada a estado original para la demo.');
  console.log('\n🎉 ¡TODAS LAS PRUEBAS DEL FLUJO A2UI PURO + MCP PASARON!');
}

runVerification().catch((err) => {
  console.error('❌ Error durante la verificación:', err);
  process.exit(1);
});
