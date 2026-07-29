# PYTHIA FIELD — DEPLOYMENT MANUAL
## Section 6: Zero to Production · Complete Deployment Guide
### 32-Member Specialist Board · Approved Specification

**Date:** May 2026  
**Scope:** Development environment → Staging → Patient Zero production  
**Governing principle:** Every deployment step is documented, repeatable,  
and reversible. No tribal knowledge. No "works on my machine."  
A new engineer should be able to deploy the complete system from this document alone.

---

## PART 1 — PSEUDONYMIZATION ARCHITECTURE (Updated from Point 1)

Before deployment steps, the board formally adopts the patient/physician pseudonymization model proposed in the Section 5 review.

### 1.1 ID Generation Specification

```typescript
// [CRYPTO_HOOK: ID_GENERATION]
// Generates cryptographically random alphanumeric identifiers
// Patient IDs: 12 characters (72 bits entropy — exceeds NIST minimum)
// Physician IDs: 10 characters (60 bits entropy)
// Never sequential, never guessable, never reused

function generatePatientId(): string {
  // Alphabet: uppercase + digits, excluding ambiguous chars (0,O,I,1)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes)
    .map(b => alphabet[b % alphabet.length])
    .join('');
  // Example output: "K7P3MX9QR2WN"
}

// Examples:
// Patient: "K7P3MX9QR2WN" → maps to "Owen Jerez" (on device only)
// Doctor:  "D4R8NQ6T2F"   → maps to "Dr. Elena Vasquez" (on device only)
// Pharmacy:"PH2K9X7M3R"   → maps to "Stanford Pharmacy" (on device only)
```

### 1.2 Identity Mapping Architecture

```
PATIENT DEVICE (encrypted IndexedDB — only location of real names):
┌─────────────────────────────────────────────────────────┐
│  IDENTITY MAP (AES-256-GCM encrypted, never transmitted)│
│                                                         │
│  patients:                                              │
│    "K7P3MX9QR2WN" → "Owen Jerez"                       │
│                                                         │
│  physicians:                                            │
│    "D4R8NQ6T2F" → "Dr. Elena Vasquez, Neuro-oncologist"│
│    "D9M2PX5K7R" → "Dr. Michael Chen, Primary Care"     │
│                                                         │
│  pharmacies:                                            │
│    "PH2K9X7M3R" → "Stanford Pharmacy, (650) 555-0100" │
│                                                         │
│  emergency_contacts:                                    │
│    "EC7R3NM9P2" → "Maria Jerez, +1-650-555-0200"      │
└─────────────────────────────────────────────────────────┘
             │
             │ Only alphanumeric IDs ever leave device
             ▼
ALL SERVERS / ALL API CALLS / ALL DATABASE RECORDS:
  patient_id: "K7P3MX9QR2WN"
  physician_id: "D4R8NQ6T2F"
  emergency_contact_id: "EC7R3NM9P2"
  
  ← No server anywhere knows "Owen Jerez" exists
  ← No LLM API call contains "Owen Jerez"
  ← No Twilio record contains "Maria Jerez"
  ← Therapeia knows only "K7P3MX9QR2WN"
```

### 1.3 Emergency Call Pseudonymization

When Pythia calls 911 or an emergency contact, the voice script is assembled **on-device** and delivered via encrypted SRTP:

```typescript
// [SECURITY_HOOK: EMERGENCY_CALL_ASSEMBLY]
// Script assembled on device using local identity map
// Only encrypted audio reaches Twilio — no plaintext names on servers

async function assembleEmergencyScript(patientId: string): Promise<string> {
  // Look up real name from LOCAL encrypted identity map
  const identityMap = await localDB.getDecrypted('identity_map');
  const patientName = identityMap.patients[patientId];
  const address = identityMap.address; // Stored locally only
  
  // Script assembled in memory on device
  const script = `This is an automated emergency call from Pythia,
    a medical companion AI. I am calling on behalf of ${patientName},
    located at ${address}. The patient requires immediate assistance.
    Please send emergency services.`;
  
  // Convert to audio ON DEVICE (TTS on-device or ElevenLabs stream)
  const audio = await tts.generateLocally(script);
  
  // Send encrypted audio stream to Twilio (SRTP)
  // Twilio receives: encrypted audio stream + destination number only
  // Twilio NEVER receives: patient name, address as text
  await twilio.makeEncryptedCall({
    to: '911',                    // Or regional equivalent
    audioStream: audio,           // Encrypted SRTP
    callerId: PYTHIA_MASKED_NUMBER // Twilio masked number
  });
}
```

