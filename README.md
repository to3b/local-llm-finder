# Local LLM Finder

A static, browser-only tool for finding, comparing and planning local LLM setups.

**Current release: 1.0.0 — 28 September 2026**

Public site: https://to3b.github.io/local-llm-finder/

Release notes: `CHANGELOG.md`  
V1 recommendation validation: `docs/v1-spotcheck.md`

## What it does

Local LLM Finder combines three related workflows:

- **Find** — shortlist models for a GPU, Mac or RAM-based setup.
- **Improve** — compare a model you already run with alternatives for the same hardware and workload.
- **Upgrade** — show higher-memory tiers where the recommendation meaningfully changes.

The main flow stays simple: hardware → main use → speed/quality priority. Advanced and Power user controls add context length, secondary workloads, minimum speed, RAM, quantization, model-family and memory/file-size filters.

## Catalogue

The current catalogue contains **135+ GPU profiles** across NVIDIA, AMD and Intel and **130+ local model profiles** spanning compact dense models, coding/reasoning specialists, large workstation models and selected mixture-of-experts models.

GPU coverage includes consumer, professional and selected datacenter cards. Laptop GPUs and integrated GPUs are intentionally not treated as equivalent to desktop cards yet because power limits and shared-memory behaviour need a different estimator.

Model identities include families such as Qwen, Gemma, Llama, Mistral, DeepSeek, Phi, Granite, OLMo, GPT-OSS, GLM and other mainstream/niche releases. `dist/model-sources.js` stores curated publisher provenance for common recommendations; `dist/model-links.js` uses those records for direct publisher Hugging Face links and falls back to Hugging Face search rather than guessing a community repository.

## Important data limitation

Memory, throughput and task-capability inputs are still planning estimates, not a benchmark database. Internal task scores are used for ranking but the public UI presents broad fit labels instead of precise `/100` values. Speed estimates are bandwidth/model-size planning ranges and are labelled as rough. Exact Mac speed is not currently estimated.

Before relying on a recommendation for a purchase or production use, check the publisher model card, licence, runtime support and independent benchmarks.

## Recommendation behaviour

- Model memory includes estimated quantized weights, context overhead, runtime overhead and reserve headroom.
- The declared main workload receives 65% of task weighting; selected secondary workloads share the remaining 35%.
- Exact known GPUs can receive a rough memory-bandwidth-based speed estimate.
- Minimum speed is opt-in; there is no hidden speed floor.
- Unknown-speed setups do not reward tiny models in Balanced or quality-oriented modes merely because they are smaller.
- Selected MoE profiles can provide an active-weight speed hint while still requiring memory for the full quantized model representation.
- The top recommendation is based on the engine ranking score. Joint `#1` results require an intentionally tight rank/task-fit tie.

See `dist/methodology.html` for the user-facing explanation.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

No backend, account or API key is required.

## Tests

```bash
npm test
```

The suite covers catalogue integrity, recommendation scenarios, ranking regressions, presentation/tie rules, curated model sources, evidence-backed calibrations, share-link state, a V1 hardware/workload matrix, 20 real-world spot-check scenarios and release metadata. GitHub Actions runs the suite on pushes to `main` and pull requests.

## Project structure

- `index.html` — clean GitHub Pages entry point. It loads assets from `dist/` while keeping the public URL at the repository root.
- `dist/data.js` — base GPU/model catalogue.
- `dist/gpu-extra.js`, `dist/model-extra.js`, `dist/catalog-extra.js` — expanded catalogue data.
- `dist/model-calibrations.js` — small evidence-backed corrections to older prototype inputs.
- `dist/recommend.js` — pure fit/ranking engine.
- `dist/app.js` — main finder form and results rendering.
- `dist/journeys.js` — Find / Improve / Upgrade decision flows.
- `dist/presentation.js` — qualitative fit labels and joint-top-choice rules.
- `dist/model-sources.js` — curated publisher provenance and selected sourced metadata.
- `dist/model-links.js` — Hugging Face publisher/search links.
- `dist/styles.css`, `dist/tiers.css`, `dist/palette.css` — interface styling.
- `dist/privacy.html`, `dist/terms.html`, `dist/methodology.html` — trust/legal pages.
- `docs/v1-spotcheck.md` — retained V1 real-world recommendation validation record.

## V1 data direction

The next major accuracy improvement is deeper provenance rather than more UI controls: expand sourced model records with release date, architecture, total/active parameters, native context, licence, runtime support, measurement source/date and confidence. Prototype ranking inputs can then be replaced progressively without changing the core interface.

Corrections and missing hardware/models can be reported through GitHub Issues.
