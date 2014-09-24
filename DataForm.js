/***********************************************************************
 * 
 *                               DataForm
 *                               
 * DataForm - класс для создания формы ввода и управления данными 
 * DataForm.Control (элемент управления) - это элемент отображаемый на форме
 * DataForm.Button (командная кнопка) - кнопка на командной панели под формой
 * 
 * Зависимости:
 *    - jquery.js
 *    - jquery.userSelect.js
 *    - jquery.numberMask.js
 *    
 * Особенности:
 *    1) Все контролы наследуют (прототипоное наследование) от DataForm.Control
 *    2) Возможность расширения набора контролов функцией installPlugins
 *       Такая возможность используется в DataForm.engine.js
 *    3) Некоторые контролы (например, TextBox) имеют управляющую кнопку,
 *       расположенную справа от контрола. Она может отображаться или
 *       не отображаться, как будет указано в структуре формы при создании
 *       Активация/деактивация этой кнопки происходит отдельно
 *    4) Имеется контролы-контейнеры (PANEL и GROUPBOX)
 *    5) Для каждого контрола формируется уникальный id, на основе имени
 *       формы и имени контрола. Именно пожтому, нужно следить за уникальностью
 *       имен формы и контролов.
 *    6) Есть возможность утечки памяти, если использовать таймер на форме.
 *       Цикл такой: функция таймера которая ссылается на форму. В таком 
 *       случае нужно вызвать destroy, что остановит все таймеры формы, 
 *       либо остановить таймер.
 *    7) К контролам формы можно обращаться по имени методом control()
 *    8) К кнопкам формы можно обращаться по имени методом button()
 *    9) Есть свойства controls и buttons, которые хранят ассоциативный 
 *       список контролов и кнопок
 *   10) Про типы контролов читаем рядом с DataForm.ControlType
 *   11) Если деактивируем контрол-контейнер, то деактивируются все 
 *       дочерние элементы. Если активируем - активируются все дочерние.
 *       Индивидуальное состояние активности отдельного дочернего контрола
 *       теряется. (можно перенести в _TODO)
 *   12) У каждого контрола имеется метода json(), который возвращает
 *       JSON-объект представления данных контрола.
 *   13) SmartTextBox хорош тем, что обладает памятью. При создании
 *       контрола память заполняется. Когда пользовательначинает вводить 
 *       данные, открывается список выбора (максимум 5 элементов). 
 *       Продолжение ввода сократит этот список 
 *
 * TODO:
 *    1) Сейчас события каждого контрола (кроме LISTVIEW) обрабатываются
 *       поотдельности, т.е. событие изменение значения - отдельное, а событие
 *       нажатие управляющей кнопки этого контрола - отдельное. Это не круто,
 *       но пока терпимо. Если же понадобится больше событий, (например, 
 *       наведение, получение фокуса), то мы можем сделать так как в ListView
 *       (см. DataForm.ListView.EventType)
 *    2) Возможно нужно будет переписать построитель формы (DataForm.Builder).
 *       Что-то уж очень много повторений в нем. Не нравится
 *
 *                                  Copyright 2012-2014, ООО НПП "ЭКРА"
 ***********************************************************************/

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * 
 *                    Описание класса DataForm
 * 
 * Для создания объекта класса необходимо осуществить следующий вызов:
 * 
 *              form = new DataForm(content, struct, language);
 *              
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * Параметр content = $(...) - это родительский jquery объект, воторый 
 * будет помещен HTML-код формы
 *  
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * Параметр struct - это структура формы:
 * 
 * struct = 
 * {
 *   name  : String   - уникальное имя формы,
 *   controls: [{...},...] - Элменты управления формы (Описание зависит от типа (см. DataForm.ControlType))
 *   buttons:[{
 *     name    : String  - уникальное имя,
 *     caption : String  - заголовок,
 *     hint    : String  - всплывающая подсказка,
 *     width   : Number  - ширина кнопки,
 *     enabled : Boolean - признак активности кнопки,
 *     onClick : function(form) { пользовательский обработчик нажатия };
 *   },...] - Панель управления
 * }
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



//========================================================================
// Наследование
Function.prototype.extendClass = Function.prototype.extendClass || function(Parent) {
	var F = function() { };
	F.prototype = Parent.prototype;
	this.prototype = new F();
	this.prototype.constructor = this;
	this.superclass = Parent.prototype;
};



//========================================================================
// Построитель HTML-строк
if (HTMLBuilder === undefined) {
	var HTMLBuilder = function()
	{
		this._buffer = new Array();
		this._index = 0;
	};
	
	HTMLBuilder.prototype.append =  function(text) 
	{
		this._buffer[this._index] = text;
		this._index++;
	};
	
	HTMLBuilder.prototype.toString = function() 
	{
		return this._buffer.join('');
	};
}

//========================================================================
// Построитель таблицы
DataForm.Builder = function(form, localization)
{
	// Вызов родительского конструктора
	DataForm.Builder.superclass.constructor.call(this);
	
	// Уникальное имя формы 
	this._form_name = '';
	// Локализация формы
	this._localization = localization;
	
	// Сохранить имя формы
	if (form.name === undefined)
		throw new Error('Form name is null');
	else
		this._form_name = form.name;

	// Инициализация HTML-кода
	this.append('<div class="' + DataForm.Builder.CSS.FORM + '" id="' + this._form_name + '">');

	// Добавить область данных формы
	if ((form.controls) && (form.controls.length > 0))
	{
		this.append('<div class="' + DataForm.Builder.CSS.FORM_DATA + '">');
		for (var i = 0; i < form.controls.length; i++)
			this.appendControl(form.controls[i]);
		this.append('</div>');
	}
	
	// Добавить панель управления формы
	if ((form.buttons) && (form.buttons.length > 0))
	{
		this.append('<div class="' + DataForm.Builder.CSS.FORM_BUTTON + '">');
		for (var i = 0; i < form.buttons.length; i++)
			this.appendCommandButton(form.buttons[i]);
		this.append('<div class="df_clear"></div></div>');
	}
	
	this.append('</div>');
};
DataForm.Builder.extendClass(HTMLBuilder);

// Название CSS классов для описания формы
DataForm.Builder.CSS = {};
DataForm.Builder.CSS.FORM = 'df';
DataForm.Builder.CSS.FORM_DATA    = DataForm.Builder.CSS.FORM + '_data';
DataForm.Builder.CSS.FORM_CONTROL = DataForm.Builder.CSS.FORM + '_control';
DataForm.Builder.CSS.FORM_BUTTON  = DataForm.Builder.CSS.FORM + '_command';
DataForm.Builder.CSS.FORM_CONTROL_DISABLED = DataForm.Builder.CSS.FORM_CONTROL + '--disabled';
DataForm.Builder.CSS.FORM_CONTROL_FOCUSED  = DataForm.Builder.CSS.FORM_CONTROL + '--focused';

// Функция генерация идентификатора элемента управления
// Параметры:
//   - form_name - имя формы
//   - control_name - уникальное имя контрола
DataForm.Builder.controlID = function(form_name, control_name)
{
	return DataForm.Builder.CSS.FORM_CONTROL + '_id__' + form_name + '__' + control_name;
};

// Получение имени css класса для контрола по его типу
DataForm.Builder.controlCSS = function(control_type)
{
	return DataForm.Builder.CSS.FORM_CONTROL + '_' + control_type; 
};

// Функция генерация идентификатора кнопки панели управления
// Параметры:
//   - form_name - имя формы
//   - button_name - уникальное имя кнопки
DataForm.Builder.buttonID = function(form_name, button_name)
{
	return DataForm.Builder.CSS.FORM_BUTTON + '_id__' + form_name + '__' + button_name;
};

// Получение имени css класса для кнопки панели управления
DataForm.Builder.buttonCSS = function()
{
	return DataForm.Builder.CSS.FORM_BUTTON + '_button'; 
};

// Функция создания строки с HTML кодом для формы
DataForm.Builder.html = function(struct, localization)
{
	var builder = null;
	builder = new DataForm.Builder(struct, localization);
	return builder.toString();
};

