# FUORISCHEMA — AUDIT MASTER v1.2

> **STABILIZATION UPDATE** — questo documento aggiorna esclusivamente gli elementi già chiusi e verificati dopo il Master v1.1. Tutto ciò che non è esplicitamente aggiornato qui resta invariato e continua a fare riferimento a `FUORISCHEMA-AUDIT-MASTER-v1.1.md`.

## 0. STATO DEL DOCUMENTO

**Versione:** 1.2 — STABILIZATION UPDATE  
**Data:** 2026-08-28  
**Baseline:** `FUORISCHEMA-AUDIT-MASTER-v1.1.md`  
**Branch di lavoro:** `fix/battle-outfit-only`  
**Commit stabilizzazione:** `7caddaa` — `perf(fsocial): isolate battle data from global fetch`

### Regola
Questo aggiornamento non ridefinisce le aree ancora aperte del Master v1.1. Registra solo modifiche già implementate e verificate con test/runtime.

---

# 1. BATTLE — DIREZIONE PRODOTTO CONFERMATA

La Battle deve essere semplice e centrata sugli outfit.

Il flusso desiderato è:

`SFIDA → scegli outfit → invia → accettazione → scegli outfit → Battle → community vota → risultato`

### Decisione confermata
La UX Battle **NON richiede categorie**.

Nel challenge modal l'utente vede e seleziona esclusivamente il proprio outfit.

La vecchia UI:
- `SCEGLI LA CATEGORIA`;
- `BEST SNEAKERS`;
- `BEST FIT`;
- `ALL BLACK`;
- `MOST ORIGINAL`;
- `STREETWEAR`;
- `BEST OVERALL`

è stata rimossa dalla UX del challenge.

### Compatibilità backend
Il backend mantiene temporaneamente `category: "best_overall"` come valore interno di compatibilità.

Questa scelta **non reintroduce la categoria nella UX** e non modifica il modello/database delle Battle storiche.

**STATO: 🟢 DIREZIONE UX CONFERMATA E IMPLEMENTATA.**

---

# 2. BATTLE — WINDOW.FETCH GLOBALE CHIUSO

Nel Master v1.1 il monkey-patching globale di `window.fetch` era indicato come problema architetturale/performance.

### Prima
`fsocial-surgical-overrides.js` intercettava globalmente `window.fetch`, cercava le richieste `fsocial-battles?action=active` e copiava i dati in `activeBattleData`.

### Ora
Il dato delle Battle attive viene pubblicato direttamente dalla funzione proprietaria della Home:

`loadActiveBattles()`

→ `window.__FSOCIAL_ACTIVE_BATTLES__`

Il surgical layer legge questo bridge senza modificare `window.fetch`.

### Verifica runtime
È stato verificato sul browser reale:

- `fetch native: true`;
- `active battles: 1`;
- `battle cards: 1`;
- il bridge contiene effettivamente la Battle attiva.

**STATO: 🟢 CHIUSO.**

---

# 3. BATTLE HUB — DUPLICAZIONE PERCENTUALI CHIUSA

È stato individuato un bug nel layer `fsocial-surgical-overrides.js`.

`decorateBattleHub()` veniva eseguito periodicamente e aggiungeva nuove percentuali con `insertAdjacentHTML()` senza verificare se l'elemento fosse già presente.

Questo aveva prodotto un caso reale con circa `158` nodi percentuale DOM per una singola Battle.

### Correzione
Le percentuali vengono ora create una sola volta e successivamente aggiornate:

- un nodo per il challenger;
- un nodo per il challenged.

Il calcolo dei valori `total`, `p0` e `p1` non è stato modificato.

### Verifica runtime
Dopo oltre 30 secondi di polling:

- `percent nodes dopo 30s: 2`;
- le percentuali non continuano ad accumularsi.

**STATO: 🟢 CHIUSO.**

---

# 4. BATTLE — PROPRIETÀ FRONTEND DEL CHALLENGE

