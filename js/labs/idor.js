/* =========================================================
   CySim — labs/idor.js  ·  phòng lab "Lỗ hổng IDOR / Broken Access Control"

   LÀ GÌ   : Một "API" giả lập trả hồ sơ user theo ID. Học viên đổi ID để
             thấy server không hề kiểm tra quyền.
   CHẠY     : Nhập ID -> bấm Fetch -> tra IDOR_DATA (chỉ có 1, 2, 3). Không
             thấy thì in JSON báo lỗi; thấy thì dựng object rồi JSON.stringify
             (không nối chuỗi thô vào innerHTML, tránh tự gây XSS). ID khác 1
             nghĩa là xem trộm dữ liệu người khác -> kết luận "LỖI PHÂN QUYỀN"
             và hoàn thành nhiệm vụ "idor".
   CHẠM TỚI : #idorInput, #idorFetchBtn, #idorOutput, #idorVerdict; global
             t(), $(), complete().
   ========================================================= */

(function () {
  const IDOR_DATA = {
    1: { id: 1, name: "Nguyễn Văn A", role: "User", email: "vana@gmail.com", balance: "10,000,000 VND" },
    2: { id: 2, name: "Trần Thị Admin", role: "SuperAdmin", email: "admin@cysim.com", balance: "999,999,999 VND", note: "Cấu hình máy chủ: 10.0.0.1" },
    3: { id: 3, name: "Lê Văn Hacker", role: "Banned", email: "hacker@darkweb.com", balance: "0 VND", note: "Đối tượng tình nghi" },
  };

  $("idorFetchBtn").addEventListener("click", () => {
    const requested = $("idorInput").value.trim();
    const output = $("idorOutput");
    const verdict = $("idorVerdict");
    const data = Object.prototype.hasOwnProperty.call(IDOR_DATA, requested) ? IDOR_DATA[requested] : null;

    if (!data) {
      output.textContent = `{
  "status": "error",
  "message": "${t("Không tìm thấy người dùng có ID:")} ${requested}"
}`;
      verdict.className = "verdict";
      return;
    }

    // Dựng JSON bằng DOM rồi serialize: không bao giờ nhúng chuỗi thô vào innerHTML
    const record = {
      user_id: data.id,
      name: data.name,
      role: data.role,
      email: data.email,
      balance: data.balance,
    };
    if (data.note) record.secret_note = data.note;
    output.textContent = JSON.stringify({ status: "success", data: record }, null, 2);

    if (requested !== "1") {
      verdict.className = "verdict show bad";
      verdict.textContent = t("LỖI PHÂN QUYỀN — Bạn vừa xem dữ liệu của người dùng khác!");
      complete("idor", "Đã khai thác lỗi Broken Access Control (IDOR)");
    } else {
      verdict.className = "verdict";
    }
  });
})();
