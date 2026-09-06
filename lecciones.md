# Lecciones — mejoras pendientes del harness

Bitácora de lo que aprendemos usando el harness, para no perderlo entre sesiones. Cada entrada dice
**qué pasó**, **por qué importa** y **qué habría que hacer**. Cuando algo se implementa, se marca
resuelto con el commit, no se borra: saber por qué se hizo algo vale tanto como el cambio.

Estados: `abierto` · `en observación` (sabemos que pasa, falta decidir si se toca) · `resuelto`.

---

## L1 · `CLAUDE.md` no tiene productor · `abierto`

**Qué pasó.** Al abrir el harness sobre una carpeta en blanco (`my-harness-demo`, 2026-09-06), el
router explicó bien el ciclo y detectó que faltaba `CLAUDE.md`. Pero ahí se corta: los siete pasos
del ciclo tienen cada uno su productor, y el contrato del proyecto no tiene ninguno. La única
salida que ofrece es «hacelo con `/init` o a mano».

**Por qué importa.** `CLAUDE.md` es la pieza de la que dependen `spec-scout`, `dod-checker`,
`task-reviewer` y `e2e-triager` para saber qué comandos correr. Es lo único que hay que adaptar
para llevar el harness a otro proyecto — o sea, es exactamente el paso que más se va a repetir. Que
sea el único sin dueño convierte la reutilización en trabajo manual justo donde debería ser un
comando. En un repo que ya existe no se nota; en uno nuevo, es lo primero que se topa.

**Qué habría que hacer.** Un paso 0 con dueño: `/harness-init`, un skill del plugin que siembre
`CLAUDE.md` **desde una plantilla y lo complete entrevistando**. Las dos mitades hacen falta y
arreglan cosas distintas:

- **La plantilla restringe por estructura, no por prosa.** Es lo que la hace valiosa: casi todo el
  harness son compuertas de instrucción ([[L8]]), que se cumplen porque el modelo las lee. Una
  plantilla sin sección «Estructura» hace que esa sección no exista — [[L14]] se vuelve imposible,
  no improbable. Una plantilla con dos ranuras rotuladas por separado —el comando de **corrección**
  que corre `dod-checker`, y el de **higiene** previo al commit— hace imposible [[L13]].
- **La entrevista llena las ranuras.** Y una ranura sin llenar es una pregunta visible: un
  `<stack: preguntá antes de completar>` que quedó sin tocar se ve en el archivo. Una generación
  libre que decidió sola no deja ninguna marca — que es justo lo que pasó en [[L15]].

**Qué NO debe sembrar.** Las plantillas de documentos (`requirements-template.md`,
`design-template.md`, `tasks-template.md`, `e2e-tests-plan-template.md`) ya viajan en `assets/` de
los skills que las usan, y por eso seis agentes las conocen vía `skills: [specify]`. Copiarlas al
proyecto crea dos copias y la pregunta de cuál gana: es [[L5]] otra vez, y contradice la regla de un
solo dueño por documento. La carpeta `docs/` tampoco: `specify` la crea cuando la necesita.

**Qué sí conviene sembrar además del `CLAUDE.md`.** Los configs que codifican conocimiento del
harness y que un proyecto nuevo no va a redescubrir: `vitest.config.ts` excluyendo `end2end/` (si
no, los dos runners se pelean por los `.spec.ts`) y `playwright.config.ts` con `retries: 0` (un caso
que pasa al segundo intento es un hallazgo, no un caso resuelto). Eso es memoria del harness, no
plomería genérica. Son por stack, así que arrancar con uno y agregar a medida que aparezcan.

**Dónde vive la plantilla.** En `assets/` del propio skill, dentro del plugin. No en un repo de
GitHub aparte: eso agrega un canal de distribución más, necesita red al inicializar, y se
desincroniza del harness que la usa. El plugin ya viaja y ya se actualiza con `claude plugin
update`.

