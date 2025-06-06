# HomeVerse Development Makefile

.PHONY: help install dev test lint format clean docker-build docker-up docker-down deploy

help: ## Show this help message
	@echo "HomeVerse Development Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development setup
install: ## Install dependencies (requires active virtual environment)
	pip install -r requirements.txt

dev: ## Start development server with hot reload
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

worker: ## Start Celery worker
	celery -A app.workers.celery_app worker --loglevel=info

beat: ## Start Celery beat scheduler  
	celery -A app.workers.celery_app beat --loglevel=info

flower: ## Start Flower (Celery monitoring)
	celery -A app.workers.celery_app flower --port=5555

# Database
db-upgrade: ## Run database migrations
	alembic upgrade head

db-downgrade: ## Rollback database migration
	alembic downgrade -1

db-migration: ## Generate new migration
	alembic revision --autogenerate -m "$(MSG)"

db-reset: ## Reset database (DROP ALL TABLES)
	alembic downgrade base && alembic upgrade head

# Testing
test: ## Run all tests
	pytest app/tests/ -v

test-unit: ## Run unit tests only
	pytest app/tests/unit/ -v

test-integration: ## Run integration tests only
	pytest app/tests/integration/ -v

test-cov: ## Run tests with coverage
	pytest app/tests/ -v --cov=app --cov-report=html --cov-report=term-missing

# Code quality
lint: ## Run linting (ruff)
	ruff check app/

lint-fix: ## Fix linting issues
	ruff check app/ --fix

format: ## Format code with black
	black app/

type-check: ## Run type checking
	mypy app/

qa: lint type-check test ## Run all quality assurance checks

# Docker
docker-build: ## Build Docker image
	docker build -f docker/Dockerfile -t homeverse-api:latest .

docker-up: ## Start Docker Compose stack
	docker-compose -f docker/docker-compose.yml up -d

docker-down: ## Stop Docker Compose stack
	docker-compose -f docker/docker-compose.yml down

docker-logs: ## View Docker logs
	docker-compose -f docker/docker-compose.yml logs -f

docker-test: ## Run tests in Docker
	docker-compose -f docker/docker-compose.yml run --rm api pytest app/tests/ -v

# Deployment
deploy-staging: ## Deploy to staging
	echo "Deploying to staging..."
	# Add staging deployment commands

deploy-prod: ## Deploy to production (Fly.io)
	flyctl deploy --config ops/fly.toml

# Utilities
clean: ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .coverage htmlcov/ .pytest_cache/

logs: ## View application logs
	tail -f logs/app.log

shell: ## Start Python shell with app context
	python3 -c "from app.main import app; from app.db.database import get_session; print('App loaded')"

# Database seeding
seed-data: ## Seed database with sample data
	python3 scripts/seed_data.py

# Generate docs
docs: ## Generate API documentation
	python3 scripts/generate_docs.py

# Environment
env-example: ## Create .env.example file
	@echo "Creating .env.example..."
	@echo "# Database" > .env.example
	@echo "DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/homeverse" >> .env.example
	@echo "TEST_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/homeverse_test" >> .env.example
	@echo "" >> .env.example
	@echo "# Redis" >> .env.example
	@echo "REDIS_URL=redis://localhost:6379/0" >> .env.example
	@echo "" >> .env.example
	@echo "# JWT" >> .env.example
	@echo "JWT_SECRET_KEY=your-secret-key-here" >> .env.example
	@echo "ACCESS_TOKEN_EXPIRE_MINUTES=30" >> .env.example

install-pre-commit: ## Install pre-commit hooks
	pip3 install pre-commit
	pre-commit install