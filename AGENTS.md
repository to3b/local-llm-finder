# Local LLM Finder data contract

The published Google Sheet is part of the production data contract, not a separate notes document.

## Live tabs

The browser loads and validates these published tabs before building the finder controls:

- `Models` — full model catalogue and task-fit planning inputs
- `GPUs` — full GPU catalogue
- `Quant Calibrations` — sourced quant-size, active-parameter and selected capability overrides

`Sources` and `Site Copy` are maintained in the workbook for review, but are not currently authoritative runtime inputs. Static HTML/site copy remains bundled for crawlability and fallback.

## Required coordination

When a feature adds, removes, renames, or changes the meaning of editable catalogue fields, update all of the following together:

1. the Google Sheet schema/data;
2. `dist/live-data.js` parsing and validation;
3. bundled fallback data/calibrations where the same concept exists;
4. regression tests, especially `tests/live-data.test.js` and catalogue/recommendation tests;
5. user-facing workbook instructions if the editing workflow changes.

Do not silently rename or delete required Sheet columns. Extra columns are intentionally ignored by the live parser so notes can be added safely.

## Safety behavior

The live catalogue is transactional. It is accepted only when all required CSVs parse and validate, calibration references resolve, and the enabled catalogue contains at least 130 models and 135 GPUs. Otherwise the site keeps the bundled known-good catalogue.

Node/CI must not depend on Google Sheets availability. Tests exercise bundled fallback plus the parser/validation contract with local fixtures.

When editing catalogue logic, preserve the fallback path and do not remove the live-data validation merely to make a malformed sheet load.