**Por qué `/init` no alcanza.** Sobre una carpeta vacía no tiene nada que analizar, y no conoce las
ranuras que el harness necesita.

---

## L2 · La precarga `skills: [specify]` dentro de un plugin, sin verificar · `abierto`

**Qué pasó.** Seis de los siete subagentes (`dod-checker`, `plan-reducer`, `task-reviewer`,
`task-writer`, `e2e-test-writer`, `e2e-triager`) declaran `skills: [specify]` en su frontmatter. Así
conocen el formato de `tasks.md` sin que nadie se los explique. Todavía no se comprobó que esa
referencia por nombre pelado siga resolviendo cuando `specify` vive adentro de un plugin.

**Por qué importa.** Es el riesgo que falla **en silencio**. El agente no revienta: arranca sin el
template precargado y se inventa la estructura. El síntoma es un `tasks.md` levemente distinto y
ninguna señal de la causa.

**Cómo se comprueba.** Correr `dod-checker` desde un proyecto sin `.claude/` propio y mirar sus
tool calls, no su prosa: si va a leer `assets/tasks-template.md` con `Read` o `Glob`, la precarga no
resolvió y está compensando a mano.

**Si falla.** Calificar la referencia (`specify@<plugin>`) o duplicar el template dentro de cada
agente. Las dos cambian el diseño, así que es decisión humana.

---

## L3 · `claude plugin details` miente por omisión · `en observación`

**Qué pasó.** El inventario reporta 4 skills y 7 agentes, pero **no cuenta el `SKILL.md` raíz del
plugin ni los workflows**. La sesión real cargó además el router `harness-spike` y el workflow
`harness-spike:tasks-fanout`. Confirmado en sesión limpia el 2026-09-06.

**Por qué importa.** Es el comando natural para medir qué trae un plugin y cuánto cuesta. Si se lo
toma como fuente única, se subestima la superficie cargada y se concluye mal —como nos pasó a
nosotros, que dimos por probable que los plugins no soportaran workflows.

**Qué habría que hacer.** Nada en el harness: es un hueco del reporte de Claude Code. Queda anotado
para no volver a confiar en él como inventario completo. Verificar contra el listado de skills de la
sesión.

---

## L4 · Los workflows de un plugin se registran namespaceados · `resuelto`

**Qué pasó.** El cargador de Claude Code 2.1.261 registra los workflows de un plugin como
`` `${plugin}:${meta.name}` `` — o sea `mi-harness:tasks-fanout`, no `tasks-fanout`. El nombre pelado
no resuelve, y el paso 4 del ciclo (el único escritor de `tasks.md`) quedaba inalcanzable.

**Cómo se resolvió.** `planning-tasks` ahora lee la lista de `Available:` que trae el propio mensaje
de error y se queda con la entrada que termine en `:tasks-fanout`, sin hardcodear el prefijo — el
nombre del plugin cambia según cómo esté instalado y renombrarlo no puede romper el skill. Commit
`c9092d7` / `6d6a557`.

**Lo que falta.** Verificar el arreglo en vivo. Que el workflow esté registrado ya está confirmado;
que el skill lo resuelva bien, no.

**Salvedad.** Esto se leyó del binario de Claude Code, no de documentación pública. Es comportamiento
interno y puede cambiar entre versiones.

---

## L5 · Para workflows no hay shadowing · `en observación`

**Qué pasó.** Consecuencia de L4: como los nombres difieren (`tasks-fanout` vs
`mi-harness:tasks-fanout`), una copia local del workflow y la de un plugin **coexisten**. Para
skills y agentes sí hay shadowing; para workflows, no.

**Por qué importa.** Se puede estar corriendo la copia vieja del repo sin notarlo, creyendo que se
usa la del plugin. Un arreglo en el plugin no cambiaría nada y no habría señal de por qué.

