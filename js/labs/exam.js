/* =========================================================
   CySim — js/labs/exam.js  ·  kỳ thi tốt nghiệp (trắc nghiệm + tự luận)

   LÀ GÌ   : Bài thi cuối khoá nằm trong màn hình "Chứng chỉ", có HAI LƯỢT:
             lượt THỬ mở từ 6/12 nhiệm vụ (không tính điểm, không cấp bằng) và
             lượt THẬT chỉ mở khi đã hoàn thành đủ 12 nhiệm vụ phòng lab
             (TOTAL_LABS = 13 trừ "cert", vì "cert" chính là tấm bằng do kỳ
             thi này cấp). Hai phần, mỗi phần
             thang 20 điểm: 10 câu trắc nghiệm (2 điểm/câu) và 4 câu tự luận
             (5 điểm/câu, mỗi ý đúng 1 điểm). Phải ĐỖ CẢ HAI phần (từng phần
             từ 10/20) thì certificate.js mới cấp bằng. Tiêu chí xét:
             trên 15 = Giỏi, 10 đến 15 = Khá, dưới 10 = chưa cấp bằng.
             Mỗi lượt có trần 45 phút (THOI_GIAN_PHUT) tính bằng giờ máy thật:
             đếm ngược ngay trên thanh .exam-bar và HẾT GIỜ LÀ TỰ NỘP.
   CHẠY     : render() kiểm tra moKhoa() trước tiên — chưa đủ ngưỡng thì
             chỉ vẽ dòng khoá cùng bộ đếm, ẩn hai nút, xoá #examResult và bỏ
             trống #certGrade. Đủ điều kiện mới dựng đề từ hai hằng số đầu
             file, đọc bài đã lưu của đúng tài khoản VÀ đúng lượt (che) rồi tô
             lại. Hai lượt nằm ở hai khoá localStorage KHÁC NHAU
             (cysim-exam:<id> và cysim-exam-thu:<id>) nên kết quả lượt thử
             không có đường nào lọt vào Labs.exam.dat() — đó là chỗ dựa của lời
             hứa "thi thử không tính điểm", không phải một câu an ủi.
             `che` do render() tự chọn lại: đang ngồi trong phòng nào thì về
             phòng đó (kể cả sau F5), chưa đủ 12 nhiệm vụ thì chỉ có lượt thử.
             Đề thi KHÔNG hiện ra ngay: chưa bấm "Vào phòng thi" (cờ bai.lam)
             thì chỉ vẽ cánh cửa + số câu đã làm dở, vì lộ câu hỏi từ ngoài thì
             vào nộp lấy 20/20 cũng được. Vào phòng thi bật toàn màn hình, đặt
             khoá điều hướng — showView() trong app.js chặn mọi trang khác trừ
             "certificate" — và ghi bai.hetLuc = now + 45 phút; nộp bài hoặc bấm
             "Rời phòng thi" mới mở khoá.
             THOÁT TOÀN MÀN HÌNH LÀ MẤT BÀI: cờ bai.fs chỉ bật khi
             requestFullscreen() thành công thật, nên Esc / đổi cửa sổ / F5
             giữa chừng rơi vào huyLuot("fs") — xoá sạch đáp án + hetLuc, mở
             khoá, và cửa phòng hiện dòng đỏ .exam-huy giải thích vì sao lượt
             trước bị huỷ. "Rời phòng thi" cũng huỷ bài (giữ bản nháp thì bấm
             nút đó là thoát khỏi chính căn phòng bị khoá, luật thành vô nghĩa).
             Hai chỗ thoát CÓ CHỦ ĐÍCH — nộp bài và rời phòng — ghi lam=false
             xuống localStorage TRƯỚC khi gọi exitFullscreen(), nên
             fullscreenchange đến sau thấy dangLam() đã false và không phạt
             nhầm; F5 thì không có sự kiện nào, kiểm tra ngay trong render().
             ĐỒNG HỒ: setInterval 1 giây chỉ sửa chữ trên thanh .exam-bar, KHÔNG
             gọi lại render() — render() dựng lại DOM sẽ nuốt con trỏ đang gõ
             trong ô tự luận. hetLuc là mốc thời gian tuyệt đối nên F5, đổi tab
             hay tắt máy không xin thêm phút nào; mở lại sau giờ thì render()
             nộp hộ phần đã làm. Đây là đồng hồ phía người dùng: chỉnh giờ hệ
             điều hành vẫn
             qua mặt được, và app không có server để chống chuyện đó — nói thẳng
             vậy còn hơn làm ra vẻ chặt chẽ.
             "Nộp bài thi"
             -> cham() chấm tại chỗ: trắc nghiệm so CHỈ SỐ đáp án (đổi ngôn
             ngữ không mất điểm), tự luận khớp từng tiêu chí qua chuanHoa() —
             bỏ dấu, bỏ hoa, nên học viên viết tiếng Việt không dấu hoặc tiếng
             Anh đều ăn điểm. Một ý chỉ được tính khi khớp TỪ HAI từ khoá của
             ý đó, hoặc khớp một từ khoá trong bài dài từ 80 ký tự (và mọi bài
             dưới 30 ký tự bị coi là bỏ câu). Kết quả (chỉ số + điểm, KHÔNG
             chứa chữ đã dịch) ghi vào khoá của đúng lượt đang làm; nhãn xếp
             loại tính lại bằng t() mỗi lần vẽ nên không bao giờ kẹt tiếng Việt
             trên màn hình tiếng Nhật. Chấm xong gọi Labs.certificate.render() vì
             hai khung nằm chung một trang. Bài thi không phải nhiệm vụ: không
             cộng XP, không đụng TOTAL_MISSIONS.
   CHẠM TỚI : DOM #examBody #examSubmit #examReset #examResult #certGrade;
              localStorage cysim-exam:<Auth.id()> (lượt thật) và
              cysim-exam-thu:<Auth.id()> (lượt thử); global $, t, CyUtil, Auth,
              Labs, currentLang, showToast, LABEL_LOCALE, labsDone(), TOTAL_LABS.
              Đăng ký Labs.exam = { render, ketQua, dat, dangLam, tinhDiem,
              chamTungDe, che, TU_LUAN, TRAC_NGHIEMLY } — app.js vẽ
              lại khi mở trang và khi đổi ngôn ngữ, certificate.js gọi
              Labs.exam.dat() để biết đã đỗ chưa (luôn đọc kết quả lượt THẬT),
              showView() gọi dangLam() để biết có đang bị cấm rời trang —
              dangLam() kiểm tra CẢ HAI lượt, ngồi trong phòng thử cũng không
              được đi đâu. #examBody và #examResult mang
              data-no-i18n nên engine dịch không đụng tới, mọi chữ hiện ra phải
              đi qua t() ngay trong file này.
   ========================================================= */

