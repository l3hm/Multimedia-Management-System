import os
from dotenv import load_dotenv

load_dotenv()
IMAGGA_API_KEY = os.getenv("IMAGGA_API_KEY")
IMAGGA_API_SECRET = os.getenv("IMAGGA_API_SECRET")
IMAGGA_TAGS_URL = "https://api.imagga.com/v2/tags"