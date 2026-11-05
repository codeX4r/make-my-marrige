# MakeMyMarrige — Database Schema Design v1.0

**Platform:** MongoDB Atlas + NestJS/Mongoose  
**Modelling:** Hybrid, one collection per independently managed domain entity  
**Tenant model:** Shared database/shared collections, logical isolation using `weddingId`  
**Timezone:** `Asia/Kolkata`  

## Architecture decisions
- ObjectId for internal IDs; high-entropy opaque external tokens stored only as hashes.
- Integer paise for money; currency `INR`; presentation rounds up using `ceil(amountPaise / 100)`.
- Date-only values are validated `YYYY-MM-DD` strings; actual instants are UTC BSON Date.
- Mutable documents use optimistic concurrency control (`version`).
- Multi-document invariants use MongoDB transactions; side effects use transactional outbox.
- TTL is selective and asynchronous; application enforces expiry immediately.
- Every tenant-owned document includes `weddingId`; server derives tenant from active membership.
- Redis is not the source of truth; R2 stores photo objects, MongoDB stores metadata.

## Diagrams
![01_database_context](diagrams/01_database_context.png)

![02_identity_membership](diagrams/02_identity_membership.png)

![03_guests_planning_rsvp](diagrams/03_guests_planning_rsvp.png)

![04_finance_vendor_shagun](diagrams/04_finance_vendor_shagun.png)

![05_photos_audit_lifecycle](diagrams/05_photos_audit_lifecycle.png)

## Collection schema catalogue
### `users` — Identity / global

**Fields:** emailNormalized:string unique; passwordHash:string?; emailVerifiedAt:Date?; displayName:string; accountStatus:ACTIVE|SUSPENDED|CLOSED; authProviderLinks:bounded array; createdAt; updatedAt; version:int.

**Indexes / constraints:** Unique emailNormalized. Never embed sessions.

### `sessions` — Identity / global

**Fields:** userId:ObjectId; refreshTokenHash:string; sessionFamilyId:string; expiresAt:Date; revokedAt:Date?; lastUsedAt:Date?; deviceLabel:string?; minimal IP metadata; createdAt.

**Indexes / constraints:** Index userId+revokedAt+expiresAt. TTL only after expiry policy.

### `emailVerificationTokens` — Identity / global

**Fields:** userId:ObjectId; tokenHash:string; expiresAt:Date; consumedAt:Date?; createdAt:Date.

**Indexes / constraints:** Unique tokenHash; TTL expiresAt; enforce expiry in API.

### `passwordResetTokens` — Identity / global

**Fields:** userId:ObjectId; tokenHash:string; expiresAt:Date; consumedAt:Date?; createdAt:Date.

**Indexes / constraints:** Unique tokenHash; TTL expiresAt; single-use.

### `weddings` — Workspace

**Fields:** name:string; weddingDate:YYYY-MM-DD; timezone:'Asia/Kolkata'; lifecycleStatus enum; deletionDueAt:Date?; createdAt; updatedAt; version:int.

**Indexes / constraints:** Workspace root; no embedded business collections.

### `weddingMemberships` — Workspace

**Fields:** weddingId:ObjectId; userId:ObjectId; memberType:CO_OWNER|ORGANISER|TREASURER; status:ACTIVE|SUSPENDED|ENDED; permissions:bounded grants; joinedAt; endedAt?; version:int.

**Indexes / constraints:** Partial unique userId for ACTIVE/SUSPENDED; weddingId+status+memberType.

### `membershipPeriodEvents` — Workspace

**Fields:** weddingId:ObjectId; membershipId:ObjectId; eventType:JOINED|SUSPENDED|REACTIVATED|ENDED; actorId; reason?; occurredAt.

**Indexes / constraints:** Append-only; weddingId+membershipId+occurredAt.

### `invitations` — Workspace

**Fields:** weddingId:ObjectId; invitedEmailNormalized:string; invitationType; tokenHash; status:PENDING|ACCEPTED|REVOKED|EXPIRED; expiresAt; createdBy; acceptedBy?; acceptedAt?; createdAt.

