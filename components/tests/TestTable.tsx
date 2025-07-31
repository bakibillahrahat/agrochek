import React from 'react';
import { AgroTest } from '@/app/types/agrotest';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TestTableProps {
  tests: AgroTest[];
  onEdit: (test: AgroTest) => void;
  onDelete: (testId: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  selectedTests: string[];
}

export const TestTable: React.FC<TestTableProps> = ({
  tests,
  onEdit,
  onDelete,
  onSelectionChange,
  selectedTests,
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(tests.map(test => test.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTest = (testId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTests, testId]);
    } else {
      onSelectionChange(selectedTests.filter(id => id !== testId));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedTests.length === tests.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Test Name</TableHead>
            <TableHead>Sample Type</TableHead>
            <TableHead>Parameters</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell>
                <Checkbox
                  checked={selectedTests.includes(test.id)}
                  onCheckedChange={(checked) => handleSelectTest(test.id, checked as boolean)}
                />
              </TableCell>
              <TableCell className="font-medium">{test.name}</TableCell>
              <TableCell>{test.sampleType}</TableCell>
              <TableCell>{test.testParameter.length} parameters</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(test)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(test.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 