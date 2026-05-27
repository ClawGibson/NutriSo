#!/usr/bin/env python3
"""
Post-procesa el output de Kiro CLI:
1. Strip de ANSI/VT100 escape codes (colores, cursor, borrado de línea)
2. Filtra warnings internos, logs de tool calls y metadata de sesión
3. Repara bloques de código sin backticks
4. Colapsa líneas vacías excesivas
Uso: python3 process_review_output.py <input_file> <output_file>
"""
import re
import sys

input_file  = sys.argv[1] if len(sys.argv) > 1 else "review_output_raw.txt"
output_file = sys.argv[2] if len(sys.argv) > 2 else "review_output.txt"

with open(input_file, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# ── 1. Strip ANSI / VT100 escape codes ───────────────────────────────────────
# Cubre: colores \x1b[...m, movimiento de cursor \x1b[...H, borrado \x1b[...J,
# hide/show cursor \x1b[?25l / \x1b[?25h, y variantes con ◆
content = re.sub(r'\x1b\[[0-9;?]*[a-zA-Z]', '', content)
content = re.sub(r'◆\[[0-9;?]*[a-zA-Z]', '', content)
# Residuos de secuencias de cursor que quedan como texto plano
content = re.sub(r'\[\\?25[lh]', '', content)

# ── 2. Filtrar líneas de ruido interno de Kiro ────────────────────────────────
NOISE_EXACT = {
    # Spinners de loading
    "⠋ Loading...", "⠙ Loading...", "⠹ Loading...", "⠸ Loading...",
    "⠼ Loading...", "⠴ Loading...", "⠦ Loading...", "⠧ Loading...",
    "⠇ Loading...", "⠏ Loading...",
}

NOISE_CONTAINS = [
    # Auth warnings
    "Try running `kiro-cli login`",
    "Try running kiro-cli login",
    "to re-authenticate",
    "kiro-cli profile",
    # MCP / config warnings
    "Both .kiro and .amazonq folders",
    "Failed to retrieve MCP settings",
    "MCP functionality disabled",
    # Tool call logs
    "Getting symbols from:",
    "Failed to get document symbols:",
    "Reading file:",
    "Successfully read",
    "Completed in",
    "(using tool:",
    "top_level=true",
    # Metadata de sesión
    "Credits:",          # cubre "• Credits:" y "▸ Credits:"
    "Time: ",
]

NOISE_STARTSWITH = [
    " ✓ ",   # confirmaciones de tool calls
    " - Completed",
    "▸ Credits",
    "• Credits",
]

lines = content.split('\n')
filtered = []
for line in lines:
    stripped = line.strip()

    # Líneas exactas de ruido
    if stripped in NOISE_EXACT:
        continue

    # Líneas que contienen patrones de ruido
    if any(noise in line for noise in NOISE_CONTAINS):
        continue

    # Líneas que empiezan con patrones de ruido
    if any(stripped.startswith(p) for p in NOISE_STARTSWITH):
        continue

    # Líneas que son solo secuencias de escape residuales o caracteres de control
    if re.match(r'^[\x00-\x1f\x7f◆\[\]0-9;?lhm\s]*$', stripped) and stripped:
        continue

    filtered.append(line)

lines = filtered

# ── 3. Reparar bloques de código sin backticks ────────────────────────────────
# El modelo a veces escribe:
#   Código:
#   jsx                  ← nombre del lenguaje sin backticks
#   console.log(x);      ← código
#
# O directamente:
#   jsx
#   <Component />

LANGS = {
    'jsx', 'tsx', 'js', 'ts', 'javascript', 'typescript',
    'css', 'scss', 'sass', 'html', 'bash', 'sh',
    'json', 'yaml', 'yml', 'py', 'python',
}

CODE_STARTERS = (
    '//', 'const ', 'let ', 'var ', 'import ', 'export ',
    'function ', 'return ', 'if ', 'else', 'try {', 'catch',
    'useEffect', 'useState', 'async ', 'await ', 'class ',
    'set', '<', '{', '.', 'export default',
    'console.', 'throw ', 'new ', 'switch', 'for ', 'while ',
    'type ', 'interface ', 'enum ', '@',
)

BLOCK_ENDERS = ('**', '### ', '## ', '# ', '---', '━', '- `', '- [')

result = []
i = 0
in_code_block = False

while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    # Rastrear bloques de código ya correctos (con backticks)
    if stripped.startswith('```'):
        in_code_block = not in_code_block
        result.append(line)
        i += 1
        continue

    # Detectar patrón roto: línea que es SOLO un nombre de lenguaje
    # Puede venir después de "Código:", "Fix:", "Fix sugerido:", o sola
    if not in_code_block and stripped.lower() in LANGS and i + 1 < len(lines):
        next_stripped = lines[i + 1].strip()
        # También considerar línea vacía seguida de código (modelo inserta blank line)
        if next_stripped == '' and i + 2 < len(lines):
            next_stripped = lines[i + 2].strip()
        looks_like_code = (
            next_stripped.startswith(CODE_STARTERS)
            or (next_stripped.startswith('<') and not next_stripped.startswith('</SYSTEM'))
            or next_stripped.startswith('//')
        )
        if looks_like_code:
            lang = stripped.lower()
            code_lines = []
            j = i + 1
            while j < len(lines):
                cl = lines[j]
                cs = cl.strip()
                # Terminar en separadores markdown
                if cs.startswith(BLOCK_ENDERS):
                    break
                # Terminar en línea vacía seguida de texto no-código
                if cs == '' and j + 1 < len(lines):
                    peek = lines[j + 1].strip()
                    if peek and not peek.startswith(CODE_STARTERS) and not peek == '':
                        break
                code_lines.append(cl)
                j += 1
            if code_lines:
                result.append(f'```{lang}')
                result.extend(code_lines)
                result.append('```')
                i = j
                continue

    result.append(line)
    i += 1

# ── 4. Colapsar más de 2 líneas vacías consecutivas ──────────────────────────
cleaned = re.sub(r'\n{3,}', '\n\n', '\n'.join(result))

# ── 5. Trim de líneas vacías al inicio y al final ────────────────────────────
cleaned = cleaned.strip()

# ── 6. Corregir títulos con blockquote: "> # Título" → "# Título" ────────────
cleaned = re.sub(r'^>\s*(#{1,6}\s)', r'\1', cleaned, flags=re.MULTILINE)

with open(output_file, "w", encoding="utf-8") as f:
    f.write(cleaned)

print(f"Output procesado: {len(cleaned)} bytes, {cleaned.count(chr(10))} líneas")
