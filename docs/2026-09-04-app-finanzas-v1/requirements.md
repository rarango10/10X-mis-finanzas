# Requirements — App de finanzas personales v1

> Estado: aprobado (2026-09-04)

## Introducción

Hoy no hay forma de saber, mes a mes, cuánto se gasta en cada categoría ni si eso respeta lo
presupuestado. Esta feature construye la primera versión de la app: una web app donde el usuario
carga sus gastos a mano, los organiza en categorías propias, define cuánto quiere gastar como
máximo por categoría cada mes, y ve un resumen de cuánto lleva gastado contra ese límite. Todo
corre en el navegador, sin backend ni cuentas de usuario.

## Alcance

**Incluye**
- Registrar gastos manualmente (monto, categoría, fecha, descripción opcional).
- Crear, editar y borrar categorías propias, además de un conjunto de categorías predefinidas
  disponibles desde el primer uso.
- Definir un presupuesto mensual por categoría, que se repite automáticamente mes a mes hasta
  que el usuario lo cambie.
- Ver un resumen del mes actual con el total gastado y el presupuesto de cada categoría.
- Persistencia de todos los datos en el navegador (localStorage), sin backend.
- Una sola moneda, con formato numérico fijo.

**No incluye (por ahora)**
- Editar o borrar un gasto ya cargado — corregir un error implica que todavía no hay forma de
  hacerlo en esta versión.
- Importar gastos desde CSV u otra fuente — solo carga manual.
- Múltiples monedas o selector de moneda.
- Backend, API o sincronización entre dispositivos.
- Autenticación o múltiples usuarios.
- Reportes de meses anteriores o gráficos — el resumen solo cubre el mes actual.

## Requirements

### R1 — Gestión de categorías

**User story:** Como usuario, quiero crear, editar y borrar mis propias categorías de gasto,
para organizarlas según mis necesidades.

#### Criterios de aceptación

1. WHEN el usuario abre la aplicación sin categorías guardadas previamente (primer uso)
   THE SYSTEM SHALL crear un conjunto de categorías predefinidas y dejarlas disponibles para usar.
2. WHEN el usuario crea una categoría con un nombre no vacío que no coincide, sin distinguir
   mayúsculas y minúsculas, con el nombre de ninguna categoría existente
   THE SYSTEM SHALL agregarla a la lista de categorías disponibles.
3. IF el usuario intenta crear una categoría con nombre vacío o que ya existe (sin distinguir
   mayúsculas y minúsculas)
   THEN THE SYSTEM SHALL rechazar la creación e indicar el motivo.
4. WHEN el usuario cambia el nombre de una categoría existente a un nombre válido y no duplicado
   THE SYSTEM SHALL actualizar ese nombre en la categoría y en los gastos y presupuestos que ya
   la usan.
5. WHEN el usuario borra una categoría que tiene gastos asociados
   THE SYSTEM SHALL reasignar esos gastos a una categoría fija llamada "Sin categoría".
6. IF el usuario intenta borrar o renombrar la categoría "Sin categoría"
   THEN THE SYSTEM SHALL rechazar la acción.

### R2 — Registro de gastos

**User story:** Como usuario, quiero registrar los gastos que hago día a día, para saber en qué
estoy gastando mi dinero.

#### Criterios de aceptación

1. WHEN el usuario registra un gasto con un monto mayor a 0, una categoría existente y una
   fecha no futura
   THE SYSTEM SHALL guardarlo y mostrarlo en la lista de gastos.
2. IF el usuario intenta registrar un gasto con un monto menor o igual a 0
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
3. IF el usuario intenta registrar un gasto con una fecha posterior a la fecha de hoy
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.
4. WHERE el usuario no cargó una descripción para el gasto
   THE SYSTEM SHALL guardarlo igualmente sin descripción.
5. IF el usuario intenta registrar un gasto sin seleccionar una categoría o con una categoría
   que no existe
   THEN THE SYSTEM SHALL rechazar el registro e indicar el motivo.

