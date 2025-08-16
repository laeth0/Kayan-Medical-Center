

export function norm(arr = []) {
  return [...new Set(arr.map(r => String(r).toLowerCase()))].sort();
}
