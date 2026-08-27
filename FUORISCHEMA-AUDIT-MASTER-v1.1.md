# FUORISCHEMA — AUDIT MASTER

> Documento di riferimento tecnico e di prodotto. Scopo: uscire dal ciclo di modifiche/override senza controllo e trasformare FUORISCHEMA in un social stabile, fluido, sicuro e manutenibile.

## 0. STATO DEL DOCUMENTO

**Versione:** 1.1 — PRODUCT DIRECTION LOCK  
**Data:** 2026-08-27  
**Branch:** `main`  
**Documento precedente:** `FUORISCHEMA-AUDIT-MASTER.md`  
**Regola:** questo documento viene aggiornato dopo ogni blocco stabile; non sostituisce Git.

### Livelli di certezza

- **VERIFICATO** = osservato direttamente nel repository/Supabase o nel codice fornito durante l'audit.
- **DA VERIFICARE** = esiste un'indicazione concreta, ma serve un controllo ulteriore prima di modificarlo.
- **NON IMPLEMENTATO** = requisito desiderato ma non ancora presente.
- **LEGACY / FUORI SCOPE** = esistente tecnicamente ma non parte del prodotto desiderato.
- **NON TOCCARE** = comportamento/modulo che al momento non presenta un motivo sufficiente per essere modificato.

---

# 1. VISIONE DEL PRODOTTO — BLOCCATA

FUORISCHEMA deve essere un social orientato a moda, outfit, contenuti e community, con identità propria.

Non deve diventare un clone di Instagram o TikTok.

### Priorità definitive
1. fluidità;
2. affidabilità;
3. semplicità;
4. Home veloce;
5. immagini veloci e progressive;
6. mobile eccellente;
7. UX coerente;
8. Battle come elemento distintivo;
9. moderazione forte;
10. Owner Panel;
11. analytics e monitoring;
12. crescita senza accumulare cerotti.

### REGOLA D'ORO
**Prima stabilità, poi nuove feature.** Ogni modifica deve preservare le funzioni già funzionanti.

---

# 2. FUORI SCOPE — DECISIONI DEL PROPRIETARIO

## ❌ Stories
Le Stories **NON fanno parte del prodotto FUORISCHEMA per ora**.

Nel database/storage esistono già componenti `stories` e `story_views` e bucket relativi, ma questo non significa che debbano essere esposti o sviluppati.

**Decisione:** non aggiungere nuove funzionalità Stories e non collegarle alla UX principale. Eventuale pulizia futura solo dopo audit delle dipendenze e senza cancellazioni alla cieca.

## ❌ Messaggi / DM
I messaggi non sono una feature desiderata del prodotto.

Il database contiene `conversations`, `conversation_members` e `messages`, ma **non devono diventare parte della UX social** salvo futura decisione esplicita.

La funzione social desiderata è portare l'utente verso il profilo Instagram della persona interessata.

## ❌ Follower come meccanica centrale
Il prodotto non deve essere costruito attorno a follower/following come obiettivo principale.

La tabella `user_follows` esiste tecnicamente e va auditata prima di eventuale rimozione. Non aggiungere nuove UX follower senza decisione esplicita.

---

# 3. NUOVA FEATURE CENTRALE — LIVELLI UTENTE

Il social deve avere un sistema di **livello/progressione**.

### Principio
Il livello cresce automaticamente attraverso la partecipazione alla community, senza richiedere un sistema complicato.

Azioni candidate:
- partecipare/completare Battle;
- vincere Battle;
- pubblicare post;
- commentare;
- interagire con la community;
- altre interazioni positive che verranno definite nel design definitivo.

### Da progettare
Definire successivamente:
- punti per azione;
- livelli e soglie;
- eventuali badge;
- limiti anti-abuso;
- esclusione delle azioni spam/fake;
- visualizzazione del livello nel profilo e nei punti appropriati.

**Regola:** il livello non deve incentivare spam, like farming o commenti inutili. La progressione deve premiare partecipazione reale.

