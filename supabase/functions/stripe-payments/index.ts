import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const stripe = new Stripe(
  Deno.env.get('STRIPE_API_KEY') as string,
  // Use the latest stable API version or omit to use the account default
  { apiVersion: '2023-10-16' },
)
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const url = new URL(request.url)
  const path = url.pathname

  if (path.endsWith('/create-payment-intent')) {
    try {
      const { currency = 'usd', customerId, metadata } = (await request.json()) as {
        currency?: string
        customerId?: string
        metadata?: any
      }

      // VALIDASI KEAMANAN: Paksa harga ke $1000 agar tidak bisa dimanipulasi
      const FIXED_AMOUNT = 100000;

      const params: any = {
        amount: FIXED_AMOUNT,
        currency,
        automatic_payment_methods: { enabled: true },
      }

      if (customerId) params.customer = customerId
      if (metadata) params.metadata = metadata

      const intent = await stripe.paymentIntents.create(params)

      return new Response(
        JSON.stringify({
          id: intent.id,
          client_secret: intent.client_secret,
          status: intent.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  if (path.endsWith('/stripe-webhook')) {
    const signature = request.headers.get('Stripe-Signature')
    if (!signature) return new Response('Missing Stripe-Signature header', { status: 400 })

    const body = await request.text()
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') as string,
        undefined,
        cryptoProvider,
      )
    } catch (err) {
      return new Response((err as Error).message, { status: 400 })
    }

    console.log(`🔔 Stripe event: ${event.type} (${event.id})`)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response('Not Found', { status: 404 })
})
