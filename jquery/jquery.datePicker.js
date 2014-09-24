/***********************************************************************
 * 
 *                       jquery.datePicker.js
 *                               
 * datePicker - плагин для отрисовки элемента ввода даты 
 * 
 * Зависимости:
 *    - jquery.js 
 *    - localization.js
 *    
 * Параметры:
 *   1) для init
 *     - options: {
 *         max_count: // высота области выадения (в элементах),
 *         onChange: function() { обработчик события изменения значения },
 *         onExpand: function() { обработчик события выпадения },
 *         onCollapse: function() { обработчик события сворачивания }
 *       }
 * 
 * Функциональность:
 *   - генерация HTML-кода 
 *   - получение/установка выбранной даты
 *   - получение/установка доступного периода выдора даты
 *   - установка языка отображения календаря
 *   
 * Особенности:
 *   Плагин предназначен для замены тегов input.datePicker[type='hidden']
 *   на теги для реалиации заданной функциональности. Тег input удаляется
 *                                                    
 *                                  Copyright 2012-2014, ООО НПП "ЭКРА"
 ***********************************************************************/

;(function($)
{
	//==========================================================================
	// Константы 
	var cssCalendar = 'calendar';
	var cssInput    = 'input';
	var cssPrefix   = 'dp';
	var cssOpened   = 'opened';
	var cssDisabled = 'disabled';
	var htmlEmpty   = '...';
	var htmlPrev    = '<<';
	var htmlNext    = '>>';
	
	//==========================================================================
	// Идентификаторы поддерживаемых языков
	var LANGUAGES = 
	{
		ENG : 0,
		RUS : 1
	};
	
	//==========================================================================
	// Названия мясяцов
	var MONTH_NAME = 
	{
		RUS: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
		ENG: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	};
	// Название дней недели
	var DAYOFWEAK_NAME =
	{
		RUS: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
		ENG: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	};
	
	// Идентификаторы записей в кеше data
	var DATA = 
	{
		// Настройки элемента
		SETTINGS : 'settings',
		// Текущая отображаемая дата. По ней определяется 
		// месяц, на котрый будет отображаться в календаре
		DATE : 'theDate'
	};
	
	//==========================================================================
	// Настройки по умолчанию
	var defaults =
	{
		id           : 0,
		startDate    : -1,
		endDate      : -1,
		selectedDate : -1,
		allowOld     : true,
		language     : LANGUAGES.RUS
	};
	
	//==========================================================================
	// Методы плагина
	var methods = 
	{
		// Конструктор
		init: function(options) { return null; },
		// Получение уникального имени элемента
		name: function() { return null; },
		// Очистить значение
		clear: function(e) { return null; },
		// Отобразить календарь
		show: function(e) { return null; },
		// Спрятать календарь
		hide: function() { return null; },
		// Установить/получить значение параметра allowOld
		allowOld: function(value) { return null; },
		// Установить/получить минимальную возможную дату для календаря
		startDate: function(date) { return null; },
		// Установить/получить максимальную возможную дату для календаря
		endDate: function(date) { return null; },
		// Установить/получить выбранную дату
		selectedDate: function(date) { return null; },
		// Отрисовка календаря
		render: function() { return null; },
		// Установка обработчика события изменения значения
		setOnChange: function(data, callback) { return null; },
		// Установка/Получение признака активности элемента
		enabled: function(value) { return null; }
	};
	
	//==========================================================================
	// Внутрення функция получения css класса элемента
	function getClassMain() { return cssPrefix + '_' + cssInput; };
	// Внутрення функция получения css класса для значение
	function getClassValue() { return getClassMain() + '_value'; };
	// Внутрення функция получения css класса для кнопки
	function getClassButton() { return getClassMain() + '_button'; };
	// Внутрення функция получения css класса для области вывода значения
	function getClassOut() { return getClassMain() + '_out'; };
	// Внутрення функция получения css класса для выпадающего списка
	function getClassCalendar() { return cssPrefix + '_' + cssCalendar; };
	// Внутрення функция получения css класса-признака отображения выпадающего 
	// списка для элемента
	function getClassOpened() { return cssPrefix + '_' + cssOpened; };

	//==========================================================================
	// Внутрення функция возврата названия месяца по его номер от 0 до 11 и
	// заданному языку
	function getMonthName(number, language)
	{
		try
		{
			switch (language)
			{
				case LANGUAGES.RUS:
					return MONTH_NAME.RUS[number];
				default:
					return MONTH_NAME.ENG[number];
			}
		}
		catch(e) 
		{
			return '';
		};
	};
	
	//==========================================================================
	// Внутрення функция возврата названия дня недели (0 - Воскресенье, 6-Суббота)
	function getDayOfWeekName(number, language)
	{
		try
		{
			switch (language)
			{
				case LANGUAGES.RUS:
					return DAYOFWEAK_NAME.RUS[number];
				default:
					return DAYOFWEAK_NAME.ENG[number];
			}
		}
		catch(e) 
		{
			return '';
		};
	};

	//==========================================================================
	// Конструктор
	methods.init = function(options)
	{
		return this.each(function()
		{
			// Указатель на элемент
			var self = $(this);
			// Настройки элемента
			var settings = {};

			// Расширить настройки значениями по умолчанию
			settings = $.extend(settings, defaults);
			// Расширить пользовательскими настройками
			if (options) settings = $.extend(settings, options);
			// Сохранить идентификатор datePicker
			settings.id = cssPrefix + '_' + self.attr('id');
			
			// HTML код после тега input
			self.after(
				'<div class="' + getClassMain() + '" id="' + settings.id + '">' +
					'<div class="' + getClassValue() + '">' +
						'<div class="' + getClassMain() + '_wrapper">' + 
							'<div class="' + getClassOut() + '">' + htmlEmpty + '</div>' +
						'</div>' +
					'</div>' +
					'<div class="' + getClassButton() + '">x</div>' +
					'<div class="clear"></div>' +
				'</div>'
			);
			// Удалить реальный input
			self.remove();
			// Теперь self - это ссылка на dp_input
			self = $('#' + settings.id);
			
			// Сохранить в кеше data
			self.data(DATA.SETTINGS, settings);

			// Отображение календаря при нажатии
			self.find('.' + getClassOut()).click(function(e) {
				if (!self.hasClass(cssDisabled))
					methods.show.apply(self, [e]);
			});
			
			// Очистка значения при нажатии на кнопку очистить
			self.find('.' + getClassButton()).click(function(e) {
				if (!self.hasClass(cssDisabled))
				{
					// Останавить "всплытие" вызова события к родительским элементам
					e.stopPropagation();
					// Очистить поле
					methods.clear.call(self);
				}
			});

			// Если нажать мышь в другом месте, то спрятать календарь
			$(document).bind('click', function(e) {
				methods.hide.apply(self);
			});
			
			// Наведение мыши на кнопку "Очистить"
			self.find('.' + getClassButton()).hover(function() {
					if (!self.hasClass(cssDisabled))
					$(this).addClass(getClassButton() + '_hover');
				}, function() {
					$(this).removeClass(getClassButton() + '_hover');
				}
			);
			// Наведение мыши на область вывода
			self.find('.' + getClassOut()).hover(function() {
					if (($(this).html() == htmlEmpty) && (!self.hasClass(cssDisabled)))
						$(this).addClass(getClassOut() + '_hover');
				}, function() {
					$(this).removeClass(getClassOut() + '_hover');
				}
			);
			// Наведение мыши на элемент
			self.find('.' + getClassValue()).hover(function() {
					if (!self.hasClass(cssDisabled))
						$(this).addClass(getClassValue() + '_hover');
				}, function() {
					$(this).removeClass(getClassValue() + '_hover');
				}
			);
		});
	};
	
	//==========================================================================
	// Отобразить календарь
	methods.show = function(e)
	{
		// Ссылка на сам элемент
		var self = $(this);
		// Параметры элемента
		var settings = self.data(DATA.SETTINGS);
		// Останавить "всплытие" вызова события к родительским элементам
		e.stopPropagation();
		// Спрятать все остальные календари
		methods.hide.apply($('.' + getClassOpened()).not($(this)));
		// Перерисовать календарь
		methods.render.apply($(this));
		// Вызвать пользовательский обработчик отображения выпадающего календаря
		if ((settings.onExpand != null) && (typeof settings.onExpand == 'function'))
			settings.onExpand.apply(self);
	};
	
	//==========================================================================
	// Очистить значение
	methods.clear = function(e)
	{
		// Спрятать все календари
		methods.hide.apply($('.' + getClassOpened()));
		// Сбросить значение
		methods.selectedDate.call(this, -1);
	};

	//==========================================================================
	// Спрятать календарь
	methods.hide = function()
	{
		try
		{
			if (this.length > 0)
			{
				// Ссылка на сам элемент
				var self = $(this);
				// Если выпадающий список отображается, то спрятать его
				if (self.hasClass(getClassOpened()))
				{
					// Параметры элемента
					var settings = self.data(DATA.SETTINGS);
					// Спрятать выпадающий список
					self.find('.' + getClassCalendar()).hide();
					// Удалить признак отображения выпадающего ссписка для элемента
					self.removeClass(getClassOpened());
					// Вызвать пользовательский обработчик сворачивани выпадающего календаря
					if ((settings.onCollapse != null) && (typeof settings.onCollapse == 'function'))
						settings.onCollapse.apply(self);
				}
			}
		}
		catch(e) { $.error(e.message); };
	};
	
	//==========================================================================
	// Спрятать выпадающий список
	methods.enabled = function(value)
	{
		try
		{
			// Ссылка на сам элемент
			var self = $(this);
			if (value == null)
			{
				return !self.hasClass(cssDisabled);
			}
			else
			{
				// Если выпадающий список отображается, то спрятать его
				methods.hide.apply(self);
				// Установить признак
				if (value)
					self.removeClass(cssDisabled);
				else
					self.addClass(cssDisabled);
			}
		}
		catch(e) { $.error(e.message); };
	};
	
	//==========================================================================
	// Установить/получить значение параметра allowOld
	allowOld = function(value) 
	{ 
		try
		{
			if (value == null)
				return $(this).data(DATA.SETTINGS).allowOld;
			else
				$(this).data(DATA.SETTINGS).allowOld = value;
		}
		catch(e) { $.error(e.message); }; 
	};

	//==========================================================================
	// Установить/получить минимальную возможную дату для календаря
	methods.startDate = function(date)
	{
		try
		{
			var settings = $(this).data(DATA.SETTINGS);
			if (date == null)
			{
				return settings.startDate;
			}
			else
			{
				settings.allowOld = (date == -1);
				settings.startDate = date;
			}
		}
		catch(e) { $.error(e.message); };
	};

	//==========================================================================
	// Установить/получить максимальную возможную дату для календаря
	methods.endDate = function(date)
	{
		try
		{
			if (date == null)
				return $(this).data(DATA.SETTINGS).endDate;
			else
				$(this).data(DATA.SETTINGS).endDate  = date;
		}
		catch(e) {  $.error(e.message); };
	};

	//==========================================================================
	// Установить/получить выбранную дату
	methods.selectedDate = function(date)
	{
		try
		{
			// Ссылка на самого себя
			var self = $(this);
			// Параметры элемента
			var settings = self.data(DATA.SETTINGS);
			// Значение для вывода
			var html = htmlEmpty;
			
			if (date == null)
			{
				return settings.selectedDate;
			}
			else
			{
				// Новая выбранная дата
				settings.selectedDate = date;
				// Получить строковое предсталвление даты
				if (date != -1)
					html = date.getDate() + ' ' + getMonthName(date.getMonth(), settings.language) + ' ' + date.getFullYear();
				// Обновить поле вывода
				self.find('.' + getClassOut()).html(html);
				// Вызвать пользовательский обработчик изменения значения
				if (typeof settings.onChange == 'function')
					settings.onChange.call(self, date, settings.onChange.data);
			}
		}
		catch(e) { $.error(e.message); };
	};
	
	//==========================================================================
	// Установка обработчика события изменения значения
	methods.setOnChange = function(data, callback) 
	{
		try
		{
			$(this).data(DATA.SETTINGS).onChange = 
			{
				callback: callback,
				data: data
			};
		}
		catch(e) { $.error(e.message); };
	};
	
	//==========================================================================
	// Получение уникального имени элемента
	methods.name = function() 
	{ 
		try
		{
			// Получить уникальное имя, заданное пользователем
			return $(this).data(DATA.SETTINGS).id.replace(cssPrefix + '_', '');
		}
		catch(e) { $.error(e.message); }; 
	};

	//==========================================================================
	// Отрисовка календаря
	methods.render = function()
	{
		// Элемент отображения
		var target = $(this);
		// Настройки
		var settings = target.data(DATA.SETTINGS);

		// Получить идентификатор календаря
		var id = settings.id;

		// Минимальная возможная дата периода
		var startDate = settings.startDate;
		if(settings.startDate == -1)
		{
			startDate = new Date();
			startDate.setDate(1);
		}
		startDate.setHours(0, 0, 0, 0);
		var startTime = startDate.getTime();

		// Максимальная возможная дата периода
		var endDate = new Date(0);
		if(settings.endDate != -1)
		{
			endDate = new Date(settings.endDate);
			if((/^\d+$/).test(settings.endDate))
			{
				endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + settings.endDate);
			}
		}
		endDate.setHours(0, 0, 0, 0);
		var endTime = endDate.getTime();

		// Текущая выбранная дата
		var selectedDate = new Date(0);
		if(settings.selectedDate != -1)
		{
			selectedDate = new Date(settings.selectedDate);
			if((/^\d+$/).test(settings.selectedDate))
			{
				selectedDate = new Date(startDate);
				selectedDate.setDate(selectedDate.getDate() + settings.selectedDate);
			}
		}
		selectedDate.setHours(0, 0, 0, 0);
		var selectedTime = selectedDate.getTime();

		// Текущая дата для отображения
		var theDate = target.data(DATA.DATE);
			theDate = (theDate == -1 || typeof theDate == 'undefined') ? startDate : theDate;

		// Вычисление первого и последнего числа месяца		
		var firstDate = new Date(theDate); firstDate.setDate(1);
		var firstTime = firstDate.getTime();
		var lastDate = new Date(firstDate); lastDate.setMonth(lastDate.getMonth() + 1); lastDate.setDate(0);
		var lastTime = lastDate.getTime();
		
		// День недели 
		var lastDay = lastDate.getDate();

		// Вычислить последний день в предыдущем месяце
		var prevDateLastDay = new Date(firstDate);
		prevDateLastDay.setDate(0);
		prevDateLastDay = prevDateLastDay.getDate();

		// Сохранить текущую дату
		target.data(DATA.DATE, theDate);

		// Таблица дней месяца
		var days = '';
		for(var y = 0, i = 0; y < 6; y++)
		{
			var row = "";
			for(var x = 0; x < 7; x++, i++)
			{
				var p = ((prevDateLastDay - firstDate.getDay()) + i + 1);
				var n = p - prevDateLastDay;
				var c = (x == 0) ? 'sun' : ((x == 6) ? 'sat' : 'day');

				// Дни месяца
				if(n >= 1 && n <= lastDay)
				{
					// Сегодня
					var today = new Date(); 
					today.setHours(0, 0, 0, 0);
					
					// Текущая дата
					var date = new Date(theDate); 
					date.setHours(0, 0, 0, 0); 
					date.setDate(n);
					
					// Время
					var dateTime = date.getTime();

					// Сегодня
					c = (today.getTime() == dateTime) ? 'today' : c;

					// До минимальной даты
					if (!settings.allowOld)
						c = (dateTime < startTime) ? 'noday' : c;

					// После максимальной даты
					if (settings.endDate != -1)
						c = (dateTime > endTime) ? 'noday' : c;

					// Выбранная дата
					if (settings.selectedDate != -1)
						c = (dateTime == selectedTime) ? 'selected' : c;
				}
				else
				{
					c = 'noday'; 
					n = (n <= 0) ? p : ((p - lastDay) - prevDateLastDay);
				}

				// Create the cell
				row += '<td class="' + cssPrefix + '_days ' + c + " **_" + c + '"><div class="' + c + '">' + n + '</div></td>';
			}

			// Create the row
			days += '<tr class="days">' + row + '</tr>';
		}

		// Признак отображдения стрелок ВПЕРЕД-НАЗАД
		var showP = ((startTime < firstTime) || settings.allowOld);
		var showN = ((lastTime < endTime) || (endTime < startTime));

		// HTML-код для отрисовкикалендаря
		var titleMonthYear = getMonthName(theDate.getMonth(), settings.language) + " " + theDate.getFullYear();
		var html =
			'<div class="**">'+
				'<table>'+
					'<tr>'+ 
						('<td class="**_prevnext prev">' + (showP ? htmlPrev : '') + '</td>') +
						'<td class="**_monyear" colspan="5">{MY}</td>' +
						('<td class="**_prevnext next">' + (showN ? htmlNext : '') + '</td>') +
					'</tr>' +
					'<tr class="**_dow">' + 
						'<td>' + getDayOfWeekName(0, settings.language) + '</td>' +
						'<td>' + getDayOfWeekName(1, settings.language) + '</td>' + 
						'<td>' + getDayOfWeekName(2, settings.language) + '</td>' + 
						'<td>' + getDayOfWeekName(3, settings.language) + '</td>' + 
						'<td>' + getDayOfWeekName(4, settings.language) + '</td>' + 
						'<td>' + getDayOfWeekName(5, settings.language) + '</td>' + 
						'<td>' + getDayOfWeekName(6, settings.language) + '</td>' +
					'</tr>' + days + 
				'</table>' +
			'</div>';

		// Заменить ** на 'dp_' + cssCalendar, и вставить заголовок месяца 
		html = (html.replace(/\*{2}/gi, getClassCalendar())).replace(/\{MY\}/gi, titleMonthYear);

		// Добавить HTML-код календаря и отобразить его
		var calendar = $('#' + id);
		if (calendar.children('.' + getClassCalendar()).length > 0)
			calendar.children('.' + getClassCalendar()).remove();
		calendar.append(html).children('.' + getClassCalendar()).css({'top': '0px'}).show();

		// Добавить css для идентификации спрятанного календаря
		target.addClass(getClassOpened());
		
		// Наведение на элементы ВПЕРЕД/НАЗАД
		calendar.find('.' + getClassCalendar() + '_prevnext').hover(function() {
				if ($(this).html() != '')
					$(this).addClass(getClassCalendar() + '_prevnext_hover');
			}, function() {
				$(this).removeClass(getClassCalendar() + '_prevnext_hover');
			}
		);

		// Нажатие на элементы ВПЕРЕД-НАЗАД
		$('[class*=_prevnext]', calendar).click(function(e) {
			// Останавить "всплытие" вызова события к родительским элементам
			e.stopPropagation();

			// Если переход поддерживается, то
			if($(this).html() != '')
			{
				// Определить направление перехода
				var offset = $(this).hasClass('prev') ? -1 : 1;
				var newDate = new Date(firstDate);
					newDate.setMonth(theDate.getMonth() + offset);

				// Установить новую дату отображения
				target.data(DATA.DATE, newDate);
				// Перерисовать календарь
				methods.render.apply(target);
			}
		});

		// Обработчики для чисел месяца
		$('tr.days td:not(.noday, .selected)', calendar)
			// Наведение на число месяца
			.hover(function(e) {
					var css = getClassCalendar() + '_' + $(this).children('div').attr('class');
					$(this).removeClass(css).addClass(css + '_hover');
				}, function(e) {
					if(!$(this).hasClass('selected'))
					{
						var css = getClassCalendar() + '_' + $(this).children('div').attr('class');
						$(this).removeClass(css + '_hover').addClass(css);
					}
				}
			)
			// Нажатие на число месяца
			.click(function(e) {
				// Останавить "всплытие" вызова события к родительским элементам
				e.stopPropagation();
				
				// Текущий номер числа месяца
				var dayNumber = $(this).children('div').html();
				// Новая дата
				var newDate = new Date(theDate); 
				
				// Установить текущее число месяца
				newDate.setDate(dayNumber);
				// Обновить значение даты в кеше
				target.data(DATA.DATE, newDate);
				
				// Сохранить выбранную дату в настройках элемента 
				methods.selectedDate.call(target, newDate);

				// Спрятать календарь
				methods.hide.apply(target);
			});
	};

	//==========================================================================
	// Функция вызова плагина
	$.fn.datePicker = function(method)
	{
		if (methods[method]) 
		{
			// Вызвать метод созданного объекта, с аргументами пользователя
			if ($(this).is('div.dp_input'))
				return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); 
		}
		else if (typeof method === 'object' || !method) 
		{
			// Вызвать конструктор объекта
			// Плагин работает тока с input.datePicker[type='hidden']
			if ($(this).is('input.datePicker[type="hidden"]'))
				return methods.init.apply(this, arguments); 
		}
	};
})(jQuery);