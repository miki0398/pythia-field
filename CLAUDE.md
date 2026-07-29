# CLAUDE.md — Pythia Field / Therapeia Ecosystem

## Project Identity
You are building **Pythia Field**, the patient-facing application of the Therapeia ecosystem.
This is a clinical-grade, HIPAA/GDPR/LGPD-compliant PWA focused on neurofeedback, multi-modal signal monitoring, and early detection of silent neurological/mental health symptoms.

## Locked Technology Stack (Do Not Change)
- Language: TypeScript only
- Frontend: React + Vite (PWA)
- Styling: CSS Modules
- Backend: Fastify
- Database & Auth: Supabase
- FHIR: FHIR R5 resources managed through Supabase + Navigator layer
- Infrastructure: Cloudflare + Fly.io
- LLM Primary: Claude (Anthropic) — Healthcare-ready where available

## Core Architectural Principles
1. Patient data is confidential by default. Access requires explicit FHIR Consent.
2. All clinical reasoning must follow multi-agent patterns inspired by clai-group/Pythia (specialist → critic → summarizer loop). Implement this natively in TypeScript.
3. Prefer progressive enhancement and offline-first behavior (PWA requirement for Patient Zero).
4. Security and audit logging are non-negotiable. Never bypass redaction or consent checks.
5. Keep the Living Forest visual metaphor and Pythia agent presence coherent with the design system.

## Key Reference Documents (always respect these)
- V4_Technical_Architecture.md
- V4_AI_ML_Architecture.md
- V4_Security_Architecture.md
- NFB_Dashboard_Feature_Spec_v3.0.md
- V4_Final_Board_Documents.md (MVP scope & risk register)

## Coding Rules
- Write clean, typed, production-oriented TypeScript.
- Prefer small, focused modules over large files.
- Every new clinical feature must include consent checks and audit trail.
- When generating UI for the Forest or NFB Dashboard, maintain the calm, hopeful aesthetic defined in the visual system.
- Do not introduce Next.js, Tailwind, Python, or additional frameworks unless explicitly requested.

## Current Build Priority
1. Foundation: Auth + Consent + Secure data model
2. Core multi-agent reasoning engine (TypeScript)
3. Living Forest PWA experience + NFB Dashboard domains
4. Multi-modal signal ingestion
5. Tiered alerting with family consent gates

When in doubt, ask for clarification against the V4 specifications rather than inventing new patterns.
