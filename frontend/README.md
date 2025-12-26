# Agentic Schedule - Offline First Scheduling Tool

A React-based offline-first scheduling application that allows you to upload Excel files, validate them against database schemas, import data into the scheduling system, and view all current data in the system.

## Features

### Excel Data Import
- **Excel File Upload**: Upload Excel files (.xlsx, .xls) with multiple sheets
- **Database Schema Validation**: Automatically validate Excel columns against database tables
- **Visual Feedback**: Color-coded column headers for validation status
  - 🟢 **Green**: Valid columns (match database schema)
  - 🟠 **Orange**: Extra columns (not in database schema)
  - 🔴 **Red**: Missing required columns
- **Multi-Sheet Support**: Handle Excel files with multiple sheets
- **Table Selection**: Choose target database table for data import
- **Validation Summary**: Real-time validation statistics and status
- **Database Integration**: Ready-to-push validated data to database

### Data Viewer
- **Complete Data Display**: View all data in the system across all tables
- **Tab Navigation**: Switch between different database tables
- **Full Details**: Display complete information without foreign key references
- **Action Buttons**: View, edit, and delete functionality (ready for API integration)
- **Statistics Dashboard**: Real-time counts and summaries
- **Responsive Tables**: Scrollable tables with sticky headers

### Database Tables Supported
- **Staff**: Staff members with contracts and skills
- **ContractsDetails**: Contract details and constraints
- **Skills**: Available skills for staff members
- **DayOffRequests**: Day off requests from employees
- **RequestType**: Types of requests (vacation, sick leave, etc.)
- **ShiftOffRequests**: Shift off requests from employees
- **ShiftRequirements**: Shift requirements for different days and skills

### Offline-First Architecture
- Works without internet connection
- Client-side data validation
- Offline operation queuing
- Automatic sync when connection is restored

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Import Data Workflow

1. **Switch to Import View**: Click "Import Data" in the top navigation
2. **Upload Excel File**: Click the "Upload Excel File" button and select your Excel file
3. **Select Target Table**: Choose which database table the data should be imported into
4. **Review Validation**: Check the color-coded headers and validation summary
5. **Import Data**: If validation passes, click "Push to Database" to import the data

### View Data Workflow

1. **Switch to Data View**: Click "View Data" in the top navigation
2. **Select Table**: Use the tabs to switch between different database tables
3. **Browse Data**: View all records in the selected table
4. **Perform Actions**: Use the action buttons to view, edit, or delete records
5. **Check Statistics**: View summary statistics at the bottom

### Validation Process

1. **Column Matching**: Excel headers are compared against database table columns
2. **Required Fields**: Missing required columns are highlighted
3. **Extra Columns**: Additional columns not in the schema are marked
4. **Data Integrity**: Only valid data can be pushed to the database

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Material-UI**: Professional UI components
- **SheetJS**: Excel file parsing and manipulation
- **Offline-First**: Works without internet connection

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ExcelUploader.jsx    # Excel upload and validation component
│   │   └── DataViewer.jsx       # Data viewing and management component
│   ├── config/
│   │   └── databaseSchema.js    # Database schema definitions
│   ├── services/
│   │   └── api.js              # API service for database operations
│   ├── App.jsx                 # Main application component with view toggle
│   └── main.jsx                # Application entry point
├── generate_sample_data.py     # Python script to generate sample data
├── requirements.txt            # Python dependencies
├── generate_sample_data.bat    # Windows batch file for sample data
└── README.md                   # Detailed documentation
```

## Database Schema

The application validates against a comprehensive scheduling database schema including:

- Staff management with skills and contracts
- Contract details with working constraints
- Request management (day off, shift off)
- Shift requirements and scheduling rules

## API Integration

The application includes a complete API service (`src/services/api.js`) for:
- Data import operations
- Schema validation
- Offline queue management
- Bulk operations
- Data retrieval and management

## Development

### Adding New Tables

1. Update `src/config/databaseSchema.js` with new table definition
2. Add corresponding validation logic
3. Update API service if needed
4. Add dummy data to DataViewer component for testing

### Customizing Validation

Modify the validation functions in `src/config/databaseSchema.js` to add custom validation rules.

### Styling

The application uses Material-UI for styling. Customize the theme in `src/App.jsx`.

## Troubleshooting

### Common Issues

1. **Excel file not loading**: Ensure the file is a valid .xlsx or .xls format
2. **Validation not working**: Check that the Excel headers match the database schema
3. **API errors**: Verify the backend server is running and accessible
4. **Data not displaying**: Check that the DataViewer component has dummy data for the table

### Debug Mode

Open browser developer tools to see detailed console logs and error messages.

## Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Offline Capabilities

This application is designed as an offline-first tool, meaning:

- Works without internet connection
- Data validation happens client-side
- Excel processing is done locally
- Database operations can be queued for when connection is available
- Data viewing works with cached/local data

## Future Enhancements

- Real-time database synchronization
- Advanced data transformation rules
- Bulk import capabilities
- Export functionality for scheduling data
- Advanced validation rules and constraints
- Real-time data updates
- Advanced filtering and search capabilities
- Data visualization and charts
