import json
import os
import requests
from jose import jwt
from flask import request, g
from functools import wraps
import time

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
API_AUDIENCE = os.getenv("AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]

JWKS_CACHE = None
JWKS_CACHE_TIME = 0
JWKS_CACHE_TTL = 60 * 60  # 1 hour

class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code

def get_token_auth_header():
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({"code": "authorization_header_missing"}, 401)

    parts = auth.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        raise AuthError({"code": "invalid_header"}, 401)

    return parts[1]

def get_jwks():
    global JWKS_CACHE, JWKS_CACHE_TIME
    now = time.time()
    if JWKS_CACHE is None or now - JWKS_CACHE_TIME > JWKS_CACHE_TTL:
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        JWKS_CACHE = requests.get(jwks_url).json()
        JWKS_CACHE_TIME = now
    return JWKS_CACHE

def verify_decode_jwt(token):
    """Fetch Auth0 public keys and verify token."""
    try:
        jwks = get_jwks()
        
        # Debug: Print the token to see its structure
        # print("Token:", token)
        
        unverified_header = jwt.get_unverified_header(token)
        # print("Unverified header:", unverified_header)
        
        if "kid" not in unverified_header:
            raise AuthError({"code": "invalid_header", "description": "No kid in token header"}, 401)
            
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break

        if not rsa_key:
            raise AuthError({"code": "no_rsa_key", "description": "No matching RSA key found"}, 401)

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthError({"code": "token_expired", "description": "Token is expired"}, 401)
    except jwt.JWTClaimsError as e:
        raise AuthError({"code": "invalid_claims", "description": str(e)}, 401)
    except Exception as e:
        print("Error verifying token:", str(e))
        raise AuthError({"code": "invalid_token", "description": str(e)}, 401)

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            token = get_token_auth_header()
            payload = verify_decode_jwt(token)
            g.current_user = payload
        except AuthError as e:
            return json.dumps(e.error), e.status_code
        return f(*args, **kwargs)
    return decorated