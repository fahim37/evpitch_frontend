"use client";

import type React from "react";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, User, Mail, Lock, Building2 } from "lucide-react";
import Link from "next/link";
import { authAPI, type RegisterData } from "@/lib/auth-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ⬇️ custom MM/YYYY input (still unused here, but left as-is if you plan to use later)
import CustomDateInput from "@/components/custom-date-input";

/* =========================
   Types / constants
========================= */
interface Country {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

type ValidRole = "candidate" | "recruiter" | "company";
const VALID_ROLES: ValidRole[] = ["candidate", "recruiter", "company"];

/* =========================
   URL Role selector (unchanged)
========================= */
function RoleSelector({ setRole }: { setRole: (role: ValidRole) => void }) {
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role") as ValidRole | null;
  const initialRole =
    roleFromUrl && VALID_ROLES.includes(roleFromUrl)
      ? roleFromUrl
      : "candidate";

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole, setRole]);

  return null;
}

/* =========================
   Validation Helpers
========================= */
const nameRegex = /^[A-Za-z' -]*$/; // for people: letters, spaces, apostrophes, hyphens
const companyNameRegex = /^[A-Za-z0-9&.,' -]*$/; // for companies: allow digits and & , . ' -

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* =========================
   Component
========================= */
export default function RegisterPage() {
  const router = useRouter();

  /* =========================
     State (no localStorage)
  ========================= */
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "candidate",
  });

  const [dob, setDob] = useState<Date | null>(null);
  const [firstName, setFirstName] = useState<string>(""); // Person first name OR Company name
  const [surname, setSurname] = useState<string>(""); // Person surname OR Company suffix (optional)
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<ValidRole>("candidate");

  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUpperCase: false,
    hasLowerCase: false,
  });

  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterData | null>(
    null
  );
  const [showUnderAgeDialog, setShowUnderAgeDialog] = useState(false);

  // 👉 control country popover
  const [openCountryPopover, setOpenCountryPopover] = useState(false);

  /* =========================
     React Query Mutation
  ========================= */
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      toast.success("Account created. Please verify the OTP we sent to your email.");
      router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
      if (error.errorSources?.length > 0) {
        toast.error(error.errorSources[0].message);
      } else {
        toast.error(error.message);
      }
    },
  });

  /* =========================
     Effects
  ========================= */
  // Keep formData.role in sync with selectedRole
  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  }, [selectedRole]);

  // Fetch countries once (new API shape)
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/countries`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        // New response: { success: boolean, message: string, data: Country[] }
        if (json.success && Array.isArray(json.data)) {
          const apiCountries = json.data as Country[];
          // optional: sort alphabetically by name
          apiCountries.sort((a, b) => a.country.localeCompare(b.country));
          setCountries(apiCountries);
        } else {
          console.error("Unexpected countries response:", json);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error("Failed to load countries. Please try again.");
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     Password Validation
  ========================= */
  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 10,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  /* =========================
     Controlled Handlers
  ========================= */
  const handleInputChange = (field: keyof RegisterData, value: string) => {
    if (field === "email") {
      value = value.trim().toLowerCase();
    }
    if (field === "password") {
      validatePassword(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setFormData((prev) => ({
      ...prev,
      address: value,
    }));
  };

  /* =========================
     DOB / Age helpers (unchanged logic)
  ========================= */
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const cutoff = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 16);
    return d;
  }, [today]);

  const oldestAllowed = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 100);
    return d;
  }, [today]);

  const dobISO = useMemo(
    () =>
      dob
        ? new Date(Date.UTC(dob.getFullYear(), dob.getMonth(), 1))
            .toISOString()
            .slice(0, 10)
        : "",
    [dob]
  );

  const isUnder16 = useMemo(() => {
    if (!dob) return false;
    const dobPlus16 = new Date(dob);
    dobPlus16.setFullYear(dobPlus16.getFullYear() + 16);
    return dobPlus16 > today;
  }, [dob, today]);

  useEffect(() => {
    if (dob && isUnder16) setShowUnderAgeDialog(true);
  }, [dob, isUnder16]);

  /* =========================
     CTA Text
  ========================= */
  const primaryCtaText = useMemo(() => {
    if (registerMutation.isPending) return "Creating account...";
    if (selectedRole === "candidate") return "Sign up as a Candidate";
    if (selectedRole === "recruiter") return "Sign up as a Recruiter";
    return "Sign up as a Company";
  }, [registerMutation.isPending, selectedRole]);

  const needsDob = true;

  /* =========================
     Submit Validations (role-aware)
  ========================= */
  const validateBeforeSubmit = () => {
    if (selectedRole === "company") {
      if (!firstName.trim() || !companyNameRegex.test(firstName)) {
        toast.error("Please enter a valid company name.");
        return false;
      }
      if (surname && !companyNameRegex.test(surname)) {
        toast.error(
          "Please use only letters, numbers, spaces, &, ., apostrophes or hyphens in the company suffix."
        );
        return false;
      }
    } else {
      if (!firstName.trim() || !nameRegex.test(firstName)) {
        toast.error("Please enter a valid first name.");
        return false;
      }
      if (!surname.trim() || !nameRegex.test(surname)) {
        toast.error("Please enter a valid surname.");
        return false;
      }
    }

    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!formData.address) {
      toast.error("Please select your country.");
      return false;
    }

    if (!dob) {
      setShowUnderAgeDialog(true);
      return false;
    }

    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    if (!validatePassword(formData.password)) {
      toast.error("Password does not meet the requirements.");
      return false;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions.");
      return false;
    }

    return true;
  };

  const actuallySubmit = (data: RegisterData) => {
    const payload = {
      ...data,
      dateOfbirth: dob
        ? new Date(Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate()))
            .toISOString()
            .slice(0, 10)
        : undefined,
    } as unknown as RegisterData;
    registerMutation.mutate(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    // Build the "name" based on role:
    const computedName =
      selectedRole === "company"
        ? `${firstName} ${surname}`.trim() // Company Name + optional suffix
        : `${firstName} ${surname}`.trim(); // Person full name

    const fullFormData: RegisterData = {
      ...formData,
      name: computedName,
    };
    setPendingFormData(fullFormData);
    setShowRoleConfirm(true);
  };

  const secondaryButtons = useMemo(
    () => VALID_ROLES.filter((r) => r !== selectedRole),
    [selectedRole]
  );

  const handleSecondaryRoleClick = (clickedRole: ValidRole) => {
    if (clickedRole === selectedRole) return;
    setSelectedRole(clickedRole);
  };

  /* =========================
     Render
  ========================= */
  const isCompany = selectedRole === "company";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading role...</div>}>
        <RoleSelector setRole={setSelectedRole} />
      </Suspense>

      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Create Your Account
          </CardTitle>
          <CardDescription>
            Sign-up and pitch your way into a new role
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First name OR Company name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {isCompany ? "Company Name" : "First Name"}
              </Label>
              <div className="relative">
                {isCompany ? (
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="firstName"
                  placeholder={
                    isCompany ? "Enter Company Name" : "Enter First Name"
                  }
                  value={firstName}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = isCompany
                      ? raw.replace(/[^A-Za-z0-9&.,' -]/g, "")
                      : raw.replace(/[^A-Za-z' -]/g, "");
                    setFirstName(val);
                  }}
                  className="pl-10"
                  required
                />
              </div>
              {isCompany && (
                <p className="text-xs text-muted-foreground">
                  We’ll use this as your account name.
                </p>
              )}
            </div>

            {/* Surname OR Company suffix (optional) */}
            <div className="space-y-2">
              <Label htmlFor="surname">
                {isCompany ? "Company Suffix (optional)" : "Surname"}
              </Label>
              <div className="relative">
                {isCompany ? (
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="surname"
                  placeholder={
                    isCompany
                      ? "e.g., Ltd, Inc, GmbH (optional)"
                      : "Enter Surname"
                  }
                  value={surname}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = isCompany
                      ? raw.replace(/[^A-Za-z0-9&.,' -]/g, "")
                      : raw.replace(/[^A-Za-z' -]/g, "");
                    setSurname(val);
                  }}
                  className="pl-10"
                  required={!isCompany}
                />
              </div>
              {isCompany && (
                <p className="text-xs text-muted-foreground">
                  Add a legal suffix if applicable (optional).
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {selectedRole === "recruiter"
                  ? "Recruiter Email"
                  : selectedRole === "company"
                  ? "Company Email"
                  : "Personal Email"}
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    selectedRole === "recruiter"
                      ? "Enter your recruiter email"
                      : selectedRole === "company"
                      ? "Enter your company email"
                      : "Enter your personal email"
                  }
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && !emailRegex.test(v)) {
                      toast.error("Invalid email format.");
                    }
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Country (with Combobox) */}
            <div className="space-y-2">
              <Label htmlFor="address">Country</Label>
              <Popover
                open={openCountryPopover}
                onOpenChange={setOpenCountryPopover}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !selectedCountry && "text-muted-foreground"
                    )}
                    disabled={isLoadingCountries}
                  >
                    {isLoadingCountries
                      ? "Loading countries..."
                      : selectedCountry || "Select country"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.iso2}
                            onSelect={() => {
                              // Store the country name in formData.address
                              handleCountryChange(country.country);
                              setOpenCountryPopover(false); // close popover on select
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                country.country === selectedCountry
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {country.country}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {formData.password && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-red-600 mb-1">
                    Passwords should be:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p
                      className={cn(
                        passwordValidation.minLength
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 10 characters
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasNumber
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 number
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasSpecialChar
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 special character
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasUpperCase
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 upper case character
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasLowerCase
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 lower case character
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-pressed={showConfirmPassword}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Age verification */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ageVerification"
                  checked={!!dob}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() - 16);
                      d.setHours(0, 0, 0, 0);
                      setDob(d);
                    } else {
                      setDob(null);
                    }
                  }}
                />
                <Label htmlFor="ageVerification" className="text-sm">
                  I confirm I am 16 years of age or older
                </Label>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link
                  href="/terms-condition"
                  target="_blank"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Terms &amp; Conditions
                </Link>
              </Label>
            </div>

            {/* Primary submit */}
            <Button
              id="primary-cta"
              type="submit"
              className="w-full font-bold text-md transition duration-150 ease-in-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
              disabled={registerMutation.isPending}
              aria-live="polite"
            >
              {primaryCtaText}
            </Button>

            {/* Secondary role toggles */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2 text-center">
                Prefer a different role?
              </p>
              <div className="flex gap-2">
                {secondaryButtons.map((value) => {
                  const label =
                    value === "recruiter"
                      ? "Sign up as a Recruiter"
                      : value === "company"
                      ? "Sign up as a Company"
                      : "Sign up as a Candidate";

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSecondaryRoleClick(value)}
                      className={cn(
                        "w-full px-4 py-2 border rounded-md transition transform duration-150 ease-in-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1",
                        selectedRole === value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      )}
                      aria-label={`Switch primary role to ${value}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Currently selected:{" "}
                <span className="font-semibold">{selectedRole}</span>. Submit to
                continue.
              </p>

              <div aria-live="polite" className="sr-only">
                Role changed to {selectedRole}
              </div>
            </div>

            {/* Login link */}
            <div className="text-center">
              <span className="text-sm font-semibold text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Sign In Here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Role confirmation */}
      <AlertDialog open={showRoleConfirm} onOpenChange={setShowRoleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your sign-up role</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create a{" "}
              <span className="font-semibold">
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </span>{" "}
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div>
              {isCompany ? "Company" : "Name"}:{" "}
              <span className="font-medium">
                {(
                  (isCompany
                    ? `${firstName} ${surname}`
                    : `${firstName} ${surname}`) || ""
                ).trim() || "—"}
              </span>
            </div>
            <div>
              Email:{" "}
              <span className="font-medium">{formData.email || "—"}</span>
            </div>
            <div>
              Country:{" "}
              <span className="font-medium">{formData.address || "—"}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setSelectedRole("candidate");
                  setShowRoleConfirm(false);
                }}
              >
                Change role
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                onClick={() => {
                  if (pendingFormData) {
                    const payload: RegisterData = {
                      ...pendingFormData,
                      role: selectedRole,
                      // name already computed in pendingFormData
                    };
                    if (isUnder16) {
                      setShowRoleConfirm(false);
                      setShowUnderAgeDialog(true);
                      return;
                    }
                    actuallySubmit(payload);
                  }
                  setShowRoleConfirm(false);
                }}
              >
                Confirm &amp; Continue
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Under-16 dialog */}
      <AlertDialog
        open={showUnderAgeDialog}
        onOpenChange={setShowUnderAgeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Age Requirement</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Sorry we&apos;re unable to register you today. We look forward
                to welcoming you when you reach the minimum age of 16.
              </span>
              <br />
              <span className="text-xs text-muted-foreground">
                If you selected the wrong month or year, please adjust your Date
                of Birth above.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button type="button">OK</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
