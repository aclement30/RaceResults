"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../node_modules/hash-string/build/hash-string.js
var require_hash_string = __commonJS({
  "../node_modules/hash-string/build/hash-string.js"(exports2, module2) {
    (function(root3, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof exports2 === "object") {
        module2.exports = factory();
      } else {
        root3.hash = factory();
      }
    })(exports2, function() {
      function hash(text) {
        "use strict";
        var hash2 = 5381, index = text.length;
        while (index) {
          hash2 = hash2 * 33 ^ text.charCodeAt(--index);
        }
        return hash2 >>> 0;
      }
      return hash;
    });
  }
});

// ../node_modules/short-hash/src/index.js
var require_src = __commonJS({
  "../node_modules/short-hash/src/index.js"(exports2, module2) {
    "use strict";
    var hash = require_hash_string();
    module2.exports = function shortHash2(str) {
      return hash(str).toString(16);
    };
  }
});

// ../node_modules/colors/lib/styles.js
var require_styles = __commonJS({
  "../node_modules/colors/lib/styles.js"(exports2, module2) {
    var styles = {};
    module2["exports"] = styles;
    var codes = {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      grey: [90, 39],
      brightRed: [91, 39],
      brightGreen: [92, 39],
      brightYellow: [93, 39],
      brightBlue: [94, 39],
      brightMagenta: [95, 39],
      brightCyan: [96, 39],
      brightWhite: [97, 39],
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgBrightRed: [101, 49],
      bgBrightGreen: [102, 49],
      bgBrightYellow: [103, 49],
      bgBrightBlue: [104, 49],
      bgBrightMagenta: [105, 49],
      bgBrightCyan: [106, 49],
      bgBrightWhite: [107, 49],
      // legacy styles for colors pre v1.0.0
      blackBG: [40, 49],
      redBG: [41, 49],
      greenBG: [42, 49],
      yellowBG: [43, 49],
      blueBG: [44, 49],
      magentaBG: [45, 49],
      cyanBG: [46, 49],
      whiteBG: [47, 49]
    };
    Object.keys(codes).forEach(function(key) {
      var val = codes[key];
      var style = styles[key] = [];
      style.open = "\x1B[" + val[0] + "m";
      style.close = "\x1B[" + val[1] + "m";
    });
  }
});

// ../node_modules/colors/lib/system/has-flag.js
var require_has_flag = __commonJS({
  "../node_modules/colors/lib/system/has-flag.js"(exports2, module2) {
    "use strict";
    module2.exports = function(flag, argv) {
      argv = argv || process.argv;
      var terminatorPos = argv.indexOf("--");
      var prefix = /^-{1,2}/.test(flag) ? "" : "--";
      var pos = argv.indexOf(prefix + flag);
      return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
    };
  }
});

// ../node_modules/colors/lib/system/supports-colors.js
var require_supports_colors = __commonJS({
  "../node_modules/colors/lib/system/supports-colors.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var hasFlag = require_has_flag();
    var env = process.env;
    var forceColor = void 0;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) {
      forceColor = false;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = true;
    }
    if ("FORCE_COLOR" in env) {
      forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(stream) {
      if (forceColor === false) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (stream && !stream.isTTY && forceColor !== true) {
        return 0;
      }
      var min = forceColor ? 1 : 0;
      if (process.platform === "win32") {
        var osRelease = os.release().split(".");
        if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI"].some(function(sign) {
          return sign in env;
        }) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if ("TERM_PROGRAM" in env) {
        var version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Hyper":
            return 3;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      if (env.TERM === "dumb") {
        return min;
      }
      return min;
    }
    function getSupportLevel(stream) {
      var level = supportsColor(stream);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: getSupportLevel(process.stdout),
      stderr: getSupportLevel(process.stderr)
    };
  }
});

// ../node_modules/colors/lib/custom/trap.js
var require_trap = __commonJS({
  "../node_modules/colors/lib/custom/trap.js"(exports2, module2) {
    module2["exports"] = function runTheTrap(text, options) {
      var result = "";
      text = text || "Run the trap, drop the bass";
      text = text.split("");
      var trap = {
        a: ["@", "\u0104", "\u023A", "\u0245", "\u0394", "\u039B", "\u0414"],
        b: ["\xDF", "\u0181", "\u0243", "\u026E", "\u03B2", "\u0E3F"],
        c: ["\xA9", "\u023B", "\u03FE"],
        d: ["\xD0", "\u018A", "\u0500", "\u0501", "\u0502", "\u0503"],
        e: [
          "\xCB",
          "\u0115",
          "\u018E",
          "\u0258",
          "\u03A3",
          "\u03BE",
          "\u04BC",
          "\u0A6C"
        ],
        f: ["\u04FA"],
        g: ["\u0262"],
        h: ["\u0126", "\u0195", "\u04A2", "\u04BA", "\u04C7", "\u050A"],
        i: ["\u0F0F"],
        j: ["\u0134"],
        k: ["\u0138", "\u04A0", "\u04C3", "\u051E"],
        l: ["\u0139"],
        m: ["\u028D", "\u04CD", "\u04CE", "\u0520", "\u0521", "\u0D69"],
        n: ["\xD1", "\u014B", "\u019D", "\u0376", "\u03A0", "\u048A"],
        o: [
          "\xD8",
          "\xF5",
          "\xF8",
          "\u01FE",
          "\u0298",
          "\u047A",
          "\u05DD",
          "\u06DD",
          "\u0E4F"
        ],
        p: ["\u01F7", "\u048E"],
        q: ["\u09CD"],
        r: ["\xAE", "\u01A6", "\u0210", "\u024C", "\u0280", "\u042F"],
        s: ["\xA7", "\u03DE", "\u03DF", "\u03E8"],
        t: ["\u0141", "\u0166", "\u0373"],
        u: ["\u01B1", "\u054D"],
        v: ["\u05D8"],
        w: ["\u0428", "\u0460", "\u047C", "\u0D70"],
        x: ["\u04B2", "\u04FE", "\u04FC", "\u04FD"],
        y: ["\xA5", "\u04B0", "\u04CB"],
        z: ["\u01B5", "\u0240"]
      };
      text.forEach(function(c) {
        c = c.toLowerCase();
        var chars = trap[c] || [" "];
        var rand = Math.floor(Math.random() * chars.length);
        if (typeof trap[c] !== "undefined") {
          result += trap[c][rand];
        } else {
          result += c;
        }
      });
      return result;
    };
  }
});

// ../node_modules/colors/lib/custom/zalgo.js
var require_zalgo = __commonJS({
  "../node_modules/colors/lib/custom/zalgo.js"(exports2, module2) {
    module2["exports"] = function zalgo(text, options) {
      text = text || "   he is here   ";
      var soul = {
        "up": [
          "\u030D",
          "\u030E",
          "\u0304",
          "\u0305",
          "\u033F",
          "\u0311",
          "\u0306",
          "\u0310",
          "\u0352",
          "\u0357",
          "\u0351",
          "\u0307",
          "\u0308",
          "\u030A",
          "\u0342",
          "\u0313",
          "\u0308",
          "\u034A",
          "\u034B",
          "\u034C",
          "\u0303",
          "\u0302",
          "\u030C",
          "\u0350",
          "\u0300",
          "\u0301",
          "\u030B",
          "\u030F",
          "\u0312",
          "\u0313",
          "\u0314",
          "\u033D",
          "\u0309",
          "\u0363",
          "\u0364",
          "\u0365",
          "\u0366",
          "\u0367",
          "\u0368",
          "\u0369",
          "\u036A",
          "\u036B",
          "\u036C",
          "\u036D",
          "\u036E",
          "\u036F",
          "\u033E",
          "\u035B",
          "\u0346",
          "\u031A"
        ],
        "down": [
          "\u0316",
          "\u0317",
          "\u0318",
          "\u0319",
          "\u031C",
          "\u031D",
          "\u031E",
          "\u031F",
          "\u0320",
          "\u0324",
          "\u0325",
          "\u0326",
          "\u0329",
          "\u032A",
          "\u032B",
          "\u032C",
          "\u032D",
          "\u032E",
          "\u032F",
          "\u0330",
          "\u0331",
          "\u0332",
          "\u0333",
          "\u0339",
          "\u033A",
          "\u033B",
          "\u033C",
          "\u0345",
          "\u0347",
          "\u0348",
          "\u0349",
          "\u034D",
          "\u034E",
          "\u0353",
          "\u0354",
          "\u0355",
          "\u0356",
          "\u0359",
          "\u035A",
          "\u0323"
        ],
        "mid": [
          "\u0315",
          "\u031B",
          "\u0300",
          "\u0301",
          "\u0358",
          "\u0321",
          "\u0322",
          "\u0327",
          "\u0328",
          "\u0334",
          "\u0335",
          "\u0336",
          "\u035C",
          "\u035D",
          "\u035E",
          "\u035F",
          "\u0360",
          "\u0362",
          "\u0338",
          "\u0337",
          "\u0361",
          " \u0489"
        ]
      };
      var all = [].concat(soul.up, soul.down, soul.mid);
      function randomNumber(range) {
        var r = Math.floor(Math.random() * range);
        return r;
      }
      function isChar(character) {
        var bool = false;
        all.filter(function(i) {
          bool = i === character;
        });
        return bool;
      }
      function heComes(text2, options2) {
        var result = "";
        var counts;
        var l;
        options2 = options2 || {};
        options2["up"] = typeof options2["up"] !== "undefined" ? options2["up"] : true;
        options2["mid"] = typeof options2["mid"] !== "undefined" ? options2["mid"] : true;
        options2["down"] = typeof options2["down"] !== "undefined" ? options2["down"] : true;
        options2["size"] = typeof options2["size"] !== "undefined" ? options2["size"] : "maxi";
        text2 = text2.split("");
        for (l in text2) {
          if (isChar(l)) {
            continue;
          }
          result = result + text2[l];
          counts = { "up": 0, "down": 0, "mid": 0 };
          switch (options2.size) {
            case "mini":
              counts.up = randomNumber(8);
              counts.mid = randomNumber(2);
              counts.down = randomNumber(8);
              break;
            case "maxi":
              counts.up = randomNumber(16) + 3;
              counts.mid = randomNumber(4) + 1;
              counts.down = randomNumber(64) + 3;
              break;
            default:
              counts.up = randomNumber(8) + 1;
              counts.mid = randomNumber(6) / 2;
              counts.down = randomNumber(8) + 1;
              break;
          }
          var arr = ["up", "mid", "down"];
          for (var d in arr) {
            var index = arr[d];
            for (var i = 0; i <= counts[index]; i++) {
              if (options2[index]) {
                result = result + soul[index][randomNumber(soul[index].length)];
              }
            }
          }
        }
        return result;
      }
      return heComes(text, options);
    };
  }
});

// ../node_modules/colors/lib/maps/america.js
var require_america = __commonJS({
  "../node_modules/colors/lib/maps/america.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      return function(letter, i, exploded) {
        if (letter === " ") return letter;
        switch (i % 3) {
          case 0:
            return colors.red(letter);
          case 1:
            return colors.white(letter);
          case 2:
            return colors.blue(letter);
        }
      };
    };
  }
});

// ../node_modules/colors/lib/maps/zebra.js
var require_zebra = __commonJS({
  "../node_modules/colors/lib/maps/zebra.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      return function(letter, i, exploded) {
        return i % 2 === 0 ? letter : colors.inverse(letter);
      };
    };
  }
});

// ../node_modules/colors/lib/maps/rainbow.js
var require_rainbow = __commonJS({
  "../node_modules/colors/lib/maps/rainbow.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      var rainbowColors = ["red", "yellow", "green", "blue", "magenta"];
      return function(letter, i, exploded) {
        if (letter === " ") {
          return letter;
        } else {
          return colors[rainbowColors[i++ % rainbowColors.length]](letter);
        }
      };
    };
  }
});

// ../node_modules/colors/lib/maps/random.js
var require_random = __commonJS({
  "../node_modules/colors/lib/maps/random.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      var available = [
        "underline",
        "inverse",
        "grey",
        "yellow",
        "red",
        "green",
        "blue",
        "white",
        "cyan",
        "magenta",
        "brightYellow",
        "brightRed",
        "brightGreen",
        "brightBlue",
        "brightWhite",
        "brightCyan",
        "brightMagenta"
      ];
      return function(letter, i, exploded) {
        return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 2))]](letter);
      };
    };
  }
});

// ../node_modules/colors/lib/colors.js
var require_colors = __commonJS({
  "../node_modules/colors/lib/colors.js"(exports2, module2) {
    var colors = {};
    module2["exports"] = colors;
    colors.themes = {};
    var util = require("util");
    var ansiStyles = colors.styles = require_styles();
    var defineProps = Object.defineProperties;
    var newLineRegex = new RegExp(/[\r\n]+/g);
    colors.supportsColor = require_supports_colors().supportsColor;
    if (typeof colors.enabled === "undefined") {
      colors.enabled = colors.supportsColor() !== false;
    }
    colors.enable = function() {
      colors.enabled = true;
    };
    colors.disable = function() {
      colors.enabled = false;
    };
    colors.stripColors = colors.strip = function(str) {
      return ("" + str).replace(/\x1B\[\d+m/g, "");
    };
    var stylize = colors.stylize = function stylize2(str, style) {
      if (!colors.enabled) {
        return str + "";
      }
      var styleMap = ansiStyles[style];
      if (!styleMap && style in colors) {
        return colors[style](str);
      }
      return styleMap.open + str + styleMap.close;
    };
    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    var escapeStringRegexp = function(str) {
      if (typeof str !== "string") {
        throw new TypeError("Expected a string");
      }
      return str.replace(matchOperatorsRe, "\\$&");
    };
    function build(_styles) {
      var builder = function builder2() {
        return applyStyle.apply(builder2, arguments);
      };
      builder._styles = _styles;
      builder.__proto__ = proto;
      return builder;
    }
    var styles = (function() {
      var ret = {};
      ansiStyles.grey = ansiStyles.gray;
      Object.keys(ansiStyles).forEach(function(key) {
        ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), "g");
        ret[key] = {
          get: function() {
            return build(this._styles.concat(key));
          }
        };
      });
      return ret;
    })();
    var proto = defineProps(function colors2() {
    }, styles);
    function applyStyle() {
      var args = Array.prototype.slice.call(arguments);
      var str = args.map(function(arg) {
        if (arg != null && arg.constructor === String) {
          return arg;
        } else {
          return util.inspect(arg);
        }
      }).join(" ");
      if (!colors.enabled || !str) {
        return str;
      }
      var newLinesPresent = str.indexOf("\n") != -1;
      var nestedStyles = this._styles;
      var i = nestedStyles.length;
      while (i--) {
        var code = ansiStyles[nestedStyles[i]];
        str = code.open + str.replace(code.closeRe, code.open) + code.close;
        if (newLinesPresent) {
          str = str.replace(newLineRegex, function(match) {
            return code.close + match + code.open;
          });
        }
      }
      return str;
    }
    colors.setTheme = function(theme) {
      if (typeof theme === "string") {
        console.log("colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
        return;
      }
      for (var style in theme) {
        (function(style2) {
          colors[style2] = function(str) {
            if (typeof theme[style2] === "object") {
              var out = str;
              for (var i in theme[style2]) {
                out = colors[theme[style2][i]](out);
              }
              return out;
            }
            return colors[theme[style2]](str);
          };
        })(style);
      }
    };
    function init() {
      var ret = {};
      Object.keys(styles).forEach(function(name) {
        ret[name] = {
          get: function() {
            return build([name]);
          }
        };
      });
      return ret;
    }
    var sequencer = function sequencer2(map2, str) {
      var exploded = str.split("");
      exploded = exploded.map(map2);
      return exploded.join("");
    };
    colors.trap = require_trap();
    colors.zalgo = require_zalgo();
    colors.maps = {};
    colors.maps.america = require_america()(colors);
    colors.maps.zebra = require_zebra()(colors);
    colors.maps.rainbow = require_rainbow()(colors);
    colors.maps.random = require_random()(colors);
    for (map in colors.maps) {
      (function(map2) {
        colors[map2] = function(str) {
          return sequencer(colors.maps[map2], str);
        };
      })(map);
    }
    var map;
    defineProps(colors, init());
  }
});

// ../node_modules/colors/lib/extendStringPrototype.js
var require_extendStringPrototype = __commonJS({
  "../node_modules/colors/lib/extendStringPrototype.js"(exports2, module2) {
    var colors = require_colors();
    module2["exports"] = function() {
      var addProperty = function(color, func) {
        String.prototype.__defineGetter__(color, func);
      };
      addProperty("strip", function() {
        return colors.strip(this);
      });
      addProperty("stripColors", function() {
        return colors.strip(this);
      });
      addProperty("trap", function() {
        return colors.trap(this);
      });
      addProperty("zalgo", function() {
        return colors.zalgo(this);
      });
      addProperty("zebra", function() {
        return colors.zebra(this);
      });
      addProperty("rainbow", function() {
        return colors.rainbow(this);
      });
      addProperty("random", function() {
        return colors.random(this);
      });
      addProperty("america", function() {
        return colors.america(this);
      });
      var x = Object.keys(colors.styles);
      x.forEach(function(style) {
        addProperty(style, function() {
          return colors.stylize(this, style);
        });
      });
      function applyTheme(theme) {
        var stringPrototypeBlacklist = [
          "__defineGetter__",
          "__defineSetter__",
          "__lookupGetter__",
          "__lookupSetter__",
          "charAt",
          "constructor",
          "hasOwnProperty",
          "isPrototypeOf",
          "propertyIsEnumerable",
          "toLocaleString",
          "toString",
          "valueOf",
          "charCodeAt",
          "indexOf",
          "lastIndexOf",
          "length",
          "localeCompare",
          "match",
          "repeat",
          "replace",
          "search",
          "slice",
          "split",
          "substring",
          "toLocaleLowerCase",
          "toLocaleUpperCase",
          "toLowerCase",
          "toUpperCase",
          "trim",
          "trimLeft",
          "trimRight"
        ];
        Object.keys(theme).forEach(function(prop) {
          if (stringPrototypeBlacklist.indexOf(prop) !== -1) {
            console.log("warn: ".red + ("String.prototype" + prop).magenta + " is probably something you don't want to override.  Ignoring style name");
          } else {
            if (typeof theme[prop] === "string") {
              colors[prop] = colors[theme[prop]];
              addProperty(prop, function() {
                return colors[prop](this);
              });
            } else {
              var themePropApplicator = function(str) {
                var ret = str || this;
                for (var t = 0; t < theme[prop].length; t++) {
                  ret = colors[theme[prop][t]](ret);
                }
                return ret;
              };
              addProperty(prop, themePropApplicator);
              colors[prop] = function(str) {
                return themePropApplicator(str);
              };
            }
          }
        });
      }
      colors.setTheme = function(theme) {
        if (typeof theme === "string") {
          console.log("colors.setTheme now only accepts an object, not a string. If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
          return;
        } else {
          applyTheme(theme);
        }
      };
    };
  }
});

// ../node_modules/colors/lib/index.js
var require_lib = __commonJS({
  "../node_modules/colors/lib/index.js"(exports2, module2) {
    var colors = require_colors();
    module2["exports"] = colors;
    require_extendStringPrototype()();
  }
});

// index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);

// ../shared/utils.ts
var import_short_hash = __toESM(require_src());

// ../node_modules/lodash-es/_freeGlobal.js
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
var freeGlobal_default = freeGlobal;

// ../node_modules/lodash-es/_root.js
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal_default || freeSelf || Function("return this")();
var root_default = root;

// ../node_modules/lodash-es/_Symbol.js
var Symbol2 = root_default.Symbol;
var Symbol_default = Symbol2;

// ../node_modules/lodash-es/_getRawTag.js
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var nativeObjectToString = objectProto.toString;
var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  try {
    value[symToStringTag] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
var getRawTag_default = getRawTag;

// ../node_modules/lodash-es/_objectToString.js
var objectProto2 = Object.prototype;
var nativeObjectToString2 = objectProto2.toString;
function objectToString(value) {
  return nativeObjectToString2.call(value);
}
var objectToString_default = objectToString;

// ../node_modules/lodash-es/_baseGetTag.js
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
}
var baseGetTag_default = baseGetTag;

// ../node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default = isObjectLike;

// ../node_modules/lodash-es/isSymbol.js
var symbolTag = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
}
var isSymbol_default = isSymbol;

// ../node_modules/lodash-es/_arrayMap.js
function arrayMap(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length, result = Array(length);
  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}
var arrayMap_default = arrayMap;

// ../node_modules/lodash-es/isArray.js
var isArray = Array.isArray;
var isArray_default = isArray;

// ../node_modules/lodash-es/_baseToString.js
var INFINITY = 1 / 0;
var symbolProto = Symbol_default ? Symbol_default.prototype : void 0;
var symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray_default(value)) {
    return arrayMap_default(value, baseToString) + "";
  }
  if (isSymbol_default(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
}
var baseToString_default = baseToString;

// ../node_modules/lodash-es/isObject.js
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_default = isObject;

// ../node_modules/lodash-es/identity.js
function identity(value) {
  return value;
}
var identity_default = identity;

// ../node_modules/lodash-es/isFunction.js
var asyncTag = "[object AsyncFunction]";
var funcTag = "[object Function]";
var genTag = "[object GeneratorFunction]";
var proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject_default(value)) {
    return false;
  }
  var tag = baseGetTag_default(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}
var isFunction_default = isFunction;

// ../node_modules/lodash-es/_coreJsData.js
var coreJsData = root_default["__core-js_shared__"];
var coreJsData_default = coreJsData;

// ../node_modules/lodash-es/_isMasked.js
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData_default && coreJsData_default.keys && coreJsData_default.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
})();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var isMasked_default = isMasked;

// ../node_modules/lodash-es/_toSource.js
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var toSource_default = toSource;

// ../node_modules/lodash-es/_baseIsNative.js
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto2 = Function.prototype;
var objectProto3 = Object.prototype;
var funcToString2 = funcProto2.toString;
var hasOwnProperty2 = objectProto3.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString2.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative(value) {
  if (!isObject_default(value) || isMasked_default(value)) {
    return false;
  }
  var pattern = isFunction_default(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource_default(value));
}
var baseIsNative_default = baseIsNative;

// ../node_modules/lodash-es/_getValue.js
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
var getValue_default = getValue;

// ../node_modules/lodash-es/_getNative.js
function getNative(object, key) {
  var value = getValue_default(object, key);
  return baseIsNative_default(value) ? value : void 0;
}
var getNative_default = getNative;

// ../node_modules/lodash-es/_WeakMap.js
var WeakMap = getNative_default(root_default, "WeakMap");
var WeakMap_default = WeakMap;

// ../node_modules/lodash-es/_apply.js
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var apply_default = apply;

// ../node_modules/lodash-es/_shortOut.js
var HOT_COUNT = 800;
var HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
var shortOut_default = shortOut;

// ../node_modules/lodash-es/constant.js
function constant(value) {
  return function() {
    return value;
  };
}
var constant_default = constant;

