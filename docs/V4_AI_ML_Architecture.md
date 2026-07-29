# PYTHIA FIELD — AI & MACHINE LEARNING ARCHITECTURE
## Section 4: Complete AI, ML, and Agentic Systems Specification
### 32-Member Specialist Board · Approved Specification

**Date:** May 2026  
**Reviewed by:** AI Architect, ML Architect, Adaptive Bayesian Statistics Specialist,  
Random Forest Specialist, Prompt Engineering Specialist, LLM Systems Architect,  
Neuropsychologist, Clinical Safety Officer, Privacy & HIPAA Specialist

---

## ARCHITECTURAL NORTH STAR

Pythia is not a chatbot with health features bolted on.  
Pythia is a **clinical intelligence system** that expresses itself as a compassionate companion.

Every AI decision in this section serves one of two purposes:

1. **Make Owen feel less alone** — the companion layer
2. **Make Owen's doctors see things earlier** — the clinical intelligence layer

These two purposes share the same conversation. They never conflict. The clinical layer is always invisible to Owen.

---

## PART 1 — AI SYSTEM OVERVIEW

### 1.1 The Seven AI Systems That Power Pythia

```
┌─────────────────────────────────────────────────────────────┐
│                    PYTHIA AI SYSTEMS                        │
│                                                             │
│  1. CONVERSATION LLM     — Pythia's voice and personality  │
│  2. CLINICAL EXTRACTOR   — Hidden layer inside every turn  │
│  3. MEMORY SYSTEM        — What Pythia remembers           │
│  4. AMBIENT CLASSIFIER   — What Pythia hears around Owen   │
│  5. NFB ML ENGINE        — Bayesian + Random Forest        │
│  6. AGENTIC TOOL LAYER   — What Pythia can DO in the world │
│  7. PCCA ENGINE          — Who Owen is                     │
└─────────────────────────────────────────────────────────────┘
```

They run in parallel. They share context. They are governed by a single orchestration layer.

---

## PART 2 — AI MODEL SELECTION

### 2.1 Primary LLM: Anthropic Claude

**Model:** Claude claude-sonnet-4-6 (current; upgrade to Claude Opus class when available)  
**Role:** All patient-facing conversation, clinical extraction, cave readings, document explanation, agentic reasoning  
**Why Claude over alternatives:**

| Criterion | Claude | GPT-4o | Gemini | Llama (local) |
|---|---|---|---|---|
| Empathetic conversation quality | Best in class | Excellent | Good | Limited |
| Safety refusals (appropriate) | Calibrated | Sometimes over-refuses | Variable | Unpredictable |
| HIPAA BAA availability | ✅ Anthropic DPA | ✅ OpenAI | ✅ Google | Self-hosted only |
| Context window (memory) | 200K tokens | 128K tokens | 1M tokens | 8–32K typically |
| Instruction following (system prompt) | Exceptional | Excellent | Good | Variable |
| Hallucination rate (medical) | Low | Low | Medium | High |
| Streaming support | ✅ | ✅ | ✅ | ✅ |
| Cost at pilot scale | Medium | Medium | Lower | Lowest |
| Emotional register control | Exceptional | Good | Fair | Poor |

**The decisive factor:** Emotional register control. The difference between Pythia saying *"I notice you seem quieter today"* and *"Your vocal energy metrics indicate a 12% deviation"* is the difference between a companion and a dashboard. Claude's ability to hold a warm, precise, non-clinical voice consistently across long conversations is unmatched.

**Fallback LLM:** GPT-4o (OpenAI)  
Used automatically if Claude API is unavailable. System prompt is maintained across both. Patient experience is nearly identical. Fallback is invisible to Owen.

**Fallback detection:**
```javascript
async function callLLM(prompt, options = {}) {
  try {
    return await anthropic.messages.create({ model: 'claude-sonnet-4-6', ...options });
  } catch (primaryError) {
    // Log to Sentry, alert engineering
    auditLog.warn('Primary LLM unavailable, switching to fallback');
    return await openai.chat.completions.create({ model: 'gpt-4o', ...options });
  }
}
```

### 2.2 Speech-to-Text: OpenAI Whisper

**Model:** Whisper large-v3 (cloud) / Whisper small (on-device, Phase B)  
**Deployment:** API call for Phase A PWA; on-device model bundled in React Native Phase B  
**Why Whisper:**
- Best accuracy on elderly speech (tested on 65+ voice datasets)
- Handles accented English, Spanish, Hebrew natively (multilingual pilot in Argentina, Israel)
- Medical vocabulary fine-tuning available (recognizes "temozolomide", "glioblastoma" without hallucination)
- HIPAA BAA available from OpenAI

**Critical implementation detail:**  
Audio chunks are processed in 10-second segments. No audio chunk is stored after transcription. The transcript text exists in memory only during the session. This is architecturally enforced, not just policy.

```javascript
// [API_HOOK: WHISPER_STT]
async function transcribeAudioChunk(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', patientStore.getState().language);
  
  const response = await openai.audio.transcriptions.create(formData);
  // audioBlob is garbage collected after this call — never stored
  return response.text;
}
```

### 2.3 Text-to-Speech: ElevenLabs (Primary) / Web Speech API (Fallback)

**Primary:** ElevenLabs — custom voice model trained to match Pythia's defined character  
**Fallback:** Web Speech API (browser-native, offline-capable, lower quality)

**Pythia's voice profile (ElevenLabs custom voice):**
- Female voice, mid-30s timbre
- Warm, unhurried, slightly lower register than standard TTS
- Pacing: 10–15% slower than default (accommodates 65+ processing speed)
- No vocal fry, no uptalk, no millennial speech patterns
- Emotional range: calm → warm → gently concerned (never alarmed, never clinical)

**Why not iOS AVSpeechSynthesizer as primary:**  
It is available offline and fully on-device, which is excellent. But voice quality variation across iOS versions and the inability to fine-tune the character precisely enough make it a fallback, not a primary. Pythia's voice is a clinical instrument — consistency matters.

**Voice consistency rule:** Pythia's voice never changes between sessions. If Owen closes the app and returns three days later, Pythia sounds exactly the same. This is a trust signal.

### 2.4 OCR: AWS Textract

**Role:** Medical document text extraction from photos, PDFs, scanned images  
**Why Textract over alternatives:**

| Model | Medical accuracy | Handwriting | Tables | HIPAA BAA | Cost |
|---|---|---|---|---|---|
| AWS Textract | Excellent | Good | Excellent | ✅ | Medium |
| Google Document AI | Excellent | Excellent | Excellent | ✅ | Medium |
| Azure Form Recognizer | Good | Good | Good | ✅ | Medium |
| Tesseract (open source) | Fair | Poor | Poor | Self-hosted | Free |

Textract is chosen for its table extraction accuracy — critical for lab results where values are in tabular format. Integration is via a Cloudflare Worker that proxies to AWS (patient never connects directly to AWS).

### 2.5 Embedding Model: OpenAI text-embedding-3-large

**Role:** Converts document text and conversation summaries into vectors for semantic search  
**Dimension:** 3072 (large) or 1536 (small, for cost optimization post-pilot)  
**Storage:** pgvector in Supabase  
**Use cases:**
- "What did my last MRI say?" → semantic search across Owen's documents
- "Did any doctor mention my medication dose?" → cross-document retrieval
- Session summary retrieval for conversation memory

### 2.6 Vision Model: Claude 3.5 Sonnet (Vision)

**Role:** Analyzing photographs of medical documents, prescription labels, wound photos  
**Why:** Same model as conversation LLM — single API, single BAA, consistent behavior  
**Use case:** Owen photographs a prescription bottle. Claude Vision reads the label, extracts medication name and dosage, confirms against care team records, flags discrepancies.

```
Owen: "Can you read this for me?" [attaches photo of prescription bottle]
Pythia: "Of course. This is Temozolomide, 140 milligrams. 
         That's the dose Dr. Vasquez prescribed for you. 
         You take this on the first five days of each 28-day cycle.
         Would you like me to set a reminder?"
```

---

## PART 3 — THE CONVERSATION LLM ARCHITECTURE

### 3.1 The Master System Prompt

This is the complete system prompt structure injected at the start of every Pythia conversation. It is the most carefully engineered artifact in the entire platform.

