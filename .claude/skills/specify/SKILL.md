---
name: specify
description: "Escribe el spec de una feature en tres fases, cada una con su compuerta de aprobación: requirements.md con criterios de aceptación en notación EARS, design.md con arquitectura, interfaces, modelos de datos, errores y estrategia de testing, y tasks.md con el plan de implementación y su bitácora. Usá este skill apenas haya un diseño aprobado en brainstorming, o cuando la persona diga 'escribamos el spec', 'documentemos los requisitos', 'hagamos el spec de X', 'pasemos a la spec', 'definamos los criterios de aceptación', 'desglosemos las tareas', 'armemos el plan de implementación' o pida dejar por escrito qué tiene que hacer una feature antes de programarla. Es el paso siguiente al brainstorming y previo a la implementación TDD — planifica y documenta el trabajo, pero no escribe código."
---

# Specify

Convertir una idea ya clarificada en un spec ejecutable: primero **qué** tiene que hacer el sistema (`requirements.md`), después **cómo** se construye (`design.md`), y por último **en qué orden se hace** (`tasks.md`).

El workflow del proyecto es: brainstorm → **spec (este skill)** → implementación TDD → verificación → commit. Este skill cubre las tres fases del spec. Escribir el código queda fuera a propósito: `tasks.md` planifica el trabajo y después registra lo que pasó al hacerlo, pero la implementación es otro paso.

## Antes de empezar

Este skill parte de una idea ya conversada y acordada. Si llegás sin eso —la persona tiró una idea suelta, el alcance sigue ambiguo, o todavía no se acordó un enfoque— no inventes los requisitos: proponé pasar primero por el brainstorming. Un spec construido sobre supuestos propios se ve prolijo y aun así documenta la feature equivocada, y el costo de descubrirlo aparece recién en la implementación.

Si el diseño ya viene aprobado de un brainstorm, no vuelvas a preguntar lo que ya se decidió: leelo de la conversación y usalo. Hacer repetir decisiones ya tomadas es la forma más rápida de que el spec se sienta burocracia.

Lo inverso también vale: un brainstorm fija la forma de la feature, no todos los detalles que hacen falta para escribir criterios verificables. Formato de fecha, separador decimal, si el CSV trae encabezado, dónde se persisten los datos, qué código de salida devuelve el comando — nada de eso suele discutirse al diseñar, y sin embargo sin eso ningún criterio se puede testear. Cuando falte algo así, preguntá **antes** de escribir y todo junto en un mismo mensaje: acá no estás explorando la idea (esa parte ya pasó), estás cerrando huecos puntuales, y una lista corta se responde de una sentada.

El criterio para saber si preguntar o no: **¿podés escribir un test que falle sin ese dato?** Si no podés, preguntá. Si el dato no cambia ningún criterio, elegí lo razonable, seguí, y anotalo en **Supuestos** — para eso está esa sección.

Ojo con qué hacés después con esas respuestas. Van a llegarte a nivel implementación —"en `data/movimientos.json`", "código de salida 2"— y un criterio de aceptación describe comportamiento observable, no mecanismo. Antes de transcribirla, preguntate si a la persona le importa **ese valor concreto** o solamente que el comportamiento ocurra. Si lo que necesita es que los movimientos sigan estando la próxima vez que abre la app, eso es el criterio; la ruta del archivo es un supuesto ahora y una decisión del design después. Si en cambio el valor exacto **es** el requisito, porque algo externo depende de él, entonces sí va en el criterio — y decí de qué depende, para que se entienda por qué está fijado.

## Por qué requirements antes que design

Separar el "qué" del "cómo" mantiene honesto al diseño: si arrancás por la solución, los requisitos terminan escritos para justificar lo que ya decidiste construir. Escritos primero, y en forma de condición → comportamiento observable, los criterios de aceptación se convierten directamente en los tests de la fase siguiente — que es justo lo que necesita un proyecto que trabaja con TDD.

