import {showDynamicAlert, showModal, closeModal, 
    fillStars, getQlContent} from '/js/Util.js';
export function initializeRatingSystem() {
        // Handle the rating input if it exists
        const valueElement = document.getElementById('rating');
        const ratingDisp = document.getElementById('rating-disp');
        const starsOuter = document.getElementById('rating-add-outer');
        const starsInner = document.getElementById('rating-add-inner');
        let currentRating = 0;
    // Initialize the rating stars on the page
    document.querySelectorAll('.star-rating').forEach(pRate => {
        const myRating = pRate.getAttribute('data-rating');
        const starsInnerId = `book-${pRate.getAttribute('data-id')}`;
        const target = document.getElementById(starsInnerId);
        let setRating = parseFloat(pRate.getAttribute('data-rating')) || 0;
        fillStars(setRating, target);
    });

    if (valueElement) {
        valueElement.addEventListener('change', (e) => {
            ratingDisp.innerText = ` My rating: ${e.target.value}`;
        });

        starsOuter.addEventListener('mousemove', (e) => {
            const offsetX = e.offsetX;
            const starsWidth = starsOuter.offsetWidth;
            const percentage = (offsetX / starsWidth) * 5;
            fillStars(percentage, starsInner, valueElement); 
        });

        starsOuter.addEventListener('click', (e) => {
            const offsetX = e.offsetX;
            const starsWidth = starsOuter.offsetWidth;
            currentRating = (offsetX / starsWidth) * 5;
            valueElement.value = currentRating.toFixed(1);
            fillStars(currentRating, starsInner, valueElement);
        });

        starsOuter.addEventListener('mouseleave', () => {
            fillStars(currentRating, starsInner, valueElement); 
        });
    }
}

// Helper function to fill the stars
// function fillStars(rating, target, valueElement = null) {
//     const percentage = (rating / 5) * 100;
//     target.style.width = `${percentage}%`;

//     if (valueElement) {
//         valueElement.value = rating.toFixed(1); // Update the rating value
//     }
// }