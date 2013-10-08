JSForms
=======

Intro
-----

JSForms (short: JSF) is an effort to do client side validation in a
structured way. The project's aim is to save form designers from
writing custom JavaScript to do form validation. The way this is done
is by using HTML attributes in a separate namespace: jsf.


Usage
-----

Check the source for some HTML examples. Note that with some smart CSS
you can save yourself from all kinds of trouble. The form will be
validated at init time, so that classes for requiredness and the likes
are automagically added.

Requires jQuery. If you use Python expressions, requires Skulpt.

Example (check the examples for JS includes, etc.):

    <form>

      <input type="text" name="foo" 
             jsf:required="True"
             jsf:relevant="True"
             />

      <input type="text" name="bar" 
             jsf:required="foo == 666" 
             jsf:relevant="foo &gt; 12"
             />

      <input type="text" name="zzz" 
             jsf:readonly="foo == 4"
             jsf:constraint="zzz &gt; 23"
             />

      <input type="submit" value="ok" />
    </form>



Validation
----------

Any form that is set up for validation with JSF is checked using
several attributes, that take an expression as their
value. Expressions can be written in JavaScript, but also in
Python. Really? Yes, really. The following attributes are supported:

 * required
 * relevant
 * readonly
 * calculate
 * constraint

Does this remind you somehow of XForms? Well, how odd... A form is
considered to be valid if all constraints are met, and no required
fields have not been filled. Validation will be done on every change
event, to be able to show results to the user. This is performed by
callback functions, that add and remove classes on the input
elements. Callback functions are user-configurable, so as to specify
what should happen.


### required ###

Requiredness means that some input needs to be filled by the user, for
the form to be valid. Defaults to false. The callback function sets or
removes the class 'required'. If something is required and not filled
in, the class 'error' is set on the input element.

Example:

    <input type="text" jsf:required="True" name="foo" />
    <input type="text" jsf:required="foo == 45" name="bar" />


### relevant ###

Relevance means that an input is irrelevant for the form data. For
instance, when somebody fills in that the age is 5, than the question
for marital status is (very likely to be) irrelevant. Defaults to
true. The callback sets or removes the class 'irrelevant'.

Example:

    <input type="text" name="age" />
    <input type="text" name="maritalstatus" jsf:relevant="age &gt; 8" />


### readonly ###

Indicate that a variabel is to be protected from writing. Defaults to
false. Toggles the class 'readonly'.

Example:

    <input type="text" name="age" jsf:readonly="True" />


### calculate ###

Calculate the field's value.

Example:

    <input type="text" name="amount" />
    <input type="text" name="tax_percentage" />
    <input type="text" name="total" 
      jsf:calculate="(amount / 100) * tax_percentage "/> 


### constraint ###

Constrain value of a given input. Toggles the class 'error' on the input.

Example:

    <input type="text" name="amount" jsf:constraint="amount &lt; 10000" />


Expressions
-----------

Expressions can be either written in JavaScript or in Python. The
latter uses Skulpt for running Python code, so make sure to include
that JavaScript. Check the examples. An interpreter is specified by a
'eval' method, that takes an expression, the context data and a
default value:

    jsf.Interpreter(expr, data, def)

In case the expression fails to return a result, the default should be
returned. If you wish to write your own interpreter, for instance to
allow Perl expressions, copy pyjsf.js and start coding...


Configure validation
--------------------

You can configure the validation as per your needs. Redefine any of
the callback functions to change behaviour (check jsf.js).  All
callback methods use jsf.Validation.selectInput to obtain the element
to set/remove classes upon. Override this if your inputs are embedded
within div's or other elements. Example:

    $("form").jsf({
              selectInput: function(elt) { return elt.parent() }
         });
       });
