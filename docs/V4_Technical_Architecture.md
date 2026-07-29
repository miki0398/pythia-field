# PYTHIA FIELD — TECHNICAL ARCHITECTURE DOCUMENT
## Section 3: Complete V4 Technical Architecture
### 32-Member Specialist Board · Approved Specification

**Date:** May 2026  
**Scope:** Patient Zero (PWA · iOS Safari · Apple Watch) → Public Release (iOS App Store + Android)  
**Governing principle:** Build once for Patient Zero. Build right for everyone.

---

## ARCHITECTURAL NORTH STAR

Every technical decision in this document answers one question:

> *"Does this make Owen safer, and does it scale to a patient in Buenos Aires on an Android phone three years from now?"*

If the answer to either half is no, the decision is reconsidered.

The architecture is organized in two explicit phases:

- **Phase A — Patient Zero (PWA):** Runs in iOS Safari, installed to Home Screen, connected to Apple Watch via HealthKit bridge. Deployable within weeks. No App Store. No app review process.
- **Phase B — Public Release:** React Native / Expo codebase that shares 85%+ of business logic with Phase A. Single submission to both iOS App Store and Google Play. No rewrite.

The transition from A to B is a **migration, not a rebuild.** The entire backend, API layer, data models, AI services, and business logic are identical in both phases. Only the frontend shell changes.

---

## PART 1 — THE PLATFORM DECISION: WHY NOT NATIVE-ONLY FROM DAY ONE

The board debated this at length. The argument for going native immediately is real: full BLE, full HealthKit, background processing, better performance. The argument against it for Patient Zero is equally real: App Store review takes 1–4 weeks, requires a paid Apple Developer account, introduces a submission-approval cycle that delays every subsequent update, and adds Xcode/Swift complexity that slows iteration during the most critical feedback period.

**Board decision: PWA for Patient Zero, React Native for public release.**

The PWA-to-React Native migration path is well-established (Capacitor is the bridge). The PWA approach for Patient Zero is not a compromise — it is the fastest path to putting a working, trustworthy product in Owen's hands.

**The one exception:** HealthKit access. Apple does not expose HealthKit to web browsers, even installed PWAs. For Owen's Apple Watch data to flow into Pythia, a **minimal native shell** is required — approximately 200 lines of Swift that wrap the PWA in a WKWebView and expose a single JavaScript bridge for HealthKit read permissions. This is Option A.5 as identified in the pre-Section-3 clarification.

---

## PART 2 — CROSS-PLATFORM STRATEGY (PHASE A → PHASE B)

### 2.1 The Shared Core Principle

The codebase is structured so that the business logic, AI services, data models, state management, and API integration are **completely platform-agnostic** from day one. The only platform-specific code is in a thin adapter layer.

```
┌─────────────────────────────────────────────────────────┐
│                    SHARED CORE (85%)                    │
│  Business Logic · State · AI Services · Data Models     │
│  NFB Engine · PCCA · Conversation Memory · API Hooks    │
├────────────────────┬────────────────────────────────────┤
│  PLATFORM ADAPTER  │  PLATFORM ADAPTER                  │
│  Web/PWA           │  React Native (iOS + Android)      │
│                    │                                     │
│  Web Speech API    │  iOS: AVSpeechSynthesizer           │
│  HealthKit bridge  │  Android: TextToSpeech API          │
│  via WKWebView     │  iOS: HealthKit                     │
│  Web Bluetooth     │  Android: Google Fit / Health       │
│  (limited iOS)     │  React Native BLE library           │
│  Web Push API      │  iOS/Android: Push Notifications    │
│  Canvas 2D         │  React Native Skia / Canvas         │
│  IndexedDB         │  React Native MMKV / SQLite         │
└────────────────────┴────────────────────────────────────┘
```

### 2.2 Technology Stack Decision

**Frontend (Phase A — PWA):**
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5 (fastest build tool available, excellent PWA plugin support)
- **State:** Zustand (lightweight, no boilerplate, works identically in React Native)
- **Styling:** CSS Modules + CSS custom properties (no Tailwind — unnecessary bloat for a focused app, and CSS Modules migrate cleanly to React Native StyleSheet)
- **Canvas:** OffscreenCanvas + Web Worker where supported; fallback to main thread
- **PWA:** Vite PWA Plugin (wraps Workbox, handles service worker generation)
- **Testing:** Vitest (unit) + Playwright (E2E)

**Frontend (Phase B — React Native):**
- **Framework:** React Native 0.74+ with Expo SDK 51+
- **Same state, same business logic, same TypeScript models**
- Canvas → React Native Skia (identical drawing API conceptually)
- IndexedDB → React Native MMKV (encrypted key-value) + SQLite via expo-sqlite
- Web Push → Expo Notifications (wraps APNs + FCM)
- HealthKit → expo-health (wraps native HealthKit + Google Health Connect)
- BLE → react-native-ble-plx (wraps CoreBluetooth + Android BLE)

**Why this stack over alternatives:**

| Alternative | Why Rejected |
|---|---|
| Vue / Svelte | React Native requires React; switching frameworks means two codebases |
| Flutter | Dart ecosystem means no shared code with web; excellent otherwise but wrong for this migration path |
| Ionic / Capacitor | Valid alternative but Expo has stronger healthcare app precedent and better HealthKit tooling |
| Angular | Too much boilerplate for a focused companion app |
| Next.js | SSR adds unnecessary complexity for a fully client-side app with no SEO requirement |

---

## PART 3 — BACKEND ARCHITECTURE

### 3.1 The Backend Philosophy

The backend does not store patient data. Let that statement sink in.

