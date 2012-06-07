/**
 * 通用的js脚本
 * @author 胡海
 * @since 2011-11-23
 */

//web应用根路径
var $WEB_ROOT_PATH = getContextPath();

var CRLF = "\n";

var INCLUDE_JS_MAP = new Object();//JS加载记录MAP

/**
 * 为string添加startWith方法
 * @param str
 * @returns
 */
String.prototype.startWith = function(str){
	var regexp = eval("/^" + str + "/");
	return regexp.test(this);
}

/**
 * 日期域
 */
function DateField(field, fieldValue){
	this.field = field;//域（年、月、日、时、分、秒）
	this.fieldValue = fieldValue;//域值
	
	this.toString = function(){
		return "field=" + this.field + ", fieldValue=" + this.fieldValue;
	}
}

/**
 * 年
 */
DateField.prototype.YEAR = "Y";

/**
 * 月
 */
DateField.prototype.MONTH = "M";

/**
 * 日
 */
DateField.prototype.DATE = "D";

/**
 * 时
 */
DateField.prototype.HOUR = "H";

/**
 * 分
 */
DateField.prototype.MINUTE = "MIN";

/**
 * 秒
 */
DateField.prototype.SECOND = "S";

/**
 * 日期加减
 * @param date 要加减的日期 
 * @param field 要加减的域（年、月、日、时、分、秒，参考DateField常量）
 * @param value 域的值
 */
function dateAdd(date, field, value){
	if(date && field && value && !isNaN(value)){
		var val;		
		if("number" == typeof(value)){
			val = value;
		}else if("string" == typeof(value)){
			val = parseInt(value);			
		}else{
			throw "dateAdd: param value should be an integer";
		}
		if(DateField.prototype.YEAR == field){
			date.setFullYear(date.getFullYear() + val);
		}else if(DateField.prototype.MONTH == field){
			date.setMonth(date.getMonth() + val);
		}else if(DateField.prototype.DATE == field){
			date.setDate(date.getDate() + val);
		}else if(DateField.prototype.HOUR == field){
			date.setHours(date.getHours() + val);
		}else if(DateField.prototype.MINUTE == field){
			date.setMinutes(date.getMinutes() + val);
		}else if(DateField.prototype.SECOND == field){
			date.setSeconds(date.getSeconds() + val);
		}
	}	
}

/**
 * 处理ajax错误
 * @param error 错误信息
 * @param callback 此回调函数用于传入自己的错误处理逻辑，当session超时时，此回调函数不会被执行
 * @return 如果是超时则返回true，否则返回false
 * @author 胡海
 * @since 2011-11-23
 */
function handleAjaxError(error, callback){
	var SESSION_TIME_OUT_AJAX_ERR_MSG = "TIME_OUT";//登录超时
	if(error == SESSION_TIME_OUT_AJAX_ERR_MSG){
		alert("由于您长时间未操作，您与服务器的连接已断开，请重新登录");
		window.top.location.href = $WEB_ROOT_PATH;//跳转到登录页
		return true;
	}
	if(callback){
		callback();
	}
	return false;
}

/**
 * ajax请求（忽略name为空的标签，默认忽略disabled的标签的数据）
 * @param url 提交地址
 * @param container 数据所在的dom容器，可以是：dom元素的id | jQuery选择器 | dom对象 | jQuery对象
 * @param successHandler 成功处理事件 （可选，一般都要设置）
 * @param errorHandler 出错处理事件 （可选，一般都要设置）
 * @param options jQuery ajax选项，传入后将覆盖默认设置（可选，此参数可传入自定义属性，
 * skipDisabled：是否忽略disabled的标签，默认为true；isValueData：第6个参数传入的dataSource是否是数据值对象，默认为true，否则为获取数据的表达式对象）
 * @param dataSource 提交数据源（支持按优先级进行数据覆盖，优先级：dataSource > formData（container中获取的数据） > options.data）
 * @param preproccess 预处理数据的函数（提交之前对数据进行预处理）
 */
