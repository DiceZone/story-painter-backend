// Utility functions
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

function normalize(url) {
  if (typeof url !== 'string' || !url) {
    throw new Error('未配置前端地址参数 FRONTEND_URL ，请设置运行时的变量 FRONTEND_URL。FRONTEND_URL is not configured. Please set runtime variable FRONTEND_URL.');
  }
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return withProtocol.replace(/\/+$/, '/');
}

// 配置解析函数 - 兼容.env文件和EdgeOne环境
async function resolveFrontendUrl(env) {
  // 优先级：环境变量 > env参数 > 默认值
  const runtimeVar =
    (typeof globalThis !== 'undefined' && globalThis.FRONTEND_URL) ||
    (typeof process !== 'undefined' && process.env && process.env.FRONTEND_URL);
  if (runtimeVar) return normalize(runtimeVar);
  if (env && env.FRONTEND_URL) return normalize(env.FRONTEND_URL);
  
  // 尝试从.env文件读取
  if (typeof process !== 'undefined' && process.env && process.env.FRONTEND_URL) {
    return normalize(process.env.FRONTEND_URL);
  }
  
  throw new Error('未配置前端地址参数FRONTEND_URL，请设置运行时的环境变量或创建.env文件。FRONTEND_URL is not configured. Please set runtime environment variable or create .env file.');
}

// 存储服务 - 支持EdgeOne KV和本地文件存储
class StorageService {
  constructor() {
    this.isEdgeOneEnv = typeof XBSKV !== 'undefined';
    this.storageMode = this.isEdgeOneEnv ? 'edgeone' : 'local';
    
    if (!this.isEdgeOneEnv) {
      console.log('运行在本地模式，数据将存储在本地文件中');
    }
  }

  async put(key, data) {
    if (this.isEdgeOneEnv) {
      // EdgeOne环境使用KV存储
      await XBSKV.put(key, JSON.stringify(data));
      return true;
    } else {
      // 本地环境使用文件存储（简化版，实际需要文件系统支持）
      // 这里使用内存存储作为临时方案
      if (!this.localStorage) {
        this.localStorage = new Map();
      }
      this.localStorage.set(key, JSON.stringify(data));
      return true;
    }
  }

  async get(key) {
    if (this.isEdgeOneEnv) {
      // EdgeOne环境使用KV存储
      const data = await XBSKV.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // 本地环境使用文件存储（简化版）
      if (!this.localStorage) {
        return null;
      }
      const data = this.localStorage.get(key);
      return data ? JSON.parse(data) : null;
    }
  }
}

const FILE_SIZE_LIMIT_MB = 2;

const getCorsHeaders = (frontendUrl, methods = 'GET, PUT, OPTIONS') => ({
  'Access-Control-Allow-Origin': frontendUrl.slice(0, -1),
  'Access-Control-Allow-Methods': methods,
  'Access-Control-Allow-Headers': 'Content-Type, Accept-Version',
});

/**
 * EdgeOne Pages Function handler
 * @param {object} context - The function context.
 * @param {Request} context.request - The incoming request.
 */
export async function onRequest({ request, env }) {
  const { pathname, searchParams } = new URL(request.url);

  let FRONTEND_URL;
  try {
    FRONTEND_URL = await resolveFrontendUrl(env);
  } catch (e) {
    const msg = (e && e.message) ? e.message : '未配置前端地址参数FRONTEND_URL，请设置运行时的变量或编辑 config/appConfig.js 添加用于导出前端地址的参数FRONTEND_URL。FRONTEND_URL is not configured. Please set runtime variable FRONTEND_URL or edit config/appConfig.js.';
    return new Response(msg, { status: 500 });
  }
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(FRONTEND_URL) });
  }

  // 初始化存储服务
  const storageService = new StorageService();

  // --- Route 1: Upload Log ---
  if (pathname.endsWith('/api/dice/log') && request.method === 'PUT') {
    try {
      const contentLength = request.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
        return new Response(
          JSON.stringify({ success: false, message: `File size exceeds ${FILE_SIZE_LIMIT_MB}MB limit` }),
          { status: 413, headers: { ...getCorsHeaders(FRONTEND_URL, 'PUT, OPTIONS'), 'Content-Type': 'application/json' } }
        );
      }

      const formData = await request.formData();
      const name = formData.get("name");
      const file = formData.get("file");
      const uniform_id = formData.get("uniform_id");

      if (!/^[^:]+:\d+$/.test(uniform_id)) {
        return new Response(
          JSON.stringify({ data: "uniform_id field did not pass validation" }),
          { status: 400, headers: { ...getCorsHeaders(FRONTEND_URL, 'PUT, OPTIONS'), 'Content-Type': 'application/json' } }
        );
      }

      if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
        return new Response(
          JSON.stringify({ data: "Size is too big!" }),
          { status: 413, headers: { ...getCorsHeaders(FRONTEND_URL, 'PUT, OPTIONS'), 'Content-Type': 'application/json' } }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      uint8Array.forEach((byte) => { binaryString += String.fromCharCode(byte); });
      const logdata = btoa(binaryString);

      const password = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
      const key = generateRandomString(4);
      const storageKey = `${key}#${password}`;

      // 使用存储服务存储数据
      await storageService.put(storageKey, generateStorageData(logdata, name));

      const responsePayload = { url: `${FRONTEND_URL}?key=${key}#${password}` };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { ...getCorsHeaders(FRONTEND_URL, 'PUT, OPTIONS'), 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Upload error:', error);
      return new Response(error.stack || 'Internal Server Error', { status: 500 });
    }
  }

  // --- Route 2: Load Log Data ---
  if (pathname.endsWith('/api/dice/load_data') && request.method === 'GET') {
    try {
      const key = searchParams.get("key");
      const password = searchParams.get("password");

      if (!key || !password) {
        return new Response(JSON.stringify({ error: "Missing key or password" }), {
          status: 400,
          headers: { ...getCorsHeaders(FRONTEND_URL, 'GET, OPTIONS'), 'Content-Type': 'application/json' },
        });
      }

      const storageKey = `${key}#${password}`;
      
      // 使用存储服务读取数据
      const storedData = await storageService.get(storageKey);

      if (storedData === null) {
        return new Response(JSON.stringify({ error: "Data not found" }), {
          status: 404,
          headers: { ...getCorsHeaders(FRONTEND_URL, 'GET, OPTIONS'), 'Content-Type': 'application/json' },
        });
      }

      return new Response(storedData, {
        status: 200,
        headers: { ...getCorsHeaders(FRONTEND_URL, 'GET, OPTIONS'), 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Load data error:', error);
      return new Response(error.stack || '服务器错误 Internal Server Error', { status: 500 });
    }
  }

  // --- Fallback: Not Found ---
  return new Response('访问的API接口不存在或方式错误，检查API设置是否正确', { status: 404 });
}