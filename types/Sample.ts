import { SampleType, SampleStatus, SoilCategory, ComparisonType, AnalysisType } from "@/lib/generated/prisma-client";

export interface Sample {
    id: string;
    orderId: string;
    orderItemId: string;
    sampleIdNumber: string;
    collectionDate: Date;
    sampleType: SampleType;
    collectionLocation: string | null;
    cropType: string | null;
    bunot: string | null;
    manchitroUnit: number | null;
    vumiSrini: string | null;
    status: SampleStatus;
    createdAt: Date;
    updatedAt: Date;
    reportId: string | null;
    order: {
      client: {
        name: string;
        phone: string;
      };
    };
    orderItem: {
      id: string;
      agroTest: {
        id: string;
        name: string;
        sampleType: SampleType;
      };
      orderTestParameters: Array<{
        id: string;
        testParameter: {
          id: string;
          name: string;
          createdAt: Date;
          updatedAt: Date;
          agroTestID: string;
          unit: string | null;
          analysisType: AnalysisType | null;
          comparisonRules: {
            min: number | null;
            max: number | null;
            type: ComparisonType;
            soilCategory: SoilCategory | null;
            interpretation: string | null;
          }[];
        }
      }>;
    };
    testResults: Array<{
      id: string;
      value: number | null;
      interpretation: string | null;
      wetlandInterpretation: string | null;
      uplandInterpretation: string | null;
      testParamater: {
        id: string;
        name: string;
        unit: string | null;
        comparisonRules: {
          min: number | null;
          max: number | null;
          type: ComparisonType;
          soilCategory: SoilCategory | null;
          interpretation: string | null;
        }[];
      };
    }>;
  }