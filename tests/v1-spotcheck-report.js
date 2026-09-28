import assert from 'node:assert/strict';
import { GPUs } from '../dist/data.js';
import { recommend } from '../dist/recommend.js';

const gpu = (query, vramGB = null) => {
  const q = query.toLowerCase();
  const matches = GPUs.filter(card => card.name.toLowerCase().includes(q));
  const card = vramGB == null ? matches[0] : matches.find(item => item.vramGB === vramGB);
  assert.ok(card, `GPU not found for ${query}${vramGB ? ` ${vramGB} GB` : ''}`);
  return card;
};

const gpuScenario = (name, query, task, preference = 3, vramGB = null) => {
  const card = gpu(query, vramGB);
  return {
    name,
    hardware: {
      mode: 'gpu',
      vramGB: card.vramGB,
      ramGB: card.vramGB >= 24 ? 64 : 32,
      bandwidthGBs: card.bandwidthGBs,
      speedKnown: true,
      deviceName: card.name
    },
    task,
    preference
  };
};

const macScenario = (ramGB, task, preference = 3) => ({
  name: `Mac ${ramGB} GB · ${task} · ${preference === 1 ? 'fastest' : preference === 5 ? 'strongest' : 'balanced'}`,
  hardware: {
    mode: 'mac',
    ramGB,
    vramGB: Math.max(2, Math.floor(ramGB * 0.8 - 1)),
    speedKnown: false,
    deviceName: `Mac with ${ramGB} GB memory`
  },
  task,
  preference
});

const scenarios = [
  gpuScenario('RTX 4060 8 GB · chat · balanced', 'RTX 4060', 'chat', 3, 8),
  gpuScenario('RTX 4060 8 GB · coding · balanced', 'RTX 4060', 'coding', 3, 8),
  gpuScenario('RTX 3060 12 GB · coding · balanced', 'RTX 3060', 'coding', 3, 12),
  gpuScenario('RTX 4070 12 GB · coding · balanced', 'RTX 4070', 'coding', 3, 12),
  gpuScenario('RTX 4060 Ti 16 GB · coding · balanced', 'RTX 4060 Ti', 'coding', 3, 16),
  gpuScenario('RTX 5070 Ti 16 GB · reasoning · balanced', 'RTX 5070 Ti', 'reasoning', 3, 16),
  gpuScenario('RTX 4080 SUPER 16 GB · chat · strongest', 'RTX 4080 SUPER', 'chat', 5, 16),
  gpuScenario('RX 7800 XT 16 GB · chat · balanced', 'RX 7800 XT', 'chat', 3, 16),
  gpuScenario('RX 7900 XTX 24 GB · reasoning · balanced', 'RX 7900 XTX', 'reasoning', 3, 24),
  gpuScenario('Arc B580 12 GB · chat · balanced', 'Arc B580', 'chat', 3, 12),
  gpuScenario('RTX 4090 24 GB · coding · balanced', 'RTX 4090', 'coding', 3, 24),
  gpuScenario('RTX 5090 32 GB · reasoning · strongest', 'RTX 5090', 'reasoning', 5, 32),
  gpuScenario('RTX 6000 Ada 48 GB · reasoning · strongest', 'RTX 6000 Ada', 'reasoning', 5, 48),
  macScenario(16, 'chat', 3),
  macScenario(24, 'coding', 3),
  macScenario(32, 'coding', 3),
  macScenario(64, 'reasoning', 3),
  macScenario(128, 'coding', 5),
  macScenario(192, 'chat', 5),
  macScenario(512, 'coding', 3)
];

const lines = [];
for (const scenario of scenarios) {
  const result = recommend({
    hardware: scenario.hardware,
    useCases: [scenario.task],
    primaryUse: scenario.task,
    preference: scenario.preference,
    minSpeed: scenario.hardware.speedKnown ? 15 : 15,
    contextK: 8,
    quantization: 'auto',
    maxWeightsGB: null,
    family: null
  });
  assert.ok(result.matches.length || result.catalog.length, `${scenario.name} should have at least one viable model`);
  const top = (result.matches.length ? result.matches : result.catalog).slice(0, 3);
  for (const item of top) {
    assert.ok(item.requiredGB + item.reserveGB <= scenario.hardware.vramGB + 1e-9, `${scenario.name}: ${item.model.name} must fit memory`);
  }
  lines.push(`\n${scenario.name}`);
  top.forEach((item, i) => {
    const speed = scenario.hardware.speedKnown ? `${item.speedLow}–${item.speedHigh} tok/s` : 'speed unknown';
    lines.push(`  ${i + 1}. ${item.model.name} · ${item.quant.name} · ${item.requiredGB.toFixed(1)} GB · ${speed} · fit ${item.quality.toFixed(1)} · rank ${item.rank.toFixed(3)}`);
  });
}

console.log(`V1 real-world spot-check report (${scenarios.length} scenarios):${lines.join('\n')}`);
