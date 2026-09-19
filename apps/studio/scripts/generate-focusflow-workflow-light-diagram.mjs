import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../../..');
const PUBLIC_DIR = resolve(ROOT_DIR, 'apps/studio/public');
const DOCS_ASSETS_DIR = resolve(ROOT_DIR, 'docs/assets');
const STYLE_GALLERY_DIR = resolve(ROOT_DIR, 'docs-internal/design/style-gallery/assets');

function getHtmlContent(lang = 'zh') {
  const isEn = lang === 'en';

  const t = isEn ? {
    pageTitle: "FocusFlow Studio · Swiss Clean 4K Customer Value & Living Canvas (EN)",
    mainTitle: "FocusFlow Studio",
    subtitle: "The Living Canvas Presentation Engine · Eliminating cognitive overload and slide fragmentation for complex systems",
    pills: [
      { text: "🏛️ Architecture Board Review" },
      { text: "💼 B2B Strategic Pre-Sales" },
      { text: "🔒 Air-Gapped Offline Safe" },
      { text: "✨ 60FPS Living Canvas", highlight: true }
    ],
    pastTitle: "The Broken Past · Legacy Presentation Bottlenecks",
    pastBadge: "COGNITIVE OVERLOAD & FRAGMENTATION",
    pastItems: [
      {
        icon: "📄",
        title: "Legacy Slides (PPT / Keynote): Discrete Slices & Lost Topology",
        desc: "Complex architectures get fragmented into 50+ slides. Jumping between decks breaks spatial context; audiences lose the mental model of system connections."
      },
      {
        icon: "📐",
        title: "Static Canvases (Draw.io / Miro / Visio): Cognitive Overload & Zero Direction",
        desc: "A massive diagram crammed with hundreds of unguided nodes. Presenters frantically wave cursors while listeners get exhausted within minutes."
      },
      {
        icon: "📹",
        title: "Screen Recordings (Loom / OBS): Dead Pixels & Zero Live Interactivity",
        desc: "Pre-recorded videos are dead pixels. When an executive asks 'Wait, show me the database cluster', scrubbing the video fails to inspect schemas or parameters."
      }
    ],
    futureTitle: "The Living Future · FocusFlow Living Canvas Paradigm",
    futureBadge: "INDUSTRIAL LIVING PRESENTATION ENGINE",
    futureMetrics: [
      {
        icon: "✨",
        head: "60 FPS Continuous Frustum Flight",
        val: "Physics-based cubic-bezier flight paths seamlessly connect macro topology to microservice depths without jarring slide breaks."
      },
      {
        icon: "🎯",
        head: "Frustum Framing & Target Lock",
        val: "Intelligent camera frustum frames target nodes with optimal zoom ratios and bounds, locking audience attention securely on the active component."
      },
      {
        icon: "🔍",
        head: "Live Pause & DOM-Level Inspection",
        val: "Pause at any millisecond. Pan, zoom, and hover over live nodes to inspect schemas, RPS, and dependencies during executive Q&A."
      },
      {
        icon: "📦",
        head: "< 5MB Standalone Single-File Bundle",
        val: "Zero SaaS dependencies or external network tracking. Air-gapped compliance for high-security financial and government data centers."
      }
    ],
    cards: [
      {
        step: "STEP 01 / ATTENTION",
        tag: "Camera Frustum",
        tagClass: "tag-spotlight",
        stepColor: "#2563EB",
        title: "Cinematic Camera Framing",
        tagline: "Cognitive Overload ➔ Frustum Target Auto-Focus",
        desc: "Eliminate manual pointer hunting on chaotic canvases. The intelligent camera frustum automatically calculates safe bounding ratios, instantly locking audience focus onto the critical subsystem.",
        diagTitle: "Payment Core Cluster",
        diagStatus: "100% In Focus",
        diagCallout: "🎯 Intelligent Frustum Framing · 16:9 Safe Target Focus",
        m1Label: "Throughput", m1Val: "12,800 TPS",
        m2Label: "P99 Latency", m2Val: "1.42 ms",
        m3Label: "Pods", m3Val: "16 Pods"
      },
      {
        step: "STEP 02 / TRAJECTORY",
        tag: "Spatial Continuity",
        tagClass: "tag-continuity",
        stepColor: "#059669",
        title: "Spatial Continuity",
        tagline: "Slide Fragmentation ➔ 60fps Continuous Flight",
        desc: "Preserve mental context between macro boundaries and microservice depths with smooth physics-based camera travel.",
        macroLabel: "Macro Architecture Canvas (100%)",
        targetLabel: "Target: Microservice Mesh",
        zoomLabel: "Continuous Zoom: 340%",
        kfA: "Keyframe A (Macro Canvas)",
        kfB: "Keyframe B (Micro Deep-Dive)",
        kfMid: "Smooth Transition",
        curveMeta1: "Cubic Bezier (Eased Flight)",
        curveMeta2: "60 FPS Spatial Continuity"
      },
      {
        step: "STEP 03 / INTERACTIVITY",
        tag: "Living Canvas",
        tagClass: "tag-interactive",
        stepColor: "#D97706",
        title: "Interactive Pause",
        tagline: "Dead Pixels ➔ Living Interactive Inspection",
        desc: "When stakeholders interrupt with unexpected inquiries, tap Spacebar to pause and explore. Drill down into live parameters with total confidence.",
        inspectorHead: "Node Inspector · Detail Analysis",
        pauseStatus: "❚❚ Presentation Paused · Explore Live Canvas",
        pauseCursor: "👆 Inspect & Zoom Anywhere"
      },
      {
        step: "STEP 04 / DELIVERY",
        tag: "Dual Delivery",
        tagClass: "tag-delivery",
        stepColor: "#7C3AED",
        title: "Dual Zero-SaaS Delivery",
        tagline: "Delivery Barriers ➔ 1080P Video + Air-Gapped HTML",
        desc: "Deliver smooth 1080P 60fps marketing videos or lightweight standalone HTML files with zero cloud lock-in. Built for strict enterprise compliance.",
        d1Title: "1080P 60FPS Video Export",
        d1Badge: "MP4 Master",
        d1Desc: "Full HD 60fps cinematic video with smooth camera flight and synchronized narration.",
        d2Title: "Standalone Single HTML",
        d2Badge: "< 5MB Bundle",
        d2Desc: "Fully offline & self-contained. Zero cloud reliance for high-security air-gapped rooms."
      }
    ],
    footerLeft: "FocusFlow Studio · Professional Living Canvas Architecture • Swiss International Minimalist Design System • Master Presentation Standard",
    footerRight: "Designed for Architects, CTOs & Solution Directors • MIT Licensed Open Engine"
  } : {
    pageTitle: "FocusFlow Studio · 瑞士极简 4K 客户价值与活画布全景图 (ZH)",
    mainTitle: "FocusFlow Studio",
    subtitle: "The Living Canvas Presentation Engine · 解决认知过载与翻页割裂，让百万行复杂系统一览无余、随时交互下钻",
    pills: [
      { text: "🏛️ 架构委员会评审" },
      { text: "💼 B2B 高端方案竞标" },
      { text: "🔒 涉密隔离机房离线" },
      { text: "✨ 60FPS 活画布范式", highlight: true }
    ],
    pastTitle: "The Broken Past · 传统演示工具的三大困境",
    pastBadge: "体验断层 / 难以支撑复杂系统",
    pastItems: [
      {
        icon: "📄",
        title: "传统幻灯片 (PPT / Keynote)：离散切片，上下文完全割裂",
        desc: "复杂架构被粗暴拆散在几十页胶片中，前后翻页极易造成空间认知迷失，听众无法感知模块间的连通关系。"
      },
      {
        icon: "📐",
        title: "静态白板 (Draw.io / Miro / Visio)：信息过载，缺乏导播视锥",
        desc: "一张大图塞满数百节点与连线，没有时序焦点引导，讲者用鼠标到处乱晃，听众往往在 3 分钟内彻底失去耐心。"
      },
      {
        icon: "📹",
        title: "屏幕录屏 (Loom / OBS)：纯死像素，面对现场质询毫无招架之力",
        desc: "预录制视频只是一堆死像素。评委要求“停一下看底层数据库”，只能尴尬地拉进度条，无法点击查看参数与拓扑。"
      }
    ],
    futureTitle: "The Living Future · FocusFlow 全景活画布破局新范式",
    futureBadge: "工业级全景演示引擎 · 客户价值跃迁",
    futureMetrics: [
      {
        icon: "✨",
        head: "60 FPS 连续视锥运镜",
        val: "基于贝塞尔与物理动力学的无级推轨，全景与局部天然融合，彻底消除幻灯片翻页割裂。"
      },
      {
        icon: "🎯",
        head: "视锥智能取景与目标锁定",
        val: "智能视锥取景框动态框选目标，计算最佳安全视野边界，强力锚定全场注意力，复杂架构轻松讲深讲透。"
      },
      {
        icon: "🔍",
        head: "随时打断 · DOM 级探索",
        val: "告别死像素录屏。任意时刻暂停，自由缩放平移、悬停检查节点元数据与链路，现场答疑满分。"
      },
      {
        icon: "📦",
        head: "< 5MB 单文件离线自闭环",
        val: "零云端外部依赖，脱离 SaaS 订阅锁死，金融、政企涉密隔离机房随时离线安全演播。"
      }
    ],
    cards: [
      {
        step: "STEP 01 / ATTENTION",
        tag: "Camera Frustum",
        tagClass: "tag-spotlight",
        stepColor: "#2563EB",
        title: "电影级视锥取景",
        tagline: "破认知过载 ➔ 视锥秒级锁定对焦",
        desc: "无需在杂乱大图中手动比划。镜头移动时，电影级取景框自动框选计算最佳安全视野，将听众视线瞬间聚焦于核心业务模块。",
        diagTitle: "Payment Core Cluster",
        diagStatus: "100% 视锥对焦",
        diagCallout: "🎯 智能视锥自动取景 · 16:9 安全视野对焦",
        m1Label: "Throughput", m1Val: "12,800 TPS",
        m2Label: "P99 Latency", m2Val: "1.42 ms",
        m3Label: "Pods", m3Val: "16 Pods"
      },
      {
        step: "STEP 02 / TRAJECTORY",
        tag: "Spatial Continuity",
        tagClass: "tag-continuity",
        stepColor: "#059669",
        title: "空间连续运镜",
        tagline: "破翻页切片 ➔ 60fps 无级推轨",
        desc: "告别传统 PPT 前后翻页带来的上下文丢失。从数百节点的全景视图平滑缩放进入微服务深处，局部与整体空间关系天然连贯。",
        macroLabel: "MACRO ARCHITECTURE CANVAS (100%)",
        targetLabel: "Target: Microservice Mesh",
        zoomLabel: "Continuous Zoom: 340%",
        kfA: "Keyframe A (全景全局)",
        kfB: "Keyframe B (局部深潜)",
        kfMid: "Smooth Transition (平滑推进)",
        curveMeta1: "Cubic Bezier (Eased Flight)",
        curveMeta2: "60 FPS 空间零割裂"
      },
      {
        step: "STEP 03 / INTERACTIVITY",
        tag: "Living Canvas",
        tagClass: "tag-interactive",
        stepColor: "#D97706",
        title: "随时暂停探索",
        tagline: "破录屏死像素 ➔ 活画布从容答疑",
        desc: "面对客户高管与评委的突发打断，随时按下空格键暂停演播。全画布任由拖拽、悬停探查节点数据，答疑从容自如，说服力倍增。",
        inspectorHead: "Node Inspector · 节点详情剖析",
        pauseStatus: "❚❚ 演播随时暂停 · 活画布自由探索",
        pauseCursor: "👆 自由悬停 / 缩放下钻"
      },
      {
        step: "STEP 04 / DELIVERY",
        tag: "Dual Delivery",
        tagClass: "tag-delivery",
        stepColor: "#7C3AED",
        title: "双模零依赖交付",
        tagline: "破交付壁垒 ➔ 1080P 视频 + 离线网页",
        desc: "兼顾震撼传播与极端涉密场景。既可导出 1080P 60fps 高帧率高清宣发视频，又能打包为单个小于 5MB 的离线网页，零 SaaS 绑定，安全可靠。",
        d1Title: "1080P 60FPS Video Export",
        d1Badge: "MP4 Master",
        d1Desc: "全高清流畅画质无水印直出 · 自带空间运镜与音轨旁白，一键分发宣传片",
        d2Title: "Standalone Single HTML",
        d2Badge: "< 5MB Bundle",
        d2Desc: "纯离线自闭环运行 · 零外部网络依赖，金融与涉密物理隔离机房即插即开"
      }
    ],
    footerLeft: "FocusFlow Studio · Professional Living Canvas Architecture • Swiss International Minimalist Design System • Master Presentation Standard",
    footerRight: "Designed for Architects, CTOs & Solution Directors • MIT Licensed Open Engine"
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.pageTitle}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 3840px;
      height: 2160px;
      overflow: hidden;
      background-color: #F8FAFC;
      background-image: 
        radial-gradient(circle at 15% 8%, rgba(37, 99, 235, 0.04) 0%, transparent 45%),
        radial-gradient(circle at 85% 12%, rgba(16, 185, 129, 0.03) 0%, transparent 40%),
        radial-gradient(circle at 50% 92%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
        linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
        linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 64px 64px, 64px 64px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", "Inter", "Segoe UI", Arial, sans-serif;
      color: #0F172A;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px 96px 54px 96px;
      position: relative;
    }

    /* Top Swiss Accent Hairline */
    .top-accent-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 7px;
      background: linear-gradient(90deg, #2563EB 0%, #3B82F6 25%, #06B6D4 55%, #10B981 85%, #F59E0B 100%);
    }

    /* ==========================================================================
       1. HEADER ZONE
       ========================================================================== */
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 20px;
      border-bottom: 1.5px solid #E2E8F0;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .header-main-title {
      font-size: 78px;
      font-weight: 800;
      letter-spacing: -2.2px;
      line-height: 1.05;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 26px;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: linear-gradient(135deg, #2563EB, #06B6D4);
      color: #FFFFFF;
      font-size: 38px;
      font-weight: 900;
      box-shadow: 0 12px 24px -6px rgba(37, 99, 235, 0.35);
    }

    .header-subtitle {
      font-size: 26px;
      font-weight: 450;
      color: #64748B;
      letter-spacing: -0.3px;
      max-width: 2200px;
    }

    .header-pills {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 4px;
    }

    .header-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 9999px;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      font-size: 17px;
      font-weight: 600;
      color: #334155;
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.03);
    }

    .header-pill.highlight {
      background: #EFF6FF;
      border-color: #BFDBFE;
      color: #1D4ED8;
    }

    /* ==========================================================================
       2. TOP SECTION: THE PARADIGM SHIFT (The Broken Past vs The Living Future)
       ========================================================================== */
    .benchmark-showcase {
      display: flex;
      gap: 32px;
      height: 440px;
      margin: 22px 0 14px 0;
    }

    /* Left: Broken Past */
    .benchmark-col-past {
      flex: 1;
      background: #FFFFFF;
      border: 1.5px solid #FECACA;
      border-radius: 28px;
      padding: 30px 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 16px 36px -12px rgba(239, 68, 68, 0.06);
      position: relative;
    }

    .col-header-past {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #FEE2E2;
      padding-bottom: 14px;
    }

    .col-title-past {
      font-size: 28px;
      font-weight: 800;
      color: #991B1B;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.4px;
    }

    .badge-past {
      background: #FEF2F2;
      color: #B91C1C;
      border: 1px solid #FECACA;
      font-size: 14px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
    }

    .past-items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .past-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #FFF5F5;
      border: 1px solid #FED7D7;
      padding: 14px 18px;
      border-radius: 16px;
    }

    .past-icon {
      font-size: 22px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .past-text-title {
      font-size: 18px;
      font-weight: 700;
      color: #7F1D1D;
      margin-bottom: 3px;
    }

    .past-text-desc {
      font-size: 15.5px;
      color: #991B1B;
      line-height: 1.4;
    }

    /* Right: Living Future */
    .benchmark-col-future {
      flex: 1.35;
      background: #FFFFFF;
      border: 2px solid #93C5FD;
      border-radius: 28px;
      padding: 30px 38px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 48px -12px rgba(37, 99, 235, 0.12);
      position: relative;
    }

    .col-header-future {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #DBEAFE;
      padding-bottom: 14px;
    }

    .col-title-future {
      font-size: 30px;
      font-weight: 800;
      color: #1E40AF;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.4px;
    }

    .badge-future {
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      font-size: 14px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
    }

    .future-metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .future-metric-card {
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .metric-head {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 19px;
      font-weight: 800;
      color: #0F172A;
    }

    .metric-head span.icon {
      color: #2563EB;
      font-size: 20px;
    }

    .metric-val {
      font-size: 15.5px;
      font-weight: 500;
      color: #475569;
      line-height: 1.42;
    }

    /* ==========================================================================
       3. LOWER SECTION: FOUR ILLUSTRATIVE STORY CARDS
       ========================================================================== */
    .story-row-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 28px;
      height: 1230px;
      margin-bottom: 18px;
    }

    .story-card {
      flex: 1;
      height: 100%;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 32px;
      box-shadow: 0 20px 50px -14px rgba(15, 23, 42, 0.07), 0 4px 16px -2px rgba(0, 0, 0, 0.02);
      padding: 32px 30px 36px 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .connector-arrow {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #94A3B8;
    }

    .connector-arrow svg {
      width: 34px;
      height: 34px;
    }

    /* Card Visual Canvas (Top Half of Card) */
    .card-visual {
      width: 100%;
      height: 700px;
      border-radius: 22px;
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    .card-visual-bar {
      height: 48px;
      background: #FFFFFF;
      border-bottom: 1.5px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
    }

    .visual-window-dots {
      display: flex;
      gap: 7px;
    }
    .v-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
    }
    .v-dot.red { background: #EF4444; }
    .v-dot.yellow { background: #F59E0B; }
    .v-dot.green { background: #10B981; }

    .visual-bar-tag {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .tag-spotlight { background: #EFF6FF; color: #1D4ED8; border: 1px solid #DBEAFE; }
    .tag-continuity { background: #ECFDF5; color: #047857; border: 1px solid #D1FAE5; }
    .tag-interactive { background: #FFF7ED; color: #C2410C; border: 1px solid #FFEDD5; }
    .tag-delivery { background: #F5F3FF; color: #6D28D9; border: 1px solid #EDE9FE; }

    .visual-content-stage {
      flex: 1;
      position: relative;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    /* Card Details (Bottom Half of Card) */
    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 22px;
    }

    .step-badge {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-title {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -0.6px;
      color: #0F172A;
      line-height: 1.15;
    }

    .card-tagline {
      font-size: 21.5px;
      font-weight: 600;
      line-height: 1.35;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-desc {
      font-size: 19px;
      color: #475569;
      line-height: 1.55;
      font-weight: 400;
    }

    /* --------------------------------------------------------------------------
       Visual 1: Camera Frustum Framing
       -------------------------------------------------------------------------- */
    .spotlight-diagram {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .neighbor-node {
      position: absolute;
      border-radius: 14px;
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      font-size: 14.5px;
      font-weight: 600;
      color: #475569;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
    }

    /* Camera Frustum 16:9 Framing Viewport Boundary */
    .frustum-bounding-frame {
      position: absolute;
      width: 480px;
      height: 480px;
      border: 2px dashed #93C5FD;
      border-radius: 28px;
      background: rgba(37, 99, 235, 0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .frustum-aspect-label {
      position: absolute;
      top: -14px;
      left: 28px;
      background: #2563EB;
      color: #FFFFFF;
      font-size: 12.5px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .frustum-corner-bracket {
      position: absolute;
      width: 22px;
      height: 22px;
      border-color: #2563EB;
    }
    .fc-tl { top: -2px; left: -2px; border-top: 4px solid; border-left: 4px solid; border-top-left-radius: 6px; }
    .fc-tr { top: -2px; right: -2px; border-top: 4px solid; border-right: 4px solid; border-top-right-radius: 6px; }
    .fc-bl { bottom: -2px; left: -2px; border-bottom: 4px solid; border-left: 4px solid; border-bottom-left-radius: 6px; }
    .fc-br { bottom: -2px; right: -2px; border-bottom: 4px solid; border-right: 4px solid; border-bottom-right-radius: 6px; }

    .focus-target-node {
      position: relative;
      z-index: 10;
      width: 380px;
      background: #FFFFFF;
      border: 2.5px solid #2563EB;
      border-radius: 20px;
      box-shadow: 0 20px 48px -10px rgba(37, 99, 235, 0.35), 0 0 0 8px rgba(37, 99, 235, 0.08);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .focus-target-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .node-icon-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 19px;
      font-weight: 800;
      color: #0F172A;
    }

    .icon-box-blue {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #2563EB;
      color: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .pill-active-live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ECFDF5;
      color: #059669;
      border: 1px solid #A7F3D0;
      font-size: 13.5px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 9999px;
    }

    .pill-dot-green {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
    }

    .spotlight-metric-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      background: #F8FAFC;
      border-radius: 12px;
      padding: 10px 14px;
      border: 1px solid #E2E8F0;
    }

    .spotlight-metric {
      font-size: 14px;
      color: #64748B;
      font-weight: 500;
    }
    .spotlight-metric strong {
      display: block;
      font-size: 17px;
      color: #0F172A;
      font-weight: 700;
      margin-top: 2px;
    }

    .floating-focus-callout {
      position: absolute;
      bottom: 18px;
      background: #0F172A;
      color: #FFFFFF;
      padding: 9px 18px;
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
    }

    /* --------------------------------------------------------------------------
       Visual 2: Continuous Spatial Flight
       -------------------------------------------------------------------------- */
    .flight-diagram {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px 8px;
    }

    .flight-viewport-preview {
      width: 100%;
      height: 420px;
      position: relative;
      background: #FFFFFF;
      border-radius: 18px;
      border: 1.5px solid #E2E8F0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .macro-frame {
      position: absolute;
      width: 90%;
      height: 85%;
      border: 2px dashed #CBD5E1;
      border-radius: 14px;
      padding: 14px;
    }
    .macro-label {
      font-size: 13.5px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .camera-reticle-box {
      position: absolute;
      width: 230px;
      height: 170px;
      border: 2.5px solid #059669;
      border-radius: 16px;
      background: rgba(16, 185, 129, 0.06);
      box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .reticle-corner {
      position: absolute;
      width: 14px;
      height: 14px;
      border-color: #059669;
    }
    .rc-tl { top: -2px; left: -2px; border-top: 3px solid; border-left: 3px solid; }
    .rc-tr { top: -2px; right: -2px; border-top: 3px solid; border-right: 3px solid; }
    .rc-bl { bottom: -2px; left: -2px; border-bottom: 3px solid; border-left: 3px solid; }
    .rc-br { bottom: -2px; right: -2px; border-bottom: 3px solid; border-right: 3px solid; }

    .bezier-curve-container {
      width: 100%;
      height: 170px;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .curve-labels {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 700;
      color: #64748B;
    }

    .curve-svg-box {
      width: 100%;
      height: 74px;
    }

    .curve-meta-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13.5px;
      font-weight: 600;
      color: #059669;
    }

    /* --------------------------------------------------------------------------
       Visual 3: Living Interactive Canvas
       -------------------------------------------------------------------------- */
    .interactive-diagram {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px 4px;
    }

    .inspector-mockup-card {
      width: 100%;
      background: #FFFFFF;
      border-radius: 18px;
      border: 1.5px solid #CBD5E1;
      box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .inspector-header {
      background: #0F172A;
      color: #FFFFFF;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .inspector-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16.5px;
      font-weight: 700;
    }

    .inspector-body {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .inspect-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #F1F5F9;
    }
    .inspect-label { color: #64748B; font-weight: 500; }
    .inspect-val { color: #0F172A; font-weight: 700; font-family: monospace; }

    .interactive-pause-bar {
      background: #FFF7ED;
      border: 1.5px solid #FED7AA;
      border-radius: 16px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .pause-status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #C2410C;
    }

    .pause-badge-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: #EA580C;
      color: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .cursor-pointer-sim {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border: 1.5px solid #FED7AA;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 13.5px;
      font-weight: 700;
      color: #9A3412;
    }

    /* --------------------------------------------------------------------------
       Visual 4: Dual Delivery (1080P + HTML)
       -------------------------------------------------------------------------- */
    .delivery-diagram {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
      justify-content: center;
    }

    .delivery-split-card {
      width: 100%;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 24px 22px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.04);
    }

    .delivery-icon-box {
      width: 76px;
      height: 76px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      flex-shrink: 0;
    }

    .icon-box-video {
      background: #EFF6FF;
      color: #2563EB;
      border: 1.5px solid #BFDBFE;
    }

    .icon-box-html {
      background: #F5F3FF;
      color: #7C3AED;
      border: 1.5px solid #DDD6FE;
    }

    .delivery-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .delivery-head {
      font-size: 21px;
      font-weight: 800;
      color: #0F172A;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .delivery-pill {
      font-size: 12.5px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 9999px;
    }
    .pill-mp4 { background: #DBEAFE; color: #1E40AF; }
    .pill-html { background: #EDE9FE; color: #5B21B6; }

    .delivery-sub {
      font-size: 15.5px;
      color: #64748B;
      font-weight: 500;
      line-height: 1.4;
    }

    /* ==========================================================================
       4. FOOTER SPECS BAR
       ========================================================================== */
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1.5px solid #E2E8F0;
      font-size: 16px;
      color: #94A3B8;
      font-weight: 500;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 600;
      color: #64748B;
    }
  </style>
</head>
<body>

  <!-- Top Accent Hairline -->
  <div class="top-accent-line"></div>

  <!-- 1. HEADER -->
  <header>
    <div class="header-titles">
      <div class="header-main-title">
        <span class="brand-mark">F</span>
        ${t.mainTitle}
      </div>
      <div class="header-subtitle">
        ${t.subtitle}
      </div>
    </div>
    <div class="header-pills">
      ${t.pills.map(p => `
        <div class="header-pill ${p.highlight ? 'highlight' : ''}">${p.text}</div>
      `).join('')}
    </div>
  </header>

  <!-- 2. TOP SECTION: PARADIGM SHIFT (The Broken Past vs The Living Future) -->
  <div class="benchmark-showcase">
    
    <!-- LEFT: THE BROKEN PAST -->
    <div class="benchmark-col-past">
      <div class="col-header-past">
        <div class="col-title-past">
          <span>⚠️</span>
          ${t.pastTitle}
        </div>
        <div class="badge-past">${t.pastBadge}</div>
      </div>

      <div class="past-items-list">
        ${t.pastItems.map(item => `
          <div class="past-item">
            <div class="past-icon">${item.icon}</div>
            <div>
              <div class="past-text-title">${item.title}</div>
              <div class="past-text-desc">${item.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- RIGHT: THE LIVING FUTURE (FocusFlow) -->
    <div class="benchmark-col-future">
      <div class="col-header-future">
        <div class="col-title-future">
          <span>🚀</span>
          ${t.futureTitle}
        </div>
        <div class="badge-future">${t.futureBadge}</div>
      </div>

      <div class="future-metric-grid">
        ${t.futureMetrics.map(m => `
          <div class="future-metric-card">
            <div class="metric-head">
              <span class="icon">${m.icon}</span>
              ${m.head}
            </div>
            <div class="metric-val">
              ${m.val}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

  </div>

  <!-- 3. LOWER SECTION: FOUR ILLUSTRATIVE STORY CARDS (Visual Capabilities Flow) -->
  <div class="story-row-container">
    
    <!-- CARD 1: CAMERA FRUSTUM FRAMING -->
    <div class="story-card">
      <div class="card-visual">
        <div class="card-visual-bar">
          <div class="visual-window-dots">
            <div class="v-dot red"></div>
            <div class="v-dot yellow"></div>
            <div class="v-dot green"></div>
          </div>
          <div class="visual-bar-tag ${t.cards[0].tagClass}">${t.cards[0].tag}</div>
        </div>
        <div class="visual-content-stage">
          <div class="spotlight-diagram">
            <div class="neighbor-node" style="top: 24px; left: 20px; width: 140px; height: 68px;">User App (Web)</div>
            <div class="neighbor-node" style="top: 32px; right: 24px; width: 150px; height: 68px;">Telemetry Kafka</div>
            <div class="neighbor-node" style="bottom: 90px; left: 28px; width: 155px; height: 68px;">Auth Identity Svc</div>
            <div class="neighbor-node" style="bottom: 80px; right: 24px; width: 150px; height: 68px;">Data Warehouse</div>
            
            <!-- Frustum Framing Bounding Box -->
            <div class="frustum-bounding-frame">
              <div class="frustum-aspect-label">16:9 VIEWPORT FRUSTUM</div>
              <div class="frustum-corner-bracket fc-tl"></div>
              <div class="frustum-corner-bracket fc-tr"></div>
              <div class="frustum-corner-bracket fc-bl"></div>
              <div class="frustum-corner-bracket fc-br"></div>
            </div>

            <div class="focus-target-node">
              <div class="focus-target-header">
                <div class="node-icon-title">
                  <div class="icon-box-blue">⚡</div>
                  ${t.cards[0].diagTitle}
                </div>
                <div class="pill-active-live">
                  <span class="pill-dot-green"></span> ${t.cards[0].diagStatus}
                </div>
              </div>
              <div class="spotlight-metric-row">
                <div class="spotlight-metric">
                  ${t.cards[0].m1Label}
                  <strong>${t.cards[0].m1Val}</strong>
                </div>
                <div class="spotlight-metric">
                  ${t.cards[0].m2Label}
                  <strong>${t.cards[0].m2Val}</strong>
                </div>
                <div class="spotlight-metric">
                  ${t.cards[0].m3Label}
                  <strong>${t.cards[0].m3Val}</strong>
                </div>
              </div>
            </div>

            <div class="floating-focus-callout">
              ${t.cards[0].diagCallout}
            </div>
          </div>
        </div>
      </div>

      <div class="card-meta">
        <div class="step-badge" style="color: ${t.cards[0].stepColor};">${t.cards[0].step}</div>
        <h2 class="card-title">${t.cards[0].title}</h2>
        <div class="card-tagline" style="color: ${t.cards[0].stepColor};">${t.cards[0].tagline}</div>
        <p class="card-desc">${t.cards[0].desc}</p>
      </div>
    </div>

    <!-- CONNECTOR 1 -->
    <div class="connector-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </div>

    <!-- CARD 2: CONTINUOUS FLIGHT -->
    <div class="story-card">
      <div class="card-visual">
        <div class="card-visual-bar">
          <div class="visual-window-dots">
            <div class="v-dot red"></div>
            <div class="v-dot yellow"></div>
            <div class="v-dot green"></div>
          </div>
          <div class="visual-bar-tag ${t.cards[1].tagClass}">${t.cards[1].tag}</div>
        </div>
        <div class="visual-content-stage">
          <div class="flight-diagram">
            <div class="flight-viewport-preview">
              <div class="macro-frame">
                <div class="macro-label">${t.cards[1].macroLabel}</div>
              </div>
              
              <div class="camera-reticle-box">
                <div class="reticle-corner rc-tl"></div>
                <div class="reticle-corner rc-tr"></div>
                <div class="reticle-corner rc-bl"></div>
                <div class="reticle-corner rc-br"></div>
                <div style="font-size: 28px;">🎥</div>
                <div style="font-size: 15.5px; font-weight: 800; color: #065F46;">${t.cards[1].targetLabel}</div>
                <div style="font-size: 13px; font-weight: 600; color: #047857; background: #D1FAE5; padding: 2px 10px; border-radius: 9999px;">
                  ${t.cards[1].zoomLabel}
                </div>
              </div>
            </div>

            <div class="bezier-curve-container">
              <div class="curve-labels">
                <span>${t.cards[1].kfA}</span>
                <span>${t.cards[1].kfMid}</span>
                <span>${t.cards[1].kfB}</span>
              </div>
              <svg class="curve-svg-box" viewBox="0 0 400 64" fill="none">
                <path d="M 10 52 C 130 52, 240 16, 390 16" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
                <circle cx="10" cy="52" r="7" fill="#10B981"/>
                <circle cx="390" cy="16" r="7" fill="#10B981"/>
                <circle cx="200" cy="34" r="5" fill="#047857"/>
              </svg>
              <div class="curve-meta-strip">
                <span>${t.cards[1].curveMeta1}</span>
                <span>${t.cards[1].curveMeta2}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-meta">
        <div class="step-badge" style="color: ${t.cards[1].stepColor};">${t.cards[1].step}</div>
        <h2 class="card-title">${t.cards[1].title}</h2>
        <div class="card-tagline" style="color: ${t.cards[1].stepColor};">${t.cards[1].tagline}</div>
        <p class="card-desc">${t.cards[1].desc}</p>
      </div>
    </div>

    <!-- CONNECTOR 2 -->
    <div class="connector-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </div>

    <!-- CARD 3: LIVING INTERACTIVE -->
    <div class="story-card">
      <div class="card-visual">
        <div class="card-visual-bar">
          <div class="visual-window-dots">
            <div class="v-dot red"></div>
            <div class="v-dot yellow"></div>
            <div class="v-dot green"></div>
          </div>
          <div class="visual-bar-tag ${t.cards[2].tagClass}">${t.cards[2].tag}</div>
        </div>
        <div class="visual-content-stage">
          <div class="interactive-diagram">
            <div class="inspector-mockup-card">
              <div class="inspector-header">
                <div class="inspector-title">
                  <span style="color: #38BDF8;">●</span>
                  ${t.cards[2].inspectorHead}
                </div>
                <span style="font-size: 13px; color: #94A3B8; font-family: monospace;">srv_payment_core</span>
              </div>
              <div class="inspector-body">
                <div class="inspect-field">
                  <span class="inspect-label">Service Name</span>
                  <span class="inspect-val">Payment Orchestrator</span>
                </div>
                <div class="inspect-field">
                  <span class="inspect-label">Protocol</span>
                  <span class="inspect-val">gRPC / HTTP3 Multiplex</span>
                </div>
                <div class="inspect-field">
                  <span class="inspect-label">Active State</span>
                  <span class="inspect-val" style="color: #10B981;">HEALTHY (99.999%)</span>
                </div>
                <div class="inspect-field">
                  <span class="inspect-label">Dependency Count</span>
                  <span class="inspect-val">6 Downstream Clusters</span>
                </div>
              </div>
            </div>

            <div class="interactive-pause-bar">
              <div class="pause-status">
                <div class="pause-badge-icon">❚❚</div>
                ${t.cards[2].pauseStatus}
              </div>
              <div class="cursor-pointer-sim">
                ${t.cards[2].pauseCursor}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-meta">
        <div class="step-badge" style="color: ${t.cards[2].stepColor};">${t.cards[2].step}</div>
        <h2 class="card-title">${t.cards[2].title}</h2>
        <div class="card-tagline" style="color: ${t.cards[2].stepColor};">${t.cards[2].tagline}</div>
        <p class="card-desc">${t.cards[2].desc}</p>
      </div>
    </div>

    <!-- CONNECTOR 3 -->
    <div class="connector-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </div>

    <!-- CARD 4: DUAL DELIVERY -->
    <div class="story-card">
      <div class="card-visual">
        <div class="card-visual-bar">
          <div class="visual-window-dots">
            <div class="v-dot red"></div>
            <div class="v-dot yellow"></div>
            <div class="v-dot green"></div>
          </div>
          <div class="visual-bar-tag ${t.cards[3].tagClass}">${t.cards[3].tag}</div>
        </div>
        <div class="visual-content-stage">
          <div class="delivery-diagram">
            <div class="delivery-split-card">
              <div class="delivery-icon-box icon-box-video">
                ▶
              </div>
              <div class="delivery-info">
                <div class="delivery-head">
                  ${t.cards[3].d1Title}
                  <span class="delivery-pill pill-mp4">${t.cards[3].d1Badge}</span>
                </div>
                <div class="delivery-sub">
                  ${t.cards[3].d1Desc}
                </div>
              </div>
            </div>

            <div class="delivery-split-card">
              <div class="delivery-icon-box icon-box-html">
                &lt;/&gt;
              </div>
              <div class="delivery-info">
                <div class="delivery-head">
                  ${t.cards[3].d2Title}
                  <span class="delivery-pill pill-html">${t.cards[3].d2Badge}</span>
                </div>
                <div class="delivery-sub">
                  ${t.cards[3].d2Desc}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-meta">
        <div class="step-badge" style="color: ${t.cards[3].stepColor};">${t.cards[3].step}</div>
        <h2 class="card-title">${t.cards[3].title}</h2>
        <div class="card-tagline" style="color: ${t.cards[3].stepColor};">${t.cards[3].tagline}</div>
        <p class="card-desc">${t.cards[3].desc}</p>
      </div>
    </div>

  </div>

  <!-- 4. FOOTER SPECS -->
  <footer>
    <div class="footer-left">
      <span>${t.footerLeft}</span>
    </div>
    <div class="footer-right">
      <span>${t.footerRight}</span>
    </div>
  </footer>

</body>
</html>
`;
}

async function renderDiagrams() {
  console.log('🚀 Launching Chromium to render Accurate Swiss Clean 4K Living Canvas Diagrams (ZH & EN)...');
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    viewport: {
      width: 3840,
      height: 2160,
    },
    deviceScaleFactor: 1,
  });

  mkdirSync(PUBLIC_DIR, { recursive: true });
  mkdirSync(DOCS_ASSETS_DIR, { recursive: true });
  mkdirSync(STYLE_GALLERY_DIR, { recursive: true });

  // 1. RENDER CHINESE VERSION
  console.log('📸 Rendering Accurate Chinese Version (focusflow_workflow_light.png)...');
  const zhHtml = getHtmlContent('zh');
  await page.setContent(zhHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const zhBuffer = await page.screenshot({ type: 'png', fullPage: true });
  const zhPublic = resolve(PUBLIC_DIR, 'focusflow_workflow_light.png');
  const zhDocs = resolve(DOCS_ASSETS_DIR, 'focusflow_workflow_light.png');
  const zhGallery = resolve(STYLE_GALLERY_DIR, '02-swiss-clean-4k.png');
  writeFileSync(zhPublic, zhBuffer);
  writeFileSync(zhDocs, zhBuffer);
  writeFileSync(zhGallery, zhBuffer);
  console.log(`✅ Accurate ZH Version saved to ${zhPublic}`);

  // 2. RENDER ENGLISH VERSION
  console.log('📸 Rendering Accurate English Version (focusflow_workflow_light_en.png)...');
  const enHtml = getHtmlContent('en');
  await page.setContent(enHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const enBuffer = await page.screenshot({ type: 'png', fullPage: true });
  const enPublic = resolve(PUBLIC_DIR, 'focusflow_workflow_light_en.png');
  const enDocs = resolve(DOCS_ASSETS_DIR, 'focusflow_workflow_light_en.png');
  const enGallery = resolve(STYLE_GALLERY_DIR, '02-swiss-clean-en-4k.png');
  writeFileSync(enPublic, enBuffer);
  writeFileSync(enDocs, enBuffer);
  writeFileSync(enGallery, enBuffer);
  console.log(`✅ Accurate EN Version saved to ${enPublic}`);

  await browser.close();
  console.log('🎉 Both Accurate ZH & EN 4K Living Canvas Diagrams successfully generated!');
}

renderDiagrams().catch((err) => {
  console.error('❌ Error generating diagrams:', err);
  process.exit(1);
});