function ajaxRequest(url, container, successHandler, errorHandler, options, dataSource, preproccess){
	var _options = {dataType: "text", type: "POST", data:{}, skipDisabled: true, isValueData: true};
	if(url){
		_options.url = url;
	}
	if(successHandler){
		_options.success = successHandler;
	}
	if(errorHandler){
		_options.error = function(xhr, status, error){
			handleAjaxError(error, errorHandler);
		};
	}
	
	if(options){
		jQuery.extend(_options, options);		
	}
	
	var data1 = getFormData(container, _options.skipDisabled);
	var data2 = collectData(dataSource, _options.isValueData);
	
	if(data1){
		jQuery.extend(_options.data, data1);
	}
	if(data2){
		jQuery.extend(_options.data, data2);
	}
	
	if(preproccess){
		_options.data = preproccess(_options.data);
	}
	jQuery.ajax(_options);
}

/**
 * 为select加载数据
 * @param select select标签标识，可以是：dom元素的id | jQuery选择器 | dom对象 | jQuery对象
 * @param url 加载数据的URL
 * @param name 数据中作为option显示项的属性名
 * @param value 数据中作为option值的属性名
 * @param hasDefault 是否有默认选项
 * @param dataKey 数据的key（当数据在一Map中时使用此参数）
 */
function loadSelect(select, url, optionName, optionValue, hasDefault, dataKey){
	var sel = getJqueryDomElement(select);
	if(sel.length == 1){
		ajaxRequest(url, null, function(data){
			if(false == hasDefault){
				sel[0].options.length = 0;
			}else{
				sel[0].options.length = 1;
			}	
			if(data && ("null" != data) && ("[]" != data)){
				var list = eval(data);
				if(dataKey){
					list = data[dataKey];
				}
				for(var i = 0; i < list.length; i++){
					sel[0].options[sel[0].options.length] = new Option(list[i][optionName], list[i][optionValue]);
				}
			}
		},
		function(xhr, status, error){
			handleAjaxError(error, function(){
				alert("加载下拉列表数据失败");
			});
		});
	}else{
		//传入的select表达式有误
	}
}

/**
 * 获得应用的根路径
 *@author：胡海
 *@since：2011-11-24
 */
function getContextPath(){
	var strFullPath=window.document.location.href;
	var strPath=window.document.location.pathname;
	var pos=strFullPath.indexOf(strPath);
	var prePath=strFullPath.substring(0,pos);
	var postPath=strPath.substring(0,strPath.substr(1).indexOf('/')+1);
	var basePath = prePath;
	//if(canBeAccess(prePath + postPath)){
		basePath = prePath + postPath;
	//}
	return basePath;
}

/**
 * 判断资源是否可被访问
 * @param url 资源路径
 * @returns {Boolean}
 */
function canBeAccess(url){
	var result = false;
	jQuery.ajax({
		url: url,
		async: false,
		complete: function(xhr, status){
			if(xhr.status == 200){
				result= true;
			}
		},
		timeout: 2000 //2秒超时
	});
	return result;
}

/**
 * 加载JS文件
 * @param filePath
 * @author：胡海
 * @since：2011-11-24
 */
function includeJS(filePath){
	//document.write("<script type='javascript' src='" + $WEB_ROOT_PATH + filePath + "'><\/script>");
	if(INCLUDE_JS_MAP[filePath]){
		return;
	}
	jQuery.ajax({
		async: false,//同步加载
		url:($WEB_ROOT_PATH + filePath),
		scriptCharset: "utf-8"
	});
	INCLUDE_JS_MAP[filePath] = "1";//加标志位
	
	/*
    var oHead = document.getElementsByTagName('HEAD')[0]; 
    var oScript= document.createElement("script"); 
    oScript.type = "text/javascript"; 
    oScript.src= $WEB_ROOT_PATH + filePath ; 
    oHead.appendChild( oScript); 
    */
}

