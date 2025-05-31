import google.generativeai as genai
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini with the API key
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=api_key)

def get_spell_correction(location: str) -> Optional[str]:
    """
    Use Gemini to correct spelling of location names.
    Returns the corrected location name or None if no correction needed.
    """
    try:
        # Create a model instance
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Create a prompt for spell checking
        prompt = f"""
You are an Indian‐English spell‐corrector specialized in geographic and place names, with a focus on Bangalore. 
Your task is to take one location string (which may be misspelled) and:

  1. Determine if the spelling is correct according to common Bangalore/Karnataka/India place‐name conventions.
  2. If it is correct, respond with exactly: CORRECT
  3. If it is incorrect, respond with only the corrected spelling (no extra words, no punctuation).

Below are examples of correct behavior. Always follow this format exactly:

Example 1:
Input: "Koramngala"
Output: "Koramangala"

Example 2:
Input: "Jeevanhalli"
Output: "Jeevanahalli"

Example 3:
Input: "Encora"
Output: CORRECT

Example 4:
Input: "Kammanhalli"
Output: "Kammanahalli"

Now, given the location name: "{location}"
Respond with either the single word CORRECT or the single corrected location name.
"""
        # Generate response
        response = model.generate_content(prompt)
        corrected = response.text.strip()
        
        # Return None if no correction needed, otherwise return the correction
        return None if corrected == "CORRECT" else corrected
        
    except Exception as e:
        print(f"Error in spell checking: {str(e)}")
        return None 
