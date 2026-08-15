# 外出自治閉環（主控必跑）

老闆外出或說一鼓作氣做完時，主控照這條跑，不准等下一句才動。

```text
propose 齊
  → Claude（main 視窗）analyze + 修 artifact
  → wait idle → read 全文 → 要 OK
  → apply 寫碼 + test/type-check
  → Codex CR
  → wait idle → read 全文
  → 有 Critical：修 → test → 再 CR／對照清單
  → 無 Critical：tasks 全勾 → archive
  → 下一張（LINE 社群 → site-agent → …）
```

監工指令（示意）：

```bash
orca terminal send --terminal <claude|codex> --enter --text "..."
orca terminal wait --terminal <id> --for tui-idle --timeout-ms 600000
orca terminal read --terminal <id> --limit 300
```

違規：只看一眼 preview 就回覆／結束 turn；對話一來就忘代理。

卡關才准停：缺 GITHUB_KIT_ORG／REPO／完整 PEM、或缺老闆產品決策。其餘自己往下。