/**
 * 加载css文件
 * @param filePath 相对web根目录的路径
 */
function includeCSS(filePath){
	if(INCLUDE_JS_MAP[filePath]){
		return;
	}
	var styleTag = document.createElement("link");
	styleTag.setAttribute('type', 'text/css');
	styleTag.setAttribute('rel', 'stylesheet');
	styleTag.setAttribute('href', $WEB_ROOT_PATH + filePath);
	jQuery("head")[0].appendChild(styleTag);
	
	INCLUDE_JS_MAP[filePath] = "1";//加标志位
}

/**
 * 判断字符串是否是汉字
 * @param str 
 * @returns {Number} 是汉字返回1，否则返回0
 */
function checkHasChi(str){
    re = /[\u4E00-\u9FA0]/;//汉字
    if (re.test(str)){
        return 1;
    } else{
        return 0;
    }
}

/**
 * 检查字符串是否超长
 * @param str
 * @param longtest 长度限制
 * @returns {Boolean}
 */
function checkIsOverLong(str,longtest){
    var len=0;
    for(l=0;l<str.length;l++){
        if(checkHasChi(str.charAt(l))==1){
            len+=2;
        } else{
            len+=1;
        }
        if(len>parseInt(longtest)){
            return true;
        }
    }
    return false;
}

/**
 * 获取字符串长度，1个中文字符为2个单位长度
 * @param str
 * @returns {Number}
 */
function length(str){
    var len = 0;
    for(l=0; l<str.length; l++){
        if(checkHasChi(str.charAt(l))==1){
            len += 2;
        } else{
            len += 1;
        }
    }
    return len;
}

/**
 * 获取标签定义在class上的属性值
 * @param obj 对象（dom对象|jQuery对象|标签id）
 * @param propertyName
 * @returns
 */
function getClassProperty (obj, propertyName){
	var result = "";
	if(obj){
		var _obj;
		if("string" == typeof(obj)){
			_obj = document.getElementById(obj);
		}else if("object" == typeof(obj)){
			_obj = (obj instanceof jQuery) ? obj[0] : obj; 
		}
		if(_obj && _obj.className){
			var regex = eval("/\\[\\s*?" + propertyName + "\\s*?=\\s*?([^\\]]*)\\s*?\\]/");//动态正则表达式
			var matches = _obj.className.match(regex);
			if(matches){
				result = matches[1];
			}
		}
	}
	return result;
}

/**
 * 在标签的class上自定义属性（class中添加表达式格式“[p=pvalue]”）
 * @param obj 对象（dom对象|jQuery对象|标签id）
 * @param propertyName 属性名
 * @param propertyValue 属性值
 * @returns
 */
function setClassProperty (obj, propertyName, propertyValue){
	var _obj;
	if(obj){
		if("string" == typeof(obj)){
			_obj = jQuery("#" + obj);
		}else if("object" == typeof(obj)){
			_obj = (obj instanceof jQuery) ? obj : jQuery(obj); 
		}
		if(_obj){
			_obj.addClass("[" + propertyName + "=" + propertyValue + "]");
		}
	}
	return _obj;
}

/**
 * 获取jQuery包装过的dom对象
 * @param obj
 * @returns
 */
function getJqueryDomElement(obj){
	var value = null;
	if(obj){
		var type = typeof(obj);
		if("string" == type){
			var _obj = jQuery.trim(obj);
			if( _obj.indexOf("#") > -1 || 
				_obj.indexOf(".") > -1 ||
				_obj.indexOf(":") > -1 ||
				_obj.indexOf(" ") > -1 ||
				_obj.indexOf("=") > -1 ||
				_obj.indexOf("[") > -1){//简单判断是否是jQuery选择器
				
				value = jQuery(_obj);
			}else{
				value = jQuery("#" + _obj);
			}
		}else if("object" == type){
			if(obj instanceof jQuery){
				value = obj;
			}else{
				value = jQuery(obj);
			}
		}else if("function" == type){
			value = obj();
		}
	}
	return value;
}

