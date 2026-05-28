---
name: milestone-superpowers-workflow
description: 当在 hotel-All 项目中处理 Milestone 计划、执行、完成前验证、bug 修复、Code Review、提交推送创建 PR、远程分支清理时使用，尤其是用户提到 Milestone、Use Writing plans、Verification before completion、Systematic debugging、Git/worktree workflows 或 Code review workflows。
---

# Milestone Superpowers 工作流

## 总原则

这是 hotel-All 项目的固定 Milestone 开发流程。目标是把用户反复给出的提示词内化为标准动作：一次只做一个 Milestone，先同步远程 `dev`，新建 Milestone 分支，严格按项目文档和 Superpowers 流程执行，不提前实现后续功能。

## 每次必须先读

开始任何 Milestone 工作前，必须阅读：

- `AGENTS.md`
- `docs/SPEC.md`
- `docs/MILESTONES.md`
- `docs/API.md`

如果任务涉及前端 UI 页面，必须同时使用项目内 UI skill：

- `.agents/skills/ele-ui`

适用页面包括酒店查询页、酒店列表页、酒店详情页、登录/注册页、商户酒店管理页、管理员审核/发布/下线页。用户端必须按移动端体验处理，商户和管理员端按 PC 端体验处理。

禁止批量删除文件或目录。不要使用 `del /s`、`rd /s`、`rmdir /s`、`Remove-Item -Recurse`、`rm -rf`。需要删除多个文件时，停止操作并让用户手动删除。

## 提示词到流程的映射

| 用户提示词类型 | 必须执行的流程 |
| --- | --- |
| 写计划，`Use Writing plans`，准备实现某个 Milestone | 使用 `superpowers:writing-plans`。只写计划，不写代码。 |
| 执行计划，实现这个 Milestone | 新建 Milestone 分支；推荐 Subagent-Driven；按任务拆分并在每个任务后 review。 |
| 完成前检验，`Use Verification before completion` | 使用 `superpowers:verification-before-completion`，按 Milestone 验收标准和验证命令检查。 |
| 出现 bug，`Use Systematic debugging` | 使用 `superpowers:systematic-debugging`，从当前 Milestone 创建 fix bug 分支修复。 |
| PR 合并前 Code Review | 使用 `superpowers:requesting-code-review`、`superpowers:using-git-worktrees`，只审查并给结论，不自动提交。 |
| 没问题后 PR，`Use Git/worktree workflows` | 提交、推送当前 feature 分支，创建到远程 `dev` 的 PR，并输出中文 PR 说明。 |
| 删除远程 Milestone 分支 | 只删除用户指定的远程 Milestone 分支，不批量删除。 |

## 写计划

当用户说“Use Writing plans”“请阅读 AGENTS/docs”“准备实现 Milestone X”“先输出实现计划到 `/docs/superpowers/plans`”“不要写代码”时：

1. 使用 `superpowers:writing-plans`。
2. 阅读 `AGENTS.md`、`docs/SPEC.md`、`docs/MILESTONES.md`、`docs/API.md`。
3. 确保本地 `dev` 已拉取远程 `dev` 最新代码：先 fetch，再切到 `dev`，再 fast-forward pull。
4. 在 `docs/superpowers/plans/` 下创建一个精简的 `.md` 计划文件，例如 `milestone-8-mvp-acceptance.md`。
5. 计划只写目标、范围、验收标准、实现步骤、涉及文件区域、验证命令和风险，不写具体代码。
6. 不修改业务代码，不提前创建实现文件，不实现后续 Milestone。

如果同步 `dev` 发生冲突、当前工作区有会阻塞切分支的未提交改动、或 Milestone 范围不清楚，停止并说明问题。

## 执行计划

当用户说“按照刚才的计划，实现这个 Milestone”“再创建一个新的 Milestone 的 Git 分支来执行”时：

1. 使用当前计划文件作为唯一实现范围，必要时先重新读取计划。
2. 从最新 `dev` 或用户指定的基准分支创建新分支，命名类似 `codex/milestone-{n}-{short-slug}`。
3. 推荐使用 Subagent-Driven：能独立拆分的任务交给子代理执行，每个任务完成后都做 review。
4. 如果使用多个子 agent，每个子 agent 使用独立的 Milestone 分支或 worktree，并明确文件归属，避免互相覆盖。
5. 每个任务后检查是否仍然只实现当前 Milestone；发现越界功能要立即回退或延后。
6. 对行为变更尽量使用测试优先：先写能暴露需求或 bug 的测试/验证步骤，再实现最小代码。
7. 前端 UI 任务必须使用 `.agents/skills/ele-ui`，保持米白色、移动端用户端、PC 管理/商户端的设计边界。

