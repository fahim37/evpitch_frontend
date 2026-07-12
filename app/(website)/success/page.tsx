import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6 text-center shadow-lg rounded-xl">
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <CheckCircle className="h-24 w-24 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          <p className="text-gray-600 text-lg">
            Thank you for your purchase. Your transaction has been completed
            successfully.
          </p>
          <p className="text-gray-500 text-sm">
            Please check your payment history tab in your profile. A
            confirmation email will be sent to your registered email address.
          </p>
          <Button
            asChild
            className="w-full mt-4 py-2 rounded-md text-base font-medium bg-[#2B7FD0] text-white hover:bg-[#1E5BA8]"
          >
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
