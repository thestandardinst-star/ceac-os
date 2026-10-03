# FPG7 Acceptance — People / HR / Workforce Exact Reference

Accepted application SHA: `a268125b22f0badad7a04cddbac4ff12769c7862`

FUNCTIONAL CONTRACT PRESERVED: YES
SECURITY/AUTHORITY PRESERVED: YES
REFERENCE COMPONENT PARITY: YES — literal PEOPLE-A employee roster and planned-absence calendar treatment implemented with authoritative CEAC records
RESPONSIVE ACCEPTANCE: YES

Implemented and verified:
- People uses the locked PEOPLE-A employee-row hierarchy: avatar, name, role/title, unit context, factual status and recent-work context;
- Workforce Calendar uses the locked PEOPLE-A horizontal employee-by-date planned-absence composition;
- approved, pending and Administration-review leave states are visually distinct without changing leave authority;
- compact unit/person controls preserve factual filtering;
- reference-only onboarding tasks, future events and AI-assistant content are deliberately omitted because CEAC has no authoritative source for them;
- the CEAC 12px operational typography floor is preserved;
- the locked aggregate CSS performance budget is preserved without raising the guardrail;
- existing People employment-history RPCs, protected-HR boundaries, capability authority and leave/workforce contracts remain unchanged.

Exact-head evidence:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Level B SQL and authority contracts PASS;
- browser shards 1/4, 2/4, 3/4 and 4/4 PASS;
- exact-head evidence merge PASS;
- role-and-RLS closure PASS;
- Quality Gate PASS.

Deployment note:
- Vercel reports the known external build-rate-limit status on this SHA. This is not an application-code failure and is deferred to the later production/deployment closure stage.
