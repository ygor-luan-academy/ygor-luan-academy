# Schema do Banco de Dados

## Tabelas Principais

### `profiles`
```sql
id          UUID PRIMARY KEY (FK: auth.users)
email       TEXT UNIQUE NOT NULL
full_name   TEXT
avatar_url  TEXT
role        TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student'
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### `orders`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
payment_id      TEXT UNIQUE NOT NULL
status          TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'refunded'))
amount          DECIMAL(10,2) NOT NULL
payment_method  TEXT
created_at      TIMESTAMP DEFAULT NOW()
approved_at     TIMESTAMP
```

### `lessons`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title           TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
description     TEXT
video_url       TEXT NOT NULL
thumbnail_url   TEXT
duration_minutes INTEGER
module_number   INTEGER NOT NULL
order_number    INTEGER NOT NULL
is_published    BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### `modules`
```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title       TEXT NOT NULL
description TEXT
order_number INTEGER NOT NULL
created_at  TIMESTAMP DEFAULT NOW()
```

### `user_progress`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE
completed       BOOLEAN DEFAULT false
watch_time      INTEGER DEFAULT 0
completed_at    TIMESTAMP
UNIQUE(user_id, lesson_id)
```

### `mentorship_sessions`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
scheduled_at    TIMESTAMP NOT NULL
duration_minutes INTEGER DEFAULT 60
status          TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
meeting_url     TEXT
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

### `materials`
```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE
title       TEXT NOT NULL
file_url    TEXT NOT NULL
file_type   TEXT
file_size   INTEGER
created_at  TIMESTAMP DEFAULT NOW()
```

## Row Level Security (RLS) Policies

### Profiles
```sql
-- Usuarios veem apenas seu proprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuarios podem atualizar seu proprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin ve todos os perfis
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Lessons
```sql
-- Apenas alunos pagantes veem aulas publicadas
CREATE POLICY "Paid students can view published lessons"
  ON lessons FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Admin pode tudo
CREATE POLICY "Admin can manage lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### User Progress
```sql
-- Usuarios veem apenas seu progresso
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);
```
