/* =========================================================
   CySim — labs/siem.js  ·  phòng lab "Phân tích log SIEM (SOC Analyst)"

   LÀ GÌ   : 20 dòng nhật ký máy chủ giả lập, trong đó ẩn 3 cuộc tấn công
             (brute force, SQL Injection, XSS). Người học đóng vai analyst.
   CHẠY     : render() dựng danh sách từ SIEM_LOGS -> bấm một dòng để đánh
             dấu "flagged" -> "Submit" đếm số loại tấn công đã bắt và số dòng
             normal bị đánh dấu sai: đủ 3 loại và 0 dòng sai thì XUẤT SẮC và
             hoàn thành nhiệm vụ "siem", ngược lại in gợi ý. "Reset" dựng lại
             danh sách từ đầu.
   CHẠM TỚI : #siemLogList, #siemCount, #siemSubmit, #siemReset, #siemVerdict;
             global t(), $(), complete(); đăng ký Labs.siem = { render,
             resetVerdict }. resetVerdict chỉ xoá dòng kết luận, giữ nguyên
             chỗ người dùng đang đánh dấu dở.
   ========================================================= */

(function () {
  const ATTACKS_TO_FIND = 3;

  const SIEM_LOGS = [
    { t: "INFO", time: "08:15:22", ip: "192.168.1.10", msg: "sshd: Accepted password for admin from 192.168.1.10 port 22" },
    { t: "INFO", time: "08:15:30", ip: "192.168.1.10", msg: "httpd: GET /index.html 200 (12ms)" },
    { t: "INFO", time: "08:15:35", ip: "10.0.0.5", msg: "cron: backup daily task completed" },
    { t: "WARN", time: "08:15:41", ip: "45.33.12.8", msg: "sshd: Failed password for root from 45.33.12.8 port 43210", threat: "brute" },
    { t: "WARN", time: "08:15:42", ip: "45.33.12.8", msg: "sshd: Failed password for root from 45.33.12.8 port 43211", threat: "brute" },
    { t: "WARN", time: "08:15:43", ip: "45.33.12.8", msg: "sshd: Failed password for root from 45.33.12.8 port 43212", threat: "brute" },
    { t: "WARN", time: "08:15:44", ip: "45.33.12.8", msg: "sshd: Failed password for root from 45.33.12.8 port 43213", threat: "brute" },
    { t: "WARN", time: "08:15:45", ip: "45.33.12.8", msg: "sshd: Failed password for admin from 45.33.12.8 port 43214", threat: "brute" },
    { t: "INFO", time: "08:15:50", ip: "192.168.1.20", msg: "httpd: GET /about 200" },
    { t: "INFO", time: "08:15:55", ip: "192.168.1.20", msg: "httpd: GET /contact 200" },
    { t: "CRIT", time: "08:16:10", ip: "103.55.7.99", msg: "httpd: GET /login?user=admin%27+OR+%271%27%3D%271&pass=x (suspicious payload)", threat: "sqli" },
    { t: "INFO", time: "08:16:12", ip: "192.168.1.10", msg: "httpd: GET /products 200" },
    { t: "INFO", time: "08:16:15", ip: "10.0.0.7", msg: "db: SELECT * FROM orders WHERE id=1234" },
    { t: "CRIT", time: "08:16:18", ip: "103.55.7.99", msg: "httpd: POST /comment body=<script>alert(document.cookie)</script> (blocked by WAF?)", threat: "xss" },
    { t: "INFO", time: "08:16:22", ip: "192.168.1.20", msg: "httpd: POST /login 302" },
    { t: "INFO", time: "08:16:30", ip: "10.0.0.5", msg: "cron: log rotation started" },
    { t: "INFO", time: "08:16:35", ip: "192.168.1.10", msg: "httpd: GET /dashboard 200" },
    { t: "INFO", time: "08:16:40", ip: "10.0.0.5", msg: "systemd: service nginx reloaded" },
    { t: "WARN", time: "08:16:45", ip: "45.33.12.8", msg: "sshd: Failed password for oracle from 45.33.12.8 port 43220", threat: "brute" },
    { t: "INFO", time: "08:16:50", ip: "192.168.1.20", msg: "httpd: GET /favicon.ico 200" },
  ];

  const LEVEL_CLASS = { CRIT: "lvl-crit", WARN: "lvl-warn", INFO: "lvl-info" };

  function render() {
    const container = $("siemLogList");
    container.replaceChildren(
      ...SIEM_LOGS.map((log) => {
        const line = document.createElement("div");
        line.className = "siem-line";
        line.dataset.threat = log.threat || "";

        const ts = document.createElement("span");
        ts.className = "ts";
        ts.textContent = "2026-10-17 " + log.time;

        const level = document.createElement("span");
        level.className = LEVEL_CLASS[log.t] || "lvl-info";
        level.textContent = "[" + log.t + "]";

        const source = document.createElement("span");
        source.className = "siem-ip";
        source.textContent = log.ip;

        const message = document.createElement("span");
        message.textContent = " — " + log.msg;

        line.append(ts, level, source, message);
        line.addEventListener("click", () => {
          line.classList.toggle("flagged");
          paintCount();
        });
        return line;
      })
    );
    paintCount();
  }

  const paintCount = () => {
    $("siemCount").textContent = String(document.querySelectorAll(".siem-line.flagged").length);
  };

  $("siemSubmit").addEventListener("click", () => {
    const flagged = document.querySelectorAll(".siem-line.flagged");
    const wrong = [...flagged].filter((el) => !el.dataset.threat).length;
    const found = new Set([...flagged].map((el) => el.dataset.threat).filter(Boolean));
    const verdict = $("siemVerdict");

    if (found.size === ATTACKS_TO_FIND && wrong === 0) {
      verdict.className = "verdict show good";
      verdict.textContent = t("XUẤT SẮC — Bạn đã phát hiện chính xác 3 cuộc tấn công (Brute Force, SQLi, XSS)!");
      complete("siem", "Phân tích log SIEM thành công");
      return;
    }
    verdict.className = "verdict show bad";
    // Số liệu đặt ngoài chuỗi dịch để khóa tra từ điển luôn cố định
    verdict.textContent =
      t("Chưa chính xác! ") +
      (found.size < ATTACKS_TO_FIND ? t("Mới phát hiện") + " " + found.size + "/3 " + t("loại tấn công. ") : "") +
      (wrong > 0 ? t("Có") + " " + wrong + " " + t("dòng bị đánh dấu sai (dòng bình thường). ") : "") +
      t("Gợi ý: tìm brute force (nhiều Failed password liên tiếp), SQL Injection (UNION/OR 1=1), và XSS (<script>, onerror=).");
  });

  $("siemReset").addEventListener("click", () => {
    render();
    resetVerdict();
  });

  /* Chỉ dọn dòng kết luận, KHÔNG dựng lại danh sách log: người dùng có thể
     đánh dấu dở, rời trang xem lab khác rồi quay lại thì vẫn phải còn work
     in progress của mình. */
  function resetVerdict() {
    $("siemVerdict").className = "verdict";
  }

  render();

  Labs.siem = { render, resetVerdict };
})();
