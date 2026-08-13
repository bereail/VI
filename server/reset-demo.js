require('dotenv').config()
const pool = require('./db')
const { USERS, MOVIES_PELI, seedMovies } = require('./seed')

async function main() {
  const email = USERS[1].email
  if (!email) {
    console.error('SEED_TEST_EMAIL no está configurado.')
    process.exit(1)
  }

  console.log(`\n🔄 Reseteando datos de invitado (${email})...\n`)

  try {
    const result = await pool.query('SELECT id FROM users WHERE email=$1', [email])
    if (!result.rows.length) {
      console.error('El usuario de invitado no existe todavía. Corré primero: node seed.js')
      process.exit(1)
    }
    const userId = result.rows[0].id

    await pool.query('DELETE FROM movies WHERE user_id=$1', [userId])
    console.log('  ✓ Películas del invitado eliminadas')

    await seedMovies(userId, MOVIES_PELI, USERS[1].label)

    console.log('\n✅ Reset completado.\n')
  } catch (err) {
    console.error('\n❌ Error en reset:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