**STATO: NON IMPLEMENTATO — DA PROGETTARE DOPO LA STABILIZZAZIONE.**

---

# 4. DEFINIZIONE DI “PRONTO”

FUORISCHEMA sarà considerato pronto al pubblico quando:
- registrazione/login/reset password funzionano;
- Home/feed sono stabili e veloci;
- foto e asset principali caricano rapidamente;
- post, like, commenti e salvataggi funzionano;
- profilo personale/pubblico sono coerenti;
- ricerca è stabile;
- notifiche funzionano;
- Battle funziona end-to-end;
- report/block funzionano;
- Owner/Moderation sono protetti lato server;
- non ci sono bug bloccanti o errori JS/API critici noti;
- mobile/PWA sono verificati;
- desktop è verificato;
- performance è misurata;
- backup/rollback sono disponibili;
- aspetti legali/privacy necessari sono pronti;
- monitoring post-release è operativo.

**Stories, DM e follower non sono requisiti di release.**

---

# 5. REGOLA DI SVILUPPO — ZERO REGRESSIONI

Durante il consolidamento:
- niente nuove feature non essenziali;
- niente nuovi file `surgical/final/fix/override/v2` come cerotti;
- niente refactor massivi senza mappa dipendenze;
- niente cancellazioni di file legacy senza verificare chi li usa;
- una modifica funzionale alla volta;
- test prima del commit;
- `git diff --check`;
- controllo del diff;
- commit atomico;
- aggiornamento Master.

### Ciclo obbligatorio
`AUDIT → CAUSA → DIPENDENZE → PIANO → MODIFICA MINIMA → TEST → DIFF → COMMIT → PUSH → MASTER`

Se qualcosa rompe una funzione: **STOP → RESTORE/REVERT → analisi causa → nuova strategia.**

---

# 6. ARCHITETTURA ATTUALE

Frontend web/PWA + Supabase per Auth/Database/Storage/Edge Functions.

`supabase.js` carica condizionalmente molti moduli FSocial.

Su `Fsocial.html` risultano caricati diversi layer, inclusi navigation, safety, owner tools, bottom-nav fix, surgical overrides, battle vote override, surgical final e visual fixes.

### Giudizio
**🟠 DEBITO TECNICO ALTO**: più layer possono modificare la stessa UI/comportamento.

### Obiettivo
Ogni responsabilità deve avere un **proprietario tecnico unico**.

---

# 7. PERFORMANCE — PRIORITÀ CRITICA

Problemi verificati/da approfondire:
- monkey-patching globale `window.fetch` nel surgical override;
- polling Battle Hub ogni 500 ms;
- MutationObserver su `document.body` in alcuni moduli;
- più layer che modificano DOM e classi;
- possibile lavoro DOM ripetuto;
- query Supabase da profilare;
- immagini/media da ottimizzare.

### Obiettivo Home
- shell immediatamente utilizzabile;
- immagini progressive e ottimizzate;
- thumbnail/dimensioni corrette;
- query non duplicate;
- richieste minimizzate;
- niente polling continuo se non indispensabile;
- niente lavoro Battle fuori contesto;
- DOM leggero.

### Metriche
LCP, CLS, INP, JS/CSS iniziale, richieste iniziali, durata query, API error rate, upload failure rate, JS errors.

**STATO: 🔴 DA COMPLETARE.**

---

# 8. BOTTOM NAVIGATION

La bottom navigation è una parte core e deve risultare coerente tra Home e Profilo.

Problema riportato: posizione verticale percepita diversa tra Home e Profilo.

**STATO: 🔴 DA VERIFICARE E STANDARDIZZARE.**

Da testare su iOS, Android, PWA, browser mobile, safe-area/notch, tastiera e touch.

**NON TOCCARE alla cieca.** Prima ricostruire i CSS/layer che la controllano.

---

# 9. BATTLE — SPECIFICA PRODOTTO

