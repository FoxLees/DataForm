/***********************************************************************
 * 
 *                               DataForm
 *                               
 * DataForm - класс для создания формы ввода и управления данными 
 * DataFormControl (элемент управления) - это элемент отображаемый на форме
 * 
 * Зависимости:
 *    - localization.js
 *    - jquery.js
 *    - jquery.userSelect.js  // для combobox
 *    - jquery.datePicker.js  // для date 
 *    - jquery.file.js  // для загрузки файла
 * 
 * Функциональность:
 *   - генерация HTML-кода для отображения данных формы
 *   - возможность управления данными
 *   - пользовательские обработчики элементов управления
 *                                                    
 * История изменений:
 *   - 19.12.2012 - Создание
 *   - 20.12.2012 - Добавлены классы DataForm, DataFormBuider. 
 *   - 21.12.2012 - Добавлены классы DataFormControl, DataFormLabel,
 *     DataFormComboBox.
 *   - 24.12.2012
 *       1) Добавлен обработчик onChange в combobox
 *       2) Добавлен обработчик onClick в функциональную кнопку combobox
 *       3) Добавлена генерация HTML-кода для CheckBox и класс DataFormCheckBox
 *       4) Добавлена генерация HTML-кода для ListView и класс DataFormListView
 *   - 25.12.2012
 *       1) Добавлена командная панель
 *       2) Добавлены калссы DataFormButton, DataFormCheckBox
 *   - 26.12.2012
 *       1) Добавлена возможность указания языка для отображения формы
 *          строковой константой SYSTM_LANGUAGE из localization
 *          
 *   - 18.02.2013
 *       1) Добавлен контрол DataFormDate
 *       2) Добавлен контрол DataFormTime
 *       3) Добавлен контрол DataFormGroupBox
 *       4) Во все контролы добавлена возможность подсветки ошибки 
 *       5) Во все контролы добавлена возможность прятать и отображать
 *          (соотвествующее свойство hidden = true)
 *          
 *   - 05.03.2013
 *       1) В DataFormComboBox добавлен метод values, реализующий
 *          возможность установки нового набора значений для выбора
 *          
 *   - 06.03.2013
 *       1) Для ListView добавлена возможность установки высоты
 *       
 *   - 07.03.2013
 *       1) Добавлен контрол panel. Необходим для размещения нескольких
 *          groupbox в один ряд. Поле controls содржит массив groupbox
 *          для размещения в один ряд. Управление панелью пока не реали-
 *          зовано. Может быть потом:)
 *       2) Добавлены возможности активации/деактивации контролов 
 *          (метод enabled)
 *   
 *   - 02.07.2013
 *       1) Добавлена возможность установки отступа слева для контрола 
 *          формы
 *          
 *   - 03.07.2013 
 *       1) Добавлена визуализация деактивации таблицы ListView
 *       
 *   - 17.03.2014
 *       1) Замена Number.MIN_VALUE на Number.NEGATIVE_INFINITY
 *       2) Замена Number.MAX_VALUE на Number.POSITIVE_INFINITY
 *       3) Добавлена опция DataFormTextBox.password = true|false 
 *       4) Установка свойства visible использует animate
 *       
 *   - 18.03.2014
 *       1) DataFormCheckBox._checked - добавлена защита от undefined
 *     
 *                                  Copyright 2011-2014, ООО НПП "ЭКРА"                                                         
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
 *   controls: [{...},...] - Элменты управления формы (Описание зависит от типа (см. DataForm.CONTROL))
 *   buttons:[{
 *     name    : String  - уникальное имя,
 *     caption : String  - заголовок,
 *     hint    : String  - всплывающая подсказка,
 *     width   : Number  - ширина кнопки,
 *     enabled : Boolean - признак активности кнопки,
 *     onClick : function(form, button) { пользовательский обработчик нажатия };
 *   },...] - Панель управления
 * }
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//========================================================================
// Построитель таблицы. Наследник StringBuilder
DataFormBuilder = function(form)
{
	// Вызов родительского конструктора
	DataFormBuilder.superclass.constructor.call(this);
	
	// Уникальное имя формы 
	this._form_name = '';
	
	// Сохранить имя формы
	if (form.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "form name is null"');
	else
		this._form_name = form.name;

	// Инициализация HTML-кода
	this.append('<div class="' + DataFormBuilder.CSS.FORM + '" id="' + this._form_name + '">');

	// Добавить область данных формы
	if ((form.controls) && (form.controls.length > 0))
	{
		this.append('<div class="' + DataFormBuilder.CSS.FORM_DATA + '">');
		for (var i = 0; i < form.controls.length - 1; i++)
		{
			this.appendControl(form.controls[i]);
		}
		if (form.controls.length > 0)
			this.appendControl(form.controls[form.controls.length - 1]);
		this.append('</div>');
	}
	
	// Добавить панель управления формы
	if ((form.buttons) && (form.buttons.length > 0))
	{
		this.append('<div class="' + DataFormBuilder.CSS.FORM_BUTTON + '">');
		for (var i = 0; i < form.buttons.length; i++)
			this.appendCommandButton(form.buttons[i]);
		this.append('<div class="clear"></div></div>');
	}
	
	this.append('</div>');
};

// Наследование
extend(DataFormBuilder, StringBuilder);

// Сообщения об ошибках
DataFormBuilder.ERRORS = 
{
	INVALID_STRUCTURE: 'Invalid form structure'
};

// Название CSS классов для описания формы
DataFormBuilder.CSS = {};
DataFormBuilder.CSS.FORM = 'form';
DataFormBuilder.CSS.FORM_DATA    = DataFormBuilder.CSS.FORM + '_data';
DataFormBuilder.CSS.FORM_CONTROL = DataFormBuilder.CSS.FORM + '_control';
DataFormBuilder.CSS.FORM_BUTTON  = DataFormBuilder.CSS.FORM + '_command';

// Функция генерация идентификатора элемента управления
// Параметры:
//   - form_name - имя формы
//   - control_name - уникальное имя контрола
DataFormBuilder.controlID = function(form_name, control_name)
{
	return DataFormBuilder.CSS.FORM_CONTROL + '_id__' + form_name + '__' + control_name;
};

// Получение имени css класса для контрола по его типу
DataFormBuilder.controlCSS = function(control_type)
{
	return DataFormBuilder.CSS.FORM_CONTROL + '_' + control_type; 
};

// Функция генерация идентификатора кнопки панели управления
// Параметры:
//   - form_name - имя формы
//   - button_name - уникальное имя кнопки
DataFormBuilder.buttonID = function(form_name, button_name)
{
	return DataFormBuilder.CSS.FORM_BUTTON + '_id__' + form_name + '__' + button_name;
};

// Получение имени css класса для кнопки панели управления
DataFormBuilder.buttonCSS = function()
{
	return DataFormBuilder.CSS.FORM_BUTTON + '_button'; 
};

// Функция создания строки с HTML кодом для формы
DataFormBuilder.formHTML = function(struct)
{
	var builder = null;
	builder = new DataFormBuilder(struct);
	return builder.toString();
};

// Метод добавления элемента управления
DataFormBuilder.prototype.appendControl = function(control)
{
	switch (control.kind)
	{
		case DataForm.CONTROL.LABEL:
			this.appendLabel(control);
		break;
		
		case DataForm.CONTROL.TEXTBOX:
			this.appendTextBox(control);
		break;
		
		case DataForm.CONTROL.STEXTBOX:
			this.appendSmartTextBox(control);
		break;
		
		case DataForm.CONTROL.DATE:
			this.appendDate(control);
		break;
		
		case DataForm.CONTROL.TIME:
			this.appendTime(control);
		break;
		
		case DataForm.CONTROL.COMBOBOX:
			this.appendComboBox(control);
		break;
		
		case DataForm.CONTROL.GROUPBOX:
			this.appendGroupBox(control);
		break;
		
		case DataForm.CONTROL.PANEL:
			this.appendPanel(control);
		break;
		
		case DataForm.CONTROL.NAMEVALUE:
			this.appendNameValue(control);
		break;
		
		case DataForm.CONTROL.CHECKBOX:
			this.appendCheckBox(control);
		break;
		
		case DataForm.CONTROL.LISTVIEW:
			this.appendListView(control);
		break;
		
		case DataForm.CONTROL.PROGRESS:
			this.appendProgress(control);
		break;
		
		case DataForm.CONTROL.LINE:
			this.appendLine(control);
		break;
		
		case DataForm.CONTROL.NUMBER:
			this.appendNumber(control);
		break;
		
		case DataForm.CONTROL.FILELOAD:
			this.appendFileLoad(control);
		break;
	}
};

// Метод добавления элемента DataForm.CONTROL.LABEL
DataFormBuilder.prototype.appendLabel = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.LABEL)
		return;
	
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	if (control.caption == null)
		control.caption = '';
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');
		this.append('<div class="' + css + '_out">');
			this.append(control.caption);
		this.append('</div>');
	this.append('</div>');
};

// Метод добавления элемента DataForm.CONTROL.TEXTBOX
DataFormBuilder.prototype.appendTextBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.TEXTBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;

	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption == null)
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
		if (control.button.caption == null)
			control.button.caption = '';
		if (control.button.hint == null)
			control.button.hint = '';
	}
	else
	{
		button_width = 0;
	}
	
	if (control.text == null)
		control.text = '';
	
	if (control.maxlen == null)
		control.maxlen = 100;
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' +
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
	this.append('<div class="' + css + '_value" style="margin-right:-' + button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<input type="' + (control.password ? 'password' : 'text') + '" maxlength="' + control.maxlen + '" value="' + control.text + '">');
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
	
	this.append('<div class="clear"></div>');
	this.append('</div>');
};

// Метод добавления элемента DataForm.CONTROL.STEXTBOX
DataFormBuilder.prototype.appendSmartTextBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.STEXTBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;

	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption == null)
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
		if (control.button.caption == null)
			control.button.caption = '';
		if (control.button.hint == null)
			control.button.hint = '';
	}
	else
	{
		button_width = 0;
	}
	
	if (control.text == null)
		control.text = '';
	
	if (control.maxlen == null)
		control.maxlen = 100;
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' +
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
	this.append('<div class="' + css + '_value" style="margin-right:-' + button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<input type="text" maxlength="' + control.maxlen + '" value="' + control.text + '">');
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
	
	this.append('<div class="clear"></div>');
	
	// Добавить список элементов памяти
	this.append('<div class="' + css + '_memory">');
	if (control.memory != null)
	{
		for (var i = 0; i < control.memory.length; i++)
		{
			this.append('<div class="' + css + '_memory_item">');
				this.append(control.memory[i]);
			this.append('</div>');
		}
	}
	this.append('</div>');
	
	this.append('</div>');
};

// Метод добавления элемента groupbox
DataFormBuilder.prototype.appendGroupBox = function(control)
{
	if (control.kind != DataForm.CONTROL.GROUPBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');
	this.append('<div class="' + css + '_title">' + control.caption + '</div>');
	this.append('<div class="' + css + '_data">');

	// Рекурсивное добаление подэлементов
	if (control.controls)
		for (var i = 0; i < control.controls.length; i++)
			this.appendControl(control.controls[i]);
	
	this.append('</div></div>');
};

// Метод добавления элемента panel
DataFormBuilder.prototype.appendPanel = function(control)
{
	// Если нет дочерних контролов, то и панель добавлять не будем
	if (control.controls)
	{
		if (control.kind != DataForm.CONTROL.PANEL)
			return;
		
		// CSS класс для отображения элемента
		var css = DataFormBuilder.controlCSS(control.kind);
		// Ширина областей панели
		var width = Math.round(100 / control.controls.length);
		if ($.isIE(8))
			width = width - 0.001;
		
		
		this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
			'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');

		// Рекурсивное добавление пожэлементов
		for (var i = 0; i < control.controls.length; i++)
		{
			this.append('<div class="' + css + '_item" style="width:' + width + '%">');
				this.append('<div class="' + css + '_item_wrapper ' + (i == 0 ? 'first' : '') + '">');
					this.appendControl(control.controls[i]);
				this.append('</div>');
			this.append('</div>');
		}
	
		this.append('<div class="clear"></div>');
		this.append('</div>');
	}
};

// Метод добавления элемента выбора даты
DataFormBuilder.prototype.appendDate = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.DATE)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Ширина имения поля слева
	var label_width = 100;
	// Сообщение слева от поля ввода
	var caption = '';
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width != label_width)
			label_width = control.label.width;
		if (control.label.caption != null)
			caption = control.label.caption;
	}
	else
	{
		label_width = 0;
	}
			
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');
	
	// Добавить имя поля слева
	if (control.label)
	{
		this.append('<div class="' + css + '_label" style="width: ' + label_width + 'px">');
			this.append(caption);
		this.append('</div>');
	}
	
	// Поля ввода 
	this.append('<div class="' + css + '_value" style="margin-left:-' + label_width + 'px;">');
		this.append('<div class="' + css + '_wrapper" style="margin-left:' + label_width + 'px;">');
			// Поле даты
			this.append('<input type="hidden" class="datePicker" id="' + DataFormDate.inputPrefix + control.name + '">');
		this.append('</div>');
	this.append('</div>');
	
	this.append('<div class="clear"></div>');
	this.append('</div>');
};

// Метод добавления элемента выбора времени
DataFormBuilder.prototype.appendTime = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.TIME)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Ширина имения поля слева
	var label_width = 100;
	// Сообщение слева от поля ввода
	var caption = '';
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width != label_width)
			label_width = control.label.width;
		if (control.label.caption != null)
			caption = control.label.caption;
	}
	else
	{
		label_width = 0;
	}
			
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');
	
	// Добавить имя поля слева
	if (control.label)
	{
		this.append('<div class="' + css + '_label" style="width: ' + label_width + 'px">');
			this.append(caption);
		this.append('</div>');
	}
	
	// Поля ввода 
	this.append('<div class="' + css + '_value" style="margin-left:-' + label_width + 'px;">');
		this.append('<div class="' + css + '_wrapper" style="margin-left:' + label_width + 'px;">');
			// Поле выбора часов
			this.append('<select id="' + DataFormTime.selectPrefixHours + control.name + '" class="userSelect hours">');
			for (var i = 0; i < 24; i++)
				this.append('<option>' + i);
			this.append('</select>');
			
			this.append('<div class="' + css + '_splitter">');
				this.append(':');
			this.append('</div>');
			
			// Поле выбора минут
			this.append('<select id="' + DataFormTime.selectPrefixMinutes + control.name + '" class="userSelect minutes">');
			for (var i = 0; i < 60; i++)
				this.append('<option>' + i);
			this.append('</select>');
		this.append('</div>');
	this.append('</div>');
	
	this.append('<div class="clear"></div>');
	this.append('</div>');
};

// Метод добавления элемента combobox
DataFormBuilder.prototype.appendComboBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.COMBOBOX)
		return;
	
	// CSS класс для отображения элемента
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;
	
	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption == null)
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
		if (control.button.caption == null)
			control.button.caption = '';
		if (control.button.hint == null)
			control.button.hint = '';		
	}
	else
	{
		button_width = 0;
	}
	
	this.append('<div' +
		' class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + '" ' +
		' id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' +
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
	this.append('<div class="' + css + '_value" style="margin-right:-' + button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<select id="' + DataFormComboBox.selectPrefix + control.name + '" class="userSelect">');
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
	
	this.append('<div class="clear"></div>');
	this.append('</div>');
};

// Добавление HTML-кода элемента checkbox
DataFormBuilder.prototype.appendCheckBox = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.CHECKBOX)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Подсказка
	var hint = '';
	if (control.hint != null)
		hint = control.hint;
	
	this.append('<div ' +
		(control.margin > 0 ? 'style="margin-left: ' + control.margin + 'px"' : '') +
		' class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + DataFormBuilder.controlCSS(control.kind) + (control.checked ? ' checked' : '') +'" ' + 
		' id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' +
		' title="' + hint + '">');
		this.append('<label>');
			//this.append('<input type="checkbox" ' + (control.checked ? 'checked' : '') + '>');
			this.append('<i class="fa">' + (control.checked ? '&#xf046;' : '&#xf096;')  + '</i> ');
			this.append(control.caption);
		this.append('</label>');
	this.append('</div>');
};

// Метод добавления элемента namevalue
DataFormBuilder.prototype.appendNameValue = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.NAMEVALUE)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + DataFormBuilder.controlCSS(control.kind) + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');

	// Добаление элементов списка
	for (var i = 0; i < control.items.length; i++)
	{
		this.append('<div class="form_control_namevalue_item' + ((i == 0) ? ' first' : '') + '">');
			this.append('<input type="hidden" value="' + i + '">');
			this.append('<div class="form_control_namevalue_item_name">' + control.items[i].name + '</div>');
			this.append('<div class="form_control_namevalue_item_value">' + control.items[i].value + '</div>');
			this.append('<div class="clear"></div>');
		this.append('</div>');
	}
	
	this.append('</div>');
};

// Метод добавления элемента listview
DataFormBuilder.prototype.appendListView = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.LISTVIEW)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + DataFormBuilder.controlCSS(control.kind) + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' + 
		(control.height > 100 ? 'style="height:' + control.height + 'px"' : '') + '>');
	
		// Проверить наличие кнопок
		if (control.buttons && (control.buttons.length > 0))
		{
			// Добавить область таблицы
			this.append('<div class="table_wrapper"><div class="table"></div></div>');
			// Добавить кнопочную панель
			this.append('<div class="buttons">');
				for (var i = 0; i < control.buttons.length; i++)
				{
					this.append('<button');
						if (control.buttons[i].name)
							this.append(' id="' + control.buttons[i].name + '"');
						if (control.buttons[i].hint)
							this.append(' title="' + control.buttons[i].hint + '"');
						if (!control.buttons[i].enabled)
							this.append(' disabled class="disabled"');
					this.append('>');
						this.append(control.buttons[i].caption);
					this.append('</button>');
				}
			this.append('</div>');
		}
		else
		{
			// Добавить таблицу без кнопочной панели
			this.append('<div class="table"></div>');
		}
		this.append('<div class="clear"></div>');
	this.append('</div>');
};

// Метод добавления элемента progress
DataFormBuilder.prototype.appendProgress = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.PROGRESS)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// CSS класс для контрола
	var css = DataFormBuilder.controlCSS(control.kind);
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' + '>');
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
DataFormBuilder.prototype.appendLine = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.LINE)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// CSS класс для контрола
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// HTML-код
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' + '>');
	this.append('</div>');
};

// Метод добавления элемента number
DataFormBuilder.prototype.appendNumber = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.NUMBER)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// CSS класс для контрола
	var css = DataFormBuilder.controlCSS(control.kind);
	
	// Ширина имения поля слева
	var label_width = 50;
	// Ширина кнопки справа
	var button_width = 100;

	// Корректировать ширину имени поля
	if (control.label)
	{
		if (control.label.width > label_width)
			label_width = control.label.width;
		if (control.label.caption == null)
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
		if (control.button.caption == null)
			control.button.caption = '';
		if (control.button.hint == null)
			control.button.hint = '';
	}
	else
	{
		button_width = 0;
	}
	
	if (control.value == null)
		control.value = 0;
	
	if (control.maxlen == null)
		control.maxlen = 15;
	
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '" ' +
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
	this.append('<div class="' + css + '_value" style="margin-right:-' + button_width + 'px;margin-left:-' + label_width + 'px;">');
	this.append('<div class="' + css + '_wrapper" style="margin-right:' + button_width + 'px;margin-left:' + label_width + 'px;">');
	this.append('<input type="text" maxlength="' + control.maxlen + '" value="' + control.value + '">');
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
	
	this.append('<div class="clear"></div>');
	this.append('</div>');
};

// Метод добавления элемента fileload
DataFormBuilder.prototype.appendFileLoad = function(control)
{
	// Проверить тип элемента
	if (control.kind != DataForm.CONTROL.FILELOAD)
		return;
	
	// Проверить наличие обязательных параметров
	if (control.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Заголовок над кнопкой UPLOAD
	var upload_caption = 'Upload';
	if (LOCALIZATION.LANGUAGE == LOCALIZATION.LANGUAGES.RUS)
		upload_caption = 'Загрузить';
	
	// CSS класс для контрола
	var css = DataFormBuilder.controlCSS(control.kind);

	// Начало описания контрола
	this.append('<div class="' + DataFormBuilder.CSS.FORM_CONTROL + ' ' + css + 
		'" id="' + DataFormBuilder.controlID(this._form_name, control.name) + '">');
	
	// Добавить заголовок над полем
	if ((control.caption != '') && (control.caption != null))
	{
		this.append('<div class="' + css + '_caption">');
			this.append(control.caption);
		this.append('</div>');
	}
	
	// Поле статуса загрузки
	this.append('<div class="' + css + '_status"></div>');
	this.append('<div class="clear"></div>');
	
	// Собственно поле :)
	this.append('<div class="' + css + '_content">');
	this.append('<form action="' + control.action + '" method="post" enctype="multipart/form-data">');

		// Область выбора файла
		this.append('<div class="' + css + '_content_input">');
			this.append('<div class="' + css + '_content_wrapper">');
				this.append('<input type="file" name="' + control.field + '">');
			this.append('</div>');
		this.append('</div>');
		
		// Кнопка "Загрузить"
		this.append('<div class="' + css + '_content_submit">');
			this.append('<input type="submit" name="upload" value="' + upload_caption + '">');
		this.append('</div>');
			
	this.append('</form>');
	this.append('</div>');
	
	this.append('<div class="clear"></div>');
	
	// Добавить индикатор процесса загрузки
	this.append('<div class="' + css + '_process">');
		this.append('<div class="' + css + '_process_value">');
		this.append('</div>');
	this.append('</div>');
	
	this.append('</div>');
};

// Метод добавления кнопки панели управления формы
DataFormBuilder.prototype.appendCommandButton = function(button)
{
	// Проверить наличие обязательных параметров
	if (button.name == null)
		throw new Error(DataFormBuilder.ERRORS.INVALID_STRUCTURE + ': "' + control.kind + ' name is null"');
	
	// Тип кнопки
	var type = '';
	switch (button.type)
	{
		// accept
		case 1:
			type = 'accept';
		break;
			
		// cancel
		case 2:
			type = 'cancel';
		break;
	}
	
	// Область кнопки
	this.append('<div');
		this.append(' class="' + DataFormBuilder.buttonCSS() + ' ' + type + '"');  
		this.append(' id="' + DataFormBuilder.buttonID(this._form_name, button.name) + '"');
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
// Контрол формы
// Параметры:
//   - form - ссылка на объект формы
//   - struct - пользовательское описание контрола
DataFormControl = function(form, struct)
{
	// Имя контрола
	this.name = struct.name;
	// Тип контрола
	this.kind = struct.kind;
	
	// Сохранить ссылку на форму
	this._$form = $('#' + form._struct.name);
	// Сохранить ссылку на контрол
	this._$control = this._$form.find('#' + DataFormBuilder.controlID(form._struct.name, this.name));
	
	// Спрятать контрол 
	if (struct.visible == false)
		this._$control.hide();
};

// Получить имя CSS класс для данного контрола
DataFormControl.prototype.css = function()
{
	return DataFormBuilder.CSS.FORM_CONTROL + '_' + this.kind;
};

// Отобразить признак ошики ввода данных (красная рамка)
DataFormControl.prototype.error = function(value)
{
	this._$form.parent().find('.form_control_error').remove();
	if (value != null)
		this._$control.after('<div class="form_control_error"> * ' + value + '</div>');
};

// Получить/установить признак видимости контрола
DataFormControl.prototype.visible = function(value)
{
	if (value == null)
	{
		// Получить
		return (this._$control.css('display') != 'none');
	}
	else
	{
		// Если идет попытка установки уже установленного значения, 
		// то пропускаем обработку
		if (value == (this._$control.css('display') != 'none'))
			return;
		
		// Установить
		if (value)
		{
			if ($.isIE(7)) 
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
			this._$control.next().filter('.form_control_error').show();
		}
		else
		{
			if ($.isIE(8)) 
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
			this._$control.next().filter('.form_control_error').hide();
		}
	}
};

// Получить/установить признак активности контрола
DataFormControl.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
			this._$control.removeClass('disabled');
		else
			this._$control.addClass('disabled');
	}
};

// Описание контрола в формате JSON-объекта
DataFormControl.prototype.json = function()
{
	return null;
};

//========================================================================
// LINE - Контрол формы линия
DataFormLine = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormLine.superclass.constructor.call(this, form, struct);
};

// Наследование
extend(DataFormLine, DataFormControl);

//========================================================================
// LABEL - Контрол формы (текстовая метка)
DataFormLabel = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormLabel.superclass.constructor.call(this, form, struct);
};

// Наследование
extend(DataFormLabel, DataFormControl);

// Функция установки получения значения
DataFormLabel.prototype.caption = function(value)
{
	if (value == null)
	{
		// Вернуть значение
		return this._$control.children('.' + this.css() + '_out').html();
	}
	else
	{
		// Отобразить значение на форме
		this._$control.children('.' + this.css() + '_out').html(value);
	}
};

//========================================================================
// TEXTBOX - Контрол формы (однострочное поле ввода текста)
DataFormTextBox = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormTextBox.superclass.constructor.call(this, form, struct);
	
	// Ссылка на себя
	var self = this;
	
	// Поле ввода
	this._$input = this._$control.find('input');
	
	// Функциональная кнопка
	this._$button = this._$control.find('>.' + this.css() + '_button>button');
	
	// Обработчики наведения
	this._$button.hover(function() {
		if ($(this).enabled())
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Получение и потеря фокуса
	this._$input.focus(function() {
		self._$control.addClass('focus');
	}).focusout(function() {
		self._$control.removeClass('focus');
	});
	
	// Навесить пользовательский обработчик нажатия на функциональную кнопку
	if ((struct.button != null) && (struct.button.onClick != null) && (typeof struct.button.onClick == 'function'))
	{
		// Обработчик нажатия мыши
		this._$button.bind('click', {form: form, self: this}, function(event) {
			struct.button.onClick.call(event.data.self, event.data.form);
		});
	};
	
	// Установка признака активности кнопки
	if (struct.button != null) 
		this.buttonEnabled(struct.button.enabled);
};

// Наследование
extend(DataFormTextBox, DataFormControl);

// Функция установки получения значения
DataFormTextBox.prototype.text = function(value)
{
	if (value == null)
	{
		// Вернуть значение
		return this._$control.find('input').val();
	}
	else
	{
		// Отобразить значение на форме
		this._$control.find('input').val(value);
	}
};

// Получить/установить признак активности контрола
DataFormTextBox.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$input.enabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$input.enabled(false);
		}
	}
};

// Получить/установить признак активности кнопки управления
DataFormTextBox.prototype.buttonEnabled = function(value)
{
	if (value == null)
		return this._$button.enabled();
	else
	{
		if (value)
			this._$button.removeClass('disabled').enabled(true);
		else
			this._$button.addClass('disabled').enabled(false);
	}
};

// Описание контрола в формате JSON-объекта
DataFormTextBox.prototype.json = function()
{
	return {
		text: this.text()
	};
};

// Отобразить признак ошики ввода данных (красная рамка)
DataFormTextBox.prototype.error = function(value)
{
	this._$form.find('.form_control_error').remove();
	if (value != null)
	{
		this._$control.after('<div class="form_control_error"> * ' + value + '</div>');
		this._$input.focus();
	}
};

//========================================================================
// STEXTBOX - Контрол формы (однострочное поле ввода текста с памятью)
DataFormSmartTextBox = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormSmartTextBox.superclass.constructor.call(this, form, struct);
	
	// Ссылка на себя
	var self = this;
	
	// Область элементов памяти
	this._$memory = this._$control.find('>.' + this.css() + '_memory');
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
		
		// Поиск элементов для отображение 
		self._$memory_items.each(function() {
			var item = $(this);
			if (item.html().toLowerCase().indexOf(self.text().toLowerCase()) >= 0)
			{
				item.show();
				show = true;
			}
			else
			{
				item.hide();
			}
		});
		
		// Отображать ли весь набор элементов
		if (show)
			expand();
		else
			collapse();

		// Удалить признак выбора
		self._$memory_items.filter('.slctd').removeClass('slctd');
	};
	
	// Выбор вышележащего элемента памяти
	function moveUp()
	{
		var items = self._$memory_items.filter(':visible');
		var index = items.filter('.slctd').removeClass('slctd').index(); 
		if (index == -1)
			items.last().addClass('slctd');
		else
			items.eq((index - 1) % items.length).addClass('slctd');
	};
	
	// Выбор нижележащего элемента памяти
	function moveDown()
	{
		var items = self._$memory_items.filter(':visible');
		var index = items.filter('.slctd').removeClass('slctd').index(); 
		if (index == -1)
			items.first().addClass('slctd');
		else
			items.eq((index + 1) % items.length).addClass('slctd');
	};

	this._$input.change(function(){
	});
	
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
	
	// Сохранить текст до нажатия кнопки
	var text = this.text();
	
	this._$input.keypress(function(e) {
		text = self.text();
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
	
	// Установка признака активности кнопки
	if (struct.button != null) 
		this.buttonEnabled(struct.button.enabled);
};

// Наследование
extend(DataFormSmartTextBox, DataFormTextBox);

//========================================================================
// NAMEVALUE - Контрол формы (список)
DataFormNameValue = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormNameValue.superclass.constructor.call(this, form, struct);
};

// Наследование
extend(DataFormNameValue, DataFormControl);

// Функция установки получения значения
DataFormNameValue.prototype.value = function(index, value)
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
// LISTVIEW - Контрол формы (список)
DataFormListView = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormListView.superclass.constructor.call(this, form, struct);
	
	// Поле для хранения таблицы внутри контрола
	this._data_table = null;
	
	// Навесить пользовательский обработчик нажатия на кнопки
	this._$control.find('button').bind('click', {form: form, self: this}, function(event) {
		for (var i = 0; i < struct.buttons.length; i++)
		{
			if ((struct.buttons[i].onClick != null) && (typeof struct.buttons[i].onClick == 'function') 
				&& (struct.buttons[i].name == $(this).attr('id')))
			{
				struct.buttons[i].onClick.call(event.data.self, $(this).attr('id'));
			}
		}
	});
};

// Наследование
extend(DataFormListView, DataFormControl);

// Функция получения контента вывода ListView
DataFormListView.prototype.content = function()
{
	return this._$control;
};

// Получить/установить таблицу внутри контрола
DataFormListView.prototype.dataTable = function(options, data)
{
	if (options == null)
	{
		return this._data_table;
	}
	else
	{
		// Установить таблицу ListView
		this._data_table = DataGridView(options, this._$control.find('.table'), data);
		// Деактивировать контролы ListView
		if (!this.enabled())
			this._$control.find('input[type="checkbox"]').enabled(false);
	}
};

// Получить/установить признак активности кнопки
DataFormListView.prototype.buttonEnabled = function(button, enabled)
{
	if (enabled == null)
	{
		return this._$control.find('#' + button).enabled();
	}
	else
	{
		this._$control.find('#' + button).enabled(enabled);
	}
};

// Получить/установить признак активности контрола
DataFormListView.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$control.children('.disabler').remove();
			this._$control.find('input[type="checkbox"]').enabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			if (this._$control.children('.disabler').length == 0)
				this._$control.append('<div class="disabler"></div>');
			this._$control.find('input[type="checkbox"]').enabled(false);
		}
	}
};

//========================================================================
// COMBOBOX - Контрол формы (Выпадающий список) 
DataFormComboBox = function(form, struct)
{
	// Ссылка на самого себя
	var self = this;
		
	// Вызов родительского конструктора
	DataFormComboBox.superclass.constructor.call(this, form, struct);
	
	// Функциональная кнопка
	this._$button = this._$control.find('>.' + this.css() + '_button>button');
	
	// Обработчики наведения
	this._$button.hover(function() {
		if ($(this).enabled())
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Установить начальное значение
	this._$control.find('select.userSelect').selectedIndex(struct.value);
	
	// Установить собственный выпадающий список
	this._$control.find('select.userSelect').userSelect({
		onCollapse: DataForm.onCollapse,
		onExpand: DataForm.onExpand,
		onChange: function(value) {
			if ((struct.onChange != null) && (typeof struct.onChange == 'function'))
				struct.onChange.call(self, value);
		}
	});
	this._$select = this._$control.find('.us_select');
	
	// Навесить пользовательский обработчик нажатия на функциональную кнопку
	if ((struct.button != null) && (struct.button.onClick != null) && (typeof struct.button.onClick == 'function'))
	{
		// Обработчик нажатия мыши
		this._$button.bind('click', {form: form, self: this}, function(event) {
			struct.button.onClick.call(event.data.self, event.data.form);
		});
	};
	
	// Установка признака активности кнопки
	if (struct.button != null) 
		this.buttonEnabled(struct.button.enabled);
};

// Наследование
extend(DataFormComboBox, DataFormControl);

// Функция установки/получения значения
DataFormComboBox.prototype.value = function(value)
{
	if (value == null)
		return this._$select.userSelect('value');		
	else
		this._$select.userSelect('value', value);
};

// Функция обновления наборы элементов ComboBox
DataFormComboBox.prototype.values = function(values)
{
	this._$select.userSelect('values', values);
	this._$select.userSelect('value', 0);
};

// Получить/установить признак активности кнопки управления
DataFormComboBox.prototype.buttonEnabled = function(value)
{
	if (value == null)
		return this._$button.enabled();
	else
	{
		if (value)
			this._$button.enabled(true).removeClass('disabled');
		else
			this._$button.enabled(false).addClass('disabled');
	}
};

// Получить/установить признак активности контрола
DataFormComboBox.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$select.userSelect('enabled', true);
			this.buttonEnabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$select.userSelect('enabled', false);
			this.buttonEnabled(false);
		}
	}
};

// Описание контрола в формате JSON-объекта
DataFormComboBox.prototype.json = function()
{
	return {
		index: this.value()
	};
};

// Префикс для идентификатора добавляемого select
DataFormComboBox.selectPrefix = 'select_';

//========================================================================
// CHOECKBOX - Контрол формы (checkbox) 
DataFormCheckBox = function(form, struct)
{
	// Ссылка на самого себя
	var self = this;
	
	// Сохранить признак выбора 
	this._checked = (struct.checked ? true : false);
	// Пользовательский обработчик
	this._onChange = struct.onChange;
	
	// Вызов родительского конструктора
	DataFormCheckBox.superclass.constructor.call(this, form, struct);
	
	// Поле ввода 
	this._$checkbox = this._$control.find('input');
	
	// Навесить обработчик изменения значения
	this._$control.find('label').click(function() {
		// Изменить текущее значение
		if (!self._$control.hasClass('disabled'))
			self.checked.call(self, !self._checked);
	});
};

// Наследование
extend(DataFormCheckBox, DataFormControl);

// Метод получения/установки признака выбора
DataFormCheckBox.prototype.checked = function(value)
{
	if (value == null)
	{
		return this._checked;
	}
	else
	{
		if (this._checked != value)
		{
			// Установить новое значение
			this._checked = value;
			
			// Признак выбора
			if (value)
			{
				this._$control.addClass('checked');
				this._$control.find('i').html('&#xf046;');
			}
			else
			{
				this._$control.removeClass('checked');
				this._$control.find('i').html('&#xf096;');
			}
			
			// Вызвать пользовательский обработчик
			if ((this._onChange) && (typeof this._onChange == 'function'))
				this._onChange.call(this);
		}
	}
};

// Получить/установить признак активности контрола
DataFormCheckBox.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$checkbox.enabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$checkbox.enabled(false);
		}
	}
};

// Описание контрола в формате JSON-объекта
DataFormCheckBox.prototype.json = function()
{
	return {
		checked: this.checked()
	};
};

//========================================================================
// DATE - Контрол формы (Дата) 
DataFormDate = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataFormDate.superclass.constructor.call(this, form, struct);
	
	// Отобразить поля ввода даты
	this._$control.find('input.datePicker').datePicker({
		onCollapse: DataForm.onCollapse,
		onExpand: DataForm.onExpand,
		language: form._language,
		onChange: function() {
			if ((struct.onChange != null) && (typeof struct.onChange == 'function'))
				struct.onChange.call(self);
		}
	});
	
	// Поле ввода даты
	this._$date = this._$control.find('.dp_input');
	
	// Установить начальные значения
	if ((struct.value != -1) || (struct.value != null))
		this.value(struct.value);
};

// Префикс для идентификатора поля ввода даты
DataFormDate.inputPrefix = 'input_date_';

// Наследование
extend(DataFormDate, DataFormControl);

// Метод получения/установки даты
DataFormDate.prototype.value = function(date)
{
	if (date == null)
		return this._$date.datePicker('selectedDate');
	else
		this._$date.datePicker('selectedDate', date);
};

// Установить минимальное возможное значение даты
DataFormDate.prototype.minimum = function(value)
{
	this._$date.datePicker('startDate', value);
};

// Установить максимальное возможное значение даты
DataFormDate.prototype.maximum = function(value)
{
	this._$date.datePicker('endDate', value);
};

// Получить/установить признак активности контрола
DataFormDate.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$date.datePicker('enabled', true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$date.datePicker('enabled', false);
		}
	}
};

// Описание контрола в формате JSON-объекта
DataFormDate.prototype.json = function()
{
	var date = this.value();
	if (date == -1)
		date = "";
	else
		date = date.formatString();
	return {
		date: date
	};
};

//========================================================================
// Time - Контрол формы (Выбор времени) 
DataFormTime = function(form, struct)
{
	// Ссылка на себя
	var self = this;
	
	// Вызов родительского конструктора
	DataFormTime.superclass.constructor.call(this, form, struct);
	
	// Установить начальное значение
	if (struct.hours >= 0)
		this._$control.find('select.userSelect.hours').selectedIndex(struct.hours % 24);
	if (struct.minutes >= 0)
		this._$control.find('select.userSelect.minutes').selectedIndex(struct.minutes % 60);

	// Преобразовать select-ы выбора времени в userSelect
	this._$control.find('select.userSelect').userSelect({
		onCollapse: DataForm.onCollapse,
		onExpand: DataForm.onExpand,
		onChange: function() {
			if ((struct.onChange != null) && (typeof struct.onChange == 'function'))
				struct.onChange.call(self);
		}
	});
	
	// Поле ввода часов
	this._$hours = $(this._$control.find('.us_select')[0]);
	// Поле ввода минут
	this._$minutes = $(this._$control.find('.us_select')[1]);
};

// Префикс для идентификатора поля ввода часов
DataFormTime.selectPrefixHours = 'select_time_hours_';
// Префикс для идентификатора поля ввода минут
DataFormTime.selectPrefixMinutes = 'select_time_minutes_';

//Наследование
extend(DataFormTime, DataFormControl);

// Метод получения/установки часов
DataFormTime.prototype.hours = function(value)
{
	if (value == null)
		return this._$hours.userSelect('value');		
	else
		this._$hours.userSelect('value', value);
};

// Метод получения/установки минут
DataFormTime.prototype.minutes = function(value)
{
	if (value == null)
		return this._$minutes.userSelect('value');		
	else
		this._$minutes.userSelect('value', value);
};

// Получить/установить признак активности контрола
DataFormTime.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$hours.userSelect('enabled', true);
			this._$minutes.userSelect('enabled', true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$hours.userSelect('enabled', false);
			this._$minutes.userSelect('enabled', false);
		}
	}
};

// Описание контрола в формате JSON-объекта
DataFormTime.prototype.json = function()
{
	return {
		hours: this.hours(),
		minutes: this.minutes()
	};
};

//========================================================================
// TIMER - Контрол таймера
DataFormTimer = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormTimer.superclass.constructor.call(this, form, struct);
	// Таймер
	this._timer = null;
	// Интервал срабатывания тамера
	this._interval = struct.interval;
	if (this._interval == null)
		this._interval = 1000;
	// Сохранить обработчик пользователя
	this._onTick = struct.onTick;
};

// Наследование
extend(DataFormTimer, DataFormControl);

// Отсановка таймера
DataFormTimer.prototype.stop = function()
{
	if (this._timer != null)
	{
		clearTimeout(this._timer);
		this._timer = null;
	}
};

// Запус таймера
DataFormTimer.prototype.start = function(form)
{
	// Ссылка на контрол
	var self = this;
	// Остановить предыдущий таймер
	self.stop();
	// Обработчик тика таймера 
	function onTimer() {
		if (typeof self._onTick === 'function')
			self._onTick.call(self, form);
		self._timer = setTimeout(onTimer, self._interval);
	};
	// Запустить таймер
	self._timer = setTimeout(onTimer, self._interval);
};

//========================================================================
// NUMBER - Контрол формы (однострочное поле ввода текста)
DataFormNumber = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormNumber.superclass.constructor.call(this, form, struct);
	
	// Ссылка на себя
	var self = this;
	
	// Текущее значение
	this._value = struct.value;
	if (this._value == null) 
		this._value = 0;
	
	// Максимум 
	this.maximum = struct.maximum;
	if (this.maximum == null)
		this.maximum = Number.POSITIVE_INFINITY; // MAX_VALUE
	// Минимум
	this.minimum = struct.minimum;
	if (this.minimum == null)
		this.minimum = Number.NEGATIVE_INFINITY; // MIN_VALUE
	
	// Поле ввода
	this._$input = this._$control.find('input');
	// Функциональная кнопка
	this._$button = this._$control.find('>.' + this.css() + '_button>button');
	
	// Обработчики наведения
	this._$button.hover(function() {
		if ($(this).enabled())
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Получение и потеря фокуса
	this._$input.focus(function() {
		self._$control.addClass('focus');
	}).focusout(function() {
		self._$control.removeClass('focus');
	});
	
	// Навесить пользовательский обработчик нажатия на функциональную кнопку
	if ((struct.button != null) && (struct.button.onClick != null) && (typeof struct.button.onClick == 'function'))
	{
		// Обработчик нажатия мыши
		this._$button.bind('click', {form: form, self: this}, function(event) {
			struct.button.onClick.call(event.data.self, event.data.form);
		});
	};
	
	// Фильтр ввода для поля 
	this._$input.numberMask({defaultValueInput: this._value});
	
	// Потеря фокуса полем ввода
	this._$input.bind('focusout', {form: form, self: this}, function(event) {
		event.data.self.value();
	});
	
	// Установка признака активности кнопки
	if (struct.button != null) 
		this.buttonEnabled(struct.button.enabled);
};

// Наследование
extend(DataFormNumber, DataFormControl);

// Функция установки получения значения
DataFormNumber.prototype.value = function(value)
{
	if (value == null)
	{
		// Вернуть значение
		var result = this._$control.find('input').val() * 1;
		if (result == Number.NaN)
			result = this.minimum;
		else if (result < this.minimum)
			result = this.minimum;
		else if (result > this.maximum)
			result = this.maximum;
		this._$control.find('input').val(result);
		return result;
	}
	else
	{
		// Отобразить значение на форме
		if (value < this.minimum)
			value = this.minimum;
		else if (value > this.maximum)
			value = this.maximum;
		this._$control.find('input').val(value);
	}
};

// Получить/установить признак активности контрола
DataFormNumber.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$input.enabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$input.enabled(false);
		}
	}
};

// Получить/установить признак активности кнопки управления
DataFormNumber.prototype.buttonEnabled = function(value)
{
	if (value == null)
		return this._$button.enabled();
	else
	{
		if (value)
			this._$button.removeClass('disabled').enabled(true);
		else
			this._$button.addClass('disabled').enabled(false);
	}
};

// Описание контрола в формате JSON-объекта
DataFormNumber.prototype.json = function()
{
	return {
		value: this.value()
	};
};

// Отобразить признак ошики ввода данных (красная рамка)
DataFormNumber.prototype.error = function(value)
{
	this._$form.find('.form_control_error').remove();
	if (value != null)
	{
		this._$control.after('<div class="form_control_error"> * ' + value + '</div>');
		this._$input.focus();
	}
};

//========================================================================
// PROGRESS - Контрол прогресса операции
DataFormProgress = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormProgress.superclass.constructor.call(this, form, struct);
	// Процент выполнения
	this.percent(0);
	// Статус выполнения
	if (form._language == LOCALIZATION.LANGUAGES.RUS)
		this.status('Ожидание');
	else
		this.status('Wait');
};

// Наследование
extend(DataFormProgress, DataFormControl);

// Установить/получить процент
DataFormProgress.prototype.percent = function(value)
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
		this._$control.find('.' + DataFormBuilder.controlCSS(this.kind) + '_info_percent').html(this._percent + '%');
		this._$control.find('.' + DataFormBuilder.controlCSS(this.kind) + '_bar_percent').css('width', this._percent + '%');
	}
};

// Установить/получить статусное сообщение
DataFormProgress.prototype.status = function(value)
{
	if (value == null)
	{
		// Получить
		return this._$control.find('.' + DataFormBuilder.controlCSS(this.kind) + '_info_status').html();;
	}
	else
	{
		// Установить
		this._$control.find('.' + DataFormBuilder.controlCSS(this.kind) + '_info_status').html(value);
	}
};

//========================================================================
// FILELOAD - Контрол формы (текстовая метка)
DataFormFileLoad = function(form, struct)
{
	// Вызов родительского конструктора
	DataFormFileLoad.superclass.constructor.call(this, form, struct);
	
	// Ссылка на себя
	var self = this;
	
	// Кнопка "Загрузить"
	this._$button = this._$control.find('.' + this.css() + '_content_submit>input');
	// Индикатор загрузки
	this._$process = this._$control.find('.' + this.css() + '_process_value');
	// Статус загрузки
	this._$status = this._$control.find('.' + this.css() + '_status');
	
	// Текущее значение индикатора загрузки (%)
	this._percent = 0;
	// Шаг индикации (%)
	this._step = 0.4;
	// Таймер индикации загрузки
	this._timer = null;
	
	// Обработчики наведения
	this._$button.hover(function() {
		if ($(this).enabled())
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Инициализация поля загрузки файла
	this._$control.find('input[type="file"]').customFileInput(function(file_name) {
		if (file_name != 0)
			self.buttonEnabled(true);
		else
			self.buttonEnabled(false);
	}); 
	
	// Инициализация iframe для фоновой загрузки файла
	this._$control.find('form').ajaxForm({
		iframe: true,
	    beforeSend: function() {
	    	// Запустить процесс индикации загрузки
	    	self.start();
	    },
	    success: function(answer) {
	    	self.stop();
	    	if (answer.indexOf('1-') == 0)
	    	{
	    		self._$status.removeClass('error').html(answer.substring(2));
	    		self._$process.css('width', '100%');
	    	}
	    	else 
	    	{
	    		var error_message = 'Fatal error';
	    		if (LOCALIZATION.LANGUAGE == LOCALIZATION.LANGUAGES.RUS)
	    			error_message = 'Непоправимая ошибка';
	    		if (answer.indexOf('0-') == 0)
	    			error_message = answer.substring(2);
	    		self._$status.addClass('error').html(error_message);
	    		self._$process.css('width', '0%');
	    	}
	    },
	    error: function() {
	    	self.stop();
	    	self._$process.css('width', '0%');
	    	var error_message = 'Fatal error';
    		if (LOCALIZATION.LANGUAGE == LOCALIZATION.LANGUAGES.RUS)
    			error_message = 'Непоправимая ошибка';
	    	self._$status.addClass('error').html(error_message);
	    }
	});
	
	// Деактивировать кнопку
	this.buttonEnabled(false);
};

// Наследование
extend(DataFormFileLoad, DataFormControl);

// Запустить индикатор загрузки
DataFormFileLoad.prototype.start = function()
{
	// Ссылка на контрол
	var self = this;
	// Текущее значение индикатора загрузки (%)
	self._percent = 0;
	// Остановить предыдущий таймер
	self.stop();
	// Обработчик тика таймера 
	function onTimer() {
		if (self._step / 0.8 >= (100 - self._percent) / 100)
			self._step = self._step / 2;
		self._percent = self._percent + self._step;
		self._$process.css('width', self._percent + '%');
		self._timer = setTimeout(onTimer, 10);
	};
	// Запустить таймер
	self._timer = setTimeout(onTimer, 10);
};

// Остановить индикатор загрузки
DataFormFileLoad.prototype.stop = function()
{
	if (this._timer != null)
	{
		clearTimeout(this._timer);
		this._timer = null;
	}
};

// Получить/установить признак активности кнопки управления
DataFormFileLoad.prototype.buttonEnabled = function(value)
{
	if (value == null)
		return this._$button.enabled();
	else
	{
		if (value)
			this._$button.enabled(true).removeClass('disabled');
		else
			this._$button.enabled(false).addClass('disabled');
	}
};

// Получить/установить признак активности контрола
DataFormFileLoad.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			this._$select.userSelect('enabled', true);
			this.buttonEnabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			this._$select.userSelect('enabled', false);
			this.buttonEnabled(false);
		}
	}
};

// Имя загружаемого файла
DataFormFileLoad.prototype.file = function()
{
	return this._$control.find('.customfile-feedback-populated').html();
};

// Описание контрола в формате JSON-объекта
DataFormFileLoad.prototype.json = function()
{
	return {
		file: this.file()
	};
};

//========================================================================
// Container - Контрол, который умеет хранить контролы
DataFormContainer = function(form, control)
{
	// Вызов родительского конструктора
	DataFormContainer.superclass.constructor.call(this, form, control);
	
	// Дочерние контролы
	this.controls = [];
};

// Наследование
extend(DataFormContainer, DataFormControl);

// Поиск дочеренего контрола по имени
DataFormContainer.prototype.find = function(name)
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
			else if ((this.controls[i].kind == DataForm.CONTROL.GROUPBOX) || (this.controls[i].kind == DataForm.CONTROL.PANEL))
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
DataFormContainer.prototype.enabled = function(value)
{
	if (value == null)
	{
		// Получить
		return (!this._$control.hasClass('disabled'));
	}
	else
	{
		// Установить
		if (value)
		{
			this._$control.removeClass('disabled');
			for (var i = 0; i < this.controls.length; i++)
				this.controls[i].enabled(true);
		}
		else
		{
			this._$control.addClass('disabled');
			for (var i = 0; i < this.controls.length; i++)
				this.controls[i].enabled(false);
		}
	}
};

//========================================================================
// GroupBox - Контрол для группирования элементов
DataFormGroupBox = function(form, control)
{
	// Вызов родительского конструктора
	DataFormGroupBox.superclass.constructor.call(this, form, control);
};

// Наследование
extend(DataFormGroupBox, DataFormContainer);

//========================================================================
// Panel - Контрол для размещения нескольких дочерних контролов вряд
DataFormPanel = function(form, control)
{
	// Вызов родительского конструктора
	DataFormPanel.superclass.constructor.call(this, form, control);
};

//Наследование
extend(DataFormPanel, DataFormContainer);

//========================================================================
// CommandButton - кнопка панели управления
// Параметры:
//   - form - ссылка на объект формы
//   - struct - описание кнопки
DataFormButton = function(form, struct)
{
	// Имя кнопки
	this.name = struct.name;
	
	// Сохранить ссылку на форму
	this._$form = $('#' + form._struct.name);
	// Сохранить ссылку на кнопки
	this._$button = this._$form.find('#' + DataFormBuilder.buttonID(form._struct.name, struct.name) + '>button');
	
	// Обработчики наведения
	this._$button.hover(function() {
		if ($(this).enabled())
			$(this).addClass('hover');
	}, function() {
		$(this).removeClass('hover');
	});
	
	// Навесить пользовательский обработчик нажатия на кнопку
	if ((struct.onClick != null) && (typeof struct.onClick == 'function'))
	{
		this._$button.bind('click', {form: form, self: this}, function(event) {
			struct.onClick.call(event.data.self, event.data.form);
		});
	}
};

// Получение/установка статуса активности кнопки кнопки
DataFormButton.prototype.enabled = function(value)
{
	if (value == null)
	{
		return this._$button.enabled();
	}
	else
	{
		if (value)
			this._$button.removeClass('disabled').enabled(true);
		else
			this._$button.addClass('disabled').enabled(false);
	}
};

//========================================================================
// Класс для работы с формой ввода данных
// Параметры:
//   - $content - родительский контент формы (JQ-объект)
//   - struct - структура формы
//   - language - идентификатор языка
DataForm = function($content, struct, language)
{
	// Ссылка на структуру формы
	this._struct = struct;
	// Язык формы
	this._language = language;
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
	$content.html(DataFormBuilder.formHTML(struct));
	
	// Рекурсивно инициализировать все контролы формы
	initControls(this, this, struct.controls);
	// Инициализация объектов для кнопок панели управления формы
	initButtons(this, struct.buttons);
	
	// Установить параметры контролов, такие как "ПРИЗНАК АКТИВНОСТИ", "ПРИЗНАК ВИДИМОСТИ" и т.д.
	// Проблема в том, что некоторые опции необходимо устанаваливать при помощи
	// методов уже созданных контролов (после initControls контролы считаются созданными),
	// т.к. некоторые свойства контрола могут влиять на дочерние контролы. Например,
	// если мы хотим деактивировать groupbox, то необходимо деактивировать все его дочерние контролы
	// А для этогоу DataFormGroupBox есть метод enabled(false), но он не доступен до вызова initControls
	disableSomeControls(this, struct.controls);
		
	// Рекурсивное выполнение методов проинициализированных контролов
	function disableSomeControls(form, controls)
	{
		for (var i = 0; i < controls.length; i++)
		{
			if (controls[i].enabled == false)
			{
				form.control(controls[i].name).enabled(false);
			}
			else
			{
				if ((controls[i].kind == DataForm.CONTROL.GROUPBOX) ||
					(controls[i].kind == DataForm.CONTROL.PANEL))
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
					case DataForm.CONTROL.GROUPBOX:
						control = new DataFormGroupBox(form, controls[i]);
						initControls(form, control, controls[i].controls);
					break;
					
					case DataForm.CONTROL.PANEL:
						control = new DataFormPanel(form, controls[i]);
						initControls(form, control, controls[i].controls);
					break;
					
					case DataForm.CONTROL.LABEL:
						control = new DataFormLabel(form, controls[i]);
					break;
					
					case DataForm.CONTROL.TEXTBOX:
						control = new DataFormTextBox(form, controls[i]);
					break;
					
					case DataForm.CONTROL.STEXTBOX:
						control = new DataFormSmartTextBox(form, controls[i]);
					break;					
					
					case DataForm.CONTROL.NAMEVALUE:
						control = new DataFormNameValue(form, controls[i]);
					break;
					
					case DataForm.CONTROL.LISTVIEW:
						control = new DataFormListView(form, controls[i]);
					break;
						
					case DataForm.CONTROL.COMBOBOX:
						control = new DataFormComboBox(form, controls[i]);
					break;
					
					case DataForm.CONTROL.CHECKBOX:
						control = new DataFormCheckBox(form, controls[i]);
					break;
					
					case DataForm.CONTROL.DATE:
						control = new DataFormDate(form, controls[i]);
					break;
					
					case DataForm.CONTROL.TIME:
						control = new DataFormTime(form, controls[i]);
					break;
					
					case DataForm.CONTROL.TIMER:
						// Создать таймер
						control = new DataFormTimer(form, controls[i]);
						// Сохранить ссылку на таймер
						form._timers.push(control);
					break;
					
					case DataForm.CONTROL.LINE:
						control = new DataFormLine(form, controls[i]);
					break;
					
					case DataForm.CONTROL.PROGRESS:
						control = new DataFormProgress(form, controls[i]);
					break;
					
					case DataForm.CONTROL.NUMBER:
						control = new DataFormNumber(form, controls[i]);
					break;
					
					case DataForm.CONTROL.FILELOAD:
						control = new DataFormFileLoad(form, controls[i]);
						// В этом контроле тоже есть таймер. Сохранить ссылку на контрол
						form._timers.push(control);
					break;
				}
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
				form.buttons.push(new DataFormButton(form, buttons[i]));
		}
	};
};

// Типы элементов управления
// Описания типов в коментариях. Обязательные поля помечены символом "x".
// Если симола нет, то поле необязательное
DataForm.CONTROL = {};

// Текстовая метка
DataForm.CONTROL.LABEL = 'label',
/*
 *      {
 *       x  kind    : DataForm.CONTROL.LABEL,
 *       x  name    : String  - уникальное имя элемента,
 *          caption : String  - значение для вывода,
 *          hint    : String  - всплывающая подсказка,
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола
 *      }
 */

