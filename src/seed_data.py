from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal

def seed_database():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(models.Update).delete()
        db.query(models.TeamMember).delete()
        db.commit()

        # Create team members
        team_members = [
            models.TeamMember(
                name="Sarah Chen - Product Manager",
                role="Product Manager",
                department="Product Management"
            ),
            models.TeamMember(
                name="Alex Kumar - Senior Developer",
                role="Senior Developer",
                department="Development"
            ),
            models.TeamMember(
                name="Maria Garcia - Solutions Architect",
                role="Solutions Architect",
                department="Solutions"
            ),
            models.TeamMember(
                name="James Wilson - DevOps Engineer",
                role="DevOps Engineer",
                department="Platform Engineering"
            )
        ]

        for member in team_members:
            db.add(member)
        db.commit()

        # Create updates (last 2 weeks of data)
        updates = [
            # Sarah Chen's updates
            {
                "team_member": "Sarah Chen - Product Manager",
                "updates": [
                    {
                        "text": "Completed user research for mobile app redesign with 50 participants. Product requirements document for payment gateway integration is 80% complete. Led 3 stakeholder meetings for Q2 roadmap planning.",
                        "completed_tasks": [
                            "Conducted user research with 50 participants",
                            "Led 3 stakeholder meetings",
                            "Drafted 80% of payment gateway PRD"
                        ],
                        "project_progress": [
                            "Mobile App Redesign: Research phase complete",
                            "Payment Gateway Integration: PRD 80% complete",
                            "Q2 Roadmap: Stakeholder alignment in progress"
                        ],
                        "goals_status": [
                            "Q1 Goal 1: User research completed",
                            "Q1 Goal 2: PRD development on track"
                        ],
                        "blockers": [
                            "Waiting for legal review on payment gateway requirements",
                            "Resource constraints in design team"
                        ],
                        "next_week_plans": [
                            "Finalize PRD for payment gateway",
                            "Start user story mapping for inventory module",
                            "Conduct competitor analysis"
                        ],
                        "productivity_score": 0.85
                    }
                ]
            },
            # Alex Kumar's updates
            {
                "team_member": "Alex Kumar - Senior Developer",
                "updates": [
                    {
                        "text": "Implemented new authentication system with 99.9% success rate. Reduced API response time by 40% through optimization. Mentored 2 junior developers on best practices.",
                        "completed_tasks": [
                            "Implemented authentication system",
                            "Optimized API performance",
                            "Conducted 4 mentoring sessions"
                        ],
                        "project_progress": [
                            "Auth System: 100% complete",
                            "API Optimization: 90% complete",
                            "Team Training: Ongoing"
                        ],
                        "goals_status": [
                            "Q1 Goal 1: Auth system deployed",
                            "Q1 Goal 2: Performance optimization ahead of schedule"
                        ],
                        "blockers": [
                            "Waiting for security team review",
                            "Test environment stability issues"
                        ],
                        "next_week_plans": [
                            "Complete API optimization",
                            "Start work on data migration tool",
                            "Review junior developers' PRs"
                        ],
                        "productivity_score": 0.92
                    }
                ]
            },
            # Maria Garcia's updates
            {
                "team_member": "Maria Garcia - Solutions Architect",
                "updates": [
                    {
                        "text": "Designed scalable architecture for new microservices platform. Completed technical documentation for 3 major systems. Resolved 2 critical production issues.",
                        "completed_tasks": [
                            "Completed microservices architecture design",
                            "Documented 3 major systems",
                            "Resolved 2 P1 issues"
                        ],
                        "project_progress": [
                            "Microservices Platform: Design phase complete",
                            "System Documentation: 85% complete",
                            "Production Stability: Improved by 30%"
                        ],
                        "goals_status": [
                            "Q1 Goal 1: Architecture design completed",
                            "Q1 Goal 2: Documentation in progress"
                        ],
                        "blockers": [
                            "Pending infrastructure cost approval",
                            "Team bandwidth for implementation"
                        ],
                        "next_week_plans": [
                            "Start implementation planning",
                            "Conduct architecture review",
                            "Create migration strategy"
                        ],
                        "productivity_score": 0.88
                    }
                ]
            },
            # James Wilson's updates
            {
                "team_member": "James Wilson - DevOps Engineer",
                "updates": [
                    {
                        "text": "Automated deployment pipeline reducing deploy time by 60%. Implemented new monitoring system with 99.9% accuracy. Set up disaster recovery system with 15-minute RPO.",
                        "completed_tasks": [
                            "Automated deployment pipeline",
                            "Implemented new monitoring system",
                            "Set up disaster recovery"
                        ],
                        "project_progress": [
                            "CI/CD Automation: 100% complete",
                            "Monitoring System: 95% complete",
                            "DR Setup: Testing phase"
                        ],
                        "goals_status": [
                            "Q1 Goal 1: Deployment automation complete",
                            "Q1 Goal 2: Monitoring system nearly complete"
                        ],
                        "blockers": [
                            "Cloud provider quota limits",
                            "Pending security review for DR process"
                        ],
                        "next_week_plans": [
                            "Complete monitoring system rollout",
                            "Start load testing framework",
                            "Document DR procedures"
                        ],
                        "productivity_score": 0.90
                    }
                ]
            }
        ]

        # Add updates with different timestamps
        for member_data in updates:
            member = db.query(models.TeamMember).filter_by(name=member_data["team_member"]).first()
            if member:
                for i, update_data in enumerate(member_data["updates"]):
                    update = models.Update(
                        team_member_id=member.id,
                        timestamp=datetime.utcnow() - timedelta(days=i*7),  # One update per week
                        update_text=update_data["text"],
                        completed_tasks=update_data["completed_tasks"],
                        project_progress=update_data["project_progress"],
                        goals_status=update_data["goals_status"],
                        blockers=update_data["blockers"],
                        next_week_plans=update_data["next_week_plans"],
                        productivity_score=update_data["productivity_score"]
                    )
                    db.add(update)
        
        db.commit()
        print("Database seeded successfully!")
    
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database() 