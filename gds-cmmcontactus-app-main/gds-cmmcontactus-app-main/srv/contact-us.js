/* eslint-disable no-unused-vars */
/* eslint-disable no-debugger */

// Import necessary modules
const cds = require("@sap/cds");
const { uuid } = cds.utils;

cds.env.features.fetch_csrf = true;

const SequenceHelper = require("./lib/SequenceHelper");
const sendemailhelper = require("./handlers/sendmail.js");
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const core = require('@sap-cloud-sdk/core');

const { SELECT, INSERT, UPDATE } = cds.ql;

class contactussrv extends cds.ApplicationService {

  async init() {

    const { nonUserInquiry, InquiryTypes, CountryCodes } = this.entities

    // Initialization logic for the registration service
    const db = await cds.connect.to('db');
    const tx = db.tx();


    // this.on('CREATE', InquiryTypes, async (req) => {
    //  const Inquiry = req.data; // Store incoming request data for processing
    // console.log(`Creating Inquiry Type: ${Inquiry.InquiryName}`);
    // await tx.run(INSERT.into(InquiryTypes).entries(Inquiry));  
    // await tx.commit();
    // return Inquiry;
    // });


    this.before('CREATE', nonUserInquiry, async (req) => {
      const data = {
        secret: "",
        response: ""
      };
      data.response = req.headers['recaptchatoken']; 
      if (!req.headers['recaptchatoken']) return req.error(400, 'reCaptchaToken is required');
      
      let RECAPTCHA_DESTINATION_NAME = "Captcha_API";
      try {
        const destination = await core.getDestination(RECAPTCHA_DESTINATION_NAME);
        if (!destination) return req.error(404, `Destination Captcha_API not found`);
        const additionalAttributes = destination.originalProperties;
        data.secret = additionalAttributes.secretkey;
      } catch (err) {
        return req.error(500, 'Error fetching destination: ' + err.message);
      }
      const captchaAPI = await cds.connect.to("reCAPTCHA_API");
      const validateCaptcha = await captchaAPI.send({ method: 'POST', path: `/siteverify?secret=${data.secret}&response=${data.response}`, data });
      if (!validateCaptcha.success) {
        console.error("404 Captcha not correct!");
        req.error(404, `Your session is not valid anymore, try to refresh your browser.`);
      }
    });


    this.on('CREATE', nonUserInquiry, async (req) => {

      req.data.ID = uuid();
      const cmmInquiryId = new SequenceHelper({
        db: db,
        sequence: "COM_CMM_NONUSERINQ_ID",
        table: "COM_CMM_REGISTRATION_NONAUTHUSERINQUIRY",
        field: "INQUIRYID",
      });
      if (!req.data.InquiryID) {
        let number = await cmmInquiryId.getNextNumber();
        req.data.InquiryID = number.toString();
      }
      const inquiryData = req.data;
      // const tx = cds.transaction(req);  // transaction specific to request

      try {
        await db.run(INSERT.into("COM_CMM_REGISTRATION_NONAUTHUSERINQUIRY").entries(inquiryData));
        await tx.commit();
        const InquiryTypeDesc = await db.run(SELECT.from('COM_CMM_REGISTRATION_INQUIRYTYPES').where({
          InquiryType: inquiryData.
            InquiryType_InquiryType
        }));;
        let oSendemail = {};
        const subject = `Enbridge Gas: Enerline Inquiry - ` + InquiryTypeDesc[0].INQUIRYNAME;
        const Body = `<div class="container">
                        
                      <p>Thank you for reaching out to us! We have received your inquiry and will get back to you shortly.</p>
                      <p>Here is a summary of your inquiry:</p>
            
                      <p><b><u>Enerline Inquiry From</u></b></p>
                         
                        <div class="section">
                        <p><span class="label">First Name:</span>${inquiryData.firstName}</p>
                        <p><span class="label">Last Name:</span>${inquiryData.lastName}</p>
                        <p><span class="label">Username:</span>${inquiryData.emailID}</p>
                        <p><span class="label">Email:</span> ${inquiryData.emailID}</p>
                        <p><span class="label">Phone:</span> + ${inquiryData.CountryCode} ${inquiryData.MobileNo}</p>
                        <p><span class="label">Company:</span> ${inquiryData.companyName}</p>
                        </div>
                         
                        <div class="section">
                        <p><b><u>InquiryDetails</u></b></p>
                        <p>${inquiryData.message}</p>
                        </div>
                         
                            <div class="footer">
                              Enbridge Gas | About Us | Community | Careers | News | Contact Us<br>
                              Natural Gas Emergencies: 1-877-969-0999<br>
                        &copy; Enbridge Gas Inc.
                        </div>
                        </div>`;
        const customerEmail = inquiryData.emailID; //`sunil.challapalli@enbridge.com`;             

        oSendemail = await sendemailhelper.sendemail(subject, customerEmail, Body);
        if (oSendemail == "Success") {
          console.log("oSendemail", oSendemail)
        }
        else {
          // req.error(500, 'Error in sending email');
        }
        return inquiryData;
      } catch (err) {
        await tx.rollback();
        req.error(500, `Error creating UserInquiry: ${err.message}`);
      }
    });




    this.on('READ', InquiryTypes, async (req) => {

      const inquiryTypeList = await db.run(SELECT.from('COM_CMM_REGISTRATION_INQUIRYTYPES'));
      const InquiryTypereturn = [];
      inquiryTypeList.forEach(type => InquiryTypereturn.push({ InquiryType: type.INQUIRYTYPE, InquiryName: type.INQUIRYNAME }));
      return InquiryTypereturn
    }),

      this.on('READ', CountryCodes, async (req) => {

        const codeList = await db.run(SELECT.from('COM_CMM_REGISTRATION_COUNTRYCODES'));
        const CountryCodeReturn = [];
        codeList.forEach(code => CountryCodeReturn.push({ CountryCode: code.COUNTRYCODE, Country: code.COUNTRY, name: code.NAME }));
        return CountryCodeReturn;

      });

    this.on('getSiteKey', async req => {
      let RECAPTCHA_DESTINATION_NAME = "Captcha_API";
      try {
        const destination = await core.getDestination(RECAPTCHA_DESTINATION_NAME);
        if (!destination) return req.error(404, `Destination Captcha_API not found`);
        const additionalAttributes = destination.originalProperties;
        const sitekey = additionalAttributes.sitekey;
        return sitekey;
      } catch (err) {
        return req.error(500, 'Error fetching destination: ' + err.message);
      }
    });

  }
}

module.exports = { contactussrv };