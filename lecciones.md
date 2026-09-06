# Lecciones — mejoras pendientes del harness

Bitácora de lo que aprendemos usando el harness, para no perderlo entre sesiones. Cada entrada dice
**qué pasó**, **por qué importa** y **qué habría que hacer**. Cuando algo se implementa, se marca
resuelto con el commit, no se borra: saber por qué se hizo algo vale tanto como el cambio.

Estados: `abierto` (falta decidir el arreglo) · `en observación` (sabemos que pasa, falta decidir
si se toca) · **`listo para aplicar`** (el arreglo está escrito acá, solo falta hacerlo) · `resuelto`.

> **No aplicar nada mientras haya una prueba del harness en curso.** Cambiar un skill o el workflow
> a mitad de una corrida invalida el resultado: después no se puede distinguir qué causó qué. Los
> arreglos `listo para aplicar` se juntan y se hacen todos al terminar el recorrido.

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

## L2 · La precarga `skills: [specify]` dentro de un plugin · `resuelto` — funciona

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

**Verificado el 2026-09-06: funciona.** `task-writer`, corriendo desde el plugin sobre un proyecto
sin `.claude/` propio, produjo un `tasks.md` con los **dos campos opcionales** del template en su
lugar exacto: tres `Por qué no cubre criterios:` en las tres tareas con `Cubre: —`, y dos
`Nota: reemplaza a T9` en las dos que salieron de dividir esa tarea. Además usó `Cubre: —` pelado,
que es el formato actual, y no `— (infraestructura)`, que es el del `tasks.md` archivado.

Esa es la prueba: el propio `specify` dice de esos dos campos que «son los únicos dos que no se
pueden reconstruir releyendo el archivo». Existen solo en `assets/tasks-template.md`. Ningún agente
inventa esa combinación —los tres y los dos, cada uno en la tarea correcta— sin tenerlo delante.

**Lo que corrige.** La regla general que se anotó en [[L19]] —«cualquier referencia por nombre es
sospechosa al empaquetar»— es **demasiado amplia**. El namespacing de plugin aplica a **workflows**
([[L4]]) y a **agentes** ([[L19]]), pero **no** a los skills precargados por el frontmatter de un
agente. Tres referencias por nombre, dos afectadas, una sana. Vale corregir la generalización en vez
de arrastrarla: la regla real es que el namespacing aplica a lo que se **despacha** (un workflow que
se lanza, un agente que se spawnea), no a lo que se **precarga** en el contexto.

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

**Verificado en vivo el 2026-09-06.** La sesión lanzó `tasks-fanout`, recibió
`Workflow "tasks-fanout" not found. Available: deep-research, harness-spike:tasks-fanout`, y
relanzó sola con el nombre correcto. El arreglo funciona tal como se diseñó.

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

## L19 · Los `agentType` del workflow sufren el mismo namespacing que el workflow · `listo para aplicar`

**Qué pasó.** Corriendo `tasks-fanout` desde el plugin (2026-09-06), el workflow falló en su primer
paso: el script referencia `agentType: 'spec-scout'` y dentro de un plugin el agente se registra
como `harness-spike:spec-scout`. Son **cinco** referencias en el script (`spec-scout`,
`plan-reducer` ×2, `task-reviewer`, `task-writer`) y todas fallan igual.

**Por qué se nos pasó.** Al arreglar [[L4]] se corrigió el nombre con que se **invoca** el workflow,
en la prosa de `planning-tasks`. No se pensó que las referencias **internas** del script tuvieran el
mismo problema. El namespacing de plugin aplica a los dos tipos de componente, no solo a uno.

**Por qué el arreglo de la sesión no sirve.** La sesión lo resolvió con `sed` sobre
`~/.claude/projects/.../workflows/scripts/tasks-fanout-wf_<run>.js`, que es la copia persistida **de
esa invocación**. La fuente del plugin quedó intacta: esa corrida anduvo, la siguiente regenera el
script y vuelve a fallar. Es el tipo de arreglo que se ve exitoso y no cambia nada.

