# Setup Guide for Hire-Me Page

## Overview
This guide will help you set up the hire-me page with Stripe payment integration using Supabase.

## Prerequisites
- Supabase account and project
- Stripe account with API keys
- Your Supabase Edge Function already deployed at: `https://pbeqnkvmavntirrddwgc.supabase.co/functions/v1/stripe-payments`

## Step 1: Create Supabase Table

1. Go to your Supabase Dashboard: https://pbeqnkvmavntirrddwgc.supabase.co
2. Navigate to **SQL Editor**
3. Run the SQL from `supabase/001_create_hire_requests_table.sql`

Or copy and run this SQL:

```sql
CREATE TABLE IF NOT EXISTS hire_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  project_description TEXT NOT NULL,
  requirements TEXT,
  amount INTEGER DEFAULT 100000,
  currency TEXT DEFAULT 'usd',
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hire_requests ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Allow public insert" ON hire_requests
  FOR INSERT WITH CHECK (true);

-- Allow viewing (you can restrict this later)
CREATE POLICY "Allow public select" ON hire_requests
  FOR SELECT USING (true);
```

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Stripe keys from https://dashboard.stripe.com/apikeys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

3. Get your Stripe Webhook Secret:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint" or use existing endpoint
   - Copy the **Signing Secret** (starts with `whsec_`)

4. Update `.env` with your keys:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   STRIPE_WEBHOOK_SIGNING_SECRET=whsec_YOUR_SECRET_HERE
   ```

## Step 3: Update Edge Function Secrets

In your Supabase Dashboard:

1. Go to **Edge Functions** → **stripe-payments** → **Secrets**
2. Add these secrets:
   - `STRIPE_API_KEY` = `sk_test_YOUR_SECRET_KEY`
   - `STRIPE_WEBHOOK_SIGNING_SECRET` = `whsec_YOUR_WEBHOOK_SECRET`

## Step 4: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Set **Endpoint URL** to:
   ```
   https://pbeqnkvmavntirrddwgc.supabase.co/functions/v1/stripe-payments/stripe-webhook
   ```
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing Secret** and add it to your Edge Function secrets (Step 3)

## Step 5: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:4321/hire-me`

3. Fill out the form and submit

4. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242` (any future date, any CVC)
   - **Requires Authentication**: `4000 0025 0000 3155`

## Step 6: Update Webhook Handler (Optional)

Your current webhook handler logs events but doesn't update the database. To update the `hire_requests` table when payment succeeds, update your Edge Function webhook handler:

```typescript
if (path.endsWith('/stripe-webhook')) {
  // ... existing webhook code ...
  
  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const hireRequestId = paymentIntent.metadata?.hireRequestId;
    
    if (hireRequestId) {
      // Update Supabase via REST API or admin client
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/hire_requests`, {
        method: 'PATCH',
        headers: {
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: 'succeeded',
          stripe_event_id: event.id,
        }),
      });
    }
  }
  
  // Handle payment failure
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const hireRequestId = paymentIntent.metadata?.hireRequestId;
    
    if (hireRequestId) {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/hire_requests`, {
        method: 'PATCH',
        headers: {
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: 'failed',
          stripe_event_id: event.id,
        }),
      });
    }
  }
  
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Troubleshooting

### "Failed to load Stripe"
- Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly in `.env`
- Restart the dev server after changing `.env`

### "Failed to save request"
- Check that the `hire_requests` table exists in Supabase
- Verify RLS policies allow public inserts

### Payment Intent creation fails
- Verify Edge Function secrets are set correctly
- Check that `STRIPE_API_KEY` is valid

### Webhook not updating database
- Ensure webhook URL is correctly configured in Stripe Dashboard
- Add `SUPABASE_SERVICE_ROLE_KEY` to Edge Function secrets
- Check webhook logs in Stripe Dashboard

## Next Steps

1. **Add Email Notifications**: Send confirmation emails after successful payment
2. **Add Admin Dashboard**: Create a page to view all hire requests
3. **Add Authentication**: Require users to sign in before submitting
4. **Add More Payment Options**: Support different pricing tiers

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs: https://pbeqnkvmavntirrddwgc.supabase.co/project/logs
3. Check Stripe logs: https://dashboard.stripe.com/test/logs
