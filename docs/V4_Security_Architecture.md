# PYTHIA FIELD — SECURITY ARCHITECTURE
## Section 5: Complete Security, Privacy & Compliance Specification
### 32-Member Specialist Board · Approved Specification

**Date:** May 2026  
**Scope:** HIPAA · GDPR · LGPD · Multi-region data residency · Zero-trust ·  
Encryption · Key management · Audit logging · Breach response  
**Governing principle:** Security is not a feature added to Pythia.  
Security IS Pythia. A patient who cannot trust that their most intimate  
neurological data is safe will not use the platform — and that is a clinical failure.

---

## PART 1 — THE DATA RESIDENCY ARCHITECTURE

### 1.1 The Problem We Are Solving

Every country where Pythia operates may have different rules about where patient data can physically live. Some require it stays within their borders. Some allow transfer with adequate safeguards. Some are still evolving their position.

Building a separate infrastructure for each country is not viable. Patching residency requirements onto a single-region architecture every time Pythia expands is not viable either.

**The solution: Tenant-Region Routing (TRR)**

Every patient is assigned a **data residency zone** at the moment of account creation. All their data — storage, database records, processing, backups — lives and stays within that zone. Adding a new country means adding a new zone configuration. No code changes. No data migration. No architectural rework.

### 1.2 Zone Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   ZONE REGISTRY (Global Control Plane)          │
│              Cloudflare Workers KV — zone metadata only         │
│                                                                 │
│  patient_id → zone_id mapping (no PHI, just routing key)       │
│  zone_id    → infrastructure endpoints for that zone           │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Routes every request to correct zone
         │
    ┌────┴────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
┌───────────────┐                    ┌────────────────┐
│  ZONE: US     │                    │  ZONE: EU      │
│               │                    │                │
│ Supabase US   │                    │ Supabase EU    │
│ (AWS us-east) │                    │ (AWS eu-west)  │
│ R2 US region  │                    │ R2 EU region   │
│ Workers US    │                    │ Workers EU     │
│ KMS US keys   │                    │ KMS EU keys    │
└───────────────┘                    └────────────────┘
         │                                    │
    ┌────┴──────┐                    ┌────────┴──────┐
    ▼           ▼                    ▼               ▼
┌────────┐ ┌────────┐          ┌─────────┐    ┌──────────┐
│ZONE:   │ │ZONE:   │          │ZONE:    │    │ZONE:     │
│BRAZIL  │ │ISRAEL  │          │ARGENTINA│    │[FUTURE]  │
│        │ │        │          │         │    │          │
│AWS     │ │AWS     │          │AWS      │    │AWS/GCP   │
│sa-east │ │il-cent │          │sa-east  │    │[region]  │
│(São    │ │(Tel    │          │(São     │    │          │
│Paulo)  │ │Aviv)   │          │Paulo or │    │          │
│        │ │        │          │US with  │    │          │
│        │ │        │          │SCCs*)   │    │          │
└────────┘ └────────┘          └─────────┘    └──────────┘

* Standard Contractual Clauses — Argentina PDPA allows international
  transfer with adequate safeguards. No hard residency requirement.
  Brazil LGPD: São Paulo region used for future-proofing.
  Israel PPPA: EU adequacy decision — EU zone works OR IL zone.
```

### 1.3 Zone Assignment at Onboarding

```typescript
// [SECURITY_HOOK: ZONE_ASSIGNMENT]
// Called once at patient registration — never changes

async function assignDataResidencyZone(
  deviceLocale: string,      // e.g., "en-US", "pt-BR", "he-IL"
  ipCountry: string,         // Cloudflare CF-IPCountry header
  patientDeclaredCountry?: string  // Optional — patient confirms
): Promise<ZoneId> {

  // Patient-declared country takes precedence (patient right to choose)
  const country = patientDeclaredCountry 
    ?? mapLocaleToCountry(deviceLocale) 
    ?? ipCountry;

  const zoneMap: Record<string, ZoneId> = {
    'US': 'zone-us',
    'CA': 'zone-us',      // Canada — PIPEDA, US zone adequate
    'AR': 'zone-us',      // Argentina — PDPA allows, US zone with SCCs
    'IL': 'zone-eu',      // Israel — EU adequacy decision
    'BR': 'zone-brazil',  // Brazil — LGPD, local preferred
    'DE': 'zone-eu',      // Germany — GDPR
    'FR': 'zone-eu',      // France — GDPR
    // ... all EU: zone-eu
    // ... default: zone-us with SCCs
  };

  const zoneId = zoneMap[country] ?? 'zone-us';

  // Store routing key (no PHI) in global KV
  await globalKV.set(`patient:${patientId}:zone`, zoneId);

  // All subsequent requests auto-route to assigned zone
  return zoneId;
}
```

### 1.4 Cross-Zone Rules

```
WHAT NEVER CROSSES ZONES:
  ✗ Raw PHI (names, health data, conversations)
  ✗ Encryption keys
  ✗ Document content
  ✗ NFB measurements linked to a patient

