/***********************************************************************
 * 
 *                          DataFormEngine
 *                               
 * DataFormEngine - движок для связи формы ввода данных с сервером 
 * 
 * Зависимости:
 *    - jquery.js
 *    - jquery.json.js
 *    - jquery.extends.js
 *    - jquery.userSelect.js
 *    - jquery.datePicker.js
 *    - DataTable.js
 *    - DataForm.js 
 *    - localization.js
 * 
 * История изменений:
 *   - 26.03.2013 - Создание
 *     
 *                                  Copyright 2011-2014, ООО НПП "ЭКРА"
 *                                                                                           
 ***********************************************************************/

//=======================================================================
// Конструктор
// Параметры:
//   - $content - родительский контент для отображения форм
//   - commands - инициализационные команды
//   - post_function - функция для отправки 
//   - end_function - функция обработки завершения сессии  
//   - draw_function - функция обработки события отрисовки формы
DataFormEngine = function($content, commands, post_function, end_function, draw_function)
{
	// Ссылка на родительский контент, 
	// в котором будут расположены формы данных
	this._$content = $content;
	
	// Признак активности сессии форм
	// Сессия закрывается если:
	//   - вызван метод destroy
	//   - пришла команда DataFormEngine.COMMAND.CLOSE
	this._closed = false;
	// Таймер для периодического опроса сессии на сервере
	// в целях индицкации активности сессии
	this._connection = null;
	
	// Функция отправки событий на сервер
	this._post_function = post_function;
	// Функция, которую надо вызвать по окончании работы сессии движка 
	this._end_function = end_function;
	// Функция, которая вызывается перед отрисовкой формы
	this._draw_function = draw_function;
	
	// Ссылка на объект текуще формы
	this._form = null;
	
	// Выполнить инициализационные команды
	this.executeCommands(commands);
	// Отправить event поддержания соединения
	this.eventHold();
	
	var self = this;
	// Время последней команды поддержания соединения
	this._holdTime = new Date().valueOf();
	// Запустить таймер проверки наличия соединения
	this._holdTimer = setInterval(function() {
		if (new Date().valueOf() - self._holdTime > 10000)
		{
			// Остановить таймер проверки наличия соединения
			clearTimeout(self._holdTimer);
			// Заверщить настроечную сессию с сообщением об ошибке
			self.commandClose(LOCALIZATION.COMPONENTS.HOLD_ERROR);
		}
	}, 1000);
};

//=======================================================================
// Деструктор. Если мы хотим удалить сессию форм, то мы должны вызвать
// деструктор. Это необходимо, т.к. механизм удержания соединения
// выполняет периодический опрос сессии на сервере по таймеру. 
// Здесь мы, указав _closed = true, отменяем этот опрос
// Если не вызывать деструктор, то удержание соединения будет продолжаться
DataFormEngine.prototype.destroy = function()
{
	clearTimeout(this._holdTimer);
	clearTimeout(this._connection);
	this._form.destroy();
	this._connection = null;
	this._closed = true;
};

//=======================================================================
// Типы возможных событий, отправляемых серверу
DataFormEngine.EVENT = {};
//   - event для удержания соединения с сессией
DataFormEngine.EVENT.HOLD = 0;
//   - события формы
DataFormEngine.EVENT.FORM = {};
//     - событие, возникающее после того как форма полностью настроена и 
//       все обработчики событий установлены
DataFormEngine.EVENT.FORM.SHOW = 0x10000;
//     - значения контролов формы
DataFormEngine.EVENT.FORM.VALUES = 0x10001;
//   - события управляющих кнопок формы
DataFormEngine.EVENT.BUTTON = {};
//     - нажатие на управляющую кнопку
DataFormEngine.EVENT.BUTTON.CLICK = 0x20000;
//   - события контролов формы
DataFormEngine.EVENT.CONTROL = {};
//     - отправка значений контролов
DataFormEngine.EVENT.CONTROL.CHANGE = 0x30000;
//     - специфичные для ListView события
DataFormEngine.EVENT.CONTROL.LV = {};
//       - нажатие на кнопку управления контрола ListView
DataFormEngine.EVENT.CONTROL.LV.CLICK = 0x30100;
//       - изменение признака выбора элемента контрола ListView
DataFormEngine.EVENT.CONTROL.LV.CHECK = 0x30101;
//       - выделенный элемент контрола ListView
DataFormEngine.EVENT.CONTROL.LV.SELECTED = 0x30102;
//     - события, специфичные для таймера
DataFormEngine.EVENT.CONTROL.TIMER = {};
//       - событие по тику тамера
DataFormEngine.EVENT.CONTROL.TIMER.TICK = 0x30200;
//     - события, специфичные для CheckBox
DataFormEngine.EVENT.CONTROL.CHB = {};
//       - событие по тику тамера
DataFormEngine.EVENT.CONTROL.CHB.CHECK = 0x30300;
//     - события, специфичные для ComboBox
DataFormEngine.EVENT.CONTROL.CB = {};
//       - событие при выборе нового элемента в выпадающем списке
DataFormEngine.EVENT.CONTROL.CB.SELECT = 0x30400;
//       - нажатие на кнопку выпадающего списка
DataFormEngine.EVENT.CONTROL.CB.CLICK = 0x30401;

