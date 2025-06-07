#!/bin/bash

# HomeVerse PostgreSQL Setup Script
# Sets up PostgreSQL environment and runs migration

set -e

echo "🚀 HomeVerse PostgreSQL Setup"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_USER="homeverse"
POSTGRES_PASSWORD="secure_password123"
POSTGRES_DB="homeverse_dev"
POSTGRES_PORT="5432"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is installed
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL client found"
        psql --version
    else
        print_warning "PostgreSQL client not found"
        print_status "Installing PostgreSQL..."
        
        # Install PostgreSQL based on OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib postgresql-client
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install postgresql
        else
            print_error "Unsupported OS. Please install PostgreSQL manually."
            exit 1
        fi
    fi
}

# Check if PostgreSQL service is running
check_postgresql_service() {
    print_status "Checking PostgreSQL service..."
    
    if sudo systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL service is running"
    else
        print_status "Starting PostgreSQL service..."
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        print_success "PostgreSQL service started"
    fi
}

# Create database and user
setup_database() {
    print_status "Setting up database and user..."
    
    # Switch to postgres user and create database
    sudo -u postgres psql -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';" 2>/dev/null || print_warning "User $POSTGRES_USER already exists"
    sudo -u postgres psql -c "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;" 2>/dev/null || print_warning "Database $POSTGRES_DB already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" 2>/dev/null
    
    print_success "Database setup completed"
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install/upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    pip install -r requirements.txt
    
    print_success "Python dependencies installed"
}

# Create database schema
create_schema() {
    print_status "Creating database schema..."
    
    # Set environment variable for database connection
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
    
    # Run schema creation
    PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -f db/schema_postgresql.sql
    
    print_success "Database schema created"
}

# Run migration
run_migration() {
    print_status "Running migration from SQLite to PostgreSQL..."
    
    # Check if SQLite database exists
    if [ ! -f "homeverse.db" ]; then
        print_warning "SQLite database not found. Creating test data..."
        # You might want to create some test data here
    fi
    
    # Set environment variable
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Run migration (dry run first)
    print_status "Running migration dry run..."
    python migrate_to_postgresql.py --dry-run
    
    # Run actual migration
    print_status "Running actual migration..."
    python migrate_to_postgresql.py
    
    print_success "Migration completed"
}

# Switch to PostgreSQL configuration
switch_config() {
    print_status "Switching to PostgreSQL configuration..."
    
    python switch_database.py postgresql
    
    print_success "Configuration switched to PostgreSQL"
}

# Test the setup
test_setup() {
    print_status "Testing PostgreSQL setup..."
    
    # Test database connection
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Test connection
    python -c "
import asyncio
import asyncpg

async def test_connection():
    try:
        conn = await asyncpg.connect('$DATABASE_URL')
        result = await conn.fetchval('SELECT 1')
        await conn.close()
        print('✅ Database connection successful')
        return True
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        return False

asyncio.run(test_connection())
"

    print_success "Setup testing completed"
}

# Main execution
main() {
    print_status "Starting PostgreSQL setup for HomeVerse..."
    
    # Check command line arguments
    SKIP_INSTALL=false
    DRY_RUN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-install    Skip PostgreSQL installation"
                echo "  --dry-run        Run migration in dry-run mode only"
                echo "  -h, --help       Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Setup steps
    if [ "$SKIP_INSTALL" = false ]; then
        check_postgresql
        check_postgresql_service
        setup_database
    fi
    
    install_python_deps
    create_schema
    
    if [ "$DRY_RUN" = false ]; then
        run_migration
        switch_config
        test_setup
        
        echo ""
        print_success "🎉 PostgreSQL setup completed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Start the application: python app/main.py"
        echo "2. Or use the frontend: cd frontend && npm run dev"
        echo "3. Access the API docs: http://localhost:8000/api/docs"
        echo "4. Monitor with pgAdmin: http://localhost:5050 (if using Docker)"
        echo ""
        echo "Database connection:"
        echo "  URL: postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
        echo "  Host: localhost"
        echo "  Port: $POSTGRES_PORT"
        echo "  Database: $POSTGRES_DB"
        echo "  User: $POSTGRES_USER"
        echo ""
    else
        print_success "🔍 Dry run completed. Run without --dry-run to perform actual migration."
    fi
}

# Handle Ctrl+C
trap 'echo -e "\n${RED}Setup interrupted by user${NC}"; exit 1' INT

# Run main function
main "$@"