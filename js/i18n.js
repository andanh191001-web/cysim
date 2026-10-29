/* =========================================================
   CySim — i18n.js  ·  máy dịch + máy áp dụng bản dịch

   LÀ GÌ   : Bộ máy "Tiếng Việt là nguồn duy nhất". Nó dịch mọi chữ trên
             giao diện mà KHÔNG cần ai viết từ điển trong JS, rồi thay chữ
             đó vào text node / thuộc tính của trang đang hiển thị.

   CHẠY     : initI18n() chạy ngay khi nạp: vẽ danh sách ngôn ngữ vào
             #langSelect, nạp js/lang/<mã>.json nếu đang chọn ngoại ngữ.
             Người dùng đổi ngôn ngữ -> applyLanguage(): renderDocument() đi
             hết cây DOM thay chữ, watchDom() bật MutationObserver để chữ do
             JS sinh sau (kết quả lab, toast) cũng được dịch. Chuỗi nào cả 3
             tầng đầu đều trắng -> requestTranslation() xếp hàng gọi API dịch
             miễn phí, kết quả lưu localStorage nên chỉ dịch một lần — và chỉ
             được lưu qua storeMachine(), cửa duy nhất từ chối bản rác.
             Chế độ báo lỗi: chữ sai trên màn hình bấm vào là openFixBox() vẽ ô
             sửa NGAY TRONG TRANG (không phải window.prompt — iframe có sandbox
             chặn hộp đó im lặng), bản sửa rơi vào tầng OVERRIDE và file tải về.

   TOÀN CẦU : định nghĩa t(), setText(), currentLang, LABEL_LOCALE, LANG_NAMES,
             I18nAdmin (langs/label/coverage/collectSources/translateAll/
             reportCount/listReports cho trang Hướng dẫn). Đọc CyUtil,
             EN_DICT_CURATED (js/i18n-curated.js nạp trước). Phát sự kiện
             "cysim:language" để app.js và các lab vẽ lại phần chữ tự sinh.

   Tiếng Việt là nguồn duy nhất. Mọi ngôn ngữ khác được lấy theo
   5 tầng, không cần ai tự tay gõ chuỗi dịch trong JS:

     0. OVERRIDE — bản sửa do người dùng báo lỗi ngay trên giao diện
     1. REVIEWED — js/lang/<mã>.json: phần đã được người thật kiểm chứng
                   (tools/translation_review.json + từ điển viết tay bên dưới)
     2. BUNDLED  — cũng file đó, nhưng là phần máy dịch, chưa ai xem lại
     3. CACHE    — localStorage, tích luỹ từ tầng 5
     4. MACHINE  — gọi API dịch miễn phí ngay trên trình duyệt khi thiếu

   Tầng 4 chỉ chạy khi 3 tầng đầu không có kết quả, và mỗi chuỗi chỉ
   phải dịch một lần vì kết quả được lưu vĩnh viễn vào localStorage.

   Vì sao phải tách "đã kiểm chứng" / "máy dịch": dịch máy từng dòng làm hỏng
   ngữ cảnh ("Phòng vệ" -> "Restroom out of order", "Mạnh" -> "Manh"). Chuỗi
   ngắn nay nằm trong tools/translation_review.json, và js/lang/index.json cho
   biết mỗi ngôn ngữ có bao nhiêu % là người thật duyệt — giao diện phải nói
   đúng con số đó, không được khoe 100%.
   ========================================================= */

const LANG_NAMES = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文 (简体)",
  fr: "Français",
  es: "Español",
  ja: "日本語",
};

// zh phải ghi rõ "Hán giản thể" để API không trả về chữ Hán phồn thể
const LANG_API_TARGET = { en: "en", zh: "zh-CN", fr: "fr", es: "es", ja: "ja" };
const TRANSLATABLE = Object.keys(LANG_API_TARGET);

/* Locale cho Intl/toLocaleDateString: ngày tháng trên chứng chỉ phải theo
   đúng thứ tiếng đang hiển thị, không kẹt "vi-VN" mãi. */
const LABEL_LOCALE = { vi: "vi-VN", en: "en-GB", zh: "zh-CN", fr: "fr-FR", es: "es-ES", ja: "ja-JP" };

const normalize = (text) => text.replace(/\s+/g, " ").trim();

/* Từ điển viết tay được người soạn gõ theo từng mảnh câu nên có khoá thừa
   khoảng trắng, ví dụ " (giả đuôi).". lookup() luôn chuẩn hoá khoá trước khi
   tìm, vì vậy phải chuẩn hoá cả kho một lần lúc nạp — nếu không những khoá
   đó mãi mãi không chạm tới được. */
function normalizeKeys(dict) {
  const out = {};
  for (const [key, value] of Object.entries(dict || {})) {
    const k = normalize(key);
    if (k) out[k] = value;
  }
  return out;
}

/* Bản sửa của người dùng (chế độ "Báo lỗi bản dịch"). Đặt trên mọi tầng khác
   để tác giả thấy ngay kết quả sửa trước khi chép vào translation_review.json. */
const OVERRIDE_KEY = "cysim-i18n-overrides";
let overrides = CyUtil.readJson(localStorage, OVERRIDE_KEY, {}) || {};

const CURATED = { en: normalizeKeys(EN_DICT_CURATED) };
const BUNDLED = {};
const RUNTIME = {};
const CACHE_KEY = (lang) => "cysim-i18n-cache:" + lang;

for (const lang of TRANSLATABLE) RUNTIME[lang] = CyUtil.readJson(localStorage, CACHE_KEY(lang), {}) || {};

