import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - synced with Clerk
// We store minimal user data, Clerk handles auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Clerk user ID (e.g., "user_2abc123...")
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
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

// Signature status enum
export const signatureStatuses = ["pending", "signed", "sent_unsigned"] as const;
export const signatureStatusSchema = z.enum(signatureStatuses);
export type SignatureStatus = z.infer<typeof signatureStatusSchema>;

// Meetings table
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Clerk user ID
  buildingName: text("building_name").notNull(),
  attendeesCount: integer("attendees_count").notNull().default(0),
  date: timestamp("date").notNull().defaultNow(),
  duration: integer("duration").default(0), // in seconds
  status: text("status").notNull().default("recording"),
  audioUrl: text("audio_url"),
  transcript: jsonb("transcript").$type<TranscriptParagraph[]>(),
  actaContent: text("acta_content"),
  recipients: jsonb("recipients").$type<EmailRecipient[]>(),
  // Signature fields
  signatureStatus: text("signature_status"), // 'pending', 'signed', or 'sent_unsigned'
  presidentName: text("president_name"),
  secretaryName: text("secretary_name"),
  presidentSignature: text("president_signature"), // Base64 signature image
  secretarySignature: text("secretary_signature"), // Base64 signature image
  signedAt: timestamp("signed_at"),
  // Legacy DocuSeal fields (kept for backward compatibility)
  docusealDocumentId: text("docuseal_document_id"),
  presidentEmail: text("president_email"),
  secretaryEmail: text("secretary_email"),
  signatureRemindersSent: jsonb("signature_reminders_sent").$type<string[]>(), // Array of ISO date strings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: meetingStatusSchema.optional().default("recording"),
  userId: z.string(), // Required - Clerk user ID
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
  signatureStatus: signatureStatusSchema.optional().nullable(),
  presidentName: z.string().optional().nullable(),
  secretaryName: z.string().optional().nullable(),
  presidentSignature: z.string().optional().nullable(),
  secretarySignature: z.string().optional().nullable(),
  signedAt: z.coerce.date().optional().nullable(),
  // Legacy DocuSeal fields
  docusealDocumentId: z.string().optional().nullable(),
  presidentEmail: z.string().email().optional().nullable(),
  secretaryEmail: z.string().email().optional().nullable(),
  signatureRemindersSent: z.array(z.string()).optional().nullable(),
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
