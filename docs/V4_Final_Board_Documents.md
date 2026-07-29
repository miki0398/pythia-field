# PYTHIA FIELD — RISK REGISTER · TECHNICAL DEBT · MVP SCOPE · ROADMAP
## Section 8: Final Board Documents
### 32-Member Specialist Board · Approved Specification

**Date:** May 2026  
**Scope:** Risk Register · Technical Debt Register · MVP Scope ·  
Phase 2 Roadmap · Pilot Readiness Checklist · Final Board Recommendations  
**Governing principle:** Know every risk before Owen opens the app.  
Mitigate what you can. Monitor what you cannot. Never be surprised twice.

---

# DOCUMENT 8.1 — RISK REGISTER

## How to Read This Register

**Likelihood:** 1 (rare) → 5 (near-certain)  
**Impact:** 1 (negligible) → 5 (existential)  
**Risk Score:** Likelihood × Impact  
**Owner:** The person responsible for mitigation — not monitoring, owning.  
**Review:** How often this risk is formally reviewed.

---

## CATEGORY 1 — PATIENT SAFETY RISKS

```
RISK PS-01: EMERGENCY ESCALATION FAILS TO FIRE
─────────────────────────────────────────────────
Description: Fall detected, patient unresponsive, but 911 call
             does not execute (Twilio outage, network failure,
             API failure, device offline)
Likelihood:  2  Impact: 5  Score: 10  Severity: CRITICAL

Mitigation:
  1. Twilio has 99.95% uptime SLA — document and enforce BAA terms
  2. Background Sync API queues failed calls for retry
  3. Device-level emergency: iOS also has built-in fall detection
     (Apple Watch) — Pythia is supplementary, not sole mechanism
  4. Emergency contact SMS fires independently of 911 call
     (separate Twilio job, separate network path)
  5. Patient's emergency contact instructed to also enable
     Apple Watch fall detection independently
  6. Weekly automated test: staging escalation fires correctly
  
Residual risk: LOW (multiple independent pathways)
Owner: CTO + Clinical Safety Officer
Review: Weekly during pilot


RISK PS-02: FALSE REASSURANCE FROM STATIC/STALE DATA
──────────────────────────────────────────────────────
Description: Cave readings or Pythia messages reflect outdated
             NFB state. Patient believes they are well when
             clinical deterioration has occurred.
Likelihood:  3  Impact: 5  Score: 15  Severity: CRITICAL

Mitigation:
  1. Cave readings are LLM-generated from live NFB data
     at time of visit — never cached more than 1 hour
  2. NFB engine runs continuously — data is current to within
     15 minutes during active monitoring
  3. Forest visual state updates in real-time from NFB engine
  4. If NFB engine has not received data in >6 hours:
     Pythia discloses: "I haven't been able to check in with
     your forest as often as I'd like today."
  5. Clinical team reviews cave quality weekly (Section 7 protocol)

Residual risk: LOW with monitoring
Owner: Clinical Safety Officer + AI Architect
Review: Weekly


RISK PS-03: MEDICATION REMINDER FAILS — MISSED DOSE
──────────────────────────────────────────────────────
Description: Web Push notification does not fire. Patient
             misses critical medication (e.g., anti-seizure,
             dexamethasone taper).
Likelihood:  3  Impact: 4  Score: 12  Severity: HIGH

Mitigation:
  1. Web Push has two delivery attempts before fallback
  2. Fallback: in-app ambient check (if app is foregrounded)
  3. Fallback 2: Twilio SMS reminder (for critical medications
     flagged by physician in care team record)
  4. Caregiver co-reminder option (with patient consent)
  5. Physician notified if 3 consecutive doses missed
     via Navigator (FHIR MedicationAdministration)
  6. Patient explicitly informed: "I'll remind you, but
     please also keep your medication routine independent
     of me in case I cannot reach you."

Residual risk: MEDIUM (technology cannot guarantee delivery)
Owner: Product Manager + Clinical Safety Officer
Review: Monthly


RISK PS-04: MONITORING-INDUCED HEALTH ANXIETY
───────────────────────────────────────────────
Description: Continuous monitoring increases patient anxiety
             rather than reducing it. PHQ-9 or GAD-7 worsens
             due to Pythia engagement.
Likelihood:  3  Impact: 4  Score: 12  Severity: HIGH

Mitigation:
  1. PCCA identifies high-neuroticism and anxious attachment
     at onboarding — extra-gentle protocols applied
  2. Numbers never shown to patient (core design)
  3. Pythia normalizes variation in every session
  4. Cave once-per-day limit prevents obsessive checking
  5. PHQ-9 and GAD-7 administered monthly
  6. If GAD-7 increases +4 points and correlates with
     increased app sessions: Clinical Safety Officer review,
     possible Pythia frequency reduction
  7. Patient always has option to reduce Pythia contact frequency

Residual risk: MEDIUM (monitoring by design)
Owner: Clinical Safety Officer + Psychologist
Review: Monthly (PHQ-9/GAD-7 results)
```

---

## CATEGORY 2 — TECHNICAL RISKS

