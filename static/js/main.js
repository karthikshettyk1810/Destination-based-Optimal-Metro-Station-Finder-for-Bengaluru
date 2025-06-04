document.addEventListener('DOMContentLoaded', function() {
    // Metro stations data with coordinates
    const metroStations = [
        {
            name: "Whitefield (Kadugodi)",
            latitude: 12.99507,
            longitude: 77.75777
        },
        {
            name: "Channasandra",
            latitude: 12.98793,
            longitude: 77.75409
        },
        {
            name: "Kadugodi Tree Park",
            latitude: 12.98565,
            longitude: 77.74690
        },
        {
            name: "Pattandur Agrahara",
            latitude: 12.987613,
            longitude: 77.738211
        },
        {
            name: "Sri Sathya Sai Hospital",
            latitude: 12.98102,
            longitude: 77.72762
        },
        {
            name: "Nallurhalli",
            latitude: 12.976528,
            longitude: 77.724763
        },
        {
            name: "Kundalahalli",
            latitude: 12.977461,
            longitude: 77.715761
        },
        {
            name: "Seetharam Palya",
            latitude: 12.98092,
            longitude: 77.70887
        },
        {
            name: "Hoodi Junction",
            latitude: 12.98873,
            longitude: 77.71127
        },
        {
            name: "Garudacharpalya",
            latitude: 12.9953,
            longitude: 77.7011
        },
        {
            name: "Mahadevapura",
            latitude: 12.99678,
            longitude: 77.69217
        },
        {
            name: "Krishnarajapuram",
            latitude: 12.99999,
            longitude: 77.67794
        },
        {
            name: "Benniganahalli",
            latitude: 12.9910,
            longitude: 77.6630
        },
        {
            name: "Baiyappanahalli",
            latitude: 12.991056,
            longitude: 77.641806
        },
        {
            name: "Swami Vivekananda Road",
            latitude: 12.985833,
            longitude: 77.645000
        },
        {
            name: "Indiranagar",
            latitude: 12.978611,
            longitude: 77.638889
        },
        {
            name: "Halasuru",
            latitude: 12.975694,
            longitude: 77.626306
        },
        {
            name: "Trinity",
            latitude: 12.973056,
            longitude: 77.616944
        },
        {
            name: "Mahatma Gandhi Road",
            latitude: 12.975556,
            longitude: 77.606944
        },
        {
            name: "Cubbon Park",
            latitude: 12.981095,
            longitude: 77.596860
        },
        {
            name: "Dr. BR Ambedkar Station (Vidhana Soudha)",
            latitude: 12.979823,
            longitude: 77.592745
        },
        {
            name: "Sir M. Visveshwaraya Station, Central College",
            latitude: 12.974104,
            longitude: 77.584017
        },
        {
            name: "Nadaprabhu Kempegowda station, Majestic",
            latitude: 12.975692,
            longitude: 77.572836
        },
        {
            name: "Krantivira Sangolli Rayanna Railway Station",
            latitude: 12.975814,
            longitude: 77.565708
        },
        {
            name: "Magadi Road",
            latitude: 12.975578,
            longitude: 77.555430
        },
        {
            name: "Balagangadharanatha Swamiji Station, Hosahalli",
            latitude: 12.974178,
            longitude: 77.545540
        },
        {
            name: "Vijayanagara",
            latitude: 12.970801,
            longitude: 77.537285
        },
        {
            name: "Attiguppe",
            latitude: 12.961957,
            longitude: 77.533582
        },
        {
            name: "Deepanjali Nagara",
            latitude: 12.952187,
            longitude: 77.536939
        },
        {
            name: "Mysuru Road",
            latitude: 12.946507,
            longitude: 77.529780
        },
        {
            name: "Nayandahalli",
            latitude: 12.946818,
            longitude: 77.531320
        },
        {
            name: "Nagawara",
            latitude: 13.04051,
            longitude: 77.62466
        },
        {
            name: "Rajarajeshwari Nagar",
            latitude: 12.936727,
            longitude: 77.519582
        },
        {
            name: "Jnanabharathi",
            latitude: 12.935561,
            longitude: 77.512019
        },
        {
            name: "Pattanagere",
            latitude: 12.924411,
            longitude: 77.498261
        },
        {
            name: "Kengeri",
            latitude: 12.9080,
            longitude: 77.4765
        },
        {
            name: "Kengeri Bus Terminal",
            latitude: 12.9145367,
            longitude: 77.4875516
        },
        {
            name: "Challaghatta",
            latitude: 12.89742,
            longitude: 77.46124
        },
        {
            name: "Madavara",
            latitude: 13.0575,
            longitude: 77.4729
        },
        {
            name: "Chikkabidarakallu",
            latitude: 13.0525,
            longitude: 77.488056
        },
        {
            name: "Manjunathanagara",
            latitude: 13.05,
            longitude: 77.494444
        },
        {
            name: "Nagasandra",
            latitude: 13.048056,
            longitude: 77.5
        },
        {
            name: "Dasarahalli",
            latitude: 13.043611,
            longitude: 77.5125
        },
        {
            name: "Jalahalli",
            latitude: 13.039444,
            longitude: 77.519722
        },
        {
            name: "Peenya Industry",
            latitude: 13.036389,
            longitude: 77.525556
        },
        {
            name: "Peenya",
            latitude: 13.033056,
            longitude: 77.533333
        },
        {
            name: "Goraguntepalya",
            latitude: 13.028333,
            longitude: 77.540833
        },
        {
            name: "Yeshwanthpur",
            latitude: 13.023056,
            longitude: 77.55
        },
        {
            name: "Sandal Soap Factory",
            latitude: 13.014707,
            longitude: 77.553962
        },
        {
            name: "Mahalakshmi",
            latitude: 13.008217,
            longitude: 77.548821
        },
        {
            name: "Rajajinagara",
            latitude: 13.000334,
            longitude: 77.549701
        },
        {
            name: "Mahakavi Kuvempu Road",
            latitude: 12.998456,
            longitude: 77.556951
        },
        {
            name: "Srirampura",
            latitude: 12.996508,
            longitude: 77.563283
        },
        {
            name: "Mantri Square Sampige Road",
            latitude: 12.990508,
            longitude: 77.570729
        },
        {
            name: "Chickpete",
            latitude: 12.966759,
            longitude: 77.574782
        },
        {
            name: "Krishna Rajendra Market",
            latitude: 12.961353,
            longitude: 77.574571
        },
        {
            name: "National College",
            latitude: 12.950548,
            longitude: 77.573712
        },
        {
            name: "Lalbagh",
            latitude: 12.946355,
            longitude: 77.580050
        },
        {
            name: "South End Circle",
            latitude: 12.93538,
            longitude: 77.5801
        },
        {
            name: "Jayanagara",
            latitude: 12.938237,
            longitude: 77.580076
        },
        {
            name: "Rashtreeya Vidyalaya Road",
            latitude: 12.921458,
            longitude: 77.580375
        },
        {
            name: "Banashankari",
            latitude: 12.915649,
            longitude: 77.573631
        },
        {
            name: "Jayaprakash Nagara",
            latitude: 12.907299,
            longitude: 77.573133
        },
        {
            name: "Yelachenahalli",
            latitude: 12.895983,
            longitude: 77.570159
        },
        {
            name: "Konanakunte Cross",
            latitude: 12.884722,
            longitude: 77.552778
        },
        {
            name: "Doddakallasandra",
            latitude: 12.884714,
            longitude: 77.552846
        },
        {
            name: "Vajarahalli",
            latitude: 12.877455,
            longitude: 77.544594
        },
        {
            name: "Thalaghattapura",
            latitude: 12.871667,
            longitude: 77.540833
        },
        {
            name: "Silk Institute",
            latitude: 12.861944,
            longitude: 77.530000
        }
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

<<<<<<< HEAD
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

=======
>>>>>>> 808b316 (GMaps Integartion)
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
<<<<<<< HEAD
}); 
=======

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
>>>>>>> 808b316 (GMaps Integartion)
