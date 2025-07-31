import prisma from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma-client";

/**
 * Generic CRUD operations for Prisma models
 */
export class CrudService<T extends keyof typeof prisma> {
  constructor(private model: T) {}

  /**
   * Find many records with optional filters and includes
   */
  async findMany(options: {
    where?: any;
    include?: any;
    select?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  } = {}) {
    const { where, include, select, orderBy, take, skip } = options;
    return await (prisma[this.model] as any).findMany({
      where,
      include,
      select,
      orderBy,
      take,
      skip,
    });
  }

  /**
   * Find unique record by ID
   */
  async findById(id: string, include?: any, select?: any) {
    return await (prisma[this.model] as any).findUnique({
      where: { id },
      include,
      select,
    });
  }

  /**
   * Find unique record by custom where clause
   */
  async findUnique(where: any, include?: any, select?: any) {
    return await (prisma[this.model] as any).findUnique({
      where,
      include,
      select,
    });
  }

  /**
   * Create a new record
   */
  async create(data: any, include?: any) {
    return await (prisma[this.model] as any).create({
      data,
      include,
    });
  }

  /**
   * Update a record by ID
   */
  async updateById(id: string, data: any, include?: any) {
    return await (prisma[this.model] as any).update({
      where: { id },
      data,
      include,
    });
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id: string) {
    return await (prisma[this.model] as any).delete({
      where: { id },
    });
  }

  /**
   * Delete many records
   */
  async deleteMany(where: any) {
    return await (prisma[this.model] as any).deleteMany({
      where,
    });
  }

  /**
   * Count records
   */
  async count(where?: any) {
    return await (prisma[this.model] as any).count({
      where,
    });
  }

  /**
   * Check if record exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }
}

/**
 * Common Prisma query patterns
 */
export const commonIncludes = {
  // Client includes
  clientWithRelations: {
    invoices: true,
    orders: {
      include: {
        samples: true,
        orderItems: true,
      }
    },
  },

  // Order includes
  orderWithDetails: {
    client: true,
    samples: {
      include: {
        testResults: true,
      }
    },
    orderItems: {
      include: {
        agroTest: {
          include: {
            testParameter: true
          }
        },
        orderTestParameters: {
          include: {
            testParameter: {
              include: {
                pricing: true
              }
            }
          }
        }
      }
    },
    invoice: true,
    report: true,
  },

  // Sample includes
  sampleWithResults: {
    testResults: {
      include: {
        testParameter: true,
      }
    },
    order: {
      include: {
        client: true,
      }
    },
  },

  // Report includes
  reportWithDetails: {
    client: true,
    order: {
      include: {
        samples: {
          include: {
            testResults: {
              include: {
                testParameter: true,
              }
            }
          }
        }
      }
    },
    invoice: true,
  },

  // Invoice includes
  invoiceWithDetails: {
    client: true,
    order: {
      include: {
        orderItems: {
          include: {
            agroTest: true,
          }
        }
      }
    },
  },
} as const;

/**
 * Reusable services for common entities
 */
export const clientService = new CrudService('client');
export const orderService = new CrudService('order');
export const sampleService = new CrudService('sample');
export const reportService = new CrudService('report');
export const invoiceService = new CrudService('invoice');
export const agroTestService = new CrudService('agrotest');
export const testParameterService = new CrudService('testParameter');
export const userService = new CrudService('user');

/**
 * Transaction utilities
 */
export async function executeTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(operations);
}

/**
 * Bulk operations
 */
export async function bulkCreate<T>(
  model: keyof typeof prisma,
  data: T[]
): Promise<any> {
  return await (prisma[model] as any).createMany({
    data,
    skipDuplicates: true,
  });
}

export async function bulkUpdate<T>(
  model: keyof typeof prisma,
  updates: Array<{ where: any; data: T }>
): Promise<any[]> {
  return await Promise.all(
    updates.map(({ where, data }) =>
      (prisma[model] as any).updateMany({
        where,
        data,
      })
    )
  );
}

/**
 * Soft delete utility (if you have deletedAt fields)
 */
export async function softDelete(
  model: keyof typeof prisma,
  where: any
): Promise<any> {
  return await (prisma[model] as any).updateMany({
    where: {
      ...where,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}
