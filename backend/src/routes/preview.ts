import type { FastifyInstance } from "fastify";
import type { VideoFormat, FormatsByExt, ReplyPayload } from "../types/previewTypes.js";
import { getVideoInfo } from "../services/ytdlp.preview.js";
import { groupFormatsByExtension } from "../utils/format.utils.js";
import path from "node:path";

export async function previewRoute(server: FastifyInstance) {
  server.get("/preview", async (request, reply) => {
    const { url } = request.query as { url?: string };

    if (!url) {
      return reply.status(400).send({ error: "Envie ?url=" });
    }

    try {
      const output = await getVideoInfo(url, server.cookiePath)

      const data = JSON.parse(output) as {
        id: string;
        title: string;
        thumbnail: string;
        filesize: number;
        filesize_approx: number;
        formats: VideoFormat[];
      };

      const payload: ReplyPayload = {
        message: "Preview concluído",
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        formats: groupFormatsByExtension(data.formats)
      };

      reply.send(payload);
    } catch (error) {
      reply.status(500).send({
        error: "Erro no preview",
        details: (error as Error).message,
      });
    }
  });
}
