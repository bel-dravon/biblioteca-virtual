# 1.1.1 Factibilidad Económica (versión corregida)

> Nota: montos expresados en **USD** usando tipo de cambio de referencia **1 USD = 9.17 Bs**.
>
> Nota de vigencia: esta versión queda como histórico. La versión actualizada tras el nuevo HIPO está en `docs/FACTIBILIDAD_ECONOMICA_FINAL.md` y `docs/FACTIBILIDAD_ECONOMICA_LISTA_WORD.md`.

El análisis económico indica que el proyecto es viable, debido a que los beneficios operativos esperados superan los costos de implementación y operación inicial. La propuesta se apoya en una inversión de arranque baja, costos operativos controlados y beneficios derivados de la digitalización del proceso bibliotecario.

Los costos directos de desarrollo se reducen por el uso de tecnologías de código abierto (sin licenciamiento propietario) y por el aprovechamiento de infraestructura existente de la institución. No obstante, la incorporación de arquitectura RAG incrementa la complejidad técnica y debe contemplar costos futuros por consumo de API y capacidad de cómputo.

Con estimación funcional (Puntos de Función) y COCOMO orgánico, se obtienen los siguientes resultados:

- UFP: 166
- TDI: 48
- VAF: 1.13
- AFP: 187.58
- Suposición SLOC/FP: 50
- SLOC total: 9,379
- KLOC: 9.379
- Esfuerzo (PM): 25.18 personas-mes
- Duración estimada: 8.52 meses
- Equipo teórico: 2.96 (~3 personas)
- Productividad: 7.45 FP/persona-mes
- Costo por FP (métrica esperada): 2.65 USD
- Costo estimado total: 497.69 USD

El proyecto también constituye un activo tecnológico escalable para la universidad, con potencial de extensión a otras carreras/facultades. Esto mejora la rentabilidad institucional de la inversión inicial al convertirla en una base reutilizable.

## Notas de consistencia aplicadas

1. Se unificó la duración en **8.52 meses** (antes aparecía también 5.82).
2. Se unificó el tamaño de equipo en **~3 personas** (antes aparecía 1 persona en tabla).
3. Se unificó el costo total en **497.69 USD** (equivalente a 4,563.82 Bs) conforme a la fórmula y AFP usado.
4. Se eliminó la mezcla de unidades en productividad (FP/persona-mes vs KLOC/persona-mes).
5. Se corrigieron errores menores de redacción y ortografía técnica.
