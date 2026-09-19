// Parses the GBP URL list Excel file and upserts Store rows by gbpUrl.
//
// This is the seam mentioned in the plan: today a person uploads a
// dummy/manual file here. Later, the AI agent that scrapes Google for store
// URLs will produce a file in this exact same column shape and call this
// same function (via POST /api/import/gbp-urls) — nothing else in the app
// needs to change when that agent exists.

import * as XLSX from "xlsx";
import { prisma } from "../db/prismaClient.js";

interface GbpUrlRow {
  store_name?: string;
  region?: string;
  country?: string;
  gbp_url?: string;
  category?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
}

export async function importGbpUrls(fileBuffer: Buffer): Promise<ImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<GbpUrlRow>(sheet);

  const result: ImportResult = { created: 0, updated: 0, skipped: 0 };

  for (const row of rows) {
    if (!row.gbp_url || !row.store_name) {
      result.skipped += 1;
      continue;
    }

    const existing = await prisma.store.findUnique({ where: { gbpUrl: row.gbp_url } });
    const fields = {
      name: row.store_name,
      region: row.region ?? "",
      country: row.country ?? "",
      category: row.category ?? "",
    };

    if (existing) {
      await prisma.store.update({ where: { gbpUrl: row.gbp_url }, data: fields });
      result.updated += 1;
    } else {
      await prisma.store.create({ data: { ...fields, gbpUrl: row.gbp_url } });
      result.created += 1;
    }
  }

  return result;
}