**The backend is an orchestration and intelligence layer, not a data store.** Raw NFB data, conversation transcripts, and PHI live on the patient's device (encrypted) or in their personal cloud storage partition (encrypted with their key). The backend coordinates, computes, routes, and governs — it does not own.

This is not just a privacy decision. It is a regulatory one (reduces HIPAA exposure surface), a cost decision (eliminates the most expensive storage at scale), and an architectural one (enables offline-first operation without synchronization conflicts).

### 3.2 Backend Stack

**Runtime:** Node.js 22 LTS + TypeScript  
**Framework:** Fastify 4 (2-3x faster than Express, native TypeScript, excellent plugin ecosystem)  
**Why Fastify over Express:** Request/response serialization is 40% faster. Schema validation is built-in (Zod integration). Plugin architecture is cleaner for a microservices-leaning monolith. For a real-time health platform, this performance margin matters at scale.  
**Why not Go / Rust:** Team velocity matters more than marginal performance gains at pilot scale. TypeScript across frontend and backend = shared types, shared models, shared validation schemas.

### 3.3 Service Architecture — Modular Monolith

**The board rejects microservices for the pilot.** Microservices introduce operational complexity (service discovery, distributed tracing, inter-service authentication) that has no benefit at Patient Zero scale and significant cost at early startup scale. The correct architecture for this phase is a **modular monolith** — internally well-separated modules that can be extracted into independent services if and when scale demands it.

```
pythia-backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # WebAuthn / Passkey
│   │   ├── patients/       # Patient profiles, PCCA
│   │   ├── nfb/            # NFB engine, domain management
│   │   ├── conversation/   # LLM orchestration, memory
│   │   ├── ambient/        # Ambient listening engine (NEW)
│   │   ├── documents/      # Document ingestion, OCR, embeddings
│   │   ├── careTeam/       # Providers, emergency contacts
│   │   ├── escalation/     # Alert engine, Twilio integration
│   │   ├── navigator/      # FHIR R5 bridge to Pythia Navigator
│   │   ├── therapeia/      # Anonymized data relay to Therapeia platform
│   │   └── healthkit/      # Apple Watch / HealthKit data processor
│   ├── shared/
│   │   ├── crypto/         # Encryption utilities
│   │   ├── audit/          # HIPAA audit log writer
│   │   ├── llm/            # LLM provider abstraction layer
│   │   └── queue/          # Job queue (BullMQ)
│   └── infrastructure/
│       ├── database/       # Postgres connection, migrations
│       ├── cache/          # Redis connection
│       ├── storage/        # R2/S3 client
│       └── websocket/      # Real-time connections
```

### 3.4 API Design

**Protocol:** REST + WebSocket (hybrid)

| Use Case | Protocol | Reason |
|---|---|---|
| Auth, care team, documents | REST (HTTPS) | Request/response, no persistence needed |
| Real-time NFB updates | WebSocket | Continuous stream, low latency |
| Pythia conversation | WebSocket | Streaming LLM responses (token by token) |
| Ambient signal events | WebSocket | Continuous audio feature stream |
| Emergency escalation | REST + WebSocket | REST for reliability, WS for status updates |
| HealthKit sync | REST | Batch, periodic |
| FHIR Navigator | REST | FHIR R5 specification requires HTTP |

**API versioning:** All endpoints versioned from day one (`/api/v1/...`). Never break Patient Zero when adding features for the public release.

**Rate limiting:** All endpoints rate-limited. Conversation endpoint: 60 requests/minute. Auth endpoint: 5 attempts/15 minutes with exponential backoff. Emergency escalation: no rate limit (patient safety > abuse prevention).

---

## PART 4 — CLOUD INFRASTRUCTURE

### 4.1 Cloud Provider Decision

**Primary: Cloudflare (Workers + R2 + D1 + KV + Durable Objects)**  
**Database: Supabase (managed Postgres + pgvector + Row Level Security)**  
**AI Services: Anthropic API (primary LLM) + OpenAI API (embeddings + Whisper)**  
**Communications: Twilio (SMS + Voice)**  
**Monitoring: Sentry (self-hosted on Fly.io for HIPAA compliance)**

**Why Cloudflare as primary:**

| Criterion | Cloudflare | AWS | GCP | Azure |
|---|---|---|---|---|
| Edge latency (global patients) | Best-in-class (300+ PoPs) | Good | Good | Good |
| Cost at pilot scale | Lowest | Highest | Medium | Medium |
| HIPAA BAA availability | ✅ Available | ✅ | ✅ | ✅ |
| Zero-trust networking built-in | ✅ Native | Add-on | Add-on | Add-on |
| DDoS protection | ✅ Included | Paid add-on | Paid add-on | Paid add-on |
| Cold start latency (Workers) | <1ms | 100-500ms (Lambda) | Similar | Similar |
| Setup complexity for small team | Low | High | Medium | High |
| R2 storage (HIPAA eligible) | ✅ No egress fees | S3 (egress fees) | GCS | Blob |

**The critical advantage for a health companion app:** Cloudflare Workers run at the edge, meaning Pythia's responses reach Owen in <50ms regardless of where he is. For a companion that is supposed to feel present and alive, latency is a UX and clinical concern, not just a technical one.

**Why Supabase for the database:**
- Managed Postgres with Row Level Security — critical for multi-patient data isolation
- Built-in pgvector extension for document embeddings (eliminates a separate vector DB for pilot scale)
- Real-time subscriptions over WebSocket (NFB state changes propagate to all connected devices instantly)
- Point-in-time recovery, automated backups, HIPAA-eligible hosting on AWS infrastructure
- Open source — can be self-hosted if regulatory requirements demand it in specific geographies (Israel, Argentina)

