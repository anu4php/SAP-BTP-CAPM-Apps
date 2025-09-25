sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("cmmaccessadminrights.controller.App", {
      onInit() {
        this.oRouter = this.getOwnerComponent().getRouter();
			  this.oModel = this.getOwnerComponent().getModel();
      },
      handleClose: function () {
        window.history.go(-1);
      },
      onBack: function () {
        window.history.go(-1);
      }
  });
});