from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json
from sqlalchemy import func
import openai
import os
import logging

from src.database import get_db
import src.models as models
import src.schemas as schemas

router = APIRouter()

logger = logging.getLogger(__name__)

def analyze_query(query: str, context: List[Dict[str, str]] = None) -> str:
    """
    Analyze the natural language query and determine its primary type.
    Returns the primary query type as a string.
    """
    query = query.lower()
    
    # Define query patterns with their priorities
    patterns = [
        ('missing_updates', ['missing', 'not submitted', 'no update', 'who has not']),
        ('productivity', ['productivity', 'performance', 'efficiency', 'trends']),
        ('blockers', ['blocker', 'obstacle', 'challenge', 'issue', 'problem']),
        ('engagement', ['engagement', 'participation', 'active', 'highest'])
    ]
    
    # Check each pattern in order of priority
    for query_type, words in patterns:
        if any(word in query for word in words):
            return query_type
            
    return 'unknown'

def get_missing_updates(db: Session, days: int = 7) -> List[Dict[str, Any]]:
    """Get list of employees who haven't submitted updates recently."""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get all employees
    all_employees = db.query(models.TeamMember).all()
    
    # Get employees with recent updates
    active_employees = db.query(models.TeamMember)\
        .join(models.Update)\
        .filter(models.Update.timestamp >= cutoff_date)\
        .distinct()\
        .all()
    
    # Find employees without updates
    missing_updates = [emp for emp in all_employees if emp not in active_employees]
    
    return [{
        'name': emp.name,
        'department': emp.department,
        'last_update': emp.updates[-1].timestamp if emp.updates else None
    } for emp in missing_updates]

def get_productivity_trends(db: Session, days: int = 30) -> Dict[str, Any]:
    """Get productivity trends by department."""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    trends = db.query(
        models.TeamMember.department,
        func.avg(models.Update.productivity_score).label('avg_score'),
        func.date_trunc('day', models.Update.timestamp).label('date')
    )\
    .join(models.TeamMember)\
    .filter(models.Update.timestamp >= cutoff_date)\
    .group_by(models.TeamMember.department, 'date')\
    .order_by('date')\
    .all()
    
    # Organize data by department
    result = {}
    for dept, score, date in trends:
        if dept not in result:
            result[dept] = []
        result[dept].append({
            'date': date.strftime('%Y-%m-%d'),
            'score': float(score)
        })
    
    return result

def get_current_blockers(db: Session) -> List[Dict[str, Any]]:
    """Get current blockers across teams."""
    recent_updates = db.query(models.Update)\
        .join(models.TeamMember)\
        .filter(models.Update.blockers.isnot(None))\
        .order_by(models.Update.timestamp.desc())\
        .limit(50)\
        .all()
    
    blockers = []
    for update in recent_updates:
        if update.blockers:
            try:
                blocker_list = json.loads(update.blockers)
                if blocker_list:
                    blockers.append({
                        'department': update.team_member.department,
                        'employee': update.team_member.name,
                        'blockers': blocker_list,
                        'date': update.timestamp
                    })
            except json.JSONDecodeError:
                continue
    
    return blockers

def get_team_engagement(db: Session, days: int = 30) -> Dict[str, Any]:
    """Calculate team engagement metrics."""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get update counts by department
    engagement = db.query(
        models.TeamMember.department,
        func.count(models.Update.id).label('update_count'),
        func.count(func.distinct(models.Update.team_member_id)).label('active_members')
    )\
    .join(models.TeamMember)\
    .filter(models.Update.timestamp >= cutoff_date)\
    .group_by(models.TeamMember.department)\
    .all()
    
    return [{
        'department': dept,
        'update_count': count,
        'active_members': active,
        'engagement_score': count / active if active > 0 else 0
    } for dept, count, active in engagement]

def generate_suggested_questions(query: str, response: str) -> List[str]:
    """Generate contextually relevant follow-up questions."""
    # Check if OpenAI API key is available
    if not os.getenv("OPENAI_API_KEY"):
        # Fallback to static suggestions based on query type
        query = query.lower()
        if 'missing' in query or 'update' in query:
            return [
                "Who has the most consistent update record?",
                "What departments have the highest update rates?",
                "Are there patterns in missing updates?"
            ]
        elif 'productivity' in query or 'performance' in query:
            return [
                "How does this compare to last month?",
                "Which teams are showing improvement?",
                "What factors are driving these changes?"
            ]
        elif 'blocker' in query or 'issue' in query:
            return [
                "How long have these blockers been active?",
                "Are there common patterns in blockers?",
                "Which teams are most affected?"
            ]
        elif 'team' in query or 'department' in query:
            return [
                "What's the team's current workload?",
                "How is team engagement trending?",
                "What are the key achievements?"
            ]
        else:
            return [
                "Can you provide more details?",
                "What actions should we take?",
                "How can we improve these metrics?"
            ]

    # If OpenAI API key is available, try to use it
    try:
        client = openai.OpenAI()
        prompt = f"""
        Based on the following conversation, suggest 3-4 relevant follow-up questions.
        Make the questions specific and directly related to the context.
        
        User Query: {query}
        Assistant Response: {response}
        
        Generate questions that would help the user dive deeper into the topic
        or explore related aspects of their inquiry.
        
        Format: Return only the questions, one per line.
        """
        
        completion = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant generating follow-up questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150
        )
        
        questions = completion.choices[0].message.content.strip().split('\n')
        return [q.strip('- ') for q in questions if q.strip()]
    except Exception as e:
        logger.warning(f"Error generating questions with OpenAI: {e}")
        # Fall back to basic suggestions
        return [
            "Can you provide more details about this?",
            "What actions should we take based on this?",
            "How can we improve these metrics?"
        ]

