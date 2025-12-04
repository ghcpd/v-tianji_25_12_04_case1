const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function readAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.json']) {
  const results = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const it of items) {
    const p = path.join(dir, it.name)
    if (it.isDirectory()) {
      results.push(...readAllFiles(p, exts))
    } else if (exts.includes(path.extname(it.name))) {
      results.push(p)
    }
  }
  return results
}

const allFiles = readAllFiles(root)
const srcFiles = allFiles.filter((f) => f.includes(path.join('src', '')))

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

let failures = []

// Check 1: axios in package.json but not referenced in src
if (pkg.dependencies && pkg.dependencies.axios) {
  const found = srcFiles.some((f) => fs.readFileSync(f, 'utf8').includes('axios'))
  if (!found) {
    failures.push('axios listed in package.json but not referenced in source files')
  }
}

// Check 2: createApiClient exists in utils but not used elsewhere
const apiUtilsPath = path.join(root, 'src', 'utils', 'apiUtils.ts')
if (fs.existsSync(apiUtilsPath)) {
  const apiUtils = fs.readFileSync(apiUtilsPath, 'utf8')
  if (/createApiClient\s*\(/.test(apiUtils)) {
    const used = allFiles.some((f) => {
      if (f === apiUtilsPath) return false
      return fs.readFileSync(f, 'utf8').includes('createApiClient(')
    })
    if (!used) {
      failures.push('createApiClient is defined in src/utils/apiUtils.ts but not used anywhere')
    }
  }
}

// Check 3: services folder files use fetch directly (indicates no single HTTP client)
const servicesDir = path.join(root, 'src', 'services')
if (fs.existsSync(servicesDir)) {
  const svcFiles = fs.readdirSync(servicesDir).map((n) => path.join(servicesDir, n))
  const fetchUsing = svcFiles.filter((f) => fs.readFileSync(f, 'utf8').includes('fetch('))
  if (fetchUsing.length > 0) {
    failures.push(`Found direct fetch() usage in service files: ${fetchUsing.map((f) => path.basename(f)).join(', ')}`)
  }
}

// Check 4: dashboardStore declares Metric.timestamp as Date but fetchMetrics does not parse timestamps
const dashboardStore = path.join(root, 'src', 'store', 'dashboardStore.ts')
if (fs.existsSync(dashboardStore)) {
  const ds = fs.readFileSync(dashboardStore, 'utf8')
  if (/timestamp:\s*Date/.test(ds)) {
    if (/data\.metrics/.test(ds) && !/new Date\(|Date\(|Date\./.test(ds)) {
      failures.push('dashboardStore Metric.timestamp is typed as Date but fetched metrics are not converted to Date')
    }
  }
}

// Check 5: mixed state management (AuthContext and useDashboardStore both used across repo)
const usesAuth = srcFiles.some((f) => fs.readFileSync(f, 'utf8').includes('useAuth'))
const usesStore = srcFiles.some((f) => fs.readFileSync(f, 'utf8').includes('useDashboardStore'))
if (usesAuth && usesStore) {
  failures.push('Both AuthContext (Context API) and Zustand store are used; boundary/ownership of global state is unclear')
}

// Check 6: occurrences of any-type usage
const anyCount = srcFiles.reduce((acc, f) => acc + (fs.readFileSync(f, 'utf8').match(/:\s*any\b/g)?.length || 0), 0)
if (anyCount >= 3) {
  failures.push(`Found ${anyCount} occurrences of ": any" in source (inconsistent typing strictness)`) 
}

// Check 7: inconsistent API error handling patterns (some services throw Errors vs apiUtils returning ApiResponse)
const servicesThrow = srcFiles.filter((f) => fs.readFileSync(f, 'utf8').includes("throw new Error('"))
const apiUtilsContent = fs.existsSync(apiUtilsPath) ? fs.readFileSync(apiUtilsPath, 'utf8') : ''
if (apiUtilsContent && servicesThrow.length > 0) {
  failures.push('Services are using throw new Error(...) while apiUtils.createApiClient returns ApiResponse — inconsistent error handling approach')
}

// Summary
if (failures.length === 0) {
  console.log('All ambiguity checks passed (no ambiguous patterns detected)')
  process.exit(0)
} else {
  console.error('Ambiguity checks found the following issues:')
  failures.forEach((f) => console.error('- ' + f))
  process.exit(1)
}
