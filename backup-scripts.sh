#!/bin/bash

# ============================================================
# ROADY CONSTRUCTION - SCRIPT DE BACKUP
# Usage: ./scripts/backup.sh [full|db|files|all]
# ============================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_TODAY=$(date +"%Y-%m-%d")

# Load environment
source .env 2>/dev/null || true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# FUNCTIONS
# ============================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create backup directory structure
init_backup_dir() {
    mkdir -p "$BACKUP_DIR/db"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$BACKUP_DIR/redis"
    mkdir -p "$BACKUP_DIR/config"
    log "📁 Backup directories initialized"
}

# ============================================================
# DATABASE BACKUP
# ============================================================

backup_database() {
    log "🗄️  Starting PostgreSQL backup..."
    
    BACKUP_FILE="$BACKUP_DIR/db/roady_db_${TIMESTAMP}.sql.gz"
    
    # Backup via Docker
    docker-compose exec -T postgres pg_dump \
        -U "${DB_USER:-roady_user}" \
        -d "${DB_NAME:-roady}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        -F c \
        | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✅ Database backup completed: $BACKUP_FILE ($SIZE)"
        
        # Create latest symlink
        ln -sf "roady_db_${TIMESTAMP}.sql.gz" "$BACKUP_DIR/db/latest.sql.gz"
    else
        log_error "Database backup failed!"
        return 1
    fi
}

# ============================================================
# REDIS BACKUP
# ============================================================

backup_redis() {
    log "📦 Starting Redis backup..."
    
    BACKUP_FILE="$BACKUP_DIR/redis/roady_redis_${TIMESTAMP}.rdb"
    
    # Trigger BGSAVE and wait
    docker-compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" BGSAVE
    sleep 5
    
    # Copy the dump file
    docker cp roady-redis:/data/dump.rdb "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        gzip "$BACKUP_FILE"
        SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        log "✅ Redis backup completed: ${BACKUP_FILE}.gz ($SIZE)"
    else
        log_error "Redis backup failed!"
        return 1
    fi
}

# ============================================================
# FILES BACKUP
# ============================================================

backup_files() {
    log "📁 Starting files backup..."
    
    BACKUP_FILE="$BACKUP_DIR/files/roady_files_${TIMESTAMP}.tar.gz"
    
    # Backup uploads directory
    if [ -d "./uploads" ]; then
        tar -czf "$BACKUP_FILE" -C . uploads/
        
        if [ $? -eq 0 ]; then
            SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "✅ Files backup completed: $BACKUP_FILE ($SIZE)"
        else
            log_error "Files backup failed!"
            return 1
        fi
    else
        log_warn "No uploads directory found, skipping files backup"
    fi
}

# ============================================================
# CONFIG BACKUP
# ============================================================

backup_config() {
    log "⚙️  Starting config backup..."
    
    BACKUP_FILE="$BACKUP_DIR/config/roady_config_${TIMESTAMP}.tar.gz"
    
    # Backup configuration files (excluding secrets)
    tar -czf "$BACKUP_FILE" \
        --exclude='.env' \
        --exclude='*.key' \
        --exclude='*.pem' \
        --exclude='*service-account*.json' \
        docker-compose.yml \
        docker-compose.*.yml \
        .env.template \
        nginx/ \
        monitoring/ \
        k8s/ \
        2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✅ Config backup completed: $BACKUP_FILE ($SIZE)"
    fi
}

# ============================================================
# CLEANUP OLD BACKUPS
# ============================================================

cleanup_old_backups() {
    log "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type f -name "*.tar" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type f -name "*.rdb" -mtime +$RETENTION_DAYS -delete
    
    log "✅ Cleanup completed"
}

# ============================================================
# UPLOAD TO S3 (Optional)
# ============================================================

upload_to_s3() {
    if [ -z "$AWS_S3_BUCKET" ]; then
        log_warn "AWS_S3_BUCKET not set, skipping S3 upload"
        return 0
    fi
    
    log "☁️  Uploading to S3..."
    
    aws s3 sync "$BACKUP_DIR" "s3://${AWS_S3_BUCKET}/backups/${DATE_TODAY}/" \
        --exclude "*.tmp" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log "✅ S3 upload completed"
    else
        log_error "S3 upload failed!"
        return 1
    fi
}

# ============================================================
# UPLOAD TO GCS (Optional)
# ============================================================

