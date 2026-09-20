-- Currency was hardcoded to cedis. A church receives partnership gifts
-- and diaspora giving in other currencies, and a dollar recorded into a
-- cedi total makes that total simply wrong.
--
-- Every money row now carries its own currency. All four tables are
-- empty, so this is a clean change with nothing to convert.
--
-- Deliberate decision: totals are never converted between currencies.
-- Conversion needs a rate, rates move daily, and a converted total is a
-- figure nobody can check later. Totals are grouped and shown per
-- currency instead: "GHS 42,000 and USD 500" is true; one merged number
-- using yesterday's rate is a fabrication.
--
-- amount_pesewas is renamed amount_minor: it holds the currency's minor
-- unit, which is pesewas for cedis and cents for dollars.

alter table organisations add column if not exists default_currency text not null default 'GHS';

alter table income_lines       rename column amount_pesewas to amount_minor;
alter table spend_lines        rename column amount_pesewas to amount_minor;
alter table internal_transfers rename column amount_pesewas to amount_minor;
alter table budgets            rename column amount_pesewas to amount_minor;

alter table income_lines       add column if not exists currency text not null default 'GHS';
alter table spend_lines        add column if not exists currency text not null default 'GHS';
alter table internal_transfers add column if not exists currency text not null default 'GHS';
alter table budgets            add column if not exists currency text not null default 'GHS';

-- Restricted to currencies with two decimal places, which every option
-- offered in the interface has. Currencies with none (yen) or three
-- (dinar) would break the minor-unit assumption and are deliberately
-- excluded rather than silently mishandled.
do $$
begin
  alter table income_lines       add constraint income_currency_ck       check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD'));
  alter table spend_lines        add constraint spend_currency_ck        check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD'));
  alter table internal_transfers add constraint transfer_currency_ck     check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD'));
  alter table budgets            add constraint budget_currency_ck       check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD'));
exception when duplicate_object then null;
end $$;

-- A transfer must not change currency in flight.
create index if not exists income_currency_idx on income_lines(currency);
create index if not exists spend_currency_idx on spend_lines(currency);
