sap.ui.define([
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
	"sap/ui/core/mvc/XMLView",
	"sap/m/ColumnListItem",
	"sap/m/MessageBox",
	"sap/m/ObjectIdentifier",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",

], (JSONModel, Controller, Filter, FilterOperator, XMLView, ColumnListItem, ObjectIdentifier, DateFormat, MessageBox) => {
    "use strict";

    return Controller.extend("cmmaccessadminrights.controller.Main", {
        onInit: function (oEvent) {

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
			// Navigating to a random product in order to display two columns initially
			this.oRouter.navTo("detail", { layout: "TwoColumnsMidExpanded", product: "0", productpath: "enerlineUsers" });
			//this._handleTabChange("tab1");
			//this.onAfterRender();
			
		},
        onBeforeRouteMatched: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel();

			var sLayout = oEvent.getParameters().arguments.layout;

			// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
			if (!sLayout) {
				var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
				sLayout = oNextUIState.layout;
			}

			// Update the layout of the FlexibleColumnLayout
			if (sLayout) {
				oModel.setProperty("/layout", sLayout);
			}
		},

		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name"),
				oArguments = oEvent.getParameter("arguments");
			//oAccessData = oEvent.getParameter("accessData");

			this._updateUIElements();

			// Save the current route name
			this.currentRouteName = sRouteName;
			this.currentProduct = oArguments.product;
			this.currentProductpath = oArguments.productpath;
			this.currentSupplier = oArguments.supplier;

		},

		onStateChanged: function (oEvent) {
			//start setting fcl id
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);


			var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
				sLayout = oEvent.getParameter("layout");

			this._updateUIElements();

			// Replace the URL with the new layout if a navigation arrow was used
			if (bIsNavigationArrow) {
				this.oRouter.navTo(this.currentRouteName, { layout: sLayout, product: this.currentProduct, productpath: this.currentProductpath }, true);
			}
		},

		// Update the close/fullscreen buttons visibility
		_updateUIElements: function () {

			var oModel = this.getOwnerComponent().getModel();
			var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();
			oModel.setData(oUIState);
		},

		onExit: function () {
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			this.oRouter.detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
		},

		//access rights

		onAfterRender: function () {// Perform any necessary updates after rendering
			const oIconTabBar = this.byId('idTabBar');
			const sSelectedKey = oIconTabBar.getSelectedKey();
			console.log(sSelectedKey);
			//this._handleTabChange(sSelectedKey);
			//this.onTaabSelect(sSelectedKey);
			//this._handleTabChange(sSelectedKey);	
			return sSelectedKey;
		},
		_getOrCreateFCL: function (oPage) {
			let oFCL = this.byId("fcl");
			console.log('find fcl', oFCL);

			if (!oFCL) {
				oFCL = new sap.f.FlexibleColumnLayout({
					id: this.createId("fcl"),
					layout: "{/layout}",
					backgroundDesign: "Translucent",
					stateChange: this.onStateChanged.bind(this)
				});
				oPage.addContent(oFCL);
			}
			oPage.addContent(oFCL);
			return oFCL;
		},

		_oDynamicListinfo: function (sSelectedKey) {// Perform any necessary updates after rendering
			console.log('list V', sSelectedKey);
			let sBindingPath;
			switch (sSelectedKey) {
				case "tab2":
					sBindingPath = "agentUsers";
					break;
				case "tab3":
					sBindingPath = "endUsers";
					break;
				case "tab4":
					sBindingPath = "enerlineUsers";
					break;
				case "tab1":
					console.log("1st tab");
					sBindingPath = "enerlineUsers";
					break;
			}

			return sBindingPath;
		},
		onTermSearch: function (oEvent) {
			const sQuery = oEvent.getParameter("query");
			const oTable = this.byId("otermTable"); // make sure ID matches table ID
		 
			const aFilters = [];
		 
			if (sQuery && sQuery.length > 0) {
				// Search both name and access type
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("oEnerlineUsersAgents", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("oAccessType", sap.ui.model.FilterOperator.Contains, sQuery)
					],
					and: false
				}));
			}
		 
			const oBinding = oTable.getBinding("items");
			if (oBinding) {
				oBinding.filter(aFilters);
			}
		},


		onEditTerminate: function () {
			this._bEditMode = true;

			console.log('this._bEditMode', this._bEditMode);
		 
			const oTable = this.byId("otermTable");
			const aItems = oTable.getItems();
		 
			aItems.forEach(function (oItem) {
				const oCheckBox = oItem.getCells()[0];
				const oHBox = oItem.getCells()[4];
				const aControls = oHBox.getItems();
		 
				if (oCheckBox.getSelected()) {
					aControls[0].setVisible(false); // Text
					aControls[1].setVisible(true);  // DatePicker
				}
			});
		 
			this.byId("oEditTermId").setEnabled(false);
			
		},

		_bindDynamicTable: function (sSelectedTabKey) {
			const cTabKey = this._oDynamicListinfo(sSelectedTabKey);
			//const oTable = this.byId("productsTable");
			const oFCLt = this.byId("fcl");
			const obeginPage = oFCLt.getCurrentBeginColumnPage();
			const oTable = obeginPage.byId("productsTable");
			// Log the 'oTable' variable to the console for debugging purposes
			console.log('oTable id', oTable);
			const sPath = '/' + cTabKey;
			const oModel = this.getView().getModel("usersModel");
			const oUser = oModel.getProperty(sPath);
			console.log('Selected user:', oUser[0].name, sPath);
			const oModelData = cTabKey;
			//const oBindVal = "usersModel>/".oModelData;
			// Unbind old content first (optional but clean)
			oTable.unbindItems();

			// Bind new items dynamically
			oTable.bindItems({
				path: "usersModel>/" + oModelData,
				sorter: { path: "name" },
				template: new sap.m.ColumnListItem({
					type: "Navigation",
					cells: [
						new sap.m.ObjectIdentifier({
							title: "{usersModel>name}",
							text: "{usersModel>name}"
						})
					]
				})
			});

			setTimeout(() => {
				this.getOwnerComponent().getRouter().navTo("detail", {
					layout: "TwoColumnsMidExpanded",
					product: 0,
					productpath: oModelData
				});
			}, 0);
			oTable.attachUpdateFinished(function () {
				const aItems = oTable.getItems();
				if (aItems.length > 0) {
					oTable.setSelectedItem(aItems[0]);
				}
			});
		},
		// Termination  Dynamic
		_onTerminateAllAccessPress: function () {
			const oTable = this.byId("otermTable"); // Replace with your actual table ID
 
			if (!oTable) {
				console.error("Table not found with given ID.");
				return;
			}
		 
			const selectedRows = [];
		 
			oTable.getItems().forEach(function (oItem) {
				const oCheckBox = oItem.getCells()[0]; // First cell: CheckBox
		 
				if (oCheckBox.getSelected()) {
					const userId = oCheckBox.getCustomData().find(d => d.getKey() === "id").getValue();
					const enerlineUser = oItem.getCells()[1].getText();
					const accessType = oItem.getCells()[2].getText();
					const terminationType = oItem.getCells()[3].getText();
		 
					const terminationDateCell = oItem.getCells()[4];
					let terminationDate = "";
		 
					if (terminationDateCell instanceof sap.m.HBox) {
						// Inside HBox: [Text, DatePicker]
						const aItems = terminationDateCell.getItems();
						const oDatePicker = aItems[1]; // second item
						terminationDate = oDatePicker.getValue();
					}
		 
					selectedRows.push({
						id: userId,
						enerlineUser: enerlineUser,
						accessType: accessType,
						terminationType: terminationType,
						terminationDate: terminationDate
					});
				}
			});
			console.log("✅ Selected Rows Data:", selectedRows);
			
			const errorData = selectedRows.length === 0 ? sap.m.MessageBox.warning("Please select user to termination") : sap.m.MessageBox.confirm("Selected keys");
			sap.m.MessageBox.confirm("Approve purchase order 12345?")
			return selectedRows;
		},
 
   
		_bindDynamicTerminationTable: function (sSelectedTabKey) {
			const oVBox = this.byId("oTerminationContainer");
		 
			const oTable = new sap.m.Table(this.createId("otermTable"), {
				columns: [
					new sap.m.Column({ header: null, width: "5rem" }), // placeholder for Select All
					new sap.m.Column({ header: new sap.m.Text({ text: "Enerline Users/Agents" }) }),
					new sap.m.Column({ header: new sap.m.Text({ text: "Access Type" }) }),
					new sap.m.Column({ header: new sap.m.Text({ text: "Termination Type" }) }),
					new sap.m.Column({ header: new sap.m.Text({ text: "Termination Date" }) })
				]
			});
		 
			// Define the template for rows
			const oItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.CheckBox({
						select: function (oEvent) {
							const bSelected = oEvent.getParameter("selected");
							const oCheckBox = oEvent.getSource();
							const oHBox = oCheckBox.getParent().getCells()[4];
							const aItems = oHBox.getItems();
							const bEditModeId = that.byId("oEditTermId");
							
							const bEditMode = that._bEditMode;
							if (bSelected && bEditMode === false && bEditModeId.getEnabled() === true) {
								aItems[0].setVisible(true); // Text
								aItems[1].setVisible(false);  // DatePicker
								//bEditModeId.setEnabled(false);
							} else if (bSelected && bEditMode === true && bEditModeId.getEnabled() === false) {
								aItems[0].setVisible(false); // Text
								aItems[1].setVisible(true);  // DatePicker
								//bEditModeId.setEnabled(true);
							} else if (bSelected && bEditModeId.getEnabled() === false && bEditMode === false) {
								aItems[0].setVisible(true); // Text
								aItems[1].setVisible(false);  // DatePicker
								bEditModeId.setEnabled(true);	
							} else {
							//	oEditButton.setEnabled(true);
								aItems[0].setVisible(true);  // Text
								aItems[1].setVisible(false); // DatePicker
							}
						},
						customData: [
							new sap.ui.core.CustomData({
								key: "id",
								value: "{id}"
							})
						]
					}),
					new sap.m.Text({ text: "{usersModel>oEnerlineUsersAgents}" }),
					new sap.m.Text({ text: "{usersModel>oAccessType}" }),
					new sap.m.Text({ text: "{usersModel>oTerminationType}" }),
					new sap.m.HBox({
						items: [
							new sap.m.Text({
								text: {
									path: 'usersModel>oTerminationDate',
									formatter: function (sDate) {
										if (!sDate) return "";
										const oDate = new Date(sDate);
										const oFormatter = sap.ui.core.format.DateFormat.getDateInstance({ style: "long" });
										return oFormatter.format(oDate);
									}
								}
							}),
							new sap.m.DatePicker({
								value: "{usersModel>oTerminationDate}",
								visible: false,
								valueFormat: "yyyy-MM-dd",
								displayFormat: "long"
							})
						]
					})
				]
			});
		 
			// Bind table items to model path
			oTable.bindItems({
				path: "usersModel>/terminationUser",
				template: oItemTemplate
			});
		 
			const that = this; // capture context for inner function
 
			const oSelectAllCheckBox = new sap.m.CheckBox({
				select: function (oEvent) {
					const bSelected = oEvent.getParameter("selected");
					const aItems = oTable.getItems();
			
					aItems.forEach(function (oItem) {
						const oCheckBox = oItem.getCells()[0];
						const oHBox = oItem.getCells()[4];
						const aControls = oHBox.getItems();
						const bEditModeId = that.byId("oEditTermId");
							
							const bEditMode = that._bEditMode;
							console.log(bSelected, bEditMode, bEditModeId.getEnabled());
						oCheckBox.setSelected(bSelected);
						if (bSelected && bEditMode === false && bEditModeId.getEnabled() === false) {
						aControls[0].setVisible(bSelected); // Text
						aControls[1].setVisible(!bSelected);  // DatePicker
						bEditModeId.setEnabled(true);
						console.log("test 1");
						} else if (bSelected && bEditMode === true && bEditModeId.getEnabled() === false) {
						aControls[0].setVisible(bSelected); // Text
						aControls[1].setVisible(!bSelected);  // DatePicker
						bEditModeId.setEnabled(true);
						console.log("test 12");
						} else if (!bSelected && bEditMode === true && bEditModeId.getEnabled() === false) {
						aControls[0].setVisible(!bSelected); // Text
						aControls[1].setVisible(bSelected);  // DatePicker
						bEditModeId.setEnabled(false);
						console.log("test 123");
						} else if (bSelected && bEditMode === false && bEditModeId.getEnabled() === true) {
						aControls[0].setVisible(bSelected); // Text
						aControls[1].setVisible(!bSelected);  // DatePicker
						console.log("test 112345");
						} else if (bSelected && bEditMode === true && bEditModeId.getEnabled() === true) {
						aControls[0].setVisible(bSelected); // Text
						aControls[1].setVisible(!bSelected);  // DatePicker
						console.log("test 1123456");
						} else {
						aControls[0].setVisible(!bSelected); // Text
						aControls[1].setVisible(bSelected);  // DatePicker
						bEditModeId.setEnabled(false);
						console.log("test 11234");
						}
					});
			
					
				}
			});
		 
			// Set Select All checkbox in header
			oTable.getColumns()[0].setHeader(oSelectAllCheckBox);
		 // ✅ Enable Edit button only if checkboxes are selected
		 const oEditButton = that.byId("oEditTermId");
		 if (oEditButton) {
			 oEditButton.setEnabled(false); // enable if select-all is true, else disable
		 }
			// Add table to the VBox
			//oVBox.removeAllItems();
			//oVBox.addItem(oTable);
			oVBox.addContent(oTable);
		},
		//End Termination
		_handleTabChange: async function (sSelectedTabKey) {

			this._bindDynamicTable(sSelectedTabKey);

			const oPageIdMap = {
				"tab1": "container6",
				"tab2": "container1",
				"tab3": "container2",
				"tab4": "container3"
			};

			const sPageId = oPageIdMap[sSelectedTabKey];
			if (!sPageId) return;
			const oTargetPage = this.byId(sPageId);

			let oFCL = this.byId("fcl"); // Always same ID

			if (!oFCL) {
				// Create FCL once if not already created
				oFCL = new sap.f.FlexibleColumnLayout({
					id: this.createId("fcl"),
					layout: "TwoColumnsMidExpanded",
					backgroundDesign: "Translucent",
					stateChange: this.onStateChanged.bind(this)
				});
			} else {
				const oOldParent = oFCL.getParent();
				if (oOldParent && oOldParent !== oTargetPage) {
					oOldParent.removeContent(oFCL);
				}
			}

			// Add to selected tab's container page
			if (!oFCL.getParent()) {
				oTargetPage.addContent(oFCL);
			}

		},

		onTaabSelect: async function (oEvent) {// Perform any necessary updates after rendering
			const oIconTabBar = this.byId('idTabBar');
			const sSelectedKey = oIconTabBar.getSelectedKey();
			const otermTable = sSelectedKey === "tab5" ? this._bindDynamicTerminationTable(sSelectedKey) : this._handleTabChange(sSelectedKey);
			//this._handleTabChange(sSelectedKey);
		}
    });
});