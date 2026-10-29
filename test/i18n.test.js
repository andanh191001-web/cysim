#!/usr/bin/env node
/* =========================================================
   CySim — test/i18n.test.js  ·  kiểm thử thứ tự ưu tiên của máy dịch

   LÀ GÌ   : i18n.js tìm bản dịch theo nhiều tầng:
               fix     — bản sửa người dùng gõ ngay trên giao diện
               review  — từ điển viết tay (js/i18n-curated.js) hoặc chuỗi đã
                         được người thật duyệt (js/lang/reviewed.json)
               machine — từ điển sinh sẵn js/lang/<lang>.json, hoặc bộ nhớ
                         cysim-i18n-cache:<lang> trong localStorage
               code    — bản đích trùng hẳn bản gốc (thuật ngữ giữ nguyên)
               null    — chưa có gì, sẽ đẩy vào hàng đợi dịch máy
             layerFor()/lookup() là đoạn logic mà đọc code bằng mắt không kiểm
             được: chỉ cần đảo hai dòng if là bản dịch máy đè lên bản người
             duyệt mà không ai biết. File này nạp thật ba file nguồn và đòi
             layerFor trả về ĐÚNG tầng, ĐÚNG giá trị.
   CHẠY    : node test/i18n.test.js
             Hoặc trên máy không cài node:
             ELECTRON_RUN_AS_NODE=1 "<duong-dan-Qoder.exe>" test/i18n.test.js
             Exit 0 = tất cả đạt; khác 0 = in từng dòng FAIL.
   CHẠM TỚI : đọc js/utils.js, js/i18n-curated.js, js/i18n.js, js/lang/*.json,
             js/lang/reviewed.json (fetch giả đọc thẳng đĩa). Không ghi file,
             không gọi mạng: mọi URL ngoài js/ trả about=false nên dịch máy
             tự tắt, test chạy được cả khi tắt internet.
   GHI CHÚ  : ba file nguồn dùng chung MỘT phạm vi toàn cục (SPA nạp bằng
             <script>, không có bundler), nên phải nạp cả ba vào cùng một vm
             context — nạp riêng lẻ thì i18n.js không thấy CyUtil hay $ và chết.
             localStorage được SEED TRƯỚC khi nạp: i18n.js đọc overrides và bộ
             nhớ dịch máy đúng một lần lúc khởi động, muốn thử tầng "fix" và
             tầng "cache" thì phải đặt sẵn giá trị như trình duyệt của người
             dùng đã chạy app một thời gian.
   ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { TextEncoder, TextDecoder } = require("util");
const { webcrypto } = require("crypto");

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

/* Chuỗi chỉ tồn tại trong bộ nhớ dịch máy: có dấu tiếng Việt nên
   sanitizeRuntime() coi là nguồn hợp lệ, và không nằm trong bất kỳ từ điển nào
   nên mọi tầng khác đều bỏ qua nó. */
const KEY_ONLY_CACHE = "Chuỗi chỉ có trong bộ nhớ dịch máy của trình duyệt thử nghiệm.";
const VALUE_ONLY_CACHE = "Ban thu nghiem value";

/* ---------- đọc trước dữ liệu để còn SEED localStorage ---------- */
/* i18n-curated.js chỉ là một object phẳng nên tách ra được bằng context sạch,
   không cần dựng DOM. Làm vậy test lấy được khoá THẬT của từ điển viết tay mà
   không phải chép tay một câu tiếng Việt (chép tay thì đổi bản dịch là hỏng
   test, mà hỏng kiểu im lặng). */
function curatedDict() {
  return vm.runInNewContext(read("js/i18n-curated.js") + "\nEN_DICT_CURATED;", {});
}

/* ---------- stub môi trường ---------- */
const nodeStub = () => ({
  id: "",
  className: "",
  tagName: "DIV",
  nodeType: 1,
  textContent: "",
  nodeValue: "",
  value: "",
  hidden: false,
  style: {},
  dataset: {},
  childNodes: [],
  firstChild: null,
  parentElement: null,
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  addEventListener() {},
  removeEventListener() {},
  append() {},
  appendChild() {},
  removeChild() {},
  remove() {},
  setAttribute() {},
  getAttribute() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  closest() { return null; },
  contains() { return false; },
  focus() {},
  scrollIntoView() {},
  getBoundingClientRect() { return { left: 0, top: 0, bottom: 0, right: 0, width: 0, height: 0 }; },
  getClientRects() { return []; },
});

