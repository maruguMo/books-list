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
    const rect = targetElement.getBoundingClientRect();
    alertDiv.style.left = `${rect.left + window.scrollX}px`;
    alertDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;
  
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
