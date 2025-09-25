const cds = require('@sap/cds');
const core = require('@sap-cloud-sdk/core');
const { sendMail } = require("@sap-cloud-sdk/mail-client");
const { sendEMail, sendEMail1 } = require("./Sendmail/Sendmail")
const axios = require('axios');



module.exports = (srv) => {

    srv.on("getAddress", getAddress);
    srv.on("cmmworkflow", cmmWorkflow)
    srv.on("googleapi", googleapi)
    srv.on("sendmail", sendEmail)
    srv.on('submitRequest', submitRequest);

}

const submitRequest = async (req) => {
    try {
        const {
            firstName, lastName, phoneNumber, emailID,
            empName, empAddress, authorizedSignatory, requestType,
            subscribers, accessTypes
        } = req.data;

        const DBService = await cds.connect.to("db");
        const { requestors, UserAccessRights } = DBService.entities;
        console.log("Dddddddddddddddd",requestors)

        if (!subscribers || subscribers.length === 0) {
            return req.error(400, "At least one subscriber (user) is required.");
        }

        // Step 1: Generate unique requestor IDs
        const lastRequestor = await DBService.read('requestors')
            .where({ requestorID: { '!=': null } })
            .orderBy({ requestorID: 'desc' })
            .limit(1);

        let currentNumericID = 100;
        if (lastRequestor.length > 0) {
            const lastID = lastRequestor[0].requestorID;
            if (lastID && /^cmmreq\d{5}$/.test(lastID)) {
                currentNumericID = parseInt(lastID.replace('cmmreq', '')) + 1;
            }
        }

        // Step 2: Create requestor entries with submissionID logic
        let mainUserID = null;

        const requestorEntries = subscribers.map((sub) => {
            const requestorID = `cmmreq${(currentNumericID++).toString().padStart(5, '0')}`;  //cmmreq00100
            console.log("Test 1");
            // Check if this is the main user
            const isMainUser =
                sub.firstName === firstName &&
                sub.lastName === lastName &&
                sub.phone === phoneNumber &&
                sub.email === emailID;

            // If main user, store the requestoruserID to use as submissionID for others
            if (isMainUser) {
                mainUserID = requestorID;
            }
            console.log("Test 2");
            return {
                requestorID,
                submissionID: null, // To be set later
                firstName: sub.firstName,
                lastName: sub.lastName,
                phoneNumber: sub.phone,
                emailID: sub.email,
                companyName: empName,
                authorizedSignatory,
                requestType,
                requestDate: sub.requestDate || requestDate,
                status: 'Pending',
            };
        });

        // After identifying main user, assign submissionID to other users
        requestorEntries.forEach(entry => {
            if (entry.requestorID !== mainUserID) {
                entry.submissionID = mainUserID;
            }
        });
        console.log("Test 3");
        // Step 3: Insert into DB
       const data =  await DBService.create(requestors).entries(requestorEntries);
       console.log('Data inserted successfully:', data);

        // Step 4: Fetch inserted records
        const subscriberEmails = subscribers.map(sub => sub.email);
        const subscriberRecords = await DBService.read(requestors).where({ emailID: { in: subscriberEmails } });

        console.log("Test 4");
        // Step 5: Map access rights
        const userAccessRightsEntries = subscriberRecords.flatMap(sub =>
            accessTypes.flatMap(({ categoryID, rights }) =>
                rights.map(({ rightID }) => ({
                    // user_ID: sub.ID, 
                    user_ID: sub.requestorID,   // ✅ Correct field
                    accessRight_ID: rightID,
                    accessTypes_ID: categoryID,
                }))
            )
        );

        console.log("Test 5");
        await DBService.create(UserAccessRights).entries(userAccessRightsEntries);

        // Step 6: Send Email Notification
/*        const res = await sendEMail({
            to: emailID,
            subject: `Enerline Access Request for ${firstName} ${lastName}`,
            empName,
            empAddress,
            authorizedSignatory,
            subscribers,
            accessTypes
        });
        console.log("Email sent ---->", res);

        return {
            message: `Request successfully submitted and email sent to Authorized Signatory.`,
        }; */

    } catch (error) {
        console.error("Error inserting data:", error);
        return req.error(500, "Internal Server Error: " + error.message);
    } 
};
// const submitRequest = async (req) => {
//     try {
//         const {
//             firstName, lastName, phoneNumber, emailID,
//             empName, empAddress, authorizedSignatory, requestType,
//             subscribers, accessTypes, requestDate
//         } = req.data;

