"""Audit logging for defense pipeline decisions."""
from datetime import datetime, timezone
import json
from pathlib import Path


class AuditLogger:
    """Stores interaction evidence for review, debugging, and compliance."""

    def __init__(self):
        self.events = []

    def record(self, event: dict) -> None:
        """Append one sanitized pipeline event with a UTC timestamp."""
        item = {"timestamp": datetime.now(timezone.utc).isoformat(), **event}
        self.events.append(item)

    def export_json(self, filepath: str = "security_audit.json") -> str:
        """Write all audit events as a JSON array and return the path."""
        path = Path(filepath)
        path.write_text(json.dumps(self.events, indent=2, ensure_ascii=False), encoding="utf-8")
        return str(path)
