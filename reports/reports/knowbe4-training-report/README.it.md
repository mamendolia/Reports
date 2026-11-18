# knowbe4-training-report – sintesi in italiano

Un unico file HTML che trasforma l'**export dettagliato della formazione KnowBe4** in un cruscotto di completamento e in un report Excel formattato. Funziona **offline nel browser**: nessun server, nessuna installazione, nessun dato esce dal PC.

## Cosa mostra

- completamento della formazione per **tenant** e per il **gruppo** nel suo insieme;
- utenti con formazione completa e **utenti in regola** (nessun corso scaduto aperto);
- **organi di gestione**, scelti tra i gruppi KnowBe4;
- **PPP** medio per tenant e per persona;
- **migliori utenti** del gruppo e di ogni tenant, con la regola di punteggio esplicitata;
- **piano di erogazione**: corsi previsti mese per mese confrontati con quelli presenti nell'export.

Il report Excel si apre con un foglio *Cruscotto* e contiene piano, organi di gestione, classifiche, utenti e il registro completo per l'audit.

## Riservatezza

- Il file contiene l'applicazione e le librerie: non scarica nulla.
- Una Content Security Policy impedisce al browser qualsiasi connessione di rete.
- Si verifica staccando la rete o guardando la scheda *Rete* degli strumenti per sviluppatori.
- Nel browser restano salvati solo piano e abbinamenti dei corsi, mai i dati della formazione.

## Uso

1. Scarica `dist/knowbe4-training-report.html` e aprilo con Chrome, Edge o Firefox.
2. Carica l'export dettagliato di KnowBe4 (CSV o XLSX), una riga per corso assegnato.
3. Imposta campagne, periodo, organi di gestione e piano.
4. *Scarica report Excel* oppure *Copia sintesi testuale*.

Definizioni delle metriche e regole di abbinamento: [docs/metrics.md](docs/metrics.md) (in inglese).

Fa parte del repository [reports](../README.it.md). Licenza MIT. KnowBe4 è un marchio di KnowBe4, Inc.; il progetto è indipendente e non affiliato.