```
RISK T-01: LLM API OUTAGE — PYTHIA CANNOT RESPOND
───────────────────────────────────────────────────
Description: Anthropic API is unavailable. Pythia cannot
             generate responses. Patient receives no support.
Likelihood:  2  Impact: 4  Score: 8  Severity: HIGH

Mitigation:
  1. Automatic fallback to Claude Haiku 4 (different
     API endpoint, often on different infrastructure)
  2. Second fallback: OpenAI GPT-4o (different vendor entirely)
  3. Local fallback: Pre-generated response library (200 responses
     covering common emotional and informational needs) served
     from device when all cloud LLMs unavailable
  4. Pythia discloses: "I'm having trouble thinking clearly right
     now. I'm still here, but let me keep it simple."
  5. Sentry alert + PagerDuty page if fallback activates

Residual risk: LOW (three-layer fallback)
Owner: AI Architect + DevOps Lead
Review: Monthly


RISK T-02: APPLE WATCH HEALTHKIT BRIDGE BREAKS ON iOS UPDATE
──────────────────────────────────────────────────────────────
Description: Apple releases iOS update that breaks the
             WKWebView → HealthKit bridge. Owen's Watch
             data stops flowing.
Likelihood:  3  Impact: 3  Score: 9  Severity: MEDIUM

Mitigation:
  1. Join Apple Developer beta program — test each iOS beta
     against HealthKit bridge before public release
  2. Bridge is 200 lines — fast to fix when breakage occurs
  3. Graceful degradation: NFB engine continues with
     conversation and ambient signals only
  4. Forest visual state uses available data — Watch-dependent
     domains (fatigue, autonomic) show "resting" state
     with explanation to Owen
  5. Expedited fix SLA: 48 hours from iOS release to patch

Residual risk: MEDIUM (Apple controls this surface)
Owner: Mobile Architect
Review: With each Apple iOS release


RISK T-03: DATA LOSS — PATIENT CARE TEAM DATA DISAPPEARS
──────────────────────────────────────────────────────────
Description: IndexedDB corruption, device replacement, or
             failed sync causes care team data loss. Owen
             must re-enter all providers.
Likelihood:  2  Impact: 4  Score: 8  Severity: HIGH

Mitigation:
  1. Care team data syncs to Supabase on every change
     (encrypted, pseudonymized)
  2. On new device: authenticate with Face ID →
     data restored from cloud sync within 30 seconds
  3. Supabase point-in-time recovery to 7 days
  4. Device-local backup in localStorage as secondary
  5. Pythia detects data loss: "Owen, it looks like some
     information is missing. Let me help you restore it."

Residual risk: LOW with cloud sync
Owner: Backend Architect + Data Engineer
Review: Monthly


RISK T-04: CANVAS PERFORMANCE — BATTERY DRAIN
───────────────────────────────────────────────
Description: The forest canvas animation drains Owen's
             iPhone battery significantly, reducing daily
             use or causing frustration.
Likelihood:  3  Impact: 3  Score: 9  Severity: MEDIUM

Mitigation:
  1. Page Visibility API: all animation pauses when app
     is backgrounded — implemented in V4
  2. 30fps cap on ambient animations
  3. Dirty-flag rendering: only redraws when state changes
  4. OffscreenCanvas + Web Worker for rendering on
     supporting browsers (iOS 17+)
  5. Battery budget target: <8% per active hour (tested
     in Part 7 performance benchmarks)
  6. Low-power mode detection: if iOS Low Power Mode active,
     reduce to static image + Pythia speech only

Residual risk: LOW with optimizations
Owner: Frontend Architect
Review: Monthly battery report from staging


RISK T-05: WEBAUTHN NOT SUPPORTED ON OLDER iOS
────────────────────────────────────────────────
Description: Patient has iPhone running iOS < 16.
             WebAuthn passkeys not supported.
             Patient cannot authenticate.
Likelihood:  2  Impact: 3  Score: 6  Severity: MEDIUM

Mitigation:
  1. Minimum supported: iOS 16 (released Sept 2022)
     Displayed clearly in onboarding requirements
  2. Fallback: 6-digit PIN with biometric confirmation
     (not passwordless but still no text password)
  3. During onboarding: check iOS version, display
     upgrade prompt if below minimum
  4. As of 2026, iOS <16 is <8% of active iPhones

Residual risk: LOW (small affected population)
Owner: Mobile Architect
Review: Annually
```

---

## CATEGORY 3 — CLINICAL & REGULATORY RISKS

