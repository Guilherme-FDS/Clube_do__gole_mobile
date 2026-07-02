import { validarSenha } from '../validarSenha'

describe('validarSenha', () => {
  test('rejeita senha curta', () => {
    expect(validarSenha('Ab1')).toBe('A senha deve ter no mínimo 8 caracteres.')
  })
  test('rejeita sem maiúscula', () => {
    expect(validarSenha('abcdefg1')).toBe('A senha deve conter ao menos uma letra maiúscula.')
  })
  test('rejeita sem minúscula', () => {
    expect(validarSenha('ABCDEFG1')).toBe('A senha deve conter ao menos uma letra minúscula.')
  })
  test('rejeita sem número', () => {
    expect(validarSenha('Abcdefgh')).toBe('A senha deve conter ao menos um número.')
  })
  test('aceita senha forte', () => {
    expect(validarSenha('Abcdefg1')).toBeNull()
  })
  test('rejeita vazio/null', () => {
    expect(validarSenha('')).toBe('A senha deve ter no mínimo 8 caracteres.')
    expect(validarSenha(null)).toBe('A senha deve ter no mínimo 8 caracteres.')
  })
})
