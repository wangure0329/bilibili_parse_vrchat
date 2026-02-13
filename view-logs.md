# 查看日誌指南

## 📋 Docker 容器日誌查看

### 基本命令

```bash
# 查看所有服務的日誌
docker-compose logs

# 查看特定服務的日誌（bilibili-parser）
docker-compose logs bilibili-parser

# 實時查看日誌（跟隨輸出，類似 tail -f）
docker-compose logs -f bilibili-parser

# 查看最近的 100 行日誌
docker-compose logs --tail=100 bilibili-parser

# 查看最近 10 分鐘的日誌
docker-compose logs --since 10m bilibili-parser

# 查看指定時間範圍的日誌
docker-compose logs --since "2025-01-01T00:00:00" --until "2025-01-01T23:59:59" bilibili-parser
```

### 使用容器名稱查看

```bash
# 查看 bilibili-parser 容器日誌
docker logs vrc-bilibili-parser

# 實時查看（跟隨輸出）
docker logs -f vrc-bilibili-parser

# 查看最近的 100 行
docker logs --tail=100 vrc-bilibili-parser

# 查看最近 10 分鐘
docker logs --since 10m vrc-bilibili-parser

# 查看所有容器日誌
docker logs portainer
docker logs cloudflared
```

### 查看所有服務的日誌

```bash
# 查看所有服務的日誌
docker-compose logs

# 實時查看所有服務的日誌
docker-compose logs -f

# 查看所有服務最近的 50 行
docker-compose logs --tail=50
```

## 🔍 日誌過濾和搜索

```bash
# 查看包含特定關鍵字的日誌
docker-compose logs bilibili-parser | grep "錯誤"
docker-compose logs bilibili-parser | grep "error"
docker-compose logs bilibili-parser | grep "解析"

# 查看錯誤日誌
docker-compose logs bilibili-parser | grep -i error

# 查看成功解析的日誌
docker-compose logs bilibili-parser | grep -i "解析成功"

# 統計日誌行數
docker-compose logs bilibili-parser | wc -l
```

## 📊 日誌輸出到文件

```bash
# 將日誌保存到文件
docker-compose logs bilibili-parser > logs.txt

# 將實時日誌保存到文件
docker-compose logs -f bilibili-parser > live-logs.txt

# 將所有服務的日誌保存到文件
docker-compose logs > all-logs.txt
```

## 🗂️ 查看應用程序日誌文件

如果應用程序有日誌文件（在 `./logs` 目錄）：

```bash
# 進入項目目錄
cd /home/wangure0329/bilibili_parse_vrchat

# 查看日誌目錄
ls -la logs/

# 查看最新的日誌文件
tail -f logs/app.log

# 查看錯誤日誌
tail -f logs/error.log

# 查看所有日誌文件
cat logs/*.log
```

## 🚀 常用組合命令

```bash
# 實時查看日誌並過濾錯誤
docker-compose logs -f bilibili-parser | grep -i error

# 查看最近的錯誤日誌
docker-compose logs --tail=200 bilibili-parser | grep -i error

# 查看特定時間段的日誌
docker-compose logs --since "1 hour ago" bilibili-parser

# 查看今天的日誌
docker-compose logs --since "today" bilibili-parser
```

## 📱 快速查看命令（一行）

```bash
# 實時查看主服務日誌
docker-compose logs -f bilibili-parser

# 查看最近的 50 行日誌
docker-compose logs --tail=50 bilibili-parser

# 查看所有服務的實時日誌
docker-compose logs -f
```

## ⚠️ 注意事項

- 使用 `-f` 或 `--follow` 參數可以實時跟隨日誌輸出（按 `Ctrl+C` 退出）
- 日誌可能會很多，建議使用 `--tail` 限制行數
- 如果日誌太多，可以重定向到文件後再查看
- 容器重啟後，舊的日誌可能會被清除（取決於 Docker 配置）
