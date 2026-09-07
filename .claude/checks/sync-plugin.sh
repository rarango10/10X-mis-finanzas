#!/usr/bin/env bash
#
# Resincroniza el plugin desde el repo y verifica que no quede deriva.
#
# El repo es la fuente; ~/.claude/skills/harness-spike/ es una copia. Si editás el repo y no
# resincronizás, la sesión de prueba carga la versión vieja y cualquier conclusión es falsa.
#
# La verificación NO enumera directorios. Compara el árbol completo del plugin contra el árbol
# que el repo puede reconstruir, y exige que no sobre ni falte un solo archivo. La versión
# anterior hacía `diff -rq` sobre cuatro directorios conocidos, y por eso no vio nunca los dos
# archivos del plugin que no tenían fuente en el repo (L35): un chequeo que enumera lo que conoce
# nunca encuentra lo que no está en su lista.
#
# Uso:  bash .claude/checks/sync-plugin.sh [ruta-del-plugin]

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN="${1:-$HOME/.claude/skills/harness-spike}"

# Skills que viven en el repo pero NO son del harness: herramientas de autoría vendoreadas.
# Es una lista de exclusión y no de inclusión a propósito — así un skill nuevo del harness entra
# solo, en vez de que alguien tenga que acordarse de agregarlo a una lista.
NO_EMPAQUETAR=(skill-creator)

[ -d "$PLUGIN" ] || { echo "✗ no existe el plugin en $PLUGIN"; exit 1; }

# ---------------------------------------------------------------- copiar

esta_excluido() {
  local nombre="$1" x
  for x in "${NO_EMPAQUETAR[@]}"; do
    if [ "$nombre" = "$x" ]; then return 0; fi
  done
  return 1
}

mkdir -p "$PLUGIN/skills" "$PLUGIN/agents" "$PLUGIN/workflows" "$PLUGIN/checks" "$PLUGIN/.claude-plugin"

for d in "$REPO"/.claude/skills/*/; do
  nombre="$(basename "$d")"
  if esta_excluido "$nombre"; then continue; fi
  rm -rf "${PLUGIN:?}/skills/$nombre"
  cp -R "$d" "$PLUGIN/skills/$nombre"
done

cp "$REPO"/.claude/agents/*.md          "$PLUGIN/agents/"
cp "$REPO"/.claude/workflows/*.js       "$PLUGIN/workflows/"
cp "$REPO"/.claude/checks/*             "$PLUGIN/checks/"
cp "$REPO"/.claude/plugin-root/SKILL.md "$PLUGIN/"
cp "$REPO"/.claude/plugin-root/.claude-plugin/plugin.json "$PLUGIN/.claude-plugin/"

# ------------------------------------------------------- verificar el árbol

# Lo que el repo puede reconstruir, como rutas relativas al plugin.
esperados="$(mktemp)"
{
  for d in "$REPO"/.claude/skills/*/; do
    nombre="$(basename "$d")"
    if esta_excluido "$nombre"; then continue; fi
    (cd "$REPO/.claude/skills" && find "$nombre" -type f ! -name '.DS_Store') | sed 's|^|skills/|'
  done
  (cd "$REPO/.claude/agents"    && find . -type f -name '*.md' ! -name '.DS_Store') | sed 's|^\./|agents/|'
  (cd "$REPO/.claude/workflows" && find . -type f -name '*.js' ! -name '.DS_Store') | sed 's|^\./|workflows/|'
  (cd "$REPO/.claude/checks"    && find . -type f ! -name '.DS_Store')              | sed 's|^\./|checks/|'
  echo "SKILL.md"
  echo ".claude-plugin/plugin.json"
} | sort > "$esperados"

# Lo que el plugin tiene de verdad.
reales="$(mktemp)"
(cd "$PLUGIN" && find . -type f ! -name '.DS_Store') | sed 's|^\./||' | sort > "$reales"

sobran="$(comm -13 "$esperados" "$reales")"
faltan="$(comm -23 "$esperados" "$reales")"

estado=0
if [ -n "$sobran" ]; then
  echo "✗ archivos en el plugin sin fuente en el repo:"
  echo "$sobran" | sed 's|^|    |'
  echo "  → traelos a .claude/ antes de seguir; el repo es la fuente."
  estado=1
fi
if [ -n "$faltan" ]; then
  echo "✗ archivos del repo que no llegaron al plugin:"
  echo "$faltan" | sed 's|^|    |'
  estado=1
fi

rm -f "$esperados" "$reales"

if [ "$estado" -eq 0 ]; then
  n="$(cd "$PLUGIN" && find . -type f ! -name '.DS_Store' | wc -l | tr -d ' ')"
  echo "sin deriva — $n archivos, árbol idéntico"
fi
exit "$estado"
