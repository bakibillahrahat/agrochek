import { ComparisonType, SampleType, SoilCategory } from "@/lib/generated/prisma-client";
import { ComparisonRule } from "@/app/types/agrotest";

export interface TestResult {
  value: number | null;
  wetlandValue?: number | null;
  uplandValue?: number | null;
}

export interface ComparisonResult {
  parameterName: string;
  unit: string | null;
  value: number | null;
  interpretation: string | null;
  status: 'NORMAL' | 'ABNORMAL' | 'UNKNOWN';
}

export function compareTestResult(
  result: TestResult,
  rules: ComparisonRule[],
  sampleType: SampleType,
  soilCategory?: SoilCategory | null
): ComparisonResult {
  // Determine which value to use based on sample type and soil category
  let value: number | null = null;
  
  if (sampleType === SampleType.SOIL) {
    if (soilCategory === 'BOTH') {
      value = result.value;
    } else if (soilCategory === 'WETLAND') {
      value = result.wetlandValue ?? null;
    } else if (soilCategory === 'UPLAND') {
      value = result.uplandValue ?? null;
    }
  } else {
    value = result.value;
  }

  // If no value is available, return unknown status
  if (value === null) {
    return {
      parameterName: '',
      unit: null,
      value: null,
      interpretation: null,
      status: 'UNKNOWN'
    };
  }

  // Compare with rules
  for (const rule of rules) {
    const matches = compareWithRule(value, rule);
    if (matches) {
      return {
        parameterName: '',
        unit: null,
        value,
        interpretation: rule.interpretation,
        status: 'NORMAL'
      };
    }
  }

  // If no rule matched, mark as abnormal
  return {
    parameterName: '',
    unit: null,
    value,
    interpretation: 'Value outside normal range',
    status: 'ABNORMAL'
  };
}

function compareWithRule(value: number, rule: ComparisonRule): boolean {
  switch (rule.type) {
    case ComparisonType.BETWEEN:
      return value >= rule.min && value <= rule.max;
    case ComparisonType.GREATER_THAN:
      return value > rule.min;
    case ComparisonType.LESS_THAN:
      return value < rule.max;
    default:
      return false;
  }
}

export function compareTestResults(
  testResults: TestResult[],
  testParameters: Array<{
    id: string;
    name: string;
    unit: string | null;
    soilCategory?: SoilCategory | null;
    comparisonRules: ComparisonRule[];
  }>,
  sampleType: SampleType
): ComparisonResult[] {
  return testResults.map((result, index) => {
    const parameter = testParameters[index];
    if (!parameter) return {
      parameterName: 'Unknown Parameter',
      unit: null,
      value: result.value,
      interpretation: 'Parameter not found',
      status: 'UNKNOWN'
    };

    const comparison = compareTestResult(result, parameter.comparisonRules, sampleType, parameter.soilCategory);
    return {
      ...comparison,
      parameterName: parameter.name,
      unit: parameter.unit
    };
  });
} 