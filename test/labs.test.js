#!/usr/bin/env node
/* =========================================================
   CySim — test/labs.test.js  ·  kiểm thử LOGIC THUẦN của bốn phòng lab

   LÀ GÌ   : Gọi thẳng phần toán/phân loại/luật của js/labs/password.js,
             js/labs/sqli.js, js/labs/csrf.js, js/labs/idor.js — đúng cái phần
             in ra lời khuyên và kết luận trên màn hình — bằng dữ liệu CỐ ĐỊNH,
             không trình duyệt, không mạng. Lý do tồn tại: nhãn "Rất mạnh"/"Yếu",
             số bit entropy, "payload này có thật sự đổi nghĩa câu SQL không",
             "SameSite nào chặn được cửa nào", "chế độ phân quyền nào còn lộ hồ
             sơ" là những câu mà người học TIN, nhưng mắt người soát code không
             chứng minh được chúng.
   CHẠY    : node test/labs.test.js
             Máy không cài node thì dùng đúng binary của Qoder:
             ELECTRON_RUN_AS_NODE=1 "<duong-dan-Qoder.exe>" test/labs.test.js
             Exit 0 = tất cả đạt; khác 0 = in từng dòng FAIL.
             `python tools/check_i18n.py --ci` tự chạy file này ở khối [3/5].
   CHẠM TỚI : đọc js/utils.js, js/labs/{password,sqli,csrf,idor}.js (vm, không
             eval chuỗi do người dùng gõ). Cần từ chính file nguồn: $(),
             CyUtil.esc, t(), complete(), Labs. Không ghi file nào.
   GHI CHÚ  : Bốn lab là IIFE nên hàm nội bộ nằm ngoài tầm với; chúng đăng ký
             Labs.<lab>.pure chính cho file này. Vì vậy test cũng chốt luôn việc
             bốn cái mốc đó còn tồn tại — ai gỡ `pure` ra thì test đỏ, chứ không
             im lặng chạy thiếu.
             utils.js được nạp TRƯỚC để CyUtil là bản thật: kiểm thử một hàm chấm
             điểm bằng bản giả CyUtil thì kết luận vô giá trị.
             Phần bảng chân lý CSRF/IDOR chạy LIỆT KÊ TOÀN BỘ tổ hợp cấu hình
             (24 × 3 cửa, 4 × 2 × 6 ID) chứ không chấm vài ca mẫu: một luật bị
             thủng ở đúng một tổ hợp là một màn hình nói dối người học.
   ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = ["js/utils.js", "js/labs/password.js", "js/labs/sqli.js", "js/labs/csrf.js", "js/labs/idor.js"]
  .map((rel) => path.join(__dirname, "..", rel));

/* ---------- stub môi trường: tối thiểu để file nguồn NẠP được ---------- */
const nodeStub = () => ({
  addEventListener() {},
  append() {},
  replaceChildren() {},
  querySelectorAll() { return []; },
  querySelector() { return null },
  setAttribute() {},
  style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  dataset: {},
  textContent: "",
  innerHTML: "",
  value: "",
  children: [],
  hidden: false,
});

function makeContext() {
  const noop = () => {};
  const ctx = {
    console,
    document: Object.assign(nodeStub(), {
      getElementById: () => nodeStub(),
      createElement: () => nodeStub(),
      querySelectorAll: () => [],
      activeElement: null,
      body: nodeStub(),
      documentElement: nodeStub(),
    }),
    window: Object.assign(nodeStub(), { innerWidth: 1280, matchMedia: () => ({ matches: false, addEventListener: noop }) }),
    navigator: { userAgent: "test" },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
    requestAnimationFrame: noop,
    /* utils.js tạo `new TextEncoder()` ngay lúc nạp, và Node không đặt nó vào
       môi trường vm — thiếu hai tên này thì file nguồn chết trước khi test kịp
       chạy. crypto đưa vào để các hàm băm trong utils.js có đường gọi thật. */
    TextEncoder, TextDecoder, crypto,
    /* t() trả lại đúng chuỗi gốc: test đọc giá trị THÔ, không đọc nhãn đã dịch,
       nên bản dịch có đổi câu chữ thì các ca dưới đây vẫn chạy đúng. */
    t: (s) => s,
    showToast: noop,
    currentLang: "vi",
    complete: noop,
    Labs: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of SRC) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: path.basename(f) });
  return ctx;
}

