# Product Requirements Document: YouTube TL;DW Summarizer

## Executive Summary
A web application that generates AI-powered summaries of YouTube videos. Users paste a YouTube URL and receive a bulleted summary, sentiment analysis, and key takeaways - all within seconds.

## Problem Statement
Students and professionals waste hours watching YouTube videos (10-60 minutes each) to find key information. A 20-minute tutorial might have only 2 minutes of valuable content. This happens multiple times per day for heavy learners.

## Target Users
- **Students** - Watching lecture videos, tutorials, educational content
- **Professionals** - Watching tech talks, conference videos, product reviews
- **Researchers** - Scanning multiple videos for relevant information

## Success Metrics
1. 90% of sync requests complete in <10 seconds
2. 80% user satisfaction (measured by return usage)
3. System handles 100 requests/day within free tier limits
4. Cache hit rate >50% after first week
5. Zero failed jobs due to timeout (async prevents this)

## User Stories
- As a student, I want to summarize a 1-hour lecture so I can review key points quickly
- As a professional, I want to see sentiment of a product review before watching
- As a researcher, I want to extract takeaways from multiple videos without watching each

## Functional Requirements

### Core Features
- Accept YouTube URL input from user
- Extract video ID from any YouTube URL format
- Fetch transcript using youtube-transcript-api
- Clean transcript (remove timestamps, extra whitespace)
- Generate 5-7 bullet point summary (150-200 words)
- Generate sentiment analysis (positive/negative/neutral/mixed with confidence)
- Generate 3 key takeaways
- Cache results for 24 hours
- Handle videos without captions gracefully

### API Endpoints
- `POST /api/summarize` - Submit URL, get summary (sync or async)
- `GET /api/job/:jobId` - Poll async job status
- `GET /health` - Health check

### Non-Functional Requirements
- Sync response: <10 seconds for videos under 15 min
- Async response: returns job ID within 1 second
- Cache hit response: <1 second
- Rate limiting: 10 requests per IP per hour
- Global daily limit: 100 requests

## Out of Scope (MVP)
- User accounts / authentication
- Video downloading
- Batch processing multiple URLs
- Browser extension
- Mobile app
- YouTube API authentication
- Database (PostgreSQL, MongoDB)
- Custom model fine-tuning
- Multi-language support (English only)

## Technical Architecture

### Stack
| Component | Technology | Hosting |
|-----------|------------|---------|
| Frontend | HTML/CSS/JS | Vercel |
| Backend | Express.js | Vercel Serverless |
| Queue | QStash (Upstash) | Upstash |
| KV Store | Upstash Redis | Upstash |
| LLM | Groq (Llama 3 70B) | Groq Cloud |
| Transcript | youtube-transcript-api | Node.js |
| Security | Turnstile CAPTCHA | Cloudflare |
| CI/CD | GitHub Actions | GitHub |

### Data Flow
1. User submits URL + Turnstile token
2. Rate limit check (IP + global)
3. Check cache → return if exists
4. Check canonical job → return jobId if in progress
5. Fetch transcript
6. Clean and chunk transcript
7. Map: summarize each chunk
8. Reduce: combine into final output
9. Cache result (24h TTL)
10. Return to user

### KV Key Structure
- `result:{videoId}:en` - Final summary (24h TTL)
- `job:{jobId}` - Job status, cursor, errors (2h TTL)
- `canonical:{videoId}:en` - Points to active jobId (1h TTL, refreshed)
- `tx:{jobId}:chunk_{i}` - Transcript shards (2h TTL, deleted on completion)

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Vercel 10s timeout | High | High | Hybrid sync/async; async for videos >15 min |
| No captions available | Medium | Medium | Clear error message; suggest alternative videos |
| Groq API rate limits | Medium | Medium | Aggressive caching (24h); per-IP limits |
| Long videos (>1 hour) | Medium | Low | 30 min cap; truncation warning to user |
| Abuse/spam | Medium | High | Turnstile CAPTCHA; IP rate limits; canonical coalescing |
| QStash signature spoofing | Low | High | Verify signatures on all worker endpoints |

## Implementation Phases

### Phase 1 (Week 1) - Core ETL + Cache
- Express server setup
- YouTube URL parser
- Transcript fetcher + cleaner
- KV cache implementation
- Unit tests

### Phase 2 (Week 1) - LLM Integration
- Groq API client
- Map-reduce summarization
- JSON validation with Zod
- Error handling + retries

### Phase 3 (Week 2) - Async Queue
- QStash setup
- Job queue implementation
- Polling endpoint
- Signature verification

### Phase 4 (Week 2) - Frontend + Deployment
- HTML/CSS UI
- Turnstile CAPTCHA
- Vercel deployment
- Playwright E2E tests

## Dependencies & Environment Variables

```env
GROQ_API_KEY=xxx
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
TURNSTILE_SECRET_KEY=xxx
TURNSTILE_SITE_KEY=xxx