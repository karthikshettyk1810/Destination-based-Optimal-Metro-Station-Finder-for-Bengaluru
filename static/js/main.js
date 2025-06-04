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

            // Process and display results for searched location
            if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
                const processedSearchResults = {
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
                const processedCurrentResults = {
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
    `;
    document.head.appendChild(style);
});
