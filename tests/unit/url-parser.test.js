// tests/unit/url-parser.test.js
const { extractVideoId, isValidYouTubeUrl } = require('../../src/etl/url-parser');

describe('YouTube URL Parser', () => {
  test('extracts video ID from standard youtube.com URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  test('extracts video ID from youtu.be short URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  test('extracts video ID from embedded URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  test('extracts video ID from URL with additional parameters', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  test('returns null for invalid YouTube URL', () => {
    const url = 'https://google.com';
    expect(extractVideoId(url)).toBeNull();
  });

  test('validates correct YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
    expect(isValidYouTubeUrl('https://youtu.be/abc123')).toBe(true);
    expect(isValidYouTubeUrl('https://google.com')).toBe(false);
    expect(isValidYouTubeUrl('not a url')).toBe(false);
  });
});