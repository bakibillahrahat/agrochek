import React from 'react';
import { AgroTest } from '@/app/types/agrotest';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface TestListProps {
  tests: AgroTest[];
  onEdit: (test: AgroTest) => void;
  onDelete: (testId: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  selectedTests: string[];
}

export const TestList: React.FC<TestListProps> = ({
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
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTests.length === tests.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">Select All</span>
            </div>
          </div>
          <div className="space-y-2">
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedTests.includes(test.id)}
                    onCheckedChange={(checked) => handleSelectTest(test.id, checked as boolean)}
                  />
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-500">{test.sampleType}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">
                    {test.testParameter.length} parameters
                  </div>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 