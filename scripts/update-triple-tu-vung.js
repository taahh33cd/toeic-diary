/**
 * Update tu_vung in DB explanations for triple p2-p15
 * so the pre-reading vocabulary overlay shows real words.
 * Extracts vocab from reading-exercises-all.json and writes
 * to the first question's explanation tu_vung field.
 */
require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const data = JSON.parse(
  fs.readFileSync("E:/toeic-dictation-master/data/reading-exercises-all.json", "utf8")
);

// Extract vocab from exercise items: "Từ/Cụm \"X\" trong bài có nghĩa là gì?"
function extractTuVung(vocabItems) {
  return vocabItems.map((item) => {
    const m = item.question.match(/[""]([^""]+)[""]/);
    const tu = m ? m[1] : item.question.replace(/Từ |Cụm |" trong bài.*/, "").trim();
    const nghia = item.options[item.correctIndex];
    return { tu, nghia };
  });
}

async function main() {
  const client = await pool.connect();
  try {
    // Get all triple p2-p15 first-question IDs
    const r = await client.query(`
      SELECT rp.order_index, rq.id, rq.explanation
      FROM reading_passages rp
      JOIN reading_questions rq ON rp.id = rq.passage_id
      WHERE rp.type = 'triple' AND rp.order_index >= 2
        AND rq.order_index = 1
      ORDER BY rp.order_index
    `);

    let updated = 0;
    for (const row of r.rows) {
      const entry = data.find(
        (e) => e.type === "triple" && e.orderIndex === row.order_index
      );
      if (!entry || !entry.vocab || entry.vocab.length === 0) continue;

      const tuVung = extractTuVung(entry.vocab);
      let exp;
      try {
        exp = JSON.parse(row.explanation);
      } catch (_) {
        console.warn("Skip (not JSON):", row.id);
        continue;
      }

      exp.tu_vung = tuVung;
      await client.query(
        "UPDATE reading_questions SET explanation = $1 WHERE id = $2",
        [JSON.stringify(exp), row.id]
      );
      updated++;
      console.log(`p${row.order_index} q1: tu_vung =`, tuVung.map((v) => v.tu).join(", "));
    }

    console.log(`\nUpdated ${updated} questions with tu_vung.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
