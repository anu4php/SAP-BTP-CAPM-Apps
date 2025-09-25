using {com.cmm.contactus as db} from '../db/cmm-contactus-db';


service  contactussrv {
  entity InquiryTypes as projection on db.InquiryTypes;
  entity CountryCodes as projection on db.CountryCodes;
  entity nonUserInquiry as projection on db.nonAuthUserInquiry;
  function getSiteKey() returns String;
}