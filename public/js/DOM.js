import {showDynamicAlert, showModal, closeModal, 
    fillStars, getQlContent, showConfirmModal} from '/js/Util.js';
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
    document.querySelectorAll(".view-button").forEach(btn =>{
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
    //functionality when user clicks on an image the book notes are opened
    document.querySelectorAll(".book-image").forEach(crd =>{
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

    //functionality to delete a book
    document.querySelectorAll(".del-button").forEach(btn =>{
        btn.addEventListener('click', async(e)=>{
            const id = btn.getAttribute('data-id');
            showConfirmModal("Are you sure you want to delete?",
                async()=>{
                    const route =`/delete/${id}`;
                    console.log(id);
                    const response = await fetch(route, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      });                    
                      
                      if (response.ok){
                        showDynamicAlert("Deleted");
                        window.location.reload();
                        window.location.href="/"
                        //alternately delete from FE
                    }else{
                        console.log(response)
                        showDynamicAlert("An error occured when deleting!");   
                        console.error("Error deleting the book", response.status);
                    }
                },
                ()=>{
                    console.log("Delete cancelled");
                    // showDynamicAlert("Cancelled");
                }
            );
        });
    });


}
export function initializeEdits(books, qlEditor){
    //initialize the book editing function regardless of the view
    //assume there is a common edit modal on both views
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const bookId = e.target.dataset.id;
            const book = getBookById(bookId, books, button); // Replace with actual data fetching logic
            openEditModal(book, qlEditor);
        });
    });

}
function openEditModal(book, qlEditor) {
    // Set the modal title
    document.querySelector('.ModalTitleBar').innerHTML = `<div class="ModalTitleBar">Edit Book <span class="close" id="closeAddModal">&times;</span></div>`;
    const closeAddBtn=document.getElementById('closeAddModal');
    const addNewForm=document.getElementById('add-new');
    const addEditModal=document.getElementById('add-newBk');
    // Populate the form fields with book data
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('isbn').value = book.isbn;
    document.getElementById('lang').value = book.lang;
    document.getElementById('date_read').value = book.date_read;
    document.getElementById('rating').value = book.rating;

    // If there are book notes
    isValidJSONString(book.notes)? qlEditor.root.innerHTML=JSON.parse(book.notes) : qlEditor.root.innerHTML=book.notes;
    
    // Set the book cover
    document.getElementById('book-cover-preview').src = book.avatar || '/covers/default-cover.png';

    // Update form action to 'edit'
    addNewForm.action = `/edit/${book.id}`;

    // Change the button text to "Update"
    document.getElementById('submit-Add').innerText = "Update";

    // Show the modal
    showModal(addEditModal);
    closeAddBtn.onclick=()=>{
        closeModal(addEditModal);
    }
}
function getBookById(id, books, target){
    const bk=books.find(bk => parseInt(bk.id)===parseInt(id));
    if(bk){
        return bk;
    }else{
        showDynamicAlert(`an error getting book by id ${id}`,target);
        console.log(`an error getting book by id ${id}`);
    }
    
}
async function fetchRoute(str){
    return await fetch(str);
}function isValidJSONString(string){
    try{
      JSON.parse(string);
    }catch(e){
      return false;
    }
    return true;
  }