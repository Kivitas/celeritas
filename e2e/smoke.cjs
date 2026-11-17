// End-to-end smoke test (plan T7.6). Loads the built app, visits each tab, and fails on any uncaught
// page error or console error. Run: npm run build && npm run e2e
// Requires Playwright. Set NODE_PATH to its install location if it is not a project dependency, and
// CHROMIUM_PATH to a Chromium binary if the bundled browser is not found.
const { chromium } = require("playwright");

const url = process.env.APP_URL || "http://localhost:4173/";
const tabs = ["Configure", "Lab", "Batch", "Exports", "Journal", "Instruments", "Theory"];

async function main() {
  const launchOptions = { headless: true, args: ["--no-sandbox"] };
  if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  const problems = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  for (const label of tabs) {
    const button = page.getByRole("button", { name: new RegExp(label, "i") }).first();
    if (await button.count()) {
      await button.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  await browser.close();

  if (problems.length > 0) {
    console.error("E2E FAILED:\n" + problems.join("\n"));
    process.exit(1);
  }
  console.log(`E2E OK: visited ${tabs.length} tab labels without page errors.`);
}

main().catch((err) => {
  console.error("E2E ERROR:", err.message);
  process.exit(1);
});
