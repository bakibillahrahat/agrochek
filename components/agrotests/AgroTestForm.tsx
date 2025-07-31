'use client'

import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AgroTest } from '@/app/types/agrotest'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ClientType, SoilCategory, SampleType, AnalysisType } from '@/lib/generated/prisma-client'

// Add comparison type enum
const ComparisonType = {
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN: 'LESS_THAN',
  BETWEEN: 'BETWEEN',
} as const;

const comparisonRuleSchema = z.object({
  type: z.enum([ComparisonType.GREATER_THAN, ComparisonType.LESS_THAN, ComparisonType.BETWEEN]),
  min: z.coerce.number(),
  max: z.coerce.number(),
  interpretation: z.string().min(1, 'Interpretation is required'),
  soilCategory: z.nativeEnum(SoilCategory).optional(),
})

const pricingSchema = z.object({
  clientType: z.nativeEnum(ClientType),
  price: z.coerce.number().min(0, 'Price must be positive'),
})

const testParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  unit: z.string().min(1, 'Unit is required'),
  analysisType: z.nativeEnum(AnalysisType).nullable().optional(), // Allow null values
  comparisonRules: z.array(comparisonRuleSchema),
  pricing: z.array(pricingSchema),
})

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sampleType: z.nativeEnum(SampleType),
  testParameters: z.array(testParameterSchema)
    .min(1, 'At least one test parameter is required'),
})

type FormValues = z.infer<typeof formSchema>

