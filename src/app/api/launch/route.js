import { chromium } from "playwright";

export const runtime = "nodejs";

export async function POST() {
  const browser = await chromium.launch({ headless: false });
  await browser.newPage();
  return Response.json({ ok: true });
}
