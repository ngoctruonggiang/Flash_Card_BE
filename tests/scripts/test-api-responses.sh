#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"
OUTPUT_FILE="api-responses.json"

echo "Starting API response testing..."
echo "{" > $OUTPUT_FILE

# 1. Register
echo -e "${BLUE}Testing Register...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser456","email":"testuser456@example.com","password":"12345678a","confirmPassword":"12345678a"}')
echo "  \"register\": $REGISTER_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Register tested${NC}"

# 2. Login and extract token
echo -e "${BLUE}Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser456@example.com","password":"12345678a"}')
echo "  \"login\": $LOGIN_RESPONSE," >> $OUTPUT_FILE

# Extract token (assuming response has accessToken in data object)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // .accessToken // empty')
echo -e "${GREEN}✓ Login tested (Token: ${TOKEN:0:20}...)${NC}"

# 3. Get Current User
echo -e "${BLUE}Testing Get Current User...${NC}"
USER_RESPONSE=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"getCurrentUser\": $USER_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Get Current User tested${NC}"

# 4. Update Current User
echo -e "${BLUE}Testing Update Current User...${NC}"
UPDATE_USER_RESPONSE=$(curl -s -X PATCH "$BASE_URL/user" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"updateduser456"}')
echo "  \"updateCurrentUser\": $UPDATE_USER_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Update Current User tested${NC}"

# 5. Create Deck
echo -e "${BLUE}Testing Create Deck...${NC}"
CREATE_DECK_RESPONSE=$(curl -s -X POST "$BASE_URL/deck" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Basic Math","description":"Simple arithmetic flashcards"}')
echo "  \"createDeck\": $CREATE_DECK_RESPONSE," >> $OUTPUT_FILE

# Extract deck ID
DECK_ID=$(echo $CREATE_DECK_RESPONSE | jq -r '.data.id // .id // empty')
echo -e "${GREEN}✓ Create Deck tested (Deck ID: $DECK_ID)${NC}"

# 6. Get All Decks For Current User
echo -e "${BLUE}Testing Get All Decks...${NC}"
GET_DECKS_RESPONSE=$(curl -s -X GET "$BASE_URL/deck" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"getAllDecks\": $GET_DECKS_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Get All Decks tested${NC}"

# 7. Get Deck By ID
echo -e "${BLUE}Testing Get Deck By ID...${NC}"
GET_DECK_RESPONSE=$(curl -s -X GET "$BASE_URL/deck/$DECK_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"getDeckById\": $GET_DECK_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Get Deck By ID tested${NC}"

# 8. Update Deck
echo -e "${BLUE}Testing Update Deck...${NC}"
UPDATE_DECK_RESPONSE=$(curl -s -X PATCH "$BASE_URL/deck/$DECK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Advanced Math","description":"Complex arithmetic flashcards"}')
echo "  \"updateDeck\": $UPDATE_DECK_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Update Deck tested${NC}"

# 9. Create Card
echo -e "${BLUE}Testing Create Card...${NC}"
CREATE_CARD_RESPONSE=$(curl -s -X POST "$BASE_URL/card" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deckId\":$DECK_ID,\"front\":\"What is 2+2?\",\"back\":\"4\",\"tags\":\"math,basics\"}")
echo "  \"createCard\": $CREATE_CARD_RESPONSE," >> $OUTPUT_FILE

# Extract card ID
CARD_ID=$(echo $CREATE_CARD_RESPONSE | jq -r '.data.id // .id // empty')
echo -e "${GREEN}✓ Create Card tested (Card ID: $CARD_ID)${NC}"

# 10. Get Cards By Deck
echo -e "${BLUE}Testing Get Cards By Deck...${NC}"
GET_CARDS_RESPONSE=$(curl -s -X GET "$BASE_URL/card?deckId=$DECK_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"getCardsByDeck\": $GET_CARDS_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Get Cards By Deck tested${NC}"

# 11. Get Card By ID
echo -e "${BLUE}Testing Get Card By ID...${NC}"
GET_CARD_RESPONSE=$(curl -s -X GET "$BASE_URL/card/$CARD_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"getCardById\": $GET_CARD_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Get Card By ID tested${NC}"

# 12. Update Card
echo -e "${BLUE}Testing Update Card...${NC}"
UPDATE_CARD_RESPONSE=$(curl -s -X PATCH "$BASE_URL/card/$CARD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"front":"What is 3+3?","back":"6"}')
echo "  \"updateCard\": $UPDATE_CARD_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Update Card tested${NC}"

# 13. Start Study Session
echo -e "${BLUE}Testing Start Study Session...${NC}"
START_STUDY_RESPONSE=$(curl -s -X GET "$BASE_URL/study/start/$DECK_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"startStudySession\": $START_STUDY_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Start Study Session tested${NC}"

# 14. Submit Card Review
echo -e "${BLUE}Testing Submit Card Review...${NC}"
SUBMIT_REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/study/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"CardReviews\":[{\"cardId\":$CARD_ID,\"quality\":\"Good\"}],\"reviewedAt\":\"2023-10-27T10:00:00Z\"}")
echo "  \"submitCardReview\": $SUBMIT_REVIEW_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Submit Card Review tested${NC}"

# 15. Delete Card
echo -e "${BLUE}Testing Delete Card...${NC}"
DELETE_CARD_RESPONSE=$(curl -s -X DELETE "$BASE_URL/card/$CARD_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"deleteCard\": $DELETE_CARD_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Delete Card tested${NC}"

# 16. Delete Deck
echo -e "${BLUE}Testing Delete Deck...${NC}"
DELETE_DECK_RESPONSE=$(curl -s -X DELETE "$BASE_URL/deck/$DECK_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"deleteDeck\": $DELETE_DECK_RESPONSE," >> $OUTPUT_FILE
echo -e "${GREEN}✓ Delete Deck tested${NC}"

# 17. Delete Current User
echo -e "${BLUE}Testing Delete Current User...${NC}"
DELETE_USER_RESPONSE=$(curl -s -X DELETE "$BASE_URL/user" \
  -H "Authorization: Bearer $TOKEN")
echo "  \"deleteCurrentUser\": $DELETE_USER_RESPONSE" >> $OUTPUT_FILE
echo -e "${GREEN}✓ Delete Current User tested${NC}"

echo "}" >> $OUTPUT_FILE

echo -e "${GREEN}All tests completed! Results saved to $OUTPUT_FILE${NC}"
