import { useState, useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

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
  { code: 'AF', name: 'Afghanistan', lat: 33.9, lon: 67.7 },
  { code: 'AL', name: 'Albania', lat: 41.1, lon: 20.1 },
  { code: 'DZ', name: 'Algeria', lat: 28.0, lon: 1.6 },
  { code: 'AO', name: 'Angola', lat: -11.2, lon: 17.8 },
  { code: 'AR', name: 'Argentina', lat: -38.4, lon: -63.6 },
  { code: 'AM', name: 'Armenia', lat: 40.0, lon: 45.0 },
  { code: 'AU', name: 'Australia', lat: -25.2, lon: 133.7 },
  { code: 'AT', name: 'Austria', lat: 47.5, lon: 14.5 },
  { code: 'AZ', name: 'Azerbaijan', lat: 40.1, lon: 47.5 },
  { code: 'BH', name: 'Bahrain', lat: 26.0, lon: 50.5 },
  { code: 'BD', name: 'Bangladesh', lat: 23.6, lon: 90.3 },
  { code: 'BY', name: 'Belarus', lat: 53.7, lon: 27.9 },
  { code: 'BE', name: 'Belgium', lat: 50.5, lon: 4.4 },
  { code: 'BZ', name: 'Belize', lat: 17.1, lon: -88.4 },
  { code: 'BJ', name: 'Benin', lat: 9.3, lon: 2.3 },
  { code: 'BT', name: 'Bhutan', lat: 27.5, lon: 90.4 },
  { code: 'BO', name: 'Bolivia', lat: -16.2, lon: -63.5 },
  { code: 'BA', name: 'Bosnia & Herzegovina', lat: 43.9, lon: 17.6 },
  { code: 'BW', name: 'Botswana', lat: -22.3, lon: 24.6 },
  { code: 'BR', name: 'Brazil', lat: -14.2, lon: -51.9 },
  { code: 'BN', name: 'Brunei', lat: 4.5, lon: 114.7 },
  { code: 'BG', name: 'Bulgaria', lat: 42.7, lon: 25.4 },
  { code: 'BF', name: 'Burkina Faso', lat: 12.3, lon: -1.5 },
  { code: 'KH', name: 'Cambodia', lat: 12.5, lon: 104.9 },
  { code: 'CM', name: 'Cameroon', lat: 7.3, lon: 12.3 },
  { code: 'CA', name: 'Canada', lat: 56.1, lon: -106.3 },
  { code: 'CF', name: 'Central African Republic', lat: 6.6, lon: 20.9 },
  { code: 'TD', name: 'Chad', lat: 15.4, lon: 18.7 },
  { code: 'CL', name: 'Chile', lat: -35.6, lon: -71.2 },
  { code: 'CN', name: 'China', lat: 35.8, lon: 104.1 },
  { code: 'CO', name: 'Colombia', lat: 4.5, lon: -74.2 },
  { code: 'CD', name: 'Congo (DRC)', lat: -4.0, lon: 21.7 },
  { code: 'CG', name: 'Congo (Republic)', lat: -0.2, lon: 15.8 },
  { code: 'CR', name: 'Costa Rica', lat: 9.7, lon: -83.7 },
  { code: 'CI', name: "C\u00f4te d'Ivoire", lat: 7.5, lon: -5.5 },
  { code: 'HR', name: 'Croatia', lat: 45.1, lon: 15.2 },
  { code: 'CU', name: 'Cuba', lat: 21.5, lon: -77.7 },
  { code: 'CY', name: 'Cyprus', lat: 35.1, lon: 33.4 },
  { code: 'CZ', name: 'Czech Republic', lat: 49.8, lon: 15.4 },
  { code: 'DK', name: 'Denmark', lat: 56.2, lon: 9.5 },
  { code: 'DO', name: 'Dominican Republic', lat: 18.7, lon: -70.1 },
  { code: 'EC', name: 'Ecuador', lat: -1.8, lon: -78.1 },
  { code: 'EG', name: 'Egypt', lat: 26.8, lon: 30.8 },
  { code: 'SV', name: 'El Salvador', lat: 13.7, lon: -88.8 },
  { code: 'EE', name: 'Estonia', lat: 58.5, lon: 25.0 },
  { code: 'ET', name: 'Ethiopia', lat: 9.1, lon: 40.4 },
  { code: 'FI', name: 'Finland', lat: 61.9, lon: 25.7 },
  { code: 'FR', name: 'France', lat: 46.2, lon: 2.2 },
  { code: 'GA', name: 'Gabon', lat: -0.8, lon: 11.6 },
  { code: 'GE', name: 'Georgia', lat: 42.3, lon: 43.3 },
  { code: 'DE', name: 'Germany', lat: 51.1, lon: 10.4 },
  { code: 'GH', name: 'Ghana', lat: 7.9, lon: -1.0 },
  { code: 'GR', name: 'Greece', lat: 39.0, lon: 21.8 },
  { code: 'GT', name: 'Guatemala', lat: 15.7, lon: -90.2 },
  { code: 'GN', name: 'Guinea', lat: 9.9, lon: -9.6 },
  { code: 'HT', name: 'Haiti', lat: 18.9, lon: -72.2 },
  { code: 'HN', name: 'Honduras', lat: 15.1, lon: -86.2 },
  { code: 'HK', name: 'Hong Kong', lat: 22.3, lon: 114.1 },
  { code: 'HU', name: 'Hungary', lat: 47.1, lon: 19.5 },
  { code: 'IS', name: 'Iceland', lat: 64.9, lon: -19.0 },
  { code: 'IN', name: 'India', lat: 20.5, lon: 78.9 },
  { code: 'ID', name: 'Indonesia', lat: -0.7, lon: 113.9 },
  { code: 'IR', name: 'Iran', lat: 32.4, lon: 53.6 },
  { code: 'IQ', name: 'Iraq', lat: 33.2, lon: 43.6 },
  { code: 'IE', name: 'Ireland', lat: 53.4, lon: -8.2 },
  { code: 'IL', name: 'Israel', lat: 31.0, lon: 34.8 },
  { code: 'IT', name: 'Italy', lat: 41.8, lon: 12.5 },
  { code: 'JM', name: 'Jamaica', lat: 18.1, lon: -77.2 },
  { code: 'JP', name: 'Japan', lat: 36.2, lon: 138.2 },
  { code: 'JO', name: 'Jordan', lat: 30.5, lon: 36.2 },
  { code: 'KZ', name: 'Kazakhstan', lat: 48.0, lon: 67.9 },
  { code: 'KE', name: 'Kenya', lat: -0.0, lon: 37.9 },
  { code: 'KP', name: 'North Korea', lat: 40.3, lon: 127.5 },
  { code: 'KR', name: 'South Korea', lat: 35.9, lon: 127.7 },
  { code: 'KW', name: 'Kuwait', lat: 29.3, lon: 47.4 },
  { code: 'KG', name: 'Kyrgyzstan', lat: 41.2, lon: 74.7 },
  { code: 'LA', name: 'Laos', lat: 19.8, lon: 102.4 },
  { code: 'LV', name: 'Latvia', lat: 56.8, lon: 24.6 },
  { code: 'LB', name: 'Lebanon', lat: 33.8, lon: 35.8 },
  { code: 'LY', name: 'Libya', lat: 26.3, lon: 17.2 },
  { code: 'LT', name: 'Lithuania', lat: 55.1, lon: 23.8 },
  { code: 'LU', name: 'Luxembourg', lat: 49.8, lon: 6.1 },
  { code: 'MG', name: 'Madagascar', lat: -18.7, lon: 46.8 },
  { code: 'MY', name: 'Malaysia', lat: 4.2, lon: 101.9 },
  { code: 'ML', name: 'Mali', lat: 17.5, lon: -3.9 },
  { code: 'MT', name: 'Malta', lat: 35.9, lon: 14.3 },
  { code: 'MR', name: 'Mauritania', lat: 21.0, lon: -10.9 },
  { code: 'MX', name: 'Mexico', lat: 23.6, lon: -102.5 },
  { code: 'MD', name: 'Moldova', lat: 47.4, lon: 28.3 },
  { code: 'MN', name: 'Mongolia', lat: 46.8, lon: 103.8 },
  { code: 'ME', name: 'Montenegro', lat: 42.7, lon: 19.3 },
  { code: 'MA', name: 'Morocco', lat: 31.7, lon: -7.0 },
  { code: 'MZ', name: 'Mozambique', lat: -18.6, lon: 35.5 },
  { code: 'MM', name: 'Myanmar', lat: 21.9, lon: 95.9 },
  { code: 'NA', name: 'Namibia', lat: -22.9, lon: 18.4 },
  { code: 'NP', name: 'Nepal', lat: 28.3, lon: 84.1 },
  { code: 'NL', name: 'Netherlands', lat: 52.1, lon: 5.2 },
  { code: 'NZ', name: 'New Zealand', lat: -40.9, lon: 174.8 },
  { code: 'NI', name: 'Nicaragua', lat: 12.8, lon: -85.2 },
  { code: 'NE', name: 'Niger', lat: 17.6, lon: 8.0 },
  { code: 'NG', name: 'Nigeria', lat: 9.0, lon: 8.6 },
  { code: 'MK', name: 'North Macedonia', lat: 41.5, lon: 21.7 },
  { code: 'NO', name: 'Norway', lat: 60.4, lon: 8.4 },
  { code: 'OM', name: 'Oman', lat: 21.4, lon: 55.9 },
  { code: 'PK', name: 'Pakistan', lat: 30.3, lon: 69.3 },
  { code: 'PA', name: 'Panama', lat: 8.5, lon: -80.7 },
  { code: 'PY', name: 'Paraguay', lat: -23.4, lon: -58.4 },
  { code: 'PE', name: 'Peru', lat: -9.1, lon: -75.0 },
  { code: 'PH', name: 'Philippines', lat: 12.8, lon: 121.7 },
  { code: 'PL', name: 'Poland', lat: 51.9, lon: 19.1 },
  { code: 'PT', name: 'Portugal', lat: 39.3, lon: -8.2 },
  { code: 'QA', name: 'Qatar', lat: 25.3, lon: 51.1 },
  { code: 'RO', name: 'Romania', lat: 45.9, lon: 24.9 },
  { code: 'RU', name: 'Russia', lat: 61.5, lon: 105.3 },
  { code: 'RW', name: 'Rwanda', lat: -1.9, lon: 29.8 },
  { code: 'SA', name: 'Saudi Arabia', lat: 23.8, lon: 45.0 },
  { code: 'SN', name: 'Senegal', lat: 14.4, lon: -14.4 },
  { code: 'RS', name: 'Serbia', lat: 44.0, lon: 21.0 },
  { code: 'SG', name: 'Singapore', lat: 1.3, lon: 103.8 },
  { code: 'SK', name: 'Slovakia', lat: 48.6, lon: 19.6 },
  { code: 'SI', name: 'Slovenia', lat: 46.1, lon: 14.9 },
  { code: 'SO', name: 'Somalia', lat: 5.1, lon: 46.1 },
  { code: 'ZA', name: 'South Africa', lat: -30.5, lon: 22.9 },
  { code: 'ES', name: 'Spain', lat: 40.4, lon: -3.7 },
  { code: 'LK', name: 'Sri Lanka', lat: 7.8, lon: 80.7 },
  { code: 'SD', name: 'Sudan', lat: 12.8, lon: 30.2 },
  { code: 'SE', name: 'Sweden', lat: 60.1, lon: 18.6 },
  { code: 'CH', name: 'Switzerland', lat: 46.8, lon: 8.2 },
  { code: 'SY', name: 'Syria', lat: 34.8, lon: 38.9 },
  { code: 'TW', name: 'Taiwan', lat: 23.6, lon: 120.9 },
  { code: 'TJ', name: 'Tajikistan', lat: 38.8, lon: 71.2 },
  { code: 'TZ', name: 'Tanzania', lat: -6.3, lon: 34.8 },
  { code: 'TH', name: 'Thailand', lat: 15.8, lon: 100.9 },
  { code: 'TN', name: 'Tunisia', lat: 33.8, lon: 9.5 },
  { code: 'TR', name: 'Turkey', lat: 38.9, lon: 35.2 },
  { code: 'TM', name: 'Turkmenistan', lat: 38.9, lon: 59.5 },
  { code: 'UG', name: 'Uganda', lat: 1.3, lon: 32.2 },
  { code: 'UA', name: 'Ukraine', lat: 48.3, lon: 31.1 },
  { code: 'AE', name: 'United Arab Emirates', lat: 23.4, lon: 53.8 },
  { code: 'GB', name: 'United Kingdom', lat: 55.3, lon: -3.4 },
  { code: 'US', name: 'United States', lat: 39.8, lon: -98.5 },
  { code: 'UY', name: 'Uruguay', lat: -32.5, lon: -55.7 },
  { code: 'UZ', name: 'Uzbekistan', lat: 41.3, lon: 64.5 },
  { code: 'VE', name: 'Venezuela', lat: 6.4, lon: -66.5 },
  { code: 'VN', name: 'Vietnam', lat: 14.0, lon: 108.2 },
  { code: 'YE', name: 'Yemen', lat: 15.5, lon: 48.5 },
  { code: 'ZM', name: 'Zambia', lat: -13.1, lon: 27.8 },
  { code: 'ZW', name: 'Zimbabwe', lat: -19.0, lon: 29.1 },
  // Caribbean
  { code: 'AG', name: 'Antigua & Barbuda', lat: 17.0, lon: -61.7 },
  { code: 'BS', name: 'Bahamas', lat: 25.0, lon: -77.3 },
  { code: 'BB', name: 'Barbados', lat: 13.1, lon: -59.6 },
  { code: 'DM', name: 'Dominica', lat: 15.4, lon: -61.3 },
  { code: 'GD', name: 'Grenada', lat: 12.1, lon: -61.6 },
  { code: 'GY', name: 'Guyana', lat: 4.8, lon: -58.9 },
  { code: 'KN', name: 'Saint Kitts & Nevis', lat: 17.3, lon: -62.7 },
  { code: 'LC', name: 'Saint Lucia', lat: 13.9, lon: -60.9 },
  { code: 'VC', name: 'Saint Vincent & Grenadines', lat: 12.9, lon: -61.2 },
  { code: 'SR', name: 'Suriname', lat: 3.9, lon: -56.0 },
  { code: 'TT', name: 'Trinidad & Tobago', lat: 10.6, lon: -61.2 },
  { code: 'PR', name: 'Puerto Rico', lat: 18.2, lon: -66.5 },
  // Pacific
  { code: 'FJ', name: 'Fiji', lat: -17.7, lon: 178.0 },
  { code: 'KI', name: 'Kiribati', lat: 1.8, lon: -157.3 },
  { code: 'MH', name: 'Marshall Islands', lat: 7.1, lon: 171.1 },
  { code: 'FM', name: 'Micronesia', lat: 7.4, lon: 150.5 },
  { code: 'NR', name: 'Nauru', lat: -0.5, lon: 166.9 },
  { code: 'PW', name: 'Palau', lat: 7.5, lon: 134.5 },
  { code: 'PG', name: 'Papua New Guinea', lat: -6.3, lon: 143.9 },
  { code: 'WS', name: 'Samoa', lat: -13.7, lon: -172.1 },
  { code: 'SB', name: 'Solomon Islands', lat: -9.6, lon: 160.1 },
  { code: 'TO', name: 'Tonga', lat: -21.1, lon: -175.1 },
  { code: 'TV', name: 'Tuvalu', lat: -7.1, lon: 179.1 },
  { code: 'VU', name: 'Vanuatu', lat: -15.3, lon: 166.9 },
  // Africa (missing)
  { code: 'CV', name: 'Cabo Verde', lat: 16.0, lon: -24.0 },
  { code: 'KM', name: 'Comoros', lat: -11.8, lon: 43.8 },
  { code: 'DJ', name: 'Djibouti', lat: 11.8, lon: 42.5 },
  { code: 'GQ', name: 'Equatorial Guinea', lat: 1.6, lon: 10.2 },
  { code: 'ER', name: 'Eritrea', lat: 15.1, lon: 39.7 },
  { code: 'SZ', name: 'Eswatini', lat: -26.5, lon: 31.4 },
  { code: 'GM', name: 'Gambia', lat: 13.4, lon: -15.3 },
  { code: 'GW', name: 'Guinea-Bissau', lat: 11.8, lon: -15.1 },
  { code: 'LS', name: 'Lesotho', lat: -29.6, lon: 28.2 },
  { code: 'LR', name: 'Liberia', lat: 6.4, lon: -9.4 },
  { code: 'MW', name: 'Malawi', lat: -13.2, lon: 34.3 },
  { code: 'MU', name: 'Mauritius', lat: -20.3, lon: 57.5 },
  { code: 'ST', name: 'S\u00e3o Tom\u00e9 & Pr\u00edncipe', lat: 0.1, lon: 6.6 },
  { code: 'SC', name: 'Seychelles', lat: -4.6, lon: 55.4 },
  { code: 'SL', name: 'Sierra Leone', lat: 8.4, lon: -11.7 },
  { code: 'SS', name: 'South Sudan', lat: 6.8, lon: 31.6 },
  { code: 'TG', name: 'Togo', lat: 8.6, lon: 0.8 },
  { code: 'BI', name: 'Burundi', lat: -3.3, lon: 29.9 },
  // Europe (missing)
  { code: 'XK', name: 'Kosovo', lat: 42.6, lon: 20.9 },
  { code: 'LI', name: 'Liechtenstein', lat: 47.1, lon: 9.5 },
  { code: 'MC', name: 'Monaco', lat: 43.7, lon: 7.4 },
  { code: 'SM', name: 'San Marino', lat: 43.9, lon: 12.4 },
  { code: 'VA', name: 'Vatican City', lat: 41.9, lon: 12.4 },
  // Asia/Other (missing)
  { code: 'MV', name: 'Maldives', lat: 3.2, lon: 73.2 },
  { code: 'TL', name: 'Timor-Leste', lat: -8.8, lon: 125.7 },
  { code: 'PS', name: 'Palestine', lat: 31.9, lon: 35.2 },
  { code: 'MO', name: 'Macau', lat: 22.1, lon: 113.5 },
]

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'DNS', 'SMTP', 'FTP', 'RDP', 'SMB', 'SNMP', 'MQTT', 'MODBUS', 'TLS']

