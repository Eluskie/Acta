import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Meeting status enum with zod schema
export const meetingStatuses = ["recording", "processing", "review", "sent"] as const;
export const meetingStatusSchema = z.enum(meetingStatuses);
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;

// Transcript paragraph structure
export const transcriptParagraphSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  speaker: z.string().optional(),
  text: z.string(),
});

export type TranscriptParagraph = z.infer<typeof transcriptParagraphSchema>;

// Email recipient structure
export const emailRecipientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type EmailRecipient = z.infer<typeof emailRecipientSchema>;

// Meetings table
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buildingName: text("building_name").notNull(),
  attendeesCount: integer("attendees_count").notNull().default(0),
  date: timestamp("date").notNull().defaultNow(),
  duration: integer("duration").default(0), // in seconds
  status: text("status").notNull().default("recording"),
  audioUrl: text("audio_url"),
  transcript: jsonb("transcript").$type<TranscriptParagraph[]>(),
  actaContent: text("acta_content"),
  recipients: jsonb("recipients").$type<EmailRecipient[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: meetingStatusSchema.optional().default("recording"),
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// Schema for updating meeting with status validation
export const updateMeetingSchema = z.object({
  buildingName: z.string().optional(),
  attendeesCount: z.number().optional(),
  date: z.date().optional(),
  duration: z.number().optional(),
  status: meetingStatusSchema.optional(),
  audioUrl: z.string().optional(),
  transcript: z.array(transcriptParagraphSchema).optional().nullable(),
  actaContent: z.string().optional().nullable(),
  recipients: z.array(emailRecipientSchema).optional().nullable(),
});
export type UpdateMeeting = z.infer<typeof updateMeetingSchema>;

// Schema for transcription request
export const transcriptionRequestSchema = z.object({
  meetingId: z.string(),
});

// Schema for email send request
export const sendActaRequestSchema = z.object({
  meetingId: z.string(),
  recipients: z.array(emailRecipientSchema),
  subject: z.string().optional(),
  message: z.string().optional(),
});
