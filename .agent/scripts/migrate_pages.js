const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('layout.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Add 'use client'; if not present
      if (!content.includes("'use client';") && !content.includes('"use client";')) {
        content = "'use client';\n\n" + content;
      }
      
      // Replace react-router-dom imports
      content = content.replace(/import\s+{([^}]*?)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
        let imports = p1.split(',').map(s => s.trim());
        let nextNavigationImports = [];
        let nextLinkImports = [];
        
        for (let imp of imports) {
          if (imp === 'useNavigate') {
            nextNavigationImports.push('useRouter');
          } else if (imp === 'useParams') {
             nextNavigationImports.push('useParams');
          } else if (imp === 'Link') {
             nextLinkImports.push('Link');
          } else if (imp.includes('useLocation')) {
             nextNavigationImports.push('usePathname');
          }
        }
        
        let result = '';
        if (nextNavigationImports.length > 0) {
          result += `import { ${nextNavigationImports.join(', ')} } from 'next/navigation';\n`;
        }
        if (nextLinkImports.length > 0) {
          result += `import Link from 'next/link';\n`;
        }
        return result;
      });
      
      // Replace useNavigate() with useRouter()
      content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\)/g, 'const router = useRouter()');
      content = content.replace(/navigate\(/g, 'router.push(');
      
      // Fix imports
      content = content.replace(/from\s+['"]\.\.\/\.\.\/lib\//g, "from '@/lib/");
      content = content.replace(/from\s+['"]\.\.\/lib\//g, "from '@/lib/");
      content = content.replace(/from\s+['"]\.\.\/\.\.\/components\//g, "from '@/components/");
      content = content.replace(/from\s+['"]\.\.\/components\//g, "from '@/components/");
      content = content.replace(/from\s+['"]\.\.\/\.\.\/contexts\//g, "from '@/contexts/");
      content = content.replace(/from\s+['"]\.\.\/contexts\//g, "from '@/contexts/");
      content = content.replace(/from\s+['"]\.\.\/constants['"]/g, "from '@/lib/constants'");

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src/app');
console.log('Migration script complete.');
