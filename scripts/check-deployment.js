
#!/usr/bin/env node

// فحص جاهزية المشروع للنشر
console.log('🔍 فحص جاهزية المشروع للنشر على Netlify...\n');

const fs = require('fs');
const path = require('path');

let hasErrors = false;

// فحص الملفات المطلوبة
const requiredFiles = [
  'netlify.toml',
  'package.json',
  'vite.config.ts',
  'index.html'
];

console.log('📁 فحص الملفات المطلوبة:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - مفقود`);
    hasErrors = true;
  }
});

// فحص متغيرات البيئة
console.log('\n🔐 فحص متغيرات البيئة:');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`⚠️  ${envVar} - غير موجود في .env.local`);
    }
  });
} else {
  console.log('⚠️  ملف .env.local غير موجود');
}

// فحص package.json
console.log('\n📦 فحص إعدادات البناء:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (packageJson.scripts && packageJson.scripts.build) {
  console.log('✅ build script موجود');
} else {
  console.log('❌ build script مفقود');
  hasErrors = true;
}

// فحص netlify.toml
console.log('\n🌐 فحص إعدادات Netlify:');
if (fs.existsSync('netlify.toml')) {
  const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
  
  if (netlifyConfig.includes('npm run build')) {
    console.log('✅ أمر البناء محدد بشكل صحيح');
  } else {
    console.log('⚠️  أمر البناء قد يحتاج مراجعة');
  }
  
  if (netlifyConfig.includes('dist')) {
    console.log('✅ مجلد النشر محدد بشكل صحيح');
  } else {
    console.log('⚠️  مجلد النشر قد يحتاج مراجعة');
  }
  
  if (netlifyConfig.includes('redirects')) {
    console.log('✅ إعادة التوجيه للـ SPA محددة');
  } else {
    console.log('⚠️  إعادة التوجيه للـ SPA مفقودة');
  }
} else {
  console.log('❌ ملف netlify.toml مفقود');
  hasErrors = true;
}

// النتيجة النهائية
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ المشروع يحتاج إصلاحات قبل النشر');
  console.log('\nاقرأ ملف DEPLOYMENT.md للحصول على تعليمات مفصلة');
  process.exit(1);
} else {
  console.log('✅ المشروع جاهز للنشر على Netlify!');
  console.log('\nالخطوات التالية:');
  console.log('1. ادفع الكود إلى GitHub');
  console.log('2. اربط المستودع بـ Netlify');
  console.log('3. أضف متغيرات البيئة في Netlify');
  console.log('4. حدث إعدادات Supabase');
  console.log('\nراجع DEPLOYMENT.md للتفاصيل الكاملة');
}
