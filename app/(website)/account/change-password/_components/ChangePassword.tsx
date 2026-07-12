"use client"

import { useState, useEffect } from "react"
import { ChangePassword } from "../../_components/change-password"
import { SecurityQuestions } from "../../_components/security-questions"
import { ResetPassword } from "./ResetPassword"

type ViewState = "change-password" | "security-questions" | "reset-password" | "email-reset"

export default function ChangePasswordPage() {
  const [currentView, setCurrentView] = useState<ViewState>("change-password")
  const [resetToken, setResetToken] = useState<string>("")

  // Check if there's a token in the URL (from email link)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get("token")
    if (tokenFromUrl) {
      setCurrentView("email-reset")
    }
  }, [])

  const handleShowSecurityQuestions = () => {
    setCurrentView("security-questions")
  }

  const handleSecurityQuestionsComplete = (token: string) => {
    setResetToken(token)
    setCurrentView("reset-password")
  }

  const handleBack = () => {
    if (currentView === "reset-password") {
      setCurrentView("security-questions")
    } else {
      setCurrentView("change-password")
    }
  }

  const handleResetComplete = () => {
    setCurrentView("change-password")
    setResetToken("")
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  return (
    <div className="">
      <div className=" w-full space-y-8">
        <div className="">
          {currentView === "change-password" && (
            <ChangePassword onShowSecurityQuestions={handleShowSecurityQuestions} />
          )}

          {currentView === "security-questions" && (
            <SecurityQuestions onBack={handleBack} onComplete={handleSecurityQuestionsComplete} />
          )}

          {currentView === "reset-password" && (
            <ResetPassword token={resetToken} onBack={handleBack} onComplete={handleResetComplete} />
          )}
        </div>
      </div>
    </div>
  )
}
