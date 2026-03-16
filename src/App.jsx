import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const FONTS = {
  sans: "Poppins, 'Poppins Fallback', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'IBM Plex Mono Fallback', 'SF Mono', monospace",
}

const BRAND = {
  magenta: '#e91e8c',
  magentaLight: '#ff4db8',
  magentaDark: '#b8166e',
  magentaBg: 'rgba(233,30,140,0.12)',
  magentaGlow: 'rgba(233,30,140,0.4)',
}

const THEME = {
  bg: '#0d0d14',
  surface: '#13131f',
  surfaceAlt: '#181828',
  surfaceHover: '#1e1e30',
  border: '#252538',
  borderLight: '#2f2f48',
  text: '#e8e8f0',
  textSecondary: '#8888a8',
  textMuted: '#555570',
  accent: BRAND.magenta,
  accentLight: BRAND.magentaLight,
  accentBg: BRAND.magentaBg,
  critical: '#ef4444',
  criticalBg: 'rgba(239,68,68,0.12)',
  high: '#f59e0b',
  highBg: 'rgba(245,158,11,0.12)',
  medium: '#eab308',
  mediumBg: 'rgba(234,179,8,0.12)',
  low: '#22c55e',
  lowBg: 'rgba(34,197,94,0.12)',
  info: '#60a5fa',
  infoBg: 'rgba(96,165,250,0.12)',
  mapLand: '#2a2a40',
  mapBorder: '#e91e8c',
  mapOcean: '#0d0d14',
  dotGreen: '#66cc66',
  dotBlue: '#6699ff',
  dotYellow: '#ffcc33',
  dotRed: '#ff4444',
}

const ATTACK_TYPES = [
  'Brute Force SSH', 'Port Scan', 'SQL Injection', 'XSS Attempt', 'DDoS SYN Flood',
  'Malware C2 Beacon', 'Phishing Link', 'DNS Tunneling', 'RDP Exploit', 'Log4j Probe',
  'SMB Exploit', 'Credential Stuffing', 'IoT Botnet Scan', 'Meraki VPN Probe', 'FortiGate IPS Alert',
]

