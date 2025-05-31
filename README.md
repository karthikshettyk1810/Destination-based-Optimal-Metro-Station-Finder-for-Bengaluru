# Destination-based Optimal Metro Station Finder for Bengaluru

This project helps users find the nearest metro station to their desired destination using OSRM, Haversine Distance Formula and Manual Look Up Dictionary from Python and Metro Co-ordinates.

# Destination-based Optimal Metro Station Finder for Bengaluru

## Overview
This project helps commuters find the nearest Bangalore Metro station to their destination and calculates the walking distance and time from the metro station to the destination using offline map data. It compares multiple nearby metro stations and suggests the best option for last-mile connectivity.

---

## Features
- Find the nearest metro station to any destination in Bengaluru
- Calculate walking distance and estimated time from metro stations to your destination
- Compare multiple metro stations to suggest the optimal last-mile travel option
- Uses Bangalore Metro network and OSRM routing data for accurate station details and routing

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/karthikshettyk1810/Destination-based-Optimal-Metro-Station-Finder-for-Bengaluru.git
cd Destination-based-Optimal-Metro-Station-Finder-for-Bengaluru
```
### 2. Install python dependencies

```bash
pip install -r requirements.txt

-> It is recommended to use a virtual environment to isolate dependencies:
python -m venv venv
source venv/bin/activate      # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

### 3.Download large map and routing files (OSM/OSRM)

```Due to file size limits on GitHub, the large .osm and .osrm files required for routing are not included in the repository.

You need to download these files separately from:

Download OSRM & OSM files by Geofabrik from the brower

Once downloaded, create a folder named osrm-bangalore/ in the project root and place all the downloaded files there:
```
### 4. Start the program

``` bash
python3 app.py
```

