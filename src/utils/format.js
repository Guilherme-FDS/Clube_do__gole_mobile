export function formatarMoeda(valor) {
  const n = Number(valor || 0)
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