//         if (!subscribers || subscribers.length === 0) {
//             return req.error(400, "At least one subscriber (user) is required.");
//         }

//         // Step 1: Generate unique requestor IDs
//         const DBService = await cds.connect.to("db");
//         const { requestor, UserAccessRights } = DBService.entities;
//         console.log("ddddd",requestor)

//         // Read the last inserted requestoruserID to determine the next ID
//         const lastRequestor = await DBService.read(requestor)
//             .where({ requestorID: { '!=': null } })
//             .orderBy({ requestorID: 'desc' })
//             .limit(1);

//         let currentNumericID = 100; // Default starting point for the requestor user ID

//         // If no requestor entries exist, start from "req00100"
//         if (lastRequestor.length === 0) {
//             currentNumericID = 100;
//         } else {
//             const lastID = lastRequestor[0].requestorID;
//             if (lastID && /^req\d{5}$/.test(lastID)) {
//                 // If last ID is in format "reqxxxxx", increment it
//                 currentNumericID = parseInt(lastID.replace('req', '')) + 1;
//             } else {
//                 // If the last requestor ID does not follow the expected pattern, reset to "req00100"
//                 currentNumericID = 100;
//             }
//         }

//         // Step 2: Create requestor entries
//         let mainUserID = null;

//         const requestorEntries = subscribers.map((sub) => {
//             const requestoruserID = `req${(currentNumericID++).toString().padStart(5, '0')}`; // req00100, req00101, etc.

//             // Check if this is the main user
//             const isMainUser =
//                 sub.firstName === firstName &&
//                 sub.lastName === lastName &&
//                 sub.phone === phoneNumber &&
//                 sub.email === emailID;

//             // If it's the main user, store the requestoruserID to use as submissionID for others
//             if (isMainUser) {
//                 mainUserID = requestoruserID;
//             }

//             return {
//                 requestorID,
//                 submissionID: null, // To be set later
//                 firstName: sub.firstName,
//                 lastName: sub.lastName,
//                 phoneNumber: sub.phone,
//                 emailID: sub.email,
//                 companyName: empName,
//                 authorizedSignatory,
//                 requestType,
//                 requestDate: sub.requestDate || requestDate,
//                 status: 'Pending',
//             };
//         });

//         // After identifying the main user, assign submissionID to other users
//         requestorEntries.forEach(entry => {
//             if (entry.requestorID !== mainUserID) {
//                 entry.submissionID = mainUserID;
//             }
//         });

//         // Step 3: Insert requestor entries into the database
//         await DBService.create(requestor).entries(requestorEntries);

//         // Step 4: Fetch inserted requestor records based on subscriber emails
//         const subscriberEmails = subscribers.map(sub => sub.email);
//         const subscriberRecords = await DBService.read(requestor).where({ emailID: { in: subscriberEmails } });

//         // Step 5: Map access rights to the new requestors
//         const userAccessRightsEntries = subscriberRecords.flatMap(sub =>
//             accessTypes.flatMap(({ categoryID, rights }) =>
//                 rights.map(({ rightID }) => ({
//                     user_ID: sub.ID,
//                     accessRight_ID: rightID,
//                     accessTypes_ID: categoryID,
//                 }))
//             )
//         );

//         await DBService.create(UserAccessRights).entries(userAccessRightsEntries);

//         // Step 6: Send Email Notification to the authorized signatory
//         const res = await sendEMail({
//             to: emailID,
//             subject: `Enerline Access Request for ${firstName} ${lastName}`,
//             empName,
//             empAddress,
//             authorizedSignatory,
//             subscribers,
//             accessTypes
//         });
//         console.log("Email sent ---->", res);

