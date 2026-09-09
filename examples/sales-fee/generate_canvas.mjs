import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

async function renderCanvas() {
  const { chromium } = await import(
    path.join(projectRoot, 'apps/studio/node_modules/@playwright/test/index.mjs')
  );

  const assetsDir = path.join(__dirname, 'assets');
  
  // Read images as base64 data URIs
  const imgNames = [
    'f3_01_sales_network.png',
    'f3_02_sales_relation_modal.png',
    'f3_03_commission_policy.png',
    'f3_04_commission_policy_modal.png',
    'f3_05_user_fee_generate.png',
    'f4_01_reward_center.png',
    'f4_02_reward_invite_sheet.png',
    'f4_03_referral_poster.png'
  ];

  const imgs = {};
  for (const name of imgNames) {
    const p = path.join(assetsDir, name);
    const b64 = fs.readFileSync(p).toString('base64');
    imgs[name] = `data:image/png;base64,${b64}`;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 5120px;
      height: 2880px;
      background: #070a12;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      position: relative;
      overflow: hidden;
      background-image:
        radial-gradient(circle at 10% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 25%, rgba(168, 85, 247, 0.09) 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, rgba(52, 211, 153, 0.06) 0%, transparent 50%),
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 80px 80px, 80px 80px;
    }

    /* Top Banner Header */
    .top-header {
      position: absolute;
      top: 40px;
      left: 100px;
      right: 100px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(56, 189, 248, 0.2);
      padding-bottom: 20px;
    }
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .logo-badge {
      padding: 8px 18px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #fff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      box-shadow: 0 0 25px rgba(37, 99, 235, 0.5);
    }
    .main-title {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #f8fafc 30%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 20px;
      color: #94a3b8;
      font-weight: 400;
    }
    .header-tags {
      display: flex;
      gap: 14px;
    }
    .tag {
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 17px;
      font-weight: 600;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tag.cyan { border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; }
    .tag.purple { border-color: rgba(168, 85, 247, 0.4); color: #c084fc; }
    .tag.green { border-color: rgba(52, 211, 153, 0.4); color: #34d399; }
    .tag.amber { border-color: rgba(251, 191, 36, 0.4); color: #fbbf24; }

    /* Browser Mockup Window */
    .window-card {
      position: absolute;
      background: #0b1120;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .window-header {
      height: 42px;
      background: #0f172a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    .window-dots {
      display: flex;
      gap: 8px;
    }
    .window-dots span {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }
    .window-title {
      font-size: 15px;
      color: #94a3b8;
      font-weight: 500;
      margin-left: 8px;
    }
    .window-badge {
      margin-left: auto;
      font-size: 13px;
      padding: 3px 10px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-weight: 600;
    }
    .window-body {
      flex: 1;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .window-body img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Phone Mockup Frame */
    .phone-card {
      position: absolute;
      background: #020617;
      border-radius: 46px;
      border: 4px solid #334155;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 35px rgba(192, 132, 252, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .phone-notch {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 130px;
      height: 28px;
      background: #020617;
      border-radius: 20px;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .phone-notch .camera-dot {
      width: 10px;
      height: 10px;
      background: #1e293b;
      border-radius: 50%;
    }
    .phone-label {
      position: absolute;
      top: -38px;
      left: 20px;
      font-size: 18px;
      font-weight: 700;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .phone-body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .phone-body img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Info & Telemetry Cards */
    .telemetry-card {
      position: absolute;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      padding: 36px;
    }
    .telemetry-title {
      font-size: 24px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    .metric-item {
      background: rgba(30, 41, 59, 0.6);
      padding: 22px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .metric-val {
      font-size: 38px;
      font-weight: 800;
      color: #38bdf8;
      font-family: monospace;
      margin-bottom: 6px;
    }
    .metric-name {
      font-size: 16px;
      color: #94a3b8;
    }

    /* Workflow Step Arrows */
    .flow-step-tag {
      position: absolute;
      top: -36px;
      left: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  </style>
</head>
<body>

  <!-- Top Banner -->
  <div class="top-header">
    <div class="header-left">
      <div class="title-row">
        <div class="logo-badge">FOCUSFLOW</div>
        <h1 class="main-title">销售网络拓扑与佣金结算体系 · 全景架构大看板</h1>
      </div>
      <p class="subtitle">全链路闭环架构演进：从 B 端分销团队划分、分佣规则配置，到移动端推客裂变与实时费用对账结算</p>
    </div>
    <div class="header-tags">
      <div class="tag cyan">● B2B2C 闭环链路</div>
      <div class="tag purple">● 移动裂变增长</div>
      <div class="tag green">● 阶梯分佣引擎</div>
      <div class="tag amber">● 实时费用结算</div>
    </div>
  </div>

  <!-- PC 1: 销售网络列表拓扑 -->
  <div class="flow-step-tag" style="left: 100px; top: 225px;">
    <span style="background:#0284c7; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">1</span>
    B端 · 销售网络拓扑与分销商层级 (Sales Network Hierarchy)
  </div>
  <div class="window-card" id="card-sales-network" style="left: 100px; top: 260px; width: 1400px; height: 800px;">
    <div class="window-header">
      <div class="window-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>
      <div class="window-title">https://admin.focusflow.io/sales/network-topology</div>
      <div class="window-badge">组织架构</div>
    </div>
    <div class="window-body">
      <img src="${imgs['f3_01_sales_network.png']}" alt="Sales Network">
    </div>
  </div>

  <!-- PC 2: 归属关系调整弹窗 -->
  <div class="flow-step-tag" style="left: 1560px; top: 225px;">
    <span style="background:#0284c7; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">2</span>
    B端 · 团队绑定与归属关系调整 (Relationship Binding Modal)
  </div>
  <div class="window-card" id="card-sales-relation" style="left: 1560px; top: 260px; width: 1400px; height: 800px;">
    <div class="window-header">
      <div class="window-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>
      <div class="window-title">https://admin.focusflow.io/sales/relation-management#modal</div>
      <div class="window-badge">关系锁定</div>
    </div>
    <div class="window-body">
      <img src="${imgs['f3_02_sales_relation_modal.png']}" alt="Sales Relation Modal">
    </div>
  </div>

  <!-- PC 3: 分佣政策列表 -->
  <div class="flow-step-tag" style="left: 100px; top: 1115px;">
    <span style="background:#0284c7; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">3</span>
    B端 · 佣金规则与分佣政策管理 (Commission Policy Matrix)
  </div>
  <div class="window-card" id="card-commission-policy" style="left: 100px; top: 1150px; width: 1400px; height: 800px;">
    <div class="window-header">
      <div class="window-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>
      <div class="window-title">https://admin.focusflow.io/commission/policy-list</div>
      <div class="window-badge">政策矩阵</div>
    </div>
    <div class="window-body">
      <img src="${imgs['f3_03_commission_policy.png']}" alt="Commission Policy">
    </div>
  </div>

  <!-- PC 4: 政策配置弹窗 -->
  <div class="flow-step-tag" style="left: 1560px; top: 1115px;">
    <span style="background:#0284c7; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">4</span>
    B端 · 阶梯分佣比例与触发规则配置 (Tiered Commission Engine)
  </div>
  <div class="window-card" id="card-policy-modal" style="left: 1560px; top: 1150px; width: 1400px; height: 800px;">
    <div class="window-header">
      <div class="window-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>
      <div class="window-title">https://admin.focusflow.io/commission/policy-editor#rule</div>
      <div class="window-badge">规则引擎</div>
    </div>
    <div class="window-body">
      <img src="${imgs['f3_04_commission_policy_modal.png']}" alt="Policy Modal">
    </div>
  </div>

  <!-- PC 5: 用户费用生成明细 -->
  <div class="flow-step-tag" style="left: 100px; top: 2005px;">
    <span style="background:#10b981; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">5</span>
    B端 · 交易费用生成与佣金对账结算 (Transaction Fee Settlement & Audit)
  </div>
  <div class="window-card" id="card-fee-generate" style="left: 100px; top: 2040px; width: 2860px; height: 760px;">
    <div class="window-header">
      <div class="window-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>
      <div class="window-title">https://admin.focusflow.io/settlement/user-fee-journal</div>
      <div class="window-badge" style="background:rgba(52,211,153,0.2); color:#34d399;">实时对账流水</div>
    </div>
    <div class="window-body">
      <img src="${imgs['f3_05_user_fee_generate.png']}" alt="User Fee Generate">
    </div>
  </div>

  <!-- Mobile 1: 奖励中心 -->
  <div class="phone-label" style="left: 3100px; top: 225px;">
    <span style="background:#9333ea; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">6</span>
    C端 · 推客奖励中心 (Reward Center)
  </div>
  <div class="phone-card" id="phone-reward-center" style="left: 3100px; top: 260px; width: 600px; height: 1300px;">
    <div class="phone-notch"><span class="camera-dot"></span></div>
    <div class="phone-body">
      <img src="${imgs['f4_01_reward_center.png']}" alt="Reward Center">
    </div>
  </div>

  <!-- Mobile 2: 邀请弹层 -->
  <div class="phone-label" style="left: 3760px; top: 225px;">
    <span style="background:#9333ea; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">7</span>
    C端 · 社交裂变邀请 (Invite Sheet)
  </div>
  <div class="phone-card" id="phone-invite-sheet" style="left: 3760px; top: 260px; width: 600px; height: 1300px;">
    <div class="phone-notch"><span class="camera-dot"></span></div>
    <div class="phone-body">
      <img src="${imgs['f4_02_reward_invite_sheet.png']}" alt="Invite Sheet">
    </div>
  </div>

  <!-- Mobile 3: 专属海报 -->
  <div class="phone-label" style="left: 4420px; top: 225px;">
    <span style="background:#9333ea; color:#fff; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">8</span>
    C端 · 专属裂变海报 (Referral Poster)
  </div>
  <div class="phone-card" id="phone-referral-poster" style="left: 4420px; top: 260px; width: 600px; height: 1300px;">
    <div class="phone-notch"><span class="camera-dot"></span></div>
    <div class="phone-body">
      <img src="${imgs['f4_03_referral_poster.png']}" alt="Referral Poster">
    </div>
  </div>

  <!-- Bottom Right: 核心数据闭环指标卡片 -->
  <div class="telemetry-card" id="telemetry-card" style="left: 3100px; top: 1640px; width: 1920px; height: 1160px;">
    <div class="telemetry-title">
      <span style="font-size:32px;">⚡</span>
      <div>
        <div style="font-size:28px; font-weight:800; color:#f8fafc;">分销网络与佣金分账实时性能监控看板</div>
        <div style="font-size:16px; color:#94a3b8; font-weight:400; margin-top:4px;">Distributed Commission & Referral Attribution Realtime Telemetry</div>
      </div>
    </div>
    <div class="metric-grid" style="margin-bottom: 36px;">
      <div class="metric-item">
        <div class="metric-val" style="color:#38bdf8;">18,500<span style="font-size:20px;">/s</span></div>
        <div class="metric-name">实时分佣计算吞吐 (TPS)</div>
      </div>
      <div class="metric-item">
        <div class="metric-val" style="color:#34d399;">&lt; 12<span style="font-size:20px;">ms</span></div>
        <div class="metric-name">关系绑定与锁定延迟 (Latency)</div>
      </div>
      <div class="metric-item">
        <div class="metric-val" style="color:#fbbf24;">99.999<span style="font-size:20px;">%</span></div>
        <div class="metric-name">分账对账精度与准确率</div>
      </div>
      <div class="metric-item">
        <div class="metric-val" style="color:#c084fc;">32.8<span style="font-size:20px;">%</span></div>
        <div class="metric-name">移动端推客海报裂变转化率</div>
      </div>
    </div>

    <!-- Closed Loop Architecture Flowchart in Card -->
    <div style="background:rgba(2, 6, 23, 0.7); border-radius:16px; padding:30px; border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:20px; font-weight:700; color:#e2e8f0; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
        <span style="color:#38bdf8;">◈</span> 业务全链路数据闭环机制 (End-to-End Operational Loop)
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:20px;">
        
        <div style="flex:1; background:rgba(30,41,59,0.5); padding:20px; border-radius:12px; border-left:4px solid #38bdf8;">
          <div style="font-size:16px; font-weight:700; color:#38bdf8; margin-bottom:6px;">Step 1. 架构与绑定</div>
          <div style="font-size:14px; color:#cbd5e1; line-height:1.5;">后台初始化销售组织树，设定推客团队归属，建立不可篡改的拓扑网络。</div>
        </div>

        <div style="color:#64748b; font-size:24px;">➔</div>

        <div style="flex:1; background:rgba(30,41,59,0.5); padding:20px; border-radius:12px; border-left:4px solid #fbbf24;">
          <div style="font-size:16px; font-weight:700; color:#fbbf24; margin-bottom:6px;">Step 2. 阶梯政策下发</div>
          <div style="font-size:14px; color:#cbd5e1; line-height:1.5;">规则引擎实时匹配直推/间推比例，定义消费门槛、结算周期与分红封顶线。</div>
        </div>

        <div style="color:#64748b; font-size:24px;">➔</div>

        <div style="flex:1; background:rgba(30,41,59,0.5); padding:20px; border-radius:12px; border-left:4px solid #c084fc;">
          <div style="font-size:16px; font-weight:700; color:#c084fc; margin-bottom:6px;">Step 3. 移动端海报裂变</div>
          <div style="font-size:14px; color:#cbd5e1; line-height:1.5;">推客生成带参动态二维码与专属海报，通过社交传播吸引新客扫码入会。</div>
        </div>

        <div style="color:#64748b; font-size:24px;">➔</div>

        <div style="flex:1; background:rgba(30,41,59,0.5); padding:20px; border-radius:12px; border-left:4px solid #34d399;">
          <div style="font-size:16px; font-weight:700; color:#34d399; margin-bottom:6px;">Step 4. 履约结算到账</div>
          <div style="font-size:14px; color:#cbd5e1; line-height:1.5;">用户下单核销后自动扣取费用，分佣引擎纳秒级分发至推客钱包并支持一键提现。</div>
        </div>

      </div>

      <div style="margin-top:24px; padding-top:20px; border-top:1px dashed rgba(255,255,255,0.1); display:flex; justify-content:space-between; font-size:14px; color:#94a3b8;">
        <div>🛡️ 安全风控: 自动识别互刷行为与异常设备指纹</div>
        <div>⏱️ 结算时效: T+0 极速结算入账 · 自动生成对账凭单</div>
        <div>🌐 跨端兼容: 支持微信小程序、H5、iOS/Android 原生 App</div>
      </div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, 'canvas_template.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('✓ Wrote canvas_template.html');

  // Launch Chromium
  console.log('⏳ Launching Chromium to render 5120x2880 canvas...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 5120, height: 2880 },
    deviceScaleFactor: 1
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // ensure fonts and images render completely

  const outImagePath = path.join(__dirname, 'system_architecture.png');
  await page.screenshot({
    path: outImagePath,
    type: 'png',
    fullPage: true
  });

  await browser.close();
  console.log(`🎉 Successfully generated 5K Storyboard Canvas: ${outImagePath}`);
  const stats = fs.statSync(outImagePath);
  console.log(`   Image Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (5120 × 2880)`);
}

renderCanvas().catch(err => {
  console.error('❌ Failed to render canvas:', err);
  process.exit(1);
});
