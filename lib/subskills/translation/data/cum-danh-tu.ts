import type { TransLevel } from "../types";
import { buildLevelMeta } from "../levels";

// ─────────────────────────────────────────────────────────────────────────────
// Nhóm 1 — CỤM DANH TỪ DÀI & TRẬT TỰ NGƯỢC
// Tiếng Anh chồng bổ ngữ TRƯỚC danh từ chính; tiếng Việt để bổ ngữ SAU.
// Kỹ năng cốt lõi: tìm danh từ chính → dịch nó ra đầu → lần ngược bổ ngữ.
// ─────────────────────────────────────────────────────────────────────────────

const meta = buildLevelMeta();

export const cumDanhTuLevels: TransLevel[] = [
  // ── L1 — Nhận diện danh từ chính ──────────────────────────────────────────
  {
    ...meta[0],
    questions: [
      {
        kind: "highlight",
        id: "cdt-l1-1",
        sentence: "the recently revised employee travel expense policy",
        instruction: "Bấm vào DANH TỪ CHÍNH của cụm (thứ đang thực sự được nói tới):",
        correctWords: ["policy"],
        explanation:
          "Danh từ chính đứng CUỐI cụm: policy. Mọi từ trước nó chỉ là bổ ngữ. Dịch: “chính sách chi phí đi lại của nhân viên vừa được sửa đổi gần đây”.",
      },
      {
        kind: "highlight",
        id: "cdt-l1-2",
        sentence: "a three-day regional sales training program",
        instruction: "Bấm vào DANH TỪ CHÍNH của cụm:",
        correctWords: ["program"],
        explanation:
          "program là danh từ chính — đây là một CHƯƠNG TRÌNH, không phải một buổi bán hàng. Dịch: “chương trình đào tạo bán hàng khu vực kéo dài ba ngày”.",
      },
      {
        kind: "highlight",
        id: "cdt-l1-3",
        sentence: "the newly appointed marketing department manager",
        instruction: "Bấm vào DANH TỪ CHÍNH của cụm:",
        correctWords: ["manager"],
        explanation:
          "manager là danh từ chính — đây là một CON NGƯỜI, không phải một phòng ban. Dịch: “trưởng phòng marketing vừa được bổ nhiệm”.",
      },
      {
        kind: "highlight",
        id: "cdt-l1-4",
        sentence: "all outstanding vendor payment requests",
        instruction: "Bấm vào DANH TỪ CHÍNH của cụm:",
        correctWords: ["requests"],
        explanation:
          "requests là danh từ chính. Lưu ý outstanding ở đây là “chưa thanh toán / còn tồn”, không phải “xuất sắc”. Dịch: “toàn bộ các đề nghị thanh toán cho nhà cung cấp còn tồn đọng”.",
      },
      {
        kind: "highlight",
        id: "cdt-l1-5",
        sentence: "The annual employee performance review schedule has been posted.",
        instruction: "Bấm vào DANH TỪ CHÍNH của CHỦ NGỮ (thứ đã được đăng lên):",
        correctWords: ["schedule"],
        explanation:
          "Thứ được đăng lên là LỊCH (schedule), không phải review hay employee. Dịch: “Lịch đánh giá kết quả làm việc thường niên của nhân viên đã được công bố.”",
      },
      {
        kind: "highlight",
        id: "cdt-l1-6",
        sentence: "the downtown branch office renovation project",
        instruction: "Bấm vào DANH TỪ CHÍNH của cụm:",
        correctWords: ["project"],
        explanation:
          "project là danh từ chính. Chuỗi downtown → branch → office → renovation đều bổ nghĩa cho nó. Dịch: “dự án cải tạo văn phòng chi nhánh ở khu trung tâm”.",
      },
      {
        kind: "highlight",
        id: "cdt-l1-7",
        sentence: "a complimentary two-year extended warranty plan",
        instruction: "Bấm vào DANH TỪ CHÍNH của cụm:",
        correctWords: ["plan"],
        explanation:
          "plan là danh từ chính. complimentary = miễn phí (không phải “khen ngợi”). Dịch: “gói bảo hành mở rộng hai năm miễn phí”.",
      },
      {
        kind: "highlight",
        id: "cdt-l1-8",
        sentence: "Our updated online customer feedback system launches next week.",
        instruction: "Bấm vào DANH TỪ CHÍNH của CHỦ NGỮ (thứ sắp ra mắt):",
        correctWords: ["system"],
        explanation:
          "Thứ ra mắt là HỆ THỐNG. Dịch: “Hệ thống tiếp nhận phản hồi khách hàng trực tuyến phiên bản mới của chúng tôi sẽ ra mắt vào tuần tới.”",
      },
    ],
  },

  // ── L2 — Bản dịch nào đúng ────────────────────────────────────────────────
  {
    ...meta[1],
    questions: [
      {
        kind: "compare",
        id: "cdt-l2-1",
        sentence: "Please review the attached quarterly sales performance report.",
        options: [
          "Vui lòng xem báo cáo kết quả kinh doanh quý đính kèm.",
          "Vui lòng xem kết quả kinh doanh của bản báo cáo quý đính kèm.",
          "Vui lòng xem xét đính kèm quý bán hàng hiệu suất báo cáo.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — danh từ chính “report” ra đầu, các bổ ngữ theo sau đúng thứ tự tiếng Việt.",
          "Sai quan hệ — biến “report” thành vật chứa còn “performance” thành thứ được xem. Ngược hẳn.",
          "Dịch tuyến tính từng từ theo thứ tự tiếng Anh — câu không đọc được.",
        ],
        explanation:
          "Quy tắc: danh từ chính (report) dịch ra ĐẦU câu tiếng Việt, rồi lần ngược các bổ ngữ từ gần nó ra xa: sales performance → quarterly → attached.",
      },
      {
        kind: "compare",
        id: "cdt-l2-2",
        sentence: "The new employee orientation session starts at 9 A.M.",
        options: [
          "Buổi định hướng mới dành cho nhân viên bắt đầu lúc 9 giờ sáng.",
          "Buổi định hướng dành cho nhân viên mới bắt đầu lúc 9 giờ sáng.",
          "Nhân viên mới của buổi định hướng bắt đầu lúc 9 giờ sáng.",
        ],
        correct: 1,
        optionNotes: [
          "Gắn sai bổ ngữ — “new” bổ nghĩa cho employee, không phải cho session.",
          "Đúng — new employee là một cụm cố định (“nhân viên mới”), orientation session là buổi định hướng dành cho họ.",
          "Sai quan hệ — biến người thành sở hữu của buổi họp.",
        ],
        explanation:
          "Bẫy hay gặp nhất: tính từ đứng đầu chuỗi KHÔNG nhất thiết bổ nghĩa cho danh từ chính. Ở đây “new” dính với “employee”, không dính với “session”.",
      },
      {
        kind: "compare",
        id: "cdt-l2-3",
        sentence: "We have hired an experienced software development team leader.",
        options: [
          "Chúng tôi đã tuyển một nhóm phát triển phần mềm giàu kinh nghiệm.",
          "Chúng tôi đã tuyển một trưởng nhóm của phần mềm phát triển có kinh nghiệm.",
          "Chúng tôi đã tuyển một trưởng nhóm phát triển phần mềm giàu kinh nghiệm.",
        ],
        correct: 2,
        optionNotes: [
          "Mất danh từ chính — tuyển “leader” (một người), không phải tuyển cả “team”.",
          "Đảo lộn software development thành “phần mềm phát triển” — vô nghĩa.",
          "Đúng — giữ đủ leader, và software development là cụm “phát triển phần mềm”.",
        ],
        explanation:
          "Đọc ngược từ cuối: leader ← team ← development ← software ← experienced. Bỏ sót danh từ chính là lỗi làm sai hoàn toàn nội dung.",
      },
      {
        kind: "compare",
        id: "cdt-l2-4",
        sentence: "All part-time staff parking permits expire on March 31.",
        options: [
          "Toàn bộ thẻ gửi xe của nhân viên bán thời gian hết hạn vào ngày 31/3.",
          "Toàn bộ thẻ gửi xe bán thời gian của nhân viên hết hạn vào ngày 31/3.",
          "Toàn bộ nhân viên bán thời gian gửi xe hết hạn vào ngày 31/3.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — permits là danh từ chính; part-time gắn với staff.",
          "Gắn sai bổ ngữ — thành “thẻ gửi xe bán thời gian”, tức là cái thẻ chỉ dùng bán thời gian.",
          "Mất danh từ chính — thành ra nhân viên hết hạn chứ không phải cái thẻ.",
        ],
        explanation:
          "Chuỗi part-time staff / parking permits gồm HAI cụm nhỏ ghép lại. Tách đúng cụm nhỏ trước khi dịch là bước quyết định.",
      },
      {
        kind: "compare",
        id: "cdt-l2-5",
        sentence: "Attached is the updated warehouse safety inspection checklist.",
        options: [
          "Đính kèm là bản kiểm tra an toàn của danh mục kho hàng mới.",
          "Đính kèm là danh mục kiểm tra an toàn kho hàng đã cập nhật.",
          "Đính kèm là kho hàng an toàn kiểm tra danh mục đã cập nhật.",
        ],
        correct: 1,
        optionNotes: [
          "Đảo ngược quan hệ giữa checklist và inspection.",
          "Đúng — checklist ra đầu, rồi inspection → safety → warehouse, cuối cùng là updated.",
          "Dịch tuyến tính — không thành câu tiếng Việt.",
        ],
        explanation:
          "Cụm bốn tầng: checklist ← inspection ← safety ← warehouse. Tiếng Việt bóc ngược đúng theo thứ tự đó.",
      },
      {
        kind: "compare",
        id: "cdt-l2-6",
        sentence: "Ms. Lopez will lead the customer service quality improvement initiative.",
        options: [
          "Bà Lopez sẽ phụ trách chất lượng của sáng kiến cải thiện dịch vụ khách hàng.",
          "Bà Lopez sẽ dẫn dắt dịch vụ khách hàng chất lượng cải tiến sáng kiến.",
          "Bà Lopez sẽ phụ trách sáng kiến cải thiện chất lượng dịch vụ khách hàng.",
        ],
        correct: 2,
        optionNotes: [
          "Đảo quan hệ — thành ra bà ấy phụ trách “chất lượng của sáng kiến”.",
          "Dịch tuyến tính, không thành câu.",
          "Đúng — initiative ← improvement ← quality ← customer service.",
        ],
        explanation:
          "Cụm càng dài thì càng phải bóc ngược từng tầng một, tuyệt đối không dịch theo thứ tự xuất hiện.",
      },
      {
        kind: "compare",
        id: "cdt-l2-7",
        sentence: "Please submit your completed expense reimbursement form to Accounting.",
        options: [
          "Vui lòng nộp mẫu đơn hoàn ứng chi phí đã điền đầy đủ cho phòng Kế toán.",
          "Vui lòng nộp mẫu đơn chi phí đã được hoàn lại cho phòng Kế toán.",
          "Vui lòng nộp chi phí hoàn lại của mẫu đơn đã hoàn thành cho phòng Kế toán.",
        ],
        correct: 0,
        optionNotes: [
          "Đúng — completed bổ nghĩa cho form (đơn đã điền xong), reimbursement gắn với expense.",
          "Hiểu sai completed và reimbursement — thành ra tiền đã được hoàn rồi, trong khi thực tế mới đang xin.",
          "Đảo hết quan hệ giữa form / expense / reimbursement.",
        ],
        explanation:
          "“completed” ở đây là “đã điền đầy đủ”, mô tả cái ĐƠN. Nếu gắn nhầm sang reimbursement thì đảo ngược cả tình huống: xin hoàn tiền thành đã nhận tiền.",
      },
      {
        kind: "compare",
        id: "cdt-l2-8",
        sentence: "The building's emergency exit door lock was replaced last week.",
        options: [
          "Cửa thoát hiểm của ổ khoá toà nhà đã được thay vào tuần trước.",
          "Toà nhà khẩn cấp lối ra cửa khoá đã được thay tuần trước.",
          "Ổ khoá cửa thoát hiểm của toà nhà đã được thay vào tuần trước.",
        ],
        correct: 2,
        optionNotes: [
          "Đảo lock và door — thứ được thay là ổ khoá, không phải cả cánh cửa.",
          "Dịch tuyến tính từng từ.",
          "Đúng — lock ← door ← exit ← emergency, sở hữu “của toà nhà” đặt cuối.",
        ],
        explanation:
          "Sở hữu cách ('s) trong tiếng Anh đứng ĐẦU, trong tiếng Việt đứng CUỐI. Đây là một tầng đảo nữa cần nhớ.",
      },
    ],
  },

  // ── L3 — Xếp lại trật tự ──────────────────────────────────────────────────
  {
    ...meta[2],
    questions: [
      {
        kind: "order",
        id: "cdt-l3-1",
        sentence: "the annual employee performance review process",
        chunks: ["quy trình đánh giá", "kết quả làm việc", "của nhân viên", "hằng năm"],
        hint: "Bắt đầu bằng danh từ chính: process.",
        explanation:
          "process → review → performance → employee → annual. Tiếng Việt đi đúng chiều ngược lại với tiếng Anh.",
      },
      {
        kind: "order",
        id: "cdt-l3-2",
        sentence: "a two-week paid training program for new hires",
        chunks: [
          "chương trình đào tạo",
          "có trả lương",
          "kéo dài hai tuần",
          "dành cho nhân viên mới",
        ],
        hint: "for new hires đã ở sau danh từ chính rồi — giữ nguyên vị trí cuối.",
        explanation:
          "Phần bổ ngữ đứng SAU trong tiếng Anh (for new hires) thì tiếng Việt cũng để sau. Chỉ phần đứng trước mới cần đảo.",
      },
      {
        kind: "order",
        id: "cdt-l3-3",
        sentence: "The revised office equipment purchase policy takes effect next month.",
        chunks: [
          "Chính sách mua sắm",
          "thiết bị văn phòng",
          "vừa sửa đổi",
          "sẽ có hiệu lực",
          "từ tháng sau",
        ],
        hint: "Chủ ngữ là cả một cụm dài — dựng xong chủ ngữ rồi mới tới động từ.",
        explanation:
          "Chủ ngữ = “Chính sách mua sắm thiết bị văn phòng vừa sửa đổi”. Xong chủ ngữ mới đến “sẽ có hiệu lực từ tháng sau”.",
      },
      {
        kind: "order",
        id: "cdt-l3-4",
        sentence: "We received several customer complaints about the delivery delay.",
        chunks: [
          "Chúng tôi đã nhận được",
          "một số khiếu nại",
          "của khách hàng",
          "về việc giao hàng chậm",
        ],
        hint: "customer complaints = khiếu nại của khách hàng.",
        explanation:
          "Danh từ ghép customer complaints phải tách thành “khiếu nại” + “của khách hàng”, không dịch thành “khách hàng khiếu nại”.",
      },
      {
        kind: "order",
        id: "cdt-l3-5",
        sentence: "an updated list of approved travel expense categories",
        chunks: ["danh sách", "các hạng mục chi phí đi lại", "được duyệt", "đã cập nhật"],
        hint: "Danh từ chính là list.",
        explanation:
          "list ra đầu; of approved travel expense categories là bổ ngữ; updated đẩy xuống cuối vì nó mô tả chính cái danh sách.",
      },
      {
        kind: "order",
        id: "cdt-l3-6",
        sentence: "Ms. Chen manages the regional sales support team.",
        chunks: ["Bà Chen phụ trách", "nhóm hỗ trợ bán hàng", "khu vực"],
        hint: "team là danh từ chính của tân ngữ.",
        explanation:
          "team ← support ← sales ← regional. Dịch: “nhóm hỗ trợ bán hàng khu vực”.",
      },
      {
        kind: "order",
        id: "cdt-l3-7",
        sentence: "Please return the signed equipment loan agreement by Friday.",
        chunks: [
          "Vui lòng gửi lại",
          "bản thoả thuận mượn thiết bị",
          "đã ký",
          "trước thứ Sáu",
        ],
        hint: "agreement là danh từ chính; signed mô tả chính nó.",
        explanation:
          "signed đứng trước trong tiếng Anh nhưng phải xuống sau trong tiếng Việt, vì nó mô tả danh từ chính agreement.",
      },
      {
        kind: "order",
        id: "cdt-l3-8",
        sentence: "The downtown branch office renovation schedule was delayed again.",
        chunks: [
          "Lịch cải tạo",
          "văn phòng chi nhánh",
          "ở khu trung tâm",
          "lại bị lùi thêm một lần nữa",
        ],
        hint: "Bốn tầng bổ ngữ — bóc ngược từ schedule.",
        explanation:
          "schedule → renovation → office → branch → downtown. Bóc đúng thứ tự này thì câu tiếng Việt tự nhiên ngay.",
      },
    ],
  },

  // ── L4 — Vá bản dịch ──────────────────────────────────────────────────────
  {
    ...meta[3],
    questions: [
      {
        kind: "repair",
        id: "cdt-l4-1",
        sentence: "The newly hired marketing department director will start on Monday.",
        draft: "___ vừa được tuyển sẽ bắt đầu làm việc từ thứ Hai.",
        blanks: [
          {
            options: [
              "Giám đốc phòng marketing",
              "Phòng marketing của giám đốc",
              "Marketing của phòng giám đốc",
            ],
            correct: 0,
            note: "director là danh từ chính — người đó là GIÁM ĐỐC, phòng marketing chỉ là nơi làm việc.",
          },
        ],
        explanation:
          "Chuỗi marketing → department → director bóc ngược thành “giám đốc phòng marketing”.",
      },
      {
        kind: "repair",
        id: "cdt-l4-2",
        sentence: "Please bring the completed customer satisfaction survey forms to the front desk.",
        draft: "Vui lòng mang ___ ___ đến quầy lễ tân.",
        blanks: [
          {
            options: [
              "các phiếu khảo sát mức độ hài lòng của khách hàng",
              "khách hàng hài lòng của các phiếu khảo sát",
              "mức độ hài lòng khảo sát phiếu khách hàng",
            ],
            correct: 0,
            note: "forms là danh từ chính, rồi survey → satisfaction → customer.",
          },
          {
            options: ["đã điền xong", "đã hoàn tất khảo sát", "đã được hài lòng"],
            correct: 0,
            note: "completed mô tả cái PHIẾU (đã điền xong), không mô tả khách hàng hay cuộc khảo sát.",
          },
        ],
        explanation:
          "Hai việc phải làm: bóc ngược cụm bốn tầng, và gắn “completed” đúng vào danh từ chính.",
      },
      {
        kind: "repair",
        id: "cdt-l4-3",
        sentence: "Our third-quarter regional sales figures exceeded expectations.",
        draft: "___ trong quý ba đã vượt kỳ vọng.",
        blanks: [
          {
            options: [
              "Doanh số theo khu vực",
              "Khu vực doanh số",
              "Số liệu của khu vực bán hàng",
            ],
            correct: 0,
            note: "figures ← sales ← regional: “doanh số (theo) khu vực”. Cụm regional sales figures là một khối.",
          },
        ],
        explanation:
          "third-quarter là mốc thời gian nên tiếng Việt đẩy ra sau chủ ngữ, thành “trong quý ba”.",
      },
      {
        kind: "repair",
        id: "cdt-l4-4",
        sentence: "All unused vacation days must be reported to the human resources department.",
        draft: "Toàn bộ ___ phải được báo lên ___.",
        blanks: [
          {
            options: [
              "số ngày phép chưa dùng",
              "kỳ nghỉ chưa sử dụng của ngày",
              "ngày chưa dùng của kỳ nghỉ",
            ],
            correct: 0,
            note: "days là danh từ chính; vacation days = ngày nghỉ phép; unused mô tả những ngày đó.",
          },
          {
            options: ["phòng Nhân sự", "nguồn nhân lực của phòng", "phòng của con người"],
            correct: 0,
            note: "human resources department là cụm cố định = phòng Nhân sự.",
          },
        ],
        explanation:
          "Nhiều cụm dài trong TOEIC là cụm CỐ ĐỊNH (human resources department, purchase order, expense report). Nhận ra cụm cố định thì khỏi phải bóc từng tầng.",
      },
      {
        kind: "repair",
        id: "cdt-l4-5",
        sentence: "The updated building maintenance request procedure is posted on the intranet.",
        draft: "___ đã cập nhật hiện được đăng trên mạng nội bộ.",
        blanks: [
          {
            options: [
              "Quy trình gửi yêu cầu bảo trì toà nhà",
              "Yêu cầu bảo trì của quy trình toà nhà",
              "Toà nhà bảo trì yêu cầu quy trình",
            ],
            correct: 0,
            note: "procedure ← request ← maintenance ← building.",
          },
        ],
        explanation:
          "Cụm năm tầng vẫn theo đúng một quy tắc: danh từ chính ra đầu, phần còn lại bóc ngược.",
      },
      {
        kind: "repair",
        id: "cdt-l4-6",
        sentence: "We are looking for an experienced part-time warehouse supervisor.",
        draft: "Chúng tôi đang tìm ___ ___.",
        blanks: [
          {
            options: [
              "một giám sát kho hàng làm bán thời gian",
              "một kho hàng giám sát bán thời gian",
              "một người bán thời gian của kho giám sát",
            ],
            correct: 0,
            note: "supervisor là người; part-time mô tả hình thức làm việc của người đó.",
          },
          {
            options: ["có kinh nghiệm", "được trải nghiệm", "đã từng thử"],
            correct: 0,
            note: "experienced = có kinh nghiệm, không phải “được trải nghiệm”.",
          },
        ],
        explanation:
          "Khi cụm có cả tính từ chỉ phẩm chất (experienced) và tính từ chỉ hình thức (part-time), tiếng Việt xếp cả hai ra SAU danh từ chính.",
      },
      {
        kind: "repair",
        id: "cdt-l4-7",
        sentence: "The company's annual employee recognition ceremony will be held in December.",
        draft: "___ sẽ được tổ chức vào tháng 12.",
        blanks: [
          {
            options: [
              "Lễ vinh danh nhân viên thường niên của công ty",
              "Công ty thường niên nhân viên vinh danh lễ",
              "Nhân viên của lễ vinh danh công ty hằng năm",
            ],
            correct: 0,
            note: "ceremony là danh từ chính; sở hữu cách “company's” xuống cuối cùng trong tiếng Việt.",
          },
        ],
        explanation:
          "Nhớ hai chiều đảo: bổ ngữ trước danh từ → chuyển ra sau; sở hữu cách 's ở đầu → chuyển xuống cuối.",
      },
      {
        kind: "repair",
        id: "cdt-l4-8",
        sentence: "Applicants should attach a recent professional reference letter.",
        draft: "Ứng viên cần đính kèm ___.",
        blanks: [
          {
            options: [
              "một thư giới thiệu từ nơi làm việc còn mới",
              "một lá thư tham khảo chuyên nghiệp gần đây",
              "một tham chiếu thư chuyên môn mới đây",
            ],
            correct: 0,
            note: "reference letter là cụm cố định = thư giới thiệu; professional ở đây là “từ nơi làm việc / mang tính công việc”, không phải “trông chuyên nghiệp”.",
          },
        ],
        explanation:
          "Phương án 2 nghe xuôi tai nhưng dịch sai nghĩa hai từ: “reference letter” không phải “thư tham khảo”, và “professional” không mô tả chất lượng lá thư.",
      },
    ],
  },

  // ── L5 — Dịch câu (AI chấm) ───────────────────────────────────────────────
  {
    ...meta[4],
    questions: [
      {
        kind: "free",
        id: "cdt-l5-1",
        source:
          "All employees must complete the mandatory online data security training course before December 15.",
        model:
          "Toàn bộ nhân viên phải hoàn thành khoá đào tạo trực tuyến bắt buộc về an toàn dữ liệu trước ngày 15 tháng 12.",
        focus:
          "Cụm danh từ 5 tầng: course ← training ← security ← data ← online ← mandatory. Phải bóc ngược, không dịch tuyến tính.",
        keyPoints: [
          "danh từ chính là khoá đào tạo/khoá học",
          "bắt buộc",
          "trực tuyến",
          "về an toàn dữ liệu",
          "hạn 15 tháng 12",
        ],
      },
      {
        kind: "free",
        id: "cdt-l5-2",
        source:
          "The building manager will distribute the revised emergency evacuation procedure handbook next Monday.",
        model:
          "Quản lý toà nhà sẽ phát cuốn sổ tay hướng dẫn quy trình sơ tán khẩn cấp bản sửa đổi vào thứ Hai tuần tới.",
        focus:
          "handbook là danh từ chính (thứ được phát), không phải procedure. Đây là bẫy bỏ sót danh từ chính.",
        keyPoints: [
          "thứ được phát là cuốn sổ tay/cẩm nang",
          "về quy trình sơ tán khẩn cấp",
          "bản sửa đổi/cập nhật",
          "thứ Hai tuần tới",
        ],
      },
      {
        kind: "free",
        id: "cdt-l5-3",
        source:
          "Attached you will find our updated corporate travel expense reimbursement guidelines.",
        model:
          "Đính kèm là bản hướng dẫn hoàn ứng chi phí công tác của công ty đã được cập nhật.",
        focus:
          "guidelines là danh từ chính; chuỗi corporate → travel → expense → reimbursement bóc ngược. “Attached you will find” là công thức email, không dịch từng chữ.",
        keyPoints: [
          "đính kèm",
          "hướng dẫn/quy định",
          "hoàn ứng chi phí",
          "công tác/đi lại của công ty",
          "đã cập nhật",
        ],
      },
      {
        kind: "free",
        id: "cdt-l5-4",
        source:
          "Our newly opened downtown branch offers extended weekend customer service hours.",
        model:
          "Chi nhánh mới mở ở khu trung tâm của chúng tôi phục vụ khách hàng thêm giờ vào cuối tuần.",
        focus:
          "hours là danh từ chính của tân ngữ; extended weekend customer service hours = khung giờ phục vụ khách hàng kéo dài vào cuối tuần.",
        keyPoints: [
          "chi nhánh mới mở",
          "khu trung tâm",
          "giờ phục vụ khách hàng kéo dài/thêm giờ",
          "vào cuối tuần",
        ],
      },
      {
        kind: "free",
        id: "cdt-l5-5",
        source:
          "Please forward all outstanding vendor invoice payment requests to the accounts payable team.",
        model:
          "Vui lòng chuyển toàn bộ đề nghị thanh toán hoá đơn nhà cung cấp còn tồn đọng cho bộ phận công nợ phải trả.",
        focus:
          "requests là danh từ chính; outstanding = còn tồn đọng, chưa xử lý (KHÔNG phải “xuất sắc”). accounts payable = công nợ phải trả.",
        keyPoints: [
          "chuyển/gửi",
          "đề nghị thanh toán",
          "hoá đơn nhà cung cấp",
          "còn tồn đọng/chưa xử lý",
          "bộ phận công nợ phải trả/kế toán công nợ",
        ],
      },
    ],
  },

  // ── L6 — Dịch đoạn Part 7 (AI chấm) ───────────────────────────────────────
  {
    ...meta[5],
    questions: [
      {
        kind: "free",
        id: "cdt-l6-1",
        source:
          "NOTICE TO ALL TENANTS\n\nBeginning next month, the building's after-hours visitor registration procedure will change. All visitors arriving after 7 P.M. must be listed on the online guest access request form at least two hours in advance. Tenants who fail to submit the form will be asked to escort their guests from the lobby in person.",
        model:
          "THÔNG BÁO TỚI TOÀN BỘ KHÁCH THUÊ\n\nTừ tháng sau, quy trình đăng ký khách đến ngoài giờ của toà nhà sẽ thay đổi. Mọi khách đến sau 7 giờ tối đều phải được khai vào mẫu đăng ký ra vào trực tuyến, chậm nhất là hai tiếng trước đó. Khách thuê nào không nộp mẫu đăng ký sẽ phải tự xuống sảnh đón khách của mình.",
        focus:
          "Ba cụm danh từ dài chồng nhau: after-hours visitor registration procedure, online guest access request form. Cùng với đó là hệ quả ở câu cuối — không nộp đơn thì phải tự xuống đón.",
        keyPoints: [
          "quy trình đăng ký khách ngoài giờ sẽ thay đổi từ tháng sau",
          "khách đến sau 7 giờ tối",
          "phải khai mẫu đăng ký trực tuyến trước ít nhất 2 tiếng",
          "không nộp thì phải tự xuống sảnh đón khách",
        ],
        comprehension: {
          question: "Khách thuê không điền mẫu đăng ký thì chuyện gì xảy ra?",
          options: [
            "Khách của họ bị từ chối vào toà nhà.",
            "Họ phải tự xuống sảnh đón khách của mình.",
            "Họ bị phạt tiền theo quy định của toà nhà.",
          ],
          correct: 1,
          explanation:
            "“will be asked to escort their guests from the lobby in person” — khách vẫn vào được, chỉ là chủ nhà phải tự xuống đón. Đọc lướt rất dễ nhầm sang “bị từ chối”.",
        },
      },
      {
        kind: "free",
        id: "cdt-l6-2",
        source:
          "From: Daniel Ortega, Facilities\nTo: All Staff\n\nThe third-floor conference room audiovisual equipment upgrade will take place from May 3 to May 7. During that week, the room will be unavailable. Staff with existing meeting reservations have been moved to the second-floor training room. No action is required on your part; updated room assignments appear automatically in your calendar invitations.",
        model:
          "Từ: Daniel Ortega, phòng Cơ sở vật chất\nGửi: Toàn thể nhân viên\n\nViệc nâng cấp thiết bị nghe nhìn của phòng họp tầng 3 sẽ diễn ra từ ngày 3 đến ngày 7 tháng 5. Trong tuần đó, phòng họp sẽ không sử dụng được. Những nhân viên đã đặt lịch họp được chuyển sang phòng đào tạo ở tầng 2. Quý vị không cần làm gì thêm; phòng họp mới sẽ tự động cập nhật trong thư mời trên lịch.",
        focus:
          "third-floor conference room audiovisual equipment upgrade là cụm sáu tầng — phải bóc ngược từ upgrade. Ngoài ra chú ý “No action is required on your part”.",
        keyPoints: [
          "nâng cấp thiết bị nghe nhìn phòng họp tầng 3",
          "từ 3 đến 7 tháng 5",
          "phòng không dùng được trong tuần đó",
          "người đã đặt lịch được chuyển sang phòng đào tạo tầng 2",
          "không cần làm gì thêm, lịch tự cập nhật",
        ],
        comprehension: {
          question: "Nhân viên đã đặt phòng họp trong tuần đó cần làm gì?",
          options: [
            "Đặt lại phòng khác qua phòng Cơ sở vật chất.",
            "Không cần làm gì — hệ thống đã tự chuyển phòng.",
            "Xác nhận lại với ông Ortega trước ngày 3 tháng 5.",
          ],
          correct: 1,
          explanation:
            "“No action is required on your part” là công thức trấn an rất hay gặp trong Part 7. Câu hỏi thường bẫy đúng chỗ này.",
        },
      },
      {
        kind: "free",
        id: "cdt-l6-3",
        source:
          "Thank you for your interest in our extended product warranty coverage plan. Enclosed is a summary of the additional repair cost protection options available to customers who registered their purchase within thirty days. Because our records show your registration was submitted on the thirty-fourth day, only the basic plan is available to you at this time.",
        model:
          "Cảm ơn quý khách đã quan tâm tới gói bảo hành mở rộng của chúng tôi. Đính kèm là bản tóm tắt các lựa chọn bảo vệ chi phí sửa chữa bổ sung, dành cho khách hàng đã đăng ký sản phẩm trong vòng ba mươi ngày. Tuy nhiên, theo hồ sơ của chúng tôi, quý khách đăng ký vào ngày thứ ba mươi tư, nên hiện tại quý khách chỉ có thể chọn gói cơ bản.",
        focus:
          "Hai cụm dài (extended product warranty coverage plan, additional repair cost protection options) cộng với một hàm ý ở câu cuối: khách đã đăng ký trễ nên bị loại khỏi gói cao cấp.",
        keyPoints: [
          "cảm ơn đã quan tâm tới gói bảo hành mở rộng",
          "đính kèm bản tóm tắt các lựa chọn bảo vệ chi phí sửa chữa",
          "điều kiện: đăng ký trong vòng 30 ngày",
          "khách đăng ký ngày thứ 34",
          "chỉ còn gói cơ bản",
        ],
        comprehension: {
          question: "Vì sao khách hàng này không mua được gói bảo hành cao cấp?",
          options: [
            "Vì sản phẩm của họ không nằm trong danh mục được bảo hành.",
            "Vì họ đăng ký sản phẩm muộn hơn thời hạn 30 ngày.",
            "Vì gói cao cấp đã ngừng cung cấp cho khách hàng mới.",
          ],
          correct: 1,
          explanation:
            "Đoạn văn không nói thẳng “bạn đăng ký trễ”. Nó nêu điều kiện (trong 30 ngày) rồi nêu dữ kiện (ngày thứ 34) — người đọc phải tự nối hai chi tiết lại.",
        },
      },
    ],
  },
];
