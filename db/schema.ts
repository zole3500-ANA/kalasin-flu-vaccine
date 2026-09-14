import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hospitalId: text("hospital_id").notNull(),
  year: integer("year").notNull(),
  allocated: integer("allocated").notNull().default(0),
  countsJson: text("counts_json").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
}, (table) => [uniqueIndex("idx_reports_hospital_year").on(table.hospitalId, table.year)]);

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  hospitalId: text("hospital_id").notNull(),
  year: integer("year").notNull(),
  objectKey: text("object_key").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
}, (table) => [index("idx_attachments_hospital_year").on(table.hospitalId, table.year)]);

export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hospitalId: text("hospital_id").notNull(),
  year: integer("year").notNull(),
  targetTotal: integer("target_total").notNull().default(0),
  requestedDoses: integer("requested_doses").notNull().default(0),
  countsJson: text("counts_json").notNull(),
  coordinatorName: text("coordinator_name").notNull().default(""),
  coordinatorPhone: text("coordinator_phone").notNull().default(""),
  coordinatorPosition: text("coordinator_position").notNull().default(""),
  notes: text("notes").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
}, (table) => [uniqueIndex("idx_surveys_hospital_year").on(table.hospitalId, table.year)]);

