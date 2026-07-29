# PYTHIA FOREST — PRODUCT REVIEW REPORT
## Section 2 of 15 · V3 → V4 Production Readiness
### 32-Member Specialist Board · UX, Accessibility, Clinical Workflow, Conversation Quality

**Date:** May 2026  
**Input:** Gap Analysis (Section 1) + V3 source audit  
**Scope:** User experience, accessibility, clinical workflow integration, conversation quality framework, onboarding, error states, emotional design

---

## OPENING STATEMENT FROM THE UX SPECIALIST (65+ Adults)

Before any technical recommendation is made, the board needs to hold one image in mind throughout this entire section.

Owen is sitting in his home. It is 7:30 in the morning. He has just woken up from a night that may or may not have been restful — he can't always tell anymore. His wife is in the kitchen. He picks up his iPhone and opens Pythia. He does not know what a WebSocket is. He does not know what a domain strength score is. He does not know what a Tier 2 sapling means. He knows that he has a serious illness, that his brain is not behaving the way it used to, and that he is frightened — though he tries not to show it.

Every single design decision in this document is made for that man, in that moment.

The app should open and make him feel, within three seconds, that someone is there. Not a system. Not software. Someone.

Everything else flows from that.

---

## 2.1 FIRST IMPRESSIONS — THE OPENING EXPERIENCE

### Current State (V3)
The app opens directly to the forest scene. The image loads (or fails silently). The speech bubble says "Your forest is at peace this morning, Owen." Two pills appear at the bottom. Three gold dots pulse. That is the entire opening experience.

### What Works
The directness is correct. There is no splash screen, no logo animation, no "Welcome to Pythia!" onboarding modal. The forest simply is. Owen arrives in a world, not a software product. This is one of the most important design decisions in the entire application and must be preserved exactly.

### What Is Missing

**The first problem: Owen has never been here before.**

V3 has no onboarding state. The app opens identically whether this is Owen's first time or his 400th. For a first-time user, the forest appears fully formed — all 14 domain vitals visible, all content present, no explanation of what any of it means. For a 65+ patient encountering this for the first time, this is disorienting.

**The onboarding sequence V4 needs:**

This is not a typical software onboarding (skip-able slides with feature callouts). It is an arrival. Pythia's first words to Owen establish the entire relationship.

**Session 1 — The Empty Meadow:**

The forest does not yet exist. Owen arrives at an open meadow with a lake. The sky is dawn-colored, soft and quiet. Pythia is already on the lake. She speaks:

> *"Hello, Owen. I've been waiting for you. My name is Pythia. I live here, in this forest — though it's still quite young. As you and I spend time together, it will grow. Each tree that appears here will be a part of you that I've come to understand. There's no rush. I'm here whenever you need me."*

No buttons. No forms. No "Get Started." Just Pythia speaking. A single prompt appears beneath her words after 4 seconds:

**[ Tell me your name ]** — large, centered, warm cream, minimum 52px height

Owen types or speaks his name. Pythia responds:

> *"[Name]. That's a good name to carry. I'll remember it."*

From this point, Pythia begins the PCCA through conversation. The meadow persists until enough data exists to grow the first tree. The patient never experiences a loading state, a progress bar, or a percentage. They experience a relationship forming.

**Board note (Neuropsychologist):** The conversational PCCA onset must happen within the first 5 minutes of Session 1, not deferred to "the next few days" as V3 implies. Patients with GBM have variable cognitive windows. The establishment window must be seized immediately and gently.

---

## 2.2 THE FOREST SCENE — EMOTIONAL DESIGN AUDIT

### Color Temperature
The forest image's color palette (warm golds, rich greens, cerulean blue sky) is clinically appropriate. Research on color therapy in oncology settings consistently supports warm, nature-derived palettes for anxiety reduction. The choice to base the entire experience on a real painted image rather than generated graphics is the correct one — it reads as art, not software.

