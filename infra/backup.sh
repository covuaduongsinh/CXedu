#!/bin/sh
# Sao lưu logic hằng đêm (02:00 giờ máy chủ), giữ BACKUP_KEEP_DAYS ngày.
# Nên đồng bộ thư mục /backups sang nơi lưu trữ ngoài VPS (S3/R2) bằng rclone hoặc tương đương.
set -eu
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
while true; do
  now=$(date +%s)
  next=$(date -d "tomorrow 02:00" +%s 2>/dev/null || echo $((now + 86400)))
  sleep $((next - now))
  file="/backups/cxedu-$(date +%Y%m%d-%H%M).dump"
  pg_dump --format=custom --no-owner --file="$file.partial" && mv "$file.partial" "$file"
  echo "backup: $file"
  find /backups -name 'cxedu-*.dump' -mtime +"$KEEP_DAYS" -delete
done
