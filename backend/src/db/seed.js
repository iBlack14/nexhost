// src/db/seed.js
const { pool } = require('./index')

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Planes
    await client.query(`
      INSERT INTO plans (name, slug, price, disk_gb, ram_mb, domains_limit, databases_limit, emails_limit, node_apps_limit, features)
      VALUES
        ('Starter', 'starter', 25.00, 10, 512,  1,  2,  5,  0, '["WordPress","SSL gratis","Backups semanales"]'),
        ('Pro',     'pro',     65.00, 25, 1024, 5,  10, 20, 2, '["WordPress","Node.js","SSL gratis","Backups diarios","Staging"]'),
        ('Business','business',120.00,50, 2048, 20, 30, 50, 10,'["WordPress","Node.js","Python","Redis","SSL gratis","Backups diarios","SSH acceso","Staging"]')
      ON CONFLICT (slug) DO NOTHING
    `)

    // Admin user
    await client.query(`
      INSERT INTO users (name, email, role, status, linux_user)
      VALUES ('Admin NexHost', 'admin@nexhost.pe', 'admin', 'active', 'nexadmin')
      ON CONFLICT (email) DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('✅ Seed completado')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en seed:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
