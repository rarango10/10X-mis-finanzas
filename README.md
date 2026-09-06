# Harness de desarrollo asistido por agentes

Este repo es dos cosas a la vez:

1. **Un método de trabajo** para construir software con Claude Code — cuatro skills, siete
   subagentes y un workflow dinámico que llevan una feature de la idea al commit, con una
   compuerta de aprobación humana en cada paso.
2. **Una app de finanzas personales** que sirve de ejemplo real del método. No es el punto;
   es la prueba de que el método produce algo.

Si venís a llevarte el harness a otro proyecto, saltá a [Llevártelo a otro
proyecto](#llevártelo-a-otro-proyecto). Si venís a entender cómo se trabaja acá, seguí leyendo.

---

## Antes de empezar

**Los workflows dinámicos tienen que estar habilitados.** El paso 4 del ciclo los usa, y sin
esto el skill `planning-tasks` no puede lanzar nada.

1. `/config` → *Dynamic workflows*, o poné `"enableWorkflows": true` en `~/.claude/settings.json`.
2. **Abrí una sesión nueva.** El registro de workflows se arma al arrancar; activarlo a mitad de
   sesión no alcanza.

Es un setting de tu máquina, no del repo, así que clonarlo no te lo trae.

Después, lo de siempre:

```bash
npm install
npm test            # 68 tests, todos en verde
npm run typecheck
```

---

## El ciclo, en siete pasos

Cada paso produce un artefacto, se detiene y espera tu aprobación. Ninguno arranca al que le
sigue: lo **nombra**. Una aprobación corta («dale», «va») aprueba el documento que está sobre la
mesa, no los tres que vienen después.

| # | Producto | Lo produce | Se pide diciendo |
|---|----------|------------|------------------|
| 1 | diseño acordado (en el chat) | skill `brainstorming` | «quiero agregar X», «cómo construimos Y» |
| 2 | `requirements.md` | skill `specify`, fase 1 | «escribamos el spec» |
| 3 | `design.md` | skill `specify`, fase 2 | «pasemos al diseño» |
| 4 | `tasks.md` | skill `planning-tasks` → workflow `tasks-fanout` | «planeemos las tareas» |
| 5 | código + tests | TDD, a mano | «implementemos T3» |
| 6 | veredicto por tarea (en el chat) | subagente `dod-checker` | «verificá T3» |
| 7 | `e2e-tests-plan.md` + `e2e-test-report.md` | skill `verify-e2e` | «verifiquemos e2e» |

Todo el papeleo de una feature vive en `docs/AAAA-MM-DD-<nombre-de-la-feature>/`.

### Un ejemplo completo, para copiar

```
Vos:     quiero poder dividir un gasto entre varias personas
Claude:  [brainstorming] ¿qué pasa con los centavos que no dividen exacto? ...
Vos:     dale, vamos con eso
Vos:     escribamos el spec
Claude:  [specify fase 1] escribí docs/2026-09-05-split-de-gastos/requirements.md
Vos:     aprobado, pasemos al diseño
Claude:  [specify fase 2] escribí design.md
Vos:     aprobado. planeemos las tareas
Claude:  [planning-tasks] el spec está aprobado. Son 29 tareas → 29 agentes en paralelo. ¿Lanzo?
Vos:     dale
Claude:  [workflow tasks-fanout] ... tasks.md con 29 tareas
Vos:     implementemos T1
Claude:  [TDD] test rojo → implementación → verde
Vos:     verificá T1
Claude:  [dod-checker] cumple · R3.1 · npm test 3/3
```

El spec de `docs/2026-09-05-split-de-gastos/` es exactamente eso, terminado. Si querés ver cómo
queda el método aplicado de verdad —incluida la bitácora— es el mejor lugar para mirar.

---

## Las tres ideas que lo sostienen

Si te llevás el harness y solo te quedás con tres cosas, que sean estas.

### Un solo productor por documento

Cada archivo del ciclo tiene un único autor, y está escrito en `CLAUDE.md`. El plan de tareas lo
escribe **solo** el workflow `tasks-fanout` — nunca a mano, nunca otro subagente. Los tests e2e
los escribe **solo** `e2e-test-writer`. El reporte, **solo** `e2e-triager`.

La excepción aparente confirma la regla: en `tasks.md`, el `Estado` y el `Registro` de cada tarea
los escribe quien implementa. No es un segundo autor del mismo documento, son **regiones
distintas con dueños distintos**. La condición de carrera que la arquitectura evita es la de
varios planificadores pisándose en paralelo, no la de un plan y su bitácora.

### La compuerta viaja con el paso

No hay archivo de configuración de compuertas, y es deliberado. Cada compuerta es prosa dentro
del skill que es dueño de ese paso, así que no podés leer el paso sin leer su compuerta — son la
misma frase, y no pueden desincronizarse. El ciclo e2e agrega tres compuertas configurables
(`plan`, `scripts`, `ruteo`), pero el modo se dice **al invocar** (`--modo autonomo`, `--sin
plan`), no en un JSON: un archivo que solo lee el modelo no obliga a más que la prosa, y sí
agrega un origen normativo que puede contradecir al skill.

### `hecho` significa verificado

Una tarea pasa a `hecho` **solo** cuando `dod-checker` devolvió `cumple` y ese veredicto quedó
asentado en su `Registro`. Cualquier resultado menor la deja en `en curso`. Eso convierte a la
columna `Estado` en el registro durable de qué está terminado de verdad — y por eso un `hecho`
de más es peor que una tarea olvidada: se lee como trabajo cerrado.

---

## Qué hay adentro de `.claude/`

```
.claude/
├── skills/
│   ├── brainstorming/     idea suelta → diseño acordado
│   ├── specify/           requirements.md y design.md, con sus templates y evals
│   ├── planning-tasks/    verifica el spec y lanza el workflow. No planifica
│   └── verify-e2e/        el ciclo end-to-end, en dos fases
├── agents/
│   ├── spec-scout.md      releva el spec y el repo de una pasada     [solo lectura]
│   ├── task-reviewer.md   juzga UNA tarea del plan                   [solo lectura]
│   ├── plan-reducer.md    sintetiza los veredictos en un plan        [solo lectura]
│   ├── task-writer.md     materializa el plan                        [escribe tasks.md]
│   ├── dod-checker.md     ¿esta tarea está realmente hecha?          [solo lectura]
│   ├── e2e-test-writer.md traduce el plan e2e a Playwright           [escribe end2end/]
│   └── e2e-triager.md     corre, diagnostica y rutea. No repara      [escribe el reporte]
├── workflows/
│   └── tasks-fanout.js    scout → N revisores en paralelo → reducer → 1 escritor
└── checks/
    └── lint-workflow-literals.cjs
```

Siete subagentes, **tres** con permiso de escritura, y cada uno escribe un documento distinto.
Los otros cuatro declaran un `agentType` de solo lectura.

### El linter que parece de más y no lo es

`tasks-fanout.js` es casi todo prompts entre backticks. Un backtick de más adentro de un prompt
cierra el literal y abre otro, y el texto del medio pasa a parsearse como expresiones: el archivo
sigue siendo JavaScript válido y el prompt quedó destruido. Por eso:

```bash
node .claude/checks/lint-workflow-literals.cjs .claude/workflows/tasks-fanout.js
```

Corrélo cada vez que toques el workflow. (`node --check` sobre ese archivo **no** sirve: usa
`return` en el nivel superior, que es como lo ejecuta el runtime de workflows, y bajo ESM eso da
un error que no significa nada.)

---

## Llevártelo a otro proyecto

Hay dos vías, y eligen cosas distintas.

| | **Copiarlo** | **Empaquetarlo como plugin** |
|---|---|---|
| Semántica | fork: una copia en el tiempo | dependencia: una fuente |
| Actualizar | a mano, repo por repo | `claude plugin update` |
| Sirve para | hacerlo tuyo y que evolucione aparte | usar el mismo harness en todos tus proyectos |
| Costo | cero | armarlo una vez |

Si clonaste este repo para adueñarte del método, ya estás en la primera vía y solo te queda
[adaptar `CLAUDE.md`](#lo-único-que-hay-que-adaptar-claudemd). Si querés el harness disponible en
todos tus proyectos sin copiarlo en cada uno, seguí con la segunda.

### Lo único que hay que adaptar: `CLAUDE.md`

Casi todo `.claude/` es agnóstico del stack: habla de specs, criterios, tareas y veredictos, que
son vocabulario del método y no del dominio. Los skills y los agentes **no saben** qué runner de
tests usás: leen los comandos de la sección «Comandos de verificación» de `CLAUDE.md` y corren
esos. Ese archivo es el punto de indirección de todo el harness.

Al llevarlo a otro proyecto, adaptá:

1. La sección **Stack**.
2. La sección **Comandos de verificación** — de ahí sacan qué correr `spec-scout`, `dod-checker`,
   `task-reviewer` y `e2e-triager`.
3. La tabla del **Workflow de trabajo**, si querés cambiar nombres o disparadores.
4. Las **Reglas**, que son el contrato del proyecto.

Sin la tabla de ruteo y sin las reglas de dueño, los skills quedan sueltos: `planning-tasks` no
tiene qué verificar y `dod-checker` no sabe qué comandos correr. `CLAUDE.md` no es documentación
del harness, **es parte del harness** — y es lo único que tiene que vivir en cada repo.

Dos cosas más, si el proyecto nuevo no es Node:

- `.claude/skills/specify/evals/check_specs.py` tiene una lista heurística de librerías para
  detectar filtraciones de implementación en los criterios. Agregá las de tu stack — una que
  falte solo significa una detección menos, nunca un falso positivo.
- `verify-e2e` asume Playwright. Su fase 1 comprueba que exista una app navegable y **se detiene
  con un mensaje claro si no la hay**, así que en un proyecto sin interfaz no hace daño: no
  escribe nada.

### Armar tu propio plugin

Un plugin de Claude Code empaqueta skills, subagentes, hooks y comandos, se instala una vez y
queda disponible en **todos** tus proyectos. Es la forma correcta de no tener doce copias del
harness derivando cada una por su lado.

**1. Scaffoldeá el plugin.**

```bash
claude plugin init mi-harness --with skills,agents \
  --description "Ciclo de desarrollo asistido: brainstorm → spec → plan → TDD → verificación"
```

Lo crea en `~/.claude/skills/mi-harness/` con su `.claude-plugin/plugin.json`, y **auto-carga en
la sesión siguiente** como `mi-harness@skills-dir`. Mirá con `ls` qué estructura te dejó antes de
copiar nada: el scaffold decide los nombres de las carpetas, no vos.

**2. Mové las piezas adentro.** Los cuatro skills, los siete agentes, el workflow y el linter.
Lo que **no** va es `CLAUDE.md`: ese es de cada proyecto, y es justamente lo que permite que el
mismo plugin sirva para un repo de TypeScript y otro de Python.

**3. Validá y medí el costo.**

```bash
claude plugin validate ~/.claude/skills/mi-harness
claude plugin details mi-harness      # inventario de componentes + costo proyectado en tokens
claude plugin list
```

El `details` importa: cuatro skills y siete agentes pesan en contexto, y conviene verlo antes de
que estén en todos tus proyectos.

**4. Probá que no se rompió nada.** `specify` y `brainstorming` traen sus propias evals, así que
la migración es verificable en vez de a ojo:

```bash
claude plugin eval mi-harness
```

Corre los casos contra el plugin y contra una rama sin plugin como baseline.

**5. Sacá las copias del proyecto.** Si dejás `.claude/skills/` y `.claude/agents/` en el repo
*y* tenés el plugin instalado, vas a tener las dos versiones cargadas y no vas a saber cuál se
está usando. Borrá las del repo y quedate solo con `CLAUDE.md`.

#### Compartirlo con otra gente

Poné el plugin en un repo de git con un `.claude-plugin/marketplace.json`, y del otro lado:

```bash
claude plugin marketplace add <usuario>/<repo>     # acepta URL, ruta local o repo de GitHub
claude plugin install mi-harness@<marketplace>
```

`claude plugin tag` arma el tag de release (`{nombre}--v{version}`) y valida de paso que
`plugin.json` y la entrada del marketplace coincidan. Después, `claude plugin update mi-harness`
en cualquier máquina.

#### El punto que hay que verificar primero

**El workflow adentro de un plugin.** `tasks-fanout` se encuentra por nombre en un registro que
se arma al arrancar la sesión, y que un workflow provisto por un plugin entre en ese registro
está sin confirmar. Probalo apenas lo empaquetes, antes de migrar nada más. Si no entra, el skill
`planning-tasks` ya trae el camino alternativo —lanzarlo por `scriptPath` absoluto— y solo hay
que apuntarlo adentro del plugin en vez de a una ruta del repo.

---

## Estado y límites conocidos

El harness funciona de punta a punta. Estas son las cosas que todavía no se sostienen solas, y
están acá porque un método que no dice dónde es frágil se lee como si no lo fuera. La lista
completa y viva, con lo que habría que hacer en cada caso, está en
[`lecciones.md`](./lecciones.md):

- **El ciclo e2e nunca corrió entero.** Este proyecto es lógica de dominio pura — sin UI, sin
  servidor — así que no hay nada que Playwright pueda manejar. La fase 1 detecta esa ausencia y
  para sin escribir nada (eso sí está verificado), pero lo que le sigue no se ejercitó contra un
  caso real.
- **Playwright está declarado, no instalado.** Falta `npm install` y `npx playwright install
  chromium` (~150 MB). Nada se rompe mientras tanto: `tsconfig.json` incluye solo `src`, y
  `vitest.config.ts` excluye `end2end/` para que los dos runners no se peleen por los `.spec.ts`.
- **Re-planificar desaprueba un plan que no cambió.** Si `tasks-fanout` corre sobre un `tasks.md`
  ya aprobado y todo vuelve `ok`, el escritor igual baja el encabezado a `pendiente de
  aprobación`.
- **Que los agentes de solo lectura no escriban es conducta, no impedimento.** Se mide con un
  manifiesto de hashes del working tree antes y después de cada corrida, y hasta ahora dio
  limpio. Pero a todos se les dice además que no escriban, así que lo comprobado es que nadie
  quiso, no que no hubiera podido. Convertirlo en garantía pide un `permissions.deny` o un hook
  `PreToolUse`.
- **Las compuertas son instrucciones, no mecanismos.** Vale para las fijas y para las
  configurables del ciclo e2e.

---

## La app de ejemplo

Un núcleo de funciones puras sobre un `Ledger` inmutable, en `src/split/`: alta de personas,
carga de gastos con reparto de centavos, pagos entre participantes y cálculo de saldos.
TypeScript estricto, sin dependencias de runtime, 68 tests en Vitest.

Está para que el harness tenga sobre qué operar. Si te llevás el método, esto se borra.
