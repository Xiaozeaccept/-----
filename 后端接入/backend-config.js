/* ============================================================
 * 晨间自学室 · 后端连接配置（已填入真实值）
 * URL:  https://cilhxwcbjwsgbhpuqxpq.supabase.co
 * Key:  sb_publishable_...（Supabase 新格式「可发布密钥」，即 anon 密钥）
 * ============================================================ */
window.SUPABASE_URL = "https://cilhxwcbjwsgbhpuqxpq.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_0rKcIUAoQ42aQeYg4j7FZg_tiEz6TVx";

/* 是否已配置好后端（没配置时网站照常走本地存储，不报错） */
window.backendReady = function () {
  return !!(window.SUPABASE_URL &&
    window.SUPABASE_URL.indexOf("你的项目名") < 0 &&
    window.SUPABASE_ANON_KEY &&
    window.SUPABASE_ANON_KEY.indexOf("...") < 0);
};
