#!/usr/bin/env bash
# SECURITY TEST — G2: GITHUB_TOKEN — ¿Puede Aprobar PRs?
# ────────────────────────────────────────────────────────
# Propósito : Verificar si el GITHUB_TOKEN del workflow (con pull-requests:write)
#             tiene capacidad para APROBAR PRs formalmente, no solo comentar.
#
# RIESGO:
#   Si el token puede aprobar PRs, un pipeline comprometido (via supply chain
#   o prompt injection que ejecute código) podría auto-aprobar PRs maliciosos,
#   bypaseando políticas de branch protection que requieren N aprobaciones.
#
# PERMISOS DECLARADOS EN EL WORKFLOW:
#   permissions:
#     contents: read
#     pull-requests: write    ← este scope incluye reviews
#
# SEGÚN DOCUMENTACIÓN DE GITHUB:
#   pull-requests: write incluye:
#     - Crear/editar comments ✅ (intencional)
#     - Crear reviews (APPROVE, REQUEST_CHANGES, COMMENT)
#     - Pero los tokens de Actions NO pueden aprobar sus propios PRs
#       (protección adicional de GitHub)
#
# ESTE TEST VERIFICA:
#   1. ¿El endpoint createReview con APPROVE es callable con el token?
#   2. ¿La branch protection bloquea aprobaciones de bots?
#   3. ¿Está configurado "Dismiss stale reviews" para invalidar aprobaciones?
#
# USO:
#   Este test debe ejecutarse DESDE el workflow mismo (como un step adicional
#   de prueba) porque necesita el GITHUB_TOKEN real del runner.
#   Ver la sección "Cómo probar" abajo.
#
# Referencia : SECURITY_TEST_PLAN.md § G2
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Estos valores se pasan como argumentos cuando se corre desde un workflow
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO="${1:-}"         # owner/repo
PR_NUMBER="${2:-}"    # número del PR a intentar aprobar

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SECURITY TEST G2 — GITHUB_TOKEN PR Approval Capability"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN no configurado."
  echo "   Este test debe correrse desde un GitHub Actions workflow step."
  echo ""
  echo "   Agregar temporalmente este step al workflow para probar:"
  echo ""
  cat << 'YAML_SNIPPET'
  - name: "[SECURITY TEST] Verify GITHUB_TOKEN cannot approve PRs"
    if: github.event.pull_request.number != ''
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: |
      PR_NUM="${{ github.event.pull_request.number }}"
      REPO="${{ github.repository }}"

      echo "Intentando aprobar PR #$PR_NUM con GITHUB_TOKEN..."

      HTTP_CODE=$(curl -sL -o /tmp/approve_response.json -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/$REPO/pulls/$PR_NUM/reviews" \
        -d '{"event":"APPROVE","body":"[SECURITY TEST] Auto-approve attempt"}')

      echo "HTTP Response: $HTTP_CODE"
      cat /tmp/approve_response.json

      if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "❌ CRÍTICO: El GITHUB_TOKEN PUDO aprobar el PR"
        echo "   Esto indica que branch protection no bloquea aprobaciones de bots"
        exit 1
      elif [ "$HTTP_CODE" = "403" ]; then
        echo "✅ Aprobación rechazada (403) — GITHUB_TOKEN no puede aprobar PRs"
      elif [ "$HTTP_CODE" = "422" ]; then
        echo "✅ Aprobación rechazada (422) — posiblemente misma cuenta no puede auto-aprobar"
      else
        echo "ℹ️  HTTP $HTTP_CODE — revisar /tmp/approve_response.json"
      fi
YAML_SNIPPET
  exit 0
fi

# ── Si se tiene el token, ejecutar el check directamente ─────────────────────

if [ -z "$REPO" ] || [ -z "$PR_NUMBER" ]; then
  echo "Uso: GITHUB_TOKEN=xxx $0 owner/repo PR_NUMBER"
  exit 1
fi

echo "[1/3] Intentando crear review de tipo APPROVE en PR #$PR_NUMBER..."

HTTP_CODE=$(curl -sL -o /tmp/g2_approve_response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/reviews" \
  -d '{"event":"APPROVE","body":"[SECURITY TEST G2] Auto-approve probe — delete if appears"}')

echo "  HTTP Response: $HTTP_CODE"

case "$HTTP_CODE" in
  "200"|"201")
    echo "  ❌ CRÍTICO: El token PUDO aprobar el PR"
    REVIEW_ID=$(python3 -c "import json; d=json.load(open('/tmp/g2_approve_response.json')); print(d.get('id',''))" 2>/dev/null || echo "")

    # Intentar revocar la aprobación inmediatamente
    if [ -n "$REVIEW_ID" ]; then
      echo "  🔄 Intentando revocar la aprobación (review ID: $REVIEW_ID)..."
      curl -sL -X PUT \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/reviews/$REVIEW_ID/dismissals" \
        -d '{"message":"[SECURITY TEST] Revoking test approval"}' > /dev/null
      echo "  🔄 Aprobación revocada"
    fi
    ;;
  "403")
    echo "  ✅ Aprobación rechazada (403 Forbidden)"
    cat /tmp/g2_approve_response.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Mensaje:', d.get('message',''))" 2>/dev/null || true
    ;;
  "422")
    echo "  ✅ Aprobación rechazada (422 Unprocessable)"
    cat /tmp/g2_approve_response.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Mensaje:', d.get('message',''))" 2>/dev/null || true
    ;;
  *)
    echo "  ℹ️  HTTP $HTTP_CODE — revisar /tmp/g2_approve_response.json"
    cat /tmp/g2_approve_response.json 2>/dev/null || true
    ;;