// Метод добавления элемента управления
DataForm.Builder.prototype.appendControl = function(control)
{
	switch (control.kind)
	{
		case DataForm.ControlType.LABEL:
			this.appendLabel(control);
		break;
		
		case DataForm.ControlType.TEXTBOX:
			this.appendTextBox(control);
		break;
		
		case DataForm.ControlType.STEXTBOX:
			this.appendSmartTextBox(control);
		break;
		
		case DataForm.ControlType.COMBOBOX:
			this.appendComboBox(control);
		break;
		
		case DataForm.ControlType.GROUPBOX:
			this.appendGroupBox(control);
		break;
		
		case DataForm.ControlType.PANEL:
			this.appendPanel(control);
		break;
		
		case DataForm.ControlType.NAMEVALUE:
			this.appendNameValue(control);
		break;
		
		case DataForm.ControlType.CHECKBOX:
			this.appendCheckBox(control);
		break;
		
		case DataForm.ControlType.LISTVIEW:
			this.appendListView(control);
		break;
		
		case DataForm.ControlType.PROGRESS:
			this.appendProgress(control);
		break;
		
		case DataForm.ControlType.LINE:
			this.appendLine(control);
		break;

		case DataForm.ControlType.NUMBER:
			this.appendNumber(control);
		break;
		
		default:
			var plugin = DataForm.plugins[control.kind];
			if (plugin)
				plugin.append.call(this, control);
	}
};

// Метод добавления элемента DataForm.ControlType.LABEL
DataForm.Builder.prototype.appendLabel = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.LABEL)
		return;
	
	// CSS класс для отображения элемента
	var css = DataForm.Builder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	if (control.caption === undefined)
		control.caption = '';
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');
		this.append('<div class="' + css + '_out">');
			this.append(control.caption);
		this.append('</div>');
	this.append('</div>');
};

// Метод добавления элемента DataForm.ControlType.TEXTBOX
DataForm.Builder.prototype.appendTextBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.TEXTBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataForm.Builder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;

	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption === undefined)
			control.label.caption = '';
	}
	else
	{
		label_width = 0;
	}
	
	// Корректировать ширину кнопки
	if (control.button)
	{
		if (control.button.width > button_width)
			button_width = control.button.width;
		if (control.button.caption === undefined)
			control.button.caption = '';
		if (control.button.hint === undefined)
			control.button.hint = '';
	}
	else
	{
		button_width = 0;
	}
	
	if (control.text === undefined)
		control.text = '';
	
	if (control.maxlen === undefined)
		control.maxlen = 100;
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' +
		' style="width:' + ((control.width > 100) ? control.width + 'px' : '') + '">');
	
	// Добавить заголовок над полем
	if ((control.caption != '') && (control.caption != null))
	{
		this.append('<div class="' + css + '_caption">');
			this.append(control.caption);
		this.append('</div>');
	}
	
	// Добавить имя поля слева
	if (control.label)
	{
		this.append('<div class="' + css + '_label" style="width: ' + label_width + 'px">');
			this.append(control.label.caption);
		this.append('</div>');
	}
	
	// Собственно поле :)
	this.append('<div class="' + css + '_value" style="margin-right:-' + 
		button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + 
		button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<input type="' + (control.password ? 'password' : 'text') + 
		'" maxlength="' + control.maxlen + '" value="' + control.text + '">');
	this.append('</div></div>');
		
	// Кнопка справа
	if (control.button)
	{
		this.append('<div' +
			' class="' + css + '_button"' +
			' style="width: ' + (button_width - 10) + 'px"' +
			' title="' + control.button.hint + '">');
		
		this.append('<button');
		if (control.button.enabled == false)
			this.append(' class="disabled" disabled');
		this.append('>' + control.button.caption + '</button>');
		
		this.append('</div>');
	}
	
	this.append('<div class="df_clear"></div>');
	this.append('</div>');
};

// Метод добавления элемента DataForm.ControlType.STEXTBOX
DataForm.Builder.prototype.appendSmartTextBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.STEXTBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataForm.Builder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;

	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption === undefined)
			control.label.caption = '';
	}
	else
	{
		label_width = 0;
	}
	
	// Корректировать ширину кнопки
	if (control.button)
	{
		if (control.button.width > button_width)
			button_width = control.button.width;
		if (control.button.caption === undefined)
			control.button.caption = '';
		if (control.button.hint === undefined)
			control.button.hint = '';
	}
	else
	{
		button_width = 0;
	}
	
	if (control.text === undefined)
		control.text = '';
	
	if (control.maxlen === undefined)
		control.maxlen = 100;
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' +
		' style="width:' + ((control.width > 100) ? control.width + 'px' : '') + '">');
	
	// Добавить заголовок над полем
	if ((control.caption != '') && (control.caption != null))
	{
		this.append('<div class="' + css + '_caption">');
			this.append(control.caption);
		this.append('</div>');
	}
	
	// Добавить имя поля слева
	if (control.label)
	{
		this.append('<div class="' + css + '_label" style="width: ' + label_width + 'px">');
			this.append(control.label.caption);
		this.append('</div>');
	}
	
	// Область поля ввода
	this.append('<div class="' + css + '_value" style="margin-right:-' + 
		button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + 
		button_width + 'px;margin-left:' + label_width + 'px;">');
	
	// Собственно поле ввода :)
	this.append('<input type="text" maxlength="' + control.maxlen + '" value="' + control.text + '">');
	
	// Добавить список элементов памяти
	this.append('<div class="' + css + '_memory">');
	if (control.memory)
	{
		for (var i = 0; i < control.memory.length; i++)
		{
			this.append('<div class="' + css + '_memory_item">');
				this.append(control.memory[i]);
			this.append('</div>');
		}
	}
	this.append('</div>');
	
	this.append('</div></div>');
		
	// Кнопка справа
	if (control.button)
	{
		this.append('<div' +
			' class="' + css + '_button"' +
			' style="width: ' + (button_width - 10) + 'px"' +
			' title="' + control.button.hint + '">');
		
		this.append('<button');
		if (control.button.enabled == false)
			this.append(' class="disabled" disabled');
		this.append('>' + control.button.caption + '</button>');
		
		this.append('</div>');
	}

	this.append('<div class="df_clear"></div>');
	
	this.append('</div>');
};

// Метод добавления элемента groupbox
DataForm.Builder.prototype.appendGroupBox = function(control)
{
	if (control.kind != DataForm.ControlType.GROUPBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataForm.Builder.controlCSS(control.kind);
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');
	this.append('<div class="' + css + '_title">' + control.caption + '</div>');
	this.append('<div class="' + css + '_data">');

	// Рекурсивное добаление подэлементов
	if (control.controls)
		for (var i = 0; i < control.controls.length; i++)
			this.appendControl(control.controls[i]);
	
	this.append('</div></div>');
};

// Метод добавления элемента panel
DataForm.Builder.prototype.appendPanel = function(control)
{
	// Если нет дочерних контролов, то и панель добавлять не будем
	if (control.controls)
	{
		if (control.kind != DataForm.ControlType.PANEL)
			return;
		
		// CSS класс для отображения элемента
		var css = DataForm.Builder.controlCSS(control.kind);
		// Ширина областей панели
		var width = Math.round(100 / control.controls.length);
		if (DataForm.isIE(8))
			width = width - 0.001;
		
		
		this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
			'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');

		// Рекурсивное добавление пожэлементов
		for (var i = 0; i < control.controls.length; i++)
		{
			this.append('<div class="' + css + '_item" style="width:' + width + '%">');
				this.append('<div class="' + css + '_item_wrapper ' + (i == 0 ? 'first' : '') + '">');
					this.appendControl(control.controls[i]);
				this.append('</div>');
			this.append('</div>');
		}
	
		this.append('<div class="df_clear"></div>');
		this.append('</div>');
	}
};

// Метод добавления элемента combobox
DataForm.Builder.prototype.appendComboBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.COMBOBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataForm.Builder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;
	
	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption === undefined)
			control.label.caption = '';
	}
	else
	{
		label_width = 0;
	}
			
	// Корректировать ширину кнопки
	if (control.button)
	{
		if (control.button.width > button_width)
			button_width = control.button.width;
		if (control.button.caption === undefined)
			control.button.caption = '';
		if (control.button.hint === undefined)
			control.button.hint = '';		
	}
	else
	{
		button_width = 0;
	}
	
	this.append('<div' +
		' class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + '" ' +
		' id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' +
		' style="width:' + ((control.width > 100) ? control.width + 'px' : '') + '">');
	
	// Добавить заголовок над полем
	if ((control.caption != '') && (control.caption != null))
	{
		this.append('<div class="' + css + '_caption">');
			this.append(control.caption);
		this.append('</div>');
	}	
	
	// Добавить имя поля слева
	if (control.label)
	{
		this.append('<div class="' + css + '_label" style="width: ' + label_width + 'px">');
			this.append(control.label.caption);
		this.append('</div>');
	}
	
	// Собственно поле :)
	this.append('<div class="' + css + '_value" style="margin-right:-' + 
		button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + 
		button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<select id="' + DataForm.ComboBox.selectPrefix + control.name + '" class="userSelect">');
	for (var i = 0; i < control.values.length; i++)
		this.append('<option>' + control.values[i]);
	this.append('</select></div></div>');
		
	// Кнопка справа
	if (control.button)
	{
		this.append('<div');
			this.append(' class="' + css + '_button"');
			this.append(' style="width: ' + (button_width - 10) + 'px"');
			this.append(' title="' + control.button.hint + '"');
		this.append('>');
		
		this.append('<button');
		if (control.button.enabled == false)
			this.append(' class="disabled" disabled');
		this.append('>' + control.button.caption + '</button>');
		
		this.append('</div>');
	}
	
	this.append('<div class="df_clear"></div>');
	this.append('</div>');
};