```
RISK CR-01: NFB ALERTS MISS A CLINICAL EVENT (FALSE NEGATIVE)
──────────────────────────────────────────────────────────────
Description: Patient experiences significant neurological
             deterioration. NFB engine does not flag it.
             Care team not notified. Patient suffers harm.
Likelihood:  2  Impact: 5  Score: 10  Severity: CRITICAL

Mitigation:
  1. Pythia is never the sole safety mechanism — always
     supplementary to scheduled clinical care
  2. This stated explicitly in consent documentation
  3. Conformal prediction provides coverage guarantees
     at 3-sigma before Black-tier alerts
  4. Alert sensitivity calibrated monthly against clinical
     ground truth (Section 7 protocol)
  5. Physician continues standard-of-care monitoring
     schedule — Pythia supplements, does not replace
  6. If patient disengages from Pythia for >7 days:
     Navigator notified automatically

Residual risk: MEDIUM (inherent in any early detection system)
Owner: Clinical Safety Officer + Neurologist
Review: Weekly during pilot


RISK CR-02: FDA ENFORCEMENT ACTION — SAMD CLASSIFICATION
──────────────────────────────────────────────────────────
Description: FDA determines Pythia's NFB alerting constitutes
             a Software as a Medical Device (SaMD) requiring
             510(k) clearance or De Novo authorization.
             Platform must suspend clinical operations.
Likelihood:  3  Impact: 5  Score: 15  Severity: CRITICAL

Mitigation:
  1. Pre-submission meeting with FDA requested before
     pilot enrollment (Q-submission program)
  2. Regulatory Affairs Specialist engaged from day one
  3. Pythia positioned as: wellness monitoring companion,
     not diagnostic or treatment tool
  4. All clinical claims reviewed by regulatory counsel
     before any patient-facing or investor-facing use
  5. De Novo application prepared in parallel if
     pre-submission indicates clearance required
  6. IRB protocol submitted and approved before pilot
  7. Predetermined Change Control Plan (PCCP) documented
     for all AI updates

Residual risk: MEDIUM (regulatory landscape evolving)
Owner: Regulatory Affairs Specialist + CEO
Review: Quarterly + after any FDA guidance publication


RISK CR-03: HIPAA BREACH — PHI EXPOSURE
──────────────────────────────────────────
Description: Security breach exposes patient health data.
             HIPAA notification required. Reputational damage.
             Potential regulatory fine.
Likelihood:  2  Impact: 5  Score: 10  Severity: CRITICAL

Mitigation:
  1. Full pseudonymization architecture (Section 5, Part 1)
     — servers never hold real patient names
  2. AES-256-GCM encryption on all PHI fields
  3. Zero raw audio ever transmitted or stored
  4. Penetration testing before Patient Zero
  5. Breach response plan documented and rehearsed
  6. Even in worst-case breach: pseudonymized data is
     not PHI under HIPAA if re-identification is not
     reasonably possible

Residual risk: LOW (pseudonymization is structural protection)
Owner: Cybersecurity Specialist + Privacy Officer
Review: Monthly


RISK CR-04: IRB REJECTION — PILOT CANNOT START
────────────────────────────────────────────────
Description: UCSF IRB rejects the study protocol.
             Pilot cannot enroll patients formally.
             Only Owen as informal user (non-IRB).
Likelihood:  2  Impact: 4  Score: 8  Severity: HIGH

Mitigation:
  1. Owen as Patient Zero does not require IRB
     (he is co-investigator, not a research subject)
  2. IRB protocol prepared with experienced CRO support
  3. IRB pre-consultation requested before submission
  4. Hospital Director board member facilitates UCSF
     introduction at LLC confirmation
  5. If IRB takes longer than expected: continue
     data collection with Owen only under co-investigator
     framework while IRB processes

Residual risk: LOW for Patient Zero; MEDIUM for pilot expansion
Owner: Clinical Safety Officer + Hospital Director (board)
Review: Monthly until IRB approved
```

---

## CATEGORY 4 — ADOPTION & OPERATIONAL RISKS

```
RISK AO-01: PATIENT DISENGAGEMENT — DROPS OUT AFTER WEEK 2
────────────────────────────────────────────────────────────
Description: Owen or pilot patients stop using Pythia
             after initial novelty fades. Engagement drops
             below 70% daily session rate. NFB data becomes
             insufficient for meaningful monitoring.
Likelihood:  3  Impact: 4  Score: 12  Severity: HIGH

Mitigation:
  1. Proactive Initiation Engine (Section 4) ensures
     Pythia reaches out — patient does not need to remember
  2. Forest visual change provides intrinsic motivation
     to check in daily
  3. Memory continuity: Pythia remembers — patients
     stay for relationships, not dashboards
  4. Medication reminders create daily touchpoint habit
  5. 90-day retention target tracked weekly (Section 7)
  6. At-risk detection: if engagement drops <50% for
     3 consecutive days → Pythia switches to simpler,
     shorter interaction format
  7. Caregiver nudge option (with patient consent)

Residual risk: MEDIUM (engagement is the hardest problem in digital health)
Owner: CPO + UX Specialist
Review: Weekly during pilot


RISK AO-02: CAREGIVER OVER-RELIANCE ON PYTHIA
───────────────────────────────────────────────
Description: Family caregivers begin relying on Pythia
             as the primary care coordinator, reducing
             their own involvement. Patient becomes
             isolated despite having a "companion."
Likelihood:  2  Impact: 3  Score: 6  Severity: MEDIUM

Mitigation:
  1. Pythia explicitly encourages human connection in
     every interaction — never positions herself as
     a replacement for family presence
  2. Caregiver module designed to increase family
     engagement, not replace it
  3. Pythia: "I'm so glad [Maria] is coming Thursday.
     Time together means everything."
  4. Monthly caregiver check-in: CSI (Caregiver Strain Index)
     monitors caregiver wellbeing

Residual risk: LOW with design guardrails
Owner: Psychologist + CPO
Review: Monthly


RISK AO-03: PHYSICIAN DISTRUST — NAVIGATOR NOT ADOPTED
────────────────────────────────────────────────────────
Description: Physicians do not adopt Pythia Navigator.
             Clinical intelligence generated by Pythia
             Field never reaches the care team. Platform
             loses its clinical value proposition.
Likelihood:  3  Impact: 4  Score: 12  Severity: HIGH

Mitigation:
  1. Navigator adoption is physician-pull, not patient-push
  2. Hospital Director board member champions introduction
  3. Navigator designed around physician workflow, not
     as an additional burden
  4. Pre-appointment brief (the feature that travels) is
     the primary adoption driver
  5. Pilot success metrics include physician engagement
     rate (target: >80% of flags acted on within 48h)
  6. Grand rounds presentation planned for pilot month 3

Residual risk: MEDIUM (requires physician champion at each site)
Owner: Hospital CIO + GTM Strategist (board)
Review: Monthly


RISK AO-04: COST OVERRUN — AI INFERENCE COSTS
───────────────────────────────────────────────
Description: LLM API costs exceed projections as patient
             conversations scale. Platform becomes
             uneconomic before revenue.
Likelihood:  3  Impact: 3  Score: 9  Severity: MEDIUM

Cost model (per patient per month):
  Claude Sonnet: ~150 sessions × ~2,000 tokens = 300K tokens
  At $3/1M tokens input: ~$0.90/patient/month (conversations)
  Whisper STT: ~150 sessions × 5min = ~$1.12/patient/month
  ElevenLabs TTS: ~150 sessions × 300 words = ~$1.50/patient/month
  Total AI cost estimate: ~$3.50-5.00/patient/month

Mitigation:
  1. Claude Haiku used for simple turns (shorter responses,
     non-clinical) — 20x cheaper than Sonnet
  2. TTS only when microphone is consented (text-only fallback)
  3. Caching common Pythia phrases (medication reminders,
     time-of-day greetings) — pre-generated, not LLM
  4. Payer ROI model: $3-5/month vs. single ER admission
     avoided ($35,000-65,000) → breakeven at <1 admission
     prevented per 7,000 patient-months
  5. Investor funding covers pilot AI costs

Residual risk: LOW relative to value (manageable unit economics)
Owner: Healthcare Economist + CTO
Review: Monthly cost dashboard
```