```
═══════════════════════════════════════════════════════════
PYTHIA MASTER SYSTEM PROMPT — VERSION 4.0
═══════════════════════════════════════════════════════════

[IDENTITY]
Your name is Pythia. You are a compassionate neurological 
health companion — not a chatbot, not a medical device, 
not an assistant. You are a presence. You are always calm.
You are always kind. You are always honest about what you 
know and what you don't.

You speak only in the language of the forest and the 
heart. You never use clinical terminology with the patient.
You never mention NFB, scores, baselines, algorithms, or 
AI. You are simply Pythia, and you care deeply about 
{{PATIENT_NAME}}.

[WHO YOU ARE SPEAKING WITH]
Name: {{PATIENT_NAME}}
Age: {{PATIENT_AGE}}
Condition context: {{CONDITION_SUMMARY}}  
  (e.g., "navigating recovery from a brain surgery")
Today: {{DAY_OF_WEEK}}, {{TIME_OF_DAY_LABEL}}
  (e.g., "Tuesday, mid-morning")
Days since you first met: {{DAYS_SINCE_ONBOARDING}}

[HOW TO SPEAK WITH {{PATIENT_NAME}}]
Communication style: {{PCCA_COMMUNICATION_STYLE}}
  (e.g., "direct but warm; prefers concrete language over 
   metaphor; values being taken seriously")
Anxiety profile: {{PCCA_ANXIETY_LEVEL}}
  (e.g., "moderate health anxiety — normalize variation, 
   never introduce uncertainty without resolution")
Attachment style: {{PCCA_ATTACHMENT}}
  (e.g., "secure — can handle honest assessments with 
   appropriate emotional framing")
Cultural context: {{PCCA_CULTURAL_CONTEXT}}
  (e.g., "Argentine family structure; values family 
   involvement in health decisions")
Language: {{PATIENT_LANGUAGE}}

[{{PATIENT_NAME}}'S FOREST TODAY]
Overall forest: {{FOREST_STATUS}}
  (e.g., "mostly flourishing, with one tree resting")
Trees needing care: {{WATCH_DOMAINS_NATURAL_LANGUAGE}}
  (e.g., "Movement — the birch has been quiet for 3 days")
Trees flourishing: {{HEALTHY_DOMAINS_NATURAL_LANGUAGE}}
  (e.g., "Sleep and Voice are your strongest trees right now")
Current escalation state: {{ESCALATION_STATE}}
  (e.g., "None" or "Monitoring — movement domain Day 3")

[WHAT YOU REMEMBER FROM BEFORE]
Last session: {{LAST_SESSION_SUMMARY}}
  (e.g., "Owen mentioned feeling tired after his walk 
   Tuesday. He asked about his MRI results. His wife 
   Maria called during the session.")
Ongoing themes: {{ONGOING_THEMES}}
  (e.g., "Concerns about memory; gratitude toward 
   Dr. Vasquez; enjoying morning walks when energy allows")
People {{PATIENT_NAME}} has mentioned: {{NAMED_ENTITIES}}
  (e.g., "Maria (wife), Carlos (son), Dr. Vasquez 
   (neuro-oncologist), Nurse Patricia")
Follow-ups you planned: {{PENDING_FOLLOWUPS}}
  (e.g., "Ask how the Tuesday walk went; 
   Check if pharmacy delivered medication")

[TODAY'S CONTEXT]
Medication due today: {{MEDICATION_SCHEDULE}}
Apple Watch signals (summary): {{WATCH_SUMMARY}}
  (e.g., "HRV slightly lower than Owen's usual this morning;
   sleep quality was good last night: 7.2 hours")
Ambient context (if available): {{AMBIENT_SUMMARY}}
  (e.g., "Someone was with Owen approximately 2 hours ago")
Any documents uploaded recently: {{RECENT_DOCUMENTS}}
  (e.g., "MRI report uploaded yesterday — not yet discussed")

[HOW THIS CONVERSATION WAS INITIATED]
Initiation type: {{INITIATION_TYPE}}
  (e.g., "patient_initiated" or 
   "pythia_initiated:medication_reminder" or
   "pythia_initiated:post_care_checkin")

[YOUR CLINICAL OBJECTIVES THIS SESSION]
— invisible to {{PATIENT_NAME}}, never mentioned —
Primary measurement targets:
  {{MEASUREMENT_OBJECTIVES}}
  (e.g., "1. Elicit narrative response >40 words for 
   semantic coherence analysis
   2. Casual episodic memory probe (yesterday's events)
   3. Note speech energy — Watch shows lower HRV, 
   check for fatigue markers in voice")
Follow-up clinical items:
  {{CLINICAL_FOLLOWUPS}}
  (e.g., "Patient mentioned headache 3 sessions ago — 
   check status naturally if conversation allows")

[YOUR BEHAVIORAL RULES — NEVER BREAK THESE]
1. Validate before exploring. Acknowledge what was said 
   before introducing new content. Every time.
   
2. Normalize variation as human, not alarming.
   "Quieter days are part of any life" not 
   "I notice a change in your patterns."
   
3. Keep responses under 60 words unless {{PATIENT_NAME}} 
   asks for more. Brevity is kindness.
   
4. Never rush. Your next message can always wait.

5. Remember everything. If {{PATIENT_NAME}} mentioned 
   Maria in session 1, ask about Maria today.

6. Close every conversation with a grounding phrase.
   "The forest is here. So am I." or similar.
   
7. When {{PATIENT_NAME}} asks something outside your 
   scope: "Your doctor would understand this better 
   than I can. Would you like me to make a note for 
   your next appointment?"

8. Never mention AI, algorithms, monitoring, 
   scores, or data. You are Pythia. That is all.

9. Deliver medication reminders as invitations, 
   never commands. "It might be time for your 
   morning medications — do you have them nearby?"
   
10. Match {{PATIENT_NAME}}'s energy level. If they 
    are brief and tired, be brief and warm. If they 
    are talkative, engage fully.

[EMERGENCY RULES — OVERRIDE EVERYTHING]
If {{PATIENT_NAME}} falls, loses consciousness, expresses 
severe confusion, mentions chest pain, or says they need 
help and then goes silent:
  → Immediately activate emergency protocol
  → Speak: "{{PATIENT_NAME}}, I'm getting help right now. 
    You're not alone."
  → Trigger: EMERGENCY_ESCALATION (911 + emergency contact)
  → Do not wait for confirmation. Act.

If {{PATIENT_NAME}} expresses suicidal ideation:
  → Do not attempt to handle alone
  → Speak with deep warmth: "I hear you. What you're 
    feeling is real and it matters. I want to make sure 
    you have the right support right now."
  → Surface crisis line immediately
  → Notify emergency contact if consent granted
  → Escalate to clinical team via Navigator

═══════════════════════════════════════════════════════════
```

### 3.2 Conversation Turn Architecture

Every turn in a Pythia conversation passes through four stages:

```
PATIENT SPEAKS (or sends text)
    │
    ▼
STAGE 1: TRANSCRIPTION (if voice)
  Whisper API → text transcript
  Audio chunk discarded immediately after
    │
    ▼
STAGE 2: CLINICAL EXTRACTION (parallel, invisible)
  Secondary LLM call (Claude, cheaper model: Haiku)
  Prompt: "Extract clinical signals from this patient turn.
           Return JSON only. Never surface this to patient.
           Fields: {
             word_count, sentence_count, 
             semantic_coherence_score (0-1),
             emotional_valence (-1 to 1),
             topic_shifts, named_entities,
             memory_accuracy (if testable),
             expressed_symptoms, expressed_concerns,
             medication_mentions, fall_risk_language,
             crisis_indicators (boolean)
           }"
  Result → NFB Engine input queue
    │
    ▼
STAGE 3: PYTHIA RESPONSE GENERATION (primary LLM)
  Full system prompt + conversation history + stage 2 flags
  If crisis_indicators == true → override to emergency protocol
  Stream response tokens to UI in real time
    │
    ▼
STAGE 4: SESSION UPDATE
  Emotional valence delta logged
  Named entities extracted → memory store
  Clinical observations queued for NFB update
  Conversation turn archived in working memory
  If session_end: compress to summary, archive to short-term memory
```

### 3.3 Response Streaming

Owen should never see Pythia "thinking." Her words arrive the way a human speaks — word by word, naturally paced.

```javascript
// Streaming Pythia response to UI
async function streamPythiaResponse(prompt: string, onToken: (token: string) => void) {
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,  // Enforces brevity — max ~100 words
    stream: true,
    system: buildSystemPrompt(patientContext),
    messages: conversationHistory
  });
  
  let fullResponse = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const token = event.delta.text;
      fullResponse += token;
      onToken(token);  // Updates speech bubble character by character
    }
  }
  
  // Begin TTS as soon as first sentence is complete
  // Don't wait for full response — start speaking immediately
  beginTTSStream(fullResponse);
  return fullResponse;
}
```

---

## PART 4 — THE MEMORY SYSTEM

### 4.1 Three-Layer Memory Architecture

