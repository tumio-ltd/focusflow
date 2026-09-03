# FocusFlow 气泡图元智能字号自适应技术方案规范 (Callout Adaptive Typography Specification)

## 1. 背景与核心痛点

FocusFlow 致力于为复杂系统架构图、流程拓扑图提供电影级的镜头聚焦与动态解说体验。在实际应用场景中，用户导入的底图分辨率跨度极大：
* **标准分辨率**：如 1080P（$1920 \times 1080$）；
* **Retina / 超高清架构图**：如 2K（$2560 \times 1440$）、4K（$3840 \times 2160$）乃至 $5120 \times 2880$（5K 视网膜架构图）；
* **不同密度的架构卡片**：从紧凑型接口标签（高度约 $30\text{px}$）到核心微服务容器（高度约 $100\sim 200\text{px}$）。

若 Callout 图元在初始化生成时一律采用固定的静态字号（如正文 $12\text{px}$、徽章 $11\text{px}$、最大宽度 $320\text{px}$），在超高分辨率或大尺寸架构卡片旁边会显得**微小且不易辨识**，破坏了画面层级比例与观赏体验。因此，实现**解说气泡初始化时的视觉智能自适应（Adaptive Visual Typography）**至关重要。

---

## 2. 四大技术实现路径深度剖析

### 方案 1：基于底图基准分辨率与画幅比例的动态几何换算 (Resolution Scale Factor)

#### 原理
架构图的物理文字排版高度与底图的原生基准分辨率（Native Viewport Resolution）呈现强正相关。通常 $1920\text{px}$ 宽度对应约 $12\sim 14\text{px}$ 正文字体。通过建立线性或次线性基准缩放比率，在气泡创建时动态计算初始化默认值。

#### 数学推导
设视口物理尺寸为 $(W_v, H_v)$，基准参考宽度为 $W_{\text{ref}} = 1920$：
$$S_{\text{ratio}} = \frac{\max(W_v, H_v)}{W_{\text{ref}}}$$
为了防止极端分辨率下字号过大失衡，采用次线性对数阻尼或线性区间截断：
$$\text{fontSize} = \operatorname{clamp}\left(11, \operatorname{round}(12 \times \sqrt{S_{\text{ratio}}}), 26\right)$$
$$\text{titleFontSize} = \operatorname{clamp}\left(10, \operatorname{round}(11 \times \sqrt{S_{\text{ratio}}}), 22\right)$$
$$\text{maxWidth} = \operatorname{clamp}\left(260, \operatorname{round}(320 \times S_{\text{ratio}}^{0.75}), 720\right)$$

#### 评估
* **延迟**：$< 0.1\text{ms}$（纯数学计算）。
* **依赖**：零外部依赖，直接读取 `dsl.meta.viewport`。
* **适用场景**：自由浮动放置的气泡、无明确目标框元的全局概览解说。

---

### 方案 2：基于关联目标框元（Target Box）尺寸的自适应推导 (Box Geometric Heuristic)

#### 原理
用户将 Callout 点击放置在特定节点框元（Box，如微服务集群、网关服务）附近或建立绑定关系时，该框元的高度 $H_{\text{box}}$ 通常是内部文字高度的 $3\sim 4.5$ 倍（留出内边距与图标空间）。

#### 数学推导
设目标框元高度为 $H_{\text{box}}$，宽度为 $W_{\text{box}}$：
$$\text{fontSize} = \operatorname{clamp}\left(11, \operatorname{round}(H_{\text{box}} \times 0.20), 24\right)$$
$$\text{titleFontSize} = \operatorname{clamp}\left(10, \operatorname{round}(\text{fontSize} \times 0.9), 20\right)$$
$$\text{maxWidth} = \operatorname{clamp}\left(240, \operatorname{round}(\max(W_{\text{box}} \times 1.1, 300)), 640\right)$$

#### 评估
* **延迟**：$< 0.1\text{ms}$。
* **效果**：解说气泡与所绑定的系统组件在尺度上形成自然呼应。
* **适用场景**：点击节点创建气泡、绑定 `targetBoxId` 的场景。

---

### 方案 3：基于离屏像素水平梯度能量投影直方图 (Horizontal Projection Profile Analysis)

