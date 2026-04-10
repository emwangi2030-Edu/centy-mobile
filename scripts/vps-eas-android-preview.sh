#!/usr/bin/env bash
# Pull latest code, install deps, queue EAS Android preview (APK) on Expo cloud.
# Requires EXPO_TOKEN or /root/.config/centy/expo_token — see vps-load-expo-token.sh
#
# Usage:
#   ./scripts/vps-eas-android-preview.sh
#   ./scripts/vps-eas-android-preview.sh --wait
#   SKIP_GIT_PULL=1 ./scripts/vps-eas-android-preview.sh
#
# Keystore setup: the first Android build must create a keystore; that fails with
# --non-interactive. This script skips --non-interactive when stdout is a TTY
# (normal interactive SSH), so you can run it once from: ssh -t root@VPS
# Automation without a TTY gets --non-interactive automatically.
# Force: EAS_NONINTERACTIVE=1 always adds --non-interactive; EAS_INTERACTIVE=1 never adds it.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# shellcheck source=/dev/null
source "$REPO_DIR/scripts/vps-load-expo-token.sh"

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
fi

npm ci

BUILD_ARGS=(-p android --profile preview)
use_noninteractive=
if [ "${EAS_INTERACTIVE:-0}" = "1" ]; then
  use_noninteractive=0
elif [ "${EAS_NONINTERACTIVE:-0}" = "1" ]; then
  use_noninteractive=1
elif [ -t 1 ]; then
  use_noninteractive=0
else
  use_noninteractive=1
fi
if [ "$use_noninteractive" = "1" ]; then
  BUILD_ARGS+=(--non-interactive)
fi
npx eas build "${BUILD_ARGS[@]}" "$@"
