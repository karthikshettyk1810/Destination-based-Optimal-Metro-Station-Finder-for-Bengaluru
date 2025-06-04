from flask import Flask, render_template, request, jsonify, send_file, url_for
from main import (
    geocode_location,
    calculate_distances,
    METRO_STATIONS
)
import logging
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

        if not location:
            return jsonify({'error': 'Location is required'}), 400

        # Geocode the searched location
        searched_location = geocode_location(location)
        if not searched_location:
            return jsonify({'error': f'Could not find the location: "{location}"'}), 404

        # Calculate distances for searched location
        searched_results = calculate_distances(searched_location, METRO_STATIONS)
        
        # Calculate distances for current location if provided
        current_results = []
        if current_location and 'lat' in current_location and 'lng' in current_location:
            current_location_info = {
                'location': current_location,
                'formatted_address': 'Your current location'
            }
            current_results = calculate_distances(current_location_info, METRO_STATIONS)

        return jsonify({
            'searched_location': {
                'location': searched_location['location'],
                'results': searched_results
            },
            'current_location': {
                'location': current_location if current_results else None,
                'results': current_results
            }
        })

    except Exception as e:
        logger.error(f"Error in find_station: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/search_places', methods=['POST'])
def search_places():
    try:
        data = request.json
        query = data.get('query')
        location = data.get('location')

        logger.info(f"Searching places with query: {query}")
        logger.info(f"Location: {location}")

        # Construct the Places API URL
        url = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
        params = {
            'query': query,
            'location': f"{location['lat']},{location['lng']}",
            'key': GOOGLE_MAPS_API_KEY,
            'maxResults': 2
        }

        logger.info(f"Making request to Places API with params: {params}")

        # Make the request to Places API
        response = requests.get(url, params=params)
        response.raise_for_status()

        result = response.json()
        logger.info(f"Places API response status: {result.get('status')}")
        
        # Limit results to 2
        if result.get('results'):
            result['results'] = result['results'][:2]
            
        logger.info(f"Number of results: {len(result.get('results', []))}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in search_places: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
