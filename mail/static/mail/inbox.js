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
    // Change background color if email is read
    if(email.read == true){
      email_div.style.backgroundColor = 'grey';
      email_div.style.color = 'white';
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
  document.querySelector('#view-email').innerHTML = `<h2>From: ${email.sender}</h2><hr><h2>To: ${email.recipients}</h2><hr><h3>Subject: ${email.subject}</h3><hr><h3>Message:</h3 <p>${email.body}<br><br>Date: ${email.timestamp}`;
  if(email.archive){
    document.querySelector('#view-email').insertAdjacentHTML = ('beforeend', '<button class="btn btn-warning" id="unarchive">Unarchive</button>');
  }
  else{
    document.querySelector('#view-email').insertAdjacentHTML = ('beforeend', '<button class="btn btn-warning" id="archive">Archive</button>');
  }

  document.querySelector('#archive').addEventListener('click', () => archive(email.id));
  document.querySelector('#unarchive').addEventListener('click', () => unarchive(email.id));
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
      archive: true
    })
  });
}

async function unarchive(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archive: false
    })
  });
}