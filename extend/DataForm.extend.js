/***********************************************************************
 * 
 *                            DataForm.extend
 *                               
 * Расширение набора контролов DataForm
 * 
 * Добавляемые контролы:
 *   - Date - поле ввода даты
 *   - Time - поле ввода времени
 *   - FileLoad - поле загрузки файла, без перегрузки страницы
 * 
 * Зависимости:
 *    - DataForm.js
 *    - jquery.file.js
 *    - jquery.form.js
 *    - jquery.datePicker.js
 *
 *                                  Copyright 2012-2014, ООО НПП "ЭКРА"
 ***********************************************************************/


// Поле ввода даты
DataForm.ControlType.DATE = 'date';
/*
 *      {
 *       x  kind     : DataForm.ControlType.DATE,
 *       x  name     : String   - имя контрола,
 *          value    : Date     - значение даты,
 *          hint     : String   - подксказка,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function(form) { пользовательский обработчик изменения значения },
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String  - заголовок,
 *              width   : Number  - ширина в пикселях
 *          }
 *      }
 */

// Поле ввода времени
DataForm.ControlType.TIME = 'time';
/*
 *      {
 *       x  kind     : DataForm.ControlType.TIME,
 *       x  name     : String   - имя контрола,
 *          hours    : Number   - значение часов
 *          minutes  : Number   - значение минут,
 *          hint     : String   - подсказка,
 *          visible  : Boolean  - признак видимости контрола,
 *          enabled  : Boolean  - признак активности контрола,
 *          onChange : function(form) { пользовательский обработчик изменения значения },
 *          // Сообщение слева от самого поля
 *          label: {
 *              caption : String  - заголовок,
 *              width   : Number  - ширина в пикселях
 *          }
 *      } 
 */

// Поле для загрузки файла
DataForm.ControlType.FILELOAD = 'fileload';
/*
 *      {
 *       x  kind    : DataForm.ControlType.FILELOAD,
 *       x  name    : String   - имя контрола,
 *          caption : String   - заголовок,
 *          action  : String   - url post-запроса загрузки файла,
 *          field   : String   - имя поля post-запроса с данными файла,          
 *          visible : Boolean  - признак видимости контрола,
 *          enabled : Boolean  - признак активности контрола
 *      }
 */



//Радио кнопка
//TODO DataForm.ControlType.RADIO = 'radio';
/*
*      {
*       x  kind    : DataForm.ControlType.RADIO,
*       x  name    : String   - имя контрола,
*       x  group   : String   - имя группы radio кнопок,
*          caption : String   - заголовок,
*          hint    : String   - подксказка,
*          checked : Boolean  - признак выбора,
*          visible : Boolean  - признак видимости контрола,
*          enabled : Boolean  - признак активности контрола
*      }
*/



// Локализация добавляемых контролов
//  - английский язык
DataForm.Localization.english.fileLoad = {
	upload     : 'Download',
	fatalError : 'Fatal error',
	empty      : 'Select file'
};
//  - русский язык
DataForm.Localization.russian.fileLoad = {
	upload     : "Загрузить",
	fatalError : "Непоправимая ошибка",
	empty      : 'Выберите файл'
};



