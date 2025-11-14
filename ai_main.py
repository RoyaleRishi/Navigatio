from chatbot import generate
from gen_json import parse_conversation_and_generate_json
from placesApiCalled import generate_places_api_calls
from ranker import PlaceScorer
from gen_iten import TripItineraryGenerator
import json
import os
import dotenv

dotenv.load_dotenv()
my_api_key = os.getenv("API_KEY")

def main():
    """
    Main function to run the AI chatbot for travel planning.
    """
    print("Welcome to Aitrav! Your AI travel assistant.")
    print("You can ask me about your trip, get recommendations, or just chat!")
    
    #Start the chatbot conversation
    conversation = generate()
    with open("conversation.txt", "w", encoding="utf-8") as file:
        file.write(conversation)

    parse_conversation_and_generate_json(conversation)

    with open("trip_details.json", "r", encoding="utf-8") as file:
        trip = json.load(file)
    generate_places_api_calls(trip, my_api_key)

    scorer = PlaceScorer(my_api_key, my_api_key)
    try:
        results = scorer.score_all_places()
        scorer.save_results(results)
    except KeyboardInterrupt:
        print("\n\nProcess interrupted by user. Partial results may have been saved.")
    except Exception as e:
        print(f"\n\nError during scoring process: {str(e)}")
        print("Partial results may have been saved.")

    trip_details_path = 'trip_details.json'
    attractions_path = 'scored_attractions.json'
    restaurants_path = 'scored_restaurants.json'
    lodging_path = 'scored_lodging.json'
    output_path = 'trip_itinerary.json'
    generator = TripItineraryGenerator(my_api_key)
    try:
        generator.process_trip_files(
            trip_details_path,
            attractions_path,
            restaurants_path,
            lodging_path,
            output_path
        )
    except Exception as e:
        print(f"Error generating itinerary: {e}")
        raise

if __name__ == "__main__":
    main()