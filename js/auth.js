/* =========================================================
   CySim — auth.js  ·  đăng nhập / xác minh email / vai trò

   LÀ GÌ   : Màn hình khoá trước dashboard: đăng ký, đăng nhập, mã 6 số,
             "Ghi nhớ đăng nhập", kho tài khoản, ô tên người dùng góc
             phải trên và nút đăng xuất. Thêm hai đường vào không cần
             password: startGuest() (vào học ngay, mọi thứ ghi dưới tên
             "guest") và claimAdmin()/adminCodePass() (mã quản trị tự đặt
             của máy, tài khoản đăng ký kèm mã sẽ lên vai trò quản trị).

   CẦN BIẾT ĐÂY LÀ GÌ: ứng dụng chạy hoàn toàn trong trình duyệt, không có
   máy chủ. "Tài khoản" và "mật khẩu" chỉ tồn tại trên chính máy bạn, và mã
   xác minh chỉ thực sự gửi đi email khi đã cấu hình EmailJS (xem mục
   "Cấu hình gửi mã qua email" trong trang Hướng dẫn). Chưa cấu hình = chế
   độ demo, mã hiện tại màn hình. Vai trò admin CŨNG chỉ là nhãn trên máy
   này — xem trang Quản trị nói thẳng. Giao diện nói rõ điều này thay vì giả
   vờ như một hệ thống đăng nhập thật.

   CHẠY     : gate(callback) là cửa duy nhất. Đã đăng nhập -> gọi callback
             ngay (boot.js startApp). Chưa -> body nhận .auth-locked, khôi
             phục lượt đang dở (PENDING_KEY) hoặc dựng bước đăng nhập và
             DỪNG ở đó; nhập đúng mới startSession() rồi chạy callback.
             Mật khẩu lưu dạng PBKDF2-SHA256(muối, 150.000 vòng) qua CyUtil,
             không bao giờ lưu plaintext; muối giả DUMMY_* bắt mọi email chưa
             đăng ký đi qua đúng một lần băm nên thời gian trả lời không tố
             "tài khoản này có tồn tại". Sai 5 lần khoá 30 giây.

   TOÀN CẦU : định nghĩa Auth = { gate, logout, isLoggedIn, id, displayName,
             isGuest, isAdmin, allUsers, setRole, claimAdmin,
             adminCodeDefined, startGuest, emailConfig, saveEmailConfig,
             renderAuthModeNotice, sendTestEmail } và AUTH_CONFIG.
             allUsers() cố ý trả về tên/email/role/verified/createdAt — không
             bao giờ kèm salt hay hash.
             DOM: #authOverlay #authTitle #authSub #authModeNotice
             #authModeText #authMsg #authRegForm #authLoginForm
             #authVerifyForm #authCode #authResend #authBack #authDemoCode
             #authMailbox #authSaved #authLoginAdmin #authRegAdmin
             [data-auth-guest] #userBox #userName #userEmail #userAvatar
             #logoutBtn.
             localStorage: cysim-users / -session-remember (chỉ khi tích "Ghi nhớ
             đăng nhập") / -last-login / -otp / -otp-pending / -emailjs /
             -admin-code (chỉ chứa {salt, iterations, hash}, không chứa mã gốc).
             sessionStorage: cysim-session — phiên thường và phiên khách. Khách
             lưu name: "" chứ KHÔNG lưu chữ đã dịch: displayName() dịch tại chỗ
             vẽ, nếu không thì đổi ngôn ngữ sau khi vào khách để lại "Invité"
             chết giữa màn hình tiếng Việt (đo thật 30-10-2026).
             Sự kiện: phát "cysim:session" (document) mỗi lần phiên đổi — đăng
             nhập thành công, đăng xuất, hoặc vào chế độ khách — để các khối
             nội dung theo tài khoản (chat AI, trang Cài đặt/Quản trị, dữ liệu
             khách cần dời) nạp lại đúng dữ liệu.
   ========================================================= */

const AUTH_CONFIG = {
  // Giá trị cứng dùng làm mặc định. Cách khuyên dùng là nhập 3 mã trong
  // bảng cấu hình ở trang Hướng dẫn — lưu vào localStorage, không phải
  // sửa file này.
  emailjs: { publicKey: "", serviceId: "", templateId: "" },
  codeLength: 6,
  codeTtlMs: 5 * 60 * 1000,
  maxCodeAttempts: 5,
  resendCooldownMs: 60 * 1000,
  requireCodeOnLogin: true,
  sessionHours: 12,          // phiên đóng theo tab: hết hạn sau 12 giờ
  rememberedSessionDays: 30, // khi tích "Ghi nhớ đăng nhập"
  minPasswordLength: 8,
  maxLoginFails: 5,
  lockMs: 30 * 1000,
};

