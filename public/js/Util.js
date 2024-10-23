const dynamicAlertElement ='dynamic-alert';
export function showDynamicAlert(message, targetElement) {
    // Remove any existing alert
    let existingAlert = document.getElementById(dynamicAlertElement);
    if (existingAlert) {
      existingAlert.remove();
    }
  
    // Create the alert div
    let alertDiv = document.createElement('div');
    let okBtn=document.createElement('button');
    let msgP=document.createElement("p")

    msgP.textContent=message
    alertDiv.id = dynamicAlertElement;

    alertDiv.appendChild(msgP)
    alertDiv.appendChild(okBtn)

    alertDiv.style.position = 'absolute';
    alertDiv.style.padding = '5px';
    alertDiv.style.minWidth="10dvw";
    alertDiv.style.backgroundColor = '#f44336'; // Red background
    alertDiv.style.color = 'white';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.zIndex = 1103; // Ensure it's above other content
    alertDiv.style.boxShadow = '5px 5px 10px rgba(70, 50, 12, 0.7)';
    alertDiv.style.cursor = 'pointer';
    alertDiv.style.fontFamily=`'Segoe UI',Serif`;
    alertDiv.style.display="flex";
    alertDiv.style.flexDirection="column"
    alertDiv.style.justifyContent='space-between';
    alertDiv.style.flexGrow=1;

    msgP.style.marginBottom='3px';
    msgP.style.margin='5px';

    okBtn.textContent="Ok"
    okBtn.style.color='white';
    okBtn.style.backgroundColor="black"
    okBtn.style.alignSelf = 'flex-end';
    // okBtn.style.padding="2px 2px";
    okBtn.style.width="5dvw";
    okBtn.style.borderRadius = '7px';
    okBtn.style.border='none';
  
    const compHeight=msgP.scrollHeight + okBtn.scrollHeight + 80;
    alertDiv.style.minHeight=`${compHeight}px`;

    // Position the alert near the target element
    if (targetElement){
        const rect = targetElement.getBoundingClientRect();
        alertDiv.style.left = `${rect.left + window.scrollX}px`;
        alertDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }else{
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const elementWidth = alertDiv.offsetWidth;
        const elementHeight = alertDiv.offsetHeight;
    
        // Calculate position for centering
        const left = (screenWidth - elementWidth) / 2;
        const top = (screenHeight - elementHeight) / 2;
        
        alertDiv.style.left = `${left}px`;
        alertDiv.style.top = `${top}px`;
        alertDiv.style.transform = 'translate(-50%, -50%)';
    }  
    // Append the alert to the body
    document.body.appendChild(alertDiv);
  
    // Add click event to remove the alert
    alertDiv.addEventListener('click', function() {
      alertDiv.remove();
    });
    okBtn.addEventListener('click',()=>{
        alertDiv.remove();
    });
  }
  export function showModal(target){
      target.style.display='block';
  }
  export function closeModal(target){
      target.style.display='none';
  }
  // Function to fill stars based on the rating
  export function fillStars(rating, target, valueElement=null) {
      const starPercentage = (rating / 5) * 100;
      target.style.width = `${starPercentage}%`;
      if (valueElement){
          valueElement.value=rating.toFixed(1);
          valueElement.dispatchEvent(new Event('change'));
      }
  }
  export function getQlContent(target, qlEditor){
    target.value=qlEditor.root.innerHTML;
  }
 export function formatDate(dateString) {
    const date = new Date(dateString);
    // Get weekday abbreviation (e.g., 'Tue')
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    // Get month abbreviation (e.g., 'Oct')
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    // Get the day (e.g., '15')
    const day = date.getDate();
    // Get the year (e.g., '2024')
    const year = date.getFullYear();
    // Format the date as 'Tue, Oct-15 2024'
    return `${weekday}, ${month}-${day} ${year}`;
}

export function showConfirmModal(message, onConfirm, onCancel, doc = document) {
    // Create the modal elements
    const modal = document.createElement('div');
    const modalContent = document.createElement('div');
    const messageText = document.createElement('p');
    const buttonsContainer = document.createElement('div');
    const confirmButton = document.createElement('button');
    const cancelButton = document.createElement('button');
    const hrLine=document.createElement('hr');

    // Set modal and content styles
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';

    // Update modal content background to red and text color to white
    modalContent.style.backgroundColor = 'red';  // Set background color to red
    modalContent.style.color = 'white';          // Set text color to white
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.minwidth = '30dvw';
    modalContent.style.textAlign = 'center';
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    modalContent.style.justifyContent = 'space-between'; // Ensure buttons stay at the bottom
    modalContent.style.minHeight = '10dvh';  // Define the height to anchor buttons at the bottom
    modalContent.style.Height='fit-content';
    // Set message text
    messageText.innerText = message;

    // Set button styles and text
    confirmButton.innerText = 'Yes';
    confirmButton.className = 'btn btn-sm btn-dark';
    cancelButton.innerText = 'Cancel';
    cancelButton.className = 'btn btn-sm btn-dark';

    // Style the button container to anchor buttons at the bottom and center them
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';  // Distribute the buttons evenly
    buttonsContainer.style.gap = '10px';  // Space between buttons
    buttonsContainer.style.marginTop = 'auto';  // Push buttons to the bottom
    buttonsContainer.style.width = '100%';  // Make the buttons span full width

    // Set button widths to evenly distribute
    confirmButton.style.flex = '1';
    cancelButton.style.flex = '1';

    // Append buttons to the container
    buttonsContainer.appendChild(confirmButton);
    buttonsContainer.appendChild(cancelButton);

    // Append all elements to the modal content
    modalContent.appendChild(messageText);
    modalContent.appendChild(hrLine);
    modalContent.appendChild(buttonsContainer);

    // Append modal content to modal
    modal.appendChild(modalContent);

    // Append modal to the body
    document.body.appendChild(modal);

    // Confirm button click
    confirmButton.addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(modal);
    });

    // Cancel button click
    cancelButton.addEventListener('click', () => {
        if (onCancel) onCancel();
        document.body.removeChild(modal);
    });}
