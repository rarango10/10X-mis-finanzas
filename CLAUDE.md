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

brainstorm definición (skill `brainstorming`) → spec: `requirements.md` + `design.md` (skill `specify`) → plan de tareas: `tasks.md` (skill `planning-tasks`, con el subagente `planner`) → ejecución (TDD) → verificación → commit

Todo en `docs/AAAA-MM-DD-<feature>/`.

## Reglas

- Una feature a la vez. No abrir frentes en paralelo.
- TDD: test que falla → implementar → test que pasa.
- No agregar dependencias sin necesidad.