# 1.1.1 Factibilidad Económica (lista para Word)

## Nota previa
Esta versión sustituye el cálculo anterior porque el HIPO fue actualizado a 19 procesos IPO del backend. Todos los montos se expresan en **USD**.

## Base de estimación
- Método: Puntos de Función + COCOMO orgánico.
- Conversión: 50 SLOC por FP.
- Parámetros COCOMO: `a=2.4`, `b=1.05`, `c=2.5`, `d=0.38`.
- Tarifa base de desarrollo: **900 USD/persona-mes**.
- Contingencia técnica: **20%**.
- Mantenimiento anual: **15%** sobre costo base de desarrollo.
- OpEx anual (API RAG + hosting + almacenamiento + monitoreo): **3,600 USD**.
- Horizonte: **3 años**.

## Reestimación funcional (con HIPO actualizado)

1) Conteo funcional
- EI = 13
- EO = 11
- EQ = 9
- ILF = 10
- EIF = 3

2) UFP

`UFP = 13*4 + 11*5 + 9*4 + 10*10 + 3*7 = 264`

3) Ajuste de complejidad

`TDI = 50`

`VAF = 0.65 + 0.01*TDI = 1.15`

`AFP = UFP * VAF = 264 * 1.15 = 303.60`

4) Tamaño y esfuerzo

`SLOC = AFP * 50 = 15,180`

`KLOC = 15.18`

`E = 2.4*(15.18)^1.05 = 41.74 persona-mes`

`D = 2.5*(41.74)^0.38 = 10.33 meses`

`P = E/D = 4.04 (~4 personas teóricas)`

## Costeo económico (modelo dual)

- Plano teórico: 10.33 meses con 4 personas equivalentes.
- Plano real: 1 persona a medio tiempo (duración real mayor).
- Plano económico: se valora el esfuerzo total equivalente (41.74 PM).

### Costo de desarrollo

`Costo base desarrollo = 41.74 * 900 = 37,566.00 USD`

`Contingencia técnica (20%) = 7,513.20 USD`

`Desarrollo total = 45,079.20 USD`

### Sostenibilidad (3 años)

`OpEx 3 años = 3,600 * 3 = 10,800.00 USD`

`Mantenimiento anual = 37,566.00 * 0.15 = 5,634.90 USD`

`Mantenimiento 3 años = 16,904.70 USD`

### Costo total de propiedad

`TCO 3 años = 45,079.20 + 10,800.00 + 16,904.70 = 72,783.90 USD`

## Tabla final

| Concepto | Valor |
|---|---:|
| UFP | 264 |
| TDI | 50 |
| VAF | 1.15 |
| AFP | 303.60 |
| SLOC total | 15,180 |
| KLOC | 15.18 |
| Esfuerzo (persona-mes) | 41.74 |
| Duración teórica (meses) | 10.33 |
| Equipo teórico | 4.04 (~4) |
| Desarrollo base (USD) | 37,566.00 |
| Contingencia técnica (USD) | 7,513.20 |
| Desarrollo total (USD) | 45,079.20 |
| OpEx 3 años (USD) | 10,800.00 |
| Mantenimiento 3 años (USD) | 16,904.70 |
| **TCO 3 años (USD)** | **72,783.90** |

## Conclusión
Sí, el nuevo HIPO cambia los cálculos. Al reflejar mayor cobertura funcional del backend, aumenta el tamaño estimado (AFP), el esfuerzo (PM) y el costo total, quedando una valoración más realista y defendible para el alcance real del sistema.
