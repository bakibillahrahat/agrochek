import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';

// Cache configuration
export const CACHE_CONFIGS = {
  CLIENTS: {
    key: 'clients-list',
    revalidate: 300, // 5 minutes
    tags: ['clients']
  },
  ORDERS: {
    key: 'orders-list', 
    revalidate: 120, // 2 minutes
    tags: ['orders']
  },
  SAMPLES: {
    key: 'samples-list',
    revalidate: 180, // 3 minutes
    tags: ['samples']
  },
  AGROTESTS: {
    key: 'agrotests-list',
    revalidate: 600, // 10 minutes (changes infrequently)
    tags: ['agrotests']
  },
  REPORTS: {
    key: 'reports-list',
    revalidate: 300, // 5 minutes
    tags: ['reports']
  },
  INSTITUTE: {
    key: 'institute-info',
    revalidate: 3600, // 1 hour (rarely changes)
    tags: ['institute']
  }
};

// Cached query functions
export const getCachedClients = unstable_cache(
  async () => {
    return await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        clientType: true,
        createdAt: true,
        _count: {
          select: {
            invoices: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  [CACHE_CONFIGS.CLIENTS.key],
  CACHE_CONFIGS.CLIENTS
);

export const getCachedOrders = unstable_cache(
  async () => {
    return await prisma.order.findMany({
      select: {
        id: true,
        sarokNumber: true,
        orderDate: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            clientType: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        invoice: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paidAmount: true
          }
        },
        _count: {
          select: {
            samples: true,
            orderItems: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  [CACHE_CONFIGS.ORDERS.key],
  CACHE_CONFIGS.ORDERS
);

export const getCachedSamples = unstable_cache(
  async () => {
    return await prisma.sample.findMany({
      where: {
        order: {
          status: {
            not: 'PENDING'
          }
        }
      },
      select: {
        id: true,
        sampleIdNumber: true,
        collectionDate: true,
        sampleType: true,
        collectionLocation: true,
        cropType: true,
        status: true,
        createdAt: true,
        orderItem: {
          select: {
            id: true,
            agroTest: {
              select: {
                id: true,
                name: true,
                sampleType: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            sarokNumber: true,
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                clientType: true
              }
            }
          }
        },
        _count: {
          select: {
            testResults: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  [CACHE_CONFIGS.SAMPLES.key],
  CACHE_CONFIGS.SAMPLES
);

export const getCachedAgrotests = unstable_cache(
  async () => {
    return await prisma.agrotest.findMany({
      select: {
        id: true,
        name: true,
        sampleType: true,
        createdAt: true,
        updatedAt: true,
        testParameter: {
          select: {
            id: true,
            name: true,
            unit: true,
            analysisType: true,
            comparisonRules: {
              select: {
                id: true,
                min: true,
                max: true,
                interpretation: true,
                type: true,
                soilCategory: true
              }
            },
            pricing: {
              select: {
                id: true,
                clientType: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  },
  [CACHE_CONFIGS.AGROTESTS.key],
  CACHE_CONFIGS.AGROTESTS
);

export const getCachedReports = unstable_cache(
  async () => {
    return await prisma.report.findMany({
      select: {
        id: true,
        issueDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            clientType: true
          }
        },
        order: {
          select: {
            id: true,
            sarokNumber: true,
            orderDate: true
          }
        },
        _count: {
          select: {
            samples: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  [CACHE_CONFIGS.REPORTS.key],
  CACHE_CONFIGS.REPORTS
);

export const getCachedInstitute = unstable_cache(
  async () => {
    return await prisma.institute.findUnique({
      where: { id: 'singleton' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        prapok: true,
        issuedby: true
      }
    });
  },
  [CACHE_CONFIGS.INSTITUTE.key],
  CACHE_CONFIGS.INSTITUTE
);

// Cache invalidation helpers
export const revalidateClientCache = () => {
  // In production, use: revalidateTag('clients')
  console.log('Client cache invalidated');
};

export const revalidateOrderCache = () => {
  // In production, use: revalidateTag('orders')
  console.log('Order cache invalidated');
};

export const revalidateSampleCache = () => {
  // In production, use: revalidateTag('samples')
  console.log('Sample cache invalidated');
};

export const revalidateAgroTestCache = () => {
  // In production, use: revalidateTag('agrotests')
  console.log('AgroTest cache invalidated');
};

export const revalidateReportCache = () => {
  // In production, use: revalidateTag('reports')
  console.log('Report cache invalidated');
};

// Query optimization helpers
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FilterParams {
  search?: string;
  status?: string;
  clientId?: string;
  sampleType?: string;
  clientType?: string;
}

export const buildWhereClause = (filters: FilterParams, modelType: string) => {
  const where: any = {};

  switch (modelType) {
    case 'client':
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      if (filters.clientType) where.clientType = filters.clientType;
      break;

    case 'order':
      if (filters.status) where.status = filters.status;
      if (filters.clientId) where.clientId = filters.clientId;
      break;

    case 'sample':
      if (filters.status) where.status = filters.status;
      if (filters.sampleType) where.sampleType = filters.sampleType;
      if (filters.clientId) where.order = { clientId: filters.clientId };
      break;

    case 'report':
      if (filters.status) where.status = filters.status;
      if (filters.clientId) where.clientId = filters.clientId;
      break;
  }

  return where;
};

export const calculatePagination = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
};
