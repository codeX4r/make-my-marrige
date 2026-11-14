\---

name: security-review

description: Review authentication, authorization, tenant isolation, sessions, API security, sensitive data handling and application vulnerabilities.

\---

\# Security Review

\## Objective

Identify security weaknesses using evidence from the actual implementation.

\## Review Areas

\### Authentication

\- Password hashing and verification.

\- Access token validation.

\- Refresh token rotation.

\- Token expiry and reuse detection.

\- Session creation and revocation.

\- Password reset security.

\- Email verification.

\### Authorization

\- Role and permission enforcement.

\- Resource ownership validation.

\- Server-side authorization.

\- Cross-user access prevention.

\- Tenant isolation.

\### API Security

\- DTO validation.

\- Input sanitization.

\- Injection vulnerabilities.

\- CSRF protection.

\- Origin validation.

\- Rate limiting.

\- Authentication guard coverage.

\- Sensitive endpoint protection.

\### Data Security

\- Password and token storage.

\- Sensitive information in logs.

\- MongoDB transaction boundaries.

\- Secret management.

\- Data exposure in API responses.

\### External Integrations

\- API credential handling.

\- Provider timeout handling.

\- Error sanitization.

\- Safe handling of external provider failures.

\## Rules

\- Inspect actual implementation, not assumptions.

\- Never expose secrets, passwords or raw tokens.

\- Never claim a vulnerability without evidence.

\- Do not perform destructive security testing.

\- Do not call real external services.

\- Do not modify application code during a review unless explicitly requested.

\- Avoid unrelated repository exploration.

\## Severity

\- Critical: Direct compromise or severe unauthorized access.

\- High: Significant security weakness with realistic exploitation.

\- Medium: Limited impact or meaningful security control deficiency.

\- Low: Minor security weakness.

\- Informational: Improvement opportunity.

\## Output

For every finding include:

1\. Severity.

2\. Affected file and relevant code location.

3\. Evidence.

4\. Security impact.

5\. Recommended remediation.

Also report:

\- Areas reviewed.

\- Areas not reviewed.

\- Tests performed.

\- Remaining security uncertainties.
