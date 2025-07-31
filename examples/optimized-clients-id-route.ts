// Optimized version of app/api/clients/[id]/route.ts
import { createComplexCrudRoutes } from "@/lib/utils/route-factory";
import { clientSchemas } from "@/lib/utils/validation";
import { executeTransaction } from "@/lib/utils/database";
import { ApiError } from "@/lib/utils/api-handler";

// Complex client deletion with cascading deletes
const routes = createComplexCrudRoutes('client', {
  create: clientSchemas.create,
  update: clientSchemas.update,
  params: clientSchemas.params,
}, {
  // Custom delete handler for complex cascading
  delete: async (id: string, service) => {
    // Check if client exists and get related data
    const client = await service.findById(id, {
      orders: {
        include: {
          samples: true,
          invoice: true,
          report: true,
          orderItems: true
        }
      },
      invoices: true,
      reports: true
    });

    if (!client) {
      throw new ApiError('Client not found', 404);
    }

    // Delete all related records in a transaction
    await executeTransaction(async (tx) => {
      // Delete all test results from samples first
      for (const order of client.orders) {
        if (order.samples.length > 0) {
          for (const sample of order.samples) {
            await tx.testResult.deleteMany({
              where: { sampleId: sample.id }
            });
          }
        }
      }

      // Delete all order test parameters
      for (const order of client.orders) {
        for (const orderItem of order.orderItems) {
          await tx.orderTestParameter.deleteMany({
            where: { orderItemId: orderItem.id }
          });
        }
      }

      // Delete remaining cascading records
      if (client.orders.length > 0) {
        await tx.sample.deleteMany({ where: { orderId: { in: client.orders.map((o: any) => o.id) } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: client.orders.map((o: any) => o.id) } } });
      }

      if (client.reports.length > 0) {
        await tx.report.deleteMany({ where: { clientId: id } });
      }

      if (client.invoices.length > 0) {
        await tx.invoice.deleteMany({ where: { clientId: id } });
      }

      if (client.orders.length > 0) {
        await tx.order.deleteMany({ where: { clientId: id } });
      }

      // Finally delete the client
      await tx.client.delete({ where: { id } });
    });
  }
});

export const GET = routes.getById;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
