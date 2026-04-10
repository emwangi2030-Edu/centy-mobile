#!/usr/bin/env bash
# One-time: link this repo to an EAS project (creates or uses existing ID).
# Requires EXPO_TOKEN or /root/.config/centy/expo_token — see vps-load-expo-token.sh
#
# Usage:
#   ./scripts/vps-eas-link-project.sh
#   EAS_PROJECT_ID='uuid-here' ./scripts/vps-eas-link-project.sh   # link existing project

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# shellcheck source=/dev/null
source "$REPO_DIR/scripts/vps-load-expo-token.sh"

if [ -n "${EAS_PROJECT_ID:-}" ]; then
  npx eas init --non-interactive --force --id "$EAS_PROJECT_ID"
else
  # --force creates the EAS project on expo.dev when @owner/slug does not exist yet
  npx eas init --non-interactive --force
fi

npx eas build:configure -p android

echo "Done. Commit app.json (and any EAS changes) to git so other environments match."
