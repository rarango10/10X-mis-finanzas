---
name: harness-spike
description: "Explica el ciclo de desarrollo asistido de este harness y enruta a la pieza que corresponde en cada paso. Usalo cuando la persona pregunte cómo se trabaja acá, cuál es el paso siguiente, qué skill le toca a lo que quiere hacer, o cuando pida arrancar una feature y no esté claro en qué punto del ciclo está. No produce ningún documento por su cuenta: nombra al skill que sí lo produce."
---

# Harness — el ciclo y su ruteo

Este plugin trae un ciclo de desarrollo de siete pasos. Cada paso produce un artefacto, se
detiene y espera aprobación humana. **Ningún paso arranca al que le sigue: lo nombra.**

| # | Producto | Lo produce | Se pide diciendo |
|---|----------|------------|------------------|
| 1 | diseño acordado (en el chat) | skill `brainstorming` | «quiero agregar X», «cómo construimos Y» |
| 2 | `requirements.md` | skill `specify`, fase 1 | «escribamos el spec» |
| 3 | `design.md` | skill `specify`, fase 2 | «pasemos al diseño» |
| 4 | `tasks.md` | skill `planning-tasks` → workflow `tasks-fanout` | «planeemos las tareas» |
| 5 | código + tests | skill `implement-task` (TDD) | «implementemos T3», «seguimos con la que sigue» |
| 6 | veredicto por tarea (en el chat) | subagente `dod-checker` | «verificá T3» |
| 7 | `e2e-tests-plan.md` + `e2e-test-report.md` | skill `verify-e2e` | «verifiquemos e2e» |

Todo el papeleo de una feature vive en `docs/AAAA-MM-DD-<feature>/`.

**Cada documento tiene un solo productor.** Si una frase te deja dudando entre dos skills, gana
esta tabla. Y si el `CLAUDE.md` del proyecto trae su propia tabla de ruteo, **gana la del
proyecto**: este skill describe el ciclo por defecto, no lo impone sobre un repo que ya decidió.

## Lo que el harness espera del proyecto

Los skills y los subagentes no saben qué stack usás. Leen el `CLAUDE.md` del proyecto, que tiene
que declarar al menos:

- **Comandos de verificación** — de ahí sacan qué correr `spec-scout`, `dod-checker`,
  `task-reviewer` y `e2e-triager`. Sin esa sección no saben cómo comprobar nada.
- **Stack y reglas** — el contrato del proyecto, que `specify` respeta al diseñar.

Si el proyecto no tiene `CLAUDE.md`, decilo antes de arrancar: no lo inventes ni asumas `npm`.

## Las cuatro reglas que sostienen el ciclo

1. **Un solo productor por documento.** El plan de `tasks.md` lo escribe únicamente el workflow
   `tasks-fanout`; los tests e2e, únicamente `e2e-test-writer`; el reporte e2e, únicamente
   `e2e-triager`. Nunca a mano, nunca con otro subagente.

2. **El avance lo escribe quien implementa**, y solo en las regiones de la tarea que está
   haciendo: su celda de `Estado` y su bloque de `Registro` — más el encabezado de aprobación de
   `tasks.md`, una vez, cuando la persona confirma el plan. No es una excepción a la regla
   anterior — son regiones distintas con dueños distintos. Lo único prohibido es implementar
   mientras hay una corrida de `tasks-fanout` en vuelo.

3. **La unidad del paso 5 es la tarea, no la fase.** Once tareas son once ciclos, cada uno
   cerrado por un veredicto de `dod-checker` y su aprobación. La compuerta entre tareas se
   renuncia solo con el vocabulario de `implement-task` (`--modo corrido`), nunca por inferencia;
   la verificación de cada tarea y el corte ante un veredicto menor no se renuncian nunca.

4. **`hecho` significa verificado.** Una tarea pasa a `hecho` solo cuando `dod-checker` devolvió
   `cumple` y ese veredicto quedó asentado en su `Registro`. Cualquier resultado menor la deja
   en `en curso`. La columna `Estado` es el registro durable de qué está terminado de verdad.

## Requisito de entorno

El paso 4 usa un workflow dinámico. Si el tool `Workflow` no existe, hay que activar
`"enableWorkflows": true` en `~/.claude/settings.json` (o `/config` → Dynamic workflows) y abrir
**sesión nueva**: el registro de workflows se arma al arrancar. Sin eso, `planning-tasks` no
puede lanzar nada — y el camino correcto es destrabarlo, no planificar el `tasks.md` a mano.
