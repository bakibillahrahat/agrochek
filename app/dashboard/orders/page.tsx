import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import OrderWrapper from "@/components/orders/OrderWrapper";

export default function OrdersPage() {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <OrderWrapper />
      </div>
    </div>
  )
}