import os
from dotenv import load_dotenv
from typing import Optional, Dict, List, Tuple, NamedTuple
import requests
import time
import math
from dataclasses import dataclass
import asyncio
import aiohttp
import ssl
import certifi
from concurrent.futures import ThreadPoolExecutor, as_completed, wait
import logging
from datetime import datetime, timedelta
import threading
from collections import deque
import random
import json
import overpy
from overpy import Overpass
from overpy.exception import OverpassBadRequest, OverpassTooManyRequests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(verbose=True)

# Configuration
LOCATIONIQ_KEY = os.getenv("LOCATIONIQ_KEY")
OSRM_URL = os.getenv("OSRM_URL", "https://router.project-osrm.org")
OVERPASS_API_URL = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")

# SSL Context configuration
ssl_context = ssl.create_default_context(cafile=certifi.where())

# Initialize Overpass API
overpass = Overpass(url=OVERPASS_API_URL)

# Debug: Print environment variables
logger.info("Environment variables:")
logger.info(f"LOCATIONIQ_KEY exists: {LOCATIONIQ_KEY is not None}")
logger.info(f"OSRM_URL: {OSRM_URL}")

# Try to load from .env file directly if not found
if not LOCATIONIQ_KEY:
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('LOCATIONIQ_KEY='):
                    LOCATIONIQ_KEY = line.strip().split('=', 1)[1]
                    logger.info(f"Found LOCATIONIQ_KEY in .env file: {LOCATIONIQ_KEY[:5]}...")
                    break
    except FileNotFoundError:
        logger.info("No .env file found")
    except Exception as e:
        logger.error(f"Error reading .env file: {str(e)}")

if not LOCATIONIQ_KEY:
    raise ValueError("LOCATIONIQ_KEY environment variable is not set. Please create a .env file with LOCATIONIQ_KEY=your_key")

def lookup_line(station_name: str) -> str:
    """Return the line name for a given station"""
    return station_lines.get(station_name, "Under Construction")

# Metro stations dictionary with coordinates
metro_stations = {
    "Whitefield (Kadugodi)": (12.99507, 77.75777),
    "Channasandra": (12.98793, 77.75409),
    "Kadugodi Tree Park": (12.98565, 77.74690),
    "Pattandur Agrahara": (12.987613, 77.738211),
    "Sri Sathya Sai Hospital": (12.98102, 77.72762),
    "Nallurhalli": (12.976528, 77.724763),
    "Kundalahalli": (12.977461, 77.715761),
    "Seetharam Palya": (12.98092, 77.70887),
    "Hoodi Junction": (12.98873, 77.71127),
    "Garudacharpalya": (12.9953, 77.7011),
    "Mahadevapura": (12.99678, 77.69217),
    "Krishnarajapuram": (12.99999, 77.67794),
    "Benniganahalli": (12.9910, 77.6630),
    "Baiyappanahalli": (12.991056, 77.641806),
    "Swami Vivekananda Road": (12.985833, 77.645000),
    "Indiranagar": (12.978611, 77.638889),
    "Halasuru": (12.975694, 77.626306),
    "Trinity": (12.973056, 77.616944),
    "Mahatma Gandhi Road": (12.975556, 77.606944),
    "Cubbon Park": (12.981095, 77.596860),
    "Dr. BR Ambedkar Station (Vidhana Soudha)": (12.979823, 77.592745),
    "Sir M. Visveshwaraya Station, Central College": (12.974104, 77.584017),
    "Nadaprabhu Kempegowda station, Majestic": (12.975692, 77.572836),
    "Krantivira Sangolli Rayanna Railway Station": (12.975814, 77.565708),
    "Magadi Road": (12.975578, 77.555430),
    "Balagangadharanatha Swamiji Station, Hosahalli": (12.974178, 77.545540),
    "Vijayanagara": (12.970801, 77.537285),
    "Attiguppe": (12.961957, 77.533582),
    "Deepanjali Nagara": (12.952187, 77.536939),
    "Mysuru Road": (12.946507, 77.529780),
    "Nayandahalli": (12.946818, 77.531320),
    "Nagawara": (13.04051, 77.62466),
    "Rajarajeshwari Nagar": (12.936727, 77.519582),
    "Jnanabharathi": (12.935561, 77.512019),
    "Pattanagere": (12.924411, 77.498261),
    "Kengeri": (12.9080, 77.4765),
    "Kengeri Bus Terminal": (12.9145367, 77.4875516),
    "Challaghatta": (12.89742, 77.46124),
    "Madavara": (13.0575, 77.4729),
    "Chikkabidarakallu": (13.0525, 77.488056),
    "Manjunathanagara": (13.05, 77.494444),
    "Nagasandra": (13.048056, 77.5),
    "Dasarahalli": (13.043611, 77.5125),
    "Jalahalli": (13.039444, 77.519722),
    "Peenya Industry": (13.036389, 77.525556),
    "Peenya": (13.033056, 77.533333),
    "Goraguntepalya": (13.028333, 77.540833),
    "Yeshwanthpur": (13.023056, 77.55),
    "Sandal Soap Factory": (13.014707, 77.553962),
    "Mahalakshmi": (13.008217, 77.548821),
    "Rajajinagara": (13.000334, 77.549701),
    "Mahakavi Kuvempu Road": (12.998456, 77.556951),
    "Srirampura": (12.996508, 77.563283),
    "Mantri Square Sampige Road": (12.990508, 77.570729),
    "Chickpete": (12.966759, 77.574782),
    "Krishna Rajendra Market": (12.961353, 77.574571),
    "National College": (12.950548, 77.573712),
    "Lalbagh": (12.946355, 77.580050),
    "South End Circle": (12.93538, 77.5801),
    "Jayanagara": (12.938237, 77.580076),
    "Rashtreeya Vidyalaya Road": (12.921458, 77.580375),
    "Banashankari": (12.915649, 77.573631),
    "Jayaprakash Nagara": (12.907299, 77.573133),
    "Yelachenahalli": (12.895983, 77.570159),
    "Konanakunte Cross": (12.884722, 77.552778),
    "Doddakallasandra": (12.884714, 77.552846),
    "Vajarahalli": (12.877455, 77.544594),
    "Thalaghattapura": (12.871667, 77.540833),
    "Silk Institute": (12.861944, 77.530000)
}

