/***********************************************************************
 * 
 *                       jquery.userSelect.js
 *                               
 * userSelect - плагин для отрисовки выпадающего спсика 
 * 
 * Зависимости:
 *    - jquery.js 
 * 
 * Параметры:
 *   1) для init
 *     - options: {
 *         max_count  : 3, // высота области выадения (в элементах),
 *         onChange   : function(value) { обработчик события изменения значения },
 *         onExpand   : function() { обработчик события выпадения },
 *         onCollapse : function() { обработчик события сворачивания }
 *       }
 * 	
 * 
 * Функциональность:
 *   - генерация HTML-кода 
 *   - получение/установка значения
 *   - получение/установка текстого значения для выпадающего элемента
 *   
 * Особенности:
 *   Плагин предназначен для замены тегов select.userSelect
 *   на теги для реалиации заданной функциональности. 
 *                                                    
 *                                  Copyright 2012-2014, ООО НПП "ЭКРА"
 ***********************************************************************/
;(function($)
{
	//==========================================================================
	// Константы 
	var cssSelect   = 'select';
	var cssPrefix   = 'us';
	var cssOpened   = 'opened';
	var cssDisabled = 'disabled';

	//==========================================================================
	// Идентификаторы записей в кеше data
	var DATA = 
	{
		SETTINGS : 'settings',
		VALUE    : 'value'
	};
	
	//==========================================================================
	// Настройки по умолчанию
	var defaults = 
	{
		// Высота области выбора (в элементах выбора, не в пикселях)
		max_count: 8
	};
	
	//==========================================================================
	// Методы плагина
	var methods = 
	{
		// Метод инициализации (Конструктор)
		init: function() { return null; },
		// Получить уникальное имя выпадающего списка
		name: function() { return null; },
		// Спрятать выпадающий список
		hide: function() { return null; },
		// Отобразить выпадающий список
		show: function(e) { return null; },
		// Получение/установка значения
		value: function(value) { return value; },
		// Получение/установка значения текста 
		text: function(index, text) { return text; },
		// Установка нового набора элементов для выбора
		values: function(values) { return null; },
		// Установка/Получение признака активности элемента
		enabled: function(value) { return null; }
	};
	
	//==========================================================================
	// Внутрення функция получения css класса элемента
	function getClassMain() { return cssPrefix + '_' + cssSelect; };
	// Внутрення функция получения css класса для значение
	function getClassValue() { return getClassMain() + '_value'; };
	// Внутрення функция получения css класса для кнопки
	function getClassButton() { return getClassMain() + '_button'; };
	// Внутрення функция получения css класса для области вывода значения
	function getClassOut() { return getClassMain() + '_out'; };
	// Внутрення функция получения css класса для выпадающего списка
	function getClassOptions() { return getClassMain() + '_options'; };
	// Внутрення функция получения css класса для элемента выпадающего списка
	function getClassOption() { return getClassMain() + '_option'; };
	// Внутрення функция получения css класса-признака отображения выпадающего 
	// списка для элемента
	function getClassOpened() { return cssPrefix + '_' + cssOpened; };
	
	//==========================================================================
	// Фнуция построения HTML-кода элементов выбора
	function htmlOptions(options)
	{
		var html = '';
		for (var i = 0; i < options.length; i++)
		{
			// К последнему элменту у нас особенные отношения :)
			var last = '';
			if (i == options.length - 1)
				last = 'last';
			
			// Добавить описание элемента
			if (typeof options[i].text == 'string')
				html += '<div class="' + getClassOption() + ' ' + last + '">' + options[i].text + '</div>';
			else
				html += '<div class="' + getClassOption() + ' ' + last + '">' + options[i] + '</div>';
		}
		return html;
	};
	
	//==========================================================================
	// Обработчики событий
	function onOptionHover()
	{
		$(this).addClass(getClassOption() + '_hover');
	};
	
	function onOptionBlur()
	{
		$(this).removeClass(getClassOption() + '_hover');
	};
	
	function onOptionClick(event)
	{
		// Останавить "всплытие" вызова события к родительским элементам
		event.stopPropagation();
		// Ссылка на userSelect
		var self = event.data.self;
		// Текущий элемент выбора
		var option = $(this);
		// Спрятать выпадающий список
		methods.hide.apply(self);
		// Установить выбранное значение
		methods.value.call(self, option.parent().find('.' + getClassOption()).index(option));
	};
	
	//==========================================================================
	// Метод инициализации (Конструктор)
	methods.init = function(options) {
		return this.each(function() {
			// Указатель на элемент
			var self = $(this);
			// Настройки элемента
			var settings = {};
			// Текущее выбранное значение
			var value = -1;
			
			// Добавить поле идентификатора элемента
			settings.id = 'id_us_' + self.attr('id');
			// Добавить поля параметров по умолчанию
			settings = $.extend(settings, defaults);
			// Добавить параметры пользователя
			if (options) settings = $.extend(settings, options);
			
			// Текущее значение
			value = self.prop('selectedIndex');
			
			// Нарисовать userSelect
			self.after(
				'<div class="' + getClassMain() + '" id="' + settings.id + '">' +
					'<div class="' + getClassValue() + '">' +
						'<div class="' + getClassMain() + '_wrapper">' + 
							'<div class="' + getClassOut() + '"></div>' +
						'</div>' +
					'</div>' +
					'<div class="' + getClassButton() + '">&#9660;</div>' +
					'<div class="us_clear"></div>' +
					'<div class="' + getClassOptions() + '">' +  
						htmlOptions(self[0].options) + 
					'</div>' +
				'</div>'
			);
			// Удалить реальный select
			self.remove();
			// Теперь self - это ссылка на userSelect
			self = $('#' + settings.id);

			// Сохранить в кеше
			self.data(DATA.SETTINGS, settings);
			// Текущее выбранное знчение
			self.data(DATA.VALUE, value);
			
			// Установить значение
			if (value != -1)
			{
				// Получить текст для отображения новго значения
				var text = methods.text.call(self, value);
				// Вывести текст
				self.find('.' + getClassOut()).html(text);
				self.find('.' + getClassValue()).attr('title', text);
				// Визуально выделить соответствующий элемент выпадающего списка
				$(self.find('.' + getClassOption()).removeClass(getClassOption() + '_selected')[value]).
					addClass(getClassOption() + '_selected');
			}

			// Обработчики, связанные с элементом выбора
			self.find('.' + getClassOption())
				.hover(onOptionHover, onOptionBlur)
				.bind('click', {self: self}, onOptionClick);
			
			// Наведения мыши на сам элемент
			self.find('.' + getClassButton() + ', .' + getClassValue()).hover(function() {
					if (!self.hasClass(cssDisabled))
						self.find('.' + getClassValue()).addClass(getClassValue() + '_hover');
				}, function() {
					if (!self.hasClass(cssDisabled))
						self.find('.' + getClassValue()).removeClass(getClassValue() + '_hover');
			});
			
			// Нажатие мыши на сам элемент
			self.click(function(e) {
				if (!$(this).hasClass(cssDisabled))
					methods.show.apply(self, [e]);
			});
			
			// Если нажать мышь в другом месте, то спрятать выпадающий список
			$(document).bind('click', function(e) {
				methods.hide.apply(self);
			});
			
			// Установить высоту отображения выпадающего списка 
			if (self.find('.' + getClassOption()).length > settings.max_count)
				self.find('.' + getClassOptions()).height(settings.max_count * 27 - 1);
		});
	};
	
	//==========================================================================
	// Отобразить выпадающий список
	methods.show = function(e)
	{
		// Ссылка на сам элемент
		var self = $(this);
		// Останавить "всплытие" вызова события к родительским элементам
		e.stopPropagation();
		// Спрятать все остальные выпадающие списки
		methods.hide.apply($('.' + getClassOpened()).not(self));
		
		// Проверить, отображается ли сейчас выпадающий список
		if (self.hasClass(getClassOpened()))
		{
			// Нужно прятать, а не отображать
			methods.hide.apply(self);
		}
		else
		{
			// Параметры элемента
			var settings = self.data(DATA.SETTINGS);
			// Добавить признак отображения выпадающего списка для элемента
			self.addClass(getClassOpened());
			// Отобразить выпадающий список
			self.find('.' + getClassOptions()).show();
			// Вызвать пользовательский обработчик отображения выпадающего списка
			if ((settings.onExpand != null) && (typeof settings.onExpand == 'function'))
				settings.onExpand.apply(self);
		}
	};
	
	//==========================================================================
	// Спрятать выпадающий список
	methods.hide = function()
	{
		try
		{
			// Ссылка на сам элемент
			var self = $(this);
			// Если выпадающий список отображается, то спрятать его
			if (self.hasClass(getClassOpened()))
			{
				// Параметры элемента
				var settings = self.data(DATA.SETTINGS);
				// Спрятать выпадающий список
				self.find('.' + getClassOptions()).hide();
				// Удалить признак отображения выпадающего ссписка для элемента
				self.removeClass(getClassOpened());
				// Вызвать пользовательский обработчик сворачивани выпадающего списка
				if ((settings.onCollapse != null) && (typeof settings.onCollapse == 'function'))
					settings.onCollapse.apply(self);
			}
		}
		catch(e) { $.error(e.message); };
	};
	
	//==========================================================================
	// Активация/Деактивация
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
	// Получение/установка значения
	methods.value = function(value)
	{
		// Ссылка на сам элемент
		var self = $(this);
		// В зависимости от value проиходит установка или возврат
		if (value == null) 
		{
			// Вернуть текущее значение
			return self.data('value');
		} 
		else 
		{
			if (!isNaN(value)) 
			{
				// Округлить значение
				value = Math.round(value);
				// Получить текст для отображения новго значения
				var text = methods.text.call(self, value);
				// Сохранить его в кеше
				self.data(DATA.VALUE, value);
				// Вывести текст
				self.find('.' + getClassOut()).html(text);
				self.find('.' + getClassValue()).attr('title', text);
				// Визуально выделить соответствующий элемент выпадающего списка
				$(self.find('.' + getClassOption()).removeClass(getClassOption() + '_selected')[value]).
					addClass(getClassOption() + '_selected');
				
				// Параметры элемента
				var settings = self.data(DATA.SETTINGS);				
				// Вызвать пользовательский обработчик
				if (settings && (settings.onChange != null) && (typeof settings.onChange == 'function'))
					settings.onChange.call(self, value);
			}
		}
	};
	
	//==========================================================================
	// Получение/установка значения текста 
	methods.text = function(index, text) 
	{
		try 
		{
			// Защита от вредных данных
			if (!isNaN(index))
			{
				// Ссылка на сам элемент
				var self = $(this);
				// Округлить значение
				index = Math.round(index);

				// В зависимости от text проиходит установка или возврат 
				if (text == null) 
				{
					// Вернуть текстовое значение элемента
					return self.find('.' + getClassOption() + ':eq(' + index + ')').html();
				} 
				else 
				{
					// Установить текстовое значение элемента
					self.find('.' + getClassOption() + ':eq(' + index + ')').html(text);
				}
			}
		}
		catch(e) { };
	};
	
	//==========================================================================
	// Получить уникальное имя выпадающего списка
	methods.name = function()
	{
		// Получить уникальное имя, заданное пользователем
		return $(this).data(DATA.SETTINGS).id.replace('id_us_', '');
	};
	
	//==========================================================================
	// Установка нового набора элементов для выбора
	methods.values = function(values)
	{
		// Ссылка на сам элемент
		var self = $(this);
		// Параметры элемента
		var settings = self.data(DATA.SETTINGS);
		// Установить новый набор
		self.find('.' + getClassOptions()).html(htmlOptions(values));
		// Установить значение по умолчанию
		methods.value.call(self, 0);
		// Обработчики, связанные с элементом выбора
		self.find('.' + getClassOption())
			.hover(onOptionHover, onOptionBlur)
			.bind('click', {self: self}, onOptionClick);
		// Установить высоту отображения выпадающего списка 
		if (self.find('.' + getClassOption()).length > settings.max_count)
			self.find('.' + getClassOptions()).height(settings.max_count * 27 - 1)
		else
			self.find('.' + getClassOptions()).height('auto');
	};
	
	//==========================================================================
	// Функция вызова плагина
	$.fn.userSelect = function(method) 
	{
		// Плагин работает тока с select
		if ($(this).is('select.userSelect') || $(this).is('div.us_select'))
		{
			if (methods[method]) 
			{ 
				// Вызвать метод созданного объекта, с аргументами пользователя
				return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); 
			}
			else if (typeof method === 'object' || !method) 
			{ 
				// Вызвать конструктор объекта
				return methods.init.apply(this, arguments); 
			}
		}
	};
})(jQuery);