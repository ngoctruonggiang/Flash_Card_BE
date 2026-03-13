# **FlashLearn API Documentation**

This document provides a comprehensive reference for the FlashLearn API. The API allows you to manage users, decks, and flashcards.

## **Base URL**

All API requests should be made to the base URL configured for the environment (e.g., http://localhost:3000/api). In this documentation, {{url}} refers to the base URL.

## **Authentication**

The API uses Bearer Token authentication.  
Most endpoints require a valid JWT token in the Authorization header.  
**Header Format:**

Authorization: Bearer \<your_token\>

## **Documentation Modules**

1. Auth Endpoints - Registration and Login.
2. User Endpoints - Profile management.
3. Deck Endpoints - Deck creation and statistics.
4. Card Endpoints - Flashcard management.
5. Study Endpoints - Study sessions and Spaced Repetition logic.
6. Errors & Notes - Standard error codes and general implementation notes.
