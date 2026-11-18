# knowbe4-training-report

*Part of [reports](../README.md).*

A single, self-contained HTML file that turns the **KnowBe4 detailed training export** into a training-completion dashboard and a formatted Excel report – **entirely offline, in the browser**. No server, no installation, no data leaves the machine.

Built for security awareness programmes that run across several tenants (companies of the same group) and need to answer, every month:

- how far each tenant – and the group as a whole – has completed the assigned training;
- whether the board / management bodies are trained;
- how phish-prone users are (PPP);
- who the best performers are, group-wide and per tenant;
- whether the delivery plan is on track (planned vs. delivered courses).

> The user interface and the generated report are in **Italian**. A short Italian overview is in [README.it.md](README.it.md).

---

## Privacy model

The tool is designed so that employee data never leaves the analyst's computer.

- **One local file.** `dist/knowbe4-training-report.html` contains the application and its two libraries inlined. Open it from disk; nothing is fetched.
- **Network blocked by policy.** The page ships a Content Security Policy (`default-src 'none'; connect-src 'none'; …`) so the browser itself refuses any outgoing request – even if the code were changed by mistake.
- **Verifiable.** Disconnect from the network, or open the browser's developer tools → *Network* tab while loading an export: there is no traffic.
- **Browser storage only for settings.** The delivery plan and manual course matches are saved in the browser's `localStorage`; training data is never stored.

## Quick start

1. Download `dist/knowbe4-training-report.html` (or the file attached to the latest `knowbe4-training-report-v*` [release](https://github.com/mamendolia/reports/releases)).
2. Open it in Chrome, Edge or Firefox. It starts with **fictitious sample data** (two tenants, 70 users).
3. In the KnowBe4 console export the detailed training activity (one row per assigned course) as CSV or XLSX and load it with **Export KnowBe4**.
4. Adjust the filters, then click **Scarica report Excel** for the formatted workbook or **Copia sintesi testuale** for an e-mail-ready summary.

## Expected input

The detailed training export, one row per course assigned to a user. Headers are matched case- and space-insensitively; extra columns are ignored.

| Column | Used for |
|---|---|
| `Email`, `First Name`, `Last Name` | user identity (anonymised files without them still work) |
| `Account` | tenant / company |
| `Groups` | KnowBe4 groups (multi-value; `,` `;` or `\|` detected) |
| `Campaign Name`, `Campaign Status` | campaign filter |
| `Content Name`, `Content Type`, `Content Duration` | course |
| `Training Status`, `Past Due` | status and lateness |
| `Enrolled On (UTC)`, `Started On (UTC)`, `Completed On (UTC)` | dates, period filter, speed |
| `Total Time Spent`, `Score` | time and test results |
| `Current PPP`, `Risk Score` | phish-prone percentage |

Only `Training Status` and `Content Name` are mandatory. Dates in ISO, `dd/mm/yyyy` or `mm/dd/yyyy` are detected automatically (overridable). Every interpretation – status values, `Past Due` values, date format, group separator, duplicates removed – is listed in the **Qualità dei dati** section so it can be checked against the console.

## What it shows

| Section | Content |
|---|---|
| **Totale gruppo** | completion, full completion, users in good standing, management bodies, average PPP, distinct courses, training hours |
| **Completamento per tenant** | one row per tenant plus a group total |
| **Piano di erogazione** | planned courses by month vs. what the export contains, completion per tenant |
| **Organi di gestione** | management bodies per tenant and by person |
| **Top del gruppo / per tenant** | best performers, with the scoring rule displayed |
| **Stato per utente**, **Qualità dei dati** | detail and data checks |

The **Excel report** opens on a *Cruscotto* sheet (KPI cards, tenant table with in-cell bars, top 5) followed by *Piano erogato*, *Organi di gestione*, *Top gruppo*, *Top per tenant*, *Utenti*, *Registro formazione* (full audit trail with filters) and *Note*. Percentages and dates are real numeric values; sheets are print-ready (landscape, fit to width).

Metric definitions, scoring and matching rules: [docs/metrics.md](docs/metrics.md).

## Build from source

```bash
cd knowbe4-training-report
python3 build.py        # writes dist/knowbe4-training-report.html
```

Python 3 standard library only. The source is split under `src/`:

```
src/head.html, src/body.html     page template and styles
src/js/01-parse.js               file reading, parsing, filters, de-duplication, aggregation
src/js/02-plan.js                delivery plan parsing and course matching
src/js/03-excel-report.js        formatted Excel workbook (ExcelJS)
src/js/04-app.js                 rendering, events, exports
src/js/*.inc.js                  data-quality notes and fictitious sample data
vendor/                          pinned third-party libraries and their licences
```

## Limitations

- UI and report labels are in Italian.
- Training statuses are interpreted from common KnowBe4 values (`Passed`, `Completed`, `In Progress`, `Not Started`, `Failed`, …); unknown values are inferred from the dates and flagged.
- "Past Due" relies on the flag exported by KnowBe4; the export has no due-date column.
- Plan-to-export matching is heuristic (normalised titles, a small Italian↔English alias table, *The Inside Man* episode numbers); unmatched courses can be paired manually in the page.
- Settings are per browser; there is no shared state between users.

## Licence

MIT – see [LICENSE](../LICENSE). Third-party components are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

KnowBe4 is a trademark of KnowBe4, Inc. This project is independent and not affiliated with or endorsed by KnowBe4.
