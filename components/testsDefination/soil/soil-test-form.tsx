"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
// import { SoilCategory, ClientType } from "@prisma/client";
import { toast } from "sonner";
import { ComparisonRulesForm } from "./comparison-rules-form";
import { PricingForm } from "./pricing-form";
import { SoilCategory, ClientType } from "@/lib/generated/prisma-client";

// Define the form schema
const soilTestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  soilCategory: z.nativeEnum(SoilCategory).optional(),
  comparisonRules: z.array(
    z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      interpretation: z.string().min(1, "Interpretation is required"),
      order: z.number().min(0),
    })
  ).optional(),
  pricing: z.array(
    z.object({
      clientType: z.nativeEnum(ClientType),
      price: z.number().min(0, "Price must be positive"),
    })
  ).optional(),
});

type SoilTestFormValues = z.infer<typeof soilTestSchema>;

interface SoilTestFormProps {
  mode: "create" | "edit";
  initialData?: SoilTestFormValues;
  onSubmit: (data: SoilTestFormValues) => Promise<void>;
  trigger?: React.ReactNode;
}

export function SoilTestForm({
  mode,
  initialData,
  onSubmit,
  trigger,
}: SoilTestFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SoilTestFormValues>({
    resolver: zodResolver(soilTestSchema),
    defaultValues: initialData || {
      name: "",
      unit: "",
      soilCategory: undefined,
      comparisonRules: [],
      pricing: [],
    },
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.reset(initialData);
    }
  }, [mode, initialData, form]);

  const handleSubmit = async (data: SoilTestFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      setOpen(false);
      form.reset();
      toast.success(
        mode === "create"
          ? "Soil test created successfully"
          : "Soil test updated successfully"
      );
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            {mode === "create" ? "Create Soil Test" : "Edit Soil Test"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Soil Test" : "Edit Soil Test"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new soil test definition with comparison rules and pricing."
              : "Edit the existing soil test definition, its comparison rules and pricing."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter test name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter unit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="soilCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soil Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select soil category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SoilCategory).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="comparisonRules"
              render={() => <ComparisonRulesForm />}
            />

            <FormField
              control={form.control}
              name="pricing"
              render={() => <PricingForm />}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 