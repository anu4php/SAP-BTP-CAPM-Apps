/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"cmmaccessadminrights/cmmaccessadminrights/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
