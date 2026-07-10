#!/usr/bin/env bash
# Parcours mobile : nouvelle commande + fiche de mesure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/captures-interfaces/mobile"
ADB="${HOME}/Library/Android/sdk/platform-tools/adb"
PKG="sn.kalmy.kalmy"
ACTIVITY="${PKG}/.MainActivity"
DEVICE="${1:-emulator-5554}"

export PATH="${HOME}/Library/Android/sdk/platform-tools:${PATH}"

CMD_OUT="$OUT/nouvelle-commande"
MES_OUT="$OUT/fiche-mesure"
mkdir -p "$CMD_OUT" "$MES_OUT"

shot() {
  sleep "${1:-1}"
  "$ADB" -s "$DEVICE" exec-out screencap -p > "$2"
  echo "✓ mobile/$(basename "$(dirname "$2")")/$(basename "$2")"
}

tap() {
  "$ADB" -s "$DEVICE" shell input tap "$1" "$2"
}

type_text() {
  local text="$1"
  # adb input text : ASCII uniquement, espaces via %s
  "$ADB" -s "$DEVICE" shell input text "$text" 2>/dev/null || true
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

ensure_logged_in() {
  "$ADB" -s "$DEVICE" wait-for-device
  "$ADB" -s "$DEVICE" shell am force-stop "$PKG" || true
  sleep 1
  "$ADB" -s "$DEVICE" shell am start -n "$ACTIVITY" >/dev/null
  sleep 12

  tap_match 'text="Allow"' || tap_match 'text="Autoriser"' || tap 540 1215
  sleep 2

  if wait_ui "Salaam" 30; then
    wait_gone "CircularProgressIndicator|ProgressBar" 25 || true
    return 0
  fi

  if wait_ui "Passer|Vos mesures" 15; then
    tap_match 'text="Passer"' || tap 925 158
    sleep 2
  fi

  wait_ui "Se connecter|ousmane@" 25 || true
  tap_match 'text="Se connecter"' || tap 540 1638
  wait_ui "Salaam" 45
  tap_match 'text="Allow"' || tap_match 'text="Autoriser"' || true
  sleep 2
  wait_gone "CircularProgressIndicator|ProgressBar" 25 || true
}

select_client_via_liste() {
  tap_match 'text="Liste"' || tap 810 520
  sleep 2
  wait_ui "Choisir un client|Awa|Aïssatou|Ibrahima" 25 || true
  tap_match 'content-desc="Awa Diop"' || tap_match 'text="Awa Diop"' || tap 540 900
  sleep 2
  wait_gone "Choisir un client" 10 || true
}

parcours_nouvelle_commande() {
  echo ""
  echo "→ Parcours nouvelle commande"

  tap_match 'content-desc="Commandes"' || tap 706 1757
  wait_ui "Nouvelle" 25
  wait_gone "CircularProgressIndicator|ProgressBar" 15 || true
  shot 1 "$CMD_OUT/01-liste-commandes.png"

  tap_match 'text="Nouvelle"' || tap 930 430
  wait_ui "Nouvelle commande" 25 || true
  shot 1 "$CMD_OUT/02-formulaire-vide.png"

  tap_match 'text="Liste"' || tap 810 520
  sleep 2
  wait_ui "Choisir un client" 20 || true
  shot 1 "$CMD_OUT/03-selection-client.png"

  tap_match 'content-desc="Awa Diop"' || tap_match 'text="Awa Diop"' || tap 540 900
  sleep 2
  wait_ui "Point de vente|Vêtements" 20 || true
  shot 1 "$CMD_OUT/04-client-selectionne.png"

  scroll_down
  sleep 1
  tap_match 'text="Libellé"' || tap 540 900
  sleep 0.5
  type_text "Robebazin"
  tap 540 400
  sleep 1

  scroll_down
  sleep 1
  tap 540 700
  sleep 0.5
  type_text "Bazin%set%sbroderie"
  sleep 1

  scroll_down
  sleep 1
  tap 540 650
  sleep 0.5
  type_text "85000"
  sleep 1
  shot 1 "$CMD_OUT/05-vetements-montant.png"

  scroll_down
  sleep 1
  tap_match 'text="Choisir une date"' || tap 540 1100
  sleep 2
  tap_match 'text="OK"' || tap 900 1700
  sleep 1

  "$ADB" -s "$DEVICE" shell input swipe 540 1400 540 300 500
  sleep 1
  wait_ui "Créer la commande" 15 || true
  shot 1 "$CMD_OUT/06-formulaire-complet.png"

  tap 50 120
  sleep 2
  wait_ui "Nouvelle" 20 || true
}

parcours_fiche_mesure() {
  echo ""
  echo "→ Parcours fiche de mesure"

  tap_match 'content-desc="Atelier"' || tap 135 1757
  wait_ui "Salaam|Fiches" 25 || true
  wait_gone "CircularProgressIndicator|ProgressBar" 15 || true
  shot 1 "$MES_OUT/01-dashboard-fab.png"

  tap 540 1720
  sleep 2
  wait_ui "Nouvelles mesures" 25
  shot 1 "$MES_OUT/02-formulaire-vide.png"

  tap_match 'text="Liste"' || tap 810 520
  sleep 4
  shot 1 "$MES_OUT/03-selection-client.png"

  tap 540 820
  sleep 2
  "$ADB" -s "$DEVICE" shell input tap 540 480
  sleep 1
  wait_ui "Mesures \\(cm\\)|Boubou|Robe|Épaules" 20 || true
  shot 1 "$MES_OUT/04-client-selectionne.png"

  tap_match 'text="Robe"' || tap 900 620
  sleep 1
  shot 1 "$MES_OUT/05-type-vetement.png"

  tap 200 1120
  sleep 0.5
  type_text "42"
  tap 540 1120
  sleep 0.5
  type_text "88"
  "$ADB" -s "$DEVICE" shell input tap 540 200
  sleep 1
  shot 1 "$MES_OUT/06-saisie-mesures.png"

  scroll_down
  sleep 1
  wait_ui "Enregistrer la fiche" 15 || true
  shot 1 "$MES_OUT/07-formulaire-pret.png"

  tap 50 120
  sleep 2
}

ensure_logged_in
if [ "${2:-all}" = "fiche-mesure" ]; then
  parcours_fiche_mesure
elif [ "${2:-all}" = "nouvelle-commande" ]; then
  parcours_nouvelle_commande
else
  parcours_nouvelle_commande
  parcours_fiche_mesure
fi

echo ""
echo "Parcours mobile OK → $OUT"
