# Agentic Schedule - Setup Guide

## Overview

Agentic Schedule is an offline-first scheduling tool that allows you to upload Excel files, validate them against database schemas, and import data into the scheduling system.

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 3. Generate Sample Data (Optional)

To test the application with sample data:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Generate sample Excel file
python generate_sample_data.py
# OR on Windows:
generate_sample_data.bat
```

This will create `sample_agentic_schedule_data.xlsx` with sample data for all database tables.

## Features

### Excel Upload & Validation
- Upload Excel files (.xlsx, .xls)
- Automatic sheet detection and parsing
- Real-time validation against database schema
- Color-coded column headers:
  - 🟢 Green: Valid columns (match database schema)
  - 🟠 Orange: Extra columns (not in database schema)
  - 🔴 Red: Missing required columns

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

## Usage Workflow

1. **Upload Excel File**: Click "Upload Excel File" and select your Excel file
2. **Select Target Table**: Choose which database table the data should be imported into
3. **Review Validation**: Check the color-coded headers and validation summary
4. **Import Data**: If validation passes, click "Push to Database" to import the data

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ExcelUploader.jsx    # Main Excel upload and validation component
│   ├── config/
│   │   └── databaseSchema.js    # Database schema definitions
│   ├── services/
│   │   └── api.js              # API service for database operations
│   ├── App.jsx                 # Main application component
│   └── main.jsx                # Application entry point
├── generate_sample_data.py     # Python script to generate sample data
├── requirements.txt            # Python dependencies
├── generate_sample_data.bat    # Windows batch file for sample data
└── README.md                   # Detailed documentation
```

## Database Schema

The application validates against a comprehensive scheduling database schema. See `src/config/databaseSchema.js` for complete schema definitions.

## API Integration

The application includes a complete API service (`src/services/api.js`) for:
- Data import operations
- Schema validation
- Offline queue management
- Bulk operations

## Development

### Adding New Tables

1. Update `src/config/databaseSchema.js` with new table definition
2. Add corresponding validation logic
3. Update API service if needed

### Customizing Validation

Modify the validation functions in `src/config/databaseSchema.js` to add custom validation rules.

### Styling

The application uses Material-UI for styling. Customize the theme in `src/App.jsx`.

## Troubleshooting

### Common Issues

1. **Excel file not loading**: Ensure the file is a valid .xlsx or .xls format
2. **Validation not working**: Check that the Excel headers match the database schema
3. **API errors**: Verify the backend server is running and accessible

### Debug Mode

Open browser developer tools to see detailed console logs and error messages.

## Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include validation for new features
4. Test with sample data
5. Update documentation

## License

This project is part of the Agentic Schedule offline-first scheduling tool.
