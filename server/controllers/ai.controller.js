// controllers/ai.controller.js — AI feature HTTP handlers
//
// ─── WHY SERVER-SENT EVENTS (SSE) FOR STREAMING? ────────────────────────
// SSE is a one-way HTTP connection that stays open and pushes data
// in real time. It's perfect for AI text streaming because:
//
//   ✅ Works over standard HTTP/1.1 — no WebSocket upgrade needed
//   ✅ Automatically reconnects on network blip
//   ✅ Simpler than WebSockets for unidirectional server→client data
//   ✅ Natively supported by browser's EventSource API
//   ✅ Works through most proxies, CDNs, and firewalls
//
// SSE message format (what we write to res):
//   data: {"token":"Hello"}\n\n    ← each chunk
//   data: {"done":true}\n\n        ← end signal
//   data: {"error":"..."}\n\n      ← error signal
//
// The \n\n (double newline) after each message is the SSE protocol
// separator — the browser uses it to know where one message ends.

import {
  streamRecipeStory,
  getIngredientSubstitutions,
  streamCookingAssistant,
  generateStoryPrompts,
} from '../services/groq.service.js';
import Recipe from '../models/Recipe.js';

// ─────────────────────────────────────────────────────────────────
// HELPER — setSSEHeaders
// Configures the HTTP response for Server-Sent Events.
// Must be called BEFORE writing any data.
// ─────────────────────────────────────────────────────────────────
const setSSEHeaders = (res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disables Nginx buffering on Render
  res.flushHeaders(); // Sends headers immediately — opens the SSE stream
};

// ─────────────────────────────────────────────────────────────────
// HELPER — writeSSE
// Writes a single SSE message to the response stream.
// ─────────────────────────────────────────────────────────────────
const writeSSE = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/story/stream
// @access  Protected
// Streams an AI-generated recipe story token by token via SSE.
// The frontend renders each token as it arrives — feels instant.
// ─────────────────────────────────────────────────────────────────
export const streamStory = async (req, res) => {
  const { title, ingredients, culturalOrigin, mood, dedication, recipeId } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Recipe title is required to generate a story.',
    });
  }

  // Set SSE headers — after this point, we can only write to the stream.
  // We cannot send a normal JSON error response anymore.
  setSSEHeaders(res);

  try {
    const stream = await streamRecipeStory({
      title,
      ingredients: ingredients || [],
      culturalOrigin,
      mood,
      dedication,
    });

    let fullStory = ''; // Accumulate the complete story for post-stream processing

    // Iterate over each chunk Groq sends
    // The `for await...of` loop handles backpressure automatically —
    // it only requests the next chunk when the previous one is processed.
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';

      if (token) {
        fullStory += token;
        writeSSE(res, { token });
      }
    }

    // Optionally save the story back to the recipe document
    // Only if recipeId is provided and the requesting user is the author
    if (recipeId && fullStory) {
      try {
        const recipe = await Recipe.findById(recipeId);
        if (recipe && recipe.author.toString() === req.user._id.toString()) {
          recipe.emotionalContext.story       = fullStory;
          recipe.emotionalContext.isAIGenerated = true;
          recipe.aiGeneratedStory             = true;
          await recipe.save();
        }
      } catch (saveError) {
        // Don't fail the stream if the save fails — the user still got their story
        console.error('Failed to save AI story to recipe:', saveError.message);
      }
    }

    // Send the completion signal with the full accumulated story
    writeSSE(res, { done: true, fullStory });
    res.end();

  } catch (error) {
    console.error('streamStory error:', error.message);
    // Even in error, we must use SSE format — headers are already sent
    writeSSE(res, { error: 'Failed to generate story. Please try again.' });
    res.end();
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/substitutions
// @access  Protected
// Returns structured ingredient substitutions for a dietary restriction.
// Not streamed — response is fast enough without it.
// ─────────────────────────────────────────────────────────────────
export const getSubstitutions = async (req, res) => {
  const { ingredients, restriction, recipeId } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'An ingredients array is required.',
    });
  }

  if (!restriction) {
    return res.status(400).json({
      success: false,
      message: 'A dietary restriction is required (e.g. "vegan", "gluten-free").',
    });
  }

  try {
    // Check the recipe's aiSubstitutionCache first.
    // If we already generated substitutions for this restriction,
    // return the cached result immediately — no Groq API call needed.
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId).select('aiSubstitutionCache');
      if (recipe?.aiSubstitutionCache?.get(restriction)) {
        const cached = JSON.parse(recipe.aiSubstitutionCache.get(restriction));
        return res.status(200).json({
          success:  true,
          cached:   true, // Frontend can show "Cached result" badge
          data:     cached,
        });
      }
    }

    // No cache hit — call Groq
    const result = await getIngredientSubstitutions(ingredients, restriction);

    // Cache the result on the recipe document for future requests
    if (recipeId) {
      await Recipe.findByIdAndUpdate(recipeId, {
        $set: { [`aiSubstitutionCache.${restriction}`]: JSON.stringify(result) },
      });
    }

    return res.status(200).json({
      success: true,
      cached:  false,
      data:    result,
    });

  } catch (error) {
    console.error('getSubstitutions error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate substitutions. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/assistant/stream
// @access  Protected
// Streams a cooking assistant response for the interactive chat.
// The request body carries the full conversation history so the
// AI has context of the entire cooking session.
// ─────────────────────────────────────────────────────────────────
export const streamAssistant = async (req, res) => {
  const { conversationHistory, recipeContext } = req.body;

  if (!conversationHistory || !Array.isArray(conversationHistory)) {
    return res.status(400).json({
      success: false,
      message: 'conversationHistory array is required.',
    });
  }

  if (!recipeContext) {
    return res.status(400).json({
      success: false,
      message: 'recipeContext object is required.',
    });
  }

  // Limit conversation history to the last 20 messages.
  // Groq's context window is large, but sending 200 messages wastes tokens.
  // 20 messages covers any realistic cooking session.
  const trimmedHistory = conversationHistory.slice(-20);

  setSSEHeaders(res);

  try {
    const stream = await streamCookingAssistant(trimmedHistory, recipeContext);

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        writeSSE(res, { token });
      }
    }

    writeSSE(res, { done: true });
    res.end();

  } catch (error) {
    console.error('streamAssistant error:', error.message);
    writeSSE(res, { error: 'Assistant is unavailable right now. Please try again.' });
    res.end();
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/story/prompts
// @access  Protected
// Returns 3 story-starter prompts to inspire writers.
// Fast, not streamed.
// ─────────────────────────────────────────────────────────────────
export const getStoryPrompts = async (req, res) => {
  const { title, culturalOrigin, mood, dedication } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Recipe title is required.',
    });
  }

  try {
    const result = await generateStoryPrompts({ title, culturalOrigin, mood, dedication });

    return res.status(200).json({
      success: true,
      data:    result,
    });

  } catch (error) {
    console.error('getStoryPrompts error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate prompts. Please try again.',
    });
  }
};