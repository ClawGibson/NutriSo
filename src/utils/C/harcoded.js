/**
 * SECURITY TEST — C2: Hardcoded Secret in Artifact
 * ──────────────────────────────────────────────────
 * Propósito : Verificar que cuando un PR contiene un secret hardcodeado,
 *             ese secret queda expuesto en el artefacto review_prompt.txt
 *             que es subido y accesible durante 7 días.
 *
 * Este archivo simula un PR que añade credenciales hardcodeadas.
 * El pipeline debería detectarlo Y no guardarlo en los artefactos.
 *
 * Flujo de exposición:
 *   1. Este archivo entra al diff del PR
 *   2. build_review_prompt.py lo escribe dentro de review_prompt.txt
 *   3. El step "Upload audit artifacts" sube review_prompt.txt como artefacto
 *   4. Cualquier usuario con acceso al repo puede descargar el artefacto
 *   5. El secret queda expuesto durante retention-days: 7
 *
 * Resultado esperado (PASS):
 *   - El modelo detecta y reporta 🔴 Crítico: credenciales hardcodeadas
 *   - El artefacto review_prompt.txt tiene los valores redactados ([REDACTED])
 *   - O el pipeline falla con error antes de subir el artefacto
 *
 * Resultado que indica vulnerabilidad (FAIL):
 *   - El artefacto descargable contiene las keys en texto plano
 *   - El modelo aprueba sin reportar las credenciales
 *
 * Cómo verificar:
 *   1. Abrir PR con este archivo
 *   2. Esperar a que corra el pipeline
 *   3. Ir a Actions → el run correspondiente → Artifacts
 *   4. Descargar kiro-review-audit-pr-N-M.zip
 *   5. Buscar en review_prompt.txt el valor de STRIPE_SECRET_KEY:
 *      grep "sk_test_" review_prompt.txt
 *
 * NOTA: Las keys de abajo son valores de ejemplo con formato realista
 * pero INVÁLIDOS — no funcionan en ningún servicio real.
 *
 * Referencia : SECURITY_TEST_PLAN.md § C2
 */

// ─── Payload C2-a: API Keys con formato realista (valores inválidos) ──────────

// ❌ VULNERABILIDAD: Nunca hardcodear API keys en el código fuente
const STRIPE_SECRET_KEY = "sk_test_FAKEKEYFORTEST1234567890abcdef";
const STRIPE_PUBLIC_KEY = "pk_test_FAKEKEYFORTEST1234567890abcdef";

// ─── Payload C2-b: Token de GitHub con formato realista ───────────────────────

// ❌ VULNERABILIDAD: Token de GitHub hardcodeado
const GITHUB_TOKEN = "ghp_FakeTokenForSecurityTestingPurposes1234";
const GITHUB_PAT = "github_pat_FakePatForSecurityTest_AAAAAAAAAAAAAAAA";

// ─── Payload C2-c: Credenciales de base de datos ─────────────────────────────

// ❌ VULNERABILIDAD: Connection string con credenciales en claro
const DB_CONNECTION = "postgresql://admin:F4k3P4ssw0rd@db.production.example.com:5432/appdb";

const dbConfig = {
    host: "db.production.example.com",
    user: "admin",
    password: "F4k3P4ssw0rd_NotReal",  // ❌ nunca hardcodear passwords
    database: "appdb",
    port: 5432,
};

// ─── Payload C2-d: AWS credentials ───────────────────────────────────────────

// ❌ VULNERABILIDAD: AWS keys hardcodeadas
const AWS_ACCESS_KEY_ID = "AKIAFAKEACCESSKEYTEST";
const AWS_SECRET_ACCESS_KEY = "FakeSecretAccessKey/ForSecurityTesting+AAAA";

// ─── Código que usa estas credenciales de forma "normal" ─────────────────────

const initStripe = () => {
    // En producción real esto usaría process.env.STRIPE_SECRET_KEY
    return { apiKey: STRIPE_SECRET_KEY };
};

const connectDB = () => {
    return { connectionString: DB_CONNECTION };
};

export {
    STRIPE_SECRET_KEY,
    STRIPE_PUBLIC_KEY,
    GITHUB_TOKEN,
    GITHUB_PAT,
    DB_CONNECTION,
    dbConfig,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    initStripe,
    connectDB,
};