const Auth = (() => {
  const cfg = AUTH_CONFIG;
  const USERS_KEY = "cysim-users";
  const SESSION_KEY = "cysim-session";
  const REMEMBER_KEY = "cysim-session-remember";
  const LAST_KEY = "cysim-last-login";
  const OTP_KEY = "cysim-otp";
  const PENDING_KEY = "cysim-otp-pending";
  const EMAILJS_KEY = "cysim-emailjs";
  /* Mã quản trị của máy này (chỉ chứa BẢN BĂM) và tên tài khoản khách. */
  const ADMIN_KEY = "cysim-admin-code";
  const GUEST_ID = "guest";
  const ADMIN_ITERATIONS = 150000;

  /* Bản băm/muối giả: người dùng KHÔNG tồn tại vẫn phải đi qua đúng một lần
     băm và một lần so sánh, nên cần giá trị cùng độ dài với bản thật
     (pbkdf2Hex trả 64 ký tự hex — CyUtil.randomHex(32) — nên DUMMY cũng phải
     64, ngắn hơn là constantEqual chết ở dòng so độ dài trước khi kịp so nội
     dung, tức là thời gian trả lời lộ ra "email này chưa đăng ký". */
  const DUMMY_SALT = "00".repeat(16);
  const DUMMY_HASH = "00".repeat(32);

  const tr = (s) => (typeof t === "function" ? t(s) : s);

  /* ---------- cấu hình EmailJS ---------- */
  function emailConfig() {
    const saved = CyUtil.readJson(localStorage, EMAILJS_KEY, null);
    const merged = { ...cfg.emailjs, ...(saved || {}) };
    const complete = !!(merged.publicKey && merged.serviceId && merged.templateId);
    return { ...merged, complete };
  }
  function saveEmailConfig(next) {
    CyUtil.writeJson(localStorage, EMAILJS_KEY, next);
    renderAuthModeNotice();
    return emailConfig();
  }

  /* ---------- phiên đăng nhập ---------- */
  function readSession(store, key) {
    const s = CyUtil.readJson(store, key, null);
    if (!s) return null;
    if (Date.now() > s.exp) {
      CyUtil.removeKey(store, key);
      return null;
    }
    return s;
  }
  function getSession() {
    return readSession(sessionStorage, SESSION_KEY) || readSession(localStorage, REMEMBER_KEY);
  }
  function startSession(user, remember) {
    const session = {
      email: user.email,
      name: user.name,
      role: user.role === "admin" ? "admin" : "learner",
      exp: Date.now() + (remember ? cfg.rememberedSessionDays : cfg.sessionHours / 24) * 86400000,
    };
    // Mặc định chỉ lưu trong tab hiện tại; "Ghi nhớ" mới viết vào localStorage
    CyUtil.writeJson(sessionStorage, SESSION_KEY, session);
    if (remember) CyUtil.writeJson(localStorage, REMEMBER_KEY, session);
    else CyUtil.removeKey(localStorage, REMEMBER_KEY);
    /* Báo cho các khối "một người dùng đang nhìn" biết id vừa đổi — khung chat
       AI dùng để nạp đúng lịch sử của tài khoản mới, không để lại hội thoại
       của tài khoản cũ trên màn hình. */
    document.dispatchEvent(new CustomEvent("cysim:session", { detail: { email: session.email } }));
  }
  function clearSession() {
    CyUtil.removeKey(sessionStorage, SESSION_KEY);
    CyUtil.removeKey(localStorage, REMEMBER_KEY);
    CyUtil.removeKey(sessionStorage, OTP_KEY);
    CyUtil.removeKey(sessionStorage, PENDING_KEY);
  }

  const isLoggedIn = () => !!getSession();
  const currentId = () => getSession()?.email || GUEST_ID;
  /* Tên khách KHÔNG được lấy từ phiên. Phiên khách được ghi một lần lúc bấm
     nút, nên nhét chữ đã dịch vào đó là đóng băng ngôn ngữ của đúng một khoảnh
     khắc: vào bằng tiếng Pháp rồi đổi tiếng Việt sẽ thấy "Invité" chết giữa
     bảng xếp hạng. Khách vì thế lưu name rỗng và đọc bản dịch tại chỗ hiển thị. */
  const displayName = () => {
    const s = getSession();
    if (!s) return "";
    return s.role === "guest" ? tr("Khách") : s.name || "";
  };
  const isGuest = () => getSession()?.role === "guest";
  /* Vai trò đọc từ PHIÊN, không đọc từ users[]: một lần đọc localStorage mỗi
     lần showView() là không cần thiết, và phiên chính là thứ vừa được kiểm tra
     mật khẩu + mã email. Với khách thì luôn false. */
  const isAdmin = () => getSession()?.role === "admin";

  /* ---------- mã quản trị của máy này ----------
     Không có mã chuẩn nào viết trong source — đó là điểm chính của khối này.
     Máy chưa có mã thì LẦN KHAI ĐẦU TIÊN đặt luôn mã (adminCodePass trả
     khai=true); từ đó về sau mọi tài khoản muốn lên quản trị phải khớp mã đã
     băm trong cysim-admin-code. Ai có quyền mở DevTools thì vẫn đọc/ghi được
     localStorage, nên đây là lớp "một người lớn trông một lớp trên chung một
     máy", không phải phân quyền thật — trang Quản trị nói đúng điều đó. */
  const adminRecord = () => CyUtil.readJson(localStorage, ADMIN_KEY, null);
  const adminCodeDefined = () => !!adminRecord();

  async function adminCodePass(code) {
    let rec = adminRecord();
    const khai = !rec;
    if (khai) rec = { salt: CyUtil.randomHex(16), iterations: ADMIN_ITERATIONS };
    const hash = await CyUtil.pbkdf2Hex(code, rec.salt, rec.iterations || ADMIN_ITERATIONS);
    if (khai) {
      CyUtil.writeJson(localStorage, ADMIN_KEY, { ...rec, hash, setAt: Date.now() });
      return { ok: true, khai: true };
    }
    if (!CyUtil.constantEqual(hash, rec.hash)) return { ok: false, reason: "wrong" };
    return { ok: true, khai: false };
  }

  /* Cấp role admin cho tài khoản ĐANG đăng nhập bằng đúng phiên này. Khách bị
     từ chối ngay: không có email thật thì không có chỗ nào để ghi role. */
  async function claimAdmin(code) {
    if (isGuest()) return { ok: false, reason: "guest" };
    const c = String(code || "");
    if (c.length < 8) return { ok: false, reason: "short" };
    const res = await adminCodePass(c);
    if (!res.ok) return res;
    const users = getUsers();
    const u = users[currentId()];
    if (!u) return { ok: false, reason: "nous" };
    u.role = "admin";
    saveUsers(users);
    syncSessionRole(u.email);
    return { ok: true, khai: res.khai };
  }

  /* Quản trị đổi vai trò cho người khác. Hai ràng buộc: không tự hạ chính mình
     và không hạ admin cuối cùng — mất cả hai là mất luôn trang Quản trị, mà
     trang đó là nơi duy nhất còn ô nhập mã. */
  function setRole(email, role) {
    const users = getUsers();
    const u = users[email];
    if (!u) return { ok: false, reason: "nous" };
    if (email === currentId()) return { ok: false, reason: "self" };
    const moi = role === "admin" ? "admin" : "learner";
    if (u.role === "admin" && moi !== "admin" && soAdmin(users) <= 1) return { ok: false, reason: "last-admin" };
    u.role = moi;
    saveUsers(users);
    syncSessionRole(email);
    return { ok: true, role: moi };
  }
  const soAdmin = (users) => Object.values(users).filter((u) => u.role === "admin").length;

  /* role đã đổi thì phải cập nhật cả phiên đang mở, nếu không tài khoản vừa
     được đặt làm quản trị vẫn ngồi ở cửa trang Quản trị tới khi đăng xuất. */
  function syncSessionRole(email) {
    const u = getUsers()[email];
    if (!u) return;
    const role = u.role === "admin" ? "admin" : "learner";
    const s = readSession(sessionStorage, SESSION_KEY);
    if (s && s.email === email) CyUtil.writeJson(sessionStorage, SESSION_KEY, { ...s, role, name: u.name });
    const r = readSession(localStorage, REMEMBER_KEY);
    if (r && r.email === email) CyUtil.writeJson(localStorage, REMEMBER_KEY, { ...r, role, name: u.name });
  }

  /* Danh sách an toàn cho trang Quản trị: BỎ CÓ CHỦ ĐÍCH salt/hash/iterations.
     return object gốc là đưa luôn bản băm mật khẩu ra một hàm public, và một
     dòng console.log(Auth.allUsers()) ở đâu đó sẽ để lộ cả kho. */
  function allUsers() {
    return Object.values(getUsers()).map((u) => ({
      name: u.name,
      email: u.email,
      role: u.role === "admin" ? "admin" : "learner",
      verified: !!u.verified,
      createdAt: u.createdAt || 0,
    }));
  }

  /* Chế độ khách: mở app không cần tài khoản. Mọi dữ liệu ghi dưới hậu tố
     ":guest" — cùng một quy ước _key() của API nên app.js không phải biết gì
     thêm, và taiDuLieuKhach() dời nguyên khối đó sang email khi khách đăng ký.
     Phiên khách sống trong sessionStorage (đóng tab là hết), exp 8 giờ để
     một buổi học không bị cắt giữa chừng. */
  function startGuest() {
    CyUtil.writeJson(sessionStorage, SESSION_KEY, {
      email: GUEST_ID,
      name: "",
      role: "guest",
      guest: true,
      exp: Date.now() + 8 * 3600000,
    });
    CyUtil.removeKey(localStorage, REMEMBER_KEY);
    clearPending();
    document.body.classList.remove("auth-locked");
    paintUserBox();
    document.dispatchEvent(new CustomEvent("cysim:session", { detail: { email: GUEST_ID } }));
    if (typeof onReady === "function") onReady();
  }

  /* ---------- tiện ích đăng ký ---------- */
  const getUsers = () => CyUtil.readJson(localStorage, USERS_KEY, {}) || {};
  const saveUsers = (users) => CyUtil.writeJson(localStorage, USERS_KEY, users);
  const normEmail = (e) => e.trim().toLowerCase();
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const maskEmail = (e) => {
    const [name, domain] = e.split("@");
    return name.slice(0, 1) + "•••@" + domain;
  };

  function generateCode() {
    const buf = new Uint32Array(1);
    // 2^32 không chia hết cho 10^6 -> loại các giá trị thừa để mã phân phối đều
    do { crypto.getRandomValues(buf); } while (buf[0] >= 4294000000);
    return String(buf[0] % 10 ** cfg.codeLength).padStart(cfg.codeLength, "0");
  }

  /* ---------- gửi mã qua email ---------- */
  async function deliverCode(user, code) {
    const c = emailConfig();
    if (!c.complete) return { mode: "demo" };
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: c.serviceId,
        template_id: c.templateId,
        user_id: c.publicKey,
        template_params: {
          to_email: user.email,
          email: user.email,
          to_name: user.name,
          from_name: "CySim",
          code,
          app_name: "CySim",
          expires_min: String(Math.round(cfg.codeTtlMs / 60000)),
        },
      }),
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 200) || "HTTP " + res.status);
    return { mode: "email" };
  }

  // Chỉ lưu BẢN BĂM của mã (kèm salt + email), không bao giờ lưu mã gốc.
  async function issueCode(user, purpose) {
    const prev = CyUtil.readJson(sessionStorage, OTP_KEY, null);
    const cooling =
      prev && prev.email === user.email && prev.purpose === purpose &&
      Date.now() - prev.sentAt < cfg.resendCooldownMs && Date.now() < prev.expires;
    if (cooling) {
      return { reused: true, wait: Math.ceil((cfg.resendCooldownMs - (Date.now() - prev.sentAt)) / 1000) };
    }
    const code = generateCode();
    const salt = CyUtil.randomHex(16);
    const delivery = await deliverCode(user, code);
    CyUtil.writeJson(sessionStorage, OTP_KEY, {
      email: user.email,
      purpose,
      salt,
      codeHash: await CyUtil.sha256Hex(salt + ":" + user.email + ":" + code),
      expires: Date.now() + cfg.codeTtlMs,
      attempts: 0,
      sentAt: Date.now(),
    });
    return {
      reused: false,
      mode: delivery.mode,
      demoCode: delivery.mode === "demo" ? code : null,
      wait: cfg.resendCooldownMs / 1000,
    };
  }

  async function checkCode(email, input) {
    const rec = CyUtil.readJson(sessionStorage, OTP_KEY, null);
    if (!rec || rec.email !== email) return { ok: false, reason: "none" };
    if (Date.now() > rec.expires) { CyUtil.removeKey(sessionStorage, OTP_KEY); return { ok: false, reason: "expired" }; }
    if (rec.attempts >= cfg.maxCodeAttempts) { CyUtil.removeKey(sessionStorage, OTP_KEY); return { ok: false, reason: "locked" }; }
    rec.attempts++;
    const hash = await CyUtil.sha256Hex(rec.salt + ":" + email + ":" + input);
    if (!CyUtil.constantEqual(hash, rec.codeHash)) {
      const left = cfg.maxCodeAttempts - rec.attempts;
      if (left <= 0) CyUtil.removeKey(sessionStorage, OTP_KEY);
      else CyUtil.writeJson(sessionStorage, OTP_KEY, rec);
      return { ok: false, reason: left <= 0 ? "locked" : "wrong", left };
    }
    CyUtil.removeKey(sessionStorage, OTP_KEY);
    return { ok: true, purpose: rec.purpose };
  }

  /* ---------- giao diện ---------- */
  let onReady = null;
  let pending = null; // { user, purpose }
  let fails = 0;
  let lockUntil = 0;
  let countdownTimer = null;

  /* pending phải sống sót qua F5: bản thân nó chỉ là email + mục đích,
     còn mã đã băm thì nằm ở OTP_KEY. Không lưu gì thêm, và toàn bộ nằm
     trong sessionStorage nên đóng tab là xoá sạch. */
  function savePending(user, purpose) {
    CyUtil.writeJson(sessionStorage, PENDING_KEY, { email: user.email, purpose });
  }
  function clearPending() {
    CyUtil.removeKey(sessionStorage, PENDING_KEY);
    pending = null;
  }
  /* Nạp lại màn hình xác minh sau khi tải trang. Trả về true nếu vẫn còn
     một lượt chờ hợp lệ (mã chưa hết hạn) và user còn tồn tại. */
  function restorePending() {
    const saved = CyUtil.readJson(sessionStorage, PENDING_KEY, null);
    const rec = CyUtil.readJson(sessionStorage, OTP_KEY, null);
    if (!saved || !rec || rec.email !== saved.email || rec.purpose !== saved.purpose) return false;
    if (Date.now() > rec.expires) {
      clearPending();
      CyUtil.removeKey(sessionStorage, OTP_KEY);
      return false;
    }
    const user = getUsers()[saved.email];
    if (!user) {
      clearPending();
      return false;
    }
    pending = { user, purpose: saved.purpose };
    showStep("verify");
    $("authSub").style.display = "";
    const sent = document.createElement("span");
    sent.textContent = tr("Đã gửi mã 6 số tới") + " ";
    const addr = document.createElement("b");
    addr.textContent = maskEmail(user.email);
    $("authSub").append(sent, addr);
    $("authCode").value = "";
    // Chỉ có bản băm trong bộ nhớ nên không thể hiện lại mã demo
    $("authMailbox").hidden = true;
    $("authDemoCode").textContent = "------";
    const wait = Math.max(0, Math.ceil((rec.sentAt + cfg.resendCooldownMs - Date.now()) / 1000));
    startCountdown(wait);
    setMsg(tr("Phiên xác minh vẫn còn hiệu lực. Nhập mã hoặc bấm Gửi lại mã."), "ok");
    return true;
  }

  const stepForms = () => ({ login: $("authLoginForm"), register: $("authRegForm"), verify: $("authVerifyForm") });

  function setMsg(text, kind) {
    const el = $("authMsg");
    el.textContent = text || "";
    el.className = "auth-msg" + (kind ? " " + kind : "");
  }

  /* Bảng thông báo trung thực: demo hay đã gửi email thật.
     Cờ "demo" KHÔNG có nghĩa là "sập": app vẫn đăng nhập được bình thường, chỉ
     là mã hiện ra tại chỗ thay vì gửi đi. Nội dung dưới đây nói thẳng giới hạn
     để không ai tưởng đây là hệ thống tài khoản thật: mã nằm trong localStorage
     nên ai mở DevTools cũng đọc (và đổi) được. */
  function renderAuthModeNotice() {
    const banner = $("authModeNotice");
    if (!banner) return;
    const c = emailConfig();
    banner.hidden = false;
    banner.className = "auth-notice " + (c.complete ? "real" : "demo");
    $("authModeText").textContent = c.complete
      ? tr("Mã sẽ được gửi tới email của bạn qua EmailJS. Tài khoản vẫn chỉ lưu trên máy bạn — đây là môi trường học, không phải hệ thống bảo mật thật.")
      : tr("CHẾ ĐỘ DEMO: chưa cấu hình EmailJS nên mã hiện ngay trên màn hình. Mọi tài khoản và mật khẩu chỉ được lưu trong trình duyệt của bạn — F12 là xem thấy hết, nên đây là bài tập, không phải nơi để đựng mật khẩu thật.");
  }

  function showStep(step) {
    const f = stepForms();
    Object.keys(f).forEach((k) => { f[k].hidden = k !== step; });
    const titles = {
      login: [tr("Đăng nhập"), tr("Đăng nhập để lưu tiến độ học và tên trên bảng xếp hạng.")],
      register: [tr("Tạo tài khoản mới"), tr("Tên và mật khẩu chỉ được lưu trên máy bạn — không có máy chủ nào đứng sau.")],
      verify: [tr("Xác minh email"), ""],
    };
    $("authTitle").textContent = titles[step][0];
    $("authSub").textContent = titles[step][1];
    $("authSub").style.display = titles[step][1] ? "" : "none";
    if (step !== "verify") $("authMailbox").hidden = true;
    if (step === "login") {
      const saved = CyUtil.readJson(localStorage, LAST_KEY, null);
      if (saved && !$("authLoginEmail").value) $("authLoginEmail").value = saved.email;
      paintSavedAccounts();
    }
    renderAuthModeNotice();
    setMsg("");
    const inputs = Array.from(f[step].querySelectorAll("input"));
    const first = inputs.find((i) => !i.value && i.type !== "checkbox") || inputs[0];
    if (first) setTimeout(() => first.focus(), 30);
  }

  function startCountdown(seconds) {
    clearInterval(countdownTimer);
    const btn = $("authResend");
    let left = seconds;
    const paint = () => {
      btn.disabled = left > 0;
      btn.textContent = left > 0 ? `${tr("Gửi lại mã")} (${left}s)` : tr("Gửi lại mã");
    };
    paint();
    countdownTimer = setInterval(() => {
      left--;
      paint();
      if (left <= 0) clearInterval(countdownTimer);
    }, 1000);
  }

  async function startVerify(user, purpose, isResend) {
    pending = { user, purpose };
    savePending(user, purpose);
    let result;
    try {
      result = await issueCode(user, purpose);
    } catch (e) {
      console.warn("[auth] Gửi email thất bại:", e);
      if (isResend) setMsg(tr("Không gửi được email.") + " " + e.message, "err");
      else {
        clearPending();
        showStep(purpose === "register" ? "register" : "login");
        setMsg(tr("Không gửi được email. Kiểm tra cấu hình EmailJS rồi thử lại."), "err");
      }
      return;
    }
    showStep("verify");
    $("authSub").style.display = "";
    $("authSub").textContent = "";
    const sent = document.createElement("span");
    sent.textContent = tr("Đã gửi mã 6 số tới") + " ";
    const addr = document.createElement("b");
    addr.textContent = maskEmail(user.email);
    $("authSub").append(sent, addr);
    $("authCode").value = "";

    const box = $("authMailbox");
    if (result.demoCode) {
      $("authDemoCode").textContent = result.demoCode;
      box.hidden = false;
    } else if (!result.reused) {
      box.hidden = true;
      if (!isResend) setMsg(tr("Đã gửi mã tới email của bạn."), "ok");
    }
    startCountdown(result.wait);
    if (isResend && !result.reused) setMsg(tr("Đã gửi mã mới."), "ok");
  }

  function finish(user) {
    startSession(user, $("authRemember")?.checked);
    rememberLast(user);
    clearPending();
    document.body.classList.remove("auth-locked");
    paintUserBox();
    showToast("Đăng nhập thành công");
    ["authLoginPass", "authRegPass", "authRegPass2", "authCode", "authLoginAdmin", "authRegAdmin"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
    if (typeof onReady === "function") onReady();
  }

  function paintUserBox() {
    const s = getSession();
    const ten = displayName();
    $("userName").textContent = s ? ten : "—";
    /* Dòng nhỏ dưới tên là chỗ duy nhất luôn nằm trên màn hình (dock dính góc
       phải), nên khách phải đọc được ngay mình đang là ai: ghi chữ "guest"
       trần trụi thì người dùng không biết đó là chế độ hay là lỗi. */
    $("userEmail").textContent = s ? (s.role === "guest" ? tr("chế độ khách — chưa có tài khoản") : s.email) : "—";
    $("userAvatar").textContent = (ten.trim().charAt(0) || "?").toUpperCase();
    $("userBox").classList.toggle("signed-in", !!s);
  }

  /* ---------- "Tài khoản của tôi đâu rồi?" ----------
     Toàn bộ tài khoản nằm trong localStorage của CHÍNH máy và CHÍNH địa chỉ
     đang mở. F5 không làm mất gì, nhưng mở bằng localhost:8000 thay vì
     127.0.0.1:8000 (hoặc file:///) là sang một nơi chứa khác nên danh sách
     trông như trống. Vì vậy màn hình đăng nhập luôn liệt kê những gì đang
     thực sự nằm ở đây. */
  function rememberLast(user) {
    CyUtil.writeJson(localStorage, LAST_KEY, { email: user.email, name: user.name });
  }
  function paintSavedAccounts() {
    const box = $("authSaved");
    if (!box) return;
    const users = Object.values(getUsers()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const last = CyUtil.readJson(localStorage, LAST_KEY, null);

    box.replaceChildren();
    const head = document.createElement("p");
    head.className = "auth-saved-head";
    head.textContent = users.length
      ? tr("Tài khoản đã lưu trên máy này") + " (" + location.origin + "):"
      : tr("Chưa có tài khoản nào được lưu tại địa chỉ này") + " (" + location.origin + ").";
    box.append(head);

    const list = document.createElement("div");
    list.className = "auth-saved-list";
    users.slice(0, 4).forEach((u) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chipbtn" + (last && last.email === u.email ? " current" : "");
      b.textContent = maskEmail(u.email) + (last && last.email === u.email ? " · " + tr("lần đăng nhập gần nhất") : "");
      b.addEventListener("click", () => {
        $("authLoginEmail").value = u.email;
        $("authLoginPass").focus();
        setMsg(tr("Đã điền email đã lưu. Nhập mật khẩu để tiếp tục."), "ok");
      });
      list.append(b);
    });
    if (users.length) box.append(list);

    if (users.length > 4) {
      const more = document.createElement("p");
      more.className = "auth-saved-head mute";
      more.textContent = "+ " + (users.length - 4) + " " + tr("tài khoản khác trên máy này");
      box.append(more);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = normEmail($("authLoginEmail").value);
    const pass = $("authLoginPass").value;
    if (!validEmail(email)) return setMsg(tr("Vui lòng nhập email hợp lệ."), "err");
    if (!pass) return setMsg(tr("Vui lòng nhập mật khẩu."), "err");
    if (Date.now() < lockUntil) return setMsg(tr("Sai quá nhiều lần. Thử lại sau vài giây."), "err");

    const user = getUsers()[email];
    // Luôn băm kể cả khi email không tồn tại: thời gian phản hồi không lộ
    // ra email nào đã được đăng ký từ trước. Bản băm của người dùng không có
    // thật được thay bằng chuỗi giả CÙNG ĐỘ DÀI để constantEqual không bao giờ
    // nhận undefined (nó sẽ throw ngay ở dòng đọc độ dài).
    const hash = await CyUtil.pbkdf2Hex(pass, user ? user.salt : DUMMY_SALT, user?.iterations || 150000);
    const storedHash = user ? user.hash : DUMMY_HASH;
    if (!user || !CyUtil.constantEqual(hash, storedHash)) {
      fails++;
      /* fails về 0 NGAY LÚC khoá, không phải khi hết khoá. Nếu để nguyên 5 thì
         đúng một lần thử sai sau khi hết lockUntil lại đủ điều kiện khoá tiếp ->
         người dùng thật đánh nhầm mật khẩu hai lần là bị khoá gần như liên tục.
         Đổi lại, sau 30 giây họ có lại nguyên vẹn cfg.maxLoginFails lượt. Đây là
         thắng tay gọi UI (fails không ghi vào storage, F5 là xoá), chưa phải
         hàng rào chống dò mật khẩu tự động — muốn thật thì phải khoá phía server. */
      if (fails >= cfg.maxLoginFails) { lockUntil = Date.now() + cfg.lockMs; fails = 0; }
      return setMsg(tr("Email hoặc mật khẩu không đúng."), "err");
    }
    fails = 0;
    /* Ô "Mã quản trị (nếu bạn có)" ngay trong form đăng nhập. Đây là đường duy
       nhất để một tài khoản ĐÃ TỒN TẠI bước lên quản trị mà không cần vào trang
       Quản trị — trang đó bị chặn với người thường, nên nếu chỉ có ô nhập nằm
       trong đó thì máy có bao nhiêu tài khoản cũng không ai mở được lần đầu.
       Sai mã thì thôi, không đăng nhập: một ô phụ không được phép âm thầm biến
       thành cửa sau. */
    const maAdmin = ($("authLoginAdmin")?.value || "").trim();
    if (maAdmin) {
      if (maAdmin.length < 8) return setMsg(tr("Mã quản trị cần ít nhất 8 ký tự, hoặc để trống ô này."), "err");
      const res = await adminCodePass(maAdmin);
      if (!res.ok) return setMsg(tr("Mã quản trị không khớp với máy này. Đăng nhập vẫn chưa xong — để trống ô đó rồi bấm lại nếu bạn chỉ muốn làm học viên."), "err");
      const all = getUsers();
      all[email].role = "admin";
      saveUsers(all);
      user.role = "admin";
    }
    if (!user.verified) return startVerify(user, "register");
    if (cfg.requireCodeOnLogin) return startVerify(user, "login");
    finish(user);
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name = $("authRegName").value.trim();
    const email = normEmail($("authRegEmail").value);
    const pass = $("authRegPass").value;
    const pass2 = $("authRegPass2").value;
    if (name.length < 2) return setMsg(tr("Họ tên cần ít nhất 2 ký tự."), "err");
    if (!validEmail(email)) return setMsg(tr("Vui lòng nhập email hợp lệ."), "err");
    if (pass.length < cfg.minPasswordLength || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) {
      return setMsg(tr("Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số."), "err");
    }
    if (pass !== pass2) return setMsg(tr("Mật khẩu nhập lại không khớp."), "err");

    const users = getUsers();
    if (users[email]?.verified) return setMsg(tr("Email này đã được đăng ký. Hãy đăng nhập."), "err");

    /* Ô mã quản trị: để trống = học viên (đường của đa số). Có chữ thì mã phải
       khớp — và nếu máy này CHƯA có mã nào thì lần khai đầu tiên đặt luôn mã
       đó. Kiểm tra TRƯỚC khi tạo tài khoản để một ô gõ nhầm không sinh ra một
       tài khoản lửng lơ: báo sai là thôi, người dùng sửa rồi bấm lại. */
    let role = "learner";
    const maAdmin = ($("authRegAdmin")?.value || "").trim();
    if (maAdmin) {
      if (maAdmin.length < 8) return setMsg(tr("Mã quản trị cần ít nhất 8 ký tự, hoặc để trống ô này."), "err");
      const res = await adminCodePass(maAdmin);
      if (!res.ok) return setMsg(tr("Mã quản trị không khớp với máy này. Để trống ô đó nếu bạn chỉ muốn làm học viên."), "err");
      role = "admin";
    }

    const iterations = 150000;
    const salt = CyUtil.randomHex(16);
    const user = {
      name, email, salt, iterations,
      hash: await CyUtil.pbkdf2Hex(pass, salt, iterations),
      verified: false,
      role,
      createdAt: Date.now(),
    };
    users[email] = user;
    saveUsers(users);
    startVerify(user, "register");
  }

  async function handleVerify(e) {
    e.preventDefault();
    // F5 ngay trên màn hình nhập mã: pending đã mất khỏi bộ nhớ nhưng vẫn
    // còn trong sessionStorage, nên nạp lại trước khi bắt người dùng làm lại.
    if (!pending && !restorePending()) return showStep("login");
    const input = $("authCode").value.trim();
    if (!new RegExp("^\\d{" + cfg.codeLength + "}$").test(input)) return setMsg(tr("Mã gồm đúng 6 chữ số."), "err");

    const res = await checkCode(pending.user.email, input);
    if (!res.ok) {
      if (res.reason === "wrong") return setMsg(tr("Mã sai. Số lượt thử còn lại:") + " " + res.left, "err");
      if (res.reason === "expired") return setMsg(tr("Mã đã hết hạn. Hãy gửi lại mã mới."), "err");
      if (res.reason === "locked") return setMsg(tr("Đã nhập sai quá số lần cho phép. Hãy gửi lại mã mới."), "err");
      return setMsg(tr("Không tìm thấy mã đang chờ. Hãy gửi lại mã."), "err");
    }
    const users = getUsers();
    const user = users[pending.user.email];
    if (!user) return showStep("register");
    if (res.purpose === "register") {
      user.verified = true;
      saveUsers(users);
    }
    finish(user);
  }

  function logout() {
    clearSession();
    paintUserBox();
    clearPending();
    fails = 0;
    clearInterval(countdownTimer);
    document.body.classList.add("auth-locked");
    showStep("login");
    // Tiến độ đã lưu thuộc về tài khoản cũ -> nạp lại giao diện về trạng
    // thái chưa có dữ liệu trước khi khoá màn hình.
    completedMissions = new Set();
    renderProgress();
    window.scrollTo({ top: 0 });
    document.dispatchEvent(new CustomEvent("cysim:session", { detail: { email: null } }));
    showToast("Đã đăng xuất");
  }

  function bindEvents() {
    $("authLoginForm").addEventListener("submit", handleLogin);
    $("authRegForm").addEventListener("submit", handleRegister);
    $("authVerifyForm").addEventListener("submit", handleVerify);
    document.querySelectorAll("[data-auth-go]").forEach((b) =>
      b.addEventListener("click", () => showStep(b.dataset.authGo))
    );
    $("authResend").addEventListener("click", () => {
      if (pending) startVerify(pending.user, pending.purpose, true);
    });
    $("authBack").addEventListener("click", () => {
      CyUtil.removeKey(sessionStorage, OTP_KEY);
      clearInterval(countdownTimer);
      clearPending();
      showStep("login");
    });
    $("authCode").addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, cfg.codeLength);
    });
    $("logoutBtn").addEventListener("click", logout);
    /* "Vào không cần tài khoản" — học thử trước, đăng ký sau. Sự kiện
       cysim:session do startGuest phát sẽ kéo theo taiDuLieuKhach()/Flags.paint()
       trong app.js, nên khách cũng được áp đúng công tắc quản trị của máy. */
    document.querySelectorAll("[data-auth-guest]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        startGuest();
      })
    );
    // Danh sách tài khoản lưu trên máy do JS vẽ bằng tr() -> đổi ngôn ngữ là
    // phải vẽ lại, nếu không nhãn sẽ kẹt chữ tiếng Việt. Dock tài khoản cũng
    // vậy: tên khách và dòng "chế độ khách" đều do JS dịch tại chỗ vẽ.
    document.addEventListener("cysim:language", () => {
      paintUserBox();
      if (!$("authLoginForm").hidden) paintSavedAccounts();
    });
    // Bấm vào ô mã demo để hiện số — tránh người qua đường nhìn thấy ngay
    $("authDemoCode").addEventListener("click", (e) => e.currentTarget.classList.toggle("revealed"));

    /* Bảng khoá là màn hình duy nhất lúc này (body.auth-locked che app phía
       sau), nên Tab KHÔNG được nhảy ra ngoài: CyUtil.trapFocus giữ vòng focus
       trong đúng form đang hiện, kể cả Shift+Tab. Cùng một hàm mà ai.js dùng
       cho khung chat — hai bản sao 14 dòng là cách duy nhất để hai chỗ này
     lệch nhau lúc nào không ai biết. */
    $("authOverlay").addEventListener("keydown", (e) => CyUtil.trapFocus($("authOverlay"), e));
  }

  // Cổng đăng nhập: chỉ gọi callback (khởi động app) khi đã đăng nhập hợp lệ
  function gate(callback) {
    onReady = callback;
    bindEvents();
    paintUserBox();
    if (isLoggedIn()) {
      callback();
      return;
    }
    document.body.classList.add("auth-locked");
    if (!restorePending()) showStep("login");
  }

  return {
    gate, logout, isLoggedIn, id: currentId, displayName,
    isGuest, isAdmin, allUsers, setRole, claimAdmin, adminCodeDefined, startGuest,
    emailConfig, saveEmailConfig, renderAuthModeNotice,
    // Dùng cho nút "Gửi email thử" trong trang Hướng dẫn
    async sendTestEmail(address) {
      if (!validEmail(address)) throw new Error(tr("Vui lòng nhập email hợp lệ."));
      const code = generateCode();
      await deliverCode({ email: address, name: "CySim" }, code);
      return code;
    },
  };
})();
