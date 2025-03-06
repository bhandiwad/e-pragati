from datetime import datetime, timedelta
import json
import random
from src.database import SessionLocal, engine
import src.models as models
from src.models import Base

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Initializing database...")
    db = SessionLocal()
    
    # Clear existing data
    db.query(models.Update).delete()
    db.query(models.TeamMember).delete()
    
    # Create team members
    team_members = [
        models.TeamMember(name="Karthik Subramanian", role="Product Manager", department="Product Management"),
        models.TeamMember(name="Arjun Patel", role="Product Owner", department="Product Management"),
        models.TeamMember(name="Lakshmi Narayanan", role="Business Analyst", department="Product Management"),
        
        models.TeamMember(name="Rajesh Kumar", role="Solutions Architect", department="Solutions"),
        models.TeamMember(name="Aishwarya Venkatesh", role="Solutions Engineer", department="Solutions"),
        models.TeamMember(name="Varun Krishnaswamy", role="Solutions Consultant", department="Solutions"),
        
        models.TeamMember(name="Ramesh Chandran", role="Delivery Manager", department="Service Delivery"),
        models.TeamMember(name="Meera Reddy", role="Project Manager", department="Service Delivery"),
        models.TeamMember(name="Karthik Iyer", role="Technical Lead", department="Service Delivery"),
        
        models.TeamMember(name="Deepa Nair", role="Quality Manager", department="Service Assurance"),
        models.TeamMember(name="Suresh Menon", role="Test Engineer", department="Service Assurance"),
        models.TeamMember(name="Priya Raghavan", role="Performance Engineer", department="Service Assurance"),
        
        models.TeamMember(name="Shankar Venkatesan", role="IT Manager", department="IT"),
        models.TeamMember(name="Pooja Desai", role="System Administrator", department="IT"),
        models.TeamMember(name="Arun Padmanabhan", role="Network Engineer", department="IT"),
        
        models.TeamMember(name="Srinivas Iyengar", role="Development Manager", department="Development"),
        models.TeamMember(name="Ananya Krishnan", role="Senior Developer", department="Development"),
        models.TeamMember(name="Rohan Chopra", role="Software Engineer", department="Development"),
        
        models.TeamMember(name="Divya Ramachandran", role="Platform Lead", department="Platform Engineering"),
        models.TeamMember(name="Nikhil Sharma", role="DevOps Engineer", department="Platform Engineering"),
        models.TeamMember(name="Kavita Gopalakrishnan", role="Cloud Architect", department="Platform Engineering"),
        
        models.TeamMember(name="Shweta Sinha", role="HR Director", department="HR"),
        models.TeamMember(name="Vijay Raghunathan", role="HR Manager", department="HR"),
        models.TeamMember(name="Lakshmi Venkataraman", role="HR Specialist", department="HR"),
        
        models.TeamMember(name="Vivek Malhotra", role="Legal Counsel", department="Legal"),
        models.TeamMember(name="Gayatri Sundaram", role="Legal Advisor", department="Legal"),
        models.TeamMember(name="Arjun Ranganathan", role="Compliance Officer", department="Legal"),
    ]
    
    for member in team_members:
        db.add(member)
    db.commit()
    
    # Create updates for the past 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    current_date = start_date
    
    while current_date <= end_date:
        for member in team_members:
            # 80% chance of having an update on any given day
            if random.random() < 0.8:
                completed_tasks = json.dumps([
                    f"Task {i+1} for {member.name}" for i in range(random.randint(2, 5))
                ])
                project_progress = json.dumps([
                    f"Project {chr(65+i)} Progress: {random.randint(10, 100)}%" for i in range(random.randint(1, 3))
                ])
                goals_status = json.dumps([
                    f"Goal {i+1}: {'Completed' if random.random() > 0.5 else 'In Progress'}" for i in range(random.randint(2, 4))
                ])
                blockers = json.dumps([
                    f"Blocker {i+1}" for i in range(random.randint(0, 2))
                ])
                next_week_plans = json.dumps([
                    f"Plan {i+1} for next week" for i in range(random.randint(2, 4))
                ])
                
                update = models.Update(
                    team_member_id=member.id,
                    timestamp=current_date,
                    update_text=f"Update from {member.name} for {current_date.strftime('%Y-%m-%d')}",
                    completed_tasks=completed_tasks,
                    project_progress=project_progress,
                    goals_status=goals_status,
                    blockers=blockers,
                    next_week_plans=next_week_plans,
                    productivity_score=random.uniform(0.6, 1.0)
                )
                db.add(update)
        
        current_date += timedelta(days=1)
    
    db.commit()
    db.close()
    print("Database initialization completed successfully!")

if __name__ == "__main__":
    init_db() 