//         return {
//             message: `Request successfully submitted and email sent to Authorized Signatory.`,
//         };

//     } catch (error) {
//         console.error("Error inserting data:", error);
//         return req.error(500, "Internal Server Error: " + error.message);
//     }
// };







const getAddress = async (req, res) => {
    const itemDest = await core.getDestination('address_api');

    //    let response = await core.executeHttpRequest(itemDest, {
    //        method: 'GET',
    //        url: "/v1/Canada_Add"
    // });
    const ValidationAPI = await cds.connect.to('get_address');
    const response = await ValidationAPI.send({
        method: 'GET',
        path: `/v1/Canada_Add`
    })
    console.log(response);
    //const response = Address

    return response
}


const cmmWorkflow = async (req, res) => {
    // const ValidationAPI = await cds.connect.to('cmmWorkflow');
    //const resultmail = await sendEmail;
    console.log(resultmail)

    const workflowData = {
        "definitionId": "us10.c9b8ce81trial.cmmportal.demo",  // Ensure this is correct
        "context": {
        }
    };
    const workflowDest = await core.getDestination('cmmPortalWorkflow');

    // Directly setting the Host header based on the provided endpoint URL
    const host = 'spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com';

    const response = await core.executeHttpRequest(workflowDest, {
        method: 'POST',
        url: "/v1/workflow-instances",
        data: workflowData,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    console.log(response); // Optional, if you want to check the response

    return response;
}
const googleapi = async (req, res) => {
    try {
        // const token = req.data.token
        // const captchaAPI = await cds.connect.to("google_captcha");
        // const data = {
        //     secret: "6LfjBh4rAAAAAA5hKoNXksxVXzFfvSpMHE6DppQh",
        //     response: token
        // };
        // const validateCaptcha = await captchaAPI.send({
        //      method: 'POST',
        //     path: `/siteverify?secret=${data.secret}&response=${data.response}`
        //  });


        const  token  = req.data.token;
        const secretKey = '6LfaKP8qAAAAAOX70s44exxDYN_aUujIKvXTRg8P';

        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
        );
        return response.status

    } catch (error) {
        console.log(error)
    }

}
async function sendEmail(smtpService, user, url, enquiryID) {
    let oSubject = `Enbridge Sustain: Lead ${enquiryID} has been assigned`;
    let emailTo = user.profile.email;

    if (emailTo) {
        let oHeader = {
            "ACCEPT": "text/html",
            // "EMAILFROM": "btpemailservice@enbridge.com",
            "EMAILFROM": "noreply.sustain@enbridge.com",
            "EMAILTO": emailTo,
            "SUBJECT": oSubject,
            "CONTENT-TYPE": "text/html"
        };

        //let oData = `Hello ${user.profile.firstName}, this is a test email to notify you about your account status.`;

        let oData = `
            <html>
                <body>
                    <p>Hi ${user.profile.firstName} ${user.profile.lastName},</p>
                    <p>A lead has been assigned to you from Enbridge Sustain.</p>
                    <p><a href="${url}">Login</a> to the Enbridge Sustain Dealer Portal to access lead information.</p>
                    <p>Your Enbridge Sustain Team</p>
                    <p><img src="https://www.enbridgesustain.com/~/media/EnbridgeSustain/Site%20Asset/sustain_logo.png" alt="Enbridge Sustain" width="150px" height="auto"></p>
                    <p><i>This email was sent from an automated system. Please do not reply to this email.</i></p>
                </body>
            </html>
        `;

        try {
            // await smtpService.send('POST', '/http/email/extmail', oData, oHeader);
            await smtpService.send('POST', '/http/email/extmail_HH', oData, oHeader);
            console.log(`Lib > Email sent to ${user.profile.firstName} ${user.profile.lastName} - ${emailTo}`);
        } catch (error) {
            console.error(`Error sending email to ${emailTo}: ${error}`);
        }
    }
};