const cds = require("@sap/cds");
const cheerio = require('cheerio');
const sendemail = async (Subject, CustomerEmail, Body) => {


const $ = cheerio.load(Body);


    const smtpService = await cds.connect.to('Dest_CPI');
    let mail = '';
    let finalHTML = `<html>
    <head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.2;
    } 

    .footer {
      font-size: 0.9em;
      color: #666;
      margin-top: 30px;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
  </style>
    </head>
    <body>${$.html()}</body>
</html>`;
    // finalHTML = finalHTML.toString().replaceAll('\n', '').replaceAll('\"', '\'');
    // finalHTML = Buffer.from(finalHTML).toString('base64url');
    // finalHTML = finalHTML.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    let oHeader = {
        "ACCEPT": "text/html",
        "EMAILFROM": "noreply@enbridge.com",
        "EMAILTO": CustomerEmail,
        "SUBJECT": Subject,
        "CONTENT-TYPE": "text/html; charset=UTF-8",
       // "Content-Transfer-Encoding": "base64",  // Added quotes to make it a valid string
    };

    //console.log("oHeader >> ", oHeader)


    //console.log("Body >> ", finalHTML)

    try {
       // await smtpService.send('GET', `/http/emailccp?con=${finalHTML}`, '', oHeader);
       await smtpService.send('POST', '/http/email/extmail', finalHTML, oHeader);
        mail = 'Success';
        console.log("in sendemail", mail)
        return mail;
    } catch (error) {
        console.error(`Error sending email to ${CustomerEmail}: ${error}`);
        if (error == 'Error: Error during request to remote service: Parse Error: Header overflow') {
            mail = 'Success';
        } else {
            mail = 'Error';
            console.log("in sendemail error >> ", error)
        }
        return mail;
    }
}

module.exports = {
    sendemail
}