esac

# ── Check 2: Verificar branch protection ─────────────────────────────────────
echo ""
echo "[2/3] Verificando branch protection rules..."

BRANCH_PROTECTION=$(curl -sL \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/branches/main/protection" 2>/dev/null)

if echo "$BRANCH_PROTECTION" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'required_pull_request_reviews' in d else 1)" 2>/dev/null; then
  REQUIRED_APPROVALS=$(echo "$BRANCH_PROTECTION" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['required_pull_request_reviews'].get('required_approving_review_count', 0))" 2>/dev/null || echo "0")
  DISMISS_STALE=$(echo "$BRANCH_PROTECTION" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['required_pull_request_reviews'].get('dismiss_stale_reviews', False))" 2>/dev/null || echo "False")
  BLOCK_ACTORS=$(echo "$BRANCH_PROTECTION" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['required_pull_request_reviews'].get('require_code_owner_reviews', False))" 2>/dev/null || echo "False")

  echo "  Aprobaciones requeridas: $REQUIRED_APPROVALS"
  echo "  Dismiss stale reviews: $DISMISS_STALE"
  echo "  Require code owner: $BLOCK_ACTORS"

  [ "$REQUIRED_APPROVALS" -gt 0 ] && echo "  ✅ Se requieren aprobaciones" || echo "  ⚠️  No se requieren aprobaciones para hacer merge"
  [ "$DISMISS_STALE" = "True" ] && echo "  ✅ Stale reviews son invalidados" || echo "  ⚠️  Los reviews no se invalidan al hacer nuevo push"
else
  echo "  ⚠️  No hay branch protection configurada en 'main'"
  echo "  ❌ Sin branch protection, una aprobación del bot haría merge posible sin revisión humana"
fi

# ── Check 3: Resumen de riesgo ────────────────────────────────────────────────
echo ""
echo "[3/3] Resumen de riesgo..."
echo ""
echo "  Escenario de ataque completo:"
echo "  1. Pipeline comprometido (via B1 supply chain)"
echo "  2. Script malicioso ejecuta createReview con APPROVE"
echo "  3. Si branch protection requiere 1 aprobación → bot cumple el requisito"
echo "  4. Merge posible sin revisión humana"
echo ""
echo "  Mitigación recomendada:"
echo "  - Branch protection: require_last_push_approval: true"
echo "  - Branch protection: dismiss_stale_reviews: true"
echo "  - Agregar CODEOWNERS con revisores humanos obligatorios"
echo "  - Configurar 'Restrict reviews from bots' si el plan lo permite"
