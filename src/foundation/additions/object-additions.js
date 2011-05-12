/*jsl:import ../../foundation.js*/

/**
  Object.clone(obj) -> Object

  - obj (Object): The object to clone

  Make a shallow-copy clone of an object. Modifications are copy-on-write.
  Note, because this is a shallow copy, only properties actually on the cloned
  object will be copy-on-write. For example, if you clone foo into bar and
  then change bar.baz.foo, the change will propagate to the original, foo.
 */
Object.clone = function(obj)
{
  var fn = function(){};
  fn.prototype = obj;
  return new fn();
}

/** 
  Object.get([context,] path) -> Any

  - context (Object): If specified, this is the object from which the value
    should be extracted. If not specified, the value is extracted relative to
    the global object.

  - path (String): A key path with property names separated by dots.

  Simple way to find an object using its property path.
 */
Object.get = function(context, path)
{
  if ('string' === typeof(context) && void(0) == path)
  {
    path = context;
    context = coherent.global;
  }

  var parts = path.split('.');
  var p;

  for (var i = 0; context && (p = parts[i]); ++i)
    context = context[p];
  return context;
}

/**
  Object.applyDefaults(obj, defaults) -> Object

  - obj (Object): The original object to update with default values
  - defaults (Object): The source of the default values that will be copied to
    the `obj` parameter.

  Update an object with default values for the properties of `defaults`. This
  function will not overwrite properties already in `obj`.

  The return value is the same as the `obj` parameter.
 */
Object.applyDefaults = function(obj, defaults)
{
  obj = obj || {};

  if (!defaults)
    return obj;

  for (var p in defaults)
  {
    if (p in obj)
      continue;
    obj[p] = defaults[p];
  }
  return obj;
}

/**
  Object.extend(obj, extensions) -> Object

  - obj (Object): An object to update with the values of extensions.
  - extensions (Object): An object containing properties to copy to `obj`.

  This function will copy the values all the properties of `extensions` to `obj`
  and will overwrite any previous values for those properties. To only copy
  properties if they don't already exist, see [Object.applyDefaults].

  This function returns the `obj` parameter.
 */
Object.extend = function(obj, extensions)
{
  obj = obj || {};

  for (var p in extensions)
    obj[p] = extensions[p];

  return obj;
}

/**
  Object.markMethods(obj[, prefix)

  - obj (Object): The object which should have its methods named.
  - prefix (String): An optional prefix to apply to the method names. This can
    be helpful when marking static methods of a class.

  Mark all methods within an object. This takes advantage of the `displayName`
  property on functions (introduced with WebKit) to provide more meaningful
  names in the debugger and profiler.

  This function iterates over all the properties of an object, and for each
  property with a function value, assigns its `displayName` property to the
  name of the property. If a prefix was specified, it will be prepended to
  the name of the property.

  It isn't necessary to call `markMethods` when defining a class, because
  [Class.create] includes this functionality.
 */
Object.markMethods = function(obj, prefix)
{
  var v;
  prefix = prefix ? (prefix + '.') : '';

  for (var p in obj)
  {
    v = obj[p];
    if ('function' === typeof(v))
      v.displayName = prefix + p;
  }
}

/**
  Object.merge(...) -> Object

  This function creates a new object, then for each object passed in the
  arguments, the function iterates over the properties of that object and copies
  the value of the property to the return value.
 */
Object.merge = function()
{
  var o = {},
      numberOfObjects = arguments.length,
      prop, index, obj;

  for (index = 0; index < numberOfObjects; ++index)
  {
    obj = arguments[index];
    if ('object' != typeof(obj))
      throw new InvalidArgumentError('Arguments to Object.merge must be objects. Invalid argument @ index ' + index);
    for (prop in obj)
      o[prop] = obj[prop];
  }

  return o;
}

/** Query string handling extensions to Object.
 */
