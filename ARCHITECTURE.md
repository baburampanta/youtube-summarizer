\# Architecture Documentation - YouTube Summarizer



\## Assignment 6: Evaluate, Defend, and Improve



\---



\## 1. Architecture Classification



\*\*Classification: Prompt-first / long-context\*\*



\### Why?

My system takes a YouTube URL, fetches the transcript, and places the \*\*entire transcript directly into the LLM context window\*\* without any retrieval mechanism.



\### What my app does

\- User pastes YouTube URL

\- System extracts video ID

\- Fetches transcript (mock for MVP, real API in production)

\- Sends full transcript to Groq Llama 3.3 model

\- Returns: 5-7 bullet summary, sentiment analysis, 3 key takeaways



\### User tasks supported

1\. Get quick summary of any YouTube video with captions

2\. Understand video sentiment without watching

3\. Extract actionable insights from educational/business content

4\. Decide whether to watch full video based on summary



\### Out of scope (explicit)

\- User accounts / authentication

\- Video downloading

\- Batch processing multiple URLs

\- Browser extension

\- Mobile app

\- Multi-language support (English only for MVP)



\---



\## 2. Architecture Tradeoffs Analysis



| Aspect | My Choice | Why | Alternative |

|--------|-----------|-----|-------------|

| \*\*Data amount\*\* | Full transcript in context | Videos under 20 min fit in 8K chars | Chunking + RAG |

| \*\*Context limits\*\* | Llama 3.3 (128K context) | Plenty for transcripts | Smaller models |

| \*\*Retrieval\*\* | None (prompt-first) | No need for short videos | RAG with vector DB |

| \*\*Determinism\*\* | High | Same transcript = similar summary | Tool calling adds variability |

| \*\*Cost\*\* | Low (\~$0.001 per video) | One API call per video | RAG = embedding + generation |

| \*\*Overhead\*\* | Minimal | No vector DB, no embeddings | RAG needs infrastructure |

| \*\*Performance\*\* | <10 sec for sync | Fast enough for MVP | Async adds latency |

| \*\*Debugging\*\* | Easy | One prompt, one response | Multi-step harder to debug |



\---



\## 3. Main Alternative I Rejected: RAG (Retrieval-Augmented Generation)



\### Why I didn't choose RAG:



| Problem | RAG would solve | But adds complexity |

|---------|-----------------|---------------------|

| Long videos (>20 min) | Chunking + retrieval | Vector DB, embeddings API |

| Better recall | Semantic search | Chunking strategy tuning |

| Scale to many videos | Store embeddings | Infrastructure cost |



\### Specific reasons for rejection in MVP:

1\. \*\*Not needed\*\*: Most user videos under 20 minutes

2\. \*\*Cost increase\*\*: Embedding API calls + storage

3\. \*\*Latency increase\*\*: Retrieval + generation slower

4\. \*\*Debugging complexity\*\*: Harder to know why chunks were retrieved

5\. \*\*Overhead\*\*: Need vector database (Pinecone, Weaviate, or pgvector)



\### When I would adopt RAG:

\- Adding support for 1-hour+ videos

\- User requests to search across their video library

\- Need for higher recall on specific topics

\- Budget allows for vector DB hosting



\---



\## 4. Capability I Did NOT Implement: Tool Calling / Function Calling



\### What it would do

Allow the LLM to call external functions like:

\- `getVideoMetadata(videoId)` - get title, duration, upload date

\- `searchRelatedVideos(topic)` - find similar content

\- `fetchTranscriptChunk(videoId, startTime, endTime)` - get partial transcript



\### Would it improve my system?

\*\*Yes\*\*, for specific scenarios:

\- Videos longer than 20 minutes (chunked fetching)

\- Need for video metadata in summary

\- Interactive Q\&A where LLM decides what to fetch



\### What problem it would solve

Currently, I truncate transcripts at 8000 characters. Tool calling would allow:

\- Fetching transcript in chunks

\- LLM deciding which chunks are relevant

\- Handling arbitrarily long videos



\### New complexity it would introduce

| Complexity | Impact |

|------------|--------|

| Tool definitions | Need to define schemas for each function |

| State management | Track which chunks already fetched |

| Multiple API calls | 1 user request = 5-10 LLM calls |

| Error handling | Each tool can fail independently |

| Latency | Sequential calls increase response time |

| Cost | More API calls = higher cost |



\### When I would add it

\*\*Future condition:\*\* User demand for videos >30 minutes

\*\*Implementation plan:\*\*

1\. Add chunking at 2000-character intervals

2\. Define `getTranscriptChunk(videoId, chunkIndex)` tool

3\. Let LLM decide which chunks to fetch

4\. Aggregate responses for final summary



\---



\## 5. Data Flow Diagram

┌─────────────┐

│ User │

│ Pastes URL │

└──────┬──────┘

▼

┌─────────────┐ ┌─────────────┐

│ Express │────▶│ Extract │

│ Server │ │ Video ID │

└──────┬──────┘ └─────────────┘

▼

┌─────────────┐ ┌─────────────┐

│ Fetch │────▶│ Clean │

│ Transcript │ │ Transcript │

└──────┬──────┘ └─────────────┘

▼

┌─────────────┐ ┌─────────────┐

│ Groq │────▶│ Parse │

│ LLM (Llama)│ │ JSON │

└──────┬──────┘ └─────────────┘

▼

┌─────────────┐

│ Display │

│ Results │

└─────────────┘


---

## 6. Internal Information Kept for Debugging

| Artifact | Location | Purpose |
|----------|----------|---------|
| Raw transcript | Console log (not persisted) | Debug fetching issues |
| LLM prompt | `summarizer.js` line 15-35 | Verify prompt engineering |
| Model version | `summarizer.js` line 48 | Track which model used |
| Temperature | `summarizer.js` line 49 | Reproduce results |
| Response JSON | Cache (`data/curated/`) | Verify output format |
| Error logs | Console + Vercel logs | Debug failures |
| Rate limit counters | In-memory | Monitor abuse |

---

## 7. Pipeline Stages

| Stage | Input | Output | Failure Point |
|-------|-------|--------|---------------|
| 1. URL validation | YouTube URL | Video ID or error | Invalid URL format |
| 2. Rate limiting | IP address | Allow/block | Exceeded limits |
| 3. Transcript fetch | Video ID | Raw text | No captions available |
| 4. Transcript cleaning | Raw text | Cleaned text | Malformed timestamps |
| 5. LLM generation | Cleaned text | JSON response | API timeout/error |
| 6. JSON parsing | LLM response | Structured object | Malformed JSON |
| 7. UI display | Structured object | HTML | Rendering error |

---

## 8. Success Metrics from Assignment 5

| Metric | Target | Actual |
|--------|--------|--------|
| Sync response time | <10 sec | ~6-8 sec |
| Cache hit response | <1 sec | <0.5 sec |
| Summary quality | >80% | 85% (from evaluation) |
| Sentiment accuracy | >80% | 80% |
| Rate limit enforcement | 10/hour | Working |
| Error handling | Clear messages | Improved in v2 |

