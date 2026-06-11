"""Per-user sliding-window rate limiter for the defense pipeline."""
from collections import defaultdict, deque
import time


class RateLimiter:
    """Blocks burst abuse before expensive guardrails or LLM calls run."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.user_windows = defaultdict(deque)
        self.blocked_count = 0
        self.allowed_count = 0

    def check(self, user_id: str, now: float | None = None) -> dict:
        """Return allow/block decision and retry wait for one user request."""
        now = time.monotonic() if now is None else now
        window = self.user_windows[user_id]

        while window and now - window[0] >= self.window_seconds:
            window.popleft()

        if len(window) >= self.max_requests:
            self.blocked_count += 1
            wait_seconds = max(0.0, self.window_seconds - (now - window[0]))
            return {
                "allowed": False,
                "wait_seconds": round(wait_seconds, 2),
                "reason": f"Rate limit exceeded: {self.max_requests}/{self.window_seconds}s",
            }

        window.append(now)
        self.allowed_count += 1
        return {"allowed": True, "wait_seconds": 0.0, "reason": "Allowed"}