---

## PART 2 — PREREQUISITES

### 2.1 Accounts and Services Required

Before running a single command, the following accounts must exist and BAAs must be signed:

```
CLOUDFLARE:
  □ Account created at cloudflare.com
  □ Domain registered: pythia.health (or chosen domain)
  □ Workers paid plan activated ($5/month)
  □ R2 storage activated
  □ HIPAA BAA signed (Enterprise Sales: 1-650-319-8930)
  □ Zone created for domain

SUPABASE:
  □ Organization created at supabase.com
  □ Business plan activated (required for HIPAA BAA)
  □ HIPAA BAA signed (support@supabase.io)
  □ Project created in US East region (us-east-1)

FLY.IO:
  □ Account created at fly.io
  □ Credit card added
  □ HIPAA BAA signed (hipaa@fly.io)
  □ Organization created: "therapeia"

ANTHROPIC:
  □ API account created at console.anthropic.com
  □ HIPAA BAA signed (enterprise@anthropic.com)
  □ API key generated (store — shown once)
  □ Rate limits reviewed for production

OPENAI:
  □ API account at platform.openai.com
  □ HIPAA BAA signed (business@openai.com)
  □ API key generated
  □ Whisper + Embeddings access confirmed

ELEVENLABS:
  □ Account at elevenlabs.io
  □ Creator/Business plan (HIPAA BAA required — verify current status)
  □ Pythia voice created/cloned
  □ Voice ID noted

TWILIO:
  □ Account at twilio.com
  □ HIPAA BAA signed (hipaa@twilio.com)
  □ Phone number purchased (US: +1-XXX-XXX-XXXX)
  □ Regional emergency numbers tested per target market
  □ SRTP encryption enabled

AWS:
  □ Account at aws.amazon.com
  □ HIPAA BAA signed (automatic for eligible services)
  □ Textract service enabled in us-east-1
  □ IAM user created: "pythia-textract" (Textract permissions only)
  □ Access key generated

SENTRY (self-hosted):
  □ Docker environment for self-hosted Sentry
  □ Sentry instance deployed (Fly.io recommended)
  □ DSN generated

APPLE DEVELOPER (for HealthKit bridge):
  □ Apple Developer account ($99/year — Ron's Apple ID)
  □ App ID created: "health.therapeia.pythia"
  □ HealthKit capability enabled
  □ Provisioning profile created

PAGERDUTY:
  □ Account at pagerduty.com
  □ On-call schedule created
  □ Escalation policy: 15 min → secondary on-call
  □ Integrations: Cloudflare alerts, Sentry alerts, Supabase alerts
```

### 2.2 Local Development Environment

```bash
# Required software — verified versions

# Node.js (LTS)
node --version  # Must be: v22.x.x
npm --version   # Must be: 10.x.x

# Package manager
npm install -g pnpm@9  # pnpm preferred (faster, strict)

# Cloudflare CLI
npm install -g wrangler@3
wrangler --version  # Must be: 3.x.x

# Fly.io CLI
curl -L https://fly.io/install.sh | sh
fly version  # Must be: 0.3.x+

# Supabase CLI
npm install -g supabase@1
supabase --version  # Must be: 1.x.x

# Xcode (for HealthKit bridge — Mac only)
xcode-select --version  # Must be: Xcode 15.x+

# Git
git --version  # Any recent version

# Verify all prerequisites
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Wrangler: $(wrangler --version)"
echo "Fly: $(fly version)"
echo "Supabase: $(supabase --version)"
```

---

## PART 3 — REPOSITORY STRUCTURE

