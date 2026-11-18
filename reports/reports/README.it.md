# reports – sintesi in italiano

Strumenti di reportistica offline per programmi di security awareness e di gestione del rischio umano.

Ogni strumento trasforma l'export di una piattaforma di sicurezza in un cruscotto e in un report da consegnare al cliente, **in locale nel browser**: un unico file HTML, nessun server, nessuna installazione, nessun dato che esce dal PC.

## Strumenti

| Strumento | Cosa legge | Cosa produce |
|---|---|---|
| [knowbe4-training-report](knowbe4-training-report/README.it.md) | export dettagliato della formazione KnowBe4 | completamento per tenant e gruppo, organi di gestione, PPP, migliori utenti, piano di erogazione; report Excel formattato |

## Regole comuni

- Funzionamento offline garantito da una Content Security Policy che blocca la rete.
- Nessun dato reale nel repository: export e report sono esclusi da `.gitignore`, le demo usano dati fittizi.
- Ogni strumento mostra come ha interpretato i dati, per poterli verificare sulla console di origine.
- Build riproducibile con `python3 build.py`, librerie incluse con le loro licenze.
- Versioni indipendenti per strumento: tag `<strumento>-vX.Y.Z`.

Licenza MIT.
