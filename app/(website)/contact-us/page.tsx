"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import PageHeaders from "@/components/shared/PageHeaders";
import { toast } from "sonner";

// Define interface for form data
interface ContactFormData {
  firstName: string;
  lastName: string;
  address: string; // used as email
  phoneNumber: string;
  subject: string;
  message: string;
}

// Define interface for API response
interface ApiResponse {
  message: string;
}

// API function with typed input and output
const postContactData = async (
  formData: ContactFormData
): Promise<ApiResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/contact/contact-us`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit contact form");
  }

  return response.json();
};

// basic email pattern (not perfect, but solid enough for UI validation)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (data: ContactFormData): string[] => {
  const errors: string[] = [];

  if (!data.firstName.trim() || data.firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters.");
  }

  if (!data.lastName.trim() || data.lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters.");
  }

  if (!data.address.trim()) {
    errors.push("Email is required.");
  } else if (!emailRegex.test(data.address.trim())) {
    errors.push("Please enter a valid email address.");
  }

  if (!data.subject.trim() || data.subject.trim().length < 3) {
    errors.push("Subject must be at least 3 characters.");
  }

  if (!data.message.trim() || data.message.trim().length < 10) {
    errors.push("Message must be at least 10 characters.");
  }

  return errors;
};

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    subject: "",
    message: "",
  });

  const mutation = useMutation<ApiResponse, Error, ContactFormData>({
    mutationFn: postContactData,
    onSuccess: () => {
      setFormData({
        firstName: "",
        lastName: "",
        address: "",
        phoneNumber: "",
        subject: "",
        message: "",
      });
      toast.success("Message sent successfully!", {
        description: "We'll get back to you soon.",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to send message. Please try again.", {
        description: error.message,
        duration: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateForm(formData);
    if (errors.length > 0) {
      toast.error("Please fix the following issues:", {
        description: (
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        ) as any,
        duration: 6000,
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <div className="container pb-[100px] mt-6">
      <PageHeaders
        title="Contact Us"
        description="If you have a suggestion, question, concern or comment, please reach out to us using our contact form or via the alternative contact methods on this page."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form Section */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6 ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  className="text-[#2A2A2A] text-[16px] font-medium"
                  htmlFor="firstName"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter Your First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  className="text-[#2A2A2A] text-[16px] font-medium"
                  htmlFor="lastName"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter Your Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                className="text-[#2A2A2A] text-[16px] font-medium"
                htmlFor="address"
              >
                Email
              </Label>
              <div className="relative">
                <Input
                  id="address"
                  type="email"
                  placeholder="Enter Your email"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                className="text-[#2A2A2A] text-[16px] font-medium"
                htmlFor="subject"
              >
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="What is this regarding?"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                className="text-[#2A2A2A] text-[16px] font-medium"
                htmlFor="message"
              >
                Your Message
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us how we can help you"
                className="min-h-[120px]"
                value={formData.message}
                onChange={handleInputChange}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>

        <div>
          {/* Contact Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-16">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                  <Mail className="w-5 h-5" />
                </div>
                <a
                  href="mailto:clientsupport@evpitch.com"
                  className="text-gray-700 hover:underline"
                >
                  clientsupport@evpitch.com
                </a>
              </div>
              <div className="flex items-center gap-16">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                  <Phone className="w-5 h-5" />
                </div>
                <a
                  href="tel:+14065550120"
                  className="text-gray-700 hover:underline"
                >
                  +44 0203 954 2530
                </a>
              </div>
              <div className="flex items-center gap-16">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <address className="text-gray-700 not-italic">
                  124 City Road, London EC1V 2NX
                </address>
              </div>
              <div className="flex items-center gap-16">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-gray-700">
                  Monday to Friday, from <br />
                  9am - 6pm GMT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