### 4.2 Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        PATIENT DEVICE                       │
│   iOS Safari PWA (Phase A) / React Native App (Phase B)    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Forest  │  │ Pythia   │  │  NFB     │  │ HealthKit │  │
│  │   UI     │  │ Convers. │  │ Engine   │  │  Bridge   │  │
│  │ (Canvas) │  │ (LLM)    │  │(Bayesian)│  │(WKWebView)│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │               │        │
│  ┌────▼──────────────▼──────────────▼───────────────▼────┐  │
│  │              Zustand State Store (encrypted)          │  │
│  │              IndexedDB / MMKV (encrypted at rest)     │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │ TLS 1.3 + mTLS                  │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   CLOUDFLARE EDGE LAYER                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  WAF + DDoS  │  │  Rate Limit  │  │  Zero Trust      │  │
│  │  Protection  │  │  + Auth Gate │  │  Access (mTLS)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                  │                                 │
│  ┌──────▼──────────────────▼───────────────────────────┐    │
│  │              Cloudflare Workers (API Gateway)        │    │
│  │  /api/v1/conversation  (WebSocket → LLM stream)     │    │
│  │  /api/v1/nfb           (WebSocket → NFB updates)    │    │
│  │  /api/v1/ambient       (WebSocket → ambient engine) │    │
│  │  /api/v1/auth          (REST → WebAuthn)            │    │
│  │  /api/v1/careTeam      (REST → CRUD)                │    │
│  │  /api/v1/documents     (REST → upload/retrieve)     │    │
│  │  /api/v1/escalation    (REST + WS → Twilio)         │    │
│  └──────┬──────────────────────────────────────────────┘    │
│         │                                                    │
│  ┌──────▼────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Cloudflare   │  │  Cloudflare   │  │  Cloudflare KV  │  │
│  │  R2 Storage   │  │  D1 (SQLite)  │  │  (Session +     │  │
│  │  (Documents,  │  │  (Edge cache  │  │   Config Cache) │  │
│  │  Audio clips) │  │   for NFB)    │  │                 │  │
│  └───────────────┘  └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    BACKEND SERVICES                         │
│              (Fastify on Fly.io — HIPAA eligible)           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   NFB    │  │Converstn │  │ Ambient  │  │ Document  │  │
│  │  Engine  │  │ Module   │  │  Engine  │  │ Ingestion │  │
│  │(Bayesian │  │(LLM Orch)│  │(Audio AI)│  │(OCR+Embed)│  │
│  │+Rand.Fr.)│  │          │  │          │  │           │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │               │        │
│  ┌────▼──────────────▼──────────────▼───────────────▼────┐  │
│  │                    BullMQ Job Queue                   │  │
│  │              (Redis — Upstash for serverless)         │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │              Supabase (Postgres + pgvector)           │  │
│  │                                                       │  │
│  │  patients | nfb_events | conversations | documents   │  │
│  │  care_team | escalations | audit_log | embeddings    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
┌─────────────▼─────────┐    ┌─────────────▼─────────┐
│   EXTERNAL AI SERVICES │    │  EXTERNAL INTEGRATIONS │
│                        │    │                        │
│  Anthropic API (LLM)   │    │  Twilio (SMS + Voice)  │
│  OpenAI Whisper (STT)  │    │  FHIR R5 (Navigator)   │
│  OpenAI Embeddings     │    │  Therapeia Platform API │
│  ElevenLabs (TTS)      │    │  Apple APNs (Push)     │
│  AWS Textract (OCR)    │    │  Google FCM (Android)  │
└────────────────────────┘    └────────────────────────┘
```

---

## PART 5 — AUTHENTICATION & AUTHORIZATION

### 5.1 Authentication: WebAuthn / Passkey

No passwords. No usernames. No "forgot password" flow. No SMS OTP codes.

**Passkey authentication** (WebAuthn Level 2) using the device biometric (Face ID on iPhone, Fingerprint on Android) is the authentication mechanism for V4. This is not an ambitious choice — it is the correct choice for this patient population:

- A 68-year-old GBM patient should not be managing passwords
- Face ID / Touch ID is already familiar to most iPhone users
- Passkeys cannot be phished (they are origin-bound)
- If the device is lost, the passkey can be recovered via iCloud Keychain (iOS) or Google Password Manager (Android)
- WebAuthn is fully supported in Safari (iOS 16+), Chrome (Android), and all modern browsers

**Registration flow (first launch):**
```
1. Patient enters their name and confirms their email (for recovery only)
2. App calls navigator.credentials.create() → Face ID prompt appears
3. Public key credential stored on server (Supabase)
4. Private key stored in device Secure Enclave (never leaves device)
5. Session JWT issued (15-minute expiry, refresh token: 30 days)
```

**Daily login (subsequent launches):**
```
1. App opens → forest appears blurred with "Welcome back, Owen" overlay
2. Face ID prompt appears automatically (no button to find)
3. On success → forest unblurs, Pythia speaks
4. Total login interaction: 1 second, zero typing
```

**PHI access gate (additional biometric):**
Any action that transmits PHI to an external system (Navigator sync, Therapeia relay, document upload, emergency escalation) requires a **second biometric confirmation** at the moment of that specific action, not just at login. This is the HIPAA-aligned design decision from Feature Spec v3.0.

### 5.2 Authorization: Row-Level Security

All patient data in Supabase is protected by PostgreSQL Row Level Security (RLS). Every query is automatically scoped to the authenticated patient's ID. No query can return another patient's data, regardless of the application code.

```sql
-- Example RLS policy on nfb_events table
CREATE POLICY "patients_own_nfb_events"
ON nfb_events
FOR ALL
USING (patient_id = auth.uid());

