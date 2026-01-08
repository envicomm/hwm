import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import {
  Truck,
  Shield,
  FileText,
  BarChart3,
  Route as RouteIcon,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Hero Panel - Industrial Dark */}
      <div className="relative flex-1 bg-hero overflow-hidden">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 hero-grid" />

        {/* Noise Texture */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Accent Line at Top */}
        <div className="accent-line absolute top-0 left-0 right-0 h-1 z-20" />

        {/* Decorative Route Lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="route-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path
                d="M0 100 Q50 50, 100 100 T200 100"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-hero-foreground"
              />
              <circle cx="0" cy="100" r="4" fill="currentColor" className="text-primary" />
              <circle cx="100" cy="100" r="4" fill="currentColor" className="text-primary" />
              <circle cx="200" cy="100" r="4" fill="currentColor" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#route-pattern)" />
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
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight block">
                  HWM<span className="text-primary">Haul</span>
                </span>
                <span className="text-hero-muted text-[10px] uppercase tracking-[0.2em] font-medium">
                  Transport Division
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
              Hazardous Waste Transport Portal
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
                style={{ animationDelay: "200ms" }}
              >
                Precision Hauling
                <br />
                <span className="text-primary">Operations</span>
              </h1>
              <p
                className="text-hero-muted text-base lg:text-lg max-w-lg leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
                style={{ animationDelay: "300ms" }}
              >
                Coordinate pickups, optimize routes, track manifests, and maintain
                full regulatory compliance across your hazardous waste transport network.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {[
                { icon: RouteIcon, label: "Route Optimization", desc: "AI-powered scheduling" },
                { icon: FileText, label: "Manifest Tracking", desc: "Digital documentation" },
                { icon: Shield, label: "Compliance Ready", desc: "EPA & DOT certified" },
                { icon: BarChart3, label: "Live Analytics", desc: "Real-time insights" },
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
              <span>EPA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-hero-muted">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>DOT Certified</span>
            </div>
            <div className="flex items-center gap-2 text-hero-muted">
              <Clock className="w-4 h-4 text-primary" />
              <span>24/7 Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col bg-background relative">
        {/* Subtle Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px"
          }}
        />

        {/* Top Bar */}
        <div className="relative z-10 flex justify-between items-center p-6 lg:p-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">
              HWM<span className="text-primary">Haul</span>
            </span>
          </div>
          <div className="hidden lg:block" />
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
            Need help?
          </Button>
        </div>

        {/* Login Form Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 pb-12 lg:px-12">
          <div
            className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in to access your hauling operations dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dispatcher@facility.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                Accounts are provisioned by your Treatment Facility.
                <br />
                Contact your administrator for access.
              </p>
              <Button variant="outline" size="lg" className="w-full h-10 gap-2">
                <MapPin className="w-4 h-4" />
                Contact facility admin
              </Button>
            </div>

            {/* Footer Links */}
            <div className="flex items-center justify-center gap-4 mt-10 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <span className="w-1 h-1 rounded-full bg-border" />
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <span className="w-1 h-1 rounded-full bg-border" />
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
    </div>
  );
}
