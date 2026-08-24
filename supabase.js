import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://dbjfvphcrfvajrtkeswg.supabase.co";
export const SUPABASE_KEY = "sb_publishable_ojrCWgqvcViR8HKT7N_uVg_SHnZ36IZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const currentPath = window.location.pathname.toLowerCase();
globalThis.__FUORISCHEMA_SUPABASE__ = supabase;

if (currentPath.endsWith("/fsocial.html")) {
    import("./fsocial-safety.js").catch((error) => console.error("FSocial safety module failed to load:", error));
    import("./fsocial-owner-tools.js").catch((error) => console.error("FSocial owner tools failed to load:", error));
    import("./fsocial-bottom-nav.js").catch((error) => console.error("FSocial bottom navigation failed to load:", error));
    import("./fsocial-surgical-overrides.js").catch((error) => console.error("FSocial surgical overrides failed to load:", error));
    import("./fsocial-surgical-overrides-2.js").catch((error) => console.error("FSocial social interaction overrides failed to load", error));
    import("./fsocial-battle-vote-override.js").catch((error) => console.error("FSocial Battle vote override failed to load", error));
    import("./fsocial-final-home.js").catch((error) => console.error("FSocial final home layer failed to load:", error));
}

if (currentPath.endsWith("/area-personale.html")) {
    import("./fsocial-profile-nav.js").catch((error) => console.error("FSocial profile navigation styling failed to load:", error));
    import("./fsocial-profile-v2.js").catch((error) => console.error("FSocial profile V2 failed to load:", error));
    import("./fsocial-battle-record.js").catch((error) => console.error("FSocial Battle Record failed to load:", error));
    import("./fsocial-battle-ranking.js").catch((error) => console.error("FSocial Battle Ranking failed to load", error));
    import("./fsocial-surgical-overrides.js").catch((error) => console.error("FSocial surgical overrides failed to load", error));
    import("./fsocial-surgical-overrides-2.js").catch((error) => console.error("FSocial social interaction overrides failed to load", error));
    import("./fsocial-final-profile.js").catch((error) => console.error("FSocial final profile layer failed to load:", error));
}

if (currentPath.endsWith("/battle.html")) {
    import("./fsocial-battle-page-overrides.js").catch((error) => console.error("FSocial Battle page overrides failed to load", error));
    import("./fsocial-final-battle.js").catch((error) => console.error("FSocial final Battle layer failed to load:", error));
}

if (currentPath.endsWith("/area-personale.html") || currentPath.endsWith("/fsocial.html") || currentPath.endsWith("/fsocial-moderazione.html")) {
    import("./fsocial-admin-ui.js").catch((error) => console.error("FSocial admin module failed to load:", error));
}
