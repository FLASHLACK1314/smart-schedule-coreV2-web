# QWEN.md - 智能排课系统 V2.0 前端项目

## 项目概述

**智能排课系统 (Smart Schedule System V2.0)** 是一个基于 Vue 3 + TypeScript + Vite 的前端项目，用于管理和自动生成课程表。该系统支持多种用户角色（学生、教师、教务管理员、系统管理员），提供完整的课程安排、教室管理、课表查看等功能。

### 核心功能模块

- **用户认证**：登录/登出、密码修改、个人信息管理
- **基础数据管理**：学院、专业、班级、教师、学生、课程、教室、教学楼
- **教学管理**：课程类型、课程资格、学期、教学班、教学班 - 行政班关联
- **排课管理**：手动排课、智能排课（遗传算法）、课表查看
- **角色权限**：不同用户类型拥有不同的访问权限

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5.x | 核心框架（Composition API） |
| TypeScript | 5.9.x | 类型系统 |
| Vite | 7.x | 构建工具 |
| Vue Router | 4.6.x | 路由管理 |
| Pinia | 3.0.x | 状态管理 |
| Axios | 1.13.x | HTTP 请求 |

---

## 开发与构建命令

```bash
# 安装依赖
npm install

# 启动开发服务器（热重载）
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

**环境要求**：Node.js `^20.19.0 || >=22.12.0`

---

## 项目结构

```
smart-schedule-coreV2-web/
├── src/
│   ├── api/                  # API 接口层
│   │   ├── index.ts          # Axios 实例配置（拦截器、类型转换）
│   │   ├── types.ts          # TypeScript 类型定义
│   │   ├── auth.ts           # 认证相关 API
│   │   ├── teacher.ts        # 教师管理 API
│   │   ├── student.ts        # 学生管理 API
│   │   ├── classroom.ts      # 教室管理 API
│   │   ├── course.ts         # 课程管理 API
│   │   ├── schedule.ts       # 排课管理 API
│   │   └── ...               # 其他模块 API
│   ├── components/           # 可复用组件
│   │   ├── MessageToast.vue  # 全局消息提示组件
│   │   └── icons/            # 图标组件
│   ├── composables/          # 组合式函数
│   │   ├── useMessage.ts     # 消息提示 composable
│   │   └── useClickOutside.ts # 点击外部关闭 composable
│   ├── router/
│   │   └── index.ts          # 路由配置与守卫
│   ├── stores/
│   │   └── user.ts           # 用户状态管理（Pinia）
│   ├── utils/
│   │   ├── storage.ts        # localStorage 封装
│   │   └── timePreference.ts # 时间偏好设置工具
│   ├── views/                # 页面组件
│   │   ├── LoginView.vue
│   │   ├── HomeView.vue
│   │   ├── ProfileView.vue
│   │   ├── TeacherManagementView.vue
│   │   ├── StudentManagementView.vue
│   │   ├── ClassroomManagementView.vue
│   │   ├── CourseManagementView.vue
│   │   ├── ScheduleManagementView.vue
│   │   ├── AutoScheduleView.vue
│   │   ├── TimetableView.vue
│   │   └── ...               # 其他页面
│   ├── assets/
│   │   ├── base.css          # CSS 变量和基础样式
│   │   └── main.css          # 全局样式
│   ├── App.vue               # 根组件
│   └── main.ts               # 应用入口
├── public/                   # 静态资源
├── .env.development          # 开发环境变量
├── .env.production           # 生产环境变量
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目依赖配置
```

---

## 架构设计

### 路径别名

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  }
}
```

### API 层设计

**请求拦截器**：
- 自动添加 `Authorization` 头
- 驼峰命名 → 蛇形命名转换（适配后端）

**响应拦截器**：
- 蛇形命名 → 驼峰命名转换
- 统一错误处理（401 跳转登录、业务错误提示）

**示例**：
```typescript
import { getUserList } from '@/api/teacher'

// 调用时自动完成命名转换
const users = await getUserList({ page: 1, size: 10 })
```

### 状态管理（Pinia）

用户状态存储在 `src/stores/user.ts`：
- `token`：认证令牌
- `userInfo`：用户信息（根据类型存储不同结构）
- `userType`：用户类型（STUDENT/TEACHER/ACADEMIC_ADMIN/SYSTEM_ADMIN）
- `isLoggedIn`：登录状态计算属性

