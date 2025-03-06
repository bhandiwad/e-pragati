#!/usr/bin/env python
import sys
import os
from pathlib import Path
import typer
from datetime import datetime, timedelta
import random
from typing import List, Dict

# Add the parent directory to Python path to import from src
sys.path.append(str(Path(__file__).parent.parent))

from src.database import SessionLocal, engine
from src import models
from sqlalchemy.orm import Session

app = typer.Typer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

TEAM_MEMBERS = [
    {
        "name": "Sarah Chen",
        "role": "Product Manager",
        "department": "Product"
    },
    {
        "name": "Michael Rodriguez",
        "role": "Senior Developer",
        "department": "Engineering"
    },
    {
        "name": "Emily Taylor",
        "role": "UX Designer",
        "department": "Design"
    },
    {
        "name": "David Kim",
        "role": "Data Scientist",
        "department": "Analytics"
    }
]

UPDATE_TEMPLATES = [
    {
        "Product": [
            "Completed user research for {feature} with {num} participants. PRD for {project} is {percent}% complete. Led {num} stakeholder meetings for {planning}.",
            "Finalized requirements for {feature}. Conducted {num} user interviews. Updated roadmap for {project}.",
            "Created wireframes for {feature}. Gathered feedback from {num} stakeholders. Started planning for {project}."
        ],
        "Engineering": [
            "Implemented {feature} with {num} unit tests. Fixed {num} bugs in {project}. Code review completion rate at {percent}%.",
            "Deployed {feature} to production. Optimized {project} performance by {percent}%. Completed {num} code reviews.",
            "Refactored {project} codebase. Added automated tests for {feature}. Resolved {num} technical debt items."
        ],
        "Design": [
            "Created UI designs for {feature}. Completed {num} user testing sessions. Updated design system for {project}.",
            "Finalized mockups for {feature}. Conducted {num} usability tests. Started designs for {project}.",
            "Delivered {feature} design assets. Created {num} new components. Updated style guide for {project}."
        ],
        "Analytics": [
            "Analyzed {feature} metrics. Generated {num} insights reports. Built dashboard for {project}.",
            "Completed data analysis for {feature}. Processed {num} data points. Updated metrics for {project}.",
            "Created prediction model for {feature}. Analyzed {num} user behaviors. Started analysis for {project}."
        ]
    }
]

FEATURES = ["mobile app", "dashboard", "reporting system", "user authentication", "payment gateway", "notification system"]
PROJECTS = ["Q2 Release", "Platform Migration", "Performance Optimization", "New Feature Development"]
PLANNING = ["sprint planning", "quarterly roadmap", "resource allocation", "feature prioritization"]

def generate_update(department: str, date: datetime) -> Dict:
    template = random.choice(UPDATE_TEMPLATES[0][department])
    feature = random.choice(FEATURES)
    project = random.choice(PROJECTS)
    planning = random.choice(PLANNING)
    
    update_text = template.format(
        feature=feature,
        project=project,
        planning=planning,
        num=random.randint(3, 15),
        percent=random.randint(60, 95)
    )
    
    return {
        "text": update_text,
        "completed_tasks": [f"Completed {feature}", f"Updated {project}"],
        "project_progress": [f"{project} is {random.randint(60, 100)}% complete"],
        "goals_status": [random.choice(["On Track", "Ahead", "Slight Delay"])],
        "blockers": [] if random.random() > 0.3 else ["Waiting for dependencies", "Need stakeholder feedback"],
        "next_week_plans": [f"Continue work on {feature}", f"Start planning for {project}"],
        "productivity_score": round(random.uniform(0.7, 1.0), 2),
        "timestamp": date
    }

def seed_database(db: Session, clear_existing: bool = False):
    if clear_existing:
        # Clear existing data
        db.query(models.Update).delete()
        db.query(models.TeamMember).delete()
        db.commit()
    
    # Create team members
    team_members = []
    for member_data in TEAM_MEMBERS:
        member = models.TeamMember(
            name=member_data["name"],
            role=member_data["role"],
            department=member_data["department"]
        )
        db.add(member)
        team_members.append(member)
    db.commit()
    
    # Generate updates for the past 4 weeks
    end_date = datetime.now()
    start_date = end_date - timedelta(weeks=4)
    current_date = start_date
    
    while current_date <= end_date:
        for member in team_members:
            if random.random() > 0.2:  # 80% chance of having an update
                update_data = generate_update(member.department, current_date)
                update = models.Update(
                    team_member_id=member.id,
                    update_text=update_data["text"],
                    completed_tasks=update_data["completed_tasks"],
                    project_progress=update_data["project_progress"],
                    goals_status=update_data["goals_status"],
                    blockers=update_data["blockers"],
                    next_week_plans=update_data["next_week_plans"],
                    productivity_score=update_data["productivity_score"],
                    timestamp=update_data["timestamp"]
                )
                db.add(update)
        current_date += timedelta(days=7)
    
    db.commit()

@app.command()
def main(clear: bool = typer.Option(False, "--clear", help="Clear existing data before seeding")):
    """Seed the database with test data."""
    try:
        # Create tables
        models.Base.metadata.create_all(bind=engine)
        
        # Get database session
        db = next(get_db())
        
        if clear:
            typer.confirm("This will delete all existing data. Continue?", abort=True)
        
        seed_database(db, clear)
        typer.echo("Database seeded successfully!")
    
    except Exception as e:
        typer.echo(f"Error seeding database: {str(e)}", err=True)
        raise typer.Exit(1)

if __name__ == "__main__":
    app() 