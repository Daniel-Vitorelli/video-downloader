import { spawn } from "node:child_process";
import { cookies } from "../utils/cookies.js";

export async function downloadVideo(
  video_id: string,
  outputPath: string,
  format_id: string,
  ext: string,
  type: "video" | "audio",
  dir: string,
  onProgress?: (data: {
    percent?: number;
    speed?: string;
    eta?: string;
    raw?: string;
  }) => void,
): Promise<void> {
  const cookiesPath = await cookies(dir);

  return new Promise((resolve, reject) => {
    let ytdlpString;
    if (type === "video") {
      ytdlpString = [
        `${format_id}+bestaudio[ext=${ext === "mp4" ? "m4a" : "webm"}]/bestaudio`,
        "--merge-output-format",
        ext,
      ];
    } else {
      ytdlpString = [format_id];
    }

    const ytdlp = spawn("yt-dlp", [
      "-f",
      ...ytdlpString,
      "-o",
      outputPath,
      "--newline",
      "--progress-template",
      "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s",
      "--js-runtimes",
      "node",
      "--cookies",
      cookiesPath,
      video_id,
    ]);

    ytdlp.stdout.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split("|");

        if (parts.length === 3) {
          const percent = parseFloat(parts[0].replace("%", "").trim());

          onProgress?.({
            percent,
            speed: parts[1].trim(),
            eta: parts[2].trim(),
            raw: line,
          });
        }
      }
    });

    ytdlp.stderr.on("data", (chunk) => {
      onProgress?.({ raw: chunk.toString() });
    });

    ytdlp.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("yt-dlp falhou"));
    });
  });
}