## Fase 1 — Requirements

1. **Elegí la carpeta**: `docs/AAAA-MM-DD-<feature-en-kebab-case>/`, con la fecha de hoy y un nombre corto y descriptivo (`docs/2026-09-04-importar-csv/`). Un spec enfocado por feature, no un documento monolítico.
2. **Escribí `requirements.md`** siguiendo `assets/requirements-template.md`.
3. **Redactá los criterios en EARS**: prosa en español, palabras clave en inglés (`WHEN`, `IF`/`THEN`, `WHILE`, `WHERE`, `THE SYSTEM SHALL`). Funcionan como vocabulario formal, igual que las palabras clave de SQL. Los patrones, ejemplos y errores típicos están en `references/ears-patterns.md` — leelo si dudás de cuál corresponde o cómo formular algo que no encaja en el patrón simple.
4. **Numerá todo**: requisitos `R1`, `R2`… y criterios `R1.1`, `R1.2`… El design y los tests van a referenciarlos, y esa trazabilidad es lo que después permite verificar que no quedó nada sin cubrir.
5. **Acotá el alcance**: incluí solo lo que se acordó, y dejá explícito lo que queda afuera por ahora. Un requisito de más es una feature de más que alguien va a construir.
6. **Presentá y esperá aprobación**: contá en el chat qué requisitos quedaron (los títulos alcanzan, no repitas el archivo entero), dónde está el archivo, y qué supuestos o preguntas abiertas anotaste. Después parate.

No pases a diseño hasta tener un sí. Si la respuesta trae cambios, ajustá el archivo y volvé a pedir aprobación.

## Fase 2 — Design

Antes de escribir nada, **releé los requisitos aprobados buscando problemas**: ambigüedades, criterios que se contradicen, huecos entre lo que se pide y lo que haría falta para que funcione. Si encontrás algo, decilo y resolvelo con la persona en vez de taparlo con una decisión propia — es mucho más barato acá que a mitad de la implementación.

Cuando de ese repaso sale un criterio nuevo —pasa seguido, es justamente para lo que sirve— agregalo a `requirements.md` con dos cuidados:

- **Numerá al final, nunca renumeres.** Los ids ya se citan en lo que se escribió hasta ahora y van a terminar en los nombres de los tests. Si un criterio quedó mal, corregilo o marcalo como obsoleto en su lugar; reusar su número rompe referencias en silencio.
- **Decí qué cambió y confirmalo.** La aprobación fue sobre lo que la persona leyó. Nombrá los criterios que agregaste y esperá un sí antes de seguir con el design — es un intercambio corto, no una re-aprobación completa del documento, pero sin él el documento aprobado y el que existe dejan de ser el mismo.

Después:

1. **Escribí `design.md`** en la misma carpeta, siguiendo `assets/design-template.md`.
2. **Referenciá los requisitos**: cada decisión de diseño existe para satisfacer algo. Enlazá secciones con los ids (`R1.2`) y, en la estrategia de testing, mapeá qué test cubre qué criterio.
3. **Diseñá para lo que hay**: seguí los patrones del código existente y las reglas del proyecto (TypeScript + Node, Vitest, no agregar dependencias sin necesidad). Si una dependencia o una capa nueva parece necesaria, justificá por qué el requisito no se puede satisfacer sin ella.
4. **Dejá registro de lo descartado**: qué alternativas consideraste y por qué no. Eso evita rediscutir lo mismo en tres semanas.
5. **Presentá y esperá aprobación**, igual que en la fase 1.

Una vez aprobado el design, decí que el paso siguiente es el skill **`planning-tasks`**, que arma y itera `tasks.md` orquestando el subagente `planner` (tarea por tarea, hasta que el plan queda con cobertura completa y bien dimensionado). Nombralo, no lo arranques: igual que el propio `brainstorming` nombra a `specify` sin invocarlo, encadenarlo acá se saltearía la compuerta de aprobación del design que acaba de pasar.