La Battle deve essere semplice e centrata sugli outfit:

`SFIDA → scegli outfit → invia → accettazione → scegli outfit → Battle → community vota → risultato`

### NON desiderato
Non trasformare la sfida in un sistema pieno di categorie/opzioni obbligatorie.

Le categorie backend attuali sono da considerare **legacy/product decision pending** finché non viene definito il modello definitivo.

### Backend verificato
Edge Function `fsocial-battles`:
- versione attiva 4;
- `verify_jwt=false` con verifica manuale Bearer/auth;
- usa service role internamente;
- gestisce active/public/create/accept/decline/vote/complete;
- verifica ownership dei post;
- verifica block;
- impedisce voto sulla propria Battle;
- hash voter token;
- gestisce duplicate vote;
- durata attuale 24 ore;
- vincitore lato server.

### Rischi da verificare
- superficie pubblica con `verify_jwt=false`;
- service-role paths;
- comportamento `complete` dopo scadenza;
- possibile N+1 nel listing active;
- duplicazione di logica frontend Battle.

**STATO: 🟠 CORE PRESENTE, CONSOLIDAMENTO NECESSARIO.**

---

# 10. POST

## Esistente
- pubblicazione;
- caption/content;
- like;
- commenti;
- salvataggi;
- hashtag/mention;
- report/block correlati.

## Da aggiungere
### Modifica caption
L'autore deve poter modificare la caption del proprio post.

### Menu `⋯`
Ogni post dovrà avere un menu contestuale con almeno:
- Segnala post;
- eventuali azioni dell'autore/owner;
- future azioni da decidere.

Le azioni devono essere autorizzate lato server.

**STATO: caption edit + menu post = DA IMPLEMENTARE.**

---

# 11. SAVED / SALVATI

I salvataggi esistono nel database (`post_saves`).

**Da fare:** migliorare estetica e UX della sezione Salvati senza cambiare la logica funzionante finché non è auditata.

---

# 12. PROFILO

Il profilo personale esiste e possiede già diversi layer.

Da preservare:
- galleria/post;
- navigazione;
- ranking/battle record dove già funzionanti.

Da rivedere:
- layout;
- bottom nav;
- salvati;
- impostazioni;
- collegamento Instagram;
- livello utente futuro.

**NON aggiungere follower come elemento centrale.**

---

# 13. NOTIFICHE

Database `notifications` presente.

Da rivedere:
- struttura degli eventi;
- priorità;
- lettura/non lettura;
- grouping;
- estetica;
- comportamento mobile;
- notifiche Battle;
- evitare duplicati.

**STATO: CORE PRESENTE, AUDIT + UX DA RIVEDERE.**

---

# 14. RICERCA

La ricerca attuale cerca realmente persone.

Da verificare:
- performance;
- risultati;
- ranking;
- empty states;
- eventuale ricerca post/hashtag/Battle solo se utile al prodotto.

**STATO: FUNZIONE PRESENTE, EVOLUZIONE DA DECIDERE.**

---

# 15. VIDEO — FUTURO

Non vogliamo creare TikTok.

Direzione da esplorare: un'area Video proprietaria, prendendo solo concetti utili da Instagram/TikTok e adattandoli a FUORISCHEMA.

Possibile principio:
- video outfit/style;
- formato verticale;
- feed dedicato;
- interazioni coerenti con il social;
- nessun tentativo di trasformare FUORISCHEMA in una piattaforma short-video generalista.

**STATO: NON IMPLEMENTATO — DA PROGETTARE DOPO LA STABILIZZAZIONE.**

---

# 16. IMPOSTAZIONI

Da creare/riordinare come centro impostazioni unico.

Funzioni candidate:
- privacy;
- attività/visibilità;
- utenti bloccati;
- sblocco utenti;
- account;
- sicurezza;
- email/password;
- collegamento Instagram;
- eliminazione account;
- preferenze notifiche.