// Добавление HTML-кода элемента checkbox
DataForm.Builder.prototype.appendCheckBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.CHECKBOX)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Подсказка
	var hint = '';
	if (control.hint != null)
		hint = control.hint;
	
	this.append('<div ' +
		(control.margin > 0 ? 'style="margin-left: ' + control.margin + 'px"' : '') +
		' class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + DataForm.Builder.controlCSS(control.kind) + 
		(control.checked ? ' checked' : '') +'" ' + 
		' id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' +
		' title="' + hint + '">');
		this.append('<label>');
			this.append('<input type="checkbox" ' + (control.checked ? 'checked' : '') + '>');
			//this.append('<i class="fa">' + (control.checked ? '&#xf046;' : '&#xf096;')  + '</i> ');
			this.append(control.caption);
		this.append('</label>');
	this.append('</div>');
};

// Метод добавления элемента namevalue
DataForm.Builder.prototype.appendNameValue = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.NAMEVALUE)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Название класса контрола
	var controlCSS = DataForm.Builder.controlCSS(control.kind);
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + controlCSS + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');

	// Добаление элементов списка
	for (var i = 0; i < control.items.length; i++)
	{
		this.append('<div class="' + controlCSS + '_item' + ((i == 0) ? ' first' : '') + '">');
			this.append('<input type="hidden" value="' + i + '">');
			this.append('<div class="' + controlCSS + '_item_name">' + control.items[i].name + '</div>');
			this.append('<div class="' + controlCSS + '_item_value">' + control.items[i].value + '</div>');
			this.append('<div class="df_clear"></div>');
		this.append('</div>');
	}
	
	this.append('</div>');
};

// Метод добавления элемента listview
DataForm.Builder.prototype.appendListView = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.LISTVIEW)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Название класса контрола
	var controlCSS = DataForm.Builder.controlCSS(control.kind);

	// Начало области ListView
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + controlCSS + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' + 
		(control.height >= 50 ? 'style="height:' + control.height + 'px"' : '') + '>');
	
	// Признак наличия кнопок
	var hasButtons = (control.buttons && (control.buttons.length > 0));
	
	// Если есть кнопки, то ListView состоит из двух подобластей
	//  (для кнопок и для таблицы)
	if (hasButtons)
		this.append('<div class="' + controlCSS + '_wrapper">');
	
	// Область таблицы
	this.append('<div class="' + controlCSS + '_table"><table>');
		// Ширина столбцов
		this.append('<colgroup>');
		if (control.checkable)
			this.append('<col span="1"style="width:30px">');
		for (var i = 0; i < control.columns.length; i++)
			this.append('<col span="1"style="width:' + (control.columns[i].width > 100 ? control.columns[i].width : 100) + 'px">');
		this.append('</colgroup>');
		
		// Шапка таблицы
		this.append('<thead><tr>');
		if (control.checkable)
			this.append('<th></th>');
		for (var i = 0; i < control.columns.length; i++)
			this.append('<th>' + control.columns[i].caption + '</th>');
		this.append('</tr></thead>');
		
		// Тело таблицы
		this.append('<tbody>');
		for (var r = 0; r < control.rows.length; r++)
		{
			this.append('<tr>');
			if (control.checkable)
				this.append('<td><input type="checkbox"' + (control.rows[r].checked ? ' checked' : '') + '></td>');
			for (var c = 0; c < control.rows[r].data.length; c++)
				this.append('<td>' + control.rows[r].data[c] + '</td>');
			this.append('</tr>');
		}
		this.append('</tbody>');
	this.append('</table></div>');
	
	// Если есть кнопки, то закрыть оберточный тег
	if (hasButtons)
		this.append('</div>');
	
	// Кнополчная область
	this.append('<div class="' + controlCSS + '_buttons">');
		for (var i = 0; i < control.buttons.length; i++)
		{
			this.append('<button');
				if (control.buttons[i].name)
					this.append(' id="' + DataForm.ListView._buttonID(control.name, control.buttons[i].name) + '"');
				if (control.buttons[i].hint)
					this.append(' title="' + control.buttons[i].hint + '"');
				if (control.buttons[i].enabled == false)
					this.append(' disabled class="disabled"');
			this.append('>');
				this.append(control.buttons[i].caption);
			this.append('</button>');
		}
	this.append('</div>');
	
	this.append('<div class="df_clear"></div>');
		
	// Конец области ListView
	this.append('</div>');
};

// Метод добавления элемента progress
DataForm.Builder.prototype.appendProgress = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.PROGRESS)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// CSS класс для контрола
	var css = DataForm.Builder.controlCSS(control.kind);
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' + '>');
		this.append('<div class="' + css + '_info">');
			this.append('<span class="' + css + '_info_status"></span>');
			this.append('<span class="' + css + '_info_percent"></span>');
		this.append('</div>');
		this.append('<div class="' + css + '_bar">');
			this.append('<div class="' + css + '_bar_percent"></div>');
		this.append('</div>');
	this.append('</div>');
};

// Метод добавления элемента line
DataForm.Builder.prototype.appendLine = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.LINE)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// CSS класс для контрола
	var css = DataForm.Builder.controlCSS(control.kind);
	
	// HTML-код
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' + '>');
	this.append('</div>');
};

// Метод добавления элемента number
DataForm.Builder.prototype.appendNumber = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.ControlType.NUMBER)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// CSS класс для контрола
	var css = DataForm.Builder.controlCSS(control.kind);
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;

	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption === undefined)
			control.label.caption = '';
	}
	else
	{
		label_width = 0;
	}
	
	// Корректировать ширину кнопки
	if (control.button)
	{
		if (control.button.width > button_width)
			button_width = control.button.width;
		if (control.button.caption === undefined)
			control.button.caption = '';
		if (control.button.hint === undefined)
			control.button.hint = '';
	}
	else
	{
		button_width = 0;
	}
	
	if (control.value === undefined)
		control.value = 0;
	
	if (control.maxlen === undefined)
		control.maxlen = 15;
	
	this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '" ' +
		' style="width:' + ((control.width > 100) ? control.width + 'px' : '') + '">');
	
	// Добавить заголовок над полем
	if ((control.caption != '') && (control.caption != null))
	{
		this.append('<div class="' + css + '_caption">');
			this.append(control.caption);
			if ((control.maximum != null) && (control.minimum != null))
				this.append(' (' + control.minimum + '...' + control.maximum + ')');
		this.append('</div>');
	}
	
	// Добавить имя поля слева
	if (control.label)
	{
		this.append('<div class="' + css + '_label" style="width: ' + label_width + 'px">');
			this.append(control.label.caption);
		this.append('</div>');
	}
	
	// Собственно поле :)
	this.append('<div class="' + css + '_value" style="margin-right:-' + 
		button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' +
		button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<input type="text" maxlength="' + control.maxlen + 
		'" value="' + control.value + '">');
	this.append('</div></div>');
		
	// Кнопка справа
	if (control.button)
	{
		this.append('<div' +
			' class="' + css + '_button"' +
			' style="width: ' + (button_width - 10) + 'px"' +
			' title="' + control.button.hint + '">');
		
		this.append('<button');
		if (control.button.enabled == false)
			this.append(' class="disabled" disabled');
		this.append('>' + control.button.caption + '</button>');
		
		this.append('</div>');
	}
	
	this.append('<div class="df_clear"></div>');
	this.append('</div>');
};

// Метод добавления кнопки панели управления формы
DataForm.Builder.prototype.appendCommandButton = function(button)
{
	// Проверить наличие обязательных параметров
	if (button.name === undefined)
		throw new Error(control.kind + ' name is null');
	
	// Тип кнопки
	var type = '';
	switch (button.type)
	{
		case 1:
			type = 'accept';
			break;
			
		case 2:
			type = 'cancel';
			break;
	}
	
	// Область кнопки
	this.append('<div');
		this.append(' class="' + DataForm.Builder.buttonCSS() + ' ' + type + '"');  
		this.append(' id="' + DataForm.Builder.buttonID(this._form_name, button.name) + '"');
	// Ширина кнопки
	if (button.width > 50)
		this.append(' style="width: ' + button.width + 'px"');
	// Подсказка для кнопки
	if (button.hint)
		this.append(' title="' + button.hint + '"');
	this.append('>');
	
	// Кнопка
	this.append('<button');
	// Признак активности
	if (button.enabled == false)
		this.append(' class="disabled" disabled');
	this.append('>' + button.caption + '</button>');
	
	this.append('</div>');
};



