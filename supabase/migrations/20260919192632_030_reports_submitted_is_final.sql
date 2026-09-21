-- CEAC: a manager's report does not need signing off. Submitted is final.
--
-- confirm_report() is removed rather than left callable. A capability
-- nobody has agreed to is how an unwanted workflow appears later by
-- accident. A correction is still possible — correct_report() creates a
-- new version — so nothing is lost.
--
-- confirmed_by and confirmed_at columns are kept. They are empty, harmless,
-- and dropping columns is destructive for no gain. 'confirmed' stays in the
-- status check only so no future row can fail validation; nothing can set
-- it now that the function is gone and there is no non-draft update policy.

drop function if exists confirm_report(uuid);

comment on column reports.confirmed_by is
  'Unused. CEAC decided a manager report needs no sign-off; submitted is final.';
comment on column reports.confirmed_at is
  'Unused. See confirmed_by.';
comment on column reports.profile_id is
  'Person-scope reports are not built. The employee record in the Admin People screen covers this ground; no separate person report workflow was defined.';
