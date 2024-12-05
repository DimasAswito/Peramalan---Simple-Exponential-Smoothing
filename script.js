let chart;
        let forecastItem1, forecastItem2, eroritem1, eroritem2, mapeItem1, mapeItem2, year, item1, item2;

        function processFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];

            if (!file) {
                alert('Please upload a file first.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                forecast(jsonData);
            };
            reader.readAsArrayBuffer(file);
        }
        
        // Initialize empty chart
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
                            data: Array(13).fill(null),
                            borderColor: 'rgba(255, 165, 0, 1)',
                            borderWidth: 2,
                            fill: false,
                        },
                        {
                            label: 'Batu Hias',
                            data: Array(13).fill(null),
                            borderColor: 'rgba(0, 0, 128, 1)',
                            borderWidth: 2,
                            fill: false,
                        },
                        {
                            label: 'Peramalan Pakan Ikan',
                            data: Array(13).fill(null),
                            borderColor: 'rgba(255, 165, 0, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                        },
                        {
                            label: 'Peramalan Batu Hias',
                            data: Array(13).fill(null),
                            borderColor: 'rgba(0, 0, 128, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Month' } },
                        y: { beginAtZero: true, title: { display: true, text: 'Stock Quantity (kg)' } }
                    }
                }
            });
        }

        createChart();

        function displayTable(data) {
            const tableBody = document.getElementById('dataTable').querySelector('tbody');
            tableBody.innerHTML = ''; // Bersihkan tabel sebelum menambahkan data baru
        
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari 2023'
            ];
        
            // Iterasi data dengan batas maksimal 13 baris
            for (let i = 1; i <= 13 && i < data.length; i++) { 
                const row = document.createElement('tr');
        
                const monthCell = document.createElement('td');
                monthCell.textContent = months[i - 1] || 'Unknown';
        
                const item1Cell = document.createElement('td');
                item1Cell.textContent = data[i][1] ? `${data[i][1]} kg` : '-'; // Tambahkan 'kg' jika data tidak kosong

                const item2Cell = document.createElement('td');
                item2Cell.textContent = data[i][2] ? `${data[i][2]} kg` : '-'; // Tambahkan 'kg' jika data tidak kosong

        
                row.appendChild(monthCell);
                row.appendChild(item1Cell);
                row.appendChild(item2Cell);
        
                tableBody.appendChild(row);
            }
        }

        function simpleExponentialSmoothing(data, alpha) {
            let forecast = [data[0]];
            for (let t = 1; t < data.length; t++) {
                forecast.push(alpha * data[t - 1] + (1 - alpha) * forecast[t - 1]);
            }
            return forecast;
        }

        function calculateeror(actual, forecast) {
            let errors = [];
            for (let i = 1; i < actual.length; i++) {
                errors.push(Math.abs((actual[i] - forecast[i]) / actual[i]) * 100);
            }
            return errors;
        }

        function calculateMonthlyeror(actual, forecast, index) {
            if (index < actual.length) {
                return Math.abs((actual[index] - forecast[index]) / actual[index]) * 100;
            }
            return null;
        }
        function calculateMAPE(actual, forecast) {
            let sumErrors = 0;
            const totalMonths = 13; // Tetapkan jumlah bulan sebagai 13 untuk pembagian
        
            for (let i = 0; i < actual.length; i++) {
                if (actual[i] !== 0 && !isNaN(actual[i]) && !isNaN(forecast[i])) {
                    sumErrors += Math.abs((actual[i] - forecast[i]) / actual[i]);
                }
            }
        
            return (sumErrors / totalMonths) * 100; // MAPE dihitung dengan jumlah bulan tetap 13
        }


        function populateMonthDropdown() {
            const monthSelect = document.getElementById('monthSelect');
            monthSelect.innerHTML = '';

            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari2023'
            ];

            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.text = month;
                monthSelect.appendChild(option);
            });
        }

        function forecast(data) {
            const alpha = parseFloat(document.getElementById('alphaInput').value);
            year = data[0][4]; // Assuming year is in the fourth column
            item1 = data.slice(1).map(row => parseFloat(row[1]));
            item2 = data.slice(1).map(row => parseFloat(row[2]));

            forecastItem1 = simpleExponentialSmoothing(item1, alpha);
            forecastItem2 = simpleExponentialSmoothing(item2, alpha);

            eroritem1 = calculateeror(item1, forecastItem1);
            eroritem2 = calculateeror(item2, forecastItem2);

            mapeItem1 = calculateMAPE(item1, forecastItem1);
            mapeItem2 = calculateMAPE(item2, forecastItem2);

            populateMonthDropdown();
    updateChart(item1, item2, forecastItem1, forecastItem2);
    displayTable(data); // Tambahkan ini untuk menampilkan data ke tabel
    displayResults();
    displayAllResults(); // Panggil fungsi untuk menampilkan semua hasil di tabel


        }

        function updateChart(item1Data, item2Data, forecastItem1Data, forecastItem2Data) {
            chart.data.datasets[0].data = item1Data;
            chart.data.datasets[1].data = item2Data;
            chart.data.datasets[2].data = forecastItem1Data;
            chart.data.datasets[3].data = forecastItem2Data;

            chart.update();

        }


        function displayAllResults() {
            const resultTableBody = document.getElementById('resultTable').querySelector('tbody');
            resultTableBody.innerHTML = ''; // Bersihkan tabel sebelumnya
        
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari2023'
            ];
        
            const alpha = document.getElementById('alphaInput').value;
        
            for (let i = 0; i < forecastItem1.length; i++) {
                const row = document.createElement('tr');
        
                const monthCell = document.createElement('td');
                monthCell.textContent = months[i] || 'Unknown';
        
                const forecastItem1Cell = document.createElement('td');
                forecastItem1Cell.textContent = forecastItem1[i] ? forecastItem1[i].toFixed(2) : '-';
        
                const forecastItem2Cell = document.createElement('td');
                forecastItem2Cell.textContent = forecastItem2[i] ? forecastItem2[i].toFixed(2) : '-';
        
                const errorItem1Cell = document.createElement('td');
                const errorItem1 = calculateMonthlyeror(item1, forecastItem1, i);
                errorItem1Cell.textContent = errorItem1 !== null ? errorItem1.toFixed(2) + '%' : '-';
        
                const errorItem2Cell = document.createElement('td');
                const errorItem2 = calculateMonthlyeror(item2, forecastItem2, i);
                errorItem2Cell.textContent = errorItem2 !== null ? errorItem2.toFixed(2) + '%' : '-';
        
                const alphaCell = document.createElement('td');
                alphaCell.textContent = alpha;
        
                row.appendChild(monthCell);
                row.appendChild(forecastItem1Cell);
                row.appendChild(forecastItem2Cell);
                row.appendChild(errorItem1Cell);
                row.appendChild(errorItem2Cell);
                row.appendChild(alphaCell);
        
                resultTableBody.appendChild(row);
            }
        }

        function displayResults() {
            const output = document.getElementById('output');
            const errorOutput = document.getElementById('errorOutput');
            const mape = document.getElementById('mape');

            const monthSelect = document.getElementById('monthSelect');
            const selectedMonthIndex = parseInt(monthSelect.value);

            if (selectedMonthIndex >= 0 && selectedMonthIndex < forecastItem1.length) {
                const forecastIndex = selectedMonthIndex;

                const monthlyerorItem1 = calculateMonthlyeror(item1, forecastItem1, forecastIndex);
                const monthlyerorItem2 = calculateMonthlyeror(item2, forecastItem2, forecastIndex);

                output.innerHTML = `
                    <p>Peramalan <strong>Pakan Ikan:</strong> ${forecastItem1[forecastIndex].toFixed(2)} kg</p>
                    <p>Peramalan <strong>Batu Hias:</strong> ${forecastItem2[forecastIndex].toFixed(2)} Kg</p>
                `;
                errorOutput.innerHTML = `
                    <p><strong>Pakan Ikan</strong> Eror: ${monthlyerorItem1 !== null ? monthlyerorItem1.toFixed(2) : "N/A"}%</p>
                    <p><strong>Batu Hias</strong> Eror: ${monthlyerorItem2 !== null ? monthlyerorItem2.toFixed(2) : "N/A"}%</p>
                `;

                outputmape.innerHTML = `
                    <p>MAPE <strong>Pakan Ikan:</strong> ${mapeItem1.toFixed(2)}%</p>
                    <p>MAPE <strong>Batu Hias:</strong> ${mapeItem2.toFixed(2)}%</p>
                `;
            } else {
                output.innerHTML = "<p>Silakan pilih bulan untuk melihat hasil peramalan.</p>";
                errorOutput.innerHTML = "";
            }
        }

        function updateResults() {
            displayResults();
        }

        function refreshPage() {
            location.reload();
        }