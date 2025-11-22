"use strict";
/**
 * Configuration management with environment variable validation
 * Ensures all required environment variables are present and valid
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = void 0;
exports.getConfig = getConfig;
class ConfigurationError extends Error {
    constructor(message) {
        super(`Configuration Error: ${message}`);
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
function getRequiredEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new ConfigurationError(`Missing required environment variable: ${name}`);
    }
    return value;
}
function getOptionalEnvVar(name, defaultValue) {
    return process.env[name] || defaultValue;
}
function getNumericEnvVar(name, defaultValue) {
    const value = process.env[name];
    if (!value)
        return defaultValue;
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
        throw new ConfigurationError(`Environment variable ${name} must be a valid number`);
    }
    return numValue;
}
function validateDatabaseUrl(url) {
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
        throw new ConfigurationError('DATABASE_URL must be a valid PostgreSQL connection string');
    }
}
function validateHederaAccountId(accountId) {
    const accountIdRegex = /^0\.0\.\d+$/;
    if (!accountIdRegex.test(accountId)) {
        throw new ConfigurationError('HEDERA_ACCOUNT_ID must be in format 0.0.XXXXXX');
    }
}
function validateHederaPrivateKey(privateKey) {
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        throw new ConfigurationError('HEDERA_PRIVATE_KEY must be a valid hex string starting with 0x');
    }
}
function validateJwtSecret(secret) {
    if (secret.length < 32) {
        throw new ConfigurationError('JWT_SECRET must be at least 32 characters long');
    }
}
function loadConfiguration() {
    try {
        // Database configuration
        const databaseUrl = getRequiredEnvVar('DATABASE_URL');
        validateDatabaseUrl(databaseUrl);
        const database = {
            url: databaseUrl,
            maxConnections: getNumericEnvVar('DB_MAX_CONNECTIONS', 20),
            connectionTimeout: getNumericEnvVar('DB_CONNECTION_TIMEOUT', 2000),
            idleTimeout: getNumericEnvVar('DB_IDLE_TIMEOUT', 30000)
        };
        // AI configuration
        const geminiApiKey = getRequiredEnvVar('GEMINI_API_KEY');
        const ai = {
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
        const hedera = {
            accountId: hederaAccountId,
            privateKey: hederaPrivateKey,
            consensusTopicId: hederaConsensusTopicId,
            network: getOptionalEnvVar('HEDERA_NETWORK', 'testnet')
        };
        // App configuration
        const jwtSecret = getRequiredEnvVar('JWT_SECRET');
        validateJwtSecret(jwtSecret);
        const app = {
            jwtSecret,
            appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
            nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),
            port: getNumericEnvVar('PORT', 3000)
        };
        return {
            database,
            ai,
            hedera,
            app
        };
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            console.error('❌ Configuration validation failed:', error.message);
            console.error('Please check your .env.local file and ensure all required environment variables are set.');
            process.exit(1);
        }
        throw error;
    }
}
// Singleton pattern for configuration
let configInstance = null;
function getConfig() {
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
