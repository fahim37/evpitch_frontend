const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  address: string;
  role: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface SecurityAnswer {
  question: string;
  answer: string;
}

export interface SecurityAnswersData {
  email: string;
  securityQuestions: SecurityAnswer[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    role: string;
    _id: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
}

export interface SecurityQuestionsResponse {
  success: boolean;
  message: string;
  data: string[];
}

// Update the authAPI object with proper typing
export const authAPI = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await fetch(`${BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Attach full API error so we can access it later
      throw {
        message: errorData.message || "Registration failed",
        errorSources: errorData.errorSources || [],
        status: response.status,
      };
    }

    return response.json();
  },

  verifyOTP: async (data: VerifyOTPData): Promise<VerifyResponse> => {
    const response = await fetch(`${BASE_URL}/user/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "OTP verification failed");
    }

    return response.json();
  },

  getSecurityQuestions: async (): Promise<SecurityQuestionsResponse> => {
    const response = await fetch(`${BASE_URL}/default-security-questions`);

    if (!response.ok) {
      throw new Error("Failed to fetch security questions");
    }

    return response.json();
  },

  submitSecurityAnswers: async (data: SecurityAnswersData): Promise<any> => {
    const response = await fetch(`${BASE_URL}/security-answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to submit security answers");
    }

    return response.json();
  },
};
