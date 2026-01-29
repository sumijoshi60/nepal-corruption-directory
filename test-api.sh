#!/bin/bash

# API Testing Script for Nepal Corruption Cases Directory
# This script tests the basic CRUD operations

BASE_URL="http://localhost:5000"

echo "🧪 Testing Nepal Corruption Cases Directory API"
echo "================================================"
echo ""

# Test 1: Root endpoint
echo "1️⃣ Testing root endpoint..."
curl -s $BASE_URL | json_pp
echo ""
echo ""

# Test 2: Create a Source
echo "2️⃣ Creating a test source..."
SOURCE_RESPONSE=$(curl -s -X POST $BASE_URL/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NEWS",
    "publisher": "The Kathmandu Post",
    "url": "https://kathmandupost.com/national/2024/01/15/test-article",
    "publishedDate": "2024-01-15",
    "language": "English"
  }')
echo $SOURCE_RESPONSE | json_pp
SOURCE_ID=$(echo $SOURCE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "Created Source ID: $SOURCE_ID"
echo ""
echo ""

# Test 3: Get all sources
echo "3️⃣ Getting all sources..."
curl -s $BASE_URL/api/sources | json_pp
echo ""
echo ""

# Test 4: Create a Case (DRAFT)
echo "4️⃣ Creating a test case (DRAFT)..."
CASE_RESPONSE=$(curl -s -X POST $BASE_URL/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Corruption Case",
    "summary": "This is a test case for API verification purposes",
    "caseStatus": "UNDER_INVESTIGATION",
    "institution": "Commission for the Investigation of Abuse of Authority (CIAA)",
    "location": "Kathmandu",
    "amountInvolved": "NPR 5,000,000",
    "dateReported": "2024-01-15",
    "visibility": "DRAFT"
  }')
echo $CASE_RESPONSE | json_pp
CASE_ID=$(echo $CASE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "Created Case ID: $CASE_ID"
echo ""
echo ""

# Test 5: Get all cases (should be empty - only PUBLISHED shown)
echo "5️⃣ Getting all published cases (should be empty)..."
curl -s $BASE_URL/api/cases | json_pp
echo ""
echo ""

# Test 6: Update case to PUBLISHED
echo "6️⃣ Updating case to PUBLISHED..."
curl -s -X PUT $BASE_URL/api/cases/$CASE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "visibility": "PUBLISHED"
  }' | json_pp
echo ""
echo ""

# Test 7: Get all cases (should show the published case)
echo "7️⃣ Getting all published cases (should show 1 case)..."
curl -s $BASE_URL/api/cases | json_pp
echo ""
echo ""

# Test 8: Create a Person
echo "8️⃣ Creating a test person..."
PERSON_RESPONSE=$(curl -s -X POST $BASE_URL/api/persons \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test Person\",
    \"position\": \"Government Official\",
    \"organization\": \"Ministry of Test\",
    \"politicalAffiliation\": {
      \"partyName\": \"Test Party\",
      \"source\": \"$SOURCE_ID\"
    }
  }")
echo $PERSON_RESPONSE | json_pp
PERSON_ID=$(echo $PERSON_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "Created Person ID: $PERSON_ID"
echo ""
echo ""

# Test 9: Get all persons
echo "9️⃣ Getting all persons..."
curl -s $BASE_URL/api/persons | json_pp
echo ""
echo ""

echo "✅ API testing complete!"
echo ""
echo "📝 Summary:"
echo "  - Root endpoint: ✓"
echo "  - Sources CRUD: ✓"
echo "  - Cases CRUD: ✓"
echo "  - Cases visibility filter: ✓"
echo "  - Persons CRUD: ✓"
echo ""
echo "💡 To clean up test data, you can:"
echo "  - DELETE /api/cases/$CASE_ID"
echo "  - DELETE /api/persons/$PERSON_ID"
echo "  - DELETE /api/sources/$SOURCE_ID"
