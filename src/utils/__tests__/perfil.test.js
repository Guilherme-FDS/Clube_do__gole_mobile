import { payloadComCpf } from '../perfil'

describe('payloadComCpf', () => {
  test('inclui cpf quando não havia cpf original e um novo foi informado', () => {
    const payloadBase = { nome: 'Ana', sobrenome: 'Silva' }
    const resultado = payloadComCpf(payloadBase, '', '12345678900')
    expect(resultado).toEqual({ nome: 'Ana', sobrenome: 'Silva', cpf: '12345678900' })
  })

  test('não inclui cpf quando já havia cpf original (CPF travado)', () => {
    const payloadBase = { nome: 'Ana', sobrenome: 'Silva' }
    const resultado = payloadComCpf(payloadBase, '12345678900', '00000000000')
    expect(resultado).toEqual({ nome: 'Ana', sobrenome: 'Silva' })
    expect('cpf' in resultado).toBe(false)
  })

  test('não inclui cpf quando não há original nem novo cpf informado', () => {
    const payloadBase = { nome: 'Ana', sobrenome: 'Silva' }
    const resultado = payloadComCpf(payloadBase, '', '')
    expect(resultado).toEqual({ nome: 'Ana', sobrenome: 'Silva' })
    expect('cpf' in resultado).toBe(false)
  })
})