### R3 — Persistencia local

**User story:** Como usuario, quiero que mis gastos, categorías y presupuestos se guarden en mi
navegador, para no perderlos al cerrar o recargar la página.

#### Criterios de aceptación

1. WHEN el usuario recarga la página o vuelve a abrir la aplicación en el mismo navegador
   THE SYSTEM SHALL mostrar los gastos, categorías y presupuestos guardados previamente.
2. THE SYSTEM SHALL guardar en el navegador cualquier cambio en gastos, categorías o
   presupuestos antes de dar la acción por completada.
3. IF los datos guardados en el navegador no se pueden leer o tienen un formato no reconocido
   THEN THE SYSTEM SHALL iniciar con el conjunto de categorías predefinidas y sin gastos ni
   presupuestos, en lugar de fallar.

### R4 — Presupuesto mensual por categoría

**User story:** Como usuario, quiero definir un presupuesto mensual por categoría, para
controlar cuánto gasto en cada una.

#### Criterios de aceptación

1. WHEN el usuario define un presupuesto mayor a 0 para una categoría
   THE SYSTEM SHALL guardarlo como el presupuesto de esa categoría para el mes actual y los
   meses siguientes, hasta que el usuario lo cambie.
2. WHEN el usuario cambia el presupuesto de una categoría
   THE SYSTEM SHALL usar el nuevo monto desde ese momento en adelante para calcular el resumen
   del mes actual.
3. IF el usuario intenta definir un presupuesto menor o igual a 0 para una categoría
   THEN THE SYSTEM SHALL rechazar la definición e indicar el motivo.
4. IF una categoría no tiene un presupuesto definido
   THEN THE SYSTEM SHALL considerar su presupuesto como 0 a los efectos del resumen mensual.
5. IF el usuario intenta definir un presupuesto para una categoría que no existe
   THEN THE SYSTEM SHALL rechazar la definición e indicar el motivo.

### R5 — Resumen mensual de gastado vs presupuesto

**User story:** Como usuario, quiero ver cuánto llevo gastado contra el presupuesto de cada
categoría en el mes actual, para saber si me estoy pasando.

#### Criterios de aceptación

1. WHEN el usuario abre el resumen del mes actual
   THE SYSTEM SHALL mostrar, para cada categoría existente, el total gastado en el mes actual y
   su presupuesto.
2. WHERE el total gastado de una categoría en el mes actual supera su presupuesto
   THE SYSTEM SHALL marcar esa categoría como excedida en el resumen.
3. THE SYSTEM SHALL calcular el mes actual a partir de la fecha del dispositivo del usuario.

### R6 — Formato numérico y moneda

**User story:** Como usuario, quiero que los montos se muestren y se ingresen de forma
consistente en una sola moneda, para no confundirme con los números.

#### Criterios de aceptación

1. THE SYSTEM SHALL mostrar todos los montos en una única moneda, usando el punto como
   separador decimal y hasta 2 decimales.
2. IF el usuario ingresa un monto con más de 2 decimales
   THEN THE SYSTEM SHALL redondearlo a 2 decimales antes de guardarlo.

## Supuestos

- Las categorías predefinidas del primer uso son: Comida, Transporte, Vivienda, Servicios,
  Ocio, Salud y Otros. Es una lista razonable de partida; cambiarla no afecta el resto del spec.
- La comparación de nombres de categoría para detectar duplicados no distingue mayúsculas de
  minúsculas ni espacios al principio/final.
- Al borrar una categoría (R1.5) se descarta también el presupuesto que tenía definido; los
  gastos reasignados pasan a contar contra el presupuesto de "Sin categoría", que por defecto
  no tiene presupuesto propio definido (por lo tanto cuenta como 0 según R4.4).
- El "mes actual" se determina con la fecha y zona horaria del dispositivo del usuario, sin
  configuración adicional.

## Preguntas abiertas

- Ninguna por ahora — los huecos detectados durante el brainstorming se resolvieron antes de
  escribir este documento.
