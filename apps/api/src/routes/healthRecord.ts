import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { healthRecordsTable, visitsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateRecord(userId: string) {
  let [record] = await db
    .select()
    .from(healthRecordsTable)
    .where(eq(healthRecordsTable.userId, userId));

  if (!record) {
    const [created] = await db
      .insert(healthRecordsTable)
      .values({
        userId,
        fullName: "",
        allergies: [],
        medications: [],
        conditions: [],
        vitals: {},
        emergencyContact: {},
      })
      .returning();
    record = created;
  }
  return record;
}

router.get("/health-record", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const record = await getOrCreateRecord(req.user.id);
    const bmi =
      record.height && record.weight
        ? parseFloat(
            (record.weight / (record.height / 100) ** 2).toFixed(1),
          )
        : undefined;
    res.json({ ...record, bmi });
  } catch (err) {
    req.log.error({ err }, "Get health record error");
    res.status(500).json({ error: "Failed to fetch health record" });
  }
});

router.put("/health-record", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const updateData = req.body;

  try {
    const existing = await getOrCreateRecord(req.user.id);

    const [updated] = await db
      .update(healthRecordsTable)
      .set({ ...updateData, userId: req.user.id, updatedAt: new Date() })
      .where(eq(healthRecordsTable.id, existing.id))
      .returning();

    const bmi =
      updated.height && updated.weight
        ? parseFloat(
            (updated.weight / (updated.height / 100) ** 2).toFixed(1),
          )
        : undefined;

    res.json({ ...updated, bmi });
  } catch (err) {
    req.log.error({ err }, "Update health record error");
    res.status(500).json({ error: "Failed to update health record" });
  }
});

router.get("/health-record/visits", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const record = await getOrCreateRecord(req.user.id);
    const visits = await db
      .select()
      .from(visitsTable)
      .where(eq(visitsTable.healthRecordId, record.id))
      .orderBy(desc(visitsTable.date));
    res.json(visits);
  } catch (err) {
    req.log.error({ err }, "Get visits error");
    res.status(500).json({ error: "Failed to fetch visits" });
  }
});

router.post("/health-record/visits", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { clinicName, department, date, diagnosis, doctor, notes, cost, insuranceCovered } = req.body;

  if (!clinicName || !department || !date) {
    res.status(400).json({ error: "clinicName, department, date are required" });
    return;
  }

  try {
    const record = await getOrCreateRecord(req.user.id);

    const [visit] = await db
      .insert(visitsTable)
      .values({
        healthRecordId: record.id,
        clinicName,
        department,
        date,
        diagnosis,
        doctor,
        notes,
        cost,
        insuranceCovered,
      })
      .returning();

    res.status(201).json(visit);
  } catch (err) {
    req.log.error({ err }, "Add visit error");
    res.status(500).json({ error: "Failed to add visit" });
  }
});

export default router;
