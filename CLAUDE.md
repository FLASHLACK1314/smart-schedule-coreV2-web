# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

智能排课系统 (Smart Schedule System V2.0) - 基于 Vue 3 + TypeScript + Vite 的前端项目。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建生产版本（包含类型检查）
npm run build

# 仅构建（不进行类型检查）
npm run build-only

# 预览生产构建
npm run preview
```

## 技术栈

- **Vue 3.5**：使用 Composition API (`<script setup>`)
- **TypeScript 5.9**：类型安全
- **Vite 7**：构建工具
- **无 UI 组件库**：使用纯原生 CSS 和自定义组件

## 项目架构

### 入口
- `src/main.ts`：应用入口，挂载 Vue 实例
- `src/App.vue`：根组件
- `index.html`：HTML 入口文件

### 路径别名
- `@` 映射到 `src/` 目录（在 `vite.config.ts` 中配置）

### TypeScript 配置
- 使用项目引用（project references）架构
- `tsconfig.json`：根配置，引用了 `tsconfig.app.json` 和 `tsconfig.node.json`
- `vue-tsc`：用于 `.vue` 文件的类型检查

### 组件结构
```
src/
├── components/          # 可复用组件
│   ├── HomePage.vue    # 主页面（深色主题首页）
│   └── icons/          # 图标组件
├── assets/            # 静态资源
│   ├── base.css       # CSS 变量和全局样式
│   └── main.css       # 应用样式
├── App.vue            # 根组件
└── main.ts            # 应用入口
```

## 设计风格规范

### 深色主题配色方案
- **主背景渐变**：`#0f0f1a` → `#1a1a2e` → `#16213e`
- **主题色渐变**：`#00d4ff`（青蓝）→ `#7c3aed`（紫色）
- **文字颜色**：
  - 主标题：`#ffffff`
  - 副标题/描述：`#a0aec0`
- **卡片背景**：`rgba(30, 30, 50, 0.8)` 到 `rgba(40, 40, 70, 0.8)`
- **边框**：`rgba(255, 255, 255, 0.1)`

### 视觉特效
- **毛玻璃效果**：`backdrop-filter: blur(10px)`
- **发光效果**：使用青蓝色的阴影 `rgba(0, 212, 255, 0.2)`
- **渐变文字**：使用 `-webkit-background-clip: text`

### 卡片设计
- **圆角**：16px - 20px
- **内边距**：2rem
- **悬停效果**：
  - 上移 8px
  - 顶部显示渐变线条
  - 发光阴影

### 动画效果
- **浮动动画**：3秒循环的上下浮动
- **过渡时长**：0.3s
- **缓动函数**：`cubic-bezier(0.4, 0, 0.2, 1)`

### 按钮样式
- **主按钮**：白色背景 + 紫色文字
- **次要按钮**：透明背景 + 白色边框
- **圆角**：12px
- **悬停**：上移 3px + 阴影

## 开发注意事项

1. **组件风格**：使用 `<script setup lang="ts">` 语法
2. **样式隔离**：使用 `<style scoped>` 避免样式污染
3. **类型安全**：为 props 定义 TypeScript 接口
4. **命名约定**：
   - 组件文件使用 PascalCase（如 `HomePage.vue`）
   - 组件引用使用 PascalCase
5. **响应式**：所有新页面必须适配移动端（使用媒体查询）

## 环境要求

- Node.js: `^20.19.0 || >=22.12.0`
- 推荐使用 VS Code + Vue DevTools 扩展
