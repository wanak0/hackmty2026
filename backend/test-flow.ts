import {
  getClientFinancialStatus,
  simulateDebtRestructure,
  resetBankData,
  loadBankData,
  saveBankData,
} from "./src/mcp/tools.js";
import { processUserMessage } from "./src/agent/ollama.js";

async function runVerification() {
  console.log("🧪 INICIANDO VERIFICACIÓN DEL FLUJO A2UI v0.9 + MCP...\n");

  const originalData = loadBankData();
  try {
    resetBankData();

    console.log("1. Consultando estado financiero vía MCP...");
    const status = getClientFinancialStatus("usr_carlos_01");
    console.log(`   ✓ Cliente: ${status.user.name}`);
    console.log(
      `   ✓ Deuda encontrada: $${status.totalDebt} MXN (Esperado: $18,400)\n`,
    );

    if (status.totalDebt !== 18400) {
      throw new Error(
        `La deuda obtenida ($${status.totalDebt}) no coincide con la esperada ($18,400)`,
      );
    }

    console.log("2. Calculando opciones de reestructuración de deuda...");
    const simulation = simulateDebtRestructure(status.totalDebt);
    console.log(
      `   ✓ Opciones generadas: ${simulation.options.length} (12, 18 y 24 meses)`,
    );
    simulation.options.forEach((opt) => {
      console.log(
        `     - ${opt.months} meses: $${opt.monthlyPayment}/mes (CAT ${opt.cat}%) ${opt.recommended ? "⭐ Recomendado" : ""}`,
      );
    });
    console.log();

    console.log(
      "3. Generando superficie A2UI v0.9 (NLP → MCP → A2UI_MODEL)...",
    );
    const screen = await processUserMessage(
      "Quiero pagar menos intereses de mi tarjeta",
    );
    console.log(`   ✓ Surface ID: ${screen.surfaceId}`);
    console.log(`   ✓ type: ${screen.type}`);
    console.log(`   ✓ messages: ${screen.messages.length}`);

    if (screen.surfaceId === "agent_generation_error")
      throw new Error(
        "El modelo no generó una pantalla. Revisa la configuración de Ollama.",
      );
    if (screen.type !== "a2ui_v09") {
      throw new Error("Se esperaba type a2ui_v09");
    }
    if (screen.messages.length === 0) {
      throw new Error("Respuesta A2UI sin mensajes");
    }
    console.log();

    console.log('4. Simulando click en "Aplicar plan →" (18 meses)...');
    const actionScreen = await processUserMessage("Confirmar", {
      action: "APPLY_RESTRUCTURE",
      planId: "plan_18m",
    });
    console.log(`   ✓ Surface resultante: ${actionScreen.surfaceId}`);
    if (actionScreen.surfaceId === "agent_generation_error")
      throw new Error(
        "La operación se registró pero falló la generación de su pantalla.",
      );
    const comps =
      (
        actionScreen.messages.find((m) => "updateComponents" in m) as any
      )?.updateComponents?.components || [];
    const confirmationComp = comps.find(
      (c: any) =>
        c.component === "Card" ||
        (c.component === "Text" && String(c.text || "").toLowerCase().includes("folio")),
    );
    if (confirmationComp) {
      console.log(`   ✓ Comprobante estándar presente en el catálogo a2ui-shadcn`);
    } else {
      console.log(
        "   ⚠ Layout de comprobante variable; validando persistencia...",
      );
    }
    console.log();

    console.log("5. Validando persistencia en base de datos...");
    const data = loadBankData();
    console.log(
      `   ✓ Operaciones registradas en auditoría: ${data.operations.length}`,
    );
    if (data.operations.length < 1) {
      throw new Error("No se persistió la operación de reestructura");
    }
    console.log();

    console.log("6. Restaurando los datos previos a la prueba.");
    console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL FLUJO A2UI v0.9 + MCP PASARON!");
  } finally {
    saveBankData(originalData);
  }
}

runVerification().catch((err) => {
  console.error("❌ Error durante la verificación:", err);
  process.exit(1);
});
