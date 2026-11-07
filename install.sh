#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 OpenGodAI contributors
set -euo pipefail
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [[ -n ${PANDESKTOP_PYTHON:-} ]]; then
  py=$PANDESKTOP_PYTHON
elif [[ -x "$HOME/.venvs/ai/bin/python" ]]; then
  py=$HOME/.venvs/ai/bin/python
else
  py=python3
fi
exec "$py" "$root/scripts/configure.py" "$@"