upload_to_gcs() {
    if [ -z "$GCS_BUCKET" ]; then
        log_warn "GCS_BUCKET not set, skipping GCS upload"
        return 0
    fi
    
    log "☁️  Uploading to Google Cloud Storage..."
    
    gsutil -m rsync -r "$BACKUP_DIR" "gs://${GCS_BUCKET}/backups/${DATE_TODAY}/"
    
    if [ $? -eq 0 ]; then
        log "✅ GCS upload completed"
    else
        log_error "GCS upload failed!"
        return 1
    fi
}

# ============================================================
# VERIFY BACKUP
# ============================================================

verify_backup() {
    log "🔍 Verifying backups..."
    
    LATEST_DB="$BACKUP_DIR/db/latest.sql.gz"
    
    if [ -f "$LATEST_DB" ]; then
        # Test if gzip file is valid
        if gzip -t "$LATEST_DB" 2>/dev/null; then
            log "✅ Database backup verified"
        else
            log_error "Database backup is corrupted!"
            return 1
        fi
    fi
    
    log "✅ Backup verification completed"
}

# ============================================================
# SEND NOTIFICATION
# ============================================================

send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$status ROADY Backup: $message\"}" \
            > /dev/null
    fi
}

# ============================================================
# GENERATE REPORT
# ============================================================

generate_report() {
    log "📊 Generating backup report..."
    
    REPORT_FILE="$BACKUP_DIR/backup_report_${DATE_TODAY}.txt"
    
    {
        echo "========================================"
        echo "ROADY Construction - Backup Report"
        echo "Date: $(date)"
        echo "========================================"
        echo ""
        echo "Database Backups:"
        ls -lh "$BACKUP_DIR/db/" 2>/dev/null | tail -5
        echo ""
        echo "Redis Backups:"
        ls -lh "$BACKUP_DIR/redis/" 2>/dev/null | tail -5
        echo ""
        echo "Files Backups:"
        ls -lh "$BACKUP_DIR/files/" 2>/dev/null | tail -5
        echo ""
        echo "Total Backup Size:"
        du -sh "$BACKUP_DIR"
        echo ""
        echo "Disk Space Available:"
        df -h "$BACKUP_DIR"
    } > "$REPORT_FILE"
    
    log "📄 Report saved to: $REPORT_FILE"
}

# ============================================================
# MAIN
# ============================================================

main() {
    local mode=${1:-all}
    
    echo ""
    echo "============================================"
    echo "🏗️  ROADY Construction - Backup Script"
    echo "============================================"
    echo ""
    log "Starting backup (mode: $mode)..."
    
    init_backup_dir
    
    case $mode in
        db)
            backup_database
            ;;
        redis)
            backup_redis
            ;;
        files)
            backup_files
            ;;
        config)
            backup_config
            ;;
        full|all)
            backup_database
            backup_redis
            backup_files
            backup_config
            ;;
        *)
            echo "Usage: $0 [db|redis|files|config|full|all]"
            exit 1
            ;;
    esac
    
    cleanup_old_backups
    verify_backup
    upload_to_s3
    upload_to_gcs
    generate_report
    
    echo ""
    log "🎉 Backup completed successfully!"
    send_notification "✅" "Backup completed at $(date)"
}

# Run
main "$@"

# ============================================================
# RESTORE SCRIPT - scripts/restore.sh
# ============================================================

: << 'RESTORE_SCRIPT'
#!/bin/bash

# ROADY Construction - Restore Script
# Usage: ./scripts/restore.sh [backup_file]

set -e

source .env 2>/dev/null || true

BACKUP_FILE=${1:-"./backups/db/latest.sql.gz"}

echo "🔄 Restoring database from: $BACKUP_FILE"

# Stop the API to prevent writes
docker-compose stop api worker

# Restore database
gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres pg_restore \
    -U "${DB_USER:-roady_user}" \
    -d "${DB_NAME:-roady}" \
    --clean \
    --if-exists \
    --no-owner

# Restart services
docker-compose start api worker

echo "✅ Database restored successfully!"
RESTORE_SCRIPT

# ============================================================
# CRONTAB SETUP
# ============================================================

: << 'CRONTAB_SETUP'
# Add to crontab: crontab -e

# Full backup every day at 2 AM
0 2 * * * /path/to/roady/scripts/backup.sh full >> /var/log/roady-backup.log 2>&1

# Database backup every 6 hours
0 */6 * * * /path/to/roady/scripts/backup.sh db >> /var/log/roady-backup.log 2>&1

# Redis backup every 12 hours
0 */12 * * * /path/to/roady/scripts/backup.sh redis >> /var/log/roady-backup.log 2>&1
CRONTAB_SETUP
