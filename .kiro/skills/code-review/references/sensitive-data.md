# Manejo de Datos Sensibles en Code Review

Reglas de seguridad y datos sensibles a validar durante la revisión de código. Basado en la política de seguridad del workspace (`core-rules.md` + `manual/security-details.md`).

## Table of Contents

- [Anonimización de PII](#anonimización-de-pii)
- [Etiquetado de Seguridad](#etiquetado-de-seguridad)
- [Datos en Tests y Mocks](#datos-en-tests-y-mocks)
- [PCI DSS](#pci-dss)
- [GDPR](#gdpr)
- [OWASP Top 10](#owasp-top-10)
- [Checklist de Seguridad](#checklist-de-seguridad)

---

## Anonimización de PII

Verificar que NO existan datos personales reales en ningún archivo revisado:

| Tipo de Dato | Patrón a Buscar | Sustitución |
|--------------|----------------|-------------|
| Nombres completos | Nombres propios en strings | `[NOMBRE_COMPLETO]` |
| Correos electrónicos | `*@*.com`, `*@*.mx` | `[EMAIL]` |
| Teléfonos | `+52`, `+1`, patrones numéricos de 10+ dígitos | `[TELEFONO]` |
| CURP / RFC | Patrón alfanumérico de 13-18 caracteres | `[IDENTIFICADOR_FISCAL]` |
| Números de tarjeta | 16 dígitos, patrones `4xxx`, `5xxx` | `[NUMERO_TARJETA]` |
| CVV / NIP | 3-4 dígitos en contexto de pago | `[CVV]` / `[NIP]` |
| Pasaportes | Patrón letra + 8 dígitos | `[PASAPORTE]` |
| PNR / Reservaciones | 6 caracteres alfanuméricos en contexto de vuelo | `[PNR]` |
| Números de boleto | Patrón `139-*` o similar | `[NUMERO_BOLETO]` |
| Viajero frecuente | Patrón `AM*` con dígitos | `[NUMERO_VIAJERO]` |
| IPs de producción | Direcciones IP en código o configs | `[IP_ADDRESS]` |
| Tokens / API Keys | Strings largos en configs o código | `[API_KEY]` / `[TOKEN]` |
| Contraseñas | Strings en contexto de auth | `[PASSWORD]` |
| Account IDs | IDs de Jira, servicios externos | `[ACCOUNT_ID]` |

### Comandos de Detección

```bash
# Buscar posibles emails
git diff | grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

# Buscar posibles números de tarjeta (16 dígitos)
git diff | grep -E "\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b"

# Buscar posibles tokens/keys
git diff | grep -iE "(api_key|secret|token|password|credential)\s*[:=]"

# Buscar IPs hardcodeadas
git diff | grep -E "\b[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b"
```

---

## Etiquetado de Seguridad

Verificar que archivos que procesan datos sensibles incluyan el comentario de cabecera:

```typescript
/**
 * @security [PII] [PCI]
 * @description Este módulo procesa datos personales y de pago.
 * @dataClassification Confidencial
 * @reviewRequired Security Champion
 */
```

Tags válidos:
- `[SensitiveData]` — Dato sensible genérico
- `[PII]` — Datos personales identificables
- `[PCI]` — Datos de tarjetas de pago
- `[PHI]` — Información de salud protegida
- `[CREDENTIALS]` — Credenciales y secretos
- `[FINANCIAL]` — Datos financieros

Si un archivo modificado procesa datos sensibles y NO tiene etiquetado, reportar como issue importante.

---

## Datos en Tests y Mocks

Verificar que archivos en `__tests__/`, `__mocks__/`, `*.test.ts`, `*.spec.ts`, fixtures y storybook NO contengan datos reales:

```typescript
// ✅ CORRECTO — Datos ficticios claramente identificables
const mockPassenger = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@example.com',
  phone: '+00 00 0000 0000',
  passport: 'XX0000000',
  frequentFlyer: 'AM000000000',
  pnr: 'XXXXXX',
};

// ❌ PROHIBIDO — Datos que parecen o son reales
const mockPassenger = {
  firstName: 'María',
  lastName: 'González López',
  email: 'maria.gonzalez@gmail.com',
  phone: '+52 55 9876 5432',
};
```

Reportar como violación CRÍTICA si se encuentran datos reales en tests o mocks.

---

## PCI DSS

Validar en código que maneje pagos o tarjetas:

- [ ] NUNCA almacenar PAN completo en logs, archivos temporales o código
- [ ] NUNCA almacenar CVV/CVC, PIN o datos de banda magnética
- [ ] Enmascaramiento aplicado: solo últimos 4 dígitos visibles (`**** **** **** 1234`)
- [ ] Datos de tarjeta en tránsito cifrados (TLS 1.2+)
- [ ] No almacenar datos de tarjeta en estado plano (sin cifrar)
- [ ] Datos sensibles en secure storage (Keychain/Keystore), NO en AsyncStorage

---

## GDPR

Validar en código que procese datos personales:

- [ ] Principio de minimización: solo datos estrictamente necesarios
- [ ] Mecanismos de consentimiento explícito implementados si aplica
- [ ] Derecho de eliminación: código permite borrado completo de datos personales
- [ ] No transferir datos a terceros sin validar cumplimiento
- [ ] Datos personales no persisten más allá de lo necesario

---

## OWASP Top 10

Validar contra vulnerabilidades comunes:

| # | Vulnerabilidad | Qué Buscar en el Diff |
|---|---------------|----------------------|
| A01 | Broken Access Control | Endpoints sin verificación de autorización |
| A02 | Cryptographic Failures | MD5, SHA1 para hashing de contraseñas, datos sin cifrar |
| A03 | Injection | Queries sin parametrizar, inputs sin sanitizar |
| A05 | Security Misconfiguration | Configs por defecto, debug habilitado en producción |
| A06 | Vulnerable Components | Dependencias con CVEs conocidos |
| A07 | Authentication Failures | Tokens sin expiración, auth débil |
| A09 | Logging Failures | Datos sensibles en console.log o logger |
| A10 | SSRF | URLs dinámicas sin validación en requests del servidor |

---

## Checklist de Seguridad

Aplicar en CADA code review:

```
□ No contiene datos personales reales (PII)
□ No contiene datos de tarjetas de pago (PCI)
□ No contiene credenciales, tokens o API keys hardcodeados
□ No contiene URLs o IPs de ambientes productivos
□ Los datos de ejemplo/test son claramente ficticios
□ Los logs no registran información sensible
□ El etiquetado de seguridad (@security) es correcto en módulos sensibles
□ Inputs del usuario están sanitizados/validados
□ Datos sensibles usan secure storage, no AsyncStorage
□ No hay console.log con datos de usuario o pago
□ Variables de entorno para credenciales, no strings en código
□ Archivos .env no están incluidos en el diff/commit
```

Si algún punto falla, reportar como:
- 🔴 Crítico: PII real, PCI, credenciales expuestas, datos reales en tests
- 🟡 Importante: Falta etiquetado, logs con datos parciales, falta sanitización
