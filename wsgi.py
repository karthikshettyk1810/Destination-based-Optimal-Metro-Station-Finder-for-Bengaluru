import sys
import os

# Add virtual environment path
venv_path = '/home/karthik8105/NearDest/venv/lib/python3.12/site-packages'
if venv_path not in sys.path:
    sys.path.insert(0, venv_path)

# Add your project directory to the sys.path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

# Set environment variables
os.environ['LOCATIONIQ_KEY'] = 'pk.d16afbf9cb0422358a282b6d1ba31926'

from app import app as application 