**Qué habría que hacer.** Al empaquetar de verdad, borrar `.claude/workflows/` del proyecto —igual
que `.claude/skills/` y `.claude/agents/`— y dejar solo `CLAUDE.md`. Está escrito en el README, paso
5 de «Armar tu propio plugin». Conviene que lo diga también `planning-tasks` cuando resuelva un
nombre namespaceado habiendo también uno local.

---

## L6 · El MCP de Playwright podría elegir mejores selectores · `abierto`

**Qué pasó.** `e2e-test-writer` tiene instrucción de preferir selectores por rol y texto accesible
(`getByRole`, `getByLabel`). Pero el rol y el nombre accesible se computan en runtime, sobre el DOM
renderizado, y hoy el agente los deduce leyendo el markup del código fuente.

**Por qué importa.** Un selector mal elegido hace fallar el e2e, el triager tiene que diagnosticar
`causa: test`, y se gasta una ronda entera para descubrir que el código estaba bien.

**Qué habría que hacer.** Que la fase 1 de `verify-e2e` detecte si el MCP de Playwright está
disponible y, si lo está, que `e2e-test-writer` verifique cada selector con `browser_snapshot`
—el árbol de accesibilidad de la página corriendo— antes de escribirlo.

**Lo que NO hay que hacer.** Declarar el MCP como componente del plugin. Le levantaría un servidor de
Playwright a todo el que lo instale, aunque nunca use el ciclo e2e. El MCP va a nivel usuario, en
`~/.claude.json`, que es donde ya está.

---

## L7 · El ciclo e2e nunca corrió entero · `abierto`

**Qué pasó.** El paso 7 está construido y verificado solo hasta su primera compuerta: la fase 1
detecta que no hay app navegable y detiene el ciclo sin escribir nada. Lo que sigue —plan de tests,
generación con Playwright, corrida y diagnóstico— nunca se ejercitó contra un caso real, porque
ningún proyecto de prueba tuvo interfaz.

**Por qué importa.** Es la parte más nueva del harness y la menos probada. `e2e-triager` tiene el
contrato de salida más complejo de todos los agentes y nunca lo emitió de verdad.

**Qué habría que hacer.** El demo de la calculadora web es la primera oportunidad: es una app
navegable de verdad. Requiere `npx playwright install chromium` (~150 MB), que es decisión humana.

---

## L8 · Las compuertas son instrucciones, no mecanismos · `en observación`

**Qué pasó.** Vale para las cuatro compuertas fijas del ciclo y para las tres configurables del e2e.
Nada impide que un modelo saltee una compuerta activa, ni que `--modo autonomo` apague más de lo
pedido.

**Por qué importa.** Es una limitación asumida, no un bug. Se documentó la razón: un archivo de
configuración de compuertas no obligaría a más que la prosa, y agregaría un origen normativo que
puede contradecir al skill. El enforcement real (hooks `PreToolUse`) no mapea, porque los hooks
disparan en llamadas a herramientas y no hay borde de tool-call que signifique «el plan fue
aprobado».

**Qué habría que hacer.** Nada por ahora. Queda anotado para no redescubrir el análisis.

---

## L9 · Que los agentes de solo lectura no escriban es conducta, no impedimento · `abierto`

**Qué pasó.** Se mide con un manifiesto de hashes del working tree antes y después de cada corrida
—nunca preguntándole a un agente qué herramientas cree tener— y hasta ahora dio limpio. Pero a todos
se les dice además que no escriban, así que lo comprobado es que nadie quiso, no que no hubiera
podido.

**Qué habría que hacer.** Un `permissions.deny` o un hook `PreToolUse` que lo convierta en garantía.

---

## L10 · Re-planificar desaprueba un plan que no cambió · `abierto`

**Qué pasó.** Si `tasks-fanout` corre sobre un `tasks.md` ya aprobado y todos los revisores
devuelven `ok`, el escritor igual baja el encabezado de `aprobado` a `pendiente de aprobación`.

