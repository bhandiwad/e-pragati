from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class WeeklyUpdateRequest(BaseModel):
    team_member: str = Field(..., min_length=3, max_length=100)
    text: str = Field(..., min_length=10, max_length=2000)

    @validator('team_member')
    def validate_team_member(cls, v):
        if '-' not in v:
            raise ValueError("team_member must be in format 'Name - Role'")
        parts = v.split(' - ', 1)
        if len(parts) != 2:
            raise ValueError("team_member must be in format 'Name - Role'")
        name, role = parts
        name = name.strip()
        role = role.strip()
        if not name:
            raise ValueError("Name part cannot be empty")
        if not role:
            raise ValueError("Role part cannot be empty")
        return f"{name} - {role}"  # Normalize the format

class AnalysisResponse(BaseModel):
    Completed_Tasks: List[str]
    Project_Progress: List[str]
    Goals_Status: List[str]
    Blockers: List[str]
    Next_Week_Plans: List[str]
    Productivity_Score: float = Field(..., ge=0.0, le=1.0)

class TeamMemberResponse(BaseModel):
    name: str
    role: str
    department: str
    update_count: int
    average_productivity: float
    recent_completed: List[str]
    current_projects: List[str]
    next_week_plans: List[str]
    blockers: List[str]

class DepartmentResponse(BaseModel):
    name: str
    members: List[TeamMemberResponse]
    average_productivity: float
    total_updates: int
    key_projects: List[str]
    common_blockers: List[str]

class TeamOverviewResponse(BaseModel):
    departments: List[DepartmentResponse]
    total_update_count: int
    team_productivity: float
    active_projects: List[str]
    common_blockers: List[str]
    recent_completions: List[str]

class UpdateHistoryItem(BaseModel):
    timestamp: datetime
    team_member: str
    update: str
    analysis: AnalysisResponse

class HistoryResponse(BaseModel):
    history: List[UpdateHistoryItem]

class PerformanceMetrics(BaseModel):
    productivity_score: float
    completed_tasks_count: int
    goals_achieved: int
    project_completion_rate: float
    update_frequency: float
    collaboration_score: float  # Based on cross-department interactions
    impact_score: float  # Based on project importance and completion
    consistency_score: float  # Based on regular updates and steady progress
    innovation_score: float  # Based on new initiatives and solutions
    quality_score: float  # Based on project success and lack of issues
    blockers_resolved: int  # Number of resolved blockers
    avg_task_complexity: float  # Average complexity of completed tasks
    milestone_completion_rate: float  # Rate of achieving major milestones
    knowledge_sharing: int  # Count of documentation/training contributions
    team_contributions: int  # Count of helping team members

class EmployeePerformance(BaseModel):
    name: str
    role: str
    department: str
    performance_tier: str  # "Top 10%", "Next 20%", or "Rest 70%"
    metrics: PerformanceMetrics
    ranking: int  # Overall ranking in the organization

class PerformanceResponse(BaseModel):
    top_performers: List[EmployeePerformance]
    strong_performers: List[EmployeePerformance]
    other_performers: List[EmployeePerformance]
    total_employees: int
    evaluation_period: str  # e.g., "Last 30 days", "Last quarter"

class CopilotQuery(BaseModel):
    query: str
    context: Optional[List[Dict[str, str]]] = None  # List of previous messages with role and content

class CopilotResponse(BaseModel):
    message: str
    metadata: Dict[str, Any] 