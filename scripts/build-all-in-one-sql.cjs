const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const migrationsDir = path.resolve(ROOT, 'supabase', 'migrations');
const files = [
  '20261006000001_core_schema.sql',
  '20261006000002_rls_policies.sql',
  '20261006000003_storage_buckets.sql',
  '20261006000004_calendar_panchangam_engine.sql',
  '20261006000005_weather_and_push_notifications.sql',
  '20261006000006_customer_business_qr_campaigns.sql',
  '20261007000001_phase7_security_performance_scalability.sql',
  '20261007000002_phase8_production_launch.sql',
];

let fullSql = `-- ==============================================================================
-- MANA CALENDAR 2027 -- IDEMPOTENT ALL-IN-ONE SUPABASE DATABASE SETUP
-- ==============================================================================
-- 1. DYNAMIC POLICY CLEANUP (GUARANTEES 100% SUCCESS ON RE-RUNS)
-- Drops any existing conflicting policies in public & storage schemas.
-- ==============================================================================
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname IN ('public', 'storage')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

`;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  fullSql += `\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
  fullSql += `-- FILE: ${file}\n`;
  fullSql += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
  fullSql += fs.readFileSync(filePath, 'utf-8') + '\n';
}

const seedPath = path.resolve(ROOT, 'supabase', 'seed', 'seed.sql');
if (fs.existsSync(seedPath)) {
  fullSql += `\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
  fullSql += `-- FILE: seed.sql (DEMO BUSINESSES & SEED DATA)\n`;
  fullSql += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
  fullSql += fs.readFileSync(seedPath, 'utf-8') + '\n';
}

// Make CREATE POLICY completely idempotent by adding DROP POLICY IF EXISTS before each
fullSql = fullSql.replace(/CREATE\s+POLICY\s+("[^"]+"|\w+)\s+ON\s+([^\s\(\);]+)/gi, (match, p1, p2) => {
  return `DROP POLICY IF EXISTS ${p1} ON ${p2};\nCREATE POLICY ${p1} ON ${p2}`;
});

// Also make storage bucket insert idempotent
fullSql = fullSql.replace(/INSERT\s+INTO\s+storage\.buckets\s*\(([^\)]+)\)\s*VALUES\s*\(([^\)]+)\);/gi, (match) => {
  if (!match.includes('ON CONFLICT')) {
    return match.replace(/;$/, ' ON CONFLICT (id) DO NOTHING;');
  }
  return match;
});

fs.writeFileSync(path.join(ROOT, 'ALL_IN_ONE_SETUP.sql'), fullSql, 'utf-8');
fs.writeFileSync(path.join(ROOT, 'supabase', 'ALL_IN_ONE_SETUP.sql'), fullSql, 'utf-8');

console.log('Successfully generated idempotent ALL_IN_ONE_SETUP.sql!');
console.log('Total characters:', fullSql.length);
