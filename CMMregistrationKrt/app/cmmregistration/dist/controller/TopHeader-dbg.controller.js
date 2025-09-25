sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/thirdparty/jquery"
], function (Controller, MessageBox, BaseController, JSONModel, Fragment, MessageToast, jQuery) {
    "use strict";

    return BaseController.extend("cmmregistration.controller.TopHeader", {
        onInit: function () {
            var oDefaultData = {
                selectedCompany: "Enbridge Gas Inc.",
                menuData: [
                    { text: "Dashboard" },
                    { text: "Business partners", subItems: ["Clients", "Suppliers"] },
                    { text: "Billing and Financials", subItems: ["Invoices", "Payments"] }
                ],
                overviewValue: 120,
                reportsValue: 30
            };

            var oCompanyModel = new JSONModel(oDefaultData);
            this.getView().setModel(oCompanyModel, "companyModel");
        },

        /** Opens the company selection fragment */
        oMenuPress: function () {
            if (!this._createUserDialog) {
                sap.ui.core.Fragment.load({
                    name: "cmmregistration.fragments.CompanySelection",
                    controller: this
                }).then((oDialog) => {
                    this._createUserDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this._createUserDialog.open();
            }
        },

        /** Handles company selection and updates menu dynamically */
        onCompanySelect: function (oEvent) {
            var sSelectedCompany = oEvent.getParameter("listItem").getTitle();
            var oModel = this.getView().getModel("companyModel");
        
            // Default visibility settings
            var oMenuVisibility = {
                "Dashboard": false,
                "BusinessPartners": false,
                "Contracting": false,
                "Billing": false,
                "GasManagement": false,
                "GasAccounting": false,
                "Reports": false,
                "Support": false
            };
        
            var oTileVisibility = {
                "Overview": false,
                "Reports": false,
                "Finance": false,
                "Contracts": false
            };
        
            // Update visibility based on selected company
            switch (sSelectedCompany) {
                case "Enbridge Gas Inc.":
                    oMenuVisibility.Dashboard = true;
                    oMenuVisibility.BusinessPartners = true;
                    oMenuVisibility.Contracting = true;
        
                    oTileVisibility.Overview = true;
                    oTileVisibility.Reports = true;
                    break;
        
                case "3M Canada Company":
                    oMenuVisibility.Billing = true;
                    oMenuVisibility.GasManagement = true;
                    oMenuVisibility.GasAccounting = true;
        
                    oTileVisibility.Finance = true;
                    break;
        
                case "A.E. Sharp Ltd.":
                    oMenuVisibility.Dashboard = true;
                    oMenuVisibility.BusinessPartners = true;
                    oMenuVisibility.Reports = true;
                    oMenuVisibility.Support = true;
        
                    oTileVisibility.Contracts = true;
                    oTileVisibility.Reports = true;
                    break;
            }
        
            // Update the model with visibility settings
            oModel.setProperty("/menuData", oMenuVisibility);
            oModel.setProperty("/tileData", oTileVisibility);
            oModel.setProperty("/selectedCompany", sSelectedCompany);
        
            // Fetch selected company data with fallback to default
            // var oSelectedData = oStaticData[sSelectedCompany] || oStaticData["Enbridge Gas Inc."];
        
            // Update model with company-specific data
            // oModel.setProperty("/menuData", oSelectedData.menuData);
            // oModel.setProperty("/overviewValue", oSelectedData.overviewValue);
            // oModel.setProperty("/reportsValue", oSelectedData.reportsValue);
        
            // // Show success message
            // MessageToast.show("Company changed to " + sSelectedCompany);
        
            // Close dialog
            this._createUserDialog.close();
        },
        
        /** Handles menu item click event */
        onMenuItemPress: function (oEvent) {
            var sSelectedMenu = oEvent.getSource().getTitle();
            MessageToast.show("Menu Selected: " + sSelectedMenu);
        },

        /** Handles submenu item click event */
        onSubMenuItemPress: function (oEvent) {
            var sSelectedSubMenu = oEvent.getSource().getTitle();
            MessageToast.show("Submenu Selected: " + sSelectedSubMenu);
        },

        /** Closes the company selection dialog */
        onClose: function () {
            this._createUserDialog.close();
        }
    });
});
