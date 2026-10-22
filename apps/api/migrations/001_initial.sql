CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY, session_hash text NOT NULL UNIQUE,
  last_seen timestamptz NOT NULL DEFAULT now(), balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  best_distance double precision NOT NULL DEFAULT 0,
  upgrades jsonb NOT NULL DEFAULT '{"engine":0,"tank":0,"tires":0,"suspension":0}'
);
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id), start_key uuid NOT NULL,
  configuration_version text NOT NULL, stats jsonb NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','finished','abandoned')),
  report jsonb, reward integer, UNIQUE(player_id, start_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_run ON runs(player_id) WHERE state = 'active';
CREATE TABLE IF NOT EXISTS purchases (
  player_id uuid NOT NULL REFERENCES players(id), request_key uuid NOT NULL,
  upgrade text NOT NULL, expected_level integer NOT NULL, cost integer NOT NULL,
  PRIMARY KEY (player_id, request_key)
);
