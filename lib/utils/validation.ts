import { z } from "zod";

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().min(1, "ID is required"),
  
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),

  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  search: z.object({
    query: z.string().min(1).optional(),
    field: z.string().optional(),
  }),
} as const;

/**
 * Entity-specific validation schemas
 */

// Client schemas
export const clientSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().optional(),
    clientType: z.enum(['FARMER', 'GOVT_ORG', 'PRIVATE']),
  }),

  update: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    address: z.string().optional(),
    clientType: z.enum(['FARMER', 'GOVT_ORG', 'PRIVATE']).optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),
} as const;

// Order schemas
export const orderSchemas = {
  create: z.object({
    sarokNumber: z.string().optional(),
    clientId: commonSchemas.id,
    operatorId: commonSchemas.id,
    totalAmount: z.number().positive(),
    orderItems: z.array(z.object({
      agroTestId: commonSchemas.id,
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      subtotal: z.number().positive(),
    })),
    samples: z.array(z.object({
      agroTestId: commonSchemas.id,
      collectionDate: z.string().datetime(),
      sampleType: z.enum(['SOIL', 'WATER', 'FERTILIZER']),
      collectionLocation: z.string().min(1),
      cropType: z.string().min(1),
      bunot: z.string().optional(),
      manchitroUnit: z.number().optional(),
      vumiSrini: z.string().optional(),
    })),
  }),

  update: z.object({
    sarokNumber: z.string().optional(),
    totalAmount: z.number().positive().optional(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']).optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),
} as const;

// Sample schemas
export const sampleSchemas = {
  create: z.object({
    orderId: commonSchemas.id,
    agroTestId: commonSchemas.id,
    collectionDate: z.string().datetime(),
    sampleType: z.enum(['SOIL', 'WATER', 'FERTILIZER']),
    collectionLocation: z.string().min(1),
    cropType: z.string().min(1),
    bunot: z.string().optional(),
    manchitroUnit: z.number().optional(),
    vumiSrini: z.string().optional(),
  }),

  update: z.object({
    status: z.enum(['COLLECTED', 'PROCESSING', 'TESTED', 'REPORTED']).optional(),
    collectionDate: z.string().datetime().optional(),
    collectionLocation: z.string().min(1).optional(),
    cropType: z.string().min(1).optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),
} as const;

// Test Parameter schemas
export const testParameterSchemas = {
  create: z.object({
    name: z.string().min(1),
    unit: z.string().min(1),
    description: z.string().optional(),
    sampleType: z.enum(['SOIL', 'WATER', 'FERTILIZER']),
    soilCategory: z.enum(['ACIDIC', 'NORMAL', 'ALKALINE']).optional(),
    analysisType: z.enum(['CHEMICAL', 'PHYSICAL', 'BIOLOGICAL']).optional(),
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    description: z.string().optional(),
    sampleType: z.enum(['SOIL', 'WATER', 'FERTILIZER']).optional(),
    soilCategory: z.enum(['ACIDIC', 'NORMAL', 'ALKALINE']).optional(),
    analysisType: z.enum(['CHEMICAL', 'PHYSICAL', 'BIOLOGICAL']).optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),
} as const;

// Report schemas
export const reportSchemas = {
  create: z.object({
    clientId: commonSchemas.id,
    orderId: commonSchemas.id,
    invoiceId: commonSchemas.id.optional(),
    reportNumber: z.string().min(1),
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'DELIVERED']).default('DRAFT'),
  }),

  update: z.object({
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'DELIVERED']).optional(),
    reportNumber: z.string().min(1).optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),
} as const;

// Invoice schemas
export const invoiceSchemas = {
  create: z.object({
    clientId: commonSchemas.id,
    orderId: commonSchemas.id,
    invoiceNumber: z.string().min(1),
    totalAmount: z.number().positive(),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  }),

  update: z.object({
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    totalAmount: z.number().positive().optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),
} as const;

// User schemas
export const userSchemas = {
  create: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).default('OPERATOR'),
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional(),
  }),

  params: z.object({
    id: commonSchemas.id,
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
} as const;

// Institute schemas
export const instituteSchemas = {
  create: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(10),
    email: z.string().email(),
    website: z.string().url().optional(),
    logo: z.string().optional(),
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    logo: z.string().optional(),
  }),
} as const;

/**
 * Utility function to validate against any schema
 */
export function validateSchema<T>(data: unknown, schema: z.ZodSchema<T>): T {
  return schema.parse(data);
}

/**
 * Type inference helpers
 */
export type ClientCreateInput = z.infer<typeof clientSchemas.create>;
export type ClientUpdateInput = z.infer<typeof clientSchemas.update>;
export type OrderCreateInput = z.infer<typeof orderSchemas.create>;
export type OrderUpdateInput = z.infer<typeof orderSchemas.update>;
export type SampleCreateInput = z.infer<typeof sampleSchemas.create>;
export type SampleUpdateInput = z.infer<typeof sampleSchemas.update>;
export type ReportCreateInput = z.infer<typeof reportSchemas.create>;
export type ReportUpdateInput = z.infer<typeof reportSchemas.update>;
export type InvoiceCreateInput = z.infer<typeof invoiceSchemas.create>;
export type InvoiceUpdateInput = z.infer<typeof invoiceSchemas.update>;
export type UserCreateInput = z.infer<typeof userSchemas.create>;
export type UserUpdateInput = z.infer<typeof userSchemas.update>;
export type InstituteCreateInput = z.infer<typeof instituteSchemas.create>;
export type InstituteUpdateInput = z.infer<typeof instituteSchemas.update>;
