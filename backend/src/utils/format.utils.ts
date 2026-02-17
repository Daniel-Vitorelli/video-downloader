import type { FormatsByExt, VideoFormat } from "../types/previewTypes.js";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function groupFormatsByExtension(formats: VideoFormat[]): FormatsByExt {
  const result: FormatsByExt = {
    video: {},
    audio: [],
  };

  // mapa temporário para controlar melhor áudio por extensão
  const audioMap: Record<
    string,
    { format_id: string; ext: string; filesize: string }
  > = {};

  for (const f of formats) {
    const ext = f.ext ?? "";
    if (!ext) continue;

    // ignora mhtml
    if (ext === "mhtml") continue;

    const rawFilesize =
      f.filesize === "NA" || f.filesize == null
        ? f.filesize_approx
        : f.filesize;

    const filesizeStr = rawFilesize == null ? "N/A" : String(rawFilesize);
    const filesizeNum = toNumber(rawFilesize);

    // =====================
    // 🎵 ÁUDIO
    // =====================
    if (f.vcodec === "none") {
      const current = audioMap[ext];

      if (!current) {
        audioMap[ext] = {
          format_id: f.format_id,
          ext,
          filesize: filesizeStr,
        };
      } else {
        const currentSizeNum = toNumber(current.filesize);

        const shouldReplace =
          // se ambos têm filesize válido → maior vence
          filesizeNum !== null && currentSizeNum !== null
            ? filesizeNum > currentSizeNum
            : // se nenhum tem filesize → maior format_id vence
            filesizeNum === null && currentSizeNum === null
            ? f.format_id > current.format_id
            : // se só o novo tem filesize → novo vence
            filesizeNum !== null;

        if (shouldReplace) {
          audioMap[ext] = {
            format_id: f.format_id,
            ext,
            filesize: filesizeStr,
          };
        }
      }

      continue;
    }

    // =====================
    // 🎥 VÍDEO
    // =====================

    if (ext === "mp4" && typeof f.vcodec === "string" && f.vcodec.startsWith("avc")) {
      continue;
    }

    const videoItem = {
      format_id: f.format_id,
      resolution: f.resolution ?? "N/A",
      filesize: filesizeStr,
    };

    result.video[ext] = result.video[ext] ?? [];

    if (!result.video[ext].some((it) => it.format_id === videoItem.format_id)) {
      result.video[ext].push(videoItem);
    }
  }

  // transforma o mapa em array final
  result.audio = Object.values(audioMap);

  return result;
}
