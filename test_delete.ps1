$body = @{username="admin";password="admin123"} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$tok = $loginRes.data.token
Write-Host "Got token OK: $tok"

$hdrs = @{Authorization="Bearer $tok"}

# List users
$usersRes = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Headers $hdrs
Write-Host "Users found:" $usersRes.data.Count
$usersRes.data | ForEach-Object { Write-Host "  ID=$($_.id) username=$($_.username) active=$($_.is_active)" }

# Try deleting user ID 2 (if exists and not admin)
$targetId = ($usersRes.data | Where-Object { $_.username -ne "admin" } | Select-Object -First 1).id
if ($targetId) {
    Write-Host "`nAttempting DELETE /api/users/$targetId ..."
    try {
        $delRes = Invoke-RestMethod -Uri "http://localhost:3000/api/users/$targetId" -Method DELETE -Headers $hdrs
        Write-Host "Delete result:" ($delRes | ConvertTo-Json -Compress)
    } catch {
        Write-Host "Delete FAILED:" $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Response body:" $reader.ReadToEnd()
        }
    }
} else {
    Write-Host "No non-admin user to test delete"
}
