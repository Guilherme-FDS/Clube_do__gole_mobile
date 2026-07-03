// CPF trava após o primeiro cadastro (mesma regra do backend): só enviamos
// o campo `cpf` no payload de atualização se o usuário ainda não tinha um
// CPF salvo e informou um novo valor.
export function payloadComCpf(payloadBase, cpfOriginal, cpfNovo) {
  const payload = { ...payloadBase }
  if (!cpfOriginal && cpfNovo) {
    payload.cpf = cpfNovo
  }
  return payload
}
