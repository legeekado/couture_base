#!/usr/bin/env node
/**
 * Captures UI avec données chargées (sans spinners).
 *
 * Prérequis :
 * - Backend API : http://127.0.0.1:8000
 * - Landing dev : http://127.0.0.1:3001
 * - Backoffice prod : http://127.0.0.1:3010
 *   cd backoffice && npm run build && PORT=3010 npm run start
 *
 * Usage: node scripts/capture-screenshots.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "captures-interfaces");
const LANDING_BASE = process.env.LANDING_URL ?? "http://127.0.0.1:3001";
const BACKOFFICE_BASE =
  process.env.BACKOFFICE_URL ?? "http://127.0.0.1:3010";

async function resolveBackofficeBase() {
  for (const base of [BACKOFFICE_BASE, "http://127.0.0.1:3000"]) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        if (base.includes(":3000")) {
          console.warn(
            "⚠ Backoffice dev (3000) : risque de spinners. Préférez PORT=3010 npm run start",
          );
        }
        return base;
      }
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "Backoffice inaccessible. Lancez : cd backoffice && PORT=3010 npm run start",
  );
}

function landingPages() {
  return [
    {
      file: "landingpage/01-accueil-hero.png",
      url: `${LANDING_BASE}/`,
      prepare: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await waitLandingHero(page);
      },
    },
    {
      file: "landingpage/02-fonctionnalites.png",
      url: `${LANDING_BASE}/`,
      prepare: async (page) => {
        await scrollToSelector(page, "header.landing-hero + section");
        await forceRevealVisible(page);
      },
    },
    {
      file: "landingpage/03-produit.png",
      url: `${LANDING_BASE}/#produit`,
      prepare: async (page) => {
        await scrollToSelector(page, "#produit");
        await forceRevealVisible(page);
        await page.waitForSelector("#produit .landing-phone-mockup", {
          timeout: 30000,
        });
      },
    },
    {
      file: "landingpage/04-tarifs.png",
      url: `${LANDING_BASE}/`,
      prepare: async (page, context) => {
        await waitLandingPricing(page, context);
        await scrollToSelector(page, "#offres");
        await forceRevealVisible(page);
      },
    },
    {
      file: "landingpage/05-cta-footer.png",
      url: `${LANDING_BASE}/`,
      prepare: async (page) => {
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(800);
        await forceRevealVisible(page);
      },
    },
    {
      file: "landingpage/06-accueil-complet.png",
      url: `${LANDING_BASE}/`,
      fullPage: true,
      prepare: async (page, context) => {
        await revealEntireLanding(page, context);
      },
    },
  ];
}

function backofficePages(base) {
  return [
    {
      file: "backoffice/02-dashboard.png",
      url: `${base}/dashboard`,
      ready: ".dashboard-stat-icon, table tbody tr td",
    },
    {
      file: "backoffice/03-ateliers.png",
      url: `${base}/dashboard/ateliers`,
      ready: ".list-card-animate",
    },
    {
      file: "backoffice/04-commandes.png",
      url: `${base}/dashboard/commandes`,
      ready: "tbody tr.list-row-animate, tbody tr td.font-bold",
    },
    {
      file: "backoffice/05-clients.png",
      url: `${base}/dashboard/clients`,
      ready: ".list-card-animate",
    },
    {
      file: "backoffice/06-monitoring.png",
      url: `${base}/dashboard/monitoring`,
      ready: "section.mt-10 table tbody tr",
    },
    {
      file: "backoffice/07-analyses.png",
      url: `${base}/dashboard/analyses`,
      ready: ".analytics-page .analytics-hero",
    },
  ];
}

async function waitNoSpinners(page, scope = "main.dashboard-main, .auth-panel, body", timeout = 90000) {
  await page
    .waitForFunction(
      (selector) => {
        const roots = selector
          .split(",")
          .map((s) => document.querySelector(s.trim()))
          .filter(Boolean);
        const root = roots[0] ?? document.body;
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
      scope,
      { timeout },
    )
    .catch(() => {});
}

async function waitForReadySelector(page, selector, timeout = 90000) {
  await waitNoSpinners(page, "main.dashboard-main", timeout);
  await page.waitForSelector(selector, { state: "visible", timeout });
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && (el.textContent?.trim().length ?? 0) > 0;
    },
    selector,
    { timeout: 15000 },
  ).catch(() => {});
  await page.waitForTimeout(600);
}

async function forceRevealVisible(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".landing-reveal").forEach((el) => {
      el.classList.add("is-visible");
    });
  });
}

async function scrollToSelector(page, selector) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}

async function waitLandingHero(page) {
  await page.waitForSelector(".landing-hero h1", { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const cards = document.querySelectorAll(
        ".landing-demo-panel p.font-display",
      );
      return (
        cards.length >= 4 && [...cards].some((el) => el.textContent?.trim())
      );
    },
    { timeout: 20000 },
  );
  await forceRevealVisible(page);
}

async function ensureLandingPricing(page, context) {
  await page.waitForSelector("#offres", { timeout: 30000 });
  const existing = await page.locator("#offres article.landing-card").count();
  if (existing > 0) return;

  const api = await context.request.get(
    "http://127.0.0.1:8000/api/public/offers",
  );
  const { offers } = await api.json();
  await page.evaluate((items) => {
    const section = document.querySelector("#offres");
    if (!section) return;
    section.querySelector(".flex.justify-center.py-16")?.remove();
    let grid = section.querySelector(".grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.className = "mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3";
      section.querySelector(".mx-auto")?.appendChild(grid);
    }
    grid.innerHTML = items
      .map(
        (o) => `
      <article class="landing-card flex h-full flex-col p-8 ${o.mise_en_avant ? "landing-pricing-featured" : ""}">
        ${o.mise_en_avant ? '<span class="mb-4 inline-block rounded-full bg-gold/22 px-3 py-1 text-xs font-bold">Populaire</span>' : ""}
        <span class="text-xs font-bold uppercase tracking-wide text-primary/70">${o.plan}</span>
        <h3 class="mt-1 font-display text-2xl font-bold">${o.nom}</h3>
        ${o.description ? `<p class="mt-2 text-sm text-text/65 line-clamp-2">${o.description}</p>` : ""}
        <p class="mt-4 font-display text-4xl font-bold text-gold">${o.prix_fcfa_fr}</p>
        <ul class="mt-6 flex-1 space-y-3">${(o.features || [])
          .map((f) => `<li class="text-sm text-text/75">✓ ${f}</li>`)
          .join("")}</ul>
      </article>`,
      )
      .join("");
  }, offers);
}

async function waitLandingPricing(page, context) {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll("#offres article.landing-card").length > 0,
      { timeout: 15000 },
    );
  } catch {
    await ensureLandingPricing(page, context);
  }
}

async function revealEntireLanding(page, context) {
  await waitLandingHero(page);

  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= height; y += 350) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(180);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await waitLandingPricing(page, context);
  await forceRevealVisible(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

async function loginBackoffice(page, context, base) {
  const response = await context.request.post(
    "http://127.0.0.1:8000/api/auth/login",
    {
      data: {
        email: "admin@kalmy.sn",
        password: "password",
        device: "backoffice",
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok()) {
    throw new Error(`Login API failed: ${response.status()}`);
  }
  const body = await response.json();
  await page.goto(`${base}/`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("kalmy_token", token);
      localStorage.setItem("kalmy_user", JSON.stringify(user));
    },
    { token: body.token, user: body.user },
  );
}

async function captureLoginPage(page, base) {
  await page.goto(`${base}/`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.evaluate(() => {
    localStorage.removeItem("kalmy_token");
    localStorage.removeItem("kalmy_user");
  });
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector(".auth-input", {
    state: "visible",
    timeout: 60000,
  });
  await waitNoSpinners(page, "body", 10000);
  await page.waitForTimeout(800);

  const path = join(outDir, "backoffice/01-login.png");
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path });
  console.log("✓ backoffice/01-login.png");
}

async function captureLanding(page, context, target) {
  await page.goto(target.url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  if (target.prepare) {
    await target.prepare(page, context);
  }
  const path = join(outDir, target.file);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({
    path,
    fullPage: target.fullPage ?? false,
  });
  console.log(`✓ ${target.file}`);
}

async function captureBackoffice(page, target) {
  await page.goto(target.url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await waitForReadySelector(page, target.ready);
  const path = join(outDir, target.file);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path });
  console.log(`✓ ${target.file}`);
}

async function captureRegister(page, base) {
  await page.goto(`${base}/register`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForSelector(".auth-input", {
    state: "visible",
    timeout: 30000,
  });
  await waitNoSpinners(page, "body");
  await page.waitForTimeout(800);
  const path = join(outDir, "backoffice/08-register.png");
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path });
  console.log("✓ backoffice/08-register.png");
}

async function main() {
  const backofficeBase = await resolveBackofficeBase();
  console.log(`Backoffice : ${backofficeBase}`);

  mkdirSync(join(outDir, "backoffice"), { recursive: true });
  mkdirSync(join(outDir, "landingpage"), { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const target of landingPages()) {
    await captureLanding(page, context, target);
  }

  await captureLoginPage(page, backofficeBase);
  await captureRegister(page, backofficeBase);

  await loginBackoffice(page, context, backofficeBase);

  for (const target of backofficePages(backofficeBase)) {
    await captureBackoffice(page, target);
  }

  await browser.close();
  console.log(`\nCaptures web enregistrées dans ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