WHAT CAN CROSS ZONES (anonymized):
  ✓ Aggregated population statistics (no patient ID)
  ✓ Model weight updates (contain no patient data)
  ✓ System health metrics (latency, error rates)
  ✓ Zone routing keys (UUID only, no PHI)

LEGAL BASIS FOR CROSS-ZONE OPERATIONS:
  Therapeia (US HQ) → receives only anonymized cohort data
  Standard Contractual Clauses (SCCs) executed for EU→US transfers
  PDPA Article 12 adequacy assessment for Argentina→US transfers
  Data Processing Agreements with all cloud providers
```

---

## PART 2 — ENCRYPTION ARCHITECTURE

### 2.1 The Encryption Stack

```
LAYER 1: TRANSPORT ENCRYPTION
═══════════════════════════════
Protocol: TLS 1.3 minimum (TLS 1.2 rejected)
Certificate: Let's Encrypt with 90-day rotation (automated)
HSTS: max-age=31536000; includeSubDomains; preload
Certificate Transparency: enforced
HPKP: not used (deprecated, fragile)

Post-quantum readiness:
  Cloudflare has enabled X25519Kyber768 hybrid key exchange
  on all Workers endpoints — already protecting against
  harvest-now-decrypt-later attacks on patient data.


LAYER 2: AT-REST ENCRYPTION (Database)
════════════════════════════════════════
Supabase: AES-256 at the storage layer (provider-managed)
Application layer: AES-256-GCM on all PHI fields BEFORE 
  database insert (defense in depth — even if DB is breached,
  PHI is unreadable without application-layer key)

Column-level encryption on:
  patients.display_name
  patients.pcca_profile
  care_team.name_encrypted
  care_team.phone_encrypted
  conversation_sessions.session_summary
  documents.extracted_text
  nfb_events (patient_id pseudonymized via UUID, no direct PHI)


LAYER 3: AT-REST ENCRYPTION (Object Storage — R2)
════════════════════════════════════════════════════
Client-side encryption BEFORE upload:
  Patient documents encrypted on device before leaving device
  Cloudflare R2 applies additional server-side AES-256
  Result: double-encrypted — neither Cloudflare nor any
  breach of R2 exposes readable patient documents

Encryption on device (WebCrypto API):
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    patientCredential,  // Derived from WebAuthn assertion
    { name: 'AES-GCM', length: 256 },
    false,  // Key not extractable from device
    ['encrypt', 'decrypt']
  );


LAYER 4: AT-REST ENCRYPTION (Device Storage)
═══════════════════════════════════════════════
IndexedDB content: AES-256-GCM (WebCrypto, device-derived key)
localStorage: AES-256-GCM (same key)
Key storage: Web Crypto API with non-extractable key flag
  → Key lives in browser's protected key store
  → On iOS: bridges to iOS Keychain via WebKit
  → Key destroyed on explicit logout (not on browser clear)


LAYER 5: KEY MANAGEMENT
════════════════════════
Architecture: Envelope encryption

  Data Encryption Key (DEK):
    - AES-256, unique per patient
    - Encrypts all PHI for that patient
    - Stored encrypted in Supabase

  Key Encryption Key (KEK):
    - AES-256, managed by Cloudflare KMS
    - Encrypts the DEK
    - Never stored alongside data
    - Rotated every 365 days (automated)

  Patient Credential Factor:
    - Derived from WebAuthn assertion (biometric)
    - Required to decrypt DEK on device
    - Never transmitted to server

  Result: 3-layer key hierarchy
    Patient biometric → unlocks DEK → unlocks PHI
    If patient loses device: DEK recoverable via 
    account recovery flow (biometric on new device + 
    identity verification)

  Key rotation: Annual for KEK, on-demand for DEK
  (DEK rotated if security event detected)