/* ---------- khung kiểm thử tí hon ---------- */
let failed = 0, passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? "  -> " + detail : "")); }
}

/* ---------- vào việc ---------- */
const ctx = makeContext();
const pwd = ctx.Labs.password && ctx.Labs.password.pure;
const sqli = ctx.Labs.sqli && ctx.Labs.sqli.pure;
const csrf = ctx.Labs.csrf && ctx.Labs.csrf.pure;
const idor = ctx.Labs.idor && ctx.Labs.idor.pure;

console.log("test/labs.test.js — logic thuần của phòng lab Mật khẩu + SQLi + CSRF + IDOR");

check("password.js đăng ký Labs.password.pure (estimate/charsetSize/isRepeating/isRun/LABELS)",
  !!pwd && ["estimate", "charsetSize", "isRepeating", "isRun"].every((k) => typeof pwd[k] === "function") && Array.isArray(pwd.LABELS),
  JSON.stringify(pwd && Object.keys(pwd)));
check("sqli.js đăng ký Labs.sqli.pure.classify", !!sqli && typeof sqli.classify === "function");
check("csrf.js đăng ký Labs.csrf.pure (quyDinhTrinhDuyet/quyetDinhServer/phanTich/baCua/chanCaBa)",
  !!csrf && ["quyDinhTrinhDuyet", "quyetDinhServer", "phanTich", "baCua", "chanCaBa"].every((k) => typeof csrf[k] === "function"),
  JSON.stringify(csrf && Object.keys(csrf)));
check("idor.js đăng ký Labs.idor.pure (quyetDinh/quet/khongRoRi/DANH_SACH_ID)",
  !!idor && ["quyetDinh", "quet", "khongRoRi"].every((k) => typeof idor[k] === "function") && Array.isArray(idor.DANH_SACH_ID),
  JSON.stringify(idor && Object.keys(idor)));
if (!pwd || !sqli || !csrf || !idor) {
  console.log("\nKHÔNG CHẠY ĐƯỢC: thiếu một trong bốn mốc Labs.<lab>.pure.");
  process.exit(1);
}

const est = (p) => pwd.estimate(p);

/* ===== A. Mật khẩu: kích thước bảng ký tự (mẫu số của mọi con số entropy) ===== */
check("charsetSize('abcdef') = 26 (chữ thường)", pwd.charsetSize("abcdef") === 26, pwd.charsetSize("abcdef"));
check("charsetSize('abcD') = 52 (thường + hoa)", pwd.charsetSize("abcD") === 52, pwd.charsetSize("abcD"));
check("charsetSize('abc1') = 36 (thường + số)", pwd.charsetSize("abc1") === 36, pwd.charsetSize("abc1"));
check("charsetSize('a1B!') = 95 (bốn nhóm)", pwd.charsetSize("a1B!") === 95, pwd.charsetSize("a1B!"));
check("charsetSize('') = 0 (rỗng không được tính có nhóm nào)", pwd.charsetSize("") === 0);
check("charsetSize tiếng Việt có dấu: dấu coi là ký tự_special (nhóm >95?)",
  pwd.charsetSize("à") > 0, "=> " + pwd.charsetSize("à"));

/* ===== B. Mật khẩu: hai hình thái bị giảm bậc ===== */
check("isRepeating('aaaa') = true", pwd.isRepeating("aaaa") === true);
check("isRepeating('aaaaab') = false", pwd.isRepeating("aaaaab") === false);
check("isRepeating('😀😀') = true (cờ /u — bản thiếu cờ bỏ lọt)", pwd.isRepeating("😀😀") === true);
check("isRun('abcdef') = true (chuỗi alphabet)", pwd.isRun("abcdef") === true);
check("isRun('qwerty') = true (chuỗi bàn phím)", pwd.isRun("qwerty") === true);
check("isRun('456789') = true (chuỗi số)", pwd.isRun("456789") === true);
check("isRun('AXBYCZ') = false (lẫn lộn không phải sequence)", pwd.isRun("AXBYCZ") === false);

