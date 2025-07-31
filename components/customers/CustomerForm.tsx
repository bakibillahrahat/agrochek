'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { clientSchema } from '@/lib/validations/client';

interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  clientType: 'FARMER' | 'GOVT_ORG' | 'PRIVATE';
  createdAt: Date;
}

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: Omit<Client, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  open: boolean;
}

export default function ClientForm({ client, onSubmit, onClose, open }: ClientFormProps) {
  const form = useForm<Omit<Client, 'id' | 'createdAt'>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      clientType: 'FARMER',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone,
        address: client.address || '',
        clientType: client.clientType,
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        clientType: 'FARMER',
      });
    }
  }, [client, form, open]);

  const handleSubmit = (data: Omit<Client, 'id' | 'createdAt'>) => {
    onSubmit(data);
    if (!client) {
      form.reset({
        name: '',
        phone: '',
        address: '',
        clientType: 'FARMER',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? 'Update Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FARMER">Farmer</SelectItem>
                      <SelectItem value="GOVT_ORG">Government Organization</SelectItem>
                      <SelectItem value="PRIVATE">Private Organization</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                {client ? 'Update Client' : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 