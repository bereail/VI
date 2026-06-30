require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./db')

const required = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'SEED_TEST_EMAIL', 'SEED_TEST_PASSWORD']
const missing = required.filter(k => !process.env[k])
if (missing.length) {
  console.error('Faltan variables de entorno: ' + missing.join(', '))
  console.error('Agregálas en el .env del servidor.')
  process.exit(1)
}

const USERS = [
  { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, label: 'admin' },
  { email: process.env.SEED_TEST_EMAIL, password: process.env.SEED_TEST_PASSWORD, label: 'peli (prueba)' },
]

const MOVIES_ADMIN = [
  {
    title: 'Mulholland Drive',
    year: 2001,
    director: 'David Lynch',
    genres: ['Drama', 'Misterio', 'Thriller'],
    runtime: 147,
    status: 'vista',
    rating: 5,
    watched_date: '2024-03-10',
    overview: 'Una aspirante a actriz llega a Hollywood y se enreda en una historia de identidad y sueños.',
    tmdb_id: 1018,
    cover_color: '#1a2a4a',
    priority: false,
  },
  {
    title: 'Parasite',
    year: 2019,
    director: 'Bong Joon-ho',
    genres: ['Drama', 'Comedia', 'Thriller'],
    runtime: 132,
    status: 'vista',
    rating: 5,
    watched_date: '2024-05-22',
    overview: 'Una familia pobre se infiltra en la vida de una familia adinerada de Seúl.',
    tmdb_id: 496243,
    cover_color: '#1a3a2a',
    priority: false,
  },
  {
    title: 'La La Land',
    year: 2016,
    director: 'Damien Chazelle',
    genres: ['Drama', 'Romance', 'Música'],
    runtime: 128,
    status: 'vista',
    rating: 4,
    watched_date: '2024-01-15',
    overview: 'Un pianista de jazz y una actriz aspirante se enamoran en Los Ángeles.',
    tmdb_id: 313369,
    cover_color: '#2a1a3a',
    priority: false,
  },
  {
    title: 'Perfect Days',
    year: 2023,
    director: 'Wim Wenders',
    genres: ['Drama'],
    runtime: 123,
    status: 'vista',
    rating: 5,
    watched_date: '2024-08-03',
    overview: 'Un hombre lleva una vida simple y contemplativa como limpiador de baños en Tokio.',
    tmdb_id: 976893,
    cover_color: '#3a2a1a',
    priority: false,
  },
  {
    title: 'Anora',
    year: 2024,
    director: 'Sean Baker',
    genres: ['Drama', 'Romance'],
    runtime: 139,
    status: 'pendiente',
    rating: 0,
    watched_date: null,
    overview: 'Una joven trabajadora sexual de Nueva York se casa impulsivamente con el hijo de un oligarca ruso.',
    tmdb_id: 1064213,
    cover_color: '#1a3a3a',
    priority: true,
  },
  {
    title: 'Dune: Parte 2',
    year: 2024,
    director: 'Denis Villeneuve',
    genres: ['Ciencia ficción', 'Aventura'],
    runtime: 166,
    status: 'pendiente',
    rating: 0,
    watched_date: null,
    overview: 'Paul Atreides une fuerzas con los Fremen para vengar a su familia.',
    tmdb_id: 693134,
    cover_color: '#3a3a1a',
    priority: true,
  },
]

const MOVIES_PELI = [
  {
    title: 'Inception',
    year: 2010,
    director: 'Christopher Nolan',
    genres: ['Ciencia ficción', 'Thriller'],
    runtime: 148,
    status: 'vista',
    rating: 5,
    watched_date: '2024-02-01',
    overview: 'Un ladrón que roba secretos corporativos a través de la tecnología de los sueños.',
    tmdb_id: 27205,
    cover_color: '#1a2a4a',
    priority: false,
  },
  {
    title: 'Interstellar',
    year: 2014,
    director: 'Christopher Nolan',
    genres: ['Ciencia ficción', 'Drama'],
    runtime: 169,
    status: 'vista',
    rating: 4,
    watched_date: '2024-04-12',
    overview: 'Un equipo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar.',
    tmdb_id: 157336,
    cover_color: '#2a1a3a',
    priority: false,
  },
  {
    title: 'El señor de los anillos: La comunidad del anillo',
    year: 2001,
    director: 'Peter Jackson',
    genres: ['Aventura', 'Fantasía'],
    runtime: 178,
    status: 'pendiente',
    rating: 0,
    watched_date: null,
    overview: 'Un hobbit emprende un viaje épico para destruir un anillo de poder.',
    tmdb_id: 120,
    cover_color: '#1a3a2a',
    priority: true,
  },
]

async function seedUser(email, password, label) {
  const hash = await bcrypt.hash(password, 10)
  const res = await pool.query(
    `INSERT INTO users(email, password_hash)
     VALUES($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, hash]
  )
  if (res.rows.length > 0) {
    console.log(`  ✓ Usuario creado: ${label} (${email})`)
    return res.rows[0].id
  }
  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email])
  console.log(`  · Usuario ya existe: ${label} (${email})`)
  return existing.rows[0].id
}

async function seedMovies(userId, movies, label) {
  const countRes = await pool.query('SELECT COUNT(*) FROM movies WHERE user_id=$1', [userId])
  if (parseInt(countRes.rows[0].count) > 0) {
    console.log(`  · Películas de ${label}: ya existen, se omiten`)
    return
  }
  for (const m of movies) {
    await pool.query(
      `INSERT INTO movies(
        user_id, title, year, director, genres, runtime,
        status, rating, watched_date, overview, tmdb_id,
        notes, priority, added_date
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
      [
        userId, m.title, m.year, m.director,
        JSON.stringify(m.genres), m.runtime,
        m.status, m.rating, m.watched_date || null,
        m.overview, m.tmdb_id || null,
        m.notes || null, m.priority,
      ]
    )
  }
  console.log(`  ✓ ${movies.length} películas creadas para ${label}`)
}

async function main() {
  console.log('\n🌱 Ejecutando seed...\n')

  try {
    const adminId = await seedUser(USERS[0].email, USERS[0].password, USERS[0].label)
    await seedMovies(adminId, MOVIES_ADMIN, USERS[0].label)

    const peliId = await seedUser(USERS[1].email, USERS[1].password, USERS[1].label)
    await seedMovies(peliId, MOVIES_PELI, USERS[1].label)

    console.log('\n✅ Seed completado.\n')
  } catch (err) {
    console.error('\n❌ Error en seed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
