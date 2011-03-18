/*jsl:import View.js*/

/** Base class for HTML5 media elements

    @binding {String} src - The URL of the media.
    @binding {Number} currentTime - The current time position within the media
          clip. This does not automatically update while the clip plays.
    @binding {Number} volume - The volume for playing back the clip.
    @binding {boolean} autoplay - Should the clip begin playing automatically?
    @binding {boolean} controls - Should the media element display controls for
          manipulating the media clip.
    @binding {boolean} loop - When reaching the end of the clip, should the
          media element rewind and start over?
    @binding {boolean} playing - Is the media playing? Toggling this value will
          start and stop playback of the media.
 */
coherent.Media= Class.create(coherent.View, {

  exposedBindings: ['src', 'currentTime', 'volume', 'muted', 'autoplay', 'controls', 'loop', 'playing'],

  init: function()
  {
    this.base();
    
    if (this.initialVolume)
      this.setVolume(this.initialVolume);
    
    var node= this.node;

    this.__onendedHandler= Event.observe(node, 'ended', Event.handler(this, this.mediaDidEnd));
    this.__onplayHandler= Event.observe(node, 'play', Event.handler(this, this.mediaPlayingStateChanged));
    this.__onpauseHandler= Event.observe(node, 'pause', Event.handler(this, this.mediaPlayingStateChanged));
  },
  
  teardown: function()
  {
    var node= this.node;

    Event.stopObserving(node, 'ended', this.__onendedHandler);
    Event.stopObserving(node, 'play', this.__onplayHandler);
    Event.stopObserving(node, 'pause', this.__onpauseHandler);

    this.base();
  },
  
  isSupported: function()
  {
    return ("paused" in this.node);
  },
  
  pause: function()
  {
    var node= this.node;
    if (!node.paused)
      node.pause();
  },

  mediaPlayingStateUpdated: function()
  {
    this.forceChangeNotificationForKey('playing');
  },
  
  play: function()
  {
    this.node.play();
    this.forceChangeNotificationForKey('ended');
  },
  
  playing: function()
  {
    return !this.node.paused;
  },
  
  stop: function()
  {
    var node= this.node;
    node.currentTime = node.duration;
  },
  
  currentTime: function()
  {
    return this.node.currentTime;
  },
  
  setCurrentTime: function(newTime)
  {
    if (this.bindings.currentTime)
      this.bindings.currentTime.setValue(newTime);
    this.node.currentTime= newTime;
  },
  
  muted: function()
  {
    return this.node.muted;
  },

  setMuted: function(mute)
  {
    if (this.bindings.muted)
      this.bindings.muted.setValue(mute);

    this.node.muted = mute;
  },
  
  volume: function()
  {
    return this.node.volume;
  },
  
  setVolume: function(newVolume)
  {
    if (this.bindings.volume)
      this.bindings.volume.setValue(newVolume);

    this.node.volume = Math.min(1,newVolume);
  },
  
  mediaDidEnd: function(event)
  {
    this.forceChangeNotificationForKey('ended');
    this.forceChangeNotificationForKey('playing');
  },
  
  ended: function()
  {
    return this.node.ended;
  },
  
  autoplay: function()
  {
    return this.node.autoplay;
  },
  
  setAutoplay: function(newAutoplay)
  {
    if (this.bindings.autoplay)
      this.bindings.autoplay.setValue(newAutoplay);

    this.node.autoplay= newAutoplay;
  },
  
  controls: function()
  {
    return this.node.controls;
  },
  
  setControls: function(newControls)
  {
    if (this.bindings.controls)
      this.bindings.controls.setValue(newControls);

    this.node.controls= newControls;
  },
  
  loop: function()
  {
    return this.node.loop;
  },
  
  setLoop: function(newLoop)
  {
    if (this.bindings.loop)
      this.bindings.loop.setValue(newLoop);

    this.node.loop= newLoop;
  },
  
  src: function()
  {
    return this.node.src;
  },
  
  setSrc: function(newSrc)
  {
    if (this.bindings.src)
      this.bindings.src.setValue(newSrc);

    var node= this.node;
  
    node.src= newSrc;
    node.load();
    this.forceChangeNotificationForKey('ended');
  }
  
});
