// import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";

// interface PayPalCheckoutProps {
//   orderId: string; 
//   userId: string;
//   planId: string; 
// }

// declare global {
//   interface Window {
//     paypal: {
//       Buttons: (options: {
//         style: {
//           layout: string;
//           color: string;
//           shape: string;
//           label: string;
//         };
//         createOrder: (data: unknown, actions: unknown) => string;
//         onApprove: (data: unknown) => Promise<void>;
//         onError: (err: unknown) => void;
//       }) => {
//         render: (element: HTMLDivElement | null) => void;
//       };
//     };
//   }
// }

// interface CaptureOrderRequest {
//   orderId: string;
//   userId: string;
//   planId: string;
// }

// const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
//   orderId,
//   userId,
//   planId
// }) => {
//   const paypalRef = useRef<HTMLDivElement | null>(null);
//   const isRendered = useRef(false);
//   const router = useRouter();

//   useEffect(() => {
//     if (!window.paypal || !paypalRef.current || isRendered.current) return;
//     isRendered.current = true;

//     window.paypal
//       .Buttons({
//         style: {
//           layout: "vertical",
//           color: "gold",
//           shape: "rect",
//           label: "paypal",
//         },
//         createOrder: () => orderId,
//         onApprove: async () => {
//           try {
//             const requestData: CaptureOrderRequest = {
//               orderId,
//               userId,
//               planId
//             };

//             const response = await fetch(
//               `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/capture-order`,
//               {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(requestData),
//               }
//             );

//             if (!response.ok) {
//               throw new Error("Failed to capture PayPal order");
//             }

//             await response.json();
//             router.push("/success");
//           } catch (error) {
//             console.error("PayPal Capture Error:", error);
//             // Handle error appropriately
//           }
//         },
//         onError: (err: unknown) => {
//           console.error("PayPal Checkout Error:", err);
//           // Handle error appropriately
//         },
//       })
//       .render(paypalRef.current);
//   }, [orderId, userId, planId, router]);

//   return <div ref={paypalRef} style={{ height: '600px', overflowY: 'auto' ,}} />;
// };

// export default PayPalCheckout;