import React, { useEffect } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date';
  placeholder?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
}

export interface GenericFormProps<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  fields: FormFieldConfig[];
  onSubmit: (data: T) => void;
  submitLabel?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

/**
 * Generic form component
 */
export function GenericForm<T extends Record<string, any>>({
  form,
  fields,
  onSubmit,
  submitLabel = 'Submit',
  isLoading = false,
  children,
}: GenericFormProps<T>) {
  const renderField = (field: FormFieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name as any}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === 'select' ? (
                <Select
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                  disabled={field.disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  {...formField}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                />
              ) : (
                <Input
                  {...formField}
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  value={formField.value || ''}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(renderField)}
        {children}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Loading...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

/**
 * Generic dialog form component
 */
export interface GenericDialogFormProps<T extends Record<string, any>>
  extends GenericFormProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  data?: T | null;
  mode?: 'create' | 'edit';
}

export function GenericDialogForm<T extends Record<string, any>>({
  open,
  onClose,
  title,
  description,
  data,
  mode = 'create',
  form,
  fields,
  onSubmit,
  submitLabel,
  isLoading = false,
  children,
}: GenericDialogFormProps<T>) {
  // Reset form when dialog opens/closes or data changes
  useEffect(() => {
    if (open && data && mode === 'edit') {
      form.reset(data);
    } else if (open && mode === 'create') {
      form.reset();
    }
  }, [open, data, mode, form]);

  const handleSubmit = (formData: T) => {
    onSubmit(formData);
    if (mode === 'create') {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <GenericForm
          form={form}
          fields={fields}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel={submitLabel || (mode === 'edit' ? 'Update' : 'Create')}
        >
          {children}
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Higher-order component for form creation
 */
export function createFormComponent<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  fields: FormFieldConfig[],
  defaultValues?: Partial<T>
) {
  return function FormComponent({
    onSubmit,
    initialData,
    isLoading,
    submitLabel,
    children,
  }: {
    onSubmit: (data: T) => void;
    initialData?: T | null;
    isLoading?: boolean;
    submitLabel?: string;
    children?: React.ReactNode;
  }) {
    const form = useForm<T>({
      resolver: zodResolver(schema),
      defaultValues: defaultValues as any,
    });

    useEffect(() => {
      if (initialData) {
        form.reset(initialData);
      }
    }, [initialData, form]);

    return (
      <GenericForm
        form={form}
        fields={fields}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        isLoading={isLoading}
      >
        {children}
      </GenericForm>
    );
  };
}

/**
 * Common form field configurations
 */
export const commonFormFields = {
  name: {
    name: 'name',
    label: 'Name',
    type: 'text' as const,
    placeholder: 'Enter name',
    required: true,
  },
  email: {
    name: 'email',
    label: 'Email',
    type: 'email' as const,
    placeholder: 'Enter email address',
    required: true,
  },
  phone: {
    name: 'phone',
    label: 'Phone',
    type: 'text' as const,
    placeholder: 'Enter phone number',
    required: true,
  },
  address: {
    name: 'address',
    label: 'Address',
    type: 'textarea' as const,
    placeholder: 'Enter address',
  },
  description: {
    name: 'description',
    label: 'Description',
    type: 'textarea' as const,
    placeholder: 'Enter description',
  },
  status: (options: Array<{ value: string; label: string }>) => ({
    name: 'status',
    label: 'Status',
    type: 'select' as const,
    options,
    required: true,
  }),
  clientType: {
    name: 'clientType',
    label: 'Client Type',
    type: 'select' as const,
    options: [
      { value: 'FARMER', label: 'Farmer' },
      { value: 'GOVT_ORG', label: 'Government Organization' },
      { value: 'PRIVATE', label: 'Private Organization' },
    ],
    required: true,
  },
  sampleType: {
    name: 'sampleType',
    label: 'Sample Type',
    type: 'select' as const,
    options: [
      { value: 'SOIL', label: 'Soil' },
      { value: 'WATER', label: 'Water' },
      { value: 'FERTILIZER', label: 'Fertilizer' },
    ],
    required: true,
  },
  collectionDate: {
    name: 'collectionDate',
    label: 'Collection Date',
    type: 'date' as const,
    required: true,
  },
  cropType: {
    name: 'cropType',
    label: 'Crop Type',
    type: 'text' as const,
    placeholder: 'Enter crop type',
    required: true,
  },
  unitPrice: {
    name: 'unitPrice',
    label: 'Unit Price',
    type: 'number' as const,
    placeholder: '0.00',
    required: true,
  },
  quantity: {
    name: 'quantity',
    label: 'Quantity',
    type: 'number' as const,
    placeholder: '1',
    required: true,
  },
} as const;
