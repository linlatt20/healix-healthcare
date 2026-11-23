import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { interpreterBookingsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

/* Static list of available interpreters */
const INTERPRETERS = [
  {
    id: "interp-1",
    name: "Jame",
    language: "English",
    rating: 4.8,
    topik: 6,
    patientsAssisted: 32,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jame&backgroundColor=b6e3f4",
    bio: "Jame is a certified English-Korean medical interpreter with over 7 years of experience helping foreign patients navigate Korea's healthcare system. He specializes in internal medicine and surgery consultations.",
    availableTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "07:00 PM"],
  },
  {
    id: "interp-2",
    name: "Aye Aye",
    language: "Burmese",
    rating: 4.7,
    topik: 6,
    patientsAssisted: 15,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=AyeAye&backgroundColor=ffdfbf",
    bio: "Aye Aye is a certified Burmese-Korean medical interpreter with over 5 years of experience supporting Burmese patients in Korea. She specializes in OB-GYN and pediatrics consultations.",
    availableTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "07:00 PM", "08:00 PM"],
  },
  {
    id: "interp-3",
    name: "Wu Lin",
    language: "Chinese",
    rating: 4.6,
    topik: 6,
    patientsAssisted: 28,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=WuLin&backgroundColor=d1f4cc",
    bio: "Wu Lin is a fluent Chinese-Korean medical interpreter experienced in oncology and cardiology. He has helped hundreds of Chinese patients get accurate diagnoses and care in Korean hospitals.",
    availableTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "07:00 PM"],
  },
  {
    id: "interp-4",
    name: "Linh",
    language: "Vietnamese",
    rating: 4.5,
    topik: 6,
    patientsAssisted: 21,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Linh&backgroundColor=c0aede",
    bio: "Linh is a Vietnamese-Korean interpreter certified in medical terminology and cultural mediation. She is passionate about helping Vietnamese workers and families receive the best care possible.",
    availableTimes: ["09:00 AM", "10:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
  },
  {
    id: "interp-5",
    name: "Milli",
    language: "Thai",
    rating: 4.4,
    topik: 5,
    patientsAssisted: 18,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Milli&backgroundColor=ffd5dc",
    bio: "Milli is a Thai-Korean interpreter skilled in translating during complex procedures and consultations. She has assisted Thai patients at major hospitals including Severance and SNUH.",
    availableTimes: ["10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "07:00 PM"],
  },
  {
    id: "interp-6",
    name: "Baatar",
    language: "Mongolian",
    rating: 4.3,
    topik: 5,
    patientsAssisted: 12,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Baatar&backgroundColor=b6e3f4",
    bio: "Baatar is a Mongolian-Korean interpreter with experience in orthopedics and emergency medicine. He is dedicated to supporting Mongolia's growing expatriate community in Korea.",
    availableTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "07:00 PM"],
  },
  {
    id: "interp-7",
    name: "Amara",
    language: "Japanese",
    rating: 4.6,
    topik: 6,
    patientsAssisted: 24,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Amara&backgroundColor=ffd5dc",
    bio: "Amara is a Japanese-Korean interpreter with specialized knowledge in dermatology and cosmetic procedures. She has helped dozens of Japanese patients navigate Korea's world-class medical tourism sector.",
    availableTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "04:00 PM", "07:00 PM"],
  },
];

/* GET /api/interpreters - list all available interpreters */
router.get("/interpreters", (_req, res) => {
  res.json(INTERPRETERS);
});

/* GET /api/interpreters/:id - single interpreter detail */
router.get("/interpreters/:id", (req, res) => {
  const interp = INTERPRETERS.find(i => i.id === req.params.id);
  if (!interp) { res.status(404).json({ error: "Interpreter not found" }); return; }
  res.json(interp);
});

/* POST /api/interpreter/book */
router.post("/interpreter/book", async (req, res) => {
  const { name, email, phone, language, appointmentDate, appointmentTime, appointmentType, hospital, notes, interpreterName, interpreterPhone } = req.body;

  if (!name || !language || !appointmentDate) {
    res.status(400).json({ error: "name, language, and appointmentDate are required" });
    return;
  }

  const userId = req.isAuthenticated() && req.user ? (req.user as any).id : null;

  try {
    const [booking] = await db.insert(interpreterBookingsTable).values({
      userId,
      name, email, phone, language, appointmentDate, appointmentTime, appointmentType, hospital, notes,
      interpreterName, interpreterPhone,
      status: "pending",
    }).returning();
    res.status(201).json(booking);
  } catch (err) {
    req.log.error({ err }, "Book interpreter error");
    res.status(500).json({ error: "Failed to create booking" });
  }
});

/* GET /api/interpreter/bookings - only current user's bookings */
router.get("/interpreter/bookings", async (req, res) => {
  try {
    const userId = req.isAuthenticated() && req.user ? (req.user as any).id : null;
    let bookings: (typeof interpreterBookingsTable.$inferSelect)[];
    if (userId) {
      bookings = await db.select().from(interpreterBookingsTable)
        .where(eq(interpreterBookingsTable.userId, userId))
        .orderBy(desc(interpreterBookingsTable.createdAt));
    } else {
      bookings = [];
    }
    res.json(bookings);
  } catch (err) {
    req.log.error({ err }, "Get bookings error");
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

/* PATCH /api/interpreter/bookings/:id/cancel */
router.patch("/interpreter/bookings/:id/cancel", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [updated] = await db
      .update(interpreterBookingsTable)
      .set({ status: "cancelled" })
      .where(eq(interpreterBookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Cancel booking error");
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

/* PATCH /api/interpreter/bookings/:id */
router.patch("/interpreter/bookings/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { language, appointmentDate, appointmentTime, appointmentType, hospital, notes } = req.body;
  try {
    const [updated] = await db
      .update(interpreterBookingsTable)
      .set({ language, appointmentDate, appointmentTime, appointmentType, hospital, notes })
      .where(eq(interpreterBookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Edit booking error");
    res.status(500).json({ error: "Failed to update booking" });
  }
});

/* PATCH /api/interpreter/bookings/:id/confirm */
router.patch("/interpreter/bookings/:id/confirm", async (req, res) => {
  const id = Number(req.params.id);
  const SAMPLE_INTERPRETERS = [
    { interpreterName: "Kim Ji-young", interpreterPhone: "+82-10-1234-5678" },
    { interpreterName: "Park Soo-bin", interpreterPhone: "+82-10-9876-5432" },
    { interpreterName: "Choi Min-jun", interpreterPhone: "+82-10-5555-7777" },
    { interpreterName: "Lee Ha-eun", interpreterPhone: "+82-10-3344-2211" },
  ];
  const assigned = SAMPLE_INTERPRETERS[id % SAMPLE_INTERPRETERS.length];

  try {
    const [updated] = await db
      .update(interpreterBookingsTable)
      .set({ status: "confirmed", confirmedAt: new Date(), ...assigned })
      .where(eq(interpreterBookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Confirm booking error");
    res.status(500).json({ error: "Failed to confirm booking" });
  }
});

export default router;
