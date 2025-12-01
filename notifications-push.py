"""
ROADY Construction - Système de Notifications Push
Firebase Cloud Messaging (FCM) + WebSockets temps réel
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
import firebase_admin
from firebase_admin import credentials, messaging
import asyncio
import json

# ============================================================
# CONFIGURATION FIREBASE
# ============================================================

class FirebaseConfig:
    PROJECT_ID = "roady-construction"
    SERVICE_ACCOUNT_PATH = "firebase-service-account.json"
    
    # Initialisation Firebase Admin SDK
    @classmethod
    def initialize(cls):
        if not firebase_admin._apps:
            cred = credentials.Certificate(cls.SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred, {
                'projectId': cls.PROJECT_ID
            })

# ============================================================
# ENUMS & MODÈLES
# ============================================================

class NotificationType(str, Enum):
    # Projets
    PROJECT_CREATED = "project_created"
    PROJECT_UPDATED = "project_updated"
    PROJECT_MILESTONE = "project_milestone"
    PROJECT_DELAYED = "project_delayed"
    
    # Tâches
    TASK_ASSIGNED = "task_assigned"
    TASK_COMPLETED = "task_completed"
    TASK_OVERDUE = "task_overdue"
    TASK_COMMENT = "task_comment"
    
    # RFI
    RFI_CREATED = "rfi_created"
    RFI_RESPONSE = "rfi_response"
    RFI_CLOSED = "rfi_closed"
    RFI_URGENT = "rfi_urgent"
    
    # Rapports
    REPORT_SUBMITTED = "report_submitted"
    REPORT_APPROVED = "report_approved"
    REPORT_REJECTED = "report_rejected"
    
    # SST (Santé Sécurité)
    SST_INCIDENT = "sst_incident"
    SST_INSPECTION = "sst_inspection"
    SST_ALERT = "sst_alert"
    
    # Finances
    BUDGET_ALERT = "budget_alert"
    INVOICE_DUE = "invoice_due"
    PAYMENT_RECEIVED = "payment_received"
    
    # Système
    SYSTEM_MAINTENANCE = "system_maintenance"
    SYSTEM_UPDATE = "system_update"

class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class NotificationChannel(str, Enum):
    PUSH = "push"           # Mobile push
    WEB = "web"             # Browser push
    IN_APP = "in_app"       # Notification in-app
    EMAIL = "email"         # Email
    SMS = "sms"             # SMS
    WEBSOCKET = "websocket" # Temps réel

# Configuration par type de notification
NOTIFICATION_CONFIG: Dict[NotificationType, Dict] = {
    NotificationType.SST_INCIDENT: {
        "priority": NotificationPriority.URGENT,
        "channels": [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.WEBSOCKET],
        "icon": "🚨",
        "sound": "emergency",
        "vibrate": True
    },
    NotificationType.TASK_ASSIGNED: {
        "priority": NotificationPriority.HIGH,
        "channels": [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        "icon": "📋",
        "sound": "default"
    },
    NotificationType.RFI_URGENT: {
        "priority": NotificationPriority.URGENT,
        "channels": [NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET],
        "icon": "❗",
        "sound": "urgent"
    },
    NotificationType.PROJECT_MILESTONE: {
        "priority": NotificationPriority.NORMAL,
        "channels": [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        "icon": "🎯",
        "sound": "success"
    },
    NotificationType.BUDGET_ALERT: {
        "priority": NotificationPriority.HIGH,
        "channels": [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        "icon": "💰",
        "sound": "alert"
    },
    # ... config pour autres types
}

# ============================================================
# MODÈLES PYDANTIC
# ============================================================

class NotificationPayload(BaseModel):
    type: NotificationType
    title: str
    body: str
    data: Dict[str, Any] = {}
    image_url: Optional[str] = None
    action_url: Optional[str] = None
    
class NotificationCreate(BaseModel):
    recipient_ids: List[str]
    payload: NotificationPayload
    priority: Optional[NotificationPriority] = None
    channels: Optional[List[NotificationChannel]] = None
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
class NotificationInDB(BaseModel):
    id: str
    recipient_id: str
    payload: NotificationPayload
    priority: NotificationPriority
    channels: List[NotificationChannel]
    created_at: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    status: str = "pending"  # pending, sent, delivered, read, failed

class DeviceToken(BaseModel):
    user_id: str
    token: str
    platform: str  # ios, android, web
    device_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None

class NotificationPreferences(BaseModel):
    user_id: str
    enabled: bool = True
    quiet_hours_start: Optional[str] = None  # "22:00"
    quiet_hours_end: Optional[str] = None    # "07:00"
    channels: Dict[NotificationChannel, bool] = {
        NotificationChannel.PUSH: True,
        NotificationChannel.EMAIL: True,
        NotificationChannel.SMS: False,
        NotificationChannel.IN_APP: True,
    }
    types: Dict[NotificationType, bool] = {}  # Override par type
    
# ============================================================
# WEBSOCKET MANAGER (Temps réel)
# ============================================================

class ConnectionManager:
    """Gère les connexions WebSocket pour les notifications temps réel"""
    
    def __init__(self):
        # user_id -> list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"✅ User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"❌ User {user_id} disconnected")
    
    async def send_to_user(self, user_id: str, message: dict):
        """Envoie un message à toutes les connexions d'un utilisateur"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending to {user_id}: {e}")
    
    async def broadcast_to_users(self, user_ids: List[str], message: dict):
        """Envoie un message à plusieurs utilisateurs"""
        for user_id in user_ids:
            await self.send_to_user(user_id, message)
    
    async def broadcast_all(self, message: dict):
        """Envoie un message à tous les utilisateurs connectés"""
        for user_id in self.active_connections:
            await self.send_to_user(user_id, message)

