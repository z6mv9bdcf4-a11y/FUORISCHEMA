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

async function getCurrentSession() {
    try {
        const module = await import("./supabase.js");

        const { data, error } =
            await module.supabase.auth.getSession();

        if (error) {
            console.warn(
                "Unable to read Supabase session:",
                error
            );
            return null;
        }

        return data?.session || null;
    } catch (error) {
        console.warn(
            "Supabase session module unavailable:",
            error
        );
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

    const session = await getCurrentSession();

    if (session?.access_token) {
        headers.Authorization =
            `Bearer ${session.access_token}`;
    }

    const response = await fetch(
        url.toString(),
        {
            method,
            headers,
            body:
                body !== null
                    ? JSON.stringify(body)
                    : undefined,
            credentials: "omit"
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok || !data?.success) {
        const error = new Error(
            data?.message ||
            "Operazione Battle non riuscita."
        );

        error.data = data;
        throw error;
    }

    return data;
}

function escapeText(value) {
    return String(value ?? "").trim();
}

async function getMyBattlePosts() {
    const session =
        await getCurrentSession();

    if (!session?.user?.id) {
        throw new Error(
            "Devi essere autenticato per lanciare una sfida."
        );
    }

    const module =
        await import("./supabase.js");

    const { data, error } =
        await module.supabase
            .from("posts")
            .select(
                "id,user_id,image_url,content,created_at"
            )
            .eq(
                "user_id",
                session.user.id
            )
            .not(
                "image_url",
                "is",
                null
            )
            .order(
                "created_at",
                { ascending: false }
            )
            .limit(12);

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
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
    postId,
    modal,
    statusElement,
    submitButton
}) {
    try {
        submitButton.disabled = true;

        if (!postId) {
            throw new Error(
                "Seleziona prima l'outfit con cui vuoi sfidare."
            );
        }

        if (statusElement) {
            statusElement.textContent =
                "Invio la sfida...";
        }

        const data = await battleRequest({
            method: "POST",
            action: "create",
            body: {
                challenged_id: challengedUserId,
                post_id: postId,
                category
            }
        });

        if (!data?.success || !data?.battle) {
            throw new Error(
                data?.message ||
                "Impossibile creare la sfida."
            );
        }

        closeBattleChallengeModal();

        const toast = document.getElementById("toast");

        if (toast) {
            toast.textContent = "⚔️ Sfida inviata!";
            toast.classList.add("show");

            clearTimeout(window.__fsToast);

            window.__fsToast = setTimeout(() => {
                toast.classList.remove("show");
            }, 2600);
        }
    } catch (error) {
        console.error(
            "FSocial Battle create error:",
            error
        );

        if (statusElement) {
            statusElement.textContent =
                error?.message ||
                "Non è stato possibile inviare la sfida.";
        }

        submitButton.disabled = false;
    }
}

async function openBattleChallengeModal({
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
            : escapeText(
                challengedAuthor?.name ||
                "questo utente"
            );

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
                Scegli l'outfit con cui vuoi scendere in Battle.
            </p>

            <div class="fs-battle-category-label">
                SCEGLI IL TUO OUTFIT
            </div>

            <div
                class="fs-battle-post-grid"
                id="fsBattlePostGrid"
            >
                <div class="fs-battle-post-loading">
                    CARICAMENTO OUTFIT...
                </div>
            </div>

            <div class="fs-battle-category-label">
                SCEGLI LA CATEGORIA
            </div>

            <div class="fs-battle-category-grid">
                ${Object.entries(CATEGORY_LABELS).map(
                    ([value, label]) => `
                        <button
                            type="button"
                            class="fs-battle-category"
                            data-category="${escapeText(value)}"
                            disabled
                        >
                            ${escapeText(label)}
                        </button>
                    `
                ).join("")}
            </div>

            <div
                class="fs-battle-status"
                aria-live="polite"
            ></div>

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
    document.body.classList.add(
        "fs-battle-modal-open"
    );

    const backdrop =
        modal.querySelector(
            ".fs-battle-modal-backdrop"
        );

    const closeButton =
        modal.querySelector(
            ".fs-battle-modal-close"
        );

    const cancelButton =
        modal.querySelector(
            ".fs-battle-cancel"
        );

    const submitButton =
        modal.querySelector(
            ".fs-battle-submit"
        );

    const statusElement =
        modal.querySelector(
            ".fs-battle-status"
        );

    const postGrid =
        modal.querySelector(
            "#fsBattlePostGrid"
        );

    const categoryButtons =
        modal.querySelectorAll(
            ".fs-battle-category"
        );

    let selectedPostId = "";
    let selectedCategory = "";

    const updateSubmitState = () => {
        submitButton.disabled =
            !selectedPostId ||
            !selectedCategory;
    };

    categoryButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                categoryButtons.forEach(item => {
                    item.classList.remove(
                        "selected"
                    );
                });

                button.classList.add(
                    "selected"
                );

                selectedCategory =
                    button.dataset.category ||
                    "";

                updateSubmitState();

                if (statusElement) {
                    statusElement.textContent = "";
                }
            }
        );
    });

    const renderPosts = posts => {
        if (!postGrid) return;

        if (!posts.length) {
            postGrid.innerHTML = `
                <div class="fs-battle-post-empty">
                    PRIMA DI SFIDARE QUALCUNO
                    DEVI PUBBLICARE UN OUTFIT.
                </div>
            `;

            return;
        }

        categoryButtons.forEach(button => {
            button.disabled = false;
        });

        postGrid.innerHTML = posts.map(post => `
            <button
                type="button"
                class="fs-battle-post-option"
                data-post-id="${escapeText(post.id)}"
            >
                <img
                    src="${escapeText(post.image_url)}"
                    alt="Outfit"
                    loading="lazy"
                >

                <span class="fs-battle-post-check">
                    ✓
                </span>
            </button>
        `).join("");

        postGrid
            .querySelectorAll(
                ".fs-battle-post-option"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        postGrid
                            .querySelectorAll(
                                ".fs-battle-post-option"
                            )
                            .forEach(item => {
                                item.classList.remove(
                                    "selected"
                                );
                            });

                        button.classList.add(
                            "selected"
                        );

                        selectedPostId =
                            button.dataset.postId ||
                            "";

                        updateSubmitState();

                        if (statusElement) {
                            statusElement.textContent = "";
                        }
                    }
                );
            });
    };

    const close = () => {
        closeBattleChallengeModal();
    };

    backdrop?.addEventListener(
        "click",
        close
    );

    closeButton?.addEventListener(
        "click",
        close
    );

    cancelButton?.addEventListener(
        "click",
        close
    );

    submitButton?.addEventListener(
        "click",
        () => {
            if (
                !selectedPostId ||
                !selectedCategory
            ) {
                return;
            }

            submitBattleChallenge({
                challengedUserId,
                category: selectedCategory,
                postId: selectedPostId,
                modal,
                statusElement,
                submitButton
            });
        }
    );

    try {
        const posts =
            await getMyBattlePosts();

        renderPosts(posts);

        if (!posts.length && statusElement) {
            statusElement.textContent =
                "Pubblica almeno un outfit prima di lanciare una sfida.";
        }
    } catch (error) {
        console.error(
            "FSocial Battle posts error:",
            error
        );

        if (postGrid) {
            postGrid.innerHTML = `
                <div class="fs-battle-post-empty">
                    IMPOSSIBILE CARICARE I TUOI OUTFIT.
                </div>
            `;
        }

        if (statusElement) {
            statusElement.textContent =
                error?.message ||
                "Errore durante il caricamento degli outfit.";
        }
    }
}
window.openBattleChallengeModal = openBattleChallengeModal;
window.closeBattleChallengeModal = closeBattleChallengeModal;

