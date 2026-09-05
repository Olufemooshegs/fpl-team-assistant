export const config = {
  runtime: 'edge',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'cache-control': status === 200 ? 'public, s-maxage=1800, stale-while-revalidate=86400' : 'no-cache',
    },
  })
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
      },
    })
  }

  const url = new URL(req.url)
  // Normalize route path
  const routePath = url.pathname.replace(/^\/api\/fpl\/?/, '').replace(/\/$/, '')

  try {
    let targetUrl = ''
    if (routePath === 'bootstrap') {
      targetUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/'
    } else if (routePath === 'fixtures') {
      targetUrl = 'https://fantasy.premierleague.com/api/fixtures/'
    } else if (/^player\/\d+$/.test(routePath)) {
      const id = routePath.split('/')[1]
      targetUrl = `https://fantasy.premierleague.com/api/element-summary/${id}/`
    } else if (/^team\/\d+\/\d+$/.test(routePath)) {
      const parts = routePath.split('/')
      targetUrl = `https://fantasy.premierleague.com/api/entry/${parts[1]}/event/${parts[2]}/picks/`
    } else {
      return jsonResponse({ error: 'Unknown FPL API route: ' + routePath }, 404)
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fantasy.premierleague.com/',
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return jsonResponse({ error: 'FPL entry or event not found' }, 404)
      }
      return jsonResponse({ error: `FPL upstream returned status ${res.status}` }, res.status)
    }

    const data = await res.json()
    return jsonResponse(data, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 502)
  }
}
