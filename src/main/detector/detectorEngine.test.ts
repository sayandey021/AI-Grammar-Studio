import { describe, it, expect } from 'vitest';
import { analyzePlagiarismAndAI, splitSentencesWithOffsets } from './detectorEngine';

describe('detectorEngine', () => {
  it('should correctly split sentences with offsets', () => {
    const text = 'Hello world! This is a test. Are you sure?';
    const sentences = splitSentencesWithOffsets(text);
    expect(sentences.length).toBe(3);
    expect(sentences[0].text).toBe('Hello world!');
    expect(sentences[1].text).toBe('This is a test.');
    expect(sentences[2].text).toBe('Are you sure?');
  });

  it('should detect higher AI probability on classic formulaic AI text', async () => {
    const aiText = `In today's fast-paced digital world, artificial intelligence plays a crucial role in transforming various industries. Furthermore, it is worth noting that machine learning models provide innovative solutions to complex problems. As we navigate the complexities of modern technology, it stands as a testament to human ingenuity. In conclusion, unlocking the potential of these tools fosters a sense of progress across global communities.`;
    const result = await analyzePlagiarismAndAI(aiText, { onlineMode: false });

    expect(result.overallAiScore).toBeGreaterThan(60);
    expect(result.sentences.length).toBe(4);
    expect(result.metrics.sentenceCount).toBe(4);
    expect(result.metrics.wordCount).toBeGreaterThan(50);
  });

  it('should classify organic human text with lower AI probability', async () => {
    const humanText = `I spent yesterday morning fixing an odd squeak under my car's dashboard. Turns out, a small plastic clip had snapped loose after six years of bumpy backroad commuting. After rummaging through my toolbox for some zip ties and electrical tape, the noise was finally gone. What a relief! Now I can finally drive without that annoying rattle.`;
    const result = await analyzePlagiarismAndAI(humanText, { onlineMode: false });

    expect(result.overallAiScore).toBeLessThan(45);
    expect(result.overallOriginalityScore).toBe(100);
  });

  it('should detect local reference document plagiarism when reference text matches', async () => {
    const originalDoc = `The quick brown fox jumps over the lazy dog repeatedly across the green meadow during autumn.`;
    const submittedDoc = `The quick brown fox jumps over the lazy dog repeatedly across the green meadow during autumn. Here is another sentence.`;

    const result = await analyzePlagiarismAndAI(submittedDoc, {
      onlineMode: false,
      referenceText: originalDoc,
    });

    expect(result.sentences[0].isPlagiarized).toBe(true);
    expect(result.overallPlagiarismScore).toBeGreaterThan(0);
  });
});
