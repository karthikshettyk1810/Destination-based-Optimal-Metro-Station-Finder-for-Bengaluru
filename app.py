from flask import Flask, render_template, request, jsonify, send_file, url_for
import asyncio
from main import (
    get_closest_metro_station_async, 
    GeocodingResult, 
    find_nearest_stations_async, 
    metro_stations, 
    format_duration,
    geocode_location_async,
    OSRM_URL
)
import logging
import redis
from redis.exceptions import ConnectionError, TimeoutError
import json
from datetime import timedelta, datetime
from gemini_utils import get_spell_correction
from flask.views import View
from functools import wraps
import aiohttp
import ssl
import certifi
import requests
import subprocess
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
    static_url_path='',
    static_folder='static',
    template_folder='templates'
)

# Redis configuration
redis_host = 'redis-10473.c330.asia-south1-1.gce.redns.redis-cloud.com'
redis_port = 10473
redis_username = 'default'
redis_password = 'lFNtMxdxllRsePZnSWt99xyL99YJR0vE'
REDIS_AVAILABLE = False
redis_pool = None
redis_client = None

# Create SSL context with proper certificate verification
ssl_context = ssl.create_default_context(cafile=certifi.where())

def get_redis_client():
    """Get or create Redis client with connection pooling"""
    global redis_pool, redis_client, REDIS_AVAILABLE
    
    if redis_pool is None:
        try:
            redis_pool = redis.ConnectionPool(
                host=redis_host,
                port=redis_port,
                username=redis_username,
                password=redis_password,
                decode_responses=True,
                socket_timeout=1,  # Reduced timeout
                socket_connect_timeout=1,  # Reduced timeout
                retry_on_timeout=True,
                max_connections=10,  # Limit max connections
                db=0
            )
            logger.info("Created new Redis connection pool")
        except Exception as e:
            logger.error(f"Failed to create Redis connection pool: {str(e)}")
            return None

    if redis_client is None or not REDIS_AVAILABLE:
        try:
            redis_client = redis.Redis(connection_pool=redis_pool)
            # Test connection
            redis_client.ping()
            REDIS_AVAILABLE = True
            logger.info("Successfully connected to Redis Cloud")
        except (ConnectionError, TimeoutError) as e:
            logger.error(f"Failed to connect to Redis Cloud: {str(e)}")
            REDIS_AVAILABLE = False
            return None
        except Exception as e:
            logger.error(f"Unexpected error connecting to Redis: {str(e)}")
            REDIS_AVAILABLE = False
            return None

    return redis_client

def get_cached_result(redis_client, cache_key):
    """Get result from cache with error handling"""
    try:
        if redis_client:
            result = redis_client.get(cache_key)
            if result:
                logger.info(f"Cache hit for key: {cache_key}")
                return result
    except (ConnectionError, TimeoutError) as e:
        logger.error(f"Redis connection error: {str(e)}")
        global REDIS_AVAILABLE
        REDIS_AVAILABLE = False
    except Exception as e:
        logger.error(f"Error reading from cache: {str(e)}")
    return None

def set_cached_result(redis_client, cache_key, result):
    """Set result in cache with error handling"""
    try:
        if redis_client:
            redis_client.set(cache_key, result)
            redis_client.persist(cache_key)
            logger.info(f"Cached result for key: {cache_key}")
            return True
    except (ConnectionError, TimeoutError) as e:
        logger.error(f"Redis connection error: {str(e)}")
        global REDIS_AVAILABLE
        REDIS_AVAILABLE = False
    except Exception as e:
        logger.error(f"Error writing to cache: {str(e)}")
    return False

# Initialize Redis on startup
get_redis_client()

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', metro_stations=metro_stations)

@app.route('/static/metro_map.html')
def serve_map():
    """Serve the metro map HTML file"""
    return send_file('static/metro_map.html')

def async_route(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))
    return wrapped

