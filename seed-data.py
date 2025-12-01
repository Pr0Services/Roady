"""
ROADY Construction - Données de démonstration
src/seeds/demo_data.py
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_demo_data(db):
    """Charge les données de démonstration"""
    
    print("🌱 Chargement des données de démo...")
    
    # ========================================================
    # COMPANY
    # ========================================================
    company = {
        "id": uuid.uuid4(),
        "name": "ROADY Construction Demo",
        "legal_name": "ROADY Construction Inc.",
        "neq": "1234567890",
        "address": "1234 Rue de la Construction",
        "city": "Montréal",
        "province": "QC",
        "postal_code": "H2X 1Y4",
        "phone": "+1 514 555-0100",
        "email": "info@roady-demo.construction",
        "website": "https://roady-demo.construction",
        "is_active": True,
    }
    
    # Insert company
    db.execute("""
        INSERT INTO companies (id, name, legal_name, neq, address, city, province, postal_code, phone, email, website, is_active)
        VALUES (:id, :name, :legal_name, :neq, :address, :city, :province, :postal_code, :phone, :email, :website, :is_active)
    """, company)
    
    print(f"  ✅ Entreprise créée: {company['name']}")
    
    # ========================================================
    # USERS
    # ========================================================
    users = [
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "email": "admin@roady-demo.construction",
            "password_hash": pwd_context.hash("Demo123!"),
            "first_name": "Admin",
            "last_name": "ROADY",
            "phone": "+1 514 555-0101",
            "role": "admin",
            "is_active": True,
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "email": "directeur@roady-demo.construction",
            "password_hash": pwd_context.hash("Demo123!"),
            "first_name": "Marc",
            "last_name": "Tremblay",
            "phone": "+1 514 555-0102",
            "role": "directeur",
            "is_active": True,
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "email": "chef@roady-demo.construction",
            "password_hash": pwd_context.hash("Demo123!"),
            "first_name": "Julie",
            "last_name": "Côté",
            "phone": "+1 514 555-0103",
            "role": "chef_projet",
            "is_active": True,
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "email": "superviseur@roady-demo.construction",
            "password_hash": pwd_context.hash("Demo123!"),
            "first_name": "Pierre",
            "last_name": "Gagnon",
            "phone": "+1 514 555-0104",
            "role": "superviseur",
            "is_active": True,
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "email": "technicien@roady-demo.construction",
            "password_hash": pwd_context.hash("Demo123!"),
            "first_name": "Sophie",
            "last_name": "Martin",
            "phone": "+1 514 555-0105",
            "role": "technicien",
            "is_active": True,
            "is_verified": True,
        },
    ]
    
    for user in users:
        db.execute("""
            INSERT INTO users (id, company_id, email, password_hash, first_name, last_name, phone, role, is_active, is_verified)
            VALUES (:id, :company_id, :email, :password_hash, :first_name, :last_name, :phone, :role, :is_active, :is_verified)
        """, user)
    
    print(f"  ✅ {len(users)} utilisateurs créés")
    
    # ========================================================
    # PROJECTS
    # ========================================================
    projects = [
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "code": "PRJ-2025-001",
            "name": "Tour Centrale - Phase 1",
            "description": "Construction d'une tour résidentielle de 25 étages au centre-ville",
            "client_name": "Groupe Immobilier Centrale",
            "address": "500 Boulevard René-Lévesque",
            "city": "Montréal",
            "status": "active",
            "start_date": date.today() - timedelta(days=90),
            "end_date": date.today() + timedelta(days=365),
            "budget_total": Decimal("15000000.00"),
            "budget_spent": Decimal("4500000.00"),
            "progress_percent": 30,
            "manager_id": users[1]["id"],  # Marc Tremblay
        },
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "code": "PRJ-2025-002",
            "name": "Centre Commercial Nord",
            "description": "Rénovation et agrandissement du centre commercial",
            "client_name": "Gestion Nord Inc.",
            "address": "2000 Boulevard Laurentien",
            "city": "Laval",
            "status": "active",
            "start_date": date.today() - timedelta(days=45),
            "end_date": date.today() + timedelta(days=180),
            "budget_total": Decimal("8500000.00"),
            "budget_spent": Decimal("2100000.00"),
            "progress_percent": 25,
            "manager_id": users[2]["id"],  # Julie Côté
        },
        {
            "id": uuid.uuid4(),
            "company_id": company["id"],
            "code": "PRJ-2025-003",
            "name": "Résidence Émeraude",
            "description": "Construction de 45 unités de condos de luxe",
            "client_name": "Développements Émeraude",
            "address": "150 Rue Saint-Paul",
            "city": "Montréal",
            "status": "planning",
            "start_date": date.today() + timedelta(days=30),
            "end_date": date.today() + timedelta(days=540),
            "budget_total": Decimal("22000000.00"),
            "budget_spent": Decimal("0.00"),
            "progress_percent": 0,
            "manager_id": users[1]["id"],
        },
    ]
    
    for project in projects:
        db.execute("""
            INSERT INTO projects (id, company_id, code, name, description, client_name, address, city, status, start_date, end_date, budget_total, budget_spent, progress_percent, manager_id)
            VALUES (:id, :company_id, :code, :name, :description, :client_name, :address, :city, :status, :start_date, :end_date, :budget_total, :budget_spent, :progress_percent, :manager_id)
        """, project)
    
    print(f"  ✅ {len(projects)} projets créés")
    
    # ========================================================
    # TASKS
    # ========================================================
    tasks = [
        # Tour Centrale
        {
            "id": uuid.uuid4(),
            "project_id": projects[0]["id"],
            "code": "T-001",
            "title": "Excavation fondations",
            "description": "Excavation complète pour les fondations de la tour",
            "status": "completed",
            "priority": "high",
            "assignee_id": users[3]["id"],
            "zone": "Zone A",
            "estimated_hours": Decimal("240"),
            "actual_hours": Decimal("256"),
            "due_date": date.today() - timedelta(days=60),
            "completed_at": datetime.now() - timedelta(days=58),
            "progress_percent": 100,
        },
        {
            "id": uuid.uuid4(),
            "project_id": projects[0]["id"],
            "code": "T-002",
            "title": "Coulage béton fondations",
            "description": "Coulage du béton pour les fondations",
            "status": "completed",
            "priority": "high",
            "assignee_id": users[3]["id"],
            "zone": "Zone A",
            "estimated_hours": Decimal("160"),
            "actual_hours": Decimal("168"),
            "due_date": date.today() - timedelta(days=45),
            "completed_at": datetime.now() - timedelta(days=44),
            "progress_percent": 100,
        },
        {
            "id": uuid.uuid4(),
            "project_id": projects[0]["id"],
            "code": "T-003",
            "title": "Structure acier - Niveaux 1-5",
            "description": "Installation de la structure d'acier pour les 5 premiers niveaux",
            "status": "in_progress",
            "priority": "high",
            "assignee_id": users[4]["id"],
            "zone": "Zone B",
            "estimated_hours": Decimal("400"),
            "actual_hours": Decimal("280"),
            "due_date": date.today() + timedelta(days=14),
            "progress_percent": 70,
        },
        {
            "id": uuid.uuid4(),
            "project_id": projects[0]["id"],
            "code": "T-004",
            "title": "Plomberie - Niveau 1",
            "description": "Installation plomberie complète niveau 1",
            "status": "todo",
            "priority": "medium",
            "assignee_id": users[4]["id"],
            "zone": "Zone B - Niveau 1",
            "estimated_hours": Decimal("80"),
            "due_date": date.today() + timedelta(days=30),
            "progress_percent": 0,
        },
        {
            "id": uuid.uuid4(),
            "project_id": projects[0]["id"],
            "code": "T-005",
            "title": "Électricité - Niveau 1",
            "description": "Installation électrique complète niveau 1",
            "status": "backlog",
            "priority": "medium",
            "zone": "Zone B - Niveau 1",
            "estimated_hours": Decimal("120"),
            "due_date": date.today() + timedelta(days=45),
            "progress_percent": 0,
        },
        # Centre Commercial
        {
            "id": uuid.uuid4(),
            "project_id": projects[1]["id"],
            "code": "T-101",
            "title": "Démolition section est",
            "description": "Démolition de l'ancienne section est du centre",
            "status": "in_progress",
            "priority": "urgent",
            "assignee_id": users[3]["id"],
            "zone": "Section Est",
            "estimated_hours": Decimal("200"),
            "actual_hours": Decimal("120"),
            "due_date": date.today() + timedelta(days=7),
            "progress_percent": 60,
        },
        {
            "id": uuid.uuid4(),
            "project_id": projects[1]["id"],
            "code": "T-102",
            "title": "Nouvelle entrée principale",
            "description": "Construction de la nouvelle entrée principale",
            "status": "todo",
            "priority": "high",
            "zone": "Entrée Nord",
            "estimated_hours": Decimal("320"),
            "due_date": date.today() + timedelta(days=60),
            "progress_percent": 0,
        },
    ]
    
    for task in tasks:
        db.execute("""
            INSERT INTO tasks (id, project_id, code, title, description, status, priority, assignee_id, zone, estimated_hours, actual_hours, due_date, completed_at, progress_percent)
            VALUES (:id, :project_id, :code, :title, :description, :status, :priority, :assignee_id, :zone, :estimated_hours, :actual_hours, :due_date, :completed_at, :progress_percent)
        """, task)
    
    print(f"  ✅ {len(tasks)} tâches créées")
    
    # ========================================================
    # NOTIFICATIONS
    # ========================================================
    notifications = [
        {
            "id": uuid.uuid4(),
            "user_id": users[2]["id"],
            "type": "task_assigned",
            "title": "Nouvelle tâche assignée",
            "body": "La tâche 'Structure acier - Niveaux 1-5' vous a été assignée",
            "action_url": "/projects/PRJ-2025-001/tasks/T-003",
            "is_read": False,
        },
        {
            "id": uuid.uuid4(),
            "user_id": users[1]["id"],
            "type": "project_milestone",
            "title": "Jalon atteint!",
            "body": "Le projet Tour Centrale a atteint 30% de progression",
            "action_url": "/projects/PRJ-2025-001",
            "is_read": True,
        },
        {
            "id": uuid.uuid4(),
            "user_id": users[3]["id"],
            "type": "task_completed",
            "title": "Tâche complétée",
            "body": "La tâche 'Excavation fondations' a été marquée comme terminée",
            "is_read": True,
        },
    ]
    
    for notif in notifications:
        db.execute("""
            INSERT INTO notifications (id, user_id, type, title, body, action_url, is_read)
            VALUES (:id, :user_id, :type, :title, :body, :action_url, :is_read)
        """, notif)
    
    print(f"  ✅ {len(notifications)} notifications créées")
    
    # Commit
    db.commit()
    
    print("")
    print("=" * 50)
    print("🎉 Données de démo chargées avec succès!")
    print("=" * 50)
    print("")
    print("👤 Comptes de test disponibles:")
    print("   ┌─────────────────────────────────────────────────┐")
    print("   │ Email                              │ Mot de passe│")
    print("   ├─────────────────────────────────────────────────┤")
    print("   │ admin@roady-demo.construction      │ Demo123!    │")
    print("   │ directeur@roady-demo.construction  │ Demo123!    │")
    print("   │ chef@roady-demo.construction       │ Demo123!    │")
    print("   │ superviseur@roady-demo.construction│ Demo123!    │")
    print("   │ technicien@roady-demo.construction │ Demo123!    │")
    print("   └─────────────────────────────────────────────────┘")
    print("")
