import fastify from "fastify";
import path from "node:path";
import { ensureDir } from "./utils/ensureDir.js";
import { fileURLToPath } from "url";
import { downloadRoute } from "./routes/download.js";
import { previewRoute } from "./routes/preview.js";
import sse from "@fastify/sse";
import fastifyStatic from "@fastify/static";
import { fileRoute } from "./routes/file.js";
import dotenv from 'dotenv';
dotenv.config();

const server = fastify();

declare module "fastify" {
  interface FastifyInstance {
    downloadsDir: string;
    address: string;
    cookiePath: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.downloadsDir = path.join(__dirname, "..", "downloads");
ensureDir(server.downloadsDir);

const tmp = path.join(__dirname, "..", "tmp")
ensureDir(tmp)
server.cookiePath = tmp

server.register(sse as any);
server.register(downloadRoute);
server.register(previewRoute);
server.register(fileRoute)
server.register(fastifyStatic, {
  root: path.join(server.downloadsDir),
  prefix: "/downloads/",
});

const port = process.env.PORT || 8080;

server.listen({ port: +port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  server.address = process.env.URL || address;

  console.log(`Server listening at ${address}`);
});
