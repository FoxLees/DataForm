;(function($) {
	$.fn.numberMask = function(options) 
	{
		// Определение позиции курсора в TextBox 
		function doGetCaretPosition (ctrl) 
		{
			var CaretPos = 0;
			
			// IE Support
			if (document.selection) 
			{
				ctrl.focus ();
				var Sel = document.selection.createRange();
				Sel.moveStart ('character', -ctrl.value.length);
				CaretPos = Sel.text.length;
			}
			// Firefox support
			else if (ctrl.selectionStart || ctrl.selectionStart == '0')
				CaretPos = ctrl.selectionStart;
	
			return (CaretPos);
		};
		
		var settings = 
			{
				type: 'int',
				beforePoint: 10,
				afterPoint: 2,
				defaultValueInput: 0,
				decimalMark: '.',
				pattern: ''
			},
			onKeyPress = function(e) {
				var k = e.which;
	
				if (e.ctrlKey || e.altKey || e.metaKey || k<32) 
				{
					return true;
				} 
				else if (k) 
				{
					var c = String.fromCharCode(k);
					var value = e.target.value;
					var caretPosition = doGetCaretPosition(e.target);
					value = value.substring(0, caretPosition) + c + value.substring(caretPosition);
					
					var re = null;
					if((typeof settings.pattern == "object") && (settings.pattern instanceof RegExp)) 
					{
						re = settings.pattern;
					} 
					else 
					{
						if(settings.type == 'int') 
						{
							re = new RegExp
							(
								"^-$" +
								"|^-?\\d{1," + settings.beforePoint+"}$", "ig"
							);
						} 
						else if(settings.type == 'float') 
						{
							re = new RegExp
							(
								"^-$|" +
								"^-?\\d{1," + settings.beforePoint+"}$|" + 
								"^-?\\d{1," + settings.beforePoint+"}\\" + settings.decimalMark + "\\d{0," + settings.afterPoint + "}$", "ig"
							);
						}
					}
					return	re.test(value);
				}
			},
			onKeyUp = function(e) 
			{
				var input = $(e.target);
				
				switch (e.which)
				{
					case 13:
					case 86:
						// Установить отформатированное значение  
						input.val(formattedNumber(input));
						input.focusout();
					break;
					
					case 27:
						// Установить начальное значение 
						input.val(settings.defaultValueInput);
						input.focusout();
					break;
				};
			},
			formattedNumber = function($input) 
			{
				var val = $input.val();
				if((typeof settings.pattern == "object") && (settings.pattern instanceof RegExp)) 
				{
					var re = settings.pattern;
					if(re.test(val)) 
					{
						return val;
					} 
					else 
					{
						return settings.defaultValueInput;
					}
				} 
				else 
				{
					if(settings.type == 'int') 
					{
						var re = new RegExp
						(
							"^-$|" +
							"^-?\\d{1,"+settings.beforePoint+"}$", "ig"
						);
						if(re.test(val)) 
						{
							return val;
						}
						else 
						{
							return settings.defaultValueInput;
						}
					} 
					else 
					{
						var re = new RegExp
						(
							"^-$|" +
							"^-?\\d{1," + settings.beforePoint+"}$|" + 
							"^-?\\d{1," + settings.beforePoint+"}\\" + settings.decimalMark + "\\d{0," + settings.afterPoint + "}$", "ig"
						);
						if(re.test(val)) 
						{
							return val;
						} 
						else 
						{
							return settings.defaultValueInput;
						}
					}
				}
			};
			
		// Навязать обработчики 
		this.bind('keypress', onKeyPress).bind('keyup', onKeyUp);
		
		if (options) 
			$.extend(settings, options);
		return this;
	};
})(jQuery);