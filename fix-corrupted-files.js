const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('route.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const apiDir = path.join(__dirname, 'frontend/src/app/api');
const files = walk(apiDir);

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('`n  const token = session?.user;')) {
        content = content.replace(/`n\s+const token = session\?\.user;/g, '\n  const token = session?.user;');
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
});

console.log(`Fixed ${count} files.`);
