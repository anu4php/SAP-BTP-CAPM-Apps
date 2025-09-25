namespace com.cmm.contactus;

using {
    cuid,
    managed,
    Country
} from '@sap/cds/common';

@cds.persistence.exists
entity InquiryTypes {
    key InquiryType : String(02);
     InquiryName: String(255);
}

@cds.persistence.exists
entity CountryCodes : managed {
    key CountryCode : String(03);
        Country:String(03);
        name : String(50);
} 

@cds.persistence.exists
entity nonAuthUserInquiry : cuid {
    InquiryID : Integer;
    firstName : String(100);
    lastName: String(100);
    companyName : String(100);
    CountryCode : String(8);
    MobileNo : String(20);
    emailID : String(150);
    InquiryType : Association to InquiryTypes;
    message : String(2048);
}