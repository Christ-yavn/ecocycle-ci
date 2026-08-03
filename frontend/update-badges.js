const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const map = {
  'tone="forest"': 'tone="primary"',
  'tone="amber"': 'tone="warning"',
  'tone="signal"': 'tone="success"',
  'tone="rust"': 'tone="danger"',
  'tone="paper"': 'tone="outline"'
};

walk('src', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [oldTone, newTone] of Object.entries(map)) {
      if (content.includes(oldTone)) {
        content = content.replaceAll(oldTone, newTone);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
