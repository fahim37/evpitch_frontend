import { useMutation, useQueryClient } from "@tanstack/react-query"

interface SecurityQuestion {
  question: string
  answer: string
}

interface SecurityQuestionsData {
  email: string
  securityQuestions: SecurityQuestion[]
}

export function useSecurityQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SecurityQuestionsData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/security-answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to submit security questions")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-questions"] })
    },
  })
}
