const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  const STYLE_ID = "fsocial-safety-style";
  const ACTIONS_ID = "fsocial-safety-actions";
  const REASONS = [
    ["spam", "Spam / commenti ripetitivi"],
    ["harassment", "Insulti, molestie o minacce"],
    ["hate", "Odio o discriminazione"],
    ["inappropriate", "Contenuti sessuali o inappropriati"],
    ["scam", "Truffa, frode o comportamento sospetto"],
    ["