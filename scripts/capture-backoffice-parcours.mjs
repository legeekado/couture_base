#!/usr/bin/env node
/**
 * Parcours backoffice : changer statut commande + désactiver atelier.
 *
 * Prérequis : backend :8000, backoffice prod :3010
 * Usage: node scripts/capture-backoffice-parcours.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "captures-interfaces");
const BACKOFFICE_BASE =
  process.env.BACKOFFICE_URL ?? "http://127.0.0.1:3010";

async function resolveBackofficeBase() {
  for (const base of [BACKOFFICE_BASE, "http://127.0.0.1:3000"]) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return base;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "Backoffice inaccessible. Lancez : cd backoffice && PORT=3010 npm run start",
  );
}

async function waitNoSpinners(page, timeout = 90000) {
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector("main.dashboard-main") ?? document.body;
        const spinners = root.querySelectorAll(
          ".kalmy-spinner, .animate-spin.rounded-full",
        );
        return (
          spinners.length === 0 ||
          [...spinners].every((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return (
              style.display === "none" ||
              style.visibility === "hidden" ||
              rect.width === 0 ||
              rect.height === 0
            );
          })
        );
      },
      { timeout },
    )
    .catch(() => {});
}

async function apiLogin(context, email, password) {
  const response = await context.request.post(
    "http://127.0.0.1:8000/api/auth/login",
    {
      data: { email, password, device: "backoffice" },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok()) {
    throw new Error(`Login API failed (${email}): ${response.status()}`);
  }
  return response.json();
}

async function injectSession(page, base, { token, user }) {
  await page.goto(`${base}/`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("kalmy_token", token);
      localStorage.setItem("kalmy_user", JSON.stringify(user));
    },
    { token, user },
  );
}

async function screenshot(page, relativePath) {
  const path = join(outDir, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path });
  console.log(`✓ ${relativePath}`);
}

async function captureParcoursStatutCommande(page, context, base) {
  const dir = "backoffice/changer-statut-commande";
  mkdirSync(join(outDir, dir), { recursive: true });

  const body = await apiLogin(context, "ousmane@ateliermedina.sn", "password");
  await injectSession(page, base, body);

  await page.goto(`${base}/dashboard/commandes`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await waitNoSpinners(page);
  await page.waitForSelector("tbody tr.list-row-animate", {
    state: "visible",
    timeout: 60000,
  });
  await screenshot(page, `${dir}/01-liste-commandes.png`);

  const firstRow = page.locator("tbody tr.list-row-animate").first();
  await firstRow.locator(".action-menu-trigger").click();
  await page.waitForSelector('[role="menu"]', { state: "visible" });
  await screenshot(page, `${dir}/02-menu-actions.png`);

  await page.getByRole("menuitem", { name: "Changer le statut" }).click();
  await page.waitForSelector('[role="dialog"] h2', { state: "visible" });
  await waitNoSpinners(page);
  await page.waitForFunction(
    () => {
      const modal = document.querySelector('[role="dialog"]');
      return modal && !modal.querySelector(".kalmy-spinner");
    },
    { timeout: 30000 },
  );
  await screenshot(page, `${dir}/03-modal-statut.png`);

  const targetStatut = page
    .locator('[role="dialog"] button.rounded-full')
    .filter({ hasText: /^En cours$|^Essayage$/ })
    .first();
  await targetStatut.click();
  await page.waitForTimeout(400);
  await screenshot(page, `${dir}/04-statut-selectionne.png`);

  await page
    .locator('[role="dialog"]')
    .getByRole("button", { name: "Enregistrer" })
    .click();
  await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 30000 });
  await waitNoSpinners(page);
  await page.waitForTimeout(800);
  await screenshot(page, `${dir}/05-liste-apres-enregistrement.png`);

  const refLink = firstRow.locator("td.font-bold a").first();
  if ((await refLink.count()) > 0) {
    await refLink.click();
    await page.waitForURL(/\/dashboard\/commandes\/\d+/, { timeout: 30000 });
    await waitNoSpinners(page);
    await page.waitForSelector(".detail-page .detail-hero h1", {
      state: "visible",
      timeout: 30000,
    });
    await screenshot(page, `${dir}/06-detail-timeline.png`);
  }
}

async function captureParcoursDesactiverAtelier(page, context, base) {
  const dir = "backoffice/desactiver-atelier";
  mkdirSync(join(outDir, dir), { recursive: true });

  const body = await apiLogin(context, "admin@kalmy.sn", "password");
  await injectSession(page, base, body);

  await page.goto(`${base}/dashboard/ateliers`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await waitNoSpinners(page);
  await page.waitForSelector(".list-card-animate", {
    state: "visible",
    timeout: 60000,
  });
  await screenshot(page, `${dir}/01-liste-ateliers.png`);

  const actifCard = page
    .locator(".list-card-animate")
    .filter({ hasText: /Couture Élégance/i })
    .first();
  const card = (await actifCard.count()) > 0
    ? actifCard
    : page.locator(".list-card-animate").first();

  await card.locator(".action-menu-trigger").click();
  await page.waitForSelector('[role="menu"]', { state: "visible" });
  const desactiverItem = page.getByRole("menuitem", { name: "Désactiver" });
  if ((await desactiverItem.count()) === 0) {
    await page.keyboard.press("Escape");
    await card.locator(".action-menu-trigger").click();
    await page.waitForSelector('[role="menu"]', { state: "visible" });
  }
  await screenshot(page, `${dir}/02-menu-desactiver.png`);

  await page.getByRole("menuitem", { name: "Désactiver" }).click();
  await page.waitForSelector(".confirm-dialog--danger", {
    state: "visible",
    timeout: 15000,
  });
  await page.waitForSelector("#confirm-message", { state: "visible" });
  await screenshot(page, `${dir}/03-confirmation-desactiver.png`);

  await page.locator(".confirm-btn--confirm.confirm-btn--danger").click();
  await page.waitForSelector(".confirm-overlay", { state: "hidden", timeout: 30000 });
  await waitNoSpinners(page);
  await page.waitForTimeout(1000);
  await screenshot(page, `${dir}/04-apres-desactivation.png`);

  const suspendedCard = page
    .locator(".list-card-animate")
    .filter({ hasText: /Suspendu/i })
    .first();
  if ((await suspendedCard.count()) > 0) {
    await suspendedCard.locator(".action-menu-trigger").click();
    await page.getByRole("menuitem", { name: "Voir le détail" }).click();
    await page.waitForURL(/\/dashboard\/ateliers\/\d+/, { timeout: 30000 });
    await waitNoSpinners(page);
    await page.waitForSelector(".font-display.text-4xl", {
      state: "visible",
      timeout: 30000,
    });
    await screenshot(page, `${dir}/05-detail-atelier-suspendu.png`);
  }
}

async function main() {
  const base = await resolveBackofficeBase();
  console.log(`Backoffice : ${base}`);

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await captureParcoursStatutCommande(page, context, base);
  await captureParcoursDesactiverAtelier(page, context, base);

  await browser.close();
  console.log(`\nParcours backoffice enregistrés dans ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
