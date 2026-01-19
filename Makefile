# GRP Ring Stiffness Test Machine - Makefile

.PHONY: install install-backend install-frontend dev dev-backend dev-frontend build clean

# Install all dependencies
install: install-backend install-frontend

# Install backend dependencies
install-backend:
	cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt

# Install frontend dependencies
install-frontend:
	cd frontend && npm install

# Run both backend and frontend together
dev:
	@trap 'kill 0' EXIT; \
	(cd backend && . venv/bin/activate && uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload) & \
	(cd frontend && npm run dev -- --host 0.0.0.0) & \
	wait

# Run backend only
dev-backend:
	cd backend && . venv/bin/activate && uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload

# Run frontend only
dev-frontend:
	cd frontend && npm run dev -- --host 0.0.0.0

# Build frontend for production
build:
	cd frontend && npm run build

# Clean generated files
clean:
	rm -rf backend/venv backend/__pycache__ backend/*.db backend/*.log
	rm -rf frontend/node_modules frontend/dist