// ../node_modules/lodash-es/_defineProperty.js
var defineProperty = (function() {
  try {
    var func = getNative_default(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
})();
var defineProperty_default = defineProperty;

// ../node_modules/lodash-es/_baseSetToString.js
var baseSetToString = !defineProperty_default ? identity_default : function(func, string) {
  return defineProperty_default(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant_default(string),
    "writable": true
  });
};
var baseSetToString_default = baseSetToString;

// ../node_modules/lodash-es/_setToString.js
var setToString = shortOut_default(baseSetToString_default);
var setToString_default = setToString;

// ../node_modules/lodash-es/_isIndex.js
var MAX_SAFE_INTEGER = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var isIndex_default = isIndex;

// ../node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty_default) {
    defineProperty_default(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
var baseAssignValue_default = baseAssignValue;

// ../node_modules/lodash-es/eq.js
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_default = eq;

// ../node_modules/lodash-es/_assignValue.js
var objectProto4 = Object.prototype;
var hasOwnProperty3 = objectProto4.hasOwnProperty;
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty3.call(object, key) && eq_default(objValue, value)) || value === void 0 && !(key in object)) {
    baseAssignValue_default(object, key, value);
  }
}
var assignValue_default = assignValue;

// ../node_modules/lodash-es/_overRest.js
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply_default(func, this, otherArgs);
  };
}
var overRest_default = overRest;

// ../node_modules/lodash-es/_baseRest.js
function baseRest(func, start) {
  return setToString_default(overRest_default(func, start, identity_default), func + "");
}
var baseRest_default = baseRest;

// ../node_modules/lodash-es/isLength.js
var MAX_SAFE_INTEGER2 = 9007199254740991;
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
}
var isLength_default = isLength;

// ../node_modules/lodash-es/isArrayLike.js
function isArrayLike(value) {
  return value != null && isLength_default(value.length) && !isFunction_default(value);
}
var isArrayLike_default = isArrayLike;

// ../node_modules/lodash-es/_isIterateeCall.js
function isIterateeCall(value, index, object) {
  if (!isObject_default(object)) {
    return false;
  }
  var type = typeof index;
  if (type == "number" ? isArrayLike_default(object) && isIndex_default(index, object.length) : type == "string" && index in object) {
    return eq_default(object[index], value);
  }
  return false;
}
var isIterateeCall_default = isIterateeCall;

// ../node_modules/lodash-es/_isPrototype.js
var objectProto5 = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto5;
  return value === proto;
}
var isPrototype_default = isPrototype;

// ../node_modules/lodash-es/_baseTimes.js
function baseTimes(n, iteratee) {
  var index = -1, result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var baseTimes_default = baseTimes;

// ../node_modules/lodash-es/_baseIsArguments.js
var argsTag = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike_default(value) && baseGetTag_default(value) == argsTag;
}
var baseIsArguments_default = baseIsArguments;

// ../node_modules/lodash-es/isArguments.js
var objectProto6 = Object.prototype;
var hasOwnProperty4 = objectProto6.hasOwnProperty;
var propertyIsEnumerable = objectProto6.propertyIsEnumerable;
var isArguments = baseIsArguments_default(/* @__PURE__ */ (function() {
  return arguments;
})()) ? baseIsArguments_default : function(value) {
  return isObjectLike_default(value) && hasOwnProperty4.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
};
var isArguments_default = isArguments;

// ../node_modules/lodash-es/stubFalse.js
function stubFalse() {
  return false;
}
var stubFalse_default = stubFalse;

// ../node_modules/lodash-es/isBuffer.js
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer2 = moduleExports ? root_default.Buffer : void 0;
var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse_default;
var isBuffer_default = isBuffer;

// ../node_modules/lodash-es/_baseIsTypedArray.js
var argsTag2 = "[object Arguments]";
var arrayTag = "[object Array]";
var boolTag = "[object Boolean]";
var dateTag = "[object Date]";
var errorTag = "[object Error]";
var funcTag2 = "[object Function]";
var mapTag = "[object Map]";
var numberTag = "[object Number]";
var objectTag = "[object Object]";
var regexpTag = "[object RegExp]";
var setTag = "[object Set]";
var stringTag = "[object String]";
var weakMapTag = "[object WeakMap]";
var arrayBufferTag = "[object ArrayBuffer]";
var dataViewTag = "[object DataView]";
var float32Tag = "[object Float32Array]";
var float64Tag = "[object Float64Array]";
var int8Tag = "[object Int8Array]";
var int16Tag = "[object Int16Array]";
var int32Tag = "[object Int32Array]";
var uint8Tag = "[object Uint8Array]";
var uint8ClampedTag = "[object Uint8ClampedArray]";
var uint16Tag = "[object Uint16Array]";
var uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag2] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag2] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
function baseIsTypedArray(value) {
  return isObjectLike_default(value) && isLength_default(value.length) && !!typedArrayTags[baseGetTag_default(value)];
}
var baseIsTypedArray_default = baseIsTypedArray;

// ../node_modules/lodash-es/_baseUnary.js
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}
var baseUnary_default = baseUnary;

// ../node_modules/lodash-es/_nodeUtil.js
var freeExports2 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule2 = freeExports2 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports2 = freeModule2 && freeModule2.exports === freeExports2;
var freeProcess = moduleExports2 && freeGlobal_default.process;
var nodeUtil = (function() {
  try {
    var types = freeModule2 && freeModule2.require && freeModule2.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e) {
  }
})();
var nodeUtil_default = nodeUtil;

// ../node_modules/lodash-es/isTypedArray.js
var nodeIsTypedArray = nodeUtil_default && nodeUtil_default.isTypedArray;
var isTypedArray = nodeIsTypedArray ? baseUnary_default(nodeIsTypedArray) : baseIsTypedArray_default;
var isTypedArray_default = isTypedArray;

// ../node_modules/lodash-es/_arrayLikeKeys.js
var objectProto7 = Object.prototype;
var hasOwnProperty5 = objectProto7.hasOwnProperty;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_default(value), isArg = !isArr && isArguments_default(value), isBuff = !isArr && !isArg && isBuffer_default(value), isType = !isArr && !isArg && !isBuff && isTypedArray_default(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes_default(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty5.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex_default(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var arrayLikeKeys_default = arrayLikeKeys;

// ../node_modules/lodash-es/_overArg.js
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var overArg_default = overArg;

// ../node_modules/lodash-es/_nativeKeys.js
var nativeKeys = overArg_default(Object.keys, Object);
var nativeKeys_default = nativeKeys;

// ../node_modules/lodash-es/_baseKeys.js
var objectProto8 = Object.prototype;
var hasOwnProperty6 = objectProto8.hasOwnProperty;
function baseKeys(object) {
  if (!isPrototype_default(object)) {
    return nativeKeys_default(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty6.call(object, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
var baseKeys_default = baseKeys;

// ../node_modules/lodash-es/keys.js
function keys(object) {
  return isArrayLike_default(object) ? arrayLikeKeys_default(object) : baseKeys_default(object);
}
var keys_default = keys;

// ../node_modules/lodash-es/_isKey.js
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;
function isKey(value, object) {
  if (isArray_default(value)) {
    return false;
  }
  var type = typeof value;
  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol_default(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}
var isKey_default = isKey;

// ../node_modules/lodash-es/_nativeCreate.js
var nativeCreate = getNative_default(Object, "create");
var nativeCreate_default = nativeCreate;

// ../node_modules/lodash-es/_hashClear.js
function hashClear() {
  this.__data__ = nativeCreate_default ? nativeCreate_default(null) : {};
  this.size = 0;
}
var hashClear_default = hashClear;

// ../node_modules/lodash-es/_hashDelete.js
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var hashDelete_default = hashDelete;

// ../node_modules/lodash-es/_hashGet.js
var HASH_UNDEFINED = "__lodash_hash_undefined__";
var objectProto9 = Object.prototype;
var hasOwnProperty7 = objectProto9.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate_default) {
    var result = data[key];
    return result === HASH_UNDEFINED ? void 0 : result;
  }
  return hasOwnProperty7.call(data, key) ? data[key] : void 0;
}
var hashGet_default = hashGet;

// ../node_modules/lodash-es/_hashHas.js
var objectProto10 = Object.prototype;
var hasOwnProperty8 = objectProto10.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate_default ? data[key] !== void 0 : hasOwnProperty8.call(data, key);
}
var hashHas_default = hashHas;

// ../node_modules/lodash-es/_hashSet.js
var HASH_UNDEFINED2 = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate_default && value === void 0 ? HASH_UNDEFINED2 : value;
  return this;
}
var hashSet_default = hashSet;

// ../node_modules/lodash-es/_Hash.js
function Hash(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear_default;
Hash.prototype["delete"] = hashDelete_default;
Hash.prototype.get = hashGet_default;
Hash.prototype.has = hashHas_default;
Hash.prototype.set = hashSet_default;
var Hash_default = Hash;

// ../node_modules/lodash-es/_listCacheClear.js
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
var listCacheClear_default = listCacheClear;

// ../node_modules/lodash-es/_assocIndexOf.js
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_default(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var assocIndexOf_default = assocIndexOf;

// ../node_modules/lodash-es/_listCacheDelete.js
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}
var listCacheDelete_default = listCacheDelete;

// ../node_modules/lodash-es/_listCacheGet.js
function listCacheGet(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  return index < 0 ? void 0 : data[index][1];
}
var listCacheGet_default = listCacheGet;

// ../node_modules/lodash-es/_listCacheHas.js
function listCacheHas(key) {
  return assocIndexOf_default(this.__data__, key) > -1;
}
var listCacheHas_default = listCacheHas;

// ../node_modules/lodash-es/_listCacheSet.js
function listCacheSet(key, value) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
var listCacheSet_default = listCacheSet;

// ../node_modules/lodash-es/_ListCache.js
function ListCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear_default;
ListCache.prototype["delete"] = listCacheDelete_default;
ListCache.prototype.get = listCacheGet_default;
ListCache.prototype.has = listCacheHas_default;
ListCache.prototype.set = listCacheSet_default;
var ListCache_default = ListCache;

// ../node_modules/lodash-es/_Map.js
var Map = getNative_default(root_default, "Map");
var Map_default = Map;

// ../node_modules/lodash-es/_mapCacheClear.js
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash_default(),
    "map": new (Map_default || ListCache_default)(),
    "string": new Hash_default()
  };
}
var mapCacheClear_default = mapCacheClear;

// ../node_modules/lodash-es/_isKeyable.js
function isKeyable(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
var isKeyable_default = isKeyable;

// ../node_modules/lodash-es/_getMapData.js
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable_default(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var getMapData_default = getMapData;

// ../node_modules/lodash-es/_mapCacheDelete.js
function mapCacheDelete(key) {
  var result = getMapData_default(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var mapCacheDelete_default = mapCacheDelete;

// ../node_modules/lodash-es/_mapCacheGet.js
function mapCacheGet(key) {
  return getMapData_default(this, key).get(key);
}
var mapCacheGet_default = mapCacheGet;

// ../node_modules/lodash-es/_mapCacheHas.js
function mapCacheHas(key) {
  return getMapData_default(this, key).has(key);
}
var mapCacheHas_default = mapCacheHas;

// ../node_modules/lodash-es/_mapCacheSet.js
function mapCacheSet(key, value) {
  var data = getMapData_default(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
var mapCacheSet_default = mapCacheSet;

// ../node_modules/lodash-es/_MapCache.js
function MapCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear_default;
MapCache.prototype["delete"] = mapCacheDelete_default;
MapCache.prototype.get = mapCacheGet_default;
MapCache.prototype.has = mapCacheHas_default;
MapCache.prototype.set = mapCacheSet_default;
var MapCache_default = MapCache;

// ../node_modules/lodash-es/memoize.js
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache_default)();
  return memoized;
}
memoize.Cache = MapCache_default;
var memoize_default = memoize;

// ../node_modules/lodash-es/_memoizeCapped.js
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped(func) {
  var result = memoize_default(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });
  var cache = result.cache;
  return result;
}
var memoizeCapped_default = memoizeCapped;

// ../node_modules/lodash-es/_stringToPath.js
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath = memoizeCapped_default(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46) {
    result.push("");
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
  });
  return result;
});
var stringToPath_default = stringToPath;

// ../node_modules/lodash-es/toString.js
function toString(value) {
  return value == null ? "" : baseToString_default(value);
}
var toString_default = toString;

// ../node_modules/lodash-es/_castPath.js
function castPath(value, object) {
  if (isArray_default(value)) {
    return value;
  }
  return isKey_default(value, object) ? [value] : stringToPath_default(toString_default(value));
}
var castPath_default = castPath;

// ../node_modules/lodash-es/_toKey.js
var INFINITY2 = 1 / 0;
function toKey(value) {
  if (typeof value == "string" || isSymbol_default(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY2 ? "-0" : result;
}
var toKey_default = toKey;

// ../node_modules/lodash-es/_baseGet.js
function baseGet(object, path) {
  path = castPath_default(path, object);
  var index = 0, length = path.length;
  while (object != null && index < length) {
    object = object[toKey_default(path[index++])];
  }
  return index && index == length ? object : void 0;
}
var baseGet_default = baseGet;

// ../node_modules/lodash-es/get.js
function get(object, path, defaultValue) {
  var result = object == null ? void 0 : baseGet_default(object, path);
  return result === void 0 ? defaultValue : result;
}
var get_default = get;

// ../node_modules/lodash-es/_arrayPush.js
function arrayPush(array, values) {
  var index = -1, length = values.length, offset = array.length;
  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}
var arrayPush_default = arrayPush;

// ../node_modules/lodash-es/_isFlattenable.js
var spreadableSymbol = Symbol_default ? Symbol_default.isConcatSpreadable : void 0;
function isFlattenable(value) {
  return isArray_default(value) || isArguments_default(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}
var isFlattenable_default = isFlattenable;

// ../node_modules/lodash-es/_baseFlatten.js
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1, length = array.length;
  predicate || (predicate = isFlattenable_default);
  result || (result = []);
  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush_default(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}
var baseFlatten_default = baseFlatten;

// ../node_modules/lodash-es/flatten.js
function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? baseFlatten_default(array, 1) : [];
}
var flatten_default = flatten;

// ../node_modules/lodash-es/_flatRest.js
function flatRest(func) {
  return setToString_default(overRest_default(func, void 0, flatten_default), func + "");
}
var flatRest_default = flatRest;

// ../node_modules/lodash-es/_stackClear.js
function stackClear() {
  this.__data__ = new ListCache_default();
  this.size = 0;
}
var stackClear_default = stackClear;

// ../node_modules/lodash-es/_stackDelete.js
function stackDelete(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var stackDelete_default = stackDelete;

// ../node_modules/lodash-es/_stackGet.js
function stackGet(key) {
  return this.__data__.get(key);
}
var stackGet_default = stackGet;

// ../node_modules/lodash-es/_stackHas.js
function stackHas(key) {
  return this.__data__.has(key);
}
var stackHas_default = stackHas;

// ../node_modules/lodash-es/_stackSet.js
var LARGE_ARRAY_SIZE = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache_default) {
    var pairs = data.__data__;
    if (!Map_default || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache_default(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var stackSet_default = stackSet;

// ../node_modules/lodash-es/_Stack.js
function Stack(entries) {
  var data = this.__data__ = new ListCache_default(entries);
  this.size = data.size;
}
Stack.prototype.clear = stackClear_default;
Stack.prototype["delete"] = stackDelete_default;
Stack.prototype.get = stackGet_default;
Stack.prototype.has = stackHas_default;
Stack.prototype.set = stackSet_default;
var Stack_default = Stack;

// ../node_modules/lodash-es/_arrayFilter.js
function arrayFilter(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var arrayFilter_default = arrayFilter;

// ../node_modules/lodash-es/stubArray.js
function stubArray() {
  return [];
}
var stubArray_default = stubArray;

// ../node_modules/lodash-es/_getSymbols.js
var objectProto11 = Object.prototype;
var propertyIsEnumerable2 = objectProto11.propertyIsEnumerable;
var nativeGetSymbols = Object.getOwnPropertySymbols;
var getSymbols = !nativeGetSymbols ? stubArray_default : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter_default(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable2.call(object, symbol);
  });
};
var getSymbols_default = getSymbols;

// ../node_modules/lodash-es/_baseGetAllKeys.js
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_default(object) ? result : arrayPush_default(result, symbolsFunc(object));
}
var baseGetAllKeys_default = baseGetAllKeys;

// ../node_modules/lodash-es/_getAllKeys.js
function getAllKeys(object) {
  return baseGetAllKeys_default(object, keys_default, getSymbols_default);
}
var getAllKeys_default = getAllKeys;

// ../node_modules/lodash-es/_DataView.js
var DataView = getNative_default(root_default, "DataView");
var DataView_default = DataView;

// ../node_modules/lodash-es/_Promise.js
var Promise2 = getNative_default(root_default, "Promise");
var Promise_default = Promise2;

// ../node_modules/lodash-es/_Set.js
var Set2 = getNative_default(root_default, "Set");
var Set_default = Set2;

// ../node_modules/lodash-es/_getTag.js
var mapTag2 = "[object Map]";
var objectTag2 = "[object Object]";
var promiseTag = "[object Promise]";
var setTag2 = "[object Set]";
var weakMapTag2 = "[object WeakMap]";
var dataViewTag2 = "[object DataView]";
var dataViewCtorString = toSource_default(DataView_default);
var mapCtorString = toSource_default(Map_default);
var promiseCtorString = toSource_default(Promise_default);
var setCtorString = toSource_default(Set_default);
var weakMapCtorString = toSource_default(WeakMap_default);
var getTag = baseGetTag_default;
if (DataView_default && getTag(new DataView_default(new ArrayBuffer(1))) != dataViewTag2 || Map_default && getTag(new Map_default()) != mapTag2 || Promise_default && getTag(Promise_default.resolve()) != promiseTag || Set_default && getTag(new Set_default()) != setTag2 || WeakMap_default && getTag(new WeakMap_default()) != weakMapTag2) {
  getTag = function(value) {
    var result = baseGetTag_default(value), Ctor = result == objectTag2 ? value.constructor : void 0, ctorString = Ctor ? toSource_default(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag2;
        case mapCtorString:
          return mapTag2;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag2;
        case weakMapCtorString:
          return weakMapTag2;
      }
    }
    return result;
  };
}
var getTag_default = getTag;

// ../node_modules/lodash-es/_Uint8Array.js
var Uint8Array2 = root_default.Uint8Array;
var Uint8Array_default = Uint8Array2;

// ../node_modules/lodash-es/_setCacheAdd.js
var HASH_UNDEFINED3 = "__lodash_hash_undefined__";
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED3);
  return this;
}
var setCacheAdd_default = setCacheAdd;

// ../node_modules/lodash-es/_setCacheHas.js
function setCacheHas(value) {
  return this.__data__.has(value);
}
var setCacheHas_default = setCacheHas;

// ../node_modules/lodash-es/_SetCache.js
function SetCache(values) {
  var index = -1, length = values == null ? 0 : values.length;
  this.__data__ = new MapCache_default();
  while (++index < length) {
    this.add(values[index]);
  }
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd_default;
SetCache.prototype.has = setCacheHas_default;
var SetCache_default = SetCache;

// ../node_modules/lodash-es/_arraySome.js
function arraySome(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}
var arraySome_default = arraySome;

// ../node_modules/lodash-es/_cacheHas.js
function cacheHas(cache, key) {
  return cache.has(key);
}
var cacheHas_default = cacheHas;

// ../node_modules/lodash-es/_equalArrays.js
var COMPARE_PARTIAL_FLAG = 1;
var COMPARE_UNORDERED_FLAG = 2;
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }
  var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache_default() : void 0;
  stack.set(array, other);
  stack.set(other, array);
  while (++index < arrLength) {
    var arrValue = array[index], othValue = other[index];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== void 0) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    if (seen) {
      if (!arraySome_default(other, function(othValue2, othIndex) {
        if (!cacheHas_default(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack["delete"](array);
  stack["delete"](other);
  return result;
}
var equalArrays_default = equalArrays;

// ../node_modules/lodash-es/_mapToArray.js
function mapToArray(map) {
  var index = -1, result = Array(map.size);
  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}
var mapToArray_default = mapToArray;

// ../node_modules/lodash-es/_setToArray.js
function setToArray(set2) {
  var index = -1, result = Array(set2.size);
  set2.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}
var setToArray_default = setToArray;

// ../node_modules/lodash-es/_equalByTag.js
var COMPARE_PARTIAL_FLAG2 = 1;
var COMPARE_UNORDERED_FLAG2 = 2;
var boolTag2 = "[object Boolean]";
var dateTag2 = "[object Date]";
var errorTag2 = "[object Error]";
var mapTag3 = "[object Map]";
var numberTag2 = "[object Number]";
var regexpTag2 = "[object RegExp]";
var setTag3 = "[object Set]";
var stringTag2 = "[object String]";
var symbolTag2 = "[object Symbol]";
var arrayBufferTag2 = "[object ArrayBuffer]";
var dataViewTag3 = "[object DataView]";
var symbolProto2 = Symbol_default ? Symbol_default.prototype : void 0;
var symbolValueOf = symbolProto2 ? symbolProto2.valueOf : void 0;
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag3:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;
    case arrayBufferTag2:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array_default(object), new Uint8Array_default(other))) {
        return false;
      }
      return true;
    case boolTag2:
    case dateTag2:
    case numberTag2:
      return eq_default(+object, +other);
    case errorTag2:
      return object.name == other.name && object.message == other.message;
    case regexpTag2:
    case stringTag2:
      return object == other + "";
    case mapTag3:
      var convert = mapToArray_default;
    case setTag3:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG2;
      convert || (convert = setToArray_default);
      if (object.size != other.size && !isPartial) {
        return false;
      }
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG2;
      stack.set(object, other);
      var result = equalArrays_default(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack["delete"](object);
      return result;
    case symbolTag2:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}
var equalByTag_default = equalByTag;

// ../node_modules/lodash-es/_equalObjects.js
var COMPARE_PARTIAL_FLAG3 = 1;
var objectProto12 = Object.prototype;
var hasOwnProperty9 = objectProto12.hasOwnProperty;
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG3, objProps = getAllKeys_default(object), objLength = objProps.length, othProps = getAllKeys_default(other), othLength = othProps.length;
  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty9.call(other, key))) {
      return false;
    }
  }
  var objStacked = stack.get(object);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key], othValue = other[key];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    }
    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == "constructor");
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor, othCtor = other.constructor;
    if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack["delete"](object);
  stack["delete"](other);
  return result;
}
var equalObjects_default = equalObjects;

