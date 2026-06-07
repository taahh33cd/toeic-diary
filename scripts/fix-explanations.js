/**
 * Fix explanation format issues in DB:
 * 1. Triple p2-p15 (70 questions): Wrap plain text → minimal JSON
 * 2. Double q2-q5 (60 questions): Add missing dich_bai:"" field
 */
require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // ── 1. Triple p2-p15: plain text → minimal JSON ──────────────────────────
    const triples = await client.query(`
      SELECT rq.id, rq.explanation
      FROM reading_passages rp
      JOIN reading_questions rq ON rp.id = rq.passage_id
      WHERE rp.type = 'triple' AND rp.order_index >= 2
      ORDER BY rp.order_index, rq.order_index
    `);

    let tripleFixed = 0;
    for (const row of triples.rows) {
      // Skip if already valid JSON with dan_chung
      let isJson = false;
      try {
        const parsed = JSON.parse(row.explanation);
        if (parsed && typeof parsed === "object" && "dan_chung" in parsed) {
          isJson = true;
        }
      } catch (_) {}
      if (isJson) continue;

      // Wrap plain text as minimal JSON
      const minimal = {
        dan_chung: row.explanation.trim(),
        ham_y: "",
        lien_he: "",
        tu_vung: [],
        dich_bai: "",
      };
      await client.query(
        "UPDATE reading_questions SET explanation = $1 WHERE id = $2",
        [JSON.stringify(minimal), row.id]
      );
      tripleFixed++;
    }
    console.log(`Triple plain text → JSON: fixed ${tripleFixed} questions`);

    // ── 2. Double q2-q5: add missing dich_bai field ──────────────────────────
    const doubles = await client.query(`
      SELECT rq.id, rq.explanation
      FROM reading_passages rp
      JOIN reading_questions rq ON rp.id = rq.passage_id
      WHERE rp.type = 'double'
      ORDER BY rp.order_index, rq.order_index
    `);

    let doubleFixed = 0;
    for (const row of doubles.rows) {
      let parsed;
      try {
        parsed = JSON.parse(row.explanation);
      } catch (_) {
        console.warn("SKIP (not JSON):", row.id);
        continue;
      }
      if (!parsed || typeof parsed !== "object") continue;
      if ("dich_bai" in parsed) continue; // already has it

      parsed.dich_bai = "";
      await client.query(
        "UPDATE reading_questions SET explanation = $1 WHERE id = $2",
        [JSON.stringify(parsed), row.id]
      );
      doubleFixed++;
    }
    console.log(`Double missing dich_bai: fixed ${doubleFixed} questions`);

    // ── Verify ────────────────────────────────────────────────────────────────
    const check = await client.query(`
      SELECT rp.type,
        COUNT(*) FILTER (WHERE rq.explanation !~ '^\\{') AS plain_text,
        COUNT(*) FILTER (WHERE rq.explanation ~ '^\\{' AND rq.explanation NOT LIKE '%dich_bai%') AS missing_dich_bai,
        COUNT(*) FILTER (WHERE rq.explanation ~ '^\\{' AND rq.explanation LIKE '%dich_bai%') AS complete
      FROM reading_passages rp
      JOIN reading_questions rq ON rp.id = rq.passage_id
      GROUP BY rp.type
      ORDER BY rp.type
    `);
    console.log("\n── Verification ──────────────────────");
    check.rows.forEach((r) => {
      console.log(
        `${r.type}: plain=${r.plain_text} missing_dich_bai=${r.missing_dich_bai} complete=${r.complete}`
      );
    });
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
