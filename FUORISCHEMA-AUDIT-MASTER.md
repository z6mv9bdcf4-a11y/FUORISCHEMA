# FUORISCHEMA — AUDIT MASTER

> Documento di riferimento tecnico e di prodotto.  
> Scopo: uscire dal ciclo di modifiche/override senza controllo e trasformare FUORISCHEMA in un social stabile, fluido, sicuro e manutenibile.

## 0. STATO DEL DOCUMENTO

**Versione:** 1.0-baseline  
**Data:** 2026-08-27  
**Branch:** `main`  
**Ultimo commit noto prima di questo documento:** `ce4a6a1`  
**Stato Git noto:** working tree pulito dopo il refactor del legacy profile override.  
**Regola:** questo documento viene aggiornato dopo ogni blocco stabile; non sostituisce Git.

### Livelli di certezza

- **VERIFICATO** = osservato direttamente nel repository/Supabase o nel codice fornito durante l'audit.
- **DA VERIFICARE** = esiste un'indicazione concreta, ma serve un controllo ulteriore prima di modificarlo.
- **NON IMPLEMENTATO** = requisito desiderato ma non ancora presente.
- **NON TOCCARE** = comportamento/modulo che al momento non presenta un motivo sufficiente per essere modificato.

---

# 1. VISIONE DEL PRODOTTO

FUORISCHEMA deve essere un social orientato a moda, outfit e community, con una identità propria.

Non deve diventare un clone di TikTok o Instagram.

La priorità del prodotto finito è:

1. fluidità;
2. affidabilità;
3. semplicità delle funzioni principali;
4. sicurezza;
5. esperienza mobile eccellente;
6. UX coerente tra Home, Profilo e Battle;
7. moderazione efficace;
8. strumenti reali per owner/admin;
9. analytics e monitoring;
10. crescita futura senza accumulare nuovi cerotti.

### Regola prodotto fondamentale

Una funzione non viene aggiunta solo perché tecnicamente possibile. Deve avere uno scopo chiaro e una responsabilità tecnica chiara.

---

# 2. DEFINIZIONE DI “PRONTO”

FUORISCHEMA sarà considerato pronto al pubblico quando:

- registrazione/login/reset password funzionano;
- Home e feed sono stabili e veloci;
- foto e asset principali caricano rapidamente;
- post, like, commenti, salvataggi e follow funzionano;
- profilo personale e profilo pubblico sono coerenti;
- ricerca funziona senza regressioni;
- notifiche funzionano e hanno una UX coerente;
- Battle funziona end-to-end e i permessi sono verificati lato server;
- report e block funzionano;
- owner/moderazione sono realmente protetti lato server;
- non esistono bug bloccanti o errori JS/API critici noti;
- mobile/PWA sono verificati su dispositivi reali;
- desktop è verificato;
- performance accettabile è misurata, non solo percepita;
- backup e rollback sono disponibili;
- policy/privacy/consensi necessari sono pronti prima della pubblicazione;
- esiste un piano di monitoring post-release.

**Non è requisito di release:** eliminare ogni possibile miglioramento estetico o trasformare il codice in un progetto perfetto in senso assoluto.

---

# 3. REGOLA DI SVILUPPO DA ORA

## FEATURE FREEZE DURANTE IL CONSOLIDAMENTO

Finché non viene chiuso il blocco di stabilizzazione:

- niente nuove feature non essenziali;
- niente nuovi `surgical`, `final`, `override`, `fix`, `v2` come soluzione rapida;
- niente modifiche massive a più aree insieme;
- niente cancellazioni di file solo perché sembrano vecchi;
- niente refactor senza mappa delle dipendenze.

### Ciclo obbligatorio

`AUDIT → MAPPATURA → PROPRIETARIO → MODIFICA MINIMA → TEST → DIFF → COMMIT → PUSH → AGGIORNAMENTO MASTER`

Se una modifica rompe qualcosa: revert/restore immediato e analisi della causa.

---

# 4. ARCHITETTURA ATTUALE — FOTOGRAFIA

Il progetto è un frontend web/PWA con Supabase per auth/database/storage/Edge Functions.

Il repository GitHub è pubblico e il branch principale è `main`.

`supabase.js` funge da dispatcher per il caricamento condizionale di molti moduli FSocial.

### Caricamento FSocial verificato

Su `Fsocial.html` vengono caricati diversi moduli contemporaneamente, tra cui:

- `fsocial-navigation.js`
- `fsocial-safety.js`
- `fsocial-owner-tools.js`
- `fsocial-bottom-nav-fix.js`
- `fsocial-surgical-overrides.js`
- `fsocial-surgical-overrides-2.js`
- `fsocial-battle-vote-override.js`
- `fsocial-surgical-final.js`
- `fsocial-launch-visual-fixes.js`