// ../node_modules/lodash-es/_baseIsEqualDeep.js
var COMPARE_PARTIAL_FLAG4 = 1;
var argsTag3 = "[object Arguments]";
var arrayTag2 = "[object Array]";
var objectTag3 = "[object Object]";
var objectProto13 = Object.prototype;
var hasOwnProperty10 = objectProto13.hasOwnProperty;
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_default(object), othIsArr = isArray_default(other), objTag = objIsArr ? arrayTag2 : getTag_default(object), othTag = othIsArr ? arrayTag2 : getTag_default(other);
  objTag = objTag == argsTag3 ? objectTag3 : objTag;
  othTag = othTag == argsTag3 ? objectTag3 : othTag;
  var objIsObj = objTag == objectTag3, othIsObj = othTag == objectTag3, isSameTag = objTag == othTag;
  if (isSameTag && isBuffer_default(object)) {
    if (!isBuffer_default(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack_default());
    return objIsArr || isTypedArray_default(object) ? equalArrays_default(object, other, bitmask, customizer, equalFunc, stack) : equalByTag_default(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG4)) {
    var objIsWrapped = objIsObj && hasOwnProperty10.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty10.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack_default());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack_default());
  return equalObjects_default(object, other, bitmask, customizer, equalFunc, stack);
}
var baseIsEqualDeep_default = baseIsEqualDeep;

// ../node_modules/lodash-es/_baseIsEqual.js
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike_default(value) && !isObjectLike_default(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep_default(value, other, bitmask, customizer, baseIsEqual, stack);
}
var baseIsEqual_default = baseIsEqual;

// ../node_modules/lodash-es/_baseIsMatch.js
var COMPARE_PARTIAL_FLAG5 = 1;
var COMPARE_UNORDERED_FLAG3 = 2;
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length, length = index, noCustomizer = !customizer;
  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0], objValue = object[key], srcValue = data[1];
    if (noCustomizer && data[2]) {
      if (objValue === void 0 && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack_default();
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === void 0 ? baseIsEqual_default(srcValue, objValue, COMPARE_PARTIAL_FLAG5 | COMPARE_UNORDERED_FLAG3, customizer, stack) : result)) {
        return false;
      }
    }
  }
  return true;
}
var baseIsMatch_default = baseIsMatch;

// ../node_modules/lodash-es/_isStrictComparable.js
function isStrictComparable(value) {
  return value === value && !isObject_default(value);
}
var isStrictComparable_default = isStrictComparable;

// ../node_modules/lodash-es/_getMatchData.js
function getMatchData(object) {
  var result = keys_default(object), length = result.length;
  while (length--) {
    var key = result[length], value = object[key];
    result[length] = [key, value, isStrictComparable_default(value)];
  }
  return result;
}
var getMatchData_default = getMatchData;

// ../node_modules/lodash-es/_matchesStrictComparable.js
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
  };
}
var matchesStrictComparable_default = matchesStrictComparable;

// ../node_modules/lodash-es/_baseMatches.js
function baseMatches(source) {
  var matchData = getMatchData_default(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable_default(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch_default(object, source, matchData);
  };
}
var baseMatches_default = baseMatches;

// ../node_modules/lodash-es/_baseHasIn.js
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}
var baseHasIn_default = baseHasIn;

// ../node_modules/lodash-es/_hasPath.js
function hasPath(object, path, hasFunc) {
  path = castPath_default(path, object);
  var index = -1, length = path.length, result = false;
  while (++index < length) {
    var key = toKey_default(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength_default(length) && isIndex_default(key, length) && (isArray_default(object) || isArguments_default(object));
}
var hasPath_default = hasPath;

// ../node_modules/lodash-es/hasIn.js
function hasIn(object, path) {
  return object != null && hasPath_default(object, path, baseHasIn_default);
}
var hasIn_default = hasIn;

// ../node_modules/lodash-es/_baseMatchesProperty.js
var COMPARE_PARTIAL_FLAG6 = 1;
var COMPARE_UNORDERED_FLAG4 = 2;
function baseMatchesProperty(path, srcValue) {
  if (isKey_default(path) && isStrictComparable_default(srcValue)) {
    return matchesStrictComparable_default(toKey_default(path), srcValue);
  }
  return function(object) {
    var objValue = get_default(object, path);
    return objValue === void 0 && objValue === srcValue ? hasIn_default(object, path) : baseIsEqual_default(srcValue, objValue, COMPARE_PARTIAL_FLAG6 | COMPARE_UNORDERED_FLAG4);
  };
}
var baseMatchesProperty_default = baseMatchesProperty;

// ../node_modules/lodash-es/_baseProperty.js
function baseProperty(key) {
  return function(object) {
    return object == null ? void 0 : object[key];
  };
}
var baseProperty_default = baseProperty;

// ../node_modules/lodash-es/_basePropertyDeep.js
function basePropertyDeep(path) {
  return function(object) {
    return baseGet_default(object, path);
  };
}
var basePropertyDeep_default = basePropertyDeep;

// ../node_modules/lodash-es/property.js
function property(path) {
  return isKey_default(path) ? baseProperty_default(toKey_default(path)) : basePropertyDeep_default(path);
}
var property_default = property;

// ../node_modules/lodash-es/_baseIteratee.js
function baseIteratee(value) {
  if (typeof value == "function") {
    return value;
  }
  if (value == null) {
    return identity_default;
  }
  if (typeof value == "object") {
    return isArray_default(value) ? baseMatchesProperty_default(value[0], value[1]) : baseMatches_default(value);
  }
  return property_default(value);
}
var baseIteratee_default = baseIteratee;

// ../node_modules/lodash-es/_createBaseFor.js
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var createBaseFor_default = createBaseFor;

// ../node_modules/lodash-es/_baseFor.js
var baseFor = createBaseFor_default();
var baseFor_default = baseFor;

// ../node_modules/lodash-es/_baseForOwn.js
function baseForOwn(object, iteratee) {
  return object && baseFor_default(object, iteratee, keys_default);
}
var baseForOwn_default = baseForOwn;

// ../node_modules/lodash-es/_createBaseEach.js
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike_default(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}
var createBaseEach_default = createBaseEach;

// ../node_modules/lodash-es/_baseEach.js
var baseEach = createBaseEach_default(baseForOwn_default);
var baseEach_default = baseEach;

// ../node_modules/lodash-es/_baseMap.js
function baseMap(collection, iteratee) {
  var index = -1, result = isArrayLike_default(collection) ? Array(collection.length) : [];
  baseEach_default(collection, function(value, key, collection2) {
    result[++index] = iteratee(value, key, collection2);
  });
  return result;
}
var baseMap_default = baseMap;

// ../node_modules/lodash-es/_baseSet.js
function baseSet(object, path, value, customizer) {
  if (!isObject_default(object)) {
    return object;
  }
  path = castPath_default(path, object);
  var index = -1, length = path.length, lastIndex = length - 1, nested = object;
  while (nested != null && ++index < length) {
    var key = toKey_default(path[index]), newValue = value;
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return object;
    }
    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : void 0;
      if (newValue === void 0) {
        newValue = isObject_default(objValue) ? objValue : isIndex_default(path[index + 1]) ? [] : {};
      }
    }
    assignValue_default(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}
var baseSet_default = baseSet;

// ../node_modules/lodash-es/_basePickBy.js
function basePickBy(object, paths, predicate) {
  var index = -1, length = paths.length, result = {};
  while (++index < length) {
    var path = paths[index], value = baseGet_default(object, path);
    if (predicate(value, path)) {
      baseSet_default(result, castPath_default(path, object), value);
    }
  }
  return result;
}
var basePickBy_default = basePickBy;

// ../node_modules/lodash-es/_baseSortBy.js
function baseSortBy(array, comparer) {
  var length = array.length;
  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}
var baseSortBy_default = baseSortBy;

// ../node_modules/lodash-es/_compareAscending.js
function compareAscending(value, other) {
  if (value !== other) {
    var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol_default(value);
    var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol_default(other);
    if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
      return 1;
    }
    if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
      return -1;
    }
  }
  return 0;
}
var compareAscending_default = compareAscending;

// ../node_modules/lodash-es/_compareMultiple.js
function compareMultiple(object, other, orders) {
  var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
  while (++index < length) {
    var result = compareAscending_default(objCriteria[index], othCriteria[index]);
    if (result) {
      if (index >= ordersLength) {
        return result;
      }
      var order = orders[index];
      return result * (order == "desc" ? -1 : 1);
    }
  }
  return object.index - other.index;
}
var compareMultiple_default = compareMultiple;

// ../node_modules/lodash-es/_baseOrderBy.js
function baseOrderBy(collection, iteratees, orders) {
  if (iteratees.length) {
    iteratees = arrayMap_default(iteratees, function(iteratee) {
      if (isArray_default(iteratee)) {
        return function(value) {
          return baseGet_default(value, iteratee.length === 1 ? iteratee[0] : iteratee);
        };
      }
      return iteratee;
    });
  } else {
    iteratees = [identity_default];
  }
  var index = -1;
  iteratees = arrayMap_default(iteratees, baseUnary_default(baseIteratee_default));
  var result = baseMap_default(collection, function(value, key, collection2) {
    var criteria = arrayMap_default(iteratees, function(iteratee) {
      return iteratee(value);
    });
    return { "criteria": criteria, "index": ++index, "value": value };
  });
  return baseSortBy_default(result, function(object, other) {
    return compareMultiple_default(object, other, orders);
  });
}
var baseOrderBy_default = baseOrderBy;

// ../node_modules/lodash-es/_basePick.js
function basePick(object, paths) {
  return basePickBy_default(object, paths, function(value, path) {
    return hasIn_default(object, path);
  });
}
var basePick_default = basePick;

// ../node_modules/lodash-es/pick.js
var pick = flatRest_default(function(object, paths) {
  return object == null ? {} : basePick_default(object, paths);
});
var pick_default = pick;

// ../node_modules/lodash-es/sortBy.js
var sortBy = baseRest_default(function(collection, iteratees) {
  if (collection == null) {
    return [];
  }
  var length = iteratees.length;
  if (length > 1 && isIterateeCall_default(collection, iteratees[0], iteratees[1])) {
    iteratees = [];
  } else if (length > 2 && isIterateeCall_default(iteratees[0], iteratees[1], iteratees[2])) {
    iteratees = [iteratees[0]];
  }
  return baseOrderBy_default(collection, baseFlatten_default(iteratees, 1), []);
});
var sortBy_default = sortBy;

// ../shared/aws-s3.ts
var import_fs = __toESM(require("fs"));
var import_client_s3 = require("@aws-sdk/client-s3");

// ../../src/config/s3.ts
var PUBLIC_BUCKET_PATHS = {
  events: "events/",
  eventsResults: "events_results/",
  series: "series/",
  seriesResults: "series_results/",
  athletes: "athletes/",
  athletesProfiles: "views/athletes_profiles/"
};
var PUBLIC_BUCKET_FILES = {
  athletes: {
    list: "views/athletes.json",
    lookup: "athletes_lookup.json",
    teams: "teams.json"
  },
  views: {
    recentlyUpgradedAthletes: "views/recently_upgraded_athletes.json"
  }
};

// ../shared/config.ts
var RAW_INGESTION_DATA_PATH = "raw_ingestion_data/";
var CONFIG_FILES = {
  athletesOverrides: "athlete_overrides.json",
  eventDays: "event_days.json"
};
var WATCHER_LAST_CHECKS_PATH = `watcher_last_checks/`;
var ENV = process.env.ENV || "prod";
var DEBUG = process.env.DEBUG === "true" || true;
var RR_S3_BUCKET = ENV === "prod" ? "cycling-race-results" : "cycling-race-results-stage";
var AWS_DEFAULT_CONFIG = {
  region: "us-west-2"
};
var LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || "../../storage";
var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
var NO_CACHE_FILES = [
  PUBLIC_BUCKET_FILES.athletes.list,
  PUBLIC_BUCKET_PATHS.athletesProfiles,
  `${PUBLIC_BUCKET_PATHS.events}${currentYear}.json`,
  `${PUBLIC_BUCKET_PATHS.eventsResults}${currentYear}`
];
var CLEAN_ATHLETE_CATEGORIES_FILE = "athletes_skill_categories.json";

// ../shared/aws-s3.ts
var AwsS3Client = class {
  constructor(bucket, config) {
    this._bucket = bucket;
    this._client = new import_client_s3.S3Client({
      ...AWS_DEFAULT_CONFIG,
      ...config || {}
    });
  }
  async fetchDirectoryFiles(directory) {
    const response = await this._client.send(
      new import_client_s3.ListObjectsCommand({
        Bucket: this._bucket,
        Delimiter: "/",
        Prefix: directory
      })
    );
    let files = [];
    let subdirectories = [];
    if (response.Contents?.length) files = response.Contents;
    if (response.CommonPrefixes) subdirectories = response.CommonPrefixes.map(({ Prefix }) => Prefix);
    return {
      files,
      subdirectories
    };
  }
  async fetchFile(filename, ignoreNotFound = false) {
    try {
      const response = await this._client.send(
        new import_client_s3.GetObjectCommand({
          Bucket: this._bucket,
          Key: filename
        })
      );
      const content = await response.Body?.transformToString();
      return content || null;
    } catch (error) {
      if (error instanceof import_client_s3.S3ServiceException && error.name === "NoSuchKey" && ignoreNotFound) return "";
      throw error;
    }
  }
  async writeFile(path, content) {
    let cacheControl = "must-revalidate, max-age=3600";
    if (NO_CACHE_FILES.some((file) => path.startsWith(file))) {
      cacheControl = "max-age=0, no-cache, no-store, must-revalidate";
    }
    await this._client.send(
      new import_client_s3.PutObjectCommand({
        Bucket: this._bucket,
        Key: path,
        Body: content,
        CacheControl: cacheControl,
        ContentType: "application/json"
      })
    );
    if (ENV === "dev" && this._bucket === RR_S3_BUCKET) {
      const directory = `${LOCAL_STORAGE_PATH}/${path}`.split("/").slice(0, -1).join("/");
      if (!import_fs.default.existsSync(directory)) import_fs.default.mkdirSync(directory, { recursive: true });
      const unpackedContent = JSON.parse(content);
      import_fs.default.writeFileSync(`${LOCAL_STORAGE_PATH}/${path}`, JSON.stringify(unpackedContent, null, 2));
    }
  }
  async deleteFile(path) {
    await this._client.send(
      new import_client_s3.DeleteObjectCommand({
        Bucket: this._bucket,
        Key: path
      })
    );
  }
};

// ../shared/upgrade-points.ts
var hasUpgradePoints = (eventType) => {
  if (!eventType) return false;
  if (["A", "AA", "AAA", "AA-USA"].includes(eventType)) return "UPGRADE";
  if (eventType === "GRASSROOTS") return "SUBJECTIVE";
  return false;
};

