from functools import wraps
from flask import request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

# In production, you would validate API keys against a database
# For now, we'll use environment variables or a simple validation
VALID_API_KEYS = set()

# Load API keys from environment variable (comma-separated)
api_keys_env = os.getenv('VALID_API_KEYS', '')
if api_keys_env:
    VALID_API_KEYS.update(api_keys_env.split(','))

def require_api_key(f):
    """Decorator to require API key authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for API key in Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        # If no VALID_API_KEYS are configured, skip authentication (development mode)
        if not VALID_API_KEYS:
            request.api_key = auth_header[7:].strip() if auth_header.startswith('Bearer ') else auth_header.strip() if auth_header else 'dev'
            return f(*args, **kwargs)
        
        # Production mode: require authentication
        if not auth_header:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "AUTHENTICATION_FAILED",
                    "message": "Missing Authorization header"
                }
            }), 401
        
        # Extract Bearer token
        if auth_header.startswith('Bearer '):
            api_key = auth_header[7:].strip()
        else:
            api_key = auth_header.strip()
        
        # Validate API key against configured keys
        if api_key not in VALID_API_KEYS:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "AUTHENTICATION_FAILED",
                    "message": "Invalid API key"
                }
            }), 401
        
        # Store API key in request context for later use
        request.api_key = api_key
        
        return f(*args, **kwargs)
    
    return decorated_function

