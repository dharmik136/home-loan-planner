import fs from 'fs';
import path from 'path';

const src = path.join(process.cwd(), 'dist', 'index.html');
const dest = path.join(process.cwd(), '..', 'index.html');

try {
  fs.copyFileSync(src, dest);
  console.log('Success: Copied web/dist/index.html to repository root index.html');
} catch (err) {
  console.error('Error copying build file:', err);
  process.exit(1);
}
