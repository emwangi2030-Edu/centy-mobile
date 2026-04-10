#!/usr/bin/env bash
# Source this file:  source /opt/centy-mobile/scripts/vps-load-expo-token.sh
# Loads EXPO_TOKEN from env or /root/.config/centy/expo_token (single line, chmod 600).

TOKEN_FILE="${EXPO_TOKEN_FILE:-/root/.config/centy/expo_token}"

if [ -n "${EXPO_TOKEN:-}" ]; then
  return 0 2>/dev/null || exit 0
fi

if [ ! -f "$TOKEN_FILE" ]; then
  echo "Missing EXPO_TOKEN and token file: $TOKEN_FILE" >&2
  echo "Create it: printf '%s' 'YOUR_TOKEN' > $TOKEN_FILE && chmod 600 $TOKEN_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

EXPO_TOKEN="$(tr -d ' \n\r\t' < "$TOKEN_FILE")"
export EXPO_TOKEN

if [ -z "$EXPO_TOKEN" ]; then
  echo "Token file is empty: $TOKEN_FILE" >&2
  return 1 2>/dev/null || exit 1
fi
