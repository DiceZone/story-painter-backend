export default function HomePage() {
  // 获取当前域名
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
        }
        
        body {
          background: #f8f9ff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #5a4b6c;
          line-height: 1.6;
          padding: 20px;
        }
      `}</style>
      <style jsx>{`
        .container {
          max-width: 740px;
          background: #ffffff;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 15px rgba(137, 207, 240, 0.2);
          margin-bottom: 20px;
          border: 1px solid #e0f0ff;
        }
        
        .header {
          border-bottom: 1px solid #e0f0ff;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        
        .title {
          font-size: 1.7rem;
          margin-bottom: 16px;
          color: #5a8de0;
          text-align: center;
          font-weight: 600;
        }
        
        .description {
          font-size: 0.95rem;
          margin-bottom: 24px;
          color: #7a6b8d;
          text-align: center;
          line-height: 1.7;
        }
        
        .api-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .api-card {
          background-color: #f5f9ff;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: left;
          border-left: 4px solid #8bc2f0;
          box-shadow: 0 2px 4px rgba(137, 207, 240, 0.2);
        }
        
        .api-path {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          font-size: 1rem;
          font-weight: 600;
          color: #5a4b6c;
        }
        
        .api-method {
          display: inline-block;
          background-color: #6fb3e0;
          color: #fff;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          margin-left: 0.5rem;
        }
        
        .api-description {
          font-size: 0.9rem;
          color: #7a6b8d;
          margin-top: 0.5rem;
        }
        
        .domain-hint {
          font-size: 0.85rem;
          color: #8bc2f0;
          margin-top: 0.3rem;
          font-style: italic;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 20px;
            margin: 1rem;
          }
          
          .title {
            font-size: 1.4rem;
          }
        }
      `}</style>
      <div className="container">
        <div className="header">
          <h1 className="title">SealDice Log Service</h1>
        </div>
        <p className="description">
          用于对接海豹骰子（SealDice）的自维护日志存储后端服务。
        </p>
        <div className="api-grid">
          <div className="api-card">
            <div>
              <span className="api-path">/api/dice/log</span>
              <span className="api-method">PUT</span>
            </div>
            <p className="api-description">上传日志文件。</p>
            {currentDomain && (
              <p className="domain-hint">完整路径: {currentDomain}/api/dice/log</p>
            )}
          </div>
          <div className="api-card">
            <div>
              <span className="api-path">/api/dice/load_data</span>
              <span className="api-method">GET</span>
            </div>
            <p className="api-description">根据 Key 和 Password 读取日志数据。</p>
            {currentDomain && (
              <p className="domain-hint">完整路径: {currentDomain}/api/dice/load_data</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