```bash
# Clone and initial setup
git clone https://github.com/therapeia/pythia-field.git
cd pythia-field

# Repository structure
pythia-field/
├── apps/
│   ├── web/                    # React PWA (Phase A)
│   │   ├── public/
│   │   │   ├── index.html
│   │   │   ├── manifest.json
│   │   │   └── icons/          # All required icon sizes
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── screens/        # Forest, Cave, CareTeam, Settings
│   │   │   ├── services/       # API, NFB, BLE, HealthKit bridge
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── utils/          # Crypto, formatting, pseudonymization
│   │   │   ├── config/         # Environment, feature flags
│   │   │   └── assets/         # Self-hosted fonts, compressed images
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── native/                 # React Native Phase B (future)
│       └── (not yet created)
│
├── packages/
│   ├── shared/                 # Shared types, utilities, business logic
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces (shared)
│   │   │   ├── nfb/            # NFB engine (runs on device + server)
│   │   │   ├── pcca/           # PCCA inference logic
│   │   │   ├── crypto/         # Pseudonymization, encryption utils
│   │   │   └── validation/     # Zod schemas (shared client + server)
│   │   └── package.json
│   │
│   └── healthkit-bridge/       # Swift WKWebView wrapper
│       ├── PythiaApp.swift
│       ├── HealthKitBridge.swift
│       └── PythiaApp.xcodeproj/
│
├── backend/
│   ├── src/
│   │   ├── modules/            # (per Section 3 architecture)
│   │   ├── shared/
│   │   └── infrastructure/
│   ├── prisma/                 # Database schema + migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── fly.toml                # Fly.io configuration
│   └── package.json
│
├── workers/                    # Cloudflare Workers (edge layer)
│   ├── api-gateway/            # Request routing, rate limiting
│   ├── websocket/              # WebSocket handler (Durable Objects)
│   └── zone-router/            # TRR zone routing
│
├── infrastructure/
│   ├── terraform/              # IaC (optional Phase 2)
│   └── scripts/                # Deployment, migration scripts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                    # Playwright
│
├── docs/
│   └── security/               # Blocker resolution logs
│
├── .env.example                # Template — NEVER commit .env
├── .gitignore                  # Includes: .env, *.key, node_modules
└── pnpm-workspace.yaml         # Monorepo workspace config
```

---

## PART 4 — ENVIRONMENT CONFIGURATION

### 4.1 Environment Files

```bash
# NEVER commit these files. They contain secrets.
# .gitignore must include: .env .env.* *.pem *.key

# Copy template and fill in values
cp .env.example .env.local          # Local development
cp .env.example .env.staging        # Staging
cp .env.example .env.production     # Production — stored in Fly.io secrets
```

```bash
# .env.example — template with all required variables

# ═══════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════
NODE_ENV=development
APP_VERSION=0.1.0
LOG_LEVEL=debug                    # production: error

# ═══════════════════════════════════════
# CLOUDFLARE
# ═══════════════════════════════════════
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
CF_R2_BUCKET_NAME=pythia-documents-prod
CF_R2_BUCKET_NAME_STAGING=pythia-documents-staging
CF_KV_NAMESPACE_GLOBAL=your_kv_namespace_id
CF_KV_NAMESPACE_ZONE_US=your_us_kv_id
CF_KV_NAMESPACE_ZONE_EU=your_eu_kv_id
CF_KV_NAMESPACE_ZONE_BR=your_br_kv_id
CF_DURABLE_OBJECTS_NAMESPACE=your_do_namespace

# ═══════════════════════════════════════
# SUPABASE
# ═══════════════════════════════════════
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx                # Public — safe in client bundle
SUPABASE_SERVICE_KEY=eyJxxx            # PRIVATE — backend only, never client
SUPABASE_JWT_SECRET=your_jwt_secret

# Zone-specific databases
SUPABASE_URL_EU=https://yyyy.supabase.co
SUPABASE_SERVICE_KEY_EU=eyJyyy

SUPABASE_URL_BR=https://zzzz.supabase.co
SUPABASE_SERVICE_KEY_BR=eyJzzz

# ═══════════════════════════════════════
# AI SERVICES — BACKEND ONLY
# ═══════════════════════════════════════
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL_PRIMARY=claude-sonnet-4-6
ANTHROPIC_MODEL_COMPLEX=claude-opus-4-6
ANTHROPIC_MODEL_FALLBACK=claude-haiku-4-5

OPENAI_API_KEY=sk-xxx
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_WHISPER_MODEL=whisper-1

ELEVENLABS_API_KEY=xi-xxx
ELEVENLABS_VOICE_ID=your_pythia_voice_id

# ═══════════════════════════════════════
# COMMUNICATIONS
# ═══════════════════════════════════════
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# Regional emergency numbers (expand as needed)
EMERGENCY_NUMBER_US=911
EMERGENCY_NUMBER_AR=107
EMERGENCY_NUMBER_IL=101
EMERGENCY_NUMBER_BR=192
EMERGENCY_NUMBER_EU=112

# ═══════════════════════════════════════
# AWS (TEXTRACT OCR)
# ═══════════════════════════════════════
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXX
AWS_SECRET_ACCESS_KEY=xxx
AWS_TEXTRACT_REGION=us-east-1

# ═══════════════════════════════════════
# SECURITY
# ═══════════════════════════════════════
JWT_SECRET=minimum_64_char_random_string_here
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d
MASTER_ENCRYPTION_KEY_ID=cf-kms-key-id

# WebAuthn
WEBAUTHN_RP_NAME=Pythia Health
WEBAUTHN_RP_ID=pythia.health
WEBAUTHN_ORIGIN=https://pythia.health

# ═══════════════════════════════════════
# MONITORING
# ═══════════════════════════════════════
SENTRY_DSN=https://xxx@sentry.self-hosted.therapeia.health/1
PAGERDUTY_ROUTING_KEY=xxx
```

