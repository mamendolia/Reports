# Metrics and rules

All figures are computed on the **perimeter** selected in the page: included campaigns, assignment period (`Enrolled On`) and de-duplication setting.

## Units

- **Assignment** (*Assegnazione*): one course assigned to one user. A tenant with 170 users and 7 courses each has about 1,200 assignments.
- **Distinct courses** (*Corsi distinti*): number of different `Content Name` values.
- **Courses per user** (*Corsi per utente*): assignments ÷ users with at least one assignment.

## De-duplication

1. Identical rows (same user, campaign, course, status and dates) are always removed.
2. Optional, on by default: the same course assigned to the same user in several campaigns counts once. The best outcome wins (completed > in progress / failed > not started); on a tie, the earliest completion or the most recent assignment. Removed rows stay in the *Registro formazione* sheet with a note.

## Training metrics

| Metric | Definition |
|---|---|
| **Completion** (*Completamento formazione*) | completed assignments ÷ assignments |
| **Full completion** (*Formazione completa*) | users with every assigned course completed ÷ users with assignments |
| **Users in good standing** (*Utenti in regola*) | users with no past-due course still open ÷ users with assignments. Users with open courses that are not yet due are in good standing. |
| **Users late** (*in ritardo*) | users with at least one past-due course not completed |
| **On time** (*In tempo*) | assignments completed without the `Past Due` flag ÷ assignments |
| **Management bodies** (*Organi di gestione*) | the same metrics restricted to users in the KnowBe4 groups selected as board / management (searchable list, *Suggerisci* proposes groups named like direzione, CdA, board, management, executive…), plus optional e-mail addresses |
| **PPP** | average `Current PPP` across users; shown per tenant and per person, not used in the ranking |

Colour thresholds follow the target set in the page (default 90%): green from the target, amber up to 15 points below, red otherwise.

## Ranking score (0–100)

| Weight | Component |
|---|---|
| 45% | completed ÷ assigned courses |
| 25% | completed on time ÷ assigned courses |
| 15% | speed: average days from assignment to completion (≤ 2 days = full, ≥ 30 days = zero) |
| 15% | average test score |

Missing components (e.g. no tests) are dropped and the remaining weights rescaled. Ties: more completed courses, then faster. Only users with at least one completed course are ranked. Names can be shown in full or abbreviated ("Giulia R.").

## Delivery plan

Paste two columns from Excel – month and course; rows without a month belong to the month above. A course planned in several months appears once.

| Status | Meaning |
|---|---|
| *Erogato* | the course is in the export within the current filters |
| *Escluso dai filtri* | the course is in the file but excluded by period or campaign filters |
| *Non trovato nell'export* | the month has passed and no matching course exists |
| *Da avviare (mese in corso)* / *Pianificato* | current or future month |

Matching between plan titles and `Content Name`:

1. normalised comparison (case, punctuation, quotes, leading zeros ignored);
2. a built-in Italian ↔ English alias table for catalogue titles (e.g. *Zona Pericolosa 2026* ↔ *2026 Danger Zone*);
3. *The Inside Man*: same season and episode number = same course, whatever the language;
4. otherwise token similarity ≥ 75%, never across different numbers (episode 01 ≠ 10);
5. manual pairing from the page, saved in the browser.

Courses in the export that are not in the plan are listed as *fuori piano*.