Sul profilo vengono caricati più layer tra cui navigation/profile/battle record/ranking/bottom-nav/surgical/profile viewer/visual fixes.

Su `battle.html` sono presenti almeno `fsocial-battle-page-overrides.js` e `fsocial-surgical-final.js`.

### Giudizio architetturale

**STATO: 🟠 DEBITO TECNICO ALTO**

Il problema non è il numero assoluto di file, ma il fatto che più layer possono intervenire sulla stessa UI o sullo stesso comportamento.

Obiettivo: arrivare a un solo proprietario chiaro per ogni responsabilità.

---

# 5. PROBLEMA ARCHITETTURALE PRINCIPALE

## `fsocial-surgical-overrides.js`

Nel corso dell'audit è stato verificato che il file aveva raccolto responsabilità differenti.

In precedenza conteneva anche:

- Battle challenge/accept;
- intercettazione globale di `window.fetch`;
- polling Battle Hub ogni 500 ms;
- decorazione Battle Hub;
- vecchia logica profilo;
- vecchia logica impostazioni.

Il legacy profile e alcune parti Battle non necessarie sono già state rimosse in commit separati.

### Problema ancora presente

Resta il blocco:

`activeBattleData → override globale window.fetch → decorateBattleHub() → setInterval(...,500)`

**STATO: 🔴 DA RIFATTORIZZARE**

Non eliminare alla cieca: prima trasferire la responsabilità nel controller Battle corretto e testare il flusso.

---

# 6. PERFORMANCE — PRIORITÀ CRITICA

## Problemi già verificati

- monkey-patching globale di `window.fetch`;
- polling Home ogni 500 ms per decorare il Battle Hub;
- MutationObserver su `document.body` per alcune funzioni Home;
- precedente polling del profilo ogni 1,5 s, già individuato come legacy e rimosso dal surgical override;
- più layer che modificano DOM e classi della stessa pagina;
- possibile ripetizione di rendering/decorazione;
- query Supabase che devono essere profilate prima del lancio.

## Obiettivo performance Home

La Home deve:

- mostrare rapidamente la shell UI;
- caricare immagini in modo progressivo;
- usare dimensioni/thumbnail appropriate;
- evitare query duplicate;
- evitare richieste non necessarie;
- evitare observer permanenti quando un evento mirato è sufficiente;
- non eseguire codice Battle quando l'utente non sta usando Battle;
- non eseguire codice Profilo sulla Home;
- non bloccare il thread principale con lavoro DOM massivo.

## Metriche da introdurre

- tempo a UI utilizzabile;
- LCP;
- CLS;
- INP;
- dimensione JS/CSS iniziale;
- numero richieste iniziali;
- durata query principali;
- error rate API;
- fallimenti upload;
- errori JS.

**STATO: 🔴 DA COMPLETARE**

---

# 7. BATTLE — SPECIFICA PRODOTTO CORRETTA

## UX desiderata

La Battle deve essere semplice:

`SFIDA → scegli il tuo outfit → invia → l'altro accetta → sceglie il suo outfit → Battle attiva → community vota → risultato`

### NON desiderato

Non aggiungere categorie come parte obbligatoria della UX solo perché esistono nel backend attuale.

Attualmente il sistema conosce:

- `best_sneakers`
- `best_fit`
- `all_black`
- `most_original`
- `streetwear`
- `best_overall`

Questa tassonomia è da considerare **legacy/prodotto da decidere**, non una ragione per complicare la schermata di sfida.

## Backend Battle verificato

Edge Function `fsocial-battles`:

- versione attiva: 4;
- `verify_jwt=false`;
- recupera il token Bearer manualmente con `admin.auth.getUser(token)`;
- usa service role internamente;
- gestisce `active`, `public`, `create`, `accept`, `decline`, `vote`, `complete`;
- verifica ownership dei post selezionati;
- verifica blocchi;
- impedisce ai partecipanti di votare la propria Battle;
- usa hash SHA-256 del voter token per i voti anonimi;
- gestisce conflitto `23505` come voto già espresso;
- durata attuale di una Battle attiva: 24 ore;
- calcola il vincitore lato server.

### Rischi Battle da verificare

- `verify_jwt=false` è intenzionale ma richiede test di abuso sugli endpoint pubblici;
- `service_role` è usata internamente e quindi ogni percorso della funzione deve essere validato server-side;
- `complete` permette a un partecipante di completare la Battle dopo la scadenza: comportamento da confermare come policy di prodotto;
- il listing `active` carica ogni Battle e poi richiama `publicBattle` in serie: potenziale problema N+1 lato backend;
- il frontend attuale ha troppa logica Battle duplicata rispetto alla Edge Function.

**STATO: 🟠 CORE PRESENTE, ARCHITETTURA FRONTEND DA CONSOLIDARE**

---

