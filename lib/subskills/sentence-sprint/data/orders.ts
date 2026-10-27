import type { SentenceTopic } from "../types";

// Bộ Đơn hàng & vận chuyển — ngữ liệu của email đặt hàng, báo trễ, đổi trả.
//
// Nhóm từ này sinh lỗi giới từ nhiều nhất: "arrive TO", "deliver ai cái gì",
// "in THE stock". Đó là lý do câu sai ở đây phần lớn là lỗi giới từ và lỗi
// chọn nhầm từ loại, chứ không phải lỗi nghĩa.

export const ordersTopic: SentenceTopic = {
  slug: "orders",
  name: "Đơn hàng & vận chuyển",
  emoji: "📦",
  blurb: "Đặt hàng, báo trễ, theo dõi bưu kiện, đổi hàng lỗi — ngữ liệu dày đặc ở Part 3, 4 và email",
  entries: [
    {
      en: "place an order",
      pos: "phrase",
      vi: "đặt hàng",
      frame: "We would like to ___ for fifty units of the X200.",
      frameAnswers: ["place an order"],
      model: "We would like to place an order for fifty units of the X200.",
      chunks: ["We would like", "to place an order", "for fifty units", "of the X200"],
      wrong: [
        {
          text: "We would like to order for fifty units of the X200.",
          why: "Động từ 'order' đi thẳng với hàng: 'order fifty units'. Chỉ 'place an order' mới cần 'for'.",
        },
        {
          text: "We would like to make an order for fifty units of the X200.",
          why: "Tiếng Anh thương mại nói 'place an order', không 'make an order'.",
        },
      ],
      why: "place an order for + hàng hoặc số lượng.",
      situation: "Bạn viết email cho nhà cung cấp để đặt 50 chiếc X200.",
      collocations: ["place an order for", "a bulk order", "cancel an order"],
    },
    {
      en: "shipment",
      pos: "n",
      vi: "lô hàng",
      frame: "The ___ from Osaka arrived two days late.",
      frameAnswers: ["shipment"],
      model: "The shipment from Osaka arrived two days late.",
      chunks: ["The shipment", "from Osaka", "arrived", "two days late"],
      wrong: [
        {
          text: "The shipment from Osaka arrived late two days.",
          why: "Khoảng thời gian trễ đứng TRƯỚC 'late': 'two days late'.",
        },
        {
          text: "The shipment from Osaka was arrived two days late.",
          why: "'arrive' là nội động từ, không có bị động.",
        },
      ],
      why: "shipment + arrive (chủ động); 'hai ngày trễ' = 'two days late'.",
      situation: "Bạn báo với trưởng phòng lô hàng từ Osaka về trễ hai ngày.",
      collocations: ["track a shipment", "a delayed shipment", "the shipment date"],
    },
    {
      en: "deliver",
      pos: "v",
      vi: "giao hàng",
      frame: "The courier will ___ the package to your office tomorrow.",
      frameAnswers: ["deliver"],
      model: "The courier will deliver the package to your office tomorrow.",
      chunks: ["The courier will deliver", "the package", "to your office", "tomorrow"],
      wrong: [
        {
          text: "The courier will deliver your office the package tomorrow.",
          why: "deliver không dùng kiểu 'deliver ai cái gì' — phải 'deliver cái gì TO ai'.",
        },
        {
          text: "The courier will delivery the package to your office tomorrow.",
          why: "delivery là danh từ; sau 'will' cần động từ 'deliver'.",
        },
      ],
      why: "deliver + hàng + to + nơi nhận.",
      situation: "Bạn báo khách bưu kiện sẽ được giao tới văn phòng họ ngày mai.",
      collocations: ["deliver an order", "free delivery", "a delivery address"],
    },
    {
      en: "delay",
      pos: "v / n",
      vi: "làm chậm trễ; sự chậm trễ",
      frame: "The shipment was ___ by a storm in the Pacific.",
      frameAnswers: ["delayed"],
      model: "The shipment was delayed by a storm in the Pacific.",
      chunks: ["The shipment", "was delayed", "by a storm", "in the Pacific"],
      wrong: [
        {
          text: "The shipment was delay by a storm in the Pacific.",
          why: "Bị động cần V3: 'delayed'.",
        },
        {
          text: "The shipment delayed by a storm in the Pacific.",
          why: "Lô hàng BỊ hoãn; thiếu 'was' thành ra lô hàng đi hoãn cái gì đó.",
        },
      ],
      why: "be + V3 + by + nguyên nhân.",
      situation: "Bạn giải thích với khách vì sao hàng chưa tới.",
      collocations: ["a two-hour delay", "be delayed by", "without delay"],
    },
    {
      en: "in stock",
      pos: "phrase",
      vi: "còn hàng",
      frame: "That model is no longer ___ at our Boston branch.",
      frameAnswers: ["in stock"],
      model: "That model is no longer in stock at our Boston branch.",
      chunks: ["That model", "is no longer in stock", "at our Boston branch"],
      wrong: [
        {
          text: "That model is no longer in the stock at our Boston branch.",
          why: "Cụm cố định không có mạo từ: 'in stock'.",
        },
        {
          text: "That model does not have in stock at our Boston branch.",
          why: "Còn hàng hay hết hàng dùng 'be in stock', không dùng 'have'.",
        },
      ],
      why: "be in stock / be out of stock — không mạo từ.",
      situation: "Bạn trả lời khách hỏi mẫu đó ở chi nhánh Boston còn hàng không.",
      collocations: ["be in stock", "out of stock", "check stock levels"],
    },
    {
      en: "invoice",
      pos: "n",
      vi: "hoá đơn",
      frame: "Please pay the ___ within thirty days of receipt.",
      frameAnswers: ["invoice"],
      model: "Please pay the invoice within thirty days of receipt.",
      chunks: ["Please pay the invoice", "within thirty days", "of receipt"],
      wrong: [
        {
          text: "Please pay the invoice in thirty days of receipt.",
          why: "'Trong vòng' bao lâu là 'within'; 'in thirty days' nghĩa là 30 ngày nữa mới trả.",
        },
        {
          text: "Please pay for the invoice within thirty days of receipt.",
          why: "pay + hoá đơn đi thẳng; 'pay for' dùng với món hàng.",
        },
      ],
      why: "pay the invoice within + khoảng thời gian.",
      situation: "Bạn gửi hoá đơn kèm hạn thanh toán cho khách.",
      collocations: ["issue an invoice", "pay an invoice", "an outstanding invoice"],
    },
    {
      en: "ship",
      pos: "v",
      vi: "gửi hàng đi",
      frame: "We ___ all orders within one business day.",
      frameAnswers: ["ship"],
      model: "We ship all orders within one business day.",
      chunks: ["We ship", "all orders", "within one business day"],
      wrong: [
        {
          text: "We are ship all orders within one business day.",
          why: "'are' + V nguyên mẫu là sai — hoặc 'ship', hoặc 'are shipping'.",
        },
        {
          text: "We ship to all orders within one business day.",
          why: "ship + hàng. 'ship to' là gửi TỚI nơi nào, không phải tới đơn hàng.",
        },
      ],
      why: "ship + hàng (+ to + nơi nhận).",
      situation: "Bạn giới thiệu với khách mới chính sách gửi hàng của công ty.",
      collocations: ["ship an order", "ship to an address", "a shipping fee"],
    },
    {
      en: "track",
      pos: "v",
      vi: "theo dõi hành trình",
      frame: "You can ___ your parcel with the number in this email.",
      frameAnswers: ["track"],
      model: "You can track your parcel with the number in this email.",
      chunks: ["You can track", "your parcel", "with the number", "in this email"],
      wrong: [
        {
          text: "You can track for your parcel with the number in this email.",
          why: "track đi thẳng với tân ngữ, không 'track for'.",
        },
        {
          text: "You can tracking your parcel with the number in this email.",
          why: "Sau 'can' là V nguyên mẫu.",
        },
      ],
      why: "can + V; track + bưu kiện.",
      situation: "Bạn hướng dẫn khách tự tra đường đi của bưu kiện.",
      collocations: ["a tracking number", "track a shipment", "tracking information"],
    },
    {
      en: "defective",
      pos: "adj",
      vi: "bị lỗi",
      frame: "Three of the units we received were ___.",
      frameAnswers: ["defective"],
      model: "Three of the units we received were defective.",
      chunks: ["Three of the units", "we received", "were defective"],
      wrong: [
        {
          text: "Three of the units we received were defect.",
          why: "defect là danh từ (lỗi); tính từ là 'defective'.",
        },
        {
          text: "Three of the unit we received were defective.",
          why: "'three of the' phải đi với danh từ số nhiều.",
        },
      ],
      why: "be + defective; three of the + số nhiều.",
      situation: "Bạn báo nhà cung cấp rằng ba sản phẩm nhận được bị lỗi.",
      collocations: ["a defective item", "a manufacturing defect", "replace a defective unit"],
    },
    {
      en: "return",
      pos: "v",
      vi: "trả lại hàng",
      frame: "You may ___ any unused item within fourteen days.",
      frameAnswers: ["return"],
      model: "You may return any unused item within fourteen days.",
      chunks: ["You may return", "any unused item", "within fourteen days"],
      wrong: [
        {
          text: "You may return back any unused item within fourteen days.",
          why: "'return' đã có nghĩa trả lại — thêm 'back' là thừa.",
        },
        {
          text: "You may to return any unused item within fourteen days.",
          why: "Sau 'may' là V nguyên mẫu, không có 'to'.",
        },
      ],
      why: "may + V; return + hàng.",
      situation: "Bạn giải thích chính sách đổi trả cho khách.",
      collocations: ["return an item", "a return policy", "a full refund"],
    },
    {
      en: "warehouse",
      pos: "n",
      vi: "kho hàng",
      frame: "The goods are being held at our ___ near the port.",
      frameAnswers: ["warehouse"],
      model: "The goods are being held at our warehouse near the port.",
      chunks: ["The goods", "are being held", "at our warehouse", "near the port"],
      wrong: [
        {
          text: "The goods is being held at our warehouse near the port.",
          why: "'goods' luôn số nhiều, phải dùng 'are'.",
        },
        {
          text: "The goods are being hold at our warehouse near the port.",
          why: "Bị động cần V3: 'held'.",
        },
      ],
      why: "goods + are; be being + V3.",
      situation: "Bạn báo khách lô hàng đang nằm ở kho gần cảng.",
      collocations: ["store goods in a warehouse", "a warehouse near the port", "warehouse staff"],
    },
    {
      en: "arrive",
      pos: "v",
      vi: "tới nơi",
      frame: "The replacement parts should ___ at the factory on Monday.",
      frameAnswers: ["arrive"],
      model: "The replacement parts should arrive at the factory on Monday.",
      chunks: ["The replacement parts", "should arrive", "at the factory", "on Monday"],
      wrong: [
        {
          text: "The replacement parts should arrive to the factory on Monday.",
          why: "arrive AT một địa điểm, IN một thành phố hay quốc gia — không bao giờ 'arrive to'.",
        },
        {
          text: "The replacement parts should be arrived at the factory on Monday.",
          why: "'arrive' không có bị động.",
        },
      ],
      why: "arrive at / in + nơi; luôn chủ động.",
      situation: "Bạn báo xưởng là linh kiện thay thế sẽ tới vào thứ Hai.",
      collocations: ["arrive at the warehouse", "arrive on time", "the estimated arrival date"],
    },
  ],
  combos: [
    {
      words: ["place an order", "in stock"],
      situation: "Hỏi nhà cung cấp còn hàng không rồi mới đặt.",
      model: "Could you confirm the item is in stock before we place an order for one hundred units?",
    },
    {
      words: ["shipment", "delay"],
      situation: "Báo khách lô hàng bị chậm và lý do.",
      model: "Your shipment has been delayed by two days because of the storm.",
    },
    {
      words: ["invoice", "return"],
      situation: "Trả lời khách muốn trả hàng chưa dùng.",
      model: "Please return the unused items this week, and we will cancel the invoice.",
    },
    {
      words: ["track", "deliver", "arrive"],
      situation: "Hướng dẫn khách theo dõi đơn hàng đang trên đường.",
      model: "You can track the parcel online, and the courier will deliver it as soon as it arrives at our depot.",
    },
    {
      words: ["warehouse", "defective", "ship"],
      situation: "Giải thích cách công ty đổi hàng lỗi.",
      model: "As soon as you report a defective unit, we ship a replacement from the warehouse.",
    },
  ],
};