const DETECTION_SOURCES = ['T-Pot Honeypot', 'FortiGate IPS', 'Meraki Firewall', 'Suricata IDS', 'Threat Feed', 'Synology Logs']

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

// ─── GLOBE COMPONENT (Real Geography + Attack Arcs) ─────────────────────────

// Destination point for attack lines (user's network — US East Coast)
const DEST_COORDS = [-77.0, 38.9] // Washington DC area

let worldDataCache = null
async function loadWorldData() {
  if (worldDataCache) return worldDataCache
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  worldDataCache = await res.json()
  return worldDataCache
}

function Globe({ events, theme, onCountryClick, selectedCountry, feedGeoIPs }) {
  const ref = useRef()
  const rotationRef = useRef([-20, -20, 0])
  const worldRef = useRef(null)
  const size = 400

  // Load world data once
  useEffect(() => {
    loadWorldData().then(data => {
      worldRef.current = data
      // Force re-render by updating ref — the main effect will pick it up
      if (ref.current) ref.current.setAttribute('data-loaded', 'true')
    })
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const projection = d3.geoOrthographic()
      .scale(180)
      .translate([size / 2, size / 2])
      .rotate(rotationRef.current)
      .clipAngle(90)

    const path = d3.geoPath().projection(projection)

    // Defs
    const defs = svg.append('defs')
    const radial = defs.append('radialGradient').attr('id', 'globe-glow')
    radial.append('stop').attr('offset', '0%').attr('stop-color', theme.primary).attr('stop-opacity', 0.15)
    radial.append('stop').attr('offset', '100%').attr('stop-color', theme.primary).attr('stop-opacity', 0)

    const dotFilter = defs.append('filter').attr('id', 'dot-glow')
    dotFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 3)

    // Ocean glow
    svg.append('circle').attr('cx', size / 2).attr('cy', size / 2).attr('r', 192).attr('fill', 'url(#globe-glow)')

    // Ocean sphere
    const globeCircle = svg.append('circle')
      .attr('cx', size / 2).attr('cy', size / 2).attr('r', 180)
      .attr('fill', theme.surface)
      .attr('stroke', theme.border)
      .attr('stroke-width', 0.5)
      .style('cursor', 'grab')

    // Graticule
    const graticuleGroup = svg.append('g')
    function renderGraticule() {
      graticuleGroup.selectAll('*').remove()
      graticuleGroup.append('path')
        .datum(d3.geoGraticule()())
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', theme.primary)
        .attr('stroke-opacity', 0.06)
        .attr('stroke-width', 0.4)
    }
    renderGraticule()

    // Land group — real country shapes
    const landGroup = svg.append('g')
    function renderLand() {
      landGroup.selectAll('*').remove()
      if (!worldRef.current) return
      const countries = topojson.feature(worldRef.current, worldRef.current.objects.countries)
      landGroup.selectAll('path')
        .data(countries.features)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', theme.textMuted)
        .attr('fill-opacity', 0.2)
        .attr('stroke', theme.primary)
        .attr('stroke-opacity', 0.12)
        .attr('stroke-width', 0.3)
    }
    renderLand()

    // Arc lines group
    const arcsGroup = svg.append('g')
    // Dots group
    const dotsGroup = svg.append('g')

    const sevColorMap = { critical: theme.critical, high: theme.high, medium: theme.medium, low: theme.low, info: theme.info }

    function renderDotsAndArcs() {
      dotsGroup.selectAll('*').remove()
      arcsGroup.selectAll('*').remove()

      const recentEvents = events.slice(0, 40)

      // Draw attack arc lines from source to destination
      recentEvents.forEach((evt, i) => {
        const srcPos = projection([evt.lon, evt.lat])
        const dstPos = projection(DEST_COORDS)
        if (!srcPos || !dstPos) return

        const color = sevColorMap[evt.severity] || theme.primary

        // Great circle arc as a GeoJSON LineString
        const arcData = {
          type: 'LineString',
          coordinates: [[evt.lon, evt.lat], DEST_COORDS],
        }
        const arcPath = path(arcData)
        if (!arcPath) return

        // Draw the arc line
        const arc = arcsGroup.append('path')
          .attr('d', arcPath)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0)
          .attr('stroke-dasharray', '4,3')

        // Animate recent arcs (first 8 events get animated)
        if (i < 8) {
          const totalLen = arc.node().getTotalLength()
          arc
            .attr('stroke-dasharray', `${totalLen},${totalLen}`)
            .attr('stroke-dashoffset', totalLen)
            .attr('stroke-opacity', 0.6)
            .transition().duration(1500).ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0)
            .transition().duration(2000)
            .attr('stroke-opacity', 0.1)
        } else {
          arc.attr('stroke-opacity', 0.08).attr('stroke-dasharray', '2,4')
        }
      })

      // Draw event dots at source locations
      recentEvents.forEach((evt) => {
        const pos = projection([evt.lon, evt.lat])
        if (!pos) return
        const color = sevColorMap[evt.severity] || theme.primary
        const isSelected = selectedCountry && evt.country === selectedCountry

        // Glow
        dotsGroup.append('circle')
          .attr('cx', pos[0]).attr('cy', pos[1])
          .attr('r', isSelected ? 8 : 5)
          .attr('fill', color).attr('opacity', 0.15)
          .attr('filter', 'url(#dot-glow)')

        // Pulse ring
        dotsGroup.append('circle')
          .attr('cx', pos[0]).attr('cy', pos[1])
          .attr('r', isSelected ? 8 : 5)
          .attr('fill', 'none').attr('stroke', color)
          .attr('opacity', isSelected ? 0.6 : 0.3)
          .attr('stroke-width', isSelected ? 1.5 : 0.5)
          .attr('class', 'pulse-ring')

        // Core dot
        dotsGroup.append('circle')
          .attr('cx', pos[0]).attr('cy', pos[1])
          .attr('r', isSelected ? 4 : 2.5)
          .attr('fill', color)
          .attr('opacity', isSelected ? 1 : 0.85)
          .style('cursor', 'pointer')
          .on('click', () => { if (onCountryClick) onCountryClick(evt.country) })
      })

      // Real feed geolocated IPs (from API)
      if (feedGeoIPs && feedGeoIPs.length > 0) {
        feedGeoIPs.forEach(geo => {
          const pos = projection([geo.lon, geo.lat])
          if (!pos) return
          const isSelected = selectedCountry && geo.countryCode === selectedCountry
          if (!isSelected && selectedCountry) return
          dotsGroup.append('circle')
            .attr('cx', pos[0]).attr('cy', pos[1])
            .attr('r', isSelected ? 3.5 : 2)
            .attr('fill', theme.critical)
            .attr('opacity', isSelected ? 0.9 : 0.4)
            .style('cursor', 'pointer')
            .on('click', () => { if (onCountryClick) onCountryClick(geo.countryCode) })
        })
      }

      // Destination marker (your network)
      const dstPos = projection(DEST_COORDS)
      if (dstPos) {
        dotsGroup.append('circle')
          .attr('cx', dstPos[0]).attr('cy', dstPos[1]).attr('r', 6)
          .attr('fill', theme.primary).attr('opacity', 0.2).attr('filter', 'url(#dot-glow)')
        dotsGroup.append('circle')
          .attr('cx', dstPos[0]).attr('cy', dstPos[1]).attr('r', 4)
          .attr('fill', theme.primary).attr('opacity', 0.9)
        dotsGroup.append('circle')
          .attr('cx', dstPos[0]).attr('cy', dstPos[1]).attr('r', 8)
          .attr('fill', 'none').attr('stroke', theme.primary)
          .attr('stroke-width', 1.5).attr('opacity', 0.5)
          .attr('class', 'pulse-ring')
      }

      // Animated expanding ring on newest event
      if (recentEvents.length > 0) {
        const newest = recentEvents[0]
        const pos = projection([newest.lon, newest.lat])
        if (pos) {
          const color = sevColorMap[newest.severity] || theme.primary
          dotsGroup.append('circle')
            .attr('cx', pos[0]).attr('cy', pos[1]).attr('r', 3)
            .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('opacity', 1)
            .transition().duration(1500).attr('r', 18).attr('opacity', 0).remove()
        }
      }
    }
    renderDotsAndArcs()

    // Drag to rotate
    const drag = d3.drag()
      .on('start', () => {
        globeCircle.style('cursor', 'grabbing')
      })
      .on('drag', (event) => {
        const r = rotationRef.current
        rotationRef.current = [r[0] + event.dx * 0.4, Math.max(-60, Math.min(60, r[1] - event.dy * 0.4)), r[2]]
        projection.rotate(rotationRef.current)
        renderGraticule()
        renderLand()
        renderDotsAndArcs()
      })
      .on('end', () => {
        globeCircle.style('cursor', 'grab')
      })

    svg.call(drag)

    return () => {}
  }, [events, theme, selectedCountry, feedGeoIPs, ref.current?.getAttribute('data-loaded')])

  return <svg ref={ref} width={size} height={size} style={{ display: 'block', margin: '0 auto' }} />
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

