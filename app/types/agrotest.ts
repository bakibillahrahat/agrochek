import { ClientType, SampleType, ComparisonType, SoilCategory, AnalysisType } from "@/lib/generated/prisma-client";

export interface ComparisonRule {
  id?: string;
  min: number;
  max: number;
  interpretation: string;
  type: ComparisonType;
  soilCategory?: SoilCategory | null;
}

export interface Pricing {
  id: string;
  clientType: ClientType;
  price: number;
}

export interface TestParameter {
  id: string;
  name: string;
  soilCategory: string; // This was in the previous version of the file, keeping it for now.
  unit: string;
  analysisType?: AnalysisType | null; // Added analysisType back
  comparisonRules: ComparisonRule[];
  pricing: Pricing[];
}

export interface AgroTest {
  id: string;
  name: string;
  sampleType: SampleType;
  testParameter: TestParameter[];
  createdAt: Date;
  updatedAt: Date;
}