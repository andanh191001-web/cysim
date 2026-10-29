#!/usr/bin/env node
/* =========================================================
   CySim — test/exam.test.js  ·  kiểm thử chấm điểm kỳ thi tốt nghiệp

   LÀ GÌ   : Gọi thẳng bộ chấm điểm của js/labs/exam.js (Labs.exam.tinhDiem,
             Labs.exam.chamTungDe) với các bộ đáp án CỐ ĐỊNH, không cần
             trình duyệt. Đây là phần mà mã nguồn không tự chứng minh được:
             "một ý tự luận tính khi nào", "20 câu trắc nghiệm đúng thì bao
             nhiêu điểm", "ngưỡng đỗ có đúng 10/20 mỗi phần không".
             Nửa sau của file kiểm tra CÁCH LY HAI LƯỢT THI: kết quả lượt thử
             không bao giờ đi vào cổng chứng chỉ (Labs.exam.dat/ketQua), kể cả
             khi lượt đó đạt 20/20.
   CHẠY    : node test/exam.test.js          (không cần thư viện gì thêm)
             Hoặc trên máy không cài node, dùng đúng binary của Qoder:
             ELECTRON_RUN_AS_NODE=1 "<duong-dan-Qoder.exe>" test/exam.test.js
             Exit 0 = tất cả đạt; khác 0 = in ra từng dòng FAIL.
   CHẠM TỚI : đọc file js/labs/exam.js (vm, không eval chuỗi do người dùng
             gõ), global Labs/TU_LUAN/TRAC_NGHIEMLY từ chính file đó.
             Không ghi file nào, không gọi mạng.
   GHI CHÚ  : exam.js là IIFE nên bên trong nó cần một vài tên toàn cầu
             ($, t, CyUtil, Auth, Labs, showToast, labsDone, TOTAL_LABS...).
             File này dựng bản stub tối thiểu cho những tên đó: kiểm thử CHẤM
             ĐIỂM không cần DOM thật, chỉ cần exam.js nạp được và gọi được hai
             hàm thuần. Stub càng nhỏ càng khó tự hỏng theo giao diện.
   ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const EXAM_JS = path.join(__dirname, "..", "js", "labs", "exam.js");

/* ---------- stub môi trường ---------- */
const nodeStub = () => ({
  addEventListener() {},
  append() {},
  replaceChildren() {},
  querySelectorAll() { return []; },
  querySelector() { return null; },
  setAttribute() {},
  scrollIntoView() {},
  style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  dataset: {},
  textContent: "",
  value: "",
  hidden: false,
  disabled: false,
});