@app.route('/find_station', methods=['POST'])
@async_route
async def find_station():
    try:
        data = request.get_json()
        location = data.get('location', '').strip()
        current_location = data.get('current_location')

        # Spell check the location
        corrected_location = get_spell_correction(location)
        if corrected_location:
            # If there's a correction, return it to the frontend
            return jsonify({
                'spell_correction': {
                    'original': location,
                    'corrected': corrected_location
                }
            })

        results = {}
        redis_client = get_redis_client()
        
        try:
            # Get coordinates for the location first
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                geocoding_result = await geocode_location_async(location, session)
                logger.info(f"Geocoded coordinates for {location}: {geocoding_result.coordinates}")
                
                # Create a cache key that includes the coordinates
                cache_key = f"station_search:{location.lower()}_{geocoding_result.coordinates[0]}_{geocoding_result.coordinates[1]}"
                
                # Try to get from cache first
                if redis_client:
                    try:
                        cached_result = redis_client.get(cache_key)
                        if cached_result:
                            logger.info(f"Cache hit for {location}")
                            results['searched_location'] = cached_result.decode('utf-8')
                            return jsonify(results)
                    except Exception as e:
                        logger.error(f"Cache read error: {str(e)}")
                
                # If not in cache, calculate fresh results
                logger.info(f"Cache miss for {location}, calculating fresh results")
                result = await get_closest_metro_station_async(location)
                results['searched_location'] = result
                
                # Update cache with new results
                if redis_client:
                    try:
                        redis_client.setex(cache_key, timedelta(hours=24), result)
                        logger.info(f"Cached results for {location}")
                    except Exception as e:
                        logger.error(f"Cache write error: {str(e)}")
                        
        except Exception as e:
            logger.error(f"Error processing location: {str(e)}")
            results['error'] = f"Error processing location: {str(e)}"
            return jsonify(results)

        # Get results for current location if provided
        if current_location:
            try:
                # Log the received current location
                logger.info(f"Processing current location: {current_location}")
                
                # Split and validate coordinates
                try:
                    lat, lon = current_location.split(',')
                    lat = float(lat)
                    lon = float(lon)
                    
                    # Validate coordinate ranges
                    if not (-90 <= lat <= 90):
                        raise ValueError(f"Invalid latitude: {lat}")
                    if not (-180 <= lon <= 180):
                        raise ValueError(f"Invalid longitude: {lon}")
                        
                    # Format coordinates as a location string
                    current_location_str = f"{lat},{lon}"
                    logger.info(f"Validated coordinates: {current_location_str}")
                    
                except ValueError as ve:
                    logger.error(f"Invalid coordinates format: {str(ve)}")
                    results['current_location_error'] = f"Invalid location format: {str(ve)}"
                    return jsonify(results)
                
                # Use coordinates in cache key
                cache_key = f"station_search:current_{lat}_{lon}"
                
                # Try to get from cache first
                if redis_client:
                    try:
                        cached_result = redis_client.get(cache_key)
                        if cached_result:
                            logger.info(f"Cache hit for current location")
                            results['current_location'] = cached_result.decode('utf-8')
                            return jsonify(results)
                    except Exception as e:
                        logger.error(f"Cache read error: {str(e)}")
                
                # If not in cache, calculate fresh results
                try:
                    # Create a GeocodingResult directly with the coordinates
                    geocoding_result = GeocodingResult(
                        coordinates=(lat, lon),
                        formatted_address=f"Current Location ({lat}, {lon})",
                        confidence=1.0
                    )
                    
                    # Find nearest stations using the coordinates directly
                    nearest_stations = await find_nearest_stations_async(
                        geocoding_result.coordinates,
                        metro_stations
                    )
                    
                    if nearest_stations:
                        # Format the response
                        result = [f"✅ Closest metro stations to your current location:"]
                        for i, station in enumerate(nearest_stations, 1):
                            result.append(
                                f"{i}) {station.name} (Line: {station.line}): "
                                f"{station.walking_distance} m, {format_duration(station.walking_duration)}"
                            )
                        results['current_location'] = "\n".join(result)
                        
                        # Update cache with new results
                        if redis_client:
                            try:
                                redis_client.setex(cache_key, timedelta(hours=24), results['current_location'])
                                logger.info(f"Cached results for current location")
                            except Exception as e:
                                logger.error(f"Cache write error: {str(e)}")
                    else:
                        results['current_location_error'] = "No stations found near your location"
                        
                except Exception as e:
                    logger.error(f"Error finding stations for current location: {str(e)}")
                    results['current_location_error'] = f"Error finding stations: {str(e)}"
            except Exception as e:
                logger.error(f"Error processing current location: {str(e)}")
                results['current_location_error'] = f"Could not process current location: {str(e)}"

        return jsonify(results)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/route')
def get_route():
    try:
        from_coords = request.args.get('from').split(',')
        to_coords = request.args.get('to').split(',')
        
        from_lat, from_lng = float(from_coords[0]), float(from_coords[1])
        to_lat, to_lng = float(to_coords[0]), float(to_coords[1])
        
        # Call OSRM to get the route with geometry
        url = f"{OSRM_URL}/route/v1/foot/{from_lng},{from_lat};{to_lng},{to_lat}?overview=full&geometries=geojson"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "Ok" and data.get("routes"):
                # Extract the route geometry
                route_geometry = data["routes"][0]["geometry"]["coordinates"]
                # Convert from [lng, lat] to [lat, lng] for Leaflet
                route_points = [[point[1], point[0]] for point in route_geometry]
                return jsonify({"route": route_points})
        
        return jsonify({"error": "Could not retrieve route"}), 400
    except Exception as e:
        logger.error(f"Error getting route: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add this after app initialization
def check_osrm_health():
    """Check if OSRM server is healthy"""
    try:
        response = requests.get(f"{OSRM_URL}/route/v1/driving/77.5946,12.9716;77.5921,12.9784", timeout=5)
        if response.status_code == 200 and response.json().get("code") == "Ok":
            logger.info("✅ OSRM server is healthy")
            return True
        else:
            logger.warning("⚠️ OSRM server returned unexpected response")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ OSRM server health check failed: {str(e)}")
        return False

# Check OSRM health on startup
osrm_healthy = check_osrm_health()
if not osrm_healthy:
    logger.warning("OSRM server is not available. Using Haversine distance as fallback.")

if __name__ == '__main__':
    app.run(debug=True, port=5001)
