---
title: "SaaS Migration Proposal: Bubble to Modern Web Stack"
client: "Jumper Media"
author: "Maulana Shalihin"
role: "Senior Software Engineer"
contact: "Indonesia - GMT+8"
date: "2026-04-10"
status: "sent"
links:
  github: "https://github.com/maulanashalihin"
  portfolio: "https://maulanabuilds.com/portfolio"
tags: ["SaaS", "Migration", "Go", "React", "Bubble"]
---


**Prepared for:** Jumper Media  
**By:** Maulana Shalihin | Senior Software Engineer  
**Location:** Indonesia - GMT+8 (Operating 100% Async-First)  
**Links:** [GitHub](https://github.com/maulanashalihin) | [Portfolio](https://maulanabuilds.com)

---

## 1. Introduction & Background

Hi Jumper Media team, I'm Maulana, a Senior Software Engineer with over 11 years of experience. I specialize in **Go, Node.js, and cloud-native deployments**. 

I know your target hiring regions are in Eastern Europe, but I operate completely async-first, and I have a strong track record of taking ownership of complex SaaS rebuilds with zero micromanagement required. I don't just write code; I build robust, scalable products. 

---

## 2. Proof of Work: Architecting High-Performance Systems

Every project below represents a production-ready system shipped with proper architecture, security, and automated deployment pipelines.

### The Core Engine: [Laju.dev](https://laju.dev) (Laju-Go)
I engineered my own high-performance SaaS boilerplate to solve the bloat of standard frameworks. 
* **Stack:** Go Fiber / HyperExpress, Svelte 5, Inertia.js 3 + SQLite.
* **Performance:** Delivers **258k req/sec** (11x faster than standard Express, 3,232x faster than Laravel).
* **Features:** Built-in multi-agent AI workflows, automated testing, and CI/CD pipelines out of the box.

### Production SaaS Portfolio
* **Antre.in (B2B Healthcare SaaS):** A live, cloud-based queue management SaaS serving medical clinics. Features complex booking logic, real-time WebSockets, and strict multi-tenant data isolation.
* **KlikAja (Analytics & Link Management):** A high-concurrency URL shortener with deep analytics, A/B testing rotation, and Redis-backed caching.
* **DripSender & DripForm:** Comprehensive business automation platforms managing CRM, Webhooks, WhatsApp API routing, and event-driven marketing workflows.
* **TapSite.ai & SlugPost:** AI-powered, mobile-first publishing platforms focusing on frictionless UX and instant content delivery.

---

## 3. Rebuild Experience: Legacy Migration to Modern Stack

You asked for a rebuild project. Migrating out of Bubble is tough, but I have executed migrations from much older, deeply entangled systems—specifically, **migrating a monolithic Joomla 3 framework (circa 2010) into a modern Go stack (Laju-Go).**

### What was broken?
1. **Database Spaghetti:** The legacy system relied on an EAV (Entity-Attribute-Value) anti-pattern. Everything was stored in massive `_content` tables, causing severe N+1 query bottlenecks that choked the server during peak traffic.
2. **Visual/Plugin Bloat:** Business logic was scattered across 30+ outdated plugins, making debugging impossible and security vulnerabilities a constant threat.
3. **Deployment Nightmare:** No CI/CD existed. Deployments were manual FTP uploads, leading to frequent production downtime.

### How I improved it:
1. **Data Normalization:** I reverse-engineered the legacy database and migrated it into a strict, normalized Relational Schema (SQLite/PostgreSQL) using Go-based `Goose` migrations.
2. **API Rewrite:** I stripped away the visual plugins and rewrote the core business logic into fast, secure **Go RESTful APIs**, dropping the TTFB (Time to First Byte) from 2.5 seconds to sub-20 milliseconds.
3. **DevOps Automation:** I containerized the new application using **Docker** and orchestrated a **GitHub Actions** pipeline for automated testing and zero-downtime deployments.

---

## 4. Migration Strategy: Bubble to Laju-Go (Modern Stack)

Migrating a live SaaS from Bubble requires precision. We cannot do a "Big Bang" rewrite. Using my **Laju-Go** framework, here is my pragmatic, step-by-step approach to migrating your Bubble app to a high-performance Go backend without breaking production:

### Phase 1: Database Extraction & Normalization
Bubble abstracts the database, which creates technical debt. We will move this to Laju-Go’s optimized **SQLite3** layer.
* **Extraction:** Extract the Bubble data (via CSV export for historical data and Webhooks for live delta-syncs).
* **Schema Design:** Use **Goose** inside the `migrations/` directory to write strict, normalized relational database schemas.
* **Data Seeding:** Write Go scripts utilizing the **Squirrel** query builder in the `app/repositories/` layer to safely sanitize and insert the Bubble data into the new SQL database.

### Phase 2: AI-Augmented Frontend Decoupling (Svelte 5 + Inertia.js)
* I will clone the visual DOM structure of your current Bubble application.
* Utilizing AI-augmented workflows (Claude Opus 4.6), I will rewrite the proprietary Bubble UI into clean, maintainable components inside `frontend/src/components/` and `frontend/src/pages/` using **Svelte 5**.
* **The Game Changer:** Instead of writing complex API fetchers on the frontend, I will use **Inertia.js 3**. This acts as a SPA bridge, allowing the Go Fiber backend to pass data directly to Svelte pages seamlessly, drastically reducing frontend development time.

### Phase 3: Translating Visual Workflows into Go Services
* I will translate Bubble's "Visual Workflows" into a strict layered architecture in Go.
* Business logic goes into `app/services/`, database operations into `app/repositories/`, and the HTTP routing into `app/handlers/`.
* The **Go Fiber v2** framework will instantly solve the rate-limiting and performance bottlenecks native to Bubble's backend, delivering fasthttp-level speeds.

### Phase 4: The "Strangler Fig" Deployment
* I will deploy the new Laju-Go backend via Docker and CI/CD pipelines.
* We will use an API Gateway to route traffic incrementally. We test the new routes internally, ensure 100% feature parity, and then slowly shift live user traffic from Bubble to the new Go stack. Once stable, we turn Bubble off forever.
---
**I build fast, I take ownership, and I ship production-ready code.** Let's discuss your current Bubble schema and how we can scale Jumper Media to the next level.
