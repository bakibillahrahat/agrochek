"use client";

import { useState } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Minus, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { PricingForm } from "./pricing-form";
import { ClientType } from "@/lib/generated/prisma-client";
// import { ClientType, SampleType } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  testDefinitions: z.array(
    z.object({
      name: z.string().min(1, "Test name is required"),
      unit: z.string().min(1, "Unit is required"),
      idealValues: z.object({
        min: z.number(),
        max: z.number(),
      }),
      pricing: z.array(
        z.object({
          clientType: z.nativeEnum(ClientType),
          price: z.number().min(0, "Price must be non-negative"),
        })
      ),
    })
  ),
});

type FertilizerFormData = z.infer<typeof formSchema>;

interface Fertilizer {
  id: string;
  name: string;
  testDefinitions: {
    id: string;
    name: string;
    unit: string;
    idealValues: {
      min: number;
      max: number;
    } | null;
    pricing: {
      clientType: ClientType;
      price: number;
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface FertilizerFormProps {
  mode: "create" | "edit";
  initialData?: Fertilizer;
  onSubmit: (data: FertilizerFormData) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export function FertilizerForm({
  mode,
  initialData,
  onSubmit,
  open,
  onOpenChange,
  isLoading = false,
}: FertilizerFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<FertilizerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      testDefinitions: initialData.testDefinitions.map(test => ({
        name: test.name,
        unit: test.unit,
        idealValues: test.idealValues || { min: 0, max: 0 },
        pricing: test.pricing,
      })),
    } : {
      name: "",
      testDefinitions: [
        {
          name: "",
          unit: "",
          idealValues: {
            min: 0,
            max: 0,
          },
          pricing: [
            {
              clientType: ClientType.FARMER,
              price: 0,
            },
          ],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testDefinitions",
  });

  const handleSubmit = async (data: FertilizerFormData) => {
    try {
      await onSubmit(data);
      if (mode === "create") {
        form.reset();
        setCurrentStep(1);
        setIsDialogOpen(false);
      } else {
        onOpenChange?.(false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fertilizer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter fertilizer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Test Definition {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`testDefinitions.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter test name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`testDefinitions.${index}.unit`}
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`testDefinitions.${index}.idealValues.min`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter min value"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`testDefinitions.${index}.idealValues.max`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter max value"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`testDefinitions.${index}.pricing`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing</FormLabel>
                        <FormControl>
                          <PricingForm
                            control={form.control}
                            name={`testDefinitions.${index}.pricing`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  name: "",
                  unit: "",
                  idealValues: {
                    min: 0,
                    max: 0,
                  },
                  pricing: [
                    {
                      clientType: ClientType.FARMER,
                      price: 0,
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Test Definition
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">
                {currentStep === 1 ? "Basic Information" : "Test Definitions"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentStep === 1
                  ? "Enter the basic information for the fertilizer"
                  : "Add test definitions for the fertilizer"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of 2
              </span>
              <Progress value={(currentStep / 2) * 100} className="w-24" />
            </div>
          </div>

          {renderStep()}

          <div className="flex justify-between pt-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}
            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={isLoading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Adding..." : "Updating..."}
                  </>
                ) : (
                  mode === "create" ? "Create Fertilizer" : "Update Fertilizer"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );

  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fertilizer</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Fertilizer"
        )}
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Fertilizer</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    </>
  );
} 