/**
 * 获取dom元素值
 * @param obj dom元素的id | jQuery选择器 | dom对象 | jQuery对象
 * @returns 没有获取到值时返回null
 */
function getDomElementValue(obj){
	var value = null;
	if(obj){
		var type = typeof(obj);
		if("string" == type){
			var _obj = jQuery.trim(obj);
			if( _obj.indexOf("#") > -1 || 
				_obj.indexOf(".") > -1 ||
				_obj.indexOf(":") > -1 ||
				_obj.indexOf(" ") > -1 ||
				_obj.indexOf("=") > -1 ||
				_obj.indexOf("[") > -1){//简单判断是否是jQuery选择器
				
				value = jQuery(_obj).val();
			}else{
				value = jQuery("#" + _obj).val();
			}
		}else if("object" == type){
			if(obj instanceof jQuery){
				value = obj.val();
			}else{
				value = jQuery(obj).val();
			}
		}else if("function" == type){
			value = obj();
		}
	}
	return value;
}

/**
 * dom处理器
 * @returns
 */
function DomHandler(){
	/**
	 * 文本框处理事件
	 */
	this.textHandler = null;
	
	/**
	 * 密码框处理事件
	 */
	this.passwordHandler = null;
	
	/**
	 * 单选按钮处理事件
	 */
	this.radioHandler = null;
	
	/**
	 * 复选框处理事件
	 */
	this.checkboxHandler = null;
	
	/**
	 * 隐藏域处理事件
	 */
	this.hiddenHandler = null;
	
	/**
	 * 文本域处理事件
	 */
	this.textareaHandler = null;
	
	/**
	 * 下拉框处理事件
	 */
	this.selectHandler = null;
	
	/**
	 * 默认处理事件
	 */
	this.defaultHandler = function(){};
	
	/**
	 * 文本框处理事件参数
	 */
	this.textHandlerArgs = null;
	
	/**
	 * 密码框处理事件参数
	 */
	this.passwordHandlerArgs = null;
	
	/**
	 * 单选按钮处理事件参数
	 */
	this.radioHandlerArgs = null;
	
	/**
	 * 复选框处理事件参数
	 */
	this.checkboxHandlerArgs = null;
	
	/**
	 * 隐藏域处理事件参数
	 */
	this.hiddenHandlerArgs = null;
	
	/**
	 * 文本域处理事件参数
	 */
	this.textareaHandlerArgs = null;
	
	/**
	 * 下拉框处理事件参数
	 */
	this.selectHandlerArgs = null;
	
	/**
	 * 默认处理事件参数
	 */
	this.defaultHandlerArgs = {tag: null};
	
	this.useDefault = function(){
		if(this.defaultHandler){
			if(null == this.textHandler){
				this.textHandler = this.defaultHandler;
			}
			if(null == this.passwordHandler){
				this.passwordHandler = this.defaultHandler;
			}
			if(null == this.radioHandler){
				this.radioHandler = this.defaultHandler;
			}
			if(null == this.checkboxHandler){
				this.checkboxHandler = this.defaultHandler;
			}
			if(null == this.hiddenHandler){
				this.hiddenHandler = this.defaultHandler;
			}
			if(null == this.textareaHandler){
				this.textareaHandler = this.defaultHandler;
			}
			if(null == this.selectHandler){
				this.selectHandler = this.defaultHandler;
			}
		}else{
			alert("DomHandler:" + defaultHandler + "未设置");
		}
		if(this.defaultHandlerArgs){
			if(null == this.textHandlerArgs){
				this.textHandlerArgs = this.defaultHandlerArgs;
			}
			if(null == this.passwordHandlerArgs){
				this.passwordHandlerArgs = this.defaultHandlerArgs;
			}
			if(null == this.radioHandlerArgs){
				this.radioHandlerArgs = this.defaultHandlerArgs;
			}
			if(null == this.checkboxHandlerArgs){
				this.checkboxHandlerArgs = this.defaultHandlerArgs;
			}
			if(null == this.hiddenHandlerArgs){
				this.hiddenHandlerArgs = this.defaultHandlerArgs;
			}
			if(null == this.textareaHandlerArgs){
				this.textareaHandlerArgs = this.defaultHandlerArgs;
			}
			if(null == this.selectHandlerArgs){
				this.selectHandlerArgs = this.defaultHandlerArgs;
			}
		}
	}
}

