"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientType, SampleType } from "@/lib/generated/prisma-client";
import { Loader2, ArrowLeft, CheckCircle2, Plus, Trash2, ShoppingCart, CreditCard, DollarSign, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// Types
interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  clientType: ClientType;
}

interface TestParameter {
  id: string;
  name: string;
  unit: string;
  pricing: {
    clientType: ClientType;
    price: number;
  }[];
}

interface AgroTest {
  id: string;
  name: string;
  sampleType: SampleType;
  testParameter: TestParameter[];
}

interface CartItem {
  agroTestId: string;
  agroTest: AgroTest;
  quantity: number;
  selectedParameters: {
    id: string;
    quantity: number;
  }[];
  unitPrice: number;
  subtotal: number;
  collectionLocation: string;
  cropType?: string;
  bunot?: string;
  manchitroUnit?: number;
  vumiSrini?: string;
}

// Form schemas
const clientLookupSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  clientType: z.enum(["FARMER", "GOVT_ORG", "PRIVATE"]),
});

const orderFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  sarokNumber: z.string().min(1, "Sarok number is required"),
  agroTestId: z.string().min(1, "Agro test is required"),
  sampleType: z.string().min(1, "Sample type is required"),
  collectionLocation: z.string()
    .min(1, "Collection location is required")
    .refine((val) => val.trim().length > 0, {
      message: "Collection location cannot be empty"
    }),
  cropType: z.string().optional(),
  bunot: z.string().optional(),
  manchitroUnit: z.number().optional(),
  vumiSrini: z.string().optional(),
  selectedParameters: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "At least one parameter must be selected"),
  quantity: z.number()
    .min(1, "Quantity must be at least 1")
    .refine((val) => Number.isInteger(val), {
      message: "Quantity must be a whole number"
    }),
}).refine((data) => {
  // Make cropType required for non-fertilizer samples
  if (data.sampleType !== "FERTILIZER" && (!data.cropType || data.cropType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Crop type is required for soil and water samples",
  path: ["cropType"]
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Form steps
const STEPS = {
  CLIENT_INFO: 1,
  AGRO_TEST: 2,
  PARAMETERS: 3,
  SAMPLE_INFO: 4,
  REVIEW: 5,
} as const;

type Step = typeof STEPS[keyof typeof STEPS];

interface OrderFormProps {
  onSuccess?: () => void;
}

export function OrderForm({ onSuccess }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [agroTests, setAgroTests] = useState<AgroTest[]>([]);
  const [selectedAgroTest, setSelectedAgroTest] = useState<AgroTest | null>(null);
  const [isCheckingClient, setIsCheckingClient] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.CLIENT_INFO);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "DUE">("DUE");
  const [isCheckingSarok, setIsCheckingSarok] = useState(false);
  const [sarokExists, setSarokExists] = useState(false);
  const router = useRouter();

  // Calculate total amount
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Form instances
  const clientLookupForm = useForm<z.infer<typeof clientLookupSchema>>({
    resolver: zodResolver(clientLookupSchema),
    defaultValues: {
      phone: "",
      name: "",
      address: "",
      clientType: "FARMER",
    },
    mode: "onChange",
  });

  const orderForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      clientId: "",
      sarokNumber: "",
      agroTestId: "",
      sampleType: "",
      collectionLocation: "",
      cropType: "",
      bunot: "",
      manchitroUnit: 0,
      vumiSrini: "",
      selectedParameters: [],
      quantity: 1,
    },
    mode: "onChange",
  });

  // Watch phone number changes
  const phoneNumber = clientLookupForm.watch("phone");
  
  // Watch sarok number changes
  const sarokNumber = orderForm.watch("sarokNumber");

  // Fetch agro tests on component mount
  useEffect(() => {
    const fetchAgroTests = async () => {
      try {
        const response = await fetch("/api/agrotest");
        if (!response.ok) throw new Error("Failed to fetch agro tests");
        const data = await response.json();
        setAgroTests(data);
      } catch (error) {
        console.error("Error fetching agro tests:", error);
        toast.error("Failed to fetch agro tests");
      }
    };
    fetchAgroTests();
  }, []);

  // Check client when phone number changes
  useEffect(() => {
    const checkClient = async () => {
      if (phoneNumber && phoneNumber.length >= 10) {
        setIsCheckingClient(true);
        try {
          const response = await fetch(`/api/clients/check?phone=${phoneNumber}`);
          if (!response.ok) throw new Error("Failed to check client");
          const result = await response.json();

          if (result.exists) {
            setClient(result.client);
            clientLookupForm.reset({
              phone: result.client.phone,
              name: result.client.name,
              address: result.client.address || "",
              clientType: result.client.clientType,
            });
            orderForm.setValue("clientId", result.client.id);
            toast.success("Client found! Proceeding with existing client information.");
            setCurrentStep(STEPS.AGRO_TEST);
          } else {
            setClient(null);
            clientLookupForm.setValue("name", "");
            clientLookupForm.setValue("address", "");
            clientLookupForm.setValue("clientType", "FARMER");
            toast.info("New client. Please fill in the details.");
          }
        } catch (error) {
          console.error("Error checking client:", error);
          toast.error("Failed to check client");
        } finally {
          setIsCheckingClient(false);
        }
      }
    };

    const timeoutId = setTimeout(checkClient, 500);
    return () => clearTimeout(timeoutId);
  }, [phoneNumber]);

  // Check sarok number uniqueness when sarok number changes
  useEffect(() => {
    const checkSarokNumber = async () => {
      if (sarokNumber && sarokNumber.trim().length > 0) {
        setIsCheckingSarok(true);
        setSarokExists(false);
        try {
          const response = await fetch(`/api/orders/check-sarok?sarokNumber=${encodeURIComponent(sarokNumber.trim())}`);
          if (!response.ok) {
            throw new Error("Failed to check sarok number");
          }
          
          const result = await response.json();
          if (result.exists) {
            setSarokExists(true);
            toast.error("Sarok number already exists. Please use a different sarok number.");
            orderForm.setError("sarokNumber", {
              type: "manual",
              message: "This sarok number already exists"
            });
          } else {
            setSarokExists(false);
            orderForm.clearErrors("sarokNumber");
          }
        } catch (error) {
          console.error("Error checking sarok number:", error);
          // Don't show error for network issues during validation
        } finally {
          setIsCheckingSarok(false);
        }
      } else {
        setSarokExists(false);
        setIsCheckingSarok(false);
      }
    };

    const timeoutId = setTimeout(checkSarokNumber, 1000); // Longer delay for sarok check
    return () => clearTimeout(timeoutId);
  }, [sarokNumber]);

  const handleClientSubmit = async (data: z.infer<typeof clientLookupSchema>) => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.message?.includes("already exists")) {
          // If client already exists, fetch their information
          const checkResponse = await fetch(`/api/clients/check?phone=${data.phone}`);
          if (checkResponse.ok) {
            const result = await checkResponse.json();
            if (result.exists) {
              setClient(result.client);
              clientLookupForm.reset({
                phone: result.client.phone,
                name: result.client.name,
                address: result.client.address || "",
                clientType: result.client.clientType,
              });
              orderForm.setValue("clientId", result.client.id);
              toast.success("Using existing client information.");
              setCurrentStep(STEPS.AGRO_TEST);
              return;
            }
          }
        }
        throw new Error(error.message || "Failed to create client");
      }

      const newClient = await response.json();
      setClient(newClient);
      orderForm.setValue("clientId", newClient.id);
      setCurrentStep(STEPS.AGRO_TEST);
      toast.success("Client created successfully");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  const handleAgroTestSelect = (agroTestId: string) => {
    const selected = agroTests.find(test => test.id === agroTestId);
    setSelectedAgroTest(selected || null);
    orderForm.setValue("selectedParameters", []);
    if (selected) {
      orderForm.setValue("sampleType", selected.sampleType);
    }
  };

  const handleParameterSelect = (parameterId: string, checked: boolean | string) => {
    const currentParameters = orderForm.getValues("selectedParameters") || [];
    
    if (checked === true) {
      if (!currentParameters.some(p => p.id === parameterId)) {
        orderForm.setValue("selectedParameters", [
          ...currentParameters,
          { id: parameterId, quantity: 1 }
        ], { shouldValidate: true });
      }
    } else {
      orderForm.setValue("selectedParameters", 
        currentParameters.filter(p => p.id !== parameterId),
        { shouldValidate: true }
      );
    }
  };

  const handleParameterQuantityChange = (parameterId: string, quantity: number) => {
    const currentParameters = orderForm.getValues("selectedParameters") || [];
    const updatedParameters = currentParameters.map(p => 
      p.id === parameterId ? { ...p, quantity: Math.max(1, quantity) } : p
    );
    orderForm.setValue("selectedParameters", updatedParameters, { shouldValidate: true });
  };

  const handleAddToCart = () => {
    if (!selectedAgroTest || !client) return;

    const selectedParams = orderForm.getValues("selectedParameters") || [];
    if (selectedParams.length === 0) {
      toast.error("Please select at least one parameter");
      return;
    }

    // Validate sample information
    const collectionLocation = orderForm.getValues("collectionLocation");
    const cropType = orderForm.getValues("cropType");
    const quantity = orderForm.getValues("quantity");
    const sarokNumber = orderForm.getValues("sarokNumber");

    // Validate sarok number (mandatory)
    if (!sarokNumber || sarokNumber.trim() === "") {
      toast.error("Sarok number is required");
      orderForm.setError("sarokNumber", {
        type: "manual",
        message: "Sarok number is required"
      });
      return;
    }

    // Check if sarok number exists
    if (sarokExists) {
      toast.error("Sarok number already exists. Please use a different sarok number.");
      return;
    }

    // Validate collection location
    if (!collectionLocation || collectionLocation.trim() === "") {
      toast.error("Collection location is required");
      orderForm.setError("collectionLocation", {
        type: "manual",
        message: "Collection location is required"
      });
      return;
    }

    // Validate crop type (required for non-fertilizer samples)
    if (selectedAgroTest?.sampleType !== "FERTILIZER" && (!cropType || cropType.trim() === "")) {
      toast.error("Crop type is required for soil and water samples");
      orderForm.setError("cropType", {
        type: "manual",
        message: "Crop type is required for soil and water samples"
      });
      return;
    }

    // Validate additional fields for SOIL samples with GOVT_ORG client type
    if (selectedAgroTest?.sampleType === "SOIL" && client?.clientType === "GOVT_ORG") {
      const bunot = orderForm.getValues("bunot");
      const manchitroUnit = orderForm.getValues("manchitroUnit");
      const vumiSrini = orderForm.getValues("vumiSrini");

      if (!bunot || bunot.trim() === "") {
        toast.error("Bunot is required for soil samples from government organizations");
        orderForm.setError("bunot", {
          type: "manual",
          message: "Bunot is required"
        });
        return;
      }

      if (manchitroUnit === undefined || manchitroUnit === null || manchitroUnit <= 0) {
        toast.error("Manchitro unit must be a positive number for soil samples from government organizations");
        orderForm.setError("manchitroUnit", {
          type: "manual",
          message: "Manchitro unit must be a positive number"
        });
        return;
      }

      if (!vumiSrini || vumiSrini.trim() === "") {
        toast.error("Vumi Srini is required for soil samples from government organizations");
        orderForm.setError("vumiSrini", {
          type: "manual",
          message: "Vumi Srini is required"
        });
        return;
      }
    }

    // Validate quantity
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      toast.error("Quantity must be a positive whole number");
      orderForm.setError("quantity", {
        type: "manual",
        message: "Quantity must be a positive whole number"
      });
      return;
    }

    const totalParameterPrice = selectedParams.reduce((sum, param) => {
      const parameter = selectedAgroTest.testParameter.find(p => p.id === param.id);
      if (!parameter) return sum;
      const price = parameter.pricing.find(p => p.clientType === client.clientType)?.price || 0;
      return sum + price;
    }, 0);

    const newItem: CartItem = {
      agroTestId: selectedAgroTest.id,
      agroTest: selectedAgroTest,
      quantity,
      selectedParameters: selectedParams,
      unitPrice: totalParameterPrice,
      subtotal: totalParameterPrice * quantity,
      collectionLocation: collectionLocation,
      cropType: cropType,
      bunot: orderForm.getValues("bunot"),
      manchitroUnit: orderForm.getValues("manchitroUnit"),
      vumiSrini: orderForm.getValues("vumiSrini"),
    };

    setCart(prev => [...prev, newItem]);
    setTotalAmount(prev => prev + newItem.subtotal);
    setCurrentStep(STEPS.REVIEW);
    
    // Reset form for next item but keep the selected agro test
    const currentBunot = orderForm.getValues("bunot");
    const currentManchitroUnit = orderForm.getValues("manchitroUnit");
    const currentVumiSrini = orderForm.getValues("vumiSrini");
    const currentAgroTestId = orderForm.getValues("agroTestId");
    
    orderForm.reset({
      clientId: client.id,
      sarokNumber: orderForm.getValues("sarokNumber"),
      agroTestId: currentAgroTestId, // Keep the selected agro test
      sampleType: selectedAgroTest?.sampleType || "",
      collectionLocation: collectionLocation,
      cropType: cropType,
      bunot: currentBunot,
      manchitroUnit: currentManchitroUnit,
      vumiSrini: currentVumiSrini,
      selectedParameters: [],
      quantity: 1,
    });
    // Don't reset selectedAgroTest - keep it selected
    
    toast.success("Test added to cart successfully!");
    
    toast.success("Added to cart");
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const removedItem = newCart.splice(index, 1)[0];
      setTotalAmount(prev => prev - removedItem.subtotal);
      return newCart;
    });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (!client?.id) {
      toast.error("Client information is required");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    if (cart.length === 0) {
      toast.error("Please add at least one test to the cart");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    const sarokNumber = orderForm.getValues("sarokNumber");

    // Check if sarok number exists before submitting
    if (sarokNumber && sarokExists) {
      toast.error("Cannot submit order with duplicate sarok number. Please use a different sarok number.");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    // Pre-validate cart items (frontend validation to avoid unnecessary API calls)
    for (const item of cart) {
      if (!item.collectionLocation) {
        toast.error(`Collection location is required for all items. Check item: ${item.agroTest.name}`);
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Validate crop type for non-fertilizer samples
      if (item.agroTest.sampleType !== "FERTILIZER" && (!item.cropType || item.cropType.trim() === "")) {
        toast.error(`Crop type is required for soil and water samples. Check item: ${item.agroTest.name}`);
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Validate additional fields for SOIL samples with GOVT_ORG client type
      if (item.agroTest.sampleType === "SOIL" && client.clientType === "GOVT_ORG") {
        if (!item.bunot || item.bunot.trim() === "") {
          toast.error(`Bunot is required for soil samples from government organizations. Check item: ${item.agroTest.name}`);
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
        
        if (item.manchitroUnit === undefined || item.manchitroUnit === null || item.manchitroUnit <= 0) {
          toast.error(`Manchitro Unit must be a positive number for soil samples from government organizations. Check item: ${item.agroTest.name}`);
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
        
        if (!item.vumiSrini || item.vumiSrini.trim() === "") {
          toast.error(`Vumi Srini is required for soil samples from government organizations. Check item: ${item.agroTest.name}`);
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      // Optimize: Fetch user data and submit order in parallel where possible
      const userResponse = await fetch("/api/user");
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user information");
      }
      const userData = await userResponse.json();

      if (!userData.id) {
        throw new Error("No operator ID found");
      }

      // Prepare payload with optimized structure
      const orderPayload = {
        sarokNumber: sarokNumber,
        clientId: client.id,
        operatorId: userData.id,
        totalAmount: calculateTotal(),
        paymentStatus: paymentStatus,
        orderItems: cart.map(item => ({
          agroTestId: item.agroTest.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          testParameters: item.selectedParameters.map(param => ({
            testParameterId: param.id
          }))
        })),
        samples: cart.flatMap(item => 
          Array.from({ length: item.quantity }, (_, index) => {
            const sampleData: any = {
              agroTestId: item.agroTest.id,
              sampleType: item.agroTest.sampleType,
              collectionDate: new Date().toISOString(),
              collectionLocation: item.collectionLocation
            };

            // Add crop type if it exists
            if (item.cropType) {
              sampleData.cropType = item.cropType;
            }

            // Add additional fields for SOIL samples with GOVT_ORG client type
            if (item.agroTest.sampleType === "SOIL" && client.clientType === "GOVT_ORG") {
              sampleData.bunot = item.bunot;
              sampleData.manchitroUnit = item.manchitroUnit;
              sampleData.vumiSrini = item.vumiSrini;
            }

            return sampleData;
          })
        )
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Order submission error:", errorData);
        
        // Handle sarok number already exists error
        if (errorData.error === "Sarok number already exists") {
          setSarokExists(true);
          orderForm.setError("sarokNumber", {
            type: "manual",
            message: "This sarok number already exists"
          });
          throw new Error("Sarok number already exists. Please use a different sarok number.");
        }
        
        // Handle specific error cases
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.");
        }
        
        if (errorData.error === "Validation error") {
          throw new Error(errorData.message || "Please check your input data.");
        }
        
        if (errorData.error === "Invalid reference") {
          throw new Error("One or more selected items are invalid. Please check your selections.");
        }
        
        if (errorData.code === "P2003") {
          throw new Error("One or more referenced records do not exist. Please check your selections.");
        }

        // Handle general error
        throw new Error(errorData.message || "Failed to create order. Please try again.");
      }

      const data = await response.json();
      toast.success("Order created successfully!");
      
      // Reset form and cart
      orderForm.reset();
      setCart([]);
      setTotalAmount(0);
      
      // Navigate to the order details page
      router.push(`/dashboard/orders`);
    } catch (err) {
      console.error("Error submitting order:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSelectAllParameters = (checked: boolean) => {
    if (!selectedAgroTest) return;

    if (checked) {
      const allParameters = selectedAgroTest.testParameter.map(param => ({
        id: param.id,
        quantity: 1
      }));
      orderForm.setValue("selectedParameters", allParameters, { shouldValidate: true });
    } else {
      orderForm.setValue("selectedParameters", [], { shouldValidate: true });
    }
  };

  // Update the renderCartItems function
  const renderCartItems = () => {
    return cart.map((item, index) => (
      <div key={index} className="bg-card text-card-foreground rounded-lg border p-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-foreground">{item.agroTest.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {item.quantity} {item.quantity > 1 ? 'samples' : 'sample'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>📍 {item.collectionLocation}</span>
              {item.cropType && (
                <>
                  <span>•</span>
                  <span>🌾 {item.cropType}</span>
                </>
              )}
              {item.bunot && (
                <>
                  <span>•</span>
                  <span>🏷️ {item.bunot}</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveFromCart(index)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-2 pt-2 border-t">
          <div className="flex flex-wrap gap-1">
            {item.selectedParameters.map(param => {
              const parameter = item.agroTest.testParameter.find(p => p.id === param.id);
              return (
                <Badge key={param.id} variant="outline" className="text-xs">
                  {parameter?.name} ({parameter?.unit})
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Unit Price: ৳{item.unitPrice.toFixed(2)}</span>
          <span className="font-semibold text-primary">৳{item.subtotal.toFixed(2)}</span>
        </div>
      </div>
    ));
  };

  // Update the renderReviewStep function
  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Client Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{client?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{client?.phone}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="secondary">{client?.clientType}</Badge>
            </div>
            {client?.address && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{client.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        {renderCartItems()}
      </div>

      <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Sample Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Collection Locations:</span>
              <div className="text-right">
                {Array.from(new Set(cart.map(item => item.collectionLocation))).map((location, index) => (
                  <div key={index} className="font-medium">{location}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Crop Types:</span>
              <div className="text-right">
                {Array.from(new Set(cart.map(item => item.cropType).filter(Boolean))).map((cropType, index) => (
                  <div key={index} className="font-medium">{cropType}</div>
                ))}
                {cart.filter(item => !item.cropType).length > 0 && (
                  <div className="font-medium text-muted-foreground">No crop type specified for some items</div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Samples:</span>
              <Badge variant="secondary">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} samples
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Tests:</span>
              <Badge variant="secondary">
                {cart.reduce((sum, item) => sum + item.selectedParameters.length * item.quantity, 0)} tests
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={() => setCurrentStep(STEPS.SAMPLE_INFO)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-right space-y-2">
            <div className="flex items-center justify-between gap-4 text-lg">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-primary text-2xl">৳{totalAmount.toFixed(2)}</span>
            </div>
            <Button
              type="button"
              onClick={handleOrderSubmit}
              className="w-full"
              disabled={loading || cart.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background px-4 py-3 border-b shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-2xl font-bold">Create New Order</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => onSuccess?.()}
              className="flex items-center gap-2"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Side - Client Info & Test Selection */}
          <div className="lg:col-span-8 space-y-4">
            {/* Client Information */}
            <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Client Information</h2>
              <Form {...clientLookupForm}>
                <form onSubmit={clientLookupForm.handleSubmit(handleClientSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={clientLookupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                placeholder="Enter phone number"
                                className={isCheckingClient ? "pr-10" : ""}
                              />
                              {isCheckingClient && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientLookupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter name"
                              disabled={!!client}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={clientLookupForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter address"
                              disabled={!!client}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientLookupForm.control}
                      name="clientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!!client}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FARMER">Farmer</SelectItem>
                              <SelectItem value="GOVT_ORG">Government Organization</SelectItem>
                              <SelectItem value="PRIVATE">Private Organization</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!client && (
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Client...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Client
                        </>
                      )}
                    </Button>
                  )}
                </form>
              </Form>
            </div>

            {/* Test Selection */}
            <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Test Selection</h2>
              <Form {...orderForm}>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control as any}
                      name="agroTestId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Agro Test</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleAgroTestSelect(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a test" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {agroTests.map((test) => (
                                <SelectItem key={test.id} value={test.id}>
                                  {test.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orderForm.control as any}
                      name="sarokNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Sarok Number
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                placeholder="Enter sarok number"
                                className={cn(
                                  (isCheckingSarok || (field.value && !sarokExists && !isCheckingSarok)) && "pr-10",
                                  sarokExists && "border-red-500 focus-visible:ring-red-500",
                                  field.value && !sarokExists && !isCheckingSarok && "border-green-500 focus-visible:ring-green-500"
                                )}
                              />
                              {isCheckingSarok && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              {field.value && !sarokExists && !isCheckingSarok && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Check className="h-4 w-4 text-green-500" />
                                </div>
                              )}
                              {field.value && sarokExists && !isCheckingSarok && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <X className="h-4 w-4 text-red-500" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control as any}
                      name="collectionLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Collection Location
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter collection location"
                              className={cn(
                                "w-full",
                                !field.value && "border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orderForm.control as any}
                      name="cropType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Crop Type
                            {selectedAgroTest?.sampleType !== "FERTILIZER" && (
                              <span className="text-red-500">*</span>
                            )}
                            {selectedAgroTest?.sampleType === "FERTILIZER" && (
                              <span className="text-xs text-muted-foreground">(Optional)</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={
                                selectedAgroTest?.sampleType === "FERTILIZER" 
                                  ? "Enter crop type (optional)" 
                                  : "Enter crop type"
                              }
                              className={cn(
                                "w-full",
                                selectedAgroTest?.sampleType !== "FERTILIZER" && !field.value && "border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Conditional fields for SOIL samples with GOVT_ORG client type */}
                  {((selectedAgroTest?.sampleType === "SOIL" && client?.clientType === "GOVT_ORG") || 
                    (cart.some(item => item.agroTest.sampleType === "SOIL") && client?.clientType === "GOVT_ORG")) && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Additional Information Required for Government Organization
                        </h3>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          These fields are required for all soil test samples from government organizations
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={orderForm.control as any}
                          name="bunot"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Bunot
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={field.value || ""}
                                  placeholder="Enter bunot type"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={orderForm.control as any}
                          name="manchitroUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Manchitro Unit
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  {...field}
                                  value={field.value !== undefined ? field.value : ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === "" ? undefined : parseInt(value) || undefined);
                                  }}
                                  placeholder="Enter manchitro unit"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={orderForm.control as any}
                          name="vumiSrini"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Vumi Srini
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={field.value || ""}
                                  placeholder="Enter vumi srini"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control as any}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Quantity</FormLabel>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentQty = field.value || 1;
                                field.onChange(Math.max(1, currentQty - 1));
                              }}
                              className="h-10"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentQty = field.value || 1;
                                field.onChange(currentQty + 1);
                              }}
                              className="h-10"
                            >
                              +
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedAgroTest && (
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-semibold">Test Parameters</h3>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="select-all"
                            checked={orderForm.watch("selectedParameters")?.length === selectedAgroTest.testParameter.length}
                            onCheckedChange={handleSelectAllParameters}
                          />
                          <label
                            htmlFor="select-all"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Select All
                          </label>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {selectedAgroTest.testParameter.map((parameter) => (
                          <div key={parameter.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                              <Checkbox
                                id={parameter.id}
                                checked={orderForm.watch("selectedParameters")?.some(p => p.id === parameter.id)}
                                onCheckedChange={(checked) => handleParameterSelect(parameter.id, checked)}
                              />
                              <div>
                                <label
                                  htmlFor={parameter.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {parameter.name}
                                </label>
                                <p className="text-xs text-gray-500">{parameter.unit}</p>
                              </div>
                            </div>
                            {orderForm.watch("selectedParameters")?.some(p => p.id === parameter.id) && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentQty = orderForm.watch("selectedParameters")?.find(p => p.id === parameter.id)?.quantity || 1;
                                    handleParameterQuantityChange(parameter.id, Math.max(1, currentQty - 1));
                                  }}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">
                                  {orderForm.watch("selectedParameters")?.find(p => p.id === parameter.id)?.quantity || 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentQty = orderForm.watch("selectedParameters")?.find(p => p.id === parameter.id)?.quantity || 1;
                                    handleParameterQuantityChange(parameter.id, currentQty + 1);
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        className="w-full mt-4"
                        onClick={handleAddToCart}
                        disabled={
                          !orderForm.watch("selectedParameters")?.length || 
                          !orderForm.watch("collectionLocation") ||
                          !orderForm.watch("sarokNumber") ||
                          sarokExists ||
                          (selectedAgroTest?.sampleType !== "FERTILIZER" && !orderForm.watch("cropType")) ||
                          (selectedAgroTest?.sampleType === "SOIL" && client?.clientType === "GOVT_ORG" && (
                            !orderForm.watch("bunot") || 
                            !orderForm.watch("vumiSrini") || 
                            (() => {
                              const manchitroValue = orderForm.watch("manchitroUnit");
                              return !manchitroValue || manchitroValue <= 0;
                            })()
                          ))
                        }
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="lg:col-span-4">
            <div className="bg-card text-card-foreground rounded-lg border shadow-sm flex flex-col h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)]">
              {/* Cart Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Order Cart</h2>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    {cart.length > 0 && (
                      <Badge 
                        variant={paymentStatus === 'PAID' ? 'default' : 'outline'} 
                        className={cn(
                          "text-xs",
                          paymentStatus === 'PAID' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        )}
                      >
                        {paymentStatus === 'PAID' ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Paid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span>Due</span>
                          </div>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium text-sm">Your cart is empty</p>
                    <p className="text-xs text-muted-foreground mt-1">Add tests to start your order</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {renderCartItems()}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-card">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">
                      ৳{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Payment Status Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Payment Status</label>
                    <Select 
                      value={paymentStatus} 
                      onValueChange={(value: "PAID" | "DUE") => setPaymentStatus(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DUE">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-orange-500" />
                            <span>Due</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PAID">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span>Paid</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={handleOrderSubmit}
                    className="w-full"
                    disabled={loading || cart.length === 0 || sarokExists}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Create Order
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
