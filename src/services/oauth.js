// IDs públicos (mesmos do site — visíveis em qualquer bundle web). O secret fica só no backend.
const GOOGLE_CLIENT_ID = '465037215980-thmlbjcja9f3eob73b305kfv3q0a8om1.apps.googleusercontent.com'
const GOOGLE_REDIRECT_URI = 'https://clube-do-gole-frontend.onrender.com/auth/google/callback'
const FACEBOOK_APP_ID = '1400421088511853'
const FACEBOOK_REDIRECT_URI = 'https://clube-do-gole-frontend.onrender.com/auth/facebook/callback'

// Monta query manualmente: URLSearchParams tem suporte incompleto no Hermes.
function query(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
}

// O state "mobile|<returnUrl>" faz o OAuthCallback.vue do site devolver o code pro app
// em vez de processar o login no navegador.
export function buildGoogleAuthUrl(returnUrl) {
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + query({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: `mobile|${returnUrl}`,
  })
}

export function buildFacebookAuthUrl(returnUrl) {
  return 'https://www.facebook.com/v19.0/dialog/oauth?' + query({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    response_type: 'code',
    scope: 'email,public_profile',
    state: `mobile|${returnUrl}`,
  })
}

export function extrairCode(url) {
  const m = /[?&]code=([^&#]+)/.exec(url || '')
  return m ? decodeURIComponent(m[1]) : null
}
