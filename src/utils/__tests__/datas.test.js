import { limitesNascimento, dataParaISO, dataParaBR } from '../datas'

describe('limitesNascimento', () => {
  test('max é hoje menos 18 anos, min é hoje menos 120', () => {
    const hoje = new Date()
    const { min, max } = limitesNascimento()
    expect(max.getFullYear()).toBe(hoje.getFullYear() - 18)
    expect(max.getMonth()).toBe(hoje.getMonth())
    expect(min.getFullYear()).toBe(hoje.getFullYear() - 120)
  })
})

describe('conversões', () => {
  const d = new Date(1990, 4, 7) // 7 de maio de 1990 (mês 4 = maio)
  test('dataParaISO', () => {
    expect(dataParaISO(d)).toBe('1990-05-07')
  })
  test('dataParaBR', () => {
    expect(dataParaBR(d)).toBe('07/05/1990')
  })
})
