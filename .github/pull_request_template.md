## 📝 Descripción

<!-- Descripción clara y concisa de los cambios.  ¿Qué problema resuelve este PR? -->

## 🎯 Tipo de Cambio

<!-- Marca con 'x' lo que aplique -->

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva feature (cambio que agrega funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causa que funcionalidad existente no funcione como antes)
- [ ] 📝 Documentación
- [ ] 🎨 Refactoring (sin cambios de funcionalidad)
- [ ] ⚡ Mejora de performance
- [ ] ✅ Tests
- [ ] 🔧 Configuración/Build

## 🔗 Issues Relacionados

<!-- Link a issues de Jira/GitHub -->

Closes #
Relates to #

## 🧪 ¿Cómo se ha testeado?

<!-- Describe las pruebas que ejecutaste para verificar tus cambios -->

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests E2E
- [ ] Tests manuales

**Instrucciones para reproducir:**

1.
2.
3.

## 📸 Screenshots/Videos

<!-- Si aplica, agrega screenshots o videos demostrando los cambios -->

## ✅ Checklist

### Code Quality

- [ ] Mi código sigue los estándares del proyecto (`. amazonq/rules.yaml`)
- [ ] He realizado self-review de mi código
- [ ] He comentado áreas complejas de mi código
- [ ] He actualizado documentación relevante
- [ ] Mis cambios no generan nuevos warnings
- [ ] No hay código comentado (dead code)

### Testing

- [ ] He agregado tests que prueban mis cambios
- [ ] Tests nuevos y existentes pasan localmente
- [ ] Coverage de tests >80% en código nuevo
- [ ] He testeado edge cases
- [ ] He testeado error conditions

### Security

- [ ] No hay secrets hardcoded
- [ ] He validado todos los inputs de usuario
- [ ] No hay vulnerabilidades de SQL injection
- [ ] No hay vulnerabilidades XSS
- [ ] He ejecutado security scan (`q scan`)

### Performance

- [ ] No hay N+1 queries
- [ ] He considerado implicaciones de performance
- [ ] He agregado índices de DB si es necesario
- [ ] He implementado caching donde corresponde

### Database

- [ ] He creado/actualizado migraciones
- [ ] Migraciones son reversibles
- [ ] He considerado impacto en datos existentes
- [ ] Migraciones testeadas localmente

## 📦 Dependencias

<!-- ¿Este PR agrega/actualiza/elimina dependencias? -->

- [ ] No hay cambios en dependencias
- [ ] He actualizado `requirements.txt` / `package.json`
- [ ] He verificado licencias de nuevas dependencias
- [ ] He documentado por qué se agregó cada dependencia

## 🚀 Deploy Notes

<!-- Información importante para deployment -->

**Requiere:**

- [ ] Migraciones de DB
- [ ] Variables de entorno nuevas
- [ ] Cambios en configuración
- [ ] Coordinación con otros equipos
- [ ] Comunicación a usuarios

**Variables de entorno nuevas:**
