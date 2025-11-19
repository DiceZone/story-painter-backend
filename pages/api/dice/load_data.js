import { promises as fs } from 'fs';
import { join } from 'path';

// 本地文件存储服务
class LocalStorageService {
  constructor() {
    this.storageDir = process.env.LOCAL_STORAGE_DIR || './data';
  }

  getFilePath(key) {
    return join(this.storageDir, `${key}.json`);
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
}

const storageService = new LocalStorageService();

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL ? 
    new URL(process.env.FRONTEND_URL).origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Version');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { key, password } = req.query;

      if (!key || !password) {
        return res.status(400).json({ error: "Missing key or password" });
      }

      const storageKey = `${key}#${password}`;
      
      // 读取数据
      const storedData = await storageService.get(storageKey);

      if (storedData === null) {
        return res.status(404).json({ error: "Data not found" });
      }

      return res.status(200).json(storedData);

    } catch (error) {
      console.error('Load data error:', error);
      return res.status(500).json({ error: '服务器错误 Internal Server Error' });
    }
  }

  // 方法不支持
  return res.status(405).json({ error: 'Method not allowed' });
}