import { pgTable, text, serial, date, timestamp } from "drizzle-orm/pg-core";

export const interpreterBookingsTable = pgTable("interpreter_bookings", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  language: text("language").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time"),
  appointmentType: text("appointment_type"),
  hospital: text("hospital"),
  notes: text("notes"),
  status: text("status").default("pending"),
  interpreterName: text("interpreter_name"),
  interpreterPhone: text("interpreter_phone"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InterpreterBooking = typeof interpreterBookingsTable.$inferSelect;
