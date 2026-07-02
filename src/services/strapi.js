import axios from 'axios'

export const STRAPI_URL = 'https://clube-do-gole-strapi.onrender.com'

const strapiApi = axios.create({ baseURL: `${STRAPI_URL}/api` })

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map()

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

async function get(path, params = {}) {
  const key = path + JSON.stringify(params)
  const cached = getCached(key)
  if (cached) return cached
  const { data } = await strapiApi.get(path, { params: { populate: '*', ...params } })
  const resultado = data?.data ?? []
  cache.set(key, { data: resultado, timestamp: Date.now() })
  return resultado
}

export const getFaqs = () => get('/faqs', { filters: { ativo: true }, sort: 'ordem:asc' })
export const getPosts = (params = {}) => get('/posts', { sort: 'publicado_em:desc', ...params })
export const getPost = (slug) => get('/posts', { filters: { slug } })
export const getPagina = (slug) => get('/paginas', { filters: { slug } })