/* =========================================================
   FSOCIAL — SURGICAL UI INTEGRITY FIXES
   Loaded after Fsocial.html so these are intentionally last-in-line.
   No data/auth/feed logic is changed here.
========================================================= */
(function installFsocialSurgicalFixes(){
    const run = () => {
        const home = document.getElementById("navHome");
        if (home) {
            home.setAttribute("href", "Fsocial.html");
            home.setAttribute("aria-current", "page");
        }

        const battleTab = document.getElementById("tabRecent");
        if (battleTab) {
            battleTab.textContent = "SFIDA";
            battleTab.setAttribute("aria-label", "Apri il feed Sfida");
        }

        const battlePostPickerStyleId = "fsocial-battle-post-picker-style";

        if (!document.getElementById(battlePostPickerStyleId)) {
            const style = document.createElement("style");
            style.id = battlePostPickerStyleId;
            style.textContent = `.fs-battle-post-grid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px;
    margin:14px 0 18px;
    max-height:330px;
    overflow-y:auto;
    padding-right:2px;
}

.fs-battle-post-option{
    position:relative;
    display:block;
    padding:0;
    border:1px solid rgba(255,255,255,.08);
    border-radius:16px;
    overflow:hidden;
    background:#111116;
    cursor:pointer;
    aspect-ratio:1/1;
    transition:border-color .18s ease,transform .18s ease,box-shadow .18s ease;
}

.fs-battle-post-option:hover{
    transform:translateY(-2px);
    border-color:rgba(255,77,0,.45);
}

.fs-battle-post-option.selected{
    border-color:#ff4d00;
    box-shadow:0 0 0 2px rgba(255,77,0,.22),0 12px 30px rgba(255,77,0,.12);
}

.fs-battle-post-option img{
    width:100%;
    height:100%;
    display:block;
    object-fit:cover;
}

.fs-battle-post-option::after{
    content:"";
    position:absolute;
    inset:0;
    background:linear-gradient(to top,rgba(0,0,0,.58),transparent 45%);
    pointer-events:none;
}

.fs-battle-post-option .fs-battle-post-check{
    position:absolute;
    right:8px;
    top:8px;
    width:26px;
    height:26px;
    display:grid;
    place-items:center;
    border-radius:50%;
    background:rgba(0,0,0,.68);
    border:1px solid rgba(255,255,255,.15);
    color:#fff;
    font-size:13px;
    opacity:0;
    z-index:2;
}

.fs-battle-post-option.selected .fs-battle-post-check{
    opacity:1;
    background:#ff4d00;
    border-color:#ff4d00;
}

.fs-battle-post-loading,
.fs-battle-post-empty{
    grid-column:1/-1;
    padding:22px 14px;
    text-align:center;
    color:#777;
    font-size:10px;
    font-weight:800;
    letter-spacing:.08em;
}

@media(max-width:550px){
    .fs-battle-post-grid{
        max-height:280px;
        gap:8px;
    }
}

            `;
            document.head.appendChild(style);
        }
        const styleId = "fsocial-surgical-ui-fixes";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                /* Re-enable the intended frosted-glass treatment where an older
                   override had explicitly disabled backdrop-filter. */
                .create-card,
                .notif-modal{
                    backdrop-filter:blur(20px) saturate(140%) !important;
                    -webkit-backdrop-filter:blur(20px) saturate(140%) !important;
                }

                /* Keep the fallback text written by the like logic from
                   duplicating the heart rendered by .like-icon::before. */
                .like-icon{
                    font-size:0 !important;
                }

                /* Keep mobile content above the fixed navigation bar. */
                @media(max-width:550px){
                    .page{padding-bottom:calc(90px + env(safe-area-inset-bottom,0px)) !important;}
                }
            `;
            document.head.appendChild(style);
        }

        document.addEventListener("keydown", event => {
            if (event.key !== "Escape") return;

            const battleModal = document.getElementById("fsBattleChallengeModal");
            if (battleModal) closeBattleChallengeModal();

            const profileOverlay = document.getElementById("profileOverlay");
            if (profileOverlay?.classList.contains("active")) {
                document.getElementById("profileClose")?.click();
            }

            const notifOverlay = document.getElementById("notifOverlay");
            if (notifOverlay?.classList.contains("active")) {
                document.getElementById("notifClose")?.click();
            }
        }, { passive: true });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
        run();
    }
})();