// Однострочное поле ввода
DataForm.CONTROL.TEXTBOX = 'textbox';
/*
 *      {
 *       x  kind    : DataForm.CONTROL.TEXTBOX,
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

// Однострочное поле ввода с памятью
DataForm.CONTROL.STEXTBOX = 'stextbox';
/*
 *      {
 *       x  kind    : DataForm.CONTROL.STEXTBOX,
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
DataForm.CONTROL.COMBOBOX = 'combobox';
/*    
 *      {
 *       x  kind     : DataForm.CONTROL.COMBOBOX,
 *       x  name     : String   - имя контрола,
 *          caption  : String   - заголовок над полем,
 *          value    : Number   - индекс выбранного элемента,
 *          values   : Array    - возможные значения,
 *          hint     : String   - подксказка,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function(value) { пользовательский обработчик изменения значения }
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
DataForm.CONTROL.GROUPBOX = 'groupbox';
/*
 *      {
 *       x  kind     : DataForm.CONTROL.GROUPBOX,
 *       x  name     : String   - имя контрола,
 *          caption  : String   - заголовок,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          controls : [ {}, ... тут набор описание дочерних контролов, аналогичное контролам формы ]
 *      }
 */

// Контрол выбора
DataForm.CONTROL.CHECKBOX = 'checkbox';
/*
 *      {
 *       x  kind     : DataForm.CONTROL.CHECKBOX,
 *       x  name     : String   - имя контрола,
 *          caption  : String   - заголовок,    
 *          hint     : String   - подксказка,
 *          checked  : Boolean  - признак выбора,      
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function(value) { пользовательский обработчик изменения значения }
 *      }
 */

