"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeaders from "@/components/shared/PageHeaders";
import Image from "next/image";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style: {
          layout: string;
          color: string;
          shape: string;
          label: string;
        };
        createOrder: () => string | Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
      }) => {
        render: (element: HTMLDivElement | null) => void;
      };
    };
    paypalSdkPromise?: Promise<Window["paypal"] | undefined>;
  }
}

interface CaptureOrderRequest {
  orderId: string;
  userId: string;
  planId: string;
}

const buildSdkUrl = (clientId: string) =>
  `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;

const removeStalePaypalScripts = () => {
  document
    .querySelectorAll<HTMLScriptElement>('script[src*="paypal.com/sdk/js"]')
    .forEach((script) => {
      if (script.dataset.paypalSdk !== "true") {
        script.remove();
      }
    });
};

const loadPaypalSdk = (clientId: string) => {
  if (!clientId) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  if (window.paypal) {
    return Promise.resolve(window.paypal);
  }

  const scriptUrl = buildSdkUrl(clientId);

  if (!window.paypalSdkPromise) {
    removeStalePaypalScripts();
    window.paypalSdkPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-paypal-sdk="true"]'
      );

      if (existingScript) {
        if (window.paypal) {
          resolve(window.paypal);
          return;
        }

        existingScript.addEventListener("load", () => resolve(window.paypal));
        existingScript.addEventListener("error", () =>
          reject(new Error("Failed to load PayPal SDK"))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.dataset.paypalSdk = "true";
      script.onload = () => resolve(window.paypal);
      script.onerror = (err) => {
        console.error("Failed to load PayPal SDK", err);
        window.paypalSdkPromise = undefined;
        reject(new Error("Failed to load PayPal SDK"));
      };
      document.body.appendChild(script);
    });
  }

  return window.paypalSdkPromise;
};

export default function PayPalCheckoutClient() {
  const paypalRef = useRef<HTMLDivElement | null>(null);
  const isRendered = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sdkLoading, setSdkLoading] = useState(true);

  const userId = searchParams.get("userId") || "";
  const amount = searchParams.get("amount") || "0.00";
  const planId = searchParams.get("planId") || "";
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  useEffect(() => {
    let isActive = true;
    if (!clientId) {
      console.error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID");
      setSdkLoading(false);
      return;
    }

    const renderButtons = async () => {
      if (!paypalRef.current || isRendered.current) {
        setSdkLoading(false);
        return;
      }

      setSdkLoading(true);

      try {
        const paypalSdk = await loadPaypalSdk(clientId);
        if (!isActive || !paypalRef.current || !paypalSdk || isRendered.current) {
          setSdkLoading(false);
          return;
        }

        isRendered.current = true;
        setSdkLoading(false);

        paypalSdk
          ?.Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
            },

            // Create a fresh order on the server every time
            createOrder: async () => {
              try {
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/create-order`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount, planId, userId }),
                  }
                );

                if (!res.ok) {
                  throw new Error("Failed to create PayPal order");
                }

                const data = await res.json();
                return data.orderId || data.data?.orderId;
              } catch (err) {
                console.error("PayPal createOrder error:", err);
                throw err;
              }
            },

            // Use the orderID that PayPal returns
            onApprove: async (data) => {
              try {
                const requestData: CaptureOrderRequest = {
                  orderId: data.orderID,
                  userId,
                  planId,
                };

                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/capture-order`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestData),
                  }
                );

                if (!response.ok) {
                  throw new Error("Failed to capture PayPal order");
                }

                router.push("/success");
              } catch (err) {
                console.error("PayPal Capture Error:", err);
              }
            },

            onError: (err: unknown) => {
              console.error("PayPal Checkout Error:", err);
            },
          })
          .render(paypalRef.current);
      } catch (err) {
        console.error("PayPal SDK load error:", err);
        setSdkLoading(false);
      }
    };

    renderButtons();

    // Retry once if the SDK hangs (network hiccup)
    const retryTimer = window.setTimeout(() => {
      if (!isRendered.current) {
        window.paypalSdkPromise = undefined;
        renderButtons();
      }
    }, 8000);

    return () => {
      isActive = false;
      window.clearTimeout(retryTimer);
    };
  }, [amount, planId, userId, clientId]);

  return (
    <div className="container mx-auto p-4">
      <PageHeaders
        title="Payment"
        description="Complete your secure payment using our trusted payment methods."
      />

      <div className="flex flex-col md:flex-row justify-between gap-8">
        {/* Summary column: left on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Payment Details:</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li>Plan ID: {planId || "N/A"}</li>
              <li>Charges include Applicable VAT/GST and/or Sales Taxes</li>
            </ul>
          </div>

          <div className="border-t border-gray-300 pt-4 mb-6 flex justify-between items-center">
            <span className="text-xl font-bold">Total Amount:</span>
            <span className="text-xl font-bold text-blue-600">${amount}</span>
          </div>

          <div className="border-t border-gray-300 pt-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Safe &amp; secure payment
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your payment information is processed securely. We do not store
              your credit card details.
            </p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/assets/visa.png"
              alt="Visa card"
              width={80}
              height={40}
            />
            <Image
              src="/assets/paypal.png"
              alt="PayPal logo"
              width={100}
              height={100}
            />
            <Image
              src="/assets/master.png"
              alt="Mastercard"
              width={80}
              height={40}
            />
          </div>
        </div>

        {/* PayPal column: right on desktop, top on mobile */}
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <h2 className="text-2xl font-bold mb-4">Pay with PayPal</h2>
          <div
            ref={paypalRef}
            style={{ minHeight: 150 }}
            className="w-full flex items-center justify-center"
          >
            {sdkLoading && (
              <p className="text-sm text-gray-500">
                Loading secure PayPal checkout...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
