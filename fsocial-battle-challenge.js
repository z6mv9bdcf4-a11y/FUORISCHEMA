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

async function getMyBattlePost() {
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
            .limit(1)
            .maybeSingle();

    if (error) {
        throw error;
    }

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