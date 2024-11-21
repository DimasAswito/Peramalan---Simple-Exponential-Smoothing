let chart; // Declare the chart variable globally
let forecastItem1, forecastItem2, mapeItem1, mapeItem2, year, item1, item2; // Declare these variables globally

// Function to create the initial chart with empty data
function createChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', "Januari2023"
            ],
            datasets: [
                {
                    label: 'Pakan Ikan',
                    data: Array(13).fill(null), // Empty data initially
                    borderColor: 'rgba(255, 165, 0, 1)',
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: 'Batu Hias',
                    data: Array(13).fill(null), // Empty data initially
                    borderColor: 'rgba(0, 0, 128, 1)',
                    borderWidth: 2,
                    fill: false,
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Quantity (kg)'
                    }
                }
            }
        }
    });
}

// Call createChart to display the empty chart initially
createChart();

// Function to update the chart with new data
function updateChart(item1Data, item2Data) {
    chart.data.datasets[0].data = item1Data;
    chart.data.datasets[1].data = item2Data;
    chart.update();
}

// Function to populate the table with uploaded data
function populateTable(data) {
    const tableBody = document.querySelector("#uploadedDataTable tbody");
    tableBody.innerHTML = ''; // Clear previous content

    // Ambil maksimal 13 baris data (indeks 1 hingga 13, abaikan header)
    const limitedData = data.slice(1, 14); // Ambil hingga 13 baris

    limitedData.forEach(row => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${row[0]}</td> 
            <td>${row[1]}</td> 
            <td>${row[2]}</td>
        `;
        tableBody.appendChild(newRow);
    });
}


// Function to process the uploaded file and extract the year
function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload a file first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        forecast(jsonData);
        populateTable(jsonData); // Populate the table with uploaded data
    };

    reader.readAsArrayBuffer(file);
}

// Function for Simple Exponential Smoothing Forecast
function simpleExponentialSmoothing(data, alpha) {
    let forecast = [data[0]]; // Start with the first value
    for (let t = 1; t < data.length; t++) {
        forecast.push(alpha * data[t - 1] + (1 - alpha) * forecast[t - 1]);
    }
    return forecast;
}

// Function to calculate MAPE for a specific month
function calculateMonthlyMAPE(actual, forecast, monthIndex) {
    if (actual[monthIndex] && forecast[monthIndex]) {
        
        const error = Math.abs((actual[monthIndex] - forecast[monthIndex]) / actual[monthIndex]);
        return error * 100;
    }
    return null;
}

// Function to calculate MAPE for the entire dataset
function calculateMAPE(actual, forecast) {
    let errorSum = 0;
    for (let i = 0; i < actual.length; i++) {
        errorSum += Math.abs((actual[i] - forecast[i]) / actual[i]);
    }
    return (errorSum / actual.length) * 100;
}

// Dropdown options for months
const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari 2023"
];

// Populate dropdown with months
function populateMonthDropdown() {
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = '<option value="">-- Pilih Bulan --</option>'; // Reset options
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index; // Index langsung sesuai array
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

// Main function to handle the forecast, display results, and show the year
function forecast(data) {
    const alpha = parseFloat(document.getElementById('alphaInput').value);  // Smoothing factor
    year = data[0][4]; // Assuming year is in the fourth column
    item1 = data.slice(1).map(row => parseFloat(row[1]));  // Kedelai data
    item2 = data.slice(1).map(row => parseFloat(row[2]));  // Ragi data

    forecastItem1 = simpleExponentialSmoothing(item1, alpha);
    forecastItem2 = simpleExponentialSmoothing(item2, alpha);

    mapeItem1 = calculateMAPE(item1, forecastItem1);
    mapeItem2 = calculateMAPE(item2, forecastItem2);

    // Populate month dropdown after processing
    populateMonthDropdown();

    updateChart(item1, item2); // Update the chart with the uploaded data
    displayResults(); // Call to display results
}

// Function to display the results and show the year
function displayResults() {
    const output = document.getElementById('output');
    const errorOutput = document.getElementById('errorOutput');

    // Get the selected month index
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonthIndex = parseInt(monthSelect.value);

    if (selectedMonthIndex >= 0 && selectedMonthIndex < forecastItem1.length) {
        const forecastIndex = selectedMonthIndex +1; // Adjust index for forecast

        if (forecastIndex >= 0) {
            const monthlyMAPEItem1 = calculateMonthlyMAPE(item1, forecastItem1, forecastIndex -1);
            const monthlyMAPEItem2 = calculateMonthlyMAPE(item2, forecastItem2, forecastIndex-1);

            output.innerHTML = `
                <p>Peramalan <strong>Kedelai:</strong> ${forecastItem1[forecastIndex].toFixed(2)} kg</p>
                <p>Peramalan <strong>Ragi:</strong> ${forecastItem2[forecastIndex].toFixed(2)} gram</p>
            `;
            errorOutput.innerHTML = `
                <p><strong>MAPE</strong> Pakan Ikan: ${monthlyMAPEItem1 !== null ? monthlyMAPEItem1.toFixed(2) : "N/A"}%</p>
                <p><strong>MAPE</strong> Batu Hias: ${monthlyMAPEItem2 !== null ? monthlyMAPEItem2.toFixed(2) : "N/A"}%</p>
            `;
        } else {
            output.innerHTML = "<p>Peramalan tidak tersedia untuk bulan ini.</p>";
            errorOutput.innerHTML = ""; // Clear error output
        }
    } else {
        output.innerHTML = "<p>Silakan pilih bulan untuk melihat hasil peramalan.</p>";
        errorOutput.innerHTML = ""; // Clear error output
    }
}

// Function to handle the change in the dropdown
function updateResults() {
    displayResults();
}

// Call to populate dropdown when the page loads
populateMonthDropdown();

// Function to refresh the page
function refreshPage() {
    location.reload();  // This will reload the entire page
}