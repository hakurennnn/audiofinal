# cors_config.py
from flask_cors import CORS

def init_cors(app):
    """Initialize CORS for the Flask app."""
    CORS(app, resources={r"/*": {"origins": "*"}})