import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Resend API key is set
if (!process.env.RESEND_API_KEY) {
  console.warn(
    "⚠️ Missing RESEND_API_KEY environment variable.\n" +
    "Email sending will not work. Add your Resend API key to .env"
  );
}

export interface SendActaEmailParams {
  to: Array<{ name: string; email: string }>;
  subject: string;
  message: string;
  pdfBase64: string;
  pdfFileName: string;
  buildingName: string;
  meetingDate: string;
}

/**
 * Send acta via email with PDF attachment using Resend
 */
export async function sendActaEmail({
  to,
  subject,
  message,
  pdfBase64,
  pdfFileName,
  buildingName,
  meetingDate,
}: SendActaEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Resend API key not configured");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Acta <onboarding@resend.dev>', // Replace with your verified domain
      to: to.map(recipient => recipient.email),
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #166534 0%, #15803d 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-top: none;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .meeting-info {
                background: #f9fafb;
                border-left: 4px solid #166534;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .meeting-info p {
                margin: 5px 0;
              }
              .meeting-info strong {
                color: #166534;
              }
              .message {
                margin: 20px 0;
                padding: 20px;
                background: #f3f4f6;
                border-radius: 6px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 14px;
                color: #6b7280;
              }
              .button {
                display: inline-block;
                background: #166534;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 15px 0;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📄 Acta Oficial</h1>
            </div>
            <div class="content">
              <p>Estimado/a,</p>

              <div class="meeting-info">
                <p><strong>Edificio:</strong> ${buildingName}</p>
                <p><strong>Fecha:</strong> ${meetingDate}</p>
              </div>

              <div class="message">
                <p>${message}</p>
              </div>

              <p>Adjunto a este correo encontrará el acta oficial en formato PDF.</p>

              <p>Por favor, revise el documento y confirme su recepción.</p>

              <div class="footer">
                <p>Este es un correo automático generado por Acta.</p>
                <p>© ${new Date().getFullYear()} Acta - Sistema de Gestión de Actas</p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("✅ Email sent successfully via Resend:", data?.id);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
