# DKGPedia Frontend Testing Interface

A beautiful, modern React frontend for testing all DKGPedia plugin functionalities.

## Features

### 1. Publish Community Notes
- Create regular (free) or user-contributed (paywalled) notes
- Add category metrics (key-value pairs)
- Add notable instances with categories
- Specify primary and secondary sources
- Set trust scores (0-100)
- Configure payment details for paywalled content

### 2. Query Specific Notes
- Query notes by topic ID
- View all note details including payment information
- See paywall status and pricing

### 3. Search Notes
- Search by keyword
- Filter by trust score range
- Limit results
- View all matching notes in a beautiful grid layout

## Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Make sure the DKG node is running:**
```bash
# In the main dkg-node-main directory
npm run dev
```

The frontend will be available at: **http://localhost:3000**

The backend API should be running at: **http://localhost:9200**

## Usage

### Publishing a Regular Note

1. Go to the "Publish Note" tab
2. Fill in:
   - Topic ID: `climate-change-2024`
   - Trust Score: `85`
   - Summary: Your summary text
   - Primary Source: `Climate Research Database`
   - Secondary Source: `NOAA Records`
   - Add category metrics (e.g., accuracy: 12, citations: 20)
   - Optionally add notable instances
   - Keep contribution type as "Regular"
3. Click "Publish to DKG"

### Publishing a Paywalled Note

1. Same as above, but:
   - Change contribution type to "User Contributed"
   - Add wallet address (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)
   - Set price in USD (e.g., `2.50`)
3. Click "Publish to DKG"

### Querying a Note

1. Go to the "Query Note" tab
2. Enter the topic ID
3. Click "Query DKG"
4. View the full note details

### Searching Notes

1. Go to the "Search Notes" tab
2. Optionally enter:
   - Keyword to search
   - Min/Max trust score
   - Result limit
3. Click "Search DKG"
4. Browse results in the grid

## API Endpoints Used

- `POST /dkgpedia/community-notes` - Publish notes
- `GET /dkgpedia/community-notes/:topicId` - Query specific note
- `GET /dkgpedia/community-notes?keyword=...&minTrustScore=...` - Search notes

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Vanilla CSS** - Styling with gradients and modern design
- **Fetch API** - HTTP requests to DKG node

## Design Features

- 🎨 Beautiful gradient background
- 💳 Card-based layout
- 🎯 Responsive design
- ✨ Smooth animations and transitions
- 🎭 Color-coded response boxes (success/error)
- 📊 Grid layout for search results
- 🏷️ Badge system for paywalled content
- 🎪 Tab-based navigation

Enjoy testing DKGPedia! 🚀

