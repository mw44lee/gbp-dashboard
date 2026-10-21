// Applies a parsed daily profile-check report to the database:
//   1. stores the fleet-wide snapshot as a DailyReport row (one per date)
//   2. syncs each store's operatingStatus from the report's abnormal list,
//      matching stores by the Google place_id embedded in their gbpUrl
//
// Called from the CLI (scripts/ingestReport.ts) so it works without the web
// server running — the scheduled job only needs the DB file.

import { prisma } from "../db/prismaClient.js";
import { parseDailyReport } from "./reportParser.js";

const STATUS_NORMAL = "정상 영업";
const STATUS_TEMP_CLOSED = "임시 휴업 (Temporarily closed)";
const STATUS_PERM_CLOSED = "폐업 (Permanently closed)";

export interface IngestResult {
  reportDate: string;
  storesUpdated: number;
  storesRestored: number;
  unmatched: string[];
  warnings: string[];
}

export async function ingestDailyReport(body: string, subject?: string): Promise<IngestResult> {
  const report = parseDailyReport(body);
  const warnings: string[] = [];

  if (report.activeCount + report.inactiveCount !== report.totalStores) {
    warnings.push(`active (${report.activeCount}) + inactive (${report.inactiveCount}) != total (${report.totalStores})`);
  }
  const regionTotal = report.regions.reduce((sum, r) => sum + r.total, 0);
  if (report.regions.length > 0 && regionTotal !== report.totalStores) {
    warnings.push(`region totals sum to ${regionTotal}, report total is ${report.totalStores}`);
  }

  const data = {
    totalStores: report.totalStores,
    totalCountries: report.totalCountries,
    activeCount: report.activeCount,
    inactiveCount: report.inactiveCount,
    tempClosedCount: report.tempClosedCount,
    permClosedCount: report.permClosedCount,
    changeNote: report.changeNote,
    regionsJson: JSON.stringify(report.regions),
    abnormalJson: JSON.stringify(report.abnormal),
    sourceSubject: subject ?? null,
  };
  await prisma.dailyReport.upsert({
    where: { reportDate: report.reportDate },
    update: data,
    create: { reportDate: report.reportDate, ...data },
  });

  // Only trust the abnormal list as complete when it matches the stated count;
  // otherwise a half-parsed email would wrongly mark closed stores as reopened.
  const result: IngestResult = { reportDate: report.reportDate, storesUpdated: 0, storesRestored: 0, unmatched: [], warnings };
  if (report.abnormal.length !== report.inactiveCount) {
    warnings.push(`parsed ${report.abnormal.length} abnormal stores but report says ${report.inactiveCount}; store statuses left unchanged`);
    return result;
  }

  const flaggedIds = new Set<number>();
  for (const item of report.abnormal) {
    const store = item.placeId
      ? await prisma.store.findFirst({ where: { gbpUrl: { contains: item.placeId } } })
      : null;
    if (!store) {
      result.unmatched.push(item.label);
      continue;
    }
    flaggedIds.add(store.id);
    const status = item.kind === "perm_closed" ? STATUS_PERM_CLOSED : STATUS_TEMP_CLOSED;
    if (store.operatingStatus !== status) {
      await prisma.store.update({ where: { id: store.id }, data: { operatingStatus: status } });
      result.storesUpdated += 1;
    }
  }

  const previouslyClosed = await prisma.store.findMany({
    where: { OR: [{ operatingStatus: { contains: "폐업" } }, { operatingStatus: { contains: "임시 휴업" } }] },
  });
  for (const store of previouslyClosed) {
    if (flaggedIds.has(store.id)) continue;
    await prisma.store.update({ where: { id: store.id }, data: { operatingStatus: STATUS_NORMAL } });
    result.storesRestored += 1;
  }

  return result;
}
