// src/etl/transcript-fetcher.js
// Mock transcript fetcher for MVP - returns realistic transcripts for testing

async function fetchTranscript(videoId) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock transcripts for common test videos
  const mockTranscripts = {
    'dQw4w9WgXcQ': "We're no strangers to love You know the rules and so do I A full commitment's what I'm thinking of You wouldn't get this from any other guy I just wanna tell you how I'm feeling Gotta make you understand Never gonna give you up Never gonna let you down Never gonna run around and desert you Never gonna make you cry Never gonna say goodbye Never gonna tell a lie and hurt you. We've known each other for so long Your heart's been aching but you're too shy to say it Inside we both know what's been going on We know the game and we're gonna play it And if you ask me how I'm feeling Don't tell me you're too blind to see Never gonna give you up Never gonna let you down Never gonna run around and desert you Never gonna make you cry Never gonna say goodbye Never gonna tell a lie and hurt you.",
    
    '8jPQjjsBbIc': "The way we think about work is broken. We spend most of our waking hours working, but most people are disengaged. Here's what we can do differently. First, give people autonomy. Second, help them master their craft. Third, give them purpose. These three things drive intrinsic motivation. When people have autonomy, they take ownership. When they master skills, they gain confidence. When they have purpose, they find meaning. Companies that implement these principles see higher productivity and lower turnover.",
    
    'M7lc1UVf-VE': "Artificial intelligence is transforming every industry. Machine learning algorithms can now detect diseases earlier than doctors. Self-driving cars are becoming safer every year. AI assistants help us work more efficiently. However, we must consider the ethical implications. Bias in AI systems can perpetuate discrimination. Privacy concerns arise with data collection. Job displacement is a real challenge. We need regulations that protect people while allowing innovation to flourish."
  };
  
  // Return mock transcript if available, otherwise generic
  if (mockTranscripts[videoId]) {
    return mockTranscripts[videoId];
  }
  
  // Generic mock for any video
  return `This video discusses important topics about technology and innovation. The presenter explains key concepts in an easy-to-understand way. Several practical examples are provided throughout the presentation. The main takeaways include understanding the core principles, applying them to real-world situations, and measuring the results. The conclusion emphasizes the importance of continuous learning and adaptation.`;
}

module.exports = { fetchTranscript };