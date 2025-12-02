import type { Meeting } from "@shared/schema";

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL || "https://api.docuseal.co";

interface DocuSealSubmitter {
  email: string;
  name: string;
  role: string;
}

interface CreateSubmissionResponse {
  id: string;
  slug: string;
  submission_url: string;
  embed_src: string;
  submitters: Array<{
    id: string;
    email: string;
    slug: string;
    submission_url: string;
  }>;
}

/**
 * Creates a signature request in DocuSeal
 * @param meeting - The meeting object with acta content
 * @param pdfBase64 - Base64-encoded PDF of the acta
 * @param presidentEmail - Email of the president
 * @param secretaryEmail - Email of the secretary
 * @returns DocuSeal submission data with URLs
 */
export async function createSignatureRequest(
  meeting: Meeting,
  pdfBase64: string,
  presidentEmail: string,
  secretaryEmail: string
): Promise<CreateSubmissionResponse> {
  if (!DOCUSEAL_API_KEY) {
    throw new Error("DOCUSEAL_API_KEY no está configurada. Por favor añádela a tu archivo .env");
  }

  const templateId = process.env.DOCUSEAL_TEMPLATE_ID;

  if (!templateId) {
    throw new Error(
      "DOCUSEAL_TEMPLATE_ID no está configurada. " +
      "Debes crear una plantilla en DocuSeal y añadir su ID al archivo .env. " +
      "Instrucciones: https://www.docuseal.co/docs/templates"
    );
  }

  const submitters: DocuSealSubmitter[] = [
    {
      email: presidentEmail,
      name: "Presidente",
      role: "Presidente",
    },
    {
      email: secretaryEmail,
      name: "Secretaria",
      role: "Secretaria",
    },
  ];

  const fileName = `Acta_${meeting.buildingName.replace(/\s+/g, '_')}_${meeting.id}.pdf`;

  // Step 1: Create submission from template with document
  const response = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
    method: "POST",
    headers: {
      "X-Auth-Token": DOCUSEAL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: parseInt(templateId),
      send_email: true,
      submitters: submitters.map((s, index) => ({
        email: s.email,
        name: s.name,
        role: s.role,
      })),
      // Attach the PDF document to the submission
      documents: [
        {
          name: fileName,
          file: pdfBase64,
        },
      ],
      metadata: {
        meeting_id: meeting.id,
        building_name: meeting.buildingName,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DocuSeal API error:", errorText);

    // Provide helpful error messages
    if (response.status === 422) {
      throw new Error(
        "Error de configuración de DocuSeal. Verifica que DOCUSEAL_TEMPLATE_ID sea correcto. " +
        "Error: " + errorText
      );
    }

    throw new Error(`Error de DocuSeal API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Gets the status of a DocuSeal submission
 * @param submissionId - The DocuSeal submission ID
 * @returns Submission status data
 */
export async function getSubmissionStatus(submissionId: string): Promise<any> {
  if (!DOCUSEAL_API_KEY) {
    throw new Error("DOCUSEAL_API_KEY is not configured");
  }

  const response = await fetch(`${DOCUSEAL_API_URL}/submissions/${submissionId}`, {
    method: "GET",
    headers: {
      "X-Auth-Token": DOCUSEAL_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get submission status: ${response.status}`);
  }

  return response.json();
}

/**
 * Downloads the signed PDF from DocuSeal
 * @param submissionId - The DocuSeal submission ID
 * @returns PDF buffer
 */
export async function downloadSignedPDF(submissionId: string): Promise<Buffer> {
  if (!DOCUSEAL_API_KEY) {
    throw new Error("DOCUSEAL_API_KEY is not configured");
  }

  const response = await fetch(`${DOCUSEAL_API_URL}/submissions/${submissionId}/download`, {
    method: "GET",
    headers: {
      "X-Auth-Token": DOCUSEAL_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download signed PDF: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Verifies DocuSeal webhook signature
 * @param payload - The webhook payload
 * @param signature - The signature from the webhook header
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("DOCUSEAL_WEBHOOK_SECRET not configured, skipping webhook verification");
    return true; // Allow webhook if secret is not configured (dev mode)
  }

  // DocuSeal uses HMAC SHA256 for webhook signatures
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}