```

### 2.2 Encryption Decision Matrix

| Data Type | In Transit | At Rest (DB) | At Rest (Device) | At Rest (R2) |
|---|---|---|---|---|
| Patient name | TLS 1.3 | AES-256-GCM | AES-256-GCM | N/A |
| PCCA profile | TLS 1.3 | AES-256-GCM | AES-256-GCM | N/A |
| NFB measurements | TLS 1.3 | AES-256 (pseudonymized) | AES-256-GCM | N/A |
| Conversation summary | TLS 1.3 | AES-256-GCM | AES-256-GCM | N/A |
| Raw conversation | Never transmitted | Never stored | Session memory only | N/A |
| Care team data | TLS 1.3 | AES-256-GCM | AES-256-GCM | N/A |
| Medical documents | TLS 1.3 + client-side | N/A | AES-256-GCM | AES-256 (double) |
| Audio features | TLS 1.3 | AES-256 | Never stored raw | N/A |
| Raw audio | Never transmitted | Never stored | Never stored | Never stored |
| Ambient events | TLS 1.3 | AES-256 (pseudonymized) | AES-256-GCM | N/A |
| Audit logs | TLS 1.3 | AES-256 | N/A | N/A |
| Encryption keys | Never transmitted | Encrypted (KEK) | Non-extractable | N/A |

---

## PART 3 — ZERO-TRUST NETWORK ARCHITECTURE

### 3.1 Zero-Trust Principles Applied

Zero-trust means: **never trust, always verify.** No request is trusted because of where it comes from. Every request must prove who it is, what it's authorized to do, and that it hasn't been tampered with.

```
┌─────────────────────────────────────────────────────────────┐
│                  ZERO-TRUST ENFORCEMENT POINTS              │
│                                                             │
│  1. PATIENT → CLOUDFLARE EDGE                              │
│     - TLS 1.3 + certificate pinning (Phase B native)       │
│     - WebAuthn JWT validation at edge                      │
│     - Rate limiting per patient_id                         │
│     - DDoS protection (Cloudflare Magic Transit)           │
│     - Bot detection (Cloudflare Bot Management)            │
│                                                             │
│  2. CLOUDFLARE EDGE → BACKEND (Fly.io)                     │
│     - Mutual TLS (mTLS) — both sides present certificates  │
│     - Cloudflare Tunnel (no public backend IP exposed)     │
│     - Backend IP never resolvable from public internet     │
│     - Request signing (HMAC-SHA256 per request)            │
│                                                             │
│  3. BACKEND → DATABASE (Supabase)                          │
│     - Connection string never in code (env secrets only)   │
│     - Supabase Row Level Security (RLS) — DB-enforced     │
│     - Connection pooling via PgBouncer (Supabase managed)  │
│     - IP allowlist: only Fly.io egress IPs                 │
│                                                             │
│  4. BACKEND → EXTERNAL AI SERVICES                         │
│     - API keys stored in Fly.io secrets (never in code)    │
│     - Per-request patient_id removed before sending to LLM │
│     - PHI stripped from all LLM prompts (replaced with     │
│       pseudonyms: "Patient A" not "Owen Jerez")            │
│     - Responses validated before use                       │
│                                                             │
│  5. BACKEND → R2 STORAGE                                   │
│     - Pre-signed URLs (time-limited, patient-scoped)       │
│     - Direct upload from device (bypasses backend)         │
│     - Backend never reads raw document content             │
│       (OCR service reads, extracts text, backend gets text)│
│                                                             │
│  6. STAFF ACCESS (Therapeia team)                          │
│     - Cloudflare Access (ZTNA) — no VPN                    │
│     - Identity: SSO + hardware MFA (FIDO2 key required)    │
│     - Session: 8-hour maximum, no persistent sessions      │
│     - Access logged: every query, every resource accessed  │
│     - Principle of least privilege: role-based, not broad  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 PHI De-identification Before LLM

This is one of the most important security decisions in the architecture. Every LLM request could potentially contain PHI if not carefully sanitized.

```typescript
// [SECURITY_HOOK: PHI_SANITIZER]
// Runs BEFORE every LLM API call

class PHISanitizer {
  
  sanitize(prompt: string, patient: Patient): SanitizedPrompt {
    // Replace real name with consistent pseudonym
    const pseudonym = this.getSessionPseudonym(patient.id);
    // "Owen" → "the patient" or "Patient A"
    // Never the real name in LLM API calls
    
    let sanitized = prompt
      .replace(new RegExp(patient.displayName, 'gi'), pseudonym)
      .replace(patient.emailHash, '[REDACTED]');
    
    // Replace care team names
    for (const member of patient.careTeam) {
      sanitized = sanitized.replace(
        new RegExp(member.name, 'gi'), 
        `[${member.role}]`
      );
    }
    
    // Replace specific medical identifiers
    sanitized = sanitized
      .replace(/\b\d{10}\b/g, '[PHONE]')        // Phone numbers
      .replace(/\b[A-Z]\d{6,}\b/g, '[MRN]')     // Medical record numbers
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]'); // SSN
    
    return {
      sanitizedPrompt: sanitized,
      pseudonym,
      reversalMap: this.buildReversalMap(patient, pseudonym)
    };
  }
  
  // After LLM response: restore pseudonyms to real names for display
  restore(response: string, reversalMap: ReversalMap): string {
    return response.replace(reversalMap.pseudonym, reversalMap.realName);
  }
}
```