# 8. DATABASE SUPABASE — INVENTARIO ATTUALE

Tabelle public verificate:

- `battle_votes`
- `battles`
- `conversation_members`
- `conversations`
- `fsocial_badges`
- `fsocial_battle_achievements`
- `fsocial_reputation`
- `fsocial_user_badges`
- `hashtags`
- `messages`
- `newsletter_rate_limits`
- `newsletter_subscribers`
- `notifications`
- `post_comments`
- `post_hashtags`
- `post_likes`
- `post_mentions`
- `post_saves`
- `posts`
- `profile_settings`
- `profiles`
- `stories`
- `story_views`
- `user_blocks`
- `user_follows`
- `user_reports`

View principali verificate:

- `fsocial_battle_rankings`
- `fsocial_battle_records`
- `fsocial_battle_user_achievements`
- `fsocial_battle_weekly_rankings`
- `fsocial_random_battles`

Il database possiede già relazioni/indexes/unique constraints per molte operazioni sociali.

Esempi verificati:

- like unico per `post_id + user_id`;
- save unico per `post_id + user_id`;
- follow unico per `follower_id + following_id`;
- block unico per `blocker_id + blocked_id`;
- username unico;
- Battle share slug unico;
- un solo pair Battle aperto tramite indice parziale;
- voto unico per utente o voter token per Battle.

### Relazioni/constraint

Il Master richiede che ogni relazione definitiva venga verificata per:

- foreign key;
- unique constraint;
- check constraint;
- index coerente con query reali;
- RLS;
- cascade/update/delete rules;
- timestamps;
- ownership.

**STATO: 🟠 STRUTTURA BUONA MA AUDIT RELAZIONALE DA COMPLETARE**

---

# 9. RLS / SICUREZZA DATABASE — RISULTATI REALI

### RLS senza policy rilevato

Supabase segnala RLS attivo senza policy su:

- `public.battle_votes`;
- `public.battles`;
- `public.newsletter_rate_limits`;
- `public.newsletter_subscribers`.

Per le Battle questo è particolarmente importante perché l'accesso reale avviene in larga parte attraverso la Edge Function con service role.

**Non aggiungere policy a caso:** bisogna prima definire quale accesso deve essere pubblico, autenticato o esclusivamente server-side.

### SECURITY DEFINER

Supabase segnala come superficie privilegiata esposta a `authenticated`:

- `admin_delete_post(bigint)`;
- `get_battle_share_slug(bigint)`;
- `get_or_create_direct_conversation(uuid)`;
- `refresh_fsocial_reputation(uuid)`.

Le funzioni hanno controlli interni, ma il privilegio va riesaminato e, dove possibile, l'EXECUTE pubblico/authenticated deve essere ridotto.

### View security definer

Supabase segnala come **ERROR**:

- `public.fsocial_battle_records` definita con SECURITY DEFINER.

Questa è una priorità di revisione.

### Password security

Supabase segnala leaked password protection disattivata.

**Azione:** attivarla prima del lancio pubblico, dopo aver verificato l'impatto UX.

**STATO SICUREZZA DATABASE: 🔴 DA CHIUDERE PRIMA DELLA RELEASE**

---

# 10. MODERAZIONE E OWNER

## Esistente

- report utenti;
- block utenti;
- centro moderazione;
- funzioni admin;
- `admin_delete_post` protetta da `private.is_fsocial_owner()`;
- `private.is_fsocial_owner()` usa `auth.jwt() -> app_metadata -> role = admin`;
- RLS report consente update agli owner;
- utenti possono creare report su altri utenti.

## Da costruire

### OWNER PANEL reale

Deve diventare la console di controllo del proprietario, separata dalla normale UI social.

Sezioni previste:

1. Dashboard;
2. utenti;
3. post;
4. report;
5. Battle;
6. commenti;
7. blocchi/sanzioni;
8. contenuti rimossi;
9. analytics;
10. logs;
11. feature flags;
12. configurazione sistema;
13. manutenzione;
14. sicurezza;
15. audit log.

### Potere owner desiderato

L'owner deve poter, secondo permessi server-side:

- rimuovere post;
- rimuovere commenti;
- bloccare/sospendere utenti;
- gestire report;
- annullare Battle problematiche;
- intervenire su contenuti;
- vedere statistiche;
- configurare parametri consentiti;
- attivare/disattivare feature;
- attivare manutenzione;
- consultare log.

**Mai affidare il potere solo alla UI.** Ogni operazione privilegiata deve essere verificata da RLS/RPC/Edge Function.

---

# 11. MODERAZIONE AUTOMATICA

Da aggiungere prima o contestualmente alla crescita reale.

Pipeline desiderata:

`UPLOAD/POST → controllo automatico → classificazione rischio → pubblica / review / blocca`

Categorie minime:

- nudità/sessualità;
- violenza/gore;
- odio;
- spam;
- impersonation/fake;
- contenuti vietati dalla policy;
- abuso ripetuto.

La moderazione automatica deve essere un filtro di supporto, non l'unico decisore.

Serve inoltre una coda manuale per i casi dubbi.

---

# 12. BLOCK / UNBLOCK

## Esistente

`user_blocks` è presente con insert/delete/select per il proprietario del blocco.

Il sistema usa anche `private.is_user_blocked_between()` per filtrare profili, post, commenti, like, follow, notifiche e messaggi.

## Mancanza prodotto

Manca una UX chiara per:

`Impostazioni → Privacy/Sicurezza → Utenti bloccati → Sblocca`

Questa sarà la sede corretta.

---

# 13. REPORT / MODERATION CENTER

Il centro report esiste.

Il database `user_reports` contiene:

- reporter;
- reported;
- reason;
- description;
- status;
- timestamps;
- reviewer;
- admin note;
- action taken;
- eventuale comment_id.

### Da migliorare

- stati standardizzati;
- priorità;
- filtri;
- storico decisioni;
- audit log delle azioni owner;
- collegamento diretto al contenuto segnalato;
- strumenti di sospensione/ban;
- gestione false reports;
- escalation automatica;
- eventuale coda moderazione automatica.

---

# 14. FEED

Il feed esiste e in passato è stato reso più intelligente.

**Da riesaminare prima del lancio:**

- ordine dei post;
- freschezza;
- contenuti di utenti seguiti;
- contenuti nuovi;
- segnali di engagement;
- penalizzazione spam;
- contenuti già visti;
- paginazione/infinite scroll;
- query duplicate;
- gestione blocchi;
- cold start di un nuovo utente.

### Obiettivo

Il feed deve sembrare intelligente senza diventare opaco o costoso.

Prima versione consigliata:

- recenti + following + segnali di interesse;
- ranking leggero;
- niente ML complesso prima di avere dati reali.

**STATO: 🟠 DA AUDITARE/VALIDARE**

---

# 15. POST

## Esistente

- creazione post;
- immagine;
- caption/content;
- like;
- commenti;
- save;
- hashtag;
- mention;
- delete;
- product slug.

## Da aggiungere

### Modifica caption

Il creator deve poter modificare la caption del proprio post.

Deve esserci controllo server-side:

`auth.uid() = posts.user_id`

e validazione lunghezza/input.

### Menu `⋯` sul post

Azioni previste:

- Segnala post;
- Salva/Salvato;
- Copia link;
- eventualmente Non mi interessa;
- eventualmente Blocca autore;
- per owner: rimuovi/modera.

Il menu deve essere contestuale e non duplicare le funzioni già presenti.

---

# 16. SALVATI

`post_saves` esiste e ha vincoli/indexes corretti per il caso base.

### Prodotto desiderato

Rendere la sezione Salvati più curata:

- griglia coerente;
- thumbnail veloci;
- eventuale raggruppamento futuro;
- stato vuoto ben progettato;
- apertura post coerente con il viewer;
- gestione post eliminato;
- niente query inutili.

**STATO: 🟠 UX DA MIGLIORARE**

---

# 17. PROFILO

## Esistente

- profilo personale;
- profilo pubblico;
- avatar;
- bio;
- username;
- Instagram;
- galleria;
- follower/following;
- Battle record/ranking;
- salvataggi/settings per il proprietario.

### Problemi da consolidare

- troppi moduli modificano il profilo;
- storicamente esistevano polling/observer ridondanti;
- bottom navigation presenta una differenza verticale tra Home e Profilo da investigare;
- devono essere eliminati i punti in cui due script diventano proprietari dello stesso elemento.

### Regola

Il profilo deve avere un solo proprietario per:

- layout;
- navigation;
- public/private state;
- post viewer;
- settings;
- battle record/ranking.

---

# 18. BOTTOM NAVIGATION

### Requisito

La bottom nav deve essere identica e stabile tra Home e Profilo, salvo differenze intenzionali.

Da verificare su:

- iPhone con safe area;
- Android;
- PWA installata;
- browser mobile;
- desktop;
- tastiera aperta;
- modal aperti;
- scroll;
- orientamento.

### Bug noto da investigare

La barra appare a una posizione verticale differente tra Home e Profilo.

**NON correggere con un `bottom: ...` casuale.**

Prima mappare:

`creatore → CSS → JS → safe-area → contenitore → viewport`

**STATO: 🔴 UX mobile/performance prioritaria**

---

# 19. NOTIFICHE

## Esistente

- tab/notifica;
- badge;
- like/comment/follow;
- Battle notifications;
- trigger DB per like/comment;
- bridge tra bottom navigation e sistema notifiche.

### Database verificato

`notifications` ha indici per:

