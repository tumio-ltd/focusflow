# FocusFlow Phase 1 (MVP) - Stage 3 进度报告
## Stage 3: 矢量动效与拓扑几何子引擎 (Vector & Motion Sub-Engines)

- **执行日期**：2026-08-28
- **当前状态**：✅ **已完成 (100%)**

---

### 1. 本阶段完成成果清单

| 任务项 | 交付文件 | 完成说明 |
| :--- | :--- | :--- |
| **3.1 自动几何测长与选框生成** | `src/motion/geometry.js` | 实现圆角矩形闭合周长精准推导公式 $P = 2(w+h) - (8-2\pi)r_x$，实现 `getTotalLength()` 自动弧长获取。 |
| **3.2 拓扑流向与三次贝塞尔路由** | `src/motion/bezier-router.js` | 实现 8 向标准吸附锚点系统（`left`, `right`, `top`, `bottom`, `left-top`, `left-bottom` 等）与自动计算控制点生成光滑贝塞尔曲线。 |
| **3.3 动效管线与解说气泡编排** | `src/motion/animator.js` | 实现选框描边生长、持续流动跑马灯（`ff-stream`）、脉冲圆点呼吸动画、气泡阶梯式调度（$T_{delay} = T_{base} + i \cdot \Delta t$）与边界翻转。 |

---

### 2. 数学公式与渲染能力验证

* **圆角矩形测长**：$P = 2(w+h) - 1.7168 \cdot r_x$ 精确消除首尾留缝。
* **三次贝塞尔路由**：从任意两个卡片锚点（例如 `box-folio.right` ➔ `box-postgres.left-top`）自动推导控制点：
  $$CP_1 = (x_1 + \Delta x, y_1), \quad CP_2 = (x_2 - \Delta x, y_2)$$
* **阶梯气泡**：支持多气泡按照 $0.45\text{s}, 0.70\text{s}, 0.95\text{s}$ 依次弹入。

---

### 3. 下一步计划 (Stage 4)
即将进入 **Stage 4: 内置开发者 HUD 标定工具层 (In-Player HUD Calibration Tooling)**：
* 编写 `src/hud/box-picker.js`（鼠标拖拽拉框与逆投影计算）
* 编写 `src/hud/edge-snapper.js`（离屏 Canvas 像素梯度与 4 向光线探测边缘吸附）
* 编写 `src/hud/camera-capturer.js`（当前镜头矩阵参数捕获）
* 编写 `src/hud/hud-manager.js`（快捷键触发与 HUD 控制台面板）
