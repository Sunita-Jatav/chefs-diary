import { pipeline, env } from '@xenova/transformers';

// Skip local model checks, download directly from HuggingFace
env.allowLocalModels = false;
env.useBrowserCache = false;

class EmbeddingService {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log('Initializing embedding model...', this.model);
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }

  static async generateEmbedding(text) {
    try {
      const extractor = await this.getInstance();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      // Output is a Tensor, we want a regular JS array of numbers
      return Array.from(output.data);
    } catch (error) {
      console.error('generateEmbedding error:', error);
      return [];
    }
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default EmbeddingService;
