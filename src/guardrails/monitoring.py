"""Monitoring counters and threshold alerts for safety operations."""


class MonitoringAlerts:
    """Tracks layer outcomes and raises simple operational alerts."""

    def __init__(self, block_rate_threshold: float = 0.5, judge_fail_threshold: float = 0.2):
        self.block_rate_threshold = block_rate_threshold
        self.judge_fail_threshold = judge_fail_threshold
        self.total_requests = 0
        self.blocked_requests = 0
        self.rate_limit_hits = 0
        self.judge_failures = 0

    def observe(self, result) -> None:
        """Update counters from a pipeline result."""
        self.total_requests += 1
        if result.blocked:
            self.blocked_requests += 1
        if result.blocked_layer == "rate_limiter":
            self.rate_limit_hits += 1
        if result.blocked_layer == "llm_judge":
            self.judge_failures += 1

    def metrics(self) -> dict:
        """Return current monitoring rates and counts."""
        total = max(self.total_requests, 1)
        return {
            "total_requests": self.total_requests,
            "blocked_requests": self.blocked_requests,
            "block_rate": self.blocked_requests / total,
            "rate_limit_hits": self.rate_limit_hits,
            "judge_fail_rate": self.judge_failures / total,
        }

    def check_alerts(self) -> list[str]:
        """Return alert messages when safety thresholds are exceeded."""
        metrics = self.metrics()
        alerts = []
        if metrics["block_rate"] > self.block_rate_threshold:
            alerts.append(f"High block rate: {metrics['block_rate']:.0%}")
        if metrics["rate_limit_hits"] > 3:
            alerts.append(f"Rate limit spike: {metrics['rate_limit_hits']} hits")
        if metrics["judge_fail_rate"] > self.judge_fail_threshold:
            alerts.append(f"Judge fail rate high: {metrics['judge_fail_rate']:.0%}")
        return alerts
