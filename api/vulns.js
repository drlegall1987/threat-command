// Vercel Serverless Function — fetches CVE data from NVD API + CISA KEV
// Supports vendor filtering via ?vendor= query param

const VENDORS = [
  { id: 'fortinet', name: 'Fortinet', keywords: ['fortinet', 'fortigate', 'fortios', 'fortimanager', 'fortianalyzer', 'fortiweb', 'forticlient'] },
  { id: 'cisco', name: 'Cisco', keywords: ['cisco', 'cisco ios', 'cisco asa', 'cisco meraki', 'cisco nexus', 'webex'] },
  { id: 'checkpoint', name: 'Check Point', keywords: ['check point', 'checkpoint', 'zonealarm'] },
  { id: 'juniper', name: 'Juniper', keywords: ['juniper', 'junos', 'srx', 'juniper networks'] },
  { id: 'paloalto', name: 'Palo Alto Networks', keywords: ['palo alto', 'pan-os', 'panos', 'panorama', 'cortex', 'prisma'] },
  { id: 'microsoft', name: 'Microsoft', keywords: ['microsoft', 'windows', 'azure', 'exchange', 'office 365'] },
  { id: 'vmware', name: 'VMware', keywords: ['vmware', 'vsphere', 'vcenter', 'esxi', 'nsx'] },
  { id: 'ivanti', name: 'Ivanti', keywords: ['ivanti', 'pulse secure', 'mobileiron'] },
  { id: 'sonicwall', name: 'SonicWall', keywords: ['sonicwall', 'sonic wall'] },
  { id: 'citrix', name: 'Citrix', keywords: ['citrix', 'netscaler', 'xenapp', 'xendesktop'] },
  { id: 'arista', name: 'Arista', keywords: ['arista', 'arista networks', 'arista eos'] },
  { id: 'f5', name: 'F5 Networks', keywords: ['f5', 'big-ip', 'bigip', 'nginx'] },
  { id: 'sophos', name: 'Sophos', keywords: ['sophos', 'sophos xg', 'sophos utm'] },
  { id: 'crowdstrike', name: 'CrowdStrike', keywords: ['crowdstrike', 'falcon'] },
  { id: 'barracuda', name: 'Barracuda', keywords: ['barracuda'] },
]

// Map CVSS score to severity
function cvssToSeverity(score) {
  if (score >= 9.0) return 'critical'
  if (score >= 7.0) return 'high'
  if (score >= 4.0) return 'medium'
  if (score >= 0.1) return 'low'
  return 'info'
}

