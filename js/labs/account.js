/* =========================================================
   CySim — labs/account.js  ·  phòng lab "Tài khoản demo & Dò mật khẩu"

   LÀ GÌ   : Ba bước nối tiếp: tạo tài khoản demo, đăng nhập (kèm mã 6 số
             nếu bật MFA), rồi tự đóng vai kẻ tấn công dò mật khẩu. Băm
             bằng SHA-256 thật trong Web Crypto, chạy cục bộ — không có máy
             chủ nào bị dò cả.
   CHẠY     : setStep() đổi luân phiên 6 khối: tạo tài khoản demo -> đăng
             nhập (bật MFA thì cần mã 6 số) -> đọc giải thích -> chạy
             brute-force -> hoàn thành nhiệm vụ acct. Mật khẩu ở đây chỉ để
             mô phỏng, đừng dùng lại mật khẩu thật ở nơi khác.
   CHẠM TỚI : #regBlock, #loginBlock, #otpBlock, #labIntro, #labRun,
             #lessonBlock, #acctTitle, #mfaToggle, #otpInput, #otpShown;
             global t(), setText(), $(), complete(); đăng ký Labs.account =
             { reset, cancel } để app.js dừng vòng dò khi rời view.
   ========================================================= */

(function () {
  let demoUser = "";
  let demoPass = "";

  const setStep = (step) => {
    $("regBlock").style.display = step === "reg" ? "block" : "none";
    $("loginBlock").style.display = step === "login" ? "block" : "none";
    $("otpBlock").style.display = step === "otp" ? "block" : "none";
    $("labIntro").style.display = step === "intro" ? "block" : "none";
    $("labRun").style.display = step === "run" ? "block" : "none";
    $("lessonBlock").style.display = step === "lesson" ? "block" : "none";
    const titles = {
      reg: "Bước 1 · Tạo tài khoản demo",
      login: "Bước 2 · Đăng nhập",
      otp: "Bước 2 · Đăng nhập",
      intro: "Bước 3 · Tấn công dò mật khẩu",
      run: "Bước 3 · Tấn công dò mật khẩu",
      lesson: "Bước 3 · Tấn công dò mật khẩu",
    };
    /* setText(): tiêu đề do JS viết, không nằm trong HTML tĩnh. Gán thẳng bản
       dịch và ghi nguồn tiếng Việt vào node — dựa vào reverseSource thì còn tuỳ
       chuỗi đó có trong index hay không, thiếu là dịch đè lên bản dịch. */
    setText($("acctTitle"), titles[step]);
  };

  $("regBlock").addEventListener("submit", (e) => {
    e.preventDefault();
    demoUser = $("regUser").value.trim() || "demo_user";
    demoPass = $("regPass").value;
    if (!demoPass) return showToast("Vui lòng nhập mật khẩu demo.");
    $("loginUser").value = demoUser;
    setStep("login");
  });

  $("loginBlock").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("loginPass").value !== demoPass) {
      $("loginMsg").textContent = t("❌ Sai mật khẩu. Hãy nhập đúng mật khẩu vừa tạo.");
      $("loginMsg").style.color = "var(--red)";
      return;
    }
    $("loginMsg").textContent = "";
    if ($("mfaToggle").checked) {
      $("otpShown").textContent = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);
      setStep("otp");
    } else {
      showIntro();
    }
  });

  $("otpSubmit").addEventListener("click", () => {
    if ($("otpInput").value.trim().length !== 6) {
      $("otpInput").style.borderColor = "var(--red)";
      return;
    }
    showIntro();
  });

  function showIntro() {
    $("crackUserLabel").textContent = demoUser;
    setStep("intro");
  }

  const DICTIONARY = [
    "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "dragon",
    "123123", "baseball", "abc123", "football", "monkey", "letmein", "shadow", "master", "666666", "qwertyuiop",
    "123321", "mustang", "1234567890", "michael", "654321", "superman", "1qaz2wsx", "7777777", "121212", "000000",
    "qazwsx", "123qwe", "killer", "trustno1", "jordan", "jennifer", "zxcvbnm", "asdfgh", "hunter", "buster",
    "soccer", "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000", "charlie", "robert",
    "thomas", "hockey", "ranger", "daniel", "starwars", "112233", "george", "computer", "michelle", "jessica",
    "pepper", "1111", "zxcvbn", "11111111", "131313", "freedom", "777777", "pass", "maggie", "159753",
    "aaaaaa", "ginger", "princess", "joshua", "cheese", "amanda", "summer", "love", "ashley", "nicole",
    "chelsea", "biteme", "matthew", "access", "yankees", "987654321", "dallas", "austin", "thunder", "taylor",
    "matrix", "admin", "password1", "qwerty123", "welcome", "admin123", "root", "toor", "test", "demo",
  ];

  function candidateList() {
    const base = demoUser.toLowerCase();
    const patterns = [base, base + "123", base + "123456", base + "!", base + "@1", "a" + base, base + "2024"];
    return [...DICTIONARY, ...patterns];
  }

  /* Brute-force thật nhưng có ngân sách: chỉ vét cạn tới 4 ký tự trên bộ
     ký tự đã xuất hiện trong mật khẩu, tối đa BRUTE_BUDGET lần thử. */
  const BRUTE_BUDGET = 40000;
  function* bruteForce(charset, maxLength) {
    const chars = [...charset];
    for (let len = 1; len <= maxLength; len++) {
      const total = chars.length ** len;
      if (total > BRUTE_BUDGET) return;
      for (let n = 0; n < total; n++) {
        let index = n;
        let out = "";
        for (let i = 0; i < len; i++) {
          out += chars[index % chars.length];
          index = Math.floor(index / chars.length);
        }
        yield out;
      }
    }
  }

  function charsetOf(pw) {
    let set = "";
    if (/[a-z]/.test(pw)) set += "abcdefghijklmnopqrstuvwxyz";
    if (/[A-Z]/.test(pw)) set += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (/[0-9]/.test(pw)) set += "0123456789";
    if (/[^A-Za-z0-9]/.test(pw)) set += "!@#$%&*";
    return set;
  }

  /* Vòng dò có thể dài tới vài chục nghìn lần băm, nên phải dừng được:
     người dùng bấm "Tạo tài khoản khác" hoặc chuyển sang trang khác giữa
     chừng thì vòng lặp phải thoát ngay, không âm thầm chạy tiếp rồi cộng
     XP cho một lần dò mà người dùng đã bỏ. */
  let cracking = false;
  let cancelCrack = false;

  function stopCrack() {
    if (cracking) cancelCrack = true;
  }

  $("startCrack").addEventListener("click", async () => {
    if (cracking) return;
    cracking = true;
    cancelCrack = false;
    $("startCrack").disabled = true;
    try {
      await runCrack();
    } finally {
      cracking = false;
      $("startCrack").disabled = false;
    }
  });

  async function runCrack() {
    setStep("run");
    const term = $("crackTerm");
    term.replaceChildren();

    const targetHash = await CyUtil.sha256Hex(demoPass);
    await typeWriter(
      term,
      `<span class="t-info">[*] ${t("Mục tiêu")}: ${demoUser}</span>\n` +
      `<span class="t-info">[*] SHA-256: ${targetHash}</span>\n` +
      `<span class="t-info">[*] ${t("Đang tải từ điển mật khẩu phổ biến...")}</span>\n`,
      8
    );

    let attempts = 0;
    let found = null;
    const candidates = candidateList();

    for (let i = 0; i < candidates.length && !found; i++) {
      if (cancelCrack) return aborted(term);
      const guess = candidates[i];
      const hash = await CyUtil.sha256Hex(guess);
      attempts++;
      if (i % 10 === 0 || i === candidates.length - 1) {
        CyUtil.logLine(term, "t-info", `[-] ${t("Thử")}: ${guess}  ->  ${hash.slice(0, 16)}…`);
      }
      if (CyUtil.constantEqual(hash, targetHash)) found = guess;
    }

    if (!found) {
      CyUtil.logLine(term, "t-warn", `[*] ${t("Không có trong từ điển. Chuyển sang brute-force có giới hạn...")}`);
      for (const guess of bruteForce(charsetOf(demoPass), 4)) {
        if (attempts >= BRUTE_BUDGET) break;
        if (cancelCrack) return aborted(term);
        attempts++;
        if (CyUtil.constantEqual(await CyUtil.sha256Hex(guess), targetHash)) { found = guess; break; }
        if (attempts % 200 === 0) await CyUtil.sleep(0);
      }
    }

    const verdict = $("crackVerdict");
    if (found) {
      CyUtil.logLine(term, "t-ok", `[+] ${t("ĐÃ DÒ RA")}: "${found}" — ${attempts} ${t("lần thử")}`);
      verdict.className = "verdict show bad";
      verdict.textContent = t("ĐÃ DÒ RA MẬT KHẨU KHÔNG BẢO VỆ!");
    } else {
      CyUtil.logLine(term, "t-ok", `[+] ${attempts} ${t("lần thử")} — ${t("không tìm ra. Mật khẩu này nằm ngoài từ điển và ngoài không gian dò thử.")}`);
      verdict.className = "verdict show good";
      verdict.textContent = t("TẠM ỔN — Mật khẩu vượt qua được từ điển và vòng brute-force giới hạn.");
    }

    complete("acct", "Thực hiện thành công bài test dò mật khẩu");

    await CyUtil.sleep(1800);
    if (cancelCrack) return aborted(term);
    setStep("lesson");
    $("lessonText").textContent = t(
      "Bài học: Đặt mật khẩu dài và bật MFA sẽ làm chi phí tấn công tăng gấp hàng triệu lần."
    );
  }

  function aborted(term) {
    CyUtil.logLine(term, "t-warn", `[!] ${t("Đã dừng quá trình dò theo yêu cầu.")}`);
  }

  $("acctReset").addEventListener("click", () => {
    stopCrack();
    ["regUser", "regPass", "loginPass", "otpInput"].forEach((id) => { $(id).value = ""; });
    $("loginMsg").textContent = "";
    demoUser = "";
    demoPass = "";
    setStep("reg");
  });

  $("goCheckPw").addEventListener("click", () => showView("password"));

  Labs.account = { reset: () => { stopCrack(); setStep("reg"); }, cancel: stopCrack };
})();
