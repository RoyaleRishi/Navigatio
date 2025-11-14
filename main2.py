import customtkinter as ctk
import threading
import time
import json

import google.generativeai as genai
genai.configure(api_key="YOUR_GEMINI_KEY")
model = genai.GenerativeModel('gemini-pro')

def real_gemini_generate_query(destination, experience):
    prompt = f"Based on this destination '{destination}' and desired experience '{experience}', create a single, optimal search query string for the Google Maps Places API to find hotels."
    response = model.generate_content(prompt)
    return response.text.strip()
import googlemaps
gmaps = googlemaps.Client(key='YOUR_MAPS_KEY')

def real_google_maps_search(query):
    # This is a basic text search. The Places API is very complex.
    places_result = gmaps.places(query=query)

    # You need to parse places_result['results']
    # and for each place, get details (like reviews)
    # This often requires *another* call per-place (gmaps.place())
    # This part is complex.

    hotels = []
    for place in places_result.get('results', [])[:10]: # Limit to 10
        details = gmaps.place(place_id=place['place_id'], fields=['name', 'formatted_address', 'review', 'photo'])

        hotel_data = {
            "name": details['result'].get('name'),
            "location": details['result'].get('formatted_address'),
            "reviews": [r['text'] for r in details['result'].get('reviews', [])],
            "photo_refs": [p.get('photo_reference') for p in details['result'].get('photos', [])]
        }
        hotels.append(hotel_data)
    return hotels

def mock_gemini_analyze_hotel(hotel, experience):
    """
    (MOCK) Step 3: Analyzes a single hotel and decides if it fits.
    """
    print(f"Mock Gemini (Step 3): Analyzing '{hotel['name']}'...")
    time.sleep(1) # Simulate API delay
    
    # Real AI would do complex analysis. We'll do a simple keyword check.
    review_text = " ".join(hotel["reviews"]).lower()
    
    # Simple logic for the mock
    if "romantic" in experience.lower() and "romantic" in review_text:
        return {
            "name": hotel["name"],
            "included": True,
            "reasoning": "Reviews specifically mention romantic atmosphere, matching user query.",
            "review_summary": "Reviews are positive, highlighting a romantic and 5-star experience."
        }
    elif "quiet" in experience.lower() and "quiet" in review_text:
        return {
            "name": hotel["name"],
            "included": True,
            "reasoning": "Reviews mention 'quiet getaway', which fits the user's request.",
            "review_summary": "Positive reviews focused on the peaceful environment and good food."
        }
    else:
        return {
            "name": hotel["name"],
            "included": False,
            "reasoning": "Reviews mention 'loud noise' and do not match the 'romantic' or 'quiet' criteria.",
            "review_summary": "Negative reviews, citing noise and a lack of desired atmosphere."
        }

def mock_gemini_create_tierlist(analyzed_hotels):
    """
    (MOCK) Step 4: Takes the list of analyzed hotels and creates a Top 10 list.
    """
    print("Mock Gemini (Step 4): Creating Top 10 tier list...")
    time.sleep(1) # Simulate API delay
    
    # Filter for only included hotels
    included_hotels = [h for h in analyzed_hotels if h.get("included", False)]
    
    # Sort them (in a real app, Gemini would do the ranking based on criteria)
    # Here we just sort by name for a stable result
    included_hotels.sort(key=lambda x: x['name'])
    
    # Format as a Top 10 list
    top_10_list = []
    for i, hotel in enumerate(included_hotels[:10]): # Get top 10
        top_10_list.append({
            "rank": i + 1,
            "name": hotel["name"],
            "summary": hotel["review_summary"],
            "reason_for_inclusion": hotel["reasoning"]
        })
        
    return top_10_list

# --- CustomTkinter App ---

class HotelFinderApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("AI Hotel Finder")
        self.geometry("800x600")
        ctk.set_appearance_mode("System")
        ctk.set_default_color_theme("blue")

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # --- Input Frame ---
        self.input_frame = ctk.CTkFrame(self)
        self.input_frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.input_frame.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(self.input_frame, text="Destination:").grid(row=0, column=0, padx=10, pady=5, sticky="w")
        self.destination_entry = ctk.CTkEntry(self.input_frame, placeholder_text="e.g., Paris, France")
        self.destination_entry.grid(row=0, column=1, padx=10, pady=5, sticky="ew")

        ctk.CTkLabel(self.input_frame, text="Experience:").grid(row=1, column=0, padx=10, pady=5, sticky="w")
        self.experience_entry = ctk.CTkEntry(self.input_frame, placeholder_text="e.g., quiet, romantic, good food")
        self.experience_entry.grid(row=1, column=1, padx=10, pady=5, sticky="ew")

        self.search_button = ctk.CTkButton(self.input_frame, text="Find Hotels", command=self.start_hotel_search)
        self.search_button.grid(row=2, column=0, columnspan=2, padx=10, pady=10)

        # --- Output Frame ---
        self.output_frame = ctk.CTkFrame(self)
        self.output_frame.grid(row=1, column=0, padx=10, pady=10, sticky="nsew")
        self.output_frame.grid_columnconfigure(0, weight=1)
        self.output_frame.grid_rowconfigure(0, weight=1)

        self.output_textbox = ctk.CTkTextbox(self.output_frame, state="disabled", wrap="word")
        self.output_textbox.grid(row=0, column=0, padx=5, pady=5, sticky="nsew")

        # --- Status Frame ---
        self.status_frame = ctk.CTkFrame(self)
        self.status_frame.grid(row=2, column=0, padx=10, pady=(0, 10), sticky="nsew")
        self.status_frame.grid_columnconfigure(0, weight=1)
        
        self.status_label = ctk.CTkLabel(self.status_frame, text="Status: Idle")
        self.status_label.grid(row=0, column=0, padx=10, pady=5, sticky="w")
        
        self.progress_bar = ctk.CTkProgressBar(self.status_frame, mode="indeterminate")

    def start_hotel_search(self):
        """
        Kicks off the search process in a new thread to keep the UI responsive.
        """
        destination = self.destination_entry.get()
        experience = self.experience_entry.get()

        if not destination or not experience:
            self.update_status("Please enter a destination and desired experience.")
            return

        # Disable button, clear old results, show progress
        self.search_button.configure(state="disabled", text="Searching...")
        self.output_textbox.configure(state="normal")
        self.output_textbox.delete("1.0", "end")
        self.output_textbox.configure(state="disabled")
        self.progress_bar.grid(row=1, column=0, padx=10, pady=(0,5), sticky="ew")
        self.progress_bar.start()

        # Run the API pipeline in a separate thread
        search_thread = threading.Thread(
            target=self.run_search_pipeline,
            args=(destination, experience),
            daemon=True
        )
        search_thread.start()

    def run_search_pipeline(self, destination, experience):
        """
        This is the main logic function that runs in the background.
        It calls all the mock API functions in order.
        """
        try:
            # Step 1: Gemini -> Google Maps Query
            self.update_status("Step 1: Generating Google query...")
            maps_query = mock_gemini_generate_query(destination, experience)

            # Step 2: Google Maps -> Hotel List
            self.update_status("Step 2: Querying Google Maps...")
            hotels_list = mock_google_maps_search(maps_query)
            
            if not hotels_list:
                self.update_status("No hotels found for that query.")
                self.display_results("No hotels found.")
                return

            # Step 3: Loop -> Gemini (Analyze Each Hotel)
            self.update_status(f"Step 3: Analyzing {len(hotels_list)} hotels...")
            analyzed_hotels = []
            for hotel in hotels_list:
                analysis = mock_gemini_analyze_hotel(hotel, experience)
                analyzed_hotels.append(analysis)

            # Step 4: Gemini -> Top 10 List
            self.update_status("Step 4: Creating Top 10 list...")
            top_10_list = mock_gemini_create_tierlist(analyzed_hotels)

            # Step 5: Display Results
            self.update_status("Done!")
            self.display_results(top_10_list)

        except Exception as e:
            self.update_status(f"An error occurred: {e}")
            print(f"Error in pipeline: {e}")
        finally:
            # Re-enable button and stop progress bar
            self.after(0, self.search_button.configure, {"state": "normal", "text": "Find Hotels"})
            self.after(0, self.progress_bar.stop)
            self.after(0, self.progress_bar.grid_remove)

    def update_status(self, message):
        """
        Thread-safe way to update the status label from the background thread.
        """
        def do_update():
            self.status_label.configure(text=f"Status: {message}")
        
        # self.after schedules the update to run on the main UI thread
        self.after(0, do_update)

    def display_results(self, top_10_list):
        """
        Thread-safe way to display the final results in the textbox.
        """
        def do_display():
            self.output_textbox.configure(state="normal")
            self.output_textbox.delete("1.0", "end")
            
            # Format the JSON list for pretty printing
            formatted_output = json.dumps(top_10_list, indent=2)
            
            self.output_textbox.insert("1.0", formatted_output)
            self.output_textbox.configure(state="disabled")

        self.after(0, do_display)


if __name__ == "__main__":
    app = HotelFinderApp()
    app.mainloop()