sap.ui.define([], function () {
  "use strict";

  const sBusinessPartnerID = "7000000001"; // Moved outside of return

  return {

    showMessage: function (msg, type = "Information") {
      sap.m.MessageToast.show(msg);
    },

    /*loadUsersWithAccessDetails: async function (sBPID = sBusinessPartnerID) {
      const oModel = this.getModel("mainModel");

      try {
        const aUserCompaniesCtx = await oModel
          .bindList("/UserCompanies", null, null, [
            new sap.ui.model.Filter("CompanyBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sBPID)
          ])
          .requestContexts();

        const aUserCompanies = aUserCompaniesCtx.map(ctx => ctx.getObject());
        const aUserIds = aUserCompanies.map(u => u.ContactBP_ContactBP);

        const aUserFilters = aUserIds.map(bpId =>
          new sap.ui.model.Filter("ContactBP", sap.ui.model.FilterOperator.EQ, bpId)
        );
        const oUserFilter = new sap.ui.model.Filter({ filters: aUserFilters, and: false });

        const aUserCtx = await oModel.bindList("/Users", null, null, [oUserFilter]).requestContexts();
        const aUsers = aUserCtx.map(ctx => ctx.getObject());

        const aAccessFilters = aUserIds.map(bpId =>
          new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, bpId)
        );
        const oAccessFilter = new sap.ui.model.Filter({ filters: aAccessFilters, and: false });

        const aAccessCtx = await oModel.bindList("/BPAccessRights", null, null, [oAccessFilter]).requestContexts();
        const aAccessRights = aAccessCtx.map(ctx => ctx.getObject());

        const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
        const aTypes = aTypeCtx.map(ctx => ctx.getObject());

        const aAccessCtx2 = await oModel.bindList("/AccessRights").requestContexts();
        const aAccessFull = aAccessCtx2.map(ctx => ctx.getObject());

        const aEnerlineUsers = aUsers.map(user => {
          const userAccess = aAccessRights.filter(r => {
            const isSameBP = r.BPNumber === user.ContactBP;
            const isActive = !r.endDate || new Date(r.endDate) >= new Date();
            return isSameBP && isActive;
          });

          const access = {};
          userAccess.forEach(entry => {
            const type = aTypes.find(t => t.code === entry.AccessRights_accessRightType_code);
            const accessEntry = aAccessFull.find(a => a.code === entry.AccessRights_code);
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

          return {
            name: `${user.firstName} ${user.lastName}`,
            bpNumber: `${user.ContactBP}`,
            relationBP: sBPID,
            access
          };
        });

        return aEnerlineUsers;

      } catch (err) {
        console.error("❌ Failed to load user access data:", err);
        return [];
      }
    },

    loadAgentCompanyAccessRights: async function (sCompanyBPID) {
      try {
        const oModel = this.getModel("mainModel");

        const aCompanyCtx = await oModel.bindList("/Companies").requestContexts();
        const aCompanies = aCompanyCtx.map(ctx => ctx.getObject());

        const oAgentFilter = new sap.ui.model.Filter("ContractHolderBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sCompanyBPID);
        const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [oAgentFilter]).requestContexts();
        const aAgents = aAgentCtx.map(ctx => ctx.getObject());
        const aAgentBPIds = aAgents.map(a => a.AgentBP_BusinessPartnerID?.trim()).filter(Boolean);

        const aAllAccessCtx = await oModel.bindList("/BPAccessRights").requestContexts();
        const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());

        const aFilteredAccessRights = aAllAccessRights.filter(entry =>
          aAgentBPIds.includes(entry.BPNumber?.trim()) &&
          entry.RelationBP_BusinessPartnerID?.trim() === sCompanyBPID.trim()
        );

        const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
        const aTypes = aTypeCtx.map(ctx => ctx.getObject());

        const aAccessFullCtx = await oModel.bindList("/AccessRights").requestContexts();
        const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());

        const aAgentAccessData = aAgents.map(agent => {
          const agentAccessRights = aFilteredAccessRights.filter(r => {
            const isSameBP = r.BPNumber === agent.AgentBP_BusinessPartnerID;
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
                id: entry.ID,
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

          return cmmRoles;
        })
        .catch(err => {
          console.error("Error loading roles:", err);
        });
    }*/

  };
});