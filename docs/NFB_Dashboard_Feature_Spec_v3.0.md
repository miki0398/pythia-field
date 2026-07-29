# NFB Dashboard — Feature Specification v3.0
## Pythia Field · The Living Forest · Full 14-Domain Architecture
**Product:** Pythia Field · Therapeia Ecosystem  
**Based on:** White Paper v2.1 · Owen/Ron Meeting May 11, 2026 · Image Concept Brief  
**Supersedes:** Feature Spec v2.0 (preserved, do not delete)  
**Status:** Engineering Draft — Ready for Development Sprint  
**Date:** May 2026

---

## 1. What Changed from V2.0

| Area | V2.0 | V3.0 |
|---|---|---|
| Domain count | 6 (Tier 1 only) | 14 (Tier 1 active + Tier 2 emerging as saplings) |
| PCCA | Referenced but not specced | Fully specced — dual-path (Pythia-led or manual) |
| Forest visual | Canvas-only procedural rendering | Real image as base layer + canvas overlay for dynamic state |
| Pythia figure | Code-drawn SVG silhouette | Actual commissioned image asset, dynamically composited |
| Care Team | Placeholder action | Full module: manual + Pythia-guided, emergency contact |
| Data connections | No API architecture | Full mock architecture with labeled FHIR R5 + WebSocket hooks |
| Cave sphere | 6 nodes | 14 nodes in two orbital rings (Tier 1 inner, Tier 2 outer) |

---

## 2. The 14-Domain Architecture

Following White Paper v2.1, the NFB expands from 6 to 14 domains organized in two deployment tiers. The forest reflects this: **Tier 1 trees are fully grown and prominently placed**. **Tier 2 trees are younger saplings in the background**, visually suggesting they are still developing — not absent, but not yet fully active.

### Tier 1 — Active at Pilot Launch (6 Core Domains)

These are the six large, named trees visible in the foreground/midground of the forest image.

| # | Domain | Patient Tree Name | Species | Forest Position |
|---|---|---|---|---|
| 1 | Memory & Cognition | The Great Oak | Ancient Oak | Foreground Left — massive, gnarled, dominant |
| 2 | Emotional Stability | The Willow | Weeping Willow | Midground Left-Center — trailing to the water |
| 3 | Motor & Balance | The Silver Birch | Silver Birch | Foreground Right — elegant white bark |
| 4 | Sleep Quality | The Old Cedar | Cedar/Pine | Background Left — tall, dense, pyramidal |
| 5 | Speech & Language | The Singing Pine | Pine Grove | Background Center — grouped, whispering |
| 6 | Daily Functioning | The Maple | Maple | Background Right — warm gold/orange tones |

### Tier 2 — Emerging in Phase 2 (8 Advanced Domains)

These appear as **smaller saplings** in the mid-to-far background, partially obscured by mist. As Tier 2 data collection activates (wearable connection, Phase 2 enrollment), the saplings grow into full trees.

| # | Domain | Patient Sapling Name | Activation Condition |
|---|---|---|---|
| 7 | Neurocognitive Micro-Deviation | The Young Hazel | Always-on smartphone (Phase 2 calibration) |
| 8 | Social Withdrawal Biomarker | The Lone Aspen | Smartphone passive monitoring, 30+ days data |
| 9 | Baseline Deviation Intelligence | The Sentinel (meta-layer) | Requires ≥4 Tier 1 domains at baseline |
| 10 | Neurological Fatigue Mapping | The Elm | Tier 2 sensor (smartwatch connected) |
| 11 | Autonomic NS Instability | The Rowan | Tier 3 sensor (HRV chest strap) |
| 12 | Sleep Architecture (Full) | The Yew | Smartwatch sleep tracking enabled |
| 13 | Recovery Trajectory | The Larch | Post-event monitoring mode |
| 14 | Emotional-Neurological Correlation | The Cherry | 60+ days of longitudinal data |

### Visual Representation of Tier States

