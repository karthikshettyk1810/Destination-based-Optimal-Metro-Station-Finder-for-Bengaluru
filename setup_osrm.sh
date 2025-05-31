#!/bin/bash

# Create directory for OSRM data
mkdir -p ~/osrm-bangalore
cd ~/osrm-bangalore

# Function to download with retries
download_with_retry() {
    local url=$1
    local output=$2
    local max_retries=3
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        echo "Attempting to download $url (attempt $((retry_count + 1))/$max_retries)"
        if curl -L -o "$output" "$url" --retry 3 --retry-delay 5 --retry-max-time 30 --connect-timeout 30 --max-time 300 --silent; then
            # Check if the file is a valid OSM file (should be larger than 1MB)
            if [ -f "$output" ] && [ $(stat -f%z "$output") -gt 1000000 ]; then
                echo "Download successful!"
                return 0
            else
                echo "Downloaded file is too small or invalid"
                rm -f "$output"
            fi
        fi
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo "Download failed, retrying in 5 seconds..."
            sleep 5
        fi
    done
    echo "Failed to download after $max_retries attempts"
    return 1
}

# Function to check if a command succeeded
check_error() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Function to check if OSRM server is healthy
check_osrm_health() {
    echo "Checking OSRM server health..."
    if curl -s "http://localhost:5001/route/v1/driving/77.5946,12.9716;77.5921,12.9784" | grep -q '"code":"Ok"'; then
        echo "OSRM server is healthy!"
        return 0
    else
        echo "OSRM server is not responding correctly"
        return 1
    fi
}

# Clean up any existing containers and files
echo "Cleaning up existing containers and files..."
docker stop osrm-bangalore 2>/dev/null || true
docker rm osrm-bangalore 2>/dev/null || true
rm -f ~/osrm-bangalore/wget-log

# Download Bangalore OSM data using Overpass API
echo "Downloading Bangalore OSM data..."
# Using a bounding box that covers Bangalore metropolitan area
if ! download_with_retry "https://overpass-api.de/api/map?bbox=77.4661,12.9077,77.7448,13.0827" "bangalore.osm"; then
    echo "Failed to download OSM data"
    exit 1
fi

# Check if download was successful
if [ ! -f "bangalore.osm" ]; then
    echo "Failed to download OSM data"
    exit 1
fi

# Process the data with OSRM
echo "Processing data with OSRM..."
echo "Step 1: Extracting road network..."
docker run --platform linux/amd64 -t -v "$(pwd):/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/bangalore.osm > /dev/null
check_error "Failed to extract road network"

echo "Step 2: Partitioning data..."
docker run --platform linux/amd64 -t -v "$(pwd):/data" osrm/osrm-backend osrm-partition /data/bangalore.osrm > /dev/null
check_error "Failed to partition data"

echo "Step 3: Customizing data..."
docker run --platform linux/amd64 -t -v "$(pwd):/data" osrm/osrm-backend osrm-customize /data/bangalore.osrm > /dev/null
check_error "Failed to customize data"

# Start the OSRM server
echo "Starting OSRM server..."
docker run --platform linux/amd64 -d --name osrm-bangalore -p 5001:5000 -v "$(pwd):/data" osrm/osrm-backend osrm-routed --algorithm mld /data/bangalore.osrm
check_error "Failed to start OSRM server"

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check server health
if ! check_osrm_health; then
    echo "OSRM server failed health check"
    exit 1
fi

echo "OSRM setup complete! Server is running on port 5001"
echo "You can test the server by visiting: http://localhost:5001/route/v1/driving/77.5946,12.9716;77.5921,12.9784"
echo ""
echo "To check server status: docker ps | grep osrm-bangalore"
echo "To stop server: docker stop osrm-bangalore"
echo "To view logs: docker logs osrm-bangalore" 