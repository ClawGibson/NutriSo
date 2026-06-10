#!/usr/bin/env bash
# SECURITY TEST — D1: Fork Protection & Secrets Exposure
# ────────────────────────────────────────────────────────
# Propósito : Verificar que el guard de fork funciona correctamente y que
#             los secrets NO están accesibles en runs de PRs de forks.
#
# El workflow tiene este guard:
#   if: >
#     vars.KIRO_REVIEW_ENABLED == 'true' &&
#     github.event.pull_request.head.repo.full_name == github.repository &&
#     github.actor != 'dependabot[bot]'
#
# ESCENARIO DE RIESGO:
#   Si el guard falla (condición evaluada como true incorrectamente),
#   el job correría con acceso a KIRO_API_KEY y KNOWLEDGE_PAT.
#   GitHub por defecto NO pasa secrets a PRs de forks — pero esto
#   depende de la configuración del repo y de que el guard sea correcto.
#
# QUÉ VERIFICAR MANUALMENTE:
#   1. Ir a: Settings → Actions → General → Fork pull request workflows
#      → Debe estar en "Require approval for all outside collaborators"
#      → NO debe estar en "Run workflows from fork pull requests"
#   2. Abrir un PR desde un fork y verificar que el job NO corre
#      (debe quedar en estado skipped, no failed ni success)
#   3. Verificar que el guard condition evalúa correctamente
#
# Referencia : SECURITY_TEST_PLAN.md § D1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO="${1:-}"
GH_TOKEN="${GH_TOKEN:-}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SECURITY TEST D1 — Fork Protection Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -z "$GH_TOKEN" ]; then
  echo "⚠️  GH_TOKEN no configurado. Ejecutando solo checks locales."
  echo "   Para checks de API: export GH_TOKEN=ghp_tu_token_personal"
  echo ""
  API_CHECKS=false
else
  API_CHECKS=true
fi

# ── Check 1: Verificar el guard condition localmente ──────────────────────────
echo "[1/4] Verificando la condición if: del workflow..."

WORKFLOW_FILE="$(dirname "$0")/../../workflows/kiro-code-review.yml"

if [ ! -f "$WORKFLOW_FILE" ]; then
  echo "  ⚠️  Workflow no encontrado en: $WORKFLOW_FILE"
else
  # Extraer y mostrar la condición if
  IF_CONDITION=$(grep -A5 "if: >" "$WORKFLOW_FILE" | head -6)
  echo "  Condición actual:"
  echo "$IF_CONDITION" | sed 's/^/    /'
  echo ""

  # Verificar que las tres condiciones estén presentes
  if echo "$IF_CONDITION" | grep -q "head.repo.full_name == github.repository"; then
    echo "  ✅ Guard de fork presente: head.repo.full_name == github.repository"
  else
    echo "  ❌ Guard de fork NO encontrado — PRs de forks podrían triggear el job"
  fi

  if echo "$IF_CONDITION" | grep -q "KIRO_REVIEW_ENABLED"; then
    echo "  ✅ Feature flag presente: KIRO_REVIEW_ENABLED"
  else
    echo "  ⚠️  Feature flag no encontrado"
  fi

  if echo "$IF_CONDITION" | grep -q "dependabot\[bot\]"; then
    echo "  ✅ Guard de Dependabot presente"
  else
    echo "  ⚠️  Guard de Dependabot no encontrado"
  fi
fi

# ── Check 2: Verificar permissions block ─────────────────────────────────────
echo ""
echo "[2/4] Verificando bloque permissions del workflow..."

if [ -f "$WORKFLOW_FILE" ]; then
  PERMS=$(grep -A3 "^permissions:" "$WORKFLOW_FILE" | head -4)
  echo "  Permisos declarados:"
  echo "$PERMS" | sed 's/^/    /'
  echo ""

  if echo "$PERMS" | grep -q "contents: read"; then
    echo "  ✅ contents: read (mínimo privilegio)"
  else
    echo "  ⚠️  contents no está en read — verificar si es necesario más"
  fi

  if echo "$PERMS" | grep -q "pull-requests: write"; then
    echo "  ✅ pull-requests: write (necesario para comentar)"
    echo "  ℹ️  NOTA: pull-requests:write también permite aprobar PRs — ver D2/G2"
  fi

  # Verificar que no haya permisos excesivos
  if grep -q "actions: write\|contents: write\|id-token: write\|packages: write" "$WORKFLOW_FILE" 2>/dev/null; then
    echo "  ❌ Permisos excesivos detectados en el workflow"
    grep "write" "$WORKFLOW_FILE" | grep -v "pull-requests" | head -5
  else
    echo "  ✅ No se detectaron permisos excesivos"
  fi
fi

# ── Check 3: Via GitHub API (si hay token) ────────────────────────────────────
echo ""
echo "[3/4] Verificando configuración del repo via API..."

if [ "$API_CHECKS" = true ] && [ -n "$REPO" ]; then
  # Verificar configuración de fork workflows
  REPO_SETTINGS=$(curl -sL \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/actions/permissions/workflow" 2>/dev/null || echo "{}")

  if echo "$REPO_SETTINGS" | grep -q '"default_workflow_permissions"'; then
    DEFAULT_PERMS=$(echo "$REPO_SETTINGS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('default_workflow_permissions','unknown'))" 2>/dev/null || echo "unknown")
    CAN_APPROVE=$(echo "$REPO_SETTINGS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('can_approve_pull_request_reviews', 'unknown'))" 2>/dev/null || echo "unknown")
    echo "  Default workflow permissions: $DEFAULT_PERMS"
    echo "  Can approve PRs: $CAN_APPROVE"

    if [ "$DEFAULT_PERMS" = "read" ]; then
      echo "  ✅ Permisos default son 'read'"
    else
      echo "  ⚠️  Permisos default no son 'read' — revisar"
    fi
  else
    echo "  ⚠️  No se pudo obtener la configuración (verificar permisos del token)"
  fi
else
  echo "  ⏭️  Saltado (requiere GH_TOKEN y nombre del repo como argumento)"
  echo "     Uso: $0 owner/repo"
fi

# ── Check 4: Instrucciones para prueba manual ─────────────────────────────────
echo ""
echo "[4/4] Instrucciones para prueba manual de fork..."
echo ""
echo "  1. Crear un fork del repositorio objetivo en una cuenta secundaria"
echo "  2. Desde el fork, abrir un PR hacia el repo original"
echo "  3. Observar en Actions del repo ORIGINAL:"
echo "     → El job debe aparecer como 'skipped' (no 'queued' ni 'running')"
echo "     → Si aparece como 'waiting for approval', el guard funciona"
echo "     → Si corre directamente, el guard FALLÓ"
echo ""
echo "  4. Si el job corre desde un fork, verificar en el log si los secrets"
echo "     están disponibles:"
echo "     → KIRO_API_KEY debe aparecer como '***' (redactado por GitHub)"
echo "     → Si aparece el valor real, hay un problema de configuración grave"
echo ""
echo "  Configuración recomendada en Settings → Actions → General:"
echo "  ┌─────────────────────────────────────────────────────────────┐"
echo "  │ Fork pull request workflows:                                 │"
echo "  │   ● Require approval for all outside collaborators ← CORRECTO│"
echo "  │   ○ Run workflows from fork pull requests          ← PELIGROSO│"
echo "  └─────────────────────────────────────────────────────────────┘"
