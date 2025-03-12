from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, JSON, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import logging
import json
import traceback
from statistics import mean
import openai
import numpy as np
from collections import defaultdict

import src.models as models
import src.schemas as schemas
from src.database import get_db
from src.config import config

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

@router.get("/semantic-similarity")
async def get_semantic_similarity(days: int = 60, threshold: float = 0.85, db: Session = Depends(get_db)):
    """
    Analyze semantic similarity between consecutive updates from team members.
    Helps identify if employees are submitting similar updates without making actual progress.
    
    Args:
        days: Number of days to look back
        threshold: Similarity threshold for flagging (0.0 to 1.0, higher means more similar)
    
    Returns:
        A list of employees with high similarity scores between updates,
        indicating potential stalling or lack of progress
    """
    try:
        # Calculate the date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get all updates within the date range
        updates = db.query(models.Update).filter(
            models.Update.timestamp >= start_date
        ).order_by(
            models.Update.team_member_id, 
            models.Update.timestamp
        ).all()
        
        # Group updates by team member
        member_updates = defaultdict(list)
        for update in updates:
            update_text = update.update_text
            
            # Include analyzed fields in the text
            for field_name, field_value in [
                ('completed_tasks', update.completed_tasks),
                ('project_progress', update.project_progress),
                ('goals_status', update.goals_status),
                ('blockers', update.blockers),
                ('next_week_plans', update.next_week_plans)
            ]:
                if field_value:
                    try:
                        field_data = json.loads(field_value)
                        if isinstance(field_data, list):
                            update_text += " " + " ".join(field_data)
                    except (json.JSONDecodeError, TypeError):
                        logger.warning(f"Could not decode {field_name} data")
            
            member_updates[update.team_member_id].append({
                "id": update.id,
                "timestamp": update.timestamp,
                "text": update_text,
                "productivity_score": update.productivity_score or 0.0
            })
        
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=config.api.openai_api_key)
        
        # Process each member's updates
        results = []
        
        for member_id, updates in member_updates.items():
            # Need at least 2 updates to compare
            if len(updates) < 2:
                continue
            
            # Sort updates by timestamp
            updates.sort(key=lambda x: x["timestamp"])
            
            # Get team member details
            team_member = db.query(models.TeamMember).filter(models.TeamMember.id == member_id).first()
            if not team_member:
                continue
                
            # Calculate embeddings for all updates
            update_embeddings = []
            
            for update in updates:
                try:
                    # Generate embedding using OpenAI
                    response = client.embeddings.create(
                        input=update["text"],
                        model="text-embedding-3-small"
                    )
                    embedding = response.data[0].embedding
                    update_embeddings.append(embedding)
                except Exception as e:
                    logger.error(f"Error generating embedding: {str(e)}")
                    continue
            
            # Calculate similarity scores between consecutive updates
            similarity_scores = []
            stalled_periods = []
            
            for i in range(1, len(update_embeddings)):
                # Calculate cosine similarity
                embedding1 = np.array(update_embeddings[i-1])
                embedding2 = np.array(update_embeddings[i])
                
                # Normalize embeddings
                embedding1 = embedding1 / np.linalg.norm(embedding1)
                embedding2 = embedding2 / np.linalg.norm(embedding2)
                
                # Calculate cosine similarity
                similarity = np.dot(embedding1, embedding2)
                
                # Save similarity score
                similarity_scores.append({
                    "score": float(similarity),
                    "date1": updates[i-1]["timestamp"].strftime("%Y-%m-%d"),
                    "date2": updates[i]["timestamp"].strftime("%Y-%m-%d"),
                    "update1_id": updates[i-1]["id"],
                    "update2_id": updates[i]["id"]
                })
                
                # Check if similarity exceeds threshold
                if similarity >= threshold:
                    # Check if productivity score decreased or stayed the same
                    if updates[i]["productivity_score"] <= updates[i-1]["productivity_score"]:
                        stalled_periods.append({
                            "start_date": updates[i-1]["timestamp"].strftime("%Y-%m-%d"),
                            "end_date": updates[i]["timestamp"].strftime("%Y-%m-%d"),
                            "similarity": float(similarity),
                            "update1_id": updates[i-1]["id"],
                            "update2_id": updates[i]["id"]
                        })
            
            # Only include members with stalled periods
            if stalled_periods:
                # Calculate average similarity
                avg_similarity = sum(score["score"] for score in similarity_scores) / len(similarity_scores) if similarity_scores else 0
                
                results.append({
                    "team_member": team_member.name,
                    "role": team_member.role,
                    "department": team_member.department,
                    "average_similarity": avg_similarity,
                    "update_count": len(updates),
                    "similarity_trend": similarity_scores,
                    "stalled_periods": stalled_periods
                })
            
        # Sort results by average similarity (descending)
        results.sort(key=lambda x: x["average_similarity"], reverse=True)
        
        return {
            "analysis_period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "similarity_threshold": threshold,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in semantic similarity analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze semantic similarity: {str(e)}") 