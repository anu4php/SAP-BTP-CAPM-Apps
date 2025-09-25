sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/DatePicker",
	"sap/m/Select",
	"sap/m/Label",
	"sap/m/CheckBox",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Item",
	"sap/m/Text",
	"sap/m/Button",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/Device"
], function (JSONModel, Controller, Dialog,
	DatePicker,
	Select,
	Label,
	CheckBox,
	MessageToast,
	MessageBox,
	Item,
	Text,
	Button,
	SimpleForm,
	Device) {
	"use strict";

	return Controller.extend("cmmaccessadminrights.controller.Detail", {

		onInit: function () {
			var oExitButton = this.getView().byId("exitFullScreenBtn"),
				oEnterButton = this.getView().byId("enterFullScreenBtn");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();

			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			//this.oRouter.getRoute("list").attachPatternMatched(this._onProductMatched, this);
			this.oTabPath;
			this._setMessageButton(this.byId("footerMsgBtn"));
			if (this.getOwnerComponent().getRouter) {
				this.getOwnerComponent().getRouter().attachRouteMatched(function () {
					if (this._msgPopover && this._msgPopover.isOpen && this._msgPopover.isOpen()) {
						this._msgPopover.close();
					}
				}, this);
			}

		},

		handleFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("detail", { layout: sNextLayout, oBPid: this._oBPid, oTabPath: this.oTabPath });
		},
		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", { layout: sNextLayout, oBPid: this._oBPid, oTabPath: this.oTabPath });
		},
		handleClose: function (event) {
			const oRouter = this.getOwnerComponent().getRouter();
			const bIsPhone = sap.ui.Device.system.phone; // Works even in browser device emulation

			let sLayout = "OneColumn"; // default for phone

			if (!bIsPhone) {
				// Use semantic helper layout for larger devices
				const oFCL = this.getView().getParent().getParent();
				const sNextLayout = oFCL.getModel().getProperty("/actionButtonsInfo/midColumn/closeColumn");
				sLayout = sNextLayout || "OneColumn";
			}

			oRouter.navTo("list", {
				layout: sLayout,
				oBPid: this._oBPid || 0,
				tab: this.oTabPath || "enerlineUsers"
			});
			//Working Button Back
			/*const oHistory = sap.ui.core.routing.History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getOwnerComponent().getRouter().navTo("list", {
				layout: sap.f.LayoutType.OneColumn
				}, true);
			}*/
			//end working back button
			//close button action
			//const oRouter = this.getOwnerComponent().getRouter();
			//	const oFCL = sap.ui.core.Component.getOwnerComponentFor(this.getView()).byId("fcl");

			// Optional: set layout manually in UI
			//	oFCL.setLayout(sap.f.LayoutType.OneColumn); // or TwoColumnsBeginExpanded

			// Also update the route in URL
			/*oRouter.navTo("list", {
				layout: sap.f.LayoutType.OneColumn,
				tab: this.oTabPath || "enerlineUsers" // or LayoutType.TwoColumnsBeginExpanded
			}, true); */// replace URL instead of pushing history
			//end close
		},

		// Button Handlers for "Export Selected", "Terminate All Access", and "Submit Changes"
		onExportSelectedPress: function () {
			const oContext = this.getOwnerComponent().getModel("usersRights").getData(); // or undefined for default model
			const accessData = oContext[this.oTabPath].access;
			const oUsersModel = this.getOwnerComponent().getModel("usersList").getData();
			const sUserName = oUsersModel[this.oTabPath][this._oBPid].name;
			const rolesNew = this.getOwnerComponent().getModel("cmmAccessRights").getData().cmmRoles;

			// CSV Header
			let csvContent = "Category,Access Right,Effective Date,End Date\n";

			(rolesNew || []).forEach(function (category) {
				const catName = category.categoryName;
				const userRights = accessData[catName] || [];

				(category.accessRights || []).forEach(function (right) {
					const matchingRight = userRights.find(data => data.title === right.rightName);
					const isSelected = !!matchingRight;
					const effectiveDate = matchingRight ? matchingRight.effectiveDate : "";
					const endDate = matchingRight ? matchingRight.endDate : "";

					// Only export selected rights
					if (isSelected) {
						const row = `"${catName}","${right.rightName}","${effectiveDate}","${endDate}"\n`;
						csvContent += row;
					}
				});
			});

			// Create and trigger CSV download
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const filename = `${sUserName}_access_export.csv`;
			link.setAttribute("href", URL.createObjectURL(blob));
			link.setAttribute("download", filename);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},
		

		onExportAllPress: function () {
			//get Table data
			this._oBPid = this._oBPid || "0";
			const oPath = this.oTabPath;

			//const oContext = this.getOwnerComponent().getModel("usersRights").getData(); // or undefined for default model
			//const accessData = oContext[this.oTabPath].access;
			const oUsersModel = this.getOwnerComponent().getModel("usersList").getData();
			
			//const oModelData = oPath;
			const oUserData = oUsersModel[this.oTabPath];
			const accessData = oUserData.access;
			console.log(accessData,'test456',oUsersModel);
			//end table data
			const sUserName = "allUsers"; // optional: fallback name
			// CSV Header
			let csvContent = "User Name,Category,Access Right,Effective Date,End Date\n";

			oUserData.forEach(function (user) {
				const userName = user.name;
				const access = user.access || [];
				Object.keys(access).forEach(function (category) {
					const rights = access[category];
					rights.forEach(function (right) {
						// Only export selected rights

						const row = `"${userName}","${category}","${right.title}","${right.effectiveDate}","${right.endDate}"\n`;
						csvContent += row;

					});
				});
			});

			// Create and trigger CSV download
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const filename = `${sUserName}_access_export.csv`;
			link.setAttribute("href", URL.createObjectURL(blob));
			link.setAttribute("download", filename);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},

		onTerminateAllAccessPress234: function () {
			// Logic for terminating all access for the selected user
			const oUserList = this.byId("userList");
			const oSelectedItem = oUserList.getSelectedItem();
			if (!oSelectedItem) {
				sap.m.MessageToast.show("Please select a user to terminate all access.");
				return;
			}

			const oUser = this.getView().getModel("usersModel").getProperty(oSelectedItem.getBindingContext("usersModel").getPath());

			// Assuming access data is an object and we clear it
			oUser.access = {};
			this.getView().getModel("usersModel").refresh();

			sap.m.MessageToast.show("All access terminated for " + oUser.name);
		},

		getAccessMappings: function (oUserData, cmmRoles, sDate) {
			const aResult = [];

			for (const [sCategoryName, aRightsArray] of Object.entries(oUserData)) {
				// Find matching category from cmmRoles
				const oCategory = cmmRoles.find(role => role.categoryName === sCategoryName);
				if (!oCategory) {
					console.warn(`Category not found in cmmRoles: ${sCategoryName}`);
					continue;
				}

				for (const oRightEntry of aRightsArray) {
					const sAccessRightID = oRightEntry.AccessRight_ID;

					// Find access right in that category
					const oAccessRight = oCategory.accessRights.find(
						right => right.accessTypeID === sAccessRightID
					);

					if (!oAccessRight) {
						console.warn(`Access right not found for ID ${sAccessRightID} in category ${sCategoryName}`);
						continue;
					}

					// Push final mapping
					aResult.push({
						categoryID: oCategory.categoryID,
						accessTypeID: oAccessRight.accessTypeID,
						Date: sDate,
						ID: oRightEntry.id,
						/*title: oRightEntry.title,
						effectiveDate: oRightEntry.effectiveDate || null,
						endDate: oRightEntry.endDate || null,
						selected: oRightEntry.selected ?? true*/
					});
				}
			}

			return aResult;
		},

		onTerminateAllAccessPress: async function () {
			const that = this;

			// ---------- PRIVATE message store ----------
			const oMsgsModel = new sap.ui.model.json.JSONModel({ items: [] });
			const aErr = [];

			let oFooterErrBtn; // footer msg button we update

			const updateErrorUI = () => {
				const n = oMsgsModel.getProperty("/items").length;
				if (!oFooterErrBtn) return;

				// show button ONLY when there are errors
				oFooterErrBtn.setVisible(n > 0);

				if (n > 0) {
					oFooterErrBtn.setIcon("sap-icon://message-error");
					oFooterErrBtn.setText(String(n));       // show count
					oFooterErrBtn.setType("Emphasized");
					oFooterErrBtn.setTooltip(`Errors: ${n}`);
				} else {
					// clear visuals when hidden (optional housekeeping)
					oFooterErrBtn.setText("");
					oFooterErrBtn.setType("Transparent");
					oFooterErrBtn.setTooltip("");
				}
			};

			const clearErrors = () => { aErr.length = 0; oMsgsModel.setProperty("/items", []); updateErrorUI(); };
			const pushError = (oCtrl, sText) => { if (oCtrl?.setValueState) { oCtrl.setValueState("Error"); oCtrl.setValueStateText?.(sText); } else { oCtrl?.addStyleClass("invalidField"); } aErr.push({ type: "Error", title: sText }); };
			const flushErrors = () => { oMsgsModel.setProperty("/items", aErr.slice()); updateErrorUI(); };
			const clearFieldError = (oCtrl) => { if (oCtrl?.setValueState) { oCtrl.setValueState("None"); oCtrl.setValueStateText?.(""); } else { oCtrl?.removeStyleClass("invalidField"); } };

			// ---------- data (unchanged) ----------
			const oAccessModel = this.getOwnerComponent().getModel("cmmAccessRights");
			const oPath = this.oTabPath || "enerlineUsers";
			const oTrmType = (oPath === "enerlineUsers") ? "I" : "A";
			const oUsersModel = this.getOwnerComponent().getModel("usersList").getData();
			const oUserData = oUsersModel[this.oTabPath][this._oBPid];
			const sUserName = oUserData?.name;
			const sUserCoName = oUserData?.companyName;
			const oContext = this.getOwnerComponent().getModel("usersRights").getData();
			const oCoId = oContext[oPath].UserCompany_ID;
			console.log('terminate>>', oContext[oPath]);
			const oTrmAccessRights = oContext[oPath].access;
			const oRoleIds = oAccessModel.getProperty("/cmmRoles");

			// ---------- controls ----------
			const today = new Date(); today.setHours(0, 0, 0, 0);
			const oDatePickerTerm = new sap.m.DatePicker({ valueFormat: "yyyy-MM-dd", displayFormat: "long", width: "100%", required: true, minDate: today }).addStyleClass("oDatepickerTerm");
			const oTerminationType = new sap.m.Select({
				width: "100%", required: true, selectedKey: "",
				items: [
					new sap.ui.core.Item({ text: "Please select", key: "" }),
					new sap.ui.core.Item({ text: `Terminate Enerline Access, ${sUserName}`, key: "TEA" }),
					new sap.ui.core.Item({ text: `Terminate Enerline Access and Terminate Relationship, ${sUserName}`, key: "TER" })
				]
			});
			const oAcknowledge = new sap.m.CheckBox({
				selected: false,
				text: `I acknowledge that after clicking on the submit button, ${sUserName} will no longer be able to log into Enerline on behalf of ${sUserCoName} on the effective date shown above.`,
				wrapping: true
			});

			const oForm = new sap.ui.layout.form.SimpleForm({
				layout: "ResponsiveGridLayout", editable: true, labelSpanM: 4,
				content: [
					new sap.m.Text({ text: `This action will terminate all Enerline access for ${sUserName} on behalf of ${sUserCoName}.`, wrapping: true }),
					new sap.m.Label({ text: "Effective Date *" }), oDatePickerTerm,
					new sap.m.Label({ text: "Termination Type *" }), oTerminationType,
					oAcknowledge
				]
			});

			// ---------- dialog ----------
			const oDialog = new sap.m.Dialog({
				title: "Terminate all Access", icon: "sap-icon://confirm",
				type: "Message", state: "Success", contentWidth: "550px",
				content: [oForm]
			}).addStyleClass("otermallaccess");

			oDialog.attachAfterClose(() => { clearErrors(); oDialog.destroy(); });

			// MessagePopover bound to local model
			const oMsgPopover = new sap.m.MessagePopover({
				items: {
					path: "termAll>/items",
					template: new sap.m.MessagePopoverItem({ type: "{termAll>type}", title: "{termAll>title}", description: "{termAll>description}" })
				}
			}).setModel(oMsgsModel, "termAll");
			oDialog.addDependent(oMsgPopover);

			// ---------- validation ----------
			const validate = () => {
				clearErrors();
				[oDatePickerTerm, oTerminationType, oAcknowledge].forEach(clearFieldError);

				let ok = true;
				const sDate = oDatePickerTerm.getValue();
				const sType = oTerminationType.getSelectedKey();
				const bAck = oAcknowledge.getSelected();

				if (!sDate) { ok = false; pushError(oDatePickerTerm, "Effective Date is required."); }
				else {
					const d = oDatePickerTerm.getDateValue?.();
					if (d && d < today) { ok = false; pushError(oDatePickerTerm, "Effective Date cannot be in the past."); }
				}
				if (!sType) { ok = false; pushError(oTerminationType, "Termination Type is required."); }
				if (!bAck) { ok = false; pushError(oAcknowledge, "Acknowledgement is required."); }

				flushErrors();
				return ok;
			};
			oDatePickerTerm.attachChange(validate);
			oTerminationType.attachChange(validate);
			oAcknowledge.attachSelect(validate);

			// ===== Footer buttons (use ONLY the 'buttons' aggregation) =====
			oDialog.removeAllButtons();

			// 1) Error-count button (left of Submit)
			/*oFooterErrBtn = new sap.m.Button({
			  icon:"sap-icon://message-popup", text:"", type:"Transparent",
			  press: function(){ validate(); oMsgPopover.openBy(oFooterErrBtn); }
			});*/

			oFooterErrBtn = new sap.m.Button({
				icon: "sap-icon://message-error",
				text: "",
				type: "Transparent",
				tooltip: "",
				visible: false,                     // << start hidden
				press: () => {
					validate();
					const n = oMsgsModel.getProperty("/items").length;
					if (n > 0) { oMsgPopover.openBy(oFooterErrBtn); }
				}
			});
			oFooterErrBtn.addStyleClass("msgerrpop");
			oDialog.addButton(oFooterErrBtn);

			// 2) Submit
			const oSubmitBtn = new sap.m.Button({
				text: "Submit", type: "Emphasized",
				press: async function () {
					oDialog.addStyleClass("sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer");
					if (!validate()) {
						if (!oDatePickerTerm.getValue()) { oDatePickerTerm.focus(); }
						else if (!oTerminationType.getSelectedKey()) { oTerminationType.focus(); }
						else { oAcknowledge.focus(); }
						return;
					}

					const sDate = oDatePickerTerm.getValue();
					const sType = oTerminationType.getSelectedKey();
					const aMappedAccess = that.getAccessMappings(oTrmAccessRights, oRoleIds, sDate);
					console.log('aMappedAccess', aMappedAccess);

					const oPayloadTerm = {
						ID: crypto.randomUUID(), BPId: oUserData?.bpNumber, Name: sUserName,
						AccessType: oTrmType, Date: sDate, TerminationType: sType,
						TerminationType_text: "true", RelationBP: oUserData?.relationBP, Status: "Active"
					};

					const oModel = that.getView().getModel("mainModel");

					try {
						const oBinding = oModel.bindList("/BPAccessTermination", undefined, undefined, undefined, { $$groupId: "submitGroup" });
						await oBinding.create(oPayloadTerm);
						const oSetUserTbl = oPath === "enerlineUsers"? `UserAccessRights` : `AgentAccessRights`;
						for (const access of aMappedAccess) {
							const sUpdatePath = `/${oSetUserTbl}(ID='${access.ID}')`;
							const oCtxBinding = oModel.bindContext(sUpdatePath, null, { $$groupId: "submitGroup" });
							const oBoundCtx = oCtxBinding.getBoundContext();
							if (oBoundCtx) { oBoundCtx.setProperty("endDate", sDate); }
						}

						if (sType === "TER") {
							if (oPath === "enerlineUsers") {
								await that.getUserCompanyDt(oCoId, oUserData?.bpNumber, oUserData?.relationBP, sDate);
							} else {
								await that.getAgentCompanyDt(oCoId, oUserData?.bpNumber, oUserData?.relationBP, sDate);
							}
						}

						try {
							await oModel.submitBatch("submitGroup");
							await oModel.refresh();

							const oAccessModelR = that.getOwnerComponent().getModel("usersRights");
							oAccessModelR.refresh(true);
							await that._onProductMatched(that._reloadRouteEvent());

							clearErrors();
							oDialog.close();

							new sap.m.Dialog({
								type: "Message", draggable: false, resizable: false, contentWidth: "40%",
								title: "Request received", icon: "sap-icon://message-success",
								content: new sap.m.Text({ text: "Your changes have been saved. Users affected by the change may need to log out of Enerline in order to activate the changes.\n\nThank you for using Enerline." }),
								beginButton: new sap.m.Button({ text: "Close", press: function () { this.getParent().close(); } })
							}).open();
						} catch (err) {
							clearErrors(); pushError(oFooterErrBtn, "Failed to submit changes."); flushErrors();
							sap.m.MessageToast.show("Failed to submit changes."); jQuery.sap.log.error(err);
						}
					} catch (err) {
						clearErrors(); pushError(oFooterErrBtn, "Failed to create termination record."); flushErrors();
						jQuery.sap.log.error(err);
					}
				}
			});
			oDialog.addButton(oSubmitBtn);

			// 3) Cancel
			const oCancelBtn = new sap.m.Button({
				text: "Cancel",
				press: function () { clearErrors(); oDialog.close(); }
			});
			oDialog.addButton(oCancelBtn);

			// initial UI sync
			updateErrorUI();

			oDialog.open();
		},

		getAgentCompanyDt: async function (oCoId,bpNumber, relationBP, sDate) {
			const that = this;
			//const oModel = that.getModel("mainModel"); // or your relevant model
			const oModel = that.getView().getModel("mainModel");
			const oFilter1 = new sap.ui.model.Filter("AgentBP_ID", sap.ui.model.FilterOperator.EQ, oCoId);
			//const oFilter2 = new sap.ui.model.Filter("ContractHolderBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, relationBP);
			// Combine filters with AND
			const userFilter = new sap.ui.model.Filter([oFilter1], true); // `true` = AND
			// Bind list with filter
			const oBindAGVal = oModel.bindList("/AgentCompanies", undefined, undefined, userFilter);
			try {
				const aContexts = await oBindAGVal.requestContexts();
				const aResults = aContexts.map(ctx => ctx.getObject());
				console.log("Read AgentCompanies:", aResults[0].ValidFrom);
				const sUpdatePathC = `/AgentCompanies(ID='${oCoId}',ValidFrom=${aResults[0].ValidFrom})`;
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
		getUserCompanyDt: async function (oCoId, bpNumber, relationBP, sDate) {
			const that = this;
			//const oModel = that.getModel("mainModel"); // or your relevant model
			const oModel = that.getView().getModel("mainModel");
			const oFilter1 = new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, oCoId);
			//const oFilter2 = new sap.ui.model.Filter("CompanyBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, relationBP);
			// Combine filters with AND
			const userFilter = new sap.ui.model.Filter([oFilter1], true); // `true` = AND
			// Bind list with filter
			const oBindAGVal = oModel.bindList("/UserCompanies", undefined, undefined, userFilter);
			try {
				const aContexts = await oBindAGVal.requestContexts();
				const aResults = aContexts.map(ctx => ctx.getObject());
				console.log("Read UserCompanies:", aResults[0].ValidFrom);
				const sUpdatePathA = `/UserCompanies(ID='${oCoId}',ValidFrom=${aResults[0].ValidFrom})`;
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
				console.error("Error reading UserCompanies:", err);
			}
		},

		onSubmitChangesPress: async function () {
			try {
				const _fmtISO = (d) => {
					const yyyy = d.getFullYear();
					const mm = String(d.getMonth() + 1).padStart(2, "0");
					const dd = String(d.getDate()).padStart(2, "0");
					return `${yyyy}-${mm}-${dd}`;
				};

				// Convert anything -> ISO ("yyyy-MM-dd")
				// Accepts Date, "yyyy-MM-dd", or "MMM, dd, yyyy" (e.g., "Aug, 13, 2025")
				const _toISO = (val) => {
					if (!val) return "";
					if (val instanceof Date && !isNaN(val)) return _fmtISO(val);

					if (typeof val === "string") {
						const s = val.trim();
						if (!s) return "";

						if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO

						const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MMM, dd, yyyy" });
						const d1 = fmt.parse(s);
						if (d1 instanceof Date && !isNaN(d1)) return _fmtISO(d1);

						const d2 = new Date(s); // last resort
						if (!isNaN(d2)) return _fmtISO(d2);
					}
					return "";
				};

				// Prefer Text/Input value; else DatePicker.value/dateValue
				const readDatePreferringText = (ctrl) => {
					try {
						if (ctrl instanceof sap.m.Text) {
							const iso = _toISO(ctrl.getText());
							if (iso) return iso;
						}
						if (ctrl instanceof sap.m.Input) {
							const iso = _toISO(ctrl.getValue && ctrl.getValue());
							if (iso) return iso;
						}
						if (ctrl instanceof sap.m.DatePicker) {
							let iso = _toISO(ctrl.getValue && ctrl.getValue());
							if (iso) return iso;
							iso = _toISO(ctrl.getDateValue && ctrl.getDateValue());
							if (iso) return iso;
						}
						// If your cell is a container (rare), scan children once
						if (ctrl && ctrl.getItems) {
							for (const child of ctrl.getItems()) {
								const iso = readDatePreferringText(child);
								if (iso) return iso;
							}
						}
					} catch (e) { }
					return "";
				};


				// alert("✅ Submit triggered");
				const oMainModel = this.getView().getModel("mainModel");
				const oAccessModel = this.getOwnerComponent().getModel("cmmAccessRights");
				const oPath = this.oTabPath || "enerlineUsers";
				const sPath = "/" + oPath + "/" + this._oBPid;
				const oUserDataright = oAccessModel.getProperty(sPath);
				const oSetUserTbl = this.oTabPath === "enerlineUsers"? "UserAccessRights" : "AgentAccessRights";
				//const oSetTblC = this.oTabPath === "enerlineUsers"? "UserCompany_ID: `$oUserData.bpNumber'," : "AgentCompany_ID: `$oUserData.bpNumber',";

				const oUsersModel = this.getOwnerComponent().getModel("usersList").getData();
				const oUserData = oUsersModel[this.oTabPath][this._oBPid];
				console.log('oUserData99>',oUserData);

				const oContext = this.getOwnerComponent().getModel("usersRights").getData();
				const accessData = oContext[oPath].access;

				const getDateValue = (oControl) => {
					if (oControl instanceof sap.m.Input) return oControl.getValue();
					if (oControl instanceof sap.m.Text) return oControl.getText();
					return null;
				};

				const oOldRights = accessData;
				const oTableContainer = this.byId("accessContainer2");
				const aPanels = oTableContainer.getItems();

				const aNewCreates = [];
				const aUpdates = [];
				const aDeselected = [];
				let bInputChangedWithoutCheckbox = false;

				for (const oPanel of aPanels) {
					//const sCategory = oPanel.getHeaderText();


					const oHeaderHBox = oPanel.getHeaderToolbar().getContent()[0]; // HBox
					// Get the Title control from the HBox
					const oTitle = oHeaderHBox.getItems()[0]; // sap.m.Title
					// Get the text from the Title
					const sCategory = oTitle.getText();
					console.log("category:", sCategory);

					const oTable = oPanel.getContent()[0];
					const aItems = oTable.getItems();

					for (const oItem of aItems) {
						//const [oCheckBox, oEffectiveDateCtrl, oEndDateCtrl] = oItem.getCells();
						//const [oCheckBox, oEffCell, oEndCell] = oItem.getCells();
						const aCells = oItem.getCells();

						// Always assume cells: [CheckBox, EffectiveDateControl, EndDateControl]
						const oCheckBox = aCells[0];
						const oEffectiveControl = aCells[1];
						const oEndControl = aCells[2];
						console.log(oEffectiveControl, '<<Dates>>', oEndControl);
						const sRightName = oCheckBox.getProperty("text");
						const oCategory = oAccessModel.getProperty("/cmmRoles").find(cat => cat.categoryName === sCategory);
						const oRight = oCategory?.accessRights.find(r => r.rightName === sRightName);
						const sCategoryId = oCategory?.categoryID;
						const oRightID = oRight.accessTypeID;

						const bSelected = oCheckBox.getSelected();
						// Read dates: prefer Text/Input; else DatePicker (value/dateValue). Always ISO.
						const sEffectiveDate = readDatePreferringText(oEffectiveControl);
						const sEndDate = readDatePreferringText(oEndControl);


						console.log(sEffectiveDate, 'Dates for access rights', sEndDate);

						const oCheckSelcid = oCheckBox.getCustomData().find(cd => cd.getKey() === "id")?.getValue();
						const [oCheckBPid, oCompID] = oCheckSelcid.split("_");
						console.log('oCheckBPid>>', oCheckBPid);
						const oOldEntry = oOldRights[sCategory]?.find(a => a.id === oCheckBPid);

						const oSetTblC = this.oTabPath === "enerlineUsers" ? "UserCompany_ID" : "AgentCompany_ID";

						// CREATE
						if (bSelected && !oOldEntry) {
							console.log("📌 Preparing CREATE:", sRightName, sEffectiveDate, sEndDate);
							aNewCreates.push({
								ID: crypto.randomUUID(),
								[oSetTblC]: oCompID,
								//RelationBP_BusinessPartnerID: oUserData.relationBP,
								AccessRights_accessRightType_code: sCategoryId,
								AccessRights_code: oRightID,
								startDate: sEffectiveDate,
								//endDate: sEndDate
							});


						}
						// UPDATE
						else if (bSelected && oOldEntry) {
							const isStartDateChanged = oOldEntry.effectiveDate !== sEffectiveDate;
							const isEndDateChanged = oOldEntry.endDate !== sEndDate;
							if ((isStartDateChanged && sEffectiveDate) || (isEndDateChanged && sEndDate)) {
								console.log("✏️ Preparing UPDATE:", oCheckBPid, sEffectiveDate, sEndDate);
								aUpdates.push({
									ID: oCheckBPid,
									startDate: sEffectiveDate,
									endDate: sEndDate
								});
							}
						}
						// DESELECTED
						else if (!bSelected && oOldEntry) {

							aDeselected.push({
								ID: oCheckBPid,
								startDate: sEffectiveDate,
								//endDate: sEndDate || new Date().toISOString().split("T")[0],
								endDate: new Date().toISOString().split("T")[0],
								status: "deactivated"
							});
							//console.log('aDeselected', aDeselected);
							//console.log("❌ Preparing DEACTIVATE:", oCheckBPid);
						}



						// VALIDATION: input changed but checkbox not selected
						/*if (!bSelected && (!oOldEntry || oOldEntry.effectiveDate !== sEffectiveDate || oOldEntry.endDate !== sEndDate)) {
						  if ((sEffectiveDate && sEffectiveDate !== "") || (sEndDate && sEndDate !== "")) {
							bInputChangedWithoutCheckbox = true;
						  }
						}*/

						if (!bSelected && !oOldEntry && (sEffectiveDate || sEndDate)) {
							bInputChangedWithoutCheckbox = true;
						}
					}
				}

				if (aNewCreates.length === 0 && aUpdates.length === 0 && aDeselected.length === 0) {
					//sap.m.MessageBox.error("Please select the checkbox to save changes.");
					this._showMessageDialog("Error", "Please select the checkbox to save changes.");
					return;
				}
				if (bInputChangedWithoutCheckbox) {
					this._showMessageDialog("Error", "You've modified access dates without selecting the checkbox. Please select the checkbox to apply the changes.");
					return;
				}
				/* if (bInputChangedWithoutCheckbox && aDeselected.length === 0) {
				   sap.m.MessageBox.error("Please select the checkbox for the modified access right(s).");
				   return;
				 }*/
				// Log changes
				console.log("✅ New Creates:", aNewCreates);
				console.log("✏️ Updates (changed dates):", aUpdates);
				console.log("❌ Deselected:", aDeselected);
				// CREATE
				if (aNewCreates.length > 0) {
					for (const createObj of aNewCreates) {
						try {
							
							const oBinding = oMainModel.bindList(`/${oSetUserTbl}`, undefined, undefined, undefined, {
								$$groupId: "submitGroup"
							});
							oBinding.create(createObj);
						} catch (e) {
							console.error("❌ CREATE failed:", e);
						}
					}
				}
				// UPDATE
				if (aUpdates.length > 0) {
					for (const updateObj of aUpdates) {

						try {
							
							const sUpdatePath = `/${oSetUserTbl}(ID='${updateObj.ID}')`;

							const oContextBinding = oMainModel.bindContext(sUpdatePath, null, {
								$$groupId: "submitGroup"
							});

							const oBoundContext = oContextBinding.getBoundContext();

							if (oBoundContext) {
								const oSTdate = updateObj ? `${updateObj.startDate}` : null;
								const oEDdate = updateObj ? `${updateObj.endDate}` : null;
								//const oEdr = oEDdate ? oEDdate === "" : null;
								const oSTdr = oSTdate && oSTdate === "" ? null : oSTdate;
								const oEdr = oEDdate && oEDdate === "" ? null : oEDdate;
								console.log(oEdr);
								console.log(oSTdr, 'HHHHH', oEdr);
								if (oSTdr === "" || oSTdr.trim() === "") {
									oBoundContext.setProperty("startDate", null);
								} else {
									oBoundContext.setProperty("startDate", oSTdr);
								}
								if (oEdr === "" || oEdr.trim() === "" || oEdr === null) {
									oBoundContext.setProperty("endDate", null);
								} else {
									oBoundContext.setProperty("endDate", oEDdate);

								}

							} else {
								console.warn("⚠️ No bound context found for update path:", sUpdatePath);
							}


						} catch (e) {
							console.error("❌ UPDATE failed for ID:", updateObj.ID, e);
						}
					}

				}//if update length check

				// DEACTIVATE
				if (aDeselected.length > 0) {
					for (const deactivated of aDeselected) {
						try {

							const sUpdatePath = `/${oSetUserTbl}(ID='${deactivated.ID}')`; // Use key-based URL format

							const oContextBinding = oMainModel.bindContext(sUpdatePath, null, {
								$$groupId: "submitGroup"
							});

							const oBoundContext = oContextBinding.getBoundContext();
							if (oBoundContext) {
								// Update the property/field (like endDate or accessStatus)
								// oBoundContext.setProperty("endDate", deactivated.endDate);  // or any other field you need
								oBoundContext.setProperty("startDate", deactivated.startDate || null);
								oBoundContext.setProperty("endDate", deactivated.endDate || null);
								// oBoundContext.setProperty("status", "deactivated");
							} else {
								console.warn("Failed to bind context for ID:", deactivated.endDate);
							}


						} catch (error) {
							console.error("❌ Error during deactivation:", deactivated.ID, error);
						}
					}
				}//if deactivated length check

				// SUBMIT
				try {
					await oMainModel.submitBatch("submitGroup");
					await oMainModel.refresh();
					//this._onProductMatched();
					//await this._onSelectUserAccess(this._oBPid, this.oTabPath);
					const oAccessModelc = this.getOwnerComponent().getModel("usersRights");
					oAccessModelc.refresh(true);
					await this._onProductMatched(this._reloadRouteEvent());
					//sap.m.MessageBox.success("Access rights changes submitted successfully.");
					this._showMessageDialog("Success", "Access rights changes submitted successfully.");

					/*setTimeout(() => {
						//const oRouter = this.getOwnerComponent().getRouter();
					  
						this.getOwnerComponent().getRouter().navTo("detail", {
							layout: "TwoColumnsMidExpanded",
							oBPid: this._oBPid,
						  oTabPath: this.oTabPath
						}, true); // 🔁 reload current mid column view
					  }, 100);*/
				} catch (err) {
					console.error("Batch submission failed:", err);
					//sap.m.MessageBox.error("Failed to submit access right changes.");
					/*setTimeout(() => {
						sap.m.MessageBox.error("Failed to submit access right changes.");
					  }, 0);*/

					this._showMessageDialog("Error", "Failed to submit access right changes");

				}

			} catch (outerErr) {
				console.error("Something went wrong in submitChanges handler:", outerErr);
				//sap.m.MessageBox.error("Unexpected error during submission. Check console logs.");
				this._showMessageDialog("Error", "Unexpected error during submission. Check console logs.");
			}
		},
		//Reloading submit actions
		_reloadRouteEvent: function () {
			return {
				getParameter: function (sParam) {
					if (sParam === "arguments") {
						return {
							oBPid: this._oBPid,
							oTabPath: this.oTabPath
						};
					}
					return null;
				}.bind(this), // Important to bind 'this' context!
				getParameters: function () {
					return {
						arguments: {
							oBPid: this._oBPid,
							oTabPath: this.oTabPath
						}
					};
				}.bind(this)
			};
		},

		//Message Poupover
		_showMessageDialog: function (sType, sMessage, sTitle = "") {
			const oDialog = new sap.m.Dialog({
				title: sTitle || (sType === "Success" ? "Success" : "Error"),
				type: "Message",
				state: sType, // "Success" or "Error" or "Warning" or "Information"
				content: new sap.m.Text({ text: sMessage }),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						oDialog.close();
					}
				})
			});
			oDialog.open();
		},
		//message end

		onUpdatePatchTest: async function () {
			const oModel = this.getView().getModel("mainModel");

			const sID = "57ce39b8-c3c5-4227-bbf5-cb163284519b"; // Replace with real UUID
			const sPath = `/BPAccessRights(ID='${sID}')`;
			const sNewDate = "2025-08-01";

			const oContext = oModel.bindContext(sPath, null, {
				$$groupId: "submitGroup"
			});

			await oContext.requestObject();

			// ✅ Use setProperty on model with context
			oModel.setProperty("endDate", sNewDate, oContext);

			// ✅ Confirm pending changes
			console.log("Has pending changes:", oModel.hasPendingChanges()); // must be true

			try {
				await oModel.submitBatch("submitGroup");
				console.log("✅ PATCH sent to backend!");
			} catch (err) {
				console.error("❌ PATCH failed:", err);
			}
		},

		// 🧩 Simple UID generator
		_generateUID: function () {
			return "ID-" + Date.now();
		},
		onListItemPress: function (oEvent) {
			const oItem = oEvent.getParameter
				? oEvent.getParameter("listItem")
				: oEvent; // fallback if passed directly

			if (!oItem) return;

			const sPath = oItem.getBindingContext("cmmAccessRights").getPath();
			const oUser = this.getView().getModel("usersRights").getProperty(sPath);

			if (oUser) {
				this.byId("detailPage").setTitle("Access for " + oUser.name);
				this._renderAccess(oUser.access);
			}
		},
		_oCurrentUserAdminChk: async function (tabVal) {
			const aCheckRightCtx = this.getOwnerComponent().getModel("oCurUserRightChk").getData();
			const today = new Date();


			const oAccessRight = aCheckRightCtx.find(obj => {
				const sDate = new Date(obj.startDate);
				const eDate = obj.endDate ? new Date(obj.endDate) : null;
				const isValidToday = (!sDate || today >= sDate) && (!eDate || today <= eDate);
				return obj.AccessRights_code === "A25" && isValidToday;
			});
			const bVisible1 = (tabVal !== "endUsers");
			const bVisible2 = !!oAccessRight ;
			const bVisible = bVisible1 && bVisible2 ;
			return bVisible;
		},
		_oSetButtHide: function (tabVal) {
			const aCheckRightCtx = this.getOwnerComponent().getModel("oCurUserRightChk").getData();
			const today = new Date();

			const oAccessRight = aCheckRightCtx.find(obj => {
				const sDate = new Date(obj.startDate);
				const eDate = obj.endDate ? new Date(obj.endDate) : null;
				const isValidToday = (!sDate || today >= sDate) && (!eDate || today <= eDate);
				return obj.AccessRights_code === "A25" && isValidToday;
			});

			const bVisible = !!oAccessRight;
			//this.byId("editButton").setVisible(bVisible);

			const oButtonExp = this.byId("exportSelectedButton");
			const oButtonTerAll = this.byId("terminateAllAccessButton");
			const oButtonExpSub = this.byId("submitChangesButton");
			//const oBbutExp = tabVal === "endUsers"? oButtonExp.setVisible(false) : oButtonExp.setVisible(bVisible);
			const oButTerm = tabVal === "endUsers" ? oButtonTerAll.setVisible(false) : oButtonTerAll.setVisible(bVisible);
			const oButExp = tabVal === "endUsers" ? oButtonExpSub.setVisible(false) : oButtonExpSub.setVisible(bVisible);
			this.byId("accessTitle1").setVisible(true);
			this.byId("exportSelectedButton").setVisible(true);
			this.byId("exportAllButton").setVisible(true);

		},

		//New version of the model
		//As per tabs fetching user list start
		/*loadEnerlineUsersAcsRights: async function (sBusinessPartnerID, bpId) {
			const oModel = this.getView().getModel("mainModel");

			try {
				// Step 1: Get all UserCompanies under Company BP
				const aUserCompaniesCtx = await oModel
					.bindList("/UserCompanies", null, null, [
						new sap.ui.model.Filter("CompanyBP_ID", sap.ui.model.FilterOperator.EQ, sBusinessPartnerID)
					])
					.requestContexts();

				const aUserCompanies = aUserCompaniesCtx.map(ctx => ctx.getObject());

				// Optional: filter to only specific bpId (ContactBP)
				const aFilteredUserCompanies = bpId
					? aUserCompanies.filter(u => u.ContactBP_ID === bpId)
					: aUserCompanies;

				const aUserIds = aFilteredUserCompanies.map(u => u.ContactBP_ID);

				if (aUserIds.length === 0) {
					console.warn("No matching user IDs found.");
					return [];
				}

				// Step 2: Get Users
				const aUserFilters = aUserIds.map(bp =>
					new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, bp)
				);
				const oUserFilter = new sap.ui.model.Filter({ filters: aUserFilters, and: false });

				const aUserCtx = await oModel.bindList("/Users", null, null, [oUserFilter]).requestContexts();
				const aUsers = aUserCtx.map(ctx => ctx.getObject());

				// Step 3: Get Access Rights
				const aAccessFilters = aUserIds.map(bp =>
					new sap.ui.model.Filter("UserCompany_ID", sap.ui.model.FilterOperator.EQ, bp)
				);
				const oAccessFilter = new sap.ui.model.Filter({ filters: aAccessFilters, and: false });

				const aAccessCtx = await oModel.bindList("/UserAccessRights", null, null, [oAccessFilter]).requestContexts();
				const aAccessRights = aAccessCtx.map(ctx => ctx.getObject());

				// Step 4: Access Right Types and Definitions
				const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
				const aTypes = aTypeCtx.map(ctx => ctx.getObject());

				const aAccessCtx2 = await oModel.bindList("/AccessRights").requestContexts();
				const aAccessFull = aAccessCtx2.map(ctx => ctx.getObject());

				// Step 5: Format Final Output
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
						bpNumber: `${user.ID}`,
						relationBP: sBusinessPartnerID,
						access
					};
				});

				// Return only the first matched user if bpId was passed
				if (bpId && aEnerlineUsers.length > 0) {
					return aEnerlineUsers[0]; // return object not array
				}

				return aEnerlineUsers;
			} catch (err) {
				console.error("Failed to load user access data:", err);
			}
		}*/

		//get Company Id
		getUserCompanyId: async function (oUserContactBp, oUserCompanyBp ) {
		// models & helpers
		const oModel = this.getView().getModel("mainModel");
		const aCompanyCtx = await oModel.bindList("/UserCompanies", null, null, [
			new sap.ui.model.Filter("ContactBP_ID", sap.ui.model.FilterOperator.EQ, oUserContactBp),
			new sap.ui.model.Filter("CompanyBP_ID", sap.ui.model.FilterOperator.EQ, oUserCompanyBp)
		  ]).requestContexts();
		const sCompanyData = aCompanyCtx.length ? aCompanyCtx[0].getObject() : null;
		const sCompanyId = sCompanyData.ID;  
		console.log('UserCo>>', sCompanyId);
		
		  return sCompanyId;

		},
		

		loadEnerlineUsersAcsRights: async function (sBusinessPartnerID, bpId) {
			const oModel = this.getView().getModel("mainModel");

			try {
				//get company Id for selected user
				const oGetCoId = await this.getUserCompanyId(bpId, sBusinessPartnerID);
				console.log('oGetCoId', oGetCoId);
				// Step 1: Get all UserCompanies under Company BP
				const aUserCompaniesCtx = await oModel
					.bindList("/UserCompanies", null, null, [
						new sap.ui.model.Filter("CompanyBP_ID", sap.ui.model.FilterOperator.EQ, sBusinessPartnerID)
					])
					.requestContexts();

				const aUserCompanies = aUserCompaniesCtx.map(ctx => ctx.getObject());

				// Optional: filter to only specific bpId (ContactBP)
				const aFilteredUserCompanies = bpId
					? aUserCompanies.filter(u => u.ContactBP_ID === bpId)
					: aUserCompanies;

				const aUserIds = aFilteredUserCompanies.map(u => u.ContactBP_ID);     // Users.ID == ContactBP_ID (GUID)
				const aUserCompanyIds = aFilteredUserCompanies.map(u => u.ID);        // <-- needed for FK join

				if (aUserIds.length === 0) {
					console.warn("No matching user IDs found.");
					return [];
				}

				// Step 2: Get Users
				const aUserFilters = aUserIds.map(bp =>
					new sap.ui.model.Filter("ID", sap.ui.model.FilterOperator.EQ, bp)
				);
				const oUserFilter = new sap.ui.model.Filter({ filters: aUserFilters, and: false });

				const aUserCtx = await oModel.bindList("/Users", null, null, [oUserFilter]).requestContexts();
				const aUsers = aUserCtx.map(ctx => ctx.getObject());

				// Step 3: Get Access Rights
				// FIX: join by UserCompany_ID (FK), not user IDs
				const aAccessFilters = aUserCompanyIds.map(ucId =>
					new sap.ui.model.Filter("UserCompany_ID", sap.ui.model.FilterOperator.EQ, ucId)
				);
				const oAccessFilter = new sap.ui.model.Filter({ filters: aAccessFilters, and: false });

				// keep only not-expired (endDate >= today)
				const today = new Date(); today.setHours(0, 0, 0, 0);
				const sToday = today.toISOString().split("T")[0];

				const aAccessCtx = await oModel.bindList("/UserAccessRights", null, null, [
					oAccessFilter,
					new sap.ui.model.Filter("endDate", sap.ui.model.FilterOperator.GE, sToday)
				]).requestContexts();

				const aAccessRights = aAccessCtx.map(ctx => ctx.getObject());

				// Step 4: Access Right Types and Definitions
				const aTypeCtx = await oModel.bindList("/AccessRightType").requestContexts();
				const aTypes = aTypeCtx.map(ctx => ctx.getObject());

				const aAccessCtx2 = await oModel.bindList("/AccessRights").requestContexts();
				const aAccessFull = aAccessCtx2.map(ctx => ctx.getObject());

				// Step 5: Format Final Output
				const aEnerlineUsers = aUsers.map(user => {
					// pick this user's UserCompany (prefer DefaultIndicator when multiple)
					const aUCs = aFilteredUserCompanies.filter(uc => uc.ContactBP_ID === user.ID);
					const oUC = aUCs.find(uc => uc.DefaultIndicator) || aUCs[0] || null;

					const userAccess = aAccessRights.filter(r => {
						const isSameUC = r.UserCompany_ID === oUC.ID;   // <-- correct FK match
						const isActive = !r.endDate || new Date(r.endDate) >= today;
						return isSameUC && isActive;
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
								UserCompany_ID: entry.UserCompany_ID,
								effectiveDate: entry.startDate,
								endDate: entry.endDate,
								selected: true
							});
						}
					});

					return {
						name: `${user.firstName} ${user.lastName}`,
						bpNumber: bpId,
						UserCompany_ID: oGetCoId,
						relationBP: sBusinessPartnerID,
						access
					};
				});

				// Return only the first matched user if bpId was passed
				if (bpId && aEnerlineUsers.length > 0) {
					return aEnerlineUsers[0]; // return object not array
				}

				return aEnerlineUsers;
			} catch (err) {
				console.error("Failed to load user access data:", err);
			}
		},
		//Get Agent Company Id
		getAgentCompanyId: async function (oUserContactBp, oUserCompanyBp ) {
		// models & helpers
		const oModel = this.getView().getModel("mainModel");
		const aCompanyCtx = await oModel.bindList("/AgentCompanies", null, null, [
			new sap.ui.model.Filter("AgentBP_ID", sap.ui.model.FilterOperator.EQ, oUserContactBp),
			new sap.ui.model.Filter("ContractHolderBP_ID", sap.ui.model.FilterOperator.EQ, oUserCompanyBp)
		  ]).requestContexts();
		const sCompanyData = aCompanyCtx.length ? aCompanyCtx[0].getObject() : null;
		const sCompanyId = sCompanyData.ID;  
		console.log('UserCo>>', sCompanyId);
		
		  return sCompanyId;

		},

		loadSingleAgentCompanyAccess: async function (sCompanyBPID, bpId) {
			try {
				const oModel = this.getView().getModel("mainModel");

				//get company Id for selected user
				//const oGetCoId = await this.getAgentCompanyId(bpId, sCompanyBPID);
				console.log(sCompanyBPID, 'oGetCoId', bpId);

				// 1. Fetch AgentCompany by exact BP ID and relation
				const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [
					new sap.ui.model.Filter("ContractHolderBP_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID),
					//new sap.ui.model.Filter("AgentBP_ID", sap.ui.model.FilterOperator.EQ, bpId)
				]).requestContexts();
				const aAgents = aAgentCtx.map(ctx => ctx.getObject());
				const aAgentBPIds = aAgents.map(a => a.ID?.trim()).filter(Boolean);
				const agent = aAgentCtx.length ? aAgentCtx[0].getObject() : null;
				
				if (!agent) {
					console.warn("No matching AgentCompany found.");
					return null;
				}
				
				// 2. Get matching BPAccessRights (active + correct company + correct agent)
				/*const aAccessCtx = await oModel.bindList("/AgentAccessRights", null, null, [
					//new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, bpId),
					new sap.ui.model.Filter("AgentCompany_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID)
				]).requestContexts();
				const aAccessRights = aAccessCtx
					.map(ctx => ctx.getObject())
					.filter(entry => !entry.endDate || new Date(entry.endDate) >= new Date());*/
				
				const aAllAccessCtx = await oModel.bindList("/AgentAccessRights").requestContexts();
				const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());

				const aAccessRights = aAllAccessRights.filter(entry => {
				//aAgentBPIds.includes(entry.AgentCompany_ID?.trim() && !entry.endDate || new Date(entry.endDate) >= new Date())
				const isSameBP = entry.AgentCompany_ID === bpId;
				
					// Keep if no endDate OR if endDate is today or in the future
					//const isActive = !entry.endDate || new Date(entry.endDate) >= new Date();
				
					return isSameBP;

			});
				console.log('aAccessRights99', aAccessRights);
				// 3. Load Access Types and Full Access Rights
				const [aTypes, aRights, aCompanyCtx] = await Promise.all([
					oModel.bindList("/AccessRightType").requestContexts(),
					oModel.bindList("/AccessRights").requestContexts(),
					oModel.bindList("/Companies", null, null, [
						new sap.ui.model.Filter("BusinessPartnerID", sap.ui.model.FilterOperator.EQ, bpId)
					]).requestContexts()
				]);

				const oTypes = aTypes.map(ctx => ctx.getObject());
				const oRights = aRights.map(ctx => ctx.getObject());
				const matchedCompany = aCompanyCtx.length ? aCompanyCtx[0].getObject() : null;

				// 4. Build Access Object
				const access = {};
				aAccessRights.forEach(entry => {

					

					const type = oTypes.find(t => t.code === entry.AccessRights_accessRightType_code);
					const right = oRights.find(r => r.code === entry.AccessRights_code);
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

				return {
					name: matchedCompany?.Name || "Unknown",
					bpNumber: bpId,
					relationBP: sCompanyBPID,
					UserCompany_ID: bpId,
					access
				};

			} catch (err) {
				console.error("❌ Failed to load single agent access record:", err);
				return null;
			}
		},

		loadSingleEndCustomerAccess: async function (sCompanyBPID, bpId) {
			try {
				const oModel = this.getView().getModel("mainModel");

				// 1. Fetch AgentCompany by exact BP ID and relation
				const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [
					new sap.ui.model.Filter("AgentBP_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID),
					//new sap.ui.model.Filter("AgentBP_ID", sap.ui.model.FilterOperator.EQ, bpId)
				]).requestContexts();
				const aAgents = aAgentCtx.map(ctx => ctx.getObject());
				const aAgentBPIds = aAgents.map(a => a.ID?.trim()).filter(Boolean);
				const agent = aAgentCtx.length ? aAgentCtx[0].getObject() : null;
				
				if (!agent) {
					console.warn("No matching AgentCompany found.");
					return null;
				}
				
				// 2. Get matching BPAccessRights (active + correct company + correct agent)
				/*const aAccessCtx = await oModel.bindList("/AgentAccessRights", null, null, [
					//new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, bpId),
					new sap.ui.model.Filter("AgentCompany_ID", sap.ui.model.FilterOperator.EQ, sCompanyBPID)
				]).requestContexts();
				const aAccessRights = aAccessCtx
					.map(ctx => ctx.getObject())
					.filter(entry => !entry.endDate || new Date(entry.endDate) >= new Date());*/
				
				const aAllAccessCtx = await oModel.bindList("/AgentAccessRights").requestContexts();
				const aAllAccessRights = aAllAccessCtx.map(ctx => ctx.getObject());

				const aAccessRights = aAllAccessRights.filter(entry => {
				//aAgentBPIds.includes(entry.AgentCompany_ID?.trim() && !entry.endDate || new Date(entry.endDate) >= new Date())
				const isSameBP = entry.AgentCompany_ID === bpId;
				
					// Keep if no endDate OR if endDate is today or in the future
					const isActive = !entry.endDate || new Date(entry.endDate) >= new Date();
				
					return isSameBP && isActive;

			});
				console.log('aAccessRights99', aAccessRights);
				// 3. Load Access Types and Full Access Rights
				const [aTypes, aRights, aCompanyCtx] = await Promise.all([
					oModel.bindList("/AccessRightType").requestContexts(),
					oModel.bindList("/AccessRights").requestContexts(),
					oModel.bindList("/Companies", null, null, [
						new sap.ui.model.Filter("BusinessPartnerID", sap.ui.model.FilterOperator.EQ, bpId)
					]).requestContexts()
				]);

				const oTypes = aTypes.map(ctx => ctx.getObject());
				const oRights = aRights.map(ctx => ctx.getObject());
				const matchedCompany = aCompanyCtx.length ? aCompanyCtx[0].getObject() : null;

				// 4. Build Access Object
				const access = {};
				aAccessRights.forEach(entry => {

					

					const type = oTypes.find(t => t.code === entry.AccessRights_accessRightType_code);
					const right = oRights.find(r => r.code === entry.AccessRights_code);
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

				return {
					name: matchedCompany?.Name || "Unknown",
					bpNumber: bpId,
					relationBP: sCompanyBPID,
					access
				};

			} catch (err) {
				console.error("❌ Failed to load single agent access record:", err);
				return null;
			}
		},

		/*loadSingleEndCustomerAccess: async function (sCompanyBPID, bpId) {
			try {
				const oModel = this.getView().getModel("mainModel");
				console.log(sCompanyBPID, 'Test enduserId', bpId);
				// 1. Fetch AgentCompany with given AgentBP and matching ContractHolder
				const aAgentCtx = await oModel.bindList("/AgentCompanies", null, null, [
					new sap.ui.model.Filter("AgentBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sCompanyBPID),
					new sap.ui.model.Filter("ContractHolderBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, bpId)
				]).requestContexts();
				console.log("aAgentCtx007>>>", aAgentCtx);
				const agent = aAgentCtx.length ? aAgentCtx[0].getObject() : null;
				if (!agent) {
					console.warn("No matching End Customer AgentCompany found.");
					return null;
				}

				// 2. Fetch Access Rights: match both BPNumber and RelationBP
				const aAccessCtx = await oModel.bindList("/BPAccessRights", null, null, [
					new sap.ui.model.Filter("BPNumber", sap.ui.model.FilterOperator.EQ, bpId),
					new sap.ui.model.Filter("RelationBP_BusinessPartnerID", sap.ui.model.FilterOperator.EQ, sCompanyBPID)
				]).requestContexts();
				console.log("aAccessCtx999>>>", aAccessCtx);
				const aAccessRights = aAccessCtx
					.map(ctx => ctx.getObject())
					.filter(entry => !entry.endDate || new Date(entry.endDate) >= new Date());
				console.log("aAccessCtx999>>>", aAccessRights);
				// 3. Fetch type definitions and full access rights
				const [aTypesCtx, aAccessFullCtx, aCompanyCtx] = await Promise.all([
					oModel.bindList("/AccessRightType").requestContexts(),
					oModel.bindList("/AccessRights").requestContexts(),
					oModel.bindList("/Companies", null, null, [
						new sap.ui.model.Filter("BusinessPartnerID", sap.ui.model.FilterOperator.EQ, bpId)
					]).requestContexts()
				]);
				const aTypes = aTypesCtx.map(ctx => ctx.getObject());
				const aAccessFull = aAccessFullCtx.map(ctx => ctx.getObject());
				const matchedCompany = aCompanyCtx.length ? aCompanyCtx[0].getObject() : null;

				// 4. Structure access entries
				const access = {};
				aAccessRights.forEach(entry => {
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

				return {
					name: matchedCompany?.Name || "Unknown",
					bpNumber: bpId,
					relationBP: sCompanyBPID,
					access
				};

			} catch (err) {
				console.error("❌ Failed to load single End Customer access data:", err);
				return null;
			}
		},*/

		//ending fetching users list


		_onSelectUserAccess: async function (oBPInx, oSelcTab) {

			const oShellModel = this.getOwnerComponent().getModel("sCompanySelc").getData();
			console.log("selc Co>>", oShellModel);
			const sCompanyInfo = oShellModel.CompanyBP_ID;
			const oCompanyId = sCompanyInfo ? sCompanyInfo : "7000000001";

			const oUsersModel = this.getOwnerComponent().getModel("usersList");
			const oBPId = oUsersModel.oData[oSelcTab][oBPInx].bpNumber;
			const oBPRls = oUsersModel.oData[oSelcTab][oBPInx].relationBP;
			console.log(oBPInx,'oUsersModel', oUsersModel);
			const oListData = await Promise.all([oSelcTab === "enerlineUsers"
				? this.loadEnerlineUsersAcsRights(oBPRls, oBPId)
				: oSelcTab === "agentUsers"
					? this.loadSingleAgentCompanyAccess(oBPRls, oBPId)
					: oSelcTab === "endUsers"
						? this.loadSingleEndCustomerAccess(oBPRls, oBPId)
						: null
			]);

			const oFinalModelAccessRights = {
				[oSelcTab]: oListData[0],

			};

			const oAccessModel = new sap.ui.model.json.JSONModel(oFinalModelAccessRights);
			oAccessModel.setSizeLimit(1000);
			this.getOwnerComponent().setModel(oAccessModel, "usersRights");

			return oAccessModel;

		},
		//end new version of the model

		_onProductMatched: async function (oEvent) {
			const that = this;
			const today = new Date(); today.setHours(0, 0, 0, 0);
			// NEW: message infra
			this._setMessageButton(this.byId("messageButton"));
			this._setupMessageInfra();
			this._clearAllMessages();
			//this._updateMessageButtonState();

			const oVBox = this.byId("accessContainer2");
			this.byId("submitChangesButton").setEnabled(false);
			this._oBPid = oEvent.getParameter("arguments").oBPid || this._oBPid || "0";
			const ouserBPid = this._oBPid;
			this.oTabPath = oEvent.getParameter("arguments").oTabPath;
			const oPath = this.oTabPath ? this.oTabPath : "enerlineUsers";
			oVBox.removeAllItems();

			sap.ui.core.BusyIndicator.show(0);

			const oUsersModelcheck = this.getOwnerComponent().getModel("usersList").getData();
			if (oUsersModelcheck[oPath].length === 0) {
				this.byId("submitChangesButton").setVisible(false);
				this.byId("exportSelectedButton").setVisible(false);
				this.byId("terminateAllAccessButton").setVisible(false);
				this.byId("accessTitle1").setVisible(false);
				this.byId("exportAllButton").setVisible(false);
				sap.ui.core.BusyIndicator.hide();

				const oNoDataText = new sap.m.Text({ text: "No data available.", textAlign: "Center" })
					.addStyleClass("sapUiSmallMargin");
				oVBox.addItem(oNoDataText);
				return;
			}

			try {
				this._allChk = [];
				this._oSetButtHide(oPath);

				const oAccesslistData = await this._onSelectUserAccess(ouserBPid, oPath);
				console.log(oPath,'oAccesslistData>>', oAccesslistData);
				const accessData = oAccesslistData.oData[oPath].access;
				console.log(oPath,'accessData>>', accessData);
				const oAccessCheckCur = await this._oCurrentUserAdminChk(oPath);

				oVBox.removeAllItems();

				const oUsersModel = this.getOwnerComponent().getModel("cmmAccessRights").getData();
				const rolesNew = oUsersModel.cmmRoles;

				(rolesNew || []).forEach(function (sCategory, iIndex) {
					// header popover (optional)
					const oPopover = new sap.m.Popover({
						content: new sap.m.Text({
							text: "Allows company representative to view or manage access rights on the company’s behalf."
						}),
						placement: sap.m.PlacementType.Bottom
					});

					// Create the icon
					const oHintIcon = new sap.ui.core.Icon({
						src: "sap-icon://hint",
						size: "1rem",
						color: "#0a6ed1",
						tooltip: "Click for more info",
						press: function (oEvent) {
							oEvent.cancelBubble(); // Prevent toggling the panel expand
							oPopover.openBy(oEvent.getSource());
						}
					}).addStyleClass("sapUiSmallMarginBegin");

					// Create a simple text + icon header
					// @ts-ignore
					const oHeaderHBox = new sap.m.HBox({
						width: "100%",
						alignItems: "Center",
						items: [
							new sap.m.Title({ text: sCategory.categoryName }),
							oHintIcon
						]
					}).addStyleClass("sapUiTinyMargin sapUiCursorPointer");

					// Create the panel
					const oPanel = new sap.m.Panel({
						expandable: true,
						//expanded: iIndex === 0,
						expanded: false,
						headerToolbar: new sap.m.Toolbar({
							content: [oHeaderHBox],
							style: "Clear" // 🔥 This preserves default spacing and padding
						})
					});

					const oTable = new sap.m.Table({
						columns: [
							new sap.m.Column({
								header: new sap.m.Text({ text: "Access" }),
								demandPopin: false, // Always visible
								minScreenWidth: "Phone", // Show on all devices
								width: "55%",
								styleClass: "col-access"
							}),
							new sap.m.Column({
								header: new sap.m.Text({ text: "Effective Date" }),
								demandPopin: true, // Will move to popin on small screens
								minScreenWidth: "Tablet",
								styleClass: "eff-access"
							}),
							new sap.m.Column({
								header: new sap.m.Text({ text: "End Date" }),
								demandPopin: true, // Will move to popin on small screens
								minScreenWidth: "Tablet",
								styleClass: "end-access"
							})
						]
					});
					oTable.addStyleClass("oDetailTable");

					// dedupe by title
					let exitingUserRight = accessData[sCategory.categoryName] || [];
					const uniqueRightMap = {};
					exitingUserRight.forEach(it => { if (!uniqueRightMap[it.title]) uniqueRightMap[it.title] = it; });
					exitingUserRight = Object.values(uniqueRightMap);

					(sCategory.accessRights || []).forEach(function (oRight) {
						const datauser = exitingUserRight.find(d => d.title === oRight.rightName);
						const oBPtblpId = datauser ? datauser.id : null;
						const oBPtblCoId = oAccesslistData ? oAccesslistData.oData[oPath].UserCompany_ID : null;
						const oBPtblId = `${oBPtblpId}_${oBPtblCoId}`;

						
						
						const orCeck = !!datauser;

						const effText = datauser?.effectiveDate ? that._formatDisplayFromAny(datauser.effectiveDate) : null;
						const endText = datauser?.endDate && datauser.endDate !== '9999-12-31'
							? that._formatDisplayFromAny(datauser.endDate)
							: null;
						//console.log("endDate>>", datauser.endDate);
						const oRowItem = new sap.m.ColumnListItem();
						// originals for change detection (as you already have)
						oRowItem.data("origSelected", orCeck);
						oRowItem.data("origEffISO", datauser?.effectiveDate ? String(datauser.effectiveDate).slice(0, 10) : null);
						oRowItem.data("origEndISO", datauser?.endDate ? String(datauser.endDate).slice(0, 10) : null);
						const isoFromDP = (dp) => {
							const d = dp && dp.getDateValue ? dp.getDateValue() : null;
							if (!d) return null;
							d.setHours(0, 0, 0, 0);
							return d.toISOString().slice(0, 10);
						};

						const isRowDirty = () => {
							const curSel = oCheckBox.getSelected();
							const curEff = isoFromDP(oEffInput);
							const curEnd = isoFromDP(oEndInput);
							const origSel = !!oRowItem.data("origSelected");
							const origEff = oRowItem.data("origEffISO") || null;
							const origEnd = oRowItem.data("origEndISO") || null;
							return (curSel !== origSel) || (curEff !== origEff) || (curEnd !== origEnd);
						};

						let oEffInput, oEndInput;

						// Effective Date
						const oEffdatePicker = oAccessCheckCur ? (oEffInput = new sap.m.DatePicker({
							placeholder: " ",
							valueFormat: "yyyy-MM-dd",
							displayFormat: "MMM, dd, yyyy",
							minDate: today,
							change: function (oEvent) {
								// ✅ old logic: any edit highlights the row
								oRowItem.addStyleClass("highlightRow");

								const oInput = oEvent.getSource();
								const val = oInput.getDateValue();
								const today = new Date(); today.setHours(0, 0, 0, 0);

								that._clearMessageFor && that._clearMessageFor(oInput);
								oInput.setValueState("None");

								if (val && val < today) {
									oInput.setValueState("Error");
									oInput.setValueStateText("Effective date cannot be in the past");
									that._addErrorFor && that._addErrorFor(oInput, "Effective date cannot be in the past", {
										category: sCategory.categoryName,
										right: oRight.rightName
									});
								}
								//that._e(oEffInput, "Effective date is required");
								oRowItem.toggleStyleClass("highlightRow", isRowDirty());
								that._validateAllInputs && that._validateAllInputs();
							}
						})) : null;

						if (oEffInput) {
							oEffInput.data("category", sCategory.categoryName);
							oEffInput.data("right", oRight.rightName);
						}

						const oEffCell = effText ? new sap.m.Text({ text: effText }) : oEffdatePicker;

						// End Date
						const oEddatePicker = oAccessCheckCur ? (oEndInput = new sap.m.DatePicker({
							placeholder: " ",
							valueFormat: "yyyy-MM-dd",
							displayFormat: "MMM, dd, yyyy",
							minDate: today,
							change: function (oEvent) {
								// ✅ old logic: any edit highlights the row
								oRowItem.addStyleClass("highlightRow");

								const oInput = oEvent.getSource();
								const endVal = oInput.getDateValue();
								const today = new Date(); today.setHours(0, 0, 0, 0);
								const effVal = oEffInput ? oEffInput.getDateValue() : null;

								that._clearMessageFor && that._clearMessageFor(oInput);
								oInput.setValueState("None");

								if (endVal && endVal < today) {
									oInput.setValueState("Error");
									oInput.setValueStateText("End date cannot be in the past");
									that._addErrorFor && that._addErrorFor(oInput, "End date cannot be in the past", {
										category: sCategory.categoryName,
										right: oRight.rightName
									});
									oRowItem.toggleStyleClass("highlightRow", isRowDirty());
									that._validateAllInputs && that._validateAllInputs(); return;
								}
								if (effVal && endVal && endVal < effVal) {
									oInput.setValueState("Error");
									oInput.setValueStateText("End date cannot be before Effective date");
									that._addErrorFor && that._addErrorFor(oInput, "End date cannot be before Effective date", {
										category: sCategory.categoryName,
										right: oRight.rightName
									});
									oRowItem.toggleStyleClass("highlightRow", isRowDirty());
									that._validateAllInputs && that._validateAllInputs(); return;
								}
								oRowItem.toggleStyleClass("highlightRow", isRowDirty());
								that._validateAllInputs && that._validateAllInputs();
							}
						})) : null;

						if (oEndInput) {
							oEndInput.data("category", sCategory.categoryName);
							oEndInput.data("right", oRight.rightName);
						}

						const oEndCell = endText ? new sap.m.Text({ text: endText }) : (effText ? oEddatePicker : null);

						// Checkbox with "Effective required when selected"
						const oCheckBox = new sap.m.CheckBox({
							text: oRight.rightName,
							selected: orCeck,
							select: function (oEvent) {
								const bSelected = oEvent.getParameter("selected");

								// ✅ old logic: mark the row when selected, unmark when deselected
								if (bSelected) {
									oRowItem.addStyleClass("highlightRow");
									// (keep your “effective date required” logic here if you had it)
									if (that._isDatePicker && that._isDatePicker(oEffInput) && !oEffInput.getDateValue()) {
										that._addErrorFor && that._addErrorFor(oEffInput, "Effective date is required", {
											category: sCategory.categoryName,
											right: oRight.rightName
										});
									}
									
									const parentCode = oRight.accessTypeID; // e.g., "A25"
									const typeCode   = sCategory.categoryID; // e.g., "C04"
									//console.log(oRight.accessTypeID, parentCode,'eventVal', typeCode ,sCategory.categoryID);
									that._cascadeAccessRightIds(parentCode, typeCode);
									
								} else {
									//oRowItem.removeStyleClass("highlightRow");
									oRowItem.toggleStyleClass("highlightRow", isRowDirty());
									// clear row errors if you were doing that before
									that._clearMessageFor && that._clearMessageFor(oEffInput);
									that._clearMessageFor && that._clearMessageFor(oEndInput);
									if (oEffInput && oEffInput.setValueState) oEffInput.setValueState("None");
									if (oEndInput && oEndInput.setValueState) oEndInput.setValueState("None");
								}
								oRowItem.toggleStyleClass("highlightRow", isRowDirty());
								that._validateAllInputs && that._validateAllInputs();
							}
						});

						const rightCode = (
						oRight.accessTypeID || oRight.rightCode || oRight.code || oRight.rightId || null
						);
						const typeCode  = (
						oRight.categoryID || oRight.typeCode || sCategory.categoryCode || sCategory.code || null
						);
						oCheckBox.addCustomData(new sap.ui.core.CustomData({ key: "id", value: oBPtblId }));

						//cascade
						oCheckBox.data("code", rightCode);
						oCheckBox.data("type", typeCode);

						// register globally for quick find later
						that._allChk.push(oCheckBox);
						const firstCell = oAccessCheckCur ? oCheckBox : new sap.m.Text({ text: oRight.rightName });

						oRowItem.addCell(firstCell);
						oRowItem.addCell(oEffCell);
						oRowItem.addCell(oEndCell);
						oTable.addItem(oRowItem);
					});

					oPanel.addContent(oTable);
					oVBox.addItem(oPanel);
				});

				// keep your binding
				this.getView().bindElement({ path: "/" + oPath + "/" + this._oBPid, model: "cmmAccessRights" });

				// run initial validation
				this._validateAllInputs && this._validateAllInputs();
			} catch (err) {
				console.error("❌ Error in _onProductMatched:", err);
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}
		},
		_cascadeAccessRightIds: async function (casRightId, rightTypeId) {
			// ---- NEW: cascade by (type, code) via simple OData query ----
			try {
			const that = this;
			const parentCode = casRightId; // e.g., "A25"
			const typeCode   = rightTypeId; // e.g., "C04"
			if (parentCode) {
				const oModel = that.getView().getModel("mainModel");
				const aFilters = [
				new sap.ui.model.Filter("SourceAccessRight_code", sap.ui.model.FilterOperator.EQ, parentCode)
				];
				if (typeCode) {
				aFilters.push(
					new sap.ui.model.Filter("SourceAccessRight_code", sap.ui.model.FilterOperator.EQ, typeCode)
				);
				}

				const aCtx = await oModel.bindList("/CascadeAccessRights", null, null, aFilters).requestContexts();
				const aChildCodes = aCtx.map(c => (c.getObject() || {}).TargetAccessRight_code).filter(Boolean);
				console.log('rightIds', aChildCodes);
				// auto-select matching children in current UI (same type preferred)
				aChildCodes.forEach(code => {
				// first: exact (same type + code)
				let chk = that._allChk.find(ch =>
					ch && ch.data("code") === code && (!typeCode || ch.data("type") === typeCode)
				);

				// optional fallback: any type with same code (if children can span types)
				if (!chk) {
					chk = that._allChk.find(ch => ch && ch.data("code") === code);
				}

				if (chk && !chk.getSelected()) {
					// set + fire select so your existing validation/highlighting stays intact
					chk.setSelected(true);
					chk.fireSelect({ selected: true });
				}
				});
			}
			} catch (e) {
			// don't break UX if cascade fails
			console.warn("Cascade fetch failed:", e);
			}
			// ---- END NEW ----
		},
		_validateAllInputs: function () {
			const oVBox = this.byId("accessContainer2");
			const aPanels = oVBox ? oVBox.getItems() : [];

			let hasError = false;
			let hasChanges = false;

			for (const oPanel of aPanels) {
				const oTable = oPanel && oPanel.getContent && oPanel.getContent()[0];
				if (!oTable) continue;

				for (const oItem of oTable.getItems()) {
					const [ctrl0, ctrl1, ctrl2] = oItem.getCells();
					const isCheck = ctrl0 instanceof sap.m.CheckBox;
					const selNow = isCheck ? ctrl0.getSelected() : false;

					const effCtrl = ctrl1; // Text or DatePicker
					const endCtrl = ctrl2; // Text or DatePicker

					// Current ISO values (for comparison)
					const effNowISO = this._isDatePicker(effCtrl) && effCtrl.getDateValue()
						? this._getISO(effCtrl.getDateValue())
						: (effCtrl && effCtrl.getText ? String(effCtrl.getText()) : null);

					const endNowISO = this._isDatePicker(endCtrl) && endCtrl.getDateValue()
						? this._getISO(endCtrl.getDateValue())
						: (endCtrl && endCtrl.getText ? String(endCtrl.getText()) : null);

					// Originals from row
					const origSelected = oItem.data("origSelected");
					const origEffISO = oItem.data("origEffISO");
					const origEndISO = oItem.data("origEndISO");

					const effChanged = this._isDatePicker(effCtrl)
						? !this._sameISO(effNowISO, origEffISO)
						: false;

					const endChanged = this._isDatePicker(endCtrl)
						? !this._sameISO(endNowISO, origEndISO)
						: false;

					const selChanged = selNow !== !!origSelected;
					if (selChanged || effChanged || endChanged) {
						hasChanges = true;
					}

					// ---------- normalize all message/value-state transitions ----------
					// 1) Clear any old messages first (prevents duplicates)
					if (this._isDatePicker(effCtrl)) this._clearMessageFor(effCtrl);
					if (this._isDatePicker(endCtrl)) this._clearMessageFor(endCtrl);
					if (this._isDatePicker(effCtrl)) effCtrl.setValueState("None");
					if (this._isDatePicker(endCtrl)) endCtrl.setValueState("None");

					// 2) Re-apply current validation and add MessageManager entries

					// Required: if selected and Effective is editable DatePicker, it must be set
					if (selNow && this._isDatePicker(effCtrl) && !effCtrl.getDateValue()) {

						const msg = "Effective date is required";
						//this._addErrorFor(effCtrl, msg, null);
						effCtrl.setValueState("Error");
						effCtrl.setValueStateText(msg);
						this._addErrorFor(effCtrl, msg, /*meta*/ null);
						hasError = true;
					}

					// Hard errors already on controls (from change handlers)
					if (this._isDatePicker(effCtrl) && effCtrl.getValueState() === "Error") {
						// ensure there's a MessageManager entry (if handler didn’t add)
						this._addErrorFor(effCtrl, effCtrl.getValueStateText() || "Invalid Effective date", null);
						hasError = true;
					}
					if (this._isDatePicker(endCtrl) && endCtrl.getValueState() === "Error") {
						this._addErrorFor(endCtrl, endCtrl.getValueStateText() || "Invalid End date", null);
						hasError = true;
					}

					// (Optional) If you need cross-field checks here too, add them with _addErrorFor(...)
					// e.g., enforce end >= eff if both set:
					if (this._isDatePicker(effCtrl) && this._isDatePicker(endCtrl)) {
						const dEff = effCtrl.getDateValue();
						const dEnd = endCtrl.getDateValue();
						if (dEff && dEnd && dEnd < dEff) {
							const msg = "End date cannot be before Effective date";
							endCtrl.setValueState("Error");
							endCtrl.setValueStateText(msg);
							this._addErrorFor(endCtrl, msg, null);
							hasError = true;
						}
					}
					// -------------------------------------------------------------------
				}
			}

			// reflect submit state
			this._updateSubmitState(hasChanges, hasError);

			// finally, update the footer badge (icon + count)
			this._updateMessageButtonState();
		},

		//new beee
		_e: function (ctrl, msg) {
			if (ctrl && ctrl.setValueState) {
				ctrl.setValueState("Error");
				ctrl.setValueStateText(msg);
			}
			this._addErrorFor(ctrl, msg, /*meta*/ null);   // meta auto-filled (see patch below)
			this._validateAllInputs && this._validateAllInputs();
		},

		// ---- Metadata inference (keeps your code DRY) ----
		_inferRight: function (ctrl) {
			if (!ctrl) return null;
			// Prefer explicit data
			var r = ctrl.data && ctrl.data("right");
			if (r) return r;

			// Else, climb to the row and read first cell
			var row = ctrl;
			while (row && !(row instanceof sap.m.ColumnListItem)) {
				row = row.getParent && row.getParent();
			}
			if (row && row.getCells) {
				var first = row.getCells()[0];
				if (first instanceof sap.m.CheckBox && first.getText) return first.getText();
				if (first && first.getText) return first.getText();
			}
			return null;
		},

		_inferCategory: function (ctrl) {
			if (!ctrl) return null;
			// Prefer explicit data on any ancestor Panel
			var p = ctrl;
			while (p && !(p instanceof sap.m.Panel)) {
				p = p.getParent && p.getParent();
			}
			if (!p) return ctrl.data && ctrl.data("category");

			var cat = p.data && p.data("category");
			if (cat) return cat;

			// Fallback: read Title text from the panel's header toolbar
			var tb = p.getHeaderToolbar && p.getHeaderToolbar();
			if (tb && tb.getContent) {
				for (var c of tb.getContent()) {
					if (c instanceof sap.m.Title && c.getText) return c.getText();
					if (c.getItems) {
						for (var x of c.getItems()) {
							if (x instanceof sap.m.Title && x.getText) return x.getText();
						}
					}
				}
			}
			return null;
		},

		_inferMeta: function (ctrl) {
			return {
				category: (ctrl && ctrl.data && ctrl.data("category")) || this._inferCategory(ctrl),
				right: (ctrl && ctrl.data && ctrl.data("right")) || this._inferRight(ctrl)
			};
		},
		//new beeee end

		//New today

		_setupMessageInfra: function () {
			if (this._msgPop) return;

			// Ensure we have a message button reference (try default id if not set explicitly)
			if (!this._msgBtn) this._setMessageButton();

			// MessageManager + model
			this._msgManager = sap.ui.getCore().getMessageManager();
			this._ctrlProcessor = new sap.ui.core.message.ControlMessageProcessor();
			this._msgManager.registerMessageProcessor(this._ctrlProcessor);

			var oMsgModel = this._msgManager.getMessageModel();
			this.getView().setModel(oMsgModel, "message");

			var MT = sap.ui.core.MessageType;
			function iconSrc(t) {
				if (t === MT.Error || t === "Error") return "sap-icon://message-error";
				if (t === MT.Warning || t === "Warning") return "sap-icon://message-warning";
				if (t === MT.Success || t === "Success") return "sap-icon://message-success";
				return "sap-icon://message-information";
			}

			// Compact row: small icon + two lines
			var itemTemplate = new sap.m.CustomListItem({
				content: new sap.m.HBox({
					alignItems: "Start",
					items: [
						// LEFT: red circle with white "X"
						new sap.ui.core.Icon({
							src: {
								path: "message>type",
								formatter: function (t) {
									var MT = sap.ui.core.MessageType;
									if (t === MT.Error || t === "Error") return "sap-icon://message-error";
									if (t === MT.Warning || t === "Warning") return "sap-icon://message-warning";
									if (t === MT.Success || t === "Success") return "sap-icon://message-success";
									return "sap-icon://message-information";
								}
							},
							color: {
								path: "message>type",
								formatter: function (t) {
									// use theme param so it matches Fiori exactly
									var P = sap.ui.core.theming.Parameters;
									var MT = sap.ui.core.MessageType;
									if (t === MT.Error || t === "Error") return P.get("sapNegativeColor") || "var(--sapNegativeColor)";
									if (t === MT.Warning || t === "Warning") return P.get("sapCriticalColor") || "var(--sapCriticalColor)";
									if (t === MT.Success || t === "Success") return P.get("sapPositiveColor") || "var(--sapPositiveColor)";
									return P.get("sapInformativeColor") || "var(--sapInformativeColor)";
								}
							},
							size: "1.25rem"   // slightly larger for the same look
						}).addStyleClass("sapMSLIImgIcon sapUiTinyMarginEnd"),

						// RIGHT: texts
						new sap.m.VBox({
							items: [
								new sap.m.Text({ text: "{message>message}", wrapping: true }),
								new sap.m.Text({
									text: {
										parts: [
											{ path: "message>additionalText" },
											{ path: "message>target" }
										],
										formatter: function (additionalText, target) {
											// If your existing logic already set additionalText, use it.
											if (additionalText) return additionalText;

											// Otherwise, derive from the control that raised the message.
											var ctrl = target && sap.ui.getCore().byId(target);
											if (!ctrl) return "";

											var cat = ctrl.data && ctrl.data("category");
											var rgt = ctrl.data && ctrl.data("right");
											var bits = [];
											if (cat) bits.push("Category: " + cat);
											if (rgt) bits.push("Right: " + rgt);
											return bits.join(" • ");
										}
									},
									wrapping: true
								}).addStyleClass("sapUiTinyMarginTop")
							]
						})
					]
				})
			});

			var oList = new sap.m.List({
				items: {
					path: "message>/",
					templateShareable: false,
					template: itemTemplate
				}
			});
			oList.setModel(oMsgModel, "message");

			var isPhone = sap.ui.Device && sap.ui.Device.system.phone;

			this._msgPop = new sap.m.ResponsivePopover({
				placement: sap.m.PlacementType.VerticalPreferedBottom,
				showArrow: !isPhone,                // arrow on desktop/tablet only
				showCloseButton: false,             // avoid a second close on phones
				contentWidth: isPhone ? "auto" : "26rem",
				contentHeight: isPhone ? "auto" : "18rem",
				customHeader: new sap.m.Bar({
					//contentLeft: [new sap.m.Title({ text: "Messages" })],
					contentRight: [new sap.m.Button({
						icon: "sap-icon://decline",
						type: "Transparent",
						tooltip: "Close",
						press: () => this._msgPop.close()
					})]
				}),
				// wrapper adds padding so first row never touches header
				content: [new sap.m.VBox({ items: [oList] }).addStyleClass("msgpop-content")]
			})
				.addStyleClass("msgpop sapUiSizeCompact myErrorPopover"); // add your custom class here

			// nudge position near the badge
			if (!isPhone) { this._msgPop.setOffsetX(8); this._msgPop.setOffsetY(-4); }

			this.getView().addDependent(this._msgPop);

			// keep the badge in sync + auto-close when empty
			oMsgModel.bindList("/").attachChange(() => {
				this._updateMessageButtonState();
				var a = oMsgModel.getObject("/") || [];
				if (!a.length && this._msgPop?.isOpen?.()) this._msgPop.close();
			});

			// initialize button state
			this._updateMessageButtonState();
		},

		/** Wire this to the footer message button's press event */
		onMessageButtonPress: function (e) {
			if (!this._msgPop) this._setupMessageInfra();

			// Ensure the pressed button is our tracked message button (optional)
			if (!this._msgBtn && e && e.getSource) this._setMessageButton(e.getSource());

			// refresh binding before opening (prevents “blank on desktop”)
			var vbox = this._msgPop.getContent()[0];
			var list = vbox && vbox.getItems && vbox.getItems()[0];
			var b = list && list.getBinding && list.getBinding("items");
			if (b) b.refresh(true);

			// update badge before toggling
			this._updateMessageButtonState();

			this._msgPop.isOpen?.() ? this._msgPop.close() : this._msgPop.openBy(e.getSource());
		},

		/*onExit: function () {
		  this._msgPopover?.destroy();
		  this._msgPopover = null;
		},*/

		_setMessageButton: function (oBtn) {
			this._msgBtn = oBtn || (this.byId && this.byId("messageButton"));
			if (this._msgBtn) {
				this._msgBtn.setVisible(false); // << start hidden
				this._msgBtn.setIcon("sap-icon://message-error");
				this._msgBtn.setText("");
				this._msgBtn.setType("Transparent");
				this._msgBtn.setTooltip("");
				this._msgBtn.addStyleClass("msgerrpop");
			}
		},

		_updateMessageButtonState: function () {
			if (!this._msgManager || !this._msgBtn) return;

			var MT = sap.ui.core.MessageType;
			var aMsgs = this._msgManager.getMessageModel().getObject("/") || [];

			// count only errors
			var n = aMsgs.filter(m => m.type === MT.Error || m.type === "Error").length;

			// show button only when > 0 errors
			this._msgBtn.setVisible(n > 0);

			if (n > 0) {
				this._msgBtn.setIcon("sap-icon://message-error");
				this._msgBtn.setText(String(n));
				this._msgBtn.setTooltip("Errors: " + n);
				this._msgBtn.setType("Emphasized");
			} else {
				// reset state when hidden
				this._msgBtn.setText("");
				this._msgBtn.setTooltip("");
				this._msgBtn.setType("Transparent");
			}
		},

		_clearAllMessages: function () {
			if (this._msgManager) this._msgManager.removeAllMessages();
			this._msgByCtrlId = Object.create(null);
			this._updateMessageButtonState();
		},

		// meta = { category: '...', right: '...' }
		_addErrorFor: function (ctrl, message, meta) {
			if (!ctrl || !this._msgManager) return;

			// 👇 NEW: derive metadata if caller passed null/undefined
			var derived = meta || this._inferMeta(ctrl);
			var additionalText = [
				derived.category ? (derived.category) : null,
				derived.right ? (derived.right) : null
			].filter(Boolean).join(" • ");

			var target = ctrl.getId ? ctrl.getId() : String(ctrl);

			// de-dupe same (target + message)
			var aMsgs = this._msgManager.getMessageModel().getObject("/") || [];
			var dups = aMsgs.filter(m => {
				var t = m.getTarget ? m.getTarget() : m.target;
				var txt = m.getMessage ? m.getMessage() : m.message;
				return t === target && txt === message;
			});
			if (dups.length) this._msgManager.removeMessages(dups);

			this._msgManager.addMessages(new sap.ui.core.message.Message({
				message,
				additionalText,                              // 👈 shows Category/Right in popover second line
				type: sap.ui.core.MessageType.Error,
				target,
				processor: this._ctrlProcessor,
				persistent: true
			}));
		},

		_clearMessageFor: function (ctrl) {
		if (!ctrl || !this._msgManager) return;

		var id    = ctrl.getId();
		var model = this._msgManager.getMessageModel();
		var msgs  = model.getObject("/") || [];

		// Remove ALL variants that UI5 may use for the same control
		var toRemove = msgs.filter(function (m) {
			var t = (m.getTarget && m.getTarget()) || m.target || "";
			var p = (m.getProcessor && m.getProcessor()) || m.processor;
			return (
			t === id || t === id + "/value" || t === id + "-inner" || t.indexOf(id) === 0
			) && (!p || p === this._ctrlProcessor);
		}, this);

		if (toRemove.length) this._msgManager.removeMessages(toRemove);

		if (ctrl.setValueState) {
			ctrl.setValueState("None");
			ctrl.setValueStateText("");
		}

		// Make the popover update immediately
		if (model.updateBindings) model.updateBindings(true);
		var b = model.bindList && model.bindList("/");
		if (b && b.refresh) b.refresh(true);

		this._updateMessageButtonState && this._updateMessageButtonState();
		},

		_isDatePicker: function (c) { return c && c instanceof sap.m.DatePicker; },
		_normToday: function () { var t = new Date(); t.setHours(0, 0, 0, 0); return t; },

		// End new today


		//_isDatePicker(ctrl) { return ctrl && ctrl instanceof sap.m.DatePicker; },

		// yyyy-MM-dd from a LOCAL Date (no UTC conversion)
		_fmtISO: function (d) {
			const yyyy = d.getFullYear();
			const mm = String(d.getMonth() + 1).padStart(2, "0");
			const dd = String(d.getDate()).padStart(2, "0");
			return `${yyyy}-${mm}-${dd}`;
		},

		// Parse ANY input to clean "yyyy-MM-dd" WITHOUT creating UTC drift
		// Accepts: Date | "yyyy-MM-dd" | "yyyy-MM-ddTHH..." | "MMM, dd, yyyy"
		_getISO: function (val) {
			if (!val) return null;

			// 1) Date object — use LOCAL parts (no toISOString!)
			if (val instanceof Date && !isNaN(val)) {
				const d = new Date(val.getFullYear(), val.getMonth(), val.getDate());
				return this._fmtISO(d);
			}

			// 2) Strings
			if (typeof val === "string") {
				const s = val.trim();
				if (!s) return null;

				// a) yyyy-MM-dd → already date-only; return as-is
				if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

				// b) yyyy-MM-ddTHH... → take only the date part
				if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);

				// c) "MMM, dd, yyyy" (your display)
				const df = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MMM, dd, yyyy" });
				const d1 = df.parse(s);
				if (d1 instanceof Date && !isNaN(d1)) {
					return this._fmtISO(new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()));
				}

				// d) last resort: JS parse (LOCAL), then strip time
				const d2 = new Date(s);
				if (!isNaN(d2)) {
					return this._fmtISO(new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()));
				}
			}

			return null;
		},

		// Build a LOCAL Date from "yyyy-MM-dd" (no timezone surprises)
		_dateFromISO: function (isoYMD) {
			if (!isoYMD) return null;
			const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYMD);
			if (!m) return null;
			return new Date(+m[1], +m[2] - 1, +m[3]); // local date at 00:00
		},

		// For showing in Text / DatePicker display: take ANY -> ISO -> local Date -> format
		_formatDisplayFromAny: function (anyVal) {
			const iso = this._getISO(anyVal);
			if (!iso) return "";
			const d = this._dateFromISO(iso);
			const df = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MMM, dd, yyyy" });
			return df.format(d);
		},

		// If you need "today" as yyyy-MM-dd without UTC drift
		_todayLocalISO: function () {
			const now = new Date();
			return this._fmtISO(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
		},

		_sameISO: function (a, b) { return (a || null) === (b || null); },

		_updateSubmitState(hasChanges, hasError) {
			const btn = this.byId("submitChangesButton");
			// If you want it always visible, comment out next line
			//btn.setVisible(!!hasChanges);             
			btn.setEnabled(!!hasChanges && !hasError);
		},

		onDateChangeValidate: function (oEvent) {
			const oDatePicker = oEvent.getSource();
			const sSelectedDate = oDatePicker.getValue();
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const oDate = new Date(sSelectedDate);
			oDate.setHours(0, 0, 0, 0);

			if (oDate < today) {
				sap.m.MessageBox.warning("Selected date cannot be before today.");
				oDatePicker.setValue(""); // Clear invalid value
			}
		}


	});
});


