import { Router } from "express";
import { prisma } from "../db/prismaClient.js";

export const reportsRouter = Router();

// GET /api/reports/latest — the most recent daily profile-check snapshot.
reportsRouter.get("/latest", async (_req, res) => {
  const report = await prisma.dailyReport.findFirst({ orderBy: { reportDate: "desc" } });
  if (!report) return res.status(404).json({ error: "No daily report ingested yet" });

  const { regionsJson, abnormalJson, ...rest } = report;
  res.json({ ...rest, regions: JSON.parse(regionsJson), abnormal: JSON.parse(abnormalJson) });
});
