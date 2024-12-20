//#region Imports - Using ES6 modules
    import {showDynamicAlert, showModal, closeModal, 
        fillStars, getQlContent, showConfirmModal} from '/js/Util.js';
    import { createQuillEditor } from  '/js/quillSetUp.js';        
//#endregion
let addQuill;
//#region Initialize Common Rating System
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
//#endregion

//#region Initialize common DOM functionality
    export function initializeCommonDOM(){
        const qlContainer=document.getElementById('editor');
        if(!addQuill){addQuill = createQuillEditor(qlContainer);}
        
            document.querySelectorAll(".btn-dark").forEach(btn => {
                btn.addEventListener('mouseover', ()=>{
                    btn.classList.remove('btn-dark');
                    btn.classList.add('btn-success');
                });

                btn.addEventListener('mouseout', ()=>{
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-dark');
                })
            });
        //#region View notes functionality
            document.querySelectorAll(".view-button").forEach(btn =>{
                btn.addEventListener('click', async ()=>{
                    const id = parseInt(btn.getAttribute('data-id'));
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
                    }else{
                        console.log('no id')
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
        //#endregion   
        //#region  delete functionality
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
        //#endregion
        //#region Search functionality
            document.querySelectorAll('.drop-downSearch').forEach(item =>{
                item.addEventListener('click', (event)=>{
                    event.preventDefault();
                    // console.log('click event fired');
                    const selectedText=item.textContent;
                    const searchBy=item.getAttribute('data-searchby');

                    document.getElementById('searchByLabel').textContent=`${searchBy}: ${selectedText}`;

                    document.getElementById('searchByHidden').value=searchBy;

                    document.getElementById('searchInput').ariaPlaceholder=`Search By: ${selectedText}`;
                    document.getElementById('searchInput').placeholder=`Search By: ${selectedText}`;
                });
            });

            // validate search input and display the modal that is going to show the books
            searchForm.addEventListener('submit',(event)=>{
                const searchValue=searchInput.value.trim();
                if(searchValue===''){
                    event.preventDefault();
                    // show dynamic message instead of the usual alert
                    showDynamicAlert('Please input a search value',searchForm);
                    return;
                }
                
            });
        //#endregion
    }
//#endregion

//#region: Populate add form
function populateAddForm(book, addNewForm, isAddRemote=false){
    addNewForm.title.value = book.title;
    addNewForm.author.value = book.author;
    addNewForm.isbn.value = book.isbn13;
    addNewForm.lang.value = book.lang;
    addNewForm.imgUrl.value = book.cover_url;
    addNewForm.avatar.value = book.avatar;
    
    const bookAvatar=document.getElementById('book-cover-preview');
    bookAvatar.style.backgroundImage='none';
    bookAvatar.style.filter='none';
    bookAvatar.src = book.avatar || '/covers/default-cover.png';
    
    addNewForm.method="POST";

    if(isAddRemote){
        console.log('cover id', book.cover_id);
        addNewForm.cover_id.value = book.cover_id ? book.cover_id:null;
        addNewForm.action="/add";
    }else{
        const ratingDiv=document.getElementById('rating-add');
        const starsInnerId=document.getElementById('rating-add-inner');

        addNewForm.action = `/edit/${book.id}`;
        document.getElementById('submit-Add').innerText = "Update";

        addNewForm.rating.value=book.rating;
        document.getElementById('rating-disp').innerText=parseFloat(book.rating).toFixed(1);            
        ratingDiv.setAttribute('data-rating',book.rating);
        fillStars(book.rating,starsInnerId);            
        //format the date properly for viewing  
        addNewForm.date_read.value=formatDate(book.date_read);
    }
}
//#endregion

//#region initialize remote books
    export function initializeRemoteBooks(remBooks){
        document.querySelectorAll('.add-button').forEach(btn =>{
            btn.addEventListener('click', async (e)=>{
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                //for remote books the id is the index of the element in the results returned as an array
                //from the API. So the id starts from 0
                const book = remBooks[id];

                if(book){
                    initializeAddNew(book);
                }else{
                    showDynamicAlert(`an error getting book by id ${id}`,btn);
                    console.log(`an error getting book by id ${id}`);
                }   
            });
        });
    }
//#endregion

//#region initialize edits
    export function initializeEdits(books){
        //initialize the book editing function regardless of the view
        //assume there is a common edit modal on both views

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookId = e.target.dataset.id;
                const book = getBookById(bookId, books, button); // Replace with actual data fetching logic
                openEditModal(book, addQuill);
            });
        });
        showHideISBNButton();
        initializeAvatar();
    }
    function openEditModal(book, qlEditor) {
        // Set the modal title
        document.getElementById('add-new-title').innerHTML = `<div class="ModalTitleBar">Edit Book <span class="close" id="closeAddModal">&times;</span></div>`;
        const closeAddBtn=document.getElementById('closeAddModal');
        const addNewForm=document.getElementById('add-new');
        const addEditModal=document.getElementById('add-newBk');
        const hiddenNotes = document.getElementById('add-notes')
   
        // If there are book notes
        isValidJSONString(book.notes)? qlEditor.root.innerHTML=JSON.parse(book.notes) : qlEditor.root.innerHTML=book.notes;
        hiddenNotes.value =qlEditor.root.innerHTML;

        populateAddForm(book, addNewForm, false);

        addNewForm.onsubmit=(e)=>{
            if (!validateQuillContent(addQuill)){
                e.preventDefault();
            }else{
                getQlContent(hiddenNotes,qlEditor);
                console.log(hiddenNotes.value);
            }
        }
  
        // Show the modal
        showModal(addEditModal);
        closeAddBtn.onclick=()=>{
            closeModal(addEditModal);
        }
    }