function layerFor(lang, key) {
  if (overrides[lang]?.[key]) return { value: overrides[lang][key], layer: "fix" };
  const curated = CURATED[lang];
  if (curated && curated[key]) return { value: curated[key], layer: "review" };
  const bundled = BUNDLED[lang];
  if (bundled && bundled[key]) return { value: bundled[key], layer: bundled[key] === key ? "code" : "machine" };
  const runtime = RUNTIME[lang];
  if (runtime && runtime[key]) return { value: runtime[key], layer: "machine" };
  return null;
}

/* Chuỗi đích đã biết của mỗi ngôn ngữ. Nhờ tập hợp này, văn bản đã được
   dịch sẽ không bị gửi đi dịch ngược lại lần nữa. */
const knownTargets = new Map();
/* allTargets gộp bản đích của MỌI ngôn ngữ: JS tự viết nhãn đã dịch bằng t()
   (cấp bậc, "Đang quét...", kết quả lab...), nên khi đổi từ zh sang fr bộ
   duyệt sẽ nhìn thấy chữ Hán và tưởng đó là chuỗi gốc tiếng Việt. */
const allTargets = new Set();
/* Bản dịch -> chuỗi tiếng Việt gốc. weak map sourceOf chỉ nhớ những node đã
   TỒN TẠI lúc đổi ngôn ngữ; node do lab vẽ sau (bảng SIEM, huy hiệu XP) sinh
   ra khi giao diện đang là tiếng Trung, nên nodeValue của nó là chữ Hán.
   Không có bảng ngược này thì tiếng Trung bị mang đi dịch sang tiếng Pháp —
   chuỗi "Aún más hecho" (sai hoàn toàn) từng nằm trong js cache chính vì thế. */
const reverseSource = new Map();
function indexTargets(lang) {
  let set = knownTargets.get(lang);
  if (!set) knownTargets.set(lang, (set = new Set()));
  for (const layer of [overrides[lang], CURATED[lang], BUNDLED[lang], RUNTIME[lang]]) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) {
      set.add(value);
      allTargets.add(value);
      if (value !== key && !reverseSource.has(value)) reverseSource.set(value, key);
    }
  }
}
for (const lang of TRANSLATABLE) indexTargets(lang);

/* Dấu tiếng Việt. Chuỗi nào không có dấu mà cũng không phải nguồn đã biết thì
   là rác tích lại trong bộ nhớ dịch máy ("0"->"0", chữ Hán -> tiếng Pháp). */
const VI_MARKS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
/* Kana / Hán / Hangul: nguồn của ứng dụng là tiếng Việt có dấu, nên ký tự
   thuộc các khối này chứng tỏ khoá là MỘT BẢN DỊCH bị đưa đi dịch tiếp. */
const FOREIGN_SCRIPT = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;

/* Xoá sạch bộ nhớ dịch máy mà các bản code cũ để lại: khoá không có dấu tiếng
   Việt ("0"->"0"), hoặc khoá là chữ Hán/Nhật/Hàn của một bản dịch khác. */
function sanitizeRuntime() {
  let removed = 0;
  for (const lang of TRANSLATABLE) {
    const cache = RUNTIME[lang];
    let dirty = false;
    for (const key of Object.keys(cache)) {
      const vietnameseSource =
        !FOREIGN_SCRIPT.test(key) && (VI_MARKS.test(key) || key in CURATED.en) && !reverseSource.has(key);
      if (vietnameseSource) continue;
      delete cache[key];
      dirty = true;
      removed++;
    }
    if (dirty) CyUtil.writeJson(localStorage, CACHE_KEY(lang), cache);
  }
  return removed;
}
/* Dựng lại bảng tra ngược từ đầu: sau khi xoá rác (hoặc xoá bản sửa tạm) mà
   không dựng lại thì bản dịch của một khoá đã chết vẫn trỏ về khoá chết đó
   suốt cả phiên. */
function reindexAll() {
  knownTargets.clear();
  allTargets.clear();
  reverseSource.clear();
  for (const lang of TRANSLATABLE) indexTargets(lang);
}
sanitizeRuntime();
reindexAll();

/* Một text node có thể mang BẢN DỊCH chứ không phải nguồn: node do lab vẽ ra
   khi giao diện đang là tiếng Trung rồi người dùng chuyển sang tiếng Pháp.
   Tra ngược về tiếng Việt để mọi tầng (lookup, hàng đợi, báo lỗi, coverage)
   luôn làm việc với đúng một khoá. */
function resolveSource(text) {
  const key = normalize(text);
  if (!key) return "";
  return reverseSource.get(key) || key;
}

function lookup(lang, text) {
  const key = normalize(text);
  if (!key) return null;
  const hit = layerFor(lang, key);
  return hit ? hit.value : null;
}

/* ---------- tầng 4: hàng đợi dịch máy ---------- */
const pending = [];
const MAX_PENDING = 400;
let flushTimer = null;
let flushing = false;
let machineDisabledUntil = 0;

function scheduleFlush(delay) {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, delay);
}

/* Chỉ chuỗi VIỆT MỚI đáng gửi đi dịch máy. Nguồn của ứng dụng này là tiếng
   Việt có dấu, còn hash SHA-256, địa chỉ IP, dòng log sqlmap/sshd hay số
   liệu thì không — nếu không lọc, mỗi lần terminal in một dòng là lại xếp
   thêm vài chục khóa vô nghĩa vào hàng đợi.
   Điều kiện "không phải chữ Hán/Nhật/Hàn" chặn nốt lỗi dây chuyền: node sinh
   ra lúc giao diện đang tiếng Trung mà bị mang đi dịch sang tiếng Pháp thì
   ra toàn bản sai, và từ điển của ngôn ngữ nguồn chưa chắc đã nạp để dịch
   ngược về tiếng Việt. */
const worthMachineTranslating = (s) =>
  /\p{L}{2}/u.test(s) &&
  /[^\u0000-\u007F]/.test(s) &&
  !FOREIGN_SCRIPT.test(s) &&
  (VI_MARKS.test(s) || s in CURATED.en);