(function () {
  const DIEM_TN_CAU = 2; // 10 câu × 2 = 20 điểm
  const DIEM_TL_Y = 1; // mỗi câu 5 ý × 1 = 5 điểm, 4 câu = 20 điểm
  const DIEM_GIOI = 15; // TRÊN mức này mới là Giỏi
  const DIEM_DAT = 10; // từ mức này là Khá (điểm 10 và 15 không bị bỏ trống)
  const KY_TU_TOI_THIEU = 30; // bài ngắn hơn coi như bỏ, không chấm
  /* Ngưỡng chấm tự luận (xem chamTungDe): một ý cần HAI từ khoá cùng lượt, hoặc
     một từ khoá trong một bài viết dài >= 80 ký tự. */
  const TU_KHOA_TOI_THIEU = 2;
  const KY_TU_DAI = 80;
  /* Trần thời gian một lượt thi, tính bằng GIỜ MÁY THẬT (mốc Date.now()
     tuyệt đối), không phải bộ đếm trừ dần trong bộ nhớ: F5, đổi tab hay tắt máy
     giữa chừng không tặng thêm phút nào. 45 phút cho 10 câu trắc nghiệm + 4 câu
     tự luận là đủ viết ở tốc độ bình thường, và đồng hồ này chỉ có giá trị răn
     đe — người dùng muốn thì chỉnh giờ máy vẫn qua mặt được, vì app không có
     server nào để đối chiếu thời gian. Nói thẳng như vậy còn hơn làm bộ đếm giả
     vờ chặt chẽ. */
  const THOI_GIAN_PHUT = 45;
  /* Từ 6/12 nhiệm vụ được THI THỬ: cùng đề, cùng máy chấm, nhưng kết quả nằm ở
     khoá localStorage riêng và không có đường nào mở chứng chỉ. */
  const THI_THU_TU_SO_LAB = 6;

  /* ---------- phần 1: trắc nghiệm ----------
     d = chỉ số đáp án đúng trong c. Lưu bài theo chỉ số, không lưu chữ, nên
     người dùng đổi ngôn ngữ giữa lúc làm cũng không mất điểm. */
  const TRAC_NGHIEMLY = [
    {
      h: () => t("Ba bước của TCP three-way handshake diễn ra theo thứ tự nào?"),
      c: [
        () => t("SYN → SYN-ACK → ACK"),
        () => t("ACK → SYN → FIN → RST"),
        () => t("SYN → FIN → ACK → PSH"),
        () => t("HELLO → START → ACK"),
      ],
      d: 0,
    },
    {
      h: () => t("Biện pháp nào chặn SQL injection tận gốc nhất?"),
      c: [
        () => t("Lọc dấu nháy đơn ở phía giao diện"),
        () => t("Dùng truy vấn tham số hoá (prepared statement)"),
        () => t("Đổi mật khẩu cơ sở dữ liệu định kỳ"),
        () => t("Bật HTTPS cho website"),
      ],
      d: 1,
    },
    {
      h: () => t("CSRF token chủ yếu ngăn chặn điều gì?"),
      c: [
        () => t("Kẻ tấn công đọc được mật khẩu của nạn nhân"),
        () => t("Nghe lén dữ liệu trên đường truyền"),
        () => t("Máy chủ thực hiện hành động mà người dùng không hề chủ ý"),
        () => t("Máy tính nhiễm mã độc từ file đính kèm"),
      ],
      d: 2,
    },
    {
      h: () => t("XSS lưu trữ (stored XSS) khác XSS phản chiếu (reflected) ở điểm nào?"),
      c: [
        () => t("Mã độc chỉ có tác dụng khi có người bấm vào đường link"),
        () => t("Mã độc được máy chủ lưu lại rồi phát cho những người khác"),
        () => t("XSS lưu trữ chỉ xảy ra trên HTTP, không xảy ra trên HTTPS"),
        () => t("XSS lưu trữ chỉ tấn công được thiết bị di động"),
      ],
      d: 1,
    },
    {
      h: () => t("IDOR (truy cập đối tượng không an toàn) là lỗi gì?"),
      c: [
        () => t("Máy chủ cấp quyền admin cho mọi tài khoản mới"),
        () => t("Máy chủ chỉ nhìn ID do người dùng gửi mà không kiểm tra quyền sở hữu"),
        () => t("Mật khẩu bị băm bằng thuật toán đã cũ"),
        () => t("Cổng dịch vụ mở nhiều hơn mức thực sự cần dùng"),
      ],
      d: 1,
    },
    {
      h: () => t("Vì sao header X-Forwarded-For không đáng tin để chặn IP?"),
      c: [
        () => t("Vì nó chỉ tồn tại trong HTTP/2"),
        () => t("Vì trình duyệt tự do đặt mọi header, không ai xác thực cả"),
        () => t("Vì tường lửa luôn xoá header này"),
        () => t("Vì nó làm máy chủ phản hồi chậm hơn"),
      ],
      d: 1,
    },
    {
      h: () => t("Yếu tố nào quyết định độ mạnh của mật khẩu chống brute-force nhất?"),
      c: [
        () => t("Độ dài và tính ngẫu nhiên"),
        () => t("Viết hoa thêm một ký tự"),
        () => t("Ký tự đặc biệt đặt ở cuối"),
        () => t("Đổi mật khẩu mỗi tháng một lần"),
      ],
      d: 0,
    },
    {
      h: () => t("Tấn công SYN flood làm nghẽn mục tiêu bằng cách nào?"),
      c: [
        () => t("Gửi một lượng lớn email tới cùng một hộp thư"),
        () => t("Giữ hàng loạt bán kết nối chờ ACK cho tới khi hết chỗ"),
        () => t("Chiếm quyền phân giải DNS của mục tiêu"),
        () => t("Mã hoá toàn bộ ổ cứng của máy chủ"),
      ],
      d: 1,
    },
    {
      h: () => t("Nhược điểm lớn nhất của antivirus chỉ dựa vào signature là gì?"),
      c: [
        () => t("Chặn luôn cả phần mềm hợp lệ"),
        () => t("Quét rất chậm trên ổ SSD"),
        () => t("Bỏ sót mã độc chưa từng được biết (zero-day)"),
        () => t("Không quét được thiết bị USB"),
      ],
      d: 2,
    },
    {
      h: () => t("Bộ dấu hiệu nào sau đây là của email phishing?"),
      c: [
        () => t("Người gửi là đồng nghiệp trong cùng công ty"),
        () => t("Email có đính kèm hoá đơn PDF"),
        () => t("Email gửi ngoài giờ làm việc"),
        () => t("Tên miền giả mạo, tạo cảm giác gấp gáp, link rút gọn"),
      ],
      d: 3,
    },
  ];

  /* ---------- phần 2: tự luận ----------
     mo = tiêu chí in ra lúc chấm (có dịch); kw = mảnh từ khoá ĐÃ Bỏ Dấu dùng
     để khớp bài làm. Kỹ thuật thì giữ nguyên tiếng Anh: viết "rate limiting"
     hay "chặn tốc độ" đều ăn ý đó. */
  const TU_LUAN = [
    {
      h: () => t("Phòng thủ nhiều lớp (defense in depth) là gì? Cho ví dụ bốn lớp bảo vệ một máy chủ web và giải thích vì sao chỉ dựa vào một lớp thì sớm hay muộn cũng bị vượt."),
      y: [
        { mo: () => t("Nhiều lớp độc lập, lớp này bị vượt thì lớp kia còn chặn"),
          kw: ["nhieu lop", "many layer", "multiple layer", "defense in depth", "defence in depth", "layered", "doc lap"] },
        { mo: () => t("Lớp mạng: tường lửa hoặc ACL chỉ mở đúng port cần dùng"),
          kw: ["tuong lua", "firewall", "acl", "port", "network layer", "layer 4"] },
        { mo: () => t("Lớp truyền tải: HTTPS/TLS giữ bí mật dữ liệu đi trên đường"),
          kw: ["https", "tls", "ssl", "duong truyen", "in transit"] },
        { mo: () => t("Lớp ứng dụng: tham số hoá truy vấn và kiểm tra input"),
          kw: ["prepared", "tham so hoa", "validate", "input", "xss", "csrf", "sql"] },
        { mo: () => t("Lớp giám sát và phản ứng: log/SIEM, bản vá, backup, 2FA"),
          kw: ["siem", "log", "giam sat", "monitor", "patch", "backup", "2fa", "mfa"] },
      ],
    },
    {
      h: () => t("Lúc 20 giờ, traffic vào máy chủ web gấp 40 lần thường ngày và người dùng không truy cập được. Trình bày năm bước SOC nên làm, theo đúng thứ tự."),
      y: [
        { mo: () => t("Xác nhận sự cố thật: so traffic với baseline, đọc log và alarm"),
          kw: ["baseline", "xac nhan", "confirm", "triage", "log", "alarm", "alert"] },
        { mo: () => t("Ghi bằng chứng và thông báo cho bên liên quan ngay từ đầu"),
          kw: ["bang chung", "evidence", "bao cao", "notify", "thong bao", "ticket"] },
        { mo: () => t("Chặn nguồn tấn công: rate limit, block IP, blacklist"),
          kw: ["rate limit", "block", "blacklist", "throttle", "acl", "chan"] },
        { mo: () => t("Giữ dịch vụ sống: CDN/ISP scrubbing, scale thêm tài nguyên"),
          kw: ["cdn", "scrub", "isp", "upstream", "scale", "cache", "load balanc"] },
        { mo: () => t("Rút kinh nghiệm sau sự cố: cập nhật runbook, chỉnh ngưỡng cảnh báo"),
          kw: ["runbook", "kinh nghiem", "postmortem", "threshold", "nguong", "review"] },
      ],
    },
    {
      h: () => t("Một website đã bật HTTPS nhưng vẫn bị chiếm. Nêu bốn nguyên nhân khác nhau và cách xử lý từng nguyên nhân."),
      y: [
        { mo: () => t("Hiểu đúng vai trò TLS: chỉ bảo vệ đường truyền, không lọc nội dung"),
          kw: ["duong truyen", "in transit", "chi bao ve", "encrypt"] },
        { mo: () => t("Lỗ hổng ứng dụng: SQL injection, XSS, input không được kiểm tra"),
          kw: ["sql", "inject", "xss", "input", "validate", "prepared"] },
        { mo: () => t("Danh tính yếu: mật khẩu dễ đoán, không 2FA, credential lộ"),
          kw: ["2fa", "mfa", "mat khau", "password", "brute", "credential", "token"] },
        { mo: () => t("Phần mềm cũ: chưa vá, thư viện mang CVE"),
          kw: ["patch", "cve", "dependency", "outdated", "loi thoi", "update"] },
        { mo: () => t("Cấu hình và quyền: key lộ, quyền quá rộng, không log giám sát"),
          kw: ["secret", "key", "quyen", "privilege", "log", "monitor"] },
      ],
    },
    {
      h: () => t("Một máy chủ đã bị xâm nhập. Trình bày quy trình năm bước xử lý sự cố (incident response) và vì sao thứ tự lại quan trọng."),
      y: [
        { mo: () => t("Phát hiện và ghi nhận: alarm, log, mở ticket"),
          kw: ["phat hien", "detect", "alert", "alarm", "log", "ticket"] },
        { mo: () => t("Cô lập máy bị hại, ngắt kết nối để không lan tiếp"),
          kw: ["co lap", "isolate", "disconnect", "ngat", "segment", "offline"] },
        { mo: () => t("Điều tra và giữ bằng chứng (ảnh đĩa, log) trước khi xoá"),
          kw: ["forensic", "bang chung", "evidence", "snapshot", "image"] },
        { mo: () => t("Dọn và khôi phục từ bản sạch, đổi hết mật khẩu và key"),
          kw: ["phuc hoi", "restore", "recover", "backup", "sach", "clean", "rotate", "revoke"] },
        { mo: () => t("Tổng kết nguyên nhân gốc và sửa quy trình"),
          kw: ["nguyen nhan", "root cause", "runbook", "postmortem", "kinh nghiem", "tong ket"] },
      ],
    },
  ];

  /* ---------- bài làm của tài khoản đang đăng nhập ---------- */
  /* "that" = lượt thi thật (tính điểm, cấp bằng) | "thu" = lượt thi thử. Hai
     lượt là hai KHOÁ KHÁC NHAU chứ không phải một bản ghi có thêm cờ: tách khoá
     thì kết quả lượt thử không có đường nào bị certificate.js đọc nhầm, kể cả
     khi người sửa code sau này quên mất `che` nằm ở đâu. */
  let che = "that";
  const KEY = (c) => "cysim-exam" + (c === "thu" ? "-thu" : "") + ":" + Auth.id();
  const key = () => KEY(che);
  let bai = null;

  const deBai = () => ({
    tn: TRAC_NGHIEMLY.map(() => -1),
    tl: TU_LUAN.map(() => ""),
    ketQua: null,
    lam: false,   // có đang ngồi trong phòng thi hay không
    fs: false,    // lượt này VÀO được toàn màn hình rồi — thoát ra là mất bài
    huy: null,    // lượt trước mất vì gì: "fs" | "roi" (chỉ để vẽ câu giải thích)
    hetLuc: null, // mốc Date.now() hết giờ; null = chưa bước vào phòng
  });

  /* Đọc một lượt và phục hồi khuôn nếu dữ liệu thiếu hoặc của đề cũ. */
  function docLuu(c) {
    const saved = CyUtil.readJson(localStorage, KEY(c), null);
    const b = saved && Array.isArray(saved.tn) && saved.tn.length === TRAC_NGHIEMLY.length
      ? saved
      : deBai();
    if (!Array.isArray(b.tl) || b.tl.length !== TU_LUAN.length) b.tl = TU_LUAN.map(() => "");
    return b;
  }

  function nap() {
    bai = docLuu(che);
  }

  function luu() {
    if (!CyUtil.writeJson(localStorage, key(), bai)) {
      showToast(t("Không lưu được bài thi (bộ nhớ trình duyệt đã đầy)."));
    }
  }

  /* ---------- chấm ---------- */
  /* Bỏ dấu thanh + bỏ hoa: "cô lập", "co lap", "CO LAP" đều khớp. Tiếng Anh
     vốn không dấu nên cùng bộ keyword dùng được cho bài viết bằng mọi thứ tiếng. */
  function chuanHoa(text) {
    return (text || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase();
  }

  /* Mỗi ý trả về THẲNG boolean đúng/sai. Gói lại thành {dat:...} là nguồn gốc
     của lỗi "điểm tự luận luôn 20": reduce() đếm bằng .filter(Boolean) nên mọi
     object đều được tính là đúng, dù màn hình báo ✗ từng ý một. */
  /* ---------- điều kiện vào thi ---------- */
  /* 12 nhiệm vụ phòng lab (TOTAL_LABS = 13 trừ "cert"). "cert" không được tính
     vào đây vì chính nó là tấm bằng do kỳ thi này cấp — đếm nó là deadlock.
     Lượt THỬ chỉ cần THI_THU_TU_SO_LAB: một lượt không tính điểm thì học viên
     được biết đề thi trông ra sao trước khi chỉ còn đúng một vé. */
  function moKhoaThu() {
    return labsDone() >= THI_THU_TU_SO_LAB;
  }
  function moKhoaThat() {
    return labsDone() >= TOTAL_LABS;
  }
  function moKhoa() {
    return che === "thu" ? moKhoaThu() : moKhoaThat();
  }

  /* Đang ngồi trong phòng nào thì hiển thị đúng phòng đó — F5 giữa lượt thử mà
     đá người làm ra cửa phòng thật là mất lượt không phải lỗi của họ. */
  function dangNgoi(c) {
    const s = docLuu(c);
    return !!(s.lam && !s.ketQua);
  }
  function chonLuot() {
    if (dangNgoi("thu")) return "thu";
    if (dangNgoi("that")) return "that";
    return moKhoaThat() ? che : "thu"; // chưa đủ 12 nhiệm vụ: không có gì để chọn
  }

  function chamTungDe(de, trandap) {
    const thu = chuanHoa(trandap);
    const doDai = thu.replace(/\s/g, "").length;
    /* Dưới KY_TU_TOI_THIEU ký tự (đã bỏ dấu, bỏ khoảng trắng) thì coi như bỏ
       câu: một ý "đúng" do tình cờ khớp từ khoá không đủ để chấm. */
    if (doDai < KY_TU_TOI_THIEU) return de.y.map(() => false);
    return de.y.map((tieuChi) => {
      const khop = tieuChi.kw.filter((tu) => thu.includes(tu)).length;
      /* Một ý chỉ được tính khi hoặc (a) khớp TỪ HAI từ khoá của ý đó — tức là
         người viết thật sự diễn đạt được ý chứ không vớ đại một chữ tình cờ,
         hoặc (b) khớp một từ khoá trong một bài dài >= KY_TU_DAI ký tự: viết
         đủ dài là bằng chứng có suy nghĩ, và nhiều ý đúng chỉ có một cách diễn
         đạt duy nhất nằm trong từ điển. Bản cũ chỉ cần một từ khoá + 30 ký tự
         nên "firewall" một mình cũng ăn điểm. */
      return khop > 0 && (khop >= TU_KHOA_TOI_THIEU || doDai >= KY_TU_DAI);
    });
  }

  function cham() {
    return tinhDiem(bai.tn, bai.tl);
  }

  /* Tách chấm điểm thành hàm nhận đáp án TRỰC TIẾP. cham() phải đọc `bai` —
     trạng thái phòng thi nằm trong đóng gói của file — còn kiểm thử thì muốn
     chấm một bộ đáp án cố định mà không dựng cả DOM. Đây chính là đường mà
     test/exam.test.js đi vào. */
  function tinhDiem(dapAnTN, baiTL) {
    const dungTN = TRAC_NGHIEMLY.map((cau, i) => dapAnTN[i] === cau.d);
    const chiTietTL = TU_LUAN.map((de, i) => chamTungDe(de, baiTL[i] || ""));
    return {
      dungTN,
      chiTietTL,
      diemTN: dungTN.filter(Boolean).length * DIEM_TN_CAU,
      diemTL: chiTietTL.reduce((tong, d) => tong + d.filter(Boolean).length * DIEM_TL_Y, 0),
      ngay: Date.now(),
    };
  }

  /* Xếp loại trên thang 20 của TỪNG phần. */
  function xepLoai(diem) {
    if (diem > DIEM_GIOI) return t("Tốt nghiệp loại giỏi");
    if (diem >= DIEM_DAT) return t("Tốt nghiệp loại khá");
    return t("Chưa đủ điểm cấp bằng");
  }

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  /* ---------- vẽ đề + kết quả ---------- */
  /* Xếp loại cũng in thẳng lên tấm chứng chỉ (#certGrade trong khung cert).
     Chỉ vẽ khi bài thi ĐỖ (cả hai phần từ 10/20): chứng chỉ chưa được cấp mà
     đã ghi chữ "Chưa đủ điểm" lên khung bằng là tự bịa ra một tấm bằng lỗi. */
  function paintGrade(kq) {
    const line = $("certGrade");
    if (!datDu(kq)) {
      line.hidden = true;
      line.textContent = "";
      return;
    }
    line.textContent = t("Xếp loại tốt nghiệp") + ": " + xepLoai(Math.min(kq.diemTN, kq.diemTL));
    line.hidden = false;
  }

  /* Ngưỡng đỗ dùng chung một chỗ: certificate.js hỏi lại qua Labs.exam.dat(). */
  function datDu(kq) {
    return !!kq && kq.diemTN >= DIEM_DAT && kq.diemTL >= DIEM_DAT;
  }
  /* Kết quả đã lưu của một lượt. Không dùng nap() ở đây: nap() ghi đè biến
     `bai`, mà certificate.js gọi Labs.exam.ketQua() ngay giữa lúc đề đang vẽ. */
  function ketQuaThat() {
    return docLuu("that").ketQua;
  }

  /* ---------- phòng thi: toàn màn hình + khoá điều hướng ---------- */
  /* Đọc thẳng localStorage chứ không đụng biến `bai`: showView() gọi hàm này mỗi
     lần chuyển trang, mà nap() lại ghi đè `bai` giữa lúc đề đang vẽ thì mất
     câu trả lời vừa gõ. CẢ HAI lượt đều bị khoá: đang ngồi trong phòng thử mà
     đi được trang khác thì cánh cửa phòng thi thật cũng thành hình thức. */
  function dangLam() {
    return dangNgoi("that") || dangNgoi("thu");
  }

  /* Toàn màn hình là tuỳ chọn của trình duyệt — người dùng bấm Esc là ra, iframe
     bị chính sách chặn cũng không vào được. Vì thế KHOÁ ĐIỀU HƯỚNG mới là thứ
     bảo đảm (xem showView() trong app.js), còn toàn màn hình chỉ là tiện nghi.
     RIêng cờ `fs`: chỉ bật khi requestFullscreen THỰC SỰ thành công, để luật
     "thoát toàn màn hình là mất bài" không phạt oan người bị trình duyệt chặn. */
  function toanManHinh(vao) {
    const root = document.documentElement;
    try {
      if (vao && root.requestFullscreen && !document.fullscreenElement) {
        root
          .requestFullscreen()
          .then(() => {
            if (dangLam()) {
              bai.fs = true;
              luu();
              render();
            }
          })
          .catch(() => {});
      } else if (!vao && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      /* từ chối hẳn thì bỏ, bài thi vẫn làm được */
    }
  }

  /* Huỷ lượt thi: xoá sạch đáp án chứ không giữ lại, vì giữ thì "mất bài" chỉ là
     lời dọa — vào phòng lần sau là nộp được phần đã làm trước khi bị bắt.
     hetLuc cũng bị xoá: lượt đã huỷ thì đồng hồ cũ không còn nghĩa gì, lần vào
     phòng sau được tính lại 45 phút. */
  function huyLuot(lyDo) {
    dungDongHo();
    bai.lam = false;
    bai.fs = false;
    bai.huy = lyDo;
    bai.hetLuc = null;
    bai.tn = TRAC_NGHIEMLY.map(() => -1);
    bai.tl = TU_LUAN.map(() => "");
    luu();
  }

  function soCauDaLam() {
    return bai.tn.filter((a) => a >= 0).length + bai.tl.filter((s) => (s || "").trim()).length;
  }

  /* ---------- đồng hồ hết giờ ---------- */
  let dongHo = null;

  const conLaiMs = () => (bai.hetLuc ? Math.max(0, bai.hetLuc - Date.now()) : null);

  function dinhDangHom(ms) {
    const giay = Math.ceil(ms / 1000);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(Math.floor(giay / 60))}:${p(giay % 60)}`;
  }

  function dungDongHo() {
    if (dongHo) clearInterval(dongHo);
    dongHo = null;
  }

  /* Nhịp 1 giây CHỈ sửa chữ trên thanh .exam-bar, không gọi lại render():
     render() dựng cả đề thi từ đầu nên con trỏ đang gõ trong ô tự luận sẽ bay
     mất — người làm bài mất chữ giữa câu chỉ vì một cái đồng hồ. */
  function capDongHo() {
    const con = conLaiMs();
    if (con === null) {
      dungDongHo();
      return;
    }
    if (con <= 0) {
      dungDongHo();
      nopBai(true);
      return;
    }
    const o = $("examHom");
    if (!o) return;
    o.textContent = `${t("Thời gian còn lại")}: ${dinhDangHom(con)}`;
    o.classList.toggle("exam-hg-cap", con <= 5 * 60 * 1000);
  }

  function chayDongHo() {
    dungDongHo();
    if (!bai.lam || bai.ketQua || !bai.hetLuc) return;
    capDongHo();
    dongHo = setInterval(capDongHo, 1000);
  }

  function vaoPhongThi() {
    nap();
    bai.lam = true;
    bai.fs = false;
    bai.huy = null;
    bai.hetLuc = Date.now() + THOI_GIAN_PHUT * 60 * 1000;
    luu();
    toanManHinh(true);
    render();
    $("examBody").scrollIntoView({ block: "start" });
  }

  /* Rời phòng cũng huỷ bài, không giữ bản nháp nữa: nếu giữ thì chỉ cần bấm
     "Rời phòng thi" là được thoát khỏi chính cái phòng bị khoá này, mang theo
     nguyên bài làm dở — luật chống gian lận thành vô nghĩa. */
  function roiPhongThi() {
    nap();
    huyLuot("roi");
    toanManHinh(false);
    render();
    showToast(t("Đã rời phòng thi. Lượt thi bị huỷ và bài làm bị xoá."));
  }

  /* Thoát toàn màn hình giữa chừng = mất bài. Hai lối ra CÓ CHỦ ĐÍCH (nộp bài,
     rời phòng) đã kịp ghi lam=false xuống localStorage trước khi sự kiện tới,
     nên dangLam() chặn được chúng; ở đây chỉ còn lại đúng các trường hợp Esc,
     đổi cửa sổ, F5 hay bấm nút "Thoát toàn màn hình". */
  document.addEventListener("fullscreenchange", () => {
    if (!dangLam()) return;
    nap();
    if (!document.fullscreenElement && bai.fs) {
      huyLuot("fs");
      render();
      showToast(t("Đã thoát toàn màn hình. Lượt thi này bị huỷ và bài làm bị xoá."));
      return;
    }
    render();
  });

  /* Chọn lượt + giải thích lượt đang chọn. Bảng chuyển chỉ hiện khi cả hai lượt
     đều mở (đủ 12 nhiệm vụ); dưới ngưỡng đó thì lượt thử là lựa chọn duy nhất,
     không có gì để chuyển. Đang ngồi trong phòng thì hai nút bị disable: đổi được
     sang ô bài khác giữa lượt thì đồng hồ và khoá điều hướng thành trò đùa.
     Dòng chữ "đây là lượt thi thử" NGƯỢC LẠI phải hiện ở mọi lần dưới 12 nhiệm
     vụ — ẩn nó đi là để học viên làm một lượt không tính điểm mà tưởng mình vừa
     thi thật. */
  function veChonLuot(body) {
    if (moKhoaThat()) {
      const hang = el("div", "exam-che");
      const that = el("button", "btn ghost sm" + (che === "that" ? " on" : ""), t("Lượt thi thật · tính điểm, cấp bằng"));
      const thu = el("button", "btn ghost sm" + (che === "thu" ? " on" : ""), t("Lượt thi thử · không tính điểm"));
      that.type = "button";
      thu.type = "button";
      if (dangLam()) {
        that.disabled = true;
        thu.disabled = true;
      } else {
        that.addEventListener("click", () => {
          che = "that";
          render();
        });
        thu.addEventListener("click", () => {
          che = "thu";
          render();
        });
      }
      hang.append(that, thu);
      body.append(hang);
    }
    if (che === "thu") {
      body.append(el("p", "exam-thu", t("Đây là lượt thi thử: chấm đúng bằng máy chấm của đề thật, nhưng điểm chỉ hiện trên màn hình — không đưa vào chứng chỉ, không mở bằng.")));
    }
  }

  function render() {
    const body = $("examBody");
    const nop = $("examSubmit");
    const lai = $("examReset");
    const box = $("examResult");
    dungDongHo(); // nhịp cũ phải chết trước khi vẽ: hai setInterval cùng chạy là hai đồng hồ
    che = chonLuot();
    nap();

    /* Chưa đủ ngưỡng: đề thi không được hiển thị — kể cả đọc được câu hỏi thì
       người dùng cũng chẳng có gì để đối chiếu, và "thi trước, học sau" làm mất
       ý nghĩa của bằng tốt nghiệp. */
    if (!moKhoa()) {
      paintGrade(null);
      if (nop) nop.hidden = true;
      if (lai) lai.hidden = true;
      if (box) {
        box.textContent = "";
        box.hidden = true;
      }
      body.textContent = "";
      body.append(el("h3", null, t("Kỳ thi tốt nghiệp CySim")));
      body.append(el("p", "mute", t("Kỳ thi chỉ mở khi bạn đã hoàn thành đủ 12 nhiệm vụ phòng lab.")));
      body.append(el("p", "mute", `${t("Lượt thi thử (không tính điểm) mở từ")} ${THI_THU_TU_SO_LAB} ${t("nhiệm vụ")}`));
      body.append(el("p", "exam-lock", `${labsDone()} / ${TOTAL_LABS} ${t("nhiệm vụ đã hoàn thành")}`));
      return;
    }
    if (nop) nop.hidden = false;
    if (lai) lai.hidden = false;

    const kq = bai.ketQua;
    const daCham = !!kq;

    /* F5 giữa lúc làm bài: trình duyệt tự bỏ toàn màn hình khi nạp lại trang,
       nên "đang trong phòng + đáng lẽ phải đang toàn màn hình + thực tế không
       còn" nghĩa là người làm đã thoát. Kiểm tra ngay trong render() vì sự
       kiện fullscreenchange không nổ ở lần nạp đầu tiên. */
    if (!daCham && bai.lam && bai.fs && !document.fullscreenElement) huyLuot("fs");

    /* Hết giờ trước khi kịp nộp — máy tắt, tab ngủ, F5 rồi quay lại sau 45 phút:
       nộp hộ phần đã làm. return để lần render đang chạy không vẽ tiếp đề của một
       lượt vừa bị đóng. */
    if (!daCham && bai.lam && bai.hetLuc && Date.now() >= bai.hetLuc) {
      nopBai(true);
      return;
    }

    /* Dòng học lực trên bằng luôn lấy từ lượt THẬT, kể cả khi màn hình đang
       hiển thị lượt thử: đang xem bài thử mà xoá mất xếp loại của tấm bằng đã
       đỗ là tự tay phá dữ liệu đúng. */
    paintGrade(che === "thu" ? docLuu("that").ketQua : kq);

    body.textContent = "";

    /* Chưa bấm "Vào phòng thi" mà đã lộ đề thì phòng thi chỉ còn là hình thức:
       đọc câu hỏi từ ngoài, vào nộp lấy 20/20 cũng được. Nên ở trạng thái này
       chỉ vẽ cánh cửa — kèm số câu đã làm dở để biết bài cũ không mất. */
    if (!bai.lam && !daCham) {
      if (nop) nop.hidden = true;
      if (lai) lai.hidden = true;
      if (box) {
        box.textContent = "";
        box.hidden = true;
      }
      body.append(el("h3", null, t("Phòng thi tốt nghiệp")));
      veChonLuot(body);
      body.append(el("p", "mute", t("Bài thi gồm hai phần, mỗi phần tính trên thang 20 điểm: 10 câu trắc nghiệm (2 điểm/câu) và 4 câu tự luận (5 điểm/câu, mỗi ý đúng 1 điểm).")));
      body.append(el("p", "mute", t("Mỗi lượt có giới hạn 45 phút. Hết giờ là bài đang làm được nộp tự động.")));
      body.append(el("p", "exam-lock", t("Vào phòng thi sẽ bật toàn màn hình và khoá điều hướng: không sang được trang lý thuyết hay lab nào khác cho tới khi nộp bài. Thoát toàn màn hình khi chưa nộp bài là mất bài, làm lại từ đầu.")));
      if (bai.huy === "fs") {
        body.append(el("p", "exam-huy", t("Lượt trước bị huỷ vì bạn thoát toàn màn hình khi chưa nộp bài. Bài làm đã bị xoá.")));
      } else if (bai.huy === "roi") {
        body.append(el("p", "exam-huy", t("Lượt trước bị huỷ vì bạn rời phòng thi khi chưa nộp bài. Bài làm đã bị xoá.")));
      }
      const daLuu = soCauDaLam();
      if (daLuu) {
        body.append(el("p", "mute", `${t("Bài làm dở đã lưu")}: ${daLuu} / ${TRAC_NGHIEMLY.length + TU_LUAN.length}`));
      }
      const vao = el("button", "btn", t("Vào phòng thi"));
      vao.type = "button";
      vao.addEventListener("click", vaoPhongThi);
      body.append(vao);
      return;
    }

    body.append(el("h3", null, t("Kỳ thi tốt nghiệp CySim")));
    veChonLuot(body);

    /* Thanh trạng thái phòng thi: nhắc đang bị khoá, đếm phần giờ còn lại và
       cho hai lối ra hợp lệ (nộp bài / rời phòng) ngay tại chỗ, không phải cuộn
       tìm nút. */
    if (bai.lam && !daCham) {
      const bar = el("div", "exam-bar");
      bar.append(el("span", null, t("Phòng thi đang khoá điều hướng — nộp bài hoặc rời phòng thi để sang trang khác.")));
      const hg = el("span", "exam-hg", `${t("Thời gian còn lại")}: ${dinhDangHom(conLaiMs() || 0)}`);
      hg.id = "examHom"; // nhịp 1 giây tìm đúng node này để sửa chữ
      bar.append(hg);
      if (bai.fs) {
        bar.append(el("span", null, t("Đang ở chế độ toàn màn hình: thoát ra — kể cả bấm Esc — là mất bài thi này.")));
      }
      const fs = el("button", "btn ghost", document.fullscreenElement ? t("Thoát toàn màn hình") : t("Toàn màn hình"));
      fs.type = "button";
      fs.addEventListener("click", () => toanManHinh(!document.fullscreenElement));
      const roi = el("button", "btn ghost", t("Rời phòng thi"));
      roi.type = "button";
      roi.addEventListener("click", roiPhongThi);
      bar.append(fs, roi);
      body.append(bar);
      chayDongHo();
    }
    body.append(el("p", "mute", t("Bài thi gồm hai phần, mỗi phần tính trên thang 20 điểm: 10 câu trắc nghiệm (2 điểm/câu) và 4 câu tự luận (5 điểm/câu, mỗi ý đúng 1 điểm).")));
    body.append(el("p", "mute", t("Trên 15 điểm: tốt nghiệp loại Giỏi. Từ 10 đến 15 điểm: loại Khá. Dưới 10 điểm: chưa được cấp bằng.")));
    body.append(el("p", "mute", t("Xếp loại của bằng lấy theo phần thi có điểm thấp hơn trong hai phần.")));

    body.append(el("div", "exam-part", t("Phần 1 · Trắc nghiệm")));
    TRAC_NGHIEMLY.forEach((cau, qi) => {
      const q = el("div", "exam-q");
      q.append(el("p", "exam-h", `${qi + 1}. ${cau.h()}`));
      cau.c.forEach((dapAn, oi) => {
        const lab = document.createElement("label");
        lab.className = "exam-opt";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "examq" + qi;
        input.value = String(oi);
        input.checked = bai.tn[qi] === oi;
        input.disabled = daCham;
        input.addEventListener("change", () => {
          bai.tn[qi] = oi;
          bai.ketQua = null; // sửa bài thì phải chấm lại
          luu();
        });
        const span = el("span", null, dapAn());
        if (daCham) {
          if (cau.d === oi) span.className = "exam-dung";
          else if (bai.tn[qi] === oi) span.className = "exam-sai";
        }
        lab.append(input, span);
        q.append(lab);
      });
      if (daCham) {
        const diemCau = kq.dungTN[qi] ? DIEM_TN_CAU : 0;
        q.append(el("p", "exam-note", (kq.dungTN[qi] ? t("Đúng") : t("Sai")) + ` — ${diemCau} / ${DIEM_TN_CAU} ${t("điểm")}`));
      }
      body.append(q);
    });

    body.append(el("div", "exam-part", t("Phần 2 · Tự luận")));
    TU_LUAN.forEach((de, ei) => {
      const q = el("div", "exam-q");
      q.append(el("p", "exam-h", `${ei + 1}. ${de.h()}`));
      const ta = document.createElement("textarea");
      ta.className = "exam-ta";
      ta.rows = 5;
      ta.maxLength = 4000;
      ta.placeholder = t("Viết câu trả lời của bạn (tối thiểu 30 ký tự mới được chấm)…");
      ta.value = bai.tl[ei] || "";
      ta.disabled = daCham;
      ta.addEventListener("input", () => {
        bai.tl[ei] = ta.value;
        bai.ketQua = null;
        luu();
      });
      q.append(ta);
      if (daCham) {
        const chiTiet = kq.chiTietTL[ei];
        const ul = document.createElement("ul");
        ul.className = "exam-y";
        de.y.forEach((tieuchi, yi) => {
          const li = el("li", chiTiet[yi] ? "dat" : "thieu", (chiTiet[yi] ? "✓ " : "✗ ") + tieuchi.mo());
          ul.append(li);
        });
        q.append(ul);
        q.append(el("p", "exam-note", `${chiTiet.filter(Boolean).length * DIEM_TL_Y} / ${de.y.length * DIEM_TL_Y} ${t("điểm")}`));
      }
      body.append(q);
    });

    if (nop) {
      nop.disabled = daCham;
      nop.textContent = t("Nộp bài thi");
    }
    if (lai) lai.textContent = daCham ? t("Làm lại bài thi") : t("Xoá bài đang làm");

    box.textContent = "";
    if (!daCham) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const thapNhat = Math.min(kq.diemTN, kq.diemTL);
    box.setAttribute("data-dat", thapNhat >= DIEM_DAT ? "1" : "0");
    box.append(el("div", "exam-part", t("Kết quả kỳ thi")));
    box.append(el("p", null, `${t("Điểm trắc nghiệm")}: ${kq.diemTN} / 20 — ${xepLoai(kq.diemTN)}`));
    box.append(el("p", null, `${t("Điểm tự luận")}: ${kq.diemTL} / 20 — ${xepLoai(kq.diemTL)}`));
    if (che === "thu") {
      box.append(el("p", "exam-thu", t("Lượt thi thử: điểm dưới đây chỉ để tự đánh giá, không đưa vào chứng chỉ.")));
      box.append(el("p", "exam-bang", `${t("Kết quả thi thử")}: ${xepLoai(thapNhat)}`));
    } else {
      box.append(el("p", "exam-bang", `${t("Bằng tốt nghiệp")}: ${xepLoai(thapNhat)}`));
    }
    if (kq.hetGio) box.append(el("p", "exam-huy", t("Bài được nộp tự động vì hết giờ.")));
    box.append(el("p", "mute", t("Nộp bài ngày") + " " + new Date(kq.ngay).toLocaleDateString(LABEL_LOCALE[currentLang] || "vi-VN")));
  }

  /* ---------- hai nút nằm trong markup #certificate ---------- */
  /* Nộp bài. `epBuoc` = true là lúc đồng hồ hết giờ gọi tới: hết giờ thì làm
     được bao nhiêu nộp bấy nhiêu, giữ chốt "còn câu chưa trả lời" ở đường này
     chỉ biến giới hạn 45 phút thành một lời khuyên. */
  function nopBai(epBuoc) {
    nap();
    if (!bai.lam || bai.ketQua) return; // không nộp hộ một lượt chưa vào phòng hoặc đã đóng
    if (!epBuoc && bai.tn.some((a) => a < 0)) {
      showToast(t("Vẫn còn câu trắc nghiệm chưa được trả lời."));
      return;
    }
    dungDongHo();
    bai.ketQua = cham();
    if (epBuoc) bai.ketQua.hetGio = true;
    /* Nộp bài là ra khỏi phòng: bỏ khoá điều hướng và tắt toàn màn hình để học
       viên xem được bảng xếp hạng cùng các lab, kết quả đã nằm lại trong file.
       Nút này thoát toàn màn hình HỘ người làm bài nên phải xoá cờ `fs` trước,
       nếu không sự kiện fullscreenchange coi đây là một lần trốn thi. */
    bai.lam = false;
    bai.fs = false;
    bai.huy = null;
    bai.hetLuc = null;
    toanManHinh(false);
    luu();
    render();
    if (epBuoc) showToast(t("Hết giờ — bài đã được nộp tự động."));
    /* Chứng chỉ nằm cùng trang và khoá/mở ngay trước mắt học viên: vừa nộp
       lượt THẬT xong phải vẽ lại khung bằng. Lượt thử thì không: kết quả của nó
       không có phần nào trong tấm bằng, vẽ lại chỉ gợi ý rằng nó có. */
    if (che === "that") Labs.certificate?.render();
    $("examResult").scrollIntoView({ block: "nearest" });
  }

  $("examSubmit").addEventListener("click", () => nopBai(false));

  $("examReset").addEventListener("click", () => {
    dungDongHo();
    toanManHinh(false);
    bai = deBai();
    localStorage.removeItem(key());
    render();
    Labs.certificate?.render();
    showToast(t("Đã xoá bài thi."));
  });

  /* certificate.js hỏi lại hai thứ qua đây: kết quả đã lưu và điều kiện đỗ.
     Cả hai đều đọc khoá của lượt THẬT — đó là toàn bộ cơ chế "thi thử không
     tính điểm". hàm getter chứ không phải giá trị snapshot — điểm đổi ngay khi
     nộp lại bài. dangLam() cho app.js hỏi "có đang ngồi trong phòng thi không"
     trước khi cho chuyển trang, và nó tính cả hai lượt. tinhDiem/chamTungDe/
     TU_LUAN/TRAC_NGHIEMLY/che không ai trong app gọi: chúng là cửa cho
     test/exam.test.js chấm một bộ đáp án cố định và cho người kiểm tra biết
     lượt nào đang mở mà không phải đoán qua DOM. */
  Labs.exam = {
    render,
    ketQua: ketQuaThat,
    dat: () => datDu(ketQuaThat()),
    dangLam,
    tinhDiem,
    chamTungDe,
    che: () => che,
    THI_THU: THI_THU_TU_SO_LAB, // certificate.js cần đúng con số này, không tự viết 6
    TU_LUAN,
    TRAC_NGHIEMLY,
  };
})();
