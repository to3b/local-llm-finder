// Model IDs have their own hash parameter. `m` remains Mac / system memory.
export function modelPrefill(hash,models) {
  const p=new URLSearchParams(String(hash).replace(/^#/,''));
  const model=models.find(m=>m.id===p.get('model'));
  if(!model)return null;
  const proposed=p.get('cq') || p.get('q') || 'auto';
  const quant=['auto','Q4_K_M','Q5_K_M','Q8_0'].includes(proposed)?proposed:'auto';
  return {model,quant};
}
