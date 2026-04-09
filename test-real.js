const { YoutubeTranscript } = require('youtube-transcript-api');

async function test() {
  try {
    console.log('Testing YouTube Transcript API...');
    const transcript = await YoutubeTranscript.fetchTranscript('8jPQjjsBbIc');
    console.log('✅ SUCCESS!');
    console.log('Number of items:', transcript.length);
    console.log('First 200 chars:', transcript[0].text.substring(0, 200));
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Error details:', error);
  }
}

test();