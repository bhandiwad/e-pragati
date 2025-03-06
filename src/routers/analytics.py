from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, JSON
from datetime import datetime, timedelta
from typing import List, Optional
import logging
import json
import traceback
from statistics import mean

import src.models as models
import src.schemas as schemas
from src.database import get_db

# Configure logger with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

def parse_json_array(json_str):
    """Safely parse JSON array from string."""
    try:
        if json_str is None:
            return []
        if isinstance(json_str, list):
            return json_str
        data = json.loads(json_str)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON string: {json_str}")
        return []
    except Exception as e:
        logger.warning(f"Unexpected error parsing JSON: {str(e)}")
        return []

def get_date_format(timestamp):
    """Convert timestamp to date string in SQLite."""
    return func.strftime('%Y-%m-%d', timestamp)

@router.get("/trends")
async def get_productivity_trends(
    timeRange: str,
    department: str = "all",
    db: Session = Depends(get_db)
):
    """Get productivity trends over time."""
    try:
        logger.info(f"Getting productivity trends for timeRange={timeRange}, department={department}")
        
        # Calculate date range
        end_date = datetime.now()
        if timeRange == "week":
            start_date = end_date - timedelta(days=7)
        elif timeRange == "month":
            start_date = end_date - timedelta(days=30)
        elif timeRange == "quarter":
            start_date = end_date - timedelta(days=90)
        elif timeRange == "year":
            start_date = end_date - timedelta(days=365)
        else:
            raise HTTPException(status_code=400, detail="Invalid time range")

        # Base query using SQLite's strftime
        query = db.query(
            get_date_format(models.Update.timestamp).label('date'),
            func.avg(models.Update.productivity_score).label('productivity'),
            func.count(models.Update.id).label('updates'),
            models.TeamMember.department.label('department')
        ).join(
            models.TeamMember,
            models.Update.team_member_id == models.TeamMember.id
        )

        # Apply department filter
        if department != "all":
            query = query.filter(models.TeamMember.department == department)

        # Apply date filter and group by
        results = query.filter(
            models.Update.timestamp >= start_date,
            models.Update.timestamp <= end_date
        ).group_by(
            get_date_format(models.Update.timestamp),
            models.TeamMember.department
        ).order_by(
            get_date_format(models.Update.timestamp).asc()
        ).all()

        logger.info(f"Found {len(results)} trend results")
        
        formatted_results = []
        for result in results:
            try:
                formatted_results.append({
                    "date": str(result.date),
                    "productivity": float(result.productivity or 0),
                    "updates": result.updates,
                    "department": result.department
                })
            except Exception as e:
                logger.error(f"Error formatting result: {str(e)}")
                logger.error(f"Result data: {result}")
                continue

        return formatted_results

    except Exception as e:
        logger.error(f"Error in productivity trends: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/departments")
async def get_department_metrics(db: Session = Depends(get_db)):
    """Get performance metrics for each department."""
    try:
        logger.info("Getting department metrics")
        # Get all updates with their team members
        updates = db.query(models.Update).join(models.TeamMember).all()
        logger.info(f"Found {len(updates)} updates")
        
        # Process metrics by department
        department_metrics = {}
        
        for update in updates:
            dept = update.team_member.department
            if dept not in department_metrics:
                department_metrics[dept] = {
                    "name": dept,
                    "productivity": [],
                    "updates": 0,
                    "blockers": 0,
                    "completedTasks": 0
                }
            
            metrics = department_metrics[dept]
            metrics["updates"] += 1
            metrics["productivity"].append(update.productivity_score or 0)
            metrics["blockers"] += len(parse_json_array(update.blockers))
            metrics["completedTasks"] += len(parse_json_array(update.completed_tasks))
        
        # Calculate averages and format results
        results = []
        for dept_metrics in department_metrics.values():
            productivity_scores = dept_metrics["productivity"]
            avg_productivity = sum(productivity_scores) / len(productivity_scores) if productivity_scores else 0
            
            results.append({
                "name": dept_metrics["name"],
                "productivity": float(avg_productivity),
                "updates": dept_metrics["updates"],
                "blockers": dept_metrics["blockers"],
                "completedTasks": dept_metrics["completedTasks"]
            })
        
        logger.info(f"Processed metrics for {len(results)} departments")
        return results

    except Exception as e:
        logger.error(f"Error in department metrics: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch department metrics: {str(e)}")

@router.get("/departments/list")
async def get_departments_list(db: Session = Depends(get_db)):
    """Get list of all departments."""
    try:
        logger.info("Getting departments list")
        departments = db.query(models.TeamMember.department).distinct().all()
        result = [dept[0] for dept in departments if dept[0]]
        logger.info(f"Found {len(result)} departments")
        return result
    except Exception as e:
        logger.error(f"Error fetching departments list: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/velocity")
