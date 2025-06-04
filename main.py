import os
from dotenv import load_dotenv
from typing import Dict, List, Tuple
import requests
import logging
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

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

# Get Google Maps API key
GOOGLE_MAPS_API_KEY = "AIzaSyDDa8CrZCaA3KkOOH8IsICE-h4aHcFGi3Y"
if not GOOGLE_MAPS_API_KEY:
    raise ValueError("GOOGLE_MAPS_API_KEY environment variable is not set")

# Metro stations dictionary with coordinates
METRO_STATIONS = {
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
STATION_LINES = {
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

def get_metro_line(station_name: str) -> str:
    """Get the metro line for a station"""
    return STATION_LINES.get(station_name, "Unknown Line")

def geocode_location(address: str) -> Dict:
    """Geocode a location using Google Maps Geocoding API"""
    try:
        # Add Bangalore context if not present
        search_query = address.lower()
        if 'bangalore' not in search_query:
            search_query = f"{address}, Bangalore, Karnataka, India"

        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={search_query}&key={GOOGLE_MAPS_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if data['status'] == 'OK':
            result = data['results'][0]
            return {
                'location': result['geometry']['location'],
                'formatted_address': result['formatted_address']
            }
        
        # Second attempt with simpler query
        if data['status'] == 'ZERO_RESULTS':
            simple_query = f"{address} Bangalore"
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={simple_query}&key={GOOGLE_MAPS_API_KEY}"
            response = requests.get(url)
            data = response.json()

            if data['status'] == 'OK':
                result = data['results'][0]
                return {
                    'location': result['geometry']['location'],
                    'formatted_address': result['formatted_address']
                }

        return None

    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return None

def calculate_distances(origin: Dict, destinations: Dict[str, Tuple[float, float]]) -> List[Dict]:
    """Calculate distances from origin to all destinations using Google Maps Distance Matrix API"""
    results = []
    
    # Process destinations in chunks of 10 (API limit)
    dest_chunks = [list(destinations.items())[i:i + 10] for i in range(0, len(destinations), 10)]
    
    for chunk in dest_chunks:
        dest_dict = dict(chunk)
        dest_list = [f"{lat},{lng}" for lat, lng in dest_dict.values()]
        
        # Make request to Distance Matrix API
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": f"{origin['location']['lat']},{origin['location']['lng']}",
            "destinations": "|".join(dest_list),
            "mode": "driving",  # Changed from walking to driving
            "key": GOOGLE_MAPS_API_KEY
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data["status"] == "OK":
                for i, (station_name, coords) in enumerate(chunk):
                    element = data["rows"][0]["elements"][i]
                    if element["status"] == "OK":
                        distance = element["distance"]["value"]  # in meters
                        duration = element["duration"]["value"]  # in seconds
                        
                        # Format distance and duration
                        if distance >= 1000:
                            formatted_distance = f"{distance/1000:.1f} km"
                        else:
                            formatted_distance = f"{distance} m"
                            
                        minutes = duration // 60
                        if minutes >= 60:
                            hours = minutes // 60
                            minutes = minutes % 60
                            formatted_duration = f"{hours}h {minutes}m"
                        else:
                            formatted_duration = f"{minutes} min"
                        
                        results.append({
                            "station": station_name,
                            "lat": coords[0],
                            "lng": coords[1],
                            "distance": distance,
                            "duration": duration,
                            "formatted_distance": formatted_distance,
                            "formatted_duration": formatted_duration,
                            "line": get_metro_line(station_name),
                            "origin_lat": origin['location']['lat'],
                            "origin_lng": origin['location']['lng']
                        })
            
        except Exception as e:
            logger.error(f"Error calculating distances: {str(e)}")
            continue
    
    # Sort by distance
    results.sort(key=lambda x: x["distance"])
    return results

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/find_station', methods=['POST'])
def find_station():
    try:
        data = request.get_json()
        location = data.get('location', '')
        current_location = data.get('current_location', {})

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

 