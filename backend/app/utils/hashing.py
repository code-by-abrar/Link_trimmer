import hashlib

def generate_short_key(url: str) -> str:
    """
    Generates a 7-character short key using SHA-256 hash of the URL.
    Note: In a production environment, you might want to handle collisions
    or add a salt/timestamp to ensure uniqueness for different users.
    """
    hash_object = hashlib.sha256(url.encode())
    hex_dig = hash_object.hexdigest()
    # Take the first 7 characters for a short key
    return hex_dig[:7]
