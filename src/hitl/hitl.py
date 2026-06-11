"""
Lab 11 — Part 4: Human-in-the-Loop Design
  TODO 12: Confidence Router
  TODO 13: Design 3 HITL decision points
"""
from dataclasses import dataclass


# ============================================================
# TODO 12: Implement ConfidenceRouter
#
# Route agent responses based on confidence scores:
#   - HIGH (>= 0.9): Auto-send to user
#   - MEDIUM (0.7 - 0.9): Queue for human review
#   - LOW (< 0.7): Escalate to human immediately
#
# Special case: if the action is HIGH_RISK (e.g., money transfer,
# account deletion), ALWAYS escalate regardless of confidence.
#
# Implement the route() method.
# ============================================================

HIGH_RISK_ACTIONS = [
    "transfer_money",
    "close_account",
    "change_password",
    "delete_data",
    "update_personal_info",
]


@dataclass
class RoutingDecision:
    """Result of the confidence router."""
    action: str          # "auto_send", "queue_review", "escalate"
    confidence: float
    reason: str
    priority: str        # "low", "normal", "high"
    requires_human: bool


class ConfidenceRouter:
    """Route agent responses based on confidence and risk level.

    Thresholds:
        HIGH:   confidence >= 0.9 -> auto-send
        MEDIUM: 0.7 <= confidence < 0.9 -> queue for review
        LOW:    confidence < 0.7 -> escalate to human

    High-risk actions always escalate regardless of confidence.
    """

    HIGH_THRESHOLD = 0.9
    MEDIUM_THRESHOLD = 0.7

    def route(self, response: str, confidence: float,
              action_type: str = "general") -> RoutingDecision:
        """Route a response based on confidence score and action type.

        Args:
            response: The agent's response text
            confidence: Confidence score between 0.0 and 1.0
            action_type: Type of action (e.g., "general", "transfer_money")

        Returns:
            RoutingDecision with routing action and metadata
        """
        if action_type in HIGH_RISK_ACTIONS:
            return RoutingDecision(
                action="escalate",
                confidence=confidence,
                reason=f"High-risk action: {action_type}",
                priority="high",
                requires_human=True,
            )

        if confidence >= self.HIGH_THRESHOLD:
            return RoutingDecision("auto_send", confidence, "High confidence", "low", False)

        if confidence >= self.MEDIUM_THRESHOLD:
            return RoutingDecision(
                "queue_review",
                confidence,
                "Medium confidence needs review",
                "normal",
                True,
            )

        return RoutingDecision(
            "escalate",
            confidence,
            "Low confidence escalating",
            "high",
            True,
        )


# ============================================================
# TODO 13: Design 3 HITL decision points
#
# For each decision point, define:
# - trigger: What condition activates this HITL check?
# - hitl_model: Which model? (human-in-the-loop, human-on-the-loop,
#   human-as-tiebreaker)
# - context_needed: What info does the human reviewer need?
# - example: A concrete scenario
#
# Think about real banking scenarios where human judgment is critical.
# ============================================================

hitl_decision_points = [
    {
        "id": 1,
        "name": "High-value transfer approval",
        "trigger": "Transfer, beneficiary change, or account closure action requested.",
        "hitl_model": "human-in-the-loop",
        "context_needed": "User identity status, amount, recipient, fraud signals, chat transcript.",
        "example": "Customer asks to transfer 500,000,000 VND to a new beneficiary.",
    },
    {
        "id": 2,
        "name": "Low-confidence policy answer",
        "trigger": "Confidence between 0.7 and 0.9 or judge accuracy score below 4.",
        "hitl_model": "human-as-tiebreaker",
        "context_needed": "Draft answer, retrieved policy source, confidence and judge scores.",
        "example": "Assistant is unsure whether a fee waiver applies to a premium account.",
    },
    {
        "id": 3,
        "name": "Safety anomaly monitoring",
        "trigger": "User repeatedly trips injection, rate-limit, or secret-leak guardrails.",
        "hitl_model": "human-on-the-loop",
        "context_needed": "Recent blocked prompts, user/session ID, alert metrics, risk reason.",
        "example": "Same session sends five credential extraction prompts in one minute.",
    },
]


def hitl_flowchart_mermaid() -> str:
    """Return the HITL routing flowchart for report/notebook output."""
    return """flowchart TD
    A[Customer request] --> B{High-risk action?}
    B -->|Yes| H[Human-in-the-loop escalation]
    B -->|No| C{Confidence score}
    C -->|>= 0.90| D[Auto-send]
    C -->|0.70-0.89| E[Human-as-tiebreaker queue]
    C -->|< 0.70| F[Immediate human escalation]
    D --> G{Safety anomaly later?}
    E --> G
    F --> G
    H --> G
    G -->|Repeated injection/rate-limit| I[Human-on-the-loop monitoring]
    G -->|Normal| J[Audit and close]
"""


# ============================================================
# Quick tests
# ============================================================

def test_confidence_router():
    """Test ConfidenceRouter with sample scenarios."""
    router = ConfidenceRouter()

    test_cases = [
        ("Balance inquiry", 0.95, "general"),
        ("Interest rate question", 0.82, "general"),
        ("Ambiguous request", 0.55, "general"),
        ("Transfer $50,000", 0.98, "transfer_money"),
        ("Close my account", 0.91, "close_account"),
    ]

    print("Testing ConfidenceRouter:")
    print("=" * 80)
    print(f"{'Scenario':<25} {'Conf':<6} {'Action Type':<18} {'Decision':<15} {'Priority':<10} {'Human?'}")
    print("-" * 80)

    for scenario, conf, action_type in test_cases:
        decision = router.route(scenario, conf, action_type)
        print(
            f"{scenario:<25} {conf:<6.2f} {action_type:<18} "
            f"{decision.action:<15} {decision.priority:<10} "
            f"{'Yes' if decision.requires_human else 'No'}"
        )

    print("=" * 80)


def test_hitl_points():
    """Display HITL decision points."""
    print("\nHITL Decision Points:")
    print("=" * 60)
    for point in hitl_decision_points:
        print(f"\n  Decision Point #{point['id']}: {point['name']}")
        print(f"    Trigger:  {point['trigger']}")
        print(f"    Model:    {point['hitl_model']}")
        print(f"    Context:  {point['context_needed']}")
        print(f"    Example:  {point['example']}")
    print("\nHITL Flowchart (Mermaid):")
    print(hitl_flowchart_mermaid())
    print("\n" + "=" * 60)


if __name__ == "__main__":
    test_confidence_router()
    test_hitl_points()
