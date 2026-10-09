/* ============================================================
 * 晨间自学室 · 后端连接配置
 * 在 Supabase 控制台 → Project Settings → API 里找到这两项，填进来。
 * URL: 形如  https://xxxx.supabase.co
 * Key:  形如  eyJhbGciOi...（anon public key）
 * ============================================================ */
window.SUPABASE_URL = "https://你的项目名.supabase.co"; // ← 改成你的
window.SUPABASE_ANON_KEY = "eyJhbGciOi...";            // ← 改成你的

/* 是否已配置好后端（没配置时网站照常走本地存储，不报错） */
window.backendReady = function () {
  return !!(window.SUPABASE_URL &&
    window.SUPABASE_URL.indexOf("你的项目名") < 0 &&
    window.SUPABASE_ANON_KEY &&
    window.SUPABASE_ANON_KEY.indexOf("...") < 0);
};
