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
-- MANA CALENDAR 2027 -- COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- Paste this entire script into your Supabase Dashboard -> SQL Editor and click RUN
-- ==============================================================================
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

fs.writeFileSync(path.join(ROOT, 'ALL_IN_ONE_SETUP.sql'), fullSql, 'utf-8');
fs.writeFileSync(path.join(ROOT, 'supabase', 'ALL_IN_ONE_SETUP.sql'), fullSql, 'utf-8');
console.log('Created ALL_IN_ONE_SETUP.sql successfully! Total length:', fullSql.length);
