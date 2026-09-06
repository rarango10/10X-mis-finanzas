# Design — Split de gastos entre varias personas

> Requirements: [`./requirements.md`](./requirements.md)
> Estado: aprobado (2026-09-05)

## Resumen de la solución

Un núcleo de dominio en TypeScript puro bajo `src/split/`, sin dependencias más allá de
TypeScript y Vitest. Todo el estado vive en un único valor inmutable, el `Ledger`: la lista de
personas, los gastos compartidos y los pagos. Cada operación es una función pura que recibe el
ledger actual y devuelve un `Result<T>`: o un ledger nuevo, o un mensaje de error, sin tocar
nunca el original ni producir efectos. El saldo y las transferencias sugeridas no se guardan:
se derivan del ledger cada vez que se piden, así que no pueden quedar desactualizados.

Dos decisiones sostienen todo lo demás. **Los montos son enteros de centavos**, porque R3.3
("la suma de las partes es exactamente el monto") y R6.4 ("la suma de los saldos es exactamente
cero") son invariantes de igualdad exacta, y ningún `number` decimal las sostiene. Y **nada lee
el reloj ni genera azar**: la fecha de hoy entra por parámetro y los identificadores salen de un
contador guardado en el propio ledger, de modo que cada función es determinista y testeable sin
mocks.

## Puesta a punto del proyecto

El repositorio todavía no tiene código: no hay `package.json`, `tsconfig.json` ni `src/`. Esta
feature los crea, con lo mínimo que declara `CLAUDE.md`:

- `package.json` con TypeScript y Vitest como únicas dependencias de desarrollo, y los scripts
  `typecheck` (`tsc --noEmit`) y `test` (`vitest run`).
- `tsconfig.json` en modo `strict`, con `"module": "nodenext"`.
- Tests junto al código, como `src/split/<unidad>.test.ts`, que es lo que Vitest levanta por
  defecto.

## Arquitectura

| Unidad | Responsabilidad | Depende de | Cubre |
|--------|-----------------|------------|-------|
| `split/models.ts` | Tipos del dominio (`Ledger`, `Person`, `SharedExpense`, `Settlement`, `Balance`, `Transfer`) y `Result<T>` | — | base de todo |
| `split/money.ts` | Aritmética de centavos: reparto en partes iguales con sobrante, y helpers de borde (`toCents`, `formatAmount`) | — | R3.1, R3.2, R3.3 |
| `split/ledger.ts` | Crear un ledger vacío y emitir el próximo identificador a partir del contador | `models` | R1.1, R2.9, R4.7 |
| `split/people.ts` | Alta, renombre y baja de personas, con sus validaciones | `models`, `ledger` | R1.1–R1.8 |
| `split/expenses.ts` | Alta y eliminación de gastos compartidos, con sus validaciones | `models`, `ledger` | R2.1–R2.9, R5.1, R5.3 |
| `split/settlements.ts` | Alta y eliminación de pagos entre personas, con sus validaciones | `models`, `ledger` | R4.1–R4.7, R5.2, R5.3 |
| `split/balance.ts` | Derivar el saldo de cada persona y las transferencias que lo dejan en cero | `models`, `money` | R6.1–R6.4, R7.1–R7.4 |
| `split/index.ts` | Punto de entrada público: reexporta tipos y operaciones | todas | — |

Las tres unidades de escritura (`people`, `expenses`, `settlements`) no se conocen entre sí: la
única forma en que se relacionan es a través del `Ledger` que reciben y devuelven. `balance.ts`
solo lee. Esa separación es la que permite testear cada una sin construir el resto.

## Flujo de datos

1. Quien consume el núcleo arranca con `createLedger()`, o con un `Ledger` que recuperó de donde
   lo haya guardado (fuera de alcance acá).
2. Para modificar algo llama a la operación correspondiente pasándole el ledger actual, la
   entrada, y —en las altas de gasto y de pago— la fecha de hoy en formato ISO.
3. La operación valida la entrada contra el ledger recibido: existencia de las personas
   involucradas, monto, duplicados, fecha. Ante el primer problema corta y devuelve
   `{ ok: false, error }` sin haber modificado nada.
4. Si la entrada es válida, la operación toma el próximo identificador del contador del ledger,
   arma la entidad nueva y devuelve `{ ok: true, value: { ledger, id } }` con un ledger nuevo:
   el contador incrementado y la entidad agregada. El ledger de entrada queda intacto.
5. Para consultar el estado, `computeBalances(ledger)` recorre gastos y pagos y arma el saldo de
   cada persona; nada se guarda.
6. `suggestTransfers(balances)` toma esos saldos y devuelve la lista de pagos que los deja
   todos en cero. Registrar esos pagos con `addSettlement` es decisión de quien consume, no algo
   que el núcleo haga solo.

## Interfaces

```ts
// models.ts
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type PersonId = string;
export type ExpenseId = string;
export type SettlementId = string;
export type IsoDate = string;            // "AAAA-MM-DD"

export type Created<Id> = { ledger: Ledger; id: Id };

// money.ts
export function splitEqually(totalCents: number, parts: number): number[];
export function toCents(amount: number): number;      // helper de borde: 10.5 -> 1050
export function formatAmount(cents: number): string;  // helper de borde: 1050 -> "10.50"

// ledger.ts
export function createLedger(): Ledger;

// people.ts
export function addPerson(ledger: Ledger, name: string): Result<Created<PersonId>>;
export function renamePerson(ledger: Ledger, id: PersonId, name: string): Result<Ledger>;
export function removePerson(ledger: Ledger, id: PersonId): Result<Ledger>;

// expenses.ts
export interface NewExpense {
  amountCents: number;
  paidBy: PersonId;
  participants: PersonId[];   // el orden importa: define quién recibe los centavos sobrantes
  date: IsoDate;
  description?: string;
}
export function addExpense(
  ledger: Ledger, input: NewExpense, today: IsoDate,
): Result<Created<ExpenseId>>;
export function removeExpense(ledger: Ledger, id: ExpenseId): Result<Ledger>;

// settlements.ts
export interface NewSettlement {
  amountCents: number;
  from: PersonId;             // quien paga
  to: PersonId;               // quien recibe
  date: IsoDate;
}
export function addSettlement(
  ledger: Ledger, input: NewSettlement, today: IsoDate,
): Result<Created<SettlementId>>;
export function removeSettlement(ledger: Ledger, id: SettlementId): Result<Ledger>;

// balance.ts
export function computeBalances(ledger: Ledger): Balance[];
export function suggestTransfers(balances: Balance[]): Transfer[];
```

Ninguna función lanza excepciones para casos de negocio: todo lo previsto por los criterios
IF/THEN vuelve como `{ ok: false, error }`.

## Modelos de datos

```ts
export interface Person {
  id: PersonId;
  name: string;               // no vacío, único sin distinguir mayúsculas (R1.1, R1.3)
}

export interface SharedExpense {
  id: ExpenseId;
  amountCents: number;        // entero > 0 (R2.4)
  paidBy: PersonId;           // existe en people; puede no estar en participants (R2.2)
  participants: PersonId[];   // al menos 1, sin repetidos, orden significativo (R2.5, R2.7, R3.2)
  date: IsoDate;              // no futura al registrarse (R2.8)
  description?: string;       // opcional (R2.3)
}

export interface Settlement {
  id: SettlementId;
  amountCents: number;        // entero > 0 (R4.2)
  from: PersonId;             // distinto de `to` (R4.3)
  to: PersonId;
  date: IsoDate;              // no futura al registrarse (R4.5)
}

export interface Ledger {
  people: Person[];
  expenses: SharedExpense[];
  settlements: Settlement[];
  seq: number;                // contador monótono; fuente de todos los identificadores
}

export interface Balance {
  personId: PersonId;
  amountCents: number;        // > 0 a favor, < 0 en contra (R6.2)
}

export interface Transfer {
  from: PersonId;
  to: PersonId;
  amountCents: number;        // siempre > 0 (R7.1)
}
```

**Invariantes que el diseño mantiene por construcción**

- `seq` solo crece. Los identificadores se emiten como `p-1`, `e-2`, `s-3`… y nunca se reusan,
  ni siquiera después de eliminar una entrada (R5). Quien persista el ledger tiene que guardar
  `seq` junto con el resto, o los identificadores se repetirán al recargar.
- Todos los montos son enteros de centavos. Ninguna operación del núcleo produce decimales.
- Toda operación devuelve un ledger nuevo; el recibido nunca se modifica.

## Algoritmos

### Reparto en partes iguales — `splitEqually` (R3.1–R3.3)

```
base    = Math.floor(totalCents / parts)
sobra   = totalCents - base * parts        // entre 0 y parts-1
parte_i = base + (i < sobra ? 1 : 0)
```

Con `sobra = 0` todas las partes son iguales (R3.1). Con sobrante, los centavos van de a uno a
los primeros participantes en el orden en que fueron indicados (R3.2). La suma da exactamente
`totalCents` por construcción, no por una comprobación aparte (R3.3). Ejemplo: 1000 entre 3 da
`[334, 333, 333]`.

### Saldo — `computeBalances` (R6.1–R6.4)

Se arranca con cero para cada persona de `ledger.people`, respetando ese orden (R6.3). Después:

- Por cada gasto: se le suma `amountCents` a quien pagó, y se le resta a cada participante su
  parte según `splitEqually`.
- Por cada pago: se le suma `amountCents` a quien pagó y se le resta a quien recibió.

El signo sale de esa cuenta, sin ningún ajuste posterior (R6.2). Cada gasto y cada pago suman y
restan exactamente el mismo total, así que la suma de todos los saldos arranca en cero y se
mantiene en cero (R6.4).

### Transferencias sugeridas — `suggestTransfers` (R7.1–R7.4)

Greedy sobre dos listas: deudores (saldo negativo) ordenados del más negativo al menos, y
acreedores (saldo positivo) del mayor al menor; los empates se rompen por la posición de la
persona en `ledger.people`, para que el resultado sea determinista. Mientras queden ambas
listas: se emite una transferencia del mayor deudor al mayor acreedor por
`min(|deuda|, crédito)`, se descuenta de los dos y se descarta al que llegó a cero.

Los saldos en cero nunca entran a ninguna de las dos listas, así que ninguna persona puede
aparecer como pagadora y como cobradora a la vez (R7.3) y ningún monto emitido es cero (R7.1).
Como la suma de los saldos es cero (R6.4), las dos listas se vacían juntas y todos terminan en
cero (R7.2). Sin saldos distintos de cero, el bucle no se ejecuta y la lista sale vacía (R7.4).

## Manejo de errores

| Situación | Comportamiento | Cubre |
|-----------|----------------|-------|
| Nombre de persona vacío o solo espacios, al agregar | `{ ok: false }`, mensaje que dice que el nombre no puede estar vacío | R1.2 |
| Nombre de persona ya existente (comparado en minúsculas y sin espacios al borde), al agregar | `{ ok: false }`, mensaje con el nombre en conflicto | R1.3 |
| Nombre vacío o duplicado con **otra** persona, al renombrar | `{ ok: false }`; renombrar a alguien con su propio nombre es válido | R1.7 |
| Baja de una persona que figura en algún gasto o pago | `{ ok: false }`, mensaje que dice que primero hay que eliminar esas entradas | R1.6 |
| Renombre o baja de una persona inexistente | `{ ok: false }`, mensaje con el identificador buscado | R1.8 |
| Monto de gasto menor o igual a 0 | `{ ok: false }` | R2.4 |
| Gasto sin participantes | `{ ok: false }` | R2.5 |
| Pagador o participante inexistente | `{ ok: false }`, mensaje con el identificador buscado | R2.6 |
| Participante repetido en un gasto | `{ ok: false }` | R2.7 |
| Fecha de gasto posterior a `today` | `{ ok: false }` | R2.8 |
| Monto de pago menor o igual a 0 | `{ ok: false }` | R4.2 |
| Pago de una persona a sí misma | `{ ok: false }` | R4.3 |
| Quien paga o quien recibe no existe | `{ ok: false }` | R4.4 |
| Fecha de pago posterior a `today` | `{ ok: false }` | R4.5 |
| Eliminación de un gasto o un pago inexistente | `{ ok: false }`, mensaje con el identificador buscado | R5.3 |
| Monto en centavos no entero o no finito | `{ ok: false }`; defensa del invariante de centavos, sin criterio propio | — |

Las validaciones corren en el orden de la tabla dentro de cada operación y se corta en la
primera que falla, así que un input con dos problemas reporta solo el primero. Es deliberado:
un solo mensaje claro es más útil que una lista, y ningún criterio pide acumularlos.

## Estrategia de testing

Vitest, TDD estricto: primero el test que falla. El orden de abajo es también el orden en que
conviene construir, porque cada bloque solo depende de los anteriores.

| Test | Qué verifica | Cubre |
|------|--------------|-------|
| `splitEqually` con monto divisible | 900 entre 3 da `[300, 300, 300]` | R3.1 |
| `splitEqually` con sobrante | 1000 entre 3 da `[334, 333, 333]` | R3.2 |
| `splitEqually` suma exacta | para varios montos y cantidades, la suma es el total | R3.3 |
| Alta de persona válida | queda en la lista y recibe un identificador propio | R1.1 |
| Alta con nombre vacío / con nombre repetido en otras mayúsculas | se rechaza con motivo | R1.2, R1.3 |
| Renombre válido | cambia el nombre y los gastos previos siguen apuntando a la misma persona | R1.4 |
| Renombre inválido, duplicado, y a su propio nombre | los dos primeros se rechazan, el tercero no | R1.7 |
| Baja de persona sin entradas / con entradas | la primera sale, la segunda se rechaza | R1.5, R1.6 |
| Renombre y baja sobre un identificador inexistente | se rechazan con motivo | R1.8 |
| Alta de gasto válido | queda registrado, con identificador, y afecta el saldo | R2.1, R2.9 |
| Gasto pagado por alguien que no participa | se acepta y quien pagó no carga ninguna parte | R2.2 |
| Gasto sin descripción | se acepta igual | R2.3 |
| Gasto con monto 0 o negativo, sin participantes, con persona inexistente, con participante repetido, con fecha futura | cada uno se rechaza con motivo | R2.4–R2.8 |
| Alta de pago válido | queda registrado, con identificador, y mueve el saldo de ambos | R4.1, R4.7 |
| Pago que excede la deuda | se acepta y el saldo queda a favor de quien pagó | R4.6 |
| Pago con monto 0 o negativo, a sí mismo, con persona inexistente, con fecha futura | cada uno se rechaza con motivo | R4.2–R4.5 |
| Eliminación de gasto y de pago existentes | el saldo vuelve a ser el que era antes de cargarlos | R5.1, R5.2 |
| Eliminación de un identificador inexistente | se rechaza con motivo | R5.3 |
| Saldo de un caso armado a mano | los montos y los signos coinciden con la cuenta esperada | R6.1, R6.2 |
| Saldo de una persona sin ninguna entrada | aparece en el resultado, en cero | R6.3 |
| Invariante de saldos | en escenarios con sobrantes de centavos, la suma da exactamente 0 | R6.4 |
| Transferencias de un caso con varios deudores y acreedores | montos positivos, y nadie paga y cobra a la vez | R7.1, R7.3 |
| Invariante de transferencias | aplicadas todas con `addSettlement`, los saldos quedan en cero | R7.2 |
| Transferencias con todos en cero | lista vacía | R7.4 |

**Casos borde sin criterio propio, que igual conviene cubrir**

- Ledger recién creado: `computeBalances` da `[]` y `suggestTransfers` da `[]`.
- Gasto con un único participante que además es quien pagó: su saldo no se mueve.
- Inmutabilidad: después de cualquier operación exitosa, el ledger que se pasó sigue igual.
- Los identificadores no se reusan: eliminar la última entrada y crear otra da un id distinto.

## Decisiones y alternativas descartadas

| Decisión | Alternativa considerada | Por qué se descartó |
|----------|-------------------------|---------------------|
| Montos como enteros de centavos en toda la API | `number` con dos decimales, como en la v1 archivada | R3.3 y R6.4 piden igualdad exacta; con punto flotante `0.1 + 0.2 !== 0.3` y esas invariantes fallan por diseño. Los helpers `toCents`/`formatAmount` cubren el borde |
| Identificadores desde un contador `seq` en el ledger | `crypto.randomUUID()` dentro de cada alta | Volvería impuras todas las operaciones y obligaría a mockear en cada test. El costo es que quien persista tiene que guardar `seq` |
| La fecha de hoy entra por parámetro | Leer `new Date()` dentro de la operación | Mismo motivo: los tests de R2.8 y R4.5 pasarían a depender del día en que corren |
| Greedy mayor deudor ↔ mayor acreedor | Búsqueda exhaustiva del conjunto mínimo de transferencias | R7 solo pide que salden todo (fue la decisión explícita al escribir los requisitos); minimizar es NP-duro y no aporta nada acá |
| Saldo derivado en cada consulta | Saldo guardado en el ledger y actualizado en cada alta | Un saldo guardado puede desincronizarse, y R5 (eliminar entradas) obligaría a revertirlo a mano. A esta escala recorrer todo es gratis |
| `Ledger` con arrays planos | Índices o `Map` por identificador | YAGNI para una convivencia; los arrays se serializan solos cuando aparezca la persistencia |
| Cortar en la primera validación que falla | Acumular todos los errores de un input | Ningún criterio lo pide y complica cada mensaje |

## Riesgos y preguntas abiertas

- **`seq` es parte del estado, no un detalle.** Si quien implemente la persistencia guarda solo
  personas, gastos y pagos, al recargar los identificadores vuelven a empezar y se pisan con los
  existentes. Hay que dejarlo escrito cuando llegue esa feature.
- **El formato de `IsoDate` no se valida.** La comparación "no futura" de R2.8 y R4.5 es una
  comparación de strings, que solo es correcta con `AAAA-MM-DD` de ancho fijo. El núcleo confía
  en que quien lo consume respete el formato; validarlo sería un criterio nuevo y no lo hay.
- **`computeBalances` recorre todo el ledger en cada llamada.** Es O(gastos × participantes) y a
  la escala de una convivencia es irrelevante, pero deja de serlo si algún día esto se usa para
  algo mucho más grande.
- **Sigue abierto qué hacer con alguien que se va del grupo con saldo distinto de cero**, tal
  como quedó anotado en los requirements: R1.6 le impide darse de baja mientras tenga entradas.