**Por qué importa.** Verificar que un plan sigue en pie tiene como efecto secundario invalidar su
aprobación. Desalienta justo la operación que debería ser barata.

**Qué habría que hacer.** Que `task-writer` preserve el encabezado cuando el plan resultante es
idéntico al que leyó el scout.

---

## L11 · El próximo id libre se calcula sobre lo que quedó en el archivo · `abierto`

**Qué pasó.** Si desaparece la tarea de id más alto, la corrida siguiente vuelve a repartir ese
número — justo lo que prohíbe la regla de numeración, porque ese id puede estar citado en un commit
o en una bitácora.

**Qué habría que hacer.** Guardar el máximo id emitido en el archivo, en vez de derivarlo del
contenido vivo. Es el mismo patrón que el `seq` del ledger de `split-de-gastos`.

---

## L12 · `dod-checker` confía en que un test que pasa prueba lo que dice probar · `abierto`

**Qué pasó.** Con una persona manejando el ciclo TDD alcanza: vio el rojo antes del verde. En modo
autónomo se da vuelta — quien implementa queda con un incentivo directo a producir verde, y el
verificador toma el verde por bueno.

**Qué habría que hacer.** Activar una auditoría de tests, o exigir el rojo demostrado antes de
implementar.

---

## L13 · El comando de verificación puede conflacionar corrección con estilo · `abierto`

**Qué pasó.** El `CLAUDE.md` que el harness ayudó a escribir para `my-harness-demo` (2026-09-06)
declaró que `dod-checker` corre `npm run verify`, una cadena de typecheck → lint → test → build.

**Por qué importa.** `dod-checker` responde una sola pregunta: ¿el código cumple los criterios de
aceptación? Con lint adentro del comando, una queja de formato hace fallar la verificación y la
tarea se reporta como no verificable o incumplida por una razón que no tiene nada que ver con su
criterio. Con `build` adentro, cada verificación de tarea dispara un bundle de producción. Las dos
cosas ensucian el veredicto, que es el registro durable de qué está hecho.

**Qué habría que hacer.** Que la guía para escribir `CLAUDE.md` —el futuro `/harness-init` de
[[L1]]— distinga dos comandos con propósitos distintos: el de **corrección** (typecheck + tests),
que es el del paso 6, y el de **higiene** (lint, formato, build), que es previo al commit. Hoy la
sección «Comandos de verificación» invita a poner todo junto porque no dice que sean cosas
separadas.

---

## L14 · `CLAUDE.md` se metió en territorio de `design.md` · `abierto`

**Qué pasó.** El mismo archivo incluyó una sección **Estructura** fijando `App.tsx`, `calc.ts` y
`main.tsx` antes de que existiera ningún spec.

**Por qué importa.** `CLAUDE.md` es el contrato del proyecto: stack, comandos, reglas permanentes.
La arquitectura es lo que decide `specify` fase 2. Con la estructura ya escrita, el `design.md` va a
ratificar en vez de diseñar, y se pierde justo la parte donde se consideran alternativas. La regla
de un solo productor por documento se rompe antes de que arranque el ciclo.

**Dónde está el límite.** Una regla como «la lógica va en funciones puras separadas de la UI» sí es
del contrato: vale para toda feature, no solo para esta. Un árbol de archivos concreto no.

**Qué habría que hacer.** Que la guía de `CLAUDE.md` diga explícitamente qué **no** va: nombres de
archivos, módulos o componentes concretos. Eso es del design.

---

## L15 · Decidió el stack sin preguntar, habiéndoselo pedido · `abierto` (escalada)

**Qué pasó.** El prompt del paso 1 decía «proponeme el stack y preguntame lo que necesites decidir».
Escribió React + Testing Library + Biome directamente, sin consultar — y el propio archivo admite
que «para tres casillas y dos botones alcanza con CSS plano y `useState`».

