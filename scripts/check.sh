#!/usr/bin/env bash
set -euo pipefail
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"
./install.sh --check
bash -n install.sh restore.sh
for source in extension/*.js scripts/activate-live.js; do
  node --input-type=module --check < "$source"
done
node tests/lifecycle.cjs
node tests/screen-center.cjs
node tests/button-align.cjs
if [[ -x "$HOME/.venvs/ai/bin/python" ]]; then
  "$HOME/.venvs/ai/bin/python" tests/installer.py
else
  "${PANDESKTOP_PYTHON:-python3}" tests/installer.py
fi
