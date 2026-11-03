/* =========================================================
   CySim — app.js  ·  nhân dùng chung của giao diện

   LÀ GÌ   : toast, hiệu ứng gõ chữ, trạng thái 13 nhiệm vụ + đường cấp,
             bảng xếp hạng, điều hướng sidebar, đồng hồ "giám sát" ở
             dashboard. Từ đây cũng chạy ba tầng thiết lập: Settings (kiểu
             nhìn của màn hình, để trên máy), Flags (bật/tắt tính năng cho mọi
             tài khoản, trang Quản trị) và AiBudget (số lượt hỏi AI một ngày).
             Không chứa kiến thức an ninh mạng — mỗi bài học nằm riêng trong
             js/labs/<tên>.js.
   CHẠY     : Lúc nạp vẽ bảng cấp (paintRankTable), nối click cho
             .nav-btn / [data-goto], gập/mở nhóm "Phòng lab" trong sidebar theo
             thói quen đã lưu (navLabsVe), nghe "cysim:language" để vẽ lại chữ do JS
             tự sinh, nghe "cysim:session" để chuyển dữ liệu khách + vẽ lại
             trang Cài đặt/Quản trị, đăng ký Service Worker và bật/tắt biển
             "không có internet". Một listener focusin toàn trang cuộn ô nhập
             đang gõ lên giữa màn hình khi bàn phím ảo che (xem "bàn phím ảo").
             startMonitor() chỉ quay số ngẫu nhiên khi mở view "monitor" —
             không đo mạng thật.
             showView() là async từ 30-10-2026: sau khi đổi trang nó chờ
             napTrang(id) tải script của phòng lab tương ứng (15 file không còn
             thẻ <script> trong index.html) rồi mới vẽ lại đầu trang. Ai gọi
             showView() đều không cần chờ — mọi lời gọi hiện tại đều "bấm rồi
             đi tiếp", không có nơi nào đọc giá trị trả về.
   TOÀN CẦU : định nghĩa Labs{}, showToast, typeWriter, API, RANKS,
             TOTAL_MISSIONS, TOTAL_LABS, RANK_MAP, completedMissions, rankFor,
             labsDone, renderProgress, complete, renderLeaderboard, showView,
             Settings, Flags, AiBudget, TINH_NANG, paintSettings,
             paintAdminPage, paintAdminNav, taiDuLieuKhach, MAY_CHAM,
             NAV_LABS_KEY, navLabsVe, LAB_SCRIPT, VIEW_SCRIPT, napFile, napTrang.
             đọc Auth.id()/displayName()/isGuest()/isAdmin(), CyUtil, t();
             chặn showView() khi Flags tắt tính năng; gọi Labs.<lab>.stop khi
             đổi trang; mọi lời gọi sang một lab đều qua ?. vì lab đó có thể chưa
             được nạp (xem napTrang).
   ========================================================= */

/* Các phòng lab tự đăng ký vào đây để boot.js / navigation gọi lại mà
   không phải phụ thuộc vào tên hàm toàn cầu rải rác trong code. */
const Labs = {};

/* ---------- toast ---------- */
let toastTimer = null;
/* message luôn là một chuỗi tiếng Việt NGUYÊN KHỐI: không ghép "+100 XP · "
   vào trước rồi mới dịch, vì mỗi lần ghép sẽ tạo một khóa tra từ điển mới
   toạ độ không bao giờ khớp và đẩy toàn bộ vào hàng đợi dịch máy. */
function showToast(message, xpBadge = false) {
  const box = $("toast");
  if (!box) return;
  $("toastXp").hidden = !xpBadge;
  if (xpBadge) $("toastXp").textContent = t("+100 XP");
  $("toastMsg").textContent = t(message);
  box.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove("show"), 3600);
}

/* ---------- bộ gõ chữ ---------- */
/* Phân tích HTML MỘT lần bằng DOMParser, sau đó chỉ lớn dần các node văn
   bản. Không còn ghép chuỗi innerHTML từng ký tự, không còn tạm div cho
   mỗi thẻ mở. Gọi lại khi đang gõ sẽ huỷ lần gõ trước. */
function typeWriter(element, html, speed = 15) {
  element.__typing?.cancel();

  const template = new DOMParser().parseFromString("<body>" + html + "</body>", "text/html").body;
  const tree = document.importNode(template, true);

  const slots = [];
  const collect = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        slots.push({ node: child, full: child.nodeValue });
        child.nodeValue = "";
      } else {
        collect(child);
      }
    }
  };
  collect(tree);

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  tree.appendChild(cursor);
  element.replaceChildren(tree);

  return new Promise((resolve) => {
    let slot = 0;
    let char = 0;
    let timer = null;
    let settled = false;

    /* settle() chỉ chạy MỘT lần và chỉ xoá con trỏ/thuộc tính __typing của
       CHÍNH lượt gõ này. Nhờ vậy một lượt gõ bị huỷ muộn không thể ghi đè
       handle của lượt gõ mới — lỗi mà người duyệt chỉ ra khi lab SIEM reset
       liên tiếp. */
    const settle = () => {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      timer = null;
      cursor.remove();
      if (element.__typing === handle) element.__typing = null;
      resolve();
    };
    const handle = { cancel: settle };
    const run = () => {
      while (slot < slots.length && slots[slot].node.nodeValue.length >= slots[slot].full.length) {
        slot++;
        char = 0;
      }
      if (slot >= slots.length) return settle();
      slots[slot].node.nodeValue = slots[slot].full.slice(0, ++char);
      element.scrollTop = element.scrollHeight;
    };

    timer = setInterval(run, speed);
    element.__typing = handle;
  });
}

/* ---------- bảng xếp hạng ----------
   Chín dòng dưới đây là tên HƯ CẤU do ứng dụng tự đặt — không phải người thật,
   không có tài khoản nào đằng sau. Chúng chỉ giữ cho bảng đỡ trống khi mới vào;
   renderLeaderboard() nói rõ điều đó ngay dưới bảng. */
const DEFAULT_LB = [
  { name: "CyberNinja_99",  rank: "Huyền thoại An ninh mạng", xp: 1200 },
  { name: "SecGuard_Pro",   rank: "Chiến binh an ninh mạng",  xp: 1100 },
  { name: "FirewallMaster", rank: "Chuyên viên phòng thủ",    xp: 1000 },
  { name: "HackerHunter",   rank: "Chuyên viên phân tích",    xp: 900 },
  { name: "ZeroDayHunter",  rank: "Chuyên viên phân tích",    xp: 800 },
  { name: "PacketSniffer",  rank: "Nhân viên SOC",            xp: 600 },
  { name: "CryptoKnight",   rank: "Nhân viên SOC",            xp: 500 },
  { name: "BlueTeamLead",   rank: "Nhân viên SOC",            xp: 400 },
  { name: "RedTeamAce",     rank: "Thực tập viên",            xp: 200 },
];

const API = {
  _key: (k) => k + ":" + Auth.id(),
  _read(key, fallback) { return CyUtil.readJson(localStorage, this._key(key), fallback); },
  _write(key, value) { return CyUtil.writeJson(localStorage, this._key(key), value); },
  async getMissions() {
    return this._read("cysim-done", []);
  },
  async completeMission(key) {
    const list = this._read("cysim-done", []);
    if (!list.includes(key)) list.push(key);
    this._write("cysim-done", list);
    return true;
  },
  async getLeaderboard(xp, rank) {
    const userEntry = { name: Auth.displayName() || t("Bạn (Học viên)"), me: true, xp, rank };
    const merged = [...DEFAULT_LB, userEntry].sort((a, b) => b.xp - a.xp);
    this._write("cysim-lb", merged);
    return merged.slice(0, 10);
  },
};

