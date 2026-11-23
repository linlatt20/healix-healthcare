import { Router, type IRouter } from "express";

const router: IRouter = Router();

const COPAY_RATES: Record<string, Record<string, number>> = {
  nhis_employed: {
    clinic: 0.30,
    hospital: 0.40,
    tertiary: 0.60,
    emergency: 0.20,
    dental: 0.50,
    pharmacy: 0.30,
  },
  nhis_self: {
    clinic: 0.30,
    hospital: 0.40,
    tertiary: 0.60,
    emergency: 0.20,
    dental: 0.50,
    pharmacy: 0.30,
  },
  nhis_dependent: {
    clinic: 0.30,
    hospital: 0.40,
    tertiary: 0.60,
    emergency: 0.20,
    dental: 0.50,
    pharmacy: 0.30,
  },
  uninsured: {
    clinic: 1.0,
    hospital: 1.0,
    tertiary: 1.0,
    emergency: 1.0,
    dental: 1.0,
    pharmacy: 1.0,
  },
  private: {
    clinic: 0.10,
    hospital: 0.20,
    tertiary: 0.30,
    emergency: 0.10,
    dental: 0.30,
    pharmacy: 0.20,
  },
};

router.post("/insurance/calculate", (req, res) => {
  const { insuranceType, visitType, totalCost } = req.body;

  if (!insuranceType || !visitType || totalCost === undefined) {
    res.status(400).json({ error: "insuranceType, visitType, and totalCost are required" });
    return;
  }

  const rates = COPAY_RATES[insuranceType];
  if (!rates) {
    res.status(400).json({ error: "Invalid insuranceType" });
    return;
  }

  const copayRate = rates[visitType] ?? 0.30;
  const patientCopay = Math.round(totalCost * copayRate);
  const nhisCoverage = Math.round(totalCost - patientCopay);

  const notes: string[] = [];
  if (insuranceType === "uninsured") {
    notes.push("Without NHIS coverage, you pay the full amount. Consider enrolling in NHIS.");
  }
  if (visitType === "tertiary") {
    notes.push("Tertiary hospitals (상급종합병원) require a referral letter for the NHIS copay rate.");
  }
  if (visitType === "emergency") {
    notes.push("Emergency room visits have a different copay structure.");
  }

  res.json({
    totalCost,
    nhisCoverage,
    patientCopay,
    copayPercentage: Math.round(copayRate * 100),
    breakdown: [
      { category: "NHIS Coverage", amount: nhisCoverage, covered: true },
      { category: "Patient Copay", amount: patientCopay, covered: false },
    ],
    notes,
  });
});

router.get("/insurance/guide", (_req, res) => {
  res.json({
    sections: [
      {
        title: "What is NHIS?",
        content: "The National Health Insurance Service (NHIS / 국민건강보험) is Korea's universal health insurance system. Most legal residents, including foreigners with an Alien Registration Card (ARC), are required to enroll.",
        icon: "shield",
      },
      {
        title: "Enrollment as a Foreigner",
        content: "Foreigners staying in Korea for 6+ months must enroll in NHIS. You can enroll at your local NHIS branch or online. You'll need your ARC, passport, and employment contract (for employed workers).",
        icon: "user",
      },
      {
        title: "How Copayments Work",
        content: "NHIS covers 60-80% of medical costs. You pay a copay (본인부담금) which varies by facility type: 30% at clinics (의원), 40% at hospitals (병원), 60% at tertiary hospitals (상급종합병원). Pharmacy: 30%.",
        icon: "credit-card",
      },
      {
        title: "Healthcare Facilities",
        content: "Korea has 3 tiers: Clinics (의원/의원급), Hospitals (병원), and Tertiary/University Hospitals (상급종합병원). Start at clinics for minor issues. You need a referral to see specialists at tertiary hospitals.",
        icon: "hospital",
      },
      {
        title: "Using Insurance at the Pharmacy",
        content: "After a hospital visit, take your prescription to any pharmacy. Show your ARC and health insurance card. The pharmacist will calculate your copay automatically.",
        icon: "pill",
      },
    ],
    insuranceTypes: [
      {
        type: "nhis_employed",
        name: "NHIS (Employed)",
        description: "For employees working at Korean companies. Premiums split between employer and employee.",
        eligibility: "Foreign employees with ARC working at Korean companies",
        copayRates: {
          clinic: "30%",
          hospital: "40%",
          tertiary: "60%",
          emergency: "20%",
          dental: "50%",
          pharmacy: "30%",
        },
      },
      {
        type: "nhis_self",
        name: "NHIS (Self-employed/Regional)",
        description: "For self-employed individuals, freelancers, and those not covered by employer insurance.",
        eligibility: "Self-employed, freelancers, or those staying 6+ months without employer coverage",
        copayRates: {
          clinic: "30%",
          hospital: "40%",
          tertiary: "60%",
          emergency: "20%",
          dental: "50%",
          pharmacy: "30%",
        },
      },
      {
        type: "nhis_dependent",
        name: "NHIS (Dependent)",
        description: "Coverage as a dependent of an insured person (spouse, children, parents).",
        eligibility: "Dependents of NHIS-enrolled workers",
        copayRates: {
          clinic: "30%",
          hospital: "40%",
          tertiary: "60%",
          emergency: "20%",
          dental: "50%",
          pharmacy: "30%",
        },
      },
      {
        type: "uninsured",
        name: "Uninsured",
        description: "No health insurance. Full cost must be paid out of pocket.",
        eligibility: "Anyone without NHIS or private insurance",
        copayRates: {
          clinic: "100%",
          hospital: "100%",
          tertiary: "100%",
          emergency: "100%",
          dental: "100%",
          pharmacy: "100%",
        },
      },
      {
        type: "private",
        name: "Private Insurance",
        description: "Supplemental private insurance that covers additional costs beyond NHIS.",
        eligibility: "Anyone who purchases private health insurance",
        copayRates: {
          clinic: "~10%",
          hospital: "~20%",
          tertiary: "~30%",
          emergency: "~10%",
          dental: "~30%",
          pharmacy: "~20%",
        },
      },
    ],
    faqs: [
      {
        question: "Do I need to enroll in NHIS as a foreigner?",
        answer: "If you have an ARC and are staying for 6+ months, enrollment is mandatory. Short-term visa holders may be exempt.",
      },
      {
        question: "How do I get a health insurance card?",
        answer: "After enrolling in NHIS, you can download a digital card via the NHIS app or request a physical card at an NHIS branch.",
      },
      {
        question: "What if I forget my insurance card?",
        answer: "You can still receive treatment. Give your ARC number or resident registration number and the system will verify your insurance.",
      },
      {
        question: "Are dental and vision covered?",
        answer: "Basic dental is partially covered (50% copay). Vision correction (glasses, contacts) is generally not covered, though eye exams are.",
      },
      {
        question: "Can I use NHIS for mental health?",
        answer: "Yes. Psychiatric consultations and treatments are covered under NHIS with the standard copay rates.",
      },
    ],
  });
});

export default router;
