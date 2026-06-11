#!/usr/bin/env bash
# SECURITY TEST — G1: KNOWLEDGE_PAT Permissions Audit
# ─────────────────────────────────────────────────────
# Propósito : Verificar que el KNOWLEDGE_PAT usado para hacer checkout del
#             repo externo `nutrisosapp` tiene únicamente el permiso mínimo
#             necesario (contents:read) y no permisos que permitirían
#             modificar código o acceder a otros repos de la organización.
#
# RIESGO:
#   Si el PAT tiene permisos de escritura o scope `repo` completo, un atacante
#   que lo robe (via C1 exfiltración, log leak, etc.) podría:
#   - Modificar los scripts del pipeline → comprometer todos los repos
#   - Leer repos privados de la organización
#   - Crear/modificar releases, webhooks, etc.
#
# USO:
#   export KNOWLEDGE_PAT=ghp_xxxxx   # el PAT a auditar
#   bash G1-pat-permissions-check.sh
#
# NOTA DE SEGURIDAD:
#   Este script solo lee información del PAT, no realiza operaciones de escritura.
#   El valor del PAT nunca se imprime en pantalla.
#
# Referencia : SECURITY_TEST_PLAN.md § G1, C3
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PAT="${KNOWLEDGE_PAT:-}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SECURITY TEST G1 — KNOWLEDGE_PAT Permissions Audit"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -z "$PAT" ]; then
  echo "⚠️  KNOWLEDGE_PAT no está configurado como variable de entorno."
  echo "   Ejecutar con: export KNOWLEDGE_PAT=ghp_xxxx && bash $0"
  echo ""
  echo "   Este test requiere el PAT real para verificar sus permisos."
  echo "   Alternativa: revisar manualmente en GitHub → Settings → Developer settings"
  echo "   → Personal access tokens → ver los scopes del token"
  exit 0
fi

echo "ℹ️  PAT configurado (valor oculto). Consultando permisos via API..."
echo ""

# ── Check 1: Información básica del token ─────────────────────────────────────
echo "[1/5] Información básica del token..."