function requestTranslation(lang, text) {
  if (!LANG_API_TARGET[lang]) return;
  const key = resolveSource(text);
  if (!key || key.length > 400) return;
  if (!worthMachineTranslating(key)) return;
  if (allTargets.has(key)) return; // đây là BẢN DỊCH, không phải nguồn tiếng Việt
  if (knownTargets.get(lang)?.has(key)) return;
  if (pending.length >= MAX_PENDING) return;
  if (pending.some((item) => item.lang === lang && item.text === key)) return;
  pending.push({ lang, text: key });
  scheduleFlush(500);
}

/* Google trả về thẻ nội bộ ("<ph type="structure-only" x="0"/>") khi câu nguồn
   có dấu ngoặc/nhánh. Bản dịch kiểu đó hiển thị lên UI là rác, nên bỏ luôn
   chứ không lưu vào bộ nhớ — tools/gen_translations.py cũng lọc y hệt.
   Phải có \b trước chữ x: không thì "sandbox=\\"" bị nhận nhầm là thẻ rác. */
const ARTIFACT = /<\s*\/?\s*ph\b|<\/ph>|\bx\s*=\s*"/i;
function cleanMachineResult(text) {
  const value = String(text || "").trim();
  if (!value || ARTIFACT.test(value)) return null;
  return value;
}

/* Mỗi lần chỉ dịch một chuỗi: endpoint Google tách/ghép câu theo cách
   không kiểm soát được, gộp nhiều chuỗi sẽ bị lệch vị trí. */
async function machineTranslate(text, lang) {
  if (Date.now() < machineDisabledUntil) return null;
  const target = LANG_API_TARGET[lang];
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx" +
      "&sl=vi&tl=" + encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const out = Array.isArray(data?.[0]) ? data[0].map((seg) => seg?.[0] ?? "").join("") : "";
    const usable = cleanMachineResult(out);
    if (usable) return usable;
    throw new Error(usable === null && out.trim() ? "artifact" : "empty response");
  } catch {
    try {
      const res = await fetch(
        "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) +
        "&langpair=vi|" + encodeURIComponent(target)
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (data.responseStatus !== 200 || !data.responseData?.translatedText) throw new Error("mymemory");
      const alternate = cleanMachineResult(data.responseData.translatedText);
      if (!alternate) throw new Error("artifact");
      return alternate;
    } catch {
      // Cả hai nhà cung cấp đều lỗi -> nghỉ 5 phút để không spam mạng
      machineDisabledUntil = Date.now() + 5 * 60 * 1000;
      return null;
    }
  }
}

/* Cửa duy nhất để một bản dịch máy được ghi nhớ. sanitizeRuntime() chỉ quét
   một lần lúc mở trang, còn rác thì có thể sinh ra SAU đó (một bản dịch bị
   mang đi dịch tiếp, một khoá ghép từ nhiều đoạn...). Chặn ngay chỗ ghi thì
   localStorage không bao giờ nhận khoá rác, không cần đợi lần sau dọn lại. */
function storeMachine(lang, key, value) {
  if (!LANG_API_TARGET[lang] || !value) return false;
  const source = normalize(key);
  if (!source || !worthMachineTranslating(source)) return false;
  if (allTargets.has(source) || knownTargets.get(lang)?.has(source)) return false; // đây là BẢN DỊCH
  RUNTIME[lang][source] = value;
  CyUtil.writeJson(localStorage, CACHE_KEY(lang), RUNTIME[lang]);
  indexTargets(lang);
  return true;
}

async function flushQueue() {
  if (flushing) return;
  // Đang bị nhà cung cấp chặn: hẹn đúng lúc hết thời gian nghỉ rồi mới thử lại,
  // tuyệt đối không quay vòng gọi mạng khi chưa thể dịch.
  if (Date.now() < machineDisabledUntil) {
    scheduleFlush(machineDisabledUntil - Date.now() + 200);
    return;
  }
  if (!pending.length) return;
  flushing = true;
  const batch = pending.splice(0, 10);
  const changed = new Set();
  const failed = [];
  try {
    for (const item of batch) {
      const translated = await machineTranslate(item.text, item.lang);
      if (!translated) {
        failed.push(item);
        continue;
      }
      if (storeMachine(item.lang, item.text, translated)) changed.add(item.lang);
      await CyUtil.sleep(250);
    }
  } finally {
    flushing = false;
    if (failed.length && Date.now() < machineDisabledUntil) pending.unshift(...failed);
    if (changed.has(currentLang)) renderDocument(currentLang);
    if (pending.length) scheduleFlush(600);
  }
}

/* ---------- hàm dành cho chuỗi động trong JS ---------- */
/* Không đi qua resolveSource() ở đây: hàm đó chuẩn hoá khoảng trắng, trong khi
   một số chuỗi ghép động có chủ ý giữ dấu cách đầu/cuối. Chỉ đổi khi văn bản
   đưa vào CHÍNH LÀ một bản dịch đã biết. */
function t(viText) {
  if (currentLang === "vi") return viText;
  const source = reverseSource.get(normalize(viText)) || viText;
  const cached = lookup(currentLang, source);
  if (cached) return cached;
  requestTranslation(currentLang, source);
  return source;
}

/* ---------- áp dụng vào DOM ---------- */
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "OPTION", "NOSCRIPT", "TEXTAREA"]);
const sourceOf = new WeakMap(); // text node -> chuỗi tiếng Việt gốc
const attrSourceOf = new WeakMap();
let currentLang = localStorage.getItem("cysim-lang") || "vi";
let applying = false;

const documentTitleSource = document.title;

function skipTextNode(node) {
  const parent = node.parentElement;
  if (!parent || SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.closest("[data-no-i18n]")) return true;
  return false;
}

