export const toggleArrayValue = (arr, value) => {
  const list = Array.isArray(arr) ? arr : []
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}
