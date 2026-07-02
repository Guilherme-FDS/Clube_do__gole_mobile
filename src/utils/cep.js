export function formatarCEP(text) {
  const nums = text.replace(/\D/g, '').slice(0, 8)
  if (nums.length <= 5) return nums
  return `${nums.slice(0, 5)}-${nums.slice(5)}`
}

export async function buscarCEP(cep) {
  const nums = cep.replace(/\D/g, '')
  if (nums.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`)
  const data = await res.json()
  if (data.erro) return null
  return {
    endereco: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
  }
}