---

## PART 4 — HIPAA TECHNICAL SAFEGUARDS

### 4.1 Required Technical Safeguards Checklist

HIPAA Security Rule (45 CFR § 164.312) requires the following technical safeguards. Status for V4:

```
ACCESS CONTROLS (§ 164.312(a))
  ✅ Unique user identification: UUID per patient, no shared accounts
  ✅ Emergency access procedure: documented (see Part 9)
  ✅ Automatic logoff: 30-minute inactivity → re-authentication required
  ✅ Encryption and decryption: AES-256-GCM (see Part 2)

AUDIT CONTROLS (§ 164.312(b))
  ✅ Hardware/software activity monitoring: Sentry + audit_log table
  ✅ Immutable audit log: append-only Postgres table (no UPDATE/DELETE)
  ✅ Log retention: 7 years (HIPAA minimum: 6 years)
  ✅ Log review: weekly automated anomaly detection + monthly human review

INTEGRITY CONTROLS (§ 164.312(c))
  ✅ PHI alteration detection: database row versioning (pg_audit)
  ✅ Transmission integrity: TLS + HMAC per request
  ✅ Storage integrity: AES-GCM authentication tag validates data

PERSON/ENTITY AUTHENTICATION (§ 164.312(d))
  ✅ WebAuthn / Passkey biometric authentication
  ✅ Session tokens: JWT, 15-minute expiry, RS256 signed
  ✅ Refresh token: 30-day rolling, rotated on each use
  ✅ Biometric re-auth for PHI-sharing actions

TRANSMISSION SECURITY (§ 164.312(e))
  ✅ TLS 1.3 on all connections
  ✅ Certificate pinning (Phase B native apps)
  ✅ Post-quantum key exchange (Cloudflare default)
  ✅ No PHI in URL parameters (always in body, never in GET query strings)
  ✅ No PHI in logs (scrubbed before log entry)
```

### 4.2 Business Associate Agreements Required

Before Patient Zero uses the system with real data:

| Vendor | Service | BAA Status | Priority |
|---|---|---|---|
| Cloudflare | Workers, R2, KV, DNS | ✅ Available (Enterprise) | BLOCKER |
| Supabase | Postgres database | ✅ Available (Business+) | BLOCKER |
| Anthropic | Claude LLM API | ✅ Available | BLOCKER |
| OpenAI | Whisper STT, Embeddings | ✅ Available | BLOCKER |
| ElevenLabs | TTS voice | ⚠️ Check current status | BLOCKER |
| Twilio | SMS, Voice calls | ✅ Available | BLOCKER |
| AWS | Textract OCR | ✅ Available | BLOCKER |
| Fly.io | Backend hosting | ✅ Available | BLOCKER |
| Sentry (self-hosted) | Error monitoring | ✅ Self-hosted = no BAA needed | — |
| Upstash | Redis/BullMQ | ⚠️ Check current status | HIGH |

**Rule:** If a BAA is not signed, the vendor does not receive PHI. Period.

### 4.3 Minimum Necessary Standard

HIPAA requires that PHI is accessed only to the minimum extent necessary for the purpose.

```
IMPLEMENTED AS:

1. LLM calls: PHI stripped/pseudonymized before transmission (Part 3.2)

2. Database queries: RLS enforces patient_id scoping on every query
   No query can return more than one patient's data

3. Staff access: Role-based, function-specific
   Clinical reviewer → can see anonymized flagged conversations only
   Operations staff → can see system metrics, no PHI
   Security team → can see audit logs, no PHI content
   No one → has unrestricted PHI access

4. OCR pipeline: Document sent to Textract, text returned
   Textract result cached briefly, then document deleted from OCR queue
   Raw document never stored on backend — lives in R2 only

5. Emergency contact calls: Twilio receives phone number + script only
   No medical details in Twilio call data
   Clinical summary read by Pythia's voice, not stored in Twilio
```

### 4.4 Audit Log Specification

Every security-relevant event is written to the `audit_log` table. This table is **append-only** (enforced at database level) and **immutable** (no UPDATE, no DELETE, ever).

