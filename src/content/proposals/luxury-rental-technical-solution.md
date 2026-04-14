---
title: "Technical Solution: Dubai Luxury Multi-Vendor Rental Platform"
client: "Luxury Multi-Vendor Rental"
author: "Maulana Shalihin"
role: "Senior Full-Stack Developer"
contact: "Indonesia - GMT+8"
date: "2026-04-14"
status: "draft"
tags: ["Next.js", "Supabase", "Checkout.com", "Marketplace", "Dubai"]
---

**Prepared for:** Luxury Multi-Vendor Rental Platform
**By:** Maulana Shalihin | Senior Full-Stack Developer
**Location:** Indonesia - GMT+8 (4+ hours overlap with UTC+4)
**Links:** [GitHub](https://github.com/maulanashalihin) | [Portfolio](https://maulanabuilds.com)

---

## Executive Summary

I understand you're building a **Dubai-specific luxury rental marketplace** with strict DET (Department of Economy & Tourism) compliance requirements. This isn't a generic Airbnb clone—it's a purpose-built platform for Dubai's weekly and monthly furnished accommodation market with three vendor types (Independent Homeowners, Property Management Companies, Hotel Apartments).

Having reviewed the SRS v2.0 requirements, I understand the **6 critical technical challenges** that must be solved correctly from Day 1:

1. **Dubai Math Engine** - Tourism Dirham calculation with 30-night cap (server-side only)
2. **Booking Race Conditions** - Prevent double-bookings with PostgreSQL row-level locking
3. **Webhook Idempotency** - Handle duplicate Checkout.com webhooks without double-processing
4. **Multi-Tenant RLS** - Vendor A must never access Vendor B's data (Supabase Row Level Security)
5. **Guest Document Vault** - SHA-256 hashed document numbers with signed URL access (1-hour expiry)
6. **Financial Audit Trail** - INSERT-only booking_events table for UAE regulatory compliance

My approach: **Enterprise-grade execution** with security-first architecture, comprehensive testing, and complete documentation for future team scaling.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 (App Router) - Vercel                     │
│                                                                         │
│  Server Components (SSR)                                                │
│  ├── Home, Search, Listing Detail, Booking Flow                         │
│  ├── Vendor Dashboard, Guest Dashboard, Admin Panel                     │
│  └── All pages with server-side data fetching                           │
│                                                                         │
│  API Routes                                                             │
│  ├── /api/webhook/checkout → Checkout.com webhook handler               │
│  ├── /api/webhook/whatsapp → WhatsApp delivery status                   │
│  ├── /api/cron/payouts → Daily payout processing (Vercel Cron)          │
│  └── /api/cron/check-in-reminders → Notification triggers               │
│                                                                         │
│  Server Actions                                                         │
│  ├── createBooking() → Booking creation with race condition protection  │
│  ├── calculateDubaiMath() → Tourism Dirham calculation (server-side)    │
│  ├── uploadDocument() → Guest document vault with SHA-256 hashing       │
│  ├── uploadPropertyImages() → Property image upload to Backblaze B2     │
│  └── sendNotification() → WhatsApp/SMS notifications                    │
│                                                                         │
│  Middleware                                                             │
│  └── Auth checks, role validation (vendor/guest/admin)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / Direct DB Connection / S3 API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE PLATFORM                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   PostgreSQL    │  │      Auth       │  │       Storage           │ │
│  │   (with RLS)    │  │  (4 methods)    │  │  (Guest Document Vault) │ │
│  │                 │  │                 │  │                         │ │
│  │ - bookings      │  │ - Email/Pass    │  │ - Private bucket        │ │
│  │ - properties    │  │ - OAuth (Google)│  │ - Signed URLs (1hr)     │ │
│  │ - users         │  │ - Phone (SMS)   │  │ - SHA-256 hash only     │ │
│  │ - webhook_logs  │  │ - WhatsApp OTP  │  │                         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────┐
│  Checkout.com   │      │  WhatsApp API   │      │  Backblaze B2       │
│  (Payments +    │      │  (9 templates   │      │  (Property Images)  │
│   BNPL Tabby)   │      │   + SMS fallback)│     │  + Cloudflare CDN   │
└─────────────────┘      └─────────────────┘      └─────────────────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │  Sanity.io CMS      │
                                            │  (Content editing   │
                                            │   for Week 5)       │
                                            └─────────────────────┘
```

### Why All Next.js? (Architecture Decision)

**For this 6-week MVP, I recommend All Next.js over Hybrid (Next.js + Edge Functions):**

| Aspect | Hybrid Approach | All Next.js Approach |
|--------|-----------------|---------------------|
| **Codebase** | Two (Next.js + Deno/Edge) | Single (Next.js only) |
| **Context switching** | Yes (TypeScript + Deno) | No (TypeScript everywhere) |
| **Development speed** | Slower (setup both) | Faster (one stack) |
| **Debugging** | More complex | Simpler |
| **Cost** | Extra Edge Function charges | Included in Vercel |
| **Cold starts** | None (Edge warm) | 1-3 sec (acceptable for MVP) |
| **Timeout limits** | 60 sec | 60 sec (Vercel Pro) |

**Recommendation:** Start with All Next.js for MVP velocity. Re-evaluate Edge Functions in Phase 2 if global edge latency becomes critical.

---

## Critical Implementation Details

### A. Dubai Math Engine

**Formula:** `Tourism Dirham = AED 10 × bedrooms × min(nights, 30)`

**Implementation:** Server-side via Next.js Server Action — **never** calculated in frontend.

```typescript
// lib/dubai-math.ts
interface DubaiMathInput {
  bedrooms: number;
  nights: number;
  baseRate: number; // AED
}

interface DubaiMathOutput {
  baseAmount: number;
  tourismDirham: number;
  totalAmount: number;
  breakdown: {
    nightsCharged: number;
    dirhamPerNight: number;
    capApplied: boolean;
  };
}

export function calculateDubaiMath(input: DubaiMathInput): DubaiMathOutput {
  const { bedrooms, nights, baseRate } = input;
  
  // 30-night cap for Tourism Dirham
  const nightsCharged = Math.min(nights, 30);
  const dirhamPerNight = 10 * bedrooms;
  const tourismDirham = dirhamPerNight * nightsCharged;
  
  const baseAmount = baseRate * nights;
  const totalAmount = baseAmount + tourismDirham;
  
  return {
    baseAmount,
    tourismDirham,
    totalAmount,
    breakdown: {
      nightsCharged,
      dirhamPerNight,
      capApplied: nights > 30,
    },
  };
}
```

```typescript
// app/actions/booking.ts
'use server'

import { calculateDubaiMath } from '@/lib/dubai-math';
import { createBookingInDb } from '@/lib/database';

export async function createBookingAction(formData: FormData) {
  // Extract form data
  const userId = formData.get('userId') as string;
  const unitId = formData.get('unitId') as string;
  const checkIn = formData.get('checkIn') as string;
  const checkOut = formData.get('checkOut') as string;
  const bedrooms = parseInt(formData.get('bedrooms') as string);
  const baseRate = parseFloat(formData.get('baseRate') as string);
  
  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  // Server-side Dubai Math calculation (NEVER client-side)
  const pricing = calculateDubaiMath({ bedrooms, nights, baseRate });
  
  // Create booking with race condition protection
  const booking = await createBookingInDb({
    userId,
    unitId,
    checkIn,
    checkOut,
    nights,
    bedrooms,
    ...pricing,
  });
  
  return { success: true, booking };
}
```

**Test Suite (Mandatory per SRS):**

```typescript
// tests/dubai-math.test.ts
describe('Dubai Math Engine', () => {
  it('calculates 7-night stay correctly', () => {
    const result = calculateDubaiMath({ bedrooms: 2, nights: 7, baseRate: 500 });
    expect(result.tourismDirham).toBe(140); // 10 × 2 × 7
    expect(result.breakdown.capApplied).toBe(false);
  });
  
  it('calculates 30-night stay correctly (cap boundary)', () => {
    const result = calculateDubaiMath({ bedrooms: 2, nights: 30, baseRate: 500 });
    expect(result.tourismDirham).toBe(600); // 10 × 2 × 30
    expect(result.breakdown.capApplied).toBe(false);
  });
  
  it('applies 30-night cap for 45-night stay', () => {
    const result = calculateDubaiMath({ bedrooms: 2, nights: 45, baseRate: 500 });
    expect(result.tourismDirham).toBe(600); // 10 × 2 × 30 (capped)
    expect(result.breakdown.capApplied).toBe(true);
  });
});
```

---

### B. Booking Race Condition Prevention

**Problem:** Two guests cannot book the same unit simultaneously.

**Solution:** PostgreSQL `SELECT FOR UPDATE` within a database transaction, called from Next.js Server Action.

```typescript
// lib/database.ts
import { createClient } from '@supabase/supabase-js';

export async function createBookingInDb(bookingData: {
  userId: string;
  unitId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  bedrooms: number;
  baseAmount: number;
  tourismDirham: number;
  totalAmount: number;
}) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Call PostgreSQL stored procedure with row-level locking
  const { data: booking, error } = await supabase.rpc('create_booking_transaction', {
    p_user_id: bookingData.userId,
    p_unit_id: bookingData.unitId,
    p_check_in: bookingData.checkIn,
    p_check_out: bookingData.checkOut,
  });
  
  if (error) {
    // Check for race condition error
    if (error.message.includes('row already locked') || 
        error.message.includes('conflict') ||
        error.message.includes('not available')) {
      return {
        success: false,
        error: 'This unit was just booked by another guest. Please select a different unit.',
      };
    }
    return { success: false, error: error.message };
  }
  
  // Update booking with pricing
  await supabase.from('bookings').update({
    nights: bookingData.nights,
    bedrooms: bookingData.bedrooms,
    base_amount: bookingData.baseAmount,
    tourism_dirham: bookingData.tourismDirham,
    total_amount: bookingData.totalAmount,
  }).eq('id', booking.id);
  
  return { success: true, booking };
}
```

```sql
-- supabase/migrations/create_booking_transaction.sql
CREATE OR REPLACE FUNCTION create_booking_transaction(
  p_user_id UUID,
  p_unit_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS JSON AS $$
DECLARE
  v_unit RECORD;
  v_booking JSON;
BEGIN
  -- Lock the unit row to prevent concurrent bookings
  SELECT * INTO v_unit
  FROM units
  WHERE id = p_unit_id
  FOR UPDATE;  -- This is the critical lock
  
  -- Check availability within transaction
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE unit_id = p_unit_id
      AND (
        (check_in <= p_check_in AND check_out > p_check_in) OR
        (check_in < p_check_out AND check_out >= p_check_out) OR
        (check_in >= p_check_in AND check_out <= p_check_out)
      )
      AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Unit not available for selected dates';
  END IF;
  
  -- Create booking within transaction
  INSERT INTO bookings (
    user_id,
    unit_id,
    check_in,
    check_out,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_unit_id,
    p_check_in,
    p_check_out,
    'pending_payment',
    NOW()
  )
  RETURNING row_to_json(bookings.*) INTO v_booking;
  
  RETURN v_booking;
END;
$$ LANGUAGE plpgsql;
```

**Usage in Next.js Server Action:**

```typescript
// app/actions/booking.ts
'use server'

export async function submitBooking(formData: FormData) {
  // ... extract data, calculate Dubai Math ...
  
  // Create booking with race condition protection
  const result = await createBookingInDb({ ... });
  
  if (!result.success) {
    return { error: result.error };
  }
  
  // Redirect to checkout with booking ID
  redirect(`/booking/confirmation/${result.booking.id}`);
}
```

---

### C. Webhook Idempotency

**Problem:** Checkout.com webhooks can be delivered multiple times (network retries, timeouts).

**Solution:** `processed_webhook_events` table with unique constraint, handled in Next.js API Route.

```typescript
// app/api/webhook/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface CheckoutWebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Parse webhook payload
  const event: CheckoutWebhookEvent = await req.json();
  
  // CRITICAL: Check idempotency BEFORE processing
  const { data: existingEvent } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .single();
  
  if (existingEvent) {
    // Duplicate webhook - return success without processing
    console.log(`Duplicate webhook ignored: ${event.id}`);
    return NextResponse.json({ success: true, duplicate: true });
  }
  
  // Log event BEFORE processing (atomic operation)
  const { error: insertError } = await supabase
    .from('processed_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload: event.data,
      processed_at: new Date().toISOString(),
    });
  
  if (insertError) {
    // Unique constraint violation = duplicate, ignore
    if (insertError.code === '23505') {
      return NextResponse.json({ success: true, duplicate: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  
  // NOW process the actual business logic
  try {
    await processWebhookEvent(event, supabase);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function processWebhookEvent(
  event: CheckoutWebhookEvent,
  supabase: ReturnType<typeof createClient>
) {
  switch (event.type) {
    case 'payment_captured':
      await handlePaymentCaptured(event.data, supabase);
      break;
    case 'payment_failed':
      await handlePaymentFailed(event.data, supabase);
      break;
    case 'refund_completed':
      await handleRefundCompleted(event.data, supabase);
      break;
    // ... other event types
  }
}

async function handlePaymentCaptured(
  data: any,
  supabase: ReturnType<typeof createClient>
) {
  const { payment_id, booking_id, amount } = data;
  
  // Update booking status
  await supabase.from('bookings').update({
    status: 'confirmed',
    checkout_payment_id: payment_id,
  }).eq('id', booking_id);
  
  // Trigger notification
  await supabase.rpc('trigger_notification', {
    p_booking_id: booking_id,
    p_event: 'payment_confirmed',
  });
}
```

```sql
-- supabase/migrations/create_webhook_events_table.sql
CREATE TABLE processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,  -- Unique constraint is critical
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast duplicate checks
CREATE INDEX idx_webhook_events_event_id ON processed_webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed_at ON processed_webhook_events(processed_at);

-- Comment explaining purpose
COMMENT ON TABLE processed_webhook_events IS
  'Idempotency table for Checkout.com webhooks - prevents duplicate processing';
```

**Vercel Cron for Scheduled Jobs (Alternative to pg_cron):**

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-payouts",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-in-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

```typescript
// app/api/cron/process-payouts/route.ts
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Process daily payouts
  // ... implementation
  return NextResponse.json({ success: true });
}
```

---

### D. Supabase RLS Policies

**Problem:** Vendor A must never be able to query Vendor B's data.

**Solution:** Row Level Security policies on every table.

```sql
-- supabase/migrations/enable_rls.sql

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROPERTIES TABLE
-- ============================================

-- Vendors can only see their own properties
CREATE POLICY vendor_select_properties
  ON properties
  FOR SELECT
  USING (
    vendor_id = current_setting('app.current_vendor_id')::UUID
  );

CREATE POLICY vendor_insert_properties
  ON properties
  FOR INSERT
  WITH CHECK (
    vendor_id = current_setting('app.current_vendor_id')::UUID
  );

CREATE POLICY vendor_update_properties
  ON properties
  FOR UPDATE
  USING (
    vendor_id = current_setting('app.current_vendor_id')::UUID
  );

-- Admins can see all properties
CREATE POLICY admin_select_properties
  ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- BOOKINGS TABLE
-- ============================================

-- Vendors can see bookings for their properties
CREATE POLICY vendor_select_bookings
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM units
      INNER JOIN properties ON units.property_id = properties.id
      WHERE units.id = bookings.unit_id
      AND properties.vendor_id = current_setting('app.current_vendor_id')::UUID
    )
  );

-- Guests can see their own bookings
CREATE POLICY guest_select_bookings
  ON bookings
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Admins can see all bookings
CREATE POLICY admin_select_bookings
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- DOCUMENTS TABLE (Guest Document Vault)
-- ============================================

-- Only the booking vendor and admin can access guest documents
CREATE POLICY vendor_select_documents
  ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      INNER JOIN units ON bookings.unit_id = units.id
      INNER JOIN properties ON units.property_id = properties.id
      WHERE bookings.id = documents.booking_id
      AND properties.vendor_id = current_setting('app.current_vendor_id')::UUID
    )
  );

