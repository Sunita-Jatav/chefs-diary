// config/groq.js — Groq SDK singleton
//
// WHY singleton pattern?
// Instantiating the Groq client once at startup and reusing it
// across all requests avoids re-initializing authentication headers
// on every API call. Same pattern we used for the MongoDB connection.

import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.warn('  ⚠️   GROQ_API_KEY is not set — AI features will not work.');
}

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groqClient;