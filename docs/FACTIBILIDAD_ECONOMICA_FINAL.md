# 1.1.1 Factibilidad Económica

## 1) Evaluación general
La factibilidad económica del sistema de Biblioteca Virtual es favorable, pero el costo anterior estaba subestimado para el alcance actual del proyecto. El sistema integra backend, frontend, seguridad por roles, gestión documental, préstamos y componentes de IA/RAG, por lo que su valoración debe reflejar esfuerzo real de ingeniería y costos operativos.

Todos los montos de esta versión se expresan en **USD**.

## 2) Base metodológica
- Estimación funcional: Puntos de Función (PF).
- Estimación de esfuerzo: COCOMO orgánico.
- Reestimación ajustada al HIPO actualizado (19 procesos backend):
  - Entradas de usuario (EI): 13
  - Salidas de usuario (EO): 11
  - Peticiones/consultas (EQ): 9
  - Archivos lógicos internos (ILF): 10
  - Interfaces externas (EIF): 3
  - UFP = `13*4 + 11*5 + 9*4 + 10*10 + 3*7` = **264**
  - TDI = **50**
  - VAF = `0.65 + 0.01*50` = **1.15**
  - AFP = `264 * 1.15` = **303.60**
  - SLOC = `303.60 * 50` = **15,180**
  - KLOC = **15.18**
  - Esfuerzo (COCOMO) = `2.4*(15.18)^1.05` = **41.74 persona-mes**
  - Duración teórica = `2.5*(41.74)^0.38` = **10.33 meses**
  - Equipo teórico = `41.74/10.33` = **4.04 (~4 personas)**

## 3) Modelo dual adoptado (coherencia académica)

Para reflejar la realidad del proyecto (una sola persona desarrolladora) sin perder trazabilidad metodológica:

1. **Plano teórico (COCOMO):** 10.33 meses con equipo equivalente de 4 personas.
2. **Plano real de ejecución:** 1 persona con dedicación parcial (medio tiempo), por lo que el calendario real puede extenderse significativamente.
3. **Plano económico de valoración:** se valora el esfuerzo total de **41.74 persona-mes** a tarifa de mercado mensual.

Este enfoque evita subestimar costos por confundir cronograma académico con costo real de construcción.

## 4) Supuestos económicos aplicados
- Tarifa base seleccionada: **900 USD/mes (tiempo completo equivalente)**.
- Contingencia técnica aplicada: **20%** del costo de desarrollo.
- Mantenimiento evolutivo y soporte: **15% anual** sobre costo base de desarrollo.
- Costos operativos (API RAG + hosting + almacenamiento + monitoreo): **3,600 USD/año**.
- Horizonte de evaluación: **3 años**.

> Nota: estos valores se adoptan como supuestos explícitos para cerrar la propuesta económica final.

## 5) Cálculo del costo incrementado

### 5.1 Costo de desarrollo (esfuerzo equivalente)
- Costo base desarrollo = `41.74 PM * 900 USD/PM` = **37,566.00 USD**
- Contingencia técnica (20%) = `37,566.00 * 0.20` = **7,513.20 USD**
- **Desarrollo total con contingencia = 45,079.20 USD**

### 5.2 Costos de operación y sostenibilidad (3 años)
- Costos operativos (3 años) = `3,600 * 3` = **10,800.00 USD**
- Mantenimiento (15% anual sobre 37,566.00):
  - anual = `37,566.00 * 0.15` = **5,634.90 USD**
  - 3 años = `5,634.90 * 3` = **16,904.70 USD**

### 5.3 Costo total de propiedad (TCO 3 años)
- **TCO = Desarrollo con contingencia + OpEx 3 años + Mantenimiento 3 años**
- **TCO = 45,079.20 + 10,800.00 + 16,904.70 = 72,783.90 USD**

## 6) Resumen ejecutivo

| Concepto | Valor (USD) |
|---|---:|
| Desarrollo base (41.74 PM x 900) | 37,566.00 |
| Contingencia técnica (20%) | 7,513.20 |
| Desarrollo total | 45,079.20 |
| OpEx anual (API+hosting+storage+monitoreo) | 3,600.00 |
| OpEx 3 años | 10,800.00 |
| Mantenimiento anual (15%) | 5,634.90 |
| Mantenimiento 3 años | 16,904.70 |
| **Costo total de propiedad (3 años)** | **72,783.90** |

## 7) Justificación del aumento de costo
- El costo previo no representaba el esfuerzo total fullstack + IA/RAG del sistema actual.
- El nuevo HIPO (19 procesos backend) incrementa el conteo funcional y, por tanto, el esfuerzo estimado.
- La valoración por persona-mes captura mejor la complejidad de backend, frontend, seguridad, datos y analítica.
- La contingencia del 20% es razonable por integración de IA, incertidumbre técnica y retrabajo.
- Incluir OpEx y mantenimiento evita una visión incompleta centrada solo en construcción inicial.
- El enfoque de TCO a 3 años refleja sostenibilidad institucional y no solo implementación puntual.

## 8) Conclusión
Con el recálculo en modelo dual y costo total de propiedad, la factibilidad económica queda más realista y defendible. El proyecto sigue siendo viable, pero su costo real debe presentarse como una inversión tecnológica integral y no como un desarrollo mínimo aislado.

## 9) Referencia de diagrama HIPO actualizado
Para reemplazar el anexo HIPO anterior, usar:

- `docs/ANEXO_HIPO_BIBLIOTECA_VIRTUAL.md`

Este anexo está alineado con el sistema actual de Biblioteca Virtual y sus módulos vigentes.