-- No application code can bypass this — it's enforced at the database level
```

Staff access (Therapeia team, clinical supervisors) uses a separate `staff_roles` table with explicitly granted permissions. No staff member has broad table access.

---

## PART 6 — THE AMBIENT LISTENING ENGINE

*This section addresses the gap identified in the pre-Section-3 clarification. This is a new architectural component not present in V3.*

### 6.1 What Ambient Listening Is

Ambient listening is Pythia's ability to passively monitor the acoustic environment around the patient — not to record or store audio, but to extract clinically meaningful **metadata signals** from what is happening in the patient's environment.

This serves two purposes:
1. **Context enrichment:** When a caregiver administers medication, when a nurse checks vitals, when a family member visits — these events provide crucial context for NFB measurement interpretation
2. **Proactive initiation trigger:** Pythia detects when the patient has been alone and quiet for an extended period and determines whether to initiate a conversation

### 6.2 The Consent Architecture for Ambient Listening

**This feature requires explicit, separately-gated informed consent — distinct from the microphone consent for conversations.**

The consent must explain in plain language, at Pythia's voice level:

> *"Sometimes I notice things happening around you — a visitor arriving, someone helping you — that help me understand your day better. I never record or save what I hear. I only notice patterns, like whether you've had company today. Would you like me to pay attention this way?"*

Consent options:
- "Yes — notice what's around me" (ambient + conversation mic)
- "Only when I'm talking to you" (conversation mic only)
- "I'd rather you didn't" (no mic access)

All three paths fully supported. Clinical value degrades gracefully with each option.

### 6.3 Ambient Signal Processing Pipeline

The critical constraint: **no raw audio is ever stored, transmitted, or logged.** Only derived metadata features leave the on-device audio processing pipeline.

```
MICROPHONE (always-on, with consent)
    │
    ▼
ON-DEVICE AUDIO PROCESSOR (Web Audio API / AVAudioEngine)
    │
    ├── Voice Activity Detection (VAD)
    │   └── Is anyone speaking? (boolean)
    │       └── Is it the patient's voice? (speaker identification — on-device)
    │           └── Is it a third-party voice? (boolean)
    │
    ├── Acoustic Environment Classification
    │   └── Quiet / Conversation / Medical (monitor beeps, etc.) / TV/Radio / Outdoor
    │
    ├── Third-Party Voice Event Detection
    │   └── Detected keywords (local, no cloud): "medication", "time for your", 
    │       "how are you feeling", "need anything", "let me help you"
    │   └── Voice count: 1 (patient alone) / 2+ (company present)
    │
    └── Patient Voice Features (when patient speaks, with conversation consent)
        └── Cadence, energy, pause frequency, fundamental frequency
        └── These ARE clinical measurements → fed to NFB engine
        └── Raw audio NOT stored → features only

    ↓
AMBIENT EVENT LOG (on-device, encrypted)
    │
    Examples of what IS stored:
    │  { timestamp, event: "third_party_voice_detected", duration_minutes: 12 }
    │  { timestamp, event: "keyword_detected", keyword_class: "care_activity" }
    │  { timestamp, event: "patient_alone_extended", duration_hours: 3.5 }
    │  { timestamp, event: "quiet_environment", duration_hours: 2 }
    │
    Examples of what is NOT stored:
    │  ✗ Raw audio waveform
    │  ✗ Transcripts of third-party speech
    │  ✗ Identifiable voice recordings
    │
    ▼
NFB CONTEXT ENRICHMENT
    Ambient events annotate NFB measurements:
    "This cognition measurement occurred 20 minutes after a care activity"
    "Patient was alone for 6 hours before this emotional stability measurement"
```

### 6.4 Proactive Initiation Engine

Pythia does not wait passively to be tapped. She has her own decision engine for when to speak first.

```
PROACTIVE TRIGGER EVALUATION (runs every 15 minutes)

Inputs:
  - Time since last patient-initiated interaction
  - Time since last Pythia-initiated interaction
  - Current time of day
  - Ambient event log (alone? company? post-care?)
  - Medication schedule (any upcoming or missed?)
  - Apple Watch signals (significant movement? heart rate anomaly?)
  - Current NFB trend (deteriorating domains?)
  - Patient's PCCA profile (prefer proactive contact? attachment style?)

Decision logic (simplified):

IF time_since_interaction > 4 hours
  AND time_of_day is NOT sleep_window (22:00–07:00)
  AND patient_is_likely_awake (Watch accelerometer shows movement)
  THEN consider_initiation = true

IF consider_initiation == true:
  SELECT initiation_type FROM:
    - medication_reminder (if medication_due within 30 minutes)
    - post_care_checkin (if care_activity detected in last 60 min)
    - gentle_checkin (if alone extended period)
    - morning_greeting (if first interaction of the day)
    - movement_encouragement (if low motor domain + Watch shows inactivity)
    - weather_observation (lightweight, low-anxiety opener)

INITIATION DELIVERY:
  - PWA: Web Push notification → tap opens app to Pythia speaking
  - React Native: Local push notification → same result
  - If app already foregrounded: Pythia speaks without notification

ANTI-SPAM PROTECTION:
  Maximum 3 proactive initiations per 24-hour period
  Never initiate within 2 hours of a previous initiation
  Never initiate during patient-flagged quiet hours
  Patient can always say "not now" and initiation frequency reduces for 24h
