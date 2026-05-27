#!/usr/bin/env python3
"""
Post-procesa el output de Kiro CLI:
1. Strip de ANSI escape codes
2. Filtra warnings internos de Kiro
3. Repara bloques de código sin backticks
4. Colapsa líneas vacías excesivas
Uso: python3 process_review_output.py <input_file> <output_file>
"""
import re
import sys

input_file = sys.argv[1] if len(sys.argv) > 1 else "review_output_raw.txt"
output_file = sys.argv[2] if len(sys.argv) > 2 else "review_output.txt"

with open(input_file, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# ── 1. Strip ANSI escape codes ────────────────────────────────────────────────
content = re.sub(r'\x1b\[[0-9;]*[mGKHFJA-Z]', '', content)
content = re.sub(r'◆\[[0-9;]*[mGKHFJA-Z]', '', content)

# ── 2. Filtrar líneas de warnings internos de Kiro ───────────────────────────
KIRO_NOISE = [
    "Both .kiro and .amazonq folders",
    "Failed to retrieve MCP settings",
    "Try running kiro-cli",
    "• Credits:",
    "MCP functionality disabled",
]
lines = content.split('\n')
lines = [l for l in lines if not any(noise in l for noise in KIRO_NOISE)]
# Filtrar líneas que son solo secuencias de escape residuales
lines = [l for l in lines if not re.match(r'^[◆\s\[\]0-9;mGKHF]+$', l)]

# ── 3. Reparar bloques de código sin backticks ────────────────────────────────
LANGS = {
    'jsx', 'tsx', 'js', 'ts', 'javascript', 'typescript',
    'css', 'scss', 'sass', 'html', 'bash', 'sh',
    'json', 'yaml', 'yml', 'py', 'python',
}

CODE_STARTERS = (
    '//', 'const ', 'let ', 'var ', 'import ', 'export ',
    'function ', 'return ', 'if ', 'set', '<', '{', 'set',
    'useEffect', 'useState', 'async ', 'await ', 'class ',
)

BLOCK_ENDERS = ('**', '### ', '## ', '# ', '---', '━', '- `', '- [')

result = []
i = 0
in_code_block = False

while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    # Rastrear bloques de código ya correctos
    if stripped.startswith('```'):
        in_code_block = not in_code_block
        result.append(line)
        i += 1
        continue

    # Detectar patrón roto: línea que es SOLO un nombre de lenguaje
    if (not in_code_block
            and stripped.lower() in LANGS
            and i + 1 < len(lines)):
        next_stripped = lines[i + 1].strip()
        looks_like_code = (
            next_stripped.startswith(CODE_STARTERS)
            or (next_stripped.startswith('<') and not next_stripped.startswith('</SYSTEM'))
        )
        if looks_like_code:
            lang = stripped.lower()
            code_lines = []
            j = i + 1
            while j < len(lines):
                cl = lines[j]
                cs = cl.strip()
                if cs.startswith(BLOCK_ENDERS):
                    break
                if cs == '' and j + 1 < len(lines):
                    peek = lines[j + 1].strip()
                    if peek and not peek.startswith(CODE_STARTERS):
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
cleaned = cleaned.strip()

with open(output_file, "w", encoding="utf-8") as f:
    f.write(cleaned)

print(f"Output procesado: {len(cleaned)} bytes, {cleaned.count(chr(10))} líneas")