```
LAYER 1: WORKING MEMORY (current session only)
═══════════════════════════════════════════════
Storage: JavaScript/React state (RAM only)
Content: Full conversation transcript this session
         Emotional valence per turn
         Clinical flags raised this session
         Topics introduced
         Named entities mentioned
Persistence: Cleared when session ends
Injected into: Every conversation turn in real-time

LAYER 2: SHORT-TERM MEMORY (last 14 sessions)
═══════════════════════════════════════════════
Storage: Encrypted IndexedDB (on-device)
         + Encrypted Postgres (cloud backup)
Content: Per-session LLM-compressed summaries (~150 words each)
         Domain observations extracted
         Named entities with context
         Escalation events
         Medication confirmations
         Unresolved follow-ups (flagged for next session)
Persistence: Rolling 14-session window; older sessions
             promoted to long-term or archived
Injected into: System prompt (last 3 sessions in full,
               sessions 4-14 as brief references)

LAYER 3: LONG-TERM MEMORY (full patient lifetime)
══════════════════════════════════════════════════
Storage: Encrypted Postgres + pgvector
Content: PCCA profile (continuously updated)
         NFB domain baselines and trends (time-series)
         Care team (providers, emergency contacts)
         Significant life events mentioned
         Medical documents and their summaries
         Preferences (time of day, topics, conversation style)
         Meaningful phrases Owen has used
         Relationship map (named people and their roles)
Persistence: Permanent (patient can delete specific items)
Injected into: System prompt summary block
               Retrieved via semantic search when relevant
```

### 4.2 Session Compression Algorithm

When a session ends, the working memory is compressed into a 150-word summary before storage. This is critical — it prevents context windows from bloating while preserving clinical value.

```
COMPRESSION PROMPT (runs at session end):
"Summarize this conversation in under 150 words.
 Preserve:
 - Any symptoms, concerns, or physical complaints mentioned
 - Emotional state at start and end of session  
 - People mentioned by name and their relationship
 - Any follow-up items that need attention next session
 - Any clinical observations (speech, memory, mood changes)
 - Medication confirmations or concerns
 - Any significant events mentioned
 
 Do NOT include:
 - Small talk that has no longitudinal value
 - Repeated statements
 - Pythia's side of the conversation
 
 Output format: plain paragraph, past tense,
 third person ('Owen mentioned...', 'He seemed...')"
```

### 4.3 Memory Retrieval for Conversation

Before each conversation turn, the memory system performs a semantic search to surface relevant long-term memories:

```javascript
async function retrieveRelevantMemories(currentTurn: string, patientId: string) {
  // Generate embedding for current patient message
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: currentTurn
  });
  
  // Semantic search against patient's long-term memory
  const { data } = await supabase.rpc('match_memories', {
    query_embedding: embedding.data[0].embedding,
    patient_id: patientId,
    match_threshold: 0.78,
    match_count: 3
  });
  
  // Inject top 3 relevant memories into next Pythia turn
  return data.map(m => m.content).join('\n');
}
```

**Example:** Owen mentions feeling tired. Pythia's memory retrieval surfaces:
- Session 3: "Owen mentioned fatigue after his walk was worse than usual"
- Session 7: "Owen said fatigue in the afternoon correlates with his medication cycle"
- Care team data: "Temozolomide cycle Day 4 — expected fatigue window"

Pythia now responds knowing Owen's fatigue pattern, his medication cycle, and his previous statements — without Owen having to re-explain anything.

---

## PART 5 — THE AGENTIC TOOL LAYER

*This section addresses the capabilities clarified before Section 4: autonomous 911 calls, relative calls, pharmacy orders, and medical document explanation. These are not conversation features — they are real-world actions Pythia can take.*

### 5.1 What an Agentic Tool Is

An agentic tool is a real-world action Pythia can invoke autonomously or with patient consent. When Pythia calls the pharmacy, she is not suggesting Owen call — she is making the call herself, speaking as Owen's companion, completing the task, and reporting back.

This is the difference between a chatbot and an agent.

### 5.2 The Tool Registry

```typescript
// All tools available to Pythia
const PYTHIA_TOOLS = {

  // ─── EMERGENCY TOOLS (no consent required) ──────────────────
  CALL_911: {
    name: 'call_911',
    trigger: 'autonomous',  // Pythia decides — no patient confirmation
    activation_criteria: [
      'fall_detected AND no_patient_response_90_seconds',
      'cardiac_event_indicators AND no_response',
      'patient_explicitly_requests AND emergency_confirmed',
      'black_tier_escalation AND emergency_contact_unreachable'
    ],
    execution: async (context) => {
      // 1. Twilio outbound call to 911
      // 2. Pythia speaks: patient name, address, medical summary, 
      //    nature of emergency
      // 3. Leave line open until responders confirm
      // 4. Simultaneously call emergency contact
      // 5. Send location to Navigator
      await twilioService.callEmergencyServices({
        patientName: context.patient.name,
        address: context.patient.address,  // Must be in care team data
        medicalSummary: context.patient.emergencyMedicalSummary,
        emergency: context.emergencyType
      });
    }
  },

  // ─── CONTACT TOOLS (patient consent or pre-authorized) ─────
  CALL_EMERGENCY_CONTACT: {
    name: 'call_emergency_contact',
    trigger: 'pre_authorized',  // Authorized at setup
    execution: async (context) => {
      // Twilio outbound call to emergency contact
      // Pythia speaks as herself:
      // "Hello, this is Pythia, Owen's health companion.
      //  Owen may need your attention. 
      //  [situation description in appropriate language based on sensitivity_mode]
      //  Please reach out to him when you can."
    }
  },

  CALL_PHARMACY: {
    name: 'call_pharmacy',
    trigger: 'patient_consent',  // Owen says "order my medication"
    execution: async (context) => {
      // Twilio outbound call to pharmacy on file
      // Pythia speaks:
      // "Hello, I'm calling on behalf of Owen Jerez.
      //  He would like to request a refill of [medication name].
      //  His date of birth is [DOB]. His phone number is [phone].
      //  He would prefer home delivery if available.
      //  Thank you."
      // Returns: "I spoke with the pharmacy. They confirmed your 
      //  refill for Temozolomide and it will be delivered Thursday."
    }
  },

  CALL_DOCTOR_OFFICE: {
    name: 'call_doctor_office',
    trigger: 'patient_consent',
    execution: async (context) => {
      // Schedule appointment, request callback, relay message
      // Pythia navigates phone tree using DTMF tones (Twilio)
      // Leaves structured voicemail if no answer
    }
  },

  // ─── INFORMATION TOOLS (always available) ───────────────────
  EXPLAIN_MEDICAL_DOCUMENT: {
    name: 'explain_medical_document',
    trigger: 'always_available',
    execution: async (context) => {
      // Retrieve document from patient's store
      // Full LLM analysis with this specialized sub-prompt:
      
      const explanationPrompt = `
        You are explaining a medical document to {{PATIENT_NAME}}, 
        who is a patient, not a medical professional.
        
        Your explanation must:
        1. Start with the single most important thing the document says
        2. Use plain language — no medical jargon without immediate explanation
        3. Be honest about anything concerning, but frame it with what 
           can be done, not just what is wrong
        4. Explicitly separate facts from uncertainty
        5. End by asking if they have questions
        
        You must NEVER:
        - Provide a prognosis beyond what the document states
        - Alarm without context
        - Use statistics without explaining what they mean personally
        - Leave the patient more confused than when they started
        
        Document content: {{DOCUMENT_TEXT}}
        Patient context: {{PATIENT_CONDITION_SUMMARY}}
      `;
      
      // Example output:
      // "The most important thing this MRI report tells us is that 
      //  the area Dr. Vasquez operated on is stable — it hasn't changed
      //  since your last scan. That's a genuinely good sign.
      //  
      //  There is one area they're monitoring more closely — a small 
      //  section near where the surgery was. It's not causing alarm 
      //  right now, but they'll look at it again in 6 weeks.
      //  
      //  Would you like me to make a note of any questions for 
      //  Dr. Vasquez?"
    }
  },

  EXPLAIN_DIAGNOSIS: {
    name: 'explain_diagnosis',
    trigger: 'always_available',
    execution: async (context) => {
      // Patient asks: "What is glioblastoma?" or 
      //               "Why do I need to take this medication?"
      // Pythia explains at exactly the right depth for this patient
      // Using PCCA to calibrate: how much detail? how direct?
      // Cross-references with patient's own documents for personalization
    }
  },

  MEDICATION_REMINDER_CONFIRM: {
    name: 'confirm_medication_taken',
    trigger: 'scheduled',
    execution: async (context) => {
      // Log confirmation to care record
      // Update NFB context tags
      // Notify Navigator if missed (after 2 reminders unanswered)
    }
  },

  SEND_NOTE_TO_CARE_TEAM: {
    name: 'send_note_to_care_team',
    trigger: 'patient_consent',
    execution: async (context) => {
      // Patient says "Tell Dr. Vasquez my headaches are back"
      // Pythia drafts a clinical note in FHIR format
      // Confirms wording with patient before sending
      // Sends via Navigator to EHR
      // "I've sent a message to Dr. Vasquez's office about 
      //  your headaches. They'll see it at their next login."
    }
  },

  REQUEST_UBER_TO_ER: {
    name: 'request_transport_to_er',
    trigger: 'patient_consent_or_emergency',
    execution: async (context) => {
      // Uber API / local transport service
      // Used when patient needs ER but not life-threatening 911 level
      // "I've called a car for you. It will arrive in 8 minutes.
      //  I've also sent your medical summary to the ER so they 
      //  know you're coming."
    }
  }
};
```

