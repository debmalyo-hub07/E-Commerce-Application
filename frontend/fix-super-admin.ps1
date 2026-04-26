$path = "d:\E-Commerce-Application\frontend\src"
Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace ' \|\| role === "SUPER_ADMIN"', ''
    $newContent = $newContent -replace ' \|\| userRole === "SUPER_ADMIN"', ''
    $newContent = $newContent -replace ' \|\| session\?.user\?.role === "SUPER_ADMIN"', ''
    $newContent = $newContent -replace '\["CUSTOMER", "ADMIN", "SUPER_ADMIN"\]', '["CUSTOMER", "ADMIN"]'
    $newContent = $newContent -replace '"CUSTOMER" \| "ADMIN" \| "SUPER_ADMIN"', '"CUSTOMER" | "ADMIN"'
    $newContent = $newContent -replace '\["ADMIN", "SUPER_ADMIN"\]\.includes\(session\.user\.role\)', 'session.user.role === "ADMIN"'
    $newContent = $newContent -replace 'function isSuperAdmin\(role: string\) \{\s*return role === "SUPER_ADMIN";\s*\}', ''
    $newContent = $newContent -replace 'if \(\!isSuperAdmin\(token\.role as string\)\) \{\s*return forbiddenResponse\("Only SUPER_ADMIN can change user roles"\);\s*\}', ''
    $newContent = $newContent -replace '<option value="SUPER_ADMIN">Super Admin</option>', ''
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
    }
}
