sap.ui.define([
		'sap/m/Label',
		'sap/m/Popover',
		'sap/ui/core/library',
		'sap/ui/core/format/DateFormat',
		'sap/ui/core/Fragment',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/json/JSONModel',
		'sap/base/Log',
		'sap/ui/model/odata/v2/ODataModel'
	],
	function (Label, Popover, coreLibrary, DateFormat, Fragment, Controller, JSONModel, Log, ODataModel) {

		var ValueState = coreLibrary.ValueState;
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0');
		var yyyy = today.getFullYear();
		today = mm + '/' + dd + '/' + yyyy;

		return Controller.extend("home.kpmg.ResourceCalendar.controller.Calendar", {

			onInit: function () {
				// this.model = this.getOwnerComponent().getModel("appointmentsModel");

				// this.model.read("/ZC_APPOINTMENTS", {
				// 	success: function (data, context) {
				// 		this.planningModel = new JSONModel(data.results);

				// 		this.getView().setModel(this.planningModel);
				// 		debugger;
				// 	}.bind(this),
				// 	error: function (err) {
				// 		console.error(err);
				// 	}

				// });
				var appointmentsModel = this.getOwnerComponent().getModel("employeeModel");
				var employees;
				var appointmentURL;
				var employeesModel;
				appointmentsModel.read("/ZC_EMPLOYEE", {
					// 	success: function (data, context) {
					// 		employees = data.results;
					// 		if (employees !== undefined && employees.length !== 0) {
					// 			debugger;
					// 			for (let i = 1; i <= employees.length; i++) {
					// 				appointmentURL = "/sap/opu/odata/sap/ZPLANING_CALENDAR_SRV/ZC_EMPLOYEES(";
					// 				appointmentURL = appointmentURL.concat(i, "l)/to_appointments?$format=json");
					// 				currentEmployeeAppointments = new JSONModel();
					// 				currentEmployeeAppointments.loadData(appointmentURL, "", false, "GET", true);
					// 				currentEmployee = employees[i - 1];
					// 				if (Object.keys(currentEmployeeAppointments.oData).length === 0 && currentEmployeeAppointments.oData.constructor === Object) {
					// 					currentEmployee.appointments = [];
					// 					continue;
					// 				}
					// 				currentEmployee.appointments = [];
					// 				currentEmployee.appointments.push(currentEmployeeAppointments.oData.d);
					// 				currentEmployee.appointments.forEach(e => {
					// 					var startDateRaw = e.Start_Date;
					// 					var endDateRaw = e.End_Date;
					// 					var startTimeRaw = e.Start_Time;
					// 					var endTimeRaw = e.End_Time
					// 					e.Start_Date = dateFormat(startDateRaw, startTimeRaw);
					// 					e.End_Date = dateFormat(endDateRaw, endTimeRaw);
					// 				})

					// 				debugger;
					// 			};
					// 		};
					// 		employeesModel = new JSONModel();
					// 		employeesModel.setData({
					// 			startDate: new Date(Date.now()),
					// 			employees: employees
					// 		});
					// 		debugger;
					// 		this.getView().setModel(employeesModel);
					// 		debugger;
					// 	}.bind(this),
					// 	error: function (err) {
					// 		console.log(err);
					// 	}
					// });
					success: function (data, context) {
						employees = data.results;
						debugger;
						if (employees === undefined && employees.length === 0) {
							return;
						}
						debugger;
						employeesModel = new JSONModel();
						employeesModel.setData({
							startDate: new Date(Date.now()),
							employees: employees
						})
						this.getView().setModel(employeesModel);
						getAppointments(employees)
							.then(function () {
								employeesModel.setData({
									employees: employees
								}, true);
								debugger;
							});

					}.bind(this),
					error: function (err) {
						console.log(err);
					}
				})

				// this.getView().byId("PC1").setModel(oModel);
				// var json = new JSONModel("/sap/opu/odata/sap/ZPLANING_CALENDAR_SRV/ZC_EMPLOYEES(1l)/to_appointments?$format=json");
				// json.attachRequestCompleted(function () {
				// 	alert(json.getJSON());
				// 	debugger;
				// })
			},

			_aDialogTypes: [{
				title: "Create Appointment",
				type: "create_appointment"
			}, {
				title: "Create Appointment",
				type: "create_appointment_with_context"
			}, {
				title: "Edit Appointment",
				type: "edit_appointment"
			}],

			handleAppointmentSelect: function (oEvent) {
				var oAppointment = oEvent.getParameter("appointment");
				if (oAppointment) {
					this._handleSingleAppointment(oAppointment);
				} else {
					this._handleGroupAppointments(oEvent);
				}
			},

			_addNewAppointment: function (oAppointment) {
				debugger;
				var oModel = this.getView().getModel(),
					sPath = "/employees/" + this.byId("selectPerson").getSelectedIndex().toString(),
					oPersonAppointments;

				if (this.byId("isIntervalAppointment").getSelected()) {
					sPath += "/headers";
				} else {
					sPath += "/appointments";
				}

				oPersonAppointments = oModel.getProperty(sPath);

				oPersonAppointments.push(oAppointment);

				oModel.setProperty(sPath, oPersonAppointments);
			},

			handleCancelButton: function () {
				this.byId("detailsPopover").close();
			},

			handleAppointmentCreate: function () {
				this._arrangeDialogFragment(this._aDialogTypes[0].type);
			},

			handleAppointmentAddWithContext: function (oEvent) {
				this.oClickEventParameters = oEvent.getParameters();
				this._arrangeDialogFragment(this._aDialogTypes[1].type);
			},

			_validateDateTimePicker: function (oDateTimePickerStart, oDateTimePickerEnd) {
				var oStartDate = oDateTimePickerStart.getDateValue(),
					oEndDate = oDateTimePickerEnd.getDateValue(),
					sValueStateText = "Start date should be before End date";

				if (oStartDate && oEndDate && oEndDate.getTime() <= oStartDate.getTime()) {
					oDateTimePickerStart.setValueState(ValueState.Error);
					oDateTimePickerEnd.setValueState(ValueState.Error);
					oDateTimePickerStart.setValueStateText(sValueStateText);
					oDateTimePickerEnd.setValueStateText(sValueStateText);
				} else {
					oDateTimePickerStart.setValueState(ValueState.None);
					oDateTimePickerEnd.setValueState(ValueState.None);
				}
			},

			updateButtonEnabledState: function (oDialog) {
				var oStartDate = this.byId("startDate"),
					oEndDate = this.byId("endDate"),
					bEnabled = oStartDate.getValueState() !== ValueState.Error && oStartDate.getValue() !== "" && oEndDate.getValue() !== "" &&
					oEndDate.getValueState() !== ValueState.Error;

				oDialog.getBeginButton().setEnabled(bEnabled);
			},

			handleCreateChange: function (oEvent) {
				var oDateTimePickerStart = this.byId("startDate"),
					oDateTimePickerEnd = this.byId("endDate");

				if (oEvent.getParameter("valid")) {
					this._validateDateTimePicker(oDateTimePickerStart, oDateTimePickerEnd);
				} else {
					oEvent.getSource().setValueState(ValueState.Error);
				}

				this.updateButtonEnabledState(this.byId("createDialog"));
			},

			_removeAppointment: function (oAppointment, sPersonId) {
				var oModel = this.getView().getModel(),
					sTempPath,
					aPersonAppointments,
					iIndexForRemoval;

				if (!sPersonId) {
					sTempPath = this.sPath.slice(0, this.sPath.indexOf("appointments/") + "appointments/".length);
				} else {
					sTempPath = "/employees/" + sPersonId + "/appointments";
				}

				aPersonAppointments = oModel.getProperty(sTempPath);
				iIndexForRemoval = aPersonAppointments.indexOf(oAppointment);

				if (iIndexForRemoval !== -1) {
					aPersonAppointments.splice(iIndexForRemoval, 1);
				}

				oModel.setProperty(sTempPath, aPersonAppointments);
			},

			handleDeleteAppointment: function () {
				var oDetailsPopover = this.byId("detailsPopover"),
					oBindingContext = oDetailsPopover.getBindingContext(),
					oAppointment = oBindingContext.getObject(),
					iPersonIdStartIndex = oBindingContext.getPath().indexOf("/employees/") + "/employees/".length,
					iPersonId = oBindingContext.getPath()[iPersonIdStartIndex];

				this._removeAppointment(oAppointment, iPersonId);
				oDetailsPopover.close();
			},

			handleEditButton: function () {
				debugger;
				var oDetailsPopover = this.byId("detailsPopover");
				this.sPath = oDetailsPopover.getBindingContext().getPath();
				oDetailsPopover.close();
				this._arrangeDialogFragment(this._aDialogTypes[2].type);
			},
			_arrangeDialogFragment: function (iDialogType) {
				var oView = this.getView();
				debugger;
				if (!this._pNewAppointmentDialog) {
					this._pNewAppointmentDialog = Fragment.load({
						id: oView.getId(),
						name: "home.kpmg.ResourceCalendar.view.Create",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}
				this._pNewAppointmentDialog.then(function (oDialog) {
					this._arrangeDialog(iDialogType, oDialog);
				}.bind(this));
			},

			_arrangeDialog: function (sDialogType, oDialog) {
				var sTempTitle = "";
				oDialog._sDialogType = sDialogType;
				if (sDialogType === "edit_appointment") {
					this._setEditAppointmentDialogContent(oDialog);
					sTempTitle = this._aDialogTypes[2].title;
				} else if (sDialogType === "create_appointment_with_context") {
					this._setCreateWithContextAppointmentDialogContent();
					sTempTitle = this._aDialogTypes[1].title;
				} else if (sDialogType === "create_appointment") {
					this._setCreateAppointmentDialogContent();
					sTempTitle = this._aDialogTypes[0].title;
				} else {
					Log.error("Wrong dialog type.");
				}

				this.updateButtonEnabledState(oDialog);
				oDialog.setTitle(sTempTitle);
				oDialog.open();
			},

			handleAppointmentTypeChange: function (oEvent) {
				var oAppointmentType = this.byId("isIntervalAppointment");

				oAppointmentType.setSelected(oEvent.getSource().getSelected());
			},

			handleDialogCancelButton: function () {
				this.byId("createDialog").close();
			},

			_editAppointment: function (oAppointment, bIsIntervalAppointment, iPersonId, oNewAppointmentDialog) {
				var sAppointmentPath = this._appointmentOwnerChange(oNewAppointmentDialog),
					oModel = this.getView().getModel();

				if (bIsIntervalAppointment) {
					this._convertToHeader(oAppointment, iPersonId, oNewAppointmentDialog);
				} else {
					if (this.sPath !== sAppointmentPath) {
						this._addNewAppointment(oNewAppointmentDialog.getModel().getProperty(this.sPath));
						this._removeAppointment(oNewAppointmentDialog.getModel().getProperty(this.sPath));
					}
					oModel.setProperty(sAppointmentPath + "/title", oAppointment.title);
					oModel.setProperty(sAppointmentPath + "/info", oAppointment.info);
					oModel.setProperty(sAppointmentPath + "/type", oAppointment.type);
					oModel.setProperty(sAppointmentPath + "/start", oAppointment.start);
					oModel.setProperty(sAppointmentPath + "/end", oAppointment.end);
				}
			},

			_convertToHeader: function (oAppointment, oNewAppointmentDialog) {
				var sPersonId = this.byId("selectPerson").getSelectedIndex().toString();

				this._removeAppointment(oNewAppointmentDialog.getModel().getProperty(this.sPath), sPersonId);
				this._addNewAppointment({
					start: oAppointment.start,
					end: oAppointment.end,
					title: oAppointment.title,
					type: oAppointment.type
				});
			},

			handleDialogSaveButton: function () {
				var oStartDate = this.byId("startDate"),
					oEndDate = this.byId("endDate"),
					sInfoValue = this.byId("moreInfo").getValue(),
					sInputTitle = this.byId("inputTitle").getValue(),
					iPersonId = this.byId("selectPerson").getSelectedIndex(),
					oModel = this.getView().getModel(),
					bIsIntervalAppointment = this.byId("isIntervalAppointment").getSelected(),
					oNewAppointmentDialog = this.byId("createDialog"),
					oNewAppointment;

				if (oStartDate.getValueState() !== ValueState.Error && oEndDate.getValueState() !== ValueState.Error) {
					if (this.sPath && oNewAppointmentDialog._sDialogType === "edit_appointment") {
						this._editAppointment({
							title: sInputTitle,
							info: sInfoValue,
							type: this.byId("detailsPopover").getBindingContext().getObject().type,
							start: oStartDate.getDateValue(),
							end: oEndDate.getDateValue()
						}, bIsIntervalAppointment, iPersonId, oNewAppointmentDialog);
					} else {
						if (bIsIntervalAppointment) {
							oNewAppointment = {
								title: sInputTitle,
								start: oStartDate.getDateValue(),
								end: oEndDate.getDateValue()
							};
						} else {
							oNewAppointment = {
								title: sInputTitle,
								info: sInfoValue,
								start: oStartDate.getDateValue(),
								end: oEndDate.getDateValue()
							};
						}
						this._addNewAppointment(oNewAppointment);
					}

					oModel.updateBindings();

					oNewAppointmentDialog.close();
				}
			},

			_appointmentOwnerChange: function (oNewAppointmentDialog) {
				var iSpathPersonId = this.sPath[this.sPath.indexOf("/employees/") + "/employees/".length],
					iSelectedPerson = this.byId("selectPerson").getSelectedIndex(),
					sTempPath = this.sPath,
					iLastElementIndex = oNewAppointmentDialog.getModel().getProperty("/employees/" + iSelectedPerson.toString() + "/appointments/").length
					.toString();

				if (iSpathPersonId !== iSelectedPerson.toString()) {
					sTempPath = "".concat("/employees/", iSelectedPerson.toString(), "/appointments/", iLastElementIndex.toString());
				}

				return sTempPath;
			},

			_setCreateAppointmentDialogContent: function () {
				var oAppointmentType = this.byId("isIntervalAppointment"),
					oDateTimePickerStart = this.byId("startDate"),
					oDateTimePickerEnd = this.byId("endDate"),
					oTitleInput = this.byId("inputTitle"),
					oMoreInfoInput = this.byId("moreInfo"),
					oPersonSelected = this.byId("selectPerson");

				//Set the person in the first row as selected.
				oPersonSelected.setSelectedItem(this.byId("selectPerson").getItems()[0]);
				oDateTimePickerStart.setValue("");
				oDateTimePickerEnd.setValue("");
				oDateTimePickerStart.setValueState(ValueState.None);
				oDateTimePickerEnd.setValueState(ValueState.None);
				oTitleInput.setValue("");
				oMoreInfoInput.setValue("");
				oAppointmentType.setSelected(false);
			},

			_setCreateWithContextAppointmentDialogContent: function () {
				debugger;
				var aPeople = this.getView().getModel().getProperty('/employees/'),
					oSelectedIntervalStart = this.oClickEventParameters.startDate,
					oStartDate = this.byId("startDate"),
					oSelectedIntervalEnd = this.oClickEventParameters.endDate,
					oEndDate = this.byId("endDate"),
					oDateTimePickerStart = this.byId("startDate"),
					oDateTimePickerEnd = this.byId("endDate"),
					oAppointmentType = this.byId("isIntervalAppointment"),
					oTitleInput = this.byId("inputTitle"),
					oMoreInfoInput = this.byId("moreInfo"),
					sPersonName,
					oPersonSelected;

				if (this.oClickEventParameters.row) {
					sPersonName = this.oClickEventParameters.row.getTitle();
					oPersonSelected = this.byId("selectPerson");

					oPersonSelected.setSelectedIndex(aPeople.indexOf(aPeople.filter(function (oPerson) {
						return oPerson.name === sPersonName;
					})[0]));

				}

				oStartDate.setDateValue(oSelectedIntervalStart);

				oEndDate.setDateValue(oSelectedIntervalEnd);

				oTitleInput.setValue("");

				oMoreInfoInput.setValue("");

				oAppointmentType.setSelected(false);

				oDateTimePickerStart.setValueState(ValueState.None);
				oDateTimePickerEnd.setValueState(ValueState.None);

				delete this.oClickEventParameters;
			},

			_setEditAppointmentDialogContent: function (oDialog) {
				var oAppointment = oDialog.getModel().getProperty(this.sPath),
					oSelectedIntervalStart = oAppointment.start,
					oSelectedIntervalEnd = oAppointment.end,
					oDateTimePickerStart = this.byId("startDate"),
					oDateTimePickerEnd = this.byId("endDate"),
					sSelectedInfo = oAppointment.info,
					sSelectedTitle = oAppointment.title,
					iSelectedPersonId = this.sPath[this.sPath.indexOf("/employees/") + "/employees/".length],
					oPersonSelected = this.byId("selectPerson"),
					oStartDate = this.byId("startDate"),
					oEndDate = this.byId("endDate"),
					oMoreInfoInput = this.byId("moreInfo"),
					oTitleInput = this.byId("inputTitle"),
					oAppointmentType = this.byId("isIntervalAppointment");

				oPersonSelected.setSelectedIndex(iSelectedPersonId);

				oStartDate.setDateValue(oSelectedIntervalStart);

				oEndDate.setDateValue(oSelectedIntervalEnd);

				oMoreInfoInput.setValue(sSelectedInfo);

				oTitleInput.setValue(sSelectedTitle);

				oDateTimePickerStart.setValueState(ValueState.None);
				oDateTimePickerEnd.setValueState(ValueState.None);

				oAppointmentType.setSelected(false);
			},

			_handleSingleAppointment: function (oAppointment) {
				var oView = this.getView();
				if (oAppointment === undefined) {
					return;
				}

				if (!oAppointment.getSelected() && this._pDetailsPopover) {
					this._pDetailsPopover.then(function (oDetailsPopover) {
						oDetailsPopover.close();
					});
					return;
				}

				if (!this._pDetailsPopover) {
					this._pDetailsPopover = Fragment.load({
						id: oView.getId(),
						name: "home.kpmg.ResourceCalendar.view.Details",
						controller: this
					}).then(function (oDetailsPopover) {
						oView.addDependent(oDetailsPopover);
						return oDetailsPopover;
					});
				}

				this._pDetailsPopover.then(function (oDetailsPopover) {
					this._setDetailsDialogContent(oAppointment, oDetailsPopover);
				}.bind(this));
			},

			_setDetailsDialogContent: function (oAppointment, oDetailsPopover) {
				oDetailsPopover.setBindingContext(oAppointment.getBindingContext());
				oDetailsPopover.openBy(oAppointment);
			},

			formatDate: function (oDate) {
				if (oDate) {
					var iHours = oDate.getHours(),
						iMinutes = oDate.getMinutes(),
						iSeconds = oDate.getSeconds();

					if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
						return DateFormat.getDateTimeInstance({
							style: "medium"
						}).format(oDate);
					} else {
						return DateFormat.getDateInstance({
							style: "medium"
						}).format(oDate);
					}
				}
			},

			_handleGroupAppointments: function (oEvent) {
				var aAppointments,
					sGroupAppointmentType,
					sGroupPopoverValue,
					sGroupAppDomRefId,
					bTypeDiffer;

				aAppointments = oEvent.getParameter("appointments");
				sGroupAppointmentType = aAppointments[0].getType();
				sGroupAppDomRefId = oEvent.getParameter("domRefId");
				bTypeDiffer = aAppointments.some(function (oAppointment) {
					return sGroupAppointmentType !== oAppointment.getType();
				});

				if (bTypeDiffer) {
					sGroupPopoverValue = aAppointments.length + " Appointments of different types selected";
				} else {
					sGroupPopoverValue = aAppointments.length + " Appointments of the same " + sGroupAppointmentType + " selected";
				}

				if (!this._oGroupPopover) {
					this._oGroupPopover = new Popover({
						title: "Group Appointments",
						content: new Label({
							text: sGroupPopoverValue
						})
					});
				} else {
					this._oGroupPopover.getContent()[0].setText(sGroupPopoverValue);
				}
				this._oGroupPopover.addStyleClass("sapUiPopupWithPadding");
				this._oGroupPopover.openBy(document.getElementById(sGroupAppDomRefId));
			},

			onCollapseExpandPress: function () {
				var oNavigationList = this.byId("navigationList");
				var bExpanded = oNavigationList.getExpanded();

				oNavigationList.setExpanded(!bExpanded);
			},

			onHideShowSubItemPress: function () {
				var oNavListItem = this.byId("subItemThree");
				oNavListItem.setVisible(!oNavListItem.getVisible());
			}

		});

		function dateFormat(dateRaw, timeRaw) {
			var dateNum = parseInt(dateRaw.replace(/[^0-9]/g, ""));
			var time = timeRaw.split(/[^0-9]/g);
			time = time.filter(function (str) {
				return /\S/.test(str);
			});
			time.pop();
			var hour = time[0];
			var minutes = time[1];
			var rawDateConverted = new Date(dateNum);
			var newDate = rawDateConverted.toString();
			var day = rawDateConverted.getDate().toString();
			var month = rawDateConverted.getUTCMonth().toString();
			var year = rawDateConverted.getFullYear().toString();
			var dateTime = new Date(year, month, day, hour, minutes)
			return dateTime;
		}

		async function getAppointments(empl) {
			var currentEmployeeAppointments = new JSONModel();
			debugger;
			for (let i = 1; i <= empl.length; i++) {
				appointmentURL = "/sap/opu/odata/sap/ZCALENDAR_SRV/ZC_EMPLOYEE(";
				appointmentURL = appointmentURL.concat(i, "l)/to_appointments?$format=json");
				currentEmployee = empl[i - 1];
				try {
					await currentEmployeeAppointments.loadData(appointmentURL, "", true, "GET", false);
				} catch (e) {
					currentEmployee.appointments = [];
					continue;
				}
				currentEmployee.appointments = currentEmployeeAppointments.oData.d.results;
				//currentEmployee.appointments.push(currentEmployeeAppointments.oData.d.results);
				currentEmployee.appointments.forEach(e => {
					var startDateRaw = e.start_date;
					var endDateRaw = e.end_date;
					var startTimeRaw = e.start_time;
					var endTimeRaw = e.end_time
					e.Start_Date = dateFormat(startDateRaw, startTimeRaw);
					e.End_Date = dateFormat(endDateRaw, endTimeRaw);
				})
				debugger;
			};
		}
	});