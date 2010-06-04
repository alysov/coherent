/*jsl:import TextField.js*/

/** A specialisation of the TextField used for searching/filtering an
    ArrayController. In addition to the bindings exposed by TextFields, the
    SearchField exposes the `predicate` binding. The value of the predicate
    binding is a filter  function.
    
    In addition to specifying a predicateKeyPath on the HTML tag, you _must_
    specify a `predicate` attribute that is the key path to use in comparisons.
    
    A SearchField will be created for any `input` element with `type=="search"`
    regardless of whether the browser supports native search input elements.
  
    @TODO: The predicate attribute _really_ ought to be a full predicate def.
 */
coherent.SearchField= Class.create(coherent.TextField, {

  exposedBindings: ['predicate'],
  
  onfocus: function(event)
  {
    var view= this.node;
    Event.stopObserving(view, 'search', this.__searchHandler);
    this.__searchHandler= Event.observe(view, 'search', this.onchange.bind(this));
  },
  
  onblur: function(event)
  {
    Event.stopObserving(this.node, 'search', this.__searchHandler);
  },
  
  /** Search views should send updates sooner than regular input views.
   */
  keypressUpdateTimeout: 25,
  
  /** Overridden valueChanged method from TextField, in addition to
      performing the base TextField tasks, this method creates a new filter
      predicate and updates any observers of the predicate binding.
   */
  onchange: function(event)
  {
    //  chain to parent handler
    this.base(event);
    if (this.bindings.predicate)
      this.bindings.predicate.setValue(this.createFilterPredicate());
  },
  
  /** Create a filter predicate function that will determine whether the value
      specified by the predicate key path contains the text in the search field.
      
      @returns a function which will match a keypath on KVO compliant objects
           with the value in this field.
   */
  createFilterPredicate: function()
  {
    var view= this.node;
    var keyPath= this.predicate;
    var value= view.value.toLowerCase();
  
    function fn(obj)
    {
      var v= obj.valueForKeyPath(keyPath);
      if (!v)
        return !!value;
      if (v.toLocaleString)
        v= v.toLocaleString();
      else
        v= v.toString();
      v= v.toLowerCase();
      return (-1!==v.indexOf(value));
    }

    return fn;
  },
  
  /** Callback for observing changes to the bound predicate. This is empty because
      the search view really doesn't update itself based on the predicate.
    
      @TODO: what should _really_ be done here?
   */
  observePredicateChange: function(change)
  {
  }

});