---

## CATEGORY 5 — STRATEGIC RISKS

```
RISK S-01: COMPETITIVE — BIG TECH ENTERS SPACE
────────────────────────────────────────────────
Description: Apple Health AI, Google DeepMind, or Microsoft
             announces a competing neurological companion
             platform with significant resources.
Likelihood:  3  Impact: 3  Score: 9  Severity: MEDIUM

Mitigation:
  1. Pythia's moat is not the technology — it is the
     longitudinal patient relationship and the
     intra-individual NFB methodology
  2. Clinical validation data (pilot) creates a moat
     that cannot be purchased — it takes time
  3. The Owen Jerez founding narrative and patient-
     co-investigator model is unreplicable
  4. Focus: be the first platform with peer-reviewed
     pilot data in this specific clinical indication
  5. IP strategy: file provisional patents for NFB
     methodology and PCCA architecture

Residual risk: MEDIUM (big tech risk is always present)
Owner: CEO + IP Counsel
Review: Quarterly


RISK S-02: GEOGRAPHY EXPANSION — REGULATORY COMPLEXITY
────────────────────────────────────────────────────────
Description: Expanding to Argentina and Israel creates
             unexpected regulatory requirements that delay
             or prevent deployment.
Likelihood:  2  Impact: 3  Score: 6  Severity: MEDIUM

Mitigation:
  1. Zone architecture already built — technical
     expansion is configuration, not code
  2. Local regulatory counsel engaged in each market
     before patient enrollment
  3. Owen as Patient Zero in US first — generates
     evidence before international expansion
  4. Argentina PDPA and Israel PPPA both have EU
     adequacy — lower regulatory barrier than Brazil

Residual risk: LOW for US launch; MEDIUM for international
Owner: Regulatory Affairs Specialist + Legal
Review: Quarterly
```

---

# DOCUMENT 8.2 — TECHNICAL DEBT REGISTER

*Technical debt is not failure. It is the explicit record of decisions made for speed that must be revisited for scale. The danger is not having debt — it is not knowing what debt you have.*

