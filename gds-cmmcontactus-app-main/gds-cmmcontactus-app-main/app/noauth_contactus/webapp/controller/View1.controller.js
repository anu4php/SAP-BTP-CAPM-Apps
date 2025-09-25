sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Messaging",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/message/MessageType",
    "sap/ui/core/message/Message",
    "sap/ui/dom/isBehindOtherElement",
    "sap/ui/core/Element"
], (Controller, MessageToast, Messaging, MessagePopover, MessageItem, MessageType, Message, isBehindOtherElement, Element) => {
    "use strict";

    return Controller.extend("noauthcontactus.controller.View1", {
        onInit() {
            this.loadRecaptcha();
            this._MessageManager = Messaging;
            // Clear the old messages
            this._MessageManager.removeAllMessages();
            this._MessageManager.registerObject(this.getView(), true);
            this.getView().setModel(this._MessageManager.getMessageModel(), "message");
            this.createMessagePopover();

            var oModel = new sap.ui.model.json.JSONModel({
                firstName: "",
                lastName: "",
                email: "",
                company: "",
                message: ""
            });

            this.getView().setModel(oModel);
            var that = this;
            var oActionODataContextBinding = this.getOwnerComponent().getModel("mainModel").bindContext("/getSiteKey(...)");
            oActionODataContextBinding.execute().then(function () {
                var oActionContext = oActionODataContextBinding.getBoundContext();
                that.recaptchaSiteKey = oActionContext.getObject().value;
            }).catch(function (oError) {
                console.error(oError);
            });

        },
        loadRecaptcha: function () {
            var that = this;

            if (typeof grecaptcha === "undefined") {

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
            setTimeout(() => {
                var recaptchaDiv = document.getElementById("recaptchaGoogle");
                if (recaptchaDiv && typeof window.grecaptcha !== "undefined") {
                    console.log("Rendering reCAPTCHA...");
                    window.grecaptcha.render("recaptchaGoogle", {
                        sitekey: this.recaptchaSiteKey,
                        callback: this.verifyCallback.bind(this),
                        'expired-callback': this.expiredCallback.bind(this) // Expiry callback
                    });
                } else {
                    console.error("reCAPTCHA div not found!");
                }
            }, 1000); // Delay ensures UI is ready
        },
        expiredCallback: function () {
            this.byId("idBtnSubmit").setEnabled(false);
            sap.m.MessageToast.show("verify captca again");
        },
        verifyCallback: function (response) {
            if (response) {
                this.byId("idBtnSubmit").setEnabled(true);
                this.captchaResponse = response;
            }
        },
        onEmailChange: function (oEvent) {
            let email = oEvent.getSource().getValue();
            let mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
            if (!mailregex.test(email)) {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                oEvent.getSource().setValueStateText("Please enter a valid email address.");
            }
            else {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
            }
        },
        onChangeInput: function (oEvent) {
            let value = oEvent.getSource().getValue();
            if (value) {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
            }
        },
        onCountryCodeChange: function (oEvent) {
            let countryCode = oEvent.getSource().getSelectedKey();
            if (countryCode == "01") {
                this.byId("idPhone").setMaxLength(20);
            }
            else {
                this.byId("idPhone").setMaxLength(12);
            }
        },
        onLiveChangePhone: function (oEvent) {
            let numberPart = oEvent.getParameter("value").replace(/\D/g, '');

            if (numberPart.length > 10) {
                numberPart = numberPart.replace(/(\d{3})(\d{3})(\d{4})(\d+)/, "$1-$2-$3-$4");
            }
            else if (numberPart.length > 6) {
                numberPart = numberPart.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
            } else if (numberPart.length > 3) {
                numberPart = numberPart.replace(/(\d{3})(\d+)/, "$1-$2");
            }

            this.byId("idPhone").setValue(numberPart);
        },

        onSubmitPress: function () {
            var oFirstName = this.byId("idFirstName");
            var oLastName = this.byId("idLastName");
            var oCompany = this.byId("idCompany");
            var oEmail = this.byId("idEmail");
            var oInquiry = this.byId("idInquiry");
            var oMessage = this.byId("idMessage");
            var oPhone = this.byId("idPhone");

            let isValid = true;
            let cnt = 0;
            this._MessageManager.removeAllMessages();
            this._oMessagePopover.close();

            if (!oFirstName.getValue()) {
                oFirstName.setValueState("Error");
                oFirstName.setValueStateText("Please enter First Name");
                isValid = false;
                cnt++;

                this.handleAddMessage("This field is required", "First Name", "/firstName", "Please enter First Name");
            }
            else {
                oFirstName.setValueState("None");
            }

            if (!oLastName.getValue()) {
                oLastName.setValueState("Error");
                oLastName.setValueStateText("Please enter Last Name");
                isValid = false;
                cnt++;

                this.handleAddMessage("This field is required", "Last Name", "/lastName", "Please enter Last Name");

            }
            else {
                oLastName.setValueState("None");
            }

            if (!oCompany.getValue()) {
                oCompany.setValueState("Error");
                oCompany.setValueStateText("Please enter Company");
                isValid = false;
                cnt++;

                this.handleAddMessage("This field is required", "Company", "/company", "Please enter Company");
            }
            else {
                oCompany.setValueState("None");
            }

            if (!oEmail.getValue()) {
                oEmail.setValueState("Error");
                oEmail.setValueStateText("Please enter Email address");
                isValid = false;
                cnt++;


                this.handleAddMessage("This field is required", "Email address", "/email", "Please enter Email address");
            }
            else if (oEmail.getValueState() == "Error") {
                isValid = false;
                cnt++;

                this.handleAddMessage("Invalid email format", "Email address", "/email", "Please enter a valid Email address");
            }
            else {
                oEmail.setValueState("None");
            }

            if (!oInquiry.getSelectedKey()) {
                oInquiry.setValueState("Error");
                oInquiry.setValueStateText("Please select an inquiry type");
                isValid = false;
                cnt++;

                this.handleAddMessage("This field is required", "Inquiry", "/inquiry", "Please select an inquiry type");

            } else {
                oInquiry.setValueState("None");
            }

            if (!oMessage.getValue()) {
                oMessage.setValueState("Error");
                oMessage.setValueStateText("Please enter a Message");
                isValid = false;
                cnt++;

                this.handleAddMessage("This field is required", "Message", "/message", "Please enter a Message");

            } else {
                oMessage.setValueState("None");
            }

            if (!isValid) {
                this.byId("idMsgPopBtn").setVisible(true);
                this.byId("idMsgPopBtn").setText(cnt);
                setTimeout(function () {
                    this._oMessagePopover.openBy(this.byId("idMsgPopBtn"));
                }.bind(this), 100);

                return;
            }

            let oModel = this.getView().getModel("mainModel");
            oModel.changeHttpHeaders({
                "reCaptchaToken": this.captchaResponse
            });

            //let oBindList = oModel.bindList("/nonUserInquiry");
            let oBindList = oModel.bindList("/nonUserInquiry", null, null, null, {
                $$updateGroupId: "$direct"
            });
            var that = this;
            oBindList.attachCreateSent(() => { that.getView().setBusy(true) });
            oBindList.attachCreateCompleted(() => { that.getView().setBusy(false) });

            let payload = {
                firstName: oFirstName.getValue(),
                lastName: oLastName.getValue(),
                companyName: oCompany.getValue(),
                CountryCode: this.byId("idCountryCode").getSelectedKey(),
                MobileNo: this.byId("idPhone").getValue(),
                emailID: oEmail.getValue(),
                InquiryType_InquiryType: oInquiry.getSelectedKey(),
                message: oMessage.getValue()
            };

            oBindList.create(payload, true).created().then(() => {
                MessageToast.show("Your inquiry has been successfully submitted.");
                oFirstName.setValue("");
                oPhone.setValue("");
                oLastName.setValue("");
                oCompany.setValue("");
                oEmail.setValue("");
                oMessage.setValue("");
                that.byId("idMsgPopBtn").setVisible(false);
            }).catch((err) => {
                MessageToast.show("Submission failed: " + err.message);
            });
        },
        handleMessagePopoverPress: function (oEvent) {
            if (!this._oMessagePopover) {
                this.createMessagePopover();
            }
            this._oMessagePopover.toggle(oEvent.getSource());
        },
        createMessagePopover: function () {
            this._oMessagePopover = new MessagePopover({
                activeTitlePress: function (oEvent) {
                    var oItem = oEvent.getParameter('item'),
                        oMessage = oItem.getBindingContext('message').getObject(),
                        oControl = Element.registry.get(oMessage.getControlId());

                    if (oControl) {
                        if (oControl.isFocusable())
                            oControl.focus();
                    }
                },
                items: {
                    path: "message>/",
                    template: new MessageItem({
                        title: "{message>message}",
                        subtitle: "{message>additionalText}",
                        activeTitle: true,
                        type: "{message>type}",
                        description: "{message>description}",
                    })
                }
            });
            this.getView().byId("idMsgPopBtn").addDependent(this._oMessagePopover);
        },
        handleAddMessage: function (msg, addTxt, tar, desc) {
            this._MessageManager.addMessages(new Message({
                message: msg,
                additionalText: addTxt,
                target: tar,
                description: desc,
                type: MessageType.Error,
                processor: this.getView().getModel()
            }));
        },
    });
});