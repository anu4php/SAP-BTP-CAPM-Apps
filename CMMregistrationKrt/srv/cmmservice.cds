using {com.cmm.registration as db} from '../db/cmmModel';

service registrationService {
    //entity requestoruser                   as projection on db.requestor;
    entity requestorusers as projection on db.requestors;
     entity accessrights as projection on db.AccessRight;
     entity accessrighttype as projection on db.AccessRightType;
     entity useraccessrights as projection on db.UserAccessRights;


    function getAddress()                                 returns String;
    action   cmmworkflow()                                returns String;
    action googleapi( token:String)                                  returns String;
    function sendmail() returns String;


    // first users and intsert unserinfo as user and acees right in saprate table and empname as company
    action submitRequest(
        firstName: String,
        lastName: String,
        phoneNumber: String,
        emailID: String,
        empName: String,
        empAddress: String,
        authorizedSignatory: String,
        requestType: String,
        subscribers: array of {
            firstName: String;
            lastName: String;
            phone: String;
            email: String;
            requestDate:String;
        },
        accessTypes: array of {
            categoryID: String;     // Unique category ID
            categoryName: String;
            rights: array of {
                rightID: String;    // Unique right ID
                rightName: String;
            };
        }
    ) returns {
        success: Boolean;
        message: String;
        requestID: UUID;
    };

}
