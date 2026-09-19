import "dotenv/config";
import express from "express";
import cors from "cors";
import { storesRouter } from "./routes/stores.js";
import { aiRouter } from "./routes/ai.js";
import { importRouter } from "./routes/import.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/stores", storesRouter);
app.use("/api", aiRouter); // exposes /api/reviews/:id/reply-draft
app.use("/api/import", importRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
