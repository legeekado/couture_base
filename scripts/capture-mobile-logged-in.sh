#!/usr/bin/env bash
# Reprend les captures après l'écran login (sans reset des données).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/captures-interfaces/mobile"
ADB="${HOME}/Library/Android/sdk/platform-tools/adb"
PKG="sn.kalmy.kalmy"
ACTIVITY="${PKG}/.MainActivity"
DEVICE="${1:-emulator-5554}"

export PATH="${HOME}/Library/Android/sdk/platform-tools:${PATH}"
mkdir -p "$OUT"

shot() { sleep "$2"; "$ADB" -s "$DEVICE" exec-out screencap -p > "$OUT/$1"; echo "✓ mobile/$1"; }
tap() { "$ADB" -s "$DEVICE" shell input tap "$1" "$2"; }

"$ADB" -s "$DEVICE" shell am start -n "$ACTIVITY" >/dev/null
sleep 3
tap 980 120
sleep 2
tap 540 1020
sleep 18
shot "03-dashboard.png" 2
tap 135 1870
sleep 5
shot "03b-dashboard-tab.png" 1
tap 405 1870
sleep 5
shot "04-clients.png" 1
tap 675 1870
sleep 5
shot "05-commandes.png" 1
tap 945 1870
sleep 5
shot "06-profil.png" 1
tap 540 680
sleep 3
shot "07-parametres.png" 1
