// test-simple.js
const axios = require('axios');

async function testTranscript() {
  const videoId = 'dQw4w9WgXcQ';
  console.log('Testing transcript fetch for:', videoId);
  
  try {
    // Test with yewtu.be
    const response = await axios.get(`https://yewtu.be/api/v1/captions/${videoId}`);
    console.log('Response status:', response.status);
    console.log('Has captions:', !!response.data.captions);
    
    if (response.data.captions) {
      console.log('Available languages:', Object.keys(response.data.captions));
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testTranscript();