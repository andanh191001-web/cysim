/* =========================================================
   CySim — sw.js  ·  Service Worker (PWA, chạy ngoài app)

   LÀ GÌ   : Bộ nhớ đệm giúp MỞ ĐƯỢC APP KHI KHÔNG CÒN MẠNG và cài app lên
             màn hình. Chiến lược network-first cho file của chính app: luôn
             ưu tiên bản mới nhất trên máy chủ, chỉ dùng bộ nhớ đệm khi thực sự
             ngoại tuyến — nhờ vậy sửa code xong F5 là thấy thay đổi, không kẹt
             bản cũ. Đường font thì NGƯỢC LẠI (cache-first) vì một file .woff2
             đã tải về là vĩnh viễn giống nhau — từ 30-10-2026 app dùng chữ hệ
             thống nên đường này chỉ còn là hàng rào cho lần thêm font sau này.
   CHẠY     : app.js gọi navigator.serviceWorker.register("sw.js") khi trang nạp
             xong (chỉ khi chạy qua http/https, không chạy bằng file://).
             install -> ghi trước TOÀN BỘ file runtime vào cache; activate ->
             xoá cache của phiên bản cũ; fetch -> thử mạng trước, thành công thì
             ghi lại, thất bại mới đọc cache, cuối cùng mới trả trang
             "Ngoại tuyến". Tên cache ("cysim-<hash>") do CORE sinh ra, không
             phải số tự gõ — thêm hay bớt file là bản cũ tự bị xoá.
             Muốn kiểm chứng: F12 -> Application -> Service Workers -> bật
             Offline rồi tải lại, app phải mở được và thanh "Không có internet"
             (js/app.js) phải hiện.
             Điểm mấu chốt của bản cũ: CORE chỉ liệt kê khung + js/lang/*.json
             nên 15 file phòng lab chỉ vào được nếu đã ghé qua khi còn mạng —
             mất mạng lần đầu là bật ra màn hình trắng. Vì app không có bước
             build, cách chắc nhất là liệt kê hết, và CORE bây giờ liệt kê đủ
             23 file JS: 8 thẻ <script> trong index.html cộng 15 file mà
             js/app.js nạp chậm theo trang. ĐÓ LÀ LÝ DO CORE DÀI HƠN index.html:
             nạp chậm là chậm theo hàng đợi của trang, không được phép biến thành
             "ngoại tuyến thì phòng lab biến mất".
   TOÀN CẦU : không dùng biến toàn cục nào của app — ngữ cảnh Service Worker
             tách riêng. Bỏ qua mọi request khác origin, CHỈ trừ hai máy chủ font
             (fonts.googleapis.com / fonts.gstatic.com). Từ 30-10-2026 app không
             còn nạp chữ từ đó (xem comment ở <head> của index.html), nên đường
             này thường không có traffic; nó ở lại làm hàng rào chứ không phải
             tàn tích: ai đó thêm font web trở lại thì font vẫn được nhớ, còn API
             thì không. API của bên thứ ba (EmailJS, API dịch, tra cứu IP) và máy
             chủ AI trên cổng 8000 hoặc ở một host công khai (Render / Railway /
             VPS) KHÔNG bao giờ được cache — chữ của người dùng không được nằm
             lại trong bộ nhớ đệm. Cùng quy tắc đó áp cho /api/* cùng origin: đó
             là đường rewrite tới máy chủ AI, còn proxy Python của dự án thì nằm
             trên host khác (server/, xem README). Trạng thái "máy chủ có sống
             không" mà bị cache thì lần sau màn hình nói dối.
   ========================================================= */

/* Danh sách PHẢI liệt kê đủ file runtime: khung + style + manifest + icon +
   23 file JS (8 thẻ <script> trong index.html + 15 file js/app.js nạp chậm theo
   trang) + mọi file từ điển mà js/i18n.js fetch lúc đổi ngôn ngữ. */
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icons/icon.svg",
  "./js/utils.js",
  "./js/i18n-curated.js",
  "./js/i18n.js",
  "./js/app.js",
  "./js/auth.js",
  "./js/ai.js",
  "./js/search.js",
  "./js/boot.js",
  "./js/labs/account.js",
  "./js/labs/sqli.js",
  "./js/labs/phishing.js",
  "./js/labs/ddos.js",
  "./js/labs/password.js",
  "./js/labs/firewall.js",
  "./js/labs/realip.js",
  "./js/labs/antivirus.js",
  "./js/labs/csrf.js",
  "./js/labs/idor.js",
  "./js/labs/xss.js",
  "./js/labs/siem.js",
  "./js/labs/certificate.js",
  "./js/labs/exam.js",
  "./js/labs/guide.js",
  "./js/lang/index.json",
  "./js/lang/reviewed.json",
  "./js/lang/en.json",
  "./js/lang/zh.json",
  "./js/lang/fr.json",
  "./js/lang/es.json",
  "./js/lang/ja.json",
];

