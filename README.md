# Harness de desarrollo asistido por agentes

Este repo es dos cosas a la vez:

1. **Un método de trabajo** para construir software con Claude Code — siete skills, siete
   subagentes y un workflow dinámico que llevan una feature del contrato del proyecto al commit
   de cierre, con una compuerta de aprobación humana en cada paso.
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

### El proyecto no puede vivir en una carpeta sincronizada

**iCloud Drive, Dropbox, OneDrive o Google Drive y `node_modules` no conviven.** Un proyecto que va
a ser verificado por agentes corre su runner de tests decenas de veces por sesión, y cada corrida
levanta un worker que abre miles de archivos. Si esa carpeta está sincronizada, cada `import`
atraviesa el demonio de sincronización.

Los números de la vez que pasó — mismo proyecto, misma máquina, mismo minuto, movido de
`~/Documents` (con «Escritorio y Documentos» activado) a `~/dev`:

| | En la carpeta sincronizada | Fuera de ella |
|---|---|---|
| `prepare` del worker de tests | **97.170 ms** | **34 ms** |
| Corrida completa | 225 s, sin recolectar un solo test | **734 ms**, verde |

Casi tres mil veces. Con `fileproviderd` al 107% de CPU y 6.288 archivos en `node_modules`.

**Y no se diagnostica solo, que es la otra mitad de la lección.** El síntoma apuntó, en orden, al
subagente, al sandbox, al plugin y a las versiones de las dependencias — cuatro sospechosos
equivocados, y cada uno costó su rato. Lo que lo destrabó en un intento fue una sola pregunta:

> ¿El mismo tipo de comando funciona en **otro proyecto de la misma máquina**?

Si ahí anda, el problema no es tu toolchain ni tu entorno: es este proyecto y dónde está parado.
Vale la pena tenerla a mano — es la pregunta que separa «entorno roto» de «proyecto roto» y cuesta
una corrida. `dod-checker` la tiene escrita en su regla de corte por esta misma razón.

Después, lo de siempre:

```bash
npm install
npm test            # 68 tests, todos en verde
npm run typecheck
```

---

## El ciclo, en nueve pasos

Cada paso produce un artefacto, se detiene y espera tu aprobación. Ninguno arranca al que le
sigue: lo **nombra**. Una aprobación corta («dale», «va») aprueba el documento que está sobre la
mesa, no los tres que vienen después.

| # | Producto | Lo produce | Se pide diciendo |
|---|----------|------------|------------------|
| 0 | el `CLAUDE.md` del proyecto | skill `harness-init` | «preparemos el proyecto» |
| 1 | diseño acordado (en el chat) | skill `brainstorming` | «quiero agregar X», «cómo construimos Y» |
| 2 | `requirements.md` | skill `specify`, fase 1 | «escribamos el spec» |
| 3 | `design.md` | skill `specify`, fase 2 | «pasemos al diseño» |
| 4 | `tasks.md` | skill `planning-tasks` → workflow `tasks-fanout` | «planeemos las tareas» |
| 5 | código + tests | skill `implement-task` (TDD) | «implementemos T3» |
| 6 | veredicto por tarea (en el chat) | subagente `dod-checker` | «verificá T3» |
| 7 | `e2e-tests-plan.md` + `e2e-test-report.md` | skill `verify-e2e` | «verifiquemos e2e» |
| 8 | corrida de higiene + commit de cierre | skill `close-feature` | «cerremos la feature» |

Todo el papeleo de una feature vive en `docs/AAAA-MM-DD-<nombre-de-la-feature>/`.

**El paso 0 corre una sola vez por repo; el 1 al 8, una vez por feature.** Y los pasos 6, 7 y 8
contestan preguntas distintas que se parecen: `dod-checker` pregunta si *una tarea* cumple sus
criterios, `verify-e2e` si *la feature entera* camina, y `close-feature` si *todos los veredictos
siguen siendo ciertos juntos* sobre el estado final. Ninguno reemplaza a otro — un veredicto vale
para el estado en que se tomó, y puede volverse falso sin que la tarea cambie una línea.

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
Claude:  [implement-task] test rojo → implementación → verde
Claude:  [dod-checker] cumple · R3.1 · npm test 3/3     ← se encadena, no se pregunta
Claude:  asenté el veredicto, commit "T1: ...". ¿Sigo con T2?
Vos:     dale
         ... (una compuerta por tarea, hasta la última)
