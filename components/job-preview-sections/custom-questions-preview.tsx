"use client"

import { Button } from "@/components/ui/button"
import { Trash, Plus } from "lucide-react"

interface CustomQuestion {
  id: string
  question: string
}

interface CustomQuestionsPreviewProps {
  questions: CustomQuestion[]
  isEditing: boolean
  onUpdateQuestion: (id: string, question: string) => void
  onRemoveQuestion: (id: string) => void
  onAddQuestion: () => void
}

export default function CustomQuestionsPreview({
  questions,
  isEditing,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddQuestion,
}: CustomQuestionsPreviewProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Custom Questions</h2>
      <div className="space-y-4 mb-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <p className="text-xl font-medium text-[#2B7FD0]">Ask a question</p>
            <div className="flex items-start gap-2">
              {isEditing ? (
                <>
                  <textarea
                    value={question.question}
                    onChange={(e) => onUpdateQuestion(question.id, e.target.value)}
                    className="flex-1 min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
                  />
                  <Button variant="ghost" size="icon" onClick={() => onRemoveQuestion(question.id)} className="mt-2">
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : (
                <div className="flex-1 min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                  {question.question || "No question entered."}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {isEditing && (
        <Button
          onClick={onAddQuestion}
          className="bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      )}
    </div>
  )
}
