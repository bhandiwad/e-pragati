from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from . import models

def seed_sample_data():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(models.Update).delete()
        db.query(models.TeamMember).delete()
        
        # Create one team member for testing
        dev = models.TeamMember(
            name="John Developer",
            role="Senior Developer",
            department="Development"
        )
        
        db.add(dev)
        db.commit()

        # Create one simple update
        test_update = models.Update(
            team_member_id=dev.id,
            timestamp=datetime.now(),
            update_text="Started implementation of the authentication system.",
            completed_tasks=json.dumps(["Initial setup"]),
            project_progress=json.dumps(["Auth system 20%"]),
            goals_status=json.dumps(["On track"]),
            blockers=json.dumps([]),
            next_week_plans=json.dumps(["Complete OAuth"]),
            productivity_score=0.8
        )
        
        db.add(test_update)
        db.commit()
        print("Sample data seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_data() 