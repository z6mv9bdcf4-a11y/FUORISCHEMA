const BATTLE_RECORD_STYLE = `
.fsocial-battle-record{margin-top:2px;padding:16px 18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,rgba(255,77,0,.07),rgba(255,255,255,.02));border-radius:4px;max-width:620px}
.fsocial-battle-record-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.fsocial-battle-record-title{font:900 10px/1 Inter,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#151515}
.fsocial-battle-record-mark{color:#ff4d00;font-size:15px}
.fsocial-battle-record-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.fsocial-battle-record-stat{min-width:0;padding:9px 6px;border:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.2);text-align:center}
.fsocial-battle-record-value{display:block;color:#151515;font-size:17px;font-weight:900;line-height:1.1}
.fsocial-battle-record-label{display:block;margin-top:4px;color:#555;font-size:7px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
.fsocial-battle-record-empty{color:#555;font-size:9px;line-height:1.5;letter-spacing:.5px}
@media(max-width:480px){.fsocial-battle-record{width:100%;padding:14px 10px}.fsocial-battle-record-grid{gap:4px}.fsocial-battle-record-value{font-size:15px}.fsocial-battle-record-label{font-size:6.5px}}
`;

const battleRecordStyleElement = document.createElement("style");
battleRecordStyleElement.id = "fsocialBattleRecordStyle";
battleRecordStyleElement.textContent = BATTLE_RECORD_STYLE;
document.head.appendChild(battleRecordStyleElement);
function battleRecordEscape(value){
    return String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c]));
}

async function loadBattleRecord(){
    const supabase = globalThis.__FUORISCHEMA_SUPABASE__;
    const stats = document.querySelector(".profile-stats");
    if(!supabase || !stats || document.getElementById("fsocialBattleRecord")) return;

    const params = new URLSearchParams(window.location.search);
    const current = await supabase.auth.getSession();
    const sessionUserId = current?.data?.session?.user?.id;
    const userId = params.get("id") || sessionUserId;
    if(!userId) return;

    const {data,error} = await supabase
        .from("fsocial_battle_records")
        .select("total_battles,wins,losses,draws,win_rate,current_win_streak")
        .eq("user_id",userId)
        .maybeSingle();

    if(error){
        console.error("FSocial Battle Record failed:",error);
        return;
    }

    const record = data || {total_battles:0,wins:0,losses:0,draws:0,win_rate:0,current_win_streak:0};
    const card = document.createElement("section");
    card.id = "fsocialBattleRecord";
    card.className = "fsocial-battle-record";
    card.setAttribute("aria-label","Battle Record");

    if(Number(record.total_battles) === 0){
        card.innerHTML = `<div class="fsocial-battle-record-head"><span class="fsocial-battle-record-title">⚔️ BATTLE RECORD</span></div><div class="fsocial-battle-record-empty">Nessuna Battle completata. Accetta una sfida e costruisci il tuo record.</div>`;
    }else{
        card.innerHTML = `<div class="fsocial-battle-record-head"><span class="fsocial-battle-record-title">⚔️ BATTLE RECORD</span><span class="fsocial-battle-record-mark">🔥</span></div><div class="fsocial-battle-record-grid"><div class="fsocial-battle-record-stat"><span class="fsocial-battle-record-value">${Number(record.wins)}</span><span class="fsocial-battle-record-label">Vittorie</span></div><div class="fsocial-battle-record-stat"><span class="fsocial-battle-record-value">${Number(record.losses)}</span><span class="fsocial-battle-record-label">Sconfitte</span></div><div class="fsocial-battle-record-stat"><span class="fsocial-battle-record-value">${Number(record.total_battles)}</span><span class="fsocial-battle-record-label">Battle</span></div><div class="fsocial-battle-record-stat"><span class="fsocial-battle-record-value">${Number(record.win_rate)}%</span><span class="fsocial-battle-record-label">Win rate</span></div></div>${Number(record.current_win_streak)>0?`<div class="fsocial-battle-record-empty" style="margin-top:10px">🔥 ${Number(record.current_win_streak)} vittorie consecutive</div>`:""}`;
    }

    stats.insertAdjacentElement("afterend",card);
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",loadBattleRecord,{once:true});
else loadBattleRecord();
