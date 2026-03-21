const fs = require('fs');
const path = require('path');

function fixEncoding(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixEncoding(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      const text = fs.readFileSync(fullPath, 'utf8');
      if (text.includes('Ã')) {
        try {
          const fixed = Buffer.from(text, 'latin1').toString('utf8');
          fs.writeFileSync(fullPath, fixed, 'utf8');
          console.log('Fixed:', fullPath);
        } catch (e) {
          console.log('Error on', fullPath, e.message);
        }
      }
    }
  }
}

fixEncoding(path.join(process.cwd(), 'src'));