# Station to line mapping
station_lines = {
    "Whitefield (Kadugodi)": "Purple Line",
    "Channasandra": "Purple Line",
    "Kadugodi Tree Park": "Purple Line",
    "Pattandur Agrahara": "Purple Line",
    "Sri Sathya Sai Hospital": "Purple Line",
    "Nallurhalli": "Purple Line",
    "Kundalahalli": "Purple Line",
    "Seetharam Palya": "Purple Line",
    "Hoodi Junction": "Purple Line",
    "Garudacharpalya": "Purple Line",
    "Mahadevapura": "Purple Line",
    "Krishnarajapuram": "Purple Line",
    "Benniganahalli": "Purple Line",
    "Baiyappanahalli": "Purple Line",
    "Swami Vivekananda Road": "Purple Line",
    "Indiranagar": "Purple Line",
    "Halasuru": "Purple Line",
    "Trinity": "Purple Line",
    "Mahatma Gandhi Road": "Purple Line",
    "Cubbon Park": "Purple Line",
    "Dr. BR Ambedkar Station (Vidhana Soudha)": "Purple Line",
    "Sir M. Visveshwaraya Station, Central College": "Purple Line",
    "Nadaprabhu Kempegowda station, Majestic": "Purple Line",
    "Krantivira Sangolli Rayanna Railway Station": "Purple Line",
    "Magadi Road": "Purple Line",
    "Balagangadharanatha Swamiji Station, Hosahalli": "Purple Line",
    "Vijayanagara": "Purple Line",
    "Attiguppe": "Purple Line",
    "Deepanjali Nagara": "Purple Line",
    "Mysuru Road": "Purple Line",
    "Nayandahalli": "Purple Line",
    "Rajarajeshwari Nagar": "Purple Line",
    "Jnanabharathi": "Purple Line",
    "Pattanagere": "Purple Line",
    "Kengeri": "Purple Line",
    "Kengeri Bus Terminal": "Purple Line",
    "Challaghatta": "Purple Line",
    "Madavara": "Green Line",
    "Chikkabidarakallu": "Green Line",
    "Manjunathanagara": "Green Line",
    "Nagasandra": "Green Line",
    "Dasarahalli": "Green Line",
    "Jalahalli": "Green Line",
    "Peenya Industry": "Green Line",
    "Peenya": "Green Line",
    "Goraguntepalya": "Green Line",
    "Yeshwanthpur": "Green Line",
    "Sandal Soap Factory": "Green Line",
    "Mahalakshmi": "Green Line",
    "Rajajinagara": "Green Line",
    "Mahakavi Kuvempu Road": "Green Line",
    "Srirampura": "Green Line",
    "Mantri Square Sampige Road": "Green Line",
    "Chickpete": "Green Line",
    "Krishna Rajendra Market": "Green Line",
    "National College": "Green Line",
    "Lalbagh": "Green Line",
    "South End Circle": "Green Line",
    "Jayanagara": "Green Line",
    "Rashtreeya Vidyalaya Road": "Green Line",
    "Banashankari": "Green Line",
    "Jayaprakash Nagara": "Green Line",
    "Yelachenahalli": "Green Line",
    "Konanakunte Cross": "Green Line",
    "Doddakallasandra": "Green Line",
    "Vajarahalli": "Green Line",
    "Thalaghattapura": "Green Line",
    "Silk Institute": "Green Line"
}

