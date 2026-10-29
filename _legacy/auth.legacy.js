/* =========================================================
   CySim — _legacy/auth.legacy.js  ·  BẢN CHẾT, ĐANG ĐỰC Ở ĐÂY ĐỂ KHÔNG MẤT

   LÀ GÌ   : Bản auth.js cũ (bản gốc trước khi viết lại hệ thống đăng
             nhập). Không file nào trong index.html nạp nó, không code nào
             tham chiếu — tên đã đổi thành .legacy.js nên trình duyệt cũng
             không thể tự nạp.
   VÌ SAO CÒN: giữ lịch sử để so sánh được cách xử lý OTP/phiên phiên cũ,
             tuyệt đối không xoá. Muốn tham khảo: mở file, đọc, đóng.
   LỖI CỦA BẢN NÀY (js/auth.js hiện tại đã sửa):
     - 3 giá trị EmailJS phải sửa tay trong file code -> nay nhập trên
       trang Hướng dẫn, lưu localStorage.
     - không có "Ghi nhớ đăng nhập", không khôi phục lượt OTP đang dở sau
       khi F5, không giới hạn số lần nhập sai.
     - tài khoản đã lưu biến mất khi tải lại trang.
   CHẠY    : KHÔNG CHẠY. Đừng đưa vào index.html — nó khai báo lại
             AUTH_CONFIG và Auth, sẽ đè lên bản đang dùng.
   ========================================================= */

const AUTH_CONFIG = {
  // Điền 3 giá trị từ https://www.emailjs.com để gửi email THẬT.
  // Để trống = chế độ demo: mã hiện trong "hộp thư mô phỏng" trên màn hình.
  emailjs: { publicKey: "", serviceId: "", templateId: "" },
  codeLength: 6,
  codeTtlMs: 5 * 60 * 1000, // mã hết hạn sau 5 phút
  maxCodeAttempts: 5, // nhập sai tối đa 5 lần
  resendCooldownMs: 60 * 1000, // chờ 60s mới được gửi lại
  requireCodeOnLogin: true, // true: mỗi lần đăng nhập đều cần mã email
  sessionDays: 7,
  minPasswordLength: 8,
  maxLoginFails: 5,
  lockMs: 30 * 1000,
};