**Indexes / constraints:** Unique tokenHash; weddingId+email+status; retain history.

### `governanceRequests` — Governance

**Fields:** weddingId:ObjectId; requestType; targetEntityType; targetEntityId:ObjectId; proposedSnapshot:bounded object; proposalVersion:int; approvals:bounded distinct co-owner approvals; status; expiresAt; createdBy; createdAt; version:int.

**Indexes / constraints:** Index weddingId+status+createdAt; proposal changes invalidate approvals.

### `weddingFinanceSettings` — Governance

**Fields:** weddingId:ObjectId unique; treasurerMembershipId:ObjectId?; approvalPolicyVersion:int; reserveApprovalThresholdPaise:int64?; updatedAt; version:int.

**Indexes / constraints:** One settings record per wedding; changes follow dual-owner governance.

### `permissionChangeEvents` — Governance

**Fields:** weddingId:ObjectId; membershipId:ObjectId; changedBy; before/after permission snapshot; reason; occurredAt.

**Indexes / constraints:** Append-only audit of permission changes.

### `weddingFunctions` — Planning

**Fields:** weddingId:ObjectId; name; date:YYYY-MM-DD; startTime/endTime:HH:mm?; venueVisibility:ANNOUNCED|TO_BE_ANNOUNCED|PRIVATE; draftDetails:bounded; publicationStatus:DRAFT|PUBLISHED|CANCELLED; version:int; timestamps.

**Indexes / constraints:** weddingId+date; status/date queries.

### `functionPublicationSnapshots` — Planning

**Fields:** weddingId:ObjectId; functionId:ObjectId; snapshotVersion:int; publishedSnapshot:immutable bounded object; approvedBy:[two distinct co-owner IDs]; publishedAt:Date.

**Indexes / constraints:** Unique weddingId+functionId+snapshotVersion.

### `functionHouseholdInvitations` — Planning

**Fields:** weddingId:ObjectId; functionId:ObjectId; householdId:ObjectId; status:INVITED|REVOKED; invitedAt; createdBy.

**Indexes / constraints:** Unique weddingId+functionId+householdId.

### `functionGuestInvitations` — Planning

**Fields:** weddingId:ObjectId; functionId:ObjectId; guestId:ObjectId; householdInvitationId:ObjectId?; status:INVITED|REVOKED; invitedAt; createdBy.

**Indexes / constraints:** Unique weddingId+functionId+guestId.

### `tasks` — Planning

**Fields:** weddingId:ObjectId; functionId:ObjectId?; title; description?; status:TODO|IN_PROGRESS|BLOCKED|COMPLETED|CANCELLED; priority; dueAt:Date?; createdBy; version:int; timestamps.

**Indexes / constraints:** weddingId+status+dueAt+_id; weddingId+functionId+status.

### `taskAssignments` — Planning

**Fields:** weddingId:ObjectId; taskId:ObjectId; assigneeMembershipId:ObjectId; assignedBy; assignedAt; status:ACTIVE|REMOVED.

**Indexes / constraints:** Partial unique weddingId+taskId+assigneeMembershipId for ACTIVE.

### `taskChecklistItems` — Planning

**Fields:** weddingId:ObjectId; taskId:ObjectId; title; isMandatory:boolean; status:OPEN|COMPLETED; completedBy:ObjectId?; completedAt:Date?; sortOrder:int; version:int.

**Indexes / constraints:** weddingId+taskId+sortOrder. Separate entity for independently validated completion.

### `taskDependencies` — Planning

**Fields:** weddingId:ObjectId; taskId:ObjectId; dependsOnTaskId:ObjectId; createdBy; createdAt.

**Indexes / constraints:** Unique weddingId+taskId+dependsOnTaskId; reject self-edge and cycles in domain service.

### `taskComments` — Planning

**Fields:** weddingId:ObjectId; taskId:ObjectId; authorId:ObjectId; body:string; createdAt; editedAt?; editReason?

**Indexes / constraints:** weddingId+taskId+createdAt; comments append-oriented.

### `taskActivityEvents` — Planning

