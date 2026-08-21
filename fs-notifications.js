(function () {
    if (window.FSNotifications) return;

    const style = document.createElement("style");

    style.textContent = `
        .fs-global-notification-wrap {
            position: fixed !important;
            top: max(14px, env(safe-area-inset-top)) !important;
            left: 12px !important;
            right: 12px !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
            display: flex;
            justify-content: flex-end;
        }

        .fs-global-notification {
            width: min(390px, 100%);
            box-sizing: border-box;
            display: flex;
            align-items: flex-start;
            gap: 13px;
            padding: 15px;
            background: rgba(18, 8, 5, .97);
            border: 1px solid rgba(255, 78, 0, .35);
            border-left: 3px solid #ff4e00;
            box-shadow: 0 20px 60px rgba(0,0,0,.5);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            transform: translateY(-140%);
            opacity: 0;
            transition:
                transform .45s cubic-bezier(.2,.8,.2,1),
                opacity .3s ease;
        }

        .fs-global-notification.is-visible {
            transform: translateY(0);
            opacity: 1;
        }

        .fs-global-notification.is-leaving {
            transform: translateY(-140%);
            opacity: 0;
        }

        .fs-global-notification-icon {
            width: 32px;
            height: 32px;
            flex: 0 0 32px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(255,78,0,.4);
            color: #ff4e00;
            font-weight: 900;
        }

        .fs-global-notification-title {
            margin: 0 0 5px;
            color: #fff;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.8px;
        }

        .fs-global-notification-text {
            margin: 0;
            color: #aaa;
            font-size: 12px;
            line-height: 1.5;
        }

        .fs-confirm-overlay {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483646 !important;
            display: grid;
            place-items: center;
            padding: 20px;
            box-sizing: border-box;
            background: rgba(0,0,0,.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            opacity: 0;
            visibility: hidden;
            transition: opacity .25s ease, visibility .25s ease;
        }

        .fs-confirm-overlay.is-visible {
            opacity: 1;
            visibility: visible;
        }

        .fs-confirm-card {
            width: min(420px, 100%);
            box-sizing: border-box;
            padding: 28px;
            background: #120805;
            border: 1px solid rgba(255,78,0,.28);
            box-shadow: 0 30px 100px rgba(0,0,0,.6);
            transform: translateY(18px) scale(.96);
            transition: transform .4s cubic-bezier(.2,.8,.2,1);
        }

        .fs-confirm-overlay.is-visible .fs-confirm-card {
            transform: translateY(0) scale(1);
        }

        .fs-confirm-eyebrow {
            margin-bottom: 12px;
            color: #ff4e00;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 2px;
        }

        .fs-confirm-title {
            margin: 0 0 10px;
            color: #fff;
            font-size: clamp(28px, 8vw, 42px);
            line-height: .95;
            letter-spacing: -1.5px;
            font-weight: 900;
        }

        .fs-confirm-message {
            margin: 0 0 24px;
            color: #999;
            font-size: 13px;
            line-height: 1.55;
        }

        .fs-confirm-actions {
            display: flex;
            gap: 10px;
        }

        .fs-confirm-actions button {
            flex: 1;
            min-height: 46px;
            border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.04);
            color: #fff;
            font: inherit;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.2px;
            cursor: pointer;
        }

        .fs-confirm-actions .danger {
            background: #ff4e00;
            border-color: #ff4e00;
            color: #050505;
        }

        @media(max-width:600px) {
            .fs-confirm-overlay {
                align-items: end;
                padding: 12px;
            }

            .fs-confirm-card {
                width: 100%;
                padding: 24px 20px;
                border-radius: 18px 18px 12px 12px;
            }

            .fs-confirm-actions button {
                min-height: 50px;
            }
        }
    `;

    document.head.appendChild(style);

    function notify(title, message) {
        let wrap = document.querySelector(".fs-global-notification-wrap");

        if (!wrap) {
            wrap = document.createElement("div");
            wrap.className = "fs-global-notification-wrap";
            document.body.appendChild(wrap);
        }

        wrap.innerHTML = `
            <div class="fs-global-notification" role="alert">
                <div class="fs-global-notification-icon">!</div>
                <div>
                    <div class="fs-global-notification-title"></div>
                    <p class="fs-global-notification-text"></p>
                </div>
            </div>
        `;

        const notification = wrap.querySelector(".fs-global-notification");
        notification.querySelector(".fs-global-notification-title").textContent = title;
        notification.querySelector(".fs-global-notification-text").textContent = message;

        requestAnimationFrame(() => {
            notification.classList.add("is-visible");
        });

        clearTimeout(wrap.__timer);

        wrap.__timer = setTimeout(() => {
            notification.classList.remove("is-visible");
            notification.classList.add("is-leaving");

            setTimeout(() => {
                wrap.remove();
            }, 450);
        }, 4000);
    }

    function confirm(title, message, confirmText = "CONFERMA") {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.className = "fs-confirm-overlay";

            overlay.innerHTML = `
                <div class="fs-confirm-card" role="dialog" aria-modal="true">
                    <div class="fs-confirm-eyebrow">FUORISCHEMA</div>
                    <h2 class="fs-confirm-title"></h2>
                    <p class="fs-confirm-message"></p>

                    <div class="fs-confirm-actions">
                        <button type="button" data-action="cancel">
                            ANNULLA
                        </button>

                        <button type="button" class="danger" data-action="confirm"></button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.querySelector(".fs-confirm-title").textContent = title;
            overlay.querySelector(".fs-confirm-message").textContent = message;
            overlay.querySelector('[data-action="confirm"]').textContent = confirmText;

            const finish = value => {
                overlay.classList.remove("is-visible");

                setTimeout(() => {
                    overlay.remove();
                    resolve(value);
                }, 250);
            };

            overlay.querySelector('[data-action="cancel"]')
                .addEventListener("click", () => finish(false));

            overlay.querySelector('[data-action="confirm"]')
                .addEventListener("click", () => finish(true));

            overlay.addEventListener("click", event => {
                if (event.target === overlay) finish(false);
            });

            requestAnimationFrame(() => {
                overlay.classList.add("is-visible");
            });
        });
    }

    window.FSNotifications = {
        notify,
        confirm
    };
})();
