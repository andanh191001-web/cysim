/* =========================================================
   CySim — js/search.js  ·  ô tìm kiếm toàn văn (Ctrl+K)

   LÀ GÌ   : Một palette kiểu trình soạn thảo: bấm Ctrl+K (Cmd+K trên macOS,
             hoặc nút "Tìm kiếm" trên sidebar) thì một lớp phủ mở ra với một
             ô nhập; gõ tới đâu danh sách rút tới đó. Thứ nó tìm là đúng những
             gì người học cần tới: 19 trang điều hướng (20 khi tài khoản đang
             đăng nhập có role admin), 13 thẻ bài học trên
             dashboard và 12 chủ đề Lý thuyết (kèm bốn mục Khái niệm / Cơ chế /
             Dấu hiệu / Phòng thủ của từng chủ đề). Không có cơ sở dữ liệu toàn
             văn nào cả: chỉ mục dựng trực tiếp từ DOM đang hiển thị, nên nó
             không bao giờ nói dối về nội dung đã đổi. Mỗi dòng còn mang theo
             CHUỖI GỐC tiếng Việt của nhãn, nên chuyển giao diện sang tiếng Pháp
             rồi gõ "lừa đảo" theo thói quen vẫn ra đúng trang Hameçonnage.
   CHẠY     : boot.js gọi Search.init() sau khi giao diện đã vẽ xong. Chỉ mục
             dựng chậm — lần mở đầu tiên. Dựng sớm hơn thì nhãn còn là tiếng
             Việt trong khi màn hình đã tiếng Pháp, và tìm "phishing" sẽ trả về
             kết quả tiếng Việt.
             Gõ -> loc() chấm điểm -> ve() vẽ tối đa 12 dòng. Enter hoặc bấm
             chuột -> showView(view); riêng chủ đề lý thuyết thì cuộn tới đúng
             thẻ sau khi showView đã xong (nó cuộn lên đầu trang).
   CHẠM TỚI : #searchOpen, #searchPalette, #searchInput, #searchResults,
             #searchCount; global $, t, tdem, resolveSource, CyUtil, showView,
             VIEW_FLAG, Flags, Auth. Không đụng Labs.*: mọi trang mở qua showView
             nên các chốt điều hướng (đang làm bài thi, trang bị admin tắt, quyền
             Quản trị) vẫn chạy nguyên như khi bấm nút bình thường.
   TOÀN CẦU : định nghĩa Search. Khối kết quả do JS vẽ nên mang data-no-i18n
             và phải dựng lại khi có sự kiện cysim:language; cysim:session cũng
             dựng lại (role admin đổi danh sách trang được phép) và palette tự
             đóng khi body mang .auth-locked.
   AN TOÀN  : mọi dòng kết quả ghi bằng textContent, không nội suy vào
             innerHTML — chữ người dùng gõ là dữ liệu, không phải code.
   ========================================================= */

