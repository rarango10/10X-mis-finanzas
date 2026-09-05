# Tasks — App de finanzas personales v1

> Requirements: [`./requirements.md`](./requirements.md) · Design: [`./design.md`](./design.md)
> Estado: aprobado (2026-09-04)

## Plan

| # | Tarea | Cubre | Estado |
|---|-------|-------|--------|
| T1 | Scaffold del proyecto: Vite + React + TypeScript + Vitest funcionando (`npm run typecheck`, `npm test`) | — (infraestructura inicial) | pendiente |
| T2 | `categories`: primer uso crea el estado semilla con categorías predefinidas + "Sin categoría" | R1.1 | pendiente |
| T3 | `categories`: crear categoría con nombre válido | R1.2 | pendiente |
| T4 | `categories`: rechazar creación con nombre vacío o duplicado (sin distinguir mayúsculas/espacios) | R1.3 | pendiente |
| T5 | `categories`: renombrar categoría existente, gastos y presupuestos la siguen referenciando por id | R1.4 | pendiente |
| T6 | `categories`: borrar categoría con gastos asociados los reasigna a "Sin categoría" | R1.5 | pendiente |
| T7 | `categories`: rechazar borrar o renombrar "Sin categoría" | R1.6 | pendiente |
| T8 | `money`: `round2` y `formatAmount` (redondeo a 2 decimales, formato con punto) | R6.1, R6.2 | pendiente |
| T9 | `expenses`: alta válida de un gasto | R2.1 | pendiente |
| T10 | `expenses`: rechazar monto igual o menor a 0 | R2.2 | pendiente |
| T11 | `expenses`: rechazar fecha posterior a hoy | R2.3 | pendiente |
| T12 | `expenses`: guardar gasto sin descripción | R2.4 | pendiente |
| T13 | `expenses`: rechazar sin categoría o con categoría inexistente | R2.5 | pendiente |
| T14 | `expenses`: redondear monto con más de 2 decimales antes de guardar (integración con `money`) | R6.2 | pendiente |
| T15 | `budgets`: definir presupuesto válido y que persista para el mes siguiente sin redefinirlo | R4.1, R4.2 | pendiente |
| T16 | `budgets`: rechazar presupuesto igual o menor a 0 | R4.3 | pendiente |
| T17 | `budgets`: categoría sin presupuesto definido devuelve 0 | R4.4 | pendiente |
| T18 | `budgets`: rechazar presupuesto para categoría inexistente | R4.5 | pendiente |
| T19 | `summary`: calcular gastado y presupuesto por categoría filtrando solo el mes de referencia | R5.1, R5.3 | pendiente |
| T20 | `summary`: marcar como excedida la categoría cuyo gastado supera su presupuesto | R5.2 | pendiente |
| T21 | `storage`: guardar y volver a leer el `AppState` sin pérdida de datos | R3.1 | pendiente |
| T22 | `storage`: JSON inválido o con forma inesperada cae al estado semilla sin lanzar | R3.3 | pendiente |
| T23 | `useAppState`: cada operación actualiza el estado de React y persiste en `localStorage` antes de devolver el resultado | R3.2 | pendiente |
| T24 | `ExpenseForm` + `ExpenseList`: alta feliz de un gasto (con y sin descripción) queda visible en la lista | R2.1, R2.4 | pendiente |
| T25 | `ExpenseForm`: muestra el mensaje de error que devuelve el dominio ante monto, fecha o categoría inválidos | R2.2, R2.3, R2.5 | pendiente |
| T26 | `CategoryManager`: crear, renombrar y borrar categorías desde la UI; no ofrece borrar/renombrar "Sin categoría" | R1.1, R1.2, R1.3, R1.4, R1.5, R1.6 | pendiente |
| T27 | `BudgetEditor`: definir y editar el presupuesto mensual por categoría desde la UI | R4.1, R4.2, R4.3, R4.5 | pendiente |
| T28 | `Summary`: muestra gastado vs presupuesto por categoría y marca visualmente la excedida | R5.1, R5.2, R5.3 | pendiente |
| T29 | `App.tsx`: integra todas las secciones en una sola página, estado inicial cargado desde `storage.load()` | — (integración final, sin criterio nuevo) | pendiente |

**Criterios sin tarea asignada:** ninguno.

## Bitácora

### T1 — Scaffold del proyecto

