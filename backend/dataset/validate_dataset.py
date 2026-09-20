#!/usr/bin/env python3
"""Validation suite for the RailTogether synthetic railway dataset."""
from __future__ import annotations

import csv
import sys
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

REFERENCE_DATE = date(2026, 9, 20)
REQUIRED_FILES = [
    "trains.csv", "stations.csv", "routes.csv", "journeys.csv", "coaches.csv", "seats.csv",
    "bookings.csv", "passengers.csv", "groups.csv", "seat_assignments.csv",
    "passenger_preferences.csv", "exchange_eligibility.csv", "scenario_labels.csv", "data_dictionary.csv",
]
VALID_BERTHS = {"LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER", "CHAIR", "EXECUTIVE"}
VALID_POSITIONS = {"WINDOW", "MIDDLE", "AISLE", "SIDE"}
VALID_PASSENGER_TYPES = {"ADULT", "CHILD", "SENIOR", "INFANT"}
VALID_BOOKING_STATUS = {"CONFIRMED", "RAC", "WAITLISTED", "CANCELLED"}
VALID_ELIGIBILITY_REASONS = {
    "WILLING_TO_EXCHANGE", "NOT_WILLING_TO_EXCHANGE", "ALREADY_IN_PENDING_REQUEST", "ALREADY_CONFIRMED_SWAP"
}


