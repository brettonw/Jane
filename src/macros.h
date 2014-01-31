"use strict";

#define MATH_PI				"&pi;"

#define	D(value)			value:value
#define	D_STRING(value)	value:#value
#define	COPY_PARAM(paramName, params)											\
	if (#paramName in params) this[#paramName] = params[#paramName]
#define	COPY_PARAM_NULL(paramName, params)										\
	this[#paramName] = (#paramName in params) ? params[#paramName] : null
#define	COPY_PARAM_AS(paramNameFrom, paramNameTo, params)						\
	if (#paramNameFrom in params) this[#paramNameTo] = params[#paramNameFrom]

#ifdef DEBUG
#define	DEBUGGER			debugger
#define	DEBUGLOG(x)			if (typeof window.top.console !== "undefined") window.top.console.log (x)
#else
#define	DEBUGGER
#define	DEBUGLOG(x)			
#endif