/* ---------- giao diện & công tắc tính năng ----------
   Hai khối dưới là nền của trang Cài đặt (người dùng tự chỉnh màn hình của họ)
   và trang Quản trị (người lớn tắt/bật tính năng cho lớp học). Cả hai ĐỌC THẬT:
   showView() chặn đường vào, ai.js hỏi trước khi gọi máy chủ. Một cái công tắc
   không đổi được hành vi thì không phải công tắc — chỉ là cái nút biết sáng. */
const SETTINGS_MAC_DINH = { theme: "dem", fs: "vua", motion: "bat", contrast: "thuong" };
const Settings = {
  KEY: "cysim-settings",
  read() {
    return { ...SETTINGS_MAC_DINH, ...(CyUtil.readJson(localStorage, this.KEY, {}) || {}) };
  },
  save(patch) {
    const s = { ...this.read(), ...patch };
    CyUtil.writeJson(localStorage, this.KEY, s);
    this.apply(s);
    return s;
  },
  /* Ghi lên <html> bằng data-* — style.css đọc đúng bốn thuộc tính đó trong khối
     "ĐỔI GIAO DIỆN". theme-color đổi theo để thanh địa chỉ trên điện thoại không
     còn đen giữa một màn hình trắng. */
  apply(s = this.read()) {
    const el = document.documentElement;
    el.dataset.theme = s.theme;
    el.dataset.fs = s.fs;
    el.dataset.motion = s.motion;
    el.dataset.contrast = s.contrast;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", s.theme === "sang" ? "#eef2f8" : "#070b14");
    return s;
  },
};
/* Giao diện là thứ CỦA MÁY, không của tài khoản — như hệ điều hành. Lý do kỹ
   thuật: app.js nạp TRƯỚC auth.js nên Auth chưa tồn tại ở dòng này; đọc theo
   tài khoản thì hoặc màn hình nháy tối->sáng, hoặc phải đổi thứ tự file. */
Settings.apply();

/* Nhãn của từng công tắc. Thêm tính năng vào đây là nó tự xuất hiện ở trang
   Quản trị — không phải sửa hai chỗ rồi quên một chỗ. */
const TINH_NANG = {
  ai: "Trợ lý AI",
  leaderboard: "Bảng xếp hạng",
  exam: "Kỳ thi tốt nghiệp & Chứng chỉ",
  monitor: "Trang Giám sát",
  theory: "Trang Lý thuyết",
  guide: "Trang Hướng dẫn",
};
/* View nào nằm dưới công tắc nào. "settings" và "account" cố ý KHÔNG ở đây:
   tắt cả hai thì người dùng không còn đường nào bật lại. */
const VIEW_FLAG = {
  leaderboard: "leaderboard",
  monitor: "monitor",
  theory: "theory",
  guide: "guide",
  certificate: "exam",
};
const Flags = {
  KEY: "cysim-flags",
  read() {
    const saved = CyUtil.readJson(localStorage, this.KEY, {}) || {};
    const out = {};
    for (const k in TINH_NANG) out[k] = saved[k] !== false;
    return out;
  },
  on(name) {
    return this.read()[name] !== false;
  },
  save(patch) {
    CyUtil.writeJson(localStorage, this.KEY, { ...this.read(), ...patch });
    this.paint();
  },
  paint() {
    const on = this.read();
    document.querySelectorAll(".nav-btn").forEach((b) => {
      const f = VIEW_FLAG[b.dataset.view];
      b.hidden = !!(f && !on[f]);
    });
    const fab = $("aiFab");
    if (fab) fab.hidden = !on.ai;
    document.dispatchEvent(new CustomEvent("cysim:flags", { detail: on }));
  },
};

/* ---------- hạn mức hỏi AI ----------
   Đây là chỗ dựa thật của ô "Số lượt hỏi tối đa một ngày" trong trang Quản trị:
   js/ai.js hỏi AiBudget.choPhep() TRƯỚC khi nhấc máy, và chỉ đếm khi máy chủ
   thực sự trả lời. Giới hạn là của MÁY (do quản trị đặt, áp cho mọi tài khoản
   trên máy này), còn SỐ LƯỢT ĐÃ DÙNG là của từng tài khoản — dùng API._key nên
   hai học viên ngồi cùng máy không đốt hạn mức của nhau.
   Giới hạn 0 = không giới hạn, và đó là mặc định: một app học mà âm thầm chặn
   câu hỏi thứ 21 thì người dùng tưởng app hỏng, chứ không nghĩ tới hạn mức. */
const AiBudget = {
  LIMIT_KEY: "cysim-ai-limit",
  USE_KEY: "cysim-ai-use",
  /* Ngày theo đồng hồ MÁY, không dùng toISOString(): UTC sẽ cắt một buổi học
     ở Việt Nam thành hai "ngày" và đếm thiếu một nửa. */
  homNay() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  },
  limit() {
    const n = CyUtil.readJson(localStorage, this.LIMIT_KEY, 0);
    return Number.isFinite(n) && n > 0 ? Math.min(999, Math.floor(n)) : 0;
  },
  setLimit(n) {
    CyUtil.writeJson(localStorage, this.LIMIT_KEY, Math.max(0, Math.min(999, Math.floor(n) || 0)));
    paintAdminBudget();
  },
  used() {
    const r = CyUtil.readJson(localStorage, API._key(this.USE_KEY), null);
    return r && r.ngay === this.homNay() ? r.n : 0;
  },
  them() {
    CyUtil.writeJson(localStorage, API._key(this.USE_KEY), { ngay: this.homNay(), n: this.used() + 1 });
    paintAdminBudget();
  },
  conLai() {
    const cap = this.limit();
    return cap === 0 ? Infinity : Math.max(0, cap - this.used());
  },
  choPhep() {
    return this.conLai() > 0;
  },
};

/* ---------- trang Cài đặt ---------- */
/* Nối sự kiện mà phần tử không tồn tại thì im lặng bỏ qua: toàn bộ app.js là
   script cổ điển nạp một lần, một cái $() trả null ở đây sẽ làm MỌI file sau
   đó chết theo (boot.js không chạy, màn hình trắng). đây là ranh giới duy nhất
   giữa code và markup, nên phòng ở đây rẻ hơn là-debug một màn hình trắng. */
