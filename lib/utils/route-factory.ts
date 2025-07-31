import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler, createSuccessResponse, validateParams, validateBody, ensureRecordExists } from "./api-handler";
import { CrudService } from "./database";
import prisma from "@/lib/db";

type PrismaModelName = keyof typeof prisma;

/**
 * Generic CRUD route factory
 */
export function createCrudRoutes<T extends PrismaModelName>(
  modelName: T,
  schemas: {
    create: z.ZodSchema;
    update: z.ZodSchema;
    params?: z.ZodSchema;
  },
  options: {
    include?: any;
    orderBy?: any;
    customQueries?: {
      findMany?: (service: CrudService<T>) => Promise<any>;
      findById?: (service: CrudService<T>, id: string) => Promise<any>;
    };
  } = {}
) {
  const service = new CrudService(modelName);
  const { include, orderBy, customQueries } = options;

  const routes = {
    // GET /api/resource
    GET: withErrorHandler(async () => {
      let data;
      if (customQueries?.findMany) {
        data = await customQueries.findMany(service);
      } else {
        data = await service.findMany({ include, orderBy });
      }
      return createSuccessResponse(data);
    }),

    // POST /api/resource
    POST: withErrorHandler(async (request: Request) => {
      const validatedData = await validateBody(request, schemas.create);
      const newRecord = await service.create(validatedData, include);
      return createSuccessResponse(newRecord, "Record created successfully", 201);
    }),

    // GET /api/resource/[id]
    getById: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      let record;
      if (customQueries?.findById) {
        record = await customQueries.findById(service, id);
      } else {
        record = await service.findById(id, include);
      }
      
      ensureRecordExists(record, String(modelName));
      return createSuccessResponse(record);
    }),

    // PUT /api/resource/[id]
    PUT: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      const validatedData = await validateBody(request, schemas.update);
      const updatedRecord = await service.updateById(id, validatedData, include);
      return createSuccessResponse(updatedRecord, "Record updated successfully");
    }),

    // PATCH /api/resource/[id]
    PATCH: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      const validatedData = await validateBody(request, schemas.update);
      const updatedRecord = await service.updateById(id, validatedData, include);
      return createSuccessResponse(updatedRecord, "Record updated successfully");
    }),

    // DELETE /api/resource/[id]
    DELETE: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      await service.deleteById(id);
      return new NextResponse(null, { status: 204 });
    }),
  };

  return routes;
}

/**
 * Route factory for resources with complex relationships
 */
export function createComplexCrudRoutes<T extends PrismaModelName>(
  modelName: T,
  schemas: {
    create: z.ZodSchema;
    update: z.ZodSchema;
    params?: z.ZodSchema;
  },
  handlers: {
    create?: (data: any, service: CrudService<T>) => Promise<any>;
    update?: (id: string, data: any, service: CrudService<T>) => Promise<any>;
    delete?: (id: string, service: CrudService<T>) => Promise<any>;
    findMany?: (service: CrudService<T>) => Promise<any>;
    findById?: (id: string, service: CrudService<T>) => Promise<any>;
  }
) {
  const service = new CrudService(modelName);

  return {
    GET: withErrorHandler(async () => {
      const data = handlers.findMany 
        ? await handlers.findMany(service)
        : await service.findMany();
      return createSuccessResponse(data);
    }),

    POST: withErrorHandler(async (request: Request) => {
      const validatedData = await validateBody(request, schemas.create);
      const newRecord = handlers.create
        ? await handlers.create(validatedData, service)
        : await service.create(validatedData);
      return createSuccessResponse(newRecord, "Record created successfully", 201);
    }),

    getById: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      const record = handlers.findById
        ? await handlers.findById(id, service)
        : await service.findById(id);
      
      ensureRecordExists(record, String(modelName));
      return createSuccessResponse(record);
    }),

    PUT: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      const validatedData = await validateBody(request, schemas.update);
      const updatedRecord = handlers.update
        ? await handlers.update(id, validatedData, service)
        : await service.updateById(id, validatedData);
      return createSuccessResponse(updatedRecord, "Record updated successfully");
    }),

    DELETE: withErrorHandler(async (request: NextRequest, context: any) => {
      const params = await context.params;
      const { id } = schemas.params ? validateParams(params, schemas.params) : params;
      
      if (handlers.delete) {
        await handlers.delete(id, service);
      } else {
        await service.deleteById(id);
      }
      return new NextResponse(null, { status: 204 });
    }),
  };
}

/**
 * Pagination utility
 */
export function createPaginatedRoute<T extends PrismaModelName>(
  modelName: T,
  options: {
    include?: any;
    orderBy?: any;
    searchFields?: string[];
  } = {}
) {
  const service = new CrudService(modelName);
  
  return withErrorHandler(async (request: NextRequest) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    let where: any = {};
    if (search && options.searchFields) {
      where = {
        OR: options.searchFields.map(field => ({
          [field]: {
            contains: search,
            mode: 'insensitive'
          }
        }))
      };
    }
    
    const [data, total] = await Promise.all([
      service.findMany({
        where,
        include: options.include,
        orderBy: options.orderBy,
        take: limit,
        skip,
      }),
      service.count(where),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return createSuccessResponse({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  });
}
