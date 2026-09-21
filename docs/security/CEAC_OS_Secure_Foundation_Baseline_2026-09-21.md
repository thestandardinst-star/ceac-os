# CEAC OS — Secure Foundation Baseline

**Date:** 21 September 2026  
**Purpose:** security checkpoint immediately before Administration & HR feature development.

## Result

The CEAC OS application and database now have a defined security boundary suitable for beginning the Admin/HR build.

This checkpoint does not claim that the finished CEAC system is production-handover complete. It establishes the rules that future Admin/HR code must build on.

## Controls established

1. **Database authority is server-side.** RLS and controlled RPCs are the authority boundary; client screens do not grant permission.
2. **Anonymous privileged execution is closed.** Public SECURITY DEFINER RPCs are not anonymously executable.
3. **Authenticated RPCs are constrained.** Signed-in privileged RPCs must bind to the actor or approved authority/visibility helpers.
4. **Cross-organisation configuration reads are blocked.**
5. **Future functions are closed by default.** Browser EXECUTE must be granted deliberately.
6. **Protected HR has its own non-exposed schema.**
7. **Protected HR documents have a private Storage bucket.**
8. **No direct browser access exists to that bucket yet.**
9. **Sensitive HR history has an append-only audit ledger.**
10. **Protected HR fields are prohibited from ordinary profiles.**
11. **CI replays the database from zero and tests role/RLS boundaries.**
12. **CI rejects high/critical npm dependency advisories.**
13. **Supabase CLI versions used by CI are pinned.**
14. **Dependabot monitors npm and GitHub Actions dependencies.**

## Live verification

Live Supabase has migrations 067 and 068 applied.

Verified live:

- protected schema inaccessible to `anon` / `authenticated`;
- HR tables RLS-enabled;
- private HR bucket not public;
- no direct browser Storage policy;
- immutable HR audit trigger present;
- zero anonymous SECURITY DEFINER execution;
- zero authenticated SECURITY DEFINER RPCs lacking the approved authority-binding pattern.

## Build discipline from this point

Every Admin/HR feature that introduces sensitive information must contain all three in one reviewed change:

1. data model / authority rule;
2. security test;
3. user interface.

Do not build the screen first and secure it later.

## Non-code account controls

Two account-level settings remain outside the capability of the connected tools:

- Supabase Auth leaked-password protection;
- GitHub branch/ruleset protection for `main`.

They are explicitly tracked in `docs/TAKEOVER_STATUS.md`.
