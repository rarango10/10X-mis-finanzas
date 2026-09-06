# Requirements — Split de gastos entre varias personas

> Estado: aprobado (2026-09-05)

## Introducción

Quienes conviven —una pareja, un grupo de roommates— pagan gastos comunes de forma desordenada:
uno pone el supermercado, otro el alquiler, otro la cuenta de luz, y no siempre participan todos
en cada gasto. Hoy eso se lleva de memoria o en una planilla, y la cuenta de quién puso de más
se rehace a mano cada vez que alguien pregunta.

Esta feature construye el núcleo que lleva ese registro: una lista de personas, los gastos
compartidos con quién pagó y entre quiénes se reparte, los pagos que se hacen para emparejarse,
y a partir de todo eso el saldo de cada persona y las transferencias que hacen falta para dejar
a todos en cero. Es un saldo corriente que nunca se "cierra": se sigue cargando indefinidamente.
Cuando funcione, en cualquier momento se puede preguntar "¿cómo estamos?" y obtener, sin hacer
ninguna cuenta a mano, cuánto tiene a favor o en contra cada uno y quién le tiene que pagar a
quién.

## Alcance

**Incluye**
- Mantener la lista de personas que comparten gastos: alta, cambio de nombre y baja.
- Registrar gastos compartidos indicando monto, quién pagó, quiénes participan y la fecha.
- Repartir cada gasto en partes iguales entre sus participantes, exacto al centavo.
- Elegir en cada gasto quiénes participan, que pueden ser todos o solo algunos.
- Registrar pagos de una persona a otra para emparejar el saldo.
- Eliminar un gasto o un pago cargado por error.
- Calcular el saldo de cada persona: cuánto tiene a favor o en contra.
- Sugerir un conjunto de transferencias que deja a todas las personas en saldo cero.

**No incluye (por ahora)**
- Repartos con porcentajes o montos a medida por persona — el acuerdo es partes iguales.
- Editar un gasto o un pago ya cargado; corregir un error se hace eliminándolo y cargándolo
  de nuevo.
- Varios grupos simultáneos — hay un único conjunto de personas y un único saldo.
- Múltiples monedas o selector de moneda.
- Persistir el estado en disco, en el navegador o en cualquier otro lado.
- Interfaz de usuario, comandos de terminal o cualquier forma de entrada/salida.
- Categorías, presupuesto mensual o cualquier vínculo con las finanzas personales de una
  persona sola.
- Autenticación, cuentas de usuario o permisos: el registro lo lleva una sola persona.

## Requirements

### R1 — Gestión de personas

**User story:** Como quien lleva el registro, quiero mantener la lista de personas que comparten
gastos, para poder asignarles gastos y pagos.

#### Criterios de aceptación

1. WHEN se agrega una persona con un nombre no vacío que no coincide, sin distinguir mayúsculas
   y minúsculas, con el de ninguna persona existente
   THE SYSTEM SHALL incorporarla a la lista de personas y darle un identificador propio.
2. IF se intenta agregar una persona con un nombre vacío o compuesto solo por espacios
   THEN THE SYSTEM SHALL rechazar el alta e indicar el motivo.
3. IF se intenta agregar una persona cuyo nombre coincide, sin distinguir mayúsculas y
   minúsculas, con el de una persona existente
   THEN THE SYSTEM SHALL rechazar el alta e indicar el motivo.
4. WHEN se cambia el nombre de una persona por uno no vacío y no duplicado
   THE SYSTEM SHALL actualizar ese nombre sin alterar los gastos ni los pagos que ya la
   referencian.
5. WHEN se elimina una persona que no figura en ningún gasto ni en ningún pago
   THE SYSTEM SHALL quitarla de la lista de personas.
6. IF se intenta eliminar una persona que pagó o participó en algún gasto, o que figura en
   algún pago
   THEN THE SYSTEM SHALL rechazar la eliminación e indicar el motivo.

7. IF se intenta cambiar el nombre de una persona por uno vacío, compuesto solo por espacios, o
   que coincide, sin distinguir mayúsculas y minúsculas, con el de otra persona existente
   THEN THE SYSTEM SHALL rechazar el cambio e indicar el motivo.
8. IF se intenta cambiar el nombre de una persona que no existe en la lista, o eliminarla
   THEN THE SYSTEM SHALL rechazar la operación e indicar el motivo.

### R2 — Registro de gastos compartidos

**User story:** Como quien lleva el registro, quiero anotar un gasto indicando quién lo pagó y
entre quiénes se reparte, para que quede reflejado en el saldo de cada uno.

#### Criterios de aceptación

1. WHEN se registra un gasto con un monto mayor a 0, una persona pagadora existente, al menos
   un participante existente y una fecha no futura
   THE SYSTEM SHALL guardarlo e incluirlo en el cálculo del saldo de las personas involucradas.
2. WHERE la persona que pagó el gasto no figura entre sus participantes
   THE SYSTEM SHALL aceptar el gasto igualmente y no asignarle ninguna parte de ese gasto.
3. WHERE no se indicó una descripción para el gasto
   THE SYSTEM SHALL guardarlo igualmente sin descripción.
4. IF se intenta registrar un gasto con un monto menor o igual a 0
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
5. IF se intenta registrar un gasto sin ningún participante
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
6. IF se intenta registrar un gasto cuya persona pagadora, o alguno de cuyos participantes, no
   existe en la lista de personas
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
7. IF se intenta registrar un gasto con una misma persona repetida entre sus participantes
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
8. IF se intenta registrar un gasto con una fecha posterior a la fecha de hoy
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.

9. WHEN se registra un gasto válido
   THE SYSTEM SHALL darle un identificador propio que permita referirse a ese gasto después.

### R3 — Reparto del gasto en partes iguales

