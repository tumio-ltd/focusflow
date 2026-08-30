# FocusFlow 动态覆盖图层与局部下钻演示 (Dynamic Image Overlay Showcase)

本示例展示了 FocusFlow 的 **Layer 0.5 动态覆盖图层系统（Dynamic Image Overlays）**，用于实现**架构局部下钻、实景 UI 弹窗画中画、微服务子系统展开以及平滑淡出移除**的工业级场景编排。

---

## 🎬 5 大场景时序与动效编排全景

| 场景序号与名称 | 镜头运镜 (Camera) | 动态图元与图层动作 | 业务解说与视觉焦点 |
| :--- | :--- | :--- | :--- |
| **Scene 1: 全局架构拓扑总览** | `zoom: 1.0, x: 0, y: 0` | 无覆盖图，纯净底图 | 展示 LuxeHMS 4 层企业级云端拓扑全局全景 |
| **Scene 2: 数据层与缓存集群聚焦** | `zoom: 1.45, x: -13, y: 5` | 高亮 `box-postgres` (绿色) 与 `box-redis` (玫粉色) | 聚焦右侧数据持久化集群与 Redis 7 高速缓存 |
| **Scene 3: 业务时间线实景下钻 (画中画)** | `zoom: 1.35, x: 0, y: 0` | **✨ 动态加载并弹出 `@examples/02_tape_chart_timeline_mockup.png`**（`zoom-fade` 弹性展开） | 画中画特写展示客房状态时间线交互界面（Tape Chart） |
| **Scene 4: 图片淡出与 CASL 鉴权聚焦** | `zoom: 1.50, x: 20, y: 10` | **💨 自动平滑淡出移除覆盖图片**；高亮左侧 `box-auth-casl` (粉色) | 镜头向左横移聚焦 CASL 细粒度权限管控中心 |
| **Scene 5: 全景拓扑归位** | `zoom: 1.0, x: 0, y: 0` | 运镜平滑拉远回到全局总览 | 演示闭环归位，准备下一轮展示 |

---

## ⚙️ DSL 核心配置要点

### 1. 声明覆盖图元资产 (`elements.images`)
```json
"images": [
  {
    "id": "img-tape-chart",
    "url": "./02_tape_chart_timeline_mockup.png",
    "x": 1400,
    "y": 560,
    "width": 2320,
    "height": 1305,
    "style": {
      "borderRadius": 20,
      "boxShadow": true,
      "border": "2px solid rgba(56, 189, 248, 0.4)",
      "animation": "zoom-fade"
    }
  }
]
```

### 2. 场景激活与声明式移除
* **Scene 3 激活引入**：`"activeElements": { "images": ["img-tape-chart"] }`（触发 0.6s `zoom-fade` 弹性展开）；
* **Scene 4 自动卸载**：`"activeElements": { "images": [] }`（引擎自动执行 0.5s 平滑淡出并卸载）。
