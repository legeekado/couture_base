#!/usr/bin/env bash
# Captures mobile avec attente du contenu réel (pas splash / loaders).
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
  sleep "$1"
  "$ADB" -s "$DEVICE" exec-out screencap -p > "$2"
  echo "✓ mobile/$(basename "$2")"
}

tap() {
  "$ADB" -s "$DEVICE" shell input tap "$1" "$2"
}

dump_ui() {
  "$ADB" -s "$DEVICE" shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
  "$ADB" -s "$DEVICE" shell cat /sdcard/ui.xml 2>/dev/null || true
}

wait_ui() {
  local pattern="$1"
  local max="${2:-45}"
  for _ in $(seq 1 "$max"); do
    if dump_ui | rg -q "$pattern"; then
      sleep 1
      return 0
    fi
    sleep 1
  done
  echo "⚠ timeout attente UI: $pattern" >&2
  return 1
}

wait_gone() {
  local pattern="$1"
  local max="${2:-30}"
  for _ in $(seq 1 "$max"); do
    if ! dump_ui | rg -q "$pattern"; then
      sleep 1
      return 0
    fi
    sleep 1
  done
  return 1
}

bounds_from_line() {
  local line="$1"
  echo "$line" | rg -o 'bounds="\\[[0-9]+,[0-9]+\\]\\[[0-9]+,[0-9]+\\]"' | head -1 | rg -o '[0-9]+' | tr '\n' ' '
}

bounds_center() {
  local pattern="$1"
  local line
  line=$(dump_ui | tr '>' '\n' | rg "$pattern" -m1 || true)
  if [ -z "$line" ]; then
    return 1
  fi
  local x1 y1 x2 y2
  read -r x1 y1 x2 y2 <<< "$(bounds_from_line "$line")"
  if [ -z "${x1:-}" ]; then
    return 1
  fi
  echo $(( (x1 + x2) / 2 )) $(( (y1 + y2) / 2 ))
}

tap_match() {
  local pattern="$1"
  local coords
  coords=$(bounds_center "$pattern") || return 1
  tap $coords
}

scroll_down() {
  "$ADB" -s "$DEVICE" shell input swipe 540 1500 540 700 450
}

"$ADB" -s "$DEVICE" wait-for-device
"$ADB" -s "$DEVICE" shell settings put global bluetooth_on 0 >/dev/null 2>&1 || true
"$ADB" -s "$DEVICE" shell am force-stop "$PKG" || true
"$ADB" -s "$DEVICE" shell pm clear "$PKG" >/dev/null
sleep 1
"$ADB" -s "$DEVICE" shell am start -n "$ACTIVITY" >/dev/null

sleep 8
wait_ui "Vos mesures" 25 || true
shot 1 "$OUT/01-onboarding.png"

tap_match 'text="Passer"' || tap 925 158
sleep 2
wait_ui "ousmane@ateliermedina|vous@atelier|Connexion|Se connecter" 25
wait_gone "CircularProgressIndicator|ProgressBar" 5 || true
shot 1 "$OUT/02-login.png"

tap_match 'text="Se connecter"' || tap 540 1638
wait_ui "Salaam" 45
wait_gone "CircularProgressIndicator|ProgressBar" 20 || true
tap_match 'text="Allow"' || tap_match 'text="Autoriser"' || true
sleep 2
shot 2 "$OUT/03-dashboard.png"

tap_match 'content-desc="Clients"' || tap 374 1757
wait_ui "Mes clients" 25
wait_ui "\\+221" 20 || true
wait_gone "CircularProgressIndicator|ProgressBar" 15 || true
shot 2 "$OUT/04-clients.png"

tap_match 'content-desc="Commandes"' || tap 706 1757
wait_ui "Nouvelle" 25
wait_ui "En cours|Essayage|Livr" 20 || true
wait_gone "CircularProgressIndicator|ProgressBar" 15 || true
shot 2 "$OUT/05-commandes.png"

tap_match 'content-desc="Profil"' || tap 927 1757
wait_ui "Modifier mon profil" 25
shot 1 "$OUT/06-profil.png"

"$ADB" -s "$DEVICE" shell input swipe 540 1500 540 500 550
sleep 1
"$ADB" -s "$DEVICE" shell input swipe 540 1500 540 500 550
sleep 1
tap_match 'content-desc="Paramètres' || tap 540 1270
wait_ui "Langue|Mon compte|Compte" 25 || true
wait_gone "CircularProgressIndicator|ProgressBar" 10 || true
shot 1 "$OUT/07-parametres.png"

echo ""
echo "Captures mobile OK → $OUT"
