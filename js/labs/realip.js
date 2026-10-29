/* =========================================================
   CySim — labs/realip.js  ·  phòng lab "Định vị IP"

   LÀ GÌ   : Tra thông tin một địa chỉ IP thật (quốc gia, tổ chức, múi giờ).
             LAB DUY NHẤT trong app gọi ra ngoài internet.
   CHẠY     : lookup() kiểm tra format IP -> đi qua BỐN nhà cung cấp công cộng
             theo thứ tự đã đo thật (ipinfo.io, get.geojs.io, ipwho.is,
             ipapi.co). Hai nhà cuối bậc miễn phí chặn theo IP rất nhanh (429),
             nên ai báo 429 bị cho "nghỉ" 10 phút trong phiên và bị bỏ qua ngay
             ở lượt sau — bấm liên tục không đốt thêm hạn mức. Mỗi nhà trả về
             một khuôn dữ liệu chung, thiếu trường nào in "N/A" trường đó.
             Kết quả nhớ trong phiên (tối đa 24 IP) để không tốn lượt gọi cho
             cùng một IP; đang có một lượt chạy thì lượt bấm thứ hai không phát
             request song song. In được thông tin là hoàn thành nhiệm vụ realip.
   AN TOÀN  : Mọi dữ liệu từ API đều ghi bằng textContent, không ghép vào
             innerHTML — đáp án độc từ server cũng chỉ là chữ thường.
   CHẠM TỚI : #targetIpInput, #btnSearchIp, #btnGetMyIp, #ipTermBody; global
              t(), $(), complete(), CyUtil, Labs. Đăng ký Labs.realip = { stop }
              để app.js abort() lượt đang chờ khi rời trang — request đội
              trên mạng mà không ai xem thì cũng phải đóng.
   ========================================================= */

