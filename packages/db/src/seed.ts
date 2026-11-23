import { db } from "./index";
import { clinicsTable } from "./schema/clinics";
import { communityPostsTable } from "./schema/communityPosts";
import { sql } from "drizzle-orm";

const CLINICS = [
  {
    name: "Seoul International Clinic",
    nameKorean: "서울국제클리닉",
    address: "123 Itaewon-ro, Yongsan-gu",
    district: "Yongsan",
    phone: "02-1234-5678",
    departments: ["Internal Medicine", "General Practice", "Pediatrics"],
    languages: ["English", "Chinese", "Japanese"],
    rating: 4.7,
    reviewCount: 324,
    hasNhis: true,
    openHours: "Mon-Fri 9am-6pm, Sat 9am-1pm",
    description: "Full-service international clinic with English-speaking doctors",
  },
  {
    name: "Gangnam Severance Hospital",
    nameKorean: "강남세브란스병원",
    address: "211 Eonju-ro, Gangnam-gu",
    district: "Gangnam",
    phone: "02-2019-3114",
    departments: ["Internal Medicine", "Cardiology", "Oncology", "Neurology", "Orthopedics", "Dermatology"],
    languages: ["English", "Chinese", "Russian"],
    rating: 4.8,
    reviewCount: 1520,
    hasNhis: true,
    openHours: "Mon-Fri 8am-5pm",
    description: "Leading university hospital with international patient center",
  },
  {
    name: "Global Care Clinic Hongdae",
    nameKorean: "글로벌케어 홍대",
    address: "56 Wausan-ro, Mapo-gu",
    district: "Mapo",
    phone: "02-3456-7890",
    departments: ["General Practice", "Dermatology", "Psychiatry"],
    languages: ["English", "French", "Spanish"],
    rating: 4.5,
    reviewCount: 210,
    hasNhis: true,
    openHours: "Mon-Sat 10am-7pm",
    description: "Foreigner-friendly clinic near Hongdae, multilingual staff",
  },
  {
    name: "Bundang Seoul National University Hospital",
    nameKorean: "분당서울대학교병원",
    address: "82 Gumi-ro, Bundang-gu, Seongnam",
    district: "Bundang",
    phone: "031-787-7114",
    departments: ["Cardiology", "Orthopedics", "OB-GYN", "Pediatrics", "Neurology", "ENT"],
    languages: ["English", "Chinese"],
    rating: 4.6,
    reviewCount: 890,
    hasNhis: true,
    openHours: "Mon-Fri 8am-5pm",
    description: "Top-ranked hospital with dedicated international patient services",
  },
  {
    name: "Itaewon Foreign Clinic",
    nameKorean: "이태원외국인클리닉",
    address: "18 Itaewon-daero, Yongsan-gu",
    district: "Yongsan",
    phone: "02-7890-1234",
    departments: ["General Practice", "Internal Medicine", "OB-GYN"],
    languages: ["English", "Arabic", "French"],
    rating: 4.4,
    reviewCount: 178,
    hasNhis: true,
    openHours: "Mon-Fri 9am-6pm",
    description: "Specialized clinic for expatriates in Itaewon area",
  },
  {
    name: "Samsung Medical Center",
    nameKorean: "삼성서울병원",
    address: "81 Irwon-ro, Gangnam-gu",
    district: "Gangnam",
    phone: "02-3410-2114",
    departments: ["Oncology", "Cardiology", "Transplant", "Neurosurgery", "Orthopedics", "Internal Medicine"],
    languages: ["English", "Chinese", "Japanese", "Arabic"],
    rating: 4.9,
    reviewCount: 2300,
    hasNhis: true,
    openHours: "Mon-Fri 8am-5pm",
    description: "World-class medical center, top hospital in Korea",
  },
  {
    name: "Ewha Womans University Medical Center",
    nameKorean: "이화여자대학교의료원",
    address: "1071 Anyangcheon-ro, Yangcheon-gu",
    district: "Yangcheon",
    phone: "02-2650-5114",
    departments: ["OB-GYN", "Pediatrics", "Internal Medicine", "Ophthalmology"],
    languages: ["English"],
    rating: 4.3,
    reviewCount: 445,
    hasNhis: true,
    openHours: "Mon-Fri 8:30am-5pm",
    description: "Excellent women's health and pediatrics services",
  },
  {
    name: "Yonsei Dental Hospital",
    nameKorean: "연세대학교 치과대학병원",
    address: "50-1 Yonsei-ro, Seodaemun-gu",
    district: "Seodaemun",
    phone: "02-2228-3000",
    departments: ["Dental", "Orthodontics", "Oral Surgery", "Pediatric Dentistry"],
    languages: ["English", "Chinese"],
    rating: 4.6,
    reviewCount: 620,
    hasNhis: true,
    openHours: "Mon-Fri 9am-5pm",
    description: "Leading dental hospital with international patient service",
  },
  {
    name: "Mapo Global Medical",
    nameKorean: "마포글로벌메디컬",
    address: "34 Mapo-daero, Mapo-gu",
    district: "Mapo",
    phone: "02-2345-6789",
    departments: ["Internal Medicine", "Dermatology", "Psychiatry", "ENT"],
    languages: ["English", "Vietnamese", "Tagalog"],
    rating: 4.2,
    reviewCount: 145,
    hasNhis: true,
    openHours: "Mon-Sat 9am-8pm",
    description: "Evening hours available, multilingual support for Southeast Asian residents",
  },
  {
    name: "Asan Medical Center",
    nameKorean: "서울아산병원",
    address: "88 Olympic-ro 43-gil, Songpa-gu",
    district: "Songpa",
    phone: "02-3010-3114",
    departments: ["Internal Medicine", "Cardiology", "Cancer", "Transplant", "Neurology", "Orthopedics"],
    languages: ["English", "Chinese", "Japanese", "Russian", "Arabic"],
    rating: 4.9,
    reviewCount: 3100,
    hasNhis: true,
    openHours: "Mon-Fri 8am-5pm",
    description: "One of Asia's best hospitals, comprehensive international patient center",
  },
];

