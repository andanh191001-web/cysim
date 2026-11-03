/* =========================================================
   CySim — labs/csrf.js  ·  phòng lab "CSRF: request ẩn đánh cắp phiên"

   LÀ GÌ   : Một "tài khoản ngân hàng" 10.000.000 VND, một trang quà tặng giả
             mạo, BA cửa tấn công thật (form POST / fetch JSON / link GET), và
             bốn công tắc cấu hình. Kết quả không nằm trong kịch bản nào cả:
             nó DO HÀM TÍNH ra từ ba quy tắc trình duyệt đang áp dụng thật
             (SameSite, cờ Secure, preflight CORS) cộng hai lớp kiểm tra phía
             máy chủ (CSRF token, Origin). Đổi SameSite sang Strict là ba cửa
             chết ngay — không cần ai viết thêm một dòng "thành công" thứ hai.
   CHẠY     : chọn #csrfSame + ba checkbox -> bấm #csrfAttackBtn (form),
             #csrfFetchBtn (fetch) hoặc #csrfLinkBtn (GET) -> phanTich() trả
             {cookieDi, lyDoCookie, ma, lyDoServer, thanhCong} -> goiTin() dựng
             đúng gói tin sẽ đi (có dòng Cookie hay không, có OPTIONS trước hay
             không) rồi CyUtil.logLine in dần -> kết luận. #csrfLockBtn chạy
             CÙNG hàm đó cho cả ba cửa và in bảng, tức phần "phòng thủ" được
             kiểm bằng liệt kê chứ không bằng lời hứa. Hoàn thành csrf khi học
             viên đã thấy một cửa ăn thật VÀ đã tìm ra cấu hình chặn cả ba cửa.
             Đổi một trong bốn công tắc là bắt đầu thí nghiệm MỚI: dump đang chạy
             bị bỏ giữa chừng (token `lanChay`, vì hai lượt 140 ms/dòng từng CHỒNG
             LÊN NHAU thật ngoài trình duyệt) và số dư trả về 10.000.000 VND.
   AN TOÀN  : Không có giao dịch thật, không request nào ra khỏi máy — mọi gói
             tin chỉ là chữ trên màn hình, số dư tụt là hiệu ứng DOM.
   CHẠM TỚI : #csrfSame #csrfSecure #csrfTokenCheck #csrfOriginCheck
             #csrfAttackBtn #csrfFetchBtn #csrfLinkBtn #csrfLockBtn #csrfTerm
             #csrfMatrix #csrfVerdict #bankBalance; global t(), $(), document,
             CyUtil, complete(); đăng ký Labs.csrf.paint (vẽ lại select + bảng
             khi đổi ngôn ngữ) và Labs.csrf.pure (quyDinhTrinhDuyet /
             quyetDinhServer / phanTich / baCua / chanCaBa) để test/labs.test.js
             chốt bảng chân lý bằng số, không bằng cảm giác.
   ========================================================= */

