# Tasks — Split de gastos entre varias personas

> Requirements: [`./requirements.md`](./requirements.md) · Design: [`./design.md`](./design.md)
> Estado: pendiente de aprobación

## Plan

| # | Tarea | Cubre | Estado |
|---|-------|-------|--------|
| T1 | Poner a punto el proyecto y repartir un monto divisible en partes iguales | R3.1 | pendiente |
| T2 | Repartir los centavos sobrantes entre los primeros participantes | R3.2, R3.3 | pendiente |
| T3 | Definir los tipos del dominio y el ledger vacío con emisión de identificadores | — | pendiente |
| T4 | Dar de alta una persona con nombre válido | R1.1 | pendiente |
| T5 | Rechazar el alta de persona con nombre vacío o duplicado | R1.2, R1.3 | pendiente |
| T6 | Renombrar una persona sin alterar lo que la referencia | R1.4 | pendiente |
| T7 | Rechazar el renombre con nombre vacío o duplicado con otra persona | R1.7 | pendiente |
| T8 | Dar de baja una persona que no figura en ningún gasto ni pago | R1.5 | pendiente |
| T9 | Rechazar la baja de una persona referenciada por un gasto o un pago | R1.6 | pendiente |
| T10 | Rechazar renombre y baja sobre una persona inexistente | R1.8 | pendiente |
| T11 | Registrar un gasto compartido válido, con y sin descripción | R2.1, R2.3, R2.9 | pendiente |
| T12 | Rechazar gastos con monto, participantes o repetidos inválidos | R2.4, R2.5, R2.7 | pendiente |
| T13 | Rechazar gastos con personas inexistentes o fecha futura | R2.6, R2.8 | pendiente |
| T14 | Registrar un pago válido entre dos personas | R4.1, R4.7 | pendiente |
| T15 | Rechazar pagos con monto inválido o de una persona a sí misma | R4.2, R4.3 | pendiente |
| T16 | Rechazar pagos con personas inexistentes o fecha futura | R4.4, R4.5 | pendiente |
| T17 | Informar un saldo por cada persona registrada, en cero cuando no tiene entradas | R6.3 | pendiente |
| T18 | Calcular el saldo restando a lo que cada persona puso lo que le tocaba | R6.1, R6.2 | pendiente |
| T19 | Mantener la suma de los saldos exactamente en cero | R6.4 | pendiente |
| T20 | No asignar ninguna parte a quien pagó un gasto sin participar | R2.2 | pendiente |
| T21 | Aceptar un pago que supera la deuda y dejar el saldo a favor de quien pagó | R4.6 | pendiente |
| T22 | Eliminar un gasto existente y recalcular como si nunca se hubiera registrado | R5.1 | pendiente |
| T23 | Eliminar un pago existente y recalcular como si nunca se hubiera registrado | R5.2 | pendiente |
| T24 | Rechazar la eliminación de un gasto o un pago inexistente | R5.3 | pendiente |
| T25 | Devolver una lista vacía de transferencias cuando todos están en cero | R7.4 | pendiente |
| T26 | Sugerir transferencias del mayor deudor al mayor acreedor | R7.1, R7.3 | pendiente |
| T27 | Garantizar que las transferencias sugeridas dejan todos los saldos en cero | R7.2 | pendiente |
| T28 | Convertir montos decimales a centavos y formatearlos de vuelta | — | pendiente |
| T29 | Exponer el punto de entrada público del núcleo | — | pendiente |

**Criterios sin tarea asignada:** ninguno

## Bitácora

### T1 — Poner a punto el proyecto y repartir un monto divisible en partes iguales

**Objetivo:** El repo tiene package.json (TypeScript y Vitest como únicas devDependencies, scripts typecheck y test), tsconfig.json en modo strict con module nodenext, y src/split/money.ts con splitEqually devolviendo partes exactamente iguales cuando el monto es divisible. npm run typecheck y npm test corren en verde.
**Cubre:** R3.1
**Primer test (rojo):** splitEqually(900, 3) devuelve [300, 300, 300]

