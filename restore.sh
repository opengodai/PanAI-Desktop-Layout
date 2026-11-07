#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 OpenGodAI contributors
set -euo pipefail
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$root/install.sh" --restore "${1:-latest}"