不得随意新增依赖，不得硬编码密钥，不得实现真实支付、地图、定位、评价、收藏、优惠券、库存锁定、取消退款等非当前 Milestone 功能。

## 完成前检验

当用户说“Use Verification before completion”“请验证这个 Milestone 是否完成”时：

1. 使用 `superpowers:verification-before-completion`。
2. 对照 `docs/MILESTONES.md` 中当前 Milestone 的任务和验收标准逐项检查。
3. 对照 `docs/SPEC.md` 检查用户端只展示已发布酒店、商户只能管理自己酒店、管理员接口校验管理员角色、MVP 不实现真实支付。
4. 对照 `docs/API.md` 检查接口路径、权限、返回和状态流转。
5. 尽量运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

如果某个命令因环境、数据库或服务缺失无法运行，必须说明具体阻塞和剩余风险。不能在没有验证证据时声称完成。

## 出现 bug 就自动修复

当用户指出 bug 或说“当前 Milestone，创建一个 fix bug 分支去解决出现问题，修复好它”时：

1. 使用 `superpowers:systematic-debugging`。
2. 从当前 Milestone 分支创建 fix 分支，命名类似 `codex/fix-milestone-{n}-{short-slug}`。
3. 先复现或定位问题，再改代码。
4. 能写测试就先写失败测试；不能写测试时，至少记录可重复的验证步骤。
5. 修复根因，不只修 UI 表象或绕过错误。
6. 先运行针对 bug 的验证，再运行 Milestone 的通用验证命令。

对用户反复强调的问题要优先检查：

- 用户端是移动端，PC 端只给管理员和商家。
- 登录界面、酒店查询页面、不同角色页面必须通过地址、路由或端口清晰隔离。
- UI 必须确认使用 `.agents/skills/ele-ui`，不能偏离到阴暗风格。

## PR 前 Code Review

当用户说“当前 Milestone 分支已经开发完成，进行再一次 Code Review”“不要自动提交，等我确认”时：

1. 使用 `superpowers:requesting-code-review`。
2. 使用 `superpowers:using-git-worktrees` 或普通 git 检查当前分支、状态和 diff。
3. 检查是否只实现当前 Milestone。
4. 检查是否有无关改动。
5. 检查是否提交了 `.env`、`node_modules`、`dist`、日志文件、密钥或其他生成物。
6. 检查是否提前实现后续功能。
7. 检查是否符合 `AGENTS.md`、`docs/SPEC.md`、`docs/MILESTONES.md`、`docs/API.md`。
8. 检查验证命令是否通过，至少说明 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 的执行结果或未执行原因。
9. 给出当前 Milestone 分支是否可以 commit、push 并创建 PR 到远程 `dev` 的中文结论。

这个阶段禁止自动 commit、push 或创建 PR，除非用户明确确认。

## 没问题后提交并创建 PR

当用户说“当前 Milestone 已经完成并通过 Code Review”“直接提交并推送当前 feature 分支，创建 PR 到远程 dev”时：

1. 使用 Git/worktree 工作流。
2. 只 stage 当前 Milestone 相关文件。
3. 使用简洁的 Milestone commit message 提交。
4. 推送当前 feature 分支。
5. 创建 PR 到远程 `dev`。
6. 输出完整中文 PR 标题和说明，包含 Milestone、实现范围、验证结果、风险或未覆盖项。

不要 amend commit，除非用户明确要求。

## 删除远程分支

当用户要求删除此次创建的远程 Milestone 分支时：

```bash
git push origin --delete codex/milestone-x-slug
```

只删除明确指定的远程 Milestone 分支。保留远程功能分支；本地功能分支可删可不删，除非用户明确要求处理。不要批量删除多个分支；如果需要清理多个分支，先列出并让用户逐个确认。

## 常见偏差

| 偏差 | 正确处理 |
| --- | --- |
| 写计划时顺手写代码 | 只创建计划文档，停止实现。 |
| 没同步远程 `dev` 就开始 | 先同步远程 `dev`。 |
| 直接在 `dev` 上开发 | 新建 Milestone 分支。 |
| 提前做后续 Milestone | 删除或延后越界功能。 |
| UI 没用 `ele-ui` | 读取并遵循 `.agents/skills/ele-ui`。 |
| 用户端和管理端混在一起 | 移动端用户端、PC 管理/商户端分离。 |
| Review 阶段自动提交 | 等用户确认。 |
| 没验证就说完成 | 运行验证命令或说明阻塞。 |
| 使用递归删除命令 | 停止并让用户手动处理。 |