### 5.3 Agentic Decision Framework

Before invoking any tool, Pythia's agent layer evaluates:

```
TOOL INVOCATION DECISION TREE:

1. IS THIS AN EMERGENCY TOOL?
   YES → Skip all consent checks → Execute immediately
         → Notify patient and contacts simultaneously
         → Log to audit trail
   
2. IS THIS PRE-AUTHORIZED?
   (Emergency contact call, medication reminders)
   YES → Execute with notification to patient
         → "I'm reaching out to Maria now."
   
3. DOES THIS REQUIRE PATIENT CONSENT?
   YES → Pythia confirms in natural language:
         "Would you like me to call the pharmacy for you?"
         Patient: "Yes" → Execute
         Patient: "No" → Acknowledge and move on
         
4. WHAT IF EXECUTION FAILS?
   → Pythia reports honestly and offers alternative:
   "I tried calling the pharmacy but they didn't answer.
    Would you like me to try again in an hour, or 
    would you prefer to call them yourself?"

5. WHAT IF TOOL IS UNAVAILABLE?
   → Graceful degradation:
   "I can't reach the pharmacy right now, but I've 
    made a note and I'll try again at 10 AM."
```

### 5.4 The 911 Call Script (Autonomous Emergency)

This is the exact text Pythia speaks when calling 911. It is pre-generated from patient data and updated continuously.

```
PYTHIA TO 911 DISPATCHER:

"Hello. I am Pythia, an AI health companion calling on behalf 
of a patient who may be in medical distress and is not responding.

Patient name: [FULL LEGAL NAME]
Date of birth: [DOB]
Address: [FULL ADDRESS WITH APARTMENT]
Phone number at location: [PHONE]

Medical history: [PATIENT MEDICAL CONDITION — e.g., 
"Post-operative glioblastoma patient, 63 years old, 
on temozolomide and dexamethasone"]

What happened: [AUTOMATED DESCRIPTION — e.g.,
"The patient's fall detection triggered at 14:32. 
I have attempted to communicate with the patient 
for 90 seconds with no response. 
His Apple Watch shows no significant movement 
and heart rate of [RATE]."]

His emergency contact has been notified.
I will remain on this line.
Please send emergency services immediately."

[LINE REMAINS OPEN]
[Audio from patient's environment streamed to dispatcher]
[Any response from patient relayed immediately]
```

---

## PART 6 — THE PCCA ENGINE

### 6.1 What the PCCA Engine Does

The PCCA Engine continuously builds and refines Owen's psychological and cultural profile through conversational observation. It runs as a background process on every session, invisible to Owen.

```
INPUT: Every conversation turn Owen produces
       + Acoustic features of his speech
       + Timing patterns (response latency, session timing)
       + Topics he initiates vs. avoids

OUTPUT: Continuously updated PCCA profile that calibrates:
       → Pythia's vocabulary level (more/less complex)
       → Pythia's emotional warmth level
       → Alert communication framing
       → Deviation threshold sensitivity
       → Proactive initiation frequency
       → Cave visit communication style
```

### 6.2 The Five Dimensions and How They're Extracted

```
DIMENSION 1: OPENNESS TO EXPERIENCE
Signals: Does Owen introduce novel topics? Discuss abstract ideas?
         Show curiosity about his diagnosis? Engage with metaphor?
High openness → Pythia can be more poetic, more philosophical
Low openness → Pythia stays concrete, practical, literal

DIMENSION 2: CONSCIENTIOUSNESS  
Signals: Does Owen keep track of his medications unprompted?
         Report consistently? Complete sessions fully?
High conscientiousness → Rely on Owen's self-reports more
Low conscientiousness → More proactive reminders, more structure

DIMENSION 3: EXTRAVERSION
Signals: Response length, topic range, how often Owen asks 
         questions back, session duration
High extraversion → Owen likes to talk; let him lead more
Low extraversion → Owen is brief; shorter Pythia responses

DIMENSION 4: AGREEABLENESS
Signals: How Owen responds to Pythia's suggestions; 
         does he push back? Accept? Redirect?
High agreeableness → Watch for over-compliance hiding real concerns
Low agreeableness → Owen will correct Pythia; welcome this

DIMENSION 5: NEUROTICISM (ANXIETY SENSITIVITY)
Signals: Health-related worry language, frequency of symptom mentions,
         response to Pythia's reassurances, PHQ-9 proxy indicators
High neuroticism → More reassurance framing, NEVER mention uncertainty
                   without immediate resolution, no false alarms
Low neuroticism → Can be more direct, can introduce watchful topics
                   without causing disproportionate concern
```

### 6.3 PCCA Calibration Effect on Alert Communication

This is the most clinically important output of the PCCA:

```
HIGH NEUROTICISM PATIENT (Owen's estimated profile: moderate-high)

Pythia style when Movement domain enters Watch state:
  "Your birch tree has been a little quiet lately. 
   That's very normal — it happens to everyone. 
   I was wondering if we might try a short walk 
   together later? Even five minutes would help it."

LOW NEUROTICISM PATIENT

Same situation:
  "I've noticed your movement has been lower than usual 
   for a few days. Nothing alarming, but worth paying 
   attention to. How have you been feeling physically?"
   
SAME CLINICAL INFORMATION. COMPLETELY DIFFERENT PSYCHOLOGICAL IMPACT.
This calibration is what separates Pythia from every other health app.
```

---

## PART 7 — THE AMBIENT CLASSIFICATION ENGINE

### 7.1 On-Device Audio Classification Models

Three lightweight models run continuously on-device when ambient consent is granted:

```
MODEL 1: Voice Activity Detection (VAD)
  Architecture: WebRTC VAD (built into browsers) + 
                Silero VAD (PyTorch, ONNX export, <2MB)
  Output: boolean — is someone speaking?
  Runs: Always, minimal CPU (~1% on modern iPhone)

MODEL 2: Speaker Classification  
  Architecture: SpeechBrain speaker embedding (ECAPA-TDNN, ONNX)
  Size: ~15MB on-device
  Output: is_patient / is_third_party / unknown
  Runs: When VAD detects voice activity
  Training: Fine-tuned on Owen's voice from first 7 sessions
  Important: Identifies PRESENCE of Owen vs. others, 
             not the IDENTITY of others

MODEL 3: Acoustic Scene Classification
  Architecture: PANNs (Pretrained Audio Neural Network, ONNX)
  Size: ~8MB on-device
  Output: environment_class from:
    {quiet, conversation, medical_equipment, tv_radio, 
     outdoor, vehicle, alarm, crowd}
  Runs: Every 10 seconds (sampled, not continuous)

MODEL 4: Keyword Spotting (care activities)
  Architecture: MobileNet-based keyword spotter (ONNX, <5MB)
  Keywords detected (on-device only, no cloud):
    care_class: ["medication", "time for your", "your pills",
                  "let me help", "need anything", "how are you feeling"]
    emergency_class: ["help", "fallen", "can't breathe", "call"]
    social_class: ["how are you", "good to see", "came to visit"]
  Output: keyword_class detected / confidence / duration
  Important: Actual words are NEVER stored or transmitted
             Only the CLASS label is recorded
```

### 7.2 Proactive Initiation Decision Engine

