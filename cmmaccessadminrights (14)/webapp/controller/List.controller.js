sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
	"sap/m/ColumnListItem",
  	"sap/m/ObjectIdentifier"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, ColumnListItem, ObjectIdentifier) {
	"use strict";

	return Controller.extend("cmmaccessadminrights.controller.List", {
		onInit: function () {
			
			
			//this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter = this.getOwnerComponent().getRouter();

			this.oRouter.getRoute("list").attachPatternMatched(this._onProductMatched, this);
			//this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			
		},
		_onDetailMatched: function (oEvent) {
			const sLayout = oEvent.getParameter("arguments").layout;
			const oFCL = this.byId("fcl");
			oFCL.setLayout(sLayout); // ✅ Apply layout manually from URL
		  },
		  
		  _onListMatched: function (oEvent) {
			const sLayout = oEvent.getParameter("arguments").layout;
			const oFCL = this.byId("fcl");
			oFCL.setLayout(sLayout); // ✅ For list route too
		  },

		onListItemPress: function (oEvent) {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1),
				tabPath = oEvent.getSource().getSelectedItem().getBindingContext("usersList").getPath(),
				tabInfo = tabPath.split("/").filter(Boolean),
				oUserPath = tabInfo[0],
				oBPid = tabInfo[1];
				this.oRouter.navTo("detail", {
				layout: oNextUIState.layout,
				oBPid: oBPid,
				oTabPath: oUserPath
				});
				
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("name", FilterOperator.Contains, sQuery)];
			}

			this.getView().byId("productsTable").getBinding("items").filter(oTableSearchState, "Application");
		},

		onAdd: function (oEvent) {
			MessageBox.show("This functionality is not ready yet.", {
				icon: MessageBox.Icon.INFORMATION,
				title: "Aw, Snap!",
				actions: [MessageBox.Action.OK]
			});
		},

		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("productsTable"),
				oBinding = oTable.getBinding("items"),
				oSorter = new Sorter("name", this._bDescendingSort);

			oBinding.sort(oSorter);
		},
		getComapnyName: async function (sBusinessPartnerID) {
			console.log('sBusinessPartnerID>>', sBusinessPartnerID);
			const oModel = this.getView().getModel("mainModel");
			const aCompanyCtx = await oModel.bindList("/Companies").requestContexts()
			const aCompanyData = aCompanyCtx.map(ctx => ctx.getObject());
			const acompany = aCompanyData.find(c => c.ID === sBusinessPartnerID);
			
			const aCompanyName = acompany ? acompany.Name : null;
			return aCompanyName;
		},
		//As per tabs fetching user list start
		/*loadEnerlineUsersList: async function (sBusinessPartnerID) {
			const oModel = this.getView().getModel("mainModel");

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
			  console.log('oAccessFilter>>', oAccessFilter);
		  
			  const aAccessCtx = await oModel.bindList("/UserAccessRights", null, null, [oAccessFilter]).requestContexts();
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
					const isSameBP = r.UserCompany_ID === user.ID;
				  
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
				
				//const acompany = aCompanyData.find(c => c.BusinessPartnerID === sBusinessPartnerID);

				return {
				  name: `${user.firstName} ${user.lastName}`,
				  bpNumber: `${user.ID}`,
				  relationBP: sBusinessPartnerID,
				  companyName: oCoName,
				  access
				};
				
			  });
			 
			  console.log('aEnerlineUsers>>', aEnerlineUsers);
			  return aEnerlineUsers;
			} catch (err) {
			  console.error("Failed to load user access data:", err);
			}
		  },*/

		loadEnerlineUsersList: async function (sBusinessPartnerID) {
			const oModel = this.getView().getModel("mainModel");

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
			  const aAgentBPIds = aAgents.map(a => a.AgentBP_ID?.trim()).filter(Boolean);
			  // 3. Get all BPAccessRights
			  const aAllAccessCtx = await oModel.bindList("/BPAccessRights").requestContexts();
			  const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());
		  
			  // 4. Filter BPAccessRights: BPNumber == AgentBP_BusinessPartnerID AND RelationBP_BusinessPartnerID == sCompanyBPID
			  const aFilteredAccessRights = aAllAccessRights.filter(entry =>
				aAgentBPIds.includes(entry.BPNumber?.trim()) &&
				entry.RelationBP_BusinessPartnerID?.trim() === sCompanyBPID.trim()
			  );
			  const oCoName = await this.getComapnyName (sCompanyBPID);
			  // 5. Get AccessRightType and AccessRights
			  const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			  const aTypes = aTypeCtx.map(ctx => ctx.getObject());
		  
			  const aAccessFullCtx = await oModel.bindList("/AccessRights").requestContexts();
			  const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());
		  
			  // 6. Merge Data
			  const aAgentAccessData = aAgents.map(agent => {
				//const agentAccessRights = aFilteredAccessRights.filter(r => r.BPNumber === agent.AgentBP_BusinessPartnerID);

				const agentAccessRights = aFilteredAccessRights.filter((r) => {
					const isSameBP = r.BPNumber === agent.AgentBP_BusinessPartnerID;
				  
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
		  
				const matchedCompany = aCompanies.find(c => c.BusinessPartnerID === agent.AgentBP_BusinessPartnerID);
		  
				return {
				  name: matchedCompany?.Name || "Unknown",
				  bpNumber: agent.ID,
				  relationBP: sCompanyBPID,
				  companyName: oCoName,
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
			  const oAgentFilter = new sap.ui.model.Filter("AgentBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
			  const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [oAgentFilter]).requestContexts();
			  const aAgents = aAgentCtx.map(ctx => ctx.getObject());
			  const aAgentBPIds = aAgents.map(a => a.ContractHolderBP_BusinessPartnerID?.trim()).filter(Boolean);
		  
			  // 3. Get all BPAccessRights
			  const aAllAccessCtx = await oModel.bindList("/BPAccessRights").requestContexts();
			  const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());
			  console.log('aAllAccessRights-List>>', aAllAccessRights);
		  
			  // 4. Filter BPAccessRights: BPNumber == AgentBP_BusinessPartnerID AND RelationBP_BusinessPartnerID == sCompanyBPID
			  const aFilteredAccessRights = aAllAccessRights.filter(entry =>
				aAgentBPIds.includes(entry.BPNumber?.trim()) &&
				entry.RelationBP_BusinessPartnerID?.trim() === sCompanyBPID.trim()
			  );
			  const oCoName = await this.getComapnyName (sCompanyBPID);
			  // 5. Get AccessRightType and AccessRights
			  const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			  const aTypes = aTypeCtx.map(ctx => ctx.getObject());
		  
			  const aAccessFullCtx = await oModel.bindList("/AccessRights").requestContexts();
			  const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());
		  
			  // 6. Merge Data
			  const aAgentAccessData = aAgents.map(agent => {
				//const agentAccessRights = aFilteredAccessRights.filter(r => r.BPNumber === agent.ContractHolderBP_BusinessPartnerID);
				
				const agentAccessRights = aFilteredAccessRights.filter((r) => {
					const isSameBP = r.BPNumber === agent.ContractHolderBP_BusinessPartnerID;
				  
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
		  
				const matchedCompany = aCompanies.find(c => c.BusinessPartnerID === agent.ContractHolderBP_BusinessPartnerID);
		  
				return {
				  name: matchedCompany?.Name || "Unknown",
				  bpNumber: agent.ContractHolderBP_BusinessPartnerID,
				  relationBP: sCompanyBPID,
				  companyName : oCoName,
				  access
				};
			  });
		  
			  return aAgentAccessData;
		  
			} catch (err) {
			  console.error("Failed to load company CtractHolder access data:", err);
			  return [];
			}
		  },

		//ending fetching users list


		_onSelectUserTab: async function (oSelcTab) {
			
			const oShellModel = this.getOwnerComponent().getModel("sCompanySelc").getData();
			const sCompanyInfo = oShellModel.CompanyBP_ID;
			const oCompanyId = sCompanyInfo? sCompanyInfo : "64a5b502-0387-498c-9f01-c4aa142d0183";
			console.log('oSelcTab list33', oSelcTab);
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
		  console.log('oFinalModelAccessRights>>', oFinalModelAccessRights);
			const oAccessModel = new sap.ui.model.json.JSONModel(oFinalModelAccessRights);
			oAccessModel.setSizeLimit(1000);
			this.getOwnerComponent().setModel(oAccessModel, "usersList");

			return oAccessModel;
			
		},
		_onProductMatched: async function (oEvent) {
		// 1) Read route arguments (match the names from navTo!)
		const args  = oEvent.getParameter("arguments") || {};
		const osBPid = args.oBPid ?? this._oBPid ?? "0";
		const sPath  = args.tab   ?? this.oTabPath ?? "enerlineUsers";

		console.log(this.oTabPath, "test list>>", sPath);

		// Update locals for later navigations
		this._oBPid  = osBPid;
		this.oTabPath = sPath;

		const oTable = this.byId("productsTable");
		sap.ui.core.BusyIndicator.show(0);

		try {
			await this._onSelectUserTab(sPath);

			// (re)bind items
			oTable.bindItems({
			path: "usersList>/" + sPath,
			template: new sap.m.ColumnListItem({
				type: "Navigation",
				cells: [
				new sap.m.ObjectIdentifier({
					title: "{usersList>name}",
					text:  "{usersList>name}"
				})
				]
			})
			});

			// Use once to avoid stacking multiple handlers on every navigation
			oTable.attachEventOnce("updateFinished", () => {
			const aItems = oTable.getItems();
			if (!aItems || aItems.length === 0) {
				console.warn("No items found in productsTable.");
				return;
			}

			const sTargetPath = "/" + sPath + "/" + osBPid;
			console.log("sTargetPath list", sTargetPath);

			const oItemToSelect = aItems.find((oItem) => {
				const oItemPath = oItem.getBindingContext("usersList").getPath();
				return oItemPath === sTargetPath;
			});

			if (oItemToSelect) {
				oTable.setSelectedItem(oItemToSelect);

				if (!sap.ui.Device.system.phone) {
				this.getOwnerComponent().getRouter().navTo("detail", {
					layout: "TwoColumnsMidExpanded",
					oBPid: osBPid,
					oTabPath: sPath // if your detail route expects oTabPath; otherwise use 'tab'
				});
				}
			} else {
				console.warn("Item not found for path:", sTargetPath);
			}
			});
		} catch (err) {
			console.error("❌ Error in _onProductMatched:", err);
		} finally {
			sap.ui.core.BusyIndicator.hide();
		}
		}
	});
});