//========================================================================
// Возможные языки локализации
DataForm.Language = {
	ENGLISH : 0,
	RUSSIAN : 1
};



//========================================================================
// Локализация формы
DataForm.Localization = {};
//   - английский язык
DataForm.Localization.english = {
	language: DataForm.Language.ENGLISH,
	progress: {
		wait: "Wait"
	}
};
//   - русский язык
DataForm.Localization.russian = {
	language: DataForm.Language.RUSSIAN,
	progress: {
		wait: "Ожидание"
	}
};



//========================================================================
// Control. Контрол формы
// Параметры:
//   - form - ссылка на объект формы
//   - struct - пользовательское описание контрола
DataForm.Control = function(form, struct)
{
	// Имя контрола
	this.name = struct.name;
	// Тип контрола
	this.kind = struct.kind;
	
	// Сохранить ссылку на форму
	this._$form = $('#' + form._struct.name);
	// Сохранить ссылку на контрол
	this._$control = this._$form.find('#' + DataForm.Builder.controlID(form._struct.name, this.name));
	
	// Спрятать контрол 
	if (struct.visible == false)
		this._$control.hide();
};

// Получить имя CSS класс для данного контрола
DataForm.Control.prototype.css = function()
{
	return DataForm.Builder.CSS.FORM_CONTROL + '_' + this.kind;
};

// Отобразить признак ошики ввода данных (красная рамка)
DataForm.Control.prototype.error = function(value)
{
	this._$form.find('.df_control_error').remove();
	if (value != null)
		this._$control.after('<div class="df_control_error"> * ' + value + '</div>');
};

// Получить/установить признак видимости контрола
DataForm.Control.prototype.visible = function(value)
{
	if (value === undefined)
	{
		// Получить
		return (this._$control.css('display') != 'none');
	}
	else
	{
		// Если идет попытка установки уже установленного значения, 
		// то пропускаем обработку
		if (value == this.visible())
			return;
		
		// Установить
		if (value)
		{
			if ((DataForm.isIE(8)) || 
				(this.kind == DataForm.ControlType.LISTVIEW) || 
				(this.kind == DataForm.ControlType.LINE))
			{
				this._$control.show();
			}
			else
			{
				var height = this._$control.height();
				this._$control.height(0).show().animate({
					height: height + "px"
				}, 300, function() {
					$(this).css('height', 'auto');
				});
			}

			// Отображаем сообщение об ошибке
			this._$control.next().filter('.df_control_error').show();
		}
		else
		{
			if ((DataForm.isIE(8)) || 
				(this.kind == DataForm.ControlType.LISTVIEW) || 
				(this.kind == DataForm.ControlType.LINE))
			{
				this._$control.hide();
			}
			else
			{
				this._$control.show().animate({
					height: 0
				}, 300, function() {
					$(this).hide().css('height', 'auto');
				});				
			}
			
			// Прячем сообщение об ошибке
			this._$control.next().filter('.df_control_error').hide();
		}
	}
};

// Получить/установить признак активности контрола
DataForm.Control.prototype.enabled = function(value)
{
	if (value === undefined)
	{
		// Получить
		return (!this._$control.hasClass(DataForm.Builder.CSS.FORM_CONTROL_DISABLED));
	}
	else
	{
		// Установить
		if (value)
			this._$control.removeClass(DataForm.Builder.CSS.FORM_CONTROL_DISABLED);
		else
			this._$control.addClass(DataForm.Builder.CSS.FORM_CONTROL_DISABLED);
	}
};

// Описание контрола в формате JSON-объекта
DataForm.Control.prototype.json = function()
{
	return {};
};



//========================================================================
// Line - Контрол формы линия
DataForm.Line = function(form, struct)
{
	// Вызов родительского конструктора
	DataForm.Line.superclass.constructor.call(this, form, struct);
};
DataForm.Line.extendClass(DataForm.Control);



//========================================================================
// Label - Контрол формы (текстовая метка)
DataForm.Label = function(form, struct)
{
	// Вызов родительского конструктора
	DataForm.Label.superclass.constructor.call(this, form, struct);
};
DataForm.Label.extendClass(DataForm.Control);

// Функция установки/получения значения
DataForm.Label.prototype.caption = function(value)
{
	if (value === undefined)
	{
		// Получить
		return this._$control.children('.' + this.css() + '_out').html();
	}
	else
	{
		// Установить
		this._$control.children('.' + this.css() + '_out').html(value);
	}
};



//========================================================================
// ControlWithButton - Абстрактный класс для контрола с кнопкой
DataForm.ControlWithButton = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataForm.ControlWithButton.superclass.constructor.call(this, form, struct);
	
	// Функциональная кнопка
	this._$button = this._$control.find('.' + this.css() + '_button>button');
	
	// Обработчики наведения
	this._$button.hover(function() {
		if (!$(this).prop('disabled'))
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Навесить пользовательский обработчик нажатия на функциональную кнопку
	if ((struct.button != null) && (typeof struct.button.onClick == 'function'))
	{
		this._$button.on('click', function(event) {
			struct.button.onClick.call(self, form);
		});
	};
	
	// Установка признака активности кнопки
	if (struct.button != null) 
		this.buttonEnabled(struct.button.enabled);
};
DataForm.ControlWithButton.extendClass(DataForm.Control);

// Получить/установить признак активности кнопки управления
DataForm.ControlWithButton.prototype.buttonEnabled = function(value)
{
	if (value === undefined)
	{
		// Получить
		return !this._$button.prop('disabled');
	}
	else
	{
		// Установить
		if (value)
			this._$button.removeClass('disabled');
		else
			this._$button.addClass('disabled');
		this._$button.prop('disabled', !value);
	}
};



//========================================================================
// ControlForInput - Абстрактный класс для контролов с полем ввода 
DataForm.ControlForInput = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataForm.ControlForInput.superclass.constructor.call(this, form, struct);
	
	// Поле ввода
	this._$input = this._$control.find('input');
	
	// Получение и потеря фокуса
	this._$input.focus(function() {
		self._$control.addClass(DataForm.Builder.CSS.FORM_CONTROL_FOCUSED);
	}).focusout(function() {
		self._$control.removeClass(DataForm.Builder.CSS.FORM_CONTROL_FOCUSED);
	});
};
DataForm.ControlForInput.extendClass(DataForm.ControlWithButton);

// Получить/установить признак активности контрола
DataForm.ControlForInput.prototype.enabled = function(value)
{
	if (value === undefined) 
	{
		// Получить
		return DataForm.ControlForInput.superclass.enabled.call(this);
	}
	else
	{
		// Установить
		DataForm.ControlForInput.superclass.enabled.call(this, value);
		this._$input.prop('disabled', !value);
	}
};

// Отобразить признак ошики ввода данных
DataForm.ControlForInput.prototype.error = function(value)
{
	DataForm.ControlForInput.superclass.error.call(this, value);
	if (!this._$input.prop('disabled'))
		this._$input.focus();
};



//========================================================================
// TextBox - Контрол формы (однострочное поле ввода текста)
DataForm.TextBox = function(form, struct)
{
	// Вызов родительского конструктора
	DataForm.TextBox.superclass.constructor.call(this, form, struct);
};
DataForm.TextBox.extendClass(DataForm.ControlForInput);

// Функция установки/получения значения
DataForm.TextBox.prototype.text = function(value)
{
	if (value === undefined)
		return this._$input.val();
	else
		this._$input.val(value);
};

// Описание контрола в формате JSON-объекта
DataForm.TextBox.prototype.json = function()
{
	return {
		text: this.text()
	};
};



