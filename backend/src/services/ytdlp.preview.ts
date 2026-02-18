import { spawn } from "node:child_process";

export async function getVideoInfo(url: string): Promise<string> {
  let output = "";
  let errorOutput = "";

  await new Promise<void>((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      "-J",
      "--js-runtimes",
      "node",
      url,
    ]);

    ytdlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(errorOutput || "yt-dlp falhou"));
      }
    });
  });

  return output;
}
