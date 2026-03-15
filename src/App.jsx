import { useState, useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const FONTS = {
  sans: "Poppins, 'Poppins Fallback', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'IBM Plex Mono Fallback', 'SF Mono', monospace",
}

const BRAND = {
  blue: '#2563eb',
  navy: '#111827',
}

const LIGHT = {
  bg: '#ffffff',
  surface: '#f8fafc',
  surfaceHover: '#f1f5f9',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#60a5fa',
  primaryBg: '#dbeafe',
  critical: '#dc2626',
  criticalBg: '#fef2f2',
  high: '#d97706',
  highBg: '#fffbeb',
  medium: '#ca8a04',
  mediumBg: '#fefce8',
  low: '#16a34a',
  lowBg: '#f0fdf4',
  info: '#2563eb',
  infoBg: '#eff6ff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderHover: '#cbd5e1',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowLg: '0 10px 25px rgba(0,0,0,0.08)',
  headerBg: 'rgba(255,255,255,0.9)',
  tableBg: '#ffffff',
  tableRowHover: '#f8fafc',
  tableHeader: '#f1f5f9',
  navText: '#334155',
  logoText: BRAND.navy,
}

const DARK = {
  bg: '#020617',
  surface: '#0f172a',
  surfaceHover: '#1e293b',
  primary: '#3b82f6',
  primaryHover: '#60a5fa',
  primaryLight: '#60a5fa',
  primaryBg: '#1e3a5f',
  critical: '#ef4444',
  criticalBg: '#450a0a',
  high: '#f59e0b',
  highBg: '#451a03',
  medium: '#eab308',
  mediumBg: '#422006',
  low: '#22c55e',
  lowBg: '#052e16',
  info: '#60a5fa',
  infoBg: '#1e3a5f',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#1e293b',
  borderHover: '#334155',
  shadow: '0 1px 3px rgba(0,0,0,0.3)',
  shadowLg: '0 10px 25px rgba(0,0,0,0.4)',
  headerBg: 'rgba(2,6,23,0.9)',
  tableBg: '#0f172a',
  tableRowHover: '#1e293b',
  tableHeader: '#1e293b',
  navText: '#cbd5e1',
  logoText: '#ffffff',
}

const SEVERITY_KEYS = ['critical', 'high', 'medium', 'low', 'info']

const ATTACK_TYPES = [
  'Brute Force SSH', 'Port Scan', 'SQL Injection', 'XSS Attempt', 'DDoS SYN Flood',
  'Malware C2 Beacon', 'Phishing Link', 'DNS Tunneling', 'RDP Exploit', 'Log4j Probe',
  'SMB Exploit', 'Credential Stuffing', 'IoT Botnet Scan', 'Meraki VPN Probe', 'FortiGate IPS Alert',
]

const COUNTRIES = [
  { code: 'US', name: 'United States', lat: 39.8, lon: -98.5 },
  { code: 'CN', name: 'China', lat: 35.8, lon: 104.1 },
  { code: 'RU', name: 'Russia', lat: 61.5, lon: 105.3 },
  { code: 'DE', name: 'Germany', lat: 51.1, lon: 10.4 },
  { code: 'BR', name: 'Brazil', lat: -14.2, lon: -51.9 },
  { code: 'IN', name: 'India', lat: 20.5, lon: 78.9 },
  { code: 'KR', name: 'South Korea', lat: 35.9, lon: 127.7 },
  { code: 'NL', name: 'Netherlands', lat: 52.1, lon: 5.2 },
  { code: 'FR', name: 'France', lat: 46.2, lon: 2.2 },
  { code: 'GB', name: 'United Kingdom', lat: 55.3, lon: -3.4 },
  { code: 'UA', name: 'Ukraine', lat: 48.3, lon: 31.1 },
  { code: 'IR', name: 'Iran', lat: 32.4, lon: 53.6 },
  { code: 'VN', name: 'Vietnam', lat: 14.0, lon: 108.2 },
  { code: 'JP', name: 'Japan', lat: 36.2, lon: 138.2 },
  { code: 'ID', name: 'Indonesia', lat: -0.7, lon: 113.9 },
  { code: 'PK', name: 'Pakistan', lat: 30.3, lon: 69.3 },
  { code: 'TW', name: 'Taiwan', lat: 23.6, lon: 120.9 },
  { code: 'TH', name: 'Thailand', lat: 15.8, lon: 100.9 },
  { code: 'TR', name: 'Turkey', lat: 38.9, lon: 35.2 },
  { code: 'RO', name: 'Romania', lat: 45.9, lon: 24.9 },
  { code: 'NG', name: 'Nigeria', lat: 9.0, lon: 8.6 },
  { code: 'PH', name: 'Philippines', lat: 12.8, lon: 121.7 },
  { code: 'AR', name: 'Argentina', lat: -38.4, lon: -63.6 },
  { code: 'EG', name: 'Egypt', lat: 26.8, lon: 30.8 },
  { code: 'MX', name: 'Mexico', lat: 23.6, lon: -102.5 },
]

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'DNS', 'SMTP', 'FTP', 'RDP', 'SMB', 'SNMP', 'MQTT', 'MODBUS', 'TLS']

