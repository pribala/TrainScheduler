/**
 * Copyright (c) 2016 MrMadClown
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function ( $ ) {

	/**
	 * https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
	 */
	if (!Array.prototype.includes) {
		Array.prototype.includes = function(searchElement /*, fromIndex*/) {
			'use strict';
			if (this == null) {
				throw new TypeError("Array.prototype.includes called on null or undefined");
			}

			var O = Object(this);
			var len = parseInt(O.length, 10) || 0;
			if (len === 0) {
				return false;
			}
			var n = parseInt(arguments[1], 10) || 0;
			var k;
			if (n >= 0) {
				k = n;
			} else {
				k = len + n;
				if (k < 0) {k = 0;}
			}
			var currentElement;
			while (k < len) {
				currentElement = O[k];
				if (searchElement === currentElement ||
					(searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
					return true;
				}
				k++;
			}
			return false;
		};
	}

	$.validator = function ( element, options ) {

		var defaults = {
			elementsToValidate: [
				"input",
				"select",
				"textarea"
			],
			onlyValidateOnSubmit: false,
			errorClass: "has-error",
			formRowSelector: ".form-group",
			debug: true
		};

		var _validators = [
			"required",
			"length",
			"callback",
			"equals",
			"or",
			"pattern"
		];
		var _hasError = false;
		var plugin = this;
		var $el = $( element );
		var $inputs;

		plugin.settings = {};

		plugin.init = function () {
			plugin.settings = $.extend( {}, defaults, options );
			$inputs = $el.find( plugin.settings.elementsToValidate.join( "," ) );
			if ( plugin.settings.debug ) {
				_validateSetup();
			}

			_bindEvents();
		};

		plugin.destroy = function () {
			$el.off( "submit" );
			if ( !plugin.settings.onlyValidateOnSubmit ) {
				$inputs.off( "blur" );
			}
		};

		var _validateSetup = function () {
			$inputs.each( function () {
				var $input = $( this );
				$.each( Object.keys( $input.data() ), function ( index, validator ) {
					if ( _validators.includes( validator ) ) {
						if ( _getParentFromInput( $input ).find( "[class*=" + validator + "]" ).length == 0 ) {
							console.warn( $input, "Does not have a Error Message for the " + validator + " Validator!" );
						}
						if(
							validator == "callback"
							&& typeof window[ $input.data( "callback" )] != "function"
						) {
							console.warn( "The function " + validator +" used as callback on " + $input + " is not defined!" );
						}
					}
				} );
			} );
		};

		var _bindEvents = function () {
			$el.on( "submit", function ( event ) {
				_validateForm( event );
			} );
			if ( !plugin.settings.onlyValidateOnSubmit ) {
				$inputs.on( "blur", function () {
					_validateInput( $( this ) );
				} );
			}
		};

		var _validateForm = function ( event ) {
			_hasError = false;
			$inputs.each( function () {
				_validateInput( $( this ) );
			} );

			if ( _hasError ) {
				event.preventDefault();
			}
		};

		var _validateInput = function ( $input ) {
			_handleRequired( $input );
			_handleLength( $input );
			_handlePattern( $input );
			_handleCallBack( $input );
			_handleOr( $input );
			_handleEquals( $input );
		};

		var _handleRequired = function ( $input ) {
			if ( $input.data( "required" ) ) {
				_handle( $input, _isNotEmpty, "required" );
			}
		};

		var _handleLength = function ( $input ) {
			if ( $input.data( "length" ) && _isNotEmpty( $input ) ) {
				_handle( $input, _validateLength, "length" );
			}
		};

		var _validateLength = function ( $input ) {
			return $input.val().length >= parseInt( $input.data( "length" ) )
		};

		var _handlePattern = function ( $input ) {
			if ( $input.data( "pattern" ) && _isNotEmpty( $input ) ) {
				_handle( $input, _validatePattern, "pattern" );
			}
		};

		var _validatePattern = function ( $input ) {
			return (new RegExp( $input.data( "pattern" ) )).test( $input.val() );
		};

		var _handleCallBack = function ( $input ) {
			if ( $input.data( "callback" ) && _isNotEmpty( $input ) ) {
				var functionName = $input.data( "callback" );
				_handle( $input, window[functionName], "callback" );
			}
		};

		var _handleOr = function ( $input ) {
			if ( $input.data( "or" ) ) {
				var or = $input.data( "or" );
				var $orInput = $el.find( "[name=" + or + "]" );
				_handleDouble( $input, $orInput, _validateOr, "or" );
			}
		};

		var _validateOr = function ( $input, $secondInput ) {
			return _isNotEmpty( $input ) || _isNotEmpty( $secondInput );
		};

		var _handleEquals = function ( $input ) {
			if ( $input.data( "equals" ) ) {
				var equals = $input.data( "equals" );
				var $equalsInput = $el.find( "[name=" + equals + "]" );
				_handleDouble( $input, $equalsInput, _validateEquals, "equals" );
			}
		};

		var _validateEquals = function ( $input, $secondInput ) {
			return $input.val() === $secondInput.val();
		};

		var _handle = function ( $input, condition, errorType ) {
			if ( typeof condition === "function" ) {
				if ( condition( $input ) ) {
					_removeError( $input, errorType );
				}
				else {
					_hasError = true;
					_setError( $input, errorType );
				}
			}
		};

		var _handleDouble = function ( $input, $secondInput, condition, errorType ) {
			if ( typeof condition === "function" ) {
				if ( condition( $input, $secondInput ) ) {
					_removeError( $input, errorType );
					_removeError( $secondInput, errorType );
				}
				else {
					_hasError = true;
					_setError( $input, errorType );
					_setError( $secondInput, errorType );
				}
			}
		};

		var _isNotEmpty = function ( $input ) {
			return $input.val() !== "";
		};

		var _setError = function ( $input, errorType ) {
			var $parent = _getParentFromInput( $input );
			if ( !$parent.hasClass( plugin.settings.errorClass ) ) {
				$parent.addClass( plugin.settings.errorClass );
			}
			var errorClass = plugin.settings.errorClass + "--" + errorType;
			if ( !$parent.hasClass( errorClass ) ) {
				$parent.addClass( errorClass );
			}
			var errors = _getErrorsFromInput( $input );
			if ( !errors.includes( errorType ) ) {
				errors.push( errorType );
				$input.data( "errors", errors );
			}
		};

		var _removeError = function ( $input, errorType ) {
			var errors = _getErrorsFromInput( $input );
			if ( errors.includes( errorType ) ) {
				errors = errors.filter( function ( error ) {
					return error != errorType
				} );
				$input.data( "errors", errors );
			}
			_getParentFromInput( $input ).removeClass( plugin.settings.errorClass + "--" + errorType );
			if ( errors.length == 0 ) {
				_getParentFromInput( $input ).removeClass( plugin.settings.errorClass );
			}
		};

		var _getErrorsFromInput = function ( $input ) {
			var errors = $input.data( "errors" );
			if ( errors === undefined ) {
				errors = [];
			}
			return errors;
		};

		var _getParentFromInput = function ( $input ) {
			return $input.parents( plugin.settings.formRowSelector );
		};

		plugin.init();
	};

	$.fn.validator = function ( options ) {
		return this.each( function () {
			if ( undefined === $( this ).data( "plugin--validator.js" ) ) {
				var plugin = new $.validator( this, options );
				$( this ).data( "plugin--validator.js", plugin );
			}
		} );
	};
})( jQuery );