// Радио кнопка
//DataForm.CONTROL.RADIO = 'radio';
/*
 *      {
 *       x  kind    : DataForm.CONTROL.RADIO,
 *       x  name    : String   - имя контрола,
 *       x  group   : String   - имя группы radio кнопок,
 *          caption : String   - заголовок,
 *          hint    : String   - подксказка,
 *          checked : Boolean  - признак выбора,
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола
 *      }
 */

// Поле ввода даты
DataForm.CONTROL.DATE = 'date';
/*
 *      {
 *       x  kind     : DataForm.CONTROL.DATE,
 *       x  name     : String   - имя контрола,
 *          value    : Date     - значение даты,
 *          hint     : String   - подксказка,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function() { пользовательский обработчик изменения значения },
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String  - заголовок,
 *              width   : Number  - ширина в пикселях
 *          }
 *      }
 */

// Поле ввода времени
DataForm.CONTROL.TIME = 'time';
/*
 *      {
 *       x  kind     : DataForm.CONTROL.TIME,
 *       x  name     : String   - имя контрола,
 *          hours    : Number   - значение часов
 *          minutes  : Number   - значение минут,
 *          hint     : String   - подсказка,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function() { пользовательский обработчик изменения значения },
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String  - заголовок,
 *              width   : Number  - ширина в пикселях
 *          }
 *      } 
 */

