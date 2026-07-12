"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authAPI, type SecurityAnswer } from "@/lib/auth-api";

export function SecurityQuestionsForm() {
  const [email, setEmail] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([
    "",
    "",
    "",
  ]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ["security-questions"],
    queryFn: authAPI.getSecurityQuestions,
  });

  const submitAnswersMutation = useMutation({
    mutationFn: authAPI.submitSecurityAnswers,
    onSuccess: () => {
      router.push("/login?message=Registration completed successfully");
    },
    onError: (error) => {
      console.error("Failed to submit security answers:", error);
    },
  });

  const handleQuestionChange = (index: number, question: string) => {
    const newQuestions = [...selectedQuestions];
    newQuestions[index] = question;
    setSelectedQuestions(newQuestions);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const securityQuestions: SecurityAnswer[] = selectedQuestions
      .filter((question, index) => question && answers[index])
      .map((question, index) => ({
        question,
        answer: answers[selectedQuestions.indexOf(question)],
      }));

    if (securityQuestions.length >= 2) {
      submitAnswersMutation.mutate({
        email,
        securityQuestions,
      });
    } else {
      alert("Please select and answer at least 2 security questions");
    }
  };

  const handleCancel = () => {
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const questions = questionsData?.data || [];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Set Up Your 3 Security Questions
        </CardTitle>
        <p className="text-gray-600">
          Add extra protection to your account by choosing 3 security questions
          only you can answer.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3">
              <Select
                value={selectedQuestions[index]}
                onValueChange={(value) => handleQuestionChange(index, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a security question" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((question: string, qIndex: number) => (
                    <SelectItem
                      key={qIndex}
                      value={question}
                      disabled={
                        selectedQuestions.includes(question) &&
                        selectedQuestions[index] !== question
                      }
                    >
                      {question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedQuestions[index] && (
                <Input
                  placeholder="Write here (text only, max 50 characters)"
                  value={answers[index]}
                  onChange={(e) => {
                    // Remove numbers and limit to 50 characters
                    const textOnly = e.target.value.replace(/[0-9]/g, "");
                    const truncated = textOnly.slice(0, 50);
                    handleAnswerChange(index, truncated);
                  }}
                  maxLength={50}
                  className="mt-2"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitAnswersMutation.isPending}>
              {submitAnswersMutation.isPending ? "Saving..." : "Next"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