/* Node do lab vẽ ra KHI GIAO DIỆN ĐANG LÀ NGÔN NGỮ KHÁC có nodeValue là bản
   dịch, không phải tiếng Việt; sourceOf không phân biệt được. Chỉ khi tra từ
   điển mà không thấy gì mới đi tra ngược — nhờ vậy khoảng trắng đầu/cuối có
   chủ ý của chuỗi thật vẫn được giữ nguyên. */
function baseSourceOf(node, lang) {
  if (!sourceOf.has(node)) sourceOf.set(node, node.nodeValue);
  let source = sourceOf.get(node);
  if (lang !== "vi" && lookup(lang, source) === null) {
    const back = reverseSource.get(normalize(source));
    if (back) {
      sourceOf.set(node, back);
      source = back;
    }
  }
  return source;
}

/* Gán chữ do JS viết vào DOM. Hai việc phải làm CÙNG LÚC:
   - ghi bản dịch của ngôn ngữ đang hiển thị (không ghi chữ tiếng Việt rồi chờ
     bộ quét DOM dịch lại: giữa hai lần đó nút/label hiện tiếng Việt ~100ms, và
     trên màn hình đang là tiếng Anh thì nó nhấp nháy đúng một dòng chữ Việt);
   - ghi NGUỒN tiếng Việt vào sourceOf của text node. Nếu không, node chỉ mang
     bản dịch, engine phải đoán ngược qua reverseSource — đoán được thì đúng,
     còn chuỗi chưa có trong index thì bản dịch bị coi là nguồn mới và dịch đè.
   return bản đã hiển thị để nơi gọi cần ghép chuỗi dùng lại được. */
function setText(el, viText) {
  if (!el) return viText;
  const shown = t(viText);
  if (el.textContent !== shown) el.textContent = shown;
  const node = el.firstChild;
  if (node?.nodeType === Node.TEXT_NODE) sourceOf.set(node, viText);
  return shown;
}

function translateTextNode(node, lang) {
  const source = baseSourceOf(node, lang);
  if (lang === "vi") {
    if (node.nodeValue !== source) node.nodeValue = source;
    return;
  }
  const translated = lookup(lang, source);
  if (translated === null) {
    requestTranslation(lang, source); // giữ nguyên tiếng Việt tới khi có bản dịch
    return;
  }
  const next = source.match(/^\s*/)[0] + translated + source.match(/\s*$/)[0];
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateAttributes(el, lang) {
  let saved = attrSourceOf.get(el);
  if (!saved) {
    saved = {};
    for (const attr of ["placeholder", "title", "aria-label"]) {
      if (el.hasAttribute(attr)) saved[attr] = el.getAttribute(attr);
    }
    attrSourceOf.set(el, saved);
  }
  for (const [attr, raw] of Object.entries(saved)) {
    let source = raw;
    if (lang !== "vi" && lookup(lang, source) === null) {
      source = reverseSource.get(normalize(source)) || source;
    }
    let next = source;
    if (lang !== "vi") {
      const translated = lookup(lang, source);
      if (translated === null) requestTranslation(lang, source);
      else next = translated;
    }
    if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
  }
}

function walkInto(root, lang) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!skipTextNode(root)) translateTextNode(root, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (root.closest("[data-no-i18n]")) return;
  if (SKIP_TAGS.has(root.tagName)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      if (SKIP_TAGS.has(node.tagName) || node.hasAttribute("data-no-i18n")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, lang);
    else if (node.hasAttribute("placeholder") || node.hasAttribute("title") || node.hasAttribute("aria-label")) {
      translateAttributes(node, lang);
    }
  }
}

/* Duyệt toàn bộ body — chỉ gọi khi đổi ngôn ngữ hoặc khi vừa nhận một lô
   bản dịch mới, tuyệt đối không gọi theo từng thay đổi nhỏ của DOM. */
function renderDocument(lang) {
  if (applying) return;
  applying = true;
  try {
    walkInto(document.body, lang);
    // t() chứ không lookup(): tiêu đề nằm trong <head> nên bộ quét HTML tĩnh
    // không thấy, để t() tự xếp hàng dịch một lần rồi vẽ lại.
    const title = t(documentTitleSource);
    if (document.title !== title) document.title = title;
  } finally {
    applying = false;
  }
}

/* ---------- theo dõi DOM: chỉ xử lý nhánh vừa được thêm ---------- */
let domObserver = null;
let dirtyNodes = new Set();

/* Vùng đã đánh dấu data-no-i18n (mọi terminal, toast, lưới IP, log SIEM,
   bảng xếp hạng...) do JS tự dựng và đã dịch bằng t() ngay lúc tạo chuỗi.
   Bỏ qua từ gốc để MutationObserver không phải chạy theo từng dòng log hay
   từng ký tự bộ gõ — trên điện thoại đó là nguồn gây giật rõ nhất. */
function inOptOut(node) {
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !!(el && el.closest("[data-no-i18n]"));
}

const flushDirty = CyUtil.debounce(() => {
  if (applying) return;
  applying = true;
  try {
    for (const node of dirtyNodes) {
      if (node.isConnected) walkInto(node, currentLang);
    }
  } finally {
    dirtyNodes = new Set();
    applying = false;
  }
}, 100);

function watchDom(lang) {
  domObserver?.disconnect();
  domObserver = null;
  dirtyNodes = new Set();
  if (lang === "vi") return; // tiếng Việt là bản gốc, không cần theo dõi
  domObserver = new MutationObserver((records) => {
    if (applying) return;
    for (const record of records) {
      if (record.type === "childList") {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            if (!inOptOut(node)) dirtyNodes.add(node);
          }
        });
      } else if (record.type === "characterData" && !sourceOf.has(record.target) && !inOptOut(record.target)) {
        dirtyNodes.add(record.target);
      }
    }
    if (dirtyNodes.size) flushDirty();
  });
  domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

