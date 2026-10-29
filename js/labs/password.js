/* =========================================================
   CySim — labs/password.js  ·  phòng lab "Độ mạnh mật khẩu"

   LÀ GÌ   : Ô gõ mật khẩu + 5 tiêu chí + thời gian bẻ khóa. Thời gian được
             TÍNH THẬT từ không gian ký tự, không phải bảng tra 6 dòng gắn
             sẵn theo điểm.
   CHẠY     : Gõ từng ký tự -> estimate() soi danh sách 41 mật khẩu rò rỉ,
             kích thước bảng ký tự, mẫu lặp/sequence -> lấy số lần thử trung
             bình chia tốc độ 1 THash/giây (ATTACK_RATE_HPS) ->
             humanizeSeconds() đổi ra "3 ngày"/"250 năm". Đủ 5 tiêu chí thì
             hoàn thành nhiệm vụ pwd.
   CHẠM TỚI : #passwordInput, #meter, #checkLength #checkUpper #checkNumber
             #checkSymbol #checkCommon, #strengthLabel, #timeToCrackValue,
             #timeToCrackBox, #entropyValue, #togglePassword; global t(),
             CyUtil.humanizeSeconds, complete(); đăng ký Labs.password.render
             để app.js vẽ lại khi đổi ngôn ngữ.
   ========================================================= */

(function () {
  const pwInput = $("passwordInput");
  const timeValue = $("timeToCrackValue");
  const entropyValue = $("entropyValue");
  const strengthLabel = $("strengthLabel");

  // Giả định: kẻ tấn công offline với cụm GPU, băm nhanh chưa salt
  // (SHA-256/bcrypt-chưa-tăng-giá) ~ 1 THash/giây.
  const ATTACK_RATE_HPS = 1e12;

  const COMMON = [
    "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234",
    "111111", "1234567", "dragon", "123123", "baseball", "abc123", "football",
    "monkey", "letmein", "shadow", "master", "666666", "qwertyuiop", "123321",
    "654321", "superman", "1qaz2wsx", "121212", "000000", "qazwsx", "trustno1",
    "iloveyou", "sunshine", "princess", "admin", "welcome", "admin123", "root",
    "password1", "qwerty123", "1234567890", "987654321", "batman", "tester",
  ];

  const CLASS_SIZES = [
    { re: /[a-z]/, size: 26 },
    { re: /[A-Z]/, size: 26 },
    { re: /[0-9]/, size: 10 },
    { re: /[^A-Za-z0-9]/, size: 33 },
  ];

  function charsetSize(pw) {
    return CLASS_SIZES.reduce((sum, c) => sum + (c.re.test(pw) ? c.size : 0), 0);
  }

  function isRepeating(pw) {
    return /^(.)\1+$/.test(pw);
  }
  function isRun(pw) {
    const lower = pw.toLowerCase();
    const sequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];
    return sequences.some((s) => {
      for (let i = 0; i + pw.length <= s.length; i++) {
        if (s.slice(i, i + pw.length) === lower) return true;
      }
      return false;
    });
  }

  /* Trả về { guesses, bits } tính trong không gian log10 để mật khẩu dài
     không bị tràn số nguyên dấu chấm động. */
  function estimate(pw) {
    if (!pw.length) return null;

    const rank = COMMON.indexOf(pw.toLowerCase());
    if (rank >= 0) {
      // Mật khẩu nằm trong danh sách rò rỉ: chỉ mất đúng vị trí của nó
      return { guesses: rank + 1, bits: Math.log2(rank + 1), reason: "common" };
    }

    const size = charsetSize(pw);
    let logGuesses = pw.length * Math.log10(size) - Math.log10(2); // trung bình thử nửa không gian
    let bits = pw.length * Math.log2(size);

    if (isRepeating(pw)) { logGuesses = Math.log10(size * pw.length); bits = Math.log2(size * pw.length); }
    else if (isRun(pw)) { logGuesses = Math.log10(size * 40); bits = Math.log2(size * 40); }
    else if (pw.length < 8) { logGuesses -= 0.6; bits -= 2; } // hình thái lặp/nhóm ngắn

    return { guesses: Math.pow(10, logGuesses), bits, reason: "bruteforce" };
  }

  const LABELS = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

  function render(pw) {
    const checks = [
      pw.length >= 12,
      /[a-z]/.test(pw) && /[A-Z]/.test(pw),
      /[0-9]/.test(pw),
      /[^A-Za-z0-9]/.test(pw),
      pw.length > 0 && COMMON.indexOf(pw.toLowerCase()) === -1,
    ];
    const score = checks.filter(Boolean).length;

    Array.from($("meter").children).forEach((bar, i) => {
      bar.style.background = i < score ? "var(--ok)" : "";
    });
    [["checkLength", 0], ["checkUpper", 1], ["checkNumber", 2], ["checkSymbol", 3], ["checkCommon", 4]].forEach(
      ([id, i]) => { $(id).className = checks[i] ? "pass" : ""; }
    );

    if (!pw.length) {
      strengthLabel.textContent = t("Chưa có dữ liệu");
      timeValue.textContent = t("Chưa xác định");
      entropyValue.textContent = "—";
      return;
    }

    strengthLabel.textContent = t(LABELS[Math.max(0, score - 1)]);
    const model = estimate(pw);
    entropyValue.textContent = CyUtil.numOf(model.bits, 1) + " bit";
    timeValue.textContent = model.reason === "common"
      ? t("Tức thì — nằm trong danh sách rò rỉ")
      : CyUtil.humanizeSeconds(model.guesses / ATTACK_RATE_HPS);

    if (score === 5) complete("pwd", "Mật khẩu đạt cấp độ Rất mạnh");
  }

  pwInput.addEventListener("input", () => render(pwInput.value));

  $("togglePassword").addEventListener("click", () => {
    const reveal = pwInput.type === "password";
    pwInput.type = reveal ? "text" : "password";
    $("togglePassword").textContent = t(reveal ? "Ẩn" : "Hiện");
  });

  Labs.password = { render };
})();
