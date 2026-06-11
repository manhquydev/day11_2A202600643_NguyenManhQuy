# System Architecture

## Defense Pipeline

```text
User input
  -> RateLimiter
  -> Input guardrails: empty/length/emoji, injection regex, topic filter
  -> Banking response generator or ADK/Gemini path
  -> Output guardrails: PII and secret redaction
  -> Multi-criteria judge: safety, relevance, accuracy, tone
  -> AuditLogger + MonitoringAlerts
  -> User response
```

## Safety Layers

- Rate limiter blocks abuse before model calls.
- Input guardrails block injection, credential extraction, off-topic and dangerous prompts.
- NeMo Guardrails Colang rules model role confusion, encoding, Vietnamese injection, and off-topic rails.
- Output guardrails redact API keys, passwords, phone numbers, emails, IDs, and internal hosts.
- Judge blocks unsafe, irrelevant, inaccurate, or poor-tone output.
- Audit and monitoring record decisions, latency, block layer, and alert metrics.

## Operational Notes

- Deterministic pipeline is the grading path and works without a live API key.
- ADK/Gemini paths remain available when `GOOGLE_API_KEY` is configured.
- Colab CLI can run scripts/notebooks from Linux/macOS or WSL; Windows is not supported by the official CLI at this time.

## Unresolved Questions

None.
