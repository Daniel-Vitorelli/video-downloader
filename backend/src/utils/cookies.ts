import path from "node:path";
import fs from "node:fs";

export async function cookies(dir: string) {
  const COOKIES_PATH = path.join(dir, "cookies.txt");
  const base64 = process.env.YT_COOKIES_BASE64;

  if (!base64) {
    throw new Error("YT_COOKIES_BASE64 não definido no ambiente");
  }

  if (!fs.existsSync(COOKIES_PATH)) {
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(COOKIES_PATH, buffer);
  }

  return COOKIES_PATH;
}