```
HEALTHY TIER 1 TREE:    Full canopy, deep green, animals nearby, swaying
WATCH TIER 1 TREE:      Yellowing leaves, sparse canopy, no animals near it
TIER 2 SAPLING active:  Small but healthy, bright young green, some light glow
TIER 2 SAPLING inactive: Tiny, grey-green, partially in mist, not yet luminous
```

---

## 3. Pre-NFB Phase: The PCCA (Personality, Cultural & Contextual Assessment)

Before the first tree grows, Pythia conducts the PCCA. This is the relationship-building phase — Pythia learns *who* the person is before learning *how* the person is.

### 3.1 What the PCCA Captures

**Big Five Personality (OCEAN):**
- Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- Calibrates Pythia's communication style and alert framing thresholds
- High-neuroticism users receive extra reassurance; scores never pushed to them

**Attachment Style Screener:**
- Secure / Anxious / Avoidant
- Shapes Pythia's relational warmth and pacing
- Anxious attachment → Pythia is slower, more reassuring, more present

**Cultural Context Intake:**
- Health belief model, family structure, communication directness preference
- Language and dialect selection (on-device Whisper-large-v3)
- Geographic biome preference (auto-detected + confirmed)
- Symptom expression calibration (prevents cultural false negatives)

### 3.2 Dual-Path PCCA Completion

**Path A — Pythia-Led (Conversational):**
Pythia asks questions through natural conversation over the first 3–5 sessions. The patient never knows they are completing a psychological assessment. Example prompts:
- *"Tell me a little about yourself — what does a good day feel like for you?"*
- *"When something worries you, do you prefer to talk about it right away, or sit with it first?"*
- *"Where did you grow up? I'd love to know what kind of landscape feels like home to you."*

Pythia builds the PCCA profile progressively. No session is labeled "assessment." The profile completes in the background as data density reaches threshold.

**Path B — Manual Intake Form:**
For users or family members who prefer directness, or for clinical enrollment contexts, a structured form is available in Settings → My Profile → Personality & Preferences.
- 20-question adaptive questionnaire
- Plain language, no psychological jargon
- Can be completed in pieces (not all at once)
- Results are reconciled with Pythia-observed data when both paths are used

**Reconciliation Logic:** If both paths produce data, the Pythia-observed behavioral PCCA takes precedence, with manual form used as a prior. Divergence >2 standard deviations triggers a gentle conversational clarification by Pythia.

---

## 4. Forest Visual Architecture — Hybrid Image + Canvas

### Design Decision
The real images (Pythia_in_the_forest.png, the_cave_of_knowing.png) serve as the **base aesthetic layer**. A transparent canvas overlaid on top renders the **dynamic health-state elements** that change with NFB data. This gives us:

- Cinematic, photorealistic beauty from the real images
- Living, responsive behavior from the canvas layer
- No uncanny valley of pure code-drawn figures
- Full flexibility for weather, tree health overlays, animal presence, and day/night cycles

### Layer Stack (back to front)

```
Layer 0: Static forest background image (Pythia_in_the_forest.png)
Layer 1: Sky state overlay (CSS filter + canvas gradient) — clouds, light quality
Layer 2: Canvas tree health overlays — yellowing, leaf fall, glow effects
Layer 3: Canvas weather layer — rain, fog, golden mist
Layer 4: Canvas animal presence layer — deer, butterflies, birds, swans
Layer 5: Canvas Pythia glow + ripple layer — halo, water rings, light beams
Layer 6: Canvas particle system — fireflies, pollen, snow
Layer 7: UI overlays — speech bubble, bottom panel, status bar
```

### Dynamic State Mapping

| NFB State | Sky Overlay | Tree Effect | Animal Presence | Pythia Effect |
|---|---|---|---|---|
| All healthy | None (image shows through) | Subtle glow shimmer | Full — deer, rabbits, swans, butterflies | Golden halo, bright ripples |
| 1 domain watch | Slight grey veil 15% | Affected tree: amber glow overlay + leaf particles | Slightly fewer butterflies near that tree | Halo slightly softer |
| 2–3 domains watch | Grey veil 30%, clouds | Yellow/brown overlay on affected trees | Animals fewer overall | Halo dimmer; Pythia turns head toward stressed tree |
| 4+ domains | Heavy veil 55%, dark sky | Multiple tree overlays; leaves falling | Most animals absent; only distant birds | Rain begins; Pythia rises, faces patient |
| Escalation | Storm (rain, dark) | Trees visibly suffering | No animals; storm birds only | Pythia walks to shore; speaks |

