# Manejo de mis finanzas personales

Proyecto de ejemplo para una app de **finanzas personales** que ayuda a crear los presupuestos y categorizar los gastos

## Stack

- TypeScript + Node
- Vitest (tests)

## Comandos de verificación

Son **dos ranuras con propósitos distintos**. El nombre de esta sección no cambia porque cuatro
piezas del harness la buscan por él, pero adentro están separadas.

**Corrección** — la del paso 5 al cerrar una tarea y la que corre `dod-checker` en el paso 6.
Contesta «¿el código cumple los criterios de aceptación?».

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

**Higiene** — la del paso 8, una vez, sobre el estado final del repo. Contesta otra cosa: «¿el repo
entero está sano con todo esto adentro?».

```bash
npm run typecheck
npm test
npm run test:e2e    # solo si la feature tuvo ciclo e2e y hay app que navegar.
                    # Hoy no la hay, y @playwright/test está declarado pero sin instalar:
                    # esta pata no aplica todavía, y su fallo no es un hallazgo.
```

**Por qué separadas, en las dos direcciones.** Con lint, build o e2e adentro del comando de
corrección, una queja de formato o un browser que falta hace fallar la verificación de una tarea por
una razón que no tiene nada que ver con su criterio — y ensucia el veredicto, que es el registro
durable de qué está hecho. Y al revés: si la única corrida es la de corrección, tarea por tarea,
**nadie comprueba nunca el conjunto**, que es como un `hecho` puede volverse mentira sin que la
tarea cambie una línea.

## Workflow de trabajo

| # | Documento | Lo produce | Se pide diciendo |
|---|-----------|------------|------------------|
| 1 | diseño acordado (en el chat, sin archivo) | skill `brainstorming` | «quiero agregar X», «cómo construimos Y» |
| 2 | `requirements.md` | skill `specify`, fase 1 | «escribamos el spec», «definamos los criterios» |
| 3 | `design.md` | skill `specify`, fase 2 | «pasemos al diseño» |
| 4 | `tasks.md` | skill `planning-tasks` → workflow `tasks-fanout` | «planeemos las tareas», «desglosemos las tareas», «armemos el plan» |
| 5 | código + tests | skill `implement-task` (TDD) | «implementemos T3», «seguimos con la que sigue» |
| 6 | veredicto de verificación (en el chat, sin archivo) | subagente `dod-checker` | «verificá T3», «¿T5 está hecha?» |
| 7 | `e2e-tests-plan.md` | skill `verify-e2e`, fase 2 | «verifiquemos e2e», «probemos de punta a punta» |
| 8 | `end2end/<feature>/*.spec.ts` | subagente `e2e-test-writer` | (lo invoca `verify-e2e`, no se pide suelto) |
| 9 | `e2e-test-report.md` | subagente `e2e-triager` | (lo invoca `verify-e2e`, no se pide suelto) |
| 10 | corrida de higiene + commit de cierre | skill `close-feature` | «cerremos la feature», «commiteemos» |

Todo en `docs/AAAA-MM-DD-<feature>/`, salvo los specs de Playwright, que van en `end2end/` en la
raíz porque son código y los tiene que ver `playwright.config.ts`.

Los pasos 6, 7 y 8 verifican cosas distintas y ninguno reemplaza a otro: `dod-checker` pregunta si
*una tarea* cumple los criterios que dice cubrir; `verify-e2e` pregunta si *la feature entera*
funciona; `close-feature` pregunta si *todos los veredictos siguen siendo ciertos juntos*, sobre el
estado final del repo. Veintinueve tareas en `hecho` no dicen nada sobre si el flujo completo camina,
y ninguna de las dos primeras dice nada sobre si el conjunto se sostiene cuando se juntan.

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
  su celda de `Estado` y su bloque de `Registro` — más el **encabezado de aprobación** de
  `tasks.md`, una sola vez, cuando la persona confirma el plan: `task-writer` tiene prohibido
  tocarlo y ningún otro paso lo retoma, así que sin esto la aprobación se queda en el chat y el
  archivo sigue diciendo `pendiente`. No es una excepción a la regla anterior: son
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
- **La unidad del paso 5 es la tarea, no la fase.** Un `tasks.md` con once tareas son once ciclos
  —rojo → verde → `dod-checker` → asentar → aprobación— y no uno largo. La compuerta entre tareas
  se puede renunciar, pero solo diciéndolo con el vocabulario de `implement-task`
  (`--modo corrido`): una lista de tareas en el pedido no es una renuncia. Lo que no se renuncia en
  ningún modo es que **cada tarea se verifica** y que un veredicto menor que `cumple` **corta la
  corrida**. Renunciar a la aprobación intermedia es acelerar; renunciar al corte es cambiar lo que
  significa terminar.
- **Un commit por tarea, con su id en el mensaje.** Así el avance queda registrado por la
  herramienta y no solo por la prosa de quien implementa; si una tarea necesitó dos rondas van dos
  commits con el mismo id, porque el id es lo que agrupa. Ojo con lo que esto sí prueba: que la
  tarea fue una unidad de trabajo, no que el test se escribió antes que el código. Para eso harían
  falta commits en rojo, y eso contradice que cada tarea deje el repo en verde.
- **Un veredicto se toma sobre un estado.** El `cumple` de `dod-checker` es cierto para el repo tal
  como estaba cuando lo tomó, y puede volverse falso **sin que la tarea cambie una línea** — pasó:
  una tarea verificada con `end2end/` vacía quedó en rojo cuando el paso 7 pobló esa carpeta. Por eso
  el paso 8 corre la higiene completa sobre el estado final, y por eso un rojo ahí **reabre la tarea
  afectada**: vuelve a `en curso` y regresa a `hecho` solo con un `cumple` nuevo, tomado ya en ese
  estado. Verificar tarea por tarea no garantiza el conjunto.
- **El ciclo e2e no repara código.** `e2e-triager` diagnostica un fallo y dice a dónde va, nada
  más: si la causa es el test, vuelve al plan de tests; si es el código, la tarea afectada baja a
  `en curso` y se arregla con el TDD de siempre (`implement-task`), con `dod-checker` como única puerta de vuelta a
  `hecho`. No hay ni va a haber un agente que edite `src/` para poner un e2e en verde: sería un
  segundo escritor del código, saltearía el TDD, y puede cerrar el síntoma dejando la causa.
- **Las compuertas del ciclo e2e se configuran al invocarlo, no en un archivo.** Su default —las
  tres activas— vive en el `SKILL.md` de `verify-e2e`, y el modo se dice en la invocación
  (`--modo autonomo`, `--sin plan|scripts|ruteo`). No agregues un archivo de configuración de
  compuertas: un JSON que solo lee el modelo no obliga a nada que la prosa del skill no obligue ya,
  y agrega un origen normativo más que puede contradecir al skill.