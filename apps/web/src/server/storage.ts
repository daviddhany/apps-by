import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Local-filesystem storage standing in for S3 (ARCHITECTURE.md §0). Behind
// the same StorageProvider shape so an S3-backed implementation is a drop-in
// swap for production.

export interface StorageProvider {
  save(appInstanceId: string, filename: string, mimeType: string, bytes: Buffer): Promise<string>;
}

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export class LocalFsStorageProvider implements StorageProvider {
  constructor(private baseDir = process.env.UPLOADS_DIR ?? "./.uploads") {}

  async save(appInstanceId: string, filename: string, mimeType: string, bytes: Buffer): Promise<string> {
    const maxBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);
    if (bytes.byteLength > maxBytes) throw new Error("File too large");
    if (!ALLOWED_MIME.has(mimeType)) throw new Error("Unsupported file type");

    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) throw new Error("Unsupported file extension");

    // Never trust the client-supplied filename for the path — generate our own.
    const safeName = `${crypto.randomUUID()}${ext}`;
    const dir = path.join(this.baseDir, appInstanceId);
    await mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, safeName);
    await writeFile(fullPath, bytes);
    return `/uploads/${appInstanceId}/${safeName}`;
  }
}

export const storage: StorageProvider = new LocalFsStorageProvider();