```sql
-- Complete audit log schema
CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  
  -- Who
  patient_id      UUID,            -- NULL for system events
  actor_type      TEXT NOT NULL    -- 'patient'|'pythia'|'system'|
                                   -- 'clinician'|'admin'|'emergency'
  actor_id        UUID,
  
  -- What
  action          TEXT NOT NULL,   -- Structured action codes (below)
  resource_type   TEXT NOT NULL,   -- 'nfb_event'|'conversation'|
                                   -- 'document'|'care_team'|'phi'
  resource_id     UUID,
  
  -- Detail
  action_detail   JSONB,           -- Action-specific context (no PHI)
  outcome         TEXT,            -- 'success'|'failure'|'denied'
  
  -- Context
  zone_id         TEXT NOT NULL,   -- Data residency zone
  ip_address      INET,
  user_agent      TEXT,
  request_id      UUID,            -- Correlates to API request
  
  -- When
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only enforcement
CREATE POLICY "audit_insert_only" ON audit_log 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_no_update" ON audit_log 
  FOR UPDATE USING (false);
CREATE POLICY "audit_no_delete" ON audit_log 
  FOR DELETE USING (false);

-- Index for efficient querying
CREATE INDEX idx_audit_patient ON audit_log(patient_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);
```

**Mandatory audit events:**

```
AUTH:
  auth.login_success         auth.login_failure
  auth.biometric_verified    auth.session_expired
  auth.logout                auth.recovery_initiated

PHI_ACCESS:
  phi.nfb_read               phi.conversation_read
  phi.document_read          phi.care_team_read
  phi.export_requested       phi.export_completed

PHI_MODIFICATION:
  phi.care_team_updated      phi.consent_updated
  phi.document_uploaded      phi.document_deleted

ESCALATION:
  escalation.yellow_fired    escalation.orange_fired
  escalation.red_fired       escalation.black_fired
  escalation.911_called      escalation.contact_called
  escalation.navigator_notified

AGENTIC_ACTIONS:
  agent.pharmacy_called      agent.appointment_set
  agent.medication_logged    agent.document_explained

CONSENT:
  consent.microphone_granted     consent.microphone_denied
  consent.ambient_granted        consent.ambient_denied
  consent.navigator_granted      consent.navigator_revoked
  consent.data_deletion_requested

SECURITY:
  security.failed_auth_5x    security.unusual_location
  security.key_rotation      security.baa_verified
```

---

## PART 5 — GDPR COMPLIANCE (EU + GDPR-ALIGNED JURISDICTIONS)

### 5.1 Lawful Basis for Processing

```
DATA CATEGORY          LAWFUL BASIS           ARTICLE
─────────────────────────────────────────────────────────
Health data (NFB)      Explicit consent       Art. 9(2)(a)
                       + Vital interests      Art. 9(2)(c)
Conversation data      Explicit consent       Art. 9(2)(a)
Care team data         Vital interests        Art. 9(2)(c)
Ambient events         Explicit consent       Art. 9(2)(a)
Audit logs             Legal obligation       Art. 6(1)(c)
Anonymized research    Scientific research    Art. 9(2)(j)
```

### 5.2 Data Subject Rights Implementation

```
RIGHT TO ACCESS (Art. 15):
  Patient taps: Settings → My Data → Download My Data
  System assembles: all NFB history, care team, conversation
    summaries, ambient events, consent record, audit log
  Delivered as: encrypted ZIP, password delivered separately
  Timeframe: 30 days (automated, typically <24 hours)

RIGHT TO ERASURE (Art. 17 — "Right to be Forgotten"):
  Patient taps: Settings → My Data → Delete Everything
  Pythia says: "I want to make sure you understand — if I 
    forget everything, I won't be able to continue watching 
    over your forest. Are you sure?"
  On confirm + biometric:
    1. All PHI deleted from database (cascade)
    2. Documents deleted from R2
    3. Device storage wiped
    4. Encryption keys destroyed (data unrecoverable)
    5. Audit log RETAINED (legal obligation — pseudonymized)
    6. Anonymized NFB measurements RETAINED in Therapeia
       (no longer linked to patient — true anonymization)
  Timeframe: 72 hours maximum
  Confirmation: Email to registered address

RIGHT TO PORTABILITY (Art. 20):
  Same as Right to Access — data delivered in JSON format
  (machine-readable, structured, documented schema)

RIGHT TO RESTRICTION (Art. 18):
  Patient can pause data processing without deletion
  Forest continues rendering from device-only data
  No new data transmitted to backend
  Settings → My Data → Pause Data Sharing

RIGHT TO OBJECT (Art. 21):
  Patient can object to research use of anonymized data
  Toggle: Settings → My Data → Research Contribution → Off
  Anonymized data already in Therapeia: pseudonym removed
  Future data: excluded from cohort

DATA PROTECTION OFFICER:
  Required if processing health data at scale in EU
  Appointed before EU market launch
  Contact: dpo@therapeia.health (published in privacy policy)
```

### 5.3 Consent Architecture