/* ===== C. Mật khẩu: danh sách rò rỉ thắng mọi công thức ===== */
check("estimate('') = null (không bịa điểm cho ô trống)", est("") === null);
check("estimate('123456') khớp hạng 1 trong danh sách rò rỉ",
  est("123456").reason === "common" && est("123456").guesses === 1, JSON.stringify(est("123456")));
check("estimate('PASSWORD') vẫn nhận ra (so sánh không phân biệt hoa thường)",
  est("PASSWORD").reason === "common");
check("danh sách rò rỉ đúng 41 mục như chú thích đầu file ghi",
  pwd.commonCount === 41, pwd.commonCount);
check("mật khẩu thường bị xếp hạng thấp hơn mật khẩu khoẻ cùng kiểu",
  est("Tr3s!anDom").guesses > est("password").guesses);

/* ===== D. Mật khẩu: entropy tăng theo độ dài, không tràn số ===== */
const b12 = est("Xk9!mQ2&vL4a").bits, b16 = est("Xk9!mQ2&vL4aZ7%W").bits;
check("16 ký tự giàu entropy hơn 12 ký tự cùng bảng ký", b16 > b12, b12.toFixed(1) + " -> " + b16.toFixed(1));
check("bits hữu hạn ở mật khẩu 64 ký tự (không NaN/Infinity)",
  Number.isFinite(est("a9Q!".repeat(16)).bits), est("a9Q!".repeat(16)).bits);
check("mật khẩu lặp bị trừ entropy so với chuỗi ngẫu nhiên cùng độ dài",
  est("aaaaaaaaaaaa").bits < est("Xk9!mQ2&vL4a").bits);
check("sequence 'abcdefghijkl' bị trừ entropy so với chuỗi ngẫu nhiên",
  est("abcdefghijkl").bits < est("Xk9!mQ2&vL4a").bits);
check("dưới 8 ký tự chịu phạt (bits thấp hơn công thức thuần)",
  est("Ab1!x").bits < 5 * Math.log2(95));
check("LABELS có 5 mức và mức cuối là 'Rất mạnh' (đủ 5 tiêu chí mới tới được)",
  pwd.LABELS.length === 5 && pwd.LABELS[4] === "Rất mạnh" && pwd.LABELS[0] === "Rất yếu",
  pwd.LABELS.join(" | "));

/* ===== E. SQLi: cái lõi của bài học — dấu nháy phải THOÁT trước ===== */
const C = (p) => sqli.classify(p);
check("'UNION SELECT' trần (không đóng nháy) chỉ là chuỗi so sánh -> literal",
  C("UNION SELECT 1,2,3") === "literal", C("UNION SELECT 1,2,3"));
check("'order by 3' trần -> literal (chưa đổi nghĩa câu truy vấn)",
  C("order by 3") === "literal", C("order by 3"));
check("'hello world' -> inert (không có gì liên quan cú pháp)", C("hello world") === "inert");
check("chuỗi rỗng -> inert", C("") === "inert");

check("' OR '1'='1 (payload nút bấm 1) -> auth", C("' OR '1'='1") === "auth", C("' OR '1'='1"));
check("admin' -- -> auth (comment giết phần kiểm tra mật khẩu)", C("admin' --") === "auth");
check("admin'-- -> auth (không cần khoảng trắng)", C("admin'--") === "auth");
check("admin' # -> auth", C("admin' #") === "auth");
check("admin' /* -> auth", C("admin' /*") === "auth");
check("admin' or 1=1 -- -> auth", C("admin' or 1=1 --") === "auth");
check("' UNION SELECT id, username, password FROM users -- (nút bấm 2) -> union",
  C("' UNION SELECT id, username, password FROM users --") === "union");