# Normalize station names for case-insensitive matching
normalized_stations = {name.lower().strip(): name for name in metro_stations.keys()}

@dataclass
class StationInfo:
    """Information about a metro station"""
    name: str
    coordinates: Tuple[float, float]
    haversine_distance: float
    walking_distance: Optional[int] = None
    walking_duration: Optional[int] = None
    is_osrm: bool = False
    line: str = "Unknown Line"

@dataclass
class POIInfo:
    """Information about a Point of Interest"""
    name: str
    poi_type: str
    coordinates: Tuple[float, float]
    haversine_distance: float
    walking_distance: Optional[int] = None
    walking_duration: Optional[int] = None
    is_osrm: bool = False

class GeocodingResult(NamedTuple):
    """Result of geocoding operation"""
    coordinates: Tuple[float, float]
    formatted_address: str
    confidence: float

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth"""
    R = 6371000  # Earth's radius in meters
    
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Calculate distance in meters
    distance = R * c
    
    # Add a small buffer to account for walking paths (typically 1.3x straight line)
    walking_buffer = 1.3
    return distance * walking_buffer

def estimate_walking_time(distance_meters: float) -> int:
    """Estimate walking time based on distance (average walking speed: 5 km/h = 1.39 m/s)"""
    # Convert distance to walking time in seconds
    # Using 5 km/h = 1.39 m/s as standard walking speed
    walking_time_seconds = distance_meters / 1.39
    return int(walking_time_seconds)  # Return seconds directly

def format_duration(seconds: int) -> str:
    """Format duration in seconds to a human-readable string"""
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    
    if minutes == 0:
        return f"{remaining_seconds} sec"
    elif remaining_seconds == 0:
        return f"{minutes} min"
    else:
        return f"{minutes} min {remaining_seconds} sec"

async def geocode_location_async(location: str, session: aiohttp.ClientSession) -> GeocodingResult:
    """Get coordinates for a location using LocationIQ API asynchronously"""
    try:
        logger.info(f"🔍 Geocoding location: {location}")
        base_url = "https://us1.locationiq.com/v1/search"
        
        params = {
            "key": LOCATIONIQ_KEY,
            "q": f"{location}, Bangalore",
            "format": "json",
            "limit": 1,
            "addressdetails": 1,
            "normalizecity": 1
        }
        headers = {
            "User-Agent": "NearDest/1.0"
        }
        
        logger.info(f"Making geocoding request for: {location}")
        
        async with session.get(base_url, params=params, headers=headers, timeout=5) as response:
            logger.info(f"Geocoding response status: {response.status}")
            
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Geocoding error response: {error_text}")
                raise ValueError(f"Geocoding API returned status code {response.status}")
                
            data = await response.json()
            logger.info(f"Geocoding response data: {data}")
            
            if data and len(data) > 0:
                try:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    address = data[0].get("display_name", location)
                    importance = float(data[0].get("importance", 0))
                    
                    # Check if coordinates are within Bangalore bounds
                    if 12.8 <= lat <= 13.2 and 77.3 <= lon <= 77.8:
                        coords = (lat, lon)
                        logger.info(f"✅ Found coordinates in Bangalore: {coords}")
                        logger.info(f"Formatted address: {address}")
                        logger.info(f"Location importance: {importance}")
                        return GeocodingResult(coords, address, importance)
                    else:
                        logger.warning(f"⚠️ Found coordinates outside Bangalore: {lat}, {lon}")
                except (KeyError, ValueError) as e:
                    logger.error(f"Error parsing geocoding response: {str(e)}")
                    logger.error(f"Data structure: {data[0]}")
            
            raise ValueError("Could not find valid coordinates in Bangalore for this location")
            
    except Exception as e:
        logger.error(f"Error during geocoding: {str(e)}")
        raise

async def get_nearest_point_on_network(coords: Tuple[float, float], session: aiohttp.ClientSession) -> Optional[Tuple[float, float]]:
    """Get the nearest point on the foot network using OSRM's nearest endpoint"""
    try:
        url = f"{OSRM_URL}/nearest/v1/foot/{coords[1]},{coords[0]}"
        logger.info(f"\n🔍 Finding nearest point on network for coordinates: {coords}")
        logger.info(f"OSRM nearest URL: {url}")
        
        async with session.get(url, timeout=5) as response:
            if response.status == 200:
                data = await response.json()
                if data.get("code") == "Ok":
                    snapped_coords = (float(data["waypoints"][0]["location"][1]), 
                                   float(data["waypoints"][0]["location"][0]))
                    logger.info(f"✅ Found nearest point on network: {snapped_coords}")
                    return snapped_coords
            logger.warning(f"⚠️ Could not find nearest point on network: {response.status}")
            return None
    except aiohttp.ClientConnectorError as e:
        logger.error(f"Connection error to OSRM server: {str(e)}")
        logger.info("Falling back to original coordinates")
        return None
    except Exception as e:
        logger.error(f"Error finding nearest point: {str(e)}")
        return None

