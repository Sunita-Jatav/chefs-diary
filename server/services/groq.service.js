// services/groq.service.js — All Groq AI prompt engineering
//
// ─── PROMPT ENGINEERING PRINCIPLES FOR LLAMA 3 ON GROQ ──────────────────
//
// 1. SYSTEM prompt = personality, constraints, output format rules.
//    USER prompt = the actual data/request. Never mix these roles.
//
// 2. For JSON output: put the exact JSON structure as an example in the
//    SYSTEM prompt. Llama 3 mirrors structure reliably when shown an example.
//    End the system prompt with "Return ONLY valid JSON. No markdown fences,
//    no preamble." — without this, the model wraps output in ```json blocks
//    which breaks JSON.parse().
//
// 3. For streaming (story generation): use the 70B model for quality.
//    For fast utility tasks (substitutions, tips): use 8B for speed.
//    Groq's 8B inference is so fast (<100ms first token) that it feels
//    like a local function call.
//
// 4. Keep max_tokens tight. A story doesn't need 4096 tokens.
//    Oversized limits slow response time and cost more.
//
// 5. Temperature controls creativity:
//    0.0 = deterministic (good for structured JSON)
//    0.7 = balanced (good for stories)
//    1.0 = highly creative (good for brainstorming)

import groqClient from '../config/groq.js';

// Model constants — change here to update everywhere
const MODEL_QUALITY = 'llama-3.3-70b-versatile';
const MODEL_FAST    = 'llama-3.1-8b-instant';           // Best for utility tasks

// ─────────────────────────────────────────────────────────────────
// streamRecipeStory
// Generates an emotional backstory for a recipe using SSE streaming.
// Returns an async iterable — the controller pipes this to the HTTP response.
//
// @param {Object} params
//   title        {String} - Recipe name e.g. "Nani ki Biryani"
//   ingredients  {Array}  - Array of ingredient objects [{name, quantity}]
//   culturalOrigin {String} - e.g. "Hyderabadi"
//   mood         {String} - e.g. "nostalgic"
//   dedication   {Object} - { dedicatedTo, relationship }
// ─────────────────────────────────────────────────────────────────
export const streamRecipeStory = async ({
  title,
  ingredients = [],
  culturalOrigin = '',
  mood = 'nostalgic',
  dedication = {},
}) => {
  const ingredientNames = ingredients
    .slice(0, 8) // Limit to 8 key ingredients — more adds noise
    .map(i => i.name)
    .join(', ');

  const dedicationLine = dedication.dedicatedTo
    ? `This recipe is dedicated to ${dedication.dedicatedTo} (${dedication.relationship || 'loved one'}).`
    : '';

  const culturalLine = culturalOrigin
    ? `Cultural context: This is a ${culturalOrigin} dish.`
    : '';

  const stream = await groqClient.chat.completions.create({
    model:       MODEL_QUALITY,
    max_tokens:  350,
    temperature: 0.75, // Slightly elevated for warmth and personality
    stream:      true,  // ← Token-by-token streaming
    messages: [
      {
        role: 'system',
        content: `You are a warm, empathetic food storyteller for "Chef's Diary" — a platform 
where recipes are about memory, culture, and human connection. Your writing voice is 
intimate, sensory, and emotionally resonant — like a letter written to a beloved family member.

Your task: Write a SHORT personal backstory (140–180 words) that a home cook or chef 
might write about their recipe. Write in first person. Ground the story in ONE specific 
memory or moment — a smell, a sound, a family scene. Avoid generic phrases like 
"this recipe holds a special place in my heart." Be specific and vivid.

Mood to evoke: ${mood}.
${culturalLine}
${dedicationLine}

Do NOT include a title or heading. Begin the story directly.`,
      },
      {
        role: 'user',
        content: `Write the story for my recipe: "${title}".
Key ingredients: ${ingredientNames || 'traditional spices and aromatics'}.`,
      },
    ],
  });

  return stream;
};

