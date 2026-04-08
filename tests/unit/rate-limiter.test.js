// tests/unit/rate-limiter.test.js
const { RateLimiter } = require('../../src/etl/rate-limiter');

describe('Rate Limiter', () => {
  test('allows requests under limit', () => {
    const limiter = new RateLimiter(10, 3600000); // 10 per hour
    const ip = '127.0.0.1';
    
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed(ip)).toBe(true);
      limiter.recordRequest(ip);
    }
  });

  test('blocks requests over limit', () => {
    const limiter = new RateLimiter(2, 3600000);
    const ip = '127.0.0.1';
    
    limiter.recordRequest(ip);
    limiter.recordRequest(ip);
    expect(limiter.isAllowed(ip)).toBe(false);
  });

  test('different IPs have separate limits', () => {
    const limiter = new RateLimiter(1, 3600000);
    
    limiter.recordRequest('1.1.1.1');
    expect(limiter.isAllowed('1.1.1.1')).toBe(false);
    expect(limiter.isAllowed('2.2.2.2')).toBe(true);
  });

  test('old requests expire after time window', (done) => {
    const limiter = new RateLimiter(1, 100); // 100ms window
    const ip = '127.0.0.1';
    
    limiter.recordRequest(ip);
    expect(limiter.isAllowed(ip)).toBe(false);
    
    setTimeout(() => {
      expect(limiter.isAllowed(ip)).toBe(true);
      done();
    }, 150);
  });
});