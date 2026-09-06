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

**Qué habría que hacer.** Un paso 0 con dueño: un comando `/harness-init` o un skill que mire el
repo, proponga stack y comandos de verificación, pregunte lo que no pueda deducir, y escriba el
`CLAUDE.md` con la tabla de ruteo y las reglas. `/init` no alcanza: sobre una carpeta vacía no
tiene nada que analizar.

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
