import { SampleType, ClientType } from "@/lib/generated/prisma-client";

export interface TestParameter {
  id: string;
  name: string;
  unit?: string;
  price: number;
}

export interface AgroTest {
  id: string;
  name: string;
  sampleType: SampleType;
  testParameters: TestParameter[];
}

export interface OrderItem {
  testParameterId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderForm {
  clientId: string;
  sampleType: SampleType;
  collectionDate: Date;
  collectionLocation?: string;
  cropType?: string;
  soilCategory?: "UPLAND" | "WETLAND";
  items: OrderItem[];
}

export interface OrderSummary {
  totalAmount: number;
  numberOfSamples: number;
  items: OrderItem[];
} 