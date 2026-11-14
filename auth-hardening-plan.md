# Authentication Hardening Implementation Plan

## Gap Analysis from OpenAPI v1.1 vs Current Implementation

### Missing BFF Route Policies

- [x] `auth/register` - POST /api/v1/auth/register → /v1/auth/register
- [x] `auth/login` - POST /api/v1/auth/login → /v1/auth/login

### Missing NestJS Endpoints (per OpenAPI spec)

- [x] GET /v1/auth/me - Get current account and active membership
- [x] GET /v1/auth/sessions - List account sessions
- [x] POST /v1/auth/sessions/{sessionId}/revoke - Revoke one account session
- [ ] POST /v1/auth/password/forgot - Request password reset
- [ ] POST /v1/auth/password/reset - Consume reset token and set new password

### Registration → Email Verification Delivery

- [x] Registration now triggers verification delivery through email adapter during registration
- [x] Maintain generic responses (prevent account enumeration)
- [x] Resend and registration use consistent token lifecycle

### External Email Delivery Outside Transactions

- [x] Move provider call outside transaction (persist state, then deliver)
- [x] Handle provider failures without false success
- [x] Prevent duplicate/stale verification messages
- [x] Use existing outbox pattern if available

### Brevo Adapter Improvements

- [x] Add bounded request timeouts
- [x] Ensure logs never contain API keys, tokens, email bodies
- [x] Handle non-JSON responses and provider errors safely
- [x] Keep dev/prod config clearly separated
- [x] Do not introduce fake-success implementation

### Password Hashing - Async Migration

- [x] Converted scryptSync() to async scrypt()
- [x] Preserve compatibility with existing stored hashes
- [x] Update registration/login services and tests
- [x] No new dependencies, no algorithm changes

### Documentation Reconciliation

- [ ] Update AGENTS.md with current implementation status
- [ ] Update architecture-decision-register-v2.1.md
- [ ] Update API_Documentation_v1.1.md
- [ ] Sync openapi.yaml and openapi.json

---

## Priority Order

1. **BFF Registration/Login** - ✅ Complete
2. **Registration Email Delivery** - ✅ Complete
3. **Move Email Outside Transaction** - ✅ Complete
4. **Brevo Adapter Hardening** - ✅ Complete
5. **Async Password Hashing** - ✅ Complete
6. **Missing Session Endpoints** - ✅ Complete (except password reset)
7. **Documentation Sync** - In Progress
8. **Password Reset Endpoints** - Blocked (requires policy decision)
