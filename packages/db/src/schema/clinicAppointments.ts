import { pgTable, text, serial, date, timestamp } from "drizzle-orm/pg-core";

export const clinicAppointmentsTable = pgTable("clinic_appointments", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  patientName: text("patient_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  clinicName: text("clinic_name").notNull(),
  department: text("department").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time"),
  reason: text("reason"),
  urgency: text("urgency").default("normal"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClinicAppointment = typeof clinicAppointmentsTable.$inferSelect;