async def get_team_velocity(
    department: str = "all",
    db: Session = Depends(get_db)
):
    """Get team velocity metrics."""
    try:
        logger.info(f"Getting team velocity for department={department}")
        # Get all updates with their team members
        query = db.query(models.Update).join(models.TeamMember)
        
        if department != "all":
            query = query.filter(models.TeamMember.department == department)
        
        updates = query.all()
        logger.info(f"Found {len(updates)} updates")
        
        # Process updates by week
        velocity_metrics = {}
        
        for update in updates:
            try:
                # Get the week number using SQLite format
                week = update.timestamp.strftime("%Y-W%W")
                dept = update.team_member.department
                
                if week not in velocity_metrics:
                    velocity_metrics[week] = {}
                
                if dept not in velocity_metrics[week]:
                    velocity_metrics[week][dept] = {
                        "sprint": week,
                        "department": dept,
                        "planned": 0,
                        "completed": 0,
                        "update_count": 0
                    }
                
                metrics = velocity_metrics[week][dept]
                metrics["update_count"] += 1
                metrics["completed"] += len(parse_json_array(update.completed_tasks))
                metrics["planned"] += len(parse_json_array(update.next_week_plans))
            except Exception as e:
                logger.error(f"Error processing update {update.id}: {str(e)}")
                continue
        
        # Flatten and sort results
        results = []
        for week_metrics in velocity_metrics.values():
            results.extend(week_metrics.values())
        
        results.sort(key=lambda x: x["sprint"], reverse=True)
        logger.info(f"Processed velocity metrics for {len(results)} week-department combinations")
        return results

    except Exception as e:
        logger.error(f"Error in team velocity: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch team velocity: {str(e)}")

@router.get("/overview")
async def get_analytics_overview(
    period: str = "30d",
    db: Session = Depends(get_db)
):
    """Get overview analytics data."""
    try:
        logger.info(f"Getting analytics overview for period={period}")
        
        # Calculate start date based on period
        period_days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "180d": 180
        }
        if period not in period_days:
            raise HTTPException(status_code=400, detail="Invalid period")
        
        start_date = datetime.now() - timedelta(days=period_days[period])
        
        # Get all updates within the period
        updates = db.query(models.Update).join(
            models.TeamMember
        ).filter(
            models.Update.timestamp >= start_date
        ).all()
        
        if not updates:
            return {
                "team_productivity": 0.0,
                "total_updates": 0,
                "active_projects": [],
                "completed_tasks": [],
                "common_blockers": [],
                "department_stats": {}
            }
        
        # Calculate team productivity
        productivity_scores = [u.productivity_score for u in updates if u.productivity_score is not None]
        team_productivity = mean(productivity_scores) if productivity_scores else 0.0
        
        # Collect all tasks and projects
        all_projects = []
        all_completed_tasks = []
        all_blockers = []
        department_stats = {}
        
        for update in updates:
            # Process projects
            if update.project_progress:
                projects = parse_json_array(update.project_progress)
                all_projects.extend(projects)
            
            # Process completed tasks
            if update.completed_tasks:
                tasks = parse_json_array(update.completed_tasks)
                all_completed_tasks.extend(tasks)
            
            # Process blockers
            if update.blockers:
                blockers = parse_json_array(update.blockers)
                all_blockers.extend(blockers)
            
            # Process department stats
            dept = update.team_member.department
            if dept not in department_stats:
                department_stats[dept] = {
                    "productivity": [],
                    "updates": 0,
                    "active_members": set()
                }
            
            dept_stats = department_stats[dept]
            if update.productivity_score is not None:
                dept_stats["productivity"].append(update.productivity_score)
            dept_stats["updates"] += 1
            dept_stats["active_members"].add(update.team_member.name)
        
        # Format department stats
        formatted_dept_stats = {}
        for dept, stats in department_stats.items():
            formatted_dept_stats[dept] = {
                "productivity": mean(stats["productivity"]) if stats["productivity"] else 0.0,
                "updates": stats["updates"],
                "active_members": len(stats["active_members"])
            }
        
        return {
            "team_productivity": team_productivity,
            "total_updates": len(updates),
            "active_projects": list(set(all_projects)),  # Remove duplicates
            "completed_tasks": list(set(all_completed_tasks)),  # Remove duplicates
            "common_blockers": list(set(all_blockers)),  # Remove duplicates
            "department_stats": formatted_dept_stats
        }
        
    except Exception as e:
        logger.error(f"Error in analytics overview: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 