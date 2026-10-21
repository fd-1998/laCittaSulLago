# Specifica tecnica — Migrazione Supabase → PostgreSQL + Express API
## Progetto: Lecco – la Città sul Lago

### 1. Obiettivo

Completare la migrazione del backend del sito web da Supabase a un'infrastruttura self-hosted composta da:

- PostgreSQL 17 per il database.
- API REST sviluppata con Node.js ed Express.
- Docker Compose per l'esecuzione dei servizi.
- Tailscale Funnel come possibile punto di accesso pubblico all'API, da configurare solo dopo aver completato e verificato le misure di sicurezza.

Il frontend esistente deve continuare a funzionare correttamente, mantenendo le funzionalità attuali. La migrazione deve avvenire per fasi, senza eliminare o modificare il progetto Supabase originale fino alla verifica completa del nuovo sistema.

### 2. Ambiente attuale

Il progetto è installato sul server Ubuntu `fil-homeserver`, nella directory:

`/opt/docker/supabase-site/`

La struttura comprende:

- `compose.yaml`: configurazione Docker Compose dedicata al progetto.
- `.env`: variabili di configurazione e credenziali.
- `backups/supabase-public-20261020-095028.dump`: dump originale del database Supabase.
- `postgres/data/`: dati persistenti di PostgreSQL.
- `uploads/`: directory predisposta per eventuali file locali.
- `api/`: codice del backend Express.

Servizi Docker dedicati:

| Servizio | Container | Configurazione |
|---|---|---|
| PostgreSQL | `cittalago-db` | PostgreSQL 17 Alpine, database `cittalago` |
| API Express | `cittalago-api` | Immagine `supabase-site-api` |
| Porta API host | — | `127.0.0.1:13000` → porta 3000 del container |
| Porta PostgreSQL host | — | Non pubblicata |

La rete Docker del progetto è `supabase-site_backend`.

L'API dispone già degli endpoint di verifica:

- `GET /health`
- `GET /api/db-check`

Entrambi sono stati testati con risposta HTTP 200. Il database contiene dieci tabelle:

- `historical_periods`
- `note_groups`
- `notes`
- `place_historical_layers`
- `place_images`
- `place_podcast_episodes`
- `places`
- `podcast_episodes`
- `place_tags`
- `tags`

Sono stati verificati i seguenti conteggi: 15 record in `places`, 5 in `notes`, 5 in `podcast_episodes` e 5 in `tags`. Questi valori costituiscono un controllo iniziale, non una certificazione di completa equivalenza con Supabase.

**Prima attività dell'agente:** ispezionare il repository, il frontend, il backend esistente, il dump e la configurazione Docker. Non assumere che la specifica descriva tutte le funzionalità già presenti.

### 3. Regole operative obbligatorie

1. Non modificare né eliminare il progetto Supabase originale.
2. Non eseguire comandi globali quali `docker compose down -v` nella directory principale `/opt/docker`.
3. Non interrompere, ricreare o modificare container appartenenti ad altri servizi dell'homeserver.
4. Non eliminare il database o il volume PostgreSQL durante le normali attività di sviluppo.
5. Non inserire password, token o chiavi segrete nel codice, nei log, nei commit o nella documentazione pubblica.
6. Non modificare il frontend per puntare alla nuova API finché gli endpoint richiesti non sono implementati e testati.
7. Non esporre PostgreSQL direttamente su Internet.
8. Effettuare modifiche piccole, verificabili e documentate; conservare la possibilità di tornare alla configurazione precedente.

Prima di modificare file esistenti, esaminarli e comprenderne il funzionamento. Non sovrascrivere configurazioni senza verificare eventuali modifiche già presenti.

### 4. Fase A — Analisi del frontend e inventario Supabase

Esaminare l'intero repository del frontend, identificando:

- Tutte le chiamate a Supabase.
- Tabelle e viste utilizzate.
- Query `select`, `insert`, `update`, `delete` e join.
- Filtri, ordinamenti, paginazione e relazioni.
- Funzionalità di autenticazione e gestione delle sessioni.
- Eventuali sottoscrizioni Realtime.
- Upload, download e visualizzazione delle immagini.
- Funzioni RPC, trigger o altre funzionalità specifiche Supabase.
- Variabili d'ambiente contenenti URL e chiavi Supabase.
- Pagine, componenti e funzionalità che dipendono da ciascuna chiamata.

Produrre un inventario Markdown, ad esempio `docs/supabase-inventory.md`, con una tabella che riporti:

- Funzionalità del sito.
- Tabelle coinvolte.
- Operazioni effettuate.
- Endpoint API richiesto.
- Requisiti di autenticazione e autorizzazione.
- Dipendenze specifiche Supabase.
- Test necessari.

Non rimuovere il client Supabase prima di aver completato l'inventario.

### 5. Fase B — Verifica dello schema e dei dati

Verificare che il database locale corrisponda allo schema richiesto dal frontend.

Controllare:

- Tutte le tabelle e le relative colonne.
- Tipi di dati, valori predefiniti e campi nullable.
- Chiavi primarie e chiavi esterne.
- Vincoli `UNIQUE` e `CHECK`.
- Indici.
- Sequence e generatori di identificativi, se presenti.
- Trigger e funzioni.
- Policy RLS eventualmente contenute nel dump.
- Integrità referenziale e record orfani.
- Numero di record di ogni tabella, confrontandolo con il database sorgente o con un'esportazione affidabile.

Verificare in particolare se il dump contiene le definizioni complete delle funzioni e delle policy RLS. Non presumere che le policy Supabase siano sufficienti o equivalenti alle autorizzazioni dell'API Express.

Produrre `docs/database-verification.md` con risultati, anomalie e azioni correttive.

Non modificare o ricreare il database per correggere problemi senza aver prima documentato la discrepanza e predisposto un backup.

### 6. Fase C — Progettazione dell'API REST

Completare il backend Express esistente, preferendo un'architettura semplice e manutenibile:

- Routing separato per risorsa.
- Controller o handler HTTP.
- Livello di accesso ai dati tramite query parametrizzate.
- Middleware condivisi per autenticazione, autorizzazione, validazione ed errori.
- Configurazione centralizzata tramite variabili d'ambiente.
- Log essenziali senza dati sensibili.

Usare il client PostgreSQL ufficiale per Node.js (`pg`) oppure una libreria già presente nel progetto, se adeguata. Non introdurre un ORM pesante senza una motivazione concreta.

Progettare gli endpoint sulla base delle chiamate realmente presenti nel frontend. Non inventare un'API generica che costringa a riscrivere inutilmente le funzionalità esistenti.

Come base di progettazione, valutare:

- `GET /api/places`
- `GET /api/places/:id`
- `GET /api/tags`
- `GET /api/historical-periods`
- `GET /api/notes`
- `GET /api/podcast-episodes`

Aggiungere eventuali endpoint per immagini, gruppi di note, livelli storici e associazioni luogo-tag, sulla base dell'inventario.

Gli endpoint di esempio non sono un contratto definitivo: parametri, campi restituiti, filtri e join devono corrispondere alle necessità effettive del frontend.

Definire una convenzione uniforme per:

- Risposte JSON.
- Errori HTTP.
- Validazione dei parametri.
- Paginazione.
- Ordinamento e filtri consentiti.
- Gestione dei record non trovati.

Usare query SQL parametrizzate per evitare SQL injection. Non interpolare direttamente input dell'utente nelle query.

### 7. Fase D — Sicurezza

L'API deve essere progettata per un'eventuale esposizione pubblica.

Requisiti minimi:

- Accesso a PostgreSQL soltanto dalla rete Docker privata.
- Nessuna porta PostgreSQL pubblicata sull'host.
- Validazione rigorosa dei parametri di ingresso.
- Query parametrizzate.
- Gestione sicura degli errori senza stack trace o dettagli interni in produzione.
- Limiti ragionevoli di dimensione delle richieste.
- Rate limiting sugli endpoint pubblici e su quelli sensibili.
- CORS limitato alle origini effettivamente necessarie; non considerarlo un sistema di autenticazione.
- Protezione contro accessi non autorizzati, enumerazione e operazioni abusive.
- Credenziali e segreti esclusivamente in variabili d'ambiente.
- Utente PostgreSQL dedicato all'applicazione con privilegi minimi necessari.
- Nessun utilizzo del superuser PostgreSQL da parte dell'API.
- Log privi di password, token, cookie e dati personali non necessari.