# Thread-safe cache for OSRM results
osrm_cache = {}
osrm_cache_lock = threading.Lock()

# Rate limiting configuration
RATE_LIMIT = 8  # Increased from 5 to 8 requests per second
RATE_WINDOW = 1.0  # seconds
request_times = deque(maxlen=RATE_LIMIT)
rate_limit_lock = threading.Lock()

# Batch processing configuration
BATCH_SIZE = 4  # Process stations in batches
MAX_WORKERS = 4  # Optimal number of workers

def wait_for_rate_limit():
    """Implement rate limiting for OSRM requests"""
    with rate_limit_lock:
        now = time.time()
        if len(request_times) == RATE_LIMIT:
            # Wait until the oldest request is RATE_WINDOW seconds old
            wait_time = request_times[0] + RATE_WINDOW - now
            if wait_time > 0:
                time.sleep(wait_time)
        request_times.append(time.time())

def get_osrm_route(origin: Tuple[float, float], dest: Tuple[float, float], max_retries: int = 2) -> Tuple[Optional[int], Optional[int], bool]:
    """Get walking route from OSRM API with retries and rate limiting"""
    cache_key = f"{origin[0]},{origin[1]};{dest[0]},{dest[1]}"
    
    # Check cache first
    with osrm_cache_lock:
        if cache_key in osrm_cache:
            logger.info(f"Cache hit for OSRM route: {cache_key}")
            return osrm_cache[cache_key]
    
    for attempt in range(max_retries + 1):
        try:
            # Apply rate limiting
            wait_for_rate_limit()
            
            url = f"{OSRM_URL}/route/v1/foot/{origin[1]},{origin[0]};{dest[1]},{dest[0]}?overview=false"
            
            # Exponential backoff
            if attempt > 0:
                wait_time = 2 ** attempt
                logger.info(f"Retrying after {wait_time} seconds...")
                time.sleep(wait_time)
            
            # Add timeout and retry logic
            session = requests.Session()
            retry_strategy = requests.adapters.Retry(
                total=3,
                backoff_factor=0.5,
                status_forcelist=[429, 500, 502, 503, 504]
            )
            adapter = requests.adapters.HTTPAdapter(max_retries=retry_strategy)
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            
            response = session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]["legs"][0]
                    distance = round(route["distance"])
                    duration = round(distance / 1.39)  # Calculate based on 5 km/h
                    
                    result = (distance, duration, True)
                    
                    # Cache the result
                    with osrm_cache_lock:
                        osrm_cache[cache_key] = result
                    
                    return result
                else:
                    logger.warning(f"OSRM returned invalid response: {data.get('code')}")
            
            logger.warning(f"OSRM request failed (attempt {attempt + 1}): {response.status_code}")
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout on attempt {attempt + 1}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error on attempt {attempt + 1}: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error on attempt {attempt + 1}: {str(e)}")
    
    # Fallback to Haversine
    logger.warning("Falling back to Haversine distance calculation")
    distance = round(haversine_distance(origin[0], origin[1], dest[0], dest[1]))
    duration = estimate_walking_time(distance)
    result = (distance, duration, False)
    
    # Cache the fallback result
    with osrm_cache_lock:
        osrm_cache[cache_key] = result
    
    return result

def process_station_batch(stations: List[StationInfo], origin_coords: Tuple[float, float]) -> List[StationInfo]:
    """Process a batch of stations in parallel"""
    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Create futures for each station in the batch
        futures = {
            executor.submit(process_station, station, origin_coords): station 
            for station in stations
        }
        
        # Process completed futures
        for future in as_completed(futures):
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as e:
                logger.error(f"Error processing station batch: {str(e)}")
    
    return results

