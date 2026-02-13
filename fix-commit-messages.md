# 修復 Git Commit 訊息亂碼

## 已設置的編碼配置

```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

## 修復方法

### 方法一：使用 git commit --amend（修復最後一個 commit）

```bash
git commit --amend -m "正確的中文訊息"
```

### 方法二：使用 git rebase -i（修復多個 commit）

```bash
# 修改最近 5 個 commit
git rebase -i HEAD~5

# 在編輯器中，將要修改的 commit 前面的 'pick' 改為 'reword' 或 'r'
# 保存後，Git 會逐個提示您修改 commit 訊息
```

### 需要修復的 Commit 訊息

1. `4878784` - "娣诲姞鏌ョ湅鏃ヨ獙鎸囧崡" → "添加查看日誌指南" ✅ 已修復
2. `f40fc28` - "灏囨墍鏈変腑鏂囧挅鍟″怀鏀圭偤鏍栭殭灞呮墍..." → "將所有中文咖啡廳改成栖隙居所，並在主節點描述後面加上請複製我!"
3. `661a3e5` - "绉婚櫎 b23.tv 鐭€€ｇ祼鑷嫊閲嶅畾鍚戯紝..." → "移除 b23.tv 短連結自動重定向，改為解析後使用解析結果"

## 快速修復命令

```bash
# 設置編碼
chcp 65001
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8

# 修復最後一個 commit（已執行）
git commit --amend -m "添加查看日誌指南"

# 修復其他 commit（需要交互式操作）
git rebase -i HEAD~5
```

## 注意事項

- 如果已經 push 到遠程，修復後需要 `git push --force`（謹慎使用）
- 建議在修復前先備份：`git branch backup-$(date +%Y%m%d)`