const ALERT_CATEGORIES = [
  { name: 'Unclassified', color: '#ff4466' },
  { name: 'File Sharing', color: '#6699ff' },
  { name: 'Remote Administration', color: '#66cc66' },
  { name: 'Web', color: '#66cccc' },
  { name: 'Database', color: '#ffcc33' },
  { name: 'VoIP', color: '#cc66ff' },
  { name: 'Network Service', color: '#ff8866' },
  { name: 'Mail', color: '#88aaff' },
]

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', lat: 33.9, lon: 67.7 },
  { code: 'AL', name: 'Albania', lat: 41.1, lon: 20.1 },
  { code: 'DZ', name: 'Algeria', lat: 28.0, lon: 1.6 },
  { code: 'AD', name: 'Andorra', lat: 42.5, lon: 1.5 },
  { code: 'AO', name: 'Angola', lat: -11.2, lon: 17.8 },
  { code: 'AG', name: 'Antigua & Barbuda', lat: 17.0, lon: -61.8 },
  { code: 'AR', name: 'Argentina', lat: -38.4, lon: -63.6 },
  { code: 'AM', name: 'Armenia', lat: 40.0, lon: 45.0 },
  { code: 'AU', name: 'Australia', lat: -25.2, lon: 133.7 },
  { code: 'AT', name: 'Austria', lat: 47.5, lon: 14.5 },
  { code: 'AZ', name: 'Azerbaijan', lat: 40.1, lon: 47.5 },
  { code: 'BS', name: 'Bahamas', lat: 25.0, lon: -77.3 },
  { code: 'BH', name: 'Bahrain', lat: 26.0, lon: 50.5 },
  { code: 'BD', name: 'Bangladesh', lat: 23.6, lon: 90.3 },
  { code: 'BB', name: 'Barbados', lat: 13.1, lon: -59.6 },
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
  { code: 'BI', name: 'Burundi', lat: -3.3, lon: 29.9 },
  { code: 'CV', name: 'Cabo Verde', lat: 16.0, lon: -24.0 },
  { code: 'KH', name: 'Cambodia', lat: 12.5, lon: 104.9 },
  { code: 'CM', name: 'Cameroon', lat: 7.3, lon: 12.3 },
  { code: 'CA', name: 'Canada', lat: 56.1, lon: -106.3 },
  { code: 'CF', name: 'Central African Republic', lat: 6.6, lon: 20.9 },
  { code: 'TD', name: 'Chad', lat: 15.4, lon: 18.7 },
  { code: 'CL', name: 'Chile', lat: -35.6, lon: -71.2 },
  { code: 'CN', name: 'China', lat: 35.8, lon: 104.1 },
  { code: 'CO', name: 'Colombia', lat: 4.5, lon: -74.2 },
  { code: 'KM', name: 'Comoros', lat: -11.6, lon: 43.3 },
  { code: 'CD', name: 'Congo (DRC)', lat: -4.0, lon: 21.7 },
  { code: 'CG', name: 'Congo (Republic)', lat: -0.2, lon: 15.8 },
  { code: 'CR', name: 'Costa Rica', lat: 9.7, lon: -83.7 },
  { code: 'CI', name: "C\u00f4te d'Ivoire", lat: 7.5, lon: -5.5 },
  { code: 'HR', name: 'Croatia', lat: 45.1, lon: 15.2 },
  { code: 'CU', name: 'Cuba', lat: 21.5, lon: -77.7 },
  { code: 'CY', name: 'Cyprus', lat: 35.1, lon: 33.4 },
  { code: 'CZ', name: 'Czech Republic', lat: 49.8, lon: 15.4 },
  { code: 'DK', name: 'Denmark', lat: 56.2, lon: 9.5 },
  { code: 'DJ', name: 'Djibouti', lat: 11.8, lon: 42.6 },
  { code: 'DM', name: 'Dominica', lat: 15.4, lon: -61.4 },
  { code: 'DO', name: 'Dominican Republic', lat: 18.7, lon: -70.1 },
  { code: 'EC', name: 'Ecuador', lat: -1.8, lon: -78.1 },
  { code: 'EG', name: 'Egypt', lat: 26.8, lon: 30.8 },
  { code: 'SV', name: 'El Salvador', lat: 13.7, lon: -88.8 },
  { code: 'GQ', name: 'Equatorial Guinea', lat: 1.6, lon: 10.2 },
  { code: 'ER', name: 'Eritrea', lat: 15.1, lon: 39.8 },
  { code: 'EE', name: 'Estonia', lat: 58.5, lon: 25.0 },
  { code: 'SZ', name: 'Eswatini', lat: -26.5, lon: 31.4 },
  { code: 'ET', name: 'Ethiopia', lat: 9.1, lon: 40.4 },
  { code: 'FJ', name: 'Fiji', lat: -17.7, lon: 178.0 },
  { code: 'FI', name: 'Finland', lat: 61.9, lon: 25.7 },
  { code: 'FR', name: 'France', lat: 46.2, lon: 2.2 },
  { code: 'GA', name: 'Gabon', lat: -0.8, lon: 11.6 },
  { code: 'GM', name: 'Gambia', lat: 13.4, lon: -15.3 },
  { code: 'GE', name: 'Georgia', lat: 42.3, lon: 43.3 },
  { code: 'DE', name: 'Germany', lat: 51.1, lon: 10.4 },
  { code: 'GH', name: 'Ghana', lat: 7.9, lon: -1.0 },
  { code: 'GR', name: 'Greece', lat: 39.0, lon: 21.8 },
  { code: 'GD', name: 'Grenada', lat: 12.1, lon: -61.7 },
  { code: 'GT', name: 'Guatemala', lat: 15.7, lon: -90.2 },
  { code: 'GN', name: 'Guinea', lat: 9.9, lon: -9.6 },
  { code: 'GW', name: 'Guinea-Bissau', lat: 11.8, lon: -15.2 },
  { code: 'GY', name: 'Guyana', lat: 4.8, lon: -58.9 },
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
  { code: 'KI', name: 'Kiribati', lat: 1.8, lon: -157.4 },
  { code: 'XK', name: 'Kosovo', lat: 42.6, lon: 20.9 },
  { code: 'KW', name: 'Kuwait', lat: 29.3, lon: 47.4 },
  { code: 'KG', name: 'Kyrgyzstan', lat: 41.2, lon: 74.7 },
  { code: 'LA', name: 'Laos', lat: 19.8, lon: 102.4 },
  { code: 'LV', name: 'Latvia', lat: 56.8, lon: 24.6 },
  { code: 'LB', name: 'Lebanon', lat: 33.8, lon: 35.8 },
  { code: 'LS', name: 'Lesotho', lat: -29.6, lon: 28.2 },
  { code: 'LR', name: 'Liberia', lat: 6.4, lon: -9.4 },
  { code: 'LY', name: 'Libya', lat: 26.3, lon: 17.2 },
  { code: 'LI', name: 'Liechtenstein', lat: 47.1, lon: 9.5 },
  { code: 'LT', name: 'Lithuania', lat: 55.1, lon: 23.8 },
  { code: 'LU', name: 'Luxembourg', lat: 49.8, lon: 6.1 },
  { code: 'MO', name: 'Macau', lat: 22.2, lon: 113.5 },
  { code: 'MG', name: 'Madagascar', lat: -18.7, lon: 46.8 },
  { code: 'MW', name: 'Malawi', lat: -13.2, lon: 34.3 },
  { code: 'MY', name: 'Malaysia', lat: 4.2, lon: 101.9 },
  { code: 'MV', name: 'Maldives', lat: 3.2, lon: 73.2 },
  { code: 'ML', name: 'Mali', lat: 17.5, lon: -3.9 },
  { code: 'MT', name: 'Malta', lat: 35.9, lon: 14.3 },
  { code: 'MH', name: 'Marshall Islands', lat: 7.1, lon: 171.2 },
  { code: 'MR', name: 'Mauritania', lat: 21.0, lon: -10.9 },
  { code: 'MU', name: 'Mauritius', lat: -20.3, lon: 57.5 },
  { code: 'MX', name: 'Mexico', lat: 23.6, lon: -102.5 },
  { code: 'FM', name: 'Micronesia', lat: 7.4, lon: 150.5 },
  { code: 'MD', name: 'Moldova', lat: 47.4, lon: 28.3 },
  { code: 'MC', name: 'Monaco', lat: 43.7, lon: 7.4 },
  { code: 'MN', name: 'Mongolia', lat: 46.8, lon: 103.8 },
  { code: 'ME', name: 'Montenegro', lat: 42.7, lon: 19.3 },
  { code: 'MA', name: 'Morocco', lat: 31.7, lon: -7.0 },
  { code: 'MZ', name: 'Mozambique', lat: -18.6, lon: 35.5 },
  { code: 'MM', name: 'Myanmar', lat: 21.9, lon: 95.9 },
  { code: 'NA', name: 'Namibia', lat: -22.9, lon: 18.4 },
  { code: 'NR', name: 'Nauru', lat: -0.5, lon: 166.9 },
  { code: 'NP', name: 'Nepal', lat: 28.3, lon: 84.1 },
  { code: 'NL', name: 'Netherlands', lat: 52.1, lon: 5.2 },
  { code: 'NZ', name: 'New Zealand', lat: -40.9, lon: 174.8 },
  { code: 'NI', name: 'Nicaragua', lat: 12.8, lon: -85.2 },
  { code: 'NE', name: 'Niger', lat: 17.6, lon: 8.0 },
  { code: 'NG', name: 'Nigeria', lat: 9.0, lon: 8.6 },
  { code: 'KP', name: 'North Korea', lat: 40.3, lon: 127.5 },
  { code: 'MK', name: 'North Macedonia', lat: 41.5, lon: 21.7 },
  { code: 'NO', name: 'Norway', lat: 60.4, lon: 8.4 },
  { code: 'OM', name: 'Oman', lat: 21.4, lon: 55.9 },
  { code: 'PK', name: 'Pakistan', lat: 30.3, lon: 69.3 },
  { code: 'PW', name: 'Palau', lat: 7.5, lon: 134.6 },
  { code: 'PS', name: 'Palestine', lat: 31.9, lon: 35.2 },
  { code: 'PA', name: 'Panama', lat: 8.5, lon: -80.7 },
  { code: 'PG', name: 'Papua New Guinea', lat: -6.3, lon: 143.9 },
  { code: 'PY', name: 'Paraguay', lat: -23.4, lon: -58.4 },
  { code: 'PE', name: 'Peru', lat: -9.1, lon: -75.0 },
  { code: 'PH', name: 'Philippines', lat: 12.8, lon: 121.7 },
  { code: 'PL', name: 'Poland', lat: 51.9, lon: 19.1 },
  { code: 'PT', name: 'Portugal', lat: 39.3, lon: -8.2 },
  { code: 'PR', name: 'Puerto Rico', lat: 18.2, lon: -66.5 },
  { code: 'QA', name: 'Qatar', lat: 25.3, lon: 51.1 },
  { code: 'RO', name: 'Romania', lat: 45.9, lon: 24.9 },
  { code: 'RU', name: 'Russia', lat: 61.5, lon: 105.3 },
  { code: 'RW', name: 'Rwanda', lat: -1.9, lon: 29.8 },
  { code: 'KN', name: 'Saint Kitts & Nevis', lat: 17.3, lon: -62.7 },
  { code: 'LC', name: 'Saint Lucia', lat: 13.9, lon: -60.9 },
  { code: 'VC', name: 'Saint Vincent & Grenadines', lat: 12.9, lon: -61.2 },
  { code: 'WS', name: 'Samoa', lat: -13.7, lon: -172.1 },
  { code: 'SM', name: 'San Marino', lat: 43.9, lon: 12.4 },
  { code: 'ST', name: 'S\u00e3o Tom\u00e9 & Pr\u00edncipe', lat: 0.1, lon: 6.6 },
  { code: 'SA', name: 'Saudi Arabia', lat: 23.8, lon: 45.0 },
  { code: 'SN', name: 'Senegal', lat: 14.4, lon: -14.4 },
  { code: 'RS', name: 'Serbia', lat: 44.0, lon: 21.0 },
  { code: 'SC', name: 'Seychelles', lat: -4.6, lon: 55.4 },
  { code: 'SL', name: 'Sierra Leone', lat: 8.4, lon: -11.7 },
  { code: 'SG', name: 'Singapore', lat: 1.3, lon: 103.8 },
  { code: 'SK', name: 'Slovakia', lat: 48.6, lon: 19.6 },
  { code: 'SI', name: 'Slovenia', lat: 46.1, lon: 14.9 },
  { code: 'SB', name: 'Solomon Islands', lat: -9.6, lon: 160.1 },
  { code: 'SO', name: 'Somalia', lat: 5.1, lon: 46.1 },
  { code: 'ZA', name: 'South Africa', lat: -30.5, lon: 22.9 },
  { code: 'KR', name: 'South Korea', lat: 35.9, lon: 127.7 },
  { code: 'SS', name: 'South Sudan', lat: 6.8, lon: 31.3 },
  { code: 'ES', name: 'Spain', lat: 40.4, lon: -3.7 },
  { code: 'LK', name: 'Sri Lanka', lat: 7.8, lon: 80.7 },
  { code: 'SD', name: 'Sudan', lat: 12.8, lon: 30.2 },
  { code: 'SR', name: 'Suriname', lat: 3.9, lon: -56.0 },
  { code: 'SE', name: 'Sweden', lat: 60.1, lon: 18.6 },
  { code: 'CH', name: 'Switzerland', lat: 46.8, lon: 8.2 },
  { code: 'SY', name: 'Syria', lat: 34.8, lon: 38.9 },
  { code: 'TW', name: 'Taiwan', lat: 23.6, lon: 120.9 },
  { code: 'TJ', name: 'Tajikistan', lat: 38.8, lon: 71.2 },
  { code: 'TZ', name: 'Tanzania', lat: -6.3, lon: 34.8 },
  { code: 'TH', name: 'Thailand', lat: 15.8, lon: 100.9 },
  { code: 'TL', name: 'Timor-Leste', lat: -8.8, lon: 125.7 },
  { code: 'TG', name: 'Togo', lat: 8.6, lon: 1.2 },
  { code: 'TO', name: 'Tonga', lat: -21.2, lon: -175.2 },
  { code: 'TT', name: 'Trinidad & Tobago', lat: 10.4, lon: -61.2 },
  { code: 'TN', name: 'Tunisia', lat: 33.8, lon: 9.5 },
  { code: 'TR', name: 'Turkey', lat: 38.9, lon: 35.2 },
  { code: 'TM', name: 'Turkmenistan', lat: 38.9, lon: 59.5 },
  { code: 'TV', name: 'Tuvalu', lat: -7.1, lon: 177.6 },
  { code: 'UG', name: 'Uganda', lat: 1.3, lon: 32.2 },
  { code: 'UA', name: 'Ukraine', lat: 48.3, lon: 31.1 },
  { code: 'AE', name: 'United Arab Emirates', lat: 23.4, lon: 53.8 },
  { code: 'GB', name: 'United Kingdom', lat: 55.3, lon: -3.4 },
  { code: 'US', name: 'United States', lat: 39.8, lon: -98.5 },
  { code: 'UY', name: 'Uruguay', lat: -32.5, lon: -55.7 },
  { code: 'UZ', name: 'Uzbekistan', lat: 41.3, lon: 64.5 },
  { code: 'VU', name: 'Vanuatu', lat: -15.3, lon: 166.9 },
  { code: 'VA', name: 'Vatican City', lat: 41.9, lon: 12.4 },
  { code: 'VE', name: 'Venezuela', lat: 6.4, lon: -66.5 },
  { code: 'VN', name: 'Vietnam', lat: 14.0, lon: 108.2 },
  { code: 'YE', name: 'Yemen', lat: 15.5, lon: 48.5 },
  { code: 'ZM', name: 'Zambia', lat: -13.1, lon: 27.8 },
  { code: 'ZW', name: 'Zimbabwe', lat: -19.0, lon: 29.1 },
]

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'DNS', 'SMTP', 'FTP', 'RDP', 'SMB', 'SNMP', 'MQTT', 'MODBUS', 'TLS']