/* Hai máy font được phép nhớ. Danh sách tường minh, không phải "mọi thứ tiếng
   TCP" — thêm một API bên thứ ba vào đây là thêm một chỗ dữ liệu người dùng có
   thể bị cache lại. */
const MAY_CACHE = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

/* Số phiên bản cache TỰ SINH từ chính danh sách CORE (hash djb2, 32-bit, viết
   bằng cơ số 36). Trước đây mỗi lần thêm/bớt file phải nhớ sửa tay "cysim-v14"
   — quên là cache cũ nằm lại. Ở đây không có gì để quên: đổi danh sách là đổi
   tên cache, "activate" tự xoá bản cũ.
   Đổi NỘI DUNG file thì không cần bận tâm: chiến lược dưới đây là
   network-first, trình duyệt luôn lấy bản mới từ máy chủ và chỉ đọc cache khi
   thực sự mất mạng. */
const CACHE = "cysim-" + CORE.reduce((h, s) => {
  let x = h;
  for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0;
  return x;
}, 5381).toString(36);

self.addEventListener("install", (event) => {
  /* allSettled chứ KHÔNG phải addAll: addAll là kiểu "một file hỏng là mất
     sạch" — một thẻ <script> mới thêm mà chưa nạp lại index.html, hoặc một
     js/lang/*.json bị lỗi đánh máy tên, là cả bộ nhớ đệm ngoại tuyến biến mất
     mà trên màn hình không có dấu hiệu nào. Ở đây file hỏng chỉ bị ghi tên vào
     log, 34 file còn lại vẫn nằm trong cache. */
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const ketQua = await Promise.allSettled(CORE.map((u) => cache.add(u)));
      const hong = ketQua
        .map((k, i) => (k.status === "rejected" ? CORE[i] : ""))
        .filter(Boolean);
      if (hong.length) console.warn("[sw] không nhớ được", hong.length + " file:", hong.join(", "));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Font: cache-first + làm mới ngầm. Ngược với phần của app vì hai lý do —
   một file .woff2 đã tải về thì vĩnh viễn giống nhau, và mỗi lần vào mạng là
   một lượt chờ thêm cho tới khi máy kịp hiện chữ. */
async function fontBoNho(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const luu = async (res) => {
    /* Response opaque (status 0) là chuyện bình thường với request no-cors của
       <link stylesheet> và <img font>: không đọc được nội dung nhưng vẫn cất
       được, mà cất được mới là mục tiêu ở đây. */
    try {
      if (res && (res.ok || res.type === "opaque")) await cache.put(request, res.clone());
    } catch {
      // cache.put từ chối một vài loại response: bỏ qua, chữ vẫn hiện được
    }
    return res;
  };
  if (hit) {
    fetch(request)
      .then(luu)
      .catch(() => undefined);
    return hit;
  }
  return fetch(request).then(luu);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    /* API của bên thứ ba (EmailJS, API dịch, tra cứu IP) và máy chủ AI
       127.0.0.1:8000: trả lời sớm để trình duyệt tự xử, cache không được phép
       giữ hộ một request mang chữ của người dùng. */
    if (!MAY_CACHE.has(url.hostname)) return;
    event.respondWith(fontBoNho(request));
    return;
  }

  /* /api/* trên CHÍNH origin này là máy chủ AI (Netlify Function ở cùng domain với
     app — xem netlify.toml), không phải file của app. Để nó đi qua luồng
     network-first bên dưới thì một lượt GET /api/health thành công bị ghi vào
     cache, và lần mất mạng sau đó đọc lại bản cũ: màn hình báo "sẵn sàng" trong
     khi máy chủ AI đã chết. Same-origin không có nghĩa là an toàn để cache — nội
     dung này là trạng thái của một máy chủ, không phải một tài nguyên tĩnh. */
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    /* "reload" là vì một cái bẫy đã làm người dùng hiểu lầm hai lần: mạng-first
       mà để nguyên request thì lượt fetch này vẫn đi qua BỘ NHỚ ĐỆM HTTP của
       trình duyệt. Server tĩnh (python -m http.server, và mọi host không gửi
       Cache-Control) chỉ trả Last-Modified, nên Chrome tự tính tuổi cho phép =
       10% thời gian kể từ lần sửa file — một file sửa từ hôm qua có thể được
       coi là còn tươi suốt nhiều giờ. Kết quả: sửa style.css xong, người dùng
       mở app vẫn thấy vòng quét quay nhanh và báo "đã sửa mà không ăn". Ở đây
       không có build step, không có tên file đổi theo nội dung, nên cái giá của
       một bản cũ là người học thấy một app khác với cái ta vừa sửa. Cache
       Storage vẫn là lối lùi khi mất mạng (nhánh catch bên dưới) — chỉ là nó
       không còn được phép chắn đường mạng khi mạng đang có. */
    fetch(request, { cache: "reload" })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return new Response("Ngoại tuyến — không tìm thấy " + url.pathname, {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
