ALTER TABLE players DROP CONSTRAINT IF EXISTS players_selected_stage_check;
ALTER TABLE players ADD CONSTRAINT players_selected_stage_check
    CHECK (selected_stage IN ('hills', 'industrial', 'pass'));
ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_stage_id_check;
ALTER TABLE runs ADD CONSTRAINT runs_stage_id_check
    CHECK (stage_id IN ('hills', 'industrial', 'pass'));
ALTER TABLE stage_progress DROP CONSTRAINT IF EXISTS stage_progress_stage_id_check;
ALTER TABLE stage_progress ADD CONSTRAINT stage_progress_stage_id_check
    CHECK (stage_id IN ('industrial', 'pass'));

UPDATE stage_progress SET completed = true
WHERE stage_id = 'industrial' AND NOT completed AND EXISTS (
    SELECT 1 FROM runs WHERE runs.player_id = stage_progress.player_id
        AND runs.stage_id = 'industrial' AND state = 'finished' AND report->>'reason' = 'finish'
);
INSERT INTO stage_progress(player_id, stage_id)
SELECT player_id, 'pass' FROM stage_progress WHERE stage_id = 'industrial' AND completed
ON CONFLICT DO NOTHING;
