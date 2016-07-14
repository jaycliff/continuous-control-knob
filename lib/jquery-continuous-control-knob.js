/*
    Copyright 2016 Jaycliff Arcilla of Eversun Software Philippines Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
/*
    DEPENDENCIES:
        jQuery library
        domxy
*/
/*global Math, Number, document, window, jQuery, module*/
/*jslint bitwise: false, unparam: true*/
/*jshint bitwise: false, unused: false*/
if (typeof Number.toInteger !== "function") {
    Number.toInteger = function toInteger(arg) {
        "use strict";
        // ToInteger conversion
        arg = Number(arg);
        return (arg !== arg) ? 0 : (arg === 0 || arg === Infinity || arg === -Infinity) ? arg : (arg > 0) ? Math.floor(arg) : Math.ceil(arg);
    };
}
if (typeof Number.isFinite !== "function") {
    Number.isFinite = function isFinite(value) {
        "use strict";
        return typeof value === "number" && isFinite(value);
    };
}
if (typeof Math.toDegrees !== "function") {
    Math.toDegrees = function toDegrees(radians) {
        "use strict";
        return (radians * 180) / Math.PI;
    };
}
if (typeof String.prototype.trim !== "function") {
    String.prototype.trim = function trim() {
        "use strict";
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}
(function (window, $, undef) {
    "use strict";
    var $document = $(document),
        $window = $(window),
        applier = (function () {
            var list = [];
            return function (func, obj, args) {
                var i, length = args.length, result;
                list.length = 0;
                for (i = 0; i < length; i += 1) {
                    list.push(args[i]);
                }
                result = func.apply(obj, list);
                list.length = 0;
                return result;
            };
        }());
    if (typeof $.fn.getX !== "function") {
        $.fn.getX = function () {
            return this.offset().left;
        };
    }
    if (typeof $.fn.getY !== "function") {
        $.fn.getY = function () {
            return this.offset().top;
        };
    }
    function decimalDigitsLength(num) {
        var string, dot_index;
        if (typeof num !== "number") {
            throw new TypeError('parameter must be a number');
        }
        string = String(num);
        dot_index = string.indexOf('.');
        if (dot_index < 0) {
            return 0;
        }
        return string.length - (dot_index + 1);
    }
    function valueByStep(value, step) {
        if (typeof step !== "number") {
            step = 1;
        }
        return +((Math.round(value / step) * step).toFixed(decimalDigitsLength(step)));
    }
    $.createContinuousControlKnob = function (options) {
        var is_options_valid = $.type(options) === 'object',
            $cck_wrap = $(document.createElement('span')),
            $cck_subwrap = $(document.createElement('span')),
            $cck_anchor = $(document.createElement('span')),
            $cck_handle = $(document.createElement('span')),
            $cck_value = $(document.createElement('span')),
            $cck_label_wrap = $(document.createElement('span')),
            $cck_min_label = $(document.createElement('span')),
            $cck_max_label = $(document.createElement('span')),
            $cck_bands_wrap = $(document.createElement('span')),
            $cck_decal,
            $cck_band,
            $hot_swap_dummy = $(document.createElement('span')),
            hasOwnProperty = Object.prototype.hasOwnProperty,
            angle = 0,
            minangle = 0,
            maxangle = 270,
            handle_angle = 0,
            band_list = [],
            $item,
            number_of_bands = (is_options_valid && hasOwnProperty.call(options, 'numberOfBands')) ? Math.abs(parseInt(options.numberOfBands, 10)) - 1 : 30,
            degree_increment = maxangle / number_of_bands,
            decal_list = [],
            number_of_decal_pairs = (is_options_valid && hasOwnProperty.call(options, 'numberOfDecalPairs')) ? Math.abs(parseInt(options.numberOfDecalPairs, 10)) - 1 : 12,
            degrees,
            t,
            tlen,
            parts_list,
            refreshControls,
            trigger_param_list = [],
            $_proto = $.fn,
            default_tab_index = (is_options_valid && Number.toInteger(options.tabIndex)) || 0,
            tab_index = default_tab_index,
            active = false,
            disabled = true,
            transition_class_added = false,
            properties,
            prev_input_value,
            prev_change_value,
            continuous_control_knob_object,
            $continuous_control_knob_object;
        properties = (function () {
            var obj = {},
                temp,
                user_set = false,
                def_step = 1,
                def_min = 0,
                def_max = 100,
                def_value,
                def_angle,
                do_median_value = true,
                step = def_step,
                min = def_min,
                max = def_max,
                value;
            if (is_options_valid) {
                if (hasOwnProperty.call(options, 'step')) {
                    temp = Number(options.step) || 1;
                    if (temp < 0) {
                        temp = 1;
                    }
                    if (Number.isFinite(temp)) {
                        def_step = temp;
                        step = def_step;
                    }
                }
                if (hasOwnProperty.call(options, 'max')) {
                    temp = Number(options.max) || 0;
                    if (Number.isFinite(temp)) {
                        def_max = temp;
                        max = def_max;
                    }
                }
                if (hasOwnProperty.call(options, 'min')) {
                    temp = Number(options.min) || 0;
                    if (Number.isFinite(temp)) {
                        def_min = temp;
                        min = def_min;
                    }
                }
                if (hasOwnProperty.call(options, 'value')) {
                    temp = Number(options.value) || 0;
                    if (Number.isFinite(temp)) {
                        def_value = temp;
                        value = def_value;
                        do_median_value = false;
                    }
                }
            }
            if (do_median_value) {
                def_value = (min >= max) ? min : (min + ((max - min) / 2));
                value = def_value;
            }
            def_angle = ((value - min) / (max - min)) * maxangle;
            angle = def_angle;
            Object.defineProperties(obj, {
                "max": {
                    get: function () {
                        var c_max = max;
                        if ((c_max < min) && (min < 100)) {
                            c_max = 100;
                        }
                        return c_max;
                    },
                    set: function (val) {
                        max = val;
                    }
                },
                "min": {
                    get: function () {
                        return min;
                    },
                    set: function (val) {
                        min = val;
                    }
                },
                "value": {
                    get: function () {
                        var c_max = this.max, val = value;
                        if (val > c_max) {
                            val = c_max;
                        }
                        if (val < min) {
                            val = min;
                        }
                        return (user_set) ? val : valueByStep(val, step);
                    },
                    set: function (val) {
                        value = val;
                        user_set = true;
                    }
                },
                "step": {
                    get: function () {
                        return step;
                    },
                    set: function (val) {
                        step = val;
                    }
                }
            });
            obj.reset = function () {
                max = def_max;
                min = def_min;
                value = def_value;
                angle = def_angle;
            };
            return obj;
        }());
        prev_input_value = properties.value;
        prev_change_value = prev_input_value;
        // tlen is used as increment here...
        for (t = 0, tlen = 180 / number_of_decal_pairs; t < number_of_decal_pairs; t += 1) {
            $item = $(document.createElement('span')).prop('class', 'cck-decal').css('transform', 'rotate(' + (t * tlen) + 'deg)');
            $item.data('$self', $item);
            decal_list.push($item[0]);
        }
        $cck_decal = $(decal_list);
        for (t = 0, tlen = number_of_bands, degrees = 0; t <= tlen; t += 1) {
            if (t > 0) {
                degrees += degree_increment;
            }
            $item = $(document.createElement('span')).css('transform', 'rotate(' + (degrees - 45) + 'deg)');
            $item.data('$self', $item);
            band_list.push($item[0]);
        }
        $cck_band = $(band_list);
        parts_list = [$cck_wrap, $cck_subwrap, $cck_anchor, $cck_handle, $cck_decal, $cck_value, $cck_label_wrap, $cck_min_label, $cck_max_label, $cck_bands_wrap, $cck_band];
        function displayBands(show) {
            if (arguments.length > 0) {
                $cck_bands_wrap.toggle(!!show);
                return continuous_control_knob_object;
            }
            return $cck_bands_wrap.is(':visible');
        }
        function displayLabels(show) {
            if (arguments.length > 0) {
                show = !!show;
                $cck_label_wrap.toggle(show);
                return continuous_control_knob_object;
            }
            return $cck_label_wrap.is(':visible');
        }
        function displayValue(show) {
            if (arguments.length > 0) {
                $cck_value.toggle(!!show);
                return continuous_control_knob_object;
            }
            return $cck_value.is(':visible');
        }
        function initializeParts() {
            $cck_wrap.addClass('continuous-control-knob').addClass('cck-wrap');
            $cck_subwrap.addClass('cck-subwrap');
            $cck_anchor.addClass('cck-anchor');
            $cck_handle.addClass('cck-handle');
            $cck_value.addClass('cck-value').text(properties.value.toFixed(2));
            $cck_label_wrap.addClass('cck-label-wrap');
            $cck_min_label.addClass('cck-min-label').text('MIN');
            $cck_max_label.addClass('cck-max-label').text('MAX');
            $cck_bands_wrap.addClass('cck-bands-wrap');
            $cck_band.addClass('cck-band');
            // Connect the parts
            $cck_wrap
                .append($cck_subwrap)
                .attr('tabindex', tab_index);
            $cck_subwrap
                .append($cck_bands_wrap)
                .append($cck_label_wrap)
                .append($cck_anchor);
            $cck_label_wrap
                .append($cck_min_label)
                .append($cck_max_label);
            $cck_anchor
                .append($cck_handle)
                .append($cck_value);
            $cck_handle.append($cck_decal);
            $cck_bands_wrap.append($cck_band);
            if (is_options_valid) {
                if (hasOwnProperty.call(options, 'showBands')) {
                    displayBands(options.showBands);
                }
                if (hasOwnProperty.call(options, 'showLabels')) {
                    displayLabels(options.showLabels);
                }
                if (hasOwnProperty.call(options, 'showValue')) {
                    displayValue(options.showValue);
                }
                if (hasOwnProperty.call(options, 'width')) {
                    $cck_wrap.css('width', options.width);
                }
                if (hasOwnProperty.call(options, 'height')) {
                    $cck_wrap.css('height', options.height);
                }
            }
        }
        initializeParts();
        // Some utilities
        function removeTransitionClass() {
            //console.log('removeTransitionClass');
            $cck_subwrap.removeClass('cck-transition');
            $cck_handle.off('transitionend', removeTransitionClass);
            transition_class_added = false;
        }
        function addTransitionClass() {
            //console.log('addTransitionClass');
            //$cck_subwrap
            $cck_subwrap.addClass('cck-transition');
            $cck_handle.on('transitionend', removeTransitionClass);
            transition_class_added = true;
        }
        // Create the jQuery-fied control knob object (http://api.jquery.com/jQuery/#working-with-plain-objects)
        // Updating the handle rotation is excluded when updating the value, min, and max since it's not necessary (unlike the regular control knob)
        $continuous_control_knob_object = $({
            tabIndex: function tabIndex(index) {
                if (arguments.length > 0) {
                    $cck_wrap.attr('tabindex', Number.toInteger(index));
                    return continuous_control_knob_object;
                }
                return tab_index;
            },
            step: function (val) {
                if (arguments.length > 0) {
                    val = Number(val) || 1;
                    if (val < 0) {
                        val = 1;
                    }
                    if (Number.isFinite(val)) {
                        properties.step = val;
                    }
                    return continuous_control_knob_object;
                }
                return properties.step;
            },
            min: function (val) {
                var max_sub, min_sub, value_sub, rate;
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (Number.isFinite(val)) {
                        properties.min = val;
                        min_sub = val;
                        max_sub = properties.max;
                        value_sub = properties.value;
                        rate = (value_sub - min_sub) / (max_sub - min_sub);
                        angle = rate * maxangle;
                        refreshControls();
                    }
                    return continuous_control_knob_object;
                }
                return properties.min;
            },
            max: function (val) {
                var max_sub, min_sub, value_sub, rate;
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (Number.isFinite(val)) {
                        properties.max = val;
                        max_sub = val;
                        min_sub = properties.min;
                        value_sub = properties.value;
                        rate = (value_sub - min_sub) / (max_sub - min_sub);
                        angle = rate * maxangle;
                        refreshControls();
                    }
                    return continuous_control_knob_object;
                }
                return properties.max;
            },
            val: function val(user_val) {
                var max_sub, min_sub, rate;
                if (arguments.length > 0) {
                    max_sub = properties.max;
                    min_sub = properties.min;
                    user_val = valueByStep(Number(user_val) || 0, properties.step);
                    if (user_val > max_sub) {
                        user_val = max_sub;
                    }
                    if (user_val < min_sub) {
                        user_val = min_sub;
                    }
                    properties.value = user_val;
                    prev_input_value = user_val;
                    prev_change_value = user_val;
                    rate = (user_val - min_sub) / (max_sub - min_sub);
                    angle = rate * maxangle;
                    refreshControls();
                    return continuous_control_knob_object;
                }
                return properties.value;
            },
            displayLabels: displayLabels,
            displayBands: displayBands,
            displayValue: displayValue,
            attachTo: function attachTo(arg) {
                $cck_wrap.appendTo(arg);
                removeTransitionClass();
                refreshControls();
                return continuous_control_knob_object;
            },
            switchTo: function switchTo(arg) {
                var $target;
                if (arg instanceof $) {
                    $target = arg;
                } else {
                    $target = $(arg);
                }
                $cck_wrap.data('cck:swapped-element', $target.replaceWith($cck_wrap));
                removeTransitionClass();
                refreshControls();
                return continuous_control_knob_object;
            },
            getElement: function getElement() {
                return $cck_wrap;
            }
        });
        continuous_control_knob_object = $continuous_control_knob_object[0];
        Object.defineProperty(continuous_control_knob_object, 'value', {
            get: function () {
                return properties.value;
            },
            set: function (val) {
                var max_sub = properties.max, min_sub = properties.min, rate;
                val = valueByStep(Number(val) || 0, properties.step);
                if (val > max_sub) {
                    val = max_sub;
                }
                if (val < min_sub) {
                    val = min_sub;
                }
                properties.value = val;
                prev_input_value = val;
                prev_change_value = val;
                rate = (val - min_sub) / (max_sub - min_sub);
                angle = rate * maxangle;
                refreshControls();
            }
        });
        Object.defineProperty(continuous_control_knob_object, 'step', {
            get: function () {
                return properties.step;
            },
            set: function (val) {
                properties.step = val;
            }
        });
        // Event-handling setup
        (function () {
            var knob_center = {
                    getX: function getX() {
                        return $cck_anchor.getX() + ($cck_anchor.outerWidth() / 2);
                    },
                    getY: function getY() {
                        return $cck_anchor.getY() + ($cck_anchor.outerHeight() / 2);
                    }
                },
                angle_additive = 0,
                radian_diff = 0,
                prev_radians,
                max_radians = (360 * Math.PI) / 180,
                css_options = {
                    '-moz-transform': 'rotate(0deg)',
                    '-webkit-transform': 'rotate(0deg)',
                    '-o-transform': 'rotate(0deg)',
                    '-ms-transform': 'rotate(0deg)',
                    'transform': 'rotate(0deg)'
                },
                cckWrapMetaControlHandler,
                ck_do_not_trigger_map = {},
                ck_wrap_do_not_trigger_map = {},
                prevX,
                prevY;
            Object.defineProperties(knob_center, {
                'x': {
                    get: function () {
                        return $cck_anchor.getX() + ($cck_anchor.outerWidth() / 2);
                    }
                },
                'y': {
                    get: function () {
                        return $cck_anchor.getY() + ($cck_anchor.outerHeight() / 2);
                    }
                }
            });
            // Updates the knob UI
            refreshControls = function refresh(animate) {
                var active_bands, k, len, key, rotate;
                rotate = 'rotate(' + handle_angle + 'deg)';
                // rotate knob
                for (key in css_options) {
                    if (hasOwnProperty.call(css_options, key)) {
                        css_options[key] = rotate;
                    }
                }
                if (!!animate && (disabled === false) && (transition_class_added === false)) {
                    addTransitionClass();
                }
                $cck_handle.css(css_options);
                active_bands = (Math.floor(angle / degree_increment) + 1);
                //console.log(degree_increment);
                $cck_value.text(properties.value.toFixed(2));
                // highlight bands
                $cck_band.removeClass('active');
                for (k = 0, len = active_bands; k < len; k += 1) {
                    $cck_band[k].className += ' active';
                    //$cck_band[k].classList.add('active');
                }
            };
            // getDistance may be used to limit the active zone in the control knob handle
            /*
            function getDistance(x1, y1, x2, y2) {
                return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            }
            */
            function getRadians(mouse_x, mouse_y) {
                var rad = Math.atan2(knob_center.y - mouse_y, mouse_x - knob_center.x);
                if (rad < 0) {
                    rad = max_radians + rad;
                }
                return rad;
            }
            function inputEvent(rate) {
                var max_sub = properties.max, min_sub = properties.min, calculated_value;
                if (max_sub >= min_sub) {
                    prev_input_value = properties.value;
                    calculated_value = min_sub + (rate * (max_sub - min_sub));
                    calculated_value = valueByStep(calculated_value, properties.step);
                    if (disabled === false) {
                        if (calculated_value !== prev_input_value) {
                            properties.value = calculated_value;
                            trigger_param_list.push(calculated_value);
                            $continuous_control_knob_object.triggerHandler('input', trigger_param_list);
                            trigger_param_list.length = 0;
                        }
                    }
                }
            }
            function calculateAngleAndRate(mode, direction) {
                var rate, min_sub, step_sub;
                switch (mode) {
                case 'indirect':
                    switch (direction) {
                    case 'up':
                        step_sub = properties.step;
                        trigger_param_list.push(step_sub);
                        $continuous_control_knob_object.triggerHandler('increment', trigger_param_list);
                        trigger_param_list.length = 0;
                        handle_angle = handle_angle + (maxangle * (step_sub / properties.max));
                        min_sub = properties.min;
                        rate = (((properties.value + step_sub) - min_sub) / (properties.max - min_sub));
                        //console.log(rate);
                        if (rate > 1) {
                            rate = 1;
                        }
                        angle = rate * maxangle;
                        inputEvent(rate);
                        break;
                    case 'down':
                        step_sub = properties.step;
                        trigger_param_list.push(step_sub);
                        $continuous_control_knob_object.triggerHandler('decrement', trigger_param_list);
                        trigger_param_list.length = 0;
                        handle_angle = handle_angle - (maxangle * (step_sub / properties.max));
                        min_sub = properties.min;
                        rate = (((properties.value - step_sub) - min_sub) / (properties.max - min_sub));
                        //console.log(rate);
                        if (rate < 0) {
                            rate = 0;
                        }
                        angle = rate * maxangle;
                        inputEvent(rate);
                        break;
                    }
                    break;
                case 'direct':
                    step_sub = properties.step;
                    if (angle_additive > 0) {
                        trigger_param_list.push(step_sub);
                        $continuous_control_knob_object.triggerHandler('increment', trigger_param_list);
                        trigger_param_list.length = 0;
                    } else if (angle_additive < 0) {
                        trigger_param_list.push(step_sub);
                        $continuous_control_knob_object.triggerHandler('decrement', trigger_param_list);
                        trigger_param_list.length = 0;
                    }
                    handle_angle = handle_angle + angle_additive;
                    if (handle_angle >= 360) {
                        handle_angle = handle_angle - 360;
                    } else if (handle_angle < 0) {
                        handle_angle = 360 + handle_angle;
                    }
                    angle = angle + angle_additive;
                    if (angle > maxangle) {
                        angle = maxangle;
                    }
                    if (angle < minangle) {
                        angle = minangle;
                    }
                    // update % value in text
                    rate = (angle / maxangle);
                    inputEvent(rate);
                    break;
                }
            }
            function docWinEventHandler() {
                active = false;
                if (disabled === false) {
                    changeEvent();
                }
                angle_additive = 0;
                radian_diff = 0;
                $cck_wrap.removeClass('active');
                $document.off('mousemove touchmove mouseup touchend', documentEventHandler);
                $window.off('blur', docWinEventHandler);
            }
            function changeEvent() {
                var value_sub = properties.value;
                trigger_param_list.push(value_sub);
                // 'seek' event is like a forced-change event
                $continuous_control_knob_object.triggerHandler('seek', trigger_param_list);
                if (prev_change_value !== value_sub) {
                    $continuous_control_knob_object.triggerHandler('change', trigger_param_list);
                    prev_change_value = value_sub;
                }
                trigger_param_list.length = 0;
            }
            /*
                The nowX-nowY-prevX-prevY tandem is a hack for browsers with stupid mousemove event implementation (Chrome, I'm looking at you!).
                What is this stupidity you're talking about?
                    Some browsers fire a single mousemove event of an element everytime a mousedown event of that same element fires.
                LINK(S):
                    http://stackoverflow.com/questions/24670598/why-does-chrome-raise-a-mousemove-on-mousedown
            */
            function documentEventHandler(event) {
                var nowX, nowY, now_radians;
                event.preventDefault();
                switch (event.type) {
                case 'touchmove':
                    event.pageX = event.originalEvent.touches[0].pageX;
                    event.pageY = event.originalEvent.touches[0].pageY;
                    /* falls through */
                case 'mousemove':
                    nowX = event.pageX;
                    nowY = event.pageY;
                    if (prevX === nowX && prevY === nowY) {
                        //console.log('faux mousemove');
                        return;
                    }
                    now_radians = getRadians(nowX, nowY);
                    radian_diff = prev_radians - now_radians;
                    //console.log(radian_diff);
                    if (radian_diff < 0) {
                        if (Math.abs(radian_diff) > max_radians / 2) {
                            radian_diff += max_radians;
                            //console.log('POSITIVE COMPENSATION');
                        }
                    } else if (radian_diff > 0) {
                        if (radian_diff > max_radians / 2) {
                            radian_diff -= max_radians;
                            //console.log('NEGATIVE COMPENSATION');
                        }
                    }
                    angle_additive = Math.toDegrees(radian_diff);
                    calculateAngleAndRate('direct');
                    refreshControls();
                    prev_radians = now_radians;
                    prevX = nowX;
                    prevY = nowY;
                    break;
                case 'touchend':
                    /* falls through */
                case 'mouseup':
                    docWinEventHandler();
                    break;
                }
            }
            function containsTarget(target, node) {
                var k, len, children;
                if (target === node) {
                    return true;
                }
                children = node.children;
                len = children.length;
                if (len > 0) {
                    for (k = 0; k < len; k += 1) {
                        if (containsTarget(target, children[k])) {
                            return true;
                        }
                    }
                }
                return false;
            }
            cckWrapMetaControlHandler = (function () {
                var is_default_prevented = false, ck_anchor = $cck_anchor[0];
                function helper(event) {
                    is_default_prevented = event.isDefaultPrevented();
                }
                return function cckWrapMetaControlHandler(event) {
                    var event_type = event.type;
                    // trigger's extra parameters won't work with focus and blur events. See https://github.com/jquery/jquery/issues/1741
                    if (!ck_do_not_trigger_map[event_type]) {
                        ck_wrap_do_not_trigger_map[event_type] = true;
                        $continuous_control_knob_object.one(event_type, helper);
                        $continuous_control_knob_object.triggerHandler(event_type);
                        ck_wrap_do_not_trigger_map[event_type] = false;
                    }
                    if (is_default_prevented) {
                        // prevent event default behaviour and propagation
                        event.stopImmediatePropagation();
                        return false;
                    }
                    switch (event_type) {
                    case 'touchstart':
                        event.pageX = event.originalEvent.touches[0].pageX;
                        event.pageY = event.originalEvent.touches[0].pageY;
                        /* falls through */
                    case 'mousedown':
                        event.preventDefault();
                        //console.log(event.target);
                        if (containsTarget(event.target, ck_anchor)) {
                            if (event.originalEvent === undef || event.which === 3) {
                                return undef;
                            }
                            active = true;
                            prevX = event.pageX;
                            prevY = event.pageY;
                            prev_radians = getRadians(prevX, prevY);
                            $cck_wrap.trigger('focus').addClass('active');
                            $document.on('mousemove touchmove mouseup touchend', documentEventHandler);
                            $window.on('blur', docWinEventHandler);
                        }
                        break;
                    case 'DOMMouseScroll':
                        if (containsTarget(event.target, ck_anchor)) {
                            if (event.originalEvent) {
                                if (event.originalEvent.detail > 0) {
                                    calculateAngleAndRate('indirect', 'down');
                                } else {
                                    calculateAngleAndRate('indirect', 'up');
                                }
                                refreshControls(true);
                                changeEvent();
                            }
                        }
                        break;
                    case 'mousewheel':
                        if (containsTarget(event.target, ck_anchor)) {
                            if (event.originalEvent) {
                                if (event.originalEvent.wheelDelta < 0) {
                                    calculateAngleAndRate('indirect', 'down');
                                } else {
                                    calculateAngleAndRate('indirect', 'up');
                                }
                                refreshControls(true);
                                changeEvent();
                            }
                        }
                        break;
                    case 'keydown':
                        //console.log(event.which);
                        // Do not call event.preventDefault, else the tab function won't work!
                        switch (event.which) {
                        case 8: // Backspace key
                        /* falls through */
                        case 36: // Home key
                            angle = minangle;
                            inputEvent(0);
                            refreshControls();
                            changeEvent();
                            break;
                        case 33: // Page up key
                        /* falls through */
                        case 38: // Up arrow key
                        /* falls through */
                        case 39: // Right arrow key
                            calculateAngleAndRate('indirect', 'up');
                            refreshControls(true);
                            changeEvent();
                            break;
                        case 34: // Page down key
                        /* falls through */
                        case 37: // Left arrow key
                        /* falls through */
                        case 40: // Down arrow key
                            calculateAngleAndRate('indirect', 'down');
                            refreshControls(true);
                            changeEvent();
                            break;
                        case 35: // End key
                            angle = maxangle;
                            inputEvent(1);
                            refreshControls();
                            changeEvent();
                            break;
                        }
                        break;
                    }
                };
            }());
            function enableDisableAid(event) {
                switch (event.type) {
                case 'touchstart':
                    /* falls through */
                case 'mousedown':
                    event.preventDefault();
                    break;
                }
            }
            // cckEventHandler is mainly used for manually-triggered events (via the trigger / fire method)
            function cckEventHandler(event) {
                var event_type = event.type;
                // Prevent invocation when triggered manually from $cck_wrap
                if (!ck_wrap_do_not_trigger_map[event_type]) {
                    //console.log('triggered ' + event_type);
                    ck_do_not_trigger_map[event_type] = true;
                    $cck_wrap.trigger(event_type);
                    ck_do_not_trigger_map[event_type] = false;
                }
            }
            continuous_control_knob_object.enable = function enable() {
                if (disabled === true) {
                    disabled = false;
                    $continuous_control_knob_object.on('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', cckEventHandler);
                    $cck_wrap
                        .removeClass('disabled')
                        .on('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', cckWrapMetaControlHandler)
                        .attr('tabindex', tab_index)
                        .off('mousedown', enableDisableAid);
                }
                return continuous_control_knob_object;
            };
            continuous_control_knob_object.disable = function disable() {
                if (disabled === false) {
                    disabled = true;
                    $continuous_control_knob_object.off('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', cckEventHandler);
                    if (active) {
                        $document.trigger('mouseup'); // Manually trigger the 'mouseup' event handler
                    }
                    $cck_wrap
                        .addClass('disabled')
                        .off('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', cckWrapMetaControlHandler)
                        .removeAttr('tabindex')
                        .on('mousedown', enableDisableAid);
                    removeTransitionClass();
                }
                return continuous_control_knob_object;
            };
            continuous_control_knob_object.refresh = refreshControls;
            continuous_control_knob_object.on = function on() {
                applier($_proto.on, $continuous_control_knob_object, arguments);
                return continuous_control_knob_object;
            };
            continuous_control_knob_object.one = function one() {
                applier($_proto.one, $continuous_control_knob_object, arguments);
                return continuous_control_knob_object;
            };
            continuous_control_knob_object.off = function off() {
                applier($_proto.off, $continuous_control_knob_object, arguments);
                return continuous_control_knob_object;
            };
            function trigger() {
                applier($_proto.trigger, $continuous_control_knob_object, arguments);
                return continuous_control_knob_object;
            }
            continuous_control_knob_object.trigger = trigger;
            continuous_control_knob_object.fire = trigger;
            function resetStructure() {
                var parentNode = $cck_wrap[0].parentNode, i, length, item;
                if (parentNode !== null) {
                    //$cck_wrap.detach();
                    $cck_wrap.replaceWith($hot_swap_dummy);
                }
                for (i = 0, length = parts_list.length; i < length; i += 1) {
                    item = parts_list[i];
                    item.removeAttr('class').removeAttr('style');
                    if (item === $cck_wrap) {
                        item.removeAttr('tabindex');
                    }
                }
                initializeParts();
                if (parentNode !== null) {
                    //$ps_wrap.appendTo(parentNode);
                    $hot_swap_dummy.replaceWith($cck_wrap);
                }
            }
            continuous_control_knob_object.reset = function reset(hard) {
                var i, length;
                continuous_control_knob_object.disable();
                $continuous_control_knob_object.off();
                if (!!hard) {
                    resetStructure();
                    for (i = 0, length = parts_list.length; i < length; i += 1) {
                        parts_list[i].off();
                    }
                }
                properties.reset();
                prev_input_value = properties.value;
                prev_change_value = prev_input_value;
                refreshControls();
                continuous_control_knob_object.enable();
                return continuous_control_knob_object;
            };
        }());
        $cck_wrap.data('cck:host-object', continuous_control_knob_object).data('continuous-control-knob-object', continuous_control_knob_object);
        continuous_control_knob_object.enable();
        refreshControls(false);
        return continuous_control_knob_object;
    };
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));