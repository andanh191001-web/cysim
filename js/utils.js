/* =========================================================
   CySim — utils.js  ·  bộ tiện ích thuần (nạp ĐẦU TIÊN trong <body>)

   LÀ GÌ   : Những hàm "không biết gì về bài học": $(), escape HTML (esc),
             hex (toHex/fromHex/randomHex), TextEncoder (enc), SHA-256 +
             PBKDF2 (Web Crypto thật), đọc/ghi JSON trong storage, sleep,
             định dạng giây/MB, logLine() viết dòng terminal.
   CHẠY     : Lúc nạp chỉ ĐỊNH NGHĨA, không tự chạy gì. Mọi code khác
             gọi khi người dùng bấm nút.
   TOÀN CẦU : định nghĩa $(), tr(), CyUtil = { enc, esc, toHex, fromHex,
             randomHex, readJson, writeJson, removeKey, sha256Hex,
             sha256HexBuffer, pbkdf2Hex, constantEqual, humanizeSeconds,
             formatBytes, numOf, debounce, sleep, logLine, trapFocus }.
             Không đọc global nào khác -> nạp trước mọi file là dùng được.
   ========================================================= */

const $ = (id) => document.getElementById(id);

/* utils.js nạp trước i18n.js nên lúc ĐỊNH NGHĨA chưa có t(), nhưng lúc GỌI
   (khi người dùng tương tác) thì có. Dùng tr() để đơn vị thời gian "3 ngày",
   "250 năm"... cũng theo ngôn ngữ đang chọn thay vì kẹt tiếng Việt. */
const tr = (s) => (typeof t === "function" ? t(s) : s);

const CyUtil = (() => {
  const enc = new TextEncoder();

  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

  const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const randomHex = (bytes) => toHex(crypto.getRandomValues(new Uint8Array(bytes)));

  const readJson = (store, key, fallback) => {
    try {
      const raw = store.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const writeJson = (store, key, value) => {
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  const removeKey = (store, key) => {
    try { store.removeItem(key); } catch { /* chế độ riêng tư chặn storage */ }
  };

  async function sha256Hex(text) {
    return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
  }
  async function sha256HexBuffer(buffer) {
    return toHex(await crypto.subtle.digest("SHA-256", buffer));
  }
  async function pbkdf2Hex(password, saltHex, iterations = 150000) {
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations },
      key,
      256
    );
    return toHex(bits);
  }
  // So sánh không nhánh rẽ: thời gian không phụ thuộc vị trí khác nhau đầu tiên
  function constantEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* 1 giây -> "1,5 giây"; 4e9 -> "126 năm" ... dùng log10 để không tràn số */
  const UNITS = [
    ["giây", 1],
    ["phút", 60],
    ["giờ", 3600],
    ["ngày", 86400],
    ["tuần", 604800],
    ["tháng", 2592000],
    ["năm", 31536000],
  ];
  /* Số liệu cũng phải theo thứ tiếng: "1,5 giây" là đúng tiếng Việt nhưng sai
     ở tiếng Anh (phải là "1.5 seconds"). currentLang và LABEL_LOCALE là const
     khai báo ở đầu js/i18n.js, nằm trong lexical scope của script chứ không có
     trên window, nên phải tham chiếu thẳng tên — globalThis.currentLang là
     undefined và mọi con số sẽ âm thầm kẹt về tiếng Việt. */
  function numOf(value, decimals) {
    const locale = (typeof LABEL_LOCALE !== "undefined" && LABEL_LOCALE[currentLang]) || "vi-VN";
    const opts = decimals === undefined ? { maximumFractionDigits: 0 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    return value.toLocaleString(locale, opts);
  }
  /* Phòng khi có chỗ khác cần định dạng số cùng quy tắc. */
  globalThis.numOf = numOf;

  function humanizeSeconds(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return tr("tức thì");
    if (seconds < 1) {
      const perSecond = 1 / seconds;
      return perSecond >= 1e9
        ? tr("dưới 1 nano-giây")
        : numOf(perSecond) + " " + tr("phần giây");
    }
    const exp = Math.log10(seconds);
    if (exp > 11) return tr("hàng chục nghìn tỷ năm");
    if (exp > 8) return tr("hàng tỷ năm");
    if (exp > 5) return tr("hàng triệu năm");
    let unit = UNITS[0];
    for (const u of UNITS) if (seconds >= u[1]) unit = u;
    const value = seconds / unit[1];
    const rounded = value >= 20 ? numOf(value) : numOf(value, 1);
    return rounded + " " + tr(unit[0]);
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return numOf(n / 1024, 1) + " KB";
    return numOf(n / 1024 / 1024, 2) + " MB";
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* Ghi một dòng log vào terminal giả lập. Dùng textContent thay vì
     innerHTML += để dữ liệu người dùng nhập không bao giờ được parse
     thành HTML. */
  function logLine(container, className, text) {
    const line = document.createElement("div");
    if (className) line.className = className;
    line.textContent = text;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return line;
  }

  function debounce(fn, wait) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /* Nhốt vòng phím Tab trong phạm vi một vùng. Hai màn hình của app khoá người dùng lại
     (bảng đăng nhập, khung chat AI) nên bàn phím không được lọt sang phần trang
     đứng sau. Chỉ đếm phần tử THẬT SỰ đang nhận focus: nút disabled, phần tử
     trong vùng [hidden] và thứ có getClientRects() rỗng đều bị trình duyệt loại
     khỏi vòng tab — giữ chúng trong danh sách là tạo ra các "nhát Tab chết".
     Lối ra luôn phải có (Esc / nút đóng); một vòng lặp không lối thoát là lỗi
     vi phạm WCAG 2.1.2, không phải tính năng. */
  function trapFocus(vung, e) {
    if (e.key !== "Tab" || !vung) return;
    const node = Array.from(
      vung.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
    ).filter((n) => !n.disabled && !n.closest("[hidden]") && n.getClientRects().length);
    if (!node.length) return;
    const dau = node[0];
    const cuoi = node[node.length - 1];
    if (e.shiftKey && document.activeElement === dau) {
      e.preventDefault();
      cuoi.focus();
    } else if (!e.shiftKey && document.activeElement === cuoi) {
      e.preventDefault();
      dau.focus();
    }
  }

  return {
    enc, esc, toHex, fromHex, randomHex,
    readJson, writeJson, removeKey,
    sha256Hex, sha256HexBuffer, pbkdf2Hex, constantEqual,
    humanizeSeconds, formatBytes, numOf, debounce, sleep, logLine, trapFocus,
  };
})();
