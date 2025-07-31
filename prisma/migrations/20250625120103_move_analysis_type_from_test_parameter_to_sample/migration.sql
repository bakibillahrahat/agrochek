/*
  Warnings:

  - You are about to drop the column `analysisType` on the `TestParameter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "analysisType" "AnalysisType";

-- AlterTable
ALTER TABLE "TestParameter" DROP COLUMN "analysisType";
