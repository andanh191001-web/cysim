/* =========================================================
   CySim — labs/sqli.js  ·  phòng lab "SQL Injection"

   LÀ GÌ   : Một "cơ sở dữ liệu" giả trong trang. Học viên gõ câu truy vấn
             để xem dấu nháy đơn làm đổi ý nghĩa câu SQL ra sao. Không có
             DB thật, không có server.
   CHẠY     : classify() đọc cú pháp thật (dấu nháy đơn đóng hay chưa, gì
             đứng sau nó) rồi phân loại union / orderby / auth-bypass /
             literal / broken — mỗi nhánh in terminal và kết luận riêng.
             Chế độ safe dùng dấu ? (prepared statement) nên chuỗi độc chỉ
             là chữ thường. "Run SQLMap" chỉ gõ log mô phỏng. Đúng một dạng
             tấn công là hoàn thành nhiệm vụ sqli.
   AN TOÀN  : Mọi giá trị người dùng nhập đều được escape trước khi vào
             innerHTML: chứng minh lỗ hổng SQL không có nghĩa là tự mở lỗ
             hổng XSS cho chính trang học.
   CHẠM TỚI : #modeUnsafe, #modeSafe, #sqliInput, #runSqli, #runSqlmap,
             #queryView, #termBody, #dbLeakContainer, #dbTableBody,
             #sqliVerdict, [data-payload]; global t(), $(), CyUtil,
             complete(); đăng ký Labs.sqli.paint để boot.js vẽ lại nhãn
             hai nút chế độ sau khi đổi ngôn ngữ.
   ========================================================= */