// ../shared/utils.ts
var s3 = new AwsS3Client(RR_S3_BUCKET);
var formatProvince = (province) => {
  if (!province) return;
  const formattedProvince = province.trim().toUpperCase();
  switch (formattedProvince) {
    case "BC":
    case "BRITISH COLUMBIA":
      return "BC";
    case "AB":
    case "ALBERTA":
      return "AB";
    case "SK":
    case "SASKATCHEWAN":
      return "SK";
    case "MB":
    case "MANITOBA":
      return "MB";
    case "ON":
    case "ONTARIO":
      return "ON";
    case "QC":
    case "QUEBEC":
      return "QC";
    case "NB":
    case "NEW BRUNSWICK":
      return "NB";
    case "NS":
    case "NOVA SCOTIA":
      return "NS";
    case "PEI":
    case "PRINCE EDWARD ISLAND":
      return "PE";
    case "NL":
    case "NEWFOUNDLAND AND LABRADOR":
      return "NL";
    case "WASHINGTON":
      return "WA";
    case "OREGON":
      return "OR";
    default:
      return formattedProvince;
  }
};
var capitalize = (str) => {
  if (str == null || str === void 0) return str;
  return str.toLowerCase().replace(/(?:^|\s|-|["'([{])+\S/g, (match) => match.toUpperCase());
};

// config.ts
var SCRIPT_NAME = "athletes";
var PROCESSING_RAW_DATA_ATHLETES_PATH = "raw_athletes/";
var PROCESSING_RAW_DATA_RACE_RESULTS_PATH = "raw_athlete_races_results/";
var PROCESSING_RAW_DATA_UPGRADE_POINTS_PATH = "raw_athlete_upgrade_points/";
var PROCESSING_RAW_DATA_TEAMS_PATH = "raw_athlete_teams/";
var DUPLICATE_ATHLETES_FILE = "athlete_duplicates.json";
var BASE_ATHLETES_FILE = "base_athletes.json";
var ATHLETE_MANUAL_EDITS_FILE = "athlete_manual_edits.json";
var CLEAN_ATHLETE_RACES_RESULTS_PATH = "athlete_races_results/";
var CLEAN_ATHLETE_UPGRADE_POINTS_PATH = "athlete_upgrade_points/";
var CLEAN_ATHLETE_UPGRADE_DATES_FILE = "athlete_upgrade_dates.json";
var DEFAULT_EVENT_FILTERS = { location: { country: "CA", province: "BC" } };

// ../shared/data/athletes.ts
var getBaseAthletes = async () => {
  const fileContent = await s3.fetchFile(BASE_ATHLETES_FILE, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var updateBaseAthletes = async (athletes) => {
  const existingAthletes = await getBaseAthletes();
  const updatedAthleteUciIds = athletes.map((a) => a.uciId);
  const combinedAthletes = [
    ...existingAthletes.filter((a) => !updatedAthleteUciIds.includes(a.uciId)),
    ...athletes
  ];
  await s3.writeFile(BASE_ATHLETES_FILE, JSON.stringify(combinedAthletes));
};
var getAthleteManualEdits = async () => {
  const fileContent = await s3.fetchFile(ATHLETE_MANUAL_EDITS_FILE, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var updateAthleteManualEdits = async (athleteEdits) => {
  const existingAthleteManualEdits = await getAthleteManualEdits();
  const updatedAthleteUciIds = existingAthleteManualEdits.map((a) => a.uciId);
  const combinedAthleteManualEdits = [
    ...existingAthleteManualEdits.filter((a) => !updatedAthleteUciIds.includes(a.uciId)),
    ...athleteEdits.map((athleteManualEdit) => {
      const existingEdit = existingAthleteManualEdits.find((e) => e.uciId === athleteManualEdit.uciId);
      return {
        athleteManualEdit,
        meta: {
          createdAt: existingEdit ? existingEdit.meta.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    })
  ];
  await s3.writeFile(ATHLETE_MANUAL_EDITS_FILE, JSON.stringify(combinedAthleteManualEdits));
};
var getAthletesOverrides = async () => {
  const fileContent = await s3.fetchFile(CONFIG_FILES.athletesOverrides);
  if (!fileContent) throw new Error(`File ${CONFIG_FILES.athletesOverrides} not found!`);
  return JSON.parse(fileContent);
};
var getAthletesCategories = async () => {
  const fileContent = await s3.fetchFile(CLEAN_ATHLETE_CATEGORIES_FILE);
  if (!fileContent) throw new Error(`Athlete categories file ${CLEAN_ATHLETE_CATEGORIES_FILE} is empty!`);
  return JSON.parse(fileContent);
};
var updateAthleteCategories = async (athleteCategories) => {
  await s3.writeFile(CLEAN_ATHLETE_CATEGORIES_FILE, JSON.stringify(athleteCategories));
};
var getAthletesRacesResults = async ({ year, eventHash, eventHashes }) => {
  if (eventHash) eventHashes = [eventHash];
  if (!eventHashes || eventHashes.length === 0) throw new Error("You must provide at least an event hash to get athletes race results!");
  const raceResultsByEvents = await Promise.all(
    eventHashes.map(async (hash) => {
      const filename = CLEAN_ATHLETE_RACES_RESULTS_PATH + `${year}/${hash}.json`;
      const fileContent = await s3.fetchFile(filename, true);
      if (!fileContent) return [];
      return JSON.parse(fileContent);
    })
  );
  return raceResultsByEvents.flat();
};
var updateAthletesRacesResults = async (athletesRaceResults, { year, eventHash }) => {
  const filename = CLEAN_ATHLETE_RACES_RESULTS_PATH + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(athletesRaceResults));
};
var getAthletesUpgradePoints = async ({ year, eventHash, eventHashes }) => {
  if (eventHash) eventHashes = [eventHash];
  if (!eventHashes || eventHashes.length === 0) throw new Error("You must provide at least an event hash to get athletes upgrade points!");
  const upgradePointsByEvents = await Promise.all(
    eventHashes.map(async (hash) => {
      const filename = CLEAN_ATHLETE_UPGRADE_POINTS_PATH + `${year}/${hash}.json`;
      const fileContent = await s3.fetchFile(filename, true);
      if (!fileContent) return [];
      return JSON.parse(fileContent);
    })
  );
  return upgradePointsByEvents.flat();
};
var updateAthletesUpgradePoints = async (athletesUpgradePoints, { year, eventHash }) => {
  const filename = CLEAN_ATHLETE_UPGRADE_POINTS_PATH + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(athletesUpgradePoints));
};
var getAthletesUpgradeDates = async () => {
  const fileContent = await s3.fetchFile(CLEAN_ATHLETE_UPGRADE_DATES_FILE, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var getAthletesLookup = async () => {
  const fileContent = await s3.fetchFile(PUBLIC_BUCKET_FILES.athletes.lookup, true);
  if (!fileContent) return {};
  return JSON.parse(fileContent);
};
var updateAthletesLookup = async (athletesLookupTable, duplicates) => {
  await s3.writeFile(PUBLIC_BUCKET_FILES.athletes.lookup, JSON.stringify(athletesLookupTable));
  await s3.writeFile(DUPLICATE_ATHLETES_FILE, JSON.stringify(duplicates));
};

// ../bc-membership-importer/config.ts
var MEMBERSHIP_OUTPUT_PATH = `raw_bc_memberships/`;

// ../shared/data/bc-memberships.ts
var getRawBCMembershipDates = async () => {
  const { files } = await s3.fetchDirectoryFiles(MEMBERSHIP_OUTPUT_PATH);
  if (!files || files.length === 0) return [];
  return files.filter((f) => f.Key.endsWith(".json")).map((f) => {
    const filename = f.Key.replace(".json", "").split("/").pop();
    return filename.slice(0, 4) + "-" + filename.slice(4, 6) + "-" + filename.slice(6, 8);
  }).sort();
};
var getRawBCMembershipsForDate = async (date) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = date.replace(/-/g, "");
  }
  const filename = MEMBERSHIP_OUTPUT_PATH + `${date}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return {};
  return JSON.parse(fileContent);
};
var updateRawBCMemberships = async (rawMemberships, date) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = date.replace(/-/g, "");
  }
  const filename = MEMBERSHIP_OUTPUT_PATH + `${date}.json`;
  await s3.writeFile(filename, JSON.stringify(rawMemberships));
};

// ../shared/data/events.ts
var getEvents = async (filters, options = {}) => {
  if (!options?.summary && typeof options.summary === "undefined") options.summary = true;
  const yearStoredEventFiles = await loadEventsForYear(filters.year, options.summary);
  const eventHashes = filters.eventHashes || (filters.eventHash ? [filters.eventHash] : []);
  let filteredEventFiles = eventHashes.length ? yearStoredEventFiles.filter((file) => eventHashes.includes(file.hash)) : yearStoredEventFiles;
  if (filters.location) {
    filteredEventFiles = filteredEventFiles.filter((event) => event.location.country === filters.location.country && event.location.province === filters.location.province);
  }
  return filteredEventFiles;
};
var updateEvents = async (events, { year }) => {
  const eventsForYear = await loadEventsForYear(year);
  const eventFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`;
  const updatedEventHashes = events.map((e) => e.hash);
  const updatedEvents = [...eventsForYear.filter((e) => !updatedEventHashes.includes(e.hash)), ...events];
  await s3.writeFile(eventFilename, JSON.stringify(updatedEvents));
};
var getEventResults = async (eventHash, year) => {
  const filename = PUBLIC_BUCKET_PATHS.eventsResults + `${year}/${eventHash}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return void 0;
  return JSON.parse(fileContent);
};
var updateEventResults = async (eventResults, { year, eventHash }) => {
  const filename = PUBLIC_BUCKET_PATHS.eventsResults + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(eventResults));
};
var loadEventsForYear = async (year, summary = false) => {
  const eventFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`;
  const fileContent = await s3.fetchFile(eventFilename, true);
  if (!fileContent) return [];
  const events = JSON.parse(fileContent);
  const sortedEvents = sortBy_default(events, "date");
  if (!summary) return sortedEvents;
  return sortedEvents.map((event) => pick_default(event, [
    "hash",
    "year",
    "date",
    "provider",
    "name",
    "location",
    "sanctionedEventType",
    "discipline",
    "organizerAlias"
  ]));
};

// ../shared/data/ingestion.ts
var getRawIngestionData = async (provider, eventHash, year) => {
  const filename = RAW_INGESTION_DATA_PATH + `${provider}/${year}/${eventHash}.json`;
  const fileContent = await s3.fetchFile(filename);
  if (!fileContent) return {};
  return JSON.parse(fileContent);
};
var updateRawIngestionData = async (rawData, { provider, year, eventHash }) => {
  const filename = RAW_INGESTION_DATA_PATH + `${provider}/${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(rawData));
};
var getLastCheckDate = async (provider) => {
  const { files } = await s3.fetchDirectoryFiles(WATCHER_LAST_CHECKS_PATH);
  const lastProviderCheckDate = files.find((f) => f.Key.endsWith(`${provider}.json`))?.LastModified;
  return lastProviderCheckDate || null;
};
var updateLastCheckDate = async (provider, timestamp, extra) => {
  const payload = {
    watcher: provider,
    timestamp: timestamp.toISOString(),
    ...extra || {}
  };
  await s3.writeFile(`${WATCHER_LAST_CHECKS_PATH}${provider}.json`, JSON.stringify(payload));
};
var getEventDays = async () => {
  const currentYear3 = (/* @__PURE__ */ new Date()).getFullYear();
  const eventDaysJson = await s3.fetchFile(CONFIG_FILES.eventDays);
  if (!eventDaysJson) throw new Error("Event days file could not be found!");
  const allEventDays = JSON.parse(eventDaysJson);
  return allEventDays[currentYear3] || {};
};
var getRawEventAthletes = async (eventHash, year) => {
  const filename = PROCESSING_RAW_DATA_ATHLETES_PATH + `${year}/${eventHash}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var updateRawEventAthletes = async (eventAthletes, { year, eventHash }) => {
  const filename = PROCESSING_RAW_DATA_ATHLETES_PATH + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(eventAthletes));
};
var getRawAthletesRaceResults = async (eventHash, year) => {
  const filename = PROCESSING_RAW_DATA_RACE_RESULTS_PATH + `${year}/${eventHash}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var updateRawAthletesRaceResults = async (raceAthleteRaceResults, { year, eventHash }) => {
  const filename = PROCESSING_RAW_DATA_RACE_RESULTS_PATH + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(raceAthleteRaceResults));
};
var getRawAthletesUpgradePoints = async (eventHash, year) => {
  const filename = PROCESSING_RAW_DATA_UPGRADE_POINTS_PATH + `${year}/${eventHash}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var updateRawAthletesUpgradePoints = async (athleteUpgradePoints, { year, eventHash }) => {
  const filename = PROCESSING_RAW_DATA_UPGRADE_POINTS_PATH + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(athleteUpgradePoints));
};
var getRawAthletesTeams = async (year) => {
  const filename = PROCESSING_RAW_DATA_TEAMS_PATH + `${year}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return {};
  return JSON.parse(fileContent);
};
var updateRawAthletesTeams = async (athletesTeams, { year }) => {
  const filename = PROCESSING_RAW_DATA_TEAMS_PATH + `${year}.json`;
  await s3.writeFile(filename, JSON.stringify(athletesTeams));
};

// ../shared/data/series.ts
var updateSeries = async (series, { year }) => {
  const seriesForYear = await loadSeriesForYear(year);
  const eventFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`;
  const updatedSeriesHashes = series.map((e) => e.hash);
  const updatedSeries = [...seriesForYear.filter((e) => !updatedSeriesHashes.includes(e.hash)), ...series];
  await s3.writeFile(eventFilename, JSON.stringify(updatedSeries));
};
var updateSerieResults = async (serieResults, { year, eventHash }) => {
  const filename = PUBLIC_BUCKET_PATHS.seriesResults + `${year}/${eventHash}.json`;
  await s3.writeFile(filename, JSON.stringify(serieResults));
};
var loadSeriesForYear = async (year) => {
  const seriesFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`;
  const fileContent = await s3.fetchFile(seriesFilename, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};

// ../shared/data/teams.ts
var getTeams = async () => {
  const fileContent = await s3.fetchFile(PUBLIC_BUCKET_FILES.athletes.teams);
  if (!fileContent) return {};
  return JSON.parse(fileContent);
};

// ../shared/data/views.ts
var getViewAthletes = async () => {
  const fileContent = await s3.fetchFile(PUBLIC_BUCKET_FILES.athletes.list, true);
  if (!fileContent) return [];
  return JSON.parse(fileContent);
};
var updateViewAthletes = async (athletes) => {
  const existingAthletes = await getViewAthletes();
  const updatedAthleteUciIds = athletes.map((a) => a.uciId);
  const combinedAthletes = [
    ...existingAthletes.filter((a) => !updatedAthleteUciIds.includes(a.uciId)),
    ...athletes
  ];
  await s3.writeFile(PUBLIC_BUCKET_FILES.athletes.list, JSON.stringify(combinedAthletes));
};
var getAthleteProfile = async (athleteUciId) => {
  const filename = PUBLIC_BUCKET_PATHS.athletesProfiles + `${athleteUciId}.json`;
  const fileContent = await s3.fetchFile(filename, true);
  if (!fileContent) return null;
  return JSON.parse(fileContent);
};
var updateAthleteProfile = async (athleteProfile) => {
  const { uciId: athleteUciId } = athleteProfile;
  const filename = PUBLIC_BUCKET_PATHS.athletesProfiles + `${athleteUciId}.json`;
  await s3.writeFile(filename, JSON.stringify(athleteProfile));
};
var updateViewRecentlyUpgradedAthletes = async (athletes) => {
  await s3.writeFile(PUBLIC_BUCKET_FILES.views.recentlyUpgradedAthletes, JSON.stringify(athletes));
};

// ../shared/data.ts
var data_default = {
  get: {
    baseAthletes: getBaseAthletes,
    viewAthletes: getViewAthletes,
    athleteManualEdits: getAthleteManualEdits,
    athletesCategories: getAthletesCategories,
    athletesLookup: getAthletesLookup,
    athletesOverrides: getAthletesOverrides,
    athletesRacesResults: getAthletesRacesResults,
    athletesUpgradePoints: getAthletesUpgradePoints,
    athletesUpgradeDates: getAthletesUpgradeDates,
    athleteProfile: getAthleteProfile,
    events: getEvents,
    eventDays: getEventDays,
    eventResults: getEventResults,
    lastCheckDate: getLastCheckDate,
    rawBCMemberships: getRawBCMembershipsForDate,
    rawBCMembershipDates: getRawBCMembershipDates,
    rawEventAthletes: getRawEventAthletes,
    rawAthletesRaceResults: getRawAthletesRaceResults,
    rawAthletesTeams: getRawAthletesTeams,
    rawAthletesUpgradePoints: getRawAthletesUpgradePoints,
    rawIngestionData: getRawIngestionData,
    teams: getTeams
  },
  update: {
    baseAthletes: updateBaseAthletes,
    viewAthletes: updateViewAthletes,
    athleteManualEdits: updateAthleteManualEdits,
    athletesCategories: updateAthleteCategories,
    athletesLookup: updateAthletesLookup,
    athletesRacesResults: updateAthletesRacesResults,
    athletesUpgradePoints: updateAthletesUpgradePoints,
    athleteProfile: updateAthleteProfile,
    events: updateEvents,
    eventResults: updateEventResults,
    lastCheckDate: updateLastCheckDate,
    series: updateSeries,
    serieResults: updateSerieResults,
    rawBCMemberships: updateRawBCMemberships,
    rawEventAthletes: updateRawEventAthletes,
    rawAthletesRaceResults: updateRawAthletesRaceResults,
    rawAthletesTeams: updateRawAthletesTeams,
    rawAthletesUpgradePoints: updateRawAthletesUpgradePoints,
    rawIngestionData: updateRawIngestionData,
    viewRecentlyUpgradedAthletes: updateViewRecentlyUpgradedAthletes
  }
};

// ../shared/team-parser.ts
var TeamParserSingleton = class {
  constructor() {
    this._teams = {};
    this._teamsByNames = {};
    this._teamsByUniqueKeywords = {};
  }
  async init() {
    if (Object.keys(this._teams).length > 0) return;
    try {
      this._teams = await data_default.get.teams();
    } catch (error) {
      throw error;
    }
    const teamsByNames = {};
    const teamsByUniqueKeywords = {};
    Object.values(this._teams).forEach((team) => {
      teamsByNames[team.name.toLowerCase()] = team;
      if (team.alternateNames) {
        team.alternateNames.forEach((name) => {
          teamsByNames[name.toLowerCase()] = team;
        });
      }
      if (team.uniqueKeywords) {
        team.uniqueKeywords.forEach((keyword) => {
          teamsByUniqueKeywords[keyword.toLowerCase()] = team;
        });
      }
    });
    this._teamsByNames = teamsByNames;
    this._teamsByUniqueKeywords = teamsByUniqueKeywords;
  }
  getTeamByName(name) {
    const matchingTeam = this._teamsByNames[name.toLowerCase()];
    if (matchingTeam) return matchingTeam;
    return this.getTeamByKeyword(name);
  }
  parseTeamName(name) {
    if (!name) return;
    const formattedName = name.trim();
    const teamLower = formattedName.toLowerCase();
    if (["no team", "n/a", "independent", "independant", "unattached"].includes(teamLower)) return;
    const matchingTeam = this.getTeamByName(teamLower);
    if (matchingTeam) {
      return {
        id: matchingTeam.id,
        name: matchingTeam.name
      };
    }
    return { name: formattedName };
  }
  getTeamByKeyword(name) {
    const nameLower = name.toLowerCase();
    const matchingKeyword = Object.keys(this._teamsByUniqueKeywords).find((keyword) => nameLower.includes(keyword));
    return matchingKeyword ? this._teamsByUniqueKeywords[matchingKeyword] : void 0;
  }
};
var TeamParser = new TeamParserSingleton();

// utils.ts
var validateUCIId = (uciId) => {
  return !!uciId.match(/^\d{11}$/);
};

// ../shared/logger.ts
var import_colors = __toESM(require_lib());
var log = (level, message, context) => {
  const stringifiedMessage = JSON.stringify({
    "level": level.toUpperCase(),
    "time": (/* @__PURE__ */ new Date()).toISOString(),
    "msg": message,
    ...context || {}
  });
  if (level === "error") console[level](ENV === "dev" ? stringifiedMessage.red : stringifiedMessage);
  else if (level === "warn") console[level](ENV === "dev" ? stringifiedMessage.yellow : stringifiedMessage);
  else console[level](stringifiedMessage);
};
var Logger = class _Logger {
  constructor(context) {
    this._context = context;
  }
  info(message, context) {
    log("info", message, { ...this._context || {}, ...context || {} });
  }
  warn(message, context) {
    log("warn", message, { ...this._context || {}, ...context || {} });
  }
  error(message, context) {
    if (message instanceof Error) {
      const stack = message.stack ? message.stack.split("\n").slice(1).join("\n") : void 0;
      log("error", message.message, { stack, ...this._context || {}, ...context || {} });
    } else {
      const stack = context?.error && context.error instanceof Error ? context.error.stack?.split("\n").slice(1).join("\n") : void 0;
      log("error", message, { stack, ...this._context || {}, ...context || {} });
    }
  }
  child(context) {
    return new _Logger(context);
  }
};
var logger = new Logger();
var logger_default = logger;

// athletes/extract.ts
var logger2 = logger_default.child({ parser: SCRIPT_NAME });
var extractAthletes = async (options) => {
  logger2.info(`Extracting athletes for year ${options.year} with filters: ${JSON.stringify(options)}...`);
  const { allEventsAthletes, eventHashes } = await extractAllEventAthletes(options);
  await saveAllAthletes(allEventsAthletes, options.year);
  return { eventHashes };
};
var extractAllEventAthletes = async (options) => {
  const events = await data_default.get.events({ ...options, ...DEFAULT_EVENT_FILTERS });
  const promises = await Promise.allSettled(events.map(async (event) => extractEventAthletes(event)));
  const allEventsAthletes = {};
  let totalAthletesCount = 0;
  const eventHashes = [];
  promises.forEach((parseResult, i) => {
    if (parseResult.status === "fulfilled") {
      allEventsAthletes[events[i].hash] = parseResult.value;
      totalAthletesCount += parseResult.value.length;
      eventHashes.push(events[i].hash);
    } else {
      logger2.error(`Error while processing event athletes: ${parseResult.reason}`, {
        hash: events[i].hash,
        year: events[i].year,
        error: parseResult.reason
      });
    }
  });
  logger2.info(`Total athletes extracted (non-unique): ${totalAthletesCount}`);
  return { allEventsAthletes, eventHashes };
};
var extractEventAthletes = async (event) => {
  const eventResults = await data_default.get.eventResults(event.hash, event.year);
  if (!eventResults) {
    logger2.warn(`No results found for event ${event.hash} (${event.name} - ${event.date}), skipping athlete extraction`);
    return [];
  }
  const allAthletes = {};
  const eventYear = +event.date.substring(0, 4);
  Object.values(eventResults.athletes).forEach((eventAthlete) => {
    const {
      uciId,
      firstName,
      lastName,
      gender,
      city,
      province,
      license,
      age,
      nationality
    } = eventAthlete;
    if (!uciId) return;
    if (!validateUCIId(uciId)) {
      logger2.warn(`Invalid UCI ID format for athlete: ${uciId} (${firstName} ${lastName}), skipping`);
      return;
    }
    if (allAthletes[uciId]) {
      logger2.warn(`Duplicate athlete found: ${firstName} ${lastName} with UCI ID ${uciId}, skipping`);
      return;
    }
    if (!firstName || !lastName) {
      logger2.warn("Missing first or last name for athlete", { eventAthlete });
      return;
    }
    const processedLicense = license?.trim()?.toUpperCase();
    const validLicense = processedLicense && processedLicense !== "TEMP" ? processedLicense : null;
    const validGender = gender && [
      "M",
      "F",
      "X"
    ].includes(gender.toUpperCase()) ? gender.toUpperCase() : void 0;
    allAthletes[uciId] = {
      uciId,
      firstName: capitalize(firstName),
      lastName: capitalize(lastName),
      gender: validGender,
      city: capitalize(city),
      province: formatProvince(province),
      birthYear: age ? eventYear - age : void 0,
      licenses: validLicense ? { [eventYear]: [validLicense] } : {},
      nationality: nationality?.trim()?.toUpperCase(),
      lastUpdated: event.date
    };
  });
  if (DEBUG) logger2.info(`${event.hash} - ${event.name} (${event.date}): ${Object.keys(allAthletes).length || 0} athletes found`);
  return Object.values(allAthletes);
};
var saveAllAthletes = async (allEventsAthletes, year) => {
  const promises = await Promise.allSettled(
    Object.entries(allEventsAthletes).map(
      ([eventHash, athletes]) => data_default.update.rawEventAthletes(athletes, { eventHash, year })
    )
  );
  promises.forEach((result, i) => {
    const eventHash = Object.keys(allEventsAthletes)[i];
    const athletes = allEventsAthletes[eventHash];
    if (result.status === "fulfilled") {
      logger2.info(`Saved ${athletes.length} raw athletes data for event ${eventHash}`);
    } else {
      logger2.error(`Error while saving raw athletes: ${result.reason}`, {
        hash: eventHash,
        year,
        error: result.reason
      });
    }
  });
};

// node_modules/lodash-es/_freeGlobal.js
var freeGlobal2 = typeof global == "object" && global && global.Object === Object && global;
var freeGlobal_default2 = freeGlobal2;

// node_modules/lodash-es/_root.js
var freeSelf2 = typeof self == "object" && self && self.Object === Object && self;
var root2 = freeGlobal_default2 || freeSelf2 || Function("return this")();
var root_default2 = root2;

// node_modules/lodash-es/_Symbol.js
var Symbol3 = root_default2.Symbol;
var Symbol_default2 = Symbol3;

// node_modules/lodash-es/_getRawTag.js
var objectProto14 = Object.prototype;
var hasOwnProperty11 = objectProto14.hasOwnProperty;
var nativeObjectToString3 = objectProto14.toString;
var symToStringTag3 = Symbol_default2 ? Symbol_default2.toStringTag : void 0;
function getRawTag2(value) {
  var isOwn = hasOwnProperty11.call(value, symToStringTag3), tag = value[symToStringTag3];
  try {
    value[symToStringTag3] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString3.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag3] = tag;
    } else {
      delete value[symToStringTag3];
    }
  }
  return result;
}
var getRawTag_default2 = getRawTag2;

// node_modules/lodash-es/_objectToString.js
var objectProto15 = Object.prototype;
var nativeObjectToString4 = objectProto15.toString;
function objectToString2(value) {
  return nativeObjectToString4.call(value);
}
var objectToString_default2 = objectToString2;

// node_modules/lodash-es/_baseGetTag.js
var nullTag2 = "[object Null]";
var undefinedTag2 = "[object Undefined]";
var symToStringTag4 = Symbol_default2 ? Symbol_default2.toStringTag : void 0;
function baseGetTag2(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag2 : nullTag2;
  }
  return symToStringTag4 && symToStringTag4 in Object(value) ? getRawTag_default2(value) : objectToString_default2(value);
}
var baseGetTag_default2 = baseGetTag2;

// node_modules/lodash-es/isObjectLike.js
function isObjectLike2(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default2 = isObjectLike2;

// node_modules/lodash-es/isSymbol.js
var symbolTag3 = "[object Symbol]";
function isSymbol2(value) {
  return typeof value == "symbol" || isObjectLike_default2(value) && baseGetTag_default2(value) == symbolTag3;
}
var isSymbol_default2 = isSymbol2;

// node_modules/lodash-es/_arrayMap.js
function arrayMap2(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length, result = Array(length);
  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}
var arrayMap_default2 = arrayMap2;

// node_modules/lodash-es/isArray.js
var isArray2 = Array.isArray;
var isArray_default2 = isArray2;

// node_modules/lodash-es/_baseToString.js
var INFINITY3 = 1 / 0;
var symbolProto3 = Symbol_default2 ? Symbol_default2.prototype : void 0;
var symbolToString2 = symbolProto3 ? symbolProto3.toString : void 0;
function baseToString2(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray_default2(value)) {
    return arrayMap_default2(value, baseToString2) + "";
  }
  if (isSymbol_default2(value)) {
    return symbolToString2 ? symbolToString2.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY3 ? "-0" : result;
}
var baseToString_default2 = baseToString2;

// node_modules/lodash-es/isObject.js
function isObject2(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_default2 = isObject2;

// node_modules/lodash-es/identity.js
function identity2(value) {
  return value;
}
var identity_default2 = identity2;

// node_modules/lodash-es/isFunction.js
var asyncTag2 = "[object AsyncFunction]";
var funcTag3 = "[object Function]";
var genTag2 = "[object GeneratorFunction]";
var proxyTag2 = "[object Proxy]";
function isFunction2(value) {
  if (!isObject_default2(value)) {
    return false;
  }
  var tag = baseGetTag_default2(value);
  return tag == funcTag3 || tag == genTag2 || tag == asyncTag2 || tag == proxyTag2;
}
var isFunction_default2 = isFunction2;

// node_modules/lodash-es/_coreJsData.js
var coreJsData2 = root_default2["__core-js_shared__"];
var coreJsData_default2 = coreJsData2;

// node_modules/lodash-es/_isMasked.js
var maskSrcKey2 = (function() {
  var uid = /[^.]+$/.exec(coreJsData_default2 && coreJsData_default2.keys && coreJsData_default2.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
})();
function isMasked2(func) {
  return !!maskSrcKey2 && maskSrcKey2 in func;
}
var isMasked_default2 = isMasked2;

// node_modules/lodash-es/_toSource.js
var funcProto3 = Function.prototype;
var funcToString3 = funcProto3.toString;
function toSource2(func) {
  if (func != null) {
    try {
      return funcToString3.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var toSource_default2 = toSource2;

// node_modules/lodash-es/_baseIsNative.js
var reRegExpChar2 = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor2 = /^\[object .+?Constructor\]$/;
var funcProto4 = Function.prototype;
var objectProto16 = Object.prototype;
var funcToString4 = funcProto4.toString;
var hasOwnProperty12 = objectProto16.hasOwnProperty;
var reIsNative2 = RegExp(
  "^" + funcToString4.call(hasOwnProperty12).replace(reRegExpChar2, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative2(value) {
  if (!isObject_default2(value) || isMasked_default2(value)) {
    return false;
  }
  var pattern = isFunction_default2(value) ? reIsNative2 : reIsHostCtor2;
  return pattern.test(toSource_default2(value));
}
var baseIsNative_default2 = baseIsNative2;

// node_modules/lodash-es/_getValue.js
function getValue2(object, key) {
  return object == null ? void 0 : object[key];
}
var getValue_default2 = getValue2;

// node_modules/lodash-es/_getNative.js
function getNative2(object, key) {
  var value = getValue_default2(object, key);
  return baseIsNative_default2(value) ? value : void 0;
}
var getNative_default2 = getNative2;

// node_modules/lodash-es/_WeakMap.js
var WeakMap2 = getNative_default2(root_default2, "WeakMap");
var WeakMap_default2 = WeakMap2;

// node_modules/lodash-es/_baseCreate.js
var objectCreate = Object.create;
var baseCreate = /* @__PURE__ */ (function() {
  function object() {
  }
  return function(proto) {
    if (!isObject_default2(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = void 0;
    return result;
  };
})();
var baseCreate_default = baseCreate;

// node_modules/lodash-es/_apply.js
function apply2(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var apply_default2 = apply2;

// node_modules/lodash-es/_copyArray.js
function copyArray(source, array) {
  var index = -1, length = source.length;
  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}
var copyArray_default = copyArray;

// node_modules/lodash-es/_shortOut.js
var HOT_COUNT2 = 800;
var HOT_SPAN2 = 16;
var nativeNow2 = Date.now;
function shortOut2(func) {
  var count = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow2(), remaining = HOT_SPAN2 - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT2) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
var shortOut_default2 = shortOut2;

// node_modules/lodash-es/constant.js
function constant2(value) {
  return function() {
    return value;
  };
}
var constant_default2 = constant2;

// node_modules/lodash-es/_defineProperty.js
var defineProperty2 = (function() {
  try {
    var func = getNative_default2(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
})();
var defineProperty_default2 = defineProperty2;

// node_modules/lodash-es/_baseSetToString.js
var baseSetToString2 = !defineProperty_default2 ? identity_default2 : function(func, string) {
  return defineProperty_default2(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant_default2(string),
    "writable": true
  });
};
var baseSetToString_default2 = baseSetToString2;

// node_modules/lodash-es/_setToString.js
var setToString2 = shortOut_default2(baseSetToString_default2);
var setToString_default2 = setToString2;

// node_modules/lodash-es/_arrayEach.js
function arrayEach(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}
var arrayEach_default = arrayEach;

// node_modules/lodash-es/_isIndex.js
var MAX_SAFE_INTEGER3 = 9007199254740991;
var reIsUint2 = /^(?:0|[1-9]\d*)$/;
function isIndex2(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER3 : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint2.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var isIndex_default2 = isIndex2;

// node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue2(object, key, value) {
  if (key == "__proto__" && defineProperty_default2) {
    defineProperty_default2(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
var baseAssignValue_default2 = baseAssignValue2;

// node_modules/lodash-es/eq.js
function eq2(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_default2 = eq2;

// node_modules/lodash-es/_assignValue.js
var objectProto17 = Object.prototype;
var hasOwnProperty13 = objectProto17.hasOwnProperty;
function assignValue2(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty13.call(object, key) && eq_default2(objValue, value)) || value === void 0 && !(key in object)) {
    baseAssignValue_default2(object, key, value);
  }
}
var assignValue_default2 = assignValue2;

// node_modules/lodash-es/_copyObject.js
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index = -1, length = props.length;
  while (++index < length) {
    var key = props[index];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
    if (newValue === void 0) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue_default2(object, key, newValue);
    } else {
      assignValue_default2(object, key, newValue);
    }
  }
  return object;
}
var copyObject_default = copyObject;

// node_modules/lodash-es/_overRest.js
var nativeMax2 = Math.max;
function overRest2(func, start, transform) {
  start = nativeMax2(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax2(args.length - start, 0), array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply_default2(func, this, otherArgs);
  };
}
var overRest_default2 = overRest2;

// node_modules/lodash-es/isLength.js
var MAX_SAFE_INTEGER4 = 9007199254740991;
function isLength2(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER4;
}
var isLength_default2 = isLength2;

// node_modules/lodash-es/isArrayLike.js
function isArrayLike2(value) {
  return value != null && isLength_default2(value.length) && !isFunction_default2(value);
}
var isArrayLike_default2 = isArrayLike2;

// node_modules/lodash-es/_isPrototype.js
var objectProto18 = Object.prototype;
function isPrototype2(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto18;
  return value === proto;
}
var isPrototype_default2 = isPrototype2;

// node_modules/lodash-es/_baseTimes.js
function baseTimes2(n, iteratee) {
  var index = -1, result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var baseTimes_default2 = baseTimes2;

// node_modules/lodash-es/_baseIsArguments.js
var argsTag4 = "[object Arguments]";
function baseIsArguments2(value) {
  return isObjectLike_default2(value) && baseGetTag_default2(value) == argsTag4;
}
var baseIsArguments_default2 = baseIsArguments2;

// node_modules/lodash-es/isArguments.js
var objectProto19 = Object.prototype;
var hasOwnProperty14 = objectProto19.hasOwnProperty;
var propertyIsEnumerable3 = objectProto19.propertyIsEnumerable;
var isArguments2 = baseIsArguments_default2(/* @__PURE__ */ (function() {
  return arguments;
})()) ? baseIsArguments_default2 : function(value) {
  return isObjectLike_default2(value) && hasOwnProperty14.call(value, "callee") && !propertyIsEnumerable3.call(value, "callee");
};
var isArguments_default2 = isArguments2;

// node_modules/lodash-es/stubFalse.js
function stubFalse2() {
  return false;
}
var stubFalse_default2 = stubFalse2;

// node_modules/lodash-es/isBuffer.js
var freeExports3 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule3 = freeExports3 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports3 = freeModule3 && freeModule3.exports === freeExports3;
var Buffer3 = moduleExports3 ? root_default2.Buffer : void 0;
var nativeIsBuffer2 = Buffer3 ? Buffer3.isBuffer : void 0;
var isBuffer2 = nativeIsBuffer2 || stubFalse_default2;
var isBuffer_default2 = isBuffer2;

// node_modules/lodash-es/_baseIsTypedArray.js
var argsTag5 = "[object Arguments]";
var arrayTag3 = "[object Array]";
var boolTag3 = "[object Boolean]";
var dateTag3 = "[object Date]";
var errorTag3 = "[object Error]";
var funcTag4 = "[object Function]";
var mapTag4 = "[object Map]";
var numberTag3 = "[object Number]";
var objectTag4 = "[object Object]";
var regexpTag3 = "[object RegExp]";
var setTag4 = "[object Set]";
var stringTag3 = "[object String]";
var weakMapTag3 = "[object WeakMap]";
var arrayBufferTag3 = "[object ArrayBuffer]";
var dataViewTag4 = "[object DataView]";
var float32Tag2 = "[object Float32Array]";
var float64Tag2 = "[object Float64Array]";
var int8Tag2 = "[object Int8Array]";
var int16Tag2 = "[object Int16Array]";
var int32Tag2 = "[object Int32Array]";
var uint8Tag2 = "[object Uint8Array]";
var uint8ClampedTag2 = "[object Uint8ClampedArray]";
var uint16Tag2 = "[object Uint16Array]";
var uint32Tag2 = "[object Uint32Array]";
var typedArrayTags2 = {};
typedArrayTags2[float32Tag2] = typedArrayTags2[float64Tag2] = typedArrayTags2[int8Tag2] = typedArrayTags2[int16Tag2] = typedArrayTags2[int32Tag2] = typedArrayTags2[uint8Tag2] = typedArrayTags2[uint8ClampedTag2] = typedArrayTags2[uint16Tag2] = typedArrayTags2[uint32Tag2] = true;
typedArrayTags2[argsTag5] = typedArrayTags2[arrayTag3] = typedArrayTags2[arrayBufferTag3] = typedArrayTags2[boolTag3] = typedArrayTags2[dataViewTag4] = typedArrayTags2[dateTag3] = typedArrayTags2[errorTag3] = typedArrayTags2[funcTag4] = typedArrayTags2[mapTag4] = typedArrayTags2[numberTag3] = typedArrayTags2[objectTag4] = typedArrayTags2[regexpTag3] = typedArrayTags2[setTag4] = typedArrayTags2[stringTag3] = typedArrayTags2[weakMapTag3] = false;
function baseIsTypedArray2(value) {
  return isObjectLike_default2(value) && isLength_default2(value.length) && !!typedArrayTags2[baseGetTag_default2(value)];
}
var baseIsTypedArray_default2 = baseIsTypedArray2;

// node_modules/lodash-es/_baseUnary.js
function baseUnary2(func) {
  return function(value) {
    return func(value);
  };
}
var baseUnary_default2 = baseUnary2;

// node_modules/lodash-es/_nodeUtil.js
var freeExports4 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule4 = freeExports4 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports4 = freeModule4 && freeModule4.exports === freeExports4;
var freeProcess2 = moduleExports4 && freeGlobal_default2.process;
var nodeUtil2 = (function() {
  try {
    var types = freeModule4 && freeModule4.require && freeModule4.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess2 && freeProcess2.binding && freeProcess2.binding("util");
  } catch (e) {
  }
})();
var nodeUtil_default2 = nodeUtil2;

// node_modules/lodash-es/isTypedArray.js
var nodeIsTypedArray2 = nodeUtil_default2 && nodeUtil_default2.isTypedArray;
var isTypedArray2 = nodeIsTypedArray2 ? baseUnary_default2(nodeIsTypedArray2) : baseIsTypedArray_default2;
var isTypedArray_default2 = isTypedArray2;

// node_modules/lodash-es/_arrayLikeKeys.js
var objectProto20 = Object.prototype;
var hasOwnProperty15 = objectProto20.hasOwnProperty;
function arrayLikeKeys2(value, inherited) {
  var isArr = isArray_default2(value), isArg = !isArr && isArguments_default2(value), isBuff = !isArr && !isArg && isBuffer_default2(value), isType = !isArr && !isArg && !isBuff && isTypedArray_default2(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes_default2(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty15.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex_default2(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var arrayLikeKeys_default2 = arrayLikeKeys2;

// node_modules/lodash-es/_overArg.js
function overArg2(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var overArg_default2 = overArg2;

// node_modules/lodash-es/_nativeKeys.js
var nativeKeys2 = overArg_default2(Object.keys, Object);
var nativeKeys_default2 = nativeKeys2;

// node_modules/lodash-es/_baseKeys.js
var objectProto21 = Object.prototype;
var hasOwnProperty16 = objectProto21.hasOwnProperty;
function baseKeys2(object) {
  if (!isPrototype_default2(object)) {
    return nativeKeys_default2(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty16.call(object, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
var baseKeys_default2 = baseKeys2;

// node_modules/lodash-es/keys.js
function keys2(object) {
  return isArrayLike_default2(object) ? arrayLikeKeys_default2(object) : baseKeys_default2(object);
}
var keys_default2 = keys2;

// node_modules/lodash-es/_nativeKeysIn.js
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
var nativeKeysIn_default = nativeKeysIn;

// node_modules/lodash-es/_baseKeysIn.js
var objectProto22 = Object.prototype;
var hasOwnProperty17 = objectProto22.hasOwnProperty;
function baseKeysIn(object) {
  if (!isObject_default2(object)) {
    return nativeKeysIn_default(object);
  }
  var isProto = isPrototype_default2(object), result = [];
  for (var key in object) {
    if (!(key == "constructor" && (isProto || !hasOwnProperty17.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}
var baseKeysIn_default = baseKeysIn;

// node_modules/lodash-es/keysIn.js
function keysIn(object) {
  return isArrayLike_default2(object) ? arrayLikeKeys_default2(object, true) : baseKeysIn_default(object);
}
var keysIn_default = keysIn;

// node_modules/lodash-es/_isKey.js
var reIsDeepProp2 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp2 = /^\w*$/;
function isKey2(value, object) {
  if (isArray_default2(value)) {
    return false;
  }
  var type = typeof value;
  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol_default2(value)) {
    return true;
  }
  return reIsPlainProp2.test(value) || !reIsDeepProp2.test(value) || object != null && value in Object(object);
}
var isKey_default2 = isKey2;

// node_modules/lodash-es/_nativeCreate.js
var nativeCreate2 = getNative_default2(Object, "create");
var nativeCreate_default2 = nativeCreate2;

// node_modules/lodash-es/_hashClear.js
function hashClear2() {
  this.__data__ = nativeCreate_default2 ? nativeCreate_default2(null) : {};
  this.size = 0;
}
var hashClear_default2 = hashClear2;

// node_modules/lodash-es/_hashDelete.js
function hashDelete2(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var hashDelete_default2 = hashDelete2;

// node_modules/lodash-es/_hashGet.js
var HASH_UNDEFINED4 = "__lodash_hash_undefined__";
var objectProto23 = Object.prototype;
var hasOwnProperty18 = objectProto23.hasOwnProperty;
function hashGet2(key) {
  var data = this.__data__;
  if (nativeCreate_default2) {
    var result = data[key];
    return result === HASH_UNDEFINED4 ? void 0 : result;
  }
  return hasOwnProperty18.call(data, key) ? data[key] : void 0;
}
var hashGet_default2 = hashGet2;

// node_modules/lodash-es/_hashHas.js
var objectProto24 = Object.prototype;
var hasOwnProperty19 = objectProto24.hasOwnProperty;
function hashHas2(key) {
  var data = this.__data__;
  return nativeCreate_default2 ? data[key] !== void 0 : hasOwnProperty19.call(data, key);
}
var hashHas_default2 = hashHas2;

// node_modules/lodash-es/_hashSet.js
var HASH_UNDEFINED5 = "__lodash_hash_undefined__";
function hashSet2(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate_default2 && value === void 0 ? HASH_UNDEFINED5 : value;
  return this;
}
var hashSet_default2 = hashSet2;

// node_modules/lodash-es/_Hash.js
function Hash2(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
Hash2.prototype.clear = hashClear_default2;
Hash2.prototype["delete"] = hashDelete_default2;
Hash2.prototype.get = hashGet_default2;
Hash2.prototype.has = hashHas_default2;
Hash2.prototype.set = hashSet_default2;
var Hash_default2 = Hash2;

// node_modules/lodash-es/_listCacheClear.js
function listCacheClear2() {
  this.__data__ = [];
  this.size = 0;
}
var listCacheClear_default2 = listCacheClear2;

// node_modules/lodash-es/_assocIndexOf.js
function assocIndexOf2(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_default2(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var assocIndexOf_default2 = assocIndexOf2;

// node_modules/lodash-es/_listCacheDelete.js
var arrayProto2 = Array.prototype;
var splice2 = arrayProto2.splice;
function listCacheDelete2(key) {
  var data = this.__data__, index = assocIndexOf_default2(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice2.call(data, index, 1);
  }
  --this.size;
  return true;
}
var listCacheDelete_default2 = listCacheDelete2;

// node_modules/lodash-es/_listCacheGet.js
function listCacheGet2(key) {
  var data = this.__data__, index = assocIndexOf_default2(data, key);
  return index < 0 ? void 0 : data[index][1];
}
var listCacheGet_default2 = listCacheGet2;

// node_modules/lodash-es/_listCacheHas.js
function listCacheHas2(key) {
  return assocIndexOf_default2(this.__data__, key) > -1;
}
var listCacheHas_default2 = listCacheHas2;

// node_modules/lodash-es/_listCacheSet.js
function listCacheSet2(key, value) {
  var data = this.__data__, index = assocIndexOf_default2(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
var listCacheSet_default2 = listCacheSet2;

// node_modules/lodash-es/_ListCache.js
function ListCache2(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache2.prototype.clear = listCacheClear_default2;
ListCache2.prototype["delete"] = listCacheDelete_default2;
ListCache2.prototype.get = listCacheGet_default2;
ListCache2.prototype.has = listCacheHas_default2;
ListCache2.prototype.set = listCacheSet_default2;
var ListCache_default2 = ListCache2;

// node_modules/lodash-es/_Map.js
var Map2 = getNative_default2(root_default2, "Map");
var Map_default2 = Map2;

// node_modules/lodash-es/_mapCacheClear.js
function mapCacheClear2() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash_default2(),
    "map": new (Map_default2 || ListCache_default2)(),
    "string": new Hash_default2()
  };
}
var mapCacheClear_default2 = mapCacheClear2;

// node_modules/lodash-es/_isKeyable.js
function isKeyable2(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
var isKeyable_default2 = isKeyable2;

// node_modules/lodash-es/_getMapData.js
function getMapData2(map, key) {
  var data = map.__data__;
  return isKeyable_default2(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var getMapData_default2 = getMapData2;

// node_modules/lodash-es/_mapCacheDelete.js
function mapCacheDelete2(key) {
  var result = getMapData_default2(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var mapCacheDelete_default2 = mapCacheDelete2;

// node_modules/lodash-es/_mapCacheGet.js
function mapCacheGet2(key) {
  return getMapData_default2(this, key).get(key);
}
var mapCacheGet_default2 = mapCacheGet2;

// node_modules/lodash-es/_mapCacheHas.js
function mapCacheHas2(key) {
  return getMapData_default2(this, key).has(key);
}
var mapCacheHas_default2 = mapCacheHas2;

// node_modules/lodash-es/_mapCacheSet.js
function mapCacheSet2(key, value) {
  var data = getMapData_default2(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
var mapCacheSet_default2 = mapCacheSet2;

// node_modules/lodash-es/_MapCache.js
function MapCache2(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache2.prototype.clear = mapCacheClear_default2;
MapCache2.prototype["delete"] = mapCacheDelete_default2;
MapCache2.prototype.get = mapCacheGet_default2;
MapCache2.prototype.has = mapCacheHas_default2;
MapCache2.prototype.set = mapCacheSet_default2;
var MapCache_default2 = MapCache2;

// node_modules/lodash-es/memoize.js
var FUNC_ERROR_TEXT2 = "Expected a function";
function memoize2(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT2);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize2.Cache || MapCache_default2)();
  return memoized;
}
memoize2.Cache = MapCache_default2;
var memoize_default2 = memoize2;

// node_modules/lodash-es/_memoizeCapped.js
var MAX_MEMOIZE_SIZE2 = 500;
function memoizeCapped2(func) {
  var result = memoize_default2(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE2) {
      cache.clear();
    }
    return key;
  });
  var cache = result.cache;
  return result;
}
var memoizeCapped_default2 = memoizeCapped2;

// node_modules/lodash-es/_stringToPath.js
var rePropName2 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar2 = /\\(\\)?/g;
var stringToPath2 = memoizeCapped_default2(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46) {
    result.push("");
  }
  string.replace(rePropName2, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar2, "$1") : number || match);
  });
  return result;
});
var stringToPath_default2 = stringToPath2;

// node_modules/lodash-es/toString.js
function toString2(value) {
  return value == null ? "" : baseToString_default2(value);
}
var toString_default2 = toString2;

// node_modules/lodash-es/_castPath.js
function castPath2(value, object) {
  if (isArray_default2(value)) {
    return value;
  }
  return isKey_default2(value, object) ? [value] : stringToPath_default2(toString_default2(value));
}
var castPath_default2 = castPath2;

// node_modules/lodash-es/_toKey.js
var INFINITY4 = 1 / 0;
function toKey2(value) {
  if (typeof value == "string" || isSymbol_default2(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY4 ? "-0" : result;
}
var toKey_default2 = toKey2;

// node_modules/lodash-es/_baseGet.js
function baseGet2(object, path) {
  path = castPath_default2(path, object);
  var index = 0, length = path.length;
  while (object != null && index < length) {
    object = object[toKey_default2(path[index++])];
  }
  return index && index == length ? object : void 0;
}
var baseGet_default2 = baseGet2;

// node_modules/lodash-es/get.js
function get2(object, path, defaultValue) {
  var result = object == null ? void 0 : baseGet_default2(object, path);
  return result === void 0 ? defaultValue : result;
}
var get_default2 = get2;

// node_modules/lodash-es/_arrayPush.js
function arrayPush2(array, values) {
  var index = -1, length = values.length, offset = array.length;
  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}
var arrayPush_default2 = arrayPush2;

// node_modules/lodash-es/_isFlattenable.js
var spreadableSymbol2 = Symbol_default2 ? Symbol_default2.isConcatSpreadable : void 0;
function isFlattenable2(value) {
  return isArray_default2(value) || isArguments_default2(value) || !!(spreadableSymbol2 && value && value[spreadableSymbol2]);
}
var isFlattenable_default2 = isFlattenable2;

// node_modules/lodash-es/_baseFlatten.js
function baseFlatten2(array, depth, predicate, isStrict, result) {
  var index = -1, length = array.length;
  predicate || (predicate = isFlattenable_default2);
  result || (result = []);
  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten2(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush_default2(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}
var baseFlatten_default2 = baseFlatten2;

// node_modules/lodash-es/flatten.js
function flatten2(array) {
  var length = array == null ? 0 : array.length;
  return length ? baseFlatten_default2(array, 1) : [];
}
var flatten_default2 = flatten2;

// node_modules/lodash-es/_flatRest.js
function flatRest2(func) {
  return setToString_default2(overRest_default2(func, void 0, flatten_default2), func + "");
}
var flatRest_default2 = flatRest2;

// node_modules/lodash-es/_getPrototype.js
var getPrototype = overArg_default2(Object.getPrototypeOf, Object);
var getPrototype_default = getPrototype;

// node_modules/lodash-es/isPlainObject.js
var objectTag5 = "[object Object]";
var funcProto5 = Function.prototype;
var objectProto25 = Object.prototype;
var funcToString5 = funcProto5.toString;
var hasOwnProperty20 = objectProto25.hasOwnProperty;
var objectCtorString = funcToString5.call(Object);
function isPlainObject(value) {
  if (!isObjectLike_default2(value) || baseGetTag_default2(value) != objectTag5) {
    return false;
  }
  var proto = getPrototype_default(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty20.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString5.call(Ctor) == objectCtorString;
}
var isPlainObject_default = isPlainObject;

// node_modules/lodash-es/_baseSlice.js
function baseSlice(array, start, end) {
  var index = -1, length = array.length;
  if (start < 0) {
    start = -start > length ? 0 : length + start;
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : end - start >>> 0;
  start >>>= 0;
  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}
var baseSlice_default = baseSlice;

// node_modules/lodash-es/_stackClear.js
function stackClear2() {
  this.__data__ = new ListCache_default2();
  this.size = 0;
}
var stackClear_default2 = stackClear2;

// node_modules/lodash-es/_stackDelete.js
function stackDelete2(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var stackDelete_default2 = stackDelete2;

// node_modules/lodash-es/_stackGet.js
function stackGet2(key) {
  return this.__data__.get(key);
}
var stackGet_default2 = stackGet2;

// node_modules/lodash-es/_stackHas.js
function stackHas2(key) {
  return this.__data__.has(key);
}
var stackHas_default2 = stackHas2;

// node_modules/lodash-es/_stackSet.js
var LARGE_ARRAY_SIZE2 = 200;
function stackSet2(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache_default2) {
    var pairs = data.__data__;
    if (!Map_default2 || pairs.length < LARGE_ARRAY_SIZE2 - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache_default2(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var stackSet_default2 = stackSet2;

// node_modules/lodash-es/_Stack.js
function Stack2(entries) {
  var data = this.__data__ = new ListCache_default2(entries);
  this.size = data.size;
}
Stack2.prototype.clear = stackClear_default2;
Stack2.prototype["delete"] = stackDelete_default2;
Stack2.prototype.get = stackGet_default2;
Stack2.prototype.has = stackHas_default2;
Stack2.prototype.set = stackSet_default2;
var Stack_default2 = Stack2;

// node_modules/lodash-es/_baseAssign.js
function baseAssign(object, source) {
  return object && copyObject_default(source, keys_default2(source), object);
}
var baseAssign_default = baseAssign;

// node_modules/lodash-es/_baseAssignIn.js
function baseAssignIn(object, source) {
  return object && copyObject_default(source, keysIn_default(source), object);
}
var baseAssignIn_default = baseAssignIn;

// node_modules/lodash-es/_cloneBuffer.js
var freeExports5 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule5 = freeExports5 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports5 = freeModule5 && freeModule5.exports === freeExports5;
var Buffer4 = moduleExports5 ? root_default2.Buffer : void 0;
var allocUnsafe = Buffer4 ? Buffer4.allocUnsafe : void 0;
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
  buffer.copy(result);
  return result;
}
var cloneBuffer_default = cloneBuffer;

// node_modules/lodash-es/_arrayFilter.js
function arrayFilter2(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var arrayFilter_default2 = arrayFilter2;

// node_modules/lodash-es/stubArray.js
function stubArray2() {
  return [];
}
var stubArray_default2 = stubArray2;

// node_modules/lodash-es/_getSymbols.js
var objectProto26 = Object.prototype;
var propertyIsEnumerable4 = objectProto26.propertyIsEnumerable;
var nativeGetSymbols2 = Object.getOwnPropertySymbols;
var getSymbols2 = !nativeGetSymbols2 ? stubArray_default2 : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter_default2(nativeGetSymbols2(object), function(symbol) {
    return propertyIsEnumerable4.call(object, symbol);
  });
};
var getSymbols_default2 = getSymbols2;

// node_modules/lodash-es/_copySymbols.js
function copySymbols(source, object) {
  return copyObject_default(source, getSymbols_default2(source), object);
}
var copySymbols_default = copySymbols;

// node_modules/lodash-es/_getSymbolsIn.js
var nativeGetSymbols3 = Object.getOwnPropertySymbols;
var getSymbolsIn = !nativeGetSymbols3 ? stubArray_default2 : function(object) {
  var result = [];
  while (object) {
    arrayPush_default2(result, getSymbols_default2(object));
    object = getPrototype_default(object);
  }
  return result;
};
var getSymbolsIn_default = getSymbolsIn;

// node_modules/lodash-es/_copySymbolsIn.js
function copySymbolsIn(source, object) {
  return copyObject_default(source, getSymbolsIn_default(source), object);
}
var copySymbolsIn_default = copySymbolsIn;

// node_modules/lodash-es/_baseGetAllKeys.js
function baseGetAllKeys2(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_default2(object) ? result : arrayPush_default2(result, symbolsFunc(object));
}
var baseGetAllKeys_default2 = baseGetAllKeys2;

// node_modules/lodash-es/_getAllKeys.js
function getAllKeys2(object) {
  return baseGetAllKeys_default2(object, keys_default2, getSymbols_default2);
}
var getAllKeys_default2 = getAllKeys2;

// node_modules/lodash-es/_getAllKeysIn.js
function getAllKeysIn(object) {
  return baseGetAllKeys_default2(object, keysIn_default, getSymbolsIn_default);
}
var getAllKeysIn_default = getAllKeysIn;

// node_modules/lodash-es/_DataView.js
var DataView2 = getNative_default2(root_default2, "DataView");
var DataView_default2 = DataView2;

// node_modules/lodash-es/_Promise.js
var Promise3 = getNative_default2(root_default2, "Promise");
var Promise_default2 = Promise3;

// node_modules/lodash-es/_Set.js
var Set3 = getNative_default2(root_default2, "Set");
var Set_default2 = Set3;

// node_modules/lodash-es/_getTag.js
var mapTag5 = "[object Map]";
var objectTag6 = "[object Object]";
var promiseTag2 = "[object Promise]";
var setTag5 = "[object Set]";
var weakMapTag4 = "[object WeakMap]";
var dataViewTag5 = "[object DataView]";
var dataViewCtorString2 = toSource_default2(DataView_default2);
var mapCtorString2 = toSource_default2(Map_default2);
var promiseCtorString2 = toSource_default2(Promise_default2);
var setCtorString2 = toSource_default2(Set_default2);
var weakMapCtorString2 = toSource_default2(WeakMap_default2);
var getTag2 = baseGetTag_default2;
if (DataView_default2 && getTag2(new DataView_default2(new ArrayBuffer(1))) != dataViewTag5 || Map_default2 && getTag2(new Map_default2()) != mapTag5 || Promise_default2 && getTag2(Promise_default2.resolve()) != promiseTag2 || Set_default2 && getTag2(new Set_default2()) != setTag5 || WeakMap_default2 && getTag2(new WeakMap_default2()) != weakMapTag4) {
  getTag2 = function(value) {
    var result = baseGetTag_default2(value), Ctor = result == objectTag6 ? value.constructor : void 0, ctorString = Ctor ? toSource_default2(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString2:
          return dataViewTag5;
        case mapCtorString2:
          return mapTag5;
        case promiseCtorString2:
          return promiseTag2;
        case setCtorString2:
          return setTag5;
        case weakMapCtorString2:
          return weakMapTag4;
      }
    }
    return result;
  };
}
var getTag_default2 = getTag2;

// node_modules/lodash-es/_initCloneArray.js
var objectProto27 = Object.prototype;
var hasOwnProperty21 = objectProto27.hasOwnProperty;
function initCloneArray(array) {
  var length = array.length, result = new array.constructor(length);
  if (length && typeof array[0] == "string" && hasOwnProperty21.call(array, "index")) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}
var initCloneArray_default = initCloneArray;

// node_modules/lodash-es/_Uint8Array.js
var Uint8Array3 = root_default2.Uint8Array;
var Uint8Array_default2 = Uint8Array3;

// node_modules/lodash-es/_cloneArrayBuffer.js
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array_default2(result).set(new Uint8Array_default2(arrayBuffer));
  return result;
}
var cloneArrayBuffer_default = cloneArrayBuffer;

// node_modules/lodash-es/_cloneDataView.js
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer_default(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}
var cloneDataView_default = cloneDataView;

// node_modules/lodash-es/_cloneRegExp.js
var reFlags = /\w*$/;
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}
var cloneRegExp_default = cloneRegExp;

// node_modules/lodash-es/_cloneSymbol.js
var symbolProto4 = Symbol_default2 ? Symbol_default2.prototype : void 0;
var symbolValueOf2 = symbolProto4 ? symbolProto4.valueOf : void 0;
function cloneSymbol(symbol) {
  return symbolValueOf2 ? Object(symbolValueOf2.call(symbol)) : {};
}
var cloneSymbol_default = cloneSymbol;

// node_modules/lodash-es/_cloneTypedArray.js
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer_default(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}
var cloneTypedArray_default = cloneTypedArray;

// node_modules/lodash-es/_initCloneByTag.js
var boolTag4 = "[object Boolean]";
var dateTag4 = "[object Date]";
var mapTag6 = "[object Map]";
var numberTag4 = "[object Number]";
var regexpTag4 = "[object RegExp]";
var setTag6 = "[object Set]";
var stringTag4 = "[object String]";
var symbolTag4 = "[object Symbol]";
var arrayBufferTag4 = "[object ArrayBuffer]";
var dataViewTag6 = "[object DataView]";
var float32Tag3 = "[object Float32Array]";
var float64Tag3 = "[object Float64Array]";
var int8Tag3 = "[object Int8Array]";
var int16Tag3 = "[object Int16Array]";
var int32Tag3 = "[object Int32Array]";
var uint8Tag3 = "[object Uint8Array]";
var uint8ClampedTag3 = "[object Uint8ClampedArray]";
var uint16Tag3 = "[object Uint16Array]";
var uint32Tag3 = "[object Uint32Array]";
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag4:
      return cloneArrayBuffer_default(object);
    case boolTag4:
    case dateTag4:
      return new Ctor(+object);
    case dataViewTag6:
      return cloneDataView_default(object, isDeep);
    case float32Tag3:
    case float64Tag3:
    case int8Tag3:
    case int16Tag3:
    case int32Tag3:
    case uint8Tag3:
    case uint8ClampedTag3:
    case uint16Tag3:
    case uint32Tag3:
      return cloneTypedArray_default(object, isDeep);
    case mapTag6:
      return new Ctor();
    case numberTag4:
    case stringTag4:
      return new Ctor(object);
    case regexpTag4:
      return cloneRegExp_default(object);
    case setTag6:
      return new Ctor();
    case symbolTag4:
      return cloneSymbol_default(object);
  }
}
var initCloneByTag_default = initCloneByTag;

// node_modules/lodash-es/_initCloneObject.js
function initCloneObject(object) {
  return typeof object.constructor == "function" && !isPrototype_default2(object) ? baseCreate_default(getPrototype_default(object)) : {};
}
var initCloneObject_default = initCloneObject;

// node_modules/lodash-es/_baseIsMap.js
var mapTag7 = "[object Map]";
function baseIsMap(value) {
  return isObjectLike_default2(value) && getTag_default2(value) == mapTag7;
}
var baseIsMap_default = baseIsMap;

// node_modules/lodash-es/isMap.js
var nodeIsMap = nodeUtil_default2 && nodeUtil_default2.isMap;
var isMap = nodeIsMap ? baseUnary_default2(nodeIsMap) : baseIsMap_default;
var isMap_default = isMap;

// node_modules/lodash-es/_baseIsSet.js
var setTag7 = "[object Set]";
function baseIsSet(value) {
  return isObjectLike_default2(value) && getTag_default2(value) == setTag7;
}
var baseIsSet_default = baseIsSet;

// node_modules/lodash-es/isSet.js
var nodeIsSet = nodeUtil_default2 && nodeUtil_default2.isSet;
var isSet = nodeIsSet ? baseUnary_default2(nodeIsSet) : baseIsSet_default;
var isSet_default = isSet;

// node_modules/lodash-es/_baseClone.js
var CLONE_DEEP_FLAG = 1;
var CLONE_FLAT_FLAG = 2;
var CLONE_SYMBOLS_FLAG = 4;
var argsTag6 = "[object Arguments]";
var arrayTag4 = "[object Array]";
var boolTag5 = "[object Boolean]";
var dateTag5 = "[object Date]";
var errorTag4 = "[object Error]";
var funcTag5 = "[object Function]";
var genTag3 = "[object GeneratorFunction]";
var mapTag8 = "[object Map]";
var numberTag5 = "[object Number]";
var objectTag7 = "[object Object]";
var regexpTag5 = "[object RegExp]";
var setTag8 = "[object Set]";
var stringTag5 = "[object String]";
var symbolTag5 = "[object Symbol]";
var weakMapTag5 = "[object WeakMap]";
var arrayBufferTag5 = "[object ArrayBuffer]";
var dataViewTag7 = "[object DataView]";
var float32Tag4 = "[object Float32Array]";
var float64Tag4 = "[object Float64Array]";
var int8Tag4 = "[object Int8Array]";
var int16Tag4 = "[object Int16Array]";
var int32Tag4 = "[object Int32Array]";
var uint8Tag4 = "[object Uint8Array]";
var uint8ClampedTag4 = "[object Uint8ClampedArray]";
var uint16Tag4 = "[object Uint16Array]";
var uint32Tag4 = "[object Uint32Array]";
var cloneableTags = {};
cloneableTags[argsTag6] = cloneableTags[arrayTag4] = cloneableTags[arrayBufferTag5] = cloneableTags[dataViewTag7] = cloneableTags[boolTag5] = cloneableTags[dateTag5] = cloneableTags[float32Tag4] = cloneableTags[float64Tag4] = cloneableTags[int8Tag4] = cloneableTags[int16Tag4] = cloneableTags[int32Tag4] = cloneableTags[mapTag8] = cloneableTags[numberTag5] = cloneableTags[objectTag7] = cloneableTags[regexpTag5] = cloneableTags[setTag8] = cloneableTags[stringTag5] = cloneableTags[symbolTag5] = cloneableTags[uint8Tag4] = cloneableTags[uint8ClampedTag4] = cloneableTags[uint16Tag4] = cloneableTags[uint32Tag4] = true;
cloneableTags[errorTag4] = cloneableTags[funcTag5] = cloneableTags[weakMapTag5] = false;
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== void 0) {
    return result;
  }
  if (!isObject_default2(value)) {
    return value;
  }
  var isArr = isArray_default2(value);
  if (isArr) {
    result = initCloneArray_default(value);
    if (!isDeep) {
      return copyArray_default(value, result);
    }
  } else {
    var tag = getTag_default2(value), isFunc = tag == funcTag5 || tag == genTag3;
    if (isBuffer_default2(value)) {
      return cloneBuffer_default(value, isDeep);
    }
    if (tag == objectTag7 || tag == argsTag6 || isFunc && !object) {
      result = isFlat || isFunc ? {} : initCloneObject_default(value);
      if (!isDeep) {
        return isFlat ? copySymbolsIn_default(value, baseAssignIn_default(result, value)) : copySymbols_default(value, baseAssign_default(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag_default(value, tag, isDeep);
    }
  }
  stack || (stack = new Stack_default2());
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);
  if (isSet_default(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap_default(value)) {
    value.forEach(function(subValue, key2) {
      result.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
    });
  }
  var keysFunc = isFull ? isFlat ? getAllKeysIn_default : getAllKeys_default2 : isFlat ? keysIn_default : keys_default2;
  var props = isArr ? void 0 : keysFunc(value);
  arrayEach_default(props || value, function(subValue, key2) {
    if (props) {
      key2 = subValue;
      subValue = value[key2];
    }
    assignValue_default2(result, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
  });
  return result;
}
var baseClone_default = baseClone;

// node_modules/lodash-es/cloneDeep.js
var CLONE_DEEP_FLAG2 = 1;
var CLONE_SYMBOLS_FLAG2 = 4;
function cloneDeep(value) {
  return baseClone_default(value, CLONE_DEEP_FLAG2 | CLONE_SYMBOLS_FLAG2);
}
var cloneDeep_default = cloneDeep;

// node_modules/lodash-es/_setCacheAdd.js
var HASH_UNDEFINED6 = "__lodash_hash_undefined__";
function setCacheAdd2(value) {
  this.__data__.set(value, HASH_UNDEFINED6);
  return this;
}
var setCacheAdd_default2 = setCacheAdd2;

// node_modules/lodash-es/_setCacheHas.js
function setCacheHas2(value) {
  return this.__data__.has(value);
}
var setCacheHas_default2 = setCacheHas2;

// node_modules/lodash-es/_SetCache.js
function SetCache2(values) {
  var index = -1, length = values == null ? 0 : values.length;
  this.__data__ = new MapCache_default2();
  while (++index < length) {
    this.add(values[index]);
  }
}
SetCache2.prototype.add = SetCache2.prototype.push = setCacheAdd_default2;
SetCache2.prototype.has = setCacheHas_default2;
var SetCache_default2 = SetCache2;

// node_modules/lodash-es/_arraySome.js
function arraySome2(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}
var arraySome_default2 = arraySome2;

// node_modules/lodash-es/_cacheHas.js
function cacheHas2(cache, key) {
  return cache.has(key);
}
var cacheHas_default2 = cacheHas2;

// node_modules/lodash-es/_equalArrays.js
var COMPARE_PARTIAL_FLAG7 = 1;
var COMPARE_UNORDERED_FLAG5 = 2;
function equalArrays2(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG7, arrLength = array.length, othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }
  var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG5 ? new SetCache_default2() : void 0;
  stack.set(array, other);
  stack.set(other, array);
  while (++index < arrLength) {
    var arrValue = array[index], othValue = other[index];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== void 0) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    if (seen) {
      if (!arraySome_default2(other, function(othValue2, othIndex) {
        if (!cacheHas_default2(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack["delete"](array);
  stack["delete"](other);
  return result;
}
var equalArrays_default2 = equalArrays2;

// node_modules/lodash-es/_mapToArray.js
function mapToArray2(map) {
  var index = -1, result = Array(map.size);
  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}
var mapToArray_default2 = mapToArray2;

// node_modules/lodash-es/_setToArray.js
function setToArray2(set2) {
  var index = -1, result = Array(set2.size);
  set2.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}
var setToArray_default2 = setToArray2;

// node_modules/lodash-es/_equalByTag.js
var COMPARE_PARTIAL_FLAG8 = 1;
var COMPARE_UNORDERED_FLAG6 = 2;
var boolTag6 = "[object Boolean]";
var dateTag6 = "[object Date]";
var errorTag5 = "[object Error]";
var mapTag9 = "[object Map]";
var numberTag6 = "[object Number]";
var regexpTag6 = "[object RegExp]";
var setTag9 = "[object Set]";
var stringTag6 = "[object String]";
var symbolTag6 = "[object Symbol]";
var arrayBufferTag6 = "[object ArrayBuffer]";
var dataViewTag8 = "[object DataView]";
var symbolProto5 = Symbol_default2 ? Symbol_default2.prototype : void 0;
var symbolValueOf3 = symbolProto5 ? symbolProto5.valueOf : void 0;
function equalByTag2(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag8:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;
    case arrayBufferTag6:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array_default2(object), new Uint8Array_default2(other))) {
        return false;
      }
      return true;
    case boolTag6:
    case dateTag6:
    case numberTag6:
      return eq_default2(+object, +other);
    case errorTag5:
      return object.name == other.name && object.message == other.message;
    case regexpTag6:
    case stringTag6:
      return object == other + "";
    case mapTag9:
      var convert = mapToArray_default2;
    case setTag9:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG8;
      convert || (convert = setToArray_default2);
      if (object.size != other.size && !isPartial) {
        return false;
      }
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG6;
      stack.set(object, other);
      var result = equalArrays_default2(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack["delete"](object);
      return result;
    case symbolTag6:
      if (symbolValueOf3) {
        return symbolValueOf3.call(object) == symbolValueOf3.call(other);
      }
  }
  return false;
}
var equalByTag_default2 = equalByTag2;

// node_modules/lodash-es/_equalObjects.js
var COMPARE_PARTIAL_FLAG9 = 1;
var objectProto28 = Object.prototype;
var hasOwnProperty22 = objectProto28.hasOwnProperty;
function equalObjects2(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG9, objProps = getAllKeys_default2(object), objLength = objProps.length, othProps = getAllKeys_default2(other), othLength = othProps.length;
  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty22.call(other, key))) {
      return false;
    }
  }
  var objStacked = stack.get(object);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key], othValue = other[key];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    }
    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == "constructor");
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor, othCtor = other.constructor;
    if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack["delete"](object);
  stack["delete"](other);
  return result;
}
var equalObjects_default2 = equalObjects2;

// node_modules/lodash-es/_baseIsEqualDeep.js
var COMPARE_PARTIAL_FLAG10 = 1;
var argsTag7 = "[object Arguments]";
var arrayTag5 = "[object Array]";
var objectTag8 = "[object Object]";
var objectProto29 = Object.prototype;
var hasOwnProperty23 = objectProto29.hasOwnProperty;
function baseIsEqualDeep2(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_default2(object), othIsArr = isArray_default2(other), objTag = objIsArr ? arrayTag5 : getTag_default2(object), othTag = othIsArr ? arrayTag5 : getTag_default2(other);
  objTag = objTag == argsTag7 ? objectTag8 : objTag;
  othTag = othTag == argsTag7 ? objectTag8 : othTag;
  var objIsObj = objTag == objectTag8, othIsObj = othTag == objectTag8, isSameTag = objTag == othTag;
  if (isSameTag && isBuffer_default2(object)) {
    if (!isBuffer_default2(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack_default2());
    return objIsArr || isTypedArray_default2(object) ? equalArrays_default2(object, other, bitmask, customizer, equalFunc, stack) : equalByTag_default2(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG10)) {
    var objIsWrapped = objIsObj && hasOwnProperty23.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty23.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack_default2());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack_default2());
  return equalObjects_default2(object, other, bitmask, customizer, equalFunc, stack);
}
var baseIsEqualDeep_default2 = baseIsEqualDeep2;

// node_modules/lodash-es/_baseIsEqual.js
function baseIsEqual2(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike_default2(value) && !isObjectLike_default2(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep_default2(value, other, bitmask, customizer, baseIsEqual2, stack);
}
var baseIsEqual_default2 = baseIsEqual2;

// node_modules/lodash-es/_baseIsMatch.js
var COMPARE_PARTIAL_FLAG11 = 1;
var COMPARE_UNORDERED_FLAG7 = 2;
function baseIsMatch2(object, source, matchData, customizer) {
  var index = matchData.length, length = index, noCustomizer = !customizer;
  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0], objValue = object[key], srcValue = data[1];
    if (noCustomizer && data[2]) {
      if (objValue === void 0 && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack_default2();
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === void 0 ? baseIsEqual_default2(srcValue, objValue, COMPARE_PARTIAL_FLAG11 | COMPARE_UNORDERED_FLAG7, customizer, stack) : result)) {
        return false;
      }
    }
  }
  return true;
}
var baseIsMatch_default2 = baseIsMatch2;

// node_modules/lodash-es/_isStrictComparable.js
function isStrictComparable2(value) {
  return value === value && !isObject_default2(value);
}
var isStrictComparable_default2 = isStrictComparable2;

// node_modules/lodash-es/_getMatchData.js
function getMatchData2(object) {
  var result = keys_default2(object), length = result.length;
  while (length--) {
    var key = result[length], value = object[key];
    result[length] = [key, value, isStrictComparable_default2(value)];
  }
  return result;
}
var getMatchData_default2 = getMatchData2;

// node_modules/lodash-es/_matchesStrictComparable.js
function matchesStrictComparable2(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
  };
}
var matchesStrictComparable_default2 = matchesStrictComparable2;

// node_modules/lodash-es/_baseMatches.js
function baseMatches2(source) {
  var matchData = getMatchData_default2(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable_default2(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch_default2(object, source, matchData);
  };
}
var baseMatches_default2 = baseMatches2;

// node_modules/lodash-es/_baseHasIn.js
function baseHasIn2(object, key) {
  return object != null && key in Object(object);
}
var baseHasIn_default2 = baseHasIn2;

// node_modules/lodash-es/_hasPath.js
function hasPath2(object, path, hasFunc) {
  path = castPath_default2(path, object);
  var index = -1, length = path.length, result = false;
  while (++index < length) {
    var key = toKey_default2(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength_default2(length) && isIndex_default2(key, length) && (isArray_default2(object) || isArguments_default2(object));
}
var hasPath_default2 = hasPath2;

// node_modules/lodash-es/hasIn.js
function hasIn2(object, path) {
  return object != null && hasPath_default2(object, path, baseHasIn_default2);
}
var hasIn_default2 = hasIn2;

// node_modules/lodash-es/_baseMatchesProperty.js
var COMPARE_PARTIAL_FLAG12 = 1;
var COMPARE_UNORDERED_FLAG8 = 2;
function baseMatchesProperty2(path, srcValue) {
  if (isKey_default2(path) && isStrictComparable_default2(srcValue)) {
    return matchesStrictComparable_default2(toKey_default2(path), srcValue);
  }
  return function(object) {
    var objValue = get_default2(object, path);
    return objValue === void 0 && objValue === srcValue ? hasIn_default2(object, path) : baseIsEqual_default2(srcValue, objValue, COMPARE_PARTIAL_FLAG12 | COMPARE_UNORDERED_FLAG8);
  };
}
var baseMatchesProperty_default2 = baseMatchesProperty2;

// node_modules/lodash-es/_baseProperty.js
function baseProperty2(key) {
  return function(object) {
    return object == null ? void 0 : object[key];
  };
}
var baseProperty_default2 = baseProperty2;

// node_modules/lodash-es/_basePropertyDeep.js
function basePropertyDeep2(path) {
  return function(object) {
    return baseGet_default2(object, path);
  };
}
var basePropertyDeep_default2 = basePropertyDeep2;

// node_modules/lodash-es/property.js
function property2(path) {
  return isKey_default2(path) ? baseProperty_default2(toKey_default2(path)) : basePropertyDeep_default2(path);
}
var property_default2 = property2;

// node_modules/lodash-es/_baseIteratee.js
function baseIteratee2(value) {
  if (typeof value == "function") {
    return value;
  }
  if (value == null) {
    return identity_default2;
  }
  if (typeof value == "object") {
    return isArray_default2(value) ? baseMatchesProperty_default2(value[0], value[1]) : baseMatches_default2(value);
  }
  return property_default2(value);
}
var baseIteratee_default2 = baseIteratee2;

// node_modules/lodash-es/_arrayAggregator.js
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }
  return accumulator;
}
var arrayAggregator_default = arrayAggregator;

// node_modules/lodash-es/_createBaseFor.js
function createBaseFor2(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var createBaseFor_default2 = createBaseFor2;

// node_modules/lodash-es/_baseFor.js
var baseFor2 = createBaseFor_default2();
var baseFor_default2 = baseFor2;

// node_modules/lodash-es/_baseForOwn.js
function baseForOwn2(object, iteratee) {
  return object && baseFor_default2(object, iteratee, keys_default2);
}
var baseForOwn_default2 = baseForOwn2;

// node_modules/lodash-es/_createBaseEach.js
function createBaseEach2(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike_default2(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}
var createBaseEach_default2 = createBaseEach2;

// node_modules/lodash-es/_baseEach.js
var baseEach2 = createBaseEach_default2(baseForOwn_default2);
var baseEach_default2 = baseEach2;

// node_modules/lodash-es/_baseAggregator.js
function baseAggregator(collection, setter, iteratee, accumulator) {
  baseEach_default2(collection, function(value, key, collection2) {
    setter(accumulator, value, iteratee(value), collection2);
  });
  return accumulator;
}
var baseAggregator_default = baseAggregator;

// node_modules/lodash-es/_createAggregator.js
function createAggregator(setter, initializer) {
  return function(collection, iteratee) {
    var func = isArray_default2(collection) ? arrayAggregator_default : baseAggregator_default, accumulator = initializer ? initializer() : {};
    return func(collection, setter, baseIteratee_default2(iteratee, 2), accumulator);
  };
}
var createAggregator_default = createAggregator;

// node_modules/lodash-es/last.js
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : void 0;
}
var last_default = last;

// node_modules/lodash-es/groupBy.js
var objectProto30 = Object.prototype;
var hasOwnProperty24 = objectProto30.hasOwnProperty;
var groupBy = createAggregator_default(function(result, value, key) {
  if (hasOwnProperty24.call(result, key)) {
    result[key].push(value);
  } else {
    baseAssignValue_default2(result, key, [value]);
  }
});
var groupBy_default = groupBy;

// node_modules/lodash-es/_parent.js
function parent(object, path) {
  return path.length < 2 ? object : baseGet_default2(object, baseSlice_default(path, 0, -1));
}
var parent_default = parent;

// node_modules/lodash-es/isEqual.js
function isEqual(value, other) {
  return baseIsEqual_default2(value, other);
}
var isEqual_default = isEqual;

// node_modules/lodash-es/keyBy.js
var keyBy = createAggregator_default(function(result, value, key) {
  baseAssignValue_default2(result, key, value);
});
var keyBy_default = keyBy;

// node_modules/lodash-es/_baseUnset.js
var objectProto31 = Object.prototype;
var hasOwnProperty25 = objectProto31.hasOwnProperty;
function baseUnset(object, path) {
  path = castPath_default2(path, object);
  var index = -1, length = path.length;
  if (!length) {
    return true;
  }
  var isRootPrimitive = object == null || typeof object !== "object" && typeof object !== "function";
  while (++index < length) {
    var key = path[index];
    if (typeof key !== "string") {
      continue;
    }
    if (key === "__proto__" && !hasOwnProperty25.call(object, "__proto__")) {
      return false;
    }
    if (key === "constructor" && index + 1 < length && typeof path[index + 1] === "string" && path[index + 1] === "prototype") {
      if (isRootPrimitive && index === 0) {
        continue;
      }
      return false;
    }
  }
  var obj = parent_default(object, path);
  return obj == null || delete obj[toKey_default2(last_default(path))];
}
var baseUnset_default = baseUnset;

// node_modules/lodash-es/_customOmitClone.js
function customOmitClone(value) {
  return isPlainObject_default(value) ? void 0 : value;
}
var customOmitClone_default = customOmitClone;

// node_modules/lodash-es/omit.js
var CLONE_DEEP_FLAG3 = 1;
var CLONE_FLAT_FLAG2 = 2;
var CLONE_SYMBOLS_FLAG3 = 4;
var omit = flatRest_default2(function(object, paths) {
  var result = {};
  if (object == null) {
    return result;
  }
  var isDeep = false;
  paths = arrayMap_default2(paths, function(path) {
    path = castPath_default2(path, object);
    isDeep || (isDeep = path.length > 1);
    return path;
  });
  copyObject_default(object, getAllKeysIn_default(object), result);
  if (isDeep) {
    result = baseClone_default(result, CLONE_DEEP_FLAG3 | CLONE_FLAT_FLAG2 | CLONE_SYMBOLS_FLAG3, customOmitClone_default);
  }
  var length = paths.length;
  while (length--) {
    baseUnset_default(result, paths[length]);
  }
  return result;
});
var omit_default = omit;

// node_modules/deep-object-diff/mjs/utils.js
var isDate = (d) => d instanceof Date;
var isEmpty = (o) => Object.keys(o).length === 0;
var isObject3 = (o) => o != null && typeof o === "object";
var hasOwnProperty26 = (o, ...args) => Object.prototype.hasOwnProperty.call(o, ...args);
var isEmptyObject = (o) => isObject3(o) && isEmpty(o);
var makeObjectWithoutPrototype = () => /* @__PURE__ */ Object.create(null);

// node_modules/deep-object-diff/mjs/diff.js
var diff = (lhs, rhs) => {
  if (lhs === rhs) return {};
  if (!isObject3(lhs) || !isObject3(rhs)) return rhs;
  const deletedValues = Object.keys(lhs).reduce((acc, key) => {
    if (!hasOwnProperty26(rhs, key)) {
      acc[key] = void 0;
    }
    return acc;
  }, makeObjectWithoutPrototype());
  if (isDate(lhs) || isDate(rhs)) {
    if (lhs.valueOf() == rhs.valueOf()) return {};
    return rhs;
  }
  return Object.keys(rhs).reduce((acc, key) => {
    if (!hasOwnProperty26(lhs, key)) {
      acc[key] = rhs[key];
      return acc;
    }
    const difference = diff(lhs[key], rhs[key]);
    if (isEmptyObject(difference) && !isDate(difference) && (isEmptyObject(lhs[key]) || !isEmptyObject(rhs[key])))
      return acc;
    acc[key] = difference;
    return acc;
  }, deletedValues);
};
var diff_default = diff;

// athletes/clean.ts
var logger3 = logger_default.child({ parser: SCRIPT_NAME });
var cleanAthletes = async ({ year, eventHashes }) => {
  logger3.info(`Cleaning athletes data for year ${year} (${eventHashes.join(", ")})...`);
  const [
    existingAthletes,
    athletesOverrides,
    athletesCategories
  ] = await Promise.all([
    data_default.get.baseAthletes(),
    data_default.get.athletesOverrides(),
    data_default.get.athletesCategories()
  ]);
  logger3.info(`${Object.keys(existingAthletes).length} existing athletes`);
  const updatedAthletes = keyBy_default(existingAthletes, "uciId");
  const updatedAthleteIds = /* @__PURE__ */ new Set();
  const ignoreChangedFields = ["lastUpdated", "licenses", "teams", "uciId"];
  for (const eventHash of eventHashes) {
    let eventAthletes;
    try {
      eventAthletes = await data_default.get.rawEventAthletes(eventHash, year);
    } catch (error) {
      logger3.error("Failed to fetch event athletes for event " + eventHash + ": " + error.message, { error });
      continue;
    }
    for (const rawAthlete of eventAthletes) {
      let athleteUciId = rawAthlete.uciId;
      if (athletesOverrides.replacedUciIds?.[athleteUciId]) {
        const newUciId = athletesOverrides.replacedUciIds[athleteUciId].new;
        logger3.warn(`Replaced UCI ID ${athleteUciId} -> ${newUciId} for athlete: ${rawAthlete.firstName} ${rawAthlete.lastName}`);
        athleteUciId = newUciId;
        rawAthlete.uciId = newUciId;
      }
      if (updatedAthletes[athleteUciId]) {
        const existingAthlete = updatedAthletes[athleteUciId];
        if (isEqual_default(existingAthlete, rawAthlete)) {
        } else {
          const partialMergedProfile = reconcileAthleteProfiles(existingAthlete, rawAthlete, year);
          const changedFields = diff_default(existingAthlete, partialMergedProfile);
          if (DEBUG && Object.keys(changedFields).some((field) => !ignoreChangedFields.includes(field))) {
            logger3.info(`Matching athlete found for UCI ID: ${athleteUciId}:`);
          }
          updatedAthletes[athleteUciId] = partialMergedProfile;
        }
      } else {
        updatedAthletes[athleteUciId] = rawAthlete;
      }
      updatedAthleteIds.add(athleteUciId);
    }
  }
  const athletesCategoriesByUciId = keyBy_default(athletesCategories, "athleteUciId");
  for (const uciId of Object.keys(updatedAthletes)) {
    const athlete = updatedAthletes[uciId];
    const athleteSkillCategory = athletesCategoriesByUciId[uciId];
    const {
      level: currentSkillLevel,
      ageCategory: currentAgeCategory
    } = getCurrentCategory(athleteSkillCategory, "ROAD");
    if (currentSkillLevel) {
      if (!athlete.skillLevel) athlete.skillLevel = {};
      athlete.skillLevel.ROAD = currentSkillLevel;
    }
    if (currentAgeCategory) {
      if (!athlete.ageCategory) athlete.ageCategory = {};
      athlete.ageCategory.ROAD = currentAgeCategory;
    }
  }
  logger3.info(`Saving ${Object.keys(updatedAthletes).length} athletes`);
  try {
    await data_default.update.baseAthletes(Object.values(updatedAthletes));
  } catch (error) {
    logger3.error(`Failed to save athletes:` + error.message, { error });
  }
  return Array.from(updatedAthleteIds);
};
var reconcileAthleteProfiles = (existingProfile, newProfile, year) => {
  const mergedProfile = cloneDeep_default(existingProfile);
  Object.keys(newProfile).forEach((key) => {
    if ([
      "uciId",
      "teams",
      "licenses",
      "latestUpgrade",
      "lastUpdated"
    ].includes(key)) return;
    if (existingProfile[key] === null && !!newProfile[key]) mergedProfile[key] = newProfile[key];
    else {
      if (existingProfile[key] !== newProfile[key] && (newProfile[key] !== null && newProfile[key] !== void 0) && newProfile.lastUpdated >= existingProfile.lastUpdated) {
        mergedProfile[key] = newProfile[key];
      }
    }
  });
  if (newProfile.licenses?.[year]) {
    for (const license of newProfile.licenses[year]) {
      if (!existingProfile.licenses[year]?.includes(license)) {
        if (!mergedProfile.licenses[year]) mergedProfile.licenses[year] = [];
        mergedProfile.licenses[year].push(license);
      }
    }
  }
  if (newProfile.lastUpdated && newProfile.lastUpdated > existingProfile.lastUpdated) mergedProfile.lastUpdated = newProfile.lastUpdated;
  return mergedProfile;
};
var getCurrentCategory = (athleteSkillCategory, discipline) => {
  if (!athleteSkillCategory) return {};
  if (!athleteSkillCategory.skillLevels || !athleteSkillCategory.skillLevels[discipline]) return {};
  const skillLevels = athleteSkillCategory.skillLevels[discipline];
  const mostRecentLevelDate = Object.keys(skillLevels).sort().reverse()[0];
  const mostRecentLevel = skillLevels[mostRecentLevelDate];
  const ageCategory = athleteSkillCategory.ageCategory;
  return {
    level: mostRecentLevel,
    ageCategory
  };
};

// athletes/create-lookup-table.ts
var logger4 = logger_default.child({ parser: SCRIPT_NAME });
var createAthleteLookupTable = async () => {
  logger4.info("Creating athletes lookup table...");
  const [
    athletes,
    allAthleteOverrides
  ] = await Promise.all([
    data_default.get.baseAthletes(),
    data_default.get.athletesOverrides()
  ]);
  logger4.info(`Processing ${athletes.length} athletes to create lookup table`);
  const duplicates = {};
  const lookupTable = {};
  for (const athlete of athletes) {
    const key = `${athlete.firstName?.toLowerCase() || ""}|${athlete.lastName?.toLowerCase() || ""}`.trim();
    if (lookupTable[key]) {
      const conflictingUciId = lookupTable[key];
      logger4.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${athlete.uciId}, existing UCI ID: ${conflictingUciId}`);
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(athlete.uciId, conflictingUciId);
      delete lookupTable[key];
      continue;
    } else if (duplicates[key]) {
      logger4.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${athlete.uciId}, existing UCI ID: ${duplicates[key].join(",")}`);
      duplicates[key].push(athlete.uciId);
      continue;
    }
    lookupTable[key] = athlete.uciId;
  }
  if (allAthleteOverrides.alternateNames) {
    logger4.info(`Adding ${Object.keys(allAthleteOverrides.alternateNames).length} alternate names to the lookup table`);
    Object.entries(allAthleteOverrides.alternateNames).forEach(([key, uciId]) => {
      if (lookupTable[key]) {
        logger4.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${uciId}, existing UCI ID: ${lookupTable[key]}, skipping`);
      } else {
        lookupTable[key] = uciId;
      }
    });
  }
  logger4.info(`Saving athletes lookup table`);
  try {
    await data_default.update.athletesLookup(lookupTable, duplicates);
  } catch (error) {
    logger4.error(`Failed to save athletes lookup table:` + error.message, { error });
  }
};

// race-results/extract.ts
var logger5 = logger_default.child({ parser: SCRIPT_NAME });
var extractRaceResults = async (options) => {
  logger5.info(`Extracting race results for year ${options.year} with filters: ${JSON.stringify(options)}...`);
  const { allRaceResults, eventHashes } = await extractAllEventResults(options);
  await saveAllRaceResults(allRaceResults, options.year);
  return { year: options.year, eventHashes };
};
var extractAllEventResults = async (options) => {
  const events = await data_default.get.events({ ...options }, { summary: true });
  const promises = await Promise.allSettled(events.map(async (event) => extractEventResults(event)));
  const allRaceResults = {};
  let totalRaceResults = 0;
  const eventHashes = [];
  promises.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const { value: raceResults } = result;
      allRaceResults[events[i].hash] = raceResults;
      totalRaceResults += raceResults.length;
      eventHashes.push(events[i].hash);
    } else {
      logger5.error(`Error while processing event results: ${result.reason}`, {
        hash: events[i].hash,
        eventName: events[i].name,
        date: events[i].date,
        year: events[i].year,
        error: result.reason
      });
    }
  });
  logger5.info(`Total race results extracted (non-unique): ${totalRaceResults}`);
  return { allRaceResults, eventHashes };
};
var extractEventResults = async (event) => {
  const eventResults = await data_default.get.eventResults(event.hash, event.year);
  logger5.info(`Extracting event results for event ${event.hash} (${event.name} - ${event.date})...`);
  if (!eventResults) return [];
  const athleteRaceResults = [];
  Object.keys(eventResults.results).forEach((category) => {
    const { results: categoryResults, upgradePoints = [] } = eventResults.results[category];
    if (eventResults.results[category].combinedCategories) return;
    Object.values(categoryResults).forEach((athleteResult) => {
      const athlete = eventResults.athletes[athleteResult.athleteId.toString()];
      const athleteUpgradePoint = upgradePoints.find((up) => up.athleteId === athleteResult.athleteId.toString());
      if (!athlete) {
        logger5.warn(`Athlete not found for id ${athleteResult.athleteId} in category ${category}, skipping race extraction`, {
          eventHash: event.hash
        });
        return;
      }
      if (!athlete.uciId && (!athlete.firstName || !athlete.lastName)) {
        if (athlete.firstName?.length || athlete.lastName?.length) {
          logger5.warn(`Athlete ${athlete.firstName} ${athlete.lastName} has no UCI ID and partial name, skipping race extraction`, {
            eventHash: event.hash
          });
        }
        return;
      }
      if (athleteResult.status === "DNS") return;
      athleteRaceResults.push({
        athleteUciId: athlete.uciId,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        teamName: athlete.team,
        date: event.date,
        eventHash: event.hash,
        eventType: event.sanctionedEventType,
        discipline: event.discipline,
        category,
        position: athleteResult.position,
        status: athleteResult.status,
        upgradePoints: athleteUpgradePoint?.points || 0,
        fieldSize: eventResults.results[category].fieldSize || 0
      });
    });
  });
  return athleteRaceResults;
};
var saveAllRaceResults = async (allRaceResults, year) => {
  const promises = await Promise.allSettled(
    Object.entries(allRaceResults).map(
      ([eventHash, raceResults]) => data_default.update.rawAthletesRaceResults(raceResults, {
        eventHash,
        year
      })
    )
  );
  promises.forEach((result, i) => {
    const eventHash = Object.keys(allRaceResults)[i];
    const raceResults = allRaceResults[eventHash];
    if (result.status === "fulfilled") {
      logger5.info(`Saved ${raceResults.length} raw athletes race results for event ${eventHash}`);
    } else {
      logger5.error(`Error while saving athletes race results: ${result.reason}`, {
        hash: eventHash,
        year,
        error: result.reason
      });
    }
  });
};

