namespace com.cmm.registration;


using {
    cuid,
    managed,
    Country
} from '@sap/cds/common';

 
// entity requestor : cuid, managed {
//     requestorID     : String;
//     submissionID        : String;
//     firstName           : String;
//     lastName            : String;
//     phoneNumber         : String;
//     emailID             : String;
//     companyName         : String;
//     authorizedSignatory : String;
//     requestType         : String;
//     requestDate         : String;
//     status              : String;
//     AccessRightType     : Association to many AccessRightType;
// }

//@cds.persistence.exists
entity requestors : cuid, managed {
    key requestorID     : String;
    submissionID        : String;
    firstName           : String;
    lastName            : String;
    phoneNumber         : String;
    emailID             : String;
    companyName         : String; 
    authorizedSignatory : String;
    requestType         : String;
    requestDate         : String;
    status              : String;
    AccessRightType     : Association to many AccessRightType;
}
//@cds.persistence.exists
entity AccessRightType : cuid, managed {
    categoryName : String;
    rights       : Association to many AccessRight;
}
//@cds.persistence.exists
entity AccessRight : cuid, managed {
    rightName : String;
    category  : Association to one AccessRightType;
}
//@cds.persistence.exists
entity UserAccessRights : cuid, managed {
    user              : Association to requestors;
    accessRight       : Association to AccessRight;
    accessTypes       : Association to many AccessRightType;
    AccessRightStatus : String;
}
