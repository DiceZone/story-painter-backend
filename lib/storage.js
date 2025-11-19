import { promises as fs } from 'fs';
import { join } from 'path';
import config from './config.js';

class LocalStorageService {
  constructor() {
    this.storageDir = config.getLocalStorageDir();
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`Local storage directory initialized: ${this.storageDir}`);
    } catch (error) {
      console.error('Failed to initialize local storage directory:', error);
    }
  }

  getFilePath(key) {
    return join(this.storageDir, `${key}.json`);
  }

  async put(key, data) {
    try {
      const filePath = this.getFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to store data locally:', error);
      return false;
    }
  }

  async get(key) {
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 文件不存在
      }
      console.error('Failed to read data from local storage:', error);
      return null;
    }
  }

  async delete(key) {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // 文件不存在，视为删除成功
      }
      console.error('Failed to delete data from local storage:', error);
      return false;
    }
  }

  async list() {
    try {
      const files = await fs.readdir(this.storageDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Failed to list files in local storage:', error);
      return [];
    }
  }
}

class StorageService {
  constructor() {
    this.localStorage = new LocalStorageService();
  }

  // 根据环境选择存储方式
  async put(key, data) {
    if (config.isEdgeOneEnvironment() && typeof XBSKV !== 'undefined') {
      // EdgeOne环境使用KV存储
      await XBSKV.put(key, JSON.stringify(data));
      return true;
    } else {
      // 本地环境使用文件存储
      return await this.localStorage.put(key, data);
    }
  }

  async get(key) {
    if (config.isEdgeOneEnvironment() && typeof XBSKV !== 'undefined') {
      // EdgeOne环境使用KV存储
      const data = await XBSKV.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // 本地环境使用文件存储
      return await this.localStorage.get(key);
    }
  }

  async delete(key) {
    if (config.isEdgeOneEnvironment() && typeof XBSKV !== 'undefined') {
      // EdgeOne环境使用KV存储
      await XBSKV.delete(key);
      return true;
    } else {
      // 本地环境使用文件存储
      return await this.localStorage.delete(key);
    }
  }

  // 获取当前存储模式
  getStorageMode() {
    if (config.isEdgeOneEnvironment() && typeof XBSKV !== 'undefined') {
      return 'edgeone';
    }
    return 'local';
  }
}

// 创建单例实例
export const storageService = new StorageService();

export default storageService;