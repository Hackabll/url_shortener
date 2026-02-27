const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API = isLocal
  ? "http://localhost:3000"
  : window.location.origin;


let allUrls = [];
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function saveToken(token){
    localStorage.setItem("token",token);
}

function getToken(){
    return localStorage.getItem("token");
}

async function signup(){
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const email = document.getElementById("email").value.trim();
    if(!strongPassword.test(password)){
        alert("Password must be at least 8 characters with uppercase, lowercase, number and special character");
        return;
    }
    const res = await fetch(API  + "/api/auth/signup",{
        method:"POST",
        headers : {"Content-Type":"application/json"},
        body:JSON.stringify({username,email,password})
    });

    const data  = await res.json();

      if(!res.ok) {
        alert(data.error);
        return;              
    }
    alert(data.message);
    window.location.href="login.html";
}

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const res = await fetch(API + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data);

    if (data.token) {
        saveToken(data.token);
        window.location.href = "dashboard.html";
    } else if (data.error) {
        alert(data.error);
    } else if (data.message) {
        alert(data.message);
    } else {
        alert("Login Failed");
    }
}

async function createUrl(){
    const longUrl = document.getElementById("longUrl").value;
    const customCode = document.getElementById("customCode").value.trim();
    const expiryDays = document.getElementById("expiryDate").value;

    const captchaToken = grecaptcha.getResponse();
        if(!captchaToken){
            alert("Please Complete CAPTCHA first");
            return;
        }

    const res = await fetch(API + "/api/urls",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer " + getToken()},
        body:JSON.stringify({ longUrl,customCode,expiryDays,captchaToken })
    });
    const data = await res.json();
    if(data.error){
        alert(data.error);
        return;
    }
    alert("Sucess");
    loadQR(data.code);
    loadUrls();
    document.getElementById("longUrl").value = "";
    document.getElementById("customCode").value = "";
    document.getElementById("expiryDays").value = "";
}

async function loadUrls(){
    const res = await fetch(API + "/api/urls/my-urls",{
        headers:{
            "Authorization":"Bearer " + getToken()
        }
    });

    allUrls = await res.json();
    renderUrls(allUrls);
}    

function renderUrls(urls){
  const list = document.getElementById("list");
  list.innerHTML = "";

  urls.forEach(u => {
  list.innerHTML += `
<li>
  <a href="${API}/${u.short_url}" target="_blank">${u.short_url}</a>
  → ${u.long_url}
  (Clicks: ${u.clicks})

  <div class="url-actions">
    <button class="analytics-btn" onclick="loadAnalytics('${u.short_url}')">Analytics</button>
    <button class="qr-btn" onclick="loadQR('${u.short_url}')">QR</button>
    <button class="delete-btn" onclick="deleteUrl('${u.short_url}')">Delete</button>
  </div>
</li>
`;
    });

}

async function deleteUrl(code){
  await fetch(API + "/api/urls/" + code, {
    method: "DELETE",
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  loadUrls();
}

async function loadQR(code) {
    const res = await fetch(API + "/api/qrcode/" + code);
    const data = await res.json();

    document.getElementById("qr").src = data.qr;
}

let chartInstance = null;

async function loadAnalytics(code){

    const res = await fetch(API + "/api/analytics/" + code,{
        headers: {Authorization:"Bearer " + getToken()}
    });

    const data = await res.json();

    if(chartInstance){
        chartInstance.destroy();
    }

    const labels =  data.map(d=>new Date(d.day).toLocaleString());
    const values = data.map(d=>d.clicks);

    chartInstance = new Chart(document.getElementById("chart"),{
        type:"line",
        data:{
            labels: labels,
            datasets:[{
                label:"Clicks",
                data: values,
                borderColor: "blue",
                backgroundColor:"rgba(79,70,229,.1)",
                fill:true,
                tension:.4
            }]
        }
    });
}
function filterUrls(){
    const keyword = document.getElementById("searchInput").value.toLowerCase();
    const filtered = allUrls.filter(u =>
        u.short_url.toLowerCase().includes(keyword) ||
        u.long_url.toLowerCase().includes(keyword)
        );

  renderUrls(filtered);
}

async function forgot(){
  const email = document.getElementById("email").value.trim();

  console.log("SENDING EMAIL:", email);

  const res = await fetch(API + "/api/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  console.log("SERVER RESPONSE:", data);
  alert(data.message || data.error);
}

async function logout(){

    const token = localStorage.getItem("token");

    await fetch(API + "/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.clear();
    window.location.href="login.html";
}

function changeLocation(){
    window.location.href="signup.html";
}