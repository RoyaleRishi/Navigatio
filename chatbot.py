import google.generativeai as genai
from google.generativeai import types
from datetime import date

today = date.today()

def generate():
    client = genai.Client(
        vertexai=True,
        project="gen-lang-client-0235407741",
        location="global",
    )
    
    system_prompt = """You are a travel agent chatbot and your job is to get the following information from the user about the trip they are planning.
Ask questions progressively until you have information to fill this JSON file:
{
 "budget": "" (convert to one of: budget, mid-range, luxury, expensive),
 "starting_location": "",
 "destination": "",
 "accessibility_needs": "",
 "dietary_needs": "",
 "age_group_of_travelers": "",
 "interests": [],
 "how_packed_trip": "",
 "ok_with_walking": null,
 "dates_of_travel": {
 "start_date": "",
 "end_date": ""
 },
 "trip_type": "" (Convert to one of: business, family, romantic, friends, adventure, relaxation, cultural),
 "number_of_travelers": null
}

Ask one or two questions at a time to avoid overwhelming the user but be quick and finish the conversation as 
quickly as possible. Be friendly, conversational, and helpful. 
Once you have gathered all the information, let the user know that you have everything you need and summarize 
their trip preferences. Once you have all the infromation just print out the "CONVERSATION COMPLETE! NOW 
PROCESSING..." 

Note: Any date mentioned is assumed to be after {today}
"""

    msg1_text1 = types.Part.from_text(text=system_prompt)
    model = "gemini-2.5-flash"
    
    # Initialize conversation with system prompt
    contents = [
        types.Content(
            role="user",
            parts=[msg1_text1]
        ),
    ]
    
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        seed=0,
        max_output_tokens=8192,
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
        thinking_config=types.ThinkingConfig(
            thinking_budget=-1,
        ),
    )
    
    full_conversation_text = ""  # To store the entire conversation
    
    # Initial Chatbot Greeting
    print("Hi! I'm your travel agent Aitrav. Let's plan your trip together!\n")
    
    # Generate initial response
    chatbot_response = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        chatbot_response += chunk.text
        print(chunk.text, end="")
    
    print("\n")  # Add newline after initial response
    full_conversation_text += "Chatbot: " + chatbot_response + "\n"
    
    # Add the chatbot's initial response to the conversation history
    contents.append(
        types.Content(
            role="model",
            parts=[types.Part.from_text(text=chatbot_response)]
        )
    )
    
    # Main conversation loop
    while True:
        # Get user input
        user_input = input("\nYou: ").strip()
        
        # Check if user wants to exit
        if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye']:
            print("\nChatbot: Thank you for using Aitrav! Have a great trip!")
            break
        
        if not user_input:
            continue
        
        # Add user input to conversation history
        full_conversation_text += "User: " + user_input + "\n"
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_input)]
            )
        )
        
        # Generate chatbot response
        print("\nChatbot: ", end="")
        chatbot_response = ""
        try:
            for chunk in client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            ):
                chatbot_response += chunk.text
                print(chunk.text, end="")
            
            print()  # Add newline after response
            
            # Add to conversation history
            full_conversation_text += "Chatbot: " + chatbot_response + "\n"
            contents.append(
                types.Content(
                    role="model",
                    parts=[types.Part.from_text(text=chatbot_response)]
                )
            )
            
            # Check if the conversation seems complete
            # You can customize this logic based on your needs
            if "conversation complete" in chatbot_response.lower():
                print("\n" + "="*50)
                print("CONVERSATION COMPLETE!")
                print("="*50)
                break
            
        except Exception as e:
            print(f"\nError generating response: {e}")
            print("Please try again.")
            break
    
    print("\nFull conversation saved!")
    return full_conversation_text