### Block / Unblock
`user_blocks` esiste.

Manca la UX completa per **sbloccare** un utente: deve essere disponibile nelle impostazioni.

**STATO: block presente, unblock UX da implementare.**

---

# 17. INSTAGRAM

Il profilo deve valorizzare il collegamento Instagram quando presente.

Da verificare:
- validazione/normalizzazione username;
- link sicuro;
- UX mobile;
- privacy.

---

# 18. OWNER PANEL — PRIORITÀ ALTA

Il centro moderazione attuale non è sufficiente come sistema di controllo generale.

### Owner Panel desiderato
1. Dashboard;
2. utenti;
3. post;
4. commenti;
5. report;
6. Battle;
7. sanzioni/blocchi;
8. contenuti rimossi;
9. analytics;
10. logs;
11. feature flags;
12. configurazione;
13. manutenzione;
14. sicurezza;
15. audit log.

### Potere Owner
Secondo autorizzazioni server-side:
- eliminare post/commenti;
- sospendere/bloccare utenti;
- gestire report;
- annullare Battle;
- intervenire sui contenuti;
- vedere analytics;
- configurare parametri;
- attivare/disattivare feature;
- maintenance mode;
- vedere log.

**Mai affidare il potere alla UI.**

### Ruoli
Supportare ruoli chiari Owner/Admin e permessi espliciti lato server. Non hardcodare nuove email direttamente nella UI quando un ruolo server-side risolve il problema.

---

# 19. SYSTEM CONFIGURATION

L'Owner deve poter configurare senza modificare codice, dove appropriato:
- durata Battle;
- categorie/attivazione categorie;
- limiti;
- feature flags;
- maintenance mode;
- messaggi di sistema;
- soglie moderazione;
- rate limits.

La configurazione deve avere validazione, audit log, default, limiti min/max e permessi Owner/Admin.

---

# 20. ANALYTICS

Analytics serve a capire **cosa fanno gli utenti e dove il prodotto funziona o fallisce**.

### KPI iniziali
- utenti registrati;
- utenti attivi giornalieri/settimanali/mensili;
- retention;
- nuovi utenti;
- post pubblicati;
- engagement;
- commenti;
- salvataggi;
- Battle create/accepted/completed;
- voti;
- utenti che raggiungono nuovi livelli;
- report;
- moderazioni;
- upload falliti;
- errori;
- performance.

Separare Product Analytics, Technical Monitoring e Moderation Analytics.

**STATO: NON IMPLEMENTATO / DA PROGETTARE.**

---

# 21. MODERAZIONE AUTOMATICA

Pipeline desiderata:
`UPLOAD/POST → controllo automatico → rischio → pubblica/review/blocca`

Categorie minime:
- nudità/sessualità;
- violenza/gore;
- odio;
- spam;
- altro abuso rilevante.

Per casi dubbi: review umana Owner/Admin.

**STATO: NON IMPLEMENTATO.**

---

# 22. ANTISPAM / ANTIABUSO

Da progettare:
- rate limits;
- CAPTCHA/challenge quando necessario;
- segnali device/IP con attenzione privacy;
- limiti azioni;
- anti-flood;
- anti-vote farming;
- anti-like farming;
- anti-comment spam;
- protezione scraping dove appropriato.

Particolare attenzione al sistema Level: le azioni che danno punti devono essere protette da farming artificiale.

---

# 23. DATABASE / RELAZIONI

Tabelle public verificate includono Battle, social, profili, notifiche, report, block, follow e strutture legacy per Stories/DM.

Il database possiede già molte foreign key, indexes e unique constraints sensate.

Ogni relazione definitiva va verificata per:
- foreign key;
- indexes;
- constraints;
- RLS;
- unique constraints;
- cascade rules;
- timestamps;
- ownership.

### Level
Non creare una nuova struttura per il Level finché non è definito il modello. Valutare prima `fsocial_reputation`, `fsocial_badges` e strutture esistenti.