Vos:     verifiquemos e2e
Claude:  [verify-e2e] plan de 3 casos → specs → corrida → reporte
Vos:     cerremos la feature
Claude:  [close-feature] higiene en verde sobre el estado final → commit de cierre
```

Dos cosas de ese diálogo que no son obvias y son deliberadas. **La verificación no se pregunta**:
una tarea implementada y sin verificar queda en un limbo indistinguible de «a medio hacer», así que
implementar y verificar son el mismo acto y la compuerta va después del veredicto. Y **la compuerta
es por tarea**, no por fase: once tareas son once ciclos.

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
(`plan`, `scripts`, `ruteo`), y el paso 5 una más (la aprobación entre tareas), pero el modo se dice
**al invocar** (`--modo autonomo`, `--sin plan`, `--modo corrido`), no en un JSON: un archivo que
solo lee el modelo no obliga a más que la prosa, y sí agrega un origen normativo que puede
contradecir al skill.

Y las renuncias tienen **vocabulario propio, que no se infiere**. «Implementemos T3, T4 y T5» es una
lista, no una renuncia a la compuerta entre tareas; solo el literal `--modo corrido` lo es. Si
«explícito» lo juzga el modelo, la compuerta vuelve a ser opinable — y hay lecciones de sobra de que
lee la autorización más ancha de lo que se le dio.

### `hecho` significa verificado

Una tarea pasa a `hecho` **solo** cuando `dod-checker` devolvió `cumple` y ese veredicto quedó
asentado en su `Registro`. Cualquier resultado menor la deja en `en curso`. Eso convierte a la
columna `Estado` en el registro durable de qué está terminado de verdad — y por eso un `hecho`
de más es peor que una tarea olvidada: se lee como trabajo cerrado.

Con una vuelta de tuerca que costó descubrir: **un veredicto vale para el estado en que se tomó.**
Una tarea verificada con `end2end/` vacía quedó en rojo cuando el ciclo e2e pobló esa carpeta, sin
que su código cambiara una línea. El `cumple` era correcto entonces y falso después. Por eso existe
el paso 8: la corrida de higiene sobre el estado final comprueba que todos los veredictos sigan
siendo ciertos **juntos**, y un rojo ahí reabre la tarea afectada.

---

## Qué hay adentro de `.claude/`

```
.claude/
├── skills/
│   ├── harness-init/      siembra el CLAUDE.md del proyecto: plantilla + entrevista
│   ├── brainstorming/     idea suelta → diseño acordado
│   ├── specify/           requirements.md y design.md, con sus templates y evals
│   ├── planning-tasks/    verifica el spec y lanza el workflow. No planifica
│   ├── implement-task/    una tarea, de punta a punta, hasta su veredicto
│   ├── verify-e2e/        el ciclo end-to-end, en dos fases
│   └── close-feature/     la higiene sobre el estado final y el commit de cierre
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
├── plugin-root/           lo que va en la RAÍZ del plugin al empaquetar
│   ├── SKILL.md           el router: explica el ciclo y enruta al paso que toca
│   └── .claude-plugin/plugin.json
└── checks/
    ├── lint-workflow-literals.cjs
    └── sync-plugin.sh     resincroniza el plugin y compara los dos árboles
