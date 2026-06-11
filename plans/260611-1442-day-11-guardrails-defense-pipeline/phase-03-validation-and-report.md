# Phase 03: Validation And Report

## Context Links

- `assignment11_defense_pipeline.md` grading tables.
- Phase 01 and Phase 02 files.

## Overview

Priority: P2. Status: complete. Prove the implementation works and produce the individual Markdown report.

## Key Insights

- Grading expects shown output. For `.py` route, terminal output plus JSON audit/report is acceptable.
- Report is 1-2 pages; concise tables best.

## Requirements

- Run compile, module smoke tests, full lab, production pipeline suites.
- Save audit JSON from production run.
- Create individual Markdown report answering five assignment questions.
- Include false-positive trade-off experiment.
- Include 3 bypass prompts and proposed extra layers.

## Related Code Files

- Create `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/individual_report.md`
- Create `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/security_audit.json`
- Modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/src/testing/testing.py` if suite output needs clearer reporting.
- Do not modify `D:/project/AI20K/day/day11/Day-11-Guardrails-HITL-Responsible-AI/notebooks/attack_defense_arena.ipynb`

## Validation Commands

```powershell
pip install -r requirements.txt
$env:GOOGLE_API_KEY="..."
python -m compileall src
cd src; python main.py --part 1
cd src; python main.py --part 2
cd src; python main.py --part 3
cd src; python main.py --part 4
cd src; python testing/testing.py
```

Optional no-key fallback smoke:

```powershell
Remove-Item Env:GOOGLE_API_KEY -ErrorAction SilentlyContinue
cd src; python testing/testing.py
```

## Implementation Steps

1. Compile all source files.
2. Run direct module tests for input/output/Nemo/HITL where available.
3. Run production suites:
   - Safe queries: 5 pass.
   - Attacks: 7 blocked; record first catching layer.
   - Rate limit: 15 requests, last 5 blocked.
   - Edge cases: empty, long, emoji-only, SQL injection, off-topic blocked.
4. Export `security_audit.json`.
5. Write `individual_report.md`:
   - Attack layer table.
   - False positive analysis and stricter-threshold trade-off.
   - 3 gaps and proposed layers.
   - Production readiness for 10,000 users.
   - Ethical reflection.
6. If failures occur, fix implementation; rerun compile and failed suite.

## Todo List

- [x] Compile passes.
- [x] Lab parts pass.
- [x] Assignment suites pass.
- [x] Audit JSON generated.
- [x] Individual report written.
- [x] Notebook exclusion verified.

## Success Criteria

- No syntax errors.
- Terminal output clearly shows pass/block counts and reasons.
- `individual_report.md` answers all five report questions.
- `security_audit.json` can be parsed by `python -m json.tool security_audit.json`.

## Risk Assessment

- Live LLM may make tests nondeterministic. Mitigate by testing deterministic layer decisions before LLM where possible.
- NeMo dependency/model provider may fail. Mitigate by documenting fallback and keeping core pipeline independent.

## Security Considerations

- Report may mention synthetic lab secrets only as known test markers.
- Do not commit real `.env`, API keys, or credentials.

## Unresolved Questions

- None.
