/**
 * The JSF functions enable client side validation of forms, with
 * respect to relevance, requiredness, read-only-ness, calculated
 * values and constraints. These notions can be applied on a control,
 * or on a fieldset.
 */

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

  if (val === undefined) {
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

  try {
    return (new Function("with(this) { return " + expr + "}")).call(data);
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

  // list of inputs that actually DO something to others
  self.effective_inputs = [];
  self.check_inputs = [];

  self.interpreter = new jsf.JavaScriptInterpreter();
  self.form = form;
  self.valid = true;

  // Some settings
  self.requiredClass = "required";
  self.errorClass = "error";
  self.irrelevantClass = "irrelevant";
  self.readonlyClass = "readonly";
  self.constraintClass = "constraint-violation";

  $.extend(self, options);

  self.init();

  // Do initial round to calulate relevance, requiredness, etc.
  self.validate();

  self.form.find(":input").change(function(e) {

      var input = $(e.currentTarget);
      self.validate(false, self.effective_inputs[input.attr("name")] || []);
  });
  
  self.form.submit(function(e) {
      
      try {  
        self.validate(true);
      }
      catch(err) {
        // pass
      }

      return self.valid;
    });
};


/**
 * Preform some rough checking on potential variables in the expression.
 * @param input The input that holds the expression
 * @param expr Expression
 */
jsf.Validator.prototype.findEffectiveInputs = function(input, expr) {

    var self = this;
    var matches = expr.match(/\w+/g);

    if (matches) {
        for (var i = 0; i < matches.length; i++) {
            if (self.form.find(":input[name='" + matches[i] + "']").length) {
                if (!self.effective_inputs[matches[i]]) {
                    self.effective_inputs[matches[i]] = [];
                }
                self.effective_inputs[matches[i]].push(input);
            }
        }
    }
};


/**
 * Initialize validator
 */
jsf.Validator.prototype.init = function() {

  var self = this;
  var input, other_input, expr;

  self.form.find(":input,fieldset,.form-group").each(function() {

      input = $(this);

      if (self.getExpression(input, "required")) {
          self.check_inputs.push(input);
          self.findEffectiveInputs(input,
                                   self.getExpression(input, "required"));
      } 

      if (self.getExpression(input, "relevant")) {
          self.check_inputs.push(input);
          self.findEffectiveInputs(input,
                                   self.getExpression(input, "relevant"));
      }

      if (self.getExpression(input, "constraint")) {
          self.check_inputs.push(input);         
          self.findEffectiveInputs(input,
                                   self.getExpression(input, "required"));
      } 

      if (self.getExpression(input, "calculate")) {
          self.check_inputs.push(input);
          self.findEffectiveInputs(input,
                                   self.getExpression(input, "required"));
      }

      if (self.getExpression(input, "readonly")) {
          self.check_inputs.push(input);         
          self.findEffectiveInputs(input,
                                   self.getExpression(input, "required"));
      }
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
    elt.addClass(this.requiredClass);
  } else {
    elt.removeClass(this.requiredClass);
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
    elt.removeClass(this.irrelevantClass);
  } else {
    elt.addClass(this.irrelevantClass);
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
    elt.addClass(this.constraintClass);
  } else {
    elt.removeClass(this.constraintClass);
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
    elt.addClass(this.readonlyClass);
    input.attr('disabled','disabled');
  } else {
    elt.removeClass(this.readonlyClass);
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
    elt.addClass(this.errorClass);
  } else {
    elt.removeClass(this.errorClass);
  }
};


/**
 * Do the actual validation
 * @param processErrors Do error handling.
 */
jsf.Validator.prototype.validate = function(processErrors, inputs) {

  var self = this;
  var data = {};
  var input;

  self.valid = true;

  self.form.addClass("validate");

  if (inputs === undefined) {
    inputs = self.check_inputs;
  }

  self.form.find(":input").each(function() {          
    data[$(this).attr("name")] = self.getValue($(this));
  });

  for (var i = 0; i < inputs.length; i++) {

    input = inputs[i];

    if (self.checkRelevant(input, data)) {
      self.checkRequired(input, data, processErrors);
    }
    self.checkReadonly(input, data);
    self.checkConstraint(input, data, processErrors);
    self.calculate(input, data);
  };

  self.form.removeClass("validate");
};


/**
 * Check whether the input has a value. This is different for input
 * types, e.g. checkboxes and radio. If the given input is a group,
 * check all descendant elements.
 * @param input Input element (jQuery wrapped)
 */
jsf.Validator.prototype.hasValue = function(input) {

  var self = this;

  if (input.is(":checkbox")) {
    return input.is(":checked");
  } else if (input.is(":radio")) {
    return this.form.find(":radio[name=" + input.attr("name") + "]:checked").length;
  } else if (input.is(".form-group") || input.is("fieldset")) {

    var hasVal = false;

    input.find(":input").each(function() {

      if (self.hasValue($(this))) {
        hasVal = true;
      }
    });

    return hasVal;

  } else {
    return input.val();
  }
};


/**
 * Get the input value. This is different for input types,
 * e.g. checkboxes and radio.
 */
jsf.Validator.prototype.getValue = function(input) {

  if (input.is(":checkbox")) {
    return input.is(":checked");
  } else if (input.is(":radio")) {
      return this.form.find(":radio[name=" + input.attr("name") + "]:checked").val();
  } else {
    return input.val();
  }
};


/**
 * Get the epression for the given type.
 * @param input Input element
 * @param type One of required, relevant, readonly, constraint or calculate
 */
jsf.Validator.prototype.getExpression = function(input, type) {
  
  return input.attr("jsf:" + type) || "";
};


/**
 * Check on requiredness
 * @param input Element to check
 * @param data jQuery data array
 * @param processErrors Do error handling or skip
 */
jsf.Validator.prototype.checkRequired = function(input, data, processErrors) {

  var self = this;

  var required_expr = self.getExpression(input, 'required');
   
  if (!required_expr) {
    return false;
  }
    
  var required = self.eval(required_expr, data, false);

  self.requiredCallback(input, required);

  if (processErrors) {
    self.errorCallback(input, required && !self.hasValue(input), "required");
  }

  if (required && !self.hasValue(input)) {
    self.valid = false;
  }

  return required;
};


/**
 * Check on relevance. This check travels up the DOM looking for
 * parents that hold relevance expressions. All these expressions are
 * concatenated with an 'and' clause, so all must be relevant for the
 * control to be relevant.
 *
 * @param input Element to check
 * @param data jQuery data array
 */
jsf.Validator.prototype.checkRelevant = function(input, data) {

  var self = this;
  var relevant_expr = self.getExpression(input, 'relevant') || 'true';
  var parent_expr;

  input.parents("fieldset").each(function() {

    parent_expr = self.getExpression($(this), "relevant");

    if (parent_expr) {
      relevant_expr += " && (" + parent_expr + ")";
    }
  });

  if (!relevant_expr) {
    return true;
  }

  var relevant = self.eval(relevant_expr, data, true);

  self.relevantCallback(input, relevant);

  return relevant;
};


/**
 * Check whether input should be read-only
 * @param input Element to check
 * @param data jQuery data array
 */
jsf.Validator.prototype.checkReadonly = function(input, data) {

  var readonly_expr = this.getExpression(input, 'readonly');
   
  if (!readonly_expr) {
    return false;
  }

  var readonly = this.eval(readonly_expr, data, false);

  this.readonlyCallback(input, readonly);
};


/**
 * Check whether input value meets constraint
 * @param input Element to check
 * @param data jQuery data array
 * @param processErrors Do error handling or skip
 */
jsf.Validator.prototype.checkConstraint = function(input, data, processErrors) {

  var constraint_expr = this.getExpression(input, 'constraint');

  if (!constraint_expr) {
    return true;
  }

  var ok = this.eval(constraint_expr, data, true);

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

  var calculate_expr = this.getExpression(input, 'calculate');

  if (!calculate_expr) {
    return true;
  }

  var value = this.eval(calculate_expr, data);

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


// Extend jQuery objects with the jsf function
$.fn.extend({jsf: function(options) { 
      this.each(function() {
        new jsf.Validator($(this), options);
      });
}});
