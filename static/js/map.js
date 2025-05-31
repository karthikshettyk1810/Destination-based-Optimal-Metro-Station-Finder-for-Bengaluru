// Initialize map variables
let map = null;
let userMarker = null;
let stationMarkers = [];

// Create map container
function createMapContainer() {
    const container = document.createElement('div');
    container.id = 'map-container';
    container.style.display = 'none';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.width = '300px';
    container.style.height = '300px';
    container.style.zIndex = '1000';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    container.style.overflow = 'hidden';
    
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.zIndex = '1001';
    closeButton.style.background = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '24px';
    closeButton.style.height = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    closeButton.onclick = () => {
        container.style.display = 'none';
    };
    
    container.appendChild(mapDiv);
    container.appendChild(closeButton);
    document.body.appendChild(container);
    
    return container;
}

// Initialize map
function initMap() {
    if (!map) {
        const container = createMapContainer();
        map = L.map('map').setView([12.9716, 77.5946], 13); // Bangalore center
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        container.style.display = 'block';
    }
}

// Update user location on map
function updateUserLocation(lat, lon) {
    if (!map) return;
    
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background-color: #4A90E2; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>'
            })
        }).addTo(map);
    }
    
    map.setView([lat, lon], 15);
}

// Add station markers
function addStationMarkers(stations) {
    // Clear existing markers
    stationMarkers.forEach(marker => marker.remove());
    stationMarkers = [];
    
    // Add new markers
    stations.forEach(station => {
        const marker = L.marker([station.coordinates[0], station.coordinates[1]], {
            icon: L.divIcon({
                className: 'station-marker',
                html: `<div style="background-color: #FF6B6B; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`
            })
        }).addTo(map);
        
        marker.bindPopup(`
            <strong>${station.name}</strong><br>
            Line: ${station.line}<br>
            Distance: ${station.walking_distance}m<br>
            Time: ${formatDuration(station.walking_duration)}
        `);
        
        stationMarkers.push(marker);
    });
}

// Format duration for popup
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? 
        `${minutes} min ${remainingSeconds} sec` : 
        `${remainingSeconds} sec`;
}

// Get user location with consent
function getUserLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    const consent = confirm('Would you like to share your current location to see nearby metro stations on the map?');
    if (!consent) return;
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            initMap();
            updateUserLocation(latitude, longitude);
            
            // Send coordinates to server
            fetch('/find_station', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_location: `${latitude},${longitude}`
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.current_location) {
                    // Parse station data from response
                    const stations = parseStationData(data.current_location);
                    addStationMarkers(stations);
                }
            })
            .catch(error => console.error('Error:', error));
        },
        error => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location');
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Parse station data from server response
function parseStationData(response) {
    const stations = [];
    const lines = response.split('\n').slice(1); // Skip first line
    
    lines.forEach(line => {
        const match = line.match(/(\d+\)\s+)([^(]+)\s+\(Line:\s+([^)]+)\):\s+(\d+)\s+m,\s+(.+)/);
        if (match) {
            const [_, __, name, line, distance, duration] = match;
            // Find coordinates from metro_stations data
            const coords = window.metroStations[name.trim()];
            if (coords) {
                stations.push({
                    name: name.trim(),
                    line: line.trim(),
                    walking_distance: parseInt(distance),
                    walking_duration: parseDuration(duration),
                    coordinates: coords
                });
            }
        }
    });
    
    return stations;
}

// Parse duration string to seconds
function parseDuration(durationStr) {
    const parts = durationStr.split(' ');
    let seconds = 0;
    
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'min') {
            seconds += parseInt(parts[i-1]) * 60;
        } else if (parts[i] === 'sec') {
            seconds += parseInt(parts[i-1]);
        }
    }
    
    return seconds;
}

// Export functions
window.mapFunctions = {
    getUserLocation,
    initMap,
    updateUserLocation,
    addStationMarkers
};

// Add this function to show walking routes
function showWalkingRoute(fromLat, fromLng, toLat, toLng) {
    if (!map) return;
    
    // Clear any existing routes
    if (window.currentRouteLayer) {
        map.removeLayer(window.currentRouteLayer);
    }
    
    // Fetch route from OSRM
    fetch(`/api/route?from=${fromLat},${fromLng}&to=${toLat},${toLng}`)
        .then(response => response.json())
        .then(data => {
            if (data.route) {
                // Create a polyline from the route geometry
                window.currentRouteLayer = L.polyline(data.route.map(point => [point[0], point[1]]), {
                    color: '#4A90E2',
                    weight: 5,
                    opacity: 0.7,
                    lineJoin: 'round'
                }).addTo(map);
                
                // Fit the map to show the entire route
                map.fitBounds(window.currentRouteLayer.getBounds(), {
                    padding: [50, 50]
                });
            }
        })
        .catch(error => console.error('Error fetching route:', error));
}