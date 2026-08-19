import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://dbjfvphcrfvajrtkeswg.supabase.co";

export const SUPABASE_KEY = "sb_publishable_ojrCWgqvcViR8HKT7N_uVg_SHnZ36IZ";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// FSocial safety module: loaded only on FSocial to avoid affecting the rest of the store.
if (window.location.pathname.toLowerCase().endsWith("/fsocial.html")) {
    globalThis.__FUORISCHEMA_SUPABASE__ = supabase;
    import("./fsocial-safety.js").catch((error) => {
        console.error("FSocial safety module failed to load:", error);
    });
}