**Objetivo:** El repo tiene un proyecto Vite + React + TypeScript con Vitest configurado; existen
los scripts `npm run typecheck` (`tsc --noEmit`) y `npm test` (`vitest run`), y ambos corren sin
error. Existe la estructura de carpetas de `design.md` (`src/domain`, `src/storage`, `src/state`,
`src/components`) para que las tareas siguientes tengan dónde escribir código y tests.

**Cubre:** — (infraestructura inicial; no hay código de aplicación en el repo todavía, así que
no hay forma de empezar T2 sin esto).

**Primer test (rojo):** Hoy `npm test` falla porque no existe `package.json` ni configuración
alguna. El ciclo termina en verde cuando un test placeholder (ej. en `src/domain/models.test.ts`,
algo tan simple como confirmar que el módulo importa y una aserción trivial pasa) corre con
`npm test` y `npm run typecheck` no reporta errores.

**Registro** — <completar al implementar; fecha>

- <Decisiones que el design no fija: versión exacta de Vite/React, si se usa `strict: true` en
  tsconfig, convención de nombres de test (`*.test.ts` vs `*.spec.ts`), etc.>
- <Desvíos respecto del design, si los hay.>
- <Lo que apareció y no esperabas.>

### T2 — `categories`: estado semilla en primer uso

**Objetivo:** `createSeedState()` devuelve un `AppState` con las categorías predefinidas
(Comida, Transporte, Vivienda, Servicios, Ocio, Salud, Otros) más "Sin categoría"
(`id === UNCATEGORIZED_ID`), sin gastos ni presupuestos.

**Cubre:** R1.1

**Primer test (rojo):** `createSeedState()` sin argumentos devuelve un `AppState` cuyas
`categories` incluyen las 7 predefinidas y "Sin categoría", con `expenses` y `budgets` vacíos.

**Registro** — <completar al implementar; fecha>

### T3 — `categories`: crear con nombre válido

**Objetivo:** `addCategory(state, name)` agrega una categoría nueva a `state.categories` cuando
`name` no está vacío ni coincide (sin distinguir mayúsculas/espacios) con ninguna existente.

**Cubre:** R1.2

**Primer test (rojo):** `addCategory(seedState, "Mascotas")` devuelve `{ok: true}` con un
`AppState` cuyas `categories` incluyen "Mascotas" además de las que ya había.

**Registro** — <completar al implementar; fecha>

### T4 — `categories`: rechazar nombre vacío o duplicado

**Objetivo:** `addCategory` devuelve `{ok: false, error}` sin modificar el estado cuando `name`
está vacío o ya existe una categoría con ese nombre (comparación sin distinguir mayúsculas ni
espacios al principio/final).

**Cubre:** R1.3

**Primer test (rojo):** `addCategory(seedState, "")` y `addCategory(seedState, "comida")` (ya
existe "Comida") devuelven `{ok: false}` y `seedState` queda sin cambios.

**Registro** — <completar al implementar; fecha>

### T5 — `categories`: renombrar categoría existente

**Objetivo:** `renameCategory(state, categoryId, newName)` actualiza el `name` de la categoría
sin cambiar su `id`; los `expenses` y `budgets` que la referencian por `categoryId` la siguen
referenciando sin cambios.

**Cubre:** R1.4

**Primer test (rojo):** Con un estado que tiene un gasto en la categoría "Comida",
`renameCategory(state, comidaId, "Alimentación")` devuelve un `AppState` donde la categoría tiene
el nuevo nombre y el gasto sigue con el mismo `categoryId`.

**Registro** — <completar al implementar; fecha>

### T6 — `categories`: borrar categoría con gastos asociados

**Objetivo:** `deleteCategory(state, categoryId)` quita la categoría de `state.categories`,
reasigna los `expenses` que la referenciaban a `UNCATEGORIZED_ID`, y descarta el presupuesto que
tenía definido esa categoría.

**Cubre:** R1.5

**Primer test (rojo):** Con un estado que tiene un gasto y un presupuesto en "Comida",
`deleteCategory(state, comidaId)` devuelve un `AppState` sin "Comida", con ese gasto ahora en
`UNCATEGORIZED_ID` y sin la entrada de presupuesto de "Comida".

**Registro** — <completar al implementar; fecha>

### T7 — `categories`: proteger "Sin categoría"

**Objetivo:** `deleteCategory` y `renameCategory` devuelven `{ok: false, error}` sin modificar el
estado cuando `categoryId === UNCATEGORIZED_ID`.