async function applyLanguage(lang) {
  if (!LANG_NAMES[lang]) lang = "vi";
  currentLang = lang;
  localStorage.setItem("cysim-lang", lang);
  document.documentElement.lang = lang;
  const select = $("langSelect");
  if (select && select.value !== lang) select.value = lang;
  // Phải có từ điển sinh sẵn trước khi vẽ, nếu không mọi chuỗi sẽ bị đẩy vào
  // hàng đợi dịch máy dù file js/lang/<lang>.json đã có sẵn bản dịch.
  await ensureBundled(lang);
  /* provenance() và lớp "review" của báo lỗi cần js/lang/reviewed.json. Nạp
     luôn lúc chuyển ngôn ngữ (ensureReviewed tự khoá, mỗi phiên chỉ tải một
     lần) — nếu không thì chuỗi ĐÃ qua mắt người vẫn bị ghi nhãn "machine". */
  if (lang !== "vi") ensureReviewed();
  renderDocument(lang);
  watchDom(lang);
  // Văn bản do JS sinh ra (cấp bậc, nhãn lab...) không nằm trong DOM tĩnh
  // nên phải vẽ lại theo ngôn ngữ mới.
  document.dispatchEvent(new CustomEvent("cysim:language", { detail: { lang } }));
}

/* ---------- nạp từ điển sinh sẵn (tầng 2) ---------- */
/* lang -> promise của LƯỢT FETCH ĐANG CHẠY, không phải "đã bắt đầu nạp". Đánh
   dấu bằng Set trước khi await (như bản cũ) thì lời gọi thứ hai — applyLanguage
   ở boot và I18nAdmin.ensureBundled ở bảng Hướng dẫn hay giành nhau đúng một
   ngôn ngữ — tưởng đã xong nên trả về ngay: sự kiện "cysim:language" bắn ra
   TRƯỚC khi từ điển về. Mọi vùng data-no-i18n tự vẽ bằng t() (khung chat AI,
   bảng Hướng dẫn) khi đó lấy bản dịch máy cũ trong localStorage và kẹt ở đó,
   vì sự kiện đã bắn xong, không lần nào vẽ lại nữa. */
const bundledJobs = new Map();
function ensureBundled(lang) {
  if (!TRANSLATABLE.includes(lang)) return Promise.resolve(false);
  if (bundledJobs.has(lang)) return bundledJobs.get(lang);
  const job = (async () => {
    try {
      const res = await fetch("js/lang/" + lang + ".json");
      if (!res.ok) return false;
      BUNDLED[lang] = await res.json();
      indexTargets(lang);
      return true;
    } catch {
      return false; // chưa sinh file này — tầng 4 sẽ dịch bù khi cần
    }
  })();
  bundledJobs.set(lang, job);
  job.then((loaded) => {
    if (!loaded) bundledJobs.delete(lang); // lỗi mạng/thiếu file: lần sau còn thử lại
  });
  return job;
}

async function loadBundledDictionaries() {
  const results = await Promise.all(TRANSLATABLE.map(ensureBundled));
  const loaded = TRANSLATABLE.filter((_, i) => results[i]);
  const missing = TRANSLATABLE.filter((l) => !loaded.includes(l));
  if (currentLang !== "vi") {
    renderDocument(currentLang);
    /* Bắt buộc phải bắn lại sự kiện ở đây. renderDocument chỉ đi theo DOM tĩnh;
       còn mọi vùng data-no-i18n (nhãn "Bạn"/"CySim AI" trong khung chat, bảng
       Hướng dẫn, nhãn lab...) do chính JS vẽ bằng t() — mà JS thì đã vẽ xong từ
       lúc các file từ điển còn đang tải. Không có sự kiện này là chúng kẹt mãi
       ở kết quả tra được lúc khởi động: bản dịch máy cũ trong localStorage, hoặc
       nguyên tiếng Việt ngay trên giao diện tiếng Nhật. */
    document.dispatchEvent(new CustomEvent("cysim:language", { detail: { lang: currentLang } }));
  }
  return { loaded, missing };
}

/* ---------- tầng "đã qua mắt người" ---------- */
/* js/lang/reviewed.json do tools/gen_translations.py ghi ra: các tập chuỗi
   mà bản dịch KHÔNG do máy tự sinh. Tách riêng khỏi <lang>.json để file từ
   điển vẫn là dict phẳng đơn giản, và chỉ nạp khi thật cần (báo lỗi, kiểm tra
   chất lượng) — vài chục KB thì không nên tải mỗi lần mở app. */
const reviewedSets = new Map(); // lang -> Set(chuỗi nguồn đã kiểm chứng)
let reviewedFile = null;

async function ensureReviewed() {
  if (reviewedFile) return reviewedFile;
  try {
    const res = await fetch("js/lang/reviewed.json");
    if (!res.ok) return null;
    reviewedFile = await res.json();
    for (const [lang, names] of Object.entries(reviewedFile.langs || {})) {
      const set = new Set();
      for (const name of names) for (const s of reviewedFile.sets?.[name] || []) set.add(s);
      reviewedSets.set(lang, set);
    }
    return reviewedFile;
  } catch {
    return null; // chưa chạy lại tools/gen_translations.py -> coi như chưa biết
  }
}

function isReviewedSource(lang, source) {
  if (lang === "vi") return true;
  if (CURATED[lang]?.[source]) return true; // từ điển viết tay: chắc chắn là người duyệt
  const set = reviewedSets.get(lang);
  if (set) return set.has(source); // đã nạp file -> chỉ tin danh sách đó
  const value = BUNDLED[lang]?.[source];
  return !!value && value === source; // chưa nạp: chuỗi code giữ nguyên thì không cần dịch
}

