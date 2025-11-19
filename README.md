# SealDice Log Backend

支持双模式运行的后端服务：
- **EdgeOne Pages 模式**：使用腾讯云EdgeOne Pages和KV存储
- **本地服务器模式**：使用本地JSON文件存储

## 项目结构

```
story-painter-backend/
├── functions/                 # EdgeOne Pages Functions
│   └── api/dice/
│       └── [...slug].js       # EdgeOne API处理函数
├── pages/                     # Next.js页面和API路由
│   ├── api/dice/             # 本地服务器API路由
│   │   ├── log.js            # 上传日志API
│   │   └── load_data.js      # 读取数据API
│   └── index.js              # 主页
├── lib/                      # 工具库
│   ├── config.js             # 配置管理
│   └── storage.js            # 存储服务抽象层
├── .env.example              # 环境变量示例
├── next.config.js           # Next.js配置
└── package.json             # 项目依赖
```

## 配置说明

### 环境变量配置

配置优先级：**环境变量 > .env文件 > 默认值**

创建 `.env` 文件（参考 `.env.example`）：

```env
# 前端地址配置
FRONTEND_URL=https://your-domain.com/

# 存储模式配置 (edgeone 或 local)
STORAGE_MODE=edgeone

# 本地存储目录 (仅当STORAGE_MODE=local时生效)
LOCAL_STORAGE_DIR=./data
```

### 运行模式

#### 1. EdgeOne Pages 模式 (默认)
- 使用腾讯云EdgeOne KV存储
- 适合生产环境部署
- 配置：`STORAGE_MODE=edgeone`

#### 2. 本地服务器模式
- 使用本地JSON文件存储
- 适合开发和测试
- 配置：`STORAGE_MODE=local`

## 部署方式

### EdgeOne Pages 部署

1. 在腾讯云EdgeOne Pages中创建项目
2. 配置环境变量：
   - `FRONTEND_URL`: 你的域名
   - `STORAGE_MODE`: `edgeone`
3. 绑定KV存储到 `XBSKV`
4. 部署项目

### 本地服务器运行

#### 方式一：使用提供的脚本
```bash
# 开发模式
npm run dev:local

# 生产模式
npm run start:local
```

#### 方式二：手动设置环境变量
```bash
# 开发模式
FRONTEND_URL=http://localhost:3000 STORAGE_MODE=local npm run dev

# 生产模式
FRONTEND_URL=http://localhost:3000 STORAGE_MODE=local npm run start
```

## API接口

### 上传日志
- **路径**: `/api/dice/log`
- **方法**: `PUT`
- **参数**: `name`, `file`, `uniform_id`
- **返回**: 包含访问URL的JSON

### 读取数据
- **路径**: `/api/dice/load_data`
- **方法**: `GET`
- **参数**: `key`, `password`
- **返回**: 存储的日志数据

## 注意事项

1. **文件大小限制**: 单个文件最大2MB
2. **CORS配置**: 自动根据FRONTEND_URL配置跨域
3. **数据存储**: 
   - EdgeOne模式：数据存储在EdgeOne KV中
   - 本地模式：数据存储在 `./data` 目录下的JSON文件中
4. **环境变量**: 确保在生产环境正确设置环境变量

## 开发说明

项目同时支持两种运行模式，确保API接口在两种环境下行为一致。存储层通过抽象设计，自动根据环境选择适当的存储方式。