- user;
- is_read;
- created_at;
- actor;
- post;
- battle.

Trigger esistenti:

- `create_like_notification()`;
- `create_comment_notification()`;
- `normalize_notification_post_target()`.

### Da migliorare

UX ispirata ai social moderni ma con identità FUORISCHEMA:

- raggruppare eventi simili;
- distinguere unread/read;
- badge corretto;
- apertura al contenuto corretto;
- evitare duplicati;
- gestione Battle distinta;
- eventuale real-time in futuro;
- niente polling aggressivo.

### Architettura desiderata

`evento → notification service → DB → UI`

Il client non deve reinventare la logica di creazione degli eventi già gestiti dal DB.

---

# 20. MESSAGGI

Il database contiene già:

- `conversations`;
- `conversation_members`;
- `messages`;
- funzione `get_or_create_direct_conversation()`;
- policy di accesso.

### Decisione prodotto

**NON implementare la messaggistica come feature principale.**

La strategia sociale desiderata è portare il visitatore dal profilo FUORISCHEMA al profilo Instagram della persona.

Il sistema messaggi può quindi rimanere backend/legacy fino a decisione futura, ma va documentato e non deve pesare sulla Home se non utilizzato.

---

# 21. RICERCA

La ricerca utenti esiste e funziona.

### Da valutare in fase successiva

- utenti;
- hashtag;
- eventuali post;
- Battle;
- categorie/prodotti se realmente utili.

Non aggiungere risultati solo per riempire la ricerca.

Priorità: mantenere la ricerca utenti veloce e affidabile.

---

# 22. STORIES

Database e storage già supportano Stories.

`stories` contiene:

- media_url;
- media_type;
- created_at;
- expires_at.

`story_views` gestisce le visualizzazioni.

Lo storage `stories` e `story-images` permette anche video MP4/WebM.

### Stato

**VERIFICATO: backend/storage preparato.**

**DA VERIFICARE: UX completa e performance reale.**

---

# 23. VIDEO — FUTURA FEATURE

I post normali attualmente sono modellati con `image_url`, quindi il modello post attuale non è ancora un vero sistema video.

Gli storage delle Stories accettano video, ma questo non significa che i normali post possano già pubblicare video.

### Idea prodotto

Creare una zona Video originale, non TikTok clone.

Possibile direzione futura:

- video outfit;
- look del giorno;
- outfit breakdown;
- Battle highlights;
- community clips;
- durata breve;
- feed verticale solo nella sezione Video;
- ranking leggero;
- controlli di moderazione automatici;
- thumbnail/poster;
- compressione/transcoding;
- limiti dimensione/durata.

**NON IMPLEMENTARE durante il cleanup.**

---

# 24. ANALYTICS

## Scopo

Analytics serve per sapere cosa sta succedendo davvero nel social, non per avere grafici belli.

### KPI prodotto

- utenti registrati;
- utenti attivi giornalieri/mensili;
- nuovi utenti;
- retention;
- post creati;
- like;
- commenti;
- saves;
- follows;
- Battle create/accept/complete;
- voti;
- report;
- upload falliti;
- error rate;
- tempo medio sessione;
- feature adoption.

### KPI performance

- page load;
- API latency;
- DB query latency;
- image load time;
- JS errors;
- failed requests;
- 404/500;
- crash/error boundary;
- upload failure rate.

### Architettura desiderata

Eventi minimali e privacy-conscious:

`client event → ingestion → aggregate → owner dashboard`

Non registrare dati personali inutili.

---

# 25. CONFIGURAZIONE SISTEMA / OWNER SETTINGS

Il proprietario deve poter configurare senza deploy, quando tecnicamente sicuro:

- durata Battle;
- categorie Battle;
- limiti upload;
- limiti azioni;
- feature flags;
- manutenzione;
- messaggi globali;
- soglie moderazione;
- rate limits;
- eventuali parametri feed.

### Regola

La configurazione deve stare in un'area backend controllata, non in localStorage e non solo nel frontend.

Proposta futura:

`system_settings` + RLS owner-only + audit log.

---

# 26. ANTISPAM / ANTIABUSO

Necessario per utenti reali.

Da progettare:

- rate limits per endpoint;
- rate limits per user/IP/device dove legalmente e tecnicamente appropriato;
- CAPTCHA/challenge nei punti a rischio;
- anti-flood commenti;
- anti-like abuse;
- anti-vote abuse;
- anti-account creation abuse;
- detection pattern sospetti;
- blocco temporaneo;
- escalation;
- audit log.

### Battle

Il sistema voter token + unique index è una buona base, ma non è sufficiente contro bot distribuiti.

---

# 27. STORAGE / MEDIA

Bucket verificati:

