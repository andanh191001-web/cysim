/* =========================================================
   CySim — labs/idor.js  ·  phòng lab "Lỗ hổng IDOR / Broken Access Control"

   LÀ GÌ   : Sáu ID và một "máy chủ" chỉ trả lời theo LUẬT do người học chọn,
             không theo kịch bản có sẵn. Bốn chế độ phân quyền (không kiểm tra /
             chỉ kiểm tra đã đăng nhập / kiểm tra chủ sở hữu / kiểm tra theo vai
             trò) × một công tắc "phiên này đã đăng nhập chưa". Hai chế độ đầu
             VẪN để lộ hồ sơ người khác — đó chính là bài học: đã đăng nhập
             không có nghĩa là đã có quyền.
   CHẠY     : chọn #idorMode + #idorLoggedIn -> nhập ID vào #idorInput rồi bấm
             #idorFetchBtn, hoặc bấm #idorScanBtn để vẽ bảng sáu ID. quyetDinh()
             trả {ma, lyDo, roRi} cho từng ID; bản ghi chỉ in khi ma === 200 và
             được dựng bằng JSON.stringify (không nối chuỗi thô vào innerHTML,
             tránh tự gây XSS cho chính lab). #idorLockBtn chấm lại bằng quet()
             và nói thẳng chế độ hiện tại còn lộ hay đã kín. Hoàn thành idor khi
             học viên đã đọc được hồ sơ của người khác ở chế độ hở VÀ đã tìm ra
             chế độ quét sạch không lộ.
   AN TOÀN  : Số liệu hoàn toàn giả, không có API thật, không request nào rời
             trang. Hồ sơ admin chứa ghi chú nội bộ giả để người học thấy hậu
             quả của việc lộ trường bí mật.
   CHẠM TỚI : #idorMode #idorLoggedIn #idorInput #idorFetchBtn #idorScanBtn
             #idorLockBtn #idorOutput #idorLog #idorVerdict; global t(), $(),
             document, complete(); đăng ký Labs.idor.paint (vẽ lại select + bảng
             khi đổi ngôn ngữ) và Labs.idor.pure (quyetDinh / quet / khongRoRi /
             DANH_SACH_ID) để test/labs.test.js chốt rằng không chế độ nào âm
             thầm quay lại hành vi cũ.
   ========================================================= */

