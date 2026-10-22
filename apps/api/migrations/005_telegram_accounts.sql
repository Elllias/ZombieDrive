ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_id bigint;
ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_username text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_first_name text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_last_name text;
CREATE UNIQUE INDEX IF NOT EXISTS players_telegram_id ON players(telegram_id) WHERE telegram_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS player_sessions (
    session_hash text PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES players(id),
    last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_sessions_player_id ON player_sessions(player_id);

-- Retain existing guest cookies and their original expiry. The legacy column remains for compatibility.
INSERT INTO player_sessions(session_hash, player_id, last_seen)
SELECT session_hash, id, last_seen FROM players
ON CONFLICT (session_hash) DO NOTHING;
