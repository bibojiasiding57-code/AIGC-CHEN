# AIGC-CHEN 自适应视频体验设计

## 目标

在不改变作品卡片网格、圆角、按钮、悬停预览、双击弹窗和移动端操作方式的前提下，减少黑屏、重复缓冲、无效带宽与多视频内存占用，并提供高端克制的加载过渡。

## 加载架构

采用双区 IntersectionObserver：

- 预热区：`rootMargin: 200px 0px`。卡片接近视口时恢复视频 `src`、使用 `preload="metadata"` 并调用 `load()`，获取元数据和可用首帧。
- 活跃区：真实视口交叉。只有活跃卡片允许悬停或焦点预览；离开活跃区立即暂停。
- 释放区：卡片远离预热区后启动 20 秒延迟。期间未重新进入时暂停、归零、移除 `src` 并调用 `load()` 释放解码器与缓存引用；重新接近时恢复原 URL。
- 任意时刻只有用户当前交互的卡片主动播放。

无法使用 IntersectionObserver 时保留现有 `metadata` 加载与悬停播放，不执行资源卸载。

## 骨架屏与缓冲视觉

- 视频就绪前显示覆盖现有画面的磨砂玻璃骨架层，不改变容器尺寸。
- 骨架层使用低对比暖橙光、细微流动高光和品牌字样；`prefers-reduced-motion` 下停止流动动画。
- `loadeddata` 或 `canplay` 后淡出骨架；`waiting`、`stalled` 时在骨架上显示轻量圆环与“视频缓冲中”。
- 覆盖层始终 `pointer-events: none`，播放按钮保持更高层级。
- 网络错误继续使用现有回退视觉，避免破图图标。

## 移动端与弹窗

- 触屏设备不依赖 hover；点击播放按钮或双击/双触发入口继续打开弹窗。
- 弹窗只加载当前选中作品，使用 `preload="auto"`、`playsInline`、原生 controls 与自动播放请求。
- 弹窗打开后先显示骨架，`loadeddata/canplay/playing` 后淡出；关闭时暂停、归零并卸载弹窗视频源。
- 弹窗加载状态不覆盖关闭按钮或原生控制区域的指针事件。

## 网络自适应

- 当 `navigator.connection.saveData` 为真或 `effectiveType` 为 `2g/slow-2g` 时，关闭视口外预热，只在用户交互时恢复并加载视频。
- 其他网络使用 200px 预热区。
- 当前 GitHub LFS 单一 MP4 不具备自适应码率；本方案优化请求调度、解码器占用和视觉反馈，不伪造清晰度切换能力。

## 组件边界

- 新建 `src/hooks/useAdaptiveVideoSource.js`：管理观察区、延迟释放、网络节省模式和 src 恢复。
- `MediaCard.jsx`：消费 hook 状态，管理预览和骨架/缓冲事件。
- `WorksVideoDialog.jsx`：管理当前弹窗视频加载、骨架和关闭卸载。
- `styles.css`：新增骨架层视觉，不改变现有卡片几何属性。

## 验证

- 测试 200px 预热区、进入时恢复 src、离开后暂停、20 秒后卸载、重新进入取消卸载。
- 测试 Save-Data/2G 下禁止自动预热。
- 测试骨架与缓冲状态切换及 `pointer-events: none`。
- 测试弹窗关闭后卸载视频且保持原有关闭与播放事件。
- 运行全部 Vitest、Vite 生产构建并部署 Vercel；验证 `aigcchen.cn` 生产状态。