**Autenticazione e autorizzazione:** distinguere chiaramente le operazioni pubbliche di lettura dalle operazioni riservate agli amministratori. Prima di implementare le operazioni di scrittura, identificare come il sito autentica attualmente gli amministratori e definire una strategia equivalente o più sicura.

Non fidarsi di un semplice identificativo utente inviato dal browser. Verificare lato server identità, sessione o token e permessi per ogni operazione protetta.

Non esporre endpoint di scrittura finché il modello di autenticazione non è implementato e testato. Se il sito non richiede attualmente scritture pubbliche, mantenere le scritture riservate agli amministratori.

### 8. Fase E — Migrazione dello Storage

Individuare tutti gli oggetti presenti in Supabase Storage e tutti i riferimenti alle immagini nel database.

Definire una strategia per trasferire i file nella directory persistente prevista dal progetto, evitando di usare il filesystem effimero del container.

Requisiti:

- Copiare gli oggetti mantenendo percorsi e nomi, quando possibile.
- Preservare le relazioni tra record e file.
- Gestire correttamente nomi con caratteri speciali e spazi.
- Verificare che ogni immagine referenziata esista.
- Evitare sovrascritture accidentali e conservare un backup.
- Definire come servire le immagini, con autorizzazioni coerenti con la loro visibilità.
- Usare volumi persistenti e permessi filesystem appropriati.

Non considerare completata la migrazione soltanto perché le righe della tabella `place_images` sono presenti: i file binari devono essere trasferiti e verificati separatamente.

### 9. Fase F — Test automatici

Implementare test automatici per il backend e, dove praticabile, test d'integrazione con PostgreSQL.

Verificare almeno:

- Health check e connessione al database.
- Lettura delle risorse pubbliche.
- Filtri, ordinamenti, paginazione e join.
- Identificativi non validi e record inesistenti.
- Input malformati.
- Errori di database.
- Tentativi di SQL injection.
- Accesso non autorizzato agli endpoint protetti.
- Permessi amministrativi.
- Limiti delle richieste e rate limiting.
- Gestione di file mancanti e immagini non disponibili.
- Corrispondenza tra risposte API e dati attesi dal frontend.

Aggiungere uno script riproducibile per eseguire i test e documentarne i risultati.

I test devono poter essere eseguiti senza cancellare o modificare dati di produzione.

### 10. Fase G — Integrazione del frontend

Solo dopo il completamento delle fasi precedenti:

1. Introdurre un client HTTP centralizzato per l'API.
2. Sostituire progressivamente le chiamate Supabase con chiamate REST equivalenti.
3. Mantenere invariati comportamento, contenuti e interfaccia del sito.
4. Gestire caricamento, errori, timeout e assenza di dati.
5. Verificare tutte le pagine e i percorsi utente.
6. Rimuovere le dipendenze Supabase non più necessarie soltanto dopo aver verificato che non vengano più utilizzate.
7. Eliminare dal bundle frontend le chiavi e le configurazioni Supabase obsolete quando la migrazione è completa.

Non inserire segreti nel frontend. Gli eventuali token pubblici non devono essere confusi con credenziali amministrative.

Predisporre una configurazione che consenta di scegliere l'URL dell'API tramite variabile d'ambiente, senza hardcodare indirizzi locali nell'applicazione distribuita.

### 11. Fase H — Accesso remoto e pubblicazione

Valutare Tailscale Funnel per esporre esclusivamente l'API HTTP, senza pubblicare PostgreSQL.

Prima dell'attivazione verificare:

