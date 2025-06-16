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
from collections import defaultdict, deque

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

# Metro track distances dictionary
METRO_DISTANCES = {
    # ---- Purple Line ----
    ("Whitefield (Kadugodi)", "Hopefarm Channasandra"): 0.822,
    ("Hopefarm Channasandra", "Kadugodi Tree Park"): 0.705,
    ("Kadugodi Tree Park", "Pattandur Agrahara"): 1.179,
    ("Pattandur Agrahara", "Sri Sathya Sai Hospital"): 1.374,
    ("Sri Sathya Sai Hospital", "Nallurhalli"): 0.590,
    ("Nallurhalli", "Kundalahalli"): 0.575,
    ("Kundalahalli", "Seetharampalya"): 0.829,
    ("Seetharampalya", "Hoodi"): 0.932,
    ("Hoodi", "Garudacharapalya"): 0.538,
    ("Garudacharapalya", "Singayyanapalya"): 1.148,
    ("Singayyanapalya", "Krishnarajapura (K R Pura)"): 1.594,
    ("Krishnarajapura (K R Pura)", "Benniganahalli"): 1.169,
    ("Benniganahalli", "Baiyappanahalli"): 1.897,
    ("Baiyappanahalli", "Swami Vivekananda Road"): 0.891,
    ("Swami Vivekananda Road", "Indiranagar"): 0.927,
    ("Indiranagar", "Halasuru"): 1.303,
    ("Halasuru", "Trinity"): 1.000,
    ("Trinity", "Mahatma Gandhi Road (MG Road)"): 1.097,
    ("Mahatma Gandhi Road (MG Road)", "Cubbon Park"): 1.060,
    ("Cubbon Park", "Dr. B.R. Ambedkar Station (Vidhana Soudha)"): 0.433,
    ("Dr. B.R. Ambedkar Station (Vidhana Soudha)", "Sir M. Visvesvaraya Station (Central College)"): 1.189,
    ("Sir M. Visvesvaraya Station (Central College)", "Nadaprabhu Kempegowda (Majestic)"): 1.047,
    ("Nadaprabhu Kempegowda (Majestic)", "Krantivira Sangolli Rayanna (Bengaluru City)"): 0.255,
    ("Krantivira Sangolli Rayanna (Bengaluru City)", "Magadi Road"): 1.652,
    ("Magadi Road", "Sri Balagangadharanatha Swamiji Station (Hosahalli)"): 1.120,
    ("Sri Balagangadharanatha Swamiji Station (Hosahalli)", "Vijayanagar"): 0.940,
    ("Vijayanagar", "Attiguppe"): 1.080,
    ("Attiguppe", "Deepanjali Nagar"): 1.240,
    ("Deepanjali Nagar", "Mysuru Road"): 0.961,
    ("Mysuru Road", "Pantharapalya–Nayandahalli"): 0.170,
    ("Pantharapalya–Nayandahalli", "Rajarajeshwari Nagar"): 1.166,
    ("Rajarajeshwari Nagar", "Jnanabharathi"): 1.264,
    ("Jnanabharathi", "Pattanagere"): 1.341,
    ("Pattanagere", "Kengeri Bus Terminal"): 1.230,
    ("Kengeri Bus Terminal", "Kengeri"): 1.118,
    ("Kengeri", "Challaghatta"): 2.034,

    # ---- Green Line ----
    ("Madavara", "Chikkabidarakallu"): 1.715,
    ("Chikkabidarakallu", "Manjunath Nagar"): 0.747,
    ("Manjunath Nagar", "Nagasandra"): 0.658,
    ("Nagasandra", "Dasarahalli"): 1.430,
    ("Dasarahalli", "Jalahalli"): 0.906,
    ("Jalahalli", "Peenya Industry"): 0.716,
    ("Peenya Industry", "Peenya"): 0.930,
    ("Peenya", "Goraguntepalya"): 0.953,
    ("Goraguntepalya", "Yeshwanthpur"): 1.151,
    ("Yeshwanthpur", "Sandal Soap Factory"): 1.038,
    ("Sandal Soap Factory", "Mahalakshmi"): 0.912,
    ("Mahalakshmi", "Rajajinagar"): 0.882,
    ("Rajajinagar", "Mahakavi Kuvempu Road"): 0.813,
    ("Mahakavi Kuvempu Road", "Srirampura"): 0.719,
    ("Srirampura", "Mantri Square Sampige Road"): 1.047,
    ("Mantri Square Sampige Road", "Nadaprabhu Kempegowda (Majestic)"): 1.663,
    ("Nadaprabhu Kempegowda (Majestic)", "Chickpete"): 1.015,
    ("Chickpete", "Krishna Rajendra Market"): 0.602,
    ("Krishna Rajendra Market", "National College"): 1.205,
    ("National College", "Lalbagh"): 0.830,
    ("Lalbagh", "South End Circle"): 0.903,
    ("South End Circle", "Jayanagar"): 0.510,
    ("Jayanagar", "Rashtreeya Vidyalaya Road"): 1.356,
    ("Rashtreeya Vidyalaya Road", "Banashankari"): 0.975,
    ("Banashankari", "Jaya Prakash Nagar"): 0.930,
    ("Jaya Prakash Nagar", "Yelachenahalli"): 1.299,
    ("Yelachenahalli", "Konanakunte Cross"): 2.250,
    ("Konanakunte Cross", "Doddakallasandra"): 0.006,
    ("Doddakallasandra", "Vajarahalli"): 1.205,
    ("Vajarahalli", "Thalaghattapura"): 0.902,
    ("Thalaghattapura", "Silk Institute"): 1.446
}

