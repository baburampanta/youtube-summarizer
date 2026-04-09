const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

async function test() {
  console.log('Testing Groq API Key...');
  console.log('API Key exists?', !!process.env.GROQ_API_KEY);
  console.log('API Key starts with:', process.env.GROQ_API_KEY?.substring(0, 10));
  
  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say 'Hello from Groq!'" }],
      model: "llama-3.3-70b-versatile",
    });
    console.log('✅ SUCCESS!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Error:', error.message);
  }
}

test();