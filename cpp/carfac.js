// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 19240;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } },{ func: function() { __GLOBAL__I_a111() } },{ func: function() { __GLOBAL__I_a183() } });
var ___fsmu8;
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,80,58,0,0,44,3,0,0,158,1,0,0,172,0,0,0,166,1,0,0,222,0,0,0,108,0,0,0,10,1,0,0,42,1,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv119__pointer_type_infoE;
__ZTVN10__cxxabiv119__pointer_type_infoE=allocate([0,0,0,0,96,58,0,0,44,3,0,0,174,0,0,0,172,0,0,0,166,1,0,0,24,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,128,58,0,0,44,3,0,0,34,3,0,0,172,0,0,0,166,1,0,0,222,0,0,0,90,2,0,0,36,1,0,0,184,1,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTIt;
__ZTIt=allocate([0,36,0,0,120,36,0,0], "i8", ALLOC_STATIC);
var __ZTIs;
__ZTIs=allocate([0,36,0,0,128,36,0,0], "i8", ALLOC_STATIC);
var __ZTIm;
__ZTIm=allocate([0,36,0,0,136,36,0,0], "i8", ALLOC_STATIC);
var __ZTIl;
__ZTIl=allocate([0,36,0,0,144,36,0,0], "i8", ALLOC_STATIC);
var __ZTIj;
__ZTIj=allocate([0,36,0,0,152,36,0,0], "i8", ALLOC_STATIC);
var __ZTIi;
__ZTIi=allocate([0,36,0,0,160,36,0,0], "i8", ALLOC_STATIC);
var __ZTIh;
__ZTIh=allocate([0,36,0,0,168,36,0,0], "i8", ALLOC_STATIC);
var __ZTIf;
__ZTIf=allocate([0,36,0,0,176,36,0,0], "i8", ALLOC_STATIC);
var __ZTId;
__ZTId=allocate([0,36,0,0,184,36,0,0], "i8", ALLOC_STATIC);
var __ZTIc;
__ZTIc=allocate([0,36,0,0,192,36,0,0], "i8", ALLOC_STATIC);
var __ZTIa;
__ZTIa=allocate([0,36,0,0,208,36,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,58,3,0,0,0,0,0,0,74,117,108,0,0,0,0,0,74,117,110,0,0,0,0,0,109,97,120,95,122,101,116,97,0,0,0,0,0,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,40,33,99,104,101,99,107,95,116,114,97,110,115,112,111,115,101,95,97,108,105,97,115,105,110,103,95,114,117,110,95,116,105,109,101,95,115,101,108,101,99,116,111,114,32,60,116,121,112,101,110,97,109,101,32,68,101,114,105,118,101,100,58,58,83,99,97,108,97,114,44,98,108,97,115,95,116,114,97,105,116,115,60,68,101,114,105,118,101,100,62,58,58,73,115,84,114,97,110,115,112,111,115,101,100,44,79,116,104,101,114,68,101,114,105,118,101,100,62,32,58,58,114,117,110,40,101,120,116,114,97,99,116,95,100,97,116,97,40,100,115,116,41,44,32,111,116,104,101,114,41,41,32,38,38,32,34,97,108,105,97,115,105,110,103,32,100,101,116,101,99,116,101,100,32,100,117,114,105,110,103,32,116,114,97,110,112,111,115,105,116,105,111,110,44,32,117,115,101,32,116,114,97,110,115,112,111,115,101,73,110,80,108,97,99,101,40,41,32,34,32,34,111,114,32,101,118,97,108,117,97,116,101,32,116,104,101,32,114,104,115,32,105,110,116,111,32,97,32,116,101,109,112,111,114,97,114,121,32,117,115,105,110,103,32,46,101,118,97,108,40,41,34,0,0,0,0,0,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,118,111,105,100,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,108,111,110,103,0,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,99,97,114,95,99,111,101,102,102,115,46,114,49,95,99,111,101,102,102,115,46,115,105,122,101,40,41,32,61,61,32,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,99,97,114,95,99,111,101,102,102,115,46,97,48,95,99,111,101,102,102,115,46,115,105,122,101,40,41,32,61,61,32,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,99,97,114,95,99,111,101,102,102,115,46,99,48,95,99,111,101,102,102,115,46,115,105,122,101,40,41,32,61,61,32,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,99,97,114,95,99,111,101,102,102,115,46,104,95,99,111,101,102,102,115,46,115,105,122,101,40,41,32,61,61,32,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,99,97,114,95,99,111,101,102,102,115,46,103,48,95,99,111,101,102,102,115,46,115,105,122,101,40,41,32,61,61,32,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,99,97,114,95,99,111,101,102,102,115,46,122,114,95,99,111,101,102,102,115,46,115,105,122,101,40,41,32,61,61,32,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,34,99,97,114,95,99,111,101,102,102,115,32,115,104,111,117,108,100,32,98,101,32,115,105,122,101,32,110,117,109,95,99,104,97,110,110,101,108,115,46,34,0,0,0,0,0,0,65,117,103,117,115,116,0,0,74,117,108,121,0,0,0,0,109,105,110,95,122,101,116,97,0,0,0,0,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,83,101,108,102,67,119,105,115,101,66,105,110,97,114,121,79,112,46,104,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,117,110,115,105,103,110,101,100,32,105,110,116,0,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,118,95,111,102,102,115,101,116,0,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,114,111,119,115,40,41,32,61,61,32,114,104,115,46,114,111,119,115,40,41,32,38,38,32,99,111,108,115,40,41,32,61,61,32,114,104,115,46,99,111,108,115,40,41,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,105,110,116,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,117,110,115,105,103,110,101,100,32,115,104,111,114,116,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,118,101,108,111,99,105,116,121,95,115,99,97,108,101,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,111,102,102,115,101,116,95,114,97,110,103,101,95,115,116,97,114,116,32,62,32,48,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,108,111,97,116,86,101,99,116,111,114,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,115,104,111,114,116,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,80,108,97,105,110,79,98,106,101,99,116,66,97,115,101,46,104,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,114,111,119,115,32,62,61,32,48,32,38,38,32,40,82,111,119,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,68,121,110,97,109,105,99,32,124,124,32,82,111,119,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,114,111,119,115,41,32,38,38,32,99,111,108,115,32,62,61,32,48,32,38,38,32,40,67,111,108,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,68,121,110,97,109,105,99,32,124,124,32,67,111,108,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,99,111,108,115,41,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,77,97,112,66,97,115,101,46,104,0,0,0,0,67,65,82,80,97,114,97,109,115,0,0,0,0,0,0,0,40,100,97,116,97,32,61,61,32,48,41,32,124,124,32,40,32,114,111,119,115,32,62,61,32,48,32,38,38,32,40,82,111,119,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,68,121,110,97,109,105,99,32,124,124,32,82,111,119,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,114,111,119,115,41,32,38,38,32,99,111,108,115,32,62,61,32,48,32,38,38,32,40,67,111,108,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,68,121,110,97,109,105,99,32,124,124,32,67,111,108,115,65,116,67,111,109,112,105,108,101,84,105,109,101,32,61,61,32,99,111,108,115,41,41,0,0,80,77,0,0,0,0,0,0,65,77,0,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,65,115,115,105,103,110,46,104,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,114,111,119,115,40,41,32,61,61,32,111,116,104,101,114,46,114,111,119,115,40,41,32,38,38,32,99,111,108,115,40,41,32,61,61,32,111,116,104,101,114,46,99,111,108,115,40,41,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,82,101,100,117,120,46,104,0,0,0,0,0,0,109,97,116,46,114,111,119,115,40,41,62,48,32,38,38,32,109,97,116,46,99,111,108,115,40,41,62,48,32,38,38,32,34,121,111,117,32,97,114,101,32,117,115,105,110,103,32,97,110,32,101,109,112,116,121,32,109,97,116,114,105,120,34,0,117,110,115,105,103,110,101,100,32,99,104,97,114,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,68,101,110,115,101,67,111,101,102,102,115,66,97,115,101,46,104,0,0,0,0,114,111,119,32,62,61,32,48,32,38,38,32,114,111,119,32,60,32,114,111,119,115,40,41,32,38,38,32,99,111,108,32,62,61,32,48,32,38,38,32,99,111,108,32,60,32,99,111,108,115,40,41,0,0,0,0,101,109,115,99,114,105,112,116,101,110,95,98,105,110,100,105,110,103,115,46,99,99,0,0,97,103,99,95,109,105,120,95,99,111,101,102,102,0,0,0,110,117,109,95,105,110,112,117,116,95,115,97,109,112,108,101,115,32,61,61,32,115,97,105,95,112,97,114,97,109,115,95,46,105,110,112,117,116,95,115,101,103,109,101,110,116,95,119,105,100,116,104,0,0,0,0,115,101,116,0,0,0,0,0,103,101,116,0,0,0,0,0,115,105,122,101,0,0,0,0,112,117,115,104,95,98,97,99,107,0,0,0,0,0,0,0,112,97,114,97,109,115,95,46,116,114,105,103,103,101,114,95,119,105,110,100,111,119,95,119,105,100,116,104,32,62,32,112,97,114,97,109,115,95,46,115,97,105,95,119,105,100,116,104,0,0,0,0,0,0,0,0,47,104,111,109,101,47,114,111,110,119,47,101,109,115,99,114,105,112,116,101,110,47,101,109,115,99,114,105,112,116,101,110,47,115,121,115,116,101,109,47,105,110,99,108,117,100,101,47,101,109,115,99,114,105,112,116,101,110,47,98,105,110,100,46,104,0,0,0,0,0,0,0,112,116,114,0,0,0,0,0,115,105,103,110,101,100,32,99,104,97,114,0,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,115,97,105,95,112,97,114,97,109,115,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,97,103,99,95,112,97,114,97,109,115,0,0,0,0,0,0,97,103,99,95,115,116,97,103,101,95,103,97,105,110,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,105,104,99,95,112,97,114,97,109,115,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,99,97,114,95,112,97,114,97,109,115,0,0,0,0,0,0,112,97,114,97,109,115,95,46,105,110,112,117,116,95,115,101,103,109,101,110,116,95,119,105,100,116,104,32,60,61,32,98,117,102,102,101,114,95,119,105,100,116,104,40,41,32,38,38,32,34,84,111,111,32,102,101,119,32,116,114,105,103,103,101,114,115,44,32,111,114,32,116,114,105,103,103,101,114,95,119,105,110,100,111,119,95,119,105,100,116,104,32,116,111,111,32,115,109,97,108,108,32,102,111,114,32,34,32,34,115,112,101,99,105,102,105,101,100,32,105,110,112,117,116,95,115,101,103,109,101,110,116,95,119,105,100,116,104,46,32,32,73,46,101,46,32,116,104,101,32,104,111,112,32,115,105,122,101,32,98,101,116,119,101,101,110,32,34,32,34,97,100,106,97,99,101,110,116,32,83,65,73,32,102,114,97,109,101,115,32,105,115,32,116,111,111,32,108,97,114,103,101,44,32,115,111,109,101,32,105,110,112,117,116,32,115,97,109,112,108,101,115,32,119,111,117,108,100,32,34,32,34,98,101,32,105,103,110,111,114,101,100,46,34,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,67,111,109,112,117,116,101,65,110,100,80,108,111,116,83,65,73,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,82,101,115,101,116,0,0,0,82,101,100,101,115,105,103,110,0,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,65,73,80,108,111,116,116,101,114,0,0,0,0,0,0,116,114,105,103,103,101,114,95,119,105,110,100,111,119,95,119,105,100,116,104,0,0,0,0,110,117,109,95,116,114,105,103,103,101,114,115,95,112,101,114,95,102,114,97,109,101,0,0,99,104,97,114,0,0,0,0,102,114,101,115,104,95,105,110,112,117,116,95,115,101,103,109,101,110,116,46,114,111,119,115,40,41,32,61,61,32,112,97,114,97,109,115,40,41,46,110,117,109,95,99,104,97,110,110,101,108,115,32,38,38,32,34,85,110,101,120,112,101,99,116,101,100,32,110,117,109,98,101,114,32,111,102,32,105,110,112,117,116,32,99,104,97,110,110,101,108,115,46,34,0,0,0,102,117,116,117,114,101,95,108,97,103,115,0,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,46,47,115,97,105,46,104,0,115,97,105,95,119,105,100,116,104,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,37,112,0,0,0,0,0,0,102,97,108,115,101,0,0,0,102,114,101,115,104,95,105,110,112,117,116,95,115,101,103,109,101,110,116,46,99,111,108,115,40,41,32,61,61,32,112,97,114,97,109,115,40,41,46,105,110,112,117,116,95,115,101,103,109,101,110,116,95,119,105,100,116,104,32,38,38,32,34,85,110,101,120,112,101,99,116,101,100,32,110,117,109,98,101,114,32,111,102,32,105,110,112,117,116,32,115,97,109,112,108,101,115,46,34,0,0,0,0,0,83,65,73,80,97,114,97,109,115,0,0,0,0,0,0,0,110,117,109,95,115,116,97,103,101,115,0,0,0,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,115,116,97,114,116,82,111,119,32,62,61,32,48,32,38,38,32,98,108,111,99,107,82,111,119,115,32,62,61,32,48,32,38,38,32,115,116,97,114,116,82,111,119,32,43,32,98,108,111,99,107,82,111,119,115,32,60,61,32,120,112,114,46,114,111,119,115,40,41,32,38,38,32,115,116,97,114,116,67,111,108,32,62,61,32,48,32,38,38,32,98,108,111,99,107,67,111,108,115,32,62,61,32,48,32,38,38,32,115,116,97,114,116,67,111,108,32,43,32,98,108,111,99,107,67,111,108,115,32,60,61,32,120,112,114,46,99,111,108,115,40,41,0,0,97,99,95,99,111,114,110,101,114,95,104,122,0,0,0,0,116,97,117,50,95,105,110,0,112,97,114,97,109,115,95,46,110,117,109,95,116,114,105,103,103,101,114,115,95,112,101,114,95,102,114,97,109,101,32,62,32,48,0,0,0,0,0,0,58,32,0,0,0,0,0,0,116,97,117,50,95,111,117,116,0,0,0,0,0,0,0,0,116,97,117,49,95,105,110,0,116,97,117,49,95,111,117,116,0,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,105,110,100,101,120,32,62,61,32,48,32,38,38,32,105,110,100,101,120,32,60,32,115,105,122,101,40,41,0,0,0,0,116,97,117,95,108,112,102,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,67,119,105,115,101,66,105,110,97,114,121,79,112,46,104,0,0,0,0,0,0,110,95,105,116,101,114,97,116,105,111,110,115,32,60,32,49,54,32,38,38,32,34,84,111,111,32,109,97,110,121,32,105,116,101,114,97,116,105,111,110,115,32,110,101,101,100,101,100,32,105,110,32,65,71,67,32,115,112,97,116,105,97,108,32,115,109,111,111,116,104,105,110,103,46,34,0,0,0,0,0,111,110,101,95,99,97,112,97,99,105,116,111,114,0,0,0,108,104,115,46,114,111,119,115,40,41,32,61,61,32,114,104,115,46,114,111,119,115,40,41,32,38,38,32,108,104,115,46,99,111,108,115,40,41,32,61,61,32,114,104,115,46,99,111,108,115,40,41,0,0,0,0,98,111,111,108,0,0,0,0,106,117,115,116,95,104,97,108,102,95,119,97,118,101,95,114,101,99,116,105,102,121,0,0,73,72,67,80,97,114,97,109,115,0,0,0,0,0,0,0,67,0,0,0,0,0,0,0,101,114,98,95,113,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,66,108,111,99,107,46,104,0,0,0,0,0,0,65,71,67,80,97,114,97,109,115,0,0,0,0,0,0,0,118,101,99,116,111,114,0,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,0,101,114,98,95,98,114,101,97,107,95,102,114,101,113,0,0,40,105,62,61,48,41,32,38,38,32,40,32,40,40,66,108,111,99,107,82,111,119,115,61,61,49,41,32,38,38,32,40,66,108,111,99,107,67,111,108,115,61,61,88,112,114,84,121,112,101,58,58,67,111,108,115,65,116,67,111,109,112,105,108,101,84,105,109,101,41,32,38,38,32,105,60,120,112,114,46,114,111,119,115,40,41,41,32,124,124,40,40,66,108,111,99,107,82,111,119,115,61,61,88,112,114,84,121,112,101,58,58,82,111,119,115,65,116,67,111,109,112,105,108,101,84,105,109,101,41,32,38,38,32,40,66,108,111,99,107,67,111,108,115,61,61,49,41,32,38,38,32,105,60,120,112,114,46,99,111,108,115,40,41,41,41,0,0,37,46,48,76,102,0,0,0,101,109,115,99,114,105,112,116,101,110,58,58,118,97,108,0,109,105,110,95,112,111,108,101,95,104,122,0,0,0,0,0,115,97,105,46,99,99,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,115,116,100,58,58,119,115,116,114,105,110,103,0,0,0,0,101,114,98,95,112,101,114,95,115,116,101,112,0,0,0,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,84,104,117,0,0,0,0,0,115,116,100,58,58,115,116,114,105,110,103,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,65,114,114,97,121,46,104,0,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,104,105,103,104,95,102,95,100,97,109,112,105,110,103,95,99,111,109,112,114,101,115,115,105,111,110,0,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,67,119,105,115,101,78,117,108,108,97,114,121,79,112,46,104,0,0,0,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,100,111,117,98,108,101,0,0,83,117,110,100,97,121,0,0,100,105,109,32,62,61,32,48,0,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,122,101,114,111,95,114,97,116,105,111,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,102,108,111,97,116,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,101,97,114,46,99,99,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,102,105,114,115,116,95,112,111,108,101,95,116,104,101,116,97,0,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,47,117,115,114,47,105,110,99,108,117,100,101,47,101,105,103,101,110,51,47,69,105,103,101,110,47,115,114,99,47,67,111,114,101,47,84,114,97,110,115,112,111,115,101,46,104,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,117,110,115,105,103,110,101,100,32,108,111,110,103,0,0,0,83,101,112,0,0,0,0,0,65,117,103,0,0,0,0,0,99,97,114,102,97,99,46,99,99,0,0,0,0,0,0,0,115,111,117,110,100,95,100,97,116,97,46,114,111,119,115,40,41,32,61,61,32,110,117,109,95,101,97,114,115,95,0,0,111,112,101,114,97,116,111,114,40,41,0,0,0,0,0,0,83,104,105,102,116,65,110,100,65,112,112,101,110,100,73,110,112,117,116,0,0,0,0,0,83,116,97,98,105,108,105,122,101,83,101,103,109,101,110,116,0,0,0,0,0,0,0,0,68,101,115,105,103,110,65,71,67,67,111,101,102,102,115,0,82,117,110,83,101,103,109,101,110,116,0,0,0,0,0,0,108,97,122,121,65,115,115,105,103,110,0,0,0,0,0,0,114,117,110,0,0,0,0,0,77,97,112,66,97,115,101,0,66,108,111,99,107,0,0,0,65,114,114,97,121,0,0,0,95,105,110,105,116,50,0,0,67,119,105,115,101,78,117,108,108,97,114,121,79,112,0,0,67,119,105,115,101,66,105,110,97,114,121,79,112,0,0,0,103,101,116,65,99,116,117,97,108,84,121,112,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,128,51,0,0,74,0,0,0,84,1,0,0,172,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,51,0,0,66,2,0,0,202,1,0,0,224,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,51,0,0,204,0,0,0,76,3,0,0,238,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,51,0,0,24,1,0,0,58,0,0,0,148,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,51,0,0,24,1,0,0,16,0,0,0,148,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,51,0,0,24,1,0,0,44,0,0,0,148,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,52,0,0,212,1,0,0,242,0,0,0,124,0,0,0,2,2,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,52,0,0,60,3,0,0,12,2,0,0,124,0,0,0,14,3,0,0,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,52,0,0,200,1,0,0,16,2,0,0,124,0,0,0,4,2,0,0,42,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,52,0,0,66,3,0,0,142,1,0,0,124,0,0,0,242,1,0,0,78,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,53,0,0,50,3,0,0,18,1,0,0,124,0,0,0,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,53,0,0,196,1,0,0,66,1,0,0,124,0,0,0,188,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,53,0,0,96,0,0,0,68,1,0,0,124,0,0,0,210,2,0,0,22,0,0,0,18,2,0,0,32,0,0,0,220,0,0,0,212,2,0,0,250,0,0,0,248,255,255,255,104,53,0,0,120,0,0,0,52,0,0,0,196,0,0,0,84,0,0,0,8,0,0,0,180,0,0,0,244,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,53,0,0,32,3,0,0,226,2,0,0,124,0,0,0,116,0,0,0,136,0,0,0,246,2,0,0,156,1,0,0,178,0,0,0,14,0,0,0,182,2,0,0,248,255,255,255,144,53,0,0,128,1,0,0,118,2,0,0,186,2,0,0,234,2,0,0,76,2,0,0,12,1,0,0,52,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,53,0,0,230,0,0,0,22,2,0,0,124,0,0,0,32,1,0,0,248,0,0,0,122,0,0,0,130,1,0,0,224,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,53,0,0,168,0,0,0,190,0,0,0,124,0,0,0,2,1,0,0,10,2,0,0,170,0,0,0,250,1,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,53,0,0,36,3,0,0,2,0,0,0,124,0,0,0,170,1,0,0,52,3,0,0,94,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,53,0,0,118,0,0,0,176,2,0,0,124,0,0,0,220,2,0,0,228,0,0,0,200,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,54,0,0,200,2,0,0,76,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,54,0,0,70,0,0,0,140,1,0,0,238,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,54,0,0,12,0,0,0,218,1,0,0,124,0,0,0,106,0,0,0,94,0,0,0,88,0,0,0,92,0,0,0,86,0,0,0,102,0,0,0,100,0,0,0,164,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,54,0,0,30,1,0,0,42,0,0,0,124,0,0,0,60,2,0,0,64,2,0,0,52,2,0,0,62,2,0,0,28,1,0,0,56,2,0,0,54,2,0,0,222,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,54,0,0,98,0,0,0,54,0,0,0,124,0,0,0,130,2,0,0,126,2,0,0,114,2,0,0,120,2,0,0,8,2,0,0,124,2,0,0,112,2,0,0,136,2,0,0,134,2,0,0,132,2,0,0,112,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,54,0,0,144,0,0,0,4,0,0,0,124,0,0,0,26,3,0,0,12,3,0,0,6,3,0,0,8,3,0,0,242,2,0,0,10,3,0,0,4,3,0,0,206,1,0,0,18,3,0,0,16,3,0,0,122,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,54,0,0,218,0,0,0,14,1,0,0,124,0,0,0,108,1,0,0,48,2,0,0,70,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,54,0,0,68,0,0,0,226,1,0,0,124,0,0,0,40,2,0,0,168,2,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,54,0,0,24,0,0,0,6,2,0,0,124,0,0,0,82,0,0,0,252,1,0,0,106,2,0,0,208,2,0,0,98,2,0,0,196,2,0,0,172,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,54,0,0,234,1,0,0,122,1,0,0,124,0,0,0,250,2,0,0,56,3,0,0,70,2,0,0,38,1,0,0,50,0,0,0,74,2,0,0,58,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,55,0,0,234,1,0,0,46,0,0,0,124,0,0,0,20,1,0,0,114,0,0,0,254,0,0,0,92,2,0,0,78,1,0,0,190,1,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,55,0,0,234,1,0,0,46,1,0,0,124,0,0,0,50,2,0,0,220,1,0,0,166,2,0,0,166,0,0,0,162,1,0,0,138,1,0,0,64,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,55,0,0,234,1,0,0,80,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,55,0,0,158,0,0,0,182,1,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,55,0,0,234,1,0,0,236,0,0,0,124,0,0,0,146,1,0,0,202,0,0,0,100,1,0,0,46,3,0,0,206,0,0,0,80,2,0,0,28,2,0,0,62,0,0,0,128,0,0,0,190,2,0,0,54,1,0,0,208,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,55,0,0,74,3,0,0,90,0,0,0,124,0,0,0,162,0,0,0,160,1,0,0,116,1,0,0,178,2,0,0,154,0,0,0,120,1,0,0,204,1,0,0,152,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,55,0,0,194,0,0,0,214,2,0,0,186,1,0,0,88,2,0,0,92,1,0,0,142,2,0,0,150,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,55,0,0,234,1,0,0,244,0,0,0,124,0,0,0,50,2,0,0,220,1,0,0,166,2,0,0,166,0,0,0,162,1,0,0,138,1,0,0,64,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,56,0,0,234,1,0,0,20,3,0,0,124,0,0,0,50,2,0,0,220,1,0,0,166,2,0,0,166,0,0,0,162,1,0,0,138,1,0,0,64,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,56,0,0,104,1,0,0,252,2,0,0,214,0,0,0,168,1,0,0,26,1,0,0,86,2,0,0,34,2,0,0,246,1,0,0,170,2,0,0,160,0,0,0,146,0,0,0,134,0,0,0,68,3,0,0,20,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,56,0,0,20,0,0,0,86,1,0,0,26,2,0,0,236,2,0,0,232,2,0,0,42,2,0,0,34,1,0,0,14,2,0,0,110,1,0,0,36,0,0,0,64,0,0,0,254,2,0,0,96,1,0,0,244,1,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,80,56,0,0,112,0,0,0,162,2,0,0,252,255,255,255,252,255,255,255,80,56,0,0,150,1,0,0,102,1,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,104,56,0,0,202,2,0,0,0,3,0,0,252,255,255,255,252,255,255,255,104,56,0,0,64,1,0,0,82,2,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,128,56,0,0,252,0,0,0,78,3,0,0,248,255,255,255,248,255,255,255,128,56,0,0,236,1,0,0,248,2,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,152,56,0,0,62,1,0,0,110,2,0,0,248,255,255,255,248,255,255,255,152,56,0,0,134,1,0,0,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,56,0,0,96,2,0,0,238,1,0,0,238,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,57,0,0,38,3,0,0,230,2,0,0,198,0,0,0,168,1,0,0,26,1,0,0,86,2,0,0,58,1,0,0,246,1,0,0,170,2,0,0,160,0,0,0,146,0,0,0,134,0,0,0,128,2,0,0,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,57,0,0,174,1,0,0,232,1,0,0,72,1,0,0,236,2,0,0,232,2,0,0,42,2,0,0,36,2,0,0,14,2,0,0,110,1,0,0,36,0,0,0,64,0,0,0,254,2,0,0,24,3,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,57,0,0,216,2,0,0,148,1,0,0,124,0,0,0,126,1,0,0,192,2,0,0,192,1,0,0,48,3,0,0,60,0,0,0,48,1,0,0,44,1,0,0,232,0,0,0,118,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,57,0,0,60,1,0,0,156,0,0,0,124,0,0,0,164,2,0,0,10,0,0,0,100,2,0,0,218,2,0,0,240,2,0,0,8,1,0,0,174,2,0,0,228,1,0,0,148,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,57,0,0,228,2,0,0,80,1,0,0,124,0,0,0,104,0,0,0,74,1,0,0,78,0,0,0,176,1,0,0,62,3,0,0,230,1,0,0,72,2,0,0,0,2,0,0,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,57,0,0,226,0,0,0,216,1,0,0,124,0,0,0,108,2,0,0,140,2,0,0,40,1,0,0,188,2,0,0,16,1,0,0,216,0,0,0,188,1,0,0,156,2,0,0,144,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,57,0,0,0,1,0,0,38,0,0,0,106,1,0,0,168,1,0,0,26,1,0,0,86,2,0,0,34,2,0,0,246,1,0,0,170,2,0,0,136,1,0,0,248,1,0,0,184,0,0,0,68,3,0,0,20,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,58,0,0,30,0,0,0,206,2,0,0,44,2,0,0,236,2,0,0,232,2,0,0,42,2,0,0,34,1,0,0,14,2,0,0,110,1,0,0,84,2,0,0,132,0,0,0,34,0,0,0,96,1,0,0,244,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,58,0,0,204,2,0,0,26,0,0,0,70,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,58,0,0,44,3,0,0,246,0,0,0,172,0,0,0,166,1,0,0,102,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,58,0,0,44,3,0,0,68,2,0,0,172,0,0,0,166,1,0,0,222,0,0,0,72,0,0,0,194,2,0,0,50,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,58,0,0,56,1,0,0,180,2,0,0,152,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,115,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,106,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,100,0,0,0,0,0,0,0,99,0,0,0,0,0,0,0,98,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,111,117,116,95,111,102,95,114,97,110,103,101,0,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,80,78,83,116,51,95,95,49,54,118,101,99,116,111,114,73,102,78,83,95,57,97,108,108,111,99,97,116,111,114,73,102,69,69,69,69,0,0,0,0,80,75,78,83,116,51,95,95,49,54,118,101,99,116,111,114,73,102,78,83,95,57,97,108,108,111,99,97,116,111,114,73,102,69,69,69,69,0,0,0,80,75,49,48,83,65,73,80,108,111,116,116,101,114,0,0,80,49,48,83,65,73,80,108,111,116,116,101,114,0,0,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49].concat([49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,118,101,99,116,111,114,73,102,78,83,95,57,97,108,108,111,99,97,116,111,114,73,102,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,49,95,95,98,97,115,105,99,95,115,116,114,105,110,103,95,99,111,109,109,111,110,73,76,98,49,69,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,118,101,99,116,111,114,95,98,97,115,101,95,99,111,109,109,111,110,73,76,98,49,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,95,95,118,101,99,116,111,114,95,98,97,115,101,73,102,78,83,95,57,97,108,108,111,99,97,116,111,114,73,102,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,49,50,115,97,105,95,105,110,116,101,114,110,97,108,55,83,65,73,66,97,115,101,69,0,0,0,0,0,0,0,0,78,49,48,101,109,115,99,114,105,112,116,101,110,51,118,97,108,69,0,0,0,0,0,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,69,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,51,95,95,102,117,110,100,97,109,101,110,116,97,108,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,57,95,95,112,111,105,110,116,101,114,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,112,98,97,115,101,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,68,110,0,0,0,0,0,0,57,83,65,73,80,97,114,97,109,115,0,0,0,0,0,0,57,73,72,67,80,97,114,97,109,115,0,0,0,0,0,0,57,67,65,82,80,97,114,97,109,115,0,0,0,0,0,0,57,65,71,67,80,97,114,97,109,115,0,0,0,0,0,0,51,83,65,73,0,0,0,0,49,48,83,65,73,80,108,111,116,116,101,114,0,0,0,0,0,36,0,0,112,36,0,0,0,36,0,0,200,36,0,0,0,0,0,0,216,36,0,0,0,0,0,0,232,36,0,0,0,0,0,0,248,36,0,0,120,51,0,0,0,0,0,0,0,0,0,0,8,37,0,0,120,51,0,0,0,0,0,0,0,0,0,0,24,37,0,0,120,51,0,0,0,0,0,0,0,0,0,0,48,37,0,0,208,51,0,0,0,0,0,0,0,0,0,0,72,37,0,0,208,51,0,0,0,0,0,0,0,0,0,0,96,37,0,0,120,51,0,0,0,0,0,0,0,0,0,0,112,37,0,0,0,0,0,0,80,55,0,0,0,0,0,0,152,37,0,0,1,0,0,0,80,55,0,0,0,0,0,0,192,37,0,0,1,0,0,0,216,58,0,0,0,0,0,0,208,37,0,0,0,0,0,0,216,58,0,0,0,0,0,0,224,37,0,0,40,36,0,0,248,37,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,64,57,0,0,0,0,0,0,40,36,0,0,64,38,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,72,57,0,0,0,0,0,0,40,36,0,0,136,38,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,80,57,0,0,0,0,0,0,40,36,0,0,208,38,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,88,57,0,0,0,0,0,0,0,0,0,0,24,39,0,0,24,54,0,0,0,0,0,0,0,0,0,0,72,39,0,0,24,54,0,0,0,0,0,0,40,36,0,0,120,39,0,0,0,0,0,0,1,0,0,0,56,56,0,0,0,0,0,0,40,36,0,0,144,39,0,0,0,0,0,0,1,0,0,0,56,56,0,0,0,0,0,0,40,36,0,0,168,39,0,0,0,0,0,0,1,0,0,0,64,56,0,0,0,0,0,0,40,36,0,0,192,39,0,0,0,0,0,0,1,0,0,0,64,56,0,0,0,0,0,0,40,36,0,0,216,39,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,240,57,0,0,0,8,0,0,40,36,0,0,32,40,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,240,57,0,0,0,8,0,0,40,36,0,0,104,40,0,0,0,0,0,0,3,0,0,0,104,55,0,0,2,0,0,0,32,52,0,0,2,0,0,0,216,55,0,0,0,8,0,0,40,36,0,0,176,40,0,0,0,0,0,0,3,0,0,0,104,55,0,0,2,0,0,0,32,52,0,0,2,0,0,0,224,55,0,0,0,8,0,0,0,0,0,0,248,40,0,0,104,55,0,0,0,0,0,0,0,0,0,0,16,41,0,0,104,55,0,0,0,0,0,0,40,36,0,0,40,41,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,72,56,0,0,2,0,0,0,40,36,0,0,64,41,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,72,56,0,0,2,0,0,0,0,0,0,0,88,41,0,0,0,0,0,0,112,41,0,0,200,56,0,0,0,0,0,0,40,36,0,0,144,41,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,200,52,0,0,0,0,0,0,40,36,0,0,216,41,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,224,52,0,0,0,0,0,0,40,36,0,0,32,42,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,248,52,0,0,0,0,0,0,40,36,0,0,104,42,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,16,53,0,0,0,0,0,0,0,0,0,0,176,42,0,0,104,55,0,0,0,0,0,0,0,0,0,0,200,42,0,0,104,55,0,0,0,0,0,0,40,36,0,0,224,42,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,216,56,0,0,2,0,0,0,40,36,0,0,8,43,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,216,56,0,0,2,0,0,0,40,36,0,0,48,43,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,216,56,0,0,2,0,0,0,40,36,0,0,88,43,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,216,56,0,0,2,0,0,0,40,36,0,0,128,43,0,0,0,0,0,0,1,0,0,0,176,56,0,0,0,0,0,0,0,0,0,0,168,43,0,0,48,56,0,0,0,0,0,0,0,0,0,0,192,43,0,0,104,55,0,0,0,0,0,0,40,36,0,0,216,43,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,232,57,0,0,2,0,0,0,40,36,0,0,240,43,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,232,57,0,0,2,0,0,0,0,0,0,0,8,44,0,0,0,0,0,0,48,44,0,0,0,0,0,0,88,44,0,0,0,0,0,0,128,44,0,0,0,0,0,0,168,44,0,0,16,57,0,0,0,0,0,0,0,0,0,0,200,44,0,0,48,55,0,0,0,0,0,0,0,0,0,0,240,44,0,0,48,55,0,0,0,0,0,0,0,0,0,0,24,45,0,0,0,0,0,0,80,45,0,0,0,0,0,0,136,45,0,0,0,0,0,0,168,45,0,0,0,0,0,0,200,45,0,0,0,0,0,0,232,45,0,0,0,0,0,0,8,46,0,0,40,36,0,0,32,46,0,0,0,0,0,0,1,0,0,0,168,52,0,0,3,244,255,255,40,36,0,0,80,46,0,0,0,0,0,0,1,0,0,0,184,52,0,0,3,244,255,255,40,36,0,0,128,46,0,0,0,0,0,0,1,0,0,0,168,52,0,0,3,244,255,255,40,36,0,0,176,46,0,0,0,0,0,0,1,0,0,0,184,52,0,0,3,244,255,255,40,36,0,0,224,46,0,0,0,0,0,0,1,0,0,0,208,55,0,0,0,0,0,0,0,0,0,0,16,47,0,0,160,51,0,0,0,0,0,0,0,0,0,0,40,47,0,0,40,36,0,0,64,47,0,0,0,0,0,0,1,0,0,0,200,55,0,0,0,0,0,0,40,36,0,0,128,47,0,0,0,0,0,0,1,0,0,0,200,55,0,0,0,0,0,0,0,0,0,0,192,47,0,0,40,56,0,0,0,0,0,0,0,0,0,0,216,47,0,0,24,56,0,0,0,0,0,0,0,0,0,0,248,47,0,0,32,56,0,0,0,0,0,0,0,0,0,0,24,48,0,0,0,0,0,0,56,48,0,0,0,0,0,0,88,48,0,0,0,0,0,0,120,48,0,0,40,36,0,0,152,48,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,224,57,0,0,2,0,0,0,40,36,0,0,184,48,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,224,57,0,0,2,0,0,0,40,36,0,0,216,48,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,224,57,0,0,2,0,0,0,40,36,0,0,248,48,0,0,0,0,0,0,2,0,0,0,104,55,0,0,2,0,0,0,224,57,0,0,2,0,0,0,0,0,0,0,24,49,0,0,0,0,0,0,48,49,0,0,0,0,0,0,72,49,0,0,0,0,0,0,96,49,0,0,24,56,0,0,0,0,0,0,0,0,0,0,120,49,0,0,32,56,0,0,0,0,0,0,0,0,0,0,144,49,0,0,0,0,0,0,176,49,0,0,0,0,0,0,200,49,0,0,0,0,0,0,232,49,0,0,144,58,0,0,0,0,0,0,0,0,0,0,16,50,0,0,128,58,0,0,0,0,0,0,0,0,0,0,56,50,0,0,128,58,0,0,0,0,0,0,0,0,0,0,96,50,0,0,112,58,0,0,0,0,0,0,0,0,0,0,136,50,0,0,144,58,0,0,0,0,0,0,0,0,0,0,176,50,0,0,144,58,0,0,0,0,0,0,0,0,0,0,216,50,0,0,112,51,0,0,0,0,0,0,0,36,0,0,0,51,0,0,0,0,0,0,8,51,0,0,0,0,0,0,24,51,0,0,0,0,0,0,40,51,0,0,0,0,0,0,56,51,0,0,0,0,0,0,72,51,0,0,24,58,0,0,0,0,0,0,0,0,0,0,80,51,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
HEAP32[((13168 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((13176 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((13184 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13200 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13216 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13232 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13248 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13264 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13280 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((13296 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((13312 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((13328 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((13344 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((13480 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13496 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13752 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13768 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((13848 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((13856 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14000 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14016 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14184 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14200 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14280 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14288 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14296 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14304 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14312 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14328 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14344 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14360 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14368 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14376 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14384 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14392 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14400 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14408 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14536 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14552 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14608 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14624 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14640 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14656 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14664 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14672 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14680 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14816 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14824 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14832 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14840 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14856 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14872 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14880 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14888 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((14896 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14912 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14928 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14944 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14960 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14976 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((14992 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((15016 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((15024 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((15032 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((15040 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((15048 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((15064 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___gxx_personality_v0() {
    }
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var _log=Math_log;
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  var _exp=Math_exp;
  var _llvm_pow_f64=Math_pow;
  var _sqrt=Math_sqrt;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  var _cosf=Math_cos;
  var _sinf=Math_sin;
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num) | 0;
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{8:42,9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var surf = _malloc(60);  // SDL_Surface has 15 fields of quantum size
        var buffer = _malloc(width*height*4); // TODO: only allocate when locked the first time
        var pixelFormat = _malloc(44);
        flags |= 1; // SDL_HWSURFACE - this tells SDL_MUSTLOCK that this needs to be locked
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var is_SDL_HWPALETTE = flags & 0x00200000;  
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        HEAP32[((surf)>>2)]=flags         // SDL_Surface.flags
        HEAP32[(((surf)+(4))>>2)]=pixelFormat // SDL_Surface.format TODO
        HEAP32[(((surf)+(8))>>2)]=width         // SDL_Surface.w
        HEAP32[(((surf)+(12))>>2)]=height        // SDL_Surface.h
        HEAP32[(((surf)+(16))>>2)]=width * bpp       // SDL_Surface.pitch, assuming RGBA or indexed for now,
                                                                                 // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer      // SDL_Surface.pixels
        HEAP32[(((surf)+(36))>>2)]=0      // SDL_Surface.offset
        HEAP32[(((surf)+(56))>>2)]=1
        HEAP32[((pixelFormat)>>2)]=0 /* XXX missing C define SDL_PIXELFORMAT_RGBA8888 */ // SDL_PIXELFORMAT_RGBA8888
        HEAP32[(((pixelFormat)+(4))>>2)]=0 // TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8
        HEAP8[(((pixelFormat)+(9))|0)]=bpp
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000
        // Decide if we want to use WebGL or not
        var useWebGL = (flags & 0x04000000) != 0; // SDL_OPENGL
        SDL.GL = SDL.GL || useWebGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0)
        };
        var ctx = Browser.createContext(canvas, useWebGL, usePageCanvas, webGLContextAttributes);
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
      },touchX:0,touchY:0,savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            var event = {
              type: 'mousedown',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 1;
            SDL.events.push(event);
            break;
          case 'touchmove':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            event = {
              type: 'mousemove',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.events.push(event);
            break;
          case 'touchend':
            event.preventDefault();
            event = {
              type: 'mouseup',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(event);
            break;
          case 'mousemove':
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = (event.type == 'DOMMouseScroll' ? event.detail : -event.wheelDelta) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
              SDL.DOMButtons[event.button] = 0;
            }
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28); // XXX
          return;
        }
        SDL.handleEvent(event);
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type]
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0
            HEAP8[(((ptr)+(9))|0)]=0 // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan
            HEAP32[(((ptr)+(16))>>2)]=key
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type]
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(9))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.button;
            HEAP8[(((ptr)+(6))|0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:0,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button.pressed;
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_Init(initFlags) {
      SDL.startTime = Date.now();
      SDL.initFlags = initFlags;
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
      if (initFlags & 0x200) {
        // SDL_INIT_JOYSTICK
        // Firefox will not give us Joystick data unless we register this NOP
        // callback.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
        addEventListener("gamepadconnected", function() {});
      }
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown'] = 0x300 /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup'] = 0x301 /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress'] = 0x303 /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown'] = 0x401 /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup'] = 0x402 /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove'] = 0x400 /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['unload'] = 0x100 /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize'] = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      // These are not technically DOM events; the HTML gamepad API is poll-based.
      // However, we define them here, as the rest of the SDL code assumes that
      // all SDL events originate as DOM events.
      SDL.DOMEventToSDLEvent['joystick_axis_motion'] = 0x600 /* SDL_JOYAXISMOTION */;
      SDL.DOMEventToSDLEvent['joystick_button_down'] = 0x603 /* SDL_JOYBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['joystick_button_up'] = 0x604 /* SDL_JOYBUTTONUP */;
      return 0; // success
    }
;
;
;
;
;
;
;
;
;
  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
      surfData.locked++;
      if (surfData.locked > 1) return 0;
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
      surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      if (surf == SDL.screen) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
      if (SDL.defaults.copyOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))|0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
        HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
      return 0;
    }
  function _fmin(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.min(x, y);
    }
  function _SDL_MapRGB(fmt, r, g, b) {
      // Canvas screens are always RGBA. We assume the machine is little-endian.
      return r&0xff|(g&0xff)<<8|(b&0xff)<<16|0xff000000;
    }
  function _SDL_UnlockSurface(surf) {
      assert(!SDL.GL); // in GL mode we do not keep around 2D canvases and contexts
      var surfData = SDL.surfaces[surf];
      surfData.locked--;
      if (surfData.locked > 0) return;
      // Copy pixel data to image
      if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
        SDL.copyIndexedColorData(surfData);
      } else if (!surfData.colors) {
        var data = surfData.image.data;
        var buffer = surfData.buffer;
        assert(buffer % 4 == 0, 'Invalid buffer offset: ' + buffer);
        var src = buffer >> 2;
        var dst = 0;
        var isScreen = surf == SDL.screen;
        var data32 = new Uint32Array(data.buffer);
        var num = data32.length;
        while (dst < num) {
          // HEAP32[src++] is an optimization. Instead, we could do HEAP32[(((buffer)+(dst))>>2)];
          data32[dst++] = HEAP32[src++] | (isScreen ? 0xff000000 : 0);
        }
      } else {
        var width = Module['canvas'].width;
        var height = Module['canvas'].height;
        var s = surfData.buffer;
        var data = surfData.image.data;
        var colors = surfData.colors;
        for (var y = 0; y < height; y++) {
          var base = y*width*4;
          for (var x = 0; x < width; x++) {
            // See comment above about signs
            var val = HEAPU8[((s++)|0)] * 3;
            var start = base + x*4;
            data[start]   = colors[val];
            data[start+1] = colors[val+1];
            data[start+2] = colors[val+2];
          }
          s += width*3;
        }
      }
      // Copy to canvas
      surfData.ctx.putImageData(surfData.image, 0, 0);
      // Note that we save the image, so future writes are fast. But, memory is not yet released
    }
  function _SDL_Flip(surf) {
      // We actually do this in Unlock, since the screen surface has as its canvas
      // backing the page canvas element
    }
  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        var canvas = Module['canvas'];
        width = canvas.width;
        height = canvas.height;
      }
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        SDL.screen = null;
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
;
;
;
;
;
;
;
;
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      __THREW__ = 0;
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___errno_location() {
      return ___errno_state;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _abort() {
      Module['abort']();
    }
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return tempRet0 = 0,0;
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return tempRet0 = HEAP32[(((tempDoublePtr)+(4))>>2)],HEAP32[((tempDoublePtr)>>2)];
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var FUNCTION_TABLE = [0,0,__ZNSt3__18messagesIwED0Ev,0,__ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNKSt3__18numpunctIcE12do_falsenameEv,0,__ZNKSt3__120__time_get_c_storageIwE3__rEv,0,__ZNKSt3__110moneypunctIwLb0EE16do_thousands_sepEv,0,__ZNSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_yearES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt12length_errorD0Ev,0,__ZN10emscripten8internal12MemberAccessI9AGCParamsfE7getWireIS2_EEfRKMS2_fRKT_,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED1Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_timeES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__17codecvtIwc11__mbstate_tED2Ev,0,__ZN12sai_internal7SAIBaseD0Ev,0,__ZNSt3__16locale2id6__initEv,0,__ZNSt3__110__stdinbufIcED1Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE14do_get_weekdayES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__110__stdinbufIcE9pbackfailEi,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9underflowEv,0,__ZNSt3__110__stdinbufIwED0Ev,0,__ZN10emscripten8internal14raw_destructorI9SAIParamsEEvPT_,0,__ZNSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt11logic_errorD0Ev,0,__ZNSt3__17codecvtIDsc11__mbstate_tED0Ev,0,__ZNKSt3__17collateIcE7do_hashEPKcS3_,0,__ZNKSt3__17codecvtIcc11__mbstate_tE16do_always_noconvEv,0,__ZNKSt3__120__time_get_c_storageIwE8__monthsEv,0,__ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_bRNS_8ios_baseEwRKNS_12basic_stringIwS3_NS_9allocatorIwEEEE,0,__ZNSt12out_of_rangeD0Ev,0,__ZNKSt3__110moneypunctIwLb1EE16do_positive_signEv,0,__ZNKSt3__15ctypeIwE10do_tolowerEPwPKw,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5uflowEv,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9IHCParamsvES3_PKS2_JEE6invokeERKS5_S7_,0,__ZNSt3__17collateIcED1Ev,0,__ZNSt3__18ios_base7failureD2Ev,0,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNSt9bad_allocD2Ev,0,__ZNK10SAIPlotter10sai_paramsEv,0,__ZNKSt3__110moneypunctIcLb1EE11do_groupingEv,0,__ZNSt3__16locale5facetD0Ev,0,__ZNKSt3__17codecvtIwc11__mbstate_tE6do_outERS1_PKwS5_RS5_PcS7_RS7_,0,__ZNKSt3__120__time_get_c_storageIwE3__cEv,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwy,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwx,0,__ZNSt3__15ctypeIcED0Ev,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwm,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwl,0,__ZNSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwe,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwd,0,__ZNKSt3__110moneypunctIcLb1EE16do_decimal_pointEv,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwb,0,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNKSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_bRNS_8ios_baseEcRKNS_12basic_stringIcS3_NS_9allocatorIcEEEE,0,__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE5do_inERS1_PKcS5_RS5_PDsS7_RS7_,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE13do_date_orderEv,0,__ZNSt3__18messagesIcED1Ev,0,__ZNKSt3__120__time_get_c_storageIwE7__weeksEv,0,__ZNKSt3__18numpunctIwE11do_groupingEv,0,__ZNSt3__16locale5facet16__on_zero_sharedEv,0,__ZN10emscripten8internal12MemberAccessI9IHCParamsbE7getWireIS2_EEbRKMS2_bRKT_,0,__ZNKSt3__15ctypeIwE8do_widenEc,0,__ZNKSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwPK2tmcc,0,__ZNSt3__110__stdinbufIcE5uflowEv,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9pbackfailEj,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_timeES4_S4_RNS_8ios_baseERjP2tm,0,__ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev,0,__ZN10emscripten8internal14raw_destructorI10SAIPlotterEEvPT_,0,__ZN10emscripten8internal13getActualTypeI10SAIPlotterEEPKNS0_7_TYPEIDEPT_,0,__ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5uflowEv,0,__ZNKSt3__110moneypunctIwLb0EE13do_neg_formatEv,0,__ZN10emscripten8internal12operator_newINSt3__16vectorIfNS2_9allocatorIfEEEEJEEEPT_DpT0_,0,__ZN3SAI5ResetEv,0,__ZNKSt3__15ctypeIcE8do_widenEc,0,__ZNSt3__110moneypunctIwLb0EED0Ev,0,__ZNSt3__16locale5__impD2Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9underflowEv,0,__ZNKSt3__15ctypeIcE10do_toupperEc,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwPKv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE11do_encodingEv,0,__ZNSt3__18numpunctIcED2Ev,0,__ZNKSt3__18numpunctIcE11do_groupingEv,0,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,0,__ZN10__cxxabiv119__pointer_type_infoD0Ev,0,__ZN10emscripten8internal15raw_constructorI9SAIParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE16do_get_monthnameES4_S4_RNS_8ios_baseERjP2tm,0,__ZNKSt3__120__time_get_c_storageIwE3__xEv,0,__ZNKSt3__110moneypunctIcLb1EE13do_neg_formatEv,0,__ZNSt3__110__stdinbufIwE9pbackfailEj,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterFvvEvPS2_JEE6invokeERKS4_S5_,0,__ZNKSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcPK2tmcc,0,__ZNSt3__18numpunctIcED0Ev,0,__ZNSt3__111__stdoutbufIcE8overflowEi,0,__ZNSt3__119__iostream_categoryD1Ev,0,__ZNKSt3__120__time_get_c_storageIwE7__am_pmEv,0,__ZNSt3__111__stdoutbufIwE5imbueERKNS_6localeE,0,__ZNKSt3__18messagesIcE8do_closeEi,0,__ZNKSt3__15ctypeIwE5do_isEPKwS3_Pt,0,__ZNSt13runtime_errorD2Ev,0,__ZNKSt3__15ctypeIwE10do_toupperEw,0,__ZNKSt3__15ctypeIwE9do_narrowEPKwS3_cPc,0,__ZN10emscripten8internal13getActualTypeINSt3__16vectorIfNS2_9allocatorIfEEEEEEPKNS0_7_TYPEIDEPT_,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterFvRK9CARParamsRK9IHCParamsRK9AGCParamsRK9SAIParamsEvPS2_JS5_S8_SB_SE_EE6invokeERKSG_SH_PS3_PS6_PS9_PSC_,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5imbueERKNS_6localeE,0,__ZNKSt3__110moneypunctIcLb0EE16do_negative_signEv,0,__ZNSt3__17collateIwED1Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE16do_get_monthnameES4_S4_RNS_8ios_baseERjP2tm,0,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNKSt8bad_cast4whatEv,0,__ZNSt3__110moneypunctIcLb0EED1Ev,0,__ZNKSt3__18messagesIcE6do_getEiiiRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE,0,__ZNSt3__18numpunctIwED2Ev,0,__ZNKSt3__110moneypunctIwLb1EE13do_pos_formatEv,0,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIfNS2_9allocatorIfEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_,0,__ZNSt3__15ctypeIwED0Ev,0,__ZNKSt13runtime_error4whatEv,0,_free,0,__ZNSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNSt3__117__widen_from_utf8ILj32EED0Ev,0,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,0,__ZNKSt3__18numpunctIwE16do_thousands_sepEv,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjP2tmcc,0,__ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNSt3__110__stdinbufIwED1Ev,0,__ZNKSt3__18numpunctIcE16do_decimal_pointEv,0,__ZN10emscripten8internal7InvokerIPNSt3__16vectorIfNS2_9allocatorIfEEEEJEE6invokeEPFS7_vE,0,__ZN10emscripten8internal15raw_constructorI9CARParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,0,__ZNKSt3__110moneypunctIwLb0EE16do_negative_signEv,0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNKSt3__120__time_get_c_storageIcE3__xEv,0,__ZNSt3__17collateIwED0Ev,0,__ZNKSt3__110moneypunctIcLb0EE16do_positive_signEv,0,__ZNSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE6do_outERS1_PKDsS5_RS5_PcS7_RS7_,0,__ZN10emscripten8internal12MemberAccessI9IHCParamsfE7getWireIS2_EEfRKMS2_fRKT_,0,__ZNSt11logic_errorD2Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekoffExNS_8ios_base7seekdirEj,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcy,0,__ZNSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNKSt3__18numpunctIwE16do_decimal_pointEv,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE4syncEv,0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNKSt3__17codecvtIcc11__mbstate_tE11do_encodingEv,0,__ZNKSt3__110moneypunctIcLb0EE11do_groupingEv,0,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNKSt3__110moneypunctIwLb1EE14do_frac_digitsEv,0,__ZNSt3__17codecvtIDic11__mbstate_tED0Ev,0,__ZNKSt3__110moneypunctIwLb1EE16do_negative_signEv,0,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNKSt3__120__time_get_c_storageIcE3__XEv,0,__ZNKSt3__15ctypeIwE9do_narrowEwc,0,__ZN3SAID1Ev,0,__ZNSt3__111__stdoutbufIwE4syncEv,0,__ZNSt3__110moneypunctIwLb0EED1Ev,0,__ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev,0,__ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev,0,__ZNSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__17collateIwE7do_hashEPKwS3_,0,__ZNSt3__111__stdoutbufIcE5imbueERKNS_6localeE,0,__ZNKSt3__110moneypunctIcLb1EE16do_thousands_sepEv,0,__ZNSt3__18ios_baseD0Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE16do_always_noconvEv,0,__ZNSt3__110moneypunctIcLb1EED0Ev,0,__ZNK10SAIPlotter10car_paramsEv,0,__ZNSt9bad_allocD0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED0Ev,0,__ZN10emscripten8internal12MemberAccessI9CARParamsfE7getWireIS2_EEfRKMS2_fRKT_,0,__ZN10emscripten8internal12operator_newI10SAIPlotterJfiEEEPT_DpT0_,0,__ZNKSt3__114error_category10equivalentEiRKNS_15error_conditionE,0,___cxx_global_array_dtor53,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsputnEPKci,0,___cxx_global_array_dtor56,0,__ZNKSt3__15ctypeIwE10do_scan_isEtPKwS3_,0,__ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED1Ev,0,__ZNSt3__110__stdinbufIwE5imbueERKNS_6localeE,0,__ZNKSt3__17collateIwE10do_compareEPKwS3_S3_S3_,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsgetnEPci,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv,0,__ZN10emscripten8internal12MemberAccessI9IHCParamsfE7setWireIS2_EEvRKMS2_fRT_f,0,__ZNKSt3__15ctypeIcE10do_tolowerEc,0,__ZNKSt3__110moneypunctIwLb1EE13do_neg_formatEv,0,__ZNKSt3__15ctypeIcE8do_widenEPKcS3_Pc,0,__ZNSt3__17codecvtIcc11__mbstate_tED0Ev,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9SAIParamsvES3_PKS2_JEE6invokeERKS5_S7_,0,__ZNKSt3__110moneypunctIwLb1EE16do_decimal_pointEv,0,__ZNKSt3__120__time_get_c_storageIcE7__weeksEv,0,__ZNKSt3__18numpunctIwE11do_truenameEv,0,__ZN10emscripten8internal12MemberAccessI9CARParamsfE7setWireIS2_EEvRKMS2_fRT_f,0,__ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev,0,__ZNSt3__110__stdinbufIwE9underflowEv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZNSt3__18ios_base7failureD0Ev,0,__ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__18ios_base4InitD2Ev,0,__ZNKSt3__15ctypeIwE5do_isEtw,0,__ZNSt3__110moneypunctIwLb1EED0Ev,0,__ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev,0,__ZNKSt3__15ctypeIcE9do_narrowEPKcS3_cPc,0,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIfNS2_9allocatorIfEEEEFvRKfEvPS6_JS8_EE6invokeERKSA_SB_f,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE14do_get_weekdayES4_S4_RNS_8ios_baseERjP2tm,0,__ZN10__cxxabiv120__si_class_type_infoD0Ev,0,__ZNKSt3__15ctypeIcE10do_toupperEPcPKc,0,__ZNKSt3__17codecvtIDic11__mbstate_tE16do_always_noconvEv,0,___cxx_global_array_dtor105,0,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6setbufEPwi,0,__ZNKSt3__18messagesIwE7do_openERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEERKNS_6localeE,0,__ZNKSt9bad_alloc4whatEv,0,__ZNSt3__111__stdoutbufIcED1Ev,0,__ZNKSt3__110moneypunctIcLb1EE14do_curr_symbolEv,0,__ZN10emscripten8internal12MemberAccessI9AGCParamsiE7setWireIS2_EEvRKMS2_iRT_i,0,__ZN10emscripten8internal12MemberAccessI9SAIParamsiE7setWireIS2_EEvRKMS2_iRT_i,0,__ZNSt3__16locale5__impD0Ev,0,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNKSt3__119__iostream_category4nameEv,0,__ZNKSt3__110moneypunctIcLb0EE14do_frac_digitsEv,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZNKSt3__110moneypunctIwLb1EE11do_groupingEv,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9CARParamsvES3_PKS2_JEE6invokeERKS5_S7_,0,__ZNSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNSt3__16vectorIfNS_9allocatorIfEEE9push_backERKf,0,__ZNSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNSt8bad_castD0Ev,0,__ZNKSt3__15ctypeIcE9do_narrowEcc,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRf,0,__ZN10emscripten8internal14raw_destructorI9IHCParamsEEvPT_,0,__ZNSt3__112__do_nothingEPv,0,__ZNSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,___cxx_global_array_dtor81,0,__ZNSt3__110moneypunctIcLb0EED0Ev,0,__ZNSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__17codecvtIDic11__mbstate_tE5do_inERS1_PKcS5_RS5_PDiS7_RS7_,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcPKv,0,__ZNKSt3__18numpunctIwE12do_falsenameEv,0,__ZNSt3__17collateIcED0Ev,0,__ZNKSt3__110moneypunctIwLb0EE13do_pos_formatEv,0,__ZNKSt3__110moneypunctIcLb1EE16do_negative_signEv,0,__ZNSt3__111__stdoutbufIcED0Ev,0,__ZNSt3__16locale5facetD2Ev,0,__ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev,0,__ZNSt3__112system_errorD0Ev,0,__ZN10emscripten8internal15raw_constructorI9IHCParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,0,__ZNKSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_bRNS_8ios_baseERjRe,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE8overflowEi,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9showmanycEv,0,__ZNSt3__110__stdinbufIwE5uflowEv,0,__ZNKSt3__18numpunctIcE11do_truenameEv,0,__ZNKSt3__17codecvtIwc11__mbstate_tE5do_inERS1_PKcS5_RS5_PwS7_RS7_,0,__ZN10emscripten8internal12VectorAccessINSt3__16vectorIfNS2_9allocatorIfEEEEE3getERKS6_j,0,__ZNKSt3__110moneypunctIcLb1EE13do_pos_formatEv,0,__ZNKSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_bRNS_8ios_baseEwe,0,__ZNKSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_bRNS_8ios_baseERjRe,0,__ZNSt3__17codecvtIwc11__mbstate_tED0Ev,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_,0,__ZNKSt3__18numpunctIcE16do_thousands_sepEv,0,__ZNSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9showmanycEv,0,__ZNSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_dateES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE8overflowEj,0,__ZNSt3__18numpunctIwED0Ev,0,__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5imbueERKNS_6localeE,0,__ZNKSt3__15ctypeIwE10do_tolowerEw,0,__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorIfNS3_9allocatorIfEEEEjES2_S9_JjEE6invokeEPSB_PS7_j,0,__ZN10emscripten8internal12MemberAccessI9AGCParamsiE7getWireIS2_EEiRKMS2_iRKT_,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE4syncEv,0,__ZNSt3__111__stdoutbufIcE4syncEv,0,__ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED1Ev,0,__ZNKSt3__17collateIcE10do_compareEPKcS3_S3_S3_,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekposENS_4fposI11__mbstate_tEEj,0,__ZNSt3__110__stdinbufIcE5imbueERKNS_6localeE,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9AGCParamsvES3_PKS2_JEE6invokeERKS5_S7_,0,__ZNKSt3__17collateIwE12do_transformEPKwS3_,0,__ZNKSt3__17codecvtIDic11__mbstate_tE6do_outERS1_PKDiS5_RS5_PcS7_RS7_,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcx,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEce,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcd,0,__ZNKSt3__17codecvtIcc11__mbstate_tE13do_max_lengthEv,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcb,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcm,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcl,0,__ZNSt8bad_castD2Ev,0,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,0,__ZNKSt3__17codecvtIcc11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNKSt3__110moneypunctIcLb1EE14do_frac_digitsEv,0,__ZNKSt3__17codecvtIcc11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZNKSt3__120__time_get_c_storageIcE3__rEv,0,__ZNKSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_bRNS_8ios_baseERjRNS_12basic_stringIcS3_NS_9allocatorIcEEEE,0,__ZNKSt3__15ctypeIwE10do_toupperEPwPKw,0,__ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev,0,__ZNSt3__110__stdinbufIcE9underflowEv,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekposENS_4fposI11__mbstate_tEEj,0,__ZNKSt3__114error_category23default_error_conditionEi,0,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE11do_encodingEv,0,__ZNKSt3__18messagesIwE8do_closeEi,0,__ZNSt3__112system_errorD2Ev,0,__ZNKSt3__17codecvtIwc11__mbstate_tE16do_always_noconvEv,0,__ZNKSt3__110moneypunctIwLb0EE11do_groupingEv,0,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNKSt3__16vectorIfNS_9allocatorIfEEE4sizeEv,0,__ZNKSt3__17codecvtIwc11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNKSt3__110moneypunctIcLb0EE16do_decimal_pointEv,0,__ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRy,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRx,0,__ZN10emscripten8internal7InvokerIP10SAIPlotterJfiEE6invokeEPFS3_fiEfi,0,__ZNKSt3__120__time_get_c_storageIcE8__monthsEv,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRt,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRm,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRl,0,__ZNSt3__111__stdoutbufIwE6xsputnEPKwi,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRb,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRe,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRd,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRf,0,__ZN10emscripten8internal15raw_constructorI9AGCParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,0,__ZNKSt3__110moneypunctIcLb0EE16do_thousands_sepEv,0,__ZNKSt3__114error_category10equivalentERKNS_10error_codeEi,0,__ZNKSt3__110moneypunctIcLb0EE13do_neg_formatEv,0,__ZNK10SAIPlotter10agc_paramsEv,0,__ZNKSt11logic_error4whatEv,0,__ZNKSt3__119__iostream_category7messageEi,0,__ZN10emscripten8internal13MethodInvokerIM10SAIPlotterFvijEvPS2_JijEE6invokeERKS4_S5_ij,0,__ZN10SAIPlotter5ResetEv,0,__ZNKSt3__110moneypunctIcLb0EE13do_pos_formatEv,0,__ZN10SAIPlotter17ComputeAndPlotSAIEij,0,__ZN10emscripten8internal12VectorAccessINSt3__16vectorIfNS2_9allocatorIfEEEEE3setERS6_jRKf,0,__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev,0,__ZNKSt3__110moneypunctIwLb0EE16do_decimal_pointEv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNKSt3__17collateIcE12do_transformEPKcS3_,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsgetnEPwi,0,__ZNKSt3__17codecvtIwc11__mbstate_tE13do_max_lengthEv,0,__ZNKSt3__110moneypunctIwLb0EE14do_frac_digitsEv,0,__ZNSt3__18messagesIcED0Ev,0,__ZNKSt3__15ctypeIcE10do_tolowerEPcPKc,0,__ZN3SAID0Ev,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjP2tmcc,0,__ZN10SAIPlotter8RedesignERK9CARParamsRK9IHCParamsRK9AGCParamsRK9SAIParams,0,__ZNKSt3__120__time_get_c_storageIcE7__am_pmEv,0,__ZNKSt3__110moneypunctIcLb0EE14do_curr_symbolEv,0,__ZNKSt3__15ctypeIwE8do_widenEPKcS3_Pw,0,__ZNKSt3__110moneypunctIwLb1EE16do_thousands_sepEv,0,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNKSt3__17codecvtIwc11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorIfNS2_9allocatorIfEEEEjRKfEbS7_JjS9_EE6invokeEPSB_PS6_jf,0,__ZNSt3__18ios_baseD2Ev,0,__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev,0,__ZN12sai_internal7SAIBaseD1Ev,0,__ZNSt3__110__stdinbufIcED0Ev,0,__ZNKSt3__17codecvtIwc11__mbstate_tE11do_encodingEv,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE13do_date_orderEv,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_yearES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__119__iostream_categoryD0Ev,0,__ZNSt3__110moneypunctIwLb1EED1Ev,0,__ZNKSt3__110moneypunctIwLb0EE14do_curr_symbolEv,0,__ZNKSt3__18messagesIcE7do_openERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEERKNS_6localeE,0,__ZN10emscripten8internal12MemberAccessI9AGCParamsfE7setWireIS2_EEvRKMS2_fRT_f,0,__ZN10emscripten8internal12MemberAccessI9SAIParamsiE7getWireIS2_EEiRKMS2_iRKT_,0,__ZNSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__110moneypunctIcLb1EED1Ev,0,__ZNSt3__111__stdoutbufIwED0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekoffExNS_8ios_base7seekdirEj,0,__ZNKSt3__120__time_get_c_storageIcE3__cEv,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6setbufEPci,0,__ZN10emscripten8internal14raw_destructorI9AGCParamsEEvPT_,0,__ZNKSt3__110moneypunctIwLb0EE16do_positive_signEv,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_,0,__ZNKSt3__120__time_get_c_storageIwE3__XEv,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_dateES4_S4_RNS_8ios_baseERjP2tm,0,__ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev,0,__ZNKSt3__17codecvtIcc11__mbstate_tE6do_outERS1_PKcS5_RS5_PcS7_RS7_,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9pbackfailEi,0,__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev,0,__ZNSt3__111__stdoutbufIwE8overflowEj,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRy,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRx,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRt,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRm,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRl,0,__ZNKSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_bRNS_8ios_baseEce,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRe,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRd,0,__ZNSt3__116__narrow_to_utf8ILj32EED0Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE13do_max_lengthEv,0,__ZNSt3__111__stdoutbufIcE6xsputnEPKci,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRb,0,___cxx_global_array_dtor,0,__ZN10emscripten8internal12MemberAccessI9IHCParamsbE7setWireIS2_EEvRKMS2_bRT_b,0,__ZNSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZN10__cxxabiv117__class_type_infoD0Ev,0,__ZNSt3__18messagesIwED1Ev,0,__ZNSt3__111__stdoutbufIwED1Ev,0,__ZN10emscripten8internal14raw_destructorINSt3__16vectorIfNS2_9allocatorIfEEEEEEvPT_,0,__ZNKSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_bRNS_8ios_baseERjRNS_12basic_stringIwS3_NS_9allocatorIwEEEE,0,__ZN10__cxxabiv116__shim_type_infoD2Ev,0,__ZNKSt3__15ctypeIwE11do_scan_notEtPKwS3_,0,__ZNKSt3__110moneypunctIwLb1EE14do_curr_symbolEv,0,__ZNSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNKSt3__18messagesIwE6do_getEiiiRKNS_12basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEEE,0,__ZN10emscripten8internal14raw_destructorI9CARParamsEEvPT_,0,__ZNKSt3__17codecvtIcc11__mbstate_tE5do_inERS1_PKcS5_RS5_PcS7_RS7_,0,___getTypeName,0,__ZNSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNKSt3__110moneypunctIcLb1EE16do_positive_signEv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE13do_max_lengthEv,0,__ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsputnEPKwi,0,__ZN12sai_internal7SAIBase5ResetEv,0,__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED1Ev,0,__ZNSt3__15ctypeIcED2Ev,0,__ZNSt13runtime_errorD0Ev,0,__ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev,0,___cxx_global_array_dtor120,0,__ZNK10SAIPlotter10ihc_paramsEv,0];
// EMSCRIPTEN_START_FUNCS
function __ZN6CARFAC8RedesignEifRK9CARParamsRK9IHCParamsRK9AGCParams(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+352|0;r9=r8;r10=r8+8;r11=r8+16;r12=r8+24;r13=r8+32;r14=r8+40;r15=r8+48;r16=r8+64;r17=r8+72;r18=r8+224;r19=r8+280;r20=r8+336;r21=r1+132|0;HEAP32[r21>>2]=r2;r2=r1+136|0;HEAPF32[r2>>2]=r3;r22=r1;r23=r4;_memcpy(r22,r23,44)|0;r23=r1+44|0;r22=r5|0;HEAP32[r23>>2]=HEAP32[r22>>2];HEAP32[r23+4>>2]=HEAP32[r22+4>>2];HEAP32[r23+8>>2]=HEAP32[r22+8>>2];HEAP32[r23+12>>2]=HEAP32[r22+12>>2];HEAP32[r23+16>>2]=HEAP32[r22+16>>2];HEAP32[r23+20>>2]=HEAP32[r22+20>>2];HEAP32[r23+24>>2]=HEAP32[r22+24>>2];r22=r1+72|0;r5=r22|0;HEAP32[r5>>2]=HEAP32[r6>>2];r4=r1+76|0;HEAPF32[r4>>2]=HEAPF32[r6+4>>2];r24=r1+80|0;HEAPF32[r24>>2]=HEAPF32[r6+8>>2];if((r22|0)==(r6|0)){r25=r3}else{__ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+84|0,HEAP32[r6+12>>2],HEAP32[r6+16>>2]);__ZNSt3__16vectorIiNS_9allocatorIiEEE6assignIPiEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIiNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+96|0,HEAP32[r6+24>>2],HEAP32[r6+28>>2]);__ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+108|0,HEAP32[r6+36>>2],HEAP32[r6+40>>2]);__ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+120|0,HEAP32[r6+48>>2],HEAP32[r6+52>>2]);r25=HEAPF32[r2>>2]}r6=r1+140|0;HEAP32[r6>>2]=0;r3=r1+16|0;r22=HEAPF32[r3>>2]*r25/6.283185307179586;r25=HEAPF32[r1+32>>2];if(r22>r25){r26=HEAPF32[r1+28>>2];r27=HEAPF32[r1+36>>2];r28=HEAPF32[r1+40>>2];r29=r22;r22=0;while(1){r30=r22+1|0;r31=r29-r26*((r29+r27)/r28);if(r31>r25){r29=r31;r22=r30}else{break}}HEAP32[r6>>2]=r30;r32=r30}else{r32=0}r30=r1+160|0;r22=r1+164|0;do{if((HEAP32[r22>>2]|0)!=(r32|0)){r29=r30|0;r25=HEAP32[r29>>2];if((r25|0)!=0){_free(HEAP32[r25-4>>2])}if((r32|0)==0){HEAP32[r29>>2]=0;break}if(r32>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r25=r32<<2;r28=_malloc(r25+16|0);if((r28|0)==0){r33=0}else{r27=r28+16&-16;HEAP32[r27-4>>2]=r28;r33=r27}if((r33|0)!=0|(r25|0)==0){HEAP32[r29>>2]=r33;break}else{__ZN5Eigen8internal19throw_std_bad_allocEv()}}}while(0);HEAP32[r22>>2]=r32;do{if((HEAP32[r6>>2]|0)>0){r33=r30|0;r29=r1+28|0;r25=r1+36|0;r27=r1+40|0;r28=HEAPF32[r3>>2]*HEAPF32[r2>>2]/6.283185307179586;r26=0;r31=r32;while(1){if((r31|0)<=(r26|0)){r7=22;break}HEAPF32[HEAP32[r33>>2]+(r26<<2)>>2]=r28;r34=r26+1|0;if((r34|0)>=(HEAP32[r6>>2]|0)){r7=25;break}r28=r28-HEAPF32[r29>>2]*((r28+HEAPF32[r25>>2])/HEAPF32[r27>>2]);r26=r34;r31=HEAP32[r22>>2]}if(r7==22){___assert_fail(4232,2464,407,5864)}else if(r7==25){r35=HEAP32[r22>>2];break}}else{r35=r32}}while(0);if((r35|0)<=0){___assert_fail(4232,2464,407,5864)}r32=r30|0;r3=HEAP32[r32>>2];if((r35|0)<=1){___assert_fail(4232,2464,407,5864)}HEAPF32[r1+144>>2]=.6931471805599453/Math_log(HEAPF32[r3>>2]/HEAPF32[r3+4>>2]);_memset(r18+8|0,0,48);r3=r20|0;HEAP32[r3>>2]=0;r31=r20+4|0;HEAP32[r31>>2]=0;r26=r20+8|0;HEAP32[r26>>2]=0;r27=HEAPF32[r2>>2];HEAPF32[r18>>2]=HEAPF32[r1>>2];HEAPF32[r18+4>>2]=HEAPF32[r1+4>>2];r25=r18+8|0;r28=r25|0;r29=r18+12|0;r33=(r35|0)==0;if(r35>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r34=r35<<2;r36=_malloc(r34+16|0);if((r36|0)==0){r37=0}else{r38=r36+16&-16;HEAP32[r38-4>>2]=r36;r37=r38}if(!((r37|0)!=0|(r34|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r25>>2]=r37;HEAP32[r29>>2]=r35;r37=r18+16|0;r34=r37|0;r38=r18+20|0;do{if((HEAP32[r38>>2]|0)!=(r35|0)){r36=r37|0;r39=HEAP32[r36>>2];if((r39|0)!=0){_free(HEAP32[r39-4>>2])}if(r33){HEAP32[r36>>2]=0;break}if(r35>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r39=r35<<2;r40=_malloc(r39+16|0);if((r40|0)==0){r41=0}else{r42=r40+16&-16;HEAP32[r42-4>>2]=r40;r41=r42}if((r41|0)!=0|(r39|0)==0){HEAP32[r36>>2]=r41;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);HEAP32[r38>>2]=r35;r41=r18+24|0;r36=r41|0;r39=r18+28|0;do{if((HEAP32[r39>>2]|0)!=(r35|0)){r42=r41|0;r40=HEAP32[r42>>2];if((r40|0)!=0){_free(HEAP32[r40-4>>2])}if(r33){HEAP32[r42>>2]=0;break}if(r35>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r40=r35<<2;r43=_malloc(r40+16|0);if((r43|0)==0){r44=0}else{r45=r43+16&-16;HEAP32[r45-4>>2]=r43;r44=r45}if((r44|0)!=0|(r40|0)==0){HEAP32[r42>>2]=r44;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);HEAP32[r39>>2]=r35;r44=r18+32|0;r42=r44|0;r40=r18+36|0;do{if((HEAP32[r40>>2]|0)!=(r35|0)){r45=r44|0;r43=HEAP32[r45>>2];if((r43|0)!=0){_free(HEAP32[r43-4>>2])}if(r33){HEAP32[r45>>2]=0;break}if(r35>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r43=r35<<2;r46=_malloc(r43+16|0);if((r46|0)==0){r47=0}else{r48=r46+16&-16;HEAP32[r48-4>>2]=r46;r47=r48}if((r47|0)!=0|(r43|0)==0){HEAP32[r45>>2]=r47;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);HEAP32[r40>>2]=r35;r47=r18+40|0;r45=r47|0;r43=r18+44|0;do{if((HEAP32[r43>>2]|0)!=(r35|0)){r48=r47|0;r46=HEAP32[r48>>2];if((r46|0)!=0){_free(HEAP32[r46-4>>2])}if(r33){HEAP32[r48>>2]=0;break}if(r35>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r46=r35<<2;r49=_malloc(r46+16|0);if((r49|0)==0){r50=0}else{r51=r49+16&-16;HEAP32[r51-4>>2]=r49;r50=r51}if((r50|0)!=0|(r46|0)==0){HEAP32[r48>>2]=r50;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);HEAP32[r43>>2]=r35;r43=HEAPF32[r1+20>>2];r50=r43*r43-1;HEAP32[r11>>2]=r30;HEAPF32[r11+4>>2]=6.283185307179586/r27;__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_12CwiseUnaryOpINS_8internal18scalar_multiple_opIfEEKS1_EEEERKNS_9ArrayBaseIT_EE(r10,r11);r11=r10+4|0;r27=HEAP32[r11>>2];if((r27|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r36,r27);if((HEAP32[r39>>2]|0)!=(r27|0)){___assert_fail(2264,2200,510,5960)}r36=(r27|0)>0;do{if(r36){r30=r41|0;r43=HEAP32[r10>>2];r33=Math_sin(HEAPF32[r43>>2]);HEAPF32[HEAP32[r30>>2]>>2]=r33;if((r27|0)>1){r52=1}else{break}while(1){r33=Math_sin(HEAPF32[r43+(r52<<2)>>2]);HEAPF32[HEAP32[r30>>2]+(r52<<2)>>2]=r33;r33=r52+1|0;if((r33|0)<(r27|0)){r52=r33}else{break}}}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r34,r27);if((HEAP32[r38>>2]|0)!=(r27|0)){___assert_fail(2264,2200,510,5960)}do{if(r36){r34=r37|0;r52=HEAP32[r10>>2];r30=Math_cos(HEAPF32[r52>>2]);HEAPF32[HEAP32[r34>>2]>>2]=r30;if((r27|0)>1){r30=1;while(1){r43=Math_cos(HEAPF32[r52+(r30<<2)>>2]);HEAPF32[HEAP32[r34>>2]+(r30<<2)>>2]=r43;r43=r30+1|0;if((r43|0)<(r27|0)){r30=r43}else{r7=113;break}}}else{r53=HEAPF32[r1+24>>2];r54=r12|0;r55=r12|0;break}}else{r7=113}}while(0);do{if(r7==113){if(r27>>>0<=1073741823){r53=HEAPF32[r1+24>>2];r54=r12|0;r55=r12|0;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);r36=r27<<2;r30=_malloc(r36+16|0);if((r30|0)==0){r56=0}else{r34=r30+16&-16;HEAP32[r34-4>>2]=r30;r56=r34}if(!((r56|0)!=0|(r36|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r55>>2]=r56;r56=r12+4|0;HEAP32[r56>>2]=r27;r27=HEAP32[r11>>2];if((r27|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r54,r27);if((HEAP32[r56>>2]|0)!=(r27|0)){___assert_fail(2264,2200,510,5960)}r56=(r27|0)>0;do{if(r56){r54=HEAP32[r10>>2];r11=HEAP32[r55>>2];HEAPF32[r11>>2]=HEAPF32[r54>>2]*.31830987334251404;if((r27|0)>1){r57=1}else{break}while(1){HEAPF32[r11+(r57<<2)>>2]=HEAPF32[r54+(r57<<2)>>2]*.31830987334251404;r12=r57+1|0;if((r12|0)<(r27|0)){r57=r12}else{break}}}}while(0);r57=r18+48|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r57|0,r27);r54=r18+52|0;if((HEAP32[r54>>2]|0)!=(r27|0)){___assert_fail(2264,2200,510,5960)}if(r56){r56=r57|0;r11=HEAP32[r55>>2];r12=0;while(1){r36=HEAPF32[r11+(r12<<2)>>2];HEAPF32[HEAP32[r56>>2]+(r12<<2)>>2]=(r36-r53*r36*r36*r36)*3.1415927410125732;r36=r12+1|0;if((r36|0)<(r27|0)){r12=r36}else{break}}r58=HEAP32[r54>>2]}else{r58=r27}r27=HEAPF32[r1+12>>2];r12=HEAPF32[r1+8>>2];if((r58|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r28,r58);r58=HEAP32[r29>>2];if((r58|0)!=(HEAP32[r54>>2]|0)){___assert_fail(2264,2200,510,5960)}do{if((r58|0)>0){r28=r25|0;r53=r57|0;HEAPF32[HEAP32[r28>>2]>>2]=1-r27*HEAPF32[HEAP32[r53>>2]>>2];if((r58|0)>1){r59=1}else{break}while(1){HEAPF32[HEAP32[r28>>2]+(r59<<2)>>2]=1-r27*HEAPF32[HEAP32[r53>>2]+(r59<<2)>>2];r56=r59+1|0;if((r56|0)<(r58|0)){r59=r56}else{break}}}}while(0);if(r35>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r59=r35<<2;r58=r59+16|0;r53=_malloc(r58);if((r53|0)==0){r60=0}else{r28=r53+16&-16;HEAP32[r28-4>>2]=r53;r60=r28}r28=(r59|0)==0;if(!((r60|0)!=0|r28)){__ZN5Eigen8internal19throw_std_bad_allocEv()}r59=r60;if((r35|0)<=-1){___assert_fail(5240,5e3,151,6e3)}r53=r1+36|0;r56=r1+40|0;r11=0;while(1){if((HEAP32[r22>>2]|0)<=(r11|0)){r7=166;break}HEAPF32[r59+(r11<<2)>>2]=(HEAPF32[r53>>2]+HEAPF32[HEAP32[r32>>2]+(r11<<2)>>2])/HEAPF32[r56>>2];r36=r11+1|0;if((r36|0)<(r35|0)){r11=r36}else{break}}if(r7==166){___assert_fail(4232,2464,186,5864)}if((r35|0)!=(HEAP32[r22>>2]|0)){___assert_fail(4424,4272,144,6032)}r11=r13|0;r56=_malloc(r58);if((r56|0)==0){r61=0}else{r58=r56+16&-16;HEAP32[r58-4>>2]=r56;r61=r58}if(!((r61|0)!=0|r28)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r11>>2]=r61;r61=r13+4|0;HEAP32[r61>>2]=r35;r28=HEAP32[r22>>2];if((r28|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r13|0,r28);r28=HEAP32[r61>>2];if((r28|0)!=(HEAP32[r22>>2]|0)){___assert_fail(2264,2200,510,5960)}r22=(r28|0)>0;if(r22){r61=HEAP32[r11>>2];r13=0;while(1){HEAPF32[r61+(r13<<2)>>2]=r12+(HEAPF32[r59+(r13<<2)>>2]/HEAPF32[HEAP32[r32>>2]+(r13<<2)>>2]-r12)*.25;r58=r13+1|0;if((r58|0)<(r28|0)){r13=r58}else{break}}}if((HEAP32[r54>>2]|0)!=(r28|0)){___assert_fail(1160,920,149,5960)}do{if(r22){r13=r57|0;r12=HEAP32[r13>>2];r32=HEAP32[r11>>2];HEAPF32[r12>>2]=HEAPF32[r12>>2]*(r27-HEAPF32[r32>>2]);if((r28|0)>1){r62=1}else{break}while(1){r12=HEAP32[r13>>2]+(r62<<2)|0;HEAPF32[r12>>2]=HEAPF32[r12>>2]*(r27-HEAPF32[r32+(r62<<2)>>2]);r12=r62+1|0;if((r12|0)<(r28|0)){r62=r12}else{break}}}}while(0);r62=HEAP32[r39>>2];if((r62|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r42,r62);r62=HEAP32[r40>>2];if((r62|0)!=(HEAP32[r39>>2]|0)){___assert_fail(2264,2200,510,5960)}do{if((r62|0)>0){r42=r44|0;r28=r41|0;HEAPF32[HEAP32[r42>>2]>>2]=r50*HEAPF32[HEAP32[r28>>2]>>2];if((r62|0)>1){r63=1}else{break}while(1){HEAPF32[HEAP32[r42>>2]+(r63<<2)>>2]=r50*HEAPF32[HEAP32[r28>>2]+(r63<<2)>>2];r27=r63+1|0;if((r27|0)<(r62|0)){r63=r27}else{break}}}}while(0);HEAP32[r15>>2]=r35;HEAPF32[r15+8>>2]=1;__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_14CwiseNullaryOpINS_8internal18scalar_constant_opIfEES1_EEEERKNS_9ArrayBaseIT_EE(r14,r15);r15=HEAP32[r54>>2];r54=r14+4|0;if((r15|0)!=(HEAP32[r54>>2]|0)){___assert_fail(4424,4272,144,6032)}if((HEAP32[r29>>2]|0)!=(r15|0)){___assert_fail(4424,4272,144,6032)}r29=r16|0;if(r15>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r35=r15<<2;r63=_malloc(r35+16|0);if((r63|0)==0){r64=0}else{r62=r63+16&-16;HEAP32[r62-4>>2]=r63;r64=r62}if(!((r64|0)!=0|(r35|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r29>>2]=r64;r64=r16+4|0;HEAP32[r64>>2]=r15;r15=HEAP32[r54>>2];if((r15|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r16|0,r15);if((HEAP32[r64>>2]|0)!=(r15|0)){___assert_fail(2264,2200,510,5960)}if((r15|0)>0){r54=r25|0;r25=r57|0;r57=HEAP32[r14>>2];r35=0;while(1){HEAPF32[HEAP32[r29>>2]+(r35<<2)>>2]=HEAPF32[HEAP32[r54>>2]+(r35<<2)>>2]+HEAPF32[HEAP32[r25>>2]+(r35<<2)>>2]*HEAPF32[r57+(r35<<2)>>2];r62=r35+1|0;if((r62|0)<(r15|0)){r35=r62}else{break}}r65=HEAP32[r64>>2]}else{r65=r15}if((r65|0)!=(HEAP32[r38>>2]|0)){___assert_fail(4424,4272,144,6032)}if((HEAP32[r40>>2]|0)!=(r65|0)){___assert_fail(4424,4272,144,6032)}if((r65|0)!=(HEAP32[r39>>2]|0)){___assert_fail(4424,4272,144,6032)}HEAP32[r17+20>>2]=r16;HEAPF32[r17+24>>2]=2;HEAP32[r17+28>>2]=r37;HEAPF32[r17+40>>2]=1;HEAP32[r17+44>>2]=r16;HEAP32[r17+48>>2]=r16;HEAP32[r17+80>>2]=r16;HEAPF32[r17+84>>2]=2;HEAP32[r17+88>>2]=r37;HEAPF32[r17+100>>2]=1;HEAP32[r17+108>>2]=r44;HEAP32[r17+112>>2]=r16;HEAP32[r17+120>>2]=r41;HEAP32[r17+132>>2]=r16;HEAP32[r17+136>>2]=r16;if((r65|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r45,r65);__ZN5Eigen9DenseBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE10lazyAssignINS_13CwiseBinaryOpINS_8internal18scalar_quotient_opIfEEKNS5_INS6_13scalar_sum_opIfEEKNS_12CwiseUnaryOpINS6_13scalar_add_opIfEEKNSB_INS6_18scalar_opposite_opIfEEKNS5_INS6_17scalar_product_opIffEEKNSB_INS6_18scalar_multiple_opIfEEKS2_EESK_EEEEEEKNS5_ISH_SK_SK_EEEEKNS5_ISA_KNS5_ISA_SS_KNS5_ISH_SU_SK_EEEESU_EEEEEERS2_RKNS0_IT_EE(r47,r17);r17=HEAP32[r29>>2];if((r17|0)!=0){_free(HEAP32[r17-4>>2])}r17=HEAP32[r14>>2];if((r17|0)!=0){_free(HEAP32[r17-4>>2])}r17=HEAP32[r11>>2];if((r17|0)!=0){_free(HEAP32[r17-4>>2])}if((r60|0)!=0){_free(HEAP32[r60-4>>2])}r60=HEAP32[r55>>2];if((r60|0)!=0){_free(HEAP32[r60-4>>2])}r60=HEAP32[r10>>2];if((r60|0)!=0){_free(HEAP32[r60-4>>2])}r60=HEAPF32[r2>>2];r10=HEAP8[r23]&1;L353:do{if(r10<<24>>24==0){r23=r9|0;r55=_malloc(20);do{if((r55|0)!=0){r17=r55+16&-16;HEAP32[r17-4>>2]=r55;if((r17|0)==0){break}r11=r17;HEAP32[r23>>2]=r11;r17=r9+4|0;HEAP32[r17>>2]=1;HEAPF32[r11>>2]=10;__Z12CARFACDetectPN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r9);if((HEAP32[r17>>2]|0)<=0){___assert_fail(4232,2464,407,5864)}r11=HEAP32[r23>>2];r14=HEAPF32[r11>>2];HEAPF32[r11>>2]=0;__Z12CARFACDetectPN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r9);if((HEAP32[r17>>2]|0)<=0){___assert_fail(4232,2464,407,5864)}r17=HEAP32[r23>>2];r11=HEAPF32[r17>>2];r29=HEAP8[r1+45|0]&1;r47=1/r14;if(r29<<24>>24==0){r14=HEAPF32[r1+60>>2];r65=HEAPF32[r1+64>>2];r45=r65/(r14/r47);r16=HEAPF32[r1+52>>2];r41=HEAPF32[r1+56>>2];r44=r41/(r16/r45);r37=1/(r45+r44+1/r11);r39=1-r44*r37;HEAPF32[r19+44>>2]=r39;r40=r39-r45*r37;HEAPF32[r19+48>>2]=r40;HEAP8[r19|0]=0;HEAPF32[r19+4>>2]=1-Math_exp(-1/(HEAPF32[r1+48>>2]*r60));HEAPF32[r19+8>>2]=1/(r16*r60);HEAPF32[r19+12>>2]=1/(r41*r60);HEAPF32[r19+16>>2]=r47/(r14*r60);HEAPF32[r19+20>>2]=1/(r65*r60);HEAP8[r19+1|0]=0;r65=1/(r47*2+r45+r44)-r37;HEAPF32[r19+24>>2]=1/r65;HEAPF32[r19+28>>2]=r37/r65;HEAPF32[r19+32>>2]=r39;HEAPF32[r19+36>>2]=r40}else{r40=HEAPF32[r1+52>>2];r39=HEAPF32[r1+56>>2];r65=r39/(r40/r47);r37=1/(r65+1/r11);r11=1-r65*r37;HEAPF32[r19+44>>2]=r11;HEAP8[r19|0]=0;HEAPF32[r19+4>>2]=1-Math_exp(-1/(HEAPF32[r1+48>>2]*r60));HEAPF32[r19+8>>2]=r47/(r40*r60);HEAPF32[r19+12>>2]=1/(r39*r60);HEAP8[r19+1|0]=r29;r29=1/(r47*2+r65)-r37;HEAPF32[r19+24>>2]=1/r29;HEAPF32[r19+28>>2]=r37/r29;HEAPF32[r19+32>>2]=r11}if((r17|0)==0){break L353}_free(HEAP32[r17-4>>2]);break L353}}while(0);__ZN5Eigen8internal19throw_std_bad_allocEv()}else{HEAP8[r19|0]=r10}}while(0);HEAPF32[r19+40>>2]=HEAPF32[r1+68>>2]*6.283185307179586/r60;r60=HEAPF32[r2>>2];r2=HEAP32[r5>>2];r10=HEAP32[r31>>2];r9=HEAP32[r3>>2];r23=r10;r55=r9;r17=(r23-r55|0)/56&-1;do{if(r17>>>0<r2>>>0){r11=r2-r17|0;r29=HEAP32[r26>>2];if(((r29-r23|0)/56&-1)>>>0>=r11>>>0){r37=r11;r65=r10;while(1){if((r65|0)==0){r66=0}else{_memset(r65,0,56);r66=r65}r67=r66+56|0;r47=r37-1|0;if((r47|0)==0){break}else{r37=r47;r65=r67}}HEAP32[r31>>2]=r67;break}if(r2>>>0>76695844){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r65=(r29-r55|0)/56&-1;if(r65>>>0>38347921){r68=76695844;r7=312}else{r37=r65<<1;r65=r37>>>0<r2>>>0?r2:r37;if((r65|0)==0){r69=0;r70=0}else{r68=r65;r7=312}}do{if(r7==312){r65=r68*56&-1;r37=(r65|0)==0?1:r65;while(1){r71=_malloc(r37);if((r71|0)!=0){r7=323;break}r65=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r65|0)==0){break}FUNCTION_TABLE[r65]()}if(r7==323){r69=r71;r70=r68;break}r37=___cxa_allocate_exception(4);HEAP32[r37>>2]=6488;___cxa_throw(r37,13184,74)}}while(0);r29=r11;r37=r69+(r17*56&-1)|0;while(1){if((r37|0)==0){r72=0}else{_memset(r37,0,56);r72=r37}r73=r72+56|0;r65=r29-1|0;if((r65|0)==0){break}else{r29=r65;r37=r73}}r37=r69+(r70*56&-1)|0;r29=HEAP32[r3>>2];r11=HEAP32[r31>>2]-r29|0;r65=r69+((((r11|0)/-56&-1)+r17)*56&-1)|0;r47=r65;r39=r29;_memcpy(r47,r39,r11)|0;HEAP32[r3>>2]=r65;HEAP32[r31>>2]=r73;HEAP32[r26>>2]=r37;if((r29|0)==0){break}_free(r39)}else{if(r17>>>0<=r2>>>0){break}r39=r9+(r2*56&-1)|0;if((r39|0)==(r10|0)){break}HEAP32[r31>>2]=r10+(~(((r10-56+ -r39|0)>>>0)/56&-1)*56&-1)}}while(0);L415:do{if((HEAP32[r5>>2]|0)>0){r10=r1+112|0;r2=r1+108|0;r9=r1+124|0;r17=r1+120|0;r26=r1+88|0;r73=r1+84|0;r69=r1+96|0;r70=0;r72=1;r68=0;L417:while(1){r71=HEAP32[r3>>2];if(((HEAP32[r31>>2]-r71|0)/56&-1)>>>0<=r70>>>0){r7=337;break}r55=r71+(r70*56&-1)|0;HEAPF32[r55>>2]=HEAPF32[r4>>2];r67=HEAP32[r10>>2];r66=HEAP32[r2>>2];r23=r67-r66|0;r39=r23>>2;do{if((r39|0)==0){r74=0}else{if(r39>>>0>1073741823){r7=359;break L417}r29=(r67|0)==(r66|0);r37=r29?1:r23;while(1){r75=_malloc(r37);if((r75|0)!=0){break}r65=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r65|0)==0){r7=370;break L417}FUNCTION_TABLE[r65]()}r37=r75;if(r29){r74=r37;break}else{r76=r66;r77=r37}while(1){if((r77|0)==0){r78=0}else{HEAPF32[r77>>2]=HEAPF32[r76>>2];r78=r77}r65=r76+4|0;if((r65|0)==(r67|0)){r74=r37;break}else{r76=r65;r77=r78+4|0}}}}while(0);r67=HEAP32[r9>>2];r66=HEAP32[r17>>2];r23=r67-r66|0;r39=r23>>2;do{if((r39|0)==0){r79=0}else{if(r39>>>0>1073741823){r7=378;break L417}r37=(r67|0)==(r66|0);r29=r37?1:r23;while(1){r80=_malloc(r29);if((r80|0)!=0){break}r65=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r65|0)==0){r7=389;break L417}FUNCTION_TABLE[r65]()}r29=r80;if(r37){r79=r29;break}else{r81=r66;r82=r29}while(1){if((r82|0)==0){r83=0}else{HEAPF32[r82>>2]=HEAPF32[r81>>2];r83=r82}r65=r81+4|0;if((r65|0)==(r67|0)){r79=r29;break}else{r81=r65;r82=r83+4|0}}}}while(0);r67=HEAP32[r26>>2];r66=HEAP32[r73>>2];r23=r67-r66|0;r39=r23>>2;do{if((r39|0)==0){r84=0}else{if(r39>>>0>1073741823){r7=397;break L417}r29=(r67|0)==(r66|0);r37=r29?1:r23;while(1){r85=_malloc(r37);if((r85|0)!=0){break}r65=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r65|0)==0){r7=408;break L417}FUNCTION_TABLE[r65]()}r37=r85;if(r29){r84=r37;break}else{r86=r66;r87=r37}while(1){if((r87|0)==0){r88=0}else{HEAPF32[r87>>2]=HEAPF32[r86>>2];r88=r87}r65=r86+4|0;if((r65|0)==(r67|0)){r84=r37;break}else{r86=r65;r87=r88+4|0}}}}while(0);r67=HEAPF32[r24>>2];r66=HEAP32[HEAP32[r69>>2]+(r70<<2)>>2];HEAP32[r71+(r70*56&-1)+8>>2]=r66;r23=HEAPF32[r84+(r70<<2)>>2];r39=r72*(r66|0);HEAPF32[r71+(r70*56&-1)+52>>2]=r39;HEAPF32[r71+(r70*56&-1)+4>>2]=1-Math_exp(r39*-1/(r23*r60));r66=r23*(r60/r39);r23=HEAPF32[r79+(r70<<2)>>2];r37=HEAPF32[r74+(r70<<2)>>2];r29=(r23-r37)/r66;r65=r37;r37=r23;r23=(r37*r37+r65*r65)/r66;r65=1/r23+1;r37=r65-Math_sqrt(r65*r65-1);r65=r29*(r37*r37+(1-r37*2))*.5;HEAPF32[r71+(r70*56&-1)+12>>2]=r37-r65;HEAPF32[r71+(r70*56&-1)+16>>2]=r37+r65;r65=0;r37=1;while(1){r11=r37|0;r47=r29/r11;r40=r23/r11+r47*r47;r11=(r40-r47)*.5;r44=(r47+r40)*.5;r40=1-r11-r44;if(r40<.2){r47=r65;while(1){if((r47|0)==0){r47=3}else if((r47|0)==5){r7=427;break}else if((r47|0)==3){r89=r37;break}else{r7=447;break L417}}}else{if((r65|0)==5){r7=427}else if((r65|0)==0){r90=3;r91=r11;r92=r40;r93=r44;r94=r37;break}else{r7=446;break L417}}if(r7==427){r7=0;r47=r37+1|0;if((r47|0)<16){r89=r47}else{r7=428;break L417}}r47=r89|0;r45=r29/r47;r14=(r23/r47+r45*r45)*2/5;r47=r45*2/3;r95=(r14-r47)*.5;r96=(r14+r47)*.5;r97=1-r95-r96;if(r97<.1){r65=5;r37=r89}else{r7=418;break}}if(r7==418){r7=0;r90=5;r91=r95*.5;r92=r97;r93=r96*.5;r94=r89}HEAP32[r71+(r70*56&-1)+20>>2]=r94;HEAP32[r71+(r70*56&-1)+36>>2]=r90;HEAPF32[r71+(r70*56&-1)+24>>2]=r91;HEAPF32[r71+(r70*56&-1)+28>>2]=r92;HEAPF32[r71+(r70*56&-1)+32>>2]=r93;r37=r68+Math_pow(HEAPF32[r55>>2],r70|0);if((r70|0)==0){r98=0}else{r98=r67/r66}HEAPF32[r71+(r70*56&-1)+40>>2]=r98;HEAPF32[r71+(r70*56&-1)+44>>2]=r37;HEAPF32[r71+(r70*56&-1)+48>>2]=1/r37;if((r84|0)!=0){_free(r84)}if((r79|0)!=0){_free(r79)}if((r74|0)!=0){_free(r74)}r65=r70+1|0;if((r65|0)>=(HEAP32[r5>>2]|0)){break L415}r70=r65;r72=r39;r68=r37}if(r7==337){r68=___cxa_allocate_exception(8);HEAP32[r68>>2]=6648;r72=r68+4|0;r70=r72;do{if((r72|0)!=0){while(1){r99=_malloc(19);if((r99|0)!=0){r7=348;break}r69=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r69|0)==0){break}FUNCTION_TABLE[r69]()}if(r7==348){HEAP32[r99+4>>2]=6;HEAP32[r99>>2]=6;r39=r99+12|0;HEAP32[r70>>2]=r39;HEAP32[r99+8>>2]=0;HEAP8[r39]=HEAP8[4608];HEAP8[r39+1|0]=HEAP8[4609];HEAP8[r39+2|0]=HEAP8[4610];HEAP8[r39+3|0]=HEAP8[4611];HEAP8[r39+4|0]=HEAP8[4612];HEAP8[r39+5|0]=HEAP8[4613];HEAP8[r39+6|0]=HEAP8[4614];break}r39=___cxa_allocate_exception(4);HEAP32[r39>>2]=6488;___cxa_throw(r39,13184,74)}}while(0);HEAP32[r68>>2]=6584;___cxa_throw(r68,13232,280)}else if(r7==359){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}else if(r7==370){r70=___cxa_allocate_exception(4);HEAP32[r70>>2]=6488;___cxa_throw(r70,13184,74)}else if(r7==378){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}else if(r7==389){r70=___cxa_allocate_exception(4);HEAP32[r70>>2]=6488;___cxa_throw(r70,13184,74)}else if(r7==397){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}else if(r7==408){r70=___cxa_allocate_exception(4);HEAP32[r70>>2]=6488;___cxa_throw(r70,13184,74)}else if(r7==428){___assert_fail(4328,5816,291,5928)}else if(r7==446){while(1){r7=0;r7=446}}else if(r7==447){while(1){r7=0;r7=447}}}}while(0);r99=HEAP32[r21>>2];r5=r1+156|0;r74=r1+148|0;r79=HEAP32[r74>>2];r84=r79;do{if(HEAP32[r5>>2]-r84>>2>>>0<r99>>>0){r98=r1+152|0;r93=HEAP32[r98>>2]-r84|0;r92=r93>>2;do{if((r99|0)==0){r100=0}else{r91=r99<<2;r90=(r91|0)==0?1:r91;while(1){r101=_malloc(r90);if((r101|0)!=0){r7=461;break}r91=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r91|0)==0){break}FUNCTION_TABLE[r91]()}if(r7==461){r100=r101;break}r90=___cxa_allocate_exception(4);HEAP32[r90>>2]=6488;___cxa_throw(r90,13184,74)}}while(0);r90=r100+(r92<<2)|0;r91=r100+(r99<<2)|0;r94=r100;r89=r79;_memcpy(r94,r89,r93)|0;HEAP32[r74>>2]=r100;HEAP32[r98>>2]=r90;HEAP32[r5>>2]=r91;if((r79|0)==0){r102=r99;break}_free(r89);r102=HEAP32[r21>>2]}else{r102=r99}}while(0);L534:do{if((r102|0)>0){r99=r1+152|0;r79=0;L536:while(1){r100=HEAP32[r74>>2];do{if(HEAP32[r99>>2]-r100>>2>>>0>r79>>>0){r101=HEAP32[r100+(r79<<2)>>2];if((r101|0)==0){r7=473;break}__ZN3Ear8RedesignEiRK9CARCoeffsRK9IHCCoeffsRKNSt3__16vectorI9AGCCoeffsNS6_9allocatorIS8_EEEE(r101,HEAP32[r6>>2],r18,r19,r20)}else{r7=473}}while(0);do{if(r7==473){while(1){r7=0;r103=_malloc(264);if((r103|0)!=0){break}r100=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r100|0)==0){r7=481;break L536}FUNCTION_TABLE[r100]();r7=473}r44=r103;r40=HEAP32[r6>>2];r11=r103+248|0;_memset(r103+8|0,0,112);_memset(r103+172|0,0,72);HEAP32[r11>>2]=0;HEAP32[r11+4>>2]=0;HEAP32[r11+8>>2]=0;HEAP32[r11+12>>2]=0;__ZN3Ear8RedesignEiRK9CARCoeffsRK9IHCCoeffsRKNSt3__16vectorI9AGCCoeffsNS6_9allocatorIS8_EEEE(r44,r40,r18,r19,r20);r40=HEAP32[r99>>2];r11=HEAP32[r5>>2];if(r40>>>0<r11>>>0){if((r40|0)==0){r104=0}else{HEAP32[r40>>2]=r44;r104=HEAP32[r99>>2]}HEAP32[r99>>2]=r104+4;break}r100=HEAP32[r74>>2];r101=r100;r84=r40-r101|0;r40=r84>>2;r89=r40+1|0;if(r89>>>0>1073741823){r7=506;break L536}r91=r11-r101|0;if(r91>>2>>>0>536870910){r105=1073741823;r7=510}else{r101=r91>>1;r91=r101>>>0<r89>>>0?r89:r101;if((r91|0)==0){r106=0;r107=0}else{r105=r91;r7=510}}if(r7==510){r7=0;r91=r105<<2;r101=(r91|0)==0?1:r91;while(1){r108=_malloc(r101);if((r108|0)!=0){break}r91=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r91|0)==0){r7=519;break L536}FUNCTION_TABLE[r91]()}r106=r108;r107=r105}r101=r106+(r40<<2)|0;r91=r106+(r107<<2)|0;if((r101|0)!=0){HEAP32[r101>>2]=r44}r101=r106+(r89<<2)|0;r11=r106;r90=r100;_memcpy(r11,r90,r84)|0;HEAP32[r74>>2]=r106;HEAP32[r99>>2]=r101;HEAP32[r5>>2]=r91;if((r100|0)==0){break}_free(r90)}}while(0);r90=r79+1|0;if((r90|0)<(HEAP32[r21>>2]|0)){r79=r90}else{break L534}}if(r7==481){r79=___cxa_allocate_exception(4);HEAP32[r79>>2]=6488;___cxa_throw(r79,13184,74)}else if(r7==506){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}else if(r7==519){r79=___cxa_allocate_exception(4);HEAP32[r79>>2]=6488;___cxa_throw(r79,13184,74)}}}while(0);r7=HEAP32[r3>>2];if((r7|0)==0){__ZN9CARCoeffsD2Ev(r18);STACKTOP=r8;return}r3=HEAP32[r31>>2];if((r7|0)!=(r3|0)){HEAP32[r31>>2]=r3+(~(((r3-56+ -r7|0)>>>0)/56&-1)*56&-1)}_free(r7);__ZN9CARCoeffsD2Ev(r18);STACKTOP=r8;return}function __ZN6CARFACD2Ev(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=r1+148|0;r3=HEAP32[r2>>2];r4=r1+152|0;r5=HEAP32[r4>>2];if((r3|0)!=(r5|0)){r6=r3;while(1){r3=HEAP32[r6>>2];if((r3|0)!=0){r7=HEAP32[r3+256>>2];if((r7|0)!=0){_free(HEAP32[r7-4>>2])}r7=HEAP32[r3+248>>2];if((r7|0)!=0){_free(HEAP32[r7-4>>2])}r7=r3+232|0;r8=HEAP32[r7>>2];do{if((r8|0)!=0){r9=r3+236|0;r10=HEAP32[r9>>2];if((r8|0)==(r10|0)){r11=r8}else{r12=r10;while(1){r10=r12-20|0;HEAP32[r9>>2]=r10;r13=HEAP32[r12-20+8>>2];if((r13|0)!=0){_free(HEAP32[r13-4>>2])}r13=HEAP32[r10>>2];if((r13|0)!=0){_free(HEAP32[r13-4>>2])}r13=HEAP32[r9>>2];if((r8|0)==(r13|0)){break}else{r12=r13}}r12=HEAP32[r7>>2];if((r12|0)==0){break}else{r11=r12}}_free(r11)}}while(0);r7=HEAP32[r3+220>>2];r8=r7;if((r7|0)!=0){r12=r3+224|0;r9=HEAP32[r12>>2];if((r7|0)!=(r9|0)){HEAP32[r12>>2]=r9+(~(((r9-56+ -r8|0)>>>0)/56&-1)*56&-1)}_free(r7)}__ZN8IHCStateD2Ev(r3+172|0);__ZN8CARStateD2Ev(r3+56|0);__ZN9CARCoeffsD2Ev(r3|0);_free(r3)}r7=r6+4|0;if((r7|0)==(r5|0)){break}else{r6=r7}}}r6=HEAP32[r1+160>>2];if((r6|0)!=0){_free(HEAP32[r6-4>>2])}r6=HEAP32[r2>>2];if((r6|0)==0){r14=r1+72|0;__ZN9AGCParamsD2Ev(r14);return}r2=HEAP32[r4>>2];if((r6|0)!=(r2|0)){HEAP32[r4>>2]=r2+(~((r2-4+ -r6|0)>>>2)<<2)}_free(r6);r14=r1+72|0;__ZN9AGCParamsD2Ev(r14);return}function __ZN6CARFAC10RunSegmentERKN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEEbP12CARFACOutput(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+248|0;r6=r5;r7=r5+8;r8=r5+160;r9=r5+168;r10=r5+176;r11=r5+184;r12=r5+192;r13=r5+200;r14=r5+208;r15=r5+224;r16=r5+232;r17=r5+240;r18=r2+4|0;r19=HEAP32[r18>>2];r20=r1+132|0;if((r19|0)!=(HEAP32[r20>>2]|0)){___assert_fail(5832,5816,89,5944)}r21=r1+140|0;r22=HEAP32[r21>>2];r23=r2+8|0;r24=HEAP32[r23>>2];r25=r3|0;do{if((HEAP8[r25]&1)!=0){r26=r3+4|0;r27=r3+8|0;r28=HEAP32[r27>>2];r29=r26|0;r30=HEAP32[r29>>2];r31=(r28-r30|0)/12&-1;do{if(r31>>>0<r19>>>0){__ZNSt3__16vectorIN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEENS_9allocatorIS3_EEE8__appendEj(r26,r19-r31|0);r32=HEAP32[r27>>2]}else{if(r31>>>0<=r19>>>0){r32=r28;break}r33=r30+(r19*12&-1)|0;if((r33|0)==(r28|0)){r32=r28;break}else{r34=r28}while(1){r35=r34-12|0;HEAP32[r27>>2]=r35;r36=HEAP32[r35>>2];if((r36|0)==0){r37=r35}else{_free(HEAP32[r36-4>>2]);r37=HEAP32[r27>>2]}if((r33|0)==(r37|0)){r32=r33;break}else{r34=r37}}}}while(0);r27=HEAP32[r29>>2];if((r27|0)==(r32|0)){break}else{r38=r27}while(1){__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r38|0,r22,r24);r27=r38+12|0;if((r27|0)==(r32|0)){break}else{r38=r27}}}}while(0);r38=r3+1|0;do{if((HEAP8[r38]&1)!=0){r32=r3+16|0;r37=r3+20|0;r34=HEAP32[r37>>2];r29=r32|0;r27=HEAP32[r29>>2];r28=(r34-r27|0)/12&-1;do{if(r28>>>0<r19>>>0){__ZNSt3__16vectorIN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEENS_9allocatorIS3_EEE8__appendEj(r32,r19-r28|0);r39=HEAP32[r37>>2]}else{if(r28>>>0<=r19>>>0){r39=r34;break}r30=r27+(r19*12&-1)|0;if((r30|0)==(r34|0)){r39=r34;break}else{r40=r34}while(1){r31=r40-12|0;HEAP32[r37>>2]=r31;r26=HEAP32[r31>>2];if((r26|0)==0){r41=r31}else{_free(HEAP32[r26-4>>2]);r41=HEAP32[r37>>2]}if((r30|0)==(r41|0)){r39=r30;break}else{r40=r41}}}}while(0);r37=HEAP32[r29>>2];if((r37|0)==(r39|0)){break}else{r42=r37}while(1){__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r42|0,r22,r24);r37=r42+12|0;if((r37|0)==(r39|0)){break}else{r42=r37}}}}while(0);r42=r3+2|0;do{if((HEAP8[r42]&1)!=0){r39=r3+28|0;r41=r3+32|0;r40=HEAP32[r41>>2];r29=r39|0;r37=HEAP32[r29>>2];r34=(r40-r37|0)/12&-1;do{if(r34>>>0<r19>>>0){__ZNSt3__16vectorIN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEENS_9allocatorIS3_EEE8__appendEj(r39,r19-r34|0);r43=HEAP32[r41>>2]}else{if(r34>>>0<=r19>>>0){r43=r40;break}r27=r37+(r19*12&-1)|0;if((r27|0)==(r40|0)){r43=r40;break}else{r44=r40}while(1){r28=r44-12|0;HEAP32[r41>>2]=r28;r32=HEAP32[r28>>2];if((r32|0)==0){r45=r28}else{_free(HEAP32[r32-4>>2]);r45=HEAP32[r41>>2]}if((r27|0)==(r45|0)){r43=r27;break}else{r44=r45}}}}while(0);r41=HEAP32[r29>>2];if((r41|0)==(r43|0)){break}else{r46=r41}while(1){__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r46|0,r22,r24);r41=r46+12|0;if((r41|0)==(r43|0)){break}else{r46=r41}}}}while(0);r46=r3+3|0;do{if((HEAP8[r46]&1)!=0){r43=r3+40|0;r45=r3+44|0;r44=HEAP32[r45>>2];r29=r43|0;r41=HEAP32[r29>>2];r40=(r44-r41|0)/12&-1;do{if(r40>>>0<r19>>>0){__ZNSt3__16vectorIN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEENS_9allocatorIS3_EEE8__appendEj(r43,r19-r40|0);r47=HEAP32[r45>>2]}else{if(r40>>>0<=r19>>>0){r47=r44;break}r37=r41+(r19*12&-1)|0;if((r37|0)==(r44|0)){r47=r44;break}else{r48=r44}while(1){r34=r48-12|0;HEAP32[r45>>2]=r34;r39=HEAP32[r34>>2];if((r39|0)==0){r49=r34}else{_free(HEAP32[r39-4>>2]);r49=HEAP32[r45>>2]}if((r37|0)==(r49|0)){r47=r37;break}else{r48=r49}}}}while(0);r45=HEAP32[r29>>2];if((r45|0)==(r47|0)){break}else{r50=r45}while(1){__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r50|0,r22,r24);r45=r50+12|0;if((r45|0)==(r47|0)){break}else{r50=r45}}}}while(0);if((HEAP32[r23>>2]|0)<=0){STACKTOP=r5;return}r50=r2|0;r2=r1+148|0;r47=r1+152|0;r1=r12|0;r24=r12+4|0;r22=r14|0;r49=r14+8|0;r48=r14;r14=r13+4|0;r19=r13|0;r29=r12|0;r12=r15|0;r45=r15|0;r44=r15+4|0;r15=r8+4|0;r41=r9|0;r40=r9|0;r43=r9+4|0;r9=r8|0;r37=r11+4|0;r39=r10|0;r34=r10|0;r27=r10+4|0;r10=r11|0;r32=r8|0;r8=r6|0;r28=r6|0;r30=r6+4|0;r26=r7+20|0;r31=r7+24|0;r33=r7+28|0;r36=r7+40|0;r35=r7+44|0;r51=r7+48|0;r52=r7+80|0;r53=r7+84|0;r54=r7+88|0;r55=r7+100|0;r56=r7+108|0;r57=r7+112|0;r58=r7+120|0;r59=r7+132|0;r60=r7+136|0;r61=r11|0;r62=r7;r7=r11;r11=r3+40|0;r63=r3+28|0;r64=r3+16|0;r65=r3+4|0;r3=r17|0;r66=r17+4|0;r67=r17;r17=r16|0;r68=0;r69=0;L696:while(1){if((HEAP32[r20>>2]|0)>0){r70=0;while(1){r71=HEAP32[r18>>2];if((r71|0)<=(r70|0)){r4=1152;break L696}if((HEAP32[r23>>2]|0)<=(r68|0)){r4=1153;break L696}r72=Math_imul(r71,r68)+r70|0;r71=HEAPF32[HEAP32[r50>>2]+(r72<<2)>>2];r72=HEAP32[HEAP32[r2>>2]+(r70<<2)>>2];r73=r72+56|0;r74=r72+104|0;r75=r72+108|0;r76=HEAP32[r75>>2];r77=r72+116|0;if((r76|0)!=(HEAP32[r77>>2]|0)){r4=618;break L696}if((r76|0)<0){r4=620;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r74|0,r76);r76=HEAP32[r75>>2];if((r76|0)!=(HEAP32[r77>>2]|0)){r4=625;break L696}do{if((r76|0)>0){r77=r74|0;r78=HEAP32[r77>>2];r79=r72+112|0;HEAPF32[r78>>2]=HEAPF32[r78>>2]+HEAPF32[HEAP32[r79>>2]>>2];if((r76|0)>1){r80=1}else{break}while(1){r78=HEAP32[r77>>2]+(r80<<2)|0;HEAPF32[r78>>2]=HEAPF32[r78>>2]+HEAPF32[HEAP32[r79>>2]+(r80<<2)>>2];r78=r80+1|0;if((r78|0)<(r76|0)){r80=r78}else{break}}}}while(0);r76=r72+80|0;r79=r72+84|0;r77=HEAP32[r79>>2];r78=r72+92|0;if((r77|0)!=(HEAP32[r78>>2]|0)){r4=627;break L696}if((r77|0)<0){r4=629;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r76|0,r77);r77=HEAP32[r79>>2];if((r77|0)!=(HEAP32[r78>>2]|0)){r4=634;break L696}do{if((r77|0)>0){r78=r76|0;r81=HEAP32[r78>>2];r82=r72+88|0;HEAPF32[r81>>2]=HEAPF32[r81>>2]+HEAPF32[HEAP32[r82>>2]>>2];if((r77|0)>1){r83=1}else{break}while(1){r81=HEAP32[r78>>2]+(r83<<2)|0;HEAPF32[r81>>2]=HEAPF32[r81>>2]+HEAPF32[HEAP32[r82>>2]+(r83<<2)>>2];r81=r83+1|0;if((r81|0)<(r77|0)){r83=r81}else{break}}}}while(0);r77=r72+248|0;r82=r72+64|0;r78=r72+72|0;r81=r72+68|0;r84=HEAP32[r81>>2];r85=r72+76|0;if((r84|0)!=(HEAP32[r85>>2]|0)){r4=636;break L696}r86=HEAPF32[r72>>2];r87=HEAPF32[r72+4>>2];if((HEAP32[r79>>2]|0)!=(r84|0)){r4=638;break L696}if((HEAP32[r72+12>>2]|0)!=(r84|0)){r4=640;break L696}if((r84|0)<0){r4=642;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r77|0,r84);r84=r72+252|0;r88=HEAP32[r84>>2];if((r88|0)!=(HEAP32[r85>>2]|0)){r4=647;break L696}if((r88|0)>0){r89=r77|0;r90=r72+8|0;r91=r76|0;r92=r82|0;r93=r78|0;r94=0;while(1){r95=r87+r86*(HEAPF32[HEAP32[r92>>2]+(r94<<2)>>2]-HEAPF32[HEAP32[r93>>2]+(r94<<2)>>2]);HEAPF32[HEAP32[r89>>2]+(r94<<2)>>2]=HEAPF32[HEAP32[r90>>2]+(r94<<2)>>2]+1/(r95*r95+1)*HEAPF32[HEAP32[r91>>2]+(r94<<2)>>2];r95=r94+1|0;if((r95|0)<(r88|0)){r94=r95}else{break}}}r94=HEAP32[r81>>2];if((r94|0)<0){r4=649;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r78|0,r94);r94=HEAP32[r85>>2];if((r94|0)!=(HEAP32[r81>>2]|0)){r4=654;break L696}if((r94|0)>0){r88=r82|0;r91=r78|0;r90=0;while(1){HEAPF32[HEAP32[r91>>2]+(r90<<2)>>2]=HEAPF32[HEAP32[r88>>2]+(r90<<2)>>2];r89=r90+1|0;if((r89|0)<(r94|0)){r90=r89}else{break}}}r90=r72+256|0;r94=r72+16|0;r88=r72+20|0;r91=HEAP32[r88>>2];r78=r72+60|0;if((r91|0)!=(HEAP32[r78>>2]|0)){r4=656;break L696}r85=r72+24|0;r89=r72+28|0;r93=HEAP32[r89>>2];if((r93|0)!=(HEAP32[r81>>2]|0)){r4=658;break L696}if((r91|0)!=(r93|0)){r4=660;break L696}if((HEAP32[r84>>2]|0)!=(r91|0)){r4=662;break L696}if((r91|0)<0){r4=664;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r90|0,r91);r91=r72+260|0;r93=HEAP32[r91>>2];if((r93|0)!=(HEAP32[r81>>2]|0)){r4=669;break L696}if((r93|0)>0){r92=r90|0;r86=r77|0;r87=r94|0;r76=r73|0;r79=r85|0;r95=r82|0;r96=0;while(1){HEAPF32[HEAP32[r92>>2]+(r96<<2)>>2]=HEAPF32[HEAP32[r86>>2]+(r96<<2)>>2]*(HEAPF32[HEAP32[r87>>2]+(r96<<2)>>2]*HEAPF32[HEAP32[r76>>2]+(r96<<2)>>2]-HEAPF32[HEAP32[r79>>2]+(r96<<2)>>2]*HEAPF32[HEAP32[r95>>2]+(r96<<2)>>2]);r97=r96+1|0;if((r97|0)<(r93|0)){r96=r97}else{break}}}r96=HEAP32[r89>>2];if((r96|0)!=(HEAP32[r78>>2]|0)){r4=671;break L696}r93=HEAP32[r88>>2];if((r93|0)!=(HEAP32[r81>>2]|0)){r4=673;break L696}if((r96|0)!=(r93|0)){r4=675;break L696}if((HEAP32[r84>>2]|0)!=(r96|0)){r4=677;break L696}if((r96|0)<0){r4=679;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r82|0,r96);r96=HEAP32[r81>>2];if((r96|0)>0){r93=r82|0;r95=r77|0;r79=r85|0;r76=r73|0;r87=r94|0;r86=0;while(1){r92=HEAP32[r93>>2]+(r86<<2)|0;HEAPF32[r92>>2]=HEAPF32[HEAP32[r95>>2]+(r86<<2)>>2]*(HEAPF32[HEAP32[r79>>2]+(r86<<2)>>2]*HEAPF32[HEAP32[r76>>2]+(r86<<2)>>2]+HEAPF32[HEAP32[r87>>2]+(r86<<2)>>2]*HEAPF32[r92>>2]);r92=r86+1|0;if((r92|0)<(r96|0)){r86=r92}else{break}}r98=HEAP32[r81>>2]}else{r98=r96}r86=r72+96|0;if((HEAP32[r72+36>>2]|0)!=(r98|0)){r4=685;break L696}if((r98|0)<0){r4=687;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r86|0,r98);r87=r72+100|0;r76=HEAP32[r87>>2];if((r76|0)!=(HEAP32[r81>>2]|0)){r4=694;break L696}do{if((r76|0)>0){r79=r86|0;r95=r72+32|0;r93=r82|0;HEAPF32[HEAP32[r79>>2]>>2]=HEAPF32[HEAP32[r95>>2]>>2]*HEAPF32[HEAP32[r93>>2]>>2];if((r76|0)>1){r99=1}else{break}while(1){HEAPF32[HEAP32[r79>>2]+(r99<<2)>>2]=HEAPF32[HEAP32[r95>>2]+(r99<<2)>>2]*HEAPF32[HEAP32[r93>>2]+(r99<<2)>>2];r94=r99+1|0;if((r94|0)<(r76|0)){r99=r94}else{break}}}}while(0);r76=r72+244|0;if((HEAP32[r76>>2]|0)>0){r82=r74|0;r81=r86|0;r96=r71;r93=0;while(1){if((HEAP32[r75>>2]|0)<=(r93|0)){r4=696;break L696}if((HEAP32[r87>>2]|0)<=(r93|0)){r4=698;break L696}r95=HEAP32[r81>>2]+(r93<<2)|0;r79=HEAPF32[HEAP32[r82>>2]+(r93<<2)>>2]*(r96+HEAPF32[r95>>2]);HEAPF32[r95>>2]=r79;r95=r93+1|0;if((r95|0)<(HEAP32[r76>>2]|0)){r96=r79;r93=r95}else{break}}}if((HEAP32[r91>>2]|0)<=0){r4=701;break L696}if((HEAP32[r78>>2]|0)<=0){r4=703;break L696}r93=r90|0;r96=r73|0;HEAPF32[HEAP32[r96>>2]>>2]=HEAPF32[HEAP32[r93>>2]>>2]+r71;r82=HEAP32[r76>>2];r81=r82-1|0;r75=HEAP32[r78>>2]-r81|0;r74=HEAP32[r96>>2];r96=(r82|0)>0;if(!((r74+(r75<<2)|0)==0|r96)){r4=705;break L696}if((r75|r81|0)<=-1){r4=707;break L696}r82=HEAP32[r91>>2]-r81|0;r95=HEAP32[r93>>2];if(!((r95+(r82<<2)|0)==0|r96)){r4=709;break L696}if((r82|r81|0)<=-1){r4=711;break L696}r93=HEAP32[r86>>2];if(!((r93|0)==0|r96)){r4=713;break L696}if(!r96){r4=1150;break L696}r96=HEAP32[r87>>2];if((r96|0)<(r81|0)){r4=1151;break L696}if((r81|0)>0){r79=0;while(1){HEAPF32[r74+(r79+r75<<2)>>2]=HEAPF32[r95+(r79+r82<<2)>>2]+HEAPF32[r93+(r79<<2)>>2];r94=r79+1|0;if((r94|0)<(r81|0)){r79=r94}else{break}}r100=HEAP32[r87>>2]}else{r100=r96}r79=r72+172|0;r81=r79|0;r93=r72+212|0;r82=r72+216|0;if((r100|0)!=(HEAP32[r82>>2]|0)){r4=721;break L696}if((r100|0)<0){r4=723;break L696}r95=r79|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r95,r100);r75=r72+176|0;r74=HEAP32[r75>>2];if((r74|0)!=(HEAP32[r82>>2]|0)){r4=728;break L696}do{if((r74|0)>0){r86=r79|0;r91=r72+96|0;r78=r93|0;HEAPF32[HEAP32[r86>>2]>>2]=HEAPF32[HEAP32[r91>>2]>>2]-HEAPF32[HEAP32[r78>>2]>>2];if((r74|0)>1){r101=1}else{break}while(1){HEAPF32[HEAP32[r86>>2]+(r101<<2)>>2]=HEAPF32[HEAP32[r91>>2]+(r101<<2)>>2]-HEAPF32[HEAP32[r78>>2]+(r101<<2)>>2];r71=r101+1|0;if((r71|0)<(r74|0)){r101=r71}else{break}}}}while(0);r74=HEAPF32[r72+160>>2];r96=HEAP32[r82>>2];if((r96|0)!=(HEAP32[r75>>2]|0)){r4=730;break L696}if((r96|0)<0){r4=732;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r93|0,r96);r96=HEAP32[r82>>2];if((r96|0)!=(HEAP32[r75>>2]|0)){r4=737;break L696}do{if((r96|0)>0){r87=r93|0;r78=HEAP32[r87>>2];r91=r79|0;HEAPF32[r78>>2]=HEAPF32[r78>>2]+r74*HEAPF32[HEAP32[r91>>2]>>2];if((r96|0)>1){r102=1}else{break}while(1){r78=HEAP32[r87>>2]+(r102<<2)|0;HEAPF32[r78>>2]=HEAPF32[r78>>2]+r74*HEAPF32[HEAP32[r91>>2]+(r102<<2)>>2];r78=r102+1|0;if((r78|0)<(r96|0)){r102=r78}else{break}}}}while(0);do{if((HEAP8[r72+120|0]&1)==0){__Z12CARFACDetectPN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r81);do{if((HEAP8[r72+121|0]&1)==0){r96=r72+188|0;r74=HEAP32[r75>>2];r93=r72+192|0;if((r74|0)!=(HEAP32[r93>>2]|0)){r4=766;break L696}if((r74|0)<0){r4=768;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r95,r74);r74=HEAP32[r75>>2];if((r74|0)!=(HEAP32[r93>>2]|0)){r4=773;break L696}do{if((r74|0)>0){r82=r79|0;r91=HEAP32[r82>>2];r87=r96|0;HEAPF32[r91>>2]=HEAPF32[r91>>2]*HEAPF32[HEAP32[r87>>2]>>2];if((r74|0)>1){r103=1}else{break}while(1){r91=HEAP32[r82>>2]+(r103<<2)|0;HEAPF32[r91>>2]=HEAPF32[r91>>2]*HEAPF32[HEAP32[r87>>2]+(r103<<2)>>2];r91=r103+1|0;if((r91|0)<(r74|0)){r103=r91}else{break}}}}while(0);r74=r72+180|0;r87=r72+184|0;r82=HEAP32[r87>>2];if((r82|0)!=(HEAP32[r93>>2]|0)){r4=775;break L696}r91=HEAPF32[r72+128>>2];r78=HEAPF32[r72+132>>2];if((r82|0)<0){r4=777;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r74|0,r82);r82=HEAP32[r87>>2];if((r82|0)>0){r86=r74|0;r71=r96|0;r73=0;while(1){r90=HEAP32[r86>>2]+(r73<<2)|0;r94=HEAPF32[r90>>2];HEAPF32[r90>>2]=r78*(1-r94)+(r94-r91*(r94-HEAPF32[HEAP32[r71>>2]+(r73<<2)>>2]));r94=r73+1|0;if((r94|0)<(r82|0)){r73=r94}else{break}}}r73=HEAPF32[r72+136>>2];r82=HEAP32[r93>>2];if((r82|0)!=(HEAP32[r75>>2]|0)){r4=782;break L696}if((HEAP32[r87>>2]|0)!=(r82|0)){r4=784;break L696}r71=HEAPF32[r72+140>>2];if((r82|0)<0){r4=786;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r96|0,r82);r82=HEAP32[r93>>2];if((r82|0)<=0){break}r91=r96|0;r78=r79|0;r86=r74|0;r94=0;while(1){r90=HEAP32[r91>>2]+(r94<<2)|0;r85=HEAPF32[r90>>2];HEAPF32[r90>>2]=r85-r73*HEAPF32[HEAP32[r78>>2]+(r94<<2)>>2]+r71*(HEAPF32[HEAP32[r86>>2]+(r94<<2)>>2]-r85);r85=r94+1|0;if((r85|0)<(r82|0)){r94=r85}else{break}}}else{r94=r72+180|0;r82=HEAP32[r75>>2];r86=r72+184|0;if((r82|0)!=(HEAP32[r86>>2]|0)){r4=750;break L696}if((r82|0)<0){r4=752;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r95,r82);r82=HEAP32[r75>>2];if((r82|0)!=(HEAP32[r86>>2]|0)){r4=757;break L696}do{if((r82|0)>0){r71=r79|0;r78=HEAP32[r71>>2];r73=r94|0;HEAPF32[r78>>2]=HEAPF32[r78>>2]*HEAPF32[HEAP32[r73>>2]>>2];if((r82|0)>1){r104=1}else{break}while(1){r78=HEAP32[r71>>2]+(r104<<2)|0;HEAPF32[r78>>2]=HEAPF32[r78>>2]*HEAPF32[HEAP32[r73>>2]+(r104<<2)>>2];r78=r104+1|0;if((r78|0)<(r82|0)){r104=r78}else{break}}}}while(0);r82=HEAPF32[r72+128>>2];r73=HEAP32[r86>>2];if((r73|0)!=(HEAP32[r75>>2]|0)){r4=759;break L696}r71=HEAPF32[r72+132>>2];if((r73|0)<0){r4=761;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r94|0,r73);r73=HEAP32[r86>>2];if((r73|0)<=0){break}r78=r94|0;r91=r79|0;r74=0;while(1){r96=HEAP32[r78>>2]+(r74<<2)|0;r93=HEAPF32[r96>>2];HEAPF32[r96>>2]=r93-r82*HEAPF32[HEAP32[r91>>2]+(r74<<2)>>2]+r71*(1-r93);r93=r74+1|0;if((r93|0)<(r73|0)){r74=r93}else{break}}}}while(0);r74=r72+196|0;r73=r72+124|0;r71=HEAPF32[r72+144>>2];r91=HEAP32[r75>>2];r82=r72+200|0;if((r91|0)!=(HEAP32[r82>>2]|0)){r4=791;break L696}r78=HEAPF32[r73>>2];if((r91|0)>0){r94=r79|0;r86=r74|0;r93=0;while(1){r96=HEAP32[r86>>2]+(r93<<2)|0;r87=HEAPF32[r96>>2];HEAPF32[r96>>2]=r87+r78*(r71*HEAPF32[HEAP32[r94>>2]+(r93<<2)>>2]-r87);r87=r93+1|0;if((r87|0)<(r91|0)){r93=r87}else{break}}r105=HEAP32[r82>>2]}else{r105=r91}r93=r72+204|0;r94=r72+208|0;if((r105|0)!=(HEAP32[r94>>2]|0)){r4=797;break L696}r71=HEAPF32[r73>>2];do{if((r105|0)>0){r78=r93|0;r86=HEAP32[r78>>2];r87=r74|0;r96=HEAPF32[r86>>2];HEAPF32[r86>>2]=r96+r71*(HEAPF32[HEAP32[r87>>2]>>2]-r96);if((r105|0)>1){r106=1}else{break}while(1){r96=HEAP32[r78>>2]+(r106<<2)|0;r86=HEAPF32[r96>>2];HEAPF32[r96>>2]=r86+r71*(HEAPF32[HEAP32[r87>>2]+(r106<<2)>>2]-r86);r86=r106+1|0;if((r86|0)<(r105|0)){r106=r86}else{break}}}}while(0);r71=HEAPF32[r72+148>>2];r74=HEAP32[r94>>2];if((r74|0)<0){r4=802;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r95,r74);r74=HEAP32[r75>>2];if((r74|0)!=(HEAP32[r94>>2]|0)){r4=807;break L696}if((r74|0)<=0){break}r73=r79|0;r91=r93|0;HEAPF32[HEAP32[r73>>2]>>2]=HEAPF32[HEAP32[r91>>2]>>2]-r71;if((r74|0)>1){r107=1}else{break}while(1){HEAPF32[HEAP32[r73>>2]+(r107<<2)>>2]=HEAPF32[HEAP32[r91>>2]+(r107<<2)>>2]-r71;r82=r107+1|0;if((r82|0)<(r74|0)){r107=r82}else{break}}}else{r74=HEAP32[r76>>2];if((r74|0)<=-1){r4=740;break L696}if((HEAP32[r75>>2]|0)!=(r74|0)){r4=742;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r95,r74);if((HEAP32[r75>>2]|0)!=(r74|0)){r4=747;break L696}if((r74|0)<=0){break}r71=r79|0;r91=0;while(1){r73=HEAP32[r71>>2]+(r91<<2)|0;r93=HEAPF32[r73>>2];r94=r93<0?0:r93;HEAPF32[r73>>2]=r94>2?2:r94;r94=r91+1|0;if((r94|0)<(r74|0)){r91=r94}else{break}}}}while(0);r79=HEAP32[r72+224>>2];r75=HEAP32[r72+220>>2];do{if((r79|0)==(r75|0)){r108=0}else{r95=HEAPF32[r75+((((r79-r75|0)/56&-1)-1)*56&-1)+48>>2];HEAP32[r3>>2]=r72+172;HEAPF32[r66>>2]=r95;__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_12CwiseUnaryOpINS_8internal18scalar_multiple_opIfEEKS1_EEEERKNS_9ArrayBaseIT_EE(r16,r67);r95=__ZN3Ear10AGCRecurseEiN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r72,0,r16);r76=HEAP32[r17>>2];if((r76|0)==0){r108=r95;break}_free(HEAP32[r76-4>>2]);r108=r95}}while(0);r72=r70+1|0;if((r72|0)<(HEAP32[r20>>2]|0)){r70=r72}else{r109=r108;break}}}else{r109=r69}r70=HEAP32[r47>>2];r72=HEAP32[r2>>2];if((r70|0)==(r72|0)){r110=r70;r111=r70}else{r70=(r68|0)>-1;r75=0;r79=r72;while(1){r72=HEAP32[r79+(r75<<2)>>2];do{if((HEAP8[r25]&1)!=0){r95=HEAP32[r65>>2];r76=HEAP32[r95+(r75*12&-1)+4>>2];r81=Math_imul(r76,r68)|0;r91=HEAP32[r95+(r75*12&-1)>>2];if(!((r91+(r81<<2)|0)==0|(r76|0)>-1)){r4=821;break L696}if(!r70){r4=1154;break L696}if((HEAP32[r95+(r75*12&-1)+8>>2]|0)<=(r68|0)){r4=1155;break L696}if((r76|0)!=(HEAP32[r72+176>>2]|0)){r4=829;break L696}if((r76|0)<=0){break}r95=r72+172|0;r74=0;while(1){HEAPF32[r91+(r74+r81<<2)>>2]=HEAPF32[HEAP32[r95>>2]+(r74<<2)>>2];r71=r74+1|0;if((r71|0)<(r76|0)){r74=r71}else{break}}}}while(0);do{if((HEAP8[r38]&1)!=0){r74=HEAP32[r64>>2];r76=HEAP32[r74+(r75*12&-1)+4>>2];r95=Math_imul(r76,r68)|0;r81=HEAP32[r74+(r75*12&-1)>>2];if(!((r81+(r95<<2)|0)==0|(r76|0)>-1)){r4=832;break L696}if(!r70){r4=1156;break L696}if((HEAP32[r74+(r75*12&-1)+8>>2]|0)<=(r68|0)){r4=1157;break L696}if((r76|0)!=(HEAP32[r72+100>>2]|0)){r4=840;break L696}if((r76|0)<=0){break}r74=r72+96|0;r91=0;while(1){HEAPF32[r81+(r91+r95<<2)>>2]=HEAPF32[HEAP32[r74>>2]+(r91<<2)>>2];r71=r91+1|0;if((r71|0)<(r76|0)){r91=r71}else{break}}}}while(0);do{if((HEAP8[r42]&1)!=0){r91=HEAP32[r63>>2];r76=HEAP32[r91+(r75*12&-1)+4>>2];r74=Math_imul(r76,r68)|0;r95=HEAP32[r91+(r75*12&-1)>>2];if(!((r95+(r74<<2)|0)==0|(r76|0)>-1)){r4=843;break L696}if(!r70){r4=1158;break L696}if((HEAP32[r91+(r75*12&-1)+8>>2]|0)<=(r68|0)){r4=1159;break L696}if((r76|0)!=(HEAP32[r72+76>>2]|0)){r4=851;break L696}if((r76|0)<=0){break}r91=r72+72|0;r81=0;while(1){HEAPF32[r95+(r81+r74<<2)>>2]=HEAPF32[HEAP32[r91>>2]+(r81<<2)>>2];r71=r81+1|0;if((r71|0)<(r76|0)){r81=r71}else{break}}}}while(0);do{if((HEAP8[r46]&1)!=0){r81=HEAP32[r11>>2];r76=HEAP32[r81+(r75*12&-1)+4>>2];r91=Math_imul(r76,r68)|0;r74=HEAP32[r81+(r75*12&-1)>>2];if(!((r74+(r91<<2)|0)==0|(r76|0)>-1)){r4=854;break L696}if(!r70){r4=1160;break L696}if((HEAP32[r81+(r75*12&-1)+8>>2]|0)<=(r68|0)){r4=1161;break L696}if((r76|0)!=(HEAP32[r72+84>>2]|0)){r4=862;break L696}if((r76|0)<=0){break}r81=r72+80|0;r95=0;while(1){HEAPF32[r74+(r95+r91<<2)>>2]=HEAPF32[HEAP32[r81>>2]+(r95<<2)>>2];r71=r95+1|0;if((r71|0)<(r76|0)){r95=r71}else{break}}}}while(0);r72=r75+1|0;r95=HEAP32[r47>>2];r76=HEAP32[r2>>2];if(r72>>>0<r95-r76>>2>>>0){r75=r72;r79=r76}else{r110=r76;r111=r95;break}}}do{if(r109){do{if((HEAP32[r20>>2]|0)>1){r79=HEAP32[r110>>2];r75=HEAP32[r79+220>>2];if((HEAP32[r79+224>>2]-r75|0)>0){r112=0;r113=r79;r114=r75;r115=r110}else{r116=r110;r117=r111;break}while(1){if((HEAP32[HEAP32[r113+232>>2]+(r112*20&-1)+16>>2]|0)>0){r118=r115;break}r75=HEAPF32[r114+(r112*56&-1)+40>>2];do{if(r75>0){HEAP32[r1>>2]=0;HEAP32[r24>>2]=0;r79=HEAP32[r21>>2];HEAP32[r22>>2]=r79;HEAPF32[r49>>2]=0;if((r79|0)<=-1){r4=870;break L696}__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_14CwiseNullaryOpINS_8internal18scalar_constant_opIfEES1_EEEERKNS_9ArrayBaseIT_EE(r13,r48);r79=HEAP32[r2>>2];r70=HEAP32[r47>>2];if((r79|0)==(r70|0)){r119=HEAP32[r14>>2]}else{r95=r79;while(1){r79=HEAP32[HEAP32[r95>>2]+232>>2];r76=r79+(r112*20&-1)+4|0;r72=HEAP32[r76>>2];if((r72|0)<0){r4=876;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r29,r72);r72=HEAP32[r24>>2];if((r72|0)!=(HEAP32[r76>>2]|0)){r4=883;break L696}r76=(r72|0)>0;if(r76){r81=r79+(r112*20&-1)|0;r79=HEAP32[r1>>2];r91=0;while(1){HEAPF32[r79+(r91<<2)>>2]=HEAPF32[HEAP32[r81>>2]+(r91<<2)>>2];r74=r91+1|0;if((r74|0)<(r72|0)){r91=r74}else{break}}}if((HEAP32[r14>>2]|0)!=(r72|0)){r4=889;break L696}do{if(r76){r91=HEAP32[r19>>2];r81=HEAP32[r1>>2];HEAPF32[r91>>2]=HEAPF32[r91>>2]+HEAPF32[r81>>2];if((r72|0)>1){r120=1}else{break}while(1){r79=r91+(r120<<2)|0;HEAPF32[r79>>2]=HEAPF32[r79>>2]+HEAPF32[r81+(r120<<2)>>2];r79=r120+1|0;if((r79|0)<(r72|0)){r120=r79}else{break}}}}while(0);r76=r95+4|0;if((r76|0)==(r70|0)){r119=r72;break}else{r95=r76}}}r95=1/(HEAP32[r20>>2]|0);if((r119|0)<=-1){r4=900;break L696}do{if((r119|0)>0){r70=HEAP32[r19>>2];HEAPF32[r70>>2]=r95*HEAPF32[r70>>2];if((r119|0)>1){r121=1}else{break}while(1){r76=r70+(r121<<2)|0;HEAPF32[r76>>2]=r95*HEAPF32[r76>>2];r76=r121+1|0;if((r76|0)<(r119|0)){r121=r76}else{break}}}}while(0);r95=HEAP32[r2>>2];r70=HEAP32[r47>>2];if((r95|0)!=(r70|0)){r72=r95;while(1){r95=HEAP32[r72>>2]+232|0;r76=HEAP32[r95>>2];r81=r76+(r112*20&-1)+4|0;r91=HEAP32[r81>>2];if((r91|0)<0){r4=907;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r29,r91);r91=HEAP32[r24>>2];if((r91|0)!=(HEAP32[r81>>2]|0)){r4=914;break L696}if((r91|0)>0){r81=r76+(r112*20&-1)|0;r76=HEAP32[r1>>2];r79=0;while(1){HEAPF32[r76+(r79<<2)>>2]=HEAPF32[HEAP32[r81>>2]+(r79<<2)>>2];r74=r79+1|0;if((r74|0)<(r91|0)){r79=r74}else{break}}}if((HEAP32[r14>>2]|0)!=(r91|0)){r4=917;break L696}if(r91>>>0>1073741823){r4=920;break L696}r79=r91<<2;r81=_malloc(r79+16|0);if((r81|0)==0){r122=0}else{r76=r81+16&-16;HEAP32[r76-4>>2]=r81;r122=r76}if(!((r122|0)!=0|(r79|0)==0)){r4=925;break L696}HEAP32[r45>>2]=r122;HEAP32[r44>>2]=r91;r79=HEAP32[r24>>2];if((r79|0)<0){r4=928;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r12,r79);if((HEAP32[r44>>2]|0)!=(r79|0)){r4=935;break L696}r76=(r79|0)>0;if(r76){r81=HEAP32[r1>>2];r74=HEAP32[r19>>2];r71=HEAP32[r45>>2];r94=0;while(1){r73=HEAPF32[r81+(r94<<2)>>2];HEAPF32[r71+(r94<<2)>>2]=r73+r75*(HEAPF32[r74+(r94<<2)>>2]-r73);r73=r94+1|0;if((r73|0)<(r79|0)){r94=r73}else{break}}}r94=HEAP32[r95>>2];r74=r94+(r112*20&-1)|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r74|0,r79);if((HEAP32[r94+(r112*20&-1)+4>>2]|0)!=(r79|0)){r4=946;break L696}if(r76){r94=r74|0;r74=HEAP32[r45>>2];r71=0;while(1){HEAPF32[HEAP32[r94>>2]+(r71<<2)>>2]=HEAPF32[r74+(r71<<2)>>2];r81=r71+1|0;if((r81|0)<(r79|0)){r71=r81}else{r123=r74;r4=949;break}}}else{r74=HEAP32[r45>>2];if((r74|0)!=0){r123=r74;r4=949}}if(r4==949){r4=0;_free(HEAP32[r123-4>>2])}r74=r72+4|0;if((r74|0)==(r70|0)){break}else{r72=r74}}}r72=HEAP32[r19>>2];if((r72|0)!=0){_free(HEAP32[r72-4>>2])}r72=HEAP32[r1>>2];if((r72|0)==0){break}_free(HEAP32[r72-4>>2])}}while(0);r75=r112+1|0;r72=HEAP32[r2>>2];r70=HEAP32[r72>>2];r74=HEAP32[r70+220>>2];if((r75|0)<((HEAP32[r70+224>>2]-r74|0)/56&-1|0)){r112=r75;r113=r70;r114=r74;r115=r72}else{r118=r72;break}}r116=r118;r117=HEAP32[r47>>2]}else{r116=r110;r117=r111}}while(0);if((r116|0)==(r117|0)){break}else{r124=r116}while(1){r72=HEAP32[r124>>2];r74=HEAP32[r72+232>>2];r70=r74+4|0;r75=HEAP32[r70>>2];if(r75>>>0>1073741823){r4=968;break L696}r71=r75<<2;r79=_malloc(r71+16|0);if((r79|0)==0){r125=0}else{r94=r79+16&-16;HEAP32[r94-4>>2]=r79;r125=r94}if(!((r125|0)!=0|(r71|0)==0)){r4=972;break L696}HEAP32[r9>>2]=r125;HEAP32[r15>>2]=r75;r75=HEAP32[r70>>2];if((r75|0)<0){r4=974;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r32,r75);r75=HEAP32[r15>>2];if((r75|0)!=(HEAP32[r70>>2]|0)){r4=981;break L696}do{if((r75|0)>0){r70=r74|0;r71=HEAP32[r9>>2];HEAPF32[r71>>2]=1-HEAPF32[HEAP32[r70>>2]>>2];if((r75|0)>1){r126=1}else{break}while(1){HEAPF32[r71+(r126<<2)>>2]=1-HEAPF32[HEAP32[r70>>2]+(r126<<2)>>2];r94=r126+1|0;if((r94|0)<(r75|0)){r126=r94}else{break}}}}while(0);r74=r72+52|0;if((HEAP32[r74>>2]|0)!=(r75|0)){r4=989;break L696}r70=r72+84|0;if((r75|0)!=(HEAP32[r70>>2]|0)){r4=992;break L696}r71=r72+220|0;r94=1/(HEAP32[HEAP32[r71>>2]+8>>2]|0);if(r75>>>0>1073741823){r4=995;break L696}r79=r75<<2;r76=_malloc(r79+16|0);if((r76|0)==0){r127=0}else{r95=r76+16&-16;HEAP32[r95-4>>2]=r76;r127=r95}if(!((r127|0)!=0|(r79|0)==0)){r4=1e3;break L696}HEAP32[r40>>2]=r127;HEAP32[r43>>2]=r75;r79=HEAP32[r70>>2];if((r79|0)<0){r4=1003;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r41,r79);r79=HEAP32[r43>>2];if((r79|0)!=(HEAP32[r70>>2]|0)){r4=1010;break L696}r70=(r79|0)>0;if(r70){r95=r72+48|0;r76=r72+80|0;r81=HEAP32[r40>>2];r91=HEAP32[r9>>2];r73=0;while(1){HEAPF32[r81+(r73<<2)>>2]=r94*(HEAPF32[HEAP32[r95>>2]+(r73<<2)>>2]*HEAPF32[r91+(r73<<2)>>2]-HEAPF32[HEAP32[r76>>2]+(r73<<2)>>2]);r93=r73+1|0;if((r93|0)<(r79|0)){r73=r93}else{break}}}r73=r72+88|0;if((r79|0)<0){r4=1017;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r73|0,r79);if((HEAP32[r72+92>>2]|0)!=(r79|0)){r4=1024;break L696}if(r70){r76=r73|0;r73=HEAP32[r40>>2];r91=0;while(1){HEAPF32[HEAP32[r76>>2]+(r91<<2)>>2]=HEAPF32[r73+(r91<<2)>>2];r95=r91+1|0;if((r95|0)<(r79|0)){r91=r95}else{r128=r73;r4=1027;break}}}else{r73=HEAP32[r40>>2];if((r73|0)!=0){r128=r73;r4=1027}}if(r4==1027){r4=0;_free(HEAP32[r128-4>>2])}r73=HEAP32[r74>>2];if((r73|0)!=(HEAP32[r15>>2]|0)){r4=1029;break L696}if((HEAP32[r72+12>>2]|0)!=(r73|0)){r4=1032;break L696}if(r73>>>0>1073741823){r4=1035;break L696}r91=r73<<2;r79=_malloc(r91+16|0);if((r79|0)==0){r129=0}else{r76=r79+16&-16;HEAP32[r76-4>>2]=r79;r129=r76}if(!((r129|0)!=0|(r91|0)==0)){r4=1040;break L696}HEAP32[r28>>2]=r129;HEAP32[r30>>2]=r73;r73=HEAP32[r15>>2];if((r73|0)<0){r4=1043;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8,r73);if((HEAP32[r30>>2]|0)!=(r73|0)){r4=1050;break L696}if((r73|0)>0){r91=r72+8|0;r76=r72+48|0;r79=HEAP32[r9>>2];r70=0;while(1){HEAPF32[HEAP32[r28>>2]+(r70<<2)>>2]=HEAPF32[HEAP32[r91>>2]+(r70<<2)>>2]+HEAPF32[HEAP32[r76>>2]+(r70<<2)>>2]*HEAPF32[r79+(r70<<2)>>2];r95=r70+1|0;if((r95|0)<(r73|0)){r70=r95}else{break}}r130=HEAP32[r30>>2]}else{r130=r73}r70=r72+16|0;if((r130|0)!=(HEAP32[r72+20>>2]|0)){r4=1058;break L696}if((HEAP32[r72+36>>2]|0)!=(r130|0)){r4=1061;break L696}if((r130|0)!=(HEAP32[r72+28>>2]|0)){r4=1064;break L696}HEAP32[r26>>2]=r6;HEAPF32[r31>>2]=2;HEAP32[r33>>2]=r70;HEAPF32[r36>>2]=1;HEAP32[r35>>2]=r6;HEAP32[r51>>2]=r6;HEAP32[r52>>2]=r6;HEAPF32[r53>>2]=2;HEAP32[r54>>2]=r70;HEAPF32[r55>>2]=1;HEAP32[r56>>2]=r72+32;HEAP32[r57>>2]=r6;HEAP32[r58>>2]=r72+24;HEAP32[r59>>2]=r6;HEAP32[r60>>2]=r6;if(r130>>>0>1073741823){r4=1067;break L696}r70=r130<<2;r79=_malloc(r70+16|0);if((r79|0)==0){r131=0}else{r76=r79+16&-16;HEAP32[r76-4>>2]=r79;r131=r76}if(!((r131|0)!=0|(r70|0)==0)){r4=1072;break L696}HEAP32[r10>>2]=r131;HEAP32[r37>>2]=r130;r70=HEAP32[HEAP32[r60>>2]+4>>2];if((r70|0)<0){r4=1075;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r61,r70);__ZN5Eigen9DenseBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE10lazyAssignINS_13CwiseBinaryOpINS_8internal18scalar_quotient_opIfEEKNS5_INS6_13scalar_sum_opIfEEKNS_12CwiseUnaryOpINS6_13scalar_add_opIfEEKNSB_INS6_18scalar_opposite_opIfEEKNS5_INS6_17scalar_product_opIffEEKNSB_INS6_18scalar_multiple_opIfEEKS2_EESK_EEEEEEKNS5_ISH_SK_SK_EEEEKNS5_ISA_KNS5_ISA_SS_KNS5_ISH_SU_SK_EEEESU_EEEEEERS2_RKNS0_IT_EE(r7,r62);r70=HEAP32[r28>>2];if((r70|0)!=0){_free(HEAP32[r70-4>>2])}r70=HEAP32[r37>>2];r76=r72+108|0;if((r70|0)!=(HEAP32[r76>>2]|0)){r4=1089;break L696}r79=1/(HEAP32[HEAP32[r71>>2]+8>>2]|0);if(r70>>>0>1073741823){r4=1092;break L696}r91=r70<<2;r74=_malloc(r91+16|0);if((r74|0)==0){r132=0}else{r95=r74+16&-16;HEAP32[r95-4>>2]=r74;r132=r95}if(!((r132|0)!=0|(r91|0)==0)){r4=1097;break L696}HEAP32[r34>>2]=r132;HEAP32[r27>>2]=r70;r70=HEAP32[r76>>2];if((r70|0)<0){r4=1100;break L696}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r39,r70);r70=HEAP32[r27>>2];if((r70|0)!=(HEAP32[r76>>2]|0)){r4=1107;break L696}r76=(r70|0)>0;do{if(r76){r91=HEAP32[r10>>2];r95=r72+104|0;r74=HEAP32[r34>>2];HEAPF32[r74>>2]=r79*(HEAPF32[r91>>2]-HEAPF32[HEAP32[r95>>2]>>2]);if((r70|0)>1){r133=1}else{break}while(1){HEAPF32[r74+(r133<<2)>>2]=r79*(HEAPF32[r91+(r133<<2)>>2]-HEAPF32[HEAP32[r95>>2]+(r133<<2)>>2]);r94=r133+1|0;if((r94|0)<(r70|0)){r133=r94}else{r4=1113;break}}}else{r4=1113}}while(0);if(r4==1113){r4=0;if((r70|0)<0){r4=1114;break L696}}r79=r72+112|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r79|0,r70);if((HEAP32[r72+116>>2]|0)!=(r70|0)){r4=1121;break L696}if(r76){r71=r79|0;r79=HEAP32[r34>>2];r73=0;while(1){HEAPF32[HEAP32[r71>>2]+(r73<<2)>>2]=HEAPF32[r79+(r73<<2)>>2];r95=r73+1|0;if((r95|0)<(r70|0)){r73=r95}else{r134=r79;r4=1124;break}}}else{r79=HEAP32[r34>>2];if((r79|0)!=0){r134=r79;r4=1124}}if(r4==1124){r4=0;_free(HEAP32[r134-4>>2])}r79=HEAP32[r10>>2];if((r79|0)!=0){_free(HEAP32[r79-4>>2])}r79=HEAP32[r9>>2];if((r79|0)!=0){_free(HEAP32[r79-4>>2])}r79=r124+4|0;if((r79|0)==(r117|0)){break}else{r124=r79}}}}while(0);r79=r68+1|0;if((r79|0)<(HEAP32[r23>>2]|0)){r68=r79;r69=r109}else{r4=1162;break}}if(r4==701){___assert_fail(4232,2464,407,5864)}else if(r4==703){___assert_fail(4232,2464,407,5864)}else if(r4==705){___assert_fail(2016,1952,162,5984)}else if(r4==707){___assert_fail(3960,4544,303,5992)}else if(r4==709){___assert_fail(2016,1952,162,5984)}else if(r4==711){___assert_fail(3960,4544,303,5992)}else if(r4==713){___assert_fail(2016,1952,162,5984)}else if(r4==721){___assert_fail(4424,4272,144,6032)}else if(r4==723){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==728){___assert_fail(2264,2200,510,5960)}else if(r4==730){___assert_fail(4424,4272,144,6032)}else if(r4==732){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==737){___assert_fail(2264,2200,510,5960)}else if(r4==740){___assert_fail(1768,5120,76,6016)}else if(r4==742){___assert_fail(4424,4272,144,6032)}else if(r4==747){___assert_fail(2264,2200,510,5960)}else if(r4==750){___assert_fail(4424,4272,144,6032)}else if(r4==752){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==757){___assert_fail(2264,2200,510,5960)}else if(r4==759){___assert_fail(4424,4272,144,6032)}else if(r4==761){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==766){___assert_fail(4424,4272,144,6032)}else if(r4==768){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==773){___assert_fail(2264,2200,510,5960)}else if(r4==775){___assert_fail(4424,4272,144,6032)}else if(r4==777){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==782){___assert_fail(4424,4272,144,6032)}else if(r4==784){___assert_fail(4424,4272,144,6032)}else if(r4==786){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==791){___assert_fail(4424,4272,144,6032)}else if(r4==797){___assert_fail(4424,4272,144,6032)}else if(r4==802){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==807){___assert_fail(2264,2200,510,5960)}else if(r4==821){___assert_fail(2016,1952,162,5984)}else if(r4==829){___assert_fail(2264,2200,510,5960)}else if(r4==832){___assert_fail(2016,1952,162,5984)}else if(r4==840){___assert_fail(2264,2200,510,5960)}else if(r4==843){___assert_fail(2016,1952,162,5984)}else if(r4==851){___assert_fail(2264,2200,510,5960)}else if(r4==854){___assert_fail(2016,1952,162,5984)}else if(r4==862){___assert_fail(2264,2200,510,5960)}else if(r4==870){___assert_fail(1768,5120,76,6016)}else if(r4==876){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==883){___assert_fail(2264,2200,510,5960)}else if(r4==889){___assert_fail(1160,920,149,5960)}else if(r4==900){___assert_fail(1768,5120,76,6016)}else if(r4==907){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==914){___assert_fail(2264,2200,510,5960)}else if(r4==917){___assert_fail(4424,4272,144,6032)}else if(r4==920){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==925){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==928){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==935){___assert_fail(2264,2200,510,5960)}else if(r4==946){___assert_fail(2264,2200,510,5960)}else if(r4==968){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==972){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==974){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==981){___assert_fail(2264,2200,510,5960)}else if(r4==989){___assert_fail(4424,4272,144,6032)}else if(r4==992){___assert_fail(4424,4272,144,6032)}else if(r4==995){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1e3){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1003){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1010){___assert_fail(2264,2200,510,5960)}else if(r4==1017){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1024){___assert_fail(2264,2200,510,5960)}else if(r4==1029){___assert_fail(4424,4272,144,6032)}else if(r4==1032){___assert_fail(4424,4272,144,6032)}else if(r4==1035){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1040){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1043){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1050){___assert_fail(2264,2200,510,5960)}else if(r4==1058){___assert_fail(4424,4272,144,6032)}else if(r4==1061){___assert_fail(4424,4272,144,6032)}else if(r4==1064){___assert_fail(4424,4272,144,6032)}else if(r4==1067){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1072){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1075){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1089){___assert_fail(4424,4272,144,6032)}else if(r4==1092){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1097){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1100){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1107){___assert_fail(2264,2200,510,5960)}else if(r4==1114){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==1121){___assert_fail(2264,2200,510,5960)}else if(r4==671){___assert_fail(4424,4272,144,6032)}else if(r4==673){___assert_fail(4424,4272,144,6032)}else if(r4==675){___assert_fail(4424,4272,144,6032)}else if(r4==677){___assert_fail(4424,4272,144,6032)}else if(r4==679){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==685){___assert_fail(4424,4272,144,6032)}else if(r4==687){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==694){___assert_fail(2264,2200,510,5960)}else if(r4==696){___assert_fail(4232,2464,407,5864)}else if(r4==698){___assert_fail(4232,2464,407,5864)}else if(r4==636){___assert_fail(4424,4272,144,6032)}else if(r4==638){___assert_fail(4424,4272,144,6032)}else if(r4==640){___assert_fail(4424,4272,144,6032)}else if(r4==642){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==647){___assert_fail(2264,2200,510,5960)}else if(r4==625){___assert_fail(2264,2200,510,5960)}else if(r4==627){___assert_fail(4424,4272,144,6032)}else if(r4==629){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==634){___assert_fail(2264,2200,510,5960)}else if(r4==649){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==654){___assert_fail(2264,2200,510,5960)}else if(r4==618){___assert_fail(4424,4272,144,6032)}else if(r4==620){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==656){___assert_fail(4424,4272,144,6032)}else if(r4==658){___assert_fail(4424,4272,144,6032)}else if(r4==660){___assert_fail(4424,4272,144,6032)}else if(r4==662){___assert_fail(4424,4272,144,6032)}else if(r4==664){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==669){___assert_fail(2264,2200,510,5960)}else if(r4==1150){___assert_fail(3960,4544,303,5992)}else if(r4==1151){___assert_fail(3960,4544,303,5992)}else if(r4==1152){___assert_fail(2520,2464,127,5864)}else if(r4==1153){___assert_fail(2520,2464,127,5864)}else if(r4==1154){___assert_fail(4656,4544,278,5992)}else if(r4==1155){___assert_fail(4656,4544,278,5992)}else if(r4==1156){___assert_fail(4656,4544,278,5992)}else if(r4==1157){___assert_fail(4656,4544,278,5992)}else if(r4==1158){___assert_fail(4656,4544,278,5992)}else if(r4==1159){___assert_fail(4656,4544,278,5992)}else if(r4==1160){___assert_fail(4656,4544,278,5992)}else if(r4==1161){___assert_fail(4656,4544,278,5992)}else if(r4==1162){STACKTOP=r5;return}}function __Z12CARFACDetectPN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+4|0;r3=HEAP32[r2>>2];if((r3|0)<=-1){___assert_fail(1768,5120,76,6016)}r4=r1|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r4,r3);if((HEAP32[r2>>2]|0)!=(r3|0)){___assert_fail(2264,2200,510,5960)}do{if((r3|0)>0){r5=r1|0;r6=0;while(1){r7=HEAP32[r5>>2]+(r6<<2)|0;r8=HEAPF32[r7>>2]+.17499999701976776;HEAPF32[r7>>2]=r8<0?0:r8;r8=r6+1|0;if((r8|0)<(r3|0)){r6=r8}else{break}}r6=HEAP32[r2>>2];if((r6|0)>=0){r9=r6;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}else{r9=0}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r4,r9);r9=HEAP32[r2>>2];if((r9|0)<=0){return}r2=r1|0;r1=0;while(1){r4=HEAP32[r2>>2]+(r1<<2)|0;r3=HEAPF32[r4>>2];r6=r3*r3;r5=r6*r3;HEAPF32[r4>>2]=r5/(r6+(r5+.10000000149011612));r5=r1+1|0;if((r5|0)<(r9|0)){r1=r5}else{break}}return}function __ZN5Eigen9DenseBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE10lazyAssignINS_13CwiseBinaryOpINS_8internal18scalar_quotient_opIfEEKNS5_INS6_13scalar_sum_opIfEEKNS_12CwiseUnaryOpINS6_13scalar_add_opIfEEKNSB_INS6_18scalar_opposite_opIfEEKNS5_INS6_17scalar_product_opIffEEKNSB_INS6_18scalar_multiple_opIfEEKS2_EESK_EEEEEEKNS5_ISH_SK_SK_EEEEKNS5_ISA_KNS5_ISA_SS_KNS5_ISH_SU_SK_EEEESU_EEEEEERS2_RKNS0_IT_EE(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=HEAP32[r1+4>>2];r4=r2+136|0;r5=HEAP32[r4>>2];if((r3|0)!=(HEAP32[r5+4>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r3|0)<=0){return}r6=r2+20|0;r7=r2+24|0;r8=r2+28|0;r9=r2+40|0;r10=r2+44|0;r11=r2+48|0;r12=r2+80|0;r13=r2+84|0;r14=r2+88|0;r15=r2+100|0;r16=r2+108|0;r17=r2+112|0;r18=r2+120|0;r19=r2+132|0;r2=r1;r1=0;r20=r5;while(1){HEAPF32[HEAP32[r2>>2]+(r1<<2)>>2]=(HEAPF32[r9>>2]-HEAPF32[HEAP32[HEAP32[r6>>2]>>2]+(r1<<2)>>2]*HEAPF32[r7>>2]*HEAPF32[HEAP32[HEAP32[r8>>2]>>2]+(r1<<2)>>2]+HEAPF32[HEAP32[HEAP32[r10>>2]>>2]+(r1<<2)>>2]*HEAPF32[HEAP32[HEAP32[r11>>2]>>2]+(r1<<2)>>2])/(HEAPF32[r15>>2]-HEAPF32[HEAP32[HEAP32[r12>>2]>>2]+(r1<<2)>>2]*HEAPF32[r13>>2]*HEAPF32[HEAP32[HEAP32[r14>>2]>>2]+(r1<<2)>>2]+HEAPF32[HEAP32[HEAP32[r16>>2]>>2]+(r1<<2)>>2]*HEAPF32[HEAP32[HEAP32[r17>>2]>>2]+(r1<<2)>>2]*HEAPF32[HEAP32[HEAP32[r18>>2]>>2]+(r1<<2)>>2]+HEAPF32[HEAP32[HEAP32[r19>>2]>>2]+(r1<<2)>>2]*HEAPF32[HEAP32[r20>>2]+(r1<<2)>>2]);r5=r1+1|0;if((r5|0)>=(r3|0)){break}r1=r5;r20=HEAP32[r4>>2]}return}function __ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1,r2){var r3,r4,r5,r6,r7;if((r2|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}r3=r1+4|0;if((HEAP32[r3>>2]|0)==(r2|0)){HEAP32[r3>>2]=r2;return}r4=r1|0;r1=HEAP32[r4>>2];if((r1|0)!=0){_free(HEAP32[r1-4>>2])}if((r2|0)==0){HEAP32[r4>>2]=0;HEAP32[r3>>2]=r2;return}if(r2>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r1=r2<<2;r5=_malloc(r1+16|0);if((r5|0)==0){r6=0}else{r7=r5+16&-16;HEAP32[r7-4>>2]=r5;r6=r7}if(!((r6|0)!=0|(r1|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r4>>2]=r6;HEAP32[r3>>2]=r2;return}function __ZN5Eigen8internal19throw_std_bad_allocEv(){var r1;r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=6488;___cxa_throw(r1,13184,74)}function __ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_12CwiseUnaryOpINS_8internal18scalar_multiple_opIfEEKS1_EEEERKNS_9ArrayBaseIT_EE(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=r2;r4=HEAP32[HEAP32[r3>>2]+4>>2];r5=r1|0;if(r4>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r6=r4<<2;r7=_malloc(r6+16|0);if((r7|0)==0){r8=0}else{r9=r7+16&-16;HEAP32[r9-4>>2]=r7;r8=r9}if(!((r8|0)!=0|(r6|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r5>>2]=r8;r8=r1+4|0;HEAP32[r8>>2]=r4;r4=HEAP32[HEAP32[r3>>2]+4>>2];if((r4|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1|0,r4);r4=HEAP32[r8>>2];r8=HEAP32[r3>>2];if((r4|0)!=(HEAP32[r8+4>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r4|0)<=0){return}r1=r2+4|0;HEAPF32[HEAP32[r5>>2]>>2]=HEAPF32[HEAP32[r8>>2]>>2]*HEAPF32[r1>>2];if((r4|0)>1){r10=1}else{return}while(1){HEAPF32[HEAP32[r5>>2]+(r10<<2)>>2]=HEAPF32[HEAP32[HEAP32[r3>>2]>>2]+(r10<<2)>>2]*HEAPF32[r1>>2];r8=r10+1|0;if((r8|0)<(r4|0)){r10=r8}else{break}}return}function __ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_14CwiseNullaryOpINS_8internal18scalar_constant_opIfEES1_EEEERKNS_9ArrayBaseIT_EE(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r2;r4=HEAP32[r3>>2];r5=r1|0;if(r4>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r6=r4<<2;r7=_malloc(r6+16|0);if((r7|0)==0){r8=0}else{r9=r7+16&-16;HEAP32[r9-4>>2]=r7;r8=r9}if(!((r8|0)!=0|(r6|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r5>>2]=r8;r8=r1+4|0;HEAP32[r8>>2]=r4;r4=HEAP32[r3>>2];if((r4|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1|0,r4);r4=HEAP32[r8>>2];if((r4|0)!=(HEAP32[r3>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r4|0)<=0){return}r3=r2+8|0;r2=0;while(1){HEAPF32[HEAP32[r5>>2]+(r2<<2)>>2]=HEAPF32[r3>>2];r8=r2+1|0;if((r8|0)<(r4|0)){r2=r8}else{break}}return}function __ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r1,r2,r3){var r4,r5,r6,r7,r8,r9;if((r3|r2|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}do{if(!((r2|0)==0|(r3|0)==0)){if((2147483647/(r3|0)&-1|0)>=(r2|0)){break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);r4=Math_imul(r3,r2)|0;r5=r1+4|0;r6=r1+8|0;if((Math_imul(HEAP32[r6>>2],HEAP32[r5>>2])|0)==(r4|0)){HEAP32[r5>>2]=r2;HEAP32[r6>>2]=r3;return}r7=r1|0;r1=HEAP32[r7>>2];if((r1|0)!=0){_free(HEAP32[r1-4>>2])}if((r4|0)==0){HEAP32[r7>>2]=0;HEAP32[r5>>2]=r2;HEAP32[r6>>2]=r3;return}if(r4>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r1=r4<<2;r4=_malloc(r1+16|0);if((r4|0)==0){r8=0}else{r9=r4+16&-16;HEAP32[r9-4>>2]=r4;r8=r9}if(!((r8|0)!=0|(r1|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r7>>2]=r8;HEAP32[r5>>2]=r2;HEAP32[r6>>2]=r3;return}function __ZNSt3__16vectorIN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEENS_9allocatorIS3_EEE8__appendEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=0;r4=r1+8|0;r5=r1+4|0;r6=HEAP32[r5>>2];r7=HEAP32[r4>>2];r8=r6;if(((r7-r8|0)/12&-1)>>>0>=r2>>>0){r9=r2;r10=r6;while(1){if((r10|0)==0){r11=0}else{HEAP32[r10>>2]=0;HEAP32[r10+4>>2]=0;HEAP32[r10+8>>2]=0;r11=HEAP32[r5>>2]}r6=r11+12|0;HEAP32[r5>>2]=r6;r12=r9-1|0;if((r12|0)==0){break}else{r9=r12;r10=r6}}return}r10=r1|0;r1=HEAP32[r10>>2];r9=(r8-r1|0)/12&-1;r8=r9+r2|0;if(r8>>>0>357913941){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r11=(r7-r1|0)/12&-1;if(r11>>>0>178956969){r13=357913941;r3=1282}else{r1=r11<<1;r11=r1>>>0<r8>>>0?r8:r1;if((r11|0)==0){r14=0;r15=0}else{r13=r11;r3=1282}}do{if(r3==1282){r11=r13*12&-1;r1=(r11|0)==0?1:r11;while(1){r16=_malloc(r1);if((r16|0)!=0){r3=1293;break}r11=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r3==1293){r14=r16;r15=r13;break}r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=6488;___cxa_throw(r1,13184,74)}}while(0);r13=r14+(r9*12&-1)|0;r9=r2;r2=r13;while(1){if((r2|0)==0){r17=0}else{HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;r17=r2}r18=r17+12|0;r16=r9-1|0;if((r16|0)==0){break}else{r9=r16;r2=r18}}r2=r14+(r15*12&-1)|0;r15=HEAP32[r10>>2];r14=HEAP32[r5>>2];do{if((r14|0)==(r15|0)){HEAP32[r10>>2]=r13;HEAP32[r5>>2]=r18;HEAP32[r4>>2]=r2;r19=r15}else{r9=r14;r17=r13;L1442:while(1){r20=r17-12|0;r16=r9-12|0;do{if((r20|0)!=0){r1=r20|0;r11=r9-12+4|0;r8=HEAP32[r11>>2];r7=r9-12+8|0;r6=HEAP32[r7>>2];r12=Math_imul(r6,r8)|0;r21=r20|0;if(r12>>>0>1073741823){r3=1302;break L1442}r22=r12<<2;r12=_malloc(r22+16|0);if((r12|0)==0){r23=0}else{r24=r12+16&-16;HEAP32[r24-4>>2]=r12;r23=r24}if(!((r23|0)!=0|(r22|0)==0)){r3=1307;break L1442}HEAP32[r21>>2]=r23;r22=r17-12+4|0;HEAP32[r22>>2]=r8;r8=r17-12+8|0;HEAP32[r8>>2]=r6;r6=HEAP32[r11>>2];r24=HEAP32[r7>>2];if((r24|r6|0)<0){r3=1312;break L1442}if(!((r6|0)==0|(r24|0)==0)){if((r6|0)>(2147483647/(r24|0)&-1|0)){r3=1312;break L1442}}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r1,r6,r24);r24=HEAP32[r22>>2];if((r24|0)!=(HEAP32[r11>>2]|0)){r3=1317;break L1442}r11=HEAP32[r8>>2];if((r11|0)!=(HEAP32[r7>>2]|0)){r3=1317;break L1442}r7=Math_imul(r11,r24)|0;if((r7|0)<=0){break}r24=r16|0;r11=0;while(1){HEAPF32[HEAP32[r21>>2]+(r11<<2)>>2]=HEAPF32[HEAP32[r24>>2]+(r11<<2)>>2];r8=r11+1|0;if((r8|0)<(r7|0)){r11=r8}else{break}}}}while(0);if((r16|0)==(r15|0)){r3=1327;break}else{r9=r16;r17=r20}}if(r3==1312){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r3==1327){r17=HEAP32[r10>>2];r9=HEAP32[r5>>2];HEAP32[r10>>2]=r20;HEAP32[r5>>2]=r18;HEAP32[r4>>2]=r2;if((r17|0)==(r9|0)){r19=r17;break}else{r25=r9}while(1){r9=r25-12|0;r11=HEAP32[r9>>2];if((r11|0)!=0){_free(HEAP32[r11-4>>2])}if((r17|0)==(r9|0)){r19=r17;break}else{r25=r9}}}else if(r3==1317){___assert_fail(2264,2200,510,5960)}else if(r3==1302){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r3==1307){__ZN5Eigen8internal19throw_std_bad_allocEv()}}}while(0);if((r19|0)==0){return}_free(r19);return}function __ZN9CARCoeffsD2Ev(r1){var r2;r2=HEAP32[r1+48>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+40>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+32>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+24>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+16>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+8>>2];if((r2|0)==0){return}_free(HEAP32[r2-4>>2]);return}function __ZNSt3__16vectorIiNS_9allocatorIiEEE6assignIPiEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIiNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=0;r5=r3-r2|0;r6=r5>>2;r7=r1+8|0;r8=HEAP32[r7>>2];r9=r1|0;r10=HEAP32[r9>>2];r11=r10;if(r6>>>0<=r8-r11>>2>>>0){r12=r1+4|0;r13=HEAP32[r12>>2]-r11|0;r14=r13>>2;if(r6>>>0<=r14>>>0){_memmove(r10,r2,r5,4,0);r5=r10+(r6<<2)|0;r15=HEAP32[r12>>2];if((r5|0)==(r15|0)){return}HEAP32[r12>>2]=r15+(~((r15-4+ -r5|0)>>>2)<<2);return}r5=r2+(r14<<2)|0;_memmove(r10,r2,r13,4,0);if((r5|0)==(r3|0)){return}r13=r5;r5=HEAP32[r12>>2];while(1){if((r5|0)==0){r16=0}else{HEAP32[r5>>2]=HEAP32[r13>>2];r16=HEAP32[r12>>2]}r14=r16+4|0;HEAP32[r12>>2]=r14;r15=r13+4|0;if((r15|0)==(r3|0)){break}else{r13=r15;r5=r14}}return}if((r10|0)==0){r17=r8}else{r8=r1+4|0;r5=HEAP32[r8>>2];if((r10|0)!=(r5|0)){HEAP32[r8>>2]=r5+(~((r5-4+ -r11|0)>>>2)<<2)}_free(r10);HEAP32[r7>>2]=0;HEAP32[r8>>2]=0;HEAP32[r9>>2]=0;r17=0}if(r6>>>0>1073741823){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r8=r17;do{if(r8>>2>>>0>536870910){r18=1073741823}else{r17=r8>>1;r10=r17>>>0<r6>>>0?r6:r17;if(r10>>>0<=1073741823){r18=r10;break}__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}}while(0);r6=r18<<2;r8=(r6|0)==0?1:r6;while(1){r19=_malloc(r8);if((r19|0)!=0){break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){r4=1386;break}FUNCTION_TABLE[r6]()}if(r4==1386){r4=___cxa_allocate_exception(4);HEAP32[r4>>2]=6488;___cxa_throw(r4,13184,74)}r4=r19;r19=r1+4|0;HEAP32[r19>>2]=r4;HEAP32[r9>>2]=r4;HEAP32[r7>>2]=r4+(r18<<2);if((r2|0)==(r3|0)){return}else{r20=r2;r21=r4}while(1){if((r21|0)==0){r22=0}else{HEAP32[r21>>2]=HEAP32[r20>>2];r22=HEAP32[r19>>2]}r4=r22+4|0;HEAP32[r19>>2]=r4;r2=r20+4|0;if((r2|0)==(r3|0)){break}else{r20=r2;r21=r4}}return}function __ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=0;r5=r3-r2|0;r6=r5>>2;r7=r1+8|0;r8=HEAP32[r7>>2];r9=r1|0;r10=HEAP32[r9>>2];r11=r10;if(r6>>>0<=r8-r11>>2>>>0){r12=r1+4|0;r13=HEAP32[r12>>2]-r11|0;r14=r13>>2;if(r6>>>0<=r14>>>0){_memmove(r10,r2,r5,4,0);r5=r10+(r6<<2)|0;r15=HEAP32[r12>>2];if((r5|0)==(r15|0)){return}HEAP32[r12>>2]=r15+(~((r15-4+ -r5|0)>>>2)<<2);return}r5=r2+(r14<<2)|0;_memmove(r10,r2,r13,4,0);if((r5|0)==(r3|0)){return}r13=r5;r5=HEAP32[r12>>2];while(1){if((r5|0)==0){r16=0}else{HEAPF32[r5>>2]=HEAPF32[r13>>2];r16=HEAP32[r12>>2]}r14=r16+4|0;HEAP32[r12>>2]=r14;r15=r13+4|0;if((r15|0)==(r3|0)){break}else{r13=r15;r5=r14}}return}if((r10|0)==0){r17=r8}else{r8=r1+4|0;r5=HEAP32[r8>>2];if((r10|0)!=(r5|0)){HEAP32[r8>>2]=r5+(~((r5-4+ -r11|0)>>>2)<<2)}_free(r10);HEAP32[r7>>2]=0;HEAP32[r8>>2]=0;HEAP32[r9>>2]=0;r17=0}if(r6>>>0>1073741823){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r8=r17;do{if(r8>>2>>>0>536870910){r18=1073741823}else{r17=r8>>1;r10=r17>>>0<r6>>>0?r6:r17;if(r10>>>0<=1073741823){r18=r10;break}__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}}while(0);r6=r18<<2;r8=(r6|0)==0?1:r6;while(1){r19=_malloc(r8);if((r19|0)!=0){break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){r4=1426;break}FUNCTION_TABLE[r6]()}if(r4==1426){r4=___cxa_allocate_exception(4);HEAP32[r4>>2]=6488;___cxa_throw(r4,13184,74)}r4=r19;r19=r1+4|0;HEAP32[r19>>2]=r4;HEAP32[r9>>2]=r4;HEAP32[r7>>2]=r4+(r18<<2);if((r2|0)==(r3|0)){return}else{r20=r2;r21=r4}while(1){if((r21|0)==0){r22=0}else{HEAPF32[r21>>2]=HEAPF32[r20>>2];r22=HEAP32[r19>>2]}r4=r22+4|0;HEAP32[r19>>2]=r4;r2=r20+4|0;if((r2|0)==(r3|0)){break}else{r20=r2;r21=r4}}return}function __ZN8CARStateD2Ev(r1){var r2;r2=HEAP32[r1+56>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+48>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+40>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+32>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+24>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+16>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+8>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1>>2];if((r2|0)==0){return}_free(HEAP32[r2-4>>2]);return}function __ZN8IHCStateD2Ev(r1){var r2;r2=HEAP32[r1+40>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+32>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+24>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+16>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1+8>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}r2=HEAP32[r1>>2];if((r2|0)==0){return}_free(HEAP32[r2-4>>2]);return}function __ZN9AGCParamsD2Ev(r1){var r2,r3,r4,r5;r2=HEAP32[r1+48>>2];r3=r2;if((r2|0)!=0){r4=r1+52|0;r5=HEAP32[r4>>2];if((r2|0)!=(r5|0)){HEAP32[r4>>2]=r5+(~((r5-4+ -r3|0)>>>2)<<2)}_free(r2)}r2=HEAP32[r1+36>>2];r3=r2;if((r2|0)!=0){r5=r1+40|0;r4=HEAP32[r5>>2];if((r2|0)!=(r4|0)){HEAP32[r5>>2]=r4+(~((r4-4+ -r3|0)>>>2)<<2)}_free(r2)}r2=HEAP32[r1+24>>2];r3=r2;if((r2|0)!=0){r4=r1+28|0;r5=HEAP32[r4>>2];if((r2|0)!=(r5|0)){HEAP32[r4>>2]=r5+(~((r5-4+ -r3|0)>>>2)<<2)}_free(r2)}r2=HEAP32[r1+12>>2];if((r2|0)==0){return}r3=r1+16|0;r1=HEAP32[r3>>2];if((r2|0)!=(r1|0)){HEAP32[r3>>2]=r1+(~((r1-4+ -r2|0)>>>2)<<2)}_free(r2);return}function __ZN9AGCParamsC2Ev(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r1+12|0;r6=r5|0;r7=r1+24|0;r8=r1+28|0;r9=r1+36|0;r10=r9|0;r11=r1+40|0;r12=r1+48|0;r13=r12|0;r14=r1+52|0;r15=r1|0;_memset(r5,0,48);HEAP32[r15>>2]=4;HEAPF32[r1+4>>2]=2;__ZNSt3__16vectorIfNS_9allocatorIfEEE8__appendEj(r5,4);r5=HEAP32[r15>>2];r16=HEAP32[r11>>2];r17=HEAP32[r10>>2];r18=r16-r17>>2;do{if(r18>>>0<r5>>>0){__ZNSt3__16vectorIfNS_9allocatorIfEEE8__appendEj(r9,r5-r18|0);r19=HEAP32[r15>>2]}else{if(r18>>>0<=r5>>>0){r19=r5;break}r20=r17+(r5<<2)|0;if((r20|0)==(r16|0)){r19=r5;break}HEAP32[r11>>2]=r16+(~((r16-4+ -r20|0)>>>2)<<2);r19=r5}}while(0);r5=HEAP32[r14>>2];r16=HEAP32[r13>>2];r11=r5-r16>>2;do{if(r11>>>0<r19>>>0){__ZNSt3__16vectorIfNS_9allocatorIfEEE8__appendEj(r12,r19-r11|0)}else{if(r11>>>0<=r19>>>0){break}r17=r16+(r19<<2)|0;if((r17|0)==(r5|0)){break}HEAP32[r14>>2]=r5+(~((r5-4+ -r17|0)>>>2)<<2)}}while(0);HEAPF32[HEAP32[r10>>2]>>2]=1;HEAPF32[HEAP32[r13>>2]>>2]=1.649999976158142;HEAPF32[HEAP32[r6>>2]>>2]=.0020000000949949026;if((HEAP32[r15>>2]|0)>1){r5=1;while(1){r14=r5-1|0;r19=HEAP32[r10>>2];HEAPF32[r19+(r5<<2)>>2]=HEAPF32[r19+(r14<<2)>>2]*1.4142135623730951;r19=HEAP32[r13>>2];HEAPF32[r19+(r5<<2)>>2]=HEAPF32[r19+(r14<<2)>>2]*1.4142135623730951;r19=HEAP32[r6>>2];HEAPF32[r19+(r5<<2)>>2]=HEAPF32[r19+(r14<<2)>>2]*4;r14=r5+1|0;if((r14|0)<(HEAP32[r15>>2]|0)){r5=r14}else{break}}}r5=r4|0;HEAP32[r5>>2]=8;HEAP32[r4+4>>2]=2;HEAP32[r4+8>>2]=2;HEAP32[r4+12>>2]=2;r15=r4+16|0;r6=r1+32|0;r13=HEAP32[r6>>2];r10=HEAP32[r7>>2];r14=r10;if(r13-r14>>2>>>0>=4){r19=HEAP32[r8>>2]-r14|0;r16=r19>>2;r11=r10;r12=r4;if(r16>>>0>=4){_memmove(r11,r12,16,4,0);r17=r10+16|0;r18=HEAP32[r8>>2];if((r17|0)==(r18|0)){r21=r1+8|0;HEAPF32[r21>>2]=.5;STACKTOP=r3;return}HEAP32[r8>>2]=r18+(~((r18-4+ -r17|0)>>>2)<<2);r21=r1+8|0;HEAPF32[r21>>2]=.5;STACKTOP=r3;return}_memmove(r11,r12,r19,4,0);r19=r4+(r16<<2)|0;r16=HEAP32[r8>>2];while(1){if((r16|0)==0){r22=0}else{HEAP32[r16>>2]=HEAP32[r19>>2];r22=HEAP32[r8>>2]}r4=r22+4|0;HEAP32[r8>>2]=r4;r12=r19+4|0;if((r12|0)==(r15|0)){break}else{r19=r12;r16=r4}}r21=r1+8|0;HEAPF32[r21>>2]=.5;STACKTOP=r3;return}if((r10|0)==0){r23=r13}else{r13=HEAP32[r8>>2];if((r10|0)!=(r13|0)){HEAP32[r8>>2]=r13+(~((r13-4+ -r14|0)>>>2)<<2)}_free(r10);HEAP32[r6>>2]=0;HEAP32[r8>>2]=0;HEAP32[r7>>2]=0;r23=0}r10=r23;do{if(r10>>2>>>0>536870910){r24=1073741823}else{r23=r10>>1;r14=r23>>>0<4?4:r23;if(r14>>>0<=1073741823){r24=r14;break}__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}}while(0);r10=r24<<2;r14=(r10|0)==0?1:r10;while(1){r25=_malloc(r14);if((r25|0)!=0){break}r10=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r10|0)==0){r2=1550;break}FUNCTION_TABLE[r10]()}if(r2==1550){r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}r2=r25;HEAP32[r8>>2]=r2;HEAP32[r7>>2]=r2;HEAP32[r6>>2]=r2+(r24<<2);r24=r5;r5=r2;while(1){if((r5|0)==0){r26=0}else{HEAP32[r5>>2]=HEAP32[r24>>2];r26=HEAP32[r8>>2]}r2=r26+4|0;HEAP32[r8>>2]=r2;r6=r24+4|0;if((r6|0)==(r15|0)){break}else{r24=r6;r5=r2}}r21=r1+8|0;HEAPF32[r21>>2]=.5;STACKTOP=r3;return}function __ZNSt3__16vectorIfNS_9allocatorIfEEE8__appendEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;r4=r1+8|0;r5=r1+4|0;r6=HEAP32[r5>>2];r7=HEAP32[r4>>2];r8=r6;if(r7-r8>>2>>>0>=r2>>>0){r9=r2;r10=r6;while(1){if((r10|0)==0){r11=0}else{HEAPF32[r10>>2]=0;r11=HEAP32[r5>>2]}r6=r11+4|0;HEAP32[r5>>2]=r6;r12=r9-1|0;if((r12|0)==0){break}else{r9=r12;r10=r6}}return}r10=r1|0;r1=HEAP32[r10>>2];r9=r8-r1>>2;r8=r9+r2|0;if(r8>>>0>1073741823){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r11=r7-r1|0;if(r11>>2>>>0>536870910){r13=1073741823;r3=1569}else{r1=r11>>1;r11=r1>>>0<r8>>>0?r8:r1;if((r11|0)==0){r14=0;r15=0}else{r13=r11;r3=1569}}do{if(r3==1569){r11=r13<<2;r1=(r11|0)==0?1:r11;while(1){r16=_malloc(r1);if((r16|0)!=0){r3=1580;break}r11=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r3==1580){r14=r16;r15=r13;break}r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=6488;___cxa_throw(r1,13184,74)}}while(0);r13=r2;r2=r14+(r9<<2)|0;while(1){if((r2|0)==0){r17=0}else{HEAPF32[r2>>2]=0;r17=r2}r18=r17+4|0;r16=r13-1|0;if((r16|0)==0){break}else{r13=r16;r2=r18}}r2=r14+(r15<<2)|0;r15=HEAP32[r10>>2];r13=HEAP32[r5>>2]-r15|0;r17=r14+(r9-(r13>>2)<<2)|0;r9=r17;r14=r15;_memcpy(r9,r14,r13)|0;HEAP32[r10>>2]=r17;HEAP32[r5>>2]=r18;HEAP32[r4>>2]=r2;if((r15|0)==0){return}_free(r14);return}function __ZN3Ear8RedesignEiRK9CARCoeffsRK9IHCCoeffsRKNSt3__16vectorI9AGCCoeffsNS6_9allocatorIS8_EEEE(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r6=0;r7=r1+244|0;HEAP32[r7>>2]=r2;HEAPF32[r1>>2]=HEAPF32[r3>>2];HEAPF32[r1+4>>2]=HEAPF32[r3+4>>2];r8=r1+8|0;r9=r3+12|0;r10=HEAP32[r9>>2];if((r10|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8|0,r10);r10=HEAP32[r1+12>>2];if((r10|0)!=(HEAP32[r9>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r10|0)>0){r11=r3+8|0;r12=r8|0;r8=0;while(1){HEAPF32[HEAP32[r12>>2]+(r8<<2)>>2]=HEAPF32[HEAP32[r11>>2]+(r8<<2)>>2];r13=r8+1|0;if((r13|0)<(r10|0)){r8=r13}else{break}}}r8=r1+16|0;r10=r3+20|0;r11=HEAP32[r10>>2];if((r11|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8|0,r11);r11=HEAP32[r1+20>>2];if((r11|0)!=(HEAP32[r10>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r11|0)>0){r12=r3+16|0;r13=r8|0;r8=0;while(1){HEAPF32[HEAP32[r13>>2]+(r8<<2)>>2]=HEAPF32[HEAP32[r12>>2]+(r8<<2)>>2];r14=r8+1|0;if((r14|0)<(r11|0)){r8=r14}else{break}}}r8=r1+24|0;r11=r3+28|0;r12=HEAP32[r11>>2];if((r12|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8|0,r12);r12=HEAP32[r1+28>>2];if((r12|0)!=(HEAP32[r11>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r12|0)>0){r13=r3+24|0;r14=r8|0;r8=0;while(1){HEAPF32[HEAP32[r14>>2]+(r8<<2)>>2]=HEAPF32[HEAP32[r13>>2]+(r8<<2)>>2];r15=r8+1|0;if((r15|0)<(r12|0)){r8=r15}else{break}}}r8=r1+32|0;r12=r3+36|0;r13=HEAP32[r12>>2];if((r13|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8|0,r13);r13=HEAP32[r1+36>>2];if((r13|0)!=(HEAP32[r12>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r13|0)>0){r14=r3+32|0;r15=r8|0;r8=0;while(1){HEAPF32[HEAP32[r15>>2]+(r8<<2)>>2]=HEAPF32[HEAP32[r14>>2]+(r8<<2)>>2];r16=r8+1|0;if((r16|0)<(r13|0)){r8=r16}else{break}}}r8=r1+40|0;r13=r3+44|0;r14=HEAP32[r13>>2];if((r14|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8|0,r14);r14=HEAP32[r1+44>>2];if((r14|0)!=(HEAP32[r13>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r14|0)>0){r15=r3+40|0;r16=r8|0;r8=0;while(1){HEAPF32[HEAP32[r16>>2]+(r8<<2)>>2]=HEAPF32[HEAP32[r15>>2]+(r8<<2)>>2];r17=r8+1|0;if((r17|0)<(r14|0)){r8=r17}else{break}}}r8=r1+48|0;r14=r3+52|0;r15=HEAP32[r14>>2];if((r15|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r8|0,r15);r15=HEAP32[r1+52>>2];if((r15|0)!=(HEAP32[r14>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r15|0)>0){r16=r3+48|0;r3=r8|0;r8=0;while(1){HEAPF32[HEAP32[r3>>2]+(r8<<2)>>2]=HEAPF32[HEAP32[r16>>2]+(r8<<2)>>2];r17=r8+1|0;if((r17|0)<(r15|0)){r8=r17}else{break}}}if((HEAP32[r9>>2]|0)!=(r2|0)){___assert_fail(544,5544,42,3480)}if((HEAP32[r10>>2]|0)!=(r2|0)){___assert_fail(544,5544,42,3480)}if((HEAP32[r11>>2]|0)!=(r2|0)){___assert_fail(544,5544,42,3480)}if((HEAP32[r12>>2]|0)!=(r2|0)){___assert_fail(544,5544,42,3480)}if((HEAP32[r13>>2]|0)!=(r2|0)){___assert_fail(544,5544,42,3480)}if((HEAP32[r14>>2]|0)!=(r2|0)){___assert_fail(544,5544,42,3480)}r2=r1+120|0;r14=r4|0;_memcpy(r2,r14,52)|0;r14=r1+220|0;L1852:do{if((r14|0)!=(r5|0)){r2=HEAP32[r5>>2];r4=HEAP32[r5+4>>2];r13=r4-r2|0;r12=(r13|0)/56&-1;r11=r1+228|0;r10=HEAP32[r11>>2];r9=r14|0;r8=HEAP32[r9>>2];r15=r8;if(r12>>>0<=((r10-r15|0)/56&-1)>>>0){r16=r1+224|0;r3=HEAP32[r16>>2]-r15|0;r17=(r3|0)/56&-1;if(r12>>>0<=r17>>>0){_memmove(r8,r2,r13,4,0);r13=r8+(r12*56&-1)|0;r18=HEAP32[r16>>2];if((r13|0)==(r18|0)){break}HEAP32[r16>>2]=r18+(~(((r18-56+ -r13|0)>>>0)/56&-1)*56&-1);break}r13=r2+(r17*56&-1)|0;_memmove(r8,r2,r3,4,0);if((r13|0)==(r4|0)){break}r3=r13;r13=HEAP32[r16>>2];while(1){if((r13|0)==0){r19=0}else{r17=r13;r18=r3;_memcpy(r17,r18,56)|0;r19=HEAP32[r16>>2]}r18=r19+56|0;HEAP32[r16>>2]=r18;r17=r3+56|0;if((r17|0)==(r4|0)){break L1852}else{r3=r17;r13=r18}}}if((r8|0)==0){r20=r10}else{r13=r1+224|0;r3=HEAP32[r13>>2];if((r8|0)!=(r3|0)){HEAP32[r13>>2]=r3+(~(((r3-56+ -r15|0)>>>0)/56&-1)*56&-1)}_free(r8);HEAP32[r11>>2]=0;HEAP32[r13>>2]=0;HEAP32[r9>>2]=0;r20=0}if(r12>>>0>76695844){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r13=(r20|0)/56&-1;do{if(r13>>>0>38347921){r21=76695844}else{r3=r13<<1;r16=r3>>>0<r12>>>0?r12:r3;if(r16>>>0<=76695844){r21=r16;break}__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}}while(0);r12=r21*56&-1;r13=(r12|0)==0?1:r12;while(1){r22=_malloc(r13);if((r22|0)!=0){break}r12=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r12|0)==0){r6=1667;break}FUNCTION_TABLE[r12]()}if(r6==1667){r13=___cxa_allocate_exception(4);HEAP32[r13>>2]=6488;___cxa_throw(r13,13184,74)}r13=r22;r12=r1+224|0;HEAP32[r12>>2]=r13;HEAP32[r9>>2]=r13;HEAP32[r11>>2]=r13+(r21*56&-1);if((r2|0)==(r4|0)){break}else{r23=r2;r24=r13}while(1){if((r24|0)==0){r25=0}else{r13=r24;r8=r23;_memcpy(r13,r8,56)|0;r25=HEAP32[r12>>2]}r8=r25+56|0;HEAP32[r12>>2]=r8;r13=r23+56|0;if((r13|0)==(r4|0)){break}else{r23=r13;r24=r8}}}}while(0);__ZN3Ear12InitCARStateEv(r1);__ZN3Ear12InitIHCStateEv(r1);__ZN3Ear12InitAGCStateEv(r1);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+248|0,HEAP32[r7>>2]);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+256|0,HEAP32[r7>>2]);return}function __ZN3Ear12InitCARStateEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+244|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+56|0,HEAP32[r2>>2]);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+64|0,HEAP32[r2>>2]);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+72|0,HEAP32[r2>>2]);r3=r1+80|0;r4=r1+52|0;r5=HEAP32[r4>>2];if((r5|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r3|0,r5);r5=HEAP32[r1+84>>2];if((r5|0)!=(HEAP32[r4>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r5|0)>0){r4=r1+48|0;r6=r3|0;r3=0;while(1){HEAPF32[HEAP32[r6>>2]+(r3<<2)>>2]=HEAPF32[HEAP32[r4>>2]+(r3<<2)>>2];r7=r3+1|0;if((r7|0)<(r5|0)){r3=r7}else{break}}}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+88|0,HEAP32[r2>>2]);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+96|0,HEAP32[r2>>2]);r3=r1+104|0;r5=r1+44|0;r4=HEAP32[r5>>2];if((r4|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r3|0,r4);r4=HEAP32[r1+108>>2];if((r4|0)!=(HEAP32[r5>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r4|0)<=0){r8=r1+112|0;r9=HEAP32[r2>>2];__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r8,r9);return}r5=r1+40|0;r6=r3|0;r3=0;while(1){HEAPF32[HEAP32[r6>>2]+(r3<<2)>>2]=HEAPF32[HEAP32[r5>>2]+(r3<<2)>>2];r7=r3+1|0;if((r7|0)<(r4|0)){r3=r7}else{break}}r8=r1+112|0;r9=HEAP32[r2>>2];__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r8,r9);return}function __ZN3Ear12InitIHCStateEv(r1){var r2,r3;r2=r1+244|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+212|0,HEAP32[r2>>2]);if((HEAP8[r1+120|0]&1)!=0){return}r3=r1+148|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE11setConstantEiRKf(r1+196|0,HEAP32[r2>>2],r3);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE11setConstantEiRKf(r1+204|0,HEAP32[r2>>2],r3);r3=(HEAP8[r1+121|0]&1)==0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE11setConstantEiRKf(r1+180|0,HEAP32[r2>>2],r1+152|0);if(!r3){return}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE11setConstantEiRKf(r1+188|0,HEAP32[r2>>2],r1+156|0);return}function __ZN3Ear12InitAGCStateEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=(HEAP32[r1+224>>2]-HEAP32[r1+220>>2]|0)/56&-1;r4=r1+236|0;r5=HEAP32[r4>>2];r6=r1+232|0;r7=HEAP32[r6>>2];r8=r5;r9=r7;r10=(r8-r9|0)/20&-1;do{if(r10>>>0<r3>>>0){r11=r3-r10|0;r12=r1+240|0;r13=HEAP32[r12>>2];do{if(((r13-r8|0)/20&-1)>>>0<r11>>>0){if(r3>>>0>214748364){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r14=(r13-r9|0)/20&-1;if(r14>>>0>107374181){r15=214748364;r2=1714}else{r16=r14<<1;r14=r16>>>0<r3>>>0?r3:r16;if((r14|0)==0){r17=0;r18=0}else{r15=r14;r2=1714}}do{if(r2==1714){r14=r15*20&-1;r16=(r14|0)==0?1:r14;while(1){r19=_malloc(r16);if((r19|0)!=0){r2=1725;break}r14=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}if(r2==1725){r17=r19;r18=r15;break}r16=___cxa_allocate_exception(4);HEAP32[r16>>2]=6488;___cxa_throw(r16,13184,74)}}while(0);r16=r17+(r10*20&-1)|0;r14=r11;r20=r16;while(1){if((r20|0)==0){r21=0}else{r22=r20;HEAP32[r22>>2]=0;HEAP32[r22+4>>2]=0;HEAP32[r22+8>>2]=0;HEAP32[r22+12>>2]=0;HEAP32[r22+16>>2]=0;HEAP32[r22>>2]=0;HEAP32[r22+4>>2]=0;HEAP32[r22+8>>2]=0;HEAP32[r22+12>>2]=0;r21=r20}r23=r21+20|0;r22=r14-1|0;if((r22|0)==0){break}else{r14=r22;r20=r23}}r20=r17+(r18*20&-1)|0;r14=HEAP32[r6>>2];r22=HEAP32[r4>>2];do{if((r22|0)==(r14|0)){HEAP32[r6>>2]=r16;HEAP32[r4>>2]=r23;HEAP32[r12>>2]=r20;r24=r14}else{r25=r22;r26=r16;while(1){r27=r26-20|0;r28=r25-20|0;if((r27|0)!=0){__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2ERKS1_(r27|0,r28|0);__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2ERKS1_(r26-20+8|0,r25-20+8|0);HEAP32[r26-20+16>>2]=HEAP32[r25-20+16>>2]}if((r28|0)==(r14|0)){break}else{r25=r28;r26=r27}}r26=HEAP32[r6>>2];r25=HEAP32[r4>>2];HEAP32[r6>>2]=r27;HEAP32[r4>>2]=r23;HEAP32[r12>>2]=r20;if((r26|0)==(r25|0)){r24=r26;break}else{r29=r25}while(1){r25=r29-20|0;r28=HEAP32[r29-20+8>>2];if((r28|0)!=0){_free(HEAP32[r28-4>>2])}r28=HEAP32[r25>>2];if((r28|0)!=0){_free(HEAP32[r28-4>>2])}if((r26|0)==(r25|0)){r24=r26;break}else{r29=r25}}}}while(0);if((r24|0)==0){break}_free(r24)}else{r20=r11;r14=r5;while(1){if((r14|0)==0){r30=0}else{r16=r14;HEAP32[r16>>2]=0;HEAP32[r16+4>>2]=0;HEAP32[r16+8>>2]=0;HEAP32[r16+12>>2]=0;HEAP32[r16+16>>2]=0;HEAP32[r16>>2]=0;HEAP32[r16+4>>2]=0;HEAP32[r16+8>>2]=0;HEAP32[r16+12>>2]=0;r30=HEAP32[r4>>2]}r16=r30+20|0;HEAP32[r4>>2]=r16;r22=r20-1|0;if((r22|0)==0){break}else{r20=r22;r14=r16}}}}while(0);r31=HEAP32[r4>>2]}else{if(r10>>>0<=r3>>>0){r31=r5;break}r11=r7+(r3*20&-1)|0;if((r11|0)==(r5|0)){r31=r5;break}else{r32=r5}while(1){r12=r32-20|0;HEAP32[r4>>2]=r12;r13=HEAP32[r32-20+8>>2];if((r13|0)!=0){_free(HEAP32[r13-4>>2])}r13=HEAP32[r12>>2];if((r13|0)!=0){_free(HEAP32[r13-4>>2])}r13=HEAP32[r4>>2];if((r11|0)==(r13|0)){r31=r11;break}else{r32=r13}}}}while(0);r32=HEAP32[r6>>2];if((r32|0)==(r31|0)){return}r6=r1+244|0;r1=r32;while(1){HEAP32[r1+16>>2]=0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1|0,HEAP32[r6>>2]);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1+8|0,HEAP32[r6>>2]);r32=r1+20|0;if((r32|0)==(r31|0)){break}else{r1=r32}}return}function __ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=r1+4|0;do{if((HEAP32[r4>>2]|0)==(r2|0)){r3=1783}else{r5=r1|0;r6=HEAP32[r5>>2];if((r6|0)!=0){_free(HEAP32[r6-4>>2])}if((r2|0)==0){HEAP32[r5>>2]=0;HEAP32[r4>>2]=0;break}if(r2>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r6=r2<<2;r7=_malloc(r6+16|0);if((r7|0)==0){r8=0}else{r9=r7+16&-16;HEAP32[r9-4>>2]=r7;r8=r9}if((r8|0)!=0|(r6|0)==0){HEAP32[r5>>2]=r8;r3=1783;break}else{__ZN5Eigen8internal19throw_std_bad_allocEv()}}}while(0);do{if(r3==1783){HEAP32[r4>>2]=r2;if((r2|0)>-1){break}___assert_fail(1768,5120,76,6016)}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1,r2);if((HEAP32[r4>>2]|0)!=(r2|0)){___assert_fail(2264,2200,510,5960)}if((r2|0)<=0){return}r4=r1|0;r1=0;while(1){HEAPF32[HEAP32[r4>>2]+(r1<<2)>>2]=0;r3=r1+1|0;if((r3|0)<(r2|0)){r1=r3}else{break}}return}function __ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE11setConstantEiRKf(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=r1+4|0;do{if((HEAP32[r5>>2]|0)==(r2|0)){r4=1805}else{r6=r1|0;r7=HEAP32[r6>>2];if((r7|0)!=0){_free(HEAP32[r7-4>>2])}if((r2|0)==0){HEAP32[r6>>2]=0;HEAP32[r5>>2]=0;break}if(r2>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r7=r2<<2;r8=_malloc(r7+16|0);if((r8|0)==0){r9=0}else{r10=r8+16&-16;HEAP32[r10-4>>2]=r8;r9=r10}if((r9|0)!=0|(r7|0)==0){HEAP32[r6>>2]=r9;r4=1805;break}else{__ZN5Eigen8internal19throw_std_bad_allocEv()}}}while(0);do{if(r4==1805){HEAP32[r5>>2]=r2;if((r2|0)>-1){break}___assert_fail(1768,5120,76,6016)}}while(0);r4=HEAPF32[r3>>2];__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1,r2);if((HEAP32[r5>>2]|0)!=(r2|0)){___assert_fail(2264,2200,510,5960)}if((r2|0)<=0){return}r5=r1|0;r1=0;while(1){HEAPF32[HEAP32[r5>>2]+(r1<<2)>>2]=r4;r3=r1+1|0;if((r3|0)<(r2|0)){r1=r3}else{break}}return}function __ZN3Ear10AGCRecurseEiN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r1+220|0;r8=HEAP32[r7>>2];r9=r1+232|0;r10=HEAP32[r9>>2];r11=HEAP32[r8+(r2*56&-1)+8>>2];r12=r10+(r2*20&-1)+16|0;r13=(HEAP32[r12>>2]+1|0)%(r11|0)&-1;HEAP32[r12>>2]=r13;r12=r10+(r2*20&-1)+8|0;r14=r10+(r2*20&-1)+12|0;r15=HEAP32[r14>>2];r16=r3+4|0;if((r15|0)!=(HEAP32[r16>>2]|0)){___assert_fail(1160,920,149,5960)}do{if((r15|0)>0){r17=r3|0;r18=r12|0;r19=HEAP32[r18>>2];HEAPF32[r19>>2]=HEAPF32[r19>>2]+HEAPF32[HEAP32[r17>>2]>>2];if((r15|0)>1){r20=1}else{break}while(1){r19=HEAP32[r18>>2]+(r20<<2)|0;HEAPF32[r19>>2]=HEAPF32[r19>>2]+HEAPF32[HEAP32[r17>>2]+(r20<<2)>>2];r19=r20+1|0;if((r19|0)<(r15|0)){r20=r19}else{break}}}}while(0);if((r13|0)!=0){r21=0;STACKTOP=r5;return r21}r13=1/(r11|0);r11=HEAP32[r14>>2];if((r11|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r3|0,r11);r11=HEAP32[r16>>2];if((r11|0)!=(HEAP32[r14>>2]|0)){___assert_fail(2264,2200,510,5960)}do{if((r11|0)>0){r20=r3|0;r15=r12|0;HEAPF32[HEAP32[r20>>2]>>2]=r13*HEAPF32[HEAP32[r15>>2]>>2];if((r11|0)>1){r22=1}else{break}while(1){HEAPF32[HEAP32[r20>>2]+(r22<<2)>>2]=r13*HEAPF32[HEAP32[r15>>2]+(r22<<2)>>2];r17=r22+1|0;if((r17|0)<(r11|0)){r22=r17}else{break}}}}while(0);r22=r1+244|0;r11=HEAP32[r22>>2];if((r11|0)<=-1){___assert_fail(1768,5120,76,6016)}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r12|0,r11);if((HEAP32[r14>>2]|0)!=(r11|0)){___assert_fail(2264,2200,510,5960)}if((r11|0)>0){r14=r12|0;r12=0;while(1){HEAPF32[HEAP32[r14>>2]+(r12<<2)>>2]=0;r13=r12+1|0;if((r13|0)<(r11|0)){r12=r13}else{break}}}do{if((((HEAP32[r1+224>>2]-HEAP32[r7>>2]|0)/56&-1)-1|0)>>>0>r2>>>0){r12=r2+1|0;__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2ERKS1_(r6,r3);__ZN3Ear10AGCRecurseEiN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEE(r1,r12,r6);r11=HEAP32[r6>>2];if((r11|0)!=0){_free(HEAP32[r11-4>>2])}r11=HEAP32[r9>>2];r14=HEAPF32[r8+(r2*56&-1)>>2];r13=HEAP32[r16>>2];if((r13|0)!=(HEAP32[r11+(r12*20&-1)+4>>2]|0)){___assert_fail(1160,920,149,5960)}if((r13|0)<=0){break}r15=r3|0;r20=HEAP32[r15>>2];r17=r11+(r12*20&-1)|0;HEAPF32[r20>>2]=HEAPF32[r20>>2]+r14*HEAPF32[HEAP32[r17>>2]>>2];if((r13|0)>1){r23=1}else{break}while(1){r20=HEAP32[r15>>2]+(r23<<2)|0;HEAPF32[r20>>2]=HEAPF32[r20>>2]+r14*HEAPF32[HEAP32[r17>>2]+(r23<<2)>>2];r20=r23+1|0;if((r20|0)<(r13|0)){r23=r20}else{break}}}}while(0);r23=r10+(r2*20&-1)|0;r9=HEAP32[r16>>2];r16=r10+(r2*20&-1)+4|0;if((r9|0)!=(HEAP32[r16>>2]|0)){___assert_fail(4424,4272,144,6032)}r10=HEAPF32[r8+(r2*56&-1)+4>>2];do{if((r9|0)>0){r8=r23|0;r6=HEAP32[r8>>2];r1=r3|0;r13=HEAPF32[r6>>2];HEAPF32[r6>>2]=r13+r10*(HEAPF32[HEAP32[r1>>2]>>2]-r13);if((r9|0)>1){r24=1}else{break}while(1){r13=HEAP32[r8>>2]+(r24<<2)|0;r6=HEAPF32[r13>>2];HEAPF32[r13>>2]=r6+r10*(HEAPF32[HEAP32[r1>>2]+(r24<<2)>>2]-r6);r6=r24+1|0;if((r6|0)<(r9|0)){r24=r6}else{break}}}}while(0);r24=HEAP32[r7>>2];if((HEAP32[r24+(r2*56&-1)+20>>2]|0)>=4){r7=HEAPF32[r24+(r2*56&-1)+16>>2];r9=HEAP32[r16>>2];r10=r23|0;r3=1-HEAPF32[r24+(r2*56&-1)+12>>2];r1=0;r8=r9-11|0;while(1){if(!((r8|0)>-1&(r9|0)>(r8|0))){r4=2051;break}r25=HEAP32[r10>>2];r26=r1+r3*(HEAPF32[r25+(r8<<2)>>2]-r1);r6=r8+1|0;if((r6|0)<(r9|0)){r1=r26;r8=r6}else{break}}if(r4==2051){___assert_fail(4232,2464,407,5864)}if((r9|0)<=0){r21=1;STACKTOP=r5;return r21}r8=1-r7;r7=r26;r26=r9;while(1){r1=r26-1|0;if((r9|0)<=(r1|0)){r4=2054;break}r6=r7+r8*(HEAPF32[r25+(r1<<2)>>2]-r7);if((r1|0)>0){r7=r6;r26=r1}else{r27=r6;r28=0;r29=r9;break}}if(r4==2054){___assert_fail(4232,2464,407,5864)}while(1){if((r29|0)<=(r28|0)){r4=2057;break}r26=HEAP32[r10>>2]+(r28<<2)|0;r7=r27+r3*(HEAPF32[r26>>2]-r27);HEAPF32[r26>>2]=r7;r26=r28+1|0;if((r26|0)>=(r9|0)){r21=1;r4=2062;break}r27=r7;r28=r26;r29=HEAP32[r16>>2]}if(r4==2062){STACKTOP=r5;return r21}else if(r4==2057){___assert_fail(4232,2464,407,5864)}}r29=HEAPF32[r24+(r2*56&-1)+24>>2];r28=HEAPF32[r24+(r2*56&-1)+28>>2];r27=HEAPF32[r24+(r2*56&-1)+32>>2];r9=HEAP32[r22>>2];if(r9>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r3=r9<<2;r10=_malloc(r3+16|0);if((r10|0)==0){r30=0}else{r26=r10+16&-16;HEAP32[r26-4>>2]=r10;r30=r26}if(!((r30|0)!=0|(r3|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}r3=r30;if((r9|0)<=-1){___assert_fail(5240,5e3,151,6e3)}r26=HEAP32[r22>>2];if(r26>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r10=r26<<2;r7=_malloc(r10+16|0);if((r7|0)==0){r31=0}else{r25=r7+16&-16;HEAP32[r25-4>>2]=r7;r31=r25}if(!((r31|0)!=0|(r10|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}r10=r31;if((r26|0)<=-1){___assert_fail(5240,5e3,151,6e3)}r25=HEAP32[r22>>2];if(r25>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r7=r25<<2;r8=_malloc(r7+16|0);if((r8|0)==0){r32=0}else{r6=r8+16&-16;HEAP32[r6-4>>2]=r8;r32=r6}if(!((r32|0)!=0|(r7|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}r7=r32;if((r25|0)<=-1){___assert_fail(5240,5e3,151,6e3)}r6=HEAP32[r22>>2];if(r6>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r8=r6<<2;r1=_malloc(r8+16|0);if((r1|0)==0){r33=0}else{r13=r1+16&-16;HEAP32[r13-4>>2]=r1;r33=r13}if(!((r33|0)!=0|(r8|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}r8=r33;if((r6|0)<=-1){___assert_fail(5240,5e3,151,6e3)}r13=HEAP32[r24+(r2*56&-1)+36>>2];if((HEAP32[r16>>2]|0)<=0){___assert_fail(4232,2464,407,5864)}r2=r23|0;if((r9|0)<=0){___assert_fail(4232,2464,407,5864)}HEAPF32[r3>>2]=HEAPF32[HEAP32[r2>>2]>>2];r24=HEAP32[r22>>2];r1=r24-1|0;r17=r30+4|0;r14=r17;r15=(r24|0)>0;if(!((r17|0)==0|r15)){___assert_fail(2016,1952,162,5984)}if(!(r15&(r24|0)<=(r9|0))){___assert_fail(3960,4544,303,5992)}r15=HEAP32[r2>>2];if((r1|0)>(HEAP32[r16>>2]|0)){___assert_fail(3960,4544,303,5992)}if((r1|0)>0){r17=0;while(1){HEAPF32[r14+(r17<<2)>>2]=HEAPF32[r15+(r17<<2)>>2];r20=r17+1|0;if((r20|0)<(r1|0)){r17=r20}else{break}}r34=HEAP32[r22>>2]}else{r34=r24}r24=r34-1|0;do{if((r34|0)>0){if((HEAP32[r16>>2]|0)<=(r24|0)){break}if((r26|0)<=(r24|0)){___assert_fail(4232,2464,407,5864)}HEAPF32[r10+(r24<<2)>>2]=HEAPF32[HEAP32[r2>>2]+(r24<<2)>>2];r17=HEAP32[r22>>2];r1=r17-1|0;r15=(r31|0)==0;r14=(r17|0)>0;if(!(r15|r14)){___assert_fail(2016,1952,162,5984)}if(!(r14&(r1|0)<=(r26|0))){___assert_fail(3960,4544,303,5992)}r14=HEAP32[r2>>2];if((r17|0)>(HEAP32[r16>>2]|0)){___assert_fail(3960,4544,303,5992)}if((r1|0)>0){r17=0;while(1){r20=r17+1|0;HEAPF32[r10+(r17<<2)>>2]=HEAPF32[r14+(r20<<2)>>2];if((r20|0)<(r1|0)){r17=r20}else{break}}}L2243:do{if((r13|0)==3){if((r9|0)!=(HEAP32[r16>>2]|0)){___assert_fail(4424,4272,144,6032)}if((r9|0)!=(r26|0)){___assert_fail(4424,4272,144,6032)}if((r9|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r23|0,r9);if((HEAP32[r16>>2]|0)==(r9|0)){r17=0;while(1){r1=HEAP32[r2>>2]+(r17<<2)|0;HEAPF32[r1>>2]=r29*HEAPF32[r3+(r17<<2)>>2]+r28*HEAPF32[r1>>2]+r27*HEAPF32[r10+(r17<<2)>>2];r1=r17+1|0;if((r1|0)<(r9|0)){r17=r1}else{r4=2032;break L2243}}}___assert_fail(2264,2200,510,5960)}else if((r13|0)==5){if((HEAP32[r16>>2]|0)<=0){___assert_fail(4232,2464,407,5864)}if((r25|0)<=0){___assert_fail(4232,2464,407,5864)}HEAPF32[r7>>2]=HEAPF32[HEAP32[r2>>2]>>2];if((HEAP32[r16>>2]|0)<=1){___assert_fail(4232,2464,407,5864)}if((r25|0)<=1){___assert_fail(4232,2464,407,5864)}HEAPF32[r32+4>>2]=HEAPF32[HEAP32[r2>>2]+4>>2];r17=HEAP32[r22>>2];r1=r17-2|0;r14=r32+8|0;r20=r14;r12=(r1|0)>-1;if(!((r14|0)==0|r12)){___assert_fail(2016,1952,162,5984)}if(!(r12&(r17|0)<=(r25|0))){___assert_fail(3960,4544,303,5992)}r12=HEAP32[r2>>2];if((r1|0)>(HEAP32[r16>>2]|0)){___assert_fail(3960,4544,303,5992)}if((r1|0)>0){r14=0;while(1){HEAPF32[r20+(r14<<2)>>2]=HEAPF32[r12+(r14<<2)>>2];r11=r14+1|0;if((r11|0)<(r1|0)){r14=r11}else{break}}r35=HEAP32[r22>>2]}else{r35=r17}r14=r35-1|0;do{if((r35|0)>0){if((HEAP32[r16>>2]|0)<=(r14|0)){break}r1=r35-2|0;if(!((r1|0)>-1&(r6|0)>(r1|0))){___assert_fail(4232,2464,407,5864)}HEAPF32[r8+(r1<<2)>>2]=HEAPF32[HEAP32[r2>>2]+(r14<<2)>>2];r1=HEAP32[r22>>2];r12=r1-2|0;do{if((r12|0)>-1){if((HEAP32[r16>>2]|0)<=(r12|0)){break}r20=r1-1|0;if(!((r1|0)>0&(r6|0)>(r20|0))){___assert_fail(4232,2464,407,5864)}HEAPF32[r8+(r20<<2)>>2]=HEAPF32[HEAP32[r2>>2]+(r12<<2)>>2];r20=HEAP32[r22>>2];r11=r20-2|0;r18=(r11|0)>-1;if(!((r33|0)==0|r18)){___assert_fail(2016,1952,162,5984)}if(!(r18&(r11|0)<=(r6|0))){___assert_fail(3960,4544,303,5992)}r18=HEAP32[r2>>2];if((r20|0)>(HEAP32[r16>>2]|0)){___assert_fail(3960,4544,303,5992)}if((r11|0)>0){r20=0;while(1){HEAPF32[r8+(r20<<2)>>2]=HEAPF32[r18+(r20+2<<2)>>2];r19=r20+1|0;if((r19|0)<(r11|0)){r20=r19}else{break}}}if((r25|0)!=(r9|0)){___assert_fail(4424,4272,144,6032)}if((r9|0)!=(HEAP32[r16>>2]|0)){___assert_fail(4424,4272,144,6032)}if((r26|0)!=(r6|0)){___assert_fail(4424,4272,144,6032)}if((r9|0)!=(r26|0)){___assert_fail(4424,4272,144,6032)}if((r9|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r23|0,r9);if((HEAP32[r16>>2]|0)==(r9|0)){r20=0;while(1){r11=HEAP32[r2>>2]+(r20<<2)|0;HEAPF32[r11>>2]=r29*(HEAPF32[r7+(r20<<2)>>2]+HEAPF32[r3+(r20<<2)>>2])+r28*HEAPF32[r11>>2]+r27*(HEAPF32[r10+(r20<<2)>>2]+HEAPF32[r8+(r20<<2)>>2]);r11=r20+1|0;if((r11|0)<(r9|0)){r20=r11}else{r4=2033;break L2243}}}___assert_fail(2264,2200,510,5960)}}while(0);___assert_fail(4232,2464,407,5864)}}while(0);___assert_fail(4232,2464,407,5864)}else{r4=2032}}while(0);if(r4==2032){if((r33|0)!=0){r4=2033}}if(r4==2033){_free(HEAP32[r33-4>>2])}if((r32|0)!=0){_free(HEAP32[r32-4>>2])}if(!r15){_free(HEAP32[r31-4>>2])}if((r30|0)==0){r21=1;STACKTOP=r5;return r21}_free(HEAP32[r30-4>>2]);r21=1;STACKTOP=r5;return r21}}while(0);___assert_fail(4232,2464,407,5864)}function __ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2ERKS1_(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r2+4|0;r4=HEAP32[r3>>2];r5=r1|0;if(r4>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r6=r4<<2;r7=_malloc(r6+16|0);if((r7|0)==0){r8=0}else{r9=r7+16&-16;HEAP32[r9-4>>2]=r7;r8=r9}if(!((r8|0)!=0|(r6|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r5>>2]=r8;r8=r1+4|0;HEAP32[r8>>2]=r4;r4=HEAP32[r3>>2];if((r4|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1|0,r4);r4=HEAP32[r8>>2];if((r4|0)!=(HEAP32[r3>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r4|0)<=0){return}r3=r2|0;r2=0;while(1){HEAPF32[HEAP32[r5>>2]+(r2<<2)>>2]=HEAPF32[HEAP32[r3>>2]+(r2<<2)>>2];r8=r2+1|0;if((r8|0)<(r4|0)){r2=r8}else{break}}return}function __ZN3SAIC2ERK9SAIParams(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=r1|0;HEAP32[r3>>2]=9184;HEAP32[r1+32>>2]=0;HEAP32[r1+36>>2]=0;__ZN12sai_internal7SAIBase8RedesignERK9SAIParams(r1|0,r2);HEAP32[r3>>2]=9304;r3=r1+40|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;r3=r1+40|0;r2=r1+4|0;r4=HEAP32[r2>>2];r5=r1+8|0;r6=(HEAP32[r1+20>>2]*((HEAP32[r1+16>>2]-1)*.5+1)&-1)+HEAP32[r5>>2]|0;r7=r6|r4;do{if((r7|0)>=0){r8=(r4|0)==0|(r6|0)==0;if(!r8){if((2147483647/(r6|0)&-1|0)<(r4|0)){break}}r9=Math_imul(r6,r4)|0;r10=r1+44|0;r11=r1+48|0;do{if((r9|0)!=0){if(r9>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r12=r9<<2;r13=_malloc(r12+16|0);if((r13|0)==0){r14=0}else{r15=r13+16&-16;HEAP32[r15-4>>2]=r13;r14=r15}if((r14|0)!=0|(r12|0)==0){HEAP32[r3>>2]=r14;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);HEAP32[r10>>2]=r4;HEAP32[r11>>2]=r6;if((r7|0)<=-1){___assert_fail(1768,5120,76,6016)}do{if(!r8){if((r4|0)<=(2147483647/(r6|0)&-1|0)){break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r3,r4,r6);do{if((HEAP32[r10>>2]|0)==(r4|0)){if((HEAP32[r11>>2]|0)!=(r6|0)){break}if((r9|0)>0){r8=r3|0;r12=0;while(1){HEAPF32[HEAP32[r8>>2]+(r12<<2)>>2]=0;r15=r12+1|0;if((r15|0)<(r9|0)){r12=r15}else{break}}}r12=r1+52|0;r8=HEAP32[r2>>2];r15=HEAP32[r5>>2];r13=r15|r8;do{if((r13|0)>=0){r16=(r8|0)==0|(r15|0)==0;if(!r16){if((2147483647/(r15|0)&-1|0)<(r8|0)){break}}r17=Math_imul(r15,r8)|0;r18=r1+56|0;r19=r1+60|0;do{if((Math_imul(HEAP32[r19>>2],HEAP32[r18>>2])|0)!=(r17|0)){r20=r12|0;r21=HEAP32[r20>>2];if((r21|0)!=0){_free(HEAP32[r21-4>>2])}if((r17|0)==0){HEAP32[r20>>2]=0;break}if(r17>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r21=r17<<2;r22=_malloc(r21+16|0);if((r22|0)==0){r23=0}else{r24=r22+16&-16;HEAP32[r24-4>>2]=r22;r23=r24}if((r23|0)!=0|(r21|0)==0){HEAP32[r20>>2]=r23;break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);HEAP32[r18>>2]=r8;HEAP32[r19>>2]=r15;if((r13|0)<=-1){___assert_fail(1768,5120,76,6016)}do{if(!r16){if((r8|0)<=(2147483647/(r15|0)&-1|0)){break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r12,r8,r15);do{if((HEAP32[r18>>2]|0)==(r8|0)){if((HEAP32[r19>>2]|0)!=(r15|0)){break}if((r17|0)<=0){return}r16=r12|0;r20=0;while(1){HEAPF32[HEAP32[r16>>2]+(r20<<2)>>2]=0;r21=r20+1|0;if((r21|0)<(r17|0)){r20=r21}else{break}}return}}while(0);___assert_fail(2264,2200,510,5960)}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6488;___cxa_throw(r12,13184,74)}}while(0);___assert_fail(2264,2200,510,5960)}}while(0);r23=___cxa_allocate_exception(4);HEAP32[r23>>2]=6488;___cxa_throw(r23,13184,74)}function __ZN3SAI5ResetEv(r1){var r2,r3,r4;r2=r1+40|0;r3=r1+4|0;r4=r1+8|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r2,HEAP32[r3>>2],(HEAP32[r1+20>>2]*((HEAP32[r1+16>>2]-1)*.5+1)&-1)+HEAP32[r4>>2]|0);__ZN5Eigen9DenseBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE11setConstantERKf(r2,0);r2=r1+52|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r2,HEAP32[r3>>2],HEAP32[r4>>2]);__ZN5Eigen9DenseBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE11setConstantERKf(r2,0);return}function __ZN3SAI10RunSegmentERKN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEEPS2_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+72|0;r6=r5;r7=r5+8;r8=r5+32;r9=r5+40;r10=r5+64;r11=r1+40|0;r12=r2+8|0;r13=HEAP32[r12>>2];r14=r1+24|0;if((r13|0)!=(HEAP32[r14>>2]|0)){___assert_fail(3800,3744,122,5880)}r15=r2+4|0;r16=r1+4|0;if((HEAP32[r15>>2]|0)!=(HEAP32[r16>>2]|0)){___assert_fail(3608,3744,124,5880)}r17=r1+8|0;r18=r1+16|0;r19=r1+20|0;r20=HEAP32[r17>>2]-r13+(HEAP32[r19>>2]*((HEAP32[r18>>2]-1)*.5+1)&-1)|0;r21=r1+44|0;r22=HEAP32[r21>>2];r23=r11|0;r24=HEAP32[r23>>2];r25=(r20|r22|0)>-1;do{if((r24|0)==0){if(r25){break}___assert_fail(3960,4544,303,5992)}else{if(r25){break}___assert_fail(2016,1952,162,5984)}}while(0);r25=r1+48|0;r26=HEAP32[r25>>2];if((r26|0)<(r20|0)){___assert_fail(3960,4544,303,5992)}r27=r26-r20|0;if((r22|0)<=-1){___assert_fail(3960,4544,303,5992)}if((r27|r20|0)<=-1){___assert_fail(3960,4544,303,5992)}if((r20|0)>0&(r22|0)>0){r28=0;while(1){r29=Math_imul(r22,r28+r27|0)|0;r30=Math_imul(r28,r22)|0;r31=0;while(1){HEAPF32[r24+(r31+r30<<2)>>2]=HEAPF32[r24+(r29+r31<<2)>>2];r32=r31+1|0;if((r32|0)<(r22|0)){r31=r32}else{break}}r31=r28+1|0;if((r31|0)<(r20|0)){r28=r31}else{break}}r33=HEAP32[r14>>2];r34=HEAP32[r25>>2];r35=HEAP32[r21>>2];r36=HEAP32[r23>>2]}else{r33=r13;r34=r26;r35=r22;r36=r24}r24=r34-r33|0;do{if((r36+(Math_imul(r35,r24)<<2)|0)!=0){if((r35|r33|0)>-1){break}___assert_fail(2016,1952,162,5984)}}while(0);if((r35|0)<=-1){___assert_fail(3960,4544,303,5992)}if((r24|r33|0)<=-1){___assert_fail(3960,4544,303,5992)}if((r35|0)!=(HEAP32[r15>>2]|0)){___assert_fail(2264,2200,510,5960)}if((r33|0)!=(HEAP32[r12>>2]|0)){___assert_fail(2264,2200,510,5960)}do{if((r33|0)>0){r12=r2|0;if((r35|0)>0){r37=0}else{r38=r34;break}while(1){r22=Math_imul(r35,r37+r24|0)|0;r26=0;while(1){r13=Math_imul(HEAP32[r15>>2],r37)+r26|0;HEAPF32[r36+(r22+r26<<2)>>2]=HEAPF32[HEAP32[r12>>2]+(r13<<2)>>2];r13=r26+1|0;if((r13|0)<(r35|0)){r26=r13}else{break}}r26=r37+1|0;if((r26|0)<(r33|0)){r37=r26}else{break}}r38=HEAP32[r25>>2]}else{r38=r34}}while(0);r34=r1+52|0;r37=HEAP32[r19>>2];r33=(r37|0)/2&-1|0;r35=r38-r37-r33*(HEAP32[r18>>2]-1)&-1;r37=r35-HEAP32[r1+12>>2]|0;r36=1-HEAP32[r17>>2]+r35|0;if((r36|0)<=0){___assert_fail(1496,4864,82,5904)}L2549:do{if((HEAP32[r16>>2]|0)>0){r35=r7|0;r15=r7+8|0;r24=r7+12|0;r2=r7+16|0;r12=r7;r26=r9|0;r22=r9+8|0;r13=r9+12|0;r14=r9+16|0;r28=r9;r20=r8|0;r27=r6|0;r31=r6+4|0;r29=r10+4|0;r30=r1+36|0;r32=r10|0;r39=r1+32|0;r40=r1+56|0;r41=r34|0;r42=r1+60|0;r43=r8+4|0;r44=r10|0;r45=0;r46=r38;L2552:while(1){r47=HEAP32[r23>>2]+(r45<<2)|0;HEAP32[r35>>2]=r47;HEAP32[r15>>2]=r46;if(!((r47|0)==0|(r46|0)>-1)){r4=2206;break}HEAP32[r24>>2]=r11;if((HEAP32[r21>>2]|0)<=(r45|0)){r4=2208;break}HEAP32[r2>>2]=1;__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_5BlockIKNS0_IfLin1ELin1ELi0ELin1ELin1EEELi1ELin1ELb0ELb1EEEEERKNS_9ArrayBaseIT_EE(r6,r12);r47=HEAP32[r23>>2]+(r45<<2)|0;r48=HEAP32[r25>>2];HEAP32[r26>>2]=r47;HEAP32[r22>>2]=r48;if(!((r47|0)==0|(r48|0)>-1)){r4=2210;break}HEAP32[r13>>2]=r11;if((HEAP32[r21>>2]|0)<=(r45|0)){r4=2213;break}HEAP32[r14>>2]=1;__ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_5BlockIKNS0_IfLin1ELin1ELi0ELin1ELin1EEELi1ELin1ELb0ELb1EEEEERKNS_9ArrayBaseIT_EE(r8,r28);r48=HEAP32[r20>>2];if((HEAP32[r18>>2]|0)>0){r47=HEAP32[r43>>2];r49=0;while(1){r50=r33*r49&-1;r51=r50+r37|0;r52=HEAP32[r19>>2];r53=HEAP32[r27>>2];if(!((r53+(r51<<2)|0)==0|(r52|0)>-1)){r4=2219;break L2552}if((r52|r51|0)<=-1){r4=2223;break L2552}if((r52+r51|0)>(HEAP32[r31>>2]|0)){r4=2223;break L2552}if(r52>>>0>1073741823){r4=2226;break L2552}r54=r52<<2;r55=_malloc(r54+16|0);if((r55|0)==0){r56=0}else{r57=r55+16&-16;HEAP32[r57-4>>2]=r55;r56=r57}if(!((r56|0)!=0|(r54|0)==0)){r4=2231;break L2552}HEAP32[r32>>2]=r56;HEAP32[r29>>2]=r52;if((r52|0)<0){r4=2234;break L2552}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r44,r52);if((HEAP32[r29>>2]|0)!=(r52|0)){r4=2241;break L2552}if((r52|0)>0){r54=HEAP32[r32>>2];r57=0;while(1){HEAPF32[r54+(r57<<2)>>2]=HEAPF32[r53+(r51+r57<<2)>>2];r55=r57+1|0;if((r55|0)<(r52|0)){r57=r55}else{break}}}if((r52|0)!=(HEAP32[r30>>2]|0)){r4=2248;break L2552}r57=HEAP32[r32>>2];r51=HEAP32[r39>>2];r53=HEAPF32[r51>>2];r54=HEAPF32[r57>>2]*r53;do{if((r52|0)>1){r55=1;r58=r54;r59=0;while(1){r60=HEAPF32[r57+(r55<<2)>>2]*HEAPF32[r51+(r55<<2)>>2];r61=r60>r58;r62=r61?r55:r59;r63=r61?r60:r58;r60=r55+1|0;if((r60|0)<(r52|0)){r55=r60;r58=r63;r59=r62}else{break}}r59=r63>0;if(r59){r64=r59?r63:r53;r65=r59?r62:0;break}else{r66=1;r67=r53;r68=0}while(1){r59=HEAPF32[r51+(r66<<2)>>2];r58=r59>r67;r55=r58?r66:r68;r60=r58?r59:r67;r59=r66+1|0;if((r59|0)<(r52|0)){r66=r59;r67=r60;r68=r55}else{r64=r60;r65=r55;break}}}else{r64=r54>0?r54:r53;r65=0}}while(0);r53=r64;r54=(r53+.025)/(r53+.5);r53=HEAP32[r41>>2];r52=r53+(r45<<2)|0;r51=HEAP32[r42>>2];r55=(r51|0)>-1;if(!((r52|0)==0|r55)){r4=2264;break L2552}if((HEAP32[r40>>2]|0)<=(r45|0)){r4=2267;break L2552}r60=1-r54;if(!r55){r4=2270;break L2552}do{if((r51|0)>0){HEAPF32[r52>>2]=r60*HEAPF32[r52>>2];if((r51|0)>1){r69=1}else{break}while(1){r55=r53+(Math_imul(HEAP32[r40>>2],r69)+r45<<2)|0;HEAPF32[r55>>2]=r60*HEAPF32[r55>>2];r55=r69+1|0;if((r55|0)<(r51|0)){r69=r55}else{break}}}}while(0);r51=HEAP32[r41>>2];r60=r51+(r45<<2)|0;r53=HEAP32[r42>>2];if(!((r60|0)==0|(r53|0)>-1)){r4=2276;break L2552}if((HEAP32[r40>>2]|0)<=(r45|0)){r4=2279;break L2552}r52=r50+r36+r65|0;r55=HEAP32[r17>>2];r59=r48+(r52<<2)|0;if(!((r59|0)==0|(r55|0)>-1)){r4=2282;break L2552}if((r55|r52|0)<0|(r55+r52|0)>(r47|0)){r4=2285;break L2552}if((r53|0)!=(r55|0)){r4=2288;break L2552}do{if((r53|0)>0){HEAPF32[r60>>2]=HEAPF32[r60>>2]+r54*HEAPF32[r59>>2];if((r53|0)>1){r70=1}else{break}while(1){r55=r51+(Math_imul(HEAP32[r40>>2],r70)+r45<<2)|0;HEAPF32[r55>>2]=HEAPF32[r55>>2]+r54*HEAPF32[r48+(r70+r52<<2)>>2];r55=r70+1|0;if((r55|0)<(r53|0)){r70=r55}else{break}}}}while(0);if((r60|0)!=0&(r59|0)==(r60|0)){r4=2294;break L2552}if((r57|0)!=0){_free(HEAP32[r57-4>>2])}r53=r49+1|0;if((r53|0)<(HEAP32[r18>>2]|0)){r49=r53}else{break}}}if((r48|0)!=0){_free(HEAP32[r48-4>>2])}r49=HEAP32[r27>>2];if((r49|0)!=0){_free(HEAP32[r49-4>>2])}r49=r45+1|0;if((r49|0)>=(HEAP32[r16>>2]|0)){r71=r40;r72=r42;break L2549}r45=r49;r46=HEAP32[r25>>2]}if(r4==2206){___assert_fail(2016,1952,162,5984)}else if(r4==2208){___assert_fail(4656,4544,278,5992)}else if(r4==2210){___assert_fail(2016,1952,162,5984)}else if(r4==2213){___assert_fail(4656,4544,278,5992)}else if(r4==2219){___assert_fail(2016,1952,162,5984)}else if(r4==2223){___assert_fail(3960,4544,303,5992)}else if(r4==2226){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==2231){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==2234){__ZN5Eigen8internal19throw_std_bad_allocEv()}else if(r4==2241){___assert_fail(2264,2200,510,5960)}else if(r4==2248){___assert_fail(4424,4272,144,6032)}else if(r4==2264){___assert_fail(2016,1952,162,5984)}else if(r4==2267){___assert_fail(4656,4544,278,5992)}else if(r4==2270){___assert_fail(1768,5120,76,6016)}else if(r4==2276){___assert_fail(2016,1952,162,5984)}else if(r4==2279){___assert_fail(4656,4544,278,5992)}else if(r4==2282){___assert_fail(2016,1952,162,5984)}else if(r4==2285){___assert_fail(3960,4544,303,5992)}else if(r4==2288){___assert_fail(1160,920,149,5960)}else if(r4==2294){___assert_fail(136,5712,402,5976)}}else{r71=r1+56|0;r72=r1+60|0}}while(0);r1=r3|0;r4=HEAP32[r71>>2];r25=HEAP32[r72>>2];if((r25|r4|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}do{if(!((r4|0)==0|(r25|0)==0)){if((r4|0)<=(2147483647/(r25|0)&-1|0)){break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r1,r4,r25);r25=HEAP32[r3+4>>2];if((r25|0)!=(HEAP32[r71>>2]|0)){___assert_fail(2264,2200,510,5960)}r71=HEAP32[r3+8>>2];if((r71|0)!=(HEAP32[r72>>2]|0)){___assert_fail(2264,2200,510,5960)}r72=Math_imul(r71,r25)|0;if((r72|0)<=0){STACKTOP=r5;return}r25=r34|0;r34=r3|0;r3=0;while(1){HEAPF32[HEAP32[r34>>2]+(r3<<2)>>2]=HEAPF32[HEAP32[r25>>2]+(r3<<2)>>2];r71=r3+1|0;if((r71|0)<(r72|0)){r3=r71}else{break}}STACKTOP=r5;return}function __ZN12sai_internal7SAIBase8RedesignERK9SAIParams(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=r1+4|0;r4=r2;HEAP32[r3>>2]=HEAP32[r4>>2];HEAP32[r3+4>>2]=HEAP32[r4+4>>2];HEAP32[r3+8>>2]=HEAP32[r4+8>>2];HEAP32[r3+12>>2]=HEAP32[r4+12>>2];HEAP32[r3+16>>2]=HEAP32[r4+16>>2];HEAP32[r3+20>>2]=HEAP32[r4+20>>2];HEAP32[r3+24>>2]=HEAP32[r4+24>>2];r4=HEAP32[r1+20>>2];r3=HEAP32[r1+8>>2];if((r4|0)<=(r3|0)){___assert_fail(2712,4864,49,3480)}r2=HEAP32[r1+16>>2];if((r2|0)<=0){___assert_fail(4128,4864,50,3480)}if((HEAP32[r1+24>>2]|0)>((r4*((r2-1)*.5+1)&-1)+r3|0)){___assert_fail(3120,4864,57,3480)}r3=r1+32|0;r2=3.141592653589793/(r4|0);r5=(3.1415927410125732-r2)/(r4-1|0);if((r4|0)<=-1){___assert_fail(1768,5120,76,6016)}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r3|0,r4);if((HEAP32[r1+36>>2]|0)!=(r4|0)){___assert_fail(2264,2200,510,5960)}if((r4|0)<=0){r6=r1;r7=HEAP32[r6>>2];r8=r7+8|0;r9=HEAP32[r8>>2];FUNCTION_TABLE[r9](r1);return}r10=r3|0;r3=0;while(1){r11=Math_sin(r2+r5*(r3|0));HEAPF32[HEAP32[r10>>2]+(r3<<2)>>2]=r11;r11=r3+1|0;if((r11|0)<(r4|0)){r3=r11}else{break}}r6=r1;r7=HEAP32[r6>>2];r8=r7+8|0;r9=HEAP32[r8>>2];FUNCTION_TABLE[r9](r1);return}function __ZN3SAID1Ev(r1){var r2,r3;r2=r1|0;HEAP32[r2>>2]=9304;r3=HEAP32[r1+52>>2];if((r3|0)!=0){_free(HEAP32[r3-4>>2])}r3=HEAP32[r1+40>>2];if((r3|0)!=0){_free(HEAP32[r3-4>>2])}HEAP32[r2>>2]=9184;r2=HEAP32[r1+32>>2];if((r2|0)==0){return}_free(HEAP32[r2-4>>2]);return}function __ZN3SAID0Ev(r1){var r2,r3;r2=r1|0;HEAP32[r2>>2]=9304;r3=HEAP32[r1+52>>2];if((r3|0)!=0){_free(HEAP32[r3-4>>2])}r3=HEAP32[r1+40>>2];if((r3|0)!=0){_free(HEAP32[r3-4>>2])}HEAP32[r2>>2]=9184;r2=HEAP32[r1+32>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}if((r1|0)==0){return}_free(r1);return}function __ZN12sai_internal7SAIBaseD1Ev(r1){var r2;HEAP32[r1>>2]=9184;r2=HEAP32[r1+32>>2];if((r2|0)==0){return}_free(HEAP32[r2-4>>2]);return}function __ZN12sai_internal7SAIBaseD0Ev(r1){var r2,r3;HEAP32[r1>>2]=9184;r2=HEAP32[r1+32>>2];if((r2|0)==0){r3=r1;_free(r3);return}_free(HEAP32[r2-4>>2]);r3=r1;_free(r3);return}function __ZN12sai_internal7SAIBase5ResetEv(r1){return}function __ZN5Eigen5ArrayIfLin1ELi1ELi0ELin1ELi1EEC2INS_5BlockIKNS0_IfLin1ELin1ELi0ELin1ELin1EEELi1ELin1ELb0ELb1EEEEERKNS_9ArrayBaseIT_EE(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r2+8|0;r4=HEAP32[r3>>2];r5=r1|0;if(r4>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r6=r4<<2;r4=_malloc(r6+16|0);if((r4|0)==0){r7=0}else{r8=r4+16&-16;HEAP32[r8-4>>2]=r4;r7=r8}if(!((r7|0)!=0|(r6|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r5>>2]=r7;r7=r1+4|0;HEAP32[r7>>2]=1;r6=HEAP32[r2>>2];r8=HEAP32[r3>>2];r3=HEAP32[r2+12>>2];if((r8|0)<0){__ZN5Eigen8internal19throw_std_bad_allocEv()}__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE6resizeEii(r1|0,r8);if((HEAP32[r7>>2]|0)!=(r8|0)){___assert_fail(2264,2200,510,5960)}if((r8|0)>0){r7=r3+4|0;r3=0;while(1){r1=HEAPF32[r6+(Math_imul(HEAP32[r7>>2],r3)<<2)>>2];HEAPF32[HEAP32[r5>>2]+(r3<<2)>>2]=r1;r1=r3+1|0;if((r1|0)<(r8|0)){r3=r1}else{break}}}r3=HEAP32[r5>>2];if(!((r3|0)!=0&(r6|0)==(r3|0))){return}___assert_fail(136,5712,402,5976)}function __ZN5Eigen9DenseBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE11setConstantERKf(r1,r2){var r3,r4,r5,r6,r7;r3=r1+4|0;r4=HEAP32[r3>>2];r5=r1+8|0;r6=HEAP32[r5>>2];if((r6|r4|0)<=-1){___assert_fail(1768,5120,76,6016)}r7=r1;do{if(!((r4|0)==0|(r6|0)==0)){if((r4|0)<=(2147483647/(r6|0)&-1|0)){break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELin1ELi0ELin1ELin1EEEE6resizeEii(r7,r4,r6);if((HEAP32[r3>>2]|0)!=(r4|0)){___assert_fail(2264,2200,510,5960)}if((HEAP32[r5>>2]|0)!=(r6|0)){___assert_fail(2264,2200,510,5960)}r5=Math_imul(r6,r4)|0;if((r5|0)<=0){return}r4=r1;r1=0;while(1){HEAPF32[HEAP32[r4>>2]+(r1<<2)>>2]=r2;r6=r1+1|0;if((r6|0)<(r5|0)){r1=r6}else{break}}return}function __ZN10SAIPlotter8RedesignERK9CARParamsRK9IHCParamsRK9AGCParamsRK9SAIParams(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r6=r1|0;r7=r1;r8=r2;_memcpy(r7,r8,44)|0;r8=r1+44|0;r7=r8|0;r2=r3|0;HEAP32[r7>>2]=HEAP32[r2>>2];HEAP32[r7+4>>2]=HEAP32[r2+4>>2];HEAP32[r7+8>>2]=HEAP32[r2+8>>2];HEAP32[r7+12>>2]=HEAP32[r2+12>>2];HEAP32[r7+16>>2]=HEAP32[r2+16>>2];HEAP32[r7+20>>2]=HEAP32[r2+20>>2];HEAP32[r7+24>>2]=HEAP32[r2+24>>2];r2=r1+72|0;HEAP32[r2>>2]=HEAP32[r4>>2];HEAPF32[r1+76>>2]=HEAPF32[r4+4>>2];HEAPF32[r1+80>>2]=HEAPF32[r4+8>>2];if((r2|0)!=(r4|0)){__ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+84|0,HEAP32[r4+12>>2],HEAP32[r4+16>>2]);__ZNSt3__16vectorIiNS_9allocatorIiEEE6assignIPiEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIiNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+96|0,HEAP32[r4+24>>2],HEAP32[r4+28>>2]);__ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+108|0,HEAP32[r4+36>>2],HEAP32[r4+40>>2]);__ZNSt3__16vectorIfNS_9allocatorIfEEE6assignIPfEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIfNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(r1+120|0,HEAP32[r4+48>>2],HEAP32[r4+52>>2])}r4=r1+132|0;__ZN6CARFAC8RedesignEifRK9CARParamsRK9IHCParamsRK9AGCParams(HEAP32[r4>>2],1,HEAPF32[r1+176>>2],r6,r8,r2);r2=r1+140|0;r8=r1+160|0;r6=HEAP32[r8>>2];r7=r2;r3=r5;HEAP32[r7>>2]=HEAP32[r3>>2];HEAP32[r7+4>>2]=HEAP32[r3+4>>2];HEAP32[r7+8>>2]=HEAP32[r3+8>>2];HEAP32[r7+12>>2]=HEAP32[r3+12>>2];HEAP32[r7+16>>2]=HEAP32[r3+16>>2];HEAP32[r7+20>>2]=HEAP32[r3+20>>2];HEAP32[r7+24>>2]=HEAP32[r3+24>>2];r3=HEAP32[r4>>2]+140|0;r4=r2|0;HEAP32[r4>>2]=HEAP32[r3>>2];HEAP32[r8>>2]=r6;r6=r1+144|0;HEAP32[r1+180>>2]=_SDL_SetVideoMode(HEAP32[r6>>2],HEAP32[r3>>2],32,16777216);r3=_malloc(12);if((r3|0)==0){__ZN5Eigen8internal19throw_std_bad_allocEv()}r8=r3;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;r7=HEAP32[r4>>2];r4=HEAP32[r6>>2];if((r4|r7|0)<=-1){___assert_fail(1768,1672,598,6008)}do{if(!((r7|0)==0|(r4|0)==0)){if((2147483647/(r4|0)&-1|0)>=(r7|0)){break}__ZN5Eigen8internal19throw_std_bad_allocEv()}}while(0);__ZN5Eigen12DenseStorageIfLin1ELin1ELin1ELi0EE6resizeEiii(r3,Math_imul(r4,r7)|0,r7,r4);r4=r1+172|0;r7=HEAP32[r4>>2];HEAP32[r4>>2]=r8;if((r7|0)==0){r9=r1+168|0;r10=HEAP32[r9>>2];r11=r10|0;__ZN12sai_internal7SAIBase8RedesignERK9SAIParams(r11,r2);return}r8=HEAP32[r7>>2];if((r8|0)!=0){_free(HEAP32[r8-4>>2])}_free(r7);r9=r1+168|0;r10=HEAP32[r9>>2];r11=r10|0;__ZN12sai_internal7SAIBase8RedesignERK9SAIParams(r11,r2);return}function __ZN10SAIPlotter5ResetEv(r1){var r2,r3,r4,r5;r2=HEAP32[r1+132>>2];r3=HEAP32[r2+148>>2];r4=HEAP32[r2+152>>2];if((r3|0)!=(r4|0)){r2=r3;while(1){r3=HEAP32[r2>>2];__ZN3Ear12InitCARStateEv(r3);__ZN3Ear12InitIHCStateEv(r3);__ZN3Ear12InitAGCStateEv(r3);r5=r3+244|0;__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r3+248|0,HEAP32[r5>>2]);__ZN5Eigen15PlainObjectBaseINS_5ArrayIfLin1ELi1ELi0ELin1ELi1EEEE7setZeroEi(r3+256|0,HEAP32[r5>>2]);r5=r2+4|0;if((r5|0)==(r4|0)){break}else{r2=r5}}}r2=HEAP32[r1+168>>2];FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2);return}function __ZN10SAIPlotter17ComputeAndPlotSAIEij(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;if((HEAP32[r1+160>>2]|0)!=(r3|0)){___assert_fail(2616,2576,95,3392)}r7=r2;if(!((r2|0)==0|(r3|0)>-1)){___assert_fail(2016,1952,162,5984)}r2=HEAP32[r1+132>>2];r8=r6|0;if(r3>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r9=r3<<2;r10=_malloc(r9+16|0);if((r10|0)==0){r11=0}else{r12=r10+16&-16;HEAP32[r12-4>>2]=r10;r11=r12}if(!((r11|0)!=0|(r9|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r8>>2]=r11;r11=r6+4|0;HEAP32[r11>>2]=1;r9=r6+8|0;HEAP32[r9>>2]=r3;do{if((r3|0)>=0){if((r3|0)!=0){if((2147483647/(r3|0)&-1|0)<1){break}}__ZN5Eigen12DenseStorageIfLin1ELin1ELin1ELi0EE6resizeEiii(r6|0,r3,1,r3);do{if((HEAP32[r11>>2]|0)==1){if((HEAP32[r9>>2]|0)!=(r3|0)){break}if((r3|0)>0){r12=HEAP32[r8>>2];r10=0;while(1){HEAPF32[r12+(r10<<2)>>2]=HEAPF32[r7+(r10<<2)>>2];r13=r10+1|0;if((r13|0)<(r3|0)){r10=r13}else{break}}}r10=r1+136|0;__ZN6CARFAC10RunSegmentERKN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEEbP12CARFACOutput(r2,r6,HEAP32[r10>>2]);r12=HEAP32[r8>>2];if((r12|0)!=0){_free(HEAP32[r12-4>>2])}r12=r1+172|0;__ZN3SAI10RunSegmentERKN5Eigen5ArrayIfLin1ELin1ELi0ELin1ELin1EEEPS2_(HEAP32[r1+168>>2],HEAP32[HEAP32[r10>>2]+4>>2],HEAP32[r12>>2]);r10=HEAP32[r12>>2];r12=r10+4|0;r13=HEAP32[r12>>2];if((r13|0)<=0){___assert_fail(2384,2336,188,5976)}r14=r10+8|0;r15=HEAP32[r14>>2];if((r15|0)<=0){___assert_fail(2384,2336,188,5976)}r16=r10|0;r10=HEAP32[r16>>2];r17=HEAPF32[r10>>2];if((r13|0)>1){r18=r17;r19=1;while(1){r20=HEAPF32[r10+(r19<<2)>>2];r21=r20<r18?r20:r18;r20=r19+1|0;if((r20|0)<(r13|0)){r18=r21;r19=r20}else{r22=r21;break}}}else{r22=r17}if((r15|0)>1){r19=r22;r18=1;while(1){r21=Math_imul(r18,r13)|0;r20=r19;r23=0;while(1){r24=HEAPF32[r10+(r23+r21<<2)>>2];r25=r24<r20?r24:r20;r24=r23+1|0;if((r24|0)<(r13|0)){r20=r25;r23=r24}else{break}}r23=r18+1|0;if((r23|0)<(r15|0)){r19=r25;r18=r23}else{r26=r25;break}}}else{r26=r22}r18=5-r26;r19=r18==0?1:r18;r18=r1+180|0;_SDL_LockSurface(HEAP32[r18>>2]);r15=HEAP32[r18>>2];r13=HEAP32[r15+20>>2];r10=HEAP32[r12>>2];if((r10|0)<=0){r27=r15;_SDL_UnlockSurface(r27);r28=HEAP32[r18>>2];r29=_SDL_Flip(r28);STACKTOP=r5;return}r15=0;r17=HEAP32[r14>>2];r23=r10;L2866:while(1){if((r17|0)>0){r10=0;r20=r17;r21=r23;while(1){if(!((r21|0)>(r15|0)&(r20|0)>(r10|0))){r4=2488;break L2866}r24=Math_imul(r21,r10)+r15|0;r30=(1-_fmin((HEAPF32[HEAP32[r16>>2]+(r24<<2)>>2]-r26)/r19,1))*255;r24=r30>=0?Math_floor(r30):Math_ceil(r30);r30=_SDL_MapRGB(HEAP32[HEAP32[r18>>2]+4>>2],r24,r24,r24);HEAP32[r13+(Math_imul(HEAP32[HEAP32[r18>>2]+8>>2],r15)+r10<<2)>>2]=r30;r30=r10+1|0;r24=HEAP32[r14>>2];r31=HEAP32[r12>>2];if((r30|0)<(r24|0)){r10=r30;r20=r24;r21=r31}else{r32=r24;r33=r31;break}}}else{r32=r17;r33=r23}r21=r15+1|0;if((r21|0)<(r33|0)){r15=r21;r17=r32;r23=r33}else{break}}if(r4==2488){___assert_fail(2520,2464,127,5864)}r27=HEAP32[r18>>2];_SDL_UnlockSurface(r27);r28=HEAP32[r18>>2];r29=_SDL_Flip(r28);STACKTOP=r5;return}}while(0);___assert_fail(2264,2200,510,5960)}}while(0);__ZN5Eigen8internal19throw_std_bad_allocEv()}function __ZNK10SAIPlotter10car_paramsEv(r1,r2){var r3;r3=r1;r1=r2;_memcpy(r3,r1,44)|0;return}function __ZNK10SAIPlotter10ihc_paramsEv(r1,r2){var r3;r3=r1|0;r1=r2+44|0;HEAP32[r3>>2]=HEAP32[r1>>2];HEAP32[r3+4>>2]=HEAP32[r1+4>>2];HEAP32[r3+8>>2]=HEAP32[r1+8>>2];HEAP32[r3+12>>2]=HEAP32[r1+12>>2];HEAP32[r3+16>>2]=HEAP32[r1+16>>2];HEAP32[r3+20>>2]=HEAP32[r1+20>>2];HEAP32[r3+24>>2]=HEAP32[r1+24>>2];return}function __ZNK10SAIPlotter10agc_paramsEv(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=0;HEAP32[r1>>2]=HEAP32[r2+72>>2];HEAPF32[r1+4>>2]=HEAPF32[r2+76>>2];HEAPF32[r1+8>>2]=HEAPF32[r2+80>>2];__ZNSt3__16vectorIfNS_9allocatorIfEEEC2ERKS3_(r1+12|0,r2+84|0);r4=r1+24|0;HEAP32[r4>>2]=0;r5=r1+28|0;HEAP32[r5>>2]=0;r6=r1+32|0;HEAP32[r6>>2]=0;r7=r2+100|0;r8=HEAP32[r7>>2];r9=r2+96|0;r10=HEAP32[r9>>2];r11=r8-r10|0;r12=r11>>2;do{if((r12|0)!=0){if(r12>>>0>1073741823){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r13=(r8|0)==(r10|0)?1:r11;while(1){r14=_malloc(r13);if((r14|0)!=0){break}r15=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r15|0)==0){r3=2515;break}FUNCTION_TABLE[r15]()}if(r3==2515){r13=___cxa_allocate_exception(4);HEAP32[r13>>2]=6488;___cxa_throw(r13,13184,74)}r13=r14;HEAP32[r5>>2]=r13;HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r13+(r12<<2);r15=HEAP32[r9>>2];r16=HEAP32[r7>>2];if((r15|0)==(r16|0)){break}else{r17=r15;r18=r13}while(1){if((r18|0)==0){r19=0}else{HEAP32[r18>>2]=HEAP32[r17>>2];r19=r18}r13=r19+4|0;HEAP32[r5>>2]=r13;r15=r17+4|0;if((r15|0)==(r16|0)){break}else{r17=r15;r18=r13}}}}while(0);__ZNSt3__16vectorIfNS_9allocatorIfEEEC2ERKS3_(r1+36|0,r2+108|0);__ZNSt3__16vectorIfNS_9allocatorIfEEEC2ERKS3_(r1+48|0,r2+120|0);return}function __ZNK10SAIPlotter10sai_paramsEv(r1,r2){var r3;r3=r1;r1=r2+140|0;HEAP32[r3>>2]=HEAP32[r1>>2];HEAP32[r3+4>>2]=HEAP32[r1+4>>2];HEAP32[r3+8>>2]=HEAP32[r1+8>>2];HEAP32[r3+12>>2]=HEAP32[r1+12>>2];HEAP32[r3+16>>2]=HEAP32[r1+16>>2];HEAP32[r3+20>>2]=HEAP32[r1+20>>2];HEAP32[r3+24>>2]=HEAP32[r1+24>>2];return}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9SAIParamsvES3_PKS2_JEE6invokeERKS5_S7_(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r2+HEAP32[r1+4>>2]|0;r2=HEAP32[r1>>2];if((r2&1|0)==0){r7=r2}else{r7=HEAP32[HEAP32[r6>>2]+(r2-1)>>2]}FUNCTION_TABLE[r7](r5,r6);while(1){r8=_malloc(28);if((r8|0)!=0){r3=2559;break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){break}FUNCTION_TABLE[r6]()}if(r3==2559){r3=r5;HEAP32[r8>>2]=HEAP32[r3>>2];HEAP32[r8+4>>2]=HEAP32[r3+4>>2];HEAP32[r8+8>>2]=HEAP32[r3+8>>2];HEAP32[r8+12>>2]=HEAP32[r3+12>>2];HEAP32[r8+16>>2]=HEAP32[r3+16>>2];HEAP32[r8+20>>2]=HEAP32[r3+20>>2];HEAP32[r8+24>>2]=HEAP32[r3+24>>2];STACKTOP=r4;return r8}r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6488;___cxa_throw(r8,13184,74)}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9AGCParamsvES3_PKS2_JEE6invokeERKS5_S7_(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=r2+HEAP32[r1+4>>2]|0;r2=HEAP32[r1>>2];if((r2&1|0)==0){r7=r2}else{r7=HEAP32[HEAP32[r6>>2]+(r2-1)>>2]}FUNCTION_TABLE[r7](r5,r6);while(1){r8=_malloc(60);if((r8|0)!=0){r3=2574;break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){break}FUNCTION_TABLE[r6]()}if(r3==2574){HEAP32[r8>>2]=HEAP32[r5>>2];HEAPF32[r8+4>>2]=HEAPF32[r5+4>>2];HEAPF32[r8+8>>2]=HEAPF32[r5+8>>2];r3=r5+12|0;HEAP32[r8+12>>2]=HEAP32[r3>>2];r6=r5+16|0;HEAP32[r8+16>>2]=HEAP32[r6>>2];r7=r5+20|0;HEAP32[r8+20>>2]=HEAP32[r7>>2];HEAP32[r7>>2]=0;HEAP32[r6>>2]=0;HEAP32[r3>>2]=0;r3=r5+24|0;HEAP32[r8+24>>2]=HEAP32[r3>>2];r6=r5+28|0;HEAP32[r8+28>>2]=HEAP32[r6>>2];r7=r5+32|0;HEAP32[r8+32>>2]=HEAP32[r7>>2];HEAP32[r7>>2]=0;HEAP32[r6>>2]=0;HEAP32[r3>>2]=0;r3=r5+36|0;HEAP32[r8+36>>2]=HEAP32[r3>>2];r6=r5+40|0;HEAP32[r8+40>>2]=HEAP32[r6>>2];r7=r5+44|0;HEAP32[r8+44>>2]=HEAP32[r7>>2];HEAP32[r7>>2]=0;HEAP32[r6>>2]=0;HEAP32[r3>>2]=0;r3=r5+48|0;HEAP32[r8+48>>2]=HEAP32[r3>>2];r6=r5+52|0;HEAP32[r8+52>>2]=HEAP32[r6>>2];r7=r5+56|0;HEAP32[r8+56>>2]=HEAP32[r7>>2];HEAP32[r7>>2]=0;HEAP32[r6>>2]=0;HEAP32[r3>>2]=0;__ZN9AGCParamsD2Ev(r5);STACKTOP=r4;return r8}r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6488;___cxa_throw(r8,13184,74)}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9IHCParamsvES3_PKS2_JEE6invokeERKS5_S7_(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r2+HEAP32[r1+4>>2]|0;r2=HEAP32[r1>>2];if((r2&1|0)==0){r7=r2}else{r7=HEAP32[HEAP32[r6>>2]+(r2-1)>>2]}FUNCTION_TABLE[r7](r5,r6);while(1){r8=_malloc(28);if((r8|0)!=0){r3=2591;break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){break}FUNCTION_TABLE[r6]()}if(r3==2591){r3=r5|0;HEAP32[r8>>2]=HEAP32[r3>>2];HEAP32[r8+4>>2]=HEAP32[r3+4>>2];HEAP32[r8+8>>2]=HEAP32[r3+8>>2];HEAP32[r8+12>>2]=HEAP32[r3+12>>2];HEAP32[r8+16>>2]=HEAP32[r3+16>>2];HEAP32[r8+20>>2]=HEAP32[r3+20>>2];HEAP32[r8+24>>2]=HEAP32[r3+24>>2];STACKTOP=r4;return r8}r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6488;___cxa_throw(r8,13184,74)}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterKF9CARParamsvES3_PKS2_JEE6invokeERKS5_S7_(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r2+HEAP32[r1+4>>2]|0;r2=HEAP32[r1>>2];if((r2&1|0)==0){r7=r2}else{r7=HEAP32[HEAP32[r6>>2]+(r2-1)>>2]}FUNCTION_TABLE[r7](r5,r6);while(1){r8=_malloc(44);if((r8|0)!=0){r3=2606;break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){break}FUNCTION_TABLE[r6]()}if(r3==2606){r3=r8;r6=r5;_memcpy(r8,r6,44)|0;STACKTOP=r4;return r3}r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=6488;___cxa_throw(r3,13184,74)}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterFvijEvPS2_JijEE6invokeERKS4_S5_ij(r1,r2,r3,r4){var r5,r6,r7;r5=r2+HEAP32[r1+4>>2]|0;r2=r5;r6=HEAP32[r1>>2];if((r6&1|0)==0){r7=r6;FUNCTION_TABLE[r7](r2,r3,r4);return}else{r7=HEAP32[HEAP32[r5>>2]+(r6-1)>>2];FUNCTION_TABLE[r7](r2,r3,r4);return}}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterFvvEvPS2_JEE6invokeERKS4_S5_(r1,r2){var r3,r4,r5;r3=r2+HEAP32[r1+4>>2]|0;r2=r3;r4=HEAP32[r1>>2];if((r4&1|0)==0){r5=r4;FUNCTION_TABLE[r5](r2);return}else{r5=HEAP32[HEAP32[r3>>2]+(r4-1)>>2];FUNCTION_TABLE[r5](r2);return}}function __ZN10emscripten8internal13MethodInvokerIM10SAIPlotterFvRK9CARParamsRK9IHCParamsRK9AGCParamsRK9SAIParamsEvPS2_JS5_S8_SB_SE_EE6invokeERKSG_SH_PS3_PS6_PS9_PSC_(r1,r2,r3,r4,r5,r6){var r7,r8,r9;r7=r2+HEAP32[r1+4>>2]|0;r2=r7;r8=HEAP32[r1>>2];if((r8&1|0)==0){r9=r8;FUNCTION_TABLE[r9](r2,r3,r4,r5,r6);return}else{r9=HEAP32[HEAP32[r7>>2]+(r8-1)>>2];FUNCTION_TABLE[r9](r2,r3,r4,r5,r6);return}}function __ZN10emscripten8internal12operator_newI10SAIPlotterJfiEEEPT_DpT0_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=0;while(1){r4=_malloc(184);if((r4|0)!=0){break}r5=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r5|0)==0){r3=2633;break}FUNCTION_TABLE[r5]()}if(r3==2633){r5=___cxa_allocate_exception(4);HEAP32[r5>>2]=6488;___cxa_throw(r5,13184,74)}r5=r4;r6=r4;HEAPF32[r4>>2]=.10000000149011612;HEAPF32[r4+4>>2]=.03999999910593033;HEAPF32[r4+8>>2]=.10000000149011612;HEAPF32[r4+12>>2]=.3499999940395355;HEAPF32[r4+16>>2]=2.670353651046753;HEAPF32[r4+20>>2]=1.4142135381698608;HEAPF32[r4+24>>2]=.5;HEAPF32[r4+28>>2]=.5;HEAPF32[r4+32>>2]=30;HEAPF32[r4+36>>2]=165.3000030517578;HEAPF32[r4+40>>2]=9.26449203491211;r7=r4+44|0;r8=r7;HEAP8[r7]=0;HEAP8[r4+45|0]=1;HEAPF32[r4+48>>2]=7999999797903001e-20;HEAPF32[r4+52>>2]=.0005000000237487257;HEAPF32[r4+56>>2]=.009999999776482582;HEAPF32[r4+60>>2]=.0024999999441206455;HEAPF32[r4+64>>2]=.004999999888241291;HEAPF32[r4+68>>2]=20;r7=r4+72|0;__ZN9AGCParamsC2Ev(r7);r9=r4+132|0;HEAP32[r9>>2]=0;r10=r4+136|0;HEAP32[r10>>2]=0;r11=r4+168|0;HEAP32[r11>>2]=0;HEAP32[r4+172>>2]=0;HEAPF32[r4+176>>2]=r1;while(1){r12=_malloc(168);if((r12|0)!=0){break}r13=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r13|0)==0){r3=2646;break}FUNCTION_TABLE[r13]()}if(r3==2646){r13=___cxa_allocate_exception(4);HEAP32[r13>>2]=6488;___cxa_throw(r13,13184,74)}r13=r12;HEAPF32[r12>>2]=.10000000149011612;HEAPF32[r12+4>>2]=.03999999910593033;HEAPF32[r12+8>>2]=.10000000149011612;HEAPF32[r12+12>>2]=.3499999940395355;HEAPF32[r12+16>>2]=2.670353651046753;HEAPF32[r12+20>>2]=1.4142135381698608;HEAPF32[r12+24>>2]=.5;HEAPF32[r12+28>>2]=.5;HEAPF32[r12+32>>2]=30;HEAPF32[r12+36>>2]=165.3000030517578;HEAPF32[r12+40>>2]=9.26449203491211;HEAP8[r12+44|0]=0;HEAP8[r12+45|0]=1;HEAPF32[r12+48>>2]=7999999797903001e-20;HEAPF32[r12+52>>2]=.0005000000237487257;HEAPF32[r12+56>>2]=.009999999776482582;HEAPF32[r12+60>>2]=.0024999999441206455;HEAPF32[r12+64>>2]=.004999999888241291;HEAPF32[r12+68>>2]=20;__ZN9AGCParamsC2Ev(r12+72|0);r14=r12+148|0;HEAP32[r14>>2]=0;HEAP32[r14+4>>2]=0;HEAP32[r14+8>>2]=0;HEAP32[r14+12>>2]=0;HEAP32[r14+16>>2]=0;__ZN6CARFAC8RedesignEifRK9CARParamsRK9IHCParamsRK9AGCParams(r13,1,r1,r6,r8,r7);r1=HEAP32[r9>>2];HEAP32[r9>>2]=r13;if((r1|0)!=0){__ZN6CARFACD2Ev(r1);_free(r1)}while(1){r15=_malloc(52);if((r15|0)!=0){break}r1=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r1|0)==0){r3=2667;break}FUNCTION_TABLE[r1]()}if(r3==2667){r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=6488;___cxa_throw(r1,13184,74)}_memset(r15+4|0,0,48);HEAP8[r15]=1;HEAP8[r15+1|0]=0;HEAP8[r15+2|0]=0;HEAP8[r15+3|0]=0;r1=HEAP32[r10>>2];HEAP32[r10>>2]=r15;if((r1|0)!=0){__ZN12CARFACOutputD2Ev(r1);_free(r1|0)}r1=r4+140|0;r15=r1;HEAP32[r1>>2]=HEAP32[HEAP32[r9>>2]+140>>2];HEAP32[r4+144>>2]=r2;HEAP32[r4+160>>2]=r2;HEAP32[r4+156>>2]=r2+1;HEAP32[r4+148>>2]=(r2|0)/2&-1;HEAP32[r4+152>>2]=2;while(1){r16=_malloc(64);if((r16|0)!=0){break}r4=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r4|0)==0){r3=2680;break}FUNCTION_TABLE[r4]()}if(r3==2680){r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=6488;___cxa_throw(r3,13184,74)}__ZN3SAIC2ERK9SAIParams(r16,r15);r3=HEAP32[r11>>2];HEAP32[r11>>2]=r16;if((r3|0)!=0){FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+4>>2]](r3)}_SDL_Init(32);__ZN10SAIPlotter8RedesignERK9CARParamsRK9IHCParamsRK9AGCParamsRK9SAIParams(r5,r6,r8,r7,r15);return r5}function __ZN12CARFACOutputD2Ev(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=r1+40|0;r3=HEAP32[r2>>2];do{if((r3|0)!=0){r4=r1+44|0;r5=HEAP32[r4>>2];if((r3|0)==(r5|0)){r6=r3}else{r7=r5;while(1){r5=r7-12|0;HEAP32[r4>>2]=r5;r8=HEAP32[r5>>2];if((r8|0)==0){r9=r5}else{_free(HEAP32[r8-4>>2]);r9=HEAP32[r4>>2]}if((r3|0)==(r9|0)){break}else{r7=r9}}r7=HEAP32[r2>>2];if((r7|0)==0){break}else{r6=r7}}_free(r6)}}while(0);r6=r1+28|0;r2=HEAP32[r6>>2];do{if((r2|0)!=0){r9=r1+32|0;r3=HEAP32[r9>>2];if((r2|0)==(r3|0)){r10=r2}else{r7=r3;while(1){r3=r7-12|0;HEAP32[r9>>2]=r3;r4=HEAP32[r3>>2];if((r4|0)==0){r11=r3}else{_free(HEAP32[r4-4>>2]);r11=HEAP32[r9>>2]}if((r2|0)==(r11|0)){break}else{r7=r11}}r7=HEAP32[r6>>2];if((r7|0)==0){break}else{r10=r7}}_free(r10)}}while(0);r10=r1+16|0;r6=HEAP32[r10>>2];do{if((r6|0)!=0){r11=r1+20|0;r2=HEAP32[r11>>2];if((r6|0)==(r2|0)){r12=r6}else{r7=r2;while(1){r2=r7-12|0;HEAP32[r11>>2]=r2;r9=HEAP32[r2>>2];if((r9|0)==0){r13=r2}else{_free(HEAP32[r9-4>>2]);r13=HEAP32[r11>>2]}if((r6|0)==(r13|0)){break}else{r7=r13}}r7=HEAP32[r10>>2];if((r7|0)==0){break}else{r12=r7}}_free(r12)}}while(0);r12=r1+4|0;r10=HEAP32[r12>>2];if((r10|0)==0){return}r13=r1+8|0;r1=HEAP32[r13>>2];do{if((r10|0)==(r1|0)){r14=r10}else{r6=r1;while(1){r7=r6-12|0;HEAP32[r13>>2]=r7;r11=HEAP32[r7>>2];if((r11|0)==0){r15=r7}else{_free(HEAP32[r11-4>>2]);r15=HEAP32[r13>>2]}if((r10|0)==(r15|0)){break}else{r6=r15}}r6=HEAP32[r12>>2];if((r6|0)!=0){r14=r6;break}return}}while(0);_free(r14);return}function __ZNKSt3__16vectorIfNS_9allocatorIfEEE4sizeEv(r1){return HEAP32[r1+4>>2]-HEAP32[r1>>2]>>2}function __ZN10emscripten8internal7InvokerIP10SAIPlotterJfiEE6invokeEPFS3_fiEfi(r1,r2,r3){return FUNCTION_TABLE[r1](r2,r3)}function __ZN10emscripten8internal13getActualTypeI10SAIPlotterEEPKNS0_7_TYPEIDEPT_(r1){if((r1|0)==0){___assert_fail(2840,2768,797,6048)}else{return 15064}}function __ZN10emscripten8internal14raw_destructorI10SAIPlotterEEvPT_(r1){var r2,r3;if((r1|0)==0){return}r2=r1+172|0;r3=HEAP32[r2>>2];HEAP32[r2>>2]=0;if((r3|0)!=0){r2=HEAP32[r3>>2];if((r2|0)!=0){_free(HEAP32[r2-4>>2])}_free(r3)}r3=r1+168|0;r2=HEAP32[r3>>2];HEAP32[r3>>2]=0;if((r2|0)!=0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+4>>2]](r2)}r2=r1+136|0;r3=HEAP32[r2>>2];HEAP32[r2>>2]=0;if((r3|0)!=0){__ZN12CARFACOutputD2Ev(r3);_free(r3|0)}r3=r1+132|0;r2=HEAP32[r3>>2];HEAP32[r3>>2]=0;if((r2|0)!=0){__ZN6CARFACD2Ev(r2);_free(r2)}__ZN9AGCParamsD2Ev(r1+72|0);_free(r1);return}function __ZN10emscripten8internal12MemberAccessI9SAIParamsiE7getWireIS2_EEiRKMS2_iRKT_(r1,r2){return HEAP32[r2+HEAP32[r1>>2]>>2]}function __ZN10emscripten8internal12MemberAccessI9SAIParamsiE7setWireIS2_EEvRKMS2_iRT_i(r1,r2,r3){HEAP32[r2+HEAP32[r1>>2]>>2]=r3;return}function __ZN10emscripten8internal15raw_constructorI9SAIParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE(){var r1,r2,r3;r1=0;while(1){r2=_malloc(28);if((r2|0)!=0){r1=2771;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r1==2771){HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r2+24>>2]=0;return r2}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}function __ZN10emscripten8internal14raw_destructorI9SAIParamsEEvPT_(r1){if((r1|0)==0){return}_free(r1);return}function __ZN10emscripten8internal12MemberAccessI9IHCParamsfE7getWireIS2_EEfRKMS2_fRKT_(r1,r2){return HEAPF32[r2+HEAP32[r1>>2]>>2]}function __ZN10emscripten8internal12MemberAccessI9IHCParamsfE7setWireIS2_EEvRKMS2_fRT_f(r1,r2,r3){HEAPF32[r2+HEAP32[r1>>2]>>2]=r3;return}function __ZN10emscripten8internal12MemberAccessI9IHCParamsbE7getWireIS2_EEbRKMS2_bRKT_(r1,r2){return(HEAP8[r2+HEAP32[r1>>2]|0]&1)!=0}function __ZN10emscripten8internal12MemberAccessI9IHCParamsbE7setWireIS2_EEvRKMS2_bRT_b(r1,r2,r3){HEAP8[r2+HEAP32[r1>>2]|0]=r3&1;return}function __ZN10emscripten8internal15raw_constructorI9IHCParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE(){var r1,r2,r3;r1=0;while(1){r2=_malloc(28);if((r2|0)!=0){r1=2792;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r1==2792){HEAP8[r2]=0;HEAP8[r2+1|0]=1;HEAPF32[r2+4>>2]=7999999797903001e-20;HEAPF32[r2+8>>2]=.0005000000237487257;HEAPF32[r2+12>>2]=.009999999776482582;HEAPF32[r2+16>>2]=.0024999999441206455;HEAPF32[r2+20>>2]=.004999999888241291;HEAPF32[r2+24>>2]=20;return r2}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}function __ZN10emscripten8internal14raw_destructorI9IHCParamsEEvPT_(r1){if((r1|0)==0){return}_free(r1|0);return}function __ZN10emscripten8internal12MemberAccessI9CARParamsfE7getWireIS2_EEfRKMS2_fRKT_(r1,r2){return HEAPF32[r2+HEAP32[r1>>2]>>2]}function __ZN10emscripten8internal12MemberAccessI9CARParamsfE7setWireIS2_EEvRKMS2_fRT_f(r1,r2,r3){HEAPF32[r2+HEAP32[r1>>2]>>2]=r3;return}function __ZN10emscripten8internal15raw_constructorI9CARParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE(){var r1,r2,r3;r1=0;while(1){r2=_malloc(44);if((r2|0)!=0){r1=2811;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r1==2811){HEAPF32[r2>>2]=.10000000149011612;HEAPF32[r2+4>>2]=.03999999910593033;HEAPF32[r2+8>>2]=.10000000149011612;HEAPF32[r2+12>>2]=.3499999940395355;HEAPF32[r2+16>>2]=2.670353651046753;HEAPF32[r2+20>>2]=1.4142135381698608;HEAPF32[r2+24>>2]=.5;HEAPF32[r2+28>>2]=.5;HEAPF32[r2+32>>2]=30;HEAPF32[r2+36>>2]=165.3000030517578;HEAPF32[r2+40>>2]=9.26449203491211;return r2}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}function __ZN10emscripten8internal14raw_destructorI9CARParamsEEvPT_(r1){if((r1|0)==0){return}_free(r1);return}function __ZN10emscripten8internal12MemberAccessI9AGCParamsfE7getWireIS2_EEfRKMS2_fRKT_(r1,r2){return HEAPF32[r2+HEAP32[r1>>2]>>2]}function __ZN10emscripten8internal12MemberAccessI9AGCParamsfE7setWireIS2_EEvRKMS2_fRT_f(r1,r2,r3){HEAPF32[r2+HEAP32[r1>>2]>>2]=r3;return}function __ZN10emscripten8internal12MemberAccessI9AGCParamsiE7getWireIS2_EEiRKMS2_iRKT_(r1,r2){return HEAP32[r2+HEAP32[r1>>2]>>2]}function __ZN10emscripten8internal12MemberAccessI9AGCParamsiE7setWireIS2_EEvRKMS2_iRT_i(r1,r2,r3){HEAP32[r2+HEAP32[r1>>2]>>2]=r3;return}function __ZN10emscripten8internal15raw_constructorI9AGCParamsJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE(){var r1,r2,r3;r1=0;while(1){r2=_malloc(60);if((r2|0)!=0){r1=2832;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){r1=2829;break}FUNCTION_TABLE[r3]()}if(r1==2832){r3=r2;__ZN9AGCParamsC2Ev(r3);return r3}else if(r1==2829){r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=6488;___cxa_throw(r1,13184,74)}}function __ZN10emscripten8internal14raw_destructorI9AGCParamsEEvPT_(r1){if((r1|0)==0){return}__ZN9AGCParamsD2Ev(r1);_free(r1);return}function __ZNSt3__16vectorIfNS_9allocatorIfEEE9push_backERKf(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=r1+4|0;r5=HEAP32[r4>>2];r6=r1+8|0;if((r5|0)!=(HEAP32[r6>>2]|0)){if((r5|0)==0){r7=0}else{HEAPF32[r5>>2]=HEAPF32[r2>>2];r7=HEAP32[r4>>2]}HEAP32[r4>>2]=r7+4;return}r7=r1|0;r1=HEAP32[r7>>2];r8=r5-r1|0;r5=r8>>2;r9=r5+1|0;if(r9>>>0>1073741823){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}if(r5>>>0>536870910){r10=1073741823;r3=2848}else{r11=r8>>1;r12=r11>>>0<r9>>>0?r9:r11;if((r12|0)==0){r13=0;r14=0}else{r10=r12;r3=2848}}do{if(r3==2848){r12=r10<<2;r11=(r12|0)==0?1:r12;while(1){r15=_malloc(r11);if((r15|0)!=0){r3=2859;break}r12=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r12|0)==0){break}FUNCTION_TABLE[r12]()}if(r3==2859){r13=r15;r14=r10;break}r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=6488;___cxa_throw(r11,13184,74)}}while(0);r10=r13+(r5<<2)|0;r5=r13+(r14<<2)|0;if((r10|0)!=0){HEAPF32[r10>>2]=HEAPF32[r2>>2]}r2=r13+(r9<<2)|0;r9=r13;r10=r1;_memcpy(r9,r10,r8)|0;HEAP32[r7>>2]=r13;HEAP32[r4>>2]=r2;HEAP32[r6>>2]=r5;if((r1|0)==0){return}_free(r10);return}function __ZN10emscripten8internal12VectorAccessINSt3__16vectorIfNS2_9allocatorIfEEEEE3getERKS6_j(r1,r2,r3){var r4;r4=HEAP32[r2>>2];if(HEAP32[r2+4>>2]-r4>>2>>>0>r3>>>0){HEAP32[r1>>2]=__emval_take_value(__ZTIf,HEAPF32[r4+(r3<<2)>>2]);return}else{HEAP32[r1>>2]=__emval_undefined();return}}function __ZN10emscripten8internal12VectorAccessINSt3__16vectorIfNS2_9allocatorIfEEEEE3setERS6_jRKf(r1,r2,r3){HEAPF32[HEAP32[r1>>2]+(r2<<2)>>2]=HEAPF32[r3>>2];return 1}function __ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorIfNS2_9allocatorIfEEEEjRKfEbS7_JjS9_EE6invokeEPSB_PS6_jf(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=HEAP32[r1>>2];HEAPF32[r6>>2]=r4;r4=FUNCTION_TABLE[r7](r2,r3,r6);STACKTOP=r5;return r4}function __ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorIfNS3_9allocatorIfEEEEjES2_S9_JjEE6invokeEPSB_PS7_j(r1,r2,r3){var r4,r5;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;FUNCTION_TABLE[HEAP32[r1>>2]](r5,r2,r3);r3=r5|0;__emval_incref(HEAP32[r3>>2]);r5=HEAP32[r3>>2];__emval_decref(r5);STACKTOP=r4;return r5}function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIfNS2_9allocatorIfEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_(r1,r2){var r3,r4,r5,r6;r3=r2+HEAP32[r1+4>>2]|0;r2=r3;r4=HEAP32[r1>>2];if((r4&1|0)==0){r5=r4;r6=FUNCTION_TABLE[r5](r2);return r6}else{r5=HEAP32[HEAP32[r3>>2]+(r4-1)>>2];r6=FUNCTION_TABLE[r5](r2);return r6}}function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIfNS2_9allocatorIfEEEEFvRKfEvPS6_JS8_EE6invokeERKSA_SB_f(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r2+HEAP32[r1+4>>2]|0;r2=r6;r7=HEAP32[r1>>2];if((r7&1|0)==0){r8=r7;HEAPF32[r5>>2]=r3;FUNCTION_TABLE[r8](r2,r5);STACKTOP=r4;return}else{r8=HEAP32[HEAP32[r6>>2]+(r7-1)>>2];HEAPF32[r5>>2]=r3;FUNCTION_TABLE[r8](r2,r5);STACKTOP=r4;return}}function __ZN10emscripten8internal12operator_newINSt3__16vectorIfNS2_9allocatorIfEEEEJEEEPT_DpT0_(){var r1,r2,r3;r1=0;while(1){r2=_malloc(12);if((r2|0)!=0){r1=2906;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r1==2906){HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return r2}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}function __ZN10emscripten8internal7InvokerIPNSt3__16vectorIfNS2_9allocatorIfEEEEJEE6invokeEPFS7_vE(r1){return FUNCTION_TABLE[r1]()}function __ZN10emscripten8internal13getActualTypeINSt3__16vectorIfNS2_9allocatorIfEEEEEEPKNS0_7_TYPEIDEPT_(r1){if((r1|0)==0){___assert_fail(2840,2768,797,6048)}else{return 14160}}function __ZN10emscripten8internal14raw_destructorINSt3__16vectorIfNS2_9allocatorIfEEEEEEvPT_(r1){var r2,r3,r4,r5;if((r1|0)==0){return}r2=HEAP32[r1>>2];r3=r2;if((r2|0)!=0){r4=r1+4|0;r5=HEAP32[r4>>2];if((r2|0)!=(r5|0)){HEAP32[r4>>2]=r5+(~((r5-4+ -r3|0)>>>2)<<2)}_free(r2)}_free(r1);return}function __ZNSt3__16vectorIfNS_9allocatorIfEEEC2ERKS3_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=r1|0;HEAP32[r4>>2]=0;r5=r1+4|0;HEAP32[r5>>2]=0;r6=r1+8|0;HEAP32[r6>>2]=0;r1=r2+4|0;r7=HEAP32[r1>>2];r8=r2|0;r2=HEAP32[r8>>2];r9=r7-r2|0;r10=r9>>2;if((r10|0)==0){return}if(r10>>>0>1073741823){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r11=(r7|0)==(r2|0)?1:r9;while(1){r12=_malloc(r11);if((r12|0)!=0){break}r9=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r9|0)==0){r3=2933;break}FUNCTION_TABLE[r9]()}if(r3==2933){r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=6488;___cxa_throw(r3,13184,74)}r3=r12;HEAP32[r5>>2]=r3;HEAP32[r4>>2]=r3;HEAP32[r6>>2]=r3+(r10<<2);r10=HEAP32[r8>>2];r8=HEAP32[r1>>2];if((r10|0)==(r8|0)){return}else{r13=r10;r14=r3}while(1){if((r14|0)==0){r15=0}else{HEAPF32[r14>>2]=HEAPF32[r13>>2];r15=HEAP32[r5>>2]}r3=r15+4|0;HEAP32[r5>>2]=r3;r10=r13+4|0;if((r10|0)==(r8|0)){break}else{r13=r10;r14=r3}}return}function __ZN5Eigen12DenseStorageIfLin1ELin1ELin1ELi0EE6resizeEiii(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r1+4|0;r6=r1+8|0;if((Math_imul(HEAP32[r6>>2],HEAP32[r5>>2])|0)==(r2|0)){HEAP32[r5>>2]=r3;HEAP32[r6>>2]=r4;return}r7=r1|0;r1=HEAP32[r7>>2];if((r1|0)!=0){_free(HEAP32[r1-4>>2])}if((r2|0)==0){HEAP32[r7>>2]=0;HEAP32[r5>>2]=r3;HEAP32[r6>>2]=r4;return}if(r2>>>0>1073741823){__ZN5Eigen8internal19throw_std_bad_allocEv()}r1=r2<<2;r2=_malloc(r1+16|0);if((r2|0)==0){r8=0}else{r9=r2+16&-16;HEAP32[r9-4>>2]=r2;r8=r9}if(!((r8|0)!=0|(r1|0)==0)){__ZN5Eigen8internal19throw_std_bad_allocEv()}HEAP32[r7>>2]=r8;HEAP32[r5>>2]=r3;HEAP32[r6>>2]=r4;return}function __GLOBAL__I_a(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=STACKTOP;STACKTOP=STACKTOP+232|0;r2=r1;r3=r1+24;r4=r1+40;r5=r1+56;r6=r1+72;r7=r1+80;r8=r1+96;r9=r1+112;r10=r1+128;r11=r1+144;r12=r1+168;r13=r1+184;r14=r1+216;__embind_register_class(14160,13280,13296,0,210,0,0,1576,808);HEAP32[r6>>2]=1;r15=r6+4|0;HEAP32[r15>>2]=13280;__embind_register_class_constructor(14160,1,r15,260,150);HEAP32[r5>>2]=3;r15=r5+4|0;HEAP32[r15>>2]=13152;HEAP32[r5+8>>2]=13280;HEAP32[r5+12>>2]=__ZTIf;r5=_malloc(8);if((r5|0)!=0){r6=r5;HEAP32[r6>>2]=454;HEAP32[r6+4>>2]=0}__embind_register_class_function(14160,2696,3,r15,410,r5);HEAP32[r4>>2]=2;r5=r4+4|0;HEAP32[r5>>2]=__ZTIj;HEAP32[r4+8>>2]=13296;r4=_malloc(8);if((r4|0)!=0){r15=r4;HEAP32[r15>>2]=616;HEAP32[r15+4>>2]=0}__embind_register_class_function(14160,2688,2,r5,234,r4);HEAP32[r3>>2]=3;r4=r3+4|0;HEAP32[r4>>2]=14880;HEAP32[r3+8>>2]=14160;HEAP32[r3+12>>2]=__ZTIj;r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=510}__embind_register_class_function(14160,2680,3,r4,542,r3);HEAP32[r2>>2]=4;r3=r2+4|0;HEAP32[r3>>2]=13160;HEAP32[r2+8>>2]=14160;HEAP32[r2+12>>2]=__ZTIj;HEAP32[r2+16>>2]=__ZTIf;r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=672}__embind_register_class_function(14160,2672,4,r3,710,r2);__embind_register_value_object(15040,4592,650,750);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=0}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=0}__embind_register_value_object_field(15040,3920,__ZTIi,544,r2,__ZTIi,434,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=4}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=4}__embind_register_value_object_field(15040,2968,__ZTIf,18,r3,__ZTIf,734,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=8}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=8}__embind_register_value_object_field(15040,2600,__ZTIf,18,r2,__ZTIf,734,r3);__embind_finalize_value_object(15040);__embind_register_value_object(15032,2e3,262,822);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=0}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=0}__embind_register_value_object_field(15032,1408,__ZTIf,344,r3,__ZTIf,388,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=4}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=4}__embind_register_value_object_field(15032,1096,__ZTIf,344,r2,__ZTIf,388,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=8}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=8}__embind_register_value_object_field(15032,888,__ZTIf,344,r3,__ZTIf,388,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=12}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=12}__embind_register_value_object_field(15032,104,__ZTIf,344,r2,__ZTIf,388,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=16}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=16}__embind_register_value_object_field(15032,5624,__ZTIf,344,r3,__ZTIf,388,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=20}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=20}__embind_register_value_object_field(15032,5288,__ZTIf,344,r2,__ZTIf,388,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=24}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=24}__embind_register_value_object_field(15032,5064,__ZTIf,344,r3,__ZTIf,388,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=28}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=28}__embind_register_value_object_field(15032,4904,__ZTIf,344,r2,__ZTIf,388,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=32}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=32}__embind_register_value_object_field(15032,4848,__ZTIf,344,r3,__ZTIf,388,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=36}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=36}__embind_register_value_object_field(15032,4640,__ZTIf,344,r2,__ZTIf,388,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=40}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=40}__embind_register_value_object_field(15032,4536,__ZTIf,344,r3,__ZTIf,388,r2);__embind_finalize_value_object(15032);__embind_register_value_object(15024,4512,496,464);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=0}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=0}__embind_register_value_object_field(15024,4488,13160,126,r2,13160,798,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=1}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=1}__embind_register_value_object_field(15024,4408,13160,126,r3,13160,798,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=4}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=4}__embind_register_value_object_field(15024,4264,__ZTIf,278,r2,__ZTIf,370,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=8}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=8}__embind_register_value_object_field(15024,4200,__ZTIf,278,r3,__ZTIf,370,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=12}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=12}__embind_register_value_object_field(15024,4192,__ZTIf,278,r2,__ZTIf,370,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=16}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=16}__embind_register_value_object_field(15024,4176,__ZTIf,278,r3,__ZTIf,370,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=20}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=20}__embind_register_value_object_field(15024,4120,__ZTIf,278,r2,__ZTIf,370,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=24}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=24}__embind_register_value_object_field(15024,4104,__ZTIf,278,r3,__ZTIf,370,r2);__embind_finalize_value_object(15024);__embind_register_value_object(15016,3904,176,40);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=4}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=4}__embind_register_value_object_field(15016,3752,__ZTIi,736,r2,__ZTIi,436,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=8}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=8}__embind_register_value_object_field(15016,3704,__ZTIi,736,r3,__ZTIi,436,r2);r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=12}r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=12}__embind_register_value_object_field(15016,3576,__ZTIi,736,r2,__ZTIi,436,r3);r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=16}r2=_malloc(4);if((r2|0)!=0){HEAP32[r2>>2]=16}__embind_register_value_object_field(15016,3552,__ZTIi,736,r3,__ZTIi,436,r2);__embind_finalize_value_object(15016);__embind_register_class(15064,13328,13312,0,142,0,0,3536,140);HEAP32[r14>>2]=3;r2=r14+4|0;HEAP32[r2>>2]=13328;HEAP32[r14+8>>2]=__ZTIf;HEAP32[r14+12>>2]=__ZTIi;__embind_register_class_constructor(15064,3,r2,628,346);HEAP32[r13>>2]=6;r2=r13+4|0;HEAP32[r2>>2]=13152;HEAP32[r13+8>>2]=13328;HEAP32[r13+12>>2]=15032;HEAP32[r13+16>>2]=15024;HEAP32[r13+20>>2]=15040;HEAP32[r13+24>>2]=15016;r13=_malloc(8);if((r13|0)!=0){r14=r13;HEAP32[r14>>2]=696;HEAP32[r14+4>>2]=0}__embind_register_class_function(15064,3480,6,r2,212,r13);HEAP32[r12>>2]=2;r13=r12+4|0;HEAP32[r13>>2]=13152;HEAP32[r12+8>>2]=13328;r12=_malloc(8);if((r12|0)!=0){r2=r12;HEAP32[r2>>2]=666;HEAP32[r2+4>>2]=0}__embind_register_class_function(15064,3472,2,r13,186,r12);HEAP32[r11>>2]=4;r12=r11+4|0;HEAP32[r12>>2]=13152;HEAP32[r11+8>>2]=13328;HEAP32[r11+12>>2]=__ZTIi;HEAP32[r11+16>>2]=__ZTIj;r11=_malloc(8);if((r11|0)!=0){r13=r11;HEAP32[r13>>2]=670;HEAP32[r13+4>>2]=0}__embind_register_class_function(15064,3392,4,r12,664,r11);HEAP32[r10>>2]=2;r11=r10+4|0;HEAP32[r11>>2]=15032;HEAP32[r10+8>>2]=13312;r10=_malloc(8);if((r10|0)!=0){r12=r10;HEAP32[r12>>2]=338;HEAP32[r12+4>>2]=0}__embind_register_class_function(15064,3104,2,r11,450,r10);HEAP32[r9>>2]=2;r10=r9+4|0;HEAP32[r10>>2]=15024;HEAP32[r9+8>>2]=13312;r9=_malloc(8);if((r9|0)!=0){r11=r9;HEAP32[r11>>2]=850;HEAP32[r11+4>>2]=0}__embind_register_class_function(15064,3e3,2,r10,66,r9);HEAP32[r8>>2]=2;r9=r8+4|0;HEAP32[r9>>2]=15040;HEAP32[r8+8>>2]=13312;r8=_malloc(8);if((r8|0)!=0){r10=r8;HEAP32[r10>>2]=658;HEAP32[r10+4>>2]=0}__embind_register_class_function(15064,2952,2,r9,558,r8);HEAP32[r7>>2]=2;r8=r7+4|0;HEAP32[r8>>2]=15016;HEAP32[r7+8>>2]=13312;r7=_malloc(8);if((r7|0)==0){__embind_register_class_function(15064,2888,2,r8,380,r7);STACKTOP=r1;return}r9=r7;HEAP32[r9>>2]=76;HEAP32[r9+4>>2]=0;__embind_register_class_function(15064,2888,2,r8,380,r7);STACKTOP=r1;return}function ___getTypeName(r1){return _strdup(HEAP32[r1+4>>2])}function __GLOBAL__I_a111(){__embind_register_void(13152,448);__embind_register_bool(13160,4480,1,0);__embind_register_integer(__ZTIc,3600,-128,127);__embind_register_integer(__ZTIa,2848,-128,127);__embind_register_integer(__ZTIh,2448,0,255);__embind_register_integer(__ZTIs,1640,-32768,32767);__embind_register_integer(__ZTIt,1296,0,65535);__embind_register_integer(__ZTIi,1256,-2147483648,2147483647);__embind_register_integer(__ZTIj,1016,0,-1);__embind_register_integer(__ZTIl,512,-2147483648,2147483647);__embind_register_integer(__ZTIm,5784,0,-1);__embind_register_float(__ZTIf,5464);__embind_register_float(__ZTId,5224);__embind_register_std_string(14584,4968);__embind_register_std_wstring(14560,4,4888);__embind_register_emval(14880,4832);__embind_register_memory_view(14888,4616);return}function __ZNSt3__18ios_base4InitD2Ev(r1){__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(18656);__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(18744);__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(18288);__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(18376);return}function __ZNSt3__111__stdoutbufIwED1Ev(r1){var r2;HEAP32[r1>>2]=8272;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__111__stdoutbufIwED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=8272;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__111__stdoutbufIwE5imbueERKNS_6localeE(r1,r2){var r3;FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1);r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],18248);r2=r3;HEAP32[r1+36>>2]=r2;HEAP8[r1+44|0]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+28>>2]](r2)&1;return}function __ZNSt3__111__stdoutbufIwE4syncEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=r1+36|0;r7=r1+40|0;r8=r4|0;r9=r4+8|0;r10=r4;r4=r1+32|0;while(1){r1=HEAP32[r6>>2];r11=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+20>>2]](r1,HEAP32[r7>>2],r8,r9,r5);r1=HEAP32[r5>>2]-r10|0;if((_fwrite(r8,1,r1,HEAP32[r4>>2])|0)!=(r1|0)){r12=-1;r2=3161;break}if((r11|0)==2){r12=-1;r2=3162;break}else if((r11|0)!=1){r2=3159;break}}if(r2==3159){r12=((_fflush(HEAP32[r4>>2])|0)!=0)<<31>>31;STACKTOP=r3;return r12}else if(r2==3162){STACKTOP=r3;return r12}else if(r2==3161){STACKTOP=r3;return r12}}function __ZNSt3__111__stdoutbufIwE6xsputnEPKwi(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;if((HEAP8[r1+44|0]&1)!=0){r5=_fwrite(r2,4,r3,HEAP32[r1+32>>2]);return r5}r6=r1;if((r3|0)>0){r7=r2;r8=0}else{r5=0;return r5}while(1){if((FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+52>>2]](r1,HEAP32[r7>>2])|0)==-1){r5=r8;r4=3171;break}r2=r8+1|0;if((r2|0)<(r3|0)){r7=r7+4|0;r8=r2}else{r5=r2;r4=3170;break}}if(r4==3171){return r5}else if(r4==3170){return r5}}function __ZNSt3__111__stdoutbufIwE8overflowEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=(r2|0)==-1;L3552:do{if(!r9){HEAP32[r6>>2]=r2;if((HEAP8[r1+44|0]&1)!=0){if((_fwrite(r6,4,1,HEAP32[r1+32>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}r11=r5|0;HEAP32[r7>>2]=r11;r12=r6+4|0;r13=r1+36|0;r14=r1+40|0;r15=r5+8|0;r16=r5;r17=r1+32|0;r18=r6;while(1){r19=HEAP32[r13>>2];r20=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+12>>2]](r19,HEAP32[r14>>2],r18,r12,r8,r11,r15,r7);if((HEAP32[r8>>2]|0)==(r18|0)){r10=-1;r3=3191;break}if((r20|0)==3){r3=3180;break}r19=(r20|0)==1;if(r20>>>0>=2){r10=-1;r3=3188;break}r20=HEAP32[r7>>2]-r16|0;if((_fwrite(r11,1,r20,HEAP32[r17>>2])|0)!=(r20|0)){r10=-1;r3=3189;break}if(r19){r18=r19?HEAP32[r8>>2]:r18}else{break L3552}}if(r3==3188){STACKTOP=r4;return r10}else if(r3==3189){STACKTOP=r4;return r10}else if(r3==3180){if((_fwrite(r18,1,1,HEAP32[r17>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}else if(r3==3191){STACKTOP=r4;return r10}}}while(0);r10=r9?0:r2;STACKTOP=r4;return r10}function __ZNSt3__110__stdinbufIwED1Ev(r1){var r2;HEAP32[r1>>2]=8272;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__110__stdinbufIwED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=8272;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__110__stdinbufIwE5imbueERKNS_6localeE(r1,r2){var r3,r4,r5;r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],18248);r2=r3;r4=r1+36|0;HEAP32[r4>>2]=r2;r5=r1+44|0;HEAP32[r5>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+24>>2]](r2);r2=HEAP32[r4>>2];HEAP8[r1+53|0]=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+28>>2]](r2)&1;if((HEAP32[r5>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(472)}else{return}}function __ZNSt3__110__stdinbufIwE9underflowEv(r1){return __ZNSt3__110__stdinbufIwE9__getcharEb(r1,0)}function __ZNSt3__110__stdinbufIwE5uflowEv(r1){return __ZNSt3__110__stdinbufIwE9__getcharEb(r1,1)}function __ZNSt3__110__stdinbufIwE9pbackfailEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+24;r8=r1+52|0;r9=(HEAP8[r8]&1)!=0;if((r2|0)==-1){if(r9){r10=-1;STACKTOP=r3;return r10}r11=HEAP32[r1+48>>2];HEAP8[r8]=(r11|0)!=-1|0;r10=r11;STACKTOP=r3;return r10}r11=r1+48|0;L3596:do{if(r9){HEAP32[r6>>2]=HEAP32[r11>>2];r12=HEAP32[r1+36>>2];r13=r4|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+12>>2]](r12,HEAP32[r1+40>>2],r6,r6+4|0,r7,r13,r4+8|0,r5);if((r14|0)==3){HEAP8[r13]=HEAP32[r11>>2]&255;HEAP32[r5>>2]=r4+1}else if((r14|0)==2|(r14|0)==1){r10=-1;STACKTOP=r3;return r10}r14=r1+32|0;while(1){r12=HEAP32[r5>>2];if(r12>>>0<=r13>>>0){break L3596}r15=r12-1|0;HEAP32[r5>>2]=r15;if((_ungetc(HEAP8[r15]|0,HEAP32[r14>>2])|0)==-1){r10=-1;break}}STACKTOP=r3;return r10}}while(0);HEAP32[r11>>2]=r2;HEAP8[r8]=1;r10=r2;STACKTOP=r3;return r10}function __ZNSt3__110__stdinbufIwE9__getcharEb(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r1+52|0;if((HEAP8[r9]&1)!=0){r10=r1+48|0;r11=HEAP32[r10>>2];if(!r2){r12=r11;STACKTOP=r4;return r12}HEAP32[r10>>2]=-1;HEAP8[r9]=0;r12=r11;STACKTOP=r4;return r12}r11=HEAP32[r1+44>>2];r9=(r11|0)>1?r11:1;L3616:do{if((r9|0)>0){r11=r1+32|0;r10=0;while(1){r13=_fgetc(HEAP32[r11>>2]);if((r13|0)==-1){r12=-1;break}HEAP8[r5+r10|0]=r13&255;r13=r10+1|0;if((r13|0)<(r9|0)){r10=r13}else{break L3616}}STACKTOP=r4;return r12}}while(0);L3623:do{if((HEAP8[r1+53|0]&1)==0){r10=r1+40|0;r11=r1+36|0;r13=r5|0;r14=r6+4|0;r15=r1+32|0;r16=r9;while(1){r17=HEAP32[r10>>2];r18=r17;r19=HEAP32[r18>>2];r20=HEAP32[r18+4>>2];r18=HEAP32[r11>>2];r21=r5+r16|0;r22=FUNCTION_TABLE[HEAP32[HEAP32[r18>>2]+16>>2]](r18,r17,r13,r21,r7,r6,r14,r8);if((r22|0)==3){r3=3236;break}else if((r22|0)==2){r12=-1;r3=3247;break}else if((r22|0)!=1){r23=r16;break L3623}r22=HEAP32[r10>>2];HEAP32[r22>>2]=r19;HEAP32[r22+4>>2]=r20;if((r16|0)==8){r12=-1;r3=3248;break}r20=_fgetc(HEAP32[r15>>2]);if((r20|0)==-1){r12=-1;r3=3251;break}HEAP8[r21]=r20&255;r16=r16+1|0}if(r3==3251){STACKTOP=r4;return r12}else if(r3==3236){HEAP32[r6>>2]=HEAP8[r13]|0;r23=r16;break}else if(r3==3247){STACKTOP=r4;return r12}else if(r3==3248){STACKTOP=r4;return r12}}else{HEAP32[r6>>2]=HEAP8[r5|0]|0;r23=r9}}while(0);if(r2){r2=HEAP32[r6>>2];HEAP32[r1+48>>2]=r2;r12=r2;STACKTOP=r4;return r12}r2=r1+32|0;r1=r23;while(1){if((r1|0)<=0){break}r23=r1-1|0;if((_ungetc(HEAP8[r5+r23|0]|0,HEAP32[r2>>2])|0)==-1){r12=-1;r3=3250;break}else{r1=r23}}if(r3==3250){STACKTOP=r4;return r12}r12=HEAP32[r6>>2];STACKTOP=r4;return r12}function __ZNSt3__111__stdoutbufIcED1Ev(r1){var r2;HEAP32[r1>>2]=8344;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__111__stdoutbufIcED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=8344;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__111__stdoutbufIcE5imbueERKNS_6localeE(r1,r2){var r3;FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1);r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],18256);r2=r3;HEAP32[r1+36>>2]=r2;HEAP8[r1+44|0]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+28>>2]](r2)&1;return}function __ZNSt3__111__stdoutbufIcE4syncEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=r1+36|0;r7=r1+40|0;r8=r4|0;r9=r4+8|0;r10=r4;r4=r1+32|0;while(1){r1=HEAP32[r6>>2];r11=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+20>>2]](r1,HEAP32[r7>>2],r8,r9,r5);r1=HEAP32[r5>>2]-r10|0;if((_fwrite(r8,1,r1,HEAP32[r4>>2])|0)!=(r1|0)){r12=-1;r2=3272;break}if((r11|0)==2){r12=-1;r2=3271;break}else if((r11|0)!=1){r2=3268;break}}if(r2==3271){STACKTOP=r3;return r12}else if(r2==3268){r12=((_fflush(HEAP32[r4>>2])|0)!=0)<<31>>31;STACKTOP=r3;return r12}else if(r2==3272){STACKTOP=r3;return r12}}function __ZNSt3__111__stdoutbufIcE6xsputnEPKci(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;if((HEAP8[r1+44|0]&1)!=0){r5=_fwrite(r2,1,r3,HEAP32[r1+32>>2]);return r5}r6=r1;if((r3|0)>0){r7=r2;r8=0}else{r5=0;return r5}while(1){if((FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+52>>2]](r1,HEAPU8[r7])|0)==-1){r5=r8;r4=3281;break}r2=r8+1|0;if((r2|0)<(r3|0)){r7=r7+1|0;r8=r2}else{r5=r2;r4=3282;break}}if(r4==3281){return r5}else if(r4==3282){return r5}}function __ZNSt3__111__stdoutbufIcE8overflowEi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=(r2|0)==-1;L3682:do{if(!r9){HEAP8[r6]=r2&255;if((HEAP8[r1+44|0]&1)!=0){if((_fwrite(r6,1,1,HEAP32[r1+32>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}r11=r5|0;HEAP32[r7>>2]=r11;r12=r6+1|0;r13=r1+36|0;r14=r1+40|0;r15=r5+8|0;r16=r5;r17=r1+32|0;r18=r6;while(1){r19=HEAP32[r13>>2];r20=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+12>>2]](r19,HEAP32[r14>>2],r18,r12,r8,r11,r15,r7);if((HEAP32[r8>>2]|0)==(r18|0)){r10=-1;r3=3296;break}if((r20|0)==3){r3=3289;break}r19=(r20|0)==1;if(r20>>>0>=2){r10=-1;r3=3298;break}r20=HEAP32[r7>>2]-r16|0;if((_fwrite(r11,1,r20,HEAP32[r17>>2])|0)!=(r20|0)){r10=-1;r3=3300;break}if(r19){r18=r19?HEAP32[r8>>2]:r18}else{break L3682}}if(r3==3289){if((_fwrite(r18,1,1,HEAP32[r17>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}else if(r3==3298){STACKTOP=r4;return r10}else if(r3==3296){STACKTOP=r4;return r10}else if(r3==3300){STACKTOP=r4;return r10}}}while(0);r10=r9?0:r2;STACKTOP=r4;return r10}function __ZNSt3__110__stdinbufIcED1Ev(r1){var r2;HEAP32[r1>>2]=8344;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__110__stdinbufIcED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=8344;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__110__stdinbufIcE5imbueERKNS_6localeE(r1,r2){var r3,r4,r5;r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],18256);r2=r3;r4=r1+36|0;HEAP32[r4>>2]=r2;r5=r1+44|0;HEAP32[r5>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+24>>2]](r2);r2=HEAP32[r4>>2];HEAP8[r1+53|0]=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+28>>2]](r2)&1;if((HEAP32[r5>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(472)}else{return}}function __ZNSt3__110__stdinbufIcE9underflowEv(r1){return __ZNSt3__110__stdinbufIcE9__getcharEb(r1,0)}function __ZNSt3__110__stdinbufIcE5uflowEv(r1){return __ZNSt3__110__stdinbufIcE9__getcharEb(r1,1)}function __ZNSt3__110__stdinbufIcE9pbackfailEi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+24;r8=r1+52|0;r9=(HEAP8[r8]&1)!=0;if((r2|0)==-1){if(r9){r10=-1;STACKTOP=r3;return r10}r11=HEAP32[r1+48>>2];HEAP8[r8]=(r11|0)!=-1|0;r10=r11;STACKTOP=r3;return r10}r11=r1+48|0;L3726:do{if(r9){HEAP8[r6]=HEAP32[r11>>2]&255;r12=HEAP32[r1+36>>2];r13=r4|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+12>>2]](r12,HEAP32[r1+40>>2],r6,r6+1|0,r7,r13,r4+8|0,r5);if((r14|0)==3){HEAP8[r13]=HEAP32[r11>>2]&255;HEAP32[r5>>2]=r4+1}else if((r14|0)==2|(r14|0)==1){r10=-1;STACKTOP=r3;return r10}r14=r1+32|0;while(1){r12=HEAP32[r5>>2];if(r12>>>0<=r13>>>0){break L3726}r15=r12-1|0;HEAP32[r5>>2]=r15;if((_ungetc(HEAP8[r15]|0,HEAP32[r14>>2])|0)==-1){r10=-1;break}}STACKTOP=r3;return r10}}while(0);HEAP32[r11>>2]=r2;HEAP8[r8]=1;r10=r2;STACKTOP=r3;return r10}function __ZNSt3__110__stdinbufIcE9__getcharEb(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r1+52|0;if((HEAP8[r9]&1)!=0){r10=r1+48|0;r11=HEAP32[r10>>2];if(!r2){r12=r11;STACKTOP=r4;return r12}HEAP32[r10>>2]=-1;HEAP8[r9]=0;r12=r11;STACKTOP=r4;return r12}r11=HEAP32[r1+44>>2];r9=(r11|0)>1?r11:1;L3746:do{if((r9|0)>0){r11=r1+32|0;r10=0;while(1){r13=_fgetc(HEAP32[r11>>2]);if((r13|0)==-1){r12=-1;break}HEAP8[r5+r10|0]=r13&255;r13=r10+1|0;if((r13|0)<(r9|0)){r10=r13}else{break L3746}}STACKTOP=r4;return r12}}while(0);L3753:do{if((HEAP8[r1+53|0]&1)==0){r10=r1+40|0;r11=r1+36|0;r13=r5|0;r14=r6+1|0;r15=r1+32|0;r16=r9;while(1){r17=HEAP32[r10>>2];r18=r17;r19=HEAP32[r18>>2];r20=HEAP32[r18+4>>2];r18=HEAP32[r11>>2];r21=r5+r16|0;r22=FUNCTION_TABLE[HEAP32[HEAP32[r18>>2]+16>>2]](r18,r17,r13,r21,r7,r6,r14,r8);if((r22|0)==2){r12=-1;r3=3357;break}else if((r22|0)==3){r3=3345;break}else if((r22|0)!=1){r23=r16;break L3753}r22=HEAP32[r10>>2];HEAP32[r22>>2]=r19;HEAP32[r22+4>>2]=r20;if((r16|0)==8){r12=-1;r3=3361;break}r20=_fgetc(HEAP32[r15>>2]);if((r20|0)==-1){r12=-1;r3=3362;break}HEAP8[r21]=r20&255;r16=r16+1|0}if(r3==3362){STACKTOP=r4;return r12}else if(r3==3357){STACKTOP=r4;return r12}else if(r3==3345){HEAP8[r6]=HEAP8[r13];r23=r16;break}else if(r3==3361){STACKTOP=r4;return r12}}else{HEAP8[r6]=HEAP8[r5|0];r23=r9}}while(0);do{if(r2){r9=HEAP8[r6];HEAP32[r1+48>>2]=r9&255;r24=r9}else{r9=r1+32|0;r8=r23;while(1){if((r8|0)<=0){r3=3352;break}r7=r8-1|0;if((_ungetc(HEAPU8[r5+r7|0],HEAP32[r9>>2])|0)==-1){r12=-1;r3=3358;break}else{r8=r7}}if(r3==3358){STACKTOP=r4;return r12}else if(r3==3352){r24=HEAP8[r6];break}}}while(0);r12=r24&255;STACKTOP=r4;return r12}function __GLOBAL__I_a183(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r1=HEAP32[_stdin>>2];HEAP32[17928>>2]=8344;__ZNSt3__16localeC2Ev(17932);HEAP32[17936>>2]=0;HEAP32[17940>>2]=0;HEAP32[17944>>2]=0;HEAP32[17948>>2]=0;HEAP32[17952>>2]=0;HEAP32[17956>>2]=0;HEAP32[17928>>2]=9112;HEAP32[17960>>2]=r1;HEAP32[17968>>2]=18056;HEAP32[17976>>2]=-1;HEAP8[17980]=0;r2=HEAP32[17932>>2];r3=r2+4|0;tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+1,tempValue;r4=__ZNKSt3__16locale9use_facetERNS0_2idE(r2,18256);r5=r4;HEAP32[17964>>2]=r5;HEAP32[17972>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+24>>2]](r5);r5=HEAP32[17964>>2];HEAP8[17981]=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+28>>2]](r5)&1;if((HEAP32[17972>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(472)}if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0)}HEAP32[18920>>2]=8564;HEAP32[18928>>2]=8584;HEAP32[18924>>2]=0;HEAP32[18952>>2]=17928;HEAP32[18944>>2]=0;HEAP32[18948>>2]=0;HEAP32[18932>>2]=4098;HEAP32[18940>>2]=0;HEAP32[18936>>2]=6;_memset(18960,0,40);__ZNSt3__16localeC2Ev(18956);HEAP32[19e3>>2]=0;HEAP32[19004>>2]=-1;r2=HEAP32[_stdout>>2];HEAP32[17832>>2]=8344;__ZNSt3__16localeC2Ev(17836);HEAP32[17840>>2]=0;HEAP32[17844>>2]=0;HEAP32[17848>>2]=0;HEAP32[17852>>2]=0;HEAP32[17856>>2]=0;HEAP32[17860>>2]=0;HEAP32[17832>>2]=8712;HEAP32[17864>>2]=r2;r3=HEAP32[17836>>2];r5=r3+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;r4=__ZNKSt3__16locale9use_facetERNS0_2idE(r3,18256);r6=r4;if(((tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+8>>2]](r3|0)}HEAP32[17868>>2]=r6;HEAP32[17872>>2]=18064;HEAP8[17876]=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+28>>2]](r6)&1;HEAP32[18656>>2]=8468;HEAP32[18660>>2]=8488;HEAP32[18684>>2]=17832;HEAP32[18676>>2]=0;HEAP32[18680>>2]=0;HEAP32[18664>>2]=4098;HEAP32[18672>>2]=0;HEAP32[18668>>2]=6;_memset(18692,0,40);__ZNSt3__16localeC2Ev(18688);HEAP32[18732>>2]=0;HEAP32[18736>>2]=-1;r6=HEAP32[_stderr>>2];HEAP32[17880>>2]=8344;__ZNSt3__16localeC2Ev(17884);HEAP32[17888>>2]=0;HEAP32[17892>>2]=0;HEAP32[17896>>2]=0;HEAP32[17900>>2]=0;HEAP32[17904>>2]=0;HEAP32[17908>>2]=0;HEAP32[17880>>2]=8712;HEAP32[17912>>2]=r6;r4=HEAP32[17884>>2];r3=r4+4|0;tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+1,tempValue;r5=__ZNKSt3__16locale9use_facetERNS0_2idE(r4,18256);r7=r5;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+8>>2]](r4|0)}HEAP32[17916>>2]=r7;HEAP32[17920>>2]=18072;HEAP8[17924]=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+28>>2]](r7)&1;HEAP32[18832>>2]=8468;HEAP32[18836>>2]=8488;HEAP32[18860>>2]=17880;HEAP32[18852>>2]=0;HEAP32[18856>>2]=0;HEAP32[18840>>2]=4098;HEAP32[18848>>2]=0;HEAP32[18844>>2]=6;_memset(18868,0,40);__ZNSt3__16localeC2Ev(18864);HEAP32[18908>>2]=0;HEAP32[18912>>2]=-1;r7=HEAP32[HEAP32[HEAP32[18832>>2]-12>>2]+18856>>2];HEAP32[18744>>2]=8468;HEAP32[18748>>2]=8488;HEAP32[18772>>2]=r7;HEAP32[18764>>2]=(r7|0)==0;HEAP32[18768>>2]=0;HEAP32[18752>>2]=4098;HEAP32[18760>>2]=0;HEAP32[18756>>2]=6;_memset(18780,0,40);__ZNSt3__16localeC2Ev(18776);HEAP32[18820>>2]=0;HEAP32[18824>>2]=-1;HEAP32[HEAP32[HEAP32[18920>>2]-12>>2]+18992>>2]=18656;r7=HEAP32[HEAP32[18832>>2]-12>>2]+18836|0;HEAP32[r7>>2]=HEAP32[r7>>2]|8192;HEAP32[HEAP32[HEAP32[18832>>2]-12>>2]+18904>>2]=18656;HEAP32[17776>>2]=8272;__ZNSt3__16localeC2Ev(17780);HEAP32[17784>>2]=0;HEAP32[17788>>2]=0;HEAP32[17792>>2]=0;HEAP32[17796>>2]=0;HEAP32[17800>>2]=0;HEAP32[17804>>2]=0;HEAP32[17776>>2]=9040;HEAP32[17808>>2]=r1;HEAP32[17816>>2]=18080;HEAP32[17824>>2]=-1;HEAP8[17828]=0;r1=HEAP32[17780>>2];r7=r1+4|0;tempValue=HEAP32[r7>>2],HEAP32[r7>>2]=tempValue+1,tempValue;r5=__ZNKSt3__16locale9use_facetERNS0_2idE(r1,18248);r4=r5;HEAP32[17812>>2]=r4;HEAP32[17820>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+24>>2]](r4);r4=HEAP32[17812>>2];HEAP8[17829]=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+28>>2]](r4)&1;if((HEAP32[17820>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(472)}if(((tempValue=HEAP32[r7>>2],HEAP32[r7>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+8>>2]](r1|0)}HEAP32[18568>>2]=8516;HEAP32[18576>>2]=8536;HEAP32[18572>>2]=0;HEAP32[18600>>2]=17776;HEAP32[18592>>2]=0;HEAP32[18596>>2]=0;HEAP32[18580>>2]=4098;HEAP32[18588>>2]=0;HEAP32[18584>>2]=6;_memset(18608,0,40);__ZNSt3__16localeC2Ev(18604);HEAP32[18648>>2]=0;HEAP32[18652>>2]=-1;HEAP32[17680>>2]=8272;__ZNSt3__16localeC2Ev(17684);HEAP32[17688>>2]=0;HEAP32[17692>>2]=0;HEAP32[17696>>2]=0;HEAP32[17700>>2]=0;HEAP32[17704>>2]=0;HEAP32[17708>>2]=0;HEAP32[17680>>2]=8640;HEAP32[17712>>2]=r2;r2=HEAP32[17684>>2];r1=r2+4|0;tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+1,tempValue;r7=__ZNKSt3__16locale9use_facetERNS0_2idE(r2,18248);r4=r7;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0)}HEAP32[17716>>2]=r4;HEAP32[17720>>2]=18088;HEAP8[17724]=FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+28>>2]](r4)&1;HEAP32[18288>>2]=8420;HEAP32[18292>>2]=8440;HEAP32[18316>>2]=17680;HEAP32[18308>>2]=0;HEAP32[18312>>2]=0;HEAP32[18296>>2]=4098;HEAP32[18304>>2]=0;HEAP32[18300>>2]=6;_memset(18324,0,40);__ZNSt3__16localeC2Ev(18320);HEAP32[18364>>2]=0;HEAP32[18368>>2]=-1;HEAP32[17728>>2]=8272;__ZNSt3__16localeC2Ev(17732);HEAP32[17736>>2]=0;HEAP32[17740>>2]=0;HEAP32[17744>>2]=0;HEAP32[17748>>2]=0;HEAP32[17752>>2]=0;HEAP32[17756>>2]=0;HEAP32[17728>>2]=8640;HEAP32[17760>>2]=r6;r6=HEAP32[17732>>2];r4=r6+4|0;tempValue=HEAP32[r4>>2],HEAP32[r4>>2]=tempValue+1,tempValue;r7=__ZNKSt3__16locale9use_facetERNS0_2idE(r6,18248);r2=r7;if(((tempValue=HEAP32[r4>>2],HEAP32[r4>>2]=tempValue+ -1,tempValue)|0)!=0){HEAP32[17764>>2]=r2;HEAP32[17768>>2]=18096;r8=r7;r9=HEAP32[r8>>2];r10=r9+28|0;r11=HEAP32[r10>>2];r12=FUNCTION_TABLE[r11](r2);r13=r12&1;HEAP8[17772]=r13;HEAP32[18464>>2]=8420;HEAP32[18468>>2]=8440;HEAP32[18492>>2]=17728;HEAP32[18484>>2]=0;HEAP32[18488>>2]=0;HEAP32[18472>>2]=4098;HEAP32[18480>>2]=0;HEAP32[18476>>2]=6;_memset(18500,0,40);__ZNSt3__16localeC2Ev(18496);HEAP32[18540>>2]=0;HEAP32[18544>>2]=-1;r14=HEAP32[18464>>2];r15=r14-12|0;r16=r15;r17=HEAP32[r16>>2];r18=r17+24|0;r19=r18+18464|0;r20=r19;r21=HEAP32[r20>>2];HEAP32[18376>>2]=8420;HEAP32[18380>>2]=8440;HEAP32[18404>>2]=r21;r22=(r21|0)==0;r23=r22&1;HEAP32[18396>>2]=r23;HEAP32[18400>>2]=0;HEAP32[18384>>2]=4098;HEAP32[18392>>2]=0;HEAP32[18388>>2]=6;_memset(18412,0,40);__ZNSt3__16localeC2Ev(18408);HEAP32[18452>>2]=0;HEAP32[18456>>2]=-1;r24=HEAP32[18568>>2];r25=r24-12|0;r26=r25;r27=HEAP32[r26>>2];r28=r27+72|0;r29=r28+18568|0;r30=r29;HEAP32[r30>>2]=18288;r31=HEAP32[18464>>2];r32=r31-12|0;r33=r32;r34=HEAP32[r33>>2];r35=r34+4|0;r36=r35+18464|0;r37=r36;r38=HEAP32[r37>>2];r39=r38|8192;HEAP32[r37>>2]=r39;r40=HEAP32[18464>>2];r41=r40-12|0;r42=r41;r43=HEAP32[r42>>2];r44=r43+72|0;r45=r44+18464|0;r46=r45;HEAP32[r46>>2]=18288;r47=_atexit(400,19008,___dso_handle);return}FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+8>>2]](r6|0);HEAP32[17764>>2]=r2;HEAP32[17768>>2]=18096;r8=r7;r9=HEAP32[r8>>2];r10=r9+28|0;r11=HEAP32[r10>>2];r12=FUNCTION_TABLE[r11](r2);r13=r12&1;HEAP8[17772]=r13;HEAP32[18464>>2]=8420;HEAP32[18468>>2]=8440;HEAP32[18492>>2]=17728;HEAP32[18484>>2]=0;HEAP32[18488>>2]=0;HEAP32[18472>>2]=4098;HEAP32[18480>>2]=0;HEAP32[18476>>2]=6;_memset(18500,0,40);__ZNSt3__16localeC2Ev(18496);HEAP32[18540>>2]=0;HEAP32[18544>>2]=-1;r14=HEAP32[18464>>2];r15=r14-12|0;r16=r15;r17=HEAP32[r16>>2];r18=r17+24|0;r19=r18+18464|0;r20=r19;r21=HEAP32[r20>>2];HEAP32[18376>>2]=8420;HEAP32[18380>>2]=8440;HEAP32[18404>>2]=r21;r22=(r21|0)==0;r23=r22&1;HEAP32[18396>>2]=r23;HEAP32[18400>>2]=0;HEAP32[18384>>2]=4098;HEAP32[18392>>2]=0;HEAP32[18388>>2]=6;_memset(18412,0,40);__ZNSt3__16localeC2Ev(18408);HEAP32[18452>>2]=0;HEAP32[18456>>2]=-1;r24=HEAP32[18568>>2];r25=r24-12|0;r26=r25;r27=HEAP32[r26>>2];r28=r27+72|0;r29=r28+18568|0;r30=r29;HEAP32[r30>>2]=18288;r31=HEAP32[18464>>2];r32=r31-12|0;r33=r32;r34=HEAP32[r33>>2];r35=r34+4|0;r36=r35+18464|0;r37=r36;r38=HEAP32[r37>>2];r39=r38|8192;HEAP32[r37>>2]=r39;r40=HEAP32[18464>>2];r41=r40-12|0;r42=r41;r43=HEAP32[r42>>2];r44=r43+72|0;r45=r44+18464|0;r46=r45;HEAP32[r46>>2]=18288;r47=_atexit(400,19008,___dso_handle);return}function __ZNSt11logic_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=6648;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNSt11logic_errorD2Ev(r1){var r2;HEAP32[r1>>2]=6648;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNKSt11logic_error4whatEv(r1){return HEAP32[r1+4>>2]}function __ZNSt13runtime_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=6552;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNSt13runtime_errorD2Ev(r1){var r2;HEAP32[r1>>2]=6552;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNKSt13runtime_error4whatEv(r1){return HEAP32[r1+4>>2]}function __ZNSt12length_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=6648;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNSt12out_of_rangeD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=6648;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNKSt3__114error_category23default_error_conditionEi(r1,r2,r3){HEAP32[r1>>2]=r3;HEAP32[r1+4>>2]=r2;return}function __ZNKSt3__114error_category10equivalentEiRKNS_15error_conditionE(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+12>>2]](r5,r1,r2);if((HEAP32[r5+4>>2]|0)!=(HEAP32[r3+4>>2]|0)){r6=0;STACKTOP=r4;return r6}r6=(HEAP32[r5>>2]|0)==(HEAP32[r3>>2]|0);STACKTOP=r4;return r6}function __ZNKSt3__114error_category10equivalentERKNS_10error_codeEi(r1,r2,r3){var r4;if((HEAP32[r2+4>>2]|0)!=(r1|0)){r4=0;return r4}r4=(HEAP32[r2>>2]|0)==(r3|0);return r4}function __ZNSt3__112system_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=6552;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)>=0){r4=r1;_free(r4);return}r3=HEAP32[r2>>2]-12|0;if((r3|0)==0){r4=r1;_free(r4);return}_free(r3);r4=r1;_free(r4);return}function __ZNSt3__112system_errorD2Ev(r1){var r2;HEAP32[r1>>2]=6552;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNSt3__111__call_onceERVmPvPFvS2_E(r1,r2){var r3,r4,r5;if((HEAP32[r1>>2]|0)==1){while(1){_pthread_cond_wait(18008,17984);if((HEAP32[r1>>2]|0)!=1){break}}}if((HEAP32[r1>>2]|0)!=0){return}HEAP32[r1>>2]=1;r3=r2+4|0;r4=HEAP32[r2>>2]+HEAP32[r3+4>>2]|0;r2=HEAP32[r3>>2];if((r2&1|0)==0){r5=r2}else{r5=HEAP32[HEAP32[r4>>2]+(r2-1)>>2]}FUNCTION_TABLE[r5](r4);HEAP32[r1>>2]=-1;_pthread_cond_broadcast(18008);return}function __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(){var r1,r2,r3,r4,r5,r6;r1=0;r2=___cxa_allocate_exception(8);HEAP32[r2>>2]=6648;r3=r2+4|0;r4=r3;if((r3|0)==0){r5=r2;HEAP32[r5>>2]=6616;___cxa_throw(r2,13248,280)}while(1){r6=_malloc(25);if((r6|0)!=0){r1=167;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){r1=161;break}FUNCTION_TABLE[r3]()}if(r1==161){r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=6488;___cxa_throw(r3,13184,74)}else if(r1==167){HEAP32[r6+4>>2]=12;HEAP32[r6>>2]=12;r1=r6+12|0;HEAP32[r4>>2]=r1;HEAP32[r6+8>>2]=0;_memcpy(r1,1032,13)|0;r5=r2;HEAP32[r5>>2]=6616;___cxa_throw(r2,13248,280)}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;if(r3>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if(r3>>>0<11){HEAP8[r1]=r3<<1&255;r5=r1+1|0;_memcpy(r5,r2,r3)|0;r6=r5+r3|0;HEAP8[r6]=0;return}r7=r3+16&-16;r8=(r7|0)==0?1:r7;while(1){r9=_malloc(r8);if((r9|0)!=0){r4=188;break}r10=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r10|0)==0){r4=185;break}FUNCTION_TABLE[r10]()}if(r4==185){r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6488;___cxa_throw(r8,13184,74)}else if(r4==188){HEAP32[r1+8>>2]=r9;HEAP32[r1>>2]=r7|1;HEAP32[r1+4>>2]=r3;r5=r9;_memcpy(r5,r2,r3)|0;r6=r5+r3|0;HEAP8[r6]=0;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED1Ev(r1){var r2;if((HEAP8[r1]&1)==0){return}r2=HEAP32[r1+8>>2];if((r2|0)==0){return}_free(r2);return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6assignEPKc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=_strlen(r2);r4=r1;r5=r1;r6=HEAP8[r5];if((r6&1)==0){r7=10;r8=r6}else{r6=HEAP32[r1>>2];r7=(r6&-2)-1|0;r8=r6&255}if(r7>>>0<r3>>>0){r6=r8&255;if((r6&1|0)==0){r9=r6>>>1}else{r9=HEAP32[r1+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r7,r3-r7|0,r9,0,r9,r3,r2);return}if((r8&1)==0){r10=r4+1|0}else{r10=HEAP32[r1+8>>2]}_memmove(r10,r2,r3,1,0);HEAP8[r10+r3|0]=0;if((HEAP8[r5]&1)==0){HEAP8[r5]=r3<<1&255;return}else{HEAP32[r1+4>>2]=r3;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=r1;r4=r1;r5=HEAP8[r4];r6=r5&255;if((r6&1|0)==0){r7=r6>>>1}else{r7=HEAP32[r1+4>>2]}if(r7>>>0>=r2>>>0){if((r5&1)==0){HEAP8[r2+(r3+1)|0]=0;HEAP8[r4]=r2<<1&255;return}else{HEAP8[HEAP32[r1+8>>2]+r2|0]=0;HEAP32[r1+4>>2]=r2;return}}r6=r2-r7|0;if((r7|0)==(r2|0)){return}if((r5&1)==0){r8=10;r9=r5}else{r5=HEAP32[r1>>2];r8=(r5&-2)-1|0;r9=r5&255}r5=r9&255;if((r5&1|0)==0){r10=r5>>>1}else{r10=HEAP32[r1+4>>2]}if((r8-r10|0)>>>0<r6>>>0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(r1,r8,r6-r8+r10|0,r10,r10,0);r11=HEAP8[r4]}else{r11=r9}if((r11&1)==0){r12=r3+1|0}else{r12=HEAP32[r1+8>>2]}_memset(r12+r10|0,0,r6);r3=r10+r6|0;if((HEAP8[r4]&1)==0){HEAP8[r4]=r3<<1&255}else{HEAP32[r1+4>>2]=r3}HEAP8[r12+r3|0]=0;return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEj(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=r1;r3=r1;r4=HEAP8[r3];if((r4&1)==0){r5=10;r6=r4}else{r4=HEAP32[r1>>2];r5=(r4&-2)-1|0;r6=r4&255}r4=r6&255;r7=(r4&1|0)==0;if(r7){r8=r4>>>1}else{r8=HEAP32[r1+4>>2]}if(r8>>>0<11){r9=11}else{r9=r8+16&-16}r10=r9-1|0;if((r10|0)==(r5|0)){return}if((r10|0)==10){r11=r2+1|0;r12=HEAP32[r1+8>>2];r13=1;r14=0}else{r15=(r9|0)==0?1:r9;L240:do{if(r10>>>0>r5>>>0){while(1){r16=_malloc(r15);if((r16|0)!=0){r17=r16;break L240}r16=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r16|0)==0){break}FUNCTION_TABLE[r16]()}r16=___cxa_allocate_exception(4);HEAP32[r16>>2]=6488;___cxa_throw(r16,13184,74)}else{while(1){r16=_malloc(r15);if((r16|0)!=0){r17=r16;break L240}r16=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r16|0)==0){break}FUNCTION_TABLE[r16]()}r16=___cxa_allocate_exception(4);HEAP32[r16>>2]=6488;___cxa_throw(r16,13184,74)}}while(0);r15=r6&1;if(r15<<24>>24==0){r18=r2+1|0}else{r18=HEAP32[r1+8>>2]}r11=r17;r12=r18;r13=r15<<24>>24!=0;r14=1}if(r7){r19=r4>>>1}else{r19=HEAP32[r1+4>>2]}r4=r19+1|0;_memcpy(r11,r12,r4)|0;if(!(r13^1|(r12|0)==0)){_free(r12)}if(r14){HEAP32[r1>>2]=r9|1;HEAP32[r1+4>>2]=r8;HEAP32[r1+8>>2]=r11;return}else{HEAP8[r3]=r8<<1&255;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=r1;r5=HEAP8[r4];if((r5&1)==0){r6=10;r7=r5}else{r5=HEAP32[r1>>2];r6=(r5&-2)-1|0;r7=r5&255}r5=r7&255;if((r5&1|0)==0){r8=r5>>>1}else{r8=HEAP32[r1+4>>2]}if((r6-r8|0)>>>0<r3>>>0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r6,r3-r6+r8|0,r8,r8,0,r3,r2);return}if((r3|0)==0){return}if((r7&1)==0){r9=r1+1|0}else{r9=HEAP32[r1+8>>2]}r7=r9+r8|0;_memcpy(r7,r2,r3)|0;r2=r8+r3|0;if((HEAP8[r4]&1)==0){HEAP8[r4]=r2<<1&255}else{HEAP32[r1+4>>2]=r2}HEAP8[r9+r2|0]=0;return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r9=0;if((-18-r2|0)>>>0<r3>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((HEAP8[r1]&1)==0){r10=r1+1|0}else{r10=HEAP32[r1+8>>2]}do{if(r2>>>0<2147483623){r11=r3+r2|0;r12=r2<<1;r13=r11>>>0<r12>>>0?r12:r11;if(r13>>>0<11){r14=11;break}r14=r13+16&-16}else{r14=-17}}while(0);r3=(r14|0)==0?1:r14;while(1){r15=_malloc(r3);if((r15|0)!=0){break}r13=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r13|0)==0){r9=327;break}FUNCTION_TABLE[r13]()}if(r9==327){r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=6488;___cxa_throw(r9,13184,74)}if((r5|0)!=0){_memcpy(r15,r10,r5)|0}if((r7|0)!=0){r9=r15+r5|0;_memcpy(r9,r8,r7)|0}r8=r4-r6|0;if((r8|0)!=(r5|0)){r4=r8-r5|0;r9=r15+(r7+r5)|0;r3=r10+(r6+r5)|0;_memcpy(r9,r3,r4)|0}if((r2|0)==10|(r10|0)==0){r16=r1+8|0;HEAP32[r16>>2]=r15;r17=r14|1;r18=r1|0;HEAP32[r18>>2]=r17;r19=r8+r7|0;r20=r1+4|0;HEAP32[r20>>2]=r19;r21=r15+r19|0;HEAP8[r21]=0;return}_free(r10);r16=r1+8|0;HEAP32[r16>>2]=r15;r17=r14|1;r18=r1|0;HEAP32[r18>>2]=r17;r19=r8+r7|0;r20=r1+4|0;HEAP32[r20>>2]=r19;r21=r15+r19|0;HEAP8[r21]=0;return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r7=0;if((-17-r2|0)>>>0<r3>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((HEAP8[r1]&1)==0){r8=r1+1|0}else{r8=HEAP32[r1+8>>2]}do{if(r2>>>0<2147483623){r9=r3+r2|0;r10=r2<<1;r11=r9>>>0<r10>>>0?r10:r9;if(r11>>>0<11){r12=11;break}r12=r11+16&-16}else{r12=-17}}while(0);r3=(r12|0)==0?1:r12;while(1){r13=_malloc(r3);if((r13|0)!=0){break}r11=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r11|0)==0){r7=357;break}FUNCTION_TABLE[r11]()}if(r7==357){r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=6488;___cxa_throw(r7,13184,74)}if((r5|0)!=0){_memcpy(r13,r8,r5)|0}if((r4|0)!=(r5|0)){r7=r4-r5|0;r4=r13+(r6+r5)|0;r6=r8+r5|0;_memcpy(r4,r6,r7)|0}if((r2|0)==10|(r8|0)==0){r14=r1+8|0;HEAP32[r14>>2]=r13;r15=r12|1;r16=r1|0;HEAP32[r16>>2]=r15;return}_free(r8);r14=r1+8|0;HEAP32[r14>>2]=r13;r15=r12|1;r16=r1|0;HEAP32[r16>>2]=r15;return}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED1Ev(r1){var r2;if((HEAP8[r1]&1)==0){return}r2=HEAP32[r1+8>>2];if((r2|0)==0){return}_free(r2);return}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6assignEPKw(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=0;r4=r2;while(1){if((HEAP32[r4>>2]|0)==0){break}else{r4=r4+4|0}}r5=r2;r6=r4-r5|0;r4=r6>>2;r7=r1;r8=HEAP8[r7];if((r8&1)==0){r9=1;r10=r8}else{r8=HEAP32[r1>>2];r9=(r8&-2)-1|0;r10=r8&255}if(r9>>>0>=r4>>>0){if((r10&1)==0){r11=r1+4|0}else{r11=HEAP32[r1+8>>2]}r8=(r4|0)==0;do{if(r11-r5>>2>>>0<r4>>>0){if(r8){break}else{r12=r4}while(1){r13=r12-1|0;HEAP32[r11+(r13<<2)>>2]=HEAP32[r2+(r13<<2)>>2];if((r13|0)==0){break}else{r12=r13}}}else{if(r8){break}else{r14=r2;r15=r4;r16=r11}while(1){r13=r15-1|0;HEAP32[r16>>2]=HEAP32[r14>>2];if((r13|0)==0){break}else{r14=r14+4|0;r15=r13;r16=r16+4|0}}}}while(0);HEAP32[r11+(r4<<2)>>2]=0;if((HEAP8[r7]&1)==0){HEAP8[r7]=r6>>>1&255;return}else{HEAP32[r1+4>>2]=r4;return}}if((1073741806-r9|0)>>>0<(r4-r9|0)>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((r10&1)==0){r17=r1+4|0}else{r17=HEAP32[r1+8>>2]}do{if(r9>>>0<536870887){r10=r9<<1;r6=r4>>>0<r10>>>0?r10:r4;if(r6>>>0<2){r18=2;break}r18=r6+4&-4}else{r18=1073741807}}while(0);r6=r18<<2;r10=(r6|0)==0?1:r6;while(1){r19=_malloc(r10);if((r19|0)!=0){break}r6=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r6|0)==0){r3=408;break}FUNCTION_TABLE[r6]()}if(r3==408){r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=6488;___cxa_throw(r3,13184,74)}r3=r19;if((r4|0)!=0){r19=r2;r2=r4;r10=r3;while(1){r6=r2-1|0;HEAP32[r10>>2]=HEAP32[r19>>2];if((r6|0)==0){break}else{r19=r19+4|0;r2=r6;r10=r10+4|0}}}if(!((r9|0)==1|(r17|0)==0)){_free(r17)}HEAP32[r1+8>>2]=r3;HEAP32[r1>>2]=r18|1;HEAP32[r1+4>>2]=r4;HEAP32[r3+(r4<<2)>>2]=0;return}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE7reserveEj(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1;r3=HEAP8[r2];if((r3&1)==0){r4=1;r5=r3}else{r3=HEAP32[r1>>2];r4=(r3&-2)-1|0;r5=r3&255}r3=r5&255;r6=(r3&1|0)==0;if(r6){r7=r3>>>1}else{r7=HEAP32[r1+4>>2]}if(r7>>>0<2){r8=2}else{r8=r7+4&-4}r9=r8-1|0;if((r9|0)==(r4|0)){return}if((r9|0)==1){r10=r1+4|0;r11=HEAP32[r1+8>>2];r12=1;r13=0}else{r14=r8<<2;r15=(r14|0)==0?1:r14;L438:do{if(r9>>>0>r4>>>0){while(1){r14=_malloc(r15);if((r14|0)!=0){r16=r14;break L438}r14=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}r14=___cxa_allocate_exception(4);HEAP32[r14>>2]=6488;___cxa_throw(r14,13184,74)}else{while(1){r14=_malloc(r15);if((r14|0)!=0){r16=r14;break L438}r14=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}r14=___cxa_allocate_exception(4);HEAP32[r14>>2]=6488;___cxa_throw(r14,13184,74)}}while(0);r15=r5&1;if(r15<<24>>24==0){r17=r1+4|0}else{r17=HEAP32[r1+8>>2]}r10=r16;r11=r17;r12=r15<<24>>24!=0;r13=1}r15=r10;if(r6){r18=r3>>>1}else{r18=HEAP32[r1+4>>2]}r3=r18+1|0;if((r3|0)!=0){r18=r11;r6=r3;r3=r15;while(1){r10=r6-1|0;HEAP32[r3>>2]=HEAP32[r18>>2];if((r10|0)==0){break}else{r18=r18+4|0;r6=r10;r3=r3+4|0}}}if(!(r12^1|(r11|0)==0)){_free(r11)}if(r13){HEAP32[r1>>2]=r8|1;HEAP32[r1+4>>2]=r7;HEAP32[r1+8>>2]=r15;return}else{HEAP8[r2]=r7<<1&255;return}}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9__grow_byEjjjjjj(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r8=0;if((1073741807-r2|0)>>>0<r3>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((HEAP8[r1]&1)==0){r9=r1+4|0}else{r9=HEAP32[r1+8>>2]}do{if(r2>>>0<536870887){r10=r3+r2|0;r11=r2<<1;r12=r10>>>0<r11>>>0?r11:r10;if(r12>>>0<2){r13=2;break}r13=r12+4&-4}else{r13=1073741807}}while(0);r3=r13<<2;r12=(r3|0)==0?1:r3;while(1){r14=_malloc(r12);if((r14|0)!=0){break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){r8=487;break}FUNCTION_TABLE[r3]()}if(r8==487){r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6488;___cxa_throw(r8,13184,74)}r8=r14;if((r5|0)!=0){r14=r9;r12=r5;r3=r8;while(1){r10=r12-1|0;HEAP32[r3>>2]=HEAP32[r14>>2];if((r10|0)==0){break}else{r14=r14+4|0;r12=r10;r3=r3+4|0}}}r3=r4-r6|0;if((r3|0)!=(r5|0)){r4=r9+(r6+r5<<2)|0;r6=r3-r5|0;r3=r8+(r7+r5<<2)|0;while(1){r5=r6-1|0;HEAP32[r3>>2]=HEAP32[r4>>2];if((r5|0)==0){break}else{r4=r4+4|0;r6=r5;r3=r3+4|0}}}if((r2|0)==1|(r9|0)==0){r15=r1+8|0;HEAP32[r15>>2]=r8;r16=r13|1;r17=r1|0;HEAP32[r17>>2]=r16;return}_free(r9);r15=r1+8|0;HEAP32[r15>>2]=r8;r16=r13|1;r17=r1|0;HEAP32[r17>>2]=r16;return}function __ZNSt3__18ios_base5clearEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+16;r7=r4+32;r8=(HEAP32[r1+24>>2]|0)==0;if(r8){HEAP32[r1+16>>2]=r2|1}else{HEAP32[r1+16>>2]=r2}if(((r8&1|r2)&HEAP32[r1+20>>2]|0)==0){STACKTOP=r4;return}r4=___cxa_allocate_exception(16);do{if((HEAP8[19128]|0)==0){if((___cxa_guard_acquire(19128)|0)==0){break}HEAP32[17136>>2]=8112}}while(0);r1=r6;r2=r7;while(1){r9=_malloc(16);if((r9|0)!=0){break}r8=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r8|0)==0){r3=516;break}FUNCTION_TABLE[r8]()}if(r3==516){r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6488;___cxa_throw(r8,13184,74)}r8=r7+8|0;HEAP32[r8>>2]=r9;HEAP32[r7>>2]=17;r10=r7+4|0;HEAP32[r10>>2]=15;_memcpy(r9,4216,15)|0;HEAP8[r9+15|0]=0;r9=r5;r11=HEAPU8[r2];if((((r11&1|0)==0?r11>>>1:HEAP32[r10>>2])|0)!=0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r7,4168,2)}FUNCTION_TABLE[HEAP32[HEAP32[17136>>2]+24>>2]](r5,17136,1);r10=HEAP8[r9];if((r10&1)==0){r12=r5+1|0}else{r12=HEAP32[r5+8>>2]}r11=r10&255;if((r11&1|0)==0){r13=r11>>>1}else{r13=HEAP32[r5+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r7,r12,r13);do{if((HEAP8[r9]&1)!=0){r13=HEAP32[r5+8>>2];if((r13|0)==0){break}_free(r13)}}while(0);HEAP32[r1>>2]=HEAP32[r2>>2];HEAP32[r1+4>>2]=HEAP32[r2+4>>2];HEAP32[r1+8>>2]=HEAP32[r2+8>>2];HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;r5=r4;HEAP32[r5>>2]=6552;r9=r4+4|0;r13=r9;do{if((r9|0)!=0){if((HEAP8[r1]&1)==0){r14=r6+1|0}else{r14=HEAP32[r6+8>>2]}r12=_strlen(r14);r7=r12+1|0;r11=r12+13|0;r10=(r11|0)==0?1:r11;while(1){r15=_malloc(r10);if((r15|0)!=0){r3=549;break}r11=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r3==549){HEAP32[r15+4>>2]=r12;HEAP32[r15>>2]=r12;r10=r15+12|0;HEAP32[r13>>2]=r10;HEAP32[r15+8>>2]=0;_memcpy(r10,r14,r7)|0;break}r10=___cxa_allocate_exception(4);HEAP32[r10>>2]=6488;___cxa_throw(r10,13184,74)}}while(0);do{if((HEAP8[r1]&1)!=0){r14=HEAP32[r6+8>>2];if((r14|0)==0){break}_free(r14)}}while(0);do{if((HEAP8[r2]&1)!=0){r6=HEAP32[r8>>2];if((r6|0)==0){break}_free(r6)}}while(0);HEAP32[r5>>2]=8608;r8=r4+8|0;r2=_bitshift64Shl(17136,0,32);HEAP32[r8>>2]=r2&0|1;HEAP32[r8+4>>2]=tempRet0&-1;HEAP32[r5>>2]=7296;___cxa_throw(r4,13856,70)}function __ZNSt3__18ios_baseD2Ev(r1){var r2,r3,r4,r5;HEAP32[r1>>2]=7272;r2=HEAP32[r1+40>>2];r3=r1+32|0;r4=r1+36|0;if((r2|0)!=0){r5=r2;while(1){r2=r5-1|0;FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+(r2<<2)>>2]](0,r1,HEAP32[HEAP32[r4>>2]+(r2<<2)>>2]);if((r2|0)==0){break}else{r5=r2}}}r5=HEAP32[r1+28>>2];r2=r5+4|0;if(((tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}_free(HEAP32[r3>>2]);_free(HEAP32[r4>>2]);_free(HEAP32[r1+48>>2]);_free(HEAP32[r1+60>>2]);return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=8344;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED1Ev(r1){var r2;HEAP32[r1>>2]=8344;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5imbueERKNS_6localeE(r1,r2){return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6setbufEPci(r1,r2,r3){return r1}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekoffExNS_8ios_base7seekdirEj(r1,r2,r3,r4,r5,r6){r6=r1;HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=0;r6=r1+8|0;HEAP32[r6>>2]=-1;HEAP32[r6+4>>2]=-1;return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekposENS_4fposI11__mbstate_tEEj(r1,r2,r3,r4){r4=STACKTOP;r2=r3;r3=STACKTOP;STACKTOP=STACKTOP+16|0;HEAP32[r3>>2]=HEAP32[r2>>2];HEAP32[r3+4>>2]=HEAP32[r2+4>>2];HEAP32[r3+8>>2]=HEAP32[r2+8>>2];HEAP32[r3+12>>2]=HEAP32[r2+12>>2];r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;r2=r1+8|0;HEAP32[r2>>2]=-1;HEAP32[r2+4>>2]=-1;STACKTOP=r4;return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE4syncEv(r1){return 0}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9showmanycEv(r1){return 0}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsgetnEPci(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+12|0;r8=r1+16|0;r9=r2;r2=0;while(1){r10=HEAP32[r7>>2];if(r10>>>0<HEAP32[r8>>2]>>>0){HEAP32[r7>>2]=r10+1;r11=HEAP8[r10]}else{r10=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+40>>2]](r1);if((r10|0)==-1){r6=r2;r4=606;break}r11=r10&255}HEAP8[r9]=r11;r10=r2+1|0;if((r10|0)<(r3|0)){r9=r9+1|0;r2=r10}else{r6=r10;r4=605;break}}if(r4==605){return r6}else if(r4==606){return r6}}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9underflowEv(r1){return-1}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5uflowEv(r1){var r2,r3;if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)|0)==-1){r2=-1;return r2}r3=r1+12|0;r1=HEAP32[r3>>2];HEAP32[r3>>2]=r1+1;r2=HEAPU8[r1];return r2}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9pbackfailEi(r1,r2){return-1}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsputnEPKci(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+24|0;r8=r1+28|0;r9=0;r10=r2;while(1){r2=HEAP32[r7>>2];if(r2>>>0<HEAP32[r8>>2]>>>0){r11=HEAP8[r10];HEAP32[r7>>2]=r2+1;HEAP8[r2]=r11}else{if((FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+52>>2]](r1,HEAPU8[r10])|0)==-1){r6=r9;r4=622;break}}r11=r9+1|0;if((r11|0)<(r3|0)){r9=r11;r10=r10+1|0}else{r6=r11;r4=623;break}}if(r4==622){return r6}else if(r4==623){return r6}}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE8overflowEi(r1,r2){return-1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=8272;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED1Ev(r1){var r2;HEAP32[r1>>2]=8272;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5imbueERKNS_6localeE(r1,r2){return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6setbufEPwi(r1,r2,r3){return r1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekoffExNS_8ios_base7seekdirEj(r1,r2,r3,r4,r5,r6){r6=r1;HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=0;r6=r1+8|0;HEAP32[r6>>2]=-1;HEAP32[r6+4>>2]=-1;return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekposENS_4fposI11__mbstate_tEEj(r1,r2,r3,r4){r4=STACKTOP;r2=r3;r3=STACKTOP;STACKTOP=STACKTOP+16|0;HEAP32[r3>>2]=HEAP32[r2>>2];HEAP32[r3+4>>2]=HEAP32[r2+4>>2];HEAP32[r3+8>>2]=HEAP32[r2+8>>2];HEAP32[r3+12>>2]=HEAP32[r2+12>>2];r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;r2=r1+8|0;HEAP32[r2>>2]=-1;HEAP32[r2+4>>2]=-1;STACKTOP=r4;return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE4syncEv(r1){return 0}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9showmanycEv(r1){return 0}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsgetnEPwi(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+12|0;r8=r1+16|0;r9=r2;r2=0;while(1){r10=HEAP32[r7>>2];if(r10>>>0<HEAP32[r8>>2]>>>0){HEAP32[r7>>2]=r10+4;r11=HEAP32[r10>>2]}else{r10=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+40>>2]](r1);if((r10|0)==-1){r6=r2;r4=649;break}else{r11=r10}}HEAP32[r9>>2]=r11;r10=r2+1|0;if((r10|0)<(r3|0)){r9=r9+4|0;r2=r10}else{r6=r10;r4=650;break}}if(r4==649){return r6}else if(r4==650){return r6}}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9underflowEv(r1){return-1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5uflowEv(r1){var r2,r3;if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)|0)==-1){r2=-1;return r2}r3=r1+12|0;r1=HEAP32[r3>>2];HEAP32[r3>>2]=r1+4;r2=HEAP32[r1>>2];return r2}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9pbackfailEj(r1,r2){return-1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsputnEPKwi(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+24|0;r8=r1+28|0;r9=0;r10=r2;while(1){r2=HEAP32[r7>>2];if(r2>>>0<HEAP32[r8>>2]>>>0){r11=HEAP32[r10>>2];HEAP32[r7>>2]=r2+4;HEAP32[r2>>2]=r11}else{if((FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+52>>2]](r1,HEAP32[r10>>2])|0)==-1){r6=r9;r4=667;break}}r11=r9+1|0;if((r11|0)<(r3|0)){r9=r11;r10=r10+4|0}else{r6=r11;r4=666;break}}if(r4==666){return r6}else if(r4==667){return r6}}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE8overflowEj(r1,r2){return-1}function __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);return}function __ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+8)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+8)|0);return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r5=HEAP32[HEAP32[r4>>2]-12>>2];r6=r1;if((HEAP32[r6+(r5+24)>>2]|0)==0){STACKTOP=r2;return}r7=r3|0;HEAP8[r7]=0;HEAP32[r3+4>>2]=r1;do{if((HEAP32[r6+(r5+16)>>2]|0)==0){r1=HEAP32[r6+(r5+72)>>2];if((r1|0)==0){r8=r5}else{__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(r1);r8=HEAP32[HEAP32[r4>>2]-12>>2]}HEAP8[r7]=1;r1=HEAP32[r6+(r8+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1)|0)!=-1){break}r1=HEAP32[HEAP32[r4>>2]-12>>2];__ZNSt3__18ios_base5clearEj(r6+r1|0,HEAP32[r6+(r1+16)>>2]|1)}}while(0);__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE6sentryD2Ev(r3);STACKTOP=r2;return}function __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);return}function __ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+8)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+8)|0);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r5=HEAP32[HEAP32[r4>>2]-12>>2];r6=r1;if((HEAP32[r6+(r5+24)>>2]|0)==0){STACKTOP=r2;return}r7=r3|0;HEAP8[r7]=0;HEAP32[r3+4>>2]=r1;do{if((HEAP32[r6+(r5+16)>>2]|0)==0){r1=HEAP32[r6+(r5+72)>>2];if((r1|0)==0){r8=r5}else{__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(r1);r8=HEAP32[HEAP32[r4>>2]-12>>2]}HEAP8[r7]=1;r1=HEAP32[r6+(r8+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1)|0)!=-1){break}r1=HEAP32[HEAP32[r4>>2]-12>>2];__ZNSt3__18ios_base5clearEj(r6+r1|0,HEAP32[r6+(r1+16)>>2]|1)}}while(0);__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE6sentryD2Ev(r3);STACKTOP=r2;return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);return}function __ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+4)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+4)|0);return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE6sentryD2Ev(r1){var r2,r3,r4;r2=r1+4|0;r1=HEAP32[r2>>2];r3=HEAP32[HEAP32[r1>>2]-12>>2];r4=r1;if((HEAP32[r4+(r3+24)>>2]|0)==0){return}if((HEAP32[r4+(r3+16)>>2]|0)!=0){return}if((HEAP32[r4+(r3+4)>>2]&8192|0)==0){return}if(__ZSt18uncaught_exceptionv()){return}r3=HEAP32[r2>>2];r4=HEAP32[r3+(HEAP32[HEAP32[r3>>2]-12>>2]+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+24>>2]](r4)|0)!=-1){return}r4=HEAP32[r2>>2];r2=HEAP32[HEAP32[r4>>2]-12>>2];r3=r4;__ZNSt3__18ios_base5clearEj(r3+r2|0,HEAP32[r3+(r2+16)>>2]|1);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);return}function __ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+4)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+4)|0);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE6sentryD2Ev(r1){var r2,r3,r4;r2=r1+4|0;r1=HEAP32[r2>>2];r3=HEAP32[HEAP32[r1>>2]-12>>2];r4=r1;if((HEAP32[r4+(r3+24)>>2]|0)==0){return}if((HEAP32[r4+(r3+16)>>2]|0)!=0){return}if((HEAP32[r4+(r3+4)>>2]&8192|0)==0){return}if(__ZSt18uncaught_exceptionv()){return}r3=HEAP32[r2>>2];r4=HEAP32[r3+(HEAP32[HEAP32[r3>>2]-12>>2]+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+24>>2]](r4)|0)!=-1){return}r4=HEAP32[r2>>2];r2=HEAP32[HEAP32[r4>>2]-12>>2];r3=r4;__ZNSt3__18ios_base5clearEj(r3+r2|0,HEAP32[r3+(r2+16)>>2]|1);return}function __ZNKSt3__119__iostream_category4nameEv(r1){return 4936}function __ZNKSt3__119__iostream_category7messageEi(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r2=0;if((r3|0)==1){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(r1,5368,35);return}r4=_strerror(r3);r3=_strlen(r4);if(r3>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r3>>>0<11){HEAP8[r1]=r3<<1&255;r5=r1+1|0}else{r6=r3+16&-16;r7=(r6|0)==0?1:r6;while(1){r8=_malloc(r7);if((r8|0)!=0){r2=809;break}r9=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r9|0)==0){break}FUNCTION_TABLE[r9]()}if(r2==809){HEAP32[r1+8>>2]=r8;HEAP32[r1>>2]=r6|1;HEAP32[r1+4>>2]=r3;r5=r8;break}r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=6488;___cxa_throw(r7,13184,74)}}while(0);_memcpy(r5,r4,r3)|0;HEAP8[r5+r3|0]=0;return}function __ZNSt3__119__iostream_categoryD1Ev(r1){return}function __ZNSt3__18ios_base7failureD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=6552;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)>=0){r4=r1;_free(r4);return}r3=HEAP32[r2>>2]-12|0;if((r3|0)==0){r4=r1;_free(r4);return}_free(r3);r4=r1;_free(r4);return}function __ZNSt3__18ios_base7failureD2Ev(r1){var r2;HEAP32[r1>>2]=6552;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNSt3__18ios_baseD0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__119__iostream_categoryD0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17collateIcED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17collateIcED1Ev(r1){return}function __ZNSt3__16locale5facetD2Ev(r1){return}function __ZNKSt3__17collateIcE10do_compareEPKcS3_S3_S3_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r1=0;L845:do{if((r4|0)==(r5|0)){r6=r2}else{r7=r2;r8=r4;while(1){if((r7|0)==(r3|0)){r9=-1;r1=855;break}r10=HEAP8[r7];r11=HEAP8[r8];if(r10<<24>>24<r11<<24>>24){r9=-1;r1=857;break}if(r11<<24>>24<r10<<24>>24){r9=1;r1=856;break}r10=r7+1|0;r11=r8+1|0;if((r11|0)==(r5|0)){r6=r10;break L845}else{r7=r10;r8=r11}}if(r1==857){return r9}else if(r1==855){return r9}else if(r1==856){return r9}}}while(0);r9=(r6|0)!=(r3|0)|0;return r9}function __ZNKSt3__17collateIcE12do_transformEPKcS3_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r5=r3;r6=r4-r5|0;if(r6>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r6>>>0<11){HEAP8[r1]=r6<<1&255;r7=r1+1|0}else{r8=r6+16&-16;r9=(r8|0)==0?1:r8;while(1){r10=_malloc(r9);if((r10|0)!=0){r2=873;break}r11=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r2==873){HEAP32[r1+8>>2]=r10;HEAP32[r1>>2]=r8|1;HEAP32[r1+4>>2]=r6;r7=r10;break}r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=6488;___cxa_throw(r9,13184,74)}}while(0);if((r3|0)==(r4|0)){r12=r7;HEAP8[r12]=0;return}r10=r4+ -r5|0;r5=r7;r6=r3;while(1){HEAP8[r5]=HEAP8[r6];r3=r6+1|0;if((r3|0)==(r4|0)){break}else{r5=r5+1|0;r6=r3}}r12=r7+r10|0;HEAP8[r12]=0;return}function __ZNKSt3__17collateIcE7do_hashEPKcS3_(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==(r3|0)){r4=0;return r4}else{r5=r2;r6=0}while(1){r2=HEAP8[r5]+(r6<<4)|0;r1=r2&-268435456;r7=(r1>>>24|r1)^r2;r2=r5+1|0;if((r2|0)==(r3|0)){r4=r7;break}else{r5=r2;r6=r7}}return r4}function __ZNSt3__17collateIwED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17collateIwED1Ev(r1){return}function __ZNKSt3__17collateIwE10do_compareEPKwS3_S3_S3_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r1=0;L893:do{if((r4|0)==(r5|0)){r6=r2}else{r7=r2;r8=r4;while(1){if((r7|0)==(r3|0)){r9=-1;r1=902;break}r10=HEAP32[r7>>2];r11=HEAP32[r8>>2];if((r10|0)<(r11|0)){r9=-1;r1=900;break}if((r11|0)<(r10|0)){r9=1;r1=901;break}r10=r7+4|0;r11=r8+4|0;if((r11|0)==(r5|0)){r6=r10;break L893}else{r7=r10;r8=r11}}if(r1==902){return r9}else if(r1==900){return r9}else if(r1==901){return r9}}}while(0);r9=(r6|0)!=(r3|0)|0;return r9}function __ZNKSt3__17collateIwE12do_transformEPKwS3_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r5=r3;r6=r4-r5|0;r7=r6>>2;if(r7>>>0>1073741807){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r7>>>0<2){HEAP8[r1]=r6>>>1&255;r8=r1+4|0}else{r9=r7+4&-4;r10=r9<<2;r11=(r10|0)==0?1:r10;while(1){r12=_malloc(r11);if((r12|0)!=0){r2=918;break}r10=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r10|0)==0){break}FUNCTION_TABLE[r10]()}if(r2==918){r11=r12;HEAP32[r1+8>>2]=r11;HEAP32[r1>>2]=r9|1;HEAP32[r1+4>>2]=r7;r8=r11;break}r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=6488;___cxa_throw(r11,13184,74)}}while(0);if((r3|0)==(r4|0)){r13=r8;HEAP32[r13>>2]=0;return}r7=(r4-4+ -r5|0)>>>2;r5=r8;r1=r3;while(1){HEAP32[r5>>2]=HEAP32[r1>>2];r3=r1+4|0;if((r3|0)==(r4|0)){break}else{r5=r5+4|0;r1=r3}}r13=r8+(r7+1<<2)|0;HEAP32[r13>>2]=0;return}function __ZNKSt3__17collateIwE7do_hashEPKwS3_(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==(r3|0)){r4=0;return r4}else{r5=r2;r6=0}while(1){r2=HEAP32[r5>>2]+(r6<<4)|0;r1=r2&-268435456;r7=(r1>>>24|r1)^r2;r2=r5+4|0;if((r2|0)==(r3|0)){r4=r7;break}else{r5=r2;r6=r7}}return r4}function __ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev(r1){return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r8=STACKTOP;STACKTOP=STACKTOP+88|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+16;r11=r8+32;r12=r8+40;r13=r8+48;r14=r8+56;r15=r8+64;if((HEAP32[r5+4>>2]&1|0)==0){HEAP32[r11>>2]=-1;r16=HEAP32[HEAP32[r2>>2]+16>>2];r17=r3|0;HEAP32[r13>>2]=HEAP32[r17>>2];HEAP32[r14>>2]=HEAP32[r4>>2];FUNCTION_TABLE[r16](r12,r2,r13,r14,r5,r6,r11);r14=HEAP32[r12>>2];HEAP32[r17>>2]=r14;r17=HEAP32[r11>>2];if((r17|0)==0){HEAP8[r7]=0}else if((r17|0)==1){HEAP8[r7]=1}else{HEAP8[r7]=1;HEAP32[r6>>2]=4}HEAP32[r1>>2]=r14;STACKTOP=r8;return}r14=r5+28|0;r5=HEAP32[r14>>2];r17=r5+4|0;tempValue=HEAP32[r17>>2],HEAP32[r17>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r10>>2]=18560;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r10)}r10=HEAP32[18564>>2]-1|0;r17=HEAP32[r5+8>>2];do{if(HEAP32[r5+12>>2]-r17>>2>>>0>r10>>>0){r11=HEAP32[r17+(r10<<2)>>2];if((r11|0)==0){break}r12=r11;r11=r5+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}r11=HEAP32[r14>>2];r13=r11+4|0;tempValue=HEAP32[r13>>2],HEAP32[r13>>2]=tempValue+1,tempValue;if((HEAP32[18176>>2]|0)!=-1){HEAP32[r9>>2]=18176;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18176,r9)}r13=HEAP32[18180>>2]-1|0;r2=HEAP32[r11+8>>2];do{if(HEAP32[r11+12>>2]-r2>>2>>>0>r13>>>0){r16=HEAP32[r2+(r13<<2)>>2];if((r16|0)==0){break}r18=r16;r19=r11+4|0;if(((tempValue=HEAP32[r19>>2],HEAP32[r19>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+8>>2]](r11)}r19=r15|0;r20=r16;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+24>>2]](r19,r18);r16=r15+12|0;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+28>>2]](r16,r18);HEAP8[r7]=(__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,HEAP32[r4>>2],r19,r15+24|0,r12,r6,1)|0)==(r19|0)|0;HEAP32[r1>>2]=HEAP32[r3>>2];do{if((HEAP8[r16]&1)!=0){r19=HEAP32[r15+20>>2];if((r19|0)==0){break}_free(r19)}}while(0);if((HEAP8[r15]&1)==0){STACKTOP=r8;return}r16=HEAP32[r15+8>>2];if((r16|0)==0){STACKTOP=r8;return}_free(r16);STACKTOP=r8;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6520;___cxa_throw(r12,13200,578)}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+104|0;r10=(r4-r3|0)/12&-1;r11=r9|0;do{if(r10>>>0>100){r12=_malloc(r10);if((r12|0)!=0){r13=r12;r14=r12;break}r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6488;___cxa_throw(r12,13184,74)}else{r13=r11;r14=0}}while(0);r11=(r3|0)==(r4|0);if(r11){r15=r10;r16=0}else{r12=r10;r10=0;r17=r13;r18=r3;while(1){r19=HEAPU8[r18];if((r19&1|0)==0){r20=r19>>>1}else{r20=HEAP32[r18+4>>2]}if((r20|0)==0){HEAP8[r17]=2;r21=r10+1|0;r22=r12-1|0}else{HEAP8[r17]=1;r21=r10;r22=r12}r19=r18+12|0;if((r19|0)==(r4|0)){r15=r22;r16=r21;break}else{r12=r22;r10=r21;r17=r17+1|0;r18=r19}}}r18=r1|0;r1=r5;r17=0;r21=r16;r16=r15;r15=r2;L1004:while(1){r2=HEAP32[r18>>2];do{if((r2|0)==0){r23=0}else{if((HEAP32[r2+12>>2]|0)!=(HEAP32[r2+16>>2]|0)){r23=r2;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+36>>2]](r2)|0)==-1){HEAP32[r18>>2]=0;r23=0;break}else{r23=HEAP32[r18>>2];break}}}while(0);r2=(r23|0)==0;if((r15|0)==0){r24=r23;r25=0}else{if((HEAP32[r15+12>>2]|0)==(HEAP32[r15+16>>2]|0)){r10=(FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+36>>2]](r15)|0)==-1;r26=r10?0:r15}else{r26=r15}r24=HEAP32[r18>>2];r25=r26}r27=(r25|0)==0;if(!((r2^r27)&(r16|0)!=0)){break}r2=HEAP32[r24+12>>2];if((r2|0)==(HEAP32[r24+16>>2]|0)){r28=FUNCTION_TABLE[HEAP32[HEAP32[r24>>2]+36>>2]](r24)&255}else{r28=HEAP8[r2]}if(r7){r29=r28}else{r29=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+12>>2]](r5,r28)}r2=r17+1|0;if(r11){r17=r2;r21=r21;r16=r16;r15=r25;continue}L1031:do{if(r7){r10=r16;r22=r21;r12=r13;r20=0;r19=r3;while(1){do{if((HEAP8[r12]|0)==1){r30=HEAP8[r19];if((r30&1)==0){r31=r19+1|0}else{r31=HEAP32[r19+8>>2]}if(r29<<24>>24!=(HEAP8[r31+r17|0]|0)){HEAP8[r12]=0;r32=r20;r33=r22;r34=r10-1|0;break}r35=r30&255;if((r35&1|0)==0){r36=r35>>>1}else{r36=HEAP32[r19+4>>2]}if((r36|0)!=(r2|0)){r32=1;r33=r22;r34=r10;break}HEAP8[r12]=2;r32=1;r33=r22+1|0;r34=r10-1|0}else{r32=r20;r33=r22;r34=r10}}while(0);r35=r19+12|0;if((r35|0)==(r4|0)){r37=r34;r38=r33;r39=r32;break L1031}r10=r34;r22=r33;r12=r12+1|0;r20=r32;r19=r35}}else{r19=r16;r20=r21;r12=r13;r22=0;r10=r3;while(1){do{if((HEAP8[r12]|0)==1){r35=r10;if((HEAP8[r35]&1)==0){r40=r10+1|0}else{r40=HEAP32[r10+8>>2]}if(r29<<24>>24!=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+12>>2]](r5,HEAP8[r40+r17|0])<<24>>24){HEAP8[r12]=0;r41=r22;r42=r20;r43=r19-1|0;break}r30=HEAPU8[r35];if((r30&1|0)==0){r44=r30>>>1}else{r44=HEAP32[r10+4>>2]}if((r44|0)!=(r2|0)){r41=1;r42=r20;r43=r19;break}HEAP8[r12]=2;r41=1;r42=r20+1|0;r43=r19-1|0}else{r41=r22;r42=r20;r43=r19}}while(0);r30=r10+12|0;if((r30|0)==(r4|0)){r37=r43;r38=r42;r39=r41;break L1031}r19=r43;r20=r42;r12=r12+1|0;r22=r41;r10=r30}}}while(0);if(!r39){r17=r2;r21=r38;r16=r37;r15=r25;continue}r10=HEAP32[r18>>2];r22=r10+12|0;r12=HEAP32[r22>>2];if((r12|0)==(HEAP32[r10+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+40>>2]](r10)}else{HEAP32[r22>>2]=r12+1}if((r38+r37|0)>>>0<2){r17=r2;r21=r38;r16=r37;r15=r25;continue}else{r45=r38;r46=r13;r47=r3}while(1){do{if((HEAP8[r46]|0)==2){r12=HEAPU8[r47];if((r12&1|0)==0){r48=r12>>>1}else{r48=HEAP32[r47+4>>2]}if((r48|0)==(r2|0)){r49=r45;break}HEAP8[r46]=0;r49=r45-1|0}else{r49=r45}}while(0);r12=r47+12|0;if((r12|0)==(r4|0)){r17=r2;r21=r49;r16=r37;r15=r25;continue L1004}else{r45=r49;r46=r46+1|0;r47=r12}}}do{if((r24|0)==0){r50=0}else{if((HEAP32[r24+12>>2]|0)!=(HEAP32[r24+16>>2]|0)){r50=r24;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r24>>2]+36>>2]](r24)|0)==-1){HEAP32[r18>>2]=0;r50=0;break}else{r50=HEAP32[r18>>2];break}}}while(0);r18=(r50|0)==0;do{if(r27){r8=1079}else{if((HEAP32[r25+12>>2]|0)!=(HEAP32[r25+16>>2]|0)){if(r18){break}else{r8=1081;break}}if((FUNCTION_TABLE[HEAP32[HEAP32[r25>>2]+36>>2]](r25)|0)==-1){r8=1079;break}if(!r18){r8=1081}}}while(0);if(r8==1079){if(r18){r8=1081}}if(r8==1081){HEAP32[r6>>2]=HEAP32[r6>>2]|2}L1106:do{if(r11){r8=1086}else{r18=r3;r25=r13;while(1){if((HEAP8[r25]|0)==2){r51=r18;break L1106}r27=r18+12|0;if((r27|0)==(r4|0)){r8=1086;break L1106}r18=r27;r25=r25+1|0}}}while(0);if(r8==1086){HEAP32[r6>>2]=HEAP32[r6>>2]|4;r51=r4}if((r14|0)==0){STACKTOP=r9;return r51}_free(r14);STACKTOP=r9;return r51}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRl(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L1129:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=1111}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L1129}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=1111;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L1129}}}while(0);if(r2==1111){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP32[r7>>2]=__ZNSt3__125__num_get_signed_integralIlEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=1153}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=1153;break}}if(!(r26^(r31|0)==0)){r2=1155}}}while(0);if(r2==1153){if(r26){r2=1155}}if(r2==1155){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRx(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L1214:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=1184}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L1214}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=1184;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L1214}}}while(0);if(r2==1184){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);r15=__ZNSt3__125__num_get_signed_integralIxEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);HEAP32[r7>>2]=r15;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=1226}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=1226;break}}if(!(r26^(r31|0)==0)){r2=1228}}}while(0);if(r2==1226){if(r26){r2=1228}}if(r2==1228){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRt(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L1299:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=1257}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L1299}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=1257;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L1299}}}while(0);if(r2==1257){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP16[r7>>1]=__ZNSt3__127__num_get_unsigned_integralItEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=1299}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=1299;break}}if(!(r26^(r31|0)==0)){r2=1301}}}while(0);if(r2==1299){if(r26){r2=1301}}if(r2==1301){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L1384:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=1330}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L1384}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=1330;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L1384}}}while(0);if(r2==1330){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralIjEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=1372}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=1372;break}}if(!(r26^(r31|0)==0)){r2=1374}}}while(0);if(r2==1372){if(r26){r2=1374}}if(r2==1374){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L1469:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=1403}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L1469}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=1403;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L1469}}}while(0);if(r2==1403){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralImEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=1445}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=1445;break}}if(!(r26^(r31|0)==0)){r2=1447}}}while(0);if(r2==1445){if(r26){r2=1447}}if(r2==1447){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRy(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L1554:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=1476}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L1554}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=1476;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L1554}}}while(0);if(r2==1476){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);r15=__ZNSt3__127__num_get_unsigned_integralIyEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);HEAP32[r7>>2]=r15;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=1518}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=1518;break}}if(!(r26^(r31|0)==0)){r2=1520}}}while(0);if(r2==1518){if(r26){r2=1520}}if(r2==1520){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRf(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+280|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+48;r12=r8+64;r13=r8+80;r14=r8+88;r15=r8+248;r16=r8+256;r17=r8+264;r18=r8+272;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r20=r11;r21=r12;__ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r11,r5,r4,r9,r10);HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r21]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP8[r9];r9=HEAP8[r10];r10=r23;r23=r19;r19=r3;L1634:while(1){do{if((r23|0)==0){r28=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r28=r23;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1;r28=r3?0:r23}}while(0);r29=(r28|0)==0;do{if((r19|0)==0){r2=1545}else{if((HEAP32[r19+12>>2]|0)!=(HEAP32[r19+16>>2]|0)){if(r29){r30=0;r31=r19;break}else{r32=r10;r33=r19;r34=0;break L1634}}if((FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)|0)==-1){r2=1545;break}if(r29){r30=0;r31=r19}else{r32=r10;r33=r19;r34=0;break L1634}}}while(0);if(r2==1545){r2=0;if(r29){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r21];r35=(r3&1|0)==0;r36=HEAP32[r26>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r21]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r21]&1)==0){r39=r24}else{r39=HEAP32[r25>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r28+12|0;r36=HEAP32[r3>>2];r37=r28+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)&255}else{r41=HEAP8[r36]}if((__ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r41,r17,r18,r40,r13,r27,r9,r11,r22,r15,r16,r4)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r40;r23=r28;r19=r31;continue}else{HEAP32[r3>>2]=r36+1;r10=r40;r23=r28;r19=r31;continue}}r31=HEAPU8[r20];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){if((HEAP8[r17]&1)==0){break}r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r19}}while(0);HEAPF32[r7>>2]=__ZNSt3__115__num_get_floatIfEET_PKcS3_Rj(r32,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);do{if(r29){r43=0}else{if((HEAP32[r28+12>>2]|0)!=(HEAP32[r28+16>>2]|0)){r43=r28;break}r15=(FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)|0)==-1;r43=r15?0:r28}}while(0);r28=(r43|0)==0;do{if(r34){r2=1588}else{if((HEAP32[r33+12>>2]|0)==(HEAP32[r33+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)|0)==-1){r2=1588;break}}if(!(r28^(r33|0)==0)){r2=1590}}}while(0);if(r2==1588){if(r28){r2=1590}}if(r2==1590){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r21]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r20]&1)==0){STACKTOP=r8;return}r20=HEAP32[r11+8>>2];if((r20|0)==0){STACKTOP=r8;return}_free(r20);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRd(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+280|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+48;r12=r8+64;r13=r8+80;r14=r8+88;r15=r8+248;r16=r8+256;r17=r8+264;r18=r8+272;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r20=r11;r21=r12;__ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r11,r5,r4,r9,r10);HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r21]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP8[r9];r9=HEAP8[r10];r10=r23;r23=r19;r19=r3;L1715:while(1){do{if((r23|0)==0){r28=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r28=r23;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1;r28=r3?0:r23}}while(0);r29=(r28|0)==0;do{if((r19|0)==0){r2=1615}else{if((HEAP32[r19+12>>2]|0)!=(HEAP32[r19+16>>2]|0)){if(r29){r30=0;r31=r19;break}else{r32=r10;r33=r19;r34=0;break L1715}}if((FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)|0)==-1){r2=1615;break}if(r29){r30=0;r31=r19}else{r32=r10;r33=r19;r34=0;break L1715}}}while(0);if(r2==1615){r2=0;if(r29){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r21];r35=(r3&1|0)==0;r36=HEAP32[r26>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r21]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r21]&1)==0){r39=r24}else{r39=HEAP32[r25>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r28+12|0;r36=HEAP32[r3>>2];r37=r28+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)&255}else{r41=HEAP8[r36]}if((__ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r41,r17,r18,r40,r13,r27,r9,r11,r22,r15,r16,r4)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r40;r23=r28;r19=r31;continue}else{HEAP32[r3>>2]=r36+1;r10=r40;r23=r28;r19=r31;continue}}r31=HEAPU8[r20];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){if((HEAP8[r17]&1)==0){break}r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIdEET_PKcS3_Rj(r32,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);do{if(r29){r43=0}else{if((HEAP32[r28+12>>2]|0)!=(HEAP32[r28+16>>2]|0)){r43=r28;break}r15=(FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)|0)==-1;r43=r15?0:r28}}while(0);r28=(r43|0)==0;do{if(r34){r2=1658}else{if((HEAP32[r33+12>>2]|0)==(HEAP32[r33+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)|0)==-1){r2=1658;break}}if(!(r28^(r33|0)==0)){r2=1660}}}while(0);if(r2==1658){if(r28){r2=1660}}if(r2==1660){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r21]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r20]&1)==0){STACKTOP=r8;return}r20=HEAP32[r11+8>>2];if((r20|0)==0){STACKTOP=r8;return}_free(r20);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRe(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+280|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+48;r12=r8+64;r13=r8+80;r14=r8+88;r15=r8+248;r16=r8+256;r17=r8+264;r18=r8+272;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r20=r11;r21=r12;__ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r11,r5,r4,r9,r10);HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r21]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP8[r9];r9=HEAP8[r10];r10=r23;r23=r19;r19=r3;L1796:while(1){do{if((r23|0)==0){r28=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r28=r23;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1;r28=r3?0:r23}}while(0);r29=(r28|0)==0;do{if((r19|0)==0){r2=1685}else{if((HEAP32[r19+12>>2]|0)!=(HEAP32[r19+16>>2]|0)){if(r29){r30=0;r31=r19;break}else{r32=r10;r33=r19;r34=0;break L1796}}if((FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)|0)==-1){r2=1685;break}if(r29){r30=0;r31=r19}else{r32=r10;r33=r19;r34=0;break L1796}}}while(0);if(r2==1685){r2=0;if(r29){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r21];r35=(r3&1|0)==0;r36=HEAP32[r26>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r21]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r21]&1)==0){r39=r24}else{r39=HEAP32[r25>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r28+12|0;r36=HEAP32[r3>>2];r37=r28+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)&255}else{r41=HEAP8[r36]}if((__ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r41,r17,r18,r40,r13,r27,r9,r11,r22,r15,r16,r4)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r40;r23=r28;r19=r31;continue}else{HEAP32[r3>>2]=r36+1;r10=r40;r23=r28;r19=r31;continue}}r31=HEAPU8[r20];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){if((HEAP8[r17]&1)==0){break}r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIeEET_PKcS3_Rj(r32,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);do{if(r29){r43=0}else{if((HEAP32[r28+12>>2]|0)!=(HEAP32[r28+16>>2]|0)){r43=r28;break}r15=(FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)|0)==-1;r43=r15?0:r28}}while(0);r28=(r43|0)==0;do{if(r34){r2=1728}else{if((HEAP32[r33+12>>2]|0)==(HEAP32[r33+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)|0)==-1){r2=1728;break}}if(!(r28^(r33|0)==0)){r2=1730}}}while(0);if(r2==1728){if(r28){r2=1730}}if(r2==1730){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r21]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r20]&1)==0){STACKTOP=r8;return}r20=HEAP32[r11+8>>2];if((r20|0)==0){STACKTOP=r8;return}_free(r20);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+64|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r10>>2];r10=r9;r11=r9+16;r12=r9+48;r13=r12;r14=STACKTOP;STACKTOP=STACKTOP+12|0;STACKTOP=STACKTOP+7&-8;r15=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r16=STACKTOP;STACKTOP=STACKTOP+160|0;r17=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r18=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r13>>2]=0;HEAP32[r13+4>>2]=0;HEAP32[r13+8>>2]=0;r19=r14;r20=HEAP32[r5+28>>2];r5=r20+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r10>>2]=18560;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r10)}r10=HEAP32[18564>>2]-1|0;r5=HEAP32[r20+8>>2];do{if(HEAP32[r20+12>>2]-r5>>2>>>0>r10>>>0){r21=HEAP32[r5+(r10<<2)>>2];if((r21|0)==0){break}r22=r11|0;FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+32>>2]](r21,15072,15098,r22);r21=r20+4|0;if(((tempValue=HEAP32[r21>>2],HEAP32[r21>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+8>>2]](r20)}HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;HEAP32[r19+8>>2]=0;r21=r14;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,10);if((HEAP8[r19]&1)==0){r23=r21+1|0;r24=r23;r25=r23;r26=r14+8|0}else{r23=r14+8|0;r24=HEAP32[r23>>2];r25=r21+1|0;r26=r23}HEAP32[r15>>2]=r24;r23=r16|0;HEAP32[r17>>2]=r23;HEAP32[r18>>2]=0;r21=r3|0;r27=r4|0;r28=r14|0;r29=r14+4|0;r30=r24;r31=HEAP32[r21>>2];L1887:while(1){do{if((r31|0)==0){r32=0}else{if((HEAP32[r31+12>>2]|0)!=(HEAP32[r31+16>>2]|0)){r32=r31;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)!=-1){r32=r31;break}HEAP32[r21>>2]=0;r32=0}}while(0);r33=(r32|0)==0;r34=HEAP32[r27>>2];do{if((r34|0)==0){r2=1766}else{if((HEAP32[r34+12>>2]|0)!=(HEAP32[r34+16>>2]|0)){if(r33){break}else{r35=r30;break L1887}}if((FUNCTION_TABLE[HEAP32[HEAP32[r34>>2]+36>>2]](r34)|0)==-1){HEAP32[r27>>2]=0;r2=1766;break}else{if(r33){break}else{r35=r30;break L1887}}}}while(0);if(r2==1766){r2=0;if(r33){r35=r30;break}}r34=HEAPU8[r19];r36=(r34&1|0)==0;r37=HEAP32[r29>>2];r38=r34>>>1;if((HEAP32[r15>>2]-r30|0)==((r36?r38:r37)|0)){r34=r36?r38:r37;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r34<<1);if((HEAP8[r19]&1)==0){r39=10}else{r39=(HEAP32[r28>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r39);if((HEAP8[r19]&1)==0){r40=r25}else{r40=HEAP32[r26>>2]}HEAP32[r15>>2]=r40+r34;r41=r40}else{r41=r30}r34=r32+12|0;r37=HEAP32[r34>>2];r38=r32+16|0;if((r37|0)==(HEAP32[r38>>2]|0)){r42=FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+36>>2]](r32)&255}else{r42=HEAP8[r37]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r42,16,r41,r15,r18,0,r12,r23,r17,r22)|0)!=0){r35=r41;break}r37=HEAP32[r34>>2];if((r37|0)==(HEAP32[r38>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+40>>2]](r32);r30=r41;r31=r32;continue}else{HEAP32[r34>>2]=r37+1;r30=r41;r31=r32;continue}}HEAP8[r35+3|0]=0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r31=__ZNSt3__110__sscanf_lEPKcP15__locale_structS1_z(r35,HEAP32[17128>>2],(r8=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r8>>2]=r7,r8));STACKTOP=r8;if((r31|0)!=1){HEAP32[r6>>2]=4}r31=HEAP32[r21>>2];do{if((r31|0)==0){r43=0}else{if((HEAP32[r31+12>>2]|0)!=(HEAP32[r31+16>>2]|0)){r43=r31;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)!=-1){r43=r31;break}HEAP32[r21>>2]=0;r43=0}}while(0);r21=(r43|0)==0;r31=HEAP32[r27>>2];do{if((r31|0)==0){r2=1810}else{if((HEAP32[r31+12>>2]|0)!=(HEAP32[r31+16>>2]|0)){if(r21){break}else{r2=1812;break}}if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){HEAP32[r27>>2]=0;r2=1810;break}else{if(r21){break}else{r2=1812;break}}}}while(0);if(r2==1810){if(r21){r2=1812}}if(r2==1812){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r19]&1)!=0){r27=HEAP32[r14+8>>2];if((r27|0)==0){break}_free(r27)}}while(0);if((HEAP8[r13]&1)==0){STACKTOP=r9;return}r21=HEAP32[r12+8>>2];if((r21|0)==0){STACKTOP=r9;return}_free(r21);STACKTOP=r9;return}}while(0);r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=6520;___cxa_throw(r9,13200,578)}function __ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10){var r11,r12,r13,r14,r15,r16;r11=HEAP32[r4>>2];r12=(r11|0)==(r3|0);do{if(r12){r13=(HEAP8[r10+24|0]|0)==r1<<24>>24;if(!r13){if((HEAP8[r10+25|0]|0)!=r1<<24>>24){break}}HEAP32[r4>>2]=r3+1;HEAP8[r3]=r13?43:45;HEAP32[r5>>2]=0;r14=0;return r14}}while(0);r13=HEAPU8[r7];if((r13&1|0)==0){r15=r13>>>1}else{r15=HEAP32[r7+4>>2]}if((r15|0)!=0&r1<<24>>24==r6<<24>>24){r6=HEAP32[r9>>2];if((r6-r8|0)>=160){r14=0;return r14}r8=HEAP32[r5>>2];HEAP32[r9>>2]=r6+4;HEAP32[r6>>2]=r8;HEAP32[r5>>2]=0;r14=0;return r14}r8=r10+26|0;r6=r10;while(1){if((r6|0)==(r8|0)){r16=r8;break}if((HEAP8[r6]|0)==r1<<24>>24){r16=r6;break}else{r6=r6+1|0}}r6=r16-r10|0;if((r6|0)>23){r14=-1;return r14}do{if((r2|0)==16){if((r6|0)<22){break}if(r12){r14=-1;return r14}if((r11-r3|0)>=3){r14=-1;return r14}if((HEAP8[r11-1|0]|0)!=48){r14=-1;return r14}HEAP32[r5>>2]=0;r10=HEAP8[r6+15072|0];r16=HEAP32[r4>>2];HEAP32[r4>>2]=r16+1;HEAP8[r16]=r10;r14=0;return r14}else if((r2|0)==8|(r2|0)==10){if((r6|0)<(r2|0)){break}else{r14=-1}return r14}}while(0);r2=HEAP8[r6+15072|0];HEAP32[r4>>2]=r11+1;HEAP8[r11]=r2;HEAP32[r5>>2]=HEAP32[r5>>2]+1;r14=0;return r14}function __ZNSt3__110__sscanf_lEPKcP15__locale_structS1_z(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r5;HEAP32[r6>>2]=r3;HEAP32[r6+4>>2]=0;r6=_uselocale(r2);r2=_vsscanf(r1,3784,r5|0);if((r6|0)==0){STACKTOP=r4;return r2}_uselocale(r6);STACKTOP=r4;return r2}function __ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev(r1){return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r8=STACKTOP;STACKTOP=STACKTOP+88|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+16;r11=r8+32;r12=r8+40;r13=r8+48;r14=r8+56;r15=r8+64;if((HEAP32[r5+4>>2]&1|0)==0){HEAP32[r11>>2]=-1;r16=HEAP32[HEAP32[r2>>2]+16>>2];r17=r3|0;HEAP32[r13>>2]=HEAP32[r17>>2];HEAP32[r14>>2]=HEAP32[r4>>2];FUNCTION_TABLE[r16](r12,r2,r13,r14,r5,r6,r11);r14=HEAP32[r12>>2];HEAP32[r17>>2]=r14;r17=HEAP32[r11>>2];if((r17|0)==0){HEAP8[r7]=0}else if((r17|0)==1){HEAP8[r7]=1}else{HEAP8[r7]=1;HEAP32[r6>>2]=4}HEAP32[r1>>2]=r14;STACKTOP=r8;return}r14=r5+28|0;r5=HEAP32[r14>>2];r17=r5+4|0;tempValue=HEAP32[r17>>2],HEAP32[r17>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r10>>2]=18552;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r10)}r10=HEAP32[18556>>2]-1|0;r17=HEAP32[r5+8>>2];do{if(HEAP32[r5+12>>2]-r17>>2>>>0>r10>>>0){r11=HEAP32[r17+(r10<<2)>>2];if((r11|0)==0){break}r12=r11;r11=r5+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}r11=HEAP32[r14>>2];r13=r11+4|0;tempValue=HEAP32[r13>>2],HEAP32[r13>>2]=tempValue+1,tempValue;if((HEAP32[18168>>2]|0)!=-1){HEAP32[r9>>2]=18168;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18168,r9)}r13=HEAP32[18172>>2]-1|0;r2=HEAP32[r11+8>>2];do{if(HEAP32[r11+12>>2]-r2>>2>>>0>r13>>>0){r16=HEAP32[r2+(r13<<2)>>2];if((r16|0)==0){break}r18=r16;r19=r11+4|0;if(((tempValue=HEAP32[r19>>2],HEAP32[r19>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+8>>2]](r11)}r19=r15|0;r20=r16;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+24>>2]](r19,r18);r16=r15+12|0;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+28>>2]](r16,r18);HEAP8[r7]=(__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,HEAP32[r4>>2],r19,r15+24|0,r12,r6,1)|0)==(r19|0)|0;HEAP32[r1>>2]=HEAP32[r3>>2];do{if((HEAP8[r16]&1)!=0){r19=HEAP32[r15+20>>2];if((r19|0)==0){break}_free(r19)}}while(0);if((HEAP8[r15]&1)==0){STACKTOP=r8;return}r16=HEAP32[r15+8>>2];if((r16|0)==0){STACKTOP=r8;return}_free(r16);STACKTOP=r8;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6520;___cxa_throw(r12,13200,578)}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+104|0;r10=(r4-r3|0)/12&-1;r11=r9|0;do{if(r10>>>0>100){r12=_malloc(r10);if((r12|0)!=0){r13=r12;r14=r12;break}r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6488;___cxa_throw(r12,13184,74)}else{r13=r11;r14=0}}while(0);r11=(r3|0)==(r4|0);if(r11){r15=r10;r16=0}else{r12=r10;r10=0;r17=r13;r18=r3;while(1){r19=HEAPU8[r18];if((r19&1|0)==0){r20=r19>>>1}else{r20=HEAP32[r18+4>>2]}if((r20|0)==0){HEAP8[r17]=2;r21=r10+1|0;r22=r12-1|0}else{HEAP8[r17]=1;r21=r10;r22=r12}r19=r18+12|0;if((r19|0)==(r4|0)){r15=r22;r16=r21;break}else{r12=r22;r10=r21;r17=r17+1|0;r18=r19}}}r18=r1|0;r1=r5;r17=0;r21=r16;r16=r15;r15=r2;L2088:while(1){r2=HEAP32[r18>>2];do{if((r2|0)==0){r23=0}else{r10=HEAP32[r2+12>>2];if((r10|0)==(HEAP32[r2+16>>2]|0)){r24=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+36>>2]](r2)}else{r24=HEAP32[r10>>2]}if((r24|0)==-1){HEAP32[r18>>2]=0;r23=0;break}else{r23=HEAP32[r18>>2];break}}}while(0);r2=(r23|0)==0;if((r15|0)==0){r25=r23;r26=0}else{r10=HEAP32[r15+12>>2];if((r10|0)==(HEAP32[r15+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+36>>2]](r15)}else{r27=HEAP32[r10>>2]}r25=HEAP32[r18>>2];r26=(r27|0)==-1?0:r15}r28=(r26|0)==0;if(!((r2^r28)&(r16|0)!=0)){break}r2=HEAP32[r25+12>>2];if((r2|0)==(HEAP32[r25+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r25>>2]+36>>2]](r25)}else{r29=HEAP32[r2>>2]}if(r7){r30=r29}else{r30=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+28>>2]](r5,r29)}r2=r17+1|0;if(r11){r17=r2;r21=r21;r16=r16;r15=r26;continue}L2116:do{if(r7){r10=r16;r22=r21;r12=r13;r20=0;r19=r3;while(1){do{if((HEAP8[r12]|0)==1){r31=HEAP8[r19];if((r31&1)==0){r32=r19+4|0}else{r32=HEAP32[r19+8>>2]}if((r30|0)!=(HEAP32[r32+(r17<<2)>>2]|0)){HEAP8[r12]=0;r33=r20;r34=r22;r35=r10-1|0;break}r36=r31&255;if((r36&1|0)==0){r37=r36>>>1}else{r37=HEAP32[r19+4>>2]}if((r37|0)!=(r2|0)){r33=1;r34=r22;r35=r10;break}HEAP8[r12]=2;r33=1;r34=r22+1|0;r35=r10-1|0}else{r33=r20;r34=r22;r35=r10}}while(0);r36=r19+12|0;if((r36|0)==(r4|0)){r38=r35;r39=r34;r40=r33;break L2116}r10=r35;r22=r34;r12=r12+1|0;r20=r33;r19=r36}}else{r19=r16;r20=r21;r12=r13;r22=0;r10=r3;while(1){do{if((HEAP8[r12]|0)==1){r36=r10;if((HEAP8[r36]&1)==0){r41=r10+4|0}else{r41=HEAP32[r10+8>>2]}if((r30|0)!=(FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+28>>2]](r5,HEAP32[r41+(r17<<2)>>2])|0)){HEAP8[r12]=0;r42=r22;r43=r20;r44=r19-1|0;break}r31=HEAPU8[r36];if((r31&1|0)==0){r45=r31>>>1}else{r45=HEAP32[r10+4>>2]}if((r45|0)!=(r2|0)){r42=1;r43=r20;r44=r19;break}HEAP8[r12]=2;r42=1;r43=r20+1|0;r44=r19-1|0}else{r42=r22;r43=r20;r44=r19}}while(0);r31=r10+12|0;if((r31|0)==(r4|0)){r38=r44;r39=r43;r40=r42;break L2116}r19=r44;r20=r43;r12=r12+1|0;r22=r42;r10=r31}}}while(0);if(!r40){r17=r2;r21=r39;r16=r38;r15=r26;continue}r10=HEAP32[r18>>2];r22=r10+12|0;r12=HEAP32[r22>>2];if((r12|0)==(HEAP32[r10+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+40>>2]](r10)}else{HEAP32[r22>>2]=r12+4}if((r39+r38|0)>>>0<2){r17=r2;r21=r39;r16=r38;r15=r26;continue}else{r46=r39;r47=r13;r48=r3}while(1){do{if((HEAP8[r47]|0)==2){r12=HEAPU8[r48];if((r12&1|0)==0){r49=r12>>>1}else{r49=HEAP32[r48+4>>2]}if((r49|0)==(r2|0)){r50=r46;break}HEAP8[r47]=0;r50=r46-1|0}else{r50=r46}}while(0);r12=r48+12|0;if((r12|0)==(r4|0)){r17=r2;r21=r50;r16=r38;r15=r26;continue L2088}else{r46=r50;r47=r47+1|0;r48=r12}}}do{if((r25|0)==0){r51=1}else{r48=HEAP32[r25+12>>2];if((r48|0)==(HEAP32[r25+16>>2]|0)){r52=FUNCTION_TABLE[HEAP32[HEAP32[r25>>2]+36>>2]](r25)}else{r52=HEAP32[r48>>2]}if((r52|0)==-1){HEAP32[r18>>2]=0;r51=1;break}else{r51=(HEAP32[r18>>2]|0)==0;break}}}while(0);do{if(r28){r8=2015}else{r18=HEAP32[r26+12>>2];if((r18|0)==(HEAP32[r26+16>>2]|0)){r53=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r53=HEAP32[r18>>2]}if((r53|0)==-1){r8=2015;break}if(!r51){r8=2017}}}while(0);if(r8==2015){if(r51){r8=2017}}if(r8==2017){HEAP32[r6>>2]=HEAP32[r6>>2]|2}L2193:do{if(r11){r8=2022}else{r51=r3;r53=r13;while(1){if((HEAP8[r53]|0)==2){r54=r51;break L2193}r26=r51+12|0;if((r26|0)==(r4|0)){r8=2022;break L2193}r51=r26;r53=r53+1|0}}}while(0);if(r8==2022){HEAP32[r6>>2]=HEAP32[r6>>2]|4;r54=r4}if((r14|0)==0){STACKTOP=r9;return r54}_free(r14);STACKTOP=r9;return r54}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRl(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L2216:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=2048}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=2048;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L2216}}}while(0);if(r2==2048){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP32[r7>>2]=__ZNSt3__125__num_get_signed_integralIlEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=2091}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=2091;break}if(!(r26^(r33|0)==0)){r2=2093}}}while(0);if(r2==2091){if(r26){r2=2093}}if(r2==2093){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRx(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L2305:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=2123}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=2123;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L2305}}}while(0);if(r2==2123){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);r16=__ZNSt3__125__num_get_signed_integralIxEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);HEAP32[r7>>2]=r16;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=2166}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=2166;break}if(!(r26^(r33|0)==0)){r2=2168}}}while(0);if(r2==2166){if(r26){r2=2168}}if(r2==2168){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRt(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L2394:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=2198}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=2198;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L2394}}}while(0);if(r2==2198){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP16[r7>>1]=__ZNSt3__127__num_get_unsigned_integralItEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=2241}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=2241;break}if(!(r26^(r33|0)==0)){r2=2243}}}while(0);if(r2==2241){if(r26){r2=2243}}if(r2==2243){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L2483:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=2273}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=2273;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L2483}}}while(0);if(r2==2273){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralIjEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=2316}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=2316;break}if(!(r26^(r33|0)==0)){r2=2318}}}while(0);if(r2==2316){if(r26){r2=2318}}if(r2==2318){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L2572:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=2348}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=2348;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L2572}}}while(0);if(r2==2348){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralImEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=2391}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=2391;break}if(!(r26^(r33|0)==0)){r2=2393}}}while(0);if(r2==2391){if(r26){r2=2393}}if(r2==2393){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRy(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L2661:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=2423}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=2423;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L2661}}}while(0);if(r2==2423){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);r16=__ZNSt3__127__num_get_unsigned_integralIyEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);HEAP32[r7>>2]=r16;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=2466}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=2466;break}if(!(r26^(r33|0)==0)){r2=2468}}}while(0);if(r2==2466){if(r26){r2=2468}}if(r2==2468){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRf(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+376|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+128;r10=r8+136;r11=r8+144;r12=r8+160;r13=r8+176;r14=r8+184;r15=r8+344;r16=r8+352;r17=r8+360;r18=r8+368;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r20=r12;r21=r8|0;__ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r11,r5,r21,r9,r10);HEAP32[r20>>2]=0;HEAP32[r20+4>>2]=0;HEAP32[r20+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r20]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP32[r9>>2];r9=HEAP32[r10>>2];r10=r23;r23=r19;r19=r3;L2745:while(1){if((r23|0)==0){r28=0}else{r3=HEAP32[r23+12>>2];if((r3|0)==(HEAP32[r23+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)}else{r29=HEAP32[r3>>2]}r28=(r29|0)==-1?0:r23}r30=(r28|0)==0;do{if((r19|0)==0){r2=2494}else{r3=HEAP32[r19+12>>2];if((r3|0)==(HEAP32[r19+16>>2]|0)){r31=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)}else{r31=HEAP32[r3>>2]}if((r31|0)==-1){r2=2494;break}if(r30){r32=0;r33=r19}else{r34=r10;r35=r19;r36=0;break L2745}}}while(0);if(r2==2494){r2=0;if(r30){r34=r10;r35=0;r36=1;break}else{r32=1;r33=0}}r3=HEAPU8[r20];r37=(r3&1|0)==0;r38=HEAP32[r26>>2];r39=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r37?r39:r38)|0)){r3=r37?r39:r38;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r20]&1)==0){r40=10}else{r40=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r40);if((HEAP8[r20]&1)==0){r41=r24}else{r41=HEAP32[r25>>2]}HEAP32[r13>>2]=r41+r3;r42=r41}else{r42=r10}r3=r28+12|0;r38=HEAP32[r3>>2];r39=r28+16|0;if((r38|0)==(HEAP32[r39>>2]|0)){r43=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r43=HEAP32[r38>>2]}if((__ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r43,r17,r18,r42,r13,r27,r9,r11,r22,r15,r16,r21)|0)!=0){r34=r42;r35=r33;r36=r32;break}r38=HEAP32[r3>>2];if((r38|0)==(HEAP32[r39>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r42;r23=r28;r19=r33;continue}else{HEAP32[r3>>2]=r38+4;r10=r42;r23=r28;r19=r33;continue}}r33=HEAPU8[r4];if((r33&1|0)==0){r44=r33>>>1}else{r44=HEAP32[r11+4>>2]}do{if((r44|0)!=0){if((HEAP8[r17]&1)==0){break}r33=HEAP32[r15>>2];if((r33-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r33+4;HEAP32[r33>>2]=r19}}while(0);HEAPF32[r7>>2]=__ZNSt3__115__num_get_floatIfEET_PKcS3_Rj(r34,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);if(r30){r45=0}else{r30=HEAP32[r28+12>>2];if((r30|0)==(HEAP32[r28+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r46=HEAP32[r30>>2]}r45=(r46|0)==-1?0:r28}r28=(r45|0)==0;do{if(r36){r2=2538}else{r46=HEAP32[r35+12>>2];if((r46|0)==(HEAP32[r35+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r47=HEAP32[r46>>2]}if((r47|0)==-1){r2=2538;break}if(!(r28^(r35|0)==0)){r2=2540}}}while(0);if(r2==2538){if(r28){r2=2540}}if(r2==2540){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r20]&1)!=0){r45=HEAP32[r12+8>>2];if((r45|0)==0){break}_free(r45)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRd(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+376|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+128;r10=r8+136;r11=r8+144;r12=r8+160;r13=r8+176;r14=r8+184;r15=r8+344;r16=r8+352;r17=r8+360;r18=r8+368;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r20=r12;r21=r8|0;__ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r11,r5,r21,r9,r10);HEAP32[r20>>2]=0;HEAP32[r20+4>>2]=0;HEAP32[r20+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r20]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP32[r9>>2];r9=HEAP32[r10>>2];r10=r23;r23=r19;r19=r3;L2830:while(1){if((r23|0)==0){r28=0}else{r3=HEAP32[r23+12>>2];if((r3|0)==(HEAP32[r23+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)}else{r29=HEAP32[r3>>2]}r28=(r29|0)==-1?0:r23}r30=(r28|0)==0;do{if((r19|0)==0){r2=2566}else{r3=HEAP32[r19+12>>2];if((r3|0)==(HEAP32[r19+16>>2]|0)){r31=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)}else{r31=HEAP32[r3>>2]}if((r31|0)==-1){r2=2566;break}if(r30){r32=0;r33=r19}else{r34=r10;r35=r19;r36=0;break L2830}}}while(0);if(r2==2566){r2=0;if(r30){r34=r10;r35=0;r36=1;break}else{r32=1;r33=0}}r3=HEAPU8[r20];r37=(r3&1|0)==0;r38=HEAP32[r26>>2];r39=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r37?r39:r38)|0)){r3=r37?r39:r38;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r20]&1)==0){r40=10}else{r40=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r40);if((HEAP8[r20]&1)==0){r41=r24}else{r41=HEAP32[r25>>2]}HEAP32[r13>>2]=r41+r3;r42=r41}else{r42=r10}r3=r28+12|0;r38=HEAP32[r3>>2];r39=r28+16|0;if((r38|0)==(HEAP32[r39>>2]|0)){r43=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r43=HEAP32[r38>>2]}if((__ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r43,r17,r18,r42,r13,r27,r9,r11,r22,r15,r16,r21)|0)!=0){r34=r42;r35=r33;r36=r32;break}r38=HEAP32[r3>>2];if((r38|0)==(HEAP32[r39>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r42;r23=r28;r19=r33;continue}else{HEAP32[r3>>2]=r38+4;r10=r42;r23=r28;r19=r33;continue}}r33=HEAPU8[r4];if((r33&1|0)==0){r44=r33>>>1}else{r44=HEAP32[r11+4>>2]}do{if((r44|0)!=0){if((HEAP8[r17]&1)==0){break}r33=HEAP32[r15>>2];if((r33-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r33+4;HEAP32[r33>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIdEET_PKcS3_Rj(r34,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);if(r30){r45=0}else{r30=HEAP32[r28+12>>2];if((r30|0)==(HEAP32[r28+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r46=HEAP32[r30>>2]}r45=(r46|0)==-1?0:r28}r28=(r45|0)==0;do{if(r36){r2=2610}else{r46=HEAP32[r35+12>>2];if((r46|0)==(HEAP32[r35+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r47=HEAP32[r46>>2]}if((r47|0)==-1){r2=2610;break}if(!(r28^(r35|0)==0)){r2=2612}}}while(0);if(r2==2610){if(r28){r2=2612}}if(r2==2612){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r20]&1)!=0){r45=HEAP32[r12+8>>2];if((r45|0)==0){break}_free(r45)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRe(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+376|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+128;r10=r8+136;r11=r8+144;r12=r8+160;r13=r8+176;r14=r8+184;r15=r8+344;r16=r8+352;r17=r8+360;r18=r8+368;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r20=r12;r21=r8|0;__ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r11,r5,r21,r9,r10);HEAP32[r20>>2]=0;HEAP32[r20+4>>2]=0;HEAP32[r20+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r20]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP32[r9>>2];r9=HEAP32[r10>>2];r10=r23;r23=r19;r19=r3;L2915:while(1){if((r23|0)==0){r28=0}else{r3=HEAP32[r23+12>>2];if((r3|0)==(HEAP32[r23+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)}else{r29=HEAP32[r3>>2]}r28=(r29|0)==-1?0:r23}r30=(r28|0)==0;do{if((r19|0)==0){r2=2638}else{r3=HEAP32[r19+12>>2];if((r3|0)==(HEAP32[r19+16>>2]|0)){r31=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)}else{r31=HEAP32[r3>>2]}if((r31|0)==-1){r2=2638;break}if(r30){r32=0;r33=r19}else{r34=r10;r35=r19;r36=0;break L2915}}}while(0);if(r2==2638){r2=0;if(r30){r34=r10;r35=0;r36=1;break}else{r32=1;r33=0}}r3=HEAPU8[r20];r37=(r3&1|0)==0;r38=HEAP32[r26>>2];r39=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r37?r39:r38)|0)){r3=r37?r39:r38;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r20]&1)==0){r40=10}else{r40=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r40);if((HEAP8[r20]&1)==0){r41=r24}else{r41=HEAP32[r25>>2]}HEAP32[r13>>2]=r41+r3;r42=r41}else{r42=r10}r3=r28+12|0;r38=HEAP32[r3>>2];r39=r28+16|0;if((r38|0)==(HEAP32[r39>>2]|0)){r43=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r43=HEAP32[r38>>2]}if((__ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r43,r17,r18,r42,r13,r27,r9,r11,r22,r15,r16,r21)|0)!=0){r34=r42;r35=r33;r36=r32;break}r38=HEAP32[r3>>2];if((r38|0)==(HEAP32[r39>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r42;r23=r28;r19=r33;continue}else{HEAP32[r3>>2]=r38+4;r10=r42;r23=r28;r19=r33;continue}}r33=HEAPU8[r4];if((r33&1|0)==0){r44=r33>>>1}else{r44=HEAP32[r11+4>>2]}do{if((r44|0)!=0){if((HEAP8[r17]&1)==0){break}r33=HEAP32[r15>>2];if((r33-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r33+4;HEAP32[r33>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIeEET_PKcS3_Rj(r34,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);if(r30){r45=0}else{r30=HEAP32[r28+12>>2];if((r30|0)==(HEAP32[r28+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r46=HEAP32[r30>>2]}r45=(r46|0)==-1?0:r28}r28=(r45|0)==0;do{if(r36){r2=2682}else{r46=HEAP32[r35+12>>2];if((r46|0)==(HEAP32[r35+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r47=HEAP32[r46>>2]}if((r47|0)==-1){r2=2682;break}if(!(r28^(r35|0)==0)){r2=2684}}}while(0);if(r2==2682){if(r28){r2=2684}}if(r2==2684){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r20]&1)!=0){r45=HEAP32[r12+8>>2];if((r45|0)==0){break}_free(r45)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+136|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r10>>2];r10=r9;r11=r9+16;r12=r9+120;r13=r12;r14=STACKTOP;STACKTOP=STACKTOP+12|0;STACKTOP=STACKTOP+7&-8;r15=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r16=STACKTOP;STACKTOP=STACKTOP+160|0;r17=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r18=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r13>>2]=0;HEAP32[r13+4>>2]=0;HEAP32[r13+8>>2]=0;r19=r14;r20=HEAP32[r5+28>>2];r5=r20+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r10>>2]=18552;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r10)}r10=HEAP32[18556>>2]-1|0;r5=HEAP32[r20+8>>2];do{if(HEAP32[r20+12>>2]-r5>>2>>>0>r10>>>0){r21=HEAP32[r5+(r10<<2)>>2];if((r21|0)==0){break}r22=r11|0;FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+48>>2]](r21,15072,15098,r22);r21=r20+4|0;if(((tempValue=HEAP32[r21>>2],HEAP32[r21>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+8>>2]](r20)}HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;HEAP32[r19+8>>2]=0;r21=r14;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,10);if((HEAP8[r19]&1)==0){r23=r21+1|0;r24=r23;r25=r23;r26=r14+8|0}else{r23=r14+8|0;r24=HEAP32[r23>>2];r25=r21+1|0;r26=r23}HEAP32[r15>>2]=r24;r23=r16|0;HEAP32[r17>>2]=r23;HEAP32[r18>>2]=0;r21=r3|0;r27=r4|0;r28=r14|0;r29=r14+4|0;r30=r24;r31=HEAP32[r21>>2];L3010:while(1){do{if((r31|0)==0){r32=0}else{r33=HEAP32[r31+12>>2];if((r33|0)==(HEAP32[r31+16>>2]|0)){r34=FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)}else{r34=HEAP32[r33>>2]}if((r34|0)!=-1){r32=r31;break}HEAP32[r21>>2]=0;r32=0}}while(0);r33=(r32|0)==0;r35=HEAP32[r27>>2];do{if((r35|0)==0){r2=2721}else{r36=HEAP32[r35+12>>2];if((r36|0)==(HEAP32[r35+16>>2]|0)){r37=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r37=HEAP32[r36>>2]}if((r37|0)==-1){HEAP32[r27>>2]=0;r2=2721;break}else{if(r33){break}else{r38=r30;break L3010}}}}while(0);if(r2==2721){r2=0;if(r33){r38=r30;break}}r35=HEAPU8[r19];r36=(r35&1|0)==0;r39=HEAP32[r29>>2];r40=r35>>>1;if((HEAP32[r15>>2]-r30|0)==((r36?r40:r39)|0)){r35=r36?r40:r39;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r35<<1);if((HEAP8[r19]&1)==0){r41=10}else{r41=(HEAP32[r28>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r41);if((HEAP8[r19]&1)==0){r42=r25}else{r42=HEAP32[r26>>2]}HEAP32[r15>>2]=r42+r35;r43=r42}else{r43=r30}r35=r32+12|0;r39=HEAP32[r35>>2];r40=r32+16|0;if((r39|0)==(HEAP32[r40>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+36>>2]](r32)}else{r44=HEAP32[r39>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r44,16,r43,r15,r18,0,r12,r23,r17,r22)|0)!=0){r38=r43;break}r39=HEAP32[r35>>2];if((r39|0)==(HEAP32[r40>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+40>>2]](r32);r30=r43;r31=r32;continue}else{HEAP32[r35>>2]=r39+4;r30=r43;r31=r32;continue}}HEAP8[r38+3|0]=0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r31=__ZNSt3__110__sscanf_lEPKcP15__locale_structS1_z(r38,HEAP32[17128>>2],(r8=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r8>>2]=r7,r8));STACKTOP=r8;if((r31|0)!=1){HEAP32[r6>>2]=4}r31=HEAP32[r21>>2];do{if((r31|0)==0){r45=0}else{r30=HEAP32[r31+12>>2];if((r30|0)==(HEAP32[r31+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)}else{r46=HEAP32[r30>>2]}if((r46|0)!=-1){r45=r31;break}HEAP32[r21>>2]=0;r45=0}}while(0);r21=(r45|0)==0;r31=HEAP32[r27>>2];do{if((r31|0)==0){r2=2765}else{r30=HEAP32[r31+12>>2];if((r30|0)==(HEAP32[r31+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)}else{r47=HEAP32[r30>>2]}if((r47|0)==-1){HEAP32[r27>>2]=0;r2=2765;break}else{if(r21){break}else{r2=2767;break}}}}while(0);if(r2==2765){if(r21){r2=2767}}if(r2==2767){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r19]&1)!=0){r27=HEAP32[r14+8>>2];if((r27|0)==0){break}_free(r27)}}while(0);if((HEAP8[r13]&1)==0){STACKTOP=r9;return}r21=HEAP32[r12+8>>2];if((r21|0)==0){STACKTOP=r9;return}_free(r21);STACKTOP=r9;return}}while(0);r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=6520;___cxa_throw(r9,13200,578)}function __ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10){var r11,r12,r13,r14,r15,r16;r11=HEAP32[r4>>2];r12=(r11|0)==(r3|0);do{if(r12){r13=(HEAP32[r10+96>>2]|0)==(r1|0);if(!r13){if((HEAP32[r10+100>>2]|0)!=(r1|0)){break}}HEAP32[r4>>2]=r3+1;HEAP8[r3]=r13?43:45;HEAP32[r5>>2]=0;r14=0;return r14}}while(0);r13=HEAPU8[r7];if((r13&1|0)==0){r15=r13>>>1}else{r15=HEAP32[r7+4>>2]}if((r15|0)!=0&(r1|0)==(r6|0)){r6=HEAP32[r9>>2];if((r6-r8|0)>=160){r14=0;return r14}r8=HEAP32[r5>>2];HEAP32[r9>>2]=r6+4;HEAP32[r6>>2]=r8;HEAP32[r5>>2]=0;r14=0;return r14}r8=r10+104|0;r6=r10;while(1){if((r6|0)==(r8|0)){r16=r8;break}if((HEAP32[r6>>2]|0)==(r1|0)){r16=r6;break}else{r6=r6+4|0}}r6=r16-r10|0;r10=r6>>2;if((r6|0)>92){r14=-1;return r14}do{if((r2|0)==8|(r2|0)==10){if((r10|0)<(r2|0)){break}else{r14=-1}return r14}else if((r2|0)==16){if((r6|0)<88){break}if(r12){r14=-1;return r14}if((r11-r3|0)>=3){r14=-1;return r14}if((HEAP8[r11-1|0]|0)!=48){r14=-1;return r14}HEAP32[r5>>2]=0;r16=HEAP8[r10+15072|0];r1=HEAP32[r4>>2];HEAP32[r4>>2]=r1+1;HEAP8[r1]=r16;r14=0;return r14}}while(0);r3=HEAP8[r10+15072|0];HEAP32[r4>>2]=r11+1;HEAP8[r11]=r3;HEAP32[r5>>2]=HEAP32[r5>>2]+1;r14=0;return r14}function __ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;r7=r5+16;r8=HEAP32[r2+28>>2];r2=r8+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r7>>2]=18560;HEAP32[r7+4>>2]=28;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r7)}r7=HEAP32[18564>>2]-1|0;r2=r8+12|0;r9=r8+8|0;r10=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r10>>2>>>0>r7>>>0){r11=HEAP32[r10+(r7<<2)>>2];if((r11|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+32>>2]](r11,15072,15098,r3);if((HEAP32[18176>>2]|0)!=-1){HEAP32[r6>>2]=18176;HEAP32[r6+4>>2]=28;HEAP32[r6+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18176,r6)}r11=HEAP32[18180>>2]-1|0;r12=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r12>>2>>>0>r11>>>0){r13=HEAP32[r12+(r11<<2)>>2];if((r13|0)==0){break}r14=r13;HEAP8[r4]=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+16>>2]](r14);FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+20>>2]](r1,r14);r14=r8+4|0;if(((tempValue=HEAP32[r14>>2],HEAP32[r14>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r5;return}FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+8>>2]](r8);STACKTOP=r5;return}}while(0);r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=6520;___cxa_throw(r11,13200,578)}}while(0);r5=___cxa_allocate_exception(4);HEAP32[r5>>2]=6520;___cxa_throw(r5,13200,578)}function __ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r6+16;r9=HEAP32[r2+28>>2];r2=r9+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r8>>2]=18560;HEAP32[r8+4>>2]=28;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r8)}r8=HEAP32[18564>>2]-1|0;r2=r9+12|0;r10=r9+8|0;r11=HEAP32[r10>>2];do{if(HEAP32[r2>>2]-r11>>2>>>0>r8>>>0){r12=HEAP32[r11+(r8<<2)>>2];if((r12|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+32>>2]](r12,15072,15104,r3);if((HEAP32[18176>>2]|0)!=-1){HEAP32[r7>>2]=18176;HEAP32[r7+4>>2]=28;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18176,r7)}r12=HEAP32[18180>>2]-1|0;r13=HEAP32[r10>>2];do{if(HEAP32[r2>>2]-r13>>2>>>0>r12>>>0){r14=HEAP32[r13+(r12<<2)>>2];if((r14|0)==0){break}r15=r14;r16=r14;HEAP8[r4]=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+12>>2]](r15);HEAP8[r5]=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+16>>2]](r15);FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+20>>2]](r1,r15);r15=r9+4|0;if(((tempValue=HEAP32[r15>>2],HEAP32[r15>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r6;return}FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+8>>2]](r9);STACKTOP=r6;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6520;___cxa_throw(r12,13200,578)}}while(0);r6=___cxa_allocate_exception(4);HEAP32[r6>>2]=6520;___cxa_throw(r6,13200,578)}function __ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12){var r13,r14,r15,r16,r17;if(r1<<24>>24==r6<<24>>24){if((HEAP8[r2]&1)==0){r13=-1;return r13}HEAP8[r2]=0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[r6]=46;r6=HEAPU8[r8];if((r6&1|0)==0){r14=r6>>>1}else{r14=HEAP32[r8+4>>2]}if((r14|0)==0){r13=0;return r13}r14=HEAP32[r10>>2];if((r14-r9|0)>=160){r13=0;return r13}r6=HEAP32[r11>>2];HEAP32[r10>>2]=r14+4;HEAP32[r14>>2]=r6;r13=0;return r13}do{if(r1<<24>>24==r7<<24>>24){r6=HEAPU8[r8];if((r6&1|0)==0){r15=r6>>>1}else{r15=HEAP32[r8+4>>2]}if((r15|0)==0){break}if((HEAP8[r2]&1)==0){r13=-1;return r13}r6=HEAP32[r10>>2];if((r6-r9|0)>=160){r13=0;return r13}r14=HEAP32[r11>>2];HEAP32[r10>>2]=r6+4;HEAP32[r6>>2]=r14;HEAP32[r11>>2]=0;r13=0;return r13}}while(0);r15=r12+32|0;r7=r12;while(1){if((r7|0)==(r15|0)){r16=r15;break}if((HEAP8[r7]|0)==r1<<24>>24){r16=r7;break}else{r7=r7+1|0}}r7=r16-r12|0;if((r7|0)>31){r13=-1;return r13}r12=HEAP8[r7+15072|0];if((r7|0)==25|(r7|0)==24){r16=HEAP32[r5>>2];do{if((r16|0)!=(r4|0)){if((HEAP8[r16-1|0]&95|0)==(HEAP8[r3]&127|0)){break}else{r13=-1}return r13}}while(0);HEAP32[r5>>2]=r16+1;HEAP8[r16]=r12;r13=0;return r13}else if((r7|0)==22|(r7|0)==23){HEAP8[r3]=80;r16=HEAP32[r5>>2];HEAP32[r5>>2]=r16+1;HEAP8[r16]=r12;r13=0;return r13}else{r16=HEAP8[r3];do{if((r12&95|0)==(r16<<24>>24|0)){HEAP8[r3]=r16|-128;if((HEAP8[r2]&1)==0){break}HEAP8[r2]=0;r4=HEAPU8[r8];if((r4&1|0)==0){r17=r4>>>1}else{r17=HEAP32[r8+4>>2]}if((r17|0)==0){break}r4=HEAP32[r10>>2];if((r4-r9|0)>=160){break}r1=HEAP32[r11>>2];HEAP32[r10>>2]=r4+4;HEAP32[r4>>2]=r1}}while(0);r10=HEAP32[r5>>2];HEAP32[r5>>2]=r10+1;HEAP8[r10]=r12;if((r7|0)>21){r13=0;return r13}HEAP32[r11>>2]=HEAP32[r11>>2]+1;r13=0;return r13}}function __ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;r7=r5+16;r8=HEAP32[r2+28>>2];r2=r8+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r7>>2]=18552;HEAP32[r7+4>>2]=28;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r7)}r7=HEAP32[18556>>2]-1|0;r2=r8+12|0;r9=r8+8|0;r10=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r10>>2>>>0>r7>>>0){r11=HEAP32[r10+(r7<<2)>>2];if((r11|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+48>>2]](r11,15072,15098,r3);if((HEAP32[18168>>2]|0)!=-1){HEAP32[r6>>2]=18168;HEAP32[r6+4>>2]=28;HEAP32[r6+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18168,r6)}r11=HEAP32[18172>>2]-1|0;r12=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r12>>2>>>0>r11>>>0){r13=HEAP32[r12+(r11<<2)>>2];if((r13|0)==0){break}r14=r13;HEAP32[r4>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+16>>2]](r14);FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+20>>2]](r1,r14);r14=r8+4|0;if(((tempValue=HEAP32[r14>>2],HEAP32[r14>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r5;return}FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+8>>2]](r8);STACKTOP=r5;return}}while(0);r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=6520;___cxa_throw(r11,13200,578)}}while(0);r5=___cxa_allocate_exception(4);HEAP32[r5>>2]=6520;___cxa_throw(r5,13200,578)}function __ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r6+16;r9=HEAP32[r2+28>>2];r2=r9+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r8>>2]=18552;HEAP32[r8+4>>2]=28;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r8)}r8=HEAP32[18556>>2]-1|0;r2=r9+12|0;r10=r9+8|0;r11=HEAP32[r10>>2];do{if(HEAP32[r2>>2]-r11>>2>>>0>r8>>>0){r12=HEAP32[r11+(r8<<2)>>2];if((r12|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+48>>2]](r12,15072,15104,r3);if((HEAP32[18168>>2]|0)!=-1){HEAP32[r7>>2]=18168;HEAP32[r7+4>>2]=28;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18168,r7)}r12=HEAP32[18172>>2]-1|0;r13=HEAP32[r10>>2];do{if(HEAP32[r2>>2]-r13>>2>>>0>r12>>>0){r14=HEAP32[r13+(r12<<2)>>2];if((r14|0)==0){break}r15=r14;r16=r14;HEAP32[r4>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+12>>2]](r15);HEAP32[r5>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+16>>2]](r15);FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+20>>2]](r1,r15);r15=r9+4|0;if(((tempValue=HEAP32[r15>>2],HEAP32[r15>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r6;return}FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+8>>2]](r9);STACKTOP=r6;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=6520;___cxa_throw(r12,13200,578)}}while(0);r6=___cxa_allocate_exception(4);HEAP32[r6>>2]=6520;___cxa_throw(r6,13200,578)}function __ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12){var r13,r14,r15,r16,r17;if((r1|0)==(r6|0)){if((HEAP8[r2]&1)==0){r13=-1;return r13}HEAP8[r2]=0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[r6]=46;r6=HEAPU8[r8];if((r6&1|0)==0){r14=r6>>>1}else{r14=HEAP32[r8+4>>2]}if((r14|0)==0){r13=0;return r13}r14=HEAP32[r10>>2];if((r14-r9|0)>=160){r13=0;return r13}r6=HEAP32[r11>>2];HEAP32[r10>>2]=r14+4;HEAP32[r14>>2]=r6;r13=0;return r13}do{if((r1|0)==(r7|0)){r6=HEAPU8[r8];if((r6&1|0)==0){r15=r6>>>1}else{r15=HEAP32[r8+4>>2]}if((r15|0)==0){break}if((HEAP8[r2]&1)==0){r13=-1;return r13}r6=HEAP32[r10>>2];if((r6-r9|0)>=160){r13=0;return r13}r14=HEAP32[r11>>2];HEAP32[r10>>2]=r6+4;HEAP32[r6>>2]=r14;HEAP32[r11>>2]=0;r13=0;return r13}}while(0);r15=r12+128|0;r7=r12;while(1){if((r7|0)==(r15|0)){r16=r15;break}if((HEAP32[r7>>2]|0)==(r1|0)){r16=r7;break}else{r7=r7+4|0}}r7=r16-r12|0;r12=r7>>2;if((r7|0)>124){r13=-1;return r13}r16=HEAP8[r12+15072|0];do{if((r12|0)==22|(r12|0)==23){HEAP8[r3]=80}else if((r12|0)==25|(r12|0)==24){r1=HEAP32[r5>>2];do{if((r1|0)!=(r4|0)){if((HEAP8[r1-1|0]&95|0)==(HEAP8[r3]&127|0)){break}else{r13=-1}return r13}}while(0);HEAP32[r5>>2]=r1+1;HEAP8[r1]=r16;r13=0;return r13}else{r15=HEAP8[r3];if((r16&95|0)!=(r15<<24>>24|0)){break}HEAP8[r3]=r15|-128;if((HEAP8[r2]&1)==0){break}HEAP8[r2]=0;r15=HEAPU8[r8];if((r15&1|0)==0){r17=r15>>>1}else{r17=HEAP32[r8+4>>2]}if((r17|0)==0){break}r15=HEAP32[r10>>2];if((r15-r9|0)>=160){break}r14=HEAP32[r11>>2];HEAP32[r10>>2]=r15+4;HEAP32[r15>>2]=r14}}while(0);r10=HEAP32[r5>>2];HEAP32[r5>>2]=r10+1;HEAP8[r10]=r16;if((r7|0)>84){r13=0;return r13}HEAP32[r11>>2]=HEAP32[r11>>2]+1;r13=0;return r13}function __ZNSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev(r1){return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcb(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r7=STACKTOP;STACKTOP=STACKTOP+40|0;r8=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r8>>2];r8=r7;r9=r7+16;r10=r7+24;if((HEAP32[r4+4>>2]&1|0)==0){r11=HEAP32[HEAP32[r2>>2]+24>>2];HEAP32[r9>>2]=HEAP32[r3>>2];FUNCTION_TABLE[r11](r1,r2,r9,r4,r5,r6&1);STACKTOP=r7;return}r5=HEAP32[r4+28>>2];r4=r5+4|0;tempValue=HEAP32[r4>>2],HEAP32[r4>>2]=tempValue+1,tempValue;if((HEAP32[18176>>2]|0)!=-1){HEAP32[r8>>2]=18176;HEAP32[r8+4>>2]=28;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18176,r8)}r8=HEAP32[18180>>2]-1|0;r4=HEAP32[r5+8>>2];do{if(HEAP32[r5+12>>2]-r4>>2>>>0>r8>>>0){r9=HEAP32[r4+(r8<<2)>>2];if((r9|0)==0){break}r2=r9;r11=r5+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}r11=HEAP32[r9>>2];if(r6){FUNCTION_TABLE[HEAP32[r11+24>>2]](r10,r2)}else{FUNCTION_TABLE[HEAP32[r11+28>>2]](r10,r2)}r2=r10;r11=r10;r9=HEAP8[r11];if((r9&1)==0){r12=r2+1|0;r13=r12;r14=r12;r15=r10+8|0}else{r12=r10+8|0;r13=HEAP32[r12>>2];r14=r2+1|0;r15=r12}r12=r3|0;r2=r10+4|0;r16=r13;r17=r9;while(1){r18=(r17&1)==0;if(r18){r19=r14}else{r19=HEAP32[r15>>2]}r9=r17&255;if((r16|0)==(r19+((r9&1|0)==0?r9>>>1:HEAP32[r2>>2])|0)){break}r9=HEAP8[r16];r20=HEAP32[r12>>2];do{if((r20|0)!=0){r21=r20+24|0;r22=HEAP32[r21>>2];if((r22|0)!=(HEAP32[r20+28>>2]|0)){HEAP32[r21>>2]=r22+1;HEAP8[r22]=r9;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+52>>2]](r20,r9&255)|0)!=-1){break}HEAP32[r12>>2]=0}}while(0);r16=r16+1|0;r17=HEAP8[r11]}HEAP32[r1>>2]=HEAP32[r12>>2];if(r18){STACKTOP=r7;return}r11=HEAP32[r10+8>>2];if((r11|0)==0){STACKTOP=r7;return}_free(r11);STACKTOP=r7;return}}while(0);r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=6520;___cxa_throw(r7,13200,578)}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcl(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+72|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+24;r12=r8+48;r13=r8+56;r14=r8+64;r15=r9|0;HEAP8[r15]=HEAP8[6464];HEAP8[r15+1|0]=HEAP8[6465];HEAP8[r15+2|0]=HEAP8[6466];HEAP8[r15+3|0]=HEAP8[6467];HEAP8[r15+4|0]=HEAP8[6468];HEAP8[r15+5|0]=HEAP8[6469];r16=r9+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r16}else{HEAP8[r16]=43;r19=r9+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;r19=r20+1|0;r20=r18&74;do{if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else if((r20|0)==64){HEAP8[r19]=111}else{HEAP8[r19]=100}}while(0);r19=r10|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,12,HEAP32[17128>>2],r15,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r6,r7));STACKTOP=r7;r7=r10+r20|0;r6=HEAP32[r17>>2]&176;do{if((r6|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r10+1|0;break}if(!((r20|0)>1&r17<<24>>24==48)){r2=3074;break}r17=HEAP8[r10+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=3074;break}r21=r10+2|0}else if((r6|0)==32){r21=r7}else{r2=3074}}while(0);if(r2==3074){r21=r19}r2=r11|0;r11=r14|0;r6=HEAP32[r4+28>>2];HEAP32[r11>>2]=r6;r10=r6+4|0;tempValue=HEAP32[r10>>2],HEAP32[r10>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIcE21__widen_and_group_intEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r19,r21,r7,r2,r12,r13,r14);r14=HEAP32[r11>>2];r11=r14+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+8>>2]](r14|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}function __ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r1,r2,r3,r4,r5){var r6,r7,r8;r6=STACKTOP;STACKTOP=STACKTOP+16|0;r7=r6;r8=r7;HEAP32[r8>>2]=r5;HEAP32[r8+4>>2]=0;r8=_uselocale(r3);r3=_vsnprintf(r1,r2,r4,r7|0);if((r8|0)==0){STACKTOP=r6;return r3}_uselocale(r8);STACKTOP=r6;return r3}function __ZNSt3__19__num_putIcE21__widen_and_group_intEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r8=STACKTOP;STACKTOP=STACKTOP+48|0;r9=r8;r10=r8+16;r11=r8+32;r12=r7|0;r7=HEAP32[r12>>2];if((HEAP32[18560>>2]|0)!=-1){HEAP32[r10>>2]=18560;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r10)}r10=HEAP32[18564>>2]-1|0;r13=HEAP32[r7+8>>2];if(HEAP32[r7+12>>2]-r13>>2>>>0<=r10>>>0){r14=___cxa_allocate_exception(4);r15=r14;HEAP32[r15>>2]=6520;___cxa_throw(r14,13200,578)}r7=HEAP32[r13+(r10<<2)>>2];if((r7|0)==0){r14=___cxa_allocate_exception(4);r15=r14;HEAP32[r15>>2]=6520;___cxa_throw(r14,13200,578)}r14=r7;r15=HEAP32[r12>>2];if((HEAP32[18176>>2]|0)!=-1){HEAP32[r9>>2]=18176;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18176,r9)}r9=HEAP32[18180>>2]-1|0;r12=HEAP32[r15+8>>2];if(HEAP32[r15+12>>2]-r12>>2>>>0<=r9>>>0){r16=___cxa_allocate_exception(4);r17=r16;HEAP32[r17>>2]=6520;___cxa_throw(r16,13200,578)}r15=HEAP32[r12+(r9<<2)>>2];if((r15|0)==0){r16=___cxa_allocate_exception(4);r17=r16;HEAP32[r17>>2]=6520;___cxa_throw(r16,13200,578)}r16=r15;FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+20>>2]](r11,r16);r17=r11;r9=r11;r12=HEAPU8[r9];if((r12&1|0)==0){r18=r12>>>1}else{r18=HEAP32[r11+4>>2]}do{if((r18|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+32>>2]](r14,r1,r3,r4);HEAP32[r6>>2]=r4+(r3-r1)}else{HEAP32[r6>>2]=r4;r12=HEAP8[r1];if(r12<<24>>24==45|r12<<24>>24==43){r10=FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+28>>2]](r14,r12);r12=HEAP32[r6>>2];HEAP32[r6>>2]=r12+1;HEAP8[r12]=r10;r19=r1+1|0}else{r19=r1}do{if((r3-r19|0)>1){if((HEAP8[r19]|0)!=48){r20=r19;break}r10=r19+1|0;r12=HEAP8[r10];if(!(r12<<24>>24==120|r12<<24>>24==88)){r20=r19;break}r12=r7;r13=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+28>>2]](r14,48);r21=HEAP32[r6>>2];HEAP32[r6>>2]=r21+1;HEAP8[r21]=r13;r13=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+28>>2]](r14,HEAP8[r10]);r10=HEAP32[r6>>2];HEAP32[r6>>2]=r10+1;HEAP8[r10]=r13;r20=r19+2|0}else{r20=r19}}while(0);do{if((r20|0)!=(r3|0)){r13=r3-1|0;if(r20>>>0<r13>>>0){r22=r20;r23=r13}else{break}while(1){r13=HEAP8[r22];HEAP8[r22]=HEAP8[r23];HEAP8[r23]=r13;r13=r22+1|0;r10=r23-1|0;if(r13>>>0<r10>>>0){r22=r13;r23=r10}else{break}}}}while(0);r10=FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+16>>2]](r16);if(r20>>>0<r3>>>0){r13=r17+1|0;r12=r7;r21=r11+4|0;r24=r11+8|0;r25=0;r26=0;r27=r20;while(1){r28=HEAP8[((HEAP8[r9]&1)==0?r13:HEAP32[r24>>2])+r26|0];if(r28<<24>>24!=0&(r25|0)==(r28<<24>>24|0)){r28=HEAP32[r6>>2];HEAP32[r6>>2]=r28+1;HEAP8[r28]=r10;r28=HEAPU8[r9];r29=(r26>>>0<(((r28&1|0)==0?r28>>>1:HEAP32[r21>>2])-1|0)>>>0)+r26|0;r30=0}else{r29=r26;r30=r25}r28=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+28>>2]](r14,HEAP8[r27]);r31=HEAP32[r6>>2];HEAP32[r6>>2]=r31+1;HEAP8[r31]=r28;r28=r27+1|0;if(r28>>>0<r3>>>0){r25=r30+1|0;r26=r29;r27=r28}else{break}}}r27=r4+(r20-r1)|0;r26=HEAP32[r6>>2];if((r27|0)==(r26|0)){break}r25=r26-1|0;if(r27>>>0<r25>>>0){r32=r27;r33=r25}else{break}while(1){r25=HEAP8[r32];HEAP8[r32]=HEAP8[r33];HEAP8[r33]=r25;r25=r32+1|0;r27=r33-1|0;if(r25>>>0<r27>>>0){r32=r25;r33=r27}else{break}}}}while(0);if((r2|0)==(r3|0)){r34=HEAP32[r6>>2]}else{r34=r4+(r2-r1)|0}HEAP32[r5>>2]=r34;if((HEAP8[r9]&1)==0){STACKTOP=r8;return}r9=HEAP32[r11+8>>2];if((r9|0)==0){STACKTOP=r8;return}_free(r9);STACKTOP=r8;return}function __ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+16|0;r10=r9;if((r2|0)==0){HEAP32[r1>>2]=0;STACKTOP=r9;return}r11=r5;r5=r3;r12=r11-r5|0;r13=r6+12|0;r6=HEAP32[r13>>2];r14=(r6|0)>(r12|0)?r6-r12|0:0;r12=r4;r6=r12-r5|0;do{if((r6|0)>0){if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+48>>2]](r2,r3,r6)|0)==(r6|0)){break}HEAP32[r1>>2]=0;STACKTOP=r9;return}}while(0);do{if((r14|0)>0){do{if(r14>>>0<11){r6=r10;HEAP8[r6]=r14<<1&255;r15=r10+1|0;r16=r6}else{r6=r14+16&-16;r3=(r6|0)==0?1:r6;while(1){r17=_malloc(r3);if((r17|0)!=0){r8=3167;break}r5=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r5|0)==0){break}FUNCTION_TABLE[r5]()}if(r8==3167){HEAP32[r10+8>>2]=r17;HEAP32[r10>>2]=r6|1;HEAP32[r10+4>>2]=r14;r15=r17;r16=r10;break}r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=6488;___cxa_throw(r3,13184,74)}}while(0);_memset(r15,r7,r14);HEAP8[r15+r14|0]=0;if((HEAP8[r16]&1)==0){r18=r10+1|0}else{r18=HEAP32[r10+8>>2]}if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+48>>2]](r2,r18,r14)|0)==(r14|0)){if((HEAP8[r16]&1)==0){break}r3=HEAP32[r10+8>>2];if((r3|0)==0){break}_free(r3);break}HEAP32[r1>>2]=0;if((HEAP8[r16]&1)==0){STACKTOP=r9;return}r3=HEAP32[r10+8>>2];if((r3|0)==0){STACKTOP=r9;return}_free(r3);STACKTOP=r9;return}}while(0);r10=r11-r12|0;do{if((r10|0)>0){if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+48>>2]](r2,r4,r10)|0)==(r10|0)){break}HEAP32[r1>>2]=0;STACKTOP=r9;return}}while(0);HEAP32[r13>>2]=0;HEAP32[r1>>2]=r2;STACKTOP=r9;return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcx(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+104|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r9;r11=r9+8;r12=r9+32;r13=r9+80;r14=r9+88;r15=r9+96;HEAP32[r10>>2]=37;HEAP32[r10+4>>2]=0;r16=r10;r10=r16+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r10}else{HEAP8[r10]=43;r19=r16+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;HEAP8[r20+1|0]=108;r19=r20+2|0;r20=r18&74;do{if((r20|0)==64){HEAP8[r19]=111}else if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else{HEAP8[r19]=100}}while(0);r19=r11|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r18=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,22,HEAP32[17128>>2],r16,(r8=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r8>>2]=r6,HEAP32[r8+8>>2]=r7,r8));STACKTOP=r8;r8=r11+r18|0;r7=HEAP32[r17>>2]&176;do{if((r7|0)==32){r21=r8}else if((r7|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r11+1|0;break}if(!((r18|0)>1&r17<<24>>24==48)){r2=3216;break}r17=HEAP8[r11+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=3216;break}r21=r11+2|0}else{r2=3216}}while(0);if(r2==3216){r21=r19}r2=r12|0;r12=r15|0;r11=HEAP32[r4+28>>2];HEAP32[r12>>2]=r11;r18=r11+4|0;tempValue=HEAP32[r18>>2],HEAP32[r18>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIcE21__widen_and_group_intEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r19,r21,r8,r2,r13,r14,r15);r15=HEAP32[r12>>2];r12=r15+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcm(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+72|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+24;r12=r8+48;r13=r8+56;r14=r8+64;r15=r9|0;HEAP8[r15]=HEAP8[6464];HEAP8[r15+1|0]=HEAP8[6465];HEAP8[r15+2|0]=HEAP8[6466];HEAP8[r15+3|0]=HEAP8[6467];HEAP8[r15+4|0]=HEAP8[6468];HEAP8[r15+5|0]=HEAP8[6469];r16=r9+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r16}else{HEAP8[r16]=43;r19=r9+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;r19=r20+1|0;r20=r18&74;do{if((r20|0)==64){HEAP8[r19]=111}else if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else{HEAP8[r19]=117}}while(0);r19=r10|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r18=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,12,HEAP32[17128>>2],r15,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r6,r7));STACKTOP=r7;r7=r10+r18|0;r6=HEAP32[r17>>2]&176;do{if((r6|0)==32){r21=r7}else if((r6|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r10+1|0;break}if(!((r18|0)>1&r17<<24>>24==48)){r2=3247;break}r17=HEAP8[r10+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=3247;break}r21=r10+2|0}else{r2=3247}}while(0);if(r2==3247){r21=r19}r2=r11|0;r11=r14|0;r10=HEAP32[r4+28>>2];HEAP32[r11>>2]=r10;r18=r10+4|0;tempValue=HEAP32[r18>>2],HEAP32[r18>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIcE21__widen_and_group_intEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r19,r21,r7,r2,r12,r13,r14);r14=HEAP32[r11>>2];r11=r14+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+8>>2]](r14|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcy(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+104|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r9;r11=r9+8;r12=r9+32;r13=r9+80;r14=r9+88;r15=r9+96;HEAP32[r10>>2]=37;HEAP32[r10+4>>2]=0;r16=r10;r10=r16+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r10}else{HEAP8[r10]=43;r19=r16+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;HEAP8[r20+1|0]=108;r19=r20+2|0;r20=r18&74;do{if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else if((r20|0)==64){HEAP8[r19]=111}else{HEAP8[r19]=117}}while(0);r19=r11|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,23,HEAP32[17128>>2],r16,(r8=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r8>>2]=r6,HEAP32[r8+8>>2]=r7,r8));STACKTOP=r8;r8=r11+r20|0;r7=HEAP32[r17>>2]&176;do{if((r7|0)==32){r21=r8}else if((r7|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r11+1|0;break}if(!((r20|0)>1&r17<<24>>24==48)){r2=3278;break}r17=HEAP8[r11+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=3278;break}r21=r11+2|0}else{r2=3278}}while(0);if(r2==3278){r21=r19}r2=r12|0;r12=r15|0;r11=HEAP32[r4+28>>2];HEAP32[r12>>2]=r11;r20=r11+4|0;tempValue=HEAP32[r20>>2],HEAP32[r20>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIcE21__widen_and_group_intEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r19,r21,r8,r2,r13,r14,r15);r15=HEAP32[r12>>2];r12=r15+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcd(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+144|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+40;r12=r8+48;r13=r8+112;r14=r8+120;r15=r8+128;r16=r8+136;HEAP32[r9>>2]=37;HEAP32[r9+4>>2]=0;r17=r9;r9=r17+1|0;r18=r4+4|0;r19=HEAP32[r18>>2];if((r19&2048|0)==0){r20=r9}else{HEAP8[r9]=43;r20=r17+2|0}if((r19&1024|0)==0){r21=r20}else{HEAP8[r20]=35;r21=r20+1|0}r20=r19&260;r9=r19>>>14;do{if((r20|0)==260){if((r9&1|0)==0){HEAP8[r21]=97;r22=0;break}else{HEAP8[r21]=65;r22=0;break}}else{HEAP8[r21]=46;r19=r21+2|0;HEAP8[r21+1|0]=42;if((r20|0)==4){if((r9&1|0)==0){HEAP8[r19]=102;r22=1;break}else{HEAP8[r19]=70;r22=1;break}}else if((r20|0)==256){if((r9&1|0)==0){HEAP8[r19]=101;r22=1;break}else{HEAP8[r19]=69;r22=1;break}}else{if((r9&1|0)==0){HEAP8[r19]=103;r22=1;break}else{HEAP8[r19]=71;r22=1;break}}}}while(0);r9=r10|0;HEAP32[r11>>2]=r9;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=HEAP32[17128>>2];if(r22){r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r23=r20}else{r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r7>>3]=r6,r7));STACKTOP=r7;r23=r20}do{if((r23|0)>29){r20=(HEAP8[19120]|0)==0;if(r22){do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r24=r10}else{do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r24=r20}r20=HEAP32[r11>>2];if((r20|0)!=0){r25=r24;r26=r20;r27=r20;break}r20=___cxa_allocate_exception(4);HEAP32[r20>>2]=6488;___cxa_throw(r20,13184,74)}else{r25=r23;r26=0;r27=HEAP32[r11>>2]}}while(0);r11=r27+r25|0;r23=HEAP32[r18>>2]&176;do{if((r23|0)==32){r28=r11}else if((r23|0)==16){r18=HEAP8[r27];if(r18<<24>>24==45|r18<<24>>24==43){r28=r27+1|0;break}if(!((r25|0)>1&r18<<24>>24==48)){r2=3340;break}r18=HEAP8[r27+1|0];if(!(r18<<24>>24==120|r18<<24>>24==88)){r2=3340;break}r28=r27+2|0}else{r2=3340}}while(0);if(r2==3340){r28=r27}do{if((r27|0)==(r9|0)){r29=r12|0;r30=0;r31=r9}else{r2=_malloc(r25<<1);if((r2|0)!=0){r29=r2;r30=r2;r31=r27;break}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}}while(0);r27=r15|0;r25=HEAP32[r4+28>>2];HEAP32[r27>>2]=r25;r9=r25+4|0;tempValue=HEAP32[r9>>2],HEAP32[r9>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIcE23__widen_and_group_floatEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r31,r28,r11,r29,r13,r14,r15);r15=HEAP32[r27>>2];r27=r15+4|0;if(((tempValue=HEAP32[r27>>2],HEAP32[r27>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0)}r15=r3|0;__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r16,HEAP32[r15>>2],r29,HEAP32[r13>>2],HEAP32[r14>>2],r4,r5);r5=HEAP32[r16>>2];HEAP32[r15>>2]=r5;HEAP32[r1>>2]=r5;if((r30|0)!=0){_free(r30)}if((r26|0)==0){STACKTOP=r8;return}_free(r26);STACKTOP=r8;return}function __ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r6;HEAP32[r7>>2]=r4;HEAP32[r7+4>>2]=0;r7=_uselocale(r2);r2=_vasprintf(r1,r3,r6|0);if((r7|0)==0){STACKTOP=r5;return r2}_uselocale(r7);STACKTOP=r5;return r2}function __ZNSt3__19__num_putIcE23__widen_and_group_floatEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+48|0;r10=r9;r11=r9+16;r12=r9+32;r13=r7|0;r7=HEAP32[r13>>2];if((HEAP32[18560>>2]|0)!=-1){HEAP32[r11>>2]=18560;HEAP32[r11+4>>2]=28;HEAP32[r11+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r11)}r11=HEAP32[18564>>2]-1|0;r14=HEAP32[r7+8>>2];if(HEAP32[r7+12>>2]-r14>>2>>>0<=r11>>>0){r15=___cxa_allocate_exception(4);r16=r15;HEAP32[r16>>2]=6520;___cxa_throw(r15,13200,578)}r7=HEAP32[r14+(r11<<2)>>2];if((r7|0)==0){r15=___cxa_allocate_exception(4);r16=r15;HEAP32[r16>>2]=6520;___cxa_throw(r15,13200,578)}r15=r7;r16=HEAP32[r13>>2];if((HEAP32[18176>>2]|0)!=-1){HEAP32[r10>>2]=18176;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18176,r10)}r10=HEAP32[18180>>2]-1|0;r13=HEAP32[r16+8>>2];if(HEAP32[r16+12>>2]-r13>>2>>>0<=r10>>>0){r17=___cxa_allocate_exception(4);r18=r17;HEAP32[r18>>2]=6520;___cxa_throw(r17,13200,578)}r16=HEAP32[r13+(r10<<2)>>2];if((r16|0)==0){r17=___cxa_allocate_exception(4);r18=r17;HEAP32[r18>>2]=6520;___cxa_throw(r17,13200,578)}r17=r16;FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+20>>2]](r12,r17);HEAP32[r6>>2]=r4;r18=HEAP8[r1];if(r18<<24>>24==45|r18<<24>>24==43){r10=FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+28>>2]](r15,r18);r18=HEAP32[r6>>2];HEAP32[r6>>2]=r18+1;HEAP8[r18]=r10;r19=r1+1|0}else{r19=r1}r10=r3;L3788:do{if((r10-r19|0)>1){if((HEAP8[r19]|0)!=48){r20=r19;r8=3411;break}r18=r19+1|0;r13=HEAP8[r18];if(!(r13<<24>>24==120|r13<<24>>24==88)){r20=r19;r8=3411;break}r13=r7;r11=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+28>>2]](r15,48);r14=HEAP32[r6>>2];HEAP32[r6>>2]=r14+1;HEAP8[r14]=r11;r11=r19+2|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+28>>2]](r15,HEAP8[r18]);r18=HEAP32[r6>>2];HEAP32[r6>>2]=r18+1;HEAP8[r18]=r14;r14=r11;while(1){if(r14>>>0>=r3>>>0){r21=r14;r22=r11;break L3788}r18=HEAP8[r14];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((_isxdigit(r18<<24>>24,HEAP32[17128>>2])|0)==0){r21=r14;r22=r11;break}else{r14=r14+1|0}}}else{r20=r19;r8=3411}}while(0);L3803:do{if(r8==3411){while(1){r8=0;if(r20>>>0>=r3>>>0){r21=r20;r22=r19;break L3803}r14=HEAP8[r20];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((_isdigit(r14<<24>>24,HEAP32[17128>>2])|0)==0){r21=r20;r22=r19;break}else{r20=r20+1|0;r8=3411}}}}while(0);r8=r12;r20=r12;r19=HEAPU8[r20];if((r19&1|0)==0){r23=r19>>>1}else{r23=HEAP32[r12+4>>2]}do{if((r23|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+32>>2]](r15,r22,r21,HEAP32[r6>>2]);HEAP32[r6>>2]=HEAP32[r6>>2]+(r21-r22)}else{do{if((r22|0)!=(r21|0)){r19=r21-1|0;if(r22>>>0<r19>>>0){r24=r22;r25=r19}else{break}while(1){r19=HEAP8[r24];HEAP8[r24]=HEAP8[r25];HEAP8[r25]=r19;r19=r24+1|0;r18=r25-1|0;if(r19>>>0<r18>>>0){r24=r19;r25=r18}else{break}}}}while(0);r14=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+16>>2]](r17);if(r22>>>0<r21>>>0){r18=r8+1|0;r19=r12+4|0;r11=r12+8|0;r13=r7;r26=0;r27=0;r28=r22;while(1){r29=HEAP8[((HEAP8[r20]&1)==0?r18:HEAP32[r11>>2])+r27|0];if(r29<<24>>24>0&(r26|0)==(r29<<24>>24|0)){r29=HEAP32[r6>>2];HEAP32[r6>>2]=r29+1;HEAP8[r29]=r14;r29=HEAPU8[r20];r30=(r27>>>0<(((r29&1|0)==0?r29>>>1:HEAP32[r19>>2])-1|0)>>>0)+r27|0;r31=0}else{r30=r27;r31=r26}r29=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+28>>2]](r15,HEAP8[r28]);r32=HEAP32[r6>>2];HEAP32[r6>>2]=r32+1;HEAP8[r32]=r29;r29=r28+1|0;if(r29>>>0<r21>>>0){r26=r31+1|0;r27=r30;r28=r29}else{break}}}r28=r4+(r22-r1)|0;r27=HEAP32[r6>>2];if((r28|0)==(r27|0)){break}r26=r27-1|0;if(r28>>>0<r26>>>0){r33=r28;r34=r26}else{break}while(1){r26=HEAP8[r33];HEAP8[r33]=HEAP8[r34];HEAP8[r34]=r26;r26=r33+1|0;r28=r34-1|0;if(r26>>>0<r28>>>0){r33=r26;r34=r28}else{break}}}}while(0);L3841:do{if(r21>>>0<r3>>>0){r34=r7;r33=r21;while(1){r22=HEAP8[r33];if(r22<<24>>24==46){break}r30=FUNCTION_TABLE[HEAP32[HEAP32[r34>>2]+28>>2]](r15,r22);r22=HEAP32[r6>>2];HEAP32[r6>>2]=r22+1;HEAP8[r22]=r30;r30=r33+1|0;if(r30>>>0<r3>>>0){r33=r30}else{r35=r30;break L3841}}r34=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+12>>2]](r17);r30=HEAP32[r6>>2];HEAP32[r6>>2]=r30+1;HEAP8[r30]=r34;r35=r33+1|0}else{r35=r21}}while(0);FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+32>>2]](r15,r35,r3,HEAP32[r6>>2]);r15=HEAP32[r6>>2]+(r10-r35)|0;HEAP32[r6>>2]=r15;if((r2|0)==(r3|0)){r36=r15}else{r36=r4+(r2-r1)|0}HEAP32[r5>>2]=r36;if((HEAP8[r20]&1)==0){STACKTOP=r9;return}r20=HEAP32[r12+8>>2];if((r20|0)==0){STACKTOP=r9;return}_free(r20);STACKTOP=r9;return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEce(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+144|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+40;r12=r8+48;r13=r8+112;r14=r8+120;r15=r8+128;r16=r8+136;HEAP32[r9>>2]=37;HEAP32[r9+4>>2]=0;r17=r9;r9=r17+1|0;r18=r4+4|0;r19=HEAP32[r18>>2];if((r19&2048|0)==0){r20=r9}else{HEAP8[r9]=43;r20=r17+2|0}if((r19&1024|0)==0){r21=r20}else{HEAP8[r20]=35;r21=r20+1|0}r20=r19&260;r9=r19>>>14;do{if((r20|0)==260){HEAP8[r21]=76;r19=r21+1|0;if((r9&1|0)==0){HEAP8[r19]=97;r22=0;break}else{HEAP8[r19]=65;r22=0;break}}else{HEAP8[r21]=46;HEAP8[r21+1|0]=42;HEAP8[r21+2|0]=76;r19=r21+3|0;if((r20|0)==4){if((r9&1|0)==0){HEAP8[r19]=102;r22=1;break}else{HEAP8[r19]=70;r22=1;break}}else if((r20|0)==256){if((r9&1|0)==0){HEAP8[r19]=101;r22=1;break}else{HEAP8[r19]=69;r22=1;break}}else{if((r9&1|0)==0){HEAP8[r19]=103;r22=1;break}else{HEAP8[r19]=71;r22=1;break}}}}while(0);r9=r10|0;HEAP32[r11>>2]=r9;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=HEAP32[17128>>2];if(r22){r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r23=r20}else{r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r7>>3]=r6,r7));STACKTOP=r7;r23=r20}do{if((r23|0)>29){r20=(HEAP8[19120]|0)==0;if(r22){do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r24=r10}else{do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r7>>3]=r6,r7));STACKTOP=r7;r24=r20}r20=HEAP32[r11>>2];if((r20|0)!=0){r25=r24;r26=r20;r27=r20;break}r20=___cxa_allocate_exception(4);HEAP32[r20>>2]=6488;___cxa_throw(r20,13184,74)}else{r25=r23;r26=0;r27=HEAP32[r11>>2]}}while(0);r11=r27+r25|0;r23=HEAP32[r18>>2]&176;do{if((r23|0)==16){r18=HEAP8[r27];if(r18<<24>>24==45|r18<<24>>24==43){r28=r27+1|0;break}if(!((r25|0)>1&r18<<24>>24==48)){r2=53;break}r18=HEAP8[r27+1|0];if(!(r18<<24>>24==120|r18<<24>>24==88)){r2=53;break}r28=r27+2|0}else if((r23|0)==32){r28=r11}else{r2=53}}while(0);if(r2==53){r28=r27}do{if((r27|0)==(r9|0)){r29=r12|0;r30=0;r31=r9}else{r2=_malloc(r25<<1);if((r2|0)!=0){r29=r2;r30=r2;r31=r27;break}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6488;___cxa_throw(r2,13184,74)}}while(0);r27=r15|0;r25=HEAP32[r4+28>>2];HEAP32[r27>>2]=r25;r9=r25+4|0;tempValue=HEAP32[r9>>2],HEAP32[r9>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIcE23__widen_and_group_floatEPcS2_S2_S2_RS2_S3_RKNS_6localeE(r31,r28,r11,r29,r13,r14,r15);r15=HEAP32[r27>>2];r27=r15+4|0;if(((tempValue=HEAP32[r27>>2],HEAP32[r27>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0)}r15=r3|0;__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r16,HEAP32[r15>>2],r29,HEAP32[r13>>2],HEAP32[r14>>2],r4,r5);r5=HEAP32[r16>>2];HEAP32[r15>>2]=r5;HEAP32[r1>>2]=r5;if((r30|0)!=0){_free(r30)}if((r26|0)==0){STACKTOP=r8;return}_free(r26);STACKTOP=r8;return}function __ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcPKv(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+88|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+24;r11=r8+48;r12=r8+16|0;HEAP8[r12]=HEAP8[6472];HEAP8[r12+1|0]=HEAP8[6473];HEAP8[r12+2|0]=HEAP8[6474];HEAP8[r12+3|0]=HEAP8[6475];HEAP8[r12+4|0]=HEAP8[6476];HEAP8[r12+5|0]=HEAP8[6477];r13=r10|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r14=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r13,20,HEAP32[17128>>2],r12,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r6,r7));STACKTOP=r7;r7=r10+r14|0;r6=HEAP32[r4+4>>2]&176;do{if((r6|0)==16){r12=HEAP8[r13];if(r12<<24>>24==45|r12<<24>>24==43){r15=r10+1|0;break}if(!((r14|0)>1&r12<<24>>24==48)){r2=88;break}r12=HEAP8[r10+1|0];if(!(r12<<24>>24==120|r12<<24>>24==88)){r2=88;break}r15=r10+2|0}else if((r6|0)==32){r15=r7}else{r2=88}}while(0);if(r2==88){r15=r13}r2=HEAP32[r4+28>>2];r6=r2+4|0;tempValue=HEAP32[r6>>2],HEAP32[r6>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r9>>2]=18560;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r9)}r9=HEAP32[18564>>2]-1|0;r6=HEAP32[r2+8>>2];do{if(HEAP32[r2+12>>2]-r6>>2>>>0>r9>>>0){r12=HEAP32[r6+(r9<<2)>>2];if((r12|0)==0){break}r16=r2+4|0;if(((tempValue=HEAP32[r16>>2],HEAP32[r16>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2)}r16=r11|0;FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+32>>2]](r12,r13,r7,r16);r12=r11+r14|0;if((r15|0)==(r7|0)){r17=r12;r18=r3|0;r19=HEAP32[r18>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r19,r16,r17,r12,r4,r5);STACKTOP=r8;return}r17=r11+(r15-r10)|0;r18=r3|0;r19=HEAP32[r18>>2];__ZNSt3__116__pad_and_outputIcNS_11char_traitsIcEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r19,r16,r17,r12,r4,r5);STACKTOP=r8;return}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev(r1){return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwb(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r7=STACKTOP;STACKTOP=STACKTOP+40|0;r8=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r8>>2];r8=r7;r9=r7+16;r10=r7+24;if((HEAP32[r4+4>>2]&1|0)==0){r11=HEAP32[HEAP32[r2>>2]+24>>2];HEAP32[r9>>2]=HEAP32[r3>>2];FUNCTION_TABLE[r11](r1,r2,r9,r4,r5,r6&1);STACKTOP=r7;return}r5=HEAP32[r4+28>>2];r4=r5+4|0;tempValue=HEAP32[r4>>2],HEAP32[r4>>2]=tempValue+1,tempValue;if((HEAP32[18168>>2]|0)!=-1){HEAP32[r8>>2]=18168;HEAP32[r8+4>>2]=28;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18168,r8)}r8=HEAP32[18172>>2]-1|0;r4=HEAP32[r5+8>>2];do{if(HEAP32[r5+12>>2]-r4>>2>>>0>r8>>>0){r9=HEAP32[r4+(r8<<2)>>2];if((r9|0)==0){break}r2=r9;r11=r5+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}r11=HEAP32[r9>>2];if(r6){FUNCTION_TABLE[HEAP32[r11+24>>2]](r10,r2)}else{FUNCTION_TABLE[HEAP32[r11+28>>2]](r10,r2)}r2=r10;r11=HEAP8[r2];if((r11&1)==0){r9=r10+4|0;r12=r9;r13=r9;r14=r10+8|0}else{r9=r10+8|0;r12=HEAP32[r9>>2];r13=r10+4|0;r14=r9}r9=r3|0;r15=r12;r16=r11;while(1){r17=(r16&1)==0;if(r17){r18=r13}else{r18=HEAP32[r14>>2]}r11=r16&255;if((r11&1|0)==0){r19=r11>>>1}else{r19=HEAP32[r13>>2]}if((r15|0)==(r18+(r19<<2)|0)){break}r11=HEAP32[r15>>2];r20=HEAP32[r9>>2];do{if((r20|0)!=0){r21=r20+24|0;r22=HEAP32[r21>>2];if((r22|0)==(HEAP32[r20+28>>2]|0)){r23=FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+52>>2]](r20,r11)}else{HEAP32[r21>>2]=r22+4;HEAP32[r22>>2]=r11;r23=r11}if((r23|0)!=-1){break}HEAP32[r9>>2]=0}}while(0);r15=r15+4|0;r16=HEAP8[r2]}HEAP32[r1>>2]=HEAP32[r9>>2];if(r17){STACKTOP=r7;return}r2=HEAP32[r10+8>>2];if((r2|0)==0){STACKTOP=r7;return}_free(r2);STACKTOP=r7;return}}while(0);r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=6520;___cxa_throw(r7,13200,578)}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwl(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+136|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+24;r12=r8+112;r13=r8+120;r14=r8+128;r15=r9|0;HEAP8[r15]=HEAP8[6464];HEAP8[r15+1|0]=HEAP8[6465];HEAP8[r15+2|0]=HEAP8[6466];HEAP8[r15+3|0]=HEAP8[6467];HEAP8[r15+4|0]=HEAP8[6468];HEAP8[r15+5|0]=HEAP8[6469];r16=r9+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r16}else{HEAP8[r16]=43;r19=r9+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;r19=r20+1|0;r20=r18&74;do{if((r20|0)==64){HEAP8[r19]=111}else if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else{HEAP8[r19]=100}}while(0);r19=r10|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r18=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,12,HEAP32[17128>>2],r15,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r6,r7));STACKTOP=r7;r7=r10+r18|0;r6=HEAP32[r17>>2]&176;do{if((r6|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r10+1|0;break}if(!((r18|0)>1&r17<<24>>24==48)){r2=176;break}r17=HEAP8[r10+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=176;break}r21=r10+2|0}else if((r6|0)==32){r21=r7}else{r2=176}}while(0);if(r2==176){r21=r19}r2=r11|0;r11=r14|0;r6=HEAP32[r4+28>>2];HEAP32[r11>>2]=r6;r10=r6+4|0;tempValue=HEAP32[r10>>2],HEAP32[r10>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIwE21__widen_and_group_intEPcS2_S2_PwRS3_S4_RKNS_6localeE(r19,r21,r7,r2,r12,r13,r14);r14=HEAP32[r11>>2];r11=r14+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+8>>2]](r14|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}function __ZNSt3__19__num_putIwE21__widen_and_group_intEPcS2_S2_PwRS3_S4_RKNS_6localeE(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r8=STACKTOP;STACKTOP=STACKTOP+48|0;r9=r8;r10=r8+16;r11=r8+32;r12=r7|0;r7=HEAP32[r12>>2];if((HEAP32[18552>>2]|0)!=-1){HEAP32[r10>>2]=18552;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r10)}r10=HEAP32[18556>>2]-1|0;r13=HEAP32[r7+8>>2];if(HEAP32[r7+12>>2]-r13>>2>>>0<=r10>>>0){r14=___cxa_allocate_exception(4);r15=r14;HEAP32[r15>>2]=6520;___cxa_throw(r14,13200,578)}r7=HEAP32[r13+(r10<<2)>>2];if((r7|0)==0){r14=___cxa_allocate_exception(4);r15=r14;HEAP32[r15>>2]=6520;___cxa_throw(r14,13200,578)}r14=r7;r15=HEAP32[r12>>2];if((HEAP32[18168>>2]|0)!=-1){HEAP32[r9>>2]=18168;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18168,r9)}r9=HEAP32[18172>>2]-1|0;r12=HEAP32[r15+8>>2];if(HEAP32[r15+12>>2]-r12>>2>>>0<=r9>>>0){r16=___cxa_allocate_exception(4);r17=r16;HEAP32[r17>>2]=6520;___cxa_throw(r16,13200,578)}r15=HEAP32[r12+(r9<<2)>>2];if((r15|0)==0){r16=___cxa_allocate_exception(4);r17=r16;HEAP32[r17>>2]=6520;___cxa_throw(r16,13200,578)}r16=r15;FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+20>>2]](r11,r16);r17=r11;r9=r11;r12=HEAPU8[r9];if((r12&1|0)==0){r18=r12>>>1}else{r18=HEAP32[r11+4>>2]}do{if((r18|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+48>>2]](r14,r1,r3,r4);HEAP32[r6>>2]=r4+(r3-r1<<2)}else{HEAP32[r6>>2]=r4;r12=HEAP8[r1];if(r12<<24>>24==45|r12<<24>>24==43){r10=FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+44>>2]](r14,r12);r12=HEAP32[r6>>2];HEAP32[r6>>2]=r12+4;HEAP32[r12>>2]=r10;r19=r1+1|0}else{r19=r1}do{if((r3-r19|0)>1){if((HEAP8[r19]|0)!=48){r20=r19;break}r10=r19+1|0;r12=HEAP8[r10];if(!(r12<<24>>24==120|r12<<24>>24==88)){r20=r19;break}r12=r7;r13=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+44>>2]](r14,48);r21=HEAP32[r6>>2];HEAP32[r6>>2]=r21+4;HEAP32[r21>>2]=r13;r13=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+44>>2]](r14,HEAP8[r10]);r10=HEAP32[r6>>2];HEAP32[r6>>2]=r10+4;HEAP32[r10>>2]=r13;r20=r19+2|0}else{r20=r19}}while(0);do{if((r20|0)!=(r3|0)){r13=r3-1|0;if(r20>>>0<r13>>>0){r22=r20;r23=r13}else{break}while(1){r13=HEAP8[r22];HEAP8[r22]=HEAP8[r23];HEAP8[r23]=r13;r13=r22+1|0;r10=r23-1|0;if(r13>>>0<r10>>>0){r22=r13;r23=r10}else{break}}}}while(0);r10=FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+16>>2]](r16);if(r20>>>0<r3>>>0){r13=r17+1|0;r12=r7;r21=r11+4|0;r24=r11+8|0;r25=0;r26=0;r27=r20;while(1){r28=HEAP8[((HEAP8[r9]&1)==0?r13:HEAP32[r24>>2])+r26|0];if(r28<<24>>24!=0&(r25|0)==(r28<<24>>24|0)){r28=HEAP32[r6>>2];HEAP32[r6>>2]=r28+4;HEAP32[r28>>2]=r10;r28=HEAPU8[r9];r29=(r26>>>0<(((r28&1|0)==0?r28>>>1:HEAP32[r21>>2])-1|0)>>>0)+r26|0;r30=0}else{r29=r26;r30=r25}r28=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+44>>2]](r14,HEAP8[r27]);r31=HEAP32[r6>>2];HEAP32[r6>>2]=r31+4;HEAP32[r31>>2]=r28;r28=r27+1|0;if(r28>>>0<r3>>>0){r25=r30+1|0;r26=r29;r27=r28}else{break}}}r27=r4+(r20-r1<<2)|0;r26=HEAP32[r6>>2];if((r27|0)==(r26|0)){break}r25=r26-4|0;if(r27>>>0<r25>>>0){r32=r27;r33=r25}else{break}while(1){r25=HEAP32[r32>>2];HEAP32[r32>>2]=HEAP32[r33>>2];HEAP32[r33>>2]=r25;r25=r32+4|0;r27=r33-4|0;if(r25>>>0<r27>>>0){r32=r25;r33=r27}else{break}}}}while(0);if((r2|0)==(r3|0)){r34=HEAP32[r6>>2]}else{r34=r4+(r2-r1<<2)|0}HEAP32[r5>>2]=r34;if((HEAP8[r9]&1)==0){STACKTOP=r8;return}r9=HEAP32[r11+8>>2];if((r9|0)==0){STACKTOP=r8;return}_free(r9);STACKTOP=r8;return}function __ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+16|0;r10=r9;if((r2|0)==0){HEAP32[r1>>2]=0;STACKTOP=r9;return}r11=r5;r5=r3;r12=r11-r5>>2;r13=r6+12|0;r6=HEAP32[r13>>2];r14=(r6|0)>(r12|0)?r6-r12|0:0;r12=r4;r6=r12-r5|0;r5=r6>>2;do{if((r6|0)>0){if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+48>>2]](r2,r3,r5)|0)==(r5|0)){break}HEAP32[r1>>2]=0;STACKTOP=r9;return}}while(0);do{if((r14|0)>0){if(r14>>>0>1073741807){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r14>>>0<2){HEAP8[r10]=r14<<1&255;r15=r10+4|0;r8=266}else{r5=r14+4&-4;r3=r5<<2;r6=(r3|0)==0?1:r3;while(1){r16=_malloc(r6);if((r16|0)!=0){r8=265;break}r3=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r8==265){r6=r16;HEAP32[r10+8>>2]=r6;HEAP32[r10>>2]=r5|1;HEAP32[r10+4>>2]=r14;if((r14|0)==0){r17=r6;break}else{r15=r6;r8=266;break}}r6=___cxa_allocate_exception(4);HEAP32[r6>>2]=6488;___cxa_throw(r6,13184,74)}}while(0);if(r8==266){r6=r14;r3=r15;while(1){r18=r6-1|0;HEAP32[r3>>2]=r7;if((r18|0)==0){r17=r15;break}else{r6=r18;r3=r3+4|0}}}HEAP32[r17+(r14<<2)>>2]=0;r3=r10;if((HEAP8[r3]&1)==0){r19=r10+4|0}else{r19=HEAP32[r10+8>>2]}if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+48>>2]](r2,r19,r14)|0)==(r14|0)){if((HEAP8[r3]&1)==0){break}r6=HEAP32[r10+8>>2];if((r6|0)==0){break}_free(r6);break}HEAP32[r1>>2]=0;if((HEAP8[r3]&1)==0){STACKTOP=r9;return}r3=HEAP32[r10+8>>2];if((r3|0)==0){STACKTOP=r9;return}_free(r3);STACKTOP=r9;return}}while(0);r10=r11-r12|0;r12=r10>>2;do{if((r10|0)>0){if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+48>>2]](r2,r4,r12)|0)==(r12|0)){break}HEAP32[r1>>2]=0;STACKTOP=r9;return}}while(0);HEAP32[r13>>2]=0;HEAP32[r1>>2]=r2;STACKTOP=r9;return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwx(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+224|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r9;r11=r9+8;r12=r9+32;r13=r9+200;r14=r9+208;r15=r9+216;HEAP32[r10>>2]=37;HEAP32[r10+4>>2]=0;r16=r10;r10=r16+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r10}else{HEAP8[r10]=43;r19=r16+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;HEAP8[r20+1|0]=108;r19=r20+2|0;r20=r18&74;do{if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else if((r20|0)==64){HEAP8[r19]=111}else{HEAP8[r19]=100}}while(0);r19=r11|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,22,HEAP32[17128>>2],r16,(r8=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r8>>2]=r6,HEAP32[r8+8>>2]=r7,r8));STACKTOP=r8;r8=r11+r20|0;r7=HEAP32[r17>>2]&176;do{if((r7|0)==32){r21=r8}else if((r7|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r11+1|0;break}if(!((r20|0)>1&r17<<24>>24==48)){r2=316;break}r17=HEAP8[r11+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=316;break}r21=r11+2|0}else{r2=316}}while(0);if(r2==316){r21=r19}r2=r12|0;r12=r15|0;r11=HEAP32[r4+28>>2];HEAP32[r12>>2]=r11;r20=r11+4|0;tempValue=HEAP32[r20>>2],HEAP32[r20>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIwE21__widen_and_group_intEPcS2_S2_PwRS3_S4_RKNS_6localeE(r19,r21,r8,r2,r13,r14,r15);r15=HEAP32[r12>>2];r12=r15+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwm(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+136|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+24;r12=r8+112;r13=r8+120;r14=r8+128;r15=r9|0;HEAP8[r15]=HEAP8[6464];HEAP8[r15+1|0]=HEAP8[6465];HEAP8[r15+2|0]=HEAP8[6466];HEAP8[r15+3|0]=HEAP8[6467];HEAP8[r15+4|0]=HEAP8[6468];HEAP8[r15+5|0]=HEAP8[6469];r16=r9+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r16}else{HEAP8[r16]=43;r19=r9+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;r19=r20+1|0;r20=r18&74;do{if((r20|0)==64){HEAP8[r19]=111}else if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else{HEAP8[r19]=117}}while(0);r19=r10|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r18=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,12,HEAP32[17128>>2],r15,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r6,r7));STACKTOP=r7;r7=r10+r18|0;r6=HEAP32[r17>>2]&176;do{if((r6|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r10+1|0;break}if(!((r18|0)>1&r17<<24>>24==48)){r2=347;break}r17=HEAP8[r10+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=347;break}r21=r10+2|0}else if((r6|0)==32){r21=r7}else{r2=347}}while(0);if(r2==347){r21=r19}r2=r11|0;r11=r14|0;r6=HEAP32[r4+28>>2];HEAP32[r11>>2]=r6;r10=r6+4|0;tempValue=HEAP32[r10>>2],HEAP32[r10>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIwE21__widen_and_group_intEPcS2_S2_PwRS3_S4_RKNS_6localeE(r19,r21,r7,r2,r12,r13,r14);r14=HEAP32[r11>>2];r11=r14+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+8>>2]](r14|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r12>>2];r25=HEAP32[r13>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r8;return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwy(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+232|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r9;r11=r9+8;r12=r9+32;r13=r9+208;r14=r9+216;r15=r9+224;HEAP32[r10>>2]=37;HEAP32[r10+4>>2]=0;r16=r10;r10=r16+1|0;r17=r4+4|0;r18=HEAP32[r17>>2];if((r18&2048|0)==0){r19=r10}else{HEAP8[r10]=43;r19=r16+2|0}if((r18&512|0)==0){r20=r19}else{HEAP8[r19]=35;r20=r19+1|0}HEAP8[r20]=108;HEAP8[r20+1|0]=108;r19=r20+2|0;r20=r18&74;do{if((r20|0)==64){HEAP8[r19]=111}else if((r20|0)==8){if((r18&16384|0)==0){HEAP8[r19]=120;break}else{HEAP8[r19]=88;break}}else{HEAP8[r19]=117}}while(0);r19=r11|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r18=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r19,23,HEAP32[17128>>2],r16,(r8=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r8>>2]=r6,HEAP32[r8+8>>2]=r7,r8));STACKTOP=r8;r8=r11+r18|0;r7=HEAP32[r17>>2]&176;do{if((r7|0)==32){r21=r8}else if((r7|0)==16){r17=HEAP8[r19];if(r17<<24>>24==45|r17<<24>>24==43){r21=r11+1|0;break}if(!((r18|0)>1&r17<<24>>24==48)){r2=378;break}r17=HEAP8[r11+1|0];if(!(r17<<24>>24==120|r17<<24>>24==88)){r2=378;break}r21=r11+2|0}else{r2=378}}while(0);if(r2==378){r21=r19}r2=r12|0;r12=r15|0;r11=HEAP32[r4+28>>2];HEAP32[r12>>2]=r11;r18=r11+4|0;tempValue=HEAP32[r18>>2],HEAP32[r18>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIwE21__widen_and_group_intEPcS2_S2_PwRS3_S4_RKNS_6localeE(r19,r21,r8,r2,r13,r14,r15);r15=HEAP32[r12>>2];r12=r15+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)!=0){r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0);r22=r3|0;r23=HEAP32[r22>>2];r24=HEAP32[r13>>2];r25=HEAP32[r14>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r23,r2,r24,r25,r4,r5);STACKTOP=r9;return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwd(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+312|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+40;r12=r8+48;r13=r8+280;r14=r8+288;r15=r8+296;r16=r8+304;HEAP32[r9>>2]=37;HEAP32[r9+4>>2]=0;r17=r9;r9=r17+1|0;r18=r4+4|0;r19=HEAP32[r18>>2];if((r19&2048|0)==0){r20=r9}else{HEAP8[r9]=43;r20=r17+2|0}if((r19&1024|0)==0){r21=r20}else{HEAP8[r20]=35;r21=r20+1|0}r20=r19&260;r9=r19>>>14;do{if((r20|0)==260){if((r9&1|0)==0){HEAP8[r21]=97;r22=0;break}else{HEAP8[r21]=65;r22=0;break}}else{HEAP8[r21]=46;r19=r21+2|0;HEAP8[r21+1|0]=42;if((r20|0)==4){if((r9&1|0)==0){HEAP8[r19]=102;r22=1;break}else{HEAP8[r19]=70;r22=1;break}}else if((r20|0)==256){if((r9&1|0)==0){HEAP8[r19]=101;r22=1;break}else{HEAP8[r19]=69;r22=1;break}}else{if((r9&1|0)==0){HEAP8[r19]=103;r22=1;break}else{HEAP8[r19]=71;r22=1;break}}}}while(0);r9=r10|0;HEAP32[r11>>2]=r9;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=HEAP32[17128>>2];if(r22){r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r23=r20}else{r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r7>>3]=r6,r7));STACKTOP=r7;r23=r20}do{if((r23|0)>29){r20=(HEAP8[19120]|0)==0;if(r22){do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r24=r10}else{do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r24=r20}r20=HEAP32[r11>>2];if((r20|0)!=0){r25=r24;r26=r20;r27=r20;break}r20=___cxa_allocate_exception(4);HEAP32[r20>>2]=6488;___cxa_throw(r20,13184,74)}else{r25=r23;r26=0;r27=HEAP32[r11>>2]}}while(0);r11=r27+r25|0;r23=HEAP32[r18>>2]&176;do{if((r23|0)==16){r18=HEAP8[r27];if(r18<<24>>24==45|r18<<24>>24==43){r28=r27+1|0;break}if(!((r25|0)>1&r18<<24>>24==48)){r2=440;break}r18=HEAP8[r27+1|0];if(!(r18<<24>>24==120|r18<<24>>24==88)){r2=440;break}r28=r27+2|0}else if((r23|0)==32){r28=r11}else{r2=440}}while(0);if(r2==440){r28=r27}do{if((r27|0)==(r9|0)){r29=r12|0;r30=0;r31=r9}else{r2=_malloc(r25<<3);r23=r2;if((r2|0)!=0){r29=r23;r30=r23;r31=r27;break}r23=___cxa_allocate_exception(4);HEAP32[r23>>2]=6488;___cxa_throw(r23,13184,74)}}while(0);r27=r15|0;r25=HEAP32[r4+28>>2];HEAP32[r27>>2]=r25;r9=r25+4|0;tempValue=HEAP32[r9>>2],HEAP32[r9>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIwE23__widen_and_group_floatEPcS2_S2_PwRS3_S4_RKNS_6localeE(r31,r28,r11,r29,r13,r14,r15);r15=HEAP32[r27>>2];r27=r15+4|0;if(((tempValue=HEAP32[r27>>2],HEAP32[r27>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0)}r15=r3|0;__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r16,HEAP32[r15>>2],r29,HEAP32[r13>>2],HEAP32[r14>>2],r4,r5);r5=HEAP32[r16>>2];HEAP32[r15>>2]=r5;HEAP32[r1>>2]=r5;if((r30|0)!=0){_free(r30)}if((r26|0)==0){STACKTOP=r8;return}_free(r26);STACKTOP=r8;return}function __ZNSt3__19__num_putIwE23__widen_and_group_floatEPcS2_S2_PwRS3_S4_RKNS_6localeE(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+48|0;r10=r9;r11=r9+16;r12=r9+32;r13=r7|0;r7=HEAP32[r13>>2];if((HEAP32[18552>>2]|0)!=-1){HEAP32[r11>>2]=18552;HEAP32[r11+4>>2]=28;HEAP32[r11+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r11)}r11=HEAP32[18556>>2]-1|0;r14=HEAP32[r7+8>>2];if(HEAP32[r7+12>>2]-r14>>2>>>0<=r11>>>0){r15=___cxa_allocate_exception(4);r16=r15;HEAP32[r16>>2]=6520;___cxa_throw(r15,13200,578)}r7=HEAP32[r14+(r11<<2)>>2];if((r7|0)==0){r15=___cxa_allocate_exception(4);r16=r15;HEAP32[r16>>2]=6520;___cxa_throw(r15,13200,578)}r15=r7;r16=HEAP32[r13>>2];if((HEAP32[18168>>2]|0)!=-1){HEAP32[r10>>2]=18168;HEAP32[r10+4>>2]=28;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18168,r10)}r10=HEAP32[18172>>2]-1|0;r13=HEAP32[r16+8>>2];if(HEAP32[r16+12>>2]-r13>>2>>>0<=r10>>>0){r17=___cxa_allocate_exception(4);r18=r17;HEAP32[r18>>2]=6520;___cxa_throw(r17,13200,578)}r16=HEAP32[r13+(r10<<2)>>2];if((r16|0)==0){r17=___cxa_allocate_exception(4);r18=r17;HEAP32[r18>>2]=6520;___cxa_throw(r17,13200,578)}r17=r16;FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+20>>2]](r12,r17);HEAP32[r6>>2]=r4;r18=HEAP8[r1];if(r18<<24>>24==45|r18<<24>>24==43){r10=FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+44>>2]](r15,r18);r18=HEAP32[r6>>2];HEAP32[r6>>2]=r18+4;HEAP32[r18>>2]=r10;r19=r1+1|0}else{r19=r1}r10=r3;L539:do{if((r10-r19|0)>1){if((HEAP8[r19]|0)!=48){r20=r19;r8=500;break}r18=r19+1|0;r13=HEAP8[r18];if(!(r13<<24>>24==120|r13<<24>>24==88)){r20=r19;r8=500;break}r13=r7;r11=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+44>>2]](r15,48);r14=HEAP32[r6>>2];HEAP32[r6>>2]=r14+4;HEAP32[r14>>2]=r11;r11=r19+2|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+44>>2]](r15,HEAP8[r18]);r18=HEAP32[r6>>2];HEAP32[r6>>2]=r18+4;HEAP32[r18>>2]=r14;r14=r11;while(1){if(r14>>>0>=r3>>>0){r21=r14;r22=r11;break L539}r18=HEAP8[r14];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((_isxdigit(r18<<24>>24,HEAP32[17128>>2])|0)==0){r21=r14;r22=r11;break}else{r14=r14+1|0}}}else{r20=r19;r8=500}}while(0);L554:do{if(r8==500){while(1){r8=0;if(r20>>>0>=r3>>>0){r21=r20;r22=r19;break L554}r14=HEAP8[r20];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((_isdigit(r14<<24>>24,HEAP32[17128>>2])|0)==0){r21=r20;r22=r19;break}else{r20=r20+1|0;r8=500}}}}while(0);r8=r12;r20=r12;r19=HEAPU8[r20];if((r19&1|0)==0){r23=r19>>>1}else{r23=HEAP32[r12+4>>2]}do{if((r23|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+48>>2]](r15,r22,r21,HEAP32[r6>>2]);HEAP32[r6>>2]=HEAP32[r6>>2]+(r21-r22<<2)}else{do{if((r22|0)!=(r21|0)){r19=r21-1|0;if(r22>>>0<r19>>>0){r24=r22;r25=r19}else{break}while(1){r19=HEAP8[r24];HEAP8[r24]=HEAP8[r25];HEAP8[r25]=r19;r19=r24+1|0;r18=r25-1|0;if(r19>>>0<r18>>>0){r24=r19;r25=r18}else{break}}}}while(0);r14=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+16>>2]](r17);if(r22>>>0<r21>>>0){r18=r8+1|0;r19=r12+4|0;r11=r12+8|0;r13=r7;r26=0;r27=0;r28=r22;while(1){r29=HEAP8[((HEAP8[r20]&1)==0?r18:HEAP32[r11>>2])+r27|0];if(r29<<24>>24>0&(r26|0)==(r29<<24>>24|0)){r29=HEAP32[r6>>2];HEAP32[r6>>2]=r29+4;HEAP32[r29>>2]=r14;r29=HEAPU8[r20];r30=(r27>>>0<(((r29&1|0)==0?r29>>>1:HEAP32[r19>>2])-1|0)>>>0)+r27|0;r31=0}else{r30=r27;r31=r26}r29=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+44>>2]](r15,HEAP8[r28]);r32=HEAP32[r6>>2];HEAP32[r6>>2]=r32+4;HEAP32[r32>>2]=r29;r29=r28+1|0;if(r29>>>0<r21>>>0){r26=r31+1|0;r27=r30;r28=r29}else{break}}}r28=r4+(r22-r1<<2)|0;r27=HEAP32[r6>>2];if((r28|0)==(r27|0)){break}r26=r27-4|0;if(r28>>>0<r26>>>0){r33=r28;r34=r26}else{break}while(1){r26=HEAP32[r33>>2];HEAP32[r33>>2]=HEAP32[r34>>2];HEAP32[r34>>2]=r26;r26=r33+4|0;r28=r34-4|0;if(r26>>>0<r28>>>0){r33=r26;r34=r28}else{break}}}}while(0);L592:do{if(r21>>>0<r3>>>0){r34=r7;r33=r21;while(1){r22=HEAP8[r33];if(r22<<24>>24==46){break}r30=FUNCTION_TABLE[HEAP32[HEAP32[r34>>2]+44>>2]](r15,r22);r22=HEAP32[r6>>2];HEAP32[r6>>2]=r22+4;HEAP32[r22>>2]=r30;r30=r33+1|0;if(r30>>>0<r3>>>0){r33=r30}else{r35=r30;break L592}}r34=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+12>>2]](r17);r30=HEAP32[r6>>2];HEAP32[r6>>2]=r30+4;HEAP32[r30>>2]=r34;r35=r33+1|0}else{r35=r21}}while(0);FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+48>>2]](r15,r35,r3,HEAP32[r6>>2]);r15=HEAP32[r6>>2]+(r10-r35<<2)|0;HEAP32[r6>>2]=r15;if((r2|0)==(r3|0)){r36=r15}else{r36=r4+(r2-r1<<2)|0}HEAP32[r5>>2]=r36;if((HEAP8[r20]&1)==0){STACKTOP=r9;return}r20=HEAP32[r12+8>>2];if((r20|0)==0){STACKTOP=r9;return}_free(r20);STACKTOP=r9;return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwe(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+312|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+8;r11=r8+40;r12=r8+48;r13=r8+280;r14=r8+288;r15=r8+296;r16=r8+304;HEAP32[r9>>2]=37;HEAP32[r9+4>>2]=0;r17=r9;r9=r17+1|0;r18=r4+4|0;r19=HEAP32[r18>>2];if((r19&2048|0)==0){r20=r9}else{HEAP8[r9]=43;r20=r17+2|0}if((r19&1024|0)==0){r21=r20}else{HEAP8[r20]=35;r21=r20+1|0}r20=r19&260;r9=r19>>>14;do{if((r20|0)==260){HEAP8[r21]=76;r19=r21+1|0;if((r9&1|0)==0){HEAP8[r19]=97;r22=0;break}else{HEAP8[r19]=65;r22=0;break}}else{HEAP8[r21]=46;HEAP8[r21+1|0]=42;HEAP8[r21+2|0]=76;r19=r21+3|0;if((r20|0)==256){if((r9&1|0)==0){HEAP8[r19]=101;r22=1;break}else{HEAP8[r19]=69;r22=1;break}}else if((r20|0)==4){if((r9&1|0)==0){HEAP8[r19]=102;r22=1;break}else{HEAP8[r19]=70;r22=1;break}}else{if((r9&1|0)==0){HEAP8[r19]=103;r22=1;break}else{HEAP8[r19]=71;r22=1;break}}}}while(0);r9=r10|0;HEAP32[r11>>2]=r9;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=HEAP32[17128>>2];if(r22){r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r23=r20}else{r20=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r9,30,r10,r17,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r7>>3]=r6,r7));STACKTOP=r7;r23=r20}do{if((r23|0)>29){r20=(HEAP8[19120]|0)==0;if(r22){do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r10=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=HEAP32[r4+8>>2],HEAPF64[r7+8>>3]=r6,r7));STACKTOP=r7;r24=r10}else{do{if(r20){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r20=__ZNSt3__112__asprintf_lEPPcP15__locale_structPKcz(r11,HEAP32[17128>>2],r17,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r7>>3]=r6,r7));STACKTOP=r7;r24=r20}r20=HEAP32[r11>>2];if((r20|0)!=0){r25=r24;r26=r20;r27=r20;break}r20=___cxa_allocate_exception(4);HEAP32[r20>>2]=6488;___cxa_throw(r20,13184,74)}else{r25=r23;r26=0;r27=HEAP32[r11>>2]}}while(0);r11=r27+r25|0;r23=HEAP32[r18>>2]&176;do{if((r23|0)==16){r18=HEAP8[r27];if(r18<<24>>24==45|r18<<24>>24==43){r28=r27+1|0;break}if(!((r25|0)>1&r18<<24>>24==48)){r2=600;break}r18=HEAP8[r27+1|0];if(!(r18<<24>>24==120|r18<<24>>24==88)){r2=600;break}r28=r27+2|0}else if((r23|0)==32){r28=r11}else{r2=600}}while(0);if(r2==600){r28=r27}do{if((r27|0)==(r9|0)){r29=r12|0;r30=0;r31=r9}else{r2=_malloc(r25<<3);r23=r2;if((r2|0)!=0){r29=r23;r30=r23;r31=r27;break}r23=___cxa_allocate_exception(4);HEAP32[r23>>2]=6488;___cxa_throw(r23,13184,74)}}while(0);r27=r15|0;r25=HEAP32[r4+28>>2];HEAP32[r27>>2]=r25;r9=r25+4|0;tempValue=HEAP32[r9>>2],HEAP32[r9>>2]=tempValue+1,tempValue;__ZNSt3__19__num_putIwE23__widen_and_group_floatEPcS2_S2_PwRS3_S4_RKNS_6localeE(r31,r28,r11,r29,r13,r14,r15);r15=HEAP32[r27>>2];r27=r15+4|0;if(((tempValue=HEAP32[r27>>2],HEAP32[r27>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+8>>2]](r15|0)}r15=r3|0;__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r16,HEAP32[r15>>2],r29,HEAP32[r13>>2],HEAP32[r14>>2],r4,r5);r5=HEAP32[r16>>2];HEAP32[r15>>2]=r5;HEAP32[r1>>2]=r5;if((r30|0)!=0){_free(r30)}if((r26|0)==0){STACKTOP=r8;return}_free(r26);STACKTOP=r8;return}function __ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwPKv(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+200|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r8;r10=r8+24;r11=r8+48;r12=r8+16|0;HEAP8[r12]=HEAP8[6472];HEAP8[r12+1|0]=HEAP8[6473];HEAP8[r12+2|0]=HEAP8[6474];HEAP8[r12+3|0]=HEAP8[6475];HEAP8[r12+4|0]=HEAP8[6476];HEAP8[r12+5|0]=HEAP8[6477];r13=r10|0;do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);r14=__ZNSt3__112__snprintf_lEPcjP15__locale_structPKcz(r13,20,HEAP32[17128>>2],r12,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r6,r7));STACKTOP=r7;r7=r10+r14|0;r6=HEAP32[r4+4>>2]&176;do{if((r6|0)==32){r15=r7}else if((r6|0)==16){r12=HEAP8[r13];if(r12<<24>>24==45|r12<<24>>24==43){r15=r10+1|0;break}if(!((r14|0)>1&r12<<24>>24==48)){r2=635;break}r12=HEAP8[r10+1|0];if(!(r12<<24>>24==120|r12<<24>>24==88)){r2=635;break}r15=r10+2|0}else{r2=635}}while(0);if(r2==635){r15=r13}r2=HEAP32[r4+28>>2];r6=r2+4|0;tempValue=HEAP32[r6>>2],HEAP32[r6>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r9>>2]=18552;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r9)}r9=HEAP32[18556>>2]-1|0;r6=HEAP32[r2+8>>2];do{if(HEAP32[r2+12>>2]-r6>>2>>>0>r9>>>0){r12=HEAP32[r6+(r9<<2)>>2];if((r12|0)==0){break}r16=r2+4|0;if(((tempValue=HEAP32[r16>>2],HEAP32[r16>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2)}r16=r11|0;FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+48>>2]](r12,r13,r7,r16);r12=r11+(r14<<2)|0;if((r15|0)==(r7|0)){r17=r12;r18=r3|0;r19=HEAP32[r18>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r19,r16,r17,r12,r4,r5);STACKTOP=r8;return}r17=r11+(r15-r10<<2)|0;r18=r3|0;r19=HEAP32[r18>>2];__ZNSt3__116__pad_and_outputIwNS_11char_traitsIwEEEENS_19ostreambuf_iteratorIT_T0_EES6_PKS4_S8_S8_RNS_8ios_baseES4_(r1,r19,r16,r17,r12,r4,r5);STACKTOP=r8;return}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r1,r2,r3,r4,r5,r6,r7,r8,r9){var r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63;r10=0;r11=STACKTOP;STACKTOP=STACKTOP+40|0;r12=r11;r13=r11+16;r14=r11+24;r15=r11+32;r16=HEAP32[r5+28>>2];r17=r16+4|0;tempValue=HEAP32[r17>>2],HEAP32[r17>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r12>>2]=18560;HEAP32[r12+4>>2]=28;HEAP32[r12+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r12)}r12=HEAP32[18564>>2]-1|0;r17=HEAP32[r16+8>>2];do{if(HEAP32[r16+12>>2]-r17>>2>>>0>r12>>>0){r18=HEAP32[r17+(r12<<2)>>2];if((r18|0)==0){break}r19=r18;r20=r16+4|0;if(((tempValue=HEAP32[r20>>2],HEAP32[r20>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+8>>2]](r16)}HEAP32[r6>>2]=0;L736:do{if((r8|0)==(r9|0)){r21=r4;r22=r3}else{r20=r18;r23=r18;r24=r18+8|0;r25=r2;r26=r14|0;r27=r15|0;r28=r13|0;r29=r8;r30=0;r31=r4;r32=r3;L738:while(1){r33=r30;r34=r31;r35=r32;while(1){if((r33|0)!=0){r21=r34;r22=r35;break L736}do{if((r35|0)==0){r36=0}else{if((HEAP32[r35+12>>2]|0)!=(HEAP32[r35+16>>2]|0)){r36=r35;break}r37=(FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)|0)==-1;r36=r37?0:r35}}while(0);r37=(r36|0)==0;do{if((r34|0)==0){r10=671}else{if((HEAP32[r34+12>>2]|0)==(HEAP32[r34+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r34>>2]+36>>2]](r34)|0)==-1){r10=671;break}}if(r37){r38=r34}else{r39=r34;r10=672;break L738}}}while(0);if(r10==671){r10=0;if(r37){r39=0;r10=672;break L738}else{r38=0}}if(FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+36>>2]](r19,HEAP8[r29],0)<<24>>24==37){r10=677;break}r40=HEAP8[r29];if(r40<<24>>24>=0){r41=HEAP32[r24>>2];if((HEAP16[r41+(r40<<24>>24<<1)>>1]&8192)!=0){r42=r29;r10=688;break}}r43=r36+12|0;r40=HEAP32[r43>>2];r44=r36+16|0;if((r40|0)==(HEAP32[r44>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r36>>2]+36>>2]](r36)&255}else{r45=HEAP8[r40]}r40=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+12>>2]](r19,r45);if(r40<<24>>24==FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+12>>2]](r19,HEAP8[r29])<<24>>24){r10=713;break}HEAP32[r6>>2]=4;r33=4;r34=r38;r35=r36}L764:do{if(r10==688){while(1){r10=0;r35=r42+1|0;if((r35|0)==(r9|0)){r46=r9;break}r34=HEAP8[r35];if(r34<<24>>24<0){r46=r35;break}if((HEAP16[r41+(r34<<24>>24<<1)>>1]&8192)==0){r46=r35;break}else{r42=r35;r10=688}}r37=r36;r35=r38;r34=r38;r33=r36;while(1){do{if((r37|0)==0){r47=0;r48=r33}else{if((HEAP32[r37+12>>2]|0)!=(HEAP32[r37+16>>2]|0)){r47=r37;r48=r33;break}r40=(FUNCTION_TABLE[HEAP32[HEAP32[r37>>2]+36>>2]](r37)|0)==-1;r47=r40?0:r37;r48=r40?0:r33}}while(0);r40=(r47|0)==0;do{if((r35|0)==0){r49=r34;r10=699}else{if((HEAP32[r35+12>>2]|0)!=(HEAP32[r35+16>>2]|0)){if(r40){r50=r35;r51=r34;break}else{r52=r46;r53=r34;r54=r48;break L764}}if((FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)|0)==-1){r49=0;r10=699;break}if(r40){r50=r35;r51=r34}else{r52=r46;r53=r34;r54=r48;break L764}}}while(0);if(r10==699){r10=0;if(r40){r52=r46;r53=r49;r54=r48;break L764}else{r50=0;r51=r49}}r55=r47+12|0;r56=HEAP32[r55>>2];r57=r47+16|0;if((r56|0)==(HEAP32[r57>>2]|0)){r58=FUNCTION_TABLE[HEAP32[HEAP32[r47>>2]+36>>2]](r47)&255}else{r58=HEAP8[r56]}if(r58<<24>>24<0){r52=r46;r53=r51;r54=r48;break L764}if((HEAP16[HEAP32[r24>>2]+(r58<<24>>24<<1)>>1]&8192)==0){r52=r46;r53=r51;r54=r48;break L764}r56=HEAP32[r55>>2];if((r56|0)==(HEAP32[r57>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r47>>2]+40>>2]](r47);r37=r47;r35=r50;r34=r51;r33=r48;continue}else{HEAP32[r55>>2]=r56+1;r37=r47;r35=r50;r34=r51;r33=r48;continue}}}else if(r10==713){r10=0;r33=HEAP32[r43>>2];if((r33|0)==(HEAP32[r44>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r36>>2]+40>>2]](r36)}else{HEAP32[r43>>2]=r33+1}r52=r29+1|0;r53=r38;r54=r36}else if(r10==677){r10=0;r33=r29+1|0;if((r33|0)==(r9|0)){r10=678;break L738}r34=FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+36>>2]](r19,HEAP8[r33],0);if(r34<<24>>24==69|r34<<24>>24==48){r35=r29+2|0;if((r35|0)==(r9|0)){r10=681;break L738}r59=r34;r60=FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+36>>2]](r19,HEAP8[r35],0);r61=r35}else{r59=0;r60=r34;r61=r33}r33=HEAP32[HEAP32[r25>>2]+36>>2];HEAP32[r26>>2]=r36;HEAP32[r27>>2]=r38;FUNCTION_TABLE[r33](r13,r2,r14,r15,r5,r6,r7,r60,r59);r52=r61+1|0;r53=r38;r54=HEAP32[r28>>2]}}while(0);if((r52|0)==(r9|0)){r21=r53;r22=r54;break L736}r29=r52;r30=HEAP32[r6>>2];r31=r53;r32=r54}if(r10==672){HEAP32[r6>>2]=4;r21=r39;r22=r36;break}else if(r10==681){HEAP32[r6>>2]=4;r21=r38;r22=r36;break}else if(r10==678){HEAP32[r6>>2]=4;r21=r38;r22=r36;break}}}while(0);do{if((r22|0)==0){r10=721}else{if((HEAP32[r22+12>>2]|0)!=(HEAP32[r22+16>>2]|0)){r10=721;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r22>>2]+36>>2]](r22)|0)==-1){r62=0}else{r10=721}}}while(0);if(r10==721){r62=r22}r19=(r62|0)==0;do{if((r21|0)==0){r10=726}else{if((HEAP32[r21+12>>2]|0)==(HEAP32[r21+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1){r10=726;break}}if(!r19){break}r63=r1|0;HEAP32[r63>>2]=r62;STACKTOP=r11;return}}while(0);do{if(r10==726){if(r19){break}r63=r1|0;HEAP32[r63>>2]=r62;STACKTOP=r11;return}}while(0);HEAP32[r6>>2]=HEAP32[r6>>2]|2;r63=r1|0;HEAP32[r63>>2]=r62;STACKTOP=r11;return}}while(0);r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=6520;___cxa_throw(r11,13200,578)}function __ZNSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev(r1){return}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE13do_date_orderEv(r1){return 2}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_timeES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9;r8=STACKTOP;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r1,r2,HEAP32[r3>>2],HEAP32[r4>>2],r5,r6,r7,6456,6464);STACKTOP=r8;return}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_dateES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13;r8=STACKTOP;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r2+8|0;r10=FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+20>>2]](r9);r9=HEAP8[r10];if((r9&1)==0){r11=r10+1|0}else{r11=HEAP32[r10+8>>2]}r12=r9&255;if((r12&1|0)==0){r13=r12>>>1}else{r13=HEAP32[r10+4>>2]}__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r1,r2,HEAP32[r3>>2],HEAP32[r4>>2],r5,r6,r7,r11,r11+r13|0);STACKTOP=r8;return}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE14do_get_weekdayES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r8=STACKTOP;STACKTOP=STACKTOP+16|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=HEAP32[r5+28>>2];r5=r10+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r9>>2]=18560;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r9)}r9=HEAP32[18564>>2]-1|0;r5=HEAP32[r10+8>>2];do{if(HEAP32[r10+12>>2]-r5>>2>>>0>r9>>>0){r11=HEAP32[r5+(r9<<2)>>2];if((r11|0)==0){break}r12=r10+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+8>>2]](r10)}r12=HEAP32[r4>>2];r13=r2+8|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]>>2]](r13);r13=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r12,r14,r14+168|0,r11,r6,0)-r14|0;if((r13|0)>=168){r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}HEAP32[r7+24>>2]=((r13|0)/12&-1|0)%7&-1;r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE16do_get_monthnameES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r8=STACKTOP;STACKTOP=STACKTOP+16|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=HEAP32[r5+28>>2];r5=r10+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r9>>2]=18560;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r9)}r9=HEAP32[18564>>2]-1|0;r5=HEAP32[r10+8>>2];do{if(HEAP32[r10+12>>2]-r5>>2>>>0>r9>>>0){r11=HEAP32[r5+(r9<<2)>>2];if((r11|0)==0){break}r12=r10+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+8>>2]](r10)}r12=HEAP32[r4>>2];r13=r2+8|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+4>>2]](r13);r13=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r12,r14,r14+288|0,r11,r6,0)-r14|0;if((r13|0)>=288){r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}HEAP32[r7+16>>2]=((r13|0)/12&-1|0)%12&-1;r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_yearES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r8=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r8>>2];r8=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r8>>2];r8=r2;r9=HEAP32[r5+28>>2];r5=r9+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r8>>2]=18560;HEAP32[r8+4>>2]=28;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r8)}r8=HEAP32[18564>>2]-1|0;r5=HEAP32[r9+8>>2];do{if(HEAP32[r9+12>>2]-r5>>2>>>0>r8>>>0){r10=HEAP32[r5+(r8<<2)>>2];if((r10|0)==0){break}r11=r9+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+8>>2]](r9)}r11=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,HEAP32[r4>>2],r6,r10,4);if((HEAP32[r6>>2]&4|0)!=0){r12=r3|0;r13=HEAP32[r12>>2];r14=r1|0;HEAP32[r14>>2]=r13;STACKTOP=r2;return}if((r11|0)<69){r15=r11+2e3|0}else{r15=(r11-69|0)>>>0<31?r11+1900|0:r11}HEAP32[r7+20>>2]=r15-1900;r12=r3|0;r13=HEAP32[r12>>2];r14=r1|0;HEAP32[r14>>2]=r13;STACKTOP=r2;return}}while(0);r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6520;___cxa_throw(r2,13200,578)}function __ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjP2tmcc(r1,r2,r3,r4,r5,r6,r7,r8,r9){var r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548;r10=0;r11=STACKTOP;STACKTOP=STACKTOP+88|0;r12=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r12>>2];r12=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r12>>2];r13=r11;r14=r11+16;r15=r11+24;r16=r11+32;r17=r11+40;r18=r11+48;r19=r11+56;r20=r11+64;r21=r11+72;r22=r11+80;HEAP32[r6>>2]=0;r23=r5+28|0;r24=HEAP32[r23>>2];r25=r24+4|0;r26=r25;r27=(tempValue=HEAP32[r26>>2],HEAP32[r26>>2]=tempValue+1,tempValue);r28=r13;r29=HEAP32[18560>>2];r30=(r29|0)==-1;if(!r30){r31=r13|0;HEAP32[r31>>2]=18560;r32=r13+4|0;HEAP32[r32>>2]=28;r33=r13+8|0;HEAP32[r33>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r28)}r34=HEAP32[18564>>2];r35=r34-1|0;r36=r24+12|0;r37=r36;r38=HEAP32[r37>>2];r39=r24+8|0;r40=r39;r41=HEAP32[r40>>2];r42=r38;r43=r41;r44=r42-r43|0;r45=r44>>2;r46=r45>>>0>r35>>>0;do{if(r46){r47=r41+(r35<<2)|0;r48=HEAP32[r47>>2];r49=(r48|0)==0;if(r49){break}r50=r48;r51=r24+4|0;r52=r51;r53=(tempValue=HEAP32[r52>>2],HEAP32[r52>>2]=tempValue+ -1,tempValue);r54=(r53|0)==0;if(r54){r55=r24;r56=r24;r57=HEAP32[r56>>2];r58=r57+8|0;r59=HEAP32[r58>>2];FUNCTION_TABLE[r59](r55)}r60=r8<<24>>24;L910:do{switch(r60|0){case 109:{r61=r4|0;r62=HEAP32[r61>>2];r63=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r62,r6,r50,2);r64=r63-1|0;r65=HEAP32[r6>>2];r66=r65&4;r67=(r66|0)==0;r68=(r64|0)<12;r69=r67&r68;if(r69){r70=r7+16|0;HEAP32[r70>>2]=r64;break L910}else{r71=r65|4;HEAP32[r6>>2]=r71;break L910}break};case 77:{r72=r4|0;r73=HEAP32[r72>>2];r74=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r73,r6,r50,2);r75=HEAP32[r6>>2];r76=r75&4;r77=(r76|0)==0;r78=(r74|0)<60;r79=r77&r78;if(r79){r80=r7+4|0;HEAP32[r80>>2]=r74;break L910}else{r81=r75|4;HEAP32[r6>>2]=r81;break L910}break};case 73:{r82=r7+8|0;r83=r4|0;r84=HEAP32[r83>>2];r85=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r84,r6,r50,2);r86=HEAP32[r6>>2];r87=r86&4;r88=(r87|0)==0;do{if(r88){r89=r85-1|0;r90=r89>>>0<12;if(!r90){break}HEAP32[r82>>2]=r85;break L910}}while(0);r91=r86|4;HEAP32[r6>>2]=r91;break};case 99:{r92=r2+8|0;r93=r92;r94=HEAP32[r93>>2];r95=r94+12|0;r96=HEAP32[r95>>2];r97=FUNCTION_TABLE[r96](r92);r98=r3|0;r99=HEAP32[r98>>2];r100=r4|0;r101=HEAP32[r100>>2];r102=r97;r103=HEAP8[r102];r104=r103&1;r105=r104<<24>>24==0;if(r105){r106=r97;r107=r106+1|0;r108=r107}else{r109=r97+8|0;r110=HEAP32[r109>>2];r108=r110}r111=r103&255;r112=r111&1;r113=(r112|0)==0;if(r113){r114=r111>>>1;r115=r114}else{r116=r97+4|0;r117=HEAP32[r116>>2];r115=r117}r118=r108+r115|0;__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r14,r2,r99,r101,r5,r6,r7,r108,r118);r119=r14|0;r120=HEAP32[r119>>2];HEAP32[r98>>2]=r120;break};case 68:{r121=r3|0;r122=HEAP32[r121>>2];r123=r4|0;r124=HEAP32[r123>>2];__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r15,r2,r122,r124,r5,r6,r7,6448,6456);r125=r15|0;r126=HEAP32[r125>>2];HEAP32[r121>>2]=r126;break};case 70:{r127=r3|0;r128=HEAP32[r127>>2];r129=r4|0;r130=HEAP32[r129>>2];__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r16,r2,r128,r130,r5,r6,r7,6440,6448);r131=r16|0;r132=HEAP32[r131>>2];HEAP32[r127>>2]=r132;break};case 72:{r133=r4|0;r134=HEAP32[r133>>2];r135=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r134,r6,r50,2);r136=HEAP32[r6>>2];r137=r136&4;r138=(r137|0)==0;r139=(r135|0)<24;r140=r138&r139;if(r140){r141=r7+8|0;HEAP32[r141>>2]=r135;break L910}else{r142=r136|4;HEAP32[r6>>2]=r142;break L910}break};case 110:case 116:{r143=r4|0;r144=HEAP32[r143>>2];r145=r3|0;r146=r48+8|0;r147=r146;r148=r144;L940:while(1){r149=HEAP32[r145>>2];r150=(r149|0)==0;do{if(r150){r151=0}else{r152=r149+12|0;r153=HEAP32[r152>>2];r154=r149+16|0;r155=HEAP32[r154>>2];r156=(r153|0)==(r155|0);if(!r156){r151=r149;break}r157=r149;r158=HEAP32[r157>>2];r159=r158+36|0;r160=HEAP32[r159>>2];r161=FUNCTION_TABLE[r160](r149);r162=(r161|0)==-1;if(r162){HEAP32[r145>>2]=0;r151=0;break}else{r163=HEAP32[r145>>2];r151=r163;break}}}while(0);r164=(r151|0)==0;r165=(r148|0)==0;do{if(r165){r10=853}else{r166=r148+12|0;r167=HEAP32[r166>>2];r168=r148+16|0;r169=HEAP32[r168>>2];r170=(r167|0)==(r169|0);if(r170){r171=r148;r172=HEAP32[r171>>2];r173=r172+36|0;r174=HEAP32[r173>>2];r175=FUNCTION_TABLE[r174](r148);r176=(r175|0)==-1;if(r176){r10=853;break}}if(r164){r177=0;r178=r148}else{r179=r148;r180=0;break L940}}}while(0);if(r10==853){r10=0;if(r164){r179=0;r180=1;break}else{r177=1;r178=0}}r181=HEAP32[r145>>2];r182=r181+12|0;r183=HEAP32[r182>>2];r184=r181+16|0;r185=HEAP32[r184>>2];r186=(r183|0)==(r185|0);if(r186){r187=r181;r188=HEAP32[r187>>2];r189=r188+36|0;r190=HEAP32[r189>>2];r191=FUNCTION_TABLE[r190](r181);r192=r191&255;r193=r192}else{r194=HEAP8[r183];r193=r194}r195=r193<<24>>24<0;if(r195){r179=r178;r180=r177;break}r196=r193<<24>>24;r197=HEAP32[r147>>2];r198=r197+(r196<<1)|0;r199=HEAP16[r198>>1];r200=r199&8192;r201=r200<<16>>16==0;if(r201){r179=r178;r180=r177;break}r202=HEAP32[r145>>2];r203=r202+12|0;r204=HEAP32[r203>>2];r205=r202+16|0;r206=HEAP32[r205>>2];r207=(r204|0)==(r206|0);if(r207){r208=r202;r209=HEAP32[r208>>2];r210=r209+40|0;r211=HEAP32[r210>>2];r212=FUNCTION_TABLE[r211](r202);r148=r178;continue}else{r213=r204+1|0;HEAP32[r203>>2]=r213;r148=r178;continue}}r214=HEAP32[r145>>2];r215=(r214|0)==0;do{if(r215){r216=0}else{r217=r214+12|0;r218=HEAP32[r217>>2];r219=r214+16|0;r220=HEAP32[r219>>2];r221=(r218|0)==(r220|0);if(!r221){r216=r214;break}r222=r214;r223=HEAP32[r222>>2];r224=r223+36|0;r225=HEAP32[r224>>2];r226=FUNCTION_TABLE[r225](r214);r227=(r226|0)==-1;if(r227){HEAP32[r145>>2]=0;r216=0;break}else{r228=HEAP32[r145>>2];r216=r228;break}}}while(0);r229=(r216|0)==0;do{if(r180){r10=871}else{r230=r179+12|0;r231=HEAP32[r230>>2];r232=r179+16|0;r233=HEAP32[r232>>2];r234=(r231|0)==(r233|0);if(!r234){r235=(r179|0)==0;r236=r229^r235;if(r236){break L910}else{break}}r237=r179;r238=HEAP32[r237>>2];r239=r238+36|0;r240=HEAP32[r239>>2];r241=FUNCTION_TABLE[r240](r179);r242=(r241|0)==-1;if(r242){r10=871;break}if(r229){break L910}}}while(0);if(r10==871){if(!r229){break L910}}r243=HEAP32[r6>>2];r244=r243|2;HEAP32[r6>>2]=r244;break};case 112:{r245=r7+8|0;r246=r4|0;r247=HEAP32[r246>>2];r248=r2+8|0;r249=r248;r250=HEAP32[r249>>2];r251=r250+8|0;r252=HEAP32[r251>>2];r253=FUNCTION_TABLE[r252](r248);r254=r253;r255=HEAP8[r254];r256=r255&255;r257=r256&1;r258=(r257|0)==0;if(r258){r259=r256>>>1;r260=r259}else{r261=r253+4|0;r262=HEAP32[r261>>2];r260=r262}r263=r253+12|0;r264=r263;r265=HEAP8[r264];r266=r265&255;r267=r266&1;r268=(r267|0)==0;if(r268){r269=r266>>>1;r270=r269}else{r271=r253+16|0;r272=HEAP32[r271>>2];r270=r272}r273=-r270|0;r274=(r260|0)==(r273|0);if(r274){r275=HEAP32[r6>>2];r276=r275|4;HEAP32[r6>>2]=r276;break L910}r277=r253+24|0;r278=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r247,r253,r277,r50,r6,0);r279=r278;r280=r253;r281=r279-r280|0;r282=(r278|0)==(r253|0);do{if(r282){r283=HEAP32[r245>>2];r284=(r283|0)==12;if(!r284){break}HEAP32[r245>>2]=0;break L910}}while(0);r285=(r281|0)==12;if(!r285){break L910}r286=HEAP32[r245>>2];r287=(r286|0)<12;if(!r287){break L910}r288=r286+12|0;HEAP32[r245>>2]=r288;break};case 98:case 66:case 104:{r289=r4|0;r290=HEAP32[r289>>2];r291=r2+8|0;r292=r291;r293=HEAP32[r292>>2];r294=r293+4|0;r295=HEAP32[r294>>2];r296=FUNCTION_TABLE[r295](r291);r297=r296+288|0;r298=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r290,r296,r297,r50,r6,0);r299=r298;r300=r296;r301=r299-r300|0;r302=(r301|0)<288;if(!r302){break L910}r303=r7+16|0;r304=(r301|0)/12&-1;r305=(r304|0)%12&-1;HEAP32[r303>>2]=r305;break};case 106:{r306=r4|0;r307=HEAP32[r306>>2];r308=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r307,r6,r50,3);r309=HEAP32[r6>>2];r310=r309&4;r311=(r310|0)==0;r312=(r308|0)<366;r313=r311&r312;if(r313){r314=r7+28|0;HEAP32[r314>>2]=r308;break L910}else{r315=r309|4;HEAP32[r6>>2]=r315;break L910}break};case 100:case 101:{r316=r7+12|0;r317=r4|0;r318=HEAP32[r317>>2];r319=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r318,r6,r50,2);r320=HEAP32[r6>>2];r321=r320&4;r322=(r321|0)==0;do{if(r322){r323=r319-1|0;r324=r323>>>0<31;if(!r324){break}HEAP32[r316>>2]=r319;break L910}}while(0);r325=r320|4;HEAP32[r6>>2]=r325;break};case 97:case 65:{r326=r4|0;r327=HEAP32[r326>>2];r328=r2+8|0;r329=r328;r330=HEAP32[r329>>2];r331=HEAP32[r330>>2];r332=FUNCTION_TABLE[r331](r328);r333=r332+168|0;r334=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r327,r332,r333,r50,r6,0);r335=r334;r336=r332;r337=r335-r336|0;r338=(r337|0)<168;if(!r338){break L910}r339=r7+24|0;r340=(r337|0)/12&-1;r341=(r340|0)%7&-1;HEAP32[r339>>2]=r341;break};case 114:{r342=r3|0;r343=HEAP32[r342>>2];r344=r4|0;r345=HEAP32[r344>>2];__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r17,r2,r343,r345,r5,r6,r7,6424,6435);r346=r17|0;r347=HEAP32[r346>>2];HEAP32[r342>>2]=r347;break};case 82:{r348=r3|0;r349=HEAP32[r348>>2];r350=r4|0;r351=HEAP32[r350>>2];__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r18,r2,r349,r351,r5,r6,r7,6416,6421);r352=r18|0;r353=HEAP32[r352>>2];HEAP32[r348>>2]=r353;break};case 83:{r354=r4|0;r355=HEAP32[r354>>2];r356=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r355,r6,r50,2);r357=HEAP32[r6>>2];r358=r357&4;r359=(r358|0)==0;r360=(r356|0)<61;r361=r359&r360;if(r361){r362=r7|0;HEAP32[r362>>2]=r356;break L910}else{r363=r357|4;HEAP32[r6>>2]=r363;break L910}break};case 84:{r364=r3|0;r365=HEAP32[r364>>2];r366=r4|0;r367=HEAP32[r366>>2];__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r19,r2,r365,r367,r5,r6,r7,6408,6416);r368=r19|0;r369=HEAP32[r368>>2];HEAP32[r364>>2]=r369;break};case 119:{r370=r4|0;r371=HEAP32[r370>>2];r372=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r371,r6,r50,1);r373=HEAP32[r6>>2];r374=r373&4;r375=(r374|0)==0;r376=(r372|0)<7;r377=r375&r376;if(r377){r378=r7+24|0;HEAP32[r378>>2]=r372;break L910}else{r379=r373|4;HEAP32[r6>>2]=r379;break L910}break};case 120:{r380=r2;r381=HEAP32[r380>>2];r382=r381+20|0;r383=HEAP32[r382>>2];r384=r3|0;r385=HEAP32[r384>>2];r386=r20|0;HEAP32[r386>>2]=r385;r387=r4|0;r388=HEAP32[r387>>2];r389=r21|0;HEAP32[r389>>2]=r388;FUNCTION_TABLE[r383](r1,r2,r20,r21,r5,r6,r7);STACKTOP=r11;return;break};case 88:{r390=r2+8|0;r391=r390;r392=HEAP32[r391>>2];r393=r392+24|0;r394=HEAP32[r393>>2];r395=FUNCTION_TABLE[r394](r390);r396=r3|0;r397=HEAP32[r396>>2];r398=r4|0;r399=HEAP32[r398>>2];r400=r395;r401=HEAP8[r400];r402=r401&1;r403=r402<<24>>24==0;if(r403){r404=r395;r405=r404+1|0;r406=r405}else{r407=r395+8|0;r408=HEAP32[r407>>2];r406=r408}r409=r401&255;r410=r409&1;r411=(r410|0)==0;if(r411){r412=r409>>>1;r413=r412}else{r414=r395+4|0;r415=HEAP32[r414>>2];r413=r415}r416=r406+r413|0;__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKcSC_(r22,r2,r397,r399,r5,r6,r7,r406,r416);r417=r22|0;r418=HEAP32[r417>>2];HEAP32[r396>>2]=r418;break};case 121:{r419=r7+20|0;r420=r4|0;r421=HEAP32[r420>>2];r422=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r421,r6,r50,4);r423=HEAP32[r6>>2];r424=r423&4;r425=(r424|0)==0;if(!r425){break L910}r426=(r422|0)<69;if(r426){r427=r422+2e3|0;r428=r427}else{r429=r422-69|0;r430=r429>>>0<31;r431=r422+1900|0;r432=r430?r431:r422;r428=r432}r433=r428-1900|0;HEAP32[r419>>2]=r433;break};case 89:{r434=r4|0;r435=HEAP32[r434>>2];r436=__ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r435,r6,r50,4);r437=HEAP32[r6>>2];r438=r437&4;r439=(r438|0)==0;if(!r439){break L910}r440=r7+20|0;r441=r436-1900|0;HEAP32[r440>>2]=r441;break};case 37:{r442=r4|0;r443=HEAP32[r442>>2];r444=r3|0;r445=HEAP32[r444>>2];r446=(r445|0)==0;do{if(r446){r447=0}else{r448=r445+12|0;r449=HEAP32[r448>>2];r450=r445+16|0;r451=HEAP32[r450>>2];r452=(r449|0)==(r451|0);if(!r452){r447=r445;break}r453=r445;r454=HEAP32[r453>>2];r455=r454+36|0;r456=HEAP32[r455>>2];r457=FUNCTION_TABLE[r456](r445);r458=(r457|0)==-1;if(r458){HEAP32[r444>>2]=0;r447=0;break}else{r459=HEAP32[r444>>2];r447=r459;break}}}while(0);r460=(r447|0)==0;r461=(r443|0)==0;do{if(r461){r10=921}else{r462=r443+12|0;r463=HEAP32[r462>>2];r464=r443+16|0;r465=HEAP32[r464>>2];r466=(r463|0)==(r465|0);if(r466){r467=r443;r468=HEAP32[r467>>2];r469=r468+36|0;r470=HEAP32[r469>>2];r471=FUNCTION_TABLE[r470](r443);r472=(r471|0)==-1;if(r472){r10=921;break}}if(r460){r473=r443;r474=0}else{r10=922}}}while(0);if(r10==921){if(r460){r10=922}else{r473=0;r474=1}}if(r10==922){r475=HEAP32[r6>>2];r476=r475|6;HEAP32[r6>>2]=r476;break L910}r477=HEAP32[r444>>2];r478=r477+12|0;r479=HEAP32[r478>>2];r480=r477+16|0;r481=HEAP32[r480>>2];r482=(r479|0)==(r481|0);if(r482){r483=r477;r484=HEAP32[r483>>2];r485=r484+36|0;r486=HEAP32[r485>>2];r487=FUNCTION_TABLE[r486](r477);r488=r487&255;r489=r488}else{r490=HEAP8[r479];r489=r490}r491=r48;r492=HEAP32[r491>>2];r493=r492+36|0;r494=HEAP32[r493>>2];r495=FUNCTION_TABLE[r494](r50,r489,0);r496=r495<<24>>24==37;if(!r496){r497=HEAP32[r6>>2];r498=r497|4;HEAP32[r6>>2]=r498;break L910}r499=HEAP32[r444>>2];r500=r499+12|0;r501=HEAP32[r500>>2];r502=r499+16|0;r503=HEAP32[r502>>2];r504=(r501|0)==(r503|0);if(r504){r505=r499;r506=HEAP32[r505>>2];r507=r506+40|0;r508=HEAP32[r507>>2];r509=FUNCTION_TABLE[r508](r499)}else{r510=r501+1|0;HEAP32[r500>>2]=r510}r511=HEAP32[r444>>2];r512=(r511|0)==0;do{if(r512){r513=0}else{r514=r511+12|0;r515=HEAP32[r514>>2];r516=r511+16|0;r517=HEAP32[r516>>2];r518=(r515|0)==(r517|0);if(!r518){r513=r511;break}r519=r511;r520=HEAP32[r519>>2];r521=r520+36|0;r522=HEAP32[r521>>2];r523=FUNCTION_TABLE[r522](r511);r524=(r523|0)==-1;if(r524){HEAP32[r444>>2]=0;r513=0;break}else{r525=HEAP32[r444>>2];r513=r525;break}}}while(0);r526=(r513|0)==0;do{if(r474){r10=940}else{r527=r473+12|0;r528=HEAP32[r527>>2];r529=r473+16|0;r530=HEAP32[r529>>2];r531=(r528|0)==(r530|0);if(!r531){r532=(r473|0)==0;r533=r526^r532;if(r533){break L910}else{break}}r534=r473;r535=HEAP32[r534>>2];r536=r535+36|0;r537=HEAP32[r536>>2];r538=FUNCTION_TABLE[r537](r473);r539=(r538|0)==-1;if(r539){r10=940;break}if(r526){break L910}}}while(0);if(r10==940){if(!r526){break L910}}r540=HEAP32[r6>>2];r541=r540|2;HEAP32[r6>>2]=r541;break};default:{r542=HEAP32[r6>>2];r543=r542|4;HEAP32[r6>>2]=r543}}}while(0);r544=r3|0;r545=HEAP32[r544>>2];r546=r1|0;HEAP32[r546>>2]=r545;STACKTOP=r11;return}}while(0);r547=___cxa_allocate_exception(4);r548=r547;HEAP32[r548>>2]=6520;___cxa_throw(r547,13200,578)}function __ZNSt3__120__get_up_to_n_digitsIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r6=0;r7=r1|0;r1=HEAP32[r7>>2];do{if((r1|0)==0){r8=0}else{if((HEAP32[r1+12>>2]|0)!=(HEAP32[r1+16>>2]|0)){r8=r1;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)|0)==-1){HEAP32[r7>>2]=0;r8=0;break}else{r8=HEAP32[r7>>2];break}}}while(0);r1=(r8|0)==0;do{if((r2|0)==0){r6=957}else{if((HEAP32[r2+12>>2]|0)==(HEAP32[r2+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+36>>2]](r2)|0)==-1){r6=957;break}}if(r1){r9=r2}else{r6=958}}}while(0);if(r6==957){if(r1){r6=958}else{r9=0}}if(r6==958){HEAP32[r3>>2]=HEAP32[r3>>2]|6;r10=0;return r10}r1=HEAP32[r7>>2];r2=HEAP32[r1+12>>2];if((r2|0)==(HEAP32[r1+16>>2]|0)){r11=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)&255}else{r11=HEAP8[r2]}do{if(r11<<24>>24>=0){r2=r4+8|0;if((HEAP16[HEAP32[r2>>2]+(r11<<24>>24<<1)>>1]&2048)==0){break}r1=r4;r8=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r4,r11,0)<<24>>24;r12=HEAP32[r7>>2];r13=r12+12|0;r14=HEAP32[r13>>2];if((r14|0)==(HEAP32[r12+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+40>>2]](r12);r15=r8;r16=r5;r17=r9}else{HEAP32[r13>>2]=r14+1;r15=r8;r16=r5;r17=r9}while(1){r18=r15-48|0;r8=r16-1|0;r14=HEAP32[r7>>2];do{if((r14|0)==0){r19=0}else{if((HEAP32[r14+12>>2]|0)!=(HEAP32[r14+16>>2]|0)){r19=r14;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+36>>2]](r14)|0)==-1){HEAP32[r7>>2]=0;r19=0;break}else{r19=HEAP32[r7>>2];break}}}while(0);r14=(r19|0)==0;if((r17|0)==0){r20=r19;r21=0}else{if((HEAP32[r17+12>>2]|0)==(HEAP32[r17+16>>2]|0)){r13=(FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)|0)==-1;r22=r13?0:r17}else{r22=r17}r20=HEAP32[r7>>2];r21=r22}r23=(r21|0)==0;if(!((r14^r23)&(r8|0)>0)){r6=986;break}r14=HEAP32[r20+12>>2];if((r14|0)==(HEAP32[r20+16>>2]|0)){r24=FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+36>>2]](r20)&255}else{r24=HEAP8[r14]}if(r24<<24>>24<0){r10=r18;r6=1e3;break}if((HEAP16[HEAP32[r2>>2]+(r24<<24>>24<<1)>>1]&2048)==0){r10=r18;r6=1001;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r4,r24,0)<<24>>24)+(r18*10&-1)|0;r13=HEAP32[r7>>2];r12=r13+12|0;r25=HEAP32[r12>>2];if((r25|0)==(HEAP32[r13+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+40>>2]](r13);r15=r14;r16=r8;r17=r21;continue}else{HEAP32[r12>>2]=r25+1;r15=r14;r16=r8;r17=r21;continue}}if(r6==986){do{if((r20|0)==0){r26=0}else{if((HEAP32[r20+12>>2]|0)!=(HEAP32[r20+16>>2]|0)){r26=r20;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+36>>2]](r20)|0)==-1){HEAP32[r7>>2]=0;r26=0;break}else{r26=HEAP32[r7>>2];break}}}while(0);r1=(r26|0)==0;do{if(r23){r6=995}else{if((HEAP32[r21+12>>2]|0)==(HEAP32[r21+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1){r6=995;break}}if(r1){r10=r18}else{break}return r10}}while(0);do{if(r6==995){if(r1){break}else{r10=r18}return r10}}while(0);HEAP32[r3>>2]=HEAP32[r3>>2]|2;r10=r18;return r10}else if(r6==1e3){return r10}else if(r6==1001){return r10}}}while(0);HEAP32[r3>>2]=HEAP32[r3>>2]|4;r10=0;return r10}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r1,r2,r3,r4,r5,r6,r7,r8,r9){var r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68;r10=0;r11=STACKTOP;STACKTOP=STACKTOP+40|0;r12=r11;r13=r11+16;r14=r11+24;r15=r11+32;r16=HEAP32[r5+28>>2];r17=r16+4|0;tempValue=HEAP32[r17>>2],HEAP32[r17>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r12>>2]=18552;HEAP32[r12+4>>2]=28;HEAP32[r12+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r12)}r12=HEAP32[18556>>2]-1|0;r17=HEAP32[r16+8>>2];do{if(HEAP32[r16+12>>2]-r17>>2>>>0>r12>>>0){r18=HEAP32[r17+(r12<<2)>>2];if((r18|0)==0){break}r19=r18;r20=r16+4|0;if(((tempValue=HEAP32[r20>>2],HEAP32[r20>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+8>>2]](r16)}HEAP32[r6>>2]=0;L1182:do{if((r8|0)==(r9|0)){r21=r4;r22=r3}else{r20=r18;r23=r18;r24=r18;r25=r2;r26=r14|0;r27=r15|0;r28=r13|0;r29=r8;r30=0;r31=r4;r32=r3;L1184:while(1){r33=r30;r34=r31;r35=r32;while(1){if((r33|0)!=0){r21=r34;r22=r35;break L1182}if((r35|0)==0){r36=0}else{r37=HEAP32[r35+12>>2];if((r37|0)==(HEAP32[r35+16>>2]|0)){r38=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r38=HEAP32[r37>>2]}r36=(r38|0)==-1?0:r35}r37=(r36|0)==0;do{if((r34|0)==0){r10=1027}else{r39=HEAP32[r34+12>>2];if((r39|0)==(HEAP32[r34+16>>2]|0)){r40=FUNCTION_TABLE[HEAP32[HEAP32[r34>>2]+36>>2]](r34)}else{r40=HEAP32[r39>>2]}if((r40|0)==-1){r10=1027;break}if(r37){r41=r34}else{r42=r34;r10=1029;break L1184}}}while(0);if(r10==1027){r10=0;if(r37){r42=0;r10=1029;break L1184}else{r41=0}}if(FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+52>>2]](r19,HEAP32[r29>>2],0)<<24>>24==37){r10=1034;break}if(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+12>>2]](r19,8192,HEAP32[r29>>2])){r43=r29;r10=1044;break}r44=r36+12|0;r39=HEAP32[r44>>2];r45=r36+16|0;if((r39|0)==(HEAP32[r45>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r36>>2]+36>>2]](r36)}else{r46=HEAP32[r39>>2]}r39=FUNCTION_TABLE[HEAP32[HEAP32[r24>>2]+28>>2]](r19,r46);if((r39|0)==(FUNCTION_TABLE[HEAP32[HEAP32[r24>>2]+28>>2]](r19,HEAP32[r29>>2])|0)){r10=1070;break}HEAP32[r6>>2]=4;r33=4;r34=r41;r35=r36}L1213:do{if(r10==1070){r10=0;r35=HEAP32[r44>>2];if((r35|0)==(HEAP32[r45>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r36>>2]+40>>2]](r36)}else{HEAP32[r44>>2]=r35+4}r47=r29+4|0;r48=r41;r49=r36}else if(r10==1044){while(1){r10=0;r35=r43+4|0;if((r35|0)==(r9|0)){r50=r9;break}if(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+12>>2]](r19,8192,HEAP32[r35>>2])){r43=r35;r10=1044}else{r50=r35;break}}r37=r36;r35=r41;r34=r41;r33=r36;while(1){if((r37|0)==0){r51=0;r52=r33}else{r39=HEAP32[r37+12>>2];if((r39|0)==(HEAP32[r37+16>>2]|0)){r53=FUNCTION_TABLE[HEAP32[HEAP32[r37>>2]+36>>2]](r37)}else{r53=HEAP32[r39>>2]}r39=(r53|0)==-1;r51=r39?0:r37;r52=r39?0:r33}r39=(r51|0)==0;do{if((r35|0)==0){r54=r34;r10=1057}else{r55=HEAP32[r35+12>>2];if((r55|0)==(HEAP32[r35+16>>2]|0)){r56=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r56=HEAP32[r55>>2]}if((r56|0)==-1){r54=0;r10=1057;break}if(r39){r57=r35;r58=r34}else{r47=r50;r48=r34;r49=r52;break L1213}}}while(0);if(r10==1057){r10=0;if(r39){r47=r50;r48=r54;r49=r52;break L1213}else{r57=0;r58=r54}}r55=r51+12|0;r59=HEAP32[r55>>2];r60=r51+16|0;if((r59|0)==(HEAP32[r60>>2]|0)){r61=FUNCTION_TABLE[HEAP32[HEAP32[r51>>2]+36>>2]](r51)}else{r61=HEAP32[r59>>2]}if(!FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+12>>2]](r19,8192,r61)){r47=r50;r48=r58;r49=r52;break L1213}r59=HEAP32[r55>>2];if((r59|0)==(HEAP32[r60>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r51>>2]+40>>2]](r51);r37=r51;r35=r57;r34=r58;r33=r52;continue}else{HEAP32[r55>>2]=r59+4;r37=r51;r35=r57;r34=r58;r33=r52;continue}}}else if(r10==1034){r10=0;r33=r29+4|0;if((r33|0)==(r9|0)){r10=1035;break L1184}r34=FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+52>>2]](r19,HEAP32[r33>>2],0);if(r34<<24>>24==69|r34<<24>>24==48){r35=r29+8|0;if((r35|0)==(r9|0)){r10=1038;break L1184}r62=r34;r63=FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+52>>2]](r19,HEAP32[r35>>2],0);r64=r35}else{r62=0;r63=r34;r64=r33}r33=HEAP32[HEAP32[r25>>2]+36>>2];HEAP32[r26>>2]=r36;HEAP32[r27>>2]=r41;FUNCTION_TABLE[r33](r13,r2,r14,r15,r5,r6,r7,r63,r62);r47=r64+4|0;r48=r41;r49=HEAP32[r28>>2]}}while(0);if((r47|0)==(r9|0)){r21=r48;r22=r49;break L1182}r29=r47;r30=HEAP32[r6>>2];r31=r48;r32=r49}if(r10==1029){HEAP32[r6>>2]=4;r21=r42;r22=r36;break}else if(r10==1035){HEAP32[r6>>2]=4;r21=r41;r22=r36;break}else if(r10==1038){HEAP32[r6>>2]=4;r21=r41;r22=r36;break}}}while(0);if((r22|0)==0){r10=1080}else{r19=HEAP32[r22+12>>2];if((r19|0)==(HEAP32[r22+16>>2]|0)){r65=FUNCTION_TABLE[HEAP32[HEAP32[r22>>2]+36>>2]](r22)}else{r65=HEAP32[r19>>2]}if((r65|0)==-1){r66=0}else{r10=1080}}if(r10==1080){r66=r22}r19=(r66|0)==0;do{if((r21|0)==0){r10=1086}else{r18=HEAP32[r21+12>>2];if((r18|0)==(HEAP32[r21+16>>2]|0)){r67=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r67=HEAP32[r18>>2]}if((r67|0)==-1){r10=1086;break}if(!r19){break}r68=r1|0;HEAP32[r68>>2]=r66;STACKTOP=r11;return}}while(0);do{if(r10==1086){if(r19){break}r68=r1|0;HEAP32[r68>>2]=r66;STACKTOP=r11;return}}while(0);HEAP32[r6>>2]=HEAP32[r6>>2]|2;r68=r1|0;HEAP32[r68>>2]=r66;STACKTOP=r11;return}}while(0);r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=6520;___cxa_throw(r11,13200,578)}function __ZNSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev(r1){return}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE13do_date_orderEv(r1){return 2}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_timeES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9;r8=STACKTOP;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r1,r2,HEAP32[r3>>2],HEAP32[r4>>2],r5,r6,r7,6376,6408);STACKTOP=r8;return}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_dateES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13;r8=STACKTOP;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r2+8|0;r10=FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+20>>2]](r9);r9=HEAP8[r10];if((r9&1)==0){r11=r10+4|0}else{r11=HEAP32[r10+8>>2]}r12=r9&255;if((r12&1|0)==0){r13=r12>>>1}else{r13=HEAP32[r10+4>>2]}__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r1,r2,HEAP32[r3>>2],HEAP32[r4>>2],r5,r6,r7,r11,r11+(r13<<2)|0);STACKTOP=r8;return}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE14do_get_weekdayES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r8=STACKTOP;STACKTOP=STACKTOP+16|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=HEAP32[r5+28>>2];r5=r10+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r9>>2]=18552;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r9)}r9=HEAP32[18556>>2]-1|0;r5=HEAP32[r10+8>>2];do{if(HEAP32[r10+12>>2]-r5>>2>>>0>r9>>>0){r11=HEAP32[r5+(r9<<2)>>2];if((r11|0)==0){break}r12=r10+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+8>>2]](r10)}r12=HEAP32[r4>>2];r13=r2+8|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]>>2]](r13);r13=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r12,r14,r14+168|0,r11,r6,0)-r14|0;if((r13|0)>=168){r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}HEAP32[r7+24>>2]=((r13|0)/12&-1|0)%7&-1;r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE16do_get_monthnameES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r8=STACKTOP;STACKTOP=STACKTOP+16|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=HEAP32[r5+28>>2];r5=r10+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r9>>2]=18552;HEAP32[r9+4>>2]=28;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r9)}r9=HEAP32[18556>>2]-1|0;r5=HEAP32[r10+8>>2];do{if(HEAP32[r10+12>>2]-r5>>2>>>0>r9>>>0){r11=HEAP32[r5+(r9<<2)>>2];if((r11|0)==0){break}r12=r10+4|0;if(((tempValue=HEAP32[r12>>2],HEAP32[r12>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+8>>2]](r10)}r12=HEAP32[r4>>2];r13=r2+8|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+4>>2]](r13);r13=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r12,r14,r14+288|0,r11,r6,0)-r14|0;if((r13|0)>=288){r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}HEAP32[r7+16>>2]=((r13|0)/12&-1|0)%12&-1;r15=r3|0;r16=HEAP32[r15>>2];r17=r1|0;HEAP32[r17>>2]=r16;STACKTOP=r8;return}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=6520;___cxa_throw(r8,13200,578)}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_yearES4_S4_RNS_8ios_baseERjP2tm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r8=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r8>>2];r8=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r8>>2];r8=r2;r9=HEAP32[r5+28>>2];r5=r9+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[18552>>2]|0)!=-1){HEAP32[r8>>2]=18552;HEAP32[r8+4>>2]=28;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r8)}r8=HEAP32[18556>>2]-1|0;r5=HEAP32[r9+8>>2];do{if(HEAP32[r9+12>>2]-r5>>2>>>0>r8>>>0){r10=HEAP32[r5+(r8<<2)>>2];if((r10|0)==0){break}r11=r9+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+8>>2]](r9)}r11=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,HEAP32[r4>>2],r6,r10,4);if((HEAP32[r6>>2]&4|0)!=0){r12=r3|0;r13=HEAP32[r12>>2];r14=r1|0;HEAP32[r14>>2]=r13;STACKTOP=r2;return}if((r11|0)<69){r15=r11+2e3|0}else{r15=(r11-69|0)>>>0<31?r11+1900|0:r11}HEAP32[r7+20>>2]=r15-1900;r12=r3|0;r13=HEAP32[r12>>2];r14=r1|0;HEAP32[r14>>2]=r13;STACKTOP=r2;return}}while(0);r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=6520;___cxa_throw(r2,13200,578)}function __ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjP2tmcc(r1,r2,r3,r4,r5,r6,r7,r8,r9){var r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556;r10=0;r11=STACKTOP;STACKTOP=STACKTOP+88|0;r12=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r12>>2];r12=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r12>>2];r13=r11;r14=r11+16;r15=r11+24;r16=r11+32;r17=r11+40;r18=r11+48;r19=r11+56;r20=r11+64;r21=r11+72;r22=r11+80;HEAP32[r6>>2]=0;r23=r5+28|0;r24=HEAP32[r23>>2];r25=r24+4|0;r26=r25;r27=(tempValue=HEAP32[r26>>2],HEAP32[r26>>2]=tempValue+1,tempValue);r28=r13;r29=HEAP32[18552>>2];r30=(r29|0)==-1;if(!r30){r31=r13|0;HEAP32[r31>>2]=18552;r32=r13+4|0;HEAP32[r32>>2]=28;r33=r13+8|0;HEAP32[r33>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18552,r28)}r34=HEAP32[18556>>2];r35=r34-1|0;r36=r24+12|0;r37=r36;r38=HEAP32[r37>>2];r39=r24+8|0;r40=r39;r41=HEAP32[r40>>2];r42=r38;r43=r41;r44=r42-r43|0;r45=r44>>2;r46=r45>>>0>r35>>>0;do{if(r46){r47=r41+(r35<<2)|0;r48=HEAP32[r47>>2];r49=(r48|0)==0;if(r49){break}r50=r48;r51=r24+4|0;r52=r51;r53=(tempValue=HEAP32[r52>>2],HEAP32[r52>>2]=tempValue+ -1,tempValue);r54=(r53|0)==0;if(r54){r55=r24;r56=r24;r57=HEAP32[r56>>2];r58=r57+8|0;r59=HEAP32[r58>>2];FUNCTION_TABLE[r59](r55)}r60=r8<<24>>24;L1366:do{switch(r60|0){case 99:{r61=r2+8|0;r62=r61;r63=HEAP32[r62>>2];r64=r63+12|0;r65=HEAP32[r64>>2];r66=FUNCTION_TABLE[r65](r61);r67=r3|0;r68=HEAP32[r67>>2];r69=r4|0;r70=HEAP32[r69>>2];r71=r66;r72=HEAP8[r71];r73=r72&1;r74=r73<<24>>24==0;if(r74){r75=r66+4|0;r76=r75}else{r77=r66+8|0;r78=HEAP32[r77>>2];r76=r78}r79=r72&255;r80=r79&1;r81=(r80|0)==0;if(r81){r82=r79>>>1;r83=r82}else{r84=r66+4|0;r85=HEAP32[r84>>2];r83=r85}r86=r76+(r83<<2)|0;__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r14,r2,r68,r70,r5,r6,r7,r76,r86);r87=r14|0;r88=HEAP32[r87>>2];HEAP32[r67>>2]=r88;break};case 98:case 66:case 104:{r89=r4|0;r90=HEAP32[r89>>2];r91=r2+8|0;r92=r91;r93=HEAP32[r92>>2];r94=r93+4|0;r95=HEAP32[r94>>2];r96=FUNCTION_TABLE[r95](r91);r97=r96+288|0;r98=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r90,r96,r97,r50,r6,0);r99=r98;r100=r96;r101=r99-r100|0;r102=(r101|0)<288;if(!r102){break L1366}r103=r7+16|0;r104=(r101|0)/12&-1;r105=(r104|0)%12&-1;HEAP32[r103>>2]=r105;break};case 109:{r106=r4|0;r107=HEAP32[r106>>2];r108=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r107,r6,r50,2);r109=r108-1|0;r110=HEAP32[r6>>2];r111=r110&4;r112=(r111|0)==0;r113=(r109|0)<12;r114=r112&r113;if(r114){r115=r7+16|0;HEAP32[r115>>2]=r109;break L1366}else{r116=r110|4;HEAP32[r6>>2]=r116;break L1366}break};case 73:{r117=r7+8|0;r118=r4|0;r119=HEAP32[r118>>2];r120=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r119,r6,r50,2);r121=HEAP32[r6>>2];r122=r121&4;r123=(r122|0)==0;do{if(r123){r124=r120-1|0;r125=r124>>>0<12;if(!r125){break}HEAP32[r117>>2]=r120;break L1366}}while(0);r126=r121|4;HEAP32[r6>>2]=r126;break};case 68:{r127=r3|0;r128=HEAP32[r127>>2];r129=r4|0;r130=HEAP32[r129>>2];__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r15,r2,r128,r130,r5,r6,r7,6344,6376);r131=r15|0;r132=HEAP32[r131>>2];HEAP32[r127>>2]=r132;break};case 112:{r133=r7+8|0;r134=r4|0;r135=HEAP32[r134>>2];r136=r2+8|0;r137=r136;r138=HEAP32[r137>>2];r139=r138+8|0;r140=HEAP32[r139>>2];r141=FUNCTION_TABLE[r140](r136);r142=r141;r143=HEAP8[r142];r144=r143&255;r145=r144&1;r146=(r145|0)==0;if(r146){r147=r144>>>1;r148=r147}else{r149=r141+4|0;r150=HEAP32[r149>>2];r148=r150}r151=r141+12|0;r152=r151;r153=HEAP8[r152];r154=r153&255;r155=r154&1;r156=(r155|0)==0;if(r156){r157=r154>>>1;r158=r157}else{r159=r141+16|0;r160=HEAP32[r159>>2];r158=r160}r161=-r158|0;r162=(r148|0)==(r161|0);if(r162){r163=HEAP32[r6>>2];r164=r163|4;HEAP32[r6>>2]=r164;break L1366}r165=r141+24|0;r166=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r135,r141,r165,r50,r6,0);r167=r166;r168=r141;r169=r167-r168|0;r170=(r166|0)==(r141|0);do{if(r170){r171=HEAP32[r133>>2];r172=(r171|0)==12;if(!r172){break}HEAP32[r133>>2]=0;break L1366}}while(0);r173=(r169|0)==12;if(!r173){break L1366}r174=HEAP32[r133>>2];r175=(r174|0)<12;if(!r175){break L1366}r176=r174+12|0;HEAP32[r133>>2]=r176;break};case 84:{r177=r3|0;r178=HEAP32[r177>>2];r179=r4|0;r180=HEAP32[r179>>2];__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r19,r2,r178,r180,r5,r6,r7,6240,6272);r181=r19|0;r182=HEAP32[r181>>2];HEAP32[r177>>2]=r182;break};case 119:{r183=r4|0;r184=HEAP32[r183>>2];r185=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r184,r6,r50,1);r186=HEAP32[r6>>2];r187=r186&4;r188=(r187|0)==0;r189=(r185|0)<7;r190=r188&r189;if(r190){r191=r7+24|0;HEAP32[r191>>2]=r185;break L1366}else{r192=r186|4;HEAP32[r6>>2]=r192;break L1366}break};case 120:{r193=r2;r194=HEAP32[r193>>2];r195=r194+20|0;r196=HEAP32[r195>>2];r197=r3|0;r198=HEAP32[r197>>2];r199=r20|0;HEAP32[r199>>2]=r198;r200=r4|0;r201=HEAP32[r200>>2];r202=r21|0;HEAP32[r202>>2]=r201;FUNCTION_TABLE[r196](r1,r2,r20,r21,r5,r6,r7);STACKTOP=r11;return;break};case 88:{r203=r2+8|0;r204=r203;r205=HEAP32[r204>>2];r206=r205+24|0;r207=HEAP32[r206>>2];r208=FUNCTION_TABLE[r207](r203);r209=r3|0;r210=HEAP32[r209>>2];r211=r4|0;r212=HEAP32[r211>>2];r213=r208;r214=HEAP8[r213];r215=r214&1;r216=r215<<24>>24==0;if(r216){r217=r208+4|0;r218=r217}else{r219=r208+8|0;r220=HEAP32[r219>>2];r218=r220}r221=r214&255;r222=r221&1;r223=(r222|0)==0;if(r223){r224=r221>>>1;r225=r224}else{r226=r208+4|0;r227=HEAP32[r226>>2];r225=r227}r228=r218+(r225<<2)|0;__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r22,r2,r210,r212,r5,r6,r7,r218,r228);r229=r22|0;r230=HEAP32[r229>>2];HEAP32[r209>>2]=r230;break};case 97:case 65:{r231=r4|0;r232=HEAP32[r231>>2];r233=r2+8|0;r234=r233;r235=HEAP32[r234>>2];r236=HEAP32[r235>>2];r237=FUNCTION_TABLE[r236](r233);r238=r237+168|0;r239=__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,r232,r237,r238,r50,r6,0);r240=r239;r241=r237;r242=r240-r241|0;r243=(r242|0)<168;if(!r243){break L1366}r244=r7+24|0;r245=(r242|0)/12&-1;r246=(r245|0)%7&-1;HEAP32[r244>>2]=r246;break};case 121:{r247=r7+20|0;r248=r4|0;r249=HEAP32[r248>>2];r250=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r249,r6,r50,4);r251=HEAP32[r6>>2];r252=r251&4;r253=(r252|0)==0;if(!r253){break L1366}r254=(r250|0)<69;if(r254){r255=r250+2e3|0;r256=r255}else{r257=r250-69|0;r258=r257>>>0<31;r259=r250+1900|0;r260=r258?r259:r250;r256=r260}r261=r256-1900|0;HEAP32[r247>>2]=r261;break};case 89:{r262=r4|0;r263=HEAP32[r262>>2];r264=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r263,r6,r50,4);r265=HEAP32[r6>>2];r266=r265&4;r267=(r266|0)==0;if(!r267){break L1366}r268=r7+20|0;r269=r264-1900|0;HEAP32[r268>>2]=r269;break};case 37:{r270=r4|0;r271=HEAP32[r270>>2];r272=r3|0;r273=HEAP32[r272>>2];r274=(r273|0)==0;do{if(r274){r275=1}else{r276=r273+12|0;r277=HEAP32[r276>>2];r278=r273+16|0;r279=HEAP32[r278>>2];r280=(r277|0)==(r279|0);if(r280){r281=r273;r282=HEAP32[r281>>2];r283=r282+36|0;r284=HEAP32[r283>>2];r285=FUNCTION_TABLE[r284](r273);r286=r285}else{r287=HEAP32[r277>>2];r286=r287}r288=(r286|0)==-1;if(r288){HEAP32[r272>>2]=0;r275=1;break}else{r289=HEAP32[r272>>2];r290=(r289|0)==0;r275=r290;break}}}while(0);r291=(r271|0)==0;do{if(r291){r10=1291}else{r292=r271+12|0;r293=HEAP32[r292>>2];r294=r271+16|0;r295=HEAP32[r294>>2];r296=(r293|0)==(r295|0);if(r296){r297=r271;r298=HEAP32[r297>>2];r299=r298+36|0;r300=HEAP32[r299>>2];r301=FUNCTION_TABLE[r300](r271);r302=r301}else{r303=HEAP32[r293>>2];r302=r303}r304=(r302|0)==-1;if(r304){r10=1291;break}if(r275){r305=r271;r306=0}else{r10=1293}}}while(0);if(r10==1291){if(r275){r10=1293}else{r305=0;r306=1}}if(r10==1293){r307=HEAP32[r6>>2];r308=r307|6;HEAP32[r6>>2]=r308;break L1366}r309=HEAP32[r272>>2];r310=r309+12|0;r311=HEAP32[r310>>2];r312=r309+16|0;r313=HEAP32[r312>>2];r314=(r311|0)==(r313|0);if(r314){r315=r309;r316=HEAP32[r315>>2];r317=r316+36|0;r318=HEAP32[r317>>2];r319=FUNCTION_TABLE[r318](r309);r320=r319}else{r321=HEAP32[r311>>2];r320=r321}r322=r48;r323=HEAP32[r322>>2];r324=r323+52|0;r325=HEAP32[r324>>2];r326=FUNCTION_TABLE[r325](r50,r320,0);r327=r326<<24>>24==37;if(!r327){r328=HEAP32[r6>>2];r329=r328|4;HEAP32[r6>>2]=r329;break L1366}r330=HEAP32[r272>>2];r331=r330+12|0;r332=HEAP32[r331>>2];r333=r330+16|0;r334=HEAP32[r333>>2];r335=(r332|0)==(r334|0);if(r335){r336=r330;r337=HEAP32[r336>>2];r338=r337+40|0;r339=HEAP32[r338>>2];r340=FUNCTION_TABLE[r339](r330)}else{r341=r332+4|0;HEAP32[r331>>2]=r341}r342=HEAP32[r272>>2];r343=(r342|0)==0;do{if(r343){r344=1}else{r345=r342+12|0;r346=HEAP32[r345>>2];r347=r342+16|0;r348=HEAP32[r347>>2];r349=(r346|0)==(r348|0);if(r349){r350=r342;r351=HEAP32[r350>>2];r352=r351+36|0;r353=HEAP32[r352>>2];r354=FUNCTION_TABLE[r353](r342);r355=r354}else{r356=HEAP32[r346>>2];r355=r356}r357=(r355|0)==-1;if(r357){HEAP32[r272>>2]=0;r344=1;break}else{r358=HEAP32[r272>>2];r359=(r358|0)==0;r344=r359;break}}}while(0);do{if(r306){r10=1314}else{r360=r305+12|0;r361=HEAP32[r360>>2];r362=r305+16|0;r363=HEAP32[r362>>2];r364=(r361|0)==(r363|0);if(r364){r365=r305;r366=HEAP32[r365>>2];r367=r366+36|0;r368=HEAP32[r367>>2];r369=FUNCTION_TABLE[r368](r305);r370=r369}else{r371=HEAP32[r361>>2];r370=r371}r372=(r370|0)==-1;if(r372){r10=1314;break}r373=(r305|0)==0;r374=r344^r373;if(r374){break L1366}}}while(0);if(r10==1314){if(!r344){break L1366}}r375=HEAP32[r6>>2];r376=r375|2;HEAP32[r6>>2]=r376;break};case 106:{r377=r4|0;r378=HEAP32[r377>>2];r379=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r378,r6,r50,3);r380=HEAP32[r6>>2];r381=r380&4;r382=(r381|0)==0;r383=(r379|0)<366;r384=r382&r383;if(r384){r385=r7+28|0;HEAP32[r385>>2]=r379;break L1366}else{r386=r380|4;HEAP32[r6>>2]=r386;break L1366}break};case 70:{r387=r3|0;r388=HEAP32[r387>>2];r389=r4|0;r390=HEAP32[r389>>2];__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r16,r2,r388,r390,r5,r6,r7,6208,6240);r391=r16|0;r392=HEAP32[r391>>2];HEAP32[r387>>2]=r392;break};case 72:{r393=r4|0;r394=HEAP32[r393>>2];r395=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r394,r6,r50,2);r396=HEAP32[r6>>2];r397=r396&4;r398=(r397|0)==0;r399=(r395|0)<24;r400=r398&r399;if(r400){r401=r7+8|0;HEAP32[r401>>2]=r395;break L1366}else{r402=r396|4;HEAP32[r6>>2]=r402;break L1366}break};case 100:case 101:{r403=r7+12|0;r404=r4|0;r405=HEAP32[r404>>2];r406=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r405,r6,r50,2);r407=HEAP32[r6>>2];r408=r407&4;r409=(r408|0)==0;do{if(r409){r410=r406-1|0;r411=r410>>>0<31;if(!r411){break}HEAP32[r403>>2]=r406;break L1366}}while(0);r412=r407|4;HEAP32[r6>>2]=r412;break};case 77:{r413=r4|0;r414=HEAP32[r413>>2];r415=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r414,r6,r50,2);r416=HEAP32[r6>>2];r417=r416&4;r418=(r417|0)==0;r419=(r415|0)<60;r420=r418&r419;if(r420){r421=r7+4|0;HEAP32[r421>>2]=r415;break L1366}else{r422=r416|4;HEAP32[r6>>2]=r422;break L1366}break};case 114:{r423=r3|0;r424=HEAP32[r423>>2];r425=r4|0;r426=HEAP32[r425>>2];__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r17,r2,r424,r426,r5,r6,r7,6296,6340);r427=r17|0;r428=HEAP32[r427>>2];HEAP32[r423>>2]=r428;break};case 82:{r429=r3|0;r430=HEAP32[r429>>2];r431=r4|0;r432=HEAP32[r431>>2];__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE3getES4_S4_RNS_8ios_baseERjP2tmPKwSC_(r18,r2,r430,r432,r5,r6,r7,6272,6292);r433=r18|0;r434=HEAP32[r433>>2];HEAP32[r429>>2]=r434;break};case 83:{r435=r4|0;r436=HEAP32[r435>>2];r437=__ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r3,r436,r6,r50,2);r438=HEAP32[r6>>2];r439=r438&4;r440=(r439|0)==0;r441=(r437|0)<61;r442=r440&r441;if(r442){r443=r7|0;HEAP32[r443>>2]=r437;break L1366}else{r444=r438|4;HEAP32[r6>>2]=r444;break L1366}break};case 110:case 116:{r445=r4|0;r446=HEAP32[r445>>2];r447=r3|0;r448=r48;r449=r446;L1512:while(1){r450=HEAP32[r447>>2];r451=(r450|0)==0;do{if(r451){r452=1}else{r453=r450+12|0;r454=HEAP32[r453>>2];r455=r450+16|0;r456=HEAP32[r455>>2];r457=(r454|0)==(r456|0);if(r457){r458=r450;r459=HEAP32[r458>>2];r460=r459+36|0;r461=HEAP32[r460>>2];r462=FUNCTION_TABLE[r461](r450);r463=r462}else{r464=HEAP32[r454>>2];r463=r464}r465=(r463|0)==-1;if(r465){HEAP32[r447>>2]=0;r452=1;break}else{r466=HEAP32[r447>>2];r467=(r466|0)==0;r452=r467;break}}}while(0);r468=(r449|0)==0;do{if(r468){r10=1217}else{r469=r449+12|0;r470=HEAP32[r469>>2];r471=r449+16|0;r472=HEAP32[r471>>2];r473=(r470|0)==(r472|0);if(r473){r474=r449;r475=HEAP32[r474>>2];r476=r475+36|0;r477=HEAP32[r476>>2];r478=FUNCTION_TABLE[r477](r449);r479=r478}else{r480=HEAP32[r470>>2];r479=r480}r481=(r479|0)==-1;if(r481){r10=1217;break}if(r452){r482=0;r483=r449}else{r484=r449;r485=0;break L1512}}}while(0);if(r10==1217){r10=0;if(r452){r484=0;r485=1;break}else{r482=1;r483=0}}r486=HEAP32[r447>>2];r487=r486+12|0;r488=HEAP32[r487>>2];r489=r486+16|0;r490=HEAP32[r489>>2];r491=(r488|0)==(r490|0);if(r491){r492=r486;r493=HEAP32[r492>>2];r494=r493+36|0;r495=HEAP32[r494>>2];r496=FUNCTION_TABLE[r495](r486);r497=r496}else{r498=HEAP32[r488>>2];r497=r498}r499=HEAP32[r448>>2];r500=r499+12|0;r501=HEAP32[r500>>2];r502=FUNCTION_TABLE[r501](r50,8192,r497);if(!r502){r484=r483;r485=r482;break}r503=HEAP32[r447>>2];r504=r503+12|0;r505=HEAP32[r504>>2];r506=r503+16|0;r507=HEAP32[r506>>2];r508=(r505|0)==(r507|0);if(r508){r509=r503;r510=HEAP32[r509>>2];r511=r510+40|0;r512=HEAP32[r511>>2];r513=FUNCTION_TABLE[r512](r503);r449=r483;continue}else{r514=r505+4|0;HEAP32[r504>>2]=r514;r449=r483;continue}}r515=HEAP32[r447>>2];r516=(r515|0)==0;do{if(r516){r517=1}else{r518=r515+12|0;r519=HEAP32[r518>>2];r520=r515+16|0;r521=HEAP32[r520>>2];r522=(r519|0)==(r521|0);if(r522){r523=r515;r524=HEAP32[r523>>2];r525=r524+36|0;r526=HEAP32[r525>>2];r527=FUNCTION_TABLE[r526](r515);r528=r527}else{r529=HEAP32[r519>>2];r528=r529}r530=(r528|0)==-1;if(r530){HEAP32[r447>>2]=0;r517=1;break}else{r531=HEAP32[r447>>2];r532=(r531|0)==0;r517=r532;break}}}while(0);do{if(r485){r10=1238}else{r533=r484+12|0;r534=HEAP32[r533>>2];r535=r484+16|0;r536=HEAP32[r535>>2];r537=(r534|0)==(r536|0);if(r537){r538=r484;r539=HEAP32[r538>>2];r540=r539+36|0;r541=HEAP32[r540>>2];r542=FUNCTION_TABLE[r541](r484);r543=r542}else{r544=HEAP32[r534>>2];r543=r544}r545=(r543|0)==-1;if(r545){r10=1238;break}r546=(r484|0)==0;r547=r517^r546;if(r547){break L1366}}}while(0);if(r10==1238){if(!r517){break L1366}}r548=HEAP32[r6>>2];r549=r548|2;HEAP32[r6>>2]=r549;break};default:{r550=HEAP32[r6>>2];r551=r550|4;HEAP32[r6>>2]=r551}}}while(0);r552=r3|0;r553=HEAP32[r552>>2];r554=r1|0;HEAP32[r554>>2]=r553;STACKTOP=r11;return}}while(0);r555=___cxa_allocate_exception(4);r556=r555;HEAP32[r556>>2]=6520;___cxa_throw(r555,13200,578)}function __ZNSt3__120__get_up_to_n_digitsIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEEEiRT0_S5_RjRKNS_5ctypeIT_EEi(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r6=0;r7=r1|0;r1=HEAP32[r7>>2];do{if((r1|0)==0){r8=1}else{r9=HEAP32[r1+12>>2];if((r9|0)==(HEAP32[r1+16>>2]|0)){r10=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)}else{r10=HEAP32[r9>>2]}if((r10|0)==-1){HEAP32[r7>>2]=0;r8=1;break}else{r8=(HEAP32[r7>>2]|0)==0;break}}}while(0);do{if((r2|0)==0){r6=1334}else{r10=HEAP32[r2+12>>2];if((r10|0)==(HEAP32[r2+16>>2]|0)){r11=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+36>>2]](r2)}else{r11=HEAP32[r10>>2]}if((r11|0)==-1){r6=1334;break}if(r8){r12=r2}else{r6=1336}}}while(0);if(r6==1334){if(r8){r6=1336}else{r12=0}}if(r6==1336){HEAP32[r3>>2]=HEAP32[r3>>2]|6;r13=0;return r13}r8=HEAP32[r7>>2];r2=HEAP32[r8+12>>2];if((r2|0)==(HEAP32[r8+16>>2]|0)){r14=FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+36>>2]](r8)}else{r14=HEAP32[r2>>2]}r2=r4;if(!FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+12>>2]](r4,2048,r14)){HEAP32[r3>>2]=HEAP32[r3>>2]|4;r13=0;return r13}r8=r4;r11=FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+52>>2]](r4,r14,0)<<24>>24;r14=HEAP32[r7>>2];r10=r14+12|0;r1=HEAP32[r10>>2];if((r1|0)==(HEAP32[r14+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+40>>2]](r14);r15=r11;r16=r5;r17=r12}else{HEAP32[r10>>2]=r1+4;r15=r11;r16=r5;r17=r12}while(1){r18=r15-48|0;r12=r16-1|0;r5=HEAP32[r7>>2];do{if((r5|0)==0){r19=0}else{r11=HEAP32[r5+12>>2];if((r11|0)==(HEAP32[r5+16>>2]|0)){r20=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+36>>2]](r5)}else{r20=HEAP32[r11>>2]}if((r20|0)==-1){HEAP32[r7>>2]=0;r19=0;break}else{r19=HEAP32[r7>>2];break}}}while(0);r5=(r19|0)==0;if((r17|0)==0){r21=r19;r22=0}else{r11=HEAP32[r17+12>>2];if((r11|0)==(HEAP32[r17+16>>2]|0)){r23=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r23=HEAP32[r11>>2]}r21=HEAP32[r7>>2];r22=(r23|0)==-1?0:r17}r24=(r22|0)==0;if(!((r5^r24)&(r12|0)>0)){break}r5=HEAP32[r21+12>>2];if((r5|0)==(HEAP32[r21+16>>2]|0)){r25=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r25=HEAP32[r5>>2]}if(!FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+12>>2]](r4,2048,r25)){r13=r18;r6=1385;break}r5=(FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+52>>2]](r4,r25,0)<<24>>24)+(r18*10&-1)|0;r11=HEAP32[r7>>2];r1=r11+12|0;r10=HEAP32[r1>>2];if((r10|0)==(HEAP32[r11+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+40>>2]](r11);r15=r5;r16=r12;r17=r22;continue}else{HEAP32[r1>>2]=r10+4;r15=r5;r16=r12;r17=r22;continue}}if(r6==1385){return r13}do{if((r21|0)==0){r26=1}else{r17=HEAP32[r21+12>>2];if((r17|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r17>>2]}if((r27|0)==-1){HEAP32[r7>>2]=0;r26=1;break}else{r26=(HEAP32[r7>>2]|0)==0;break}}}while(0);do{if(r24){r6=1377}else{r7=HEAP32[r22+12>>2];if((r7|0)==(HEAP32[r22+16>>2]|0)){r28=FUNCTION_TABLE[HEAP32[HEAP32[r22>>2]+36>>2]](r22)}else{r28=HEAP32[r7>>2]}if((r28|0)==-1){r6=1377;break}if(r26){r13=r18}else{break}return r13}}while(0);do{if(r6==1377){if(r26){break}else{r13=r18}return r13}}while(0);HEAP32[r3>>2]=HEAP32[r3>>2]|2;r13=r18;return r13}function __ZNSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev(r1){var r2,r3,r4;r2=r1;r3=r1+8|0;r4=HEAP32[r3>>2];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((r4|0)!=(HEAP32[17128>>2]|0)){_freelocale(HEAP32[r3>>2])}if((r1|0)==0){return}_free(r2);return}function __ZNSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev(r1){var r2;r2=r1+8|0;r1=HEAP32[r2>>2];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((r1|0)==(HEAP32[17128>>2]|0)){return}_freelocale(HEAP32[r2>>2]);return}function __ZNKSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcPK2tmcc(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r5=STACKTOP;STACKTOP=STACKTOP+112|0;r4=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r4>>2];r4=r5;r9=r5+8;r10=r9|0;r11=r4|0;HEAP8[r11]=37;r12=r4+1|0;HEAP8[r12]=r7;r13=r4+2|0;HEAP8[r13]=r8;HEAP8[r4+3|0]=0;if(r8<<24>>24!=0){HEAP8[r12]=r8;HEAP8[r13]=r7}r7=_strftime(r10,100,r11,r6,HEAP32[r2+8>>2]);r2=r9+r7|0;r9=HEAP32[r3>>2];if((r7|0)==0){r14=r9;r15=r1|0;HEAP32[r15>>2]=r14;STACKTOP=r5;return}else{r16=r9;r17=r10}while(1){r10=HEAP8[r17];if((r16|0)==0){r18=0}else{r9=r16+24|0;r7=HEAP32[r9>>2];if((r7|0)==(HEAP32[r16+28>>2]|0)){r19=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+52>>2]](r16,r10&255)}else{HEAP32[r9>>2]=r7+1;HEAP8[r7]=r10;r19=r10&255}r18=(r19|0)==-1?0:r16}r10=r17+1|0;if((r10|0)==(r2|0)){r14=r18;break}else{r16=r18;r17=r10}}r15=r1|0;HEAP32[r15>>2]=r14;STACKTOP=r5;return}function __ZNSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev(r1){var r2,r3,r4;r2=r1;r3=r1+8|0;r4=HEAP32[r3>>2];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((r4|0)!=(HEAP32[17128>>2]|0)){_freelocale(HEAP32[r3>>2])}if((r1|0)==0){return}_free(r2);return}function __ZNSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev(r1){var r2;r2=r1+8|0;r1=HEAP32[r2>>2];do{if((HEAP8[19120]|0)==0){if((___cxa_guard_acquire(19120)|0)==0){break}HEAP32[17128>>2]=_newlocale(2147483647,4528,0)}}while(0);if((r1|0)==(HEAP32[17128>>2]|0)){return}_freelocale(HEAP32[r2>>2]);return}function __ZNKSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwPK2tmcc(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r5=STACKTOP;STACKTOP=STACKTOP+528|0;r4=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r4>>2];r4=r5;r9=r5+112;r10=r5+120;r11=r5+128;r12=r11|0;r13=r5+8|0;r14=r4|0;HEAP8[r14]=37;r15=r4+1|0;HEAP8[r15]=r7;r16=r4+2|0;HEAP8[r16]=r8;HEAP8[r4+3|0]=0;if(r8<<24>>24!=0){HEAP8[r15]=r8;HEAP8[r16]=r7}r7=r2+8|0;_strftime(r13,100,r14,r6,HEAP32[r7>>2]);HEAP32[r9>>2]=0;HEAP32[r9+4>>2]=0;HEAP32[r10>>2]=r13;r13=_uselocale(HEAP32[r7>>2]);r7=_mbsrtowcs(r12,r10,100,r9);if((r13|0)!=0){_uselocale(r13)}if((r7|0)==-1){__ZNSt3__121__throw_runtime_errorEPKc(2864)}r13=r11+(r7<<2)|0;r11=HEAP32[r3>>2];if((r7|0)==0){r17=r11;r18=r1|0;HEAP32[r18>>2]=r17;STACKTOP=r5;return}else{r19=r11;r20=r12}while(1){r12=HEAP32[r20>>2];if((r19|0)==0){r21=0}else{r11=r19+24|0;r7=HEAP32[r11>>2];if((r7|0)==(HEAP32[r19+28>>2]|0)){r22=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+52>>2]](r19,r12)}else{HEAP32[r11>>2]=r7+4;HEAP32[r7>>2]=r12;r22=r12}r21=(r22|0)==-1?0:r19}r12=r20+4|0;if((r12|0)==(r13|0)){r17=r21;break}else{r19=r21;r20=r12}}r18=r1|0;HEAP32[r18>>2]=r17;STACKTOP=r5;return}function __ZNSt3__110moneypunctIcLb0EED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__110moneypunctIcLb0EED1Ev(r1){return}function __ZNKSt3__110moneypunctIcLb0EE16do_decimal_pointEv(r1){return 127}function __ZNKSt3__110moneypunctIcLb0EE16do_thousands_sepEv(r1){return 127}function __ZNKSt3__110moneypunctIcLb0EE11do_groupingEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIcLb0EE14do_curr_symbolEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIcLb0EE16do_positive_signEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIcLb0EE16do_negative_signEv(r1,r2){r2=r1;HEAP8[r1]=2;HEAP8[r2+1|0]=45;HEAP8[r2+2|0]=0;return}function __ZNKSt3__110moneypunctIcLb0EE14do_frac_digitsEv(r1){return 0}function __ZNKSt3__110moneypunctIcLb0EE13do_pos_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNKSt3__110moneypunctIcLb0EE13do_neg_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNSt3__110moneypunctIcLb1EED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__110moneypunctIcLb1EED1Ev(r1){return}function __ZNKSt3__110moneypunctIcLb1EE16do_decimal_pointEv(r1){return 127}function __ZNKSt3__110moneypunctIcLb1EE16do_thousands_sepEv(r1){return 127}function __ZNKSt3__110moneypunctIcLb1EE11do_groupingEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIcLb1EE14do_curr_symbolEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIcLb1EE16do_positive_signEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIcLb1EE16do_negative_signEv(r1,r2){r2=r1;HEAP8[r1]=2;HEAP8[r2+1|0]=45;HEAP8[r2+2|0]=0;return}function __ZNKSt3__110moneypunctIcLb1EE14do_frac_digitsEv(r1){return 0}function __ZNKSt3__110moneypunctIcLb1EE13do_pos_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNKSt3__110moneypunctIcLb1EE13do_neg_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNSt3__110moneypunctIwLb0EED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__110moneypunctIwLb0EED1Ev(r1){return}function __ZNKSt3__110moneypunctIwLb0EE16do_decimal_pointEv(r1){return 2147483647}function __ZNKSt3__110moneypunctIwLb0EE16do_thousands_sepEv(r1){return 2147483647}function __ZNKSt3__110moneypunctIwLb0EE11do_groupingEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIwLb0EE14do_curr_symbolEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIwLb0EE16do_positive_signEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIwLb0EE16do_negative_signEv(r1,r2){var r3,r4;HEAP8[r1]=2;r2=r1+4|0;r1=1;r3=r2;while(1){r4=r1-1|0;HEAP32[r3>>2]=45;if((r4|0)==0){break}else{r1=r4;r3=r3+4|0}}HEAP32[r2+4>>2]=0;return}function __ZNKSt3__110moneypunctIwLb0EE14do_frac_digitsEv(r1){return 0}function __ZNKSt3__110moneypunctIwLb0EE13do_pos_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNKSt3__110moneypunctIwLb0EE13do_neg_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNSt3__110moneypunctIwLb1EED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__110moneypunctIwLb1EED1Ev(r1){return}function __ZNKSt3__110moneypunctIwLb1EE16do_decimal_pointEv(r1){return 2147483647}function __ZNKSt3__110moneypunctIwLb1EE16do_thousands_sepEv(r1){return 2147483647}function __ZNKSt3__110moneypunctIwLb1EE11do_groupingEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIwLb1EE14do_curr_symbolEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIwLb1EE16do_positive_signEv(r1,r2){r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return}function __ZNKSt3__110moneypunctIwLb1EE16do_negative_signEv(r1,r2){var r3,r4;HEAP8[r1]=2;r2=r1+4|0;r1=1;r3=r2;while(1){r4=r1-1|0;HEAP32[r3>>2]=45;if((r4|0)==0){break}else{r1=r4;r3=r3+4|0}}HEAP32[r2+4>>2]=0;return}function __ZNKSt3__110moneypunctIwLb1EE14do_frac_digitsEv(r1){return 0}function __ZNKSt3__110moneypunctIwLb1EE13do_pos_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNKSt3__110moneypunctIwLb1EE13do_neg_formatEv(r1,r2){r2=r1;tempBigInt=67109634;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt&255;return}function __ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev(r1){return}function __ZNKSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_bRNS_8ios_baseERjRe(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r2=0;r9=0;r10=STACKTOP;STACKTOP=STACKTOP+264|0;r11=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r11>>2];r11=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r11>>2];r11=r10;r12=r10+16;r13=r10+120;r14=r10+128;r15=r10+136;r16=r10+144;r17=r10+160;r18=r13|0;HEAP32[r18>>2]=r12;r19=r13+4|0;HEAP32[r19>>2]=466;r20=r12+100|0;r12=HEAP32[r6+28>>2];r21=r12;r22=r12+4|0;tempValue=HEAP32[r22>>2],HEAP32[r22>>2]=tempValue+1,tempValue;if((HEAP32[18560>>2]|0)!=-1){HEAP32[r11>>2]=18560;HEAP32[r11+4>>2]=28;HEAP32[r11+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(18560,r11)}r11=HEAP32[18564>>2]-1|0;r22=HEAP32[r12+8>>2];do{if(HEAP32[r12+12>>2]-r22>>2>>>0>r11>>>0){r23=HEAP32[r22+(r11<<2)>>2];if((r23|0)==0){break}r24=r23;HEAP8[r15]=0;r25=r4|0;do{if(__ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE8__do_getERS4_S4_bRKNS_6localeEjRjRbRKNS_5ctypeIcEERNS_10unique_ptrIcPFvPvEEERPcSM_(r3,HEAP32[r25>>2],r5,r21,HEAP32[r6+4>>2],r7,r15,r24,r13,r14,r20)){r26=r16|0;FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+32>>2]](r24,6192,6202,r26);r27=r17|0;r28=HEAP32[r14>>2];r29=HEAP32[r18>>2];r30=r28-r29|0;do{if((r30|0)>98){r31=_malloc(r30+2|0);if((r31|0)!=0){r32=r31;r33=r31;break}r31=___cxa_allocate_exception(4);HEAP32[r31>>2]=6488;___cxa_throw(r31,13184,74)}else{r32=r27;r33=0}}while(0);if((HEAP8[r15]&1)==0){r34=r32}else{HEAP8[r32]=45;r34=r32+1|0}if(r29>>>0<r28>>>0){r30=r16+10|0;r31=r16;r35=r34;r36=r29;while(1){r37=r26;while(1){if((r37|0)==(r30|0)){r38=r30;break}if((HEAP8[r37]|0)==(HEAP8[r36]|0)){r38=r37;break}else{r37=r37+1|0}}HEAP8[r35]=HEAP8[6192+(r38-r31)|0];r37=r36+1|0;r39=r35+1|0;if(r37>>>0<HEAP32[r14>>2]>>>0){r35=r39;r36=r37}else{r40=r39;break}}}else{r40=r34}HEAP8[r40]=0;r36=_sscanf(r27,4952,(r9=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r9>>2]=r8,r9));STACKTOP=r9;if((r36|0)==1){if((r33|0)==0){break}_free(r33);break}r36=___cxa_allocate_exception(8);HEAP32[r36>>2]=6552;r35=r36+4|0;r31=r35;do{if((r35|0)!=0){while(1){r41=_malloc(28);if((r41|0)!=0){r2=1579;break}r30=(tempValue=HEAP32[19048>>2],HEAP32[19048>>2]=tempValue+0,tempValue);if((r30|0)==0){break}FUNCTION_TABLE[r30]()}if(r2==1579){HEAP32[r41+4>>2]=15;HEAP32[r41>>2]=15;r30=r41+12|0;HEAP32[r31>>2]=r30;HEAP32[r41+8>>2]=0;_memcpy(r30,4872,16)|0;break}r30=___cxa_allocate_exception(4);HEAP32[r30>>2]=6488;___cxa_throw(r30,13184,74)}}while(0);___cxa_throw(r36,13216,204)}}while(0);r24=r3|0;r23=HEAP32[r24>>2];do{if((r23|0)==0){r42=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r42=r23;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)!=-1){r42=r23;break}HEAP32[r24>>2]=0;r42=0}}while(0);r24=(r42|0)==0;r23=HEAP32[r25>>2];do{if((r23|0)==0){r2=1597}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){if(r24){break}else{r2=1599;break}}if((FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1){HEAP32[r25>>2]=0;r2=1597;break}else{if(r24){break}else{r2=1599;break}}}}while(0);if(r2==1597){if(r24){r2=1599}}if(r2==1599){HEAP32[r7>>2]=HEAP32[r7>>2]|2}HEAP32[r1>>2]=r42;r25=r12+4|0;if(((tempValue=HEAP32[r25>>2],HEAP32[r25>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+8>>2]](r12)}r25=HEAP32[r18>>2];HEAP32[r18>>2]=0;if((r25|0)==0){STACKTOP=r10;return}FUNCTION_TABLE[HEAP32[r19>>2]](r25);STACKTOP=r10;return}}while(0);r10=___cxa_allocate_exception(4);HEAP32[r10>>2]=6520;___cxa_throw(r10,13200,578)}function __ZNSt3__112__do_nothingEPv(r1){return}
// EMSCRIPTEN_END_FUNCS
Module["_malloc"] = _malloc;
Module["_free"] = _free;
Module["_realloc"] = _realloc;
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
/*global Module*/
/*global _malloc, _free, _memcpy*/
/*global FUNCTION_TABLE, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32*/
/*global readLatin1String*/
/*global __emval_register, _emval_handle_array, __emval_decref*/
/*global ___getTypeName*/
/*jslint sub:true*/ /* The symbols 'fromWireType' and 'toWireType' must be accessed via array notation to be closure-safe since craftInvokerFunction crafts functions as strings that can't be closured. */
var InternalError = Module['InternalError'] = extendError(Error, 'InternalError');
var BindingError = Module['BindingError'] = extendError(Error, 'BindingError');
var UnboundTypeError = Module['UnboundTypeError'] = extendError(BindingError, 'UnboundTypeError');
function throwInternalError(message) {
    throw new InternalError(message);
}
function throwBindingError(message) {
    throw new BindingError(message);
}
function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};
    function visit(type) {
        if (seen[type]) {
            return;
        }
        if (registeredTypes[type]) {
            return;
        }
        if (typeDependencies[type]) {
            typeDependencies[type].forEach(visit);
            return;
        }
        unboundTypes.push(type);
        seen[type] = true;
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
}
// Creates a function overload resolution table to the given method 'methodName' in the given prototype,
// if the overload table doesn't yet exist.
function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
        proto[methodName] = function() {
            // TODO This check can be removed in -O3 level "unsafe" optimizations.
            if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
            }
            return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        // Move the previous function into the overload table.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
    }            
}
/* Registers a symbol (function, class, enum, ...) as part of the Module JS object so that
   hand-written code is able to access that symbol via 'Module.name'.
   name: The name of the symbol that's being exposed.
   value: The object itself to expose (function, class, ...)
   numArguments: For functions, specifies the number of arguments the function takes in. For other types, unused and undefined.
   To implement support for multiple overloads of a function, an 'overload selector' function is used. That selector function chooses
   the appropriate overload to call from an function overload table. This selector function is only used if multiple overloads are
   actually registered, since it carries a slight performance penalty. */
function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
            throwBindingError("Cannot register public name '" + name + "' twice");
        }
        // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
        // that routes between the two.
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
        }
        // Add the new function into the overload table.
        Module[name].overloadTable[numArguments] = value;
    }
    else {
        Module[name] = value;
        if (undefined !== numArguments) {
            Module[name].numArguments = numArguments;
        }
    }
}
function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
        throwInternalError('Replacing nonexistant public symbol');
    }
    // If there's an overload table for this symbol, replace the symbol in the overload table instead.
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
    }
    else {
        Module[name] = value;
    }
}
// from https://github.com/imvu/imvujs/blob/master/src/error.js
function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName, function(message) {
        this.name = errorName;
        this.message = message;
        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
            this.stack = this.toString() + '\n' +
                stack.replace(/^Error(:[^\n]*)?\n/, '');
        }
    });
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = function() {
        if (this.message === undefined) {
            return this.name;
        } else {
            return this.name + ': ' + this.message;
        }
    };
    return errorClass;
}
// from https://github.com/imvu/imvujs/blob/master/src/function.js
function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    /*jshint evil:true*/
    return new Function(
        "body",
        "return function " + name + "() {\n" +
        "    \"use strict\";" +
        "    return body.apply(this, arguments);\n" +
        "};\n"
    )(body);
}
function _embind_repr(v) {
    var t = typeof v;
    if (t === 'object' || t === 'array' || t === 'function') {
        return v.toString();
    } else {
        return '' + v;
    }
}
// typeID -> { toWireType: ..., fromWireType: ... }
var registeredTypes = {};
// typeID -> [callback]
var awaitingDependencies = {};
// typeID -> [dependentTypes]
var typeDependencies = {};
// class typeID -> {pointerType: ..., constPointerType: ...}
var registeredPointers = {};
function registerType(rawType, registeredInstance) {
    var name = registeredInstance.name;
    if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
        throwBindingError("Cannot register type '" + name + "' twice");
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach(function(cb) {
            cb();
        });
    }
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach(function(type) {
        typeDependencies[type] = dependentTypes;
    });
    function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
            throwInternalError('Mismatched type converter count');
        }
        for (var i = 0; i < myTypes.length; ++i) {
            registerType(myTypes[i], myTypeConverters[i]);
        }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach(function(dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt];
        } else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = [];
            }
            awaitingDependencies[dt].push(function() {
                typeConverters[i] = registeredTypes[dt];
                ++registered;
                if (registered === unregisteredTypes.length) {
                    onComplete(typeConverters);
                }
            });
        }
    });
    if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
    }
}
var __charCodes = (function() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i);
    }
    return codes;
})();
function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
        ret += __charCodes[HEAPU8[c++]];
    }
    return ret;
}
function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv;
}
function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i]);
    }
    return array;
}
function requireRegisteredType(rawType, humanName) {
    var impl = registeredTypes[rawType];
    if (undefined === impl) {
        throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
    }
    return impl;
}
function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function() {
            return undefined;
        },
        'toWireType': function(destructors, o) {
            // TODO: assert if anything else is given?
            return undefined;
        },
    });
}
function __embind_register_bool(rawType, name, trueValue, falseValue) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(wt) {
            // ambiguous emscripten ABI: sometimes return values are
            // true or false, and sometimes integers (0 or 1)
            return !!wt;
        },
        'toWireType': function(destructors, o) {
            return o ? trueValue : falseValue;
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
// When converting a number from JS to C++ side, the valid range of the number is
// [minRange, maxRange], inclusive.
function __embind_register_integer(primitiveType, name, minRange, maxRange) {
    name = readLatin1String(name);
    if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
        maxRange = 4294967295;
    }
    registerType(primitiveType, {
        name: name,
        minRange: minRange,
        maxRange: maxRange,
        'fromWireType': function(value) {
            return value;
        },
        'toWireType': function(destructors, value) {
            // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
            // avoid the following two if()s and assume value is of proper type.
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
            }
            if (value < minRange || value > maxRange) {
                throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
            }
            return value | 0;
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
function __embind_register_float(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
            return value;
        },
        'toWireType': function(destructors, value) {
            // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
            // avoid the following if() and assume value is of proper type.
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
            }
            return value;
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
            }
            _free(value);
            return a.join('');
        },
        'toWireType': function(destructors, value) {
            if (value instanceof ArrayBuffer) {
                value = new Uint8Array(value);
            }
            function getTAElement(ta, index) {
                return ta[index];
            }
            function getStringElement(string, index) {
                return string.charCodeAt(index);
            }
            var getElement;
            if (value instanceof Uint8Array) {
                getElement = getTAElement;
            } else if (value instanceof Int8Array) {
                getElement = getTAElement;
            } else if (typeof value === 'string') {
                getElement = getStringElement;
            } else {
                throwBindingError('Cannot pass non-string to std::string');
            }
            // assumes 4-byte alignment
            var length = value.length;
            var ptr = _malloc(4 + length);
            HEAPU32[ptr >> 2] = length;
            for (var i = 0; i < length; ++i) {
                var charCode = getElement(value, i);
                if (charCode > 255) {
                    _free(ptr);
                    throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                }
                HEAPU8[ptr + 4 + i] = charCode;
            }
            if (destructors !== null) {
                destructors.push(_free, ptr);
            }
            return ptr;
        },
        destructorFunction: function(ptr) { _free(ptr); },
    });
}
function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var HEAP, shift;
    if (charSize === 2) {
        HEAP = HEAPU16;
        shift = 1;
    } else if (charSize === 4) {
        HEAP = HEAPU32;
        shift = 2;
    }
    registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            var start = (value + 4) >> shift;
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAP[start + i]);
            }
            _free(value);
            return a.join('');
        },
        'toWireType': function(destructors, value) {
            // assumes 4-byte alignment
            var length = value.length;
            var ptr = _malloc(4 + length * charSize);
            HEAPU32[ptr >> 2] = length;
            var start = (ptr + 4) >> shift;
            for (var i = 0; i < length; ++i) {
                HEAP[start + i] = value.charCodeAt(i);
            }
            if (destructors !== null) {
                destructors.push(_free, ptr);
            }
            return ptr;
        },
        destructorFunction: function(ptr) { _free(ptr); },
    });
}
function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(handle) {
            var rv = _emval_handle_array[handle].value;
            __emval_decref(handle);
            return rv;
        },
        'toWireType': function(destructors, value) {
            return __emval_register(value);
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
function __embind_register_memory_view(rawType, name) {
    var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,        
    ];
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(handle) {
            var type = HEAPU32[handle >> 2];
            var size = HEAPU32[(handle >> 2) + 1]; // in elements
            var data = HEAPU32[(handle >> 2) + 2]; // byte offset into emscripten heap
            var TA = typeMapping[type];
            return new TA(HEAP8.buffer, data, size);
        },
    });
}
function runDestructors(destructors) {
    while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
    }
}
// Function implementation of operator new, per
// http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
// 13.2.2
// ES3
function new_(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
        throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
    }
    /*
     * Previously, the following line was just:
     function dummy() {};
     * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
     * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
     * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
     * to write a test for this behavior.  -NRD 2013.02.22
     */
    var dummy = createNamedFunction(constructor.name, function(){});
    dummy.prototype = constructor.prototype;
    var obj = new dummy;
    var r = constructor.apply(obj, argumentList);
    return (r instanceof Object) ? r : obj;
}
// The path to interop from JS code to C++ code:
// (hand-written JS code) -> (autogenerated JS invoker) -> (template-generated C++ invoker) -> (target C++ function)
// craftInvokerFunction generates the JS invoker function for each function exposed to JS through embind.
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    // humanName: a human-readable string name for the function to be generated.
    // argTypes: An array that contains the embind type objects for all types in the function signature.
    //    argTypes[0] is the type object for the function return value.
    //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
    //    argTypes[2...] are the actual function parameters.
    // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
    // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
    // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
    var argCount = argTypes.length;
    if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
    }
    var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
    if (!isClassMethodFunc && !FUNCTION_TABLE[cppTargetFunc]) {
        throwBindingError('Global function '+humanName+' is not defined!');
    }
    // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
// TODO: This omits argument count check - enable only at -O3 or similar.
//    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
//       return FUNCTION_TABLE[fn];
//    }
    var argsList = "";
    var argsListWired = "";
    for(var i = 0; i < argCount-2; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i;
        argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
    }
    var invokerFnBody =
        "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
        "if (arguments.length !== "+(argCount - 2)+") {\n" +
            "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
        "}\n";
    // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
    // TODO: Remove this completely once all function invokers are being dynamically generated.
    var needsDestructorStack = false;
    for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
            needsDestructorStack = true;
            break;
        }
    }
    if (needsDestructorStack) {
        invokerFnBody +=
            "var destructors = [];\n";
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["throwBindingError", "classType", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, classType, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
    }
    for(var i = 0; i < argCount-2; ++i) {
        invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
        args1.push("argType"+i);
        args2.push(argTypes[i+2]);
    }
    if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
    }
    var returns = (argTypes[0].name !== "void");
    invokerFnBody +=
        (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
    if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
    } else {
        for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
            var paramName = (i === 1 ? "thisWired" : ("arg"+(i-2)+"Wired"));
            if (argTypes[i].destructorFunction !== null) {
                invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                args1.push(paramName+"_dtor");
                args2.push(argTypes[i].destructorFunction);
            }
        }
    }
    if (returns) {
        invokerFnBody += "return retType.fromWireType(rv);\n";
    }
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
}
function __embind_register_function(name, argCount, rawArgTypesAddr, rawInvoker, fn) {
    var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    name = readLatin1String(name);
    rawInvoker = FUNCTION_TABLE[rawInvoker];
    exposePublicSymbol(name, function() {
        throwUnboundTypeError('Cannot call ' + name + ' due to unbound types', argTypes);
    }, argCount - 1);
    whenDependentTypesAreResolved([], argTypes, function(argTypes) {
        var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn), argCount - 1);
        return [];
    });
}
var tupleRegistrations = {};
function __embind_register_value_array(rawType, name, rawConstructor, rawDestructor) {
    tupleRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: FUNCTION_TABLE[rawConstructor],
        rawDestructor: FUNCTION_TABLE[rawDestructor],
        elements: [],
    };
}
function __embind_register_value_array_element(
    rawTupleType,
    getterReturnType,
    getter,
    getterContext,
    setterArgumentType,
    setter,
    setterContext
) {
    tupleRegistrations[rawTupleType].elements.push({
        getterReturnType: getterReturnType,
        getter: FUNCTION_TABLE[getter],
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: FUNCTION_TABLE[setter],
        setterContext: setterContext,
    });
}
function __embind_finalize_value_array(rawTupleType) {
    var reg = tupleRegistrations[rawTupleType];
    delete tupleRegistrations[rawTupleType];
    var elements = reg.elements;
    var elementsLength = elements.length;
    var elementTypes = elements.map(function(elt) { return elt.getterReturnType; }).
                concat(elements.map(function(elt) { return elt.setterArgumentType; }));
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    whenDependentTypesAreResolved([rawTupleType], elementTypes, function(elementTypes) {
        elements.forEach(function(elt, i) {
            var getterReturnType = elementTypes[i];
            var getter = elt.getter;
            var getterContext = elt.getterContext;
            var setterArgumentType = elementTypes[i + elementsLength];
            var setter = elt.setter;
            var setterContext = elt.setterContext;
            elt.read = function(ptr) {
                return getterReturnType['fromWireType'](getter(getterContext, ptr));
            };
            elt.write = function(ptr, o) {
                var destructors = [];
                setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                runDestructors(destructors);
            };
        });
        return [{
            name: reg.name,
            'fromWireType': function(ptr) {
                var rv = new Array(elementsLength);
                for (var i = 0; i < elementsLength; ++i) {
                    rv[i] = elements[i].read(ptr);
                }
                rawDestructor(ptr);
                return rv;
            },
            'toWireType': function(destructors, o) {
                if (elementsLength !== o.length) {
                    throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length);
                }
                var ptr = rawConstructor();
                for (var i = 0; i < elementsLength; ++i) {
                    elements[i].write(ptr, o[i]);
                }
                if (destructors !== null) {
                    destructors.push(rawDestructor, ptr);
                }
                return ptr;
            },
            destructorFunction: rawDestructor,
        }];
    });
}
var structRegistrations = {};
function __embind_register_value_object(
    rawType,
    name,
    rawConstructor,
    rawDestructor
) {
    structRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: FUNCTION_TABLE[rawConstructor],
        rawDestructor: FUNCTION_TABLE[rawDestructor],
        fields: [],
    };
}
function __embind_register_value_object_field(
    structType,
    fieldName,
    getterReturnType,
    getter,
    getterContext,
    setterArgumentType,
    setter,
    setterContext
) {
    structRegistrations[structType].fields.push({
        fieldName: readLatin1String(fieldName),
        getterReturnType: getterReturnType,
        getter: FUNCTION_TABLE[getter],
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: FUNCTION_TABLE[setter],
        setterContext: setterContext,
    });
}
function __embind_finalize_value_object(structType) {
    var reg = structRegistrations[structType];
    delete structRegistrations[structType];
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    var fieldRecords = reg.fields;
    var fieldTypes = fieldRecords.map(function(field) { return field.getterReturnType; }).
              concat(fieldRecords.map(function(field) { return field.setterArgumentType; }));
    whenDependentTypesAreResolved([structType], fieldTypes, function(fieldTypes) {
        var fields = {};
        fieldRecords.forEach(function(field, i) {
            var fieldName = field.fieldName;
            var getterReturnType = fieldTypes[i];
            var getter = field.getter;
            var getterContext = field.getterContext;
            var setterArgumentType = fieldTypes[i + fieldRecords.length];
            var setter = field.setter;
            var setterContext = field.setterContext;
            fields[fieldName] = {
                read: function(ptr) {
                    return getterReturnType['fromWireType'](
                        getter(getterContext, ptr));
                },
                write: function(ptr, o) {
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                    runDestructors(destructors);
                }
            };
        });
        return [{
            name: reg.name,
            'fromWireType': function(ptr) {
                var rv = {};
                for (var i in fields) {
                    rv[i] = fields[i].read(ptr);
                }
                rawDestructor(ptr);
                return rv;
            },
            'toWireType': function(destructors, o) {
                // todo: Here we have an opportunity for -O3 level "unsafe" optimizations:
                // assume all fields are present without checking.
                for (var fieldName in fields) {
                    if (!(fieldName in o)) {
                        throw new TypeError('Missing field');
                    }
                }
                var ptr = rawConstructor();
                for (fieldName in fields) {
                    fields[fieldName].write(ptr, o[fieldName]);
                }
                if (destructors !== null) {
                    destructors.push(rawDestructor, ptr);
                }
                return ptr;
            },
            destructorFunction: rawDestructor,
        }];
    });
}
var genericPointerToWireType = function(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError('null is not a valid ' + this.name);
        }
        if (this.isSmartPointer) {
            var ptr = this.rawConstructor();
            if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
            }
            return ptr;
        } else {
            return 0;
        }
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    if (this.isSmartPointer) {
        // TODO: this is not strictly true
        // We could support BY_EMVAL conversions from raw pointers to smart pointers
        // because the smart pointer can hold a reference to the handle
        if (undefined === handle.$$.smartPtr) {
            throwBindingError('Passing raw pointer to smart pointer is illegal');
        }
        switch (this.sharingPolicy) {
            case 0: // NONE
                // no upcasting
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr;
                } else {
                    throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                }
                break;
            case 1: // INTRUSIVE
                ptr = handle.$$.smartPtr;
                break;
            case 2: // BY_EMVAL
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr;
                } else {
                    var clonedHandle = handle['clone']();
                    ptr = this.rawShare(
                        ptr,
                        __emval_register(function() {
                            clonedHandle['delete']();
                        })
                    );
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr);
                    }
                }
                break;
            default:
                throwBindingError('Unsupporting sharing policy');
        }
    }
    return ptr;
};
// If we know a pointer type is not going to have SmartPtr logic in it, we can
// special-case optimize it a bit (compare to genericPointerToWireType)
var constNoSmartPtrRawPointerToWireType = function(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr;
};
// An optimized version for non-const method accesses - there we must additionally restrict that
// the pointer is not a const-pointer.
var nonConstNoSmartPtrRawPointerToWireType = function(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    if (handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr;
};
function RegisteredPointer(
    name,
    registeredClass,
    isReference,
    isConst,
    // smart pointer properties
    isSmartPointer,
    pointeeType,
    sharingPolicy,
    rawGetPointee,
    rawConstructor,
    rawShare,
    rawDestructor
) {
    this.name = name;
    this.registeredClass = registeredClass;
    this.isReference = isReference;
    this.isConst = isConst;
    // smart pointer properties
    this.isSmartPointer = isSmartPointer;
    this.pointeeType = pointeeType;
    this.sharingPolicy = sharingPolicy;
    this.rawGetPointee = rawGetPointee;
    this.rawConstructor = rawConstructor;
    this.rawShare = rawShare;
    this.rawDestructor = rawDestructor;
    if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
            this['toWireType'] = constNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null;
        } else {
            this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null;
        }
    } else {
        this['toWireType'] = genericPointerToWireType;
        // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
        // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
        // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in 
        //       craftInvokerFunction altogether.
    }
}
RegisteredPointer.prototype.getPointee = function(ptr) {
    if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
    }
    return ptr;
};
RegisteredPointer.prototype.destructor = function(ptr) {
    if (this.rawDestructor) {
        this.rawDestructor(ptr);
    }
};
RegisteredPointer.prototype['fromWireType'] = function(ptr) {
    // ptr is a raw pointer (or a raw smartpointer)
    // rawPointer is a maybe-null raw pointer
    var rawPointer = this.getPointee(ptr);
    if (!rawPointer) {
        this.destructor(ptr);
        return null;
    }
    function makeDefaultHandle() {
        if (this.isSmartPointer) {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this.pointeeType,
                ptr: rawPointer,
                smartPtrType: this,
                smartPtr: ptr,
            });
        } else {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this,
                ptr: ptr,
            });
        }
    }
    var actualType = this.registeredClass.getActualType(rawPointer);
    var registeredPointerRecord = registeredPointers[actualType];
    if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
    }
    var toType;
    if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
    } else {
        toType = registeredPointerRecord.pointerType;
    }
    var dp = downcastPointer(
        rawPointer,
        this.registeredClass,
        toType.registeredClass);
    if (dp === null) {
        return makeDefaultHandle.call(this);
    }
    if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp,
            smartPtrType: this,
            smartPtr: ptr,
        });
    } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp,
        });
    }
};
function makeClassHandle(prototype, record) {
    if (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle requires ptr and ptrType');
    }
    var hasSmartPtrType = !!record.smartPtrType;
    var hasSmartPtr = !!record.smartPtr;
    if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('Both smartPtrType and smartPtr must be specified');
    }
    record.count = { value: 1 };
    return Object.create(prototype, {
        $$: {
            value: record,
        },
    });
}
// root of all pointer and smart pointer handles in embind
function ClassHandle() {
}
function getInstanceTypeName(handle) {
    return handle.$$.ptrType.registeredClass.name;
}
ClassHandle.prototype['isAliasOf'] = function(other) {
    if (!(this instanceof ClassHandle)) {
        return false;
    }
    if (!(other instanceof ClassHandle)) {
        return false;
    }
    var leftClass = this.$$.ptrType.registeredClass;
    var left = this.$$.ptr;
    var rightClass = other.$$.ptrType.registeredClass;
    var right = other.$$.ptr;
    while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
    }
    while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
    }
    return leftClass === rightClass && left === right;
};
function throwInstanceAlreadyDeleted(obj) {
    throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
}
ClassHandle.prototype['clone'] = function() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
    }
    var clone = Object.create(Object.getPrototypeOf(this), {
        $$: {
            value: shallowCopy(this.$$),
        }
    });
    clone.$$.count.value += 1;
    return clone;
};
function runDestructor(handle) {
    var $$ = handle.$$;
    if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
    } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
    }
}
ClassHandle.prototype['delete'] = function ClassHandle_delete() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.deleteScheduled) {
        throwBindingError('Object already scheduled for deletion');
    }
    this.$$.count.value -= 1;
    if (0 === this.$$.count.value) {
        runDestructor(this);
    }
    this.$$.smartPtr = undefined;
    this.$$.ptr = undefined;
};
var deletionQueue = [];
ClassHandle.prototype['isDeleted'] = function isDeleted() {
    return !this.$$.ptr;
};
ClassHandle.prototype['deleteLater'] = function deleteLater() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.deleteScheduled) {
        throwBindingError('Object already scheduled for deletion');
    }
    deletionQueue.push(this);
    if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
    }
    this.$$.deleteScheduled = true;
    return this;
};
function flushPendingDeletes() {
    while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
    }
}
Module['flushPendingDeletes'] = flushPendingDeletes;
var delayFunction;
Module['setDelayFunction'] = function setDelayFunction(fn) {
    delayFunction = fn;
    if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
    }
};
function RegisteredClass(
    name,
    constructor,
    instancePrototype,
    rawDestructor,
    baseClass,
    getActualType,
    upcast,
    downcast
) {
    this.name = name;
    this.constructor = constructor;
    this.instancePrototype = instancePrototype;
    this.rawDestructor = rawDestructor;
    this.baseClass = baseClass;
    this.getActualType = getActualType;
    this.upcast = upcast;
    this.downcast = downcast;
}
function shallowCopy(o) {
    var rv = {};
    for (var k in o) {
        rv[k] = o[k];
    }
    return rv;
}
function __embind_register_class(
    rawType,
    rawPointerType,
    rawConstPointerType,
    baseClassRawType,
    getActualType,
    upcast,
    downcast,
    name,
    rawDestructor
) {
    name = readLatin1String(name);
    rawDestructor = FUNCTION_TABLE[rawDestructor];
    getActualType = FUNCTION_TABLE[getActualType];
    upcast = FUNCTION_TABLE[upcast];
    downcast = FUNCTION_TABLE[downcast];
    var legalFunctionName = makeLegalFunctionName(name);
    exposePublicSymbol(legalFunctionName, function() {
        // this code cannot run if baseClassRawType is zero
        throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
    });
    whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        function(base) {
            base = base[0];
            var baseClass;
            var basePrototype;
            if (baseClassRawType) {
                baseClass = base.registeredClass;
                basePrototype = baseClass.instancePrototype;
            } else {
                basePrototype = ClassHandle.prototype;
            }
            var constructor = createNamedFunction(legalFunctionName, function() {
                if (Object.getPrototypeOf(this) !== instancePrototype) {
                    throw new BindingError("Use 'new' to construct " + name);
                }
                if (undefined === registeredClass.constructor_body) {
                    throw new BindingError(name + " has no accessible constructor");
                }
                var body = registeredClass.constructor_body[arguments.length];
                if (undefined === body) {
                    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                }
                return body.apply(this, arguments);
            });
            var instancePrototype = Object.create(basePrototype, {
                constructor: { value: constructor },
            });
            constructor.prototype = instancePrototype;
            var registeredClass = new RegisteredClass(
                name,
                constructor,
                instancePrototype,
                rawDestructor,
                baseClass,
                getActualType,
                upcast,
                downcast);
            var referenceConverter = new RegisteredPointer(
                name,
                registeredClass,
                true,
                false,
                false);
            var pointerConverter = new RegisteredPointer(
                name + '*',
                registeredClass,
                false,
                false,
                false);
            var constPointerConverter = new RegisteredPointer(
                name + ' const*',
                registeredClass,
                false,
                true,
                false);
            registeredPointers[rawType] = {
                pointerType: pointerConverter,
                constPointerType: constPointerConverter
            };
            replacePublicSymbol(legalFunctionName, constructor);
            return [referenceConverter, pointerConverter, constPointerConverter];
        }
    );
}
function __embind_register_class_constructor(
    rawClassType,
    argCount,
    rawArgTypesAddr,
    invoker,
    rawConstructor
) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    invoker = FUNCTION_TABLE[invoker];
    whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = 'constructor ' + classType.name;
        if (undefined === classType.registeredClass.constructor_body) {
            classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
            throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        }
        classType.registeredClass.constructor_body[argCount - 1] = function() {
            throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
        };
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
            classType.registeredClass.constructor_body[argCount - 1] = function() {
                if (arguments.length !== argCount - 1) {
                    throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                }
                var destructors = [];
                var args = new Array(argCount);
                args[0] = rawConstructor;
                for (var i = 1; i < argCount; ++i) {
                    args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                }
                var ptr = invoker.apply(null, args);
                runDestructors(destructors);
                return argTypes[0]['fromWireType'](ptr);
            };
            return [];
        });
        return [];
    });
}
function downcastPointer(ptr, ptrClass, desiredClass) {
    if (ptrClass === desiredClass) {
        return ptr;
    }
    if (undefined === desiredClass.baseClass) {
        return null; // no conversion
    }
    // O(depth) stack space used
    return desiredClass.downcast(
        downcastPointer(ptr, ptrClass, desiredClass.baseClass));
}
function upcastPointer(ptr, ptrClass, desiredClass) {
    while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
            throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
    }
    return ptr;
}
function validateThis(this_, classType, humanName) {
    if (!(this_ instanceof Object)) {
        throwBindingError(humanName + ' with invalid "this": ' + this_);
    }
    if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
    }
    if (!this_.$$.ptr) {
        throwBindingError('cannot call emscripten binding method ' + humanName + ' on deleted object');
    }
    // todo: kill this
    return upcastPointer(
        this_.$$.ptr,
        this_.$$.ptrType.registeredClass,
        classType.registeredClass);
}
function __embind_register_class_function(
    rawClassType,
    methodName,
    argCount,
    rawArgTypesAddr, // [ReturnType, ThisType, Args...]
    rawInvoker,
    context
) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = FUNCTION_TABLE[rawInvoker];
    whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
        var unboundTypesHandler = function() {
            throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
        };
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount-2)) {
            // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
            unboundTypesHandler.argCount = argCount-2;
            unboundTypesHandler.className = classType.name;
            proto[methodName] = unboundTypesHandler;
        } else {
            // There was an existing function with the same name registered. Set up a function overload routing table.
            ensureOverloadTable(proto, methodName, humanName);
            proto[methodName].overloadTable[argCount-2] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
            var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
            // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
            // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
            if (undefined === proto[methodName].overloadTable) {
                proto[methodName] = memberFunction;
            } else {
                proto[methodName].overloadTable[argCount-2] = memberFunction;
            }
            return [];
        });
        return [];
    });
}
function __embind_register_class_class_function(
    rawClassType,
    methodName,
    argCount,
    rawArgTypesAddr,
    rawInvoker,
    fn
) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = FUNCTION_TABLE[rawInvoker];
    whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
        var unboundTypesHandler = function() {
                throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
            };
        var proto = classType.registeredClass.constructor;
        if (undefined === proto[methodName]) {
            // This is the first function to be registered with this name.
            unboundTypesHandler.argCount = argCount-1;
            proto[methodName] = unboundTypesHandler;
        } else {
            // There was an existing function with the same name registered. Set up a function overload routing table.
            ensureOverloadTable(proto, methodName, humanName);
            proto[methodName].overloadTable[argCount-1] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
            // Replace the initial unbound-types-handler stub with the proper function. If multiple overloads are registered,
            // the function handlers go into an overload table.
            var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
            var func = craftInvokerFunction(humanName, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn);
            if (undefined === proto[methodName].overloadTable) {
                proto[methodName] = func;
            } else {
                proto[methodName].overloadTable[argCount-1] = func;
            }
            return [];
        });
        return [];
    });
}
function __embind_register_class_property(
    classType,
    fieldName,
    getterReturnType,
    getter,
    getterContext,
    setterArgumentType,
    setter,
    setterContext
) {
    fieldName = readLatin1String(fieldName);
    getter = FUNCTION_TABLE[getter];
    whenDependentTypesAreResolved([], [classType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + fieldName;
        var desc = {
            get: function() {
                throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
            },
            enumerable: true,
            configurable: true
        };
        if (setter) {
            desc.set = function() {
                throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
            };
        } else {
            desc.set = function(v) {
                throwBindingError(humanName + ' is a read-only property');
            };
        }
        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
        whenDependentTypesAreResolved(
            [],
            (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
        function(types) {
            var getterReturnType = types[0];
            var desc = {
                get: function() {
                    var ptr = validateThis(this, classType, humanName + ' getter');
                    return getterReturnType['fromWireType'](getter(getterContext, ptr));
                },
                enumerable: true
            };
            if (setter) {
                setter = FUNCTION_TABLE[setter];
                var setterArgumentType = types[1];
                desc.set = function(v) {
                    var ptr = validateThis(this, classType, humanName + ' setter');
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                    runDestructors(destructors);
                };
            }
            Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
            return [];
        });
        return [];
    });
}
var char_0 = '0'.charCodeAt(0);
var char_9 = '9'.charCodeAt(0);
function makeLegalFunctionName(name) {
    name = name.replace(/[^a-zA-Z0-9_]/g, '$');
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
        return '_' + name;
    } else {
        return name;
    }
}
function __embind_register_smart_ptr(
    rawType,
    rawPointeeType,
    name,
    sharingPolicy,
    rawGetPointee,
    rawConstructor,
    rawShare,
    rawDestructor
) {
    name = readLatin1String(name);
    rawGetPointee = FUNCTION_TABLE[rawGetPointee];
    rawConstructor = FUNCTION_TABLE[rawConstructor];
    rawShare = FUNCTION_TABLE[rawShare];
    rawDestructor = FUNCTION_TABLE[rawDestructor];
    whenDependentTypesAreResolved([rawType], [rawPointeeType], function(pointeeType) {
        pointeeType = pointeeType[0];
        var registeredPointer = new RegisteredPointer(
            name,
            pointeeType.registeredClass,
            false,
            false,
            // smart pointer properties
            true,
            pointeeType,
            sharingPolicy,
            rawGetPointee,
            rawConstructor,
            rawShare,
            rawDestructor);
        return [registeredPointer];
    });
}
function __embind_register_enum(
    rawType,
    name
) {
    name = readLatin1String(name);
    function constructor() {
    }
    constructor.values = {};
    registerType(rawType, {
        name: name,
        constructor: constructor,
        'fromWireType': function(c) {
            return this.constructor.values[c];
        },
        'toWireType': function(destructors, c) {
            return c.value;
        },
        destructorFunction: null,
    });
    exposePublicSymbol(name, constructor);
}
function __embind_register_enum_value(
    rawEnumType,
    name,
    enumValue
) {
    var enumType = requireRegisteredType(rawEnumType, 'enum');
    name = readLatin1String(name);
    var Enum = enumType.constructor;
    var Value = Object.create(enumType.constructor.prototype, {
        value: {value: enumValue},
        constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
    });
    Enum.values[enumValue] = Value;
    Enum[name] = Value;
}
function __embind_register_constant(name, type, value) {
    name = readLatin1String(name);
    whenDependentTypesAreResolved([], [type], function(type) {
        type = type[0];
        Module[name] = type['fromWireType'](value);
        return [];
    });
}
/*global Module:true, Runtime*/
/*global HEAP32*/
/*global new_*/
/*global createNamedFunction*/
/*global readLatin1String, writeStringToMemory*/
/*global requireRegisteredType, throwBindingError*/
/*jslint sub:true*/ /* The symbols 'fromWireType' and 'toWireType' must be accessed via array notation to be closure-safe since craftInvokerFunction crafts functions as strings that can't be closured. */
var Module = Module || {};
var _emval_handle_array = [{}]; // reserve zero
var _emval_free_list = [];
// Public JS API
/** @expose */
Module.count_emval_handles = function() {
    var count = 0;
    for (var i = 1; i < _emval_handle_array.length; ++i) {
        if (_emval_handle_array[i] !== undefined) {
            ++count;
        }
    }
    return count;
};
/** @expose */
Module.get_first_emval = function() {
    for (var i = 1; i < _emval_handle_array.length; ++i) {
        if (_emval_handle_array[i] !== undefined) {
            return _emval_handle_array[i];
        }
    }
    return null;
};
// Private C++ API
var _emval_symbols = {}; // address -> string
function __emval_register_symbol(address) {
    _emval_symbols[address] = readLatin1String(address);
}
function getStringOrSymbol(address) {
    var symbol = _emval_symbols[address];
    if (symbol === undefined) {
        return readLatin1String(address);
    } else {
        return symbol;
    }
}
function requireHandle(handle) {
    if (!handle) {
        throwBindingError('Cannot use deleted val. handle = ' + handle);
    }
}
function __emval_register(value) {
    var handle = _emval_free_list.length ?
        _emval_free_list.pop() :
        _emval_handle_array.length;
    _emval_handle_array[handle] = {refcount: 1, value: value};
    return handle;
}
function __emval_incref(handle) {
    if (handle) {
        _emval_handle_array[handle].refcount += 1;
    }
}
function __emval_decref(handle) {
    if (handle && 0 === --_emval_handle_array[handle].refcount) {
        _emval_handle_array[handle] = undefined;
        _emval_free_list.push(handle);
    }
}
function __emval_new_array() {
    return __emval_register([]);
}
function __emval_new_object() {
    return __emval_register({});
}
function __emval_undefined() {
    return __emval_register(undefined);
}
function __emval_null() {
    return __emval_register(null);
}
function __emval_new_cstring(v) {
    return __emval_register(getStringOrSymbol(v));
}
function __emval_take_value(type, v) {
    type = requireRegisteredType(type, '_emval_take_value');
    v = type['fromWireType'](v);
    return __emval_register(v);
}
var __newers = {}; // arity -> function
function craftEmvalAllocator(argCount) {
    /*This function returns a new function that looks like this:
    function emval_allocator_3(handle, argTypes, arg0Wired, arg1Wired, arg2Wired) {
        var argType0 = requireRegisteredType(HEAP32[(argTypes >> 2)], "parameter 0");
        var arg0 = argType0.fromWireType(arg0Wired);
        var argType1 = requireRegisteredType(HEAP32[(argTypes >> 2) + 1], "parameter 1");
        var arg1 = argType1.fromWireType(arg1Wired);
        var argType2 = requireRegisteredType(HEAP32[(argTypes >> 2) + 2], "parameter 2");
        var arg2 = argType2.fromWireType(arg2Wired);
        var constructor = _emval_handle_array[handle].value;
        var emval = new constructor(arg0, arg1, arg2);
        return emval;
    } */
    var args1 = ["requireRegisteredType", "HEAP32", "_emval_handle_array", "__emval_register"];
    var args2 = [requireRegisteredType, HEAP32, _emval_handle_array, __emval_register];
    var argsList = "";
    var argsListWired = "";
    for(var i = 0; i < argCount; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i; // 'arg0, arg1, ..., argn'
        argsListWired += ", arg"+i+"Wired"; // ', arg0Wired, arg1Wired, ..., argnWired'
    }
    var invokerFnBody =
        "return function emval_allocator_"+argCount+"(handle, argTypes " + argsListWired + ") {\n";
    for(var i = 0; i < argCount; ++i) {
        invokerFnBody += 
            "var argType"+i+" = requireRegisteredType(HEAP32[(argTypes >> 2) + "+i+"], \"parameter "+i+"\");\n" +
            "var arg"+i+" = argType"+i+".fromWireType(arg"+i+"Wired);\n";
    }
    invokerFnBody +=
        "var constructor = _emval_handle_array[handle].value;\n" +
        "var obj = new constructor("+argsList+");\n" +
        "return __emval_register(obj);\n" +
        "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
}
function __emval_new(handle, argCount, argTypes) {
    requireHandle(handle);
    var newer = __newers[argCount];
    if (!newer) {
        newer = craftEmvalAllocator(argCount);
        __newers[argCount] = newer;
    }
    if (argCount === 0) {
        return newer(handle, argTypes);
    } else if (argCount === 1) {
        return newer(handle, argTypes, arguments[3]);
    } else if (argCount === 2) {
        return newer(handle, argTypes, arguments[3], arguments[4]);
    } else if (argCount === 3) {
        return newer(handle, argTypes, arguments[3], arguments[4], arguments[5]);
    } else if (argCount === 4) {
        return newer(handle, argTypes, arguments[3], arguments[4], arguments[5], arguments[6]);
    } else {
        // This is a slow path! (.apply and .splice are slow), so a few specializations are present above.
        return newer.apply(null, arguments.splice(1));
    }
}
// appease jshint (technically this code uses eval)
var global = (function(){return Function;})()('return this')();
function __emval_get_global(name) {
    name = getStringOrSymbol(name);
    return __emval_register(global[name]);
}
function __emval_get_module_property(name) {
    name = getStringOrSymbol(name);
    return __emval_register(Module[name]);
}
function __emval_get_property(handle, key) {
    requireHandle(handle);
    return __emval_register(_emval_handle_array[handle].value[_emval_handle_array[key].value]);
}
function __emval_set_property(handle, key, value) {
    requireHandle(handle);
    _emval_handle_array[handle].value[_emval_handle_array[key].value] = _emval_handle_array[value].value;
}
function __emval_as(handle, returnType) {
    requireHandle(handle);
    returnType = requireRegisteredType(returnType, 'emval::as');
    var destructors = [];
    // caller owns destructing
    return returnType['toWireType'](destructors, _emval_handle_array[handle].value);
}
function parseParameters(argCount, argTypes, argWireTypes) {
    var a = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        var argType = requireRegisteredType(
            HEAP32[(argTypes >> 2) + i],
            "parameter " + i);
        a[i] = argType['fromWireType'](argWireTypes[i]);
    }
    return a;
}
function __emval_call(handle, argCount, argTypes) {
    requireHandle(handle);
    var types = lookupTypes(argCount, argTypes);
    var args = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        args[i] = types[i]['fromWireType'](arguments[3 + i]);
    }
    var fn = _emval_handle_array[handle].value;
    var rv = fn.apply(undefined, args);
    return __emval_register(rv);
}
function lookupTypes(argCount, argTypes, argWireTypes) {
    var a = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(
            HEAP32[(argTypes >> 2) + i],
            "parameter " + i);
    }
    return a;
}
function __emval_get_method_caller(argCount, argTypes) {
    var types = lookupTypes(argCount, argTypes);
    var retType = types[0];
    var signatureName = retType.name + "_$" + types.slice(1).map(function (t) { return t.name; }).join("_") + "$";
    var args1 = ["addFunction", "createNamedFunction", "requireHandle", "getStringOrSymbol", "_emval_handle_array", "retType"];
    var args2 = [Runtime.addFunction, createNamedFunction, requireHandle, getStringOrSymbol, _emval_handle_array, retType];
    var argsList = ""; // 'arg0, arg1, arg2, ... , argN'
    var argsListWired = ""; // 'arg0Wired, ..., argNWired'
    for (var i = 0; i < argCount - 1; ++i) {
        argsList += (i !== 0 ? ", " : "") + "arg" + i;
        argsListWired += ", arg" + i + "Wired";
        args1.push("argType" + i);
        args2.push(types[1 + i]);
    }
    var invokerFnBody =
        "return addFunction(createNamedFunction('" + signatureName + "', function (handle, name" + argsListWired + ") {\n" +
        "requireHandle(handle);\n" +
        "name = getStringOrSymbol(name);\n";
    for (var i = 0; i < argCount - 1; ++i) {
        invokerFnBody += "var arg" + i + " = argType" + i + ".fromWireType(arg" + i + "Wired);\n";
    }
    invokerFnBody +=
        "var obj = _emval_handle_array[handle].value;\n" +
        "return retType.toWireType(null, obj[name](" + argsList + "));\n" + 
        "}));\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
}
function __emval_has_function(handle, name) {
    name = getStringOrSymbol(name);
    return _emval_handle_array[handle].value[name] instanceof Function;
}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}