# Product requirements document discussion
_Exported on 4/8/2026 at 12:00:25 EDT from Cursor (3.0.13)_

---

**User**

 @write-a-prd

---

**Cursor**

Interpreting this as a request to run the `write-a-prd` skill. I’ll load that skill now and follow its workflow step by step.

Great, let’s run the PRD workflow.

Start with a **detailed dump** so I can shape this into a strong PRD:

1. What problem are you trying to solve? (current pain, who feels it, how often)
2. What outcome do you want? (ideal user experience)
3. Who are the actors/users? (end users, admins, internal ops, etc.)
4. Any solution ideas you already have?
5. Constraints: deadlines, tech constraints, cost limits, privacy/security concerns?
6. What should explicitly be out of scope?
7. How will you know this succeeded? (metrics or acceptance criteria)

If helpful, write it in freeform and messy—I’ll structure it.

---

**User**

PROBLEM:
Students and professionals waste hours watching YouTube videos (10-60 minutes each) to find key information. A 20-minute tutorial might have only 2 minutes of valuable content. This happens daily - multiple times per day for heavy learners.

OUTCOME:
User pastes YouTube URL → within 10 seconds receives:
- 5-7 bullet point summary (150-200 words)
- Sentiment analysis (positive/negative/neutral/mixed with confidence)
- 3 key takeaways
Cached results return instantly (<1 second). Long videos (>15 min) return job ID and process async.

ACTORS:
- End users: Anyone with a YouTube URL (no login required)
- No admins or internal ops for MVP

SOLUTION IDEAS:
- Express.js backend on Vercel
- youtube-transcript-api for captions
- Groq (Llama 3) for LLM (free tier)
- Upstash Redis + QStash for async queue and KV storage
- Simple HTML/CSS frontend
- Hybrid sync/async: <15 min = sync, >15 min = async with polling

CONSTRAINTS:
- MUST use free tier only (Vercel, Groq, Upstash)
- Vercel serverless functions have 10-second hard timeout
- Groq free tier: 30 req/min, ~14,000 req/day
- No database - use KV only
- No Python in request path (only Node)
- 2-week deadline for assignment
- Must deploy publicly on Vercel

OUT OF SCOPE (explicitly NOT in MVP):
- User accounts / authentication
- Video downloading
- Batch processing multiple URLs
- Browser extension
- Mobile app
- YouTube API authentication
- Database (PostgreSQL, MongoDB, etc.)
- Custom model fine-tuning
- Multi-language support (English only)

