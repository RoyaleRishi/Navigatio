import json
import google.generativeai as genai
from google.generativeai import types
import os

def parse_conversation_and_generate_json(full_conversation_text: str, output_filename: str = "trip_details.json"):
    """
    Parses the full conversation text using the Gemini API to extract trip details
    and saves them into a JSON file.

    Args:
        full_conversation_text (str): The complete chat log between the user and the travel agent.
        output_filename (str): The name of the JSON file to save the extracted data.
    """
    try:
        # Initialize the Gemini client
        client = genai.Client(
            vertexai=True,
            project="gen-lang-client-0235407741",
            location="global",
        )

        # Use the same model as the main chatbot for consistency
        model = "gemini-2.5-flash"

        # Create a detailed prompt for information extraction
        prompt = f"""You are an expert information extractor. Analyze the following conversation between a user and a travel agent chatbot, and extract ALL trip-related information into a JSON object.

IMPORTANT INSTRUCTIONS:
- Extract ONLY information that was explicitly mentioned in the conversation
- For missing information, use appropriate defaults: empty string "" for text, null for boolean/numbers, empty array [] for lists
- Format dates as YYYY-MM-DD (convert from any format mentioned)
- Be precise and don't make assumptions about information not clearly stated

TARGET JSON STRUCTURE:
{{
 "budget": "",
 "starting_location": "",
 "destination": "",
 "accessibility_needs": "",
 "accessibility": (true or false),
 "dietary_needs": "",
 "age_group_of_travelers": "",
 "interests": [],
 "how_packed_trip": "",
 "ok_with_walking": null,
 "dates_of_travel": {{
   "start_date": "",
   "end_date": ""
 }},
 "trip_type": "",
 "number_of_travelers": null
}}

CONVERSATION TO ANALYZE:
---
{full_conversation_text}
---

Based on the conversation above, extract the information and return ONLY the JSON object with the extracted data. Do not include any explanatory text, just the pure JSON."""

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)]
            ),
        ]

        # Configure for reliable JSON output
        generate_content_config = types.GenerateContentConfig(
            temperature=0.1,  # Very low temperature for consistent output
            top_p=0.9,
            max_output_tokens=2048,
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="OFF"
                )
            ],
        )

        # Call the Gemini API to generate content
        print("Extracting trip information from conversation...")
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )

        # Check if the response contains content
        if not response.candidates or not response.candidates[0].content.parts:
            print("Error: No response content found from Gemini API.")
            return None

        # Get the response text
        json_string = response.candidates[0].content.parts[0].text.strip()
        print("\n--- Raw response from Gemini ---")
        print(json_string)

        # Clean up the response if it contains extra text
        # Look for JSON object boundaries
        start_idx = json_string.find('{')
        end_idx = json_string.rfind('}') + 1
        
        if start_idx != -1 and end_idx != 0:
            json_string = json_string[start_idx:end_idx]
        
        print("\n--- Cleaned JSON ---")
        print(json_string)

        # Parse the JSON string into a Python dictionary
        try:
            extracted_data = json.loads(json_string)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print("Attempting to fix common JSON issues...")
            
            # Try to fix common issues
            json_string = json_string.replace("'", '"')  # Replace single quotes
            json_string = json_string.replace('True', 'true').replace('False', 'false')  # Fix boolean values
            json_string = json_string.replace('None', 'null')  # Fix None values
            
            try:
                extracted_data = json.loads(json_string)
                print("Successfully parsed after fixing JSON issues.")
            except json.JSONDecodeError as e2:
                print(f"Could not parse JSON even after fixes: {e2}")
                return None

        # Validate the extracted data structure
        required_fields = [
            "budget", "starting_location", "destination", "accessibility_needs",
            "dietary_needs", "age_group_of_travelers", "interests",
            "how_packed_trip", "ok_with_walking", "dates_of_travel",
            "trip_type", "number_of_travelers"
        ]
        
        # Ensure all required fields exist
        for field in required_fields:
            if field not in extracted_data:
                if field == "interests":
                    extracted_data[field] = []
                elif field in ["ok_with_walking", "number_of_travelers"]:
                    extracted_data[field] = None
                elif field == "dates_of_travel":
                    extracted_data[field] = {"start_date": "", "end_date": ""}
                else:
                    extracted_data[field] = ""

        # Ensure dates_of_travel has correct structure
        if "dates_of_travel" in extracted_data:
            if not isinstance(extracted_data["dates_of_travel"], dict):
                extracted_data["dates_of_travel"] = {"start_date": "", "end_date": ""}
            else:
                if "start_date" not in extracted_data["dates_of_travel"]:
                    extracted_data["dates_of_travel"]["start_date"] = ""
                if "end_date" not in extracted_data["dates_of_travel"]:
                    extracted_data["dates_of_travel"]["end_date"] = ""

        # Save the extracted data to a JSON file
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=4, ensure_ascii=False)

        print(f"\n✅ Successfully extracted information and saved to '{output_filename}'")
        print("\n--- EXTRACTED TRIP DETAILS ---")
        print(json.dumps(extracted_data, indent=2))
        
        return extracted_data

    except Exception as e:
        print(f"❌ An error occurred during extraction: {e}")
        print("Please check your Google Cloud credentials and project configuration.")
        return None

# Alternative function for testing/debugging
def test_extraction_with_sample():
    """Test the extraction with a sample conversation"""
    sample_conversation = """
Chatbot: Hi! I'm your travel agent. Let me help you plan your trip. Where would you like to go?
User: I want to go to Paris
Chatbot: Paris is wonderful! Where will you be traveling from?
User: New York
Chatbot: Great! How many people will be traveling?
User: Just me, solo trip
Chatbot: Perfect! What's your budget range for this trip?
User: Around $3000
Chatbot: Excellent! When are you planning to travel?
User: I want to go from March 15th to March 22nd, 2025
Chatbot: What are you most interested in during your Paris trip?
User: Art, museums, and good food
Chatbot: Do you have any dietary restrictions?
User: I'm vegetarian
Chatbot: Are you comfortable with walking around the city?
User: Yes, I love walking
Chatbot: Would you prefer a packed itinerary or a more relaxed pace?
User: Something balanced, not too rushed
"""
    
    result = parse_conversation_and_generate_json(sample_conversation, "test_extraction.json")
    return result

# if __name__ == "__main__":
#     with open("conversation.txt", "r", encoding="utf-8") as file:
#         conversation_text = file.read()
#     parse_conversation_and_generate_json(conversation_text, "trip_details.json")