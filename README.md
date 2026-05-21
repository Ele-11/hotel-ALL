## 总结好的流程的  提示词

#### 写计划
```
Use Writing plans.

请阅读：

- AGENTS.md
- docs/SPEC.md
- docs/MILESTONES.md
- docs/API.md

确保本地的dev分支拉取 远程的dev分支最新的代码，然后准备实现 Milestone 8.

要求：
先输出实现计划到/docs/superpowers/plans，建一个md文档记录计划，尽可能精简，不写具体代码在plan文件当中，不要写代码。
```


#### 执行计划

Subagent-Driven（推荐）：按任务拆给子代理执行，每个任务后 review。
如果用多子agent的话，就创建多个Milestone 的git分支来执行

```
Use Writing plans.
再创建一个新的 Milestone 的Git分支来执行.
请按照刚才的计划，实现 这个 Milestone  
```


#### 完成前检验
```
Use Verification before completion.

请验证 这个 Milestone   是否完成。
```

#### 出现bug就自动修复  
```
xxxx 没有暂时

Superpowers  Use Systematic debugging.

当前 Milestone，创建一个 fix bug分支去解决 出现 问题，修复好它。 


问题1：十分紧急的是，用户端用是mobile来看的，PC端才是给管理员和商家看的，你需要重构前端的整体。
问题2：登录 界面  和  酒店查询的页面 怎么都显示了，明明是不同的角色有的东西，所以需要一个新的地址和端口来运行移动端的给用户
问题3： 你确定用了 ele-UI 这个skill吗？  我记得整体是米白色的风格来着，怎么变得这么阴暗。
```



#### Git PR合并
```Use Code review workflows.  和 Use Git/worktree workflows.

当前 Milestone 分支 已经开发完成，进行再一次的Code Review。

要求：
1. 检查是否只实现当前 Milestone
2. 检查是否有无关改动
3. 检查是否提交了 .env、node_modules、dist、日志文件
4. 检查是否提前实现后续功能
5. 检查是否符合 AGENTS.md 和 docs 文档
6. 检查验证命令是否通过
7. 给出是否可以 commit、push 的结论
8. 给出当前 Milestone 分支是否可以 commit、push 并创建 PR 到 远程dev分支 的结论，不要自动提交，等我确认
```

#### 没问题后PR

```Use Git/worktree workflows.

当前 Milestone , 已经完成并通过 Code Review。

直接 提交并推送当前 feature 分支，创建 PR 到 远程dev，并给出完整的中文的PR的表述和说明。
```

#### 删除远程分支：
删除此次创建的  远程的 milestone分支     留在远程的 功能分支   和  本地的   功能分支  可删可不删

git push origin --delete codex/milestone-x-xxxxx

