import { buildGoogleAuthUrl, buildFacebookAuthUrl, extrairCode } from '../oauth'

const RETURN_URL = 'exp://192.168.0.10:8081/--/oauth'

describe('buildGoogleAuthUrl', () => {
  const url = buildGoogleAuthUrl(RETURN_URL)
  test('aponta pro endpoint do Google com client_id e redirect do site', () => {
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth?')
    expect(url).toContain('client_id=465037215980-thmlbjcja9f3eob73b305kfv3q0a8om1.apps.googleusercontent.com')
    expect(url).toContain(encodeURIComponent('https://clube-do-gole-frontend.onrender.com/auth/google/callback'))
    expect(url).toContain('response_type=code')
  })
  test('inclui state mobile com returnUrl embutido', () => {
    expect(url).toContain(`state=${encodeURIComponent('mobile|' + RETURN_URL)}`)
  })
})

describe('buildFacebookAuthUrl', () => {
  const url = buildFacebookAuthUrl(RETURN_URL)
  test('aponta pro dialog do Facebook com app_id e redirect do site', () => {
    expect(url).toContain('https://www.facebook.com/v19.0/dialog/oauth?')
    expect(url).toContain('client_id=1400421088511853')
    expect(url).toContain(encodeURIComponent('https://clube-do-gole-frontend.onrender.com/auth/facebook/callback'))
    expect(url).toContain(`state=${encodeURIComponent('mobile|' + RETURN_URL)}`)
  })
})

describe('extrairCode', () => {
  test('extrai code de URL de retorno', () => {
    expect(extrairCode('exp://192.168.0.10:8081/--/oauth?code=abc123&provider=google')).toBe('abc123')
  })
  test('decodifica code percent-encoded', () => {
    expect(extrairCode('exp://x/--/oauth?code=4%2F0AbC')).toBe('4/0AbC')
  })
  test('retorna null sem code', () => {
    expect(extrairCode('exp://x/--/oauth?error=access_denied')).toBeNull()
  })
})