const DETECTION_SOURCES = ['T-Pot Honeypot', 'FortiGate IPS', 'Meraki Firewall', 'Suricata IDS', 'Threat Feed', 'Synology Logs']

const TABS = ['Overview', 'Threat Events', 'Honeypot', 'Intel Feeds']

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
  const dstCountry = pick(COUNTRIES)
  const severity = pickSeverity()
  return {
    id,
    time: new Date(Date.now() - rand(0, 300000)),
    severity,
    attackType: pick(ATTACK_TYPES),
    category: pick(ALERT_CATEGORIES).name,
    srcIP: randomIP(),
    dstIP: randomPrivateIP(),
    country: country.code,
    countryName: country.name,
    lat: country.lat + (Math.random() - 0.5) * 5,
    lon: country.lon + (Math.random() - 0.5) * 5,
    dstCountry: dstCountry.code,
    dstCountryName: dstCountry.name,
    dstLat: dstCountry.lat + (Math.random() - 0.5) * 5,
    dstLon: dstCountry.lon + (Math.random() - 0.5) * 5,
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

function formatDateTime() {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
}

// ─── LOGO SVG ───────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg viewBox="0 0 2000 2000" width={44} height={44} style={{ display: 'block' }}>
      <polygon
        points="892.9,989.61 792.23,1212.63 580.92,1212.63 723.61,896.55 934.91,896.55"
        fill={BRAND.magenta}
      />
      <path
        d="M1115.89,1196.06l-94.42,209.18h-316.2l86.95-192.61h241.28c22.19,0,43.34-3.37,63.24-9.55C1103.25,1201.07,1109.67,1198.71,1115.89,1196.06z"
        fill="#ffffff"
      />
      <path
        d="M1438.74,1000c0,41.73-6.38,82.34-18.26,120.46c-11.88,38.16-29.17,73.83-51.04,106.17c-43.66,64.6-105.33,115.88-178.2,146.7c-33.35,14.12-69.06,23.92-106.21,28.65l137.39-304.36c2.57-4.86,9.87-22.03,10.07-22.55c8.79-23.27,13.6-48.43,13.64-75.08c-0.04-22.23-3.37-43.38-9.55-63.28c-6.22-19.9-15.25-38.56-26.72-55.54c-22.95-33.99-55.62-61.07-93.66-77.16c-25.36-10.71-53.09-16.65-82.7-16.65H561.26l95.58-192.61h376.67c41.73,0,82.3,6.34,120.46,18.22c38.12,11.88,73.83,29.21,106.17,51.04c64.6,43.66,115.89,105.37,146.7,178.2C1427.39,890.78,1438.74,944.3,1438.74,1000z"
        fill="#ffffff"
      />
    </svg>
  )
}