**Fields:** weddingId:ObjectId; taskId:ObjectId; actorId; action; beforeSummary?; afterSummary?; occurredAt.

**Indexes / constraints:** Append-only; weddingId+taskId+occurredAt.

### `households` — Guests

**Fields:** weddingId:ObjectId; label:string; primaryContactGuestId:ObjectId?; status:ACTIVE|ARCHIVED; createdAt; updatedAt; version:int.

**Indexes / constraints:** weddingId+status; primary contact must be active guest in same household.

### `guests` — Guests

**Fields:** weddingId:ObjectId; householdId:ObjectId?; fullName:string; phoneNormalized:string?; phoneLookupHmac:string?; emailNormalized:string?; status:ACTIVE|ARCHIVED; identityVerificationState; primaryRelationshipTagId?; secondaryRelationshipTagIds:bounded array; timestamps; version:int.

**Indexes / constraints:** weddingId+householdId+status; avoid global phone uniqueness because shared numbers allowed.

### `guestRelationshipTags` — Guests

**Fields:** weddingId:ObjectId; name:string; tagType:PRIMARY|SECONDARY; isActive:boolean; createdAt; updatedAt.

**Indexes / constraints:** Unique normalised name per wedding/type if required.

### `guestCorrectionRequests` — Guests

**Fields:** weddingId:ObjectId; guestId:ObjectId; requestedChanges:bounded object; requestedBy; status:PENDING|APPROVED|REJECTED|CANCELLED; reviewedBy?; reason?; timestamps.

**Indexes / constraints:** Requester cannot approve own request.

### `guestMergeOperations` — Guests

**Fields:** weddingId:ObjectId; sourceGuestId:ObjectId; targetGuestId:ObjectId; requestedBy; approvals:[two co-owners]; status; createdAt; completedAt?; migrationSummary?

**Indexes / constraints:** Append-only operation record; preserve source guest history.

### `guestHouseholdHistory` — Guests

**Fields:** weddingId:ObjectId; guestId:ObjectId; fromHouseholdId:ObjectId?; toHouseholdId:ObjectId?; changedBy; reason; changedAt.

**Indexes / constraints:** Append-only; weddingId+guestId+changedAt.

### `rsvps` — RSVP

**Fields:** weddingId:ObjectId; functionId:ObjectId; guestId:ObjectId; response:NOT_YET_RESPONDED|ATTENDING|NOT_ATTENDING; respondedAt:Date?; source:GUEST|ORGANISED_ASSISTANCE; version:int; timestamps.

**Indexes / constraints:** Unique weddingId+functionId+guestId.

### `rsvpEvents` — RSVP

**Fields:** weddingId:ObjectId; rsvpId:ObjectId; functionId:ObjectId; guestId:ObjectId; previousResponse?; newResponse; actorId; actorType; reason?; occurredAt.

**Indexes / constraints:** Append-only; weddingId+functionId+occurredAt.

### `additionalGuestRequests` — RSVP

**Fields:** weddingId:ObjectId; functionId:ObjectId; requestingGuestId:ObjectId; requestedCount:int; approvedCount:int; status:PENDING_ARRANGEMENT|ARRANGEMENTS_CONFIRMED|CLOSED|CANCELLED; createdAt; updatedAt; version:int.

**Indexes / constraints:** weddingId+status+createdAt.

### `additionalGuestRequestEvents` — RSVP

**Fields:** weddingId:ObjectId; requestId:ObjectId; action; actorId; detailsSnapshot; occurredAt.

**Indexes / constraints:** Append-only.

### `weddingBudgets` — Finance

**Fields:** weddingId:ObjectId unique; totalBudgetPaise:int64; reservePaise:int64; currency:'INR'; version:int; updatedAt; updatedBy:ObjectId.

**Indexes / constraints:** Reserve is inside total budget; check reserve<=total.

### `budgetCategories` — Finance

**Fields:** weddingId:ObjectId; name:string; allocatedPaise:int64; committedPaise?:int64; paidPaise?:int64; sortOrder:int; status:ACTIVE|ARCHIVED; version:int.