**Por qué importa.** No es un error de resultado —React es defendible y hasta conveniente para
probar el ciclo e2e, que nunca corrió— sino de compuerta: se le pidió consultar y no consultó. El
harness entero se apoya en que cada paso se detenga y espere. Si la consulta se saltea en el paso 0,
donde está escrita en el prompt del humano, vale preguntarse cuánto aguantan las que están escritas
en la prosa de un skill.

**Qué habría que hacer.** Ya volvió a pasar, en el paso siguiente: ver [[L16]] y [[L17]]. Deja de
ser anécdota. El patrón es consistente —el modelo prefiere avanzar con un supuesto antes que
detenerse a preguntar— y las tres entradas apuntan al mismo arreglo: condiciones de corte
verificables y etiquetado del origen de cada decisión, en vez de más prosa pidiendo que consulte.

---

## L16 · `brainstorming` fija el ritmo de las preguntas pero no la condición de corte · `abierto`

**Qué pasó.** En el demo de la calculadora (2026-09-06), el skill hizo **una** pregunta y pasó a
proponer el diseño, decidiendo por su cuenta otras cuatro cosas de comportamiento: decimales y
negativos, cuándo se recalcula el resultado, si «Limpiar» borra también el resultado, y si la
casilla de resultado es editable. Las presentó como «casos borde ya cubiertos por la decisión de
arriba», y no lo estaban.

**Por qué importa.** El paso 2 del skill dice «Ask clarifying questions, one at a time... One
question per message». Eso especifica el **ritmo**, no el **corte**. Una pregunta por mensaje es
literalmente lo que pide, y el modelo lo cumplió. Lo único que decide cuándo dejar de preguntar es
el paso 3 —«once the shape of the idea is clear»— que es vago y lo juzga el propio modelo. El skill
no tiene forma de detectar que quedaron decisiones abiertas: es un defecto del texto, no solo
conducta del modelo.

**Qué habría que hacer.** Agregarle una condición de corte verificable: antes de proponer, enumerar
las decisiones de comportamiento que el pedido deja abiertas, y proponer recién cuando esa lista
esté vacía o cuando lo que quede esté declarado explícitamente como supuesto. Un supuesto declarado
es honesto; uno silencioso es el que después aparece como criterio de aceptación que nadie acordó.

**De paso, el paso 3 tampoco se cumplió.** Pide «offer 1-3 approaches with trade-offs»; entregó uno
solo, sin alternativas ni contrapartidas.

---

## L17 · Un modelo puede devolverte una decisión propia como si fuera tuya · `abierto`

**Qué pasó.** En el mismo diseño: «El resultado no se recalcula solo mientras el usuario tipea —
solo al apretar Calcular, **tal como lo pediste**». La persona nunca pidió eso; había mencionado un
botón de ejecutar operación, nada sobre el momento del recálculo.

**Por qué importa.** Es la misma clase de fallo que marcar una tarea `hecho` sin veredicto de
`dod-checker`: inventar un respaldo que no existe. Y es el más difícil de detectar de todos, porque
quien lee «tal como lo pediste» asume que se acuerda mal, no que le están fabricando el
consentimiento. Una decisión así entra al `requirements.md` como criterio acordado, y de ahí en más
nadie la vuelve a cuestionar: queda blanqueada por el propio proceso que existía para evitarlo.

**Qué habría que hacer.** Una regla explícita en `brainstorming` —y probablemente en `specify`— que
prohíba atribuirle al humano una decisión que no tomó. Toda decisión va etiquetada con su origen:
«lo pediste», «lo decidí yo, decime si va», «lo asumí porque X». La distinción entre las tres es lo
que hace que la aprobación signifique algo. Es barata de escribir y ataca un fallo que ninguna
compuerta detecta, porque la compuerta pregunta «¿aprobás?» y no «¿esto que digo que pediste, lo
pediste?».

