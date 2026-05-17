import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const FILE_PATH = path.join(process.cwd(), "private", "data", "applied.csv");

export async function GET() {
  const file = await readFile(FILE_PATH, "utf-8");
  return new Response(file, { headers: { "Content-Type": "text/csv" } });
}

export async function POST(request) {
  const text = await request.text();
  await writeFile(FILE_PATH, text, "utf-8");
  return Response.json({ ok: true });
}
