import { pgTable, text, serial, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clinicsTable = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameKorean: text("name_korean"),
  address: text("address").notNull(),
  district: text("district").notNull(),
  phone: text("phone"),
  departments: text("departments").array().notNull(),
  languages: text("languages").array(),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  hasNhis: boolean("has_nhis").default(true),
  openHours: text("open_hours"),
  description: text("description"),
});

export const insertClinicSchema = createInsertSchema(clinicsTable).omit({ id: true });
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinicsTable.$inferSelect;