function on(id, ev, fn) {
  const el = $(id);
  if (el) el.addEventListener(ev, fn);
  return el;
}
function paintSettings() {
  const s = Settings.read();
  document.querySelectorAll("#settings .seg .btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(s[b.dataset.choice] === b.dataset.value));
  });
  const motion = $("setMotion");
  const contrast = $("setContrast");
  if (motion) motion.checked = s.motion === "bat";
  if (contrast) contrast.checked = s.contrast === "cao";
  const lang = $("setLang");
  if (lang && !lang.options.length) {
    for (const k in LANG_NAMES) {
      const o = document.createElement("option");
      o.value = k;
      o.textContent = LANG_NAMES[k];
      lang.appendChild(o);
    }
  }
  if (lang) lang.value = localStorage.getItem("cysim-lang") || "vi";
  const info = $("setDataInfo");
  if (info) info.textContent = DATA_INFO_TEXT();
  /* Dòng "Tài khoản của bạn" — trang này là nơi duy nhất người dùng nhìn thấy
     mình đang đứng ở danh tính nào, nên khách, học viên và quản trị phải phân
     biệt được ngay, không cần mở DevTools. */
  const who = $("setAccountInfo");
  if (who) {
    const ten = Auth.displayName() || t("Chưa đặt tên");
    who.textContent = Auth.isGuest()
      ? t("Chế độ khách trên máy này — chưa có tài khoản. Mọi thứ bạn làm lưu dưới tên guest, tạo tài khoản sẽ được chuyển sang cùng.")
      : Auth.isAdmin()
        ? t("Quản trị") + ": " + ten + " (" + Auth.id() + ")"
        : t("Học viên") + ": " + ten + " (" + Auth.id() + ")";
  }
  const adminLink = $("setAdminLink");
  if (adminLink) adminLink.hidden = !Auth.isAdmin();
}
on("setLogout", "click", () => Auth.logout());
/* Một dòng mô tả ĐÚNG những gì đang nằm dưới tên tài khoản này — đếm từ
   localStorage thật, không kể chung chung, vì người dùng cần biết xoá là mất gì.
   Câu ghép từ ba mảnh dịch nguyên cụm: số và email do code chèn vào giữa, còn
   người dịch tự lo thứ tiếng của mình đặt động từ ở đâu. */
