CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INT,
  director TEXT,
  genres JSONB DEFAULT '[]',
  runtime INT,
  poster TEXT,
  overview TEXT,
  backdrop TEXT,
  tmdb_id INT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('vista', 'pendiente')),
  rating INT NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  watched_date DATE,
  notes TEXT,
  priority BOOLEAN NOT NULL DEFAULT false,
  added_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS movies_user_id_idx ON movies(user_id);