interface AgroTestFormProps {
  mode: "create" | "edit"
  initialData?: AgroTest
  onSubmit: (data: FormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isLoading?: boolean
}

export default function AgroTestForm({
  mode,
  initialData,
  onSubmit,
  open = false,
  onOpenChange,
  isLoading = false,
}: AgroTestFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      sampleType: initialData?.sampleType || SampleType.SOIL,
      testParameters: initialData?.testParameter.map(param => ({
        name: param.name,
        unit: param.unit || '',
        analysisType: param.analysisType || undefined, // Added analysisType back
        comparisonRules: param.comparisonRules.map(rule => ({
          type: rule.type,
          min: rule.min || 0,
          max: rule.max || 0,
          interpretation: rule.interpretation || '',
          soilCategory: rule.soilCategory || undefined,
        })),
        pricing: param.pricing.map(price => ({
          clientType: price.clientType,
          price: price.price || 0,
        })),
      })) || [],
    },
  })

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        sampleType: initialData.sampleType,
        testParameters: initialData.testParameter.map(param => ({
          name: param.name,
          unit: param.unit || '',
          analysisType: param.analysisType || undefined, // Added analysisType back
          comparisonRules: param.comparisonRules.map(rule => ({
            type: rule.type,
            min: rule.min || 0,
            max: rule.max || 0,
            interpretation: rule.interpretation || '',
            soilCategory: rule.soilCategory || undefined,
          })),
          pricing: param.pricing.map(price => ({
            clientType: price.clientType,
            price: price.price || 0,
          })),
        })),
      })
    }
  }, [initialData, form])

  // Clear analysisType for all test parameters when sample type changes to SOIL or WATER
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'sampleType' && (value.sampleType === SampleType.SOIL || value.sampleType === SampleType.WATER)) {
        // Clear analysisType for all test parameters
        const currentParams = form.getValues('testParameters');
        const updatedParams = currentParams.map(param => ({
          ...param,
          analysisType: null
        }));
        form.setValue('testParameters', updatedParams);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const { fields: testParameterFields, append: appendTestParameter, remove: removeTestParameter } = useFieldArray({
    control: form.control,
    name: "testParameters",
  })

  const handleSubmit = async (values: FormValues) => {
    try {
      // Process the form values
      const processedValues = {
        ...values,
        testParameters: values.testParameters.map(param => ({
          ...param,
          // Only keep analysisType for FERTILIZER sample type
          analysisType: values.sampleType === SampleType.FERTILIZER ? param.analysisType : null,
          comparisonRules: param.comparisonRules.map(rule => ({
            ...rule,
            soilCategory: rule.soilCategory || undefined,
          })),
        })),
      }
      console.log('Submitting form values:', processedValues)
      await onSubmit(processedValues)
      form.reset()
      toast.success(mode === 'create' ? 'Test created successfully' : 'Test updated successfully')
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit form')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Agro Test' : 'Edit Agro Test'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
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

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Test Parameters</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSampleType = form.watch('sampleType');
                    appendTestParameter({
                      name: '',
                      unit: '',
                      analysisType: currentSampleType === SampleType.FERTILIZER ? AnalysisType.ROUTINE : null,
                      comparisonRules: [],
                      pricing: [],
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Parameter
                </Button>
              </div>

              {testParameterFields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Parameter {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTestParameter(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Adjusted grid for new field */}
                        <FormField
                          control={form.control}
                          name={`testParameters.${index}.name`}
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
                          control={form.control}
                          name={`testParameters.${index}.unit`}
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

                        {/* Analysis Type - Only show for FERTILIZER sample type */}
                        {form.watch('sampleType') === SampleType.FERTILIZER && (
                          <FormField
                            control={form.control}
                            name={`testParameters.${index}.analysisType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Analysis Type</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    // Convert "NONE" to null for the form
                                    field.onChange(value === "NONE" ? null : value);
                                  }}
                                  defaultValue={field.value || "NONE"}
                                  value={field.value || "NONE"} // Convert null to "NONE" for the Select
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select analysis type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="NONE">Not chosen</SelectItem>
                                    {Object.values(AnalysisType).map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {/* Comparison Rules */}
                      <div className="flex flex-col gap-2">
                        <h5 className="font-medium">Comparison Rules</h5>
                        <div className="flex flex-col gap-2">
                          {form.watch(`testParameters.${index}.comparisonRules`)?.map((_, ruleIndex) => (
                            <div key={ruleIndex} className="flex gap-2">
                              {form.watch('sampleType') === SampleType.SOIL && (
                                <FormField
                                  control={form.control}
                                  name={`testParameters.${index}.comparisonRules.${ruleIndex}.soilCategory`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value || undefined}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select soil category" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value={SoilCategory.BOTH}>Both</SelectItem>
                                          <SelectItem value={SoilCategory.UPLAND}>Upland</SelectItem>
                                          <SelectItem value={SoilCategory.WETLAND}>Wetland</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                              <FormField
                                control={form.control}
                                name={`testParameters.${index}.comparisonRules.${ruleIndex}.type`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select comparison type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={ComparisonType.GREATER_THAN}>Greater Than</SelectItem>
                                        <SelectItem value={ComparisonType.LESS_THAN}>Less Than</SelectItem>
                                        <SelectItem value={ComparisonType.BETWEEN}>Between</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch(`testParameters.${index}.comparisonRules.${ruleIndex}.type`) === ComparisonType.BETWEEN ? (
                                <>
                                  <FormField
                                    control={form.control}
                                    name={`testParameters.${index}.comparisonRules.${ruleIndex}.min`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormLabel className="sr-only">Minimum Value</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="Minimum Value (for range)"
                                            {...field}
                                            value={isNaN(field.value) ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`testParameters.${index}.comparisonRules.${ruleIndex}.max`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormLabel className="sr-only">Maximum Value</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder="Maximum Value (for range)"
                                            {...field}
                                            value={isNaN(field.value) ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </>
                              ) : form.watch(`testParameters.${index}.comparisonRules.${ruleIndex}.type`) === ComparisonType.GREATER_THAN ? (
                                <FormField
                                  control={form.control}
                                  name={`testParameters.${index}.comparisonRules.${ruleIndex}.min`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormLabel className="sr-only">Greater Than Value</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="Value Must Be Greater Than"
                                          {...field}
                                          value={isNaN(field.value) ? '' : field.value}
                                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : form.watch(`testParameters.${index}.comparisonRules.${ruleIndex}.type`) === ComparisonType.LESS_THAN ? (
                                <FormField
                                  control={form.control}
                                  name={`testParameters.${index}.comparisonRules.${ruleIndex}.max`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormLabel className="sr-only">Less Than Value</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="Value Must Be Less Than"
                                          {...field}
                                          value={isNaN(field.value) ? '' : field.value}
                                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : null}
                              <FormField
                                control={form.control}
                                name={`testParameters.${index}.comparisonRules.${ruleIndex}.interpretation`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel className="sr-only">Interpretation</FormLabel>
                                    <FormControl>
                                      {form.watch('sampleType') === SampleType.FERTILIZER ? (
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value || undefined}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select interpretation" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ভেজালমুক্ত">ভেজালমুক্ত</SelectItem>
                                            <SelectItem value="ভেজাল">ভেজাল</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input placeholder="Interpretation" {...field} />
                                      )}
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentRules = form.getValues(`testParameters.${index}.comparisonRules`) || [];
                              const currentSampleType = form.watch('sampleType');
                              const defaultInterpretation = currentSampleType === SampleType.FERTILIZER ? 'ভেজালমুক্ত' : '';
                              
                              form.setValue(`testParameters.${index}.comparisonRules`, [
                                ...currentRules,
                                { 
                                  type: ComparisonType.BETWEEN, 
                                  min: 0, 
                                  max: 0, 
                                  interpretation: defaultInterpretation,
                                  soilCategory: currentSampleType === SampleType.SOIL ? SoilCategory.BOTH : undefined
                                }
                              ]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rule
                          </Button>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex flex-col gap-2">
                        <h5 className="font-medium">Pricing</h5>
                        <div className="flex flex-col gap-2">
                          {form.watch(`testParameters.${index}.pricing`)?.map((_, priceIndex) => (
                            <div key={priceIndex} className="flex gap-2">
                              <FormField
                                control={form.control}
                                name={`testParameters.${index}.pricing.${priceIndex}.clientType`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select
                                      onValueChange={(value) => {
                                        // Get all current pricing entries for this test parameter
                                        const currentPricing = form.getValues(`testParameters.${index}.pricing`);
                                        
                                        // Check if this client type already exists
                                        const isDuplicate = currentPricing.some(
                                          (p, i) => i !== priceIndex && p.clientType === value
                                        );

                                        if (isDuplicate) {
                                          toast.warning('This client type already exists. Selecting a different type.');
                                          
                                          // Find an available client type
                                          const availableTypes = Object.values(ClientType).filter(
                                            type => !currentPricing.some(p => p.clientType === type)
                                          );
                                          
                                          if (availableTypes.length > 0) {
                                            // Select the first available type
                                            field.onChange(availableTypes[0]);
                                          }
                                          return;
                                        }
                                        
                                        field.onChange(value);
                                      }}
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
                                control={form.control}
                                name={`testParameters.${index}.pricing.${priceIndex}.price`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="Price" 
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentPricing = form.getValues(`testParameters.${index}.pricing`) || [];
                              
                              // Get all used client types
                              const usedTypes = currentPricing.map(p => p.clientType);
                              
                              // Find the first available client type
                              const availableType = Object.values(ClientType).find(
                                type => !usedTypes.includes(type)
                              ) || ClientType.FARMER; // Fallback to FARMER if all types are used
                              
                              form.setValue(`testParameters.${index}.pricing`, [
                                ...currentPricing,
                                { clientType: availableType, price: 0 }
                              ]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Price
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}