// Add event listeners after the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', function() {

  // Event listeners for menu buttons to switch views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Prevent default form submission and call send_email when the compose form is submitted
  document.querySelector('#compose-form').addEventListener('submit', function(event){
    event.preventDefault();
    send_email();
  });

  // Load the inbox view by default
  load_mailbox('inbox');
});

// Function to display the email composition view and hide others
function compose_email() {
  // Hide all views except the compose view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';
  
  // Clear out all fields in the compose form
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// Function to load emails into the specified mailbox view
async function load_mailbox(mailbox) {
  // Show the mailbox view and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';

  // Display the name of the mailbox
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails for the mailbox and display each email
  let emails = await request_mail(mailbox);
  emails.forEach((email) => {
    const email_div = document.createElement('div');
    email_div.innerHTML = `<h3 class="">${email.subject}</h3><h5>By ${email.sender} on ${email.timestamp}</h5>`;
    email_div.className = 'email_div';
    email_div.classList.add('p-3', 'text-primary-emphasis', 'bg-primary-subtle', 'border', 'border-primary-subtle', 'rounded-3', 'mt-3');
    // Change background color if email is read
    if(email.read == true){
      email_div.classList.add('text-danger-emphasis', 'bg-danger-subtle', 'border-danger-subtle');
    }
    document.querySelector('#emails-view').append(email_div);
    // Add click event to view and mark email as read
    email_div.addEventListener('click', function(){
      view_mail(email.id);
      read_mail(email.id);
    });
  });
}

// Function to send an email
async function send_email(){
  // Collect data from the compose form
  const subject = document.querySelector('#compose-subject').value;
  const recipients = document.querySelector('#compose-recipients').value;
  const body = document.querySelector('#compose-body').value;

  // Send the email data to the server
  const response = await fetch('/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({subject: subject, body: body, recipients: recipients}),
  });
  const result = await response.json();
  console.log(result);

  // Load the inbox after sending
  load_mailbox('inbox');
}

async function request_mail(mailbox){
  const response = await fetch(`/emails/${mailbox}`);
  const result = await response.json();
  console.log(result);
  return result;
}

async function view_mail(id){
    // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  const response = await fetch(`/emails/${id}`);
  const email = await response.json();
  document.querySelector('#view-email').innerHTML = `
  <div class="card mb-2">
    <div class="card-header">
        <h5 class="card-title">From: ${email.sender}</h5>
    </div>
    <div class="card-body">
        <h6 class="card-subtitle mb-2 text-muted">To: ${email.recipients.join(", ")}</h6>
        <p class="card-text text-muted">Subject: ${email.subject}</p>
        <p class="card-text">${email.body}</p>
        <p class="card-text"><small class="text-muted">Date: ${email.timestamp}</small></p>
    </div>
</div>`;
  console.log(email.archived);
  if(email.archived){
    document.querySelector('#view-email').insertAdjacentHTML('beforeend', '<button class="btn btn-warning float-end" id="unarchive">Unarchive</button>');
    document.querySelector('#unarchive').addEventListener('click', async function(){
      await unarchive(email.id);
      load_mailbox('archive');
    });
  }
  else{
    document.querySelector('#view-email').insertAdjacentHTML('beforeend', '<button class="btn btn-warning float-end" id="archive">Archive</button>');
    document.querySelector('#archive').addEventListener('click', async function(){
      await archive(email.id);
      load_mailbox('inbox');
    });
  }

  
  
}

async function read_mail(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}

async function archive(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  });
}

async function unarchive(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  });
}