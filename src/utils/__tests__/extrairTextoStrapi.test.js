import { extrairTextoStrapi } from '../extrairTextoStrapi'

describe('extrairTextoStrapi', () => {
  test('concatena texto de children simples', () => {
    expect(extrairTextoStrapi([{ text: 'Olá ' }, { text: 'mundo' }])).toBe('Olá mundo')
  })
  test('retorna string vazia para array vazio', () => {
    expect(extrairTextoStrapi([])).toBe('')
  })
  test('retorna string vazia para undefined', () => {
    expect(extrairTextoStrapi(undefined)).toBe('')
  })
  test('ignora children sem propriedade text', () => {
    expect(extrairTextoStrapi([{ text: 'a' }, {}, { text: 'b' }])).toBe('ab')
  })
})
