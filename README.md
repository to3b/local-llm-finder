# Local LLM Finder

A static, browser-only tool for comparing local LLM options against a graphics card, Apple silicon Mac or RAM-based starting point. Matches update as choices change; the first view shows an explicitly labelled 16 GB RAM example.

## Run locally

From this folder, run `python3 -m http.server 8000 --directory dist`, then open `http://localhost:8000/`. A local server is needed because the app uses JavaScript modules. No installation, backend or API key is needed.

Run `npm test` for recommendation scenarios (Node.js required).

## Data and interpretation

- `dist/data.js`: 24 NVIDIA, AMD and Intel GPU profiles and 91 illustrative model profiles from 135M to 405B parameters. The models cover compact, general, coding, reasoning, and workstation-size dense families. Q4_K_M and Q5_K_M are sample options, with Q8_0 on larger models. GPU memory/bandwidth are nominal hardware specifications; model weight and context memory, conservative context profiles, task scores and speed are prototype estimates. License notes flag selected restricted-weight families, but always check the publisher's current terms.
- `dist/recommend.js`: pure recommendation and estimate functions. It adds illustrative runtime and context memory to model weights, reserves some memory headroom, checks available model memory, excludes unsupported context, and ranks by selected task scores and a five-stop speed–quality preference. It returns both a small shortlist and the full set of models that fit memory and context, one quantization per model. System RAM is a loading advisory, not a hard fit rule. Memory alone yields fit-based starting points with speed explicitly unknown; selecting an exact GPU enables a rough bandwidth-based speed estimate and the speed target.
- `dist/app.js`: form handling, shortlist rendering, and a folded, searchable catalogue of all fitting models. The catalogue initially shows eight rows and reveals more on request, so the main tool remains compact.

All model scores, memory requirements and throughput ranges are **sample planning data**, not verified benchmarks. The context profiles are conservative demo limits, not claims about native model maximum context. Real performance depends on inference backend, settings, CPU, GPU, batching and prompt length. Mac and unknown-device modes reserve memory for the operating system, and neither claims a speed without device details. The GPU-name speed estimate is a bandwidth proxy, not a measured benchmark. Manual memory overrides the default capacity and leaves speed unknown.

Model names and released sizes were checked against publisher sources, including [Qwen's model collections](https://huggingface.co/Qwen/collections), [Meta's Llama downloads](https://ai.meta.com/resources/models-and-libraries/llama-downloads/), [Google's Gemma overview](https://deepmind.google/models/gemma/), [Mistral's published models](https://huggingface.co/mistralai/models), [Ai2's OLMo releases](https://allenai.org/olmo), [Microsoft's Phi models](https://huggingface.co/microsoft/models), [DeepSeek's releases](https://huggingface.co/deepseek-ai/models), [IBM Granite](https://huggingface.co/ibm-granite/models), [Falcon](https://huggingface.co/tiiuae/models), [Hugging Face's Smol models](https://huggingface.co/HuggingFaceTB/models), [Cohere Labs](https://huggingface.co/CohereLabs/models), and [01.AI](https://huggingface.co/01-ai/models). These sources verify the model identities, not the prototype performance and quality numbers. Dense-model weight estimates are not suitable for mixture-of-experts models, so the catalogue intentionally omits them for now.

Future benchmark records can replace the sample fields and add source, measured/estimated status, hardware match and confidence without changing the core form-to-results flow.

## Progressive controls

The finder now uses three quiet levels of control rather than exposing every setting at once:

- **Basic**: hardware, one primary task and the speed-versus-quality preference. This is enough to get a useful shortlist.
- **Advanced**: secondary tasks, context length, minimum speed (when a known GPU is selected) and host RAM. The primary task receives 65% of the task-fit weighting; selected secondary tasks share the remaining 35%.
- **Power user**: fixed quantization, maximum estimated model-weight file size, model-family filtering and a manual memory-budget override. These are opt-in filters and keep their automatic/no-limit defaults unless changed.

Shared setup links store the primary task separately while remaining compatible with older links that stored all tasks together.

## Traffic-test iteration (28 September 2026)

This version adds a lightweight public-launch layer without adding analytics or advertising:

- A search-oriented page title, fuller meta description, Open Graph metadata and `WebApplication` structured data.
- Crawlable introductory, methodology and FAQ copy around the interactive finder.
- `robots.txt` and `sitemap.xml` for the current `local-llm-finder.to3b.chatgpt.site` address.
- A share button that stores the selected setup in the URL fragment (`#...`) and restores it on load.
- Standalone `privacy.html`, `terms.html` and `methodology.html` pages.
- Clearer notices that memory, performance and task-fit values are planning estimates rather than measured benchmarks.

### Before changing domains

The current public URL appears in `dist/index.html`, `dist/robots.txt` and `dist/sitemap.xml`. If the project later moves to `localllmfinder.com`, update those absolute URLs and submit the new sitemap in the relevant search-engine webmaster tools.

### Recommended next data iteration

Before creating large numbers of indexable GPU/model landing pages, replace or supplement prototype scores and performance inputs with sourced records. Useful fields include source URL, source date, measured/estimated status, hardware, runtime/backend, quantization, context length and confidence. This makes future pages genuinely useful rather than thin variants of the same calculator output.