// ../shared/athlete-finder.ts
var AthleteFinderSingleton = class {
  constructor() {
    this._lookupTable = {};
    this._alternateNames = {};
    this._replacedUciIds = {};
  }
  async init(reload = false) {
    if (!reload && Object.keys(this._lookupTable).length > 0) return;
    const [
      athletesLookupTable,
      athletesOverrides
    ] = await Promise.all([
      data_default.get.athletesLookup(),
      data_default.get.athletesOverrides()
    ]);
    this._lookupTable = athletesLookupTable;
    this._alternateNames = athletesOverrides.alternateNames || {};
    this._replacedUciIds = athletesOverrides.replacedUciIds || {};
  }
  findAthleteUciId(params) {
    const { uciId, firstName, lastName } = params;
    if (uciId && validateUCIId(uciId)) return uciId;
    const nameKey = `${firstName?.toLowerCase()}|${lastName?.toLowerCase()}`;
    if (this._lookupTable[nameKey]) return this._lookupTable[nameKey];
    if (this._alternateNames?.[nameKey]) return this._alternateNames[nameKey];
    return null;
  }
  getReplacedUciId(uciId) {
    if (this._replacedUciIds[uciId]) return this._replacedUciIds[uciId].new;
    return uciId;
  }
};
var AthleteFinder = new AthleteFinderSingleton();

