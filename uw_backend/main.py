from dotenv import load_dotenv
from app import create_app
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
logger.info("📦 Loading environment variables...")
load_dotenv()

# Initialize app
try:
    logger.info("🚀 Attempting to create Flask app...")
    app = create_app()
    logger.info("✅ Flask app created successfully.")
except Exception as e:
    logger.error("❌ Failed to create Flask app.")
    logger.error(e)
    traceback.print_exc()
    raise

# Run locally if needed
if __name__ == "__main__":
    logger.info("🔧 Running Flask app in development mode...")
    app.run(debug=True, port=5000)