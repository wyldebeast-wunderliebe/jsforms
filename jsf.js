var jsf = {};


/**
 * JavaScript interpreter for expressions.
 */
jsf.JavaScriptInterpreter = function() {
};


/**
 * Try int, otherwise string...
 */
jsf.JavaScriptInterpreter.prototype.typeValue = function(val) {

  if (val == undefined) {
    return 'undefined';
  }

  if (parseInt(val) === val) {
    return val;
  }

  return "'" + val + "'";
};


/**
 * Evaluate the code provided.
 * @param expr Expression to evaluate
 * @param data Data dict as returned by jQuery(form).serializeArray()
 * @param def Default value
 */
jsf.JavaScriptInterpreter.prototype.eval = function(expr, data, def) {

  var code = "";

  for (var i = 0; i < data.length; i++) {
    code += data[i].name + "= " + this.typeValue(data[i].value) + ";\n";
  }

  code += expr;

  try {
    return eval(code);
  } catch (e) {
    return def;
  }
};


/**
 * The Validator class wraps a form and takes care of validation on
 * init, on changes and on submit.
 * @param form jQuery form
 * @param options Array of overrides for the validator class.
 */
jsf.Validator = function(form, options) {

  var self = this;

  self.interpreter = new jsf.JavaScriptInterpreter();
  self.form = form;
  self.valid = true;

  $.extend(self, options);

  // Do initial round to calulate relevance, requiredness, etc.
  self.validate();

  self.form.find(":input").change(function() {
      self.validate();
    });
  
  self.form.submit(function(e) {
      
      try {  
        self.validate(true);
      }
      catch(e) {
        // pass
      }
      
      return self.valid;
    });
};


/**
 * Selector that finds the element whereupon callbacks
 * operate. Override this if you use, for example, div's around your
 * input elements.
 * @param elt Input element that triggered the callback
 */
jsf.Validator.prototype.selectInput = function(elt) {

  return elt;
};


/**
 * Called whenever some input is required or unrequired.
 * @param elt Input element that was validated
 * @param req boolean specifying requiredness
 */
jsf.Validator.prototype.requiredCallback = function(elt, req) {

  elt = this.selectInput(elt);

  if (req) {
    elt.addClass("required");
  } else {
    elt.removeClass("required");
  }
};


/**
 * Called whenever some input's relevance changes
 * @param elt Input element that was validated
 * @param req boolean specifying relevance
 */
jsf.Validator.prototype.relevantCallback = function(elt, rel) {

  elt = this.selectInput(elt);

  if (rel) {
    elt.removeClass("irrelevant");
  } else {
    elt.addClass("irrelevant");
  }
};


/**
 * Called when constraints are checked.
 * @param elt Input element that was checked
 * @param ok Whether the constraint was met or not
 */
jsf.Validator.prototype.constraintCallback = function(elt, ok) {

  elt = this.selectInput(elt);

  if (!ok) {
    elt.addClass("constraint-error");
  } else {
    elt.removeClass("constraint-error");
  }
};


/**
 * Called when readonly-ness is checked
 * @param elt Input element that triggered the callback
 * @param ro Read only or not
 */
jsf.Validator.prototype.readonlyCallback = function(input, ro) {

  elt = this.selectInput(input);

  if (ro) {
    elt.addClass("readonly");
    input.attr('disabled','disabled');
  } else {
    elt.removeClass("readonly");
    input.removeAttr('disabled');
  }
};


/**
 * Calculate callback upon calculations
 * @param elt Input element that triggered the callback
 * @param val Value that was calculated
 */
jsf.Validator.prototype.calculateCallback = function(elt, val) {

  elt.val(val);
};


/**
 * Called when an error is found.
 * @param elt Input element that has the error
 * @param err Error or not
 * @param errType One of "required", "constraint"
 */
jsf.Validator.prototype.errorCallback = function(elt, err, errType) {

  elt = this.selectInput(elt);
  
  if (err) {
    elt.addClass("error");
  } else {
    elt.removeClass("error");
  }
};


/**
 * Do the actual validation
 * @param processErrors Do error handling.
 */
jsf.Validator.prototype.validate = function(processErrors) {

  var self = this;
  var data = self.form.serializeArray();

  self.valid = true;

  self.form.find(":input").filter(function() { return $(this).attr('jsf:required'); }).each(function() {
      self.checkRequired($(this), data, processErrors);
    });

  self.form.find(":input").filter(function() { return $(this).attr('jsf:relevant'); }).each(function() {
      self.checkRelevant($(this), data);
    });
  
  self.form.find(":input").filter(function() { return $(this).attr('jsf:readonly'); }).each(function() {
      self.checkReadonly($(this), data);
    });

  self.form.find(":input").filter(function() { return $(this).attr('jsf:constraint'); }).each(function() {
      self.checkConstraint($(this), data, processErrors);
    });

  self.form.find(":input").filter(function() { return $(this).attr('jsf:calculate'); }).each(function() {
      self.calculate($(this), data);
    });
};


/**
 * Check whether the inout has a value. This is different for input
 * types, e.g. checkboxes.
 */
jsf.Validator.prototype.hasValue = function(input) {

  if (input.is(":checkbox")) {
    return input.is(":checked");
  } else {
    return input.val();
  }
};


/**
 * Check on requiredness
 * @param input Element to check
 * @param data jQuery data array
 * @param processErrors Do error handling or skip
 */
jsf.Validator.prototype.checkRequired = function(input, data, processErrors) {

  var required = this.eval(input.attr("jsf:required"), data, false);

  this.requiredCallback(input, required);

  if (processErrors) {
    this.errorCallback(input, required && !input.val(), "required");
  }

  if (required && !this.hasValue(input)) {
    this.valid = false;
  }
};


/**
 * Check on relevance
 * @param input Element to check
 * @param data jQuery data array
 */
jsf.Validator.prototype.checkRelevant = function(input, data) {

  var relevant = this.eval(input.attr("jsf:relevant"), data, true);

  this.relevantCallback(input, relevant);
};


/**
 * Check whether input should be read-only
 * @param input Element to check
 * @param data jQuery data array
 */
jsf.Validator.prototype.checkReadonly = function(input, data) {

  var readonly = this.eval(input.attr("jsf:readonly"), data, false);

  this.readonlyCallback(input, readonly);
};


/**
 * Check whether input value meets constraint
 * @param input Element to check
 * @param data jQuery data array
 * @param processErrors Do error handling or skip
 */
jsf.Validator.prototype.checkConstraint = function(input, data, processErrors) {

  var ok = this.eval(input.attr("jsf:constraint"), data, true);

  this.constraintCallback(input, ok);

  if (processErrors) {
    this.errorCallback(input, !ok, "constraint");
  }

  if (!ok) {
    this.valid = false;
  }
};


/**
 * Calculate input value
 * @param input Element to check
 * @param data jQuery data array
 */
jsf.Validator.prototype.calculate = function(input, data) {

  var value = this.eval(input.attr("jsf:calculate"), data);

  this.calculateCallback(input, value);
};


/**
 * Wrapper around the interpreter, so as to keep this pluggable.
 * @param expr Expression to evaluate
 * @param data Expression context data
 * @param def Default value
 */
jsf.Validator.prototype.eval = function(expr, data, def) {

  return this.interpreter.eval(expr, data, def);
};


$.fn.extend({jsf: function(options) { 
      this.each(function() {new jsf.Validator($(this), options) })}});