```

### 6.5 Post-Care-Activity Interaction

When Pythia detects a care activity (third-party voice + care-class keyword), she waits a clinically appropriate interval (5–10 minutes after activity ends) then gently initiates:

> *"It sounds like someone was with you earlier. How are you feeling now?"*

This serves two clinical purposes:
1. Captures the patient's subjective state immediately post-care
2. Provides ground truth for correlating care activities with NFB domain changes

The care interaction is logged as a context event and becomes part of the patient's longitudinal profile.

---

## PART 7 — THE NFB ENGINE ARCHITECTURE

### 7.1 Design Principle Restated

Every patient is compared only against their own baseline. Population data is used exclusively for model calibration, validation, and governance. This is non-negotiable and architecturally enforced.

### 7.2 On-Device vs. Cloud Processing Split

```
ON-DEVICE (always, offline-capable):
  - Audio feature extraction (lightweight models <50MB)
  - IMU processing (Apple Watch accelerometer/gyroscope)
  - HealthKit data normalization
  - Local Bayesian state update (per-patient, prior from cloud calibration)
  - Deviation detection against personal baseline
  - Alert tier determination (Yellow/Orange)
  - Ambient signal classification

CLOUD (when connected, anonymized packets only):
  - Random Forest model update (population-level calibration)
  - Cohort threshold optimization
  - Escalation review (Red/Black tier — human-in-loop)
  - Cross-patient governance (anonymized, no PHI)
  - Model versioning and distribution
```

### 7.3 The Bayesian + Random Forest Pipeline

```
SIGNAL SOURCES
    │
    ├── Conversation features (LLM-extracted: semantics, latency, complexity)
    ├── Audio features (cadence, energy, pause frequency)
    ├── Apple Watch (HRV, sleep stages, activity, heart rate)
    ├── IMU (gait via Watch accelerometer)
    ├── Ambient events (context tags)
    └── Patient self-report (mood log, medication confirmation)
    │
    ▼
SIGNAL NORMALIZATION LAYER
    - Discretize continuous signals into clinically meaningful bins
      (e.g., HRV: Low / Normal / High for this patient's personal baseline)
    - Apply time-of-day normalization
    - Apply treatment-phase adjustment (active chemo → wider normal range)
    - Tag measurement context (post-care, alone, post-exercise)
    │
    ▼
ADAPTIVE BAYESIAN LAYER (on-device)
    For each domain d in {cognition, mood, motor, sleep, speech, daily, ...}:
      
      P(deviation | signals) = P(signals | deviation) × P(deviation) / P(signals)
      
      Where:
      - P(deviation) = prior from patient's own history (updated daily)
      - P(signals | deviation) = likelihood from personal baseline model
      - Population data updates P(signals | deviation) calibration ONLY
      - Result: posterior probability of meaningful deviation, per domain
    │
    ▼
RANDOM FOREST CLASSIFIER (on-device, model weights from cloud)
    Input: Feature vector [14 domain posteriors + context features]
    Output: 
      - Alert tier: {Green, Yellow, Orange, Red, Black}
      - Confidence score + confidence interval
      - Conformal prediction coverage guarantee
      - Out-of-distribution flag (is this patient's profile in training data?)
    │
    ▼
ALERT ENGINE
    │
    ├── Green → No action, forest flourishes
    ├── Yellow → Forest visual shift, Pythia message change, local log
    ├── Orange → Forest weather shifts, Pythia proactive initiation,
    │            anonymized packet to Therapeia [API_HOOK: THERAPEIA_OUTBOUND]
    ├── Red → Escalation to Navigator [API_HOOK: NAVIGATOR_INBOUND]
    └── Black → Emergency protocol [API_HOOK: EMERGENCY_SMS]
```

### 7.4 Baseline Establishment and Protection

The baseline is sacred. The NFB engine enforces:

**Contamination detection during baseline window (Days 1–14):**
- If patient reports feeling acutely unwell → session measurements flagged, weighted 0.1
- If ambient engine detects medical emergency sounds → session paused
- If conversation sentiment is extreme outlier (PHQ-9 equivalent surge) → session flagged
- Baseline does not complete until minimum uncontaminated data thresholds are met

**Baseline maturity levels:**
```
Level 0: No baseline (Days 0–2)        → Forest shows meadow only
Level 1: Preliminary (Days 3–6)        → First trees appear
Level 2: Developing (Days 7–11)        → Forest fills in
Level 3: Established (Days 12–14)      → Full forest, cave unlocks
Level 4: Calibrated (Days 30+)         → Alert precision increases
Level 5: Mature (Days 90+)             → Full ZFA architecture active
```

---

## PART 8 — DATA ARCHITECTURE

### 8.1 Database Schema (Supabase / Postgres)

```sql
-- Core patient table (minimal PHI)
CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name    TEXT NOT NULL,           -- "Owen" — not full legal name
  email_hash      TEXT UNIQUE,             -- SHA-256, for recovery only
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  pcca_profile    JSONB,                   -- Encrypted PCCA output
  baseline_level  INTEGER DEFAULT 0,       -- 0-5 maturity
  preferences     JSONB,                   -- Notification, TTS, font size
  consent_record  JSONB NOT NULL,          -- All consent decisions with timestamps
  device_platform TEXT,                    -- 'ios_pwa' | 'ios_native' | 'android'
  timezone        TEXT NOT NULL
);

-- NFB domain events (time-series)
CREATE TABLE nfb_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id),
  domain          TEXT NOT NULL,           -- 'cognition' | 'mood' | 'motor' | ...
  tier            INTEGER NOT NULL,        -- 1 or 2
  strength        FLOAT NOT NULL,          -- 0.0–1.0 (intra-individual)
  alert_level     TEXT NOT NULL,           -- 'green'|'yellow'|'orange'|'red'|'black'
  confidence      FLOAT NOT NULL,
  confidence_low  FLOAT NOT NULL,
  confidence_high FLOAT NOT NULL,
  ood_flag        BOOLEAN DEFAULT FALSE,   -- Out of distribution
  context_tags    JSONB,                   -- {time_of_day, post_care, alone, etc.}
  measurement_src TEXT NOT NULL,           -- 'conversation'|'watch'|'ambient'|'imu'
  recorded_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_nfb_patient_domain ON nfb_events(patient_id, domain, recorded_at DESC);

