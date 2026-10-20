import { Level } from '../core/models';

/** The exact stopword list the Stopword Sweeper plays with (shown to the player). */
export const SWEEPER_STOPWORDS = [
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'of',
  'for',
  'in',
  'on',
  'at',
  'to',
  'and',
  'or',
  'but',
  'with',
  'by',
  'from',
  'this',
  'that',
  'it',
  'as',
  'its',
  'not',
];

export const NLP_LEVELS: Level[] = [
  {
    id: 'token-counter',
    world: 'nlp',
    title: 'Token Counter',
    tagline: 'Guess how many tokens a model really reads.',
    concept: 'Tokenization',
    minutes: 4,
    xp: 100,
    takeaway:
      'LLMs read tokens, not words. Token count drives cost, latency and how much context fits in the window. ' +
      'English averages about ¾ of a word per token; other languages, numbers, code and emoji cost more. ' +
      '(The tokenizer in this game is a teaching approximation — real ones learn their vocabulary from data.)',
    challenge: {
      kind: 'estimate',
      intro:
        'For each text, guess how many tokens a GPT-style tokenizer would produce. ' +
        'Then see the real split. The closer your guess, the more points.',
      rounds: [
        {
          text: 'The cat sat on the mat.',
          hint: 'Short, common English words are usually one token each. Punctuation counts too.',
        },
        {
          text: 'Tokenization is unbelievably important.',
          hint: 'Long or rare words are split into several sub-word pieces.',
        },
        {
          text: 'I ❤️ NLP 😀',
          hint: 'Emoji are expensive: one emoji often costs two or more tokens.',
        },
        {
          text: 'Invoice 20240915 total: 1234567.89 EUR',
          hint: 'Digits are grouped by three — long numbers and IDs burn tokens.',
        },
        {
          text: 'Les réseaux de neurones apprennent des représentations.',
          hint: 'Non-English text is split into more pieces: vocabularies are English-heavy.',
        },
      ],
    },
  },
  {
    id: 'stopword-sweeper',
    world: 'nlp',
    title: 'Stopword Sweeper',
    tagline: 'Sweep the filler words — and learn when not to.',
    concept: 'Stopwords & text normalization',
    minutes: 3,
    xp: 100,
    takeaway:
      'Stopwords are frequent, low-information words. Removing them helps keyword search and TF-IDF, ' +
      'but neural models (embeddings, LLMs) keep every token: "not" flips a meaning, and ' +
      '"to be or not to be" is nothing without its stopwords.',
    challenge: {
      kind: 'token-select',
      intro:
        'Click every stopword in the sentence, using the reference list below. ' +
        'Click again to deselect. Then check your answer.',
      labels: [{ id: 'stop', name: 'Stopword' }],
      hint: SWEEPER_STOPWORDS,
      rounds: [
        {
          prompt: 'Sweep the stopwords.',
          tokens: ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'],
          answers: { 0: 'stop', 6: 'stop' },
          explanation:
            'Only "the" is on our list. Stopword lists differ between libraries: NLTK also drops "over", spaCy drops ' +
            'more than 300 words. Always check which list your pipeline uses.',
        },
        {
          prompt: 'Sweep the stopwords.',
          tokens: [
            'Retrieval',
            'augmented',
            'generation',
            'is',
            'a',
            'technique',
            'for',
            'grounding',
            'an',
            'LLM',
            'in',
            'your',
            'own',
            'data',
          ],
          answers: { 3: 'stop', 4: 'stop', 6: 'stop', 8: 'stop', 10: 'stop' },
          explanation:
            'Removing "is a for an in" leaves "Retrieval augmented generation technique grounding LLM your own data" — ' +
            'the keywords a sparse search engine (BM25) would index.',
        },
        {
          prompt: 'Sweep the stopwords… if you dare.',
          tokens: ['To', 'be', 'or', 'not', 'to', 'be', 'that', 'is', 'the', 'question'],
          answers: {
            0: 'stop',
            1: 'stop',
            2: 'stop',
            3: 'stop',
            4: 'stop',
            5: 'stop',
            6: 'stop',
            7: 'stop',
            8: 'stop',
          },
          explanation:
            'Nine of ten words are stopwords: after removal, Shakespeare becomes "question". This is why modern ' +
            'embedding models keep stopwords — function words carry meaning, especially negation ("not").',
        },
        {
          prompt: 'Sweep the stopwords.',
          tokens: [
            'Machine',
            'learning',
            'models',
            'learn',
            'patterns',
            'from',
            'data',
            'and',
            'generalize',
            'to',
            'new',
            'examples',
          ],
          answers: { 5: 'stop', 7: 'stop', 9: 'stop' },
          explanation:
            'Here stopword removal is harmless: the content words carry the whole meaning. Technical text is where ' +
            'normalization (stopwords, lowercasing, stemming) gives keyword search its best results.',
        },
      ],
    },
  },
  {
    id: 'lemma-lab',
    world: 'nlp',
    title: 'Lemma Lab',
    tagline: 'running, ran, runs — same word?',
    concept: 'Stemming vs lemmatization',
    minutes: 3,
    xp: 100,
    takeaway:
      'Normalizing word forms lets keyword search match "ran" with "running". Stemmers chop suffixes with rules ' +
      '(fast, crude); lemmatizers use vocabulary and grammar (better → good). Embedding models learn these ' +
      'relations implicitly — one reason they need less preprocessing.',
    challenge: {
      kind: 'bucket-sort',
      intro:
        'Stemming chops suffixes (running → run, studies → studi). Lemmatization uses a dictionary and grammar ' +
        '(better → good, was → be). Sort each word form under its lemma.',
      buckets: [
        { id: 'run', name: 'run', hint: 'verb' },
        { id: 'be', name: 'be', hint: 'verb' },
        { id: 'good', name: 'good', hint: 'adjective' },
        { id: 'mouse', name: 'mouse', hint: 'noun' },
      ],
      cards: [
        {
          id: 'running',
          text: 'running',
          bucket: 'run',
          why: 'Present participle. Both a stemmer and a lemmatizer get this one.',
        },
        {
          id: 'ran',
          text: 'ran',
          bucket: 'run',
          why: 'Irregular past tense: a stemmer leaves "ran" alone, a lemmatizer needs a dictionary.',
        },
        {
          id: 'runs',
          text: 'runs',
          bucket: 'run',
          why: 'Third person singular — a simple "-s" rule handles it.',
        },
        {
          id: 'is',
          text: 'is',
          bucket: 'be',
          why: 'The lemma of "is" is "be": impossible to find by chopping letters.',
        },
        {
          id: 'was',
          text: 'was',
          bucket: 'be',
          why: 'Past tense of "be" — pure dictionary knowledge.',
        },
        { id: 'were', text: 'were', bucket: 'be', why: 'Plural past of "be".' },
        { id: 'been', text: 'been', bucket: 'be', why: 'Past participle of "be".' },
        {
          id: 'better',
          text: 'better',
          bucket: 'good',
          why: 'Comparative of "good". Porter stemming gives "better"; lemmatization gives "good".',
        },
        {
          id: 'best',
          text: 'best',
          bucket: 'good',
          why: 'Superlative of "good" — another suppletive form.',
        },
        {
          id: 'mice',
          text: 'mice',
          bucket: 'mouse',
          why: 'Irregular plural: no suffix rule turns "mice" into "mouse".',
        },
        {
          id: 'mouses',
          text: "mouse's",
          bucket: 'mouse',
          why: 'Possessive. Tokenizers usually split off the "\'s" first.',
        },
      ],
    },
  },
  {
    id: 'tfidf-showdown',
    world: 'nlp',
    title: 'TF-IDF Showdown',
    tagline: 'Which word matters most in this document?',
    concept: 'TF-IDF & keyword search',
    minutes: 4,
    xp: 100,
    takeaway:
      'TF-IDF (and its cousin BM25) rewards words that are frequent in a document but rare across the corpus. ' +
      'It is fast, explainable and precise on exact terms, but blind to synonyms and meaning — which is why ' +
      'production RAG often runs it alongside embeddings ("hybrid search").',
    challenge: {
      kind: 'mcq',
      intro:
        'tf = how often a term appears in a document. idf = ln(N / documents containing the term). ' +
        'Weight = tf × idf. The live table under each question shows the real numbers once you answer.',
      questions: [
        {
          prompt: 'Which of these words has the highest TF-IDF weight in document A?',
          tfidfDocs: [
            { label: 'A', text: 'The cat chased the mouse around the house.' },
            { label: 'B', text: 'The dog chased the ball around the yard.' },
            { label: 'C', text: 'The stock market fell sharply as investors sold shares.' },
          ],
          options: ['the', 'chased', 'mouse', 'around'],
          answer: 2,
          explanation:
            '"mouse" appears only in A: idf = ln(3/1) ≈ 1.10. "the" is in every document, so idf = ln(3/3) = 0 — ' +
            'the most frequent word weighs nothing. "chased" and "around" are shared with B: idf = ln(3/2) ≈ 0.41. ' +
            '("cat" and "house" tie with "mouse".)',
        },
        {
          prompt: 'Which word has an IDF of exactly zero in this corpus?',
          tfidfDocs: [
            { label: 'A', text: 'The cat chased the mouse around the house.' },
            { label: 'B', text: 'The dog chased the ball around the yard.' },
            { label: 'C', text: 'The stock market fell sharply as investors sold shares.' },
          ],
          options: ['chased', 'the', 'market', 'house'],
          answer: 1,
          explanation:
            'A term present in every document carries no discriminating power: ln(N/N) = ln(1) = 0. ' +
            "This is TF-IDF's built-in stopword removal.",
        },
        {
          prompt: 'A user searches for "python snake". Using TF-IDF, which document ranks first?',
          tfidfDocs: [
            {
              label: 'A',
              text: 'Python is a programming language. Python is popular for data science.',
            },
            { label: 'B', text: 'The python is a snake found in Africa and Asia.' },
            { label: 'C', text: 'Data science uses statistics and programming.' },
          ],
          options: ['Document A', 'Document B', 'Document C', 'A and B tie'],
          answer: 1,
          explanation:
            '"snake" appears only in B (high idf); "python" appears in A and B (lower idf). B matches both query terms, ' +
            'A only one, C none. Note the limit: TF-IDF cannot tell python-the-language from python-the-snake — ' +
            'only the extra word saved it. Dense embeddings capture that difference from context.',
        },
        {
          prompt: 'What is the main weakness of TF-IDF / keyword search for RAG?',
          options: [
            'It is too slow for large corpora',
            'It matches words, not meaning: synonyms and paraphrases are missed',
            'It only works for English text',
            'It requires a GPU',
          ],
          answer: 1,
          explanation:
            '"How do I cancel my plan?" shares no word with "Terminating your subscription". Keyword search misses it; ' +
            'an embedding model places both sentences close together. Hybrid search gets the best of both.',
        },
      ],
    },
  },
  {
    id: 'embedding-explorer',
    world: 'nlp',
    title: 'Embedding Explorer',
    tagline: 'Place the word where its meaning lives.',
    concept: 'Embeddings & vector similarity',
    minutes: 4,
    xp: 100,
    takeaway:
      'An embedding turns text into a point in space where meaning is position: similar meanings land close together. ' +
      'Nearest-neighbour search over those points is exactly what a vector database does when a RAG system retrieves ' +
      'context. Real embeddings have hundreds of dimensions — the idea is the same.',
    challenge: {
      kind: 'embedding',
      intro:
        'This map is a 2-D embedding space: each dot is a word, and distance means similarity. ' +
        'A mystery word appears — click where it belongs. The closer to its true position, the more points.',
      groups: { animals: 'Animals', fruits: 'Fruits', vehicles: 'Vehicles', emotions: 'Emotions' },
      words: [
        { word: 'cat', x: -0.7, y: 0.6, group: 'animals' },
        { word: 'dog', x: -0.58, y: 0.76, group: 'animals' },
        { word: 'horse', x: -0.86, y: 0.5, group: 'animals' },
        { word: 'kitten', x: -0.64, y: 0.48, group: 'animals' },
        { word: 'apple', x: 0.7, y: 0.65, group: 'fruits' },
        { word: 'banana', x: 0.82, y: 0.5, group: 'fruits' },
        { word: 'cherry', x: 0.6, y: 0.5, group: 'fruits' },
        { word: 'mango', x: 0.75, y: 0.82, group: 'fruits' },
        { word: 'car', x: -0.7, y: -0.6, group: 'vehicles' },
        { word: 'truck', x: -0.82, y: -0.76, group: 'vehicles' },
        { word: 'bicycle', x: -0.55, y: -0.72, group: 'vehicles' },
        { word: 'bus', x: -0.66, y: -0.45, group: 'vehicles' },
        { word: 'happy', x: 0.7, y: -0.6, group: 'emotions' },
        { word: 'sad', x: 0.82, y: -0.76, group: 'emotions' },
        { word: 'angry', x: 0.56, y: -0.72, group: 'emotions' },
        { word: 'joyful', x: 0.64, y: -0.48, group: 'emotions' },
      ],
      mystery: [
        { word: 'puppy', x: -0.52, y: 0.64, group: 'animals' },
        { word: 'strawberry', x: 0.66, y: 0.38, group: 'fruits' },
        { word: 'scooter', x: -0.48, y: -0.58, group: 'vehicles' },
        { word: 'furious', x: 0.48, y: -0.84, group: 'emotions' },
        { word: 'wolf', x: -0.9, y: 0.68, group: 'animals' },
      ],
    },
  },
  {
    id: 'entity-hunter',
    world: 'nlp',
    title: 'Entity Hunter',
    tagline: 'Who, where, when — tag the entities.',
    concept: 'Named Entity Recognition',
    minutes: 4,
    xp: 100,
    takeaway:
      'Named Entity Recognition extracts who / where / when from text. In RAG, entities become metadata filters ' +
      '("only documents about Bordeaux from 2025") — far more reliable than hoping an embedding captures a date. ' +
      'Entity boundaries depend on context: "Paris" is a place, "University of Paris" is an organization.',
    challenge: {
      kind: 'token-select',
      intro:
        'Select a label, then click the words that belong to that entity. ' +
        'Words that are not entities stay unlabelled. Check when done.',
      labels: [
        { id: 'PER', name: 'Person' },
        { id: 'ORG', name: 'Organization' },
        { id: 'LOC', name: 'Location' },
        { id: 'DATE', name: 'Date' },
      ],
      rounds: [
        {
          prompt: 'Tag the entities.',
          tokens: ['Marie', 'Curie', 'joined', 'the', 'University', 'of', 'Paris', 'in', '1906'],
          answers: { 0: 'PER', 1: 'PER', 4: 'ORG', 5: 'ORG', 6: 'ORG', 8: 'DATE' },
          explanation:
            '"University of Paris" is one ORG span even though "Paris" alone would be a LOC: boundaries depend on context. ' +
            'A bare year is a DATE entity.',
        },
        {
          prompt: 'Tag the entities.',
          tokens: [
            'Apple',
            'opened',
            'a',
            'new',
            'store',
            'in',
            'Bordeaux',
            'on',
            '14',
            'March',
            '2025',
          ],
          answers: { 0: 'ORG', 6: 'LOC', 8: 'DATE', 9: 'DATE', 10: 'DATE' },
          explanation:
            '"Apple" here is a company, not a fruit — the verb "opened a store" disambiguates, which is why NER models ' +
            'read the whole sentence. Multi-word dates ("14 March 2025") form a single entity span.',
        },
        {
          prompt: 'Tag the entities.',
          tokens: [
            'Last',
            'Tuesday',
            'Dr.',
            'Amara',
            'Okafor',
            'from',
            'Médecins',
            'Sans',
            'Frontières',
            'landed',
            'in',
            'Nairobi',
          ],
          answers: {
            0: 'DATE',
            1: 'DATE',
            3: 'PER',
            4: 'PER',
            6: 'ORG',
            7: 'ORG',
            8: 'ORG',
            11: 'LOC',
          },
          explanation:
            'Relative dates ("Last Tuesday") are DATE entities too — resolving them to a calendar date is a separate step. ' +
            'Most annotation schemes leave titles such as "Dr." outside the PERSON span. A French organization name ' +
            'inside an English sentence is still one ORG.',
        },
      ],
    },
  },
  {
    id: 'sentiment-sorter',
    world: 'nlp',
    title: 'Sentiment Sorter',
    tagline: 'Positive, negative… or a trap?',
    concept: 'Text classification',
    minutes: 3,
    xp: 100,
    takeaway:
      'Sentiment analysis is text classification. Negation, contrast ("but") and sarcasm are where bag-of-words models ' +
      'fail and context-aware transformers shine. RAG answers hit the same traps: "not covered by the warranty" is ' +
      'the opposite of "covered by the warranty", one token apart.',
    challenge: {
      kind: 'bucket-sort',
      intro:
        'Sort each customer review by sentiment. Watch out for negations, contrasts and sarcasm.',
      buckets: [
        { id: 'positive', name: 'Positive', hint: 'The customer is happy' },
        { id: 'neutral', name: 'Neutral', hint: 'Factual, no clear opinion' },
        { id: 'negative', name: 'Negative', hint: 'The customer is unhappy' },
      ],
      cards: [
        {
          id: 'battery',
          text: "This phone's battery lasts two full days — brilliant.",
          bucket: 'positive',
          why: 'Explicit praise ("brilliant"), the easy case for any model.',
        },
        {
          id: 'notbad',
          text: "Not bad at all, I'd buy it again.",
          bucket: 'positive',
          why: 'Negation trap: "not bad" is positive. A bag-of-words model sees "bad" and gets it wrong.',
        },
        {
          id: 'tuesday',
          text: 'The package arrived on Tuesday.',
          bucket: 'neutral',
          why: 'A plain fact with no evaluation.',
        },
        {
          id: 'cracked',
          text: 'I wanted to love it, but the screen cracked within a week.',
          bucket: 'negative',
          why: 'Contrast trap: "love" appears, but the clause after "but" carries the verdict.',
        },
        {
          id: 'sarcasm',
          text: 'Oh great, another update that deletes my settings.',
          bucket: 'negative',
          why: 'Sarcasm: "great" is literally positive. Only context (deleted settings) reveals the frustration.',
        },
        {
          id: 'manual',
          text: 'The manual is 40 pages long.',
          bucket: 'neutral',
          why: 'Descriptive statement; whether 40 pages is good or bad is not stated.',
        },
        {
          id: 'support',
          text: 'Customer support never replied to three emails.',
          bucket: 'negative',
          why: 'No negative adjective at all — the complaint is in the facts. Lexicon-based models miss this.',
        },
        {
          id: 'cent',
          text: 'Absolutely worth every cent.',
          bucket: 'positive',
          why: 'Idiomatic praise; a model needs to know the expression.',
        },
        {
          id: 'fine',
          text: "It's fine. Nothing special, nothing wrong.",
          bucket: 'neutral',
          why:
            'Balanced, lukewarm. Many datasets would label this neutral; borderline cases like this are why ' +
            'annotation guidelines and inter-annotator agreement matter.',
        },
      ],
    },
  },
];
