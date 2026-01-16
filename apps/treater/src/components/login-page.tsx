import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@hwm/convex";
import {
  FlaskConical,
  Shield,
  FileCheck,
  Recycle,
  ClipboardList,
  ArrowRight,
  Clock,
  CheckCircle2,
  Plus,
} from "lucide-react";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    login: {
      email: "",
      password: "",
    },
    verify: {
      email: "",
      password: "",
    },
    create: {
      fullName: "",
      email: "",
      phoneNumber: "",
      facilityName: "",
      facilityAddress: "",
      accountPassword: "",
      verifyPassword: "",
    },
  });
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<{
    login: { email?: string; password?: string };
    verify: { email?: string; password?: string };
    create: {
      facilityName?: string;
      facilityAddress?: string;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      accountPassword?: string;
      verifyPassword?: string;
    };
  }>({
    login: {},
    verify: {},
    create: {},
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const verifyCredentials = useAction(api.users.queries.verifyAdminCredentials);
  const createTreaterAccount = useMutation(
    api.treaters.mutations.createAccount
  );

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const moveCursorToEnd = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }, 0);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors((prev) => ({ ...prev, login: {} }));

    const errors: {
      email?: string;
      password?: string;
    } = {};

    // Validate email
    if (!formData.login.email?.trim()) {
      errors.email = "Required";
    } else if (!isValidEmail(formData.login.email)) {
      errors.email = "Invalid email";
    }

    // Validate password
    if (!formData.login.password?.trim()) {
      errors.password = "Required";
    }

    // If there are errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, login: errors }));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.login.email, formData.login.password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      // Set error on both fields for invalid login
      setFormErrors((prev) => ({
        ...prev,
        login: {
          email: "Invalid credentials",
          password: "Invalid credentials",
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors((prev) => ({ ...prev, verify: {} }));

    const errors: {
      email?: string;
      password?: string;
    } = {};

    // Validate email
    if (!formData.verify.email?.trim()) {
      errors.email = "Required";
    } else if (!isValidEmail(formData.verify.email)) {
      errors.email = "Invalid email";
    }

    // Validate password
    if (!formData.verify.password?.trim()) {
      errors.password = "Required";
    }

    // If there are errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, verify: errors }));
      setIsLoading(false);
      return;
    }

    try {
      // Verify credentials against environment variables
      const result = await verifyCredentials({
        email: formData.verify.email,
        password: formData.verify.password,
      });

      if (!result.success) {
        // Set error on both fields for invalid credentials
        setFormErrors((prev) => ({
          ...prev,
          verify: {
            email: "Invalid credentials",
            password: "Invalid credentials",
          },
        }));
        setIsLoading(false);
        return;
      }

      // Credentials are valid, show registration form
      console.log("Admin verified:", result.user);
      setIsVerified(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Verification error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors((prev) => ({ ...prev, create: {} }));

    // Validate all required fields
    const {
      facilityName,
      facilityAddress,
      fullName,
      email,
      phoneNumber,
      accountPassword,
      verifyPassword,
    } = formData.create;

    const errors: {
      facilityName?: string;
      facilityAddress?: string;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      accountPassword?: string;
      verifyPassword?: string;
    } = {};

    // Validate facility name
    if (!facilityName?.trim()) {
      errors.facilityName = "Required";
    }

    // Validate facility address
    if (!facilityAddress?.trim()) {
      errors.facilityAddress = "Required";
    }

    // Validate full name
    if (!fullName?.trim()) {
      errors.fullName = "Required";
    }

    // Validate email
    if (!email?.trim()) {
      errors.email = "Required";
    } else if (!isValidEmail(email)) {
      errors.email = "Invalid email";
    }

    // Validate phone number
    if (!phoneNumber?.trim()) {
      errors.phoneNumber = "Required";
    } else if (
      !(
        (phoneNumber.startsWith("0") && phoneNumber.length === 11) ||
        (!phoneNumber.startsWith("0") && phoneNumber.length === 10)
      )
    ) {
      errors.phoneNumber = "Invalid phone number";
    }

    // Validate password
    if (!accountPassword?.trim()) {
      errors.accountPassword = "Required";
    }

    // Validate verify password
    if (!verifyPassword?.trim()) {
      errors.verifyPassword = "Required";
    } else if (accountPassword !== verifyPassword) {
      errors.verifyPassword = "Passwords must match";
    }

    // If there are errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, create: errors }));
      setIsLoading(false);
      return;
    }

    try {
      // Create the treater account
      const treaterId = await createTreaterAccount({
        facilityName,
        facilityAddress,
        contactEmail: email,
        contactPhone: phoneNumber,
      });

      console.log("Treater account created:", treaterId);

      // TODO: Create user account with better-auth using accountPassword
      // For now, just navigate to dashboard
      setIsLoading(false);
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Account creation error:", err);
      setError("Failed to create account. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLoginFields = (field: "email" | "password", value: string) => {
    // Clear field-specific error when user starts typing
    setFormErrors((prev) => {
      const newErrors = { ...prev.login };
      delete newErrors[field];
      return { ...prev, login: newErrors };
    });
    setFormData((prev) => ({
      ...prev,
      login: { ...prev.login, [field]: value },
    }));
  };

  const handleVerifyAccountFields = (field: string, value: string) => {
    // Clear field-specific error when user starts typing
    setFormErrors((prev) => {
      const newErrors = { ...prev.verify };
      delete newErrors[field as keyof typeof newErrors];
      return { ...prev, verify: newErrors };
    });
    setFormData((prev) => ({
      ...prev,
      verify: { ...prev.verify, [field]: value },
    }));
  };

  const handleCreateAccountFields = (field: string, value: string) => {
    // Special validation for phone number
    if (field === "phoneNumber") {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, "");

      // Enforce length limits based on leading 0
      let validatedValue = digitsOnly;
      if (digitsOnly.startsWith("0")) {
        // Limit to 11 digits if starts with 0
        validatedValue = digitsOnly.slice(0, 11);
      } else {
        // Limit to 10 digits if doesn't start with 0
        validatedValue = digitsOnly.slice(0, 10);
      }

      // Only clear error if there's actual valid input
      if (validatedValue) {
        setFormErrors((prev) => {
          const newErrors = { ...prev.create };
          delete newErrors[field as keyof typeof newErrors];
          return { ...prev, create: newErrors };
        });
      }

      setFormData((prev) => ({
        ...prev,
        create: { ...prev.create, [field]: validatedValue },
      }));
    } else {
      // Clear field-specific error when user starts typing
      setFormErrors((prev) => {
        const newErrors = { ...prev.create };
        delete newErrors[field as keyof typeof newErrors];
        return { ...prev, create: newErrors };
      });

      setFormData((prev) => ({
        ...prev,
        create: { ...prev.create, [field]: value },
      }));
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Hero Panel - Scientific Dark */}
      <div className="relative flex-1 bg-hero overflow-hidden lg:h-screen">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 hero-grid" />

        {/* Noise Texture */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Accent Line at Top */}
        <div className="accent-line absolute top-0 left-0 right-0 h-1 z-20" />

        {/* Decorative Hexagon Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="hex-pattern"
              x="0"
              y="0"
              width="56"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-hero-foreground"
              />
              <path
                d="M28 36 L56 52 L56 84 L28 100 L0 84 L0 52 Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-hero-foreground"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>

        {/* Gradient Orbs */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-16 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-12 xl:p-16 text-hero-foreground">
          {/* Logo */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 backdrop-blur-sm">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight block">
                  HWM<span className="text-primary">Treater</span>
                </span>
                <span className="text-hero-muted text-[10px] uppercase tracking-[0.2em] font-medium">
                  Treatment Division
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="py-8 lg:py-0 space-y-8">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Hazardous Waste Treatment Portal
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
                style={{ animationDelay: "200ms" }}
              >
                Precision Treatment
                <br />
                <span className="text-primary">Operations</span>
              </h1>
              <p
                className="text-hero-muted text-base lg:text-lg max-w-lg leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
                style={{ animationDelay: "300ms" }}
              >
                Manage waste intake, monitor treatment processes, generate
                compliance certificates, and maintain full regulatory oversight
                across your facility.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {[
                {
                  icon: FlaskConical,
                  label: "Treatment Tracking",
                  desc: "Process monitoring",
                },
                {
                  icon: FileCheck,
                  label: "COT Generation",
                  desc: "Compliance certificates",
                },
                {
                  icon: Recycle,
                  label: "Waste Processing",
                  desc: "Intake management",
                },
                {
                  icon: ClipboardList,
                  label: "Disposal Batches",
                  desc: "Batch tracking",
                },
              ].map((feature, i) => (
                <div
                  key={feature.label}
                  className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hero-foreground truncate">
                      {feature.label}
                    </p>
                    <p className="text-xs text-hero-muted truncate">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Stats */}
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm animate-in fade-in duration-1000 fill-mode-both"
            style={{ animationDelay: "800ms" }}
          >
            <div className="flex items-center gap-2 text-hero-muted">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>DENR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-hero-muted">
              <Shield className="w-4 h-4 text-primary" />
              <span>ISO Certified</span>
            </div>
            <div className="flex items-center gap-2 text-hero-muted">
              <Clock className="w-4 h-4 text-primary" />
              <span>24/7 Operations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div
        className={`w-full lg:w-[460px] xl:w-[500px] flex flex-col bg-background relative lg:h-screen ${showCreateForm ? "overflow-y-auto" : "overflow-y-hidden"}`}
      >
        {/* Subtle Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top Bar */}
        <div className="relative z-10 flex justify-between items-center p-6 lg:p-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">
              HWM<span className="text-primary">Treater</span>
            </span>
          </div>
          <div className="hidden lg:block" />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs"
            onClick={() => {
              if (showRegister) {
                setShowRegister(false);
                setIsVerified(false);
                setShowCreateForm(false);
                setError("");
                setFormErrors({
                  login: {},
                  verify: {},
                  create: {},
                });
                setFormData({
                  login: { email: "", password: "" },
                  verify: { email: "", password: "" },
                  create: {
                    fullName: "",
                    email: "",
                    phoneNumber: "",
                    facilityName: "",
                    facilityAddress: "",
                    accountPassword: "",
                    verifyPassword: "",
                  },
                });
              }
            }}
          >
            {showRegister ? "Back to login" : "Need help?"}
          </Button>
        </div>

        {/* Form Container */}
        <div className="relative z-10 flex-1 flex justify-center px-8 pb-12 lg:px-12 py-8">
          <div
            className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            {!showRegister ? (
              <>
                {/* Login Form Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    Welcome back
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sign in to access your treatment facility dashboard.
                  </p>
                </div>

                {/* Login Form */}
                <form
                  onSubmit={handleSignIn}
                  className="space-y-5"
                  autoComplete="off"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="email"
                        className="text-foreground font-medium"
                      >
                        Email address
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.login.email ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.login.email || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="email"
                      type="text"
                      placeholder="operator@facility.com"
                      value={formData.login.email}
                      onChange={(e) => handleLoginFields("email", e.target.value)}
                      onFocus={moveCursorToEnd}
                      className="h-11"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="password"
                        className="text-foreground font-medium"
                      >
                        Password
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.login.password ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.login.password || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.login.password}
                      onChange={(e) =>
                        handleLoginFields("password", e.target.value)
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-11 font-semibold gap-2 group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <>
                        Sign in to dashboard
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-xs text-muted-foreground uppercase tracking-wider">
                      New to the platform?
                    </span>
                  </div>
                </div>

                {/* Help Section */}
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Accounts are provisioned by your facility administrator.
                    <br />
                    Contact them for access credentials.
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-10 gap-2"
                    onClick={() => setShowRegister(true)}
                  >
                    Proceed
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-4 mt-10 text-xs text-muted-foreground">
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Support
                  </a>
                </div>
              </>
            ) : !isVerified ? (
              <>
                {/* Verification Form Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    Verify account
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Creating an account requires facility administrator
                    credentials.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-[1.7vh] text-destructive">{error}</p>
                  </div>
                )}

                {/* Verification Form */}
                <form
                  onSubmit={handleVerification}
                  className="space-y-5"
                  autoComplete="off"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="email"
                        className="text-foreground font-medium"
                      >
                        Email address
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.verify.email ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.verify.email || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter email"
                      value={formData.verify.email}
                      onChange={(e) =>
                        handleVerifyAccountFields("email", e.target.value)
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="password"
                        className="text-foreground font-medium"
                      >
                        Password
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.verify.password ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.verify.password || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.verify.password}
                      onChange={(e) =>
                        handleVerifyAccountFields("password", e.target.value)
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-11 font-semibold gap-2 group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying account...
                      </span>
                    ) : (
                      <>
                        Verify account
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-4 mt-10 text-xs text-muted-foreground">
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Support
                  </a>
                </div>
              </>
            ) : !showCreateForm ? (
              <>
                {/* Verification Success */}
                <div className="mb-8">
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2 text-center">
                    Verification successful
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed text-center">
                    Choose an option to continue.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full h-11 font-semibold gap-2 group"
                    onClick={() => {
                      setShowRegister(false);
                      setIsVerified(false);
                      setError("");
                      setFormErrors({
                        login: {},
                        verify: {},
                        create: {},
                      });
                      setFormData({
                        login: { email: "", password: "" },
                        verify: { email: "", password: "" },
                        create: {
                          fullName: "",
                          email: "",
                          phoneNumber: "",
                          facilityName: "",
                          facilityAddress: "",
                          accountPassword: "",
                          verifyPassword: "",
                        },
                      });
                    }}
                  >
                    Login
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-11 font-semibold gap-2"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Create Account
                  </Button>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-4 mt-10 text-xs text-muted-foreground">
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Support
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Create Account Form Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    Create account
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enter new treater account details.
                  </p>
                </div>

                {/* Create Account Form */}
                <form
                  onSubmit={handleCreateAccount}
                  className="space-y-5"
                  autoComplete="off"
                >
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      Facility Information
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="facilityName"
                        className="text-foreground font-medium"
                      >
                        Facility name
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.facilityName ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.facilityName || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="facilityName"
                      type="text"
                      placeholder="ABC Facility"
                      value={formData.create.facilityName}
                      onChange={(e) =>
                        handleCreateAccountFields(
                          "facilityName",
                          e.target.value
                        )
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="facilityAddress"
                        className="text-foreground font-medium"
                      >
                        Facility address
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.facilityAddress ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.facilityAddress || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="facilityAddress"
                      type="text"
                      placeholder="Cebu City"
                      value={formData.create.facilityAddress}
                      onChange={(e) =>
                        handleCreateAccountFields(
                          "facilityAddress",
                          e.target.value
                        )
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      User Information
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      (This will be used for sign-in)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="fullName"
                        className="text-foreground font-medium"
                      >
                        Full name
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.fullName ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.fullName || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Juan Dela Cruz"
                      value={formData.create.fullName}
                      onChange={(e) =>
                        handleCreateAccountFields("fullName", e.target.value)
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="accountEmail"
                        className="text-foreground font-medium"
                      >
                        Email address
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.email ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.email || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="accountEmail"
                      type="text"
                      placeholder="admin@facility.com"
                      value={formData.create.email}
                      onChange={(e) =>
                        handleCreateAccountFields("email", e.target.value)
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="phoneNumber"
                        className="text-foreground font-medium"
                      >
                        Phone number
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.phoneNumber ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.phoneNumber || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder="09171234567"
                      value={formData.create.phoneNumber}
                      onChange={(e) =>
                        handleCreateAccountFields("phoneNumber", e.target.value)
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="accountPassword"
                        className="text-foreground font-medium"
                      >
                        Password
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.accountPassword ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.accountPassword || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="accountPassword"
                      type="password"
                      placeholder="Enter password"
                      value={formData.create.accountPassword}
                      onChange={(e) =>
                        handleCreateAccountFields(
                          "accountPassword",
                          e.target.value
                        )
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label
                        htmlFor="verifyPassword"
                        className="text-foreground font-medium"
                      >
                        Verify password
                      </Label>
                      <span
                        className={`text-xs text-destructive transition-opacity duration-300 ${formErrors.create.verifyPassword ? "opacity-100 animate-in fade-in slide-in-from-right-1" : "opacity-0"}`}
                      >
                        {formErrors.create.verifyPassword || "\u00A0"}
                      </span>
                    </div>
                    <Input
                      id="verifyPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={formData.create.verifyPassword}
                      onChange={(e) =>
                        handleCreateAccountFields(
                          "verifyPassword",
                          e.target.value
                        )
                      }
                      onFocus={moveCursorToEnd}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-11 font-semibold gap-2 group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-4 mt-10 text-xs text-muted-foreground">
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Support
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
    </div>
  );
}
