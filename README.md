# JeXodic

App web en español para explorar astrología occidental tropical y numerología como entretenimiento y reflexión personal. Sin cuentas ni cobros.

## Desarrollo

Requiere Node.js 22.12+ o 24 LTS y npm.

```sh
cd web
npm ci
npm run dev
```

```sh
npm test
npm run build
```

La compilación genera un Worker ESM en `web/dist/server/index.js` y el cliente en `web/dist/client`. El Worker sirve los archivos públicos y las rutas de IA; necesita un alojamiento compatible con Cloudflare Workers. La navegación usa fragmentos.

## Primera versión

- Hoy: lectura editorial general por signo, con amor, trabajo, bienestar y reflexión. Frase diaria generada con Azure OpenAI, con respaldo editorial si la conexión falla. Favoritos, compartir, vista previa y descarga de tarjetas PNG para Instagram: publicación (1080 × 1350) e historia (1080 × 1920).
- Mi carta: diez cuerpos, rueda accesible con selección, posiciones, ascendente, casas iguales, aspectos mayores con orbe fijo de 6° e interpretaciones simbólicas.
- Numerología: reducción independiente de día, mes y año, preservando 11, 22 y 33 en todas las etapas; cálculo, reducción asociada, fortalezas, retos y preguntas.
- Compatibilidad: exploración por elementos y signos para pareja, amistad y trabajo, sin puntuaciones inventadas.
- Tarot: mazo de 78 cartas con arte geométrico original, tiradas de una o tres cartas sin repetición, orientaciones al derecho/invertidas, revelado individual y respuesta con IA a una pregunta.
- Perfil: búsqueda explícita de ciudad/país, edición, preferencias y eliminación de datos locales.

## Cálculos y límites

Los cálculos están separados del contenido en `web/src/calculations.js`; las interpretaciones editoriales están en `content.js` y en las vistas. Astronomy Engine calcula longitudes tropicales geocéntricas de fecha, sin modelos de lenguaje. Casas iguales: primera cúspide en el ascendente, cada casa abarca 30°. Los aspectos no pretenden cubrir todas las escuelas astrológicas.

Open-Meteo/GeoNames resuelve ciudades, coordenadas y zonas IANA. Solo se envía la consulta de ciudad al proveedor; país filtra los resultados localmente. Luxon y la base IANA del navegador resuelven el desfase histórico de la fecha, incluido horario de verano. Las reglas históricas dependen de los datos disponibles en el navegador y del registro geográfico seleccionado. Rango de fechas admitido: 1900 a hoy. Horas inexistentes o ambiguas se rechazan de forma explícita en esta versión.

Sin hora: se usa mediodía local como referencia; no se muestran casas ni ascendente. Se comparan posiciones al inicio y al final del día para marcar posibles cambios de signo. Grados y aspectos son orientativos. Las cartas sin perfil están etiquetadas como demostración (Bogotá, 15/10/1995, 10:30).

El perfil, los favoritos y la caché diaria de contenido generado se conservan en localStorage del dispositivo. No se sincronizan entre dispositivos. El navegador puede impedir almacenamiento, compartir o copiar; se informa del error. Google Fonts carga tipografía externa con alternativas locales. El buscador de ciudades necesita conexión y disponibilidad del proveedor.

Las lecturas ampliadas con IA están disponibles mediante un botón en Hoy, Mi carta, Numerología y Compatibilidad. Tarot tiene una consulta propia basada en las cartas sorteadas. Los tránsitos personales, la sinastría y el historial siguen pendientes; no se implementan pagos.

## Azure OpenAI

La integración utiliza Responses v1 con el endpoint `https://sonnetia.services.ai.azure.com/openai/v1/responses` y el deployment `gpt-4o`. La API key se guarda como secreto de ejecución en Sites, nunca en el navegador o Git. Las llamadas especifican `store: false`; el proveedor sigue sujeto a sus propias políticas de datos.

Para desarrollo local, copia `web/.env.example` a `web/.env.local` y completa `AZURE_OPENAI_API_KEY`. Los archivos `.env` están excluidos de Git. Reinicia el servidor si cambias la configuración. En producción configura `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT` y el secreto `AZURE_OPENAI_API_KEY` mediante las variables de ejecución de Sites; publica una versión para aplicarlas. Nunca uses un prefijo `VITE_` para una clave.