;
(function()
{

  var typesToExclude = {
        file: 1,
        submit: 1,
        image: 1,
        reset: 1,
        button: 1
      };
  var genericObject = {};

  function setValue(object, name, value)
  {
    var previousValue = object[name];
    var previousType = coherent.typeOf(previousValue);

    if ('string' === previousType)
      object[name] = [previousValue, value];
    else if ('array' === previousType)
      previousValue.push(value);
    else
      object[name] = value;
  }

  function fromFormVisitNode(node)
  {
    var name = node.name;
    var type = (node.type || '').toLowerCase();

    if (node.disabled || type in typesToExclude)
      return;

    if ('radio' === type || 'checkbox' === type)
    {
      if (node.checked)
        setValue(this, name, node.value);
    }
    else if (node.multiple)
    {
      function visitOption(option)
      {
        if (option.selected)
          setValue(this, name, option.value);
      }
      this[name] = [];
      Array.forEach(node.options, visitOption, this);
    }
    else
    {
      setValue(this, name, node.value);
      if ('image' === type)
      {
        setValue(this, name + '.x', 0);
        setValue(this, name + '.y', 0);
      }
    }
  }

  /** Create a new object from the fields in a form. This will not include the
    values of any buttons. If there are multiple fields with the same name,
    their values will be collected into an array.
  
    @param {Form} node - A DOM Form element that should be scanned to
         determine the values for the new object.
    @returns {Object} A new object with properties corresponding to the
         fields of the form.
   */
  Object.fromForm = function(node)
  {
    var object = {};
    Array.forEach(node.elements, fromFormVisitNode, object);
    return object;
  };

  function fromQueryStringProcessPair(pair)
  {
    pair = pair.split('=');
    if (1 === pair.length)
      return;

    var key = decodeURIComponent(pair[0].trim());
    var value = decodeURIComponent(pair[1].trim()) || null;

    setValue(this, key, value);
  }

  /** Convert the URL encoded query string into an object. This method
    considers the value after the equal sign to be a literal value and will
    not interpret it at all. However, if the same key appears multiple times,
    the values will be collected in an array and added to the result.
  
    For example:
  
      var query= "abc=123&zebra=456&zebra=789&foo=bar";
      var obj= Object.fromQueryString(query);
  
    The value of obj would be:
  
      {
        abc: 123,
        zebra: [456, 789],
        foo: "bar"
      }
  
    It is possible to create an object where the keys are not valid
    identifiers. In that case, it is necessary to access them via the index
    operator rather than directly.
  
    @param {String} query - The URL encoded query string (with or without the
         ? at the beginning).
    @returns {Object} A new object representing the keys and values in the
         query string.
   */
  Object.fromQueryString = function(query)
  {
    if ("?" == query.charAt(0))
      query = query.slice(1);

    query = query.split(/\s*&\s*/);

    var object = {};

    query.forEach(fromQueryStringProcessPair, object);
    return object;
  };

  /** Create a query string from an object. This method expects the object to
    be largely flat and will only perform special processing for property
    values that are arrays. In the case of arrays, each value of the array
    will be added with the same key. For example:
  
      var test= {
        abc: 123,
        zebra: [456, 789],
        foo: "bar"
      };
  
      var query= Object.toQueryString(test);
  
    The value of query will be:
  
      abc=123&zebra=456&zebra=789&foo=bar
  
    The behaviour of `Object.toQueryString` for values that aren't strings or
    numbers should be locked down, but is currently undefined.
  
    @param {Object} obj - The object to convert into a query string.
    @returns {String} The query string representation of the obj parameter.
   */
  Object.toQueryString = function(obj)
  {
    if (!obj)
      return "";

    var key;
    var value;
    var typeOfValue;
    var args = [];

    /** Add a value to the args array. Assumes key has already been
      encoded using encodeURIComponent.
     */

    function addValue(value)
    {
      if (null !== value && 'undefined' !== typeof(value))
        value = encodeURIComponent(value);
      else
        value = '';

      if (value)
        args.push(key + '=' + value);
      else
        args.push(key);
    }

    for (key in obj)
    {
      value = obj[key];
      typeOfValue = coherent.typeOf(value);

      //  skip properties defined on Object
      if ('function' === typeOfValue || value === genericObject[key])
        continue;

      key = encodeURIComponent(key);
      if ('array' === typeOfValue)
        value.forEach(addValue);
      else
        addValue(value);
    }

    return args.join("&");
  };

})();

Object.markMethods(Object, 'Object');