const DETECTION_SOURCES = ['Wazuh SIEM', 'T-Pot Honeypot', 'FortiGate IPS', 'Meraki Firewall', 'Suricata IDS', 'Threat Feed', 'Synology Logs']

const TABS = ['Overview', 'Threat Events', 'Honeypot', 'Intel Feeds']

// Updated feeds to match the screenshot - best open source threat intel feeds
const FEEDS = [
  { id: 'cinsscore', name: 'CINSscore.com - ci-badguys', url: 'https://cinsscore.com/list/ci-badguys.txt', type: 'IP Reputation', category: 'ip' },
  { id: 'talos', name: 'Cisco Talos - IP Blacklist', url: 'https://talosintelligence.com/reputation_center', type: 'IP/Domain Rep', category: 'ip' },
  { id: 'torexits', name: 'Dan.me.uk - TOR Exit Nodes', url: 'https://www.dan.me.uk/torlist/', type: 'TOR Exit Nodes', category: 'ip' },
  { id: 'etcc', name: 'Emerging Threats C&C Server', url: 'https://rules.emergingthreats.net/open/suricata/rules/', type: 'C&C Rules', category: 'c2' },
  { id: 'greensnow', name: 'GreenSnow.co - Blocklist', url: 'https://blocklist.greensnow.co/greensnow.txt', type: 'IP Blocklist', category: 'ip' },
  { id: 'haleys', name: "Haley's Brute Force IPs", url: 'https://charles.the-haleys.org/ssh_dico_attack_hdeny_format.php/hostsdeny.txt', type: 'Brute Force IPs', category: 'ip' },
  { id: 'iscdaily', name: 'ISC - Daily Suspicious Domains', url: 'https://isc.sans.edu/feeds/suspiciousdomains_Low.txt', type: 'Suspicious Domains', category: 'ioc' },
  { id: 'iscdshield', name: 'ISC - DShield Scanning IPs', url: 'https://isc.sans.edu/api/topips/records/20?json', type: 'Scanning IPs', category: 'ip' },
  { id: 'isctopips', name: 'ISC - Top Attacking IPs', url: 'https://isc.sans.edu/api/topips/records/100?json', type: 'Top Attackers', category: 'ip' },
  { id: 'honeypot', name: 'Project Honeypot', url: 'https://www.projecthoneypot.org/', type: 'Honeypot Intel', category: 'ip' },
  { id: 'thaicert', name: 'ThaiCERT', url: 'https://apt.thaicert.or.th/cgi-bin/listgroups.cgi', type: 'APT Groups', category: 'advisory' },
  { id: 'spamhausdrop', name: 'Spamhaus - DROP List', url: 'https://www.spamhaus.org/drop/drop.txt', type: 'IP Blocklist', category: 'ip' },
  { id: 'spamhausedrop', name: 'Spamhaus - Extended DROP', url: 'https://www.spamhaus.org/drop/edrop.txt', type: 'Extended Blocklist', category: 'ip' },
  { id: 'threatfox', name: 'ThreatFox OSINT', url: 'https://threatfox-api.abuse.ch/api/v1/', type: 'Malware IoCs', category: 'malware' },
  { id: 'bruteforcer', name: 'BruteForcer IP Blocklist', url: 'https://danger.rulez.sk/projects/bruteforceblocker/', type: 'Brute Force IPs', category: 'ip' },
  { id: 'voipbl', name: 'VoIPBL.org - VoIP Blacklist', url: 'http://www.voipbl.org/update/', type: 'VoIP Abuse', category: 'ip' },
]