- `GET /api/ai/status` devuelve únicamente si la IA está configurada.
- `POST /api/ai/generate` requiere la identidad autenticada que proporciona Sites. Acepta únicamente las tareas `quote`, `daily`, `natal`, `numerology`, `compatibility` y `tarot`, con datos limitados y validados. El endpoint de Azure y el deployment se deciden en el servidor.
- Las frases se solicitan automáticamente por fecha local. Las ampliaciones se solicitan al pulsar el botón; se envían solo signos, posiciones, aspectos, número de vida o vínculo, sin nombre, fecha, hora ni lugar de nacimiento. GPT redacta; Astronomy Engine y la numerología conservan sus cálculos.
- Las respuestas se validan antes de mostrarlas y se insertan como texto escapado. Los errores de Azure conservan el contenido editorial y permiten reintentar las lecturas.
- La caché del Worker reutiliza contenido durante 24 horas por tarea, fecha y resultados. La caché y la agrupación de solicitudes concurrentes reducen llamadas; no garantizan una única generación global entre regiones. El límite de seis solicitudes por minuto y usuario funciona por instancia del Worker y no sustituye una cuota global de Azure.
- La caché local se renueva por fecha; «Eliminar datos personales» también la borra. No se envían perfiles a la IA ni se implementa un chat abierto.

### Tarot

La sección `#tarot` permite escribir una pregunta de 5 a 500 caracteres y elegir una o tres cartas. El navegador usa `crypto.getRandomValues`, muestreo sin sesgo y barajado Fisher–Yates para sortear cartas sin reemplazo y asignar orientación. Las tres posiciones son «Tu situación», «Lo que puedes explorar» y «Un siguiente paso». Las cartas se revelan antes de enviar la pregunta al modelo.

`src/tarot-deck.js` contiene las 78 cartas (22 arcanos mayores y 56 menores) y las pistas editoriales originales; `tarot-art.js` genera ilustraciones SVG propias. El servidor valida los IDs, el número de cartas y la orientación, y construye los nombres y las posiciones desde ese mismo catálogo. Rechaza respuestas que inventen, omitan o cambien el orden de las cartas.

Al pulsar «Responder mi pregunta con IA» se envían a Azure únicamente la pregunta y las cartas de esa tirada. La consulta y su respuesta se conservan solo en memoria de la pestaña: no van a localStorage ni a la caché compartida del Worker. Las solicitudes concurrentes se aíslan por usuario. Cambiar de sección conserva la tirada; recargar, iniciar una nueva tirada o eliminar los datos locales la descarta. Un fallo de Azure conserva las cartas y permite reintentar. `store: false` se mantiene también en tarot; no equivale a una garantía sobre las políticas de retención del proveedor.

Las interpretaciones son simbólicas: no prometen sucesos ni presentan cartas como prueba para decidir asuntos de salud, dinero, seguridad o legales.

El desarrollo local utiliza un middleware de Vite restringido al servidor en `127.0.0.1`; la identidad simulada local no existe en el Worker de producción. Mantén la política de acceso de Sites.

## Validación

Pruebas de números maestros 11/22/33, año bisiesto, cambio histórico de Colombia en 1992, horas duplicadas/inexistentes en Nueva York, ingreso solar del equinoccio de marzo de 2024, alineación del eclipse de abril de 2024, posiciones de diez cuerpos y fecha local estable. También se prueban validación de entradas y respuestas de IA, autenticación, origen de solicitudes, eliminación de datos personales en el resumen, errores del proveedor y caché. Tarot añade pruebas del mazo, barajado sin repetición, muestreo sin sesgo, validación de tiradas, correspondencia de la respuesta y aislamiento de preguntas entre usuarios. La revisión visual debe completarse en un navegador con tamaños de escritorio y móvil.

## Fuentes

- [Astronomy Engine: API y precisión](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md)
- [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api), datos GeoNames bajo CC BY 4.0.
- [Luxon y zonas horarias](https://moment.github.io/luxon/api-docs/index.html)

- [Azure OpenAI Responses API](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses?view=foundry-classic).