def process_station(station: StationInfo, origin_coords: Tuple[float, float]) -> Optional[StationInfo]:
    """Process a single station with optimized error handling"""
    try:
        logger.info(f"\nCalculating walking route to: {station.name}")
        dist_m, dur_s, is_osrm = get_osrm_route(origin_coords, station.coordinates)
        
        station.walking_distance = dist_m
        station.walking_duration = dur_s
        station.is_osrm = is_osrm
        
        logger.info(f"Route to {station.name}: {dist_m}m, {format_duration(dur_s)}")
        return station
        
    except Exception as e:
        logger.warning(f"⚠️ Warning: Could not get route to {station.name}: {str(e)}")
        # Fallback to Haversine with buffer
        station.walking_distance = round(station.haversine_distance)
        station.walking_duration = estimate_walking_time(station.walking_distance)
        station.is_osrm = False
        return station

async def find_nearest_stations_async(location_coords: Tuple[float, float], stations: Dict[str, Tuple[float, float]], top_n: int = 1) -> List[StationInfo]:
    """Find nearest stations by actual walking distance asynchronously using optimized parallel processing"""
    logger.info(f"\n🔍 Finding nearest stations to coordinates: {location_coords}")
    
    # Configure timeouts and SSL
    timeout = aiohttp.ClientTimeout(total=30, connect=10, sock_read=10)
    connector = aiohttp.TCPConnector(ssl=ssl_context)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        # Step 1: Snap coordinates to nearest point on foot network
        snapped_coords = await get_nearest_point_on_network(location_coords, session)
        if not snapped_coords:
            logger.warning("⚠️ Could not snap coordinates to network, using original coordinates")
            snapped_coords = location_coords
        
        # Step 2: Calculate Haversine distances for all stations
        station_distances = []
        for name, coords in stations.items():
            haversine_dist = haversine_distance(snapped_coords[0], snapped_coords[1], coords[0], coords[1])
            station_distances.append(StationInfo(
                name=name,
                coordinates=coords,
                haversine_distance=haversine_dist,
                line=lookup_line(name)
            ))
        
        # Step 3: Sort by Haversine and take top 12 stations
        station_distances.sort(key=lambda x: x.haversine_distance)
        top_stations = station_distances[:12]
        
        # Randomize the order of stations to distribute load
        random.shuffle(top_stations)
        
        logger.info("\n📊 Top stations by Haversine distance:")
        for station in top_stations:
            logger.info(f"{station.name}: {round(station.haversine_distance)}m")
        
        # Step 4: Process stations in optimized batches
        all_results = []
        for i in range(0, len(top_stations), BATCH_SIZE):
            batch = top_stations[i:i + BATCH_SIZE]
            batch_results = process_station_batch(batch, snapped_coords)
            all_results.extend(batch_results)
            
            # Small delay between batches to prevent rate limiting
            if i + BATCH_SIZE < len(top_stations):
                time.sleep(0.2)
        
        # Sort by walking distance
        all_results.sort(key=lambda x: (x.walking_distance if x.walking_distance is not None else x.haversine_distance))
        
        logger.info("\n📊 Final station distances:")
        for station in all_results:
            logger.info(
                f"{station.name}: "
                f"Haversine={round(station.haversine_distance)}m, "
                f"Walking={station.walking_distance}m, "
                f"Time={format_duration(station.walking_duration)}, "
                f"OSRM={station.is_osrm}"
            )
        
        return all_results[:top_n]  # Return only top N results

# Map configuration
MAP_CONFIG = {
    "tile_server": "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    "animate": False,
    "marker_cluster": True,
    "debounce_time": 250
}