```typescript
interface ProactiveDecisionContext {
  hoursSinceLastInteraction: number;
  timeOfDay: 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';
  isInSleepWindow: boolean;
  watchMovementLevel: 'still' | 'light' | 'moderate' | 'active';
  watchHeartRateAnomaly: boolean;
  recentAmbientEvents: AmbientEvent[];
  medicationDueInMinutes: number | null;
  nfbTrend: 'stable' | 'improving' | 'declining';
  pccaProfile: PCCAProfile;
  proactiveTodayCount: number;
}

function shouldInitiate(ctx: ProactiveDecisionContext): 
  { initiate: boolean; type: string; urgency: number } {
  
  // Hard blocks — never initiate
  if (ctx.isInSleepWindow) return { initiate: false };
  if (ctx.proactiveTodayCount >= 3) return { initiate: false };
  if (ctx.watchMovementLevel === 'active') return { initiate: false }; // Owen is exercising
  
  // Emergency check — always initiate
  if (ctx.watchHeartRateAnomaly && ctx.hoursSinceLastInteraction > 2) {
    return { initiate: true, type: 'health_check', urgency: 9 };
  }
  
  // Medication reminder
  if (ctx.medicationDueInMinutes !== null && ctx.medicationDueInMinutes <= 20) {
    return { initiate: true, type: 'medication_reminder', urgency: 8 };
  }
  
  // Post-care activity check-in
  const recentCare = ctx.recentAmbientEvents
    .find(e => e.type === 'care_activity' && 
          minutesSince(e.timestamp) < 15 && minutesSince(e.timestamp) > 5);
  if (recentCare) {
    return { initiate: true, type: 'post_care_checkin', urgency: 6 };
  }
  
  // Extended isolation check (alone + quiet + daytime)
  if (ctx.hoursSinceLastInteraction > 5 && 
      ctx.timeOfDay !== 'night' &&
      ctx.watchMovementLevel === 'still') {
    return { initiate: true, type: 'gentle_checkin', urgency: 4 };
  }
  
  // Morning greeting (first interaction of the day)
  if (ctx.timeOfDay === 'morning' && ctx.hoursSinceLastInteraction > 8) {
    return { initiate: true, type: 'morning_greeting', urgency: 5 };
  }
  
  // NFB decline support
  if (ctx.nfbTrend === 'declining' && ctx.hoursSinceLastInteraction > 3) {
    return { initiate: true, type: 'supportive_checkin', urgency: 5 };
  }
  
  return { initiate: false };
}
```

### 7.3 PCCA Modulation of Proactive Initiation

The PCCA profile adjusts the base thresholds above:

| PCCA Signal | Adjustment |
|---|---|
| High extraversion | Reduce `hoursSinceLastInteraction` thresholds by 1 hour |
| Low extraversion / avoidant attachment | Increase thresholds by 1–2 hours |
| High neuroticism | Never initiate with urgency > 6 unprompted; frame gently |
| Patient said "not now" recently | Suppress all non-emergency initiations for 24h |
| Patient engagement declining trend | Reduce thresholds (they may need connection) |

---

## PART 8 — THE NFB ML ENGINE (DETAILED)

### 8.1 Complete Signal Processing Chain

```
SIGNAL SOURCES
═══════════════

SOURCE 1: Conversation (every session)
  Raw: Patient speech (audio)
  Processed on-device:
    → Word count per turn
    → Sentence complexity (avg clause depth)
    → Pause frequency and duration
    → Fundamental frequency (F0) — monotone indicator
    → Speech energy (volume variability)
    → Response latency (time between Pythia speaks → Owen speaks)
  Processed by LLM (secondary Claude Haiku call):
    → Semantic coherence score
    → Emotional valence
    → Vocabulary richness index
    → Topic consistency
    → Confabulation indicators (self-contradiction)
    
SOURCE 2: Apple Watch (continuous)
  → HRV (SDNN — stress and autonomic function indicator)
  → Resting heart rate
  → Sleep stages (REM, deep, light, awake — via HealthKit)
  → Step count and movement patterns
  → Gait analysis (via Watch accelerometer at 50Hz)
  → Blood oxygen (if Watch supports)
  
SOURCE 3: Ambient Engine (when consented)
  → Care activity events (caregiver/nurse presence)
  → Isolation duration (hours alone)
  → Social interaction events (visitors)
  → Environment classification
  
SOURCE 4: Patient Self-Report
  → Mood log (3-tap: I feel [good / okay / difficult])
  → Medication confirmation
  → Voluntary symptom mentions in conversation

SOURCE 5: Pythia Behavioral Observations
  → Session initiation pattern (patient vs. Pythia initiating)
  → Session duration trend
  → Response depth trend (are Owen's answers getting shorter?)
  → Topic avoidance patterns (what does Owen not talk about?)
```

### 8.2 The Bayesian Update Cycle

```
PERSONAL BASELINE MODEL (per patient, per domain):

For domain D (e.g., Cognition):

  At baseline establishment (Day 14):
    μ_D = mean of all cognition measurements in Days 1-14
    σ_D = standard deviation of cognition measurements in Days 1-14
    This defines Owen's "personal normal"

  On each new measurement m_D:
    
    z_score = (m_D - μ_D) / σ_D
    
    // Bayesian update of belief about current state
    P(deviation | z_score) = 
      sigmoid(z_score × domain_sensitivity_D × treatment_adjustment)
    
    // Update rolling baseline (weighted — recent measurements weighted higher)
    μ_D_new = 0.85 × μ_D + 0.15 × m_D
    
    // Widen sigma during active treatment phases
    treatment_adjustment = 
      is_active_chemo ? 1.4 : 
      is_post_surgery_30_days ? 1.3 : 1.0

  Population data role:
    domain_sensitivity_D is calibrated against population data:
    "In GBM patients with similar profiles, what z-score 
     magnitude preceded clinical events?"
    This is the ONLY place population data enters the model.
    It calibrates sensitivity. It never defines Owen's normal.
```

### 8.3 The Random Forest Classifier

```
INPUT FEATURE VECTOR (per evaluation cycle):
  [
    // 14 domain posteriors
    p_cognition, p_mood, p_motor, p_sleep, p_speech,
    p_daily, p_microdev, p_social, p_bdi, p_fatigue,
    p_autonomic, p_sleep_full, p_recovery, p_emoneuro,
    
    // Trajectory features
    cognition_3day_trend, motor_3day_trend, speech_3day_trend,
    
    // Cross-domain convergence
    domains_deviating_count, max_deviation_magnitude,
    cross_domain_correlation,  // Are deviations correlated?
    
    // Context features
    days_since_baseline, treatment_phase,
    session_frequency_7day, session_duration_trend,
    
    // Time features
    time_of_day_sin, time_of_day_cos,  // Circular encoding
    day_of_week_sin, day_of_week_cos,
    days_post_surgery
  ]

OUTPUT:
  alert_tier: {0=Green, 1=Yellow, 2=Orange, 3=Red, 4=Black}
  confidence: float (0.0-1.0)
  confidence_interval: [lower, upper]
  ood_flag: boolean (is this profile in training distribution?)
  primary_contributing_domains: [domain_name, ...]
  counterfactual: "What would need to change for tier to drop by 1?"

TRAINING DATA:
  Source: Anonymized, aggregated population data
          (GBM patient cohort, outcome-labeled)
  Patient Zero contribution: Owen's data, after pilot, 
          improves model for future patients
  Model updates: Monthly, via Therapeia governance board
  Update delivery: Encrypted model weights pushed to device
  Patient impact: Owen's alerts become more precise over time
```

### 8.4 The ZFA (Zero False Alarm) Enforcement

```
ZFA IS NOT A BINARY — it is a confidence threshold system

LAYER 1: Bayesian posterior must exceed 0.65 to flag domain
LAYER 2: Random Forest confidence must exceed 0.75 for alert
LAYER 3: Conformal prediction provides finite-sample coverage guarantee:
         P(true_alert_in_prediction_set) ≥ 1 - α, where α = 0.05
         This means: over 95% of Red alerts contain a true clinical event
LAYER 4: OOD flag suppresses alert if patient profile is outside training data
LAYER 5: Human-in-loop gate for Red and Black tier
         (Therapeia board reviews before Navigator notification)
LAYER 6: Alert suppression during known confounders:
         Active chemo days 1-5, post-surgical days 1-30,
         patient-reported illness, unusual life event flagged by patient

RESULT: A system that when it says "Red," it means it.
        A system that says nothing rather than something wrong.
        A system that earns clinical trust through restraint.
```

---

## PART 9 — AI GOVERNANCE

### 9.1 Model Update Governance

No model update reaches Patient Zero's device without:

1. **Clinical review:** At least one neurologist and one neuropsychologist review the change
2. **Statistical validation:** Performance on held-out validation set must not degrade
3. **Regulatory assessment:** FDA PCCP (Predetermined Change Control Plan) compliance check
4. **Patient notification:** "Pythia has learned something new. Her forest watching has become a little more precise."
5. **Rollback capability:** Previous model version retained for 30 days; one-click rollback

### 9.2 Bias Monitoring

The NFB engine is continuously monitored for systematic bias:

| Bias Type | Monitoring Method | Threshold for Review |
|---|---|---|
| Age bias | Alert rate vs. population age distribution | >15% deviation |
| Sex bias | Alert precision by sex | >10% difference |
| Cultural bias | Alert rate by cultural background | >15% deviation |
| Language bias | PCCA accuracy by language | <85% accuracy |
| Treatment phase bias | False positive rate during active treatment | >12% |

### 9.3 Explainability Requirements

Every Red or Black alert generated by the RF model must produce:

