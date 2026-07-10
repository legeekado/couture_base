#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/captures-interfaces/mobile"
ADB="${HOME}/Library/Android/sdk/platform-tools/adb"
PKG="sn.kalmy.kalmy"
ACTIVITY="${PKG}/.MainActivity"
DEVICE="${1:-emulator-5554}"

export PATH="${HOME}/Library/Android/sdk/platform-tools:${PATH}"

mkdir -p "$OUT"

shot() {
  local name="$1"
  sleep "$2"
  ensure_app_foreground
  "$ADB" -s "$DEVICE" exec-out screencap -p > "$OUT/$name"
  echo "✓ mobile/$name"
}

tap() {
  "$ADB" -s "$DEVICE" shell input tap "$1" "$2"
}

ensure_app_foreground() {
  local focus
  focus=$("$ADB" -s "$DEVICE" shell dumpsys window 2>/dev/null | grep -m1 "mCurrentFocus" || true)
  if [[ "$focus" == *"launcher"* ]] || [[ "$focus" == *"NexusLauncher"* ]]; then
    "$ADB" -s "$DEVICE" shell am start -n "$ACTIVITY" >/dev/null
    sleep 4
  fi
  "$ADB" -s "$DEVICE" shell cmd statusbar collapse >/dev/null 2>&1 || true
}

"$ADB" -s "$DEVICE" wait-for-device
for _ in $(seq 1 60); do
  boot=$("$ADB" -s "$DEVICE" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  [ "$boot" = "1" ] && break
  sleep 2
done

"$ADB" -s "$DEVICE" shell settings put global bluetooth_on 0 >/dev/null 2>&1 || true
"$ADB" -s "$DEVICE" shell am force-stop "$PKG" || true
"$ADB" -s "$DEVICE" shell pm clear "$PKG" >/dev/null
sleep 2
"$ADB" -s "$DEVICE" shell am start -n "$ACTIVITY" >/dev/null

sleep 8
ensure_app_foreground
shot "01-onboarding.png" 1

tap 980 120
sleep 3
ensure_app_foreground
shot "02-login.png" 1

tap 540 1020
sleep 18
shot "03-dashboard.png" 3

tap 135 1870
sleep 5
ensure_app_foreground
shot "03b-dashboard-tab.png" 1

tap 405 1870
sleep 5
ensure_app_foreground
shot "04-clients.png" 1

tap 675 1870
sleep 5
ensure_app_foreground
shot "05-commandes.png" 1

tap 945 1870
sleep 5
ensure_app_foreground
shot "06-profil.png" 1

tap 540 680
sleep 3
ensure_app_foreground
shot "07-parametres.png" 1

echo ""
echo "Captures mobile enregistrées dans $OUT"
