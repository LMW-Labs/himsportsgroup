import { GoogleAuth } from 'google-auth-library'

let auth

function getAuth() {
  if (!auth) {
    auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })
  }
  return auth
}

export async function searchImages(playerName, school) {
  try {
    const client = await getAuth().getClient()
    const { token } = await client.getAccessToken()

    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('cx', process.env.GOOGLE_CSE_ID)
    url.searchParams.set('q', `${playerName} ${school} basketball player`)
    url.searchParams.set('searchType', 'image')
    url.searchParams.set('num', '2')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      console.error('Image search failed:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    return (data.items || []).map(item => item.link)
  } catch (err) {
    console.error('Image search error:', err.message)
    return []
  }
}
