import { promises as fs } from 'fs';
import { join } from 'path';

// 从EdgeOne API复制的工具函数
function generateRandomString(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateStorageData(data, name) {
  const now = new Date().toISOString();
  return {
    client: "SealDice",
    created_at: now,
    data: data,
    name: name,
    note: "",
    updated_at: now,
  };
}

// 本地文件存储服务
class LocalStorageService {
  constructor() {
    this.storageDir = process.env.LOCAL_STORAGE_DIR || './data';
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
}

const FILE_SIZE_LIMIT_MB = 2;
const storageService = new LocalStorageService();

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL ? 
    new URL(process.env.FRONTEND_URL).origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Version');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'PUT') {
    try {
      const contentLength = req.headers['content-length'];
      if (contentLength && parseInt(contentLength, 10) > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
        return res.status(413).json({ 
          success: false, 
          message: `File size exceeds ${FILE_SIZE_LIMIT_MB}MB limit` 
        });
      }

      // 解析multipart/form-data
      const formData = await new Promise((resolve, reject) => {
        const formidable = require('formidable');
        const form = formidable({ 
          maxFileSize: FILE_SIZE_LIMIT_MB * 1024 * 1024 
        });
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      const { fields, files } = formData;
      const name = fields.name;
      const file = files.file;
      const uniform_id = fields.uniform_id;

      if (!/^[^:]+:\d+$/.test(uniform_id)) {
        return res.status(400).json({ data: "uniform_id field did not pass validation" });
      }

      if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
        return res.status(413).json({ data: "Size is too big!" });
      }

      // 读取文件内容
      const fileContent = await fs.readFile(file.filepath);
      const logdata = fileContent.toString('base64');

      const password = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
      const key = generateRandomString(4);
      const storageKey = `${key}#${password}`;

      // 存储数据
      await storageService.put(storageKey, generateStorageData(logdata, name));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/';
      const responsePayload = { url: `${frontendUrl}?key=${key}#${password}` };

      return res.status(200).json(responsePayload);

    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 方法不支持
  return res.status(405).json({ error: 'Method not allowed' });
}

// 禁用默认的body parser，因为我们要使用formidable
// 注意：这个配置需要放在导出语句之后
export const config = {
  api: {
    bodyParser: false,
  },
};