check("1' ORDER BY 1 -- (nút bấm 3) -> orderby", C("1' ORDER BY 1 --") === "orderby");
check("bất kể hoa thường: a' union sElEcT 1 -> union", C("a' union sElEcT 1") === "union");

/* ===== F. SQLi: những ca bản cũ (chỉ tìm substring) báo sai ===== */
check("một escape hợp lệ ' ' -> không đổi nghĩa (broken, không phải union)",
  C("it''s fine") === "broken", C("it''s fine"));
check("payload sau comment KHÔNG còn hiệu lực: a' -- UNION SELECT 1 -> auth chứ không union",
  C("a' -- UNION SELECT 1") === "auth", C("a' -- UNION SELECT 1"));
check("đóng nháy rồi gõ chữ thường -> broken (học viên không được thưởng cho cú pháp chết)",
  C("a'zzz") === "broken", C("a'zzz"));
check("' OR (không có vế so sánh) -> broken", C("' OR") === "broken", C("' OR"));
check("dấu nháy chưa đóng + UNION phía trước -> union xét theo tail",
  C("' UNION SELECT x' WHERE 1=1") === "union", C("' UNION SELECT x' WHERE 1=1"));

/* ===== G. CyUtil.esc: chính hai phòng lab SQLi/XSS dùng nó để tự bảo vệ ===== */
/* CyUtil là `const` cấp cao nhất của utils.js — cùng kiểu "global lexical scope"
   khiến Labs không nằm trên window trong trình duyệt. Trong vm nó cũng KHÔNG phải
   property của ctx, nên phải hỏi bằng runInContext chứ không đọc ctx.CyUtil. */
const escOf = (s) => vm.runInContext("CyUtil.esc(" + JSON.stringify(s) + ")", ctx);
check("esc() trung hoà <script> (lab dạy XSS không tự nhiễm XSS)",
  escOf("<script>alert(1)</script>").indexOf("<") === -1, escOf("<script>alert(1)</script>"));
check("esc() giữ nguyên chữ thường (không bẻ nội dung vô hại)", escOf("hello 123") === "hello 123");
check("esc() trung hoà dấu nháy đơn (chuỗi tiêm mã vào câu SQL trên màn hình)",
  escOf("'.or'1'='1").indexOf("'") === -1, escOf("'.or'1'='1"));

/* ===== H. CSRF: ba cửa tấn công chạy trên luật trình duyệt, không trên kịch bản ===== */
const CH = (sameSite, secure, coToken, coOrigin) => ({ sameSite, secure, coToken, coOrigin });
const P = csrf.phanTich;
const cua = (c, t) => P(c, t);

check("SameSite=Strict chặn cả ba cửa, kể cả khi máy chủ không phòng thủ gì",
  csrf.chanCaBa(CH("Strict", false, false, false)) === true);
check("form POST cross-site với Strict: cookie không đi, máy chủ trả 401",
  cua(CH("Strict", true, false, false), "form").lyDoCookie === "strict" &&
  cua(CH("Strict", true, false, false), "form").ma === 401);
check("link GET với Strict cũng vô hiệu (Strict không phân biệt navigation)",
  cua(CH("Strict", true, false, false), "link").cookieDi === false);

/* Lax là chỗ dễ nói sai nhất: nó chặn form POST nhưng THA cho navigation GET. */
check("SameSite=Lax: form POST bị giữ cookie",
  cua(CH("Lax", true, false, false), "form").lyDoCookie === "lax_keo_theo_post");
check("SameSite=Lax: link GET là top-level navigation GET -> cookie ĐI và giao dịch chạy",
  cua(CH("Lax", true, false, false), "link").thanhCong === true,
  JSON.stringify(cua(CH("Lax", true, false, false), "link")));
check("Lax một mình KHÔNG phải phòng thủ: ba cửa vẫn còn một cửa sống",
  csrf.chanCaBa(CH("Lax", true, false, false)) === false);