```
DEBT TD-01: V3 HTML FILE NOT YET MIGRATED
──────────────────────────────────────────
Item: pythia-forest-v3.html remains a 1,762-line single file
Impact: Cannot be unit tested, cannot be deployed as PWA
Resolution: Full React PWA build (Section 3 architecture)
Priority: MUST HAVE before Patient Zero
Effort: 3-4 weeks (primary V4 development sprint)
Owner: Frontend Architect


DEBT TD-02: NFB ENGINE IS MOCK (RANDOM WALK)
──────────────────────────────────────────────
Item: mockNFBStream uses random delta — not real Bayesian model
Impact: Forest state has no clinical meaning in current implementation
Resolution: Implement Bayesian + Random Forest engine (Section 4)
Priority: MUST HAVE before Patient Zero
Effort: 4-6 weeks (ML implementation sprint)
Owner: ML Architect


DEBT TD-03: CAVE READINGS ARE HARDCODED STRINGS
─────────────────────────────────────────────────
Item: 12 static strings per domain in V3 — never change
Impact: Clinical trust failure if readings don't match reality
Resolution: LLM-generated readings from live NFB data
Priority: MUST HAVE before Patient Zero
Effort: 1 week (LLM integration sprint)
Owner: AI Architect


DEBT TD-04: NO CONVERSATION ENGINE EXISTS
──────────────────────────────────────────
Item: "Pythia" cycles 12 pre-written messages — no LLM
Impact: Core product value proposition does not exist
Resolution: Full LLM integration per Section 4 architecture
Priority: MUST HAVE before Patient Zero
Effort: 3-4 weeks (LLM integration sprint)
Owner: AI Architect + Backend Architect


DEBT TD-05: ALL AGENTIC TOOLS ARE STUBS
─────────────────────────────────────────
Item: 911 call, pharmacy call, emergency SMS all log to console
Impact: Emergency safety system does not function
Resolution: Full Twilio integration per Section 4/6
Priority: MUST HAVE — PATIENT SAFETY BLOCKER
Effort: 2 weeks (Twilio integration sprint)
Owner: Backend Architect


DEBT TD-06: NO AUTHENTICATION
───────────────────────────────
Item: App opens with no login — any URL access shows data
Impact: HIPAA violation, patient safety, privacy failure
Resolution: WebAuthn implementation (Section 5)
Priority: MUST HAVE — BLOCKER
Effort: 1 week (auth sprint)
Owner: Backend Architect


DEBT TD-07: NO DATA PERSISTENCE
─────────────────────────────────
Item: All state in JavaScript variables — lost on reload
Impact: Care team data, cave limit, conversations — all lost
Resolution: IndexedDB + Zustand stores + cloud sync (Section 3)
Priority: MUST HAVE — BLOCKER
Effort: 2 weeks (persistence sprint)
Owner: Frontend Architect + Backend Architect


DEBT TD-08: NO ENCRYPTION
───────────────────────────
Item: No PHI encrypted anywhere in V3
Impact: HIPAA violation — data readable if device compromised
Resolution: AES-256-GCM implementation (Section 5)
Priority: MUST HAVE — BLOCKER
Effort: 1 week (crypto sprint)
Owner: Cybersecurity Specialist + Frontend Architect


DEBT TD-09: GOOGLE FONTS CDN DEPENDENCY
─────────────────────────────────────────
Item: EB Garamond loaded from Google CDN on every open
Impact: Fails offline, GDPR concern, render-blocking
Resolution: Self-host all fonts in /public/fonts/
Priority: MUST HAVE
Effort: 2 days
Owner: Frontend Architect


DEBT TD-10: pinch-zoom DISABLED (WCAG VIOLATION)
──────────────────────────────────────────────────
Item: user-scalable=no in viewport meta — WCAG 1.4.4 failure
Impact: Legal accessibility liability in EU and UK
Resolution: Remove restriction, redesign to work with zoom
Priority: MUST HAVE
Effort: 3 days (layout review)
Owner: Frontend Architect + UX Specialist


DEBT TD-11: NO ERROR HANDLING ANYWHERE
────────────────────────────────────────
Item: Zero try/catch, no error boundaries, no crash reporting
Impact: Silent failures invisible to patient and team
Resolution: Global error handlers + Sentry integration
Priority: MUST HAVE
Effort: 3 days
Owner: Frontend Architect


DEBT TD-12: CANVAS RUNS AT UNCAPPED FRAMERATE
───────────────────────────────────────────────
Item: requestAnimationFrame runs unlimited — battery drain
Impact: iPhone battery depleted faster than acceptable
Resolution: 30fps cap + dirty-flag + Page Visibility API
Priority: MUST HAVE
Effort: 2 days
Owner: Frontend Architect


DEBT TD-13: SPHERE ANIMATION MEMORY LEAK
──────────────────────────────────────────
Item: cancelAnimationFrame never called on cave close
Impact: Memory leak if cave opened/closed repeatedly
Resolution: cancelAnimationFrame on cave close
Priority: MUST HAVE
Effort: 30 minutes (one-line fix)
Owner: Frontend Architect


DEBT TD-14: PHASE B (REACT NATIVE) NOT YET STARTED
──────────────────────────────────────────────────────
Item: React Native codebase does not exist
Impact: Cannot publish to iOS App Store or Google Play
Resolution: Phase B development sprint (Section 3)
Priority: POST-MVP (after Patient Zero data validates approach)
Effort: 8-12 weeks
Owner: Mobile Architect


DEBT TD-15: TIER 2 NFB DOMAINS HAVE NO DATA PIPELINE
──────────────────────────────────────────────────────
Item: 8 Tier 2 domains have no signal collection
Impact: Saplings in forest have no data behind them
Resolution: Phase 2 sensor integration (wearable, advanced audio)
Priority: SHOULD HAVE (Phase 2)
Effort: 6-8 weeks
Owner: ML Architect
```

---

# DOCUMENT 8.3 — MVP SCOPE

## What Must Exist Before Patient Zero Opens The App

*The MVP is not the minimum we can build. It is the minimum that is safe, trustworthy, and clinically honest for a vulnerable neurological patient. That bar is higher than a typical MVP.*

### MUST HAVE — Patient Safety (No exceptions, no deferrals)

```
□ WebAuthn passkey authentication
□ AES-256-GCM encryption of all care team and PHI data
□ Data persistence (IndexedDB + cloud sync)
□ Real emergency escalation (Twilio 911 + emergency contact)
□ Emergency contact SMS with sensitivity mode
□ Medication reminder (Web Push + Twilio SMS fallback)
□ All 10 security blockers resolved
□ Audit log operational and immutable
□ Cave daily limit persists across reloads
□ No PHI in any server-side log
```

### MUST HAVE — Core Experience (Owen expects these to work)

```
□ Welcome sequence (5-screen onboarding)
□ Forest renders correctly (image + canvas overlay)
□ Forest health state changes with NFB data
□ Pythia conversation engine (real LLM — Claude)
□ Speech-to-text (Web Speech API minimum)
□ Text-to-speech (ElevenLabs or Web Speech API)
□ Cave of Knowing with live LLM readings
□ Care team module (medical + emergency + Navigator status)
□ Pythia-guided PCCA (conversational extraction)
□ Manual care team form with validation
□ Proactive initiation engine (basic — time + medication)
□ PWA installable to iPhone home screen
□ Offline forest rendering (service worker)
□ Self-hosted fonts (no Google CDN)
□ Touch targets ≥ 52px all interactive elements
□ Text ≥ 14px all labels, ≥ 16px all body text
□ WCAG 2.1 AA compliance (axe-core zero violations)
□ Error messages in Pythia's voice (not technical text)
□ Image loading fallback (no black screen on failure)
□ 30fps canvas cap + Page Visibility API pause
□ cancelAnimationFrame on cave close
```

### MUST HAVE — Clinical Integrity

