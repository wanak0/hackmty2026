# Tu banca, más clara

Prototipo para el reto Banorte × Tec, HackMTY 2026. La interfaz toma como referencia visual Santander; los productos, las herramientas bancarias y los datos de demostración conservan su identidad Banorte. No es una aplicación oficial de ninguna de las dos instituciones.

## Ejecutar

Requiere Node.js 20 o superior y npm. Verificado con Node.js 24.

```bash
npm run install:all
npm run dev
```

Abre [la aplicación local](http://localhost:5173). La API escucha en el puerto 3001. Vite reenvía las solicitudes `/api` al backend.

Para usar el modelo generativo, crea `backend/.env` a partir de `backend/.env.example` y configura `GEMINI_API_KEY`. Sin esa clave, la aplicación utiliza el clasificador determinístico local. Nunca pongas la clave en el frontend ni en una variable `VITE_*`.

## Experiencia implementada

- Inicio con saldo disponible, tarjeta de crédito y últimos movimientos, leídos del backend.
- Entrada en lenguaje cotidiano y accesos para transferencias, gastos, tarjeta y ahorro.
- Respuestas A2UI con formularios editables, selección explícita de planes y errores visibles.
- Simulador con monto y plazo. `SIMULATE_INVESTMENT` envía ambos valores al backend y actualiza los resultados.
- Letra grande, navegación por teclado, etiquetas de campos, ayuda con diálogo nativo, reducción de movimiento y diseño adaptable.
- Importes ocultables en el resumen de cuentas y últimos movimientos. Este control no oculta los datos del formulario activo.

La pantalla inicial sustituye la antigua landing. `CODEX_HANDOFF.md` se conserva como referencia histórica del proyecto recibido; esta documentación describe el estado actual.

## Verificar

```bash
npm test
npm run build
```

Las pruebas frontend verifican eventos, selección explícita, reinicio de formularios, datos editados, CLABE de contactos de demo, simulación y recibos. Las pruebas backend aíslan el almacenamiento en memoria y comprueban que el archivo original no cambie. La ruta Gemini se prueba con un doble del SDK, sin llamadas externas.

El script heredado `npm run test:flow` **reinicia y modifica la base de demo**. No forma parte de `npm test`.

## Guion breve de demostración

1. Abre Inicio y muestra saldo y movimientos. Activa «Letra grande» para explicar la adaptación de lectura.
2. Escribe «Quiero simular una inversión de $10,000». Cambia el monto y el plazo; pulsa «Calcular rendimiento».
3. Escribe «Transferir $1,000.50 a mi mamá». Revisa el monto, completa el concepto y comprueba que la confirmación refleja cualquier edición.
4. Abre «Mi tarjeta». No hay un plan seleccionado de antemano. Si el CAT propuesto no mejora el actual, se indica y se omiten ahorro y recomendación para esa opción.
5. Las confirmaciones registran únicamente operaciones ficticias. Consulta los movimientos para ver los cambios de la demo.

## Estado técnico y límites

React 18, Vite, Tailwind, Express y TypeScript se conservan. El catálogo y el contrato `a2ui_screen` continúan en `frontend/src/components/a2ui` y `frontend/src/types/a2ui.ts`.

El servidor MCP implementa siete herramientas mediante `@modelcontextprotocol/sdk` en `backend/src/mcp/server.ts`. El orquestador HTTP actual llama directamente a las funciones compartidas de `mcp/tools.ts`: **todavía no usa un cliente MCP ni un ciclo de selección de herramientas por el modelo**. El pulido visual no implementa esa integración pendiente. Las acciones confirmadas se procesan mediante manejadores determinísticos.

Los datos son sintéticos y el servidor carece de autenticación de producción. Las tasas y estimaciones pertenecen a la demo. Las inversiones no se contratan, las CLABE nuevas no representan una conexión real con SPEI y las confirmaciones no son comprobantes bancarios válidos.

El ZIP recibido ya contenía movimientos y reestructuras previos: por eso el saldo y CAT iniciales pueden diferir del handoff. Se conservó ese archivo sin reiniciarlo.

## Referencias

- [Diseño, fuentes y criterios de accesibilidad](docs/DESIGN.md).
- [Arquitectura original](docs/ARCHITECTURE.md) y [diccionario de datos original](docs/DATA_DICTIONARY.md), conservados como contexto del proyecto recibido.
