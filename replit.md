# Overview

Acta is a Spanish Progressive Web Application (PWA) designed for community meeting secretaries aged 45-65 with low technical literacy. The application enables users to record meeting audio, automatically transcribe it using OpenAI's Whisper API, and generate formatted meeting minutes (actas) that can be reviewed, edited, and distributed via email. The application emphasizes simplicity, accessibility, and a warm, professional aesthetic inspired by Granola.ai and Descript.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety and modern component development
- Vite as the build tool and development server for fast builds and hot module replacement
- React Router (wouter) for lightweight client-side routing
- TanStack Query (React Query) for server state management and API caching

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- Tailwind CSS for utility-first styling with custom design tokens matching the Acta brand (warm cream backgrounds, deep blue/forest green primary colors, amber accents)
- Custom CSS variables for theming (defined in `index.css`) supporting the warm, governmental aesthetic
- Inter font family for clean, readable typography optimized for older users

**State Management Pattern**
- Local component state (useState) for UI interactions and form inputs
- TanStack Query for server state, providing automatic caching, background refetching, and optimistic updates
- No global state management library needed due to simple data flow and query-based architecture

**Audio Recording System**
- Custom `useAudioRecorder` hook encapsulating MediaRecorder API for browser-based audio capture
- Real-time audio visualization using Web Audio API's AnalyserNode for waveform display
- Support for pause/resume functionality during recording sessions
- Blob-based audio storage for upload to the transcription service

**Progressive Web App Features**
- Service worker configuration for offline support and app-like experience
- Responsive design with mobile-first approach (minimum 48px touch targets)
- Meta tags for PWA installation and theme color customization

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript for type-safe API development
- HTTP server creation using Node's built-in `http` module
- Custom request logging middleware tracking response times and status codes
- JSON body parsing with raw body preservation for webhook verification

**API Design Pattern**
- RESTful API endpoints under `/api` namespace
- Resource-based routes for meetings CRUD operations
- File upload handling via Multer middleware for audio files
- Standardized error handling with descriptive HTTP status codes

**Session & State Management**
- In-memory storage implementation (`MemStorage` class) for development/demo purposes
- Interface-based storage abstraction (`IStorage`) allowing easy migration to persistent database
- Sample data initialization for demonstration and testing

**File Processing**
- Multer configuration for audio file uploads with size limits (100MB max)
- Support for multiple audio formats (WebM, MP4, WAV, OGG, FLAC, etc.)
- Temporary file storage in `/uploads` directory with unique filename generation
- File cleanup after processing to prevent disk space accumulation

### Data Storage Solutions

**Database Schema (Drizzle ORM)**
- PostgreSQL as the target database (configured via Drizzle Kit)
- Neon serverless Postgres driver for connection pooling and edge compatibility
- Schema-first approach with TypeScript types generated from Drizzle schema definitions

**Data Models**
- `users` table: User authentication with username/password (planned for future implementation)
- `meetings` table: Core entity storing building name, attendee count, date, duration, status, audio URL, transcript JSON, recipients JSON, and generated document
- Zod schemas for runtime validation of incoming API requests and data transformations
- Enum-based status tracking (recording → processing → review → sent)

**Schema Design Decisions**
- JSONB columns for flexible transcript paragraph storage (id, timestamp, speaker, text)
- JSONB for email recipients list avoiding separate join tables
- UUID primary keys for scalability and avoiding sequential ID exposure
- Timestamp with timezone for accurate multi-region date handling

### External Dependencies

**OpenAI Integration**
- OpenAI Node.js SDK for accessing Whisper API (audio-to-text transcription)
- File-based audio upload using `fs.createReadStream()` for streaming large audio files
- GPT model integration capability for future AI-powered meeting minute generation
- Error handling for API rate limits and transcription failures

**Email Service**
- Nodemailer configured for SMTP-based email delivery (structure in place, implementation pending)
- Support for multiple recipients with name and email address
- HTML email templates for professional acta distribution

**Third-Party UI Components**
- Radix UI primitives (@radix-ui/*) for accessible, unstyled component foundations
- Lucide React for consistent icon system across the application
- React Hook Form with Zod resolvers for form validation and error handling
- Date-fns for locale-aware date formatting in Spanish

**Development Tools**
- ESBuild for fast server-side TypeScript compilation in production builds
- Replit-specific plugins for development (error overlay, cartographer, dev banner)
- Drizzle Kit for database migrations and schema management
- TSX for running TypeScript directly in development mode

### Authentication & Authorization

**Current State**
- User schema defined but authentication not yet implemented
- Session management infrastructure prepared (express-session, passport, connect-pg-simple)
- Future implementation will use Passport.js with local strategy for username/password authentication

### API Structure

**Endpoints**
- `POST /api/meetings` - Create new meeting and start recording
- `GET /api/meetings` - Retrieve all meetings for dashboard display
- `GET /api/meetings/:id` - Retrieve specific meeting details
- `PATCH /api/meetings/:id` - Update meeting (transcript edits, status changes)
- `DELETE /api/meetings/:id` - Remove meeting record
- `POST /api/meetings/:id/transcribe` - Upload audio and trigger Whisper transcription
- `POST /api/meetings/:id/send` - Email acta to recipients and mark as sent

**Error Handling Strategy**
- Try-catch blocks around async operations with descriptive error messages
- HTTP status codes: 400 for validation errors, 404 for not found, 500 for server errors
- Client-side error boundaries (planned) for graceful degradation
- Toast notifications for user-facing error messaging