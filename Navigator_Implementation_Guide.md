# Pythia Navigator Implementation Guide

**Version:** 1.0  
**Date:** August 6, 2026  
**Status:** Build Phase (Ready-to-Connect Architecture)

---

## Overview

Pythia Navigator is the clinician-facing coordination layer that:
- Intercepts healthcare requests from Pythia Field
- Extracts structured data from prescriptions (OCR + Claude)
- Converts to FHIR-compliant format
- Coordinates lab visits, appointments, and communications
- Logs outcomes to Supabase for ZFA calibration

**Key principle:** All infrastructure is built and "ready to connect" — external APIs (Twilio, ElevenLabs, Gmail) activated only when credentials are added.

---

## System Architecture

### High-Level Flow

```
Prescription (Email/Upload)
    ↓
Gmail OAuth → Read/Extract
    ↓
AWS Textract (OCR) + Claude (Parse)
    ↓
FHIR Conversion (ServiceRequest, Observation)
    ↓
Supabase Storage (clinical_events table)
    ↓
Pythia coordinates:
  • Find facility (Google Maps)
  • Schedule appointment (Google Calendar OAuth)
  • Confirm with facility (Twilio skeleton)
  • Send confirmation to doctor (Gmail OAuth)
    ↓
Log outcome → Supabase (audit_logs)
    ↓
ZFA calibration feedback
```

### Component Breakdown

#### 1. **Gmail OAuth Integration**
**Purpose:** Read prescriptions directly from Owen's email inbox

**Workflow:**
- User authorizes Pythia to access Gmail
- Listen for emails from doctor's domain
- Extract prescription attachment or body
- Parse structured data

**Implementation:**
```typescript
// src/services/gmail-connector.ts
- initGmailOAuth()
- readInboxPrescriptions()
- extractPrescriptionData(email)
- markProcessed()
```

**Supabase trigger:** New email → `clinical_events` table entry

---

#### 2. **Document Upload + OCR**
**Purpose:** Owen can upload prescription image/PDF for manual coordination

**Flow:**
- Frontend: File upload component (image, PDF)
- AWS Textract: Extract text from image
- Claude API: Parse extracted text → structured data
- Supabase: Store extracted prescription

**Implementation:**
```typescript
// src/services/document-parser.ts
- uploadDocument(file)
- callTextract(file) → raw text
- parseWithClaude(text) → { labType, dosage, urgency, etc. }
- saveToPrescription()
```

**API Endpoint:**
```
POST /api/prescription/upload
Body: { file, patientId }
Response: { prescriptionId, extractedData, confidence }
```

**Supabase table:** `clinical_events` (document_source: "upload")

---

#### 3. **FHIR Data Conversion**
**Purpose:** Convert extracted data to HL7 FHIR R4 format for hospital EHR interoperability

**FHIR Resources Used:**
- **ServiceRequest** — lab order (LOINC codes)
- **Observation** — test results
- **Appointment** — scheduled lab visit
- **Task** — action item (call, confirm, follow-up)

**Implementation:**
```typescript
// src/services/fhir-converter.ts
- prescriptionToServiceRequest(rx) 
  → { resourceType: "ServiceRequest", code: LOINC, ... }
  
- labFindingToObservation(result)
  → { resourceType: "Observation", value, status, ... }
  
- appointmentToFHIR(slot)
  → { resourceType: "Appointment", participant, start, end, ... }
  
- validateFHIR(resource)
  → checks cardinality, required fields, coding systems
```

**Example:** Blood test prescription
```json
{
  "resourceType": "ServiceRequest",
  "id": "rx-001",
  "status": "active",
  "intent": "order",
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "58410-2",
        "display": "Complete blood count (CBC) panel"
      }
    ]
  },
  "subject": {
    "reference": "Patient/550e8400-e29b-41d4-a716-446655440000"
  },
  "authoredOn": "2026-08-06",
  "requester": {
    "display": "Dr. Smith, UCSF"
  }
}
```

**Supabase:** Store FHIR JSON in `clinical_events.fhir_data` (JSONB)

---

#### 4. **Google Calendar OAuth**
**Purpose:** Schedule lab appointments directly in Owen's calendar

**Workflow:**
- User authorizes Pythia to access Google Calendar
- Pythia finds available lab slots
- Books appointment in calendar
- Sends confirmation to lab

**Implementation:**
```typescript
// src/services/calendar-connector.ts
- initCalendarOAuth()
- findLabAvailability(labId, dateRange)
- createEvent(lab, time, notes)
- sendNotification(ownerId, calendarEvent)
```

**API Endpoint:**
```
POST /api/appointment/schedule
Body: { labId, preferredDate, labType, patientId }
Response: { eventId, confirmedTime, calendarLink }
```

---

#### 5. **Twilio Skeleton (Ready to Connect)**
**Purpose:** Make outbound calls to labs/doctors to confirm orders

**Workflow (ready to activate):**
- Pythia generates call script (lab confirmation needed)
- Twilio initiates call
- Owen's synthesized voice asks questions
- Records response
- Escalates if needed