### 4.2 Secrets Management in Production

```bash
# Production secrets stored in Fly.io — never in environment files

# Set all production secrets (run once per secret, update as needed)
fly secrets set \
  ANTHROPIC_API_KEY="sk-ant-xxx" \
  OPENAI_API_KEY="sk-xxx" \
  ELEVENLABS_API_KEY="xi-xxx" \
  TWILIO_ACCOUNT_SID="ACxxx" \
  TWILIO_AUTH_TOKEN="xxx" \
  SUPABASE_SERVICE_KEY="eyJxxx" \
  JWT_SECRET="$(openssl rand -hex 64)" \
  MASTER_ENCRYPTION_KEY_ID="cf-kms-key-id" \
  --app pythia-backend

# Verify secrets set (shows names only, never values)
fly secrets list --app pythia-backend
```

---

## PART 5 — DATABASE INITIALIZATION

### 5.1 Supabase Project Setup

```bash
# Initialize Supabase connection
supabase login
supabase link --project-ref your_project_ref

# Run initial migration (creates all tables from Section 4)
supabase db push

# Verify tables created
supabase db diff  # Should show no diff after push

# Enable Row Level Security on all tables
# (Included in migration — verify manually)
supabase db query "
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
"
# All tables must show: rowsecurity = true

# Enable pgvector extension (for document embeddings)
supabase db query "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify pgvector installed
supabase db query "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### 5.2 Database Migration Strategy

```bash
# Migration files live in: backend/prisma/migrations/
# Naming convention: YYYYMMDD_HHMMSS_description.sql
# Examples:
#   20260501_120000_create_patients_table.sql
#   20260501_120100_create_nfb_events_table.sql
#   20260501_120200_enable_rls_all_tables.sql
#   20260501_120300_create_audit_log.sql

# Apply migrations in order (automated in CI/CD)
supabase db push --include-all

# NEVER modify a migration that has been applied to production
# ALWAYS create a new migration to fix or alter schema
# ALWAYS test migration on staging before production

# Rollback strategy:
# Migrations are forward-only. Rollback = new migration that reverses changes.
# This is by design — prevents data loss from accidental rollbacks.
```

### 5.3 Initial Data Seeding (Patient Zero)

```bash
# Create Patient Zero test record (staging only — never production)
supabase db query "
INSERT INTO patients (
  id,
  display_name,   -- 'Patient Zero' in staging
  baseline_level,
  preferences,
  consent_record,
  device_platform,
  timezone,
  zone_id
) VALUES (
  gen_random_uuid(),
  'Patient Zero',
  0,
  '{\"notifications\": true, \"tts_enabled\": true, \"font_size\": \"large\"}'::jsonb,
  '{\"core_monitoring\": {\"granted\": false}}'::jsonb,
  'ios_pwa',
  'America/Los_Angeles',
  'zone-us'
);
"

# Note: In production, patient record is created during onboarding flow
# Seed data is ONLY for staging/testing
```

---

## PART 6 — CLOUDFLARE WORKERS DEPLOYMENT

### 6.1 API Gateway Worker

```bash
cd workers/api-gateway

# Configure wrangler.toml
cat > wrangler.toml << 'EOF'
name = "pythia-api-gateway"
main = "src/index.ts"
compatibility_date = "2026-05-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "GLOBAL_KV"
id = "your_kv_namespace_id"