// ─────────────────────────────────────────────────────────────────
// getIngredientSubstitutions
// Returns structured JSON substitutions for dietary restrictions.
// Uses json_object response format — guarantees valid JSON output.
//
// @param {Array}  ingredients - Recipe ingredient objects
// @param {String} restriction - e.g. "vegan", "gluten-free", "nut-free"
// @returns {Object} - Parsed substitution JSON
// ─────────────────────────────────────────────────────────────────
export const getIngredientSubstitutions = async (ingredients, restriction) => {
  const ingredientList = ingredients
    .map(i => `- ${i.quantity} ${i.unit || ''} ${i.name}`.trim())
    .join('\n');

  const completion = await groqClient.chat.completions.create({
    model:       MODEL_FAST,
    max_tokens:  700,
    temperature: 0.1, // Very low — we want consistent, reliable food science answers
    response_format: { type: 'json_object' }, // Groq JSON mode — hard guarantees valid JSON
    messages: [
      {
        role: 'system',
        content: `You are a professional culinary nutritionist. You suggest ingredient 
substitutions that preserve the dish's texture, flavor, and structure while meeting 
dietary requirements.

CRITICAL: Return ONLY a valid JSON object with exactly this structure. 
No markdown, no code fences, no explanation text outside the JSON:
{
  "restriction": "string — the dietary restriction applied",
  "canAdapt": true,
  "substitutions": [
    {
      "original": "ingredient name",
      "substitute": "replacement ingredient",
      "ratio": "1:1 or adjusted ratio",
      "flavorImpact": "minimal / slight / significant",
      "note": "one sentence tip on technique or flavor adjustment"
    }
  ],
  "ingredientsToKeep": ["list of ingredients that need no change"],
  "overallNote": "one sentence on how the dish changes overall",
  "difficultyChange": "easier / same / harder"
}

If the dish absolutely cannot be adapted (e.g. making a beef dish vegan while 
keeping it a beef dish), set canAdapt to false and explain in overallNote.`,
      },
      {
        role: 'user',
        content: `Make this recipe ${restriction}.\n\nIngredients:\n${ingredientList}`,
      },
    ],
  });

  // json_object mode guarantees parseable output — no try/catch needed here,
  // but the controller wraps the whole function call in try/catch.
  return JSON.parse(completion.choices[0].message.content);
};

// ─────────────────────────────────────────────────────────────────
// streamCookingAssistant
// Interactive cooking companion — context-aware, multi-turn.
// Streaming keeps the chat feel instant even for longer answers.
//
// @param {Array}  conversationHistory - [{role, content}] message array
// @param {Object} recipeContext       - The recipe being cooked
// @returns {AsyncIterable}            - Groq streaming completion
// ─────────────────────────────────────────────────────────────────
export const streamCookingAssistant = async (conversationHistory, recipeContext) => {
  // Build a compact recipe summary for the system context.
  // We don't send the entire recipe object — that wastes tokens.
  // The assistant only needs enough to answer cooking questions.
  const stepsSummary = (recipeContext.steps || [])
    .map(s => `Step ${s.order}: ${s.instruction}`)
    .join('\n');

  const ingredientsSummary = (recipeContext.ingredients || [])
    .map(i => `${i.quantity} ${i.unit || ''} ${i.name}`.trim())
    .join(', ');

  const stream = await groqClient.chat.completions.create({
    model:       MODEL_FAST, // 8B for sub-100ms first token — critical for chat feel
    max_tokens:  220,
    temperature: 0.5,
    stream:      true,
    messages: [
      {
        role: 'system',
        content: `You are "Sous" — Chef's Diary's AI cooking companion. You are helping 
someone cook: "${recipeContext.title || 'a recipe'}".

Your personality: Encouraging, precise, and experienced — like a calm, kind head chef 
standing beside a home cook. You speak in short, confident sentences.

RULES:
- Keep responses under 80 words unless a technique explanation genuinely needs more.
- If asked about timing, reference the recipe's times below.
- If asked something unrelated to cooking, gently redirect.
- Never make up temperatures or times that aren't in the recipe.

Recipe reference:
- Prep: ${recipeContext.prepTime || '?'} min | Cook: ${recipeContext.cookTime || '?'} min
- Serves: ${recipeContext.servings || '?'}
- Difficulty: ${recipeContext.difficulty || 'not specified'}
- Ingredients: ${ingredientsSummary || 'see recipe'}
- Steps:\n${stepsSummary || 'follow the recipe steps'}`,
      },
      // Inject the full conversation history so the AI has memory of this session
      ...conversationHistory,
    ],
  });

  return stream;
};

// ─────────────────────────────────────────────────────────────────
// generateStoryPrompts
// Returns 3 short story-starter prompts to help writers get unstuck.
// Not streamed — fast enough without it using 8B model.
//
// @param {Object} params - { title, culturalOrigin, mood, dedication }
// @returns {Object} - { prompts: [string, string, string] }
// ─────────────────────────────────────────────────────────────────
export const generateStoryPrompts = async ({ title, culturalOrigin, mood, dedication }) => {
  const completion = await groqClient.chat.completions.create({
    model:       MODEL_FAST,
    max_tokens:  300,
    temperature: 0.8, // Higher creativity — we want varied, inspiring prompts
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a creative writing coach helping a home cook write their recipe story.
Generate exactly 3 short first-person story-starter sentences (max 20 words each) to help 
them begin their emotional food memory.

Each prompt should approach the memory from a different angle:
1. A sensory memory (smell, sound, texture)
2. A specific person or relationship
3. A time and place

Return ONLY valid JSON with no extra text:
{
  "prompts": ["prompt 1", "prompt 2", "prompt 3"]
}`,
      },
      {
        role: 'user',
        content: `Recipe: "${title}"
${culturalOrigin ? `Cultural origin: ${culturalOrigin}` : ''}
${mood ? `Mood: ${mood}` : ''}
${dedication?.dedicatedTo ? `Dedicated to: ${dedication.dedicatedTo}` : ''}`,
      },
    ],
  });

  return JSON.parse(completion.choices[0].message.content);
};