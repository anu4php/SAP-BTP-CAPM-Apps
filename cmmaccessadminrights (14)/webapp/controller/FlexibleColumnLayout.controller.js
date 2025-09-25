sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/DatePicker",
	"sap/ui/core/mvc/XMLView",
	"sap/m/ColumnListItem",
	"sap/m/MessageBox",
	"sap/m/ObjectIdentifier",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	//"cmmaccessadminrights/utils/CommonFunctions"

], function (JSONModel, Controller, DatePicker, XMLView, ColumnListItem, MessageBox, ObjectIdentifier, DateFormat, Filter, FilterOperator, CommonFunctions) {
	"use strict";

	return Controller.extend("cmmaccessadminrights.controller.FlexibleColumnLayout", {
		_bEditMode: false,
		onInit: function (oEvent) {
      this.oRouter = this.getOwnerComponent().getRouter();
      this.oRouter.attachRouteMatched(this.onRouteMatched, this);
      this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);

      // Your existing calls
      this.onTaabSelect("tab1");
      this._onMobileView(oEvent);
      this.onAfterRender();
	  this._setHideFurTermTab();

      
    },
	_setHideFurTermTab: function () {
		this._getCurUserAdminFlagAsync().then((canEdit) => {
        // use canEdit here as needed
        /* eslint-disable no-console */
		const itb = this.byId("idTabBar");
		const tab5 = itb?.getItems().find(i => i.getKey?.() === "tab5");
		if (tab5) tab5.setVisible(canEdit);
		
        console.log("A25 admin flag:", canEdit);
      });
	},

    /**
     * Synchronous check. Returns:
     *  - true/false when model is present,
     *  - null if the model isn't available yet (caller may retry).
     */
    _getCurUserAdminFlag: function () {
      const oModel = this.getOwnerComponent().getModel("oCurUserRightChk");
      if (!oModel) return null; // model not set yet

      // Try common shapes: root array, {results:[...]}, or {data:[...]}
      let data = oModel.getProperty("/") ?? oModel.getData();
      let arr  = Array.isArray(data) ? data :
                 Array.isArray(data?.results) ? data.results :
                 Array.isArray(data?.data) ? data.data : [];

      if (!Array.isArray(arr)) return false;

      const today = new Date(); today.setHours(0, 0, 0, 0);

      const hit = arr.find(obj => {
        if (!obj || obj.AccessRights_code !== "A25") return false;

        // If both dates are null → code check alone passes
        const s = obj.startDate ? new Date(obj.startDate) : null;
        const e = obj.endDate   ? new Date(obj.endDate)   : null;
        if (s) s.setHours(0, 0, 0, 0);
        if (e) e.setHours(0, 0, 0, 0);

        if (!s && !e) return true;
        if (s && today < s) return false;
        if (e && today > e) return false;
        return true;
      });

      return !!hit;
    },

    /**
     * Waits (briefly) for the Component model to exist, then returns true/false.
     * No UI or Component changes. Times out to false after `timeoutMs`.
     */
		_getCurUserAdminFlagAsync: function (timeoutMs = 5000) {
		return new Promise((resolve) => {
			let timer = null;          // define BEFORE use (avoids TDZ)
			let cleaned = false;

			const cleanup = () => {
			if (cleaned) return;
			cleaned = true;
			try { this.oRouter?.detachRouteMatched(attempt, this); } catch (e) {}
			try { this.getView()?.detachModelContextChange(attempt, this); } catch (e) {}
			if (timer) { clearTimeout(timer); timer = null; }
			};

			const attempt = () => {
			const val = this._getCurUserAdminFlag();    // your sync check
			if (typeof val === "boolean") {
				cleanup();
				resolve(val);
			}
			};

			// listen + timeout + immediate try
			this.oRouter?.attachRouteMatched(attempt, this);
			this.getView()?.attachModelContextChange(attempt, this);
			timer = setTimeout(() => { cleanup(); resolve(false); }, timeoutMs);
			attempt();
		});
		},

		_onMobileView: function () {
		const r = this.getOwnerComponent().getRouter();
		const bIsPhone = sap.ui.Device.system.phone;

		if (bIsPhone) {
			if (!this._routesBound) {            // guard so we don’t attach twice
			r.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
			r.getRoute("list").attachPatternMatched(this._onListMatched, this);
			this.getView().setModel(new sap.ui.model.json.JSONModel({
			selectedUserName: ""
			}), "detail");
			this._routesBound = true;
			}
			// optional: ensure the list route actually fires on phones
			r.navTo("list", { layout: "OneColumn", tab: this.oTabPath || "enerlineUsers" }, true);
		} else {
			r.navTo("list", { layout: "TwoColumnsMidExpanded", tab: "enerlineUsers" }, true);
		}
		},
		
		_onDetailMatched: function (oEvent) {
			const sLayout = oEvent.getParameter("arguments").layout;
			this._updateHeaderVisibility(sLayout);
			const oIdx = oEvent.getParameter("arguments").oBPid;
			const sPath = oEvent.getParameter("arguments").oTabPath;
			const oFCL = this.byId("fcl");
			oFCL.setLayout(sLayout); // ✅ Apply layout manually from URL
			//const oUsersModel = this.getOwnerComponent().getModel("usersList").getData();
			//const sUserName = oUsersModel[this.oTabPath][this._oBPid].name;

			 const sUserId = this._oBPid; // adapt to your route
			// fetch name from your list/odata; example:
			const oListModel = this.getOwnerComponent().getModel("usersList").getData(); // your data source
			console.log(oIdx,'userName>>',oListModel);
			const oUserName = oListModel[sPath][oIdx].name;
			this.getView().getModel("detail").setProperty("/selectedUserName", oUserName || "");
		  },
		  
		  _onListMatched: async function (oEvent) {
			
			const sLayout = oEvent.getParameter("arguments").layout;
			this._updateHeaderVisibility(sLayout);
			const oFCL = this.byId("fcl");
			oFCL.setLayout(sLayout); // ✅ For list route too
			this._setHideFurTermTab();
			const canEdit = await this._getCurUserAdminFlagAsync();
			console.log('canEdit>>', canEdit);
		  },

		  _onPhoneBack() {
			// typical FCL back: navigate to previous layout or route
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("list", { layout: "OneColumn", tab: this.oTabPath || "enerlineUsers" }, true);
			//oRouter.navTo("master"); // adjust to your beginColumn route
			},

		  _updateHeaderVisibility: function (sLayoutve) {
			const isPhone = sap.ui.Device.system.phone;
			const sLayout = sLayoutve;

			const oToolbarTitle = this.byId("toolbartitle");
			const oPhoneHeader  = this.byId("phoneHeader");

			if (oToolbarTitle) {
				// Desktop: always visible. Phone: only in OneColumn.
				oToolbarTitle.setVisible(!isPhone || sLayout === "OneColumn");
			}
			if (oPhoneHeader) {
				// Phone: only when mid column is fullscreen.
				oPhoneHeader.setVisible(isPhone && sLayout === "TwoColumnsMidExpanded");
			}
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
			//this.getOwnerComponent().getModel("appView").setProperty("/layout", sLayout);
		},

		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name"),
				oArguments = oEvent.getParameter("arguments");
			//oAccessData = oEvent.getParameter("accessData");

			this._updateUIElements();

			// Save the current route name
			this.currentRouteName = sRouteName;
			this.currentBPid = oArguments.oBPid;
			this.currentTabpath = oArguments.oTabPath;

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
				this.oRouter.navTo(this.currentRouteName, { layout: sLayout, oBPid: this.currentBPid, oTabPath: this.currentTabpath }, true);
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
			const sSelectedKey = oIconTabBar.getSelectedKey()|| 'tab1';
			//const oTargetPage = this.byId("container22");
			//oTargetPage.visibility(false);
			const oPageER = this.byId("container22");
			if (oPageER) {
				oPageER.addStyleClass("sapUiHidden"); // hides via CSS
			}
			this._handleTabChange(sSelectedKey);
			//this.onTaabSelect(sSelectedKey);
			//this._handleTabChange(sSelectedKey);	
			return sSelectedKey;
		},
		_getOrCreateFCL: function (oTabval) {
			//this._handleTabChange(oTabval);
			let oFCL = this.byId("fcl");
			console.log('find fcl', oFCL);
			const oPage = this.byId("container6");

			//const oFclActive = oFCL.getEnabled();
			//console.log('oFclActive', oFclActive);

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
		getComapnyName: async function (sBusinessPartnerID) {
			const oModel = this.getView().getModel("mainModel");
			const aCompanyCtx = await oModel.bindList("/Companies").requestContexts()
			const aCompanyData = aCompanyCtx.map(ctx => ctx.getObject());
			const acompany = aCompanyData.find(c => c.BusinessPartnerID === sBusinessPartnerID);
			
			const aCompanyName = acompany ? acompany.Name : null;
			return aCompanyName;
		},
		// Binding Left list model
		//As per tabs fetching user list start
		/*loadEnerlineUsersList: async function (sBusinessPartnerID) {
			const oModel = this.getView().getModel("mainModel");
		
			try {
			// Step 1: Get UserCompanies by CompanyBP_BusinessPartnerID
			const aUserCompaniesCtx = await oModel
				.bindList("/UserCompanies", null, null, [
				new sap.ui.model.Filter(
					"CompanyBP_ID",
					sap.ui.model.FilterOperator.EQ,
					sBusinessPartnerID
				)
				])
				.requestContexts();
		
			const aUserCompanies = aUserCompaniesCtx.map((ctx) => ctx.getObject());
			const aUserIds = aUserCompanies.map((u) => u.ContactBP_ContactBP);
		
			// Step 2: Get Users matching the ContactBP list
			const aUserFilters = aUserIds.map((bpId) =>
				new sap.ui.model.Filter("ContactBP", sap.ui.model.FilterOperator.EQ, bpId)
			);
			const oUserFilter = new sap.ui.model.Filter({ filters: aUserFilters, and: false });
		
			const aUserCtx = await oModel.bindList("/Users", null, null, [oUserFilter]).requestContexts();
			const aUsers = aUserCtx.map((ctx) => ctx.getObject());
		
			// Step 3: Get Access Rights from BPAccessRights by BPNumber
			const aAccessFilters = aUserIds.map((bpId) =>
				new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, bpId)
			);
			const oAccessFilter = new sap.ui.model.Filter({ filters: aAccessFilters, and: false });
		
			const aAccessCtx = await oModel.bindList("/BPAccessRights", null, null, [oAccessFilter]).requestContexts();
			const aAccessRights = aAccessCtx.map((ctx) => ctx.getObject());
		
			// Step 4: Get Access Right Types and Descriptions
			const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			const aTypes = aTypeCtx.map((ctx) => ctx.getObject());
		
			const aAccessCtx2 = await oModel.bindList("/AccessRights").requestContexts();
			const aAccessFull = aAccessCtx2.map((ctx) => ctx.getObject());
			const oCoName = await this.getComapnyName (sBusinessPartnerID);
			// Step 5: Format Output
			const aEnerlineUsers = aUsers.map((user) => {
				//const userAccess = aAccessRights.filter((r) => r.BPNumber === user.ContactBP);

				const userAccess = aAccessRights.filter((r) => {
					const isSameBP = r.BPNumber === user.ContactBP;
				
					// Keep if no endDate OR if endDate is today or in the future
					const isActive = !r.endDate || new Date(r.endDate) >= new Date();
				
					return isSameBP && isActive;
				});
		
				const access = {};
				userAccess.forEach((entry) => {
				const type = aTypes.find((t) => t.code === entry.AccessRights_accessRightType_code);
				const accessEntry = aAccessFull.find((a) => a.code === entry.AccessRights_code);
		
				if (type && accessEntry) {
					if (!access[type.name]) access[type.name] = [];
					access[type.name].push({
					title: accessEntry.name,
					AccessRight_ID: accessEntry.code,
					id:entry.ID,
					effectiveDate: entry.startDate,
					endDate: entry.endDate,
					selected: true
					});
				}
				});
		
				return {
				name: `${user.firstName} ${user.lastName}`,
				bpNumber: `${user.ContactBP}`,
				relationBP: sBusinessPartnerID,
				companyName : oCoName,
				access
				};
			});
			console.log('aEnerlineUsers>>>>>', aEnerlineUsers);
			
			return aEnerlineUsers;
			} catch (err) {
			console.error("Failed to load user access data:", err);
			}
		},*/

		loadEnerlineUsersList: async function (sCompanyBPID) {
			const oModel = this.getView().getModel("mainModel");
			const sBusinessPartnerID = sCompanyBPID;
			console.log("SelectedCo->", sBusinessPartnerID);

			try {
				// Step 1: Get UserCompanies by CompanyBP_BusinessPartnerID
				const aUserCompaniesCtx = await oModel
					.bindList("/UserCompanies", null, null, [
						new sap.ui.model.Filter(
							"CompanyBP_ID",
							sap.ui.model.FilterOperator.EQ,
							sBusinessPartnerID
						)
					])
					.requestContexts();

				const aUserCompanies = aUserCompaniesCtx.map((ctx) => ctx.getObject());
				const aUserIds = aUserCompanies.map((u) => u.ContactBP_ID);
				const aUserCompanyIds = aUserCompanies.map((u) => u.ID);

				// **NEW**: map ContactBP_ID -> best UserCompany (prefer DefaultIndicator = true)
				const oUcByContact = {};
				aUserCompanies.forEach(uc => {
					const cur = oUcByContact[uc.ContactBP_ID];
					if (!cur || (!cur.DefaultIndicator && uc.DefaultIndicator)) {
						oUcByContact[uc.ContactBP_ID] = uc;
					}
				});

				console.log('Users->>', aUserIds);
				console.log('aUserCompanyIds->>', aUserCompanyIds);

				// Step 2: Get Users matching the ContactBP list
				const aUserFilters = aUserIds.map((bpId) =>
					new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, bpId)
				);
				const oUserFilter = new sap.ui.model.Filter({ filters: aUserFilters, and: false });

				//const aCompanyCtx = await oModel.bindList("/Companies").requestContexts()
				//const aCompanyData = aCompanyCtx.map(ctx => ctx.getObject());

				const aUserCtx = await oModel.bindList("/Users", null, null, [oUserFilter]).requestContexts();
				const aUsers = aUserCtx.map((ctx) => ctx.getObject());
				console.log('Users list->>', aUsers);

				// Step 3: Get Access Rights from BPAccessRights by BPNumber
				const aAccessFilters = aUserCompanyIds.map((bpId) =>
					new sap.ui.model.Filter("UserCompany_ID", sap.ui.model.FilterOperator.EQ, bpId)
				);
				const oAccessFilter = new sap.ui.model.Filter({ filters: aAccessFilters, and: false });
				

				const aAccessCtx = await oModel.bindList("/UserAccessRights", null, null, [oAccessFilter]).requestContexts();
				const aAccessRights = aAccessCtx.map((ctx) => ctx.getObject());
				console.log('aAccessRights55>>', aAccessRights);
				// Step 4: Get Access Right Types and Descriptions
				const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
				const aTypes = aTypeCtx.map((ctx) => ctx.getObject());

				const aAccessCtx2 = await oModel.bindList("/AccessRights").requestContexts();
				const aAccessFull = aAccessCtx2.map((ctx) => ctx.getObject());
				const oCoName = await this.getComapnyName(sBusinessPartnerID);

				// Step 5: Format Output
				const aEnerlineUsers = aUsers.map((user) => {
					// **FIX**: match rights by the user's UserCompany_ID (not user.ID)
					const oUC = oUcByContact[user.ID];                 // user.ID == ContactBP_ID
					const sUCId = oUC && oUC.ID;

					const userAccess = aAccessRights.filter((r) => {
						const isSameUC = sUCId && r.UserCompany_ID === sUCId;
						// Keep if no endDate OR if endDate is today or in the future
						const isActive = !r.endDate || new Date(r.endDate) >= new Date();
						return isSameUC && isActive;
					});

					const access = {};
					userAccess.forEach((entry) => {
						const type = aTypes.find((t) => t.code === entry.AccessRights_accessRightType_code);
						const accessEntry = aAccessFull.find((a) => a.code === entry.AccessRights_code);

						if (type && accessEntry) {
							if (!access[type.name]) access[type.name] = [];
							access[type.name].push({
								title: accessEntry.name,
								AccessRight_ID: accessEntry.code,
								id: entry.ID,
								effectiveDate: entry.startDate,
								endDate: entry.endDate,
								selected: true
							});
						}
					});

					//const acompany = aCompanyData.find(c => c.BusinessPartnerID === sBusinessPartnerID);

					return {
						name: `${user.firstName} ${user.lastName}`,
						bpNumber: `${user.ID}`,
						relationBP: sBusinessPartnerID,
						companyName: oCoName,
						access
					};

				});
				/*const oOutputModel = new sap.ui.model.json.JSONModel({ enerlineUsers: aEnerlineUsers });
				this.setModel(oOutputModel, "userAccessModel");*/
				console.log('aEnerlineUsers>>', aEnerlineUsers);
				return aEnerlineUsers;
			} catch (err) {
				console.error("Failed to load user access data:", err);
			}
		},
		loadAgentCompanyList: async function (sCompanyBPID) {
			try {
			const oModel = this.getView().getModel("mainModel");
		
			// 1. Get all Companies
			const aCompanyCtx = await oModel.bindList("/Companies").requestContexts();
			const aCompanies = aCompanyCtx.map(ctx => ctx.getObject());
		
			// 2. Get AgentCompanies for the given Company BP
			const oAgentFilter = new sap.ui.model.Filter("ContractHolderBP_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
			const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [oAgentFilter]).requestContexts();
			const aAgents = aAgentCtx.map(ctx => ctx.getObject());
			const aAgentBPIds = aAgents.map(a => a.ID?.trim()).filter(Boolean);
			console.log('aAgentBPIds', aAgentBPIds);
			// 3. Get all BPAccessRights
			const aAllAccessCtx = await oModel.bindList("/AgentAccessRights").requestContexts();
			const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());
			const oCoName = await this.getComapnyName (sCompanyBPID);	
			// 4. Filter BPAccessRights: BPNumber == AgentBP_BusinessPartnerID AND RelationBP_BusinessPartnerID == sCompanyBPID
			/*const aFilteredAccessRights = aAllAccessRights.filter(entry =>
				aAgentBPIds.includes(entry.AgentCompany_ID?.trim())
			);*/
			
			console.log('aAllAccessRights**', aAllAccessRights);
			// 5. Get AccessRightType and AccessRights
			const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			const aTypes = aTypeCtx.map(ctx => ctx.getObject());
		
			const aAccessFullCtx = await oModel.bindList("/AccessRights").requestContexts();
			const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());
		
			// 6. Merge Data
			const aAgentAccessData = aAgents.map(agent => {
				//const agentAccessRights = aFilteredAccessRights.filter(r => r.BPNumber === agent.AgentBP_BusinessPartnerID);

				const agentAccessRights = aAllAccessRights.filter((r) => {
					const isSameBP = r.AgentCompany_ID === agent.ID;
				
					// Keep if no endDate OR if endDate is today or in the future
					const isActive = !r.endDate || new Date(r.endDate) >= new Date();
				
					return isSameBP && isActive;
				});
				
				const access = {};
				agentAccessRights.forEach(entry => {
				const type = aTypes.find(t => t.code === entry.AccessRights_accessRightType_code);
				const right = aAccessFull.find(r => r.code === entry.AccessRights_code);
		
				if (type && right) {
					if (!access[type.name]) access[type.name] = [];
		
					access[type.name].push({
					title: right.name,
					AccessRight_ID: right.code,
					id:entry.ID,
					effectiveDate: entry.startDate,
					endDate: entry.endDate,
					selected: true
					});
				}
				});
		
				const matchedCompany = aCompanies.find(c => c.ID === agent.AgentBP_ID);
		
				return {
				name: matchedCompany?.Name || "Unknown",
				bpNumber: agent.ID,
				relationBP: sCompanyBPID,
				companyName : oCoName,
				access
				};
			});
		
			return aAgentAccessData;
		
			} catch (err) {
			console.error("❌ Failed to load company access data:", err);
			return [];
			}
		},

		loadEndCustomersList: async function (sCompanyBPID) {
			try {
			const oModel = this.getView().getModel("mainModel");
		
			// 1. Get all Companies
			const aCompanyCtx = await oModel.bindList("/Companies").requestContexts();
			const aCompanies = aCompanyCtx.map(ctx => ctx.getObject());
		
			// 2. Get AgentCompanies for the given Company BP
			const oAgentFilter = new sap.ui.model.Filter("AgentBP_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
			const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [oAgentFilter]).requestContexts();
			const aAgents = aAgentCtx.map(ctx => ctx.getObject());
			const aAgentBPIds = aAgents.map(a => a.ID?.trim()).filter(Boolean);
			console.log('aAgentBPIds', aAgentBPIds);
			// 3. Get all BPAccessRights
			const aAllAccessCtx = await oModel.bindList("/AgentAccessRights").requestContexts();
			const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());
			const oCoName = await this.getComapnyName (sCompanyBPID);	
			// 4. Filter BPAccessRights: BPNumber == AgentBP_BusinessPartnerID AND RelationBP_BusinessPartnerID == sCompanyBPID
			/*const aFilteredAccessRights = aAllAccessRights.filter(entry =>
				aAgentBPIds.includes(entry.AgentCompany_ID?.trim())
			);*/
			
			console.log('aAllAccessRights**', aAllAccessRights);
			// 5. Get AccessRightType and AccessRights
			const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			const aTypes = aTypeCtx.map(ctx => ctx.getObject());
		
			const aAccessFullCtx = await oModel.bindList("/AccessRights").requestContexts();
			const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());
		
			// 6. Merge Data
			const aAgentAccessData = aAgents.map(agent => {
				//const agentAccessRights = aFilteredAccessRights.filter(r => r.BPNumber === agent.AgentBP_BusinessPartnerID);

				const agentAccessRights = aAllAccessRights.filter((r) => {
					const isSameBP = r.AgentCompany_ID === agent.ID;
				
					// Keep if no endDate OR if endDate is today or in the future
					const isActive = !r.endDate || new Date(r.endDate) >= new Date();
				
					return isSameBP && isActive;
				});
				
				const access = {};
				agentAccessRights.forEach(entry => {
				const type = aTypes.find(t => t.code === entry.AccessRights_accessRightType_code);
				const right = aAccessFull.find(r => r.code === entry.AccessRights_code);
		
				if (type && right) {
					if (!access[type.name]) access[type.name] = [];
		
					access[type.name].push({
					title: right.name,
					AccessRight_ID: right.code,
					id:entry.ID,
					effectiveDate: entry.startDate,
					endDate: entry.endDate,
					selected: true
					});
				}
				});
		
				const matchedCompany = aCompanies.find(c => c.ID === agent.ContractHolderBP_ID);
		
				return {
				name: matchedCompany?.Name || "Unknown",
				bpNumber: agent.ID,
				relationBP: sCompanyBPID,
				companyName : oCoName,
				access
				};
			});
		
			return aAgentAccessData;
		
			} catch (err) {
			console.error("❌ Failed to load company access data:", err);
			return [];
			}
		},

		/*loadEndCustomersList: async function (sCompanyBPID) {
		try {
			const oModel = this.getView().getModel("mainModel");
			const relBP = String(sCompanyBPID || "").trim();
			if (!relBP) return [];

			// 1) AgentCompanies for this Company BP -> collect Contract Holder BP IDs
			const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [
			new sap.ui.model.Filter("AgentBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, relBP)
			], {
			$select: "AgentBP_BusinessPartnerID,ContractHolderBP_BusinessPartnerID"
			}).requestContexts();

			const aAgents = aAgentCtx.map(ctx => ctx.getObject());
			const holderBPs = Array.from(new Set(
			aAgents.map(a => String(a.ContractHolderBP_BusinessPartnerID || "").trim()).filter(Boolean)
			));
			if (!holderBPs.length) return [];

			// 2) Companies: fetch ONLY what we need (keeps Companies table in play, no full-table read)
			const companiesByBP = {};
			const chunkSize = 20; // avoid long URLs; adjust to your backend
			for (let i = 0; i < holderBPs.length; i += chunkSize) {
			const slice = holderBPs.slice(i, i + chunkSize);
			const orBP = new sap.ui.model.Filter({
				and: false,
				filters: slice.map(id =>
				new sap.ui.model.Filter("BusinessPartnerID", sap.ui.model.FilterOperator.EQ, id)
				)
			});

			const ctxs = await oModel.bindList("/Companies", null, null, [orBP], {
				$select: "BusinessPartnerID,Name"
			}).requestContexts();

			ctxs.forEach(c => {
				const o = c.getObject();
				companiesByBP[String(o.BusinessPartnerID).trim()] = o.Name;
			});
			}

			// Parent company name (use your helper; or fetch via /Companies if you prefer)
			const parentName = await this.getComapnyName?.(relBP);

			// 3) BPAccessRights: server-side narrow by RelationBP, client includes() for BPNumber ∈ holderBPs
			const aAccessCtx = await oModel.bindList("/BPAccessRights", null, null, [
			new sap.ui.model.Filter("RelationBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, relBP)
			], {
			$select: "ID,AccessRights_code,AccessRights_accessRightType_code,startDate,endDate,BPNumber,RelationBP_BusinessPartnerID",
			$orderby: "startDate desc"
			}).requestContexts();

			const today = new Date(); today.setHours(0,0,0,0);
			const rights = aAccessCtx.map(c => c.getObject()).filter(e => {
			const bpNum = String(e.BPNumber || "").trim();
			const sameRel = String(e.RelationBP_BusinessPartnerID || "").trim() === relBP;
			const active = !e.endDate || new Date(e.endDate) >= today;
			return holderBPs.includes(bpNum) && sameRel && active;
			});

			// 4) Reference lists
			const [typeCtxs, rightDefCtxs] = await Promise.all([
			oModel.bindList("/AccessRightType", null, null, [], { $select: "code,name" }).requestContexts(),
			oModel.bindList("/AccessRights", null, null, [], { $select: "code,name" }).requestContexts()
			]);
			const types = typeCtxs.map(c => c.getObject());
			const rightDefs = rightDefCtxs.map(c => c.getObject());

			// 5) Merge per contract holder
			const result = aAgents.map(agent => {
			const holder = String(agent.ContractHolderBP_BusinessPartnerID || "").trim();
			const agentRights = rights.filter(r => String(r.BPNumber || "").trim() === holder);

			const access = {};
			agentRights.forEach(r => {
				const t = types.find(t => t.code === r.AccessRights_accessRightType_code);
				const d = rightDefs.find(rd => rd.code === r.AccessRights_code);
				if (t && d) {
				if (!access[t.name]) access[t.name] = [];
				access[t.name].push({
					title: d.name,
					AccessRight_ID: d.code,
					id: r.ID,
					effectiveDate: r.startDate,
					endDate: r.endDate,
					selected: true
				});
				}
			});

			return {
				name: companiesByBP[holder] || "Unknown", // from Companies table
				bpNumber: holder,
				relationBP: relBP,
				companyName: parentName || "Unknown",     // parent company name
				access
			};
			});

			return result;

		} catch (err) {
			console.error("Failed to load company ContractHolder access data:", err);
			return [];
		}
		},*/

			//ending fetching users list


			_onSelectUserTab: async function (oSelcTab) {
				
				/*const oShellModel = this.getOwnerComponent().getModel("sCompanySelc");
				const sBPID = oShellModel?.getProperty("/selectedCompany");
				const oCompanyId = sBPID? sBPID : "7000000001"*/
				const oShellModel = this.getOwnerComponent().getModel("sCompanySelc").getData();
				const sCompanyInfo = oShellModel.CompanyBP_ID;
				const oCompanyId = sCompanyInfo? sCompanyInfo : "64a5b502-0387-498c-9f01-c4aa142d0183";
				console.log("selc Company flp>>", oCompanyId);
				
				const oListData = await Promise.all([ oSelcTab === "enerlineUsers" 
				? this.loadEnerlineUsersList(oCompanyId)
				: oSelcTab === "agentUsers"
				? this.loadAgentCompanyList(oCompanyId)
				: oSelcTab === "endUsers"
				? this.loadEndCustomersList(oCompanyId)
				: null
			]);

			const oFinalModelAccessRights = {
				[oSelcTab] : oListData[0],
				
			};
				console.log("oFinalModelAccessRights flex >>>", oFinalModelAccessRights);
				console.log(oSelcTab, "flex Data>>>>", oListData);
				const oAccessModel = new sap.ui.model.json.JSONModel(oFinalModelAccessRights);
				oAccessModel.setSizeLimit(1000);
				this.getOwnerComponent().setModel(oAccessModel, "usersList");

				return oAccessModel;
				
			},



		//end left list model

		_bindDynamicTable: async function (sSelectedTabKey) {
			const cTabKey = this._oDynamicListinfo(sSelectedTabKey);
			const sPath = "/" + cTabKey;
			// Clear existing model data
			const oModel = this.getOwnerComponent().getModel("usersList");
			if (oModel) {
				oModel.setProperty(sPath, []); // Reset the old tab data
			}
		
			// Show loading indicator
			sap.ui.core.BusyIndicator.show(0);

			try {
			const oFCLt = this.byId("fcl");
			const obeginPage = oFCLt.getCurrentBeginColumnPage();
			const oTable = obeginPage.byId("productsTable");
		
			console.log('flg list>>', cTabKey);
		
			// Load and set new model data
			await this._onSelectUserTab(cTabKey); // async model fetch sets "usersList"
		console.log('flg list22>>', cTabKey);
			oTable.unbindItems(); // Clear old binding
			oTable.bindItems({
				path: "usersList>/" + cTabKey,
				template: new sap.m.ColumnListItem({
					type: "Navigation",
					cells: [
						new sap.m.ObjectIdentifier({
							title: "{usersList>name}",
							text: "{usersList>name}"
						})
					]
				})
			});
		
			oTable.setBusy(false); // Stop loading
		
			// Auto select first and navigate
			oTable.attachUpdateFinished(() => {
				const aItems = oTable.getItems();
				if (aItems.length > 0) {
					oTable.setSelectedItem(aItems[0]);
				}
		
				const bIsPhone = sap.ui.Device.system.phone;
				if (!bIsPhone) {
					this.getOwnerComponent().getRouter().navTo("detail", {
						layout: "TwoColumnsMidExpanded",
						oBPid: 0,
						oTabPath: cTabKey
					});
				}
			});
		} catch (err) {
			console.error("❌ Error in _onProductMatched:", err);
		} finally {
			//oBusy.close();
			sap.ui.core.BusyIndicator.hide();
		}
		},
		//Submit Change future termination
		_onSubmitChangesFurTermPress: async function () {
			const that = this;
			const oMainModel = that.getView().getModel("mainModel");
			const oAccessModel = that.getOwnerComponent().getModel("terminationModel");
			const oTable = this.byId("otermTable");
		  
			const aItems = oTable.getItems();
			let bAtLeastOneSelected = false;
		  
			for (let oItem of aItems) {
			  const oCheckBox = oItem.getCells()[0];
		  
			  if (!oCheckBox.getSelected()) {
				continue; // Skip unchecked rows
			  }
		  
			  bAtLeastOneSelected = true;
			  let bRowChanged = false;
		  
			  try {
				const oCustomData = oCheckBox.getCustomData();
				const oTFId = oCustomData.find(d => d.getKey() === "id")?.getValue();
		  
				const sPath = `/${aItems.indexOf(oItem)}`;
				const oUserData = oAccessModel.getProperty(sPath);
				const sBPId = oUserData.BPId;
				const sRelationBP = oUserData.RelationBP;
				const sAccessType = oItem.getCells()[2].getText(); // 'I' or 'A'
				const sTerminationType = oItem.getCells()[3].getText(); // 'TEA' or 'TER'
				const oHBox = oItem.getCells()[4];
				console.log("old Date check",oUserData );
				let sTerminationDate = "";
				if (oHBox instanceof sap.m.HBox) {
				  const oDatePicker = oHBox.getItems()[1];
				  sTerminationDate = oDatePicker.getValue();
				}
				const sOriginalDate = oUserData.oTerminationDate;
				console.log(sOriginalDate, "before edit enable", sTerminationDate);
				/*if (sOriginalDate === sTerminationDate) {
				sap.m.MessageBox.warning("Termination date has not been changed. Please click edit button to update the new change date to proceed.");
				return;
				}*/
		  
				// Step 1: Update BPAccessRights
				
				const oFilter1 = new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, sBPId);
				const oFilter2 = new sap.ui.model.Filter("RelationBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sRelationBP);
				// Combine filters with AND
				const userFilter = new sap.ui.model.Filter([oFilter1, oFilter2], true); // `true` = AND
				// Bind list with filter
				const oBindAGVal = oMainModel.bindList("/BPAccessRights", undefined, undefined, userFilter);
				const aContexts = await oBindAGVal.requestContexts();
				const aRights = aContexts.map(ctx => ctx.getObject());
				console.log("Read AgentCompanies:", aRights);

				for (const r of aRights) {
				  const sUpdatePath = `/BPAccessRights(ID='${r.ID}')`;
				  const oContext = oMainModel.bindContext(sUpdatePath, null, { $$groupId: "submitGroup" });
				  const oContextBP = await oContext.getBoundContext();
				  oContextBP.setProperty("endDate", sTerminationDate);
				  //oContextBP.getBinding().setUpdateGroupId("submitGroup");
				  bRowChanged = true;
				}
		  
				// Step 2: Update BPAccessTermination
				const sUpdatePath = `/BPAccessTermination(ID='${oTFId}')`; // Use key-based URL format
				
				const oContextBinding = oMainModel.bindContext(sUpdatePath, null, {
					$$groupId: "submitGroup"
				});
				const oBoundContext = oContextBinding.getBoundContext();
				oBoundContext.setProperty("Date", sTerminationDate);

				bRowChanged = true;
		  
				// Step 3: Update ValidTo in related entity
				console.log('sTerminationType', sTerminationType);
				if (sTerminationType === "Terminate Enerline Access") {
				 // let sFilterPath = "";
				  if (sAccessType === "I") {
					await that.getUserCompanyDt(sBPId, sRelationBP, sTerminationDate)
					//sFilterPath = `/UserCompanies(CompanyBP_BusinessPartnerID='${sRelationBP}',ContactBP_ContactBP='${sBPId}')`;
				  } else if (sAccessType === "A") {
					await that.getAgentCompanyDt(oUserData?.bpNumber, oUserData?.relationBP, sTerminationDate)
					//sFilterPath = `/AgentCompanies(ContractHolderBP_BusinessPartnerID='${sRelationBP}',AgentBP_BusinessPartnerID='${sBPId}')`;
				  }
		  
				  /*if (sFilterPath) {
					const oEntityCtx = oMainModel.bindContext(sFilterPath, null, { $$groupId: "submitGroup" });
					const oEntityCtxUsr = await oEntityCtx.getBoundContext();
					oEntityCtxUsr.setProperty("ValidTo", sTerminationDate);
					//oEntityCtx.getBinding().setUpdateGroupId("submitGroup");
					bRowChanged = true;
				  }*/
				}
		  
				// ✅ Highlight modified rows
				if (bRowChanged) {
				  oItem.addStyleClass("highlight-piper");
				}
		  
			  } catch (err) {
				console.error("❌ Error in processing row:", err);
				sap.m.MessageBox.error("Error processing one or more termination rows. Check console for details.");
			  }
			}
		  
			// No checkbox was selected
			if (!bAtLeastOneSelected) {
			  sap.m.MessageBox.warning("Please select at least one record to terminate.");
			  return;
			}
		  
			// 🔁 Submit all changes
			try {
			  await oMainModel.submitBatch("submitGroup");
			  await oMainModel.refresh();
			  const oAccessModel = this.getOwnerComponent().getModel("terminationModel");
  			  oAccessModel.refresh(true);
				sap.m.MessageBox.success("Termination records updated successfully.");
				this._bindDynamicTerminationTable();
				
				setTimeout(() => {
					const oTableRef = this.byId("otermTable");
					const aUpdatedItems = oTableRef.getItems();
				  
					aUpdatedItems.forEach(function (oItem) {
					  const oCheckBox = oItem.getCells()[0];
					  const oHBox = oItem.getCells()[4];
					  const aControls = oHBox.getItems(); // [Text, DatePicker]
				  
					  // ✅ Reset checkbox and highlight styles
					  oCheckBox.setSelected(false);
					  oItem.removeStyleClass("rowHighlighted");
					  oItem.removeStyleClass("highlight-piper");
				  
					  // ✅ Show date Text, hide DatePicker
					  aControls[0].setVisible(true);   // Text
					  aControls[1].setVisible(false);  // DatePicker
					});
				  }, 300);
		  
			} catch (err) {
			  console.error("Batch submit failed:", err);
			  sap.m.MessageBox.error("Failed to update termination records.");
			}
		  },
		  getAgentCompanyDt: async function (bpNumber, relationBP, sDate) {
			const that = this;
			//const oModel = that.getModel("mainModel"); // or your relevant model
			const oModel = that.getView().getModel("mainModel");
			const oFilter1 = new sap.ui.model.Filter("AgentBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, bpNumber);
			const oFilter2 = new sap.ui.model.Filter("ContractHolderBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, relationBP);
			// Combine filters with AND
			const userFilter = new sap.ui.model.Filter([oFilter1, oFilter2], true); // `true` = AND
			// Bind list with filter
			const oBindAGVal = oModel.bindList("/AgentCompanies", undefined, undefined, userFilter);
			try {
			const aContexts = await oBindAGVal.requestContexts();
			const aResults = aContexts.map(ctx => ctx.getObject());
			console.log("Read AgentCompanies:", aResults[0].ValidFrom);
			const sUpdatePathC = `/AgentCompanies(AgentBP_BusinessPartnerID='${bpNumber}',ContractHolderBP_BusinessPartnerID='${relationBP}',ValidFrom=${aResults[0].ValidFrom})`;
			const oContextBindingC = oModel.bindContext(sUpdatePathC, null, {
			$$groupId: "submitGroup"
			});
			const oBoundContextC = oContextBindingC.getBoundContext();
			
			if (oBoundContextC) {
			oBoundContextC.setProperty("ValidTo", sDate);
			}
			await oModel.submitBatch("submitGroup");
			return aResults;
			
			} catch (err) {
			console.error("Error reading AgentCompanies:", err);
			}
		  },
		  getUserCompanyDt: async function (bpNumber, relationBP, sDate) {
			const that = this;
			//const oModel = that.getModel("mainModel"); // or your relevant model
			const oModel = that.getView().getModel("mainModel");
			const oFilter1 = new sap.ui.model.Filter("ContactBP_ContactBP", sap.ui.model.FilterOperator.EQ, bpNumber);
			const oFilter2 = new sap.ui.model.Filter("CompanyBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, relationBP);
			// Combine filters with AND
			const userFilter = new sap.ui.model.Filter([oFilter1, oFilter2], true); // `true` = AND
			// Bind list with filter
			const oBindAGVal = oModel.bindList("/UserCompanies", undefined, undefined, userFilter);
			try {
			const aContexts = await oBindAGVal.requestContexts();
			const aResults = aContexts.map(ctx => ctx.getObject());
			console.log("Read UserCompanies:", aResults[0].ValidFrom);
			const sUpdatePathA = `/UserCompanies(ContactBP_ContactBP='${bpNumber}',CompanyBP_BusinessPartnerID='${relationBP}',ValidFrom=${aResults[0].ValidFrom})`;
			const oContextBindingA = oModel.bindContext(sUpdatePathA, null, {
			$$groupId: "submitGroup"
			});
			const oBoundContextA = oContextBindingA.getBoundContext();
			if (oBoundContextA) {
			oBoundContextA.setProperty("ValidTo", sDate);
			}
			await oModel.submitBatch("submitGroup");
			return aResults;
			} catch (err) {
			console.error("Error reading AgentCompanies:", err);
			}
		  },

		// Cancel Future Termination Dynamic 
		_onTerminateFurAllAccessPress: async function () {
			const that = this;
			const oMainModel = that.getView().getModel("mainModel");
			const oAccessModel = that.getOwnerComponent().getModel("terminationModel");
			const oTable = this.byId("otermTable");
		  
			const aItems = oTable.getItems();
			let bAtLeastOneSelected = false;
		  
			for (let oItem of aItems) {
			  const oCheckBox = oItem.getCells()[0];
		  
			  if (!oCheckBox.getSelected()) {
				continue; // Skip unchecked rows
			  }
		  
			  bAtLeastOneSelected = true;
			  let bRowChanged = false;
		  
			  try {
				const oCustomData = oCheckBox.getCustomData();
				const oTFId = oCustomData.find(d => d.getKey() === "id")?.getValue();
		  
				const sPath = `/${aItems.indexOf(oItem)}`;
				const oUserData = oAccessModel.getProperty(sPath);
				const sBPId = oUserData.BPId;
				const sRelationBP = oUserData.RelationBP;
				const sAccessType = oItem.getCells()[2].getText(); // 'I' or 'A'
				const sTerminationType = oItem.getCells()[3].getText(); // 'TEA' or 'TER'
				const oHBox = oItem.getCells()[4];
		  
				let sTerminationDate = null;
				/*if (oHBox instanceof sap.m.HBox) {
				  const oDatePicker = oHBox.getItems()[1];
				  sTerminationDate = oDatePicker.getValue();
				}*/
		  
				// Step 1: Update BPAccessRights
				
				const oFilter1 = new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, sBPId);
				const oFilter2 = new sap.ui.model.Filter("RelationBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sRelationBP);
				// Combine filters with AND
				const userFilter = new sap.ui.model.Filter([oFilter1, oFilter2], true); // `true` = AND
				// Bind list with filter
				const oBindAGVal = oMainModel.bindList("/BPAccessRights", undefined, undefined, userFilter);
				const aContexts = await oBindAGVal.requestContexts();
				const aRights = aContexts.map(ctx => ctx.getObject());
				console.log("Read AgentCompanies:", aRights);

				for (const r of aRights) {
				  const sUpdatePath = `/BPAccessRights(ID='${r.ID}')`;
				  const oContext = oMainModel.bindContext(sUpdatePath, null, { $$groupId: "submitGroup" });
				  const oContextBP = await oContext.getBoundContext();
				  oContextBP.setProperty("endDate", sTerminationDate);
				  //oContextBP.getBinding().setUpdateGroupId("submitGroup");
				  bRowChanged = true;
				}
		  
				// Step 2: Update BPAccessTermination
				const sUpdatePath = `/BPAccessTermination(ID='${oTFId}')`; // Use key-based URL format
				
				const oContextBinding = oMainModel.bindContext(sUpdatePath, null, {
					$$groupId: "submitGroup"
				});
				const oBoundContext = oContextBinding.getBoundContext();
				oBoundContext.setProperty("Date", sTerminationDate);
				oBoundContext.setProperty("Status", "Deactive");

				bRowChanged = true;
		  
				// Step 3: Update ValidTo in related entity
				console.log('sTerminationType', sTerminationType);
				if (sTerminationType === "Terminate Enerline Access") {
				 // let sFilterPath = "";
				  if (sAccessType === "I") {
					await that.getUserCompanyDt(sBPId, sRelationBP, sTerminationDate)
					//sFilterPath = `/UserCompanies(CompanyBP_BusinessPartnerID='${sRelationBP}',ContactBP_ContactBP='${sBPId}')`;
				  } else if (sAccessType === "A") {
					await that.getAgentCompanyDt(oUserData?.bpNumber, oUserData?.relationBP, sTerminationDate)
					//sFilterPath = `/AgentCompanies(ContractHolderBP_BusinessPartnerID='${sRelationBP}',AgentBP_BusinessPartnerID='${sBPId}')`;
				  }
		  
				  /*if (sFilterPath) {
					const oEntityCtx = oMainModel.bindContext(sFilterPath, null, { $$groupId: "submitGroup" });
					const oEntityCtxUsr = await oEntityCtx.getBoundContext();
					oEntityCtxUsr.setProperty("ValidTo", sTerminationDate);
					//oEntityCtx.getBinding().setUpdateGroupId("submitGroup");
					bRowChanged = true;
				  }*/
				}
		  
				// ✅ Highlight modified rows
				if (bRowChanged) {
				  oItem.addStyleClass("highlight-piper");
				}
		  
			  } catch (err) {
				console.error("Error in processing row:", err);
				sap.m.MessageBox.error("Error processing one or more termination rows. Check console for details.");
			  }
			}
		  
			// No checkbox was selected
			if (!bAtLeastOneSelected) {
			  sap.m.MessageBox.warning("Please select at least one record to terminate.");
			  return;
			}
		  
			// 🔁 Submit all changes
			try {
			  await oMainModel.submitBatch("submitGroup");
			  
			  await oMainModel.refresh();
			  const oAccessModel = this.getOwnerComponent().getModel("terminationModel");
  			  oAccessModel.refresh(true);
			  sap.m.MessageBox.success("Termination records updated successfully.");
				this._bindDynamicTerminationTable();

			 // sap.m.MessageBox.success("Termination records updated successfully.");
		  
			 /* const oBinding = oTable.getBinding("items");
				if (oBinding) {
				oBinding.refresh();
				sap.m.MessageToast.show("Table refreshed.");
				}*/
		  
			} catch (err) {
			  console.error("❌ Batch submit failed:", err);
			  sap.m.MessageBox.error("Failed to update termination records.");
			}
		},
		
		onCancelTerminationPress: function () {
			const oTable = this.byId("otermTable");
			const aItems = oTable.getItems();
			const oSelectedItem = aItems.find(row => row.getCells()[0].getSelected());
		  
			if (!oSelectedItem) {
			  sap.m.MessageBox.warning("Please select a record to cancel termination.");
			  return;
			}
		  
			const sName = oSelectedItem.getCells()[1].getText(); // assuming 2nd column has name
			sap.m.MessageBox.confirm(
			  `Do you wish to cancel the termination for ${sName}?`,
			  {
				title: "Cancel Termination",
				actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
				onClose: function (oAction) {
				  if (oAction === sap.m.MessageBox.Action.OK) {
					// 🔁 Trigger your cancelTermination logic here
					this._onTerminateFurAllAccessPress(oSelectedItem); // assume this method does the update
				  }
				}.bind(this)
			  }
			);
		  },
		 
		  onSubmitTerminationChangesPress: function () {
			const oTable = this.byId("otermTable");
			const aItems = oTable.getItems();
			const oSelectedItem = aItems.find(row => row.getCells()[0].getSelected());
		  
			if (!oSelectedItem) {
			  sap.m.MessageBox.warning("Please select a record to submit changes.");
			  return;
			}
		  
			const oHBox = oSelectedItem.getCells()[4]; // Termination Date field (HBox)
			const oDatePicker = oHBox.getItems()[1];
			const sDate = oDatePicker.getValue();
		  
			if (!sDate) {
			  sap.m.MessageBox.warning("Please select a termination date before submitting.");
			  return;
			}
		  
			const sName = oSelectedItem.getCells()[1].getText();
			sap.m.MessageBox.confirm(
			  `Do you wish to change the termination date for ${sName}?`,
			  {
				title: "Submit Changes",
				actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
				onClose: function (oAction) {
				  if (oAction === sap.m.MessageBox.Action.OK) {
					this._onSubmitChangesFurTermPress(oSelectedItem, sDate); // implement your update logic
				  }
				}.bind(this)
			  }
			);
		  },
		  
		  onTerminationCheckboxSelect: function (oEvent) {
			const that = this; 
			
			const bSelected = oEvent.getParameter("selected");
			const oCheckBox = oEvent.getSource();
			const oHBox = oCheckBox.getParent().getCells()[4];
			const aItems = oHBox.getItems();
			const bEditModeId = that.byId("oEditTermId");
			const bCanceltermId = that.byId("oCancelterminateId");
			const bSubmitId = that.byId("oSubmitChangesButton");


			const oListItem = oCheckBox.getParent();
		  
			// ✅ Add/remove highlighter
			if (bSelected) {
			  oListItem.addStyleClass("rowHighlighted");
			} else {
			  oListItem.removeStyleClass("rowHighlighted");
			}
			
			const bEditMode = that._bEditMode;
			if (bSelected && bEditMode === false && bEditModeId.getEnabled() === true) {
				aItems[0].setVisible(true); // Text
				aItems[1].setVisible(false);  // DatePicker
				bCanceltermId.setEnabled(true);
				bSubmitId.setEnabled(true);
				//bEditModeId.setEnabled(false);
			} else if (bSelected && bEditMode === true && bEditModeId.getEnabled() === false) {
				aItems[0].setVisible(false); // Text
				aItems[1].setVisible(true);  // DatePicker
				bCanceltermId.setEnabled(true);
				bSubmitId.setEnabled(true);
				//bEditModeId.setEnabled(true);
			} else if (bSelected && bEditModeId.getEnabled() === false && bEditMode === false) {
				aItems[0].setVisible(true); // Text
				aItems[1].setVisible(false);  // DatePicker
				bEditModeId.setEnabled(true);
				bCanceltermId.setEnabled(true);
				bSubmitId.setEnabled(true);	
			} else {
			//	oEditButton.setEnabled(true);
				aItems[0].setVisible(true);  // Text
				aItems[1].setVisible(false); // DatePicker
				bEditModeId.setEnabled(false);
				bCanceltermId.setEnabled(false);
				bSubmitId.setEnabled(false);
			}
			//const oCheckBox = oEvent.getSource();
			const oRow = oCheckBox.getParent();
		  
			if (oCheckBox.getSelected()) {
			  oRow.addStyleClass("highlight-piper");
			} else {
			  oRow.removeStyleClass("highlight-piper");
			}
		  },
		  //setting Futured-data termination model
		  fetchUpcomingTerminations: async function (sCompany) {
			//const oModel = this.getModel("mainModel");
			const oModel = this.getView().getModel("mainModel");
			
		  
			try {
			  // Load BPAccessTermination, Users, AgentCompany, Company
			  const [aTermCtx, aUserCtx, aAgentCtx, aCompanyCtx] = await Promise.all([
				oModel.bindList("/BPAccessTermination").requestContexts(),
				oModel.bindList("/Users").requestContexts(),
				oModel.bindList("/AgentCompanies").requestContexts(),
				oModel.bindList("/Companies").requestContexts()
			  ]);
		  
			  const aTermData = aTermCtx.map(ctx => ctx.getObject());
			  const aUserData = aUserCtx.map(ctx => ctx.getObject());
			  const aAgentData = aAgentCtx.map(ctx => ctx.getObject());
			  const aCompanyData = aCompanyCtx.map(ctx => ctx.getObject());
		  
			  //const today = new Date().toISOString().split("T")[0];
			  const oFmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
			  const today = oFmt.format(new Date());
			  //console.log(todayUI5 ,'Today>>',today);
			  
			  console.log('sCompany', sCompany);

			  //let idCounter = 1;
		  
			  const result = aTermData
				.filter(item =>
				  item.RelationBP === sCompany &&
				  item.Date >= today 
				  //item.Status >= "Active"
				)
				.map(item => {
				  let fullName = "";
				  let accessType = item.AccessType === "I" ? "Individual User" : "Agent Company";
				  let terminationLabel = item.TerminationType === "TER"
					? "Terminate Enerline Access and Terminate Relationship"
					: "Terminate Enerline Access";
		  
				  if (item.AccessType === "I") {
					const user = aUserData.find(u => u.ID === item.BPId);
					fullName = user ? `${user.firstName} ${user.lastName}` : "";
				  } else if (item.AccessType === "A") {
					const agentEntry = aAgentData.find(a =>
					  a.ID === item.BPId 
					  //a.ContractHolderBP_BusinessPartnerID === sCompany
					);
					console.log('agentEntry', agentEntry);
		  
					if (agentEntry) {
					  const company = aCompanyData.find(c => c.ID === agentEntry.AgentBP_ID);
					  fullName = company?.Name || "";
					}
				  }
				 
				  return {
					oEnerlineUsersAgents: fullName,
					oAccessType: accessType,
					oTerminationType: terminationLabel,
					oTerminationDate: item.Date,
					selected: true,
					id: item.ID,
					BPId:item.BPId,
					RelationBP: item.RelationBP

				  };
				});
		  
			  // Optionally set to model for table binding
			  //const oJSONModel = new sap.ui.model.json.JSONModel({ terminationUser: result });
			  //this.setModel(oJSONModel, "terminationModel");
			  console.log("furDate>>>", result);
			const oAccessFutTermModel = new sap.ui.model.json.JSONModel(result);
			oAccessFutTermModel.setSizeLimit(1000);
			this.getOwnerComponent().setModel(oAccessFutTermModel, "terminationModel");
				console.log("oAccessFutTermModel", oAccessFutTermModel);
			  return oAccessFutTermModel;
		  
			} catch (err) {
			  console.error("❌ Error fetching terminations:", err);
			  return [];
			}
		  },

		  //end model
   
		  _bindDynamicTerminationTable: async function (sSelectedTabKey) {
			const that = this;
			/*const oFmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
			const today = oFmt.format(new Date());*/
			const today = new Date(); today.setHours(0, 0, 0, 0);
			const oShellModel = this.getOwnerComponent().getModel("sCompanySelc").getData();
			const sCompanyInfo = oShellModel.CompanyBP_ID;
			const oCompanyId = sCompanyInfo ? sCompanyInfo : "7000000001";
			const bSubmitId = that.byId("oSubmitChangesButton");
			sap.ui.core.BusyIndicator.show(0);
			const oVBox = this.byId("oTerminationContainer");
			await this.fetchUpcomingTerminations(oCompanyId);
		  
			try {
			  const oTable = new sap.m.Table(this.createId("otermTable"), {
				columns: [
				  new sap.m.Column({ header: null, width: "3rem" }),
				  new sap.m.Column({ header: new sap.m.Text({ text: "Enerline Users/Agents" }),demandPopin: false, minScreenWidth: "Phone"  }),
				  new sap.m.Column({ header: new sap.m.Text({ text: "Access Type" }), demandPopin: true, minScreenWidth: "Tablet" }),
				  new sap.m.Column({ header: new sap.m.Text({ text: "Termination Type" }), demandPopin: true, minScreenWidth: "Tablet" }),
				  new sap.m.Column({ header: new sap.m.Text({ text: "Termination Date" }), demandPopin: true, minScreenWidth: "Tablet" })
				]
			  });
		  
			  const oItemTemplate = new sap.m.ColumnListItem({
				cells: [
				  new sap.m.CheckBox({
					select: this.onTerminationCheckboxSelect.bind(this),
					customData: [
					  new sap.ui.core.CustomData({
						key: "id",
						value: "{terminationModel>id}"
					  })
					]
				  }),
				  new sap.m.Text({ text: "{terminationModel>oEnerlineUsersAgents}" }),
				  new sap.m.Text({ text: "{terminationModel>oAccessType}" }),
				  new sap.m.Text({ text: "{terminationModel>oTerminationType}" }),
				  new sap.m.HBox({
					items: [
					  new sap.m.Text({
						text: {
						  path: 'terminationModel>oTerminationDate',
						  formatter: function (sDate) {
							if (!sDate) return "";
							const [year, month, day] = sDate.split("-");
							const oDate = new Date(year, month - 1, day);
							const oFormatter = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MMM, dd, yyyy" });
							return oFormatter.format(oDate);
						  }
						}
					  }),
					  new sap.m.DatePicker({
						value: "{terminationModel>oTerminationDate}",
						visible: false,
						valueFormat: "yyyy-MM-dd",
						displayFormat: "long",
						minDate: today,
						change: function (oEvent) {
						  const oPicker = oEvent.getSource();
						  const oItem = oPicker.getParent().getParent();
						  const sNewValue = oPicker.getValue();
						  const sOldValue = oItem.data("originalDate") || sNewValue;
					  
						  const oSelectedDate = new Date(sNewValue);
						  const oToday = new Date();
						  oToday.setHours(0, 0, 0, 0);
					  
						  // ✅ Case 1: If date is in the past
						  if (oSelectedDate < oToday) {
							//MessageBox.warning("Past dates are not allowed. Please select a valid future date.");
							oPicker.setValueState("Error");
							oPicker.setValueStateText("Past dates are not allowed.");
							oItem.data("isDateChanged", false);
							oItem.data("isPastDate", true);
							bSubmitId.setEnabled(false);
							return;
						  }
					  
						  // ✅ Case 2: Valid future date
						  oPicker.setValueState("None");
						  oItem.data("isPastDate", false);
						  bSubmitId.setEnabled(true);
						  if (sOldValue !== sNewValue) {
							oItem.data("isDateChanged", true);
						  } else {
							oItem.data("isDateChanged", false);
						  }
						}
					  })
					]
				  })
				]
			  });
			  oTable.addStyleClass("oFurTbl");
			  oTable.bindItems({
				path: "terminationModel>/",
				template: oItemTemplate
			  });
		  
		  
			  const oSelectAllCheckBox = new sap.m.CheckBox({
				select: function (oEvent) {
				  const bSelected = oEvent.getParameter("selected");
				  const aItems = oTable.getItems();
				  let bBlockSubmit = false;
		  
				  aItems.forEach(function (oItem) {
					const oCheckBox = oItem.getCells()[0];
					const oHBox = oItem.getCells()[4];
					const aControls = oHBox.getItems();
					const bEditModeId = that.byId("oEditTermId");
					const bCanceltermId = that.byId("oCancelterminateId");
					const bSubmitId = that.byId("oSubmitChangesButton");
					const bEditMode = that._bEditMode;
		  
					const oDatePicker = aControls[1];
		  
					// Store original date when selected
					if (bSelected) {
					  oItem.data("originalDate", oDatePicker.getValue());
					  oItem.data("isDateChanged", false);
					  oItem.data("isPastDate", false);
					}
		  
					// ✅ Warning on deselect after changing date
					if (!bSelected && oItem.data("isDateChanged")) {
					  MessageBox.information(
						"You changed the termination date but are deselecting the checkbox. The change will not be saved.",
						{
						  onClose: function () {
							oCheckBox.setSelected(false);
							oItem.removeStyleClass("rowHighlighted");
							oItem.data("isDateChanged", false);
						  }
						}
					  );
					  bBlockSubmit = true;
					  return;
					}
		  
					// ✅ Prevent submit if past date exists
					if (bSelected && oItem.data("isPastDate") === true) {
					  bBlockSubmit = true;
					}
		  
					// Regular UI control switching
					oCheckBox.setSelected(bSelected);
		  
					if (bSelected) {
					  oItem.addStyleClass("rowHighlighted");
					} else {
					  oItem.removeStyleClass("rowHighlighted");
					}
					console.log(bSelected , bEditMode,  bEditModeId.getEnabled());
					if (bSelected && bEditMode === false && bEditModeId.getEnabled() === false) {
					  aControls[0].setVisible(bSelected);
					  aControls[1].setVisible(!bSelected);
					  bEditModeId.setEnabled(true);
					  bCanceltermId.setEnabled(true);
					  bSubmitId.setEnabled(true);
					} else if (bSelected && bEditMode === true && bEditModeId.getEnabled() === false) {
					  aControls[0].setVisible(bSelected);
					  aControls[1].setVisible(!bSelected);
					  bEditModeId.setEnabled(true);
					  bCanceltermId.setEnabled(true);
					  bSubmitId.setEnabled(true);
					} else if (!bSelected && bEditMode === true && bEditModeId.getEnabled() === false) {
					  aControls[0].setVisible(!bSelected);
					  aControls[1].setVisible(bSelected);
					  bEditModeId.setEnabled(false);
					  bCanceltermId.setEnabled(false);
					  bSubmitId.setEnabled(false);
					} else if (bSelected && bEditMode === false && bEditModeId.getEnabled() === true) {
					  aControls[0].setVisible(bSelected);
					  aControls[1].setVisible(!bSelected);
					  bCanceltermId.setEnabled(true);
					  bSubmitId.setEnabled(true);
					} else if (bSelected && bEditMode === true && bEditModeId.getEnabled() === true) {
					  aControls[0].setVisible(bSelected);
					  aControls[1].setVisible(!bSelected);
					  bCanceltermId.setEnabled(true);
					  bSubmitId.setEnabled(true);
					} else {
					  aControls[0].setVisible(!bSelected);
					  aControls[1].setVisible(bSelected);
					  bEditModeId.setEnabled(false);
					  bCanceltermId.setEnabled(false);
					  bSubmitId.setEnabled(false);
					}
				  });
		  
				  // Disable submit if any past date or deselect-after-change
				  const bSubmitId = that.byId("oSubmitChangesButton");
				  if (bBlockSubmit) {
					bSubmitId.setEnabled(false);
				  }
				}
			  });
		  
			  oTable.getColumns()[0].setHeader(oSelectAllCheckBox);
		  
			  const oEditButton = that.byId("oEditTermId");
			  if (oEditButton) {
				oEditButton.setEnabled(false);
			  }
		  
			  oVBox.addContent(oTable);
			} catch (err) {
			  console.error("❌ Error in _bindDynamicTerminationTable:", err);
			} finally {
			  sap.ui.core.BusyIndicator.hide();
			}
		  },
		//End Termination
		_handleTabChange: async function (sSelectedTabKey) {

			this._bindDynamicTable(sSelectedTabKey);

			const oPageIdMap = {
				"tab1": "container6",
				"tab2": "container1",
				"tab3": "container2",
				
			};

			console.log('slectKey on page', sSelectedTabKey);
			
			const sPageId = oPageIdMap[sSelectedTabKey];
			if (!sPageId) return;
			console.log('Page Loading', sPageId);

			const oTargetPage = this.byId(sPageId);

			let oFCL = this.byId("fcl"); // Always same ID

			if (!oFCL) {
				// Create FCL once if not already created
				oFCL = new sap.f.FlexibleColumnLayout({
					id: this.createId("fcl"),
					layout: sap.f.LayoutType.TwoColumnsMidExpanded,
					backgroundDesign: "Translucent",
					stateChange: this.onStateChanged.bind(this)
				});
			} else {
				const oOldParent = oFCL.getParent();
				if (oOldParent && oOldParent !== oTargetPage) {
					console.log("loading remove");
					oOldParent.removeContent(oFCL);
				}
			}

			// Add to selected tab's container page
			if (!oFCL.getParent()) {
				console.log("loading remove");
				oTargetPage.addContent(oFCL);
			}
			//this._bindDynamicTable(sSelectedTabKey);
		},

		onTaabSelect: async function (oEvent) {// Perform any necessary updates after rendering
			//this._onMobileView(this);
			const oRouter = this.getOwnerComponent().getRouter();
			const bIsPhone = sap.ui.Device.system.phone; // Works even in browser device emulation
		  
			//let sLayout = "OneColumn"; // default for phone
		  
			
			//console.log(this._oBPid,"detailsoRouter>>>", this.oTabPath);

			const oIconTabBar = this.byId('idTabBar');
			const sSelectedKey = oIconTabBar.getSelectedKey();
			const cTabKey = this._oDynamicListinfo(sSelectedKey);
			//alert(cTabKey);
			if (bIsPhone) {
			  // Use semantic helper layout for larger devices
			 let sLayout = "OneColumn";
			  oRouter.navTo("list", {
				layout: sLayout,
				oBPid: this._oBPid || 0,
				tab: cTabKey || "enerlineUsers"
			  });
			}
			const otermTable = sSelectedKey === "tab5" ? this._bindDynamicTerminationTable(sSelectedKey) : this._handleTabChange(sSelectedKey);
			//this._handleTabChange(sSelectedKey);
		}
	});
});
