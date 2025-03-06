from dotenv import load_dotenv
import os
import json
from datetime import datetime
from typing import List, Dict, Any
from statistics import mean
from collections import defaultdict
from pathlib import Path
import socket
import logging
import sys
import typer
import openai
from sqlalchemy import text
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import traceback

from .config import config
from . import models, schemas
from .database import get_db, get_db_session, verify_db_connection, init_db
from .routers import analytics, performance, copilot

# Configure logging
logging.basicConfig(level=getattr(logging, config.logging.level))
logger = logging.getLogger(__name__)

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

# Configure OpenAI API key
openai.api_key = config.api.openai_api_key
if not openai.api_key:
    logger.error("OpenAI API key not found in environment variables")
    sys.exit(1)

cli = typer.Typer()

@cli.command()
def seed():
    """Seed the database with test data."""
    try:
        seed_database()
        logger.info("Database seeded successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise typer.Exit(1)

def find_available_port(start_port: int, max_attempts: int = 10) -> int:
    """Find an available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                logger.info(f"Found available port: {port}")
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find an available port in range {start_port}-{start_port + max_attempts}")

# Try to find an available port
try:
    PORT = find_available_port(8001)
except RuntimeError as e:
    logger.error(str(e))
    sys.exit(1)

app = FastAPI(
    title="E-Pragati",
    description="Employee Productivity Analysis Platform",
    version="1.0.0"
)

# Add routers
app.include_router(analytics.router)
app.include_router(performance.router)
app.include_router(copilot.router)

# Initialize database
try:
    init_db()
except SQLAlchemyError as e:
    logger.error(f"Failed to initialize database: {e}")
    sys.exit(1)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware to handle database session errors."""
    try:
        response = await call_next(request)
        return response
    except SQLAlchemyError as e:
        logger.error(f"Database error in request: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "A database error occurred", "type": "database_error"}
        )
    except Exception as e:
        logger.error(f"Unexpected error in request: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e), "type": "server_error"}
        )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Database error occurred", "type": "database_error"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": "server_error"}
    )

@app.on_event("startup")
async def startup_event():
    """Startup event handler to verify database connection and initialize app."""
    try:
        # Initialize database first
        logger.info("Initializing database...")
        init_db()
        
        # Then verify connection
        logger.info("Verifying database connection...")
        if not verify_db_connection():
            logger.error("Failed to verify database connection")
            sys.exit(1)
        logger.info("Database connection verified")
        
        # Log startup configuration
        logger.info("Starting application with configuration:")
        logger.info(f"Database type: {config.database.type}")
        logger.info(f"Database name: {config.database.name}")
        logger.info(f"API host: {config.api.host}")
        logger.info(f"API port: {config.api.port}")
        logger.info(f"Feature flags: {config.features.__dict__}")
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        logger.error(traceback.format_exc())
        sys.exit(1)

@app.get("/")
async def root():
    return {"message": "Welcome to E-Pragati API"}

def get_department_from_role(role: str) -> str:
    role = role.lower()
    if "product" in role:
        return "Product Management"
    elif "solution" in role:
        return "Solutions"
    elif "delivery" in role or "project" in role or "service manager" in role:
        return "Service Delivery"
    elif "quality" in role or "sre" in role or "performance" in role:
        return "Service Assurance"
    elif "it" in role or "infrastructure" in role or "security" in role:
        return "IT"
    elif "dev" in role or "developer" in role:
        return "Development"
    elif "platform" in role or "devops" in role or "cloud" in role:
        return "Platform Engineering"
    elif "hr" in role:
        return "HR"
    elif "legal" in role or "compliance" in role:
        return "Legal"
    return "Unknown"

