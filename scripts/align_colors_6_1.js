import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('slate-')) {
                // Global replacement of slate- with neutral-
                const newContent = content.replace(/slate-/g, 'neutral-');
                fs.writeFileSync(filePath, newContent);
                console.log(`Updated color tokens in: ${filePath}`);
            }
        }
    });
}

console.log('Starting Phase 6.1: Aligning Colors (Slate -> Neutral)...');
walk(srcDir);
console.log('Color alignment complete.');