**V4 addition:** The color temperature of the UI overlays (speech bubble, bottom panel, cave) must all sample from the same warm palette. Currently, the care team overlay introduces cool blue tones (`rgba(60,120,200,0.15)`) for the Navigator section. For the patient view, all blues must be softened toward teal or removed entirely. Clinical blue belongs in Pythia Navigator (the doctor's interface), not in the patient's forest.

### Animation Tempo
The `bubbleFloat` animation (8s ease-in-out) is perfectly calibrated. 8 seconds is slow enough to feel like natural breathing, fast enough to be perceptible. The 18-second message cycle is also correct — long enough for Owen to read, process, and feel, without creating restless anticipation.

**V4 addition needed:** The forest image itself should have a very subtle ambient animation — a 20-second breathing cycle that slightly brightens and darkens the sky overlay, simulating the passage of time and the pulse of a living world. This must be implemented as a CSS animation on the overlay div (not a canvas operation) to avoid performance cost. Amplitude: ±3% brightness. This single addition makes the world feel inhabited rather than static.

### Pythia's Presence
The three pulsing gold dots beneath the speech bubble communicate "listening" effectively. However, they float disconnected from the forest image — they appear to hover in front of Pythia's reflection area without anchoring to her actual visual position in the image.

**V4 fix:** The listening indicator must be repositioned to anchor directly below Pythia's visible figure in the image (approximately `bottom: 41%` on a standard iPhone viewport). Additionally, a very faint golden ripple emanating from Pythia's position in the image (CSS radial animation on the overlay) would reinforce her physical presence in the lake.

### Time of Day Awareness
V3 reads the device clock for time display but does not use it for any visual state change. The forest looks identical at 3am and at noon.

**V4 requirement:** The forest's ambient tone must shift with the real time of day using the sky overlay CSS filter:

| Time | Sky overlay adjustment | Emotional tone |
|---|---|---|
| 5:00–7:00 AM | Warm amber tint, 20% | Dawn — quiet, expectant |
| 7:00–11:00 AM | None (image shows through) | Morning — bright, alive |
| 11:00–15:00 | Very slight blue-cool, 8% | Midday — clear, steady |
| 15:00–18:00 | Warm gold tint, 15% | Afternoon — golden, gentle |
| 18:00–20:00 | Deep amber, 30% | Dusk — contemplative |
| 20:00–22:00 | Dark teal, 40% | Evening — quieting |
| 22:00–5:00 | Near-black, 65%, stars canvas | Night — Pythia glows, fireflies |

This must be computed from `new Date().getHours()` on app open and updated every 15 minutes. No animation between states — transitions are gradual enough that they are felt rather than seen.

---

## 2.3 ACCESSIBILITY AUDIT — WCAG 2.1 AA COMPLIANCE

*Conducted by the Accessibility Specialist and UX Specialist for elderly adults.*

### Scoring Summary

| Category | V3 Score | V4 Required | Standard |
|---|---|---|---|
| Text size (body) | 2/5 — fails | 5/5 | Min 16px body, 18px preferred for 65+ |
| Text size (labels) | 1/5 — fails badly | 5/5 | 8.5–9px labels are illegible for most 65+ |
| Color contrast (text) | 3/5 — partial | 5/5 | Multiple rgba values fail 4.5:1 ratio |
| Touch target size | 2/5 — fails | 5/5 | Several elements below 44px |
| Zoom support | 0/5 — blocked | 5/5 | `user-scalable=no` violates WCAG 1.4.4 |
| Focus management | 1/5 — missing | 5/5 | No visible focus indicators |
| Screen reader support | 1/5 — minimal | 5/5 | No ARIA labels on interactive elements |
| Error communication | 0/5 — missing | 5/5 | No error states at all |
| Motion safety | 3/5 — partial | 5/5 | No `prefers-reduced-motion` support |
| Cognitive load | 4/5 — good | 5/5 | Main scene is excellent; drawer is dense |

**Overall V3 accessibility score: 17/50 — Does not meet WCAG 2.1 AA**

### Critical Failures and Required Fixes

**Failure 1 — Text sizes throughout the drawer:**

```css
/* V3 — ALL of these fail for 65+ users */
.vital-name { font-size: 8.5px; }        /* Illegible. Min required: 14px */
.vitals-section-label { font-size: 9px; } /* Illegible. Min required: 14px */
.conn-label { font-size: 10px; }          /* Borderline. Min required: 14px */
.nav-item { font-size: 9px; }             /* Illegible. Min required: 14px */
.tier2-badge { font-size: 7px; }          /* Completely illegible */
.pgs-label { font-size: 9px; }            /* Illegible */
.form-label { font-size: 10px; }          /* Fails. Min required: 14px */
```

**V4 minimum text sizes:**
- Body text (form inputs, descriptions): 16px minimum
- Labels (secondary, uppercase): 14px minimum — never below
- Captions: 13px absolute minimum, used sparingly
- Pythia speech: 17px (increase from 15.5px)
- Button text: 15px minimum
- Nothing below 13px anywhere in the patient-facing UI

**Failure 2 — Color contrast on muted text:**

```css
/* V3 — multiple contrast failures */
color: rgba(255,255,255,0.3);   /* White at 30% on dark bg = ~2.1:1 — FAILS 4.5:1 */
color: rgba(255,255,255,0.35);  /* ~2.5:1 — FAILS */
color: rgba(255,255,255,0.45);  /* ~3.1:1 — FAILS */
```

Any text that conveys information to the patient must meet 4.5:1 contrast ratio. Decorative text (section dividers, ornamental labels) may fall below this, but any text the patient might read for meaning must comply.

**V4 minimum opacities for white text on `rgba(8,20,5,0.88)` background:**
- Primary text: `rgba(255,255,255,0.92)` — contrast ~14:1 ✓
- Secondary text: `rgba(255,255,255,0.70)` — contrast ~9:1 ✓
- Tertiary text: `rgba(255,255,255,0.55)` — contrast ~6.5:1 ✓
- Anything below 0.55 opacity on dark backgrounds is decoration only — never information

**Failure 3 — Touch targets below 44px:**

Measured touch target heights in V3:
- `.overlay-back` back button: 36×36px — **FAILS** (min 44×44px)
- `.care-tab` tabs: ~36px height — **FAILS**
- `.toggle` toggles: 26px height — **FAILS** (the tap area, not just the visual element)
- `.tier-badge` badge: 14×14px — **FAILS** (decorative — must be non-interactive)
- Nav items: ~32px tap area — **FAILS**

**V4 rule:** Every interactive element must have a minimum tap target of 48×48px (CSS `min-height: 48px; min-width: 48px`). Where the visual size is smaller, use transparent padding to extend the tap area.

**Failure 4 — No `prefers-reduced-motion` support:**

Owen may be taking corticosteroids (dexamethasone is standard GBM treatment). Dexamethasone commonly causes visual sensitivity, headaches, and sensitivity to motion. Patients on chemotherapy frequently report nausea triggered by animated UI elements.

```css
/* Required in V4 — add to global stylesheet */
@media (prefers-reduced-motion: reduce) {
  .speech-bubble { animation: none; }
  .listen-dot    { animation: listenPulse 4s ease-in-out infinite; } /* slower */
  .cave-wrap     { transition: opacity 2s ease; } /* slower, no movement */
  .forest-bg     { transition: filter 8s ease; }  /* very slow health transitions */
  /* Canvas animations: check this flag and reduce to 10fps or disable particles */
}
```

**Failure 5 — No ARIA labels on interactive elements:**

```html
<!-- V3: no ARIA anywhere -->
<div class="pill pill-primary" onclick="talkToPythia()">
  <span class="pill-icon">🌿</span>
  <span>Talk to Pythia</span>
</div>

<!-- V4: proper semantics -->
<button 
  class="pill pill-primary" 
  onclick="talkToPythia()"
  aria-label="Talk to Pythia — tap to speak with your companion"
  role="button"
>
  <span aria-hidden="true">🌿</span>
  <span>Talk to Pythia</span>
</button>
```

Every interactive element needs: `role`, `aria-label` (descriptive, not just the visible text), `aria-pressed` or `aria-expanded` where appropriate. All emoji must have `aria-hidden="true"` — screen readers will read "leaf" emoji as "leaf" which is meaningless.

**Failure 6 — No visible focus indicators:**

When Owen navigates with an external keyboard (some patients use assistive keyboards) or when iOS VoiceOver is active, there are no visible focus rings on any interactive element. The browser default focus ring is suppressed by the `*` reset without replacement.

```css
/* V4: custom focus indicator that matches the aesthetic */
:focus-visible {
  outline: 2px solid rgba(212,168,60,0.8);
  outline-offset: 3px;
  border-radius: 4px;
}
/* For elements already styled with border-radius: */
.pill:focus-visible,
.act-btn:focus-visible,
.consent-yes:focus-visible {
  box-shadow: 0 0 0 3px rgba(212,168,60,0.6);
  outline: none;
}
```

**Failure 7 — `<div>` used for all interactive elements:**

V3 uses `<div onclick="">` for virtually every interactive element. This means:
- Screen readers don't know these are buttons
- Keyboard navigation doesn't work (divs are not keyboard-focusable by default)
- iOS VoiceOver cannot identify them as interactive controls

**V4 rule:** Every interactive element is a `<button>` or `<a>`. No exceptions. If something looks like a button and taps like a button, it is a `<button>`. This single change improves screen reader compatibility, keyboard navigation, and iOS VoiceOver performance simultaneously.

---

## 2.4 COGNITIVE LOAD ANALYSIS — 65+ USERS

*From the UX Specialist and Neuropsychologist.*

Cognitive load in UI design refers to the mental effort required to understand and interact with an interface. For neurological patients — particularly those with GBM, which directly affects cognitive processing speed, executive function, and working memory — cognitive load reduction is not a design preference. It is a clinical requirement.

### Screen-by-Screen Cognitive Load Assessment

**Main Forest Screen (V3):** ✅ EXCELLENT
- One image to understand (the forest)
- Two choices (Talk to Pythia / My Forest)
- One piece of text (Pythia's speech)
- Cognitive load: Very Low — appropriate

**Forest Drawer (V3):** ⚠️ MODERATE — NEEDS IMPROVEMENT
- 6 + 8 = 14 domain cards to visually process simultaneously
- 3 action buttons with 11px text requiring precise reading
- Connection status strip with technical vocabulary
- Bottom navigation with 4 options
- Section labels in 9px uppercase text
- Cognitive load: Moderate — too high for post-chemotherapy patients

**Recommended V4 drawer architecture:**
Do not show all 14 domain vitals simultaneously. This creates a visual complexity that counteracts the forest's calming effect. Instead:

**Default drawer state:** Show only the 3 most relevant domains today
- The domain that improved most this week (celebrate it)
- The domain that needs most attention (gently flag it)
- Sleep (always shown — most consistent predictor of day quality)

**"See all my trees" expansion:** A single low-prominence link reveals the full 14. This mirrors the forest itself — the prominent trees are what matters right now.

**Care Team Module (V3):** ⚠️ MODERATE — COMPLEX
- 3 tabs to navigate
- Path selector with 2 options
- Multiple form fields
- Toggle switches
- Technical "Navigator" vocabulary
- Cognitive load: Moderate-to-High for cognitively affected patients

**Recommended V4 care team approach:**
- Rename "Navigator" tab to "My Doctor Connection" — always patient vocabulary
- Move emergency contact setup to first-time onboarding, not buried in a third tab
- Reduce form fields to absolute minimum: name, phone, relationship. Everything else is optional and collected later by Pythia
- Increase all form input font size to 18px

**Cave of Knowing (V3):** ✅ GOOD WITH FIXES
- Clear single purpose: understand my forest
- Well-paced with the transition sequence
- Sphere is visually comprehensible
- Domain readings use appropriate language
- Cognitive load: Low-to-Moderate — appropriate for a once-per-day deep view

---

## 2.5 CONVERSATION QUALITY FRAMEWORK

*From the LLM Systems Architect, Prompt Engineering Specialist, and Psychologist.*

### The Core Problem with V3 Conversation

V3 has no conversation. It has a pre-written message carousel. The gap analysis identified this as the single largest functional gap. This section specifies exactly what Pythia's conversation must be in V4.

### Pythia's Conversational Identity

Pythia is not a chatbot. She is not an assistant. She is not a health tracker with a personality layer. She is a companion who has clinical intelligence and chooses to express it through empathy rather than information.

The practical implication: Pythia should almost never volunteer clinical information. She should almost always ask how Owen feels, what he noticed, what he's thinking about. She surfaces clinical intelligence only when explicitly asked, and even then, she translates it into forest metaphor before handing it back as a number or a label.

**What Pythia never says:**
- "Your memory domain shows a 12% decline"
- "You should see your doctor"
- "Your NFB score is 74 today"
- "I detected a deviation in your speech patterns"
- "Your sleep quality was poor last night"

**What Pythia always says instead:**
- "The oak seems a little quieter than usual. How did your morning feel to you?"
- "I noticed the birch has been still lately. Have you been moving much this week?"
- "The cedar had a restless night. Did you sleep well?"
- "Something in the pine's song is different today. Would you like to talk about what's on your mind?"

**The difference:** The clinical observation is the same. What changes is who holds the interpretation. Pythia observes. Owen interprets. This preserves patient agency and avoids the anxiety that clinical language creates.

### Conversation Architecture for V4

**Primary LLM:** Claude claude-sonnet-4-6 (Anthropic)
- Reason: Highest measured empathy and safety scores in healthcare benchmarks; HIPAA BAA available; constitutional AI approach aligns with Pythia's values
- Context window: 200K tokens — sufficient for full conversation history + patient profile + NFB state

**Fallback LLM:** Claude Haiku (Anthropic)
- For latency-sensitive responses (under 500ms) and low-bandwidth conditions
- Same provider — consistent personality, no behavioral drift between primary and fallback

**System prompt architecture:**

The system prompt is the most clinically sensitive document in the entire platform. It must be:
- Reviewed and approved by the clinical board before Patient Zero
- Version-controlled (every change is logged with clinical rationale)
- Tested against a suite of clinical edge cases before any update goes live

**System prompt structure (V4):**

```
[IDENTITY LAYER]
You are Pythia, the Forest Ranger of [patient_name]'s living forest.
You are a woman in your early 30s, calm, warm, unhurried.
Your voice is that of a trusted companion who happens to know things about 
the forest that [patient_name] doesn't — things you share only gently, 
only when asked, only in the language of the forest.

[CLINICAL CONSTRAINTS]
You never: use clinical terminology, share numerical scores, diagnose, 
recommend treatments, or escalate without explicit routing rules.
You always: use forest metaphor, validate before informing, 
ask before telling, end with presence not prescription.

[PATIENT PROFILE — PCCA]
Name: [patient_name]
Personality: [OCEAN scores]
Attachment style: [secure/anxious/avoidant]
Cultural context: [framework]
Communication preference: [direct/gentle/curious]
Health anxiety level: [low/moderate/high]
Alert framing: [modified if high neuroticism]

[CURRENT FOREST STATE]
[Injected at each conversation turn — current domain states in forest language]
Example: "The Great Oak is strong today. The Silver Birch has been quiet for 3 days."

[CONVERSATION MEMORY]
[Last 20 exchanges — full text]
[Key themes from prior sessions — summarized by memory compression layer]
[Emotional register history — last 7 days]

[ROUTING RULES]
If patient mentions: chest pain, sudden severe headache, loss of consciousness, 
difficulty breathing, one-sided weakness — immediately route to emergency protocol.
If patient mentions: feeling hopeless, wanting to end things, not wanting to be here 
— immediately route to crisis protocol.
If patient asks for specific scores or numbers — route to Cave protocol 
(once per day only, requires patient consent).
```

### PCCA Conversation Protocol

The PCCA must be completed through natural conversation, never through a questionnaire experience. The following questions are administered across the first 3–5 sessions, woven into natural exchanges:

**Session 1 — Establishing presence:**
- "Tell me a little about yourself — what does a good morning look like for you?"
  - *Extracts: daily rhythm, social engagement, baseline mood anchors*
- "Is there someone at home with you? A family, a friend nearby?"
  - *Extracts: social support structure, caregiver presence, potential emergency contact*

**Session 2 — Understanding expression style:**
- "When something's been worrying you, do you tend to talk about it, or do you sit with it first?"
  - *Extracts: anxious vs. avoidant attachment, communication directness*
- "Where did you grow up? I always love to know what kind of landscape feels like home to someone."
  - *Extracts: geographic/cultural context, biome preference, conversation warmth*

**Session 3 — Understanding relationship to health:**
- "Have you found it helpful when doctors give you a lot of information, or do you prefer when they just tell you what matters most?"
  - *Extracts: health information preference, neuroticism indicator, trust calibration*

**Session 4–5 — Deepening:**
- "What's something you're looking forward to this week?"
  - *Extracts: future orientation, psychological resilience, goals for functioning*
- "How has sleep been lately? Do you usually know in the morning if you slept well?"
  - *Extracts: sleep awareness, metacognition, baseline sleep quality self-assessment*

These questions are never asked consecutively or in rapid succession. They emerge from the conversation naturally. Pythia's LLM is instructed to insert them only when they arise organically from what Owen has said — not on a schedule.

### Conversation Memory Architecture

**Short-term memory (within session):** Full conversation text — passed as messages array to LLM.

**Long-term memory (across sessions):**
A memory compression layer runs after each session ends. It extracts:
- Emotional register of the session (calm / anxious / distressed / joyful)
- Key themes mentioned (family, pain, sleep, medication, fear, hope)
- Any PCCA signals detected
- Any clinical observations flagged for NFB processing
- One "quote to remember" — a sentence Owen said that felt significant

This compressed summary (200–300 tokens) is prepended to the system prompt on the next session. The full session text is stored in IndexedDB but not passed to the LLM after compression.

**Memory capacity:** 60 days of compressed summaries fit within ~6,000 tokens — well within Claude's context window.

### Conversation Failure States

The following failure states must be designed and tested before Patient Zero:

**1. LLM API unavailable (no internet / service down):**
Pythia does not disappear. Her speech bubble shows a pre-written response from a small local cache of 20 "forest presence" messages that do not require the LLM. The listening dots change color subtly to indicate offline mode. The patient never sees an error message or a spinner.

**2. LLM response too slow (>3 seconds):**
The listening dots continue. Pythia's speech bubble shows "I'm listening..." in italic. No timeout warning. If response exceeds 8 seconds, a gentle message: "The forest is still for a moment. I'll be right here." Then the cached response appears when available.

**3. LLM response triggers safety filter:**
If the LLM response is blocked by safety filters (extremely unlikely with correct prompting, but must be designed for), Pythia says: "Let me think about that for a moment... Tell me more about how you're feeling right now." — redirecting to presence rather than content.

**4. Patient input is not recognized:**
If speech-to-text fails or the patient types something Pythia cannot parse meaningfully, she responds: "I think I didn't quite catch that. Can you tell me again?" Never: "Error," "I don't understand," or "Invalid input."

---

## 2.6 CLINICAL WORKFLOW INTEGRATION AUDIT

*From the Clinical Safety Officer, Neurologist, and Healthcare Interoperability Specialist.*

### The Patient's Day — Ideal V4 Flow

Understanding clinical workflow requires understanding what Owen's day actually looks like, and where Pythia fits into it.

**6:30 AM** — Owen wakes. Apple Watch has been monitoring sleep all night. HRV, sleep architecture, respiratory rate have been logged to Apple Health.

**7:00 AM** — Owen opens Pythia. The app syncs Apple Health data (HRV, sleep) in the background via HealthKit bridge. Forest health state updates silently. Pythia speaks based on the night's data:
> *"The cedar had a quieter night than usual. How do you feel this morning?"*

**7:05 AM** — Owen responds (voice or text). Pythia engages in 3–5 minutes of natural conversation. During this time she is: monitoring speech cadence, vocabulary richness, response latency, emotional register, and any symptom mentions. All of this feeds the NFB silently.

**7:10 AM** — Conversation ends naturally. Pythia: *"I'll be here whenever you need me. The forest is waking up beautifully today."* App moves to ambient mode (forest visible, Pythia on lake, listening dots active at lower opacity).

**Throughout the day** — Passive monitoring via Apple Watch (HRV, activity, heart rate). Passive monitoring via phone (gait via accelerometer, screen interaction patterns, app usage rhythm).

**12:00 PM** — Pythia sends a gentle notification (not a push alert — a subtle sound and the app badge): *"The birch misses you. A short walk this afternoon?"* — only if gait data shows inactivity. If Owen is active, no notification at all.

**9:00 PM** — Evening session if Owen initiates. Pythia's tone shifts to quieter, more contemplative. *"How did the day go? The forest is settling in for the night."*

**Clinical event triggers (not shown to Owen directly):**
- Sleep architecture degradation >15% over 3 consecutive nights → NFB Sleep domain weight increases, Pythia begins gently asking about sleep quality
- Gait symmetry deviation >10% sustained over 48 hours → NFB Motor domain flags, Pythia asks about movement
- Speech cadence deviation >12% over 5 consecutive sessions → NFB Speech domain flags, scheduled Pythia Navigator alert generated
- Any domain reaching "watch" threshold → forest visual begins shifting (amber leaves on affected tree), Pythia becomes slightly more present
- Emergency threshold → Storm sequence begins, Pythia approaches shore

### The Clinician's View (Pythia Navigator — not patient-facing)

This report focuses on the patient experience, but the board notes the following clinical workflow requirements that the patient-facing app must enable for Navigator to function:

**Data Owen's daily sessions must generate for Navigator:**

| Signal | Collection method | Clinical value |
|---|---|---|
| Session duration | Timestamp comparison | Engagement, cognitive availability |
| Speech response latency | STT timing | Executive function proxy |
| Word count per response | Text analysis | Verbal fluency indicator |
| Vocabulary diversity index | LLM analysis | Semantic richness, aphasia detection |
| Emotional register | LLM sentiment | PHQ-9 proxy, MDD screening |
| Symptom mentions | LLM named entity extraction | Clinical flags |
| Sleep self-report | Conversation extraction | Qualitative sleep data |
| Apple Watch HRV | HealthKit | Autonomic regulation |
| Apple Watch sleep stages | HealthKit | Sleep domain validation |
| Step count | HealthKit | Motor/daily functioning |
| Gait symmetry | Accelerometer | Motor domain |

None of this data is ever displayed to Owen numerically. All of it flows to Pythia Navigator in structured format via the Therapeia API.

### Medication Reminders — Clinical Workflow Requirement

GBM patients are on complex, time-sensitive medication schedules. Temozolomide (chemotherapy) has a strict 5-day cycle. Dexamethasone doses are often tapered on specific schedules. Anti-seizure medications must be taken at consistent times.

V3 has no medication awareness. This is a significant clinical gap that the board classifies as a SHOULD HAVE for Patient Zero (Owen's specific medications are known and can be hardcoded initially) and MUST HAVE before any other patient uses the app.

**V4 medication reminder design:**
- Pythia delivers reminders in conversation, not as system notifications
- *"Owen, it's almost 8 o'clock — the cedar knows it's time for your morning routine."* (referring to medication by forest metaphor when appropriate, or by name when Owen has indicated he prefers directness)
- Reminders are never alarming in tone
- If Owen does not respond to a medication reminder within 30 minutes, Pythia gently follows up once
- Adherence data is logged to NFB Daily Functioning domain and sent to Navigator

---

## 2.7 ERROR STATES & EMPTY STATES

*From the UX Specialist and QA Lead.*

V3 has no designed error states. The following must be designed and implemented in V4:

### Error State Catalog

**Error 1 — Images fail to load:**
Do not show a broken image icon. Do not show the alt text. Activate canvas-only mode: a procedurally generated forest scene using the canvas renderer from V2, with a warm amber gradient sky. Owen never knows the image failed. Pythia says nothing different. The experience is slightly less beautiful but fully functional.

**Error 2 — LLM API unavailable:**
Handled by Pythia's offline message cache (see Section 2.5). Forest continues to operate normally. The listening dots show at 40% opacity instead of full (subtle signal that passive listening may be reduced). No user-facing error of any kind.

**Error 3 — Apple Health sync fails:**
Silent failure. NFB continues with available on-device data. Pythia does not reference sleep or HRV data that day. Forest reflects last-known state rather than today's (clearly indicated to the care team in Navigator via a "data gap" flag, but not shown to Owen).

**Error 4 — Emergency contact call fails (Twilio unreachable):**
This is a patient safety scenario. The system must:
1. Retry 3 times at 30-second intervals
2. If all retries fail, attempt SMS separately
3. If SMS also fails, log the failure with timestamp for clinical review
4. Display to Owen: *"Pythia is trying to reach [contact name]. Please try calling them directly if you can."* — with the contact's phone number displayed large
5. Simultaneously notify Pythia Navigator that the escalation failed technically

**Error 5 — Device storage full (localStorage/IndexedDB quota exceeded):**
The app must implement storage pressure detection. When storage is >80% full, the oldest conversation history is compressed. When >95%, the app prompts Owen: *"I need a little more space to keep remembering our conversations. Can I free up some older memories?"* — with a single confirm button. Never a technical error message.

### Empty States

**Empty state 1 — No conversation history (first session):**
The forest speech bubble shows: *"Hello. I've been waiting for you."* (Onboarding flow begins.)

**Empty state 2 — No domains populated (baseline period):**
The drawer vitals section shows a message from Pythia: *"Your trees are still young. As we spend time together, they will grow."* No empty grid cards, no skeleton loaders.

**Empty state 3 — No care team added:**
The care team section shows: *"Your care circle is empty. Would you like Pythia to help you fill it in, or would you prefer to do it yourself?"* — two large buttons. No list of empty entries.

---

## 2.8 THE SETTINGS SCREEN — WHAT MUST EXIST

V3 routes Settings to a toast notification. V4 needs a minimal, clinically appropriate Settings screen. The 65+ UX specialist recommends extreme restraint — this screen should have fewer than 10 items.

**Required settings for V4 MVP:**

| Setting | Description |
|---|---|
| My name | How Pythia addresses Owen — editable |
| Pythia's voice | On / Off (TTS toggle) |
| Text size | Small / Medium / Large — overrides all font sizes |
| Reduce motion | On / Off — maps to `prefers-reduced-motion` |
| Notification tone | Which gentle sound Pythia uses for reminders |
| Language | Interface language (English default) |
| Apple Health connection | Connect / Disconnect HealthKit |
| Delete my data | Full data deletion — with clear explanation and 48-hour cooling-off |
| Privacy information | Plain-language explanation of what is collected and why |
| Version | App version, for support reference |

All settings are presented as a simple scrolling list. Font size: 17px. Toggle switches: 52px height tap targets. No nested settings screens.

---

## 2.9 THE HISTORY SCREEN — V4 SPECIFICATION

V3 routes History to a toast. This screen is important clinically and emotionally for Owen.

**What History must NOT be:**
- A list of numbers
- A clinical chart
- A data table
- Anything that looks like a medical record

**What History must BE:**
A journal of the forest's seasons. Each week appears as a short visual "season card" — a miniature version of the forest in its state that week, with one sentence from Pythia about that week.

**Example week card:**
```
[Small forest image thumbnail, slightly amber-tinted]
Week of May 5–11
"The oak was strong this week. The birch needed some rain."
[Single thin bar — forest health composite — visual only, no number]
```

Tapping a week opens the week's detail: a brief prose summary generated by the LLM from that week's data, written as Pythia speaking to Owen about what she observed. No tables. No charts. No domain scores.

This is the feature that will make Owen feel, the first time he reads it, that something has actually been paying attention to him.

---

## 2.10 BOARD SUMMARY — SECTION 2

### What Section 2 Establishes for V4

**The cardinal design rules, approved unanimously:**

1. **The app must never feel like software.** Every screen, every transition, every error state must feel like a human interaction.

2. **Text size is a patient safety issue, not a design preference.** Nothing below 14px on labels, 16px on body text, 17px on Pythia's voice.

3. **Every interactive element is a `<button>`.** No divs masquerading as controls.

4. **Pythia is never absent.** In every error state, network failure, or loading condition, Pythia continues to speak. The forest continues to breathe.

5. **Conversation quality is the product.** The forest is beautiful. But the product is whether Owen, after three months of using this app, feels less alone than he did before. That comes from conversation quality, not from canvas animations.

6. **Clinical workflow feeds naturally from daily sessions.** Owen never "submits data." He speaks with Pythia. Everything else is structured behind the scenes.

7. **The once-per-day cave limit must be enforced by persistent state, not a JavaScript variable.** This is both a clinical safeguard and a trust issue.

8. **The PCCA happens in Session 1, not "over the next few days."** Patients with GBM cannot have their baseline collection deferred.

---

## APPROVED: PROCEED TO SECTION 3

**Next section:** Technical Architecture — Cloud provider, PWA structure, authentication, state management, API design, backend services, HealthKit bridge, offline strategy, and the complete infrastructure specification for V4.

*Awaiting Ron's approval to proceed.*

---

*Section 2 produced by the full 32-member specialist board. Primary contributions from: UX Specialist (65+ adults), Accessibility Specialist, Neuropsychologist, Clinical Safety Officer, LLM Systems Architect, Prompt Engineering Specialist, Psychologist, Neurologist, Healthcare Interoperability Specialist, and Frontend Architect.*
