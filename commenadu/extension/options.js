// Get the modal
var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

/*
document.getElementById('button-change-css').onclick = function(event) {
	document.getElementById('id01').style.display='block';
}
*/

document.getElementById('signup').onclick = function(event) {
	var username = document.getElementById('register-form').getElementById('text').innerHTML;
	console.log("Register | username = " + username);
}

document.getElementById('login').onclick = async function(event) {
	console.log("CLICKED");
	var username = document.getElementById('login-form').childNodes[0].innerHTML;
	console.log("Login | username = " + username);
	await sleep(2000);
}

console.log("Other | username = ");
