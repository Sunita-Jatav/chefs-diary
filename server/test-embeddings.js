import EmbeddingService from './services/embedding.service.js';

async function runTest() {
  try {
    console.log('Testing embedding service...');
    
    // Test embedding generation
    const text1 = 'spicy chicken curry with rice';
    console.log(`Generating embedding for: "${text1}"`);
    const vec1 = await EmbeddingService.generateEmbedding(text1);
    console.log(`Vector 1 generated. Length: ${vec1.length}`);
    
    const text2 = 'mild vegetable stir fry';
    console.log(`Generating embedding for: "${text2}"`);
    const vec2 = await EmbeddingService.generateEmbedding(text2);
    console.log(`Vector 2 generated. Length: ${vec2.length}`);

    const text3 = 'spicy beef curry';
    console.log(`Generating embedding for: "${text3}"`);
    const vec3 = await EmbeddingService.generateEmbedding(text3);
    console.log(`Vector 3 generated. Length: ${vec3.length}`);

    // Test cosine similarity
    const sim12 = EmbeddingService.cosineSimilarity(vec1, vec2);
    console.log(`Similarity between "${text1}" and "${text2}": ${sim12}`);
    
    const sim13 = EmbeddingService.cosineSimilarity(vec1, vec3);
    console.log(`Similarity between "${text1}" and "${text3}": ${sim13}`);

    if (sim13 > sim12) {
      console.log('Test PASSED: Spicy beef curry is more similar to spicy chicken curry than mild vegetable stir fry.');
    } else {
      console.log('Test FAILED: Similarities are not as expected.');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTest();