// ─── REAL FEED FETCHING (via Vercel API proxy) ──────────────────────────────

async function fetchFeedData() {
  try {
    const res = await fetch('/api/feeds')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
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
  const [feedData, setFeedData] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState('')
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

  // Fetch real feed data from API on mount (refreshes every 5 min)
  useEffect(() => {
    fetchFeedData().then(d => { if (d) setFeedData(d) })
    const interval = setInterval(() => {
      fetchFeedData().then(d => { if (d) setFeedData(d) })
    }, 300000)
    return () => clearInterval(interval)
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

  // Filtered events (includes country filter)
  const filteredEvents = useMemo(() => {
    let f = events
    if (selectedCountry) f = f.filter(e => e.country === selectedCountry)
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
  }, [events, sevFilter, search, selectedCountry])

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
      fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em',
      color: theme.logoText, fontFamily: FONTS.sans,
      whiteSpace: 'nowrap',
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
    threeCol: { display: 'grid', gridTemplateColumns: '440px 1fr 240px', gap: 20, marginBottom: 24 },
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
    countrySelect: {
      padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.border}`,
      background: theme.surface, color: theme.text, fontSize: 13,
      fontFamily: FONTS.sans, outline: 'none', cursor: 'pointer',
      transition: 'border-color 0.2s',
    },
  }

  // ─── RENDER TABS ─────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Country Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <select
          style={s.countrySelect}
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value)}
        >
          <option value="">All Countries</option>
          {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>
        {selectedCountry && (
          <button
            style={{ ...s.filterBtn(false), fontSize: 12 }}
            onClick={() => setSelectedCountry('')}
          >
            Clear Filter
          </button>
        )}
        {selectedCountry && (
          <span style={{ fontSize: 13, color: theme.textSecondary }}>
            {filteredEvents.length} events from {COUNTRIES.find(c => c.code === selectedCountry)?.name}
          </span>
        )}
      </div>

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
          <Globe events={events} theme={theme} onCountryClick={setSelectedCountry} selectedCountry={selectedCountry} feedGeoIPs={feedData?.geolocatedIPs} />
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
        <select style={s.countrySelect} value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
          <option value="">All Countries</option>
          {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
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
            { label: 'Log Pipeline', value: 'Logstash + Elasticsearch' },
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
    // Merge real API data with local feed list
    const apiFeedMap = {}
    if (feedData?.feeds) {
      feedData.feeds.forEach(f => { apiFeedMap[f.id] = f })
    }
    const simFeedCounts = {}
    events.forEach(e => { simFeedCounts[e.feed] = (simFeedCounts[e.feed] || 0) + 1 })

    // Country-filtered IoCs from real feed data
    const countryIoCs = selectedCountry && feedData?.countryBreakdown
      ? feedData.countryBreakdown.find(c => c.code === selectedCountry)
      : null

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Country filter for Intel Feeds */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <select style={s.countrySelect} value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
            <option value="">All Countries</option>
            {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
          {selectedCountry && (
            <button style={{ ...s.filterBtn(false), fontSize: 12 }} onClick={() => setSelectedCountry('')}>
              Clear Filter
            </button>
          )}
          {selectedCountry && countryIoCs && (
            <span style={{ fontSize: 13, color: theme.textSecondary }}>
              {countryIoCs.count} malicious IPs from {countryIoCs.name}
            </span>
          )}
          {selectedCountry && !countryIoCs && feedData && (
            <span style={{ fontSize: 13, color: theme.textMuted }}>
              No feed IoCs geolocated to {COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry}
            </span>
          )}
        </div>

        {feedData && (
          <div style={{ ...s.panel, marginBottom: 20, display: 'flex', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Total Live IoCs</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.mono, color: theme.primary }}>{feedData.totalIoCs.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Active Feeds</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.mono, color: theme.low }}>{feedData.feeds.filter(f => f.status === 'active').length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Last Sync</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONTS.mono, color: theme.textSecondary }}>{new Date(feedData.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        )}
        <div style={s.feedGrid}>
          {FEEDS.map(feed => {
            const apiData = apiFeedMap[feed.id]
            const isLive = apiData?.status === 'active'
            // When country is selected, show country-specific count from that feed
            const countryCount = selectedCountry && apiData?.countries
              ? apiData.countries.find(c => c.code === selectedCountry)?.count
              : null
            const displayCount = countryCount != null
              ? countryCount
              : (isLive ? apiData.count : (simFeedCounts[feed.name] || rand(10, 200)))
            const statusColor = isLive ? theme.low : (apiData?.status === 'error' ? theme.critical : theme.textMuted)
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
                      {displayCount != null ? displayCount.toLocaleString() : '\u2014'}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{countryCount != null ? `IoCs in ${selectedCountry}` : (isLive ? 'live IoCs' : 'events')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{isLive ? 'LIVE' : (apiData?.status === 'error' ? 'ERROR' : 'ACTIVE')}</div>
                    {apiData?.lastSync && (
                      <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: FONTS.mono }}>
                        {new Date(apiData.lastSync).toLocaleTimeString()}
                      </div>
                    )}
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
              DANIEL{' '}<span style={{ color: BRAND.blue }}>LEGALL</span>
            </span>
            <span style={{ width: 1, height: 24, background: theme.border, margin: '0 8px' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.navText }}>Threat Dashboard</span>
          </div>
          <div style={s.headerRight}>
            <span style={s.statusLabel}><span style={s.statusDot(theme.low)} />T-Pot</span>
            <span style={s.statusLabel}><span style={s.statusDot(theme.low)} />{feedData ? feedData.feeds.filter(f => f.status === 'active').length : FEEDS.length} Feeds</span>
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
