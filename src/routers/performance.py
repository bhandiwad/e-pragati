from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json
import logging
import traceback
from statistics import mean

import src.models as models
import src.schemas as schemas
from src.database import get_db

router = APIRouter(prefix="/performance", tags=["performance"])

logger = logging.getLogger(__name__)

def calculate_metrics(updates: List[models.Update], start_date: datetime) -> schemas.PerformanceMetrics:
    """Calculate performance metrics from a list of updates."""
    if not updates:
        return schemas.PerformanceMetrics(
            productivity_score=0.0,
            completed_tasks_count=0,
            goals_achieved=0,
            project_completion_rate=0.0,
            update_frequency=0.0,
            collaboration_score=0.0,
            impact_score=0.0,
            consistency_score=0.0,
            innovation_score=0.0,
            quality_score=0.0,
            blockers_resolved=0,
            avg_task_complexity=0.0,
            milestone_completion_rate=0.0,
            knowledge_sharing=0,
            team_contributions=0
        )
    
    # Calculate average productivity score
    productivity_scores = [update.productivity_score for update in updates if update.productivity_score is not None]
    avg_productivity = mean(productivity_scores) if productivity_scores else 0.0
    
    # Count completed tasks and analyze their complexity
    completed_tasks_list = []
    total_complexity = 0
    for update in updates:
        if update.completed_tasks:
            tasks = json.loads(update.completed_tasks)
            completed_tasks_list.extend(tasks)
            # Estimate task complexity based on description length and key terms
            for task in tasks:
                complexity = 1.0
                if any(term in task.lower() for term in ['architecture', 'design', 'implement', 'optimize']):
                    complexity += 0.5
                if any(term in task.lower() for term in ['complex', 'challenging', 'difficult']):
                    complexity += 0.3
                if len(task.split()) > 10:  # Longer descriptions suggest more complex tasks
                    complexity += 0.2
                total_complexity += complexity
    
    completed_tasks = len(completed_tasks_list)
    avg_task_complexity = total_complexity / completed_tasks if completed_tasks > 0 else 0.0
    
    # Count achieved goals and milestones
    goals_achieved = 0
    milestones_completed = 0
    milestones_total = 0
    for update in updates:
        if update.goals_status:
            goals = json.loads(update.goals_status)
            goals_achieved += len([g for g in goals if "complete" in g.lower() or "achieved" in g.lower()])
            # Count milestones (important goals)
            for goal in goals:
                if any(term in goal.lower() for term in ['milestone', 'major', 'key', 'critical']):
                    milestones_total += 1
                    if "complete" in goal.lower() or "achieved" in goal.lower():
                        milestones_completed += 1
    
    milestone_completion_rate = milestones_completed / milestones_total if milestones_total > 0 else 0.0
    
    # Calculate project completion rate and impact
    all_projects = []
    impact_score = 0.0
    for update in updates:
        if update.project_progress:
            projects = json.loads(update.project_progress)
            all_projects.extend([p for p in projects if "%" in p])
            # Calculate impact based on project importance indicators
            for project in projects:
                if any(term in project.lower() for term in ['critical', 'key', 'major', 'strategic']):
                    impact_score += 0.3
                if any(term in project.lower() for term in ['customer', 'revenue', 'cost-saving']):
                    impact_score += 0.2
    
    impact_score = min(1.0, impact_score)  # Normalize to 0-1
    
    # Calculate completion rates
    completion_rates = []
    for project in all_projects:
        try:
            rate = int(''.join(filter(str.isdigit, project)))
            if 0 <= rate <= 100:
                completion_rates.append(rate)
        except ValueError:
            continue
    
    avg_completion_rate = mean(completion_rates) / 100 if completion_rates else 0.0
    
    # Calculate update frequency and consistency
    days_in_period = (datetime.now() - start_date).days
    weeks_in_period = max(1, days_in_period / 7)
    update_frequency = len(updates) / weeks_in_period
    
    # Calculate consistency score based on regular updates
    update_dates = [update.timestamp.date() for update in updates]
    update_dates.sort()
    gaps = []
    for i in range(1, len(update_dates)):
        gap = (update_dates[i] - update_dates[i-1]).days
        gaps.append(gap)
    consistency_score = 1.0 - (mean(gaps) / 7 if gaps else 0) # Higher score for smaller gaps
    consistency_score = max(0.0, min(1.0, consistency_score))
    
    # Calculate collaboration and knowledge sharing
    collaboration_mentions = 0
    knowledge_sharing_count = 0
    team_help_count = 0
    for update in updates:
        text = update.update_text.lower()
        # Count collaboration instances
        collaboration_mentions += sum(1 for term in ['collaborated', 'worked with', 'helped', 'supported', 'paired']
                                   if term in text)
        # Count knowledge sharing activities
        knowledge_sharing_count += sum(1 for term in ['documented', 'trained', 'presented', 'shared', 'mentored']
                                    if term in text)
        # Count team contributions
        team_help_count += sum(1 for term in ['helped team', 'supported colleague', 'assisted', 'mentored']
                             if term in text)
    
    collaboration_score = min(1.0, collaboration_mentions / (len(updates) * 2))  # Normalize to 0-1
    
    # Calculate innovation score based on new initiatives and solutions
    innovation_mentions = 0
    for update in updates:
        text = update.update_text.lower()
        if any(term in text for term in ['new solution', 'innovative', 'improved', 'optimized', 'automated']):
            innovation_mentions += 1
    
    innovation_score = min(1.0, innovation_mentions / len(updates))
    
    # Calculate quality score based on successful deliveries and lack of issues
    quality_issues = 0
    for update in updates:
        if update.blockers:
            blockers = json.loads(update.blockers)
            quality_issues += sum(1 for b in blockers if 'bug' in b.lower() or 'issue' in b.lower() or 'error' in b.lower())
    
    quality_score = 1.0 - min(1.0, quality_issues / (completed_tasks if completed_tasks > 0 else 1))
    
    # Count resolved blockers
    resolved_blockers = 0
    for update in updates:
        text = update.update_text.lower()
        if any(term in text for term in ['resolved', 'fixed', 'solved', 'addressed']):
            resolved_blockers += 1
    
    return schemas.PerformanceMetrics(
        productivity_score=avg_productivity,
        completed_tasks_count=completed_tasks,
        goals_achieved=goals_achieved,
        project_completion_rate=avg_completion_rate,
        update_frequency=update_frequency,
        collaboration_score=collaboration_score,
        impact_score=impact_score,
        consistency_score=consistency_score,
        innovation_score=innovation_score,
        quality_score=quality_score,
        blockers_resolved=resolved_blockers,
        avg_task_complexity=avg_task_complexity,
        milestone_completion_rate=milestone_completion_rate,
        knowledge_sharing=knowledge_sharing_count,
        team_contributions=team_help_count
    )

