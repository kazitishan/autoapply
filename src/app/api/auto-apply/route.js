import { readFile } from "fs/promises";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const maxDuration = 300;

const INFO_PATH = path.join(process.cwd(), "private", "data", "info.json");
const MAX_ITERATIONS = 20;

const SYSTEM_PROMPT = (info, notes) => `You are an AI agent that fills out job application forms automatically.

Applicant profile:
${JSON.stringify(info, null, 2)}

Additional notes about this job: ${notes || "None"}

Each turn you will receive the combined accessibility tree of the page and all its iframes, clearly labeled. You must respond with a JSON object:
{
  "status": "continue" | "done",
  "message": "<what you are doing or why you are done>",
  "actions": [
    {
      "type": "fill" | "selectOption" | "check" | "click",
      "by": "label" | "placeholder" | "name",
      "target": "<exact label/placeholder/name text from the accessibility tree>",
      "value": "<value to use>",
      "description": "<human-readable description>"
    }
  ]
}

Rules:
- Set status to "done" only when the application has been successfully submitted
- Set status to "continue" if there are more fields or pages to complete
- You do NOT need to specify which iframe a field is in — that is handled automatically
- Actions are executed in order; include a "click" on the submit/next button when ready to advance
- For "selectOption": value must be the exact visible option text
- For "check": omit value
- Do NOT wrap in markdown code fences
- Respond with ONLY the JSON object`;

async function getFullAriaSnapshot(page) {
  const parts = [];

  try {
    const main = await page.ariaSnapshot();
    if (main.trim()) parts.push(`[Main page]\n${main}`);
  } catch {}

  const childFrames = page.frames().filter((f) => f !== page.mainFrame());
  for (let i = 0; i < childFrames.length; i++) {
    try {
      const snapshot = await childFrames[i].ariaSnapshot();
      if (snapshot.trim()) {
        parts.push(`[Iframe ${i + 1}: ${childFrames[i].url()}]\n${snapshot}`);
      }
    } catch {}
  }

  return parts.join("\n\n---\n\n");
}

async function executeOnFrame(frame, action) {
  let locator;
  if (action.by === "label") {
    locator = frame.getByLabel(action.target, { exact: false });
  } else if (action.by === "placeholder") {
    locator = frame.getByPlaceholder(action.target, { exact: false });
  } else if (action.by === "name") {
    locator = frame.locator(`[name="${action.target}"]`);
  }
  if (!locator) throw new Error("no locator strategy matched");

  const count = await locator.count();
  if (count === 0) throw new Error("element not found in this frame");

  if (action.type === "fill") {
    await locator.first().fill(action.value, { timeout: 4000 });
  } else if (action.type === "selectOption") {
    await locator.first().selectOption(action.value, { timeout: 4000 });
  } else if (action.type === "check") {
    await locator.first().check({ timeout: 4000 });
  } else if (action.type === "click") {
    await locator.first().click({ timeout: 4000 });
    return true; // signals a click that may trigger navigation
  }
  return false;
}

async function executeAction(page, action) {
  for (const frame of page.frames()) {
    try {
      const didClick = await executeOnFrame(frame, action);
      return { success: true, didClick };
    } catch {
      // try next frame
    }
  }
  return { success: false, didClick: false };
}

async function generateWithRetry(ai, params, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const retryable =
        error?.status === 503 || error?.status === 429 ||
        error?.code === 503 || error?.code === 429;
      if (!retryable) throw error;
      const delay = Math.min(2000 * 2 ** attempt, 30000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export async function POST(request) {
  const { url, notes } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      let browser;
      try {
        send({ type: "status", message: "Loading your profile..." });
        const info = JSON.parse(await readFile(INFO_PATH, "utf-8"));

        send({ type: "status", message: "Launching browser..." });
        browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });

        send({ type: "status", message: "Navigating to job page..." });
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemPrompt = SYSTEM_PROMPT(info, notes);
        const contents = [];
        let iteration = 0;

        while (iteration < MAX_ITERATIONS) {
          iteration++;
          send({ type: "status", message: `Step ${iteration}: Reading page...` });

          const ariaSnapshot = await getFullAriaSnapshot(page);

          const userMessage =
            iteration === 1
              ? `${systemPrompt}\n\nCurrent page:\n${ariaSnapshot}`
              : `Updated page:\n${ariaSnapshot}`;

          contents.push({ role: "user", parts: [{ text: userMessage }] });

          send({ type: "status", message: `Step ${iteration}: Asking Gemini what to do...` });

          const response = await generateWithRetry(ai, {
            model: "gemini-2.5-flash",
            contents,
          });

          const rawText = response.text ?? "";
          const clean = rawText
            .replace(/^```json?\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();

          contents.push({ role: "model", parts: [{ text: rawText }] });

          let result;
          try {
            result = JSON.parse(clean);
          } catch {
            send({ type: "error", message: "Could not parse Gemini's response. Stopping." });
            break;
          }

          send({ type: "status", message: result.message });

          if (result.status === "done") {
            send({ type: "done", message: result.message });
            break;
          }

          const actions = result.actions ?? [];
          let filled = 0;
          let skipped = 0;
          let navigated = false;

          for (const action of actions) {
            send({ type: "action", description: action.description });
            const { success, didClick } = await executeAction(page, action);
            if (success) {
              filled++;
              if (didClick) {
                await page
                  .waitForLoadState("networkidle", { timeout: 8000 })
                  .catch(() => {});
                await page.waitForTimeout(1000);
                navigated = true;
              }
            } else {
              skipped++;
              send({ type: "warning", message: `Skipped: ${action.description}` });
            }
          }

          if (filled === 0 && skipped === actions.length && actions.length > 0) {
            send({
              type: "warning",
              message: "All actions were skipped — stopping to avoid a loop.",
            });
            break;
          }

          if (!navigated) await page.waitForTimeout(500);
        }

        if (iteration >= MAX_ITERATIONS) {
          send({ type: "warning", message: `Reached the ${MAX_ITERATIONS}-step limit.` });
        }
      } catch (error) {
        send({ type: "error", message: error.message });
        if (browser) await browser.close();
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
