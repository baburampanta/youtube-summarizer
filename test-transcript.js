// test-transcript.js
const { YoutubeTranscript } = require('youtube-transcript-api');

async function test() {
  try {
    const videoId = 'dQw4w9WgXcQ';
    console.log('Fetching transcript for video:', videoId);
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    console.log('✅ Success!');
    console.log('Number of items:', transcript.length);
    
    const fullText = transcript.map(item => item.text).join(' ');
    console.log('Transcript length:', fullText.length);
    console.log('Preview:', fullText.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error(error);
  }
}

test();