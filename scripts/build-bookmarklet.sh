#!/usr/bin/env bash
# Build and minify the bookmarklet from src/save-exhibition.js into dist/bookmarklet.min.js
# Optional usage: ./scripts/build-bookmarklet.sh [OPTIONAL_WEBHOOK_URL]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_FILE="$ROOT_DIR/bookmarklet/src/save-exhibition.js"
DIST_DIR="$ROOT_DIR/bookmarklet/dist"
DIST_FILE="$DIST_DIR/bookmarklet.min.js"

mkdir -p "$DIST_DIR"

CUSTOM_URL="${1:-}"

# Minify JavaScript using Node.js or Python fallback
if command -v node >/dev/null 2>&1; then
  node - "$SRC_FILE" "$DIST_FILE" "$CUSTOM_URL" << 'EOF'
const fs = require('fs');
const [,, srcPath, distPath, customUrl] = process.argv;

let code = fs.readFileSync(srcPath, 'utf8');

if (customUrl && customUrl.trim() !== '') {
  code = code.replace(/const WEBHOOK_URL = '[^']*';/, `const WEBHOOK_URL = '${customUrl.trim()}';`);
}

// Strip block and single-line comments (preserving http:// and https:// URLs)
code = code.replace(/\/\*[\s\S]*?\*\//g, '');
code = code.replace(/(?<!:)\/\/.*$/gm, '');

// Collapse multiple whitespaces and trim lines
let minified = code
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0)
  .join('');

// Prepend javascript: if not present
if (!minified.startsWith('javascript:')) {
  minified = 'javascript:' + minified;
}

fs.writeFileSync(distPath, minified + '\n', 'utf8');
console.log('✓ Successfully built minified bookmarklet at: ' + distPath);
console.log('\n--- Ready-to-use Bookmarklet Code ---\n');
console.log(minified);
console.log('\n--------------------------------------\n');
EOF
elif command -v python3 >/dev/null 2>&1; then
  python3 - "$SRC_FILE" "$DIST_FILE" "$CUSTOM_URL" << 'EOF'
import sys, re

src_path, dist_path = sys.argv[1], sys.argv[2]
custom_url = sys.argv[3] if len(sys.argv) > 3 else ""

with open(src_path, 'r', encoding='utf-8') as f:
    code = f.read()

if custom_url and custom_url.strip():
    code = re.sub(r"const WEBHOOK_URL = '[^']*';", f"const WEBHOOK_URL = '{custom_url.strip()}';", code)

# Strip comments (preserving http:// and https:// URLs)
code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
code = re.sub(r'(?<!:)//.*', '', code)

# Collapse whitespace
lines = [l.strip() for l in code.splitlines() if l.strip()]
minified = "".join(lines)

if not minified.startswith('javascript:'):
    minified = 'javascript:' + minified

with open(dist_path, 'w', encoding='utf-8') as f:
    f.write(minified + '\n')

print(f"✓ Successfully built minified bookmarklet at: {dist_path}")
print("\n--- Ready-to-use Bookmarklet Code ---\n")
print(minified)
print("\n--------------------------------------\n")
EOF
else
  echo "Error: Node.js or Python3 is required to build the bookmarklet."
  exit 1
fi