- `avatars` — pubblico, 5 MB, JPEG/PNG/WebP;
- `post-images` — pubblico, 10 MB, JPEG/PNG/WebP;
- `posts` — privato, nessun limite/mime configurato rilevato;
- `stories` — pubblico, 10 MB, JPEG/PNG/WebP/MP4/WebM;
- `story-images` — pubblico, 10 MB, JPEG/PNG/WebP/MP4/WebM.

### Rischi

- bucket duplicati (`stories` / `story-images`);
- bucket `posts` non coerente con il modello post-image attuale;
- file size e mime limits devono essere standardizzati;
- immagini devono essere ottimizzate prima o durante upload;
- video futuro richiederà pipeline separata.

**STATO: 🟠 DA RAZIONALIZZARE**

---

# 28. EMAIL / AUTH

Da verificare end-to-end:

- signup email;
- email confirmation;
- password reset;
- change email;
- security emails;
- eventuali email Battle;
- email moderazione/owner;
- template;
- sender/domain;
- SPF;
- DKIM;
- DMARC;
- link corretti in produzione;
- gestione errori;
- rate limits.

### Requisito prodotto

Le email FUORISCHEMA devono sembrare un prodotto reale, non template Supabase lasciati di default.

**STATO: 🟠 DA AUDITARE COMPLETAMENTE**

---

# 29. MOBILE

Priorità assoluta.

Checklist:

- iOS Safari;
- iOS PWA;
- Android Chrome;
- Android PWA;
- safe-area top/bottom;
- notch;
- home indicator;
- tastiera;
- input focus;
- scroll lock;
- touch targets;
- tap feedback;
- swipe;
- modal;
- bottom navigation;
- orientamento;
- immagini;
- upload;
- network lento;
- offline/error states.

### Requisito

Il social deve essere progettato mobile-first, non semplicemente responsive.

---

# 30. DESKTOP

Checklist:

- feed width;
- sidebar/navigation;
- hover;
- mouse;
- keyboard;
- focus states;
- responsive breakpoints;
- grandi monitor;
- modal;
- notifiche;
- ricerca;
- upload.

---

# 31. PWA / SERVICE WORKER

Audit precedente ha rilevato:

- `pwa-install.js` per installazione;
- istruzioni iOS;
- registrazione Service Worker;
- comportamento network-first/conservativo.

### Stato

**🟢 DA NON TOCCARE SENZA MOTIVO**

Va comunque incluso nel test finale di release.

---

# 32. LEGAL / GDPR

Prima del lancio pubblico devono essere definiti almeno:

- Privacy Policy;
- Terms & Conditions;
- Cookie Policy, se applicabile;
- consensi necessari;
- diritto cancellazione account;
- eventuale export dati;
- gestione segnalazioni;
- trattamento dati analytics;
- retention dati;
- contatti privacy;
- eventuali obblighi applicabili a piattaforme online.

Per gli aspetti legali italiani/UE serve verifica professionale aggiornata prima della pubblicazione.

---

# 33. CANCELLAZIONE ACCOUNT

Il creator deve poter eliminare il proprio account.

Il flusso deve definire:

1. conferma forte;
2. eventuale re-authentication;
3. eliminazione/disattivazione Auth;
4. eliminazione o anonimizzazione dati;
5. gestione post;
6. gestione Battle;
7. gestione report necessari;
8. storage cleanup;
9. eventuale retention legale;
10. conferma finale.

Questo deve essere server-side e transaction-safe quanto possibile.

---

# 34. BACKUP / DISASTER RECOVERY

Da rendere operativo:

- backup DB;
- backup/config storage;
- versionamento codice Git;
- migrations versionate;
- rollback deploy;
- recovery procedure documentata;
- owner access recovery;
- verifica periodica dei backup.

Un backup che non è mai stato testato non è una garanzia.

---

# 35. MONITORING POST-RELEASE

Da implementare:

- JS errors;
- API errors;
- DB errors;
- latency;
- failed login;
- failed uploads;
- 404;
- 500;
- performance regressions;
- Edge Function errors;
- rate-limit violations;
- moderazione spikes.

### Owner dashboard

Il pannello deve avere una sezione “System Health”.

---

# 36. AUDIT LOG

Ogni azione privilegiata dovrebbe poter lasciare una traccia:

- chi;
- cosa;
- quando;
- target;
- motivo;
- risultato.

Esempi:

- post deleted;
- user suspended;
- report resolved;
- Battle cancelled;
- feature flag changed;
- system setting changed.

---

# 37. DUPLICAZIONI / LEGACY — STRATEGIA

Pattern da cercare sistematicamente:

- `surgical`;
- `final`;
- `override`;
- `fix`;
- `v2`;
- funzioni duplicate;
- listener duplicate;
- observer duplicate;
- CSS duplicate;
- componenti creati due volte.

### Regola

Un file viene eliminato solo quando abbiamo dimostrato:

