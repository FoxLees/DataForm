// Пример исползования формы данных
// Возможно процесс создания покажется немного страшным, но 
// это лишь потому, что здесь продемонстрированы все 
// возможности DataForm
DataForm.example = function() {
	// Добавить область для таблицы
	$('body').html('<div class="my-form"></div>');
	
	// В IE нет console!
	
	var log = (function() {
		try {
			console.log('log started');
			return function(message) {
				console.log(message);
			}
		} catch (e) {
			return function(message) {
				alert(message);
			}
		}
	})();
	
	var df = new DataForm($('.my-form'), {
		name: 'myForm',
		controls: [{
			kind     : DataForm.ControlType.TIMER,
			name     : 'DataForm_TIMER_1',
			interval : 500,
			onTick   : (function() {
				var count = 0;
				return function(form) {
					var progress = form.control('DataForm_PROGRESS_1');
					if (count++ == 10) {
						this.stop();
						count = 0;
						progress.status('Приехали');
					} else {
						progress.percent(count * 10);
						progress.status('Поехали:)');
					}
				};
			})()
		}, {
			kind     : DataForm.ControlType.GROUPBOX,
			name     : 'DataForm_GROUPBOX_1',
			caption  : 'GroupBox Caption',
			visible  : true,
			enabled  : true,
			controls : [{
				kind     : DataForm.ControlType.LABEL,
				name     : 'DataForm_LABEL_1',
				caption  : 'Label Caption',
				hint     : 'Label Hint',
				visible  : true,
				enabled  : true
			}, {
				kind       : DataForm.ControlType.TEXTBOX,
				name       : 'DataForm_TEXTBOX_1',
				caption    : 'TextBox Caption',
				text       : 'TextBox Text',
				maxlen     : 10,
				hint       : 'TextBox Hint',
				visible    : true,
				enabled    : true,
				label: {
					caption : 'TextBox Label',
					width   : 150
				},
				button: {
					caption : 'Test',
					hint    : 'Button Hint',
					enabled : true,
					width   : 100,
					onClick : function(form) {
						var textbox = this;
						textbox.buttonEnabled(false);
						textbox.text('!!!!' + textbox.text());
						setTimeout(function() {
							textbox.buttonEnabled(true);
						}, 1000);
					}
				}
			}, {
				kind       : DataForm.ControlType.STEXTBOX,
				name       : 'DataForm_STEXTBOX_1',
				caption    : 'SmartTextBox Caption',
				text       : 'SmartTextBox Text',
				maxlen     : 10,
				hint       : 'SmartTextBox Hint',
				memory     : (function() {
					var values = [];
					for (var i = 0; i < 20; i++)
						values.push('value#' + i);
					return values;
				})(),
				visible    : true,
				enabled    : true,
				label: {
					caption : 'SmartTextBox Label',
					width   : 150
				},
				button: {
					caption : 'Test',
					hint    : 'Button Hint',
					enabled : true,
					width   : 100,
					onClick : function(form) {
						var stextbox = this;
						stextbox.buttonEnabled(false);
						stextbox.text('!!!!' + stextbox.text());
						setTimeout(function() {
							stextbox.buttonEnabled(true);
						}, 1000);
					}
				}
			}, {
				kind     : DataForm.ControlType.COMBOBOX,
				name     : 'DataForm_COMBOBOX_1',
				caption  : 'ComboBox Caption',
				value    : 10,
				values   : (function() {
					var values = [];
					for (var i = 0; i < 20; i++)
						values.push('value#' + i);
					return values;
				})(),
				hint     : 'ComboBox Hint',
				visible  : true,
				enabled  : true,
				onChange : function(form) {
					log('onChange: ' + this.name + ' ' + this.value());
				},
				label: {
					caption : 'ComboBox Label',
					width   : 150
				},
				button: {
					caption : 'Test',
					hint    : 'Button Hint',
					enabled : true,
					width   : 100,
					onClick : function(form) {
						var combobox = this;
						combobox.buttonEnabled(false);
						combobox.values(["New#1", "New#2", "New#3"]);
						combobox.value(1);
						setTimeout(function() {
							combobox.buttonEnabled(true);
						}, 1000);
					}
				}
			}]
		}, {
			kind     : DataForm.ControlType.CHECKBOX,
			name     : 'DataForm_CHECKBOX_1',
			caption  : 'CheckBox Caption',
			hint     : 'CheckBox Hint',
			checked  : true,
			visible  : true,
			enabled  : true,
			onChange : function(form) {
				log('onChange: ' + this.name + ' ' + this.checked());
			}
		}, {
			kind  : DataForm.ControlType.PROGRESS,
			name  : 'DataForm_PROGRESS_1',
		}, {
			kind     : DataForm.ControlType.NUMBER,
			name     : 'DataForm_NUMBER_1',
			caption  : 'Number Caption',
			value    : -10,
			maximum  : 100,
			minimum  : -100,
			visible  : true,
			enabled  : true,
			label: {
				caption : 'Number Label',
				width   : 150
			},
			button: {
				caption : 'Button',
				hint    : 'Button Hint',
				enabled : true,
				width   : 100,
				onClick : function(form) {
					var number = this;
					number.buttonEnabled(false);
					number.value(number.value() * (-2));
					setTimeout(function() {
						number.buttonEnabled(true);
					}, 1000);
				}
			}
		}, {
			kind     : DataForm.ControlType.PANEL,
			name     : 'DataForm_PANEL_1',
			controls : [{
				kind    : DataForm.ControlType.NAMEVALUE,
				name    : 'DataForm_NAMEVALUE_1',
				visible : true,
				items: [{
					name  : 'Name#0',
					value : 'Value#0'
				}, {
					name  : 'Name#1',
					value : 'Value#1'
				}]
			}, {
				kind    : DataForm.ControlType.NAMEVALUE,
				name    : 'DataForm_NAMEVALUE_2',
				visible : true,
				enabled : true,
				items: [{
					name  : 'Name#0',
					value : 'Value#0'
				}, {
					name  : 'Name#1',
					value : 'Value#1'
				}, {
					name  : 'Name#1',
					value : 'Value#1'
				}]
			}]
		}, {
			kind  : DataForm.ControlType.LINE,
			name  : 'DataForm_LINE_1'
		}, {
			kind     : DataForm.ControlType.TIME,
			name     : 'DataForm_TIME_1',
			hours    : 10,
			minutes  : 10,
			hint     : 'Time Hint',
			visible  : true,
			enabled  : true,
			label    : {
				caption : 'Time Label',
				width   : 100
			},
			onChange : function(form) {
				log('onChange: ' + this.name + ' ' + this.hours() + ':' + this.minutes());
			}
		}, {
			kind     : DataForm.ControlType.DATE,
			name     : 'DataForm_DATE_1',
			value    : new Date(),
			hint     : 'Date Hint',
			visible  : true,
			enabled  : true,
			label    : {
				caption : 'Date Label',
				width   : 100
			},
			onChange : function(form) {
				log('onChange: ' + this.name + ' ' + this.value());
			}
		}, {
			kind    : DataForm.ControlType.FILELOAD,
			name    : 'DataForm_FILELOAD_1',
			caption : 'FileLoad Caption',
			action  : '/',
			field   : 'name',
			visible : true,
			enabled : true
		}, {
			kind  : DataForm.ControlType.LINE,
			name  : 'DataForm_LINE_2'
		}, {
			kind      : DataForm.ControlType.LISTVIEW,
			name      : 'DataForm_LISTVIEW_1',
			checkable : true,
			height    : 150,
			onEvent   : function(event) {
				switch (event.type) {
					case DataForm.ListView.EventType.ON_ROW_SELECTED:
						break;
						
					case DataForm.ListView.EventType.ON_ROW_CHECKED:
						break;

					case DataForm.ListView.EventType.ON_BUTTON_CLICK:
						this.buttonEnabled(event.name, !this.buttonEnabled(event.name));
						break;
				}
			},
			columns: [{
				caption: 'Column#1',
				width: 100,
				visible: true
			}, {
				caption: 'Column#2',
				width: 300,
				visible: true				
			}],
			rows: (function() {
				var rows = [];
				for (var r = 0; r < 10; r++) {
					var row = {
						checked: r % 3 == 0,
						data: []
					};
					for (var c = 0; c < 2; c++)
						row.data.push('Row (' + r + ':' + c + ')');
					rows.push(row);
				}
				return rows;
			})(),
			buttons: [{
				name    : 'DataForm_LISTVIEW_1_BUTTON_1',
				caption : 'Button#1',
				hint    : 'Button hint'
			}, {
				name    : 'DataForm_LISTVIEW_1_BUTTON_2',
				caption : 'Button#2',
				hint    : 'Button hint'
			}]
		}],
		buttons: [{
			name    : 'DataForm_BUTTON_1',
			caption : 'Set errors',
			hint    : 'Последовтельная установка ошибок в ЭУ формы',
			enabled : true,
			onClick : function(form) {
				function setError(controls) {
					for (var i = 0; i < controls.length; i++) {
						switch (controls[i].kind) {
							case DataForm.ControlType.GROUPBOX:
							case DataForm.ControlType.PANEL:
								if (!setError(controls[i].controls))
									return false;
	
							default:
								controls[i].error('Ошибка для ' + controls[i].kind);
								if (!confirm('Ошибка для ' + controls[i].kind + '. Продолжить?'))
									return false;
								break;
						}
					}
					return true;
				}
				setError(form.controls);
			}
		}, {
			name    : 'DataForm_BUTTON_2',
			caption : 'Hide/Show',
			hint    : 'Тестирование Hide/Show для всех контролов',
			enabled : true,
			onClick : function(form) {
				setEnabledAllButtons(form, false);
				(function HideShow(controls) {
					var i = 0;
					function hide() {
						if (i < controls.length) {
							controls[i].visible(false);
							setTimeout(function() {
								controls[i].visible(true);
								setTimeout(function() {
									++i;
									hide();
								}, 1000)
							}, 1000);
						} else {
							alert('Test Complete!');
							setEnabledAllButtons(form, true);
						}
					}
					hide();
				})(flatControlsList(form));
			}
		}, {
			name    : 'DataForm_BUTTON_3',
			caption : 'Enable/Disable',
			hint    : 'Тестирование Enable/Disable для всех контролов',
			enabled : true,
			onClick : function(form) {
				setEnabledAllButtons(form, false);
				(function EnableDisable(controls) {
					var i = 0;
					function disable() {
						if (i < controls.length) {
							controls[i].enabled(false);
							setTimeout(function() {
								controls[i].enabled(true);
								setTimeout(function() {
									++i;
									disable();
								}, 1000)
							}, 1000);
						} else {
							alert('Test Complete!');
							setEnabledAllButtons(form, true);
						}
					}
					disable();
				})(flatControlsList(form));
			}
		}, {
			name    : 'DataForm_BUTTON_4',
			caption : 'Set checkbox',
			hint    : 'Управление состоянием CheckBox',
			enabled : true,
			onClick : function(form) {
				var checkbox = form.control('DataForm_CHECKBOX_1');
				checkbox.checked(!checkbox.checked());
			}
		}, {
			name    : 'DataForm_BUTTON_5',
			caption : 'Start timer',
			hint    : 'Запуск таймера формы',
			enabled : true,
			onClick : function(form) {
				form.control('DataForm_TIMER_1').start(df);
			}
		}, {
			name    : 'DataForm_BUTTON_6',
			caption : 'Date & Time',
			hint    : 'Управление значением даты и времени',
			enabled : true,
			onClick : function(form) {
				var date = form.control('DataForm_DATE_1');
				var time = form.control('DataForm_TIME_1');
				var newDate = date.value();
				newDate.setDate(date.value().getDate() - 1);
				date.value(newDate);
				time.hours(time.hours() - 1);
				time.minutes(time.minutes() - 1);
			}
		}, {
			name    : 'DataForm_BUTTON_7',
			caption : 'NameValue',
			hint    : 'Тестирование NameValue',
			enabled : true,
			onClick : function(form) {
				var nv = form.control('DataForm_NAMEVALUE_1');
				nv.value(0, '!!!' + nv.value(0));
				nv.value(1, '!!!' + nv.value(1));
				nv.value(2, '!!!' + nv.value(2));
			}
		}]
	}, DataForm.Language.ENGLISH);
	
	
	// Активация/Деактивация всех кнопок управления форма
	function setEnabledAllButtons(form, enabled) {
		for (var i = 0; i < form.buttons.length; i++) {
			form.buttons[i].enabled(enabled);
		}
	};
	
	// Создать последовательный список всех контролов формы
	function flatControlsList(form) {
		var controlsFlatList = [];
		(function fillControlsFlatList(controls) {
			for (var i = 0; i < controls.length; i++) {
				if ((controls[i].kind == DataForm.ControlType.PANEL) ||
					(controls[i].kind == DataForm.ControlType.GROUPBOX))
					// Рекурсия для дочерних контролов
					fillControlsFlatList(controls[i].controls)
				controlsFlatList.push(controls[i]);
			}
		})(form.controls);
		return controlsFlatList;
	}
};