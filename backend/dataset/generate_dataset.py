#!/usr/bin/env python3
"""Deterministic synthetic railway dataset generator for RailTogether."""
from __future__ import annotations

import csv
import hashlib
import json
import random
from collections import defaultdict, Counter
from datetime import date, datetime, time, timedelta
from pathlib import Path

SEED = 404404
REFERENCE_DATE = date(2026, 9, 20)
TARGET_BOOKINGS = 12000
TARGET_JOURNEYS = 180

STATION_ROWS = [
    ("NDLS", "New Delhi", "Delhi", "Delhi", "Northern"),
    ("CDG", "Chandigarh", "Chandigarh", "Chandigarh", "Northern"),
    ("UMB", "Ambala Cantt", "Ambala", "Haryana", "Northern"),
    ("LDH", "Ludhiana", "Ludhiana", "Punjab", "Northern"),
    ("ASR", "Amritsar", "Amritsar", "Punjab", "Northern"),
    ("JAT", "Jammu Tawi", "Jammu", "Jammu and Kashmir", "Northern"),
    ("DDN", "Dehradun", "Dehradun", "Uttarakhand", "Northern"),
    ("SRE", "Saharanpur", "Saharanpur", "Uttar Pradesh", "Northern"),
    ("JP", "Jaipur", "Jaipur", "Rajasthan", "North Western"),
    ("AII", "Ajmer", "Ajmer", "Rajasthan", "North Western"),
    ("KOTA", "Kota", "Kota", "Rajasthan", "West Central"),
    ("BKN", "Bikaner", "Bikaner", "Rajasthan", "North Western"),
    ("UDZ", "Udaipur", "Udaipur", "Rajasthan", "North Western"),
    ("LKO", "Lucknow", "Lucknow", "Uttar Pradesh", "Northern"),
    ("CNB", "Kanpur Central", "Kanpur", "Uttar Pradesh", "North Central"),
    ("GKP", "Gorakhpur", "Gorakhpur", "Uttar Pradesh", "North Eastern"),
    ("BSB", "Varanasi", "Varanasi", "Uttar Pradesh", "North Eastern"),
    ("PRYJ", "Prayagraj", "Prayagraj", "Uttar Pradesh", "North Central"),
    ("GZB", "Ghaziabad", "Ghaziabad", "Uttar Pradesh", "Northern"),
    ("AGC", "Agra Cantt", "Agra", "Uttar Pradesh", "North Central"),
    ("GWL", "Gwalior", "Gwalior", "Madhya Pradesh", "North Central"),
    ("BPL", "Bhopal", "Bhopal", "Madhya Pradesh", "West Central"),
    ("INDB", "Indore", "Indore", "Madhya Pradesh", "Western"),
    ("JBP", "Jabalpur", "Jabalpur", "Madhya Pradesh", "West Central"),
    ("NGP", "Nagpur", "Nagpur", "Maharashtra", "Central"),
    ("MMCT", "Mumbai Central", "Mumbai", "Maharashtra", "Western"),
    ("PUNE", "Pune", "Pune", "Maharashtra", "Central"),
    ("NASH", "Nashik Road", "Nashik", "Maharashtra", "Central"),
    ("ST", "Surat", "Surat", "Gujarat", "Western"),
    ("ADI", "Ahmedabad", "Ahmedabad", "Gujarat", "Western"),
    ("RJT", "Rajkot", "Rajkot", "Gujarat", "Western"),
    ("BRC", "Vadodara", "Vadodara", "Gujarat", "Western"),
    ("RTM", "Ratlam", "Ratlam", "Madhya Pradesh", "Western"),
    ("HWH", "Howrah", "Kolkata", "West Bengal", "Eastern"),
    ("SDAH", "Sealdah", "Kolkata", "West Bengal", "Eastern"),
    ("BBS", "Bhubaneswar", "Bhubaneswar", "Odisha", "East Coast"),
    ("PURI", "Puri", "Puri", "Odisha", "East Coast"),
    ("RNC", "Ranchi", "Ranchi", "Jharkhand", "South Eastern"),
    ("PAT", "Patna", "Patna", "Bihar", "East Central"),
    ("GAYA", "Gaya", "Gaya", "Bihar", "East Central"),
    ("DNR", "Danapur", "Patna", "Bihar", "East Central"),
    ("RDP", "Raipur", "Raipur", "Chhattisgarh", "South East Central"),
    ("BSP", "Bilaspur", "Bilaspur", "Chhattisgarh", "South East Central"),
    ("VSKP", "Visakhapatnam", "Visakhapatnam", "Andhra Pradesh", "East Coast"),
    ("VJA", "Vijayawada", "Vijayawada", "Andhra Pradesh", "South Central"),
    ("BZA", "Guntur", "Guntur", "Andhra Pradesh", "South Central"),
    ("SC", "Secunderabad", "Hyderabad", "Telangana", "South Central"),
    ("HYB", "Hyderabad Deccan", "Hyderabad", "Telangana", "South Central"),
    ("KCG", "Kacheguda", "Hyderabad", "Telangana", "South Central"),
    ("MAS", "Chennai Central", "Chennai", "Tamil Nadu", "Southern"),
    ("MS", "Chennai Egmore", "Chennai", "Tamil Nadu", "Southern"),
    ("CBE", "Coimbatore", "Coimbatore", "Tamil Nadu", "Southern"),
    ("MDU", "Madurai", "Madurai", "Tamil Nadu", "Southern"),
    ("CAPE", "Kanyakumari", "Kanyakumari", "Tamil Nadu", "Southern"),
    ("ERS", "Ernakulam Junction", "Kochi", "Kerala", "Southern"),
    ("TVC", "Thiruvananthapuram", "Thiruvananthapuram", "Kerala", "Southern"),
    ("MYS", "Mysuru", "Mysuru", "Karnataka", "South Western"),
    ("SBC", "KSR Bengaluru", "Bengaluru", "Karnataka", "South Western"),
    ("UBL", "Hubballi", "Hubballi", "Karnataka", "South Western"),
    ("VSG", "Vasco-da-Gama", "Vasco da Gama", "Goa", "Konkan"),
    ("MAO", "Madgaon", "Margao", "Goa", "Konkan"),
    ("BMR", "Bengaluru Cantt", "Bengaluru", "Karnataka", "South Western"),
    ("TATAN", "Tatanagar", "Jamshedpur", "Jharkhand", "South Eastern"),
    ("ASN", "Asansol", "Asansol", "West Bengal", "Eastern"),
    ("DURG", "Durg", "Durg", "Chhattisgarh", "South East Central"),
    ("R", "Raichur", "Raichur", "Karnataka", "South Central"),
    ("KJM", "Krishnarajapuram", "Bengaluru", "Karnataka", "South Western"),
    ("BVI", "Borivali", "Mumbai", "Maharashtra", "Western"),
    ("NGT", "Nagercoil", "Nagercoil", "Tamil Nadu", "Southern"),
    ("CCT", "Kakinada Town", "Kakinada", "Andhra Pradesh", "South Central"),
]

# Each route is synthetic but uses Indian railway-style station geography.
ROUTE_STOPS = [
    ["NDLS", "GZB", "AGC", "KOTA", "JP", "AII", "CDG"],
    ["NDLS", "GZB", "SRE", "UMB", "CDG", "LDH", "ASR"],
    ["NDLS", "GZB", "CNB", "LKO", "GKP", "BSB"],
    ["NDLS", "GZB", "AGC", "GWL", "JBP", "NGP"],
    ["NDLS", "AGC", "KOTA", "RTM", "BRC", "ADI"],
    ["NDLS", "GZB", "CNB", "PRYJ", "BSB", "PAT", "GAYA"],
    ["JP", "AII", "UDZ", "ADI", "ST", "MMCT"],
    ["BKN", "JP", "KOTA", "RTM", "BRC", "ADI"],
    ["DDN", "SRE", "UMB", "CDG", "LDH", "ASR"],
    ["LKO", "CNB", "AGC", "GZB", "NDLS", "JP"],
    ["INDB", "RTM", "BRC", "ST", "MMCT"],
    ["BPL", "JBP", "NGP", "RDP", "BSP", "HWH"],
    ["HWH", "ASN", "RNC", "GAYA", "PAT"],
    ["HWH", "BBS", "PURI", "VSKP", "VJA"],
    ["PAT", "GAYA", "BSB", "PRYJ", "CNB", "LKO"],
    ["MMCT", "BVI", "ST", "BRC", "ADI", "RJT"],
    ["PUNE", "NASH", "ST", "BRC", "ADI"],
    ["PUNE", "NGP", "BPL", "JBP", "BSB"],
    ["MAS", "CBE", "MDU", "NGT", "CAPE"],
    ["MAS", "SBC", "MYS", "MAO", "VSG"],
    ["MAS", "MS", "CBE", "ERS", "TVC"],
    ["SBC", "BMR", "KJM", "R", "UBL", "MAO"],
    ["HYB", "SC", "VJA", "VSKP"],
    ["KCG", "SC", "BZA", "CCT", "VSKP"],
    ["SBC", "R", "SC", "HYB", "KCG"],
    ["CDG", "UMB", "SRE", "GZB", "NDLS", "AGC"],
    ["ASR", "LDH", "UMB", "CDG", "DDN"],
    ["HWH", "TATAN", "RNC", "BSP", "RDP"],
    ["RNC", "PAT", "DNR", "GAYA", "BSB", "PRYJ"],
    ["BPL", "INDB", "RTM", "AII", "JP", "NDLS"],
]

