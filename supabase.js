import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://dbjfvphcrfvajrtkeswg.supabase.co";
export const SUPABASE_KEY = "sb_publishable_ojrCWgqvcViR8HKT7N_uVg_SHnZ36IZ";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
const currentPath = window.location.pathname.toLowerCase();
globalThis.__FUORISCHEMA_SUPABASE__ = supabase;

if (currentPath.endsWith("/login.html")) {
    import("./auth-flow-bridge.js").catch((error) => console.error("FUORISCHEMA auth bridge failed to load:", error));
}

