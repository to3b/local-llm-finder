# Editing memory and context profiles

Keep Models, Quant Calibrations, the bundled fallback and the Knowledge build in sync.
The 5 October changes are staged in `staged-sheet-changes.json`; the live Sheet
must not be changed until the owner approves the checked sandbox.

## Units

- Base Q4 GB, quant-file overrides and KV GB / 1K are decimal GB (1 GB = 1,000,000,000 bytes).
- VRAM GB and RAM inputs retain their existing column/control names and nominal
  hardware capacities; the calculation interprets these budgets as GiB
  (1 GiB = 1,073,741,824 bytes). Public allocation estimates are labelled GiB.
- Bandwidth GB/s and maximum-download-size filters remain decimal; they do not
  use the allocation conversion.
- The runtime allowance remains 0.9 decimal GB, a prototype planning input.
  Reserve is 3% of the GiB budget, bounded to 0.15–1.5 GiB.
- Decide fit before rounding. Less than 0.5 GiB after reserve is a tight estimate,
  rather than a verified minimum. Runtime/display allocation can change it.

## Optional Models columns S–V

| Field | What to enter |
| --- | --- |
| Cache Type | `f16` for a sourced FP16 K/V profile; blank or `planning` when precision is unverified. Weight quantisation does not set this field. |
| Memory Source | Public publisher configuration or runtime documentation URL. No spreadsheet editing links. |
| Native Context Tokens | Exact documented native ceiling. Context K × 1,000 must not exceed it in the default profile. |
| Memory Reviewed At | Date the source/assumptions were checked, YYYY-MM-DD. This is not a hardware test date. |

Existing sheets without these columns still parse. A declared FP16 profile must
include a source and review date. Unsupported cache types, malformed metadata or
a context above a declared native ceiling reject the full live catalogue and
preserve the fallback; do not bypass validation.

For full-attention FP16 K/V cache:
`KV GB / 1K = 2 × layers × KV heads × head dimension × 2 bytes × 1,000 / 1e9`.
This is an architecture-derived storage estimate, not peak measured allocation.
Sliding-window, hybrid and compressed caches need their own sourced treatment.
Do not copy a dense-model coefficient to another architecture.

The Qwen3 1.7B/4B/8B/14B/32B default profiles stop at 32K (32,000) tokens, within
the publisher's 32,768 native ceiling. The native value comes from the
[publisher's model card](https://huggingface.co/Qwen/Qwen3-8B), rather than
`max_position_embeddings` alone: the published configuration can include room
for output as well as input. Keep both the model-card and configuration links
in the reviewed article sources. Do not raise Context K merely because a
runtime can accept a larger number. YaRN/extended-context support needs an
explicitly configured profile and its memory assumptions.

## Release coordination

Re-read the affected Sheet cells and sources before applying the staged change
manifest. Apply the approved Sheet fields and matching fallback/parser release
together, then regenerate Knowledge from the same source state. Keep the existing
24 published URLs and draft statuses. Update article Date Modified when its
calculation changes; update a source-review date only when that source was checked.

Mistral Medium 3.5 remains enabled with its original editorial prototype score.
The publisher claim stays as a held reference row, without the Coding=100
override. It is not an independently measured calibration.
