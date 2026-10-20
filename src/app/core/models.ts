export type WorldId = 'data' | 'nlp' | 'rag';

export interface World {
  id: WorldId;
  name: string;
  /** Narrative name of the wing of the Archive ("The Data Vault"). */
  wing: string;
  tagline: string;
  description: string;
  icon: string;
  /** One paragraph of story shown on the wing page. */
  story: string;
  /** What Ada, the mentor, says when you enter the wing. */
  mentorIntro: string;
}

export type ChallengeKind =
  | 'mcq'
  | 'token-select'
  | 'order-steps'
  | 'bucket-sort'
  | 'estimate'
  | 'pick-k'
  | 'claim-check'
  | 'dirty-data'
  | 'embedding'
  | 'chunk-lab';

export interface Level {
  id: string;
  world: WorldId;
  title: string;
  tagline: string;
  concept: string;
  minutes: number;
  xp: number;
  /** One or two sentences of story framing the quest. */
  story: string;
  /** Ada's hint: a conceptual nudge, never the answer. Using it forfeits the flawless bonus. */
  hint: string;
  challenge: Challenge;
  takeaway: string;
}

export type Challenge =
  | McqChallenge
  | TokenSelectChallenge
  | OrderStepsChallenge
  | BucketSortChallenge
  | EstimateChallenge
  | PickKChallenge
  | ClaimCheckChallenge
  | DirtyDataChallenge
  | EmbeddingChallenge
  | ChunkLabChallenge;

// ---------------------------------------------------------------- multiple choice
export interface RevealDoc {
  label: string;
  text: string;
}

export interface McqQuestion {
  prompt: string;
  /** Optional passage shown above the options (small numeric table, scenario…). */
  context?: string;
  options: string[];
  answer: number;
  explanation: string;
  /** Documents to show as a live TF-IDF table with the question. */
  tfidfDocs?: RevealDoc[];
}

export interface McqChallenge {
  kind: 'mcq';
  intro: string;
  questions: McqQuestion[];
}

// ---------------------------------------------------------------- token selection
export interface TokenLabel {
  id: string;
  name: string;
}

export interface TokenSelectRound {
  prompt: string;
  tokens: string[];
  /** token index -> label id */
  answers: Record<number, string>;
  explanation: string;
}

export interface TokenSelectChallenge {
  kind: 'token-select';
  intro: string;
  labels: TokenLabel[];
  /** Reference list shown to the player (e.g. the stopword list in use). */
  hint?: string[];
  rounds: TokenSelectRound[];
}

// ---------------------------------------------------------------- ordering
export interface OrderStep {
  id: string;
  title: string;
  detail: string;
  phase: string;
}

export interface OrderStepsChallenge {
  kind: 'order-steps';
  intro: string;
  /** In the correct order. */
  steps: OrderStep[];
}

// ---------------------------------------------------------------- bucket sort
export interface Bucket {
  id: string;
  name: string;
  hint: string;
}

export interface BucketCard {
  id: string;
  text: string;
  bucket: string;
  why: string;
}

export interface BucketSortChallenge {
  kind: 'bucket-sort';
  intro: string;
  buckets: Bucket[];
  cards: BucketCard[];
}

// ---------------------------------------------------------------- estimate (token counter)
export interface EstimateRound {
  text: string;
  hint: string;
}

export interface EstimateChallenge {
  kind: 'estimate';
  intro: string;
  rounds: EstimateRound[];
}

// ---------------------------------------------------------------- pick k / budget
export interface PickItem {
  id: string;
  text: string;
  /** Token cost, used in budget mode. */
  cost?: number;
  /** Ground-truth relevance 0..3. */
  relevance: number;
  note: string;
}

export interface PickRound {
  query: string;
  k?: number;
  budget?: number;
  items: PickItem[];
  explanation: string;
}

export interface PickKChallenge {
  kind: 'pick-k';
  intro: string;
  mode: 'top-k' | 'budget';
  rounds: PickRound[];
}

// ---------------------------------------------------------------- claim check
export interface Claim {
  text: string;
  supported: boolean;
  why: string;
}

export interface ClaimCheckRound {
  context: string;
  answer: string;
  claims: Claim[];
}

export interface ClaimCheckChallenge {
  kind: 'claim-check';
  intro: string;
  rounds: ClaimCheckRound[];
}

// ---------------------------------------------------------------- dirty data
export interface DataIssue {
  row: number;
  /** null = the whole row is the problem (duplicate), any cell of the row counts. */
  col: number | null;
  type: string;
  why: string;
}

export interface DirtyDataChallenge {
  kind: 'dirty-data';
  intro: string;
  columns: string[];
  rows: string[][];
  issues: DataIssue[];
}

// ---------------------------------------------------------------- embedding map
export interface EmbeddedWord {
  word: string;
  x: number;
  y: number;
  group: string;
}

export interface EmbeddingChallenge {
  kind: 'embedding';
  intro: string;
  groups: Record<string, string>;
  words: EmbeddedWord[];
  mystery: EmbeddedWord[];
}

// ---------------------------------------------------------------- chunk lab
export interface ChunkLabChallenge {
  kind: 'chunk-lab';
  intro: string;
  title: string;
  document: string;
  questions: { q: string; keywords: string[] }[];
}

// ---------------------------------------------------------------- results
export interface ChallengeResult {
  scorePct: number;
  summary: string;
  /** Every round scored 90% or more (single-round challenges: the score itself). */
  flawless?: boolean;
  /** Notable feats for badges: exact-token-count, all-claims-right, bullseye, chunk-95, all-issues-found. */
  feats?: string[];
}

export interface GlossaryEntry {
  term: string;
  world: WorldId;
  definition: string;
}
