ALTER TABLE players ADD COLUMN IF NOT EXISTS selected_stage text NOT NULL DEFAULT 'hills'
    CHECK (selected_stage IN ('hills', 'industrial'));
ALTER TABLE players ADD COLUMN IF NOT EXISTS completed_hills boolean NOT NULL DEFAULT false;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS stage_id text NOT NULL DEFAULT 'hills'
    CHECK (stage_id IN ('hills', 'industrial'));
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stage_id text NOT NULL DEFAULT 'hills';
CREATE TABLE IF NOT EXISTS stage_progress (
    player_id uuid NOT NULL REFERENCES players(id),
    stage_id text NOT NULL CHECK (stage_id = 'industrial'),
    best_distance double precision NOT NULL DEFAULT 0 CHECK (best_distance >= 0),
    completed boolean NOT NULL DEFAULT false,
    upgrades jsonb NOT NULL DEFAULT '{"engine":0,"tank":0,"tires":0,"suspension":0,"plow":0}',
    PRIMARY KEY (player_id, stage_id)
);
UPDATE players SET completed_hills = true
WHERE NOT completed_hills AND (best_distance >= 1740 OR EXISTS (
    SELECT 1 FROM runs WHERE runs.player_id = players.id AND stage_id = 'hills'
        AND state = 'finished' AND report->>'reason' = 'finish'
));
INSERT INTO stage_progress(player_id, stage_id)
SELECT id, 'industrial' FROM players WHERE completed_hills
ON CONFLICT DO NOTHING;
