sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Page",
    "sap/m/Panel",
    "sap/m/CheckBox",
    "sap/m/Text",
    "sap/ui/core/UIComponent",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType",
    "sap/ui/core/message/MessageManager",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageBox, Page,
    Panel, CheckBox, Text, UIComponent, MessagePopover,
    MessageItem, Message, MessageType, MessageManager, Fragment) {
    "use strict";
    var usersData = [], oReviewMove, oTodayDate;
    return Controller.extend("cmmregistration.controller.Registration", {
        onInit: function () {
            var today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time
            var todayFormatted = today.toISOString().split("T")[0];
            oTodayDate = new Intl.DateTimeFormat('en-US', { dateStyle: "medium" }).format(new Date());
            this.getView().setModel(new JSONModel({
                "here": 'If you already have an Enerline account, Please sign in ' +
                    '<a target="_blank" href="https://www.enbridgegas.com/storage-transportation/enerline/direct-connect"><u>here</u></a>'
            }));





            this.allUsersAccessRights = {};
            var oViewModel = new JSONModel({
                isItemSelected: false,
                alluserAccess: false,
                selectedUser: null,
                issubscribersSelected: false,
                isAnyAccessSelected: true,
                isSubmitbtn: false,
                currentDate: todayFormatted,
                requestType: "",
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
                employerName: "",
                employerAddress: "",
                selectedAuthSign: "",
                accessRequest: "",
                jobTitle: "",
                allAcessRights: "",
                // empjobTitle:"",
                otherFormData: {},
                isStep2Valid: false,
                subscribers: [],
                accessType: [],  // ✅ Change to an array to store multiple selections
            });

            this.getView().setModel(oViewModel, "wizardModel");
            var oAccessModel = new sap.ui.model.json.JSONModel({
                users: [] // Initial empty array for users
            });

            this.getView().setModel(oAccessModel, "AccessModel");
            //this.onReadAddress();
            var oView = this.getView();
            this.oMessageManager = sap.ui.getCore().getMessageManager();
            oView.setModel(this.oMessageManager.getMessageModel(), "message");
            this.oMessageManager.registerObject(oView, true);

            this.oMessagePopover = new sap.m.MessagePopover({
                items: {
                    path: "message>/",
                    template: new sap.m.MessageItem({
                        title: "{message>message}",
                        type: "{message>type}",
                        description: "{message>description}",
                        icon: "{message>icon}",
                        counter: "{message>counter}"
                    })
                }
            });
            //KK -5/21/2025 BOC
            oView.addDependent(this.oMessagePopover);

            //KK -5/21/2025 EOC

            //oView.byId("messagePopoverButton").addDependent(this.oMessagePopover);
            this.fetchCategoriesAndRights()


        },

        loadRecaptcha: function () {
            var that = this; // Preserve UI5 context

            if (typeof grecaptcha === "undefined") {
                console.log("Loading reCAPTCHA API...");
                var script = document.createElement("script");
                script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);

                window.onRecaptchaLoad = function () {
                    console.log("reCAPTCHA API Loaded");
                    that.renderRecaptcha();
                };
            } else {
                console.log("reCAPTCHA already loaded");
                this.renderRecaptcha();
            }
        },

        renderRecaptcha: function () {
            console.log("Checking reCAPTCHA div:", document.getElementById("recaptchaGoogle"));

            setTimeout(() => {
                var recaptchaDiv = document.getElementById("recaptchaGoogle");
                if (recaptchaDiv && typeof grecaptcha !== "undefined") {
                    console.log("Rendering reCAPTCHA...");
                    grecaptcha.render("recaptchaGoogle", {
                        sitekey: "6LfaKP8qAAAAAC6ivR0QAFzlnJwj_lKRc-gUxw2a",
                        callback: this.verifyCallback.bind(this),
                        'expired-callback': this.expiredCallback.bind(this) // Expiry callback
                    });
                } else {
                    console.error("reCAPTCHA div not found!");
                }
            }, 1000); // Delay ensures UI is ready
        },
        expiredCallback: function () {
            console.log("reCAPTCHA expired!");

            // Disable submit button
            var oViewModel = this.getView().getModel("wizardModel");
            oViewModel.setProperty("/isSubmitbtn", false);
            sap.m.MessageToast.show("verify captca again");
        },
        verifyCallback: function (response) {
            const that = this
            console.log("CAPTCHA Verified! Token:", response);

            if (response) {
                const payload = {
                    token: response
                }
                const oDataModel = this.getOwnerComponent().getModel();
                oDataModel.create("/googleapi", payload, {
                    success: function (res) {
                        var oViewModel = that.getView().getModel("wizardModel");
                        oViewModel.setProperty("/isSubmitbtn", true);

                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error in submission");
                    }
                })

            }

        },


        onReadAddress: function () {
            const oDataModel = this.getOwnerComponent().getModel();
            oDataModel.read("/getAddress", {
                success: (odata) => {
                    var oAddressModel = new JSONModel();
                    const addressData = odata.getAddress.value;  // Assuming 'value' contains the address data

                    oAddressModel.setData({ value: addressData });
                    this.getView().setModel(oAddressModel, "addressModel");
                },
                error: () => {
                    sap.m.MessageToast.show("Error in submission");
                }
            });
        },
        fetchCategoriesAndRights: function () {
            const that = this;
            const oDataModel = this.getOwnerComponent().getModel();

            // ✅ Fetch all categories
            oDataModel.read("/accessrighttype", {
                success: (oCategoryData) => {
                    const categories = oCategoryData.results || [];
                    console.log("📌 Fetched Categories:", categories);

                    // ✅ Sort categories alphabetically by categoryName
                    categories.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

                    // ✅ Fetch all access rights types
                    oDataModel.read("/accessrights", {
                        success: (oRightsData) => {
                            const rights = oRightsData.results || [];
                            console.log("📌 Fetched Access Rights:", rights);

                            // ✅ Group rights under respective categories
                            const groupedData = categories.map(category => ({
                                categoryID: category.ID,
                                categoryName: category.categoryName,
                                accessRights: rights
                                    .filter(right => right.category_ID === category.ID)
                                    .map(right => ({
                                        accessTypeID: right.ID,  // ✅ Include Access Type ID
                                        rightName: right.rightName
                                    }))
                            }));

                            // ✅ Save data in `wizardModel`
                            var oViewModel = that.getView().getModel("wizardModel");
                            oViewModel.setProperty("/allAcessRights", groupedData);

                            console.log("✅ Grouped Access Rights with IDs:", JSON.stringify(groupedData, null, 2));
                        },
                        error: (err) => console.error("❌ Error fetching access rights:", err)
                    });

                },
                error: (err) => console.error("❌ Error fetching categories:", err)
            });
        },

        onSuggest: function (oEvent) {
            var sValue = oEvent.getParameter("suggestValue").toLowerCase();
            var oComboBox = oEvent.getSource();

            // Get the address data model
            var oAddressModel = this.getView().getModel("addressModel");
            var aAddresses = oAddressModel.getData().value;

            // Filter the addresses based on the user input
            var aFilteredAddresses = aAddresses.filter(function (address) {
                return address.street.toLowerCase().includes(sValue) ||
                    address.municipality.toLowerCase().includes(sValue) ||
                    address.province.toLowerCase().includes(sValue);
            });

            // Create a new JSON model for filtered data
            var oFilteredModel = new sap.ui.model.json.JSONModel();
            oFilteredModel.setData({ value: aFilteredAddresses });

            // Set the filtered model to the ComboBox
            oComboBox.setModel(oFilteredModel);

            // Open the suggestion list after filtering
            oComboBox.openSuggestionPopup();
        },

        onPrevious: function () {
            var oWizard = this.byId("idCreateProductWizard");

            if (oWizard) {
                var iCurrentStep = oWizard.getProgress();
                if (iCurrentStep > 1) {
                    oWizard.previousStep();
                }
            }
        },
        onNavigate: function (oEvent) {
            var sDirection = oEvent.getSource().data("direction");
            var oWizard = this.byId("idCreateProductWizard");

            if (!oWizard) return;

            //            var currentStep = oWizard.getProgress()
            var currentStep = oWizard.mAggregations._progressNavigator.getCurrentStep();
            var targetStep = parseInt(oEvent.getSource().data("targetStep"), 10);


            if (Math.abs(currentStep - targetStep) > 1) {
                this.resetWizardState(); // Reset if user jumps steps
            }

            if (sDirection === "next") {
                this.onProceed();
            } else if (sDirection === "prev") {
                if (oReviewMove === 'X' && currentStep === 5) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(4);
                    oWizard.goToStep(this.getView().byId('PricingStep'));
                } else if (oReviewMove === 'X' && currentStep === 2) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(1);
                    oWizard.goToStep(this.getView().byId('idAccessType'));
                } else if (oReviewMove === 'X' && currentStep === 3) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(2);
                    oWizard.goToStep(this.getView().byId('idCompanyInfo'));
                } else if (oReviewMove === 'X' && currentStep === 4) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(3);
                    oWizard.goToStep(this.getView().byId('idSubscriberInfo'));
                } else {
                    oWizard.previousStep();
                }
            }
        },
        resetWizardState: function () {
            var oWizard = this.byId("idCreateProductWizard");
            if (!oWizard) return;

            oWizard.discardProgress(oWizard.getSteps()[0]); // Reset wizard to step 1
            this.recaptchaLoaded = false; // Reset reCAPTCHA flag
            this.oMessageManager.removeAllMessages(); // Clear validation messages
        },

        onSelectionChange: function (oEvent) {
            var oViewModel = this.getView().getModel("wizardModel");
            var oSelectedItem = oEvent.getParameter("listItem"); // Get the selected GridListItem

            if (oSelectedItem) {
                var oVBox = oSelectedItem.getAggregation("content")[0]; // Get the VBox inside GridListItem
                var oTitle = oVBox.getAggregation("items")[0]; // Get the first item inside VBox (Title)

                if (oTitle && oTitle.isA("sap.m.Title")) {
                    var sSelectedText = oTitle.getText(); // Extract the Title text
                    oViewModel.setProperty("/accessRequest", sSelectedText);
                    oViewModel.setProperty("/isItemSelected", true);
                }
            }
        },

        onProceed: function () {
            var oWizard = this.byId("idCreateProductWizard");
            if (!oWizard) return;

            //var currentStep = oWizard.getProgress();
            var currentStep = oWizard.mAggregations._progressNavigator.getCurrentStep();
            var oModel = this.getView().getModel("wizardModel");
            this.oMessageManager.removeAllMessages();

            if (currentStep === 2 && oReviewMove != 'X') {
                this.getView().byId("idAccessType").setIcon("sap-icon://accept");
               /* if (!this.validateSecondStep()) {
                    // ❌ Show MessagePopover if validation fails
                    if (!this.oMessagePopover.isOpen()) {
                        this.oMessagePopover.openBy(this.getView().byId("messagePopoverButton"));
                    }
                    return; // ❌ Stop navigation
                }*/

                var subscribers = oModel.getProperty("/subscribers") || [];
                var newSubscriber = {
                    firstName: oModel.getProperty("/firstName"),
                    lastName: oModel.getProperty("/lastName"),
                    jobTitle: oModel.getProperty("/jobTitle"),
                    email: oModel.getProperty("/email"),
                    phone: oModel.getProperty("/phone"),
                    requestEffDate: new Intl.DateTimeFormat('en-US', { dateStyle: "medium" }).format(new Date())
                };

                // **Check for duplicate entry based on email**
                var isDuplicate = subscribers.some(sub => sub.email === newSubscriber.email);
                if (!isDuplicate) {
                    subscribers.push(newSubscriber);
                    oModel.setProperty("/subscribers", subscribers);
                }

                oWizard.nextStep();
            }
            else if (currentStep === 3 && oReviewMove != 'X') {
                // ✅ Validate Subscribers at Step 3 before proceeding
              /*  if (!this.validateSubscribers()) {
                    // ❌ Show MessagePopover if validation fails
                    if (!this.oMessagePopover.isOpen()) {
                        this.oMessagePopover.openBy(this.getView().byId("messagePopoverButton"));
                    }
                    return; // ❌ Stop navigation

                }*/
                this.onPressNavToDetail()
                oWizard.nextStep();
            }
            else if (currentStep === 4 && oReviewMove != 'X') {
                // ✅ Ensure reCAPTCHA loads only once
                var oList = this.getView().byId("userLists"),
                    oFirstItem = oList.getItems()[0];
                oList.setSelectedItem(oFirstItem, true, true);
                if (!this.recaptchaLoaded) {
                    this.recaptchaLoaded = true;
                    this.loadRecaptcha();
                }
                // ✅ Enable Visibility Submit button
                this.getView().byId("_IDGenButton3").setVisible(true);
                oWizard.nextStep();
            }
            // else if (currentStep === 5) {
            //     // ✅ Ensure reCAPTCHA loads only once
            //     this.resetWizardState();

            // } 
            else {
                if (oReviewMove === 'X' && currentStep === 1) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(2);
                    oWizard.goToStep(this.getView().byId('idCompanyInfo'));
                } else if (oReviewMove === 'X' && currentStep === 2) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(3);
                    oWizard.goToStep(this.getView().byId('idSubscriberInfo'));
                } else if (oReviewMove === 'X' && currentStep === 3) {
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(4);
                    oWizard.goToStep(this.getView().byId('PricingStep'));
                } else if (oReviewMove === 'X' && currentStep === 4) {
                    // ✅ Enable Visibility Submit button
                    this.getView().byId("_IDGenButton3").setVisible(true);
                    this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(5);
                    oWizard.goToStep(this.getView().byId('ReviewPage'));
                } else {
                    oWizard.nextStep();
                }

            }
        },


        validateSubscribers: function (oEvent) {
            var oView = this.getView();
            var oModel = oView.getModel("wizardModel");
            var isValid = true;

            this.oMessageManager.removeAllMessages();
           // /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(x\d+)?$/; email new validation 5/28

            var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            var phoneRegex = /^\d{10}(x\d+)?$/ ; ///^[0-9]{10}$/;

            var subscribers = oModel.getProperty("/subscribers") || [];
            var tableItems = oView.byId("idTableAddOper").getItems(); // Get table items once

            // Helper function to set validation states
            var setValidationState = function (index, cellIndex, condition, message, icon, type) {
                var inputCell = tableItems[index].getCells()[cellIndex];
                if (condition) {
                    isValid = false;
                    this.addMessage(`Subscriber ${index + 1}: ${message}`, type, icon);
                    inputCell.setValueState("Error");
                    inputCell.setValueStateText(message);
                } else {
                    inputCell.setValueState("None");
                }
            }.bind(this); // Bind to retain 'this' context

            subscribers.forEach(function (subscriber, index) {
                // Handle liveChange validation
                if (oEvent) {
                    var fieldName = oEvent.getParameter("id").split("--").pop(); // Dynamically determine which field was changed
                    var fieldValue = oEvent.getParameter("value");

                    switch (fieldName) {
                        case "firstName":
                            setValidationState(index, 0, !fieldValue || fieldValue.length > 100,
                                "First Name required (max 100 chars).", "sap-icon://alert", sap.ui.core.MessageType.Error);
                            break;
                        case "lastName":
                            setValidationState(index, 1, !fieldValue || fieldValue.length > 100,
                                "Last Name required (max 100 chars).", "sap-icon://alert", sap.ui.core.MessageType.Error);
                            break;
                        case "jobTitle":
                            setValidationState(index, 2, !fieldValue || fieldValue.length > 150,
                                "Job Title required (max 150 chars).", "sap-icon://alert", sap.ui.core.MessageType.Error);
                            break;
                        case "email":
                            setValidationState(index, 3, !emailRegex.test(fieldValue) || fieldValue.length > 150,
                                "Invalid Email (max 150 chars).", "sap-icon://email", sap.ui.core.MessageType.Warning);
                            break;
                        case "phone":
                            setValidationState(index, 4, !phoneRegex.test(fieldValue),
                                "Phone must be exactly 10 digits.", "sap-icon://phone", sap.ui.core.MessageType.Warning);
                            break;
                        case "requestEffDate":
                            // Date validation (check if it's empty or invalid)
                            var dateValue = oEvent.getParameter("value");
                            if (!dateValue) {
                                setValidationState(index, 5, true,
                                    "Request Effective Date is required.", "sap-icon://calendar", sap.ui.core.MessageType.Error);
                            } else {
                                setValidationState(index, 5, false, "", "", "");
                            }
                            break;
                    }
                } else {
                    // Full form validation (when validating the entire table)
                    setValidationState(index, 0, !subscriber.firstName || subscriber.firstName.length > 100,
                        "First Name required (max 100 chars).", "sap-icon://alert", sap.ui.core.MessageType.Error);

                    setValidationState(index, 1, !subscriber.lastName || subscriber.lastName.length > 100,
                        "Last Name required (max 100 chars).", "sap-icon://alert", sap.ui.core.MessageType.Error);

                    setValidationState(index, 2, !subscriber.jobTitle || subscriber.jobTitle.length > 150,
                        "Job Title required (max 150 chars).", "sap-icon://alert", sap.ui.core.MessageType.Error);

                    setValidationState(index, 3, !emailRegex.test(subscriber.email) || subscriber.email.length > 150,
                        "Invalid Email (max 150 chars).", "sap-icon://email", sap.ui.core.MessageType.Error);

                                       setValidationState(index, 4, !phoneRegex.test(subscriber.phone),
                                           "Phone must be exactly 10 digits.", "sap-icon://phone", sap.ui.core.MessageType.Error);

                    // Full date validation for the entire form
                    setValidationState(index, 5, !subscriber.requestEffDate,
                        "Request Effective Date is required.", "sap-icon://calendar", sap.ui.core.MessageType.Error);
                }
            });

            return isValid;
        },


        onMessagePopoverPress: function (oEvent) {
            this.oMessagePopover.toggle(oEvent.getSource());
        },

        /** 🔹 VALIDATE INPUTS BEFORE MOVING TO NEXT STEP */
        validateAndProceed: function (oEvent) {
            var isValid = this.validateSecondStep();  // 🔹 Run validation
            if (isValid) {
                this.getView().byId("idCreateProductWizard").nextStep(); // ✅ Proceed if valid
            } else {
                this.oMessagePopover.openBy(this.getView().byId("messagePopoverButton")); // ❌ Show errors
            }
        },



        validateSecondStep: function () {
            var oView = this.getView(), oCounter = 0;
            var oModel = oView.getModel("wizardModel");
            var isValid = true;

            // Clear previous validation messages
            this.oMessageManager.removeAllMessages();

            // Define validation regex for fields
            var nameRegex = /^[A-Za-z\s]+$/;
            var phoneRegex =  /^\d{10}(x\d+)?$/;                                            //  /^[0-9]{10}$/;
            var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

            // Define categories with icons
            var categories = {
                "Required Fields": "sap-icon://alert",
                "Invalid Format": "sap-icon://error",
                "Dropdown Selection": "sap-icon://form"
            };

            // Fields to validate
            var fieldsToValidate = [
                { id: "idTypeOfRequest", key: "requestType", label: "Type of Request", type: "dropdown", category: "Dropdown Selection" },
                { id: "idFirst", key: "firstName", label: "First Name", regex: nameRegex, category: "Required Fields" },
                { id: "idLast", key: "lastName", label: "Last Name", regex: nameRegex, category: "Required Fields" },
                { id: "idPhone", key: "phone", label: "Phone Number", regex: phoneRegex, category: "Invalid Format" },
                { id: "idEmailAddress", key: "email", label: "Email Address", regex: emailRegex, category: "Invalid Format" },
                { id: "idEmpName", key: "employerName", label: "Employer Name", regex: nameRegex, category: "Required Fields" },
                { id: "idEmpAdd", key: "employerAddress", label: "Employer Address", category: "Required Fields" },
                { id: "idempjobTitle", key: "jobTitle", label: "Job Title", category: "Required Fields" },
                { id: "idAuthSign", key: "selectedAuthSign", label: "Authorized Signatory", type: "dropdown", category: "Dropdown Selection" }
            ];

            // Handle "Other" selection for Authorized Signatory
            if (oModel.getProperty("/selectedAuthSign") === "Other") {
                fieldsToValidate.push(
                    { id: "idFirstOther", key: "otherFirstName", label: "Other First Name", regex: nameRegex, category: "Required Fields" },
                    { id: "idLastOther", key: "otherLastName", label: "Other Last Name", regex: nameRegex, category: "Required Fields" },
                    { id: "idPhoneOther", key: "otherPhone", label: "Other Phone Number", regex: phoneRegex, category: "Invalid Format" },
                    { id: "idEmailOther", key: "otherEmail", label: "Other Email Address", regex: emailRegex, category: "Invalid Format" },
                    { id: "idJobTitle", key: "jobTitle", label: "Job Title", regex: nameRegex, category: "Required Fields" }
                );
            }

            // Helper function to set validation states and messages
            var setValidationState = function (field, value, condition, message, icon, type) {
                var inputField = oView.byId(field.id);
                if (condition) {
                    isValid = false;
                    this.addMessage(message, type, icon);
                    inputField.setValueState("Error");
                    inputField.setValueStateText(message);
                } else {
                    inputField.setValueState("None");
                }
            }.bind(this);

            // Validate fields
            fieldsToValidate.forEach(function (field) {
                var value = oModel.getProperty("/" + field.key)?.trim();

                if (!value) {
                    setValidationState(field, value, true, `${field.label} is required.`, "sap-icon://alert", sap.ui.core.MessageType.Error);
                } else if (field.regex && !field.regex.test(value)) {
                    oCounter += 1;
                    setValidationState(field, value, true, `Invalid ${field.label}.`, "sap-icon://error", sap.ui.core.MessageType.Error);
                } else {
                    setValidationState(field, value, false);
                }
            });

            // Show MessagePopover if there are errors
            if (!isValid) {
                this.oMessagePopover.openBy(this.getView().byId("messagePopoverButton"));
            }

            return isValid; // Return true if all fields are valid
        },
        addMessage: function (messageText, messageType, icon) {
            var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
            var oMessage = new sap.ui.core.message.Message({
                message: messageText,
                type: messageType,
                description: messageText,
                icon: icon,
                processor: oMessageProcessor
            });

            // ✅ Add message to MessageManager
            this.oMessageManager.addMessages(oMessage);
            console.log(this.oMessageManager.getMessageModel().getData());

        },
        // NC KK


        // NC KK

        // 🟢 FIX: Live Validation
        onInputLiveChange: function (oEvent) {
            var inputField = oEvent.getSource();
            var value = inputField.getValue().trim();
            var fieldId = inputField.getId();
            var oModel = this.getView().getModel("wizardModel");
            // var sValue = oInput.getValue().trim(); // Get input value
            // var sBindingPath = oInput.getBinding("value").getPath(); // Get binding path
            // oModel.setProperty(sBindingPath, sValue);
            var validationRules = {
                "idFirst": /^[A-Za-z\s]+$/,
                "idLast": /^[A-Za-z\s]+$/,
                //   "idPhone": /^[0-9]{10}$/,
                //     "idPhone": /^[A-Za-z0-9]{15}$/,
                "idEmailAddress": /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                "idEmpName": /^[A-Za-z\s]+$/,
                "idFirstOther": /^[A-Za-z\s]+$/,
                "idLastOther": /^[A-Za-z\s]+$/,
                "idempjobTitle": /^[A-Za-z\s]+$/,
                //    "idPhoneOther": /^[0-9]{10}$/,
                //    "idPhoneOther": /^[a-z0-9]{15}$/,
                "idEmailOther": /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                "idJobTitle": /^[A-Za-z\s]+$/,
                "idEmpTitle": /^[A-Za-z\s]+$/
            };

            var regex = validationRules[fieldId];

            if (!value) {
                inputField.setValueState("Error");
                inputField.setValueStateText("This field is required.");
            } else if (regex && !regex.test(value)) {
                inputField.setValueState("Error");
                inputField.setValueStateText("Invalid input.");
            } else {
                inputField.setValueState("None");
                this.getView().byId("btnNextm").setVisible(true);
            }

            var fieldKey = Object.keys(validationRules).find((key) => key === fieldId);
            if (fieldKey) {
                oModel.setProperty("/" + fieldKey.replace("id", "").toLowerCase(), value);
            }
        },
        onLiveChangeSubscribers: function (oEvent) {
            var inputField = oEvent.getSource();
            var value = inputField.getValue().trim();
            var fieldId = inputField.getId().split("--").pop(); // Get local ID
            var oModel = this.getView().getModel("wizardModel");
            var today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for today's date comparison

            // Validation Rules
            var validationRules = {
                "idFirstSub": { regex: /^[A-Za-z\s]+$/, maxLength: 100, errorText: "Only alphabets allowed, max 100 chars." },
                "idLastSub": { regex: /^[A-Za-z\s]+$/, maxLength: 100, errorText: "Only alphabets allowed, max 100 chars." },
                //   "idPhoneSub": { regex: /^[0-9]{10}$/, maxLength: 12, errorText: "Phone must be exactly 10 digits." },
                "idEmailSub": { regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, maxLength: 150, errorText: "Invalid email format, max 150 chars." },
                "idJobTitleSub": { regex: /^[A-Za-z\s]+$/, maxLength: 150, errorText: "Only alphabets allowed, max 150 chars." }
            };
            var fieldValidation = validationRules[fieldId];

            // Check if the field value is empty or invalid
            if (!value) {
                inputField.setValueState("Error");
                inputField.setValueStateText("This field is required.");
            } else if (fieldValidation && (value.length > fieldValidation.maxLength || !fieldValidation.regex.test(value))) {
                inputField.setValueState("Error");
                inputField.setValueStateText(fieldValidation.errorText);
            } else if (fieldId === "idRequestEffDate") {
                // Date-specific validation (requestEffDate)
                var selectedDate = new Date(value);
                selectedDate.setHours(0, 0, 0, 0); // Reset time for date comparison

                if (!value) {
                    // Ensure the date is not empty
                    inputField.setValueState("Error");
                    inputField.setValueStateText("Effective Date is required.");
                } else if (selectedDate < today) {
                    // Check if the date is in the past
                    inputField.setValueState("Error");
                    inputField.setValueStateText("Effective Date cannot be in the past.");
                } else {
                    inputField.setValueState("None"); // No error if the date is valid
                }
            } else {
                inputField.setValueState("None"); // No error for other valid fields
            }

            var allValid = this.checkAllSubscribersValid(); // Check if all subscribers are valid
            // oModel.setProperty("/issubscribersSelected", allValid); // Update model property if necessary
        },

        checkAllSubscribersValid: function () {
            var oView = this.getView();
            var requiredFields = ["idFirstSub", "idLastSub", "idPhoneSub", "idEmailSub", "idJobTitleSub", "idRequestEffDate"];
            //       var requiredFields = ["idFirstSub", "idLastSub", "idEmailSub", "idJobTitleSub", "idRequestEffDate"];

            for (var i = 0; i < requiredFields.length; i++) {
                var field = oView.byId(requiredFields[i]);
                if (field && field.getValueState() === "Error") {
                    return false;
                }
            }
            return true;
        },





        isDuplicateEmail: function (subscribers, email, currentIndex) {
            return subscribers.some((sub, index) => index !== currentIndex && sub.email === email);
        },


        // Function to check duplicate emails

        onFieldSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            var oTable = this.byId("idTableAddOper");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                var aFilters = [];
                if (sQuery) {
                    var oFilter1 = new sap.ui.model.Filter("firstName", sap.ui.model.FilterOperator.Contains, sQuery);
                    var oFilter2 = new sap.ui.model.Filter("lastName", sap.ui.model.FilterOperator.Contains, sQuery);
                    var oFilter3 = new sap.ui.model.Filter("jobTitle", sap.ui.model.FilterOperator.Contains, sQuery);
                    var oFilter4 = new sap.ui.model.Filter("email", sap.ui.model.FilterOperator.Contains, sQuery);
                    var oFilter5 = new sap.ui.model.Filter("phone", sap.ui.model.FilterOperator.Contains, sQuery);

                    // Combine filters with OR condition
                    var oCombinedFilter = new sap.ui.model.Filter({
                        filters: [oFilter1, oFilter2, oFilter3, oFilter4, oFilter5],
                        and: false
                    });

                    aFilters.push(oCombinedFilter);
                }
                oBinding.filter(aFilters);
            }
        },




        // onAddItem: function () {
        //     var oViewModel = this.getView().getModel("wizardModel");
        //     var aSubscribers = oViewModel.getProperty("/subscribers") || [];
        //     var currentDate = "03/03/2025"

        //     // Create a new subscriber entry (excluding extra UI properties)
        //     var oNewSubscriber = {
        //         firstName: "",
        //         lastName: "",
        //         jobTitle: "",
        //         email: "",
        //         phone: "",
        //         requestEffDate: new Intl.DateTimeFormat('en-US').format(new Date()),
        //         valid: false
        //     };

        //     // Add UI-related properties but do NOT store them in the model
        //     var oNewSubscriberUI = Object.assign({}, oNewSubscriber, {
        //         isEditable: true,  // Editable fields for UI
        //         isNameEditable: true
        //     });

        //     // Add to array 
        //     aSubscribers.unshift(oNewSubscriberUI);

        //     // Update the model
        //     oViewModel.setProperty("/subscribers", aSubscribers);

        //     // Show Delete Button if more than one row
        //     var oDeleteButton = this.getView().byId("idDelteItem");
        //     if (oDeleteButton) {
        //         oDeleteButton.setVisible(aSubscribers.length > 1);
        //     }
        // },


        // onDeleteItem: function () {
        //     var oViewModel = this.getView().getModel("wizardModel");
        //     var aSubscribers = oViewModel.getProperty("/subscribers") || [];

        //     if (aSubscribers.length > 1) {
        //         // Remove the last added row
        //         aSubscribers.shift();
        //         oViewModel.setProperty("/subscribers", aSubscribers);
        //     }

        //     // Hide the Delete button if only one row remains
        //     var oDeleteButton = this.getView().byId("idDelteItem");
        //     if (oDeleteButton) {
        //         oDeleteButton.setVisible(aSubscribers.length > 1);
        //     }
        // },
        onAddItem: function () {
            var oViewModel = this.getView().getModel("wizardModel");
            var aSubscribers = oViewModel.getProperty("/subscribers") || [];

            // Create a new subscriber entry
            var oNewSubscriber = {
                firstName: "",
                lastName: "",
                jobTitle: "",
                email: "",
                phone: "",
                requestEffDate: new Intl.DateTimeFormat('en-US', { dateStyle: "medium" }).format(new Date()),
                valid: false,
                isEditable: true,
                isNameEditable: true
            };

            // Add to the top of the list
            aSubscribers.unshift(oNewSubscriber);

            // Update the model
            oViewModel.setProperty("/subscribers", aSubscribers);

            // Optional: force refresh in case UI doesn't update instantly
            oViewModel.refresh(true);
        },
        onDeleteSubscriber: function (oEvent) {
            var oViewModel = this.getView().getModel("wizardModel");
            var oSource = oEvent.getSource();
            var oItem = oSource.getParent(); // ColumnListItem
            var oContext = oItem.getBindingContext("wizardModel");
            var sPath = oContext.getPath(); // e.g., "/subscribers/0"
            var iIndex = parseInt(sPath.split("/").pop());

            var aSubscribers = oViewModel.getProperty("/subscribers") || [];

            // Don't allow deletion if only one row
            if (aSubscribers.length <= 1) {
                MessageToast.show("At least one subscriber is required.");
                return;
            }

            // Remove the selected row
            aSubscribers.splice(iIndex, 1);
            oViewModel.setProperty("/subscribers", aSubscribers);
        },
        onRequestDateChange: function (oEvent) {
            var oDatePicker = oEvent.getSource();

            // Get today's date with time set to 00:00:00
            var today = new Date();
            today.setHours(0, 0, 0, 0);

            // Set minDate to today
            oDatePicker.setMinDate(today);

            // Optional: Validate user input (if they typed a date manually)
            var selectedDate = oDatePicker.getDateValue(); // returns Date object

            if (selectedDate && selectedDate < today) {
                sap.m.MessageToast.show("You cannot select a past date.");
                oDatePicker.setDateValue(today);
            }
        },

        onSubscriberSelection: function (oEvent) {
            var oViewModel = this.getView().getModel("wizardModel");

            // Check if any subscriber is selected
            var aSelectedItems = oEvent.getSource().getSelectedItems();
            var bIsItemSelected = aSelectedItems.length > 0;

            // Update model property to enable/disable Next button
            oViewModel.setProperty("/issubscribersSelected", bIsItemSelected);

            // If user enters first name and last name, disable them
            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("wizardModel");
                var oData = oContext.getObject();

                if (oData.firstName && oData.lastName) {
                    oData.isNameEditable = false;
                }
            });

            oViewModel.refresh(true); // Ensure UI updates
        },

        handleNextButton: function () {
            var oViewModel = this.getView().getModel("wizardModel");

            // Find all checkboxes in the view
            var aCheckBoxes = this.getView().findAggregatedObjects(true, function (oControl) {
                return oControl.isA("sap.m.CheckBox");
            });

            // Check if at least one checkbox is selected
            var bAnyChecked = aCheckBoxes.some(function (oCheckBox) {
                return oCheckBox.getSelected();
            });

            // Update the model property to enable/disable Next button
            oViewModel.setProperty("/isStep2Valid", bAnyChecked);
        },

        isAnyCheckboxSelected: function () {
            var oView = this.getView();

            // Find all checkboxes in the view
            var aCheckBoxes = oView.findAggregatedObjects(true, function (oControl) {
                return oControl.isA("sap.m.CheckBox");
            });

            // Check if at least one checkbox is selected
            return aCheckBoxes.some(function (oCheckBox) {
                return oCheckBox.getSelected();
            });
        },
        onNavigateToTopHeader: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("TargetTopHeader", { TopHeader: "default" });
        },


        handleNextButtonAR: function (oEvent) {
            var oViewModel = this.getView().getModel("wizardModel");
            var selectedValues = oViewModel.getProperty("/accessType") || [];

            var oCheckBox = oEvent.getSource();
            var sText = oCheckBox.getText(); // Get checkbox text
            var bSelected = oCheckBox.getSelected(); // Check if selected

            if (bSelected) {
                if (!selectedValues.includes(sText)) {
                    selectedValues.push(sText); // Add to array if not present
                }
            } else {
                selectedValues = selectedValues.filter(item => item !== sText); // Remove if unchecked
            }

            oViewModel.setProperty("/accessType", selectedValues);
            console.log("Selected Access Types:", selectedValues); // Debugging
        },
        handleGoToAccessRights: function (oEvent) {
            // ❌ Disable visibility of submit button
            this.getView().byId("_IDGenButton3").setVisible(false);
            oReviewMove = 'X';
            this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(4);
            this.getView().byId('idCreateProductWizard').goToStep(this.getView().byId("PricingStep"), true);
        },
        handleGoToSubscriber: function (oEvent) {
            // ❌ Disable visibility of submit button
            this.getView().byId("_IDGenButton3").setVisible(false);
            oReviewMove = 'X';
            this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(3);
            this.getView().byId('idCreateProductWizard').goToStep(this.getView().byId("idSubscriberInfo"), true);
        },
        handleGoToCompanyInfo: function (oEvent) {
            // ❌ Disable visibility of submit button
            this.getView().byId("_IDGenButton3").setVisible(false);
            oReviewMove = 'X';
            this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(2);
            this.getView().byId('idCreateProductWizard').goToStep(this.getView().byId("idCompanyInfo"), true);
        },
        handleGoToAccessType: function (oEvent) {
            // ❌ Disable visibility of submit button
            this.getView().byId("_IDGenButton3").setVisible(false);
            oReviewMove = 'X';
            this.getView().byId('idCreateProductWizard').mAggregations._progressNavigator._moveToStep(1);
            this.getView().byId('idCreateProductWizard').goToStep(this.getView().byId("idAccessType"), true);
        },
        handleNextButton: function (oEvent) {
            this//this.getView().byId("_IDGenButton5").setEnabled(true);
        },


        onPressNavToDetail: function (oEvent) {
            var oSelectedItem = oEvent ? oEvent.getSource() : null;
            var oWizardModel = this.getView().getModel("wizardModel");
            var oSubscribers = oWizardModel.getProperty("/subscribers");
            var allUsersAccessRights = oWizardModel.getProperty("/allAcessRights");

            var oUser = null;

            // Determine selected user
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext("wizardModel");
                if (oContext) {
                    oUser = oContext.getObject();
                }
            }

            // If no user is selected, default to the first user in the subscribers list
            if (!oUser && Array.isArray(oSubscribers) && oSubscribers.length > 0) {
                oUser = oSubscribers[0];
            }

            if (oSubscribers.length > 1) {
                oWizardModel.setProperty("/alluserAccess", true);
            }

            if (oUser) {
                this.selectedUser = oUser;

                var sPageId = "detailPage_" + Math.floor(Math.random() * 100000); // Generate a unique page ID
                var oSplitApp = this.byId("SplitAppDemo");

                var aPanels = [];
                // Your code here 4th drop
                if (this.getView().getModel("wizardModel").getData().requestType === "Terminate All Access") {
                    var aTerminateUserInfo = this.getView().getModel("wizardModel").getData().subscribers;
                    var users = [];
                    users = aTerminateUserInfo;
                    this.getView().getModel("AccessModel").setProperty("/users", users);
                    var aContent = []; // Array to hold checkboxes with breaks
                    //                    forEach(function (accessRight, index) {
                    aContent.push(
                        new sap.m.Title({
                            text: "Effective " + oTodayDate + " remove all access from the existing user."
                        })
                    );
                    //                   }.bind(this));

                    var oPanel = new sap.m.Panel({
                        //                        headerText: category.categoryName,
                        expandable: false,
                        content: aContent
                    });

                    aPanels.push(oPanel);


                } else if (this.getView().getModel("wizardModel").getData().requestType === "Terminate All Access and Terminate Employment Relationship with Company") {
                    var aTerminateUserInfo = this.getView().getModel("wizardModel").getData().subscribers;
                    var users = [];
                    users = aTerminateUserInfo;
                    this.getView().getModel("AccessModel").setProperty("/users", users);
                    var aContent = []; // Array to hold checkboxes with breaks
                    //                    forEach(function (accessRight, index) {
                    aContent.push(
                        new sap.m.Title({
                            text: "Effective " + oTodayDate + " remove all access rights and termination from the existing user."
                        })
                    );
                    //                   }.bind(this));

                    var oPanel = new sap.m.Panel({
                        //                        headerText: category.categoryName,
                        expandable: false,
                        content: aContent
                    });

                    aPanels.push(oPanel);


                } else {
                    // Your code here
                    // Loop through categories and create dynamic panels
                    Object.keys(allUsersAccessRights).forEach(function (categoryID) {
                        var category = allUsersAccessRights[categoryID];

                        var aContent = []; // Array to hold checkboxes with breaks
                        // Get Select User Access Rights
                        var cselectuserdet = this.getView().getModel('AccessModel').getProperty("/users").find(user => user.firstName === this.selectedUser.firstName && user.lastName === this.selectedUser.lastName);
                        var cCategorypr = cselectuserdet ? cselectuserdet.accessRights[category.categoryName] : undefined;
                        category.accessRights.forEach(function (accessRight, index) {
                            // Selected Checking
                            var cselected = false;
                            if (cCategorypr && cCategorypr.rights) {
                                cselected = cCategorypr.rights.find(item => item.accessTypeID === accessRight.accessTypeID) ? true : false;
                            }

                            aContent.push(
                                new sap.m.CheckBox({
                                    text: accessRight.rightName,
                                    select: this.onAccessRightChange.bind(this, category.categoryID, category.categoryName, accessRight.accessTypeID, accessRight.rightName),
                                    selected: cselected
                                })
                            );

                            // Add break line after each checkbox except the last one
                            if (index !== category.accessRights.length - 1) {
                                aContent.push(new sap.ui.core.HTML({ content: "<br>" }));
                            }
                        }.bind(this));

                        var oPanel = new sap.m.Panel({
                            headerText: category.categoryName,
                            expandable: false,
                            content: aContent
                        });

                        aPanels.push(oPanel);
                    }.bind(this));
                };
                // Create a new detail page for the user
                var oNewPage = new sap.m.Page(sPageId, {
                    title: "Access Rights for " + oUser.firstName + " " + oUser.lastName,
                    content: aPanels
                });
                oSplitApp.addDetailPage(oNewPage);
                oSplitApp.toDetail(sPageId);
            } else {
                console.error("No valid user found in subscribers list.");
            }
        },

        onAccessRightChange: function (sCategoryID, sCategory, sAccessRightID, sAccessRightName, oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            var oModel = this.getView().getModel("AccessModel");
            var oWizardModel = this.getView().getModel("wizardModel");

            if (!this.selectedUser) {
                console.error("❌ No user selected.");
                return;
            }

            var aUsers = oModel.getProperty("/users") || [];

            // ✅ Find or create the user
            var user = aUsers.find(u => u.firstName === this.selectedUser.firstName && u.lastName === this.selectedUser.lastName);
            if (!user) {
                user = {
                    firstName: this.selectedUser.firstName,
                    lastName: this.selectedUser.lastName,
                    categoryID: sCategoryID,  // ✅ Store categoryID
                    accessRights: {}
                };
                aUsers.push(user);
            }

            // ✅ Ensure category exists in user data
            if (!user.accessRights[sCategory]) {
                user.accessRights[sCategory] = {
                    categoryID: sCategoryID,  // ✅ Store categoryID inside category
                    rights: []
                };
            }

            // ✅ Format right entry as { accessTypeID, rightName }
            var oRight = { accessTypeID: sAccessRightID, rightName: sAccessRightName };

            // ✅ Add or remove access right dynamically
            if (bSelected) {
                if (!user.accessRights[sCategory].rights.some(r => r.accessTypeID === sAccessRightID)) {
                    user.accessRights[sCategory].rights.push(oRight);
                }
            } else {
                user.accessRights[sCategory].rights = user.accessRights[sCategory].rights.filter(r => r.accessTypeID !== sAccessRightID);
            }

            // ✅ Update models with modified access rights
            oModel.setProperty("/users", aUsers);
            oWizardModel.setProperty("/selectedUser", user);

            // ✅ Dynamically update access panels in the UI
            this.updateAccessPanels();
        },


        onUserSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("AccessModel");
            var oModel = this.getView().getModel("AccessModel");

            // ✅ Set the selected user correctly
            this.selectedUser = oContext.getObject();
            //       if (this.getView().getModel("wizardModel").getData().requestType !== "Terminate All Access") {
            if (this.selectedUser) {
                this.updateAccessPanels();

                // ✅ Highlight selected user in list
                var oList = this.getView().byId("userList");
                oList.setSelectedItem(oItem, true);

                // ✅ Navigate to detail page
                this.getView().byId("SplitApp").toDetail(this.getView().byId("detailPage"));
            } else {
                console.warn("⚠️ No user selected.");
            }
            //    }
        },


        updateAccessPanels: function () {
            var oVBox = this.getView().byId("accessVBox");
            oVBox.removeAllItems(); // ✅ Clear previous content

            if (!this.selectedUser) {
                console.warn("⚠️ No user selected.");
                return;
            }

            // ✅ Dynamically create access panels based on user data
            var oAccessPanels = this.createAccessPanels(this.selectedUser);
            oVBox.addItem(oAccessPanels);
        },

        createAccessPanels: function (oUser) {
            var aPanels = [];
            // yourcode for 4th dropdown
            if (this.getView().getModel("wizardModel").getData().requestType === "Terminate All Access") {

                var aTerminateUserInfo = this.getView().getModel("wizardModel").getData().subscribers;
                var users = [];
                users = aTerminateUserInfo;
                this.getView().getModel("AccessModel").setProperty("/users", users);
                var aContent = []; // Array to hold checkboxes with breaks
                //                    forEach(function (accessRight, index) {
                aContent.push(
                    new sap.m.Title({
                        text: "Effective " + oTodayDate + " remove all access from the existing user."
                    })
                );
                //                   }.bind(this));

                var oPanel = new sap.m.Panel({
                    //                        headerText: category.categoryName,
                    expandable: false,
                    content: aContent
                });

                aPanels.push(oPanel);


            } else if (this.getView().getModel("wizardModel").getData().requestType === "Terminate All Access and Terminate Employment Relationship with Company") {

                var aContent = []; // Array to hold checkboxes with breaks
                //                    forEach(function (accessRight, index) {
                aContent.push(
                    new sap.m.Title({
                        text: "Effective " + oTodayDate + " remove all access rights and termination from the existing user."
                    })
                );
                //                   }.bind(this));

                var oPanel = new sap.m.Panel({
                    //                        headerText: category.categoryName,
                    expandable: false,
                    content: aContent
                });

                aPanels.push(oPanel);


            } else {
                Object.keys(oUser.accessRights || {}).forEach(function (sCategory) {
                    var category = oUser.accessRights[sCategory];

                    if (category.rights.length > 0) {
                        var oAccessPanel = new sap.m.Panel({
                            headerText: sCategory,
                            expandable: false
                        });

                        var oList = new sap.m.List();
                        category.rights.forEach(function (oAccessItem) {
                            oList.addItem(new sap.m.StandardListItem({
                                title: oAccessItem.rightName,
                            }));
                        });

                        oAccessPanel.addContent(oList);
                        aPanels.push(oAccessPanel);
                    }
                });
            }
            return new sap.m.VBox({ items: aPanels });
        },

        giveAccessRight: function () {
            var oWizardModel = this.getView().getModel("wizardModel");
            var oAccessModel = this.getView().getModel("AccessModel");

            // ✅ Get all users with access rights
            var aUsers = oAccessModel.getProperty("/users") || [];
            if (!Array.isArray(aUsers) || aUsers.length === 0) {
                console.error("❌ No users with access rights found.");
                return;
            }

            // ✅ Use first user in `aUsers` as the reference
            var aUser = aUsers[0];
            if (!aUser || !aUser.accessRights) {
                console.error("❌ No reference user with valid access rights found in AccessModel.");
                return;
            }

            console.log("🔹 Reference User (Roles Source):", aUser);

            // ✅ Get all subscribers from wizard model
            var aSubscribers = oWizardModel.getProperty("/subscribers") || [];

            // ✅ Assign access rights (including right IDs & categoryID) from first user to all other users
            aSubscribers.forEach(function (subscriber) {
                var user = aUsers.find(u => u.firstName === subscriber.firstName && u.lastName === subscriber.lastName);

                // ✅ If user doesn't exist, create a new entry
                if (!user) {
                    user = {
                        firstName: subscriber.firstName,
                        lastName: subscriber.lastName,
                        categoryID: subscriber.categoryID, // ✅ Ensure categoryID is assigned
                        accessRights: {}
                    };
                    aUsers.push(user);
                }

                // ✅ Copy access rights (including right IDs & categoryID) from the reference user
                user.accessRights = JSON.parse(JSON.stringify(aUser.accessRights));

                // ✅ Ensure categoryID is stored in each category
                Object.keys(user.accessRights).forEach(category => {
                    user.accessRights[category].categoryID = aUser.accessRights[category].categoryID;
                });
            });

            console.log("✅ Updated Users List:", JSON.parse(JSON.stringify(aUsers)));

            // ✅ Update AccessModel
            oAccessModel.setProperty("/users", aUsers);
            sap.m.MessageToast.show("✅ Roles (including Right IDs & Category ID) copied from the first user to all users!");
        },


        onSubmit: function () {
            var oViewModel = this.getView().getModel("wizardModel");
            var oAccessModel = this.getView().getModel("AccessModel");
            var oDataModel = this.getOwnerComponent().getModel();

            // Fetch basic form values
            var payload = {
                firstName: this.byId("idFirst").getValue(),
                lastName: this.byId("idLast").getValue(),
                phoneNumber: this.byId("idPhone").getValue(),
                emailID: this.byId("idEmailAddress").getValue(),
                empName: this.byId("idEmpName").getValue().trim(),
                empAddress: this.byId("idEmpAdd").getValue().trim(),
                authorizedSignatory: this.byId("idAuthSign").getSelectedKey(),
                requestType: this.byId("idTypeOfRequest").getSelectedKey(),
                subscribers: [],
                accessTypes: []
            };

            // Fetch subscribers and access users
            var aSubscribers = oViewModel.getProperty("/subscribers") || [];
            var aAccessUsers = oAccessModel.getProperty("/users") || [];

            if (aSubscribers.length === 0) {
                sap.m.MessageToast.show("At least one subscriber must be added.");
                return;
            }

            // ✅ Process subscribers, ensuring categoryID is included
            payload.subscribers = aSubscribers.map(subscriber => ({
                firstName: subscriber.firstName || "",
                lastName: subscriber.lastName || "",
                phone: subscriber.phone || "",
                email: subscriber.email || "",
                requestDate: subscriber.requestEffDate || ""
            }));

            // ✅ Process access rights grouped by category
            var accessTypesMap = {};

            aAccessUsers.forEach(user => {
                Object.keys(user.accessRights || {}).forEach(category => {
                    var categoryData = user.accessRights[category];

                    if (!accessTypesMap[categoryData.categoryID]) {
                        accessTypesMap[categoryData.categoryID] = {
                            categoryID: categoryData.categoryID,
                            categoryName: category,  // ✅ Use category name directly
                            rights: []
                        };
                    }

                    // ✅ Add rights with both rightID and rightName
                    categoryData.rights.forEach(right => {
                        accessTypesMap[categoryData.categoryID].rights.push({
                            rightID: right.accessTypeID,
                            rightName: right.rightName
                        });
                    });
                });
            });

            // ✅ Convert accessTypesMap to expected payload format
            payload.accessTypes = Object.values(accessTypesMap);

            console.log("🚀 Final Payload:", JSON.parse(JSON.stringify(payload)));

            // ✅ Send data to the backend
            oDataModel.create("/submitRequest", payload, {
                success: function () {
                    debugger;
                    var messageText = `Thank you for submitting your request. This request has been <br>
                                                sent to ${payload.firstName} ${payload.lastName} who has been identified as the Authorized <br>
                                                 Signatory for approval purposes.` //"This is <b>bold</b> and this is normal."
                    new sap.m.Dialog({
                        title: "Request received",
                        type: "Message",
                        state: "Success",
                        class: "otermallaccess",
                        content: [
                            new sap.m.FormattedText({
                                htmlText: messageText
                            })
                        ],
                        endButton: new sap.m.Button({
                            text: "Close",
                            press: function (oEvent) {
                                oEvent.getSource().getParent().close();
                                location.reload();
                            }.bind(this)
                        })
                    }).open();



                    //                 sap.m.MessageBox.success(
                    // //                    `Request successfully submitted. This request has been sent to ${payload.empName} for approval.`,
                    // //idFirst , idLast
                    //                     `Thank you for submitting your request. This request has been \n
                    //                     sent to  \b ${payload.firstName} ${payload.lastName} \b who has been identified as the Authorized \n
                    //                     Signatory for approval purposes.`,
                    //                     {
                    //                         title:"Request recieved",
                    //                         onClose: function () {
                    //                             location.reload();
                    //                         }
                    //                     }
                    //                 );
                },
                error: function (oError) {
                    var sErrorMessage = "Error in submission. Please check the data.";
                    if (oError && oError.responseText) {
                        try {
                            var oResponse = JSON.parse(oError.responseText);
                            sErrorMessage = oResponse.error?.message?.value || sErrorMessage;
                        } catch (e) {
                            console.error("Error parsing backend response:", e);
                        }
                    }
                    sap.m.MessageToast.show(sErrorMessage);
                }
            });
        }
    });
});