//========================================================================
// SmartTextBox - Контрол формы (однострочное поле ввода текста с памятью)
DataForm.SmartTextBox = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataForm.SmartTextBox.superclass.constructor.call(this, form, struct);
	
	// Область элементов памяти
	this._$memory = this._$control.find('.' + this.css() + '_memory');
	// Элементы памяти
	this._$memory_items = this._$memory.find('.' + this.css() + '_memory_item');
	
	// Сворачивание выпадающего списка
	function expand()
	{
		self._$memory.show();
		DataForm.onExpand.call(self._$memory);
	}
	
	// Разворачивание выпадающего списка
	function collapse()
	{
		self._$memory.hide();
		DataForm.onCollapse.call(self._$memory);
	}
	
	// Функция сокрытия/отображения элементов списка
	function showHideMemory()
	{
		// Признак отображения набора элементов 
		var show = false;
		// Количество показываемых элементов (не больше 10)
		var showed = 0;
		
		// Поиск элементов для отображение 
		self._$memory_items.each(function() {
			var item = $(this);
			if (item.html().toLowerCase().indexOf(self.text().toLowerCase()) >= 0)
			{
				item.show();
				show = true;
				if (++showed >= 5)
					return false;
			}
			else
			{
				item.hide();
			}
		});
		
		// Отображать ли весь набор элементов
		(show ? expand() : collapse());

		// Удалить признак выбора
		self._$memory_items.filter('.slctd').removeClass('slctd');
	};
	
	// Выбор вышележащего элемента памяти
	function moveUp()
	{
		var items = self._$memory_items.filter(':visible'),
			slctd = items.filter('.slctd').removeClass('slctd'),
			index = items.index(slctd);

		if (index == -1)
			items.last().addClass('slctd');
		else
			items.eq((index - 1) % items.length).addClass('slctd');
	};
	
	// Выбор нижележащего элемента памяти
	function moveDown()
	{
		var items = self._$memory_items.filter(':visible'),
			slctd = items.filter('.slctd').removeClass('slctd'),
			index = items.index(slctd);

		if (index == -1)
			items.first().addClass('slctd');
		else
			items.eq((index + 1) % items.length).addClass('slctd');
	};
	
	// Наведение на элементы памяти
	this._$memory_items.hover(function() {
		$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	}).click(function() {
		// Установить соответствующий текст
		self.text($(this).html());
		// Вернуть фокус полю ввода
		self._$input.focus();
	});
	
	// Потеря фокуса полем ввода
	this._$input.focusout(function() {
		// Приходится добавлять небольшую задержку перед тем
		// как убрать область памяти. Все это делается из-за ситуации
		// когда пользователь надимает на элемент памяти
		// и первым срабатывает событие click, которое прячет
		// элемент и событие click не срабатывает
		setTimeout(function() {
			// Спрятать набор элементов
			collapse();
			// Удалить признак выбора
			self._$memory_items.filter('.slctd').removeClass('slctd');
		}, 100);
	});
	
	// Обработчик нажатия кнопок в TextBox-е
	this._$input.keyup(function(e) {
		switch (e.keyCode)
		{
			// Вверх
			case 38:
				if (self._$memory.filter(':visible').size() == 0)
					showHideMemory();
				moveUp();
			break;
			
			// Вниз
			case 40:
				if (self._$memory.filter(':visible').size() == 0)
					showHideMemory();
				moveDown();
			break;
			
			// Esc
			case 27:
				// Очистить поле ввода
				self.text('');
				// Спрятать набор элементов
				collapse();
				// Удалить признак выбора
				self._$memory_items.filter('.slctd').removeClass('slctd');
			break;
			
			// Enter
			case 13:
				if (self._$memory_items.filter('.slctd').size() == 1)
				{
					// Установить текст элемента
					self.text(self._$memory_items.filter('.slctd').html());
					// Спрятать набор элементов
					collapse();
					// Удалить признак выбора
					self._$memory_items.filter('.slctd').removeClass('slctd');
				}
			break;
			
			default:
				// Если была нажата символьная кнопка, то провести фильтрацию
				if (e.which != 0)
					showHideMemory();
			break;
		}
	});
};
DataForm.SmartTextBox.extendClass(DataForm.TextBox);



//========================================================================
// Number - Контрол формы (однострочное поле ввода текста)
DataForm.Number = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataForm.Number.superclass.constructor.call(this, form, struct);
	
	// Текущее значение
	var value = struct.value;
	if (value === undefined) 
		value = 0;
	
	// Максимум 
	this._maximum = struct.maximum;
	if (this._maximum === undefined)
		this._maximum = Number.POSITIVE_INFINITY; // MAX_VALUE
	// Минимум
	this._minimum = struct.minimum;
	if (this._minimum === undefined)
		this._minimum = Number.NEGATIVE_INFINITY; // MIN_VALUE
	
	// Фильтр ввода для поля 
	this._$input.numberMask({defaultValueInput: value});
	
	// Потеря фокуса полем ввода
	this._$input.on('focusout', function(event) {
		// Закрепить валидное значение
		self.value();
	});
};
DataForm.Number.extendClass(DataForm.ControlForInput);

// Функция установки/получения значения
DataForm.Number.prototype.value = function(value)
{
	if (value == null)
	{
		// Получение
		var result = this._$control.find('input').val() * 1;
		if (isNaN(result))
			result = this._minimum;
		else if (result < this._minimum)
			result = this._minimum;
		else if (result > this._maximum)
			result = this._maximum;
		this._$control.find('input').val(result);
		return result;
	}
	else
	{
		// Установка
		if (value < this._minimum)
			value = this._minimum;
		else if (value > this._maximum)
			value = this._maximum;
		this._$control.find('input').val(value);
	}
};

// Описание контрола в формате JSON-объекта
DataForm.Number.prototype.json = function()
{
	return {
		value: this.value()
	};
};



//========================================================================
// NameValue - Контрол формы (список)
DataForm.NameValue = function(form, struct)
{
	// Вызов родительского конструктора
	DataForm.NameValue.superclass.constructor.call(this, form, struct);
};
DataForm.NameValue.extendClass(DataForm.Control);

// Функция установки получения значения
DataForm.NameValue.prototype.value = function(index, value)
{
	// Поиск поля вывода значения
	var item = this._$control.find('input[value="' + index + '"]').parent();
	if (item.length == 1)
	{
		if (value == null)
		{
			// Вернуть значение
			return item.children('.' + this.css() + '_item_value').html();
		}
		else
		{
			// Отобразить значение на форме
			item.children('.' + this.css() + '_item_value').html(value);
		}
	}
};



//========================================================================
// ListView - Контрол формы (список)
DataForm.ListView = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataForm.ListView.superclass.constructor.call(this, form, struct);
	
	// Название CSS класса контрола
	var controlCSS = this.css();
	
	// Регулярное выражение для определения имени кнопки по идентификатору
	this._reButtonName = new RegExp("^" + this.name + "_(\.+)$", "i");
	
	// Функция обработки событий
	var onEvent = function() { };
	if (typeof struct.onEvent == 'function') {
		onEvent = function(event) {
			struct.onEvent.call(self, event);
		}
	}
	
	// Выделение строки тблицы
	this._$control.find('.' + controlCSS + '_table').on('click', 'tr:not(.' + controlCSS + '_row_selected)', function() {
		var $tr = $(this);
		// Снять выделение с остальных строк
		$tr.parent().find('tr').removeClass(controlCSS + '_row_selected');
		// Выделить эту строку
		$tr.addClass(controlCSS + '_row_selected');

		// Отправить событие пользователю
		onEvent({
			type: DataForm.ListView.EventType.ON_ROW_CHECKED,
			index: $tr.parent().find('tr').index($tr)
		});
	});
	
	// Выбор строки таблицы
	this._$control.find('.' + controlCSS + '_table').on('click', 'tr input', function(event) {
		// Поле выбора
		var $checkbox = $(this);
		// Выбираемая строка
		var $tr = $checkbox.parent().parent();
		// Не передавать сообщение строке содержащей поле ввода
		event.stopPropagation();
		
		// Отправить событие пользователю
		onEvent({
			type: DataForm.ListView.EventType.ON_ROW_CHECKED,
			index: $tr.parent().find('tr').index($tr),
			value: $checkbox.prop('checked')
		});
	})
	
	// Навесить пользовательский обработчик нажатия на кнопки
	this._$control.find('.' + controlCSS + '_buttons').on('click', 'button', function(event) {
		// Нажатая кнопка
		var $button = $(this);
		
		// Отправить событие пользователю
		onEvent({
			type: DataForm.ListView.EventType.ON_BUTTON_CLICK,
			name: self._buttonName($button)
		});
	});
};
DataForm.ListView.extendClass(DataForm.Control);

// Типы событий ListView
DataForm.ListView.EventType = {
	// Выделение строки ListView
	// {
	//     type: DataForm.ListView.EventType.ON_ROW_SELECTED,
	//     index: Number - индекс строки
	// }
	ON_ROW_SELECTED : 0,
	// Выбор строки ListView
	// {
	//     type: DataForm.ListView.EventType.ON_ROW_CHECKED,
	//     index: Number - индекс строки,
	//     value: Boolean - признак выбора
	// }
	ON_ROW_CHECKED  : 1,
	// Нажатие на кнопку ListView
	// Выбор строки ListView
	// {
	//     type: DataForm.ListView.EventType.ON_BUTTON_CLICK,
	//     name: String - название кнопки
	// }
	ON_BUTTON_CLICK : 2
};

// Получение идентфикатора кнопки по ее имени и имени контрола
DataForm.ListView._buttonID = function(lvName, buttonName) {
	return lvName + '_' + buttonName;
};

