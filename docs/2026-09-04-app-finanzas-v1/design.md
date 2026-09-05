# Design — App de finanzas personales v1

> Requirements: [`./requirements.md`](./requirements.md)
> Estado: aprobado (2026-09-04)

## Resumen de la solución

Una web app en React + Vite + TypeScript, sin backend. Toda la lógica de negocio (categorías,
gastos, presupuestos, cálculo del resumen mensual) vive en funciones puras de TypeScript,
separadas de React y de `localStorage`, para poder hacer TDD estricto ahí sin tocar el DOM ni el
navegador. Un hook (`useAppState`) conecta esas funciones puras con el estado de React y con la
persistencia: cada operación (agregar un gasto, crear una categoría, etc.) valida contra el
estado actual, y si es válida actualiza React y guarda en `localStorage` antes de devolver el
resultado al componente que la pidió.

## Arquitectura

| Unidad | Responsabilidad | Depende de | Cubre |
|--------|-----------------|------------|-------|
| `domain/models.ts` | Tipos `Category`, `Expense`, `AppState`, `Result<T>` | — | Base de todo |
| `domain/categories.ts` | Semilla inicial, crear/renombrar/borrar categoría, reglas de "Sin categoría" | `models.ts` | R1.1–R1.6 |
| `domain/expenses.ts` | Alta de gasto: validar monto, fecha, categoría | `models.ts` | R2.1–R2.5, R6.2 |
| `domain/budgets.ts` | Definir presupuesto por categoría, leer presupuesto con default 0 | `models.ts` | R4.1–R4.5 |
| `domain/summary.ts` | Calcular gastado vs presupuesto por categoría para un mes dado | `models.ts` | R5.1–R5.3 |
| `domain/money.ts` | Redondeo a 2 decimales y formato de montos | — | R6.1, R6.2 |
| `storage/localStorageRepository.ts` | Serializar/leer `AppState` en `localStorage`, con fallback si está corrupto | `models.ts`, `domain/categories.ts` (para el estado semilla) | R3.1–R3.3 |
| `state/useAppState.ts` + `AppStateProvider` | Conectar `domain` + `storage` con React: expone el estado actual y las operaciones (`addExpense`, `addCategory`, etc.) | `domain/*`, `storage/*` | R3.2 |
| `components/ExpenseForm.tsx` | Formulario de alta de gasto, muestra errores de validación | `state/useAppState` | R2.1–R2.5 |
| `components/ExpenseList.tsx` | Lista de gastos cargados | `state/useAppState` | R2.1 |
| `components/CategoryManager.tsx` | Crear, renombrar y borrar categorías | `state/useAppState` | R1.1–R1.6 |
| `components/BudgetEditor.tsx` | Definir el presupuesto mensual por categoría | `state/useAppState` | R4.1–R4.5 |
| `components/Summary.tsx` | Resumen del mes actual: gastado vs presupuesto, marca de excedido | `state/useAppState`, `domain/summary.ts` | R5.1–R5.3 |
| `App.tsx` | Layout de una sola página con las secciones anteriores | todos los componentes | — |

## Flujo de datos

1. Un componente (ej. `ExpenseForm`) junta los datos ingresados por el usuario y llama a la
   operación correspondiente del hook `useAppState()` (ej. `addExpense(input)`).
2. La operación toma el `AppState` actual y lo pasa, junto con el input, a la función pura de
   `domain` correspondiente (ej. `expenses.addExpense(state, input)`).
3. La función de dominio valida el input contra las reglas de negocio y devuelve un `Result`:
   o el nuevo `AppState` (éxito) o un mensaje de error, sin efectos secundarios.
4. Si es éxito, la operación actualiza el estado de React y llama a
   `storage.save(nuevoState)` **antes** de devolver el resultado al componente.
5. Si es error, la operación devuelve el mensaje al componente sin tocar el estado ni el storage.
6. El componente re-renderiza con el estado actualizado; `Summary` recalcula gastado-vs-presupuesto
   llamando a `summary.computeMonthlySummary(state, new Date())`.
7. Al cargar la página, `AppStateProvider` inicializa el estado con `storage.load()`, que
   reconstruye el `AppState` guardado o cae al estado semilla (`categories.createSeedState()`)
   si no puede leerlo o parsearlo.

## Interfaces