@router.post("/copilot/query")
async def process_copilot_query(
    query: schemas.CopilotQuery,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Process natural language queries and return relevant information."""
    try:
        query_type = analyze_query(query.query, query.context)
        response = {
            'message': '',
            'metadata': {
                'type': 'insight',
                'data': None
            }
        }
        
        try:
            # Handle missing updates query
            if query_type == 'missing_updates':
                days = 7  # Default to 1 week
                missing = get_missing_updates(db, days)
                
                if not missing:
                    response['message'] = "Great news! All team members have submitted their updates this week."
                    response['metadata']['type'] = 'suggestion'
                else:
                    response['message'] = f"Found {len(missing)} team members who haven't submitted updates in the past week:\n\n"
                    for emp in missing:
                        last_update = emp['last_update'].strftime('%Y-%m-%d') if emp['last_update'] else 'Never'
                        response['message'] += f"• {emp['name']} ({emp['department']}) - Last update: {last_update}\n"
                    response['metadata']['type'] = 'alert'
                    response['metadata']['data'] = missing
            
            # Handle productivity trends query
            elif query_type == 'productivity':
                trends = get_productivity_trends(db)
                response['message'] = "Here are the productivity trends by department:\n\n"
                for dept, data in trends.items():
                    avg_score = sum(d['score'] for d in data) / len(data)
                    response['message'] += f"• {dept}: {avg_score:.1%} average productivity\n"
                response['metadata']['data'] = trends
            
            # Handle blockers query
            elif query_type == 'blockers':
                blockers = get_current_blockers(db)
                if not blockers:
                    response['message'] = "No active blockers reported across teams."
                    response['metadata']['type'] = 'suggestion'
                else:
                    response['message'] = "Current blockers across teams:\n\n"
                    for item in blockers:
                        response['message'] += f"• {item['department']} - {item['employee']}:\n"
                        for blocker in item['blockers']:
                            response['message'] += f"  - {blocker}\n"
                    response['metadata']['type'] = 'alert'
                    response['metadata']['data'] = blockers
            
            # Handle engagement query
            elif query_type == 'engagement':
                engagement = get_team_engagement(db)
                response['message'] = "Team engagement metrics:\n\n"
                for team in sorted(engagement, key=lambda x: x['engagement_score'], reverse=True):
                    response['message'] += f"• {team['department']}:\n"
                    response['message'] += f"  - Active members: {team['active_members']}\n"
                    response['message'] += f"  - Updates submitted: {team['update_count']}\n"
                    response['message'] += f"  - Engagement score: {team['engagement_score']:.1f}\n"
                response['metadata']['data'] = engagement
            
            else:
                response['message'] = "I'm not sure how to help with that query. You can ask me about:\n"
                response['message'] += "• Missing team updates (e.g., 'Who hasn't submitted updates?')\n"
                response['message'] += "• Team productivity trends (e.g., 'Show me productivity trends')\n"
                response['message'] += "• Current blockers (e.g., 'What are the current blockers?')\n"
                response['message'] += "• Team engagement (e.g., 'Which teams have high engagement?')"
                response['metadata']['type'] = 'suggestion'

        except Exception as e:
            logger.error(f"Error processing specific query type: {str(e)}")
            response['message'] = "I encountered an error while processing your specific request. "
            response['message'] += "You can try asking about:\n"
            response['message'] += "• Missing team updates\n"
            response['message'] += "• Team productivity trends\n"
            response['message'] += "• Current blockers\n"
            response['message'] += "• Team engagement metrics"
            response['metadata']['type'] = 'alert'

        # Generate suggested follow-up questions
        try:
            suggested_questions = generate_suggested_questions(query.query, response['message'])
            response['metadata']['suggestedQuestions'] = suggested_questions
        except Exception as e:
            logger.error(f"Error generating suggested questions: {str(e)}")
            response['metadata']['suggestedQuestions'] = [
                "Can you provide more details?",
                "What actions should we take?",
                "How can we improve these metrics?"
            ]
        
        return response
    
    except Exception as e:
        logger.error(f"Unexpected error in copilot query: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "An unexpected error occurred while processing your request.",
                "error": str(e)
            }
        ) 