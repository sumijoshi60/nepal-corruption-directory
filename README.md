# Nepal Corruption Cases Directory - Backend API

A minimal, legally safe backend API for manually entering and retrieving corruption-related cases reported in Nepal.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Module System**: ES Modules
- **Dependencies**: dotenv, cors

## Features

- Manual entry and retrieval of corruption cases
- Four core data models: Case, Person, Source, and CasePerson (relationship)
- RESTful API with CRUD operations
- Published/Draft visibility control for cases
- Relationship tracking between cases and persons
- Source documentation for all entries

## Project Structure

```
nepal-corruption-directory/
├── src/
│   ├── models/
│   │   ├── Case.js           # Case model with status tracking
│   │   ├── Person.js          # Person model with political affiliation
│   │   ├── Source.js          # Source model for documentation
│   │   └── CasePerson.js      # Relationship model
│   ├── routes/
│   │   ├── cases.js           # Case CRUD routes
│   │   ├── persons.js         # Person CRUD routes
│   │   └── sources.js         # Source CRUD routes
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   └── app.js                 # Express application entry point
├── .env.example               # Environment variables template
└── package.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your MongoDB connection string
```

3. Make sure MongoDB is running (locally or use MongoDB Atlas)

## Running the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Cases
- `GET /api/cases` - Get all published cases
- `GET /api/cases/:id` - Get a specific case
- `POST /api/cases` - Create a new case
- `PUT /api/cases/:id` - Update a case
- `DELETE /api/cases/:id` - Delete a case

### Persons
- `GET /api/persons` - Get all persons
- `GET /api/persons/:id` - Get a specific person
- `POST /api/persons` - Create a new person
- `PUT /api/persons/:id` - Update a person
- `DELETE /api/persons/:id` - Delete a person

### Sources
- `GET /api/sources` - Get all sources
- `GET /api/sources/:id` - Get a specific source
- `POST /api/sources` - Create a new source
- `PUT /api/sources/:id` - Update a source
- `DELETE /api/sources/:id` - Delete a source

## Data Models

### Case
- title (required)
- summary (required)
- caseStatus: ALLEGED | UNDER_INVESTIGATION | CASE_FILED | ON_TRIAL | CONVICTED | ACQUITTED | CLOSED
- institution (required)
- location
- amountInvolved
- dateReported (required)
- visibility: DRAFT | PUBLISHED (default: DRAFT)

### Person
- fullName (required)
- position
- organization
- politicalAffiliation:
  - partyName
  - source (reference to Source)

### Source
- type: NEWS | OFFICIAL | COURT (required)
- publisher (required)
- url (required)
- publishedDate
- language

### CasePerson (Relationship)
- case (reference to Case, required)
- person (reference to Person, required)
- roleInCase: ACCUSED | INVESTIGATOR | WITNESS (required)
- statusLabel: ALLEGED | CASE_FILED | ON_TRIAL | CONVICTED | ACQUITTED (required)
- source (reference to Source, required)

## Important Notes

- This platform documents **publicly reported cases only**
- No web scraping, AI, or automated publishing
- Cases must be manually set to "PUBLISHED" to appear in public listings
- Neutral, non-accusatory structure for legal safety
- No authentication system (can be added later)

## Environment Variables

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/nepal-corruption-directory
NODE_ENV=development
```

For production with MongoDB Atlas:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nepal-corruption-directory?retryWrites=true&w=majority
```

## Example API Usage

### Create a Source
```bash
curl -X POST http://localhost:5000/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NEWS",
    "publisher": "The Kathmandu Post",
    "url": "https://example.com/article",
    "publishedDate": "2024-01-15",
    "language": "English"
  }'
```

### Create a Case
```bash
curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Case Title",
    "summary": "Case summary",
    "caseStatus": "UNDER_INVESTIGATION",
    "institution": "CIAA",
    "location": "Kathmandu",
    "dateReported": "2024-01-15",
    "visibility": "DRAFT"
  }'
```

### Get Published Cases
```bash
curl http://localhost:5000/api/cases
```

## License

ISC
# nepal-corruption-directory
