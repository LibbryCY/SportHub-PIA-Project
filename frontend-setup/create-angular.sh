#!/bin/bash
# Run this script in your project root folder
# Requirements: Node.js, npm, Angular CLI installed

echo "Creating Angular frontend..."

# Create Angular project
ng new frontend --routing=true --style=css --standalone=false --skip-git --skip-tests

cd frontend

echo "Installing dependencies..."
npm install leaflet @types/leaflet chart.js ng2-charts jspdf html2canvas

echo "Done! Angular project created."
echo ""
echo "Now copy the src/ files provided below."