// Поле для хранения списка
DataForm.CONTROL.LISTVIEW  = 'listview';
/*
 *   [
 *      {
 *       x  kind   : DataForm.CONTROL.LISTVIEW,
 *       x  name   : String - имя контрола,
 *          height : Number - высота контрола в пискселях
 *      },
 *      ...
 *   ]
 */

// Поле отображения списка пар "ИМЯ-ЗНАЧЕНИЕ"
DataForm.CONTROL.NAMEVALUE = 'namevalue';
/*
 *      {
 *       x  kind    : DataForm.CONTROL.NAMEVALUE,
 *       x  name    : String   - имя контрола,
 *          visible : Boolean  - признак видимости контрола,
 *          items: [{
 *              name  : String - имя поля,
 *              value : String - значение поля
 *          },...]
 *      } 
 */

// Панель, для отображения нескольких контролов в ряд
DataForm.CONTROL.PANEL = 'panel';
/*
 *      {
 *          kind     : DataForm.CONTROL.PANEL,
 *          name     : String - уникальное имя элемента,
 *          controls : [ {}, ... тут набор дочерних контролов, аналогичное контролам формы ]
 *      }
 */

// Поле для отображения прогресса выболнения
DataForm.CONTROL.PROGRESS = 'progress';
/*
 *      {
 *          kind  : DataForm.CONTROL.PROGRESS,
 *          name  : String - уникальное имя элемента
 *      }
 */