//=======================================================================
// Типы возможных команд, приходящих от сервера
DataFormEngine.COMMAND = {};
//   - команда удержания соединения с сессией
DataFormEngine.COMMAND.HOLD = 0x00000000;
//   - закрытие сессии
DataFormEngine.COMMAND.CLOSE = 0x00000001;
//   - команды форме
DataFormEngine.COMMAND.FORM = {};
//     - отобразить структуру формы
DataFormEngine.COMMAND.FORM.DRAW = 0x10000;
//- получить значения контролов
DataFormEngine.COMMAND.FORM.VALUES = 0x10001;
//   - команды элементу управления
DataFormEngine.COMMAND.CONTROL = {};
//     - установить признак видимости контрола
DataFormEngine.COMMAND.CONTROL.VISIBLE = 0x20000;
//     - установить признак активности контрола
DataFormEngine.COMMAND.CONTROL.ENABLED = 0x20001;
//     - установить признак ошибки контрола
DataFormEngine.COMMAND.CONTROL.ERROR = 0x20002;
//   - команды, специфичные для контрола ComboBox
DataFormEngine.COMMAND.CONTROL.CB = {};
//     - установка элементов выбора ComboBox
DataFormEngine.COMMAND.CONTROL.CB.OPTIONS = 0x20100;
//   - команды, специфичные для контрола ListView
DataFormEngine.COMMAND.CONTROL.LV = {};
//     - удаление интересующих элементов ListView
DataFormEngine.COMMAND.CONTROL.LV.DELETE = 0x20200;
//     - удаление всех элементов ListView
DataFormEngine.COMMAND.CONTROL.LV.CLEAR = 0x20201;
//     - добавление элементов в ListView
DataFormEngine.COMMAND.CONTROL.LV.INSERT = 0x20202;
//     - получить выделенный элемент ListView 
DataFormEngine.COMMAND.CONTROL.LV.GET_SELECTED = 0x20203;
//     - установить выделенный элемент ListView
DataFormEngine.COMMAND.CONTROL.LV.SET_SELECTED = 0x20204;
///     - установка признака активности кнопки
DataFormEngine.COMMAND.CONTROL.LV.BUTTON_ENABLED = 0x20205;
//   - команды, специфичные для контрола Timer
DataFormEngine.COMMAND.CONTROL.TIMER = {};
//     - запустить контрол Timer
DataFormEngine.COMMAND.CONTROL.TIMER.START = 0x20300;
//     - остановить контрол Timer
DataFormEngine.COMMAND.CONTROL.TIMER.STOP = 0x20301;
//   - команды, специфичные для контрола Progress
DataFormEngine.COMMAND.CONTROL.PROGRESS = {};
//     - обновить статусное сообщение контрола Progress
DataFormEngine.COMMAND.CONTROL.PROGRESS.SET_STATUS = 0x020400;
//     - обновить процент контрола Progress
DataFormEngine.COMMAND.CONTROL.PROGRESS.SET_PERCENT = 0x020401;
//   - команды кнопке управления
DataFormEngine.COMMAND.BUTTON = {};
//     - установить признак активности кнопки управления формы
DataFormEngine.COMMAND.BUTTON.ENABLED = 0x030000;