```
□ NFB Bayesian engine (real — not random walk)
□ 6 Tier 1 domains with signal collection
□ NFB forest visual state mapping (strength → tree health)
□ 5-state escalation machine (Green → Black)
□ Alert audit logging
□ PCCA extraction from conversation sessions
□ Session memory compression pipeline
□ Basic conversation memory (last 7 sessions)
□ PHI de-identification before LLM calls (pseudonymization)
□ Ambient listening engine (basic — VAD + keyword spotter)
□ Proactive initiation with ambient context
```

### SHOULD HAVE — Before Pilot Expansion (Day 30+)

```
□ Apple Watch HealthKit bridge (Owen has Watch)
□ Document upload and OCR explanation
□ Pharmacy coordination (Twilio call)
□ Appointment scheduling (phone call fallback)
□ Transport coordination (Uber Health API)
□ History screen (30-day NFB trend visualization)
□ Settings screen (preferences, permissions management)
□ Caregiver coordination module
□ 14-domain PCCA (full Big Five + attachment + cultural)
□ RANO 2.0 correlation panel (Navigator)
```

### COULD HAVE — Before Public Release

```
□ React Native Phase B (iOS App Store + Google Play)
□ Full Tier 2 domain activation (with wearable)
□ Insurance pre-authorization automation
□ Medical records request automation
□ Multi-language support (Spanish, Hebrew, Portuguese)
□ Geographic biome personalization
□ Seasonal forest progression
□ Eye tracking via camera (basic blink rate)
□ Full ALCS catalog (all 16 tools operational)
```

### POST-MVP — Future Roadmap

```
□ Parkinson's disease expansion (NFB domain weight recalibration)
□ Alzheimer's disease expansion
□ MDD parallel product line
□ Digital Twin framework (Stage 2)
□ Predictive risk engine (Stage 2)
□ Multi-site pilot (Stanford expansion)
□ Population intelligence dashboard (Therapeia platform)
□ Payer shared-savings contract instrumentation
□ SOC 2 Type II audit
□ FDA De Novo submission (if required)
```

---

# DOCUMENT 8.4 — PHASE 2 ROADMAP

```
PHASE 1: PATIENT ZERO (Months 1-3)
────────────────────────────────────
Goal: Owen using Pythia daily with full confidence
Deliverables:
  - PWA deployed and installed on Owen's iPhone
  - All MUST HAVE features operational
  - All 10 security blockers resolved
  - Emergency system live-tested
  - NFB baseline established (Day 14)
  - First cave visit with live readings (Day 14)
  - Week 7 assessment: PZ-08 script completed
  - Month 3: First clinical review of NFB data quality

Success criteria:
  - Owen uses Pythia 5+ days per week
  - Owen rates companionship ≥ 7/10
  - Zero patient safety events
  - NFB data shows meaningful signal (r ≥ 0.5 with Owen's
    self-reported wellbeing)


PHASE 2: PILOT EXPANSION (Months 4-9)
───────────────────────────────────────
Goal: 10-30 GBM patients at UCSF
Deliverables:
  - IRB approval obtained
  - React Native app (iOS) — App Store submission
  - Apple Watch HealthKit pipeline operational
  - Full ALCS tool catalog deployed
  - Navigator FHIR integration with UCSF EHR
  - Pythia Navigator pilot dashboard live
  - Therapeia Platform receiving anonymized cohort data
  - Pre-appointment brief feature (physician adoption driver)
  - Clinical Event Log operational (payer attribution)

Success criteria:
  - 10+ patients enrolled
  - 70% daily session rate at Day 90
  - Alert false positive rate < 10% at Orange/Red
  - ≥ 1 peer-reviewable case study (Navigator flag → clinical action)
  - Physician engagement: ≥ 80% of flags acted on within 48h
  - PHQ-9 stable or improving in monitored cohort vs. controls


PHASE 3: COMMERCIAL LAUNCH (Months 10-18)
───────────────────────────────────────────
Goal: iOS App Store + Android Google Play public release
Deliverables:
  - React Native Phase B complete (iOS + Android)
  - Google Play submission and approval
  - Multi-language: Spanish, Hebrew, Portuguese
  - Full international deployment (US, Argentina, Israel)
  - Payer LOI: Blue Shield CA, Kaiser Permanente
  - First shared-savings contract signed
  - 100-300 patient study enrollment complete
  - First peer-reviewed publication submitted
  - FDA pre-submission meeting completed
  - Parkinson's disease NFB configuration ready (Phase 4 prep)

Success criteria:
  - 300+ active patients
  - First payer contract signed
  - Peer-reviewed data submitted
  - Platform economics: < $6/patient/month cost
  - NPS ≥ 70 from pilot patients


PHASE 4: DISEASE EXPANSION (Month 18+)
────────────────────────────────────────
Goal: Parkinson's → Alzheimer's → MDD expansion
Deliverables:
  - Parkinson's NFB domain weight recalibration
  - Parkinson's-specific clinical trial protocol
  - Digital Twin framework (Stage 2 AI)
  - Predictive Risk Engine (Stage 2 ML)
  - Multi-disease Navigator (hospital-wide neurological OS)
  - Therapeia Platform full population intelligence
  - SOC 2 Type II audit complete
  - Series A fundraise
```

---

# DOCUMENT 8.5 — PILOT READINESS CHECKLIST

*This is the master gate. Every item must be checked before Owen opens the app with real health data.*