SUCCESS METRICS:
1. 90% of sync requests complete in <10 seconds
2. 80% user satisfaction (implicit: user doesn't immediately close page)
3. System handles 100 requests/day within free limits
4. Cache hit rate >50% after first week
5. No failed jobs due to timeout (async prevents this)
6. Passes all tests (unit + E2E with Playwright)

ADDITIONAL CONTEXT:
We already completed grill-me with 14 questions. The shared architecture decisions are:

| Area | Decision |
|------|----------|
| SLA | Hybrid: sync ≤15 min (target <10s); async + polling otherwise; cached instant |
| Async execution | QStash queued chunk chain; client polls job |
| KV model | result:{videoId}:en (24h), job:{jobId} (2h), canonical:{videoId}:en |
| Caps | Max 10 chunks or 30 min wall time → fail, delete canonical |
| Transcripts | Node youtube-transcript-api; fail closed if no captions |
| Storage | Transcript shards tx:{jobId}:chunk_{i} (2h); delete on completion |
| LLM | Map: per-chunk JSON; Reduce: one schema pass; JSON mode |
| Resilience | Zod validate; 1 retry + 1 repair; safe user errors |
| Security | QStash signature verify on workers; Turnstile on submit |
| Abuse | Per-IP 10/h; global fuse (100/day); canonical coalescing |
| CI | GitHub Actions for lint/typecheck/tests/smoke only |

Now please generate the complete PRD with all standard sections.

---

**Cursor**

## Problem Statement

Students and professionals who rely on YouTube for learning spend disproportionate time extracting useful information from long videos. Many videos (10-60 minutes) contain only a small amount of actionable content, forcing users to watch or scrub manually to find value. This friction occurs repeatedly throughout the day for heavy learners and creates avoidable time loss, cognitive overload, and reduced learning efficiency.

The product must turn a YouTube URL into reliable, high-signal insight quickly, while staying within strict free-tier infrastructure limits and serverless execution constraints.

## Solution

Build a public, no-login web app where a user pastes a YouTube URL and receives a concise analysis of the video:

- For videos up to 15 minutes: process synchronously and return in under 10 seconds (target SLA).
- For videos over 15 minutes (or when processing risk exceeds sync budget): enqueue async processing, return a job ID, and provide polling until completion.
- Return payload includes:
  - 5-7 bullet summary (150-200 words total)
  - Sentiment classification (`positive`, `negative`, `neutral`, `mixed`) with confidence
  - 3 key takeaways
- Cache completed results for fast repeat access (target <1 second).
- Use transcript-only processing (no video download), English captions only.
- Fail closed when captions are unavailable.

Architecture is optimized for free-tier operation on Vercel + Groq + Upstash (Redis/QStash), with abuse controls and strict caps to avoid timeouts and runaway cost.

## User Stories

1. As a learner, I want to paste a YouTube URL and get a summary fast, so that I can decide quickly whether the video is worth full viewing.  
2. As a student, I want key points in bullets, so that I can scan and retain content faster than watching end-to-end.  
3. As a professional, I want sentiment and confidence, so that I can gauge the speaker’s stance at a glance.  
4. As a user, I want exactly three actionable takeaways, so that I can immediately apply what I learned.  
5. As a user in a hurry, I want short videos processed in one request, so that I get value without waiting on background jobs.  
6. As a user submitting long videos, I want a job ID and progress polling, so that I can continue without timeout errors.  
7. As a returning user, I want repeated URL requests to return instantly from cache, so that I avoid waiting for reprocessing.  
8. As a user, I want clear errors when captions are missing, so that I understand why a summary cannot be generated.  
9. As a user, I want validation errors for invalid URLs, so that I can fix input quickly.  
10. As a user, I want a predictable output format every time, so that I can trust and reuse results.  
11. As a user, I want the system to avoid partial or broken outputs, so that I do not rely on malformed analysis.  
12. As a user, I want large jobs bounded safely, so that the system stays responsive for everyone.  
13. As an anonymous user, I want to use the app without creating an account, so that onboarding is frictionless.  
14. As a privacy-conscious user, I want no account/profile storage, so that personal data footprint stays minimal.  
15. As a user on slow networks, I want polling endpoints to be lightweight, so that status checks remain fast.  
16. As a user, I want human-readable failure messages, so that I know whether to retry or try another video.  
17. As a user, I want consistent behavior for the same video URL variants, so that duplicate links do not create duplicate work.  
18. As a user, I want duplicate simultaneous submissions coalesced, so that queueing remains efficient and results arrive sooner.  
19. As a user, I want the service available publicly on the web, so that I can use it from any device browser.  
20. As a platform maintainer, I want per-IP rate limits, so that abusive traffic does not exhaust free-tier quotas.  
21. As a platform maintainer, I want a global daily request fuse, so that usage cannot exceed free-tier limits.  
22. As a platform maintainer, I want robust schema validation around model outputs, so that malformed JSON does not break responses.  
23. As a platform maintainer, I want retry and repair behavior for model errors, so that transient issues do not cause unnecessary failures.  
24. As a platform maintainer, I want signature verification on worker callbacks, so that only trusted queue events are processed.  
25. As a platform maintainer, I want transcript shards removed after completion, so that KV storage is not wasted.  
26. As a platform maintainer, I want explicit TTLs for job/result data, so that cache behavior is predictable and bounded.  
27. As an evaluator (assignment context), I want measurable SLA and reliability targets, so that project success is objectively testable.  
28. As a developer, I want CI gates for lint/typecheck/tests/smoke, so that regressions are caught before deployment.  
29. As a QA reviewer, I want unit and E2E coverage, so that critical flows are validated end-to-end.  
30. As a user, I want English-only scope to be clearly communicated, so that unsupported language expectations are avoided.

## Implementation Decisions

- **Product flow and SLA**
  - Hybrid processing strategy: sync for videos <=15 minutes (target <10s), async queue with polling for longer videos.
  - Cache-first behavior: completed results are served immediately when available.
  - Deterministic output contract: summary bullets, sentiment+confidence, and three takeaways.

- **Transcript ingestion**
  - Use Node-based transcript retrieval only.
  - If no captions/transcript are available, return a safe, explicit user-facing failure (fail closed).
  - No Python in request path.

- **Async orchestration**
  - Queue-driven background processing for long-running jobs.
  - Job lifecycle tracked in KV with short-lived status records.
  - Client polls job endpoint until terminal status.

- **Chunking and execution caps**
  - Process transcript in bounded chunks with map-reduce summarization.
  - Hard safety limits: maximum 10 chunks or 30-minute wall time.
  - If caps are exceeded, fail safely and remove in-flight canonical markers.

- **LLM contract and resilience**
  - Per-chunk map outputs required in structured JSON.
  - Single reduce pass to produce final schema-compliant response.
  - Validate all model outputs with schema checks.
  - Recovery policy: one retry and one repair attempt before terminal failure.

- **KV and cache model**
  - Canonical keying to coalesce equivalent requests for the same video/language.
  - Result cache with ~24h TTL.
  - Job status cache with shorter TTL (~2h).
  - Temporary transcript shard keys with short TTL and cleanup after completion.

- **Security and abuse prevention**
  - Verify queue callback signatures before worker execution.
  - Bot protection on submission endpoint.
  - Per-IP hourly cap and global daily fuse to stay inside free-tier quotas.
  - Safe user-visible error messages; no sensitive internal leakage.

- **Deployment and platform constraints**
  - Public deployment on Vercel.
  - Design honors serverless execution limits, especially 10-second timeout constraints.
  - Free-tier-only dependencies and operational envelope.

- **Operational goals**
  - Support at least 100 requests/day within quota boundaries.
  - Maintain stable behavior under duplicate submissions and bursts through coalescing and limits.

## Testing Decisions

- **What good tests validate**
  - External behavior, contracts, and user-visible outcomes, not implementation internals.
  - Deterministic API responses for valid/invalid inputs.
  - SLA-oriented behavior boundaries (sync vs async routing, timeout avoidance, cache speedup).

- **Modules/behaviors to test**
  - URL validation and request classification (sync vs async threshold).
  - Transcript retrieval outcomes (success, missing captions, provider errors).
  - Chunking logic and cap enforcement (max chunks, wall-time cutoff).
  - Map/reduce orchestration and schema validation.
  - Retry/repair pathways and terminal error mapping.
  - KV key lifecycle (result/job/canonical/transcript shard creation, TTL, cleanup).
  - Async job polling state machine (queued, processing, completed, failed).
  - Rate limiting and daily fuse behavior.
  - Signature verification and bot-protection gate checks.
  - Cache hit/miss behavior and latency expectations.

- **Test pyramid**
  - Unit tests for pure logic and policy boundaries (parsing, chunking, schemas, limiters, state transitions).
  - Integration tests for provider adapters and queue/KV interactions with test doubles or controlled fixtures.
  - E2E tests (Playwright) for full user flow:
    - short video sync success
    - long video async submission + polling completion
    - cached replay fast path
    - no-caption error path
    - invalid URL path

- **Quality gates**
  - CI executes lint, typecheck, tests, and smoke checks on every change.
  - Release confidence requires passing unit + E2E suite and no known timeout regressions.

## Out of Scope

- User authentication, accounts, profiles, or saved history.
- Video downloading, media transformation, or direct video processing.
- Batch/multi-URL submission in one request.
- Browser extension or native mobile app.
- YouTube API OAuth/authenticated user data access.
- Relational or document databases (PostgreSQL, MongoDB, etc.).
- Custom model training/fine-tuning.
- Multi-language transcript support (English only for MVP).
- Advanced analytics dashboards or admin console.

## Further Notes

- This MVP is intentionally constrained to maximize reliability within free-tier quotas and assignment timeline (2 weeks).
- Primary product risk is variable third-party latency and transcript availability; architecture mitigates this with hybrid sync/async routing, strict caps, and clear failures.
- Success metrics for acceptance:
  - 90% of sync requests complete <10 seconds
  - cache hit rate >50% after first week
  - no timeout-driven failed jobs for long videos
  - supports ~100 requests/day within quota
  - user flow validated by passing unit and Playwright E2E tests

If you want, I can convert this directly into a GitHub issue body format (`## Summary`, `## Acceptance Criteria`, `## Risks`) and post-ready text next.