```typescript
// Consent is never bundled. Each processing purpose has 
// its own explicit consent, stored with timestamp and version.

interface ConsentRecord {
  patient_id: string;
  consents: {
    
    // Core functionality — required
    core_monitoring: ConsentEntry;         // NFB baseline construction
    
    // Communication — required for core feature
    microphone_conversation: ConsentEntry; // Pythia conversation
    
    // Enhanced monitoring — optional
    ambient_listening: ConsentEntry;       // Background acoustic monitoring
    
    // Integration — optional
    navigator_sharing: ConsentEntry;       // Doctor data sharing
    therapeia_research: ConsentEntry;      // Anonymized cohort
    
    // Emergency — strongly recommended, optional
    emergency_contact_calls: ConsentEntry; // Twilio emergency calls
    emergency_911: ConsentEntry;           // Autonomous 911 calls
    
    // Health data — optional but reduces capability
    healthkit_read: ConsentEntry;          // Apple Watch data
    
  };
}

interface ConsentEntry {
  granted: boolean;
  granted_at: Date | null;
  revoked_at: Date | null;
  version: string;           // Privacy policy version at time of consent
  method: 'explicit_tap' | 'verbal_confirmed' | 'biometric';
  ip_address: string;
  device_fingerprint: string;
}

// Consent changes are append-only — full history preserved
// Required for GDPR audit trail
```

---

## PART 6 — LGPD COMPLIANCE (BRAZIL)

### 6.1 LGPD Key Requirements

Brazil's Lei Geral de Proteção de Dados (LGPD) is structurally similar to GDPR with local variations:

```
DATA CONTROLLER: Therapeia AI, Inc. (US entity)
  → Must appoint Brazilian Data Protection Officer (DPO)
  → Must publish in Portuguese

DATA PROCESSOR: Cloudflare (Brazil zone — sa-east-1 region)

SENSITIVE DATA (Article 11):
  Health data is "sensitive personal data" under LGPD
  Requires explicit consent (same as GDPR Art. 9)
  Higher bar: purpose must be stated with specificity

NATIONAL AUTHORITY: ANPD (Autoridade Nacional de Proteção de Dados)
  Breach notification: 72 hours to ANPD

DATA LOCALIZATION:
  LGPD does not mandate local storage currently
  BUT: political pressure exists for health data
  Brazil zone pre-built: sa-east-1 (São Paulo)
  If ANPD issues residency guidance: flip Brazil patients to Brazil zone
  Zero code change required — TRR handles it

PORTUGUESE LANGUAGE:
  All consent language, privacy policy, and data rights
  exercised in Brazilian Portuguese for Brazilian patients
  Pythia speaks Brazilian Portuguese natively (Whisper + ElevenLabs)
```

---

## PART 7 — ARGENTINA & ISRAEL SPECIFICS

### 7.1 Argentina — PDPA (Personal Data Protection Act)

```
FRAMEWORK: PDPA No. 25,326 (2000) — EU adequacy decision (2003)
  → Data can flow to US with standard contractual clauses
  → No hard residency requirement

SENSITIVE DATA: Health data is "sensitive data" — heightened protection
  Explicit consent required
  Special register with AAIP (Argentine data protection authority)

PRACTICAL IMPLICATIONS:
  Argentina patients assigned to US zone (or dedicated Argentina zone)
  Standard Contractual Clauses (SCCs) executed with US entity
  Privacy policy in Argentine Spanish
  Pythia speaks River Plate Spanish (Rioplatense accent variant)
  
AAIP REGISTRATION:
  Required before processing Argentine patient data commercially
  File: application with data categories, purposes, security measures


ISRAEL — PPPA (Protection of Privacy Law + Regulations)

FRAMEWORK: PPPA 5741-1981 + 2017 Security Regulations
  EU adequacy decision → EU zone works for Israeli patients
  OR: Dedicated Israel zone (il-central-1 region — AWS available)

HEALTH DATA CLASSIFICATION: "Sensitive Information"
  Explicit consent required
  High-level security standards (similar to GDPR Art. 32)

PRACTICAL IMPLICATIONS:
  Israeli patients: EU zone (adequacy) or IL zone (if preferred)
  Privacy policy in Hebrew (Modern Hebrew, right-to-left layout)
  Pythia speaks Hebrew natively
  
PRIVACY PROTECTION AUTHORITY:
  Breach notification required
  Registration of database containing health data required
```

---

## PART 8 — PENETRATION TESTING PLAN

### 8.1 Pre-Launch Security Testing Requirements

Before Patient Zero uses the system with real data:

