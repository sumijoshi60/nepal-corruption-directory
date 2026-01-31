# CIAA Integration Test Plan

## Test Objectives
Verify that 2,600 CIAA corruption cases are correctly integrated into the Nepal Corruption Directory with functional search and filtering capabilities.

---

## Test Suite 1: API Endpoint Tests

### Test 1.1: Get All Cases (Default)
**Endpoint:** `GET /api/public/cases?limit=10`
**Expected:**
- ✓ Returns 10 cases
- ✓ Status code: 200
- ✓ Response includes total count
- ✓ Data contains mix of CIAA and manual cases

### Test 1.2: Filter by Category - Charge Sheet
**Endpoint:** `GET /api/public/cases?category=Charge%20Sheet&limit=5`
**Expected:**
- ✓ Returns only Charge Sheet cases
- ✓ All cases have `category: "Charge Sheet"`
- ✓ Total count ≈ 1,663

### Test 1.3: Filter by Category - Sting Operation
**Endpoint:** `GET /api/public/cases?category=Sting%20Operation&limit=5`
**Expected:**
- ✓ Returns only Sting Operation cases
- ✓ Total count ≈ 527

### Test 1.4: Filter by Category - Appeal
**Endpoint:** `GET /api/public/cases?category=Appeal&limit=5`
**Expected:**
- ✓ Returns only Appeal cases
- ✓ Total count ≈ 410

### Test 1.5: Filter by Fiscal Year - Current (2082/83)
**Endpoint:** `GET /api/public/cases?fiscalYear=2082/83`
**Expected:**
- ✓ Returns ≈154 cases
- ✓ All cases have `fiscalYear: "2082/83"`

### Test 1.6: Filter by Fiscal Year - Peak Year (2076/77)
**Endpoint:** `GET /api/public/cases?fiscalYear=2076/77`
**Expected:**
- ✓ Returns ≈570 cases
- ✓ All cases have `fiscalYear: "2076/77"`

### Test 1.7: Combined Filters (Category + Fiscal Year)
**Endpoint:** `GET /api/public/cases?category=Charge%20Sheet&fiscalYear=2082/83`
**Expected:**
- ✓ Returns cases matching BOTH criteria
- ✓ Count < 154 (subset of fiscal year)

### Test 1.8: Filter by Data Source - CIAA Only
**Endpoint:** `GET /api/public/cases?dataSource=CIAA&limit=50`
**Expected:**
- ✓ All cases have `dataSource: "CIAA"`
- ✓ Total count = 2,600

---

## Test Suite 2: Frontend UI Tests

### Test 2.1: Homepage Loads
**URL:** `http://localhost:3000`
**Expected:**
- ✓ Page loads successfully
- ✓ Filter form is visible
- ✓ Cases list is displayed
- ✓ Pagination controls are present

### Test 2.2: Category Filter Dropdown
**Action:** Click Category dropdown
**Expected:**
- ✓ Options visible: All Categories, Charge Sheet, Sting Operation, Appeal
- ✓ Dropdown is styled correctly

### Test 2.3: Fiscal Year Filter Dropdown
**Action:** Click Fiscal Year dropdown
**Expected:**
- ✓ 10 fiscal year options (2074/75 to 2082/83)
- ✓ Shows both Nepali and Gregorian years

### Test 2.4: Apply Category Filter
**Action:** 
1. Select "Charge Sheet" from Category
2. Click "Apply Filters"

**Expected:**
- ✓ URL updates with `?category=Charge%20Sheet`
- ✓ Cases filtered to Charge Sheets only
- ✓ Case count updates
- ✓ All displayed cases show Charge Sheet category

### Test 2.5: Apply Fiscal Year Filter
**Action:**
1. Select "2082/83 (2025/26)" from Fiscal Year
2. Click "Apply Filters"

**Expected:**
- ✓ URL updates with `?fiscalYear=2082/83`
- ✓ Shows ≈154 recent cases
- ✓ All cases from fiscal year 2082/83

### Test 2.6: Apply Combined Filters
**Action:**
1. Select "Sting Operation" from Category
2. Select "2076/77 (2019/20)" from Fiscal Year
3. Click "Apply Filters"

**Expected:**
- ✓ URL has both parameters
- ✓ Only Sting Operations from 2076/77 shown
- ✓ Correct count displayed

### Test 2.7: Reset Filters
**Action:** Click "Reset" button
**Expected:**
- ✓ URL clears to just `/`
- ✓ All filters reset to default
- ✓ Shows all cases (mixed CIAA + manual)

### Test 2.8: Pagination with Filters
**Action:**
1. Apply Category filter
2. Navigate to page 2

**Expected:**
- ✓ Filter persists across pages
- ✓ URL includes both `category` and `page` params
- ✓ Correct cases shown on page 2

---

## Test Suite 3: Data Integrity Tests

### Test 3.1: Nepali Text Display
**Action:** View CIAA case details
**Expected:**
- ✓ Nepali characters render correctly
- ✓ Title in Devanagari script is readable
- ✓ No encoding errors (e.g., ���)

### Test 3.2: CIAA Fields Present
**Action:** Check case data structure
**Expected:**
- ✓ `category` field populated
- ✓ `fiscalYear` field present
- ✓ `detailUrl` links to ciaa.gov.np
- ✓ `dataSource: "CIAA"` set

### Test 3.3: Case Count Accuracy
**Action:** Query database directly
**Expected:**
- ✓ Total CIAA cases = 2,600
- ✓ Charge Sheets = 1,663
- ✓ Sting Operations = 527
- ✓ Appeals = 410

### Test 3.4: Date Range Verification
**Action:** Filter by different fiscal years
**Expected:**
- ✓ Earliest cases from 2074/75 (2017/18)
- ✓ Latest cases from 2082/83 (2025/26)
- ✓ No future dates

---

## Test Suite 4: Performance Tests

### Test 4.1: API Response Time
**Action:** Measure response time for filtered queries
**Expected:**
- ✓ Simple filter (category): < 500ms
- ✓ Combined filters: < 1000ms
- ✓ Large result set (all CIAA): < 2000ms

### Test 4.2: Frontend Load Time
**Action:** Measure page load
**Expected:**
- ✓ Initial load: < 3 seconds
- ✓ Filter application: < 1 second
- ✓ No console errors

---

## Test Suite 5: Edge Cases

### Test 5.1: Empty Results
**Action:** Apply filter with no matches
**Expected:**
- ✓ Shows "No cases found" message
- ✓ No errors thrown
- ✓ UI remains functional

### Test 5.2: Special Characters in Search
**Action:** Search with Nepali keywords
**Expected:**
- ✓ Search works with Devanagari script
- ✓ Results match Nepali text in titles
- ✓ No encoding issues

### Test 5.3: Invalid Fiscal Year
**Action:** Manually enter invalid fiscal year in URL
**Expected:**
- ✓ Returns empty or ignores invalid value
- ✓ No server error
- ✓ Graceful handling

---

## Success Criteria

**Must Pass:**
- ✅ All API endpoint tests (Suite 1)
- ✅ All UI filter tests (Suite 2)
- ✅ Data integrity tests (Suite 3)

**Should Pass:**
- ✅ Performance tests (Suite 4)
- ✅ Edge case tests (Suite 5)

**Acceptance:** ≥90% of tests passing
