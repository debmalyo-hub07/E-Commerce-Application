const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'app', '(admin)', 'admin');

function traverseAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      traverseAndReplace(filePath);
    } else if (file.endsWith('.tsx') && file !== 'layout.tsx') {
      let content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8')) {
        // Replace opening divs
        content = content.replace(
          /<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">\s*<div className="max-w-[a-zA-Z0-9\-]+ mx-auto">/g,
          '<div className="space-y-6">'
        );
        
        // Replace closing divs
        content = content.replace(
          /      <\/div>\r?\n    <\/div>\r?\n  \);\r?\n}/g,
          '    </div>\n  );\n}'
        );
        content = content.replace(
          /      <\/div>\n    <\/div>\n  \);\n}/g,
          '    </div>\n  );\n}'
        );

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
}

traverseAndReplace(directoryPath);
