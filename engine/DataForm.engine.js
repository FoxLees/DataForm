/***********************************************************************
 * 
 *                          DataForm.Engine
 *                               
 * DataForm.Engine - движок для связи формы ввода данных с сервером 
 * 
 * Зависимости:
 *    - jquery.json.js
 *    - DataForm.js 
 *    - DataForm.extend.js
 * 
 *                                  Copyright 2011-2014, ООО НПП "ЭКРА"
 ***********************************************************************/

//=======================================================================
// Конструктор
// Параметры:
//   - $content - родительский контент для отображения форм
//   - commands - инициализационные команды
//   - post_function - функция для отправки 
//   - end_function - функция обработки завершения сессии  
//   - draw_function - функция обработки события отрисовки формы
DataForm.Engine = function($content, commands, post_function, end_function, draw_function)
{
	// Ссылка на родительский контент, 
	// в котором будут расположены формы данных
	this._$content = $content;
	
	// Признак активности сессии форм
	// Сессия закрывается если:
	//   - вызван метод destroy
	//   - пришла команда DataForm.Engine.COMMAND.CLOSE
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
DataForm.Engine.prototype.destroy = function()
{
	clearTimeout(this._holdTimer);
	clearTimeout(this._connection);
	this._form.destroy();
	this._connection = null;
	this._closed = true;
};

//=======================================================================
// Типы возможных событий, отправляемых серверу
DataForm.Engine.EVENT = {};
//   - event для удержания соединения с сессией
DataForm.Engine.EVENT.HOLD = 0;
//   - события формы
DataForm.Engine.EVENT.FORM = {};
//     - событие, возникающее после того как форма полностью настроена и 
//       все обработчики событий установлены
DataForm.Engine.EVENT.FORM.SHOW = 0x10000;
//     - значения контролов формы
DataForm.Engine.EVENT.FORM.VALUES = 0x10001;
//   - события управляющих кнопок формы
DataForm.Engine.EVENT.BUTTON = {};
//     - нажатие на управляющую кнопку
DataForm.Engine.EVENT.BUTTON.CLICK = 0x20000;
//   - события контролов формы
DataForm.Engine.EVENT.CONTROL = {};
//     - отправка значений контролов
DataForm.Engine.EVENT.CONTROL.CHANGE = 0x30000;
//     - специфичные для ListView события
DataForm.Engine.EVENT.CONTROL.LV = {};
//       - нажатие на кнопку управления контрола ListView
DataForm.Engine.EVENT.CONTROL.LV.CLICK = 0x30100;
//       - изменение признака выбора элемента контрола ListView
DataForm.Engine.EVENT.CONTROL.LV.CHECK = 0x30101;
//       - выделенный элемент контрола ListView
DataForm.Engine.EVENT.CONTROL.LV.SELECTED = 0x30102;
//     - события, специфичные для таймера
DataForm.Engine.EVENT.CONTROL.TIMER = {};
//       - событие по тику тамера
DataForm.Engine.EVENT.CONTROL.TIMER.TICK = 0x30200;
//     - события, специфичные для CheckBox
DataForm.Engine.EVENT.CONTROL.CHB = {};
//       - событие по тику тамера
DataForm.Engine.EVENT.CONTROL.CHB.CHECK = 0x30300;
//     - события, специфичные для ComboBox
DataForm.Engine.EVENT.CONTROL.CB = {};
//       - событие при выборе нового элемента в выпадающем списке
DataForm.Engine.EVENT.CONTROL.CB.SELECT = 0x30400;
//       - нажатие на кнопку выпадающего списка
DataForm.Engine.EVENT.CONTROL.CB.CLICK = 0x30401;

//=======================================================================
// Типы возможных команд, приходящих от сервера
DataForm.Engine.COMMAND = {};
//   - команда удержания соединения с сессией
DataForm.Engine.COMMAND.HOLD = 0x00000000;
//   - закрытие сессии
DataForm.Engine.COMMAND.CLOSE = 0x00000001;
//   - команды форме
DataForm.Engine.COMMAND.FORM = {};
//     - отобразить структуру формы
DataForm.Engine.COMMAND.FORM.DRAW = 0x10000;
//- получить значения контролов
DataForm.Engine.COMMAND.FORM.VALUES = 0x10001;
//   - команды элементу управления
DataForm.Engine.COMMAND.CONTROL = {};
//     - установить признак видимости контрола
DataForm.Engine.COMMAND.CONTROL.VISIBLE = 0x20000;
//     - установить признак активности контрола
DataForm.Engine.COMMAND.CONTROL.ENABLED = 0x20001;
//     - установить признак ошибки контрола
DataForm.Engine.COMMAND.CONTROL.ERROR = 0x20002;
//   - команды, специфичные для контрола ComboBox
DataForm.Engine.COMMAND.CONTROL.CB = {};
//     - установка элементов выбора ComboBox
DataForm.Engine.COMMAND.CONTROL.CB.OPTIONS = 0x20100;
//   - команды, специфичные для контрола ListView
DataForm.Engine.COMMAND.CONTROL.LV = {};
//     - удаление интересующих элементов ListView
DataForm.Engine.COMMAND.CONTROL.LV.DELETE = 0x20200;
//     - удаление всех элементов ListView
DataForm.Engine.COMMAND.CONTROL.LV.CLEAR = 0x20201;
//     - добавление элементов в ListView
DataForm.Engine.COMMAND.CONTROL.LV.INSERT = 0x20202;
//     - получить выделенный элемент ListView 
DataForm.Engine.COMMAND.CONTROL.LV.GET_SELECTED = 0x20203;
//     - установить выделенный элемент ListView
DataForm.Engine.COMMAND.CONTROL.LV.SET_SELECTED = 0x20204;
///     - установка признака активности кнопки
DataForm.Engine.COMMAND.CONTROL.LV.BUTTON_ENABLED = 0x20205;
//   - команды, специфичные для контрола Timer
DataForm.Engine.COMMAND.CONTROL.TIMER = {};
//     - запустить контрол Timer
DataForm.Engine.COMMAND.CONTROL.TIMER.START = 0x20300;
//     - остановить контрол Timer
DataForm.Engine.COMMAND.CONTROL.TIMER.STOP = 0x20301;
//   - команды, специфичные для контрола Progress
DataForm.Engine.COMMAND.CONTROL.PROGRESS = {};
//     - обновить статусное сообщение контрола Progress
DataForm.Engine.COMMAND.CONTROL.PROGRESS.SET_STATUS = 0x020400;
//     - обновить процент контрола Progress
DataForm.Engine.COMMAND.CONTROL.PROGRESS.SET_PERCENT = 0x020401;
//   - команды кнопке управления
DataForm.Engine.COMMAND.BUTTON = {};
//     - установить признак активности кнопки управления формы
DataForm.Engine.COMMAND.BUTTON.ENABLED = 0x030000;

//=======================================================================
// Функция выполнения команд сервера
DataForm.Engine.prototype.executeCommands = function(commands)
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
					case DataForm.Engine.COMMAND.HOLD:
						this.commandHold();
					break;

					case DataForm.Engine.COMMAND.CLOSE:
						this.commandClose(commands[i].error, commands[i].success);
					break;
					
					case DataForm.Engine.COMMAND.FORM.DRAW:
						this.commandFormDraw(commands[i].struct);
					break;
					
					case DataForm.Engine.COMMAND.FORM.VALUES:
						this.commandFormValues(commands[i].controls);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.ENABLED:
						this.commandControlEnabled(commands[i].name, commands[i].enabled);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.ERROR:
						this.commandControlError(commands[i].name, commands[i].error);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.VISIBLE:
						this.commandControlVisible(commands[i].name, commands[i].visible);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.CB.OPTIONS:
						this.commandControlCBOptions(commands[i].name, commands[i].options);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.ADD:
						this.commandControlLVAdd(commands[i].name, commands[i].items);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.DELETE:
						this.commandControlLVDelete(commands[i].name, commands[i].index);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.CLEAR:
						this.commandControlLVClear(commands[i].name);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.INSERT:
						this.commandControlLVInsert(commands[i].name, commands[i].items);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.GET_SELECTED:
						this.commandControlLVGetSelected(commands[i].name);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.SET_SELECTED:
						this.commandControlLVSetSelected(commands[i].name, commands[i].index);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.LV.BUTTON_ENABLED:
						this.commandControlLVButtonEnabled(commands[i].name, commands[i].button, commands[i].enabled);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.TIMER.START:
						this.commandControlTStart(commands[i].name);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.TIMER.STOP:
						this.commandControlTStop(commands[i].name);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.PROGRESS.SET_STATUS:
						this.commandControlPSetStatus(commands[i].name, commands[i].status);
					break;
					
					case DataForm.Engine.COMMAND.CONTROL.PROGRESS.SET_PERCENT:
						this.commandControlPSetPercent(commands[i].name, commands[i].percent);
					break;
					
					case DataForm.Engine.COMMAND.BUTTON.ENABLED:
						this.commandButtonEnabled(commands[i].name, commands[i].enabled);
					break;					
				}
			}
		}
	}
	catch(e) { };
};