/* ---------- báo lỗi bản dịch ---------- */
/* Người dùng thấy chữ lạ thì bấm vào, gõ bản đúng. Lưu ở localStorage để
   xuất ra, tác giả chép vào tools/translation_review.json rồi chạy lại tool. */
const REPORTS_KEY = "cysim-i18n-reports";
let reports = CyUtil.readJson(localStorage, REPORTS_KEY, []) || [];
let reportMode = false;

function saveReports() {
  CyUtil.writeJson(localStorage, REPORTS_KEY, reports);
}

function activeViewName() {
  const view = document.querySelector(".view.active");
  return view ? view.id : "unknown";
}

/* Bấm chuột thì `event.target` là PHẦN TỬ, không bao giờ là text node — mà
   nguồn tiếng Việt lại lưu theo text node (sourceOf). Phải lấy đúng node chữ
   dưới con trỏ, nếu không chế độ báo lỗi không bao giờ chạy. */
function textNodeAt(x, y, fallbackEl) {
  const range = document.caretRangeFromPoint?.(x, y);
  if (range?.startContainer?.nodeType === Node.TEXT_NODE) return range.startContainer;
  const pos = document.caretPositionFromPoint?.(x, y);
  if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) return pos.offsetNode;
  for (const child of fallbackEl?.childNodes || []) {
    if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) return child;
  }
  return null;
}

/* Ghi một lượt báo lỗi vào danh sách, và nếu người dùng gõ bản sửa thì áp
   ngay lên giao diện (tầng OVERRIDE) để họ thấy chữ mình sửa có tác dụng. */
function saveReport(source, shown, fix) {
  const entry = {
    source,
    lang: currentLang,
    shown,
    fix: normalize(fix),
    view: activeViewName(),
    layer: layerFor(currentLang, source)?.layer || "missing",
    at: new Date().toISOString(),
  };
  const same = reports.findIndex((r) => r.source === source && r.lang === currentLang);
  if (same >= 0) reports.splice(same, 1, entry);
  else reports.push(entry);
  if (entry.fix) {
    (overrides[currentLang] ||= {})[source] = entry.fix;
    CyUtil.writeJson(localStorage, OVERRIDE_KEY, overrides);
    indexTargets(currentLang);
    renderDocument(currentLang);
  }
  document.dispatchEvent(new CustomEvent("cysim:i18n-report", { detail: entry }));
}

/* ---------- ô sửa bản dịch vẽ trong trang ---------- */
/* Không dùng window.prompt: hộp do trình duyệt vẽ bị chặn hoàn toàn khi trang
   chạy trong iframe có sandbox (không allow-modals) — người dùng bấm vào chữ
   sai mà không thấy gì xảy ra. Ô này là DOM thường, đóng bằng Esc hoặc Huỷ. */
let fixBox = null;

function closeFixBox() {
  if (!fixBox) return;
  const { el, onKey } = fixBox;
  fixBox = null;
  document.removeEventListener("keydown", onKey, true);
  el.remove();
}

function openFixBox(anchor, source, shown, onSubmit) {
  closeFixBox();
  const box = document.createElement("div");
  box.className = "fix-box";
  // data-report-ui: báo cho reportClick biết đừng coi chính ô này là chữ để
  // báo lỗi (nếu không, người dùng bấm trong ô lại bị hỏi sửa nhãn của ô).
  box.setAttribute("data-report-ui", "");
  // data-no-i18n: nhãn trong ô đã hiện đúng ngôn ngữ nhờ t() lúc dựng, để
  // engine dịch đè lên bản dịch thì lại rơi vào đúng lỗi vừa sửa ở trên.
  box.setAttribute("data-no-i18n", "");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", t("Báo lỗi bản dịch"));

  const info = document.createElement("p");
  info.textContent =
    t("Chuỗi gốc") + ": " + source + "\n" + t("Bản dịch đang hiển thị") + ": " + shown;
  const input = document.createElement("input");
  input.type = "text";
  input.value = shown === source ? "" : shown;
  input.placeholder = t("Gõ bản dịch đúng (bỏ trống = chỉ báo lỗi, không sửa):");
  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn sm";
  save.textContent = t("Lưu");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn ghost sm";
  cancel.textContent = t("Huỷ");
  const actions = document.createElement("div");
  actions.className = "fix-box-actions";
  actions.append(save, cancel);
  box.append(info, input, actions);

  const submit = () => {
    const value = input.value;
    closeFixBox();
    onSubmit(value);
  };
  save.addEventListener("click", submit);
  cancel.addEventListener("click", closeFixBox);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });
  const onKey = (e) => {
    if (e.key === "Escape") closeFixBox();
  };

  document.body.append(box);
  const r = anchor?.getBoundingClientRect();
  const x = (r ? r.left : 16) + window.scrollX;
  const y = (r ? r.bottom + 6 : 16) + window.scrollY;
  // Ô không được rơi ra ngoài vùng đang nhìn: dòng chữ sát mép phải/dưới mà đặt
  // ô đúng vào đó thì người dùng phải cuộn mới thấy chỗ gõ.
  const left = Math.max(8, Math.min(x, window.scrollX + window.innerWidth - box.offsetWidth - 8));
  const top = Math.max(8, Math.min(y, window.scrollY + window.innerHeight - box.offsetHeight - 8));
  box.style.left = left + "px";
  box.style.top = top + "px";
  document.addEventListener("keydown", onKey, true);
  fixBox = { el: box, onKey };
  input.focus();
}

