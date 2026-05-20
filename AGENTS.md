# AGENTS.md

## 项目说明

本项目是一个酒店预订平台 MVP。

项目包含：

- 用户端移动端酒店预订页面
- 管理端 PC 酒店管理页面
- Nest.js 后端接口
- Prisma + PostgreSQL 数据库

## 技术栈

- 前端：React18 + TypeScript + Axios + Zustand + Tailwind CSS
- 后端：Nest.js + TypeScript + Prisma
- 数据库：PostgreSQL
- 工程架构：Monorepo + pnpm workspace

## 项目文档

开发前必须先阅读：

- docs/SPEC.md
- docs/MILESTONES.md
- docs/API.md

不要随意扩展文档之外的大功能。

## Skill 使用规则

前端 UI 页面开发时，使用项目内的 UI skill：

- `.agents/skills/ele-ui`

适用场景：

- 酒店查询页
- 酒店列表页
- 酒店详情页
- 登录/注册页
- 商户酒店管理页
- 管理员审核/发布/下线页

不适用场景：

- 后端逻辑
- 数据库设计
- Prisma migration
- API 实现
- 登录鉴权逻辑
- 权限控制逻辑

## 开发规则

- 一次只实现一个 Milestone。
- 每次实现Milestone时，先确保从远程仓库拉取最新的代码，然后都必须新建一个Milestone分支来开发。
- 不要提前实现后续 Milestone。
- 保持代码简单、清晰、可维护。
- 不要随意新增依赖。
- 不要硬编码密钥。
- 用户端只展示已发布酒店。
- 商户只能管理自己创建的酒店。
- 管理员接口必须校验管理员角色。
- MVP 阶段不实现真实支付。

## 验证规则

任务完成前，尽量运行以下命令：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
