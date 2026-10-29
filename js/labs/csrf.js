/* =========================================================
   CySim — labs/csrf.js  ·  phòng lab "CSRF: request ẩn đánh cắp phiên"

   LÀ GÌ   : Một "tài khoản ngân hàng" 1.000.000 VND và một trang bên thứ
             ba giả mạo. Học viên thấy trình duyệt gửi request kèm cookie
             mà không hỏi ai cả. Không có giao dịch thật nào xảy ra.
   CHẠY     : Bấm nút tấn công -> in dần 9 dòng log qua CyUtil.logLine
             (dòng có say() thì qua t() để dịch, dòng raw giữ nguyên như
             "POST /transfer HTTP/1.1") -> số dư 10.000.000 VND tụt còn
             1.000.000 -> kết luận CSRF THÀNH CÔNG -> hoàn thành csrf.
   CHẠM TỚI : #csrfAttackBtn, #csrfTerm, #bankBalance, #csrfVerdict;
             global t(), $(), complete(); không đăng ký Labs.* — hết log
             là dừng, không có timer nào phải dọn.
   ========================================================= */

(function () {
  /* Chỉ dòng chữ nghĩa dành cho người học mới đi qua t(). "POST /transfer
     HTTP/1.1", "Host: cysim-bank.com", "Cookie: session=..." là log kỹ thuật
     mô phỏng đúng gói tin thật: dịch chúng ra tiếng Pháp thì không còn là gói
     tin nữa, và mỗi lần chạy lab là thêm vài khoá vô nghĩa vào hàng đợi dịch
     máy. Vì vậy dòng cần dịch gói trong say() (t() chạy lúc bấm nút, khi giao
     diện đã biết ngôn ngữ), dòng kỹ thuật để raw. */
  const REQUEST_LOG = [
    { cls: "t-err", say: () => t("[!] Đang gửi request ẩn...") },
    { cls: "t-muted", raw: "POST /transfer HTTP/1.1" },
    { cls: "t-muted", raw: "Host: cysim-bank.com" },
    { cls: "t-warn", raw: "Cookie: session=abc123xyz" },
    { cls: "t-muted", raw: "" },
    { cls: "t-muted", raw: "amount=9000000&to_account=hacker_acc" },
    { cls: "t-muted", raw: "--------------------------------" },
    { cls: "t-ok", say: () => t("[✓] Trình duyệt tự động đính kèm Cookie hợp lệ!") },
    { cls: "t-ok", say: () => t("[✓] Giao dịch thành công!") },
  ];

  $("csrfAttackBtn").addEventListener("click", async () => {
    const term = $("csrfTerm");
    term.replaceChildren();
    for (const line of REQUEST_LOG) {
      CyUtil.logLine(term, line.cls, line.say ? line.say() : line.raw);
      await CyUtil.sleep(180);
    }
    const balance = $("bankBalance");
    balance.textContent = "1,000,000 VND";
    balance.style.color = "var(--red)";
    const verdict = $("csrfVerdict");
    verdict.className = "verdict show bad";
    verdict.textContent = t("CSRF THÀNH CÔNG — Kẻ tấn công đã lừa trình duyệt chuyển 9,000,000 VND!");
    complete("csrf", "Đã mô phỏng tấn công CSRF");
  });
})();
