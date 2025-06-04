from flask import Flask, render_template, request, jsonify, send_file, url_for
from main import (
    geocode_location,
    calculate_distances,
    METRO_STATIONS
)
import logging
import redis
from redis.exceptions import ConnectionError, TimeoutError
import json
from datetime import timedelta, datetime
from gemini_utils import get_spell_correction, is_valid_location
from flask.views import View
from functools import wraps
import aiohttp
import ssl
import certifi
import requests
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__, 
    static_url_path='',
    static_folder='static',
    template_folder='templates'
)
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', metro_stations=METRO_STATIONS)

@app.route('/static/metro_map.html')
def serve_map():
    """Serve the metro map HTML file"""
    return send_file('static/metro_map.html')

@app.route('/find_station', methods=['POST'])
def find_station():
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

        # Validate if the location exists in Bangalore
        if not is_valid_location(location):
            return jsonify({
                'error': f'"{location}" does not appear to be a valid location in Bangalore. Please check the spelling and try again.'
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
        logger.error(f"Error in find_station: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/search_places', methods=['POST'])
def search_places():
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
        logger.error(f"Error in search_places: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)