**Por qué hardcodear el prefijo tampoco.** `agentType: 'harness-spike:spec-scout'` se rompe el día
que el plugin se renombre a `mi-harness` — exactamente la trampa que [[L4]] esquivó.

**Qué habría que hacer.** El mismo patrón que [[L4]], pero adentro del script: un helper que intente
el nombre pelado, y ante el error —que tiene la forma `" not found. Available agents: ..."`, igual
que el del workflow— parsee la lista, encuentre la entrada que termine en `:<nombre>`, derive el
prefijo y lo cachee para las llamadas siguientes. Descubrir en vez de asumir. Cuando el harness vive
en el repo el nombre pelado resuelve y nunca se entra al `catch`, así que el mismo script sirve para
las dos formas de distribución.

**El orden ayuda:** el scout corre primero y solo, así que el prefijo queda resuelto antes del
`parallel()` de los revisores — no hay N fallos concurrentes.

**El arreglo, escrito.** Un helper al tope de `tasks-fanout.js`, y las cinco llamadas pasan de
`agent(` a `agentP(`:

```js
let PREFIJO = null
async function agentP(prompt, opts) {
  if (PREFIJO !== null) return agent(prompt, { ...opts, agentType: PREFIJO + opts.agentType })
  try {
    return await agent(prompt, opts)            // el nombre pelado, que sirve fuera de un plugin
  } catch (e) {
    const lista = String(e?.message ?? e).match(/Available agents:\s*(.+)/)
    if (!lista) throw e
    const hit = lista[1].split(/[,\s]+/).find((n) => n.endsWith(':' + opts.agentType))
    if (!hit) throw e
    PREFIJO = hit.slice(0, -opts.agentType.length)
    return agent(prompt, { ...opts, agentType: PREFIJO + opts.agentType })
  }
}
```

Cuidado al aplicarlo: el archivo es casi todo prompts entre backticks, así que después hay que
correr `node .claude/checks/lint-workflow-literals.cjs`. Y resincronizar la copia del plugin.

**Regla general que deja, ya acotada por [[L2]].** El namespacing aplica a lo que se **despacha**
—un workflow que se lanza por nombre ([[L4]]), un agente que se spawnea por `agentType` (esta)— y
**no** a lo que se **precarga** en contexto: `skills: [specify]` resolvió bien, verificado. Al
empaquetar, revisar los puntos de despacho; los de precarga andan.

---

## L20 · El workflow no declara `meta.phases`, y tres títulos no podrían matchear · `listo para aplicar`

**Qué pasó.** Corriendo `tasks-fanout` desde el plugin (2026-09-06) casi no se veía avance de los
subagentes. La corrida estaba sana —el scout terminó, nueve revisores corrieron en paralelo y los
resultados volvieron— pero no había nada que mirar.

**Por qué.** Tres cosas sumadas, y solo una es del harness:

1. **Los workflows siempre corren en segundo plano.** La vista viva es `/workflows`; en el
   transcript principal no se ve casi nada, por diseño. El propio resultado del tool lo dice.
2. **El script no declara `meta.phases`.** El contrato del tool `Workflow` pide un `{ title }` por
   cada llamada a `phase()`, con los títulos matcheados **exactos**. El script llama a `phase()`
   cinco veces y no anuncia ninguna, así que la vista de progreso no tiene contra qué mostrar el
   avance.
3. **Esa corrida fue un *resume*.** Los agentes ya completados devuelven resultado cacheado al
   instante, así que la primera fase pasa volando.

**El agravante.** Aunque se agregara `meta.phases`, tres de los cinco títulos están interpolados y
**nunca podrían matchear**, porque `meta` tiene que ser un literal puro:

```js
phase(`Ronda ${round}: revisión de ${toReview.length} tarea(s)`)   // línea 359
{ phase: `Ronda ${round}: revisión` }                              // línea 389
{ phase: `Ronda ${round}: reducción` }                             // línea 459
```

**El arreglo.** Títulos de fase estáticos, y el número de ronda al `label`, que sí es dinámico y es
donde corresponde:

```js
export const meta = {
  name: 'tasks-fanout',
  description: '...',
  phases: [
    { title: 'Reconocimiento del spec' },
    { title: 'Plan inicial desde cero' },
    { title: 'Revisión de tareas' },
    { title: 'Reducción' },
    { title: 'Chequeo de consistencia' },
    { title: 'Escritura de tasks.md' },
  ],
}
```

Con `phase('Revisión de tareas')` y `label: \`T${id} · ronda ${round}\`` en cada `agent()`.

**Lección general.** Un título de fase interpolado se ve razonable al escribirlo y silenciosamente
no aparece nunca en la vista de progreso. Nada avisa: no hay error, solo falta información. Lo que
varía por corrida va en el `label`; lo que estructura el workflow va en el `title`.

---

## L21 · El encabezado `Estado` de `tasks.md` no tiene dueño después de la aprobación · `abierto`

**Qué pasó.** En el demo de la calculadora (2026-09-06) la persona aprobó el plan y la sesión lo
reportó como aprobado, pero el archivo siguió diciendo `> Estado: pendiente de aprobación`.
`requirements.md` y `design.md` sí quedaron en `aprobado` — los había actualizado `planning-tasks`
al verificar los insumos, notando que estaban desfasados.

**Por qué no es descuido de nadie.** `task-writer` tiene prohibición explícita de tocarlo: «Nunca
marques el documento como aprobado — eso lo decide una persona». Y ningún skill lo retoma después.
La aprobación ocurre en el chat y no aterriza en el archivo.

**Por qué importa.** El harness trata ese encabezado como registro durable: `spec-scout` lo lee en la
corrida siguiente, y `planning-tasks` decide con él si el spec está listo. Un plan aprobado que
figura como pendiente hace que la próxima pasada del workflow lo trate como no aprobado, y que
cualquiera que abra el repo lea que se está implementando sobre un plan sin cerrar.

**Es la misma forma que [[L1]]**, pero sobre una transición de estado en vez de un documento: el
ciclo define quién **produce** cada archivo y no quién **marca su aprobación**. La regla «cada paso
espera aprobación humana» describe qué tiene que pasar en la conversación, no dónde queda asentado.

**Qué habría que hacer.** Que la aprobación tenga un dueño explícito, igual que el veredicto de
`dod-checker` lo tiene. La opción más simple y consistente con el resto: quien recibe el «sí»
actualiza el encabezado en el acto, y eso queda escrito en los tres skills con compuerta. Encaja con
el arreglo de [[L18]] —nombrar el paso siguiente al pedir la aprobación— porque es el mismo momento
del ciclo: al pedir el sí se dice qué habilita, y al recibirlo se asienta.

---

## L22 · Nadie define qué se le puede contar a `dod-checker` al invocarlo · `abierto`

**Qué pasó.** Al verificar T1 en el demo (2026-09-06), la sesión que acababa de implementar la tarea
invocó al verificador con este prompt: *«Ya se corrió manualmente `npm run check`, `npm run lint`,
`npm run build` y `npm run dev` **y dieron verde**, pero necesito tu veredicto independiente...»*.

**Por qué importa.** Pedir un veredicto independiente en la misma frase en que se anuncia el
resultado esperado no produce independencia: sesga hacia `cumple`. Y quien invoca es exactamente
quien tiene interés en que la tarea pase — es el implementador presentando su propio trabajo.

**Es la contraparte de una regla que sí existe.** `dod-checker` tiene escrito por qué no escribe:
«un verificador que además asienta su propio veredicto se está firmando el boletín solo». Acá el
problema es simétrico y no está cubierto: **el implementador le dicta el veredicto al verificador.**
La independencia se protegió en la salida y quedó abierta en la entrada.

**Por qué el harness lo permite.** Los agentes del workflow reciben un contexto controlado que arma
el script (la constante `SHARED`, idéntica para todos, «para que no diverjan»). `dod-checker` se
invoca a mano desde el chat, así que su entrada no tiene contrato: le llega lo que a quien
implementa se le ocurra contarle.