// ─── AREA CHART COMPONENT (Alerts over time) ────────────────────────────────

function AlertAreaChart({ data, width = 340, height = 180 }) {
  const ref = useRef()
  useEffect(() => {
    if (!ref.current || !data.length) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const margin = { top: 10, right: 10, bottom: 25, left: 40 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, w])
    const y = d3.scaleLinear().domain([0, d3.max(data) * 1.2]).range([h, 0])

    // Grid lines
    g.selectAll('.grid-line')
      .data(y.ticks(4))
      .enter().append('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', THEME.border).attr('stroke-width', 0.5)

    // Y axis labels
    g.selectAll('.y-label')
      .data(y.ticks(4))
      .enter().append('text')
      .attr('x', -8).attr('y', d => y(d) + 4)
      .attr('text-anchor', 'end')
      .attr('fill', THEME.textMuted).attr('font-size', 9)
      .attr('font-family', FONTS.mono)
      .text(d => d >= 1000 ? `${(d/1000).toFixed(0)}k` : d)

    // Area
    const area = d3.area()
      .x((_, i) => x(i))
      .y0(h)
      .y1(d => y(d))
      .curve(d3.curveBasis)

    const gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'area-grad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1)
    gradient.append('stop').attr('offset', '0%').attr('stop-color', BRAND.magenta).attr('stop-opacity', 0.4)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', BRAND.magenta).attr('stop-opacity', 0.02)

    g.append('path').datum(data).attr('d', area).attr('fill', 'url(#area-grad)')

    // Line
    const line = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveBasis)
    g.append('path').datum(data).attr('d', line)
      .attr('fill', 'none').attr('stroke', BRAND.magenta).attr('stroke-width', 2)

    // X axis labels
    const labels = ['0h', '6h', '12h', '18h', '24h']
    const step = (data.length - 1) / (labels.length - 1)
    labels.forEach((label, i) => {
      g.append('text')
        .attr('x', x(Math.round(i * step)))
        .attr('y', h + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', THEME.textMuted).attr('font-size', 9)
        .attr('font-family', FONTS.mono)
        .text(label)
    })
  }, [data, width, height])
  return <svg ref={ref} width={width} height={height} />
}

// ─── FLAT WORLD MAP COMPONENT ───────────────────────────────────────────────

let worldDataCache = null
async function loadWorldData() {
  if (worldDataCache) return worldDataCache
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  worldDataCache = await res.json()
  return worldDataCache
}

