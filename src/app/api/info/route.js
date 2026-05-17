import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const INFO_PATH = path.join(process.cwd(), "private", "data", "info.json");

export async function GET() {
  const file = await readFile(INFO_PATH, "utf-8");
  return Response.json(JSON.parse(file));
}

export async function POST(request) {
  const data = await request.json();
  await writeFile(INFO_PATH, JSON.stringify(data, null, 4), "utf-8");
  return Response.json({ ok: true });
}
