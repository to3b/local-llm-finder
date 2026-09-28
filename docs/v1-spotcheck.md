# V1 recommendation spot-check

Validated: 28 September 2026

This is a practical release check for Local LLM Finder. It supplements automated fit/ranking tests with a set of common real-world hardware and workload combinations.

It is **not** a benchmark certification. Model capability scores and most throughput figures are still planning inputs. The purpose of this check is to catch obviously unreasonable recommendations, impossible memory fits, hidden constraints, and ranking behaviour that does not match the selected preference.

## Scope

20 representative scenarios are run in `tests/v1-spotcheck-report.js` on every CI run:

| Hardware | Workload | Priority |
| --- | --- | --- |
| RTX 4060 8 GB | Chat | Balanced |
| RTX 4060 8 GB | Coding | Balanced |
| RTX 3060 12 GB | Coding | Balanced |
| RTX 4070 12 GB | Coding | Balanced |
| RTX 4060 Ti 16 GB | Coding | Balanced |
| RTX 5070 Ti 16 GB | Reasoning | Balanced |
| RTX 4080 SUPER 16 GB | Chat | Strongest |
| RX 7800 XT 16 GB | Chat | Balanced |
| RX 7900 XTX 24 GB | Reasoning | Balanced |
| Intel Arc B580 12 GB | Chat | Balanced |
| RTX 4090 24 GB | Coding | Balanced |
| RTX 5090 32 GB | Reasoning | Strongest |
| RTX 6000 Ada 48 GB | Reasoning | Strongest |
| Mac 16 GB | Chat | Balanced |
| Mac 24 GB | Coding | Balanced |
| Mac 32 GB | Coding | Balanced |
| Mac 64 GB | Reasoning | Balanced |
| Mac 128 GB | Coding | Strongest |
| Mac 192 GB | Chat | Strongest |
| Mac 512 GB | Coding | Balanced |

The report prints the top three model/quantization choices, estimated memory, estimated speed where an exact GPU is known, internal task-fit input and ranking score. It also asserts that every surfaced recommendation fits the calculated model-memory budget.

## What the spot-check found

### 1. A hidden speed floor was changing recommendations

The initial V1 candidate silently applied a 15 tok/s minimum whenever an exact GPU was selected. In an A/B pass, that changed the #1 result in 8 of the 13 exact-GPU scenarios even though the user had never requested a hard speed requirement.

**Fix:** V1 now has no hidden speed minimum. Speed still contributes to the Fastest ↔ Strongest ranking, but a hard minimum is opt-in under Advanced. The UI offers No minimum, 5, 10, 15, 20, 30 and 50 tok/s. `tests/speed-policy.test.js` protects this behaviour.

### 2. Strongest was still too speed-biased

On high-end hardware, the old Strongest weighting could let a fast 8B reasoning model outrank a larger model with a higher internal capability input. That did not match the meaning of the control.

**Fix:** the five priority positions now become progressively more quality-led. Strongest is 98% task-fit / 2% speed utility before tie-breaking, while Balanced remains a genuine speed/quality trade-off. Regression tests cover the RTX 5090 and 48 GB workstation cases.

After the fix, for example, RTX 5090 32 GB + reasoning + Strongest selects DeepSeek-R1-Distill-Qwen-32B ahead of the faster 8B distill in the current catalogue.

### 3. One prototype model ordering contradicted current publisher evidence

The prototype table scored Devstral 2 above Mistral Medium 3.5 for coding. Mistral's current Medium 3.5 model card states that Medium 3.5 replaces Devstral 2 in its coding agent and describes improved coding performance versus previous released models.

**Fix:** `dist/model-calibrations.js` adds a small, auditable evidence-backed calibration layer. Medium 3.5's coding input is adjusted so the old prototype ordering cannot contradict that publisher evidence. The source and verification date are stored with the override.

Publisher source: https://huggingface.co/mistralai/Mistral-Medium-3.5-128B

### 4. Large-memory Mac results no longer collapse to tiny models

The earlier 512 GB Mac issue came from treating model size as a speed proxy when device speed was unknown. Balanced and quality-oriented Mac recommendations now keep speed neutral rather than assuming smaller = better.

Current examples in the report:

- Mac 24 GB + coding + Balanced: Qwen2.5-Coder 14B / DeepSeek-Coder-V2-Lite class choices.
- Mac 32 GB + coding + Balanced: Qwen3-Coder 30B-A3B / Qwen2.5-Coder 32B class choices.
- Mac 64 GB + reasoning + Balanced: 32B-class reasoning choices.
- Mac 512 GB + coding + Balanced: Qwen3-Coder 30B-A3B, Qwen2.5-Coder 32B and Mistral Medium 3.5 are among the top choices rather than a small 8B model winning by default.

Exact Mac speed remains unknown in V1 because the tool does not yet ask for the Apple chip/tier.

## Representative current recommendations

These are regression observations, not claims that each model is objectively best in the wider ecosystem.

| Setup | Current #1 in the V1 spot-check |
| --- | --- |
| RTX 3060 12 GB · coding · Balanced | Qwen2.5-Coder 14B Q4_K_M |
| RTX 4070 12 GB · coding · Balanced | Qwen2.5-Coder 14B Q4_K_M |
| RTX 4060 Ti 16 GB · coding · Balanced | DeepSeek-Coder-V2-Lite-Instruct Q5_K_M |
| RTX 5070 Ti 16 GB · reasoning · Balanced | gpt-oss-20b Q4_K_M |
| RTX 4090 24 GB · coding · Balanced | Qwen3-Coder 30B-A3B Instruct Q4_K_M |
| RTX 5090 32 GB · reasoning · Strongest | DeepSeek-R1-Distill-Qwen-32B Q5_K_M |
| RTX 6000 Ada 48 GB · reasoning · Strongest | DeepSeek-R1-Distill-Qwen-32B Q8_0 |
| Mac 24 GB · coding · Balanced | Qwen2.5-Coder 14B Q5_K_M |
| Mac 32 GB · coding · Balanced | Qwen3-Coder 30B-A3B Instruct Q4_K_M |
| Mac 64 GB · reasoning · Balanced | DeepSeek-R1-Distill-Qwen-32B Q8_0 |

## Publisher-source coverage expanded during the check

The models that surfaced repeatedly were prioritized for direct publisher links and selected structured metadata in `dist/model-sources.js`, including Qwen coder models, DeepSeek reasoning/coder models, gpt-oss, LFM2.5, Gemma, Mistral Medium/Devstral, EXAONE and others.

Examples:

- Qwen3-Coder 30B-A3B: https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct
- Qwen2.5-Coder 14B: https://huggingface.co/Qwen/Qwen2.5-Coder-14B-Instruct
- DeepSeek-R1-0528-Qwen3-8B: https://huggingface.co/deepseek-ai/DeepSeek-R1-0528-Qwen3-8B
- DeepSeek-Coder-V2-Lite: https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct
- gpt-oss-20b: https://huggingface.co/openai/gpt-oss-20b
- LFM2.5-8B-A1B: https://huggingface.co/LiquidAI/LFM2.5-8B-A1B
- Mistral Medium 3.5: https://huggingface.co/mistralai/Mistral-Medium-3.5-128B

## Residual V1 limitations

The spot-check did **not** turn the prototype task rubric into benchmark-grade data. Remaining limitations include:

- task-fit inputs are still mostly hand-curated planning scores;
- GPU speed is a bandwidth/model-size proxy rather than backend-specific measured throughput;
- AMD and Intel real-world software/backend differences are not represented by the speed equation;
- Mac speed is not estimated without exact chip information;
- very capable large models can saturate the internal task score at 100, producing legitimate ties in the current ranking;
- quantization quality effects are simplified;
- context/KV-cache requirements are approximate;
- runtime compatibility is not yet a full structured filter.

The public UI therefore uses broad task-fit labels and labels speed as rough rather than exposing these inputs as benchmark facts.

## V1 release conclusion

The 20-scenario pass found and fixed two engine-policy problems and one evidence/data ordering problem. No remaining case in this set fails the basic memory-fit sanity check or exposes an obvious ranking-policy contradiction.

For V1, the primary remaining risk is **data calibration and real measured performance**, not the basic fit/ranking mechanics. Future V1.x work should replace prototype inputs with sourced benchmark/runtime records rather than adding more ranking complexity.
