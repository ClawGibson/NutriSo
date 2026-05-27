# Security Advanced — Vectores Específicos de Apps Móviles

## Table of Contents

- [Deep Links](#deep-links)
- [WebView](#webview)
- [Tokens de Sesión y Autenticación](#tokens-de-sesión-y-autenticación)
- [Permisos en Runtime](#permisos-en-runtime)
- [Certificate Pinning](#certificate-pinning)
- [Almacenamiento Seguro](#almacenamiento-seguro)

> Para PII, PCI, GDPR y OWASP Top 10 ver `references/sensitive-data.md`

---

## Deep Links

Los deep links son un vector de ataque frecuente — parámetros pueden ser manipulados por apps maliciosas.

### Checklist

- [ ] Todos los parámetros de `route.params` validados antes de usarse
- [ ] Validación con regex o schema (no solo `if (param)`)
- [ ] Parámetros numéricos parseados y validados como números
- [ ] Sin ejecutar acciones privilegiadas solo con parámetros de deep link (verificar sesión activa)
- [ ] Scheme de deep link registrado solo para el bundle ID correcto

### Severidad

| Caso | Severidad |
|------|-----------|
| Parámetro de deep link usado sin validación | 🔴 Crítico |
| Acción privilegiada disparada solo por deep link sin verificar sesión | 🔴 Crítico |
| Parámetro validado solo con truthy check (`if (pnr)`) | 🟡 Importante |

### Ejemplo

```typescript
// ❌ Sin validación
const { pnr, amount } = route.params;
fetchBooking(pnr);
processPayment(amount); // amount podría ser NaN, negativo, o un string malicioso

// ✅ Con validación
const rawPnr = route.params?.pnr;
const rawAmount = route.params?.amount;

const PNR_REGEX = /^[A-Z0-9]{6}$/;
if (!rawPnr || !PNR_REGEX.test(rawPnr)) {
  logSecurityEvent('invalid_deep_link_pnr', { raw: rawPnr });
  return;
}

const amount = Number(rawAmount);
if (!Number.isFinite(amount) || amount <= 0) return;

fetchBooking(rawPnr);
processPayment(amount);
```

---

## WebView

### Checklist

- [ ] `originWhitelist` restringido a dominios conocidos (no `['*']`)
- [ ] `onShouldStartLoadWithRequest` implementado para validar URLs antes de navegar
- [ ] `javaScriptEnabled={false}` si no se necesita JS
- [ ] Sin `injectedJavaScript` con contenido dinámico del usuario
- [ ] `source.uri` validado — no construir URL con input del usuario sin sanitizar
- [ ] `allowsInlineMediaPlayback` y `mediaPlaybackRequiresUserAction` configurados apropiadamente

### Severidad

| Caso | Severidad |
|------|-----------|
| `originWhitelist={['*']}` | 🔴 Crítico |
| URL de WebView construida con input del usuario sin validar | 🔴 Crítico |
| `injectedJavaScript` con contenido dinámico | 🔴 Crítico |
| Sin `onShouldStartLoadWithRequest` en WebView con navegación | 🟡 Importante |

### Ejemplo

```typescript
// ❌ Whitelist abierta + URL dinámica sin validar
<WebView
  originWhitelist={['*']}
  source={{ uri: `https://aeromexico.com/${userInput}` }}
/>

// ✅ Whitelist restringida + URL validada
const ALLOWED_DOMAINS = ['aeromexico.com', 'am.com.mx'];

const isAllowedUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
};

<WebView
  originWhitelist={['https://aeromexico.com', 'https://am.com.mx']}
  source={{ uri: validatedUrl }}
  onShouldStartLoadWithRequest={(request) => isAllowedUrl(request.url)}
/>
```

---

## Tokens de Sesión y Autenticación

### Checklist

- [ ] Tokens almacenados en Keychain (iOS) / Keystore (Android), no en AsyncStorage
- [ ] Tokens tienen tiempo de expiración verificado antes de usarlos
- [ ] Refresh token rotation implementado (nuevo refresh token en cada uso)
- [ ] Tokens invalidados al hacer logout (limpieza en Keychain + estado)
- [ ] Sin tokens en logs, analytics events o crash reports
- [ ] Sin tokens en URLs como query params (usar headers)

### Severidad

| Caso | Severidad |
|------|-----------|
| Token almacenado en AsyncStorage | 🔴 Crítico |
| Token en console.log o analytics | 🔴 Crítico |
| Token en URL como query param | 🔴 Crítico |
| Sin invalidación de token en logout | 🟡 Importante |
| Sin verificación de expiración antes de usar | 🟡 Importante |

### Ejemplo

```typescript
// ❌ Token en AsyncStorage
await AsyncStorage.setItem('auth_token', token);

// ❌ Token en log
console.log('Auth response:', response); // response contiene el token

// ✅ Token en Keychain
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('auth', token, {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
});

// ✅ Logout limpia todo
const handleLogout = async () => {
  await Keychain.resetGenericPassword();
  dispatch(clearAuthState());
  dispatch(apiSlice.util.resetApiState()); // limpia cache de RTK Query
};
```

---

## Permisos en Runtime

### Checklist

- [ ] Permisos solicitados en el momento en que el usuario entiende por qué los necesita (contextual)
- [ ] Manejo de los 3 estados: granted, denied, blocked
- [ ] Sin solicitar permisos en el arranque de la app sin contexto
- [ ] Permisos de ubicación usan `whenInUse` a menos que `always` sea estrictamente necesario
- [ ] Permisos declarados en `AndroidManifest.xml` e `Info.plist` con descripción clara

### Severidad

| Caso | Severidad |
|------|-----------|
| Permiso solicitado sin contexto al arrancar la app | 🟡 Importante |
| Sin manejo del estado `blocked` (usuario denegó permanentemente) | 🟡 Importante |
| Permiso `always` para ubicación sin justificación | 🟡 Importante |

### Ejemplo

```typescript
// ❌ Permiso al arrancar sin contexto
useEffect(() => {
  requestCameraPermission(); // ¿por qué necesita la cámara al abrir la app?
}, []);

// ✅ Permiso contextual con manejo de estados
const handleScanDocument = async () => {
  const result = await request(PERMISSIONS.IOS.CAMERA);

  switch (result) {
    case RESULTS.GRANTED:
      openCamera();
      break;
    case RESULTS.DENIED:
      showPermissionRationale(); // explica por qué se necesita
      break;
    case RESULTS.BLOCKED:
      showOpenSettingsDialog(); // guía al usuario a Configuración
      break;
  }
};
```

---

## Certificate Pinning

Para una app de aerolínea con datos de pago, la ausencia de certificate pinning es un riesgo.

### Qué verificar en el diff

- Si el PR modifica la configuración de red (`network_security_config.xml`, `Info.plist`, interceptors de Axios/Fetch)
- Si se agregan nuevos dominios de API sin pinning configurado
- Si se deshabilita o modifica el pinning existente

### Severidad

| Caso | Severidad |
|------|-----------|
| Pinning deshabilitado o removido sin justificación | 🔴 Crítico |
| Nuevo endpoint de pago sin pinning | 🟡 Importante |
| Modificación de `network_security_config.xml` | 🟡 Importante — revisar con detalle |

### Señales en el diff

```xml
<!-- ❌ Configuración que permite cualquier certificado -->
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" /> <!-- ❌ Permite certificados de usuario (MITM) -->
    </trust-anchors>
  </base-config>
</network-security-config>
```

---

## Almacenamiento Seguro

Resumen de qué va dónde:

| Dato | Almacenamiento Correcto | Prohibido |
|------|------------------------|-----------|
| Tokens de auth | Keychain / Keystore | AsyncStorage, Redux sin cifrar |
| Datos de tarjeta | No almacenar localmente | Cualquier storage local |
| PNR / datos de reserva | AsyncStorage (no sensible) | Logs, analytics |
| Preferencias de usuario | AsyncStorage | — |
| Biometría | APIs nativas (LocalAuthentication) | Implementación custom |
| Contraseñas | Keychain / Keystore | AsyncStorage, Redux |

### Checklist

- [ ] Sin datos de auth en Redux state sin cifrar
- [ ] Sin datos de tarjeta en ningún storage local
- [ ] Keychain entries con `accessible: WHEN_UNLOCKED` (no `ALWAYS`)
- [ ] Datos de sesión limpiados al cerrar sesión
