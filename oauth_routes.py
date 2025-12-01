"""
╔══════════════════════════════════════════════════════════════════════════════╗
║   🌐 ROADY - SOCIAL MEDIA OAUTH BACKEND                                      ║
║   FastAPI endpoints for OAuth2 authentication                                ║
║   Supports 15+ platforms                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import secrets
import json
from datetime import datetime, timedelta
from urllib.parse import urlencode
import os

router = APIRouter(prefix="/api/oauth", tags=["OAuth"])

# ═══════════════════════════════════════════════════════════════════════════
# PLATFORM CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════════════════

PLATFORMS = {
    "youtube": {
        "name": "YouTube",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/youtube.readonly", 
                   "https://www.googleapis.com/auth/youtube.upload"],
        "client_id_env": "YOUTUBE_CLIENT_ID",
        "client_secret_env": "YOUTUBE_CLIENT_SECRET"
    },
    "tiktok": {
        "name": "TikTok",
        "auth_url": "https://www.tiktok.com/auth/authorize/",
        "token_url": "https://open-api.tiktok.com/oauth/access_token/",
        "scopes": ["user.info.basic", "video.list", "video.upload"],
        "client_id_env": "TIKTOK_CLIENT_KEY",
        "client_secret_env": "TIKTOK_CLIENT_SECRET"
    },
    "instagram": {
        "name": "Instagram",
        "auth_url": "https://api.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "scopes": ["instagram_basic", "instagram_content_publish"],
        "client_id_env": "INSTAGRAM_CLIENT_ID",
        "client_secret_env": "INSTAGRAM_CLIENT_SECRET"
    },
    "facebook": {
        "name": "Facebook",
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "scopes": ["pages_manage_posts", "pages_read_engagement"],
        "client_id_env": "FACEBOOK_APP_ID",
        "client_secret_env": "FACEBOOK_APP_SECRET"
    },
    "twitter": {
        "name": "Twitter/X",
        "auth_url": "https://twitter.com/i/oauth2/authorize",
        "token_url": "https://api.twitter.com/2/oauth2/token",
        "scopes": ["tweet.read", "tweet.write", "users.read", "offline.access"],
        "client_id_env": "TWITTER_CLIENT_ID",
        "client_secret_env": "TWITTER_CLIENT_SECRET",
        "pkce": True
    },
    "linkedin": {
        "name": "LinkedIn",
        "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
        "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
        "scopes": ["r_liteprofile", "w_member_social"],
        "client_id_env": "LINKEDIN_CLIENT_ID",
        "client_secret_env": "LINKEDIN_CLIENT_SECRET"
    },
    "discord": {
        "name": "Discord",
        "auth_url": "https://discord.com/api/oauth2/authorize",
        "token_url": "https://discord.com/api/oauth2/token",
        "scopes": ["identify", "guilds", "bot"],
        "client_id_env": "DISCORD_CLIENT_ID",
        "client_secret_env": "DISCORD_CLIENT_SECRET"
    },
    "twitch": {
        "name": "Twitch",
        "auth_url": "https://id.twitch.tv/oauth2/authorize",
        "token_url": "https://id.twitch.tv/oauth2/token",
        "scopes": ["user:read:email", "channel:manage:broadcast"],
        "client_id_env": "TWITCH_CLIENT_ID",
        "client_secret_env": "TWITCH_CLIENT_SECRET"
    },
    "spotify": {
        "name": "Spotify",
        "auth_url": "https://accounts.spotify.com/authorize",
        "token_url": "https://accounts.spotify.com/api/token",
        "scopes": ["user-read-private", "playlist-modify-public"],
        "client_id_env": "SPOTIFY_CLIENT_ID",
        "client_secret_env": "SPOTIFY_CLIENT_SECRET"
    },
    "reddit": {
        "name": "Reddit",
        "auth_url": "https://www.reddit.com/api/v1/authorize",
        "token_url": "https://www.reddit.com/api/v1/access_token",
        "scopes": ["identity", "submit", "read"],
        "client_id_env": "REDDIT_CLIENT_ID",
        "client_secret_env": "REDDIT_CLIENT_SECRET"
    },
    "pinterest": {
        "name": "Pinterest",
        "auth_url": "https://api.pinterest.com/oauth/",
        "token_url": "https://api.pinterest.com/v5/oauth/token",
        "scopes": ["boards:read", "pins:read", "pins:write"],
        "client_id_env": "PINTEREST_CLIENT_ID",
        "client_secret_env": "PINTEREST_CLIENT_SECRET"
    },
    "slack": {
        "name": "Slack",
        "auth_url": "https://slack.com/oauth/v2/authorize",
        "token_url": "https://slack.com/api/oauth.v2.access",
        "scopes": ["chat:write", "channels:read", "users:read"],
        "client_id_env": "SLACK_CLIENT_ID",
        "client_secret_env": "SLACK_CLIENT_SECRET"
    }
}

# Store for OAuth states (in production, use Redis/database)
oauth_states: Dict[str, Dict[str, Any]] = {}

# Store for connected accounts (in production, use database)
connected_accounts: Dict[str, Dict[str, Any]] = {}


# ═══════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════

class OAuthConfig(BaseModel):
    client_id: str
    client_secret: str

class TokenResponse(BaseModel):
    platform: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    token_type: str = "Bearer"
    scope: Optional[str] = None

class ConnectedAccount(BaseModel):
    platform: str
    connected: bool
    username: Optional[str] = None
    email: Optional[str] = None
    profile_url: Optional[str] = None
    connected_at: datetime
    expires_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def get_redirect_uri(platform: str, request: Request) -> str:
    """Generate redirect URI for a platform"""
    base_url = str(request.base_url).rstrip('/')
    return f"{base_url}/api/oauth/callback/{platform}"

def get_platform_credentials(platform: str) -> tuple:
    """Get client ID and secret from environment"""
    config = PLATFORMS.get(platform)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")
    
    client_id = os.getenv(config["client_id_env"], "")
    client_secret = os.getenv(config["client_secret_env"], "")
    
    return client_id, client_secret

def generate_state() -> str:
    """Generate secure random state for OAuth"""
    return secrets.token_urlsafe(32)


# ═══════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/platforms")
async def list_platforms():
    """List all available OAuth platforms"""
    platforms_list = []
    for platform_id, config in PLATFORMS.items():
        client_id, _ = get_platform_credentials(platform_id)
        platforms_list.append({
            "id": platform_id,
            "name": config["name"],
            "configured": bool(client_id),
            "scopes": config["scopes"]
        })
    return {"platforms": platforms_list}


@router.get("/connect/{platform}")
async def initiate_oauth(platform: str, request: Request, user_id: str = Query(...)):
    """
    Initiate OAuth flow for a platform
    Redirects user to platform's authorization page
    """
    if platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")
    
    config = PLATFORMS[platform]
    client_id, _ = get_platform_credentials(platform)
    
    if not client_id:
        raise HTTPException(status_code=400, detail=f"{platform} is not configured. Set {config['client_id_env']} environment variable.")
    
    # Generate state
    state = generate_state()
    oauth_states[state] = {
        "platform": platform,
        "user_id": user_id,
        "created_at": datetime.utcnow()
    }
    
    # Build authorization URL
    redirect_uri = get_redirect_uri(platform, request)
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(config["scopes"]),
        "state": state,
        "access_type": "offline"  # For refresh tokens
    }
    
    # Platform-specific params
    if platform == "twitter":
        params["code_challenge_method"] = "plain"
        params["code_challenge"] = state  # Simplified PKCE
    
    if platform == "reddit":
        params["duration"] = "permanent"
    
    auth_url = f"{config['auth_url']}?{urlencode(params)}"
    
    return RedirectResponse(url=auth_url)


@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None
):
    """
    OAuth callback handler
    Exchanges authorization code for access token
    """
    # Handle errors
    if error:
        return HTMLResponse(content=f"""
            <html>
            <body>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_callback',
                        platform: '{platform}',
                        success: false,
                        error: '{error}',
                        errorDescription: '{error_description or ""}'
                    }}, '*');
                    window.close();
                </script>
                <p>Authentication failed: {error_description or error}</p>
            </body>
            </html>
        """)
    
    # Validate state
    if not state or state not in oauth_states:
        return HTMLResponse(content="""
            <html><body>
                <script>
                    window.opener.postMessage({type: 'oauth_callback', success: false, error: 'Invalid state'}, '*');
                    window.close();
                </script>
                <p>Invalid state parameter</p>
            </body></html>
        """)
    
    state_data = oauth_states.pop(state)
    user_id = state_data["user_id"]
    
    if not code:
        return HTMLResponse(content="""
            <html><body>
                <script>
                    window.opener.postMessage({type: 'oauth_callback', success: false, error: 'No code'}, '*');
                    window.close();
                </script>
                <p>No authorization code received</p>
            </body></html>
        """)
    
    # Exchange code for tokens
    config = PLATFORMS[platform]
    client_id, client_secret = get_platform_credentials(platform)
    redirect_uri = get_redirect_uri(platform, request)
    
    token_data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    # Platform-specific token exchange
    if platform == "twitter":
        token_data["code_verifier"] = state
    
    try:
        async with httpx.AsyncClient() as client:
            # Special handling for some platforms
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            
            if platform == "reddit":
                import base64
                auth_str = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
                headers["Authorization"] = f"Basic {auth_str}"
                del token_data["client_id"]
                del token_data["client_secret"]
            
            response = await client.post(
                config["token_url"],
                data=token_data,
                headers=headers
            )
            
            if response.status_code != 200:
                error_detail = response.text
                return HTMLResponse(content=f"""
                    <html><body>
                        <script>
                            window.opener.postMessage({{
                                type: 'oauth_callback',
                                platform: '{platform}',
                                success: false,
                                error: 'Token exchange failed'
                            }}, '*');
                            window.close();
                        </script>
                        <p>Token exchange failed: {error_detail}</p>
                    </body></html>
                """)
            
            tokens = response.json()
            
            # Store tokens
            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            expires_in = tokens.get("expires_in")
            
            expires_at = None
            if expires_in:
                expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            # Get user info (platform-specific)
            user_info = await get_user_info(platform, access_token, client)
            
            # Store connected account
            account_key = f"{user_id}_{platform}"
            connected_accounts[account_key] = {
                "platform": platform,
                "user_id": user_id,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_at": expires_at.isoformat() if expires_at else None,
                "user_info": user_info,
                "connected_at": datetime.utcnow().isoformat()
            }
            
            return HTMLResponse(content=f"""
                <html><body>
                    <script>
                        window.opener.postMessage({{
                            type: 'oauth_callback',
                            platform: '{platform}',
                            success: true,
                            tokens: {{
                                access_token: '{access_token[:20]}...',
                                has_refresh: {str(bool(refresh_token)).lower()},
                                expires_in: {expires_in or 'null'}
                            }},
                            user: {json.dumps(user_info)}
                        }}, '*');
                        window.close();
                    </script>
                    <p>✅ Successfully connected to {config['name']}!</p>
                    <p>You can close this window.</p>
                </body></html>
            """)
            
    except Exception as e:
        return HTMLResponse(content=f"""
            <html><body>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_callback',
                        platform: '{platform}',
                        success: false,
                        error: '{str(e)}'
                    }}, '*');
                    window.close();
                </script>
                <p>Error: {str(e)}</p>
            </body></html>
        """)


async def get_user_info(platform: str, access_token: str, client: httpx.AsyncClient) -> dict:
    """Fetch user info from platform API"""
    user_info = {"username": None, "email": None, "profile_url": None}
    
    try:
        if platform == "youtube":
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                user_info["email"] = data.get("email")
                user_info["username"] = data.get("name")
        
        elif platform == "discord":
            resp = await client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                user_info["username"] = f"{data.get('username')}#{data.get('discriminator')}"
                user_info["email"] = data.get("email")
        
        elif platform == "twitch":
            resp = await client.get(
                "https://api.twitch.tv/helix/users",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Client-Id": os.getenv("TWITCH_CLIENT_ID", "")
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("data"):
                    user_data = data["data"][0]
                    user_info["username"] = user_data.get("display_name")
                    user_info["profile_url"] = f"https://twitch.tv/{user_data.get('login')}"
        
        elif platform == "twitter":
            resp = await client.get(
                "https://api.twitter.com/2/users/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("data"):
                    user_info["username"] = f"@{data['data'].get('username')}"
                    user_info["profile_url"] = f"https://twitter.com/{data['data'].get('username')}"
        
        elif platform == "spotify":
            resp = await client.get(
                "https://api.spotify.com/v1/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                user_info["username"] = data.get("display_name")
                user_info["email"] = data.get("email")
                user_info["profile_url"] = data.get("external_urls", {}).get("spotify")
        
        elif platform == "reddit":
            resp = await client.get(
                "https://oauth.reddit.com/api/v1/me",
                headers={"Authorization": f"Bearer {access_token}", "User-Agent": "ROADY/1.0"}
            )
            if resp.status_code == 200:
                data = resp.json()
                user_info["username"] = f"u/{data.get('name')}"
                user_info["profile_url"] = f"https://reddit.com/user/{data.get('name')}"
                
    except Exception as e:
        print(f"Error fetching user info for {platform}: {e}")
    
    return user_info


@router.post("/refresh/{platform}")
async def refresh_token(platform: str, user_id: str = Query(...)):
    """Refresh access token for a platform"""
    account_key = f"{user_id}_{platform}"
    
    if account_key not in connected_accounts:
        raise HTTPException(status_code=404, detail="Account not connected")
    
    account = connected_accounts[account_key]
    refresh_token = account.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token available")
    
    config = PLATFORMS[platform]
    client_id, client_secret = get_platform_credentials(platform)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                config["token_url"],
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to refresh token")
            
            tokens = response.json()
            
            # Update stored tokens
            connected_accounts[account_key]["access_token"] = tokens.get("access_token")
            if tokens.get("refresh_token"):
                connected_accounts[account_key]["refresh_token"] = tokens.get("refresh_token")
            
            expires_in = tokens.get("expires_in")
            if expires_in:
                connected_accounts[account_key]["expires_at"] = (
                    datetime.utcnow() + timedelta(seconds=expires_in)
                ).isoformat()
            
            return {"success": True, "message": "Token refreshed successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/disconnect/{platform}")
async def disconnect_platform(platform: str, user_id: str = Query(...)):
    """Disconnect a platform"""
    account_key = f"{user_id}_{platform}"
    
    if account_key in connected_accounts:
        del connected_accounts[account_key]
        return {"success": True, "message": f"Disconnected from {platform}"}
    
    raise HTTPException(status_code=404, detail="Account not connected")


@router.get("/connected")
async def get_connected_accounts(user_id: str = Query(...)):
    """Get all connected accounts for a user"""
    user_accounts = {}
    
    for key, account in connected_accounts.items():
        if account["user_id"] == user_id:
            platform = account["platform"]
            user_accounts[platform] = {
                "connected": True,
                "username": account.get("user_info", {}).get("username"),
                "email": account.get("user_info", {}).get("email"),
                "profile_url": account.get("user_info", {}).get("profile_url"),
                "connected_at": account.get("connected_at"),
                "expires_at": account.get("expires_at")
            }
    
    return {"accounts": user_accounts}


@router.get("/status/{platform}")
async def get_platform_status(platform: str, user_id: str = Query(...)):
    """Check connection status for a specific platform"""
    account_key = f"{user_id}_{platform}"
    
    if account_key not in connected_accounts:
        return {"connected": False, "platform": platform}
    
    account = connected_accounts[account_key]
    
    # Check if token is expired
    expires_at = account.get("expires_at")
    is_expired = False
    if expires_at:
        is_expired = datetime.fromisoformat(expires_at) < datetime.utcnow()
    
    return {
        "connected": True,
        "platform": platform,
        "username": account.get("user_info", {}).get("username"),
        "expired": is_expired,
        "expires_at": expires_at
    }


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/configure/{platform}")
async def configure_platform(platform: str, config: OAuthConfig):
    """
    Configure OAuth credentials for a platform
    (In production, store securely in database/secrets manager)
    """
    if platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")
    
    platform_config = PLATFORMS[platform]
    
    # In production, store these securely
    os.environ[platform_config["client_id_env"]] = config.client_id
    os.environ[platform_config["client_secret_env"]] = config.client_secret
    
    return {
        "success": True,
        "message": f"Configured {platform} OAuth credentials"
    }