**Indexes / constraints:** Unique active normalised category name per wedding; aggregates rebuildable.

### `budgetGovernanceRequests` — Finance

**Fields:** weddingId:ObjectId; requestType; sourceCategoryId?; targetCategoryId?; amountPaise:int64; proposalSnapshot; approvals; status; createdAt; version:int.

**Indexes / constraints:** Dual-owner approvals for allocation changes and threshold-governed reserve transfers.

### `budgetReserveAllocations` — Finance

**Fields:** weddingId:ObjectId; fromCategoryId?; toCategoryId:ObjectId?; amountPaise:int64; requestId:ObjectId; createdBy; createdAt.

**Indexes / constraints:** Append-only transfer ledger.

### `expenseEstimates` — Finance

**Fields:** weddingId:ObjectId; categoryId:ObjectId; vendorId:ObjectId?; lowPaise:int64; expectedPaise:int64; highPaise:int64; assumptions; createdBy; timestamps; version:int.

**Indexes / constraints:** Check low<=expected<=high.

### `vendorQuotes` — Finance

**Fields:** weddingId:ObjectId; vendorId:ObjectId; quoteAmountPaise:int64?; quoteLines:bounded array?; inclusions; exclusions; taxDetails; terms; validUntil:Date?; receivedAt; status:CURRENT|SUPERSEDED|WITHDRAWN.

**Indexes / constraints:** Separate from estimate and booking; used by finance/vendor workflows.

### `expenses` — Finance

**Fields:** weddingId:ObjectId; categoryId:ObjectId; vendorId:ObjectId?; title; beneficiaryMembershipId/userId; createdBy; amountPaise:int64; currency:'INR'; status enum; approvedBy?; approvedAt?; version:int; timestamps.

**Indexes / constraints:** weddingId+status+createdAt desc+_id desc; creator cannot self-approve.

### `expenseApprovalEvents` — Finance

**Fields:** weddingId:ObjectId; expenseId:ObjectId; action; actorId; reason; approvalRoute; occurredAt.

**Indexes / constraints:** Append-only.

### `expensePayments` — Finance

**Fields:** weddingId:ObjectId; expenseId:ObjectId; amountPaise:int64; currency:'INR'; paidAt:Date; recordedBy; method; reference?; evidenceObjectKey?; createdAt.

**Indexes / constraints:** weddingId+expenseId+paidAt desc; never silently edit/delete.

### `expenseAdjustments` — Finance

**Fields:** weddingId:ObjectId; expenseId:ObjectId; adjustmentType; amountPaise:int64; reason; requestedBy; approvals; status; createdAt; appliedAt?

**Indexes / constraints:** Explicit correction/reversal; approval required by policy.

### `financeAuditEvents` — Finance

**Fields:** weddingId:ObjectId; entityType; entityId:ObjectId; action; actorId; beforeSummary?; afterSummary?; reason?; occurredAt.

**Indexes / constraints:** Append-only; finance access restricted.

### `vendorReferences` — Vendors

**Fields:** provider:GOOGLE_PLACES|MANUAL; providerPlaceId:string?; displayName; category; locationSummary; sourceMetadata; timestamps.

**Indexes / constraints:** Provider reference/catalogue data; not a wedding booking.

### `weddingVendors` — Vendors

**Fields:** weddingId:ObjectId; vendorReferenceId:ObjectId?; displayNameSnapshot; categoryId:ObjectId; source:PROVIDER|MANUAL; status:ACTIVE|ARCHIVED; createdBy; timestamps; version:int.

**Indexes / constraints:** weddingId+categoryId+status.

### `vendorCategories` — Vendors

**Fields:** weddingId:ObjectId; name; allowsMultipleSelections:boolean; createdAt; updatedAt.

**Indexes / constraints:** Unique normalised category name per wedding.

### `vendorServices` — Vendors

**Fields:** weddingId:ObjectId; vendorId:ObjectId; serviceName; functionId:ObjectId?; status:ACTIVE|ARCHIVED; createdAt; updatedAt.

**Indexes / constraints:** weddingId+vendorId+status.