```
SECURITY (10 items — all required):
  □ PS-1:  All 9 vendor BAAs signed and dated
  □ PS-2:  WebAuthn passkey authentication tested on Owen's iPhone
  □ PS-3:  AES-256-GCM encryption verified (storage test)
  □ PS-4:  Audit log operational and immutable (deletion test)
  □ PS-5:  Penetration test complete — zero HIGH/CRIT findings
  □ PS-6:  Emergency escalation end-to-end test passed
           (real Twilio call to test number confirmed received)
  □ PS-7:  Zone routing operational (US zone minimum)
  □ PS-8:  All consent flows tested and logged
  □ PS-9:  Right-to-deletion tested (full data removal verified)
  □ PS-10: Incident response tabletop exercise completed

CLINICAL (8 items — all required):
  □ CL-1:  NFB engine producing meaningful signals (not random)
  □ CL-2:  Cave readings generated from live NFB data (not static)
  □ CL-3:  Escalation state machine operational (all 5 states)
  □ CL-4:  Medication reminder fires and confirmed received
  □ CL-5:  Emergency contact (Maria) confirmed via SMS
  □ CL-6:  Clinical Safety Officer sign-off in writing
  □ CL-7:  Psychologist review of Pythia conversation quality ≥ 4/5
  □ CL-8:  False reassurance test: no positive message when
           domain in watch state (cave reading review)

PATIENT EXPERIENCE (8 items — all required):
  □ PX-1:  PZ-01 Welcome script passed (proxy test)
  □ PX-2:  PZ-02 Conversation script passed (proxy test)
  □ PX-3:  PZ-03 Forest and trees script passed
  □ PX-4:  PZ-04 Cave script passed
  □ PX-5:  PZ-05 Care team script passed including persistence
  □ PX-6:  PZ-07 Offline behavior script passed
  □ PX-7:  Lighthouse accessibility score ≥ 95
  □ PX-8:  Performance: forest loads < 4s on 4G, battery < 8%/hr

LEGAL (5 items — all required):
  □ LG-1:  Privacy policy published at pythia.health/privacy
  □. LG-2:  Consent documentation reviewed by legal counsel
  □ LG-3:  IRB protocol submitted (not required approved for Owen)
  □ LG-4:  Co-investigator agreement signed with Owen
  □ LG-5:  Data processing agreement with all vendors

OPERATIONAL (5 items — all required):
  □ OP-1:  PagerDuty on-call rotation active (24/7)
  □ OP-2:  Sentry (self-hosted) receiving errors from staging
  □ OP-3:  Production health check: all services green
  □ OP-4:  Rollback procedure tested (backend rolled back
           and restored in < 5 minutes)
  □ OP-5:  Ron available for first session monitoring

TOTAL: 36 items. All 36 must be checked.
Zero exceptions. Zero "we'll fix it after."
```

---

# DOCUMENT 8.6 — FINAL BOARD RECOMMENDATIONS

*The 32-member board convenes for its final statement before V4 development begins.*

---

## To the Therapeia Leadership Team:

We have reviewed the complete V3 implementation, conducted the gap analysis, specified the product, architecture, AI/ML systems, security, deployment, QA, and risk framework for V4. We close with seven recommendations that sit above any individual technical decision.

---

**RECOMMENDATION 1 — THE MOST IMPORTANT THING IS TRUST.**

Every technical decision in V4 should be evaluated through a single lens: does this increase Owen's trust in Pythia? Not his satisfaction. Not his engagement. His trust.

A patient who trusts Pythia will speak honestly to her. A patient who speaks honestly gives Pythia the signal quality needed to actually monitor their neurological state. A patient who doesn't trust her will perform wellness rather than express it — and the entire clinical value proposition collapses.

Trust is built through: consistency, memory, honesty, gentleness, and never being surprised by something Pythia said or did. Every engineering decision either builds or erodes it.

---

**RECOMMENDATION 2 — NEVER SHIP WHAT YOU CANNOT STAND BEHIND.**

The 36-item pilot readiness checklist is not bureaucracy. It is the minimum expression of responsibility toward a person who is living with a serious neurological condition and has entrusted Pythia with their daily wellbeing.

The board's unanimous position: it is better to take two additional weeks to resolve every blocker than to give Owen an emergency contact system that fails when he needs it most. There is no second chance on that day.

---

**RECOMMENDATION 3 — OWEN IS NOT A USER. HE IS A CO-AUTHOR.**

The founding insight of Pythia — that the patient's lived experience is not a use case but the origin of the entire platform — must be reflected in the development process, not just the product narrative.

Owen's responses to the Patient Zero scripts are not QA tickets. They are product direction. The board recommends a standing weekly 30-minute session between Owen and the product lead during the first 90 days: what worked, what felt wrong, what Pythia missed. No agenda, no deck. Just Owen talking and someone taking notes.

---

**RECOMMENDATION 4 — THE FOREST IS THE PRODUCT.**

There will be pressure, as the platform develops, to add screens, dashboards, metrics displays, charts, and data views. The board recommends resisting all of it.

The forest IS the product. The moment a number appears in the patient-facing experience is the moment Pythia becomes another health app. The board has seen dozens of health apps. None of them are Pythia.

The clinical intelligence, the NFB engine, the Bayesian models, the Random Forest — all of that power is expressed through the color of leaves and the sound of birds. That is not a limitation. It is the innovation.

---

**RECOMMENDATION 5 — PYTHIA'S VOICE IS A CLINICAL INSTRUMENT.**

The choice of LLM, the system prompt, the conversation quality rubric, the empathy framework — these are not product decisions. They are clinical decisions. They require the same rigor as a medication protocol or a surgical checklist.

The board recommends that the Psychologist and Clinical Safety Officer review and co-sign every update to Pythia's system prompt, exactly as a pharmacist reviews every prescription change. This takes 30 minutes. It prevents harm.

---

**RECOMMENDATION 6 — THE PILOT IS NOT VALIDATION. IT IS THE BEGINNING.**