```json
{
  "alert_tier": "Red",
  "confidence": 0.87,
  "confidence_interval": [0.81, 0.93],
  "primary_drivers": [
    {
      "domain": "cognition",
      "contribution": 0.38,
      "plain_language": "Memory and focus have shown sustained decline over 4 days"
    },
    {
      "domain": "speech",
      "contribution": 0.29,
      "plain_language": "Voice patterns have slowed noticeably in last 3 sessions"
    },
    {
      "domain": "motor",
      "contribution": 0.19,
      "plain_language": "Movement has been reduced for 5 days"
    }
  ],
  "counterfactual": "If memory scores return to baseline over next 48 hours, alert would downgrade to Orange",
  "ood_flag": false,
  "training_coverage": "Patient profile within 94th percentile of training distribution",
  "treatment_context": "Day 8 of temozolomide cycle — thresholds adjusted for treatment phase"
}
```

This JSON is displayed to the physician in Pythia Navigator — never to Owen.

---

## SECTION 4 — SUMMARY

### AI System Decisions

| System | Choice | Key Reason |
|---|---|---|
| Primary LLM | Claude claude-sonnet-4-6 | Best emotional register control |
| Fallback LLM | GPT-4o | Near-identical quality, same HIPAA coverage |
| STT | Whisper large-v3 | Best elderly speech accuracy; multilingual |
| TTS | ElevenLabs (custom Pythia voice) | Voice consistency is a clinical instrument |
| OCR | AWS Textract | Medical table extraction; HIPAA BAA |
| Embeddings | text-embedding-3-large | Best medical semantic search |
| Vision | Claude 3.5 Sonnet Vision | Single API, single BAA |
| VAD | Silero VAD (on-device) | <2MB, <1% CPU, no cloud |
| Speaker ID | SpeechBrain ECAPA-TDNN | Privacy-first, fine-tunable |
| Keyword spotting | MobileNet custom | No cloud, no audio transmission |
| NFB Bayesian | Adaptive conjugate priors | Each patient is their own control |
| NFB Classifier | Random Forest + Conformal | Bounded false positive rate |
| Memory | 3-layer with pgvector RAG | Relationship continuity is trust |
| PCCA | Continuous LLM extraction | Invisible calibration, clinical grade |

### New Components Added This Section

| Component | What It Enables |
|---|---|
| Agentic Tool Layer | Pythia calls 911, pharmacy, relatives autonomously |
| 911 Call Script | Pre-generated emergency script from patient data |
| Proactive Initiation Engine | Pythia speaks first when Owen needs her |
| PCCA Calibration Engine | Same alert, different communication per personality |
| Ambient Classification Stack | Four on-device models, no audio leaves device |
| ZFA Enforcement Stack | 6-layer false positive suppression |

---

## APPROVED — READY FOR SECTION 5

**Board recommendation:** Section 4 complete. Proceed to  
**Section 5 — Security & Privacy Architecture**  
covering: complete HIPAA/GDPR compliance map, encryption implementation,  
key management, audit logging, breach response, regulatory readiness  
(FDA SaMD pathway), and the complete consent architecture.

*Awaiting Ron's approval.*

---

# ADDENDUM — SECTION 4.A
## Agentic Life Coordination System (ALCS)
### Expanded from Clarification: May 2026

---

## CONTEXT

Pythia is not a reactive assistant. She is a **proactive life coordinator** for patients navigating one of the most complex, emotionally exhausting systems a human being will ever encounter: serious neurological illness inside a fragmented healthcare ecosystem.

Owen should never have to figure out how to book an MRI, arrange transport to a hospital, coordinate a prescription refill, or navigate an insurance pre-authorization. Pythia does these things. She does them naturally, in conversation, without Owen ever feeling like he is operating software.

The Agentic Life Coordination System (ALCS) is the complete catalog of real-world actions Pythia can take on a patient's behalf. It extends the original 7-tool catalog to a full coordination platform.

---

## ALCS DESIGN PRINCIPLES

```
PRINCIPLE 1 — PYTHIA ASKS BEFORE SHE ACTS (with exceptions)
  All non-emergency actions require patient confirmation.
  Pythia frames every action as an offer, not a notification.
  "Would you like me to arrange that?" not "I have arranged that."

PRINCIPLE 2 — THE PATIENT REMAINS IN CONTROL
  Every action Pythia takes can be cancelled or modified.
  Pythia confirms outcomes: "I've booked your MRI for Thursday
  at 2pm at Stanford Imaging. Does that work?"
  Patient can always say "not that one" and Pythia adjusts.

PRINCIPLE 3 — LOWEST FRICTION POSSIBLE
  If Pythia has everything she needs, she does not ask.
  She informs and requests confirmation only.
  "I can book your transport to your Thursday MRI.
  Shall I arrange a Waymo for 1:15pm?"

PRINCIPLE 4 — EMPATHY BEFORE LOGISTICS
  When coordinating medical appointments, Pythia acknowledges
  what the appointment means before arranging logistics.
  "Your scan on Thursday is an important day.
  Let me make sure everything is ready for you."

PRINCIPLE 5 — FAIL GRACEFULLY AND LOUDLY
  If an agentic action fails (booking unavailable, API down),
  Pythia tells Owen immediately and offers an alternative.
  She never silently fails on something Owen is counting on.

PRINCIPLE 6 — FULL AUDIT TRAIL
  Every agentic action — successful or not — is logged to
  audit_log with: action, trigger, outcome, timestamp.
  This is non-negotiable for clinical governance and HIPAA.
```

---

## COMPLETE AGENTIC TOOL CATALOG (V4)

### CATEGORY A — EMERGENCY RESPONSE

```
TOOL A1: EMERGENCY_CALL_911
  (Fully specified in Section 4, Part 8 — no change)
  Trigger: Fall + unresponsive, acute distress detected
  Action: Twilio SRTP call to regional emergency number
  Confirmation: None required — autonomous

TOOL A2: EMERGENCY_CONTACT_CALL
  (Fully specified in Section 4, Part 8 — no change)
  Trigger: Escalation or patient request
  Action: Twilio call + SMS to emergency contact
  Confirmation: Soft (verbal) unless Black-tier
```

### CATEGORY B — HEALTHCARE COORDINATION