-- Conversation sessions
CREATE TABLE conversation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id),
  initiated_by    TEXT NOT NULL,           -- 'patient' | 'pythia'
  initiation_type TEXT,                    -- 'morning_greeting' | 'medication' | etc.
  duration_sec    INTEGER,
  turn_count      INTEGER,
  avg_patient_words_per_turn FLOAT,
  emotional_valence_start    FLOAT,
  emotional_valence_end      FLOAT,
  clinical_flags  JSONB,                   -- Extracted observations (not transcript)
  session_summary TEXT,                    -- LLM-compressed summary (not transcript)
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ
  -- Note: raw transcripts NOT stored in database
  -- They exist transiently in memory during session only
);

-- Ambient events
CREATE TABLE ambient_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id),
  event_type      TEXT NOT NULL,           -- 'care_activity'|'visitor'|'alone'|etc.
  duration_min    FLOAT,
  keyword_class   TEXT,                    -- 'medication'|'care'|'social' (no raw words)
  recorded_at     TIMESTAMPTZ NOT NULL
  -- Note: no audio, no transcript, no identifiable information
);

-- Care team
CREATE TABLE care_team (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id),
  role            TEXT NOT NULL,           -- 'primary_physician'|'specialist'|'emergency'
  name_encrypted  TEXT NOT NULL,           -- AES-256-GCM encrypted
  phone_encrypted TEXT,                    -- AES-256-GCM encrypted
  relationship    TEXT,                    -- For emergency contacts
  contact_method  TEXT,                    -- 'sms_first'|'call_first'|'both'
  sensitivity_mode BOOLEAN DEFAULT FALSE,
  confirmed       BOOLEAN DEFAULT FALSE,
  added_by        TEXT NOT NULL,           -- 'patient'|'pythia'|'caregiver'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation log (HIPAA audit trail)
CREATE TABLE escalation_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id),
  tier            TEXT NOT NULL,
  trigger_domains JSONB NOT NULL,
  action_taken    TEXT NOT NULL,
  patient_notified BOOLEAN,
  contact_notified BOOLEAN,
  navigator_notified BOOLEAN,
  outcome         TEXT,                    -- 'true_positive'|'false_positive'|'pending'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- HIPAA audit log (append-only, no updates or deletes)
CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  patient_id      UUID,
  actor_type      TEXT NOT NULL,           -- 'patient'|'system'|'clinician'|'admin'
  actor_id        UUID,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Audit log is append-only: no UPDATE or DELETE policies
CREATE POLICY "audit_log_insert_only" ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_log_no_delete" ON audit_log FOR DELETE USING (false);

-- Document store (metadata only — files in R2)
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id),
  doc_type        TEXT NOT NULL,           -- 'lab'|'imaging'|'prescription'|'discharge'
  original_name   TEXT,
  storage_key     TEXT NOT NULL,           -- R2 object key
  ocr_status      TEXT DEFAULT 'pending',
  extracted_text  TEXT,                    -- OCR output (encrypted)
  embedding_id    TEXT,                    -- pgvector reference
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Encryption at Rest

```
WHAT IS ENCRYPTED AND HOW:

Patient PHI fields (name, phone, email):
  → AES-256-GCM, key stored in Cloudflare KV (patient-specific)
  → Key derivation: patient's device credential + server salt
  → Key never stored unencrypted

NFB measurements:
  → Not considered direct PHI (no name/identifier attached to raw values)
  → Row-level security provides access control
  → Patient_id is a UUID with no externally meaningful value

Conversation summaries:
  → AES-256-GCM encrypted before database insert
  → Raw transcripts: never stored (exist in memory only during session)

Documents (R2 storage):
  → Client-side encryption before upload (AES-256-GCM)
  → Server-side encryption at rest (R2 default AES-256)
  → Double-encrypted: neither Cloudflare nor Therapeia can read documents
```

---

## PART 9 — PWA ARCHITECTURE (PHASE A)

### 9.1 Progressive Web App Requirements

For the PWA to be installable on iPhone and behave like a native app:

```json
// public/manifest.json
{
  "name": "Pythia · Your Living Forest",
  "short_name": "Pythia",
  "description": "Your personal neurological companion",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a1a06",
  "theme_color": "#0a1a06",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512",
      "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/forest.png", "sizes": "390x844", "type": "image/png",
      "form_factor": "narrow" }
  ]
}
```

**iOS PWA installation instruction for Owen:**
Safari → Share button → "Add to Home Screen" → "Add"
This appears as a standalone app with the forest icon. No App Store, no review.

### 9.2 Service Worker Strategy

```javascript
// Service worker cache strategy (Workbox)

// PRECACHE (at install): Core app shell
precacheAndRoute([
  '/',
  '/index.html',
  '/assets/fonts/EBGaramond-Italic.woff2',
  '/assets/fonts/Jost-Regular.woff2',
  '/assets/images/Pythia_in_the_forest.jpg',   // Compressed JPEG for PWA
  '/assets/images/the_cave_of_knowing.jpg',
  '/assets/audio/ambient_forest.mp3'            // Offline ambient sound
]);

// NETWORK FIRST with cache fallback: API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 3 })
);

// CACHE FIRST: Static assets (fonts, images)
registerRoute(
  ({ request }) => request.destination === 'image' || 
                   request.destination === 'font',
  new CacheFirst({ cacheName: 'static-assets', 
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 })] })
);

// BACKGROUND SYNC: Failed API calls (offline escalation queue)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/escalation'),
  new NetworkOnly({
    plugins: [new BackgroundSyncPlugin('escalation-queue', {
      maxRetentionTime: 24 * 60 // 24 hours — retry escalation when back online
    })]
  })
);
```

