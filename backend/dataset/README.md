# Synthetic Railway Datasets Directory

This directory is reserved for synthetic railway datasets used by the application. Upload CSV or JSON files here. The dataset service is responsible for validating and loading these files.

## Supported Formats & File Types

The dataset loader (`server/services/datasetService.js`) dynamically detects and parses files placed in `server/dataset/uploads/`:

1. **JSON Datasets** (e.g. `synthetic_railway_data.json` or separate entity JSON files):
   - Single nested JSON with arrays: `journeys`, `passengers`, `trains`, `bookings`
   - Or flat records list matching the Passenger / Journey schema.

2. **CSV Datasets** (e.g. `journeys.csv`, `passengers.csv`, `trains.csv`, `seats.csv`, `bookings.csv`):
   - Standard comma-delimited headers with train, coach, seatNumber, berthType, groupId, etc.

## Expected Schemas & Fields

### Journey Entity:
- `pnr` (string)
- `trainNumber` (string)
- `trainName` (string)
- `source` (string)
- `destination` (string)
- `journeyDate` (string/date)
- `coach` (string, e.g. "B2")

### Passenger Entity:
- `name` (string)
- `journeyPnr` / `journeyId` (string)
- `groupId` (string or null - passengers with matching groupId are treated as travelling together)
- `coach` (string)
- `seatNumber` (number or string, e.g. 31, 57)
- `berthType` ("LOWER" | "MIDDLE" | "UPPER" | "SIDE_LOWER" | "SIDE_UPPER")
- `ageCategory` ("ADULT" | "SENIOR" | "CHILD" | "INFANT")
- `bookingStatus` ("CNF" | "RAC" | "WL")

## Note on Synthetic Data
- Do not upload real or private passenger PII or proprietary IRCTC data.
- The platform operates strictly with synthetic or voluntary opt-in simulation data.