function reportClick(event) {
  if (!reportMode || currentLang === "vi") return;
  const target = event.target;
  if (!target || typeof target.closest !== "function") return;
  // Bảng quản trị ngôn ngữ không phải nội dung để báo lỗi — nếu không, người
  // dùng vừa bấm "Tải báo lỗi" là bị hỏi sửa chính nhãn của nút đó.
  if (target.closest("[data-report-ui]")) return;
  if (target.closest("select, input, textarea, label")) return;
  const node = textNodeAt(event.clientX, event.clientY, target);
  if (!node || node.parentElement?.closest("[data-no-i18n]")) return;
  const source = resolveSource(sourceOf.has(node) ? sourceOf.get(node) : node.nodeValue);
  if (!source || !worthMachineTranslating(source)) return;
  // KHÔNG chặn default: người dùng vẫn phải đổi được trang khi đang bật chế
  // độ này, nếu không thì chỉ báo lỗi được những chữ nhìn thấy từ một trang.
  const shown = node.nodeValue.trim();
  openFixBox(node.parentElement, source, shown, (fix) => saveReport(source, shown, fix));
}

function setReportMode(on) {
  closeFixBox(); // đổi chế độ khi ô sửa còn mở thì phải đóng, nếu không nó thành
  // một hộp cô lập nằm giữa trang mà không còn chế độ báo lỗi nào giải thích.
  reportMode = !!on && currentLang !== "vi";
  if (reportMode) ensureReviewed(); // bản ghi báo lỗi phải nói đúng bản đó ở tầng nào
  document.body.classList.toggle("report-mode", reportMode);
  document.removeEventListener("click", reportClick, true);
  if (reportMode) document.addEventListener("click", reportClick, true);
  return reportMode;
}

/* ---------- công cụ cho trang Hướng dẫn ---------- */
const I18nAdmin = {
  langs: TRANSLATABLE,
  label: (lang) => LANG_NAMES[lang] || lang,
  ensureBundled,
  /* Số bản dịch đã có sẵn của từng ngôn ngữ (js/lang/index.json) */
  bundledIndex: () => langIndex,
  /* Hàng đợi dịch máy còn lại — 0 nghĩa là không phải gọi mạng lần nào */
  queueLength: () => pending.length,
  /* Bản dịch đã có của một chuỗi, không gọi API và không xếp hàng đợi. */
  translate: (lang, text) => lookup(lang, text),

  /* Mọi chuỗi tiếng Việt mà ứng dụng có thể hiển thị: văn bản đang nằm
     trong DOM + chuỗi động khai báo bằng data-i18n-src + từ điển curated.
     Phải lấy NGUỒN tiếng Việt, không lấy chữ đang hiển thị — khi giao diện
     đang là tiếng Trung thì node.nodeValue là bản dịch, dùng nó làm khoá sẽ
     cho ra_coverage_ toàn 0% và xuất file toàn khoá tiếng Hán. */
  collectSources() {
    const set = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-i18n]")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const key = resolveSource(sourceOf.has(node) ? sourceOf.get(node) : node.nodeValue);
      if (key) set.add(key);
    }
    document.querySelectorAll("[data-i18n-src]").forEach((el) => {
      for (const key of el.getAttribute("data-i18n-src").split("\n")) {
        if (key.trim()) set.add(normalize(key));
      }
    });
    return [...set];
  },

  /* coverage nói hai con số khác nhau: "translated" = có bản dịch để hiển thị,
     "reviewed" = bản đó đi qua mắt người. Mọi chỗ hiển thị tỷ lệ phải dùng
     reviewed, khoe translated thì là nói dối.
     Mẫu số chỉ tính chuỗi cần dịch: "☰", "✓", "0/6", "45.33.12.8"... hiện ra
     trên DOM nhưng không phải văn bản, gộp vào thì bao giờ cũng thiếu lặt vặt
     và tỷ lệ thật bị che mất. */
  coverage(lang) {
    const sources = this.collectSources().filter((s) => worthMachineTranslating(s) || lookup(lang, s) !== null);
    const translated = sources.filter((s) => lookup(lang, s));
    const reviewed = translated.filter((s) => isReviewedSource(lang, s)).length;
    return {
      total: sources.length,
      translated: translated.length,
      reviewed,
      pct: sources.length ? Math.round((translated.length / sources.length) * 100) : 100,
      reviewPct: sources.length ? Math.round((reviewed / sources.length) * 100) : 100,
    };
  },

  clearCache(lang) {
    RUNTIME[lang] = {};
    CyUtil.removeKey(localStorage, CACHE_KEY(lang));
    reindexAll();
  },

  /* Dịch hàng loạt toàn bộ chuỗi đang có, có tiến độ để hiển thị lên UI.
     Không bắt buộc: thiếu chuỗi nào thì lúc hiển thị sẽ tự dịch bù. */
  async translateAll(lang, onProgress) {
    const sources = this.collectSources().filter((s) => worthMachineTranslating(s) && !lookup(lang, s));
    let doneCount = 0;
    for (const text of sources) {
      const translated = await machineTranslate(text, lang);
      if (translated) storeMachine(lang, text, translated);
      onProgress?.(++doneCount, sources.length, text);
      if (machineDisabledUntil > Date.now()) break;
      await CyUtil.sleep(120);
    }
    if (lang === currentLang) renderDocument(lang);
    return { attempted: sources.length, remaining: sources.length - doneCount };
  },

  /* ---------- provenance + báo lỗi bản dịch ---------- */
  ensureReviewed,
  isReviewedSource,
  /* Nguồn gốc của một bản dịch đang hiển thị: "review" (người duyệt),
     "machine" (máy), "code" (giữ nguyên), "fix" (báo lỗi đã sửa), null (chưa có). */
  provenance(lang, text) {
    const key = normalize(text);
    const hit = layerFor(lang, key);
    if (!hit) return null;
    // <lang>.json là dict phẳng nên layerFor không phân biệt được curated và
    // review; hỏi isReviewedSource (cần js/lang/reviewed.json) nếu đã nạp.
    if (hit.layer === "machine" && isReviewedSource(lang, key)) return "review";
    return hit.layer;
  },
  setReportMode,
  isReportMode: () => reportMode,
  /* Số bản ghi — guide.js chỉ cần con số, gọi listReports() để lấy .length là
     copy cả mảng về rồi vứt đi, mỗi lần vẽ lại bảng ngôn ngữ. */
  reportCount: () => reports.length,
  listReports: () => reports.slice(),
  clearReports() {
    reports = [];
    CyUtil.removeKey(localStorage, REPORTS_KEY);
  },
  /* Bản sửa tạm của người dùng — xoá là giao diện quay về đúng từ điển gốc. */
  clearOverrides() {
    overrides = {};
    CyUtil.removeKey(localStorage, OVERRIDE_KEY);
    reindexAll();
    if (currentLang !== "vi") renderDocument(currentLang);
  },
  /* File tải về có đủ ngữ cảnh để chép thẳng vào tools/translation_review.json:
     chuỗi nguồn, ngôn ngữ, bản dịch máy đã sai, bản sửa, và nó nằm trang nào. */
  reportsJson() {
    return JSON.stringify(
      {
        _doc: [
          "Báo lỗi bản dịch do người dùng gom trên giao diện CySim.", // i18n-skip
          "Cách dùng: đưa kèm file này cho tools/translation_review.json", // i18n-skip
          "(mỗi mục: \"<chuỗi nguồn>\": {en:…, zh:…, fr:…, es:…, ja:…}) rồi chạy", // i18n-skip
          "python tools/gen_translations.py --offline.",
        ],
        generated: new Date().toISOString().slice(0, 10),
        strings: reports,
      },
      null,
      2
    );
  },
};

