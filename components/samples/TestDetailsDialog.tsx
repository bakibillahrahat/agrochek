import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestDetailsTable } from "./TestDetailsTable";
import { SampleType, SoilCategory } from "@/lib/generated/prisma-client";

interface TestDetails {
  parameters: Array<{
    id: string;
    name: string;
    unit: string | null;
    comparisonRules: {
      soilCategory: SoilCategory | null;
    }[];
  }>;
  results: Array<{
    id: string;
    name: string;
    value: number | null;
  }>;
  sampleType: SampleType;
}

interface TestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: {
    parameters: Array<{
      id: string;
      name: string;
      unit: string | null;
      comparisonRules: {
        soilCategory: SoilCategory | null;
      }[];
    }>
    results: Array<{
      id: string;
      name: string;
      value: number | null;
    }>
    sampleType: SampleType
  } | null
}

export function TestDetailsDialog({ open, onOpenChange, details }: TestDetailsDialogProps) {
  if (!details) return null;

  // Combine parameters and results into a single array
  const combinedDetails = details.parameters.map(param => {
    const result = details.results.find(r => r.name === param.name);
    return {
      id: param.id,
      name: param.name,
      unit: param.unit,
      comparisonRules: param.comparisonRules,
      value: result?.value ?? null
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[1200px] overflow-x-auto">
        <DialogHeader>
          <DialogTitle>Test Details</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
          <TestDetailsTable details={combinedDetails} sampleType={details.sampleType} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 