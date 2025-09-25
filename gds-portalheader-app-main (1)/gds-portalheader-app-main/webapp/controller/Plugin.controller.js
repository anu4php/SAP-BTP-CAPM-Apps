sap.ui.define([
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/ushell/Container",
    "sap/ui/model/json/JSONModel",
    "sap/m/Text",
    "sap/ui/core/Icon",
    "sap/m/Dialog",
    "sap/m/FlexBox",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Title",
    "sap/m/Link",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/TextArea",
    "sap/ui/core/Item",
    "sap/ui/Device",
    "sap/ui/core/Messaging",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/message/MessageType",
    "sap/ui/core/message/Message",
    "sap/ui/core/Element",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (
    Button, MessageToast, Container, JSONModel, Text, Icon, Dialog, FlexBox, VBox, HBox, Title, Link, Label, Input, Select,
    TextArea, Item, Device, Messaging, MessagePopover, MessageItem, MessageType, Message, Element, Filter, FilterOperator
) {
    "use strict";

    return {
        runCode: async function () {

            //const FrameBoundExtension = await Container.getServiceAsync("FrameBoundExtension");
            var oRenderer = sap.ushell.Container.getRenderer("fiori2");

            var oAddActionButtonProperties = {
                controlType: "sap.m.Button",
                oControlProperties: {
                    id: "UserSettings",
                    text: "User Settings",
                    icon: "sap-icon://refresh",
                    press: function () {
                        alert("User Settings was pressed!");
                    }
                },
                bIsVisible: true,
                bCurrentState: true
            };
            oRenderer.addUserAction(oAddActionButtonProperties);

            var data = {
                selectedCompanyName: "",
                selectedCompanyId: "",
                Companies: [],
                filteredCompanies: [],
                InquiryTypes: [],
                userEmail: "",
                message: ""
            }
            var contactBP;
            let oModel = new JSONModel(data);
            let oDataModel = this.getModel("mainModel");

            var userId;

            Container.getServiceAsync("UserInfo").then(function (oUserInfo) {
                userId = oUserInfo.getEmail();
                oModel.setProperty("/userEmail", oUserInfo.getEmail());
                //console.log(oUserInfo.getEmail());

                //   Get Contact BP - ContactBP
                let userFilter = new Filter("emailID", FilterOperator.EQ, userId);
                let oBindUser = oDataModel.bindList("/Users", undefined, undefined, userFilter);
                oBindUser.requestContexts().then(function (aUserContexts) {
                    if (aUserContexts.length > 0) {
                        contactBP = aUserContexts[0].getObject().ContactBP;
                        let aFilter = new Filter("ContactBP_ContactBP", FilterOperator.EQ, contactBP);
                        let oBindList = oDataModel.bindList("/UserCompanies", undefined, undefined, aFilter, { $expand: "ContactBP,CompanyBP" });
                        var aCompanies = [];
                        oBindList.requestContexts().then(function (aContexts) {
                            aContexts.forEach(oContext => {
                                if (oContext.getObject().CompanyBP && oContext.getObject().CompanyBP.Name) {
                                    aCompanies.push({ name: oContext.getObject().CompanyBP.Name, Id: oContext.getObject().CompanyBP_BusinessPartnerID });

                                    if (oContext.getObject().SelectionIndicator) {
                                        oModel.setProperty("/selectedCompanyName", oContext.getObject().CompanyBP.Name);
                                        oModel.setProperty("/selectedCompanyId", oContext.getObject().CompanyBP_BusinessPartnerID);
                                    }
                                }
                            });
                            oModel.setProperty("/Companies", aCompanies);
                            oModel.setProperty("/filteredCompanies", aCompanies);
                            //SubHeader.showOnHome();
                            oRenderer.addShellSubHeader(oAddSubHeaderProperties);
                        }).catch(function (error) {
                            console.error("Error fetching user companies:", error);
                        });
                    }
                });
            });

            //userId = "58ee9925-22c3-4725-b2a9-b9e8e7b09cb2";


            /*
            const SubHeader = await FrameBoundExtension.createSubHeader({
                id: "subheader1",
                contentLeft: [
                    new Icon({
                        src: "sap-icon://building"
                    }),
                    new Text({
                        id: "subheaderCompanyText",
                        text: "{/selectedCompanyName}"
                    }).setModel(oModel),
                    new Button({
                        text: "Change",
                        icon: "sap-icon://synchronize",
                        press: () => {
                            oModel.setProperty("/filteredCompanies", oModel.getProperty("/Companies"));
                            const oSearchField = new sap.m.SearchField({
                                placeholder: "Search company",
                                change: function (oEvent) {
                                    let allCompanies = oModel.getProperty("/Companies");
                                    if (oEvent.getParameter("value")) {
                                        let query = oEvent.getParameter("value").toLowerCase();
                                        let filteredCompanies = allCompanies.filter(company =>
                                            company.name.toLowerCase().includes(query)
                                        );
                                        oModel.setProperty("/filteredCompanies", filteredCompanies);
                                    }
                                    else {
                                        oModel.setProperty("/filteredCompanies", allCompanies);
                                    }

                                }
                            });

                            const oCompanyList = new sap.m.List({
                                items: {
                                    path: "/filteredCompanies",
                                    template: new sap.m.StandardListItem({
                                        title: "{name}",
                                        type: "Active",
                                        press: function (oEvent) {
                                            const selectedCompanyName = oEvent.getSource().getTitle();
                                            const companyId = oEvent.getSource().getBindingContext().getObject().Id;

                                            let oFilterUser = new Filter("User_ID", FilterOperator.EQ, userId);
                                            let oFilterCompnay = new Filter("Company_ID", FilterOperator.EQ, companyId);
                                            let aFilter = [oFilterUser, oFilterCompnay];
                                            let oBindList = oDataModel.bindList("/UserCompanies");

                                            oBindList.filter(aFilter).requestContexts().then(function (aContexts) {
                                                aContexts[0].setProperty("SelectionIndicator", true);
                                                oModel.setProperty("/selectedCompanyName", selectedCompanyName);
                                            }).catch(function (error) {
                                                console.error("Error in updating selected company:", error);
                                            });


                                            oDialog.close();
                                        }
                                    })
                                }
                            }).setModel(oModel);

                            const oDialog = new sap.m.Dialog({
                                title: "Change Company",
                                content: [oSearchField, oCompanyList],
                                beginButton: new sap.m.Button({
                                    text: "Close",
                                    press: function () {
                                        oDialog.close();
                                    }
                                }),
                                afterClose: function () {
                                    oDialog.destroy();
                                }
                            });

                            oDialog.setModel(oModel);
                            oDialog.open();
                        }
                    })
                ]
            }, {
                controlType: "sap.m.Bar"
            });
            */

            var oAddSubHeaderProperties = {
                controlType: "sap.m.Bar",
                oControlProperties: {
                    id: "subheader1",
                    contentLeft: [
                        new Icon({
                            src: "sap-icon://building"
                        }),
                        new Text({
                            id: "subheaderCompanyText",
                            text: "{/selectedCompanyName}"
                        }).setModel(oModel),
                        new Button({
                            text: "Change",
                            icon: "sap-icon://synchronize",
                            press: () => {
                                oModel.setProperty("/filteredCompanies", oModel.getProperty("/Companies"));
                                const oSearchField = new sap.m.SearchField({
                                    placeholder: "Search company",
                                    change: function (oEvent) {
                                        let allCompanies = oModel.getProperty("/Companies");
                                        if (oEvent.getParameter("value")) {
                                            let query = oEvent.getParameter("value").toLowerCase();
                                            let filteredCompanies = allCompanies.filter(company =>
                                                company.name.toLowerCase().includes(query)
                                            );
                                            oModel.setProperty("/filteredCompanies", filteredCompanies);
                                        }
                                        else {
                                            oModel.setProperty("/filteredCompanies", allCompanies);
                                        }

                                    }
                                });

                                const oCompanyList = new sap.m.List({
                                    items: {
                                        path: "/filteredCompanies",
                                        template: new sap.m.StandardListItem({
                                            title: "{name}",
                                            type: "Active",
                                            press: function (oEvent) {
                                                const nSelComName = oEvent.getSource().getTitle();
                                                const oSelContext = oEvent.getSource().getBindingContext().getObject();
                                                const nSelComId = oEvent.getSource().getBindingContext().getObject().Id;
                                                const pSelComId = oModel.getProperty("/selectedCompanyId");

                                                let oFilterUser = new Filter("ContactBP_ContactBP", FilterOperator.EQ, contactBP);
                                                //let oFilterCompnay = new Filter("Company_ID", FilterOperator.EQ, companyId);
                                                //let aFilter = [oFilterUser, oFilterCompnay];
                                                let oBindList = oDataModel.bindList("/UserCompanies");
                                                let oPromise1, oPromise2, aPromises = [];

                                                oBindList.filter(oFilterUser).requestContexts().then(function (aContexts) {
                                                    for (let i = 0; i < aContexts.length; i++) {
                                                        if (aContexts[i].getProperty("CompanyBP_BusinessPartnerID") === pSelComId) {
                                                            oPromise1 = aContexts[i].setProperty("SelectionIndicator", false);
                                                            aPromises.push(oPromise1);
                                                        }
                                                        if (aContexts[i].getProperty("CompanyBP_BusinessPartnerID") === nSelComId) {
                                                            oPromise2 = aContexts[i].setProperty("SelectionIndicator", true);
                                                            aPromises.push(oPromise2);
                                                        }
                                                    }
                                                    Promise.all(aPromises).then(function () {
                                                        oModel.setProperty("/selectedCompanyName", nSelComName);
                                                        oModel.setProperty("/selectedCompanyId", nSelComId);
                                                    })

                                                    //aContexts[0].setProperty("SelectionIndicator", true);
                                                    //window.location.reload();
                                                }).catch(function (error) {
                                                    console.error("Error in updating selected company:", error);
                                                });


                                                oDialog.close();

                                            }
                                        })
                                    }
                                }).setModel(oModel);

                                const oDialog = new sap.m.Dialog({
                                    title: "Change Company",
                                    content: [oSearchField, oCompanyList],
                                    beginButton: new sap.m.Button({
                                        text: "Close",
                                        press: function () {
                                            oDialog.close();
                                        }
                                    }),
                                    afterClose: function () {
                                        oDialog.destroy();
                                    }
                                });

                                oDialog.setModel(oModel);
                                oDialog.open();
                            }
                        })
                    ]
                },
                bIsVisible: true,
                bCurrentState: false
            };


            /*
            const HeaderItemContactUs = await FrameBoundExtension.createHeaderItem({
                id: "buttonContactUs",
                ariaLabel: "ariaLabel",
                ariaHaspopup: "dialog",
                icon: "sap-icon://discussion",
                tooltip: "Contact us",
                text: "Contact us",
                press: () => {

                    const oPhoneSection = new VBox({
                        width: Device.system.phone ? "95%" : "40%",
                        items: [
                            new HBox({
                                items: [
                                    new Icon({ src: "sap-icon://call" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Title({ text: "By Phone" })
                                ]
                            }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin"),
                            new Text({ text: "Enerline support:" }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin"),
                            new Link({ text: "519-436-5446", href: "tel:5194365446" }).addStyleClass("sapUiSmallMarginBegin"),
                            new Text({ text: "(Business Hours ET)" }).addStyleClass("sapUiSmallMarginBegin"),
                            new Text({ text: "Nominations Support:" }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin"),
                            new Link({ text: "519-436-4545", href: "tel:5194364545" }).addStyleClass("sapUiSmallMarginBegin"),
                            new Text({ text: "(Daily Support until 10.00 p.m. CT/11.00 p.m. ET)" }).addStyleClass("sapUiSmallMarginBegin")
                        ]
                    }).addStyleClass("sapUiSmallMargin greybg");

                    const oEmailInput = new Input({ value: "{/userEmail}" });
                    const oMessageArea = new TextArea({ width: "100%", rows: 4 });
                    const oInquirySelect = new Select({
                        width: "100%",
                        items: [
                            new Item({ key: "1", text: "General Inquiry" }),
                            new Item({ key: "2", text: "Support Request" })
                        ]
                    });
                    const oEmailSection = new VBox({
                        width: Device.system.phone ? "95%" : "60%",
                        items: [
                            new HBox({
                                items: [
                                    new Icon({ src: "sap-icon://email" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Title({ text: "By Email" })
                                ]
                            }).addStyleClass("sapUiSmallMarginTop"),
                            new Label({ text: "Email address:", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oEmailInput,
                            new Label({ text: "Inquiry:", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oInquirySelect,
                            
                            new Label({ text: "Message:", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oMessageArea
                        ]
                    }).addStyleClass("sapUiSmallMargin");

                    const oFlex = new FlexBox({
                        wrap: Device.system.phone ? "Wrap" : "NoWrap",
                        items: [oPhoneSection, oEmailSection]
                    });

                    const oDialog = new Dialog({
                        title: "Contact us",
                        stretch: false,
                        resizable: true,
                        draggable: true,
                        content: [oFlex],
                        beginButton: new Button({
                            text: "Submit",
                            type: "Emphasized",
                            press: function () {
                                let isValid = true;

                                if (!oEmailInput.getValue()) {
                                    oEmailInput.setValueState("Error");
                                    oEmailInput.setValueStateText("Email is required");
                                    isValid = false;
                                } else {
                                    oEmailInput.setValueState("None");
                                }

                                if (!oInquirySelect.getSelectedKey()) {
                                    oInquirySelect.setValueState("Error");
                                    oInquirySelect.setValueStateText("Please select an inquiry type");
                                    isValid = false;
                                } else {
                                    oInquirySelect.setValueState("None");
                                }

                                if (!oMessageArea.getValue()) {
                                    oMessageArea.setValueState("Error");
                                    oMessageArea.setValueStateText("Message cannot be empty");
                                    isValid = false;
                                } else {
                                    oMessageArea.setValueState("None");
                                }

                                if (!isValid) {
                                    return;
                                }

                                MessageToast.show("Submitted!");
                                oDialog.close();
                            }
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                oDialog.close();
                            }
                        })
                    });
                    oDialog.open();
                }
            }, {
                position: "end"
            });
            HeaderItemContactUs.showOnHome();

            */

            /*const HeaderItemBell = await FrameBoundExtension.createHeaderItem({
                id: "buttonNotificationBell",
                ariaLabel: "ariaLabel",
                ariaHaspopup: "dialog",
                icon: "sap-icon://bell",
                tooltip: "tooltip-end",
                text: "Notifications",
                press: () => {
                    MessageToast.show("Display Notifications popup");
                }
            }, {
                position: "end"
            });
            HeaderItemBell.showOnHome();*/


            let oBindList = oDataModel.bindList("/InquiryTypes", undefined, undefined, undefined);
            var aInquiryTypes = [];

            oBindList.requestContexts().then(function (aContexts) {// Process the contexts and update the model
                aContexts.forEach(context => {
                    aInquiryTypes.push({ name: context.getObject().InquiryName, Id: context.getObject().InquiryType });
                });
                oModel.setProperty("/InquiryTypes", aInquiryTypes);
            }).catch(function (error) {
                console.error("Error fetching Inquiry Types:", error);
            });


            oRenderer.addHeaderEndItem({
                id: "buttonContactUs",
                ariaLabel: "Contact us button",
                ariaHaspopup: "dialog",
                icon: "sap-icon://discussion",
                tooltip: "Contact Us",
                text: "Contact us",
                press: function () {

                    const oPhoneSection = new VBox({
                        width: Device.system.phone ? "95%" : "40%",
                        items: [
                            new HBox({
                                items: [
                                    new Icon({ src: "sap-icon://call" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Title({ text: "By Phone" })
                                ]
                            }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin"),
                            new Text({ text: "Enerline support:" }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin"),
                            new Link({ text: "519-436-5446", href: "tel:5194365446" }).addStyleClass("sapUiSmallMarginBegin"),
                            new Text({ text: "(Business Hours ET)" }).addStyleClass("sapUiSmallMarginBegin"),
                            new Text({ text: "Nominations Support:" }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin"),
                            new Link({ text: "519-436-4545", href: "tel:5194364545" }).addStyleClass("sapUiSmallMarginBegin"),
                            new Text({ text: "(Daily Support until 10.00 p.m. CT/11.00 p.m. ET)" }).addStyleClass("sapUiSmallMarginBegin")
                        ]
                    }).addStyleClass("sapUiSmallMargin greybg");

                    const oEmailInput = new Input({
                        value: "{/userEmail}", type: "Email", change: (oEvent) => {
                            let email = oEvent.getSource().getValue();
                            let mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
                            if (!mailregex.test(email)) {
                                oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                                oEvent.getSource().setValueStateText("Please enter a valid Email address");
                            }
                            else {
                                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    }).setModel(oModel);
                    const oMessageArea = new TextArea({ value: "{/message}", width: "100%", rows: 4 }).setModel(oModel);

                    const oInquirySelect = new Select({
                        width: "100%",
                        items: {
                            path: "/InquiryTypes",
                            template: new Item({
                                key: "{Id}",
                                text: "{name}"
                            })
                        }
                    }).setModel(oModel);

                    const oEmailSection = new VBox({
                        width: Device.system.phone ? "95%" : "60%",
                        items: [
                            new HBox({
                                items: [
                                    new Icon({ src: "sap-icon://email" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Title({ text: "By Email" })
                                ]
                            }).addStyleClass("sapUiSmallMarginTop"),
                            new Label({ text: "Email address:", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oEmailInput,
                            new Label({ text: "Inquiry:", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oInquirySelect,
                            new Label({ text: "Message:", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oMessageArea
                        ]
                    }).addStyleClass("sapUiSmallMargin");

                    const oFlex = new FlexBox({
                        wrap: Device.system.phone ? "Wrap" : "NoWrap",
                        direction: Device.system.phone ? "Column" : "Row",
                        items: [oPhoneSection, oEmailSection]
                    });

                    const oMessageButton = new Button({
                        icon: "sap-icon://error",
                        type: "Negative",
                        press: (oEvent) => {
                            if (!this._oMessagePopover) {
                                //this.createMessagePopover();
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
                                oMessageButton.addDependent(this._oMessagePopover);
                            }
                            this._oMessagePopover.toggle(oEvent.getSource());
                        }
                    }).setVisible(false);

                    const oCloseButton = new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            oDialog.close();
                        }
                    });

                    const oSubmitButton = new sap.m.Button({
                        text: "Submit",
                        type: "Emphasized",
                        press: () => {
                            let isValid = true;
                            let cnt = 0;
                            this._MessageManager.removeAllMessages();
                            this._oMessagePopover.close();

                            if (!oEmailInput.getValue()) {
                                oEmailInput.setValueState("Error");
                                //oEmailInput.setValueStateText("Please enter Email address");
                                isValid = false;
                                cnt++;

                                this._MessageManager.addMessages(new Message({
                                    message: "This field is required",
                                    type: MessageType.Error,
                                    additionalText: "Email address",
                                    target: "/userEmail",
                                    description: "Please enter Email address",
                                    processor: oModel
                                }));
                            }
                            else if (oEmailInput.getValueState() == "Error") {
                                isValid = false;
                                cnt++

                                this._MessageManager.addMessages(new Message({
                                    message: "Invalid Email address",
                                    type: MessageType.Error,
                                    additionalText: "Email address",
                                    target: "/userEmail",
                                    description: "Please enter a valid Email address",
                                    processor: oModel
                                }));

                            }
                            else {
                                oEmailInput.setValueState("None");
                            }

                            if (!oInquirySelect.getSelectedKey()) {
                                oInquirySelect.setValueState("Error");
                                //oInquirySelect.setValueStateText("Please select an inquiry type");
                                isValid = false;
                                cnt++;

                                this._MessageManager.addMessages(new Message({
                                    message: "This field is required",
                                    type: MessageType.Error,
                                    additionalText: "Inquiry",
                                    target: "/",
                                    description: "Please select an inquiry type",
                                    processor: oModel
                                }));

                            } else {
                                oInquirySelect.setValueState("None");
                            }

                            if (!oMessageArea.getValue()) {
                                oMessageArea.setValueState("Error");
                                //oMessageArea.setValueStateText("Please enter a message");
                                isValid = false;
                                cnt++;

                                this._MessageManager.addMessages(new Message({
                                    message: "This field is required",
                                    type: MessageType.Error,
                                    additionalText: "Message",
                                    target: "/message",
                                    description: "Please enter a message",
                                    processor: oModel
                                }));

                            } else {
                                oMessageArea.setValueState("None");
                            }

                            if (!isValid) {
                                oMessageButton.setVisible(true);
                                oMessageButton.setText(cnt);
                                setTimeout(function () {
                                    this._oMessagePopover.openBy(oMessageButton);
                                }.bind(this), 100);

                                return;
                            }

                            let oBindList = oDataModel.bindList("/UserInquiry");
                            let payload = {
                                BusinessPartnerID: contactBP,
                                emailID: oEmailInput.getValue(),
                                InquiryType_InquiryType: oInquirySelect.getSelectedKey(),
                                userId: userId,
                                message: oMessageArea.getValue()
                            };
                            oMessageButton.setVisible(false);

                            var fnSuccess = () => {
                                //this.getView().setBusy(false);
                                MessageToast.show("Your inquiry has been successfully submitted.");
                                oDialog.close();
                            };

                            var fnError = (oError) => {
                                //this.getView().setBusy(false);
                                MessageToast.show("Submission failed: " + oError.message);
                            };
                            oBindList.create(payload, 'false').created().then(fnSuccess, fnError);

                        }
                    });

                    const oFooterBar = new sap.m.Bar({
                        contentLeft: [oMessageButton],
                        contentRight: [oSubmitButton, oCloseButton]
                    });

                    const oDialog = new Dialog({
                        title: "Contact us",
                        stretch: false,
                        draggable: true,
                        content: [
                            new VBox({
                                items: [oFlex, oFooterBar]
                            })
                        ],
                    }).setModel(oModel);
                    oDialog.open();

                    this._MessageManager = Messaging;
                    this._MessageManager.removeAllMessages();
                    this._MessageManager.registerObject(oDialog, true);
                    var oMessageModel = this._MessageManager.getMessageModel();
                    oDialog.setModel(oMessageModel, "message");

                    var oMessageModelBinding = oMessageModel.bindList("/", undefined, [],
                        new Filter("technical", FilterOperator.EQ, true));
                    oMessageModelBinding.attachChange((oEvent) => {
                        var aContexts = oEvent.getSource().getContexts(),
                            aMessages,
                            bMessageOpen = false;

                        if (bMessageOpen || !aContexts.length) {
                            return;
                        }

                        // Extract and remove the technical messages
                        aMessages = aContexts.map(function (oContext) {
                            return oContext.getObject();
                        });
                        sap.ui.getCore().getMessageManager().removeMessages(aMessages);

                        //this._bTechnicalErrors = true;

                        sap.m.MessageBox.error(aMessages[0].message, {
                            onClose: function () {
                                bMessageOpen = false;
                            }
                        });
                        bMessageOpen = true;
                    }, this);

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
                    oMessageButton.addDependent(this._oMessagePopover);

                }.bind(this)
            }, true, false);

        }
    }
});

