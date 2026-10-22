UPDATE stage_progress
SET upgrades = jsonb_set(upgrades, '{plow}', '1'::jsonb)
WHERE upgrades->'plow' IN ('2'::jsonb, '3'::jsonb, '4'::jsonb, '5'::jsonb);
