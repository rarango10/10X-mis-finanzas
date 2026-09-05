# Tasks — <Nombre de la feature>

> Requirements: [`./requirements.md`](./requirements.md) · Design: [`./design.md`](./design.md)
> Estado: pendiente de aprobación | aprobado (AAAA-MM-DD)

## Plan

<Una fila por tarea, en el orden en que conviene hacerlas. El orden importa: cada tarea
debería dejar el repo funcionando y con los tests en verde, para poder parar en cualquier
punto sin quedar a mitad de camino.>

| # | Tarea | Cubre | Estado |
|---|-------|-------|--------|
| T1 | <qué se logra, en una línea> | R1.1, R1.2 | pendiente |
| T2 | <...> | — | pendiente |

<Estados: `pendiente` · `en curso` · `hecho`. Esta tabla es el único lugar donde vive el
estado — no lo repitas abajo, o van a terminar contradiciéndose.>

<Columna `Cubre`: los ids de criterio separados por coma. Si la tarea no cubre ninguno, va `—` y
el motivo se explica abajo, en su sección de bitácora. La tabla queda angosta y legible; la
justificación viaja pegada a la tarea.>

**Criterios sin tarea asignada:** <ninguno | R3.2 — y por qué (ej. se cubre en otra feature)>

## Bitácora

<Una sección por tarea. Al planificar solo existen el objetivo, qué cubre y el primer test.
El resto se completa mientras se trabaja: es el registro de lo que realmente pasó.>

### T1 — <título>

**Objetivo:** <qué tiene que ser cierto cuando esta tarea esté terminada>
**Cubre:** R1.1, R1.2
**Primer test (rojo):** <el caso concreto con el que arranca el ciclo TDD>

**Registro** — <completar al terminar; fecha>

- <Decisiones que hubo que tomar y que el design no fijaba. Esto es lo más valioso del
  archivo: dentro de un mes nadie se acuerda por qué se eligió así, y el código solo
  muestra el resultado, nunca la alternativa descartada.>
- <Desvíos respecto del design: si la implementación terminó haciendo algo distinto de lo
  diseñado, decilo acá y actualizá `design.md`. Un desvío sin registrar rompe la
  trazabilidad en silencio — el documento sigue describiendo algo que ya no existe.>
- <Lo que apareció y no esperabas: un caso borde nuevo, un supuesto que resultó falso, algo
  que costó el triple de lo previsto.>

### T2 — <título>

<Esta segunda tarea muestra los dos campos opcionales. Ponelos SOLO cuando apliquen: una tarea
normal tiene Objetivo, Cubre y Primer test, y nada más.>

**Objetivo:** <...>
**Cubre:** —
**Por qué no cubre criterios:** <va solo si `Cubre` es `—`. Infraestructura inicial o integración
final: por qué la tarea existe igual. Sin esta línea la tarea se lee como alcance que nadie pidió,
y el chequeo automático de trazabilidad la marca como huérfana.>
**Nota:** <va solo si aplica. Ej. `reemplaza a T4`. Un id nunca se reutiliza ni se renumera —
puede estar citado en un commit o en la bitácora—, así que esta línea es lo único que conecta una
tarea con la que vino a reemplazar, absorber o dividir.>
**Primer test (rojo):** <...>

**Registro** —

- <...>

## Pendientes

<Cosas que salieron mientras se trabajaba y que no son tareas de esta feature: ideas para
después, deuda asumida a propósito, preguntas sin responder. Sirve para no perderlas sin
tener que agrandar el alcance ahora.>

- <...>

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
- `Por qué no cubre criterios:` y `Nota:` son los dos campos que se pierden si no se escriben
  acá. Todo lo demás se puede reconstruir leyendo el archivo; estos dos no, y su ausencia no se
  nota: una tarea sin el primero se relee como huérfana, y una sin el segundo pierde para siempre
  a qué tarea reemplazó.
- La bitácora se completa mientras se trabaja, no al final de todo. Escrita después, se
  convierte en un resumen prolijo que perdió justo lo que valía la pena: las dudas y las
  alternativas que se descartaron en el momento.
-->
