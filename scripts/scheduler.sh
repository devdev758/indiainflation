#!/bin/bash
#
# Unified Automation Scheduler
# Runs all scheduled tasks (ETL, backup, reports, health checks)
# Install in crontab or systemd timer
#

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${LOG_DIR:-/home/deploy/repo/logs}"
AUTOMATION_LOG="$LOG_DIR/indiainflation_automation.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Python interpreter
PYTHON="${PYTHON:-python3}"

# Load environment variables from .env if exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '#' | xargs)
fi

# Log function
log_task() {
    local task_name=$1
    local task_status=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$task_name] $task_status" >> "$AUTOMATION_LOG"
}

# Execute task with error handling
execute_task() {
    local task_name=$1
    local task_script=$2
    local log_marker="$3"
    
    echo "---------- Starting: $task_name ----------" >> "$AUTOMATION_LOG"
    log_task "$task_name" "STARTED"
    
    start_time=$(date +%s)
    
    # Run task and capture output
    if "$PYTHON" "$SCRIPT_DIR/$task_script" >> "$AUTOMATION_LOG" 2>&1; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        log_task "$task_name" "COMPLETED (${duration}s)"
        echo "Status: SUCCESS" >> "$AUTOMATION_LOG"
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        exit_code=$?
        log_task "$task_name" "FAILED with exit code $exit_code (${duration}s)"
        echo "Status: FAILED" >> "$AUTOMATION_LOG"
    fi
    
    echo "---------- Finished: $task_name ----------" >> "$AUTOMATION_LOG"
    echo "" >> "$AUTOMATION_LOG"
}

# Main scheduler logic
main() {
    # Get current day and time
    current_hour=$(date +%H)
    current_minute=$(date +%M)
    current_day=$(date +%d)
    
    echo "========================================" >> "$AUTOMATION_LOG"
    echo "Automation Scheduler Check - $(date)" >> "$AUTOMATION_LOG"
    echo "========================================" >> "$AUTOMATION_LOG"
    
    # Health Monitor: Every 6 hours (0, 6, 12, 18)
    if [ $((current_hour % 6)) -eq 0 ] && [ "$current_minute" -ge 0 ] && [ "$current_minute" -lt 10 ]; then
        execute_task "Health Monitor" "health_monitor.py" "health"
    fi
    
    # ETL Cron: Daily at 2 AM UTC
    if [ "$current_hour" -eq 2 ] && [ "$current_minute" -ge 0 ] && [ "$current_minute" -lt 10 ]; then
        execute_task "ETL Sync" "etl_cron.py" "etl"
    fi
    
    # Database Backup: Daily at 3 AM UTC
    if [ "$current_hour" -eq 3 ] && [ "$current_minute" -ge 0 ] && [ "$current_minute" -lt 10 ]; then
        execute_task "Database Backup" "db_backup.py" "backup"
    fi
    
    # Report Generator: Monthly on 1st at 6 AM UTC
    if [ "$current_day" -eq 1 ] && [ "$current_hour" -eq 6 ] && [ "$current_minute" -ge 0 ] && [ "$current_minute" -lt 10 ]; then
        execute_task "Monthly Report" "report_generator.py" "report"
    fi
}

# For crontab usage, create a wrapper function
run_as_cron() {
    main
}

# Display usage if called with arguments
case "${1:-}" in
    "health")
        execute_task "Health Monitor" "health_monitor.py" "health"
        ;;
    "etl")
        execute_task "ETL Sync" "etl_cron.py" "etl"
        ;;
    "backup")
        execute_task "Database Backup" "db_backup.py" "backup"
        ;;
    "report")
        execute_task "Monthly Report" "report_generator.py" "report"
        ;;
    "all")
        execute_task "Health Monitor" "health_monitor.py" "health"
        execute_task "ETL Sync" "etl_cron.py" "etl"
        execute_task "Database Backup" "db_backup.py" "backup"
        execute_task "Monthly Report" "report_generator.py" "report"
        ;;
    "--help"|"-h"|"help")
        echo "Automation Scheduler"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  health    - Run health monitor"
        echo "  etl       - Run ETL sync"
        echo "  backup    - Run database backup"
        echo "  report    - Generate monthly report"
        echo "  all       - Run all tasks"
        echo "  help      - Show this help message"
        echo ""
        echo "Cron Setup:"
        echo "  */10 * * * * $SCRIPT_DIR/scheduler.sh  # Run every 10 minutes"
        echo ""
        echo "Or use with specific timing:"
        echo "  0 */6 * * * $SCRIPT_DIR/scheduler.sh health   # Every 6 hours"
        echo "  0 2 * * * $SCRIPT_DIR/scheduler.sh etl        # Daily at 2 AM"
        echo "  0 3 * * * $SCRIPT_DIR/scheduler.sh backup     # Daily at 3 AM"
        echo "  0 6 1 * * $SCRIPT_DIR/scheduler.sh report     # 1st of month at 6 AM"
        exit 0
        ;;
    *)
        # Default: run as cron
        main
        ;;
esac
