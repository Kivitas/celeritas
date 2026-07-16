import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('./src');
files.push('./README.md');

let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    content = content.replace(/tissueDepthMm/g, 'radiatorThicknessMm');
    content = content.replace(/medicalModeActive/g, 'experimentalModeActive');
    content = content.replace(/medicalApplication/g, 'experimentalApplication');
    content = content.replace(/doseRateGyMin/g, 'fluenceRateGyMin');
    content = content.replace(/cumulativeDoseGy/g, 'cumulativeFluenceGy');
    content = content.replace(/clinicalDosePercentError/g, 'experimentalFluencePercentError');
    
    // Case-insensitive semantic replacements in strings/JSX text
    content = content.replace(/Tissue Depth/gi, 'Radiator Thickness');
    content = content.replace(/Tissue/g, 'Radiator');
    content = content.replace(/tissue/g, 'radiator');
    
    content = content.replace(/Clinical/g, 'Experimental');
    content = content.replace(/clinical/g, 'experimental');
    
    content = content.replace(/Tumor/gi, 'Target');
    content = content.replace(/tumor/gi, 'target');
    
    content = content.replace(/Medical/g, 'Experimental');
    content = content.replace(/medical/g, 'experimental');
    
    content = content.replace(/Dose/g, 'Fluence');
    content = content.replace(/dose/g, 'fluence');
    
    content = content.replace(/Phantom/g, 'Matrix');
    content = content.replace(/phantom/g, 'matrix');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        totalReplaced++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Refactoring complete. Modified ${totalReplaced} files.`);
