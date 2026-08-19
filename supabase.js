import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://dbjfvphcrfvajrtkeswg.supabase.co";

export const SUPABASE_KEY = "sb_publishable_ojrCWgqvcViR8HKT7N_uVg_SHnZ36IZ";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const currentPath = window.location.pathname.toLowerCase();

globalThis.__FUORISCHEMA_SUPABASE__ = supabase;

// FSocial safety module: loaded only on FSocial to avoid affecting the rest of the store.
if (currentPath.endsWith("/fsocial.html")) {
    import("./fsocial-safety.js").catch((error) => {
        console.error("FSocial safety module failed to load:", error);
    });

    import("./fsocial-owner-tools.js").catch((error) => {
        console.error("FSocial owner tools failed to load:", error);
    });

    import("./fsocial-bottom-nav.js").catch((error) => {
        console.error("FSocial bottom navigation failed to load:", error);
    });

    import("./fsocial-notification-bridge.js").catch((error) => {
        console.error("FSocial notification bridge failed to load:", error);
    });
}

// Profile page: reuse the same FSocial bottom-bar visual language without
// replacing the existing navigation or changing its working destinations.
if (currentPath.endsWith("/area-personale.html")) {
    import("./fsocial-profile-nav.js").catch((error) => {
        console.error("FSocial profile navigation styling failed to load:", error);
    });
}

// Owner-only moderation UI. The module performs its own authenticated owner check
// and remains invisible to all other users.
import("./fsocial-admin-ui.js").catch((error) => {
    console.error("FSocial admin module failed to load:", error);
});
