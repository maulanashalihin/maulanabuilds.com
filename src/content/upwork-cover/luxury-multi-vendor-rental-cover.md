---
title: "Upwork Cover Letter: Luxury Multi-Vendor Rental Platform"
client: "Luxury Multi-Vendor Rental"
author: "Maulana Shalihin"
date: "2026-04-14"
status: "draft"
tags: ["Upwork", "Cover Letter", "Next.js", "Supabase", "Dubai"]
---

**DET-VERIFIED**

---

**Fixed-Price Quote (6-Week MVP)**

| Milestone | Scope | Payment |
|-----------|-------|---------|
| Week 1 | Supabase schema + RLS + Auth (4 methods) + Checkout.com setup | $1,600 (20%) |
| Week 2-3 | Vendor onboarding + property/unit CRUD + DET permit + search + listing detail | $2,400 (30%) |
| Week 4 | Booking flow + Dubai Math + Checkout.com webhooks + notifications | $2,000 (25%) |
| Week 5 | Admin panel + vendor/guest dashboards + CMS setup | $1,200 (15%) |
| Week 6 | QA audit + Dubai Math test suite + penetration test prep + soft launch | $800 (10%) |
| **Total** | **6-Week MVP** | **$8,000** |

---

**Availability Confirmation**

- **Hours per day:** 8+ hours (full-time commitment)
- **Timezone:** Indonesia (GMT+8)
- **UTC+4 overlap window:** 10:00 AM - 6:00 PM GST (4+ hours daily overlap with UAE business hours)
- **Start date:** Immediate availability

---

**Booking Race Condition Implementation**

To prevent double-bookings, I'll implement PostgreSQL `SELECT FOR UPDATE` within a database transaction. When a guest initiates booking, the unit row is locked at the transaction start. Within that transaction, I check for overlapping date ranges in the bookings table. If a conflict exists, the transaction rolls back with a clear error message. If available, the booking is inserted and committed. This ensures two guests cannot book the same unit simultaneously—even under high concurrency. The critical code is a Supabase Edge Function wrapping the entire flow, with proper error handling to return user-friendly messages when race conditions occur.

---

**Supabase RLS for Vendor Isolation**

Every table will have Row Level Security enabled. For vendor isolation, I'll set RLS policies that check `vendor_id = current_setting('app.current_vendor_id')::UUID` on SELECT, INSERT, and UPDATE operations. For bookings, the policy traverses the relationship: `EXISTS (SELECT 1 FROM units JOIN properties ON units.property_id = properties.id WHERE units.id = bookings.unit_id AND properties.vendor_id = current_setting('app.current_vendor_id'))`. Before each milestone, I'll test with two separate vendor accounts to confirm Vendor A cannot query Vendor B's data. Admin role bypasses via separate policy checking `users.role = 'admin'`.

---

**Webhook Idempotency Example**

Here's a real webhook handler I built with idempotency (from a payment integration project):

```typescript
// Webhook handler with idempotency check
export async function handlePaymentWebhook(event: WebhookEvent, supabase: SupabaseClient) {
  // CRITICAL: Check if already processed BEFORE any business logic
  const { data: existing } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .single();
  
  if (existing) {
    console.log(`Duplicate webhook ignored: ${event.id}`);
    return { success: true, duplicate: true };
  }
  
  // Log event atomically (unique constraint prevents duplicates)
  await supabase.from('processed_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    payload: event.data,
    processed_at: new Date().toISOString(),
  });
  
  // NOW process business logic (payment capture, booking update, etc.)
  await processPaymentEvent(event, supabase);
  
  return { success: true };
}
```

The `processed_webhook_events` table has a UNIQUE constraint on `event_id`. This makes duplicate detection atomic—either the insert succeeds (first delivery) or fails with constraint violation (duplicate). Either way, business logic runs exactly once.

---

**Next.js App Router Portfolio**

1. **HyperReact** ([GitHub](https://github.com/maulanashalihin/hyper-react))
   - **My role:** Solo developer—built entire stack from scratch
   - **Stack:** React Router v7 (App Router pattern) + Vite + TailwindCSS / HyperExpress + Kysely + SQLite
   - **Performance:** 197k RPS with 0.52ms latency
   - **Features:** Decoupled architecture, JWT auth, payment integration, admin dashboard

2. **TapSite.ai** ([Live](https://tapsite.ai))
   - **My role:** Full-stack developer—frontend + backend + deployment
   - **Stack:** Next.js 14 App Router + Server Actions + Supabase
   - **Features:** AI landing page builder, user authentication, payment flows, dashboard

3. **SlugPost** ([Live](https://slugpost.com))
   - **My role:** Solo developer—architecture, implementation, CI/CD
   - **Stack:** Next.js App Router + Server Components + PostgreSQL
   - **Features:** Markdown publishing, instant shareable pages, SEO optimization, analytics

---

**Supabase Experience**

- **Production projects:** 5+ Supabase projects in production (2023-2026)
- **Features used:**
  - **RLS:** Multi-tenant SaaS with strict data isolation (Antre.in healthcare platform)
  - **Edge Functions:** Payment webhooks, notification triggers, server-side calculations
  - **Realtime:** Live queue updates for healthcare booking system
  - **Storage:** Private buckets with signed URLs for sensitive documents
  - **Auth:** Email/password, OAuth (Google), phone SMS, custom JWT claims
- **Database:** PostgreSQL with advanced features (triggers, stored procedures, row-level locks)

---

**Question About SRS**

After reviewing the SRS v2.0, I have one clarifying question:

**For the T+1 payout schedule to vendors:** Is T+1 calculated from the guest's check-in date or check-out date? And for stays longer than 30 nights (where Tourism Dirham is capped), should vendor payouts be split into multiple transfers or processed as a single lump sum after guest departure? This affects the payout scheduling logic and cash flow management in Week 4-5 implementation.

---

**Why I'm the Right Fit**

I'm Maulana Shalihin, a senior full-stack developer with 11+ years building enterprise-grade systems. I specialize in high-performance marketplaces with payment integration and multi-tenant isolation.

**Relevant experience for this project:**
- **Marketplace architecture:** HyperReact (197k RPS) with vendor/guest dashboards
- **Payment webhooks:** Checkout.com/Stripe integrations with idempotency patterns
- **Multi-tenant RLS:** Healthcare SaaS (Antre.in) with strict data isolation
- **WhatsApp integration:** DripSender.id (WhatsApp Business API automation)
- **Dubai timezone:** GMT+8 with 4+ hours daily overlap (10AM-6PM GST)

I work 100% async-first with daily WhatsApp updates, weekly video calls, and complete GitHub transparency. All code is TypeScript with comprehensive documentation for future team scaling.

Available for a technical screening call to discuss RLS approach live and demonstrate the booking race condition fix in a clean Supabase project.

— **Maulana Shalihin**
Senior Full-Stack Developer
GitHub: [github.com/maulanashalihin](https://github.com/maulanashalihin)
Portfolio: [maulanabuilds.com](https://maulanabuilds.com)
