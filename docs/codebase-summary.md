# Codebase Summary

Day 11 implements guardrails, HITL routing, and a production-style defense pipeline for a VinBank AI assistant.

## Main Paths

- `src/attacks/attacks.py`: manual and Gemini-generated adversarial prompts.
- `src/guardrails/input_guardrails.py`: injection detection, topic filtering, ADK input plugin.
- `src/guardrails/output_guardrails.py`: PII/secret redaction, multi-criteria judge prompt, ADK output plugin.
- `src/guardrails/nemo_guardrails.py`: NeMo Guardrails YAML and Colang rules for injection, role confusion, encoding, Vietnamese attacks.
- `src/guardrails/production_pipeline.py`: deterministic Assignment 11 defense-in-depth pipeline.
- `src/guardrails/live_llm_adapters.py`: optional Gemini response generator and separate multi-criteria judge for live production wiring.
- `src/guardrails/rate_limiter.py`: per-user sliding-window rate limiter.
- `src/guardrails/audit_log.py`: JSON audit export.
- `src/guardrails/monitoring.py`: alert metrics.
- `src/testing/testing.py`: lab before/after comparison entry point.
- `src/testing/production_assignment_suite.py`: printable Assignment 11 suite output.
- `src/hitl/hitl.py`: confidence router and HITL decision points.
- `individual_report.md`: concise assignment report, redaction evidence, and HITL flowchart.

## Validation

- `python -m compileall src`
- `cd src; python testing/testing.py`
- `cd src; python main.py --part 5`
- `cd src; python main.py --part 4`

## Notes

- `notebooks/attack_defense_arena.ipynb` intentionally unchanged.
- `GOOGLE_API_KEY` is optional for deterministic Assignment 11 tests, required for live Gemini/ADK paths and live pipeline adapters.
- NeMo Guardrails is used for programmable Colang rails; NeMo Framework model training is not needed.

## Unresolved Questions

None.
