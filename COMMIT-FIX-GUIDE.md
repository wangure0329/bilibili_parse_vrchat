# 修復 Git Commit 訊息亂碼指南

## ✅ 已修復
- `1756b70` - "添加查看日誌指南" ✅

## 🔧 解決方案

### 問題原因
在 Windows PowerShell 中直接使用 `git commit -m "中文訊息"` 會因為編碼問題導致亂碼。

### 正確的提交方法

#### 方法一：使用文件提交（推薦）

```bash
# 1. 創建 UTF-8 編碼的訊息文件
echo "您的 commit 訊息" > commit-msg.txt

# 2. 使用 -F 參數從文件讀取
git commit -F commit-msg.txt

# 或修改最後一個 commit
git commit --amend -F commit-msg.txt
```

#### 方法二：使用 Git Bash

在 Git Bash 中執行 commit 命令，編碼處理會更正確。

#### 方法三：設置 PowerShell 編碼

```powershell
# 設置控制台編碼為 UTF-8
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF-8

# 然後再執行 git commit
git commit -m "您的訊息"
```

## 📋 需要修復的其他 Commit

使用 `git rebase -i HEAD~N` 來修復多個 commit：

```bash
# 1. 創建修復腳本
git rebase -i HEAD~5

# 2. 在編輯器中，將要修改的 commit 前面的 'pick' 改為 'reword' 或 'r'

# 3. 保存後，Git 會逐個提示修改 commit 訊息
#    此時使用文件方式提交：
echo "正確的訊息" > msg.txt
git commit --amend -F msg.txt
git rebase --continue
```

## 🚀 快速修復命令

```bash
# 修復最後一個 commit
echo "正確的訊息" > msg.txt
git commit --amend -F msg.txt
rm msg.txt
```

## ⚠️ 注意事項

- 如果已經 push 到遠程，修復後需要 `git push --force`（謹慎使用）
- 建議在修復前先備份：`git branch backup-$(date +%Y%m%d)`
- 以後提交中文訊息時，使用 `-F` 參數從文件讀取
