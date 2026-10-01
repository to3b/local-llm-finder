export function speedAvailability(hardware) {
  if (hardware.customMemory) return 'Speed disabled by memory override';
  if (hardware.mode === 'mac') return 'Mac speed not estimated';
  if (hardware.mode === 'unsure') return 'CPU speed not estimated';
  return 'Choose a graphics card for speed estimates';
}
