/**
 * prisma/seed.ts
 * Run: npx tsx prisma/seed.ts
 *
 * Creates admin account for thầy Hiếu.
 * Requires env vars:
 *   SEED_ADMIN_EMAIL    — e.g. hieu@mytoeicdiary.com
 *   SEED_ADMIN_PASSWORD — strong password
 *
 * Safe to re-run (upsert pattern).
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

// ─── Supabase Admin client ────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Prisma ───────────────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD in .env"
    );
  }

  console.log(`\n🌱 Seeding admin account: ${email}`);

  // 1. Create or retrieve Supabase Auth user
  let userId: string;

  // Try to find existing user by email
  const { data: listData, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = listData.users.find((u) => u.email === email);

  if (existing) {
    console.log(`   Found existing auth user: ${existing.id}`);
    userId = existing.id;
    // Update password + set app_metadata.role for JWT-based role checks
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password,
        email_confirm: true,
        app_metadata: { role: "admin" },
      }
    );
    if (updateErr) throw updateErr;
    console.log(`   ✅ Password + app_metadata.role=admin updated`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`   ✅ Created auth user: ${userId}`);
  }

  // 2. Upsert Profile with admin role
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      displayName: "Anh Hiếu",
      role: "admin",
      level: 1,
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    update: {
      role: "admin",
      displayName: "Anh Hiếu",
    },
  });

  console.log(`   ✅ Profile upserted: role=${profile.role}, displayName=${profile.displayName}`);
  console.log(`\n✨ Done! Login with:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     admin\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
