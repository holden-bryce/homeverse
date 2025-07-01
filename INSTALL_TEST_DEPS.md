# 🔧 Install Test Dependencies

The Playwright browsers are downloaded but need system dependencies to run.

## Option 1: Install Dependencies (Recommended)

Run this command with sudo:

```bash
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxcb1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2
```

Or use Playwright's command:
```bash
sudo npx playwright install-deps
```

## Option 2: Use Docker (No Dependencies Needed)

Create `docker-compose.test.yml`:

```yaml
version: '3.8'
services:
  playwright:
    image: mcr.microsoft.com/playwright:v1.45.3-noble
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: npm run test:e2e
```

Then run:
```bash
docker-compose -f docker-compose.test.yml up
```

## Option 3: Use Only Firefox (Often Works Without Deps)

Some browsers work better than others without all dependencies:

```bash
npx playwright test --project=firefox
```

## Option 4: Run Tests in GitHub Actions

The tests will work perfectly in CI/CD where all dependencies are pre-installed.

## Quick Fix for WSL

If you're using WSL, sometimes this helps:

```bash
# Install minimal deps
sudo apt-get update
sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0

# Try running tests again
cd frontend
npm run test:e2e:ui
```

## Alternative: Use the UI Mode

The UI mode sometimes works better with missing dependencies:

```bash
cd frontend
npm run test:e2e:ui
```

Then manually run tests one by one in the UI.