**Registro** — <completar al implementar; fecha>

### T2 — Repartir los centavos sobrantes entre los primeros participantes

**Objetivo:** splitEqually reparte el sobrante de a un centavo entre los primeros participantes según el orden recibido, y la suma de las partes es exactamente el total para cualquier combinación de monto y cantidad.
**Cubre:** R3.2, R3.3
**Primer test (rojo):** splitEqually(1000, 3) devuelve [334, 333, 333]

**Registro** — <completar al implementar; fecha>

### T3 — Definir los tipos del dominio y el ledger vacío con emisión de identificadores

**Objetivo:** Existen src/split/models.ts con los tipos del dominio (Result, Ledger, Person, SharedExpense, Settlement, Balance, Transfer, ids y IsoDate) y src/split/ledger.ts con createLedger() y la emisión del próximo identificador a partir de seq, con el prefijo por tipo de entidad y sin reutilizar números.
**Cubre:** —
**Por qué no cubre criterios:** Infraestructura compartida definida en design.md (models.ts y ledger.ts): sin Ledger, Result ni contador seq no se puede escribir el primer test de ninguna operación. Los criterios de identificador (R1.1, R2.9, R4.7) se verifican en las tareas de alta que los usan.
**Primer test (rojo):** createLedger() devuelve un ledger con people, expenses y settlements vacíos y seq en 0

**Registro** — <completar al implementar; fecha>

### T4 — Dar de alta una persona con nombre válido

**Objetivo:** addPerson agrega la persona a la lista con un identificador propio y devuelve { ok: true } con el ledger nuevo; el ledger recibido queda intacto y dos altas seguidas reciben identificadores distintos.
**Cubre:** R1.1
**Primer test (rojo):** addPerson sobre un ledger vacío con el nombre "Ana" devuelve ok y un ledger cuya lista de personas tiene a Ana con un id propio

**Registro** — <completar al implementar; fecha>

### T5 — Rechazar el alta de persona con nombre vacío o duplicado

**Objetivo:** addPerson devuelve { ok: false, error } con el motivo cuando el nombre está vacío o es solo espacios, y cuando coincide con el de una persona existente comparando en minúsculas y sin espacios al borde. En ambos casos el ledger no cambia.
**Cubre:** R1.2, R1.3
**Primer test (rojo):** addPerson con el nombre "   " devuelve { ok: false } con un mensaje que dice que el nombre no puede estar vacío

**Registro** — <completar al implementar; fecha>

### T6 — Renombrar una persona sin alterar lo que la referencia

**Objetivo:** renamePerson cambia el nombre de la persona indicada y devuelve el ledger nuevo; los gastos y pagos del ledger siguen apuntando al mismo identificador, sin cambios.
**Cubre:** R1.4
**Primer test (rojo):** renamePerson sobre una persona existente con un nombre nuevo y libre devuelve ok y el ledger tiene esa persona con el nombre nuevo y el mismo id

**Registro** — <completar al implementar; fecha>

### T7 — Rechazar el renombre con nombre vacío o duplicado con otra persona

**Objetivo:** renamePerson devuelve { ok: false, error } cuando el nombre nuevo está vacío o es solo espacios, y cuando coincide sin distinguir mayúsculas con el de otra persona existente; renombrar a alguien con su propio nombre sigue siendo válido.
**Cubre:** R1.7
**Primer test (rojo):** renamePerson sobre una persona existente con el nombre "" devuelve { ok: false } con el motivo

**Registro** — <completar al implementar; fecha>

### T8 — Dar de baja una persona que no figura en ningún gasto ni pago

**Objetivo:** removePerson quita de la lista a la persona que no aparece en ningún gasto ni pago y devuelve el ledger nuevo, sin tocar al resto de las personas.
**Cubre:** R1.5
**Primer test (rojo):** removePerson sobre un ledger con dos personas y sin gastos ni pagos devuelve ok y la lista queda solo con la otra persona

**Registro** — <completar al implementar; fecha>