### 路由守卫

```typescript
// 路由 meta 配置
meta: {
  requiresAuth: true,           // 是否需要登录
  allowedRoles: ['SYSTEM_ADMIN'] // 允许访问的角色
}

// beforeEach 守卫逻辑
- requiresAuth && !token → 跳转登录
- /login && token → 跳转首页
```

---

## 开发规范

### 组件风格

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'

// Props 定义
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// 响应式状态
const loading = ref(false)
</script>

<template>
  <div class="component">
    <h2>{{ title }}</h2>
  </div>
</template>

<style scoped>
.component {
  /* 样式 */
}
</style>
```

### 命名约定

| 类型 | 命名风格 | 示例 |
|------|----------|------|
| 组件文件 | PascalCase | `TeacherManagementView.vue` |
| 组件引用 | PascalCase | `<TeacherTable />` |
| 变量/函数 | camelCase | `userList`, `handleClick` |
| 类型接口 | PascalCase | `TeacherInfoDTO`, `AddTeacherVO` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |

### API 类型命名规范

- `xxInfoDTO`：后端返回的数据传输对象
- `xxPageQuery`：分页查询参数
- `xxVO`：请求体对象（View Object）

---

## 设计风格

### 深色主题配色

```css
/* 背景渐变 */
--bg-gradient: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);

/* 主题色 */
--primary: #00d4ff;    /* 青蓝 */
--secondary: #7c3aed;  /* 紫色 */

/* 文字 */
--text-primary: #ffffff;
--text-secondary: #a0aec0;

/* 卡片背景 */
--card-bg: rgba(30, 30, 50, 0.8);
--card-border: rgba(255, 255, 255, 0.1);
```

### 视觉特效

- **毛玻璃效果**：`backdrop-filter: blur(10px)`
- **发光效果**：`box-shadow: 0 0 20px rgba(0, 212, 255, 0.2)`
- **渐变文字**：`background-clip: text; -webkit-text-fill-color: transparent`

---

## 内置工具

### 消息提示系统

```typescript
import { useMessage } from '@/composables/useMessage'

const { success, error, warning, info } = useMessage()

success('操作成功！')        // 绿色
error('操作失败')           // 红色
warning('请注意检查')       // 橙色
info('加载中...')           // 蓝色

// 自定义时长（毫秒）
success('保存成功', 5000)

// 不自动关闭
error('严重错误', 0)
```

### localStorage 封装

```typescript
import { storage } from '@/utils/storage'

storage.setToken('xxx')
storage.getToken()
storage.setUserInfo(userInfo)
storage.getUserInfo()
storage.clearAuth()  // 清除所有登录信息
```

---

## 环境配置

### 开发环境 (`.env.development`)

```
VITE_API_BASE_URL=/api
```

通过 Vite 代理转发到 `http://localhost:8080`

### 生产环境 (`.env.production`)

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 关键文件说明

### `src/api/index.ts`
Axios 实例配置，包含：
- 请求/响应拦截器
- 驼峰 ↔ 蛇形命名自动转换
- 统一错误处理

### `src/api/types.ts`
完整的 TypeScript 类型定义，包括：
- 通用响应结构 `BaseResponse<T>`
- 各模块的 DTO/VO/Query 类型
- 用户类型枚举 `UserType`

### `src/router/index.ts`
路由配置，包含：
- 所有页面路由定义
- 路由守卫（登录验证）
- 角色权限控制

### `src/stores/user.ts`
用户状态管理：
- 登录/登出 action
- 状态持久化
- 多用户类型支持

---

## 常见问题

### 类型检查失败
运行 `npm run type-check` 查看详细错误，确保：
- `.vue` 文件使用 `lang="ts"`
- 导入的类型正确
- Props 定义了类型

### API 请求失败
检查：
1. 开发环境下 Vite 代理配置
2. 后端服务是否运行在 `http://localhost:8080`
3. `.env` 文件中的 `VITE_API_BASE_URL` 配置

### 样式不生效
确保：
- 使用 `<style scoped>` 时类名正确
- 全局样式写在 `src/assets/main.css`
