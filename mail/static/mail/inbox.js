document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  const email_detail_view = document.createElement("div");
  email_detail_view.id = "email-detail-view";
  email_detail_view.style.display = "none";
  document.querySelector(".container").appendChild(email_detail_view);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  const email_view = document.querySelector("#emails-view");
  const compose_view = document.querySelector("#compose-view");
  const email_detail_view = document.querySelector("#email-detail-view");

  email_view.style.display = "none";
  email_detail_view.style.display = "none";
  compose_view.style.display = "block";

  const recipients_input = document.querySelector("#compose-recipients");
  const subject_input = document.querySelector("#compose-subject");
  const body_input = document.querySelector("#compose-body");

  submit_btn = compose_view.querySelector("form");
  submit_btn.onsubmit = (e) => {
    e.preventDefault();
    req_data = {
      recipients: recipients_input.value,
      subject: subject_input.value,
      body: body_input.value,
    };
    console.log("REQUEST DATA: ", req_data);
    fetch("/emails", {
      method: "POST",
      body: JSON.stringify(req_data),
    })
      .then((response) => {
        if (!response.ok) {
          let err = new Error("HTTP status code: " + response.status);
          err.response = response;
          err.status = response.status;
          throw err;
        }
        return response;
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        recipients_input.value = "";
        subject_input.value = "";
        body_input.value = "";
        load_mailbox("sent");
      })
      .catch(async (err) => {
        const error_message = (await err.response.json()).error;
        console.log("Errors: ", error_message);
        recipients_input.style.border = "1px solid red";
        const err_node = document.createElement("div");
        err_node.style.color = "red";
        err_node.innerHTML = error_message;
        recipients_input.parentNode.appendChild(err_node);
      });
  };
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  const emails_view = document.querySelector("#emails-view");
  const compose_view = document.querySelector("#compose-view");
  const email_detail_view = document.querySelector("#email-detail-view");
  compose_view.style.display = "none";
  email_detail_view.style.display = "none";
  emails_view.style.display = "block";

  // Show the mailbox name
  emails_view.innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
  fetch_mails(mailbox).then((data) => {
    console.log(data);
    data.forEach((item) => {
      const elem = document.createElement("div");
      elem.className = "d-flex justify-content-between email";
      elem.style.border = "1px solid black";
      elem.style.padding = "5px";
      elem.dataset.id = item.id;
      elem.style.cursor = "pointer";
      elem.style.backgroundColor = item.read === true ? "gray" : "white";
      elem.innerHTML = `
      <div><strong>${item.sender}</strong> ${item.subject} </div>
      <div>${item.timestamp}</span></div>
      `;
      elem.onclick = () => {
        load_email(elem.dataset.id, mailbox);
      };
      emails_view.appendChild(elem);
    });
  });
}

function load_email(id, from) {
  const emails_view = document.querySelector("#emails-view");
  const compose_view = document.querySelector("#compose-view");
  const email_detail_view = document.querySelector("#email-detail-view");

  fetch(`emails/${id}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("EMAIL DATA:", data);
      console.log("SENDER:", data.sender);
      email_detail_view.innerHTML = `
        <p><strong>From:</strong> ${data.sender}</p>
        <p><strong>To:</strong> ${data.recipients.join(", ")}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Timestamp:</strong> ${data.timestamp}</p> <br>
        <div>
        <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button> 
        ${
          from !== "sent"
            ? from == "inbox"
              ? `<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>`
              : `<button class="btn btn-sm btn-outline-primary" id="archive">Unarchive</button>`
            : ``
        }
        </div>
        <hr>
        <p>${data.body.replaceAll("\n", "<br>")}</p>
      `;
      emails_view.style.display = "none";
      compose_view.style.display = "none";
      email_detail_view.style.display = "block";

      const reply_btn = document.querySelector("#reply");
      const archive_btn = document.querySelector("#archive");
      reply_btn.onclick = () => {
        console.log("CLICKED REPLY BTN");
        const recipients_input = document.querySelector("#compose-recipients");
        const subject_input = document.querySelector("#compose-subject");
        const body_input = document.querySelector("#compose-body");

        recipients_input.value = data.sender;
        subject_input.value = data.subject;
        body_input.value =
          `\nOn ${data.timestamp} ${data.sender} wrote:\n` + data.body;

        if (!subject_input.value.startsWith("RE:")) {
          subject_input.value = "RE: " + subject_input.value;
        }

        compose_email();
      };
      archive_btn.onclick = () => {
        const is_archived = from === "inbox";
        fetch(`emails/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: is_archived,
          }),
        })
          .then(() => {
            load_mailbox("inbox");
          })
          .catch((err) => {
            console.log("ERROR in ARCHIVE BTN: ", err);
          });
      };
    })
    .catch((err) => console.log);

  fetch(`emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  }).catch((err) => console.log);
}

async function fetch_mails(mailbox) {
  const url = `emails/${mailbox}`;
  const response = await fetch(url);
  return await response.json();
}
