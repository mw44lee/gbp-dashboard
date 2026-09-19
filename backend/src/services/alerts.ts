// Turns raw store metrics into the same "status + issue list" the original
// prototype hand-picked per store. Centralizing the rules here means the
// board, the alert feed, and (later) any notification job all agree on what
// counts as a problem — nobody re-implements the thresholds.

export type Status = "healthy" | "warn" | "critical";

export interface Issue {
  level: "warn" | "critical";
  message: string;
}

export interface StoreMetrics {
  websiteClicks: number;
  directions: number;
  calls: number;
  visitEst: number;
  rating: number;
  ratingPrev: number;
  imgAgeDays: number;
}

const INDUSTRY_AVG_DIRECTIONS_TO_VISIT = 0.41;

export function computeIssues(s: StoreMetrics): Issue[] {
  const issues: Issue[] = [];
  const ratingDelta = s.rating - s.ratingPrev;

  if (ratingDelta <= -0.7) {
    issues.push({ level: "critical", message: `Rating dropped sharply: ${s.ratingPrev.toFixed(1)} → ${s.rating.toFixed(1)}` });
  } else if (ratingDelta <= -0.3) {
    issues.push({ level: "warn", message: `Rating declining: ${s.ratingPrev.toFixed(1)} → ${s.rating.toFixed(1)}` });
  }

  if (s.imgAgeDays >= 180) {
    issues.push({ level: "critical", message: `Cover photo not updated in ${s.imgAgeDays} days` });
  } else if (s.imgAgeDays >= 60) {
    issues.push({ level: "warn", message: `Cover photo aging (${s.imgAgeDays} days since last update)` });
  }

  if (s.directions > 0) {
    const conversion = s.visitEst / s.directions;
    if (conversion < INDUSTRY_AVG_DIRECTIONS_TO_VISIT * 0.7) {
      issues.push({
        level: "warn",
        message: `Directions-to-visit conversion is ${(conversion * 100).toFixed(0)}% vs ~${(INDUSTRY_AVG_DIRECTIONS_TO_VISIT * 100).toFixed(0)}% industry average`,
      });
    }
  }

  const totalActions = s.websiteClicks + s.directions + s.calls;
  if (totalActions > 0 && s.calls / totalActions > 0.45 && s.rating < 4.0) {
    issues.push({ level: "critical", message: `Call volume unusually high relative to other actions (${s.calls} calls) — may indicate unresolved complaints` });
  }

  return issues;
}

export function computeStatus(issues: Issue[]): Status {
  if (issues.some((i) => i.level === "critical")) return "critical";
  if (issues.length > 0) return "warn";
  return "healthy";
}
