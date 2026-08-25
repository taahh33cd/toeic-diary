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
