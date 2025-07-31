import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SampleType } from "@/lib/generated/prisma-client";
import { SoilCategory } from "@/lib/generated/prisma-client";

interface TestDetail {
  id: string;
  name: string;
  unit: string | null;
  comparisonRules: {
    soilCategory: SoilCategory | null;
  }[];
  value: number | null;
}

interface TestDetailsTableProps {
  details: TestDetail[];
  sampleType: SampleType;
}

export function TestDetailsTable({ details, sampleType }: TestDetailsTableProps) {
  const isSoilSample = sampleType === SampleType.SOIL;

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parameter Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.map((detail) => {
              const soilCategory = detail.comparisonRules[0]?.soilCategory || 'BOTH';
              return (
                <TableRow key={detail.id}>
                  <TableCell>{detail.name}</TableCell>
                  <TableCell>{detail.unit || '-'}</TableCell>
                  <TableCell>{detail.value ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 