(function () {
  const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const IPV6 = /^[0-9a-f:]+$/i;

  function validIp(value) {
    if (!value) return true;
    if (IPV4.test(value)) return value.split(".").every((n) => Number(n) <= 255);
    return value.includes(":") && IPV6.test(value);
  }

  const versionOf = (ip) => (ip && ip.includes(":") ? "IPv6" : "IPv4");

  /* Chuẩn dữ liệu của từng nhà cung cấp về cùng một khuôn. Trả về null khi
     chính nhà cung cấp khẳng định IP đó không tồn tại. */
  function fromIpapi(d) {
    if (d.error) return null;
    if (!d.ip) return null;
    return {
      source: "ipapi.co",
      ip: d.ip,
      version: d.version || versionOf(d.ip),
      country: `${d.country_name || "N/A"} (${d.country_code || "N/A"})`,
      region: d.region,
      city: d.city,
      postal: d.postal,
      coords: `Lat: ${d.latitude ?? "N/A"}, Lon: ${d.longitude ?? "N/A"}`,
      timezone: d.timezone,
      org: d.org,
      calling: d.country_calling_code ? "+" + d.country_calling_code : null,
    };
  }

  function fromIpwho(d) {
    if (d.success === false) return null;
    const ip = d.ip;
    if (!ip) return null;
    return {
      source: "ipwho.is",
      ip,
      version: d.type || versionOf(ip),
      country: `${d.country || d.country_name || "N/A"} (${d.country_code || "N/A"})`,
      region: d.region,
      city: d.city,
      postal: d.postal,
      coords: `Lat: ${d.latitude ?? "N/A"}, Lon: ${d.longitude ?? "N/A"}`,
      timezone: d.timezone?.id || d.timezone,
      org: typeof d.asn === "object" ? d.asn?.org || d.asn?.name : d.org,
      calling: d.calling_code ? "+" + d.calling_code : null,
    };
  }

  /* ipinfo.io trả mã quốc gia trần, toạ độ dính trong một chuỗi "lat,lon", và
     HTTP 200 kèm {"ip":…,"bogon":true} cho địa chỉ riêng/không tồn tại — phải
     chặn ở đây, nếu không lab in bảng "THÀNH CÔNG" toàn N/A. */
  function fromIpinfo(d) {
    const ip = d.ip;
    if (!ip || d.error || d.bogon) return null;
    const [lat, lon] = String(d.loc || "").split(",");
    return {
      source: "ipinfo.io",
      ip,
      version: versionOf(ip),
      country: `${d.country || "N/A"}${d.country_name ? ` (${d.country})` : ""}`,
      region: d.region,
      city: d.city,
      postal: d.postal,
      coords: `Lat: ${lat || "N/A"}, Lon: ${lon || "N/A"}`,
      timezone: d.timezone,
      org: d.org,
      calling: null,
    };
  }

  /* geojs không có thành phố/bưu chính cho các IP anycast (8.8.8.8, 1.1.1.1)
     nhưng lại hiếm khi bị hạn mức — đủ để màn hình không bao giờ trắng. Với
     địa chỉ không định tuyến được, nó trả đúng chuỗi "nil" cho toạ độ. */
  function fromGeojs(d) {
    const ip = d.ip;
    if (!ip) return null;
    const hopLe = (v) => (v && v !== "nil" ? v : null);
    return {
      source: "get.geojs.io",
      ip,
      version: versionOf(ip),
      country: `${d.country || "N/A"} (${d.country_code || "N/A"})`,
      region: d.region,
      city: d.city,
      postal: d.postal_code,
      coords: `Lat: ${hopLe(d.latitude) ?? "N/A"}, Lon: ${hopLe(d.longitude) ?? "N/A"}`,
      timezone: d.timezone,
      org: d.organization || d.organization_name,
      calling: null,
    };
  }

  const PROVIDERS = [
    {
      name: "ipinfo.io",
      url: (ip) => `https://ipinfo.io/${ip ? encodeURIComponent(ip) + "/" : ""}json`,
      read: fromIpinfo,
    },
    {
      name: "get.geojs.io",
      url: (ip) =>
        ip
          ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`
          : "https://get.geojs.io/v1/ip/geo.json",
      read: fromGeojs,
    },
    {
      name: "ipwho.is",
      url: (ip) => `https://ipwho.is/${ip ? encodeURIComponent(ip) : ""}`,
      read: fromIpwho,
    },
    {
      name: "ipapi.co",
      url: (ip) => `https://ipapi.co/${ip ? encodeURIComponent(ip) + "/" : ""}json/`,
      read: fromIpapi,
    },
  ];

  // Bộ nhớ đệm trong phiên: tránh tiêu hết hạn mức miễn phí khi tra lại
  // cùng một IP nhiều lần.
  const cache = new Map();
  const CACHE_MAX = 24;

  /* Nhà nào vừa báo 429 bị gạch tên một khoảng — hạn mức miễn phí tính theo
     IP và hồi phục theo phút, nên gọi lại ngay chỉ ăn thêm 429. */
  const REST_MS = 10 * 60 * 1000;
  const restUntil = new Map();
  const resting = (name) => (restUntil.get(name) || 0) - Date.now();

  let dangTra = false;
  /* Lượt tra đang chờ trên mạng. Rời trang mà không abort() thì kết nối vẫn
     mở, và khi nó về sẽ in dòng kết quả vào terminal của một trang đang ẩn —
     người dùng quay lại thấy một trả lời không ai hỏi. */
  let controller = null;

  function show(term, rec) {
    const fields = [
      ["- " + t("Địa chỉ IP công khai"), rec.ip],
      ["- " + t("Phiên bản giao thức"), rec.version],
      ["- " + t("Quốc gia"), rec.country],
      ["- " + t("Tỉnh / Khu vực"), rec.region],
      ["- " + t("Thành phố"), rec.city],
      ["- " + t("Mã bưu chính"), rec.postal],
      ["- " + t("Tọa độ địa lý"), rec.coords],
      ["- " + t("Múi giờ hệ thống"), rec.timezone],
      ["- " + t("Đơn vị mạng (ISP)"), rec.org],
      ["- " + t("Mã vùng điện thoại"), rec.calling],
      ["- " + t("Nguồn dữ liệu"), rec.source],
    ];
    CyUtil.logLine(term, "t-ok", `[✓] ${t("TRUY VẤN THÀNH CÔNG DỮ LIỆU THỰC TẾ:")}`);
    CyUtil.logLine(term, "t-muted", "------------------------------------------------------------------");
    for (const [label, value] of fields) CyUtil.logLine(term, "t-info", `${label.padEnd(26)}: ${value || "N/A"}`);
    CyUtil.logLine(term, "t-muted", "------------------------------------------------------------------");
    CyUtil.logLine(term, "t-ok", `[+] ${t("Hoàn tất phân tích gói tin mạng.")}`);
    complete("realip", "Tra cứu thành công dữ liệu IP thực tế");
  }

  async function lookup(ipAddress) {
    const term = $("ipTermBody");
    const target = ipAddress.trim();

    if (!validIp(target)) {
      CyUtil.logLine(term, "t-err", `[!] ${t("IP không hợp lệ hoặc không tồn tại.")}`);
      return;
    }

    if (dangTra) {
      CyUtil.logLine(term, "t-warn", `[!] ${t("Đang có một lượt truy vấn chưa xong, chờ kết quả ở trên.")}`);
      return;
    }

    const cached = cache.get(target);
    if (cached) {
      CyUtil.logLine(term, "t-info", `[*] ${t("Dùng kết quả đã tra trong phiên hiện tại")}: ${target || t("IP của bạn (Client)")}`);
      show(term, cached);
      return;
    }

    CyUtil.logLine(term, "t-info", `[*] ${t("Đang truy vấn dữ liệu định vị IP để phân tích")} ${target || t("IP của bạn (Client)")}`);

    dangTra = true;
    controller = new AbortController();
    let nghiNhiem = 0;
    try {
      for (const provider of PROVIDERS) {
        const conNghi = resting(provider.name);
        if (conNghi > 0) {
          nghiNhiem++;
          CyUtil.logLine(term, "t-warn", `[!] ${provider.name} ${t("đang nghỉ vì vừa báo quá tải, bỏ qua lượt này")}: ${Math.ceil(conNghi / 60000)} ${t("phút")}`);
          continue;
        }
        CyUtil.logLine(term, "t-muted", `[*] ${t("Nhà cung cấp dữ liệu")}: ${provider.name}`);
        try {
          const res = await fetch(provider.url(target), { signal: controller.signal });
          if (res.status === 429) {
            restUntil.set(provider.name, Date.now() + REST_MS);
            nghiNhiem++;
            CyUtil.logLine(term, "t-warn", `[!] ${provider.name} ${t("đã vượt hạn mức lượt truy vấn miễn phí (429). Chuyển sang nhà cung cấp dự phòng...")}`);
            continue;
          }
          if (!res.ok) throw new Error("HTTP " + res.status);
          const rec = provider.read(await res.json());
          if (!rec) {
            CyUtil.logLine(term, "t-err", `[!] ${t("Lỗi")}: ${t("IP không hợp lệ hoặc không tồn tại.")}`);
            return;
          }
          cache.set(target, rec);
          if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
          show(term, rec);
          return;
        } catch (err) {
          /* Người dùng rời trang -> stop() gọi abort(). fetch trả lỗi AbortError,
             KHÔNG coi là "nhà cung cấp không phản hồi" và cũng không thử nhà
             kế tiếp: lượt này đã kết thúc, không còn ai xem kết quả. */
          if (err.name === "AbortError") {
            CyUtil.logLine(term, "t-warn", `[!] ${t("Đã huỷ lượt truy vấn vì bạn rời khỏi trang này.")}`);
            return;
          }
          CyUtil.logLine(term, "t-warn", `[!] ${provider.name}: ${t("không phản hồi")} (${err.message}). ${t("Thử nhà cung cấp dự phòng...")}`);
        }
      }
    } finally {
      dangTra = false;
      controller = null;
    }

    if (nghiNhiem) {
      CyUtil.logLine(term, "t-err", `[!] ${t("Mọi nhà cung cấp đều đang báo bận. Chờ vài phút rồi bấm lại — hạn mức miễn phí tính theo từng IP, không phải theo trình duyệt.")}`);
    } else {
      CyUtil.logLine(term, "t-err", `[!] ${t("Không thể kết nối")} — ${t("tất cả các nhà cung cấp dữ liệu định vị IP đều trả về lỗi.")} ${t("Kiểm tra mạng hoặc thử IP khác.")}`);
    }
  }

  function stop() {
    if (controller) controller.abort();
  }

  $("btnSearchIp").addEventListener("click", () => lookup($("targetIpInput").value));
  $("btnGetMyIp").addEventListener("click", () => {
    $("targetIpInput").value = "";
    lookup("");
  });

  Labs.realip = { stop };
})();