/* SameSite=None: phải có Secure, và khi có đủ thì cookie luôn đi. */
check("None mà thiếu Secure: cookie chưa từng được lưu -> cả ba cửa chết",
  csrf.chanCaBa(CH("None", false, false, false)) === true &&
  P(CH("None", false, false, false), "form").lyDoCookie === "none_thieu_secure");
check("None + Secure, máy chủ trần: form và link ăn, fetch chết vì preflight",
  P(CH("None", true, false, false), "form").thanhCong === true &&
  P(CH("None", true, false, false), "link").thanhCong === true &&
  P(CH("None", true, false, false), "fetch").lyDoCookie === "preflight" &&
  P(CH("None", true, false, false), "fetch").thanhCong === false);

/* Hai lớp phòng thủ phía máy chủ. */
check("CSRF token chặn được cả cửa mà cookie vẫn đi (None+Secure)",
  P(CH("None", true, true, false), "form").ma === 403 &&
  P(CH("None", true, true, false), "form").lyDo === "thieu_token" &&
  csrf.chanCaBa(CH("None", true, true, false)) === true);
check("Kiểm tra Origin là lớp độc lập: không token vẫn chặn",
  P(CH("None", true, false, true), "form").lyDo === "sai_origin" &&
  csrf.chanCaBa(CH("None", true, false, true)) === true);
check("Không có cookie thì server trả 401 TRƯỚC KỊP hỏi token (token không cứu nổi request vô danh)",
  csrf.quyetDinhServer(false, true, true).ma === 401 &&
  csrf.quyetDinhServer(false, true, true).lyDo === "khong_phien");
check("Token được ưu tiên xem trước Origin (hai lỗi cùng lúc thì báo một cách ổn định)",
  csrf.quyetDinhServer(true, true, true).lyDo === "thieu_token");

/* Liệt kê toàn bộ 24 cấu hình × 3 cửa: bất biến phải giữ ở MỌI tổ hợp. */
let csrfLoi = [], csrfAn = 0;
for (const sameSite of ["Strict", "Lax", "None"]) {
  for (const secure of [false, true]) {
    for (const coToken of [false, true]) {
      for (const coOrigin of [false, true]) {
        const c = CH(sameSite, secure, coToken, coOrigin);
        for (const r of csrf.baCua(c)) {
          if (r.thanhCong !== (r.ma === 200)) csrfLoi.push(`${sameSite}/${r.cua}: thanhCong khop ma`);
          if (r.thanhCong && !r.cookieDi) csrfLoi.push(`${sameSite}/${r.cua}: an ma khong co cookie`);
          if (r.thanhCong && (coToken || coOrigin)) csrfLoi.push(`${sameSite}/${r.cua}: an du may chu co phong thu`);
          if (r.thanhCong && sameSite === "Strict") csrfLoi.push(`Strict/${r.cua}: Strict ma van an`);
          if (r.thanhCong && sameSite === "None" && !secure) csrfLoi.push(`None-khong-Secure/${r.cua}`);
          if (r.thanhCong && r.cua === "fetch") csrfLoi.push(`fetch/${sameSite}: preflight phai chan`);
          if (r.thanhCong) csrfAn++;
        }
      }
    }
  }
}
check("24 cấu hình × 3 cửa = 72 phân tích: không có kết luận nào tự mâu thuẫn",
  csrfLoi.length === 0, csrfLoi.slice(0, 4).join(" | "));
check("Chỉ đúng 4 cửa ăn được trên toàn bảng: Lax+link × 2 giá trị Secure, None+Secure+{form,link}",
  csrfAn === 4, "=> " + csrfAn);

/* ===== I. IDOR: đã đăng nhập KHÔNG phải đã có quyền ===== */
const DC = (mode, dangNhap) => ({ mode, dangNhap });
const Q = idor.quyetDinh;

check("mode khong: đọc hồ sơ admin 200 ngay cả khi CHƯA đăng nhập",
  Q(DC("khong", false), 5).ma === 200 && Q(DC("khong", false), 5).roRi === true);
