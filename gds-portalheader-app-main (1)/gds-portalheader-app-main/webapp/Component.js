sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/workzone/plugin/portalheader/model/models",
    "com/workzone/plugin/portalheader/controller/Plugin.controller",
    "sap/ui/dom/includeStylesheet"
], (UIComponent, models, PluginController, includeStylesheet) => {
    "use strict";

    return UIComponent.extend("com.workzone.plugin.portalheader.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            includeStylesheet(sap.ui.require.toUrl("com/workzone/plugin/portalheader/css/styles.css"));

            const plugin = PluginController.runCode.bind(this);
            plugin();
        }
    });
});