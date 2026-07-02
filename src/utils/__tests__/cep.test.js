import { formatarCEP, buscarCEP } from '../cep'

describe('formatarCEP', () => {
  test('formata com hifen depois de 5 digitos', () => {
    expect(formatarCEP('87013000')).toBe('87013-000')
  })
  test('nao adiciona hifen antes de 5 digitos', () => {
    expect(formatarCEP('8701')).toBe('8701')
  })
  test('ignora caracteres nao numericos e limita a 8 digitos', () => {
    expect(formatarCEP('87.013-000extra')).toBe('87013-000')
  })
})

describe('buscarCEP', () => {
  afterEach(() => {
    global.fetch = undefined
  })

  test('retorna endereco em caso de sucesso', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({
        logradouro: 'Rua Tal', bairro: 'Centro', localidade: 'Maringá', uf: 'PR',
      }),
    })
    const r = await buscarCEP('87013-000')
    expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/87013000/json/')
    expect(r).toEqual({ endereco: 'Rua Tal', bairro: 'Centro', cidade: 'Maringá', estado: 'PR' })
  })

  test('retorna null quando CEP nao existe (viaCEP retorna erro:true)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ erro: true }),
    })
    const r = await buscarCEP('00000000')
    expect(r).toBeNull()
  })

  test('retorna null sem chamar fetch se CEP incompleto', async () => {
    global.fetch = jest.fn()
    const r = await buscarCEP('123')
    expect(r).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
