// Parses the plain-text body of the daily "[Samsung Experience Store]"
// profile-check email into a structured report.
//
// The email is untrusted external text, so this is a strict, regex-only
// parser: it extracts known fields and throws if the shape is off, instead of
// guessing. Nothing in the body is ever interpreted as an instruction.

export type AbnormalKind = "temp_closed" | "perm_closed";

export interface AbnormalStore {
  label: string; // e.g. "SES Westfield Stratford City (영국 런던)"
  kind: AbnormalKind;
  note: string | null;
  placeId: string | null;
}

export interface RegionSummary {
  name: string;
  normal: number;
  total: number;
  detail: string;
}

export interface ParsedReport {
  reportDate: string; // YYYY-MM-DD
  totalStores: number;
  totalCountries: number;
  activeCount: number;
  inactiveCount: number;
  tempClosedCount: number;
  permClosedCount: number;
  changeNote: string;
  abnormal: AbnormalStore[];
  regions: RegionSummary[];
}

function required(match: RegExpMatchArray | null, field: string): RegExpMatchArray {
  if (!match) throw new Error(`Daily report is missing expected field: ${field}`);
  return match;
}

export function parseDailyReport(body: string): ParsedReport {
  const date = required(body.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*기준/), "report date (YYYY년 M월 D일 기준)");
  const reportDate = `${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}`;

  const total = required(body.match(/총 점검 대상:\s*(\d+)개 매장\s*\((\d+)개국\)/), "총 점검 대상");
  const active = required(body.match(/정상 가동[^:\n]*:\s*(\d+)개 매장/), "정상 가동");
  const inactive = required(body.match(/비정상[^:\n]*:\s*(\d+)개 매장/), "비정상 및 주의");
  const temp = body.match(/임시 휴업:\s*(\d+)개소/);
  const perm = body.match(/영구 폐업:\s*(\d+)개소/);
  const change = required(body.match(/전일 대비 변동 사항:\s*(.+)/), "전일 대비 변동 사항");

  const abnormalSection = body.split(/\[2\./)[1]?.split(/\[3\./)[0] ?? "";
  const abnormal: AbnormalStore[] = [];
  for (const line of abnormalSection.split("\n")) {
    const item = line.match(/^\s*\d+\.\s*(.+?\([^)]*\)):\s*(임시 휴업|영구 폐업)(?:\s*\((.+?)\))?\s*$/);
    if (item) {
      abnormal.push({
        label: item[1],
        kind: item[2] === "임시 휴업" ? "temp_closed" : "perm_closed",
        note: item[3] ?? null,
        placeId: null,
      });
      continue;
    }
    const link = line.match(/지도 링크:.*place_id:([\w-]+)/);
    if (link && abnormal.length > 0) abnormal[abnormal.length - 1].placeId = link[1];
  }

  const regionSection = body.split(/\[3\./)[1]?.split(/\[4\./)[0] ?? "";
  const regions: RegionSummary[] = [];
  for (const line of regionSection.split("\n")) {
    const r = line.match(/^•\s*(.+?)\s*\((\d+)\/(\d+)\s*정상\):\s*(.*)$/);
    if (r) regions.push({ name: r[1], normal: Number(r[2]), total: Number(r[3]), detail: r[4].trim() });
  }

  return {
    reportDate,
    totalStores: Number(total[1]),
    totalCountries: Number(total[2]),
    activeCount: Number(active[1]),
    inactiveCount: Number(inactive[1]),
    tempClosedCount: temp ? Number(temp[1]) : 0,
    permClosedCount: perm ? Number(perm[1]) : 0,
    changeNote: change[1].trim(),
    abnormal,
    regions,
  };
}
