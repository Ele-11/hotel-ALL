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

## Superpowers 工作流

本项目使用 [obra/superpowers](https://github.com/obra/superpowers) 作为 AI 编程方法论，所有 Skills 已安装到 `~/.mavis/skills/`。

### 核心流程（自动触发）

1. **brainstorming** — 写代码前激活，通过提问完善想法、分块展示设计供确认，保存设计文档到 `docs/superpowers/specs/`
2. **writing-plans** — 设计批准后激活，将工作分解为小任务（每个 2-5 分钟），每个任务包含准确文件路径、完整代码和验证步骤，输出到 `docs/superpowers/plans/`
3. **subagent-driven-development** / **executing-plans** — 有计划时激活，子代理处理每个任务并进行两阶段审查（规范合规性 → 代码质量）
4. **test-driven-development** — 实施过程中激活，遵循 RED-GREEN-REFACTOR：写失败测试 → 写最小代码 → 重构
5. **requesting-code-review** — 任务之间激活，对照计划审查，按严重程度报告问题
6. **finishing-a-development-branch** — 任务完成时激活，验证测试，提供合并/PR/保留/丢弃选项

### 关键原则

- **TDD（测试驱动）** — 先写测试，再写实现，遵循 RED-GREEN-REFACTOR
- **YAGNI** — 不提前实现不需要的功能
- **DRY** — 拒绝重复代码
- **系统性验证** — 证据先行，完成前验证

### Skill 列表（已安装）

| Skill | 用途 |
|-------|------|
| `superpowers/brainstorming` | 苏格拉底式设计细化 |
| `superpowers/writing-plans` | 详细实施计划 |
| `superpowers/executing-plans` | 批量执行与检查点 |
| `superpowers/subagent-driven-development` | 子代理驱动开发（两阶段审查） |
| `superpowers/test-driven-development` | RED-GREEN-REFACTOR 测试循环 |
| `superpowers/systematic-debugging` | 4阶段根因分析调试 |
| `superpowers/verification-before-completion` | 完成前验证 |
| `superpowers/using-git-worktrees` | Git worktree 并行开发 |
| `superpowers/requesting-code-review` | 代码审查流程 |
| `superpowers/receiving-code-review` | 响应审查反馈 |
| `superpowers/finishing-a-development-branch` | 分支完成决策流 |
| `superpowers/dispatching-parallel-agents` | 并行子代理调度 |
| `superpowers/using-superpowers` | Superpowers 系统介绍 |
| `superpowers/writing-skills` | 创建新 Skill 的最佳实践 |

### 开发规则
- 凡是用户提到"实现 Milestone X / 验证 Milestone X / PR Milestone X"，默认使用 .agents/skills/milestone-superpowers-workflow
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