---

## 5. The Cave of Knowing — V3 Updates

### 5.1 Image-Based Cave Background
The cave_of_knowing.png serves as the static base layer. Canvas overlays render:
- The floating sphere (animated, 14 nodes in two orbital rings)
- Node glow intensity and connection line thickness (reflecting domain health)
- Bioluminescent particle drift on cave walls
- Pythia's subtle breathing animation (CSS overlay on her region)

### 5.2 The Sphere — 14 Nodes Architecture

The sphere now contains 14 nodes arranged in two orbital paths:
- **Inner ring (6 nodes):** Tier 1 domains — large, brilliantly lit when healthy
- **Outer ring (8 nodes):** Tier 2 domains — smaller, softer glow, some still dimmed if not yet active

Connection filaments:
- Tier 1 ↔ Tier 1: Thick golden lines (strong health = bright and wide)
- Tier 1 ↔ Tier 2: Thinner silver threads (show emerging relationships)
- Tier 2 ↔ Tier 2: Faint, barely visible (data still accumulating)

Stone tablet (visible in cave image, now updated):
The carved stone tablet lists all 14 tree names in two columns — Tier 1 (larger inscription) and Tier 2 (smaller, some still faintly etched, as if still being carved by time).

### 5.3 Cave Consent — Once Per Day
Unchanged from V2.0. Pythia asks:
> *"Are you sure you'd like to visit the cave today? We can only go once. You can always just ask me instead."*

One visit per 24-hour window (resets at midnight, device timezone).

---

## 6. Care Team Module — Full Specification

The Care Team is the patient's human support network within Pythia Field. It has three components: Medical Team, Emergency Contact, and the connection to Pythia Navigator.

### 6.1 Module Entry Points

Accessible from:
- Bottom panel drawer → "Care Team" button
- Pythia suggestion (*"Would you like me to help you set up your care team?"*)
- Settings → My Care Circle

### 6.2 Medical Team

**What is stored:**
| Field | Type | Required |
|---|---|---|
| Primary care physician | Name + phone + fax + practice | Recommended |
| Specialist (e.g. neuro-oncologist) | Name + hospital + contact | Recommended |
| Other providers | Free-form, up to 5 entries | Optional |
| Pharmacy | Name + address + phone | Optional |
| Insurance provider | Name + member ID | Optional |

**Dual-path completion:**

**Manual:** Patient fills in a structured form in the app. Fields are large-touch-friendly, minimal, one per screen. A family member may complete it on their behalf (flagged as "added by caregiver").

**Pythia-led:** Patient taps "Let Pythia help." Pythia asks conversationally:
- *"Who is the main doctor you see? Can you tell me their name?"*
- *"Do you have a specialist — someone who focuses on your condition?"*
- *"What pharmacy do you use most often?"*
Pythia auto-populates the fields from conversation. Patient confirms each entry with a single tap. Incomplete entries remain open — Pythia asks again gently in a future session.

### 6.3 Emergency Contact

**Critical component.** This is the person Pythia will call or message in the event of a triggered emergency escalation.

**Fields:**
| Field | Description |
|---|---|
| Full name | Required |
| Relationship | Dropdown: Spouse / Partner / Child / Parent / Sibling / Friend / Caregiver / Other |
| Mobile phone | Required — for both call and SMS |
| Secondary phone | Optional fallback |
| Preferred contact method | Call first / SMS first / Both simultaneously |
| Language preference | For SMS message language |
| Awareness | Toggle: "This person knows about my condition" / "Please be sensitive in messages" |
| Escalation consent | Emergency contact must confirm via SMS link that they accept the role |