(function () {
  /* Bạn là user_id=2. ID 5 là admin có trường bí mật, ID 6 không tồn tại — để
     người học phân biệt 404 (không có) với 403 (có nhưng không được xem), hai
     câu trả lời mà một API thật để lộ khác nhau rất nhiều. */
  const HO_SO = {
    1: { user_id: 1, name: "Nguyễn Văn A", role: "User", email: "vana@gmail.com", balance: "10,000,000 VND" },
    2: { user_id: 2, name: "nguyenvana", role: "User", email: "vana@mail.com", balance: "10,000,000 VND" },
    3: { user_id: 3, name: "Trần Thị B", role: "User", email: "thib@mail.com", balance: "250,000 VND" },
    4: { user_id: 4, name: "Lê Văn Hacker", role: "Banned", email: "hacker@darkweb.com", balance: "0 VND", secret_note: "Tài khoản đang bị điều tra" },
    5: { user_id: 5, name: "Trần Thị Admin", role: "SuperAdmin", email: "admin@cysim.com", balance: "999,999,999 VND", secret_note: "Cấu hình máy chủ: 10.0.0.1" },
  };
  const DANH_SACH_ID = [1, 2, 3, 4, 5, 6];
  const BAN = { id: 2, vaiTro: "User" };

  /* Máy chủ giả, nhưng luật là luật thật của access control:
     401 không có phiên / 403 có phiên nhưng không có quyền / 404 không có bản
     ghi. roRi = 200 trên hồ sơ của NGƯỜI KHÁC — đó là định nghĩa IDOR. */
  function quyetDinh(cauHinh, idYeuCau) {
    const so = Number(idYeuCau);
    const coBanGhi = Object.prototype.hasOwnProperty.call(HO_SO, so);
    if (cauHinh.mode === "khong") {
      if (!coBanGhi) return { ma: 404, lyDo: "khong_ton_tai", roRi: false };
      return { ma: 200, lyDo: "khong_hoi_gi", roRi: so !== BAN.id };
    }
    if (cauHinh.dangNhap !== true) return { ma: 401, lyDo: "khong_phien", roRi: false };
    if (!coBanGhi) return { ma: 404, lyDo: "khong_ton_tai", roRi: false };
    if (cauHinh.mode === "dangnhap") return { ma: 200, lyDo: "chi_hoi_dang_nhap", roRi: so !== BAN.id };
    if (cauHinh.mode === "vaiTro" && BAN.vaiTro === "SuperAdmin") {
      return { ma: 200, lyDo: "vai_tro_admin", roRi: so !== BAN.id };
    }
    /* chuSoHuu, và vaiTro khi đang là User: chỉ hồ sơ của chính mình. */
    return so === BAN.id
      ? { ma: 200, lyDo: "dung_chu", roRi: false }
      : { ma: 403, lyDo: cauHinh.mode === "vaiTro" ? "vai_tro_khong_du" : "khong_phai_cua_minh", roRi: false };
  }

  const quet = (cauHinh) => DANH_SACH_ID.map((id) => Object.assign({ id }, quyetDinh(cauHinh, id)));
  const khongRoRi = (cauHinh) => quet(cauHinh).every((r) => !r.roRi);

  const LY_DO = {
    khong_phien: () => t("máy chủ hỏi đã đăng nhập chưa, và lần này là chưa."),
    khong_ton_tai: () => t("không có hồ sơ nào mang ID này."),
    khong_hoi_gi: () => t("máy chủ không hề hỏi ai đang xem."),
    chi_hoi_dang_nhap: () => t("máy chủ chỉ kiểm tra có phiên hợp lệ, không kiểm tra quyền trên từng bản ghi — vẫn là IDOR."),
    dung_chu: () => t("đúng là hồ sơ của bạn nên máy chủ cho xem."),
    khong_phai_cua_minh: () => t("máy chủ so user_id của phiên với ID xin xem, không khớp -> 403."),
    vai_tro_admin: () => t("vai trò SuperAdmin của bạn được đọc mọi hồ sơ."),
    vai_tro_khong_du: () => t("vai trò User không đủ quyền đọc hồ sơ của người khác."),
  };
  const loi = (ma) => (LY_DO[ma] ? LY_DO[ma]() : ma);

  const NHAN_MODE = [
    ["khong", () => t("Không kiểm tra gì")],
    ["dangnhap", () => t("Chỉ kiểm tra đã đăng nhập")],
    ["chuSoHuu", () => t("Kiểm tra chủ sở hữu (user_id của phiên)")],
    ["vaiTro", () => t("Phân quyền theo vai trò (RBAC)")],
  ];

  const docCauHinh = () => ({
    mode: $("idorMode").value || "khong",
    dangNhap: $("idorLoggedIn").checked !== false,
  });

  /* OPTION bị i18n bỏ qua (SKIP_TAGS) nên nhãn do JS vẽ, cùng khuôn #aiDepth;
     giá trị vẫn là mã kỹ thuật, không bao giờ dịch. */
  function veSelect() {
    const sel = $("idorMode");
    const dangChon = sel.value || "khong";
    sel.replaceChildren(...NHAN_MODE.map(([gia, nhan]) => {
      const o = document.createElement("option");
      o.value = gia;
      o.textContent = nhan();
      return o;
    }));
    sel.value = dangChon;
  }

  function troVeJson(id) {
    const d = HO_SO[Number(id)];
    const record = { user_id: d.user_id, name: d.name, role: d.role, email: d.email, balance: d.balance };
    /* Ghi chú nội bộ là chữ người đọc, không phải định dạng máy: dịch nó, kể
       cả khi nó nằm trong một khối JSON. Tên người và email giữ nguyên văn. */
    if (d.secret_note) record.secret_note = t(d.secret_note);
    return JSON.stringify({ status: "success", data: record }, null, 2);
  }

  /* Bảng sáu ID dùng đúng quyetDinh() mà nút "Truy cập" dùng, nên không thể có
     chuyện một hàng hiện xanh trong khi hàm tính ra nó lộ. */
  function veBangQuet(c) {
    const log = $("idorLog");
    const cach = { 200: "t-ok", 403: "t-warn", 401: "t-warn", 404: "t-muted" };
    log.replaceChildren(...quet(c).map((r) => {
      const dong = document.createElement("div");
      dong.className = "opt";
      const ma = document.createElement("strong");
      ma.textContent = `GET /profile?user_id=${r.id} -> ${r.ma}`;
      const chu = document.createElement("span");
      chu.className = r.roRi ? "inj" : cach[r.ma] || "t-muted";
      chu.textContent = " — " + (r.roRi
        ? t("LỘ hồ sơ của người khác") + ": " + loi(r.lyDo)
        : r.ma === 200 ? t("hồ sơ của chính bạn") : loi(r.lyDo));
      dong.replaceChildren(ma, chu);
      return dong;
    }));
  }

  let daRoi = false;
  let daKin = false;

  function layHoSo() {
    const c = docCauHinh();
    const thu = $("idorInput").value.trim();
    const r = quyetDinh(c, thu);
    const out = $("idorOutput");
    const verdict = $("idorVerdict");
    out.textContent = r.ma === 200
      ? troVeJson(thu)
      : JSON.stringify({
        status: "error",
        code: r.ma,
        message: r.ma === 401 ? t("Chưa có phiên đăng nhập hợp lệ") : r.ma === 404 ? t("Không tìm thấy người dùng có ID:") + " " + thu : t("Bạn không có quyền xem hồ sơ này"),
      }, null, 2);
    if (r.roRi) {
      daRoi = true;
      verdict.className = "verdict show bad";
      verdict.textContent = t("LỖI PHÂN QUYỀN — Bạn vừa xem dữ liệu của người dùng khác!") + " · " + loi(r.lyDo);
    } else {
      verdict.className = r.ma === 200 ? "verdict show good" : "verdict show warn";
      verdict.textContent = (r.ma === 200 ? t("ĐÚNG QUYỀN — đây là hồ sơ của bạn.") : t("BỊ CHẶN")) + " · " + loi(r.lyDo);
    }
    veBangQuet(c);
    xetNhiemVu(c);
    return r;
  }

  function xetNhiemVu(c) {
    if (daRoi && khongRoRi(c)) daKin = true;
    if (daRoi && daKin) complete("idor", "Đã hiểu IDOR và đã chọn đúng chế độ phân quyền");
  }

  function paint() {
    veSelect();
    veBangQuet(docCauHinh());
  }

  $("idorFetchBtn").addEventListener("click", layHoSo);
  $("idorScanBtn").addEventListener("click", () => veBangQuet(docCauHinh()));
  $("idorLockBtn").addEventListener("click", () => {
    const c = docCauHinh();
    veBangQuet(c);
    const verdict = $("idorVerdict");
    const soLo = quet(c).filter((r) => r.roRi).length;
    if (soLo === 0) {
      verdict.className = "verdict show good";
      verdict.textContent = t("CHẾ ĐỘ KÍN — quét cả sáu ID không lộ hồ sơ của ai khác.");
    } else {
      verdict.className = "verdict show bad";
      verdict.textContent = t("Số hồ sơ của người khác vẫn bị lộ:") + " " + soLo;
    }
    xetNhiemVu(c);
  });
  ["idorMode", "idorLoggedIn"].forEach((id) =>
    $(id).addEventListener("change", () => veBangQuet(docCauHinh()))
  );

  veSelect();
  veBangQuet(docCauHinh());
  document.addEventListener("cysim:language", paint);

  Labs.idor = {
    paint,
    pure: { quyetDinh, quet, khongRoRi, DANH_SACH_ID },
  };
})();