**User story:** Como participante de un gasto, quiero que mi parte sea una división en partes
iguales exacta al centavo, para que el saldo no acumule diferencias de redondeo.

#### Criterios de aceptación

1. WHEN el monto de un gasto se puede dividir en partes iguales entre sus participantes con dos
   decimales
   THE SYSTEM SHALL asignar a cada participante exactamente la misma parte.
2. IF el monto de un gasto no se puede dividir en partes iguales entre sus participantes con dos
   decimales
   THEN THE SYSTEM SHALL repartir los centavos sobrantes de a uno entre los primeros
   participantes, siguiendo el orden en que fueron indicados al registrar el gasto.
3. THE SYSTEM SHALL mantener la suma de las partes de un gasto exactamente igual al monto de
   ese gasto.

### R4 — Registro de pagos entre personas

**User story:** Como quien lleva el registro, quiero anotar cuando una persona le transfiere
plata a otra, para que el saldo refleje que se emparejaron.

#### Criterios de aceptación

1. WHEN se registra un pago con un monto mayor a 0, entre dos personas existentes y distintas,
   y con una fecha no futura
   THE SYSTEM SHALL guardarlo e incluirlo en el cálculo del saldo de ambas.
2. IF se intenta registrar un pago con un monto menor o igual a 0
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
3. IF se intenta registrar un pago en el que quien paga y quien recibe son la misma persona
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
4. IF se intenta registrar un pago en el que quien paga o quien recibe no existe en la lista de
   personas
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
5. IF se intenta registrar un pago con una fecha posterior a la fecha de hoy
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
6. WHERE el monto de un pago supera lo que quien paga le debía a quien recibe
   THE SYSTEM SHALL aceptarlo igualmente y reflejar el saldo resultante a favor de quien pagó.

7. WHEN se registra un pago válido
   THE SYSTEM SHALL darle un identificador propio que permita referirse a ese pago después.

### R5 — Corrección de entradas cargadas

**User story:** Como quien lleva el registro, quiero eliminar un gasto o un pago que cargué mal,
para que el saldo deje de arrastrar el error.

#### Criterios de aceptación

1. WHEN se elimina un gasto existente
   THE SYSTEM SHALL quitarlo del registro y calcular los saldos como si nunca se hubiera
   registrado.
2. WHEN se elimina un pago existente
   THE SYSTEM SHALL quitarlo del registro y calcular los saldos como si nunca se hubiera
   registrado.
3. IF se intenta eliminar un gasto o un pago que no existe en el registro
   THEN THE SYSTEM SHALL rechazar la eliminación e indicar el motivo.

### R6 — Saldo por persona

**User story:** Como integrante del grupo, quiero ver cuánto tengo a favor o en contra, para
saber si me deben o si debo.

#### Criterios de aceptación

1. THE SYSTEM SHALL calcular el saldo de cada persona restando, a todo lo que puso —el monto de
   los gastos que pagó más los pagos que hizo—, todo lo que le tocaba —la suma de sus partes en
   los gastos más los pagos que recibió.
2. THE SYSTEM SHALL expresar el saldo con signo positivo cuando la persona puso más de lo que le
   tocaba, y con signo negativo cuando puso menos.
3. THE SYSTEM SHALL informar un saldo por cada persona registrada, incluidas las que no figuran
   en ningún gasto ni pago, cuyo saldo es cero.
4. THE SYSTEM SHALL mantener la suma de los saldos de todas las personas exactamente en cero.

### R7 — Transferencias sugeridas para saldar

**User story:** Como integrante del grupo, quiero que el sistema me diga quién le tiene que pagar
a quién y cuánto, para emparejar los saldos sin hacer la cuenta a mano.

#### Criterios de aceptación

1. WHEN se piden las transferencias sugeridas y hay al menos una persona con saldo distinto de
   cero
   THE SYSTEM SHALL devolver una lista de transferencias, cada una con quien paga, quien recibe
   y un monto mayor a 0.
2. THE SYSTEM SHALL producir transferencias sugeridas tales que, registradas todas como pagos,
   el saldo de todas las personas queda en cero.
3. THE SYSTEM SHALL evitar que una misma persona figure a la vez como quien paga y como quien
   recibe dentro de la lista de transferencias sugeridas.
4. WHEN se piden las transferencias sugeridas y todas las personas tienen saldo cero
   THE SYSTEM SHALL devolver una lista vacía.

## Supuestos

- Hay una sola moneda y los montos tienen dos decimales; no hay selector de moneda ni conversión.
- Las fechas se manejan en formato ISO `AAAA-MM-DD`, como en el spec archivado de la v1.
- "Fecha no futura" se evalúa contra la fecha del día en que se registra la entrada.
- Hay un único grupo de convivencia: una sola lista de personas y un solo saldo, sin separación
  por grupo ni por evento.
- El orden de los participantes de un gasto es el que se indicó al registrarlo, y es el que
  determina quién recibe los centavos sobrantes (R3.2). No se reordena después.
- Las personas son datos del propio registro: no vienen de un sistema externo ni tienen cuenta.
- El registro lo lleva una sola persona en un solo lugar; no hay sincronización entre
  dispositivos ni resolución de conflictos.
- Quien consuma este núcleo se hace cargo de guardar y recuperar el estado; la feature no
  persiste nada.

## Preguntas abiertas

- Qué hacer cuando alguien se va del grupo con saldo distinto de cero: hoy R1.6 impide darlo de
  baja mientras tenga gastos o pagos, así que queda en la lista para siempre. No bloquea esta
  feature; se decide con Raúl si aparece el caso real.
- Cómo se va a usar este núcleo (CLI, web app u otra cosa) y dónde se persistirá el estado.
  Es una feature posterior y no cambia ningún criterio de acá.