-- Guests can only upload their own documents
CREATE POLICY guest_insert_documents
  ON documents
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );
```

**RLS Testing Strategy (Required by SRS):**

```typescript
// tests/rls.test.ts
describe('Supabase RLS Policies', () => {
  let vendorA: SupabaseClient;
  let vendorB: SupabaseClient;
  let guest: SupabaseClient;
  let admin: SupabaseClient;
  
  beforeAll(async () => {
    // Create test accounts
    vendorA = await createTestUser('vendor', 'vendor_a@test.com');
    vendorB = await createTestUser('vendor', 'vendor_b@test.com');
    guest = await createTestUser('guest', 'guest@test.com');
    admin = await createTestUser('admin', 'admin@test.com');
  });
  
  it('Vendor A cannot see Vendor B properties', async () => {
    // Create property for Vendor B
    const { data: vendorBProperty } = await vendorB
      .from('properties')
      .insert({ name: 'Vendor B Property', vendor_id: vendorB.userId })
      .select()
      .single();
    
    // Try to query with Vendor A
    const { data: vendorASees } = await vendorA
      .from('properties')
      .select('*');
    
    // Vendor A should NOT see Vendor B's property
    expect(vendorASees).not.toContainEqual(
      expect.objectContaining({ id: vendorBProperty.id })
    );
  });
  
  it('Guest can only see own bookings', async () => {
    // Test implementation
  });
  
  it('Admin can see all data', async () => {
    // Test implementation
  });
});
```

---

### E. Financial Audit Trail

**Requirement:** `booking_events` table capturing every state change with actor, timestamp, and payload snapshot. INSERT-only—no UPDATE or DELETE.

```sql
-- supabase/migrations/create_booking_events.sql
CREATE TABLE booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  event_type TEXT NOT NULL, -- 'created', 'payment_confirmed', 'checked_in', 'checked_out', 'cancelled', 'refunded'
  actor_type TEXT NOT NULL, -- 'guest', 'vendor', 'admin', 'system'
  actor_id UUID, -- NULL for system events
  payload JSONB NOT NULL, -- Full snapshot of booking state
  ip_address INET, -- For audit trail
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast booking history queries
CREATE INDEX idx_booking_events_booking_id ON booking_events(booking_id);
CREATE INDEX idx_booking_events_created_at ON booking_events(created_at);
CREATE INDEX idx_booking_events_event_type ON booking_events(event_type);