**Implementation:**
```typescript
// src/services/twilio-connector.ts
- initTwilio(accountSid, authToken, phoneNumber)
- makeCall(destination, script, voiceId)
- recordResponse()
- escalateOnFailure()
```

**API Endpoint (skeleton, awaiting credentials):**
```
POST /api/call/initiate
Body: { 
  destination: "+1234567890",
  script: "Confirm lab order...",
  voiceId: "owen-cloned",
  patientId
}
Response: { callSid, status: "pending" }
```

**Status:** Endpoint built, awaiting Twilio credentials + ElevenLabs voice clone

---

#### 6. **Google Maps Integration (Already Built)**
**Purpose:** Find nearest labs, imaging centers, hospitals

**Current state:** Generates search links (user clicks to explore)

**Future:** Integrate with lab database for automated scheduling

```typescript
// src/services/healthcare-coordinator.ts (existing)
- findNearestLab(labType, location)
  → returns Google Maps search URL
```

---

#### 7. **Escalation Logic**
**Purpose:** Handle failures and edge cases

**Decision Tree:**
```
Lab order received
  ├─ Parse prescription
  │   ├─ Success → Find lab
  │   └─ Failure (confidence < 70%) → Alert care team
  ├─ Find lab
  │   ├─ Found → Schedule
  │   └─ Not found (rare) → Alert care team + provide manual options
  ├─ Schedule appointment
  │   ├─ Success → Confirm with lab call
  │   └─ Failure → Retry 3x, then alert care team
  ├─ Confirm with lab
  │   ├─ Success → Log outcome, send confirmation email
  │   └─ Failure → Escalate to care team for manual coordination
  └─ Send confirmation to doctor
      ├─ Success → Complete
      └─ Failure (email fails) → Log, alert care team
```

**Implementation:**
```typescript
// src/services/escalation-handler.ts
- evaluateConfidence(extraction)
- escalateToTeam(reason, context)
- retryWithBackoff(action, maxRetries)
- logEscalation(Supabase)
```

---

## API Endpoints (Ready-to-Connect)

### 1. Document Processing
```
POST /api/prescription/upload
- File upload (image, PDF)
- Returns: extractedData, prescriptionId

POST /api/prescription/parse
- Manual text input
- Returns: structured prescription data
```

### 2. FHIR Conversion
```
POST /api/fhir/convert
- Input: extracted prescription
- Returns: FHIR ServiceRequest JSON
- Validates: cardinality, required fields, coding systems
```

### 3. Lab Coordination
```
GET /api/labs/search
- Query: labType, location, availability
- Returns: lab options (Google Maps data)

POST /api/appointment/schedule
- Input: labId, preferredDate, patientId
- Returns: appointmentId, confirmedTime (via Google Calendar)

POST /api/call/initiate (SKELETON)
- Input: destination, script, voiceId
- Status: Ready to connect (awaits Twilio + ElevenLabs)
```

### 4. Communication
```
POST /api/email/send-confirmation
- Input: recipient, prescriptionData, appointmentDetails
- Status: Ready to connect (awaits Gmail OAuth)
```

---

## Supabase Schema Mapping to FHIR

### clinical_events table
```sql
{
  id: UUID,
  patient_id: UUID,
  event_type: "prescription_received" | "lab_order" | "appointment_scheduled",
  severity: "low" | "medium" | "high",
  description: TEXT,
  fhir_data: JSONB,  -- Full FHIR resource
  source: "gmail" | "upload" | "manual",
  timestamp: TIMESTAMP,
  created_at: TIMESTAMP
}
```

### Example entry (blood test)
```json
{
  "event_type": "lab_order",
  "severity": "medium",
  "source": "gmail",
  "fhir_data": {
    "resourceType": "ServiceRequest",
    "code": {
      "coding": [{"system": "http://loinc.org", "code": "58410-2"}]
    },
    "subject": {"reference": "Patient/550e8400..."},
    "status": "active"
  }
}
```

### audit_logs table (escalations)
```sql
{
  id: UUID,
  patient_id: UUID,
  action: "escalation_triggered" | "retry_attempted" | "manual_intervention",
  context: JSONB,  -- What went wrong
  timestamp: TIMESTAMP
}
```

---

## Implementation Checklist

### Phase 1: Document Processing (Week 1)
- [ ] AWS Textract integration
  - [ ] AWS SDK setup
  - [ ] Upload handler
  - [ ] Extract text pipeline
- [ ] Claude parsing
  - [ ] System prompt for prescription extraction
  - [ ] Structure validation
- [ ] Supabase storage
  - [ ] Save extracted data
  - [ ] Link to patient

### Phase 2: OAuth Integrations (Week 1-2)
- [ ] Gmail OAuth
  - [ ] Setup Google Cloud project
  - [ ] Authorize app
  - [ ] Read inbox
  - [ ] Auto-extract prescriptions
- [ ] Google Calendar OAuth
  - [ ] Setup Google Cloud project
  - [ ] Create event handler
  - [ ] Send notifications

### Phase 3: FHIR Conversion (Week 2)
- [ ] Install FHIR Developer skill
  - [ ] `/plugin marketplace add anthropics/healthcare`
  - [ ] `/plugin install fhir-developer@healthcare`
