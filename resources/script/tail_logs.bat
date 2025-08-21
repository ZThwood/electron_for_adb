@echo off
:: 脚本功能：通过adb实时查看Android设备上的日志文件
:: 使用说明：双击运行或命令行传入设备序列号（可选）

setlocal enabledelayedexpansion

:: 设备选择（支持传入参数 %1 为设备序列号）
if "%1"=="" (
    echo No device serial number specified, defaulting to the first connected device
    set "adb_base=adb"
) else (
    echo Specify the device serial number: %1
    set "adb_base=adb -s %1"
)

:: 目标日志路径（根据实际情况修改）
set "log_path=/data/data/com.termux/files/home/data/.logs/node/bridge-cube/bridge_cube.log"
%adb_base% root
if %errorlevel% neq 0 (
    echo [error] root err
    pause
    exit /b 1
)

ping -n 2 127.0.0.1 >nul
%adb_base% wait-for-device
%adb_base% shell "[ -f '%log_path%' ] || { echo '错误：文件不存在'; exit 1; }"
if %errorlevel% neq 0 (
    echo [错误] 日志文件不存在或不可访问: %log_path%
    pause
    exit /b 1
)
:: Step 3: 实时监听日志
echo --------------- Listening for logs: %log_path% -------------
%adb_base% shell "tail -f '%log_path%'"


pause
