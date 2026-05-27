# HTML Template para Reporte de Code Review

Usar este template para generar el archivo HTML al finalizar cada revisión.

## Instrucciones

1. Nombre del archivo: `code-review-[YYYYMMDD-HHmmss].html`
2. Guardar en raíz del proyecto o `.kiro/reviews/`
3. Reemplazar todos los placeholders `[...]` con datos reales del análisis
4. Usar clase CSS `approved`, `warning` o `rejected` en el span de veredicto
5. Si una sección está vacía, usar el div `empty-section`

## Template

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Review - Aeroméxico</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px;
        }
        .container {
            max-width: 1200px; margin: 0 auto; background: white;
            border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
            color: white; padding: 30px; text-align: center;
        }
        .header h1 { font-size: 2em; margin-bottom: 10px; }
        .header .date { opacity: 0.9; font-size: 0.9em; }
        .content { padding: 30px; }
        .summary {
            background: #f8f9fa; border-left: 4px solid #0066cc;
            padding: 20px; margin-bottom: 30px; border-radius: 4px;
        }
        .summary h2 { color: #0066cc; margin-bottom: 15px; }
        .summary-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px; margin-top: 15px;
        }
        .summary-item {
            background: white; padding: 15px; border-radius: 4px; border: 1px solid #e0e0e0;
        }
        .summary-item strong { display: block; color: #666; font-size: 0.85em; margin-bottom: 5px; }
        .summary-item .value { font-size: 1.5em; font-weight: bold; color: #333; }
        .verdict {
            display: inline-block; padding: 8px 16px; border-radius: 20px;
            font-weight: bold; font-size: 1.1em;
        }
        .verdict.approved { background: #d4edda; color: #155724; }
        .verdict.warning { background: #fff3cd; color: #856404; }
        .verdict.rejected { background: #f8d7da; color: #721c24; }
        .section {
            margin-bottom: 30px; border: 1px solid #e0e0e0;
            border-radius: 4px; overflow: hidden;
        }
        .section-header {
            padding: 15px 20px; font-weight: bold; font-size: 1.2em;
            display: flex; align-items: center; gap: 10px;
        }
        .section-header .icon { font-size: 1.3em; }
        .section.critical .section-header { background: #f8d7da; color: #721c24; }
        .section.important .section-header { background: #fff3cd; color: #856404; }
        .section.suggestion .section-header { background: #d1ecf1; color: #0c5460; }
        .section.positive .section-header { background: #d4edda; color: #155724; }
        .section.recommendations .section-header { background: #e7f3ff; color: #004085; }
        .section-content { padding: 20px; background: white; }
        .issue {
            margin-bottom: 20px; padding: 15px; background: #f8f9fa;
            border-radius: 4px; border-left: 3px solid #ccc;
        }
        .issue-file {
            font-family: 'Courier New', monospace; font-size: 0.9em;
            color: #0066cc; font-weight: bold; margin-bottom: 8px;
        }
        .issue-description { margin-bottom: 10px; }
        .issue-code {
            background: #2d2d2d; color: #f8f8f2; padding: 12px; border-radius: 4px;
            font-family: 'Courier New', monospace; font-size: 0.85em;
            overflow-x: auto; margin: 10px 0;
        }
        .issue-suggestion {
            background: #e7f3ff; padding: 10px; border-radius: 4px;
            margin-top: 10px; font-size: 0.9em;
        }
        .issue-suggestion strong { color: #004085; }
        ul { margin-left: 20px; margin-top: 10px; }
        li { margin-bottom: 8px; }
        .footer {
            background: #f8f9fa; padding: 20px; text-align: center;
            color: #666; font-size: 0.9em; border-top: 1px solid #e0e0e0;
        }
        .empty-section { color: #999; font-style: italic; padding: 20px; text-align: center; }
        @media print { body { background: white; padding: 0; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Code Review - Aeroméxico</h1>
            <div class="date">[FECHA Y HORA]</div>
        </div>
        <div class="content">
            <div class="summary">
                <h2>📊 Resumen Ejecutivo</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <strong>Archivos Revisados</strong>
                        <div class="value">[X]</div>
                    </div>
                    <div class="summary-item">
                        <strong>Líneas Modificadas</strong>
                        <div class="value">+[X] / -[X]</div>
                    </div>
                    <div class="summary-item">
                        <strong>Issues Críticos</strong>
                        <div class="value" style="color: #dc3545;">[X]</div>
                    </div>
                    <div class="summary-item">
                        <strong>Issues Importantes</strong>
                        <div class="value" style="color: #ffc107;">[X]</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <strong>Veredicto:</strong>
                    <span class="verdict [approved|warning|rejected]">[VEREDICTO]</span>
                </div>
            </div>

            <div class="section critical">
                <div class="section-header"><span class="icon">🔴</span><span>Crítico (debe corregirse)</span></div>
                <div class="section-content">[CONTENIDO O MENSAJE DE VACÍO]</div>
            </div>

            <div class="section important">
                <div class="section-header"><span class="icon">🟡</span><span>Importante (debería corregirse)</span></div>
                <div class="section-content">[CONTENIDO O MENSAJE DE VACÍO]</div>
            </div>

            <div class="section suggestion">
                <div class="section-header"><span class="icon">🟢</span><span>Sugerencias (nice-to-have)</span></div>
                <div class="section-content">[CONTENIDO O MENSAJE DE VACÍO]</div>
            </div>

            <div class="section positive">
                <div class="section-header"><span class="icon">✅</span><span>Aspectos Positivos</span></div>
                <div class="section-content">[CONTENIDO O MENSAJE DE VACÍO]</div>
            </div>

            <div class="section recommendations">
                <div class="section-header"><span class="icon">📋</span><span>Recomendaciones</span></div>
                <div class="section-content">[CONTENIDO O MENSAJE DE VACÍO]</div>
            </div>
        </div>
        <div class="footer">
            <p>Generado por Kiro - Code Review Skill v1.0</p>
            <p>Aeroméxico Mobile App - React Native + TypeScript</p>
        </div>
    </div>
</body>
</html>
```

## Formato de Issue Individual

Para cada hallazgo dentro de una sección, usar:

```html
<div class="issue">
    <div class="issue-file">📄 ruta/del/archivo.tsx</div>
    <div class="issue-description">Descripción del problema encontrado</div>
    <div class="issue-code">// Código problemático aquí</div>
    <div class="issue-suggestion">
        <strong>💡 Sugerencia:</strong> Descripción de cómo corregirlo
    </div>
</div>
```

## Sección Vacía

```html
<div class="empty-section">✓ No se encontraron issues en esta categoría</div>
```