//=======================================================================
// Функция выполнения команд сервера
DataFormEngine.prototype.executeCommands = function(commands)
{
	try
	{
		if ((commands != null) && (commands.length != ''))
		{
			commands = $.parseJSON(commands);
			for (var i = 0; i < commands.length; i++)
			{
				switch (commands[i].kind)
				{
					case DataFormEngine.COMMAND.HOLD:
						this.commandHold();
					break;

					case DataFormEngine.COMMAND.CLOSE:
						this.commandClose(commands[i].error, commands[i].success);
					break;
					
					case DataFormEngine.COMMAND.FORM.DRAW:
						this.commandFormDraw(commands[i].struct);
					break;
					
					case DataFormEngine.COMMAND.FORM.VALUES:
						this.commandFormValues(commands[i].controls);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.ENABLED:
						this.commandControlEnabled(commands[i].name, commands[i].enabled);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.ERROR:
						this.commandControlError(commands[i].name, commands[i].error);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.VISIBLE:
						this.commandControlVisible(commands[i].name, commands[i].visible);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.CB.OPTIONS:
						this.commandControlCBOptions(commands[i].name, commands[i].options);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.ADD:
						this.commandControlLVAdd(commands[i].name, commands[i].items);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.DELETE:
						this.commandControlLVDelete(commands[i].name, commands[i].index);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.CLEAR:
						this.commandControlLVClear(commands[i].name);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.INSERT:
						this.commandControlLVInsert(commands[i].name, commands[i].items);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.GET_SELECTED:
						this.commandControlLVGetSelected(commands[i].name);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.SET_SELECTED:
						this.commandControlLVSetSelected(commands[i].name, commands[i].index);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.LV.BUTTON_ENABLED:
						this.commandControlLVButtonEnabled(commands[i].name, commands[i].button, commands[i].enabled);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.TIMER.START:
						this.commandControlTStart(commands[i].name);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.TIMER.STOP:
						this.commandControlTStop(commands[i].name);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.PROGRESS.SET_STATUS:
						this.commandControlPSetStatus(commands[i].name, commands[i].status);
					break;
					
					case DataFormEngine.COMMAND.CONTROL.PROGRESS.SET_PERCENT:
						this.commandControlPSetPercent(commands[i].name, commands[i].percent);
					break;
					
					case DataFormEngine.COMMAND.BUTTON.ENABLED:
						this.commandButtonEnabled(commands[i].name, commands[i].enabled);
					break;					
				}
			}
		}
	}
	catch(e) { };
};

//=======================================================================
// DataFormEngine.COMMAND.HOLD - Обработать команду удержания соединения 
DataFormEngine.prototype.commandHold = function()
{
	var self = this;
	// Отменить предыдущий таймер (если он еще не отменены и не выполнен)
	clearTimeout(self._connection);
	// Установить новый
	self._connection = setTimeout(function() {
		// Обновить время последней команды поддержания соединения
		self._holdTime = new Date().valueOf();
		// Продолжать поддерживать соединение только если
		// сессия еще не закрыта
		if (!self._closed)
			self.eventHold();		
	}, 1000);
	
};

//=======================================================================
// DataFormEngine.COMMAND.CLOSE - Закрыть сессию форм
DataFormEngine.prototype.commandClose = function(error, success)
{
	// Сохранить признак закрытия сессии
	this._closed = true;
	// Удалить все выведенные данные из браузера
	this._$content.html('');
	// Вызвать пользовательский обработчик
	if (typeof this._end_function == 'function')
		this._end_function(error, success);
};