---

# 24. RLS / DATABASE SECURITY

Risultati già rilevati durante audit:
- RLS attivo senza policy su alcune tabelle Battle/newsletter;
- alcune `SECURITY DEFINER` esposte a `authenticated` da riesaminare;
- `fsocial_battle_records` segnalata come security-definer view;
- leaked-password protection Supabase disattivata.

**Regola:** non aggiungere policy a caso. Per ogni tabella definire access matrix:
`public / anon / authenticated / owner / admin / service-role`.

**STATO: 🔴 DA CHIUDERE PRIMA DELLA RELEASE.**

---

# 25. STORAGE / MEDIA

Bucket verificati includono avatar, post e strutture Stories.

Stories fuori scope nonostante la presenza tecnica.

### Obiettivo media
Per i post:
- compressione;
- dimensioni corrette;
- thumbnail/responsive images;
- lazy loading;
- caching;
- evitare immagini enormi sul mobile.

Video futuro richiederà pipeline media dedicata.

---

# 26. MOBILE

Social mobile-first.

Da verificare realmente:
- responsive;
- safe area;
- tastiera;
- touch;
- swipe/gesture dove utili;
- bottom navigation;
- notch;
- iOS;
- Android;
- PWA;
- performance;
- upload;
- scrolling;
- modal/overlay.

**STATO: AUDIT FISICO NECESSARIO.**

---

# 27. DESKTOP

Da verificare:
- layout;
- sidebar/nav;
- hover;
- mouse;
- keyboard;
- responsive;
- grandi monitor;
- performance.

---

# 28. EMAIL / AUTH

Da ricontrollare end-to-end:
- registrazione;
- verifica email;
- password dimenticata;
- reset password;
- cambio email;
- eventuali notifiche email;
- template;
- mittente;
- deliverability;
- redirect;
- errori;
- rate limits;
- sicurezza token.

**STATO: DA AUDITARE PRIMA DEL LANCIO.**

---

# 29. ELIMINAZIONE ACCOUNT

Il creator/utente deve poter eliminare il proprio account.

Da definire:
- conferma;
- re-authentication dove necessario;
- eliminazione/anonimizzazione dati;
- media;
- post;
- commenti;
- Battle;
- report necessari per conservazione legale;
- cascata DB;
- tempi e comunicazioni.

**STATO: DA VERIFICARE/IMPLEMENTARE.**

---

# 30. MONITORING POST-RELEASE

Da introdurre:
- server errors;
- JS errors;
- API errors;
- latency;
- DB errors;
- failed logins;
- failed uploads;
- crash;
- 404;
- 500;
- performance regressions.

---

# 31. BACKUP / DISASTER RECOVERY

Da predisporre:
- backup DB;
- backup Storage;
- versionamento;
- rollback;
- procedura recovery;
- verifica periodica dei backup.

Un backup non è valido finché non è stato testato il restore.

---

# 32. LEGALE / PRIVACY

Prima del pubblico:
- Privacy Policy;
- Terms & Conditions;
- Cookie policy dove applicabile;
- gestione consensi;
- GDPR;
- diritto cancellazione;
- eventuale esportazione dati;
- gestione segnalazioni;
- obblighi specifici applicabili.

Questa parte richiede verifica professionale legale prima del lancio.

---

# 33. ARCHITETTURA JS — PULIZIA

`fsocial-surgical-overrides.js` ha accumulato responsabilità e override.

È già stato ripulito da legacy Battle vote e legacy profile nei commit:
- `d46d616` — remove unused battle vote legacy;
- `ce4a6a1` — remove unused profile legacy.

Resta da consolidare il blocco:
`activeBattleData → window.fetch override → decorateBattleHub → setInterval(500ms)`.

`fsocial-surgical-final.js` contiene anch'esso molte responsabilità e MutationObserver/DOM manipulation.

