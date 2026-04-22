import os
from dotenv import load_dotenv

load_dotenv()

CYANITE_ACCESS_TOKEN = os.getenv("CYANITE_ACCESS_TOKEN")
CYANITE_API_URL = os.getenv("CYANITE_API_URL", "https://api.cyanite.ai/graphql")