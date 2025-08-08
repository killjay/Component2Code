const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Figma Plugin...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

try {
  // Compile TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compiled successfully');

  // Copy UI file
  console.log('📋 Copying UI file...');
  const srcUiPath = path.join(__dirname, 'src', 'ui.html');
  const distUiPath = path.join(__dirname, 'dist', 'ui.html');
  
  if (fs.existsSync(srcUiPath)) {
    fs.copyFileSync(srcUiPath, distUiPath);
    console.log('✅ UI file copied successfully');
  } else {
    console.error('❌ ui.html not found in src directory');
    process.exit(1);
  }

  // Verify files exist
  const codeJsPath = path.join(__dirname, 'dist', 'code.js');
  const uiHtmlPath = path.join(__dirname, 'dist', 'ui.html');
  
  if (fs.existsSync(codeJsPath) && fs.existsSync(uiHtmlPath)) {
    console.log('🎉 Build completed successfully!');
    console.log('📁 Generated files:');
    console.log(`   - ${path.relative(__dirname, codeJsPath)}`);
    console.log(`   - ${path.relative(__dirname, uiHtmlPath)}`);
  } else {
    console.error('❌ Build verification failed');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}