### `vendorEnquiries` — Vendors

**Fields:** weddingId:ObjectId; vendorId:ObjectId; status:NOT_CONTACTED|CONTACTED|RESPONSE_RECEIVED|NEGOTIATING|SELECTED|REJECTED; managedBy; notes; timestamps; version:int.

**Indexes / constraints:** weddingId+vendorId+status.

### `vendorEstimates` — Vendors

**Fields:** weddingId:ObjectId; vendorId:ObjectId; low/expected/high Paise; assumptions; createdAt; updatedAt.

**Indexes / constraints:** Validate ordered estimate range.

### `vendorAvailabilityChecks` — Vendors

**Fields:** weddingId:ObjectId; vendorId:ObjectId; functionId/date; state:NOT_CHECKED|AVAILABLE_CONFIRMED|UNAVAILABLE_CONFIRMED|TENTATIVE|UNKNOWN; checkedBy; checkedAt; notes.

**Indexes / constraints:** Never infer availability from missing record.

### `vendorSelections` — Vendors

**Fields:** weddingId:ObjectId; categoryId:ObjectId; vendorId:ObjectId; selectedBy; selectedAt; status:SELECTED|REMOVED; version:int.

**Indexes / constraints:** Partial unique active category selection unless category allows multiple.

### `vendorBookingRecords` — Vendors

**Fields:** weddingId:ObjectId; vendorId:ObjectId; bookingState:NOT_BOOKED|BOOKING_PENDING|BOOKED|CONTRACTED|CANCELLED; contractReference?; bookingDate?; updatedBy; version:int.

**Indexes / constraints:** Selection/quote does not imply booked.

### `vendorActivityEvents` — Vendors

**Fields:** weddingId:ObjectId; vendorId:ObjectId; action; actorId; detailsSnapshot; occurredAt.

**Indexes / constraints:** Append-only.

### `shagunSettings` — Shagun

**Fields:** weddingId:ObjectId unique; providerId; destinationReferenceEncrypted; destinationDisplayMasked; status:INACTIVE|PENDING_APPROVAL|ACTIVE|SUSPENDED; version:int; updatedAt.

**Indexes / constraints:** Exactly one destination per wedding.

### `shagunConfigurationRequests` — Shagun

**Fields:** weddingId:ObjectId; proposedDestinationEncrypted; proposedMaskedValue; approvals:[two co-owners]; status; createdBy; createdAt.

**Indexes / constraints:** Dual approval for activation and every destination change.

### `shagunPaymentIntents` — Shagun

**Fields:** weddingId:ObjectId; guestId:ObjectId; providerId; providerIntentId; amountPaise:int64; currency:'INR'; status; idempotencyKey; timestamps; version:int.

**Indexes / constraints:** Unique providerId+providerIntentId; provider amount limits apply.

### `shagunContributions` — Shagun

**Fields:** weddingId:ObjectId; guestId:ObjectId; paymentIntentId:ObjectId; providerPaymentId; amountPaise:int64; currency:'INR'; verifiedAt; status:VERIFIED|REVERSED|DISPUTED; createdAt.

**Indexes / constraints:** Only provider-verified events create verified contribution.

### `shagunProviderEvents` — Shagun

**Fields:** providerId; providerEventId; weddingId:ObjectId; payloadHash; receivedAt; processingStatus; processedAt?; payloadRedacted?

**Indexes / constraints:** Unique providerId+providerEventId; do not store sensitive credentials.

### `shagunReconciliationEvents` — Shagun

**Fields:** weddingId:ObjectId; contributionId/paymentIntentId; action; actorId; providerStatus; notes; occurredAt.

**Indexes / constraints:** Append-only; manual note/check does not mark success.

### `shagunAcknowledgements` — Shagun

**Fields:** weddingId:ObjectId; contributionId:ObjectId; guestId:ObjectId; issuedAt; acknowledgementType.

**Indexes / constraints:** Unique contribution+acknowledgementType.

### `shagunAuditEvents` — Shagun

