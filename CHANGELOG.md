# Changelog

## 1.0.0 — 28 September 2026

First public release candidate of Local LLM Finder.

### Finder

- Find local models from GPU, Mac or RAM-based hardware inputs.
- Separate Basic, Advanced and Power user controls through progressive disclosure.
- Main-use and secondary-use weighting for chat, coding, reasoning, writing and long-document work.
- Five-position speed-to-quality priority control.
- Quantization, context, family, file-size and manual-memory controls.
- Find, Improve and Upgrade journeys.
- Shareable setup links stored in the URL hash.

### Catalogue

- 142 GPU profiles across NVIDIA, AMD and Intel.
- 136 local model profiles spanning small dense models, coding/reasoning specialists, workstation-scale models and selected MoE models.
- Curated publisher Hugging Face destinations for common recommendations, with search fallback when a publisher repository has not been verified.
- Evidence-backed calibration layer for corrections that supersede older prototype inputs.

### Recommendation engine

- Estimated quantized-memory fit including runtime/context overhead and reserve headroom.
- Rough known-GPU speed ranges using memory-bandwidth/model-size planning assumptions.
- MoE active-weight hints for throughput without reducing full-model memory requirements.
- No hidden speed floor; minimum speed is an explicit Advanced constraint.
- Quality-led Stronger/Strongest modes and neutral speed treatment when exact-device speed is unknown.
- Engine-derived #1 and joint-#1 presentation.
- Broad public task-fit labels instead of unsupported precise capability scores.

### Release quality

- Automated catalogue, ranking, presentation, provenance, calibration, share-state and release tests.
- 165-scenario hardware/workload/preference QA matrix.
- 20 representative real-world recommendation spot checks retained as regression coverage.
- Privacy, terms/disclaimer and methodology pages.
- Clean GitHub Pages canonical URL, sitemap and robots metadata.
- GitHub issue path for data corrections and missing hardware/models.

### Known V1 limitations

- Most task-fit inputs remain planning estimates rather than a benchmark database.
- Speed estimates are not backend-specific measured throughput.
- Exact Mac-chip speed is not estimated yet.
- Laptop GPUs, integrated GPUs, CPU-only inference and multi-GPU setups are not fully modeled.
- Runtime/format compatibility is not yet a complete structured filter.
