# 编码代理套件测试

`test/suite/` 用于围绕 `AgentSession` 和 `AgentSessionRuntime` 的、基于 harness 的新测试套件。

规则：
- 使用 `test/suite/harness.ts`
- 使用 `packages/ai/src/providers/faux.ts` 中的 faux 提供商
- 不要使用真实提供商 API、真实 API key、网络请求或付费 token
- 保持这些测试对 CI 安全且确定
- 除非缺失能力迫使你使用，否则不要使用或扩展旧的 `test/test-harness.ts` 路径

组织方式：
- 宽泛的生命周期与表征测试直接放在 `test/suite/`
- 针对具体 issue 的回归测试放在 `test/suite/regressions/`
- 回归测试命名为 `<issue-number>-<short-slug>.test.ts`
- 例如：`test/suite/regressions/2023-queued-slash-command-followup.test.ts`