const Search = (function () {
  const MAX_KET_QUA = 12;
  let chiMuc = null; // null = chưa dựng
  let ketQua = [];
  let dangChon = 0;

  /* Bỏ dấu thanh để "an toan" vẫn tìm ra "An toàn". Cùng khuôn chuanHoa()
     trong labs/exam.js nhưng không dùng chung: exam cần giữ dấu để so đáp án,
     còn ở đây mất dấu là mục đích. */
  function khongDau(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  }

  /* Trang nào người dùng này được phép tới? Cùng bộ luật với showView():
     công tắc quản trị tắt là biến mất khỏi kết quả, Quản trị chỉ dành cho
     role admin. Mời gọi đúng thứ app sẽ từ chối còn tệ hơn không có search. */
  function duocPhep(view) {
    const cot = typeof VIEW_FLAG !== "undefined" ? VIEW_FLAG[view] : null;
    if (cot && typeof Flags !== "undefined" && !Flags.on(cot)) return false;
    if (view === "admin" && !(typeof Auth !== "undefined" && Auth.isAdmin && Auth.isAdmin())) return false;
    return true;
  }

  /* Một học viên đổi giao diện sang tiếng Pháp rồi gõ "lừa đảo" theo thói quen
     thì chỉ mục chạy trên DOM thuần không có gì để khớp — và câu trả lời "không
     thấy gì" trước một trang có thật là cái làm người ta bỏ app. resolveSource()
     tra ngược đúng một bước về chuỗi gốc; không bịa từ điển nào ở đây. `manh` là
     những mảnh rời đã được ghép thành mô tả (bốn mục của một chủ đề Lý thuyết):
     chuỗi ghép thì không tra được, từng mảnh thì có. */
  function them(danhSach, view, loai, tieuDe, moTa, the, manh) {
    if (!tieuDe || !duocPhep(view)) return;
    const goc = [tieuDe, moTa || ""].concat(manh || []).map(resolveSource).join("\u0002");
    /* KHOÁ có thêm `view`: lab IDOR mang nhãn "Broken Access Control" ở cả năm
       ngôn ngữ, không chữ "idor" nào hiện trên màn hình, nên người học gõ theo
       tên lỗi kinh điển sẽ thấy "không có mục nào khớp". */
    danhSach.push({
      view: view,
      loai: loai,
      tieuDe: tieuDe,
      moTa: moTa || "",
      the: the || null,
      khoa: khongDau(view) + "\u0001" + khongDau(tieuDe) + "\u0001" + khongDau(moTa || "") + "\u0001" + khongDau(goc),
    });
  }

  function dungChiMuc() {
    const danhSach = [];
    /* 1) Sidebar: nhãn mỗi nút là text node (không phải thuộc tính) nên đọc
          textContent — chính là thứ người dùng đang nhìn thấy.
          CHỈ lấy text node TRỰC TIẾP của nút, không lấy `textContent` của cả
          nút: dấu ✓ hoàn thành là một <span class="tick"> nằm TRONG nút, đo
          30-10-2026 có 13/20 nhãn bị vấy "✓" vào kết quả tìm ("Broken Access
          Control✓"), và học viên vừa xong lab sẽ thấy dòng đó khớpแย่ hơn cả
          dòng chưa làm. Bỏ svg (không có chữ) nên chỉ còn đúng nhãn nhìn thấy. */
    document.querySelectorAll(".nav-btn[data-view]").forEach((b) => {
      if (b.hidden) return;
      const nhan = Array.from(b.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      them(danhSach, b.dataset.view, t("Trang"), nhan, "", null);
    });
    /* 2) Dashboard: 13 thẻ bài học; lấy cả dòng "goal" để tìm theo nội dung.
          Nhãn chip lấy đúng từ app đã dùng ở sidebar ("Nhiệm vụ") chứ không
          phải "bài học" — hai tên cho một thứ là cách nhanh nhất làm người mới
          lạc. CSS .s-kind đã viết hoa bằng text-transform, nên chọn dạng in
          hoa ở đây chỉ để khớp khoá có sẵn trong từ điển. */
    document.querySelectorAll("#dashboard button.card.mission[data-goto]").forEach((b) => {
      const h = b.querySelector("h3");
      const p = b.querySelector("p");
      them(danhSach, b.dataset.goto, t("Nhiệm vụ"), h ? h.textContent.trim() : "", p ? p.textContent.trim() : "", b);
    });
    /* 3) Lý thuyết: 12 chủ đề, bốn mục của mỗi chủ đề nhập vào mô tả để gõ
          "dấu hiệu" cũng ra đúng chủ đề có mục đó. */
    document.querySelectorAll("#theory .card.s6").forEach((card) => {
      const h3 = card.querySelector("h3");
      const muc = Array.from(card.querySelectorAll("h4")).map((x) => x.textContent.trim());
      them(danhSach, "theory", t("Lý thuyết"), h3 ? h3.textContent.trim() : "", muc.join(" · "), card, muc);
    });
    return danhSach;
  }

  function loc(truyVan) {
    const q = khongDau(truyVan);
    if (!q) return [];
    if (!chiMuc) chiMuc = dungChiMuc();
    const cho = [];
    for (const e of chiMuc) {
      const ten = khongDau(e.tieuDe);
      let diem = 0;
      if (ten === q) diem = 100;
      else if (ten.startsWith(q)) diem = 60;
      else if (ten.includes(q)) diem = 40;
      else if (e.khoa.includes(q)) diem = 20;
      if (diem) cho.push({ e: e, diem: diem });
    }
    cho.sort((a, b) => b.diem - a.diem || a.e.tieuDe.localeCompare(b.e.tieuDe));
    /* MỘT TRANG HAI DÒNG: cùng một màn hình được nêu ở cả nút sidebar lẫn thẻ
       bài học trên dashboard mà hai nơi dùng chung một nhãn — đo 30-10-2026: gõ
       "idor" ra "Broken Access Control" hai lần, chiếm hai trong mười hai chỗ
       của palette. Người đọc cần biết trang đó có thật, không cần thấy nó hai
       lần, nên bỏ dòng trùng theo khoá view + nhãn đã bỏ dấu. */
    const daThay = new Set();
    const ketQua = [];
    for (const x of cho) {
      const khoaN = x.e.view + "|" + khongDau(x.e.tieuDe);
      if (daThay.has(khoaN)) continue;
      daThay.add(khoaN);
      ketQua.push(x.e);
      if (ketQua.length >= MAX_KET_QUA) break;
    }
    return ketQua;
  }

  function moKetQua(e) {
    if (!e) return;
    dong();
    showView(e.view);
    if (!e.the) return;
    /* showView cuộn lên đầu trang trước; phải chờ nó xong mới đưa đúng chủ đề
       vào tầm mắt, không thì người dùng tới đầu trang Lý thuyết. */
    setTimeout(() => e.the.scrollIntoView({ block: "start", behavior: "smooth" }), 80);
  }

  function danhSachNhat() {
    const hop = $("searchResults");
    return hop ? Array.from(hop.querySelectorAll(".search-item")) : [];
  }

  function batSang(i) {
    dangChon = i;
    danhSachNhat().forEach((b, j) => b.classList.toggle("sel", j === i));
  }

  function ve(truyVan) {
    const hop = $("searchResults");
    if (!hop) return;
    hop.replaceChildren();
    const dem = $("searchCount");
    if (dem) dem.textContent = truyVan ? ketQua.length + " " + tdem(ketQua.length, "kết quả tìm được") : "";
    if (!ketQua.length) {
      const trong = document.createElement("li");
      trong.className = "search-empty";
      trong.textContent = truyVan ? t("Không có mục nào khớp với") + " " + truyVan : t("Gõ vài chữ để tìm nhiệm vụ, chủ đề lý thuyết hoặc trang.");
      hop.append(trong);
      return;
    }
    ketQua.forEach((e, i) => {
      const li = document.createElement("li");
      const nut = document.createElement("button");
      nut.type = "button";
      nut.className = "search-item" + (i === dangChon ? " sel" : "");
      const nhat = document.createElement("span");
      nhat.className = "s-kind";
      nhat.textContent = e.loai;
      const ten = document.createElement("span");
      ten.className = "s-title";
      ten.textContent = e.tieuDe;
      nut.append(nhat, ten);
      if (e.moTa) {
        const mo = document.createElement("span");
        mo.className = "s-desc";
        mo.textContent = e.moTa;
        nut.append(mo);
      }
      nut.addEventListener("click", () => moKetQua(e));
      nut.addEventListener("mousemove", () => {
        if (dangChon !== i) batSang(i); // chỉ đổi màu, không vẽ lại danh sách
      });
      li.append(nut);
      hop.append(li);
    });
  }

  function timTruyVan() {
    const o = $("searchInput");
    const truyVan = o ? o.value.trim() : "";
    ketQua = loc(truyVan);
    dangChon = 0;
    ve(truyVan);
  }

  /* Màn hình khoá là `body.auth-locked` (không phải thuộc tính hidden của
     #authOverlay). Palette nằm NGOÀI .app, ở cuối <body>, nên lớp khoá chỉ che
     nó bằng z-index chứ không xoá nó: Ctrl+K lúc đang khoá mà mở được ô nhập thì
     đúng là cái hàng rào giấy mà dự án này tự nhận là không có. */
  function dangBiKhoa() {
    return document.body.classList.contains("auth-locked");
  }

  function mo() {
    const palette = $("searchPalette");
    if (!palette || !palette.hidden || dangBiKhoa()) return;
    if (!chiMuc) chiMuc = dungChiMuc();
    palette.hidden = false;
    document.body.classList.add("search-open");
    ketQua = [];
    dangChon = 0;
    const o = $("searchInput");
    if (o) {
      o.value = "";
      o.focus();
    }
    ve("");
  }

  function dong() {
    const palette = $("searchPalette");
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    document.body.classList.remove("search-open");
    const nut = $("searchOpen");
    if (nut) nut.focus();
  }

  function diChuyen(dau) {
    const dong = danhSachNhat();
    if (!dong.length) return;
    batSang((dangChon + dau + dong.length) % dong.length);
    dong[dangChon].scrollIntoView({ block: "nearest" });
  }

  function xuLyPhim(e) {
    const palette = $("searchPalette");
    const moRoi = !!palette && !palette.hidden;
    /* Ctrl/Cmd+K bật tắt ở bất kỳ đâu. Bắt ở pha nổi vì i18n.js đã chiếm pha
       bắt (capture) cho Escape của ô sửa bản dịch. */
    if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === "k") {
      e.preventDefault();
      if (moRoi) dong(); else mo();
      return;
    }
    if (!moRoi) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      dong();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      diChuyen(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      diChuyen(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      moKetQua(ketQua[Math.min(dangChon, ketQua.length - 1)]);
    } else if (e.key === "Tab") {
      CyUtil.trapFocus(palette, e);
    }
  }

  function init() {
    const nut = $("searchOpen");
    if (nut) nut.addEventListener("click", mo);
    const palette = $("searchPalette");
    if (palette) {
      palette.addEventListener("click", (e) => {
        if (e.target === palette) dong(); // bấm ra nền tối thì đóng
      });
    }
    const o = $("searchInput");
    if (o) {
      o.addEventListener("input", timTruyVan);
      /* Không ở đây nữa: bàn phím ảo che ô nhập là việc của MỌI ô nhập trong
         app (15 lab + khung chat + trang Cài đặt), nên js/app.js nghe focusin
         một lần cho toàn trang và chỉ cuộn khi ô thực sự bị che. Ô của palette
         nằm sát đỉnh hộp nên hầu như không bao giờ tới nhánh đó. */
    }
    document.addEventListener("keydown", xuLyPhim);
    /* Đổi ngôn ngữ giữa chừng: chỉ mục dựng từ textContent đã dịch nên phải
       vứt đi dựng lại, không thì tìm tiếng Pháp trả kết quả tiếng Việt. */
    document.addEventListener("cysim:language", () => {
      chiMuc = null;
      const p = $("searchPalette");
      if (p && !p.hidden) timTruyVan();
    });
    /* Phiên đổi là danh sách trang được phép đổi theo (đăng nhập bằng role
       admin mới có "Quản trị", đăng xuất thì mất), nên chỉ mục phải vứt đi ở
       đây chứ không chỉ khi đổi ngôn ngữ. Đang mở mà bị khoá thì đóng luôn:
       để một ô nhập đứng sau màn hình khoá là tự mâu thuẫn. */
    document.addEventListener("cysim:session", () => {
      chiMuc = null;
      if (dangBiKhoa()) dong();
    });
  }

  return {
    init: init,
    mo: mo,
    dong: dong,
    loc: loc,
    chiMuc: () => (chiMuc || (chiMuc = dungChiMuc())),
  };
})();
