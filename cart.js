(function () {
    "use strict";

    const CART_KEY = "fuorischema_cart_v1";

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }

    function addToCart(product) {
        const cart = getCart();
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name || "Prodotto",
                brand: product.brand || "",
                category: product.category || "",
                image: product.image || "",
                quantity: 1
            });
        }

        saveCart(cart);
        openCart();
        showCartToast(product.name || "Prodotto");
    }

    function removeFromCart(id) {
        const cart = getCart().filter(item => item.id !== id);
        saveCart(cart);
    }

    function changeQuantity(id, amount) {
        const cart = getCart();
        const item = cart.find(product => product.id === id);

        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            const filtered = cart.filter(product => product.id !== id);
            saveCart(filtered);
            return;
        }

        saveCart(cart);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeImage(src) {
        if (!src) return "";
        try {
            return new URL(src, window.location.href).href;
        } catch {
            return src;
        }
    }

    function createCartUI() {
        if (document.getElementById("fs-cart-root")) return;

        const root = document.createElement("div");
        root.id = "fs-cart-root";

        root.innerHTML = `
            <button id="fs-cart-trigger" class="fs-cart-trigger" type="button" aria-label="Apri carrello">
                <span class="fs-cart-icon">🛒</span>
                <span class="fs-cart-label">CARRELLO</span>
                <span id="fs-cart-count" class="fs-cart-count">0</span>
            </button>

            <div id="fs-cart-overlay" class="fs-cart-overlay"></div>

            <aside id="fs-cart-drawer" class="fs-cart-drawer" aria-hidden="true">
                <div class="fs-cart-header">
                    <div>
                        <div class="fs-cart-kicker">FUORISCHEMA</div>
                        <h2>IL TUO CARRELLO</h2>
                    </div>

                    <button id="fs-cart-close" class="fs-cart-close" type="button" aria-label="Chiudi">
                        ×
                    </button>
                </div>

                <div id="fs-cart-items" class="fs-cart-items"></div>

                <div id="fs-cart-empty" class="fs-cart-empty">
                    <div class="fs-cart-empty-number">00</div>
                    <strong>IL CARRELLO È VUOTO</strong>
                    <span>Aggiungi i prodotti che vuoi richiedere.</span>
                </div>

                <div class="fs-cart-footer">
                    <div class="fs-cart-summary">
                        <span>PRODOTTI</span>
                        <strong id="fs-cart-total-items">0</strong>
                    </div>

                    <div class="fs-cart-note">
                        Prezzo e disponibilità vengono confermati direttamente in DM.
                    </div>

                    <button id="fs-order-button" class="fs-order-button" type="button">
                        <span>PROSEGUI PER L'ORDINE</span>
                        <span>→</span>
                    </button>

                    <button id="fs-copy-button" class="fs-copy-button" type="button">
                        COPIA RIEPILOGO ORDINE
                    </button>
                </div>
            </aside>
        `;

        document.body.appendChild(root);

        document.getElementById("fs-cart-trigger").addEventListener("click", openCart);
        document.getElementById("fs-cart-close").addEventListener("click", closeCart);
        document.getElementById("fs-cart-overlay").addEventListener("click", closeCart);

        document.getElementById("fs-order-button").addEventListener("click", prepareOrder);
        document.getElementById("fs-copy-button").addEventListener("click", copyOrderSummary);

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") closeCart();
        });

        renderCart();
        updateCartCount();
    }

    function openCart() {
        const drawer = document.getElementById("fs-cart-drawer");
        const overlay = document.getElementById("fs-cart-overlay");

        if (!drawer || !overlay) return;

        drawer.classList.add("open");
        overlay.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        document.body.classList.add("fs-cart-lock");
    }

    function closeCart() {
        const drawer = document.getElementById("fs-cart-drawer");
        const overlay = document.getElementById("fs-cart-overlay");

        if (!drawer || !overlay) return;

        drawer.classList.remove("open");
        overlay.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("fs-cart-lock");
    }

    function updateCartCount() {
        const countElement = document.getElementById("fs-cart-count");
        const totalElement = document.getElementById("fs-cart-total-items");

        if (!countElement) return;

        const total = getCart().reduce((sum, item) => sum + item.quantity, 0);

        countElement.textContent = total;
        countElement.classList.toggle("show", total > 0);

        if (totalElement) {
            totalElement.textContent = total;
        }
    }

    function renderCart() {
        const container = document.getElementById("fs-cart-items");
        const empty = document.getElementById("fs-cart-empty");

        if (!container || !empty) return;

        const cart = getCart();

        container.innerHTML = "";

        if (!cart.length) {
            empty.style.display = "flex";
            return;
        }

        empty.style.display = "none";

        cart.forEach(item => {
            const row = document.createElement("div");
            row.className = "fs-cart-item";

            const image = item.image
                ? `<img src="${escapeHtml(normalizeImage(item.image))}" alt="${escapeHtml(item.name)}">`
                : `<div class="fs-cart-image-placeholder">FS</div>`;

            row.innerHTML = `
                <div class="fs-cart-item-image">
                    ${image}
                </div>

                <div class="fs-cart-item-info">
                    <div class="fs-cart-item-brand">${escapeHtml(item.brand)}</div>
                    <div class="fs-cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="fs-cart-item-category">${escapeHtml(item.category)}</div>

                    <div class="fs-cart-item-controls">
                        <button type="button" data-minus="${escapeHtml(item.id)}">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-plus="${escapeHtml(item.id)}">+</button>
                    </div>
                </div>

                <button class="fs-cart-remove" type="button" data-remove="${escapeHtml(item.id)}">
                    ×
                </button>
            `;

            container.appendChild(row);
        });

        container.querySelectorAll("[data-minus]").forEach(button => {
            button.addEventListener("click", () => {
                changeQuantity(button.dataset.minus, -1);
            });
        });

        container.querySelectorAll("[data-plus]").forEach(button => {
            button.addEventListener("click", () => {
                changeQuantity(button.dataset.plus, 1);
            });
        });

        container.querySelectorAll("[data-remove]").forEach(button => {
            button.addEventListener("click", () => {
                removeFromCart(button.dataset.remove);
            });
        });
    }

    function getOrderSummary() {
        const cart = getCart();

        if (!cart.length) {
            return "";
        }

        let text = "Ciao FUORISCHEMA! 👋\n\n";
        text += "Vorrei informazioni per questi prodotti:\n\n";

        cart.forEach(item => {
            text += `• ${item.brand ? item.brand + " — " : ""}${item.name} × ${item.quantity}\n`;
        });

        text += "\nVorrei sapere prezzo, taglie e disponibilità.";

        return text;
    }

    async function copyOrderSummary(showToast = true) {
        const summary = getOrderSummary();

        if (!summary) {
            showCartToast("Il carrello è vuoto.");
            return false;
        }

        try {
            await navigator.clipboard.writeText(summary);

            if (showToast) {
                showCartToast("Riepilogo copiato ✓");
            }

            return true;
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = summary;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand("copy");
            } catch {}

            textarea.remove();

            if (showToast) {
                showCartToast("Riepilogo pronto da copiare");
            }

            return true;
        }
    }

    async function prepareOrder() {
        const cart = getCart();

        if (!cart.length) {
            showCartToast("Aggiungi almeno un prodotto.");
            return;
        }

        await copyOrderSummary(false);

        showCartToast("Riepilogo copiato ✓");

        setTimeout(() => {
            /*
                INSERIRE QUI IL LINK INSTAGRAM UFFICIALE
                QUANDO ABBIAMO L'USERNAME DEFINITIVO.
            */
            window.open("https://www.instagram.com/_fuori.schema_/", "_blank", "noopener,noreferrer");
        }, 500);
    }

    function showCartToast(message) {
        let toast = document.getElementById("fs-cart-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "fs-cart-toast";
            toast.className = "fs-cart-toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toast._timer);

        toast._timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    function getProductFromCard(card) {
        if (!card) return null;

        const link =
            card.matches("a[href*='prodotto.html']")
                ? card
                : card.querySelector("a[href*='prodotto.html']");

        const href = link ? link.getAttribute("href") : "";

        let id = "";

        if (href) {
            try {
                const url = new URL(href, window.location.href);
                id = url.searchParams.get("id") || "";
            } catch {}
        }

        const imageElement = card.querySelector("img");
        const image = imageElement ? imageElement.getAttribute("src") : "";

        const nameElement = card.querySelector(".product-name");
        const brandElement = card.querySelector(".product-brand");

        const name = nameElement
            ? nameElement.textContent.trim()
            : "Prodotto";

        const brand = brandElement
            ? brandElement.textContent.trim()
            : "";

        if (!id) {
            id = `${brand}-${name}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        }

        const category = getPageCategory();

        return {
            id,
            name,
            brand,
            category,
            image: normalizeImage(image)
        };
    }

    function getPageCategory() {
        const path = window.location.pathname.toLowerCase();

        if (path.includes("abbigliamento") ||
            path.includes("tshirt") ||
            path.includes("jeans") ||
            path.includes("pantaloni") ||
            path.includes("maglieria") ||
            path.includes("giacche")) {
            return "ABBIGLIAMENTO";
        }

        if (path.includes("accessori") ||
            path.includes("borse") ||
            path.includes("cappelli") ||
            path.includes("portafogli")) {
            return "ACCESSORI";
        }

        return "SCARPE";
    }

    function addButtonsToProductCards() {
        document.querySelectorAll(".product-card").forEach(card => {
            if (card.dataset.cartReady === "1") return;

            const product = getProductFromCard(card);

            if (!product) return;

            const button = document.createElement("button");

            button.type = "button";
            button.className = "fs-add-cart-button";
            button.innerHTML = `
                <span>AGGIUNGI AL CARRELLO</span>
                <span>+</span>
            `;

            button.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                addToCart(product);
            });

            card.appendChild(button);
            card.dataset.cartReady = "1";
        });
    }

    function addButtonToProductPage() {
        const productName = document.getElementById("productName");

        if (!productName) return;

        if (document.getElementById("fs-product-add")) return;

        const productImage = document.getElementById("productImage");
        const productBrand = document.getElementById("productBrand");
        const productCategory = document.getElementById("metaCategory");
        const dmButton = document.getElementById("dmButton");

        if (!dmButton) return;

        let id = new URLSearchParams(window.location.search).get("id");

        if (!id) {
            id = productName.textContent
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");
        }

        const product = {
            id,
            name: productName.textContent.trim(),
            brand: productBrand ? productBrand.textContent.trim() : "",
            category: productCategory ? productCategory.textContent.trim() : "",
            image: productImage ? normalizeImage(productImage.getAttribute("src")) : ""
        };

        const button = document.createElement("button");

        button.id = "fs-product-add";
        button.type = "button";
        button.className = "fs-product-add";
        button.innerHTML = `
            <span>AGGIUNGI AL CARRELLO</span>
            <span>+</span>
        `;

        button.addEventListener("click", () => {
            addToCart(product);
        });

        dmButton.parentNode.insertBefore(button, dmButton);
    }

    function init() {
        createCartUI();
        addButtonsToProductCards();
        addButtonToProductPage();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