// race-results/clean.ts
var logger6 = logger_default.child({ parser: SCRIPT_NAME });
var cleanRaceResults = async ({ year, eventHashes }) => {
  await AthleteFinder.init();
  logger6.info(`Cleaning athletes race results for year ${year} (${eventHashes.join(", ")})...`);
  const updatedAthleteIds = /* @__PURE__ */ new Set();
  const promises = await Promise.allSettled(eventHashes.map(async (eventHash) => cleanEventRaceResults(eventHash, year)));
  promises.forEach((promise, i) => {
    if (promise.status === "fulfilled") {
      promise.value.athleteIds.forEach((id) => updatedAthleteIds.add(id));
    } else {
      logger6.error(`Error while cleaning event race results: ${promise.reason}`, {
        year,
        eventHash: eventHashes[i],
        error: promise.reason
      });
    }
  });
  return { athleteIds: Array.from(updatedAthleteIds) };
};
var cleanEventRaceResults = async (eventHash, year) => {
  const eventRawRaceResults = await data_default.get.rawAthletesRaceResults(eventHash, year);
  const updatedAthleteIds = [];
  let skippedResults = 0;
  const cleanRaceResults2 = eventRawRaceResults.map((raceResult) => {
    let { athleteUciId: rawAthleteUciId } = raceResult;
    const { firstName, lastName } = raceResult;
    let cleanAthleteUciId = rawAthleteUciId;
    if (cleanAthleteUciId && !validateUCIId(cleanAthleteUciId)) cleanAthleteUciId = void 0;
    if (rawAthleteUciId && AthleteFinder.getReplacedUciId(rawAthleteUciId) !== rawAthleteUciId) {
      cleanAthleteUciId = AthleteFinder.getReplacedUciId(rawAthleteUciId);
    } else if (!cleanAthleteUciId && firstName && lastName) {
      cleanAthleteUciId = AthleteFinder.findAthleteUciId({ firstName, lastName }) || void 0;
    }
    if (!cleanAthleteUciId) {
      skippedResults += 1;
      return null;
    }
    return {
      ...omit_default(raceResult, ["firstName", "lastName"]),
      athleteUciId: cleanAthleteUciId
    };
  }).filter((race) => race !== null && !!race?.athleteUciId);
  logger6.info(`Saving ${cleanRaceResults2.length} race results for event ${eventHash} (skipped: ${skippedResults})...`);
  updatedAthleteIds.push(...cleanRaceResults2.map((r) => r.athleteUciId));
  await data_default.update.athletesRacesResults(cleanRaceResults2, { year, eventHash });
  return { athleteIds: updatedAthleteIds };
};

