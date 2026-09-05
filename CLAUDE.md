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
- `tasks.md` lo escribe **solo** el workflow `tasks-fanout`, nunca a mano ni con otro subagente. El
  workflow revisa las tareas en paralelo con agentes de solo lectura y las materializa con un
  único escritor; planificar por afuera reintroduce el segundo escritor que eso elimina.
- El **DoD** (definition of done) de una tarea son los criterios que dice cubrir más su objetivo.
  Lo evalúa el subagente `dod-checker`, que corre los tests y reporta — nunca cambia el estado en
  `tasks.md`, porque ese archivo tiene un único escritor. Que una tarea pase a `hecho` lo decide
  una persona.