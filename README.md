# 10X-mis-finanzas — archivado

Acá se construyó **GoHarness**, un ciclo de desarrollo asistido por agentes para Claude Code.
El harness ya no vive en este repo.

## → El harness está en [rarango10/GoHarness](https://github.com/rarango10/GoHarness)

```bash
claude plugin marketplace add rarango10/GoHarness
claude plugin install goharness@goharness
```

Ahí están el plugin, la documentación, y `lecciones.md` — las 44 lecciones de usarlo, que son la
parte que no se puede reconstruir leyendo el código.

**Se mudó porque una semilla se juzga por lo que muestra funcionando.** En este repo el ciclo
end-to-end no se puede correr —no hay app que navegar— y el ejemplo de finanzas quedó con 29 tareas
sin cerrar al lado del código terminado: trabajo hecho fuera del ledger, que es justo lo que el
método prohíbe. El repo nuevo tiene dos features completas, con sus veredictos asentados y sus
tests end-to-end en verde.

## Qué queda acá

La historia de cómo se construyó: **58 commits**, 22 sobre el harness y 38 sobre `lecciones.md`,
entre el 3 y el 12 de septiembre de 2026. Los tags `harness-v1` y `harness-v2` marcan dos puntos de
retorno de esa construcción.

Y el ejemplo original: un núcleo de funciones puras sobre un `Ledger` inmutable, en `src/split/`
—alta de personas, reparto de centavos, pagos y saldos—, con 68 tests en Vitest. Su spec está en
`docs/2026-09-05-split-de-gastos/`, con el plan de 29 tareas que nunca se ejecutó.

```bash
npm install && npm test
```

## Licencia

[Apache-2.0](LICENSE). Copyright 2026 Raul Arango — ver [`NOTICE`](NOTICE).
