import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { SoilCategory } from "@/lib/generated/prisma-client";

interface ComparisonRule {
  id: string;
  min: number | null;
  max: number | null;
  interpretation: string;
  order: number;
  soilCategory: SoilCategory | null;
}

interface ComparisonRulesTableProps {
  rules: ComparisonRule[];
  testName: string;
}

export function ComparisonRulesTable({ rules, testName }: ComparisonRulesTableProps) {
  // Sort rules by order
  const sortedRules = [...rules].sort((a, b) => a.order - b.order);

  // Function to format the range display
  const formatRange = (rule: ComparisonRule) => {
    if (rule.min !== null && rule.max !== null) {
      return `${rule.min} - ${rule.max}`;
    } else if (rule.min !== null) {
      return `> ${rule.min}`;
    } else if (rule.max !== null) {
      return `< ${rule.max}`;
    }
    return "Any";
  };

  // Function to format soil category display
  const formatSoilCategory = (category: SoilCategory | null) => {
    if (!category) return "All Categories";
    return category.charAt(0) + category.slice(1).toLowerCase();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-700">
          <Eye className="h-4 w-4 mr-2" />
          Show Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comparison Rules - {testName}</DialogTitle>
          <DialogDescription>
            View the comparison rules and their interpretations for this soil test.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Range</TableHead>
                <TableHead>Soil Category</TableHead>
                <TableHead>Interpretation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {formatRange(rule)}
                  </TableCell>
                  <TableCell>{formatSoilCategory(rule.soilCategory)}</TableCell>
                  <TableCell>{rule.interpretation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
} 