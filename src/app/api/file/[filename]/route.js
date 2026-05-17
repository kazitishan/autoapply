import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const DATA_PATH = path.join(process.cwd(), "private", "data");

const CONTENT_TYPES = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

export async function GET(request, context) {
  const { filename } = await context.params;

  if (filename.includes("..") || filename.includes("/")) {
    return Response.json({ error: "Invalid filename" }, { status: 400 });
  }

  const buffer = await readFile(path.join(DATA_PATH, filename));
  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
