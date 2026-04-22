# Multimedia Management System

A desktop application for managing large multimedia collections (images, audio, video) with AI-tagging, search, and recommendations.

## Features

- Import and manage multimedia files from local storage
- Playback support for audio and video, image viewing
- Automatic metadata extraction and manual editing
- AI-based content tagging (images & audio)
- Graph-based recommendation system
- Advanced search and filtering
- Persistent storage using a database
- Desktop UI with integrated file system access

---

## Tech stack

- **Frontend:** React + Electron  
- **Backend:** Python (FastAPI REST API)  
- **Database:** Neo4j (graph-based)  

### Metadata Processing
- ExifTool (images, general metadata)
- Mutagen (MP3 metadata writing)

### AI Integration
- Imagga (image tagging)
- Cyanite (audio analysis)
