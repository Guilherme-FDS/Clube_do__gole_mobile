export function limitesNascimento() {
  const hoje = new Date()
  return {
    min: new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate()),
    max: new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate()),
  }
}

const pad = (n) => String(n).padStart(2, '0')

export function dataParaISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dataParaBR(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