TRAIN_NAMES = [
    "Northern Harmony Express", "Chandigarh Skylink", "Himalayan Gateway", "Ganga City Runner",
    "Malwa Connector", "Central Meridian Express", "Pink City Arrow", "Desert Valley Link",
    "Deccan Prairie Express", "Western Horizon", "Mumbai Inland Connector", "Narmada Star",
    "Eastern Junction Express", "Coastal Odisha Link", "Ganga Dakshin Express", "Gujarat Coastline",
    "Pune Ahmedabad Runner", "Vindhya Intercity", "Tamil Coast Express", "Mysuru Coastal Link",
    "Southern Sapphire", "Bengaluru Konkan Express", "Deccan Delta Runner", "Godavari Connector",
    "Telangana Southlink", "North Capital Connector", "Punjab Hills Express", "Jharkhand Meridian",
    "Kashi Ranchi Link", "Rajasthan Capital Express",
]
TRAIN_TYPES = [
    "SUPERFAST_EXPRESS", "INTERCITY", "SHATABDI", "SUPERFAST_EXPRESS", "SLEEPER_EXPRESS", "RAJDHANI",
    "SUPERFAST_EXPRESS", "SLEEPER_EXPRESS", "INTERCITY", "SUPERFAST_EXPRESS", "DURONTO", "SLEEPER_EXPRESS",
    "SUPERFAST_EXPRESS", "SUPERFAST_EXPRESS", "SLEEPER_EXPRESS", "SUPERFAST_EXPRESS", "INTERCITY",
    "SUPERFAST_EXPRESS", "SUPERFAST_EXPRESS", "INTERCITY", "SUPERFAST_EXPRESS", "DURONTO", "INTERCITY",
    "SUPERFAST_EXPRESS", "NIGHT_EXPRESS", "INTERCITY", "SUPERFAST_EXPRESS", "SUPERFAST_EXPRESS",
    "NIGHT_EXPRESS", "SUPERFAST_EXPRESS",
]

NAME_FIRST = [
    "Aarav", "Riya", "Kabir", "Ananya", "Rohan", "Meera", "Aditya", "Ishita", "Vihaan", "Naina",
    "Arjun", "Kavya", "Yash", "Diya", "Ayaan", "Sana", "Dev", "Tara", "Kunal", "Pihu",
    "Manav", "Aditi", "Rahul", "Priya", "Aman", "Neha", "Vivek", "Simran", "Harsh", "Ira",
    "Raj", "Sneha", "Dhruv", "Mahi", "Siddharth", "Isha", "Nikhil", "Pallavi", "Varun", "Shreya",
]
NAME_LAST = [
    "Sharma", "Verma", "Singh", "Gupta", "Mehta", "Kapoor", "Malhotra", "Bhatia", "Joshi", "Reddy",
    "Iyer", "Nair", "Patel", "Shah", "Mishra", "Saxena", "Chopra", "Agarwal", "Kohli", "Sethi",
    "Khanna", "Arora", "Kulkarni", "Deshmukh", "Chauhan", "Yadav", "Rana", "Tiwari", "Das", "Banerjee",
]

BERTH_VALUES = ["LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER", "CHAIR", "EXECUTIVE"]
POSITION_VALUES = ["WINDOW", "MIDDLE", "AISLE", "SIDE"]

COACH_PATTERNS = {
    "SUPERFAST_EXPRESS": [("B", "3A", 4), ("A", "2A", 2), ("S", "SL", 5)],
    "INTERCITY": [("C", "CC", 6), ("E", "EC", 2)],
    "SHATABDI": [("C", "CC", 7), ("E", "EC", 2)],
    "SLEEPER_EXPRESS": [("S", "SL", 8), ("B", "3A", 4), ("A", "2A", 1)],
    "RAJDHANI": [("B", "3A", 5), ("A", "2A", 3)],
    "DURONTO": [("B", "3A", 6), ("A", "2A", 3), ("S", "SL", 2)],
    "NIGHT_EXPRESS": [("S", "SL", 9), ("B", "3A", 4), ("A", "2A", 2)],
}

COACH_TYPE = {
    "3A": "AC_THREE_TIER",
    "2A": "AC_TWO_TIER",
    "SL": "SLEEPER",
    "CC": "CHAIR_CAR",
    "EC": "EXECUTIVE_CHAIR_CAR",
}
SEAT_CAPACITY = {"3A": 72, "2A": 48, "SL": 72, "CC": 78, "EC": 56}


