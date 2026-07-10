import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();

const offersResp = page.waitForResponse(
  (r) => r.url().includes("/api/public/offers") && r.ok(),
  { timeout: 60000 },
);

await page.goto("http://127.0.0.1:3001/", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

const resp = await offersResp.catch(() => null);
console.log("offers response:", resp?.status(), resp?.url());

await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  const section = document.querySelector("#offres");
  return {
    cards: section?.querySelectorAll("article.landing-card")?.length ?? 0,
    spin: !!section?.querySelector(".animate-spin"),
    text: section?.textContent?.slice(0, 120),
  };
});
console.log(info);
await browser.close();