```
TEST 1: AUTHENTICATION BYPASS ATTEMPT
  Scope: WebAuthn implementation
  Test: Can an attacker forge a biometric assertion?
  Method: FIDO2 conformance testing + manual bypass attempts
  Pass criteria: Zero authentication bypasses
  Vendor: Cure53 or equivalent FIDO2-specialist firm

TEST 2: API AUTHORIZATION TESTING
  Scope: All API endpoints
  Test: Can Patient A access Patient B's data?
    (IDOR — Insecure Direct Object Reference)
  Method: Automated (OWASP ZAP) + manual
  Pass criteria: Zero cross-patient data access possible

TEST 3: ENCRYPTION VALIDATION
  Scope: Data at rest + in transit
  Test: Is PHI readable if database is compromised?
  Method: Snapshot test — restore DB, attempt PHI read without keys
  Pass criteria: PHI unreadable without patient credential

TEST 4: INJECTION ATTACKS
  Scope: All input fields, LLM prompts
  Test: SQL injection, prompt injection, XSS
  Critical: Prompt injection — can a malicious document cause
    Pythia to behave in clinically unsafe ways?
  Pass criteria: Zero successful injections

TEST 5: AMBIENT AUDIO PRIVACY VALIDATION
  Scope: On-device audio processing pipeline
  Test: Does any raw audio leave the device?
  Method: Network traffic analysis during ambient mode
  Pass criteria: Zero audio bytes in network traffic

TEST 6: EMERGENCY ESCALATION RELIABILITY
  Scope: 911 call + emergency contact call pathways
  Test: Does emergency escalation fire reliably?
  Method: Simulated escalation in staging environment
  Pass criteria: 99.9% delivery rate under load

TEST 7: ZONE ISOLATION VALIDATION
  Scope: Multi-zone data architecture
  Test: Can a US zone query return EU zone patient data?
  Method: Cross-zone access attempts at API + DB level
  Pass criteria: Zero cross-zone data leakage
```

---

## PART 9 — BREACH RESPONSE PROTOCOL

### 9.1 Breach Detection

```
AUTOMATED DETECTION (triggers security review):
  - Failed authentication >5x per patient in 15 minutes → account lock
  - API requests from new geographic region → MFA challenge
  - Database query returning >100 patient records → automatic block + alert
  - Unusual data export volume → automatic block + alert
  - Cloudflare WAF anomaly score >70 → request blocked + logged
  - Sentry error rate spike >3x baseline → on-call alert

MANUAL INDICATORS:
  - Patient reports seeing wrong data
  - Clinician reports unexpected patient record access
  - Third-party researcher reports vulnerability
```

### 9.2 Breach Response Timeline

```
HOUR 0: Detection + Initial Assessment
  Security on-call notified (PagerDuty)
  Incident commander assigned
  Affected systems identified
  Attack vector assessment begins

HOUR 1–4: Containment
  Affected API routes suspended if necessary
  Patient accounts in affected range locked
  Evidence preservation (logs, snapshots — do NOT modify)
  Legal counsel notified

HOUR 4–24: Assessment
  Scope of breach determined
  PHI categories affected identified
  Number of patients affected counted
  Root cause identified

HOUR 24–48: Notification Assessment
  HIPAA: Was PHI accessed/disclosed? → 60-day notification window starts
  GDPR: Was personal data breached? → 72-hour SUPERVISORY AUTHORITY notification
  LGPD: Was personal data breached? → 72-hour ANPD notification
  PDPA (Argentina): Notify AAIP as required

DAY 3–60: Patient Notification (if PHI affected)
  Written notification to affected patients
  Clear explanation of: what happened, what data, what risk, what we're doing
  Credit monitoring offered (US patients)
  Pythia delivers notification in-app + email

DOCUMENTATION:
  Full incident report preserved 7 years
  Root cause analysis published internally
  Lessons learned implemented within 30 days
```

---

## PART 10 — SECURITY CONFIGURATION HARDENING

### 10.1 HTTP Security Headers

Applied to every response from Cloudflare Workers:

```javascript
// [SECURITY_HOOK: SECURITY_HEADERS]
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",  // Minimal — CSS custom props
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self' wss://ws.pythia.health https://api.pythia.health",
    "media-src 'self' blob:",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Referrer policy — no PHI in referrer headers
  'Referrer-Policy': 'no-referrer',
  
  // Permissions — only what we use
  'Permissions-Policy': [
    'microphone=(self)',      // Required for Pythia
    'camera=(self)',          // Required for document capture
    'geolocation=(self)',     // Required for zone assignment
    'bluetooth=(self)',       // Required for peripherals
    'payment=()',             // Explicitly denied
    'usb=()',                 // Explicitly denied
    'accelerometer=(self)',   // Required for fall detection
    'gyroscope=(self)'        // Required for fall detection
  ].join(', '),
  
  // Remove server fingerprinting
  'Server': 'Pythia',        // Override default — no framework info
  'X-Powered-By': undefined  // Remove entirely
};
```