def seat_layout(class_code: str):
    rows = []
    if class_code == "3A":
        # Canonical Indian Railways 72-berth layout: 9 bays x 8 berths
        # (LOWER, MIDDLE, UPPER, LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER).
        # This matches the application's mod-8 bay/berth math exactly.
        for bay in range(1, 10):
            base = (bay - 1) * 8
            spec = [
                (base + 1, "LOWER", "WINDOW", bay),
                (base + 2, "MIDDLE", "MIDDLE", bay),
                (base + 3, "UPPER", "AISLE", bay),
                (base + 4, "LOWER", "WINDOW", bay),
                (base + 5, "MIDDLE", "MIDDLE", bay),
                (base + 6, "UPPER", "AISLE", bay),
                (base + 7, "SIDE_LOWER", "SIDE", bay),
                (base + 8, "SIDE_UPPER", "SIDE", bay),
            ]
            rows.extend(spec)
    elif class_code == "2A":
        for bay in range(1, 9):
            base = (bay - 1) * 4
            spec = [
                (base + 1, "LOWER", "WINDOW", bay),
                (base + 2, "UPPER", "AISLE", bay),
                (base + 3, "LOWER", "WINDOW", bay),
                (base + 4, "UPPER", "AISLE", bay),
            ]
            rows.extend(spec)
        for i in range(16):
            n = 33 + i
            rows.append((n, "SIDE_LOWER" if i % 2 == 0 else "SIDE_UPPER", "SIDE", 9 + i // 2))
    elif class_code == "SL":
        for bay in range(1, 9):
            base = (bay - 1) * 6
            spec = [
                (base + 1, "LOWER", "WINDOW", bay),
                (base + 2, "MIDDLE", "MIDDLE", bay),
                (base + 3, "UPPER", "AISLE", bay),
                (base + 4, "LOWER", "WINDOW", bay),
                (base + 5, "MIDDLE", "MIDDLE", bay),
                (base + 6, "UPPER", "AISLE", bay),
            ]
            rows.extend(spec)
        for i in range(24):
            n = 49 + i
            rows.append((n, "SIDE_LOWER" if i % 2 == 0 else "SIDE_UPPER", "SIDE", 9 + i // 2))
    elif class_code == "CC":
        for n in range(1, 79):
            row = (n - 1) // 3 + 1
            pos = ["WINDOW", "MIDDLE", "AISLE"][(n - 1) % 3]
            rows.append((n, "CHAIR", pos, row))
    elif class_code == "EC":
        for n in range(1, 57):
            row = (n - 1) // 4 + 1
            pos = ["WINDOW", "AISLE", "WINDOW", "AISLE"][(n - 1) % 4]
            rows.append((n, "EXECUTIVE", pos, row))
    assert len(rows) == SEAT_CAPACITY[class_code]
    assert len({r[0] for r in rows}) == len(rows)
    return rows


def fmt_hhmm(total_minutes: int) -> tuple[str, int]:
    day_offset = total_minutes // 1440
    mins = total_minutes % 1440
    return f"{mins // 60:02d}:{mins % 60:02d}", day_offset


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]):
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def synthetic_name(rng: random.Random, counter: int) -> str:
    first = NAME_FIRST[(counter * 7 + rng.randrange(len(NAME_FIRST))) % len(NAME_FIRST)]
    last = NAME_LAST[(counter * 11 + rng.randrange(len(NAME_LAST))) % len(NAME_LAST)]
    return f"{first} {last}"


def pick_group_sizes(rng: random.Random) -> list[int]:
    counts = {1: 3000, 2: 3000, 3: 1800, 4: 2400, 5: 600, 6: 600, 7: 300, 8: 300}
    sizes = []
    for size, count in counts.items():
        sizes.extend([size] * count)
    sizes.remove(4)
    sizes.insert(0, 4)
    tail = sizes[1:]
    rng.shuffle(tail)
    sizes[1:] = tail
    return sizes


def main(output_root: str = "."):
    rng = random.Random(SEED)
    root = Path(output_root)
    root.mkdir(parents=True, exist_ok=True)

    # 1. Stations
    stations = []
    station_lookup = {}
    for i, (code, name, city, state, zone) in enumerate(STATION_ROWS, 1):
        station_id = f"ST{i:04d}"
        row = {
            "station_id": station_id,
            "station_code": code,
            "station_name": name,
            "city": city,
            "state": state,
            "zone": zone,
        }
        stations.append(row)
        station_lookup[code] = row

    # 2-3. Trains and routes
    trains = []
    routes = []
    train_route_meta = {}
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(30):
        train_id = f"TR{i+1:03d}"
        train_number = f"RT{90001+i:05d}"
        route_codes = ROUTE_STOPS[i]
        if i == 0:
            route_codes = ["NDLS", "GZB", "UMB", "CDG"]
        start_hour = 5 + (i * 3) % 11
        start_min = (i * 17) % 60
        start_minutes = start_hour * 60 + start_min
        route_rows = []
        dist = 0
        abs_time = start_minutes
        prev_code = route_codes[0]
        prev_day = 0
        for seq, code in enumerate(route_codes, 1):
            if seq == 1:
                arr_abs = abs_time - 10
                dep_abs = abs_time
            else:
                travel = 45 + ((i * 13 + seq * 17) % 71)
                arr_abs = abs_time + travel
                stop = 8 + ((i + seq) % 8)
                dep_abs = arr_abs + stop
                segment_km = 55 + ((i * 29 + seq * 23) % 145)
                dist += segment_km
            arr, arr_day = fmt_hhmm(arr_abs)
            dep, dep_day = fmt_hhmm(dep_abs)
            day_offset = max(arr_day, dep_day)
            route_rows.append({
                "route_id": f"RTE{i+1:03d}",
                "train_id": train_id,
                "sequence_number": seq,
                "station_id": station_lookup[code]["station_id"],
                "arrival_time": arr,
                "departure_time": dep,
                "day_offset": day_offset,
                "distance_from_origin_km": dist,
            })
            abs_time = dep_abs
            prev_code = code
        route_id = f"RTE{i+1:03d}"
        classes = COACH_PATTERNS[TRAIN_TYPES[i]]
        total_coaches = sum(c for _, _, c in classes)
        weekday_count = 1 + (i % 3)
        if i == 0:
            selected_weekdays = [4]
        else:
            selected_weekdays = sorted({(i * 2 + j * 3) % 7 for j in range(weekday_count)})
        active_days = ",".join(day_names[d] for d in selected_weekdays)
        trains.append({
            "train_id": train_id,
            "train_number": train_number,
            "train_name": TRAIN_NAMES[i],
            "train_type": TRAIN_TYPES[i],
            "origin_station_code": route_codes[0],
            "destination_station_code": route_codes[-1],
            "total_coaches": total_coaches,
            "active_days": active_days,
            "operator": "Indian Railways Demo",
        })
        routes.extend(route_rows)
        train_route_meta[train_id] = {"codes": route_codes, "route_rows": route_rows}

    # 4. Journeys
    journeys = []
    journey_by_id = {}
    journey_dates = {}
    base_dates = [REFERENCE_DATE + timedelta(days=5 + i) for i in range(30)]
    for i, train in enumerate(trains):
        train_id = train["train_id"]
        active_weekdays = [day_names.index(d) for d in train["active_days"].split(",")]
        dates = []
        cursor = base_dates[i]
        while len(dates) < 6:
            if cursor.weekday() in active_weekdays:
                dates.append(cursor)
            cursor += timedelta(days=1)
        if i == 0:
            dates[0] = date(2026, 9, 25)
        for j, jdate in enumerate(dates, 1):
            journey_id = f"J{i*6+j:06d}"
            route_rows = train_route_meta[train_id]["route_rows"]
            dep = route_rows[0]["departure_time"]
            arr = route_rows[-1]["arrival_time"]
            arr_day = route_rows[-1]["day_offset"]
            dep_dt = datetime.combine(jdate, datetime.strptime(dep, "%H:%M").time())
            arr_dt = datetime.combine(jdate + timedelta(days=arr_day), datetime.strptime(arr, "%H:%M").time())
            row = {
                "journey_id": journey_id,
                "train_id": train_id,
                "journey_date": jdate.isoformat(),
                "origin_station_code": train["origin_station_code"],
                "destination_station_code": train["destination_station_code"],
                "scheduled_departure": dep_dt.isoformat(sep=" "),
                "scheduled_arrival": arr_dt.isoformat(sep=" "),
                "journey_status": "SCHEDULED",
            }
            journeys.append(row)
            journey_by_id[journey_id] = row
            journey_dates[journey_id] = jdate

    assert len(journeys) == TARGET_JOURNEYS

    # 5-6. Coaches and seats.
    coaches = []
    seats = []
    coach_lookup = {}
    seat_lookup = {}
    coaches_by_journey_class = defaultdict(list)
    for journey in journeys:
        jid = journey["journey_id"]
        train_type = next(t["train_type"] for t in trains if t["train_id"] == journey["train_id"])
        class_seq = defaultdict(int)
        for prefix, class_code, count in COACH_PATTERNS[train_type]:
            for _ in range(count):
                class_seq[class_code] += 1
                coach_number = f"{prefix}{class_seq[class_code]}"
                coach_id = f"CO{len(coaches)+1:06d}"
                coach = {
                    "coach_id": coach_id,
                    "journey_id": jid,
                    "coach_number": coach_number,
                    "coach_type": COACH_TYPE[class_code],
                    "class_code": class_code,
                    "seat_capacity": SEAT_CAPACITY[class_code],
                }
                coaches.append(coach)
                coach_lookup[coach_id] = coach
                coaches_by_journey_class[(jid, class_code)].append(coach_id)
                for seat_number, berth_type, position, row_number in seat_layout(class_code):
                    seat_id = f"SE{len(seats)+1:07d}"
                    seat = {
                        "seat_id": seat_id,
                        "coach_id": coach_id,
                        "coach_number": coach_number,
                        "seat_number": seat_number,
                        "berth_type": berth_type,
                        "row_number": row_number,
                        "position": position,
                        "is_window": position == "WINDOW",
                        "is_aisle": position == "AISLE",
                    }
                    seats.append(seat)
                    seat_lookup[(coach_id, seat_number)] = seat
    
    # 7-9. Bookings, groups, passengers.
    size_plan = pick_group_sizes(rng)
    assert len(size_plan) == TARGET_BOOKINGS
    per_journey_counts = [67 if i < 120 else 66 for i in range(TARGET_JOURNEYS)]
    assert sum(per_journey_counts) == TARGET_BOOKINGS

    bookings = []
    groups = []
    passengers = []
    passengers_by_booking = defaultdict(list)
    passenger_lookup = {}
    booking_lookup = {}
    group_lookup = {}
    pnr_set = set()

    booking_index = 0
    passenger_counter = 0
    special_booking_ids = {}
    special_group_ids = {}
    special_passenger_ids = {}
    special_seat_targets = {}

    def make_pnr():
        while True:
            val = rng.randint(1000000000, 9999999999)
            if val not in pnr_set:
                pnr_set.add(val)
                return str(val)

    for ji, journey in enumerate(journeys):
        jid = journey["journey_id"]
        jdate = journey_dates[jid]
        for local_idx in range(per_journey_counts[ji]):
            bidx = booking_index
            size = size_plan[bidx]
            booking_index += 1
            booking_id = f"BK{booking_index:06d}"
            group_id = f"GR{booking_index:06d}"
            pnr = make_pnr()
            if booking_index % 100 == 0:
                booking_status = "CANCELLED"
            elif booking_index % 40 == 0:
                booking_status = "RAC"
            elif booking_index % 33 == 0:
                booking_status = "WAITLISTED"
            else:
                booking_status = "CONFIRMED"

            if size == 1:
                booking_type = "INDIVIDUAL"
                group_type = "GROUP"
            else:
                choices = ["FAMILY", "FRIENDS", "COUPLE", "GROUP"]
                group_type = choices[(booking_index + size) % len(choices)]
                if size >= 4 and booking_index % 19 == 0:
                    group_type = "CAREGIVER"
                booking_type = {
                    "FAMILY": "FAMILY", "FRIENDS": "FRIENDS", "COUPLE": "FAMILY" if size > 2 else "FRIENDS",
                    "CAREGIVER": "CAREGIVER_COMPANION", "GROUP": "GROUP",
                }[group_type]
            book_days_before = 8 + (booking_index % 38)
            booking_date = jdate - timedelta(days=book_days_before)
            group = {
                "group_id": group_id,
                "booking_id": booking_id,
                "journey_id": jid,
                "group_name": f"{group_type.title()} Demo Group {booking_index:05d}",
                "group_size": size,
                "group_type": group_type,
                "travelling_together": True,
                "priority_level": "HIGH" if size >= 6 or group_type == "CAREGIVER" else "NORMAL",
            }
            groups.append(group)
            group_lookup[group_id] = group

            booking = {
                "booking_id": booking_id,
                "journey_id": jid,
                "pnr": pnr,
                "booking_date": booking_date.isoformat(),
                "booking_status": booking_status,
                "number_of_passengers": size,
                "primary_contact_passenger_id": "",
                "booking_type": booking_type,
            }
            bookings.append(booking)
            booking_lookup[booking_id] = booking

            forced_names = None
            if booking_index == 1:
                size = 4
                forced_names = ["Mahendra Demo", "Father Demo", "Mother Demo", "Sister Demo"]
                special_booking_ids["primary_demo"] = booking_id
                special_group_ids["primary_demo"] = group_id
            for k in range(size):
                passenger_counter += 1
                passenger_id = f"P{passenger_counter:06d}"
                if forced_names:
                    full_name = forced_names[k]
                    passenger_type = "ADULT"
                    age = [42, 39, 38, 18][k]
                else:
                    if size >= 3 and k == 0 and booking_index % 23 == 0:
                        passenger_type = "CHILD"
                        age = 5 + (booking_index % 11)
                    elif size >= 2 and k == 0 and booking_index % 29 == 0:
                        passenger_type = "SENIOR"
                        age = 65 + (booking_index % 12)
                    elif size >= 3 and k == 1 and booking_index % 71 == 0:
                        passenger_type = "INFANT"
                        age = booking_index % 2
                    else:
                        passenger_type = "ADULT"
                        age = 18 + (booking_index * 3 + k * 7) % 47
                    full_name = synthetic_name(rng, passenger_counter)
                gender = ["MALE", "FEMALE", "OTHER"][rng.randrange(3)]
                contact_reference = f"demo_contact_{passenger_counter:06d}"
                passenger = {
                    "passenger_id": passenger_id,
                    "booking_id": booking_id,
                    "journey_id": jid,
                    "group_id": group_id,
                    "full_name": full_name,
                    "age": age,
                    "gender": gender,
                    "passenger_type": passenger_type,
                    "contact_reference": contact_reference,
                    "booking_status": booking_status,
                }
                passengers.append(passenger)
                passenger_lookup[passenger_id] = passenger
                passengers_by_booking[booking_id].append(passenger_id)
                if forced_names:
                    special_passenger_ids[f"demo_{k+1}"] = passenger_id
            booking["primary_contact_passenger_id"] = passengers_by_booking[booking_id][0]

    # 10. Seat assignments.
    available_by_coach = {}
    for coach in coaches:
        cid = coach["coach_id"]
        available_by_coach[cid] = set(range(1, coach["seat_capacity"] + 1))
    seat_by_number = defaultdict(dict)
    for seat in seats:
        seat_by_number[seat["coach_id"]][int(seat["seat_number"])] = seat

    demo_jid = journeys[0]["journey_id"]
    demo_b2 = next(c for c in coaches if c["journey_id"] == demo_jid and c["coach_number"] == "B2")
    for n in [31, 32, 57, 58, 45, 46, 60]:
        available_by_coach[demo_b2["coach_id"]].remove(n)
    special_seat_targets["demo"] = {31: special_passenger_ids["demo_1"], 32: special_passenger_ids["demo_2"], 57: special_passenger_ids["demo_3"], 58: special_passenger_ids["demo_4"]}

    demo_candidate_pids = []
    for b in bookings:
        if b["journey_id"] == demo_jid and b["booking_id"] != special_booking_ids["primary_demo"] and b["booking_status"] == "CONFIRMED":
            pids = passengers_by_booking[b["booking_id"]]
            if len(pids) == 1:
                demo_candidate_pids.append(pids[0])
            if len(demo_candidate_pids) >= 3:
                break
    if len(demo_candidate_pids) < 3:
        raise RuntimeError("Could not reserve three demo candidate passengers")
    demo_candidate_names = ["Rahul Demo", "Aman Demo", "Priya Demo"]
    for pid, name in zip(demo_candidate_pids, demo_candidate_names):
        passenger_lookup[pid]["full_name"] = name
    special_passenger_ids["demo_candidate_1"] = demo_candidate_pids[0]
    special_passenger_ids["demo_candidate_2"] = demo_candidate_pids[1]
    special_passenger_ids["demo_candidate_3"] = demo_candidate_pids[2]

    arrangement_by_booking = {}
    booking_passengers = {b["booking_id"]: passengers_by_booking[b["booking_id"]] for b in bookings}

    preassigned = {}
    demo_pairs = [(special_passenger_ids["demo_candidate_1"], 45), (special_passenger_ids["demo_candidate_2"], 46), (special_passenger_ids["demo_candidate_3"], 60)]
    for pid, seat_no in demo_pairs:
        preassigned[pid] = (demo_b2["coach_id"], seat_no)

    # 10. Seat assignments.
    active_confirmed_bookings = [b for b in bookings if b["booking_status"] == "CONFIRMED"]

    # Deterministic coach fill order per journey: the primary 3A coach (B2)
    # first, then remaining 3A coaches, then SL/2A/CC/EC. Concentrating each
    # journey's passengers into B1/B2/B3 keeps the B2 seat map well populated.
    coaches_by_journey = defaultdict(list)
    for coach in coaches:
        coaches_by_journey[coach["journey_id"]].append(coach)

    def coach_fill_order_for(jid):
        journey_coaches = coaches_by_journey[jid]
        three_a = sorted(
            (c for c in journey_coaches if c["class_code"] == "3A"),
            key=lambda c: (0 if c["coach_number"] == "B2" else 1, c["coach_number"]),
        )
        ordered = [c["coach_id"] for c in three_a]
        for cls in ("SL", "2A", "CC", "EC"):
            ordered.extend(
                c["coach_id"]
                for c in sorted(
                    (c for c in journey_coaches if c["class_code"] == cls),
                    key=lambda c: c["coach_number"],
                )
            )
        return ordered

    for b in active_confirmed_bookings:
        bidx = int(b["booking_id"][2:])
        size = b["number_of_passengers"]
        if b["booking_id"] == special_booking_ids["primary_demo"]:
            arrangement = "PRIMARY_DEMO"
        else:
            bucket = bidx % 100
            if bucket < 80:
                arrangement = "GROUP_TOGETHER"
            elif bucket < 92:
                arrangement = "SLIGHTLY_SPLIT"
            elif bucket < 97:
                arrangement = "MODERATELY_SPLIT"
            elif bucket < 99:
                arrangement = "HIGHLY_SPLIT"
            else:
                arrangement = "NO_POSSIBLE_MATCH"
        arrangement_by_booking[b["booking_id"]] = arrangement

    for jid in sorted({b["journey_id"] for b in active_confirmed_bookings}):
        jbookings = [b for b in active_confirmed_bookings if b["journey_id"] == jid and b["booking_id"] != special_booking_ids["primary_demo"]]
        jbookings.sort(key=lambda x: (-x["number_of_passengers"], x["booking_id"]))
        for b in jbookings:
            booking_id = b["booking_id"]
            pids = booking_passengers[booking_id]
            if any(pid in preassigned for pid in pids):
                continue
            size = len(pids)
            bidx = int(booking_id[2:])
            # Scatter a deterministic slice of small bookings into other classes
            # so journeys keep cross-class (SL/2A/CC) passengers for the
            # DIFFERENT_CLASS scenario fixtures instead of filling only 3A.
            force_class = None
            if bidx % 9 == 0 and size <= 4:
                for cls in ("SL", "2A", "CC"):
                    if any(
                        coach_lookup[cid2]["class_code"] == cls and len(available_by_coach[cid2]) >= size
                        for cid2 in coach_fill_order_for(jid)
                    ):
                        force_class = cls
                        break
            possible = [
                (coach_lookup[cid]["class_code"], cid)
                for cid in coach_fill_order_for(jid)
                if (force_class is None or coach_lookup[cid]["class_code"] == force_class)
                and len(available_by_coach[cid]) >= size
            ]
            if not possible:
                possible = [
                    (coach_lookup[cid]["class_code"], cid)
                    for cid in coach_fill_order_for(jid)
                    if len(available_by_coach[cid]) >= size
                ]
            if not possible:
                raise RuntimeError(f"No coach capacity for {booking_id}")
            cls, cid = possible[0]
            free = sorted(available_by_coach[cid])
            bay_of = lambda seat: (seat - 1) // 8

            if size == 1 or arrangement_by_booking[booking_id] == "GROUP_TOGETHER":
                chosen = []
                # Prefer a contiguous run fully inside a single 8-berth bay so
                # together-groups render completely green on the seat map.
                for start in free:
                    run = list(range(start, start + size))
                    if all(x in available_by_coach[cid] for x in run) and bay_of(run[0]) == bay_of(run[-1]):
                        chosen = run
                        break
                if not chosen:
                    for start in free:
                        run = list(range(start, start + size))
                        if all(x in available_by_coach[cid] for x in run):
                            chosen = run
                            break
                if not chosen:
                    chosen = free[:size]
            elif arrangement_by_booking[booking_id] == "SLIGHTLY_SPLIT":
                # Keep the family clustered and move exactly one member a couple
                # of bays away within the same coach (visible as one red seat).
                main_size = max(1, size - 1)
                main_run = None
                for start in free:
                    run = list(range(start, start + main_size))
                    if all(x in available_by_coach[cid] for x in run):
                        main_run = run
                        break
                chosen = []
                if main_run:
                    cluster_bay = bay_of(main_run[0])
                    away = [x for x in free if x not in main_run and bay_of(x) != cluster_bay]
                    far = [x for x in away if abs(bay_of(x) - cluster_bay) >= 2]
                    pool = far or away
                    if pool:
                        chosen = main_run + [pool[len(pool) // 2]]
                if len(chosen) != size:
                    chosen = free[:size]
            elif arrangement_by_booking[booking_id] == "MODERATELY_SPLIT":
                # Two clusters in two different bays of the same coach.
                half = max(1, size // 2)
                first_run = None
                for start in free:
                    run = list(range(start, start + half))
                    if all(x in available_by_coach[cid] for x in run):
                        first_run = run
                        break
                chosen = []
                if first_run:
                    bay_a = bay_of(first_run[0])
                    rest_free = [x for x in free if x not in first_run and bay_of(x) != bay_a]
                    remaining = size - len(first_run)
                    second_run = None
                    for start in rest_free:
                        run = list(range(start, start + remaining))
                        if all(x in available_by_coach[cid] for x in run):
                            second_run = run
                            break
                    if second_run:
                        chosen = sorted(first_run + second_run)
                if len(chosen) != size:
                    chosen = free[:size]
            elif arrangement_by_booking[booking_id] == "HIGHLY_SPLIT":
                chosen = [free[0], free[len(free)//2]]
                for x in free:
                    if x not in chosen:
                        chosen.append(x)
                    if len(chosen) >= size:
                        break
                chosen = sorted(chosen[:size])
            else:
                if len(free) >= size:
                    step = max(1, len(free) // max(2, size - 1))
                    chosen = free[::step][:size]
                if len(chosen) != size:
                    chosen = free[:size]
            if len(chosen) != size:
                raise RuntimeError(f"Seat selection failure for {booking_id}: {size} vs {len(chosen)}")
            for pid, seat_no in zip(pids, chosen):
                available_by_coach[cid].remove(seat_no)
                preassigned[pid] = (cid, seat_no)

    for pid, seat_no in [(special_passenger_ids["demo_1"], 31), (special_passenger_ids["demo_2"], 32),
                         (special_passenger_ids["demo_3"], 57), (special_passenger_ids["demo_4"], 58)]:
        if pid in preassigned:
            raise RuntimeError("Primary demo passenger already assigned")
        preassigned[pid] = (demo_b2["coach_id"], seat_no)

    seat_assignments = []
    assignment_by_passenger = {}
    assignment_id = 0
    for b in active_confirmed_bookings:
        for pid in booking_passengers[b["booking_id"]]:
            if pid not in preassigned:
                raise RuntimeError(f"Missing seat assignment for {pid}")
            cid, seat_no = preassigned[pid]
            coach = coach_lookup[cid]
            seat = seat_by_number[cid][seat_no]
            assignment_id += 1
            row = {
                "assignment_id": f"AS{assignment_id:07d}",
                "journey_id": b["journey_id"],
                "booking_id": b["booking_id"],
                "passenger_id": pid,
                "coach_id": cid,
                "coach_number": coach["coach_number"],
                "seat_id": seat["seat_id"],
                "seat_number": seat_no,
                "berth_type": seat["berth_type"],
                "assignment_status": "ACTIVE",
                "assigned_at": (datetime.combine(date.fromisoformat(b["booking_date"]), time(9, 0)) + timedelta(hours=3)).isoformat(sep=" "),
            }
            seat_assignments.append(row)
            assignment_by_passenger[pid] = row

    # 11. Passenger preferences
    preferences = []
    pref_by_passenger = {}
    pref_id = 0
    for p in passengers:
        pid = p["passenger_id"]
        if p["booking_status"] != "CONFIRMED":
            continue
        pref_id += 1
        assignment = assignment_by_passenger[pid]
        current_coach = assignment["coach_number"]
        berth = assignment["berth_type"]
        if p["passenger_type"] == "SENIOR":
            preferred_berth_type = "LOWER"
        elif p["passenger_type"] == "CHILD":
            preferred_berth_type = "LOWER"
        elif berth in {"CHAIR", "EXECUTIVE"}:
            preferred_berth_type = berth
        else:
            pref_pool = ["LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER"]
            preferred_berth_type = pref_pool[(int(pid[1:]) * 5) % len(pref_pool)]
        willing = (int(pid[1:]) % 10) < 8 or pid in {
            special_passenger_ids["demo_candidate_1"], special_passenger_ids["demo_candidate_2"], special_passenger_ids["demo_candidate_3"]
        }
        same_coach_only = (int(pid[1:]) % 10) < 7
        same_class_only = (int(pid[1:]) % 20) != 0
        preferred_coach = current_coach if same_coach_only or int(pid[1:]) % 11 == 0 else ""
        note = ""
        if p["passenger_type"] == "SENIOR":
            note = "Synthetic senior prefers lower berth."
        elif p["passenger_type"] == "CHILD":
            note = "Synthetic child is part of a family group."
        elif pid in {special_passenger_ids["demo_candidate_1"], special_passenger_ids["demo_candidate_2"], special_passenger_ids["demo_candidate_3"]}:
            note = "Primary demo candidate; synthetic voluntary exchange state."
        row = {
            "preference_id": f"PR{pref_id:07d}",
            "passenger_id": pid,
            "journey_id": p["journey_id"],
            "preferred_berth_type": preferred_berth_type,
            "preferred_coach": preferred_coach,
            "willing_to_exchange": willing,
            "exchange_same_coach_only": same_coach_only,
            "exchange_same_class_only": same_class_only,
            "special_note": note,
        }
        preferences.append(row)
        pref_by_passenger[pid] = row

    for pid in demo_candidate_pids:
        pref_by_passenger[pid]["willing_to_exchange"] = True
        pref_by_passenger[pid]["exchange_same_coach_only"] = True
        pref_by_passenger[pid]["exchange_same_class_only"] = True
        pref_by_passenger[pid]["preferred_coach"] = "B2"

    # 12. Eligibility.
    pending_pid = next(pid for pid in sorted(pref_by_passenger) if int(pid[1:]) % 97 == 0)
    confirmed_pid = next(pid for pid in sorted(pref_by_passenger) if int(pid[1:]) % 113 == 0 and pid != pending_pid)
    special_passenger_ids["pending"] = pending_pid
    special_passenger_ids["confirmed"] = confirmed_pid
    eligibilities = []
    eligibility_by_passenger = {}
    locked_states = {pending_pid: "ALREADY_IN_PENDING_REQUEST", confirmed_pid: "ALREADY_CONFIRMED_SWAP"}
    eid = 0
    for p in passengers:
        pid = p["passenger_id"]
        if p["booking_status"] != "CONFIRMED":
            continue
        eid += 1
        pref = pref_by_passenger[pid]
        if pid in locked_states:
            eligible = False
            reason = locked_states[pid]
        elif not pref["willing_to_exchange"]:
            eligible = False
            reason = "NOT_WILLING_TO_EXCHANGE"
        else:
            eligible = True
            reason = "WILLING_TO_EXCHANGE"
        row = {
            "eligibility_id": f"EL{eid:07d}",
            "journey_id": p["journey_id"],
            "passenger_id": pid,
            "eligible": eligible,
            "reason": reason,
            "updated_at": datetime.combine(journey_dates[p["journey_id"]] - timedelta(days=1), time(18, 0)).isoformat(sep=" "),
        }
        eligibilities.append(row)
        eligibility_by_passenger[pid] = row

    for pid in demo_candidate_pids:
        eligibility_by_passenger[pid]["eligible"] = True
        eligibility_by_passenger[pid]["reason"] = "WILLING_TO_EXCHANGE"

    # 13. Scenario labels
    scenarios = []
    scenario_id = 0

    def add_scenario(jid, bid, gid, stype, description, expected):
        nonlocal scenario_id
        scenario_id += 1
        scenarios.append({
            "scenario_id": f"SC{scenario_id:04d}",
            "journey_id": jid,
            "booking_id": bid,
            "group_id": gid,
            "scenario_type": stype,
            "description": description,
            "expected_system_behavior": expected,
        })

    demo_bid = special_booking_ids["primary_demo"]
    demo_gid = special_group_ids["primary_demo"]
    add_scenario(
        demo_jid, demo_bid, demo_gid, "PRIMARY_DEMO",
        "Primary RailTogether demo: group members are on B2-31, B2-32, B2-57, B2-58; synthetic candidates are on B2-45, B2-46, B2-60.",
        "Detect the split group, consider only willing candidates, calculate compatibility, and allow an application-level exchange request without treating it as an official railway reservation change.",
    )

    assignment_by_coach = defaultdict(list)
    for a in seat_assignments:
        assignment_by_coach[(a["journey_id"], a["coach_id"])].append(a)
    assignment_by_journey = defaultdict(list)
    for a in seat_assignments:
        assignment_by_journey[a["journey_id"]].append(a)

    def group_assignments(bid):
        return [assignment_by_passenger[pid] for pid in booking_passengers[bid] if pid in assignment_by_passenger]

    confirmed_bookings = [b for b in bookings if b["booking_status"] == "CONFIRMED"]
    together_bids = [b["booking_id"] for b in confirmed_bookings if arrangement_by_booking.get(b["booking_id"]) == "GROUP_TOGETHER" and b["number_of_passengers"] >= 2]
    split_bids = [b["booking_id"] for b in confirmed_bookings if arrangement_by_booking.get(b["booking_id"]) in {"SLIGHTLY_SPLIT", "MODERATELY_SPLIT", "HIGHLY_SPLIT"} and b["number_of_passengers"] >= 2]
    large_bids = [b["booking_id"] for b in confirmed_bookings if b["number_of_passengers"] >= 7]
    child_bids = [b["booking_id"] for b in confirmed_bookings if any(passenger_lookup[pid]["passenger_type"] == "CHILD" for pid in booking_passengers[b["booking_id"]])]
    senior_pids = [p["passenger_id"] for p in passengers if p["passenger_type"] == "SENIOR" and p["booking_status"] == "CONFIRMED"]

    def add_for_bids(bids, stype, expected, desc_template, n=6):
        if not bids:
            return
        for idx in range(n):
            bid = bids[idx % len(bids)]
            b = booking_lookup[bid]
            gid = b["booking_id"].replace("BK", "GR")
            desc = desc_template.format(bid=bid, n=idx+1)
            add_scenario(b["journey_id"], bid, gid, stype, desc, expected)

    add_for_bids(together_bids, "GROUP_TOGETHER",
                  "Recognize the group as already together and return zero or very few exchange suggestions.",
                  "Synthetic booking {bid} has a compact seat pattern; no unnecessary exchange target should be surfaced.")
    add_for_bids(split_bids, "GROUP_SPLIT",
                  "Identify that the booking's group is separated and treat it as a valid grouping problem.",
                  "Synthetic booking {bid} has intentionally separated group members for matching tests.")

    easy_seed = None
    for bid in split_bids:
        assigns = group_assignments(bid)
        if not assigns:
            continue
        target = assigns[-1]
        coach_passengers = assignment_by_coach[(target["journey_id"], target["coach_id"])]
        group_pids = set(booking_passengers[bid])
        cands = [a for a in coach_passengers if a["passenger_id"] not in group_pids and pref_by_passenger[a["passenger_id"]]["willing_to_exchange"] and a["berth_type"] == target["berth_type"]]
        if cands:
            easy_seed = (bid, target, cands[0])
            break
    if easy_seed:
        bid, target, cand = easy_seed
        b = booking_lookup[bid]
        add_scenario(b["journey_id"], bid, b["booking_id"].replace("BK", "GR"), "EASY_EXCHANGE",
                     f"Target seat {target['coach_number']}-{target['seat_number']} has a same-coach, same-class willing passenger at {cand['coach_number']}-{cand['seat_number']}.",
                     "Identify the willing passenger as a potential exchange candidate and calculate compatibility; do not auto-complete the exchange.")
        for i in range(5):
            add_scenario(b["journey_id"], bid, b["booking_id"].replace("BK", "GR"), "EASY_EXCHANGE",
                         f"Variant {i+1}: synthetic easy-exchange candidate remains voluntary and must be evaluated from current preference inputs.",
                         "Show a potential candidate only when current eligibility and matching constraints permit it.")

    notwilling_seed = None
    for bid in split_bids:
        assigns = group_assignments(bid)
        if not assigns:
            continue
        target = assigns[0]
        coach_passengers = assignment_by_coach[(target["journey_id"], target["coach_id"])]
        group_pids = set(booking_passengers[bid])
        cands = [a for a in coach_passengers if a["passenger_id"] not in group_pids and not pref_by_passenger[a["passenger_id"]]["willing_to_exchange"]]
        if cands:
            notwilling_seed = (bid, target, cands[0])
            break
    if notwilling_seed:
        bid, target, cand = notwilling_seed
        b = booking_lookup[bid]
        for i in range(6):
            add_scenario(b["journey_id"], bid, b["booking_id"].replace("BK", "GR"), "NOT_WILLING_TO_EXCHANGE",
                         f"Candidate seat {cand['coach_number']}-{cand['seat_number']} is occupied by a passenger whose consent flag is FALSE (variant {i+1}).",
                         "Do not recommend the passenger as an exchange target.")

    multi_seed = None
    for bid in split_bids:
        assigns = group_assignments(bid)
        if not assigns:
            continue
        target = assigns[-1]
        coach_passengers = assignment_by_coach[(target["journey_id"], target["coach_id"])]
        group_pids = set(booking_passengers[bid])
        cands = [a for a in coach_passengers if a["passenger_id"] not in group_pids and eligibility_by_passenger[a["passenger_id"]]["eligible"]]
        if len(cands) >= 3:
            multi_seed = (bid, target, cands[:3])
            break
    if multi_seed:
        bid, target, cands = multi_seed
        b = booking_lookup[bid]
        seats_text = ", ".join(f"{c['coach_number']}-{c['seat_number']}" for c in cands)
        for i in range(6):
            add_scenario(b["journey_id"], bid, b["booking_id"].replace("BK", "GR"), "MULTIPLE_POSSIBLE_EXCHANGES",
                         f"Three eligible candidate seats ({seats_text}) are available in the same journey (variant {i+1}).",
                         "Calculate distinct compatibility scores and display multiple voluntary options rather than a hard-coded winner.")

    same_coach_seed = None
    for p in passengers:
        pid = p["passenger_id"]
        if p["booking_status"] != "CONFIRMED" or not pref_by_passenger[pid]["willing_to_exchange"] or not pref_by_passenger[pid]["exchange_same_coach_only"]:
            continue
        a = assignment_by_passenger[pid]
        other = next((x for x in assignment_by_journey[p["journey_id"]] if x["coach_id"] != a["coach_id"] and eligibility_by_passenger[x["passenger_id"]]["eligible"]), None)
        if other:
            same_coach_seed = (pid, a, other)
            break
    if same_coach_seed:
        pid, a, other = same_coach_seed
        p = passenger_lookup[pid]
        for i in range(6):
            add_scenario(p["journey_id"], p["booking_id"], p["group_id"], "SAME_COACH_PREFERENCE",
                         f"Passenger {pid} allows exchange only within {a['coach_number']} but a willing candidate is in {other['coach_number']} (variant {i+1}).",
                         "Exclude the cross-coach candidate when same-coach restriction is active.")

    different_class_seed = None
    for p in passengers:
        if p["booking_status"] != "CONFIRMED":
            continue
        a = assignment_by_passenger[p["passenger_id"]]
        pref = pref_by_passenger[p["passenger_id"]]
        if not pref["exchange_same_class_only"]:
            continue
        other = next((x for x in assignment_by_journey[p["journey_id"]]
                      if x["passenger_id"] != p["passenger_id"]
                      and coach_lookup[x["coach_id"]]["class_code"] != coach_lookup[a["coach_id"]]["class_code"]
                      and eligibility_by_passenger[x["passenger_id"]]["eligible"]), None)
        if other:
            different_class_seed = (p["passenger_id"], a, other)
            break
    if different_class_seed:
        pid, a, other = different_class_seed
        p = passenger_lookup[pid]
        for i in range(6):
            add_scenario(p["journey_id"], p["booking_id"], p["group_id"], "DIFFERENT_CLASS",
                         f"Target passenger in class {coach_lookup[a['coach_id']]['class_code']} has a willing candidate in class {coach_lookup[other['coach_id']]['class_code']} (variant {i+1}).",
                         "Reject the different-class candidate when the exchange-same-class rule is active.")

    berth_seed = None
    for pid in senior_pids:
        a = assignment_by_passenger[pid]
        p = pref_by_passenger[pid]
        if p["preferred_berth_type"] == "LOWER":
            other = next((x for x in assignment_by_journey[p["journey_id"]] if x["passenger_id"] != pid and x["berth_type"] == "LOWER"), None)
            if other:
                berth_seed = (pid, a, other)
                break
    if berth_seed:
        pid, a, other = berth_seed
        p = passenger_lookup[pid]
        for i in range(6):
            add_scenario(p["journey_id"], p["booking_id"], p["group_id"], "BERTH_COMPATIBILITY",
                         f"Synthetic senior passenger {pid} prefers LOWER; candidate seat {other['coach_number']}-{other['seat_number']} is also LOWER (variant {i+1}).",
                         "Use berth preference as a compatibility signal without overriding consent or class/coach restrictions.")

    no_match_bid = next((b["booking_id"] for b in confirmed_bookings if arrangement_by_booking.get(b["booking_id"]) == "NO_POSSIBLE_MATCH" and b["number_of_passengers"] >= 2), None)
    if no_match_bid:
        gpids = booking_passengers[no_match_bid]
        target_coach_ids = {assignment_by_passenger[pid]["coach_id"] for pid in gpids}
        for pid in gpids:
            pref_by_passenger[pid]["exchange_same_coach_only"] = True
            pref_by_passenger[pid]["exchange_same_class_only"] = True
            pref_by_passenger[pid]["willing_to_exchange"] = True
            if pid in eligibility_by_passenger:
                eligibility_by_passenger[pid]["eligible"] = True
                eligibility_by_passenger[pid]["reason"] = "WILLING_TO_EXCHANGE"
        for jid, cid in [(assignment_by_passenger[pid]["journey_id"], assignment_by_passenger[pid]["coach_id"]) for pid in gpids]:
            for a in assignment_by_coach[(jid, cid)]:
                if a["passenger_id"] not in gpids:
                    pref_by_passenger[a["passenger_id"]]["willing_to_exchange"] = False
                    if a["passenger_id"] in eligibility_by_passenger:
                        eligibility_by_passenger[a["passenger_id"]]["eligible"] = False
                        eligibility_by_passenger[a["passenger_id"]]["reason"] = "NOT_WILLING_TO_EXCHANGE"
        b = booking_lookup[no_match_bid]
        for i in range(6):
            add_scenario(b["journey_id"], no_match_bid, group_lookup[no_match_bid.replace("BK", "GR")]["group_id"], "NO_POSSIBLE_MATCH",
                         f"Split group {no_match_bid} has no voluntary compatible candidate after applying explicit consent and coach/class restrictions (variant {i+1}).",
                         "Show 'No suitable voluntary exchange found.' and do not fabricate a match.")

    coach_group_counts = []
    for (jid, cid), arrs in assignment_by_coach.items():
        groups_here = {passenger_lookup[a["passenger_id"]]["group_id"] for a in arrs}
        if len(groups_here) >= 5:
            any_gid = min(groups_here)
            bid = group_lookup[any_gid]["booking_id"]
            coach_group_counts.append((len(groups_here), jid, bid, any_gid, cid))
    coach_group_counts.sort(reverse=True)
    if coach_group_counts:
        _, jid, bid, gid, cid = coach_group_counts[0]
        for i in range(6):
            add_scenario(jid, bid, gid, "MULTIPLE_GROUPS_IN_SAME_COACH",
                         f"Coach {coach_lookup[cid]['coach_number']} contains multiple unrelated groups (variant {i+1}).",
                         "Keep group membership isolated by group_id and never assume all passengers in a coach belong together.")

    add_for_bids(large_bids, "LARGE_GROUP",
                  "Handle groups of six to eight passengers and detect partial separation correctly.",
                  "Large synthetic group {bid} contains 7–8 passengers for scalability testing.")
    add_for_bids(child_bids, "CHILD_WITH_FAMILY",
                  "Keep the child linked to the same travelling group and consider that relationship in matching inputs.",
                  "Booking {bid} includes a synthetic child passenger associated with the family/group.")
    if senior_pids:
        for i in range(6):
            pid = senior_pids[i % len(senior_pids)]
            p = passenger_lookup[pid]
            add_scenario(p["journey_id"], p["booking_id"], p["group_id"], "ELDERLY_PASSENGER",
                         f"Synthetic senior passenger {pid} has a LOWER berth preference (variant {i+1}).",
                         "Include the lower-berth preference in compatibility scoring without using medical information.")

    for i in range(6):
        for pid, stype, state in [(pending_pid, "PENDING_EXCHANGE", "ALREADY_IN_PENDING_REQUEST"), (confirmed_pid, "CONFIRMED_EXCHANGE", "ALREADY_CONFIRMED_SWAP")]:
            p = passenger_lookup[pid]
            add_scenario(p["journey_id"], p["booking_id"], p["group_id"], stype,
                         f"Passenger {pid} is in the synthetic application state {state} (variant {i+1}).",
                         "Do not offer unlimited conflicting requests for the same passenger; the application state is not an official railway reservation change.")

    cancelled_bookings = [b for b in bookings if b["booking_status"] == "CANCELLED"]
    rac_wait = [b for b in bookings if b["booking_status"] in {"RAC", "WAITLISTED"}]
    add_for_bids([b["booking_id"] for b in cancelled_bookings], "CANCELLED_BOOKING",
                  "Exclude cancelled passengers from active exchange candidates.",
                  "Cancelled booking {bid} must not appear in active exchange suggestions.")
    add_for_bids([b["booking_id"] for b in rac_wait], "WAITLIST_RAC",
                  "Keep RAC/waitlisted records out of confirmed-seat exchange matching unless explicitly represented by a business rule.",
                  "RAC/waitlist booking {bid} is a non-confirmed test record.")

    filler_types = [
        "GROUP_TOGETHER", "GROUP_SPLIT", "MULTIPLE_POSSIBLE_EXCHANGES", "BERTH_COMPATIBILITY",
        "GROUP_TOGETHER", "GROUP_SPLIT", "CHILD_WITH_FAMILY", "LARGE_GROUP",
    ]
    all_confirmed_for_filler = confirmed_bookings
    fi = 0
    while len(scenarios) < 100:
        b = all_confirmed_for_filler[fi % len(all_confirmed_for_filler)]
        stype = filler_types[fi % len(filler_types)]
        add_scenario(b["journey_id"], b["booking_id"], b["booking_id"].replace("BK", "GR"), stype,
                     f"Synthetic regression-test scenario {fi+1} for {stype.lower()}.",
                     "Use the relational inputs and current consent state to compute behavior independently.")
        fi += 1

    first_examples = {
        "trains.csv": trains[0], "stations.csv": stations[0], "routes.csv": routes[0], "journeys.csv": journeys[0],
        "coaches.csv": coaches[0], "seats.csv": seats[0], "bookings.csv": bookings[0], "passengers.csv": passengers[0],
        "groups.csv": groups[0], "seat_assignments.csv": seat_assignments[0], "passenger_preferences.csv": preferences[0],
        "exchange_eligibility.csv": eligibilities[0], "scenario_labels.csv": scenarios[0],
    }
    schema_defs = {
        "trains.csv": [
            ("train_id", "STRING", "Stable synthetic train identifier.", True, "PRIMARY KEY"),
            ("train_number", "STRING", "Synthetic train number; not a live schedule identifier.", True, ""),
            ("train_name", "STRING", "Synthetic Indian railway-style train name.", True, ""),
            ("train_type", "STRING", "Synthetic service category used to choose the coach composition.", True, ""),
            ("origin_station_code", "STRING", "Origin station code from stations.csv.", True, "stations.csv.station_code"),
            ("destination_station_code", "STRING", "Destination station code from stations.csv.", True, "stations.csv.station_code"),
            ("total_coaches", "INTEGER", "Number of coaches on each journey of this train.", True, ""),
            ("active_days", "STRING", "Comma-separated departure weekdays used by the synthetic journey schedule.", True, ""),
            ("operator", "STRING", "Synthetic operator label.", True, ""),
        ],
        "stations.csv": [
            ("station_id", "STRING", "Stable synthetic station identifier.", True, "PRIMARY KEY"),
            ("station_code", "STRING", "Synthetic dataset station code; used consistently across routes/trains/journeys.", True, "UNIQUE"),
            ("station_name", "STRING", "Railway-style station name.", True, ""),
            ("city", "STRING", "City associated with the station.", True, ""),
            ("state", "STRING", "Indian state or union territory.", True, ""),
            ("zone", "STRING", "Synthetic railway-zone category for regional variety.", True, ""),
        ],
        "routes.csv": [
            ("route_id", "STRING", "Stable synthetic route identifier.", True, "PRIMARY KEY + GROUP"),
            ("train_id", "STRING", "Train using this route.", True, "trains.csv.train_id"),
            ("sequence_number", "INTEGER", "Station order along the route.", True, ""),
            ("station_id", "STRING", "Station at this route stop.", True, "stations.csv.station_id"),
            ("arrival_time", "TIME", "Scheduled synthetic arrival time at the stop.", True, ""),
            ("departure_time", "TIME", "Scheduled synthetic departure time at the stop.", True, ""),
            ("day_offset", "INTEGER", "Days after the journey departure date for this stop.", True, ""),
            ("distance_from_origin_km", "INTEGER", "Synthetic cumulative distance; increases along each route.", True, ""),
        ],
        "journeys.csv": [
            ("journey_id", "STRING", "Stable identifier for one scheduled synthetic trip.", True, "PRIMARY KEY"),
            ("train_id", "STRING", "Train operating this journey.", True, "trains.csv.train_id"),
            ("journey_date", "DATE", "Synthetic journey departure date.", True, ""),
            ("origin_station_code", "STRING", "Journey origin; matches the train route origin.", True, "stations.csv.station_code"),
            ("destination_station_code", "STRING", "Journey destination; matches the train route destination.", True, "stations.csv.station_code"),
            ("scheduled_departure", "DATETIME", "Synthetic scheduled departure datetime.", True, ""),
            ("scheduled_arrival", "DATETIME", "Synthetic scheduled arrival datetime.", True, ""),
            ("journey_status", "ENUM", "SCHEDULED, COMPLETED, or CANCELLED; main dataset uses SCHEDULED.", True, ""),
        ],
        "coaches.csv": [
            ("coach_id", "STRING", "Journey-specific coach identifier.", True, "PRIMARY KEY"),
            ("journey_id", "STRING", "Journey that owns this coach.", True, "journeys.csv.journey_id"),
            ("coach_number", "STRING", "Coach label such as B2 or C1.", True, ""),
            ("coach_type", "ENUM", "Journey coach type derived from class code.", True, ""),
            ("class_code", "ENUM", "3A, 2A, SL, CC, or EC.", True, ""),
            ("seat_capacity", "INTEGER", "Number of seat/berth positions in the coach.", True, ""),
        ],
        "seats.csv": [
            ("seat_id", "STRING", "Stable seat identifier within the journey-specific coach model.", True, "PRIMARY KEY"),
            ("coach_id", "STRING", "Coach owning the seat.", True, "coaches.csv.coach_id"),
            ("coach_number", "STRING", "Denormalized coach number for application convenience.", True, ""),
            ("seat_number", "INTEGER", "Unique numeric seat position inside a coach.", True, ""),
            ("berth_type", "ENUM", "LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER, CHAIR, or EXECUTIVE.", True, ""),
            ("row_number", "INTEGER", "Synthetic layout row/bay number for physical-distance modeling.", True, ""),
            ("position", "ENUM", "WINDOW, MIDDLE, AISLE, or SIDE.", True, ""),
            ("is_window", "BOOLEAN", "Convenience flag derived from position.", True, ""),
            ("is_aisle", "BOOLEAN", "Convenience flag derived from position.", True, ""),
        ],
        "bookings.csv": [
            ("booking_id", "STRING", "Stable synthetic booking identifier.", True, "PRIMARY KEY"),
            ("journey_id", "STRING", "Journey associated with the booking.", True, "journeys.csv.journey_id"),
            ("pnr", "STRING", "Unique synthetic 10-digit PNR-like identifier.", True, "UNIQUE"),
            ("booking_date", "DATE", "Synthetic booking creation date; always before the journey date.", True, ""),
            ("booking_status", "ENUM", "CONFIRMED, RAC, WAITLISTED, or CANCELLED.", True, ""),
            ("number_of_passengers", "INTEGER", "Number of passenger rows that belong to this booking.", True, ""),
            ("primary_contact_passenger_id", "STRING", "First passenger in the booking, used as synthetic primary contact reference.", True, "passengers.csv.passenger_id"),
            ("booking_type", "ENUM", "INDIVIDUAL, FAMILY, FRIENDS, GROUP, or CAREGIVER_COMPANION.", True, ""),
        ],
        "passengers.csv": [
            ("passenger_id", "STRING", "Stable synthetic passenger identifier.", True, "PRIMARY KEY"),
            ("booking_id", "STRING", "Booking containing the passenger.", True, "bookings.csv.booking_id"),
            ("journey_id", "STRING", "Journey associated with the passenger.", True, "journeys.csv.journey_id"),
            ("group_id", "STRING", "Travelling-group identifier within the booking/journey.", True, "groups.csv.group_id"),
            ("full_name", "STRING", "Synthetic Indian-style name; not linked to a real passenger.", True, ""),
            ("age", "INTEGER", "Synthetic age consistent with passenger_type.", True, ""),
            ("gender", "ENUM", "Synthetic gender value for demo variety; not an identity assertion.", True, ""),
            ("passenger_type", "ENUM", "ADULT, CHILD, SENIOR, or INFANT.", True, ""),
            ("contact_reference", "STRING", "Synthetic non-contact token such as demo_contact_000001.", True, ""),
            ("booking_status", "ENUM", "Denormalized booking status for filtering.", True, "bookings.csv.booking_status"),
        ],
        "groups.csv": [
            ("group_id", "STRING", "Stable travelling-group identifier.", True, "PRIMARY KEY"),
            ("booking_id", "STRING", "Booking that contains the group.", True, "bookings.csv.booking_id"),
            ("journey_id", "STRING", "Journey associated with the group.", True, "journeys.csv.journey_id"),
            ("group_name", "STRING", "Synthetic display name for the group.", True, ""),
            ("group_size", "INTEGER", "Expected number of passenger rows linked to this group.", True, ""),
            ("group_type", "ENUM", "FAMILY, FRIENDS, COUPLE, CAREGIVER, or GROUP.", True, ""),
            ("travelling_together", "BOOLEAN", "Whether the passenger group is intended to travel together.", True, ""),
            ("priority_level", "ENUM", "Synthetic matching priority; HIGH or NORMAL.", True, ""),
        ],
        "seat_assignments.csv": [
            ("assignment_id", "STRING", "Stable assignment record identifier.", True, "PRIMARY KEY"),
            ("journey_id", "STRING", "Journey owning the assignment.", True, "journeys.csv.journey_id"),
            ("booking_id", "STRING", "Booking of the passenger assigned to the seat.", True, "bookings.csv.booking_id"),
            ("passenger_id", "STRING", "Passenger assigned to the seat.", True, "passengers.csv.passenger_id"),
            ("coach_id", "STRING", "Journey-specific coach containing the seat.", True, "coaches.csv.coach_id"),
            ("coach_number", "STRING", "Denormalized coach label.", True, ""),
            ("seat_id", "STRING", "Seat position assigned to the passenger.", True, "seats.csv.seat_id"),
            ("seat_number", "INTEGER", "Denormalized numeric seat number.", True, ""),
            ("berth_type", "STRING", "Denormalized berth/seat type.", True, "seats.csv.berth_type"),
            ("assignment_status", "ENUM", "ACTIVE in the current synthetic state.", True, ""),
            ("assigned_at", "DATETIME", "Synthetic timestamp for assignment creation.", True, ""),
        ],
        "passenger_preferences.csv": [
            ("preference_id", "STRING", "Stable preference record identifier.", True, "PRIMARY KEY"),
            ("passenger_id", "STRING", "Passenger owning the preference.", True, "passengers.csv.passenger_id"),
            ("journey_id", "STRING", "Journey context for the preference.", True, "journeys.csv.journey_id"),
            ("preferred_berth_type", "STRING", "Desired berth/seat type used by the matching engine.", True, ""),
            ("preferred_coach", "STRING", "Optional coach preference, commonly the current coach when same-coach exchange is requested.", False, ""),
            ("willing_to_exchange", "BOOLEAN", "Explicit consent input; FALSE means the person must not be suggested.", True, ""),
            ("exchange_same_coach_only", "BOOLEAN", "Whether candidate exchanges must stay inside the current coach.", True, ""),
            ("exchange_same_class_only", "BOOLEAN", "Whether candidate exchanges must stay within the same class.", True, ""),
            ("special_note", "STRING", "Non-medical synthetic scenario note where useful.", False, ""),
        ],
        "exchange_eligibility.csv": [
            ("eligibility_id", "STRING", "Stable eligibility record identifier.", True, "PRIMARY KEY"),
            ("journey_id", "STRING", "Journey context for eligibility.", True, "journeys.csv.journey_id"),
            ("passenger_id", "STRING", "Passenger whose target eligibility is represented.", True, "passengers.csv.passenger_id"),
            ("eligible", "BOOLEAN", "Current synthetic application-level eligibility state.", True, ""),
            ("reason", "ENUM", "Reason such as WILLING_TO_EXCHANGE, NOT_WILLING_TO_EXCHANGE, ALREADY_IN_PENDING_REQUEST, or ALREADY_CONFIRMED_SWAP.", True, ""),
            ("updated_at", "DATETIME", "Synthetic last-updated timestamp.", True, ""),
        ],
        "scenario_labels.csv": [
            ("scenario_id", "STRING", "Stable scenario label identifier.", True, "PRIMARY KEY"),
            ("journey_id", "STRING", "Journey containing the scenario fixture.", True, "journeys.csv.journey_id"),
            ("booking_id", "STRING", "Booking under test.", True, "bookings.csv.booking_id"),
            ("group_id", "STRING", "Travelling group under test.", True, "groups.csv.group_id"),
            ("scenario_type", "ENUM", "Named test scenario category; not a generated matching decision.", True, ""),
            ("description", "STRING", "Synthetic scenario description.", True, ""),
            ("expected_system_behavior", "STRING", "Test expectation for the RailTogether matching workflow.", True, ""),
        ],
    }
    dd_rows = []
    for fname, defs in schema_defs.items():
        ex = first_examples[fname]
        for col, dtype, desc, required, fk in defs:
            dd_rows.append({
                "file_name": fname,
                "column_name": col,
                "data_type": dtype,
                "description": desc,
                "example": str(ex[col]),
                "required": required,
                "foreign_key": fk,
            })

    for p in passengers:
        pid = p["passenger_id"]
        if pid in pref_by_passenger and pid in eligibility_by_passenger and not pref_by_passenger[pid]["willing_to_exchange"]:
            eligibility_by_passenger[pid]["eligible"] = False
            eligibility_by_passenger[pid]["reason"] = "NOT_WILLING_TO_EXCHANGE"

    fields = {
        "trains.csv": list(trains[0].keys()), "stations.csv": list(stations[0].keys()), "routes.csv": list(routes[0].keys()),
        "journeys.csv": list(journeys[0].keys()), "coaches.csv": list(coaches[0].keys()), "seats.csv": list(seats[0].keys()),
        "bookings.csv": list(bookings[0].keys()), "passengers.csv": list(passengers[0].keys()), "groups.csv": list(groups[0].keys()),
        "seat_assignments.csv": list(seat_assignments[0].keys()), "passenger_preferences.csv": list(preferences[0].keys()),
        "exchange_eligibility.csv": list(eligibilities[0].keys()), "scenario_labels.csv": list(scenarios[0].keys()),
        "data_dictionary.csv": list(dd_rows[0].keys()),
    }
    data_map = {
        "trains.csv": trains, "stations.csv": stations, "routes.csv": routes, "journeys.csv": journeys,
        "coaches.csv": coaches, "seats.csv": seats, "bookings.csv": bookings, "passengers.csv": passengers,
        "groups.csv": groups, "seat_assignments.csv": seat_assignments, "passenger_preferences.csv": preferences,
        "exchange_eligibility.csv": eligibilities, "scenario_labels.csv": scenarios, "data_dictionary.csv": dd_rows,
    }
    for fname, rows in data_map.items():
        write_csv(root / fname, rows, fields[fname])

    summary = {
        "seed": SEED,
        "reference_date": REFERENCE_DATE.isoformat(),
        "counts": {fname[:-4]: len(rows) for fname, rows in data_map.items()},
        "scenario_types": dict(sorted(Counter(s["scenario_type"] for s in scenarios).items())),
        "group_size_distribution": dict(sorted(Counter(g["group_size"] for g in groups).items())),
        "arrangement_distribution": dict(sorted(Counter(arrangement_by_booking.values()).items())),
        "active_confirmed_passengers": len(seat_assignments),
    }
    (root / "dataset_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    readme = f"""# RailTogether Synthetic Railway Dataset\n\n## Purpose\nThis dataset supports development, testing, UI/API demonstrations, and matching-engine experiments for **RailTogether**, a platform that detects travelling groups whose assigned seats/berths are separated and identifies possible **voluntary** seat-exchange opportunities.\n\n> **Synthetic-data disclaimer:** This dataset is synthetic and created exclusively for software development, testing, demonstration, and hackathon purposes. It does not contain real passenger information, scraped passenger records, live schedules, or official reservation changes.\n\n## Generated scope\n- Fixed random seed: `{SEED}`\n- Reference date: `{REFERENCE_DATE.isoformat()}`\n- Future synthetic journeys: 180\n- Synthetic trains: 30\n- Synthetic routes: 30\n- Journey-specific coaches: {len(coaches)}\n- Journey-specific seat positions: {len(seats)}\n- Bookings: {len(bookings)}\n- Passengers: {len(passengers)}\n- Travelling groups: {len(groups)}\n- Active confirmed seat assignments: {len(seat_assignments)}\n- Exchange eligibility rows: {len(eligibilities)}\n- Scenario labels: {len(scenarios)}\n\n## File structure\n1. `trains.csv` — synthetic train-level information.\n2. `stations.csv` — station master.\n3. `routes.csv` — station sequence and synthetic route timings per train.\n4. `journeys.csv` — one row per synthetic scheduled trip.\n5. `coaches.csv` — journey-specific coaches and class codes.\n6. `seats.csv` — journey-specific seat/berth layout with row and position.\n7. `bookings.csv` — booking/PNR level data.\n8. `passengers.csv` — passenger records linked to bookings and groups.\n9. `groups.csv` — group-level travelling-together metadata.\n10. `seat_assignments.csv` — current active seat assignments for confirmed passengers.\n11. `passenger_preferences.csv` — explicit voluntary exchange preferences.\n12. `exchange_eligibility.csv` — current application-level eligibility state.\n13. `scenario_labels.csv` — labelled test fixtures and expected behavior; these are test inputs, not matching decisions.\n14. `data_dictionary.csv` — schema documentation for every CSV column.\n15. `dataset_summary.json` — counts and scenario distribution for convenience.\n\n## Relational keys\n- `train_id` → `trains.csv.train_id`\n- `route_id` identifies one train route; `routes.csv.train_id` links back to the train.\n- `journey_id` → `journeys.csv.journey_id` and is the parent for coaches, assignments, preferences, and eligibility.\n- `booking_id` → `bookings.csv.booking_id`; passenger rows and scenario labels use the same ID.\n- `passenger_id` → `passengers.csv.passenger_id`; assignments/preferences/eligibility use the same stable ID.\n- `group_id` → `groups.csv.group_id`; passengers and scenario labels reference it.\n- `coach_id` → `coaches.csv.coach_id`; seats and assignments reference it.\n- `seat_id` → `seats.csv.seat_id`; active assignments reference it.\n\n## Important business rules encoded\n- A confirmed passenger has exactly one active seat assignment.\n- The same active seat cannot be assigned twice within one journey.\n- RAC, waitlisted, and cancelled bookings have no active confirmed seat assignment.\n- `willing_to_exchange = FALSE` results in `eligible = FALSE` unless a separately documented rule is added; the generated dataset uses the strict consent rule.\n- Same-coach and same-class restrictions are represented in passenger preferences.\n- Pending/confirmed swap states are synthetic **application states**, not official railway reservation changes.\n- Seat-number difference is an MVP proximity signal only; `row_number` and `position` are included so the application can later build a better physical-distance model.\n- Scenario labels tell the test harness what situation is intended. The matching engine must independently calculate recommendations from the raw inputs.\n\n## Scenario coverage\nThe dataset includes labelled fixtures for: GROUP_TOGETHER, GROUP_SPLIT, EASY_EXCHANGE, NOT_WILLING_TO_EXCHANGE, MULTIPLE_POSSIBLE_EXCHANGES, SAME_COACH_PREFERENCE, DIFFERENT_CLASS, BERTH_COMPATIBILITY, NO_POSSIBLE_MATCH, MULTIPLE_GROUPS_IN_SAME_COACH, LARGE_GROUP, ELDERLY_PASSENGER, CHILD_WITH_FAMILY, PENDING_EXCHANGE, CONFIRMED_EXCHANGE, CANCELLED_BOOKING, WAITLIST_RAC, and PRIMARY_DEMO.\n\n## Primary demo\nThe first journey is a synthetic Delhi → Chandigarh service. Its primary demo booking is a four-person group assigned to `B2-31`, `B2-32`, `B2-57`, and `B2-58`. Three other synthetic passengers are placed on `B2-45`, `B2-46`, and `B2-60`. The scenario is explicitly labelled `PRIMARY_DEMO`; the application should detect the split, filter out unwilling/locked users, calculate compatibility, and allow a simulated application-level request/accept/reject flow.\n\n## Deterministic regeneration\nRun:\n\n```bash\npython generate_dataset.py railway_dataset\npython validate_dataset.py railway_dataset\n```\n\nThe generator uses a fixed seed (`{SEED}`), so rerunning it with the same code and Python version produces the same relational values and IDs.\n\n## Validation\n`validate_dataset.py` checks duplicate keys, foreign keys, passenger counts, group sizes, date/time ordering, coach/seat ownership, duplicate active seats, preference/eligibility consistency, assignment rules, and scenario references. A successful run prints `DATASET VALIDATION PASSED`.\n\n## Loading into Node.js / Express / MongoDB\nFor a quick prototype, load the CSVs with a CSV parser such as `csv-parse` and upsert on the documented primary keys. In MongoDB, a typical flow is:\n\n```text\ntrains -> routes -> journeys -> coaches -> seats\nbookings -> passengers -> groups\nseat_assignments -> passenger_preferences -> exchange_eligibility\nscenario_labels (test fixtures)\n```\n\nUse `journey_id`, `booking_id`, `passenger_id`, `group_id`, `coach_id`, and `seat_id` as stable cross-collection keys.\n\n## No PII policy\nNames are synthetic combinations, contact fields use `demo_contact_######` tokens, and the dataset contains no phone numbers, real email addresses, or scraped passenger records.\n"""
    (root / "README.md").write_text(readme, encoding="utf-8")

    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
