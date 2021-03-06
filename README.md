JSForms
=======

Summary
-------

JSForms (short: JSF) is an effort to do client side form validation in
a structured way. The project's aim is to save form designers from
writing custom JavaScript to do form validation. The way this is done
is by using HTML attributes in a separate namespace (jsf) to define
what is needed for a form to be valid. Definitions may involve complex
expressions to determine requiredness, relevance, constraints,
etc. This allows you to say for instance: 'education is required if
age is greater than 12' or 'job of partner is irrelevant if single is
true'. This provides quite a bit more flexibility in your forms than
just saying: 'this is required'. Read on for examples.


Usage
-----

The validation code is written as a jQuery plugin. Check the source
for some HTML examples and on what to include for different
setups. Note that with some smart CSS you can save yourself from all
kinds of trouble; the form will be validated at initialisation time,
so that classes for requiredness and the likes are auto-magically
added.

Requires jQuery. If you use Python expressions, requires Skulpt. Basic
use is like so, assuming you have downloaded the JSF code:

    <script src="http://code.jquery.com/jquery-1.10.1.min.js"></script>
    <script src="jsf.js"></script>
    <script>
      $(document).ready(function() {
        $("form").jsf();
       });
    </script>


Example (check the examples for JS includes, etc.):

    <form>

      <input type="text" name="foo" 
             jsf:required="true"
             jsf:relevant="true"
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

If you insist on using data attributes instead of the jsf namespace,
you can do that also:

    <form>

      <input type="text" name="foo" 
             data-jsf='{"required":"true","relevant":"false"}'
             />

    </form>

Please note that the value of _data-jsf_ needs to be valid JSON, so
the attribute value (an associative array) needs to be set with the
proper (single) quotes. Check out the example HTML files for more
elaborate examples.


Installation
------------

Install using bower:

    bower install jsforms

Or just download, and include jsf.js as in the example above.


Browser support
---------------

Should work in any modern browser with JavaScript enabled. No, that
does probably not include IE6. I didn't test; don't care.

FAQ
---

### Is it stable and ready for production?

No. Use at your own risk. You have the source, now don't you? It's
been used in a production system though, and no one died yet.


### Why use namespace attributes instead of 'data-' attributes?

1. I like this better.
2. It saves you from potential quote/double quote trouble.
3. JSF _does_ support the data-jsf variant too.


### Is JSF a security consideration?

Yes it is. Expressions are evaluated, so arbitrary code can be
executed. Your browser may explode, but only if you use IE.


### Does this make server side validation redundant?

No it doesn't. Those sympathising with the dark side may still POST
erroneous data to the server.


### Is this the One? The final solution to form validation?

Of course it is.


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
call-back functions, that add and remove classes on the input
elements. Call-back functions are user-configurable, so as to specify
what should happen.


### required ###

Requiredness means that some input needs to be filled by the user, for
the form to be valid. Defaults to false. The call-back function sets or
removes the class 'required'. If something is required and not filled
in, the class 'error' is set on the input element.

Example:

    <input type="text" jsf:required="True" name="foo" />
    <input type="text" jsf:required="foo == 45" name="bar" />


### relevant ###

Relevance means that an input is irrelevant for the form data. For
instance, when somebody fills in that the age is 5, than the question
for marital status is (very likely to be) irrelevant. Defaults to
true. The call-back sets or removes the class 'irrelevant'.

Example:

    <input type="text" name="age" />
    <input type="text" name="maritalstatus" jsf:relevant="age &gt; 8" />

Relevance may also be applied to complete field-sets, like so:

    <fieldset jsf:relevant="foo == 4">
    ...
    </fieldset>

This way you can show/hide sets of controls without specifying
relevance rules per control.


### readonly ###

Indicate that a variable is to be protected from writing. Defaults to
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
that JavaScript. Check the examples. Expressions are evaluated by an
interpreter, that can be plugged in to the validation mechanism. An
interpreter is specified by a 'eval' method, that takes an expression,
the context data and a default value:

    jsf.Interpreter(expr, data, def)

In case the expression fails to return a result, the default should be
returned. If you wish to write your own interpreter, for instance to
allow Perl expressions, copy pyjsf.js and start coding...

Expressions can use data from other inputs. Simply use the name of the
input in the expression:

    <input name="foo" />

    <input name="bar" jsf:required="foo == 23" />


Configure validation
--------------------

You can configure JSF as per your needs. Redefine any of the call-back
functions to change behavior (check jsf.js for functions named
xxxCallback).  All call-back methods use jsf.Validation.selectInput to
obtain the element to set/remove classes upon. Override this if your
inputs are embedded within div's or other elements. Example:

    $("form").jsf({
              selectInput: function(elt) { return elt.parent() }
         });
       });


Override the requiredCallback:

    $("form").jsf({
              requiredCallback: function(elt) { elt.append("<blink>!</blink>" }
         });
       });

You can also override classes that are set on requiredness, relevance, etc:

 * requiredClass
 * readonlyClass
 * constraintClass
 * irrelevantClass
 * errorClass

like so:

    $("form").jsf({
             errorClass: "aaaaaaaargh"
         });
       });


License
-------

BEER-WARE LICENSE

Version 666, July 2012

You can use this stuff and do whatever you like with it on the
following condition:

0. Would you ever be in a situation where you are able to offer
   us, or one of us, a beer, or if unavailable, an alcoholic 
   beverage of your choice, you must do so.

   Wyldebeast & Wunderliebe
