import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_DIR, UPLOAD_NAME } from "@/server/db";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!UPLOAD_NAME.test(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