**Cubre:** R1.6

**Primer test (rojo):** `deleteCategory(seedState, UNCATEGORIZED_ID)` y
`renameCategory(seedState, UNCATEGORIZED_ID, "Otro nombre")` devuelven `{ok: false}` y el estado
no cambia.

**Registro** — <completar al implementar; fecha>

### T8 — `money`: `round2` y `formatAmount`

**Objetivo:** `round2(amount)` redondea a 2 decimales (`Number(amount.toFixed(2))`);
`formatAmount(amount)` devuelve el monto como string con punto decimal y exactamente 2
decimales (ej. `"1234.56"`).

**Cubre:** R6.1, R6.2

**Primer test (rojo):** `round2(19.999)` devuelve `20`; `formatAmount(1234.5)` devuelve
`"1234.50"`.

**Registro** — <completar al implementar; fecha>

### T9 — `expenses`: alta válida

**Objetivo:** `addExpense(state, input, today)` guarda el gasto en `state.expenses` cuando
`amount > 0`, `categoryId` existe y `date` no es futura respecto a `today`.

**Cubre:** R2.1

**Primer test (rojo):** `addExpense(seedState, {amount: 10, categoryId: comidaId, date:
"2026-09-04"}, hoy)` devuelve `{ok: true}` con el gasto presente en `state.expenses`.

**Registro** — <completar al implementar; fecha>

### T10 — `expenses`: rechazar monto inválido

**Objetivo:** `addExpense` devuelve `{ok: false, error}` sin agregar el gasto cuando
`amount <= 0`.

**Cubre:** R2.2

**Primer test (rojo):** `addExpense(seedState, {amount: 0, ...}, hoy)` y
`addExpense(seedState, {amount: -5, ...}, hoy)` devuelven `{ok: false}` y `state.expenses` queda
sin cambios.

**Registro** — <completar al implementar; fecha>

### T11 — `expenses`: rechazar fecha futura

**Objetivo:** `addExpense` devuelve `{ok: false, error}` sin agregar el gasto cuando `date` es
posterior a `today`.

**Cubre:** R2.3

**Primer test (rojo):** Con `today = 2026-09-04`, `addExpense(seedState, {..., date:
"2026-09-05"}, today)` devuelve `{ok: false}`.

**Registro** — <completar al implementar; fecha>

### T12 — `expenses`: guardar sin descripción

**Objetivo:** `addExpense` guarda el gasto correctamente cuando `input.description` no viene
definido, y el `Expense` resultante no tiene la propiedad (o la tiene `undefined`).

**Cubre:** R2.4

**Primer test (rojo):** `addExpense(seedState, {amount: 10, categoryId: comidaId, date:
"2026-09-04"}, hoy)` (sin `description`) devuelve `{ok: true}` con el gasto guardado sin
descripción.

**Registro** — <completar al implementar; fecha>

### T13 — `expenses`: rechazar categoría vacía o inexistente

**Objetivo:** `addExpense` devuelve `{ok: false, error}` sin agregar el gasto cuando
`categoryId` está vacío o no corresponde a ninguna categoría de `state.categories`.

**Cubre:** R2.5

**Primer test (rojo):** `addExpense(seedState, {amount: 10, categoryId: "no-existe", date:
"2026-09-04"}, hoy)` devuelve `{ok: false}`.

**Registro** — <completar al implementar; fecha>

### T14 — `expenses`: redondear monto antes de guardar

**Objetivo:** `addExpense` redondea `input.amount` a 2 decimales (usando `money.round2`) antes de
validar que sea `> 0` y antes de guardarlo.

**Cubre:** R6.2

**Primer test (rojo):** `addExpense(seedState, {amount: 10.999, ...}, hoy)` guarda un gasto con
`amount === 11`.

**Registro** — <completar al implementar; fecha>

### T15 — `budgets`: definir presupuesto válido y que persista

**Objetivo:** `setBudget(state, categoryId, amount)` guarda `amount` como presupuesto actual de
`categoryId`; `getBudgetForCategory` devuelve ese mismo monto en llamadas posteriores sin
necesidad de redefinirlo (no hay historial por mes).

**Cubre:** R4.1, R4.2

**Primer test (rojo):** `setBudget(seedState, comidaId, 300)` devuelve `{ok: true}`, y
`getBudgetForCategory(nuevoState, comidaId)` devuelve `300`.

**Registro** — <completar al implementar; fecha>

