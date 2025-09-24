#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Run this script to validate your environment setup
 */

// Set NODE_ENV to test for validation
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Simple validation without importing TypeScript modules
function validateEnvironment() {
  // Load environment variables from .env.local if it exists
  const fs = require('fs');
  const path = require('path');
  
  const envLocalPath = path.join(__dirname, '.env.local');
  const envPath = path.join(__dirname, '.env');
  
  // Parse .env files manually
  function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  }
  
  const envLocal = parseEnvFile(envLocalPath);
  const env = parseEnvFile(envPath);
  
  // Merge environment variables
  const allEnv = { ...process.env, ...env, ...envLocal };
  
  return allEnv;
}

const env = validateEnvironment();

console.log('🔍 Validating Environment Configuration...\n');

try {
  // Create config object from environment variables
  const config = {
    app: {
      nodeEnv: env.NODE_ENV || 'development',
      environment: env.ENVIRONMENT || 'development',
      siteUrl: env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      baseUrl: env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    },
    security: {
      nextAuthSecret: env.NEXTAUTH_SECRET,
      cronSecret: env.CRON_SECRET
    },
    redis: {
      url: env.REDIS_URL || env.UPSTASH_REDIS_REST_URL
    },
    firebase: {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY
    },
    crawl4ai: {
      url: env.CRAWL4AI_URL || 'http://localhost:8001'
    },
    ai: {
      openai: env.OPENAI_API_KEY,
      huggingface: env.HUGGINGFACE_API_TOKEN,
      anthropic: env.ANTHROPIC_API_KEY,
      google: env.GOOGLE_AI_API_KEY
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      pagespeedApiKey: env.GOOGLE_PAGESPEED_API_KEY,
      mapsApiKey: env.GOOGLE_MAPS_API_KEY,
      safeBrowsingApiKey: env.GOOGLE_SAFE_BROWSING_API_KEY
    },
    alerts: {
      emailEnabled: env.ALERTS_EMAIL_ENABLED === 'true',
      emailTo: env.ALERTS_EMAIL_TO,
      emailFrom: env.ALERTS_EMAIL_FROM,
      webhookUrl: env.ALERTS_WEBHOOK_URL
    }
  };
  
  // Simple service availability check
  function isServiceAvailable(service) {
    switch (service) {
      case 'redis':
        return !!(config.redis.url);
      case 'firebase':
        return !!(config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey);
      case 'crawl4ai':
        return !!(config.crawl4ai.url && config.crawl4ai.url !== 'disabled');
      default:
        return false;
    }
  }
  
  console.log('📊 Environment Status:');
  console.log('├─ Node Environment:', config.app.nodeEnv);
  console.log('├─ App Environment:', config.app.environment);
  console.log('├─ Site URL:', config.app.siteUrl);
  console.log('└─ Base URL:', config.app.baseUrl);
  
  console.log('\n🔐 Security Configuration:');
  console.log('├─ NextAuth Secret:', config.security.nextAuthSecret ? '✅ Set' : '❌ Missing');
  console.log('└─ Cron Secret:', config.security.cronSecret ? '✅ Set' : '⚠️ Optional');
  
  console.log('\n🗄️ Backend Services:');
  console.log('├─ Redis Available:', isServiceAvailable('redis') ? '✅ Yes' : '⚠️ Mock Mode');
  console.log('├─ Firebase Available:', isServiceAvailable('firebase') ? '✅ Yes' : '❌ Not Configured');
  console.log('└─ Crawl4AI Available:', isServiceAvailable('crawl4ai') ? '✅ Yes' : '❌ Disabled');
  
  console.log('\n🤖 AI Services:');
  console.log('├─ OpenAI:', config.ai.openai ? '✅ Configured' : '⚠️ Not Set');
  console.log('├─ HuggingFace:', config.ai.huggingface ? '✅ Configured' : '⚠️ Not Set');
  console.log('├─ Anthropic:', config.ai.anthropic ? '✅ Configured' : '⚠️ Not Set');
  console.log('└─ Google AI:', config.ai.google ? '✅ Configured' : '⚠️ Not Set');
  
  console.log('\n🔌 Google Services:');
  console.log('├─ OAuth (Client ID):', config.google.clientId ? '✅ Set' : '❌ Missing');
  console.log('├─ OAuth (Client Secret):', config.google.clientSecret ? '✅ Set' : '❌ Missing');
  console.log('├─ PageSpeed API:', config.google.pagespeedApiKey ? '✅ Set' : '❌ Missing');
  console.log('├─ Maps API:', config.google.mapsApiKey ? '✅ Set' : '⚠️ Optional');
  console.log('└─ Safe Browsing API:', config.google.safeBrowsingApiKey ? '✅ Set' : '⚠️ Optional');
  
  console.log('\n📧 Alerts & Monitoring:');
  console.log('├─ Email Alerts:', config.alerts?.emailEnabled ? '✅ Enabled' : '❌ Disabled');
  console.log('├─ Email To:', config.alerts?.emailTo || 'Not Set');
  console.log('├─ Email From:', config.alerts?.emailFrom || 'Not Set');
  console.log('└─ Webhook URL:', config.alerts?.webhookUrl ? '✅ Set' : '⚠️ Not Set');
  
  // Service URLs
  console.log('\n🌐 Service URLs:');
  console.log('├─ Redis:', config.redis.url);
  console.log('├─ Crawl4AI:', config.crawl4ai.url);
  console.log('└─ Firebase Project:', config.firebase.projectId);
  
  // Production readiness check
  const requiredForProduction = [
    config.security.nextAuthSecret && config.security.nextAuthSecret !== 'development-secret-key',
    config.app.siteUrl && !config.app.siteUrl.includes('localhost'),
    isServiceAvailable('firebase'),
    config.google.clientId && config.google.clientSecret,
    config.google.pagespeedApiKey
  ];
  
  const productionReady = requiredForProduction.every(Boolean);
  
  console.log('\n🚀 Production Readiness:');
  console.log(`Status: ${productionReady ? '✅ READY' : '❌ NOT READY'}`);
  
  if (!productionReady) {
    console.log('\n⚠️ Missing Requirements for Production:');
    if (!config.security.nextAuthSecret || config.security.nextAuthSecret === 'development-secret-key') {
      console.log('   • Set a secure NEXTAUTH_SECRET');
    }
    if (!config.app.siteUrl || config.app.siteUrl.includes('localhost')) {
      console.log('   • Set production NEXT_PUBLIC_SITE_URL');
    }
    if (!isServiceAvailable('firebase')) {
      console.log('   • Configure Firebase credentials');
    }
    if (!config.google.clientId || !config.google.clientSecret) {
      console.log('   • Set Google OAuth credentials');
    }
    if (!config.google.pagespeedApiKey) {
      console.log('   • Set Google PageSpeed API key');
    }
  }
  
  console.log('\n✅ Environment validation completed!');
  console.log('📖 See ENVIRONMENT_SETUP.md for detailed setup instructions.\n');
  
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Ensure .env.local exists and contains required variables');
  console.log('2. Check that all API keys are properly formatted');
  console.log('3. Verify Firebase private key has proper newline formatting');
  console.log('4. See ENVIRONMENT_SETUP.md for detailed setup guide\n');
  process.exit(1);
}