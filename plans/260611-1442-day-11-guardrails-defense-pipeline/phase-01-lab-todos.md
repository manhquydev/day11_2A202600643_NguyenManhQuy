# Phase 01: Complete Lab Guardrails/HITL TODOs

## Context Links

- `README.md` TODO table.
- `assignment11_defense_pipeline.md` required tests.
- `src/attacks/attacks.py`, `src/guardrails/*.py`, `src/testing/testing.py`, `src/hitl/hitl.py`.

## Overview

Priority: P2. Status: complete. Fill current TODO scaffolds first. Keep current module shape. No notebook edits.

## Key Insights

- Existing code already uses ADK plugins and NeMo config.
- Many functions are stubs; finish them before production pipeline to avoid duplicate logic.
- Current `chat_with_agent()` hardcodes user `"student"`; rate-limit tests may need a user-aware helper in later phase.

## Requirements

- TODO 1: replace five adversarial prompt placeholders with concrete prompts.
- TODO 2: keep Gemini generation, robust JSON parsing, no hard failure if model returns prose.
- TODO 3-5: regex injection detection, topic filter, input ADK plugin block response.
- TODO 6-8: PII/secret redaction, multi-criteria or base judge init, output plugin mutation/block.
- TODO 9: add NeMo Colang rules for role confusion, encoding, Vietnamese injection.
- TODO 10-11: before/after comparison and reusable security test metrics.
- TODO 12-13: confidence router and 3 banking HITL decision points.

## Architecture

Flow: attack prompts -> unsafe agent -> input plugin -> protected agent -> output plugin -> comparison metrics -> HITL routing.

## Related Code Files

- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/attacks/attacks.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/input_guardrails.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/output_guardrails.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/guardrails/nemo_guardrails.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/testing/testing.py`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/hitl/hitl.py`
- Do not modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/notebooks/attack_defense_arena.ipynb`

## Implementation Steps

1. Fill five manual attacks. Include completion, translation/reformat, creative, authority/confirmation, multi-step.
2. Add injection patterns. Include English, Vietnamese, system prompt, DAN/roleplay, encoding/reformat attempts.
3. Implement topic filter: empty/long handled later; blocked topics win; allowed banking terms pass.
4. Implement input plugin with reason-specific block text and counters.
5. Implement content filter patterns for VN phone, email, 9/12 digit ID, `sk-...`, password, internal host/connection string.
6. Replace single-word judge with multi-criteria output: safety, relevance, accuracy, tone, verdict, reason.
7. Implement output plugin: redact first; judge second; block unsafe response with generic refusal.
8. Add NeMo rules and sample tests for role confusion, encoding, Vietnamese injection.
9. Implement comparison with protected plugins and pipeline metrics.
10. Implement confidence routing thresholds and HITL decision point table.

## Todo List

- [x] TODO 1-2 attacks done.
- [x] TODO 3-5 input guardrails done.
- [x] TODO 6-8 output guardrails done.
- [x] TODO 9 NeMo rules done.
- [x] TODO 10-11 security pipeline done.
- [x] TODO 12-13 HITL done.

## Success Criteria

- `python -m compileall src` passes.
- `cd src; python main.py --part 1..4` runs without TODO placeholder output.
- Safe banking examples pass; obvious attacks blocked or redacted.

## Risk Assessment

- Gemini output can vary. Mitigate: deterministic fallback in phase 2.
- ADK callback response shape may differ. Mitigate: test plugins directly and via runner.

## Security Considerations

- Never log raw secrets in final report beyond synthetic lab secrets already in repo.
- Redact before printing/exporting when possible.

## Next Steps

- Build production pipeline module and monitoring around completed primitives.