### T16 — `budgets`: rechazar presupuesto inválido

**Objetivo:** `setBudget` devuelve `{ok: false, error}` sin modificar `state.budgets` cuando
`amount <= 0`.

**Cubre:** R4.3

**Primer test (rojo):** `setBudget(seedState, comidaId, 0)` devuelve `{ok: false}`.

**Registro** — <completar al implementar; fecha>

### T17 — `budgets`: categoría sin presupuesto devuelve 0

**Objetivo:** `getBudgetForCategory(state, categoryId)` devuelve `0` cuando `categoryId` no tiene
una entrada en `state.budgets`.

**Cubre:** R4.4

**Primer test (rojo):** `getBudgetForCategory(seedState, comidaId)` (sin presupuesto definido
todavía) devuelve `0`.

**Registro** — <completar al implementar; fecha>

### T18 — `budgets`: rechazar categoría inexistente

**Objetivo:** `setBudget` devuelve `{ok: false, error}` sin modificar el estado cuando
`categoryId` no existe en `state.categories`.

**Cubre:** R4.5

**Primer test (rojo):** `setBudget(seedState, "no-existe", 100)` devuelve `{ok: false}`.

**Registro** — <completar al implementar; fecha>

### T19 — `summary`: calcular gastado y presupuesto filtrando por mes

**Objetivo:** `computeMonthlySummary(state, referenceDate)` devuelve, para cada categoría de
`state.categories`, la suma de `expenses` cuyo `date` cae en el mismo mes/año que
`referenceDate`, junto con su `budget` (vía `getBudgetForCategory`); gastos de otros meses no se
cuentan.

**Cubre:** R5.1, R5.3

**Primer test (rojo):** Con gastos de "Comida" en agosto y en septiembre,
`computeMonthlySummary(state, new Date("2026-09-04"))` devuelve el `spent` de "Comida" sumando
solo el gasto de septiembre.

**Registro** — <completar al implementar; fecha>

### T20 — `summary`: marcar categoría excedida

**Objetivo:** `computeMonthlySummary` marca `exceeded: true` en la categoría cuyo `spent` del mes
de referencia supera su `budget`, y `exceeded: false` en las demás.

**Cubre:** R5.2

**Primer test (rojo):** Con `budget = 100` y `spent = 150` en "Comida" para el mes de referencia,
el `CategorySummary` de "Comida" tiene `exceeded: true`.

**Registro** — <completar al implementar; fecha>

### T21 — `storage`: guardar y volver a leer

**Objetivo:** `save(state)` seguido de `load()` devuelve un `AppState` equivalente al guardado
(mismas categorías, gastos y presupuestos), usando `localStorage` real vía `jsdom`.

**Cubre:** R3.1

**Primer test (rojo):** `save(estadoConDatos); expect(load()).toEqual(estadoConDatos)`.

**Registro** — <completar al implementar; fecha>

### T22 — `storage`: fallback ante datos corruptos

**Objetivo:** `load()` devuelve `categories.createSeedState()` sin lanzar excepción cuando el
valor guardado en `localStorage` no es JSON válido o no tiene la forma esperada de `AppState`.

**Cubre:** R3.3

**Primer test (rojo):** Con `localStorage` conteniendo el string `"{no es json"`, `load()` no
lanza y devuelve el mismo resultado que `createSeedState()`. Un segundo caso con JSON válido pero
de forma inesperada (ej. `{"foo": 1}`) debe comportarse igual.

**Registro** — <completar al implementar; fecha>

### T23 — `useAppState`: persistir antes de devolver el resultado

**Objetivo:** Cada operación del hook (`addExpense`, `addCategory`, `renameCategory`,
`deleteCategory`, `setBudget`) que resulta en éxito actualiza el estado de React y llama a
`storage.save` con el nuevo estado antes de devolver el `Result` al llamador; si la operación de
dominio falla, ni el estado de React ni `localStorage` cambian.

**Cubre:** R3.2

**Primer test (rojo):** Renderizando el hook (`renderHook` de `@testing-library/react`) y
llamando `addExpense(inputVálido)`, `storage.save` (espiado) se llamó con el estado actualizado,
y `result.current.state.expenses` incluye el nuevo gasto.

**Registro** — <completar al implementar; fecha>

### T24 — `ExpenseForm` + `ExpenseList`: alta feliz visible en la lista