// Fetch CVEs from NVD API v2.0
async function fetchNVD(keyword, resultsPerPage = 20) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=${resultsPerPage}&keywordExactMatch`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ThreatDashboard/1.0' },
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data = await res.json()
    return (data.vulnerabilities || []).map(v => {
      const cve = v.cve
      const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData
        || cve.metrics?.cvssMetricV30?.[0]?.cvssData
        || cve.metrics?.cvssMetricV2?.[0]?.cvssData
      const score = metrics?.baseScore || 0
      const vector = metrics?.attackVector || metrics?.accessVector || 'UNKNOWN'
      const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description'
      return {
        id: cve.id,
        published: cve.published?.slice(0, 10),
        modified: cve.lastModified?.slice(0, 10),
        score,
        severity: cvssToSeverity(score),
        vector,
        description: desc.length > 300 ? desc.slice(0, 300) + '...' : desc,
        references: (cve.references || []).slice(0, 3).map(r => r.url),
      }
    })
  } catch {
    return []
  }
}

// Fetch CISA Known Exploited Vulnerabilities
async function fetchCISAKEV() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
      signal: controller.signal,
      headers: { 'User-Agent': 'ThreatDashboard/1.0' },
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data = await res.json()
    return (data.vulnerabilities || []).map(v => ({
      id: v.cveID,
      vendor: v.vendorProject,
      product: v.product,
      name: v.vulnerabilityName,
      description: v.shortDescription || v.vulnerabilityName,
      dateAdded: v.dateAdded,
      dueDate: v.requiredAction ? v.dueDate : null,
      knownRansomware: v.knownRansomwareCampaignUse === 'Known',
      requiredAction: v.requiredAction,
    }))
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const vendor = (req.query?.vendor || '').toLowerCase()

  try {
    // Always fetch CISA KEV for the "actively exploited" overlay
    const kevPromise = fetchCISAKEV()

    // Determine which keyword to search NVD with
    let nvdKeyword = ''
    let vendorInfo = null
    if (vendor) {
      vendorInfo = VENDORS.find(v => v.id === vendor)
      nvdKeyword = vendorInfo ? vendorInfo.keywords[0] : vendor
    }

    // Fetch NVD data (if vendor specified, search that; otherwise get recent)
    let nvdCves = []
    if (nvdKeyword) {
      nvdCves = await fetchNVD(nvdKeyword, 40)
    } else {
      // Fetch recent CVEs for top vendors in parallel (limited set to respect rate limits)
      const topVendors = ['fortinet', 'cisco', 'palo alto', 'juniper', 'check point', 'microsoft']
      const results = await Promise.allSettled(
        topVendors.map((kw, i) =>
          new Promise(resolve => setTimeout(() => resolve(fetchNVD(kw, 8)), i * 500))
        )
      )
      results.forEach(r => {
        if (r.status === 'fulfilled') nvdCves.push(...r.value)
      })
    }

    const kevData = await kevPromise

    // Build KEV lookup for quick matching
    const kevMap = {}
    kevData.forEach(k => { kevMap[k.id] = k })

    // Tag vendor to each CVE
    const enrichedCves = nvdCves.map(cve => {
      const kev = kevMap[cve.id]
      const descLower = cve.description.toLowerCase()
      let matchedVendor = vendorInfo?.name || ''
      if (!matchedVendor) {
        for (const v of VENDORS) {
          if (v.keywords.some(kw => descLower.includes(kw.toLowerCase()))) {
            matchedVendor = v.name
            break
          }
        }
      }
      return {
        ...cve,
        vendor: matchedVendor || 'Other',
        activelyExploited: !!kev,
        knownRansomware: kev?.knownRansomware || false,
        kevDateAdded: kev?.dateAdded || null,
      }
    })

    // Sort by score descending, then date
    enrichedCves.sort((a, b) => b.score - a.score || (b.published > a.published ? 1 : -1))

    // Vendor summary stats
    const vendorStats = {}
    enrichedCves.forEach(c => {
      if (!vendorStats[c.vendor]) vendorStats[c.vendor] = { name: c.vendor, total: 0, critical: 0, high: 0, exploited: 0 }
      vendorStats[c.vendor].total++
      if (c.severity === 'critical') vendorStats[c.vendor].critical++
      if (c.severity === 'high') vendorStats[c.vendor].high++
      if (c.activelyExploited) vendorStats[c.vendor].exploited++
    })

    // CISA KEV stats
    const kevByVendor = {}
    kevData.forEach(k => {
      const vLower = (k.vendor || '').toLowerCase()
      const matched = VENDORS.find(v => v.keywords.some(kw => vLower.includes(kw.toLowerCase())))
      const vName = matched?.name || k.vendor
      if (!kevByVendor[vName]) kevByVendor[vName] = { name: vName, count: 0, ransomware: 0 }
      kevByVendor[vName].count++
      if (k.knownRansomware) kevByVendor[vName].ransomware++
    })

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      vendor: vendorInfo?.name || (vendor ? vendor : 'all'),
      vendors: VENDORS.map(v => ({ id: v.id, name: v.name })),
      cves: enrichedCves,
      totalCves: enrichedCves.length,
      totalKEV: kevData.length,
      vendorStats: Object.values(vendorStats).sort((a, b) => b.total - a.total),
      kevByVendor: Object.values(kevByVendor).sort((a, b) => b.count - a.count).slice(0, 15),
      severityBreakdown: {
        critical: enrichedCves.filter(c => c.severity === 'critical').length,
        high: enrichedCves.filter(c => c.severity === 'high').length,
        medium: enrichedCves.filter(c => c.severity === 'medium').length,
        low: enrichedCves.filter(c => c.severity === 'low').length,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch vulnerability data', details: err.message })
  }
}
