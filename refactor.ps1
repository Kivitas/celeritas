$files = Get-ChildItem -Path ".\src", "." -Include *.ts,*.tsx,*.md -Recurse -File
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content

    $content = $content -replace 'tissueDepthMm', 'radiatorThicknessMm'
    $content = $content -replace 'medicalModeActive', 'experimentalModeActive'
    $content = $content -replace 'medicalApplication', 'experimentalApplication'
    $content = $content -replace 'doseRateGyMin', 'fluenceRateGyMin'
    $content = $content -replace 'cumulativeDoseGy', 'cumulativeFluenceGy'
    $content = $content -replace 'clinicalDosePercentError', 'experimentalFluencePercentError'
    
    $content = $content -ireplace 'Tissue Depth', 'Radiator Thickness'
    $content = $content -ireplace 'Tissue', 'Radiator'
    $content = $content -ireplace 'Clinical', 'Experimental'
    $content = $content -ireplace 'Tumor', 'Target'
    $content = $content -ireplace 'Medical', 'Experimental'
    $content = $content -ireplace 'Dose', 'Fluence'
    $content = $content -ireplace 'Phantom', 'Matrix'

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.FullName)"
    }
}
