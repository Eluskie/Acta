# Acta Improvement Plan - TRUST FIRST

## Core Value: Trust

**Principle**: Trust is our most important trait. If something doesn't add trust, we cannot afford to have it.

### What Trust Means for Acta

1. **Never show confusing fallback content** - If we can't generate a quality acta, say so clearly
2. **Never fake data** - Don't generate placeholder actas that look real but aren't
3. **Always be transparent** - Tell users when AI couldn't process their content
4. **Give clear options** - When something fails, show actionable next steps

---

## PRIORITY 0: TRUST ISSUES (FIX IMMEDIATELY)

### ❌ CRITICAL: Confusing AI Fallbacks

**Problem**: When transcript has no relevant information, GPT-4o still generates confusing placeholder text that destroys user trust.

**Location**: `server/routes.ts:867-894`

**Impact**:
- Users can't tell if acta is real or AI-generated garbage
- Loss of confidence in ALL actas, even good ones
- Users abandon the product

**Fix Required**:

1. **Add Transcript Quality Validation**
   ```typescript
   function validateTranscriptQuality(transcript: string): {
     isValid: boolean;
     reason?: string
   } {
     // Check minimum length
     if (transcript.length < 50) {
       return { isValid: false, reason: "Transcripción demasiado corta" };
     }

     // Check for actual content (not just noise)
     const words = transcript.split(/\s+/).filter(w => w.length > 2);
     if (words.length < 20) {
       return { isValid: false, reason: "No hay suficiente contenido" };
     }

     // Check if it's mostly gibberish
     const meaningfulWords = words.filter(w => /^[a-záéíóúñ]+$/i.test(w));
     if (meaningfulWords.length < words.length * 0.5) {
       return { isValid: false, reason: "Contenido no claro" };
     }

     return { isValid: true };
   }
   ```

2. **Add Acta Quality Validation**
   ```typescript
   function validateActaQuality(actaContent: string): {
     isValid: boolean;
     reason?: string;
   } {
     // Check if GPT said it couldn't generate
     const noInfoPhrases = [
       "no se pudo identificar",
       "no hay información suficiente",
       "no se identificaron temas",
       "no se proporcionó información",
     ];

     const lowerContent = actaContent.toLowerCase();
     for (const phrase of noInfoPhrases) {
       if (lowerContent.includes(phrase)) {
         return {
           isValid: false,
           reason: "IA no pudo generar acta con información suficiente"
         };
       }
     }

     // Check minimum length
     if (actaContent.length < 200) {
       return { isValid: false, reason: "Acta demasiado corta" };
     }

     return { isValid: true };
   }
   ```

3. **Update Database Schema** (add to meetings table)
   ```typescript
   actaQualityIssue: boolean | null;
   actaQualityReason: string | null;
   ```

4. **Update Transcription Endpoint**
   ```typescript
   // After transcription
   const transcriptText = finalParagraphs.map(...).join("\n");

   // VALIDATE TRANSCRIPT QUALITY
   const transcriptValidation = validateTranscriptQuality(transcriptText);

   if (!transcriptValidation.isValid) {
     // Don't even try to generate acta
     const meeting = await storage.updateMeeting(meetingId, {
       transcript: finalParagraphs,
       audioUrl,
       duration,
       status: "review",
       actaQualityIssue: true,
       actaQualityReason: transcriptValidation.reason,
     });

     return res.json(meeting);
   }

   // Try to generate acta
   const actaResponse = await openai.chat.completions.create(...);
   const actaContent = actaResponse.choices[0].message.content || "";

   // VALIDATE ACTA QUALITY
   const actaValidation = validateActaQuality(actaContent);

   if (!actaValidation.isValid) {
     // Don't save confusing content!
     const meeting = await storage.updateMeeting(meetingId, {
       status: "review",
       actaQualityIssue: true,
       actaQualityReason: actaValidation.reason,
     });

     return res.json(meeting);
   }

   // Only save if quality is good
   const meeting = await storage.updateMeeting(meetingId, {
     actaContent,
     status: "review",
     actaQualityIssue: false,
   });
   ```

