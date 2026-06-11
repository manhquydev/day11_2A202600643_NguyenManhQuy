"""Printable Assignment 11 production pipeline test suite."""
from pathlib import Path

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
            print(f"  {i:02d}. {item.status:<7} layer={layer:<16} reason={item.reason}")

    print(f"\nAlerts: {results['alerts'] or ['none']}")
    print(f"Audit exported: {audit_path}")
    print("=" * 70)