**Emergency trigger actions (when escalation fires):**
1. Pythia attempts SMS first (non-alarming language, e.g. *"Owen may need your attention today. Please check in with him when you can. — Pythia, Therapeia"*)
2. If no response within 15 minutes AND escalation is Emergency tier: automated call via Twilio (or equivalent)
3. Pythia Navigator simultaneously notifies the care team
4. A summary packet is prepared for ER presentation (read by Pythia Navigator if enabled)

**Sensitivity mode (if "be sensitive" toggle is ON):**
SMS reads: *"Hi [Name], just checking — have you spoken to Owen today? — Pythia"* — no mention of health crisis until the person responds.

### 6.4 Pythia Navigator Connection Status

A live status indicator in the Care Team module shows the connection state to the clinical interface:

```
● Connected — Pythia Navigator is receiving your data
○ Pending setup — Your care team has not yet activated Navigator
○ Awaiting consent — Please confirm data sharing with your provider
```

Tapping the status opens a plain-language explanation of what is shared and a biometric-gated consent flow.

---

## 7. Real-Time Data Architecture — API Hook Specification

This section defines exactly where each external connection plugs in. All hooks are labeled `[API_HOOK]` in the codebase. Engineers connect real endpoints during integration sprint.

### 7.1 Pythia Field → Therapeia (Outbound)

**Protocol:** WebSocket (primary) + HTTPS fallback  
**Frequency:** Anonymized deviation packets sent only on threshold breach  
**Payload:** Zero raw PHI — encrypted deviation vectors only  

```javascript
// [API_HOOK: THERAPEIA_OUTBOUND]
// Location: /services/therapeiaSync.js
// Replace mock with real WebSocket endpoint

const THERAPEIA_WS_ENDPOINT = "wss://api.therapeia.health/v1/field-sync";
// Auth: mTLS client certificate + JWT bearer token
// Payload schema: TherapeiDeviationPacket (see /schemas/deviation-packet.json)

function sendDeviationPacket(packet) {
  // MOCK: logs to console
  // PRODUCTION: ws.send(JSON.stringify(encryptPacket(packet)))
}
```

### 7.2 Pythia Navigator → Pythia Field (Inbound)

**Protocol:** FHIR R5 over HTTPS  
**Trigger:** Biometric-gated by patient on each session  
**Data received:** Medication updates, appointment data, clinical notes (structured)  

```javascript
// [API_HOOK: NAVIGATOR_INBOUND]
// Location: /services/navigatorSync.js
// FHIR R5 endpoint — hospital/EHR system dependent

const FHIR_BASE = "https://navigator.therapeia.health/fhir/r5";
// Resources consumed: MedicationRequest, Appointment, ClinicalImpression
// Auth: SMART on FHIR 2.1 — patient-controlled OAuth2 token
// Biometric gate: confirmed before EVERY sync (not just login)

async function fetchPatientBundle(patientId, smartToken) {
  // MOCK: returns sample FHIR Bundle from /mocks/fhir-bundle-sample.json
  // PRODUCTION: return await fhirClient.request(`Patient/${patientId}/$everything`)
}
```

### 7.3 Therapeia Cohort Engine → Pythia Field (Inbound)

**Protocol:** HTTPS polling (every 24h) or push notification  
**Content:** Anonymized cohort context, updated deviation thresholds, model weights  

```javascript
// [API_HOOK: THERAPEIA_COHORT_PULL]
// Location: /services/cohortConfig.js
// Delivers: per-user threshold config, domain weight recalibration

const COHORT_CONFIG_ENDPOINT = "https://api.therapeia.health/v1/cohort-config";
// Auth: device attestation token (Apple DeviceCheck / Android SafetyNet)
// Payload: EncryptedCohortConfig (AES-256-GCM, key in Secure Enclave)

async function refreshCohortConfig(deviceToken) {
  // MOCK: loads /config/default-thresholds.json
  // PRODUCTION: fetch config from Therapeia, decrypt on-device, apply thresholds
}
```

### 7.4 Emergency Escalation → Twilio (SMS + Voice)

