from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from waitress import serve
import datetime

app = Flask(__name__)
CORS(app)  # Add this line to enable CORS

@app.route('/add_pet', methods=['POST'])
def add_pet():
    try:
        pet_data = request.json
        
        # Load existing pets data
        with open('pets.json', 'r') as file:
            pets = json.load(file)
        
        # Add new pet to the list
        pets.append(pet_data)
        
        # Write updated data back to pets.json
        with open('pets.json', 'w') as file:
            json.dump(pets, file, indent=2)
        
        return jsonify({'message': 'Pet added successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/total_pets', methods=['GET'])
def total_pets():
    try:
        # Load existing pets data
        with open('pets.json', 'r') as file:
            pets = json.load(file)
        
        # Calculate total number of pets
        total_pets = len(pets)
        
        return jsonify({'totalPets': total_pets}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_reminders', methods=['GET'])
def get_reminders():
    # Read pets.json file
    with open('pets.json', 'r') as file:
        pets = json.load(file)

    # Get current time
    current_time = datetime.datetime.now()
    
    # List to store reminders
    reminders = []

    # Check scheduled time for each plant
    for plant in pets:
        scheduled_hour, scheduled_minute = map(int, plant.get('age').split(':'))  # Assuming 'age' field contains scheduled time in HH:MM format

        current_hour = current_time.hour
        current_minute = current_time.minute
        if current_hour == scheduled_hour and abs(current_minute - scheduled_minute) <= 5:
            reminders.append(plant)
            
           

    # Return reminders as JSON response
    return jsonify(reminders)



if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
