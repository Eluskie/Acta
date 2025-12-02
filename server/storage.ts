import {
  type User,
  type InsertUser,
  type Meeting,
  type InsertMeeting,
  type UpdateMeeting,
  type TranscriptParagraph,
  type EmailRecipient,
  users,
  meetings,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Meeting operations (now filtered by userId)
  getMeeting(id: string, userId?: string): Promise<Meeting | undefined>;
  getAllMeetings(userId?: string): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: UpdateMeeting, userId?: string): Promise<Meeting | undefined>;
  deleteMeeting(id: string, userId?: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private meetings: Map<string, Meeting>;

  constructor() {
    this.users = new Map();
    this.meetings = new Map();
    
    // Add some sample meetings for demo
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Demo user ID - in production this would be from Clerk
    const demoUserId = "demo-user";
    
    // Create demo user
    this.users.set(demoUserId, {
      id: demoUserId,
      email: "demo@example.com",
      firstName: "María",
      lastName: "García",
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const sampleMeetings: Meeting[] = [
      {
        id: "meeting-1",
        userId: demoUserId,
        buildingName: "Comunidad Edificio Alameda 42",
        attendeesCount: 12,
        date: new Date("2025-11-28T10:00:00"),
        duration: 3600,
        status: "sent",
        audioUrl: null,
        transcript: [
          { id: "1", timestamp: "00:00", speaker: "Presidente", text: "Buenos días a todos. Damos comienzo a la junta ordinaria de la comunidad." },
          { id: "2", timestamp: "00:15", speaker: "Secretario", text: "Gracias, presidente. Procedemos a pasar lista de asistentes." },
        ],
        actaContent: "ACTA DE LA JUNTA ORDINARIA\n\nEn Madrid, a 28 de noviembre de 2025...",
        recipients: [
          { id: "r1", name: "Juan García", email: "juan@example.com" },
          { id: "r2", name: "María López", email: "maria@example.com" },
        ],
        createdAt: new Date("2025-11-28T10:00:00"),
        updatedAt: new Date("2025-11-28T12:00:00"),
      },
      {
        id: "meeting-2",
        userId: demoUserId,
        buildingName: "Residencial Las Flores",
        attendeesCount: 8,
        date: new Date("2025-11-25T18:00:00"),
        duration: 2700,
        status: "review",
        audioUrl: null,
        transcript: [
          { id: "1", timestamp: "00:00", speaker: "Presidente", text: "Buenas tardes. Comenzamos la reunión extraordinaria." },
        ],
        actaContent: null,
        recipients: null,
        createdAt: new Date("2025-11-25T18:00:00"),
        updatedAt: new Date("2025-11-25T19:00:00"),
      },
      {
        id: "meeting-3",
        userId: demoUserId,
        buildingName: "Torre Mediterráneo",
        attendeesCount: 15,
        date: new Date("2025-11-20T11:00:00"),
        duration: 4200,
        status: "sent",
        audioUrl: null,
        transcript: null,
        actaContent: "ACTA DE LA JUNTA EXTRAORDINARIA\n\nEn Valencia, a 20 de noviembre de 2025...",
        recipients: [
          { id: "r1", name: "Pedro Sánchez", email: "pedro@example.com" },
        ],
        createdAt: new Date("2025-11-20T11:00:00"),
        updatedAt: new Date("2025-11-20T13:00:00"),
      },
    ];

    sampleMeetings.forEach(meeting => {
      this.meetings.set(meeting.id, meeting);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const user: User = { 
      id: insertUser.id,
      email: insertUser.email,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      imageUrl: insertUser.imageUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(insertUser.id, user);
    return user;
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    const existing = this.users.get(insertUser.id);
    const now = new Date();
    const user: User = {
      id: insertUser.id,
      email: insertUser.email,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      imageUrl: insertUser.imageUrl ?? null,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.users.set(insertUser.id, user);
    return user;
  }

  // Meeting operations - filtered by userId
  async getMeeting(id: string, userId?: string): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (meeting && userId && meeting.userId !== userId) {
      return undefined; // Don't expose other users' meetings
    }
    return meeting;
  }

  async getAllMeetings(userId?: string): Promise<Meeting[]> {
    let meetings = Array.from(this.meetings.values());
    
    // Filter by userId if provided
    if (userId) {
      meetings = meetings.filter(m => m.userId === userId);
    }
    
    // Sort by date, most recent first
    return meetings.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const now = new Date();
    
    // Ensure transcript is properly typed
    let transcript: TranscriptParagraph[] | null = null;
    if (insertMeeting.transcript) {
      transcript = Array.isArray(insertMeeting.transcript) 
        ? insertMeeting.transcript as TranscriptParagraph[]
        : null;
    }
    
    // Ensure recipients is properly typed
    let recipients: EmailRecipient[] | null = null;
    if (insertMeeting.recipients) {
      recipients = Array.isArray(insertMeeting.recipients)
        ? insertMeeting.recipients as EmailRecipient[]
        : null;
    }
    
    const meeting: Meeting = {
      id,
      userId: insertMeeting.userId,
      buildingName: insertMeeting.buildingName,
      attendeesCount: insertMeeting.attendeesCount ?? 0,
      date: insertMeeting.date ?? now,
      duration: insertMeeting.duration ?? 0,
      status: insertMeeting.status ?? "recording",
      audioUrl: insertMeeting.audioUrl ?? null,
      transcript,
      actaContent: insertMeeting.actaContent ?? null,
      recipients,
      createdAt: now,
      updatedAt: now,
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: string, updateData: UpdateMeeting, userId?: string): Promise<Meeting | undefined> {
    const existing = this.meetings.get(id);
    if (!existing) return undefined;
    
    // Verify ownership if userId provided
    if (userId && existing.userId !== userId) {
      return undefined;
    }

    const updated: Meeting = {
      ...existing,
      buildingName: updateData.buildingName ?? existing.buildingName,
      attendeesCount: updateData.attendeesCount ?? existing.attendeesCount,
      date: updateData.date ?? existing.date,
      duration: updateData.duration ?? existing.duration,
      status: updateData.status ?? existing.status,
      audioUrl: updateData.audioUrl ?? existing.audioUrl,
      transcript: updateData.transcript !== undefined
        ? (updateData.transcript as TranscriptParagraph[] | null)
        : existing.transcript,
      actaContent: updateData.actaContent !== undefined ? updateData.actaContent : existing.actaContent,
      recipients: updateData.recipients !== undefined
        ? (updateData.recipients as EmailRecipient[] | null)
        : existing.recipients,
      // Signature fields
      signatureStatus: updateData.signatureStatus ?? existing.signatureStatus,
      presidentName: updateData.presidentName ?? existing.presidentName,
      secretaryName: updateData.secretaryName ?? existing.secretaryName,
      presidentSignature: updateData.presidentSignature ?? existing.presidentSignature,
      secretarySignature: updateData.secretarySignature ?? existing.secretarySignature,
      signedAt: updateData.signedAt ?? existing.signedAt,
      // Legacy DocuSeal fields
      docusealDocumentId: updateData.docusealDocumentId ?? existing.docusealDocumentId,
      presidentEmail: updateData.presidentEmail ?? existing.presidentEmail,
      secretaryEmail: updateData.secretaryEmail ?? existing.secretaryEmail,
      signatureRemindersSent: updateData.signatureRemindersSent ?? existing.signatureRemindersSent,
      updatedAt: new Date(),
    };
    this.meetings.set(id, updated);
    return updated;
  }

  async deleteMeeting(id: string, userId?: string): Promise<boolean> {
    const existing = this.meetings.get(id);
    if (!existing) return false;
    
    // Verify ownership if userId provided
    if (userId && existing.userId !== userId) {
      return false;
    }
    
    return this.meetings.delete(id);
  }
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Upsert user - create if doesn't exist, update if does (for Clerk sync)
  async upsertUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: insertUser.email,
          firstName: insertUser.firstName,
          lastName: insertUser.lastName,
          imageUrl: insertUser.imageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Meeting operations - filtered by userId for multi-tenant isolation
  async getMeeting(id: string, userId?: string): Promise<Meeting | undefined> {
    if (userId) {
      const result = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      // Verify the meeting belongs to this user
      const meeting = result[0];
      if (meeting && meeting.userId !== userId) {
        return undefined; // Don't expose other users' meetings
      }
      return meeting;
    }
    const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    return result[0];
  }

  async getAllMeetings(userId?: string): Promise<Meeting[]> {
    if (userId) {
      const result = await db
        .select()
        .from(meetings)
        .where(eq(meetings.userId, userId))
        .orderBy(desc(meetings.date));
      return result;
    }
    const result = await db.select().from(meetings).orderBy(desc(meetings.date));
    return result;
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    // Ensure transcript and recipients are properly typed for database
    const values = {
      ...insertMeeting,
      transcript: insertMeeting.transcript 
        ? (Array.isArray(insertMeeting.transcript) ? insertMeeting.transcript : null)
        : null,
      recipients: insertMeeting.recipients
        ? (Array.isArray(insertMeeting.recipients) ? insertMeeting.recipients : null)
        : null,
    };
    
    const result = await db.insert(meetings).values(values).returning();
    return result[0];
  }

  async updateMeeting(id: string, updateData: UpdateMeeting, userId?: string): Promise<Meeting | undefined> {
    // First verify ownership if userId provided
    if (userId) {
      const existing = await this.getMeeting(id, userId);
      if (!existing) return undefined;
    }
    
    const result = await db
      .update(meetings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, id))
      .returning();
    return result[0];
  }

  async deleteMeeting(id: string, userId?: string): Promise<boolean> {
    // First verify ownership if userId provided
    if (userId) {
      const existing = await this.getMeeting(id, userId);
      if (!existing) return false;
    }
    
    const result = await db.delete(meetings).where(eq(meetings.id, id)).returning();
    return result.length > 0;
  }
}

// Use database storage in production, memory storage in development
export const storage = process.env.NODE_ENV === "production" || process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
