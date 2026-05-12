-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "brandUrl" TEXT NOT NULL,
    "brandName" TEXT,
    "industry" TEXT,
    "monthlyTraffic" INTEGER NOT NULL,
    "conversionRate" REAL NOT NULL,
    "aov" REAL NOT NULL,
    "existingBase" INTEGER NOT NULL,
    "repeatRate" REAL NOT NULL,
    "opp1Low" REAL NOT NULL,
    "opp1High" REAL NOT NULL,
    "opp2Low" REAL NOT NULL,
    "opp2High" REAL NOT NULL,
    "opp3Low" REAL NOT NULL,
    "opp3High" REAL NOT NULL,
    "totalLow" REAL NOT NULL,
    "totalHigh" REAL NOT NULL,
    "followUpSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandUrl" TEXT NOT NULL,
    "brandName" TEXT,
    "industry" TEXT,
    "monthlyTraffic" INTEGER NOT NULL,
    "conversionRate" REAL NOT NULL,
    "aov" REAL NOT NULL,
    "existingBase" INTEGER NOT NULL,
    "repeatRate" REAL NOT NULL,
    "opp1Low" REAL NOT NULL,
    "opp1High" REAL NOT NULL,
    "opp2Low" REAL NOT NULL,
    "opp2High" REAL NOT NULL,
    "opp3Low" REAL NOT NULL,
    "opp3High" REAL NOT NULL,
    "totalLow" REAL NOT NULL,
    "totalHigh" REAL NOT NULL,
    "emailCaptured" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
