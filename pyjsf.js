/**
 * Python interpreter for expressions.
 */
jsf.PythonInterpreter = function() {
};


/**
 * Try int, otherwise string...
 */
jsf.PythonInterpreter.prototype.typeValue = function(val) {

  if (val === undefined) {
    return 'None';
  }

  intVal = parseInt(val);

  if (!isNaN(intVal)) {
    return val;
  } else if (!val) {
    return "''";
  } else {
    return "'" + val + "'";
  }
};


/**
 * Evaluate the code provided.
 * @param expr Expression to evaluate
 * @param data Data dict as returned by jQuery(form).serializeArray()
 * @param def Default value
 */
jsf.PythonInterpreter.prototype.eval = function(expr, data, def) {

  var code = "def run():\n";
  var self = this;

  $.each(data, function(key, value) {
    code += "  " + key + "= " + self.typeValue(value) + ";\n";
  });

  code += "  return " + expr;

  try {
    var mod = Sk.importMainWithBody("<stdin>", 0, code);
    var func = mod.tp$getattr("run");
    var res = Sk.misceval.callsim(func);

    return res.v;
  } catch (e) {
    console.log(e);
    return def;
  }
};