const CATEGORY_COLORS = {
  malware: '#dc2626', c2: '#ea580c', phishing: '#9333ea', ip: '#2563eb',
  ioc: '#ca8a04', certificates: '#16a34a', rules: '#0284c7', advisory: '#d97706',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function randomIP() {
  const first = pick([1, 2, 5, 8, 12, 14, 23, 31, 37, 41, 45, 49, 58, 61, 72, 77, 82, 91, 93, 101, 103, 104, 109, 112, 115, 118, 121, 128, 131, 134, 138, 141, 143, 147, 151, 154, 156, 158, 161, 163, 171, 175, 178, 182, 185, 188, 191, 193, 195, 198, 199, 200, 201, 202, 203, 205, 206, 207, 208, 209, 210, 211, 212, 213, 216, 217, 218, 219, 220, 221, 222, 223])
  return `${first}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`
}

function randomPrivateIP() {
  return `192.168.${rand(1, 10)}.${rand(1, 254)}`
}

function pickSeverity() {
  const r = Math.random()
  if (r < 0.05) return 'critical'
  if (r < 0.20) return 'high'
  if (r < 0.55) return 'medium'
  if (r < 0.85) return 'low'
  return 'info'
}

function generateEvent(id) {
  const country = pick(COUNTRIES)
  const severity = pickSeverity()
  return {
    id,
    time: new Date(Date.now() - rand(0, 300000)),
    severity,
    attackType: pick(ATTACK_TYPES),
    srcIP: randomIP(),
    dstIP: randomPrivateIP(),
    country: country.code,
    countryName: country.name,
    lat: country.lat + (Math.random() - 0.5) * 5,
    lon: country.lon + (Math.random() - 0.5) * 5,
    protocol: pick(PROTOCOLS),
    port: pick([22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 1433, 1883, 3306, 3389, 5060, 5432, 5900, 6379, 8080, 8443, 8888, 9200, 27017, 44818, 47808, 502]),
    source: pick(DETECTION_SOURCES),
    confidence: rand(40, 99),
    mitre: `T${rand(1000, 1999)}`,
    feed: pick(FEEDS).name,
  }
}

function generateInitialEvents(count) {
  const events = []
  for (let i = 0; i < count; i++) events.push(generateEvent(i))
  return events.sort((a, b) => b.time - a.time)
}

function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatUTC() {
  const now = new Date()
  return now.toISOString().slice(11, 19) + ' UTC'
}

// ─── LOGO SVG (exact from daniellegall.com) ─────────────────────────────────

function LogoIcon({ dark }) {
  return (
    <svg viewBox="0 0 2000 2000" width={40} height={40} style={{ display: 'block' }}>
      <polygon
        points="892.9,989.61 792.23,1212.63 580.92,1212.63 723.61,896.55 934.91,896.55"
        fill={BRAND.blue}
      />
      <path
        d="M1115.89,1196.06l-94.42,209.18h-316.2l86.95-192.61h241.28c22.19,0,43.34-3.37,63.24-9.55C1103.25,1201.07,1109.67,1198.71,1115.89,1196.06z"
        fill={dark ? '#ffffff' : BRAND.navy}
      />
      <path
        d="M1438.74,1000c0,41.73-6.38,82.34-18.26,120.46c-11.88,38.16-29.17,73.83-51.04,106.17c-43.66,64.6-105.33,115.88-178.2,146.7c-33.35,14.12-69.06,23.92-106.21,28.65l137.39-304.36c2.57-4.86,9.87-22.03,10.07-22.55c8.79-23.27,13.6-48.43,13.64-75.08c-0.04-22.23-3.37-43.38-9.55-63.28c-6.22-19.9-15.25-38.56-26.72-55.54c-22.95-33.99-55.62-61.07-93.66-77.16c-25.36-10.71-53.09-16.65-82.7-16.65H561.26l95.58-192.61h376.67c41.73,0,82.3,6.34,120.46,18.22c38.12,11.88,73.83,29.21,106.17,51.04c64.6,43.66,115.89,105.37,146.7,178.2C1427.39,890.78,1438.74,944.3,1438.74,1000z"
        fill={dark ? '#ffffff' : BRAND.navy}
      />
    </svg>
  )
}

// ─── SPARKLINE COMPONENT ────────────────────────────────────────────────────

function Sparkline({ data, color, width = 80, height = 28 }) {
  const ref = useRef()
  useEffect(() => {
    if (!ref.current || !data.length) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([2, width - 2])
    const y = d3.scaleLinear().domain([d3.min(data) * 0.9, d3.max(data) * 1.1]).range([height - 2, 2])
    const line = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveBasis)
    const area = d3.area().x((_, i) => x(i)).y0(height).y1(d => y(d)).curve(d3.curveBasis)
    svg.append('path').datum(data).attr('d', area).attr('fill', color).attr('opacity', 0.1)
    svg.append('path').datum(data).attr('d', line).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5)
  }, [data, color, width, height])
  return <svg ref={ref} width={width} height={height} />
}

// ─── GLOBE COMPONENT ────────────────────────────────────────────────────────

