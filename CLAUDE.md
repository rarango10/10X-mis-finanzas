# Manejo de mis finanzas personales

Proyecto de ejemplo para una app de **finanzas personales** que ayuda a crear los presupuestos y categorizar los gastos

## Stack

- TypeScript + Node
- Vitest (tests)

## Comandos de verificación

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

## Workflow de trabajo

| # | Documento | Lo produce | Se pide diciendo |
|---|-----------|------------|------------------|
| 1 | diseño acordado (en el chat, sin archivo) | skill `brainstorming` | «quiero agregar X», «cómo construimos Y» |
| 2 | `requirements.md` | skill `specify`, fase 1 | «escribamos el spec», «definamos los criterios» |
| 3 | `design.md` | skill `specify`, fase 2 | «pasemos al diseño» |
| 4 | `tasks.md` | skill `planning-tasks` → workflow `tasks-fanout` | «planeemos las tareas», «desglosemos las tareas», «armemos el plan» |
| 5 | código + tests | TDD, a mano | «implementemos T3» |
| 6 | veredicto de verificación (en el chat, sin archivo) | subagente `dod-checker` | «verificá T3», «¿T5 está hecha?» |

Todo en `docs/AAAA-MM-DD-<feature>/`.

Cada documento tiene **un solo productor**: si una frase te deja dudando entre dos skills, gana
esta tabla. Cada paso espera aprobación humana antes del siguiente, y ningún skill arranca al que
le sigue — solo lo nombra.

## Reglas

- Una feature a la vez. No abrir frentes en paralelo.
- TDD: test que falla → implementar → test que pasa.
- No agregar dependencias sin necesidad.
- **El plan lo escribe solo el workflow `tasks-fanout`**, nunca a mano ni con otro subagente:
  qué tareas existen, sus ids, su orden, su título, su `Cubre` y los encabezados de la bitácora.
  El workflow revisa en paralelo con agentes de solo lectura y materializa con un único escritor;
  planificar por afuera reintroduce el segundo escritor que eso elimina.
- **El avance lo escribe quien implementa**, y solo en dos lugares de la tarea que está haciendo:
  su celda de `Estado` y su bloque de `Registro`. No es una excepción a la regla anterior: son
  regiones distintas del archivo, con dueños distintos, y nunca se escriben a la vez. La condición
  de carrera que la arquitectura evita es la de varios planificadores pisándose en paralelo, no la
  de un plan y su bitácora. Lo único prohibido es implementar mientras hay una corrida de
  `tasks-fanout` en vuelo: entre que el scout lee y el escritor guarda, tu `hecho` se pierde.
- **`hecho` significa verificado.** Una tarea pasa a `hecho` solo cuando `dod-checker` devolvió
  `cumple` y su `Registro` deja asentado ese veredicto. Cualquier resultado menor —
  `cumple-parcial`, `no-cumple`, `no-verificable`— la deja en `en curso`. Ese es el **DoD**
  (definition of done) de este proyecto: los criterios que la tarea dice cubrir, más su objetivo.
  `dod-checker` reporta y no escribe; el veredicto lo asienta quien implementa, al registrar.
  Por eso la columna `Estado` es el registro durable de qué está hecho de verdad: es lo que hay
  que leer para saberlo, y no hay que buscarlo en ningún otro lado.