"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

interface SecurityQuestionsProps {
  onBack: () => void;
  onComplete: (token: string) => void;
}

interface SecurityQuestion {
  question: string;
  answer: string;
  _id: string;
}

interface SingleUserResponse {
  success: boolean;
  data: {
    id: string;
    email?: string;
    securityQuestions: SecurityQuestion[];
  };
}

export function SecurityQuestions({
  onBack,
  onComplete,
}: SecurityQuestionsProps) {
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = useSession();
  const token = session.data?.accessToken;
  


  // Fetch user data including security questions
  const { data: singleUser } = useQuery<SingleUserResponse, Error>({
    queryKey: ["single-user"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/single`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    enabled: !!token,
    retry: 1,
  });
  const userEmail = singleUser?.data?.email;

  // Set questions from user data when available
  useEffect(() => {
    if (singleUser?.data?.securityQuestions) {
      setQuestions(singleUser.data.securityQuestions);
      // Initialize answers array with empty strings
      setAnswers(new Array(singleUser.data.securityQuestions.length).fill(""));
      setLoading(false);
    } else if (singleUser && !singleUser.data.securityQuestions) {
      setError("No security questions found for your account.");
      setLoading(false);
    }
  }, [singleUser]);

  // Handle answer change for specific question
  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = value;
    setAnswers(updatedAnswers);
  };

  // Handle form submission - verify security answers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all questions have answers
    const filledAnswers = answers.filter((answer) => answer.trim() !== "");
    if (filledAnswers.length < questions.length) {
      toast.error("Please answer all security questions");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/verify-security-answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            answers: answers,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
           "Security answers verified successfully!"
        );

        // Extract reset token from response
        const resetToken = data.data?.resetToken;
        if (resetToken) {
          onComplete(resetToken);
        } else {
          throw new Error("Reset token not received from server");
        }
      } else {
        throw new Error(data.message || "Failed to verify security answers");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to verify security answers";
      toast.error(errorMessage);
      console.error("Security verification error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading security questions...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User's Security Questions */}
          {questions.map((questionObj, index) => (
            <div key={questionObj._id} className="space-y-2">
              <Label
                htmlFor={`question-${index}`}
                className="text-sm font-medium text-blue-600"
              >
                {questionObj.question}
              </Label>
              <Input
                id={`question-${index}`}
                type="text"
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer"
                className="mt-2"
                required
              />
            </div>
          ))}

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Answers"
              )}
            </Button>
          </div>
        </form>

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>
              {answers.filter((answer) => answer.trim() !== "").length}/
              {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (answers.filter((answer) => answer.trim() !== "").length /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}