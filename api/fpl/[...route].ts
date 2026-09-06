export const config = {
  runtime: "edge",
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "cache-control":
        status === 200
          ? "public, s-maxage=1800, stale-while-revalidate=86400"
          : "no-cache",
    },
  })
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
      },
    })
  }

  const url = new URL(req.url)
  // Normalize route path
  const routePath = url.pathname
    .replace(/^\/api\/fpl\/?/, "")
    .replace(/\/$/, "")

  try {
    let targetUrl = ""
    if (routePath === "bootstrap") {
      targetUrl = "https://fantasy.premierleague.com/api/bootstrap-static/"
    } else if (routePath === "fixtures") {
      targetUrl = "https://fantasy.premierleague.com/api/fixtures/"
    } else if (/^player\/\d+$/.test(routePath)) {
      const id = routePath.split("/")[1]
      targetUrl = `https://fantasy.premierleague.com/api/element-summary/${id}/`
    } else if (/^team\/\d+\/\d+$/.test(routePath)) {
      const parts = routePath.split("/")
      targetUrl = `https://fantasy.premierleague.com/api/entry/${parts[1]}/event/${parts[2]}/picks/`
    } else {
      return jsonResponse({ error: "Unknown FPL API route: " + routePath }, 404)
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://fantasy.premierleague.com/",
        Origin: "https://fantasy.premierleague.com",
        "Sec-Ch-Ua":
          '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return jsonResponse({ error: "FPL entry or event not found" }, 404)
      }
      return jsonResponse(
        { error: `FPL upstream returned status ${res.status}` },
        res.status,
      )
    }

    const data = await res.json()
    return jsonResponse(data, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return jsonResponse({ error: message }, 502)
  }
}