// Получение идентфикатора кнопки по ее имени
DataForm.ListView.prototype._buttonID = function(buttonName) {
	return DataForm.ListView._buttonID(this.name, buttonName);
};

// Получение имени кнопки по ее идентфикатора
DataForm.ListView.prototype._buttonName = function($button) {
	var exec = this._reButtonName.exec($button.attr('id'));
	if (exec)
		return exec[1];
	return '';
};

// Получить/установить признак активности кнопки
DataForm.ListView.prototype.buttonEnabled = function(button, enabled)
{
	var $button = this._$control.find('#' + this._buttonID(button));
	if ($button.length !== 1)
		return;
	
	if (enabled === undefined)
	{
		return !$button.prop('disabled');
	}
	else
	{
		$button.prop('disabled', !enabled);
		if (enabled)
			$button.removeClass('disabled');
		else
			$button.addClass('disabled');
	}
};

// Получить/установить признак активности контрола
DataForm.ListView.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return DataForm.ListView.superclass.enabled.call(this);
	}
	else
	{
		// Установить
		DataForm.ListView.superclass.enabled.call(this, value);
		if (value)
		{
			this._$control.children('.' + this.css() + '_disabler').remove();
		}
		else
		{
			if (this._$control.children('.' + this.css() + '_disabler').length == 0)
				this._$control.append('<div class="' + this.css() + '_disabler"></div>');
		}
		this._$control.find('input[type="checkbox"]').prop('disabled', !value);
	}
};



//========================================================================
// ComboBox - Контрол формы (Выпадающий список) 
DataForm.ComboBox = function(form, struct)
{
	// Ссылка на самого себя
	var self = this;
		
	// Вызов родительского конструктора
	DataForm.ComboBox.superclass.constructor.call(this, form, struct);
	
	// Установить начальное значение
	this._$control.find('select.userSelect').prop('selectedIndex', struct.value);
	
	// Установить собственный выпадающий список
	this._$control.find('select.userSelect').userSelect({
		onCollapse: DataForm.onCollapse,
		onExpand: DataForm.onExpand,
		onChange: (function() {
			if (typeof struct.onChange == 'function')
				return function() {
					struct.onChange.call(self, form);
				}
		})()
	});
	this._$select = this._$control.find('.us_select');
};
DataForm.ComboBox.extendClass(DataForm.ControlWithButton);

// Функция установки/получения значения
DataForm.ComboBox.prototype.value = function(value)
{
	if (value == null)
		return this._$select.userSelect('value');		
	else
		this._$select.userSelect('value', value);
};

// Функция обновления наборы элементов ComboBox
DataForm.ComboBox.prototype.values = function(values)
{
	this._$select.userSelect('values', values);
};

// Получить/установить признак активности контрола
DataForm.ComboBox.prototype.enabled = function(value)
{
	if (value === undefined) 
	{
		// Получить
		return DataForm.ComboBox.superclass.enabled.call(this);
	}
	else
	{
		// Установить
		DataForm.ComboBox.superclass.enabled.call(this, value);
		this._$select.userSelect('enabled', !!value);
	}
};

// Описание контрола в формате JSON-объекта
DataForm.ComboBox.prototype.json = function()
{
	return {
		index: this.value()
	};
};

// Префикс для идентификатора добавляемого select
DataForm.ComboBox.selectPrefix = 'select_';



//========================================================================
// CheckBox - Контрол формы (checkbox) 
DataForm.CheckBox = function(form, struct)
{
	// Ссылка на самого себя
	var self = this;
	
	// Вызов родительского конструктора
	DataForm.CheckBox.superclass.constructor.call(this, form, struct);
	
	// Поле ввода 
	this._$checkbox = this._$control.find('input');
	
	// Навесить обработчик изменения значения
	if (typeof struct.onChange == 'function')
	{
		this._$checkbox.change(function() {
			struct.onChange.call(self, form);
		});
	}
};
DataForm.CheckBox.extendClass(DataForm.Control);

// Метод получения/установки признака выбора
DataForm.CheckBox.prototype.checked = function(value)
{
	if (value == null)
	{
		return this._$checkbox.prop('checked');
	}
	else
	{
		value = !!value;
		if (this.checked() != value)
		{
			// Стиль отображения
			if (value)
				this._$control.addClass('checked');
			else
				this._$control.removeClass('checked');
		
			// Признак выбора
			this._$checkbox.prop('checked', !!value);
			
			// Вызвать пользовательский обработчик
			this._$checkbox.change();
		}
	}
};

// Получить/установить признак активности контрола
DataForm.CheckBox.prototype.enabled = function(value)
{
	if (value === undefined) 
	{
		// Получить
		return DataForm.CheckBox.superclass.enabled.call(this);
	}
	else
	{
		// Установить
		DataForm.CheckBox.superclass.enabled.call(this, value);
		this._$checkbox.prop('disabled', !value);
	}
};

// Описание контрола в формате JSON-объекта
DataForm.CheckBox.prototype.json = function()
{
	return {
		checked: this.checked()
	};
};



//========================================================================
// Timer - Контрол таймера
DataForm.Timer = function(form, struct)
{
	// Вызов родительского конструктора
	DataForm.Timer.superclass.constructor.call(this, form, struct);
	// Таймер
	this._timer = null;
	// Интервал срабатывания тамера
	this._interval = struct.interval || 1000;
	// Сохранить обработчик пользователя
	this._onTick = struct.onTick;
};
DataForm.Timer.extendClass(DataForm.Control);

// Отсановка таймера
DataForm.Timer.prototype.stop = function()
{
	if (this._timer != null)
	{
		clearInterval(this._timer);
		this._timer = null;
	}
};

// Запус таймера
DataForm.Timer.prototype.start = function(form)
{
	var self = this;
	if (typeof self._onTick === 'function') {
		// Остановить предыдущий таймер
		self.stop();
		// Запустить таймер
		self._timer = setInterval(function() {
			self._onTick.call(self, form);
		}, self._interval);
	}
};



//========================================================================
// Progress - Контрол прогресса операции
DataForm.Progress = function(form, struct)
{
	// Процент прогресса
	this._percent = 0;
	// Вызов родительского конструктора
	DataForm.Progress.superclass.constructor.call(this, form, struct);
	// Процент выполнения
	this.percent(0);
	// Статус выполнения
	this.status(form._localization.progress.wait);
};
DataForm.Progress.extendClass(DataForm.Control);

// Установить/получить процент
DataForm.Progress.prototype.percent = function(value)
{
	if (value == null)
	{
		// Получить
		return this._percent;
	}
	else
	{
		// Установить
		if (value < 0)
			value = 0;
		else if (value > 100)
			value = 100;
		this._percent = value;
		this._$control.find('.' + DataForm.Builder.controlCSS(this.kind) + '_info_percent').html(this._percent + '%');
		this._$control.find('.' + DataForm.Builder.controlCSS(this.kind) + '_bar_percent').css('width', this._percent + '%');
	}
};

// Установить/получить статусное сообщение
DataForm.Progress.prototype.status = function(value)
{
	if (value == null)
	{
		// Получить
		return this._$control.find('.' + DataForm.Builder.controlCSS(this.kind) + '_info_status').html();;
	}
	else
	{
		// Установить
		this._$control.find('.' + DataForm.Builder.controlCSS(this.kind) + '_info_status').html(value);
	}
};



//========================================================================
// Container - Контрол, который умеет хранить контролы
DataForm.Container = function(form, control)
{
	// Вызов родительского конструктора
	DataForm.Container.superclass.constructor.call(this, form, control);
	
	// Дочерние контролы
	this.controls = [];
};
DataForm.Container.extendClass(DataForm.Control);

// Поиск дочеренего контрола по имени
DataForm.Container.prototype.find = function(name)
{
	try
	{
		var control = null;
		for (var i = 0; i < this.controls.length; i++)
		{
			if (this.controls[i].name == name)
			{
				return this.controls[i];
			}
			else if ((this.controls[i].kind == DataForm.ControlType.GROUPBOX) || 
					 (this.controls[i].kind == DataForm.ControlType.PANEL))
			{
				control = this.controls[i].find(name);
				if (control != null)
					return control;
			}
		}
	}
	catch(e)
	{
		return null;
	}
};

// Получить/установить признак активности контрола
DataForm.Container.prototype.enabled = function(value)
{
	if (value === undefined) 
	{
		// Получить
		return DataForm.Container.superclass.enabled.call(this);
	}
	else
	{
		// Установить
		DataForm.Container.superclass.enabled.call(this, value);
		// Установить этот же признак в каждом дочернем элементе
		for (var i = 0; i < this.controls.length; i++) {
			// Признак для поля
			this.controls[i].enabled(value);
			// Признак для кнопки поля
			if (this.controls[i].buttonEnabled)
				this.controls[i].buttonEnabled(value);
		}
	}
};