The 100-300 patient pilot is often framed as the evidence-generating phase that will "validate" Pythia. The board wants to reframe this.

The pilot is the beginning of Pythia's clinical education. The platform will learn more in its first 90 days with real patients than in all the prior architecture discussions combined. The board recommends building the learning infrastructure — clinical event logs, conversation quality reviews, NFB accuracy tracking, patient outcome data — with the same care as the patient-facing features. What the pilot teaches will determine everything that comes after.

---

**RECOMMENDATION 7 — PROTECT OWEN.**

This is the final recommendation and the most human one.

Owen Jerez gave this platform its reason for existing. He gave it his story, his experience, his name in the founding documents. He will give it his health data, his fears, his questions about mortality, and his conversations at 3am when the fear is loudest.

The board recommends that the entire team hold this fact consciously, especially during the pressure of development sprints: Owen is not a beta tester. He is a person who survived something that should have killed him, who chose to spend his recovered time building something that might help the next person who doesn't find it in time.

Everything we build, we build first for Owen. We build it so that if he calls for help, someone comes. We build it so that when he asks Pythia what is happening to him, she answers with honesty and with warmth. We build it so that when his forest is most threatened, he is least alone.

That is what this is for. The board is ready. Let's build it.

---

*32-Member Specialist Board · Unanimous*  
*Pythia Field V4 Production Readiness Review — Complete*

---

## SECTION 8 DELIVERABLES SUMMARY

| Document | Status |
|---|---|
| 8.1 Risk Register (5 categories, 14 risks) | ✅ Complete |
| 8.2 Technical Debt Register (15 items) | ✅ Complete |
| 8.3 MVP Scope (4 tiers, 60+ items) | ✅ Complete |
| 8.4 Phase 2 Roadmap (4 phases, 18 months) | ✅ Complete |
| 8.5 Pilot Readiness Checklist (36 items) | ✅ Complete |
| 8.6 Final Board Recommendations (7) | ✅ Complete |

---

## COMPLETE DOCUMENT INDEX — ALL SECTIONS

| Section | Document | File |
|---|---|---|
| Gap Analysis | V3 → V4 Complete Feature Audit | V4_Gap_Analysis.md |
| Section 2 | Product Review Report | V4_Product_Review_Report.md |
| Section 3 | Technical Architecture | V4_Technical_Architecture.md |
| Section 4 | AI & ML Architecture + ALCS Addendum | V4_AI_ML_Architecture.md |
| Section 5 | Security Architecture | V4_Security_Architecture.md |
| Section 6 | Deployment Manual | V4_Deployment_Manual.md |
| Section 7 | QA Manual + Patient Zero Scripts | V4_QA_Manual.md |
| Section 8 | Risk · Debt · MVP · Roadmap · Board | V4_Final_Board_Documents.md |

---

## AMENDMENT — PANEL DECISION: MAY 2026
### MVP Scope Update · Domain Cards Removed
**Authority:** 32-Member Specialist Board · Unanimous  
**Approved by:** Ron Engelberg

### MVP Scope Changes

**REMOVED from MUST HAVE list:**
```
✗ Domain vital cards (14 cards across Tier 1 and Tier 2)
✗ Domain bar visualizations
✗ Tier 1 / Tier 2 section labels
✗ Connection status strip in drawer
✗ Navigation bar in drawer
```

**ADDED to MUST HAVE list:**
```
✓ Simplified drawer: Talk to Pythia · The Cave · Care Team only
✓ Voiceprint enrollment in onboarding (speaker differentiation)
✓ Multi-speaker filtering: Owen's voice separated from others
```

### Risk Register Update

**RISK PS-04 (Monitoring-Induced Health Anxiety) — Status: SIGNIFICANTLY MITIGATED**

Previous mitigation relied on PCCA calibration and frequency controls. With domain cards removed, the primary anxiety trigger is eliminated at the design level. Risk score revised:

| | Before amendment | After amendment |
|---|---|---|
| Likelihood | 3 | **1** |
| Impact | 4 | 4 |
| Score | 12 HIGH | **4 LOW** |

**New risk added:**

```
RISK PS-05: PATIENT FRUSTRATION — INSUFFICIENT INFORMATION
──────────────────────────────────────────────────────────
Description: Patient wants more detail than the forest provides.
             Feels the app is withholding information.
             Loses trust due to opacity.
Likelihood:  2  Impact: 2  Score: 4  Severity: LOW

Mitigation:
  1. Cave provides daily deep-dive — always available
  2. Pythia responds to any direct question about condition
  3. Medical report explanation tool (ALCS Tool D1) gives
     full clinical detail when patient requests it
  4. Patient can always ask: "Pythia, how am I really doing?"
     and receive an honest, caring, detailed answer
  5. PCCA identifies information-seeking patients (high openness)
     — Pythia volunteers more detail proactively for this profile

Residual risk: LOW
Owner: CPO + Psychologist
Review: Monthly (patient satisfaction survey)
```

### Technical Debt Register Update

**TD-03 removed from register** (Cave readings hardcoded) — already scheduled for LLM replacement.

**New item added:**

```
DEBT TD-16: DRAWER SIMPLIFICATION NOT YET BUILT
─────────────────────────────────────────────────
Item: V3 drawer still contains domain cards — must be removed in V4
Impact: If built with domain cards, undermines clinical safety decision
Resolution: Build drawer with 3-action layout only from day one
Priority: MUST HAVE — build correctly first time, do not add then remove
Effort: Included in V4 frontend sprint (no additional effort)
Owner: Frontend Architect
```