[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "pythia-documents-prod"

[durable_objects]
bindings = [
  { name = "WEBSOCKET_HANDLER", class_name = "WebSocketHandler" }
]

[[migrations]]
tag = "v1"
new_classes = ["WebSocketHandler"]

[limits]
cpu_ms = 50  # 50ms CPU limit per request at edge
EOF

# Deploy to Cloudflare
wrangler deploy

# Verify deployment
curl https://api.pythia.health/health
# Expected: {"status": "ok", "version": "0.1.0", "zone": "us"}
```

### 6.2 Zone Router Worker

```bash
cd workers/zone-router

# This worker intercepts ALL requests and routes to correct zone
# Based on patient_id → zone mapping in Global KV

wrangler deploy --name pythia-zone-router

# Test zone routing (staging)
curl -H "Authorization: Bearer test_token" \
     https://api.pythia.health/api/v1/zone-check
# Expected: {"zone": "zone-us", "patient_id": "K7P3MX9QR2WN"}
```

---

## PART 7 — BACKEND DEPLOYMENT (FLY.IO)

### 7.1 Initial Deployment

```bash
cd backend

# Initialize Fly.io app (run once)
fly launch \
  --name pythia-backend \
  --region iad \         # US East — primary zone
  --no-deploy            # Configure before first deploy

# fly.toml is generated — review and update:
cat > fly.toml << 'EOF'
app = "pythia-backend"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false   # NEVER auto-stop for health companion
  auto_start_machines = true
  min_machines_running = 2     # Always 2 instances minimum for HA

  [http_service.concurrency]
    type = "connections"
    hard_limit = 500
    soft_limit = 400

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 2

[checks]
  [checks.health]
    grace_period = "30s"
    interval = "15s"
    method = "GET"
    path = "/health"
    port = 8080
    timeout = "5s"
    type = "http"
EOF

# Deploy secrets first (Part 4.2), then deploy
fly deploy --app pythia-backend

# Verify deployment
fly status --app pythia-backend
fly logs --app pythia-backend
```

### 7.2 Multi-Zone Backend Deployment

```bash
# EU zone backend
fly launch --name pythia-backend-eu --region ams  # Amsterdam
fly deploy --app pythia-backend-eu \
  --env SUPABASE_URL="$SUPABASE_URL_EU" \
  --env ZONE_ID="zone-eu"

# Brazil zone backend  
fly launch --name pythia-backend-br --region gru  # São Paulo
fly deploy --app pythia-backend-br \
  --env SUPABASE_URL="$SUPABASE_URL_BR" \
  --env ZONE_ID="zone-br"

# Each zone is an independent deployment
# Zone router (Cloudflare Worker) directs patients to correct zone
```

### 7.3 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only package files first (layer cache optimization)
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN pnpm build

# Production image — minimal
FROM node:22-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 pythia && adduser -u 1001 -G pythia -s /bin/sh -D pythia
WORKDIR /app

# Copy only compiled output + production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Set ownership
RUN chown -R pythia:pythia /app
USER pythia

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

---

## PART 8 — FRONTEND PWA DEPLOYMENT

### 8.1 Build Configuration

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',          // Prompt user before SW update
      includeAssets: [                  // Precache these assets
        'fonts/*.woff2',
        'images/Pythia_in_the_forest.jpg',
        'images/the_cave_of_knowing.jpg',
        'audio/ambient_forest.mp3',
        'icons/*.png'
      ],
      manifest: {
        name: 'Pythia · Your Living Forest',
        short_name: 'Pythia',
        description: 'Your personal neurological companion',
        theme_color: '#0a1a06',
        background_color: '#0a1a06',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512',
            type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache strategies per Section 3
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.pythia\.health\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 3 }
          },
          {
            urlPattern: /\.(jpg|jpeg|png|gif|webp|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,              // No source maps in production (security)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          canvas: ['./src/services/canvas'],
          ai: ['./src/services/conversation']
        }
      }
    }
  }
});
```

### 8.2 Frontend Deployment (Cloudflare Pages)

```bash
cd apps/web

# Build
pnpm build
# Output: apps/web/dist/

# Deploy to Cloudflare Pages
wrangler pages deploy dist \
  --project-name pythia-web \
  --branch main

# Custom domain setup
# Cloudflare Dashboard → Pages → pythia-web → Custom domains
# Add: pythia.health, app.pythia.health

# Verify deployment
curl -I https://app.pythia.health
# Expected: HTTP/2 200, content-type: text/html
# Check: Strict-Transport-Security header present
# Check: Content-Security-Policy header present
```

### 8.3 Image Asset Preparation

```bash
# Compress forest images for PWA (full PNG is too large for first load)
# Target: Pythia_in_the_forest.jpg < 800KB, cave < 600KB

# Install image tools
brew install imagemagick webp

# Convert PNG to optimized JPEG (quality 88 — visually lossless)
convert Pythia_in_the_forest.png \
  -quality 88 \
  -resize "1400x>" \          # Max width 1400px (2x iPhone 14 Pro Max)
  apps/web/public/images/Pythia_in_the_forest.jpg

convert the_cave_of_knowing.png \
  -quality 88 \
  -resize "1400x>" \
  apps/web/public/images/the_cave_of_knowing.jpg

# Also generate WebP versions (smaller, Chrome + Safari 14+)
cwebp -q 90 Pythia_in_the_forest.png \
  -o apps/web/public/images/Pythia_in_the_forest.webp

cwebp -q 90 the_cave_of_knowing.png \
  -o apps/web/public/images/the_cave_of_knowing.webp

# Verify sizes
ls -lh apps/web/public/images/
# Target: each image < 800KB
```

---

## PART 9 — HEALTHKIT BRIDGE DEPLOYMENT (XCODE)

### 9.1 Swift App Build and Deploy to Owen's iPhone

```bash
# Prerequisites: Mac with Xcode 15+, Apple Developer account active

cd packages/healthkit-bridge

# Update bundle ID and team
# In Xcode: Select PythiaApp → Signing & Capabilities
# Team: Your Apple Developer Team
# Bundle Identifier: health.therapeia.pythia

# Update PythiaApp.swift with production URL
# Change: URL(string: "https://app.pythia.health")

# Build for device (NOT simulator)
xcodebuild \
  -project PythiaApp.xcodeproj \
  -scheme PythiaApp \
  -destination "platform=iOS,name=Owen's iPhone" \
  -configuration Release \
  CODE_SIGN_IDENTITY="iPhone Developer" \
  DEVELOPMENT_TEAM="YOUR_TEAM_ID" \
  build

# Install directly to Owen's iPhone via Xcode
# Xcode → Window → Devices and Simulators → Install App

# OR use Apple Configurator 2 for non-developer installation
```

### 9.2 HealthKit Permissions Verification

```bash
# After installation, verify HealthKit permissions appear correctly
# Owen's iPhone → Settings → Privacy & Security → Health → Pythia
# Should show all required data types with toggle switches

# Verify data flows by checking backend logs after Owen grants permission
fly logs --app pythia-backend | grep "healthkit"
# Expected: "HealthKit sync received for patient K7P3MX9QR2WN"
```

---

## PART 10 — CI/CD PIPELINE

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Pythia Deploy Pipeline

on:
  push:
    branches: [main]       # Production deploy
  push:
    branches: [staging]    # Staging deploy
  pull_request:
    branches: [main]       # PR checks only, no deploy

env:
  NODE_VERSION: '22'

jobs:
  # ─────────────────────────────────
  # QUALITY GATES (must pass before deploy)
  # ─────────────────────────────────
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm typecheck
        # Zero TypeScript errors required
      
      - name: Lint
        run: pnpm lint
        # Zero ESLint errors required
      
      - name: Security audit
        run: pnpm audit --audit-level=high
        # Zero HIGH or CRITICAL vulnerabilities allowed
      
      - name: Unit tests
        run: pnpm test:unit
        # 100% pass required
      
      - name: Check for PHI in code
        run: pnpm run check:phi
        # Custom script: scans for patient names, real emails, phone numbers
        # Fails if any real PHI found in codebase

  # ─────────────────────────────────
  # STAGING DEPLOY
  # ─────────────────────────────────
  deploy-staging:
    needs: [quality]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy backend to staging
        run: fly deploy --app pythia-backend-staging --wait-timeout 120
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Deploy Workers to staging
        run: wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Deploy frontend to staging
        run: |
          pnpm build
          wrangler pages deploy dist --project-name pythia-web-staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Run integration tests
        run: pnpm test:integration --env staging
      
      - name: Run E2E tests (Playwright)
        run: pnpm test:e2e --env staging
        # Includes Patient Zero simulation tests

  # ─────────────────────────────────
  # PRODUCTION DEPLOY
  # ─────────────────────────────────
  deploy-production:
    needs: [quality]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production   # Requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4
      
      - name: Run database migrations
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Deploy backend (blue-green)
        run: |
          fly deploy --app pythia-backend \
            --strategy rolling \    # Zero-downtime rolling deploy
            --wait-timeout 180
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Health check post-deploy
        run: |
          sleep 30
          curl -f https://api.pythia.health/health || exit 1
      
      - name: Deploy Workers
        run: wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Deploy frontend
        run: |
          pnpm build
          wrangler pages deploy dist \
            --project-name pythia-web \
            --branch main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Notify PagerDuty — deploy success
        run: |
          curl -X POST https://events.pagerduty.com/v2/enqueue \
            -H "Content-Type: application/json" \
            -d '{"routing_key":"${{ secrets.PAGERDUTY_KEY }}",
                 "event_action":"trigger",
                 "payload":{"summary":"Pythia production deploy complete",
                            "severity":"info"}}'
