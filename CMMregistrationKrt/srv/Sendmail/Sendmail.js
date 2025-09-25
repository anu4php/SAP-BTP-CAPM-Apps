const { sendMail } = require("@sap-cloud-sdk/mail-client");
const { html } = require("@sap/cds/app");
const cds = require('@sap/cds');
const core = require('@sap-cloud-sdk/core');
const { getDestination, executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const axios = require("axios");
const { odata } = require("@sap/cds");
const sendEMail = async ({
  to,
  subject,
  empName,
  empAddress,
  authorizedSignatory,
  subscribers,
  accessTypes
}) => {
  if (!to) {
    console.warn("⚠️ Email recipient (to) is missing.");
    return;
  }

  try {
    // const oData = generateEnerlineHTML({
    //   authorizedSignatory,
    //   empName,
    //   empAddress,
    //   subscribers,
    //   accessTypes
    // });
    const oData = {
      html: generateEnerlineHTML({
        authorizedSignatory,
        empName,
        empAddress,
        subscribers,
        accessTypes
      })
    }

    // const oHeader = {
    //   "ACCEPT": "text/html",
    //   "EMAILFROM": "noreply.sustain@enbridge.com",   //oneda
    //   "EMAILTO": to,
    //   "SUBJECT": subject,
    //   "CONTENT-TYPE": "text/html"
    // };
    // const ValidationAPI = await cds.connect.to('Dest_CPI');
    // console.log("destination ===================================",ValidationAPI)
    // // Send using BTP SMTP service
    // // const res=  await ValidationAPI.send("GET", "/http/http/email/extmail_HHH", oData, oHeader);
    // const response = await ValidationAPI.send({
    //   method: 'GET',
    //   path: `/http/http/email/extmail_HHH`,
    //   data: "hello"
    //   // headers:{
    //   //   "ACCEPT": "*/*",
    //   //   "CONTENT-TYPE": "text/html"
    //   // }   
    //  })

    const itemDest = await core.getDestination('SMTP_CPI');
    const url = itemDest.url + "/http/extmail_HH";    //extmail_HH
    const hostHeader = url.host;
    const token = itemDest.authTokens[0].value
    const csrfResponse = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-csrf-token': 'fetch',           // tells SAP to return a token
        'Accept': 'application/json',      // or text/plain if needed
      }
    });
    const csrfToken = csrfResponse.headers['x-csrf-token'];
    const cookies = csrfResponse.headers['set-cookie'];

    const oHeader = {
      "ACCEPT": "text/html",
      "EMAILFROM": "noreply.sustain@enbridge.com",   //oneda
      "EMAILTO": to,
      "SUBJECT": subject,
      "CONTENT-TYPE": "text/html",
      "Host": hostHeader,
      'Authorization': `Bearer ${token}`

    };

    // Your Bearer token
    const response = await axios.post(url, oData, {
      headers: {
        "EMAILFROM": "ondeday7714@gmail.com",   //oneda
        "EMAILTO": to,
        "SUBJECT": subject,
        "CONTENT-TYPE": "text/html",
        "Host": hostHeader,
        'Authorization': `Bearer ${token}`,
        'x-csrf-token': csrfToken,
        ...(cookies ? { Cookie: cookies.join(';') } : {})
      }
    });

    console.log(`✅ Email sent to ${to}`);
    console.log("email response ===================================================================", response.data);

    return response.data;


  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw error;
  }
};




