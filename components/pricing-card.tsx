import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Image from "next/image";

interface PricingCardProps {
  planName: string;
  priceMonthly?: string;
  priceYearly?: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  isPremium?: boolean;
}

export function PricingCard({
  planName,
  priceMonthly,
  priceYearly,
  features,
  buttonText,
  buttonVariant,
  isPremium = false,
}: PricingCardProps) {
  return (
    <Card
      className={`relative flex flex-col items-center p-6 shadow-lg rounded-xl ${
        isPremium ? "bg-primary text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* {isPremium && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
          Premium Plan
        </div>
      )} */}
      {isPremium && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <Image
            src="/placeholder.svg?height=400&width=400"
            alt="Abstract background"
            width={400}
            height={400}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        </div>
      )}
      <CardHeader className="pb-4 relative z-10">
        <CardTitle
          className={`text-sm font-bold uppercase ${
            isPremium ? "text-white/80" : "text-v0-blue-500"
          }`}
        >
          {planName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 w-full relative z-10">
        {priceMonthly && (
          <div className="text-5xl font-bold">
            {priceMonthly}
            <span className="text-lg font-normal ml-1">Per Month</span>
          </div>
        )}
        {priceYearly && (
          <div className="text-4xl font-bold">
            {priceYearly}
            <span className="text-lg font-normal ml-1">Per Year</span>
          </div>
        )}
        <h4
          className={`text-base font-semibold ${
            isPremium ? "text-white/90" : "text-gray-700"
          }`}
        >
          What you will get:
        </h4>
        <ul className="space-y-2 text-left w-full">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check
                className={`h-5 w-5 ${
                  isPremium ? "text-white" : "text-v0-blue-500"
                }`}
              />
              <span
                className={`${isPremium ? "text-white/90" : "text-gray-600"}`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full mt-6 ${
            isPremium
              ? "bg-white text-v0-blue-500 hover:bg-gray-100"
              : "border-v0-blue-500 text-v0-blue-500 hover:bg-v0-blue-50"
          }`}
          variant={buttonVariant}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