function makeContext(seed) {
  const store = new Map(Object.entries(seed || {}));
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const noop = () => {};

  /* fetch GIẢ: chỉ phục vụ file của dự án. Không có kết nối thật nào được mở,
     nên hàng đợi dịch máy (nếu vô tình chạy) tự thất bại và bỏ qua. */
  const fetched = [];
  const notFound = { ok: false, status: 404, json: async () => ({}), text: async () => "" };
  const fetchStub = async (url) => {
    const rel = String(url).replace(/^\.\//, "");
    fetched.push(rel);
    if (!rel.startsWith("js/") || rel.includes("..")) return notFound;
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) return notFound;
    const raw = fs.readFileSync(file, "utf8");
    return { ok: true, status: 200, text: async () => raw, json: async () => JSON.parse(raw) };
  };

  const ctx = {
    console,
    fetch: fetchStub,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    Promise,
    /* utils.js tạo TextEncoder ngay lúc nạp và SHA-256 dùng crypto.subtle —
       bắt buộc phải có, không thì file nguồn chết trước khi test chạy. */
    TextEncoder,
    TextDecoder,
    crypto: webcrypto,
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    localStorage: storage,
    sessionStorage: storage,
    navigator: { userAgent: "test" },
    location: { protocol: "http:", href: "http://127.0.0.1/test" },
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, COMMENT_NODE: 8 },
    NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1, FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3 },
    MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
    CustomEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init || {}); } },
    Event: class { constructor(type) { this.type = type; } },
    document: Object.assign(nodeStub(), {
      title: "CySim",
      documentElement: Object.assign(nodeStub(), { lang: "vi" }),
      body: nodeStub(),
      fullscreenElement: null,
      hidden: false,
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => nodeStub(),
      createTextNode: (text) => Object.assign(nodeStub(), { nodeType: 3, nodeValue: String(text) }),
      createTreeWalker: () => ({ nextNode: () => null, currentNode: null }),
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => true,
    }),
    window: Object.assign(nodeStub(), {
      innerWidth: 1280,
      innerHeight: 800,
      scrollX: 0,
      scrollY: 0,
      devicePixelRatio: 1,
      addEventListener: noop,
      removeEventListener: noop,
      matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
    }),
  };
  ctx.window.document = ctx.document;
  ctx.window.localStorage = storage;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const rel of ["js/utils.js", "js/i18n-curated.js", "js/i18n.js"]) {
    vm.runInContext(read(rel), ctx, { filename: rel });
  }
  /* i18n.js không gán gì vào window: mọi thứ nằm ở phạm vi toàn cục chung của
     các file. Script sau chạy CÙNG context nên lấy được đúng các biến đó —
     đây cũng chính là cơ chế app thật dùng, không phải bản sao logic. */
  vm.runInContext(
    `globalThis.__api = {
       layerFor: (lang, key) => layerFor(lang, key),
       lookup: (lang, text) => lookup(lang, text),
       resolveSource: (text) => resolveSource(text),
       isReviewed: (lang, source) => isReviewedSource(lang, source),
       normalize: (text) => normalize(text),
       t: (text) => t(text),
       lang: () => currentLang,
       curated: () => CURATED,
       bundled: () => BUNDLED,
       runtime: () => RUNTIME,
       overrideKey: () => OVERRIDE_KEY,
       queueLength: () => pending.length,
       ready: async () => {
         for (const code of TRANSLATABLE) await ensureBundled(code);
         await ensureReviewed();
         return TRANSLATABLE.map((code) => [code, !!BUNDLED[code]]);
       },
       admin: () => I18nAdmin,
     };`,
    ctx,
    { filename: "test-shim.js" }
  );
  return { api: ctx.__api, fetched };
}

/* ---------- khung kiểm thử tí hon ---------- */
let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log("  ok   " + name);
  } else {
    failed++;
    console.log("  FAIL " + name + (detail ? "  -> " + detail : ""));
  }
}