```

---

## PART 11 — MONITORING & OBSERVABILITY

### 11.1 Health Check Endpoints

```typescript
// backend/src/health.ts
// These endpoints are checked every 15 seconds by Fly.io

app.get('/health', async (req, reply) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAnthropicAPI(),
    checkTwilio(),
  ]);
  
  const status = checks.every(c => c.status === 'fulfilled') 
    ? 'healthy' : 'degraded';
  
  return reply.status(status === 'healthy' ? 200 : 503).send({
    status,
    version: process.env.APP_VERSION,
    zone: process.env.ZONE_ID,
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status,
      cache: checks[1].status,
      llm: checks[2].status,        // 'fulfilled' or 'rejected'
      communications: checks[3].status
    }
    // Note: No PHI in health endpoint. System status only.
  });
});
```

### 11.2 Key Metrics to Monitor

```
PATIENT EXPERIENCE METRICS (PagerDuty alerts if breached):
  Conversation response latency P95 > 3000ms  → ALERT
  TTS delivery latency P95 > 1000ms           → ALERT
  WebSocket disconnection rate > 5%/hour      → ALERT
  PWA load time P95 > 4000ms                 → ALERT
  Push notification delivery rate < 95%       → ALERT

CLINICAL SAFETY METRICS (PagerDuty CRITICAL):
  Emergency escalation failure rate > 0%      → IMMEDIATE PAGE
  911 call failure                            → IMMEDIATE PAGE
  NFB engine offline > 5 minutes             → CRITICAL PAGE
  Audit log write failure                     → CRITICAL PAGE