**Critical offline behavior:**
- Forest renders from cached image → ✅ Owen always sees his forest
- Pythia speaks from cached conversation context → ✅ Basic interaction works
- NFB engine runs locally → ✅ Domain tracking continues
- API calls queue for retry → ✅ No data loss
- Emergency escalation queues with background sync → ✅ Retried when connected

### 9.3 HealthKit Bridge (Swift WKWebView Wrapper)

This is the minimal native shell required for Apple Watch data access.

```swift
// PythiaApp.swift — approximately 200 lines total

import SwiftUI
import WebKit
import HealthKit

@main
struct PythiaApp: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}

struct ContentView: View {
  @StateObject private var healthKitBridge = HealthKitBridge()
  
  var body: some View {
    WebView(bridge: healthKitBridge)
      .ignoresSafeArea()
      .onAppear { healthKitBridge.requestPermissions() }
  }
}

class HealthKitBridge: ObservableObject {
  private let healthStore = HKHealthStore()
  
  // Types we read from Apple Watch
  let readTypes: Set<HKObjectType> = [
    HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
    HKObjectType.quantityType(forIdentifier: .heartRate)!,
    HKObjectType.quantityType(forIdentifier: .stepCount)!,
    HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
    HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
    HKObjectType.quantityType(forIdentifier: .restingHeartRate)!
  ]
  
  func requestPermissions() {
    healthStore.requestAuthorization(toShare: [], read: readTypes) { _, _ in }
  }
  
  // JavaScript bridge — called from PWA via window.webkit.messageHandlers
  func fetchTodayHealthData(completion: @escaping ([String: Any]) -> Void) {
    // Fetch last 24h of HealthKit data
    // Return as JSON to JavaScript layer
    // This is the ONLY data that crosses the bridge
  }
}

// WKWebView with message handler for JavaScript ↔ Swift communication
struct WebView: UIViewRepresentable {
  let bridge: HealthKitBridge
  
  func makeUIView(context: Context) -> WKWebView {
    let config = WKWebViewConfiguration()
    config.userContentController.add(context.coordinator, name: "healthkit")
    
    let webView = WKWebView(frame: .zero, configuration: config)
    webView.load(URLRequest(url: URL(string: "https://app.pythia.health")!))
    return webView
  }
}
```

**In the PWA JavaScript:**
```javascript
// [API_HOOK: HEALTHKIT_BRIDGE]
async function fetchAppleWatchData() {
  if (window.webkit?.messageHandlers?.healthkit) {
    // iOS with HealthKit bridge
    return new Promise(resolve => {
      window.healthKitCallback = resolve;
      window.webkit.messageHandlers.healthkit.postMessage({ action: 'fetchToday' });
    });
  } else if (navigator.permissions && 'health' in navigator) {
    // Future Web Health API (Android Chrome experiment)
    // PRODUCTION: implement when available
    return null;
  } else {
    // Android without HealthKit — use manual entry or Google Fit (Phase B)
    return null;
  }
}
```

**Android health data (Phase B):**
React Native with `expo-health` wraps Google Health Connect (Android 14+) using an identical JavaScript interface. The PWA code above gracefully degrades to null on Android until Phase B.

---

## PART 10 — REAL-TIME COMMUNICATION

### 10.1 WebSocket Architecture

All real-time communication uses WebSocket connections managed through Cloudflare Durable Objects (stateful WebSocket handlers at the edge).

```
Patient Device ←──WebSocket──→ Cloudflare Durable Object (per patient)
                                      │
                              ┌───────┼────────┐
                              │       │        │
                          NFB Engine Conversation Ambient
                          Updates    Stream    Events
                              │       │        │
                              └───────┼────────┘
                                      │
                              Backend Services (Fly.io)
```

