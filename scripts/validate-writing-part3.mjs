import fs from "fs";
const dir = "E:/toeic-dictation-master/lib/subskills/writing-part3";
let bad = 0;
const err = (id, msg) => { console.log(`  ✗ ${id}: ${msg}`); bad++; };

for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
  const passages = data.passages ?? {};
  let n = 0;
  console.log(`\n${f}`);
  for (const lev of data.levels) {
    for (const ex of lev.exercises) {
      n++;
      const id = `${lev.difficulty}/${ex.id}`;
      if (ex.passageRef && !passages[ex.passageRef]) err(id, `passageRef "${ex.passageRef}" không có trong passages`);
      switch (ex.type) {
        case "mcq": {
          const ids = ex.options.map(o => o.id);
          if (new Set(ids).size !== ids.length) err(id, "option id trùng nhau");
          for (const c of ex.correctAnswers) if (!ids.includes(c)) err(id, `correctAnswer "${c}" không có trong options`);
          if (ex.correctAnswers.length === 0) err(id, "không có đáp án đúng");
          if (!ex.multi && ex.correctAnswers.length > 1) err(id, "nhiều đáp án đúng nhưng thiếu multi:true");
          break;
        }
        case "labeling": {
          if (new Set(ex.labels).size !== ex.labels.length) err(id, "nhãn trùng nhau");
          for (const s of ex.sentences) if (!ex.labels.includes(s.label)) err(id, `nhãn "${s.label}" không có trong labels`);
          break;
        }
        case "matching": {
          const rights = ex.pairs.map(p => p.right);
          if (new Set(rights).size !== rights.length) err(id, "vế phải trùng nhau — Select sẽ nhập nhằng");
          const lefts = ex.pairs.map(p => p.left);
          if (new Set(lefts).size !== lefts.length) err(id, "vế trái trùng nhau");
          break;
        }
        case "ordering": {
          if (new Set(ex.items).size !== ex.items.length) err(id, "item trùng nhau — vùng chờ sẽ xoá nhầm");
          if (ex.items.length < 2) err(id, "cần ít nhất 2 item");
          break;
        }
        case "type_blank": {
          const blanks = ex.sentence.split("___").length - 1;
          if (blanks !== ex.answers.length) err(id, `${blanks} chỗ trống nhưng ${ex.answers.length} đáp án`);
          if (ex.accepted && ex.accepted.length !== ex.answers.length) err(id, "accepted lệch số phần tử với answers");
          break;
        }
        case "error_spot": {
          if (ex.errorIndex < 0 || ex.errorIndex >= ex.lines.length) err(id, `errorIndex ${ex.errorIndex} ngoài phạm vi ${ex.lines.length} dòng`);
          if (!ex.fix || !ex.errorLabel) err(id, "thiếu fix hoặc errorLabel");
          break;
        }
        case "mission_audit": {
          if (!ex.missions?.length) err(id, "không có mission");
          if (!ex.draft?.length) err(id, "không có draft");
          if (ex.missions.every(m => m.done)) err(id, "mọi mission đều done — bài không dạy được gì");
          break;
        }
        case "word_bank": {
          const blanks = ex.sentence.split("___").length - 1;
          if (blanks !== ex.answers.length) err(id, `${blanks} chỗ trống nhưng ${ex.answers.length} đáp án`);
          if (new Set(ex.bank).size !== ex.bank.length) err(id, "ngân hàng từ có phần tử trùng — bấm chọn sẽ nhầm ô");
          for (const a of ex.answers) if (!ex.bank.includes(a)) err(id, `đáp án "${a}" không có trong ngân hàng từ`);
          if (ex.bank.length < ex.answers.length) err(id, "ngân hàng ít hơn số chỗ trống");
          break;
        }
        case "word_order": {
          const joined = ex.tokens.join(" ");
          const norm = t => t.toLowerCase().replace(/[.,!?;:"']/g, "").replace(/\s+/g, " ").trim();
          if (norm(joined) !== norm(ex.answer)) err(id, `ghép tokens theo thứ tự khai báo KHÔNG ra answer:
      tokens -> "${joined}"
      answer -> "${ex.answer}"`);
          if (new Set(ex.tokens).size !== ex.tokens.length) err(id, "token trùng nhau — vùng chờ sẽ xoá nhầm");
          if (ex.tokens.length < 3) err(id, "ít hơn 3 cụm thì không còn là bài sắp xếp");
          break;
        }
        case "translate": {
          if (!ex.vi || !ex.answer) err(id, "thiếu vi hoặc answer");
          if (ex.accepted?.includes(ex.answer)) err(id, "accepted lặp lại chính answer");
          break;
        }
        case "compare": {
          if (ex.better !== "A" && ex.better !== "B") err(id, `better "${ex.better}" phải là A hoặc B`);
          const rids = ex.reasons.map(r => r.id);
          if (new Set(rids).size !== rids.length) err(id, "reason id trùng nhau");
          if (!rids.includes(ex.correctReason)) err(id, `correctReason "${ex.correctReason}" không có trong reasons`);
          if (!ex.versionA?.length || !ex.versionB?.length) err(id, "thiếu versionA hoặc versionB");
          break;
        }
        case "trim": {
          if (!ex.cutIndexes?.length) err(id, "không có câu nào phải bỏ — bấm bừa 'không bỏ gì' sẽ ăn 100%");
          if (ex.cutIndexes.length >= ex.lines.length) err(id, "bỏ hết mọi dòng");
          for (const i of ex.cutIndexes) if (i < 0 || i >= ex.lines.length) err(id, `cutIndex ${i} ngoài phạm vi ${ex.lines.length} dòng`);
          if (new Set(ex.cutIndexes).size !== ex.cutIndexes.length) err(id, "cutIndexes có phần tử trùng");
          for (let i = 0; i < ex.lines.length; i++) if (!ex.reasons?.[String(i)]) err(id, `thiếu reasons["${i}"] — dòng này sẽ không có giải thích`);
          break;
        }
        case "timed_write": {
          if (!(ex.minWords > 0)) err(id, "minWords phải > 0");
          if (!(ex.seconds > 0)) err(id, "seconds phải > 0");
          if (!ex.checks?.length) err(id, "không có mục tự soi");
          if (!ex.prompt) err(id, "thiếu prompt");
          break;
        }
        default: err(id, `type "${ex.type}" chưa có renderer`);
      }
      if (!ex.explanation || ex.explanation.length < 40) err(id, "explanation thiếu hoặc quá ngắn");
    }
  }
  const counts = data.levels.map(l => `${l.difficulty}:${l.exercises.length}`).join(" · ");
  console.log(`  ${n} bài — ${counts}`);
}
console.log(bad === 0 ? "\n✓ Tất cả hợp lệ" : `\n✗ ${bad} lỗi`);
process.exit(bad === 0 ? 0 : 1);