-- Comment
COMMENT ON TABLE booking_events IS 
  'INSERT-only audit trail for booking state changes - UAE regulatory compliance';

-- Function to automatically log booking state changes
CREATE OR REPLACE FUNCTION log_booking_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO booking_events (
    booking_id,
    event_type,
    actor_type,
    actor_id,
    payload,
    ip_address,
    user_agent
  ) VALUES (
    NEW.id,
    TG_OP, -- INSERT, UPDATE, DELETE
    current_setting('app.actor_type', true),
    current_setting('app.actor_id', true)::UUID,
    row_to_json(NEW),
    current_setting('app.ip_address', true)::INET,
    current_setting('app.user_agent', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on bookings table
CREATE TRIGGER booking_events_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_event();
```

---

### F. Guest Document Vault

**Requirement:** Supabase private storage bucket with signed URL access (1-hour expiry). Document numbers stored as SHA-256 hash only.

**Implementation:** Next.js Server Action with crypto API for SHA-256 hashing.

```typescript
// app/actions/documents.ts
'use server'

import { createClient } from '@supabase/supabase-js';

export async function uploadGuestDocument(
  userId: string,
  bookingId: string,
  file: File,
  documentType: string
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  
  // Generate SHA-256 hash of document number (from filename or metadata)
  const documentNumber = extractDocumentNumber(file.name);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(documentNumber));
  const documentHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Upload to private bucket
  const fileName = `${bookingId}/${documentType}/${crypto.randomUUID()}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('guest-documents')
    .upload(fileName, fileBytes, {
      contentType: file.type,
      upsert: false,
    });
  
  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }
  
  // Store metadata with hash (NOT raw document number)
  const { data: documentRecord, error: dbError } = await supabase
    .from('documents')
    .insert({
      booking_id: bookingId,
      user_id: userId,
      document_type: documentType,
      document_hash: documentHash, // SHA-256 hash only
      storage_path: uploadData.path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();
  
  if (dbError) {
    // Rollback: delete uploaded file
    await supabase.storage.from('guest-documents').remove([uploadData.path]);
    throw new Error(`Database insert failed: ${dbError.message}`);
  }
  
  return documentRecord;
}

// Generate signed URL for temporary access (1-hour expiry)
export async function getDocumentSignedUrl(storagePath: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data, error } = await supabase.storage
    .from('guest-documents')
    .createSignedUrl(storagePath, 3600); // 1 hour = 3600 seconds
  
  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
  
  return data.signedUrl;
}

function extractDocumentNumber(fileName: string): string {
  // Extract document number from filename (e.g., "passport_ABC123456.pdf")
  const match = fileName.match(/_(.*?)\./);
  return match ? match[1] : fileName;
}
```

```sql
-- supabase/migrations/create_documents_table.sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  document_type TEXT NOT NULL, -- 'passport', 'visa', 'emirates_id'
  document_hash TEXT NOT NULL, -- SHA-256 hash of document number
  storage_path TEXT NOT NULL, -- Supabase storage path
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_documents_booking_id ON documents(booking_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_hash ON documents(document_hash);

-- RLS policies (see section D above)
```

---

### G. WhatsApp Notification System

**Requirement:** All 9 notification templates submitted for Meta approval in Week 1. WhatsApp delivery confirmation via webhook. SMS fallback on failed WhatsApp delivery.

**Implementation:** Next.js Server Action with WhatsApp Business API + Twilio SMS fallback.

```typescript
// lib/notifications.ts
interface NotificationTemplate {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  variables: string[];
}

const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  booking_confirmation: {
    name: 'booking_confirmation',
    category: 'UTILITY',
    variables: ['guest_name', 'property_name', 'check_in_date', 'booking_id'],
  },
  payment_received: {
    name: 'payment_received',
    category: 'UTILITY',
    variables: ['guest_name', 'amount', 'currency', 'booking_id'],
  },
  check_in_reminder: {
    name: 'check_in_reminder',
    category: 'UTILITY',
    variables: ['guest_name', 'property_name', 'check_in_time'],
  },
  check_out_reminder: {
    name: 'check_out_reminder',
    category: 'UTILITY',
    variables: ['guest_name', 'property_name', 'check_out_time'],
  },
  document_upload_request: {
    name: 'document_upload_request',
    category: 'UTILITY',
    variables: ['guest_name', 'document_type'],
  },
  document_verified: {
    name: 'document_verified',
    category: 'UTILITY',
    variables: ['guest_name', 'document_type'],
  },
  booking_cancelled: {
    name: 'booking_cancelled',
    category: 'UTILITY',
    variables: ['guest_name', 'booking_id', 'refund_amount'],
  },
  refund_processed: {
    name: 'refund_processed',
    category: 'UTILITY',
    variables: ['guest_name', 'amount', 'booking_id'],
  },
  otp_verification: {
    name: 'otp_verification',
    category: 'AUTHENTICATION',
    variables: ['otp_code'],
  },
};
```

```typescript
// app/actions/notifications.ts
'use server'

import { createClient } from '@supabase/supabase-js';

export async function sendNotification(
  userId: string,
  templateName: string,
  variables: Record<string, string>
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Get user's notification preferences
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('whatsapp_number, phone_number, notification_preference')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    throw new Error('User not found');
  }
  
  // Try WhatsApp first (primary channel)
  if (user.notification_preference !== 'sms_only') {
    try {
      const whatsappResult = await sendWhatsApp(
        user.whatsapp_number,
        templateName,
        variables
      );
      
      // Log successful delivery
      await supabase.from('notification_logs').insert({
        user_id: userId,
        channel: 'whatsapp',
        template_name: templateName,
        status: 'delivered',
        message_id: whatsappResult.message_id,
      });
      
      return { success: true, channel: 'whatsapp' };
    } catch (error) {
      // Log WhatsApp failure
      await supabase.from('notification_logs').insert({
        user_id: userId,
        channel: 'whatsapp',
        template_name: templateName,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fall back to SMS
      console.log(`WhatsApp failed for user ${userId}, falling back to SMS`);
    }
  }
  
  // SMS fallback
  try {
    const smsResult = await sendSMS(
      user.phone_number,
      buildSMSMessage(templateName, variables)
    );
    
    await supabase.from('notification_logs').insert({
      user_id: userId,
      channel: 'sms',
      template_name: templateName,
      status: 'delivered',
      message_id: smsResult.message_id,
    });
    
    return { success: true, channel: 'sms' };
  } catch (error) {
    await supabase.from('notification_logs').insert({
      user_id: userId,
      channel: 'sms',
      template_name: templateName,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}

async function sendWhatsApp(
  phoneNumber: string,
  templateName: string,
  variables: Record<string, string>
) {
  const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: Object.entries(variables).map(([key, value]) => ({
              type: 'text',
              text: value,
            })),
          },
        ],
      },
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
  }
  
  return response.json();
}

async function sendSMS(phoneNumber: string, message: string) {
  const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      Body: message,
      From: process.env.TWILIO_PHONE_NUMBER!,
      To: phoneNumber,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Twilio API error: ${response.statusText}`);
  }
  
  return response.json();
}