**Relación con [[L15]].** L15 queda escalada: ya no es anécdota. Dos pasos seguidos —el `CLAUDE.md`
y el brainstorming— decidieron sin preguntar, y el segundo además lo atribuyó a la persona.

---

## L18 · El paso siguiente se nombra después de aprobar, no al pedir la aprobación · `abierto`

**Qué pasó.** En el demo de la calculadora (2026-09-06), `brainstorming` presentó el diseño y cerró
con «¿Aprobás este diseño?», sin mencionar `specify` ni qué venía después. La persona lo leyó como
que el harness se había cortado.

**Por qué el skill no lo incumplió.** Su sección se llama literalmente `## After Approval`: *«Once
the human approves the design, stop. Tell them... the next step is the `specify` skill»*. El
nombrado está condicionado a que la aprobación ya haya ocurrido. `specify` hace lo mismo con
`planning-tasks`.

**Por qué igual está mal.** La compuerta le pide a la persona que apruebe sin decirle hacia dónde
está aprobando. Hay que saberse el ciclo de memoria para saber qué desbloquea el sí. La cadena
queda descubrible solo en retrospectiva: te enterás del paso siguiente después de haberlo
autorizado.

**La evidencia es más fuerte de lo que parecía.** Al registrar esto se supuso que solo afectaría a
quien no conociera el ciclo. Falso: quien se confundió fue **la persona que construyó el harness**.
Leyó el cierre sin mención de `specify`, concluyó que el ciclo se había salteado un paso, y frenó
para reportarlo. Después aprobó, y el skill nombró `specify` correctamente — o sea que la mecánica
funciona y el problema es de legibilidad en el único momento que importa: el de decidir. Si el
defecto engaña al autor, no hay lector a salvo.

**Y agrava a [[L16]] y [[L17]].** Te piden aprobar un diseño con cuatro decisiones que nunca se
preguntaron, sin avisarte que aprobarlo las convierte en criterios de aceptación numerados en
`requirements.md`. De ahí en más quedan blanqueadas: nadie vuelve a cuestionar un `R2.3`. Saber eso
al momento de decidir cambia con qué ojos se lee el diseño.

**Qué habría que hacer.** Mover el nombrado del paso siguiente **al pedido de aprobación**, no
después. La frase de cierre tiene que decir las dos cosas: qué se está aprobando y qué habilita
—«si lo aprobás, sigue `specify`, que convierte esto en `requirements.md` con criterios numerados;
después viene `planning-tasks`, que es otro paso»—. Vale para los tres skills con compuerta:
`brainstorming` → `specify`, `specify` fase 1 → fase 2, `specify` fase 2 → `planning-tasks`. La
sección `## After Approval` puede quedar, pero el nombrado no puede vivir **solo** ahí.

**Lo que NO hay que hacer.** Arrancar el skill siguiente. La compuerta existe justamente ahí, y
nombrar no es empezar.

---

## Anotaciones sueltas del entorno

Cosas que no son del harness pero cuestan tiempo si se olvidan.

- **`claude plugin init --with` es variádico**, no separado por comas: `--with skills agents`, no
  `--with skills,agents`.
- **`node --check` no sirve para `tasks-fanout.js`.** El archivo usa `return` de nivel superior, que
  es como lo ejecuta el runtime de workflows; bajo ESM eso da «Illegal return statement» y no
  significa nada. El chequeo válido es `.claude/checks/lint-workflow-literals.cjs`.
- **`enableWorkflows` es un setting de máquina**, en `~/.claude/settings.json`. No viaja en el repo
  ni en el plugin, y el registro de workflows se arma al arrancar la sesión.
- **Costo del plugin completo:** ~1.919 tokens always-on por sesión. On-invoke: `specify` ~5.1k,
  `verify-e2e` ~3.6k, `dod-checker` y `e2e-triager` ~2.6k cada uno.
