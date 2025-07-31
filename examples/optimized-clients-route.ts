// Optimized version of app/api/clients/route.ts
import { createCrudRoutes } from "@/lib/utils/route-factory";
import { clientSchemas } from "@/lib/utils/validation";
import { commonIncludes } from "@/lib/utils/database";

// Create CRUD routes with 3 lines instead of 50+
const routes = createCrudRoutes('client', {
  create: clientSchemas.create,
  update: clientSchemas.update,
}, {
  include: commonIncludes.clientWithRelations,
  orderBy: { createdAt: 'desc' }
});

export const GET = routes.GET;
export const POST = routes.POST;