**Connection lifecycle:**
```javascript
// client-side WebSocket manager
class PythiaConnection {
  private ws: WebSocket;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  
  connect(patientId: string, authToken: string) {
    this.ws = new WebSocket(
      `wss://ws.pythia.health/v1/stream/${patientId}?token=${authToken}`
    );
    
    this.ws.onclose = () => this.scheduleReconnect();
    this.ws.onerror = () => this.handleOfflineMode();
    this.ws.onmessage = (event) => this.routeMessage(JSON.parse(event.data));
  }
  
  private handleOfflineMode() {
    // NFB engine continues locally
    // Forest continues rendering from local state
    // Queue messages for when connection restores
    connectionStore.setState({ therapeia: 'offline' });
  }
  
  private scheduleReconnect() {
    setTimeout(() => this.connect(...), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
```

---

## PART 11 — DOCUMENT INGESTION PIPELINE

### 11.1 Capture Methods

```
CAPTURE PATH 1: Camera (most common for elderly patients)
  Patient taps document icon → Camera UI opens
  Patient photographs medical document
  Client-side: image compression (max 2MB), orientation correction
  Client-side: AES-256-GCM encryption before upload
  Upload to Cloudflare R2 → OCR job queued

CAPTURE PATH 2: File upload (PDF, JPG, PNG, DOCX)
  Standard file picker → same encryption + upload path

CAPTURE PATH 3: Pythia-initiated capture
  Pythia: "Would you like to show me your latest scan results?
           I can read them and keep them safe."
  Patient confirms → camera opens
```

### 11.2 Processing Pipeline

```
R2 Upload
    │
    ▼
BullMQ Job Queue
    │
    ▼
OCR Worker (AWS Textract — HIPAA eligible)
    │ Extracts text from image/PDF
    ▼
Medical NLP (LLM-based extraction)
    │ Identifies: medications, diagnoses, dates, dosages, 
    │             physician names, test values, imaging findings
    ▼
Structured Data Store (Postgres — encrypted)
    │
    ▼
Embedding Generation (text-embedding-3-large)
    │
    ▼
pgvector Store (Supabase)
    │
    ▼
AVAILABLE FOR:
  ├── Pythia: "What did my last MRI say?" → RAG retrieval
  ├── Navigator: Full document visible to physician (with consent)
  └── Therapeia: Anonymized structured data for population analytics
```

---

## PART 12 — ENVIRONMENT CONFIGURATION

```bash
# .env.production (never committed to git)

# API
VITE_API_URL=https://api.pythia.health
VITE_WS_URL=wss://ws.pythia.health

# Cloudflare
CF_ACCOUNT_ID=xxx
CF_API_TOKEN=xxx
CF_R2_BUCKET_NAME=pythia-documents-prod
CF_KV_NAMESPACE_ID=xxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx              # Public — safe in client
SUPABASE_SERVICE_KEY=xxx           # Private — backend only, never in client

# AI Services
ANTHROPIC_API_KEY=xxx              # Backend only
OPENAI_API_KEY=xxx                 # Backend only (Whisper + embeddings)
ELEVENLABS_API_KEY=xxx             # Backend only (TTS)

# Communications
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1xxx

# Monitoring
SENTRY_DSN=xxx                     # Self-hosted Sentry instance

# Encryption
MASTER_KEY_ID=xxx                  # Cloudflare KMS reference
```

---

## PART 13 — CROSS-PLATFORM COMPATIBILITY MATRIX

| Feature | iOS PWA (Phase A) | iOS Native (Phase B) | Android Native (Phase B) |
|---|---|---|---|
| Forest UI | ✅ Full | ✅ Full | ✅ Full |
| Pythia conversation (LLM) | ✅ Full | ✅ Full | ✅ Full |
| Voice input (STT) | ✅ Web Speech API | ✅ AVSpeechRecognizer | ✅ SpeechRecognizer API |
| Voice output (TTS) | ✅ Web Speech API | ✅ AVSpeechSynthesizer | ✅ TextToSpeech |
| Push notifications | ✅ Web Push (iOS 16.4+) | ✅ APNs | ✅ FCM |
| Biometric auth | ✅ WebAuthn Face ID | ✅ Face ID native | ✅ Biometric API |
| Apple Watch / HealthKit | ✅ via Swift bridge | ✅ Native | ❌ N/A |
| Google Health Connect | ❌ N/A | ❌ N/A | ✅ Phase B |
| Bluetooth BLE (peripherals) | ⚠️ Limited iOS Safari | ✅ CoreBluetooth | ✅ Android BLE |
| Camera (documents) | ✅ MediaDevices API | ✅ Native | ✅ Native |
| Offline NFB engine | ✅ Service Worker | ✅ Background tasks | ✅ Background tasks |
| Ambient listening | ✅ Web Audio API | ✅ AVAudioEngine | ✅ AudioRecord |
| Eye tracking (future) | ⚠️ WebGazer (limited) | ✅ ARKit | ✅ MLKit |
| Haptic feedback | ✅ Vibration API | ✅ UIFeedbackGenerator | ✅ Vibrator API |
| Encrypted local storage | ✅ IndexedDB + WebCrypto | ✅ MMKV + Keychain | ✅ MMKV + Keystore |

**Legend: ✅ Full support · ⚠️ Partial/limited · ❌ Not applicable**

---

## SECTION 3 — SUMMARY

### Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Phase A frontend | React 18 + Vite PWA | Fastest path to Owen; migrates to RN |
| Phase B frontend | React Native + Expo | Single codebase iOS + Android |
| Backend | Fastify modular monolith on Fly.io | Right-sized for pilot, extractable later |
| Cloud primary | Cloudflare Workers + R2 + KV | Edge latency, cost, built-in security |
| Database | Supabase (Postgres + pgvector) | RLS, managed, open-source, HIPAA-eligible |
| Authentication | WebAuthn / Passkey | No passwords, biometric, HIPAA-aligned |
| Health data | HealthKit (iOS) + Health Connect (Android) | Platform-native, most accurate |
| Ambient engine | On-device Web Audio API | No raw audio leaves device ever |
| LLM | Anthropic Claude (primary) | Best conversational quality for sensitive context |
| STT | OpenAI Whisper | Most accurate, HIPAA BAA available |
| TTS | ElevenLabs / Web Speech API fallback | Warm voice quality critical for Pythia |
| OCR | AWS Textract | HIPAA eligible, highest medical document accuracy |
| Embeddings | OpenAI text-embedding-3-large | Best semantic search for medical text |
| Communications | Twilio | Industry standard, HIPAA BAA available |
| Encryption | AES-256-GCM everywhere | At rest, in transit, client-side before upload |

---

## APPROVED — READY FOR SECTION 4

**Board recommendation:** Section 3 complete. Proceed to  
**Section 4 — AI & Machine Learning Architecture**  
covering: complete LLM prompt architecture, STT/TTS pipeline, Bayesian + Random Forest  
implementation specification, conversation memory system, PCCA extraction engine,  
and the ambient signal classification models.

*Awaiting Ron's approval.*
