"""
ROADY Construction - Module Facturation & Abonnements
Intégration Stripe complète avec plans, factures, et paiements
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from decimal import Decimal
import stripe
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
import json

# ============================================
# CONFIGURATION
# ============================================

class BillingConfig:
    STRIPE_SECRET_KEY = "sk_test_..."
    STRIPE_WEBHOOK_SECRET = "whsec_..."
    STRIPE_PUBLISHABLE_KEY = "pk_test_..."
    
    # Plans
    TRIAL_DAYS = 14
    GRACE_PERIOD_DAYS = 7
    
    # Taxes (Quebec + Canada)
    TPS_RATE = Decimal("0.05")  # 5% TPS
    TVQ_RATE = Decimal("0.09975")  # 9.975% TVQ
    
    # URLs
    SUCCESS_URL = "https://roady.app/billing/success"
    CANCEL_URL = "https://roady.app/billing/cancel"
    PORTAL_RETURN_URL = "https://roady.app/settings/billing"

stripe.api_key = BillingConfig.STRIPE_SECRET_KEY

# ============================================
# PLANS & PRICING
# ============================================

class PlanTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class BillingInterval(str, Enum):
    MONTHLY = "month"
    YEARLY = "year"

@dataclass
class PlanFeatures:
    projects: int  # -1 = unlimited
    users: int
    storage_gb: int
    agents_included: bool
    calculators: bool
    reports: bool
    api_access: bool
    priority_support: bool
    custom_branding: bool
    sso: bool
    audit_logs: bool

PLAN_FEATURES: Dict[PlanTier, PlanFeatures] = {
    PlanTier.FREE: PlanFeatures(
        projects=2, users=1, storage_gb=1,
        agents_included=False, calculators=True, reports=False,
        api_access=False, priority_support=False, custom_branding=False,
        sso=False, audit_logs=False
    ),
    PlanTier.STARTER: PlanFeatures(
        projects=10, users=5, storage_gb=10,
        agents_included=True, calculators=True, reports=True,
        api_access=False, priority_support=False, custom_branding=False,
        sso=False, audit_logs=False
    ),
    PlanTier.PROFESSIONAL: PlanFeatures(
        projects=50, users=25, storage_gb=100,
        agents_included=True, calculators=True, reports=True,
        api_access=True, priority_support=True, custom_branding=True,
        sso=False, audit_logs=True
    ),
    PlanTier.ENTERPRISE: PlanFeatures(
        projects=-1, users=-1, storage_gb=-1,
        agents_included=True, calculators=True, reports=True,
        api_access=True, priority_support=True, custom_branding=True,
        sso=True, audit_logs=True
    ),
}

@dataclass
class PlanPricing:
    tier: PlanTier
    name_fr: str
    name_en: str
    description_fr: str
    description_en: str
    monthly_price: Decimal
    yearly_price: Decimal
    stripe_monthly_price_id: str
    stripe_yearly_price_id: str
    features: PlanFeatures

PLANS: Dict[PlanTier, PlanPricing] = {
    PlanTier.FREE: PlanPricing(
        tier=PlanTier.FREE,
        name_fr="Gratuit", name_en="Free",
        description_fr="Pour démarrer", description_en="To get started",
        monthly_price=Decimal("0"), yearly_price=Decimal("0"),
        stripe_monthly_price_id="", stripe_yearly_price_id="",
        features=PLAN_FEATURES[PlanTier.FREE]
    ),
    PlanTier.STARTER: PlanPricing(
        tier=PlanTier.STARTER,
        name_fr="Démarrage", name_en="Starter",
        description_fr="Pour les petites équipes", description_en="For small teams",
        monthly_price=Decimal("49.00"), yearly_price=Decimal("470.00"),
        stripe_monthly_price_id="price_starter_monthly",
        stripe_yearly_price_id="price_starter_yearly",
        features=PLAN_FEATURES[PlanTier.STARTER]
    ),
    PlanTier.PROFESSIONAL: PlanPricing(
        tier=PlanTier.PROFESSIONAL,
        name_fr="Professionnel", name_en="Professional",
        description_fr="Pour les équipes en croissance", description_en="For growing teams",
        monthly_price=Decimal("149.00"), yearly_price=Decimal("1430.00"),
        stripe_monthly_price_id="price_pro_monthly",
        stripe_yearly_price_id="price_pro_yearly",
        features=PLAN_FEATURES[PlanTier.PROFESSIONAL]
    ),
    PlanTier.ENTERPRISE: PlanPricing(
        tier=PlanTier.ENTERPRISE,
        name_fr="Entreprise", name_en="Enterprise",
        description_fr="Solutions sur mesure", description_en="Custom solutions",
        monthly_price=Decimal("499.00"), yearly_price=Decimal("4790.00"),
        stripe_monthly_price_id="price_enterprise_monthly",
        stripe_yearly_price_id="price_enterprise_yearly",
        features=PLAN_FEATURES[PlanTier.ENTERPRISE]
    ),
}

# ============================================
# MODELS
# ============================================

class SubscriptionStatus(str, Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    INCOMPLETE = "incomplete"

@dataclass
class Subscription:
    id: str
    company_id: str
    stripe_subscription_id: str
    stripe_customer_id: str
    plan_tier: PlanTier
    billing_interval: BillingInterval
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    trial_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

@dataclass
class Invoice:
    id: str
    company_id: str
    stripe_invoice_id: str
    amount_subtotal: Decimal
    amount_tax: Decimal
    amount_total: Decimal
    currency: str
    status: str
    invoice_pdf: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]

@dataclass
class PaymentMethod:
    id: str
    stripe_payment_method_id: str
    type: str  # card, bank_transfer, etc.
    card_brand: Optional[str]
    card_last4: Optional[str]
    card_exp_month: Optional[int]
    card_exp_year: Optional[int]
    is_default: bool

# ============================================
# BILLING SERVICE
# ============================================

class BillingService:
    def __init__(self, db):
        self.db = db
    
    # Customer Management
    async def get_or_create_customer(self, company_id: str, email: str, name: str) -> str:
        """Get existing or create new Stripe customer"""
        # Check if customer exists
        existing = await self.db.get_stripe_customer(company_id)
        if existing:
            return existing
        
        # Create new customer
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={"company_id": company_id}
        )
        
        await self.db.save_stripe_customer(company_id, customer.id)
        return customer.id
    
    # Subscription Management
    async def create_checkout_session(
        self,
        company_id: str,
        plan_tier: PlanTier,
        billing_interval: BillingInterval,
        customer_id: str
    ) -> str:
        """Create Stripe Checkout session for subscription"""
        plan = PLANS[plan_tier]
        price_id = (plan.stripe_monthly_price_id if billing_interval == BillingInterval.MONTHLY 
                    else plan.stripe_yearly_price_id)
        
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{BillingConfig.SUCCESS_URL}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=BillingConfig.CANCEL_URL,
            subscription_data={
                "trial_period_days": BillingConfig.TRIAL_DAYS,
                "metadata": {"company_id": company_id}
            },
            automatic_tax={"enabled": True},
            tax_id_collection={"enabled": True},
            metadata={"company_id": company_id, "plan_tier": plan_tier.value}
        )
        
        return session.url
    
    async def create_portal_session(self, customer_id: str) -> str:
        """Create Stripe Customer Portal session"""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=BillingConfig.PORTAL_RETURN_URL
        )
        return session.url
    
    async def change_plan(
        self,
        subscription_id: str,
        new_plan_tier: PlanTier,
        billing_interval: BillingInterval
    ) -> Subscription:
        """Change subscription plan"""
        plan = PLANS[new_plan_tier]
        price_id = (plan.stripe_monthly_price_id if billing_interval == BillingInterval.MONTHLY 
                    else plan.stripe_yearly_price_id)
        
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0].id,
                "price": price_id
            }],
            proration_behavior="create_prorations"
        )
        
        return await self.sync_subscription(subscription_id)
    
    async def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> Subscription:
        """Cancel subscription"""
        if at_period_end:
            stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
        else:
            stripe.Subscription.delete(subscription_id)
        
        return await self.sync_subscription(subscription_id)
    
    async def reactivate_subscription(self, subscription_id: str) -> Subscription:
        """Reactivate canceled subscription"""
        stripe.Subscription.modify(subscription_id, cancel_at_period_end=False)
        return await self.sync_subscription(subscription_id)
    
    # Invoice Management
    async def get_invoices(self, customer_id: str, limit: int = 10) -> List[Invoice]:
        """Get customer invoices"""
        invoices = stripe.Invoice.list(customer=customer_id, limit=limit)
        return [self._parse_invoice(inv) for inv in invoices.data]
    
    async def get_upcoming_invoice(self, customer_id: str) -> Optional[Dict]:
        """Get upcoming invoice preview"""
        try:
            invoice = stripe.Invoice.upcoming(customer=customer_id)
            return {
                "amount_subtotal": invoice.subtotal / 100,
                "amount_tax": invoice.tax / 100 if invoice.tax else 0,
                "amount_total": invoice.total / 100,
                "period_start": datetime.fromtimestamp(invoice.period_start),
                "period_end": datetime.fromtimestamp(invoice.period_end),
                "lines": [
                    {"description": line.description, "amount": line.amount / 100}
                    for line in invoice.lines.data
                ]
            }
        except stripe.error.InvalidRequestError:
            return None
    
    # Payment Methods
    async def get_payment_methods(self, customer_id: str) -> List[PaymentMethod]:
        """Get customer payment methods"""
        methods = stripe.PaymentMethod.list(customer=customer_id, type="card")
        customer = stripe.Customer.retrieve(customer_id)
        default_pm = customer.invoice_settings.default_payment_method
        
        return [
            PaymentMethod(
                id=pm.id,
                stripe_payment_method_id=pm.id,
                type=pm.type,
                card_brand=pm.card.brand if pm.card else None,
                card_last4=pm.card.last4 if pm.card else None,
                card_exp_month=pm.card.exp_month if pm.card else None,
                card_exp_year=pm.card.exp_year if pm.card else None,
                is_default=pm.id == default_pm
            )
            for pm in methods.data
        ]
    
    async def set_default_payment_method(self, customer_id: str, payment_method_id: str):
        """Set default payment method"""
        stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id}
        )
    
    # Webhook Handlers
    async def handle_webhook(self, payload: bytes, sig_header: str) -> Dict:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, BillingConfig.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        handlers = {
            "checkout.session.completed": self._handle_checkout_completed,
            "customer.subscription.created": self._handle_subscription_created,
            "customer.subscription.updated": self._handle_subscription_updated,
            "customer.subscription.deleted": self._handle_subscription_deleted,
            "invoice.paid": self._handle_invoice_paid,
            "invoice.payment_failed": self._handle_payment_failed,
        }
        
        handler = handlers.get(event.type)
        if handler:
            await handler(event.data.object)
        
        return {"status": "success", "event": event.type}
    
    async def _handle_checkout_completed(self, session):
        company_id = session.metadata.get("company_id")
        if session.subscription:
            await self.sync_subscription(session.subscription)
    
    async def _handle_subscription_created(self, subscription):
        await self.sync_subscription(subscription.id)
    
    async def _handle_subscription_updated(self, subscription):
        await self.sync_subscription(subscription.id)
    
    async def _handle_subscription_deleted(self, subscription):
        company_id = subscription.metadata.get("company_id")
        await self.db.update_subscription_status(company_id, SubscriptionStatus.CANCELED)
    
    async def _handle_invoice_paid(self, invoice):
        company_id = invoice.metadata.get("company_id") if invoice.metadata else None
        await self.db.save_invoice(self._parse_invoice(invoice))
    
    async def _handle_payment_failed(self, invoice):
        company_id = invoice.metadata.get("company_id") if invoice.metadata else None
        # Send notification, update status, etc.
    
    # Helpers
    async def sync_subscription(self, subscription_id: str) -> Subscription:
        """Sync subscription from Stripe"""
        sub = stripe.Subscription.retrieve(subscription_id)
        
        subscription = Subscription(
            id=sub.id,
            company_id=sub.metadata.get("company_id", ""),
            stripe_subscription_id=sub.id,
            stripe_customer_id=sub.customer,
            plan_tier=PlanTier(sub.metadata.get("plan_tier", "starter")),
            billing_interval=BillingInterval(sub.items.data[0].price.recurring.interval),
            status=SubscriptionStatus(sub.status),
            current_period_start=datetime.fromtimestamp(sub.current_period_start),
            current_period_end=datetime.fromtimestamp(sub.current_period_end),
            cancel_at_period_end=sub.cancel_at_period_end,
            trial_end=datetime.fromtimestamp(sub.trial_end) if sub.trial_end else None,
            created_at=datetime.fromtimestamp(sub.created),
            updated_at=datetime.utcnow()
        )
        
        await self.db.save_subscription(subscription)
        return subscription
    
    def _parse_invoice(self, inv) -> Invoice:
        return Invoice(
            id=inv.id,
            company_id=inv.metadata.get("company_id", "") if inv.metadata else "",
            stripe_invoice_id=inv.id,
            amount_subtotal=Decimal(inv.subtotal) / 100,
            amount_tax=Decimal(inv.tax or 0) / 100,
            amount_total=Decimal(inv.total) / 100,
            currency=inv.currency.upper(),
            status=inv.status,
            invoice_pdf=inv.invoice_pdf,
            created_at=datetime.fromtimestamp(inv.created),
            paid_at=datetime.fromtimestamp(inv.status_transitions.paid_at) if inv.status_transitions.paid_at else None
        )

# ============================================
# API ROUTES
# ============================================

app = FastAPI()

@app.get("/billing/plans")
async def get_plans():
    """Get available plans"""
    return {
        tier.value: {
            "name": plan.name_fr,
            "description": plan.description_fr,
            "monthly_price": float(plan.monthly_price),
            "yearly_price": float(plan.yearly_price),
            "features": plan.features.__dict__
        }
        for tier, plan in PLANS.items()
    }

@app.post("/billing/checkout")
async def create_checkout(plan_tier: PlanTier, interval: BillingInterval, company_id: str):
    """Create checkout session"""
    billing = BillingService(db=None)  # Inject DB
    customer_id = await billing.get_or_create_customer(company_id, "email", "name")
    url = await billing.create_checkout_session(company_id, plan_tier, interval, customer_id)
    return {"checkout_url": url}

@app.post("/billing/portal")
async def create_portal(customer_id: str):
    """Create customer portal session"""
    billing = BillingService(db=None)
    url = await billing.create_portal_session(customer_id)
    return {"portal_url": url}

@app.post("/billing/webhook")
async def webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    billing = BillingService(db=None)
    return await billing.handle_webhook(payload, sig)

@app.get("/billing/subscription/{company_id}")
async def get_subscription(company_id: str):
    """Get current subscription"""
    # Return subscription details
    pass

@app.get("/billing/invoices/{customer_id}")
async def get_invoices(customer_id: str):
    """Get invoices"""
    billing = BillingService(db=None)
    return await billing.get_invoices(customer_id)