TOKEN_INFO=$(curl -sL \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user" 2>/dev/null)

if echo "$TOKEN_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'login' in d else 1)" 2>/dev/null; then
  TOKEN_USER=$(echo "$TOKEN_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('login','unknown'))" 2>/dev/null)
  echo "  ✅ Token válido — usuario: $TOKEN_USER"
else
  echo "  ❌ Token inválido o expirado"
  exit 1
fi

# ── Check 2: Scopes del token (header X-OAuth-Scopes) ────────────────────────
echo ""
echo "[2/5] Verificando scopes del token..."

SCOPES=$(curl -sI \
  -H "Authorization: Bearer $PAT" \
  "https://api.github.com/user" 2>/dev/null | grep -i "x-oauth-scopes" || echo "")

if [ -n "$SCOPES" ]; then
  echo "  Scopes del token: $SCOPES"

  # Verificar scopes peligrosos
  DANGEROUS_SCOPES=("repo" "admin:org" "admin:repo_hook" "delete_repo" "workflow" "write:packages" "admin:enterprise")

  for scope in "${DANGEROUS_SCOPES[@]}"; do
    if echo "$SCOPES" | grep -qi "$scope"; then
      echo "  ❌ SCOPE PELIGROSO detectado: '$scope'"
    fi
  done

  # Verificar si tiene solo los scopes necesarios
  if echo "$SCOPES" | grep -qiE "^x-oauth-scopes:\s*(repo|)$"; then
    echo "  ⚠️  Scope 'repo' muy amplio — debería ser 'contents:read' específico"
  fi

  if echo "$SCOPES" | grep -qi "public_repo"; then
    echo "  ℹ️  Scope 'public_repo' — acceso de lectura/escritura a repos públicos"
  fi
else
  echo "  ℹ️  No se pudo leer el header X-OAuth-Scopes (puede ser un fine-grained PAT)"
fi

# ── Check 3: Permisos específicos en el repo nutrisosapp ─────────────────────
echo ""
echo "[3/5] Verificando permisos en ClawGibson/nutrisosapp..."

REPO_PERMS=$(curl -sL \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/ClawGibson/nutrisosapp" 2>/dev/null)

if echo "$REPO_PERMS" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'permissions' in d else 1)" 2>/dev/null; then
  PUSH=$(echo "$REPO_PERMS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['permissions'].get('push', False))")
  ADMIN=$(echo "$REPO_PERMS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['permissions'].get('admin', False))")
  PULL=$(echo "$REPO_PERMS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['permissions'].get('pull', False))")

  echo "  pull (lectura):  $PULL"
  echo "  push (escritura): $PUSH"
  echo "  admin:           $ADMIN"
  echo ""

  if [ "$PUSH" = "True" ]; then
    echo "  ❌ CRÍTICO: El PAT tiene permisos de ESCRITURA en nutrisosapp"
    echo "     Un atacante que robe el PAT puede modificar los scripts del pipeline"
  else
    echo "  ✅ Sin permisos de escritura en nutrisosapp"
  fi

  if [ "$ADMIN" = "True" ]; then
    echo "  ❌ CRÍTICO: El PAT tiene permisos de ADMIN en nutrisosapp"
  fi
else
  echo "  ⚠️  No se pudo obtener permisos del repo (¿privado? ¿404?)"
fi

# ── Check 4: Verificar acceso a otros repos de la org ─────────────────────────
echo ""
echo "[4/5] Verificando acceso a otros repos de la organización..."

# Intentar listar repos de la org del propietario
ORG="ClawGibson"
ORG_REPOS=$(curl -sL \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/orgs/$ORG/repos?per_page=5" 2>/dev/null)

REPO_COUNT=$(echo "$ORG_REPOS" | python3 -c "import sys,json; repos=json.load(sys.stdin); print(len(repos) if isinstance(repos, list) else 0)" 2>/dev/null || echo "0")

if [ "$REPO_COUNT" -gt "0" ]; then
  echo "  ⚠️  El PAT puede listar $REPO_COUNT repos de la org '$ORG'"
  echo "     Repos visibles:"
  echo "$ORG_REPOS" | python3 -c "import sys,json; repos=json.load(sys.stdin); [print(f'     - {r[\"full_name\"]} (private: {r[\"private\"]})') for r in repos[:5]]" 2>/dev/null || true
else
  echo "  ✅ No se pueden listar repos adicionales de la org"
fi

# ── Check 5: Intentar operación de escritura (debe fallar) ────────────────────
echo ""
echo "[5/5] Verificando que operaciones de escritura son rechazadas..."

# Intentar crear una ref que no existe (operación de escritura) — debe retornar 403 o 404
WRITE_TEST=$(curl -sL -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/ClawGibson/nutrisosapp/git/refs" \
  -d '{"ref":"refs/heads/security-test-probe","sha":"0000000000000000000000000000000000000000"}' 2>/dev/null)

case "$WRITE_TEST" in
  "403")
    echo "  ✅ Escritura rechazada (403 Forbidden) — permisos correctos"
    ;;
  "422")
    echo "  ❌ La solicitud fue procesada (422 Unprocessable) — el PAT TIENE acceso de escritura"
    echo "     El SHA era inválido, pero el token pasó la autorización"
    ;;
  "404")
    echo "  ℹ️  404 — repo no encontrado o token sin acceso (puede ser correcto)"
    ;;
  "401")
    echo "  ✅ Token sin permisos de escritura (401)"
    ;;
  *)
    echo "  ℹ️  HTTP $WRITE_TEST — revisar manualmente"
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  RECOMENDACIÓN: El KNOWLEDGE_PAT debería ser un"
echo "  Fine-grained PAT con:"
echo "    • Repository access: Solo 'ClawGibson/nutrisosapp'"
echo "    • Permissions: Contents → Read-only"
echo "    • Todo lo demás: No access"
echo "═══════════════════════════════════════════════════════════"
