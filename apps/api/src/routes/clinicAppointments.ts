import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clinicAppointmentsTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/clinic-appointments", async (req, res) => {
  const { patientName, email, phone, clinicName, department, appointmentDate, appointmentTime, reason, urgency } = req.body;

  if (!patientName || !clinicName || !department || !appointmentDate) {
    res.status(400).json({ error: "patientName, clinicName, department, and appointmentDate are required" });
    return;
  }

  const userId = req.isAuthenticated() && req.user ? (req.user as any).id : null;

  try {
    const [appt] = await db.insert(clinicAppointmentsTable).values({
      userId,
      patientName, email, phone, clinicName, department, appointmentDate, appointmentTime, reason,
      urgency: urgency || "normal",
      status: "pending",
    }).returning();
    res.status(201).json(appt);
  } catch (err) {
    req.log.error({ err }, "Create clinic appointment error");
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

router.get("/clinic-appointments", async (req, res) => {
  try {
    const userId = req.isAuthenticated() && req.user ? (req.user as any).id : null;
    let appts: (typeof clinicAppointmentsTable.$inferSelect)[];
    if (userId) {
      appts = await db.select().from(clinicAppointmentsTable)
        .where(eq(clinicAppointmentsTable.userId, userId))
        .orderBy(desc(clinicAppointmentsTable.createdAt));
    } else {
      appts = [];
    }
    res.json(appts);
  } catch (err) {
    req.log.error({ err }, "Get clinic appointments error");
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Public endpoint: return booked time slots for a clinic+date combination
router.get("/clinic-appointments/booked-slots", async (req, res) => {
  const { clinic, date } = req.query as { clinic?: string; date?: string };
  if (!clinic || !date) {
    res.json({ bookedSlots: [] });
    return;
  }
  try {
    const appts = await db
      .select({ appointmentTime: clinicAppointmentsTable.appointmentTime })
      .from(clinicAppointmentsTable)
      .where(
        and(
          eq(clinicAppointmentsTable.clinicName, clinic),
          eq(clinicAppointmentsTable.appointmentDate, date),
        )
      );
    const bookedSlots = appts
      .map((a) => a.appointmentTime)
      .filter(Boolean);
    res.json({ bookedSlots });
  } catch (err) {
    req.log.error({ err }, "Get booked slots error");
    res.status(500).json({ error: "Failed to fetch booked slots" });
  }
});

export default router;