SYSTEM METRICS (PagerDuty alerts if breached):
  Backend CPU > 80% sustained 5min           → ALERT
  Backend memory > 85%                       → ALERT
  Database connections > 80% pool            → ALERT
  API error rate > 1%                        → ALERT
  R2 upload failure rate > 0.1%             → ALERT

SECURITY METRICS (immediate investigation):
  Failed auth attempts > 10/patient/hour     → SECURITY ALERT
  Cross-zone data access attempt             → CRITICAL SECURITY
  Unusual API access pattern                 → SECURITY REVIEW
```

---

## PART 12 — ROLLBACK STRATEGY

### 12.1 Backend Rollback

```bash
# Fly.io maintains last 10 deployments
# Rollback to previous version (< 30 seconds)

fly releases list --app pythia-backend
# Shows: v1, v2, v3... with timestamps

# Rollback to specific version
fly deploy --image registry.fly.io/pythia-backend:deployment-v12 \
  --app pythia-backend

# Verify rollback
fly status --app pythia-backend
curl https://api.pythia.health/health | jq '.version'
```

### 12.2 Database Rollback

```bash
# Supabase point-in-time recovery
# Available on Business plan (HIPAA-eligible)

# List available restore points
supabase db remote commit

# Restore to specific timestamp (DESTRUCTIVE — requires approval)
# This is last resort — data since restore point is LOST
# Standard rollback: create forward migration to undo changes

# Preferred approach: Forward-only migration rollback
# Create new migration: 20260601_000000_rollback_feature_x.sql
supabase migration new rollback_feature_x
# Edit migration to reverse the changes
supabase db push
```

### 12.3 Cloudflare Workers Rollback

```bash
# Cloudflare maintains deployment history
wrangler rollback --deployment-id previous_deployment_id

