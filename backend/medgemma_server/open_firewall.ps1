# =============================================================================
# LumiVue — Open Windows Firewall for MedGemma Server (Port 8001)
# =============================================================================
# Run this script ONCE on the MedGemma laptop with Administrator privileges:
#
#   Right-click PowerShell → "Run as Administrator"
#   cd d:\CFile\Lumivue\backend\medgemma_server
#   .\open_firewall.ps1
#
# This creates an inbound rule that allows TCP port 8001 on Private networks.
# It does NOT disable the firewall.
# =============================================================================

$RuleName = "LumiVue MedGemma Server (TCP 8001)"

# Remove any old rule with the same name first to avoid duplicates
Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue

New-NetFirewallRule `
    -DisplayName $RuleName `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 8001 `
    -Action Allow `
    -Profile Private `
    -Description "Allows the LumiVue MedGemma local inference server to accept connections from the team LAN."

Write-Host ""
Write-Host "Firewall rule created: $RuleName" -ForegroundColor Green
Write-Host "Port 8001 is now open on Private networks." -ForegroundColor Green
Write-Host ""
Write-Host "Your LAN IP addresses:" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object InterfaceAlias, IPAddress |
    Format-Table -AutoSize