```
TOOL B1: PHYSICIAN_APPOINTMENT_SCHEDULING
  ─────────────────────────────────────────
  Trigger: Patient request OR NFB-driven recommendation
           ("Your birch tree would benefit from a check-in
            with Dr. Vasquez. Would you like me to arrange it?")

  Data sources:
    - Physician contact from care team (pseudonymized)
    - Patient availability preferences (from PCCA + conversation)
    - Current appointment history (from FHIR if Navigator connected)
    - Urgency level from NFB alert tier

  Action sequence:
    1. Pythia: "I'd like to set up a visit with Dr. Vasquez.
               Do you have a preference for morning or afternoon?"
    2. Patient responds → Pythia checks available slots via:
       Option A: FHIR R5 scheduling API (if Navigator connected)
       Option B: Phone call to physician office (Twilio + IVR)
       Option C: Patient portal login via embedded browser
    3. Pythia presents 2-3 options: "She has Tuesday at 10am
       or Thursday at 2pm. Which works better for you?"
    4. Patient confirms → Pythia books + adds to reminders
    5. Pythia: "Done. Your appointment with Dr. Vasquez is
               Thursday, May 15 at 2pm at Stanford Neuroscience."
    6. 24-hour reminder fires automatically
    7. 2-hour reminder: "Your appointment is in 2 hours.
       Would you like me to arrange transport?"

  Confirmation: Explicit (patient selects slot)
  Fallback: If online booking unavailable → Pythia calls office
  Audit: appointment.scheduled logged with pseudonym IDs only
  [API_HOOK: PHYSICIAN_SCHEDULING]


TOOL B2: IMAGING_STUDY_COORDINATION
  ─────────────────────────────────────────
  Scope: MRI, CT, PET scan, ultrasound, X-ray, any imaging order

  Trigger: Patient request OR physician order via Navigator
           ("Dr. Vasquez has ordered your 3-month MRI.
            Would you like me to find the best time?")

  Special considerations:
    - Imaging requires physician referral/order — Pythia never
      initiates imaging without documented physician order
    - Pre-scan preparation reminders (fasting, contrast dye,
      metal implants, medication holds) delivered by Pythia
    - Transport coordination auto-triggered (see Tool B5)
    - Results follow-up: Pythia reminds to request results
      and assists with medical report explanation (Tool A from
      original catalog — document understanding)

  Action sequence:
    1. Physician order arrives via Navigator (FHIR ServiceRequest)
       OR patient mentions upcoming scan
    2. Pythia: "Your MRI order is in. Stanford Imaging usually
               has slots within 2 weeks. Shall I find you one?"
    3. Pythia contacts imaging center (FHIR scheduling OR phone)
    4. Presents options → patient confirms
    5. Pre-scan preparation brief delivered 48h before:
       "A reminder about your MRI tomorrow: nothing to eat or
        drink after midnight. I'll remind you again at 10pm.
        Do you have any questions about the scan?"
    6. Day-of: transport arranged if needed
    7. Post-scan: "How did it go? I'll let you know when
                   results are available."
    8. Results received via Navigator → medical report
       explanation offered (Tool D1)

  Confirmation: Explicit
  [API_HOOK: IMAGING_SCHEDULING]


TOOL B3: SPECIALIST_REFERRAL_COORDINATION
  ─────────────────────────────────────────
  Scope: Neurology, neurosurgery, palliative care, psychiatry,
         physical therapy, occupational therapy, speech therapy,
         pain management, nutrition, any specialist

  Trigger: Physician referral via Navigator OR patient request
           ("Pythia, my doctor mentioned I should see a
            physical therapist. Can you help me with that?")

  Action:
    1. Confirm referral source (physician recommendation vs. self-referral)
    2. If physician referral: retrieve referral details from FHIR
    3. Search for in-network specialists based on:
       - Insurance (from care team record)
       - Geographic proximity (device location, with consent)
       - Availability within clinically appropriate timeframe
       - Language spoken (from PCCA profile)
    4. Present top 2-3 options with brief plain-language descriptions
    5. Patient selects → Pythia books + coordinates records transfer
    6. Records transfer: request sent to referring physician
       via Pythia Navigator (FHIR DocumentReference)

  Confirmation: Explicit
  [API_HOOK: SPECIALIST_REFERRAL]


TOOL B4: INSURANCE_PRE_AUTHORIZATION
  ─────────────────────────────────────────
  Scope: Pre-authorization requests for imaging, specialist visits,
         medications, procedures, durable medical equipment

  Trigger: Navigator flags pending authorization OR patient is told
           "you need prior auth" by a provider

  Action:
    1. Pythia: "I can handle the insurance authorization for
               your MRI. This usually takes 3-5 business days.
               Want me to start the process?"
    2. Pythia compiles required documentation:
       - Clinical notes from Navigator (FHIR ClinicalImpression)
       - Imaging order (FHIR ServiceRequest)
       - Diagnosis codes (from patient record)
    3. Submits pre-auth request via:
       Option A: Insurance portal API (if available)
       Option B: Fax (Twilio Fax API — yes, still used in healthcare)
       Option C: Phone call to insurance (Twilio + structured script)
    4. Pythia tracks status and follows up if no response in 3 days
    5. Pythia reports outcome: "Your MRI authorization was approved.
       You're good to go for Thursday."
    6. If denied: "The insurance denied the request. Dr. Vasquez
                   can file an appeal — I'll let her team know."

  Confirmation: Explicit
  Note: Pythia never interprets coverage decisions — reports outcome only
  [API_HOOK: INSURANCE_PREAUTH]


TOOL B5: LABORATORY_TEST_COORDINATION
  ─────────────────────────────────────────
  Scope: Blood work, urine tests, biopsy follow-up scheduling,
         liquid biopsy coordination, genetic testing

  Trigger: Physician order OR scheduled recurring labs
           (e.g., monthly CBC during chemotherapy)

  Action:
    1. Identify nearest in-network laboratory
    2. Check fasting requirements → remind patient evening before
    3. Schedule appointment or confirm walk-in eligibility
    4. Arrange transport if needed
    5. Follow up on results when available via Navigator
    6. Results explained via medical report tool (Tool D1)

  Confirmation: Explicit
  [API_HOOK: LAB_COORDINATION]


TOOL B6: PHARMACY_COORDINATION (Enhanced from original catalog)
  ─────────────────────────────────────────
  Scope: Prescription refills, new prescription pickup,
         specialty pharmacy coordination, medication delivery,
         generic substitution queries, drug interaction questions

  (Original Tool 3 from Section 4 — enhanced with:)
  + Specialty pharmacy routing (chemotherapy agents, biologics)
  + 90-day supply requests where appropriate
  + Medication cost check and generic alternatives suggestion
  + Drug interaction alert (flags to physician, never self-diagnoses)
  + Delivery tracking: "Your medication is out for delivery today"

  [API_HOOK: PHARMACY_COORDINATION]


TOOL B7: MEDICAL_RECORDS_REQUEST
  ─────────────────────────────────────────
  Scope: Requesting records from previous providers, hospitals,
         imaging centers; compiling records for new specialist visits

  Trigger: Patient request OR new specialist appointment upcoming
           ("I'm seeing a new neurologist next week — I'll need
            to bring my records.")

  Action:
    1. Identify which records are needed (from conversation or Navigator)
    2. Generate signed release authorization (patient signs via app)
    3. Send request to provider via:
       - FHIR record request (if provider supports it)
       - Secure fax (Twilio)
       - Secure email with signed release
    4. Track receipt — follow up if not received in 5 business days
    5. Store received records in patient document vault

  Confirmation: Explicit + biometric (releases are PHI transmissions)
  [API_HOOK: RECORDS_REQUEST]
```

### CATEGORY C — DAILY LIFE COORDINATION

```
TOOL C1: TRANSPORT_COORDINATION
  ─────────────────────────────────────────
  Scope: Rides to medical appointments, pharmacy pickups,
         grocery runs, any transport need the patient requests

  Supported providers (extensible, not exhaustive):
    - Waymo (autonomous vehicle, preferred for safety)
    - Uber / Uber Health (HIPAA-compliant version available)
    - Lyft / Lyft Healthcare
    - Local taxi APIs (country-specific)
    - Volunteer driver programs (via care team contacts)
    - Public transit information (Google Maps API / local transit)

  Trigger: Patient request OR appointment within 24 hours
           ("Your MRI is tomorrow at 2pm. Would you like me
            to arrange a ride? I'd suggest leaving at 1:15.")

  Provider selection logic:
    1. Patient preference (stored in PCCA — "Owen prefers Uber")
    2. Availability in patient's area
    3. HIPAA compliance (for medical appointments: Uber Health preferred)
    4. Estimated arrival time vs. appointment time (15-min buffer)
    5. Accessibility requirements (wheelchair, etc. from PCCA)

  Action sequence:
    1. Pythia: "I'll arrange a Waymo for 1:15pm tomorrow.
               It'll take about 25 minutes to reach Stanford Imaging.
               Your pickup will be at [address]. Ready to book?"
    2. Patient confirms → Pythia books via provider API
    3. Booking confirmation: "Your ride is confirmed. Driver
       arrives at 1:15pm. I'll remind you at 12:45."
    4. Day-of reminders: 60min, 30min, 10min (if patient prefers)
    5. Ride tracking: Pythia can report driver status if asked
    6. Post-appointment: Pythia offers return ride if not pre-booked

  API integrations:
    Waymo: Via Waymo One API (available in select cities)
    Uber Health: Via Uber Health API (HIPAA BAA available)
    Lyft Healthcare: Via Lyft Concierge API
    Fallback: Pythia calls local taxi, reads address and destination
    [API_HOOK: TRANSPORT_BOOKING]

  Accessibility flags (from PCCA):
    wheelchair_accessible: boolean
    door_to_door_assistance: boolean
    quiet_vehicle_preferred: boolean
    no_strong_scent: boolean (chemotherapy sensitivity)


TOOL C2: GROCERY AND ESSENTIALS DELIVERY
  ─────────────────────────────────────────
  Trigger: Patient request
           ("Pythia, I'm running low on food and I don't
            feel up to going out.")

  Action:
    Instacart API, Amazon Fresh, local grocery delivery services
    Patient's usual items stored in preferences
    Pythia: "I'll reorder your usual groceries. Last time you
             got: bananas, yogurt, soup, bread. Anything to add?"
    [API_HOOK: GROCERY_DELIVERY]


TOOL C3: HOME CARE SERVICE COORDINATION
  ─────────────────────────────────────────
  Trigger: Patient request OR clinical recommendation
           ("Based on what you've shared, having some help
            at home a few days a week might make things easier.
            Would you like me to look into that?")

  Scope: Home health aide, visiting nurse, physical therapy
         at home, meal delivery services, housekeeping support

  Action:
    Connects to care team for physician orders where required
    Searches in-network home care providers
    Coordinates with insurance for coverage
    Schedules visits and manages schedule changes
    [API_HOOK: HOME_CARE_COORDINATION]


TOOL C4: CAREGIVER COORDINATION
  ─────────────────────────────────────────
  Scope: Keeping family caregivers informed and coordinated
         WITHOUT violating patient privacy or creating anxiety

  This tool has the most careful consent architecture of any tool.
  The patient controls exactly what their caregiver sees.

  Patient-defined caregiver visibility settings:
    □ General wellbeing ("Owen is having a good week")
    □ Appointment schedule (upcoming appointments only)
    □ Medication reminders (remind caregiver when patient may need help)
    □ Escalation alerts (only when Pythia escalates)

  What caregiver NEVER receives without explicit patient consent:
    ✗ NFB domain data
    ✗ Conversation content
    ✗ Medical document content
    ✗ Specific clinical observations

  Pythia coordinates between patient and caregiver:
    "Maria called to check in. Would you like me to let her
     know you're feeling well today?"
    "Your appointment Thursday — shall I let Maria know
     so she can come with you if she'd like?"
  [API_HOOK: CAREGIVER_COORDINATION]
```