(function () {
  /* Ba cửa, mô tả đúng ba cách một trang lạ có thể làm trình duyệt gửi request
     tới nhà băng. "preflight" = Content-Type không thuộc danh sách safelisted
     của CORS, nên browser buộc phải hỏi OPTIONS trước. "top" = request là một
     điều hướng cấp cửa sổ (navigation), điều mà SameSite=Lax phân biệt với
     request trong trang. */
  const CUA = {
    form: { method: "POST", duong: "/transfer", ctype: "application/x-www-form-urlencoded", preflight: false, top: true },
    fetch: { method: "POST", duong: "/transfer", ctype: "application/json", preflight: true, top: false },
    link: { method: "GET", duong: "/transfer?amount=9000000&to_account=hacker_acc", ctype: null, preflight: false, top: true },
  };
  const DANH_SACH = ["form", "fetch", "link"];
  const MAY_CHU = "cysim-bank.com";
  const KE_LANG = "https://qua-tang.example";

  /* Luật TRÌNH DUYỆT: cookie phiên có được đính vào request cross-site không.
     Trả về MÃ, không trả câu chữ — câu chữ do bangLyDo dịch lúc in, nên bảng
     chân lý kiểm thử được ở mọi ngôn ngữ và vẫn cùng một kết luận.
     SameSite lạ/blank được coi là Lax đúng như browser hiện đại làm. */
  function quyDinhTrinhDuyet(ten, sameSite, secure) {
    const cua = CUA[ten];
    if (sameSite === "None" && !secure) return { di: false, lyDo: "none_thieu_secure" };
    if (cua.preflight) return { di: false, lyDo: "preflight" };
    if (sameSite === "Strict") return { di: false, lyDo: "strict" };
    if (sameSite !== "None") {
      return cua.top && cua.method === "GET"
        ? { di: true, lyDo: "lax_navigation_get" }
        : { di: false, lyDo: "lax_keo_theo_post" };
    }
    return { di: true, lyDo: "none_secure_gui" };
  }

  /* Luật MÁY CHỦ khi gói tin tới nơi. Không cookie thì server chỉ thấy một
     request vô danh -> 401, giao dịch không chạy. Có cookie thì tới lượt hai
     lớp kiểm tra; kẻ tấn công KHÔNG đọc được DOM của trang bank nên không thể
     biết token mà gửi kèm — đó là toàn bộ sức mạnh của CSRF token. */
  function quyetDinhServer(cookieDi, coToken, coOrigin) {
    if (!cookieDi) return { ma: 401, lyDo: "khong_phien", thanhCong: false };
    if (coToken) return { ma: 403, lyDo: "thieu_token", thanhCong: false };
    if (coOrigin) return { ma: 403, lyDo: "sai_origin", thanhCong: false };
    return { ma: 200, lyDo: "chap_nhan", thanhCong: true };
  }

  function phanTich(cauHinh, ten) {
    const tr = quyDinhTrinhDuyet(ten, cauHinh.sameSite, cauHinh.secure);
    const sv = quyetDinhServer(tr.di, cauHinh.coToken, cauHinh.coOrigin);
    return Object.assign({ cua: ten, cookieDi: tr.di, lyDoCookie: tr.lyDo }, sv);
  }

  const baCua = (cauHinh) => DANH_SACH.map((ten) => phanTich(cauHinh, ten));
  const chanCaBa = (cauHinh) => baCua(cauHinh).every((r) => !r.thanhCong);

  /* Mã -> câu có dấu, gọi lúc in chứ không lúc nạp: ngôn ngữ đổi sau khi file
     này chạy. Số HTTP và tên kỹ thuật (SameSite, OPTIONS, Origin) giữ nguyên
     trong mọi thứ tiếng — dịch "POST" ra tiếng Pháp thì không còn là POST. */
  const LY_DO = {
    none_thieu_secure: () => t("cookie chưa từng được lưu: SameSite=None bắt buộc phải kèm cờ Secure."),
    preflight: () => t("Content-Type application/json buộc trình duyệt gửi OPTIONS trước; nhà băng không mở CORS cho trang lạ nên gói thật không bao giờ đi."),
    strict: () => t("SameSite=Strict giữ cookie ở lại: request sinh ra từ trang khác không được đính kèm."),
    lax_navigation_get: () => t("SameSite=Lax vẫn đính cookie cho navigation GET — mà link của kẻ tấn công đúng là một navigation GET."),
    lax_keo_theo_post: () => t("SameSite=Lax chỉ tha cho navigation GET; request cross-site này bị giữ cookie lại."),
    none_secure_gui: () => t("SameSite=None kèm Secure: cookie được đính cả cho request từ trang khác."),
    khong_phien: () => t("máy chủ không thấy cookie phiên nào, trả 401 và bỏ giao dịch."),
    thieu_token: () => t("máy chủ bắt buộc CSRF token; request giả không có token nên bị 403."),
    sai_origin: () => t("máy chủ kiểm tra Origin và thấy nó thuộc trang quà tặng -> 403."),
    chap_nhan: () => t("máy chủ thấy cookie hợp lệ và không kiểm tra thêm gì -> 200, giao dịch chạy."),
  };
  const loi = (ma) => (LY_DO[ma] ? LY_DO[ma]() : ma);

  const docCauHinh = () => ({
    sameSite: $("csrfSame").value || "Lax",
    secure: $("csrfSecure").checked === true,
    coToken: $("csrfTokenCheck").checked === true,
    coOrigin: $("csrfOriginCheck").checked === true,
  });

  /* OPTION bị i18n bỏ qua (SKIP_TAGS), nên nhãn do JS vẽ lại khi đổi ngôn ngữ —
     cùng khuôn với #aiDepth. Giá trị vẫn là mã kỹ thuật, không bao giờ dịch. */
  const NHAN_SAME = [
    ["Strict", () => t("Strict — không gửi cookie sang trang khác")],
    ["Lax", () => t("Lax — chỉ gửi cho navigation GET (mặc định của trình duyệt)")],
    ["None", () => t("None — gửi mọi nơi, bắt buộc kèm Secure")],
  ];

  function veSelect() {
    const sel = $("csrfSame");
    const dangChon = sel.value || "Lax";
    sel.replaceChildren(...NHAN_SAME.map(([gia, nhan]) => {
      const o = document.createElement("option");
      o.value = gia;
      o.textContent = nhan();
      return o;
    }));
    sel.value = dangChon;
  }

  /* Dựng gói tin theo kết quả phân tích: dòng Cookie có mặt hay bị gạch, có
     OPTIONS trước hay không. Đây là chỗ lab "dạy thật" thay vì "dạy giả": học
     viên thấy chính cú pháp giao dịch thay đổi theo cấu hình mình chọn. */
  function goiTin(r) {
    const cua = CUA[r.cua];
    const dong = [];
    if (cua.preflight) {
      dong.push(["t-muted", `OPTIONS ${cua.duong} HTTP/1.1`]);
      dong.push(["t-muted", `Origin: ${KE_LANG}`]);
      dong.push(["t-muted", "Access-Control-Request-Method: POST"]);
      dong.push(["t-err", t("HTTP/1.1 403 Forbidden (thiếu Access-Control-Allow-Origin cho origin này)")]);
      dong.push(["t-muted", "--------------------------------"]);
    }
    dong.push(["t-muted", `${cua.method} ${cua.duong} HTTP/1.1`]);
    dong.push(["t-muted", `Host: ${MAY_CHU}`]);
    if (!cua.preflight) dong.push(["t-warn", `Origin: ${KE_LANG}`]);
    if (cua.ctype) dong.push(["t-muted", `Content-Type: ${cua.ctype}`]);
    dong.push(r.cookieDi
      ? ["t-ok", "Cookie: session=abc123xyz"]
      : ["t-err", `Cookie: ${t("(trình duyệt không đính)")}`]);
    dong.push(["t-muted", ""]);
    dong.push(["t-muted", r.cua === "link" ? t("(tham số nằm ngay trên URL)") : "amount=9000000&to_account=hacker_acc"]);
    dong.push(["t-muted", "--------------------------------"]);
    dong.push([r.thanhCong ? "t-ok" : "t-err",
      `HTTP/1.1 ${r.ma} ${r.ma === 200 ? "OK" : r.ma === 401 ? "Unauthorized" : "Forbidden"}`]);
    return dong;
  }

  let daAn = false;
  let daPhongThu = false;
  /* Số thứ tự lượt in. Mỗi dòng gói tin cách nhau 140ms, nên bấm cửa khác khi
     lượt cũ chưa hết là hai lần tang chứng CHỒNG LÊN NHAU (đã thấy thật trong
     trình duyệt: dòng "Cookie: session=..." của lượt cũ rơi vào giữa dump của
     lượt mới). Lượt mới tăng số này -> vòng lặp cũ thấy khác bèn dừng. */
  let lanChay = 0;

  async function tanCong(ten) {
    const c = docCauHinh();
    const r = phanTich(c, ten);
    const term = $("csrfTerm");
    const luot = ++lanChay;
    term.replaceChildren();
    for (const [cls, text] of goiTin(r)) {
      if (luot !== lanChay) return r;
      CyUtil.logLine(term, cls, text);
      await CyUtil.sleep(140);
    }
    if (luot !== lanChay) return r;
    const verdict = $("csrfVerdict");
    const bal = $("bankBalance");
    if (r.thanhCong) {
      bal.textContent = "1,000,000 VND";
      bal.style.color = "var(--red)";
      verdict.className = "verdict show bad";
      verdict.textContent =
        t("CSRF THÀNH CÔNG — Kẻ tấn công đã lừa trình duyệt chuyển 9,000,000 VND!") +
        ` · ${ten} · ` + loi(r.lyDo);
      daAn = true;
    } else {
      bal.style.color = "";
      verdict.className = "verdict show warn";
      verdict.textContent =
        t("CSRF THẤT BẠI") + ` · ${ten} · ` + (r.cookieDi ? loi(r.lyDo) : loi(r.lyDoCookie));
    }
    xetNhiemVu(c);
    return r;
  }

  /* Bảng "cả ba cửa" — dùng đúng phanTich() nói trên, nên không thể có chuyện
     một cửa hiện xanh trong khi hàm tính ra nó ăn. */
  function veBang(c) {
    const matrix = $("csrfMatrix");
    matrix.replaceChildren(...baCua(c).map((r) => {
      const dong = document.createElement("div");
      dong.className = "opt";
      const trang = document.createElement("strong");
      trang.textContent = r.cua;
      const chu = document.createElement("span");
      chu.className = r.thanhCong ? "inj" : "val";
      chu.textContent = " — " + (r.thanhCong ? t("Cửa này ăn") : t("Cửa này bị chặn")) +
        ": " + (r.cookieDi ? loi(r.lyDo) : loi(r.lyDoCookie));
      dong.replaceChildren(trang, chu);
      return dong;
    }));
    return matrix;
  }

  function xetNhiemVu(c) {
    if (daAn && chanCaBa(c)) daPhongThu = true;
    if (daAn && daPhongThu) complete("csrf", "Đã hiểu cả lỗ hổng lẫn cách bịt CSRF");
  }

  function paint() {
    veSelect();
    veBang(docCauHinh());
  }

  $("csrfAttackBtn").addEventListener("click", () => tanCong("form"));
  $("csrfFetchBtn").addEventListener("click", () => tanCong("fetch"));
  $("csrfLinkBtn").addEventListener("click", () => tanCong("link"));
  $("csrfLockBtn").addEventListener("click", () => {
    const c = docCauHinh();
    veBang(c);
    const verdict = $("csrfVerdict");
    if (chanCaBa(c)) {
      verdict.className = "verdict show good";
      verdict.textContent = t("PHÒNG THỦ ĐỨNG — với cấu hình này cả ba cửa đều chết.");
    } else {
      verdict.className = "verdict show warn";
      verdict.textContent = t("Vẫn còn cửa sống: ") + baCua(c).filter((r) => r.thanhCong).map((r) => r.cua).join(", ");
    }
    xetNhiemVu(c);
  });
  ["csrfSame", "csrfSecure", "csrfTokenCheck", "csrfOriginCheck"].forEach((id) =>
    $(id).addEventListener("change", () => {
      veBang(docCauHinh());
      const v = $("csrfVerdict");
      v.className = "verdict";
      v.textContent = "";
      /* Đổi cấu hình là bắt đầu một thí nghiệm mới: tiền phải về 10.000.000,
         nếu không lần thất bại sau đó vẫn in số dư đỏ của lần thành công trước
         và học viên kết luận sai rằng mình lại bị mất tiền. */
      const bal = $("bankBalance");
      bal.textContent = "10,000,000 VND";
      bal.style.color = "";
    })
  );

  veSelect();
  veBang(docCauHinh());
  /* Nhãn của select và bảng câu chữ do JS sinh, mà OPTION bị i18n bỏ qua — nên
     phải tự vẽ lại khi đổi ngôn ngữ, kể cả lần thứ hai khi từ điển kịp về
     (boot dispatch sự kiện này hai lần). */
  document.addEventListener("cysim:language", paint);

  Labs.csrf = {
    paint,
    pure: { quyDinhTrinhDuyet, quyetDinhServer, phanTich, baCua, chanCaBa, DANH_SACH },
  };
})();