```

Siete subagentes, **tres** con permiso de escritura, y cada uno escribe un documento distinto.
Los otros cuatro declaran un `agentType` de solo lectura.

**`plugin-root/` existe por un error que vale contar.** El router y el manifiesto del plugin se
escribieron una vez directamente adentro del plugin y nunca volvieron al repo, contra el invariante
de que el repo es la fuente. Nadie lo notó durante semanas porque el chequeo de deriva **enumeraba
directorios conocidos** —`skills`, `agents`, `workflows`, `checks`— y los cuatro daban «sin deriva».
Un chequeo que enumera lo que conoce nunca encuentra lo que no está en su lista. Por eso
`sync-plugin.sh` compara **árboles completos en las dos direcciones** y exige que no sobre ni falte
un archivo.

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

**No lo escribas a mano: es el paso 0 y tiene productor.** Pedile al skill `harness-init` que lo
arme («preparemos el proyecto»). Parte de una plantilla y completa sus ranuras entrevistándote —
las dos mitades hacen falta, y arreglan cosas distintas:

- **La plantilla restringe por estructura.** No tiene sección «Estructura», así que meter un árbol
  de archivos en el contrato —que es territorio del `design.md`, donde recién se consideran
  alternativas— pasa de improbable a **imposible**. Y trae las dos ranuras de comandos rotuladas por
  separado, así que conflacionarlas tampoco está disponible.
- **La entrevista llena las ranuras, y no decide.** Una ranura sin llenar es una pregunta visible en
  el archivo (`<stack: preguntá antes de completar>`); una generación libre que decidió sola no deja
  ninguna marca.

Lo que queda escrito ahí, y que conviene revisar aunque lo haya armado el skill:

1. La sección **Stack**.
2. La sección **Comandos de verificación**, que son **dos ranuras y no una**: el comando de
   **corrección** (typecheck + tests), que es el de los pasos 5 y 6, y el de **higiene** (lint,
   formato, build, e2e), que es el del paso 8. Con lint adentro del primero, una queja de formato
   hace fallar la verificación de una tarea por una razón ajena a su criterio; sin el segundo, nadie
   comprueba nunca el conjunto.
3. La tabla del **Workflow de trabajo**, si querés cambiar nombres o disparadores.
4. Las **Reglas**, que son el contrato del proyecto.

Sin la tabla de ruteo y sin las reglas de dueño, los skills quedan sueltos: `planning-tasks` no
tiene qué verificar y `dod-checker` no sabe qué comandos correr. `CLAUDE.md` no es documentación
del harness, **es parte del harness** — y es lo único que tiene que vivir en cada repo.

`harness-init` siembra además los configs que codifican memoria del método y que un proyecto nuevo
no va a redescubrir: el runner de unidad excluyendo `end2end/` (si no, los dos runners se pelean por
los `.spec.ts` — y el fallo aparece recién cuando el ciclo e2e puebla la carpeta, invalidando
veredictos de tareas que nadie tocó) y Playwright con `retries: 0` (un caso que pasa al segundo
intento es un hallazgo, no un caso resuelto). Si ya tenés un `CLAUDE.md`, el skill **no lo pisa**:
lo revisa contra lo que el harness necesita y te propone los arreglos.

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

**2. Mové las piezas adentro.** Los siete skills, los siete agentes, el workflow y los checks —
más el contenido de `plugin-root/`, que va en la **raíz** del plugin: el `SKILL.md` del router y el
`plugin.json`. Lo que **no** va es `CLAUDE.md`: ese es de cada proyecto, y es justamente lo que
permite que el mismo plugin sirva para un repo de TypeScript y otro de Python.

Mientras sigas editando el harness en el repo, el plugin es una copia y **se desincroniza sin
avisar**: editás el repo, la sesión de prueba carga la versión vieja, y cualquier conclusión que
saques es falsa. Para eso está el script:

```bash
bash .claude/checks/sync-plugin.sh ~/.claude/skills/mi-harness
```

Copia y después compara los dos árboles completos en las dos direcciones. Falla si sobra un archivo
en el plugin o si falta uno del repo — a propósito, porque un chequeo que nunca falla es
decorativo.

**3. Validá y medí el costo.**

```bash
claude plugin validate ~/.claude/skills/mi-harness
claude plugin details mi-harness      # inventario de componentes + costo proyectado en tokens
claude plugin list
```

El `details` importa: siete skills y siete agentes pesan en contexto, y conviene verlo antes de
que estén en todos tus proyectos. Para dar una idea de magnitud, este harness cuesta **~1.9k tokens
always-on** por sesión, y el resto se paga solo al invocar cada skill.

**Pero `details` miente por omisión, y de una forma que confunde.** No cuenta el `SKILL.md` de la
raíz del plugin ni los workflows: reporta los skills de `skills/` y los agentes, y nada más. En una
sesión real se cargan además el router y el workflow namespaceado. Si lo tomás como inventario
completo vas a subestimar la superficie cargada — a nosotros nos hizo concluir, durante un rato, que
los plugins no soportaban workflows. **Verificá contra el listado de skills de la sesión**, que es
lo que efectivamente se cargó.

**4. Probá que no se rompió nada.** `specify` y `brainstorming` traen sus propias evals, así que
la migración es verificable en vez de a ojo:

```bash
claude plugin eval mi-harness
```

Corre los casos contra el plugin y contra una rama sin plugin como baseline.

**5. Sacá las copias del proyecto.** Si dejás `.claude/skills/` y `.claude/agents/` en el repo *y*
tenés el plugin instalado, vas a tener las dos versiones cargadas y no vas a saber cuál se está
usando. Borrá las del repo y quedate solo con `CLAUDE.md`.

**Y acordate de `.claude/workflows/`, que es el caso peor.** Para skills y agentes hay shadowing:
una gana y la otra queda tapada. **Para workflows no.** La copia del proyecto se registra como
`tasks-fanout` y la del plugin como `mi-harness:tasks-fanout`, así que son **nombres distintos y las
dos quedan vivas**. Podés estar corriendo la vieja del repo creyendo que usás la del plugin: un
arreglo en el plugin no cambiaría nada, y no habría ninguna señal de por qué.

#### Compartirlo con otra gente

Poné el plugin en un repo de git con un `.claude-plugin/marketplace.json`, y del otro lado:

```bash
claude plugin marketplace add <usuario>/<repo>     # acepta URL, ruta local o repo de GitHub
claude plugin install mi-harness@<marketplace>
```

`claude plugin tag` arma el tag de release (`{nombre}--v{version}`) y valida de paso que
`plugin.json` y la entrada del marketplace coincidan. Después, `claude plugin update mi-harness`
en cualquier máquina.

#### El namespacing, que es lo que sorprende al empaquetar

**El workflow adentro de un plugin funciona** — se verificó, y era la incógnita más grande de la
migración. Lo que no es obvio es que **todo se renombra**: el cargador registra el workflow como
`mi-harness:tasks-fanout`, y los subagentes como `mi-harness:spec-scout`. El nombre pelado deja de
resolver, y eso rompe en dos lugares distintos:

- **Al lanzar el workflow.** `planning-tasks` ya lo maneja: lanza el nombre pelado y, si falla, lee
  la lista de `Available:` que trae el propio error y relanza con el nombre que figure ahí.
- **Adentro del script**, en las cinco llamadas a subagentes. `tasks-fanout.js` descubre el prefijo
  del mensaje de error en la primera llamada y lo cachea para las demás.

El patrón es el mismo en los dos, y vale para cualquier cosa que empaquetes: **descubrir el prefijo
leyéndolo del error, nunca hardcodearlo**. El nombre del plugin cambia según cómo esté instalado, y
un prefijo escrito a mano se rompe el día que lo renombres.

Si aun así el workflow no aparece en ninguna forma, `planning-tasks` trae el camino alternativo —
lanzarlo por `scriptPath` absoluto, que no depende del registro.

---

## Estado y límites conocidos

El harness funciona de punta a punta. Estas son las cosas que todavía no se sostienen solas, y
están acá porque un método que no dice dónde es frágil se lee como si no lo fuera. La lista
completa y viva, con lo que habría que hacer en cada caso, está en
[`lecciones.md`](./lecciones.md):

- **El ciclo e2e corrió entero, pero su ruteo no.** Se ejercitó de punta a punta sobre otro
  proyecto: plan de tres casos, tres specs generados, tres en verde en la primera corrida — con los
  selectores por rol y nombre accesible, sin un solo `waitForTimeout`. Lo que **no** se probó nunca
  es el camino del fallo: el ruteo (`causa: test` / `codigo` / `spec`) y el loop de reintento del
  lado del test. Es la parte con más diseño y cero pruebas, y solo se ejercita la primera vez que un
  e2e falle de verdad. En **este** repo no puede correr: es lógica de dominio pura, sin UI ni
  servidor, y la fase 1 detecta esa ausencia y para sin escribir nada.
- **Playwright está declarado, no instalado.** Falta `npm install` y `npx playwright install
  chromium` (~150 MB). Nada se rompe mientras tanto: `tsconfig.json` incluye solo `src`, y
  `vitest.config.ts` excluye `end2end/` para que los dos runners no se peleen por los `.spec.ts`.
- **No hay evidencia independiente del orden del TDD.** Cada tarea deja un commit con su id, así
  que `git log` muestra que fue una unidad de trabajo — pero el commit trae el test y la
  implementación juntos, así que **no prueba que el test se escribió primero**. La prueba fuerte
  serían dos commits por tarea, rojo y verde, y está descartada porque un commit en rojo contradice
  que cada tarea deje el repo funcionando. La afirmación más central del método es la única sin
  verificación independiente.
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
