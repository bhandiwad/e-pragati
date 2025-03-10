from .database import SessionLocal
from . import models

def check_data():
    db = SessionLocal()
    try:
        updates = db.query(models.Update).all()
        members = db.query(models.TeamMember).all()
        
        print(f"Found {len(updates)} updates")
        for update in updates:
            print(f"Update ID: {update.id}")
            print(f"Update text: {update.update_text}")
            print("---")
            
        print(f"\nFound {len(members)} team members")
        for member in members:
            print(f"Member ID: {member.id}")
            print(f"Member name: {member.name}")
            print("---")
    finally:
        db.close()

if __name__ == "__main__":
    check_data() 