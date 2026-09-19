#!/usr/bin/env bash
# Barrel files (an index.ts that re-exports a folder) are forbidden here.
# They hide the real dependency graph, defeat tree-shaking, and turn one import
# into a load of everything the barrel touches.
set -euo pipefail

barrels=$(fd --type f '^index\.(ts|tsx)$' packages apps --exclude node_modules --exclude dist || true)

if [ -n "$barrels" ]; then
  echo "Barrel files are not allowed. Import the module directly instead:"
  echo "$barrels" | sed 's/^/  /'
  exit 1
fi
