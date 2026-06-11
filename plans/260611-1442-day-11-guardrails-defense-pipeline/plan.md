---
title: "Day 11 Guardrails Defense Pipeline"
description: "Finish lab TODOs and build production-style defense-in-depth pipeline for Assignment 11."
status: complete
priority: P2
effort: 7h
branch: main
tags: [feature, security, ai, testing]
created: 2026-06-11
---

# Day 11 Guardrails Defense Pipeline

## Scope

Complete README 13 TODOs and Assignment 11 production defense pipeline in `src/`.
Do not modify `notebooks/attack_defense_arena.ipynb`.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Complete lab guardrails/HITL TODOs | Complete | 2.5h | [phase-01-lab-todos.md](./phase-01-lab-todos.md) |
| 2 | Add production defense pipeline | Complete | 3h | [phase-02-production-defense-pipeline.md](./phase-02-production-defense-pipeline.md) |
| 3 | Validate, smoke test, report | Complete | 1.5h | [phase-03-validation-and-report.md](./phase-03-validation-and-report.md) |

## Dependencies

- `GOOGLE_API_KEY` set for Gemini/ADK/NeMo paths.
- Existing deps: `google-genai`, `google-adk`, `nemoguardrails`.
- Use existing ADK plugin style where practical; pure Python fallback allowed for deterministic judge.

## Concrete Deliverables

- README TODOs 1-13 implemented in existing `src/**/*.py`.
- Production layers: rate limiter, input guardrails, output guardrails, multi-criteria judge or deterministic fallback, audit JSON export, monitoring/alerts.
- Tests/smoke checks cover safe queries, attacks, rate limiting, edge cases.
- Individual Markdown report under repo root or `reports/`.

## Validation Commands

```powershell
pip install -r requirements.txt
$env:GOOGLE_API_KEY="..."
python -m compileall src
cd src; python main.py
cd src; python testing/testing.py
```

## Exclusions

- Do not edit `notebooks/attack_defense_arena.ipynb`.
- No new framework unless existing ADK/NeMo path blocks completion.

## Unresolved Questions

- None.