```ts
// domain/models.ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number;       // ya redondeado a 2 decimales
  categoryId: string;
  date: string;         // ISO "AAAA-MM-DD"
  description?: string;
}

interface AppState {
  categories: Category[];
  expenses: Expense[];
  budgets: Record<string, number>; // categoryId -> monto mensual actual
}

const UNCATEGORIZED_ID = "sin-categoria";

// domain/categories.ts
function createSeedState(): AppState;
function addCategory(state: AppState, name: string): Result<AppState>;
function renameCategory(state: AppState, categoryId: string, newName: string): Result<AppState>;
function deleteCategory(state: AppState, categoryId: string): Result<AppState>;

// domain/expenses.ts
interface AddExpenseInput {
  amount: number;
  categoryId: string;
  date: string;          // ISO "AAAA-MM-DD"
  description?: string;
}
function addExpense(state: AppState, input: AddExpenseInput, today: Date): Result<AppState>;

// domain/budgets.ts
function setBudget(state: AppState, categoryId: string, amount: number): Result<AppState>;
function getBudgetForCategory(state: AppState, categoryId: string): number; // 0 si no está definido

// domain/summary.ts
interface CategorySummary {
  categoryId: string;
  categoryName: string;
  spent: number;
  budget: number;
  exceeded: boolean;
}
function computeMonthlySummary(state: AppState, referenceDate: Date): CategorySummary[];

// domain/money.ts
function round2(amount: number): number;
function formatAmount(amount: number): string; // "1234.56"

// storage/localStorageRepository.ts
function load(): AppState;
function save(state: AppState): void;

// state/useAppState.ts
function useAppState(): {
  state: AppState;
  addExpense(input: AddExpenseInput): Result<void>;
  addCategory(name: string): Result<void>;
  renameCategory(categoryId: string, newName: string): Result<void>;
  deleteCategory(categoryId: string): Result<void>;
  setBudget(categoryId: string, amount: number): Result<void>;
};
```

## Modelos de datos

- **`Category`**: `id` estable (no cambia al renombrar), `name` no vacío. La categoría con
  `id === UNCATEGORIZED_ID` ("Sin categoría") siempre existe en `state.categories` desde el
  estado semilla y nunca se borra.
- **`Expense`**: `amount` siempre > 0 y con a lo sumo 2 decimales (invariante garantizado por
  `expenses.addExpense`, nunca se guarda un `Expense` inválido). `categoryId` siempre referencia
  una categoría existente en el mismo `AppState`. `date` no es futura respecto al momento en que
  se creó.
- **`AppState.budgets`**: solo guarda el monto *actual* por categoría (no historial por mes),
  porque R4.1 pide que se repita hasta que se cambie y no hay reportes de meses anteriores en
  alcance. Ausencia de una clave = sin presupuesto definido (se lee como 0 vía
  `getBudgetForCategory`).

## Manejo de errores

| Situación | Comportamiento | Cubre |
|-----------|-----------------|-------|
| Nombre de categoría vacío o duplicado (sin distinguir mayúsculas/espacios) | `addCategory`/`renameCategory` devuelven `{ok:false, error}`, el estado no cambia | R1.3 |
| Intento de borrar o renombrar `UNCATEGORIZED_ID` | `deleteCategory`/`renameCategory` devuelven error, el estado no cambia | R1.6 |
| Monto de gasto ≤ 0 (después de redondear a 2 decimales) | `expenses.addExpense` devuelve error | R2.2 |
| Fecha de gasto posterior a `today` | `expenses.addExpense` devuelve error | R2.3 |
| `categoryId` inexistente al agregar gasto o definir presupuesto | `expenses.addExpense` / `budgets.setBudget` devuelven error | R2.5, R4.5 |
| Monto de presupuesto ≤ 0 | `budgets.setBudget` devuelve error | R4.3 |
| `localStorage` con JSON inválido o con forma inesperada | `storage.load()` captura la excepción/valida la forma y devuelve `categories.createSeedState()` | R3.3 |

En todos los casos, el componente que llamó a la operación recibe el `Result` y muestra
`error` cerca del campo correspondiente; ninguna función de dominio lanza excepciones para
errores de validación esperados.

## Estrategia de testing

TDD estricto en `domain/*` (test que falla → implementar → test que pasa), porque ahí vive toda
la regla de negocio y no depende de React ni del navegador.

