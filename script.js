let chart; // Declare the chart variable globally
let forecastItem1, forecastItem2, mapeItem1, mapeItem2, year; // Declare these variables globally

// Function to create the initial chart with empty data
function createChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'], // Months
            datasets: [
                {
                    label: 'Pakan Ikan',
                    data: Array(12).fill(null), // Empty data initially
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: 'Batu Hias',
                    data: Array(12).fill(null), // Empty data initially
                    borderColor: 'rgba(153, 102, 255, 1)',
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

    data.slice(1).forEach(row => {
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

// Function to calculate Mean Absolute Percentage Error (MAPE)
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
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Populate dropdown with months
function populateMonthDropdown() {
  const monthSelect = document.getElementById('monthSelect');
  monthSelect.innerHTML = '<option value="">-- Pilih Bulan --</option>'; // Reset options
  months.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = index; // Use index as value (0-11)
      option.textContent = month;
      monthSelect.appendChild(option);
  });
}

// Main function to handle the forecast, display results, and show the year
function forecast(data) {
  const alpha = 0.5;  // Smoothing factor
  year = data[0][4]; // Assuming year is in the fourth column
  const item1 = data.slice(1).map(row => parseFloat(row[1]));  // Pakan Ikan data
  const item2 = data.slice(1).map(row => parseFloat(row[2]));  // Batu Hias data

  forecastItem1 = simpleExponentialSmoothing(item1, alpha);
  forecastItem2 = simpleExponentialSmoothing(item2, alpha);

  mapeItem1 = calculateMAPE(item1, forecastItem1);
  mapeItem2 = calculateMAPE(item2, forecastItem2);

  // Populate month dropdown after processing
  populateMonthDropdown();

  displayResults(); // Call to display results without parameters
  updateChart(item1, item2); // Update the chart with the uploaded data
}

// Function to display the results and show the year
function displayResults() {
  const output = document.getElementById('output');
  const errorOutput = document.getElementById('errorOutput');

  // Set output to display based on the selected month
  const monthSelect = document.getElementById('monthSelect');
  const selectedMonthIndex = parseInt(monthSelect.value);

  if (selectedMonthIndex >= 0 && selectedMonthIndex < forecastItem1.length) {
      const selectedMonth = months[selectedMonthIndex];
      output.innerHTML = `
          <h4>Hasil Peramalan untuk ${selectedMonth} ${year}</h4>
          <p>Peramalan <strong>Pakan Ikan:</strong> bulan ${selectedMonth} ${year}: ${forecastItem1[selectedMonthIndex].toFixed(2)} kg</p>
          <p>Peramalan <strong>Batu Hias:</strong> bulan ${selectedMonth} ${year}: ${forecastItem2[selectedMonthIndex].toFixed(2)} kg</p>
      `;
      errorOutput.innerHTML = `
          <p><strong>Pakan Ikan</strong> MAPE: ${mapeItem1.toFixed(2)}%</p>
          <p><strong>Batu Hias</strong> MAPE: ${mapeItem2.toFixed(2)}%</p>
      `;
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
