// tests/unit/summarizer.test.js
const { summarizeTranscript } = require('../../src/ai/summarizer');

describe('LLM Summarizer', () => {
  test('generates summary from transcript', async () => {
    const transcript = "This is a test transcript about artificial intelligence. AI is transforming how we work. Machine learning enables computers to learn from data. Deep learning uses neural networks. These technologies are improving healthcare, finance, and transportation.";
    
    const result = await summarizeTranscript(transcript);
    
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.summary)).toBe(true);
    expect(result.summary.length).toBeGreaterThanOrEqual(3);
    expect(result.summary.length).toBeLessThanOrEqual(7);
    expect(result.sentiment).toBeDefined();
    expect(result.sentiment.label).toBeDefined();
    expect(result.takeaways).toBeDefined();
    expect(Array.isArray(result.takeaways)).toBe(true);
    expect(result.takeaways.length).toBe(3);
  }, 30000); // 30 second timeout for API call

  test('handles short transcripts', async () => {
    const transcript = "Hello world this is a very short transcript.";
    
    const result = await summarizeTranscript(transcript);
    
    expect(result).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);
  }, 30000);

  test('returns structured JSON output', async () => {
    const transcript = "Test content for structured output validation.";
    
    const result = await summarizeTranscript(transcript);
    
    expect(typeof result).toBe('object');
    expect(result.summary).toBeInstanceOf(Array);
    expect(result.sentiment).toBeInstanceOf(Object);
    expect(result.takeaways).toBeInstanceOf(Array);
  }, 30000);
});