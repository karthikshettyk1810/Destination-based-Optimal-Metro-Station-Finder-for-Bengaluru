document.addEventListener('DOMContentLoaded', function() {
    // Metro stations data with coordinates
    const metroStations = [
        {
            name: "Jnanabharathi",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Uttarahalli",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Vijayanagar",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Attiguppe",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Deepanjali Nagar",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Mysore Road",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Nayandahalli",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Rajarajeshwari Nagar",
            latitude: 12.974135,
            longitude: 77.6174176
        },
        {
            name: "Jalahalli",
            latitude: 13.0417,
            longitude: 77.5472
        },
        {
            name: "Dasarahalli",
            latitude: 13.0417,
            longitude: 77.5472
        },
        {
            name: "Nagasandra",
            latitude: 13.0417,
            longitude: 77.5472
        },
        {
            name: "Majestic",
            latitude: 12.9774,
            longitude: 77.5711
        },
        {
            name: "Kempegowda",
            latitude: 12.9774,
            longitude: 77.5711
        },
        {
            name: "Chickpet",
            latitude: 12.9774,
            longitude: 77.5711
        },
        {
            name: "Krishna Rajendra Market",
            latitude: 12.9774,
            longitude: 77.5711
        },
        {
            name: "National College",
            latitude: 12.9774,
            longitude: 77.5711
        },
        {
            name: "Lalbagh",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "South End Circle",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Jayanagar",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Rashtreeya Vidyalaya Road",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Banashankari",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "JP Nagar",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Yelachenahalli",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Konanakunte Cross",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Doddakallasandra",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Vajarahalli",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Talaghattapura",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Silk Institute",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Kengeri",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Kengeri Bus Terminal",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Pattanagere",
            latitude: 12.9507,
            longitude: 77.5848
        },
        {
            name: "Hosahalli",
            latitude: 13.0417,
            longitude: 77.5472
        },
        {
            name: "Magadi Road",
            latitude: 13.0417,
            longitude: 77.5472
        },
        {
            name: "City Railway Station",
            latitude: 12.9774,
            longitude: 77.5711
        }
    ];

    const searchBtn = document.getElementById('searchBtn');
    const locationInput = document.getElementById('location');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');

    // Handle search button click
    searchBtn.addEventListener('click', searchStations);
    
    // Handle Enter key press
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStations();
        }
    });

    // Add focus effect to input
    locationInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    locationInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });

    // Function to get current location using browser's Geolocation API
    function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve(`${latitude},${longitude}`);
                },
                (error) => {
                    let errorMessage = 'Error getting your location: ';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Please allow location access to find nearby stations.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Location request timed out.';
                            break;
                        default:
                            errorMessage += 'An unknown error occurred.';
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    // Function to update current location results
    async function updateCurrentLocationResults(location) {
        try {
            const response = await fetch('/find_station', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: locationInput.value.trim(),
                    current_location: location
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update location results');
            }

            const data = await response.json();
            
            if (data.current_location) {
                createLocationSection('currentLocation', 'Your Current Location', data.current_location);
            } else if (data.current_location_error) {
                createLocationSection('currentLocation', 'Your Current Location', data.current_location_error);
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    }

    // Function to create a location section
    function createLocationSection(id, title, content) {
        const section = document.getElementById(id);
        if (!section) return;

        section.style.display = 'block';
        const contentDiv = section.querySelector('.result-content');
        if (!contentDiv) return;

        // Clear previous content
        contentDiv.innerHTML = '';

        // If content is an error message, display it
        if (typeof content === 'string' && content.startsWith('❌')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${content.replace('❌ ', '')}`;
            contentDiv.appendChild(errorDiv);
            return;
        }

        // Split the content into lines
        const lines = content.split('\n').filter(line => line.trim());
        let firstStation = null;
        let mainLocation = '';

        // If no valid lines, show a message
        if (lines.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'alert alert-info';
            noResultsDiv.innerHTML = '<i class="fas fa-info-circle me-2"></i>No metro stations found for this location.';
            contentDiv.appendChild(noResultsDiv);
            return;
        }

        lines.forEach((line, index) => {
            if (line.startsWith('✅')) {
                // Extract the main location name from the full address
                const fullAddress = line.replace('✅ Closest metro stations to ', '');
                mainLocation = extractMainLocation(fullAddress);
                
                // Create header
                const header = document.createElement('h4');
                header.className = 'text-center mb-3';
                
                // Different header format for current location
                if (id === 'currentLocation') {
                    // For current location, get the station name from the first station result
                    const firstStationMatch = lines.find(s => s.match(/^\d+\)/));
                    if (firstStationMatch) {
                        const match = firstStationMatch.match(/(\d+\))\s+(.*?)\s+\(Line:/);
                        if (match) {
                            const stationName = match[2];
                            header.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>Nearest Metro Station to your location is ${stationName}`;
                        }
                    }
                } else {
                    header.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>Closest metro station near "${mainLocation}"`;
                }
                contentDiv.appendChild(header);
            } else if (line.startsWith('❌')) {
                // This is an error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-warning';
                errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${line.replace('❌ ', '')}`;
                contentDiv.appendChild(errorDiv);
            } else if (line.match(/^\d+\)/)) {
                // This is a station result
                const stationCard = createStationCard(line);
                // Add animation delay based on index
                stationCard.style.animationDelay = `${index * 0.1}s`;
                contentDiv.appendChild(stationCard);
                
                // Store the first station for the highlighted statement
                if (!firstStation) {
                    firstStation = line;
                }
            }
        });

        // Add the highlighted statement after the header if we have a first station
        if (firstStation) {
            const match = firstStation.match(/(\d+\))\s+(.*?)\s+\(Line:/);
            if (match) {
                const stationName = match[2];
                const highlightDiv = document.createElement('div');
                highlightDiv.className = 'highlight-statement';
                
                if (id === 'currentLocation') {
                    highlightDiv.innerHTML = `
                        <i class="fas fa-directions"></i>
                        Reach <strong>${stationName}</strong> metro station as it is nearest to your location
                    `;
                } else {
                    highlightDiv.innerHTML = `
                        <i class="fas fa-ticket-alt"></i>
                        Buy ticket to <strong>${stationName}</strong> to reach "${mainLocation}" faster
                    `;
                }
                contentDiv.insertBefore(highlightDiv, contentDiv.children[1]);
            }
        }

        // Update summary section
        updateSummary(firstStation);
    }

    // Function to update summary section
    function updateSummary(stationText) {
        if (!stationText) {
            // Reset summary if no station data
            document.getElementById('nearestMetro').textContent = '-';
            document.getElementById('walkingDistance').textContent = '-';
            document.getElementById('walkingTime').textContent = '-';
            document.getElementById('metroLine').textContent = '-';
            return;
        }

        const match = stationText.match(/(\d+\))\s+(.*?)\s+\(Line:\s+(.*?)\):\s+(\d+)\s+m,\s+(.*)/);
        if (match) {
            const [_, number, name, line, distance, time] = match;
            
            document.getElementById('nearestMetro').textContent = name;
            document.getElementById('walkingDistance').textContent = `${distance}m`;
            document.getElementById('walkingTime').textContent = time;
            document.getElementById('metroLine').textContent = line;
        }
    }

    // Function to show error message
    function showError(message) {
        if (errorDiv) {
            errorDiv.classList.remove('d-none');
            errorDiv.querySelector('span').textContent = message;
        }
    }

    // Function to hide error message
    function hideError() {
        if (errorDiv) {
            errorDiv.classList.add('d-none');
        }
    }

    // Function to show loading spinner
    function showLoading() {
        if (loadingDiv) {
            loadingDiv.classList.remove('d-none');
        }
    }

    // Function to hide loading spinner
    function hideLoading() {
        if (loadingDiv) {
            loadingDiv.classList.add('d-none');
        }
    }

    // Function to search for stations
    async function searchStations() {
        const locationInput = document.getElementById('location');
        if (!locationInput) return;

        const location = locationInput.value.trim();
        if (!location) {
            showError('Please enter a location');
            return;
        }

        hideError();
        showLoading();

        try {
            // Get current location first
            const currentLocation = await getCurrentLocation();
            
            // Make API call to find stations
            const response = await fetch('/find_station', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location,
                    current_location: currentLocation
                })
            });

            if (!response.ok) {
                throw new Error('Failed to find stations');
            }

            const data = await response.json();
            
            // Handle spell correction automatically
            if (data.spell_correction) {
                const { corrected } = data.spell_correction;
                locationInput.value = corrected;
                // Show loading animation for the corrected search
                showLoading();
                // Add a small delay to ensure the loading animation is visible
                await new Promise(resolve => setTimeout(resolve, 100));
                // Retry the search with corrected location
                return searchStations();
            }
            
            // Call handleSearchSuccess with the data
            handleSearchSuccess(data);

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function extractMainLocation(fullAddress) {
        // Split by comma and take the first part
        const parts = fullAddress.split(',');
        // Remove any leading/trailing whitespace and return the first part
        return parts[0].trim();
    }

    function createStationCard(stationText) {
        const card = document.createElement('div');
        card.className = 'station-card animate__animated animate__fadeInUp';
        
        // Extract station information
        const match = stationText.match(/(\d+\))\s+(.*?)\s+\(Line:\s+(.*?)\):\s+(\d+)\s+m,\s+(.*)/);
        
        if (match) {
            const [_, number, name, line, distance, time] = match;
            
            // Get the base line name (e.g., "Purple" from "Purple Line")
            const baseLine = line.split(' ')[0];
            const lineClass = getLineClass(baseLine);
            
            // Add data-line attribute for color-specific effects
            card.setAttribute('data-line', baseLine);
            
            card.innerHTML = `
                <div class="station-name">
                    <i class="fas fa-subway me-2" style="color: ${getLineColor(baseLine)}"></i>
                    ${name}
                </div>
                <div class="station-line">
                    <div class="line-indicator ${lineClass}"></div>
                    <i class="fas fa-train me-2"></i>
                    ${line}
                </div>
                <div class="station-distance">
                    <i class="fas fa-walking"></i>
                    ${distance} meters
                </div>
                <div class="station-time">
                    <i class="fas fa-clock"></i>
                    ${time}
                </div>
            `;
        }
        
        return card;
    }

    function getLineClass(line) {
        // Add classes for different metro lines
        const lineClasses = {
            'Purple': 'line-purple',
            'Green': 'line-green',
            'Blue': 'line-blue',
            'Red': 'line-red',
            'Yellow': 'line-yellow'
        };
        
        return lineClasses[line] || '';
    }

    function getLineColor(line) {
        // Add colors for different metro lines
        const lineColors = {
            'Purple': '#9b59b6',
            'Green': '#2ecc71',
            'Blue': '#3498db',
            'Red': '#e74c3c',
            'Yellow': '#f1c40f'
        };
        
        return lineColors[line] || '#34495e';
    }

    // Function to handle successful search results
    function handleSearchSuccess(data) {
        hideLoading();
        hideError();
        
        // Log the complete data for debugging
        console.log('Complete backend response:', data);
        
        // Show the map button with animation
        const viewMapBtn = document.getElementById('viewMapBtn');
        if (viewMapBtn) {
            viewMapBtn.style.display = 'block';
            viewMapBtn.classList.add('animate__animated', 'animate__fadeIn');
            
            // Update the map button click handler
            viewMapBtn.onclick = () => {
                const mapFrame = document.getElementById('mapFrame');
                const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
                
                // Clear any existing iframe content
                mapFrame.src = '';
                
                // Set the new source
                mapFrame.src = '/static/metro_map.html';
                
                // Show the modal
                mapModal.show();
                
                // Wait for iframe to load
                mapFrame.onload = () => {
                    // Extract location data from the search results
                    const locationData = {
                        type: 'updateMap',
                        userLocation: null,
                        searchedLocation: null,
                        stations: {
                            type: 'FeatureCollection',
                            features: []
                        }
                    };

                    // Get user location if available
                    if (data.current_location) {
                        const lines = data.current_location.split('\n');
                        const locationLine = lines.find(line => line.startsWith('✅'));
                        if (locationLine) {
                            // Extract coordinates from the format: ✅ Closest metro stations to your current location: (lat, lng)
                            const coordsMatch = locationLine.match(/\(([\d.-]+),\s*([\d.-]+)\)/);
                            if (coordsMatch) {
                                const lat = parseFloat(coordsMatch[1]);
                                const lng = parseFloat(coordsMatch[2]);
                                console.log('Extracted user coordinates:', lat, lng);
                                locationData.userLocation = [lat, lng];
                            }
                        }
                    }

                    // Get searched location coordinates
                    if (data.searched_location) {
                        const lines = data.searched_location.split('\n');
                        const locationLine = lines.find(line => line.startsWith('✅'));
                        if (locationLine) {
                            console.log('Found location line:', locationLine);
                            // Extract coordinates from the format: ✅ Closest metro stations to 'Location Name' (lat, lng)
                            const coordsMatch = locationLine.match(/\(([\d.-]+),\s*([\d.-]+)\)/);
                            if (coordsMatch) {
                                const lat = parseFloat(coordsMatch[1]);
                                const lng = parseFloat(coordsMatch[2]);
                                console.log('Extracted searched location coordinates:', lat, lng);
                                locationData.searchedLocation = [lat, lng];
                            } else {
                                // If no coordinates in the line, try to get from the first station's distance
                                const firstStationLine = lines.find(line => line.match(/^\d+\)/));
                                if (firstStationLine) {
                                    const match = firstStationLine.match(/(\d+\))\s+(.*?)\s+\(Line:\s+(.*?)\):\s+(\d+)\s+m,\s+(.*)/);
                                    if (match) {
                                        const [_, number, name, line, distance, time] = match;
                                        // Use the first station's coordinates as a reference point
                                        const station = metroStations.find(s => s.name === name);
                                        if (station) {
                                            console.log('Using first station coordinates as reference:', station);
                                            locationData.searchedLocation = [station.latitude, station.longitude];
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Get station data
                    if (data.searched_location) {
                        const lines = data.searched_location.split('\n');
                        lines.forEach(line => {
                            if (line.match(/^\d+\)/)) {
                                const match = line.match(/(\d+\))\s+(.*?)\s+\(Line:\s+(.*?)\):\s+(\d+)\s+m,\s+(.*)/);
                                if (match) {
                                    const [_, number, name, line, distance, time] = match;
                                    // Convert time to seconds
                                    const timeMatch = time.match(/(\d+)\s+min/);
                                    const duration = timeMatch ? parseInt(timeMatch[1]) * 60 : 0;
                                    
                                    // Find station coordinates from metro_stations data
                                    const station = metroStations.find(s => s.name === name);
                                    if (station) {
                                        console.log('Found station coordinates:', name, station);
                                        locationData.stations.features.push({
                                            type: 'Feature',
                                            properties: {
                                                name: name,
                                                line: line,
                                                distance: parseInt(distance),
                                                duration: duration,
                                                type: 'metro'
                                            },
                                            geometry: {
                                                type: 'Point',
                                                coordinates: [station.longitude, station.latitude]
                                            }
                                        });
                                    } else {
                                        console.log('No coordinates found for station:', name);
                                    }
                                }
                            }
                        });
                    }

                    // Log the data being sent to the map
                    console.log('Sending data to map:', locationData);

                    // Send data to map
                    mapFrame.contentWindow.postMessage(locationData, '*');
                };
                
                // Handle modal hidden event
                document.getElementById('mapModal').addEventListener('hidden.bs.modal', function () {
                    // Clear the iframe content
                    mapFrame.src = '';
                    // Remove the backdrop
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    // Remove modal-open class from body
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, { once: true });
            };
        }

        // Update current location results if available
        if (data.current_location) {
            createLocationSection('currentLocation', 'Your Current Location', data.current_location);
        } else if (data.current_location_error) {
            createLocationSection('currentLocation', 'Your Current Location', data.current_location_error);
        }

        // Update searched location results
        if (data.searched_location) {
            createLocationSection('searchedLocation', 'Searched Location', data.searched_location);
        }

        // Show error if present
        if (data.error) {
            showError(data.error);
        }
    }
}); 
