/**
 * Configuration management with environment variable validation
 * Ensures all required environment variables are present and valid
 */

interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  // Neon-specific configurations
  coldStartTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface AIConfig {
  geminiApiKey: string;
  maxRetries: number;
  timeout: number;
}

interface HederaConfig {
  accountId: string;
  privateKey: string;
  consensusTopicId: string;
  network: 'testnet' | 'mainnet';
}

interface AppConfig {
  jwtSecret: string;
  appUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
}

interface Config {
  database: DatabaseConfig;
  ai: AIConfig;
  hedera: HederaConfig;
  app: AppConfig;
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigurationError(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getNumericEnvVar(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) {
    throw new ConfigurationError(`Environment variable ${name} must be a valid number`);
  }
  return numValue;
}

function validateDatabaseUrl(url: string): void {
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new ConfigurationError('DATABASE_URL must be a valid PostgreSQL connection string');
  }
}

function validateHederaAccountId(accountId: string): void {
  const accountIdRegex = /^0\.0\.\d+$/;
  if (!accountIdRegex.test(accountId)) {
    throw new ConfigurationError('HEDERA_ACCOUNT_ID must be in format 0.0.XXXXXX');
  }
}

function validateHederaPrivateKey(privateKey: string): void {
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    throw new ConfigurationError('HEDERA_PRIVATE_KEY must be a valid hex string starting with 0x');
  }
}

function validateJwtSecret(secret: string): void {
  if (secret.length < 32) {
    throw new ConfigurationError('JWT_SECRET must be at least 32 characters long');
  }
}

function loadConfiguration(): Config {
  try {
    // Database configuration (using Supabase - no DATABASE_URL needed)
    const database: DatabaseConfig = {
      url: 'supabase', // Placeholder
      maxConnections: 20,
      connectionTimeout: 20000,
      idleTimeout: 30000,
      coldStartTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 2000
    };

    // AI configuration
    const geminiApiKey = getRequiredEnvVar('GEMINI_API_KEY');
    const ai: AIConfig = {
      geminiApiKey,
      maxRetries: getNumericEnvVar('AI_MAX_RETRIES', 3),
      timeout: getNumericEnvVar('AI_TIMEOUT', 30000)
    };

    // Hedera configuration
    const hederaAccountId = getRequiredEnvVar('HEDERA_ACCOUNT_ID');
    const hederaPrivateKey = getRequiredEnvVar('HEDERA_PRIVATE_KEY');
    const hederaConsensusTopicId = getRequiredEnvVar('HEDERA_CONSENSUS_TOPIC_ID');
    
    validateHederaAccountId(hederaAccountId);
    validateHederaPrivateKey(hederaPrivateKey);
    
    const hedera: HederaConfig = {
      accountId: hederaAccountId,
      privateKey: hederaPrivateKey,
      consensusTopicId: hederaConsensusTopicId,
      network: getOptionalEnvVar('HEDERA_NETWORK', 'testnet') as 'testnet' | 'mainnet'
    };

    // App configuration
    const jwtSecret = getRequiredEnvVar('JWT_SECRET');
    validateJwtSecret(jwtSecret);
    
    const app: AppConfig = {
      jwtSecret,
      appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
      nodeEnv: getOptionalEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
      port: getNumericEnvVar('PORT', 3000)
    };

    return {
      database,
      ai,
      hedera,
      app
    };

  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('❌ Configuration validation failed:', error.message);
      console.error('Please check your .env.local file and ensure all required environment variables are set.');
      process.exit(1);
    }
    throw error;
  }
}

// Singleton pattern for configuration
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfiguration();
    console.log('✅ Configuration loaded successfully');
  }
  return configInstance;
}

// Validate configuration on module load in production
if (process.env.NODE_ENV === 'production') {
  getConfig();
}

export { ConfigurationError };
export type { Config, DatabaseConfig, AIConfig, HederaConfig, AppConfig };