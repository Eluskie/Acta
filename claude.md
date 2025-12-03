# Acta - Meeting Minutes Management System

## Overview
Acta is a full-stack web application for managing community meeting minutes (actas). It allows users to record meetings, transcribe audio using AI, and automatically send professional PDFs via email to attendees.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Wouter** for routing
- **TanStack Query** for server state management
- **Clerk** for authentication
- **Tailwind CSS** + **shadcn/ui** for styling
- **Framer Motion** for animations
- **jsPDF** (client-side PDF preview)

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** (Neon) for database
- **Drizzle ORM** for database queries
- **Clerk Express** for server-side auth
- **OpenAI Whisper** for audio transcription
- **Resend** for email delivery
- **Multer** for file uploads

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── pages/       # Page components (Dashboard, ActaNew, ActaView, ActaSend, SignIn, SignUp)
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # Utilities (clerk.tsx, queryClient.ts)
│   │   └── hooks/       # Custom React hooks
│   └── public/          # Static assets (logos, SVGs)
├── server/              # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── middleware/      # Auth middleware
│   │   └── auth.ts
│   └── services/        # External services
│       └── email.ts     # Resend email service
├── shared/              # Shared types and schemas
│   └── schema.ts        # Zod schemas + TypeScript types
└── uploads/             # Audio file storage (not in git)
```

## Typography Guidelines

### Font System

Acta uses a **two-font system** to create visual hierarchy and improve usability:

1. **Tiempos Text** (Serif) - Display/Accent font
2. **Inter** (Sans-serif) - UI/System font

### The Golden Rule: Content vs. Interface

**Use Tiempos (Accent) for:**
- ✅ **Page Content Headers** - The main subject matter users came to read
- ✅ **Editorial/Marketing Content** - Messages with personality
- ✅ **Document Content** - Printed or PDF material

**Use Sans-serif (System) for:**
- ✅ **UI Chrome** - Navigation, toolbars, sticky headers
- ✅ **Data Display** - Tables, lists, cards, metrics
- ✅ **Interactive Elements** - Buttons, forms, inputs, labels

### Detailed Decision Matrix

| Element Type | Font | Reasoning |
|--------------|------|-----------|
| **Page greeting** ("Buenos días, Gerard") | **Tiempos** | Personal content - creates warmth |
| **Content section headers** ("Actas Recientes") | **Tiempos** | Organizes page content - editorial |
| **Sticky page headers** ("Enviar Acta Oficial") | **Sans-serif** | UI chrome - needs to be compact |
| **Card titles** (Meeting names in list) | **Sans-serif** | Data display - scannable |
| **Form labels** ("Destinatarios", "Asunto") | **Sans-serif** | Functional UI - clarity over style |
| **Button text** | **Sans-serif** | Interactive element - legibility |
| **Empty state messages** | **Tiempos** | Editorial content - engaging |
| **Modal titles** (functional) | **Sans-serif** | UI element - not content |
| **Modal titles** (content-focused) | **Tiempos** | If modal is content, not UI |
| **Stats/Numbers** | **Sans-serif** | Data display - precision |
| **Tooltips/Hints** | **Sans-serif** | UI helper - quick scanning |

### Implementation

All typography is controlled globally via `client/src/index.css`:

```css
/* Headers use Tiempos by default */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif); /* Tiempos Text */
}

/* Override with font-sans class when needed */
.font-sans {
  font-family: var(--font-sans); /* Inter */
}
```

### When in Doubt

Ask yourself: **"Is this content or interface?"**

- **Content** = What the user came to read/consume → **Tiempos**
- **Interface** = Tools to navigate/interact with content → **Sans-serif**

### Examples from Acta

```tsx
// ✅ CORRECT - Page content header
<h1>Buenos días, Gerard</h1>  // Uses Tiempos (default)

// ✅ CORRECT - UI sticky header
<h1 className="font-sans">Enviar Acta Oficial</h1>  // Override to sans-serif

// ✅ CORRECT - Section header in content
<h2>Actas Recientes</h2>  // Uses Tiempos (default)

// ✅ CORRECT - Card title (data display)
<h3 className="font-sans">{meeting.buildingName}</h3>  // Override to sans-serif