check("mode dangnhap + chưa đăng nhập -> 401 (lớp kiểm tra duy nhất đã làm việc)",
  Q(DC("dangnhap", false), 5).ma === 401 && Q(DC("dangnhap", false), 5).lyDo === "khong_phien");
check("mode dangnhap + ĐÃ đăng nhập -> vẫn 200 trên hồ sơ người khác: đó là định nghĩa IDOR",
  Q(DC("dangnhap", true), 5).ma === 200 && Q(DC("dangnhap", true), 5).roRi === true &&
  idor.khongRoRi(DC("dangnhap", true)) === false);
check("mode chuSoHuu: hồ sơ của mình (id 2) 200, hồ sơ người khác 403, quét sạch không lộ",
  Q(DC("chuSoHuu", true), 2).ma === 200 && Q(DC("chuSoHuu", true), 2).roRi === false &&
  Q(DC("chuSoHuu", true), 5).ma === 403 && idor.khongRoRi(DC("chuSoHuu", true)) === true);
check("mode vaiTro với vai User: không đọc được hồ sơ người khác",
  Q(DC("vaiTro", true), 5).ma === 403 && Q(DC("vaiTro", true), 5).lyDo === "vai_tro_khong_du" &&
  idor.khongRoRi(DC("vaiTro", true)) === true);
check("ID không tồn tại (6) trả 404 chứ không phải 200 rỗng, ở cả bốn chế độ đã đăng nhập",
  ["khong", "dangnhap", "chuSoHuu", "vaiTro"].every((m) => Q(DC(m, true), 6).ma === 404),
  JSON.stringify(["khong", "dangnhap", "chuSoHuu", "vaiTro"].map((m) => Q(DC(m, true), 6).ma)));
check("ID rác (abc, '', -1) không làm nổ máy chủ giả: 404 hoặc 401, không bao giờ 200",
  ["abc", "", "-1", "2a", "Infinity"].every((x) => {
    const r = Q(DC("chuSoHuu", true), x);
    return r.ma !== 200 && Number.isInteger(r.ma);
  }));
check("quet() trả đúng sáu hàng, id 1..6 theo đúng DANH_SACH_ID",
  idor.quet(DC("khong", true)).map((r) => r.id).join() === "1,2,3,4,5,6");
check("hai chế độ hở lộ đúng 4 hồ sơ người khác (id 1,3,4,5), hai chế độ kín lộ 0",
  idor.quet(DC("khong", true)).filter((r) => r.roRi).length === 4 &&
  idor.quet(DC("dangnhap", true)).filter((r) => r.roRi).length === 4 &&
  idor.quet(DC("chuSoHuu", true)).filter((r) => r.roRi).length === 0 &&
  idor.quet(DC("vaiTro", true)).filter((r) => r.roRi).length === 0);

let idorLoi = [];
for (const mode of ["khong", "dangnhap", "chuSoHuu", "vaiTro"]) {
  for (const dangNhap of [false, true]) {
    const c = DC(mode, dangNhap);
    for (const r of idor.quet(c)) {
      if (r.roRi && r.ma !== 200) idorLoi.push(`${mode}/${r.id}: roRi ma khong 200`);
      if (r.roRi && r.id === 2) idorLoi.push(`${mode}/${r.id}: ho so cua minh ma ghi la lo`);
      if (!dangNhap && mode !== "khong" && r.ma === 200) idorLoi.push(`${mode}/${r.id}: 200 khong can phien`);
      if ([200, 401, 403, 404].indexOf(r.ma) === -1) idorLoi.push(`${mode}/${r.id}: ma ${r.ma} ngoai boi so doi`);
    }
  }
}
check("48 phiên quét (4 chế độ × 2 trạng thái đăng nhập × 6 ID): không hàng nào tự mâu thuẫn",
  idorLoi.length === 0, idorLoi.slice(0, 4).join(" | "));

console.log("\n%d đạt, %d lỗi", passed, failed);
process.exit(failed ? 1 : 0);
