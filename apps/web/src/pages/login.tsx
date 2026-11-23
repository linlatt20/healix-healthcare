import { useEffect } from "react";
import { useLocation } from "wouter";
import { HeartPulse, Shield, Globe, MessageSquare } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import logoImg from "@assets/healix-logo.png";

const FEATURES = [
  {
    icon: HeartPulse,
    title: "Health Record",
    desc: "Manage your personal health profile, medical history, and vitals in one place.",
  },
  {
    icon: Globe,
    title: "Clinic Finder",
    desc: "Locate English-speaking clinics near you and book interpreter sessions.",
  },
  {
    icon: MessageSquare,
    title: "AI Health Chat",
    desc: "Get instant guidance from Healix AI about symptoms and next steps.",
  },
  {
    icon: Shield,
    title: "NHIS Insurance",
    desc: "Understand Korea's National Health Insurance System as a foreigner.",
  },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "linear-gradient(160deg,#0048b4 0%,#0066ff 100%)" }}
      >
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Healix Logo" className="w-10 h-10 object-contain rounded-xl" />
          <span className="text-white text-2xl font-bold tracking-tight">Healix</span>
        </div>

        <div>
          <p className="text-blue-100 text-lg font-medium leading-snug mb-8">
            Your trusted healthcare companion for foreign residents in Korea.
          </p>
          <div className="space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{f.title}</div>
                  <div className="text-blue-100 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200/60 text-xs">
          © 2026 Healix. Serving foreign residents in Korea.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src={logoImg} alt="Healix Logo" className="w-9 h-9 object-contain rounded-lg" />
            <span className="text-xl font-bold text-foreground tracking-tight">Healix</span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-10">
            Sign in to access your health records, clinic bookings, and more.
          </p>

          {/* Google sign-in button */}
          <button
            onClick={login}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 font-medium text-foreground shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Google logo SVG */}
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            {isLoading ? "Loading…" : "Continue with Google"}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed">
            By continuing, you agree to Healix's Terms of Service and Privacy Policy.
            Your health data is stored securely and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}
