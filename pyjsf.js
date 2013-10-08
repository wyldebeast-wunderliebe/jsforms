/**
 * Python interpreter for expressions.
 */
jsf.PythonInterpreter = function() {
};


/**
 * Evaluate the code provided.
 * @param expr Expression to evaluate
 * @param data Data dict as returned by jQuery(form).serializeArray()
 * @param def Default value
 */
jsf.PythonInterpreter.prototype.eval = function(expr, data, def) {

  var code = "def run():\n";

  for (var i = 0; i < data.length; i++) {
    code += "  " + data[i].name + "= " + (data[i].value || 'None') + ";\n"
  }

  code += "  return " + expr;

  try {
    var mod = Sk.importMainWithBody("<stdin>", 0, code);
    var func = mod.tp$getattr("run");
    var res = Sk.misceval.callsim(func);

    return res.v;
  } catch (e) {
    return def;
  }
};
