alter table matches
  add column if not exists bottom_surviving_soldiers integer,
  add column if not exists top_surviving_soldiers integer,
  add column if not exists bottom_survival_turns integer,
  add column if not exists top_survival_turns integer;
