# Connect the private Test Review Sheet

Checked 5 October 2026 against the deployed submission-service source at
`0241a3fccef700a92e2858cc098bb1a14f60e47e`.

Open the owner-only setup at
https://localllm-tests-sandbox.to3b.chatgpt.site/review/sheets and sign in as the
site owner. Follow its private download link; it supplies the configured script
without placing the connection key in an article or in this repository.

1. Open Test Review from that setup page, then Extensions → Apps Script.
2. Paste the downloaded connection script into `Code.gs` and save.
3. Select `setupReview`, click Run, and approve Google's requested access.

The script needs owner authorization to access the spreadsheet, contact the
private review service and create a five-minute trigger. A connector read does
not grant these Apps Script permissions, so setup is not complete until the
owner runs it. Do not describe the Sheet as connected before this step succeeds.

The first successful sync should change the report's Sync status to `Synced`.
For an immediate update, choose LLM tests → Sync reports and decisions. A
decision is saved only when its Sync status says `Synced`; conflicts or refusal
messages require review. Leave Calibration unchecked for unverified reports.
Publishing a reviewed report does not automatically release Finder calibration.

The authoritative live database currently contains only an explicitly synthetic
fixture. It is excluded from the maintenance review. No report decisions were
changed during this work.

Offline checks covered workbook binding, request signing, trigger replacement,
unchanged decisions, formula escaping, conflicting revisions and refused saves.
The actual Google authorization and trigger execution remain unverified.