/* ---------- khởi tạo ---------- */

/* Danh sách ngôn ngữ phải tự nói lên mức độ dịch sẵn của từng thứ, nếu không
   người dùng tưởng "中文" là bản dịch do người thật viết trong khi thực tế chỉ
   là từ điển máy. js/lang/index.json do tools/gen_translations.py sinh ra,
   ghi rõ mỗi ngôn ngữ có bao nhiêu chuỗi đã kiểm chứng (review), bao nhiêu
   chuỗi máy dịch (machine), bao nhiêu chuỗi code giữ nguyên; thiếu file này
   thì coi như chưa có gì. */
let langIndex = null;

/* Index cũ chỉ ghi một con số tổng. Đọc được cả hai kiểu để nhãn không hiện
   NaN%, nhưng tỷ lệ khoe ra luôn là "đã kiểm chứng", không phải "có bản dịch". */
function indexStats(code) {
  const raw = langIndex?.langs?.[code];
  const total = langIndex?.total || 0;
  if (!raw) return { total, review: 0, machine: 0, code: 0, missing: 0 };
  if (typeof raw === "number") return { total, review: raw, machine: 0, code: 0, missing: Math.max(0, total - raw) };
  const ready = (raw.review || 0) + (raw.machine || 0) + (raw.code || 0);
  return {
    total,
    review: raw.review || 0,
    machine: raw.machine || 0,
    code: raw.code || 0,
    missing: raw.missing != null ? raw.missing : Math.max(0, total - ready),
  };
}

function optionLabel(code, base) {
  if (code === "vi") return base + " · 100% ✓";
  // <option> không dịch được (bỏ qua trong SKIP_TAGS) nên nhãn phải trung lập:
  // chỉ có số %, không kèm chữ tiếng Việt. ✓ = không còn chữ nào do máy dịch.
  // Chuỗi "code" (đường dẫn, định danh, số) được người soạn chủ ý giữ nguyên
  // nên tính là đã quyết định, không phải chưa dịch.
  const s = indexStats(code);
  if (!s.total) return base;
  const pct = Math.round(((s.review + s.code) / s.total) * 100);
  return base + " · " + pct + "%" + (s.machine || s.missing ? " ~" : " ✓");
}

function paintLangOptions() {
  const select = $("langSelect");
  if (!select) return;
  const previous = select.value || currentLang;
  select.replaceChildren(
    ...Object.entries(LANG_NAMES).map(([code, label]) => {
      const option = new Option(optionLabel(code, label), code);
      const s = indexStats(code);
      // Tooltip cũng không dịch được nên chỉ dùng số + ký hiệu trung lập:
      // ✓ đã người duyệt, ~ máy dịch, = chuỗi code giữ nguyên.
      option.title = code === "vi"
        // Không viết tiếng Việt vào tooltip: nó hiện nguyên văn khi người dùng
        // đang chọn tiếng Nhật. Chỉ số và ký hiệu thì an toàn với mọi ngôn ngữ.
        ? "vi · 100% ✓"
        : `js/lang/${code}.json · ✓ ${s.review}/${s.total} · ~ ${s.machine}/${s.total} · = ${s.code}` +
          (langIndex?.generated ? " · " + langIndex.generated : "");
      return option;
    })
  );
  select.value = previous || currentLang;
}

async function loadLangIndex() {
  try {
    const res = await fetch("js/lang/index.json");
    if (!res.ok) return null;
    langIndex = await res.json();
    paintLangOptions();
    return langIndex;
  } catch {
    return null; // chưa chạy tools/gen_translations.py — tầng máy vẫn lo được
  }
}

function initI18n() {
  const select = $("langSelect");
  if (select) {
    // Một nguồn duy nhất cho danh sách ngôn ngữ: LANG_NAMES ở trên
    paintLangOptions();
    select.value = currentLang;
    select.addEventListener("change", (e) => applyLanguage(e.target.value));
    loadLangIndex();
  }
  document.documentElement.lang = currentLang;
  if (currentLang !== "vi") {
    loadBundledDictionaries().then(({ missing }) => {
      if (missing.length) {
        console.info("[i18n] Chưa có từ điển sinh sẵn cho " + missing.join(", ") + " — sẽ dịch tự động khi cần.");
      }
    });
  }
}

initI18n();
