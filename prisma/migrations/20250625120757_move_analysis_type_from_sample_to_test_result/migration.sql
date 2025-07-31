/*
  Warnings:

  - You are about to drop the column `analysisType` on the `Sample` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "analysisType";

-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN     "analysisType" "AnalysisType";