function buildSMSMessage(templateName: string, variables: Record<string, string>): string {
  // Simple SMS fallback (no templates needed)
  switch (templateName) {
    case 'booking_confirmation':
      return `Hi ${variables.guest_name}! Your booking at ${variables.property_name} is confirmed. Check-in: ${variables.check_in_date}. Booking ID: ${variables.booking_id}`;
    case 'payment_received':
      return `Payment received: ${variables.currency}${variables.amount}. Booking ID: ${variables.booking_id}`;
    case 'check_in_reminder':
      return `Hi ${variables.guest_name}! Reminder: Check-in at ${variables.property_name} is tomorrow at ${variables.check_in_time}.`;
    // ... other templates
    default:
      return `Notification from Luxury Rental Dubai`;
  }
}
```

**Trigger Notifications from Server Actions:**

```typescript
// app/actions/booking.ts
'use server'

import { sendNotification } from './notifications';

export async function confirmBooking(bookingId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id, property_name, check_in')
    .eq('id', bookingId)
    .single();
  
  // Send booking confirmation notification
  await sendNotification(booking.user_id, 'booking_confirmation', {
    guest_name: booking.guest_name,
    property_name: booking.property_name,
    check_in_date: booking.check_in,
    booking_id: bookingId,
  });
}
```

**9 WhatsApp Templates for Meta Approval (Week 1):**

| # | Template Name | Category | Trigger |
|---|---------------|----------|---------|
| 1 | `booking_confirmation` | UTILITY | After payment captured |
| 2 | `payment_received` | UTILITY | Payment webhook success |
| 3 | `check_in_reminder` | UTILITY | 24 hours before check-in |
| 4 | `check_out_reminder` | UTILITY | 24 hours before check-out |
| 5 | `document_upload_request` | UTILITY | After booking, if docs missing |
| 6 | `document_verified` | UTILITY | After vendor verifies docs |
| 7 | `booking_cancelled` | UTILITY | Guest/vendor cancels |
| 8 | `refund_processed` | UTILITY | Refund completed |
| 9 | `otp_verification` | AUTHENTICATION | Login/booking verification |

---

### H. Property Image Hosting

**Requirement:** Property marketplace needs efficient image storage + delivery for property photos, unit images, and amenities. Job post mentions "Listing detail page (photos)" but doesn't specify hosting solution.

**Recommended Solution: Backblaze B2 + Cloudflare CDN (Most Cost-Effective)**

| Provider | Storage Cost | Egress Fee | CDN | Best For |
|----------|-------------|------------|-----|----------|
| **Backblaze B2** | $0.006/GB/month | $0.01/GB (free via Cloudflare) | Cloudflare integration | **Budget-conscious MVP** |
| **Wasabi** | $0.0069/GB/month | $0 (no egress fees) | Bring your own CDN | Predictable costs |
| **Supabase Storage** | $0.021/GB | Included | No built-in CDN | Simple MVP, small scale |
| **AWS S3** | $0.023/GB | $0.09/GB | CloudFront extra | Enterprise scale |
| **Cloudinary** | $50/month base | Included | Included | Auto-optimization needed |

**Cost Estimate for MVP (500 properties × 10 images × 500KB avg = ~2.5GB storage):**
- Backblaze B2: ~$0.015/month + egress (cheapest)
- Wasabi: ~$0.017/month (no egress fees)
- Supabase Storage: ~$0.05/month
- Cloudinary: $50/month (overkill for MVP)

**Implementation:**

```typescript
// lib/image-upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Backblaze B2 uses S3-compatible API
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.BACKBLAZE_ENDPOINT, // https://s3.us-west-004.backblazeb2.com
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY!,
  },
});

