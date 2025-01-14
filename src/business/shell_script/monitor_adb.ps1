# .\monitor_adb.ps1 -DeviceName "smatek" -Port 8082
param (
    [string]$DeviceName = "smatek",  # 默认设备名
    [int]$Port = 8082,               # 默认端口为 8082
    [int]$CheckInterval = 5          # 检查间隔，单位秒
)

# 检查设备是否在线
function Check-DeviceOnline {
    $adbOutput = adb devices | Select-String -Pattern "$DeviceName\s+device"
    return $adbOutput -ne $null
}

# 检查端口转发是否已存在
function Check-PortForwarding {
    # 获取 adb reverse 端口转发列表
    $adbOutput = adb -s $DeviceName reverse --list
    Write-Host "ADB Reverse Port Forwarding List: $adbOutput" -ForegroundColor Cyan

    # 使用正则表达式检查是否存在指定端口转发
    if ($adbOutput -match "tcp:$Port") {
        return $true
    }
    return $false
}

# 执行 adb reverse 命令
function Set-AdbReverse {
    Write-Host "Setting adb reverse port forwarding for port $Port..."
    Execute-AdbCommand -Command "adb -s $DeviceName reverse tcp:$Port tcp:$Port" -ErrorMessage "Failed to set reverse port forwarding!"
}

# 定义执行 ADB 命令的函数
function Execute-AdbCommand {
    param (
        [string]$Command,
        [string]$ErrorMessage
    )

    Write-Host "`nExecute Adb Command: $Command" -ForegroundColor Cyan
    $result = Invoke-Expression -Command $Command

    # 检查命令执行状态
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$ErrorMessage" -ForegroundColor Red
    } else {
        Write-Host "Command executed successfully!" -ForegroundColor Green
    }
}

# 持续运行监测设备状态并设置 reverse
while ($true) {
    if (Check-DeviceOnline) {
        Write-Host "$DeviceName is online. Checking port forwarding..." -ForegroundColor Green

        # 检查端口转发是否已存在
        if (-not (Check-PortForwarding)) {
            Write-Host "Port $Port is not forwarded. Setting up port forwarding..." -ForegroundColor Yellow
            Set-AdbReverse
        } else {
            Write-Host "Port $Port is already forwarded." -ForegroundColor Green
        }
    } else {
        Write-Host "$DeviceName is offline. Retrying..." -ForegroundColor Yellow
    }

    # 每隔 $CheckInterval 秒检查一次设备状态
    Start-Sleep -Seconds $CheckInterval
}