function generateEnerlineHTML({ authorizedSignatory, empName, empAddress, subscribers, accessTypes }) {
  const generateAccessTable = (userEmail) => {
    let rows = '';

    for (const type of accessTypes) {
      const matchingRights = type.rights
        .filter(r => r.userEmail === userEmail)
        .map(r => `• ${r.rightName}`)
        .join('<br>');

      if (matchingRights) {
        rows += `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${type.categoryName}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${matchingRights}</td>
            </tr>
          `;
      }
    }

    return rows ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #e8e8e8;">
              <th style="border: 1px solid #ccc; padding: 8px; width: 30%;">Category</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Access Rights</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      ` : '<p>No access rights assigned.</p>';
  };

  const userDetailsHTML = subscribers.map(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const effectiveDate = user.requestDate || '-';

    return `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th colspan="4" style="padding: 10px; text-align: left; font-size: 16px;">
                User: ${fullName}
              </th>
            </tr>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px;">Phone</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Email</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Effective Date</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Job Title</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${user.phone || '-'}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${user.email}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${effectiveDate}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${user.jobTitle || '-'}</td>
            </tr>
            <tr>
              <td colspan="4" style="padding: 8px;">
                ${generateAccessTable(user.email)}
              </td>
            </tr>
          </tbody>
        </table>
      `;
  }).join('');

  return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
          <p>Tester ${authorizedSignatory.lastName},</p>
  
          <p>
            A request for Enerline access has been submitted by ${authorizedSignatory.firstName} ${authorizedSignatory.lastName}
            (${authorizedSignatory.email}).
          </p>
  
          <p>
            As Authorized Signatory (individual with authority to bind the company), please reply to this email indicating your
            approval of this request. By approving this request, you agree to the Terms and Conditions as set out below.
          </p>
  
          <p><b>This request will not be processed until your authorization is received.</b></p>
  
          <h3>New Access</h3>
          <b>Employer Company</b><br />
          Company: ${empName}<br />
          Phone: ${authorizedSignatory.phone || '-'}<br />
          Address: ${empAddress || '-'}<br /><br />
  
          <b>Authorized Signatory</b><br />
          Name: ${authorizedSignatory.firstName} ${authorizedSignatory.lastName}<br />
          Job Title: ${authorizedSignatory.jobTitle || '-'}<br />
          Phone: ${authorizedSignatory.phone || '-'}<br />
          Email: ${authorizedSignatory.email}<br /><br />
  
          <h3>Details</h3>
          <p>This request contains access details for the following user(s):</p>
          <ul>${subscribers.map(u => `<li>${u.firstName} ${u.lastName}</li>`).join('')}</ul>
  
          ${userDetailsHTML}
  
          <h3>Special Instructions:</h3>
          <p>Please note the future effective dates of access. Please advise next steps.</p>
  
          <h3>Terms and Conditions:</h3>
          <p>
            Authorized Signatory is entirely responsible for all activities that occur under this Agreement.
            Enbridge Gas Inc. (hereinafter referred to as “Enbridge”) will not be liable for any loss or damage resulting from
            the permissions granted through this Agreement. Authorized Signatory agrees to indemnify, defend and hold Enbridge
            harmless from and against any and all claims, liability, losses, costs and expenses incurred arising from or in
            connection with this Agreement. Enbridge reserves the right to direct the defence of, and control, any matter
            otherwise subject to indemnification by Authorized Signatory, and in such case, Authorized Signatory agrees to
            cooperate. Authorized Signatory shall immediately inform Enbridge whenever they desire to terminate or limit
            access that has been previously granted.
          </p>
  
          <p>
            Thank you,<br />
            Enerline Support<br />
            ENBRIDGE GAS<br />
            TEL: 519-436-5446 | enerline@enbridge.com
          </p>
        </body>
      </html>
    `;
}



const sendEMail1 = async ({
  to,
  subject,
  empName,
  empAddress,
  authorizedSignatory,
  subscribers,
  accessTypes
}) => {

  try {
    const emailTemplate = await generateEnerlineHTML({ authorizedSignatory, empName, empAddress, subscribers, accessTypes })

    const mailOptions = {
      from: "catharine39@ethereal.email",
      to: "telani6235@inveitro.com",
      subject: "sdafsdafsadfs",
      html: emailTemplate

    }



    const info = await sendMail({ destinationName: "mailDest" }, [mailOptions])
    return info
  } catch (error) {

  }
}

module.exports = { sendEMail, sendEMail1 };