manager = ConnectionManager()

# ============================================================
# SERVICE DE NOTIFICATIONS
# ============================================================

class NotificationService:
    def __init__(self):
        FirebaseConfig.initialize()
    
    # ---- Firebase Push Notifications ----
    
    async def send_push_notification(
        self,
        tokens: List[str],
        payload: NotificationPayload,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Dict[str, Any]:
        """Envoie une notification push via Firebase"""
        
        config = NOTIFICATION_CONFIG.get(payload.type, {})
        icon = config.get("icon", "🔔")
        sound = config.get("sound", "default")
        
        # Construction du message Firebase
        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=f"{icon} {payload.title}",
                body=payload.body,
                image=payload.image_url
            ),
            data={
                "type": payload.type.value,
                "action_url": payload.action_url or "",
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                **{k: str(v) for k, v in payload.data.items()}
            },
            android=messaging.AndroidConfig(
                priority="high" if priority in [NotificationPriority.HIGH, NotificationPriority.URGENT] else "normal",
                notification=messaging.AndroidNotification(
                    icon="ic_notification",
                    color="#3B82F6",
                    sound=sound,
                    channel_id=f"roady_{priority.value}"
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound=f"{sound}.wav",
                        badge=1,
                        content_available=True
                    )
                )
            ),
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon="/icons/notification-icon.png",
                    badge="/icons/badge-icon.png",
                    vibrate=[200, 100, 200] if config.get("vibrate") else None
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=payload.action_url
                )
            )
        )
        
        # Envoi
        response = messaging.send_multicast(message)
        
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count,
            "responses": [
                {"success": r.success, "message_id": r.message_id, "error": str(r.exception) if r.exception else None}
                for r in response.responses
            ]
        }
    
    # ---- WebSocket Temps Réel ----
    
    async def send_realtime_notification(
        self,
        user_ids: List[str],
        payload: NotificationPayload
    ):
        """Envoie une notification en temps réel via WebSocket"""
        message = {
            "type": "notification",
            "payload": {
                "id": f"notif_{datetime.utcnow().timestamp()}",
                "notification_type": payload.type.value,
                "title": payload.title,
                "body": payload.body,
                "data": payload.data,
                "action_url": payload.action_url,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await manager.broadcast_to_users(user_ids, message)
    
    # ---- Notification Orchestrator ----
    
    async def send_notification(
        self,
        notification: NotificationCreate,
        background_tasks: BackgroundTasks = None
    ) -> Dict[str, Any]:
        """Orchestre l'envoi de notifications sur tous les canaux configurés"""
        
        # Déterminer la config
        config = NOTIFICATION_CONFIG.get(notification.payload.type, {})
        priority = notification.priority or config.get("priority", NotificationPriority.NORMAL)
        channels = notification.channels or config.get("channels", [NotificationChannel.IN_APP])
        
        results = {"channels": {}}
        
        for channel in channels:
            if channel == NotificationChannel.PUSH:
                # Récupérer les tokens des utilisateurs
                tokens = await self._get_user_tokens(notification.recipient_ids)
                if tokens:
                    result = await self.send_push_notification(tokens, notification.payload, priority)
                    results["channels"]["push"] = result
            
            elif channel == NotificationChannel.WEBSOCKET:
                await self.send_realtime_notification(notification.recipient_ids, notification.payload)
                results["channels"]["websocket"] = {"sent": True}
            
            elif channel == NotificationChannel.EMAIL:
                # Envoi email en arrière-plan
                if background_tasks:
                    background_tasks.add_task(
                        self._send_email_notification,
                        notification.recipient_ids,
                        notification.payload
                    )
                results["channels"]["email"] = {"queued": True}
            
            elif channel == NotificationChannel.SMS:
                # Envoi SMS pour notifications urgentes
                if priority == NotificationPriority.URGENT:
                    if background_tasks:
                        background_tasks.add_task(
                            self._send_sms_notification,
                            notification.recipient_ids,
                            notification.payload
                        )
                    results["channels"]["sms"] = {"queued": True}
            
            elif channel == NotificationChannel.IN_APP:
                # Sauvegarder en DB pour affichage in-app
                await self._save_notifications(notification)
                results["channels"]["in_app"] = {"saved": True}
        
        return results
    
    # ---- Helpers ----
    
    async def _get_user_tokens(self, user_ids: List[str]) -> List[str]:
        """Récupère les tokens FCM des utilisateurs"""
        # Implémentation DB
        pass
    
    async def _send_email_notification(self, user_ids: List[str], payload: NotificationPayload):
        """Envoie notification par email"""
        # Implémentation email (SendGrid, SES, etc.)
        pass
    
    async def _send_sms_notification(self, user_ids: List[str], payload: NotificationPayload):
        """Envoie notification par SMS"""
        # Implémentation SMS (Twilio, etc.)
        pass
    
    async def _save_notifications(self, notification: NotificationCreate):
        """Sauvegarde les notifications en DB"""
        # Implémentation DB
        pass

notification_service = NotificationService()

# ============================================================
# API ROUTES
# ============================================================

app = FastAPI(title="ROADY Notifications API")

# ---- WebSocket Endpoint ----

@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket pour notifications temps réel"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Garder la connexion vivante
            data = await websocket.receive_text()
            
            # Traiter les messages entrants (acknowledgment, etc.)
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            elif data.startswith("ack:"):
                notif_id = data.split(":")[1]
                await mark_notification_read(user_id, notif_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# ---- REST Endpoints ----

@app.post("/notifications/send")
async def send_notification(
    notification: NotificationCreate,
    background_tasks: BackgroundTasks
):
    """Envoie une notification"""
    result = await notification_service.send_notification(notification, background_tasks)
    return {"success": True, "result": result}

@app.post("/notifications/broadcast")
async def broadcast_notification(
    payload: NotificationPayload,
    project_id: Optional[str] = None,
    role: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """Broadcast une notification à un groupe"""
    # Récupérer les utilisateurs selon les critères
    user_ids = await get_users_by_criteria(project_id=project_id, role=role)
    
    notification = NotificationCreate(
        recipient_ids=user_ids,
        payload=payload
    )
    
    result = await notification_service.send_notification(notification, background_tasks)
    return {"success": True, "recipients": len(user_ids), "result": result}

@app.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0
):
    """Récupère les notifications d'un utilisateur"""
    notifications = await get_notifications_from_db(user_id, unread_only, limit, offset)
    unread_count = await get_unread_count(user_id)
    return {"notifications": notifications, "unread_count": unread_count}

@app.post("/notifications/{notification_id}/read")
async def mark_as_read(notification_id: str, user_id: str):
    """Marque une notification comme lue"""
    await mark_notification_read(user_id, notification_id)
    return {"success": True}

@app.post("/notifications/read-all")
async def mark_all_as_read(user_id: str):
    """Marque toutes les notifications comme lues"""
    count = await mark_all_notifications_read(user_id)
    return {"success": True, "count": count}

@app.post("/devices/register")
async def register_device(device: DeviceToken):
    """Enregistre un device pour les notifications push"""
    await save_device_token(device)
    return {"success": True}

@app.delete("/devices/{token}")
async def unregister_device(token: str, user_id: str):
    """Désenregistre un device"""
    await delete_device_token(user_id, token)
    return {"success": True}

@app.get("/notifications/preferences/{user_id}")
async def get_preferences(user_id: str):
    """Récupère les préférences de notification"""
    prefs = await get_notification_preferences(user_id)
    return prefs

@app.put("/notifications/preferences/{user_id}")
async def update_preferences(user_id: str, prefs: NotificationPreferences):
    """Met à jour les préférences de notification"""
    await save_notification_preferences(prefs)
    return {"success": True}

# ============================================================
# TRIGGERS DE NOTIFICATIONS (Intégration métier)
# ============================================================

class NotificationTriggers:
    """Déclenche les notifications depuis les événements métier"""
    
    @staticmethod
    async def on_task_assigned(task_id: str, assignee_id: str, assigner_name: str, task_title: str, project_name: str):
        """Déclenché quand une tâche est assignée"""
        await notification_service.send_notification(NotificationCreate(
            recipient_ids=[assignee_id],
            payload=NotificationPayload(
                type=NotificationType.TASK_ASSIGNED,
                title="Nouvelle tâche assignée",
                body=f"{assigner_name} vous a assigné: {task_title}",
                data={"task_id": task_id, "project": project_name},
                action_url=f"/projects/{project_name}/tasks/{task_id}"
            )
        ))
    
    @staticmethod
    async def on_rfi_response(rfi_id: str, requester_id: str, responder_name: str, rfi_title: str):
        """Déclenché quand un RFI reçoit une réponse"""
        await notification_service.send_notification(NotificationCreate(
            recipient_ids=[requester_id],
            payload=NotificationPayload(
                type=NotificationType.RFI_RESPONSE,
                title="Réponse à votre RFI",
                body=f"{responder_name} a répondu à: {rfi_title}",
                data={"rfi_id": rfi_id},
                action_url=f"/rfis/{rfi_id}"
            )
        ))
    
    @staticmethod
    async def on_sst_incident(incident_id: str, project_id: str, project_name: str, severity: str, description: str):
        """Déclenché lors d'un incident SST"""
        # Récupérer tous les responsables SST du projet
        recipients = await get_project_sst_managers(project_id)
        
        await notification_service.send_notification(NotificationCreate(
            recipient_ids=recipients,
            payload=NotificationPayload(
                type=NotificationType.SST_INCIDENT,
                title=f"🚨 INCIDENT SST - {severity.upper()}",
                body=f"Projet {project_name}: {description}",
                data={"incident_id": incident_id, "project_id": project_id, "severity": severity},
                action_url=f"/sst/incidents/{incident_id}"
            ),
            priority=NotificationPriority.URGENT,
            channels=[NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.WEBSOCKET]
        ))
    
    @staticmethod
    async def on_budget_threshold(project_id: str, project_name: str, percentage: int, amount_remaining: float):
        """Déclenché quand le budget atteint un seuil"""
        recipients = await get_project_managers(project_id)
        
        await notification_service.send_notification(NotificationCreate(
            recipient_ids=recipients,
            payload=NotificationPayload(
                type=NotificationType.BUDGET_ALERT,
                title="⚠️ Alerte Budget",
                body=f"{project_name}: {percentage}% du budget utilisé. Reste: {amount_remaining:,.0f}$",
                data={"project_id": project_id, "percentage": percentage},
                action_url=f"/projects/{project_id}/finances"
            ),
            priority=NotificationPriority.HIGH
        ))

# ============================================================
# FONCTIONS DB (À IMPLÉMENTER)
# ============================================================

async def get_notifications_from_db(user_id: str, unread_only: bool, limit: int, offset: int) -> List[NotificationInDB]:
    pass

async def get_unread_count(user_id: str) -> int:
    pass

async def mark_notification_read(user_id: str, notification_id: str):
    pass

async def mark_all_notifications_read(user_id: str) -> int:
    pass

async def save_device_token(device: DeviceToken):
    pass

async def delete_device_token(user_id: str, token: str):
    pass

async def get_notification_preferences(user_id: str) -> NotificationPreferences:
    pass

async def save_notification_preferences(prefs: NotificationPreferences):
    pass

async def get_users_by_criteria(project_id: str = None, role: str = None) -> List[str]:
    pass

async def get_project_sst_managers(project_id: str) -> List[str]:
    pass

async def get_project_managers(project_id: str) -> List[str]:
    pass
