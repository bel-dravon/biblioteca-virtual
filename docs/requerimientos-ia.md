---
## Metadata

| Campo | Valor |
|-------|-------|
| Ultima actualizacion | 2026-01-30 09:20 |
| Version | 0.2 |
| Estado | Borrador |
| Autor | Discovery Architect |

---

## Problem statement

La Biblioteca Virtual requiere un Modulo de Inteligencia Artificial que cumpla las promesas de "Analisis Tematico Inteligente" y "Coincidencia Semantica" usando arquitectura RAG con Google Gemini API y embeddings vectoriales, sin entrenar un modelo desde cero. El modulo debe operar sobre el repositorio interno de trabajos de investigacion, con documentos mayormente escaneados, y ofrecer resultados explicables.

## Goals / non-goals

Goals:
- Detectar temas principales de documentos y consultas.
- Generar resumen tematico de documentos.
- Calcular y mostrar coincidencia semantica con score 0-100.
- Operar con OCR obligatorio en PDFs escaneados.
- Soportar español e ingles.
- Proveer explicabilidad con fragmentos/fuentes.
- Ejecutar el flujo RAG en el backend Django.

Non-goals:
- Entrenar modelos propios desde cero.
- Usar fuentes externas fuera del repositorio interno.
- Realizar analisis multimedial mas alla de PDF e imagenes escaneadas.

## User stories

- Como estudiante, quiero consultar en lenguaje natural para obtener trabajos similares con un puntaje de coincidencia semantica.
- Como estudiante, quiero ver los temas principales de un trabajo para evaluar su relevancia.
- Como estudiante, quiero un resumen tematico que me ayude a decidir si leer el documento completo.
- Como estudiante, quiero ver fragmentos que justifiquen las recomendaciones o coincidencias.

## Data/entities (high-level)

- Documento: PDF del repositorio, metadatos (titulo, autores, palabras clave, resumen, fecha, tipo).
- Texto extraido: resultado de OCR y/o texto embebido.
- Fragmento (chunk): segmento de texto indexado.
- Indice vectorial: embeddings de fragmentos.
- Consulta: texto libre o metadatos proporcionados por el usuario.
- Resultado: temas, resumen tematico, ranking con score 0-100 y evidencias.

## Business rules

- El corpus para RAG y coincidencia semantica es exclusivamente el repositorio interno.
- OCR es obligatorio para PDFs escaneados antes de indexar y analizar.
- El flujo RAG se ejecuta en el backend Django.
- La explicabilidad es obligatoria: se deben mostrar fragmentos/fuentes de los resultados.
- Los resultados incluyen: temas principales, resumen tematico y coincidencia semantica con score 0-100.
- El modulo soporta español e ingles.
- Se usa Gemini embeddings para el indice vectorial.
- La estrategia de retrieval es hibrida (vectorial + filtros/metadata).

## UI/UX notes (high-level)

- Mostrar temas principales como lista priorizada.
- Presentar resumen tematico breve y legible.
- Mostrar ranking de coincidencia semantica con score 0-100.
- Incluir citas/fragmentos con referencia al documento fuente.
- Indicar idioma detectado o permitir seleccionar idioma de la consulta.

## Edge cases

- PDF escaneado con OCR fallido o de baja calidad.
- Documentos muy cortos o sin contenido util.
- Consultas vacias o demasiado generales.
- Documentos en mezclas de español e ingles.
- No hay coincidencias por encima de un umbral minimo.
- Caida o latencia elevada en la API de Gemini.

## Acceptance criteria

- Dado un PDF escaneado, cuando se indexa, entonces se ejecuta OCR y se genera texto extraido para el indice vectorial.
- Dado un documento del repositorio, cuando se solicita analisis tematico, entonces se retornan temas principales y resumen tematico en el idioma del documento.
- Dada una consulta en texto libre, cuando se solicita coincidencia semantica, entonces se devuelve un ranking con score 0-100 y fragmentos de evidencia.
- Dado que el usuario solicita explicabilidad, cuando se muestran resultados, entonces cada resultado incluye al menos un fragmento/fuente.
- Dada una consulta en español o ingles, cuando se procesa, entonces la respuesta se genera en el mismo idioma.
- Dado el modulo en produccion, cuando se ejecuta una consulta, entonces el tiempo de respuesta es <= 5 segundos en el percentil P95.
- Dado un conjunto de validacion, cuando se evalua coincidencia semantica, entonces Precision@k es >= 0.70 segun el umbral definido.

## Pendientes (con prioridad)

- tema: Parametros de chunking y top-k
  impacto: Rendimiento y calidad del retrieval
  falta: Tamano de chunk, solapamiento y valor de top-k
  prioridad provisional: Media
- tema: Politica ante fallos de Gemini API
  impacto: Disponibilidad del modulo
  falta: Reintentos, timeouts y mensajes al usuario
  prioridad provisional: Media

## Decisions log

- 2026-01-30: Se priorizan analisis tematico y coincidencia semantica por igual. Alternativas: priorizar uno. Razon: promesas del documento aprobado.
- 2026-01-30: Se usa RAG en backend Django con Gemini API y embeddings vectoriales. Razon: arquitectura definida y sin entrenamiento propio.
- 2026-01-30: OCR obligatorio para PDFs escaneados. Razon: la mayoria de documentos son escaneados.
- 2026-01-30: Corpus limitado al repositorio interno. Razon: alcance definido para la Biblioteca Virtual.
- 2026-01-30: Soporte bilingue espanol/ingles y explicabilidad obligatoria. Razon: requisitos funcionales del modulo IA.
- 2026-01-30: Latencia objetivo <= 5 s en P95. Alternativas: 3 s o 8 s. Razon: balance entre costo y calidad.
- 2026-01-30: Metrica de calidad Precision@k >= 0.70. Alternativas: Recall@k o NDCG@k. Razon: enfoca calidad del top-k.