// upgrade-points/extract.ts
var logger7 = logger_default.child({ parser: SCRIPT_NAME });
var extractUpgradePoints = async ({ year, eventHashes }) => {
  logger7.info(`Extracting athletes upgrade points for year ${year} (${eventHashes.length} events)...`);
  const { allUpgradePoints } = await extractAllEventsUpgradePoints(eventHashes, year);
  await saveAllUpgradePoints(allUpgradePoints, year);
};
var extractAllEventsUpgradePoints = async (eventHashes, year) => {
  const promises = await Promise.allSettled(eventHashes.map(async (eventHash) => extractUpgradePointsFromEvent(eventHash, year)));
  const allUpgradePoints = {};
  promises.forEach((parseResult, i) => {
    const eventHash = eventHashes[i];
    if (parseResult.status === "fulfilled") {
      const upgradePoints = parseResult.value;
      allUpgradePoints[eventHashes[i]] = upgradePoints;
      if (DEBUG) logger7.info(`${eventHash} (${year}): ${upgradePoints.length} athletes upgrade points found`);
    } else {
      logger7.error(`Error while processing event upgrade points: ${parseResult.reason}`, {
        hash: eventHashes[i],
        year,
        error: parseResult.reason
      });
    }
  });
  return { allUpgradePoints };
};
var extractUpgradePointsFromEvent = async (eventHash, year) => {
  const eventRaceResults = await data_default.get.athletesRacesResults({ eventHash, year });
  if (!eventRaceResults || eventRaceResults.length === 0) return [];
  const { eventType } = eventRaceResults[0];
  const upgradePointsType = hasUpgradePoints(eventType);
  if (!upgradePointsType) {
    logger7.warn(`Event ${eventHash} (${year}) of type ${eventType} does not have upgrade points, skipping extraction`);
    return [];
  }
  const athleteUpgradePoints = [];
  eventRaceResults.forEach((raceResult) => {
    if (!raceResult.upgradePoints) return;
    athleteUpgradePoints.push({
      ...raceResult,
      points: raceResult.upgradePoints,
      fieldSize: raceResult.fieldSize,
      type: upgradePointsType
    });
  });
  return athleteUpgradePoints;
};
var saveAllUpgradePoints = async (allUpgradePoints, year) => {
  const promises = await Promise.allSettled(
    Object.entries(allUpgradePoints).map(
      ([eventHash, upgradePoints]) => data_default.update.rawAthletesUpgradePoints(upgradePoints, { eventHash, year })
    )
  );
  promises.forEach((result, i) => {
    const eventHash = Object.keys(allUpgradePoints)[i];
    const upgradePoints = allUpgradePoints[eventHash];
    if (result.status === "fulfilled") {
      logger7.info(`Saved ${upgradePoints.length} raw upgrade points for event ${eventHash}`);
    } else {
      logger7.error(`Error while saving raw upgrade points: ${result.reason}`, {
        hash: eventHash,
        year,
        error: result.reason
      });
    }
  });
};