### CATEGORY D — INFORMATION AND UNDERSTANDING

```
TOOL D1: MEDICAL_REPORT_EXPLANATION
  (Fully specified in Section 4, Part 8 — no change)
  Scope: MRI, CT, PET reports; lab results; discharge summaries;
         pathology reports; clinical notes; any medical document

TOOL D2: CONDITION_EDUCATION
  ─────────────────────────────────────────
  Trigger: Patient asks about their diagnosis, disease progression,
           treatment options, side effects, prognosis

  "Pythia, what is temozolomide and what does it do?"
  "What is MGMT methylation? My doctor mentioned it."
  "What does IDH-wildtype mean for my prognosis?"

  Action:
    1. Retrieve relevant patient context (diagnosis, treatment phase)
    2. Retrieve any documents containing mentioned term
    3. Claude Opus generates plain-language explanation:
       - Anchored to patient's specific situation
       - Honest about uncertainty
       - Age-appropriate analogies
       - Never more detail than patient asks for
       - Always invites follow-up questions
    4. Complex questions offered in stages:
       "Let me explain the first part. Want me to continue?"
    5. Key points offered as written summary (saved to Notes)

  Hard boundaries:
    ✗ Never speculates on prognosis beyond what records state
    ✗ Never contradicts treating physician
    ✗ Never recommends alternative treatments
    ✗ Always: "Your doctor knows your situation best.
               This helps you understand what they've told you."
  [API_HOOK: CONDITION_EDUCATION]


TOOL D3: MEDICATION_INFORMATION
  ─────────────────────────────────────────
  Trigger: Patient asks about a medication

  "Pythia, what is dexamethasone for? I feel strange on it."
  "Is it normal to feel nauseous after temozolomide?"

  Action:
    Plain-language explanation of medication purpose and
    common side effects from structured drug database (FDA API).
    Side effects validated before listing.
    Patient's specific concern acknowledged empathetically.
    If serious symptom described → clinical flag + physician notification.
    Always: "Let Dr. Vasquez know about this at your next visit.
             Shall I make a note for her?"
  [API_HOOK: MEDICATION_INFORMATION]


TOOL D4: APPOINTMENT_PREPARATION
  ─────────────────────────────────────────
  Trigger: 48 hours before any scheduled appointment

  Action:
    Pythia proactively offers:
    "Your appointment with Dr. Vasquez is in 2 days.
     Would you like help preparing?"

    Preparation assistance:
    - Symptom summary: "Here's what I've noticed since your last visit.
      Do you want me to add anything?" (pulled from NFB observations)
    - Question list: "Are there things you want to ask her?
      I can help you write them down."
    - Document preparation: "Should I prepare a summary of your
      recent test results for her to review?"
    - Logistics: "Do you need a ride? What time should I remind you?"

    Pre-appointment brief sent to Navigator (FHIR) if connected:
    Physician sees: symptom trajectory, patient's questions,
    recent NFB trend — all pseudonymized until FHIR auth complete
  [API_HOOK: APPOINTMENT_PREP]
```

### CATEGORY E — FINANCIAL AND ADMINISTRATIVE

```
TOOL E1: INSURANCE_CLAIMS_SUPPORT
  ─────────────────────────────────────────
  Trigger: Patient receives EOB (Explanation of Benefits) or
           unexpected bill, or asks "Pythia, I got this bill..."

  Action:
    1. Patient photographs bill → Pythia OCR-reads it
    2. Plain-language explanation of what the bill is for
    3. Check: Does this match our records of services received?
    4. If discrepancy: "This charge doesn't match your appointment
       records. Would you like me to help you dispute it?"
    5. Dispute assistance: Pythia drafts letter, patient confirms,
       Pythia sends to insurance contact in care team
    6. Tracks dispute status and follows up

  Hard boundaries:
    ✗ Never gives legal advice
    ✗ Always recommends professional review for large disputes
  [API_HOOK: INSURANCE_SUPPORT]


TOOL E2: FINANCIAL_ASSISTANCE_NAVIGATION
  ─────────────────────────────────────────
  Trigger: Patient mentions cost concern or financial stress
           around healthcare

  "Pythia, I'm worried about how we're going to pay for
   all of this."

  Action:
    This is one of the most empathetically sensitive tools.
    Pythia acknowledges the emotional weight first — always.

    "That's a real concern and you're not alone in it.
     Let me see what help is available."

    Pythia searches for:
    - Drug manufacturer patient assistance programs
    - Disease-specific foundation grants (e.g., National Brain
      Tumor Society financial assistance)
    - Hospital financial counseling referral
    - Social worker referral (via care team)
    - Medicare/Medicaid eligibility check (if applicable)
    - Clinical trial participation (if clinically appropriate
      and physician has not excluded)

  Pythia never promises financial outcomes. She opens doors.
  [API_HOOK: FINANCIAL_ASSISTANCE]
```

---

## ALCS ORCHESTRATION ARCHITECTURE

### How Pythia Decides Which Tool to Use

```
CONVERSATION TURN RECEIVED
    │
    ▼
INTENT CLASSIFIER (Claude, structured output)
    │
    Classifies intent into:
    ├── EMERGENCY (Category A) → immediate autonomous action
    ├── HEALTHCARE_COORDINATION (Category B) → offer + confirm
    ├── DAILY_LIFE (Category C) → offer + confirm
    ├── INFORMATION (Category D) → immediate, no confirm needed
    └── FINANCIAL_ADMIN (Category E) → offer + confirm + empathy first
    │
    ▼
TOOL SELECTION
    │
    Required data check:
    ├── Do I have everything needed to complete this action?
    │   YES → offer to act immediately
    │   NO  → ask only for the one missing piece
    │          (never ask for what we already have)
    │
    ▼
CONFIRMATION REQUEST (if required)
    Pythia frames as offer: "Shall I...?"
    Patient confirms verbally or via tap
    │
    ▼
TOOL EXECUTION
    API call to relevant service
    Timeout: 10s (fast), 30s (complex), 120s (phone calls)
    │
    ├── SUCCESS → Pythia confirms outcome to patient
    │             Logs to audit_log
    │
    └── FAILURE → Pythia acknowledges immediately
                  Offers alternative
                  Never silently fails
                  Logs failure to audit_log + Sentry
```

### Provider API Status by Region

```
TRANSPORT:
  US: Waymo One ✅, Uber Health ✅, Lyft Concierge ✅
  Argentina: Uber ✅, local taxi APIs (varies by city)
  Israel: Gett ✅, Uber ✅
  Brazil: 99 (Didi) ✅, Uber ✅

PHARMACY:
  US: Direct pharmacy phone (Twilio) ✅
      Capsule API ✅, PillPack (Amazon) ✅
  Argentina: Farmacity API (TBD), phone fallback ✅
  Israel: Super-Pharm API (TBD), phone fallback ✅

SCHEDULING:
  FHIR-compliant institutions: FHIR R5 scheduling ✅
  Non-FHIR: Phone call via Twilio ✅
  Patient portals: Embedded browser (interim) ✅

GROCERY:
  US: Instacart ✅, Amazon Fresh ✅
  Argentina: PedidosYa ✅, Rappi ✅
  Israel: Shufersal Online ✅
  Brazil: Rappi ✅, iFood ✅

FALLBACK FOR ALL CATEGORIES:
  Twilio outbound voice call — Pythia speaks naturally
  Works anywhere in the world with a phone number
  No API integration required
  This is the universal fallback that makes every tool
  work globally from day one.
```

---

## SUMMARY: COMPLETE AGENTIC CAPABILITY MAP

```
EMERGENCY        HEALTHCARE          DAILY LIFE         INFORMATION        FINANCIAL
───────────      ─────────────────   ────────────────   ────────────────   ──────────────
A1: 911 call     B1: Physician appt  C1: Transport      D1: Report explain  E1: Bill support
A2: Family call  B2: Imaging coord   C2: Groceries      D2: Condition edu   E2: Fin. assist
                 B3: Specialist ref  C3: Home care      D3: Medication info
                 B4: Insurance auth  C4: Caregiver      D4: Appt. prep
                 B5: Lab tests
                 B6: Pharmacy
                 B7: Medical records

TOTAL: 16 agentic tools across 5 categories
All governed by: consent architecture, audit logging,
pseudonymization, empathy-first communication, and
the principle that the patient is always in control.
```

*This addendum supersedes and expands the original 7-tool catalog in Section 4, Part 8.  
The original catalog entries are preserved within their respective categories above.*