function DATA_INFO_TEXT() {
  const k = taiKhoanKeys();
  const chat = k.filter((x) => x.indexOf("cysim-ai:") === 0).length;
  return (
    t("Tài khoản") + " " + Auth.id() + " " + t("đang có") + " " + k.length + " " +
    tdem(k.length, "mục dữ liệu trên máy này") +
    (chat ? " (" + chat + " " + tdem(chat, "hội thoại AI") + ")" : "") + "."
  );
}
function taiKhoanKeys() {
  const duoi = ":" + Auth.id();
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.endsWith(duoi)) out.push(k);
  }
  return out.sort();
}
function xuatDuLieu() {
  const bao = { app: "CySim", exportedAt: new Date().toISOString(), account: Auth.id(), data: {} };
  for (const k of taiKhoanKeys()) bao.data[k] = localStorage.getItem(k);
  const url = URL.createObjectURL(new Blob([JSON.stringify(bao, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "cysim-" + Auth.id().replace(/[^a-z0-9.-]+/gi, "_") + ".json";
  a.click();
  /* Blob sống trong bộ nhớ cho tới khi chủ trình duyệt giải phóng; giữ URL
     treo là giữ cả bản sao dữ liệu của người dùng nằm lại. */
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  showToast(t("Đã tải một bản sao dữ liệu về máy."));
}
function napDuLieu(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let bao;
    try {
      bao = JSON.parse(String(reader.result));
    } catch (e) {
      showToast(t("File không đọc được. Cần file .json do chính CySim xuất ra."));
      return;
    }
    const data = bao && bao.data;
    if (!data || typeof data !== "object") {
      showToast(t("File không có mục dữ liệu nào."));
      return;
    }
    /* Chỉ nhận đúng thứ thuộc về tài khoản này: một file lạ (hoặc file cũ của
       người khác) không được phép ghi đè cysim-users, cysim-session hay khoá
       của tài khoản khác. */
    const duoi = ":" + Auth.id();
    const hopLe = Object.keys(data).filter((k) => k.endsWith(duoi) && k.startsWith("cysim-"));
    if (!hopLe.length) {
      showToast(t("File này không chứa dữ liệu của tài khoản đang đăng nhập."));
      return;
    }
    for (const k of hopLe) localStorage.setItem(k, String(data[k]));
    showToast(t("Đã nạp") + " " + hopLe.length + " " + tdem(hopLe.length, "mục. Đang tải lại màn hình."));
    setTimeout(() => location.reload(), 900);
  };
  reader.readAsText(file);
}
function xoaDuLieu() {
  for (const k of taiKhoanKeys()) localStorage.removeItem(k);
  showToast(t("Đã xoá dữ liệu trên máy này. Đang tải lại màn hình."));
  setTimeout(() => location.reload(), 900);
}
/* Hai lần bấm mới xoá. confirm() của trình duyệt bị nhiều tiện ích chặn và
   người dùng bấm Enter theo phản xạ — đổi nhãn nút buộc họ ĐỌC rồi mới bấm. */
let wipeArmed = null;
function armWipe(btn) {
  const label = btn.textContent;
  btn.textContent = t("Bấm lần nữa để xác nhận xoá");
  btn.classList.add("danger");
  clearTimeout(wipeArmed);
  wipeArmed = setTimeout(() => {
    btn.textContent = label;
  }, 6000);
  btn.dataset.armed = "1";
}
on("setMotion", "change", (e) => Settings.save({ motion: e.target.checked ? "bat" : "tat" }));
on("setContrast", "change", (e) => Settings.save({ contrast: e.target.checked ? "cao" : "thuong" }));
on("setLang", "change", (e) => applyLanguage(e.target.value));
document.querySelectorAll("#settings .seg .btn").forEach((b) =>
  b.addEventListener("click", () => {
    Settings.save({ [b.dataset.choice]: b.dataset.value });
    paintSettings();
  })
);
on("setExport", "click", xuatDuLieu);
on("setImport", "click", () => {
  const f = $("setImportFile");
  if (f) f.click();
});
on("setImportFile", "change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) napDuLieu(f);
});
on("setWipe", "click", (e) => {
  const btn = e.currentTarget;
  if (btn.dataset.armed === "1") {
    clearTimeout(wipeArmed);
    xoaDuLieu();
    return;
  }
  armWipe(btn);
});

/* ---------- trang Quản trị ---------- */
/* Nút "Quản trị" chỉ là giao diện; quyền thật nằm ở role của tài khoản và do
   js/auth.js quyết. showView() chặn người không có quyền — chặn ở điểm vào duy
   nhất, không chỉ ẩn nút, vì F5 đúng view hoặc một nút [data-goto] cũng đi qua
   đây. Nói thẳng: đây là lớp quản lý cho một máy/lớp học, KHÔNG phải hàng rào
   bảo mật. Muốn thu quyền, mở DevTools và sửa localStorage là xong, nên trang
   này tự nó nói điều đó thay vì giả vờ chắc chắn. */
function paintAdminNav() {
  const nav = $("navAdmin");
  if (nav) nav.hidden = !(typeof Auth !== "undefined" && Auth.isAdmin && Auth.isAdmin());
  const fab = $("aiFab");
  if (fab) fab.hidden = !Flags.on("ai");
}
function paintFlagsList() {
  const box = $("adminFlags");
  if (!box) return;
  const on = Flags.read();
  /* Bật/tắt xong change() gọi lại đúng hàm này, replaceChildren() quăng
     activeElement về <body> — người dùng bàn phím mất vị trí giữa sáu công tắc
     và phải Tab lại từ đầu. Ghi chỉ mục ô đang focus rồi focus lại ô mới. */
  const dangFocus =
    document.activeElement && box.contains(document.activeElement)
      ? Array.from(box.children).indexOf(document.activeElement.closest("label"))
      : -1;
  box.replaceChildren();
  for (const key in TINH_NANG) {
    const label = document.createElement("label");
    label.className = "opt" + (on[key] ? "" : " off");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!on[key];
    cb.addEventListener("change", () => {
      Flags.save({ [key]: cb.checked });
      paintFlagsList();
      showToast(t("Đã lưu. Mọi tài khoản trên máy này nhận thay đổi ngay."));
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + t(TINH_NANG[key])));
    box.appendChild(label);
  }
  const lai = box.children[dangFocus];
  if (lai) lai.querySelector("input").focus();
}
/* Hai dòng này chạy cả từ AiBudget.them() (mỗi lượt AI thành công) nên phải
   sống được khi trang Quản trị chưa kịp dựng — $() trả null là bỏ qua. */
function paintAdminBudget() {
  const limit = $("adminAiLimit");
  if (limit && document.activeElement !== limit) limit.value = String(AiBudget.limit());
  const used = $("adminAiUsed");
  if (!used) return;
  const cap = AiBudget.limit();
  /* Ba mảnh, số do code chèn vào giữa: "Tài khoản này đã hỏi" + 3/10 + "lượt
     hôm nay — còn" + 7 + "lượt." Người dịch tự đặt động từ của tiếng mình ở
     mảnh đầu và đơn vị ở mảnh cuối, nên câu không bị vỡ thứ tự. */
  const daHoi = t("Tài khoản này đã hỏi");
  used.textContent =
    cap === 0
      ? daHoi + " " + AiBudget.used() + " " + tdem(AiBudget.used(), "lượt hôm nay — chưa đặt giới hạn nên không lượt nào bị chặn.")
      : daHoi + " " + AiBudget.used() + "/" + cap + " " + tdem(AiBudget.used(), "lượt hôm nay — còn") + " " + AiBudget.conLai() + " " + tdem(AiBudget.conLai(), "lượt.");
}
/* Bảng "Tài khoản trên máy này": toàn bộ dữ liệu nằm trong localStorage của
   đúng máy này, nên một tài khoản có role admin đọc được tiến độ của người
   khác — KHÔNG cần đánh cắp mật khẩu. Đây chính là nội dung bài lab IDOR,
   nên trang này liệt kê thẳng, không giấu. */
function paintAdminUsers() {
  const body = $("adminUsers");
  if (!body) return;
  const users = (Auth.allUsers ? Auth.allUsers() : []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  /* Cùng một lý do với paintFlagsList: đổi vai trò xong bảng vẽ lại, nếu không
     ghi nhớ thì focus của ô vừa bấm rơi về <body>. */
  const dongFocus =
    document.activeElement && body.contains(document.activeElement)
      ? Array.from(body.children).indexOf(document.activeElement.closest("tr"))
      : -1;
  body.replaceChildren();
  const soAdmin = users.filter((u) => u.role === "admin").length;
  for (const u of users) {
    const done = CyUtil.readJson(localStorage, "cysim-done:" + u.email, []) || [];
    const dong = document.createElement("tr");
    const td = (text, cls) => {
      const cell = document.createElement("td");
      cell.textContent = text;
      if (cls) cell.className = cls;
      return cell;
    };
    const nut = document.createElement("td");
    if (u.email === Auth.id()) {
      /* Không cho tự hạ chính mình: tài khoản đang ngồi đây là tài khoản duy
         nhất còn giữ đường vào trang này, hạ nó là mất trang ngay giữa nhịp. */
      nut.append(td(t("Bạn đang đăng nhập bằng tài khoản này"), "mute"));
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      const nang = u.role !== "admin";
      /* Không cho hạ admin cuối cùng: mất admin duy nhất là mất luôn đường vào
         trang này, và trang này là nơi duy nhất nhập lại mã quản trị. */
      if (!nang && soAdmin <= 1) {
        btn.disabled = true;
        btn.title = t("Phải còn ít nhất một tài khoản quản trị.");
      }
      btn.textContent = t(nang ? "Đặt làm quản trị" : "Hạ xuống học viên");
      btn.addEventListener("click", () => {
        const res = Auth.setRole(u.email, nang ? "admin" : "learner");
        if (!res || !res.ok) {
          showToast(t(res && res.reason === "last-admin" ? "Không thể hạ admin cuối cùng." : "Không đổi được vai trò."));
          return;
        }
        paintAdminUsers();
      });
      nut.append(btn);
    }
    dong.append(
      td(u.name || u.email),
      td(t(u.role === "admin" ? "Quản trị" : "Học viên") + (u.verified ? "" : " · " + t("chưa xác minh email"))),
      td(done.length + " / " + TOTAL_MISSIONS),
      nut
    );
    body.append(dong);
  }
  const o = body.children[dongFocus] && body.children[dongFocus].querySelector("button");
  if (o) o.focus();
  const hint = $("adminNoAdmin");
  if (hint) {
    hint.textContent = t(
      users.length
        ? "Ai có mã quản trị đều lên được quản trị. Đặt mã ở ô dưới — máy này chưa có ai giữ mã thì lần đặt đầu tiên là lần khai mã."
        : "Chưa có tài khoản nào trên máy này. Tạo một tài khoản trong bảng đăng nhập rồi mới tới đây."
    );
  }
  const input = $("adminCodeInput");
  const btn = $("adminClaim");
  if (input && btn) {
    const dat = Auth.adminCodeDefined ? Auth.adminCodeDefined() : false;
    input.placeholder = t(dat ? "Mã quản trị của máy này" : "Tự đặt mã quản trị (ít nhất 8 ký tự)");
    btn.textContent = t(dat ? "Xác nhận mã, lên quản trị" : "Đặt mã và lên quản trị");
  }
}
on("adminAiLimit", "input", (e) => {
  const n = Math.max(0, Math.min(999, parseInt(e.target.value, 10) || 0));
  if (String(n) !== e.target.value) e.target.value = String(n);
  AiBudget.setLimit(n);
});
on("adminClaim", "click", async (e) => {
  const btn = e.currentTarget;
  const input = $("adminCodeInput");
  const code = (input && input.value) || "";
  btn.disabled = true;
  let res;
  try {
    res = await Auth.claimAdmin(code);
  } finally {
    btn.disabled = false;
  }
  if (res && res.ok) {
    if (input) input.value = "";
    showToast(t("Tài khoản này đã là quản trị. Mọi công tắc bên dưới mở được."));
    paintAdminNav();
    paintAdminUsers();
  } else {
    showToast(t(res && res.reason === "short" ? "Mã phải có ít nhất 8 ký tự." : "Mã quản trị không đúng."));
  }
});
function paintAdminPage() {
  if (!$("admin")) return;
  paintFlagsList();
  paintAdminBudget();
  paintAdminUsers();
}

/* ---------- chế độ khách: công học phải đi theo người học ----------
   Ai bấm "Khám phá không cần tài khoản" thì mọi thứ ghi dưới hậu tố ":guest".
   Tới lúc tạo tài khoản thật, đoạn dưới DỜI nguyên khối đó sang hậu tố của
   email mới — người dùng không phải học lại từ đầu chỉ vì ban đầu chưa muốn
   đăng ký. Đây chính là câu trả lời cho "đăng nhập để làm gì": không đăng ký
   thì vẫn học được, nhưng công học nằm chờ dưới tên "guest" và chỉ tài khoản
   của bạn mới lấy được tấm chứng chỉ mang tên bạn.
   Chỉ những khoá thuộc về khách mới bị đụng tới, và khoá đã có giá trị ở tài
   khoản đích thì KHÔNG bị ghi đè — trừ cysim-done là nhập hai danh sách làm
   một (đó là tiến độ, mất một bên là mất công học thật). */
function taiDuLieuKhach() {
  if (!Auth.isLoggedIn || !Auth.isLoggedIn() || Auth.isGuest()) return 0;
  const duoiKhach = ":guest";
  const cuaMinh = ":" + Auth.id();
  if (Auth.id() === "guest") return 0;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.endsWith(duoiKhach) && k.startsWith("cysim-")) keys.push(k);
  }
  if (!keys.length) return 0;
  let baoNhieu = 0;
  for (const k of keys) {
    const ten = k.slice(0, -duoiKhach.length);
    const dich = ten + cuaMinh;
    const giaTri = localStorage.getItem(k);
    const daCo = localStorage.getItem(dich);
    if (daCo === null) localStorage.setItem(dich, giaTri);
    else if (ten === "cysim-done") {
      try {
        const gop = new Set([...JSON.parse(daCo), ...JSON.parse(giaTri)]);
        localStorage.setItem(dich, JSON.stringify([...gop]));
      } catch (e) {
        continue; // dữ liệu hỏng thì bỏ, không tự ý ghi đè thứ đang đọc được
      }
    } else continue;
    localStorage.removeItem(k);
    baoNhieu++;
  }
  if (baoNhieu) {
    /* Đợi một nhịp: finish() trong auth.js vừa showToast("Đăng nhập thành
       công") ngay trước khi hàm này chạy, và toast chỉ có MỘT chỗ trên màn
       hình — báo tin quan trọng hơn (công học của bạn đã về đây) không được
       để tin vặt đè mất. */
    setTimeout(
      () => showToast(t("Đã chuyển") + " " + baoNhieu + " " + tdem(baoNhieu, "mục dữ liệu của chế độ khách vào tài khoản này.")),
      1200
    );
  }
  return baoNhieu;
}

document.addEventListener("cysim:session", () => {
  taiDuLieuKhach();
  paintAdminNav();
  paintSettings();
  paintAdminBudget();
  const view = document.querySelector(".view.active");
  if (view && view.id === "settings") paintSettings();
  if (view && view.id === "admin") paintAdminPage();
});
/* Trang Cài đặt và trang Quản trị dựng chữ bằng JS (vùng data-no-i18n) nên đổi
   ngôn ngữ là phải vẽ lại đúng hai trang đó. */
document.addEventListener("cysim:language", () => {
  const view = document.querySelector(".view.active");
  if (view && view.id === "settings") paintSettings();
  if (view && view.id === "admin") paintAdminPage();
});

/* ---------- trạng thái nhiệm vụ ---------- */
const RANKS = ["Thực tập viên", "Nhân viên SOC", "Chuyên viên phân tích", "Chuyên viên phòng thủ", "Chiến binh an ninh mạng", "Huyền thoại An ninh mạng"];
const TOTAL_MISSIONS = 13;
/* Chỉ số = số nhiệm vụ đã hoàn thành. Bản cũ về max rank ngay ở nhiệm vụ thứ 7
   trong khi hệ thống có 13 nhiệm vụ; chia lại để bậc cao nhất nằm ở cuối đường
   tập (11/13) và mỗi bậc đều có chỗ đứng rõ ràng. */
const RANK_MAP = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5];
/* Tên đầy đủ, không gọi là "done": từ đó quá chung nên đọc giữa chừng không
   biết nó là gì, và nó xung đột với biến done của vòng lặp đọc stream. */