`fsocial-battle-challenge.js` resta il modulo proprietario del challenge frontend.

Nella stabilizzazione corrente:

- la selezione categoria nella UX è stata rimossa;
- la selezione dell'outfit resta obbligatoria;
- il submit avviene quando è disponibile un outfit;
- il backend riceve comunque `category: "best_overall"` internamente per compatibilità.

Le duplicazioni ulteriori presenti nei layer surgical **non sono considerate chiuse** solo per questa modifica e restano soggette alla mappatura prevista dal Master v1.1.

**STATO: 🟢 UX challenge outfit-only chiusa; 🟠 consolidamento dei duplicati ancora aperto.**

---

# 5. BATTLE — TEST END-TO-END CONFERMATO

È stato verificato un flusso reale:

`create → notification → accept → active Battle → Battle Hub`

La Edge Function `fsocial-battles` ha risposto con successo alle operazioni reali.

Durante il test sono stati osservati anche alcuni `401` sull'operazione `accept` prima di un successivo `200` con la sessione corretta.

Pertanto:

- il flusso Battle end-to-end è funzionante;
- il caso `401` intermittente **non è considerato definitivamente risolto**;
- non è stata modificata la security della Edge Function per inseguire il problema.

**STATO: 🟢 FLUSSO FUNZIONALE; 🟡 AUTH INTERMITTENTE DA INDAGARE.**

---

# 6. GIT / STABILIZZAZIONE

La stabilizzazione corrente è isolata in:

`fix/battle-outfit-only`

Commit:

`7caddaa perf(fsocial): isolate battle data from global fetch`

La branch è stata pushata su `origin/fix/battle-outfit-only`.

Il commit non modifica `main`; il `main` di riferimento resta separato finché la revisione/PR non viene completata.

**STATO: 🟢 BRANCH E COMMIT STABILI.**

---

# 7. AREE DEL MASTER v1.1 CHE RESTANO INVARIATE

Questo v1.2 **non chiude** e non ridefinisce i problemi ancora aperti del Master v1.1.

Restano quindi validi, tra gli altri:

- polling Home e altri polling ancora da razionalizzare;
- MutationObserver e ownership DOM ancora da mappare;
- duplicazioni ulteriori nei layer `surgical/final/override`;
- notifiche da auditare;
- bottom navigation da standardizzare;
- legacy files da verificare prima di eventuale archiviazione;
- review completa Supabase/RLS/SECURITY DEFINER/Edge Function;
- performance e metriche reali;
- Owner Panel;
- analytics;
- moderazione automatica;
- auth/email/account hardening;
- mobile/desktop/release hardening.

**Regola:** nessuno di questi punti viene considerato risolto da questo documento salvo quanto esplicitamente indicato nelle sezioni precedenti.

---

# 8. PRINCIPIO DI COERENZA

Questo aggiornamento segue il ciclo del Master:

`AUDIT → CAUSA → DIPENDENZE → PIANO → MODIFICA MINIMA → TEST → DIFF → COMMIT → PUSH → MASTER`

Non sono state introdotte nuove feature non essenziali.

Non sono stati rimossi file legacy alla cieca.

Non è stato modificato il controller Battle principale per risolvere problemi di presentazione nel surgical layer.

La priorità resta:

`STABILITÀ > SICUREZZA > ORDINE > MANUTENIBILITÀ > PERFORMANCE`

---

# 9. PROSSIMO PASSO

Continuare con una sola area alla volta, partendo dai conflitti e polling Battle già identificati nell'audit, senza introdurre nuovi `surgical/final/fix/override` come cerotti.

Prima di ogni modifica:

- verificare il proprietario;
- verificare chi importa/chi chiama;
- controllare dipendenze e sovrascritture;
- modificare il minimo necessario;
- testare;
- controllare il diff;
- commit e push;
- aggiornare il Master.

**Questo documento è un aggiornamento di stabilizzazione e non sostituisce il contenuto ancora aperto del Master v1.1.**