function Globe({ events, theme }) {
  const ref = useRef()
  const size = 360

  useEffect(() => {
    if (!ref.current) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const projection = d3.geoOrthographic()
      .scale(155)
      .translate([size / 2, size / 2])
      .rotate([-20, -20])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection)

    const defs = svg.append('defs')
    const radial = defs.append('radialGradient').attr('id', 'globe-glow')
    radial.append('stop').attr('offset', '0%').attr('stop-color', theme.primary).attr('stop-opacity', 0.12)
    radial.append('stop').attr('offset', '100%').attr('stop-color', theme.primary).attr('stop-opacity', 0)

    const filter = defs.append('filter').attr('id', 'dot-shadow')
    filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 2)

    svg.append('circle').attr('cx', size / 2).attr('cy', size / 2).attr('r', 165).attr('fill', 'url(#globe-glow)')

    svg.append('circle')
      .attr('cx', size / 2).attr('cy', size / 2).attr('r', 155)
      .attr('fill', theme.surface)
      .attr('stroke', theme.border)
      .attr('stroke-width', 1)

    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', theme.primary)
      .attr('stroke-opacity', 0.06)
      .attr('stroke-width', 0.5)

    const landRegions = [
      [-100, 45, 18], [-80, 25, 8], [-60, -15, 14], [-70, -35, 8],
      [0, 50, 12], [10, 45, 10], [25, 55, 8], [30, 0, 12], [20, 30, 6],
      [50, 25, 8], [75, 25, 12], [100, 35, 14], [105, 15, 8],
      [120, 35, 8], [135, -25, 12], [140, 38, 5],
    ]
    landRegions.forEach(([lon, lat, r]) => {
      const pos = projection([lon, lat])
      if (pos) {
        svg.append('circle')
          .attr('cx', pos[0]).attr('cy', pos[1]).attr('r', r)
          .attr('fill', theme.textMuted).attr('opacity', 0.15)
      }
    })

    const sevColorMap = { critical: theme.critical, high: theme.high, medium: theme.medium, low: theme.low, info: theme.info }
    const recentEvents = events.slice(0, 50)
    recentEvents.forEach((evt) => {
      const pos = projection([evt.lon, evt.lat])
      if (!pos) return
      const color = sevColorMap[evt.severity] || theme.primary
      svg.append('circle').attr('cx', pos[0]).attr('cy', pos[1]).attr('r', 3)
        .attr('fill', color).attr('opacity', 0.7).attr('filter', 'url(#dot-shadow)')
      svg.append('circle').attr('cx', pos[0]).attr('cy', pos[1]).attr('r', 6)
        .attr('fill', 'none').attr('stroke', color).attr('opacity', 0.3).attr('stroke-width', 0.5)
        .attr('class', 'pulse-ring')
    })
  }, [events, theme])

  return <svg ref={ref} width={size} height={size} style={{ display: 'block' }} />
}

// ─── BAR CHART COMPONENT ────────────────────────────────────────────────────

