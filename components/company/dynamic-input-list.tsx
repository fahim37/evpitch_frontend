"use client"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DynamicInputListProps {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
  buttonText?: string
}

export function DynamicInputList({
  label,
  placeholder,
  values,
  onChange,
  buttonText = "Add More",
}: DynamicInputListProps) {
  const addField = () => {
    onChange([...values, ""])
  }

  const removeField = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const updateField = (index: number, value: string) => {
    const newValues = [...values]
    newValues[index] = value
    onChange(newValues)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => updateField(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {values.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeField(index)}
              className="text-red-500 hover:text-red-700 px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addField}
        className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
      >
        <Plus className="h-4 w-4" />
        {buttonText}
      </Button>
    </div>
  )
}