### T9 — Rechazar la baja de una persona referenciada por un gasto o un pago

**Objetivo:** removePerson devuelve { ok: false, error } cuando la persona pagó o participó en algún gasto, o figura como quien paga o quien recibe en algún pago, con un mensaje que dice que primero hay que eliminar esas entradas. El test arma el ledger a mano con los tipos de models.ts, porque addExpense y addSettlement todavía no existen.
**Cubre:** R1.6
**Primer test (rojo):** removePerson sobre una persona que figura como participante de un gasto del ledger devuelve { ok: false } con el motivo

**Registro** — <completar al implementar; fecha>

### T10 — Rechazar renombre y baja sobre una persona inexistente

**Objetivo:** renamePerson y removePerson devuelven { ok: false, error } con un mensaje que incluye el identificador buscado cuando ese identificador no está en la lista de personas.
**Cubre:** R1.8
**Primer test (rojo):** renamePerson con un identificador que no existe en el ledger devuelve { ok: false } y el mensaje menciona ese identificador

**Registro** — <completar al implementar; fecha>

### T11 — Registrar un gasto compartido válido, con y sin descripción

**Objetivo:** addExpense guarda el gasto en el ledger con su monto, pagador, participantes en el orden recibido, fecha y descripción opcional, y devuelve un identificador propio; si no se indicó descripción el gasto se guarda igual sin ella. El ledger recibido no se modifica. Que el gasto entre en el cálculo del saldo se verifica en la tarea de computeBalances.
**Cubre:** R2.1, R2.3, R2.9
**Primer test (rojo):** addExpense sobre un ledger con dos personas, monto 1000, pagador y participantes existentes y fecha igual a today devuelve ok, un id propio y el gasto guardado en el ledger

**Registro** — <completar al implementar; fecha>

### T12 — Rechazar gastos con monto, participantes o repetidos inválidos

**Objetivo:** addExpense devuelve { ok: false, error } cuando el monto es menor o igual a 0, cuando la lista de participantes está vacía y cuando una misma persona aparece repetida entre los participantes. El ledger no cambia en ninguno de los tres casos.
**Cubre:** R2.4, R2.5, R2.7
**Primer test (rojo):** addExpense con amountCents 0 devuelve { ok: false } con el motivo

**Registro** — <completar al implementar; fecha>

### T13 — Rechazar gastos con personas inexistentes o fecha futura

**Objetivo:** addExpense devuelve { ok: false, error } cuando el pagador o algún participante no está en la lista de personas —con el identificador buscado en el mensaje— y cuando la fecha del gasto es posterior a today.
**Cubre:** R2.6, R2.8
**Primer test (rojo):** addExpense con un paidBy que no existe en el ledger devuelve { ok: false } y el mensaje menciona ese identificador

**Registro** — <completar al implementar; fecha>

### T14 — Registrar un pago válido entre dos personas

**Objetivo:** addSettlement guarda el pago con su monto, quien paga, quien recibe y la fecha, y devuelve un identificador propio; el ledger recibido no se modifica. El efecto sobre el saldo de ambas se verifica en la tarea de computeBalances.
**Cubre:** R4.1, R4.7
**Primer test (rojo):** addSettlement entre dos personas existentes y distintas, con monto 500 y fecha igual a today, devuelve ok, un id propio y el pago guardado en el ledger

**Registro** — <completar al implementar; fecha>

### T15 — Rechazar pagos con monto inválido o de una persona a sí misma

**Objetivo:** addSettlement devuelve { ok: false, error } cuando el monto es menor o igual a 0 y cuando quien paga y quien recibe son la misma persona. El ledger no cambia.
**Cubre:** R4.2, R4.3
**Primer test (rojo):** addSettlement con amountCents -100 devuelve { ok: false } con el motivo

**Registro** — <completar al implementar; fecha>

### T16 — Rechazar pagos con personas inexistentes o fecha futura