@app.get("/history", response_model=schemas.HistoryResponse)
async def get_history(db: Session = Depends(get_db)):
    try:
        updates = db.query(models.Update).order_by(models.Update.timestamp.desc()).all()
        return {
            "history": [
                {
                    "timestamp": update.timestamp,
                    "team_member": update.team_member.name,
                    "update": update.update_text,
                    "analysis": {
                        "Completed_Tasks": json.loads(update.completed_tasks) if update.completed_tasks else [],
                        "Project_Progress": json.loads(update.project_progress) if update.project_progress else [],
                        "Goals_Status": json.loads(update.goals_status) if update.goals_status else [],
                        "Blockers": json.loads(update.blockers) if update.blockers else [],
                        "Next_Week_Plans": json.loads(update.next_week_plans) if update.next_week_plans else [],
                        "Productivity_Score": float(update.productivity_score) if update.productivity_score is not None else 0.0
                    }
                }
                for update in updates
            ]
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in history: {e}")
        raise HTTPException(status_code=500, detail="Error parsing update data")
    except SQLAlchemyError as e:
        logger.error(f"Database error in history: {e}")
        raise HTTPException(status_code=500, detail="Error fetching history")
    except Exception as e:
        logger.error(f"Unexpected error in history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/team-overview", response_model=schemas.TeamOverviewResponse)
async def get_team_overview(db: Session = Depends(get_db)):
    try:
        department_data: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "name": "",
            "members": defaultdict(lambda: {
                "name": "",
                "update_count": 0,
                "productivity_scores": [],
                "completed_tasks": [],
                "current_projects": [],
                "blockers": [],
                "next_week_plans": [],
            }),
            "total_updates": 0,
            "productivity_scores": [],
            "key_projects": [],
            "common_blockers": [],
        })
        
        updates = db.query(models.Update).join(models.TeamMember).all()
        
        for update in updates:
            try:
                member = update.team_member.name
                department = update.team_member.department
                
                dept_data = department_data[department]
                dept_data["name"] = department
                dept_data["total_updates"] += 1
                dept_data["productivity_scores"].append(update.productivity_score or 0)
                
                # Parse JSON fields
                project_progress = parse_json_array(update.project_progress)
                blockers = parse_json_array(update.blockers)
                completed_tasks = parse_json_array(update.completed_tasks)
                next_week_plans = parse_json_array(update.next_week_plans)
                
                dept_data["key_projects"].extend(project_progress)
                dept_data["common_blockers"].extend(blockers)
                
                member_data = dept_data["members"][member]
                member_data["name"] = member
                member_data["update_count"] += 1
                member_data["productivity_scores"].append(update.productivity_score or 0)
                member_data["completed_tasks"].extend(completed_tasks)
                member_data["current_projects"].extend(project_progress)
                member_data["blockers"].extend(blockers)
                member_data["next_week_plans"].extend(next_week_plans)
            except Exception as e:
                logger.error(f"Error processing update {update.id}: {str(e)}")
                continue

        def get_top_items(items: List[str], n: int = 5) -> List[str]:
            if not items:
                return []
            from collections import Counter
            return [item for item, _ in Counter(items).most_common(n)]

        departments = []
        all_projects = []
        all_blockers = []
        all_completed_tasks = []

        for dept_name, dept_data in department_data.items():
            members = []
            for member_name, member_data in dept_data["members"].items():
                try:
                    members.append({
                        "name": member_name,
                        "role": member_name.split(" - ")[1] if " - " in member_name else "Unknown",
                        "department": dept_name,
                        "update_count": member_data["update_count"],
                        "average_productivity": mean(member_data["productivity_scores"]) if member_data["productivity_scores"] else 0,
                        "recent_completed": member_data["completed_tasks"][-3:] if member_data["completed_tasks"] else [],
                        "current_projects": member_data["current_projects"][-3:] if member_data["current_projects"] else [],
                        "next_week_plans": member_data["next_week_plans"][-3:] if member_data["next_week_plans"] else [],
                        "blockers": member_data["blockers"][-3:] if member_data["blockers"] else []
                    })
                except Exception as e:
                    logger.error(f"Error processing member {member_name}: {str(e)}")
                    continue

            departments.append({
                "name": dept_name,
                "members": members,
                "average_productivity": mean(dept_data["productivity_scores"]) if dept_data["productivity_scores"] else 0,
                "total_updates": dept_data["total_updates"],
                "key_projects": get_top_items(dept_data["key_projects"], 3),
                "common_blockers": get_top_items(dept_data["common_blockers"], 3)
            })
            
            all_projects.extend(dept_data["key_projects"])
            all_blockers.extend(dept_data["common_blockers"])
            for member_data in dept_data["members"].values():
                all_completed_tasks.extend(member_data["completed_tasks"])

        total_updates = sum(dept["total_updates"] for dept in departments)
        all_productivity = [s for dept_data in department_data.values() for s in dept_data["productivity_scores"]]
        team_productivity = mean(all_productivity) if all_productivity else 0

        return {
            "departments": departments,
            "total_update_count": total_updates,
            "team_productivity": team_productivity,
            "active_projects": get_top_items(all_projects),
            "common_blockers": get_top_items(all_blockers),
            "recent_completions": get_top_items(all_completed_tasks)
        }
    except Exception as e:
        logger.error(f"Error in team overview: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching team overview: {str(e)}")