## Fase 3 — Tasks

Esta fase se ejecuta invocando el skill `planning-tasks` (que orquesta al subagente `planner`), no escribiendo `tasks.md` a mano turno por turno. Lo que sigue queda igual: es la referencia de formato y reglas que `planner` tiene precargada como skill, y también el fallback si por algún motivo `planning-tasks`/`planner` no están disponibles en el proyecto.

Con el design aprobado ya sabés qué se construye y cómo; falta en qué orden, y dejar preparado el lugar donde va a quedar registrado lo que realmente pase al construirlo.

1. **Escribí `tasks.md`** en la misma carpeta, siguiendo `assets/tasks-template.md`.
2. **Una tarea, un ciclo de TDD**: test que falla → implementar → test que pasa, del tamaño que se pueda terminar de una sentada. Si una tarea necesita tres tests distintos para tener sentido, probablemente sean tres tareas.
3. **Ordenalas para poder parar en cualquier punto**: cada tarea debería dejar el repo funcionando y en verde. Un plan que solo sirve si se completa entero no sirve como plan.
4. **Cerrá la cadena de trazabilidad**: cada tarea dice qué criterios cubre. Después mirá el cruce en las dos direcciones — una tarea que no cubre ningún criterio es alcance que nadie pidió, y un criterio sin ninguna tarea es o un olvido o algo que hay que declarar fuera de alcance explícitamente. Ese cruce es la razón de numerar los criterios desde la fase 1.
5. **Presentá y esperá aprobación**, igual que en las fases anteriores.

Al planificar, cada tarea tiene solo objetivo, criterios que cubre y primer test. **La bitácora se completa durante la implementación, no ahora** — y no la escribas vos como parte de este skill: acá dejás la estructura preparada, no el relato de un trabajo que todavía no ocurrió.

## Para qué sirve la bitácora

Es la parte del spec que más se subestima. El código terminado muestra el resultado y nunca la alternativa descartada; a los seis meses nadie se acuerda de por qué algo quedó así, y se termina rediscutiendo lo mismo o —peor— revirtiendo una decisión que tenía una buena razón.

De lo que se anota, hay una categoría que no puede quedar en silencio: **el desvío respecto del design**. Si la implementación terminó haciendo algo distinto de lo diseñado, se registra en la tarea y se actualiza `design.md`. Un desvío sin registrar rompe la trazabilidad sin que se note, porque el documento sigue leyéndose como si describiera lo que existe.

## Después de la aprobación de las tasks

Pará ahí. Decí que el spec quedó completo —`requirements.md`, `design.md` y `tasks.md`— y que el paso siguiente es la implementación con TDD, empezando por el primer test rojo de T1. No la arranques: es otro paso del workflow, no parte de este skill.

Una aprobación corta o informal ("dale", "va", "listo") aprueba el documento que presentaste, nada más. No la leas como permiso para encadenar la fase siguiente en el mismo mensaje: aprobar los requirements no es aprobar el design, aprobar el design no es aprobar las tasks, y aprobar las tasks no es pedir código.

## Si los requisitos cambian después

Cuando aparece un cambio de requisitos y ya existen los documentos siguientes, actualizá todos los que queden afectados y decí explícitamente cuáles y en qué. Un criterio nuevo suele arrastrar una decisión de diseño y una tarea; uno que se elimina puede dejar una tarea sin propósito. Un documento que quedó describiendo requisitos viejos es peor que no tenerlo, porque se lee como si estuviera vigente.

## Archivos de este skill

- `assets/requirements-template.md` — estructura de `requirements.md`
- `assets/design-template.md` — estructura de `design.md`
- `assets/tasks-template.md` — estructura de `tasks.md` (plan + bitácora)
- `references/ears-patterns.md` — los 5 patrones EARS, ejemplos del dominio y errores típicos
