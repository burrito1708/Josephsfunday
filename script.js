const SUPABASE_URL = "https://hteabfwqyekukhfmfbtn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ip9y8zWCW-IMJtuRB-LDCA_9m_7vUiM";

// Fixed variable name mismatch (SUPABASE_ANON_KEY instead of SUPABASE_KEY)
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Stores the ID of the request the user just submitted
let submittedRequestId = null;


// ==========================================
// SUBMIT REQUEST
// ==========================================

async function submitEmail() {

    const nameInput = document.getElementById("nameInput");
    const emailInput = document.getElementById("emailInput");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    const popupOverlay = document.getElementById("popupOverlay");
    const approvalSection = document.getElementById("approvalSection");
    const approvalBox = document.getElementById("approvalBox");

    const errorMessage = document.getElementById("errorMessage");
    const enterButton = document.getElementById("enterButton");


    // Clear previous error
    errorMessage.style.display = "none";
    errorMessage.textContent = "";


    // Check name
    if (name === "") {
        errorMessage.textContent = "Please enter your first and last name.";
        errorMessage.style.display = "block";
        return;
    }


    // Check email
    if (email === "") {
        errorMessage.textContent = "Please enter your email.";
        errorMessage.style.display = "block";
        return;
    }


    // Check email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        errorMessage.textContent = "Please enter a valid email address.";
        errorMessage.style.display = "block";
        return;
    }


    // Disable button while sending
    enterButton.disabled = true;
    enterButton.textContent = "Sending...";


    // Reset approval box
    approvalBox.textContent = "Awaiting approval";
    approvalBox.classList.remove("approved");
    approvalBox.classList.remove("denied");


    // ==========================================
    // SEND REQUEST TO SUPABASE
    // ==========================================

    const { data, error } = await supabaseClient
        .from("jfd requests")
        .insert([
            {
                name: name,
                email: email,
                status: "pending"
            }
        ])
        .select("id")
        .single();


    // If something went wrong, display the precise Supabase error
    if (error) {
        console.error("Supabase insert error:", error);

        errorMessage.textContent = error.message || "Something went wrong. Please try again.";
        errorMessage.style.display = "block";

        enterButton.disabled = false;
        enterButton.textContent = "Enter";

        return;
    }


    // ==========================================
    // SAVE THE REQUEST ID
    // ==========================================

    submittedRequestId = data.id;


    // Show approval section
    approvalSection.style.display = "block";


    // ==========================================
    // SHOW POPUP
    // ==========================================

    popupOverlay.style.display = "flex";

    setTimeout(function() {
        popupOverlay.style.display = "none";
    }, 3000);


    // Reset button
    enterButton.disabled = false;
    enterButton.textContent = "Enter";


    // Start checking approval status
    checkApprovalStatus();


    // Refresh approved users
    loadApprovedUsers();
}



// ==========================================
// CHECK APPROVAL STATUS
// ==========================================

async function checkApprovalStatus() {

    // Don't do anything if there isn't a submitted request
    if (!submittedRequestId) {
        return;
    }


    const approvalBox = document.getElementById("approvalBox");


    const { data, error } = await supabaseClient
        .from("jfd requests")
        .select("status")
        .eq("id", submittedRequestId)
        .single();


    // If there was an error checking
    if (error) {
        console.error("Status check error:", error);

        // Try again in 5 seconds
        setTimeout(checkApprovalStatus, 5000);

        return;
    }


    // ==========================================
    // APPROVED
    // ==========================================

    if (data.status === "approved") {
        approvalBox.textContent = "Approved";

        approvalBox.classList.remove("denied");
        approvalBox.classList.add("approved");

        // Update approved users list
        loadApprovedUsers();

        // Stop checking
        return;
    }


    // ==========================================
    // DENIED
    // ==========================================

    if (data.status === "denied") {
        approvalBox.textContent = "Denied";

        approvalBox.classList.remove("approved");
        approvalBox.classList.add("denied");

        // Stop checking
        return;
    }


    // ==========================================
    // STILL PENDING
    // ==========================================

    approvalBox.textContent = "Awaiting approval";

    approvalBox.classList.remove("approved");
    approvalBox.classList.remove("denied");


    // Check again in 5 seconds
    setTimeout(checkApprovalStatus, 5000);
}



// ==========================================
// LOAD APPROVED USERS
// ==========================================

async function loadApprovedUsers() {

    const usersBox = document.getElementById("usersBox");

    const { data, error } = await supabaseClient
        .from("jfd requests")
        .select("name")
        .eq("status", "approved")
        .order("name", {
            ascending: true
        });


    // If there was an error
    if (error) {
        console.error("Supabase load error:", error);
        return;
    }


    // No approved users
    if (!data || data.length === 0) {
        usersBox.innerHTML = `
            <div class="no-users">
                No users have been approved yet.
            </div>`;
        return;
    }


    // Clear current list
    usersBox.innerHTML = "";


    // Add every approved user
    data.forEach(function(user) {
        const userElement = document.createElement("div");

        userElement.className = "approved-user";
        userElement.textContent = user.name;

        usersBox.appendChild(userElement);
    });
}



// ==========================================
// LOAD APPROVED USERS WHEN PAGE OPENS
// ==========================================

loadApprovedUsers();



// ==========================================
// ALLOW ENTER KEY TO SUBMIT
// ==========================================

document
    .getElementById("emailInput")
    .addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            submitEmail();
        }
    });