**Qué habría que hacer.** Definir el contrato de invocación en el propio `dod-checker`, que es el
único lugar que sobrevive a cualquier forma de llamarlo. Dos reglas:

- **Qué necesita:** el id de la tarea y la ruta del spec. Nada más. Todo lo demás lo lee él.
- **Qué debe ignorar explícitamente:** cualquier afirmación sobre resultados de comandos, tests que
  ya pasaron, o si la tarea está cumplida. Si el prompt las trae, se tratan como contexto no
  verificado y se anota en el veredicto que llegaron — igual que un caso `indeterminado` se sube en
  vez de resolverse.

Conviene además que los skills que lo nombran (`verify-e2e` lo menciona, y el ciclo lo usa en el
paso 6) digan cómo invocarlo: «pasale el id y la carpeta, no le cuentes cómo te fue».

**Confirmado con daño real, el mismo día.** El veredicto de T1 dice: «No vi ninguna dependencia
fuera del stack de CLAUDE.md **salvo** `@types/react`/`@types/react-dom`, que la propia Bitácora de
T1 ya declara». Es falso: `@testing-library/jest-dom` está en `devDependencies` y **no** está en la
lista de `CLAUDE.md`, que nombra solo `@testing-library/react` y `@testing-library/user-event`.

Lo revelador es *cómo* se le pasó. No comparó `package.json` contra `CLAUDE.md`: usó **la bitácora
del implementador como checklist**, y encontró exactamente las dos dependencias que el implementador
ya había confesado, ninguna más. El veredicto terminó ratificando el relato de quien implementó en
vez de auditarlo — que es precisamente el daño que esta entrada predecía. El agente sí corrió los
comandos por su cuenta; la contaminación no estuvo en los comandos, estuvo en **qué buscó y contra
qué lo comparó**.

---

## L23 · `dod-checker` no tiene regla de corte cuando la verificación falla · `abierto`

**Qué pasó.** Verificando T1 en el demo (2026-09-06), `npm run check` falló porque el pool de
vitest se colgaba (timeout de 60 s). El agente encadenó **diez comandos** intentando destrabarlo:
`npm run check` dos veces, `vitest --pool=threads`, una sonda de `worker_threads` en Node crudo,
`vitest --poolOptions...` (que ni parseó), sondas de esbuild y de rolldown, `npm run build`,
`typecheck` + `lint` —que se fue a background por timeout de 120 s— y un `ps aux`. Varios de 60 s.

**Su instrucción dice «Corré la verificación, una vez».**

**El matiz que importa.** No está mal diagnosticar: ese diagnóstico es justamente lo que hace útil
un `blockedReason`. «vitest se cuelga» sirve mucho menos que «vitest 5 + vite 8 (rolldown) cuelga el
pool runner; `worker_threads` crudo levanta bien; `build` y `typecheck` pasan». El problema no es
que investigue, es que **no tiene ni tope ni condición de corte**. La regla del `no-verificable` le
dice qué veredicto dar cuando no puede correr, pero nada le dice cuándo dejar de intentar. Su
instinto es arreglar el entorno, y eso lo aleja de su producto, que es un veredicto.

**Es el mismo defecto de forma que [[L16]]**: una instrucción que fija el *ritmo* («una vez») sin
fijar la *condición de salida*. En `brainstorming` era cuándo dejar de preguntar; acá es cuándo
dejar de diagnosticar.

**Qué habría que hacer.** Darle un presupuesto explícito y un formato para lo que averigüe:

- **Un reintento como máximo**, y solo si la primera falla parece transitoria.
- **Después, hasta tres comandos de diagnóstico** cuyo único fin es llenar `blockedReason` — no
  arreglar nada. Nombrar que lo que se busca es *qué falló y en qué capa*, no una solución.
- **Prohibido intentar workarounds** del comando declarado: correr `vitest --pool=threads` cuando
  `CLAUDE.md` dice `npm run check` ya es verificar otra cosa. Si el comando del contrato no corre,
  eso **es** el hallazgo.
