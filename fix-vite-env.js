#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envMjsPath = path.join(__dirname, 'node_modules/vite/dist/client/env.mjs');

if (fs.existsSync(envMjsPath)) {
  let content = fs.readFileSync(envMjsPath, 'utf8');
  
  // Fix the __DEFINES__ issue
  const oldDefines = 'const defines = __DEFINES__;';
  const newDefines = "const defines = typeof __DEFINES__ !== 'undefined' ? __DEFINES__ : {};";
  
  if (content.includes(oldDefines)) {
    content = content.replace(oldDefines, newDefines);
    fs.writeFileSync(envMjsPath, content, 'utf8');
    console.log('✅ Fixed Vite env.mjs __DEFINES__ issue');
  } else {
    console.log('✅ Vite env.mjs already fixed or different version');
  }
} else {
  console.log('⚠️  Vite env.mjs not found');
}