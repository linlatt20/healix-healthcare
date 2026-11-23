import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Input, Select, Label, Badge } from "@/components/shared-ui";
import { Calculator, Shield, HelpCircle, CheckCircle2, DollarSign, PieChart, ChevronDown, User, Hospital, CreditCard, HardHat, ExternalLink, Phone, Info } from "lucide-react";
import { useGetInsuranceGuide, useCalculateInsurance } from "@workspace/api-client-react";
import { InsuranceCalculationRequestInsuranceType, InsuranceCalculationRequestVisitType, InsuranceCalculationResponse } from "@workspace/api-client-react/src/generated/api.schemas";
import { formatCurrency } from "@/lib/utils";

type GuideItem = { q: string; intro?: string; bullets?: string[]; numbered?: string[] };

const GUIDE_SECTIONS: { id: string; icon: typeof User; title: string; desc: string; color: string; bg: string; border: string; items: GuideItem[] }[] = [
  {
    id: "how-nhis-works",
    icon: User,
    title: "How NHIS Works",
    desc: "Who needs it and when?",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    items: [
      {
        q: "Who needs NHIS?",
        bullets: [
          "If you stay in Korea more than 6 months, enrollment is usually mandatory.",
          "Some students/workers may be enrolled earlier through school or employer.",
        ],
      },
      {
        q: "When does coverage start?",
        bullets: [
          "Usually starts automatically after 6 months of residence.",
          "If registered by school/employer, it may start earlier.",
        ],
      },
      {
        q: "Can I use only private insurance?",
        bullets: [
          "No. NHIS is mandatory.",
          "Private insurance can only be additional coverage.",
        ],
      },
      {
        q: "What should I bring to the hospital?",
        bullets: [
          "Alien Registration Card (ARC)",
          "Insurance info is usually linked automatically.",
        ],
      },
    ],
  },
  {
    id: "cost-at-hospital",
    icon: Hospital,
    title: "Cost at Hospital",
    desc: "NHIS coverage and co-pay",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    items: [
      {
        q: "How much do I pay?",
        bullets: [
          "NHIS usually covers 50–80% of eligible medical costs.",
          "You will pay the remaining amount as a co-payment.",
        ],
      },
      {
        q: "What is NOT covered?",
        intro: "Some services are not covered by NHIS, including:",
        bullets: [
          "Cosmetic procedures (Botox, fillers, laser skin treatments)",
          "Double eyelid surgery",
          "Premium full body health check-ups",
          "Some dental treatments (braces, implants, whitening)",
          "Upgraded hospital rooms",
          "Certain advanced imaging tests",
        ],
      },
      {
        q: "Emergency room",
        intro: "Emergency room visits are covered, but they are more expensive than regular outpatient visits.",
      },
      {
        q: "Ambulance",
        intro: "Public emergency ambulances in Korea are usually free of charge.",
      },
    ],
  },
  {
    id: "payment-unpaid",
    icon: CreditCard,
    title: "Payment & Unpaid Fees",
    desc: "Check premium pay & NHIS bill",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    items: [
      {
        q: "How much is the monthly premium?",
        bullets: [
          "Depends on visa type and income.",
          "Students and E-9 workers usually pay a fixed amount.",
        ],
      },
      {
        q: "What if I miss a payment?",
        bullets: [
          "You will receive a late notice.",
          "A small late fee may be added.",
        ],
      },
      {
        q: "What if I don't pay for several months?",
        bullets: [
          "Coverage may be suspended.",
          "It may affect visa status.",
          "Legal collection procedures may begin.",
        ],
      },
      {
        q: "What should I do if I missed payment?",
        intro: "Pay as soon as possible through:",
        bullets: [
          "Online banking",
          "NHIS website",
          "NHIS mobile app",
        ],
      },
      {
        q: "How can I check unpaid insurance?",
        bullets: [
          "NHIS website",
          "NHIS mobile app",
          "Call NHIS (1577-1000)",
        ],
      },
    ],
  },
  {
    id: "work-injury",
    icon: HardHat,
    title: "Work Injury (E-9)",
    desc: "Insurance for job injuries",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    items: [
      {
        q: "Which insurance applies?",
        intro: "If you are injured during work, it is covered by Workers' Compensation Insurance, not NHIS.",
      },
      {
        q: "Coverage",
        bullets: [
          "This mandatory insurance covers 100% of treatment costs (hospital care, surgery, medication, rehabilitation).",
          "If you cannot work during recovery, you may receive about 70% of your wage.",
        ],
      },
      {
        q: "What should I do?",
        numbered: [
          "Inform your employer",
          "Go to a hospital",
          "Tell staff it is a workplace accident",
          "File a compensation claim",
        ],
      },
      {
        q: "Need help?",
        intro: "Ministry of Employment & Labor: 1350",
      },
    ],
  },
];