| Test | Qué verifica | Cubre |
|------|---------------|-------|
| `categories.test.ts`: primer uso sin estado guardado | `createSeedState()` incluye las categorías semilla + "Sin categoría" | R1.1 |
| `categories.test.ts`: crear con nombre válido | se agrega a la lista | R1.2 |
| `categories.test.ts`: crear con nombre vacío / duplicado (variando mayúsculas) | devuelve error, no modifica estado | R1.3 |
| `categories.test.ts`: renombrar categoría existente | nombre actualizado, gastos/presupuestos la siguen referenciando por id | R1.4 |
| `categories.test.ts`: borrar categoría con gastos | esos gastos quedan con `categoryId = UNCATEGORIZED_ID`, presupuesto de la categoría borrada se descarta | R1.5 |
| `categories.test.ts`: borrar o renombrar "Sin categoría" | devuelve error, estado sin cambios | R1.6 |
| `expenses.test.ts`: alta válida | gasto guardado y visible en `state.expenses` | R2.1 |
| `expenses.test.ts`: monto 0 y monto negativo | error, no se agrega | R2.2 |
| `expenses.test.ts`: fecha futura vs `today` | error, no se agrega | R2.3 |
| `expenses.test.ts`: sin descripción | se guarda igual, `description` ausente | R2.4 |
| `expenses.test.ts`: `categoryId` vacío o inexistente | error, no se agrega | R2.5 |
| `expenses.test.ts`: monto con 3+ decimales | se redondea a 2 antes de validar y guardar | R6.2 |
| `storage.test.ts`: guardar y volver a leer | `load()` después de `save(state)` devuelve el mismo `AppState` | R3.1 |
| `storage.test.ts`: valor corrupto en localStorage (JSON inválido y JSON válido con forma inesperada) | `load()` devuelve `createSeedState()` sin lanzar | R3.3 |
| `budgets.test.ts`: definir presupuesto válido, y volver a leerlo para el mes siguiente | mismo monto persiste sin redefinirlo | R4.1, R4.2 |
| `budgets.test.ts`: presupuesto ≤ 0 | error, no se agrega | R4.3 |
| `budgets.test.ts`: categoría no tiene presupuesto | `getBudgetForCategory` devuelve 0 | R4.4 |
| `budgets.test.ts`: `categoryId` inexistente | error | R4.5 |
| `summary.test.ts`: gastos de varias categorías y meses | solo suma los del mes de `referenceDate` | R5.1, R5.3 |
| `summary.test.ts`: gastado > presupuesto | `exceeded: true` | R5.2 |
| `money.test.ts`: `round2` y `formatAmount` | redondeo y formato con punto decimal, 2 decimales | R6.1, R6.2 |

En `components/` y `storage/` (la parte que sí toca DOM o `localStorage` real vía `jsdom`), tests
con `@testing-library/react` solo donde aporten algo que el test de dominio no cubre:
`ExpenseForm` muestra el mensaje de error que devuelve `domain` (integración componente↔dominio),
`CategoryManager` no ofrece la opción de borrar/renombrar "Sin categoría" en la UI, `Summary`
marca visualmente la categoría excedida. No se apunta a cobertura completa de componentes.

## Decisiones y alternativas descartadas

| Decisión | Alternativa considerada | Por qué se descartó |
|----------|--------------------------|------------------------|
| Funciones puras devuelven `Result<T>` en vez de lanzar excepciones | `throw` + `try/catch` en cada operación | Los errores de validación (monto inválido, categoría inexistente) son esperados, no excepcionales; `Result` los hace parte de la firma y más fácil de testear sin `try/catch` en cada test |
| `useAppState` expone funciones de operación (`addExpense`, etc.) sobre `useState` | `useReducer` + `dispatch` clásico | `dispatch` no tiene forma directa de devolver el error de validación al llamador de forma síncrona; las funciones de operación devuelven el `Result` directamente al componente |
| `budgets` guarda solo el monto actual por categoría | Guardar un registro por mes desde el arranque | No hay reportes históricos en el alcance (R5 es solo mes actual); guardar historial sería construir para un requisito que no existe |
| Un único registro JSON en `localStorage` con todo el `AppState` | Una clave por entidad (categorías, gastos, presupuestos por separado) | Guardar y leer atómicamente es más simple, y el fallback ante corrupción (R3.3) es "todo o nada" por diseño; separar en claves obliga a manejar corrupción parcial sin necesidad real |
| Montos formateados con `toFixed(2)` (punto decimal fijo) | `Intl.NumberFormat` con configuración regional | R6.1 pide un formato fijo de una sola moneda, sin selector; `Intl.NumberFormat` resolvería un problema (localización) que está explícitamente fuera de alcance |

## Riesgos y preguntas abiertas

- Los ids de categoría y gasto se generan con `crypto.randomUUID()` (disponible en navegadores
  modernos). Si en algún momento hace falta soportar un navegador sin esa API, hará falta un
  polyfill o un generador propio — no es un problema para esta v1.
- El redondeo de punto flotante (`round2`) puede tener casos límite raros (ej. `1.005`); se
  resuelve con `Number(amount.toFixed(2))`, que cubre bien los montos que entran desde un
  `<input type="number">` de a lo sumo 2-3 decimales.
