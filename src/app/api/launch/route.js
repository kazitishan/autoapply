import { chromium } from "playwright";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// User info
const dataDir = path.join(process.cwd(), "private", "data");
const info = JSON.parse(await readFile(path.join(dataDir, "info.json"), "utf-8"));
const csvText = await readFile(path.join(dataDir, "apply.csv"), "utf-8");
const links = csvText
  .split("\n")
  .slice(1)
  .map((line) => line.split(",")[0].trim())
  .filter(Boolean);

// Ask the model a question and get code in response
async function askModel(page, message) {
  await page.evaluate((text) => navigator.clipboard.writeText(text), message);
  await page.keyboard.press("Meta+V");
  await new Promise((r) => setTimeout(r, 2000));
  await page.keyboard.press("Enter");
  await page.waitForSelector('button[aria-label="Send message"]');

  // await page.keyboard.type("Hi");
  // await page.keyboard.press("Enter");
  // await page.waitForSelector('button[aria-label="Send message"]');

  await page.getByRole('button', { name: 'Copy code' }).click();
  const codeText = await page.evaluate(() => navigator.clipboard.readText());
  console.log(codeText);
}

// Construct the message to send to the model
function constructMessage(link, accessTree) {
  return `
    I am applying for a job\n
    I am using Playwright to apply to it and I need your help in deciding what my next actions should be to completing this job application. Tell me what buttons I need to press to move on and the information I need to input.\n
    Give me the javascript playwright code only!\n
    Don't give me any explanations or comments, just the code.\n
    Don't give any actions for buttons or inputs that are not in the acessibility tree that I sent you. If you want to do an action, make sure it's in the accessibility tree.\n
    If the job application asks whether I would like to autofill with resume or apply manually, always choose apply manually.\n
    Job: ${link}\n
    Info structure (values are placeholders — fill them from the actual user data at runtime. The variable that stores the user information is called info):\n${JSON.stringify(cleanInfo(info))}
    Accessibility tree of the page:\n${accessTree}
  `;
}

// Clean the info object by replacing all values with empty strings, while keeping the structure intact
// Used for sending the info structure to the model without exposing any sensitive information
function cleanInfo(obj) {
  if (Array.isArray(obj)) return obj.map(cleanInfo);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cleanInfo(v)]));
  }
  return "";
}

// Returns a string that represents the accessibility tree of the page, including iframes
async function constructAccessTree(page) {
  const bodyAria = await page.locator('body').ariaSnapshot();

  const frames = page.frames().filter(f =>
    f !== page.mainFrame() &&
    f.url() !== 'about:blank' &&
    f.url() !== 'about:srcdoc'
  );

  const iframesAria = {};
  for (let i = 0; i < frames.length; i++) {
    try {
      await frames[i].waitForLoadState('domcontentloaded');
      iframesAria[i] = await frames[i].locator('body').ariaSnapshot();
    } catch (e) {
      iframesAria[i] = `Error: ${e.message}`;
    }
  }

  let message = `=== MAIN PAGE ===\n${bodyAria}`;
  for (const [i, tree] of Object.entries(iframesAria)) {
    message += `\n\n=== IFRAME ${i} (${frames[i].url()}) ===\n${tree}`;
  }
  return message;
}

export async function POST() {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const geminiPage = await context.newPage();
  await geminiPage.goto("https://gemini.google.com/app");

  const jobPage = await context.newPage();
  await jobPage.goto(links[0], { waitUntil: 'networkidle' });
  await jobPage.locator('body *').first().waitFor({ state: 'visible' });
  await constructAccessTree(jobPage);
  const accessTree = await constructAccessTree(jobPage);

  await askModel(geminiPage, constructMessage(links[0], accessTree));

  return Response.json({ ok: true });
}
