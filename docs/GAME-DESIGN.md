# RAG Quest — game design

This document describes the game layer wrapped around the 17 learning challenges. Everything in it is implemented; the file names point at the code.

## Fantasy

You are the new apprentice at **the Archive**, a library whose **Oracle** (an AI) answers the questions of the city. Lately the Oracle hallucinates, not because it is stupid but because the Archive it reads from is a mess: dirty ledgers, texts nobody taught it to read, shelves nobody indexed. **Ada**, the senior Archivist, guides you through three wings. Restore them and the Oracle speaks true again.

| Wing | Learning world | What it teaches |
| --- | --- | --- |
| The Data Vault | Data Foundations | data cleaning, robust statistics, splits and leakage, data shapes |
| The Language Hall | NLP Basics | tokens, stopwords, lemmas, TF-IDF, entities, sentiment, embeddings |
| The Retrieval Engine | RAG Lab | pipeline, chunking, retrieval, context budget, faithfulness, evaluation |

Narrative content lives in `src/app/content/worlds.ts` (wing stories and Ada's intros), in each level's `story` and `hint`, and in `src/app/content/mentor.ts` (Ada's comments by star count, wing-opened lines, ending).

## Core loop

1. Pick the next quest on the wing map (locked quests show what unlocks them).
2. Play the rounds. Ask Ada for a hint if stuck: a conceptual nudge, never the answer.
3. Result screen: score, stars, XP and bonuses, Ada's comment, unlocked quests, badges, takeaway.
4. Beat the wing boss (the last quest, one star is enough) to open the next wing.
5. Clear every quest to restore the Oracle and claim a certificate.

## Progression (`core/domain/progression.ts`)

- Wings open in order. A wing opens when the **boss** of the previous wing has at least one star.
- Inside a wing, a quest unlocks when the previous quest has at least one star. One star is deliberately cheap (30%) so nobody is stuck on a mechanic they dislike; stars beyond the first are optional mastery.
- A quest that has been played stays replayable even if the rules would lock it again (free play toggled off).
- **Free play** (footer toggle) unlocks everything, for teachers, demos and impatient players.
- "Next quest" = first reachable quest without a star, else the reachable quest with the fewest stars, else nothing left to do.

Order of quests: `QUEST_ORDER` in `content/worlds.ts`. Bosses: Split Smart (leakage closes the Data Vault), Embedding Explorer (geometry closes the Language Hall), RAG Boss Quiz.

## Economy (`core/domain/scoring.ts`)

| Signal | Rule |
| --- | --- |
| Stars | 3 at 90%, 2 at 60%, 1 at 30% |
| Quest XP | 100 × stars / 3, best attempt kept |
| First-try bonus | +10 XP for three stars on the first attempt |
| Flawless bonus | +20 XP when every round scored 90%+ and no hint was used |
| Ranks | Data Novice 0 · Token Apprentice 100 · Vector Analyst 300 · Embedding Engineer 600 · RAG Architect 1000 · RAG Grandmaster 1500 |

Total available: 17 × 100 base + bonuses, so the top rank needs mastery, not just completion. Hints cost nothing visible except the flawless bonus: the player is never punished for learning.

## Streak (`core/domain/streak.ts`)

Consecutive local calendar days with at least one quest completed. Shown in the header as 🔥 while it can still be continued (played today or yesterday). Three days earn a badge. No notifications, no guilt mechanics.

## Badges (`core/domain/achievements.ts`)

Fifteen badges, computed from the saved state and persisted once earned (a broken streak never removes "Three Days Running"). Engines declare **feats** on their result (`exact-token-count`, `all-claims-right`, `bullseye`, `chunk-95`, `all-issues-found`); the progress service adds `flawless` and `comeback`. New badges appear as toasts (shell) and on the result screen.

## Mentor hints

Each quest has one hint written as a way of thinking, not a solution ("count shelves, not occurrences"). Using it marks the run as hinted: no flawless bonus, nothing else. Hints are the scaffolding that keeps a stuck player in the game.

## Feedback and juice

- Score pops in, stars animate one after the other, confetti for three stars (CSS only, respects `prefers-reduced-motion`).
- Ada comments every result with a line chosen deterministically from the star count, so a given result always reads the same.
- Unlocks are announced on the result screen with direct links: new quest, new wing.
- Locked quests and wings always say *what* unlocks them.

## Ending

"Oracle Restored" (a star everywhere) unlocks a downloadable PNG certificate (`features/badges/certificate.ts`, drawn on a canvas, name optional). "RAG Grandmaster" (three stars everywhere) is the completionist goal.

## Visual identity: the card catalogue

The first version shipped with the default look of generated interfaces (navy, a cyan-to-violet gradient, emoji as icons, a rounded card for everything). The redesign takes its material from the fiction: the Archive is a library, so the interface is its card catalogue.

- **Material**: a desk of buff paper (`--desk`), index cards (`--card`) with blue ruled lines and a red header rule, a divider tab on the top-left of important cards, a hard offset shadow instead of a soft one.
- **Type**: Barlow Condensed for labels, headings and buttons (drawer labels), Courier Prime for everything "typed" on a card (quest log, scores, tokens, the mentor's notes in italic), Source Serif 4 for running explanations, where a typewriter face would tire the eye.
- **Colour**: ink for text and actions, one red for the header rule and the stamps, brass for stars and progress, a green pencil for correct answers, a pen blue for links and selection. Semantic colours (good, warning, danger) come from the same five inks.
- **States as stamps**: CLEARED and ATTEMPTED on the result card, LOCKED / IN PROGRESS / COMPLETE on wing cards, WING BOSS on the last card of a wing, badges as stamped titles. The stamp lands with a short scale animation; there is no confetti.
- **Icons**: a small inline SVG stroke set (`shared/icon.ts`) replaces every emoji.
- **Tokens**: everything lives in `src/styles.scss`; the engines only use the semantic aliases (`--surface`, `--border`, `--accent`, `--success`…), so they took the new look without changes.

## Deliberate non-features

- No timers: speed teaches nothing here.
- No lives, hearts or energy: friction without pedagogy.
- No leaderboard or accounts: progress stays in the browser, the game stays free and anonymous.
- No sound by default.

## Ideas not implemented

- A daily "shelf" (one random quest with a small XP bonus).
- A final boss engine running a mini RAG pipeline end to end (chunk → retrieve → answer → verify).
- Translations of the content (the engines are language-agnostic).
