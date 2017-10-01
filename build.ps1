param([int]$timeout = 10000, [string]$tilte = "ƒ^ƒCƒgƒ‹", [string]$body = " ", [string]$toolTipIcon = "Info")

[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")

$objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon

# $powerShellExe = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
# $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($powerShellExe)

$path = Get-Process -id $pid | Select-Object -ExpandProperty Path
$objNotifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
$objNotifyIcon.BalloonTipIcon = $toolTipIcon
$objNotifyIcon.BalloonTipText = $body
$objNotifyIcon.BalloonTipTitle = $tilte

$objNotifyIcon.Visible = $True 
$objNotifyIcon.ShowBalloonTip($timeout)