**Fields:** weddingId:ObjectId; action; actorId; entityId:ObjectId; detailsSummary; occurredAt.

**Indexes / constraints:** Append-only.

### `photoAlbums` — Photos

**Fields:** weddingId:ObjectId; functionId:ObjectId; title; createdAt; version:int.

**Indexes / constraints:** Unique weddingId+functionId; one auto-created album per function.

### `weddingPhotos` — Photos

**Fields:** weddingId:ObjectId; albumId:ObjectId; functionId:ObjectId; uploaderType; uploaderId; objectKey; derivativeKeys; mimeType; byteSize:int; width:int; height:int; checksum; moderationStatus; exifStripped:boolean; timestamps; version:int.

**Indexes / constraints:** Private R2 keys only; never store public permanent URL.

### `photoReports` — Photos

**Fields:** weddingId:ObjectId; photoId:ObjectId; reportedBy; reason; status:OPEN|REVIEWED|DISMISSED; createdAt; reviewedAt?

**Indexes / constraints:** weddingId+photoId+status.

### `photoRemovalRequests` — Photos

**Fields:** weddingId:ObjectId; photoId:ObjectId; requestedBy; reason; status:PENDING|APPROVED|REJECTED; reviewedBy?; timestamps.

**Indexes / constraints:** Co-owners decide guest removal requests.

### `photoAuditEvents` — Photos

**Fields:** weddingId:ObjectId; photoId:ObjectId; actorId; action; reason?; occurredAt.

**Indexes / constraints:** Append-only.

### `notifications` — Notifications

**Fields:** weddingId:ObjectId; recipientMembershipId/userId; category; severity:CRITICAL|HIGH|MEDIUM|INFORMATIONAL; title; bodySummary; deepLink; readAt?; createdAt; dedupeKey.

**Indexes / constraints:** Index recipient+readAt+createdAt; re-authorise deep links.

### `notificationPreferences` — Notifications

**Fields:** weddingId:ObjectId; recipientMembershipId:ObjectId; categoryPreferences; updatedAt; version:int.

**Indexes / constraints:** Unique weddingId+recipientMembershipId.

### `dashboardSnapshots (optional)` — Notifications

**Fields:** weddingId:ObjectId; dashboardType; metrics; generatedAt; sourceWatermark; expiresAt?

**Indexes / constraints:** Rebuildable cache only; never authoritative finance source.

### `auditEvents` — Audit/lifecycle

**Fields:** weddingId:ObjectId; actorId; actorType; action; entityType; entityId; requestId; reason?; beforeSummary?; afterSummary?; occurredAt.

**Indexes / constraints:** Append-only application policy; record sensitive reads/exports.

### `securityIncidents` — Audit/lifecycle

**Fields:** weddingId:ObjectId; severity:SEV_1..SEV_4; status:DETECTED|TRIAGED|CONTAINMENT|INVESTIGATION|RESOLUTION|CLOSED; summary; openedBy; assignedTo?; timestamps; version:int.

**Indexes / constraints:** weddingId+status+severity.

### `dataAccessRequests` — Audit/lifecycle

**Fields:** weddingId:ObjectId; requesterId; requestType; status; reviewedBy?; createdAt; resolvedAt?

**Indexes / constraints:** Restricted; audited.

### `dataCorrectionRequests` — Audit/lifecycle

**Fields:** weddingId:ObjectId; requesterId; targetEntityType; targetEntityId; proposedChanges; status; reviewedBy?; timestamps.

**Indexes / constraints:** Restricted; reviewed workflow.

### `weddingLifecycleEvents` — Audit/lifecycle

**Fields:** weddingId:ObjectId; eventType; actorId/system; eventSnapshot; occurredAt.

**Indexes / constraints:** Append-only.

### `weddingDeletions` — Audit/lifecycle

**Fields:** weddingId:ObjectId unique; status:QUEUED|IN_PROGRESS|RETRY_PENDING|BLOCKED|COMPLETED|FAILED_REQUIRES_REVIEW; stepStates; requestedAt; dueAt; completedAt?; retryCount; version:int.

**Indexes / constraints:** Idempotent step tracking; no TTL.

