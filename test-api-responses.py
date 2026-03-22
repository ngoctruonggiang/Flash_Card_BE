import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3000/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}\n")

def save_response(name, response):
    """Save response to a dictionary for later use"""
    responses[name] = {
        "status_code": response.status_code,
        "body": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
    }
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(responses[name]['body'], indent=2)}\n")
    return response

# Store all responses
responses = {}

try:
    # 1. Register
    print_section("1. Testing Register")
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "username": "testuser789",
            "email": "testuser789@example.com",
            "password": "12345678a",
            "confirmPassword": "12345678a"
        }
    )
    save_response("register", response)

    # 2. Login
    print_section("2. Testing Login")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "testuser789@example.com",
            "password": "12345678a"
        }
    )
    save_response("login", response)
    
    # Extract token
    token = None
    if response.status_code == 200:
        login_data = response.json()
        token = login_data.get('data', {}).get('accessToken') or login_data.get('accessToken')
        print(f"Token extracted: {token[:20] if token else 'None'}...")

    if not token:
        print("ERROR: Could not extract token. Stopping tests.")
        exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get Current User
    print_section("3. Testing Get Current User")
    response = requests.get(f"{BASE_URL}/user", headers=headers)
    save_response("getCurrentUser", response)

    # 4. Update Current User
    print_section("4. Testing Update Current User")
    response = requests.patch(
        f"{BASE_URL}/user",
        headers=headers,
        json={"username": "updateduser789"}
    )
    save_response("updateCurrentUser", response)

    # 5. Create Deck
    print_section("5. Testing Create Deck")
    response = requests.post(
        f"{BASE_URL}/deck",
        headers=headers,
        json={
            "title": "Basic Math",
            "description": "Simple arithmetic flashcards"
        }
    )
    save_response("createDeck", response)
    
    # Extract deck ID
    deck_id = None
    if response.status_code == 201:
        deck_data = response.json()
        deck_id = deck_data.get('data', {}).get('id') or deck_data.get('id')
        print(f"Deck ID extracted: {deck_id}")

    # 6. Get All Decks For Current User
    print_section("6. Testing Get All Decks For Current User")
    response = requests.get(f"{BASE_URL}/deck", headers=headers)
    save_response("getAllDecks", response)

    # 7. Get Deck By ID
    if deck_id:
        print_section("7. Testing Get Deck By ID")
        response = requests.get(f"{BASE_URL}/deck/{deck_id}", headers=headers)
        save_response("getDeckById", response)

    # 8. Update Deck
    if deck_id:
        print_section("8. Testing Update Deck")
        response = requests.patch(
            f"{BASE_URL}/deck/{deck_id}",
            headers=headers,
            json={
                "title": "Advanced Math",
                "description": "Complex arithmetic flashcards"
            }
        )
        save_response("updateDeck", response)

    # 9. Create Card
    if deck_id:
        print_section("9. Testing Create Card")
        response = requests.post(
            f"{BASE_URL}/card",
            headers=headers,
            json={
                "deckId": deck_id,
                "front": "What is 2+2?",
                "back": "4",
                "tags": "math,basics"
            }
        )
        save_response("createCard", response)
        
        # Extract card ID
        card_id = None
        if response.status_code == 201:
            card_data = response.json()
            card_id = card_data.get('data', {}).get('id') or card_data.get('id')
            print(f"Card ID extracted: {card_id}")

    # 10. Get Cards By Deck
    if deck_id:
        print_section("10. Testing Get Cards By Deck")
        response = requests.get(f"{BASE_URL}/card?deckId={deck_id}", headers=headers)
        save_response("getCardsByDeck", response)

    # 11. Get Card By ID
    if card_id:
        print_section("11. Testing Get Card By ID")
        response = requests.get(f"{BASE_URL}/card/{card_id}", headers=headers)
        save_response("getCardById", response)

    # 12. Update Card
    if card_id:
        print_section("12. Testing Update Card")
        response = requests.patch(
            f"{BASE_URL}/card/{card_id}",
            headers=headers,
            json={
                "front": "What is 3+3?",
                "back": "6"
            }
        )
        save_response("updateCard", response)

    # 13. Start Study Session
    if deck_id:
        print_section("13. Testing Start Study Session")
        response = requests.get(f"{BASE_URL}/study/start/{deck_id}", headers=headers)
        save_response("startStudySession", response)

    # 14. Submit Card Review
    if card_id:
        print_section("14. Testing Submit Card Review")
        response = requests.post(
            f"{BASE_URL}/study/review",
            headers=headers,
            json={
                "CardReviews": [
                    {
                        "cardId": card_id,
                        "quality": "Good"
                    }
                ],
                "reviewedAt": "2023-10-27T10:00:00Z"
            }
        )
        save_response("submitCardReview", response)

    # 15. Delete Card
    if card_id:
        print_section("15. Testing Delete Card")
        response = requests.delete(f"{BASE_URL}/card/{card_id}", headers=headers)
        save_response("deleteCard", response)

    # 16. Delete Deck
    if deck_id:
        print_section("16. Testing Delete Deck")
        response = requests.delete(f"{BASE_URL}/deck/{deck_id}", headers=headers)
        save_response("deleteDeck", response)

    # 17. Delete Current User
    print_section("17. Testing Delete Current User")
    response = requests.delete(f"{BASE_URL}/user", headers=headers)
    save_response("deleteCurrentUser", response)

    # Save all responses to file
    print_section("Saving all responses to file")
    with open('api-responses.json', 'w') as f:
        json.dump(responses, f, indent=2)
    print("All responses saved to api-responses.json")

except Exception as e:
    print(f"\nERROR: {str(e)}")
    import traceback
    traceback.print_exc()