const COMMUNITY_POSTS = [
  {
    title: "Best English-speaking hospitals in Seoul?",
    content:
      "Hi everyone! I just moved to Seoul from Canada and I am looking for hospitals where doctors speak good English. Any recommendations especially for general check-ups and internal medicine? Thanks!",
    category: "hospital_reviews",
    authorName: "Sarah M.",
    authorCountry: "Canada",
    likes: 24,
    tags: ["hospital", "english", "Seoul"],
  },
  {
    title: "My experience at Samsung Medical Center - positive review",
    content:
      "I recently had a complex cardiac procedure at Samsung Medical Center. The international patient center was incredibly helpful. They provided an English interpreter throughout my stay. Highly recommended for serious conditions.",
    category: "hospital_reviews",
    authorName: "James K.",
    authorCountry: "USA",
    likes: 45,
    tags: ["Samsung", "cardiac", "international center"],
  },
  {
    title: "Skin rash - which department should I go to?",
    content:
      "I developed a skin rash on my arms after starting a new medication. Should I go to a dermatologist (피부과) or internal medicine (내과) first? Anyone been through this?",
    category: "symptoms",
    authorName: "Mei L.",
    authorCountry: "China",
    likes: 18,
    tags: ["skin", "rash", "dermatology"],
  },
  {
    title: "NHIS enrollment tips for newcomers",
    content:
      "Just went through the NHIS enrollment process! Here are my tips: 1) Bring your ARC and passport, 2) Go to your local district office not the NHIS office, 3) Processing takes about 2 weeks, 4) You can use the NHIS app to check your coverage.",
    category: "post_care",
    authorName: "Ahmed R.",
    authorCountry: "UAE",
    likes: 67,
    tags: ["NHIS", "insurance", "tips", "newcomers"],
  },
  {
    title: "Post-appendectomy recovery tips in Korea",
    content:
      "Had my appendix removed at Severance Hospital last month. Recovery tips: follow the diet restrictions seriously (죽 porridge for first week), use the hospital pharmacy, and keep all your discharge papers. The nurses were amazing even with language barriers!",
    category: "post_care",
    authorName: "Elena V.",
    authorCountry: "Russia",
    likes: 32,
    tags: ["surgery", "recovery", "Severance", "appendix"],
  },
  {
    title: "Terrible experience with clinic near Hongdae",
    content:
      "Warning: avoid the small clinic near Hongdae station. They overcharged me and the doctor barely spent 3 minutes. Always check reviews before visiting small clinics!",
    category: "hospital_reviews",
    authorName: "Tom B.",
    authorCountry: "UK",
    likes: 28,
    tags: ["warning", "Hongdae", "small clinic"],
  },
  {
    title: "Stomach pain for 3 days - should I be worried?",
    content:
      "I have had a dull stomach pain for 3 days. No fever but some nausea. Should I go to internal medicine (내과) or gastroenterology (소화기내과)? Is this an emergency? I am worried.",
    category: "symptoms",
    authorName: "Priya N.",
    authorCountry: "India",
    likes: 15,
    tags: ["stomach", "pain", "gastro"],
  },
  {
    title: "Korean pharmacy tips - getting your prescription filled",
    content:
      "Tips for using Korean pharmacies (약국): 1) They are everywhere near hospitals/clinics, 2) Show your prescription paper (처방전), 3) Copay is usually 30% with NHIS, 4) Many have apps for prescription tracking, 5) Google Translate works for medication names!",
    category: "post_care",
    authorName: "Liu W.",
    authorCountry: "China",
    likes: 89,
    tags: ["pharmacy", "prescription", "tips"],
  },
];

export async function seedDatabase() {
  const [clinicCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clinicsTable);

  if ((clinicCount?.count ?? 0) === 0) {
    await db.insert(clinicsTable).values(CLINICS);
    console.log(`[seed] Inserted ${CLINICS.length} clinics`);
  } else {
    console.log(`[seed] Clinics already seeded (${clinicCount?.count} rows), skipping`);
  }

  const [postCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityPostsTable);

  if ((postCount?.count ?? 0) < COMMUNITY_POSTS.length) {
    const existing = await db.select({ title: communityPostsTable.title }).from(communityPostsTable);
    const existingTitles = new Set(existing.map((p) => p.title));
    const toInsert = COMMUNITY_POSTS.filter((p) => !existingTitles.has(p.title));
    if (toInsert.length > 0) {
      await db.insert(communityPostsTable).values(toInsert);
      console.log(`[seed] Inserted ${toInsert.length} missing community posts`);
    } else {
      console.log(`[seed] Community posts already seeded (${postCount?.count} rows), skipping`);
    }
  } else {
    console.log(`[seed] Community posts already seeded (${postCount?.count} rows), skipping`);
  }
}
