const BATTLE_FUNCTION_URL =
    "https://dbjfvphcrfvajrtkeswg.supabase.co/functions/v1/fsocial-battles";

const CATEGORY_LABELS = {
    best_sneakers: "BEST SNEAKERS",
    best_fit: "BEST FIT",
    all_black: "ALL BLACK",
    most_original: "MOST ORIGINAL",
    streetwear: "STREETWEAR",
    best_overall: "BEST OVERALL"
};

const state = {
    battle: null,
    session: null,
    voted: false
};

function $(id) {
    return document.getElementById(id);
}

function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = hidden;
}

function escapeText(value) {
    return String(value ?? "").trim();
}

function profileUrl(userId) {
    return `area-personale.html?id=${encodeURIComponent(userId)}`;
}

function getBattleSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get("battle") || params.get("slug") || "";
}

function getAnonymousVoteToken() {
    const storageKey = "fsocial_battle_voter_token";

    try {
        let token = localStorage.getItem(storageKey);

        if (token && token.length >= 16) {
            return token;
        }

        token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

        localStorage.setItem(storageKey, token);

        return token;
    } catch (error) {
        console.warn("FSocial Battle localStorage unavailable:", error);

        return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    }
}

async function getCurrentSession() {
    try {
        const module = await import("./supabase.js");

        const { data, error } = await module.supabase.auth.getSession();

        if (error) {
            console.warn("Unable to read Supabase session:", error);
            return null;
        }

        return data?.session || null;
    } catch (error) {
        console.warn("Supabase session module unavailable:", error);
        return null;
    }
}

