"use client";

import { useState } from "react";
import EmailStep from "./email-step";
import OtpStep from "./otp-step";
import PasswordResetStep from "./password-reset-step";

const OTP_EXPIRY_SECONDS = 600;

export type FormData = {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
};

export default function ForgotPasswordForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const startOtpTimer = () =>
    setOtpExpiresAt(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
      {currentStep === 1 && (
        <EmailStep
          email={formData.email}
          onEmailChange={(email) => updateFormData({ email })}
          onNext={nextStep}
          onOtpSent={startOtpTimer}
        />
      )}

      {currentStep === 2 && (
        <OtpStep
          email={formData.email}
          otp={formData.otp}
          onOtpChange={(otp) => updateFormData({ otp })}
          onNext={nextStep}
          onBack={prevStep}
          otpExpiresAt={otpExpiresAt}
          otpDurationSeconds={OTP_EXPIRY_SECONDS}
          onOtpTimerRestart={startOtpTimer}
        />
      )}

      {currentStep === 3 && (
        <PasswordResetStep
          formData={formData}
          onPasswordChange={(password) => updateFormData({ password })}
          onConfirmPasswordChange={(confirmPassword) =>
            updateFormData({ confirmPassword })
          }
          onBack={prevStep}
        />
      )}
    </div>
  );
}
