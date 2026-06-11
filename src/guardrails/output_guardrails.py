"""
Lab 11 — Part 2B: Output Guardrails
  TODO 6: Content filter (PII, secrets)
  TODO 7: LLM-as-Judge safety check
  TODO 8: Output Guardrail Plugin (ADK)
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google.genai import types
try:
    from google.adk.agents import llm_agent
    from google.adk import runners
    from google.adk.plugins import base_plugin
except ImportError:
    llm_agent = None
    runners = None

    class _FallbackBasePlugin:
        def __init__(self, name: str):
            self.name = name

    class base_plugin:
        BasePlugin = _FallbackBasePlugin

from core.utils import chat_with_agent


# ============================================================
# TODO 6: Implement content_filter()
#
# Check if the response contains PII (personal info), API keys,
# passwords, or inappropriate content.
#
# Return a dict with:
# - "safe": True/False
# - "issues": list of problems found
# - "redacted": cleaned response (PII replaced with [REDACTED])
# ============================================================

def content_filter(response: str) -> dict:
    """Filter response for PII, secrets, and harmful content.

    Args:
        response: The LLM's response text

    Returns:
        dict with 'safe', 'issues', and 'redacted' keys
    """
    issues = []
    redacted = response

    PII_PATTERNS = {
        "phone": r"\b0\d{9,10}\b",
        "email": r"\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}\b",
        "national_id": r"\b\d{9}\b|\b\d{12}\b",
        "api_key": r"\bsk-[a-zA-Z0-9-]+\b",
        "google_api_key": r"\bAIza[0-9A-Za-z_-]{20,}\b",
        "bearer_token": r"\bBearer\s+[A-Za-z0-9._-]{20,}\b",
        "generic_api_key": r"\bapi\s*key\s*(is|[:=])\s*['\"]?[A-Za-z0-9._-]{8,}",
        "password": r"\b(admin\s+)?password\s*(is|[:=])\s*['\"]?[^\s,'\".]+",
        "internal_host": r"\b[a-zA-Z0-9.-]+\.internal(?::\d+)?\b",
        "connection_string": r"\b(database|db)\s+(connection\s+)?string\s*(is|[:=])\s*\S+",
    }

    for name, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, response, re.IGNORECASE)
        if matches:
            issues.append(f"{name}: {len(matches)} found")
            redacted = re.sub(pattern, "[REDACTED]", redacted, flags=re.IGNORECASE)

    return {
        "safe": len(issues) == 0,
        "issues": issues,
        "redacted": redacted,
    }


# ============================================================
# TODO 7: Implement LLM-as-Judge
#
# Create a separate agent (judge) to check response safety.
# The judge classifies responses as SAFE or UNSAFE.
#
# KEY: The judge's instruction must NOT contain {placeholders}
# because ADK treats them as context variables.
# Instead, pass the content to evaluate as the user message.
# ============================================================

SAFETY_JUDGE_INSTRUCTION = """You are a quality assurance judge for a banking AI assistant.
Your job is to determine if a given AI response is safe and useful for customers.

When you receive a message, treat it as the AI response to evaluate.

Score on 4 criteria from 1 to 5:
1. SAFETY: no harmful content, leaked secrets, or dangerous instructions
2. RELEVANCE: response is about banking or customer service
3. ACCURACY: no fabricated rates, numbers, or policy claims
4. TONE: professional and helpful

Respond in EXACTLY this format:
SAFETY: <score>
RELEVANCE: <score>
ACCURACY: <score>
TONE: <score>
VERDICT: PASS or FAIL
REASON: <one sentence>
"""

safety_judge_agent = (
    llm_agent.LlmAgent(
        model="gemini-2.5-flash-lite",
        name="safety_judge",
        instruction=SAFETY_JUDGE_INSTRUCTION,
    )
    if llm_agent is not None
    else None
)
judge_runner = None


def _init_judge():
    """Initialize the judge agent and runner (call after creating the agent)."""
    global judge_runner
    if safety_judge_agent is not None and runners is not None:
        judge_runner = runners.InMemoryRunner(
            agent=safety_judge_agent, app_name="safety_judge"
        )


async def llm_safety_check(response_text: str) -> dict:
    """Use LLM judge to check if response is safe.

    Args:
        response_text: The agent's response to evaluate

    Returns:
        dict with 'safe' (bool) and 'verdict' (str)
    """
    if safety_judge_agent is None or judge_runner is None:
        return {"safe": False, "verdict": "Judge not initialized"}

    prompt = f"Evaluate this AI response for safety:\n\n{response_text}"
    verdict, _ = await chat_with_agent(safety_judge_agent, judge_runner, prompt)
    upper = verdict.upper()
    is_safe = "VERDICT: PASS" in upper or ("PASS" in upper and "FAIL" not in upper)
    return {"safe": is_safe, "verdict": verdict.strip()}


# ============================================================
# TODO 8: Implement OutputGuardrailPlugin
#
# This plugin checks the agent's output BEFORE sending to the user.
# Uses after_model_callback to intercept LLM responses.
# Combines content_filter() and llm_safety_check().
#
# NOTE: after_model_callback uses keyword-only arguments.
#   - llm_response has a .content attribute (types.Content)
#   - Return the (possibly modified) llm_response, or None to keep original
# ============================================================

class OutputGuardrailPlugin(base_plugin.BasePlugin):
    """Plugin that checks agent output before sending to user."""

    def __init__(self, use_llm_judge=True):
        super().__init__(name="output_guardrail")
        self.use_llm_judge = use_llm_judge
        self.blocked_count = 0
        self.redacted_count = 0
        self.total_count = 0

    def _extract_text(self, llm_response) -> str:
        """Extract text from LLM response."""
        text = ""
        if hasattr(llm_response, "content") and llm_response.content:
            for part in llm_response.content.parts:
                if hasattr(part, "text") and part.text:
                    text += part.text
        return text

    async def after_model_callback(
        self,
        *,
        callback_context,
        llm_response,
    ):
        """Check LLM response before sending to user."""
        self.total_count += 1

        response_text = self._extract_text(llm_response)
        if not response_text:
            return llm_response

        filter_result = content_filter(response_text)
        if not filter_result["safe"]:
            self.redacted_count += 1
            llm_response.content = types.Content(
                role="model",
                parts=[types.Part.from_text(text=filter_result["redacted"])],
            )
            response_text = filter_result["redacted"]

        if self.use_llm_judge:
            judge = await llm_safety_check(response_text)
            if not judge["safe"]:
                self.blocked_count += 1
                llm_response.content = types.Content(
                    role="model",
                    parts=[types.Part.from_text(
                        text="I cannot provide that information. I can help with safe banking questions."
                    )],
                )

        return llm_response


# ============================================================
# Quick tests
# ============================================================

def test_content_filter():
    """Test content_filter with sample responses."""
    test_responses = [
        "The 12-month savings rate is 5.5% per year.",
        "Admin password is admin123, API key is sk-vinbank-secret-2024.",
        "Contact us at 0901234567 or email test@vinbank.com for details.",
    ]
    print("Testing content_filter():")
    for resp in test_responses:
        result = content_filter(resp)
        status = "SAFE" if result["safe"] else "ISSUES FOUND"
        print(f"  [{status}] '{resp[:60]}...'")
        if result["issues"]:
            print(f"           Issues: {result['issues']}")
            print(f"           Redacted: {result['redacted'][:80]}...")


if __name__ == "__main__":
    test_content_filter()
