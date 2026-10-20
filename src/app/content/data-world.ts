import { Level } from '../core/models';

export const DATA_LEVELS: Level[] = [
  {
    id: 'dirty-data',
    world: 'data',
    story:
      "The customer ledger feeds tomorrow's churn model. Ada found eight problems in ten rows. Can you?",
    hint: 'Read each column as a type: an id should be unique, an email has a domain, an age is a plausible number, dates share one format, categories one spelling.',
    title: 'Dirty Data Detective',
    tagline: 'Find every broken cell before the model eats it.',
    concept: 'Data cleaning & validation',
    minutes: 4,
    xp: 100,
    takeaway:
      'Real datasets are dirty: most of a data project is cleaning. Missing values, duplicates, ' +
      'impossible values and inconsistent formats silently corrupt statistics and models. ' +
      'The same is true in RAG: duplicated pages, broken encodings and boilerplate pollute retrieval.',
    challenge: {
      kind: 'dirty-data',
      intro:
        'A customer table is about to be used to train a churn model. Click every cell that has ' +
        'a problem — missing values, duplicates, impossible values, inconsistent formats. ' +
        'Click again to unflag. Submit when you think you have found them all.',
      columns: ['id', 'name', 'email', 'age', 'signup_date', 'country'],
      rows: [
        ['101', 'Alice Martin', 'alice@example.com', '34', '2024-03-12', 'France'],
        ['102', 'Bob Chen', 'bob.chen@example.com', '29', '2024-03-15', 'Canada'],
        ['103', 'Carla Díaz', 'carla.diaz@example', '41', '2024-04-02', 'Spain'],
        ['104', 'David Osei', 'david@example.com', '250', '2024-04-10', 'Ghana'],
        ['105', 'Emma Rossi', '', '27', '2024-05-01', 'Italy'],
        ['102', 'Bob Chen', 'bob.chen@example.com', '29', '2024-03-15', 'Canada'],
        ['107', 'Grace Kim', 'grace.kim@example.com', '33', '12/06/2024', 'South Korea'],
        ['108', 'Hugo Dubois', 'hugo@example.com', '-5', '2024-06-20', 'France'],
        ['109', 'Ines Haddad', 'ines@example.com', '38', '2024-07-04', 'france'],
        ['110', 'Jonas Weber', 'jonas@example.com', 'N/A', '2024-07-19', 'Germany'],
      ],
      issues: [
        {
          row: 2,
          col: 2,
          type: 'Invalid format',
          why: 'The email has no top-level domain. A validation rule (regex or schema) catches this at ingestion.',
        },
        {
          row: 3,
          col: 3,
          type: 'Impossible value',
          why: 'Nobody is 250 years old. A range check or an IQR outlier rule flags it; then decide: typo (25?) or drop.',
        },
        {
          row: 4,
          col: 2,
          type: 'Missing value',
          why: 'An empty cell. Drop the row, impute, or add a "missing" indicator — depending on WHY it is missing.',
        },
        {
          row: 5,
          col: null,
          type: 'Duplicate row',
          why: 'An exact copy of customer 102. Duplicates bias statistics and leak between train and test splits.',
        },
        {
          row: 6,
          col: 4,
          type: 'Inconsistent format',
          why: 'Every other date is ISO (YYYY-MM-DD). Is this 12 June or 6 December? Normalize formats at ingestion.',
        },
        {
          row: 7,
          col: 3,
          type: 'Impossible value',
          why: 'A negative age is type-valid (an integer) but domain-invalid — the kind of error a schema check lets through.',
        },
        {
          row: 8,
          col: 5,
          type: 'Inconsistent category',
          why: '"france" and "France" become two different categories after encoding. Normalize casing and spelling.',
        },
        {
          row: 9,
          col: 3,
          type: 'Sentinel string',
          why: 'A text value in a numeric column turns the whole column into strings. Convert sentinels such as N/A to real nulls.',
        },
      ],
    },
  },
  {
    id: 'mean-median-monsters',
    world: 'data',
    story: 'The Oracle reported an average salary of 10.7 k€. Nobody in the team recognised it.',
    hint: 'Ask what one extreme value does to each statistic. Means move; medians and percentiles barely do.',
    title: 'Mean, Median & Monsters',
    tagline: 'One outlier can lie to a whole dashboard.',
    concept: 'Robust statistics & outliers',
    minutes: 3,
    xp: 100,
    takeaway:
      'Before trusting any average, look at the distribution. Outliers and sentinel values pull ' +
      'the mean, hide tail latency and corrupt evaluation numbers. Prefer medians, percentiles ' +
      'and the IQR rule when data is messy.',
    challenge: {
      kind: 'mcq',
      intro:
        'Five quick questions about numbers that lie. Pick the best answer; every question comes with an explanation.',
      questions: [
        {
          prompt: 'Which statistic best describes a "typical" salary in this team?',
          context: 'Monthly salaries (k€): 3.1, 3.4, 2.9, 3.6, 3.2, 48.0',
          options: [
            'The mean (≈ 10.7 k€)',
            'The median (3.3 k€)',
            'The maximum (48 k€)',
            'The sum (64.2 k€)',
          ],
          answer: 1,
          explanation:
            'One executive salary drags the mean to 10.7 k€ — three times what anyone else earns. ' +
            'The median (3.3 k€) ignores the magnitude of extreme values, which is why it is called robust.',
        },
        {
          prompt: 'Which rule flags outliers using the quartiles of the data?',
          options: [
            'Any value above the mean',
            'The top 10% of values',
            'Values below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR',
            'Any negative value',
          ],
          answer: 2,
          explanation:
            'The interquartile range (IQR = Q3 − Q1) covers the middle half of the data. Values more than 1.5 IQR ' +
            'beyond the quartiles are flagged — the whiskers you see on a box plot.',
        },
        {
          prompt:
            'A temperature sensor reports: 21, 22, 21, 23, 22, −999. The −999 is most likely…',
          options: [
            'A genuine cold snap',
            'A sentinel value meaning "missing" — treat it as null',
            'A unit error (Kelvin instead of Celsius)',
            'Noise that will average out',
          ],
          answer: 1,
          explanation:
            'Round "impossible" numbers like −999, 9999 or 1900-01-01 are classic placeholders for missing data. ' +
            'Averaged in, a single −999 turns a 21.8° mean into −148°.',
        },
        {
          prompt:
            'Dropping every row with any missing value removes 70% of your dataset. Better alternative?',
          options: [
            'Keep dropping — clean data matters most',
            'Replace every missing value with 0',
            'Duplicate the remaining rows to compensate',
            'Impute (median / mode) or add a "missing" indicator, depending on why values are missing',
          ],
          answer: 3,
          explanation:
            'Missingness is information. Imputation keeps the rows; a "was missing" flag lets the model learn ' +
            'from the pattern. Replacing with 0 invents data — a zero income is not an unknown income.',
        },
        {
          prompt:
            'API response times (ms): 120, 130, 125, 118, 9800. For an SLA dashboard you should report…',
          options: [
            'The mean only',
            'Percentiles such as p50, p95 and p99',
            'The minimum',
            'The mode',
          ],
          answer: 1,
          explanation:
            "The mean (2059 ms) describes nobody's experience. Percentiles show the typical case (p50 ≈ 125 ms) " +
            'AND the tail (p99 ≈ 9800 ms) that users actually complain about. The same applies to LLM latency.',
        },
      ],
    },
  },
  {
    id: 'split-smart',
    world: 'data',
    story:
      'A model scored 99% in the Vault and 70% on the street. Ada suspects the test set saw too much.',
    hint: 'Whatever the model could have seen before the test is leakage: shared rows, future data, statistics fitted on everything.',
    title: 'Split Smart',
    tagline: 'Leakage is why offline metrics lie.',
    concept: 'Train / validation / test & data leakage',
    minutes: 3,
    xp: 100,
    takeaway:
      'Held-out data must be truly unseen: split before preprocessing, split by time when time matters, ' +
      'and never write evaluation questions by peeking at what the system returns. Leakage is the ' +
      'number-one reason a 99% offline score becomes 70% in production — in ML and in RAG evals alike.',
    challenge: {
      kind: 'mcq',
      intro: 'You have data and a model to evaluate. Make the right split decisions.',
      questions: [
        {
          prompt:
            'You have 10,000 labelled emails for a spam classifier. Which split is a sensible default?',
          options: [
            '100% training, evaluate on the training set',
            '80% training / 10% validation / 10% test',
            '50% training / 50% test, no validation set',
            '10% training / 90% test',
          ],
          answer: 1,
          explanation:
            'Validation data tunes hyper-parameters and picks the model; the test set is touched once, at the very end, ' +
            'to estimate real-world performance. Evaluating on training data only measures memorization.',
        },
        {
          prompt:
            'You standardize features with the mean and standard deviation of the FULL dataset, then split. What is wrong?',
          options: [
            'Nothing, scaling is independent of the split',
            'It only matters for image data',
            'Data leakage: test-set statistics flow into training',
            'It makes training slower',
          ],
          answer: 2,
          explanation:
            'The test set must behave like future data the model has never seen. Fit every preprocessing step ' +
            '(scalers, encoders, vocabularies, embeddings fine-tuning) on the training split only.',
        },
        {
          prompt:
            "You predict next month's sales from five years of history. How should you split?",
          options: [
            'Random shuffle, 80/20',
            'By time: train on the past, test on the most recent period',
            'Stratified by product category',
            'No split is needed for forecasting',
          ],
          answer: 1,
          explanation:
            'A random split lets the model "see the future": it trains on March to predict February. ' +
            'Temporal splits reproduce the real situation — the model is always asked about a period after its data.',
        },
        {
          prompt: 'Test accuracy is 99%, production accuracy is 70%. The most likely cause?',
          options: [
            'The model is too small',
            'The test set is too large',
            'Duplicates or leakage between training and test data',
            'The learning rate is too high',
          ],
          answer: 2,
          explanation:
            'Near-duplicate rows on both sides of a split make the test set a memory test. Deduplicate before ' +
            'splitting and group related records (same customer, same document) on the same side.',
        },
        {
          prompt:
            'For a RAG evaluation set, someone wrote 200 questions by looking at the chunks the current retriever returns. Problem?',
          options: [
            'None — that is how evaluation sets are built',
            '200 questions is far too many',
            'Questions must be generated by an LLM, never by humans',
            'The set is biased toward the current retriever, so it overestimates quality',
          ],
          answer: 3,
          explanation:
            'Questions derived from what the system already finds are a form of leakage: they cannot reveal what it misses. ' +
            'Build eval questions from real user needs and from the source documents, not from retrieval results.',
        },
      ],
    },
  },
  {
    id: 'data-shapes',
    world: 'data',
    story: "Nine deliveries arrived at the Vault's loading dock. Each needs the right shelf.",
    hint: 'Ask two questions: is there a fixed schema (columns)? If not, do the values describe themselves (keys, tags)?',
    title: 'Data Shapes',
    tagline: 'Structured, semi-structured or unstructured?',
    concept: 'Data types & why RAG exists',
    minutes: 3,
    xp: 100,
    takeaway:
      'Roughly 80% of enterprise data is unstructured — text, PDFs, emails, audio. RAG exists to give that data ' +
      'a queryable shape: embeddings make unstructured text searchable, while structured metadata filters it. ' +
      'Knowing the shape tells you which tool to reach for.',
    challenge: {
      kind: 'bucket-sort',
      intro:
        'Sort each data source into the bucket that fits best. Pick a card, then pick a bucket.',
      buckets: [
        { id: 'structured', name: 'Structured', hint: 'Rows and columns with a fixed schema' },
        {
          id: 'semi',
          name: 'Semi-structured',
          hint: 'Self-describing, flexible schema (keys, tags)',
        },
        {
          id: 'unstructured',
          name: 'Unstructured',
          hint: 'No predefined schema: text, audio, images',
        },
      ],
      cards: [
        {
          id: 'sql',
          text: 'A SQL table of orders (order_id, amount, date)',
          bucket: 'structured',
          why: 'Fixed columns and types: query it with SQL, no embeddings needed.',
        },
        {
          id: 'json',
          text: 'A JSON API response with nested fields',
          bucket: 'semi',
          why: 'Keys describe the values, but fields can vary from one record to another.',
        },
        {
          id: 'pdf',
          text: 'A 40-page PDF contract',
          bucket: 'unstructured',
          why: 'Free text in paragraphs: the classic RAG input, to be chunked and embedded.',
        },
        {
          id: 'logs',
          text: 'Server logs in JSON Lines format',
          bucket: 'semi',
          why: 'Each line is a self-describing record, yet the set of fields drifts over time.',
        },
        {
          id: 'emails',
          text: 'Customer support emails',
          bucket: 'unstructured',
          why: 'Headers are structured, but the body — where the meaning lives — is free text.',
        },
        {
          id: 'excel',
          text: 'An Excel sheet with one row per employee',
          bucket: 'structured',
          why: 'A table with a header row is structured data, even if it lives in a spreadsheet.',
        },
        {
          id: 'yaml',
          text: 'A YAML configuration file',
          bucket: 'semi',
          why: 'Hierarchical key-value pairs without a strict, enforced schema.',
        },
        {
          id: 'audio',
          text: 'A podcast audio recording',
          bucket: 'unstructured',
          why: 'Raw signal. Transcribe it (speech-to-text) and it becomes unstructured text you can embed.',
        },
        {
          id: 'photos',
          text: 'Product photos',
          bucket: 'unstructured',
          why: 'Pixels carry no schema; multimodal embeddings can still place them in a vector space.',
        },
      ],
    },
  },
];