### `weddingDeletionTombstones` — Audit/lifecycle

**Fields:** weddingId:ObjectId unique; deletedAt; deletionJobId; restoreProtectionState.

**Indexes / constraints:** Retain outside ordinary tenant deletion sweep; replay after backup restore.

### `weddingExportRequests` — Audit/lifecycle

**Fields:** weddingId:ObjectId; requestedBy; status:PENDING|GENERATING|READY|EXPIRED|FAILED; objectKey?; expiresAt?; createdAt.

**Indexes / constraints:** Export access restricted; short-lived download URLs.

### `cancellationNoticeRecords` — Audit/lifecycle

**Fields:** weddingId:ObjectId; noticeStartedAt; noticeEndsAt; status:ACTIVE|COMPLETED; createdAt.

**Indexes / constraints:** One active cancellation notice per workspace.

### `supportRecoveryCases` — Platform

**Fields:** weddingId:ObjectId?; requesterIdentity; caseType; evidenceReferences; status; assignedSupportActor; approvalTrail; timestamps.

**Indexes / constraints:** Platform-level restricted access; all access audited.

### `outboxEvents` — Infrastructure

**Fields:** eventId unique; weddingId?; aggregateType; aggregateId; eventType; payloadVersion; payload; status:PENDING|PROCESSING|PUBLISHED|FAILED; occurredAt; publishedAt?; attemptCount; nextAttemptAt.

**Indexes / constraints:** Created in same transaction as business mutation.

### `inboxEvents` — Infrastructure

**Fields:** consumerName; source; externalEventId; payloadHash; receivedAt; processedAt?; status.

**Indexes / constraints:** Unique consumerName+externalEventId.

### `idempotencyRecords` — Infrastructure

**Fields:** scope; actorId; idempotencyKey; requestHash; status:IN_PROGRESS|COMPLETED|FAILED; responseStatus?; responseReference?; createdAt; expiresAt?

**Indexes / constraints:** Unique scope+actorId+idempotencyKey; financial retention not short TTL.

### `migrationHistory` — Infrastructure

**Fields:** migrationId unique; checksum; status:STARTED|COMPLETED|FAILED; startedAt; completedAt?; executedBy; errorSummary?

**Indexes / constraints:** Run by controlled migration job, not every API instance.

## Critical global indexes and query conventions
- `users`: unique `emailNormalized`.
- `weddingMemberships`: partial unique `userId` for statuses `ACTIVE` and `SUSPENDED`; verify partial-filter support and deployment behaviour.
- `rsvps`: unique `(weddingId, functionId, guestId)`.
- `invitations`: unique `tokenHash`.
- `shagunProviderEvents`: unique `(providerId, providerEventId)`.
- `outboxEvents`: unique stable `eventId`.
- `idempotencyRecords`: unique `(scope, actorId, idempotencyKey)`.
- Tenant compound indexes should lead with `weddingId` where it matches the query. Avoid redundant indexes.

## TTL policy
- TTL: email verification tokens, password reset tokens, persisted OTP challenges, safe temporary upload reservations.
- No TTL: invitations, audit, payment, RSVP history, expense history, deletion records.
- TTL is asynchronous physical cleanup; enforce expiry in application logic.

## Transaction boundaries
- Workspace creation + first membership + audit/outbox.
- Invitation acceptance + membership transition + invitation status + audit/outbox.
- Governance approval and function publication.
- RSVP change + RSVP event + outbox where needed.
- Expense approval + approval event + outbox.
- Payment webhook deduplication + contribution state + outbox.
- Photo moderation + audit/outbox.
- Deletion uses idempotent retryable steps, not one long transaction.

## Production verification gates
- Atlas tier/region, transactions, backup and point-in-time restore capability.
- Applicable privacy and financial-record retention requirements.
- Field encryption key management and rotation.
- UPI provider webhook, reconciliation, settlement and reversal behaviour.
- R2 residency commitments; do not claim India-only residency without contractual proof.
- Final DTO enums, bounds, validators and Mongoose schema implementations must be tested in code.