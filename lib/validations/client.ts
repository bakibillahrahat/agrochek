import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
  clientType: z.enum(['FARMER', 'GOVT_ORG', 'PRIVATE']),
});

export type ClientFormData = z.infer<typeof clientSchema>; 