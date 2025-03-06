from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    role = Column(String)
    department = Column(String)
    updates = relationship("Update", back_populates="team_member")

class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    team_member_id = Column(Integer, ForeignKey("team_members.id"))
    update_text = Column(String)
    
    # Analysis fields
    completed_tasks = Column(String)  # JSON string
    project_progress = Column(String)  # JSON string
    goals_status = Column(String)  # JSON string
    blockers = Column(String)  # JSON string
    next_week_plans = Column(String)  # JSON string
    productivity_score = Column(Float)

    team_member = relationship("TeamMember", back_populates="updates") 