async function battleRequest({
    method = "GET",
    action = "",
    body = null,
    slug = ""
} = {}) {
    const url = new URL(BATTLE_FUNCTION_URL);

    if (action) {
        url.searchParams.set("action", action);
    }

    if (slug) {
        url.searchParams.set("slug", slug);
    }

    const headers = {
        Accept: "application/json"
    };

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    if (state.session?.access_token) {
        headers.Authorization = `Bearer ${state.session.access_token}`;
    }

    const response = await fetch(url.toString(), {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined,
        credentials: "omit"
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.message ||
            "Impossibile completare la richiesta.";

        const error = new Error(message);

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

function showLoading() {
    setHidden($("battleLoading"), false);
    setHidden($("battleError"), true);
    setHidden($("battleContent"), true);
}

function showContent() {
    setHidden($("battleLoading"), true);
    setHidden($("battleError"), true);
    setHidden($("battleContent"), false);
}

function showError(message) {
    setHidden($("battleLoading"), true);
    setHidden($("battleContent"), true);
    setHidden($("battleError"), false);

    const errorMessage = $("battleErrorMessage");

    if (errorMessage) {
        errorMessage.textContent =
            message ||
            "Questa Battle non esiste oppure non ÃƒÂ¨ piÃƒÂ¹ disponibile.";
    }
}

function setImage(element, src, alt = "") {
    if (!element) return;

    element.alt = alt;

    if (src) {
        element.src = src;
        element.hidden = false;
    } else {
        element.removeAttribute("src");
        element.hidden = true;
    }
}

function renderProfile({
    profile,
    userId,
    avatarElement,
    nameElement,
    usernameElement,
    profileElement,
    voteLabelElement
}) {
    const name =
        escapeText(profile?.full_name) ||
        escapeText(profile?.username) ||
        "Utente";

    const username =
        escapeText(profile?.username) || "utente";

    const avatar = escapeText(profile?.avatar_url);

    if (avatarElement) {
        setImage(
            avatarElement,
            avatar,
            `Foto profilo di ${name}`
        );
    }

    if (nameElement) {
        nameElement.textContent = name;
        nameElement.href = profileUrl(userId);
    }

    if (usernameElement) {
        usernameElement.textContent = `@${username.replace(/^@/, "")}`;
        usernameElement.href = profileUrl(userId);
    }

    if (profileElement) {
        profileElement.href = profileUrl(userId);
        profileElement.setAttribute(
            "aria-label",
            `Apri il profilo di ${name}`
        );
    }

    if (voteLabelElement) {
        voteLabelElement.textContent =
            username.replace(/^@/, "").toUpperCase();
    }
}

function renderPostImage(element, post, name) {
    if (!element) return;

    const imageUrl = escapeText(post?.image_url);

    setImage(
        element,
        imageUrl,
        `Outfit di ${name}`
    );
}

let battleCountdownInterval = null;

function stopBattleCountdown() {
    if (battleCountdownInterval) {
        clearInterval(battleCountdownInterval);
        battleCountdownInterval = null;
    }
}

function updateBattleCountdown() {
    const bar = document.getElementById("battleStatusBar");
    const label = document.getElementById("battleStatusLabel");
    const countdown = document.getElementById("battleCountdown");

    if (!bar || !label || !countdown) return;

    const battle = state.battle?.battle;

    if (!battle) return;

    if (battle.status !== "active") {
        stopBattleCountdown();

        bar.classList.add("is-completed");

        if (battle.status === "completed") {
            label.textContent = "BATTLE TERMINATA";
            countdown.textContent = "00:00:00";
        } else {
            label.textContent = "BATTLE NON ATTIVA";
            countdown.textContent = "—";
        }

        return;
    }

    const endTime = battle.ended_at
        ? new Date(battle.ended_at).getTime()
        : (
            battle.started_at
                ? new Date(battle.started_at).getTime() + (24 * 60 * 60 * 1000)
                : NaN
        );

    if (!Number.isFinite(endTime)) {
        label.textContent = "BATTLE LIVE";
        countdown.textContent = "—";
        return;
    }

    bar.classList.remove("is-completed");
    label.textContent = "BATTLE LIVE";

    const update = () => {
        const remaining = Math.max(
            0,
            endTime - Date.now()
        );

        const totalSeconds = Math.floor(
            remaining / 1000
        );

        const hours = Math.floor(
            totalSeconds / 3600
        );

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds =
            totalSeconds % 60;

        countdown.textContent =
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;

        if (remaining <= 0) {
            stopBattleCountdown();

            label.textContent = "BATTLE TERMINATA";
            countdown.textContent = "00:00:00";
            bar.classList.add("is-completed");

            setTimeout(() => {
                refreshBattle();
            }, 1500);
        }
    };

    update();

    stopBattleCountdown();

    battleCountdownInterval =
        setInterval(update, 1000);
}
function renderBattle(data) {
    state.battle = data;

    const battle = data?.battle;

    if (!battle) {
        showError("Battle non trovata.");
        return;
    }

    const challenger = data.challenger || {};
    const challenged = data.challenged || {};

    const challengerPost = data.challengerPost || {};
    const challengedPost = data.challengedPost || {};

    const category =
        CATEGORY_LABELS[battle.category] ||
        String(battle.category || "BEST OVERALL")
            .replaceAll("_", " ")
            .toUpperCase();

    $("battleCategory").textContent = category;

    renderProfile({
        profile: challenger,
        userId: battle.challenger_id,
        avatarElement: $("challengerAvatar"),
        nameElement: $("challengerName"),
        usernameElement: $("challengerUsername"),
        profileElement: $("challengerProfile"),
        voteLabelElement: $("challengerVoteLabel")
    });

    renderProfile({
        profile: challenged,
        userId: battle.challenged_id,
        avatarElement: $("challengedAvatar"),
        nameElement: $("challengedName"),
        usernameElement: $("challengedUsername"),
        profileElement: $("challengedProfile"),
        voteLabelElement: $("challengedVoteLabel")
    });

    const challengerName =
        escapeText(challenger.full_name) ||
        escapeText(challenger.username) ||
        "Primo partecipante";

    const challengedName =
        escapeText(challenged.full_name) ||
        escapeText(challenged.username) ||
        "Secondo partecipante";

    renderPostImage(
        $("challengerOutfit"),
        challengerPost,
        challengerName
    );

    renderPostImage(
        $("challengedOutfit"),
        challengedPost,
        challengedName
    );

    const votes = data.votes || {};

    $("challengerVotes").textContent =
        Number(votes[battle.challenger_id] || 0);

    $("challengedVotes").textContent =
        Number(votes[battle.challenged_id] || 0);

    updateBattleVoteResult();
    updateBattleState();
    updateBattleResponseActions();
    updateBattleCountdown();

    showContent();

    document.title =
        `${challengerName} vs ${challengedName} Ã¢â‚¬â€ FSocial Battle`;
}

function updateBattleVoteResult() {
    const result = $("battleVoteResult");
    if (!result) return;

    const battle = state.battle?.battle;
    const votes = state.battle?.votes || {};

    if (!battle) {
        result.hidden = true;
        return;
    }

    const challengerVotes = Number(votes[battle.challenger_id] || 0);
    const challengedVotes = Number(votes[battle.challenged_id] || 0);
    const totalVotes = challengerVotes + challengedVotes;

    const challengerPercent =
        totalVotes > 0
            ? Math.round((challengerVotes / totalVotes) * 100)
            : 0;

    const challengedPercent =
        totalVotes > 0
            ? 100 - challengerPercent
            : 0;

    const challengerName =
        state.battle?.challenger?.username ||
        state.battle?.challenger?.full_name ||
        "PRIMO OUTFIT";

    const challengedName =
        state.battle?.challenged?.username ||
        state.battle?.challenged?.full_name ||
        "SECONDO OUTFIT";

    const eyebrow = $("battleVoteResultEyebrow");
    const title = $("battleVoteResultTitle");
    const challengerNameEl = $("battleVoteResultChallengerName");
    const challengedNameEl = $("battleVoteResultChallengedName");
    const challengerPercentEl = $("battleVoteResultChallengerPercent");
    const challengedPercentEl = $("battleVoteResultChallengedPercent");
    const challengerBar = $("battleVoteResultChallengerBar");
    const challengedBar = $("battleVoteResultChallengedBar");
    const status = $("battleVoteResultStatus");

    if (
        !eyebrow ||
        !title ||
        !challengerNameEl ||
        !challengedNameEl ||
        !challengerPercentEl ||
        !challengedPercentEl ||
        !challengerBar ||
        !challengedBar ||
        !status
    ) {
        return;
    }

    challengerNameEl.textContent = challengerName;
    challengedNameEl.textContent = challengedName;

    challengerPercentEl.textContent = `${challengerPercent}%`;
    challengedPercentEl.textContent = `${challengedPercent}%`;

    challengerBar.style.width = `${challengerPercent}%`;
    challengedBar.style.width = `${challengedPercent}%`;

    result.classList.remove(
        "is-live",
        "is-completed",
        "is-draw"
    );

    const challengerCard = $("challengerCard");
    const challengedCard = $("challengedCard");

    challengerCard?.classList.remove("is-winner", "is-loser");
    challengedCard?.classList.remove("is-winner", "is-loser");

    if (battle.status === "completed") {
        result.hidden = false;
        result.classList.add("is-completed");

        eyebrow.textContent = "RISULTATO FINALE";

        if (!battle.winner_id) {
            result.classList.add("is-draw");
            title.textContent = "BATTLE TERMINATA IN PAREGGIO";
            status.textContent =
                totalVotes > 0
                    ? `${totalVotes} voti totali`
                    : "Nessun voto registrato";
        } else if (battle.winner_id === battle.challenger_id) {
            title.textContent = "🏆 PRIMO OUTFIT VINCITORE";
            status.textContent =
                `${challengerName} conquista la Battle.`;

            challengerCard?.classList.add("is-winner");
            challengedCard?.classList.add("is-loser");
        } else {
            title.textContent = "🏆 SECONDO OUTFIT VINCITORE";
            status.textContent =
                `${challengedName} conquista la Battle.`;

            challengedCard?.classList.add("is-winner");
            challengerCard?.classList.add("is-loser");
        }

        return;
    }

    if (battle.status === "active" && totalVotes > 0) {
        result.hidden = false;
        result.classList.add("is-live");

        eyebrow.textContent = "RISULTATO LIVE";
        title.textContent = "LA COMMUNITY STA DECIDENDO";

        status.textContent =
            `${totalVotes} ${totalVotes === 1 ? "voto" : "voti"} registrati`;

        return;
    }

    result.hidden = true;
    status.textContent = "";
}

function installBattleResponsePickerStyles() {
    const styleId = "fsocial-battle-response-picker-style";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;

    style.textContent = `
        .fs-battle-accept-picker{
            position:fixed;
            inset:0;
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:rgba(0,0,0,.78);
            backdrop-filter:blur(16px);
            -webkit-backdrop-filter:blur(16px);
        }

        .fs-battle-accept-picker-card{
            width:min(620px,100%);
            max-height:min(760px,calc(100vh - 40px));
            overflow:auto;
            padding:24px;
            border:1px solid rgba(255,255,255,.10);
            border-radius:24px;
            background:#0d0d10;
            box-shadow:0 30px 100px rgba(0,0,0,.55);
        }

        .fs-battle-accept-picker-kicker{
            color:#ff4d00;
            font-size:9px;
            font-weight:900;
            letter-spacing:.14em;
            margin-bottom:8px;
        }

        .fs-battle-accept-picker-title{
            margin:0;
            color:#fff;
            font-size:24px;
            font-weight:900;
            letter-spacing:-.03em;
        }

        .fs-battle-accept-picker-subtitle{
            margin:8px 0 18px;
            color:#777;
            font-size:11px;
            line-height:1.5;
        }

        .fs-battle-accept-picker-grid{
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:10px;
            max-height:430px;
            overflow-y:auto;
            padding:2px;
        }

        .fs-battle-accept-post{
            position:relative;
            display:block;
            padding:0;
            aspect-ratio:1;
            overflow:hidden;
            border:1px solid rgba(255,255,255,.08);
            border-radius:16px;
            background:#151518;
            cursor:pointer;
            transition:.18s ease;
        }

        .fs-battle-accept-post:hover{
            transform:translateY(-2px);
            border-color:rgba(255,77,0,.45);
        }

        .fs-battle-accept-post.selected{
            border-color:#ff4d00;
            box-shadow:
                0 0 0 2px rgba(255,77,0,.25),
                0 14px 35px rgba(255,77,0,.12);
        }

        .fs-battle-accept-post img{
            width:100%;
            height:100%;
            display:block;
            object-fit:cover;
        }

        .fs-battle-accept-post-check{
            position:absolute;
            top:8px;
            right:8px;
            width:27px;
            height:27px;
            display:grid;
            place-items:center;
            border-radius:50%;
            background:rgba(0,0,0,.72);
            color:#fff;
            font-size:13px;
            font-weight:900;
            opacity:0;
        }

        .fs-battle-accept-post.selected .fs-battle-accept-post-check{
            opacity:1;
            background:#ff4d00;
        }

        .fs-battle-accept-picker-status{
            min-height:18px;
            margin:12px 0;
            color:#999;
            font-size:10px;
            font-weight:800;
            text-align:center;
        }

        .fs-battle-accept-picker-actions{
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
            margin-top:14px;
        }

        .fs-battle-accept-picker-actions button{
            min-height:46px;
            border-radius:14px;
            font-size:10px;
            font-weight:900;
            letter-spacing:.08em;
            cursor:pointer;
        }

        .fs-battle-accept-confirm{
            border:1px solid #ff4d00;
            background:#ff4d00;
            color:#080808;
        }

        .fs-battle-accept-confirm:disabled{
            opacity:.35;
            cursor:not-allowed;
        }

        .fs-battle-accept-cancel{
            border:1px solid rgba(255,255,255,.10);
            background:#17171b;
            color:#aaa;
        }

        .battle-response-button{
            transition:
                transform .18s ease,
                box-shadow .18s ease,
                opacity .18s ease !important;
        }

        .battle-response-button:hover:not(:disabled){
            transform:translateY(-2px);
        }

        .battle-response-accept:hover:not(:disabled){
            box-shadow:0 12px 30px rgba(255,77,0,.20);
        }

        .battle-response-button:disabled{
            opacity:.45;
            cursor:not-allowed;
        }

        @media(max-width:550px){
            .fs-battle-accept-picker{
                padding:12px;
                align-items:flex-end;
            }

            .fs-battle-accept-picker-card{
                padding:18px;
                border-radius:22px 22px 0 0;
                max-height:90vh;
            }

            .fs-battle-accept-picker-grid{
                grid-template-columns:repeat(2,minmax(0,1fr));
                max-height:48vh;
            }
        }
    `;

    document.head.appendChild(style);
}

function closeBattleAcceptPicker() {
    document.getElementById("fsBattleAcceptPicker")?.remove();
}

async function openBattleAcceptPicker() {
    const battle = state.battle?.battle;
    const currentUserId = state.session?.user?.id;

    if(
        !battle ||
        battle.status !== "pending" ||
        !currentUserId ||
        currentUserId !== battle.challenged_id
    ){
        return;
    }

    if(document.getElementById("fsBattleAcceptPicker")){
        return;
    }

    installBattleResponsePickerStyles();

    const picker = document.createElement("div");
    picker.id = "fsBattleAcceptPicker";
    picker.className = "fs-battle-accept-picker";

    picker.innerHTML = `
        <div class="fs-battle-accept-picker-card">
            <div class="fs-battle-accept-picker-kicker">
                ⚔️ FSOCIAL BATTLE
            </div>

            <h2 class="fs-battle-accept-picker-title">
                SCEGLI IL TUO OUTFIT
            </h2>

            <p class="fs-battle-accept-picker-subtitle">
                Scegli il post con cui vuoi affrontare questa Battle.
            </p>

            <div
                id="fsBattleAcceptPostGrid"
                class="fs-battle-accept-picker-grid"
            >
                <div class="fs-battle-accept-picker-status">
                    CARICAMENTO OUTFIT...
                </div>
            </div>

            <div
                id="fsBattleAcceptPickerStatus"
                class="fs-battle-accept-picker-status"
                aria-live="polite"
            ></div>

            <div class="fs-battle-accept-picker-actions">
                <button
                    type="button"
                    class="fs-battle-accept-cancel"
                    id="fsBattleAcceptCancel"
                >
                    ANNULLA
                </button>

                <button
                    type="button"
                    class="fs-battle-accept-confirm"
                    id="fsBattleAcceptConfirm"
                    disabled
                >
                    ⚔️ ACCETTA E INIZIA
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(picker);

    const grid = document.getElementById("fsBattleAcceptPostGrid");
    const status = document.getElementById("fsBattleAcceptPickerStatus");
    const confirmButton = document.getElementById("fsBattleAcceptConfirm");

    let selectedPostId = "";

    document.getElementById("fsBattleAcceptCancel")?.addEventListener(
        "click",
        closeBattleAcceptPicker
    );

    try{
        const module = await import("./supabase.js");

        const { data: posts, error } =
            await module.supabase
                .from("posts")
                .select("id,user_id,image_url,content,created_at")
                .eq("user_id", currentUserId)
                .not("image_url", "is", null)
                .order("created_at", { ascending:false })
                .limit(12);

        if(error) throw error;

        const availablePosts = Array.isArray(posts) ? posts : [];

        if(!availablePosts.length){
            grid.innerHTML = `
                <div class="fs-battle-accept-picker-status">
                    NON HAI ANCORA PUBBLICATO UN OUTFIT.
                </div>
            `;
            return;
        }

        grid.innerHTML = availablePosts.map(post => `
            <button
                type="button"
                class="fs-battle-accept-post"
                data-post-id="${escapeText(post.id)}"
            >
                <img
                    src="${escapeText(post.image_url)}"
                    alt="Il tuo outfit"
                    loading="lazy"
                >
                <span class="fs-battle-accept-post-check">✓</span>
            </button>
        `).join("");

        grid.querySelectorAll(".fs-battle-accept-post").forEach(button => {
            button.addEventListener("click", () => {
                grid
                    .querySelectorAll(".fs-battle-accept-post")
                    .forEach(item => item.classList.remove("selected"));

                button.classList.add("selected");

                selectedPostId =
                    button.dataset.postId || "";

                confirmButton.disabled = !selectedPostId;

                if(status){
                    status.textContent =
                        "Outfit selezionato.";
                }
            });
        });

        confirmButton.addEventListener("click", async () => {
            if(!selectedPostId) return;

            await respondToBattle(
                "accept",
                selectedPostId
            );
        });

    }catch(error){
        console.error(
            "FSocial Battle accept outfit error:",
            error
        );

        grid.innerHTML = `
            <div class="fs-battle-accept-picker-status">
                IMPOSSIBILE CARICARE I TUOI OUTFIT.
            </div>
        `;

        if(status){
            status.textContent =
                error?.message ||
                "Errore durante il caricamento degli outfit.";
        }
    }
}

function updateBattleResponseActions() {
    const container = $("battleResponseActions");
    const acceptButton = $("acceptBattleButton");
    const declineButton = $("declineBattleButton");

    if (!container || !acceptButton || !declineButton) {
        return;
    }

    const battle = state.battle?.battle;
    const currentUserId = state.session?.user?.id;

    const canRespond = Boolean(
        battle &&
        battle.status === "pending" &&
        currentUserId &&
        currentUserId === battle.challenged_id
    );

    container.hidden = !canRespond;
    acceptButton.disabled = !canRespond;
    declineButton.disabled = !canRespond;

    if(canRespond){
        acceptButton.textContent =
            "⚔️ SCEGLI OUTFIT E ACCETTA";
    }
}

async function respondToBattle(action, postId = "") {
    const battle = state.battle?.battle;

    if(!battle || battle.status !== "pending"){
        return;
    }

    const currentUserId = state.session?.user?.id;

    if(
        !currentUserId ||
        currentUserId !== battle.challenged_id
    ){
        return;
    }

    if(action === "accept" && !postId){
        await openBattleAcceptPicker();
        return;
    }

    const acceptButton = $("acceptBattleButton");
    const declineButton = $("declineBattleButton");

    if(acceptButton) acceptButton.disabled = true;
    if(declineButton) declineButton.disabled = true;

    try{
        const body = {
            battle_id: battle.id
        };

        if(action === "accept"){
            body.post_id = Number(postId);
        }

        const data = await battleRequest({
            method: "POST",
            action,
            body
        });

        if(!data?.success){
            throw new Error(
                data?.message ||
                "Impossibile aggiornare la Battle."
            );
        }

        closeBattleAcceptPicker();

        await refreshBattle();

    }catch(error){
        console.error(
            "FSocial Battle response error:",
            error
        );

        if(acceptButton) acceptButton.disabled = false;
        if(declineButton) declineButton.disabled = false;

        showVoteMessage(
            error?.message ||
            "Impossibile aggiornare la Battle."
        );
    }
}

function updateBattleState() {
    const battle = state.battle?.battle;

    if (!battle) return;

    const challengerButton = $("voteChallenger");
    const challengedButton = $("voteChallenged");

    const message = $("battleVoteMessage");

    if (!challengerButton || !challengedButton) {
        return;
    }

    const active = battle.status === "active";

    challengerButton.disabled =
        !active || state.voted;

    challengedButton.disabled =
        !active || state.voted;

    if (battle.status === "pending") {
        challengerButton.disabled = true;
        challengedButton.disabled = true;

        if (message) {
            message.hidden = false;
            message.textContent =
                "La sfida è in attesa del tuo outfit. Scegli un outfit per iniziare la Battle.";
        }

        return;
    }

    if (battle.status === "declined") {
        challengerButton.disabled = true;
        challengedButton.disabled = true;

        if (message) {
            message.hidden = false;
            message.textContent =
                "Questa sfida è stata rifiutata.";
        }

        return;
    }

    if (battle.status === "cancelled") {
        challengerButton.disabled = true;
        challengedButton.disabled = true;

        if (message) {
            message.hidden = false;
            message.textContent =
                "Questa Battle non è più disponibile.";
        }

        return;
    }

    if (battle.status === "completed") {
        challengerButton.disabled = true;
        challengedButton.disabled = true;

        const winnerId = battle.winner_id;

        if (message) {
            message.hidden = false;

            if (!winnerId) {
                message.textContent =
                    "La Battle è terminata in pareggio.";
            } else if (winnerId === battle.challenger_id) {
                message.textContent =
                    "Ã°Å¸Ââ€  Battle terminata: ha vinto il primo outfit.";
            } else {
                message.textContent =
                    "Ã°Å¸Ââ€  Battle terminata: ha vinto il secondo outfit.";
            }
        }

        return;
    }

    if (state.voted) {
        if (message) {
            message.hidden = false;
            message.textContent =
                "✓ Hai votato. Ora fai girare la Battle.";
        }
    } else if (message) {
        message.hidden = true;
        message.textContent = "";
    }
}

async function loadBattle() {
    showLoading();

    const slug = getBattleSlug();

    if (!slug) {
        showError(
            "Link Battle non valido."
        );
        return;
    }

    try {
        state.session = await getCurrentSession();

        const data = await battleRequest({
            method: "GET",
            slug
        });

        if (!data?.success || !data.battle) {
            throw new Error(
                data?.message ||
                "Battle non trovata."
            );
        }

        renderBattle(data);
    } catch (error) {
        console.error(
            "FSocial Battle loading error:",
            error
        );

        showError(
            error?.message ||
            "Impossibile caricare questa Battle."
        );
    }
}

async function voteFor(userId) {
    if (state.voted) {
        return;
    }

    const battle = state.battle?.battle;

    if (!battle || battle.status !== "active") {
        return;
    }

    const challengerButton = $("voteChallenger");
    const challengedButton = $("voteChallenged");

    if (challengerButton) {
        challengerButton.disabled = true;
    }

    if (challengedButton) {
        challengedButton.disabled = true;
    }

    try {
        const body = {
            battle_id: battle.id,
            voted_for_user_id: userId
        };

        if (!state.session?.access_token) {
            body.voter_token = getAnonymousVoteToken();
        }

        const data = await battleRequest({
            method: "POST",
            action: "vote",
            body
        });

        if (data?.alreadyVoted) {
            state.voted = true;

            showVoteMessage(
                "Hai giÃƒÂ  votato questa Battle."
            );

            updateBattleState();

            return;
        }

        state.voted = true;

        await refreshBattle();

        showVoteMessage(
            "Ã¢Å“â€œ Voto registrato. Ora condividi la Battle."
        );

        updateBattleState();
    } catch (error) {
        console.error(
            "FSocial Battle vote error:",
            error
        );

        if (error?.data?.alreadyVoted) {
            state.voted = true;
        }

        showVoteMessage(
            error?.message ||
            "Non ÃƒÂ¨ stato possibile registrare il voto."
        );

        updateBattleState();
    }
}

function showVoteMessage(text) {
    const element = $("battleVoteMessage");

    if (!element) return;

    element.hidden = false;
    element.textContent = text;
}

async function refreshBattle() {
    const slug = getBattleSlug();

    if (!slug) return;

    const data = await battleRequest({
        method: "GET",
        slug
    });

    if (data?.success) {
        renderBattle(data);
    }
}

function getBattleShareUrl() {
    return window.location.href;
}

async function copyBattleLink() {
    const url = getBattleShareUrl();

    try {
        await navigator.clipboard.writeText(url);

        showVoteMessage(
            "Ã¢Å“â€œ Link della Battle copiato."
        );
    } catch (error) {
        console.warn(
            "Clipboard API unavailable:",
            error
        );

        showVoteMessage(
            "Copia manualmente questo link: " + url
        );
    }
}

async function shareBattle() {
    const url = getBattleShareUrl();

    const challenger =
        state.battle?.challenger?.username ||
        "utente";

    const challenged =
        state.battle?.challenged?.username ||
        "utente";

    const shareData = {
        title: `Ã¢Å¡â€Ã¯Â¸Â @${challenger} vs @${challenged}`,
        text: "Chi ha piÃƒÂ¹ stile? Vota su FSocial.",
        url
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (error) {
            if (error?.name === "AbortError") {
                return;
            }
        }
    }

    await copyBattleLink();

    showVoteMessage(
        "Ã¢Å“â€œ Link copiato. Puoi incollarlo nella tua Story."
    );
}

function shareWhatsApp() {
    const url = getBattleShareUrl();

    const challenger =
        state.battle?.challenger?.username ||
        "utente";

    const challenged =
        state.battle?.challenged?.username ||
        "utente";

    const text =
        `Ã¢Å¡â€Ã¯Â¸Â @${challenger} VS @${challenged}\n` +
        `Chi ha piÃƒÂ¹ stile?\n\n` +
        url;

    const whatsappUrl =
        `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
    );
}

function bindBattleFighterSelection() {
    const fighters = [
        $("challengerCard"),
        $("challengedCard")
    ];

    const voteButtons = [
        $("voteChallenger"),
        $("voteChallenged")
    ];

    fighters.forEach((fighter, index) => {
        if (!fighter) return;

        fighter.addEventListener("click", (event) => {
            if (event.target.closest("button,a")) return;

            const battle = state.battle?.battle;
            const active = battle?.status === "active";

            if (!active || state.voted) return;

            state.selectedFighter = index;

            fighters.forEach((item, itemIndex) => {
                item?.classList.toggle(
                    "fs-bselected",
                    itemIndex === index
                );

                item?.classList.toggle(
                    "fs-bunselected",
                    itemIndex !== index
                );
            });

            voteButtons.forEach((button, buttonIndex) => {
                if (!button) return;

                button.disabled = buttonIndex !== index;

                button.classList.toggle(
                    "fs-vready",
                    buttonIndex === index
                );

                button.classList.toggle(
                    "fs-vlocked",
                    buttonIndex !== index
                );
            });
        });
    });
}

function bindEvents() {
    $("acceptBattleButton")?.addEventListener(
        "click",
        () => respondToBattle("accept")
    );

    $("declineBattleButton")?.addEventListener(
        "click",
        () => respondToBattle("decline")
    );

    $("voteChallenger")?.addEventListener(
        "click",
        () => {
            const userId =
                state.battle?.battle?.challenger_id;

            if (userId) {
                voteFor(userId);
            }
        }
    );

    $("voteChallenged")?.addEventListener(
        "click",
        () => {
            const userId =
                state.battle?.battle?.challenged_id;

            if (userId) {
                voteFor(userId);
            }
        }
    );

    $("copyBattleLink")?.addEventListener(
        "click",
        copyBattleLink
    );

    $("shareInstagram")?.addEventListener(
        "click",
        shareBattle
    );

    $("shareWhatsApp")?.addEventListener(
        "click",
        shareWhatsApp
    );
}

async function getMyBattlePost() {
    const session = state.session || await getCurrentSession();

    if (!session?.user?.id) {
        throw new Error("Devi essere autenticato per lanciare una sfida.");
    }

    state.session = session;

    const module = await import("./supabase.js");

    const { data, error } = await module.supabase
        .from("posts")
        .select("id,user_id,image_url,content,created_at")
        .eq("user_id", session.user.id)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    return data || null;
}

function closeBattleChallengeModal() {
    const modal = document.getElementById("fsBattleChallengeModal");

    if (modal) {
        modal.remove();
    }

    document.body.classList.remove("fs-battle-modal-open");
}

async function submitBattleChallenge({
    challengedUserId,
    category,
    modal,
    statusElement,
    submitButton
}) {
    try {
        submitButton.disabled = true;

        if (statusElement) {
            statusElement.textContent = "Controllo il tuo ultimo outfit...";
        }

        const myPost = await getMyBattlePost();

        if (!myPost) {
            if (statusElement) {
                statusElement.textContent =
                    "Prima di sfidare qualcuno devi pubblicare almeno un outfit.";
            }

            submitButton.disabled = false;
            return;
        }

        if (statusElement) {
            statusElement.textContent = "Invio la sfida...";
        }

        const data = await battleRequest({
            method: "POST",
            action: "create",
            body: {
                challenged_id: challengedUserId,
                post_id: myPost.id,
                category
            }
        });

        if (!data?.success || !data?.battle) {
            throw new Error(
                data?.message || "Impossibile creare la sfida."
            );
        }

        closeBattleChallengeModal();

        if (typeof window.showToast === "function") {
            window.showToast("⚔️ Sfida inviata!");
        } else {
            alert("⚔️ Sfida inviata!");
        }
    } catch (error) {
        console.error("FSocial Battle create error:", error);

        if (statusElement) {
            statusElement.textContent =
                error?.message ||
                "Non è stato possibile inviare la sfida.";
        }

        submitButton.disabled = false;
    }
}

function openBattleChallengeModal({
    challengedUserId,
    challengedAuthor
} = {}) {
    if (!challengedUserId) {
        return;
    }

    closeBattleChallengeModal();

    const name =
        challengedAuthor?.username
            ? `@${escapeText(challengedAuthor.username)}`
            : escapeText(challengedAuthor?.name || "questo utente");

    const modal = document.createElement("div");

    modal.id = "fsBattleChallengeModal";
    modal.className = "fs-battle-modal";

    modal.innerHTML = `
        <div class="fs-battle-modal-backdrop"></div>

        <div
            class="fs-battle-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fsBattleChallengeTitle"
        >
            <button
                class="fs-battle-modal-close"
                type="button"
                aria-label="Chiudi"
            >×</button>

            <div class="fs-battle-modal-kicker">
                ⚔️ FSOCIAL BATTLE
            </div>

            <h2 id="fsBattleChallengeTitle">
                SFIDA ${escapeText(name)}
            </h2>

            <p class="fs-battle-modal-description">
                Pensi di avere più stile?
                Scegli la categoria e lancia la sfida.
            </p>

            <div class="fs-battle-category-label">
                SCEGLI LA CATEGORIA
            </div>

            <div class="fs-battle-category-grid">
                ${Object.entries(CATEGORY_LABELS).map(([value, label]) => `
                    <button
                        type="button"
                        class="fs-battle-category"
                        data-category="${escapeText(value)}"
                    >
                        ${escapeText(label)}
                    </button>
                `).join("")}
            </div>

            <div class="fs-battle-status" aria-live="polite"></div>

            <button
                class="fs-battle-submit"
                type="button"
                disabled
            >
                ⚔️ LANCIA LA SFIDA
            </button>

            <button
                class="fs-battle-cancel"
                type="button"
            >
                Annulla
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add("fs-battle-modal-open");

    const backdrop =
        modal.querySelector(".fs-battle-modal-backdrop");

    const closeButton =
        modal.querySelector(".fs-battle-modal-close");

    const cancelButton =
        modal.querySelector(".fs-battle-cancel");

    const submitButton =
        modal.querySelector(".fs-battle-submit");

    const statusElement =
        modal.querySelector(".fs-battle-status");

    const categoryButtons =
        modal.querySelectorAll(".fs-battle-category");

    let selectedCategory = "";

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            categoryButtons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            selectedCategory =
                button.dataset.category || "";

            submitButton.disabled = !selectedCategory;

            if (statusElement) {
                statusElement.textContent = "";
            }
        });
    });

    const close = () => {
        closeBattleChallengeModal();
    };

    backdrop?.addEventListener("click", close);
    closeButton?.addEventListener("click", close);
    cancelButton?.addEventListener("click", close);

    submitButton?.addEventListener("click", () => {
        if (!selectedCategory) return;

        submitBattleChallenge({
            challengedUserId,
            category: selectedCategory,
            modal,
            statusElement,
            submitButton
        });
    });
}

window.openBattleChallengeModal = openBattleChallengeModal;
window.closeBattleChallengeModal = closeBattleChallengeModal;
async function initBattlePage() {
    bindEvents();

    await loadBattle();
}

if (document.body?.classList.contains("battle-page")) {
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initBattlePage,
            { once: true }
        );
    } else {
        initBattlePage();
    }
}

