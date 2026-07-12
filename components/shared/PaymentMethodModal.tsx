"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PaymentMethodModalProps {
  isOpen: boolean;
  price: string;
  planId: string;
  onClose: () => void;
}

interface PayPalOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
}

async function createPayPalOrder(amount: string): Promise<PayPalOrderResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/create-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create PayPal order");
  }

  return response.json();
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  price,
  planId,
}: PaymentMethodModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const session = useSession();
  const userId = session?.data?.user?.id || "";
  const router = useRouter();

  const plan = session?.data;

  const { mutate, isPending } = useMutation({
    mutationFn: () => createPayPalOrder(price),
    onSuccess: (data) => {
      // Redirect with static planId and without bookingId
      router.push(
        `/payment?orderId=${data.orderId}&userId=${userId}&planId=${planId}&amount=${price}`
      );
    },
    onError: (error) => {
      console.error("Error creating PayPal order:", error);
      // Handle error (show toast, etc.)
    },
  });

  const handlePayNow = () => {
    if (paymentMethod === "paypal") {
      mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#000000]">
            Select Payment Method
          </DialogTitle>
          <p className="text-lg font-medium mt-2">${price}</p>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="grid gap-2"
          >
            <div className="flex items-center justify-between rounded-md border p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/modal.png"
                  alt="PayPal"
                  width={30}
                  height={30}
                  className="h-[67px] w-[120px]"
                />
              </div>
              <RadioGroupItem
                className="border-[#2B7FD0]"
                value="paypal"
                id="paypal"
              />
            </div>
          </RadioGroup>
        </div>
        <DialogFooter className="">
          <Button
            className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 h-11"
            onClick={handlePayNow}
            disabled={isPending}
          >
            {isPending ? "Processing..." : "Pay Now"}
          </Button>
        </DialogFooter>
        {/* <p className="text-center text-sm text-gray-500 mt-2">Other Payment Methods Coming Soon!</p> */}
      </DialogContent>
    </Dialog>
  );
}
