class RateLimiter {
  constructor(maxRequests, timeWindowMs) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
    this.requests = new Map();
  }

  isAllowed(ip) {
    this._cleanup(ip);
    const requests = this.requests.get(ip) || [];
    return requests.length < this.maxRequests;
  }

  recordRequest(ip) {
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    const requests = this.requests.get(ip);
    requests.push(Date.now());
    this._cleanup(ip);
  }

  _cleanup(ip) {
    const requests = this.requests.get(ip);
    if (!requests) return;
    
    const now = Date.now();
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.timeWindowMs
    );
    
    if (validRequests.length === 0) {
      this.requests.delete(ip);
    } else {
      this.requests.set(ip, validRequests);
    }
  }
}

module.exports = { RateLimiter };