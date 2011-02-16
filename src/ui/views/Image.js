/*jsl:import View.js*/


/**
  A View for images. In addition to the bindings exposed by Views,
  coherent.Images have a src binding that represents the URL of the
  image to display. Images also have a width and height binding to
  reflect those properties as well.

  Like TextFields, coherent.Images have placeholder values for invalid
  values. These placeholders should be URLs to the appropriate image to
  display under those circumstances. The default values are empty, so no image
  will be displayed.

  @binding {String} src - The URL to display in this Image.
  @binding {String} alt - Text to display when the visitor hovers over the image.
  @binding {Number} width - The width of the view. The actual image is scaled to
        fit this width.
  @binding {Number} height - The height of the view. The actual image is scaled
        to fit this height.
 */
coherent.Image = Class.create(coherent.View, {

  exposedBindings: ['src', 'alt', 'width', 'height'],
  maskedBindings: ['text', 'html'],

  init: function()
  {
    this.base();

    var node = this.node;

    //  If the src for the image is either not bound or not initialised from
    //  the DOM, and no default placeholders have been specified for this image,
    //  use the src value for the null value, no selection placeholders.
    if ((!this.bindings.src || !this.bindings.src.initFromDOM) && (!this.defaultPlaceholders.src && node.src))
    {
      this.defaultPlaceholders.src = {
        nullValue: node.src,
        noSelection: node.src
      };
    }
  },

  teardown: function()
  {
    var node = this.node;
    Event.stopObserving(node, 'load', this.__onloadHandler);
    Event.stopObserving(node, 'error', this.__onerrorHandler);

    this.base();
  },

  onload: function()
  {
    var node = this.node;
    this.setValueForKey(false, 'loading');
    Element.removeClassName(node, coherent.Style.kLoadingClass);

    Event.stopObserving(node, 'load', this.__onloadHandler);
    Event.stopObserving(node, 'error', this.__onerrorHandler);
  },

  onerror: function()
  {
    var node = this.node;
    this.setValueForKey(false, 'loading');

    Element.updateClass(node, coherent.Style.kInvalidValueClass, coherent.Style.kLoadingClass);

    Event.stopObserving(node, 'load', this.__onloadHandler);
    Event.stopObserving(node, 'error', this.__onerrorHandler);
  },

  src: function()
  {
    var src;
    
    if ("IMG" !== node.tagName)
    {
      src= node.style.backgroundImage;
      if (!src)
        return null;
      src= src.slice(4,-1);
      var c= src.charAt(0);
      if ('"'===c || "'"===c)
        src= src.slice(1, -1);
      return src;
    }
    src = this.node.src;
    return ('about:blank' === src) ? null : src;
  },

  setSrc: function(newSrc)
  {
    if (this.bindings.src)
      this.bindings.src.setValue(newSrc);

    if (!newSrc)
      newSrc = 'about:blank';

    var node = this.node;

    if ("IMG" !== node.tagName)
    {
      node.style.backgroundImage = "url(" + newSrc + ")";
      return;
      // Can't observe load events on background images, so none of the below
      // logic should matter.
    }

    var originalSrc = node.src;

    /*  Because Safari 3 & 4 don't fire the onload event if the new src is
      the same as the previous src (see <rdar://problem/6660795>) and the
      image ought to come out of the cache anyway, I'll skip updating the
      node if the image src hasn't changed. The previous version set the
      source and then immediately fired the onload handler.
     */
    if (originalSrc === newSrc)
      return;

    this.setValueForKey(true, 'loading');

    Element.updateClass(node, coherent.Style.kLoadingClass, coherent.Style.kInvalidValueClass);

    Event.stopObserving(node, 'load', this.__onloadHandler);
    Event.stopObserving(node, 'error', this.__onerrorHandler);
    this.__onloadHandler = Event.observe(node, 'load', this.onload.bind(this));
    this.__onerrorHandler = Event.observe(node, 'error', this.onerror.bind(this));

    node.src = newSrc;
  },

  observeSrcChange: function(change)
  {
    var node = this.node;
    var markerType = this.bindings.src && this.bindings.src.markerType;

    if (markerType)
      Element.addClassName(node, coherent.Style.kMarkerClass);
    else
      Element.removeClassName(node, coherent.Style.kMarkerClass);

    this.setSrc(change.newValue);
  },

  width: function()
  {
    return parseInt(this.node.width, 10);
  },

  setWidth: function(newWidth)
  {
    var node = this.node;
    var width = parseInt(newWidth, 10);

    if (isNaN(width))
      node.removeAttribute('width');
    else
      node.width = width;
  },

  height: function()
  {
    return parseInt(this.node.height, 10);
  },

  setHeight: function(newHeight)
  {
    var node = this.node;
    var height = parseInt(newHeight, 10);

    if (isNaN(height))
      node.removeAttribute('height');
    else
      node.height = height;
  },

  alt: function()
  {
    return this.node.alt;
  },

  setAlt: function(newAlt)
  {
    this.node.alt = (newAlt || '');
  }

});