(function () {
  const esc = CyUtil.esc;
  let mode = "unsafe";

  function paint() {
    const unsafe = mode === "unsafe";
    $("modeUnsafe").style.cssText = unsafe ? "background:var(--red);border-color:var(--red);color:#fff" : "background:none;color:var(--cyan)";
    $("modeSafe").style.cssText = unsafe ? "" : "background:var(--ok);border-color:var(--ok);color:#04121a";
    $("modeSafe").classList.toggle("ghost", unsafe);
  }

  $("modeUnsafe").addEventListener("click", () => { mode = "unsafe"; paint(); });
  $("modeSafe").addEventListener("click", () => { mode = "safe"; paint(); });

  document.querySelectorAll("[data-payload]").forEach((b) =>
    b.addEventListener("click", () => { $("sqliInput").value = b.dataset.payload; })
  );

  const showQuery = (html) => { $("queryView").innerHTML = html; };

  /* Câu truy vấn thật là  SELECT * FROM users WHERE user = '<input>' AND pass = '***'
     nên chuỗi tiêm mã chỉ đổi được được NGHĨA của câu lệnh khi nó THOÁT khỏi
     dấu nháy đang bọc nó. Bản cũ chỉ cần thấy chữ "UNION SELECT" ở bất kỳ đâu
     là cho rò rỉ dữ liệu — gõ trần "UNION SELECT" thì với SQL đó vẫn chỉ là một
     chuỗi so sánh bình thường, và người học rút ra kết luận sai. */
  function classify(raw) {
    const q = raw.indexOf("'");
    if (q < 0) {
      return /union\s+select|order\s+by|\bor\b/i.test(raw) ? "literal" : "inert";
    }
    const tail = raw.slice(q + 1);
    if (/union\s+select/i.test(tail)) return "union";
    if (/order\s+by\s+\d+/i.test(tail)) return "orderby";
    // admin' --  : đóng chuỗi rồi comment nốt phần kiểm tra mật khẩu
    if (/^\s*(--|#|\/\*)/.test(tail)) return "auth";
    if (/\bor\b/i.test(tail) && (/=|\btrue\b/i.test(tail))) return "auth";
    return "broken";
  }

  $("runSqli").addEventListener("click", async () => {
    const raw = $("sqliInput").value;
    const v = esc(raw);
    const term = $("termBody");
    const leak = $("dbLeakContainer");
    const verdict = $("sqliVerdict");
    leak.style.display = "none";
    verdict.className = "verdict";

    if (mode === "safe") {
      showQuery(`SELECT * FROM users WHERE user = ? AND pass = ?; <span class="val">(${t("Tham số")}: "${v}")</span>`);
      await typeWriter(term, `[-] ${t("Prepared Statement đã xử lý đầu vào như dữ liệu thuần.")}\n[-] ${t("Cấu trúc truy vấn an toàn.")}`, 10);
      verdict.className = "verdict show good";
      verdict.textContent = t("ATTACK BLOCKED — Bảo vệ thành công trước SQL Injection!");
      return;
    }

    const injected = `<span class="inj">${v}</span>`;
    const kind = classify(raw);

    if (kind === "union") {
      showQuery(`SELECT * FROM users WHERE user = '${injected}';`);
      await typeWriter(term, `[+] ${t("Phát hiện payload UNION SELECT!")}
[+] ${t("Đang nối bảng dữ liệu...")}
[+] ${t("Rò rỉ thành công bảng 'users'.")}`, 15);
      leak.style.display = "block";
      $("dbTableBody").innerHTML = `
        <tr><td>1</td><td>admin</td><td>$2y$10$e...Xy2</td><td>SuperAdmin</td></tr>
        <tr><td>2</td><td>nguyenvana</td><td>$2y$10$b...K9z</td><td>User</td></tr>
        <tr><td>3</td><td>tranthib</td><td>$2y$10$c...L4m</td><td>User</td></tr>`;
      verdict.className = "verdict show bad";
      verdict.textContent = t("DATA LEAKED — Rò rỉ toàn bộ bảng Users!");
      complete("sqli", "Đã thử nghiệm SQL Injection (UNION)");
    } else if (kind === "orderby") {
      showQuery(`SELECT * FROM users WHERE user = '${injected}';`);
      await typeWriter(term, `[+] ${t("Phát hiện payload ORDER BY!")}
[+] ${t("Đang thử nghiệm số lượng cột...")}
[+] ${t("Bảng hiện tại có 4 cột.")}`, 15);
      verdict.className = "verdict show bad";
      verdict.textContent = t("COLUMN ENUMERATED — Dò thành công cấu trúc bảng!");
    } else if (kind === "auth") {
      showQuery(`SELECT * FROM users WHERE user = '${injected}' AND pass = '***';`);
      await typeWriter(term, `[+] ${t("Ký tự tiêm mã ngắt câu lệnh thành công!")}
[+] ${t("Bỏ qua xác thực mật khẩu!")}`, 15);
      verdict.className = "verdict show bad";
      verdict.textContent = t("ACCESS GRANTED — Bẻ gãy logic thành công!");
      complete("sqli", "Đã thử nghiệm SQL Injection Động");
    } else if (kind === "literal") {
      showQuery(`SELECT * FROM users WHERE user = '${injected}' AND pass = '***';`);
      await typeWriter(term, `[-] ${t("Câu truy vấn vẫn hợp lệ: toàn bộ những gì bạn nhập nằm gọn trong một chuỗi so sánh.")}
[-] ${t("Không có dấu nháy đơn đóng, nên FROM, SELECT, OR chỉ là chữ thường — SQL không coi chúng là lệnh.")}
[i] ${t("Payload mẫu:")} ' UNION SELECT 1,2,3,4 --`, 12);
      verdict.className = "verdict show warn";
      verdict.textContent = t("CHƯA TIÊM ĐƯỢC — payload chưa thoát khỏi chuỗi literal.");
    } else if (kind === "broken") {
      showQuery(`SELECT * FROM users WHERE user = '${injected}' AND pass = '***';`);
      await typeWriter(term, `[!] SQL syntax error: ${t("câu lệnh bị gãy ngay tại dấu nháy bạn chèn vào.")}
[i] ${t("Trong thực tế, chính thông báo lỗi này là tín hiệu cho thấy điểm vào có thể bị tiêm mã (kỹ thuật error-based).")}`, 12);
      verdict.className = "verdict show warn";
      verdict.textContent = t("LỖI CÚ PHÁP SQL — có dấu hiệu tiêm mã, câu lệnh chưa khớp.");
    } else {
      showQuery(`SELECT * FROM users WHERE user = '${injected}' AND pass = '***';`);
      await typeWriter(term, `[-] ${t("Truy vấn chạy nhưng không có hiệu ứng tiêm mã rõ rệt.")}`, 15);
    }
  });

  const SQLMAP_LOG = `[*] starting simulation
[INFO] testing connection to the target URL
[INFO] checking if the target is protected by some kind of WAF/IPS
[INFO] testing if the target URL content is stable
[INFO] target URL content is stable
[INFO] testing if GET parameter 'user' is dynamic
[INFO] confirming that GET parameter 'user' is dynamic
[INFO] GET parameter 'user' appears to be dynamic
[INFO] heuristic (basic) test shows that GET parameter 'user' might be injectable
[INFO] testing for SQL injection on GET parameter 'user'
[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[INFO] testing 'MySQL >= 5.0 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause'
[INFO] GET parameter 'user' is 'MySQL >= 5.0 AND error-based' injectable
[INFO] fetching database names
[INFO] fetching tables for database: 'cysim_db'

Database: cysim_db
[3 tables]
+----------------+
| users          |
| orders         |
| logs           |
+----------------+

[*] ending - this was a simulation, no real host was touched`;

  $("runSqlmap").addEventListener("click", async () => {
    const verdict = $("sqliVerdict");
    $("dbLeakContainer").style.display = "none";
    verdict.className = "verdict";
    await typeWriter($("termBody"), `<pre class="sqlmap">${SQLMAP_LOG}</pre>`, 4);
    verdict.className = "verdict show bad";
    verdict.textContent = t("SQLMAP THÀNH CÔNG — Đã quét và tìm thấy lỗ hổng SQL Injection!");
    complete("sqli", "Đã chạy SQLMap (mô phỏng)");
  });

  Labs.sqli = { paint };
})();
