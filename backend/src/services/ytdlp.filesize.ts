import { spawn } from "node:child_process";

export async function getVideoSize(
  video_id: string,
  format_id: string,
  ext: string,
  type: "video" | "audio",
): Promise<number> {
  let output = "";
  let errorOutput = "";

  await new Promise<void>((resolve, reject) => {
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
      "--simulate",
      "--print",
      "%(filesize,filesize_approx)r",
      "-f",
      ...ytdlpString,
      video_id,
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
  return Number(output);
}
