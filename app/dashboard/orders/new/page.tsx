"use client";

import { OrderForm } from "@/components/orders/OrderForm";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();

  return (
    <OrderForm 
      onSuccess={() => router.push("/dashboard/orders")}
    />
  );
}