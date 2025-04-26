document.addEventListener('DOMContentLoaded', function() {
    const soilForm = document.getElementById('soilForm');
    const soilSelect = document.getElementById('soilSelect');
    const soilDescription = document.getElementById('soilDescription');
    const soilDescriptionText = document.getElementById('soilDescriptionText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const initialMessage = document.getElementById('initialMessage');
    const errorMessage = document.getElementById('errorMessage');
    const resultsContainer = document.getElementById('resultsContainer');
    const selectedSoilType = document.getElementById('selectedSoilType');
    const cropResults = document.getElementById('cropResults');

    // Store soil descriptions from the server
    const soilDescriptions = {};
    document.querySelectorAll('#soilAccordion .accordion-item').forEach(item => {
        const soilName = item.querySelector('.accordion-button').textContent.trim().replace(' Soil', '');
        const soilDesc = item.querySelector('.accordion-body p').textContent.trim();
        soilDescriptions[soilName] = soilDesc;
    });

    // Show soil description when a soil is selected
    soilSelect.addEventListener('change', function() {
        const selectedSoil = this.value;
        if (selectedSoil && soilDescriptions[selectedSoil]) {
            soilDescriptionText.textContent = soilDescriptions[selectedSoil];
            soilDescription.classList.remove('d-none');
        } else {
            soilDescription.classList.add('d-none');
        }
    });

    // Handle form submission
    soilForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedSoil = soilSelect.value;
        if (!selectedSoil) {
            showError('Please select a soil type.');
            return;
        }
        
        // Show loading spinner
        initialMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');
        resultsContainer.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');
        
        // Make API request
        fetchCropRecommendations(selectedSoil);
    });

    // Fetch crop recommendations from the API
    function fetchCropRecommendations(soil) {
        fetch('/api/soil-to-crops', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ soil: soil })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            displayResults(data);
        })
        .catch(error => {
            showError(`Error: ${error.message}`);
        })
        .finally(() => {
            loadingSpinner.classList.add('d-none');
        });
    }

    // Display the crop recommendations
    function displayResults(data) {
        selectedSoilType.textContent = data.soil;
        
        // Clear previous results
        cropResults.innerHTML = '';
        
        // Add soil fertilizer recommendations
        if (data.soil_fertilizer) {
            const fertilizerInfo = document.createElement('div');
            fertilizerInfo.className = 'col-12 mb-3';
            fertilizerInfo.innerHTML = `
                <div class="alert alert-info border-0">
                    <h5><i class="fas fa-seedling me-2"></i>Organic Fertilizers for ${data.soil} Soil</h5>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <div class="mb-2"><strong>Ready-made Organic:</strong> ${data.soil_fertilizer.organic}</div>
                        </div>
                        <div class="col-md-6">
                            <div><strong>Homemade Options:</strong> ${data.soil_fertilizer.homemade}</div>
                        </div>
                    </div>
                </div>
            `;
            cropResults.appendChild(fertilizerInfo);
        }
        
        // Create cards for each crop
        if (data.recommended_crops && data.recommended_crops.length > 0) {
            data.recommended_crops.forEach(crop => {
                const cropCard = document.createElement('div');
                cropCard.className = 'col-md-6 col-lg-4';
                
                // Create color class based on score - UPDATED COLORS
                let scoreColorClass = 'bg-teal';
                if (crop.score < 70) {
                    scoreColorClass = 'bg-purple';
                } else if (crop.score < 60) {
                    scoreColorClass = 'bg-orange';
                }
                
                // Create fertilizer info if available
                let fertilizerHTML = '';
                if (crop.fertilizer) {
                    fertilizerHTML = `
                        <div class="mt-3">
                            <h6 class="text-info mb-2"><i class="fas fa-seedling me-1"></i>Organic Fertilizers:</h6>
                            <div class="small">
                                <div><strong>Ready-made:</strong> ${crop.fertilizer.organic}</div>
                                <div><strong>Homemade:</strong> ${crop.fertilizer.homemade}</div>
                            </div>
                        </div>
                    `;
                }
                
                cropCard.innerHTML = `
                    <div class="card h-100 border-0 crop-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-plant-wilt text-teal me-2"></i>
                                <h5 class="card-title mb-0">${crop.name}</h5>
                            </div>
                            <div class="crop-score-container mt-2">
                                <div class="progress">
                                    <div class="progress-bar ${scoreColorClass}" role="progressbar" 
                                         style="width: ${crop.score}%;" aria-valuenow="${crop.score}" 
                                         aria-valuemin="0" aria-valuemax="100">${crop.score}%</div>
                                </div>
                                <small class="text-muted">Suitability Score</small>
                            </div>
                            ${fertilizerHTML}
                        </div>
                    </div>
                `;
                cropResults.appendChild(cropCard);
            });
        } else {
            cropResults.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        No suitable crops found for this soil type.
                    </div>
                </div>
            `;
        }
        
        // Show results
        resultsContainer.classList.remove('d-none');
    }

    // Show error message
    function showError(message) {
        loadingSpinner.classList.add('d-none');
        initialMessage.classList.add('d-none');
        resultsContainer.classList.add('d-none');
        
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    // Add crop icons for better visuals
    function getIconForCrop(cropName) {
        const cropIcons = {
            'Rice': 'seedling',
            'Wheat': 'wheat-alt',
            'Maize': 'corn',
            'Sugarcane': 'sugar-cane',
            'Cotton': 'cotton-bureau',
            // Default icon for other crops
            'default': 'plant-wilt'
        };
        
        return cropIcons[cropName] || cropIcons['default'];
    }
});