def generate_map_html(stations: List[StationInfo], user_location: Tuple[float, float], pois: Dict[str, List[POIInfo]]) -> str:
    """Generate optimized HTML with Leaflet configuration"""
    # Convert stations to GeoJSON
    station_features = []
    for station in stations:
        station_features.append({
            "type": "Feature",
            "properties": {
                "name": station.name,
                "line": station.line,
                "distance": station.walking_distance,
                "duration": station.walking_duration,
                "type": "metro"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [station.coordinates[1], station.coordinates[0]]
            }
        })
    
    # Convert POIs to GeoJSON
    for category, poi_list in pois.items():
        for poi in poi_list:
            station_features.append({
                "type": "Feature",
                "properties": {
                    "name": poi.name,
                    "type": poi.poi_type,
                    "distance": poi.walking_distance,
                    "duration": poi.walking_duration
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [poi.coordinates[1], poi.coordinates[0]]
                }
            })
    
    geojson_data = {
        "type": "FeatureCollection",
        "features": station_features
    }
    
    # Generate HTML with Leaflet configuration
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nearest Metro Stations & POIs</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
        <style>
            body {{ margin: 0; padding: 0; }}
            #map {{
                width: 100%;
                height: 600px;
                position: relative;
                transform: translateZ(0);
                will-change: transform;
            }}
            .leaflet-popup-content {{
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }}
            .station-popup {{
                font-family: Arial, sans-serif;
            }}
            .station-name {{
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 8px;
                color: #333;
            }}
            .station-info {{
                color: #666;
                font-size: 0.9em;
                line-height: 1.4;
            }}
            .loading {{
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                background: rgba(255, 255, 255, 0.9);
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }}
            .leaflet-control-zoom {{
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }}
            .leaflet-control-zoom a {{
                width: 30px;
                height: 30px;
            }}
            .legend {{
                position: absolute;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                z-index: 1000;
            }}
            .legend-item {{
                margin: 5px 0;
                display: flex;
                align-items: center;
            }}
            .legend-color {{
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
            }}
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div id="loading" class="loading" style="display: none;">Loading...</div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
        <script>
            // Debounce function
            function debounce(func, wait) {{
                let timeout;
                return function executedFunction(...args) {{
                    const later = () => {{
                        clearTimeout(timeout);
                        func(...args);
                    }};
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                }};
            }}
            
            // Initialize map
            const map = L.map('map', {{
                center: [{user_location[0]}, {user_location[1]}],
                zoom: 13,
                zoomControl: false,
                attributionControl: true
            }});
            
            // Add tile layer
            L.tileLayer('{MAP_CONFIG["tile_server"]}', {{
                attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
                maxZoom: 18,
                minZoom: 10
            }}).addTo(map);
            
            // Add zoom control
            L.control.zoom({{
                position: 'topright'
            }}).addTo(map);
            
            // Add user location marker
            const userMarker = L.marker([{user_location[0]}, {user_location[1]}], {{
                icon: L.divIcon({{
                    className: 'user-location',
                    html: '<div style="background-color: #3388ff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>'
                }})
            }}).addTo(map);
            
            // Add station markers
            const stations = {json.dumps(geojson_data)};
            const markers = L.markerClusterGroup({{
                maxClusterRadius: 50,
                disableClusteringAtZoom: 17,
                chunkedLoading: true
            }});
            
            // Custom icons for different POI types
            const icons = {{
                metro: L.divIcon({{
                    className: 'metro-icon',
                    html: '<div style="background-color: #e41a1c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>'
                }}),
                bus_station: L.divIcon({{
                    className: 'bus-icon',
                    html: '<div style="background-color: #377eb8; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>'
                }}),
                taxi: L.divIcon({{
                    className: 'taxi-icon',
                    html: '<div style="background-color: #4daf4a; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>'
                }}),
                fuel: L.divIcon({{
                    className: 'fuel-icon',
                    html: '<div style="background-color: #ff7f00; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>'
                }})
            }};
            
            // Add markers to cluster group
            stations.features.forEach(feature => {{
                const marker = L.marker([
                    feature.geometry.coordinates[1],
                    feature.geometry.coordinates[0]
                ], {{
                    icon: icons[feature.properties.type] || icons.metro
                }});
                
                let popupContent = `
                    <div class="station-popup">
                        <div class="station-name">${{feature.properties.name}}</div>
                        <div class="station-info">
                `;
                
                if (feature.properties.type === 'metro') {{
                    popupContent += `
                            Line: ${{feature.properties.line}}<br>
                    `;
                }}
                
                popupContent += `
                            Distance: ${{feature.properties.distance}}m<br>
                            Walking time: ${{formatDuration(feature.properties.duration)}}
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                markers.addLayer(marker);
            }});
            
            // Add cluster group to map
            map.addLayer(markers);
            
            // Add legend
            const legend = L.control({{ position: 'bottomright' }});
            legend.onAdd = function(map) {{
                const div = L.DomUtil.create('div', 'legend');
                div.innerHTML = `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #e41a1c;"></div>
                        Metro Station
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #377eb8;"></div>
                        Bus Station
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #4daf4a;"></div>
                        Taxi Stand
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ff7f00;"></div>
                        Fuel Station
                    </div>
                `;
                return div;
            }};
            legend.addTo(map);
            
            // Helper function to format duration
            function formatDuration(seconds) {{
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                if (minutes === 0) return `${{remainingSeconds}} sec`;
                if (remainingSeconds === 0) return `${{minutes}} min`;
                return `${{minutes}} min ${{remainingSeconds}} sec`;
            }}
            
            // Show loading indicator during heavy operations
            function showLoading() {{
                document.getElementById('loading').style.display = 'block';
            }}
            
            function hideLoading() {{
                document.getElementById('loading').style.display = 'none';
            }}
            
            // Optimized event handlers
            const debouncedMoveEnd = debounce(() => {{
                // Handle map move end event
            }}, {MAP_CONFIG['debounce_time']});
            
            const debouncedZoomEnd = debounce(() => {{
                // Handle zoom end event
            }}, {MAP_CONFIG['debounce_time']});
            
            map.on('moveend', debouncedMoveEnd);
            map.on('zoomend', debouncedZoomEnd);
        </script>
    </body>
    </html>
    """
    return html

async def get_nearby_pois_async(location_coords: Tuple[float, float], session: aiohttp.ClientSession) -> Dict[str, List[POIInfo]]:
    """Get nearby POIs using Overpass API asynchronously"""
    try:
        logger.info(f"\n🔍 Finding nearby POIs for coordinates: {location_coords}")
        
        # Generate and execute Overpass query
        query = get_overpass_query(location_coords[0], location_coords[1])
        result = await asyncio.to_thread(overpass.query, query)
        
        # Process results
        pois = {
            "bus_stations": [],
            "taxi_stands": [],
            "fuel_stations": []
        }
        
        # Process nodes
        for node in result.nodes:
            poi_type = node.tags.get("amenity", "")
            if poi_type in ["bus_station", "taxi", "fuel"]:
                name = node.tags.get("name", "Unnamed")
                coords = (float(node.lat), float(node.lon))
                haversine_dist = haversine_distance(location_coords[0], location_coords[1], coords[0], coords[1])
                
                poi_info = POIInfo(
                    name=name,
                    poi_type=poi_type,
                    coordinates=coords,
                    haversine_distance=haversine_dist
                )
                
                # Add to appropriate category
                if poi_type == "bus_station":
                    pois["bus_stations"].append(poi_info)
                elif poi_type == "taxi":
                    pois["taxi_stands"].append(poi_info)
                elif poi_type == "fuel":
                    pois["fuel_stations"].append(poi_info)
        
        # Process each category
        for category in pois:
            # Sort by Haversine distance
            pois[category].sort(key=lambda x: x.haversine_distance)
            
            # Take top 3 POIs for each category
            pois[category] = pois[category][:3]
            
            # Calculate walking routes for top POIs
            for poi in pois[category]:
                dist_m, dur_s, is_osrm = get_osrm_route(location_coords, poi.coordinates)
                poi.walking_distance = dist_m
                poi.walking_duration = dur_s
                poi.is_osrm = is_osrm
        
        return pois
        
    except OverpassBadRequest as e:
        logger.error(f"Overpass API bad request: {str(e)}")
        return {"bus_stations": [], "taxi_stands": [], "fuel_stations": []}
    except OverpassTooManyRequests as e:
        logger.error(f"Overpass API rate limit exceeded: {str(e)}")
        return {"bus_stations": [], "taxi_stands": [], "fuel_stations": []}
    except Exception as e:
        logger.error(f"Error getting nearby POIs: {str(e)}")
        return {"bus_stations": [], "taxi_stands": [], "fuel_stations": []}

async def get_closest_metro_station_async(location: str) -> str:
    """Get information about the closest metro station and nearby alternatives asynchronously"""
    try:
        # Check for exact match with station name
        normalized_input = location.lower().strip()
        if normalized_input in normalized_stations:
            station_name = normalized_stations[normalized_input]
            station_coords = metro_stations[station_name]
            
            # Create a GeocodingResult for the exact match
            geocoding_result = GeocodingResult(
                coordinates=station_coords,
                formatted_address=station_name,
                confidence=1.0
            )
            
            # Find nearest stations
            nearest_stations = await find_nearest_stations_async(geocoding_result.coordinates, metro_stations)
            
            if not nearest_stations:
                return "❌ Could not compute walking distances. Please try again later."
            
            # Get nearby POIs
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                nearby_pois = await get_nearby_pois_async(geocoding_result.coordinates, session)
                
                # Generate map HTML
                map_html = generate_map_html(nearest_stations, geocoding_result.coordinates, nearby_pois)
                
                # Save map HTML to file
                with open('metro_map.html', 'w') as f:
                    f.write(map_html)
                
                # Format the response
                result = [f"✅ Closest metro stations to '{station_name}' by walking are:"]
                for i, station in enumerate(nearest_stations, 1):
                    result.append(
                        f"{i}) {station.name} (Line: {station.line}): "
                        f"{station.walking_distance} m, {format_duration(station.walking_duration)}"
                    )
                
                # Add POI information
                if nearby_pois["bus_stations"]:
                    result.append("\n🚌 Nearby bus stations:")
                    for i, poi in enumerate(nearby_pois["bus_stations"], 1):
                        result.append(
                            f"{i}) {poi.name}: {poi.walking_distance} m, {format_duration(poi.walking_duration)}"
                        )
                
                if nearby_pois["taxi_stands"]:
                    result.append("\n🚕 Nearby taxi stands:")
                    for i, poi in enumerate(nearby_pois["taxi_stands"], 1):
                        result.append(
                            f"{i}) {poi.name}: {poi.walking_distance} m, {format_duration(poi.walking_duration)}"
                        )
                
                if nearby_pois["fuel_stations"]:
                    result.append("\n⛽ Nearby fuel stations:")
                    for i, poi in enumerate(nearby_pois["fuel_stations"], 1):
                        result.append(
                            f"{i}) {poi.name}: {poi.walking_distance} m, {format_duration(poi.walking_duration)}"
                        )
                
                result.append("\n🗺️ A map has been generated and saved as 'metro_map.html'")
                return "\n".join(result)
        
        # Get coordinates for the location
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            geocoding_result = await geocode_location_async(location, session)
            logger.info(f"Geocoded location: {geocoding_result.formatted_address}")
            
            # Find nearest stations
            nearest_stations = await find_nearest_stations_async(geocoding_result.coordinates, metro_stations)
            
            if not nearest_stations:
                return "❌ Could not compute walking distances. Please try again later."
            
            # Get nearby POIs
            nearby_pois = await get_nearby_pois_async(geocoding_result.coordinates, session)
            
            # Generate map HTML
            map_html = generate_map_html(nearest_stations, geocoding_result.coordinates, nearby_pois)
            
            # Save map HTML to file
            with open('metro_map.html', 'w') as f:
                f.write(map_html)
            
            # Format the response
            result = [f"✅ Closest metro stations to '{geocoding_result.formatted_address}' by walking are:"]
            for i, station in enumerate(nearest_stations, 1):
                result.append(
                    f"{i}) {station.name} (Line: {station.line}): "
                    f"{station.walking_distance} m, {format_duration(station.walking_duration)}"
                )
            
            # Add POI information
            if nearby_pois["bus_stations"]:
                result.append("\n🚌 Nearby bus stations:")
                for i, poi in enumerate(nearby_pois["bus_stations"], 1):
                    result.append(
                        f"{i}) {poi.name}: {poi.walking_distance} m, {format_duration(poi.walking_duration)}"
                    )
            
            if nearby_pois["taxi_stands"]:
                result.append("\n🚕 Nearby taxi stands:")
                for i, poi in enumerate(nearby_pois["taxi_stands"], 1):
                    result.append(
                        f"{i}) {poi.name}: {poi.walking_distance} m, {format_duration(poi.walking_duration)}"
                    )
            
            if nearby_pois["fuel_stations"]:
                result.append("\n⛽ Nearby fuel stations:")
                for i, poi in enumerate(nearby_pois["fuel_stations"], 1):
                    result.append(
                        f"{i}) {poi.name}: {poi.walking_distance} m, {format_duration(poi.walking_duration)}"
                    )
            
            result.append("\n🗺️ A map has been generated and saved as 'metro_map.html'")
            return "\n".join(result)
                
    except ValueError as e:
        return f"❌ {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error details: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        return f"❌ Unexpected error: {str(e)}"

def main():
    print("🚇 Bangalore Metro Station Finder")
    print("--------------------------------")
    print("This tool helps you find the closest operational metro station")
    print("based on actual walking distances in Bangalore.")
    print("\nNote: All distances are based on walking routes, not straight-line distances.")
    
    while True:
        try:
            location = input("\n📍 Enter a place in Bangalore (or 'quit' to exit): ")
            if location.lower() == 'quit':
                break
                
            print("\n🔍 Finding closest metro station...")
            result = asyncio.run(get_closest_metro_station_async(location))
            print("\n✅ Results:")
            print(result)
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"\n❌ An error occurred: {str(e)}")
            print("Please try again.")

if __name__ == "__main__":
    main()

 