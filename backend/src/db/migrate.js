// src/db/migrate.js
// Ejecutar con: node src/db/migrate.js

const { pool } = require('./index')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Planes de hosting
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        disk_gb INT NOT NULL,
        ram_mb INT NOT NULL,
        domains_limit INT NOT NULL,
        databases_limit INT NOT NULL,
        emails_limit INT NOT NULL,
        node_apps_limit INT NOT NULL,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified TIMESTAMPTZ,
        image TEXT,
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('admin','client')),
        plan_id UUID REFERENCES plans(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended','pending','cancelled')),
        disk_used_mb INT DEFAULT 0,
        plan_expires_at TIMESTAMPTZ,
        linux_user VARCHAR(50) UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // NextAuth - accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        token_type VARCHAR(50),
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      )
    `)

    // NextAuth - sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL
      )
    `)

    // NextAuth - verification tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMPTZ NOT NULL,
        UNIQUE(identifier, token)
      )
    `)

    // Dominios
    await client.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        domain VARCHAR(255) NOT NULL,
        type VARCHAR(20) DEFAULT 'wordpress' CHECK (type IN ('wordpress','node','static','php','python')),
        php_version VARCHAR(10) DEFAULT '8.3',
        document_root TEXT,
        ssl_enabled BOOLEAN DEFAULT false,
        ssl_expires_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended','pending','error')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Apps Node.js
    await client.query(`
      CREATE TABLE IF NOT EXISTS node_apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        port INT NOT NULL,
        start_command VARCHAR(255) DEFAULT 'npm start',
        node_version VARCHAR(10) DEFAULT '20',
        status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('running','stopped','error')),
        env_vars JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Bases de datos
    await client.query(`
      CREATE TABLE IF NOT EXISTS databases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        db_name VARCHAR(100) NOT NULL,
        db_user VARCHAR(100) NOT NULL,
        db_type VARCHAR(20) DEFAULT 'mysql' CHECK (db_type IN ('mysql','postgresql')),
        size_mb INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Cuentas de email
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
        address VARCHAR(255) UNIQUE NOT NULL,
        quota_mb INT DEFAULT 5120,
        used_mb INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Backups
    await client.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) DEFAULT 'full' CHECK (type IN ('full','database','files')),
        size_mb INT DEFAULT 0,
        path TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Tickets de soporte
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Mensajes de tickets
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        is_staff BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Facturas
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES plans(id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'PEN',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
        due_date TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Activity log
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        meta JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('✅ Migración completada exitosamente')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migración:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
