#!/usr/bin/env bash
# Refuse an import that sits after code.
#
# TypeScript hoists imports and vitest runs ESM, so a misplaced import passes
# typecheck, passes every test, and then throws "Cannot access '…' before
# initialization" the first time the compiled CommonJS runs — which is in
# production, in a container, at boot. Nothing else in the toolchain catches it.
set -euo pipefail

cd "$(dirname "$0")/.."

python3 - <<'PY'
import pathlib
import sys

roots = [pathlib.Path('apps/api/src'), pathlib.Path('packages/domain/src'), pathlib.Path('apps/web/src')]
offences = []

for root in roots:
    if not root.exists():
        continue

    for path in root.rglob('*.ts*'):
        if path.name.endswith('.d.ts'):
            continue

        in_import = False
        in_block_comment = False
        first_code_line = None

        for index, line in enumerate(path.read_text().split('\n'), start=1):
            stripped = line.strip()

            if in_import:
                if stripped.startswith('} from'):
                    in_import = False
                continue

            if in_block_comment:
                if '*/' in stripped:
                    in_block_comment = False
                continue

            if line.startswith('import '):
                if first_code_line is not None:
                    offences.append(f'{path}:{index}: import after code (line {first_code_line})')
                    break
                if 'from' not in stripped:
                    in_import = True
                continue

            if stripped.startswith('/*'):
                if '*/' not in stripped:
                    in_block_comment = True
                continue

            if stripped == '' or stripped.startswith(('//', '*', "'use client'", '"use client"')):
                continue

            if first_code_line is None:
                first_code_line = index

if offences:
    print('Imports must precede all code; the compiled CommonJS requires in source order:')
    for offence in offences:
        print(f'  {offence}')
    sys.exit(1)

print('Import placement: clean.')
PY