def read_csv(root: Path, name: str):
    with (root / name).open("r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def duplicate_keys(rows, key_fn):
    c = Counter(key_fn(r) for r in rows)
    return [k for k, n in c.items() if n > 1]


def parse_date(v):
    return date.fromisoformat(v)


def parse_dt(v):
    return datetime.fromisoformat(v)


def hhmm_minutes(v):
    h, m = map(int, v.split(":"))
    return h * 60 + m


def main(root_arg: str = "."):
    root = Path(root_arg)
    errors = []
    checks = []

    def check(label, condition, detail=""):
        checks.append(label)
        if not condition:
            errors.append(f"FAIL: {label}" + (f" — {detail}" if detail else ""))

    # 1. Files exist
    check("required files exist", all((root / f).is_file() for f in REQUIRED_FILES))
    if errors:
        for e in errors:
            print(e)
        print(f"VALIDATION FAILED ({len(checks)} checks run)")
        return 1

    tables = {name: read_csv(root, name) for name in REQUIRED_FILES}
    trains = tables["trains.csv"]
    stations = tables["stations.csv"]
    routes = tables["routes.csv"]
    journeys = tables["journeys.csv"]
    coaches = tables["coaches.csv"]
    seats = tables["seats.csv"]
    bookings = tables["bookings.csv"]
    passengers = tables["passengers.csv"]
    groups = tables["groups.csv"]
    assignments = tables["seat_assignments.csv"]
    prefs = tables["passenger_preferences.csv"]
    elig = tables["exchange_eligibility.csv"]
    scenarios = tables["scenario_labels.csv"]
    dictionary = tables["data_dictionary.csv"]

    train_ids = {r["train_id"] for r in trains}
    station_ids = {r["station_id"] for r in stations}
    station_codes = {r["station_code"] for r in stations}
    journey_ids = {r["journey_id"] for r in journeys}
    booking_ids = {r["booking_id"] for r in bookings}
    passenger_ids = {r["passenger_id"] for r in passengers}
    group_ids = {r["group_id"] for r in groups}
    coach_ids = {r["coach_id"] for r in coaches}
    seat_ids = {r["seat_id"] for r in seats}

    train_by_id = {r["train_id"]: r for r in trains}
    station_by_id = {r["station_id"]: r for r in stations}
    station_by_code = {r["station_code"]: r for r in stations}
    journey_by_id = {r["journey_id"]: r for r in journeys}
    booking_by_id = {r["booking_id"]: r for r in bookings}
    group_by_id = {r["group_id"]: r for r in groups}
    passenger_by_id = {r["passenger_id"]: r for r in passengers}
    coach_by_id = {r["coach_id"]: r for r in coaches}
    seat_by_id = {r["seat_id"]: r for r in seats}

    # 2-8. Key uniqueness and basic enums.
    check("train_id unique", not duplicate_keys(trains, lambda r: r["train_id"]))
    check("station_id unique", not duplicate_keys(stations, lambda r: r["station_id"]))
    check("station_code unique", not duplicate_keys(stations, lambda r: r["station_code"]))
    check("journey_id unique", not duplicate_keys(journeys, lambda r: r["journey_id"]))
    check("booking_id unique", not duplicate_keys(bookings, lambda r: r["booking_id"]))
    check("PNR unique", not duplicate_keys(bookings, lambda r: r["pnr"]))
    check("passenger_id unique", not duplicate_keys(passengers, lambda r: r["passenger_id"]))
    check("group_id unique", not duplicate_keys(groups, lambda r: r["group_id"]))
    check("coach_id unique", not duplicate_keys(coaches, lambda r: r["coach_id"]))
    check("seat_id unique", not duplicate_keys(seats, lambda r: r["seat_id"]))
    check("assignment_id unique", not duplicate_keys(assignments, lambda r: r["assignment_id"]))
    check("preference_id unique", not duplicate_keys(prefs, lambda r: r["preference_id"]))
    check("eligibility_id unique", not duplicate_keys(elig, lambda r: r["eligibility_id"]))
    check("scenario_id unique", not duplicate_keys(scenarios, lambda r: r["scenario_id"]))
    check("route stop key unique", not duplicate_keys(routes, lambda r: (r["route_id"], r["sequence_number"])))
    check("booking status values valid", all(r["booking_status"] in VALID_BOOKING_STATUS for r in bookings))
    check("passenger type values valid", all(r["passenger_type"] in VALID_PASSENGER_TYPES for r in passengers))
    check("berth values valid", all(r["berth_type"] in VALID_BERTHS for r in seats))
    check("position values valid", all(r["position"] in VALID_POSITIONS for r in seats))
    check("eligibility reason values valid", all(r["reason"] in VALID_ELIGIBILITY_REASONS for r in elig))

    # 9-16. Train/route/journey integrity.
    route_by_train = defaultdict(list)
    for r in routes:
        route_by_train[r["train_id"]].append(r)
        check("route station FK valid", r["station_id"] in station_ids, r["station_id"])
    for tr in trains:
        rr = sorted(route_by_train[tr["train_id"]], key=lambda x: int(x["sequence_number"]))
        check("each train has a route", bool(rr), tr["train_id"])
        check("route sequence contiguous", [int(x["sequence_number"]) for x in rr] == list(range(1, len(rr)+1)), tr["train_id"])
        first_code = next(s["station_code"] for s in stations if s["station_id"] == rr[0]["station_id"])
        last_code = next(s["station_code"] for s in stations if s["station_id"] == rr[-1]["station_id"])
        check("train origin matches route", tr["origin_station_code"] == first_code, tr["train_id"])
        check("train destination matches route", tr["destination_station_code"] == last_code, tr["train_id"])
        last_dist = -1
        last_departure = None
        for stop in rr:
            arr_abs = int(stop["day_offset"]) * 1440 + hhmm_minutes(stop["arrival_time"])
            dep_abs = int(stop["day_offset"]) * 1440 + hhmm_minutes(stop["departure_time"])
            check("arrival before departure at stop", arr_abs < dep_abs, f"{tr['train_id']} seq {stop['sequence_number']}")
            check("route distance increases", int(stop["distance_from_origin_km"]) >= last_dist, f"{tr['train_id']} seq {stop['sequence_number']}")
            if last_departure is not None:
                check("route station order has nondecreasing time", last_departure < arr_abs, f"{tr['train_id']} seq {stop['sequence_number']}")
            last_dist = int(stop["distance_from_origin_km"])
            last_departure = dep_abs

    for j in journeys:
        check("journey train FK valid", j["train_id"] in train_ids, j["journey_id"])
        check("journey origin station code valid", j["origin_station_code"] in station_codes, j["journey_id"])
        check("journey destination station code valid", j["destination_station_code"] in station_codes, j["journey_id"])
        jd = parse_date(j["journey_date"])
        check("journey date is future", jd > REFERENCE_DATE, j["journey_id"])
        dep = parse_dt(j["scheduled_departure"])
        arr = parse_dt(j["scheduled_arrival"])
        check("journey arrival after departure", arr > dep, j["journey_id"])
        train = train_by_id[j["train_id"]]
        check("journey origin matches train", j["origin_station_code"] == train["origin_station_code"], j["journey_id"])
        check("journey destination matches train", j["destination_station_code"] == train["destination_station_code"], j["journey_id"])
        allowed = set(train["active_days"].split(","))
        dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][jd.weekday()]
        check("journey date matches active_days", dow in allowed, j["journey_id"])

    # 17-24. Coach/seat integrity.
    coach_counts_by_journey = Counter(c["journey_id"] for c in coaches)
    seat_count_by_coach = Counter(s["coach_id"] for s in seats)
    for c in coaches:
        check("coach journey FK valid", c["journey_id"] in journey_ids, c["coach_id"])
        check("coach class/capacity consistent", int(c["seat_capacity"]) == {"3A":72,"2A":48,"SL":72,"CC":78,"EC":56}[c["class_code"]], c["coach_id"])
        check("coach seat count equals capacity", seat_count_by_coach[c["coach_id"]] == int(c["seat_capacity"]), c["coach_id"])
    for j in journeys:
        train = train_by_id[j["train_id"]]
        check("journey coach count matches train", coach_counts_by_journey[j["journey_id"]] == int(train["total_coaches"]), j["journey_id"])
        local_coach_nums = [c["coach_number"] for c in coaches if c["journey_id"] == j["journey_id"]]
        check("coach numbers unique per journey", len(local_coach_nums) == len(set(local_coach_nums)), j["journey_id"])
    seat_keys = [(s["coach_id"], s["seat_number"]) for s in seats]
    check("seat number unique within each coach", len(seat_keys) == len(set(seat_keys)))
    for s in seats:
        coach = next((c for c in coaches if c["coach_id"] == s["coach_id"]), None)
        check("seat coach FK valid", coach is not None, s["seat_id"])
        if coach:
            check("seat coach number consistent", s["coach_number"] == coach["coach_number"], s["seat_id"])
            check("seat class-specific layout count", 1 <= int(s["seat_number"]) <= int(coach["seat_capacity"]), s["seat_id"])
        check("window flag consistent", (s["position"] == "WINDOW") == (s["is_window"].upper() == "TRUE"), s["seat_id"])
        check("aisle flag consistent", (s["position"] == "AISLE") == (s["is_aisle"].upper() == "TRUE"), s["seat_id"])

    # 25-33. Booking/passenger/group consistency.
    passengers_by_booking = defaultdict(list)
    passengers_by_group = defaultdict(list)
    for p in passengers:
        passengers_by_booking[p["booking_id"]].append(p)
        passengers_by_group[p["group_id"]].append(p)
        check("passenger booking FK valid", p["booking_id"] in booking_ids, p["passenger_id"])
        check("passenger journey FK valid", p["journey_id"] in journey_ids, p["passenger_id"])
        check("passenger group FK valid", p["group_id"] in group_ids, p["passenger_id"])
        b = booking_by_id[p["booking_id"]]
        g = group_by_id[p["group_id"]]
        check("passenger journey matches booking", p["journey_id"] == b["journey_id"], p["passenger_id"])
        check("passenger status matches booking", p["booking_status"] == b["booking_status"], p["passenger_id"])
        check("passenger group matches booking", g["booking_id"] == b["booking_id"] and g["journey_id"] == b["journey_id"], p["passenger_id"])
        age = int(p["age"])
        pt = p["passenger_type"]
        if pt == "INFANT": valid_age = 0 <= age <= 1
        elif pt == "CHILD": valid_age = 5 <= age <= 17
        elif pt == "ADULT": valid_age = 18 <= age <= 64
        else: valid_age = 65 <= age <= 120
        check("passenger age/type consistent", valid_age, p["passenger_id"])
    for b in bookings:
        check("booking journey FK valid", b["journey_id"] in journey_ids, b["booking_id"])
        check("booking date before journey", parse_date(b["booking_date"]) < parse_date(journey_by_id[b["journey_id"]]["journey_date"]), b["booking_id"])
        pset = passengers_by_booking[b["booking_id"]]
        check("booking passenger count consistent", len(pset) == int(b["number_of_passengers"]), b["booking_id"])
        check("booking primary contact valid", b["primary_contact_passenger_id"] in {p["passenger_id"] for p in pset}, b["booking_id"])
        check("booking type consistent with size", (b["booking_type"] == "INDIVIDUAL") == (int(b["number_of_passengers"]) == 1), b["booking_id"])
    for g in groups:
        check("group booking FK valid", g["booking_id"] in booking_ids, g["group_id"])
        check("group journey FK valid", g["journey_id"] in journey_ids, g["group_id"])
        check("group size consistent", len(passengers_by_group[g["group_id"]]) == int(g["group_size"]), g["group_id"])
        check("group one booking", {p["booking_id"] for p in passengers_by_group[g["group_id"]]} == {g["booking_id"]}, g["group_id"])

    # 34-39. Assignment integrity and no duplicate active seats.
    active_assignments = [a for a in assignments if a["assignment_status"] == "ACTIVE"]
    active_by_passenger = Counter(a["passenger_id"] for a in active_assignments)
    active_seat_keys = [(a["journey_id"], a["seat_id"]) for a in active_assignments]
    check("no duplicate active seat within journey", len(active_seat_keys) == len(set(active_seat_keys)))
    check("all active assignment passenger FKs valid", all(a["passenger_id"] in passenger_ids for a in active_assignments))
    check("all active assignment coach FKs valid", all(a["coach_id"] in coach_ids for a in active_assignments))
    check("all active assignment seat FKs valid", all(a["seat_id"] in seat_ids for a in active_assignments))
    check("every confirmed passenger has exactly one active assignment", all(active_by_passenger[p["passenger_id"]] == 1 for p in passengers if p["booking_status"] == "CONFIRMED"))
    check("non-confirmed passengers have no active assignment", all(active_by_passenger[p["passenger_id"]] == 0 for p in passengers if p["booking_status"] != "CONFIRMED"))
    for a in active_assignments:
        p = passenger_by_id[a["passenger_id"]]
        b = booking_by_id[a["booking_id"]]
        c = coach_by_id[a["coach_id"]]
        s = seat_by_id[a["seat_id"]]
        check("assignment passenger/booking consistent", p["booking_id"] == b["booking_id"] == a["booking_id"], a["assignment_id"])
        check("assignment journey consistent", p["journey_id"] == b["journey_id"] == c["journey_id"] == a["journey_id"], a["assignment_id"])
        check("assignment seat/coach consistent", s["coach_id"] == c["coach_id"] == a["coach_id"], a["assignment_id"])
        check("assignment seat number consistent", int(s["seat_number"]) == int(a["seat_number"]), a["assignment_id"])
        check("assignment berth type consistent", s["berth_type"] == a["berth_type"], a["assignment_id"])
        check("assignment coach number consistent", c["coach_number"] == a["coach_number"], a["assignment_id"])

    # 40-46. Preferences / eligibility.
    pref_by_pid = {r["passenger_id"]: r for r in prefs}
    elig_by_pid = {r["passenger_id"]: r for r in elig}
    confirmed_ids = {p["passenger_id"] for p in passengers if p["booking_status"] == "CONFIRMED"}
    check("preferences cover confirmed passengers exactly", set(pref_by_pid) == confirmed_ids)
    check("eligibility covers confirmed passengers exactly", set(elig_by_pid) == confirmed_ids)
    for p in passengers:
        pid = p["passenger_id"]
        if pid not in confirmed_ids:
            continue
        pr = pref_by_pid[pid]
        el = elig_by_pid[pid]
        check("preference journey FK consistent", pr["journey_id"] == p["journey_id"], pid)
        check("eligibility journey FK consistent", el["journey_id"] == p["journey_id"], pid)
        willing = pr["willing_to_exchange"].upper() == "TRUE"
        eligible = el["eligible"].upper() == "TRUE"
        check("unwilling passenger never eligible", willing or not eligible, pid)
        if el["reason"] == "WILLING_TO_EXCHANGE": check("willing reason implies eligible", willing and eligible, pid)
        if el["reason"] == "NOT_WILLING_TO_EXCHANGE": check("not-willing reason implies ineligible", (not willing) and (not eligible), pid)
        if el["reason"] in {"ALREADY_IN_PENDING_REQUEST", "ALREADY_CONFIRMED_SWAP"}: check("locked reason implies ineligible", not eligible, pid)
        check("preference boolean fields valid", pr["willing_to_exchange"].upper() in {"TRUE","FALSE"} and pr["exchange_same_coach_only"].upper() in {"TRUE","FALSE"} and pr["exchange_same_class_only"].upper() in {"TRUE","FALSE"}, pid)

    # 47-51. Scenario references and primary demo fixture.
    for s in scenarios:
        check("scenario journey FK valid", s["journey_id"] in journey_ids, s["scenario_id"])
        check("scenario booking FK valid", s["booking_id"] in booking_ids, s["scenario_id"])
        check("scenario group FK valid", s["group_id"] in group_ids, s["scenario_id"])
        b = booking_by_id[s["booking_id"]]
        g = group_by_id[s["group_id"]]
        check("scenario booking/group aligned", b["journey_id"] == s["journey_id"] and g["booking_id"] == b["booking_id"] and g["journey_id"] == b["journey_id"], s["scenario_id"])
    scenario_types = {s["scenario_type"] for s in scenarios}
    required_scenario_types = {
        "GROUP_TOGETHER", "GROUP_SPLIT", "EASY_EXCHANGE", "NOT_WILLING_TO_EXCHANGE", "MULTIPLE_POSSIBLE_EXCHANGES",
        "SAME_COACH_PREFERENCE", "DIFFERENT_CLASS", "BERTH_COMPATIBILITY", "NO_POSSIBLE_MATCH", "MULTIPLE_GROUPS_IN_SAME_COACH",
        "LARGE_GROUP", "ELDERLY_PASSENGER", "CHILD_WITH_FAMILY", "PENDING_EXCHANGE", "CONFIRMED_EXCHANGE", "CANCELLED_BOOKING",
        "WAITLIST_RAC", "PRIMARY_DEMO"
    }
    check("all required scenario types present", required_scenario_types.issubset(scenario_types))
    check("at least 100 scenarios", len(scenarios) >= 100)

    demo = next((s for s in scenarios if s["scenario_type"] == "PRIMARY_DEMO"), None)
    check("primary demo exists", demo is not None)
    if demo:
        demo_pids = {p["passenger_id"] for p in passengers if p["booking_id"] == demo["booking_id"]}
        demo_assign = sorted([a for a in active_assignments if a["passenger_id"] in demo_pids], key=lambda x: int(x["seat_number"]))
        check("primary demo has four passengers", len(demo_pids) == 4)
        check("primary demo seats are 31,32,57,58", [int(a["seat_number"]) for a in demo_assign] == [31,32,57,58])
        demo_journey = demo["journey_id"]
        b2_seats = sorted(int(a["seat_number"]) for a in active_assignments if a["journey_id"] == demo_journey and a["coach_number"] == "B2" and int(a["seat_number"]) in {45,46,60})
        check("primary demo candidate seats are occupied", b2_seats == [45,46,60])

    # 52. Data dictionary covers all required headers.
    dict_pairs = {(r["file_name"], r["column_name"]) for r in dictionary}
    expected_pairs = set()
    for fname in REQUIRED_FILES:
        if fname == "data_dictionary.csv":
            continue
        with (root / fname).open("r", encoding="utf-8") as f:
            header = next(csv.reader(f))
        expected_pairs.update((fname, c) for c in header)
    check("data dictionary covers every data column", expected_pairs.issubset(dict_pairs))

    # 53. Dataset volume targets and distribution tolerances.
    unique_routes = len({r["route_id"] for r in routes})
    check("unique route count in target range", 20 <= unique_routes <= 40, str(unique_routes))
    check("station count in target range", 50 <= len(stations) <= 100, str(len(stations)))
    check("train count in target range", 20 <= len(trains) <= 40, str(len(trains)))
    check("journey count in target range", 100 <= len(journeys) <= 300, str(len(journeys)))
    check("coach count in target range", 1500 <= len(coaches) <= 4000, str(len(coaches)))
    check("seat count at least 50000", len(seats) >= 50000, str(len(seats)))
    check("booking count in target range", 10000 <= len(bookings) <= 30000, str(len(bookings)))
    check("passenger count in target range", 20000 <= len(passengers) <= 60000, str(len(passengers)))
    check("group count in target range", 5000 <= len(groups) <= 15000, str(len(groups)))
    check("seat assignment count in target range", 20000 <= len(assignments) <= 60000, str(len(assignments)))

    size_counts = Counter(int(g["group_size"]) for g in groups)
    total_groups = len(groups)
    # Loose tolerances around the requested distribution; generator uses exact target counts.
    expected_pct = {1:.25, 2:.25, 3:.15, 4:.20, 5:.05, 6:.05, 7:.025, 8:.025}
    check("group-size distribution within tolerance", all(abs(size_counts[k]/total_groups - pct) <= .005 for k,pct in expected_pct.items()))

    if errors:
        print(f"VALIDATION FAILED ({len(checks)} checks run; {len(errors)} failures)")
        for e in errors[:200]:
            print(e)
        if len(errors) > 200:
            print(f"... plus {len(errors)-200} additional failures")
        return 1

    print("DATASET VALIDATION PASSED")
    print(f"Validation checks: {len(checks)}")
    print(f"Trains: {len(trains)}")
    print(f"Stations: {len(stations)}")
    print(f"Unique routes: {unique_routes}")
    print(f"Journeys: {len(journeys)}")
    print(f"Coaches: {len(coaches)}")
    print(f"Seats: {len(seats)}")
    print(f"Bookings: {len(bookings)}")
    print(f"Passengers: {len(passengers)}")
    print(f"Groups: {len(groups)}")
    print(f"Seat assignments: {len(assignments)}")
    print(f"Scenarios: {len(scenarios)}")
    print(f"Active confirmed passengers: {len(active_assignments)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
