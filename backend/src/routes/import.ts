import { Router } from "express";
import multer from "multer";
import { importGbpUrls } from "../services/excelImport.js";

export const importRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/import/gbp-urls  (multipart, field name "file")
// This is the seam the future scraping AI agent will call directly.
importRouter.post("/gbp-urls", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing file (field name 'file')" });

  try {
    const result = await importGbpUrls(req.file.buffer);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: `Failed to parse Excel file: ${(err as Error).message}` });
  }
});
