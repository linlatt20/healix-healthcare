/**
 * Healix API 타입 정의.
 * 원래 Orval이 OpenAPI 스펙에서 생성하던 파일인데 내보낸 코드에 빠져 있어서,
 * apps/api 라우트와 packages/db 스키마를 기준으로 다시 작성했습니다.
 * (경로는 기존 import 경로와 맞추려고 generated/ 그대로 유지)
 */

/* ───────────── Clinics ───────────── */
export interface Clinic {
  id: number;
  name: string;
  nameKorean?: string | null;
  address: string;
  district: string;
  phone?: string | null;
  departments: string[];
  languages?: string[] | null;
  rating?: number | null;
  reviewCount?: number | null;
  hasNhis?: boolean | null;
  openHours?: string | null;
  description?: string | null;
}

export interface GetClinicsParams {
  query?: string;
  department?: string;
  district?: string;
  language?: string;
}

export interface ClinicRecommendRequest {
  symptoms: string;
  language?: string;
}

export interface RecommendedDepartment {
  department: string;
  departmentKorean?: string;
  reason?: string;
  confidence?: number;
}

export interface ClinicRecommendResponse {
  recommendedDepartments: RecommendedDepartment[];
  urgencyLevel: "routine" | "soon" | "urgent" | "emergency" | string;
  advice: string;
  suggestedClinics: Clinic[];
}

/* ───────────── Translation ───────────── */
export interface MedicalTerm {
  original: string;
  translation: string;
  explanation?: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  context?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  medicalTerms: MedicalTerm[];
}

/* ───────────── Chatbot ───────────── */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatbotRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  language?: string;
}

export interface ChatbotResponse {
  message: string;
  suggestedDepartments: string[];
  urgencyLevel: "low" | "medium" | "high" | "emergency" | string;
  followUpQuestions: string[];
}

/* ───────────── Insurance ───────────── */
export type InsuranceCalculationRequestInsuranceType =
  (typeof InsuranceCalculationRequestInsuranceType)[keyof typeof InsuranceCalculationRequestInsuranceType];
export const InsuranceCalculationRequestInsuranceType = {
  nhis_employed: "nhis_employed",
  nhis_self: "nhis_self",
  nhis_dependent: "nhis_dependent",
  uninsured: "uninsured",
  private: "private",
} as const;

export type InsuranceCalculationRequestVisitType =
  (typeof InsuranceCalculationRequestVisitType)[keyof typeof InsuranceCalculationRequestVisitType];
export const InsuranceCalculationRequestVisitType = {
  clinic: "clinic",
  hospital: "hospital",
  tertiary: "tertiary",
  emergency: "emergency",
  dental: "dental",
  pharmacy: "pharmacy",
} as const;

export interface InsuranceCalculationRequest {
  insuranceType: InsuranceCalculationRequestInsuranceType;
  visitType: InsuranceCalculationRequestVisitType;
  totalCost: number;
}

export interface InsuranceBreakdownItem {
  category: string;
  amount: number;
  covered: boolean;
}

export interface InsuranceCalculationResponse {
  totalCost: number;
  nhisCoverage: number;
  patientCopay: number;
  copayPercentage: number;
  breakdown: InsuranceBreakdownItem[];
  notes: string[];
}

export interface InsuranceGuideSection {
  title: string;
  content: string;
  icon?: string;
}

export interface InsuranceTypeInfo {
  type: string;
  name: string;
  description: string;
  eligibility?: string;
  copayRates?: Record<string, string>;
}

export interface InsuranceFaq {
  question: string;
  answer: string;
}

export interface InsuranceGuide {
  sections: InsuranceGuideSection[];
  insuranceTypes: InsuranceTypeInfo[];
  faqs: InsuranceFaq[];
}

/* ───────────── Community ───────────── */
export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorCountry?: string | null;
  likes: number;
  tags?: string[] | null;
  createdAt: string;
  commentCount: number;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  authorName: string;
  authorCountry?: string | null;
  likes: number;
  createdAt: string;
}

export interface PostDetail extends Omit<Post, "commentCount"> {
  comments: Comment[];
}

export interface PostsPage {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetCommunityPostsParams {
  category?: string;
  page?: number;
  limit?: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorCountry?: string;
  tags?: string[];
}

export interface CreateCommentRequest {
  content: string;
  authorName: string;
  authorCountry?: string;
}

/* ───────────── Health record ───────────── */
export interface Allergy {
  id?: number | string;
  allergen: string;
  severity?: string;
  reaction?: string;
  [key: string]: unknown;
}

export interface Medication {
  id?: number | string;
  name: string;
  dosage?: string;
  frequency?: string;
  [key: string]: unknown;
}

export interface Condition {
  id?: number | string;
  name?: string;
  condition?: string;
  status?: string;
  since?: string;
  [key: string]: unknown;
}

export interface Vitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  [key: string]: unknown;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
  [key: string]: unknown;
}

export interface HealthRecord {
  id: number;
  userId?: string | null;
  fullName: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  bloodType?: string | null;
  height?: number | null;
  weight?: number | null;
  nhisNumber?: string | null;
  insuranceType?: string | null;
  // jsonb 컬럼: 예전 데이터는 문자열 배열일 수도 있어서 넉넉하게 둠
  allergies: any[];
  medications: any[];
  conditions: any[];
  vitals: Vitals;
  emergencyContact: EmergencyContact;
  updatedAt: string;
  bmi?: number;
}

export type UpdateHealthRecordRequest = Partial<
  Omit<HealthRecord, "id" | "userId" | "updatedAt" | "bmi">
>;

export interface Visit {
  id: number;
  healthRecordId: number;
  clinicName: string;
  department: string;
  date: string;
  diagnosis?: string | null;
  doctor?: string | null;
  notes?: string | null;
  cost?: number | null;
  insuranceCovered?: number | null;
}

export interface AddVisitRequest {
  clinicName: string;
  department: string;
  date: string;
  diagnosis?: string;
  doctor?: string;
  notes?: string;
  cost?: number;
  insuranceCovered?: number;
}
