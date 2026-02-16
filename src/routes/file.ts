import type { FastifyInstance } from "fastify";
import path from "node:path";
import {promises as fs} from "fs";

export async function fileRoute (server: FastifyInstance) {
  server.get('/file', async (request, reply) => {
    const { filePath } = request.query as {filePath?: string}

    if (!filePath) {
      return reply.status(400).send({error: "Envie ?filePath="})
    }

    try {
      const completeFilePath = path.join(server.downloadsDir, filePath)
      const readdir = await fs.readdir(completeFilePath)
      const fileName = readdir[0]

      if (!fileName) {
        return reply.status(400).send({error: "fail to read file name"})
      }

      return reply.sendFile(fileName, completeFilePath)

    } catch (error) {
      return reply.status(400).send({
        message: "fail to read file dir",
        error
      })
    }

  })
}