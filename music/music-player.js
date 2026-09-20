/* =========================================================
   FUORISCHEMA MUSIC PLAYER
   Player musicale commerciale
   ========================================================= */

(function () {
    "use strict";

    const MUSIC_CONFIG = {
        track: "music/si-salvi-chi-puo.mp3",
        title: "",
        volume: 0.18
    };

    const STORAGE_KEY = "fuorischema_music_state";

    let audio = null;
    let player = null;

    function createPlayer() {
        if (document.getElementById("fs-music-player")) {
            return;
        }

        player = document.createElement("div");
        player.id = "fs-music-player";

        player.innerHTML = `
            <button id="fs-music-play" type="button" aria-label="Riproduci musica">
                PLAY
            </button>

            <div id="fs-music-info">
                <span id="fs-music-label">@palmhi<br>@sig.versace_official</span>
                <span id="fs-music-title">SI SALVI CHI PUO</span>
            </div>

            <input
                id="fs-music-progress"
                type="range"
                min="0"
                max="100"
                value="0"
                step="0.1"
                aria-label="Posizione musica"
            >

            <input
                id="fs-music-volume"
                type="range"
                min="0"
                max="1"
                value="${MUSIC_CONFIG.volume}"
                step="0.01"
                aria-label="Volume musica"
            >

            <span id="fs-music-status">READY</span>
        `;

        document.body.appendChild(player);

        bindControls();
    }

    function createAudio() {
        if (!MUSIC_CONFIG.track) {
            return;
        }

        audio = new Audio(MUSIC_CONFIG.track);
        audio.preload = "auto";
        audio.volume = MUSIC_CONFIG.volume;
        audio.muted = false;

        restoreState();

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("play", updateStatus);
        audio.addEventListener("pause", updateStatus);
        audio.addEventListener("ended", handleEnded);
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: "SI SALVI CHI PUO",
                artist: "@palmhi / @sig.versace_official",
                album: "FUORISCHEMA"
            });

            navigator.mediaSession.setActionHandler("play", function () {
                audio.play().catch(function () {});
            });

            navigator.mediaSession.setActionHandler("pause", function () {
                audio.pause();
            });
        }
    }

    function bindControls() {
        const playButton = document.getElementById("fs-music-play");
        const progress = document.getElementById("fs-music-progress");
        const volume = document.getElementById("fs-music-volume");

        if (playButton) {
            playButton.addEventListener("click", togglePlay);
        }

        if (progress) {
            progress.addEventListener("input", function () {
                if (!audio || !audio.duration) return;

                audio.currentTime =
                    (Number(progress.value) / 100) * audio.duration;

                saveState();
            });
        }

        if (volume) {
            volume.addEventListener("input", function () {
                if (!audio) return;

                audio.volume = Number(volume.value);
                saveState();
            });
        }
    }

    async function togglePlay() {
        if (!audio) {
            updateStatus("NO TRACK");
            return;
        }

        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }

            saveState();
        } catch (error) {
            console.warn("FUORISCHEMA Music:", error);
            updateStatus("PLAY");
        }
    }

    function updateProgress() {
        const progress = document.getElementById("fs-music-progress");

        if (!progress || !audio || !audio.duration) {
            return;
        }

        progress.value =
            (audio.currentTime / audio.duration) * 100;

        saveState();
    }

    function updateStatus(forcedStatus) {
        if (typeof forcedStatus !== "string") {
            forcedStatus = "";
        }
        const playButton = document.getElementById("fs-music-play");
        const status = document.getElementById("fs-music-status");

        if (!audio) {
            if (playButton) playButton.textContent = "PLAY";
            if (status) status.textContent = forcedStatus || "READY";
            return;
        }

        if (audio.paused) {
            if (playButton) playButton.textContent = "PLAY";
            if (status) status.textContent = forcedStatus || "PAUSED";
        } else {
            if (playButton) playButton.textContent = "PAUSE";
            if (status) status.textContent = forcedStatus || "PLAYING";
        }
    }

    function handleEnded() {
        const progress = document.getElementById("fs-music-progress");

        if (progress) {
            progress.value = 0;
        }

        saveState();

        updateStatus("ENDED");
    }

    function saveState() {
        if (!audio) {
            return;
        }

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    currentTime: audio.currentTime || 0,
                    volume: audio.volume,
                    playing: !audio.paused
                })
            );
        } catch (error) {
            console.warn("FUORISCHEMA Music storage:", error);
        }
    }

    function restoreState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return;
            }

            const state = JSON.parse(raw);

            if (typeof state.volume === "number") {
                audio.volume = state.volume;

                const volume =
                    document.getElementById("fs-music-volume");

                if (volume) {
                    volume.value = state.volume;
                }
            }

            if (typeof state.currentTime === "number") {
                audio.addEventListener("loadedmetadata", function () {
                    if (state.currentTime < audio.duration) {
                        audio.currentTime = state.currentTime;
                    }
                }, { once: true });
            }
        } catch (error) {
            console.warn("FUORISCHEMA Music restore:", error);
        }
    }

    function init() {
        createPlayer();
        createAudio();
        updateStatus();

        let autoplayStarted = false;

        function startAfterInteraction() {
            if (!audio || !audio.paused || autoplayStarted) {
                return;
            }

            audio.play().then(function () {
                autoplayStarted = true;
                saveState();
                updateStatus();
                document.removeEventListener("pointerdown", startAfterInteraction);
                document.removeEventListener("keydown", startAfterInteraction);
            }).catch(function () {});
        }

        document.addEventListener("pointerdown", startAfterInteraction, { once: false });
        document.addEventListener("keydown", startAfterInteraction, { once: false });
        if (audio) {
            audio.play().then(function () {
                saveState();
                updateStatus();
            }).catch(function () {
                updateStatus("CLICK PLAY");
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.FUORISCHEMA_MUSIC = MUSIC_CONFIG;
})();