def calculate_total_distance(start, end, distance_dict):
    # Build graph as ordered adjacency list
    graph = defaultdict(list)
    for (u, v), d in distance_dict.items():
        graph[u].append((v, d))
        graph[v].append((u, d))  # bi-directional

    # BFS to find path
    visited = set()
    queue = deque([(start, 0)])  # (station, distance_so_far)

    while queue:
        current, dist_so_far = queue.popleft()
        if current == end:
            return round(dist_so_far, 3)
        visited.add(current)
        for neighbor, d in graph[current]:
            if neighbor not in visited:
                queue.append((neighbor, dist_so_far + d))
    return None  # If no path found

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

@app.route('/log_metro_distance', methods=['POST'])
def log_metro_distance():
    try:
        data = request.json
        destination_station = data.get('destination_station')
        current_station = data.get('current_station')
        distance = data.get('distance')
        
        logger.info(f"=== METRO TO METRO DISTANCE ===")
        logger.info(f"Distance between {destination_station} and {current_station}: {distance} km")
        logger.info(f"=============================")
        
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Error in log_metro_distance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_metro_distance', methods=['POST'])
def get_metro_distance():
    try:
        data = request.get_json()
        origin_station = data.get('origin_station')
        destination_station = data.get('destination_station')

        if not origin_station or not destination_station:
            return jsonify({'error': 'Both origin and destination stations are required'}), 400

        # Log the received station names
        logger.info(f"Received station names - Origin: {origin_station}, Destination: {destination_station}")

        # Calculate track distance
        total_distance = calculate_total_distance(origin_station, destination_station, METRO_DISTANCES)
        
        if total_distance is None:
            logger.error(f"Could not find path between stations - Origin: {origin_station}, Destination: {destination_station}")
            return jsonify({'error': 'Could not find path between stations'}), 404

        # Format distance
        formatted_distance = f"{total_distance:.1f} km"

        # Estimate duration (assuming average speed of 30 km/h)
        duration_minutes = int((total_distance / 30) * 60)
        if duration_minutes >= 60:
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            formatted_duration = f"{hours}h {minutes}m"
        else:
            formatted_duration = f"{duration_minutes} min"

        logger.info(f"Successfully calculated distance between {origin_station} and {destination_station}: {formatted_distance}")

        return jsonify({
            "distance": total_distance * 1000,  # Convert to meters for consistency
            "duration": duration_minutes * 60,  # Convert to seconds for consistency
            "formatted_distance": formatted_distance,
            "formatted_duration": formatted_duration,
            "origin_station": origin_station,
            "destination_station": destination_station
        })

    except Exception as e:
        logger.error(f"Error in get_metro_distance: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
