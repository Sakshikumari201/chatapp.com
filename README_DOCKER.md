# Docker Integration for Real-Time Chat App

This project is now equipped with Docker and Docker Compose for easy deployment and local development.

## Files Created
- `Dockerfile`: Multi-stage build that compiles the frontend and prepares the backend.
- `docker-compose.yml`: Orchestrates the app and a local MongoDB instance.
- `.dockerignore`: Optimizes build by excluding unnecessary files.

## Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### 1. Configure Environment Variables
Ensure your `.env` file in the root directory is populated. The Docker build will use these variables for both the backend (runtime) and the frontend (build-time).

### 2. Run with Docker Compose
To build and start the entire stack (App + MongoDB):

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000` (or whatever `PORT` you specified in `.env`).

### 3. Firebase Service Account
If you use a Firebase Service Account JSON file (as seen in your `.env`), ensure the file path is correct relative to the root. If the file is not part of your git repository, you may need to mount it in `docker-compose.yml`:

```yaml
    volumes:
      - ./backend/your-firebase-file.json:/app/backend/your-firebase-file.json
```

### 4. Using Local MongoDB
By default, the app service in `docker-compose.yml` uses the `MONGODB_CONNECT` from your `.env`. 
If you want to use the local MongoDB container instead of Atlas, update your `.env` or the `environment` section in `docker-compose.yml`:

```yaml
MONGODB_CONNECT=mongodb://mongodb:27017/chatapp
```

## Troubleshooting
- **Frontend changes not reflecting?** Remember that the `Dockerfile` builds the frontend during the image creation. If you change frontend code, you need to run `docker-compose up --build` again.
- **Environment Variables:** If you add new `VITE_` variables to the frontend, you must also add them as `ARG` in the `Dockerfile` and `args` in `docker-compose.yml`.

## Deployment
This setup is ready for production. You can push the Docker image to any container registry and run it on platforms like AWS ECS, DigitalOcean App Platform, or a VPS with Docker installed.