- [ ] Implement converters
  - [ ] Prescription → ServiceRequest
  - [ ] Result → Observation
  - [ ] Appointment → FHIR Appointment
- [ ] Validation
  - [ ] Cardinality checks
  - [ ] Required fields
  - [ ] Coding systems (LOINC, SNOMED CT)

### Phase 4: Coordination Logic (Week 2-3)
- [ ] Lab search (Google Maps)
  - [ ] Already built, use existing
- [ ] Calendar scheduling (Google Calendar)
  - [ ] Book appointment
  - [ ] Send confirmation
- [ ] Escalation handler
  - [ ] Decision tree logic
  - [ ] Retry mechanism
  - [ ] Care team alert

### Phase 5: Twilio Skeleton (Week 3)
- [ ] Build call endpoint
  - [ ] Script generation
  - [ ] Call initiation (awaits credentials)
  - [ ] Response recording (awaits credentials)
- [ ] Voice cloning setup
  - [ ] Coordinate with Owen
  - [ ] Consent documentation
  - [ ] ElevenLabs voice ID storage

### Phase 6: Testing & Staging (Week 3-4)
- [ ] Unit tests (each component)
- [ ] Integration tests (end-to-end flow)
- [ ] Deploy to staging
- [ ] Owen testing (text-based flow)

---

## Deployment Checklist: "Ready to Connect"

### Gmail OAuth
```
[ ] Google Cloud project created
[ ] OAuth consent screen configured
[ ] Client ID + Secret generated
[ ] Scopes: gmail.readonly
[ ] Redirect URI: https://staging.therapeia.app/oauth/gmail/callback
```

### Google Calendar
```
[ ] Google Cloud project (same as Gmail)
[ ] Calendar API enabled
[ ] OAuth scopes: calendar
[ ] Redirect URI configured
```

### AWS Textract
```
[ ] AWS account setup
[ ] IAM role created
[ ] S3 bucket for uploads configured
[ ] Access keys stored in .env.local
```

### Twilio (Awaiting Credentials)
```
[ ] Account SID
[ ] Auth Token
[ ] Twilio phone number
[ ] Endpoint built, ready to activate
```

### ElevenLabs (Awaiting Credentials + Voice Clone)
```
[ ] API key
[ ] Owen's voice cloning consent
[ ] Voice ID generated
[ ] Endpoint built, ready to activate
```

### Supabase
```
[ ] All tables created (clinical_events, audit_logs, etc.)
[ ] Row-level security configured
[ ] Indexes on patient_id, timestamp
```

---

## Data Privacy & Compliance

### HIPAA Considerations
- All patient data encrypted at rest (Supabase)
- All transmission over TLS
- Audit logs track who accesses what
- Prescription data never leaves secure pipeline

### FHIR Security
- Use FHIR SMART on FHIR for OAuth
- Validate all incoming FHIR resources
- Log all FHIR transformations

### Consent Tracking
- Owen's voice cloning consent
- Gmail/Calendar OAuth consent
- Supabase audit trail

---

## Testing Strategy

### Unit Tests
```typescript
// Test extraction accuracy
- parseBloodTestPrescription()
- parseImagingOrder()
- parseFollowUpVisit()

// Test FHIR conversion
- prescriptionToServiceRequest()
- validateFHIRResource()

// Test escalation logic
- evaluateConfidence()
- triggerEscalation()
```

### Integration Tests
```typescript
// End-to-end: Email → Lab Coordination
- receiveGmailPrescription()
- extractAndParse()
- convertToFHIR()
- findLab()
- scheduleAppointment()
- confirmWithLab()
- sendConfirmation()
```

### Patient Zero Validation
- Owen uploads sample prescriptions
- Pythia extracts and coordinates
- Owen reviews calendar entries
- Gather feedback before Board presentation

---

## Monitoring & Logging

### Key Metrics
- Prescription extraction confidence (target: >90%)
- Lab scheduling success rate (target: >95%)
- Escalation frequency (target: <5%)
- End-to-end time (target: <30 min)

### Supabase Monitoring
- Query `clinical_events` for extraction trends
- Query `audit_logs` for escalation patterns
- Dashboard: success rate by lab type

---

## Next: Build Order

**Week 1 (This Week):**
1. AWS Textract integration
2. Claude prescription parsing
3. Gmail OAuth setup

**Week 2:**
4. Google Calendar OAuth
5. FHIR conversion (with Developer skill)
6. Escalation logic

**Week 3:**
7. Twilio skeleton
8. Integration testing
9. Staging deployment

**Week 4:**
10. Owen validation feedback
11. Board presentation prep
12. Fund raise

---

## References

- **FHIR R4:** https://www.hl7.org/fhir/R4/
- **LOINC codes:** https://loinc.org
- **SMART on FHIR:** https://smart.hl7.org
- **Anthropic FHIR skill:** Claude Code plugin marketplace
- **Supabase docs:** https://supabase.com/docs

---

**Status:** Ready to build. All infrastructure "ready to connect" — external credentials activate on demand.
