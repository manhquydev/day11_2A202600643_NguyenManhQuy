# Phase 02: Production Defense Pipeline

## Context Links

- `assignment11_defense_pipeline.md` pipeline architecture and required tests.
- Existing modules from Phase 01.

## Overview

Priority: P2. Status: complete. Add a small defense-in-depth layer around existing lab guardrails. Prefer pure Python orchestration plus ADK plugins where useful.

## Key Insights

- Assignment accepts `.py` files instead of notebook.
- Need at least 4 independent safety layers plus audit/monitoring.
- Multi-criteria LLM judge required, deterministic fallback acceptable when key/API unavailable.

## Requirements

- Per-user sliding-window rate limiter: 10 requests / 60 seconds default.
- Input guardrails: injection regex + topic filter + optional NeMo check.
- LLM call: protected VinBank agent or pure helper.
- Output guardrails: PII/secrets redaction.
- Judge: score safety, relevance, accuracy, tone; fail if any criterion below threshold.
- Audit log: record input, output/redacted output, blocked layer, matched reason, latency, timestamp, user ID; export JSON.
- Monitoring: block rate, rate-limit hits, judge fail rate; threshold alerts.

## Architecture

`DefensePipeline.process(user_input, user_id)`:

1. Create audit event + start timer.
2. Rate limiter check. Block early.
3. Validate input length/empty/emoji-only/off-topic/injection.
4. Run optional NeMo guard if initialized; degrade if unavailable.
5. Call LLM only after input passes.
6. Run output redaction.
7. Run judge; deterministic fallback checks known risky patterns and basic relevance.
8. Save audit event and update monitor counters.
9. Return structured result: status, response, blocked_layer, judge_scores, latency.

## Related Code Files

- Create `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/rate_limiter.py`
- Create `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/audit_log.py`
- Create `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/monitoring.py`
- Create `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/production_pipeline.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/testing/testing.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/main.py` only if adding `--part 5` is useful.
- Do not modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/notebooks/attack_defense_arena.ipynb`

## Implementation Steps

1. Add `RateLimiter` class using `defaultdict(deque)`, monotonic time, `allowed/wait_seconds`.
2. Add `AuditLogger` class with `record()`, `export_json(filepath="security_audit.json")`.
3. Add `MonitoringAlerts` class with counters and `check_alerts()` thresholds: block rate > 50%, rate-limit hits > 3, judge fail rate > 20%.
4. Add `JudgeResult` and deterministic judge fallback; parse LLM judge when available.
5. Add `DefensePipeline` with structured dataclass result. Keep functions/classes commented.
6. Wire existing `detect_injection`, `topic_filter`, `content_filter`, `llm_safety_check`.
7. Add test suites exactly from assignment: safe, attacks, rate limiting, edge cases.
8. Export JSON audit from smoke run to `security_audit.json`.

## Todo List

- [x] Rate limiter implemented.
- [x] Audit JSON export implemented.
- [x] Monitoring alerts implemented.
- [x] Multi-criteria judge/fallback implemented.
- [x] End-to-end production pipeline implemented.
- [x] Assignment suites wired.

## Success Criteria

- Safe queries pass unless intentionally stricter false-positive experiment.
- Seven attack queries blocked before output or by judge.
- 15 rapid requests: first 10 pass, last 5 rate-limited.
- Edge cases blocked with clear layer/reason.
- `security_audit.json` valid JSON array, includes latency and block layer.

## Risk Assessment

- LLM judge latency/cost. Mitigate: deterministic fallback and optional judge flag.
- Topic filter may block "What is 2+2?" intentionally as off-topic.
- NeMo init can fail in local env. Mitigate: optional layer with logged unavailable state.

## Security Considerations

- Audit log should store redacted output, not raw leaked secrets when output filter detects them.
- Rate limiter keyed by explicit `user_id`; avoid all users sharing `"student"` in production pipeline.

## Next Steps

- Validate all suites and write individual Markdown report.
