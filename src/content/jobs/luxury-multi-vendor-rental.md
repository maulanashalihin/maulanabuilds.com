Senior Full-Stack Developer — Next.js 15 + Supabase + Checkout.com Rental Platform
Posted 6 hours ago
Worldwide

Summary
We are building  a luxury multi-vendor short-term rental marketplace built exclusively for Dubai's weekly and monthly furnished accommodation market. 

Think Airbnb, but engineered from the ground up for Dubai's DET (Department of Economy & Tourism) compliance requirements, UAE payment infrastructure, and the specific needs of three 

vendor types: Independent Homeowners, Property Management Companies (PMCs), and Hotel Apartment operators.

We have completed an exhaustive 200+ decision discovery process with a full System Requirements Specification (SRS v2.0), a CTO Audit Report, and an investor-grade technical architecture brief. 

We are NOT looking for someone to figure out what to build. We are looking for someone to build it to a precise, fully-documented specification.

REQUIRED: You must be willing to read the full SRS (attached) before quoting. Proposals without evidence of SRS review will not be considered.

1.1 What Makes This Project Different
•	Full SRS v2.0 already written — 14 sections, 200+ decisions locked. No discovery phase needed.
•	CTO Audit Report identifies exactly which components are critical vs deferred.
•	UI wireframes already designed — homepage, search results, listing detail, mobile all prototyped.

•	Tech stack already decided — Next.js 15, Tailwind, Supabase, Checkout.com, Sanity CMS.

•	Dubai Math Engine already coded — Tourism Dirham formula with 30-night cap. You implement, not design.

•	You focus on execution, not architecture. The architecture is done.

 
2. Tech Stack — Fixed, Non-Negotiable
NOTE: Do not propose alternative stacks. These have been selected after extensive technical review. Proposals suggesting Firebase, WordPress, or other stacks will be rejected.

Layer	Technology	Your Role
Frontend	Next.js 15 (App Router)	Build all pages, components, and layouts
Styling	Tailwind CSS	Implement design system per wireframes
Database & Auth	Supabase (PostgreSQL + Auth + Storage)	Schema, RLS policies, Edge Functions
Payment Gateway	Checkout.com (single merchant)	Webhooks, idempotency, refund logic
BNPL	Tabby via Checkout.com	Checkout integration
CMS	Sanity.io	Schema setup, admin content editing
Email	Resend.com	Transactional email templates
SMS	Twilio	SMS notifications
WhatsApp	WhatsApp Business API	Primary notification channel — all templates
Maps	Google Maps Platform	Search map, area pins, price markers
Deployment	Vercel	CI/CD, preview deployments, Edge Functions
Accounting	Xero API	Phase 2 — basic integration

2.1 AI Builder Workflow

We will use Lovable.dev or Bolt.new for rapid UI scaffolding of non-critical pages. Your role is to:
1.	Review and refactor AI-generated code for production quality
2.	Implement all business logic, Dubai compliance code, and payment integration from scratch — never AI-generated

3.	Set up Supabase schema, RLS policies, and Edge Functions — never AI-generated
4.	Own all security-critical code: authentication, payments, document vault, RLS

 
3. Scope of Work — 6-Week MVP
3.1 Week-by-Week Deliverables
Week	Deliverable	Milestone Payment
Week 1	Supabase schema + RLS policies + Auth (all 4 methods) + Checkout.com account setup	20% of total
Week 2	Vendor onboarding flow + property/unit CRUD + DET permit upload + 3 property types	15% of total
Week 3	Guest search + Filters modal + map toggle + listing detail page	15% of total
Week 4	Complete booking flow + Dubai Math engine + Checkout.com webhooks + notifications	25% of total
Week 5	Admin panel + vendor dashboard + guest dashboard + CMS setup	15% of total
Week 6	QA audit + Dubai Math test suite + penetration test prep + soft launch	10% of total

3.2 Critical Technical Items — Must Implement
REQUIRED: These are non-negotiable technical requirements. Each must be implemented correctly before milestone payment is released.

A. Dubai Math Engine
Tourism Dirham calculation with 30-night cap. Formula: AED 10 x bedrooms x min(nights, 30). Must be server-side only — never calculated in frontend. Must include automated test suite with 7-night, 30-night, and 45-night test cases.

B. Booking Race Condition Prevention
Concurrent booking protection using PostgreSQL SELECT FOR UPDATE within a database transaction. Two guests cannot book the same unit simultaneously. This is a day-1 requirement — not optional.

C. Webhook Idempotency
Every Checkout.com webhook handler must check a processed_webhook_events table before processing. Duplicate webhook delivery must be a no-op. Required to prevent double bookings and double payouts.

D. Supabase RLS Policies
Every table must have Row Level Security enabled and tested. Vendor A must never be able to query Vendor B's data. Guest documents must only be accessible to the booking vendor and admin. Must be tested with two separate vendor accounts before milestone release.

E. Financial Audit Trail
booking_events table capturing every state change with actor, timestamp, and payload snapshot. INSERT-only — no UPDATE or DELETE. Required for UAE regulatory compliance.

F. Guest Document Vault
Supabase private storage bucket with signed URL access (1-hour expiry). Document numbers stored as SHA-256 hash only. Raw document number never stored in database.

G. WhatsApp Notification System
All 9 notification templates submitted for Meta approval simultaneously on week 1. WhatsApp delivery confirmation via webhook. SMS fallback on failed WhatsApp delivery. Notification preference per user.

 
4. What We Provide to the Developer
CONFIRMED: Full SRS v2.0 (14 sections, 200+ locked decisions) — attached to this post

