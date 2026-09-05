---
name: planning-tasks
description: Orquesta el subagente "planner" para crear o iterar por completo el tasks.md de un spec ya aprobado (requirements.md + design.md), llamándolo una tarea a la vez y en secuencia hasta que el plan llega a un punto fijo — tamaño correcto por tarea, cobertura completa contra los criterios de requirements.md, y reconciliado con el estado real del código. Es el reemplazo de hacer la Fase 3 de "specify" a mano. Usá este skill apenas requirements.md y design.md estén aprobados y la persona diga "planeemos las tareas", "iteremos tasks.md", "generá el plan de implementación con planner/con subagentes", "revisemos las tareas del spec", o pregunte cuál es el siguiente paso después de aprobar el design. Si requirements.md o design.md no existen o no están aprobados todavía, este skill no aplica — remití a "specify" primero.
---

# Planning Tasks

Convertir un spec aprobado (`requirements.md` + `design.md`) en un `tasks.md` completamente
revisado, orquestando el subagente `.claude/agents/planner.md` en vez de escribir el plan a
mano. `planner` sabe evaluar una tarea a la vez —tamaño, cobertura de criterios, estado real del
proyecto—, pero no sabe por sí solo cuándo el plan entero ya está terminado ni en qué orden
conviene llamarlo. Ese es el trabajo de este skill: manejar la cola de tareas pendientes de
revisión y decidir cuándo parar.

## Por qué secuencial y no en paralelo

Es tentador lanzar un `planner` por tarea al mismo tiempo para ir más rápido, pero **no lo
hagas**: todos leerían y escribirían el mismo `tasks.md`, y el último que guarde pisa los
cambios de los demás — una condición de carrera clásica sobre un archivo compartido. Además,
`planner` decide splits, merges y tareas nuevas mirando el contexto de sus vecinas; si dos
llamados corren a ciegas uno del otro sobre tareas relacionadas, van a tomar decisiones que se
contradicen o se duplican. Por eso cada llamado a `planner` en este skill va con
`run_in_background: false`, y el siguiente no se lanza hasta que el anterior terminó y sus
cambios ya están en disco.

## Precondiciones

Antes de arrancar, confirmá en la carpeta del spec (`docs/AAAA-MM-DD-<feature>/`):

- `requirements.md` existe y su estado dice `aprobado`.
- `design.md` existe y su estado dice `aprobado`.

Si falta cualquiera de los dos, o están en `pendiente de aprobación`, no inventes nada: decíselo
a la persona y sugerí correr el skill `specify` primero (fases 1 y 2). Este skill asume esos dos
documentos como una entrada estable — no es su trabajo tocarlos ni volver a preguntar lo que
`specify` ya resolvió con la persona.

## Procedimiento

### 1. Estado inicial de `tasks.md`

- **No existe** → un único llamado a `planner`:

  ```
  Agent({
    description: "Crear plan inicial de tareas",
    subagent_type: "planner",
    run_in_background: false,
    prompt: "Carpeta del spec: <ruta>. requirements.md y design.md ya están aprobados.
             Encargo: Crear el plan inicial."
  })
  ```

  Esperá a que termine, releé el `tasks.md` resultante y seguí al paso 2 con la tabla de Plan
  que haya quedado — pero no encoles la primera tarea (T1): `planner` ya la revisó como parte
  de este mismo llamado, volver a mandarla a revisión sería una vuelta desperdiciada.

- **Ya existe** → leé la tabla de Plan tal como está; esa es tu punto de partida.

### 2. Armar la cola de revisión

Tomá los ids de tarea de la tabla de Plan, en el orden en que aparecen, y ponelos en una cola.
Guardá también `N` = cantidad de tareas iniciales — la vas a necesitar para el techo de
seguridad del paso 3.

### 3. Loop secuencial hasta punto fijo

Mientras la cola no esté vacía:

1. Sacá el primer id de la cola.
2. Llamá a `planner`, siempre secuencial (`run_in_background: false`, esperar a que termine
   antes de seguir):

   ```
   Agent({
     description: "Revisar tarea <id>",
     subagent_type: "planner",
     run_in_background: false,
     prompt: "Carpeta del spec: <ruta>. tasks.md ya existe. Encargo: Revisá la tarea <id>."
   })
   ```
3. Releé `tasks.md` y compará contra el estado justo antes de este llamado:
   - **Tareas nuevas** (splits, huecos de cobertura que `planner` llenó agregando una tarea al
     final) → encolalas, todavía no las revisó nadie.
   - **Una tarea existente cambió de alcance sin ser la que revisaste** (por ejemplo, `planner`
     fusionó otra tarea dentro de ella) → volvé a encolarla para una pasada de confirmación,
     salvo que ya esté en la cola.
   - **Veredicto "ok tal cual" sin cambios** → no la vuelvas a encolar; ya está resuelta.
4. Si `planner` reportó un hueco de spec (algo que le correspondería a `requirements.md` o
   `design.md`, que él mismo no edita) — anotalo aparte para el reporte final, no intentes
   resolverlo vos.
5. **Techo de seguridad**: si el total de llamados a `planner` en este loop supera
   `max(20, 3 × N)`, parate ahí aunque la cola no esté vacía. Un loop que no converge después de
   tantas vueltas es una señal de que algo en el spec o en el plan necesita ojo humano, no más
   iteraciones automáticas — reportá el estado tal como quedó y explicá por qué frenaste.

Un detalle importante: **este skill nunca escribe `tasks.md` directamente.** Todo cambio al
archivo pasa por `planner`; vos solo lo leés para armar y actualizar la cola. Si el propio skill
también escribiera el archivo, sería un segundo escritor concurrente con el mismo problema de
condición de carrera que estamos evitando al no paralelizar los llamados.

### 4. Pasada final de consistencia

Cuando la cola queda vacía, releé `tasks.md` una vez más y verificá vos mismo (sin otro llamado
a `planner` si no hace falta):

- Todo criterio `Rx.y` de `requirements.md` aparece en la columna "Cubre" de al menos una tarea.
- Ninguna tarea existe sin un criterio real o una justificación explícita de infraestructura o
  integración (como el setup inicial o la integración final).
- No hay ids de tarea duplicados ni reutilizados.

Si encontrás algo, encolá solo eso puntual y repetí el paso 3 para resolverlo — no reinicies
todo el proceso desde cero.

### 5. Reportar y frenar

Contale a la persona: cuántas tareas tiene el plan al final, cuántas se resolvieron sin cambios,
se redimensionaron, se dividieron, se fusionaron, se agregaron o se eliminaron durante el
proceso, cualquier hueco de spec que haya quedado pendiente de una decisión humana, y el estado
final del archivo (`pendiente de aprobación`).

Este skill **nunca marca `tasks.md` como aprobado por su cuenta ni avanza a implementación** —
igual que en `specify`, una aprobación corta o informal aprueba el documento presentado, nada
más. Parate ahí y esperá que la persona lo revise y decida.
