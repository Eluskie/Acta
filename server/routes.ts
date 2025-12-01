import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import puppeteer from "puppeteer";
import { insertMeetingSchema, updateMeetingSchema, meetingStatusSchema, emailRecipientSchema } from "@shared/schema";
import { z } from "zod";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for audio file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Supported audio formats for Whisper
const SUPPORTED_AUDIO_FORMATS = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/m4a",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
];

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname) || ".webm"}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept webm and other audio formats
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error(`Formato de audio no soportado: ${file.mimetype}`));
    }
  },
});

// Helper to safely clean up a file
function cleanupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error("Error cleaning up file:", e);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all meetings
  app.get("/api/meetings", async (req: Request, res: Response) => {
    try {
      const meetings = await storage.getAllMeetings();
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  // Get single meeting
  app.get("/api/meetings/:id", async (req: Request, res: Response) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ error: "Failed to fetch meeting" });
    }
  });

  // Create new meeting
  app.post("/api/meetings", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(validatedData);
      res.status(201).json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid meeting data", details: error.errors });
      }
      console.error("Error creating meeting:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  // Update meeting
  app.patch("/api/meetings/:id", async (req: Request, res: Response) => {
    try {
      const validatedData = updateMeetingSchema.parse(req.body);
      const meeting = await storage.updateMeeting(req.params.id, validatedData);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid meeting data", details: error.errors });
      }
      console.error("Error updating meeting:", error);
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  // Delete meeting
  app.delete("/api/meetings/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteMeeting(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // Upload audio and transcribe
  app.post("/api/meetings/:id/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
    const meetingId = req.params.id;
    let audioFilePath: string | null = null;

    try {
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        if (req.file) cleanupFile(req.file.path);
        return res.status(404).json({ error: "Reunión no encontrada" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No se ha proporcionado archivo de audio" });
      }

      audioFilePath = req.file.path;

      // Verify file exists and has content
      if (!fs.existsSync(audioFilePath)) {
        return res.status(400).json({ error: "Error al guardar el archivo de audio" });
      }

      const stats = fs.statSync(audioFilePath);
      if (stats.size === 0) {
        cleanupFile(audioFilePath);
        return res.status(400).json({ error: "El archivo de audio está vacío" });
      }

      // Update meeting status to processing immediately
      await storage.updateMeeting(meetingId, { status: "processing" });

      // Transcribe with OpenAI Whisper
      console.log(`Transcribing audio file: ${audioFilePath} (${stats.size} bytes)`);

      const audioReadStream = fs.createReadStream(audioFilePath);

      let transcription: any;
      try {
        transcription = await openai.audio.transcriptions.create({
          file: audioReadStream,
          model: "whisper-1",
          language: "es", // Spanish
          response_format: "verbose_json",
          timestamp_granularities: ["segment"],
        });
      } catch (openaiError: any) {
        console.error("OpenAI Whisper error:", openaiError);

        // Reset meeting status on error
        await storage.updateMeeting(meetingId, { status: "recording" });
        cleanupFile(audioFilePath);

        const errorMessage = openaiError?.message || "Error de transcripción";
        return res.status(500).json({
          error: "Error al transcribir el audio",
          details: errorMessage
        });
      }

      // Parse transcription into paragraphs with timestamps
      const segments = transcription.segments || [];
      const paragraphs = segments.map((segment: any, index: number) => {
        const minutes = Math.floor(segment.start / 60);
        const seconds = Math.floor(segment.start % 60);
        const timestamp = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        return {
          id: `p-${index + 1}`,
          timestamp,
          text: segment.text.trim(),
        };
      });

      // If no segments, create a single paragraph with the full text
      const finalParagraphs = paragraphs.length > 0 ? paragraphs : [
        {
          id: "p-1",
          timestamp: "00:00",
          text: transcription.text || "",
        }
      ];

      // Calculate duration from transcription or audio file
      const duration = transcription.duration ? Math.round(transcription.duration) : 0;

      // Convert file path to URL (e.g., uploads/audio-123.webm -> /uploads/audio-123.webm)
      const audioUrl = audioFilePath ? `/uploads/${path.basename(audioFilePath)}` : undefined;

      // Update meeting with transcript and audio URL
      const updatedMeeting = await storage.updateMeeting(meetingId, {
        transcript: finalParagraphs,
        audioUrl: audioUrl, // Store as URL for browser playback
        duration,
        status: "processing", // Keep in processing while generating acta
      });

      console.log(`Transcription complete for meeting ${meetingId}: ${finalParagraphs.length} paragraphs`);
      console.log(`[DEBUG] About to auto-generate acta for meeting ${meetingId}`);

      // Auto-generate acta after transcription
      try {
        console.log(`[DEBUG] Starting acta auto-generation for meeting ${meetingId}...`);

        // Format transcript for the AI
        const transcriptText = finalParagraphs
          .map((p: { timestamp: string; speaker?: string; text: string }) => `[${p.timestamp}] ${p.speaker ? `${p.speaker}: ` : ""}${p.text}`)
          .join("\n");

        console.log(`[DEBUG] Formatted transcript (${transcriptText.length} chars)`);

        const formattedDate = new Date(updatedMeeting!.date).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const prompt = `Eres un secretario profesional de comunidades de vecinos en España.
Genera un acta oficial de reunión basada en la siguiente transcripción.

INFORMACIÓN DE LA REUNIÓN:
- Comunidad: ${updatedMeeting!.buildingName}
- Fecha: ${formattedDate}
- Asistentes: ${updatedMeeting!.attendeesCount} personas

TRANSCRIPCIÓN:
${transcriptText}

Por favor, genera un acta formal en español con el siguiente formato:
1. Encabezado con lugar, fecha y hora
2. Lista de asistentes (si se mencionan)
3. Orden del día (puntos tratados)
4. Desarrollo de la sesión con los acuerdos alcanzados
5. Cierre con hora de finalización

El acta debe ser profesional, clara y respetar el formato oficial español para actas de comunidades de propietarios.`;

        console.log(`[DEBUG] Calling OpenAI API for acta generation...`);
        const actaResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Eres un experto en redacción de actas oficiales de comunidades de vecinos en España." },
            { role: "user", content: prompt }
          ],
          max_completion_tokens: 4096,
        });

        const actaContent = actaResponse.choices[0].message.content || "";
        console.log(`[DEBUG] Acta generated (${actaContent.length} chars)`);

        // Update meeting with acta content and set status to review
        const finalMeeting = await storage.updateMeeting(meetingId, {
          actaContent,
          status: "review",
        });

        console.log(`[SUCCESS] Acta auto-generated for meeting ${meetingId}`);
        res.json(finalMeeting);
      } catch (actaError) {
        console.error("[ERROR] Error auto-generating acta:", actaError);
        // If acta generation fails, still return the meeting with transcript
        // but keep it in review status without acta
        const fallbackMeeting = await storage.updateMeeting(meetingId, {
          status: "review",
        });
        res.json(fallbackMeeting);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);

      // Reset meeting status on error
      try {
        await storage.updateMeeting(meetingId, { status: "recording" });
      } catch (e) {
        console.error("Error resetting meeting status:", e);
      }

      // Clean up audio file
      if (audioFilePath) {
        cleanupFile(audioFilePath);
      }

      res.status(500).json({
        error: "Error al transcribir el audio",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Generate acta content from transcript using AI
  app.post("/api/meetings/:id/generate-acta", async (req: Request, res: Response) => {
    const meetingId = req.params.id;

    try {
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Reunión no encontrada" });
      }

      if (!meeting.transcript || meeting.transcript.length === 0) {
        return res.status(400).json({ error: "No hay transcripción disponible" });
      }

      // Format transcript for the AI
      const transcriptText = meeting.transcript
        .map(p => `[${p.timestamp}] ${p.speaker ? `${p.speaker}: ` : ""}${p.text}`)
        .join("\n");

      const formattedDate = new Date(meeting.date).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const prompt = `Eres un secretario profesional de comunidades de vecinos en España. 
Genera un acta oficial de reunión basada en la siguiente transcripción.

INFORMACIÓN DE LA REUNIÓN:
- Comunidad: ${meeting.buildingName}
- Fecha: ${formattedDate}
- Asistentes: ${meeting.attendeesCount} personas

TRANSCRIPCIÓN:
${transcriptText}

Por favor, genera un acta formal en español con el siguiente formato:
1. Encabezado con lugar, fecha y hora
2. Lista de asistentes (si se mencionan)
3. Orden del día (puntos tratados)
4. Desarrollo de la sesión con los acuerdos alcanzados
5. Cierre con hora de finalización

El acta debe ser profesional, clara y respetar el formato oficial español para actas de comunidades de propietarios.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "Eres un experto en redacción de actas oficiales de comunidades de vecinos en España." },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 4096,
      });

      const actaContent = response.choices[0].message.content || "";

      // Update meeting with acta content
      const updatedMeeting = await storage.updateMeeting(meetingId, {
        actaContent,
      });

      res.json(updatedMeeting);
    } catch (error) {
      console.error("Error generating acta:", error);
      res.status(500).json({
        error: "Error al generar el acta",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Send acta via email
  app.post("/api/meetings/:id/send", async (req: Request, res: Response) => {
    const meetingId = req.params.id;

    try {
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Reunión no encontrada" });
      }

      // Validate recipients
      const recipientsSchema = z.array(emailRecipientSchema).min(1, "Debe incluir al menos un destinatario");
      const parseResult = recipientsSchema.safeParse(req.body.recipients);

      if (!parseResult.success) {
        return res.status(400).json({
          error: "Destinatarios inválidos",
          details: parseResult.error.errors
        });
      }

      const recipients = parseResult.data;
      const subject = req.body.subject || `Acta - ${meeting.buildingName}`;
      const message = req.body.message || "Adjunto encontrará el acta de la reunión.";

      // Update the meeting with recipients and mark as sent
      const updatedMeeting = await storage.updateMeeting(meetingId, {
        recipients,
        status: "sent",
      });

      // Log what would be sent (for demo purposes)
      // In production, integrate with an email service like SendGrid, Resend, etc.
      console.log("=== EMAIL SENT (DEMO) ===");
      console.log("To:", recipients.map((r) => `${r.name} <${r.email}>`).join(", "));
      console.log("Subject:", subject);
      console.log("Message:", message);
      console.log("Acta Content:", meeting.actaContent?.substring(0, 100) + "...");
      console.log("========================");

      res.json({
        success: true,
        message: "Acta enviada correctamente",
        meeting: updatedMeeting
      });
    } catch (error) {
      console.error("Error sending acta:", error);
      res.status(500).json({
        error: "Error al enviar el acta",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Download acta as PDF
  app.get("/api/meetings/:id/download-pdf", async (req: Request, res: Response) => {
    const meetingId = req.params.id;

    try {
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Reunión no encontrada" });
      }

      const meetingDate = meeting.date ? new Date(meeting.date) : new Date();
      const formattedDateLong = meetingDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const formattedTime = meetingDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Generate HTML document matching ReviewEditScreen
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acta - ${meeting.buildingName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Georgia, "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 60px 50px;
      margin: 0 auto;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
    }

    .acta-number {
      font-size: 8pt;
      color: #9ca3af;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 12px;
    }

    .divider {
      width: 180px;
      height: 2px;
      background-color: #1a1a1a;
      margin: 12px auto;
    }

    .meeting-info {
      margin: 40px 0;
      text-align: justify;
      line-height: 1.8;
    }

    .attendees-box {
      margin: 32px 0;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 24px;
    }

    .attendees-title {
      font-size: 8pt;
      font-weight: bold;
      letter-spacing: 1.5px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .attendees-text {
      font-size: 10pt;
      color: #374151;
    }

    .content {
      margin: 32px 0;
      text-align: justify;
      line-height: 1.8;
    }

    .content p {
      margin-bottom: 16px;
    }

    .content strong {
      font-weight: bold;
    }

    .content h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .signatures {
      margin-top: 120px;
      padding-top: 60px;
      border-top: 2px solid #d1d5db;
      display: flex;
      justify-content: space-around;
    }

    .signature-block {
      width: 40%;
      text-align: center;
    }

    .signature-line {
      border-bottom: 2px solid #9ca3af;
      height: 80px;
      margin-bottom: 12px;
    }

    .signature-label {
      font-size: 8pt;
      font-weight: bold;
      letter-spacing: 1.2px;
      color: #6b7280;
      text-transform: uppercase;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <p class="acta-number">
        ACTA OFICIAL NO. ${meeting.id || new Date().getFullYear() + '-' + Math.floor(Math.random() * 100)}
      </p>
      <h1 class="title">ACTA DE REUNIÓN</h1>
      <div class="divider"></div>
    </div>

    <!-- Meeting Info -->
    <div class="meeting-info">
      <p>
        En <strong>${meeting.buildingName}</strong>, a <strong>${formattedDateLong}</strong>, siendo las
        <strong>${formattedTime} horas</strong>, se reúne el comité de administración del Edificio ${meeting.buildingName}.
      </p>
    </div>

    <!-- Attendees -->
    ${meeting.attendeesCount ? `
    <div class="attendees-box">
      <p class="attendees-title">ASISTENTES</p>
      <p class="attendees-text">
        Total de asistentes: ${meeting.attendeesCount} personas.
      </p>
    </div>
    ` : ''}

    <!-- Content -->
    <div class="content">
      ${meeting.actaContent || '<p>Contenido del acta no disponible.</p>'}
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-label">FIRMA PRESIDENTE</p>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-label">FIRMA SECRETARIA</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      // Launch Puppeteer and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with A4 format
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });

      await browser.close();

      // Send PDF to client
      const fileName = `Acta_${meeting.buildingName.replace(/\s+/g, '_')}_${meeting.id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdf);

    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({
        error: "Error al generar el PDF",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  return httpServer;
}