```javascript
// [API_HOOK: EMERGENCY_SMS]
// Location: /services/emergencyEscalation.js
// Twilio Programmable Messaging + Voice

const TWILIO_FUNCTION_ENDPOINT = "https://api.therapeia.health/v1/emergency-escalate";
// This call goes to a Therapeia serverless function that proxies Twilio
// Reason: Twilio credentials never stored on-device

async function triggerEmergencyContact(escalationPacket) {
  // MOCK: logs escalation packet + shows UI confirmation
  // PRODUCTION: POST to Therapeia emergency proxy endpoint
  // escalationPacket: { patientId, contactPhone, contactMethod, sensitivityMode, summary }
}
```

### 7.5 NFB Real-Time Sync — WebSocket Data Stream

```javascript
// [API_HOOK: NFB_REALTIME_STREAM]
// Location: /services/nfbStream.js
// Live NFB domain updates pushed to UI as on-device models compute new scores

// MOCK implementation (simulates real-time data):
function mockNFBStream(onUpdate) {
  setInterval(() => {
    const domainId = DOMAINS[Math.floor(Math.random() * DOMAINS.length)].id;
    const delta = (Math.random() - 0.5) * 0.04;
    onUpdate({ domainId, delta, timestamp: Date.now() });
  }, 8000);
}

// PRODUCTION: Replace with on-device LLM model output listener
// The 7B model runs asynchronously; results pushed to this stream
// Domain scores update in the forest layer in real time (canvas re-render)
```

### 7.6 Connection Status Indicator Logic

```javascript
// [API_HOOK: CONNECTION_STATUS]
// Location: /services/connectionStatus.js

const CONNECTION_STATES = {
  THERAPEIA: 'mock_connected',    // 'connected' | 'disconnected' | 'syncing'
  NAVIGATOR: 'mock_pending',      // 'connected' | 'pending_setup' | 'awaiting_consent'
  EMERGENCY: 'mock_not_set',      // 'configured' | 'not_set' | 'unconfirmed'
};
// PRODUCTION: Each state updated by respective service heartbeat
```

---

## 8. Updated Experience Flow — End to End

```
FIRST LAUNCH
    │
    ▼
PCCA (Path A: Pythia conversational OR Path B: Manual form)
    │
    ▼
ONBOARDING — Forest appears as open meadow with young saplings
    │  7–14 days of baseline building
    │  Each domain sapling grows as its data matures
    │
    ▼
BASELINE COMPLETE — First full tree appears
    │  Pythia: "Look. Your first tree."
    │
    ▼
DAILY EXPERIENCE — The Living Forest (default state)
    │  Pythia floating on lake
    │  Forest reflects health state dynamically
    │  Patient taps lake to speak with Pythia
    │
    ├──► CAVE REQUEST (max once/day)
    │       Consent → Transition → Cave of Knowing → 14-node sphere
    │
    ├──► CARE TEAM MODULE
    │       Manual form OR Pythia-guided completion
    │       Emergency contact setup + confirmation SMS
    │       Pythia Navigator connection status
    │
    ├──► STORM ESCALATION (automated)
    │       Therapeia board review → Forest weather shifts
    │       Pythia approaches → Care recommendation
    │       Emergency contact triggered if Emergency tier
    │
    └──► PYTHIA NAVIGATOR HANDOFF (with biometric consent)
            Clinical data package → Provider EHR
            FHIR R5 structured message
```

---

## 9. Onboarding: The Forest Grows

During baseline establishment (7–14 days), the forest exists as a meadow. Trees grow in sequence as domains accumulate sufficient data:

**Day 1–2:** Empty meadow, lake, Pythia present. Sky is soft dawn.
**Day 3:** First Tier 1 sapling appears (whichever domain has most data). Pythia acknowledges it.
**Day 5–7:** 3–4 Tier 1 trees visible, still growing.
**Day 10–14:** All 6 Tier 1 trees fully grown. Forest looks like the reference image.
**Day 30+:** First Tier 2 saplings begin appearing as passive signals accumulate.
**Phase 2 (wearable):** Tier 2 trees begin their growth cycle.

