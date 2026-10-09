/* ============================================================
 * 晨间自学室 · 后端同步模块（Supabase v2 客户端）
 * 作用：把网站的登录、课表、打卡、错词本、便签等数据同步到云端，
 *       让同一账号在不同设备看到同一份数据；管理员后台读所有用户。
 *
 * 引入方式（放到网站的 <script> 之前）：
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="backend-config.js"></script>
 *   <script src="supabase-integration.js"></script>
 *
 * 未配置后端时：所有函数自动跳过，网站继续用浏览器本地存储，不报错。
 * ============================================================ */
(function () {
  "use strict";

  function ready() {
    return window.backendReady && window.backendReady() && window.supabase;
  }

  var supabase = null;
  if (ready()) {
    supabase = window.supabase.createClient(
      window.SUPABASE_URL, window.SUPABASE_ANON_KEY
    );
  }

  /* ---------- 登录 / 注册 ----------
   * 注册：supabase.auth.signUp({email,password})
   * 登录：supabase.auth.signInWithPassword({email,password})
   * 退出：supabase.auth.signOut()
   * 例：
   *   await Backend.signup(email, pw);   // 注册
   *   await Backend.login(email, pw);    // 登录
   *   await Backend.logout();
   * 返回 {ok:true} 或 {ok:false, msg:"..."}；msg 会把后端提示（如“邮箱已被占用”）透传出来。
   */

  async function doAuth(fn) {
    if (!supabase) return { ok: false, msg: "后端未配置，仍用本机登录" };
    try {
      var r = await fn();
      if (r.error) return { ok: false, msg: r.error.message };
      return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message || e) }; }
  }
  var Backend = {
    signup: function (email, pw) {
      return doAuth(function () { return supabase.auth.signUp({ email: email, password: pw }); });
    },
    login: function (email, pw) {
      return doAuth(function () { return supabase.auth.signInWithPassword({ email: email, password: pw }); });
    },
    logout: function () {
      return doAuth(function () { return supabase.auth.signOut(); });
    },
    current: function () {
      return supabase ? (supabase.auth.getSession().then(function (s) { return s.data.session || null; })) : Promise.resolve(null);
    },
    userId: function () {
      var s = supabase && supabase.auth.getSession();
      // 简化：登录后从 session 取 user.id
      return s ? s.then(function (x) { return x.data.session && x.data.session.user && x.data.session.user.id; }) : Promise.resolve(null);
    },

    /* ---------- 数据读写：按 key 存取一份用户数据（value 是任意对象/字符串） ---------- */
    saveData: async function (key, value) {
      if (!supabase) return false;
      var uid = await Backend.userId(); if (!uid) return false;
      var r = await supabase
        .from("user_data")
        .upsert({ user_id: uid, key: key, value: value, updated_at: new Date().toISOString() });
      return !r.error;
    },
    loadData: async function (key) {
      if (!supabase) return null;
      var uid = await Backend.userId(); if (!uid) return null;
      var r = await supabase
        .from("user_data").select("value").eq("user_id", uid).eq("key", key).single();
      if (r.error || !r.data) return null;
      return r.data.value;
    },
    /* 把本机一串键批量推到云端（如：schedimg / schedule / wrongbook / notes / focus / streak …） */
    syncLocalKeys: async function (keys, mbLoad) {
      if (!supabase) return 0;
      var n = 0;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i], v = mbLoad(k, "");
        if (v !== "" && v !== null) { if (await Backend.saveData(k, v)) n++; }
      }
      return n;
    },

    /* ---------- 管理员：拉全部用户与数据 ---------- */
    adminUsers: async function () {
      if (!supabase) return [];
      var r = await supabase.rpc("admin_users");
      return r.data || [];
    },
    /* 管理员清除某用户全部云端数据 */
    adminClearUser: async function (userId) {
      if (!supabase) return false;
      var r = await supabase.from("user_data").delete().eq("user_id", userId);
      return !r.error;
    }
  };

  window.Backend = Backend;
})();
