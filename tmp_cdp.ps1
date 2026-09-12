# Arranca / detiene un Chrome headless dedicado con CDP en 127.0.0.1:9333
param([string]$action = 'start', [int]$port = 9333)

$ErrorActionPreference = 'SilentlyContinue'

function Stop-OrbitChrome {
  $c = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'"
  $v = $c | Where-Object { $_.CommandLine -match 'orbit-cdp|orbit-prof|playwright_chromiumdev_profile' }
  $v | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 2
  "chrome orbit restantes: $((Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -match 'orbit-cdp|orbit-prof|playwright_chromiumdev_profile' } | Measure-Object).Count)"
}

if ($action -eq 'stop') { Stop-OrbitChrome; exit 0 }

Stop-OrbitChrome

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$prof = Join-Path $env:TEMP 'orbit-cdp-profile'
Start-Process -FilePath $chrome -ArgumentList @(
  '--headless=new',
  "--remote-debugging-port=$port",
  "--user-data-dir=$prof",
  '--orbit-cdp-flag',
  '--no-first-run', '--no-default-browser-check', '--disable-sync', '--mute-audio',
  '--window-size=1600,1000',
  '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
  '--no-sandbox', 'about:blank'
) -WindowStyle Hidden

$ok = $false
for ($i = 0; $i -lt 40; $i++) {
  try { Invoke-WebRequest "http://127.0.0.1:$port/json/version" -UseBasicParsing -TimeoutSec 3 | Out-Null; $ok = $true; break }
  catch { Start-Sleep -Milliseconds 500 }
}
"CDP listo en ${port}: $ok"
