# Local LLM Finder

**Find local LLMs that fit your GPU, Mac, or PC — with estimates for memory use, context length, task fit, and rough speed.**

**Live tool:** https://localllmfinder.com/

**Current release:** 1.0.0 — 28 September 2026

Local LLM Finder is a static, browser-only planning tool for choosing, comparing, and upgrading local LLM setups.

## What it does

The tool supports three related decisions:

- **Find** — shortlist models for your current GPU, Mac, or RAM-based setup.
- **Improve** — compare a model you already run with alternatives for the same hardware and workload.
- **Upgrade** — see which higher-memory tiers materially change your options.

The main flow stays simple: **hardware → main use → speed/quality priority**. Advanced and Power User controls add context length, secondary workloads, an optional minimum speed, RAM, quantization, model family, model-file size, and manual memory overrides.

## Worked example

For an **RTX 3060 12 GB**, **32 GB system RAM**, **coding**, **8K context**, **Balanced** priority, **automatic quantization**, and **no minimum speed floor**, the current September 2026 catalogue ranks:

1. **Qwen2.5-Coder 14B · Q4_K_M** — 11.0 GB estimated memory · 15–21 tok/s rough speed.
2. **DeepSeek-R1-0528-Qwen3-8B · Q5_K_M** — 8.6 GB estimated memory · 20–27 tok/s rough speed.
3. **LFM2.5 8B-A1B · Q5_K_M** — 8.4 GB estimated memory · 91–124 tok/s rough speed.

These are **planning estimates, not benchmark results**. Longer context, a fixed quantization, a hard speed floor, or a different workload can change the shortlist.

Try the calculator with your own hardware: https://localllmfinder.com/

## Catalogue

The current catalogue contains **135+ GPU profiles** across NVIDIA, AMD, and Intel and **130+ local model profiles** spanning compact dense models, coding/reasoning specialists, large workstation models, and selected mixture-of-experts models.

GPU coverage includes consumer, professional, and selected datacenter cards. Laptop GPUs and integrated GPUs are intentionally not treated as equivalent to desktop cards yet because power limits and shared-memory behaviour need a different estimator.

Model identities include families such as Qwen, Gemma, Llama, Mistral, DeepSeek, Phi, Granite, OLMo, GPT-OSS, GLM, and other mainstream/niche releases. `dist/model-sources.js` stores curated publisher provenance for common recommendations; `dist/model-links.js` uses those records for direct publisher Hugging Face links and falls back to Hugging Face search rather than guessing a community repository.

## Important limitations

Local LLM Finder is a **planning tool, not a benchmark database**.

- Memory and throughput figures are estimates.
- Internal task-capability scores are prototype ranking inputs; the public UI shows broad fit labels instead of precise `/100` values.
- Exact Mac speed is not currently estimated.
- Runtime, drivers, CPU, backend, quantization, context length, and prompt length can materially change real performance.
- A model fitting in memory does not guarantee runtime compatibility or good performance.

Before relying on a recommendation for a purchase or production use, check the publisher model card, licence, runtime support, and independent benchmarks.

## Recommendation behaviour

- Model memory includes estimated quantized weights, context overhead, runtime overhead, and reserve headroom.
- The declared main workload receives 65% of task weighting; selected secondary workloads share the remaining 35%.
- Exact known GPUs can receive a rough memory-bandwidth-based speed estimate.
- Minimum speed is opt-in; there is no hidden speed floor.
- Unknown-speed setups do not reward tiny models in Balanced or quality-oriented modes merely because they are smaller.
- Selected MoE profiles can provide an active-weight speed hint while still requiring memory for the full quantized model representation.
- The top recommendation is based on the engine ranking score. Joint `#1` results require an intentionally tight rank/task-fit tie.

## Methodology and trust

- [Methodology](https://localllmfinder.com/dist/methodology.html)
- [Privacy](https://localllmfinder.com/dist/privacy.html)
- [Terms & disclaimer](https://localllmfinder.com/dist/terms.html)
- [Report a data issue](https://github.com/to3b/local-llm-finder/issues/new/choose)
- [V1 recommendation spot-check](docs/v1-spotcheck.md)
- [Release notes](CHANGELOG.md)

Commonly surfaced models use curated publisher links where verified. If an official repository has not been verified, the tool avoids guessing a community upload.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

No backend, account, or API key is required.

## Tests

```bash
npm test
```

The suite covers catalogue integrity, recommendation scenarios, ranking regressions, presentation/tie rules, curated model sources, evidence-backed calibrations, share-link state, a V1 hardware/workload matrix, 20 real-world spot-check scenarios, and release metadata. GitHub Actions runs the suite on pushes to `main` and pull requests.

## Project structure

- `index.html` — public entry point. It loads assets from `dist/` while keeping the public URL at the domain root.
- `CNAME` — GitHub Pages custom-domain declaration for `localllmfinder.com`.
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

The next major accuracy improvement is deeper provenance rather than more UI controls: expand sourced model records with release date, architecture, total/active parameters, native context, licence, runtime support, measurement source/date, and confidence. Prototype ranking inputs can then be replaced progressively without changing the core interface.

Corrections and missing hardware/models can be reported through GitHub Issues.