// Контрола Timer
DataForm.CONTROL.TIMER = 'timer';
/*
 *      {
 *          kind     : DataForm.CONTROL.TIMER,
 *          name     : String - уникальное имя элемента,
 *          interval : Number - инетрвал срабатывания тамера,
 *          onTick   : function() { обработчик тика таймера }
 *      }
 */

// Контрола Line
DataForm.CONTROL.LINE = 'line';
/*
 *      {
 *          kind     : DataForm.CONTROL.LINE,
 *          name     : String - уникальное имя элемента
 *      }
 */

// Контрола Number
DataForm.CONTROL.NUMBER = 'number';
/*
 * {
 *   x kind     : DataForm.CONTROL.NUMBER,
 *   x name     : String  - имя контрола,
 *     caption  : String  - заголовок над полем,
 *     value    : Number  - текущее значение,
 *     maximum  : Number  - максимальное значение,
 *     minimum  : Number  - минимальное значение,
 *     visible  : Boolean - признак видимости контрола,
 *     enabled  : Boolean - признак активности контрола
 * },
 */ 

// Поле для загрузки файла
DataForm.CONTROL.FILELOAD = 'fileload';
/*
 *      {
 *       x  kind    : DataForm.CONTROL.FILELOAD,
 *       x  name    : String   - имя контрола,
 *          caption : String   - заголовок,
 *          action  : String   - url post-запроса загрузки файла,
 *          field   : String   - имя поля post-запроса с данными файла,          
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола
 *      }
 */

// Обработка сворачивания списка или календаря
DataForm.onCollapse = function()
{
	var item = $(this);
	while (!item.hasClass('form'))
	{
		if (item.hasClass('form_control'))
			item.removeClass('zindex_10');
		item = item.parent();
	}
};

// Обработка выпадения списка или календаря
DataForm.onExpand = function()
{
	var item = $(this);
	while (!item.hasClass('form'))
	{
		if (item.hasClass('form_control'))
			item.addClass('zindex_10');
		item = item.parent();
	}
};

// Иногда возникает необходимость в удалении внутренних ссылок объекта DataForm
// Например:
//   - контрол DataFormTimer в запущенном состоянии хранит ссылку на 
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
				if ((this.controls[i].kind == DataForm.CONTROL.GROUPBOX) || (this.controls[i].kind == DataForm.CONTROL.PANEL))
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