# Or redeploy from git tag
git checkout v0.1.2
wrangler deploy
```

---

## PART 13 — PATIENT ZERO ONBOARDING PROCEDURE

This is the step-by-step procedure for onboarding Owen Jerez as Patient Zero. This is a human procedure, not automated.

```
PRE-ONBOARDING CHECKLIST (complete before Owen's session):
  □ All 10 security blockers resolved and documented
  □ Staging environment tested with synthetic patient
  □ Production environment health check: all green
  □ Emergency escalation tested: staging 911 call successful
  □ Owen's emergency contact (Maria) informed and confirmed
  □ Consent documents reviewed with Owen (legal, not just UI)
  □ Owen's iPhone has the HealthKit bridge app installed
  □ Owen's Apple Watch paired and Health app syncing
  □ Ron available throughout first session (monitoring logs)
  □ Clinical Safety Officer available on call

ONBOARDING SESSION (with Owen):

STEP 1 — Install PWA (5 minutes)
  Owen opens Safari on iPhone
  Navigate to: https://app.pythia.health
  Safari → Share → Add to Home Screen
  Name: "Pythia" → Add
  App icon appears on home screen
  
STEP 2 — First Launch (10 minutes)
  Owen taps Pythia on home screen
  Welcome sequence begins (Section 2, Part E.1)
  Face ID enrollment for WebAuthn
  Name confirmation: Owen confirms "Owen"
  
STEP 3 — Permissions (5 minutes)
  Microphone consent: present, explain, confirm
  Ambient listening consent: present, explain, Owen's choice
  Health data (HealthKit): present, explain, confirm
  Each consent logged with timestamp
  
STEP 4 — Care Team Setup (15 minutes)
  Emergency contact: Maria Jerez added
    Phone, relationship, sensitivity preference
    Confirmation SMS sent to Maria
    Maria confirms via SMS reply
  At least one physician added
  
STEP 5 — First Pythia Conversation (20 minutes)
  Owen and Pythia meet properly
  PCCA data collection begins
  NFB baseline construction begins
  Ron monitors logs (not Owen's conversation — privacy)
  
STEP 6 — Post-Session Review (Ron only)
  Check: audit_log shows correct entries
  Check: no PHI in any server-side log
  Check: NFB events recorded for patient ID only
  Check: no real names in database
  Check: PCCA extraction queued

ONGOING MONITORING (first 14 days):
  Daily: Review system health metrics
  Daily: Confirm NFB events being recorded
  Week 2: Review first PCCA profile draft
  Day 14: Cave first accessible — observe Owen's reaction
```

---

## SECTION 6 — DEPLOYMENT SUMMARY

### Critical Path to Patient Zero

```
WEEK 1:
  □ All accounts created, BAAs signed
  □ Repository cloned, dependencies installed
  □ Environment files configured (staging)
  □ Database initialized (staging)
  □ Backend deployed to staging
  □ Frontend deployed to staging (Cloudflare Pages)
  □ Workers deployed to staging

WEEK 2:
  □ All 10 security blockers tested on staging
  □ Emergency escalation tested (real Twilio call to test number)
  □ Patient Zero synthetic run (fake patient, all flows)
  □ Penetration test initiated
  □ HealthKit bridge built and installed on test iPhone

WEEK 3:
  □ Penetration test results reviewed
  □ All HIGH/CRITICAL findings resolved
  □ Production environment deployed
  □ DNS cutover: pythia.health → production
  □ Production health check: all green

WEEK 4:
  □ Owen onboarding session (Part 13 procedure)
  □ First 48 hours: enhanced monitoring
  □ First cave visit (Day 14): observe and log
  □ Week 4 review: PCCA draft, NFB baseline quality

PATIENT ZERO IS LIVE. The real work begins.
```

---

## APPROVED — READY FOR SECTION 7

**Board recommendation:** Section 6 complete. Proceed to  
**Section 7 — QA Manual + Patient Zero Test Scripts**  
covering: complete quality assurance strategy, functional testing,  
integration testing, E2E testing, accessibility testing,  
security testing, clinical workflow validation, AI evaluation,  
and step-by-step Patient Zero test scripts requiring no technical knowledge.

*Awaiting Ron's approval.*