(function() { 
	// Метод добавления элемента выбора даты
	function appendDate(control)
	{
		// Проверить тип элемента
		if (control.kind != DataForm.ControlType.DATE)
			return;
		
		// Проверить наличие обязательных параметров
		if (control.name == null)
			throw new Error(control.kind + ' name is null');
		
		// Ширина имения поля слева
		var label_width = 100;
		// Сообщение слева от поля ввода
		var caption = '';
		// CSS класс для отображения элемента
		var css = DataForm.Builder.controlCSS(control.kind);
		
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
				
		this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
			'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');
		
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
		
		this.append('<div class="df_clear"></div>');
		this.append('</div>');
	};
	
	// Метод добавления элемента выбора времени
	function appendTime(control)
	{
		// Проверить тип элемента
		if (control.kind != DataForm.ControlType.TIME)
			return;
		
		// Проверить наличие обязательных параметров
		if (control.name == null)
			throw new Error(control.kind + ' name is null');
		
		// Ширина имения поля слева
		var label_width = 100;
		// Сообщение слева от поля ввода
		var caption = '';
		// CSS класс для отображения элемента
		var css = DataForm.Builder.controlCSS(control.kind);
		
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
				
		this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
			'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');
		
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
		
		this.append('<div class="df_clear"></div>');
		this.append('</div>');
	};
	
	// Метод добавления элемента fileload
	function appendFileLoad(control)
	{
		// Проверить тип элемента
		if (control.kind != DataForm.ControlType.FILELOAD)
			return;
		
		// Проверить наличие обязательных параметров
		if (control.name == null)
			throw new Error(control.kind + ' name is null');
		
		// CSS класс для контрола
		var css = DataForm.Builder.controlCSS(control.kind);
	
		// Начало описания контрола
		this.append('<div class="' + DataForm.Builder.CSS.FORM_CONTROL + ' ' + css + 
			'" id="' + DataForm.Builder.controlID(this._form_name, control.name) + '">');
		
		// Добавить заголовок над полем
		if ((control.caption != '') && (control.caption != null))
		{
			this.append('<div class="' + css + '_caption">');
				this.append(control.caption);
			this.append('</div>');
		}
		
		// Поле статуса загрузки
		this.append('<div class="' + css + '_status"></div>');
		this.append('<div class="df_clear"></div>');
		
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
				this.append('<input type="submit" name="upload" value="' + this._localization.fileLoad.upload + '">');
			this.append('</div>');
				
		this.append('</form>');
		this.append('</div>');
		
		this.append('<div class="df_clear"></div>');
		
		// Добавить индикатор процесса загрузки
		this.append('<div class="' + css + '_process">');
			this.append('<div class="' + css + '_process_value">');
			this.append('</div>');
		this.append('</div>');
		
		this.append('</div>');
	};
	

	
	//========================================================================
	// Date - Контрол формы (Дата) 
	function DataFormDate(form, struct)
	{
		// Ссылка на себя
		var self = this;
		
		// Вызов родительского конструктора
		DataFormDate.superclass.constructor.call(this, form, struct);
		
		// Отобразить поля ввода даты
		this._$control.find('input.datePicker').datePicker({
			onCollapse: DataForm.onCollapse,
			onExpand: DataForm.onExpand,
			language: form._localization.language,
			onChange: (function() {
				if (typeof struct.onChange == 'function')
					return function() {
						struct.onChange.call(self, form);
					}
			})()
		});
		
		// Поле ввода даты
		this._$date = this._$control.find('.dp_input');
		
		// Установить начальные значения
		if ((struct.value != -1) || (struct.value != null))
			this.value(struct.value);
	};
	DataFormDate.extendClass(DataForm.Control);
	
	// Префикс для идентификатора поля ввода даты
	DataFormDate.inputPrefix = 'input_date_';
	
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
		if (value === undefined) 
		{
			// Получить
			return DataFormDate.superclass.enabled.call(this);
		}
		else
		{
			// Установить
			DataFormDate.superclass.enabled.call(this, value);
			this._$date.datePicker('enabled', !!value);
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
	function DataFormTime(form, struct)
	{
		// Ссылка на себя
		var self = this;
		
		// Вызов родительского конструктора
		DataFormTime.superclass.constructor.call(this, form, struct);
		
		// Установить начальное значение
		if (struct.hours >= 0)
			this._$control.find('select.userSelect.hours').prop('selectedIndex', struct.hours % 24);
		if (struct.minutes >= 0)
			this._$control.find('select.userSelect.minutes').prop('selectedIndex', struct.minutes % 60);
	
		// Преобразовать select-ы выбора времени в userSelect
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
		
		// Поле ввода часов
		this._$hours = $(this._$control.find('.us_select')[0]);
		// Поле ввода минут
		this._$minutes = $(this._$control.find('.us_select')[1]);
	};
	DataFormTime.extendClass(DataForm.Control);
	
	// Префикс для идентификатора поля ввода часов
	DataFormTime.selectPrefixHours = 'select_time_hours_';
	// Префикс для идентификатора поля ввода минут
	DataFormTime.selectPrefixMinutes = 'select_time_minutes_';
	
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
		if (value === undefined) 
		{
			// Получить
			return DataFormTime.superclass.enabled.call(this);
		}
		else
		{
			// Установить
			DataFormTime.superclass.enabled.call(this, value);
			this._$hours.userSelect('enabled', !!value);
			this._$minutes.userSelect('enabled', !!value);
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
	// FileLoad - Контрол формы (текстовая метка)
	function DataFormFileLoad(form, struct)
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
			if (!$(this).prop('disabled'))
				$(this).addClass('hover');
		}, function() {
			$(this).removeClass('hover');
		});
		
		// Инициализация поля загрузки файла
		this._$control.find('input[type="file"]').customFileInput(function(file_name) {
			self.buttonEnabled(file_name != 0);
		}, form._localization.fileLoad.empty); 
		
		// Инициализация iframe для фоновой загрузки файла
		this._$control.find('df').ajaxForm({
			iframe: true,
		    beforeSend: function() {
		    	// Запустить процесс индикации загрузки
		    	self._start();
		    },
		    success: function(answer) {
		    	self._stop();
		    	if (answer.indexOf('1-') == 0)
		    	{
		    		self._$status.removeClass('error').html(answer.substring(2));
		    		self._$process.css('width', '100%');
		    	}
		    	else
		    	{
		    		self._$status.addClass('error').html(((answer.indexOf('0-') == 0) ? 
	    				answer.substring(2) : this._localization.fileLoad.fatalError));
		    		self._$process.css('width', '0%');
		    	}
		    },
		    error: function() {
		    	self._stop();
		    	self._$process.css('width', '0%');
		    	self._$status.addClass('error').html(this._localization.fileLoad.fatalError);
		    }
		});
		
		// Деактивировать кнопку
		this.buttonEnabled(false);
	};
	DataFormFileLoad.extendClass(DataForm.Control);
	
	// Запустить индикатор загрузки
	DataFormFileLoad.prototype._start = function()
	{
		// Ссылка на контрол
		var self = this;
		// Текущее значение индикатора загрузки (%)
		self._percent = 0;
		// Остановить предыдущий таймер
		self._stop();
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
	DataFormFileLoad.prototype._stop = function()
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
	
	// Получить/установить признак активности контрола
	DataFormFileLoad.prototype.enabled = function(value)
	{
		if (value === undefined) 
		{
			// Получить
			return DataFormFileLoad.superclass.enabled.call(this);
		}
		else
		{
			// Установить
			DataFormFileLoad.superclass.enabled.call(this, value);
			var $input = this._$control.find('input[type="file"]');
			$input.prop('disabled', !value);
			if ($input.val())
				this.buttonEnabled(value);
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
	
	
	// Установка плагинов
	DataForm.installPlugins([{
		kind: DataForm.ControlType.DATE,
		append: appendDate,
		constructor: function(form, defenition) {
			return new DataFormDate(form, defenition);
		}
	}, {
		kind: DataForm.ControlType.TIME,
		append: appendTime,
		constructor: function(form, defenition) {
			return new DataFormTime(form, defenition);
		}
	}, {
		kind: DataForm.ControlType.FILELOAD,
		append: appendFileLoad,
		constructor: function(form, defenition) {
			// Этот контрол ведет себя как таймер, поэтому
			// его нужно доавбить в список таймеров формы
			var control = new DataFormFileLoad(form, defenition);
			form._timers.push(control);
			return control;
		}
	}]);
})();