### 10.2 Dependency Security

```
SUPPLY CHAIN SECURITY:

Package management:
  - All dependencies pinned to exact versions (no ^ or ~)
  - package-lock.json committed and enforced
  - npm audit run on every CI build — HIGH/CRITICAL blocks deploy

Automated scanning:
  - Dependabot: weekly dependency updates (PRs, not auto-merge)
  - Snyk: continuous vulnerability scanning
  - GitHub secret scanning: catches API keys committed by accident

Container security (Fly.io):
  - Minimal base image: node:22-alpine (not full debian)
  - No root process — runs as non-root user
  - Read-only filesystem except /tmp
  - No shell in production container

Third-party LLM prompt injection protection:
  - All user input sanitized before LLM injection
  - Prompt structure uses system/user/assistant separation (not string concat)
  - LLM output validated against content policy before display
  - Medical documents: content extracted server-side, never raw user-controlled
    content injected into prompts
```

---

## PART 11 — SECURITY GOVERNANCE

### 11.1 Ongoing Security Operations

```
DAILY (automated):
  - Audit log anomaly scan (ML-based — flags unusual patterns)
  - Failed authentication report
  - API error rate review
  - Cloudflare security event summary

WEEKLY (human review):
  - Audit log review by security lead
  - Dependency vulnerability report review
  - LLM output safety flag review
  - Zone integrity check (no cross-zone data)

MONTHLY:
  - Penetration test (automated, Snyk / OWASP ZAP)
  - Access review — who has what permissions
  - BAA status review — all vendors still covered
  - Security training for all team members

QUARTERLY:
  - Third-party penetration test (manual, specialist firm)
  - HIPAA risk assessment update
  - Privacy policy review
  - Encryption key rotation check

ANNUALLY:
  - Full HIPAA Security Rule compliance audit
  - SOC 2 Type II audit (target: Year 2)
  - GDPR Data Protection Impact Assessment (DPIA)
  - Disaster recovery test (full restore from backup)
  - Key rotation (KEK)
```

### 11.2 Security Roles and Responsibilities

```
SECURITY LEAD (Therapeia team — initially Ron/CTO):
  - Owns security architecture decisions
  - Reviews all penetration test results
  - Signs off on BAAs
  - Breach incident commander

ON-CALL ROTATION:
  - 24/7 security alert coverage required before Patient Zero
  - PagerDuty integration to Cloudflare + Sentry alerts
  - Response time SLA: 15 minutes for P0 security events

DATA PROTECTION OFFICER (DPO):
  - Required for EU operations
  - Can be external appointment initially
  - Must be independent from business decisions
  - Contact published at dpo@therapeia.health
```

---

## SECTION 5 — COMPLIANCE SUMMARY

### Regulatory Status by Geography at Patient Zero Launch

| Jurisdiction | Framework | Status Required | Architecture Ready |
|---|---|---|---|
| United States | HIPAA | BAAs signed, controls implemented | ✅ Fully architected |
| Argentina | PDPA | AAIP registration, SCCs | ✅ US zone + SCCs |
| Israel | PPPA | Authority registration | ✅ EU zone (adequacy) |
| European Union | GDPR | DPA registration, DPO | ✅ EU zone architected |
| Brazil | LGPD | ANPD notification plan | ✅ Brazil zone architected |
| [Future] | Local | TBD | ✅ TRR supports any zone |

### Critical Security Blockers Before Patient Zero

```
BLOCKER 1: All BAAs signed (Cloudflare, Supabase, Anthropic, 
           OpenAI, ElevenLabs, Twilio, AWS)

BLOCKER 2: WebAuthn authentication implemented and tested

BLOCKER 3: AES-256-GCM encryption implemented for all PHI fields

BLOCKER 4: Audit log operational and immutable

BLOCKER 5: Penetration test completed — zero HIGH/CRITICAL findings

BLOCKER 6: Emergency escalation (911 + emergency contact) 
           tested end-to-end in staging

BLOCKER 7: Zone routing operational (minimum: US zone)

BLOCKER 8: Consent flows implemented for all data types

BLOCKER 9: Right-to-deletion implemented and tested

BLOCKER 10: Incident response plan documented and team trained
```

---

## APPROVED — READY FOR SECTION 6

**Board recommendation:** Section 5 complete. Proceed to  
**Section 6 — Deployment Manual**  
covering: zero-to-production deployment guide, environment setup,  
database initialization, secrets management, monitoring configuration,  
CI/CD pipeline, Patient Zero onboarding procedure, and rollback strategy.

*Awaiting Ron's approval.*