export async function uploadPropertyImage(
  file: File,
  propertyId: string,
  imageType: 'cover' | 'gallery' | 'unit' | 'amenity'
) {
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const filename = `${propertyId}/${imageType}/${crypto.randomUUID()}.${fileExt}`;
  
  // Read file as buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Upload to Backblaze B2
  const command = new PutObjectCommand({
    Bucket: process.env.BACKBLAZE_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
  });
  
  await s3Client.send(command);
  
  // Return CDN URL (Cloudflare or Backblaze CDN)
  const imageUrl = `https://cdn.yourdomain.com/${filename}`;
  
  return imageUrl;
}
```

**Database Schema:**

```sql
-- supabase/migrations/create_property_images_table.sql
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE, -- NULL for property-level images
  image_type TEXT NOT NULL, -- 'cover', 'gallery', 'unit', 'amenity'
  image_url TEXT NOT NULL, -- Backblaze B2 CDN URL
  image_order INTEGER DEFAULT 0, -- For sorting
  alt_text TEXT, -- SEO + accessibility
  is_primary BOOLEAN DEFAULT FALSE, -- Primary cover image
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_unit_id ON property_images(unit_id);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;

-- RLS policies
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Vendors can only manage their own property images
CREATE POLICY vendor_manage_own_property_images
  ON property_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.vendor_id = current_setting('app.current_vendor_id')::UUID
    )
  );