**Objetivo:** addSettlement devuelve { ok: false, error } cuando quien paga o quien recibe no está en la lista de personas, y cuando la fecha del pago es posterior a today.
**Cubre:** R4.4, R4.5
**Primer test (rojo):** addSettlement con un from que no existe en el ledger devuelve { ok: false } con el motivo

**Registro** — <completar al implementar; fecha>

### T17 — Informar un saldo por cada persona registrada, en cero cuando no tiene entradas

**Objetivo:** computeBalances devuelve un saldo por cada persona de ledger.people, respetando ese orden, y en cero para quien no figura en ningún gasto ni pago; sobre un ledger recién creado devuelve una lista vacía.
**Cubre:** R6.3
**Primer test (rojo):** computeBalances sobre un ledger con tres personas y sin gastos ni pagos devuelve tres saldos, todos en 0

**Registro** — <completar al implementar; fecha>

### T18 — Calcular el saldo restando a lo que cada persona puso lo que le tocaba

**Objetivo:** computeBalances suma a quien pagó el monto de cada gasto y le resta a cada participante su parte según splitEqually, y para cada pago suma a quien pagó y resta a quien recibió; el saldo queda positivo para quien puso de más y negativo para quien puso de menos, sin ajustes posteriores.
**Cubre:** R6.1, R6.2
**Primer test (rojo):** sobre un caso armado a mano con un gasto de 900 pagado por Ana entre Ana, Beto y Caro, computeBalances devuelve +600 para Ana y -300 para Beto y Caro

**Registro** — <completar al implementar; fecha>

### T19 — Mantener la suma de los saldos exactamente en cero

**Objetivo:** En escenarios con sobrantes de centavos y con gastos y pagos mezclados, la suma de los saldos de todas las personas da exactamente 0.
**Cubre:** R6.4
**Primer test (rojo):** sobre un ledger con un gasto de 1000 entre 3 participantes y un pago, la suma de los amountCents de todos los saldos es exactamente 0

**Registro** — <completar al implementar; fecha>

### T20 — No asignar ninguna parte a quien pagó un gasto sin participar

**Objetivo:** Un gasto cuyo pagador no figura entre los participantes se acepta, y en el saldo quien pagó recibe el monto completo a favor sin cargar ninguna parte; el gasto se reparte solo entre los participantes indicados.
**Cubre:** R2.2
**Primer test (rojo):** un gasto de 600 pagado por Ana con participantes [Beto, Caro] deja a Ana en +600 y a Beto y Caro en -300 cada uno

**Registro** — <completar al implementar; fecha>

### T21 — Aceptar un pago que supera la deuda y dejar el saldo a favor de quien pagó

**Objetivo:** addSettlement acepta un pago cuyo monto excede lo que quien paga le debía a quien recibe, y el saldo resultante queda a favor de quien pagó, sin ningún tope ni recorte del monto.
**Cubre:** R4.6
**Primer test (rojo):** sobre un ledger donde Beto le debe 300 a Ana, un pago de Beto a Ana por 500 se acepta y deja a Beto en +200 y a Ana en -200

**Registro** — <completar al implementar; fecha>

### T22 — Eliminar un gasto existente y recalcular como si nunca se hubiera registrado

**Objetivo:** removeExpense saca el gasto del ledger y devuelve el ledger nuevo; los saldos vuelven a ser exactamente los que había antes de cargarlo, y seq no se reusa: un gasto creado después recibe un identificador distinto.
**Cubre:** R5.1
**Primer test (rojo):** tras addExpense y removeExpense de ese mismo gasto, computeBalances devuelve los mismos saldos que antes del alta

**Registro** — <completar al implementar; fecha>

### T23 — Eliminar un pago existente y recalcular como si nunca se hubiera registrado

**Objetivo:** removeSettlement saca el pago del ledger y devuelve el ledger nuevo; los saldos vuelven a ser exactamente los que había antes de cargarlo.
**Cubre:** R5.2
**Primer test (rojo):** tras addSettlement y removeSettlement de ese mismo pago, computeBalances devuelve los mismos saldos que antes del alta

**Registro** — <completar al implementar; fecha>

