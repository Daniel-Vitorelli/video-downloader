import { type FastifyInstance } from "fastify";
import path from "node:path";
import { downloadVideo } from "../services/ytdlp.download.js";
import { freeDiskSpace, toGB } from "../utils/diskSpace.js";
import { getVideoSize } from "../services/ytdlp.filesize.js";
import { promises as fs } from "fs";

interface DownloadQuery {
  video_id?: string;
  format_id?: string;
  ext?: string;
  type?: "video" | "audio";
}

const downloadTimers = new Map<string, NodeJS.Timeout>();

export async function downloadRoute(server: FastifyInstance) {
  server.get<{ Querystring: DownloadQuery }>(
    "/download",
    { sse: true },
    async (request, reply) => {
      const { video_id, format_id, ext, type } = request.query;

      if (!video_id) {
        return reply.status(400).send({ error: "Envie ?video_id=" });
      }

      if (!format_id) {
        return reply.status(400).send({ error: "Envie ?format_id="});
      }

      if (!ext) {
        return reply.status(400).send({ error: "Envie ?ext=" });
      }

      if (!type) {
        return reply.status(400).send({error: "Envie ?type= \"video\" ou \"audio\""})
      }

      if (!reply.raw.writableEnded) {
        reply.sse.send({ event: "start", data: "Iniciando..." });
      }

      try {
        const diskSpace = await freeDiskSpace();
        const filesize = await getVideoSize(video_id, format_id, ext, type);

        if (!filesize) {
          throw new Error("Não foi possível obter tamanho do arquivo");
        }

        if (filesize > diskSpace) {
          if (!reply.raw.writableEnded) {
            reply.sse.send({
              event: "error",
              data: {
                error: "Espaço insuficiente em disco",
                filesize: toGB(filesize),
                diskSpace: toGB(diskSpace),
              },
            });
          }
          return reply.raw.end();
        }

        const fileDir = path.join(
          server.downloadsDir,
          `${video_id}_${format_id}`,
        );

        await fs.mkdir(fileDir, { recursive: true });

        const output = path.join(fileDir, "%(title)s.%(ext)s");

        const files = await fs.readdir(fileDir);

        if (files.some((f) => f.endsWith(`.${ext}`))) {
          if (!reply.raw.writableEnded) {
            reply.sse.send({
              event: "complete",
              data: "Download já estava feito!",
            });
          }
        } else {
          await downloadVideo(video_id, output, format_id, ext, type, (progress) => {
            if (!reply.raw.writableEnded) {
              reply.sse.send({
                event: "progress",
                data: progress,
              });
            }
          });

          if (!reply.raw.writableEnded) {
            reply.sse.send({
              event: "complete",
              data: "Download concluído",
            });
          }
        }

        const existingTimer = downloadTimers.get(fileDir);
        if (existingTimer) {
          clearTimeout(existingTimer);
          console.log(`Timer resetado para ${fileDir}`);
        }

        const timer = setTimeout(async () => {
          try {
            await fs.rm(fileDir, { recursive: true, force: true });
            downloadTimers.delete(fileDir);
            console.log(`Dir: ${fileDir} removed!`);
          } catch (error) {
            console.error(error);
          }
        }, 1000 * 60 * 5);

        downloadTimers.set(fileDir, timer);
        console.log(`Dir: ${fileDir} expire in 5 minutes`);

        reply.raw.end();
        return;
      } catch (error) {
        console.error(error);

        if (!reply.raw.writableEnded) {
          reply.sse.send({
            event: "error",
            data: {
              message: "Erro ao Baixar!",
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }

        reply.raw.end();
        return;
      }
    },
  );
}
