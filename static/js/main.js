document.addEventListener('DOMContentLoaded', function() {
    // Metro stations data with coordinates
    const metroStations = [
        // ... (station data remains unchanged)
    ];

    const searchBtn = document.getElementById('searchBtn');
    const locationInput = document.getElementById('location');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    const GOOGLE_MAPS_API_KEY = 'AIzaSyDDa8CrZCaA3KkOOH8IsICE-h4aHcFGi3Y';

    // Global variables for map components
    let map;
    let currentMap;
    let directionsService;
    let directionsRenderer;
    let currentDirectionsRenderer;
    let markers = [];
    let destinationRoute = null;
    let currentLocationRoute = null;
    let mapInitialized = false;

    // Initialize map when the API is loaded
    window.initMap = function() {
        try {
            // Initialize destination map
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                map = new google.maps.Map(mapContainer, {
                    center: { lat: 12.9716, lng: 77.5946 },
                    zoom: 12,
                    mapId: '8e0a97af9386fef',
                    styles: [
                        {
                            featureType: "transit",
                            elementType: "labels.icon",
                            stylers: [{ visibility: "on" }]
                        }
                    ]
                });

                // Initialize directions renderer for destination map
                directionsRenderer = new google.maps.DirectionsRenderer({
                    map: map,
                    suppressMarkers: true,
                    preserveViewport: true
                });
            }

            // Initialize current location map
            const currentMapContainer = document.getElementById('currentMap');
            if (currentMapContainer) {
                currentMap = new google.maps.Map(currentMapContainer, {
                    center: { lat: 12.9716, lng: 77.5946 },
                    zoom: 12,
                    mapId: '8e0a97af9386fef',
                    styles: [
                        {
                            featureType: "transit",
                            elementType: "labels.icon",
                            stylers: [{ visibility: "on" }]
                        }
                    ]
                });

                // Initialize directions renderer for current location map
                currentDirectionsRenderer = new google.maps.DirectionsRenderer({
                    map: currentMap,
                    suppressMarkers: true,
                    preserveViewport: true
                });
            }

            // Initialize directions service
            directionsService = new google.maps.DirectionsService();
            mapInitialized = true;

            // Show the stored route if it exists
            if (destinationRoute) {
                showRoute(destinationRoute, 'destinationMap');
            }
        } catch (error) {
            console.error('Error initializing map:', error);
            showError('Failed to initialize map. Please try again.');
        }
    };

    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&callback=initMap&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Initialize map when the modals are shown
    const mapModal = document.getElementById('mapModal');
    const currentMapModal = document.getElementById('currentMapModal');
    
    if (mapModal) {
        mapModal.addEventListener('shown.bs.modal', function() {
            if (map) {
                google.maps.event.trigger(map, 'resize');
                if (destinationRoute) {
                    showRoute(destinationRoute, 'destinationMap');
                }
            }
        });
    }

    if (currentMapModal) {
        currentMapModal.addEventListener('shown.bs.modal', function() {
            if (currentMap) {
                google.maps.event.trigger(currentMap, 'resize');
                if (currentLocationRoute) {
                    showRoute(currentLocationRoute, 'currentMap');
                }
            }
        });
    }

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

    // Function to get current location
    function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lng: longitude });
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

    // Function to search for stations
    async function searchStations() {
        const location = locationInput.value.trim();
        if (!location) {
            showError('Please enter a location');
            return;
        }
        showLoading();
        hideError();

        try {
            console.log('Starting search for:', location);
            
            // Get current location
            const currentLocation = await getCurrentLocation();
            
            // Append 'Bangalore' to the searched location if not already present
            const searchLocation = location.toLowerCase().includes('bangalore') 
                ? location 
                : `${location}, Bangalore`;

            // First, get the coordinates of the searched location
            const geocoder = new google.maps.Geocoder();
            const geocodeResult = await new Promise((resolve, reject) => {
                geocoder.geocode({ address: searchLocation }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0].geometry.location);
                    } else {
                        reject(new Error('Could not find the location'));
                    }
                });
            });

            // Search for metro stations near searched location
            const searchResponse = await fetch('/search_places', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `metro station near ${searchLocation}`,
                    location: {
                        lat: geocodeResult.lat(),
                        lng: geocodeResult.lng()
                    }
                })
            });

            if (!searchResponse.ok) {
                throw new Error(`HTTP error! status: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();
            console.log('Search response:', searchData);

            // Search for metro stations near current location
            const currentResponse = await fetch('/search_places', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'metro station',
                    location: currentLocation
                })
            });

            if (!currentResponse.ok) {
                throw new Error(`HTTP error! status: ${currentResponse.status}`);
            }

            const currentData = await currentResponse.json();
            console.log('Current location response:', currentData);

            // Clear existing markers
            clearMarkers();

            let processedSearchResults = null;
            let processedCurrentResults = null;

            // Process and display results for searched location
            if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
                processedSearchResults = {
                    searched_location: {
                        location: {
                            lat: geocodeResult.lat(),
                            lng: geocodeResult.lng()
                        },
                        results: await Promise.all(searchData.results.map(async station => {
                            const distance = calculateDistance(
                                geocodeResult.lat(),
                                geocodeResult.lng(),
                                station.geometry.location.lat,
                                station.geometry.location.lng
                            );
                            const duration = await getDrivingDuration(
                                geocodeResult.lat(),
                                geocodeResult.lng(),
                                station.geometry.location.lat,
                                station.geometry.location.lng
                            );
                            return {
                                station: station.name,
                                lat: station.geometry.location.lat,
                                lng: station.geometry.location.lng,
                                formatted_distance: distance,
                                formatted_duration: duration,
                                origin_lat: geocodeResult.lat(),
                                origin_lng: geocodeResult.lng()
                            };
                        }))
                    }
                };
                displayResults(processedSearchResults.searched_location, 'searchedLocation');
                addLocationMarker(processedSearchResults.searched_location.location, 'Searched Location', map);
            }

            // Process and display results for current location
            if (currentData.status === 'OK' && currentData.results && currentData.results.length > 0) {
                processedCurrentResults = {
                    current_location: {
                        location: currentLocation,
                        results: await Promise.all(currentData.results.map(async station => {
                            const distance = calculateDistance(
                                currentLocation.lat,
                                currentLocation.lng,
                                station.geometry.location.lat,
                                station.geometry.location.lng
                            );
                            const duration = await getDrivingDuration(
                                currentLocation.lat,
                                currentLocation.lng,
                                station.geometry.location.lat,
                                station.geometry.location.lng
                            );
                            return {
                                station: station.name,
                                lat: station.geometry.location.lat,
                                lng: station.geometry.location.lng,
                                formatted_distance: distance,
                                formatted_duration: duration,
                                origin_lat: currentLocation.lat,
                                origin_lng: currentLocation.lng
                            };
                        }))
                    }
                };
                displayResults(processedCurrentResults.current_location, 'currentLocation');
                addLocationMarker(processedCurrentResults.current_location.location, 'Current Location', currentMap);

                // Calculate and log distance between the two nearest metro stations
                console.log('Calculating distance between metro stations...');
                if (processedSearchResults && processedCurrentResults && 
                    processedSearchResults.searched_location.results.length > 0 && 
                    processedCurrentResults.current_location.results.length > 0) {
                    
                    const destinationMetro = processedSearchResults.searched_location.results[0];
                    const currentMetro = processedCurrentResults.current_location.results[0];
                    
                    console.log('Destination Metro:', destinationMetro.station);
                    console.log('Current Metro:', currentMetro.station);
                    
                    try {
                        // Calculate fare using metro travel distance
                        const fareInfo = await calculateFare(currentMetro.station, destinationMetro.station);
                        console.log('Calculated Fare:', fareInfo);

                        // Create fare card
                        const fareCard = document.createElement('div');
                        fareCard.className = 'fare-card animate__animated animate__fadeInUp';
                        fareCard.innerHTML = `
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h4 class="text-center mb-0">
                                        <i class="fas fa-ticket-alt me-2"></i>Metro Fare Details
                                    </h4>
                                </div>
                                <div class="card-body">
                                    <div class="fare-box">
                                        <div class="fare-content">
                                            <div class="fare-value">
                                                <i class="fas fa-rupee-sign"></i>
                                                <span>${fareInfo.fare}</span>
                                            </div>
                                            <div class="fare-route-info">
                                                <div class="station from">
                                                    <i class="fas fa-subway"></i>
                                                    <span>${fareInfo.origin_station || currentMetro.station}</span>
                                                </div>
                                                <div class="route-connector">
                                                    <div class="connector-line"></div>
                                                </div>
                                                <div class="station to">
                                                    <i class="fas fa-subway"></i>
                                                    <span>${fareInfo.destination_station || destinationMetro.station}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="estimated-time">
                                            <i class="fas fa-clock"></i>
                                            <span>${fareInfo.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        // Add the fare card before the journey summary
                        const mainCard = document.querySelector('.main-card');
                        const summarySection = document.querySelector('.summary-section');
                        if (mainCard && summarySection) {
                            // Remove any existing fare card
                            const existingFareCard = document.querySelector('.fare-card');
                            if (existingFareCard) {
                                existingFareCard.remove();
                            }
                            // Insert the fare card before the summary section
                            summarySection.parentNode.insertBefore(fareCard, summarySection);
                        }

                        // Send distance information to backend for logging
                        try {
                            console.log('Sending distance to backend...');
                            const response = await fetch('/log_metro_distance', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    destination_station: destinationMetro.station,
                                    current_station: currentMetro.station,
                                    distance: fareInfo.distance,
                                    adjusted_distance: fareInfo.adjusted_distance,
                                    duration: fareInfo.duration,
                                    fare: fareInfo.fare
                                })
                            });
                            
                            if (!response.ok) {
                                console.error('Failed to log distance to backend');
                            } else {
                                console.log('Distance and fare successfully logged to backend');
                            }
                        } catch (error) {
                            console.error('Error sending distance to backend:', error);
                        }
                    } catch (error) {
                        console.error('Error calculating fare:', error);
                        showError('Failed to calculate fare. Please try again.');
                    }
                }
            }

            // Show map
            showMap();

        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while searching for stations');
        } finally {
            hideLoading();
        }
    }

    // Function to get driving duration
    async function getDrivingDuration(originLat, originLng, destLat, destLng) {
        return new Promise((resolve, reject) => {
            if (!directionsService) {
                resolve('N/A');
                return;
            }

            const request = {
                origin: { lat: originLat, lng: originLng },
                destination: { lat: destLat, lng: destLng },
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, (result, status) => {
                if (status === 'OK' && result.routes[0]) {
                    const duration = result.routes[0].legs[0].duration.text;
                    resolve(duration);
                } else {
                    resolve('N/A');
                }
            });
        });
    }

    // Helper function to calculate distance
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // Distance in km
        return distance < 1 ? 
            `${Math.round(distance * 1000)}m` : 
            `${distance.toFixed(1)}km`;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Function to get metro line color
    function getMetroLine(stationName) {
        const purpleLineStations = [
            'whitefield', 'kadugodi', 'channasandra', 'kadugodi tree park', 'pattandur agrahara',
            'sri sathya sai hospital', 'nallurhalli', 'kundalahalli', 'seetharam palya', 'hoodi junction',
            'garudacharpalya', 'mahadevapura', 'krishnarajapuram', 'benniganahalli', 'baiyappanahalli',
            'swami vivekananda road', 'indiranagar', 'halasuru', 'trinity', 'mahatma gandhi road',
            'cubbon park', 'dr. br ambedkar station', 'vidhana soudha', 'sir m. visveshwaraya station',
            'central college', 'nadaprabhu kempegowda station', 'majestic', 'krantivira sangolli rayanna',
            'magadi road', 'balagangadharanatha swamiji station', 'hosahalli', 'vijayanagara',
            'attiguppe', 'deepanjali nagara', 'mysuru road', 'nayandahalli'
        ];

        const greenLineStations = [
            'nagawara', 'rajarajeshwari nagar', 'jnanabharathi', 'pattanagere', 'kengeri',
            'kengeri bus terminal', 'challaghatta', 'madavara', 'chikkabidarakallu',
            'manjunathanagara', 'nagasandra', 'dasarahalli', 'jalahalli', 'peenya industry',
            'peenya', 'goraguntepalya', 'yeshwanthpur', 'sandal soap factory', 'mahalakshmi',
            'rajajinagara', 'mahakavi kuvempu road', 'srirampura', 'mantri square sampige road',
            'chickpete', 'krishna rajendra market', 'national college', 'lalbagh', 'south end circle',
            'jayanagara', 'rashtreeya vidyalaya road', 'banashankari', 'jayaprakash nagara',
            'yelachenahalli', 'konanakunte cross', 'doddakallasandra', 'vajarahalli',
            'thalaghattapura', 'silk institute'
        ];

        const stationNameLower = stationName.toLowerCase();
        
        if (purpleLineStations.some(station => stationNameLower.includes(station))) {
            return {
                name: 'Purple Line',
                color: '#9b59b6'
            };
        } else if (greenLineStations.some(station => stationNameLower.includes(station))) {
            return {
                name: 'Green Line',
                color: '#2ecc71'
            };
        }
        
        return {
            name: 'Unknown Line',
            color: '#34495e'
        };
    }

    // Function to display results
    function displayResults(data, sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) {
            console.error(`Section ${sectionId} not found`);
            return;
        }

        // Show the section
        section.style.display = 'block';

        const contentDiv = section.querySelector('.result-content');
        if (!contentDiv) {
            console.error('Result content div not found');
            return;
        }

        // Clear previous content
        contentDiv.innerHTML = '';

        // Create main card
        const mainCard = document.createElement('div');
        mainCard.className = 'main-card mb-4';

        // Add header
        const header = document.createElement('h4');
        header.className = 'text-center mb-3';
        header.innerHTML = `<i class="fas fa-map-marker-alt text-primary me-2"></i>Nearest Metro Station`;
        mainCard.appendChild(header);

        // Add only the first (nearest) station
        if (data.results && data.results.length > 0) {
            const firstResult = data.results[0];
            const metroLine = getMetroLine(firstResult.station);
            const stationCard = createStationCard(firstResult, 1);
            mainCard.appendChild(stationCard);

            if (sectionId === 'searchedLocation') {
                document.getElementById('nearestMetro').textContent = firstResult.station;
                document.getElementById('walkingDistance').textContent = firstResult.formatted_distance;
                document.getElementById('walkingTime').textContent = firstResult.formatted_duration;
                document.getElementById('metroLine').textContent = metroLine.name;
                document.getElementById('metroLine').style.color = metroLine.color;
                document.querySelector('.summary-item:nth-child(2) h4').textContent = 'Distance';
                document.querySelector('.summary-item:nth-child(3) h4').textContent = 'Time';
                destinationRoute = firstResult;
                // Create and show the View Map button
                const viewMapBtn = document.createElement('button');
                viewMapBtn.id = 'viewMapBtn';
                viewMapBtn.className = 'btn btn-primary mt-3 w-100';
                viewMapBtn.innerHTML = '<i class="fas fa-map-marked-alt me-2"></i>View Map';
                viewMapBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (destinationRoute) {
                        showRoute(destinationRoute, 'destinationMap');
                        const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
                        mapModal.show();
                    }
                });
                mainCard.appendChild(viewMapBtn);
            } else if (sectionId === 'currentLocation') {
                currentLocationRoute = firstResult;
                // Create and show the View Map button for current location
                const viewMapBtn = document.createElement('button');
                viewMapBtn.id = 'viewCurrentMapBtn';
                viewMapBtn.className = 'btn btn-primary mt-3 w-100';
                viewMapBtn.innerHTML = '<i class="fas fa-map-marked-alt me-2"></i>View Map';
                viewMapBtn.style.display = 'block';
                viewMapBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (currentLocationRoute) {
                        showRoute(currentLocationRoute, 'currentMap');
                        const currentMapModal = new bootstrap.Modal(document.getElementById('currentMapModal'));
                        currentMapModal.show();
                    }
                });
                mainCard.appendChild(viewMapBtn);
            }
        } else {
            const noResults = document.createElement('p');
            noResults.className = 'text-center text-muted';
            noResults.textContent = 'No metro stations found nearby';
            mainCard.appendChild(noResults);
        }

        contentDiv.appendChild(mainCard);
    }

    // Function to create station card
    function createStationCard(result, index) {
        const metroLine = getMetroLine(result.station);
        const card = document.createElement('div');
        card.className = 'station-card animate__animated animate__fadeInUp';
        
        card.innerHTML = `
            <div class="station-info">
                <div class="station-name">
                    <i class="fas fa-subway me-2" style="color: ${metroLine.color}"></i>
                    <strong>${result.station}</strong>
                </div>
                <div class="station-details">
                    <div class="station-line" style="color: ${metroLine.color}">
                        <i class="fas fa-train me-2"></i>
                        ${metroLine.name}
                    </div>
                    <div class="station-distance">
                        <i class="fas fa-car me-2"></i>
                        ${result.formatted_distance}
                    </div>
                    <div class="station-time">
                        <i class="fas fa-clock me-2"></i>
                        ${result.formatted_duration}
                    </div>
                </div>
            </div>
        `;

        // Add click handler to show route
        card.addEventListener('click', () => {
            showRoute(result, 'destinationMap');
            // Show the map modal
            const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
            mapModal.show();
        });

        return card;
    }

    // Function to create marker content
    function createMarkerContent(title, color = '#4285F4', size = 10) {
        const div = document.createElement('div');
        div.style.width = `${size}px`;
        div.style.height = `${size}px`;
        div.style.backgroundColor = color;
        div.style.borderRadius = '50%';
        div.style.border = '2px solid white';
        div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        div.title = title;
        return div;
    }

    // Function to clear markers
    window.clearMarkers = function() {
        markers.forEach(marker => marker.map = null);
        markers = [];
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
        }
        if (currentDirectionsRenderer) {
            currentDirectionsRenderer.setDirections({ routes: [] });
        }
    };

    // Function to show route
    window.showRoute = function(result, mapType) {
        if (!directionsService) {
            console.error('Directions service not initialized');
            return;
        }

        const renderer = mapType === 'currentMap' ? currentDirectionsRenderer : directionsRenderer;
        const targetMap = mapType === 'currentMap' ? currentMap : map;

        if (!renderer || !targetMap) {
            console.error('Map or directions renderer not initialized');
            return;
        }

        // Store the current route data
        currentRoute = result;

        const request = {
            origin: { lat: result.origin_lat, lng: result.origin_lng },
            destination: { lat: result.lat, lng: result.lng },
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };

        directionsService.route(request, function(response, status) {
            if (status === 'OK') {
                // Clear existing markers
                clearMarkers();

                // Add markers for origin and destination
                addLocationMarker(
                    { lat: result.origin_lat, lng: result.origin_lng },
                    mapType === 'currentMap' ? 'Current Location' : 'Your Destination',
                    targetMap
                );
                addStationMarker(result, targetMap);

                // Set the directions
                renderer.setDirections(response);

                // Center the map on the route
                const bounds = new google.maps.LatLngBounds();
                response.routes[0].legs.forEach(leg => {
                    bounds.extend(leg.start_location);
                    bounds.extend(leg.end_location);
                });
                targetMap.fitBounds(bounds);

                // Add a small padding to the bounds
                const padding = {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50
                };
                targetMap.panBy(padding.left, padding.top);
            } else {
                console.error('Directions request failed:', status);
                showError('Failed to show route. Please try again.');
            }
        });
    };

    // Function to add location marker
    window.addLocationMarker = function(location, title, targetMap) {
        if (!targetMap) return;

        const markerView = new google.maps.marker.AdvancedMarkerElement({
            map: targetMap,
            position: location,
            title: title,
            content: createMarkerContent(title, '#4285F4', 10),
            gmpDraggable: false
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="info-window"><strong>${title}</strong></div>`
        });

        markerView.addListener('click', () => {
            infoWindow.open(targetMap, markerView);
        });

        markers.push(markerView);
        return markerView;
    };

    // Function to add station marker
    window.addStationMarker = function(result, targetMap) {
        if (!targetMap) return;

        const markerView = new google.maps.marker.AdvancedMarkerElement({
            map: targetMap,
            position: { lat: result.lat, lng: result.lng },
            title: result.station,
            content: createMarkerContent(result.station, getLineColor(result.line), 8),
            gmpDraggable: false
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <strong>${result.station}</strong><br>
                    <span style="color: ${getLineColor(result.line)}">${result.line}</span><br>
                    <small>${result.formatted_distance} away</small>
                </div>
            `
        });

        markerView.addListener('click', () => {
            infoWindow.open(targetMap, markerView);
        });

        markers.push(markerView);
        return markerView;
    };

    // Function to show map
    function showMap() {
        const mapContainer = document.getElementById('map');
        mapContainer.style.display = 'block';
        if (map) {
            google.maps.event.trigger(map, 'resize');
        }
    }

    // Helper functions
    function getLineClass(line) {
        const lineClasses = {
            'Purple Line': 'line-purple',
            'Green Line': 'line-green',
            'Blue Line': 'line-blue',
            'Red Line': 'line-red',
            'Yellow Line': 'line-yellow'
        };
        return lineClasses[line] || '';
    }

    function getLineColor(line) {
        const lineColors = {
            'Purple Line': '#9b59b6',
            'Green Line': '#2ecc71',
            'Blue Line': '#3498db',
            'Red Line': '#e74c3c',
            'Yellow Line': '#f1c40f'
        };
        return lineColors[line] || '#34495e';
    }

    function showError(message) {
        if (errorDiv) {
            errorDiv.classList.remove('d-none');
            errorDiv.textContent = message;
        }
    }

    function hideError() {
        if (errorDiv) {
            errorDiv.classList.add('d-none');
        }
    }

    function showLoading() {
        if (loadingDiv) {
            loadingDiv.classList.remove('d-none');
        }
    }

    function hideLoading() {
        if (loadingDiv) {
            loadingDiv.classList.add('d-none');
        }
    }

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .main-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .station-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #007bff;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .station-card:hover {
            transform: translateX(5px);
        }
        
        .station-info {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .station-name {
            font-size: 1.1em;
            color: #333;
        }
        
        .station-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
            color: #666;
        }
        
        .line-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        
        .line-purple { background-color: #9b59b6; }
        .line-green { background-color: #2ecc71; }
        .line-blue { background-color: #3498db; }
        .line-red { background-color: #e74c3c; }
        .line-yellow { background-color: #f1c40f; }
        
        #map {
            height: 500px;
            width: 100%;
            border-radius: 10px;
            overflow: hidden;
        }

        #viewMapBtn, #viewCurrentMapBtn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5em;
            width: 100%;
            padding: 12px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.2s;
            margin-top: 20px;
        }

        #viewMapBtn:hover, #viewCurrentMapBtn:hover {
            background-color: #0056b3;
            transform: translateY(-2px);
        }

        #viewMapBtn:active, #viewCurrentMapBtn:active {
            transform: translateY(0);
        }

        .info-window {
            padding: 8px;
            font-family: 'Poppins', sans-serif;
        }

        .info-window strong {
            color: #333;
            display: block;
            margin-bottom: 4px;
        }

        .info-window small {
            color: #666;
        }

        .fare-card {
            margin: 20px 0;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border-radius: 20px;
            overflow: hidden;
        }

        .fare-card .card {
            border: none;
            border-radius: 20px;
        }

        .fare-card .card-header {
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
            padding: 15px;
            border-bottom: none;
        }

        .fare-card .card-header h4 {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
            color: white;
        }

        .fare-card .card-body {
            padding: 20px;
            background-color: #f8f9fa;
        }

        .fare-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }

        .fare-content {
            display: flex;
            align-items: center;
            gap: 20px;
            flex: 1;
        }

        .fare-value {
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 2rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            white-space: nowrap;
            transition: all 0.3s ease;
        }

        .fare-value:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }

        .fare-value i {
            font-size: 1.5rem;
        }

        .fare-route-info {
            display: flex;
            flex-direction: column;
            gap: 15px;
            flex: 1;
        }

        .station {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 10px 20px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }

        .station:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .station i {
            color: #FF6B6B;
            font-size: 1.2rem;
        }

        .station span {
            font-weight: 500;
            color: #2D3436;
        }

        .route-connector {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .connector-line {
            width: 2px;
            height: 30px;
            background: linear-gradient(to bottom, #FF6B6B, #FF8E53);
            margin: 5px 0;
        }

        .station.from {
            border-left: 4px solid #FF6B6B;
        }

        .station.to {
            border-left: 4px solid #FF8E53;
        }

        .estimated-time {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            white-space: nowrap;
            transition: all 0.3s ease;
        }

        .estimated-time:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .estimated-time i {
            color: #FF6B6B;
            font-size: 1.1rem;
        }

        .estimated-time span {
            font-weight: 500;
            color: #2D3436;
        }

        @media (max-width: 992px) {
            .fare-box {
                flex-direction: column;
                align-items: stretch;
            }

            .fare-content {
                flex-direction: column;
            }

            .fare-value {
                width: 100%;
                justify-content: center;
            }

            .estimated-time {
                width: 100%;
                justify-content: center;
            }
        }

        @media (max-width: 576px) {
            .fare-value {
                font-size: 1.5rem;
                padding: 12px 25px;
            }

            .station {
                padding: 8px 15px;
            }

            .estimated-time {
                padding: 8px 15px;
            }
        }
    `;
    document.head.appendChild(style);

    // Function to calculate fare based on metro travel distance
    async function calculateFare(originStation, destinationStation) {
        try {
            console.log('Calculating fare between stations:', {
                origin: originStation,
                destination: destinationStation
            });

            // Clean up station names
            const cleanStationName = (name) => {
                return name
                    .replace(/\([^)]*\)/g, '') // Remove text in parentheses
                    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
                    .trim();                    // Remove leading/trailing spaces
            };

            const cleanOrigin = cleanStationName(originStation);
            const cleanDestination = cleanStationName(destinationStation);

            console.log('Cleaned station names:', {
                origin: cleanOrigin,
                destination: cleanDestination
            });

            const response = await fetch('/get_metro_distance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin_station: cleanOrigin,
                    destination_station: cleanDestination
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from server:', errorData);
                throw new Error(errorData.error || 'Failed to get metro distance');
            }

            const data = await response.json();
            console.log('Received distance data:', data);

            const distanceInKm = data.distance / 1000; // Convert meters to kilometers
            console.log('Distance in kilometers:', distanceInKm);
            
            // Fare calculation based on track distance
            const fareRanges = [
                { min: 0, max: 2, fare: 10 },
                { min: 2, max: 4, fare: 20 },
                { min: 4, max: 6, fare: 30 },
                { min: 6, max: 8, fare: 40 },
                { min: 8, max: 10, fare: 50 },
                { min: 10, max: 15, fare: 60 },
                { min: 15, max: 20, fare: 70 },
                { min: 20, max: 25, fare: 80 },
                { min: 25, max: 30, fare: 90 },
                { min: 30, max: Infinity, fare: 90 }
            ];

            let fare = 90; // Default fare for distances over 30 km
            for (const range of fareRanges) {
                if (distanceInKm > range.min && distanceInKm <= range.max) {
                    fare = range.fare;
                    break;
                }
            }

            return {
                fare: fare,
                distance: data.formatted_distance,
                duration: data.formatted_duration,
                origin_station: data.origin_station,
                destination_station: data.destination_station
            };
        } catch (error) {
            console.error('Error calculating fare:', error);
            throw error;
        }
    }
});
