#!/usr/bin/env python3
"""
Chequeos mecánicos para las corridas de eval del skill `specify`.

Uso:
    python3 check_specs.py <ruta-a-iteration-N>

Recorre <iteration>/eval-*/<config>/run-*/outputs/ y verifica lo que se puede
verificar sin criterio humano: convención de carpeta, separación de documentos,
numeración, notación EARS, secciones del design, trazabilidad, y la frontera
qué/cómo dentro de los criterios de aceptación.
"""
import re
import sys
from pathlib import Path

EARS_KW = ["WHEN", "IF", "THEN", "WHILE", "WHERE", "THE SYSTEM SHALL"]
DESIGN_SECTIONS = ["Arquitectura", "Flujo de datos", "Interfaces",
                   "Modelos de datos", "Manejo de errores", "Estrategia de testing"]

# Pistas de implementación que no deberían aparecer dentro de un criterio.
IMPL_PATTERNS = [
    (r"[\w./-]+\.(?:json|ts|tsx|js|csv|md|yml|yaml)\b", "archivo"),
    (r"\b[\w-]+/[\w./-]+", "ruta"),
    (r"\b[a-z][a-zA-Z0-9]*\([^)]*\)", "llamada a función"),
    (r"\b(?:vitest|commander|yargs|zod|csv-parse|sqlite|express|lodash)\b", "librería"),
]


def criterios_de(texto: str):
    """Devuelve [(id_aprox, texto_criterio)] tomando solo los bloques de criterios."""
    criterios = []
    req_actual = "R?"
    en_bloque = False
    buffer, num = [], None

    def cerrar():
        if buffer and num is not None:
            criterios.append((f"{req_actual}.{num}", " ".join(buffer).strip()))

    for linea in texto.splitlines():
        m_req = re.match(r"^###\s+(R\d+)\b", linea)
        if m_req:
            cerrar()
            buffer, num = [], None
            req_actual, en_bloque = m_req.group(1), False
            continue
        if re.match(r"^####\s", linea):
            cerrar()
            buffer, num = [], None
            en_bloque = "criterios de aceptaci" in linea.lower()
            continue
        if not en_bloque:
            continue
        m_item = re.match(r"^\s*(\d+)\.\s+(.*)$", linea)
        if m_item:
            cerrar()
            num, buffer = int(m_item.group(1)), [m_item.group(2)]
        elif buffer and linea.strip():
            buffer.append(linea.strip())
        elif buffer and not linea.strip():
            cerrar()
            buffer, num = [], None
    cerrar()
    return criterios


def es_placeholder(token: str) -> bool:
    """Máscaras tipo DD/MM/AAAA o YYYY-MM: describen un formato, no un artefacto."""
    return bool(re.fullmatch(r"[A-Z]{1,4}([/-][A-Z]{1,4})+", token))


def filtraciones(criterios):
    """Criterios que nombran rutas, archivos, funciones o librerías concretas."""
    hallazgos = []
    for cid, texto in criterios:
        vistos = {}
        for patron, clase in IMPL_PATTERNS:
            for m in re.finditer(patron, texto):
                # La puntuación de la oración no es parte del token.
                token = m.group(0).rstrip(".,;:)")
                if not token or token.upper() in EARS_KW or es_placeholder(token):
                    continue
                # Un mismo token puede matchear varios patrones; se reporta una vez.
                vistos.setdefault(token, clase)
        hallazgos.extend((cid, clase, token) for token, clase in vistos.items())
    return hallazgos


def revisar(run_dir: Path, root: Path):
    out = run_dir / "outputs"
    print(f"\n{'=' * 78}\n{run_dir.relative_to(root)}\n{'=' * 78}")

    docs = sorted((out / "docs").rglob("*.md")) if (out / "docs").exists() else []
    code = [p for p in out.rglob("*") if p.suffix in (".ts", ".js", ".tsx")]
    print(f"documentos: {len(docs)}  |  archivos de código: {len(code)}")
    for d in docs:
        print(f"  - {d.relative_to(out)}")

    dated = [d for d in docs if re.match(r"^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$", d.parent.name)]
    print(f"carpeta docs/AAAA-MM-DD-<kebab>/: {'SI' if dated else 'NO'}"
          + (f" ({dated[0].parent.name})" if dated else ""))
    print(f"requirements.md y design.md separados: "
          f"{'SI' if {d.name for d in docs} >= {'requirements.md', 'design.md'} else 'NO'}")

    req = next((d for d in docs if d.name == "requirements.md"), None)
    des = next((d for d in docs if d.name == "design.md"), None)

    if req:
        t = req.read_text()
        crit = criterios_de(t)
        con_kw = [c for c in crit if any(c[1].startswith(k) for k in EARS_KW)]
        reqs = re.findall(r"^###\s+(R\d+)\b", t, re.M)
        stories = re.findall(r"\*\*User story:\*\*", t)
        print(f"\n[requirements.md]  requisitos: {reqs}")
        print(f"  user stories: {len(stories)}")
        print(f"  criterios detectados: {len(crit)}  |  que abren con keyword EARS: {len(con_kw)}")
        print(f"  keywords traducidas (DEBERÁ/CUANDO): {len(re.findall(r'DEBERÁ|CUANDO ', t))}")
        print(f"  secciones Alcance/Supuestos: {'Alcance' in t}/{'Supuesto' in t}")

        fugas = filtraciones(crit)
        if fugas:
            print(f"  ⚠ FRONTERA QUÉ/CÓMO: {len(fugas)} filtración(es) de implementación en criterios")
            for cid, clase, token in fugas:
                print(f"      {cid}: {clase} → {token}")
        else:
            print("  frontera qué/cómo: sin filtraciones de implementación en los criterios")

    if des:
        t = des.read_text()
        faltan = [s for s in DESIGN_SECTIONS if s.lower() not in t.lower()]
        refs = sorted(set(re.findall(r"\bR\d+\.\d+\b", t)))
        print(f"\n[design.md]  secciones faltantes: {faltan or 'ninguna'}")
        print(f"  menciones 'Cubre': {len(re.findall(r'Cubre', t))}")
        print(f"  ids de criterio referenciados: {len(refs)}")
        if req:
            ids_req = {c[0] for c in criterios_de(req.read_text())}
            sin_cubrir = sorted(ids_req - set(refs))
            print(f"  criterios sin ninguna referencia en el design: {sin_cubrir or 'ninguno'}")
        print(f"  tabla de alternativas descartadas: {'descart' in t.lower()}")

    if not docs:
        print("\n(no se produjo ningún documento)")


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    for eval_dir in sorted(root.glob("eval-*")):
        for cfg_dir in sorted(p for p in eval_dir.iterdir() if p.is_dir()):
            for run in sorted(cfg_dir.glob("run-*")):
                revisar(run, root)


if __name__ == "__main__":
    main()
