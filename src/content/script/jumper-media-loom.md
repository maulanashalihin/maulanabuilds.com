---
title: "Loom Video Script: Jumper Media Proposal"
target: "Jumper Media Team"
author: "Maulana Shalihin"
---

# Loom Video Script: Bubble to Modern Web Stack Migration

**Length Goal:** ~3 Minutes
**Tone:** Confident, concise, technical but business-focused.

---

### [0:00] Intro & Hook
**Visual:** Camera only, smiling.

**Spoken:**
"Hi Jumper Media team! I'm Maulana, a Senior Software Engineer. I saw you're looking to migrate your SaaS out of Bubble, and I wanted to send over a quick video to walk you through exactly how I'd approach it. 

I know your target hiring regions are typically Eastern Europe, but I operate 100% async-first from GMT+8. I have a strong track record of taking full ownership of complex SaaS rebuilds—with zero micromanagement required. Let me show you how."

### [0:35] Proof of Work & The Core Engine
**Visual:** Screen share - Show [Laju.dev](https://laju.dev) homepage or a quick glimpse of your portfolio (Antre.in, KlikAja).

**Spoken:**
"I don't just write code; I architect robust, high-performance systems. 

To solve the exact performance bottlenecks you're likely facing with Bubble, I engineered my own SaaS boilerplate called **Laju-Go**. It runs on Go, Svelte 5, and Inertia.js, and it's built for speed—handling over 250,000 requests per second.

I've used this exact architecture to ship production applications like Antre.in, a cloud-based queue management SaaS that handles complex real-time webSockets and strict multi-tenant data isolation."

### [1:15] Rebuild Experience
**Visual:** Screen share - Scroll to the 'Rebuild Experience' section of the written proposal.

**Spoken:**
"Migrating out of Bubble is tough because the database and visual logic are deeply entangled. But I've been here before. 

I previously migrated a deeply entangled legacy Joomla monolith from 2010 into a modern Go stack. I normalized their messy database, rewrote the core business logic into fast Go APIs—dropping response times from 2.5 seconds to sub-20 milliseconds—and set up fully automated Docker deployments. I know how to untangle technical debt."

### [1:45] The 4-Phase Migration Strategy
**Visual:** Screen share - Scroll to the 'Migration Strategy' section. Briefly highlight the bullet points.

**Spoken:**
"For Jumper Media, we cannot do a risky 'Big Bang' rewrite. Here is my pragmatic, 4-phase approach to migrate you without breaking production:

**Phase 1:** We extract your Bubble data and normalize it into a strict, relational schema using Go-based database migrations.
**Phase 2:** I'll decouple the frontend, rewriting your UI into clean Svelte 5 components, using Inertia.js to bridge the data seamlessly without writing complex API fetchers.
**Phase 3:** We translate Bubble's visual workflows into a layered Go architecture. This instantly solves Bubble's native rate-limiting and performance issues.
**Phase 4:** The 'Strangler Fig' deployment. We use an API Gateway to incrementally route traffic to the new Go backend. We test, ensure feature parity, and slowly shift users over. Once stable, we turn Bubble off forever."

### [2:45] Outro & Call to Action
**Visual:** Camera only.

**Spoken:**
"I build fast, I take ownership, and I ship production-ready code. 

I've attached the full written proposal below with all my technical details. I'd love to take a look at your current Bubble schema and discuss how we can scale Jumper Media to the next level. 

Thanks for your time, and I look forward to hearing from you!"