//========================================================================
// GroupBox - Контрол для группирования элементов
DataForm.GroupBox = function(form, control)
{
	// Вызов родительского конструктора
	DataForm.GroupBox.superclass.constructor.call(this, form, control);
};
DataForm.GroupBox.extendClass(DataForm.Container);



//========================================================================
// Panel - Контрол для размещения нескольких дочерних контролов вряд
DataForm.Panel = function(form, control)
{
	// Вызов родительского конструктора
	DataForm.Panel.superclass.constructor.call(this, form, control);
};
DataForm.Panel.extendClass(DataForm.Container);



//========================================================================
// Button - кнопка панели управления
// Параметры:
//   - form - ссылка на объект формы
//   - struct - описание кнопки
DataForm.Button = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Имя кнопки
	this.name = struct.name;
	
	// Сохранить ссылку на форму
	this._$form = $('#' + form._struct.name);
	// Сохранить ссылку на кнопки
	this._$button = this._$form.find('#' + DataForm.Builder.buttonID(form._struct.name, struct.name) + ' button');
	
	// Обработчики наведения
	this._$button.hover(function() {
		if (self.enabled())
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Навесить пользовательский обработчик нажатия на кнопку
	if (typeof struct.onClick == 'function')
	{
		this._$button.on('click', function(event) {
			struct.onClick.call(self, form);
		});
	}
};

// Получение/установка статуса активности кнопки кнопки
DataForm.Button.prototype.enabled = function(value)
{
	if (value === undefined)
	{
		// Получить
		return !this._$button.prop('disabled');
	}
	else
	{
		// Установить
		if (value)
			this._$button.removeClass('disabled');
		else
			this._$button.addClass('disabled');
		this._$button.prop('disabled', !value);
	}
};



//========================================================================
// Класс для работы с формой ввода данных
// Параметры:
//   - $content - родительский контент формы
//   - struct - структура формы
//   - language - идентификатор языка
function DataForm($content, struct, language)
{
	// Ссылка на структуру формы
	this._struct = struct;
	// Локализация формы
	this._localization = (language === DataForm.Language.ENGLISH ?
		DataForm.Localization.english : DataForm.Localization.russian);
	// Все таймеры формы (ассоциативный доступ)
	// Храним для остановки всех таймеров разом при удалении формы (destroy())
	this._timers = [];
	
	// Список дочерних контролов формы
	this.controls = [];
	// Список управляющих кнопок формы
	this.buttons = [];
	// Имя формы
	this.name = struct.name;
		
	// Генерация html-кода формы
	$content.html(DataForm.Builder.html(struct, this._localization));
	
	// Рекурсивно инициализировать все контролы формы
	initControls(this, this, struct.controls);
	// Инициализация объектов для кнопок панели управления формы
	initButtons(this, struct.buttons);
	
	// Установить параметры контролов, такие как "ПРИЗНАК АКТИВНОСТИ", "ПРИЗНАК ВИДИМОСТИ" и т.д.
	// Проблема в том, что некоторые опции необходимо устанаваливать при помощи
	// методов уже созданных контролов (после initControls контролы считаются созданными),
	// т.к. некоторые свойства контрола могут влиять на дочерние контролы. Например,
	// если мы хотим деактивировать groupbox, то необходимо деактивировать все его дочерние контролы
	// А для этогоу DataForm.GroupBox есть метод enabled(false), но он не доступен до вызова initControls
	disableSomeControls(this, struct.controls);
		
	// Рекурсивное выполнение методов проинициализированных контролов
	function disableSomeControls(form, controls)
	{
		for (var i = 0; i < controls.length; i++)
		{
			if (controls[i].enabled == false)
			{
				var control = form.control(controls[i].name);
				control.enabled(false);
			}
			else
			{
				if ((controls[i].kind == DataForm.ControlType.GROUPBOX) ||
					(controls[i].kind == DataForm.ControlType.PANEL))
					disableSomeControls(form, controls[i].controls);
			}
		}
	};
	
	// Рекурсивная инициализировать списка контролов controls
	function initControls(form, parent, controls)
	{
		if ((controls != null) && (controls.length > 0)) 
		{
			var control = null;
			for (var i = 0; i < controls.length; i++)
			{
				switch (controls[i].kind)
				{
					case DataForm.ControlType.GROUPBOX:
						control = new DataForm.GroupBox(form, controls[i]);
						initControls(form, control, controls[i].controls);
					break;
					
					case DataForm.ControlType.PANEL:
						control = new DataForm.Panel(form, controls[i]);
						initControls(form, control, controls[i].controls);
					break;
					
					case DataForm.ControlType.LABEL:
						control = new DataForm.Label(form, controls[i]);
					break;
					
					case DataForm.ControlType.TEXTBOX:
						control = new DataForm.TextBox(form, controls[i]);
					break;
					
					case DataForm.ControlType.STEXTBOX:
						control = new DataForm.SmartTextBox(form, controls[i]);
					break;					
					
					case DataForm.ControlType.NAMEVALUE:
						control = new DataForm.NameValue(form, controls[i]);
					break;
					
					case DataForm.ControlType.LISTVIEW:
						control = new DataForm.ListView(form, controls[i]);
					break;
						
					case DataForm.ControlType.COMBOBOX:
						control = new DataForm.ComboBox(form, controls[i]);
					break;
					
					case DataForm.ControlType.CHECKBOX:
						control = new DataForm.CheckBox(form, controls[i]);
					break;
					
					case DataForm.ControlType.TIMER:
						// Создать таймер
						control = new DataForm.Timer(form, controls[i]);
						// Сохранить ссылку на таймер
						form._timers.push(control);
					break;
					
					case DataForm.ControlType.LINE:
						control = new DataForm.Line(form, controls[i]);
					break;
					
					case DataForm.ControlType.PROGRESS:
						control = new DataForm.Progress(form, controls[i]);
					break;
					
					case DataForm.ControlType.NUMBER:
						control = new DataForm.Number(form, controls[i]);
					break;
					
					default:
						var plugin = DataForm.plugins[controls[i].kind];
						if (plugin)
							control = plugin.constructor(form, controls[i]);
				}
				
				// Добавить созданный контрол
				if (control != null)
					parent.controls.push(control);
			}
		}
	};
	
	// Инициализация объектов для кнопок панели управления формы
	function initButtons(form, buttons)
	{
		if ((buttons != null) && (buttons.length > 0)) 
		{
			for (var i = 0; i < buttons.length; i++)
				form.buttons.push(new DataForm.Button(form, buttons[i]));
		}
	};
};

// Типы элементов управления
// Описания типов в коментариях. Обязательные поля помечены символом "x".
// Если симола нет, то поле необязательное
DataForm.ControlType = {};

// Текстовая метка
DataForm.ControlType.LABEL = 'label',
/*
 *      {
 *       x  kind    : DataForm.ControlType.LABEL,
 *       x  name    : String  - уникальное имя элемента,
 *          caption : String  - значение для вывода,
 *          hint    : String  - всплывающая подсказка,
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола
 *      }
 */

// Однострочное поле ввода
DataForm.ControlType.TEXTBOX = 'textbox';
/*
 *      {
 *       x  kind    : DataForm.ControlType.TEXTBOX,
 *       x  name    : String   - имя контрола,
 *          caption : String   - заголовок над полем,
 *          text    : String   - текст для вывода,
 *          maxlen  : Byte     - максимальная длина поля ввода,
 *          hint    : String   - подксказка,
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола,
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String - заголовок,
 *              width   : Number - ширина в пикселях
 *          },
 *          // Кнопка справа от поля ввода 
 *          button: {
 *              caption : String  - сообщение на кнопке,
 *              hint    : String  - всплывающая подсказка на кнопке,
 *              enabled : Boolean - признак активности кнопки
 *              width   : Number  - ширина в пикселях,
 *              onClick : function(form) { пользовательский обработчик нажатия }
 *          }
 *      }
 */

// Элемент управления для ввода чисел
DataForm.ControlType.NUMBER = 'number';
/*
 *     {
 *       x  kind    : DataForm.ControlType.NUMBER,
 *       x  name    : String   - имя контрола,
 *          caption : String   - заголовок над полем,
 *          value   : Number  - текущее значение,
 *          maximum : Number  - максимальное значение,
 *          minimum : Number  - минимальное значение,
 *          hint    : String   - подксказка,
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола,
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String - заголовок,
 *              width   : Number - ширина в пикселях
 *          },
 *          // Кнопка справа от поля ввода 
 *          button: {
 *              caption : String  - сообщение на кнопке,
 *              hint    : String  - всплывающая подсказка на кнопке,
 *              enabled : Boolean - признак активности кнопки
 *              width   : Number  - ширина в пикселях,
 *              onClick : function(form) { пользовательский обработчик нажатия }
 *          }
 *     }
 */

// Однострочное поле ввода с памятью
DataForm.ControlType.STEXTBOX = 'stextbox';
/*
 *      {
 *       x  kind    : DataForm.ControlType.STEXTBOX,
 *       x  name    : String   - имя контрола,
 *          caption : String   - заголовок над полем,
 *          text    : String   - текст для вывода,
 *          maxlen  : Byte     - максимальная длина поля ввода,
 *          hint    : String   - подксказка,
 *          memory  : ["", "",...] - элементы памяти 
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола,
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String - заголовок,
 *              width   : Number - ширина в пикселях
 *          },
 *          // Кнопка справа от поля ввода 
 *          button: {
 *              caption : String  - сообщение на кнопке,
 *              hint    : String  - всплывающая подсказка на кнопке,
 *              enabled : Boolean - признак активности кнопки
 *              width   : Number  - ширина в пикселях,
 *              onClick : function(form) { пользовательский обработчик нажатия }
 *          }
 *      }
 */

// Однострочное поле ввода
DataForm.ControlType.COMBOBOX = 'combobox';
/*    
 *      {
 *       x  kind     : DataForm.ControlType.COMBOBOX,
 *       x  name     : String   - имя контрола,
 *          caption  : String   - заголовок над полем,
 *          value    : Number   - индекс выбранного элемента,
 *          values   : Array    - возможные значения,
 *          hint     : String   - подксказка,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function(form) { пользовательский обработчик изменения значения }
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String - заголовок,
 *              width   : Number - ширина в пикселях
 *          },
 *          // Кнопка справа от поля ввода 
 *          button: {
 *              caption : String  - сообщение на кнопке,
 *              hint    : String  - всплывающая подсказка на кнопке,
 *              enabled : Boolean - признак активности кнопки
 *              width   : Number  - ширина в пикселях,
 *              onClick : function(form) { пользовательский обработчик нажатия }
 *          }
 *      }
 */

// Контрол группировки элементов
DataForm.ControlType.GROUPBOX = 'groupbox';
/*
 *      {
 *       x  kind     : DataForm.ControlType.GROUPBOX,
 *       x  name     : String   - имя контрола,
 *          caption  : String   - заголовок,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          controls : [ {}, ... тут набор описание дочерних контролов, аналогичное контролам формы ]
 *      }
 */

// Контрол выбора
DataForm.ControlType.CHECKBOX = 'checkbox';
/*
 *      {
 *       x  kind     : DataForm.ControlType.CHECKBOX,
 *       x  name     : String   - имя контрола,
 *          caption  : String   - заголовок,    
 *          hint     : String   - подксказка,
 *          checked  : Boolean  - признак выбора,      
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function(form) { пользовательский обработчик изменения значения }
 *      }
 */



// Поле для хранения списка
DataForm.ControlType.LISTVIEW  = 'listview';
/*
 *   [
 *      {
 *       x  kind      : DataForm.ControlType.LISTVIEW,
 *       x  name      : String - имя контрола,
 *          checkable : Boolean - признак выбора нескольких строк,
 *          height    : Number - высота ListView,
 *          onEvent   : function(event) {
 *            // Функция обработки событий ListView
 *            // Описание event зависит от типа события
 *            // (см. DataForm.ListView.EventType)
 *          }
 *          columns: [{
 *               name    : String - имя колонки,
 *               caption : String - заголовок колонки,
 *               width   : Number - ширина колонки
 *          },...],
 *          rows: [{
 *              checked : Boolean - Признак выбора строки,
 *              data    : ["", ...]
 *          },...],
 *          buttons: [{
 *              name    : String - имя кнопки,
 *              caption : String - заголовок кнопки,
 *              hint    : String - подксказка кнопки
 *          }]
 *      },...
 *   ]
 */

// Поле отображения списка пар "ИМЯ-ЗНАЧЕНИЕ"
DataForm.ControlType.NAMEVALUE = 'namevalue';
/*
 *      {
 *       x  kind    : DataForm.ControlType.NAMEVALUE,
 *       x  name    : String   - имя контрола,
 *          visible : Boolean  - признак видимости контрола,
 *          items: [{
 *              name  : String - имя поля,
 *              value : String - значение поля
 *          },...]
 *      } 
 */

// Панель, для отображения нескольких контролов в ряд
DataForm.ControlType.PANEL = 'panel';
/*
 *      {
 *          kind     : DataForm.ControlType.PANEL,
 *          name     : String - уникальное имя элемента,
 *          controls : [ {}, ... тут набор дочерних контролов, аналогичное контролам формы ]
 *      }
 */

// Поле для отображения прогресса выболнения
DataForm.ControlType.PROGRESS = 'progress';
/*
 *      {
 *          kind  : DataForm.ControlType.PROGRESS,
 *          name  : String - уникальное имя элемента
 *      }
 */

// Контрола Timer
DataForm.ControlType.TIMER = 'timer';
/*
 *      {
 *          kind     : DataForm.ControlType.TIMER,
 *          name     : String - уникальное имя элемента,
 *          interval : Number - инетрвал срабатывания тамера,
 *          onTick   : function(form) { обработчик тика таймера }
 *      }
 */

// Контрола Line
DataForm.ControlType.LINE = 'line';
/*
 *      {
 *          kind     : DataForm.ControlType.LINE,
 *          name     : String - уникальное имя элемента
 *      }
 */



//========================================================================
// Обработка сворачивания списка или календаря
DataForm.onCollapse = function()
{
	var item = $(this);
	while (!item.hasClass('df'))
	{
		if (item.hasClass('df_control'))
			item.removeClass('df_top');
		item = item.parent();
	}
};

// Обработка выпадения списка или календаря
DataForm.onExpand = function()
{
	var item = $(this);
	while (!item.hasClass('df'))
	{
		if (item.hasClass('df_control'))
			item.addClass('df_top');
		item = item.parent();
	}
};



//========================================================================
// К браузерам до IE у нас особое отношения. Поэтому расширим
// jQuery функцией для упрощенного механизма определения принадлежности
// браузеров к семейству до IE
// Параметры:
//   - version - версия браузера, до которой (не включительно) мы возвращаем true
DataForm.isIE = function(version)
{
	try
	{
		var ua = navigator.userAgent.toLowerCase();
		var match =  /(msie) ([\w.]+)/.exec( ua ) || [];

		if ((match[1] == 'msie') && (match[2] * 1 < version))
			return true;
		else
			return false;
	}
	catch(e)
	{
		return false;
	}
};



//========================================================================
// Набор плагинов элементов управления
DataForm.plugins = {};
// Расширение набора контролов формы
/* Формат для plugins
 * [{
 *   // Стрококвый идентификатор контрола
 *   kind: 'DateTime',
 *   // Функция добаления HTML (для DataForm.Builder)
 *   append: function() { },
 *   // Функция создания контрола
 *   constructor: function(control) { }
 * }, ...]
 */
DataForm.installPlugins = function(plugins) {
	for (var i = 0; i < plugins.length; i++)
		DataForm.plugins[plugins[i].kind] = plugins[i];
};



//========================================================================
// Иногда возникает необходимость в удалении внутренних ссылок объекта DataForm
// Например:
//   - контрол DataForm.Timer в запущенном состоянии хранит ссылку на 
//     объект формы и поэтому не удаляется, а таймер не останавилвается
//     и продолжает срабатывать
// Если ваш объект DataForm не попадает под эти примеры, то функцию можно
// не вызывать destroy
DataForm.prototype.destroy = function()
{
	// Остановить все таймеры
	for (var i = 0; i < this._timers.length; i++)
		this._timers[i].stop();
};



//========================================================================
// Функция получения доступа к контролу по его имени
// Параметры:
//   - name - уникальное имя контрола, заданное пользователем 
DataForm.prototype.control = function(name) 
{
	try
	{
		for (var i = 0; i < this.controls.length; i++)
		{
			if (this.controls[i].name == name)
			{
				return this.controls[i];
			}
			else
			{
				if ((this.controls[i].kind == DataForm.ControlType.GROUPBOX) || 
					(this.controls[i].kind == DataForm.ControlType.PANEL))
				{
					var control = this.controls[i].find(name);
					if (control != null)
						return control;
				}	
			}
		}
	}
	catch(e)
	{
		return null;
	}
};



//========================================================================
// Функция получения доступа к кнопке панели управления
// Параметры:
//   - name - уникальное имя кнопки 
DataForm.prototype.button = function(name) 
{
	try
	{
		for (var i = 0; i < this.buttons.length; i++)
		{
			if (this.buttons[i].name == name)
				return this.buttons[i];
		}
		return null;
	}
	catch(e)
	{
		return null;
	}		

};