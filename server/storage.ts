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
  
  // Meeting operations
  getMeeting(id: string): Promise<Meeting | undefined>;
  getAllMeetings(): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: UpdateMeeting): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<boolean>;
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
    const sampleMeetings: Meeting[] = [
      {
        id: "meeting-1",
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
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Meeting operations
  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    const meetings = Array.from(this.meetings.values());
    // Sort by date, most recent first
    return meetings.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const now = new Date();
    const meeting: Meeting = {
      id,
      buildingName: insertMeeting.buildingName,
      attendeesCount: insertMeeting.attendeesCount ?? 0,
      date: insertMeeting.date ?? now,
      duration: insertMeeting.duration ?? 0,
      status: insertMeeting.status ?? "recording",
      audioUrl: insertMeeting.audioUrl ?? null,
      transcript: (insertMeeting.transcript as TranscriptParagraph[] | null) ?? null,
      actaContent: insertMeeting.actaContent ?? null,
      recipients: (insertMeeting.recipients as EmailRecipient[] | null) ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: string, updateData: UpdateMeeting): Promise<Meeting | undefined> {
    const existing = this.meetings.get(id);
    if (!existing) return undefined;

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
      actaContent: updateData.actaContent ?? existing.actaContent,
      recipients: updateData.recipients !== undefined 
        ? (updateData.recipients as EmailRecipient[] | null) 
        : existing.recipients,
      updatedAt: new Date(),
    };
    this.meetings.set(id, updated);
    return updated;
  }

  async deleteMeeting(id: string): Promise<boolean> {
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
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Meeting operations
  async getMeeting(id: string): Promise<Meeting | undefined> {
    const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    return result[0];
  }

  async getAllMeetings(): Promise<Meeting[]> {
    const result = await db.select().from(meetings).orderBy(desc(meetings.date));
    return result;
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values(insertMeeting).returning();
    return result[0];
  }

  async updateMeeting(id: string, updateData: UpdateMeeting): Promise<Meeting | undefined> {
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

  async deleteMeeting(id: string): Promise<boolean> {
    const result = await db.delete(meetings).where(eq(meetings.id, id)).returning();
    return result.length > 0;
  }
}

// Use database storage in production, memory storage in development
export const storage = process.env.NODE_ENV === "production" || process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