/**
 * 遍历dom元素
 * @param container dom容器，可以是：dom元素的id | jQuery选择器 | dom对象 | jQuery对象
 * @param handlers 类型：DomHandler，遍历时的处理函数及参数
 * @param skipDisabled 是否跳过disabled元素
 */
function loopDom(container, handlers, skipDisabled){
	var dom = document;
	if(container){
		dom = getJqueryDomElement(container);
	}
	var elements = jQuery("input:text", dom)
	.add("input:password", dom)
	.add("input:radio", dom)
	.add("input:checkbox", dom)
	.add("input:hidden", dom)
	.add("textarea", dom)
	.add("select", dom);
	
	var _skipDisabled = (skipDisabled != null) ? skipDisabled : true;
	
	if(elements && elements.length > 0 && handlers){
		elements.each(function(){
			var tag = this;
			var tagName = tag.tagName ? tag.tagName.toUpperCase() : null;
			if(tagName){
				if(!(_skipDisabled && tag.disabled)){
					handlers.defaultHandlerArgs.tag = tag;
					if("INPUT" == tagName){
						var tagType = tag.type ? tag.type.toUpperCase() : null;
						if(tagType){
							if("TEXT" == tagType){
								jQuery.extend(handlers.textareaHandlerArgs, {tag: tag});
								handlers.textareaHandler(handlers.textareaHandlerArgs);
							}else if("PASSWORD" == tagType){
								jQuery.extend(handlers.passwordHandlerArgs, {tag: tag});
								handlers.passwordHandler(handlers.passwordHandlerArgs);
							}else if("RADIO" == tagType){
								jQuery.extend(handlers.radioHandlerArgs, {tag: tag});
								handlers.radioHandler(handlers.radioHandlerArgs);
							}else if("CHECKBOX" == tagType){
								jQuery.extend(handlers.checkboxHandlerArgs, {tag: tag});
								handlers.checkboxHandler(handlers.checkboxHandlerArgs);
							}else if("HIDDEN" == tagType){
								jQuery.extend(handlers.hiddenHandlerArgs, {tag: tag});
								handlers.hiddenHandler(handlers.hiddenHandlerArgs);
							}
						}
					}else if("TEXTAREA" == tagName){
						jQuery.extend(handlers.textareaHandlerArgs, {tag: tag});
						handlers.textareaHandler(handlers.textareaHandlerArgs);
					}else if("SELECT" == tagName){
						jQuery.extend(handlers.selectHandlerArgs, {tag: tag});
						handlers.selectHandler(handlers.selectHandlerArgs);
					}
				}
			}						
		});
	}
}

/**
 * 获取表单数据
 * @param container dom容器，可以是：dom元素的id | jQuery选择器 | dom对象 | jQuery对象
 * @param skipDisabled 是否跳过disabled的表单元素
 */