function GuideSection({ section }: { section: typeof GUIDE_SECTIONS[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className={`rounded-2xl border ${section.border} overflow-hidden transition-shadow hover:shadow-md`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-4 p-5 text-left ${open ? section.bg : "bg-card"} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.bg} ${section.border} border`}>
            <Icon className={`w-5 h-5 ${section.color}`} />
          </div>
          <div>
            <p className="font-bold text-foreground text-base">{section.title}</p>
            <p className="text-xs text-muted-foreground">{section.desc}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 pt-1 ${section.bg} space-y-4`}>
              {section.items.map((item, idx) => (
                <div key={idx} className="bg-white/70 rounded-xl p-4 border border-white/80">
                  <p className={`font-semibold text-sm mb-1.5 flex items-center gap-1.5 ${section.color}`}>
                    <span className="inline-block w-2 h-2 rounded-sm bg-current opacity-80" />
                    {item.q}
                  </p>
                  {item.intro && (
                    <p className="text-sm text-foreground/80 mb-1.5">{item.intro}</p>
                  )}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="space-y-1">
                      {item.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.numbered && item.numbered.length > 0 && (
                    <ol className="space-y-1">
                      {item.numbered.map((n, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className={`font-bold shrink-0 ${section.color}`}>{i + 1}.</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideContent() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Understanding Your Medical Costs</h2>
        <p className="text-muted-foreground text-sm">Before You Go to the Hospital</p>
      </div>

      <div className="space-y-3">
        {GUIDE_SECTIONS.map((section) => (
          <GuideSection key={section.id} section={section} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        <a
          href="https://www.nhis.or.kr/nhis/index.do"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground underline underline-offset-2 group-hover:text-primary transition-colors">Check my NHIS premium</p>
              <p className="text-xs text-muted-foreground">Go to NHIS</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>

        <a
          href="tel:1577-1000"
          className="flex items-center justify-between w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Call NHIS for assistance</p>
              <p className="text-xs text-muted-foreground">Dial 1577-1000</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      </div>
    </div>
  );
}

export default function Insurance() {
  const [tab, setTab] = useState<"calculator" | "guide">("calculator");
  
  const { data: guideData } = useGetInsuranceGuide();
  const calculateMutation = useCalculateInsurance();

  const [insType, setInsType] = useState<InsuranceCalculationRequestInsuranceType>("nhis_employed");
  const [visType, setVisType] = useState<InsuranceCalculationRequestVisitType>("clinic");
  const [cost, setCost] = useState("50000");
  const [result, setResult] = useState<InsuranceCalculationResponse | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate({
      data: {
        insuranceType: insType,
        visitType: visType,
        totalCost: Number(cost) || 0
      }
    }, {
      onSuccess: (data) => setResult(data)
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-5xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">NHIS Insurance Guide</h1>
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl inline-flex backdrop-blur-md border border-border/50">
          <Button 
            variant={tab === "calculator" ? "default" : "ghost"} 
            onClick={() => setTab("calculator")}
            className="rounded-lg shadow-none"
          >
            <Calculator className="w-4 h-4 mr-2" /> Payment Calculator
          </Button>
          <Button 
            variant={tab === "guide" ? "default" : "ghost"} 
            onClick={() => setTab("guide")}
            className="rounded-lg shadow-none"
          >
            <Shield className="w-4 h-4 mr-2" /> Official Guide
          </Button>
        </div>
      </div>

      {tab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-2 p-6 md:p-8 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Estimate Bill
            </h2>
            <form onSubmit={handleCalculate} className="space-y-5">
              <div>
                <Label className="mb-2 block">Insurance Status</Label>
                <Select value={insType} onChange={(e) => setInsType(e.target.value as any)}>
                  <option value="nhis_employed">NHIS (Workplace)</option>
                  <option value="nhis_self">NHIS (Self-employed)</option>
                  <option value="uninsured">Uninsured (Full Pay)</option>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Type of Facility</Label>
                <Select value={visType} onChange={(e) => setVisType(e.target.value as any)}>
                  <option value="clinic">Local Clinic (의원)</option>
                  <option value="hospital">Hospital (병원)</option>
                  <option value="tertiary">Tertiary/General Hospital (종합병원)</option>
                  <option value="pharmacy">Pharmacy (약국)</option>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Estimated Total Cost (KRW)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₩</span>
                  <Input 
                    type="number" 
                    value={cost} 
                    onChange={(e) => setCost(e.target.value)} 
                    className="pl-9 font-mono text-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Enter the gross amount before insurance.</p>
              </div>
              <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={calculateMutation.isPending}>
                {calculateMutation.isPending ? "Calculating..." : "Calculate Copay"}
              </Button>
            </form>
          </Card>

          <div className="lg:col-span-3">
            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-8 bg-gradient-to-br from-primary to-accent text-white overflow-hidden relative shadow-2xl shadow-primary/20">
                  <div className="absolute right-0 top-0 opacity-10 scale-150 -translate-y-1/4 translate-x-1/4">
                    <PieChart className="w-64 h-64" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-medium text-white/80 mb-2">Your Estimated Copay</h3>
                    <div className="text-5xl md:text-6xl font-display font-bold mb-8">
                      {formatCurrency(result.patientCopay)}
                    </div>

                    <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-md border border-white/10 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white/80 font-medium">Total Treatment Cost</span>
                        <span className="font-mono text-lg">{formatCurrency(result.totalCost)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-300 mb-4 pb-4 border-b border-white/10">
                        <span className="font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> NHIS Coverage ({(100 - result.copayPercentage)}%)</span>
                        <span className="font-mono text-lg">-{formatCurrency(result.nhisCoverage)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>You Pay ({result.copayPercentage}%)</span>
                        <span className="font-mono">{formatCurrency(result.patientCopay)}</span>
                      </div>
                    </div>

                    {result.notes && result.notes.length > 0 && (
                      <div className="space-y-2">
                        {result.notes.map((note, i) => (
                          <div key={i} className="flex gap-2 text-sm text-white/70 bg-black/10 p-3 rounded-lg">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-muted/20">
                <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Ready to Calculate</h3>
                <p className="text-muted-foreground max-w-sm">Enter your insurance details and estimated cost on the left to see how much NHIS will cover.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "guide" && (
        <GuideContent />
      )}

    </motion.div>
  );
}
