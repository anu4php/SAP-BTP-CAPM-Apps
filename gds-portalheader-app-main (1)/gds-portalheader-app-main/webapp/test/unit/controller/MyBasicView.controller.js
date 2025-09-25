/*global QUnit*/

sap.ui.define([
	"com/workzone/plugin/portalheader/controller/MyBasicView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("MyBasicView Controller");

	QUnit.test("I should test the MyBasicView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