function getFormData(container, skipDisabled){
	if(null == container){
		return null;
	}
	var data = {};
	var dataIndex = {};
	var domObj = getJqueryDomElement(container);
	var handlers = new DomHandler();
	handlers.defaultHandler = function(args){
		if(args.tag.name){
			data[args.tag.name]= args.tag.value;
		}
	}
	handlers.radioHandler = function(args){
		if(args.tag.name && null == data[args.tag.name]){//
//			var checkedRadio = jQuery(":radio[name='" + args.tag.name + "'][checked=true]", domObj);
//			data[args.tag.name] = checkedRadio.val();
			data[args.tag.name] = getRadioValue(args.tag.name, domObj);
		}
	}
	handlers.checkboxHandler = function(args){
		if(args.tag.name && args.tag.checked){
			if(null != dataIndex[args.tag.name]){
				//data[args.tag.name].push(args.tag.value);
				dataIndex[args.tag.name] += 1;
				data[args.tag.name + "[" + dataIndex[args.tag.name] + "]"] = args.tag.value;
			}else{
				dataIndex[args.tag.name] = 0;
//				data[args.tag.name] = new Array();
//				data[args.tag.name].push(args.tag.value);
				data[args.tag.name + "[" + 0 + "]"] = args.tag.value;
			}
		}
	}
	handlers.useDefault();
	loopDom(container, handlers, skipDisabled);
	return data;
}

/**
 * 获取radio的值
 * @param name radio的name
 * @param domObj radio所在的文档域(可以是：dom元素的id | jQuery选择器 | dom对象 | jQuery对象)，可选，默认为当前文档
 * @returns
 */
function getRadioValue(name, domObj){
	var doc = document;
	if(domObj){
		doc = getJqueryDomElement(domObj);
	}
	return jQuery("input:radio:checked[name='" + name + "']", doc).val();
}

/**
 * 收集数据
 * @param container 容器
 * @param dataSource 数据来源
 * @param isValueData 当dataSource传入为对象时，指示dataSource是否是直接可用的表单数据
 * @returns 对象形式
 */
function collectData(dataSource, isValueData){
	var data = null;
	if(dataSource){
		if(isValueData){
			data = dataSource;
		}else{
			data = {};
			for(p in dataSource){
				var pv = dataSource[p];
				var value = getDomElementValue(pv);
				if(null != value){
					data[p] = value;
				}
			}
		}
	}
	return data;
}

/**
 * 获取文本框中光标位置
 * @param element
 * @returns {Number}
 */
function getcaretPos(element){
	var caretPos = 0; // IE Support
	if (document.selection) {
		element.focus ();
		var sel = document.selection.createRange();
		sel.moveStart ('character', -element.value.length);
		caretPos = sel.text.length;
	}else if (element.selectionStart || element.selectionStart == '0'){// Firefox support only for textarea and input
		caretPos = element.selectionStart;
	}
	return caretPos;
}

/**
 * 设置文本框中光标位置
 * @param element
 * @param location
 */
function setcaretPos(element, location){
	if(element.setSelectionRange){//Firefox
		element.focus();
		element.setSelectionRange(location,location);
	}else if (document.body.createTextRange) {//IE
		var range = element.createTextRange();
		range.collapse(true);        
		range.moveStart('character', location);
		range.select();
	}
}

/**
 * 自动补全文本框中字符对
 * @param element 文本框
 * @param event 事件
 * @param charMap 字符对map
 * @param callback 回调函数，可用于设置光标位置，函数参数(element, index, leftStr, rightStr, codeChar, charToAdd)
 */
function pairComplete(element, event, charMap, callback){
	var index = getcaretPos(element);//光标位置
	var eventInfo = EventInfo.getEventInfo(event);
	var codeChar = String.fromCharCode(eventInfo.keyCode);//当前字符
	var charToAdd = charMap[codeChar];//将要补全的字符
	if(charToAdd){
		var leftStr = element.value.substring(0, index);//未补全时光标左侧字符串
		var rightStr = element.value.substring(index);//未补全时光标右侧字符串
		element.value = leftStr + codeChar + charToAdd + rightStr;
		callback(element, index, leftStr, rightStr, codeChar, charToAdd);//执行回调函数
		if(event.preventDefault){
			event.preventDefault();
		}else{
			event.returnValue = false;
		}
	}
}

