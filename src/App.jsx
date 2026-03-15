import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as d3 from 'd3'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const FONTS = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
}

const LIGHT = {
  bg: '#ffffff',
  surface: '#f8fafc',
  surfaceHover: '#f1f5f9',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#60a5fa',
  primaryBg: '#eff6ff',
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
  headerBg: 'rgba(255,255,255,0.85)',
  tableBg: '#ffffff',
  tableRowHover: '#f8fafc',
  tableHeader: '#f1f5f9',
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
  headerBg: 'rgba(2,6,23,0.85)',
  tableBg: '#0f172a',
  tableRowHover: '#1e293b',
  tableHeader: '#1e293b',
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

const TABS = ['Overview', 'Threat Events', 'Honeypot', 'Intel Feeds', 'SIEM & Devices']

const FEEDS = [
  { id: 'urlhaus', name: 'URLhaus', url: 'https://urlhaus-api.abuse.ch/v1/', type: 'Malicious URLs', category: 'malware' },
  { id: 'malwarebazaar', name: 'MalwareBazaar', url: 'https://bazaar.abuse.ch/api/', type: 'Malware Samples', category: 'malware' },
  { id: 'feodotracker', name: 'Feodo Tracker', url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.json', type: 'Botnet C2', category: 'c2' },
  { id: 'sslbl', name: 'SSL Blacklist', url: 'https://sslbl.abuse.ch/blacklist/sslblacklist.csv', type: 'SSL Certs', category: 'certificates' },
  { id: 'threatfox', name: 'ThreatFox', url: 'https://threatfox-api.abuse.ch/api/v1/', type: 'IoC Sharing', category: 'ioc' },
  { id: 'openphish', name: 'OpenPhish', url: 'https://openphish.com/feed.txt', type: 'Phishing URLs', category: 'phishing' },
  { id: 'dshield', name: 'DShield Top 20', url: 'https://isc.sans.edu/api/topips/records/20?json', type: 'Top Attackers', category: 'ip' },
  { id: 'otx', name: 'AlienVault OTX', url: 'https://otx.alienvault.com/api/v1/pulses/subscribed', type: 'IoC Platform', category: 'ioc' },
  { id: 'misp', name: 'MISP OSINT', url: 'https://www.circl.lu/doc/misp/feed-osint/', type: 'Structured IoCs', category: 'ioc' },
  { id: 'greynoise', name: 'GreyNoise', url: 'https://api.greynoise.io/v3/community/', type: 'Scanner Intel', category: 'ip' },
  { id: 'spamhaus', name: 'Spamhaus DROP', url: 'https://www.spamhaus.org/drop/drop.txt', type: 'IP Blocklist', category: 'ip' },
  { id: 'etopen', name: 'ET Open Rules', url: 'https://rules.emergingthreats.net/open/suricata/rules/', type: 'IDS/Suricata', category: 'rules' },
  { id: 'cinsscore', name: 'CINS Army', url: 'https://cinsscore.com/list/ci-badguys.txt', type: 'IP Reputation', category: 'ip' },
  { id: 'crowdsec', name: 'CrowdSec CTI', url: 'https://cti.api.crowdsec.net/v2/smoke/', type: 'Crowd Intel', category: 'ip' },
  { id: 'talos', name: 'Cisco Talos', url: 'https://talosintelligence.com/reputation_center', type: 'IP/Domain Rep', category: 'ip' },
  { id: 'uscert', name: 'CISA Advisories', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories', type: 'Gov Advisories', category: 'advisory' },
]

const CATEGORY_COLORS = {
  malware: '#dc2626', c2: '#ea580c', phishing: '#9333ea', ip: '#2563eb',
  ioc: '#ca8a04', certificates: '#16a34a', rules: '#0284c7', advisory: '#d97706',
}

const DEVICES = [
  { name: 'Meraki MX Appliance', type: 'Firewall/SD-WAN', os: 'Meraki Cloud-Managed', method: 'TLS Syslog TCP/6514', format: 'Meraki Syslog', icon: '🛡️', eps: 42 },
  { name: 'Meraki MR Access Points', type: 'Wireless', os: 'Meraki Cloud-Managed', method: 'UDP Syslog 514', format: 'Meraki Wireless Events', icon: '📡', eps: 18 },
  { name: 'Meraki MS Switches', type: 'Network Switch', os: 'Meraki Cloud-Managed', method: 'UDP Syslog 514', format: 'Meraki Event Log', icon: '🔌', eps: 12 },
  { name: 'FortiGate 60F Firewall', type: 'NGFW / UTM', os: 'FortiOS 7.6.6', method: 'TLS Syslog TCP/6514', format: 'FortiGate CEF/Syslog', icon: '🔥', eps: 85 },
  { name: 'Synology NAS', type: 'Storage / Backup', os: 'DSM 7.x', method: 'TLS Syslog TCP/6514', format: 'Synology DSM Syslog', icon: '💾', eps: 8 },
  { name: 'IoT Devices Hub', type: 'IoT Gateway', os: 'Home Assistant / MQTT', method: 'Wazuh API Poller', format: 'JSON / MQTT Events', icon: '🏠', eps: 5 },
  { name: 'IoT Cameras', type: 'Surveillance', os: 'Various Firmware', method: 'Syslog → Wazuh', format: 'Syslog / ONVIF', icon: '📹', eps: 3 },
  { name: 'Smart Speakers/Displays', type: 'IoT Consumer', os: 'Proprietary', method: 'Network Traffic → Suricata', format: 'EVE JSON (passive)', icon: '🔊', eps: 2 },
  { name: 'Honeypot VPS (T-Pot)', type: 'Deception', os: 'Debian 12 + T-Pot CE', method: 'Wazuh Agent + Logstash', format: 'Cowrie JSON / ECS', icon: '🍯', eps: 120 },
  { name: 'Suricata IDS', type: 'IDS/IPS', os: 'Inline on FortiGate/VPS', method: 'eve.json → Filebeat → Wazuh', format: 'EVE JSON', icon: '🔍', eps: 65 },
]

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

    // Glow
    const defs = svg.append('defs')
    const radial = defs.append('radialGradient').attr('id', 'globe-glow')
    radial.append('stop').attr('offset', '0%').attr('stop-color', theme.primary).attr('stop-opacity', 0.12)
    radial.append('stop').attr('offset', '100%').attr('stop-color', theme.primary).attr('stop-opacity', 0)

    const filter = defs.append('filter').attr('id', 'dot-shadow')
    filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 2)

    svg.append('circle').attr('cx', size / 2).attr('cy', size / 2).attr('r', 165).attr('fill', 'url(#globe-glow)')

    // Ocean
    svg.append('circle')
      .attr('cx', size / 2).attr('cy', size / 2).attr('r', 155)
      .attr('fill', theme.surface)
      .attr('stroke', theme.border)
      .attr('stroke-width', 1)

    // Graticule
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', theme.primary)
      .attr('stroke-opacity', 0.06)
      .attr('stroke-width', 0.5)

    // Landmasses (approximate with circles)
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

    // Attack dots
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

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' } catch { return true }
  })
  const [tab, setTab] = useState(0)
  const [live, setLive] = useState(true)
  const [events, setEvents] = useState(() => generateInitialEvents(150))
  const [clock, setClock] = useState(formatUTC())
  const [sevFilter, setSevFilter] = useState('all')
  const [search, setSearch] = useState('')
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
    return events.filter(e => e.source === 'T-Pot Honeypot').slice(0, 30).map((e, i) => ({
      ...e,
      credentials: pick(['root:root', 'admin:admin', 'admin:1234', 'pi:raspberry', 'user:password', 'test:test', '—']),
      commands: pick(['uname -a; cat /etc/passwd', 'wget http://...', 'curl | sh', 'ls; whoami', 'cd /tmp; chmod +x *', '—']),
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
    header: {
      position: 'sticky', top: 0, zIndex: 50,
      background: theme.headerBg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${theme.border}`,
      padding: '0 32px',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    logo: { color: theme.primary, fontSize: 22, marginRight: 4 },
    title: { fontSize: 16, fontWeight: 600, letterSpacing: 1.5, color: theme.text },
    subtitle: { fontSize: 12, color: theme.textSecondary, marginLeft: 8 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 20, fontSize: 13 },
    statusDot: (color) => ({ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, marginRight: 5 }),
    toggleBtn: {
      padding: '5px 14px', borderRadius: 6, border: `1px solid ${theme.border}`,
      background: live ? theme.primary : 'transparent',
      color: live ? '#fff' : theme.textSecondary,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.mono,
      transition: 'all 0.2s',
    },
    themeBtn: {
      padding: '5px 10px', borderRadius: 6, border: `1px solid ${theme.border}`,
      background: 'transparent', color: theme.textSecondary, cursor: 'pointer', fontSize: 16,
      transition: 'all 0.2s',
    },
    clock: { fontFamily: FONTS.mono, fontSize: 13, color: theme.textMuted },
    nav: {
      display: 'flex', gap: 0, borderBottom: `1px solid ${theme.border}`,
      padding: '0 32px', background: theme.bg,
    },
    tabBtn: (active) => ({
      padding: '14px 20px', fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? theme.primary : theme.textSecondary,
      background: 'none', border: 'none', cursor: 'pointer',
      borderBottom: active ? `2px solid ${theme.primary}` : '2px solid transparent',
      transition: 'all 0.2s', fontFamily: FONTS.sans,
    }),
    main: { padding: '24px 32px', maxWidth: 1600, margin: '0 auto' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 },
    statCard: {
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
      padding: '20px 20px 16px', transition: 'all 0.3s',
      cursor: 'default',
    },
    statLabel: { fontSize: 12, color: theme.textMuted, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
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
    footer: {
      borderTop: `1px solid ${theme.border}`, padding: '16px 32px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12, color: theme.textMuted,
    },
    feedGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    feedCard: {
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
      padding: 20, transition: 'all 0.3s',
    },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  }

  // ─── RENDER TABS ─────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Stat Cards */}
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

      {/* 3-Column: Globe / Attack Vectors / Countries */}
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

      {/* Live Event Stream */}
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
      {/* Stat cards */}
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

      {/* Integration info */}
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
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions table */}
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
                    <span style={{
                      ...s.sevBadge(e.malware === 'YES' ? 'critical' : 'low'),
                    }}>{e.malware}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.sevBadge(e.status === 'active' ? 'high' : e.status === 'suspicious' ? 'medium' : 'info'),
                    }}>{e.status}</span>
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
    const feedCounts = {}
    events.forEach(e => { feedCounts[e.feed] = (feedCounts[e.feed] || 0) + 1 })

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={s.feedGrid}>
          {FEEDS.map(feed => (
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
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONTS.mono, color: theme.text }}>{feedCounts[feed.name] || rand(10, 200)}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>events</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: theme.low, fontWeight: 600 }}>ACTIVE</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: FONTS.mono }}>
                    {rand(1, 45)}m ago
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feed reference table */}
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

  const renderSIEM = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={s.twoCol}>
        {/* Wazuh SIEM */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Wazuh SIEM Manager</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Version', value: '4.9.2' },
              { label: 'Deployment', value: 'Hetzner VPS' },
              { label: 'Connected Agents', value: '10' },
              { label: 'Events/Day', value: '~28,400' },
              { label: 'Dashboards', value: 'OpenSearch' },
              { label: 'Integrations', value: 'Logstash, Filebeat' },
              { label: 'Alert Rules', value: '2,847 active' },
              { label: 'Uptime', value: '99.97%' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, fontFamily: FONTS.mono }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Devices */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Network Devices</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEVICES.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: theme.surfaceHover,
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{d.os}</div>
                </div>
                <span style={s.statusDot(theme.low)} />
                <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: theme.textMuted }}>{d.eps} EPS</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Integration Matrix */}
      <div style={s.panel}>
        <div style={s.panelTitle}>Log Integration Matrix</div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['', 'Device', 'Type', 'Integration Method', 'Log Format', 'Status', 'EPS'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEVICES.map((d, i) => (
                <tr key={i} className="table-row-hover">
                  <td style={{ ...s.td, fontSize: 18, textAlign: 'center', width: 40 }}>{d.icon}</td>
                  <td style={{ ...s.td, fontWeight: 500, color: theme.text, fontFamily: FONTS.sans }}>{d.name}</td>
                  <td style={s.td}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                      fontSize: 10, fontWeight: 600, background: theme.primaryBg,
                      color: theme.primary, fontFamily: FONTS.sans,
                    }}>{d.type}</span>
                  </td>
                  <td style={{ ...s.td, fontFamily: FONTS.sans }}>{d.method}</td>
                  <td style={s.td}>{d.format}</td>
                  <td style={s.td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={s.statusDot(theme.low)} />
                      <span style={{ color: theme.low, fontWeight: 600, fontFamily: FONTS.sans }}>Active</span>
                    </span>
                  </td>
                  <td style={{ ...s.td, fontFamily: FONTS.mono }}>{d.eps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const tabContent = [renderOverview, renderThreatEvents, renderHoneypot, renderIntelFeeds, renderSIEM]

  return (
    <div style={s.app}>
      <style>{`
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

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>&#9670;</span>
          <span style={s.title}>THREAT COMMAND</span>
          <span style={s.subtitle}>threat.daniellegall.com &mdash; Unified Threat Intelligence</span>
        </div>
        <div style={s.headerRight}>
          <span><span style={s.statusDot(theme.low)} />Wazuh</span>
          <span><span style={s.statusDot(theme.low)} />T-Pot</span>
          <span><span style={s.statusDot(theme.low)} />{FEEDS.length} Feeds</span>
          <button style={s.toggleBtn} onClick={() => setLive(!live)}>
            {live ? '\u25CF LIVE' : '\u25CB PAUSED'}
          </button>
          <button style={s.themeBtn} onClick={() => setDark(!dark)} title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          <span style={s.clock}>{clock}</span>
        </div>
      </header>

      {/* Tab Nav */}
      <nav style={s.nav}>
        {TABS.map((t, i) => (
          <button key={t} style={s.tabBtn(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={s.main}>
        {tabContent[tab]()}
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span>{'🔥'} FortiGate <span style={s.statusDot(theme.low)} /></span>
          <span>{'📡'} Meraki <span style={s.statusDot(theme.low)} /></span>
          <span>{'💾'} Synology <span style={s.statusDot(theme.low)} /></span>
          <span>{'🍯'} T-Pot <span style={s.statusDot(theme.low)} /></span>
          <span>{'⬡'} Wazuh <span style={s.statusDot(theme.low)} /></span>
        </div>
        <span>threat.daniellegall.com</span>
      </footer>
    </div>
  )
}
