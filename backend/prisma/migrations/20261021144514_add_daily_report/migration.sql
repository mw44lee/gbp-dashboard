-- CreateTable
CREATE TABLE "DailyReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportDate" TEXT NOT NULL,
    "totalStores" INTEGER NOT NULL,
    "totalCountries" INTEGER NOT NULL,
    "activeCount" INTEGER NOT NULL,
    "inactiveCount" INTEGER NOT NULL,
    "tempClosedCount" INTEGER NOT NULL,
    "permClosedCount" INTEGER NOT NULL,
    "changeNote" TEXT NOT NULL,
    "regionsJson" TEXT NOT NULL,
    "abnormalJson" TEXT NOT NULL,
    "sourceSubject" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportDate_key" ON "DailyReport"("reportDate");