//=======================================================================
// DataForm.Engine.COMMAND.HOLD - Обработать команду удержания соединения 
DataForm.Engine.prototype.commandHold = function()
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
// DataForm.Engine.COMMAND.CLOSE - Закрыть сессию форм
DataForm.Engine.prototype.commandClose = function(error, success)
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
// DataForm.Engine.COMMAND.FORM.DRAW - Отобразить форму
DataForm.Engine.prototype.commandFormDraw = function(struct)
{
	// Ссылка на себя
	var self = this;
	
	// Функция предварительной инициализации контролов
	// Здесь мы задаем обработчики событий контролов, для передачи их 
	// на сторону сервера
	function initControls(controls)
	{
		for (var i = 0; i < controls.length; i++)
		{
			if ((controls[i].kind == DataForm.ControlType.GROUPBOX) ||
				(controls[i].kind == DataForm.ControlType.PANEL))
			{
				initControls(controls[i].controls);
			}
			else if (controls[i].kind == DataForm.ControlType.LISTVIEW)
			{
				for (var j = 0; j < controls[i].buttons.length; j++)
				{
					controls[i].onEvent = function(event) {
						switch (event.type) {
							case DataForm.ListView.EventType.ON_ROW_SELECTED:
								self.eventControlLVSelected(this.name, event.index);
								break;
								
							case DataForm.ListView.EventType.ON_ROW_CHECKED:
								self.eventControlLVCheck(this.name, event.index, event.value);
								break;

							case DataForm.ListView.EventType.ON_BUTTON_CLICK:
								self.eventControlLVClick(this.name, event.name);
								break;
						}
					}
				}
			}
			else if (controls[i].kind == DataForm.ControlType.CHECKBOX)
			{
				controls[i].onChange = function() {
					self.eventControlCHBCheck(this);
				};
			}
			else if (controls[i].kind == DataForm.ControlType.COMBOBOX)
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
			else if (controls[i].kind == DataForm.ControlType.TIMER)
			{
				controls[i].onTick = function() {
					self.eventControlTTick(this);
				};
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
	initControls(struct.controls);
	
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
	
	// Выполнить пользовательский обработчик
	if (typeof this._draw_function == 'function')
		this._draw_function(struct.title);

	// Информировать сервер об открытии формы
	this.eventFormShow(this._form.name);
};

//=======================================================================
// DataForm.Engine.COMMAND.FORM.VALUES - получить значения контролов
DataForm.Engine.prototype.commandFormValues = function(controls)
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
// DataForm.Engine.COMMAND.CONTROL.VISIBLE - установить признак видимости контрола
DataForm.Engine.prototype.commandControlVisible = function(name, visible)
{
	try
	{
		control = this._form.control(name);
		if (control)
			control.visible(visible);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.ENABLED - установить признак активности контрола
DataForm.Engine.prototype.commandControlEnabled = function(name, enabled)
{
	try
	{
		control = this._form.control(name);
		if (control)
			control.enabled(enabled);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.ERROR - установить признак ошибки контрола
DataForm.Engine.prototype.commandControlError = function(name, error)
{
	try
	{
		control = this._form.control(name);
		if (control)
			control.error(error);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.CB.OPTIONS - установка элементов выбора ComboBox
DataForm.Engine.prototype.commandControlCBOptions = function(name, options)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.COMBOBOX))
			control.values(options);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.LV.ADD - добавление элементов в ListView
DataForm.Engine.prototype.commandControlLVAdd = function(name, items)
{
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.LV.DELETE - удаление элемента ListView
DataForm.Engine.prototype.commandControlLVDelete = function(name, index)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.LISTVIEW))
			control.dataTable().rows.remove(index);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.LV.CLEAR - удаление всех элементов ListView
DataForm.Engine.prototype.commandControlLVClear = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.LISTVIEW))
			control.dataTable().clear();
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.LV.INSERT - добавление элементов в ListView
DataForm.Engine.prototype.commandControlLVInsert = function(name, items)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.LISTVIEW))
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
// DataForm.Engine.COMMAND.CONTROL.LV.GET_SELECTED - получить выделенный элемент ListView
DataForm.Engine.prototype.commandControlLVGetSelected = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.LISTVIEW))
		{
			var rowid = control.dataTable().rows.selectedRowID();
			this.eventControlLVSelected(name, rowid);
		}
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.LV.SET_SELECTED - установить выделенный элемент ListView
DataForm.Engine.prototype.commandControlLVSetSelected = function(name, index)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.LISTVIEW))
			control.dataTable().rows.selectedRowID(index);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.LV.BUTTON_ENABLED - установить 