**Obiettivo:** non eliminare a caso. Mappare ogni responsabilità, assegnarla al modulo proprietario, testare, quindi rimuovere duplicazioni.

---

# 34. MAPPA DI PROPRIETÀ — REGOLA FUTURA

Per ogni componente deve esistere una sola risposta a:
- chi crea il DOM?
- chi applica lo stile?
- chi gestisce eventi?
- chi parla con Supabase?
- chi gestisce autorizzazione?
- chi aggiorna lo stato?

Se due file fanno la stessa cosa, è **potenziale conflitto** finché non viene dimostrato il contrario.

---

# 35. ORDINE UFFICIALE DEI LAVORI

## FASE 0 — FREEZE
Nessuna feature non essenziale.

## FASE 1 — AUDIT COMPLETO
Ricostruire repository + Supabase + flussi + dipendenze.

## FASE 2 — STABILIZZAZIONE
1. errori bloccanti;
2. conflitti JS/CSS;
3. bottom nav;
4. Home/feed;
5. performance immagini;
6. Battle;
7. profilo;
8. notifiche;
9. ricerca;
10. saved.

## FASE 3 — SECURITY
1. RLS;
2. RPC/SECURITY DEFINER;
3. Edge Functions;
4. Auth;
5. Storage;
6. antiabuso.

## FASE 4 — OWNER / MODERATION
1. Owner Panel;
2. centro moderazione;
3. unblock;
4. post menu/report;
5. auto-moderation;
6. audit logs;
7. system configuration.

## FASE 5 — PRODUCT CORE
1. edit caption;
2. notifiche finali;
3. saved UX;
4. Level system;
5. impostazioni.

## FASE 6 — ANALYTICS / MONITORING
Analytics + technical monitoring + moderation metrics.

## FASE 7 — AUTH / EMAIL / ACCOUNT
Email flows + account deletion + privacy flows.

## FASE 8 — RELEASE HARDENING
Mobile + desktop + PWA + performance + backup/restore + legal.

## FASE 9 — FUTURO
Solo dopo stabilità:
- Video;
- eventuali nuove funzioni ricerca;
- altre feature community.

Stories/DM/follower non entrano automaticamente in roadmap.

---

# 36. REGRESSION CHECKLIST

Prima di ogni release verificare almeno:

### Auth
- register
- login
- logout
- reset password
- session persistence

### Feed
- load
- scroll
- image load
- like
- comment
- save
- share
- post creation
- caption

### Profile
- own profile
- public profile
- posts
- saved
- Instagram link
- settings
- block/unblock

### Battle
- challenge
- outfit selection
- accept
- vote
- timer
- result
- record/ranking

### Notifications
- creation
- display
- read/unread
- navigation
- Battle notifications

### Search
- user search
- results
- navigation

### Moderation
- report post
- report user
- block
- unblock
- owner review

### Mobile
- iOS
- Android
- PWA
- safe-area
- keyboard
- touch

### Desktop
- layout
- navigation
- mouse
- keyboard
- responsive

### Performance
- initial load
- image load
- scroll
- interaction latency
- API latency
- console errors

---

# 37. DEFINIZIONE OPERATIVA DEL MASTER

Questo documento è la **fonte di direzione del progetto**, non una licenza a modificare tutto.

Quando una futura richiesta entra in conflitto con questo documento, bisogna prima aggiornare la direzione del prodotto e poi implementare.

### Regola assoluta
**Non dobbiamo più “aggiustare una cosa rompendo un'altra”.**

Se non conosciamo le dipendenze di una modifica, prima facciamo audit.

Se una parte funziona, viene considerata **NON TOCCARE** finché non c'è una ragione concreta per intervenire.

---

# 38. PROSSIMO PASSO

**NON iniziare ancora nuove feature.**

Prossimo obiettivo tecnico: completare la mappatura dell'architettura attuale e dei conflitti, quindi procedere con stabilizzazione e performance partendo dai problemi più gravi.

Solo quando una fase è stabile si passa alla successiva.