- Quali endpoint saranno pubblici.
- Quali operazioni richiederanno autenticazione.
- Che non siano raggiungibili endpoint di debug o amministrativi.
- Che il servizio non restituisca stack trace o segreti.
- Che i limiti di richieste siano adeguati.
- Che l'accesso ai file sia coerente con le autorizzazioni.
- Che il frontend possa raggiungere l'API dall'ambiente effettivo in cui viene distribuito.

Verificare la compatibilità di Tailscale Funnel con il dominio, il flusso di accesso e le necessità del sito. Non attivare l'esposizione pubblica automaticamente come parte dell'installazione.

### 12. Fase I — Docker e gestione operativa

Mantenere i servizi isolati nel Compose dedicato a `/opt/docker/supabase-site/`.

Verificare:

- Health check del database e dell'API.
- Riavvio automatico appropriato.
- Persistenza dei dati PostgreSQL.
- Persistenza dei file caricati.
- Gestione ordinata delle connessioni al database.
- Chiusura corretta delle connessioni durante lo shutdown.
- Log e procedure di diagnosi.
- Compatibilità con gli aggiornamenti delle immagini.
- Nessuna modifica ai servizi estranei al progetto.

Documentare i comandi di avvio, arresto, aggiornamento e controllo, evitando comandi distruttivi.

### 13. Backup e ripristino

Definire una procedura riproducibile per:

- Backup PostgreSQL.
- Backup dello Storage.
- Conservazione delle credenziali in modo sicuro.
- Verifica dell'integrità dei backup.
- Ripristino su un database di prova.
- Ripristino completo dopo un guasto.

Un backup è considerato affidabile soltanto dopo aver verificato che possa essere ripristinato.

Conservare il dump originale di Supabase fino al completamento della migrazione e alla validazione finale.

### 14. Modalità di lavoro dell'agente

Procedere per fasi, con commit o checkpoint quando possibile.

All'inizio:

1. Esaminare la struttura dei file e lo stato Git.
2. Leggere `compose.yaml`, `.env` senza mostrare i segreti, il codice API e le configurazioni frontend.
3. Individuare le chiamate Supabase e le funzionalità effettive.
4. Presentare un piano basato sul codice trovato.
5. Segnalare le informazioni mancanti e i rischi prima di apportare modifiche distruttive.

Durante il lavoro:

- Preferire modifiche incrementali.
- Eseguire lint, build e test dopo ogni gruppo di modifiche.
- Non dichiarare conclusa una fase senza evidenze verificabili.
- Non inventare endpoint, record, configurazioni o risultati di test.
- Non cambiare password, policy, configurazioni di rete o servizi senza necessità documentata.
- Fermarsi e chiedere conferma prima di operazioni irreversibili, migrazioni distruttive o attivazione dell'esposizione pubblica.

Al termine di ogni fase, riportare:
- File modificati.
- Funzionalità completate.
- Test eseguiti e relativi risultati.
- Problemi residui.
- Eventuali azioni richieste all'utente.

### 15. Criteri di accettazione finali

La migrazione può essere considerata completa quando:

- Tutte le funzionalità attualmente presenti nel sito sono state inventariate e verificate.
- Lo schema e i dati del database locale sono coerenti con la sorgente.
- Tutte le operazioni richieste dal frontend sono disponibili nell'API.
- Le autorizzazioni sono applicate lato server.
- Gli endpoint sono coperti da test adeguati.
- Le immagini e gli altri file necessari sono stati trasferiti e verificati.
- Il frontend funziona senza dipendenze operative da Supabase, salvo eventuali componenti esplicitamente mantenuti.
- L'API funziona dopo il riavvio dei container.
- PostgreSQL non è pubblicato su Internet.
- I backup sono stati verificati tramite una prova di ripristino.
- La documentazione operativa è aggiornata.
- Il progetto Supabase originale può essere dismesso solo dopo un periodo di verifica e una conferma esplicita dell'utente.

**Risultato atteso:** un sito funzionante con frontend esistente, PostgreSQL self-hosted e API Express sicura, con dati e immagini persistenti, procedure di backup documentate e possibilità di ripristino senza dipendere da Supabase per le funzionalità migrate.