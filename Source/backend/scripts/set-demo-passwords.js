const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'engine_service_db',
  user: 'arinazozulya',
});

const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'client1', password: 'client123' },
];

async function main() {
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);

    await pool.query(
      'UPDATE app_users SET password_hash = $1 WHERE username = $2',
      [hash, user.username],
    );

    console.log(`Пароль обновлён для пользователя: ${user.username}`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