let completedMissions = new Set();

function rankFor(count) {
  return RANKS[RANK_MAP[Math.min(count, TOTAL_MISSIONS)]];
}

/* "cert" chính là tấm chứng chỉ — nhiệm vụ thứ 13, do certificate.js cấp SAU khi
   thi đỗ. Không được đếm nó vào điều kiện mở kỳ thi, nếu không sẽ deadlock: phải
   thi mới có bằng, mà bằng lại là nhiệm vụ cần làm để được thi. */
const TOTAL_LABS = TOTAL_MISSIONS - 1;
function labsDone() {
  let n = 0;
  for (const k of completedMissions) if (k !== "cert") n++;
  return n;
}

/* Bảng "mấy nhiệm vụ thì lên cấp" trong trang Hướng dẫn: lấy thẳng RANK_MAP
   thay vì viết tay con số, nếu không đổi đường cấp là bảng lệch ngay. */
function paintRankTable() {
  const ul = $("guideRanks");
  if (!ul) return;
  ul.replaceChildren();
  RANKS.forEach((rank, level) => {
    const at = RANK_MAP.indexOf(level);
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = t(rank);
    const need = document.createElement("em");
    need.textContent = at < 0 ? "—" : String(at);
    li.append(name, need);
    ul.append(li);
  });
}
paintRankTable();

async function renderProgress() {
  const n = completedMissions.size;
  $("rankName").textContent = t(rankFor(n));
  $("xpBar").style.width = (n / TOTAL_MISSIONS) * 100 + "%";
  $("xpNum").textContent = n * 100 + " XP";
  $("maxXpNum").textContent = TOTAL_MISSIONS * 100 + " XP";
  document.querySelectorAll("[data-k]").forEach((el) => {
    const isDone = completedMissions.has(el.dataset.k);
    el.classList.toggle("done", isDone);
    const chip = el.querySelector(".chip");
    if (chip) chip.textContent = t(isDone ? "Hoàn thành · +100 XP" : "Chưa làm · 100 XP");
  });
  /* Không dựng bảng xếp hạng ở đây: danh sách chỉ cần khi người dùng mở
     trang Leaderboard (showView đã gọi renderLeaderboard), còn hoàn thành
     nhiệm vụ thì không hiển thị bảng đó. */
}

async function complete(key, message) {
  if (completedMissions.has(key)) return;
  completedMissions.add(key);
  await API.completeMission(key);
  await renderProgress();
  showToast(message, true);
}

async function renderLeaderboard() {
  const list = await API.getLeaderboard(completedMissions.size * 100, rankFor(completedMissions.size));
  /* Bảng dựng từng node, không ghép chuỗi HTML. CyUtil.esc() đã bọc tên từ
     trước, nhưng một hàng rào bằng QUY ƯỚC vẫn còn đường trượt: chỉ cần ai đó
     sửa thành `esc(item.name).bold()` là chuỗi HTML quay trở lại. Ở đây tên
     người dùng đi qua textContent, nên không có chuỗi nào được parse cả —
     muốn "chạy" cũng không có cửa. */
  const body = $("lbBody");
  body.replaceChildren();
  const o = (v) => {
    const td = document.createElement("td");
    td.textContent = v;
    return td;
  };
  list.forEach((item, i) => {
    const hang = document.createElement("tr");
    if (item.me) hang.className = "me";
    hang.append(
      o("#" + (i + 1)),
      o(item.name + (item.me ? " ⭐" : "")),
      o(t(item.rank)),
      o(item.xp + " XP")
    );
    body.append(hang);
  });
  /* Dòng chú thích trung thực: chín tên mặc định là chữ do ứng dụng tự đặt,
     người dùng không hề đua với người thật. Không nói ra thì bảng này đánh
     lừa: thấy mình "hạng 7/10" là tưởng đang thua chín người khác.
     #lbNote mang data-no-i18n (chữ do JS ghép) nên vẽ lại bằng t(). */
  const viTri = list.findIndex((x) => x.me);
  const soHangMau = list.length - 1;
  $("lbNote").textContent =
    viTri < 0
      ? `${list.length} ${tdem(list.length, "hạng trên đều là dữ liệu mẫu — đăng nhập và làm nhiệm vụ để có tên ở đây.")}`
      : `${t("Chỉ dòng của bạn là tài khoản thật")}: ${soHangMau} ${tdem(soHangMau, "hạng còn lại là dữ liệu mẫu")} · ${t("Bạn đang ở hạng")} #${viTri + 1}`;
}

