# WhatsThatFont — Planning Docs

This directory contains the design artifacts that informed the initial build.

## Layout

- [`prd.md`](./prd.md) — Product Requirements Document: what we're building and why.
- [`api-spec.md`](./api-spec.md) — HTTP API contract between the React frontend and the backend.
- [`prompt-spec.md`](./prompt-spec.md) — Prompt design, structured-output schema, and accuracy strategy for Claude.
- [`ux-flow.md`](./ux-flow.md) — User-facing flow, states, and error handling.
- [`requirements.md`](./requirements.md) — Master requirements tracker. CI reads this file.
- [`testing.md`](./testing.md) — Test layers, commands, TDD workflow.
- [`roadmap.md`](./roadmap.md) — Milestoned build plan (M0–M6).
- [`adr/`](./adr) — Architecture Decision Records. Each captures a single decision, its context, and the alternatives rejected.

## Reading order

If you're new to the repo, read in this order: PRD → UX flow → API spec → Prompt spec → requirements.md → testing.md → ADRs.