const Auth = (() => {
  const cfg = AUTH_CONFIG;
  const USERS_KEY = "cysim-users";
  const SESSION_KEY = "cysim-session";
  const OTP_KEY = "cysim-otp";
  const tr = (s) => (typeof t === "function" ? t(s) : s);
  const enc = new TextEncoder();

  /* ---------- tiện ích ---------- */
  const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const fromHex = (s) => new Uint8Array(s.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const randomHex = (n) => toHex(crypto.getRandomValues(new Uint8Array(n)));
  const readJson = (store, key, fallback) => {
    try { return JSON.parse(store.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const writeJson = (store, key, val) => { try { store.setItem(key, JSON.stringify(val)); } catch {} };
  const getUsers = () => readJson(localStorage, USERS_KEY, {});
  const saveUsers = (u) => writeJson(localStorage, USERS_KEY, u);
  const normEmail = (e) => e.trim().toLowerCase();
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const maskEmail = (e) => {
    const [name, domain] = e.split("@");
    return name.slice(0, 1) + "***@" + domain;
  };
  const sameString = (a, b) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  };

  async function sha256(text) {
    return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
  }
  // Băm mật khẩu bằng PBKDF2 + salt ngẫu nhiên (không lưu mật khẩu gốc)
  async function hashPassword(password, saltHex) {
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: 150000 },
      key,
      256
    );
    return toHex(bits);
  }
  // Sinh mã 6 số bằng bộ sinh ngẫu nhiên mật mã (loại bỏ lệch phân phối)
  function generateCode() {
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= 4294000000);
    return String(buf[0] % 10 ** cfg.codeLength).padStart(cfg.codeLength, "0");
  }

  /* ---------- phiên đăng nhập ---------- */
  function getSession() {
    const s = readJson(localStorage, SESSION_KEY, null);
    if (!s || Date.now() > s.exp) {
      try { localStorage.removeItem(SESSION_KEY); } catch {}
      return null;
    }
    return s;
  }
  function startSession(user) {
    writeJson(localStorage, SESSION_KEY, {
      email: user.email,
      name: user.name,
      exp: Date.now() + cfg.sessionDays * 86400000,
    });
  }
  const isLoggedIn = () => !!getSession();
  const currentId = () => (getSession() ? getSession().email : "guest");
  const displayName = () => (getSession() ? getSession().name : "");
  function logout() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(OTP_KEY); } catch {}
    location.reload();
  }

  /* ---------- gửi mã qua email ---------- */
  async function deliverCode(user, code) {
    const c = cfg.emailjs;
    if (!c.publicKey || !c.serviceId || !c.templateId) return { mode: "demo" };
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: c.serviceId,
        template_id: c.templateId,
        user_id: c.publicKey,
        template_params: {
          to_email: user.email,
          to_name: user.name,
          code,
          app_name: "CySim",
          expires_min: String(cfg.codeTtlMs / 60000),
        },
      }),
    });
    if (!res.ok) throw new Error((await res.text()) || "HTTP " + res.status);
    return { mode: "email" };
  }

  // Tạo + gửi mã. Chỉ lưu BẢN BĂM của mã (kèm salt), không lưu mã gốc.
  async function issueCode(user, purpose) {
    const prev = readJson(sessionStorage, OTP_KEY, null);
    if (prev && prev.email === user.email && prev.purpose === purpose && Date.now() - prev.sentAt < cfg.resendCooldownMs && Date.now() < prev.expires) {
      return { reused: true, wait: Math.ceil((cfg.resendCooldownMs - (Date.now() - prev.sentAt)) / 1000) };
    }
    const code = generateCode();
    const salt = randomHex(16);
    const delivery = await deliverCode(user, code);
    writeJson(sessionStorage, OTP_KEY, {
      email: user.email,
      purpose,
      salt,
      codeHash: await sha256(salt + ":" + user.email + ":" + code),
      expires: Date.now() + cfg.codeTtlMs,
      attempts: 0,
      sentAt: Date.now(),
    });
    return { reused: false, demoCode: delivery.mode === "demo" ? code : null, wait: cfg.resendCooldownMs / 1000 };
  }

  async function checkCode(email, input) {
    const rec = readJson(sessionStorage, OTP_KEY, null);
    if (!rec || rec.email !== email) return { ok: false, reason: "none" };
    if (Date.now() > rec.expires) { sessionStorage.removeItem(OTP_KEY); return { ok: false, reason: "expired" }; }
    if (rec.attempts >= cfg.maxCodeAttempts) { sessionStorage.removeItem(OTP_KEY); return { ok: false, reason: "locked" }; }
    rec.attempts++;
    const hash = await sha256(rec.salt + ":" + email + ":" + input);
    if (!sameString(hash, rec.codeHash)) {
      const left = cfg.maxCodeAttempts - rec.attempts;
      if (left <= 0) sessionStorage.removeItem(OTP_KEY);
      else writeJson(sessionStorage, OTP_KEY, rec);
      return { ok: false, reason: left <= 0 ? "locked" : "wrong", left };
    }
    sessionStorage.removeItem(OTP_KEY);
    return { ok: true, purpose: rec.purpose };
  }

  /* ---------- giao diện ---------- */
  let onReady = null;
  let pending = null; // { user, purpose }
  let fails = 0;
  let lockUntil = 0;
  let countdownTimer = null;

  const forms = () => ({ login: $("authLoginForm"), register: $("authRegForm"), verify: $("authVerifyForm") });

  function setMsg(text, kind) {
    const el = $("authMsg");
    el.textContent = text || "";
    el.className = "auth-msg" + (kind ? " " + kind : "");
  }

  function showStep(step) {
    const f = forms();
    Object.keys(f).forEach((k) => { f[k].hidden = k !== step; });
    const titles = {
      login: ["Đăng nhập", "Đăng nhập để lưu tiến độ học và tên trên bảng xếp hạng."],
      register: ["Tạo tài khoản mới", "Chúng tôi sẽ gửi mã 6 số đến email để xác minh."],
      verify: ["Xác minh email", ""],
    };
    $("authTitle").textContent = tr(titles[step][0]);
    $("authSub").textContent = tr(titles[step][1]);
    $("authSub").style.display = titles[step][1] ? "" : "none";
    if (step !== "verify") $("authMailbox").hidden = true;
    setMsg("");
    const first = f[step].querySelector("input");
    if (first) setTimeout(() => first.focus(), 30);
  }

  function startCountdown(seconds) {
    clearInterval(countdownTimer);
    const btn = $("authResend");
    let left = seconds;
    const paint = () => {
      btn.disabled = left > 0;
      btn.textContent = left > 0 ? tr("Gửi lại mã") + " (" + left + "s)" : tr("Gửi lại mã");
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
    let result;
    try {
      result = await issueCode(user, purpose);
    } catch (e) {
      console.warn("Gửi email thất bại:", e);
      if (!isResend) showStep(purpose === "register" ? "register" : "login");
      setMsg(tr("Không gửi được email. Kiểm tra cấu hình EmailJS rồi thử lại."), "err");
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
    }
    startCountdown(result.wait);
    if (isResend && !result.reused) setMsg(tr("Đã gửi mã mới."), "ok");
  }

  function finish(user) {
    startSession(user);
    pending = null;
    document.body.classList.remove("auth-locked");
    paintUserBox();
    showToast("Đăng nhập thành công");
    ["authLoginPass", "authRegPass", "authRegPass2", "authCode"].forEach((id) => { $(id).value = ""; });
    if (typeof onReady === "function") onReady();
  }

  function paintUserBox() {
    const s = getSession();
    if (!s) return;
    $("userName").textContent = s.name;
    $("userEmail").textContent = s.email;
    $("userAvatar").textContent = s.name.trim().charAt(0).toUpperCase() || "?";
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = normEmail($("authLoginEmail").value);
    const pass = $("authLoginPass").value;
    if (!validEmail(email)) return setMsg(tr("Vui lòng nhập email hợp lệ."), "err");
    if (!pass) return setMsg(tr("Vui lòng nhập mật khẩu."), "err");
    if (Date.now() < lockUntil) return setMsg(tr("Sai quá nhiều lần. Thử lại sau vài giây."), "err");

    const user = getUsers()[email];
    // Luôn băm mật khẩu để thời gian phản hồi không lộ email nào đã tồn tại
    const hash = await hashPassword(pass, user ? user.salt : "00".repeat(16));
    if (!user || !sameString(hash, user.hash)) {
      fails++;
      if (fails >= cfg.maxLoginFails) { lockUntil = Date.now() + cfg.lockMs; fails = 0; }
      return setMsg(tr("Email hoặc mật khẩu không đúng."), "err");
    }
    fails = 0;
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
    if (users[email] && users[email].verified) return setMsg(tr("Email này đã được đăng ký. Hãy đăng nhập."), "err");

    const salt = randomHex(16);
    const user = { name, email, salt, hash: await hashPassword(pass, salt), verified: false, createdAt: Date.now() };
    users[email] = user;
    saveUsers(users);
    startVerify(user, "register");
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!pending) return showStep("login");
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
    if (res.purpose === "register") {
      user.verified = true;
      saveUsers(users);
    }
    finish(user);
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
      try { sessionStorage.removeItem(OTP_KEY); } catch {}
      clearInterval(countdownTimer);
      pending = null;
      showStep("login");
    });
    $("authCode").addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, cfg.codeLength);
    });
    $("logoutBtn").addEventListener("click", logout);
  }

  // Cổng đăng nhập: chỉ gọi callback (khởi động app) khi đã đăng nhập hợp lệ
  function gate(callback) {
    onReady = callback;
    bindEvents();
    if (isLoggedIn()) {
      paintUserBox();
      callback();
      return;
    }
    document.body.classList.add("auth-locked");
    showStep("login");
  }

  return { gate, logout, isLoggedIn, id: currentId, displayName };
})();