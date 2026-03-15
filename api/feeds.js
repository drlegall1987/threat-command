// Vercel Serverless Function — proxies public threat intel feeds
// Fetches real IoC counts + geolocates IPs to countries

const FEEDS = [
  { id: 'cinsscore', name: 'CINSscore.com - ci-badguys', url: 'https://cinsscore.com/list/ci-badguys.txt', type: 'text' },
  { id: 'spamhausdrop', name: 'Spamhaus - DROP List', url: 'https://www.spamhaus.org/drop/drop.txt', type: 'text' },
  { id: 'spamhausedrop', name: 'Spamhaus - Extended DROP', url: 'https://www.spamhaus.org/drop/edrop.txt', type: 'text' },
  { id: 'greensnow', name: 'GreenSnow.co - Blocklist', url: 'https://blocklist.greensnow.co/greensnow.txt', type: 'text' },
  { id: 'threatfox', name: 'ThreatFox OSINT', url: 'https://threatfox.abuse.ch/export/csv/recent/', type: 'csv' },
  { id: 'feodotracker', name: 'Feodo Tracker - Botnet C2', url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt', type: 'text' },
  { id: 'sslbl', name: 'SSL Blacklist', url: 'https://sslbl.abuse.ch/blacklist/sslipblacklist.txt', type: 'text' },
  { id: 'urlhaus', name: 'URLhaus - Malicious URLs', url: 'https://urlhaus.abuse.ch/downloads/text_recent/', type: 'text' },
  { id: 'bruteforcer', name: 'BruteForcer IP Blocklist', url: 'https://danger.rulez.sk/projects/bruteforceblocker/blist.php', type: 'text' },
  { id: 'etcc', name: 'Emerging Threats C&C', url: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt', type: 'text' },
]

async function fetchFeed(feed) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ThreatDashboard/1.0' },
    })
    clearTimeout(timeout)

    if (!res.ok) return { id: feed.id, name: feed.name, count: null, status: 'error', error: res.status }

    const text = await res.text()
    const lines = text.split('\n').filter(l => {
      const trimmed = l.trim()
      return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith(';') && !trimmed.startsWith('//')
    })

    // Extract sample IPs from the feed
    const ips = []
    for (const line of lines.slice(0, 500)) {
      const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
      if (match && !ips.includes(match[1])) ips.push(match[1])
      if (ips.length >= 100) break
    }

    return {
      id: feed.id,
      name: feed.name,
      count: lines.length,
      sampleIPs: ips,
      status: 'active',
      lastSync: new Date().toISOString(),
    }
  } catch (err) {
    return { id: feed.id, name: feed.name, count: null, status: 'error', error: err.message }
  }
}

// Batch geolocate IPs using ip-api.com (free, up to 100 per batch, 45 req/min)
async function geolocateIPs(ips) {
  if (!ips.length) return []
  try {
    const batch = ips.slice(0, 100).map(ip => ({ query: ip, fields: 'query,countryCode,country,lat,lon,status' }))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch('http://ip-api.com/batch?fields=query,countryCode,country,lat,lon,status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const results = await res.json()
    return results
      .filter(r => r.status === 'success')
      .map(r => ({
        ip: r.query,
        countryCode: r.countryCode,
        country: r.country,
        lat: r.lat,
        lon: r.lon,
      }))
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed))
    const feeds = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error' })

    // Collect unique IPs across all feeds for geolocation
    const allIPs = new Set()
    feeds.forEach(f => {
      if (f.sampleIPs) f.sampleIPs.forEach(ip => allIPs.add(ip))
    })
    const uniqueIPs = [...allIPs].slice(0, 100)

    // Geolocate IPs to get country breakdown
    const geoResults = await geolocateIPs(uniqueIPs)

    // Build country breakdown with counts and IPs
    const countryMap = {}
    geoResults.forEach(g => {
      if (!countryMap[g.countryCode]) {
        countryMap[g.countryCode] = {
          code: g.countryCode,
          name: g.country,
          lat: g.lat,
          lon: g.lon,
          count: 0,
          ips: [],
        }
      }
      countryMap[g.countryCode].count++
      countryMap[g.countryCode].ips.push(g.ip)
    })
    const countryBreakdown = Object.values(countryMap).sort((a, b) => b.count - a.count)

    // Tag each feed with its country breakdown
    const feedsWithGeo = feeds.map(f => {
      if (!f.sampleIPs) return f
      const feedCountries = {}
      f.sampleIPs.forEach(ip => {
        const geo = geoResults.find(g => g.ip === ip)
        if (geo) {
          if (!feedCountries[geo.countryCode]) {
            feedCountries[geo.countryCode] = { code: geo.countryCode, name: geo.country, count: 0 }
          }
          feedCountries[geo.countryCode].count++
        }
      })
      return {
        ...f,
        countries: Object.values(feedCountries).sort((a, b) => b.count - a.count),
      }
    })

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      feeds: feedsWithGeo,
      totalIoCs: feeds.reduce((sum, f) => sum + (f.count || 0), 0),
      countryBreakdown,
      geolocatedIPs: geoResults,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch feeds' })
  }
}
