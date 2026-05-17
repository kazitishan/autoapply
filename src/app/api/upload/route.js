import { writeFile, unlink, rename as fsRename } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const DATA_PATH = path.join(process.cwd(), "private", "data");

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(DATA_PATH, file.name), buffer);
  return Response.json({ filename: file.name });
}

export async function DELETE(request) {
  const { filename } = await request.json();
  await unlink(path.join(DATA_PATH, filename));
  return Response.json({ ok: true });
}

export async function PATCH(request) {
  const { oldName, newName } = await request.json();
  await fsRename(path.join(DATA_PATH, oldName), path.join(DATA_PATH, newName));
  return Response.json({ filename: newName });
}
