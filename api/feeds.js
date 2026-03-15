// Vercel Serverless Function — proxies public threat intel feeds
// Fetches real IoC counts from open source blocklists

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

    // Extract sample IPs from the feed for the globe
    const ips = []
    for (const line of lines.slice(0, 200)) {
      const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
      if (match) ips.push(match[1])
    }

    return {
      id: feed.id,
      name: feed.name,
      count: lines.length,
      sampleIPs: ips.slice(0, 50),
      status: 'active',
      lastSync: new Date().toISOString(),
    }
  } catch (err) {
    return { id: feed.id, name: feed.name, count: null, status: 'error', error: err.message }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed))
    const feeds = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error' })

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      feeds,
      totalIoCs: feeds.reduce((sum, f) => sum + (f.count || 0), 0),
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch feeds' })
  }
}