1. chi lo importa;
2. chi lo usa;
3. cosa modifica;
4. cosa succede se manca;
5. quali dipendenze rimangono;
6. test superato senza di lui.

---

# 38. COSA È GIÀ STATO RIMOSSO NEL CONSOLIDAMENTO

Commit noti:

- `d46d616` — `refactor: remove unused battle vote legacy`;
- `ce4a6a1` — `refactor: remove unused profile legacy`.

Questi interventi hanno rimosso codice legacy identificato come non utilizzato, senza modificare `Fsocial.html` quando il tentativo di patch aveva prodotto encoding/alterazioni indesiderate.

**Regola:** non ripetere modifiche manuali su file grandi senza controllo di encoding/diff.

---

# 39. MATRICE DI PRIORITÀ

## 🔴 BLOCCANTI PRE-RELEASE

1. Sicurezza RLS Battle.
2. Revisione `SECURITY DEFINER`/EXECUTE.
3. View `fsocial_battle_records` security-definer.
4. Owner/moderation server-side.
5. Edge Function Battle abuse/security testing.
6. Rimozione/razionalizzazione `window.fetch` globale.
7. Eliminazione polling Home 500 ms.
8. Performance Home e immagini.
9. Bottom navigation mobile.
10. Auth/email/reset password end-to-end.
11. Account deletion.
12. Monitoring minimo.
13. Backup/recovery.
14. Legal/privacy/consent prima del pubblico.

## 🟠 ALTI

15. Consolidamento Battle frontend.
16. Consolidamento Profilo.
17. Notifiche.
18. Feed.
19. Moderation center.
20. Owner panel.
21. Storage rationalization.
22. Anti-spam.
23. Saved UX.
24. Caption edit.
25. Post menu.

## 🟡 MEDI / POST-STABILIZZAZIONE

26. Search expansion.
27. Advanced analytics.
28. Video zone.
29. Feature flags completi.
30. Advanced notification grouping.
31. Collections per Saved.
32. Ranking/feed improvements basati su dati reali.

## 🟢 DA PRESERVARE

33. PWA/network-first conservativo, salvo regressioni.
34. Safety/block foundation, salvo necessità concrete.
35. Existing DB unique constraints/indexes già utili.
36. Escaping dei dati dinamici già presente nei moduli analizzati.
37. Git/commit workflow.

---

# 40. PIANO OPERATIVO

## FASE A — AUDIT/BASELINE

- inventario completo HTML/JS/CSS;
- mappa import;
- mappa DOM ownership;
- mappa Supabase;
- mappa Edge Functions;
- mappa storage;
- mappa Auth/email;
- mappa flussi;
- mappa performance.

## FASE B — SICUREZZA

- RLS;
- RPC;
- SECURITY DEFINER;
- owner;
- Battle;
- storage;
- auth;
- rate limits.

## FASE C — PERFORMANCE

- fetch monkey patch;
- polling;
- observer;
- query duplicate;
- image optimization;
- payloads;
- DOM.

## FASE D — CONSOLIDAMENTO

- Battle;
- Home;
- Profilo;
- notifiche;
- bottom nav;
- safety.

## FASE E — UX ESSENZIALE

- saved;
- caption edit;
- post menu;
- settings;
- unblock.

## FASE F — OWNER/MODERATION/ANALYTICS

- owner panel;
- moderation center;
- automatic moderation;
- analytics;
- system settings;
- audit log;
- monitoring.

## FASE G — RELEASE HARDENING

- mobile;
- desktop;
- PWA;
- auth/email;
- backup;
- legal;
- regression;
- performance test;
- security test.

## FASE H — POST-RELEASE

Solo dopo una release stabile:

- Video;
- Search advanced;
- ranking improvements;
- advanced analytics;
- nuove feature community.

---

# 41. CHECKLIST DI REGRESSIONE

## AUTH

- [ ] signup
- [ ] login
- [ ] logout
- [ ] confirmation
- [ ] forgot password
- [ ] reset password
- [ ] session expiry

## HOME

- [ ] load
- [ ] feed
- [ ] pagination
- [ ] like
- [ ] comment
- [ ] save
- [ ] follow
- [ ] share
- [ ] battle button
- [ ] notifications
- [ ] search
- [ ] bottom nav

## PROFILE

- [ ] own profile
- [ ] public profile
- [ ] edit profile
- [ ] avatar
- [ ] posts
- [ ] saved
- [ ] settings
- [ ] blocked users
- [ ] Instagram link
- [ ] bottom nav

## BATTLE

- [ ] challenge
- [ ] choose outfit
- [ ] receive notification
- [ ] accept
- [ ] choose outfit
- [ ] active Battle
- [ ] vote
- [ ] duplicate vote blocked
- [ ] participant vote blocked
- [ ] expiry
- [ ] result
- [ ] ranking
- [ ] record

## MODERATION

