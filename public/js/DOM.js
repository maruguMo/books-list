import {showDynamicAlert, showModal, closeModal, 
    fillStars, getQlContent} from '/js/Util.js';
// import 'dotenv/config';
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
            ratingDisp.innerText = ` ${e.target.value}`;
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
export function initializeCommonDOM(){
    document.querySelectorAll("#view-button").forEach(btn =>{
        btn.addEventListener('click', async ()=>{
            const id = btn.getAttribute('data-id');
            if (id){
               const route=`/view-notes/${id}`;
               console.log(route)
               const resp = await fetchRoute(route);
               console.log(resp);
               
               if(resp.ok){
                    window.location.href = route;
               }else{
                console.error("Error fetching notes:", resp.status);
               }
            }
        });    
    });
    document.querySelectorAll("#book-image").forEach(crd =>{
        crd.addEventListener('click', async ()=>{
            const id = crd.getAttribute('data-id');
            if (id){
               const route=`/view-notes/${id}`;
               
               const resp = await fetchRoute(route);
               console.log(resp);
               if(resp.ok){
                    window.location.href = route;
               }else{
                console.error("Error fetching notes:", resp.status);
               }
            }
        });    
    });    
}
async function fetchRoute(str){
    return await fetch(str);
}