/* ---------- điều hướng ---------- */
const sidebar = $("sidebar");
const mobileMenuBtn = $("mobileMenuBtn");
const mobileOverlay = $("mobileOverlay");

function closeMobileMenu() {
  sidebar.classList.remove("open");
  mobileOverlay.classList.remove("active");
}

mobileMenuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  mobileOverlay.classList.add("active");
});
mobileOverlay.addEventListener("click", closeMobileMenu);

/* ---------- bàn phím ảo không che chỗ đang gõ ----------
   Hai lớp chống, và cần cả hai:
     1) <meta viewport interactive-widget=resizes-content> bảo Chrome Android
        THU CHIỀU CAO khung nhìn khi bàn phím hiện, nên mọi thứ kẹp theo bottom
        (khung chat AI) tự nhô lên. iOS không hỗ trợ thuộc tính này — ở đó bàn
        phím chỉ đè lên như một lớp vẽ, chiều cao không đổi.
     2) Handler dưới đây cho phần còn lại: sau 320ms (bàn phím đã xong hoạt
        cảnh) đo lại ô đang gõ, nếu nó không còn nằm gọn trong khung nhìn thì
        cuộn lên giữa. Đã thấy rõ thì KHÔNG cuộn — nhảy màn hình mỗi lần bấm
        vào một ô đang nhìn thấy là cái lỗi người dùng ghét hơn cả bị che.
   Viết một lần ở đây thay vì mỗi nơi tự viết: 15 lab + khung chat + trang Cài
   đặt + trang Tài khoản đều có ô nhập, để mỗi nơi một tay là ~20 lần cùng một
   lỗi, và lỗi nằm ở nơi người ta không nhìn. select không cần: trình duyệt tự
   vẽ picker giữa màn hình, đó không phải bàn phím. */
const MAY_CHAM = window.matchMedia("(max-width:860px), (pointer:coarse)");
const O_NHAP = { INPUT: 1, TEXTAREA: 1 };
const KHONG_CAN_BAN_PHIM = { checkbox: 1, radio: 1, button: 1, submit: 1, reset: 1, file: 1, range: 1, color: 1, image: 1 };
document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!el || !O_NHAP[el.tagName] || KHONG_CAN_BAN_PHIM[el.type]) return;
  if (!MAY_CHAM.matches) return;
  setTimeout(() => {
    if (document.activeElement !== el || !el.isConnected) return;
    const cao = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    const r = el.getBoundingClientRect();
    if (r.top >= 8 && r.bottom <= cao - 8) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 320);
});

/* Chỉ đếm số liệu khi đang xem trang Giám sát, rời trang là tắt.
   Số liệu là mô phỏng: tiêu đề trang đã ghi rõ điều này. */
let monitorInterval = null;
let monitorBlocked = 0;
let monitorExposed = 0;

function num(n) {
  return CyUtil.numOf(n);
}

function startMonitor() {
  if (monitorInterval) return;
  monitorInterval = setInterval(() => {
    $("statFps").textContent = Math.floor(58 + Math.random() * 4);
    $("statPing").textContent = Math.floor(18 + Math.random() * 12) + " ms";
    monitorBlocked += Math.floor(2 + Math.random() * 6);
    $("statBlocked").textContent = num(monitorBlocked);

    const feed = $("threatFeed");
    const port = [22, 80, 443, 3306][Math.floor(Math.random() * 4)];
    const suspicious = Math.random() < 0.18;
    if (suspicious) {
      monitorExposed++;
      $("statExposed").textContent = num(monitorExposed);
    }
    const line = document.createElement("div");
    line.textContent =
      `[${new Date().toLocaleTimeString()}] IP 192.168.1.${Math.floor(Math.random() * 254)} — ${t("Thử cổng")} ${port} — ` +
      (suspicious ? t("CHẶN + CẢNH BÁO NGHI VẤN") : t("CHẶN TỰ ĐỘNG"));
    feed.appendChild(line);
    while (feed.children.length > 8) feed.removeChild(feed.firstChild);
  }, 2000);
}

function stopMonitor() {
  clearInterval(monitorInterval);
  monitorInterval = null;
}

/* Đang xem trang Giám sát mà đổi ngôn ngữ thì dấu phân cách nghìn phải đổi
   ngay tại nhịp đó, không chờ tới lần đếm kế tiếp. */
document.addEventListener("cysim:language", () => {
  if (!monitorInterval) return;
  $("statBlocked").textContent = num(monitorBlocked);
  $("statExposed").textContent = num(monitorExposed);
});

/* ---------- sidebar: nhóm "Phòng lab" gập được ----------
   Người dùng bảo cột trái "chật, không đẹp mắt": hai mươi hàng chữ nhỏ liệt kê
   cùng lúc, mở lên không biết hôm nay mình cần gì. Gập mười một phòng lab sau
   một cái nút là cách rẻ nhất mà KHÔNG giấu bài đi đâu — trang Tổng quan vẫn có
   thẻ riêng cho từng lab, Ctrl+K vẫn tìm thấy cả mười một vì js/search.js đọc
   .nav-btn[data-view] mà không hỏi phần tử đó đang hiển thị hay không, và dấu ✓
   hoàn thành vẫn gắn đúng chỗ vì renderProgress chạy trên [data-k] bất kể gập.
   CSS chỉ làm một việc: nav:not(.labs-open) [data-lab]{display:none}. Chọn
   display:none thay vì chiều cao 0 vì nó xoá luôn nút khỏi thứ tự Tab — bàn
   phím không nhảy vào một hàng đang ẩn.
   Trạng thái gập là thói quen nhìn của MÁY (như "cysim-lang"), không gắn với
   tài khoản, nên đọc thẳng localStorage thay vì đi qua Settings: Settings sinh
   ra để gán dataset trên <html>, còn ở đây chỉ có một bit. */
const NAV_LABS_KEY = "cysim-nav-labs";
function navLabsDem() {
  return document.querySelectorAll(".nav-btn[data-lab]").length;
}
function navLabsVe(mo) {
  const nav = document.querySelector("aside nav");
  const nut = $("navLabsToggle");
  if (!nav || !nut) return;
  nav.classList.toggle("labs-open", mo);
  nut.setAttribute("aria-expanded", String(mo));
  const dem = $("navLabsCount");
  if (dem) dem.textContent = String(navLabsDem());
}
on("navLabsToggle", "click", () => {
  const mo = localStorage.getItem(NAV_LABS_KEY) !== "1";
  localStorage.setItem(NAV_LABS_KEY, mo ? "1" : "0");
  navLabsVe(mo);
});
navLabsVe(localStorage.getItem(NAV_LABS_KEY) === "1");

