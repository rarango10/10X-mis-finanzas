---
name: planning-tasks
description: Verifica que el spec de una feature esté completo y aprobado y, si lo está, lanza el workflow "tasks-fanout" que crea o itera su tasks.md. Pregunta antes de lanzar. No planifica ni escribe tasks.md por su cuenta. Es el único camino al plan de tareas: usalo cuando la persona diga "planeemos las tareas", "desglosemos las tareas", "armemos el plan de implementación", "generá el plan de implementación", "iteremos tasks.md", "revisemos las tareas del spec", o pregunte cuál es el siguiente paso después de aprobar el design. Si requirements.md o design.md no existen o todavía no están aprobados, este skill no aplica — remití a "specify" primero.
---

# Planning Tasks

Verificar los insumos, preguntar, lanzar. El plan de tareas lo arma el workflow `tasks-fanout`;
este skill solo comprueba que pueda correr y lo dispara.

## 1. Verificá los insumos

La carpeta del spec es `docs/AAAA-MM-DD-<feature>/`. Si hay varias y no está claro cuál,
preguntá. Ahí adentro:

- `requirements.md` existe y su encabezado de estado dice `aprobado`.
- `design.md` existe y su encabezado de estado dice `aprobado`.

Si falta cualquiera de los dos, o están en `pendiente de aprobación`, **pará acá**: decíselo a la
persona y remitila al skill `specify`. No lances igual ni completes vos lo que falte.

## 2. Preguntá

Una línea con la carpeta y, si `tasks.md` ya existe, cuántas tareas tiene hoy — el workflow lanza
un agente por tarea, así que ese número es lo que hace que la pregunta signifique algo.

Esperá el sí. Una confirmación corta («dale», «va») alcanza.

## 3. Lanzá

Llamá al tool `Workflow` con el workflow guardado `tasks-fanout` y `args` igual a la ruta de la
carpeta del spec:

```
Workflow(tasks-fanout, args: "docs/AAAA-MM-DD-<feature>")
```

`args` también acepta un objeto, para acotar las rondas o forzar un spec sin aprobar:
`{"specDir": "docs/AAAA-MM-DD-<feature>", "maxRounds": 2}`.

### Si algo falla al lanzar

Son dos fallas distintas y se arreglan distinto.

**El tool `Workflow` no existe.** Los workflows dinámicos son opt-in en el plan Pro: si
`enableWorkflows` no está en `~/.claude/settings.json`, el tool ni se ofrece. Pedile que lo
active (`/config` → Dynamic workflows, o la clave a mano) y que abra una **sesión nueva** — el
toolset se arma al arrancar.

**El tool existe pero dice `Workflow "tasks-fanout" not found`.** El registro de nombres se arma
al arrancar la sesión, así que un workflow creado o editado a mitad de sesión se cae de ahí.
No ofrezcas `/tasks-fanout`: ese comando sale del mismo registro y tampoco va a existir. Lanzalo
por ruta, que no depende del registro:

```
Workflow(scriptPath: "<ruta absoluta del repo>/.claude/workflows/tasks-fanout.js",
         args: "docs/AAAA-MM-DD-<feature>")
```

Lo que nunca hagas, pase lo que pase, es escribir `tasks.md` por afuera: el workflow existe para
que ese archivo tenga un solo escritor.