//=======================================================================
// DataFormEngine.COMMAND.FORM.DRAW - Отобразить форму
DataFormEngine.prototype.commandFormDraw = function(struct)
{
	// Ссылка на себя
	var self = this;
	
	// Функция предварительной инициализации контролов
	function initControlsBefore(controls)
	{
		for (var i = 0; i < controls.length; i++)
		{
			if ((controls[i].kind == DataForm.CONTROL.GROUPBOX) ||
				(controls[i].kind == DataForm.CONTROL.PANEL))
			{
				initControlsBefore(controls[i].controls);
			}
			else if (controls[i].kind == DataForm.CONTROL.LISTVIEW)
			{
				for (var j = 0; j < controls[i].buttons.length; j++)
				{
					controls[i].buttons[j].onClick = function(button) {
			 			self.eventControlLVClick(this.name, button);
			 		};
				}
			}
			else if (controls[i].kind == DataForm.CONTROL.CHECKBOX)
			{
				controls[i].onChange = function() {
					self.eventControlCHBCheck(this);
				};
			}
			else if (controls[i].kind == DataForm.CONTROL.COMBOBOX)
			{
				controls[i].onChange = function() {
					self.eventControlCBSelect(this);
				};
				if (controls[i].button)
				{
					controls[i].button.onClick = function() {
						self.eventControlCBClick(this);
					};
				}
			}
			else if (controls[i].kind == DataForm.CONTROL.TIMER)
			{
				controls[i].onTick = function() {
					self.eventControlTTick(this);
				};
			}
		}
	}
	
	// Функция инициализации контролов после создания формы
	function initControlsAfter(controls)
	{
		var control = null;
		for (var i = 0; i < controls.length; i++)
		{
			if ((controls[i].kind == DataForm.CONTROL.GROUPBOX) ||
				(controls[i].kind == DataForm.CONTROL.PANEL))
			{
				initControlsAfter(controls[i].controls);
			}
			else if (controls[i].kind == DataForm.CONTROL.LISTVIEW)
			{
				var data = [];
				if (controls[i].items)
				{
					for (var j = 0; j < controls[i].items.length; j++)
					{
						var item = [];
						for (var k = 0; k < 1; k++)
							item.push({type: GLOBAL.VAR_TYPE.STRING, checked: controls[i].items[j].checked, value: controls[i].items[j].data[k]});
						for (var k = 1; k < controls[i].items[j].data.length; k++)
							item.push({type: GLOBAL.VAR_TYPE.STRING, value: controls[i].items[j].data[k]});
						data.push(item);
					}
				};
			 	
				control = self._form.control(controls[i].name);
				control.dataTable({
					name: controls[i].name,
					columns: {data: controls[i].columns, resize: true, fill: false},
					rows: {fullRowSelect: true, checkable: controls[i].checkable},
					events: {
						onRowCheck: function(rowid) {
							self.eventControlLVCheck(this.name, rowid, this.data[rowid][0].checked);
						},
						onRowSelect: function(rowid) {
							self.eventControlLVSelected(this.name, rowid);
						}
					}
				}, data);
			}
		}
	}
	
	// Функция предварительной инициализации кнопок
	function initButtons(buttons)
	{
		// Навесить обработчики событий управляющих кнопок
		for (var i = 0; i < buttons.length; i++)
		{
			buttons[i].onClick = function() {
				self.eventButtonClick(this);
			};
		}
	}
	
	// Предварительная инициализация контролов
	initControlsBefore(struct.controls);
	
	// Предварительная инициализация кнопок
	initButtons(struct.buttons);
	
	// Выгрузить предыдущую форму
	if (this._form)
		this._form.destroy();
	
	// Нарисовать форму
	this._form = new DataForm(this._$content, {
		name     : struct.name,
		controls : struct.controls,
		buttons  : struct.buttons
	}, LOCALIZATION.LANGUAGE);
	
	// Инициализация контролов
	initControlsAfter(struct.controls);
	
	// Выполнить пользовательский обработчик
	if (typeof this._draw_function == 'function')
		this._draw_function(struct.title);

	// Информировать сервер об открытии формы
	this.eventFormShow(this._form.name);
};

//=======================================================================
// DataFormEngine.COMMAND.FORM.VALUES - получить значения контролов
DataFormEngine.prototype.commandFormValues = function(controls)
{
	var controls_defs = [];
	for (var i = 0; i < controls.length; i++)
	{
		var control = this._form.control(controls[i]);
		if (control)
			controls_defs.push(control);
	}
	this.eventFormValues(controls_defs);
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.VISIBLE - установить признак видимости контрола
DataFormEngine.prototype.commandControlVisible = function(name, visible)
{
	try
	{
		control = this._form.control(name);
		if (control)
			control.visible(visible);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.ENABLED - установить признак активности контрола
DataFormEngine.prototype.commandControlEnabled = function(name, enabled)
{
	try
	{
		control = this._form.control(name);
		if (control)
			control.enabled(enabled);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.ERROR - установить признак ошибки контрола
DataFormEngine.prototype.commandControlError = function(name, error)
{
	try
	{
		control = this._form.control(name);
		if (control)
			control.error(error);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.CB.OPTIONS - установка элементов выбора ComboBox
DataFormEngine.prototype.commandControlCBOptions = function(name, options)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.COMBOBOX))
			control.values(options);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.ADD - добавление элементов в ListView
DataFormEngine.prototype.commandControlLVAdd = function(name, items)
{
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.DELETE - удаление элемента ListView
DataFormEngine.prototype.commandControlLVDelete = function(name, index)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.LISTVIEW))
			control.dataTable().rows.remove(index);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.CLEAR - удаление всех элементов ListView
DataFormEngine.prototype.commandControlLVClear = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.LISTVIEW))
			control.dataTable().clear();
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.INSERT - добавление элементов в ListView
DataFormEngine.prototype.commandControlLVInsert = function(name, items)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.LISTVIEW))
		{
			var data = [];
			if (items)
			{
				for (var i = 0; i < items.length; i++)
				{
					var item = [];
					for (var k = 0; k < 1; k++)
						item.push({type: GLOBAL.VAR_TYPE.STRING, checked: items[i].checked, value: items[i].data[k]});
					for (var k = 1; k < items[i].data.length; k++)
						item.push({type: GLOBAL.VAR_TYPE.STRING, value: items[i].data[k]});
					data.push(item);
				}
			};
			control.dataTable().rows.add(data);
		}
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.GET_SELECTED - получить выделенный элемент ListView
DataFormEngine.prototype.commandControlLVGetSelected = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.LISTVIEW))
		{
			var rowid = control.dataTable().rows.selectedRowID();
			this.eventControlLVSelected(name, rowid);
		}
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.SET_SELECTED - установить выделенный элемент ListView
DataFormEngine.prototype.commandControlLVSetSelected = function(name, index)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.LISTVIEW))
			control.dataTable().rows.selectedRowID(index);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.LV.BUTTON_ENABLED - установить 