// ✅ CORRECT - Form label
<Label className="font-sans">Destinatarios</Label>  // Explicitly sans-serif
```

### Typography Scale

| Element | Size (Mobile) | Size (Desktop) | Weight | Font |
|---------|---------------|----------------|--------|------|
| h1 | 36px (2.25rem) | 48px (3rem) | 400 | Tiempos |
| h2 | 18px | 18px | 500 | Tiempos |
| h3 | 24px (1.5rem) | 30px (1.875rem) | 400 | Tiempos |
| h4 | 20px (1.25rem) | 24px (1.5rem) | 400 | Tiempos |
| Body | 16px (1rem) | 16px (1rem) | 400 | Inter |
| Small | 14px (0.875rem) | 14px (0.875rem) | 400 | Inter |


## Key Features

### 1. Authentication (Clerk)
- Custom branded sign-in/sign-up pages with animated blurs
- Protected routes with authentication middleware
- Server-side authentication using Clerk Express
- User profile management with `useCurrentUser` hook

**Key Files:**
- `client/src/lib/clerk.tsx` - Clerk provider and hooks
- `server/middleware/auth.ts` - Server-side auth middleware

### 2. Meeting Creation & Recording
- Create new meetings with building/community info
- Record audio directly in browser using MediaRecorder API
- Upload audio files (supports .webm, .mp4, .mp3, .wav, .m4a)
- Automatic transcription using OpenAI Whisper
- AI-powered translation to Spanish

**Key Files:**
- `client/src/pages/ActaNew.tsx` - New meeting form + audio recorder
- `client/src/hooks/useAudioRecorder.ts` - Audio recording logic
- `server/routes.ts` (POST `/api/meetings`, POST `/api/upload-audio`)

### 3. Meeting Management
- View all meetings on Dashboard
- Filter by building name
- Edit meeting details
- View transcription and acta content
- Download as PDF

**Key Files:**
- `client/src/pages/Dashboard.tsx` - Main dashboard
- `client/src/pages/ActaView.tsx` - View/edit meeting
- `server/routes.ts` (GET `/api/meetings`, GET `/api/meetings/:id`, PATCH `/api/meetings/:id`)

### 4. Email Delivery with PDF
- Send actas via email to multiple recipients
- Professional HTML email template
- PDF automatically attached
- Uses Resend for reliable delivery

**Key Files:**
- `client/src/pages/ActaSend.tsx` - Email composition UI
- `server/services/email.ts` - Resend integration
- `server/routes.ts` (POST `/api/meetings/:id/send`, GET `/api/meetings/:id/download-pdf`)

## Environment Variables

### Required for Development & Production:

```bash
# Database
DATABASE_URL="postgresql://user:password@host/database"

# OpenAI (for transcription)
OPENAI_API_KEY="sk-proj-..."

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_..."           # For backend
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."     # For frontend (Vite)
CLERK_SECRET_KEY="sk_test_..."               # For backend

# Resend (for email)
RESEND_API_KEY="re_..."

# Server
PORT=5000
NODE_ENV=development  # or "production"
```

## Deployment (Coolify on Hetzner)

### Setup in Coolify Dashboard:

1. **Source**: Connect to GitHub repo `Eluskie/Acta`
2. **Branch**: `main`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm run start`
5. **Port**: `5000`

### Environment Variables in Coolify:
Add all required environment variables listed above through the Coolify dashboard under your project's Environment Variables section.

### Domain:
- Production: `acta.netwoerk.com`

### Database:
Using Neon (PostgreSQL) - connection string in `DATABASE_URL`

## Development

### Local Setup:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Then fill in your keys

# Run development server (backend + frontend)
npm run dev

# Access the app
http://localhost:5000
```

### Database Schema:
See `shared/schema.ts` for complete schema definitions using Drizzle ORM.

Main tables:
- `users` - User accounts (synced from Clerk)
- `meetings` - Meeting records with audio, transcription, and acta content
- `recipients` - Email recipients (embedded in meetings table as JSON)

## API Endpoints

### Meetings
- `GET /api/meetings` - List all meetings (with optional filters)
- `POST /api/meetings` - Create new meeting
- `GET /api/meetings/:id` - Get meeting by ID
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Audio & Transcription
- `POST /api/upload-audio` - Upload audio file
- `POST /api/transcribe` - Transcribe audio using Whisper

### Email & PDF
- `POST /api/meetings/:id/send` - Send acta via email with PDF
- `GET /api/meetings/:id/download-pdf` - Download PDF

### User Management
- Uses Clerk for authentication - no custom user endpoints needed

## Git Branches

- `main` - Production branch (deployed to acta.netwoerk.com)
- `feature/buildings` - WIP building management feature (not in production)

## Notes

### Building Management Feature
Currently in separate branch `feature/buildings`. Includes:
- BuildingsPage, BuildingDetailPage
- BuildingCard component
- Mock building data

Not ready for production - intentionally excluded from main branch.

### Email Setup
Resend is configured to send from `onboarding@resend.dev` (Resend's test domain).
For production, you should verify your own domain in Resend and update the `from` address in `server/services/email.ts`.

### Audio Storage
Audio files are stored in `/uploads` directory (not committed to git).
In production, configure `UPLOADS_DIR` environment variable if needed.

## Future Enhancements

- [ ] Real building management system (currently in feature branch)
- [ ] Multiple language support
- [ ] Advanced PDF customization
- [ ] Email templates editor
- [ ] Bulk operations (send multiple actas at once)
- [ ] Search functionality
- [ ] Export to other formats (Word, Excel)

## Troubleshooting

### 500 Error on /api/meetings
- Check all environment variables are set correctly
- Verify database connection (DATABASE_URL)
- Check server logs in Coolify

### Email not sending
- Verify RESEND_API_KEY is set in production
- Check Resend dashboard for send logs
- Ensure recipients have valid email addresses

### Audio upload fails
- Check file format is supported
- Verify uploads directory exists and is writable
- Check file size limits (multer config)

### Authentication issues
- Verify all three Clerk keys are set correctly
- Check Clerk dashboard for user sync issues
- Ensure CLERK_PUBLISHABLE_KEY and VITE_CLERK_PUBLISHABLE_KEY have the same value

---

**Last Updated**: December 2024
**Maintained By**: Claude + Development Team
