# NearDest - Nearest Metro Station Finder

This project helps users find the nearest metro station to their desired destination using Google Maps API.

## Features
- Find the nearest metro station to any destination
- Calculate walking distance and time to the destination
- Compare multiple metro stations to suggest the best option

## Setup
1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the project root and add your Google Maps API key:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. Run the program:
```bash
python main.py
```

## Usage
1. Enter your destination address when prompted
2. The program will find nearby metro stations
3. It will calculate the walking distance from each station to your destination
4. The nearest station will be suggested as the best option

## Note
You need a valid Google Maps API key with the following APIs enabled:
- Directions API
- Distance Matrix API
- Places API 