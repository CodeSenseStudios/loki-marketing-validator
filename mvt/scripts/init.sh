#!/usr/bin/env bash
set -euo pipefail
node --experimental-strip-types ./src/cli.ts init "$@"
