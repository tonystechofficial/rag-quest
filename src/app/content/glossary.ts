import { GlossaryEntry } from '../core/models';

export const GLOSSARY: GlossaryEntry[] = [
  // ---- data
  {
    term: 'Data cleaning',
    world: 'data',
    definition:
      'Detecting and fixing missing values, duplicates, impossible values and inconsistent formats before analysis or training.',
  },
  {
    term: 'Outlier',
    world: 'data',
    definition:
      'A value far from the rest of the distribution. The IQR rule flags values beyond 1.5 × IQR from the quartiles.',
  },
  {
    term: 'Median & percentiles',
    world: 'data',
    definition:
      'Robust statistics: the median is the middle value, p95 is the value below which 95% of observations fall. Unlike the mean, they ignore the magnitude of extremes.',
  },
  {
    term: 'Train / validation / test split',
    world: 'data',
    definition:
      'Training data fits the model, validation data tunes choices, test data — touched once — estimates real-world performance.',
  },
  {
    term: 'Data leakage',
    world: 'data',
    definition:
      'Information from the test set (or the future) reaching the training process, producing optimistic metrics that collapse in production.',
  },
  {
    term: 'Unstructured data',
    world: 'data',
    definition:
      'Data without a predefined schema — text, PDFs, emails, audio, images. Roughly 80% of enterprise data; the raw material of RAG.',
  },
  // ---- nlp
  {
    term: 'Token',
    world: 'nlp',
    definition:
      'The unit an LLM reads: a word, a sub-word or a character sequence from a learned vocabulary. English averages ~¾ word per token.',
  },
  {
    term: 'Stopword',
    world: 'nlp',
    definition:
      'A frequent function word (the, is, of) removed before keyword search or TF-IDF. Neural models keep them because they carry meaning (negation!).',
  },
  {
    term: 'Stemming vs lemmatization',
    world: 'nlp',
    definition:
      'Stemming chops suffixes by rule (studies → studi). Lemmatization maps to the dictionary form using grammar (better → good, was → be).',
  },
  {
    term: 'TF-IDF',
    world: 'nlp',
    definition:
      'Term frequency × inverse document frequency: a word weighs more when frequent in a document and rare across the corpus. The basis of keyword search; BM25 is its refined cousin.',
  },
  {
    term: 'Embedding',
    world: 'nlp',
    definition:
      'A vector (hundreds of numbers) representing the meaning of a text. Similar meanings produce nearby vectors.',
  },
  {
    term: 'Cosine similarity',
    world: 'nlp',
    definition:
      'The cosine of the angle between two vectors: 1 for the same direction, 0 for unrelated, −1 for opposite. The standard similarity for embeddings.',
  },
  {
    term: 'Named Entity Recognition (NER)',
    world: 'nlp',
    definition:
      'Finding and labelling entities — people, organizations, locations, dates — in text. A source of metadata for filtering in RAG.',
  },
  {
    term: 'Text classification',
    world: 'nlp',
    definition:
      'Assigning a label (spam / not spam, positive / negative, topic) to a text. Sentiment analysis is a classic example.',
  },
  // ---- rag
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    world: 'rag',
    definition:
      'Retrieving relevant passages from a knowledge base and putting them in the prompt so the LLM answers from your data instead of its memory.',
  },
  {
    term: 'Chunking',
    world: 'rag',
    definition:
      'Splitting documents into passages for embedding and retrieval. Size and overlap trade precision against context.',
  },
  {
    term: 'Vector database',
    world: 'rag',
    definition:
      'A store optimised for nearest-neighbour search over embeddings, usually with metadata filters (pgvector, Qdrant, Pinecone, Weaviate…).',
  },
  {
    term: 'Top-k retrieval',
    world: 'rag',
    definition:
      'Returning the k most similar chunks to the query. Vector search always returns k results — even bad ones — so check the scores.',
  },
  {
    term: 'Hybrid search',
    world: 'rag',
    definition:
      'Combining dense retrieval (embeddings) with sparse retrieval (BM25 keywords), typically fused by rank. Catches both paraphrases and exact identifiers.',
  },
  {
    term: 'Reranker (cross-encoder)',
    world: 'rag',
    definition:
      'A model that reads the query and a candidate chunk together to score relevance precisely. Too slow for the whole corpus; perfect for the top 20–100 candidates.',
  },
  {
    term: 'Context window',
    world: 'rag',
    definition:
      'The maximum number of tokens a model can read at once. Treat it as a budget: dense relevant chunks beat stuffed prompts ("lost in the middle").',
  },
  {
    term: 'Hallucination',
    world: 'rag',
    definition:
      'A fluent statement not supported by the context or by reality. In RAG it includes dropping conditions ("mainland France" → "France").',
  },
  {
    term: 'Faithfulness (groundedness)',
    world: 'rag',
    definition:
      "The share of an answer's claims that the retrieved context supports. Measured by splitting the answer into claims and checking each one.",
  },
  {
    term: 'Recall@k',
    world: 'rag',
    definition:
      'Share of questions (or relevant items) for which a relevant chunk appears in the top k retrieved results. The first metric to watch in RAG.',
  },
  {
    term: 'Prompt injection',
    world: 'rag',
    definition:
      'Instructions hidden in retrieved content ("ignore previous instructions…") that hijack the model. Retrieved text is untrusted data.',
  },
  {
    term: 'Metadata filtering',
    world: 'rag',
    definition:
      'Restricting retrieval with structured attributes — date, version, department, entity — before or after similarity search. The fix for "outdated but similar" results.',
  },
];
