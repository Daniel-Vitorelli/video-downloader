import fastify from "fastify";
import path from "node:path";
import { ensureDir } from "./utils/ensureDir.js";
import { fileURLToPath } from "url";
import { downloadRoute } from "./routes/download.js";
import { previewRoute } from "./routes/preview.js";
import sse from "@fastify/sse";
import fastifyStatic from "@fastify/static";
import { fileRoute } from "./routes/file.js";

const server = fastify();

declare module "fastify" {
  interface FastifyInstance {
    downloadsDir: string;
    address: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.downloadsDir = path.join(__dirname, "..", "downloads");
ensureDir(server.downloadsDir);

server.register(sse as any);
server.register(downloadRoute);
server.register(previewRoute);
server.register(fileRoute)
server.register(fastifyStatic, {
  root: path.join(server.downloadsDir),
  prefix: "/downloads/",
});

const port = process.env.PORT || 3000;

server.listen({ port: +port, host: "0.0.0.0" }, (err, address) => {
  server.address = address;

  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