- Que el diagnóstico obtenido vaya al `blockedReason`, que hoy es un campo de una línea y debería
  admitir el detalle.

**Costo observado.** Varios minutos de reloj y un volumen de tokens muy superior al de una
verificación normal, para producir un veredicto que la primera falla ya determinaba.

---

## L24 · `dod-checker` no tiene un paso que compare las dependencias contra `CLAUDE.md` · `abierto`

**Qué pasó.** Verificando T1 (2026-09-06) no detectó `@testing-library/jest-dom` en
`devDependencies`, que no figura en la lista de stack de `CLAUDE.md`. Reportó como único desvío el
que la bitácora del implementador ya declaraba.

**Por qué.** El agente tiene la restricción escrita en `## Límites` —«Respetá `CLAUDE.md`: sin
dependencias que `design.md` no haya justificado. Una implementación que sumó una librería por su
cuenta es un desvío que hay que reportar»— pero es una **mención pasiva**, no un paso del
procedimiento. `## Qué verificar` enumera cinco pasos: ubicar la tarea, correr la verificación,
criterio por criterio, el objetivo, y los desvíos del design. **Ninguno dice «leé el manifiesto de
dependencias y restalo de la lista declarada».** Lo que no es un paso, no se hace.

**Por qué importa más de lo que parece.** Una dependencia que entra sin acordarse es de los desvíos
más caros: cambia la superficie de ataque, el tiempo de build y la licencia del producto, y es
invisible en el diff del código de la tarea. Y es justamente el tipo de chequeo mecánico donde un
verificador debería ser mejor que una persona — restar dos listas no requiere juicio.

**Qué habría que hacer.** Agregarlo como paso explícito en `## Qué verificar`, redactado como una
resta y no como un vistazo: leer el manifiesto de dependencias del proyecto, leer la lista declarada
en `CLAUDE.md`, y reportar en `designDeviations` **toda** entrada del primero que no esté en la
segunda — esté o no declarada en la bitácora. Que el implementador ya la haya confesado no la saca
del veredicto: cambia si es un desvío *registrado* o *silencioso*, y las dos cosas van al reporte.

**Relación con [[L22]].** Son las dos mitades del mismo fallo: L22 explica por qué el agente se dejó
guiar por el relato del implementador; esta explica por qué no tenía un procedimiento propio con el
que contrastarlo.

---

## L25 · El entorno puede bloquear binarios nativos, y eso paraliza la verificación · `abierto`

**Qué pasó.** En `my-harness-demo` (2026-09-06), `npm test` (vitest) y `npm run lint` (biome) se
cuelgan sin producir resultado, de forma reproducible, con y sin el sandbox del harness. El `ps aux`
muestra dos procesos `@biomejs/cli-darwin-arm64/biome` en estado **`UE`** —uninterruptible— que **no
responden ni a `kill -9`**. Eso es un bloqueo a nivel de kernel, no de Node.

**El patrón.** Falla todo lo que lanza un binario nativo o un worker con IPC recién instalado por
npm; funciona todo lo que corre in-process (`node -e`, `tsc`, `vite build` con rolldown como addon
nativo ya cargado). Candidato principal: la verificación de Gatekeeper/notarización en la primera
ejecución de binarios nativos nuevos en macOS.

**Por qué es un problema del harness y no solo de la máquina.** `npm run check` es la compuerta de
**todas** las tareas. Si el entorno donde corre `dod-checker` no puede ejecutar el runner de tests,
ninguna tarea puede pasar a `hecho` y el ciclo se detiene por completo — con veredictos correctos
(`no-verificable`) pero inútiles. El harness supone, sin decirlo en ninguna parte, que el entorno de
verificación puede hacer todo lo que hace el de implementación.

**Qué habría que hacer.** Que `CLAUDE.md` —o el futuro `/harness-init` de [[L1]]— declare
explícitamente en qué entorno se verifica, y que un fallo de arranque de proceso repetido escale a
una decisión humana en vez de reintentarse (ver [[L23]]). El propio veredicto de T1 lo pidió en sus
`specGaps`, que es exactamente para lo que existe ese campo.

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