// upgrade-points/clean.ts
var logger8 = logger_default.child({ parser: SCRIPT_NAME });
var cleanUpgradePoints = async ({ year, eventHashes }) => {
  logger8.info(`Cleaning athletes upgrade points for year ${year} (${eventHashes.length} events)...`);
  const promises = await Promise.allSettled(eventHashes.map(async (eventHash) => cleanEventUpgradePoints(eventHash, year)));
  promises.forEach((promise, i) => {
    if (promise.status !== "fulfilled") {
      logger8.error(`Error while cleaning event upgrade points: ${promise.reason}`, {
        year,
        eventHash: eventHashes[i],
        error: promise.reason
      });
    }
  });
};
var cleanEventUpgradePoints = async (eventHash, year) => {
  const [
    rawUpgradePoints,
    existingUpgradePoints
  ] = await Promise.all([
    data_default.get.rawAthletesUpgradePoints(eventHash, year),
    data_default.get.athletesUpgradePoints({ eventHash, year })
  ]);
  let consolidatedUpgradePoints = [
    ...existingUpgradePoints
  ];
  rawUpgradePoints.forEach((athleteUpgradePoint) => {
    const { athleteUciId, eventHash: eventHash2, category } = athleteUpgradePoint;
    const existingPoint = consolidatedUpgradePoints.findIndex((point) => point.athleteUciId === athleteUciId && point.eventHash === eventHash2 && point.category === category);
    if (existingPoint === -1) {
      consolidatedUpgradePoints.push(athleteUpgradePoint);
    } else {
      consolidatedUpgradePoints[existingPoint] = athleteUpgradePoint;
    }
  });
  const oneYearAgo = new Date((/* @__PURE__ */ new Date()).setFullYear((/* @__PURE__ */ new Date()).getFullYear() - 1)).toLocaleDateString("sv", { timeZone: "America/Vancouver" }).slice(0, 10);
  consolidatedUpgradePoints = consolidatedUpgradePoints.filter((point) => point.date >= oneYearAgo);
  logger8.info(`Saving upgrade points for ${consolidatedUpgradePoints.length} athletes for event ${eventHash}`);
  await data_default.update.athletesUpgradePoints(consolidatedUpgradePoints, { eventHash, year });
};

// upgrade-dates/process.ts
var FIRST_RECORD_DATE = "2025-06-12";
var logger9 = logger_default.child({ parser: SCRIPT_NAME });
var processAthletesUpgradeDates = async ({ athleteIds }) => {
  const [
    allAthletes,
    athletesCategories,
    athletesUpgradeDates,
    athletesOverrides
  ] = await Promise.all([
    data_default.get.baseAthletes(),
    data_default.get.athletesCategories(),
    data_default.get.athletesUpgradeDates(),
    data_default.get.athletesOverrides()
  ]);
  let updatedAthletes = allAthletes.filter(({ uciId }) => athleteIds.includes(uciId));
  const athletesCategoriesByUciId = keyBy_default(athletesCategories, "athleteUciId");
  const athletesUpgradeDatesByUciId = groupBy_default(athletesUpgradeDates, "athleteUciId");
  updatedAthletes = updatedAthletes.map((athlete) => {
    const athleteCategory = athletesCategoriesByUciId[athlete.uciId];
    const previousUpgradeDates = athletesUpgradeDatesByUciId[athlete.uciId] || [];
    const latestUpgrade = findUpgradeDate(athlete, {
      categories: athleteCategory,
      previousUpgradeDates,
      athletesOverrides
    });
    return {
      ...athlete,
      latestUpgrade
    };
  });
  logger9.info(`Total athletes processed: ${updatedAthletes.length}`);
  try {
    logger9.info(`Saving ${updatedAthletes.length} athletes with updated upgrade dates`);
    await data_default.update.baseAthletes(updatedAthletes);
  } catch (error) {
    logger9.error(`Failed to save athletes: ${error.message}`, { error });
  }
};
var findUpgradeDate = (athlete, { categories, previousUpgradeDates, athletesOverrides }) => {
  const upgradeDates = {};
  for (const discipline of ["ROAD", "CX"]) {
    if (athletesOverrides.levelUpgradeDates?.[athlete.uciId]) {
      const upgradeDate = athletesOverrides.levelUpgradeDates[athlete.uciId].find((upgrade) => upgrade.discipline === discipline && upgrade.level === athlete.skillLevel?.[discipline]);
      if (upgradeDate) upgradeDates[discipline] = { date: upgradeDate.date, confidence: 1 };
      continue;
    }
    let possibleUpgradeDates = [];
    const currentLevel = athlete.skillLevel?.[discipline] ? +athlete.skillLevel[discipline] : null;
    if (!currentLevel || currentLevel === 5) continue;
    Object.entries(categories?.skillLevels?.[discipline] || {}).forEach(([date]) => {
      possibleUpgradeDates.push({
        date,
        // 2025-06-12 is the first record of athlete skill levels in the database,
        // so we assume that the confidence is lower for this date.
        // After that date, we assume higher confidence because the athlete memberships data is queried weekly.
        confidence: date === FIRST_RECORD_DATE ? 0.4 : 0.8
      });
    });
    const matchingPreviousUpgradeDate = previousUpgradeDates.find((d) => d.discipline === discipline);
    if (matchingPreviousUpgradeDate) possibleUpgradeDates.push({
      date: matchingPreviousUpgradeDate.date,
      confidence: matchingPreviousUpgradeDate.confidence
    });
    possibleUpgradeDates = possibleUpgradeDates.sort((a, b) => a.date.localeCompare(b.date));
    upgradeDates[discipline] = possibleUpgradeDates[possibleUpgradeDates.length - 1];
    if (DEBUG && upgradeDates[discipline]) {
      logger9.info(`${athlete.uciId} - ${athlete.firstName} ${athlete.lastName} (cat ${athlete.skillLevel?.[discipline]}): estimated category upgrade date on ${upgradeDates[discipline].date} (confidence: ${upgradeDates[discipline].confidence})`);
    }
  }
  return upgradeDates;
};

// teams/extract.ts
var logger10 = logger_default.child({ parser: SCRIPT_NAME });
var extractAthletesTeams = async ({ year, eventHashes }) => {
  await TeamParser.init();
  const rawAthletesTeamsForYear = await data_default.get.rawAthletesTeams(year);
  const extractionResults = await Promise.allSettled(eventHashes.map(async (eventHash) => {
    const eventRaceResults = await data_default.get.athletesRacesResults({ eventHash, year });
    const allAthletesTeams = {};
    eventRaceResults.forEach(({ athleteUciId, date, teamName }) => {
      if (!teamName) return;
      if (!allAthletesTeams[athleteUciId]) allAthletesTeams[athleteUciId] = {};
      const team = TeamParser.getTeamByName(teamName);
      if (team) {
        allAthletesTeams[athleteUciId][date] = { id: team.id, name: team.name };
      } else {
        allAthletesTeams[athleteUciId][date] = { name: teamName };
      }
    });
    return allAthletesTeams;
  }));
  const combinedAthletesTeams = rawAthletesTeamsForYear;
  extractionResults.forEach((parseResult, i) => {
    if (parseResult.status === "fulfilled") {
      Object.entries(parseResult.value).forEach(([athleteUciId, athleteTeams]) => {
        if (!combinedAthletesTeams[athleteUciId]) {
          combinedAthletesTeams[athleteUciId] = athleteTeams;
        } else {
          combinedAthletesTeams[athleteUciId] = { ...combinedAthletesTeams[athleteUciId], ...athleteTeams };
        }
      });
    } else {
      logger10.error(`Error while processing athlete teams from event results: ${parseResult.reason}`, {
        hash: eventHashes[i],
        year,
        error: parseResult.reason
      });
    }
  });
  try {
    logger10.info(`Saving ${Object.keys(combinedAthletesTeams).length} raw athletes teams for year ${year}`);
    await data_default.update.rawAthletesTeams(combinedAthletesTeams, { year });
  } catch (error) {
    logger10.error(`Failed to save extracted teams: ${error.message}`, { error });
  }
};

// teams/clean.ts
var logger11 = logger_default.child({ parser: SCRIPT_NAME });
var currentYear2 = (/* @__PURE__ */ new Date()).getFullYear();
var cleanAthletesTeams = async ({ athleteIds, year }) => {
  await TeamParser.init();
  const [
    allAthletes,
    rawAthletesTeamsForYear,
    rawAthletesTeamsForPreviousYear
  ] = await Promise.all([
    data_default.get.baseAthletes(),
    data_default.get.rawAthletesTeams(year),
    data_default.get.rawAthletesTeams(year - 1)
  ]);
  let updatedAthletes = allAthletes.filter(({ uciId }) => athleteIds.includes(uciId));
  updatedAthletes = updatedAthletes.map((athlete) => {
    const { uciId: athleteUciId } = athlete;
    const athleteTeams = {
      ...rawAthletesTeamsForYear[athleteUciId] || {},
      ...rawAthletesTeamsForPreviousYear[athleteUciId] || {}
    };
    const years = [...new Set(Object.keys(athleteTeams).map((date) => +date.slice(0, 4)))];
    if (!years.includes(currentYear2)) years.push(currentYear2);
    const athleteTeamByYears = {};
    years.forEach((year2) => {
      const team = resolveAthleteTeamForYear(year2, athleteTeams, athleteUciId);
      if (team) athleteTeamByYears[year2] = {
        id: team.id,
        name: team.name
      };
    });
    return {
      ...athlete,
      teams: athleteTeamByYears
    };
  });
  logger11.info(`Total athletes processed: ${updatedAthletes.length}`);
  try {
    logger11.info(`Saving ${updatedAthletes.length} athletes with updated teams`);
    await data_default.update.baseAthletes(updatedAthletes);
  } catch (error) {
    logger11.error(`Failed to save athletes: ${error.message}`, { error });
  }
};
var resolveAthleteTeamForYear = (year, athleteTeams, athleteUciId) => {
  const uniqueTeamsForCurrentYear = getUniqueTeamsForYear(year, athleteTeams);
  if (uniqueTeamsForCurrentYear.length === 0) {
    const uniqueTeamsForPreviousYear = getUniqueTeamsForYear(year - 1, athleteTeams);
    if (uniqueTeamsForPreviousYear.length === 1) return uniqueTeamsForPreviousYear[0];
    return;
  } else if (uniqueTeamsForCurrentYear.length === 1) {
    return uniqueTeamsForCurrentYear[0];
  } else if (uniqueTeamsForCurrentYear.length > 1 && Object.keys(athleteTeams).length >= 2) {
    const dates = Object.keys(athleteTeams).sort();
    const lastTwoTeams = [
      athleteTeams[dates.reverse()[0]],
      athleteTeams[dates.sort().reverse()[1]]
    ];
    if (lastTwoTeams[0].name === lastTwoTeams[1].name) {
      return lastTwoTeams[0];
    } else {
      const yearSubset = dates.filter((date) => +date.slice(0, 4) === year).reduce((acc, date) => {
        acc[date] = athleteTeams[date];
        return acc;
      }, {});
      const teamsForCurrentYear = Object.keys(yearSubset).map((date) => athleteTeams[date]);
      const previousOccurrences = [...teamsForCurrentYear].reverse().filter((team) => team.id !== lastTwoTeams[0].id);
      if (previousOccurrences.length >= 2) {
        return previousOccurrences[0];
      } else {
        const previousOccurrences2 = [...teamsForCurrentYear].reverse().filter((team) => team.id !== lastTwoTeams[1].id);
        if (previousOccurrences2.length >= 2) {
          return previousOccurrences2[1];
        }
      }
    }
  }
  logger11.warn(`Multiple teams found for athlete in year ${year}: ${uniqueTeamsForCurrentYear.join(", ")}`, {
    athleteUciId
  });
};
var getUniqueTeamsForYear = (year, athleteTeams) => {
  const dates = Object.keys(athleteTeams);
  const yearSubset = dates.filter((date) => +date.slice(0, 4) === year).reduce((acc, date) => {
    acc[date] = athleteTeams[date];
    return acc;
  }, {});
  const teamsForYear = Object.keys(yearSubset).map((date) => athleteTeams[date]);
  return [...new Set(teamsForYear.map((team) => team.name))].map((teamName) => {
    const team = TeamParser.getTeamByName(teamName);
    return {
      id: team?.id,
      name: teamName
    };
  });
};

// views/athletes.ts
var logger12 = logger_default.child({ parser: SCRIPT_NAME });
var createViewAthletes = async ({ athleteIds }) => {
  const [
    allBaseAthletes,
    allAthleteManualEdits
  ] = await Promise.all([
    data_default.get.baseAthletes(),
    data_default.get.athleteManualEdits()
  ]);
  let updatedAthletes = allBaseAthletes.filter(({ uciId }) => athleteIds.includes(uciId));
  updatedAthletes = updatedAthletes.map((baseAthlete) => {
    let athleteUciId = baseAthlete.uciId;
    const manualEdit = allAthleteManualEdits.find((edit) => edit.uciId === athleteUciId);
    if (manualEdit) {
      const mergedAthlete = {
        ...baseAthlete,
        ...omit_default(manualEdit, ["uciId"])
      };
      const changedFields = diff_default(baseAthlete, mergedAthlete);
      if (DEBUG && Object.keys(changedFields).length > 0) {
        logger12.info(`Applying manual edit for athlete ${baseAthlete.firstName} ${baseAthlete.lastName} (${athleteUciId}), changed fields: ${Object.keys(changedFields).join(", ")}`);
      }
      return mergedAthlete;
    }
    return baseAthlete;
  });
  await data_default.update.viewAthletes(updatedAthletes);
};

// views/athlete-profiles.ts
var logger13 = logger_default.child({ parser: SCRIPT_NAME });
var createViewAthleteProfiles = async ({ athleteIds, year, eventHashes }) => {
  const allEvents = await data_default.get.events({ year, eventHashes }, { summary: false });
  const keyedEvents = keyBy_default(allEvents, "hash");
  await processAthletesRaces(athleteIds, keyedEvents, { year, eventHashes });
  await processAthletesUpgradePoints(athleteIds, keyedEvents, { year, eventHashes });
};
var processAthletesRaces = async (athleteIds, events, { year, eventHashes }) => {
  const allAthletesRacesResults = await data_default.get.athletesRacesResults({ eventHashes, year });
  const allAthletesRacesResultsByAthlete = groupBy_default(allAthletesRacesResults, "athleteUciId");
  const promises = await Promise.allSettled(athleteIds.map(async (athleteUciId) => {
    let profile = await data_default.get.athleteProfile(athleteUciId);
    if (!profile) profile = {
      uciId: athleteUciId
    };
    const athleteRaceResults = allAthletesRacesResultsByAthlete[athleteUciId] || [];
    const shapedRaces = athleteRaceResults.map((race) => {
      const event = events[race.eventHash];
      if (!event) {
        logger13.error(`Event not found for event: ${race.eventHash}`);
        return null;
      }
      const categoryLabel = event.categories.find((c) => c.alias === race.category)?.label;
      if (!categoryLabel) {
        logger13.error(`Category not found for event: ${race.eventHash}`);
        return null;
      }
      return {
        ...omit_default(race, ["athleteUciId", "firstName", "lastName", "fieldSize", "upgradePoints"]),
        eventName: event.name,
        categoryLabel
      };
    }).filter((race) => !!race);
    profile.races = [
      // Keep existing races that are not related to the processed events, and add the newly shaped ones
      ...(profile.races || []).filter((race) => !eventHashes.includes(race.eventHash)),
      ...shapedRaces
    ];
    if (DEBUG) logger13.info(`Saving athlete profile (races) for ${athleteUciId}`);
    return data_default.update.athleteProfile(profile);
  }));
  promises.forEach((result, i) => {
    const athleteUciId = athleteIds[i];
    if (result.status === "rejected") {
      logger13.error(`Error while compiling races for athlete profile for ${athleteUciId}:` + result.reason, {
        error: result.reason,
        athleteUciId
      });
    }
  });
};
var processAthletesUpgradePoints = async (athleteIds, events, { year, eventHashes }) => {
  const allAthletesUpgradePoints = await data_default.get.athletesUpgradePoints({ eventHashes, year });
  const allAthletesUpgradePointsByAthlete = groupBy_default(allAthletesUpgradePoints, "athleteUciId");
  const promises = await Promise.allSettled(athleteIds.map(async (athleteUciId) => {
    let profile = await data_default.get.athleteProfile(athleteUciId);
    if (!profile) profile = {
      uciId: athleteUciId
    };
    const athleteUpgradePoints = allAthletesUpgradePointsByAthlete[athleteUciId] || [];
    const shapedUpgradePoints = athleteUpgradePoints.map((point) => {
      const event = events[point.eventHash];
      if (!event) {
        logger13.error(`Event not found for event: ${point.eventHash}`);
        return null;
      }
      const categoryLabel = event.categories.find((c) => c.alias === point.category)?.label;
      if (!categoryLabel) {
        logger13.error(`Category not found for event: ${point.eventHash}`);
        return null;
      }
      return {
        ...omit_default(point, ["athleteUciId"]),
        eventName: event.name,
        categoryLabel
      };
    }).filter((point) => !!point);
    profile.upgradePoints = [
      // Keep existing upgrade points that are not related to the processed events, and add the newly shaped ones
      ...(profile.upgradePoints || []).filter((point) => !eventHashes.includes(point.eventHash)),
      ...shapedUpgradePoints
    ];
    if (DEBUG) logger13.info(`Saving athlete profile (upgrade points) for ${athleteUciId}`);
    return data_default.update.athleteProfile(profile);
  }));
  promises.forEach((result, i) => {
    const athleteUciId = athleteIds[i];
    if (result.status === "rejected") {
      logger13.error(`Error while compiling upgrade points for athlete profile for ${athleteUciId}:` + result.reason, {
        error: result.reason,
        athleteUciId
      });
    }
  });
};

// views/recently-upgraded-athletes.ts
var logger14 = logger_default.child({ parser: SCRIPT_NAME });
var createViewRecentlyUpgradedAthletes = async () => {
  const allathletes = await data_default.get.viewAthletes();
  const recentlyUpgradedAthletes = [];
  ["ROAD", "CX"].forEach((discipline) => {
    allathletes.forEach((athlete) => {
      if (athlete.latestUpgrade?.[discipline]) {
        const latestUpgrade = athlete.latestUpgrade[discipline];
        if (latestUpgrade.confidence < 0.5) return;
        const lastUpgrade = new Date(latestUpgrade.date);
        const now = /* @__PURE__ */ new Date();
        const diffInDays = Math.floor((now.getTime() - lastUpgrade.getTime()) / (1e3 * 60 * 60 * 24));
        if (diffInDays <= 7) {
          recentlyUpgradedAthletes.push({
            athleteUciId: athlete.uciId,
            date: latestUpgrade.date,
            skillLevel: athlete.skillLevel?.[discipline],
            discipline
          });
        }
      }
    });
  });
  logger14.info(`Total athletes processed: ${allathletes.length}`);
  try {
    logger14.info(`Uploading ${recentlyUpgradedAthletes.length} recently upgraded athletes view`);
    await data_default.update.viewRecentlyUpgradedAthletes(recentlyUpgradedAthletes);
  } catch (error) {
    console.trace(error);
    logger14.error(`Failed to save recently upgraded athletes view: ${error.message}`, { error });
  }
};

// index.ts
var handler = async (event, _) => {
  const options = { year: (/* @__PURE__ */ new Date()).getFullYear() };
  console.log("Processing data with options:", JSON.stringify(options));
  await TeamParser.init();
  const { eventHashes: athleteEventHashes } = await extractAthletes(options);
  const updatedAthleteIds = await cleanAthletes({ year: options.year, eventHashes: athleteEventHashes });
  await createAthleteLookupTable();
  await AthleteFinder.init();
  const { eventHashes: raceResultsEventHashes } = await extractRaceResults(options);
  const { athleteIds: updatedRaceAthleteIds } = await cleanRaceResults({
    year: options.year,
    eventHashes: raceResultsEventHashes
  });
  await extractUpgradePoints({ year: options.year, eventHashes: raceResultsEventHashes });
  await cleanUpgradePoints({
    year: options.year,
    eventHashes: raceResultsEventHashes
  });
  const allUpdatedAthleteIds = Array.from(/* @__PURE__ */ new Set([...updatedAthleteIds, ...updatedRaceAthleteIds]));
  await extractAthletesTeams({ year: options.year, eventHashes: raceResultsEventHashes });
  await cleanAthletesTeams({ athleteIds: allUpdatedAthleteIds, year: options.year });
  await processAthletesUpgradeDates({ athleteIds: allUpdatedAthleteIds });
  await createViewAthletes({ athleteIds: allUpdatedAthleteIds });
  await createViewAthleteProfiles({
    athleteIds: allUpdatedAthleteIds,
    year: options.year,
    eventHashes: raceResultsEventHashes
  });
  await createViewRecentlyUpgradedAthletes();
  return {
    statusCode: 200,
    body: JSON.stringify({
      year: options.year
      // extractedAthletes: extractedAthletes.length,
      // extractedUpgradePoints: extractedUpgradePoints.length,
      // cleanedAthletes: Object.keys(cleanedAthleteData).length,
      // cleanedAthleteUpgradePoints: Object.keys(cleanedAthleteUpgradePoints).length,
      // cleanedAthleteRaces: Object.keys(cleanedAthleteRaces).length,
    })
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*! Bundled license information:

lodash-es/lodash.js:
lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)
*/
//# sourceMappingURL=index.js.map