**Baseline integrity:** No deviation alerts, no cave access during the baseline period. The cave entrance appears only after baseline is established. Before that, there is simply a rocky hillside — the cave doesn't exist yet.

---

## 10. What Has Not Changed from V2.0

- No numbers visible anywhere in the patient experience
- Pythia never uses clinical language
- Cave is once-per-day maximum with explicit consent
- Storm escalation is always through forest metaphor, never a push alert
- All raw NFB data remains on-device, encrypted
- Patient owns all data; biometric required for any external sync
- Pythia Navigator doctors view is a fully separate surface with all numbers

---

*This specification supersedes V2.0 and incorporates the complete White Paper v2.1 domain architecture, the PCCA dual-path protocol, the commissioned image visual strategy, the full Care Team module, and the complete API hook architecture for Therapeia and Pythia Navigator integration. All previous versions (V1.0, V2.0) remain preserved.*

---

## AMENDMENT — PANEL DECISION: MAY 2026
### Domain Display Removed from Patient Interface
**Authority:** 32-Member Specialist Board · Unanimous  
**Approved by:** Ron Engelberg  
**Supersedes:** Section 6 (The Cave of Knowing), Section 4 (Forest Visual Architecture — Dynamic State Mapping)

### Core Change

Section 3 of this specification ("The Forest: Visual Language of Health") remains fully intact.

Sections describing patient-visible domain cards, bars, labels, tier indicators, or connection status strips are **superseded** by this amendment.

### Revised Patient Information Architecture

**The patient sees three things. Only three things.**

```
1. THE FOREST
   Always present. Always honest.
   No labels. No numbers. No explanations needed.
   The forest condition IS the health communication.

2. PYTHIA'S VOICE
   Speaks when initiated or when she initiates.
   Warm. Contextual. Domain-aware but never clinical.
   "The birch has been quiet. A walk might help."
   Never: "Your motor domain dropped 8 points."

3. THE CAVE (once per day, patient-initiated, consented)
   The only place domain information is communicated.
   In Pythia's voice. In forest language. Never as metrics.
   Consent required. One visit per 24 hours.
```

### Revised Bottom Drawer Specification

The drawer contains exactly three actions:

```
┌─────────────────────────────────────┐
│         ━━━ (drag handle)           │
│                                     │
│   🌿  Talk to Pythia                │
│       "I'm here. What's on          │
│        your mind?"                  │
│                                     │
│   🪨  The Cave                      │
│       "Visit once a day to see      │
│        what your forest holds"      │
│                                     │
│   🏥  Care Team                     │
│       "Your doctors, emergency      │
│        contact, and connections"    │
│                                     │
└─────────────────────────────────────┘
```

No domain cards. No bars. No tier labels. No status strip. No navigation bar in drawer.

### What Is Explicitly Prohibited in Patient View

```
✗ Any numerical score or percentage
✗ Any bar, ring, or progress indicator representing health
✗ Domain names (cognition, motor, sleep, speech, mood, daily)
✗ Tier labels (Tier 1, Tier 2, sapling, tree)
✗ Status labels (Stable, Watch, Improving, Resting)
✗ Connection status (Live, Pending, Offline)
✗ Alert indicators of any kind outside escalation protocol
✗ The word "domain", "baseline", "NFB", "deviation", "score"
✗ Any visual element the patient might interpret as a health metric
```

### What Is Preserved

```
✓ Forest visual health state (tree condition, sky, animals)
✓ Pythia's speech — domain-aware, forest-language only
✓ Cave readings — LLM-generated, once per day
✓ All 14 domain measurements (invisible to patient)
✓ Full NFB engine operation (invisible to patient)
✓ Full Navigator dashboard for clinicians (separate surface)
✓ All clinical data collection (unchanged)
```

### Voiceprint Enrollment (Added to Onboarding)

Owen's voice is enrolled during onboarding session 1.
Pythia says: *"I'd love to get to know your voice — it helps me listen better. Just talk to me for a minute or two. Tell me anything you like."*
The system captures voice features. Owen never knows this is a clinical baseline enrollment.
All other voices (nurse, caregiver, family) are filtered out from NFB speech measurements automatically.
