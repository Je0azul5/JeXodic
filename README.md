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

La compilación estática queda en `web/dist`; se puede servir en cualquier alojamiento estático con HTTPS. La navegación usa fragmentos y no necesita reglas de reescritura.

## Primera versión

- Hoy: lectura editorial general por signo, estable por fecha local, con amor, trabajo, bienestar y reflexión. No utiliza tránsitos. Frases originales con favoritos, compartir y vista previa y descarga de tarjetas PNG para Instagram: publicación (1080 × 1350) e historia (1080 × 1920).
- Mi carta: diez cuerpos, rueda accesible con selección, posiciones, ascendente, casas iguales, aspectos mayores con orbe fijo de 6° e interpretaciones simbólicas.
- Numerología: reducción independiente de día, mes y año, preservando 11, 22 y 33 en todas las etapas; cálculo, reducción asociada, fortalezas, retos y preguntas.
- Compatibilidad: exploración por elementos y signos para pareja, amistad y trabajo, sin puntuaciones inventadas.
- Perfil: búsqueda explícita de ciudad/país, edición, preferencias y eliminación de datos locales.

## Cálculos y límites

Los cálculos están separados del contenido en `web/src/calculations.js`; las interpretaciones editoriales están en `content.js` y en las vistas. Astronomy Engine calcula longitudes tropicales geocéntricas de fecha, sin modelos de lenguaje. Casas iguales: primera cúspide en el ascendente, cada casa abarca 30°. Los aspectos no pretenden cubrir todas las escuelas astrológicas.

Open-Meteo/GeoNames resuelve ciudades, coordenadas y zonas IANA. Solo se envía la consulta de ciudad al proveedor; país filtra los resultados localmente. Luxon y la base IANA del navegador resuelven el desfase histórico de la fecha, incluido horario de verano. Las reglas históricas dependen de los datos disponibles en el navegador y del registro geográfico seleccionado. Rango de fechas admitido: 1900 a hoy. Horas inexistentes o ambiguas se rechazan de forma explícita en esta versión.

Sin hora: se usa mediodía local como referencia; no se muestran casas ni ascendente. Se comparan posiciones al inicio y al final del día para marcar posibles cambios de signo. Grados y aspectos son orientativos. Las cartas sin perfil están etiquetadas como demostración (Bogotá, 15/10/1995, 10:30).

El perfil y los favoritos se conservan en localStorage del dispositivo. No se sincronizan entre dispositivos. El navegador puede impedir almacenamiento, compartir o copiar; se informa del error. Google Fonts carga tipografía externa con alternativas locales. El buscador de ciudades necesita conexión y disponibilidad del proveedor.

La interpretación ampliada, los tránsitos personales, la sinastría y el historial están identificados como pendientes Premium, sin implementar pagos ni presentar resultados ficticios.

## Validación

Pruebas de números maestros 11/22/33, año bisiesto, cambio histórico de Colombia en 1992, horas duplicadas/inexistentes en Nueva York, ingreso solar del equinoccio de marzo de 2024, alineación del eclipse de abril de 2024, posiciones de diez cuerpos y fecha local estable. La revisión visual debe completarse en un navegador con tamaños de escritorio y móvil.

## Fuentes

- [Astronomy Engine: API y precisión](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md)
- [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api), datos GeoNames bajo CC BY 4.0.
- [Luxon y zonas horarias](https://moment.github.io/luxon/api-docs/index.html)
