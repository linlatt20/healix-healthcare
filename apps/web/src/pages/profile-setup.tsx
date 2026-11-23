import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, Check, User, HeartPulse, Phone } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import logoImg from "@assets/healix-logo.png";

type Step = 1 | 2 | 3;

interface FormData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  bloodType: string;
  height: string;
  weight: string;
  allergies: string;
  medications: string;
  conditions: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const NATIONALITIES = [
  "American", "British", "Canadian", "Australian", "Chinese", "Japanese",
  "French", "German", "Indian", "Filipino", "Vietnamese", "Other",
];

const STEPS = [
  { num: 1 as Step, label: "Personal Info", icon: User },
  { num: 2 as Step, label: "Medical Background", icon: HeartPulse },
  { num: 3 as Step, label: "Emergency Contact", icon: Phone },
];

export default function ProfileSetupPage() {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: "",
    dateOfBirth: "",
    nationality: "",
    bloodType: "",
    height: "",
    weight: "",
    allergies: "",
    medications: "",
    conditions: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      if (user?.profileSetupComplete === 1) {
        navigate("/health-record");
        return;
      }
      if (user?.firstName || user?.lastName) {
        setForm((f) => ({
          ...f,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
        }));
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canNext = (): boolean => {
    if (step === 1) return !!form.fullName.trim();
    if (step === 2) return true;
    return !!form.emergencyName.trim() && !!form.emergencyPhone.trim();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch("/api/health-record", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth || null,
          nationality: form.nationality || null,
          bloodType: form.bloodType || null,
          height: form.height ? parseFloat(form.height) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          allergies: form.allergies ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
          medications: form.medications ? form.medications.split(",").map((s) => s.trim()).filter(Boolean) : [],
          conditions: form.conditions ? form.conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
          emergencyContact: {
            name: form.emergencyName,
            phone: form.emergencyPhone,
            relation: form.emergencyRelation,
          },
        }),
      });

      await fetch("/api/auth/complete-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      window.location.href = `${base}/health-record`;
    } catch {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <img src={logoImg} alt="Healix" className="w-8 h-8 object-contain rounded-lg" />
          <span className="text-lg font-bold text-foreground">Healix</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">Set up your health profile</h1>
        <p className="text-muted-foreground text-sm mb-8">
          This takes about 2 minutes. You can always update it later.
        </p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${active ? "text-primary" : done ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    done ? "bg-primary border-primary text-primary-foreground"
                    : active ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground"
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > s.num ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name <span className="text-destructive">*</span></label>
                <input
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="e.g. Sarah Kim"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={set("dateOfBirth")}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nationality</label>
                <select
                  value={form.nationality}
                  onChange={set("nationality")}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Blood Type</label>
                <select
                  value={form.bloodType}
                  onChange={set("bloodType")}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  <option value="">Select blood type</option>
                  {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={set("height")}
                    placeholder="170"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={set("weight")}
                    placeholder="65"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Allergies</label>
                <textarea
                  value={form.allergies}
                  onChange={set("allergies")}
                  rows={2}
                  placeholder="e.g. Penicillin, Peanuts (comma-separated)"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Current Medications</label>
                <textarea
                  value={form.medications}
                  onChange={set("medications")}
                  rows={2}
                  placeholder="e.g. Metformin 500mg, Vitamin D (comma-separated)"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Medical Conditions</label>
                <textarea
                  value={form.conditions}
                  onChange={set("conditions")}
                  rows={2}
                  placeholder="e.g. Type 2 Diabetes, Hypertension (comma-separated)"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground -mt-1 mb-2">
                Add someone we can contact in a medical emergency.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Contact Name <span className="text-destructive">*</span></label>
                <input
                  value={form.emergencyName}
                  onChange={set("emergencyName")}
                  placeholder="e.g. Jane Kim"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number <span className="text-destructive">*</span></label>
                <input
                  value={form.emergencyPhone}
                  onChange={set("emergencyPhone")}
                  placeholder="e.g. +82 10 1234 5678"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Relationship</label>
                <input
                  value={form.emergencyRelation}
                  onChange={set("emergencyRelation")}
                  placeholder="e.g. Spouse, Parent, Friend"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button
            onClick={() => {
              fetch("/api/auth/complete-profile", { method: "POST", credentials: "include" })
                .then(() => {
                  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
                  window.location.href = base || "/";
                });
            }}
            className="underline hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}