def calculate_overall_score(metrics: schemas.PerformanceMetrics) -> float:
    """Calculate overall performance score based on metrics."""
    weights = {
        'productivity_score': 0.3,
        'completed_tasks_count': 0.2,
        'goals_achieved': 0.2,
        'project_completion_rate': 0.2,
        'update_frequency': 0.1
    }
    
    # Normalize metrics
    max_tasks = 20  # Assuming 20 tasks per period is maximum
    max_goals = 10  # Assuming 10 goals per period is maximum
    max_frequency = 5  # Assuming 5 updates per week is maximum
    
    normalized_metrics = {
        'productivity_score': metrics.productivity_score,  # Already 0-1
        'completed_tasks_count': min(1.0, metrics.completed_tasks_count / max_tasks),
        'goals_achieved': min(1.0, metrics.goals_achieved / max_goals),
        'project_completion_rate': metrics.project_completion_rate,  # Already 0-1
        'update_frequency': min(1.0, metrics.update_frequency / max_frequency)
    }
    
    # Calculate weighted score
    overall_score = sum(normalized_metrics[metric] * weight 
                       for metric, weight in weights.items())
    
    return overall_score

@router.get("/ratings", response_model=schemas.PerformanceResponse)
async def get_employee_ratings(
    period: str = "30d",  # Options: 30d, 90d, 180d, 365d
    db: Session = Depends(get_db)
):
    """Get employee performance ratings and tiers."""
    try:
        # Calculate start date based on period
        period_days = {
            "30d": 30,
            "90d": 90,
            "180d": 180,
            "365d": 365
        }
        if period not in period_days:
            raise HTTPException(status_code=400, detail="Invalid period")
        
        start_date = datetime.now() - timedelta(days=period_days[period])
        
        # Get all team members and their updates
        team_members = db.query(models.TeamMember).all()
        
        # Calculate performance metrics for each employee
        employee_scores: List[Tuple[models.TeamMember, schemas.PerformanceMetrics, float]] = []
        
        for member in team_members:
            updates = db.query(models.Update).filter(
                models.Update.team_member_id == member.id,
                models.Update.timestamp >= start_date
            ).all()
            
            if not updates:  # Skip members with no updates
                continue
            
            metrics = calculate_metrics(updates, start_date)
            overall_score = calculate_overall_score(metrics)
            
            employee_scores.append((member, metrics, overall_score))
        
        # Sort employees by overall score
        employee_scores.sort(key=lambda x: x[2], reverse=True)
        
        # Calculate tier thresholds
        total_employees = len(employee_scores)
        top_threshold = max(1, int(total_employees * 0.1))  # Top 10%
        strong_threshold = max(1, int(total_employees * 0.3))  # Next 20%
        
        # Create performance response
        response = schemas.PerformanceResponse(
            top_performers=[],
            strong_performers=[],
            other_performers=[],
            total_employees=total_employees,
            evaluation_period=f"Last {period_days[period]} days"
        )
        
        # Categorize employees into tiers
        for rank, (member, metrics, _) in enumerate(employee_scores, 1):
            performance = schemas.EmployeePerformance(
                name=member.name,
                role=member.role,
                department=member.department,
                metrics=metrics,
                ranking=rank,
                performance_tier="Top 10%" if rank <= top_threshold else
                              "Next 20%" if rank <= strong_threshold else
                              "Rest 70%"
            )
            
            if rank <= top_threshold:
                response.top_performers.append(performance)
            elif rank <= strong_threshold:
                response.strong_performers.append(performance)
            else:
                response.other_performers.append(performance)
        
        return response
        
    except Exception as e:
        logger.error(f"Error calculating performance ratings: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 