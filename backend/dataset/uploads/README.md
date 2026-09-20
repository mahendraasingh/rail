# RailTogether Synthetic Railway Dataset

## Purpose
This dataset supports development, testing, UI/API demonstrations, and matching-engine experiments for **RailTogether**, a platform that detects travelling groups whose assigned seats/berths are separated and identifies possible **voluntary** seat-exchange opportunities.

> **Synthetic-data disclaimer:** This dataset is synthetic and created exclusively for software development, testing, demonstration, and hackathon purposes. It does not contain real passenger information, scraped passenger records, live schedules, or official reservation changes.

## Generated scope
- Fixed random seed: `404404`
- Reference date: `2026-09-20`
- Future synthetic journeys: 180
- Synthetic trains: 30
- Synthetic routes: 30
- Journey-specific coaches: 1938
- Journey-specific seat positions: 133260
- Bookings: 12000
- Passengers: 35100
- Travelling groups: 12000
- Active confirmed seat assignments: 32985
- Exchange eligibility rows: 32985
- Scenario labels: 103

## File structure
1. `trains.csv` — synthetic train-level information.
2. `stations.csv` — station master.
3. `routes.csv` — station sequence and synthetic route timings per train.
4. `journeys.csv` — one row per synthetic scheduled trip.
5. `coaches.csv` — journey-specific coaches and class codes.
6. `seats.csv` — journey-specific seat/berth layout with row and position.
7. `bookings.csv` — booking/PNR level data.
8. `passengers.csv` — passenger records linked to bookings and groups.
9. `groups.csv` — group-level travelling-together metadata.
10. `seat_assignments.csv` — current active seat assignments for confirmed passengers.
11. `passenger_preferences.csv` — explicit voluntary exchange preferences.
12. `exchange_eligibility.csv` — current application-level eligibility state.
13. `scenario_labels.csv` — labelled test fixtures and expected behavior; these are test inputs, not matching decisions.
14. `data_dictionary.csv` — schema documentation for every CSV column.
15. `dataset_summary.json` — counts and scenario distribution for convenience.

## Relational keys
- `train_id` → `trains.csv.train_id`
- `route_id` identifies one train route; `routes.csv.train_id` links back to the train.
- `journey_id` → `journeys.csv.journey_id` and is the parent for coaches, assignments, preferences, and eligibility.
- `booking_id` → `bookings.csv.booking_id`; passenger rows and scenario labels use the same ID.
- `passenger_id` → `passengers.csv.passenger_id`; assignments/preferences/eligibility use the same stable ID.
- `group_id` → `groups.csv.group_id`; passengers and scenario labels reference it.
- `coach_id` → `coaches.csv.coach_id`; seats and assignments reference it.
- `seat_id` → `seats.csv.seat_id`; active assignments reference it.

## Important business rules encoded
- A confirmed passenger has exactly one active seat assignment.
- The same active seat cannot be assigned twice within one journey.
- RAC, waitlisted, and cancelled bookings have no active confirmed seat assignment.
- `willing_to_exchange = FALSE` results in `eligible = FALSE` unless a separately documented rule is added; the generated dataset uses the strict consent rule.
- Same-coach and same-class restrictions are represented in passenger preferences.
- Pending/confirmed swap states are synthetic **application states**, not official railway reservation changes.
- Seat-number difference is an MVP proximity signal only; `row_number` and `position` are included so the application can later build a better physical-distance model.
- Scenario labels tell the test harness what situation is intended. The matching engine must independently calculate recommendations from the raw inputs.

## Scenario coverage
The dataset includes labelled fixtures for: GROUP_TOGETHER, GROUP_SPLIT, EASY_EXCHANGE, NOT_WILLING_TO_EXCHANGE, MULTIPLE_POSSIBLE_EXCHANGES, SAME_COACH_PREFERENCE, DIFFERENT_CLASS, BERTH_COMPATIBILITY, NO_POSSIBLE_MATCH, MULTIPLE_GROUPS_IN_SAME_COACH, LARGE_GROUP, ELDERLY_PASSENGER, CHILD_WITH_FAMILY, PENDING_EXCHANGE, CONFIRMED_EXCHANGE, CANCELLED_BOOKING, WAITLIST_RAC, and PRIMARY_DEMO.

## Primary demo
The first journey is a synthetic Delhi → Chandigarh service. Its primary demo booking is a four-person group assigned to `B2-31`, `B2-32`, `B2-57`, and `B2-58`. Three other synthetic passengers are placed on `B2-45`, `B2-46`, and `B2-60`. The scenario is explicitly labelled `PRIMARY_DEMO`; the application should detect the split, filter out unwilling/locked users, calculate compatibility, and allow a simulated application-level request/accept/reject flow.

## Deterministic regeneration
Run:

```bash
python generate_dataset.py railway_dataset
python validate_dataset.py railway_dataset
```

The generator uses a fixed seed (`404404`), so rerunning it with the same code and Python version produces the same relational values and IDs.

## Validation
`validate_dataset.py` checks duplicate keys, foreign keys, passenger counts, group sizes, date/time ordering, coach/seat ownership, duplicate active seats, preference/eligibility consistency, assignment rules, and scenario references. A successful run prints `DATASET VALIDATION PASSED`.

## Loading into Node.js / Express / MongoDB
For a quick prototype, load the CSVs with a CSV parser such as `csv-parse` and upsert on the documented primary keys. In MongoDB, a typical flow is:

```text
trains -> routes -> journeys -> coaches -> seats
bookings -> passengers -> groups
seat_assignments -> passenger_preferences -> exchange_eligibility
scenario_labels (test fixtures)
```

Use `journey_id`, `booking_id`, `passenger_id`, `group_id`, `coach_id`, and `seat_id` as stable cross-collection keys.

## No PII policy
Names are synthetic combinations, contact fields use `demo_contact_######` tokens, and the dataset contains no phone numbers, real email addresses, or scraped passenger records.
