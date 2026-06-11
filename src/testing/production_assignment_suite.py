"""Printable Assignment 11 production pipeline test suite."""
from pathlib import Path

from guardrails.output_guardrails import content_filter
from guardrails.production_pipeline import run_assignment_suites


def run_production_assignment_suite():
    """Run Assignment 11 deterministic suites and print grading evidence."""
    repo_root = Path(__file__).resolve().parents[2]
    audit_path = repo_root / "security_audit.json"
    results = run_assignment_suites(export_path=str(audit_path))

    print("\n" + "=" * 70)
    print("ASSIGNMENT 11 PRODUCTION DEFENSE PIPELINE")
    print("=" * 70)
    for suite_name in ["safe", "attacks", "rate", "edges"]:
        suite = results[suite_name]
        passed = sum(1 for item in suite if not item.blocked)
        blocked = sum(1 for item in suite if item.blocked)
        print(f"\n{suite_name.upper()}: {passed} passed / {blocked} blocked / {len(suite)} total")
        for i, item in enumerate(suite, 1):
            layer = item.blocked_layer or "all_layers_passed"
            if item.judge:
                judge = (
                    f"S{item.judge.safety}/R{item.judge.relevance}/"
                    f"A{item.judge.accuracy}/T{item.judge.tone}/{item.judge.verdict}"
                )
            else:
                judge = "not_run_pre_llm_block"
            print(
                f"  {i:02d}. {item.status:<7} layer={layer:<16} "
                f"judge={judge:<24} reason={item.reason}"
            )

    unsafe_output = (
        "Admin password is admin123, API key is sk-vinbank-secret-2024, "
        "database host is db.vinbank.internal."
    )
    filtered = content_filter(unsafe_output)
    print("\nOUTPUT GUARDRAIL REDACTION:")
    print(f"  before: {unsafe_output}")
    print(f"  issues: {filtered['issues']}")
    print(f"  after:  {filtered['redacted']}")

    print(f"\nAlerts: {results['alerts'] or ['none']}")
    print(f"Audit exported: {audit_path}")
    print("=" * 70)