-- Anyone can view property images (public listings)
CREATE POLICY public_view_property_images
  ON property_images
  FOR SELECT
  TO authenticated
  USING (true);
```

**Server Action for Upload:**

```typescript
// app/actions/images.ts
'use server'

import { uploadPropertyImage } from '@/lib/image-upload';
import { createClient } from '@supabase/supabase-js';

export async function uploadPropertyImages(
  propertyId: string,
  images: Array<{ file: File; type: 'cover' | 'gallery' | 'unit'; unitId?: string }>
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const uploadedImages = [];
  
  for (const image of images) {
    // Upload to Backblaze B2
    const imageUrl = await uploadPropertyImage(image.file, propertyId, image.type);
    
    // Store metadata in database
    const { data, error } = await supabase
      .from('property_images')
      .insert({
        property_id: propertyId,
        unit_id: image.unitId || null,
        image_type: image.type,
        image_url: imageUrl,
        is_primary: image.type === 'cover' && uploadedImages.length === 0,
        image_order: uploadedImages.length,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save image metadata: ${error.message}`);
    }
    
    uploadedImages.push(data);
  }
  
  return uploadedImages;
}
```

**Image Gallery Component (with lazy loading):**

```tsx
// components/property/PropertyGallery.tsx
export function PropertyGallery({ images }: { images: PropertyImage[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((img) => (
        <img
          key={img.id}
          src={img.image_url}
          alt={img.alt_text || 'Property image'}
          loading="lazy"
          className="w-full h-48 object-cover rounded-lg"
        />
      ))}
    </div>
  );
}
```

**Phase 2 Upgrades (Optional):**

For advanced image optimization, consider Cloudflare Images or Imgix:
- Automatic thumbnails
- Responsive images (srcset)
- WebP/AVIF conversion
- Image transformations (crop, resize, watermark)

**Cost Comparison at Scale (10,000 properties × 10 images × 500KB = 50GB):**

| Provider | Monthly Cost | Notes |
|----------|-------------|-------|
| Backblaze B2 + Cloudflare | ~$0.30 + egress | **Cheapest option** |
| Wasabi | ~$0.35 | No egress fees |
| Supabase Storage | ~$1.05 | Simple but pricey at scale |
| Cloudinary | $50+ | Overkill for MVP |

**Recommendation:** Start with **Backblaze B2** for MVP (most cost-effective, S3-compatible API). Upgrade to Cloudinary/Imgix in Phase 2 if image optimization becomes critical for UX/SEO.

**Question for Zoom Discussion:**
> "For property images, I recommend Backblaze B2 + Cloudflare CDN (~$0.30/month for 50GB) as the most cost-effective solution. Is this acceptable, or do you have a preference (Supabase Storage, Wasabi, AWS S3)?"

---

## Database Schema Preview

```sql
-- Core tables (simplified for brevity)

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest', -- 'guest', 'vendor', 'admin'
  whatsapp_number TEXT,
  phone_number TEXT,
  notification_preference TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'sms_only'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  vendor_type TEXT NOT NULL, -- 'homeowner', 'pmc', 'hotel_apartments'
  company_name TEXT,
  trade_license_number TEXT,
  det_permit_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL, -- 'apartment', 'villa', 'penthouse'
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  area_sqft INTEGER,
  area_number TEXT, -- Dubai area (Downtown, Marina, etc.)
  building_name TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units table (individual bookable units within a property)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_number TEXT NOT NULL,
  unit_type TEXT NOT NULL, -- 'studio', '1br', '2br', etc.
  base_rate_nightly DECIMAL(10,2) NOT NULL,
  base_rate_monthly DECIMAL(10,2),
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(property_id, unit_number)
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  tourism_dirham DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'pending_payment', -- 'pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'refunded'
  checkout_payment_id TEXT, -- Checkout.com payment ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking events (audit trail - INSERT only)
CREATE TABLE booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID,
  payload JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (guest document vault)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  document_type TEXT NOT NULL,
  document_hash TEXT NOT NULL, -- SHA-256 hash
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processed webhook events (idempotency)
CREATE TABLE processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel TEXT NOT NULL, -- 'whatsapp', 'sms'
  template_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'delivered', 'failed'
  message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts (vendor payments, Phase 2)
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  booking_id UUID REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
  payout_date DATE,
  checkout_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Week-by-Week MVP Implementation Plan

### Week 1: Foundation (20% - $1,600-1,800)
**Deliverables:**
- [ ] Supabase project setup with all tables
- [ ] RLS policies enabled and tested (dual vendor test)
- [ ] Authentication (Email/Password, Google OAuth, Phone SMS, WhatsApp OTP)
- [ ] Checkout.com account setup & API keys configured
- [ ] WhatsApp Business API account & 9 templates submitted for Meta approval
- [ ] Development environment with CI/CD pipeline

**Milestone Payment:** 20%

---

### Week 2: Vendor Onboarding (15% - $1,200-1,350)
**Deliverables:**
- [ ] Vendor registration flow (3 types: homeowner, PMC, hotel apartments)
- [ ] Property CRUD (create, read, update, delete)
- [ ] Unit CRUD (multiple units per property)
- [ ] DET permit upload & validation
- [ ] 3 property types implemented (apartment, villa, penthouse)
- [ ] Property image upload (Backblaze B2 + Cloudflare CDN)
- [ ] Vendor dashboard skeleton

**Milestone Payment:** 15%

---

### Week 3: Search & Discovery (15% - $1,200-1,350)
**Deliverables:**
- [ ] Guest search functionality (date picker, guests, location)
- [ ] Filters modal (price range, bedrooms, property type, amenities)
- [ ] Map toggle (Google Maps integration)
- [ ] Listing detail page (photos, description, amenities, reviews placeholder)
- [ ] Mobile-responsive design (all pages)

**Milestone Payment:** 15%

---

### Week 4: Booking & Payments (25% - $2,000-2,250)
**Deliverables:**
- [ ] Complete booking flow (search → listing → checkout → confirmation)
- [ ] Dubai Math Engine implementation (Next.js Server Action - server-side only)
- [ ] Dubai Math test suite (7-night, 30-night, 45-night tests)
- [ ] Checkout.com payment integration (cards, BNPL Tabby)
- [ ] Webhook handler with idempotency (Next.js API Route: `/api/webhook/checkout`)
- [ ] All 9 WhatsApp notification templates implemented (Server Actions)
- [ ] SMS fallback for failed WhatsApp delivery
- [ ] Vercel Cron setup for scheduled jobs (payouts, reminders)

**Milestone Payment:** 25%

---

### Week 5: Dashboards & CMS (15% - $1,200-1,350)
**Deliverables:**
- [ ] Admin panel (user management, vendor verification, booking oversight)
- [ ] Vendor dashboard (bookings, payouts, property analytics)
- [ ] Guest dashboard (booking history, upcoming trips, documents)
- [ ] Sanity.io CMS setup (content editing for marketing pages)
- [ ] Guest document vault (upload, verification workflow)

**Milestone Payment:** 15%

---

### Week 6: QA & Launch (10% - $800-900)
**Deliverables:**
- [ ] Full QA audit (all features tested end-to-end)
- [ ] Dubai Math test suite (all 3 test cases passing)
- [ ] RLS penetration testing (dual vendor accounts, guest isolation)
- [ ] Security audit (SQL injection, XSS, CSRF checks)
- [ ] Performance optimization (lazy loading, image optimization, caching)
- [ ] Documentation (API docs, database schema, deployment guide)
- [ ] Soft launch preparation

**Milestone Payment:** 10%

---

## Testing Strategy

### Dubai Math Test Suite (Mandatory)
```typescript
// tests/dubai-math.test.ts
describe('Dubai Math Engine', () => {
  // 3 required test cases per SRS
  it('7-night stay: AED 10 × 2 bedrooms × 7 nights = AED 140');
  it('30-night stay: AED 10 × 2 bedrooms × 30 nights = AED 600');
  it('45-night stay: Cap applied, AED 10 × 2 × 30 = AED 600');
});
```

### RLS Testing (Mandatory)
```typescript
// tests/rls.test.ts
describe('Supabase RLS Policies', () => {
  it('Vendor A cannot query Vendor B properties');
  it('Vendor A cannot see Vendor B bookings');
  it('Guest can only see own bookings');
  it('Guest documents only accessible to booking vendor + admin');
  it('Admin can see all data');
});
```

### Booking Race Condition Testing
```typescript
// tests/race-condition.test.ts
describe('Booking Race Conditions', () => {
  it('Prevents double-booking same unit for overlapping dates');
  it('Returns clear error message to second guest');
  it('Rolls back transaction on conflict');
});
```

### Webhook Idempotency Testing
```typescript
// tests/webhook-idempotency.test.ts
describe('Webhook Idempotency', () => {
  it('Processes first webhook delivery');
  it('Ignores duplicate webhook with same event_id');
  it('Returns success status for duplicates (no errors)');
});
```

### Penetration Test Prep (Week 6)
- SQL injection testing (all user inputs)
- XSS testing (all output rendering)
- CSRF token validation
- Rate limiting verification
- RLS policy bypass attempts

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **WhatsApp template approval delay** | High | Submit all 9 templates Week 1; SMS fallback ready |
| **Checkout.com account setup delay** | High | Founder confirms account setup before Week 1 start |
| **DET permit validation complexity** | Medium | Use provided SRS requirements; clarify in Week 2 |
| **Concurrent booking edge cases** | High | `SELECT FOR UPDATE` + comprehensive race condition tests |
| **RLS policy gaps** | Critical | Dual-vendor testing mandatory before each milestone |
| **Webhook duplicate processing** | Critical | Idempotency table with unique constraint; tested |
| **Timezone misalignment** | Medium | 4+ hours UTC+4 overlap confirmed (GMT+8, available 10AM-6PM GST) |

---

## Questions About SRS

After reviewing the SRS v2.0, I have the following clarifying questions:

1. **DET Permit Validation:** Should the system automatically validate DET permit numbers against a government API, or is manual upload + admin verification sufficient for MVP?

2. **Multi-Currency Support:** SRS mentions AED as primary currency. Should we support USD/GBP/EUR display for international guests (with AED as checkout currency), or is AED-only preferred for MVP?

3. **Vendor Payout Schedule:** Section mentions T+1 payout logic. Is this T+1 from check-in date or check-out date? And is there a minimum payout threshold before transfer is triggered?

4. **Channel Manager Integration:** SRS mentions Phase 2 channel manager. Should we reserve database schema fields for iCal sync / external calendar integrations now, or add in Phase 2?

5. **Arabic Language:** Phase 2 mentions Arabic language support. Should we design database schema with i18n in mind (e.g., `title_ar`, `description_ar` columns) from Week 1, or add later?

---

## Next Steps

I'm ready to start immediately and can commit to the 6-week MVP timeline with the following:

- **Daily async updates** via WhatsApp (within 4 hours during UAE business hours)
- **Weekly 30-min video call** (scheduled at your convenience)
- **GitHub private repo** with full access at all times
- **All code in TypeScript** with JSDoc comments on Edge Functions
- **Comprehensive test suite** for all critical functions
- **Complete documentation** for future team scaling

**Available for a technical screening call** to discuss RLS approach live and walk through the booking race condition fix in a clean Supabase project.

— **Maulana Shalihin**
Senior Full-Stack Developer
GMT+8 (4+ hours overlap with UTC+4)
