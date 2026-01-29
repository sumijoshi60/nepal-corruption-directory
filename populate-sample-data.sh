#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🔧 Populating sample data..."
echo ""

# 1. Create NEWS Source
echo "1️⃣ Creating NEWS source..."
NEWS_SOURCE=$(curl -s -X POST $BASE_URL/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NEWS",
    "publisher": "The Kathmandu Post",
    "url": "https://kathmandupost.com/national/2024/sample-article",
    "publishedDate": "2024-01-20",
    "language": "English"
  }')
NEWS_SOURCE_ID=$(echo $NEWS_SOURCE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ NEWS Source ID: $NEWS_SOURCE_ID"
echo ""

# 2. Create OFFICIAL Source
echo "2️⃣ Creating OFFICIAL source..."
OFFICIAL_SOURCE=$(curl -s -X POST $BASE_URL/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OFFICIAL",
    "publisher": "Commission for the Investigation of Abuse of Authority (CIAA)",
    "url": "https://ciaa.gov.np/uploads/reports/2024/case-report.pdf",
    "publishedDate": "2024-01-18",
    "language": "Nepali"
  }')
OFFICIAL_SOURCE_ID=$(echo $OFFICIAL_SOURCE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ OFFICIAL Source ID: $OFFICIAL_SOURCE_ID"
echo ""

# 3. Create Person 1
echo "3️⃣ Creating Person 1 (Government Official)..."
PERSON_1=$(curl -s -X POST $BASE_URL/api/persons \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Ram Prasad Sharma\",
    \"position\": \"Secretary\",
    \"organization\": \"Ministry of Physical Infrastructure and Transport\",
    \"politicalAffiliation\": {
      \"partyName\": \"Nepal Communist Party\",
      \"source\": \"$NEWS_SOURCE_ID\"
    }
  }")
PERSON_1_ID=$(echo $PERSON_1 | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ Person 1 ID: $PERSON_1_ID (Ram Prasad Sharma)"
echo ""

# 4. Create Person 2
echo "4️⃣ Creating Person 2 (CIAA Investigator)..."
PERSON_2=$(curl -s -X POST $BASE_URL/api/persons \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Sita Kumari Adhikari",
    "position": "Senior Investigation Officer",
    "organization": "Commission for the Investigation of Abuse of Authority (CIAA)"
  }')
PERSON_2_ID=$(echo $PERSON_2 | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ Person 2 ID: $PERSON_2_ID (Sita Kumari Adhikari)"
echo ""

# 5. Create Case
echo "5️⃣ Creating Case..."
CASE=$(curl -s -X POST $BASE_URL/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Road Construction Irregularities - Pokhara-Baglung Highway Project",
    "summary": "Investigation initiated into alleged financial irregularities during the tendering process of the Pokhara-Baglung Highway construction project. Reported irregularities include non-compliance with procurement procedures and undisclosed conflicts of interest.",
    "caseStatus": "CASE_FILED",
    "institution": "Commission for the Investigation of Abuse of Authority (CIAA)",
    "location": "Pokhara, Kaski District",
    "amountInvolved": "NPR 45,000,000",
    "dateReported": "2024-01-18",
    "visibility": "DRAFT"
  }')
CASE_ID=$(echo $CASE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ Case ID: $CASE_ID"
echo ""

# 6. Create CasePerson 1 (ACCUSED)
echo "6️⃣ Creating CasePerson 1 (ACCUSED)..."
CP1_RESPONSE=$(curl -s -X POST $BASE_URL/api/case-persons \
  -H "Content-Type: application/json" \
  -d "{
    \"case\": \"$CASE_ID\",
    \"person\": \"$PERSON_1_ID\",
    \"roleInCase\": \"ACCUSED\",
    \"statusLabel\": \"CASE_FILED\",
    \"source\": \"$OFFICIAL_SOURCE_ID\"
  }")
CP1_ID=$(echo $CP1_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ CasePerson 1 ID: $CP1_ID"
echo ""

# 7. Create CasePerson 2 (INVESTIGATOR)
echo "7️⃣ Creating CasePerson 2 (INVESTIGATOR)..."
CP2_RESPONSE=$(curl -s -X POST $BASE_URL/api/case-persons \
  -H "Content-Type: application/json" \
  -d "{
    \"case\": \"$CASE_ID\",
    \"person\": \"$PERSON_2_ID\",
    \"roleInCase\": \"INVESTIGATOR\",
    \"statusLabel\": \"CASE_FILED\",
    \"source\": \"$OFFICIAL_SOURCE_ID\"
  }")
CP2_ID=$(echo $CP2_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "   ✅ CasePerson 2 ID: $CP2_ID"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Sample data populated successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "  ✓ 2 Sources created (NEWS, OFFICIAL)"
echo "  ✓ 2 Persons created (with political affiliation)"
echo "  ✓ 1 Case created (DRAFT status)"
echo "  ✓ 2 CasePerson relationships created"
echo ""
echo "🔍 Test Queries:"
echo ""
echo "Get all persons in the case:"
echo "  curl $BASE_URL/api/case-persons/case/$CASE_ID | json_pp"
echo ""
echo "Get all cases for Person 1 (Ram Prasad Sharma):"
echo "  curl $BASE_URL/api/case-persons/person/$PERSON_1_ID | json_pp"
echo ""
echo "Get all case-person relationships:"
echo "  curl $BASE_URL/api/case-persons | json_pp"
echo ""