// признак активности кнопки ListView
DataFormEngine.prototype.commandControlLVButtonEnabled = function(name, button, enabled)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.LISTVIEW))
			control.buttonEnabled(button, enabled);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.TIMER.START - запустить контрол Timer
DataFormEngine.prototype.commandControlTStart = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.TIMER))
			control.start(this._form);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.TIMER.STOP - остановить контрол Timer
DataFormEngine.prototype.commandControlTStop = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.TIMER))
			control.stop();
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.PROGRESS.SET_STATUS - обновить статусное
// сообщение контрола Progress
DataFormEngine.prototype.commandControlPSetStatus = function(name, status)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.PROGRESS))
		{
			if (status)
				control.status(status);
		}
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.CONTROL.PROGRESS.SET_PERCENT - обновить процент
// контрола Progress
DataFormEngine.prototype.commandControlPSetPercent = function(name, percent)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.CONTROL.PROGRESS))
		{
			if (percent)
				control.percent(percent);
		}
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.COMMAND.BUTTON.ENABLED - установить признак активности кнопки управления формы
DataFormEngine.prototype.commandButtonEnabled = function(name, enabled)
{
	try
	{
		button = this._form.button(name);
		if (button) 
			button.enabled(enabled);
	} catch(e) {};
};

//=======================================================================
// DataFormEngine.EVENT.HOLD - event удержания соединения
DataFormEngine.prototype.eventHold = function()
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			kind: DataFormEngine.EVENT.HOLD
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.FORM.SHOW - Отображение формы
DataFormEngine.prototype.eventFormShow = function()
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.FORM.SHOW
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.FORM.VALUES - Отправляем значения контролов
DataFormEngine.prototype.eventFormValues = function(controls)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать значения для отправки	
		var values = []; 
		for (var i = 0; i < controls.length; i++)
		{
			values.push({
				name: controls[i].name,
				value: controls[i].json()
			});
		}
			
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.FORM.VALUES,
			controls: values
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.CHB.CHECK - Изменение признака выбора 
// CheckBox
DataFormEngine.prototype.eventControlCHBCheck = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.CHB.CHECK,
			name: control.name,
			checked: control.checked()
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.LV.CHECK - Изменение признака выбора 
// элемента ListView
DataFormEngine.prototype.eventControlLVCheck = function(name, index, checked)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.LV.CHECK,
			name: name,
			index: index,
			checked: checked
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.LV.SELECTED - Изменение признака выделения 
// элемента ListView
DataFormEngine.prototype.eventControlLVSelected = function(name, index)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.LV.SELECTED,
			name: name,
			index: index
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.CB.SELECT - Изменение индекса элемента 
// выбора ComboBox
DataFormEngine.prototype.eventControlCBSelect = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.CB.SELECT,
			name: control.name,
			index: control.value()
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.CB.CLICK - Нажатие на управляющую кнопку
DataFormEngine.prototype.eventControlCBClick = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.CB.CLICK,
			name: control.name
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.TIMER.TICK - Тик таймера
DataFormEngine.prototype.eventControlTTick = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.TIMER.TICK,
			name: control.name
		};
		// Отправить event
		this._post_function(event);
	}
	else
	{
		// Остановить таймер
		control.stop();
	}
};

//=======================================================================
// DataFormEngine.EVENT.BUTTON.CLICK - Нажатие на форму
DataFormEngine.prototype.eventButtonClick = function(button)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.BUTTON.CLICK,
			name: button.name
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataFormEngine.EVENT.CONTROL.LV.CLICK - Нажатие на форму
DataFormEngine.prototype.eventControlLVClick = function(control, button)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataFormEngine.EVENT.CONTROL.LV.CLICK,
			name: control,
			button: button
		};
		// Отправить event
		this._post_function(event);
	}
};