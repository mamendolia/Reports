# reports

Offline reporting tools for security awareness and human-risk programmes.

Each tool turns an export from a security platform into a dashboard and a client-ready report, **locally in the browser**: one self-contained HTML file, no server, no installation, no data leaving the analyst's machine.

> User interfaces and generated reports are in Italian. Italian overview: [README.it.md](README.it.md).

## Tools

| Tool | Input | Output | Latest |
|---|---|---|---|
| [knowbe4-training-report](knowbe4-training-report/) | KnowBe4 detailed training export (CSV/XLSX) | completion per tenant and group, management bodies, PPP, top performers, delivery plan vs. export; formatted Excel report | `knowbe4-training-report-v1.0.0` |

Download the ready-to-use HTML from each tool's `dist/` folder or from the matching [release](https://github.com/mamendolia/reports/releases).

## Conventions

Every tool in this repository follows the same rules:

- **Offline by construction.** A single HTML file with its libraries inlined and a Content Security Policy that blocks all network requests. Verifiable by disconnecting the network.
- **No real data in the repository.** Exports and reports (`*.csv`, `*.xlsx`, …) are git-ignored; demos run on fictitious sample data generated in the page.
- **Transparent interpretation.** Each tool lists how it read the input (status values, date formats, duplicates) so results can be checked against the source console.
- **Reproducible build.** `python3 build.py` inside the tool folder, standard library only; third-party libraries are vendored with their licences.
- **Independent versions.** Tags and releases are named `<tool>-vX.Y.Z`; each tool keeps its own `CHANGELOG.md`.

## Layout

```
reports/
├── <tool>/
│   ├── README.md, README.it.md, CHANGELOG.md, THIRD_PARTY_NOTICES.md
│   ├── build.py
│   ├── src/        source split into modules
│   ├── vendor/     pinned libraries and licences
│   ├── docs/       metric definitions and rules
│   └── dist/       built single-file HTML
├── LICENSE
├── .gitignore
└── .pre-commit-config.yaml   gitleaks and basic hygiene hooks
```

## Licence

MIT – see [LICENSE](LICENSE). Product names are trademarks of their respective owners; these tools are independent and not affiliated with the vendors whose exports they read.