**Objetivo:** Completar el formulario con datos válidos (con y sin descripción) y enviarlo agrega
el gasto y lo muestra en `ExpenseList` sin recargar la página.

**Cubre:** R2.1, R2.4

**Primer test (rojo):** Renderizando `App` (o `ExpenseForm` + `ExpenseList` con un
`AppStateProvider` de prueba), completar monto/categoría/fecha y enviar hace aparecer el gasto en
la lista.

**Registro** — <completar al implementar; fecha>

### T25 — `ExpenseForm`: muestra errores de validación del dominio

**Objetivo:** Cuando `addExpense` devuelve error (monto inválido, fecha futura o categoría
inválida), `ExpenseForm` muestra ese mensaje cerca del campo correspondiente y no agrega ningún
gasto a la lista.

**Cubre:** R2.2, R2.3, R2.5

**Primer test (rojo):** Enviar el formulario con monto `0` muestra el texto de error devuelto por
el dominio y `ExpenseList` sigue sin ese gasto.

**Registro** — <completar al implementar; fecha>

### T26 — `CategoryManager`: gestión de categorías desde la UI

**Objetivo:** Desde `CategoryManager` se puede crear, renombrar y borrar una categoría (con los
mismos rechazos que el dominio ante nombre vacío/duplicado); la fila de "Sin categoría" no ofrece
las acciones de borrar ni renombrar.

**Cubre:** R1.1, R1.2, R1.3, R1.4, R1.5, R1.6

**Primer test (rojo):** Al renderizar `CategoryManager` con el estado semilla, la fila de "Sin
categoría" no tiene botón de borrar ni de renombrar, mientras que las demás categorías sí.

**Registro** — <completar al implementar; fecha>

### T27 — `BudgetEditor`: definir presupuesto desde la UI

**Objetivo:** Desde `BudgetEditor` se puede definir o cambiar el presupuesto mensual de una
categoría existente; un monto inválido (`<= 0`) muestra el error del dominio sin guardar el
cambio.

**Cubre:** R4.1, R4.2, R4.3, R4.5

**Primer test (rojo):** Ingresar `300` en el campo de presupuesto de "Comida" y confirmar deja
ese valor reflejado en la UI y en `state.budgets`.

**Registro** — <completar al implementar; fecha>

### T28 — `Summary`: gastado vs presupuesto con marca de excedido

**Objetivo:** `Summary` muestra, para cada categoría, el total gastado y el presupuesto del mes
actual (vía `computeMonthlySummary`), y resalta visualmente (ej. clase o texto distintivo) la
categoría marcada como `exceeded`.

**Cubre:** R5.1, R5.2, R5.3

**Primer test (rojo):** Con una categoría cuyo `spent` supera su `budget`, `Summary` renderiza esa
fila con la marca de excedida (ej. un texto o clase verificable por `@testing-library/react`).

**Registro** — <completar al implementar; fecha>

### T29 — `App.tsx`: integración final

**Objetivo:** `App` renderiza `CategoryManager`, `ExpenseForm`, `ExpenseList`, `BudgetEditor` y
`Summary` dentro de un único `AppStateProvider`, inicializando el estado con `storage.load()` al
montar.

**Cubre:** — (integración final, sin criterio nuevo — las tareas anteriores ya cubren todos los
criterios).

**Primer test (rojo):** Renderizar `App` sin datos previos en `localStorage` muestra las
categorías predefinidas disponibles para elegir en el formulario de gasto.

**Registro** — <completar al implementar; fecha>

## Pendientes

- Ninguno todavía — se completa a medida que avanza la implementación.

<!--
Recordatorios al escribir:

- Una tarea = un ciclo de TDD completo (test que falla → implementar → test que pasa), del
  tamaño que se pueda terminar de una sentada. Si una tarea necesita tres tests para tener
  sentido, probablemente sean tres tareas.
- Toda tarea cubre al menos un criterio. Si no cubrís ninguno, preguntate qué está haciendo
  acá: o falta un criterio en requirements.md, o la tarea es alcance que nadie pidió.
- Al revés también: si un criterio no aparece en ninguna fila, o falta una tarea o hay que
  decir explícitamente por qué queda afuera.
- Nada de código en este archivo. Describe qué hay que lograr, no cómo se escribe.
- La bitácora se completa mientras se trabaja, no al final de todo. Escrita después, se
  convierte en un resumen prolijo que perdió justo lo que valía la pena: las dudas y las
  alternativas que se descartaron en el momento.
-->