@app.post("/analyze", response_model=schemas.AnalysisResponse)
async def analyze_weekly_update(update: schemas.WeeklyUpdateRequest, db: Session = Depends(get_db)):
    """Analyze a weekly update using OpenAI API."""
    try:
        logger.info(f"Received analyze request for team member: {update.team_member}")
        logger.info(f"Update text: {update.text}")
        
        if not openai.api_key:
            logger.error("OpenAI API key not configured")
            raise HTTPException(status_code=503, detail="OpenAI API key not configured")

        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        logger.info("Making request to OpenAI API...")
        
        prompt = f"""
        Analyze the following weekly update and provide a structured analysis focusing on productivity metrics:
        1. Completed_Tasks (list of completed tasks/deliverables with measurable outcomes)
        2. Project_Progress (list of ongoing projects and their status updates)
        3. Goals_Status (list of goals and their completion status)
        4. Blockers (list of any impediments affecting progress)
        5. Next_Week_Plans (list of planned tasks/objectives for next week)
        6. Productivity_Score (number between 0 and 1, based on task completion and progress)

        Return ONLY a JSON object with these exact field names.
        Each field (except Productivity_Score) should be a list of strings.
        Productivity_Score should be a number between 0 and 1.

        Weekly Update:
        {update.text}
        """
        
        try:
            logger.info("Sending request to OpenAI...")
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert productivity analyst. Respond only with valid JSON matching the exact format requested."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            logger.info("Received response from OpenAI")
            
            if not response.choices or not response.choices[0].message.content:
                logger.error("No content in OpenAI response")
                raise HTTPException(status_code=503, detail="No response from OpenAI API")
            
            logger.info(f"OpenAI response content: {response.choices[0].message.content}")
            logger.info("Parsing OpenAI response...")
            
            try:
                analysis = json.loads(response.choices[0].message.content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response as JSON: {e}")
                logger.error(f"Raw response: {response.choices[0].message.content}")
                raise HTTPException(status_code=422, detail=f"Invalid JSON response from OpenAI: {str(e)}")
            
            required_fields = [
                "Completed_Tasks",
                "Project_Progress",
                "Goals_Status",
                "Blockers",
                "Next_Week_Plans",
                "Productivity_Score"
            ]
            
            # Validate required fields
            missing_fields = [field for field in required_fields if field not in analysis]
            if missing_fields:
                logger.error(f"Missing fields in OpenAI response: {missing_fields}")
                for field in missing_fields:
                    analysis[field] = [] if field != "Productivity_Score" else 0

            logger.info("Getting or creating team member...")
            # Get or create team member
            member_name = update.team_member
            team_member = db.query(models.TeamMember).filter_by(name=member_name).first()
            if not team_member:
                logger.info(f"Creating new team member: {member_name}")
                name_parts = member_name.split(" - ")
                role = name_parts[1] if len(name_parts) > 1 else "Unknown"
                department = get_department_from_role(role)
                team_member = models.TeamMember(
                    name=member_name,
                    role=role,
                    department=department
                )
                db.add(team_member)
                db.commit()
                db.refresh(team_member)

            logger.info("Creating update record...")
            # Create update record
            try:
                db_update = models.Update(
                    team_member_id=team_member.id,
                    update_text=update.text,
                    completed_tasks=json.dumps(analysis["Completed_Tasks"]),
                    project_progress=json.dumps(analysis["Project_Progress"]),
                    goals_status=json.dumps(analysis["Goals_Status"]),
                    blockers=json.dumps(analysis["Blockers"]),
                    next_week_plans=json.dumps(analysis["Next_Week_Plans"]),
                    productivity_score=float(analysis["Productivity_Score"])
                )
                db.add(db_update)
                db.commit()
                db.refresh(db_update)
            except Exception as e:
                logger.error(f"Error creating database record: {str(e)}")
                logger.error(f"Analysis data: {analysis}")
                raise
            
            logger.info("Analysis completed successfully")
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from OpenAI: {e}")
            logger.error(f"Response content: {response.choices[0].message.content if response.choices else 'No content'}")
            raise HTTPException(status_code=422, detail="Invalid analysis response format")
        except Exception as e:
            logger.error(f"Error processing OpenAI response: {str(e)}")
            raise HTTPException(status_code=503, detail=str(e))
            
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI authentication error: {str(e)}")
        raise HTTPException(status_code=503, detail="OpenAI API key is invalid")
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving update to database")
    except Exception as e:
        logger.error(f"Unexpected error in analyze endpoint: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))