sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ushell/Container",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (UIComponent, Container, JSONModel, Device, library, FlexibleColumnLayoutSemanticHelper, Filter, FilterOperator) {
	"use strict";

	var LayoutType = library.LayoutType;

	var Component = UIComponent.extend("cmmaccessadminrights.Component", {
		metadata: {
			manifest: "json"
		},

		init: async function () {
			//alert("component fun First");
			UIComponent.prototype.init.apply(this, arguments);
			
			var oModel = new JSONModel();
			this.setModel(oModel);
			this.setModel(this.getModel("mainModel"), "mainModel");
			const sBPID = "7000000002";
			const oInfoModel = this.getModel("mainModel");
			//Get logedin User
			/*const oContainer = Container;
			const oUserSvc = await oContainer.getServiceAsync("UserInfo");
			const userEmail = oUserSvc.getUser().getEmail();

			const scurEmailid = userEmail || "anuradha.gurram@enbridge.com";*/
			//console.log("User Email:", scurEmailid);
			const scurEmailid = "anuradha.gurram@enbridge.com";
			

			let userFilter = new sap.ui.model.Filter("emailID", sap.ui.model.FilterOperator.EQ, scurEmailid); 
            let oGetCurUser = oInfoModel.bindList("/Users", undefined, undefined, userFilter);
			const aContexts = await oGetCurUser.requestContexts();
			const oUserData = aContexts.length ? aContexts[0].getObject() : null;
			console.log('UserContactBP->', oUserData.ID);
			

			let scurUserContactBp = oUserData ? oUserData.ID : "64a5b502-0387-498c-9f01-c4aa142d0183";
			console.log("scurUserContactBp", scurUserContactBp);

			//get currect user Company
			const sCompany = await this.getUserCompanyId(scurUserContactBp);
			const sSelectedCompany = sCompany ? sCompany : "64a5b502-0387-498c-9f01-c4aa142d0183";

			console.log("Company from FLP intent:", sSelectedCompany);

			const sEditAcceshChk = await this.getUserRightEidtChk(scurUserContactBp, sCompany);
			console.log("User check Edit>>>", sEditAcceshChk);

			//const sUserAuthChk = await this.getUserAuthChk(sEditAcceshChk);
			

			try {
				const [aCmmRoles] = await Promise.all([
				  this.loadMainAccessRights()
				]);
				
				// Optional: load static roles or hardcoded if needed
			   // const aCmmRoles = await this.loadDefaultRoles(); // or use [] if static
			
				const oFinalModelAccessRights = {
				  cmmRoles: aCmmRoles
				};

				console.log('finelObj>>>', oFinalModelAccessRights);
			   // const oModelCombined = new sap.ui.model.json.JSONModel(oFinalModelAccessRights);
				//this.setModel(oModelCombined, "cmmAccessRights");
				var oAccessModel = new JSONModel(oFinalModelAccessRights);
				//oAccessModel.setSizeLimit(1000);
				this.setModel(oAccessModel, "cmmAccessRights");
				//return oFinalModelAccessRights;
			
			  } catch (err) {
				console.error("Failed to load all access rights:", err);
			  }
			const oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");
			

		  
			this.getRouter().initialize();
		},
		getUserCompanyId: async function (scurUserContactBp) {
		// models & helpers
		const oModel = this.getModel("mainModel");
		const aCompanyCtx = await oModel.bindList("/UserCompanies", null, null, [
			new sap.ui.model.Filter("ContactBP_ID", sap.ui.model.FilterOperator.EQ, scurUserContactBp),
			new sap.ui.model.Filter("DefaultIndicator", sap.ui.model.FilterOperator.EQ, true)
		  ]).requestContexts();
		const sCompanyData = aCompanyCtx.length ? aCompanyCtx[0].getObject() : null;
		const sCompanyId = sCompanyData.CompanyBP_ID;  
		console.log('Select Co>>>', sCompanyId);
		//const sCompanyId = aCtx.length ? aCtx[0].getProperty("CompanyBP_BusinessPartnerID") : null;
		const oJSONModelaccess = new sap.ui.model.json.JSONModel(sCompanyData);
		this.setModel(oJSONModelaccess, "sCompanySelc");
		  return sCompanyId;

		},
		getUserAuthChk: async function (aRights) {
			const today = new Date().toISOString().split("T")[0]; // e.g., "2025-08-05"
			const hasEditAccess = Array.isArray(aRights) && aRights.some(r => {
				const code = (r?.AccessRights_code || "").toUpperCase();
				//const endsOk = !r?.endDate || r.endDate >= today;
				return (code === "A25" || code === "A26");
			});

			if (!hasEditAccess) {
				sap.m.MessageToast.show(
					"You are not authorized to access app. Please contact the administrator.",
					{ duration: 5000 }
				);

				// Navigate back to SAP FLP tile page (Home)
				if (sap.ushell?.Container?.getServiceAsync) {
					const nav = await sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
					nav.toExternal({ target: { shellHash: "#Shell-home" } });
				} else {
					// Fallback if not running in FLP shell
					window.location.hash = "#Shell-home";
					setTimeout(() => window.history.go(-1), 100);
				}
				return; // stop further processing in this handler
			}
		},
		getUserRightEidtChk: async function (scurUserContactBp, sCompany) {
			const oModel = this.getModel("mainModel");
			const today = new Date().toISOString().split("T")[0]; // e.g., "2025-08-05"

			const aFiltersUser = [
			new sap.ui.model.Filter("ContactBP_ID", sap.ui.model.FilterOperator.EQ, scurUserContactBp),
			new sap.ui.model.Filter("CompanyBP_ID", sap.ui.model.FilterOperator.EQ, sCompany)
			];
		  
			let oGetCurUser = oModel.bindList("/UserCompanies", undefined, undefined, aFiltersUser);
			const aContexts = await oGetCurUser.requestContexts();
			const oUserData = aContexts.length ? aContexts[0].getObject() : null;
			console.log('UserCoRelation ID->', oUserData.ID);
			
			const aFilters = [
			  new sap.ui.model.Filter("UserCompany_ID", sap.ui.model.FilterOperator.EQ, oUserData.ID),
			  //new sap.ui.model.Filter("CompanyBP_ID", sap.ui.model.FilterOperator.EQ, sCompany),
		  
			  // Date range filters
			 /* new sap.ui.model.Filter("startDate", sap.ui.model.FilterOperator.LE, today),
			  new sap.ui.model.Filter({
				filters: [
				  new sap.ui.model.Filter("endDate", sap.ui.model.FilterOperator.GE, today),
				  new sap.ui.model.Filter("endDate", sap.ui.model.FilterOperator.EQ, null)
				],
				and: false
			  })*/
			];
		  
			// Get all matching contexts
			const aCheckRightCtx = await oModel
			  .bindList("/UserAccessRights", null, null, aFilters)
			  .requestContexts();
		  
			// Convert each context to object
			const aAccessRights = aCheckRightCtx.map(ctx => ctx.getObject());
			//new right end		
		  		
		  
			console.log("Matching Access Rights:", aAccessRights);
		  
			// Store full list in a model
			const oJSONModelaccess = new sap.ui.model.json.JSONModel(aAccessRights);
			this.setModel(oJSONModelaccess, "oCurUserRightChk");
		  },
		fetchUpcomingTerminations: async function (sCompany) {
			const oModel = this.getModel("mainModel");
		  
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
		  
			  const today = new Date().toISOString().split("T")[0];
			  //let idCounter = 1;
		  
			  const result = aTermData
				.filter(item =>
				  item.RelationBP === sCompany &&
				  item.Date >= today &&
				  item.Status >= "Active"
				)
				.map(item => {
				  let fullName = "";
				  let accessType = item.AccessType === "I" ? "Individual User" : "Agent Company";
				  let terminationLabel = item.TerminationType === "TER"
					? "Terminate Enerline Access and Terminate Relationship"
					: "Terminate Enerline Access";
		  
				  if (item.AccessType === "I") {
					const user = aUserData.find(u => u.ContactBP === item.BPId);
					fullName = user ? `${user.firstName} ${user.lastName}` : "";
				  } else if (item.AccessType === "A") {
					const agentEntry = aAgentData.find(a =>
					  a.AgentBP_BusinessPartnerID === item.BPId &&
					  a.ContractHolderBP_BusinessPartnerID === sCompany
					);
		  
					if (agentEntry) {
					  const company = aCompanyData.find(c => c.BusinessPartnerID === agentEntry.AgentBP_BusinessPartnerID);
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
			  const oJSONModel = new sap.ui.model.json.JSONModel({ terminationUser: result });
			  this.setModel(oJSONModel, "terminationModel");
		  
			  return result;
		  
			} catch (err) {
			  console.error("❌ Error fetching terminations:", err);
			  return [];
			}
		  },

		loadMainAccessRights: function () {
		const oModel = this.getModel("mainModel");
		return Promise.all([
			oModel.bindList("/AccessRightType").requestContexts(),
			oModel.bindList("/AccessRights").requestContexts()
		  ])
		  .then(([aTypeCtx, aRightsCtx]) => {
			const aTypes = aTypeCtx.map(ctx => ctx.getObject());
			const aRights = aRightsCtx.map(ctx => ctx.getObject());
		  
			const cmmRoles = aTypes.map(type => {
			  const filteredRights = aRights.filter(right => right.accessRightType_code === type.code);
			  return {
				categoryID: type.code,
				categoryName: type.name,
				accessRights: filteredRights.map(right => ({
				  accessTypeID: right.code,
				  rightName: right.name
				}))
			  };
			});
			console.log('Main Access Rights999:-', cmmRoles);
			/*const oModelCombined = new sap.ui.model.json.JSONModel({ cmmRoles });
			this.setModel(oModelCombined, "cmmRolesModel");*/
			
			return cmmRoles;
		  })
		  .catch(err => {
			console.error("Error loading roles:", err);
		  });
		},
		/**
		 * Loads users associated with a specific company based on the provided Business Partner ID.
		 *
		 * @param {string} sBusinessPartnerID - The ID of the business partner for which to load users.
		 */
		loadUsersByCompany: function (sBusinessPartnerID) {
			//const oModel = this.getModel(); // or this.getOwnerComponent().getModel()
			const oModel = this.getModel("mainModel");

			const oFilter = new sap.ui.model.Filter(
			  "CompanyBP_BusinessPartnerID",
			  FilterOperator.EQ,
			  sBusinessPartnerID
			);
	  
			oModel.bindList("/UserCompanies", null, null, [oFilter])
			  .requestContexts()
			  .then(aUserCompanyCtx => {
				const aUserCompanyData = aUserCompanyCtx.map(ctx => ctx.getObject());
	  
				const aContactBPs = aUserCompanyData.map(u => u.ContactBP_ContactBP);
	  
				// Create filters to fetch only matched users
				const aUserFilters = aContactBPs.map(bpId =>
				  new Filter("ContactBP", FilterOperator.EQ, bpId)
				);
	  
				const oUserFilter = new Filter({
				  filters: aUserFilters,
				  and: false // OR condition
				});
	  
				return oModel.bindList("/Users", null, null, [oUserFilter]).requestContexts();
			  })
			  .then(aUserCtx => {
				const aUsers = aUserCtx.map(ctx => ctx.getObject());
				const aFilteredUserNames = aUsers.map(user => ({
				  firstName: user.firstName,
				  lastName: user.lastName
				}));
	  
	  
				const oUserModel = new sap.ui.model.json.JSONModel(aFilteredUserNames);
				this.setModel(oUserModel, "userNamesModel"); // can bind like userNamesModel>/0/firstName
	  
			  })
			  .catch(err => {
				console.error("Error fetching user details:", err);
			  });
		  },
		  
		  loadUsersWithAccessDetails: async function (sBusinessPartnerID) {
			const oModel = this.getModel("mainModel");
		  
			try {
			  // Step 1: Get UserCompanies by CompanyBP_BusinessPartnerID
			  const aUserCompaniesCtx = await oModel
				.bindList("/UserCompanies", null, null, [
				  new sap.ui.model.Filter(
					"CompanyBP_BusinessPartnerID",
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
				  access
				};
			  });
			  /*console.log('aEnerlineUsers>>>>>', aEnerlineUsers);
			  const oOutputModel = new sap.ui.model.json.JSONModel({ enerlineUsers: aEnerlineUsers });
			  this.setModel(oOutputModel, "userAccessModel");*/
			  return aEnerlineUsers;
			} catch (err) {
			  console.error("Failed to load user access data:", err);
			}
		  },
		  // AgentCompany Access Rights
		 /* loadAgentCompanyAccessRights: async function (sCompanyBPID) {
			try {
			  const oModel = this.getModel("mainModel");
		  
			  // Step 1: Get AgentCompanies where ContractHolderBP_ID matches the Company
			  const oAgentFilter = new sap.ui.model.Filter("ContractHolderBP_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
			  const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [oAgentFilter]).requestContexts();
			  const aAgents = aAgentCtx.map(ctx => ctx.getObject());
			  
			  // Step 2: Get all BPAccessRights
			  const aAccessCtx = await oModel.bindList("/BPAccessRights").requestContexts();
			  const aAccessRights = aAccessCtx.map(ctx => ctx.getObject());
			  
			  // Step 3: Get AccessRightType and AccessRights
			  const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			  const aTypes = aTypeCtx.map(ctx => ctx.getObject());
		  
			  const aAccessFullCtx = await oModel.bindList("/AccessRights").requestContexts();
			  const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());
		  
			  // Step 4: Get all Companies to map BPNumber to Name
			  const aCompaniesCtx = await oModel.bindList("/Companies").requestContexts();
			  const aCompanies = aCompaniesCtx.map(ctx => ctx.getObject());
		  
			  // Step 5: Merge AgentCompanies with AccessRights and Company Names
			  const groupedAccessData = [];

			aCompanies.forEach(company => {
			const bpAccess = aAccessRights.filter(ar => ar.BPNumber === company.BusinessPartnerID);

			const access = {};

			bpAccess.forEach(entry => {
				const type = aTypes.find(t => t.ID === entry.AccessRightType_ID);
				const right = aAccessFull.find(r => r.ID === entry.AccessRights_code);

				if (type && right) {
				if (!access[type.name]) access[type.name] = [];

				access[type.name].push({
					title: right.name,
					effectiveDate: entry.startDate,
					endDate: entry.endDate,
					selected: true
				});
				}
			});

			if (Object.keys(access).length > 0) {
				groupedAccessData.push({
				name: company.Name,
				bpNumber: company.BusinessPartnerID,
				relationBP: bpAccess[0]?.RelationBP_BusinessPartnerID || "",
				access
				});
			}
			});
			 
			  return groupedAccessData;
		  
			} catch (err) {
			  console.error("Failed to load agent access data:", err);
			}
		  },*/
		  loadAgentCompanyAccessRights: async function (sCompanyBPID) {
			try {
			  const oModel = this.getModel("mainModel");
		  
			  // 1. Get all Companies
			  const aCompanyCtx = await oModel.bindList("/Companies").requestContexts();
			  const aCompanies = aCompanyCtx.map(ctx => ctx.getObject());
		  
			  // 2. Get AgentCompanies for the given Company BP
			  const oAgentFilter = new sap.ui.model.Filter("ContractHolderBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
			  const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [oAgentFilter]).requestContexts();
			  const aAgents = aAgentCtx.map(ctx => ctx.getObject());
			  const aAgentBPIds = aAgents.map(a => a.AgentBP_BusinessPartnerID?.trim()).filter(Boolean);
			  // 3. Get all BPAccessRights
			  const aAllAccessCtx = await oModel.bindList("/BPAccessRights").requestContexts();
			  const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());
		  
			  // 4. Filter BPAccessRights: BPNumber == AgentBP_BusinessPartnerID AND RelationBP_BusinessPartnerID == sCompanyBPID
			  const aFilteredAccessRights = aAllAccessRights.filter(entry =>
				aAgentBPIds.includes(entry.BPNumber?.trim()) &&
				entry.RelationBP_BusinessPartnerID?.trim() === sCompanyBPID.trim()
			  );
			  
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
				  bpNumber: agent.AgentBP_BusinessPartnerID,
				  relationBP: sCompanyBPID,
				  access
				};
			  });
		  
			  return aAgentAccessData;
		  
			} catch (err) {
			  console.error("❌ Failed to load company access data:", err);
			  return [];
			}
		  },
		  
		  
		  //AgentCompany End

		  //Contract Holders
		  /*loadContractAccessRights: async function (sCompanyBPID) {
			try {
			  const oModel = this.getModel("mainModel");
		  
			  // 1. Get Contracts for the given company BP
			  const oContractFilter = new sap.ui.model.Filter("Company_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
			  const aContractCtx = await oModel.bindList("/Contracts", null, null, [oContractFilter]).requestContexts();
			  const aContracts = aContractCtx.map(ctx => ctx.getObject());
		  
			  const aContractIDs = aContracts.map(contract => contract.ID);
		  
			  // 2. Get BPAccessRights for the contracts (AgentContrctID === Contract.ID)
			  const aAccessFilters = aContractIDs.map(id =>
				new sap.ui.model.Filter("AgentContrctID", sap.ui.model.FilterOperator.EQ, id)
			  );
			  const oAccessFilter = new sap.ui.model.Filter({ filters: aAccessFilters, and: false });
		  
			  const aAccessCtx = await oModel.bindList("/BPAccessRights", null, null, [oAccessFilter]).requestContexts();
			  const aAccessRights = aAccessCtx.map(ctx => ctx.getObject());
		  
			  // 3. Get AccessRightType and AccessRights static info
			  const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
			  const aTypes = aTypeCtx.map(ctx => ctx.getObject());
		  
			  const aAccessRightsCtx = await oModel.bindList("/AccessRights").requestContexts();
			  const aAccessTitles = aAccessRightsCtx.map(ctx => ctx.getObject());
		  
			  // 4. Merge & format results
			  const aContractAccessData = aContracts.map(contract => {
				const accessRights = aAccessRights.filter(r => r.AgentContrctID === contract.ID);
				const access = {};
		  
				accessRights.forEach(entry => {
				  const type = aTypes.find(t => t.ID === entry.AccessRightType_ID);
				  const title = aAccessTitles.find(r => r.ID === entry.AccessRights_code);
		  
				  if (type && title) {
					if (!access[type.name]) access[type.name] = [];
					access[type.name].push({
					  title: title.name,
					  effectiveDate: entry.startDate,
					  endDate: entry.endDate,
					  selected: true
					});
				  }
				});
		  
				return {
				  name: contract.Name,
				  access
				};
			  });

			 /* console.log('aContractAccessData>>', aContractAccessData);
			  const oContractModel = new sap.ui.model.json.JSONModel({ contracts: aContractAccessData });
			  this.setModel(oContractModel, "contractAccessModel");*/
			  //return aContractAccessData;
		  
			/*} catch (err) {
			  console.error("Failed to load contract access data:", err);
			}
		  },*/

		  loadContractAccessRights: async function (sCompanyBPID) {
			try {
			  const oModel = this.getModel("mainModel");
		  
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
		  
			  // 4. Filter BPAccessRights: BPNumber == AgentBP_BusinessPartnerID AND RelationBP_BusinessPartnerID == sCompanyBPID
			  const aFilteredAccessRights = aAllAccessRights.filter(entry =>
				aAgentBPIds.includes(entry.BPNumber?.trim()) &&
				entry.RelationBP_BusinessPartnerID?.trim() === sCompanyBPID.trim()
			  );
			  
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
				  access
				};
			  });
		  
			  return aAgentAccessData;
		  
			} catch (err) {
			  console.error("Failed to load company CtractHolder access data:", err);
			  return [];
			}
		  },

		  //End Contract Holders
		  loadAllAccessRightsModels: async function (sBPID) {
			try {
			  const [aEnerlineUsers, aAgentUsers, aEndUsers] = await Promise.all([
				this.loadUsersWithAccessDetails(sBPID),
				this.loadAgentCompanyAccessRights(sBPID),
				this.loadContractAccessRights(sBPID)
			  ]);
			  const aCmmRoles = this.loadMainAccessRights();
			  // Optional: load static roles or hardcoded if needed
			 // const aCmmRoles = await this.loadDefaultRoles(); // or use [] if static
		  
			  const oFinalModelAccessRights = {
				enerlineUsers: aEnerlineUsers,
				agentUsers: aAgentUsers,
				endUsers: aEndUsers,
				cmmRoles: aCmmRoles
			  };
			  //console.log("Final Combined Access Rights Object >>>", oFinalModelAccessRights);
		  
			 // const oModelCombined = new sap.ui.model.json.JSONModel(oFinalModelAccessRights);
			  //this.setModel(oModelCombined, "cmmAccessRights");
			  var oAccessModel = new JSONModel(oFinalModelAccessRights);
			  oAccessModel.setSizeLimit(1000);
			  this.setModel(oAccessModel, "cmmAccessRights");
			  //return oFinalModelAccessRights;
		  
			} catch (err) {
			  console.error("Failed to load all access rights:", err);
			}
		  },
		/**
		 * Returns an instance of the semantic helper
		 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
		 */
		getHelper: function () {
			///console.log('test component', sDynamicId);
		
			//var oFCL = this.getRootControl().byId(sDynamicId),
			var oFCL = this.getRootControl().byId("fcl"),
			oParams = new URLSearchParams(window.location.search),
				oSettings = {
					defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
					initialColumnsCount: 2,
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		}
	});
	return Component;
});