function WorldMap({ events, onCountryClick, selectedCountry, feedGeoIPs }) {
  const svgRef = useRef()
  const containerRef = useRef()
  const worldRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })
  const arcsTimerRef = useRef(null)

  useEffect(() => {
    loadWorldData().then(data => { worldRef.current = data })
  }, [])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      setDimensions({ width, height: Math.max(320, width * 0.48) })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !worldRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions

    const projection = d3.geoNaturalEarth1()
      .fitSize([width, height], { type: 'Sphere' })

    const path = d3.geoPath().projection(projection)

    // Defs
    const defs = svg.append('defs')
    const glow = defs.append('filter').attr('id', 'attack-glow')
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 4)

    const arcGlow = defs.append('filter').attr('id', 'arc-glow')
    arcGlow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 2)

    // Countries
    const countries = topojson.feature(worldRef.current, worldRef.current.objects.countries)
    svg.append('g')
      .selectAll('path')
      .data(countries.features)
      .enter().append('path')
      .attr('d', path)
      .attr('fill', THEME.mapLand)
      .attr('stroke', BRAND.magenta)
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 0.5)

    // Get relevant events
    const recentEvents = events.slice(0, 80)
    const visibleEvents = selectedCountry
      ? recentEvents.filter(e => e.country === selectedCountry || e.dstCountry === selectedCountry)
      : recentEvents

    // Arc lines group
    const arcsGroup = svg.append('g')
    // Dots group
    const dotsGroup = svg.append('g')

    // Unique location dots - collect both src and dst
    const locationMap = new Map()
    visibleEvents.forEach(evt => {
      const srcKey = `${evt.lat.toFixed(1)},${evt.lon.toFixed(1)}`
      if (!locationMap.has(srcKey)) {
        locationMap.set(srcKey, { code: evt.country, name: evt.countryName, lon: evt.lon, lat: evt.lat, hits: 0, type: 'source', severity: evt.severity })
      }
      locationMap.get(srcKey).hits++

      const dstKey = `${evt.dstLat.toFixed(1)},${evt.dstLon.toFixed(1)}`
      if (!locationMap.has(dstKey)) {
        locationMap.set(dstKey, { code: evt.dstCountry, name: evt.dstCountryName, lon: evt.dstLon, lat: evt.dstLat, hits: 0, type: 'target', severity: evt.severity })
      }
      locationMap.get(dstKey).hits++
    })

    // Draw dots
    locationMap.forEach((loc) => {
      const pos = projection([loc.lon, loc.lat])
      if (!pos) return
      const isSelected = selectedCountry && loc.code === selectedCountry
      const baseSize = Math.min(2 + loc.hits * 0.4, 7)
      const color = loc.type === 'target'
        ? THEME.dotBlue
        : (loc.severity === 'critical' ? THEME.dotRed : loc.severity === 'high' ? THEME.dotYellow : THEME.dotGreen)

      // Glow
      dotsGroup.append('circle')
        .attr('cx', pos[0]).attr('cy', pos[1])
        .attr('r', baseSize + 4)
        .attr('fill', color).attr('opacity', 0.15)
        .attr('filter', 'url(#attack-glow)')

      // Core dot
      dotsGroup.append('circle')
        .attr('cx', pos[0]).attr('cy', pos[1])
        .attr('r', isSelected ? baseSize + 1 : baseSize)
        .attr('fill', color)
        .attr('opacity', isSelected ? 1 : 0.8)
        .style('cursor', 'pointer')
        .on('click', () => {
          if (onCountryClick) onCountryClick(selectedCountry === loc.code ? '' : loc.code)
        })

      // Label for selected
      if (isSelected) {
        dotsGroup.append('text')
          .attr('x', pos[0]).attr('y', pos[1] - baseSize - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff').attr('font-size', 11)
          .attr('font-family', FONTS.sans).attr('font-weight', 600)
          .attr('stroke', 'rgba(0,0,0,0.7)').attr('stroke-width', 2.5)
          .attr('paint-order', 'stroke')
          .text(`${loc.name} (${loc.hits})`)
      }
    })

    // Real feed geolocated IPs
    if (feedGeoIPs?.length > 0) {
      feedGeoIPs.forEach(geo => {
        if (selectedCountry && geo.countryCode !== selectedCountry) return
        const pos = projection([geo.lon, geo.lat])
        if (!pos) return
        dotsGroup.append('circle')
          .attr('cx', pos[0]).attr('cy', pos[1])
          .attr('r', 2.5)
          .attr('fill', BRAND.magenta)
          .attr('opacity', 0.5)
      })
    }

    // Animated arc lines — staggered for continuous effect
    let arcIndex = 0
    function spawnArc() {
      if (!visibleEvents.length) return
      const evt = visibleEvents[arcIndex % visibleEvents.length]
      arcIndex++

      const srcPos = projection([evt.lon, evt.lat])
      const dstPos = projection([evt.dstLon, evt.dstLat])
      if (!srcPos || !dstPos) return

      const arcData = {
        type: 'LineString',
        coordinates: [[evt.lon, evt.lat], [evt.dstLon, evt.dstLat]],
      }
      const arcPath = path(arcData)
      if (!arcPath) return

      const color = evt.severity === 'critical' ? THEME.dotRed
        : evt.severity === 'high' ? THEME.dotYellow
        : BRAND.magenta

      const arc = arcsGroup.append('path')
        .attr('d', arcPath)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0)
        .attr('filter', 'url(#arc-glow)')

      const totalLen = arc.node()?.getTotalLength?.()
      if (totalLen) {
        arc
          .attr('stroke-dasharray', `${totalLen},${totalLen}`)
          .attr('stroke-dashoffset', totalLen)
          .attr('stroke-opacity', 0.7)
          .transition().duration(1500).ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .transition().duration(800)
          .attr('stroke-opacity', 0)
          .remove()

        // Impact pulse at destination
        dotsGroup.append('circle')
          .attr('cx', dstPos[0]).attr('cy', dstPos[1])
          .attr('r', 3)
          .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('opacity', 0.8)
          .transition().delay(1500).duration(800)
          .attr('r', 15).attr('opacity', 0).remove()
      }
    }

    // Spawn initial batch
    for (let i = 0; i < 5; i++) setTimeout(() => spawnArc(), i * 300)

    // Continuous arc spawning
    arcsTimerRef.current = setInterval(() => {
      const count = rand(1, 3)
      for (let i = 0; i < count; i++) setTimeout(() => spawnArc(), i * 200)
    }, 1200)

    return () => {
      if (arcsTimerRef.current) clearInterval(arcsTimerRef.current)
    }
  }, [events, selectedCountry, feedGeoIPs, dimensions, worldRef.current])

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />
    </div>
  )
}

