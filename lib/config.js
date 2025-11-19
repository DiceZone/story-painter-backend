import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 配置优先级：环境变量 > .env文件 > 默认值
class ConfigManager {
  constructor() {
    this.loadEnvFile();
  }

  loadEnvFile() {
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!value.startsWith('#') && key.trim()) {
            acc[key.trim()] = value.replace(/'/g, '').replace(/"/g, '');
          }
        }
        return acc;
      }, {});
      
      // 将.env文件中的变量设置到process.env（如果环境变量不存在）
      Object.entries(envVars).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
    }
  }

  get(key, defaultValue = null) {
    // 优先从环境变量获取
    if (process.env[key] !== undefined) {
      return process.env[key];
    }
    
    return defaultValue;
  }

  getRequired(key) {
    const value = this.get(key);
    if (value === null || value === undefined) {
      throw new Error(`Required configuration '${key}' is missing`);
    }
    return value;
  }

  // 获取存储模式
  getStorageMode() {
    return this.get('STORAGE_MODE', 'edgeone').toLowerCase();
  }

  // 获取前端URL
  getFrontendUrl() {
    return this.getRequired('FRONTEND_URL');
  }

  // 获取本地存储目录
  getLocalStorageDir() {
    return this.get('LOCAL_STORAGE_DIR', './data');
  }

  // 检查是否在EdgeOne环境中
  isEdgeOneEnvironment() {
    return typeof XBSKV !== 'undefined' || this.getStorageMode() === 'edgeone';
  }
}

// 创建单例实例
export const config = new ConfigManager();

export default config;