# Diseño de la experiencia

## Referencias de Santander

Consulta realizada el 11 de septiembre de 2026 a fuentes oficiales:

- [Guía básica de marca](https://www.santander.com/content/dam/santander-com/es/documentos/marca-santander/Guia_Marca_060520_es.pdf): rojo Santander `#EC0000`, blanco `#FFFFFF`, Lisbon `#FBF1EA`, Rio `#F5DECF`, Boston `#CC0000` y London `#990000`.
- [Nuestra nueva tipografía](https://www.santander.com/es/stories/de-la-a-a-la-z-nuestra-nueva-tipografia): Santander Font es una familia propia, presentada en 2019 y creada junto con Monotype.
- [Archivo vectorial del sitio oficial](https://www.santander.com/content/dam/santander-com/images/Santander_Logo.svg): conservado en `frontend/public/santander-logo.svg`. La máscara CSS aplica el rojo de marca manteniendo las proporciones originales.

Los recursos de marca se usan como referencia de este concepto local, identificado expresamente como prototipo no oficial. El diseño no implica afiliación con Santander ni cambia la institución de los productos bancarios del reto.

## Tipografía efectiva

La aplicación intenta utilizar las familias locales `Santander Text` y `Santander Headline` cuando están instaladas. No se han descargado ni redistribuido archivos propietarios de Santander Font.

La alternativa incluida es Source Sans 3, pesos 400, 600 y 700, distribuida mediante `@fontsource/source-sans-3`. Se empaqueta el subconjunto latino, con caracteres españoles, para no depender de Google Fonts ni de una conexión a internet al mostrar la interfaz. No se presenta esta alternativa como la fuente oficial Santander.

## Composición

La navegación fija una estructura familiar de banca: Inicio, movimientos, transferencias, ahorro y tarjeta. El área principal diferencia la consulta libre, las cuatro tareas frecuentes y el resumen de cuentas. Las pantallas A2UI aparecen dentro de esa estructura estable.

El rojo señala acciones; el blanco aporta descanso y el crema agrupa ayuda y contexto. Los datos usan tinta oscura y cifras tabulares. Se eliminaron del flujo activo el tema oscuro, los chips con emojis y el confeti. Los iconos acompañan etiquetas escritas.

## Lectura y accesibilidad

- Fuente base de 16 px, ampliable a 20 px desde «Letra grande». La preferencia se guarda localmente.
- Los formularios A2UI usan texto de al menos 16 px y controles de al menos 48 px de altura.
- Etiquetas asociadas a campos, teclado nativo, estados de selección explícitos y foco visible.
- Los errores de transferencia aparecen después de abandonar el campo, no al abrir un formulario vacío.
- La nueva respuesta recibe el foco. El regreso a Inicio enfoca el saludo. La ayuda utiliza `dialog` nativo y admite Escape.
- Se respeta `prefers-reduced-motion`.
- No se preseleccionan planes que puedan aplicarse. El botón de envío refleja los datos editados y queda bloqueado durante solicitudes.
- Al cambiar parámetros del simulador se ocultan resultados anteriores hasta recalcular.
- Los fallos HTTP se muestran en pantalla. Un límite de tiempo termina la espera y no reenvía automáticamente operaciones. Un límite de errores React conserva la navegación si un componente generado falla.

Verificado visualmente en escritorio y móvil de 390 px, incluido modo de letra grande. También se comprobó el inicio a 320 px con letra de 20 px, sin desbordamiento horizontal. Se verificaron el recálculo de inversión, la lectura del formulario en móvil, el monto editado en la confirmación y el cierre de ayuda con Escape. Estas verificaciones no sustituyen una auditoría completa WCAG ni pruebas de usabilidad con personas mayores.

## Alcance conservado

El diseño usa la identidad visual solicitada, pero conserva los productos y datos Banorte. No añade voz, carga de documentos, despliegue o contratación de inversiones. Las recomendaciones del handoff se trataron como contexto, no como nuevas órdenes del usuario.
