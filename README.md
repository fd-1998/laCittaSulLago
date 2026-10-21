# La Città sul Lago

Frontend React dell'atlante storico di Lecco.

## Configurazione API

In produzione frontend e API sono serviti dalla stessa origine attraverso Express e Tailscale Funnel. Non è necessaria alcuna variabile nel bundle.

Per lo sviluppo con un'API su un'altra origine, impostare:

```sh
VITE_API_URL=http://127.0.0.1:13000
```

L'API deve includere esplicitamente l'origine di sviluppo in `ALLOWED_ORIGINS`. Nessuna password o chiave amministrativa deve essere inserita nelle variabili `VITE_*`.

## Comandi

```sh
npm install
npm run lint
npm run build
```

Le rotte `/database` e `/add-location` richiedono un collaboratore autenticato; `/admin/users` richiede il ruolo admin. Ogni utente autenticato può cambiare la propria password in `/account`.