#### 原理
利用 FocusFlow 现有的离屏光栅化引擎 [`SobelEdgeSnapper`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/utils/edgeSnapper.ts)，在内存中访问底图像素数据 `imgData`：
1. 截取点击坐标周围感兴趣区域（ROI，例如 $300 \times 200\text{px}$）；
2. 转换为灰度图并应用 Sobel 梯度滤波；
3. 计算每一行像素的水平梯度能量累计值，生成**水平能量投影直方图**；
4. 文字行会形成周期性的“高频波峰”（笔画边缘）与“低频波谷”（行间距）；
5. 统计连续能量波峰的高度平均值（Cap-height），即可直接度量出图中实际字体的真实物理像素高度。

#### 评估
* **延迟**：$2\sim 8\text{ms}$（纯本地内存 Canvas 运算）。
* **精度**：像素级真实物理高度度量。
* **依赖**：要求底图具备同源或已开启 CORS 以允许读取 `getImageData`。

---

### 方案 4：端侧轻量级 WebAssembly / WebGPU OCR 文本行检测 (On-Device OCR Detection)

#### 原理
在图片导入时或按需对当前视口运行端侧轻量级 OCR 模型（如 PaddleOCR-det 或 Tesseract.js WASM 轻量版）：
1. 仅运行文本检测（Text Detection，无需全量识别字典）；
2. 提取画面中所有文本多边形框的高度集合 $\{h_1, h_2, \dots, h_n\}$；
3. 计算中位数高度 $H_{\text{median}}$ 与局部区域高度 $H_{\text{local}}$；
4. 将当前区域的文本高度直接映射为 Callout 的 `fontSize`。

#### 评估
* **延迟**：导入时一次性异步预计算（约 $200\sim 500\text{ms}$）。
* **附加收益**：不仅能精准匹配字号，还能一键将识别出的节点文本（如“分布式缓存 Redis 集群”）自动填充为框元 ID 和气泡标题。

---

## 3. 方案综合对比矩阵

| 评估维度 | 方案 1 (分辨率比例换算) | 方案 2 (目标框元几何推导) | 方案 3 (像素水平能量投影) | 方案 4 (端侧 OCR 文本检测) |
| :--- | :--- | :--- | :--- | :--- |
| **计算复杂度** | $O(1)$ | $O(1)$ | $O(W_{\text{roi}} \times H_{\text{roi}})$ | $O(\text{CNN Forward})$ |
| **运行耗时** | $\approx 0\text{ms}$ | $\approx 0\text{ms}$ | $2\sim 8\text{ms}$ | $200\sim 600\text{ms}$ |
| **外部资源包** | 0 KB | 0 KB | 0 KB (复用 Sobel) | 约 $2\sim 4\text{MB}$ WASM |
| **CORS 依赖** | 无 | 无 | 需像素读取权限 | 需像素读取权限 |
| **视觉协调度** | 优秀 (解决全局比例) | 极致 (紧贴目标节点) | 像素级精准 | 像素级精准 + 内容识别 |

---

## 4. 推荐落地演进路线 (Phased Evolution Roadmap)

### 第一阶段（当前落地）：双重几何混合推导引擎 (Dual Geometric Adaptive Engine)
构建专门的工具函数 `calculateAdaptiveCalloutStyle`：
1. **第一优先级**：若用户点击放置在某框元内部或上方（或传参包含 `targetBox`），优先按**方案 2（框元高度启发式推导）**计算；
2. **第二优先级**：若用户在画布空白区域自由浮动放置，自动回退至**方案 1（底图基准视口分辨率动态缩放）**；
3. **保留全量自由度**：推导出的初始值写入 `callout.style`，用户后续在右侧 Inspector 中可自由滑动微调覆盖。

### 第二阶段：基于 Sobel 离屏图像数据的微观笔画测高 (Micro-Stroke Profiler)
在 `SobelEdgeSnapper` 中扩充 `estimateLocalTextHeight(x, y)` 辅助函数，当用户 Alt+点击气泡放置时，触发细粒度像素扫描修正。

### 第三阶段：端侧智能标定引擎 (Intelligent Ingestion)
结合 WASM 文本检测，实现“底图导入 -> 自动框选节点 -> 自动识别文字 -> 自动生成匹配字号气泡”的全自动流线化标定。
