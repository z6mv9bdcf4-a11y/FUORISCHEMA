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

    updateBattleState();
    updateBattleResponseActions();

    showContent();

    document.title =
        `${challengerName} vs ${challengedName} Ã¢â‚¬â€ FSocial Battle`;
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
}

async function respondToBattle(action) {
    const battle = state.battle?.battle;

    if (!battle || battle.status !== "pending") {
        return;
    }

    const currentUserId = state.session?.user?.id;

    if (!currentUserId || currentUserId !== battle.challenged_id) {
        return;
    }

    const acceptButton = $("acceptBattleButton");
    const declineButton = $("declineBattleButton");

    if (acceptButton) acceptButton.disabled = true;
    if (declineButton) declineButton.disabled = true;

    try {
        const data = await battleRequest({
            method: "POST",
            action,
            body: {
                battle_id: battle.id
            }
        });

        if (!data?.success) {
            throw new Error(data?.message || "Impossibile aggiornare la Battle.");
        }

        await refreshBattle();
    } catch (error) {
        console.error("FSocial Battle response error:", error);

        if (acceptButton) acceptButton.disabled = false;
        if (declineButton) declineButton.disabled = false;

        showVoteMessage(
            error?.message || "Impossibile aggiornare la Battle."
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
                "Questa sfida non ÃƒÂ¨ ancora iniziata.";
        }

        return;
    }

    if (battle.status === "declined") {
        challengerButton.disabled = true;
        challengedButton.disabled = true;

        if (message) {
            message.hidden = false;
            message.textContent =
                "Questa sfida ÃƒÂ¨ stata rifiutata.";
        }

        return;
    }

    if (battle.status === "cancelled") {
        challengerButton.disabled = true;
        challengedButton.disabled = true;

        if (message) {
            message.hidden = false;
            message.textContent =
                "Questa Battle non ÃƒÂ¨ piÃƒÂ¹ disponibile.";
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
                    "La Battle ÃƒÂ¨ terminata in pareggio.";
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
                "Ã¢Å“â€œ Hai votato. Ora fai girare la Battle.";
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
    document.addEventListener(
        "DOMContentLoaded",
        initBattlePage
    );
}
