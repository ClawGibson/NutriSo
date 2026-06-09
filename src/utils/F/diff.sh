#!/usr/bin/env bash
# SECURITY TEST — F1: Diff Bomb (DoS del Runner)
# ─────────────────────────────────────────────────
# Propósito : Verificar que el pipeline maneja correctamente un PR con un diff
#             extremadamente grande sin agotar el disco/memoria del runner.
#
# Flujo vulnerable:
#   1. git diff ... > full_diff.patch   ← escribe el archivo completo sin límite
#   2. python3 build_review_prompt.py full_diff.patch "$BYTES" ...
#      → solo entonces trunca con f.read(max_bytes)
#
# El problema: el archivo full_diff.patch se escribe completo antes de truncar.
# Un diff de 2GB llenarían el disco del runner (típicamente 14GB disponibles).
# Un PR con 1000 archivos binarios grandes podría explotar esto.
#
# IMPORTANTE: Ejecutar este script SOLO en un entorno de prueba controlado.
# Genera archivos grandes que consumen disco. No ejecutar en máquinas de producción.
#
# Modos de prueba:
#   --small   → 10MB  (safe, solo para verificar el mecanismo)
#   --medium  → 100MB (moderado)
#   --large   → 500MB (simula el ataque real — usar con precaución)
#
# Uso:
#   bash F1-diff-bomb.sh --small    # solo generar el archivo de prueba localmente
#   bash F1-diff-bomb.sh --medium
#
# Referencia : SECURITY_TEST_PLAN.md § F1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

MODE="${1:---small}"
TEMP_DIR=$(mktemp -d)
FAKE_DIFF="$TEMP_DIR/full_diff.patch"

case "$MODE" in
  --small)
    TARGET_SIZE_MB=10
    ;;
  --medium)
    TARGET_SIZE_MB=100
    ;;
  --large)
    TARGET_SIZE_MB=500
    echo "⚠️  ADVERTENCIA: Generando diff de ${TARGET_SIZE_MB}MB. Esto consumirá disco significativo."
    read -p "¿Continuar? (y/N): " confirm
    [ "$confirm" = "y" ] || exit 0
    ;;
  *)
    echo "Uso: $0 [--small|--medium|--large]"
    exit 1
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SECURITY TEST F1 — Diff Bomb (${TARGET_SIZE_MB}MB)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Generar diff falso de tamaño controlado ───────────────────────────────────
echo "[1/4] Generando diff de prueba (${TARGET_SIZE_MB}MB)..."

# Generar header de diff realista
cat > "$FAKE_DIFF" << 'EOF'
diff --git a/src/utils/giant-file.js b/src/utils/giant-file.js
new file mode 100644
index 0000000..aaaaaaa
--- /dev/null
+++ b/src/utils/giant-file.js
@@ -0,0 +1,999999 @@
EOF

# Llenar con líneas de código JS realistas hasta alcanzar el tamaño objetivo
TARGET_BYTES=$((TARGET_SIZE_MB * 1024 * 1024))
CURRENT_SIZE=$(wc -c < "$FAKE_DIFF")
LINE_NUM=1

while [ "$CURRENT_SIZE" -lt "$TARGET_BYTES" ]; do
  echo "+const variable_${LINE_NUM} = { id: ${LINE_NUM}, value: 'data_${LINE_NUM}', active: true };" >> "$FAKE_DIFF"
  LINE_NUM=$((LINE_NUM + 1))
  # Actualizar tamaño cada 10000 líneas para no hacer stat() en cada iteración
  if [ $((LINE_NUM % 10000)) -eq 0 ]; then
    CURRENT_SIZE=$(wc -c < "$FAKE_DIFF")
    echo -ne "\r  Generado: $(( CURRENT_SIZE / 1024 / 1024 ))MB / ${TARGET_SIZE_MB}MB"
  fi
done

echo ""
ACTUAL_SIZE=$(wc -c < "$FAKE_DIFF")
echo "  ✅ Diff generado: $(( ACTUAL_SIZE / 1024 / 1024 ))MB en $FAKE_DIFF"

# ── Medir tiempo de procesamiento con build_review_prompt.py ─────────────────
echo ""
echo "[2/4] Ejecutando build_review_prompt.py con el diff bomb..."

SCRIPT_PATH="$(dirname "$0")/../../scripts/build_review_prompt.py"
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "  ⚠️  Script no encontrado en $SCRIPT_PATH"
  echo "  Ajustar la ruta relativa si es necesario"
else
  START_TIME=$(date +%s%N)
  python3 "$SCRIPT_PATH" "$FAKE_DIFF" 102400 "/dev/null" "feature/test" "main" "test-user"
  END_TIME=$(date +%s%N)
  ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))

  echo "  ⏱️  Tiempo de procesamiento: ${ELAPSED_MS}ms"
  PROMPT_SIZE=$(wc -c < review_prompt.txt 2>/dev/null || echo "0")
  echo "  📋 Tamaño del prompt generado: ${PROMPT_SIZE} bytes (debe ser ≤ max_bytes)"

  if [ "$PROMPT_SIZE" -le 110000 ]; then
    echo "  ✅ Truncado correcto — el prompt no excede el límite"
  else
    echo "  ❌ El prompt excede el límite esperado — posible problema de truncado"
  fi
fi

# ── Verificar uso de disco durante la generación ──────────────────────────────
echo ""
echo "[3/4] Verificando impacto en disco..."
DISK_USAGE=$(df -h "$TEMP_DIR" | tail -1)
echo "  Disco: $DISK_USAGE"
echo "  Archivo diff: $(du -h "$FAKE_DIFF" | cut -f1)"

# ── Verificar que git diff también tiene límite (el problema real) ────────────
echo ""
echo "[4/4] Diagnóstico del vector real de ataque..."
echo ""
echo "  El pipeline hace:"
echo "    git diff origin/\$BASE_REF...HEAD > full_diff.patch"
echo "  ANTES de truncar. Esto escribe el archivo COMPLETO al disco."
echo ""
echo "  Con un diff de ${TARGET_SIZE_MB}MB:"
echo "  - Disco consumido: ${TARGET_SIZE_MB}MB antes del truncado"
echo "  - Tiempo de escritura: medido arriba"
echo ""
echo "  Recomendación: Usar 'git diff --stat' primero para estimar tamaño,"
echo "  y abortar si supera un umbral antes de generar el diff completo."

# ── Limpiar ───────────────────────────────────────────────────────────────────
echo ""
read -p "¿Eliminar archivos temporales? (Y/n): " cleanup
cleanup="${cleanup:-Y}"
if [ "$cleanup" = "Y" ] || [ "$cleanup" = "y" ]; then
  rm -rf "$TEMP_DIR"
  echo "  🗑️  Archivos temporales eliminados"
else
  echo "  📁 Archivos en: $TEMP_DIR"
fi