/**
 * 获取日期整形字符串
 * @param date1 日期对象或日期字符串（支持yyyy-mm-dd、yyyy/mm/dd、yyyymmdd）
 * @returns {Date}
 */
function getDateIntStr(date1){
	var d1 = null;
	if(date1 instanceof Date){
		var d1 = new Date();d1.getDate()
		var month = date1.getMonth() + 1;
		var date = date1.getDate();
		d1 = "" + date1.getFullYear() + (month > 9 ? month : '0' + month) +  (date > 9 ? date : '0' + date);
	}else if("string" == typeof(date1)){
		if(/^\d{4}-\d{2}-\d{2}$/.test(date1)){
			d1 = date1.replace(/-/g, "");
		}else if(/^\d{4}\/\d{2}\/\d{2}$/.test(date1)){
			d1 = date1.replace(/\//g, "");
		}else if(/^\d{8}$/.test(date1)){
			d1 = date1;
		}
	}
	return d1;
}

/**
 * 比较两个日期
 * @param date1
 * @param date2
 * @returns {Number} -2:传入了为null的参数，-1:date1 < date2，0:date1 = date2，1:date1 > date2
 */
function dateCompare(date1, date2){
	var result = -2;
	if(date1 && date2){
		var d1 = getDateIntStr(date1);
		var d2 = getDateIntStr(date2);
		if(null != d1 && null != d2){
			var d1Int = parseInt(d1);
			var d2Int = parseInt(d2);
			
			if(d1Int > d2Int){
				result = 1;
			}else if(d1Int == d2Int){
				result = 0;
			}else{
				result = -1;
			}
		}
	}
	return result;
}

//添加cookie
function addCookie(name, value, expires, path){
	var str = name + "=" + escape(value);
	if(expires){
		var date = new Date();
		date.setTime(date.getTime() + expires * 24 * 3600 * 1000);//expires单位为天
		str += ";expires=" + date.toGMTString();
	}
	if(path){
		str += ";path=" + path;//指定可访问cookie的目录
	}
	str += ";domain=" + document.location.hostname;//指定可访问cookie的域
	document.cookie = str;
}

//获取cookie
function getCookie(cookie_name){
	var value = null;
	var allcookies = document.cookie;
	var cookie_pos = allcookies.indexOf(cookie_name);
	
	if (cookie_pos != -1){		
		cookie_pos += cookie_name.length + 1;
		var cookie_end = allcookies.indexOf(";", cookie_pos);
		if (cookie_end == -1)
		{
			cookie_end = allcookies.length;
		}
		value = unescape(allcookies.substring(cookie_pos, cookie_end));
	}

	return value;
}

//删除cookie
function delCookie(name){//为了删除指定名称的cookie，可以将其过期时间设定为一个过去的时间
	addCookie(name, "0", (-2 * cookieLife), "/");
}

/**
 * 事件信息类
 */
function EventInfo(){
	/**
	 * 键码
	 */
	this.keyCode = null;
	
	/**
	 * 事件源对象
	 */
	this.srcObj = null;
	
	/**
	 * 事件类型
	 */
	this.type = null;
}

/**
 * 获取事件信息
 * @param event
 * @returns {EventInfo}
 */
EventInfo.getEventInfo = function(event){
	var result = new EventInfo();
	var keyCode;
	var srcObj;
	var type;
	
	if(jQuery.browser.msie){
		keyCode = event.keyCode;
		srcObj = event.srcElement;
	}else{
		keyCode = event.which;
		srcObj = event.target;
	}
	
	result.type = event.type;
	result.keyCode = keyCode;
	result.srcObj = srcObj;
	return  result;
}

//-----------------------------------------------------------
//加载CommonUI
//includeJS("/js/commonUI.js");
//-----------------------------------------------------------