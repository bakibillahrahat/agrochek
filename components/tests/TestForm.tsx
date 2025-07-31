"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientType, SampleType } from "@/lib/generated/prisma-client";
// import { SampleType, ClientType } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sampleType: z.nativeEnum(SampleType),
  testParameters: z.array(
    z.object({
      name: z.string().min(1, "Parameter name is required"),
      soilCategory: z.string().min(1, "Soil category is required"),
      unit: z.string().min(1, "Unit is required"),
      comparisonRules: z.array(
        z.object({
          min: z.number(),
          max: z.number(),
          interpretation: z.string().min(1, "Interpretation is required"),
        })
      ),
      pricing: z.array(
        z.object({
          clientType: z.nativeEnum(ClientType),
          price: z.number().min(0, "Price must be non-negative"),
        })
      ),
    })
  ),
});

type TestFormData = z.infer<typeof formSchema>;

interface Test {
  id: string;
  name: string;
  sampleType: SampleType;
  testParameters: {
    id: string;
    name: string;
    soilCategory: string;
    unit: string;
    comparisonRules: {
      id: string;
      min: number;
      max: number;
      interpretation: string;
    }[];
    pricing: {
      id: string;
      clientType: ClientType;
      price: number;
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface TestFormProps {
  mode: "create" | "edit";
  initialData?: Test;
  onSubmit: (data: TestFormData) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export function TestForm({
  mode,
  initialData,
  onSubmit,
  open,
  onOpenChange,
  isLoading = false,
}: TestFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [editingParameterIndex, setEditingParameterIndex] = useState<number | null>(null);

  const form = useForm<TestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      sampleType: initialData.sampleType,
      testParameters: initialData.testParameters.map(param => ({
        name: param.name,
        soilCategory: param.soilCategory,
        unit: param.unit,
        comparisonRules: param.comparisonRules,
        pricing: param.pricing,
      })),
    } : {
      name: "",
      sampleType: SampleType.SOIL,
      testParameters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testParameters",
  });

  const handleSubmit = async (data: TestFormData) => {
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

  const handleAddParameter = () => {
    setEditingParameterIndex(null);
    setIsParameterModalOpen(true);
  };

  const handleEditParameter = (index: number) => {
    setEditingParameterIndex(index);
    setIsParameterModalOpen(true);
  };

  const handleParameterSubmit = (parameterData: any) => {
    if (editingParameterIndex !== null) {
      // Update existing parameter
      form.setValue(`testParameters.${editingParameterIndex}`, parameterData);
    } else {
      // Add new parameter
      append(parameterData);
    }
    setIsParameterModalOpen(false);
    setEditingParameterIndex(null);
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
              name="sampleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sample type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SampleType.SOIL}>Soil</SelectItem>
                      <SelectItem value={SampleType.WATER}>Water</SelectItem>
                      <SelectItem value={SampleType.FERTILIZER}>Fertilizer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Parameter {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Name: {field.name}</p>
                      <p className="text-sm text-gray-500">Category: {field.soilCategory}</p>
                      <p className="text-sm text-gray-500">Unit: {field.unit}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditParameter(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddParameter}
              className="w-full border-dashed border-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Parameter
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
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-800">
                {currentStep === 1 ? "Basic Information" : "Test Parameters"}
              </h3>
              <p className="text-sm text-gray-600">
                {currentStep === 1
                  ? "Enter the basic information for the test"
                  : "Add test parameters and their configurations"}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of 2
              </span>
              <Progress value={(currentStep / 2) * 100} className="w-24" />
            </div>
          </div>

          {renderStep()}

          <div className="flex justify-between pt-6 border-t">
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
                  mode === "create" ? "Create Test" : "Update Test"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );

  const ParameterForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData?: any }) => {
    const parameterForm = useForm({
      defaultValues: initialData || {
        name: "",
        soilCategory: "",
        unit: "",
        comparisonRules: [
          {
            min: 0,
            max: 0,
            interpretation: "",
          },
        ],
        pricing: [
          {
            clientType: ClientType.FARMER,
            price: 0,
          },
        ],
      },
    });

    const handleParameterFormSubmit = async (data: any) => {
      try {
        await onSubmit(data);
      } catch (error) {
        console.error("Error submitting parameter form:", error);
      }
    };

    return (
      <Form {...parameterForm}>
        <form onSubmit={parameterForm.handleSubmit(handleParameterFormSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={parameterForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter parameter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={parameterForm.control}
              name="soilCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soil Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter soil category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={parameterForm.control}
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Comparison Rules</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentRules = parameterForm.getValues("comparisonRules");
                    parameterForm.setValue("comparisonRules", [
                      ...currentRules,
                      { min: 0, max: 0, interpretation: "" },
                    ]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              {parameterForm.watch("comparisonRules").map((rule: any, index: number) => (
                <div key={index} className="grid grid-cols-3 gap-4">
                  <FormField
                    control={parameterForm.control}
                    name={`comparisonRules.${index}.min`}
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
                    control={parameterForm.control}
                    name={`comparisonRules.${index}.max`}
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
                  <FormField
                    control={parameterForm.control}
                    name={`comparisonRules.${index}.interpretation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interpretation</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter interpretation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Pricing</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentPricing = parameterForm.getValues("pricing");
                    parameterForm.setValue("pricing", [
                      ...currentPricing,
                      { clientType: ClientType.FARMER, price: 0 },
                    ]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price
                </Button>
              </div>

              {parameterForm.watch("pricing").map((price: any, index: number) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <FormField
                    control={parameterForm.control}
                    name={`pricing.${index}.clientType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ClientType.FARMER}>Farmer</SelectItem>
                            <SelectItem value={ClientType.GOVT_ORG}>Government Organization</SelectItem>
                            <SelectItem value={ClientType.PRIVATE}>Private</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parameterForm.control}
                    name={`pricing.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsParameterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingParameterIndex !== null ? "Update Parameter" : "Add Parameter"}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  if (mode === "edit") {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Test</DialogTitle>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
        <Dialog open={isParameterModalOpen} onOpenChange={setIsParameterModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingParameterIndex !== null ? "Edit Parameter" : "Add Parameter"}
              </DialogTitle>
            </DialogHeader>
            <ParameterForm
              onSubmit={handleParameterSubmit}
              initialData={editingParameterIndex !== null ? form.getValues(`testParameters.${editingParameterIndex}`) : undefined}
            />
          </DialogContent>
        </Dialog>
      </>
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
          "Add Test"
        )}
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Test</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
      <Dialog open={isParameterModalOpen} onOpenChange={setIsParameterModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParameterIndex !== null ? "Edit Parameter" : "Add Parameter"}
            </DialogTitle>
          </DialogHeader>
          <ParameterForm
            onSubmit={handleParameterSubmit}
            initialData={editingParameterIndex !== null ? form.getValues(`testParameters.${editingParameterIndex}`) : undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 