function AttackBarChart({ events, theme }) {
  const counts = useMemo(() => {
    const map = {}
    events.forEach(e => { map[e.attackType] = (map[e.attackType] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [events])

  const max = counts[0]?.[1] || 1

  return (
    <div>
      {counts.map(([type, count]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 140, fontSize: 12, color: theme.textSecondary, fontFamily: FONTS.sans, textAlign: 'right', flexShrink: 0 }}>{type}</div>
          <div style={{ flex: 1, height: 18, background: theme.surface, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${(count / max) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`,
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ width: 36, fontSize: 12, color: theme.textMuted, fontFamily: FONTS.mono, textAlign: 'right' }}>{count}</div>
        </div>
      ))}
    </div>
  )
}

// ─── REAL FEED FETCHING ─────────────────────────────────────────────────────

const LIVE_FEED_URLS = {
  cinsscore: 'https://cinsscore.com/list/ci-badguys.txt',
  spamhausdrop: 'https://www.spamhaus.org/drop/drop.txt',
  greensnow: 'https://blocklist.greensnow.co/greensnow.txt',
}

async function fetchFeedCounts() {
  const results = {}
  for (const [key, url] of Object.entries(LIVE_FEED_URLS)) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const text = await res.text()
        const lines = text.split('\n').filter(l => l.trim() && !l.startsWith(';') && !l.startsWith('#'))
        results[key] = lines.length
      }
    } catch {
      // Feed unavailable — use simulated count
    }
  }
  return results
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' } catch { return false }
  })
  const [tab, setTab] = useState(0)
  const [live, setLive] = useState(true)
  const [events, setEvents] = useState(() => generateInitialEvents(150))
  const [clock, setClock] = useState(formatUTC())
  const [sevFilter, setSevFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [feedCounts, setFeedCounts] = useState({})
  const nextId = useRef(150)

  const theme = dark ? DARK : LIGHT

  useEffect(() => {
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(formatUTC()), 1000)
    return () => clearInterval(t)
  }, [])

  // Try to fetch real feed data on mount
  useEffect(() => {
    fetchFeedCounts().then(setFeedCounts)
  }, [])

  // Live event generation
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => {
      setEvents(prev => {
        const newEvt = generateEvent(nextId.current++)
        return [newEvt, ...prev].slice(0, 500)
      })
    }, 2500)
    return () => clearInterval(t)
  }, [live])

  // Stats
  const stats = useMemo(() => {
    const total = events.length
    const critical = events.filter(e => e.severity === 'critical').length
    const high = events.filter(e => e.severity === 'high').length
    const uniqueIPs = new Set(events.map(e => e.srcIP)).size
    const honeypot = events.filter(e => e.source === 'T-Pot Honeypot').length
    return { total, critical, high, uniqueIPs, honeypot, feeds: FEEDS.length }
  }, [events])

  // Sparkline data
  const sparkData = useMemo(() => {
    const base = [12, 15, 11, 18, 14, 22, 19, 25, 21, 28, 24, 30, 27, 33, 29]
    return {
      total: base.map(v => v + rand(-3, 5)),
      critical: base.map(v => Math.max(0, Math.floor(v * 0.05) + rand(-1, 1))),
      high: base.map(v => Math.floor(v * 0.15) + rand(-1, 2)),
      ips: base.map(v => v + rand(-2, 4)),
      honeypot: base.map(v => Math.floor(v * 0.3) + rand(-2, 3)),
      feeds: Array(15).fill(16),
    }
  }, [])

  // Country counts
  const countryCounts = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.country]) map[e.country] = { code: e.country, name: e.countryName, count: 0 }
      map[e.country].count++
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 12)
  }, [events])

  const countryMax = countryCounts[0]?.count || 1

  // Filtered events
  const filteredEvents = useMemo(() => {
    let f = events
    if (sevFilter !== 'all') f = f.filter(e => e.severity === sevFilter)
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(e =>
        e.srcIP.includes(s) || e.attackType.toLowerCase().includes(s) ||
        e.feed.toLowerCase().includes(s) || e.mitre.toLowerCase().includes(s) ||
        e.country.toLowerCase().includes(s) || e.source.toLowerCase().includes(s)
      )
    }
    return f
  }, [events, sevFilter, search])

  // Honeypot sessions
  const honeypotSessions = useMemo(() => {
    return events.filter(e => e.source === 'T-Pot Honeypot').slice(0, 30).map((e) => ({
      ...e,
      credentials: pick(['root:root', 'admin:admin', 'admin:1234', 'pi:raspberry', 'user:password', 'test:test', '\u2014']),
      commands: pick(['uname -a; cat /etc/passwd', 'wget http://...', 'curl | sh', 'ls; whoami', 'cd /tmp; chmod +x *', '\u2014']),
      duration: `${rand(1, 300)}s`,
      malware: Math.random() > 0.7 ? 'YES' : 'NO',
      status: pick(['active', 'closed', 'suspicious']),
    }))
  }, [events])

  // ─── STYLES ──────────────────────────────────────────────────────────────

  const s = {
    app: {
      minHeight: '100vh',
      background: theme.bg,
      color: theme.text,
      fontFamily: FONTS.sans,
      WebkitFontSmoothing: 'antialiased',
      transition: 'background 0.3s, color 0.3s',
    },
    // Header — matches daniellegall.com exactly
    header: {
      position: 'sticky', top: 0, zIndex: 50,
      background: theme.headerBg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${theme.border}`,
      padding: '0 16px',
    },
    headerInner: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '0 8px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 80,
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    logoText: {
      fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px',
      color: theme.logoText, fontFamily: FONTS.sans,
      display: 'flex', alignItems: 'center', gap: 0,
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 },
    statusDot: (color) => ({ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, marginRight: 5 }),
    statusLabel: { fontSize: 14, fontWeight: 500, color: theme.navText, transition: 'color 0.2s' },
    toggleBtn: {
      padding: '8px 16px', borderRadius: 6,
      background: live ? BRAND.blue : 'transparent',
      border: live ? 'none' : `1px solid ${theme.border}`,
      color: live ? '#fff' : theme.textSecondary,
      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans,
      transition: 'all 0.2s',
    },
    themeBtn: {
      width: 40, height: 40, borderRadius: 6,
      border: `1px solid ${theme.border}`,
      background: 'transparent', color: theme.textSecondary, cursor: 'pointer', fontSize: 18,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
    },
    clock: { fontFamily: FONTS.mono, fontSize: 13, color: theme.textMuted, fontWeight: 500 },
    // Tab nav
    nav: {
      display: 'flex', gap: 0,
      borderBottom: `1px solid ${theme.border}`,
      background: theme.bg,
      maxWidth: 1280,
      margin: '0 auto',
      padding: '0 24px',
    },
    tabBtn: (active) => ({
      padding: '14px 20px', fontSize: 14, fontWeight: active ? 600 : 500,
      color: active ? theme.primary : theme.navText,
      background: 'none', border: 'none', cursor: 'pointer',
      borderBottom: active ? `2px solid ${theme.primary}` : '2px solid transparent',
      transition: 'all 0.2s', fontFamily: FONTS.sans,
    }),
    main: { padding: '24px 24px', maxWidth: 1280, margin: '0 auto' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 },
    statCard: {
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
      padding: '20px 20px 16px', transition: 'all 0.3s',
      cursor: 'default',
    },
    statLabel: { fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { fontSize: 28, fontWeight: 700, fontFamily: FONTS.mono, color: theme.text, lineHeight: 1 },
    statSpark: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 },
    threeCol: { display: 'grid', gridTemplateColumns: '380px 1fr 240px', gap: 20, marginBottom: 24 },
    panel: {
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
      padding: 20, transition: 'all 0.3s',
    },
    panelTitle: { fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 },
    th: {
      textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: theme.textSecondary,
      borderBottom: `1px solid ${theme.border}`, background: theme.tableHeader,
      position: 'sticky', top: 0, zIndex: 2, fontFamily: FONTS.sans, fontSize: 11,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    td: {
      padding: '9px 12px', borderBottom: `1px solid ${theme.border}`,
      fontFamily: FONTS.mono, fontSize: 12, color: theme.textSecondary,
    },
    sevBadge: (sev) => {
      const colors = {
        critical: { bg: theme.criticalBg, color: theme.critical },
        high: { bg: theme.highBg, color: theme.high },
        medium: { bg: theme.mediumBg, color: theme.medium },
        low: { bg: theme.lowBg, color: theme.low },
        info: { bg: theme.infoBg, color: theme.info },
      }
      const c = colors[sev] || colors.info
      return {
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        background: c.bg, color: c.color, letterSpacing: 0.5,
      }
    },
    filterRow: { display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
    filterBtn: (active) => ({
      padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
      border: `1px solid ${active ? theme.primary : theme.border}`,
      background: active ? theme.primaryBg : 'transparent',
      color: active ? theme.primary : theme.textSecondary,
      transition: 'all 0.2s', fontFamily: FONTS.sans,
    }),
    searchInput: {
      padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.border}`,
      background: theme.surface, color: theme.text, fontSize: 13,
      fontFamily: FONTS.mono, outline: 'none', width: 280,
      transition: 'border-color 0.2s',
    },
    tableWrap: {
      maxHeight: 420, overflowY: 'auto', borderRadius: 12,
      border: `1px solid ${theme.border}`,
    },
    // Footer — matches daniellegall.com exactly
    footer: {
      background: BRAND.navy,
      padding: '32px 16px',
      textAlign: 'center',
    },
    footerText: {
      color: '#94a3b8',
      fontSize: 14,
      fontFamily: FONTS.sans,
    },
    feedGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    feedCard: {
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
      padding: 20, transition: 'all 0.3s',
    },
  }

  // ─── RENDER TABS ─────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={s.statsRow}>
        {[
          { label: 'Total Events', value: stats.total.toLocaleString(), data: sparkData.total, color: theme.primary },
          { label: 'Critical Alerts', value: stats.critical, data: sparkData.critical, color: theme.critical },
          { label: 'High Severity', value: stats.high, data: sparkData.high, color: theme.high },
          { label: 'Unique Source IPs', value: stats.uniqueIPs, data: sparkData.ips, color: theme.primary },
          { label: 'Honeypot Captures', value: stats.honeypot, data: sparkData.honeypot, color: theme.medium },
          { label: 'Active Intel Feeds', value: stats.feeds, data: sparkData.feeds, color: theme.low },
        ].map((c, i) => (
          <div key={i} style={s.statCard} className="card-hover">
            <div style={s.statLabel}>{c.label}</div>
            <div style={s.statValue}>{c.value}</div>
            <div style={s.statSpark}>
              <Sparkline data={c.data} color={c.color} />
            </div>
          </div>
        ))}
      </div>

      <div style={s.threeCol}>
        <div style={s.panel}>
          <div style={s.panelTitle}>Attack Origins</div>
          <Globe events={events} theme={theme} />
        </div>
        <div style={s.panel}>
          <div style={s.panelTitle}>Top Attack Vectors</div>
          <AttackBarChart events={events} theme={theme} />
        </div>
        <div style={s.panel}>
          <div style={s.panelTitle}>Source Countries</div>
          {countryCounts.map(c => (
            <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 28, fontSize: 12, fontFamily: FONTS.mono, color: theme.textSecondary }}>{c.code}</span>
              <div style={{ flex: 1, height: 6, background: theme.surfaceHover, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${(c.count / countryMax) * 100}%`, height: '100%',
                  background: theme.primary, borderRadius: 3, transition: 'width 0.5s',
                }} />
              </div>
              <span style={{ width: 28, fontSize: 11, fontFamily: FONTS.mono, color: theme.textMuted, textAlign: 'right' }}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={s.panelTitle}>Live Event Stream</div>
          <div style={s.filterRow}>
            {['all', ...SEVERITY_KEYS].map(f => (
              <button key={f} style={s.filterBtn(sevFilter === f)} onClick={() => setSevFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Time', 'Severity', 'Attack Type', 'Source IP', 'Country', 'Protocol', 'Port', 'Source', 'Confidence'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.slice(0, 50).map(e => (
                <tr key={e.id} className="table-row-hover">
                  <td style={s.td}>{formatTime(e.time)}</td>
                  <td style={s.td}><span style={s.sevBadge(e.severity)}>{e.severity}</span></td>
                  <td style={{ ...s.td, color: theme.text, fontFamily: FONTS.sans }}>{e.attackType}</td>
                  <td style={s.td}>{e.srcIP}</td>
                  <td style={{ ...s.td, fontFamily: FONTS.sans }}>{e.country}</td>
                  <td style={s.td}>{e.protocol}</td>
                  <td style={s.td}>{e.port}</td>
                  <td style={{ ...s.td, fontFamily: FONTS.sans }}>{e.source}</td>
                  <td style={s.td}>{e.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderThreatEvents = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={s.searchInput}
          placeholder="Search IPs, attacks, feeds, MITRE..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['all', ...SEVERITY_KEYS].map(f => (
          <button key={f} style={s.filterBtn(sevFilter === f)} onClick={() => setSevFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ fontSize: 12, color: theme.textMuted, marginLeft: 'auto' }}>
          {filteredEvents.length} events
        </span>
      </div>
      <div style={{ ...s.tableWrap, maxHeight: 600 }}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Time', 'Severity', 'Attack Type', 'Src IP', 'Dst IP', 'Protocol', 'Port', 'MITRE', 'Feed Source', 'Confidence', 'Detection'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEvents.slice(0, 100).map(e => (
              <tr key={e.id} className="table-row-hover">
                <td style={s.td}>{formatTime(e.time)}</td>
                <td style={s.td}><span style={s.sevBadge(e.severity)}>{e.severity}</span></td>
                <td style={{ ...s.td, color: theme.text, fontFamily: FONTS.sans }}>{e.attackType}</td>
                <td style={s.td}>{e.srcIP}</td>
                <td style={s.td}>{e.dstIP}</td>
                <td style={s.td}>{e.protocol}</td>
                <td style={s.td}>{e.port}</td>
                <td style={{ ...s.td, color: theme.primary }}>{e.mitre}</td>
                <td style={{ ...s.td, fontFamily: FONTS.sans }}>{e.feed}</td>
                <td style={s.td}>{e.confidence}%</td>
                <td style={{ ...s.td, fontFamily: FONTS.sans }}>{e.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderHoneypot = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Status', value: 'ONLINE', color: theme.low },
          { label: 'Active Sessions', value: events.filter(e => e.source === 'T-Pot Honeypot').slice(0, 30).filter(() => Math.random() > 0.7).length, color: theme.primary },
          { label: 'Total Sessions', value: events.filter(e => e.source === 'T-Pot Honeypot').length, color: theme.primary },
          { label: 'Malware Captured', value: rand(8, 24), color: theme.critical },
        ].map((c, i) => (
          <div key={i} style={s.statCard} className="card-hover">
            <div style={s.statLabel}>{c.label}</div>
            <div style={{ ...s.statValue, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...s.panel, marginBottom: 24 }}>
        <div style={s.panelTitle}>Honeypot Integration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Platform', value: 'T-Pot CE Docker' },
            { label: 'Honeypots', value: 'Cowrie, Dionaea, Conpot, Heralding' },
            { label: 'VPS Provider', value: 'Hetzner' },
            { label: 'SIEM Link', value: 'Wazuh Agent + Logstash' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>Sessions</div>
        <div style={{ ...s.tableWrap, maxHeight: 500 }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Time', 'Source IP', 'Country', 'Protocol', 'Credentials', 'Commands', 'Duration', 'Malware', 'Status'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {honeypotSessions.map((e, i) => (
                <tr key={i} className="table-row-hover">
                  <td style={s.td}>{formatTime(e.time)}</td>
                  <td style={s.td}>{e.srcIP}</td>
                  <td style={{ ...s.td, fontFamily: FONTS.sans }}>{e.country}</td>
                  <td style={s.td}>{e.protocol}</td>
                  <td style={{ ...s.td, fontSize: 11 }}>{e.credentials}</td>
                  <td style={{ ...s.td, fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.commands}</td>
                  <td style={s.td}>{e.duration}</td>
                  <td style={s.td}>
                    <span style={s.sevBadge(e.malware === 'YES' ? 'critical' : 'low')}>{e.malware}</span>
                  </td>
                  <td style={s.td}>
                    <span style={s.sevBadge(e.status === 'active' ? 'high' : e.status === 'suspicious' ? 'medium' : 'info')}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderIntelFeeds = () => {
    const simFeedCounts = {}
    events.forEach(e => { simFeedCounts[e.feed] = (simFeedCounts[e.feed] || 0) + 1 })

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={s.feedGrid}>
          {FEEDS.map(feed => {
            const realCount = feedCounts[feed.id]
            const displayCount = realCount || simFeedCounts[feed.name] || rand(10, 200)
            return (
              <div key={feed.id} style={s.feedCard} className="card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{feed.name}</div>
                    <div style={{ fontSize: 12, color: theme.textSecondary }}>{feed.type}</div>
                  </div>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: CATEGORY_COLORS[feed.category],
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONTS.mono, color: theme.text }}>
                      {realCount ? realCount.toLocaleString() : displayCount}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{realCount ? 'live IoCs' : 'events'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: theme.low, fontWeight: 600 }}>ACTIVE</div>
                    <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: FONTS.mono }}>
                      {rand(1, 45)}m ago
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={s.panel}>
          <div style={s.panelTitle}>Feed Endpoints</div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Name', 'URL', 'Type', 'Category'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEEDS.map(feed => (
                  <tr key={feed.id} className="table-row-hover">
                    <td style={{ ...s.td, fontWeight: 500, color: theme.text, fontFamily: FONTS.sans }}>{feed.name}</td>
                    <td style={{ ...s.td, fontSize: 11, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feed.url}</td>
                    <td style={{ ...s.td, fontFamily: FONTS.sans }}>{feed.type}</td>
                    <td style={s.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[feed.category] }} />
                        <span style={{ fontFamily: FONTS.sans, textTransform: 'capitalize' }}>{feed.category}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const tabContent = [renderOverview, renderThreatEvents, renderHoneypot, renderIntelFeeds]

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Poppins:wght@400;500;600;700&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-ring {
          animation: pulse 2s ease-in-out infinite;
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-3px);
          box-shadow: ${theme.shadowLg};
          border-color: ${theme.primaryLight} !important;
        }
        .table-row-hover:hover td {
          background: ${theme.tableRowHover};
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.primary}40; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.primary}70; }
        * { scrollbar-width: thin; scrollbar-color: ${theme.primary}40 transparent; }
      `}</style>

      {/* Header — exact daniellegall.com style */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <LogoIcon dark={dark} />
            <span style={s.logoText}>
              DANIEL<span style={{ color: BRAND.blue }}>{' '}LEGALL</span>
            </span>
            <span style={{ width: 1, height: 24, background: theme.border, margin: '0 8px' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.navText }}>Threat Dashboard</span>
          </div>
          <div style={s.headerRight}>
            <span style={s.statusLabel}><span style={s.statusDot(theme.low)} />Wazuh</span>
            <span style={s.statusLabel}><span style={s.statusDot(theme.low)} />T-Pot</span>
            <span style={s.statusLabel}><span style={s.statusDot(theme.low)} />{FEEDS.length} Feeds</span>
            <button style={s.toggleBtn} onClick={() => setLive(!live)}>
              {live ? '\u25CF LIVE' : '\u25CB PAUSED'}
            </button>
            <button style={s.themeBtn} onClick={() => setDark(!dark)} title="Toggle theme">
              {dark ? '\u2600' : '\u263E'}
            </button>
            <span style={s.clock}>{clock}</span>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav style={{ borderBottom: `1px solid ${theme.border}`, background: theme.bg }}>
        <div style={s.nav}>
          {TABS.map((t, i) => (
            <button key={t} style={s.tabBtn(tab === i)} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={s.main}>
        {tabContent[tab]()}
      </main>

      {/* Footer — exact daniellegall.com style */}
      <footer style={s.footer}>
        <p style={s.footerText}>&copy; 2026 Daniel Legall. All rights reserved.</p>
      </footer>
    </div>
  )
}
