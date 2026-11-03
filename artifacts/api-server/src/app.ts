import express, { type Express } from "express";
import path from "node:path";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use("/api", router);

// Production uses one Render web service. Serve the Vite build here so the UI
// and API share an origin (and the client can keep calling relative /api URLs).
const clientDist = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "tricky-flashcards",
  "dist",
  "public",
);
app.use(express.static(clientDist));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

export default app;
