import { pgTable, text, serial, integer, varchar, real, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthRecordsTable = pgTable("health_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  nationality: text("nationality"),
  bloodType: text("blood_type"),
  height: real("height"),
  weight: real("weight"),
  nhisNumber: text("nhis_number"),
  insuranceType: text("insurance_type"),
  allergies: jsonb("allergies").default([]),
  medications: jsonb("medications").default([]),
  conditions: jsonb("conditions").default([]),
  vitals: jsonb("vitals").default({}),
  emergencyContact: jsonb("emergency_contact").default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  healthRecordId: integer("health_record_id").notNull().references(() => healthRecordsTable.id),
  clinicName: text("clinic_name").notNull(),
  department: text("department").notNull(),
  date: date("date").notNull(),
  diagnosis: text("diagnosis"),
  doctor: text("doctor"),
  notes: text("notes"),
  cost: real("cost"),
  insuranceCovered: real("insurance_covered"),
});

export const insertHealthRecordSchema = createInsertSchema(healthRecordsTable).omit({ id: true, updatedAt: true });
export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true });

export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;
export type HealthRecord = typeof healthRecordsTable.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