// признак активности кнопки ListView
DataForm.Engine.prototype.commandControlLVButtonEnabled = function(name, button, enabled)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.LISTVIEW))
			control.buttonEnabled(button, enabled);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.TIMER.START - запустить контрол Timer
DataForm.Engine.prototype.commandControlTStart = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.TIMER))
			control.start(this._form);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.TIMER.STOP - остановить контрол Timer
DataForm.Engine.prototype.commandControlTStop = function(name)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.TIMER))
			control.stop();
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.PROGRESS.SET_STATUS - обновить статусное
// сообщение контрола Progress
DataForm.Engine.prototype.commandControlPSetStatus = function(name, status)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.PROGRESS))
		{
			if (status)
				control.status(status);
		}
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.CONTROL.PROGRESS.SET_PERCENT - обновить процент
// контрола Progress
DataForm.Engine.prototype.commandControlPSetPercent = function(name, percent)
{
	try
	{
		var control = this._form.control(name);
		if ((control) && (control.kind == DataForm.ControlType.PROGRESS))
		{
			if (percent)
				control.percent(percent);
		}
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.COMMAND.BUTTON.ENABLED - установить признак активности кнопки управления формы
DataForm.Engine.prototype.commandButtonEnabled = function(name, enabled)
{
	try
	{
		button = this._form.button(name);
		if (button) 
			button.enabled(enabled);
	} catch(e) {};
};

//=======================================================================
// DataForm.Engine.EVENT.HOLD - event удержания соединения
DataForm.Engine.prototype.eventHold = function()
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			kind: DataForm.Engine.EVENT.HOLD
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.FORM.SHOW - Отображение формы
DataForm.Engine.prototype.eventFormShow = function()
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.FORM.SHOW
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.FORM.VALUES - Отправляем значения контролов
DataForm.Engine.prototype.eventFormValues = function(controls)
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
			kind: DataForm.Engine.EVENT.FORM.VALUES,
			controls: values
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.CHB.CHECK - Изменение признака выбора 
// CheckBox
DataForm.Engine.prototype.eventControlCHBCheck = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.CHB.CHECK,
			name: control.name,
			checked: control.checked()
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.LV.CHECK - Изменение признака выбора 
// элемента ListView
DataForm.Engine.prototype.eventControlLVCheck = function(name, index, checked)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.LV.CHECK,
			name: name,
			index: index,
			checked: checked
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.LV.SELECTED - Изменение признака выделения 
// элемента ListView
DataForm.Engine.prototype.eventControlLVSelected = function(name, index)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.LV.SELECTED,
			name: name,
			index: index
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.CB.SELECT - Изменение индекса элемента 
// выбора ComboBox
DataForm.Engine.prototype.eventControlCBSelect = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.CB.SELECT,
			name: control.name,
			index: control.value()
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.CB.CLICK - Нажатие на управляющую кнопку
DataForm.Engine.prototype.eventControlCBClick = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.CB.CLICK,
			name: control.name
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.TIMER.TICK - Тик таймера
DataForm.Engine.prototype.eventControlTTick = function(control)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.TIMER.TICK,
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
// DataForm.Engine.EVENT.BUTTON.CLICK - Нажатие на форму
DataForm.Engine.prototype.eventButtonClick = function(button)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.BUTTON.CLICK,
			name: button.name
		};
		// Отправить event
		this._post_function(event);
	}
};

//=======================================================================
// DataForm.Engine.EVENT.CONTROL.LV.CLICK - Нажатие на форму
DataForm.Engine.prototype.eventControlLVClick = function(control, button)
{
	// Если сессия открыта
	if (!this._closed)
	{
		// Сформировать event
		var event = {
			form: this._form.name,
			kind: DataForm.Engine.EVENT.CONTROL.LV.CLICK,
			name: control,
			button: button
		};
		// Отправить event
		this._post_function(event);
	}
};