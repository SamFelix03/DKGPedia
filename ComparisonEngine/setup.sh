#!/bin/bash
# Setup script for installing Chrome and ChromeDriver on Vast.ai or similar Linux systems
# Run this on your Vast instance before deploying

set -e

echo "=========================================="
echo "Installing Chrome and ChromeDriver"
echo "=========================================="

# Update package list
echo "Updating package list..."
apt-get update

# Install system dependencies
echo "Installing system dependencies..."
apt-get install -y \
    build-essential \
    curl \
    wget \
    gnupg \
    unzip \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1

# Install Google Chrome
echo "Installing Google Chrome..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable

# Get Chrome version
CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d. -f1)
echo "Chrome major version: $CHROME_VERSION"

# Install ChromeDriver (matching Chrome version)
echo "Installing ChromeDriver..."
CHROMEDRIVER_VERSION=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json" | grep -oE '"version": "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+"' | head -1 | cut -d'"' -f4)

if [ -z "$CHROMEDRIVER_VERSION" ]; then
    echo "Trying alternative method to get ChromeDriver version..."
    CHROMEDRIVER_VERSION=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)
fi

if [ -z "$CHROMEDRIVER_VERSION" ]; then
    echo "Using legacy ChromeDriver API..."
    CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}")
    echo "Downloading ChromeDriver ${CHROMEDRIVER_VERSION} from legacy API"
    wget -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" -O /tmp/chromedriver.zip
else
    echo "Installing ChromeDriver version: $CHROMEDRIVER_VERSION"
    wget -q "https://storage.googleapis.com/chrome-for-testing-public/${CHROMEDRIVER_VERSION}/linux64/chromedriver-linux64.zip" -O /tmp/chromedriver.zip
fi

if [ ! -f /tmp/chromedriver.zip ] || [ ! -s /tmp/chromedriver.zip ]; then
    echo "ERROR: Failed to download ChromeDriver"
    exit 1
fi

unzip -q /tmp/chromedriver.zip -d /tmp/
find /tmp -name chromedriver -type f -executable -exec mv {} /usr/local/bin/chromedriver \;
chmod +x /usr/local/bin/chromedriver
rm -rf /tmp/chromedriver*

# Verify installation
echo ""
echo "Verifying installation..."
chromedriver --version
google-chrome --version

# Check ChromeDriver dependencies
echo ""
echo "Checking ChromeDriver dependencies..."
ldd /usr/local/bin/chromedriver | head -5 || echo "Note: Some libraries may be dynamically loaded"

echo ""
echo "=========================================="
echo "Installation complete!"
echo "=========================================="
echo ""
echo "ChromeDriver location: /usr/local/bin/chromedriver"
echo "Chrome location: $(which google-chrome)"
echo ""
echo "You can now run your application."