//#endregion

//#region add new book functionality
    export function initializeAddNew(remBook=null){
          
        const addEditModal=document.getElementById('add-newBk');
        const addNewForm=document.getElementById('add-new');
        const submitBtn=document.getElementById('submit-Add');
        const noteText=document.getElementById('add-notes');
        let currentRating=0;
        document.getElementById('submit-Add').innerText = "Submit";
        
        if (remBook){
            populateAddForm(remBook, addNewForm, true);
            //set the modal title
            document.getElementById('add-new-title').innerHTML = `<div class="ModalTitleBar">Add this book! <span class="close" id="closeAddModal">&times;</span></div>`;
        }else{
            //set the modal title
            document.getElementById('add-new-title').innerHTML = `<div class="ModalTitleBar">Add a book! <span class="close" id="closeAddModal">&times;</span></div>`;
            initializeAvatar();
            //reset image
            const bookAvatar=document.getElementById('book-cover-preview');
            bookAvatar.style.backgroundImage = `url('/covers/DefaultCover.png')`;
            bookAvatar.style.backgroundPosition='center';
            bookAvatar.style.backgroundRepeat='no-repeat';
            bookAvatar.style.backgroundSize='cover';
            bookAvatar.src='';
            const ratingDiv=document.getElementById('rating-add');
            ratingDiv.setAttribute('data-rating',0);
            addNewForm.reset();            
        }

        showHideISBNButton();

        addQuill.setContents([]);

        showModal(addEditModal);

        submitBtn.addEventListener('click',(e)=>{
            if(addQuill.root.innerHTML===''){
                e.preventDefault();
            }else{
                getQlContent(noteText, addQuill);
            }
        });

        const closeAddBtn=document.getElementById('closeAddModal');
        
        closeAddBtn.addEventListener('click', (e)=>{
            closeModal(addEditModal);
        });

        closeAddBtn.onclick=()=>{
            closeModal(addEditModal);
        }
        addNewForm.onsubmit=(e)=>{
            if(!validateQuillContent(addQuill)){
                e.preventDefault();
            }else{
                console.log(addQuill.root.innerHTML);
                getQlContent(noteText, addQuill);
            }
        }
    }
//#endregion

//#region  Helper functions
    function formatDate(dateStr){
        const date = new Date(dateStr)
        const day = String(date.getDate()).padStart(2, '0');   // Get day and pad to 2 digits
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month and pad to 2 digits (Months are 0-indexed)
        const year = date.getFullYear();  // Get year
        return `${year}-${month}-${day}`;
    }
    async function fetchRoute(str){
        return await fetch(str);
    }
    function isValidJSONString(string){
        try{
        JSON.parse(string);
        }catch(e){
        return false;
        }
        return true;
    }
    function showHideISBNButton(){
        //to implement later
        // const isbnIput=document.getElementById('isbn');
        // const searchBtn=document.getElementById('search-online');
        // isbnIput.addEventListener('input',()=>{
        //     if(isbnIput.value.trim()!==""){
        //         searchBtn.style.display='block';
        //     }else{
        //         searchBtn.style.display='none';
        //     }
        // });
    }
    function initializeAvatar(){
        const imgFileInput=document.getElementById('coverImage');
        const coverImgPreview=document.getElementById('book-cover-preview');
        imgFileInput.addEventListener('input',()=>{
            if(imgFileInput.files && imgFileInput.files.length > 0){
                coverImgPreview.style.backgroundImage = 'none';
            }else{
                coverImgPreview.style.backgroundImage=`url('/covers/DefaultCover.png')`;
                coverImgPreview.src="";
            }
            previewImage();
        });    
        function previewImage() {
            const reader = new FileReader();
            reader.onload = function() {
                coverImgPreview.src = reader.result;
            };
            reader.readAsDataURL(event.target.files[0]);
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
    function validateQuillContent(qlEditor){

        console.log("validating ql");
        const content = qlEditor.getText().trim();
        
        if(content.length === 0){
            showDynamicAlert("Please add notes", qlEditor);
            return false;
        }

        return true;
    }
//#endregion