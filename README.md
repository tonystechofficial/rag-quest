# RAG Quest

**Learn data foundations, NLP basics and Retrieval-Augmented Generation by playing.**

A free, open-source browser game: 17 bite-sized challenges across three worlds. Count tokens, place words in an embedding space, tune chunk size on a real document, rank retrieved passages, hunt hallucinations. Every round ends with an explanation and a takeaway.

No backend, no account: everything (including the tokenizer, TF-IDF retriever and chunker) runs in the browser. Progress is stored in `localStorage`.

**Play it:** https://rag-quest.vercel.app

## The three worlds

| World | Challenge | What you practice |
| --- | --- | --- |
| 🧹 Data Foundations | Dirty Data Detective | Spotting missing values, duplicates, outliers and format drift in a table |
| | Mean, Median & Monsters | Robust statistics, IQR rule, sentinels, percentiles |
| | Split Smart | Train/validation/test splits, temporal splits, data leakage (also in RAG evals) |
| | Data Shapes | Structured vs semi-structured vs unstructured data, and why RAG exists |
| 🔤 NLP Basics | Token Counter | Guess the token count, then see the GPT-style split (sub-words, digits, emoji) |
| | Stopword Sweeper | Stopword removal, and when it destroys meaning |
| | Lemma Lab | Stemming vs lemmatization |
| | TF-IDF Showdown | tf, idf and weights computed live on tiny corpora; keyword search limits |
| | Embedding Explorer | Place words on a 2-D embedding map, nearest neighbours, cosine vs distance |
| | Entity Hunter | Named Entity Recognition and entity boundaries |
| | Sentiment Sorter | Text classification with negation, contrast and sarcasm traps |
| 📚 RAG Lab | Pipeline Builder | Reorder the indexing and querying stages of a RAG pipeline |
| | Chunk Master | Tune chunk size and overlap on a handbook and watch retrieval succeed or fail |
| | Retrieval Ranker | Relevance vs keyword overlap, outdated-version traps, metadata filters |
| | Context Budget | Fill a token budget with the most relevant chunks (a knapsack) |
| | Hallucination Hunter | Claim-level faithfulness checking of a generated answer |
| | RAG Boss Quiz | recall@k, faithfulness, hybrid search, rerankers, prompt injection |

Scoring: three stars at 90%, two at 60%, one at 30%. Each challenge is worth 100 XP; ranks go from *Data Novice* to *RAG Grandmaster*.

## How it is built

- **Angular 22** (standalone components, signals, zoneless, lazy routes), **TypeScript 6**, **Vitest**.
- `src/app/core/domain/` — pure, dependency-free domain logic, written test-first:
  tokenizer approximation, cosine / euclidean similarity, TF-IDF, a tiny stemmer, a word chunker,
  a sparse retriever with recall@k and MRR, a 0/1 knapsack for the context budget, IQR outliers,
  pairwise-order accuracy and the scoring rules.
- `src/app/content/` — the game content (levels, glossary) as plain data, validated by `content.spec.ts`
  (every answer index exists, the Chunk Master level is winnable, the TF-IDF ranking question is true for our retriever…).
- `src/app/features/play/engines/` — one small component per challenge type (multiple choice, token selection,
  ordering, bucket sort, estimation, pick-k / budget, claim check, dirty table, embedding map, chunk lab).
  Adding a level means adding a data object to a content file; adding a mechanic means adding an engine.

The tokenizer is a teaching approximation (leading-space words, sub-word splitting, digit groups of three,
emoji cost 2). Real tokenizers learn their vocabulary from data, so counts differ — the behaviours it
illustrates are the real ones.

## Run it locally

```bash
npm install
npm start          # http://localhost:4200
npm run test:ci    # unit + component tests (Vitest)
npm run build      # production build in dist/rag-quest/browser
```

Requires Node 22.22+ (Angular 22).

## Deploy

The repository deploys to Vercel as a static site (`vercel.json` sets the output directory and the SPA rewrite).

```bash
npx vercel --prod
```

## Contributing

Issues and pull requests are welcome: new levels, better explanations, translations, accessibility fixes.
Keep domain logic pure and tested, and keep the content honest — every explanation should be something
you would say to a colleague.

## License

[MIT](LICENSE)