/* ---------- vào việc ---------- */
(async () => {
  console.log("test/i18n.test.js — thứ tự ưu tiên của máy dịch");

  const EN = curatedDict();
  const enReal = Object.keys(EN).filter((k) => EN[k] !== k);
  const reviewKey = enReal[0];
  const overrideKey = enReal[1];
  check("từ điển viết tay có đủ hai chuỗi để thử", !!reviewKey && !!overrideKey, "EN_DICT_CURATED quá nhỏ");

  const FIX_VALUE = "Human fix used by the layer test";
  const seed = {
    "cysim-lang": "vi",
    /* Tầng 0: bản sửa của người dùng, đặt sẵn đúng vào khoá đang dùng để thử
       tầng review -> nếu layerFor không ưu tiên fix thì dòng kiểm tra "ĐÈ lên"
       lập tức FAIL (không bao giờ im lặng bỏ qua). */
    "cysim-i18n-overrides": JSON.stringify({ en: { [overrideKey]: FIX_VALUE } }),
    /* Tầng 3: bộ nhớ dịch máy tích luỹ, gồm cả một dòng rác do code cũ để
       lại ("0" -> "0") để thử luôn sanitizeRuntime(). */
    "cysim-i18n-cache:es": JSON.stringify({ [KEY_ONLY_CACHE]: VALUE_ONLY_CACHE, "0": "0" }),
  };

  const { api, fetched } = makeContext(seed);
  check("i18n.js nạp được cùng utils.js + i18n-curated.js", typeof api.layerFor === "function");
  check("tên khoá override của i18n.js vẫn là cysim-i18n-overrides",
    api.overrideKey() === "cysim-i18n-overrides", api.overrideKey());

  const availability = await api.ready();
  for (const [code, loaded] of availability) {
    check(`từ điển sinh sẵn js/lang/${code}.json nạp được`, loaded);
  }
  check("cả 5 ngôn ngữ đều có từ điển (không còn ngôn ngữ nào thiếu file)",
    availability.every(([, loaded]) => loaded), JSON.stringify(availability));

  /* 1) TẦNG REVIEW: chuỗi viết tay, và lookup phải trả ĐÚNG bản của từ điển. */
  const hitReview = api.layerFor("en", reviewKey);
  check("chuỗi viết tay: tầng = review", hitReview && hitReview.layer === "review", JSON.stringify(hitReview));
  check("chuỗi viết tay: lookup trả đúng bản dịch",
    api.lookup("en", reviewKey) === api.curated().en[reviewKey], String(api.lookup("en", reviewKey)));

  /* 2) whitespace: cùng một câu gõ thừa khoảng trắng vẫn phải ra bản dịch.
        layerFor nhận khoá ĐÃ chuẩn hoá — chuẩn hoá là việc của lookup — nên
        thử ở đúng cửa công khai, và thử riêng normalize để bắt lỗi gom dấu. */
  const hitSpacing = api.lookup("en", `   ${reviewKey}\n `);
  check("lookup bỏ qua khoảng trắng thừa", hitSpacing === api.curated().en[reviewKey], String(hitSpacing));
  check("normalize gom khoảng trắng liên tiếp thành một dấu cách",
    api.normalize("a  b\n c") === "a b c", JSON.stringify(api.normalize("a  b\n c")));

  /* 3) TẦNG FIX đè review: cùng một khoá, bản của người dùng phải thắng. */
  const hitFix = api.layerFor("en", overrideKey);
  check("bản sửa của người dùng: tầng = fix", hitFix && hitFix.layer === "fix", JSON.stringify(hitFix));
  check("bản sửa của người dùng ĐÈ lên từ điển viết tay",
    api.lookup("en", overrideKey) === FIX_VALUE, String(api.lookup("en", overrideKey)));

  /* 4) MACHINE: ngôn ngữ khác không có từ điển viết tay -> chỉ còn file sinh sẵn. */
  const fr = api.bundled().fr || {};
  const enKeys = new Set(Object.keys(api.curated().en || {}));
  const machineEntry = Object.keys(fr).find((k) => fr[k] !== k && !enKeys.has(k));
  check("js/lang/fr.json có chuỗi máy dịch để thử", !!machineEntry, "không tìm thấy mục nào");
  const hitMachine = api.layerFor("fr", machineEntry);
  check("chuỗi chỉ có trong từ điển sinh sẵn: tầng = machine",
    hitMachine && hitMachine.layer === "machine" && hitMachine.value === fr[machineEntry],
    JSON.stringify(hitMachine));

  /* 5) CODE: thuật ngữ quốc tế giữ nguyên bản gốc phải nhãn "code". */
  const codeEntry = Object.keys(fr).find((k) => fr[k] === k);
  const hitCode = codeEntry ? api.layerFor("fr", codeEntry) : null;
  check("chuỗi giữ nguyên bản gốc: tầng = code", hitCode && hitCode.layer === "code",
    codeEntry || "fr.json không còn mục nào trùng gốc");

  /* 6) CACHE + RÁC: nguồn chỉ có trong localStorage vẫn dùng được, còn dòng
        "0"->"0" phải bị sanitizeRuntime vứt (đúng loại rác mà
        tools/gen_translations.py --offline cũng lọc khi sinh từ điển). */
  const hitCache = api.layerFor("es", KEY_ONLY_CACHE);
  check("bộ nhớ dịch máy còn dùng được: tầng = machine",
    hitCache && hitCache.layer === "machine" && hitCache.value === VALUE_ONLY_CACHE, JSON.stringify(hitCache));
  check("rác \"0\"->\"0\" trong bộ nhớ dịch máy bị loại ngay khi nạp",
    api.layerFor("es", "0") === null && !("0" in api.runtime().es), JSON.stringify(api.runtime().es));

  /* 7) KHÔNG BỊA: chuỗi lạ phải trả null ở mọi cổng ra. */
  const unknown = "Chuỗi hoàn toàn không tồn tại ở bất kỳ tầng nào 42.";
  check("chuỗi lạ: layerFor = null", api.layerFor("en", unknown) === null);
  check("chuỗi lạ: lookup = null", api.lookup("en", unknown) === null);
  check("chuỗi lạ: provenance = null", api.admin().provenance("en", unknown) === null);

  /* 8) PROVENANCE phân biệt review/machine nhờ js/lang/reviewed.json — đây là
        chỗ UI khoe "đã kiểm chứng", sai là nói dối người dùng. */
  const reviewedFile = JSON.parse(read("js/lang/reviewed.json"));
  const reviewedSets = new Set();
  for (const names of Object.values(reviewedFile.langs || {})) {
    for (const name of names) for (const s of reviewedFile.sets?.[name] || []) reviewedSets.add(s);
  }
  const reviewedEntry = Object.keys(fr).find((k) => reviewedSets.has(k) && fr[k] !== k && !enKeys.has(k));
  check("reviewed.json có chuỗi đã duyệt để thử provenance", !!reviewedEntry);
  check("chuỗi đã qua mắt người: provenance = review",
    api.admin().provenance("fr", reviewedEntry) === "review", String(reviewedEntry));
  /* Bản chưa ai duyệt thì lấy ở bộ nhớ dịch máy: toàn bộ từ điển sinh sẵn đã
     được người duyệt hết nên không còn chỗ nào trong fr.json để thử nữa —
     chính xác là điều dòng kiểm tra bên dưới bắt. */
  check("chuỗi chỉ có trong bộ nhớ dịch máy: provenance = machine",
    api.admin().provenance("es", KEY_ONLY_CACHE) === "machine", String(api.admin().provenance("es", KEY_ONLY_CACHE)));
  const frChuaDuyet = Object.keys(fr).filter((k) => fr[k] !== k && !enKeys.has(k) && !reviewedSets.has(k));
  check("fr.json không còn chuỗi máy dịch chưa ai duyệt (invariant MAY 0)",
    frChuaDuyet.length === 0, `${frChuaDuyet.length} chuỗi: ${frChuaDuyet.slice(0, 3).join(" | ")}`);
  check("từ điển viết tay luôn được tính là đã duyệt",
    api.isReviewed("en", reviewKey) === true);

  /* 9) KHÔNG DỊCH CHỒNG: bản dịch của fr phải tra ngược về đúng tiếng Việt,
        nếu không thì đổi zh -> fr sẽ mang chữ Trung Quốc đi dịch tiếp. */
  check("tra ngược bản dịch về chuỗi gốc", api.resolveSource(fr[machineEntry]) === machineEntry,
    `${api.resolveSource(fr[machineEntry])} != ${machineEntry}`);

  /* 10) TIẾNG VIỆT LÀ NGUỒN: ở lang=vi thì t() trả nguyên văn, không đụng từ
         điển, không xếp hàng đợi dịch máy. */
  check("currentLang khởi động là vi", api.lang() === "vi", api.lang());
  check("t() ở tiếng Việt trả nguyên văn", api.t(unknown) === unknown);
  check("t() ở tiếng Việt không tạo hàng đợi dịch máy", api.queueLength() === 0, String(api.queueLength()));

  /* 11) OFFLINE: fetch chỉ được chạm tới file của dự án. */
  const external = fetched.filter((u) => /^https?:/.test(u) || !u.startsWith("js/"));
  check("test chạy offline hoàn toàn, không gọi API dịch", external.length === 0, external.join(", "));

  console.log("\n%d đạt, %d lỗi", passed, failed);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.log("\nLỖI KHI CHẠY TEST:", err && err.stack ? err.stack : err);
  process.exit(1);
});
