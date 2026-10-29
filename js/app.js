/* =========================================================
   CySim — app.js  ·  nhân dùng chung của giao diện

   LÀ GÌ   : toast, hiệu ứng gõ chữ, trạng thái 13 nhiệm vụ + đường cấp,
             bảng xếp hạng, điều hướng sidebar, đồng hồ "giám sát" ở
             dashboard. Không chứa kiến thức an ninh mạng — mỗi bài học
             nằm riêng trong js/labs/<tên>.js.
   CHẠY     : Lúc nạp vẽ bảng cấp (paintRankTable), nối click cho
             .nav-btn / [data-goto], nghe sự kiện "cysim:language" để vẽ
             lại chữ do JS tự sinh, đăng ký Service Worker và bật/tắt biển
             "không có internet" theo sự kiện online/offline của trình duyệt.
             startMonitor() chỉ chạy khi mở view "monitor" và chỉ quay số
             ngẫu nhiên để minh hoạ — không đo mạng thật.
   TOÀN CẦU : định nghĩa Labs{}, showToast, typeWriter, API, RANKS,
             TOTAL_MISSIONS, TOTAL_LABS, RANK_MAP, completedMissions, rankFor,
             labsDone, renderProgress, complete, renderLeaderboard, showView.
             đọc Auth.id()/displayName(), CyUtil, t();
             gọi Labs.<lab>.stop/cancel/reset/render khi đổi trang.
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
  $("lbBody").innerHTML = list
    .map(
      (item, i) => `<tr class="${item.me ? "me" : ""}">
        <td>#${i + 1}</td>
        <td>${CyUtil.esc(item.name)}${item.me ? " ⭐" : ""}</td>
        <td>${CyUtil.esc(t(item.rank))}</td>
        <td>${item.xp} XP</td>
      </tr>`
    )
    .join("");
  /* Dòng chú thích trung thực: chín tên mặc định là chữ do ứng dụng tự đặt,
     người dùng không hề đua với người thật. Không nói ra thì bảng này đánh
     lừa: thấy mình "hạng 7/10" là tưởng đang thua chín người khác.
     #lbNote mang data-no-i18n (chữ do JS ghép) nên vẽ lại bằng t(). */
  const viTri = list.findIndex((x) => x.me);
  const soHangMau = list.length - 1;
  $("lbNote").textContent =
    viTri < 0
      ? `${list.length} ${t("hạng trên đều là dữ liệu mẫu — đăng nhập và làm nhiệm vụ để có tên ở đây.")}`
      : `${t("Chỉ dòng của bạn là tài khoản thật")}: ${soHangMau} ${t("hạng còn lại là dữ liệu mẫu")} · ${t("Bạn đang ở hạng")} #${viTri + 1}`;
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

function showView(id) {
  const view = $(id);
  if (!view) return;
  /* Đang ngồi trong phòng thi tốt nghiệp thì không đi đâu được ngoài trang
     Chứng chỉ (nơi bài thi nằm) — nộp bài hoặc bấm "Rời phòng thi" mới mở khoá.
     Đây là phần thưởng thật: bằng cấp vô nghĩa nếu đề thi mở được song song
     với trang lý thuyết. Toàn màn hình chỉ là tiện nghi (Esc thoát được), còn
     chốt ở đây mới là thứ chặn. */
  if (id !== "certificate" && Labs.exam?.dangLam()) {
    showToast(t("Đang làm bài thi. Hãy nộp bài hoặc rời phòng thi trước khi sang trang khác."));
    return;
  }
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v === view));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === id));
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (id === "leaderboard") renderLeaderboard();
  if (id === "certificate") {
    Labs.certificate?.render();
    Labs.exam?.render();
  }
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
         những dòng người dùng đã đánh dấu.
     Quy ước: lab khai báo reset() / resetVerdict() rồi nối vào đây. */
  if (id !== "phishing") Labs.phishing?.reset();
  if (id === "siem") Labs.siem?.resetVerdict();

  if (id === "guide") Labs.guide?.refresh();
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