### T24 — Rechazar la eliminación de un gasto o un pago inexistente

**Objetivo:** removeExpense y removeSettlement devuelven { ok: false, error } con el identificador buscado en el mensaje cuando ese identificador no está en el registro, y el ledger no cambia.
**Cubre:** R5.3
**Primer test (rojo):** removeExpense con un identificador que no existe devuelve { ok: false } y el mensaje menciona ese identificador

**Registro** — <completar al implementar; fecha>

### T25 — Devolver una lista vacía de transferencias cuando todos están en cero

**Objetivo:** suggestTransfers devuelve una lista vacía cuando todas las personas tienen saldo cero, y también sobre una lista de saldos vacía.
**Cubre:** R7.4
**Primer test (rojo):** suggestTransfers sobre tres saldos en 0 devuelve []

**Registro** — <completar al implementar; fecha>

### T26 — Sugerir transferencias del mayor deudor al mayor acreedor

**Objetivo:** suggestTransfers aplica el greedy del design (deudores del más negativo al menos, acreedores del mayor al menor, empates por el orden de la persona en el ledger) y devuelve transferencias con quien paga, quien recibe y monto mayor a 0; ninguna persona aparece a la vez como pagadora y como receptora, y el resultado es determinista.
**Cubre:** R7.1, R7.3
**Primer test (rojo):** sobre un caso con dos deudores y dos acreedores, suggestTransfers devuelve transferencias con montos todos mayores a 0 y ninguna persona figura en los dos lados

**Registro** — <completar al implementar; fecha>

### T27 — Garantizar que las transferencias sugeridas dejan todos los saldos en cero

**Objetivo:** Registrando todas las transferencias sugeridas como pagos con addSettlement, computeBalances devuelve 0 para todas las personas, incluso en escenarios con sobrantes de centavos.
**Cubre:** R7.2
**Primer test (rojo):** sobre un ledger con varios gastos y sobrantes, aplicar cada transferencia sugerida con addSettlement deja todos los saldos en 0

**Registro** — <completar al implementar; fecha>

### T28 — Convertir montos decimales a centavos y formatearlos de vuelta

**Objetivo:** money.ts exporta toCents, que convierte un monto decimal a centavos enteros (10.5 -> 1050) sin arrastrar el error de punto flotante, y formatAmount, que devuelve el string con dos decimales (1050 -> "10.50"), incluidos los montos negativos.
**Cubre:** —
**Por qué no cubre criterios:** Helpers de borde definidos explícitamente en la sección Interfaces de design.md (toCents, formatAmount). No tienen criterio propio porque son la frontera entre la entrada decimal de quien consume el núcleo y el invariante de centavos enteros; van al final porque ninguna operación del núcleo depende de ellos.
**Primer test (rojo):** toCents(10.5) devuelve 1050 y toCents(0.1 + 0.2) devuelve 30

**Registro** — <completar al implementar; fecha>

### T29 — Exponer el punto de entrada público del núcleo

**Objetivo:** src/split/index.ts reexporta los tipos y todas las operaciones del núcleo (createLedger, personas, gastos, pagos, saldos, transferencias y los helpers de monto), y un escenario completo importado solo desde index —altas de personas, gastos con sobrante, un pago, una eliminación, saldos y transferencias— se comporta como se espera y no modifica ningún ledger recibido. npm run typecheck y npm test en verde.
**Cubre:** —
**Por qué no cubre criterios:** Integración final: src/split/index.ts es la unidad que design.md define como punto de entrada público y es lo único que no cubre ningún criterio por sí mismo. Cierra la feature verificando de punta a punta, contra la API pública, un escenario completo que ninguna tarea anterior recorre entero.
**Primer test (rojo):** un escenario end-to-end que importa únicamente desde src/split/index.ts: crea el ledger, agrega tres personas y un gasto de 1000 entre las tres, y verifica que los saldos suman 0 y que las transferencias sugeridas los dejan en cero

**Registro** — <completar al implementar; fecha>

## Pendientes

- Ninguno detectado en esta pasada.