5. **Update Frontend (ActaView.tsx)**
   ```tsx
   {meeting.actaQualityIssue ? (
     <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
       <div className="text-center">
         <h3 className="text-xl font-semibold text-yellow-900 mb-2">
           ⚠️ No pudimos generar el acta automáticamente
         </h3>
         <p className="text-yellow-700">
           {meeting.actaQualityReason || "La grabación no contiene información suficiente"}
         </p>
       </div>

       <div className="flex gap-3">
         <Button variant="outline" onClick={() => setShowTranscript(true)}>
           Revisar Transcripción
         </Button>
         <Button variant="outline" onClick={() => navigate(`/acta/new`)}>
           Grabar de Nuevo
         </Button>
         <Button onClick={() => setIsEditing(true)}>
           Escribir Acta Manualmente
         </Button>
       </div>
     </div>
   ) : actaContent ? (
     // Show normal acta
     <div dangerouslySetInnerHTML={{ __html: formatContent(actaContent) }} />
   ) : (
     // Empty state
     <p>Haz clic para editar...</p>
   )}
   ```

**Success Criteria**:
- ✅ Users NEVER see confusing AI-generated fallback text
- ✅ Clear warning when quality is insufficient
- ✅ Actionable options provided (review, re-record, manual)
- ✅ Users trust that when they see an acta, it's based on real content

---

## PRIORITY 1: CRITICAL BUGS

### 1. Wrong Email Sender Domain
**File**: `server/services/email.ts:42`
**Issue**: `from: 'Acta <noreply@updates.withflare.so>'` - wrong domain
**Fix**: `from: 'Acta <noreply@acta.netwoerk.com>'`
**Impact**: Emails go to spam, users lose trust in delivery

### 2. Audio Files Never Deleted
**File**: `server/routes.ts` (transcription endpoint)
**Issue**: Audio files accumulate indefinitely in `/uploads`
**Fix**: Delete after successful transcription
**Impact**: Server runs out of disk space

### 3. No Signature Validation
**File**: `client/src/pages/ActaSend.tsx` and `server/routes.ts`
**Issue**: No validation of signature data URI format
**Fix**: Validate `data:image/png;base64,` prefix
**Impact**: PDF generation crashes with invalid signatures

---

## PRIORITY 2: UX IMPROVEMENTS (TRUST-BUILDING)

### 4. Better Save Feedback
**File**: `ActaView.tsx`
**Issue**: Auto-save is silent, users don't know if edits were saved
**Fix**: Add "Guardando..." → "Guardado ✓" indicator
**Impact**: Users trust their edits are saved

### 5. Transcript Editing
**File**: `ActaView.tsx:363-369`
**Issue**: Transcript is read-only, can't fix errors
**Fix**: Make transcript editable, update acta when changed
**Impact**: Users can correct transcription mistakes → better actas

### 6. Email Error Recovery
**File**: `server/routes.ts:1046-1049`
**Issue**: Status set to "sent" even if email fails
**Fix**: Only update status after confirmed delivery
**Impact**: Users know real delivery status

---

## PRIORITY 3: TECHNICAL QUALITY

### 7. Improve HTML ↔ Plaintext Conversion
**File**: `ActaView.tsx:114-177`
**Issue**: Regex-based, fragile
**Fix**: Use DOMParser API
**Impact**: Reliable content editing

### 8. Add Save Debouncing
**Issue**: Race conditions on rapid edits
**Fix**: Debounce save by 500ms
**Impact**: Reliable saves under all conditions

---

## Documentation Updates

### Add to CLAUDE.md

**New Section (at top after Overview)**:

```markdown
## Core Values

### Trust Above All

Trust is the most important trait for Acta. Our users rely on us to accurately capture their community meetings, and we cannot compromise on this.

**Principles**:
1. **Never show confusing fallback content** - If we can't generate a quality acta from a recording, we clearly communicate this to the user
2. **Transparency in AI processing** - Users should always know when content is AI-generated vs. manually edited
3. **Clear error messages** - When something goes wrong, we explain what happened and give actionable next steps
4. **No fake data** - We never generate placeholder content that looks real but isn't based on actual meeting information

**Implementation**:
- Quality validation on all AI-generated content
- Clear warnings when audio quality is insufficient
- Options to re-record, review transcript, or write manually
- Visible save confirmations for all edits
- Reliable email delivery with status tracking

**Rule**: If a feature doesn't add trust, we don't ship it.
```

---

## Timeline

**IMMEDIATE (Today)**:
1. ✅ Add quality validation to acta generation
2. ✅ Update frontend to show clear warnings instead of confusing content
3. ✅ Fix email sender domain
4. ✅ Add save feedback indicator

**THIS WEEK**:
5. Audio file cleanup
6. Signature validation
7. Email error recovery

**NEXT WEEK**:
8. Transcript editing
9. HTML conversion improvement
10. Save debouncing

---

**Last Updated**: December 2024
**Status**: Ready for Implementation
