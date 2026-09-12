# Interfaz Banorte — entrega del 12 de septiembre de 2026

## Identidad verificada

Se inspeccionaron los estilos calculados y las declaraciones `@font-face` del [portal Personal de Banorte](https://www.banorte.com/Personal/), no un manual de marca de terceros.

| Elemento observado | Valor | Aplicación |
|---|---|---|
| Botón Banca en línea | `#EB0029` | Acciones principales y acentos |
| Navegación Personal seleccionada | `#8F0017` | Cuenta principal y estados activos |
| Texto y títulos | `#323E48` | Texto principal y franja institucional |
| Tipografía del portal | Inter, 400 / 500 / 600 | Inter local; 700 disponible para compatibilidad del catálogo |

Fuente técnica: [global.css del portal](https://www.banorte.com/.resources/banorte-core/webresources/css/global.css?v=b.1.0.17). El [logotipo SVG del sitio](https://www.banorte.com/dam/jcr:e96b09d5-b440-4d9f-bc51-d9f12a590cb8/Logo.svg) se conserva como vector en `frontend/public/banorte-wordmark.svg`; su relleno blanco se adaptó al rojo verificado para usarlo sobre blanco. La geometría no cambió.

Inter se distribuye localmente en WOFF2 desde `@fontsource/inter` 5.3.0 con su licencia OFL. No se necesitan peticiones a Google Fonts ni al sitio de Banorte para cargar la identidad. Fondos, espaciado y composición son decisiones de esta propuesta, no especificaciones oficiales de marca.

## Experiencia entregada

- Portada editorial con propuesta de valor sencilla: “Tu dinero, más claro”. La muestra visual está identificada como ejemplo.
- Resumen bancario conectado a `/api/user/:id/status`, con estados de carga y error; nunca muestra un saldo de relleno como si se hubiera consultado.
- Seis tareas con verbos cotidianos y un panel visible de Maya. Acceso directo al campo de consulta en móvil.
- Resultados A2UI recursivos y conversación separados; la respuesta explicativa también acompaña la pantalla generada.
- Letra grande persistente, foco visible, enlace para saltar al contenido, etiquetas de formularios, controles accesibles por teclado y reducción de movimiento.
- Revisión con diálogo nativo antes de enviar acciones de pago, transferencia, inversión y reestructura; cancelar conserva los datos. El diálogo es parte de la UX de demostración, no un control de autorización bancaria.
- Mensajes de espera honestos: no se simulan fases de razonamiento con temporizadores.
- Un solo POST por solicitud. Las operaciones con respuesta incierta no se reintentan automáticamente.

## Correcciones del ciclo A2UI

- Se conservan todos los niveles de `children` al normalizar la respuesta del modelo.
- `TransferCard` usa un callback estable; editar no genera un bucle de renders.
- `ActionList` conserva los payloads del modelo.
- Los controles del catálogo quedan deshabilitados mientras hay una solicitud activa.
- El simulador presenta los resultados MCP, respeta `initialDays` y pide un cálculo actualizado al agente cuando se cambia monto o plazo.
- El slider puede usarse con teclado y tiene un paso explícito para enviar el valor.
- Los comprobantes toleran operaciones que no tienen mensualidad. No inventan datos de reestructura para transferencias o inversiones.
- Se eliminaron cifras fijas y promesas no respaldadas en la transferencia, movimientos y simulador, así como el confeti.
- Si el modelo no está configurado o agota los reintentos, se muestra un error mínimo; se eliminó el fallback que mostraba una pantalla bancaria prefabricada ajena a la consulta. Coincide con lo solicitado en `CODEX_HANDOFF.md`.

## Configuración y ejecución

La clave facilitada se guardó únicamente en `backend/.env`, con permisos `0600`. `.gitignore` ya excluye ese archivo. No copiarlo en entregables públicos.

El catálogo de `https://ollama.com/api/tags` y una solicitud real verificaron que `gemma4:31b` está disponible. `gemma4:3.1b` respondió “model not found”; el valor por defecto de clasificación se corrigió a `gemma4:31b`.

Inicio habitual:

```sh
npm run dev
```

Durante esta entrega había otra versión, “Reto Banorte V01”, usando 3001 y 5173. Esta copia quedó servida de forma independiente:

```sh
PORT=3002 npm run dev --prefix backend
BACKEND_URL=http://127.0.0.1:3002 npm run dev --prefix frontend -- --host 127.0.0.1 --port 5175 --strictPort
```

Abrir `http://127.0.0.1:5175`. El proxy acepta `BACKEND_URL`; el destino por defecto sigue siendo 3001.

## Verificación

```sh
npm test --prefix frontend
npm run test:ui --prefix backend
npm run test:flow
npm run build --prefix frontend
npm run build --prefix backend
```

- Pruebas de interacción: valores editados de transferencias, payload de listas, bloqueo durante solicitudes, slider por teclado, actualización de inversión y comprobantes; además, revisión/cancelación de pago y ausencia de reintento automático.
- Prueba backend: anidación profunda conservada y error sin mutación cuando faltan credenciales.
- Flujo real con Gemma: consulta de deuda → opciones A2UI → aplicar plan de 18 meses → operación persistida. La prueba restaura los datos exactos anteriores en `finally`, incluso si falla.
- Consulta real de gastos con Gemma y MCP: total $5,495.50 y desglose por categorías.
- Revisión visual en escritorio y móvil de 390 px; fuente Inter cargada, logotipos sin errores y sin desbordamiento horizontal, también con letra grande.

El alcance sigue siendo un prototipo sobre datos sintéticos: no es una conexión a cuentas Banorte reales. El control de confirmación de la interfaz no reemplaza autenticación, autorización e idempotencia del servidor para un uso productivo.