function makeContext() {
  const storage = new Map();
  const store = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const noop = () => {};
  const ctx = {
    console,
    $: () => nodeStub(),
    document: Object.assign(nodeStub(), {
      title: "",
      documentElement: nodeStub(),
      body: nodeStub(),
      fullscreenElement: null,
      createElement: () => nodeStub(),
    }),
    window: Object.assign(nodeStub(), {
      innerWidth: 1280,
      addEventListener: noop,
      matchMedia: () => ({ matches: false, addEventListener: noop }),
    }),
    localStorage: store,
    sessionStorage: store,
    navigator: { userAgent: "test" },
    location: { protocol: "http:", href: "http://127.0.0.1/test" },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    /* exam.js chỉ dùng mấy tên này để vẽ chữ và hỏi tiến độ — kiểm thử chấm
       điểm không quan tâm nội dung chúng trả về. */
    t: (s) => s,
    showToast: noop,
    currentLang: "vi",
    LABEL_LOCALE: { vi: "vi-VN" },
    TOTAL_LABS: 12,
    labsDone: () => 12,
    Auth: { id: () => "test", displayName: () => "Tester" },
    CyUtil: {
      readJson: (store, key, fallback) => {
        try {
          const raw = store.getItem(key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch {
          return fallback;
        }
      },
      writeJson: (store, key, value) => {
        try {
          store.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      },
    },
    Labs: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXAM_JS, "utf8"), ctx, { filename: "exam.js" });
  return ctx;
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
const ctx = makeContext();
const exam = ctx.Labs.exam;

console.log("test/exam.test.js — chấm điểm kỳ thi tốt nghiệp");

check("exam.js nạp được và đăng ký Labs.exam.tinhDiem", !!exam && typeof exam.tinhDiem === "function");
if (!exam || typeof exam.tinhDiem !== "function") {
  console.log("\nKHÔNG CHẠY ĐƯỢC: không lấy được bộ chấm điểm từ exam.js.");
  process.exit(1);
}

const TN = exam.TRAC_NGHIEMLY;
const TL = exam.TU_LUAN;
console.log("  (đề thật: %d câu trắc nghiệm, %d câu tự luận x %d ý)",
  TN.length, TL.length, TL[0].y.length);

/* 1) Bỏ trống toàn bộ = 0 điểm cả hai phần. */
const trong = exam.tinhDiem(TN.map(() => -1), ["", "", "", ""]);
check("bài bỏ trống: trắc nghiệm 0/20", trong.diemTN === 0, "diemTN=" + trong.diemTN);
check("bài bỏ trống: tự luận 0/20", trong.diemTL === 0, "diemTL=" + trong.diemTL);

/* 2) Đúng hết trắc nghiệm = 20, và điểm tính theo CHỈ SỐ đáp án chứ không
      theo chữ (đổi ngôn ngữ không làm mất điểm). */
const dungHet = exam.tinhDiem(TN.map((c) => c.d), ["", "", "", ""]);
check("trắc nghiệm đúng hết: 20/20", dungHet.diemTN === 20, "diemTN=" + dungHet.diemTN);
check("số câu đúng được ghi từng câu", dungHet.dungTN.length === TN.length && dungHet.dungTN.every(Boolean));

/* 3) Ngưỡng đỗ: 5 câu đúng = 10 điểm = vừa đủ, 4 câu = 8 = thiếu. */
const namCau = exam.tinhDiem(TN.map((c, i) => (i < 5 ? c.d : (c.d + 1) % c.c.length)), ["", "", "", ""]);
check("5/10 câu đúng = 10 điểm (sát ngưỡng đỗ)", namCau.diemTN === 10, "diemTN=" + namCau.diemTN);

/* 4) Luật tự luận mới (một ý = HAI từ khoá, hoặc MỘT từ khoá trong bài dài):
      dùng đúng dữ liệu của câu 1 để không phải chép lại từ điển từ khoá. */
const y0 = TL[0].y[0];
const dai = (text, target) => text + " " + "x".repeat(Math.max(0, target - text.replace(/\s/g, "").length));
const nganMotTuKhoa = y0.kw[0]; // một từ khoá, bài ngắn dưới 30 ký tự -> bị bỏ
/* Đủ 30 ký tự để vượt ngưỡng "bài vụn" nhưng dưới 80, nên ý này chỉ ăn điểm
   nhờ đúng quy tắc HAI từ khoá. */
const nganNhungDu = dai(y0.kw[0] + " " + y0.kw[Math.min(1, y0.kw.length - 1)], 50);
const daiMotTuKhoa = dai(y0.kw[0], 100); // một từ khoá trong bài vượt ngưỡng 80 ký tự

const chamNgan = exam.chamTungDe(TL[0], nganMotTuKhoa);
check("một mình một từ khoá + bài ngắn: ý đó KHÔNG được tính",
  chamNgan[0] === false, JSON.stringify(chamNgan));

const chamHaiTuKhoa = exam.chamTungDe(TL[0], nganNhungDu);
check("hai từ khoá cùng lượt: ý đó được tính", chamHaiTuKhoa[0] === true, JSON.stringify(chamHaiTuKhoa));

const chamDai = exam.chamTungDe(TL[0], daiMotTuKhoa);
check("một từ khoá trong bài dài (>=80 ký tự): ý đó được tính",
  chamDai[0] === true, JSON.stringify(chamDai));

/* 5) Bài lặt vặt dưới 30 ký tự: dù tình cờ khớp từ khoá cũng không chấm. */
const vuVat = exam.chamTungDe(TL[0], y0.kw[0].slice(0, Math.min(6, y0.kw[0].length)));
check("trả lời vụn dưới 30 ký tự: 0/5 ý", vuVat.every((d) => d === false), JSON.stringify(vuVat));

/* 6) Điểm tự luận không thể vượt trần 20 (4 câu x 5 ý x 1 điểm). */
const dayDu = exam.tinhDiem(TN.map(() => -1), TL.map((de) => dai(de.y.map((tieuChi) => tieuChi.kw[0]).join(" "), 200)));
check("tự luận viết đủ ý: đúng 20/20, không vượt trần",
  dayDu.diemTL === 20, "diemTL=" + dayDu.diemTL);

/* 7) Cách ly hai lượt thi. Đây là điều duy nhất khiến "thi thử không tính điểm"
      thành thật: kết quả lượt THỬ nằm ở khoá cysim-exam-thu:<id>, còn certificate.js
      chỉ hỏi Labs.exam.dat()/ketQua() — hai hàm đó đọc đúng một khoá
      cysim-exam:<id>. Nếu ai đó sau này gộp hai khoá lại, các dòng dưới FAILED. */
const MO = "cysim-exam:test";       // lượt thật  -> được tính điểm, mở bằng
const THU = "cysim-exam-thu:test";  // lượt thử   -> chỉ hiện trên màn hình
const full = { diemTN: 20, diemTL: 20, hocLuc: "Xuất sắc", hetGio: false };

check("mặc định đang chọn lượt thi thật", exam.che() === "that", "che=" + exam.che());
check("certificate.js lấy đúng ngưỡng 6 nhiệm vụ cho lượt thử", exam.THI_THU === 6, "THI_THU=" + exam.THI_THU);
check("chưa vào phòng nào thì điều hướng không bị khoá", exam.dangLam() === false);

/* Làm dở trong phòng THỬ: màn hình phải còn bị khoá (không sang tab khác),
   nhưng kết quả thật vẫn trống. */
ctx.localStorage.setItem(THU, JSON.stringify({
  tn: TN.map(() => -1), tl: TL.map(() => ""), ketQua: null, lam: true, fs: true, huy: null, hetLuc: Date.now() + 1000,
}));
check("đang làm dở lượt thử: khoá điều hướng vẫn có hiệu lực", exam.dangLam() === true);
check("đang làm dở lượt thử: chưa có kết quả nào được tính", exam.dat() === false && exam.ketQua() === null);

/* Nộp xong lượt thử với điểm tuyệt đối: vẫn KHÔNG được coi là đỗ. */
ctx.localStorage.setItem(THU, JSON.stringify({
  tn: TN.map((c) => c.d), tl: TL.map(() => ""), ketQua: full, lam: false, fs: false, huy: null, hetLuc: null,
}));
check("lượt thử đạt 20/20: Labs.exam.dat() vẫn false (không mở được bằng)",
  exam.dat() === false, "dat=" + exam.dat());
check("lượt thử đạt 20/20: Labs.exam.ketQua() vẫn null (chứng chỉ không đọc được)",
  exam.ketQua() === null, JSON.stringify(exam.ketQua()));

/* Đúng số điểm đó ghi vào khoá lượt thật thì phải đỗ — chứng minh bộ chấm
   không phân biệt hai lượt, chỉ có khoá lưu là khác. */
ctx.localStorage.setItem(MO, JSON.stringify({
  tn: TN.map((c) => c.d), tl: TL.map(() => ""), ketQua: full, lam: false, fs: false, huy: null, hetLuc: null,
}));
check("cùng điểm đó ở lượt thật: dat() true", exam.dat() === true);
check("cùng điểm đó ở lượt thật: ketQua() đọc được", exam.ketQua() && exam.ketQua().diemTN === 20);

/* Dữ liệu cũ/thiếu khuôn (đề đổi số câu) không được làm nổ màn hình. */
ctx.localStorage.setItem(MO, JSON.stringify({ tn: [1, 2], ketQua: null, lam: true }));
check("bài lưu sai khuôn bị bỏ, không coi là đang ngồi trong phòng",
  exam.dangLam() === false && exam.ketQua() === null);

console.log("\n%d đạt, %d lỗi", passed, failed);
process.exit(failed ? 1 : 0);