/* ---------- nạp script của từng trang đúng lúc trang đó được mở ----------
   ĐỀ BÀI (người duyệt, nhược điểm #5 + đề xuất #5): "hiệu năng tải trang, chưa
   lazy-load lab". SỐ ĐO TRƯỚC KHI SỬA, 30-10-2026 ở 127.0.0.1:8137 qua Performance
   API: trang nạp 416,1 KB JS trong 23 thẻ <script>, nhưng một phiên học
   thường chỉ ghé 2-3 phòng; 15 file (14 lab + ai.js = 172,9 KB) vì thế bị tải
   để không.
   SAU KHI SỬA, cùng phép đo: 8 thẻ = 252,2 KB lúc boot; mở cả 20 màn hình mới
   lên 22 resource JS = 356,3 KB; ai.js (69,3 KB) chỉ tới khi mở khung chat.
   Số liệu đầy đủ và vì sao an toàn: README mục 4.8.
   index.html bây giờ giữ lại 8 thẻ: utils -> i18n-curated -> i18n -> app -> auth
   -> labs/exam.js -> search -> boot. Thứ tự bắt buộc trong số đó vẫn còn nguyên
   (app.js cần utils+i18n, boot.js cần tất cả), chỉ là phòng lab không còn nằm
   trong hàng đợi chặn vẽ nữa.

   VÌ SAO exam.js KHÔNG nạp chậm: showView() đọc Labs.exam.dangLam() để khóa
   điều hướng khi đang ngồi trong phòng thi. File đó mà cũng chờ tới lúc mở trang
   thì sau một lần F5 giữa giờ làm bài, cửa phòng thi mở toang trong lúc chờ tải
   script — 43,6 KB không đánh đổi được tính nghiêm túc của kỳ thi.

   VÌ SAO search.js KHÔNG nạp chậm: nó nghe Ctrl+K và nút tìm kiếm, là lối điều
   hướng chính cho người dùng bàn phím; 13,3 KB rẻ hơn một tổ hợp phím bấm rồi
   không thấy gì.

   lab chưa nạp thì Labs.<lab> chưa tồn tại — mọi chỗ gọi sang lab trong file này
   đều dùng ?. nên lần mở ĐẦU TIÊN chỉ im lặng bỏ qua, phần vẽ lại đầu trang nằm
   ở VE_SAUKHI_NAP dưới đây, chạy ngay sau khi script của trang đó về tới. */
const LAB_SCRIPT = {
  account: "js/labs/account.js",
  sqli: "js/labs/sqli.js",
  phishing: "js/labs/phishing.js",
  ddos: "js/labs/ddos.js",
  password: "js/labs/password.js",
  firewall: "js/labs/firewall.js",
  realip: "js/labs/realip.js",
  antivirus: "js/labs/antivirus.js",
  csrf: "js/labs/csrf.js",
  idor: "js/labs/idor.js",
  xss: "js/labs/xss.js",
  siem: "js/labs/siem.js",
  certificate: "js/labs/certificate.js",
  guide: "js/labs/guide.js",
  ai: "js/ai.js",
};

/* id của <section class="view"> -> những file trang đó cần. */
const VIEW_SCRIPT = {
  account: ["account"],
  sqli: ["sqli"],
  phishing: ["phishing"],
  ddos: ["ddos"],
  password: ["password"],
  firewall: ["firewall"],
  "real-ip-lab": ["realip"],
  antivirus: ["antivirus"],
  csrf: ["csrf"],
  idor: ["idor"],
  xss: ["xss"],
  siem: ["siem"],
  certificate: ["certificate"],
  guide: ["guide"],
};

/* Những lab không tự vẽ khi script chạy (chúng chỉ bind sự kiện), nên mở trang
   lần đầu phải vẽ hộ — đúng các hàm mà showView/language handler vẫn gọi. Tất cả
   đều là hàm vẽ lại từ trạng thái hiện tại, gọi thêm lần nữa không hại gì. */
const VE_SAUKHI_NAP = {
  sqli: () => Labs.sqli?.paint(),
  xss: () => Labs.xss?.paint(),
  password: () => Labs.password?.render($("passwordInput").value),
  certificate: () => {
    Labs.certificate?.render();
    Labs.exam?.render();
  },
  guide: () => Labs.guide?.refresh(),
  siem: () => Labs.siem?.resetVerdict(),
};

const dangNap = new Map();
/* Hai thông báo Error trong hàm này viết bằng tiếng Anh CÓ CHỦ ĐÍCH: chúng chỉ
   đi vào console của người lập trình, còn chữ trên màn hình thì người dùng đã
   nhận bằng t() ở napTrang(). Lỗi ở đây mà viết tiếng Việt có dấu là
   tools/i18n_scan.py coi là chuỗi cần dịch và báo "thiếu" cho đủ năm thứ tiếng —
   log nội bộ nằm ngoài bộ máy dịch, đúng như quy tắc console.* của scanner. */
function napFile(ten) {
  const src = LAB_SCRIPT[ten];
  if (!src) return Promise.reject(new Error("unknown lab key: " + ten));
  if (Labs[ten]) return Promise.resolve(); // đã nạp rồi, khỏi đụng DOM
  let mo = dangNap.get(src);
  if (!mo) {
    mo = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.defer = false; // script chèn động vốn đã bất bộ; defer chỉ gây hiểu nhầm
      s.onload = () => resolve();
      s.onerror = () => {
        dangNap.delete(src); // thất bại thì cho phép thử lại, không khóa vĩnh viễn
        reject(new Error("script load failed: " + src));
      };
      document.head.appendChild(s);
    });
    dangNap.set(src, mo);
  }
  return mo;
}

async function napTrang(id) {
  const can = VIEW_SCRIPT[id];
  if (!can) return;
  try {
    await Promise.all(can.map(napFile));
  } catch (e) {
    console.warn("[app]", e.message);
    showToast(t("Không tải được phòng lab này (thiếu mạng hoặc file bị xoá). Hãy thử lại."));
    return;
  }
  const ve = VE_SAUKHI_NAP[id];
  if (ve) ve();
}

/* Nút AI nổi: ai.js không còn nằm trong <script> tĩnh, nên cú bấm đầu tiên không
   có ai nghe. Listener này gắn ở pha CAPTURE trên chính #aiFab và chạy TRƯỚC mọi
   listener khác của cùng cú click, nên nó kéo file về rồi tự mở khung; từ cú bấm
   thứ hai trở đi Labs.ai đã tồn tại và nhường hẳn cho ai.js.
   stopImmediatePropagation là để chắc chắn: nếu script về kịp trong chính cú click
   đang bay, listener của ai.js không được bấm nút lần hai (mở rồi đóng ngay). */
$("aiFab").addEventListener(
  "click",
  (ev) => {
    if (Labs.ai) return;
    ev.stopImmediatePropagation();
    napFile("ai")
      .then(() => Labs.ai?.toggle())
      .catch(() => showToast(t("Không tải được CySim AI (thiếu mạng hoặc file bị xoá).")));
  },
  true
);