CONFIRMED: CTO Audit Report with all architecture decisions, gaps, and code samples for the 3 critical fixes

CONFIRMED: Complete UI wireframes — homepage, search results (desktop + mobile), listing detail, booking flow, dashboards

CONFIRMED: Dubai Math formula with test cases — you implement, not design

CONFIRMED: Database schema decisions including all table structures and RLS policy requirements

CONFIRMED: Payment flow diagrams — full money flow, T+1 payout logic, refund scenarios

CONFIRMED: Notification template content for all 9 WhatsApp templates

CONFIRMED: Checkout.com will be set up before week 1 starts — API keys ready

CONFIRMED: Sanity.io account and schema requirements ready for week 5

CONFIRMED: Daily async communication via WhatsApp — founder available for questions same-day

 
5. Developer Requirements — Non-Negotiable
5.1 Must-Have Skills
Skill	Minimum Level	Proof Required in Proposal
Next.js (App Router, SSR)	Expert — 3+ years	Portfolio link with Next.js App Router project
Supabase (PostgreSQL + RLS + Edge Functions)	Expert — must understand RLS	Example of RLS policy you wrote
Tailwind CSS	Proficient	Portfolio — design quality will be assessed
Checkout.com or Stripe webhook integration	Proficient	Describe a payment webhook you built with idempotency
TypeScript	Proficient	All code must be TypeScript — no JavaScript
API integration (WhatsApp, Maps, email)	Proficient	List APIs you have integrated
Git / GitHub	Proficient	GitHub profile required
PostgreSQL (transactions, locks)	Proficient	Explain SELECT FOR UPDATE in your proposal

5.2 Nice-to-Have (Will Prioritize)
•	Previous OTA (Online Travel Agency) or rental marketplace experience
•	Experience building UAE or GCC-market products
•	Sanity.io CMS experience
•	Supabase Edge Functions and pg_cron experience
•	Experience with WhatsApp Business API and Meta template approval process
•	Checkout.com specifically (vs Stripe) — marketplace payment experience

5.3 Disqualifying Factors
REQUIRED: Do NOT apply if any of these apply to you:

•	You propose to use Firebase, MongoDB, WordPress, or any stack other than the one specified
•	You propose to build a native iOS/Android app — PWA only for this phase
•	You cannot commit to UAE timezone overlap (GMT+4) for at least 4 hours per day
•	You have never implemented Row Level Security in Supabase or PostgreSQL
•	You propose to use AI code generators for payment or security logic
•	You cannot provide code samples demonstrating webhook idempotency or database transactions
•	Your portfolio shows no production Next.js App Router projects

 
6. How to Apply — Read This Carefully
We will review proposals within 48 hours. We receive many proposals and reject any that do not follow this structure. This is intentional — attention to detail is the first test.

6.1 Your Proposal Must Include — In This Exact Order
5.	The code word 'DET-VERIFIED' at the top of your proposal. This confirms you read the full job post.

6.	Your fixed-price quote for the 6-week MVP. Itemise by milestone (not a single total).
7.	Your availability confirmation: how many hours per day, what timezone, and your UTC+4 overlap window.
8.	One paragraph explaining how you would implement the booking race condition fix. This is a technical filter — vague answers will be rejected.
9.	One paragraph explaining how you would implement Supabase RLS to ensure Vendor A cannot read Vendor B's bookings.
10.	One real example of a webhook handler you built with idempotency. Code snippet preferred.
11.	3 portfolio links — specifically Next.js App Router projects you built. Describe your role on each.
12.	Your Supabase experience: how many production Supabase projects, and which features you have used (RLS, Edge Functions, Realtime, Storage).
13.	One question you have about the SRS after reading it. This confirms you actually read the document.

6.2 Budget Guidance
NOTE: The budget range is USD 4,000 + for the 6-week MVP. We expect quotes in this range. Quotes above USD 10,000 will not be considered. Quotes below USD 3,000 suggest the developer has not read the scope. We will pay a fair rate for excellent work.

Milestone	Scope	Payment %
Milestone 1 — Week 1	Schema + Auth + Checkout.com setup	20%
Milestone 2 — Weeks 2-3	Vendor flow + search + listing detail	30%
Milestone 3 — Week 4	Booking flow + payments + Dubai Math + notifications	25%
Milestone 4 — Week 5	Dashboards + CMS	15%
Milestone 5 — Week 6	QA + soft launch	10%

6.3 Selection Process

14.	Application review — we read every proposal that follows the structure above

15.	Technical screening call — 30 minutes, GMT+4 timezone, we will ask you to explain your RLS approach live

16.	Paid test task —  fixed — implement the booking race condition fix in a clean Supabase project

17.	Contract — Upwork fixed-price contract with milestone releases

 
7. Working Arrangement
Item	Detail
Communication	WhatsApp for async updates. Weekly video call (30 min). Response within 4 hours during UAE business hours.
Code repository	GitHub — private repo, founder has full access at all times
Code review	All PRs reviewed by founder + CTO advisor before merge
Testing	Unit tests for all Dubai Math functions. Integration tests for booking flow. RLS tests with dual vendor accounts.

Documentation	All Supabase Edge Functions must have JSDoc comments. README must be kept current.

Ownership	All code is 100% client-owned. Full IP transfer on final milestone payment.

Phase 2	Preferred developer will be offered Phase 2 contract (Operations Module, Channel Manager integration, Arabic language) immediately after successful MVP.
NDA	Standard NDA will be signed via Upwork before SRS is shared.

$4,000.00

Fixed-price
Expert
I am willing to pay higher rates for the most experienced freelancers