- [ ] report user
- [ ] report post
- [ ] block
- [ ] unblock
- [ ] moderation queue
- [ ] owner action
- [ ] audit log

## MEDIA

- [ ] image upload
- [ ] image load
- [ ] invalid type
- [ ] oversized file
- [ ] failed upload
- [ ] delete
- [ ] story

## MOBILE

- [ ] iOS Safari
- [ ] iOS PWA
- [ ] Android Chrome
- [ ] Android PWA
- [ ] safe area
- [ ] keyboard
- [ ] touch
- [ ] scroll
- [ ] modal

## DESKTOP

- [ ] Chrome
- [ ] Safari
- [ ] Edge
- [ ] hover
- [ ] keyboard
- [ ] responsive

---

# 42. STATO ATTUALE SINTETICO

| Area | Stato |
|---|---|
| Auth | 🟠 da completare audit |
| Home | 🔴 performance/consolidamento |
| Feed | 🟠 da validare |
| Profilo | 🟠 stratificato |
| Bottom nav | 🔴 bug UX da investigare |
| Notifiche | 🟠 da consolidare |
| Search | 🟢 base funzionante / 🟡 evoluzione |
| Post | 🟢 base presente / 🟠 edit/menu mancanti |
| Saved | 🟢 presente / 🟠 UX |
| Safety/block | 🟢 base buona / 🟠 unblock UX |
| Moderation | 🟠 owner tooling da completare |
| Owner | 🔴 panel completo mancante |
| Battle core | 🟢 presente / 🟠 frontend stratificato |
| Battle security | 🔴 da chiudere |
| Supabase DB | 🟠 buone basi / audit sicurezza aperto |
| Storage | 🟠 da razionalizzare |
| Stories | 🟢 backend presente / 🟠 UX da verificare |
| Video posts | 🔴 non ancora prodotto |
| Analytics | 🔴 da costruire |
| Auto moderation | 🔴 da costruire |
| Anti-spam | 🔴 da costruire |
| Monitoring | 🔴 da costruire |
| Backup/DR | 🔴 da formalizzare |
| Email | 🟠 da auditare |
| PWA | 🟢 da preservare |
| Legal/GDPR | 🔴 da chiudere prima del pubblico |
| Account deletion | 🔴 da costruire |
| Legacy | 🟠 in consolidamento |

---

# 43. REGOLE ASSOLUTE PER IL FUTURO

1. **Non modificare codice funzionante senza una ragione documentata.**
2. **Non usare un override per risolvere un problema che può essere risolto nel proprietario corretto.**
3. **Non introdurre un secondo sistema quando ne esiste già uno.**
4. **Non cancellare file senza dependency map.**
5. **Non usare polling se un evento/observer mirato o una query on-demand è sufficiente.**
6. **Non fidarsi del frontend per la sicurezza.**
7. **Ogni potere owner deve essere server-side.**
8. **Ogni nuova tabella deve avere ownership/RLS/index/constraint pensati prima.**
9. **Ogni nuova feature deve avere un piano di test.**
10. **Una modifica = un obiettivo.**
11. **Dopo ogni modifica: diff + test + commit.**
12. **Se non sappiamo chi controlla un elemento, prima si fa audit.**
13. **La performance è una feature.**
14. **Mobile è first-class.**
15. **Non si lancia il sito perché “sembra funzionare”: si lancia quando la release checklist è verde.**

---

# 44. NOTA DI TRASPARENZA DELL'AUDIT

Questo documento incorpora i risultati dell'audit precedente e le verifiche dirette effettuate su repository/Supabase durante la costruzione di questa baseline.

Non deve essere interpretato come certificazione assoluta di ogni singola riga del repository o di ogni comportamento su ogni dispositivo reale.

Le aree marcate **DA VERIFICARE** rimangono aperte intenzionalmente. In particolare:

- inventario completo file-by-file del repository;
- dipendenze complete tra tutti gli HTML/JS/CSS;
- test browser reali su iOS/Android/Desktop;
- audit completo Auth/email;
- audit completo Edge Functions oltre a `fsocial-battles`;
- verifica di tutte le foreign key/cascade rules;
- performance reale con profiling;
- backup/recovery test;
- legal review.

**Non si inventano risultati mancanti.**

---

# 45. PROSSIMO PASSO UFFICIALE

Prima di scrivere nuove feature:

**chiudere l'inventario tecnico completo e la mappa delle dipendenze.**

Poi, in quest'ordine:

`SECURITY → PERFORMANCE → ARCHITECTURE CLEANUP → CORE UX → OWNER/MODERATION → ANALYTICS/MONITORING → RELEASE TEST → NUOVE FEATURE`

Questo documento è la memoria permanente del progetto. Se una nuova chat viene aperta, il punto di partenza è questo file + lo stato Git corrente.
