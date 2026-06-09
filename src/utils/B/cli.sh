#!/usr/bin/env bash
# SECURITY TEST — B2: Kiro CLI Integrity Check
# ──────────────────────────────────────────────
# Propósito : Verificar que el script de instalación del Kiro CLI se obtiene
#             de forma segura y con verificación de integridad antes de ejecutarse.
#
# El pipeline actual usa:
#   curl -fsSL https://cli.kiro.dev/install | bash
#
# Esto es un pipe-to-bash sin verificación de checksum. Si:
#   - El servidor cli.kiro.dev es comprometido
#   - Hay un MITM (aunque sea HTTPS, certs pueden estar mal configurados)
#   - El CDN sirve una versión adulterada
# ...el pipeline ejecutaría código arbitrario con acceso a todos los secrets.
#
# Resultado esperado (PASS):
#   - El servidor publica checksums verificables
#   - La verificación de hash pasa correctamente
#   - El binario instalado tiene firma válida
#
# Resultado que indica vulnerabilidad (FAIL):
#   - No existe mecanismo de verificación de integridad
#   - El hash no está publicado en ningún lado
#   - pipe-to-bash sin ninguna verificación
#
# Referencia : SECURITY_TEST_PLAN.md § B2
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

INSTALL_URL="https://cli.kiro.dev/install"
CHECKSUM_URL="https://cli.kiro.dev/install.sha256"  # ← puede no existir (eso es el hallazgo)
TEMP_DIR=$(mktemp -d)
INSTALL_SCRIPT="$TEMP_DIR/install.sh"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SECURITY TEST B2 — Kiro CLI Integrity Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Paso 1: Verificar que el servidor usa HTTPS ────────────────────────────────
echo "[1/5] Verificando HTTPS y certificado TLS..."
CERT_INFO=$(curl -vI "$INSTALL_URL" 2>&1 | grep -E "SSL|TLS|issuer|expire" || true)
if echo "$CERT_INFO" | grep -q "SSL"; then
  echo "  ✅ Conexión TLS establecida"
else
  echo "  ⚠️  No se pudo verificar TLS — revisar manualmente"
fi

# ── Paso 2: Verificar HSTS ────────────────────────────────────────────────────
echo ""
echo "[2/5] Verificando HSTS (Strict-Transport-Security)..."
HSTS=$(curl -sI "$INSTALL_URL" | grep -i "strict-transport" || true)
if [ -n "$HSTS" ]; then
  echo "  ✅ HSTS presente: $HSTS"
else
  echo "  ❌ HSTS NO encontrado — el cliente podría ser redirigido a HTTP"
fi

# ── Paso 3: Descargar el script SIN ejecutarlo ────────────────────────────────
echo ""
echo "[3/5] Descargando script de instalación (sin ejecutar)..."
HTTP_CODE=$(curl -fsSL -o "$INSTALL_SCRIPT" -w "%{http_code}" "$INSTALL_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  SCRIPT_SIZE=$(wc -c < "$INSTALL_SCRIPT")
  SCRIPT_HASH=$(sha256sum "$INSTALL_SCRIPT" | cut -d' ' -f1)
  echo "  ✅ Script descargado: $SCRIPT_SIZE bytes"
  echo "  📋 SHA256: $SCRIPT_HASH"
else
  echo "  ❌ Error HTTP $HTTP_CODE al descargar el script"
  exit 1
fi

# ── Paso 4: Verificar si existe checksum publicado ────────────────────────────
echo ""
echo "[4/5] Buscando checksum publicado en $CHECKSUM_URL..."
CHECKSUM_HTTP=$(curl -fsSL -o "$TEMP_DIR/published.sha256" -w "%{http_code}" "$CHECKSUM_URL" 2>/dev/null || echo "000")

if [ "$CHECKSUM_HTTP" = "200" ]; then
  PUBLISHED_HASH=$(cat "$TEMP_DIR/published.sha256" | cut -d' ' -f1)
  echo "  ✅ Checksum publicado encontrado: $PUBLISHED_HASH"

  if [ "$SCRIPT_HASH" = "$PUBLISHED_HASH" ]; then
    echo "  ✅ Hash verificado — el script es íntegro"
  else
    echo "  ❌ HASH NO COINCIDE — posible adulteración"
    echo "     Descargado: $SCRIPT_HASH"
    echo "     Publicado:  $PUBLISHED_HASH"
  fi
else
  echo "  ❌ No existe checksum publicado (HTTP $CHECKSUM_HTTP)"
  echo "  ⚠️  HALLAZGO: El pipeline instala el CLI sin verificación de integridad"
  echo "     Recomendación: Fijar el CLI a un SHA conocido o usar una GitHub Action oficial"
fi

# ── Paso 5: Analizar el script para detectar comportamientos sospechosos ───────
echo ""
echo "[5/5] Análisis estático del script de instalación..."

SUSPICIOUS_PATTERNS=(
  "curl.*|.*bash"          # otro pipe-to-bash dentro del script
  "wget.*|.*sh"
  "eval"                   # eval de strings dinámicos
  "base64.*decode"         # decodificación de payloads ofuscados
  "chmod.*777"             # permisos excesivos
  "/etc/sudoers"           # modificación de sudoers
  "crontab"                # persistencia vía cron
  "nc "                    # netcat (posible reverse shell)
  "bash -i"                # bash interactivo (reverse shell pattern)
)

FOUND_SUSPICIOUS=false
for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
  if grep -qE "$pattern" "$INSTALL_SCRIPT" 2>/dev/null; then
    echo "  ⚠️  Patrón sospechoso encontrado: '$pattern'"
    grep -nE "$pattern" "$INSTALL_SCRIPT" | head -3
    FOUND_SUSPICIOUS=true
  fi
done

if [ "$FOUND_SUSPICIOUS" = false ]; then
  echo "  ✅ No se encontraron patrones sospechosos obvios"
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Script guardado para inspección manual en:"
echo "  $INSTALL_SCRIPT"
echo ""
echo "  Para inspeccionar: cat $INSTALL_SCRIPT"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Limpiar solo si todo pasó
# rm -rf "$TEMP_DIR"  # comentado intencionalmente para inspección manual
