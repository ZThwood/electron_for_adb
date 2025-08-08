param(
    [Parameter(Mandatory = $true)]
    [string]$DeviceName
)

# 1. 检查ADB是否可用
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "Error: adb is not found. Please ensure the Android SDK is installed and the PATH is configured." -ForegroundColor Red
    exit 1
}

# 2. 检查设备连接状态
$deviceCheck = adb -s $DeviceName devices 2>&1
if ($deviceCheck -match "error: device offline" -or $deviceCheck -match "device not found") {
    Write-Host "error: device offline $DeviceName" -ForegroundColor Red
    exit 1
}

# 3. 实时日志跟踪
try {
    Write-Host "Start monitoring z2m logs (Device: $DeviceName)" -ForegroundColor Cyan
    
    # 修复点：用分号替代 &&
    adb -s $DeviceName shell "cd /data/data/com.termux/files/home/data/.logs/node/bridge-cube/ ; tail -f bridge_cube.log"
}
catch {
    Write-Host "日志跟踪被中断: $_" -ForegroundColor Yellow
}