async function showView(id) {
  const view = $(id);
  if (!view) return;
  /* Công tắc quản trị chặn NGAY TẠI ĐIỂM VÀO duy nhất của mọi trang. Chặn ở đây
     chứ không chỉ ẩn nút trong sidebar: người dùng bấm vào một liên kết cũ, một
     nút "Tới phòng thi" trong trang khác, hay F5 đúng view bị tắt — tất cả đều
     đi qua hàm này, còn .nav-btn[hidden] thì không chặn được gì cả. */
  const flag = VIEW_FLAG[id];
  if (flag && !Flags.on(flag)) {
    showToast(t("Tính năng này đang bị tắt. Mở trang Quản trị để bật lại."));
    return;
  }
  /* Quyền vào trang Quản trị do role quyết, không do cái nút quyết. Người thường
     muốn lên quản trị thì có hai đường thật: đăng ký tài khoản kèm mã quản trị
     (ô ngay trong form đăng ký), hoặc nhờ người đang giữ mã đổi role cho mình
     trong bảng "Tài khoản trên máy này". */
  if (id === "admin" && !(Auth.isAdmin && Auth.isAdmin())) {
    showToast(t("Trang này chỉ dành cho tài khoản quản trị. Bạn có thể đăng ký tài khoản mới kèm mã quản trị."));
    return;
  }
  /* Đang ngồi trong phòng thi tốt nghiệp thì không đi đâu được ngoài trang
     Chứng chỉ (nơi bài thi nằm) — nộp bài hoặc bấm "Rời phòng thi" mới mở khoá.
     Đây là phần thưởng thật: bằng cấp vô nghĩa nếu đề thi mở được song song
     với trang lý thuyết. Toàn màn hình chỉ là tiện nghi (Esc thoát được), còn
     chốt ở đây mới là thứ chặn. */
  if (id !== "certificate" && Labs.exam?.dangLam()) {
    showToast(t("Đang làm bài thi. Hãy nộp bài hoặc rời phòng thi trước khi sang trang khác."));
    return;
  }
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v === view));  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === id));
  /* Tới một phòng lab thì nhóm lab phải mở ra. Đi đường vòng (thẻ trong Tổng
     quan, Ctrl+K, "Tiếp tục" ở Hướng dẫn) mà cột trái vẫn gập thì người dùng
     không nhìn thấy mình đang ở đâu — và đây là lúc KHÔNG ghi lại vào
     localStorage: đó là hệ quả của một lần điều hướng, không phải ý muốn gập
     hay mở của người dùng, nên F5 vẫn trả về đúng thói quen họ đã đặt.
     scrollIntoView({block:"nearest"}) là vế còn thiếu: mở nhóm ở màn hình
     800px cao thì hàng đang sáng vẫn có thể nằm dưới vùng cuộn của <nav>, và
     "nearest" chỉ cuộn ô nav đó, không nhúc nhích cả trang. */
  const nutLab = document.querySelector('.nav-btn[data-lab][data-view="' + id + '"]');
  if (nutLab) {
    navLabsVe(true);
    nutLab.scrollIntoView({ block: "nearest" });
  }
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (id === "leaderboard") renderLeaderboard();
  if (id === "settings") paintSettings();
  if (id === "admin") paintAdminPage();
  /* Chứng chỉ + kỳ thi: exam.js nạp cùng trang (nó nằm trong số 8 thẻ <script>
     tĩnh), certificate.js thì về tận đây — nên cả hai lần vẽ đều đi qua
     VE_SAUKHI_NAP ở cuối hàm, không vẽ ở đây nữa kẻo render hai lần. */
  if (id === "monitor") startMonitor();
  else stopMonitor();

  if (id !== "ddos") Labs.ddos?.stop();
  if (id !== "account") Labs.account?.cancel();
  if (id !== "firewall") Labs.firewall?.cancelScan();
  /* Hai lab còn lại cũng phải dừng khi rời trang:
       - antivirus: một lượt quét 300 file chạy bằng vòng lặp await, không có
         timer nên trước đây không ai dừng -> quay về vẫn âm thầm đọc đĩa và
         in thêm dòng vào khung đã ẩn;
       - realip: lượt tra IP đang chờ trên mạng, rời trang thì không còn lý do
         chờ -> abort() để đóng kết nối và gỡ chữ "đang truy vấn".
     Quy ước: lab khai báo stop() rồi nối vào đây, giống ddos. */
  if (id !== "antivirus") Labs.antivirus?.stop();
  if (id !== "real-ip-lab") Labs.realip?.stop();

  /* Trạng thái tạm của lab phải được dọn khi chuyển trang, nếu không rời đi
     rồi quay lại sẽ vẫn thấy banner "đã bị hack" hay kết luận SIEM sai của
     lần trước. Hai vụ việc khác nhau nên hướng dọn cũng khác nhau:
       - phishing là một lượt săn cố định -> reset() bàn cờ về 0/3 khi rời trang
         (tiến độ/XP đã nhận nằm trong API, không mất theo);
       - siem là bảng tick đang làm dở -> chỉ ẩn verdict khi QUAY LẠI, giữ nguyên
         những dòng người dùng đã đánh dấu (lần mở đầu nằm trong VE_SAUKHI_NAP,
         vì khi chưa nạp thì Labs.siem chưa tồn tại để mà dọn).
     Quy ước: lab khai báo stop() / reset() rồi nối vào đây. */
  if (id !== "phishing") Labs.phishing?.reset();

  /* Lần mở ĐẦU TIÊN của một trang là lúc script của nó mới về tới, nên mọi việc
     "vẽ lại đầu trang" phải chờ tới sau dòng này. Trang nào không có script rieng
     (dashboard, monitor, settings, admin, leaderboard, theory) thì napTrang()
     trả về ngay — await chỉ là một microtask. */
  await napTrang(id);
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
    if (window.innerWidth <= 860) closeMobileMenu();
  });
});

document.querySelectorAll("[data-goto]").forEach((b) =>
  b.addEventListener("click", () => showView(b.dataset.goto))
);

/* Đổi ngôn ngữ: những chỗ JS tự viết chữ (không nằm trong HTML tĩnh) phải
   được vẽ lại, nếu không sẽ kẹt ở ngôn ngữ cũ. */
document.addEventListener("cysim:language", () => {
  renderProgress();
  renderLeaderboard();
  paintRankTable();
  Labs.password?.render($("passwordInput").value);
  Labs.certificate?.render();
  /* Bài thi tốt nghiệp dựng động trong #examBody/#examResult (data-no-i18n) nên
     engine dịch không chạm tới; đổi ngôn ngữ là phải vẽ lại từ t(). */
  Labs.exam?.render();
  /* Bảng Hướng dẫn có mấy dòng trạng thái nằm trong data-no-i18n (số liệu +
     message một phần), renderDocument không đụng tới, nên nếu không vẽ lại thì
     chúng kẹt hẳn ở ngôn ngữ cũ ngay trên màn hình vừa đổi. */
  Labs.guide?.refresh();
  /* Khung chat AI: #aiLog là vùng data-no-i18n nên engine dịch không đụng tới;
     riêng nhãn "Bạn"/"CySim AI" và dòng gợi ý trống do ai.js tự vẽ bằng t(),
     vì vậy phải vẽ lại ở đây. */
  Labs.ai?.render();
});

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.info("[PWA] Không đăng ký được Service Worker:", err.message));
  });
}

/* ---------- biển "không có internet" ----------
   App học được ngoại tuyến là NHỜ sw.js đã nhớ sẵn file, không phải nhờ một
   phép màu nào đó, nên người dùng cần nhìn thấy trạng thái mạng ngay thay vì
   đoán vì sao AI không trả lời. Một câu duy nhất, nằm tĩnh trong #netFlag để
   engine dịch như mọi chữ khác — JS chỉ bật/tắt [hidden].
   navigator.onLine chỉ là lời trình duyệt khai: một mạng nội bộ không ra
   internet vẫn báo "true". Vì câu chữ nói "theo trình duyệt" và mọi chức năng
   cần mạng thật (AI, tra cứu IP, dịch) vẫn tự báo lỗi đúng bệnh riêng, biển này
   là CẢNH BÁO THÊM, không phải hàng rào chắn tính năng. */
function paintNetFlag() {
  const flag = $("netFlag");
  if (flag) flag.hidden = navigator.onLine !== false;
}
window.addEventListener("online", paintNetFlag);
window.addEventListener("offline", paintNetFlag);
paintNetFlag();
