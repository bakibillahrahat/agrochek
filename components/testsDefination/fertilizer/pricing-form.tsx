"use client";

import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { ClientType } from "@/lib/generated/prisma-client";
// import { ClientType } from "@prisma/client";

interface PricingFormProps {
  control: Control<any>;
  name: string;
}

export function PricingForm({ control, name }: PricingFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-4">
              <FormField
                control={control}
                name={`${name}.${index}.clientType`}
                render={({ field }) => (
                  <FormItem className="flex-1">
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
                control={control}
                name={`${name}.${index}.price`}
                render={({ field }) => (
                  <FormItem className="flex-1">
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

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                clientType: ClientType.FARMER,
                price: 0,
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pricing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 