// ─── REAL FEED FETCHING ──────────────────────────────────────────────────────

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
  const [tab, setTab] = useState(0)
  const [live, setLive] = useState(true)
  const [events, setEvents] = useState(() => generateInitialEvents(200))
  const [clock, setClock] = useState(formatDateTime())
  const [sevFilter, setSevFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [feedData, setFeedData] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState('')
  const nextId = useRef(200)

  // Rolling alert counters
  const [alerts60s, setAlerts60s] = useState(rand(100000, 200000))
  const [alerts1h, setAlerts1h] = useState(0)
  const [alerts24h, setAlerts24h] = useState(0)

  // Area chart history data
  const [chartData] = useState(() => {
    const data = []
    for (let i = 0; i < 48; i++) data.push(rand(50, 350))
    return data
  })

  // Clock + rolling counters
  useEffect(() => {
    const t = setInterval(() => {
      setClock(formatDateTime())
      setAlerts60s(prev => prev + rand(50, 500))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Update 1h and 24h counters
  useEffect(() => {
    setAlerts1h(alerts60s * 60)
    setAlerts24h(alerts60s * 1440)
  }, [alerts60s])

  // Fetch real feed data
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
    }, 2000)
    return () => clearInterval(t)
  }, [live])

  // Computed stats
  const stats = useMemo(() => {
    const total = events.length
    const critical = events.filter(e => e.severity === 'critical').length
    const high = events.filter(e => e.severity === 'high').length
    const uniqueIPs = new Set(events.map(e => e.srcIP)).size
    const honeypot = events.filter(e => e.source === 'T-Pot Honeypot').length
    return { total, critical, high, uniqueIPs, honeypot, feeds: FEEDS.length }
  }, [events])

  // Source countries (for bottom panel)
  const sourceCountries = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.country]) map[e.country] = { code: e.country, name: e.countryName, count: 0 }
      map[e.country].count++
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8)
  }, [events])

  // Target countries
  const targetCountries = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.dstCountry]) map[e.dstCountry] = { code: e.dstCountry, name: e.dstCountryName, count: 0 }
      map[e.dstCountry].count++
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8)
  }, [events])

  // Alert distribution (categories)
  const alertDistribution = useMemo(() => {
    const map = {}
    events.forEach(e => {
      const cat = e.category || 'Unclassified'
      map[cat] = (map[cat] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [events])

  // Filtered events
  const filteredEvents = useMemo(() => {
    let f = events
    if (selectedCountry) f = f.filter(e => e.country === selectedCountry || e.dstCountry === selectedCountry)
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

  // Country flag emoji helper
  const getFlag = useCallback((code) => {
    if (!code || code.length !== 2) return ''
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
  }, [])

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  const sevBadge = (sev) => {
    const colors = {
      critical: { bg: THEME.criticalBg, color: THEME.critical },
      high: { bg: THEME.highBg, color: THEME.high },
      medium: { bg: THEME.mediumBg, color: THEME.medium },
      low: { bg: THEME.lowBg, color: THEME.low },
      info: { bg: THEME.infoBg, color: THEME.info },
    }
    const c = colors[sev] || colors.info
    return {
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
      background: c.bg, color: c.color, letterSpacing: 0.5,
    }
  }

  const renderOverview = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Top section: counters left, map right */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 0, marginBottom: 0 }}>
        {/* Left: Real-time counters */}
        <div style={{ padding: '24px 28px', borderRight: `1px solid ${THEME.border}` }}>
          {/* DateTime */}
          <div style={{ color: BRAND.magenta, fontFamily: FONTS.mono, fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
            {clock}
          </div>

          {/* Big counter */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 64, fontWeight: 700, fontFamily: FONTS.mono, color: THEME.text, lineHeight: 1 }}>
              {alerts60s.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: THEME.textSecondary, marginTop: 4 }}>
              Alerts in <span style={{ color: BRAND.magenta, fontWeight: 600 }}>60 S</span>
            </div>
          </div>

          {/* Sub counters */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONTS.mono, color: THEME.text }}>
                {alerts1h.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: THEME.textSecondary }}>Alerts in <span style={{ color: BRAND.magenta }}>1 h</span></div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONTS.mono, color: THEME.text }}>
                {alerts24h.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: THEME.textSecondary }}>Alerts in <span style={{ color: BRAND.magenta }}>24 h</span></div>
            </div>
          </div>

          {/* Area chart */}
          <div>
            <div style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 8, fontWeight: 500 }}>
              Average Alerts per Honeypot
            </div>
            <AlertAreaChart data={chartData} width={310} height={160} />
          </div>

          {/* Country filter */}
          <div style={{ marginTop: 20 }}>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                border: `1px solid ${THEME.border}`, background: THEME.surface,
                color: THEME.text, fontSize: 13, fontFamily: FONTS.sans,
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">All Countries</option>
              {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.code} value={c.code}>{getFlag(c.code)} {c.name} ({c.code})</option>
              ))}
            </select>
            {selectedCountry && (
              <button
                onClick={() => setSelectedCountry('')}
                style={{
                  marginTop: 8, padding: '4px 12px', borderRadius: 4,
                  border: `1px solid ${THEME.border}`, background: 'transparent',
                  color: THEME.textSecondary, fontSize: 11, cursor: 'pointer',
                  fontFamily: FONTS.sans,
                }}
              >
                Clear Filter ({filteredEvents.length} events)
              </button>
            )}
          </div>
        </div>

        {/* Right: World Map */}
        <div style={{ padding: '16px 20px', overflow: 'hidden' }}>
          <WorldMap
            events={events}
            onCountryClick={setSelectedCountry}
            selectedCountry={selectedCountry}
            feedGeoIPs={feedData?.geolocatedIPs}
          />
        </div>
      </div>

      {/* Bottom 4-panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 0, borderTop: `1px solid ${THEME.border}` }}>
        {/* Alert Distribution */}
        <div style={{ padding: '16px 20px', borderRight: `1px solid ${THEME.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 12 }}>
            Alert Distribution (60s)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Color</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Category</th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {alertDistribution.map(([cat, count], i) => {
                const catDef = ALERT_CATEGORIES.find(c => c.name === cat) || ALERT_CATEGORIES[0]
                return (
                  <tr key={cat}>
                    <td style={{ padding: '4px 0' }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: catDef.color }} />
                    </td>
                    <td style={{ padding: '4px 0', color: THEME.textSecondary, fontFamily: FONTS.sans }}>{cat}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', color: THEME.text, fontFamily: FONTS.mono, fontWeight: 500 }}>
                      {count.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Source Countries */}
        <div style={{ padding: '16px 20px', borderRight: `1px solid ${THEME.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 12 }}>
            Source Countries (March)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Country</th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {sourceCountries.map(c => (
                <tr
                  key={c.code}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCountry(selectedCountry === c.code ? '' : c.code)}
                >
                  <td style={{ padding: '4px 0', color: THEME.textSecondary }}>
                    <span style={{ marginRight: 6 }}>{getFlag(c.code)}</span>
                    {c.code}
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right', color: THEME.text, fontFamily: FONTS.mono, fontWeight: 500 }}>
                    {(c.count * rand(800000, 1200000)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Target Countries */}
        <div style={{ padding: '16px 20px', borderRight: `1px solid ${THEME.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 12 }}>
            Target Countries (March)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Country</th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: THEME.textMuted, fontWeight: 500, fontSize: 11 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {targetCountries.map(c => (
                <tr
                  key={c.code}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCountry(selectedCountry === c.code ? '' : c.code)}
                >
                  <td style={{ padding: '4px 0', color: THEME.textSecondary }}>
                    <span style={{ marginRight: 6 }}>{getFlag(c.code)}</span>
                    {c.code}
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right', color: THEME.text, fontFamily: FONTS.mono, fontWeight: 500 }}>
                    {(c.count * rand(600000, 1000000)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alert Feed (live stream) */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>
              Alert Feed ({filteredEvents.length} Samples)
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Source', 'Target', 'Category', 'Metadata', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 6px', color: THEME.textMuted, fontWeight: 500, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.slice(0, 20).map(e => (
                  <tr key={e.id}>
                    <td style={{ padding: '3px 6px', color: THEME.textSecondary, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>
                      {getFlag(e.country)} {e.country}
                    </td>
                    <td style={{ padding: '3px 6px', color: THEME.textSecondary, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>
                      {getFlag(e.dstCountry)} {e.dstCountry}
                    </td>
                    <td style={{ padding: '3px 6px', color: THEME.textSecondary, fontFamily: FONTS.sans }}>{e.category}</td>
                    <td style={{ padding: '3px 6px', color: THEME.textMuted, fontFamily: FONTS.mono, fontSize: 10 }}>
                      {e.attackType} on {e.port}/{e.protocol.toLowerCase()}
                    </td>
                    <td style={{ padding: '3px 6px', color: THEME.textMuted, fontFamily: FONTS.mono, fontSize: 10 }}>
                      {formatTime(e.time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderThreatEvents = () => (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{
            padding: '8px 14px', borderRadius: 8, border: `1px solid ${THEME.border}`,
            background: THEME.surface, color: THEME.text, fontSize: 13,
            fontFamily: FONTS.mono, outline: 'none', width: 280,
          }}
          placeholder="Search IPs, attacks, feeds, MITRE..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{
            padding: '8px 14px', borderRadius: 8, border: `1px solid ${THEME.border}`,
            background: THEME.surface, color: THEME.text, fontSize: 13,
            fontFamily: FONTS.sans, outline: 'none', cursor: 'pointer',
          }}
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value)}
        >
          <option value="">All Countries</option>
          {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        {['all', 'critical', 'high', 'medium', 'low', 'info'].map(f => (
          <button
            key={f}
            onClick={() => setSevFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${sevFilter === f ? BRAND.magenta : THEME.border}`,
              background: sevFilter === f ? BRAND.magentaBg : 'transparent',
              color: sevFilter === f ? BRAND.magenta : THEME.textSecondary,
              fontFamily: FONTS.sans,
            }}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ fontSize: 12, color: THEME.textMuted, marginLeft: 'auto' }}>
          {filteredEvents.length} events
        </span>
      </div>
      <div style={{ maxHeight: 600, overflowY: 'auto', borderRadius: 12, border: `1px solid ${THEME.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr>
              {['Time', 'Severity', 'Attack Type', 'Src IP', 'Dst IP', 'Protocol', 'Port', 'MITRE', 'Feed Source', 'Confidence', 'Detection'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: THEME.textSecondary,
                  borderBottom: `1px solid ${THEME.border}`, background: THEME.surfaceAlt,
                  position: 'sticky', top: 0, zIndex: 2, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONTS.sans,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEvents.slice(0, 100).map(e => (
              <tr key={e.id} className="table-row-hover">
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: THEME.textSecondary }}>{formatTime(e.time)}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}` }}><span style={sevBadge(e.severity)}>{e.severity}</span></td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, color: THEME.text, fontFamily: FONTS.sans, fontSize: 12 }}>{e.attackType}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: THEME.textSecondary }}>{e.srcIP}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: THEME.textSecondary }}>{e.dstIP}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: THEME.textSecondary }}>{e.protocol}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: THEME.textSecondary }}>{e.port}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: BRAND.magenta }}>{e.mitre}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.sans, fontSize: 12, color: THEME.textSecondary }}>{e.feed}</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 12, color: THEME.textSecondary }}>{e.confidence}%</td>
                <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.sans, fontSize: 12, color: THEME.textSecondary }}>{e.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderHoneypot = () => (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Status', value: 'ONLINE', color: THEME.low },
          { label: 'Active Sessions', value: events.filter(e => e.source === 'T-Pot Honeypot').slice(0, 30).filter(() => Math.random() > 0.7).length, color: BRAND.magenta },
          { label: 'Total Sessions', value: events.filter(e => e.source === 'T-Pot Honeypot').length, color: BRAND.magenta },
          { label: 'Malware Captured', value: rand(8, 24), color: THEME.critical },
        ].map((c, i) => (
          <div key={i} style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12,
            padding: '20px', cursor: 'default',
          }} className="card-hover">
            <div style={{ fontSize: 11, color: THEME.textMuted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.mono, color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12,
        padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Honeypot Integration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Platform', value: 'T-Pot CE Docker' },
            { label: 'Honeypots', value: 'Cowrie, Dionaea, Conpot, Heralding' },
            { label: 'VPS Provider', value: 'Hetzner' },
            { label: 'Log Pipeline', value: 'Logstash + Elasticsearch' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: THEME.text, fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sessions</div>
        <div style={{ maxHeight: 500, overflowY: 'auto', borderRadius: 8, border: `1px solid ${THEME.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
            <thead>
              <tr>
                {['Time', 'Source IP', 'Country', 'Protocol', 'Credentials', 'Commands', 'Duration', 'Malware', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: THEME.textSecondary,
                    borderBottom: `1px solid ${THEME.border}`, background: THEME.surfaceAlt,
                    position: 'sticky', top: 0, zIndex: 2, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONTS.sans,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {honeypotSessions.map((e, i) => (
                <tr key={i} className="table-row-hover">
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, color: THEME.textSecondary }}>{formatTime(e.time)}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, color: THEME.textSecondary }}>{e.srcIP}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.sans, color: THEME.textSecondary }}>{e.country}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, color: THEME.textSecondary }}>{e.protocol}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, color: THEME.textSecondary, fontSize: 11 }}>{e.credentials}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, color: THEME.textSecondary, fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.commands}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, color: THEME.textSecondary }}>{e.duration}</td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}` }}>
                    <span style={sevBadge(e.malware === 'YES' ? 'critical' : 'low')}>{e.malware}</span>
                  </td>
                  <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}` }}>
                    <span style={sevBadge(e.status === 'active' ? 'high' : e.status === 'suspicious' ? 'medium' : 'info')}>{e.status}</span>
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
    const apiFeedMap = {}
    if (feedData?.feeds) {
      feedData.feeds.forEach(f => { apiFeedMap[f.id] = f })
    }
    const simFeedCounts = {}
    events.forEach(e => { simFeedCounts[e.feed] = (simFeedCounts[e.feed] || 0) + 1 })

    const countryIoCs = selectedCountry && feedData?.countryBreakdown
      ? feedData.countryBreakdown.find(c => c.code === selectedCountry)
      : null

    return (
      <div style={{ animation: 'fadeIn 0.3s ease', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${THEME.border}`,
              background: THEME.surface, color: THEME.text, fontSize: 13,
              fontFamily: FONTS.sans, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Countries</option>
            {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
          {selectedCountry && (
            <button
              onClick={() => setSelectedCountry('')}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${THEME.border}`, background: 'transparent',
                color: THEME.textSecondary, fontFamily: FONTS.sans,
              }}
            >
              Clear Filter
            </button>
          )}
          {selectedCountry && countryIoCs && (
            <span style={{ fontSize: 13, color: THEME.textSecondary }}>
              {countryIoCs.count} malicious IPs from {countryIoCs.name}
            </span>
          )}
        </div>

        {feedData && (
          <div style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12,
            padding: 20, marginBottom: 20, display: 'flex', gap: 40, alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Total Live IoCs</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.mono, color: BRAND.magenta }}>{feedData.totalIoCs.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Active Feeds</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.mono, color: THEME.low }}>{feedData.feeds.filter(f => f.status === 'active').length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Last Sync</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONTS.mono, color: THEME.textSecondary }}>{new Date(feedData.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {FEEDS.map(feed => {
            const apiData = apiFeedMap[feed.id]
            const isLive = apiData?.status === 'active'
            const countryCount = selectedCountry && apiData?.countries
              ? apiData.countries.find(c => c.code === selectedCountry)?.count
              : null
            const displayCount = countryCount != null
              ? countryCount
              : (isLive ? apiData.count : (simFeedCounts[feed.name] || rand(10, 200)))
            const statusColor = isLive ? THEME.low : (apiData?.status === 'error' ? THEME.critical : THEME.textMuted)
            return (
              <div key={feed.id} style={{
                background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12,
                padding: 20,
              }} className="card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>{feed.name}</div>
                    <div style={{ fontSize: 12, color: THEME.textSecondary }}>{feed.type}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[feed.category] }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONTS.mono, color: THEME.text }}>
                      {displayCount != null ? displayCount.toLocaleString() : '\u2014'}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.textMuted }}>{countryCount != null ? `IoCs in ${selectedCountry}` : (isLive ? 'live IoCs' : 'events')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{isLive ? 'LIVE' : (apiData?.status === 'error' ? 'ERROR' : 'ACTIVE')}</div>
                    {apiData?.lastSync && (
                      <div style={{ fontSize: 10, color: THEME.textMuted, fontFamily: FONTS.mono }}>
                        {new Date(apiData.lastSync).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Feed Endpoints</div>
          <div style={{ maxHeight: 420, overflowY: 'auto', borderRadius: 8, border: `1px solid ${THEME.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
              <thead>
                <tr>
                  {['Name', 'URL', 'Type', 'Category'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: THEME.textSecondary,
                      borderBottom: `1px solid ${THEME.border}`, background: THEME.surfaceAlt,
                      position: 'sticky', top: 0, zIndex: 2, fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONTS.sans,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEEDS.map(feed => (
                  <tr key={feed.id} className="table-row-hover">
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontWeight: 500, color: THEME.text, fontFamily: FONTS.sans }}>{feed.name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.mono, fontSize: 11, color: THEME.textSecondary, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feed.url}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}`, fontFamily: FONTS.sans, color: THEME.textSecondary }}>{feed.type}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${THEME.border}` }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[feed.category] }} />
                        <span style={{ fontFamily: FONTS.sans, textTransform: 'capitalize', color: THEME.textSecondary }}>{feed.category}</span>
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
    <div style={{
      minHeight: '100vh',
      background: THEME.bg,
      color: THEME.text,
      fontFamily: FONTS.sans,
      WebkitFontSmoothing: 'antialiased',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(233,30,140,0.08);
          border-color: ${BRAND.magenta}40 !important;
        }
        .table-row-hover:hover td {
          background: ${THEME.surfaceHover};
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.magenta}30; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${BRAND.magenta}60; }
        * { scrollbar-width: thin; scrollbar-color: ${BRAND.magenta}30 transparent; }
        body { margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,13,20,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${THEME.border}`,
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1440, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LogoIcon />
            <span style={{ fontSize: 18, fontWeight: 700, color: BRAND.magenta, fontFamily: FONTS.sans, letterSpacing: '-0.02em' }}>
              Threat Command
            </span>
          </div>

          {/* Tab nav integrated in header */}
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                style={{
                  padding: '20px 20px', fontSize: 14, fontWeight: tab === i ? 600 : 400,
                  color: tab === i ? BRAND.magenta : THEME.textSecondary,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: tab === i ? `2px solid ${BRAND.magenta}` : '2px solid transparent',
                  fontFamily: FONTS.sans, transition: 'all 0.2s',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: THEME.textSecondary }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: THEME.low }} />
              T-Pot
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: THEME.textSecondary }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: THEME.low }} />
              {feedData ? feedData.feeds.filter(f => f.status === 'active').length : FEEDS.length} Feeds
            </span>
            <button
              onClick={() => setLive(!live)}
              style={{
                padding: '6px 14px', borderRadius: 6,
                background: live ? BRAND.magenta : 'transparent',
                border: live ? 'none' : `1px solid ${THEME.border}`,
                color: live ? '#fff' : THEME.textSecondary,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              {live ? '\u25CF LIVE' : '\u25CB PAUSED'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1440, margin: '0 auto' }}>
        {tabContent[tab]()}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#080810',
        padding: '24px 16px',
        textAlign: 'center',
        borderTop: `1px solid ${THEME.border}`,
      }}>
        <p style={{ color: THEME.textMuted, fontSize: 13, fontFamily: FONTS.sans, margin: 0 }}>
          &copy; 2026 Daniel Legall &mdash; threat.daniellegall.com
        </p>
      </footer>
    </div>
  )
}
